/**
 * HERA Playbook Adapter - Strangler Fig Pattern
 * 
 * This adapter enables gradual migration from direct database operations
 * to playbook-based procedures without changing the UI layer.
 */

import { createServerClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

// Create supabase client helper
const createSupabaseServerClient = createServerClient

// Correlation ID generation
export function generateCorrelationId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  const shortUuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `WF-${timestamp}-${shortUuid}-${sequence}`
}

export interface PlaybookResult<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    correlation_id: string
    execution_time_ms: number
    procedure_version?: string
    idempotency_key?: string
  }
}

export interface PlaybookOptions {
  idempotencyKey?: string
  organizationId?: string
  userId?: string
  timeout?: number
  correlationId?: string
}

/**
 * Execute a HERA procedure/playbook
 */
export async function runPlaybook<T = any>(
  smartCode: string,
  payload: any,
  opts: PlaybookOptions = {}
): Promise<PlaybookResult<T>> {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  
  console.log('[PLAYBOOK] Creating Supabase client for:', smartCode)
  
  // 1. Normalize smart code format (.v1 → .V1)
  const normalizedSmartCode = smartCode.toUpperCase().replace(/\.V(\d+)$/i, '.V$1')
  
  // 2. Generate or use correlation ID
  const correlationId = opts.correlationId || generateCorrelationId()
  
  // 3. Generate idempotency key if not provided
  const idempotencyKey = opts.idempotencyKey || 
    createHash('sha256')
      .update(`${normalizedSmartCode}-${JSON.stringify(payload)}-${opts.organizationId || 'default'}`)
      .digest('hex')
      .substring(0, 16)
  
  // 4. Convert smart code to procedure name
  // HERA.SALON.POS.CART.REPRICE.V1 → hera_salon_pos_cart_reprice_v1
  const procedureName = normalizedSmartCode.toLowerCase().replace(/\./g, '_')
  
  // 5. Prepare procedure payload with context
  const procedurePayload = {
    ...payload,
    _context: {
      organization_id: opts.organizationId || payload.organization_id,
      user_id: opts.userId || payload.user_id,
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
      request_source: 'playbook_adapter',
      smart_code: normalizedSmartCode
    }
  }
  
  try {
    // 6. Handle specific procedures inline until full orchestration engine is integrated
    let data: any = null
    let error: any = null
    
    if (normalizedSmartCode === 'HERA.UNIV.TXN.HEADER.CREATE.V1') {
      try {
        const { organization_id, header_smart_code, relationships, dynamic } = procedurePayload
        
        // Determine transaction type from smart code
        let transactionType = 'sale' // default
        let transactionCodePrefix = 'TXN'
        
        if (header_smart_code.includes('.POS.CART.')) {
          transactionType = 'sale' // Use 'sale' for carts as per HERA standard
          transactionCodePrefix = 'CART'
        } else if (header_smart_code.includes('.APT.') || header_smart_code.includes('.APPOINTMENT.')) {
          transactionType = 'appointment'
          transactionCodePrefix = 'APT'
        }
        
        // Create transaction
        const { data: transaction, error: createError } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id,
            transaction_type: transactionType,
            transaction_code: `${transactionCodePrefix}-${Date.now()}`,
            smart_code: header_smart_code,
            transaction_date: new Date().toISOString(),
            total_amount: 0,
            metadata: {
              ...dynamic,
              state: 'ACTIVE', // Add state for carts
              created_via: 'HERA.UNIV.TXN.HEADER.CREATE.V1',
              created_at: new Date().toISOString(),
              correlation_id: correlationId,
              idempotency_key: idempotencyKey
            }
          })
          .select()
          .single()
        
        if (createError) {
          error = createError
        } else {
          // Create relationships if provided
          if (relationships && Object.keys(relationships).length > 0) {
            for (const [relType, relData] of Object.entries(relationships)) {
              if (relData && typeof relData === 'object' && 'id' in relData) {
                await supabase
                  .from('core_relationships')
                  .insert({
                    organization_id,
                    from_entity_id: transaction.id,
                    to_entity_id: relData.id,
                    relationship_type: relType,
                    smart_code: `HERA.UNIV.REL.${relType.toUpperCase()}.V1`,
                    metadata: {
                      entity_type: (relData as any).type,
                      created_via: 'HERA.UNIV.TXN.HEADER.CREATE.V1'
                    }
                  })
              }
            }
          }
          
          data = { 
            transaction,
            metadata: transaction.metadata,
            relationships_created: relationships ? Object.keys(relationships).length : 0
          }
        }
      } catch (e: any) {
        error = { message: e.message || 'Unknown error in procedure execution' }
      }
    } else if (normalizedSmartCode === 'HERA.UNIV.TXN.LINE.ADD.V1') {
      try {
        const { organization_id, transaction_id, line_smart_code, entity_id, qty, unit_price, dynamic } = procedurePayload
        
        console.log('[PLAYBOOK] Adding line:', {
          organization_id,
          transaction_id,
          entity_id,
          qty,
          unit_price,
          line_smart_code
        })
        
        // Check for existing idempotency execution
        if (idempotencyKey) {
          const { data: existingExecutions } = await supabase
            .from('universal_transactions')
            .select('metadata')
            .eq('organization_id', organization_id)
            .eq('transaction_type', 'procedure_execution')
            .eq('smart_code', 'HERA.UNIV.EXEC.LINE.ADD.V1')
            .eq('transaction_status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10)
          
          // Filter by idempotency key manually
          const existingExecution = existingExecutions?.find(
            exec => exec.metadata?.idempotency_key === idempotencyKey
          )
          
          if (existingExecution?.metadata?.result) {
            console.log('[PLAYBOOK] Returning cached line add result for idempotency key:', idempotencyKey)
            data = existingExecution.metadata.result
            return {
              success: true,
              data: data as T,
              metadata: {
                correlation_id: correlationId,
                execution_time_ms: Date.now() - startTime,
                idempotency_key: idempotencyKey,
                cached: true
              }
            }
          }
        }
        
        // Get highest line number for next line number
        const { data: existingLines, error: countError } = await supabase
          .from('universal_transaction_lines')
          .select('line_number')
          .eq('transaction_id', transaction_id)
          .eq('organization_id', organization_id)
          .order('line_number', { ascending: false })
          .limit(1)
        
        if (countError) {
          console.error('[PLAYBOOK] Error getting max line number:', countError)
        }
        
        const maxLineNumber = existingLines?.[0]?.line_number || 0
        const lineNumber = maxLineNumber + 1
        const quantity = qty || 1
        const price = unit_price || 0
        const lineAmount = quantity * price
        
        // Determine line type from smart code
        let lineType = 'standard'
        if (line_smart_code.includes('.PRODUCT.')) {
          lineType = 'product'
        } else if (line_smart_code.includes('.SERVICE.') || line_smart_code.includes('.SVC.')) {
          lineType = 'service'
        } else if (line_smart_code.includes('.DISCOUNT.')) {
          lineType = 'discount'
        }
        
        const insertData = {
          organization_id,
          transaction_id,
          entity_id: entity_id,  // Correct column name
          line_type: lineType,   // Required field
          line_number: lineNumber,
          quantity,
          unit_amount: price,    // Correct column name  
          line_amount: lineAmount,
          smart_code: line_smart_code,
          line_data: {
            ...dynamic,
            created_via: 'HERA.UNIV.TXN.LINE.ADD.V1',
            created_at: new Date().toISOString()
          }
        }
        
        console.log('[PLAYBOOK] Inserting line data:', insertData)
        
        // Create transaction line
        const { data: line, error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert(insertData)
          .select()
          .single()
        
        if (lineError) {
          console.error('[PLAYBOOK] Error inserting line:', lineError)
          error = lineError
        } else {
          console.log('[PLAYBOOK] Line created successfully:', line)
          data = { 
            line,
            line_id: line.id,
            transaction_id
          }
          
          // Log execution for idempotency
          if (idempotencyKey) {
            const { error: logError } = await supabase
              .from('universal_transactions')
              .insert({
                organization_id,
                transaction_type: 'procedure_execution',
                transaction_code: `LINE-ADD-${line.id}-${Date.now()}`,
                smart_code: 'HERA.UNIV.EXEC.LINE.ADD.V1',
                total_amount: 0,
                transaction_status: 'completed',
                metadata: {
                  procedure: 'HERA.UNIV.TXN.LINE.ADD.V1',
                  transaction_id,
                  line_id: line.id,
                  idempotency_key: idempotencyKey,
                  execution_time_ms: Date.now() - startTime,
                  result: data
                }
              })
            
            if (logError) {
              console.error('[PLAYBOOK] Failed to log execution for idempotency:', logError)
            } else {
              console.log('[PLAYBOOK] Logged execution for idempotency key:', idempotencyKey)
            }
          }
        }
      } catch (e: any) {
        console.error('[PLAYBOOK] Exception in line add:', e)
        error = { message: e.message || 'Unknown error adding line' }
      }
    } else if (normalizedSmartCode === 'HERA.UNIV.TXN.LINE.UPDATE.V1') {
      try {
        const { organization_id, transaction_id, line_id, patch } = procedurePayload
        
        // Build update object
        const updates: any = {}
        if (patch.quantity !== undefined) {
          updates.quantity = patch.quantity
          // Recalculate line amount if we have the unit price
          const { data: existingLine } = await supabase
            .from('universal_transaction_lines')
            .select('unit_amount')
            .eq('id', line_id)
            .eq('organization_id', organization_id)
            .single()
          
          if (existingLine) {
            updates.line_amount = patch.quantity * existingLine.unit_amount
          }
        }
        if (patch.unit_price !== undefined) {
          updates.unit_amount = patch.unit_price  // Correct column name
          // Recalculate line amount
          const { data: existingLine } = await supabase
            .from('universal_transaction_lines')
            .select('quantity')
            .eq('id', line_id)
            .eq('organization_id', organization_id)
            .single()
          
          if (existingLine) {
            updates.line_amount = existingLine.quantity * patch.unit_price
          }
        }
        if (patch.dynamic) {
          updates.line_data = patch.dynamic
        }
        
        // Update line
        const { data: line, error: updateError } = await supabase
          .from('universal_transaction_lines')
          .update(updates)
          .eq('id', line_id)
          .eq('organization_id', organization_id)
          .eq('transaction_id', transaction_id)
          .select()
          .single()
        
        if (updateError) {
          error = updateError
        } else {
          data = { line, transaction_id }
        }
      } catch (e: any) {
        error = { message: e.message || 'Unknown error updating line' }
      }
    } else if (normalizedSmartCode === 'HERA.UNIV.TXN.LINE.REMOVE.V1') {
      try {
        const { organization_id, transaction_id, line_id } = procedurePayload
        
        // Remove line
        const { error: deleteError } = await supabase
          .from('universal_transaction_lines')
          .delete()
          .eq('id', line_id)
          .eq('organization_id', organization_id)
          .eq('transaction_id', transaction_id)
        
        if (deleteError) {
          error = deleteError
        } else {
          data = { 
            removed: true,
            line_id,
            transaction_id
          }
        }
      } catch (e: any) {
        error = { message: e.message || 'Unknown error removing line' }
      }
    } else if (normalizedSmartCode === 'HERA.SALON.CONFIG.READ.V1') {
      try {
        const { organization_id, section } = procedurePayload
        
        // Find or create org_config anchor entity
        let { data: configEntity, error: configError } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('entity_type', 'org_config')
          .eq('entity_name', 'Salon Settings')
          .single()
        
        if (configError || !configEntity) {
          // Create the config entity
          const { data: newEntity, error: createError } = await supabase
            .from('core_entities')
            .insert({
              organization_id,
              entity_type: 'org_config',
              entity_name: 'Salon Settings',
              entity_code: 'SALON_CONFIG',
              smart_code: 'HERA.SALON.CONFIG.ENT.ANCHOR.V1',
              metadata: {
                created_via: 'HERA.SALON.CONFIG.READ.V1',
                sections: ['general', 'pos', 'appointment', 'commission', 'inventory', 'membership', 'whatsapp', 'hardware', 'workflows', 'feature_flags']
              }
            })
            .select('id')
            .single()
          
          if (createError) {
            error = createError
          } else {
            configEntity = newEntity
          }
        }
        
        if (configEntity && !error) {
          // Load all dynamic data for this config entity
          const { data: dynamicData, error: dynamicError } = await supabase
            .from('core_dynamic_data')
            .select('field_name, field_value_text, field_value_number, field_value_boolean, field_value_json')
            .eq('organization_id', organization_id)
            .eq('entity_id', configEntity.id)
            .like('field_name', 'salon.settings.%')
          
          if (dynamicError) {
            error = dynamicError
          } else {
            // Build merged settings with defaults
            const defaultSettings = {
              general: {
                display_name: "General",
                keys: {
                  salon_name: "Hair Talkz",
                  timezone: "Europe/London",
                  currency: "GBP",
                  locale: "en-GB"
                }
              },
              pos: {
                display_name: "POS Policies",
                keys: {
                  vat_profile: "UK_VAT_STANDARD",
                  price_includes_tax: false,
                  tip_enabled: true,
                  tip_methods: ["cash", "card"],
                  rounding_mode: "BANKERS_2DP",
                  discount_cap_percent: 50,
                  auto_reprice_debounce_ms: 180
                }
              },
              appointment: {
                display_name: "Appointment Defaults",
                keys: {
                  default_duration_min: 45,
                  buffer_min: 10,
                  allow_overbook: false,
                  no_show_fee_amount: 15.00,
                  auto_status_on_checkin: "IN_PROGRESS",
                  reminder_minutes_before: [1440, 120]
                }
              },
              commission: {
                display_name: "Commission Rules",
                keys: {
                  base: "AFTER_DISCOUNTS_BEFORE_TAX",
                  default_rate_percent: 20,
                  role_overrides: {
                    stylist: 25,
                    colorist: 22
                  }
                }
              },
              inventory: {
                display_name: "Inventory",
                keys: {
                  soft_reservation_expiry_min: 30,
                  decrement_on: "SALE_COMMIT",
                  returns_restock_policy: "PUT_BACK_IF_SELLABLE"
                }
              },
              membership: {
                display_name: "Membership",
                keys: {
                  tiers: ["GOLD", "SILVER", "BRONZE"],
                  default_tier: "BRONZE",
                  discount_map: {
                    GOLD: 20,
                    SILVER: 15,
                    BRONZE: 10
                  },
                  grace_days: 7,
                  auto_renewal: true
                }
              },
              whatsapp: {
                display_name: "WhatsApp",
                keys: {
                  sender_id: "HAIR_TALKZ_BSP",
                  daily_send_cap: 500,
                  template_defaults: {
                    APPT_FOLLOWUP: { enabled: true },
                    PROMO_MEDIA: { enabled: true }
                  }
                }
              },
              hardware: {
                display_name: "Hardware",
                keys: {
                  printer_ip: "192.168.1.50",
                  drawer_kick_code: "27,112,0,25,250",
                  barcode_prefix_map: { loyalty: "LTY-", product: "SKU-" }
                }
              },
              workflows: {
                display_name: "Workflow Toggles",
                keys: {
                  enable_followup_after_sale: true,
                  enable_leave_approval: true,
                  enable_membership_renewal: true
                }
              },
              feature_flags: {
                display_name: "Feature Flags",
                keys: {
                  playbook_mode: {
                    pos_cart: true,
                    pos_lines: false,
                    checkout: false,
                    appointments: false,
                    whatsapp: true,
                    returns: false,
                    calendar: false
                  }
                }
              }
            }
            
            // Merge with saved data
            const mergedSettings = JSON.parse(JSON.stringify(defaultSettings))
            
            if (dynamicData) {
              for (const row of dynamicData) {
                // field_name format: salon.settings.{section}.{key}
                const parts = row.field_name.split('.')
                if (parts.length >= 4 && parts[0] === 'salon' && parts[1] === 'settings') {
                  const sectionName = parts[2]
                  const keyName = parts.slice(3).join('.')
                  
                  if (mergedSettings[sectionName]) {
                    const value = row.field_value_json || 
                                  row.field_value_text || 
                                  row.field_value_number || 
                                  row.field_value_boolean
                    
                    if (value !== null) {
                      mergedSettings[sectionName].keys[keyName] = value
                    }
                  }
                }
              }
            }
            
            // Return specific section or all sections
            if (section) {
              data = { [section]: mergedSettings[section] || null }
            } else {
              data = { sections: mergedSettings }
            }
          }
        }
      } catch (e: any) {
        error = { message: e.message || 'Unknown error in config read' }
      }
    } else if (normalizedSmartCode === 'HERA.SALON.CONFIG.UPSERT.V1') {
      try {
        const { organization_id, section, patch } = procedurePayload
        
        // Find or create org_config anchor entity
        let { data: configEntity, error: configError } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('entity_type', 'org_config')
          .eq('entity_name', 'Salon Settings')
          .single()
        
        if (configError || !configEntity) {
          // Create the config entity
          const { data: newEntity, error: createError } = await supabase
            .from('core_entities')
            .insert({
              organization_id,
              entity_type: 'org_config',
              entity_name: 'Salon Settings',
              entity_code: 'SALON_CONFIG',
              smart_code: 'HERA.SALON.CONFIG.ENT.ANCHOR.V1',
              metadata: {
                created_via: 'HERA.SALON.CONFIG.UPSERT.V1',
                sections: ['general', 'pos', 'appointment', 'commission', 'inventory', 'membership', 'whatsapp', 'hardware', 'workflows', 'feature_flags']
              }
            })
            .select('id')
            .single()
          
          if (createError) {
            error = createError
          } else {
            configEntity = newEntity
          }
        }
        
        if (configEntity && !error) {
          // Upsert each key in the patch
          for (const [key, value] of Object.entries(patch)) {
            const fieldName = `salon.settings.${section}.${key}`
            
            // Determine field type and column
            let updateData: any = {
              organization_id,
              entity_id: configEntity.id,
              field_name: fieldName,
              smart_code: `HERA.SALON.CONFIG.FIELD.${section.toUpperCase()}.${key.toUpperCase()}.V1`
            }
            
            if (typeof value === 'boolean') {
              updateData.field_value_boolean = value
            } else if (typeof value === 'number') {
              updateData.field_value_number = value
            } else if (typeof value === 'object' && value !== null) {
              updateData.field_value_json = value
            } else {
              updateData.field_value_text = String(value)
            }
            
            // Check if field exists
            const { data: existingField } = await supabase
              .from('core_dynamic_data')
              .select('id')
              .eq('organization_id', organization_id)
              .eq('entity_id', configEntity.id)
              .eq('field_name', fieldName)
              .single()
            
            if (existingField) {
              // Update existing
              const { error: updateError } = await supabase
                .from('core_dynamic_data')
                .update(updateData)
                .eq('id', existingField.id)
              
              if (updateError) {
                error = updateError
                break
              }
            } else {
              // Insert new
              const { error: insertError } = await supabase
                .from('core_dynamic_data')
                .insert(updateData)
              
              if (insertError) {
                error = insertError
                break
              }
            }
          }
          
          if (!error) {
            // Create audit transaction
            const { error: auditError } = await supabase
              .from('universal_transactions')
              .insert({
                organization_id,
                transaction_type: 'audit',
                transaction_code: `CONFIG-AUDIT-${Date.now()}`,
                smart_code: 'HERA.UNIV.AUDIT.CONFIG.CHANGE.V1',
                total_amount: 0,
                metadata: {
                  section,
                  changes: patch,
                  changed_by: procedurePayload._context?.user_id || 'system',
                  changed_at: new Date().toISOString(),
                  correlation_id: correlationId
                }
              })
            
            if (auditError) {
              console.warn('Failed to create audit record:', auditError)
            }
            
            data = { 
              success: true, 
              section, 
              version: Date.now(),
              changes_applied: Object.keys(patch).length
            }
          }
        }
      } catch (e: any) {
        error = { message: e.message || 'Unknown error in config upsert' }
      }
    } else {
      // For other procedures, call through RPC if available
      const rpcResult = await supabase.rpc(procedureName, procedurePayload)
      data = rpcResult.data
      error = rpcResult.error
    }
    
    if (error) {
      console.error(`Playbook error for ${smartCode}:`, error)
      return {
        success: false,
        error: {
          code: error.code || 'PROCEDURE_ERROR',
          message: error.message || 'Procedure execution failed',
          details: error.details || error
        },
        metadata: {
          correlation_id: correlationId,
          execution_time_ms: Date.now() - startTime,
          idempotency_key: idempotencyKey
        }
      }
    }
    
    // 7. Handle procedure response format
    // Procedures should return { success: boolean, data?: any, error?: any }
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return {
        success: data.success,
        data: data.data,
        error: data.error,
        metadata: {
          correlation_id: correlationId,
          execution_time_ms: Date.now() - startTime,
          procedure_version: data._metadata?.version,
          idempotency_key: idempotencyKey
        }
      }
    }
    
    // 8. Simple data response (backwards compatibility)
    return {
      success: true,
      data: data as T,
      metadata: {
        correlation_id: correlationId,
        execution_time_ms: Date.now() - startTime,
        idempotency_key: idempotencyKey
      }
    }
  } catch (error) {
    console.error(`Playbook execution failed for ${smartCode}:`, error)
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      metadata: {
        correlation_id: correlationId,
        execution_time_ms: Date.now() - startTime,
        idempotency_key: idempotencyKey
      }
    }
  }
}

