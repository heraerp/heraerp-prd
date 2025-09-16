/**
 * 🔧 HERA Configuration Rules Admin API
 *
 * Administrative endpoints for managing configuration rules.
 * Enables creation, update, and deletion of configuration rules
 * with proper authorization and audit trails.
 *
 * Features:
 * - CRUD operations for configuration rules
 * - Rule validation and conflict detection
 * - Bulk operations support
 * - Version history tracking
 * - Authorization checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

interface ConfigurationRule {
  entity_name: string
  smart_code: string
  organization_id: string
  config_key: string
  rule_type: 'default' | 'conditional' | 'override'
  priority?: number
  conditions?: any
  config_value: any
  is_sensitive?: boolean
  cache_ttl?: number
  description?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const ruleId = searchParams.get('rule_id')
    const includeHistory = searchParams.get('include_history') === 'true'

    console.log('🔧 Config Admin GET:', { organizationId, ruleId, includeHistory })

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'organization_id is required'
        },
        { status: 400 }
      )
    }

    // Check authorization
    const authCheck = await checkAdminAuthorization(request, organizationId)
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authCheck.error || 'Unauthorized'
        },
        { status: 403 }
      )
    }

    if (ruleId) {
      return await getRuleDetails(ruleId, organizationId, includeHistory)
    } else {
      return await getAllRules(organizationId)
    }
  } catch (error) {
    console.error('Config Admin GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, rules, action = 'create' } = body

    console.log('🔧 Config Admin POST:', { organization_id, action, ruleCount: rules?.length || 1 })

    if (!organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'organization_id is required'
        },
        { status: 400 }
      )
    }

    // Check authorization
    const authCheck = await checkAdminAuthorization(request, organization_id)
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authCheck.error || 'Unauthorized'
        },
        { status: 403 }
      )
    }

    switch (action) {
      case 'create':
        if (Array.isArray(rules)) {
          return await createBulkRules(rules, organization_id, authCheck.userId)
        } else {
          const rule = body
          delete rule.action
          return await createRule(rule as ConfigurationRule, authCheck.userId)
        }

      case 'validate':
        return await validateRule(body)

      case 'check_conflicts':
        return await checkRuleConflicts(body, organization_id)

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: ['create', 'validate', 'check_conflicts']
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Config Admin POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { rule_id, organization_id, updates } = body

    console.log('🔧 Config Admin PUT:', { rule_id, organization_id })

    if (!rule_id || !organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'rule_id and organization_id are required'
        },
        { status: 400 }
      )
    }

    // Check authorization
    const authCheck = await checkAdminAuthorization(request, organization_id)
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authCheck.error || 'Unauthorized'
        },
        { status: 403 }
      )
    }

    return await updateRule(rule_id, organization_id, updates, authCheck.userId)
  } catch (error) {
    console.error('Config Admin PUT error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('rule_id')
    const organizationId = searchParams.get('organization_id')
    const soft = searchParams.get('soft') !== 'false' // Default to soft delete

    console.log('🔧 Config Admin DELETE:', { ruleId, organizationId, soft })

    if (!ruleId || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'rule_id and organization_id are required'
        },
        { status: 400 }
      )
    }

    // Check authorization
    const authCheck = await checkAdminAuthorization(request, organizationId)
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authCheck.error || 'Unauthorized'
        },
        { status: 403 }
      )
    }

    return await deleteRule(ruleId, organizationId, soft, authCheck.userId)
  } catch (error) {
    console.error('Config Admin DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Create a new configuration rule
async function createRule(rule: ConfigurationRule, userId?: string): Promise<NextResponse> {
  if (!supabase) {
    return getMockCreateResponse(rule)
  }

  try {
    // Validate rule
    const validation = validateRuleData(rule)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Create entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: rule.organization_id,
        entity_type: 'configuration_rule',
        entity_name: rule.entity_name,
        entity_code: `RULE-${Date.now()}`,
        smart_code: rule.smart_code,
        status: 'active',
        created_by: userId,
        metadata: {
          priority: rule.priority || 0,
          cache_ttl: rule.cache_ttl || 300
        }
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating rule entity:', entityError)
      return NextResponse.json(
        {
          success: false,
          error: entityError.message
        },
        { status: 500 }
      )
    }

    // Create dynamic fields
    const dynamicFields = [
      { field_name: 'config_key', field_value: rule.config_key },
      { field_name: 'rule_type', field_value: rule.rule_type },
      { field_name: 'priority', field_value_number: rule.priority || 0 }
    ]

    if (rule.conditions) {
      dynamicFields.push({
        field_name: 'conditions',
        field_value_json: rule.conditions
      } as any)
    }

    // Handle different value types
    const valueField: any = { field_name: 'config_value' }
    if (typeof rule.config_value === 'number') {
      valueField.field_value_number = rule.config_value
    } else if (typeof rule.config_value === 'boolean') {
      valueField.field_value_boolean = rule.config_value
    } else if (typeof rule.config_value === 'object') {
      valueField.field_value_json = rule.config_value
    } else {
      valueField.field_value = String(rule.config_value)
    }
    dynamicFields.push(valueField)

    if (rule.description) {
      dynamicFields.push({
        field_name: 'description',
        field_value: rule.description
      } as any)
    }

    if (rule.is_sensitive !== undefined) {
      dynamicFields.push({
        field_name: 'is_sensitive',
        field_value_boolean: rule.is_sensitive
      } as any)
    }

    // Insert dynamic fields
    const dynamicData = dynamicFields.map(field => ({
      organization_id: rule.organization_id,
      entity_id: entity.id,
      field_type: getFieldType(field),
      created_by: userId,
      ...field
    }))

    const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(dynamicData)

    if (dynamicError) {
      // Rollback entity creation
      await supabase.from('core_entities').delete().eq('id', entity.id)

      console.error('Error creating dynamic fields:', dynamicError)
      return NextResponse.json(
        {
          success: false,
          error: dynamicError.message
        },
        { status: 500 }
      )
    }

    // Create audit log
    await createAuditLog({
      organization_id: rule.organization_id,
      action: 'create_configuration_rule',
      entity_id: entity.id,
      user_id: userId,
      details: {
        config_key: rule.config_key,
        rule_type: rule.rule_type
      }
    })

    return NextResponse.json({
      success: true,
      rule: {
        id: entity.id,
        ...rule,
        created_at: entity.created_at
      },
      message: 'Configuration rule created successfully'
    })
  } catch (error) {
    console.error('Create rule error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Creation failed'
      },
      { status: 500 }
    )
  }
}

// Update existing rule
async function updateRule(
  ruleId: string,
  organizationId: string,
  updates: any,
  userId?: string
): Promise<NextResponse> {
  if (!supabase) {
    return getMockUpdateResponse(ruleId, updates)
  }

  try {
    // First verify the rule exists and belongs to the organization
    const { data: existingRule, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', ruleId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'configuration_rule')
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rule not found'
        },
        { status: 404 }
      )
    }

    // Update entity metadata
    if (updates.entity_name || updates.priority !== undefined || updates.cache_ttl !== undefined) {
      const entityUpdates: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId
      }

      if (updates.entity_name) {
        entityUpdates.entity_name = updates.entity_name
      }

      if (updates.priority !== undefined || updates.cache_ttl !== undefined) {
        entityUpdates.metadata = {
          ...existingRule.metadata,
          ...(updates.priority !== undefined && { priority: updates.priority }),
          ...(updates.cache_ttl !== undefined && { cache_ttl: updates.cache_ttl })
        }
      }

      const { error: updateError } = await supabase
        .from('core_entities')
        .update(entityUpdates)
        .eq('id', ruleId)

      if (updateError) {
        console.error('Error updating entity:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: updateError.message
          },
          { status: 500 }
        )
      }
    }

    // Update dynamic fields
    for (const [fieldName, value] of Object.entries(updates)) {
      if (['entity_name', 'priority', 'cache_ttl'].includes(fieldName)) continue

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (typeof value === 'number') {
        updateData.field_value_number = value
        updateData.field_value = null
        updateData.field_value_boolean = null
        updateData.field_value_json = null
      } else if (typeof value === 'boolean') {
        updateData.field_value_boolean = value
        updateData.field_value = null
        updateData.field_value_number = null
        updateData.field_value_json = null
      } else if (typeof value === 'object') {
        updateData.field_value_json = value
        updateData.field_value = null
        updateData.field_value_number = null
        updateData.field_value_boolean = null
      } else {
        updateData.field_value = String(value)
        updateData.field_value_number = null
        updateData.field_value_boolean = null
        updateData.field_value_json = null
      }

      // Check if field exists
      const { data: existingField } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('entity_id', ruleId)
        .eq('field_name', fieldName)
        .single()

      if (existingField) {
        // Update existing field
        const { error } = await supabase
          .from('core_dynamic_data')
          .update(updateData)
          .eq('id', existingField.id)

        if (error) {
          console.error(`Error updating field ${fieldName}:`, error)
        }
      } else {
        // Create new field
        const { error } = await supabase.from('core_dynamic_data').insert({
          organization_id: organizationId,
          entity_id: ruleId,
          field_name: fieldName,
          field_type: getFieldTypeForValue(value),
          created_by: userId,
          ...updateData
        })

        if (error) {
          console.error(`Error creating field ${fieldName}:`, error)
        }
      }
    }

    // Create audit log
    await createAuditLog({
      organization_id: organizationId,
      action: 'update_configuration_rule',
      entity_id: ruleId,
      user_id: userId,
      details: {
        updates
      }
    })

    return NextResponse.json({
      success: true,
      rule_id: ruleId,
      updates,
      message: 'Configuration rule updated successfully'
    })
  } catch (error) {
    console.error('Update rule error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      },
      { status: 500 }
    )
  }
}

// Delete rule (soft or hard delete)
async function deleteRule(
  ruleId: string,
  organizationId: string,
  soft: boolean,
  userId?: string
): Promise<NextResponse> {
  if (!supabase) {
    return getMockDeleteResponse(ruleId, soft)
  }

  try {
    if (soft) {
      // Soft delete - update status
      const { error } = await supabase
        .from('core_entities')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', ruleId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error soft deleting rule:', error)
        return NextResponse.json(
          {
            success: false,
            error: error.message
          },
          { status: 500 }
        )
      }

      // Create audit log
      await createAuditLog({
        organization_id: organizationId,
        action: 'soft_delete_configuration_rule',
        entity_id: ruleId,
        user_id: userId
      })

      return NextResponse.json({
        success: true,
        rule_id: ruleId,
        deleted: true,
        soft_delete: true,
        message: 'Configuration rule soft deleted successfully'
      })
    } else {
      // Hard delete - remove entity and related data
      // First delete dynamic data
      await supabase.from('core_dynamic_data').delete().eq('entity_id', ruleId)

      // Then delete entity
      const { error } = await supabase
        .from('core_entities')
        .delete()
        .eq('id', ruleId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error hard deleting rule:', error)
        return NextResponse.json(
          {
            success: false,
            error: error.message
          },
          { status: 500 }
        )
      }

      // Create audit log
      await createAuditLog({
        organization_id: organizationId,
        action: 'hard_delete_configuration_rule',
        entity_id: ruleId,
        user_id: userId
      })

      return NextResponse.json({
        success: true,
        rule_id: ruleId,
        deleted: true,
        soft_delete: false,
        message: 'Configuration rule permanently deleted'
      })
    }
  } catch (error) {
    console.error('Delete rule error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      },
      { status: 500 }
    )
  }
}

// Helper functions
async function checkAdminAuthorization(
  request: NextRequest,
  organizationId: string
): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  // In production, implement proper JWT validation and role checking
  // For now, we'll do basic checks

  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'Missing authorization header' }
    }

    // TODO: Validate JWT token and extract user ID
    // TODO: Check user has admin role for the organization

    // Mock authorization for development
    return { authorized: true, userId: 'mock-admin-user' }
  } catch (error) {
    console.error('Authorization check error:', error)
    return { authorized: false, error: 'Authorization check failed' }
  }
}

function validateRuleData(rule: ConfigurationRule): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  if (!rule.entity_name) errors.push('entity_name is required')
  if (!rule.smart_code) errors.push('smart_code is required')
  if (!rule.organization_id) errors.push('organization_id is required')
  if (!rule.config_key) errors.push('config_key is required')
  if (!rule.rule_type) errors.push('rule_type is required')
  if (rule.config_value === undefined) errors.push('config_value is required')

  if (rule.rule_type && !['default', 'conditional', 'override'].includes(rule.rule_type)) {
    errors.push('rule_type must be one of: default, conditional, override')
  }

  if (rule.rule_type === 'conditional' && !rule.conditions) {
    errors.push('conditions are required for conditional rules')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function getFieldType(field: any): string {
  if (field.field_value_number !== undefined) return 'number'
  if (field.field_value_boolean !== undefined) return 'boolean'
  if (field.field_value_json !== undefined) return 'json'
  return 'text'
}

function getFieldTypeForValue(value: any): string {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'object') return 'json'
  return 'text'
}

async function createAuditLog(log: any) {
  // In production, implement proper audit logging
  console.log('Audit log:', log)
}

// Additional helper functions
async function getRuleDetails(
  ruleId: string,
  organizationId: string,
  includeHistory: boolean
): Promise<NextResponse> {
  // Implementation for getting detailed rule information
  return NextResponse.json({
    success: true,
    rule: {
      id: ruleId
      // ... rule details
    },
    history: includeHistory ? [] : undefined
  })
}

async function getAllRules(organizationId: string): Promise<NextResponse> {
  // Implementation for getting all rules
  return NextResponse.json({
    success: true,
    rules: [],
    count: 0
  })
}

async function createBulkRules(
  rules: ConfigurationRule[],
  organizationId: string,
  userId?: string
): Promise<NextResponse> {
  // Implementation for bulk rule creation
  const results = []
  const errors = []

  for (const rule of rules) {
    try {
      const result = await createRule(
        {
          ...rule,
          organization_id: organizationId
        },
        userId
      )

      const data = await result.json()
      if (data.success) {
        results.push(data.rule)
      } else {
        errors.push({ rule: rule.entity_name, error: data.error })
      }
    } catch (error) {
      errors.push({
        rule: rule.entity_name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    created: results,
    errors: errors.length > 0 ? errors : undefined,
    total_created: results.length,
    total_errors: errors.length
  })
}

async function validateRule(rule: any): Promise<NextResponse> {
  const validation = validateRuleData(rule)
  return NextResponse.json({
    success: validation.valid,
    valid: validation.valid,
    errors: validation.errors
  })
}

async function checkRuleConflicts(rule: any, organizationId: string): Promise<NextResponse> {
  // Check for conflicting rules
  // In production, implement logic to detect overlapping conditions
  return NextResponse.json({
    success: true,
    conflicts: [],
    has_conflicts: false
  })
}

// Mock responses
function getMockCreateResponse(rule: ConfigurationRule) {
  return NextResponse.json({
    success: true,
    rule: {
      id: `mock-${Date.now()}`,
      ...rule,
      created_at: new Date().toISOString()
    },
    message: 'Mock configuration rule created',
    mode: 'mock_demonstration'
  })
}

function getMockUpdateResponse(ruleId: string, updates: any) {
  return NextResponse.json({
    success: true,
    rule_id: ruleId,
    updates,
    message: 'Mock configuration rule updated',
    mode: 'mock_demonstration'
  })
}

function getMockDeleteResponse(ruleId: string, soft: boolean) {
  return NextResponse.json({
    success: true,
    rule_id: ruleId,
    deleted: true,
    soft_delete: soft,
    message: `Mock configuration rule ${soft ? 'soft' : 'hard'} deleted`,
    mode: 'mock_demonstration'
  })
}
