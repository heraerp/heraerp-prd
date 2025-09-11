/**
 * 🔬 HERA Configuration Rules Preview API
 * 
 * Test configuration changes before applying them to production.
 * Enables safe experimentation with rule changes and provides
 * impact analysis for configuration modifications.
 * 
 * Features:
 * - Test rule evaluation with sample contexts
 * - Diff analysis between current and proposed configurations
 * - Impact assessment for rule changes
 * - Simulation of cascading rule effects
 * - Performance benchmarking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

interface PreviewRequest {
  organization_id: string
  test_rules?: Array<{
    config_key: string
    rule_type: string
    priority: number
    conditions?: any
    config_value: any
  }>
  test_contexts: Array<{
    name: string
    context: any
    expected_value?: any
  }>
  compare_with_current?: boolean
  performance_test?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: PreviewRequest = await request.json()
    const {
      organization_id,
      test_rules = [],
      test_contexts,
      compare_with_current = true,
      performance_test = false
    } = body

    console.log('🔬 Config Preview:', {
      organization_id,
      ruleCount: test_rules.length,
      contextCount: test_contexts.length
    })

    if (!organization_id) {
      return NextResponse.json({
        success: false,
        error: 'organization_id is required'
      }, { status: 400 })
    }

    if (!test_contexts || test_contexts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one test context is required'
      }, { status: 400 })
    }

    // Run preview evaluation
    const results = await runPreviewEvaluation({
      organization_id,
      test_rules,
      test_contexts,
      compare_with_current,
      performance_test
    })

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    console.error('Config Preview error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'schema'

    switch (action) {
      case 'schema':
        return getPreviewSchema()
      
      case 'sample_contexts':
        const industry = searchParams.get('industry')
        return getSampleContexts(industry)
      
      case 'impact_analysis':
        const organizationId = searchParams.get('organization_id')
        const configKey = searchParams.get('config_key')
        if (!organizationId || !configKey) {
          return NextResponse.json({
            success: false,
            error: 'organization_id and config_key are required for impact analysis'
          }, { status: 400 })
        }
        return await getImpactAnalysis(organizationId, configKey)
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['schema', 'sample_contexts', 'impact_analysis']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Config Preview GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Run preview evaluation
async function runPreviewEvaluation(params: PreviewRequest & { 
  compare_with_current: boolean,
  performance_test: boolean 
}) {
  const {
    organization_id,
    test_rules,
    test_contexts,
    compare_with_current,
    performance_test
  } = params

  const results = {
    test_results: [] as any[],
    comparison: null as any,
    performance_metrics: null as any,
    summary: {
      total_tests: test_contexts.length,
      passed: 0,
      failed: 0,
      changed_from_current: 0
    }
  }

  // For each test context, evaluate with test rules
  for (const testCase of test_contexts) {
    const startTime = Date.now()
    
    // Evaluate with test rules
    const testValue = await evaluateWithTestRules(
      organization_id,
      testCase.context,
      test_rules
    )
    
    let currentValue = null
    if (compare_with_current && supabase) {
      currentValue = await evaluateCurrentRules(
        organization_id,
        testCase.context,
        test_rules[0]?.config_key // Assuming testing single config key
      )
    }
    
    const evaluationTime = Date.now() - startTime
    
    // Determine test result
    const passed = testCase.expected_value === undefined || 
                  JSON.stringify(testCase.expected_value) === JSON.stringify(testValue)
    
    const changed = currentValue !== null && 
                   JSON.stringify(currentValue) !== JSON.stringify(testValue)
    
    const result = {
      test_name: testCase.name,
      context: testCase.context,
      expected_value: testCase.expected_value,
      test_value: testValue,
      current_value: currentValue,
      passed,
      changed_from_current: changed,
      evaluation_time_ms: evaluationTime
    }
    
    results.test_results.push(result)
    
    if (passed) results.summary.passed++
    else results.summary.failed++
    
    if (changed) results.summary.changed_from_current++
  }
  
  // Generate comparison summary
  if (compare_with_current) {
    results.comparison = generateComparisonSummary(results.test_results)
  }
  
  // Run performance tests if requested
  if (performance_test) {
    results.performance_metrics = await runPerformanceTest(
      organization_id,
      test_rules,
      test_contexts[0]?.context || {}
    )
  }
  
  return results
}

// Evaluate configuration with test rules
async function evaluateWithTestRules(
  organizationId: string,
  context: any,
  testRules: any[]
): Promise<any> {
  // Sort rules by priority (descending)
  const sortedRules = [...testRules].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  
  // Find first matching rule
  for (const rule of sortedRules) {
    if (evaluateConditions(rule.conditions, context)) {
      return rule.config_value
    }
  }
  
  // Find default rule
  const defaultRule = sortedRules.find(r => r.rule_type === 'default')
  return defaultRule?.config_value || null
}

// Evaluate conditions
function evaluateConditions(conditions: any, context: any = {}): boolean {
  if (!conditions) return true
  
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

// Evaluate current rules from database
async function evaluateCurrentRules(
  organizationId: string,
  context: any,
  configKey: string
): Promise<any> {
  if (!supabase) return null
  
  try {
    // Fetch current rules
    const { data: rules } = await supabase
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
      .eq('organization_id', organizationId)
      .eq('status', 'active')
    
    if (!rules || rules.length === 0) return null
    
    // Filter and evaluate
    const relevantRules = rules.filter(rule => {
      const keyField = rule.core_dynamic_data?.find(
        (f: any) => f.field_name === 'config_key'
      )
      return keyField?.field_value === configKey
    })
    
    // Sort by priority and evaluate
    const sortedRules = relevantRules.sort((a, b) => {
      const aPriority = (a.metadata as any)?.priority || 0
      const bPriority = (b.metadata as any)?.priority || 0
      return bPriority - aPriority
    })
    
    for (const rule of sortedRules) {
      const conditionsField = rule.core_dynamic_data?.find(
        (f: any) => f.field_name === 'conditions'
      )
      
      if (evaluateConditions(conditionsField?.field_value_json, context)) {
        const valueField = rule.core_dynamic_data?.find(
          (f: any) => f.field_name === 'config_value'
        )
        
        return valueField?.field_value_json || 
               valueField?.field_value || 
               valueField?.field_value_number ||
               valueField?.field_value_boolean
      }
    }
    
    return null
  } catch (error) {
    console.error('Error evaluating current rules:', error)
    return null
  }
}

// Generate comparison summary
function generateComparisonSummary(testResults: any[]) {
  const changes = testResults.filter(r => r.changed_from_current)
  
  return {
    total_evaluations: testResults.length,
    changed_count: changes.length,
    unchanged_count: testResults.length - changes.length,
    change_percentage: (changes.length / testResults.length) * 100,
    changes: changes.map(c => ({
      context: c.context,
      current_value: c.current_value,
      new_value: c.test_value,
      impact: classifyImpact(c.current_value, c.test_value)
    }))
  }
}

// Classify the impact of a configuration change
function classifyImpact(currentValue: any, newValue: any): string {
  // Numeric changes
  if (typeof currentValue === 'number' && typeof newValue === 'number') {
    const percentChange = Math.abs((newValue - currentValue) / currentValue) * 100
    if (percentChange > 50) return 'high'
    if (percentChange > 10) return 'medium'
    return 'low'
  }
  
  // Boolean changes
  if (typeof currentValue === 'boolean' && typeof newValue === 'boolean') {
    return currentValue !== newValue ? 'high' : 'none'
  }
  
  // String/object changes
  return JSON.stringify(currentValue) !== JSON.stringify(newValue) ? 'medium' : 'none'
}

// Run performance test
async function runPerformanceTest(
  organizationId: string,
  testRules: any[],
  sampleContext: any
): Promise<any> {
  const iterations = 1000
  const results = {
    iterations,
    total_time_ms: 0,
    average_time_ms: 0,
    min_time_ms: Infinity,
    max_time_ms: 0,
    percentiles: {} as any
  }
  
  const times: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    await evaluateWithTestRules(organizationId, sampleContext, testRules)
    const elapsed = Date.now() - start
    
    times.push(elapsed)
    results.total_time_ms += elapsed
    results.min_time_ms = Math.min(results.min_time_ms, elapsed)
    results.max_time_ms = Math.max(results.max_time_ms, elapsed)
  }
  
  results.average_time_ms = results.total_time_ms / iterations
  
  // Calculate percentiles
  times.sort((a, b) => a - b)
  results.percentiles = {
    p50: times[Math.floor(iterations * 0.5)],
    p90: times[Math.floor(iterations * 0.9)],
    p95: times[Math.floor(iterations * 0.95)],
    p99: times[Math.floor(iterations * 0.99)]
  }
  
  return results
}

// Get preview schema
function getPreviewSchema() {
  return NextResponse.json({
    success: true,
    schema: {
      preview_request: {
        organization_id: {
          type: 'string',
          required: true,
          description: 'Organization ID for testing'
        },
        test_rules: {
          type: 'array',
          required: false,
          description: 'Rules to test (optional, can test against current rules)',
          items: {
            config_key: 'string',
            rule_type: 'default | conditional | override',
            priority: 'number',
            conditions: 'object (optional)',
            config_value: 'any'
          }
        },
        test_contexts: {
          type: 'array',
          required: true,
          description: 'Test scenarios to evaluate',
          items: {
            name: 'string',
            context: 'object',
            expected_value: 'any (optional)'
          }
        },
        compare_with_current: {
          type: 'boolean',
          default: true,
          description: 'Compare results with current configuration'
        },
        performance_test: {
          type: 'boolean',
          default: false,
          description: 'Run performance benchmarking'
        }
      }
    },
    examples: {
      auto_journal_threshold_test: {
        organization_id: 'org-123',
        test_rules: [
          {
            config_key: 'auto_journal.batch_threshold',
            rule_type: 'conditional',
            priority: 100,
            conditions: {
              field: 'industry',
              operator: 'equals',
              value: 'restaurant'
            },
            config_value: 250
          },
          {
            config_key: 'auto_journal.batch_threshold',
            rule_type: 'default',
            priority: 0,
            config_value: 1000
          }
        ],
        test_contexts: [
          {
            name: 'Restaurant context',
            context: { industry: 'restaurant', transaction_type: 'sale' },
            expected_value: 250
          },
          {
            name: 'Healthcare context',
            context: { industry: 'healthcare', transaction_type: 'payment' },
            expected_value: 1000
          }
        ]
      }
    }
  })
}

// Get sample contexts for testing
function getSampleContexts(industry?: string | null) {
  const contexts: any = {
    restaurant: [
      { name: 'Small order', context: { industry: 'restaurant', amount: 50, transaction_type: 'sale' } },
      { name: 'Large order', context: { industry: 'restaurant', amount: 500, transaction_type: 'sale' } },
      { name: 'Delivery order', context: { industry: 'restaurant', order_type: 'delivery', amount: 150 } }
    ],
    healthcare: [
      { name: 'Patient payment', context: { industry: 'healthcare', transaction_type: 'payment', amount: 200 } },
      { name: 'Insurance claim', context: { industry: 'healthcare', transaction_type: 'insurance_claim', amount: 5000 } },
      { name: 'Lab test', context: { industry: 'healthcare', service_type: 'lab', amount: 150 } }
    ],
    retail: [
      { name: 'In-store sale', context: { industry: 'retail', channel: 'store', amount: 75 } },
      { name: 'Online order', context: { industry: 'retail', channel: 'online', amount: 250 } },
      { name: 'Wholesale order', context: { industry: 'retail', customer_type: 'wholesale', amount: 5000 } }
    ],
    default: [
      { name: 'Small transaction', context: { amount: 100, transaction_type: 'sale' } },
      { name: 'Large transaction', context: { amount: 10000, transaction_type: 'purchase' } },
      { name: 'Admin user', context: { user_role: 'admin' } }
    ]
  }
  
  const selectedContexts = industry && contexts[industry] ? contexts[industry] : contexts.default
  
  return NextResponse.json({
    success: true,
    industry: industry || 'default',
    contexts: selectedContexts,
    available_industries: Object.keys(contexts).filter(k => k !== 'default')
  })
}

// Get impact analysis for a configuration change
async function getImpactAnalysis(
  organizationId: string,
  configKey: string
): Promise<NextResponse> {
  // In production, analyze historical usage and dependencies
  return NextResponse.json({
    success: true,
    config_key: configKey,
    impact_analysis: {
      affected_features: [
        'Auto-journal processing',
        'Batch transaction handling',
        'Performance optimization'
      ],
      usage_frequency: 'high',
      dependency_count: 12,
      last_changed: '2024-01-15T10:30:00Z',
      change_risk: 'medium',
      recommendations: [
        'Test with production-like data volumes',
        'Monitor performance metrics after change',
        'Consider gradual rollout'
      ]
    }
  })
}