/**
 * Check if playbook mode is enabled for a specific feature
 */
export async function isPlaybookModeEnabled(
  feature: string,
  organizationId: string
): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient()
    
    // First, find ALL configuration entities (there might be multiple)
    const { data: configEntities, error: configError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'configuration')
      .eq('entity_code', 'PLAYBOOK_CONFIG')
    
    if (configError || !configEntities || configEntities.length === 0) {
      // No config entity means no flags
      return false
    }
    
    // Get all entity IDs
    const entityIds = configEntities.map(e => e.id)
    
    // Check organization-specific feature flag across all config entities
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('field_value_boolean, field_value_text')
      .eq('organization_id', organizationId)
      .in('entity_id', entityIds)
      .eq('field_name', `playbook_mode_${feature}`)
      .single()
    
    if (error || !data) {
      // Default to false if flag not found
      return false
    }
    
    // Check both boolean and text fields (some flags might be stored as text)
    if (data.field_value_boolean !== null) {
      return data.field_value_boolean === true
    } else if (data.field_value_text !== null) {
      return data.field_value_text === 'true'
    }
    
    return false
  } catch (error) {
    console.error(`Error checking playbook mode for ${feature}:`, error)
    return false
  }
}

/**
 * Batch check multiple feature flags
 */
export async function getPlaybookModeFlags(
  organizationId: string
): Promise<Record<string, boolean>> {
  try {
    const supabase = createSupabaseServerClient()
    
    // First, find the configuration entity
    const { data: configEntity, error: configError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'configuration')
      .eq('entity_code', 'PLAYBOOK_CONFIG')
      .single()
    
    if (configError || !configEntity) {
      return {}
    }
    
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_boolean')
      .eq('organization_id', organizationId)
      .eq('entity_id', configEntity.id)
      .like('field_name', 'playbook_mode_%')
    
    if (error || !data) {
      return {}
    }
    
    const flags: Record<string, boolean> = {}
    for (const row of data) {
      const feature = row.field_name.replace('playbook_mode_', '')
      flags[feature] = row.field_value_boolean === true
    }
    
    return flags
  } catch (error) {
    console.error('Error fetching playbook mode flags:', error)
    return {}
  }
}

