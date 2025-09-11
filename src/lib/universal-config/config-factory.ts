/**
 * Universal Configuration Factory
 * Enterprise-grade configuration system for rapid deployment
 * Based on HERA's 6-table architecture
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Configuration Type Definition
export interface ConfigType {
  entityType: string
  smartCodePrefix: string
  displayName: string
  pluralName: string
  relatedEntityType?: string
  relatedFieldName?: string
  defaultFields?: string[]
  customAnalytics?: (items: any[], relatedItems?: any[]) => any
}

// Common Configuration Types
export const CONFIG_TYPES = {
  SERVICE_CATEGORY: {
    entityType: 'salon_service_category',
    smartCodePrefix: 'HERA.SALON.CATEGORY',
    displayName: 'Service Category',
    pluralName: 'Service Categories',
    relatedEntityType: 'salon_service',
    relatedFieldName: 'category',
    defaultFields: ['color', 'icon', 'description', 'is_active', 'sort_order']
  },
  PRODUCT_CATEGORY: {
    entityType: 'product_category',
    smartCodePrefix: 'HERA.INV.CATEGORY',
    displayName: 'Product Category',
    pluralName: 'Product Categories',
    relatedEntityType: 'product',
    relatedFieldName: 'category',
    defaultFields: ['color', 'icon', 'description', 'is_active', 'sort_order', 'parent_category']
  },
  CUSTOMER_TYPE: {
    entityType: 'customer_type',
    smartCodePrefix: 'HERA.CRM.CUSTTYPE',
    displayName: 'Customer Type',
    pluralName: 'Customer Types',
    relatedEntityType: 'customer',
    relatedFieldName: 'customer_type',
    defaultFields: ['description', 'discount_percentage', 'credit_limit', 'payment_terms']
  },
  PAYMENT_METHOD: {
    entityType: 'payment_method',
    smartCodePrefix: 'HERA.FIN.PAYMETHOD',
    displayName: 'Payment Method',
    pluralName: 'Payment Methods',
    defaultFields: ['is_active', 'processing_fee', 'account_id', 'requires_reference']
  },
  TAX_TYPE: {
    entityType: 'tax_type',
    smartCodePrefix: 'HERA.FIN.TAX',
    displayName: 'Tax Type',
    pluralName: 'Tax Types',
    defaultFields: ['tax_rate', 'is_active', 'gl_account_id', 'applicable_to']
  },
  LOCATION: {
    entityType: 'business_location',
    smartCodePrefix: 'HERA.ORG.LOCATION',
    displayName: 'Location',
    pluralName: 'Locations',
    defaultFields: ['address', 'phone', 'email', 'manager_id', 'is_active', 'timezone']
  },
  DEPARTMENT: {
    entityType: 'department',
    smartCodePrefix: 'HERA.ORG.DEPT',
    displayName: 'Department',
    pluralName: 'Departments',
    relatedEntityType: 'employee',
    relatedFieldName: 'department',
    defaultFields: ['manager_id', 'cost_center', 'is_active', 'parent_department']
  },
  EXPENSE_CATEGORY: {
    entityType: 'expense_category',
    smartCodePrefix: 'HERA.FIN.EXPENSE',
    displayName: 'Expense Category',
    pluralName: 'Expense Categories',
    defaultFields: ['gl_account_id', 'is_active', 'requires_approval', 'approval_limit']
  },
  // Salon-specific configurations
  STAFF_ROLE: {
    entityType: 'staff_role',
    smartCodePrefix: 'HERA.SALON.ROLE',
    displayName: 'Staff Role',
    pluralName: 'Staff Roles',
    relatedEntityType: 'staff',
    relatedFieldName: 'role',
    defaultFields: ['description', 'permissions', 'commission_rate', 'is_active', 'hierarchy_level']
  },
  STAFF_SKILL: {
    entityType: 'staff_skill',
    smartCodePrefix: 'HERA.SALON.SKILL',
    displayName: 'Staff Skill',
    pluralName: 'Staff Skills',
    defaultFields: ['description', 'certification_required', 'service_category', 'proficiency_levels']
  },
  PRODUCT_TYPE: {
    entityType: 'salon_product_type',
    smartCodePrefix: 'HERA.SALON.PRODTYPE',
    displayName: 'Product Type',
    pluralName: 'Product Types',
    defaultFields: ['description', 'for_retail', 'for_professional', 'unit_of_measure']
  },
  SUPPLIER: {
    entityType: 'supplier',
    smartCodePrefix: 'HERA.SALON.SUPPLIER',
    displayName: 'Supplier',
    pluralName: 'Suppliers',
    defaultFields: ['contact_name', 'phone', 'email', 'address', 'payment_terms', 'is_active']
  },
  STOCK_LOCATION: {
    entityType: 'stock_location',
    smartCodePrefix: 'HERA.SALON.STOCKLOC',
    displayName: 'Stock Location',
    pluralName: 'Stock Locations',
    defaultFields: ['description', 'location_type', 'manager_id', 'is_active']
  },
  COMMISSION_RULE: {
    entityType: 'commission_rule',
    smartCodePrefix: 'HERA.SALON.COMMISSION',
    displayName: 'Commission Rule',
    pluralName: 'Commission Rules',
    defaultFields: ['rule_type', 'base_rate', 'tier_rates', 'applies_to', 'is_active']
  },
  BOOKING_RULE: {
    entityType: 'booking_rule',
    smartCodePrefix: 'HERA.SALON.BOOKING',
    displayName: 'Booking Rule',
    pluralName: 'Booking Rules',
    defaultFields: ['rule_type', 'advance_days', 'cancellation_hours', 'deposit_required', 'is_active']
  },
  LOYALTY_TIER: {
    entityType: 'loyalty_tier',
    smartCodePrefix: 'HERA.SALON.LOYALTY',
    displayName: 'Loyalty Tier',
    pluralName: 'Loyalty Tiers',
    defaultFields: ['points_required', 'benefits', 'discount_percentage', 'tier_color', 'is_active']
  },
  PACKAGE_TYPE: {
    entityType: 'package_type',
    smartCodePrefix: 'HERA.SALON.PACKAGE',
    displayName: 'Package Type',
    pluralName: 'Package Types',
    defaultFields: ['description', 'validity_days', 'services_included', 'discount_percentage', 'is_active']
  }
} as const

// Cached Supabase client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

/**
 * Get Supabase client with proper error handling
 * Follows the same pattern as supabase-admin.ts
 */
