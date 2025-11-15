#!/usr/bin/env node
/**
 * HERA Universal Tile System - Production Readiness Verification
 * Comprehensive verification suite for production deployment validation
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { performance } from 'perf_hooks'
import * as fs from 'fs/promises'
import * as path from 'path'

// Types
interface VerificationConfig {
  environment: 'development' | 'production'
  supabaseUrl: string
  supabaseKey: string
  apiBaseUrl: string
  checks: {
    database: boolean
    api: boolean
    tiles: boolean
    security: boolean
    performance: boolean
    integration: boolean
  }
  thresholds: {
    responseTime: number
    errorRate: number
    availability: number
    throughput: number
  }
}

interface VerificationResult {
  timestamp: string
  environment: string
  overall: 'ready' | 'partial' | 'not_ready'
  readinessScore: number
  categories: Record<string, {
    status: 'pass' | 'warning' | 'fail'
    score: number
    checks: Array<{
      name: string
      status: 'pass' | 'warning' | 'fail'
      message: string
      details?: any
      executionTime?: number
    }>
  }>
  recommendations: string[]
  blockers: string[]
  metrics: {
    totalChecks: number
    passedChecks: number
    warningChecks: number
    failedChecks: number
    executionTime: number
  }
}

class ProductionReadinessVerifier {
  private config: VerificationConfig
  private supabase: any
  private results: VerificationResult

  constructor(environment: 'development' | 'production' = 'production') {
    const environments = {
      development: {
        supabaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || '',
        apiBaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co/functions/v1'
      },
      production: {
        supabaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || '',
        apiBaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co/functions/v1'
      }
    }

    const env = environments[environment]
    if (!env.supabaseKey) {
      throw new Error('SUPABASE_ANON_KEY environment variable is required')
    }

    this.config = {
      environment,
      ...env,
      checks: {
        database: true,
        api: true,
        tiles: true,
        security: true,
        performance: true,
        integration: true
      },
      thresholds: environment === 'production' ? {
        responseTime: 200,
        errorRate: 1,
        availability: 99.9,
        throughput: 100
      } : {
        responseTime: 500,
        errorRate: 5,
        availability: 95,
        throughput: 50
      }
    }

    this.supabase = createClient(env.supabaseUrl, env.supabaseKey)

    this.results = {
      timestamp: new Date().toISOString(),
      environment,
      overall: 'not_ready',
      readinessScore: 0,
      categories: {},
      recommendations: [],
      blockers: [],
      metrics: {
        totalChecks: 0,
        passedChecks: 0,
        warningChecks: 0,
        failedChecks: 0,
        executionTime: 0
      }
    }
  }

  async runVerification(): Promise<VerificationResult> {
    const startTime = performance.now()
    
    console.log(`🔍 Running production readiness verification for ${this.config.environment} environment...`)
    console.log('=' * 80)

    try {
      // Run all verification categories
      if (this.config.checks.database) {
        this.results.categories.database = await this.verifyDatabase()
      }
      
      if (this.config.checks.api) {
        this.results.categories.api = await this.verifyAPI()
      }
      
      if (this.config.checks.tiles) {
        this.results.categories.tiles = await this.verifyTileSystem()
      }
      
      if (this.config.checks.security) {
        this.results.categories.security = await this.verifySecurity()
      }
      
      if (this.config.checks.performance) {
        this.results.categories.performance = await this.verifyPerformance()
      }
      
      if (this.config.checks.integration) {
        this.results.categories.integration = await this.verifyIntegration()
      }

      // Calculate overall readiness
      this.calculateReadinessScore()
      this.generateRecommendations()

      this.results.metrics.executionTime = performance.now() - startTime

      return this.results

    } catch (error: any) {
      console.error('❌ Verification failed:', error.message)
      this.results.overall = 'not_ready'
      this.results.blockers.push(`Critical verification error: ${error.message}`)
      throw error
    }
  }

  private async verifyDatabase() {
    const checks: any[] = []
    
    console.log('🗄️  Verifying database readiness...')

    // Check database connectivity
    try {
      const start = performance.now()
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('count(*)')
        .limit(1)
      
      const responseTime = performance.now() - start

      if (error) {
        checks.push({
          name: 'database_connectivity',
          status: 'fail',
          message: 'Database connection failed',
          details: error,
          executionTime: responseTime
        })
      } else if (responseTime > this.config.thresholds.responseTime) {
        checks.push({
          name: 'database_connectivity',
          status: 'warning',
          message: `Database connection slow: ${responseTime.toFixed(2)}ms`,
          executionTime: responseTime
        })
      } else {
        checks.push({
          name: 'database_connectivity',
          status: 'pass',
          message: `Database connected: ${responseTime.toFixed(2)}ms`,
          executionTime: responseTime
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'database_connectivity',
        status: 'fail',
        message: 'Database connectivity check failed',
        details: error.message
      })
    }

    // Check required tables exist
    const requiredTables = [
      'core_entities',
      'core_dynamic_data', 
      'core_relationships',
      'universal_transactions',
      'universal_transaction_lines'
    ]

    for (const table of requiredTables) {
      try {
        const { error } = await this.supabase
          .from(table)
          .select('id')
          .limit(1)

        checks.push({
          name: `table_${table}`,
          status: error ? 'fail' : 'pass',
          message: error ? `Table ${table} not accessible` : `Table ${table} accessible`,
          details: error
        })
      } catch (error: any) {
        checks.push({
          name: `table_${table}`,
          status: 'fail',
          message: `Failed to verify table ${table}`,
          details: error.message
        })
      }
    }

    // Check RPC functions
    const requiredRPCs = [
      'hera_entities_crud_v1',
      'hera_txn_crud_v1'
    ]

    for (const rpcName of requiredRPCs) {
      try {
        const start = performance.now()
        const { error } = await this.supabase.rpc(rpcName, {
          p_action: 'READ',
          p_actor_user_id: '00000000-0000-0000-0000-000000000000',
          p_organization_id: '00000000-0000-0000-0000-000000000000',
          p_entity: { entity_type: 'TEST' },
          p_dynamic: {},
          p_relationships: [],
          p_options: { limit: 1 }
        })
        const responseTime = performance.now() - start

        // RPC should exist even if it returns "no entity found" error
        if (error && !error.message.includes('No entity found') && !error.message.includes('not found')) {
          checks.push({
            name: `rpc_${rpcName}`,
            status: 'fail',
            message: `RPC ${rpcName} failed`,
            details: error,
            executionTime: responseTime
          })
        } else {
          checks.push({
            name: `rpc_${rpcName}`,
            status: 'pass',
            message: `RPC ${rpcName} available: ${responseTime.toFixed(2)}ms`,
            executionTime: responseTime
          })
        }
      } catch (error: any) {
        checks.push({
          name: `rpc_${rpcName}`,
          status: 'fail',
          message: `RPC ${rpcName} verification failed`,
          details: error.message
        })
      }
    }

    return this.scoreCategory(checks, 'Database')
  }

  private async verifyAPI() {
    const checks: any[] = []
    
    console.log('🌐 Verifying API readiness...')

    // Check API v2 endpoint
    try {
      const start = performance.now()
      const response = await fetch(`${this.config.apiBaseUrl}/api-v2/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const responseTime = performance.now() - start

      if (response.status === 404) {
        checks.push({
          name: 'api_v2_endpoint',
          status: 'warning',
          message: 'API v2 health endpoint not found, but base API may be functional',
          executionTime: responseTime
        })
      } else if (response.ok) {
        checks.push({
          name: 'api_v2_endpoint',
          status: 'pass',
          message: `API v2 endpoint accessible: ${responseTime.toFixed(2)}ms`,
          executionTime: responseTime
        })
      } else {
        checks.push({
          name: 'api_v2_endpoint',
          status: 'fail',
          message: `API v2 endpoint error: ${response.status}`,
          details: { status: response.status, statusText: response.statusText },
          executionTime: responseTime
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'api_v2_endpoint',
        status: 'fail',
        message: 'API v2 endpoint check failed',
        details: error.message
      })
    }

    // Check Edge Functions deployment
    const edgeFunctions = ['api-v2']
    
    for (const functionName of edgeFunctions) {
      try {
        const start = performance.now()
        const response = await fetch(`${this.config.apiBaseUrl}/${functionName}`, {
          method: 'GET'
        })
        const responseTime = performance.now() - start

        if (response.status === 405) {
          // Method not allowed is expected for some endpoints
          checks.push({
            name: `edge_function_${functionName}`,
            status: 'pass',
            message: `Edge Function ${functionName} deployed: ${responseTime.toFixed(2)}ms`,
            executionTime: responseTime
          })
        } else if (response.ok) {
          checks.push({
            name: `edge_function_${functionName}`,
            status: 'pass',
            message: `Edge Function ${functionName} accessible: ${responseTime.toFixed(2)}ms`,
            executionTime: responseTime
          })
        } else if (response.status === 404) {
          checks.push({
            name: `edge_function_${functionName}`,
            status: 'fail',
            message: `Edge Function ${functionName} not found`,
            details: { status: response.status }
          })
        } else {
          checks.push({
            name: `edge_function_${functionName}`,
            status: 'warning',
            message: `Edge Function ${functionName} returned ${response.status}`,
            details: { status: response.status },
            executionTime: responseTime
          })
        }
      } catch (error: any) {
        checks.push({
          name: `edge_function_${functionName}`,
          status: 'fail',
          message: `Edge Function ${functionName} check failed`,
          details: error.message
        })
      }
    }

    return this.scoreCategory(checks, 'API')
  }

  private async verifyTileSystem() {
    const checks: any[] = []
    
    console.log('🧩 Verifying tile system readiness...')

    // Check tile templates exist
    try {
      const { data: templates, error } = await this.supabase
        .from('core_entities')
        .select('id, entity_name, smart_code')
        .eq('entity_type', 'APP_TILE_TEMPLATE')

      if (error) {
        checks.push({
          name: 'tile_templates_query',
          status: 'fail',
          message: 'Failed to query tile templates',
          details: error
        })
      } else if (!templates || templates.length === 0) {
        checks.push({
          name: 'tile_templates_exist',
          status: 'fail',
          message: 'No tile templates found'
        })
      } else {
        const expectedTypes = ['ENTITIES', 'TRANSACTIONS', 'ANALYTICS', 'WORKFLOW', 'RELATIONSHIPS']
        const foundTypes = templates.map((t: any) => 
          t.entity_name || t.smart_code?.split('.')[3]
        ).filter(Boolean)

        const missingTypes = expectedTypes.filter(expected => 
          !foundTypes.some(found => found.includes(expected))
        )

        if (missingTypes.length === 0) {
          checks.push({
            name: 'tile_templates_complete',
            status: 'pass',
            message: `All ${templates.length} expected tile templates found`,
            details: { templates: templates.length, types: foundTypes }
          })
        } else {
          checks.push({
            name: 'tile_templates_complete',
            status: 'warning',
            message: `Missing tile template types: ${missingTypes.join(', ')}`,
            details: { found: foundTypes, missing: missingTypes }
          })
        }
      }
    } catch (error: any) {
      checks.push({
        name: 'tile_templates_query',
        status: 'fail',
        message: 'Tile templates verification failed',
        details: error.message
      })
    }

    // Check tile smart codes are valid
    try {
      const { data: templates } = await this.supabase
        .from('core_entities')
        .select('smart_code')
        .eq('entity_type', 'APP_TILE_TEMPLATE')
        .not('smart_code', 'is', null)

      if (templates) {
        const invalidSmartCodes = templates.filter((t: any) => {
          const smartCode = t.smart_code
          // HERA smart code pattern: HERA.DOMAIN.MODULE.TYPE.SUBTYPE.v1
          const pattern = /^HERA\.[A-Z_]+\.[A-Z_]+\.[A-Z_]+(\.[A-Z_]+)*\.v\d+$/
          return !pattern.test(smartCode)
        })

        if (invalidSmartCodes.length === 0) {
          checks.push({
            name: 'tile_smart_codes',
            status: 'pass',
            message: `All ${templates.length} tile smart codes are valid`,
            details: { validCodes: templates.length }
          })
        } else {
          checks.push({
            name: 'tile_smart_codes',
            status: 'fail',
            message: `${invalidSmartCodes.length} invalid smart codes found`,
            details: { invalid: invalidSmartCodes.map((t: any) => t.smart_code) }
          })
        }
      }
    } catch (error: any) {
      checks.push({
        name: 'tile_smart_codes',
        status: 'warning',
        message: 'Smart code validation failed',
        details: error.message
      })
    }

    // Check relationship types exist
    try {
      const { data: relationships, error } = await this.supabase
        .from('core_relationships')
        .select('relationship_type')
        .in('relationship_type', ['WORKSPACE_HAS_TILE', 'TILE_USES_TEMPLATE'])

      if (error) {
        checks.push({
          name: 'tile_relationships',
          status: 'fail',
          message: 'Failed to verify tile relationships',
          details: error
        })
      } else {
        const foundTypes = new Set(relationships.map((r: any) => r.relationship_type))
        const requiredTypes = ['WORKSPACE_HAS_TILE', 'TILE_USES_TEMPLATE']
        const missingTypes = requiredTypes.filter(type => !foundTypes.has(type))

        if (missingTypes.length === 0) {
          checks.push({
            name: 'tile_relationships',
            status: 'pass',
            message: 'All required tile relationship types found',
            details: { found: Array.from(foundTypes) }
          })
        } else {
          checks.push({
            name: 'tile_relationships',
            status: 'warning',
            message: `Missing relationship types: ${missingTypes.join(', ')}`,
            details: { missing: missingTypes }
          })
        }
      }
    } catch (error: any) {
      checks.push({
        name: 'tile_relationships',
        status: 'fail',
        message: 'Tile relationship verification failed',
        details: error.message
      })
    }

    return this.scoreCategory(checks, 'Tile System')
  }

  private async verifySecurity() {
    const checks: any[] = []
    
    console.log('🔒 Verifying security configuration...')

    // Check RLS policies exist
    try {
      const { data: policies, error } = await this.supabase
        .rpc('get_rls_policies') // This would be a custom function to check policies
        .catch(() => null) // Fallback if function doesn't exist

      if (policies && policies.length > 0) {
        checks.push({
          name: 'rls_policies',
          status: 'pass',
          message: `${policies.length} RLS policies found`,
          details: { policies: policies.length }
        })
      } else {
        checks.push({
          name: 'rls_policies',
          status: 'warning',
          message: 'Unable to verify RLS policies (function may not exist)',
          details: 'Consider adding get_rls_policies function for verification'
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'rls_policies',
        status: 'warning',
        message: 'RLS policy verification skipped',
        details: 'Custom verification function not available'
      })
    }

    // Check environment variables
    const requiredEnvVars = ['SUPABASE_ANON_KEY']
    const optionalEnvVars = ['SUPABASE_SERVICE_ROLE_KEY', 'HEALTH_CHECK_WEBHOOK_URL']

    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'pass',
          message: `Environment variable ${envVar} is set`
        })
      } else {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'fail',
          message: `Required environment variable ${envVar} is missing`
        })
      }
    })

    optionalEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'pass',
          message: `Optional environment variable ${envVar} is set`
        })
      } else {
        checks.push({
          name: `env_var_${envVar.toLowerCase()}`,
          status: 'warning',
          message: `Optional environment variable ${envVar} is not set`
        })
      }
    })

    // Check HTTPS endpoints
    const httpsCheck = this.config.supabaseUrl.startsWith('https://') && 
                       this.config.apiBaseUrl.startsWith('https://')

    checks.push({
      name: 'https_endpoints',
      status: httpsCheck ? 'pass' : 'fail',
      message: httpsCheck ? 'All endpoints use HTTPS' : 'Non-HTTPS endpoints detected',
      details: {
        supabaseUrl: this.config.supabaseUrl,
        apiBaseUrl: this.config.apiBaseUrl
      }
    })

    return this.scoreCategory(checks, 'Security')
  }

  private async verifyPerformance() {
    const checks: any[] = []
    
    console.log('⚡ Verifying performance characteristics...')

    // Database performance test
    try {
      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        await this.supabase
          .from('core_entities')
          .select('id, entity_type')
          .limit(10)
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)

      if (avgTime <= this.config.thresholds.responseTime) {
        checks.push({
          name: 'database_performance',
          status: 'pass',
          message: `Database performance good: ${avgTime.toFixed(2)}ms avg`,
          details: { average: avgTime, maximum: maxTime, iterations },
          executionTime: avgTime
        })
      } else {
        checks.push({
          name: 'database_performance',
          status: 'warning',
          message: `Database performance slow: ${avgTime.toFixed(2)}ms avg`,
          details: { average: avgTime, maximum: maxTime, threshold: this.config.thresholds.responseTime },
          executionTime: avgTime
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'database_performance',
        status: 'fail',
        message: 'Database performance test failed',
        details: error.message
      })
    }

    // Concurrent load test
    try {
      const concurrentRequests = 10
      const start = performance.now()
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        this.supabase
          .from('core_entities')
          .select('count(*)')
          .limit(1)
      )

      const results = await Promise.allSettled(promises)
      const totalTime = performance.now() - start
      const successCount = results.filter(r => r.status === 'fulfilled').length

      const successRate = (successCount / concurrentRequests) * 100
      
      if (successRate >= this.config.thresholds.availability) {
        checks.push({
          name: 'concurrent_load',
          status: 'pass',
          message: `Concurrent load test passed: ${successRate}% success rate`,
          details: { 
            successRate, 
            totalTime, 
            concurrentRequests,
            throughput: concurrentRequests / (totalTime / 1000)
          },
          executionTime: totalTime
        })
      } else {
        checks.push({
          name: 'concurrent_load',
          status: 'warning',
          message: `Concurrent load test degraded: ${successRate}% success rate`,
          details: { successRate, threshold: this.config.thresholds.availability },
          executionTime: totalTime
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'concurrent_load',
        status: 'fail',
        message: 'Concurrent load test failed',
        details: error.message
      })
    }

    return this.scoreCategory(checks, 'Performance')
  }

  private async verifyIntegration() {
    const checks: any[] = []
    
    console.log('🔗 Verifying integration points...')

    // Test end-to-end tile workflow
    try {
      const start = performance.now()
      
      // 1. Query tile templates
      const { data: templates, error: templateError } = await this.supabase
        .from('core_entities')
        .select('id, entity_name, smart_code')
        .eq('entity_type', 'APP_TILE_TEMPLATE')
        .limit(1)

      if (templateError) throw templateError

      if (templates && templates.length > 0) {
        // 2. Query dynamic data for template
        const { data: dynamicData, error: dynamicError } = await this.supabase
          .from('core_dynamic_data')
          .select('field_name, field_value_json')
          .eq('entity_id', templates[0].id)
          .limit(5)

        // Dynamic data might not exist, so this is not a failure
        
        const executionTime = performance.now() - start
        
        checks.push({
          name: 'tile_workflow',
          status: 'pass',
          message: `Tile workflow integration working: ${executionTime.toFixed(2)}ms`,
          details: {
            templatesFound: templates.length,
            dynamicFieldsFound: dynamicData?.length || 0
          },
          executionTime
        })
      } else {
        checks.push({
          name: 'tile_workflow',
          status: 'fail',
          message: 'No tile templates found for integration test'
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'tile_workflow',
        status: 'fail',
        message: 'Tile workflow integration test failed',
        details: error.message
      })
    }

    // Test cross-table relationships
    try {
      const { data: relationships, error } = await this.supabase
        .from('core_relationships')
        .select('from_entity_id, to_entity_id, relationship_type')
        .limit(5)

      if (error) throw error

      checks.push({
        name: 'cross_table_relationships',
        status: 'pass',
        message: `Cross-table relationships accessible: ${relationships?.length || 0} found`
      })
    } catch (error: any) {
      checks.push({
        name: 'cross_table_relationships',
        status: 'warning',
        message: 'Cross-table relationship test failed',
        details: error.message
      })
    }

    return this.scoreCategory(checks, 'Integration')
  }

  private scoreCategory(checks: any[], categoryName: string) {
    const passCount = checks.filter(c => c.status === 'pass').length
    const warnCount = checks.filter(c => c.status === 'warning').length
    const failCount = checks.filter(c => c.status === 'fail').length
    
    const totalChecks = checks.length
    const score = totalChecks > 0 ? 
      ((passCount * 100) + (warnCount * 60)) / totalChecks : 0

    let status: 'pass' | 'warning' | 'fail'
    if (failCount > 0) {
      status = 'fail'
    } else if (warnCount > totalChecks / 2) {
      status = 'warning'
    } else {
      status = 'pass'
    }

    console.log(`  ${categoryName}: ${status.toUpperCase()} (${score.toFixed(1)}% - ${passCount}P/${warnCount}W/${failCount}F)`)

    return {
      status,
      score,
      checks
    }
  }

  private calculateReadinessScore() {
    const categories = Object.values(this.results.categories)
    let totalScore = 0
    let weightedScore = 0
    
    // Calculate metrics
    this.results.metrics.totalChecks = categories.reduce((sum, cat) => sum + cat.checks.length, 0)
    this.results.metrics.passedChecks = categories.reduce((sum, cat) => 
      sum + cat.checks.filter(c => c.status === 'pass').length, 0)
    this.results.metrics.warningChecks = categories.reduce((sum, cat) => 
      sum + cat.checks.filter(c => c.status === 'warning').length, 0)
    this.results.metrics.failedChecks = categories.reduce((sum, cat) => 
      sum + cat.checks.filter(c => c.status === 'fail').length, 0)

    // Weight categories by importance
    const weights = {
      database: 25,    // Critical
      api: 20,         // Critical
      tiles: 20,       // High
      security: 15,    // High
      performance: 10, // Medium
      integration: 10  // Medium
    }

    let totalWeight = 0
    
    Object.entries(this.results.categories).forEach(([category, result]) => {
      const weight = weights[category as keyof typeof weights] || 10
      totalScore += result.score * weight
      totalWeight += weight
    })

    this.results.readinessScore = totalWeight > 0 ? totalScore / totalWeight : 0

    // Determine overall readiness
    if (this.results.readinessScore >= 90 && this.results.metrics.failedChecks === 0) {
      this.results.overall = 'ready'
    } else if (this.results.readinessScore >= 70 && this.results.metrics.failedChecks <= 2) {
      this.results.overall = 'partial'
    } else {
      this.results.overall = 'not_ready'
    }
  }

  private generateRecommendations() {
    const { categories, metrics } = this.results

    // Critical blockers
    Object.entries(categories).forEach(([category, result]) => {
      const failedChecks = result.checks.filter(c => c.status === 'fail')
      failedChecks.forEach(check => {
        this.results.blockers.push(`${category}: ${check.message}`)
      })
    })

    // General recommendations
    if (metrics.failedChecks > 0) {
      this.results.recommendations.push(`🚨 Fix ${metrics.failedChecks} critical issues before deployment`)
    }

    if (metrics.warningChecks > 0) {
      this.results.recommendations.push(`⚠️ Address ${metrics.warningChecks} warning issues for optimal performance`)
    }

    if (this.results.readinessScore < 85) {
      this.results.recommendations.push('📊 Overall readiness score below recommended threshold (85%)')
    }

    // Category-specific recommendations
    if (categories.database?.status === 'fail') {
      this.results.recommendations.push('🗄️ Database issues detected - verify connection and schema')
    }

    if (categories.api?.status === 'fail') {
      this.results.recommendations.push('🌐 API deployment issues - check Edge Functions deployment')
    }

    if (categories.tiles?.status === 'fail') {
      this.results.recommendations.push('🧩 Tile system not ready - run tile template seeding')
    }

    if (categories.security?.status === 'fail') {
      this.results.recommendations.push('🔒 Security configuration incomplete - check environment variables')
    }

    if (categories.performance?.score < 70) {
      this.results.recommendations.push('⚡ Performance optimization needed - consider scaling resources')
    }

    // Add positive feedback if ready
    if (this.results.overall === 'ready') {
      this.results.recommendations.push('✅ System is ready for production deployment!')
    }
  }

  async generateDetailedReport(): Promise<string> {
    const results = await this.runVerification()
    
    const statusEmoji = {
      ready: '✅',
      partial: '⚠️',
      not_ready: '❌'
    }

    const categoryEmojis = {
      database: '🗄️',
      api: '🌐',
      tiles: '🧩',
      security: '🔒',
      performance: '⚡',
      integration: '🔗'
    }

    let report = `
# HERA Tile System - Production Readiness Report

**Environment:** ${results.environment}
**Timestamp:** ${results.timestamp}
**Overall Status:** ${statusEmoji[results.overall]} ${results.overall.toUpperCase()}
**Readiness Score:** ${results.readinessScore.toFixed(1)}%

## Summary

- **Total Checks:** ${results.metrics.totalChecks}
- **Passed:** ${results.metrics.passedChecks} ✅
- **Warnings:** ${results.metrics.warningChecks} ⚠️
- **Failed:** ${results.metrics.failedChecks} ❌
- **Execution Time:** ${results.metrics.executionTime.toFixed(2)}ms

## Category Results

${Object.entries(results.categories).map(([category, result]) => {
  const emoji = categoryEmojis[category as keyof typeof categoryEmojis] || '🔧'
  const statusEmoji = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
  
  return `### ${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}
**Status:** ${statusEmoji} ${result.status.toUpperCase()}
**Score:** ${result.score.toFixed(1)}%

${result.checks.map(check => {
  const checkEmoji = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
  let line = `- ${checkEmoji} **${check.name}**: ${check.message}`
  if (check.executionTime) {
    line += ` (${check.executionTime.toFixed(2)}ms)`
  }
  return line
}).join('\n')}
`
}).join('\n')}

${results.blockers.length > 0 ? `## 🚨 Critical Blockers

${results.blockers.map(blocker => `- ❌ ${blocker}`).join('\n')}
` : ''}

## 📋 Recommendations

${results.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by HERA Production Readiness Verifier*
    `

    return report.trim()
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const environment = (args[0] || process.env.NODE_ENV || 'production') as 'development' | 'production'
  
  const verifier = new ProductionReadinessVerifier(environment)

  try {
    if (args.includes('--report')) {
      const report = await verifier.generateDetailedReport()
      console.log(report)
      
      // Save report to file
      const reportsDir = path.join(process.cwd(), 'reports')
      await fs.mkdir(reportsDir, { recursive: true })
      
      const filename = `production-readiness-${environment}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
      const filepath = path.join(reportsDir, filename)
      
      await fs.writeFile(filepath, report, 'utf8')
      console.log(`\n📄 Detailed report saved to: ${filepath}`)
      
    } else {
      const results = await verifier.runVerification()
      
      console.log('\n' + '=' * 60)
      console.log(`🎯 PRODUCTION READINESS SUMMARY`)
      console.log('=' * 60)
      console.log(`Environment: ${results.environment}`)
      console.log(`Overall Status: ${results.overall.toUpperCase()}`)
      console.log(`Readiness Score: ${results.readinessScore.toFixed(1)}%`)
      console.log(`Total Checks: ${results.metrics.totalChecks} (${results.metrics.passedChecks}P/${results.metrics.warningChecks}W/${results.metrics.failedChecks}F)`)
      
      if (results.blockers.length > 0) {
        console.log('\n🚨 CRITICAL BLOCKERS:')
        results.blockers.forEach(blocker => console.log(`  - ${blocker}`))
      }
      
      if (results.recommendations.length > 0) {
        console.log('\n📋 RECOMMENDATIONS:')
        results.recommendations.slice(0, 5).forEach(rec => console.log(`  - ${rec}`))
        
        if (results.recommendations.length > 5) {
          console.log(`  ... and ${results.recommendations.length - 5} more (use --report for full list)`)
        }
      }
      
      console.log('=' * 60)

      // Exit with appropriate code
      if (results.overall === 'not_ready') {
        process.exit(1)
      } else if (results.overall === 'partial') {
        process.exit(2)
      } else {
        process.exit(0)
      }
    }
    
  } catch (error: any) {
    console.error('❌ Production readiness verification failed:', error.message)
    process.exit(1)
  }
}

// Export for programmatic use
export { ProductionReadinessVerifier, type VerificationConfig, type VerificationResult }

// Run if called directly
if (require.main === module) {
  main()
}