/**
 * Simplified procedure runner for direct API usage
 */
export async function runProcedure<T = any>(
  smartCode: string,
  payload: any,
  opts: PlaybookOptions = {}
): Promise<T> {
  const result = await runPlaybook<T>(smartCode, payload, opts)
  if (!result.success) {
    throw new Error(result.error?.message || 'Procedure execution failed')
  }
  return result.data as T
}

// Type definitions for common operations
export interface CreateAppointmentPayload {
  customer_phone: string
  service_ids: string[]
  stylist_id: string
  start_time: string
  notes?: string
  organization_id?: string
}

export interface UpdateAppointmentPayload {
  appointment_id: string
  start_time?: string
  stylist_id?: string
  notes?: string
  organization_id?: string
}

export interface CancelAppointmentPayload {
  appointment_id: string
  reason?: string
  notify_customer?: boolean
  organization_id?: string
}

export interface CreateCartPayload {
  customer_id?: string
  stylist_id?: string
  organization_id?: string
}

export interface RepriceCartPayload {
  cart_id: string
  promotion_codes?: string[]
  membership_id?: string
  organization_id?: string
}

export interface CheckoutPayload {
  cart_id: string
  payment_method: string
  payment_amount: number
  tip_amount?: number
  organization_id?: string
}

export interface CreateCustomerPayload {
  phone: string
  name: string
  email?: string
  preferences?: Record<string, any>
  organization_id?: string
}