function getSupabaseClient() {
  // Return cached instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // During build time, return a mock client
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ Supabase environment variables not found - using mock client for build')
      return {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          eq: () => ({ 
            select: () => Promise.resolve({ data: [], error: null }),
            update: () => Promise.resolve({ data: [], error: null }),
            delete: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          neq: () => ({
            order: () => ({
              select: () => Promise.resolve({ data: [], error: null })
            })
          }),
          order: () => ({ 
            select: () => Promise.resolve({ data: [], error: null })
          }),
          in: () => ({
            select: () => Promise.resolve({ data: [], error: null })
          }),
          or: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null })
        })
      } as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  // Create and cache the client
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
  
  return supabaseInstance
}

// Configuration Factory Class
export class ConfigurationFactory {
  private supabase: any
  
  constructor() {
    this.supabase = getSupabaseClient()
  }

  /**
   * Create API route handlers for any configuration type
   */
  createRouteHandlers(config: ConfigType) {
    return {
      GET: this.createGetHandler(config),
      POST: this.createPostHandler(config),
      PUT: this.createPutHandler(config),
      DELETE: this.createDeleteHandler(config)
    }
  }

  /**
   * GET handler - Fetch all items with analytics
   */
  private createGetHandler(config: ConfigType) {
    return async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organization_id')
        
        if (!organizationId) {
          return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
        }


        // Fetch main entities
        const { data: items, error: itemsError } = await this.supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', config.entityType)
          .neq('status', 'deleted')
          .order('entity_name')

        if (itemsError) throw itemsError

        // Fetch dynamic data
        const itemIds = items?.map((i: any) => i.id) || []
        const { data: dynamicData, error: dynamicError } = await this.supabase
          .from('core_dynamic_data')
          .select('*')
          .in('entity_id', itemIds)

        if (dynamicError) throw dynamicError

        // Fetch related items if configured
        let relatedItems: any[] = []
        if (config.relatedEntityType) {
          const { data: related, error: relatedError } = await this.supabase
            .from('core_entities')
            .select('id, metadata')
            .eq('organization_id', organizationId)
            .eq('entity_type', config.relatedEntityType)
            .neq('status', 'deleted')

          if (relatedError) throw relatedError
          relatedItems = related || []
        }

        // Enrich items with dynamic data and counts
        const enrichedItems = this.enrichItems(items || [], dynamicData || [], relatedItems, config)

        // Calculate analytics
        const analytics = this.calculateAnalytics(enrichedItems, relatedItems, config)

        return NextResponse.json({
          [config.pluralName.toLowerCase().replace(/ /g, '_')]: enrichedItems,
          analytics
        })
      } catch (error: any) {
        console.error(`Error fetching ${config.pluralName}:`, error)
        return NextResponse.json(
          { error: error.message || `Failed to fetch ${config.pluralName}` },
          { status: 500 }
        )
      }
    }
  }

  /**
   * POST handler - Create new item
   */
  private createPostHandler(config: ConfigType) {
    return async (request: NextRequest) => {
      try {
        const body = await request.json()
        const { organization_id, name, code, ...dynamicFields } = body

        if (!organization_id || !name) {
          return NextResponse.json(
            { error: 'organization_id and name are required' },
            { status: 400 }
          )
        }


        // Create main entity
        // Log the request for debugging
        console.log(`Creating ${config.entityType} entity:`, {
          organization_id,
          entity_type: config.entityType,
          name
        })

        const entityCode = code || this.generateCode(name)
        const smartCode = `${config.smartCodePrefix}.${entityCode}.v1`

        const { data: entity, error: entityError } = await this.supabase
          .from('core_entities')
          .insert({
            organization_id,
            entity_type: config.entityType,
            entity_name: name,
            entity_code: entityCode,
            smart_code: smartCode,
            status: 'active',
            metadata: {
              created_via: 'configuration_api',
              version: 1
            }
          })
          .select()
          .single()

        if (entityError) {
          console.error(`Entity creation error:`, entityError)
          throw entityError
        }

        // Create dynamic fields
        const dynamicInserts = Object.entries(dynamicFields).map(([key, value]) => ({
          organization_id,
          entity_id: entity.id,
          field_name: key,
          ...this.getFieldValueColumn(value),
          smart_code: `${config.smartCodePrefix}.FIELD.${key.toUpperCase()}.v1`,
          created_at: new Date().toISOString()
        }))

        if (dynamicInserts.length > 0) {
          const { error: dynamicError } = await this.supabase
            .from('core_dynamic_data')
            .insert(dynamicInserts)

          if (dynamicError) throw dynamicError
        }

        return NextResponse.json({
          message: `${config.displayName} created successfully`,
          data: { ...entity, ...dynamicFields }
        }, { status: 201 })
      } catch (error: any) {
        console.error(`Error creating ${config.displayName}:`, error)
        return NextResponse.json(
          { error: error.message || `Failed to create ${config.displayName}` },
          { status: 500 }
        )
      }
    }
  }

  /**
   * PUT handler - Update existing item
   */
  private createPutHandler(config: ConfigType) {
    return async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const body = await request.json()

        if (!id) {
          return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        }


        const { name, ...dynamicFields } = body

        // Update main entity if name changed
        if (name) {
          const { error: entityError } = await this.supabase
            .from('core_entities')
            .update({
              entity_name: name,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)

          if (entityError) throw entityError
        }

        // Update dynamic fields
        for (const [key, value] of Object.entries(dynamicFields)) {
          // Check if field exists
          const { data: existing } = await this.supabase
            .from('core_dynamic_data')
            .select('id')
            .eq('entity_id', id)
            .eq('field_name', key)
            .single()

          if (existing) {
            // Update existing field
            const { error } = await this.supabase
              .from('core_dynamic_data')
              .update({
                ...this.getFieldValueColumn(value),
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)

            if (error) throw error
          } else {
            // Create new field
            const { data: entity } = await this.supabase
              .from('core_entities')
              .select('organization_id')
              .eq('id', id)
              .single()

            const { error } = await this.supabase
              .from('core_dynamic_data')
              .insert({
                organization_id: entity.organization_id,
                entity_id: id,
                field_name: key,
                ...this.getFieldValueColumn(value),
                smart_code: `${config.smartCodePrefix}.FIELD.${key.toUpperCase()}.v1`,
                created_at: new Date().toISOString()
              })

            if (error) throw error
          }
        }

        return NextResponse.json({
          message: `${config.displayName} updated successfully`
        })
      } catch (error: any) {
        console.error(`Error updating ${config.displayName}:`, error)
        return NextResponse.json(
          { error: error.message || `Failed to update ${config.displayName}` },
          { status: 500 }
        )
      }
    }
  }

  /**
   * DELETE handler - Soft delete item
   */
  private createDeleteHandler(config: ConfigType) {
    return async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
          return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        }


        // Check if item has related entities
        if (config.relatedEntityType) {
          const { data: entity } = await this.supabase
            .from('core_entities')
            .select('entity_code, organization_id')
            .eq('id', id)
            .single()

          if (entity) {
            const { data: related } = await this.supabase
              .from('core_entities')
              .select('id')
              .eq('organization_id', entity.organization_id)
              .eq('entity_type', config.relatedEntityType)
              .neq('status', 'deleted')
              .or(`metadata->>${config.relatedFieldName}.eq.${entity.entity_code}`)
              .limit(1)

            if (related && related.length > 0) {
              return NextResponse.json(
                { error: `Cannot delete ${config.displayName} with existing ${config.relatedEntityType}s` },
                { status: 400 }
              )
            }
          }
        }

        // Soft delete
        const { error } = await this.supabase
          .from('core_entities')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) throw error

        return NextResponse.json({
          message: `${config.displayName} deleted successfully`
        })
      } catch (error: any) {
        console.error(`Error deleting ${config.displayName}:`, error)
        return NextResponse.json(
          { error: error.message || `Failed to delete ${config.displayName}` },
          { status: 500 }
        )
      }
    }
  }

  /**
   * Helper: Enrich items with dynamic data
   */
  private enrichItems(items: any[], dynamicData: any[], relatedItems: any[], config: ConfigType) {
    return items.map(item => {
      const itemDynamicData = dynamicData.filter(d => d.entity_id === item.id)
      const dynamicFields: any = {}
      
      itemDynamicData.forEach(field => {
        if (field.field_value_text) dynamicFields[field.field_name] = field.field_value_text
        if (field.field_value_number !== null) dynamicFields[field.field_name] = field.field_value_number
        if (field.field_value_boolean !== null) dynamicFields[field.field_name] = field.field_value_boolean
        if (field.field_value_json) dynamicFields[field.field_name] = field.field_value_json
      })

      // Add related count if applicable
      let relatedCount = 0
      if (config.relatedEntityType && config.relatedFieldName) {
        relatedCount = relatedItems.filter(r => 
          r.metadata?.[config.relatedFieldName!] === item.entity_code ||
          dynamicData.find(d => 
            d.entity_id === r.id && 
            d.field_name === config.relatedFieldName && 
            d.field_value_text === item.entity_code
          )
        ).length
      }
      
      return {
        ...item,
        ...dynamicFields,
        ...(config.relatedEntityType ? { [`${config.relatedEntityType}_count`]: relatedCount } : {})
      }
    })
  }

  /**
   * Helper: Calculate analytics
   */
  private calculateAnalytics(items: any[], relatedItems: any[], config: ConfigType) {
    const baseAnalytics = {
      [`total_${config.pluralName.toLowerCase().replace(/ /g, '_')}`]: items.length,
      [`active_${config.pluralName.toLowerCase().replace(/ /g, '_')}`]: items.filter(i => 
        (i.metadata as any)?.is_active !== false && i.is_active !== false
      ).length
    }

    if (config.relatedEntityType) {
      baseAnalytics[`total_${config.relatedEntityType}s`] = relatedItems.length
      baseAnalytics[`average_${config.relatedEntityType}s_per_${config.entityType.replace(/_/g, '_')}`] = 
        items.length > 0 ? Math.round(relatedItems.length / items.length) : 0
    }

    // Apply custom analytics if provided
    if (config.customAnalytics) {
      Object.assign(baseAnalytics, config.customAnalytics(items, relatedItems))
    }

    return baseAnalytics
  }

  /**
   * Helper: Generate code from name
   */
  private generateCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Helper: Get appropriate field value column
   */
  private getFieldValueColumn(value: any) {
    if (typeof value === 'string') {
      return { field_value_text: value }
    } else if (typeof value === 'number') {
      return { field_value_number: value }
    } else if (typeof value === 'boolean') {
      return { field_value_boolean: value }
    } else if (value instanceof Date) {
      return { field_value_date: value.toISOString() }
    } else {
      return { field_value_json: value }
    }
  }

}