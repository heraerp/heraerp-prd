/**
 * 🧬 HERA Universal Configuration Rules API
 * 
 * Revolutionary configuration system that enables infinite customization
 * without code changes. Configuration rules are stored as entities
 * and evaluated dynamically for any business context.
 * 
 * Features:
 * - Rule-based configuration evaluation
 * - Multi-tenant organization isolation
 * - Cascading rule precedence
 * - Smart Code intelligence
 * - Real-time configuration decisions
 * - Cache optimization for performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Configuration rule evaluation logic
interface ConfigurationQuery {
  organization_id: string
  config_key: string
  context?: {
    entity_type?: string
    industry?: string
    user_role?: string
    transaction_type?: string
    amount?: number
    [key: string]: any
  }
}

interface ConfigurationRule {
  id: string
  organization_id: string
  rule_name: string
  rule_type: string
  config_key: string
  priority: number
  conditions: any
  config_value: any
  metadata: any
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'evaluate'
    const organizationId = searchParams.get('organization_id')
    const configKey = searchParams.get('config_key')

    console.log('🧬 Configuration API GET:', { action, organizationId, configKey })

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organization_id is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'evaluate':
        if (!configKey) {
          return NextResponse.json({
            success: false,
            error: 'config_key is required for evaluation'
          }, { status: 400 })
        }
        
        // Get context from query params
        const context: any = {}
        searchParams.forEach((value, key) => {
          if (!['action', 'organization_id', 'config_key'].includes(key)) {
            context[key] = value
          }
        })
        
        return await evaluateConfiguration({
          organization_id: organizationId,
          config_key: configKey,
          context
        })

      case 'list':
        return await listConfigurationRules(organizationId, configKey)

      case 'schema':
        return getConfigurationSchema()

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['evaluate', 'list', 'schema']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Configuration API GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id, config_key, context } = body

    console.log('🧬 Configuration API POST:', { action, organization_id, config_key })

    if (!organization_id) {
      return NextResponse.json({
        success: false,
        error: 'organization_id is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'evaluate':
        if (!config_key) {
          return NextResponse.json({
            success: false,
            error: 'config_key is required for evaluation'
          }, { status: 400 })
        }
        
        return await evaluateConfiguration({
          organization_id,
          config_key,
          context: context || {}
        })

      case 'batch_evaluate':
        if (!Array.isArray(body.queries)) {
          return NextResponse.json({
            success: false,
            error: 'queries array is required for batch evaluation'
          }, { status: 400 })
        }
        
        return await batchEvaluateConfigurations(organization_id, body.queries)

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['evaluate', 'batch_evaluate']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Configuration API POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Core configuration evaluation function
async function evaluateConfiguration(query: ConfigurationQuery): Promise<NextResponse> {
  if (!supabase) {
    return getMockConfigurationValue(query)
  }

  try {
    // Fetch all relevant configuration rules
    const { data: rules, error: rulesError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner (
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_value_json
        )
      `)
      .eq('entity_type', 'configuration_rule')
      .eq('organization_id', query.organization_id)
      .eq('status', 'active')
      .order('metadata->priority', { ascending: false })

    if (rulesError) {
      console.error('Error fetching configuration rules:', rulesError)
      return NextResponse.json({
        success: false,
        error: rulesError.message
      }, { status: 500 })
    }

    // Filter rules by config_key
    const relevantRules = rules?.filter(rule => {
      const configKeyField = rule.core_dynamic_data?.find(
        (field: any) => field.field_name === 'config_key'
      )
      return configKeyField?.field_value === query.config_key
    }) || []

    // Evaluate rules based on conditions and context
    let selectedRule = null
    let selectedValue = null

    for (const rule of relevantRules) {
      const conditions = rule.core_dynamic_data?.find(
        (field: any) => field.field_name === 'conditions'
      )?.field_value_json

      if (evaluateConditions(conditions, query.context)) {
        const valueField = rule.core_dynamic_data?.find(
          (field: any) => field.field_name === 'config_value'
        )
        
        selectedRule = rule
        selectedValue = valueField?.field_value_json || 
                       valueField?.field_value || 
                       valueField?.field_value_number ||
                       valueField?.field_value_boolean
        break
      }
    }

    // If no rule matches, check for default value
    if (!selectedRule) {
      const defaultRule = relevantRules.find(rule => {
        const ruleTypeField = rule.core_dynamic_data?.find(
          (field: any) => field.field_name === 'rule_type'
        )
        return ruleTypeField?.field_value === 'default'
      })

      if (defaultRule) {
        const valueField = defaultRule.core_dynamic_data?.find(
          (field: any) => field.field_name === 'config_value'
        )
        
        selectedRule = defaultRule
        selectedValue = valueField?.field_value_json || 
                       valueField?.field_value || 
                       valueField?.field_value_number ||
                       valueField?.field_value_boolean
      }
    }

    return NextResponse.json({
      success: true,
      config_key: query.config_key,
      value: selectedValue,
      rule_applied: selectedRule ? {
        id: selectedRule.id,
        name: selectedRule.entity_name,
        smart_code: selectedRule.smart_code
      } : null,
      context: query.context,
      cache_ttl: 300 // 5 minutes cache recommendation
    })

  } catch (error) {
    console.error('Configuration evaluation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Evaluation failed'
    }, { status: 500 })
  }
}

// Evaluate conditions against context
function evaluateConditions(conditions: any, context: any = {}): boolean {
  if (!conditions) return true // No conditions means always match
  
  try {
    // Handle simple equality conditions
    if (conditions.operator === 'equals') {
      return context[conditions.field] === conditions.value
    }
    
    // Handle complex AND/OR conditions
    if (conditions.operator === 'and') {
      return conditions.conditions.every((cond: any) => 
        evaluateConditions(cond, context)
      )
    }
    
    if (conditions.operator === 'or') {
      return conditions.conditions.some((cond: any) => 
        evaluateConditions(cond, context)
      )
    }
    
    // Handle comparison operators
    const contextValue = context[conditions.field]
    const conditionValue = conditions.value
    
    switch (conditions.operator) {
      case 'greater_than':
        return Number(contextValue) > Number(conditionValue)
      case 'less_than':
        return Number(contextValue) < Number(conditionValue)
      case 'greater_than_or_equal':
        return Number(contextValue) >= Number(conditionValue)
      case 'less_than_or_equal':
        return Number(contextValue) <= Number(conditionValue)
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(contextValue)
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(contextValue)
      case 'contains':
        return String(contextValue).includes(String(conditionValue))
      case 'starts_with':
        return String(contextValue).startsWith(String(conditionValue))
      case 'ends_with':
        return String(contextValue).endsWith(String(conditionValue))
      default:
        return false
    }
  } catch (error) {
    console.error('Condition evaluation error:', error)
    return false
  }
}

// Batch evaluate multiple configurations
async function batchEvaluateConfigurations(
  organizationId: string, 
  queries: Array<{ config_key: string; context?: any }>
): Promise<NextResponse> {
  const results = await Promise.all(
    queries.map(query => 
      evaluateConfiguration({
        organization_id: organizationId,
        config_key: query.config_key,
        context: query.context || {}
      }).then(response => response.json())
    )
  )

  return NextResponse.json({
    success: true,
    results,
    total: results.length
  })
}

// List configuration rules for an organization
async function listConfigurationRules(
  organizationId: string, 
  configKey?: string | null
): Promise<NextResponse> {
  if (!supabase) {
    return getMockRulesList()
  }

  try {
    let query = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data (
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_value_json
        )
      `)
      .eq('entity_type', 'configuration_rule')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    const { data: rules, error } = await query

    if (error) {
      console.error('Error listing configuration rules:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Filter by config_key if provided
    let filteredRules = rules || []
    if (configKey) {
      filteredRules = filteredRules.filter(rule => {
        const keyField = rule.core_dynamic_data?.find(
          (field: any) => field.field_name === 'config_key'
        )
        return keyField?.field_value === configKey
      })
    }

    // Transform rules for response
    const transformedRules = filteredRules.map(rule => {
      const dynamicFields: any = {}
      rule.core_dynamic_data?.forEach((field: any) => {
        dynamicFields[field.field_name] = 
          field.field_value_json || 
          field.field_value || 
          field.field_value_number ||
          field.field_value_boolean
      })

      return {
        id: rule.id,
        name: rule.entity_name,
        smart_code: rule.smart_code,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        ...dynamicFields
      }
    })

    return NextResponse.json({
      success: true,
      rules: transformedRules,
      count: transformedRules.length,
      organization_id: organizationId
    })

  } catch (error) {
    console.error('List configuration rules error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'List operation failed'
    }, { status: 500 })
  }
}

// Get configuration schema
function getConfigurationSchema() {
  return NextResponse.json({
    success: true,
    schema: {
      configuration_rule: {
        entity_type: 'configuration_rule',
        required_fields: ['rule_name', 'config_key', 'config_value'],
        dynamic_fields: {
          config_key: {
            type: 'string',
            description: 'The configuration key to evaluate',
            examples: ['auto_journal.batch_threshold', 'ui.theme', 'features.enable_ai']
          },
          rule_type: {
            type: 'enum',
            values: ['default', 'conditional', 'override'],
            description: 'Type of configuration rule'
          },
          priority: {
            type: 'number',
            description: 'Rule priority (higher values evaluated first)',
            default: 0
          },
          conditions: {
            type: 'json',
            description: 'Rule conditions in JSON format',
            example: {
              operator: 'and',
              conditions: [
                { field: 'industry', operator: 'equals', value: 'restaurant' },
                { field: 'amount', operator: 'greater_than', value: 1000 }
              ]
            }
          },
          config_value: {
            type: 'any',
            description: 'The configuration value (string, number, boolean, or JSON)'
          },
          is_sensitive: {
            type: 'boolean',
            description: 'Whether this configuration contains sensitive data',
            default: false
          },
          cache_ttl: {
            type: 'number',
            description: 'Cache time-to-live in seconds',
            default: 300
          }
        }
      }
    },
    operators: [
      'equals', 'not_equals', 'greater_than', 'less_than',
      'greater_than_or_equal', 'less_than_or_equal',
      'in', 'not_in', 'contains', 'starts_with', 'ends_with',
      'and', 'or'
    ],
    examples: {
      create_rule: {
        entity_type: 'configuration_rule',
        entity_name: 'Restaurant Auto-Journal Threshold',
        smart_code: 'HERA.CONFIG.AUTO_JOURNAL.THRESHOLD.RESTAURANT.v1',
        organization_id: 'org-uuid',
        dynamic_fields: [
          { field_name: 'config_key', field_value: 'auto_journal.batch_threshold' },
          { field_name: 'rule_type', field_value: 'conditional' },
          { field_name: 'priority', field_value_number: 100 },
          { 
            field_name: 'conditions', 
            field_value_json: {
              field: 'industry',
              operator: 'equals',
              value: 'restaurant'
            }
          },
          { field_name: 'config_value', field_value_number: 500 }
        ]
      },
      evaluate_config: {
        action: 'evaluate',
        organization_id: 'org-uuid',
        config_key: 'auto_journal.batch_threshold',
        context: {
          industry: 'restaurant',
          transaction_type: 'sale'
        }
      }
    }
  })
}

// Mock responses for development
function getMockConfigurationValue(query: ConfigurationQuery) {
  const mockConfigs: any = {
    'auto_journal.batch_threshold': 1000,
    'ui.theme': 'light',
    'features.enable_ai': true,
    'cashflow.update_frequency': 300,
    'api.rate_limit': 1000
  }

  return NextResponse.json({
    success: true,
    config_key: query.config_key,
    value: mockConfigs[query.config_key] || null,
    rule_applied: {
      id: 'mock-rule-001',
      name: 'Mock Configuration Rule',
      smart_code: 'HERA.CONFIG.MOCK.v1'
    },
    context: query.context,
    cache_ttl: 300,
    mode: 'mock_demonstration'
  })
}

function getMockRulesList() {
  return NextResponse.json({
    success: true,
    rules: [
      {
        id: 'mock-rule-001',
        name: 'Default Auto-Journal Threshold',
        smart_code: 'HERA.CONFIG.AUTO_JOURNAL.THRESHOLD.DEFAULT.v1',
        config_key: 'auto_journal.batch_threshold',
        rule_type: 'default',
        priority: 0,
        config_value: 1000,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'mock-rule-002',
        name: 'Restaurant Auto-Journal Threshold',
        smart_code: 'HERA.CONFIG.AUTO_JOURNAL.THRESHOLD.RESTAURANT.v1',
        config_key: 'auto_journal.batch_threshold',
        rule_type: 'conditional',
        priority: 100,
        conditions: {
          field: 'industry',
          operator: 'equals',
          value: 'restaurant'
        },
        config_value: 500,
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    count: 2,
    mode: 'mock_demonstration'
  })
}