export interface UpdateCustomerPayload {
  customer_id: string
  name?: string
  email?: string
  phone?: string
  preferences?: Record<string, any>
  organization_id?: string
}

// Typed playbook functions for salon domain
export const salonPlaybooks = {
  appointments: {
    create: (payload: CreateAppointmentPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.APPOINTMENT.CREATE.V1', payload, opts),
    
    update: (payload: UpdateAppointmentPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.APPOINTMENT.UPDATE.V1', payload, opts),
    
    cancel: (payload: CancelAppointmentPayload, opts?: PlaybookOptions) => 
      runPlaybook<void>('HERA.SALON.APPOINTMENT.CANCEL.V1', payload, opts),
    
    confirm: (appointmentId: string, opts?: PlaybookOptions) =>
      runPlaybook<void>('HERA.SALON.APPOINTMENT.CONFIRM.V1', { appointment_id: appointmentId }, opts)
  },
  
  pos: {
    createCart: (payload: CreateCartPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.POS.CART.CREATE.V1', payload, opts),
    
    addItem: (cartId: string, serviceId: string, quantity: number = 1, opts?: PlaybookOptions) =>
      runPlaybook<any>('HERA.SALON.POS.CART.ADD_ITEM.V1', { 
        cart_id: cartId, 
        service_id: serviceId, 
        quantity 
      }, opts),
    
    repriceCart: (payload: RepriceCartPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.POS.CART.REPRICE.V1', payload, opts),
    
    checkout: (payload: CheckoutPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.POS.CHECKOUT.PROCESS.V1', payload, opts)
  },
  
  customers: {
    create: (payload: CreateCustomerPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.CUSTOMER.CREATE.V1', payload, opts),
    
    update: (payload: UpdateCustomerPayload, opts?: PlaybookOptions) => 
      runPlaybook<any>('HERA.SALON.CUSTOMER.UPDATE.V1', payload, opts),
    
    search: (phone: string, organizationId: string, opts?: PlaybookOptions) =>
      runPlaybook<any[]>('HERA.SALON.CUSTOMER.SEARCH.V1', { 
        phone, 
        organization_id: organizationId 
      }, opts)
  },
  
  whatsapp: {
    sendAppointmentReminder: (appointmentId: string, opts?: PlaybookOptions) =>
      runPlaybook<void>('HERA.SALON.COMMS.WHATSAPP.APPOINTMENT_REMINDER.V1', { 
        appointment_id: appointmentId 
      }, opts),
    
    sendReceipt: (saleId: string, opts?: PlaybookOptions) =>
      runPlaybook<void>('HERA.SALON.COMMS.WHATSAPP.SEND_RECEIPT.V1', { 
        sale_id: saleId 
      }, opts)
  }
}

// Logging helper for migration tracking
export function logPlaybookExecution(
  smartCode: string,
  success: boolean,
  executionTime: number,
  opts?: {
    organizationId?: string
    correlationId?: string
    error?: any
  }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'playbook_execution',
    smart_code: smartCode,
    success,
    execution_time_ms: executionTime,
    organization_id: opts?.organizationId,
    correlation_id: opts?.correlationId,
    error: opts?.error
  }
  
  if (success) {
    console.log('[PLAYBOOK]', logEntry)
  } else {
    console.error('[PLAYBOOK ERROR]', logEntry)
  }
  
  // TODO: Send to monitoring system
  // sendToMonitoring(logEntry)
}

// Error code constants
export const PlaybookErrorCodes = {
  PROCEDURE_NOT_FOUND: 'PROCEDURE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  TIMEOUT: 'TIMEOUT'
} as const

export type PlaybookErrorCode = typeof PlaybookErrorCodes[keyof typeof PlaybookErrorCodes]