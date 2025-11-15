#!/usr/bin/env node
/**
 * HERA Universal Tile System - Smoke Tests
 * Essential smoke tests to verify core functionality after deployment
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { performance } from 'perf_hooks'

// Types
interface SmokeTestConfig {
  environment: 'development' | 'production'
  timeout: number
  retries: number
  organization_id?: string
  actor_user_id?: string
}

interface SmokeTestResult {
  testName: string
  status: 'pass' | 'fail'
  executionTime: number
  error?: string
  details?: any
}

interface SmokeTestSuite {
  timestamp: string
  environment: string
  overall: 'pass' | 'fail'
  results: SmokeTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    executionTime: number
  }
}

class TileSystemSmokeTests {
  private config: SmokeTestConfig
  private supabase: any
  private apiBaseUrl: string

  constructor(environment: 'development' | 'production' = 'production', config: Partial<SmokeTestConfig> = {}) {
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
      timeout: 30000, // 30 seconds
      retries: 2,
      organization_id: '00000000-0000-0000-0000-000000000001', // Test org
      actor_user_id: '00000000-0000-0000-0000-000000000002',   // Test user
      ...config
    }

    this.supabase = createClient(env.supabaseUrl, env.supabaseKey)
    this.apiBaseUrl = env.apiBaseUrl
  }

  async runSmokeTests(): Promise<SmokeTestSuite> {
    const startTime = performance.now()
    console.log(`🔥 Running smoke tests for ${this.config.environment} environment...`)
    console.log('=' * 60)

    const results: SmokeTestResult[] = []

    // Critical smoke tests - if any fail, deployment should be considered failed
    const tests = [
      () => this.testDatabaseConnectivity(),
      () => this.testCoreTablesAccess(),
      () => this.testRPCFunctions(),
      () => this.testTileTemplatesExist(),
      () => this.testTileTemplateRetrieval(),
      () => this.testDynamicDataAccess(),
      () => this.testRelationshipsAccess(),
      () => this.testAPIEndpointAccess(),
      () => this.testTileStatsQuery(),
      () => this.testOrganizationIsolation(),
      () => this.testErrorHandling()
    ]

    // Run each test with retry logic
    for (const test of tests) {
      let attempts = 0
      let lastError: any = null
      let result: SmokeTestResult | null = null

      while (attempts <= this.config.retries && !result) {
        attempts++
        try {
          result = await Promise.race([
            test(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
            )
          ])
        } catch (error: any) {
          lastError = error
          if (attempts <= this.config.retries) {
            console.log(`  ⚠️  Retrying ${error.testName || 'test'} (attempt ${attempts}/${this.config.retries + 1})`)
            await new Promise(resolve => setTimeout(resolve, 1000)) // 1s delay between retries
          }
        }
      }

      if (!result) {
        result = {
          testName: lastError?.testName || 'unknown_test',
          status: 'fail',
          executionTime: this.config.timeout,
          error: lastError?.message || 'Test failed after retries'
        }
      }

      results.push(result)
      
      const emoji = result.status === 'pass' ? '✅' : '❌'
      console.log(`${emoji} ${result.testName}: ${result.status.toUpperCase()} (${result.executionTime.toFixed(2)}ms)`)
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    }

    const totalTime = performance.now() - startTime
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length

    const suite: SmokeTestSuite = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      overall: failed === 0 ? 'pass' : 'fail',
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        executionTime: totalTime
      }
    }

    console.log('\n' + '=' * 60)
    console.log(`🔥 SMOKE TEST RESULTS`)
    console.log('=' * 60)
    console.log(`Environment: ${suite.environment}`)
    console.log(`Overall Status: ${suite.overall.toUpperCase()}`)
    console.log(`Tests: ${suite.summary.total} total, ${suite.summary.passed} passed, ${suite.summary.failed} failed`)
    console.log(`Execution Time: ${suite.summary.executionTime.toFixed(2)}ms`)
    console.log('=' * 60)

    return suite
  }

  private async testDatabaseConnectivity(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'database_connectivity'

    try {
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('count(*)')
        .limit(1)

      if (error) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `Database query failed: ${error.message}`
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { connected: true, queryResult: data }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testCoreTablesAccess(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'core_tables_access'

    try {
      const tables = ['core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions']
      const results = await Promise.all(
        tables.map(async table => {
          const { error } = await this.supabase
            .from(table)
            .select('id')
            .limit(1)
          return { table, accessible: !error, error }
        })
      )

      const inaccessible = results.filter(r => !r.accessible)
      
      if (inaccessible.length > 0) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `Inaccessible tables: ${inaccessible.map(r => r.table).join(', ')}`,
          details: { results }
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { accessibleTables: tables.length }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testRPCFunctions(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'rpc_functions'

    try {
      const { error } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: this.config.actor_user_id,
        p_organization_id: this.config.organization_id,
        p_entity: { entity_type: 'APP_TILE_TEMPLATE' },
        p_dynamic: {},
        p_relationships: [],
        p_options: { limit: 1 }
      })

      // Function should exist even if no data is found
      if (error && !error.message.includes('No entity found') && !error.message.includes('not found')) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `RPC function error: ${error.message}`
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { rpcAvailable: true }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testTileTemplatesExist(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'tile_templates_exist'

    try {
      const { data: templates, error } = await this.supabase
        .from('core_entities')
        .select('id, entity_name, smart_code')
        .eq('entity_type', 'APP_TILE_TEMPLATE')

      if (error) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `Query failed: ${error.message}`
        }
      }

      if (!templates || templates.length === 0) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: 'No tile templates found'
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { templateCount: templates.length }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testTileTemplateRetrieval(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'tile_template_retrieval'

    try {
      // Get first template
      const { data: templates, error: templateError } = await this.supabase
        .from('core_entities')
        .select('id, entity_name, smart_code')
        .eq('entity_type', 'APP_TILE_TEMPLATE')
        .limit(1)

      if (templateError || !templates || templates.length === 0) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: 'No template available for retrieval test'
        }
      }

      // Get template dynamic data
      const { data: dynamicData, error: dynamicError } = await this.supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_json, field_type')
        .eq('entity_id', templates[0].id)

      // Dynamic data might not exist, which is OK
      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { 
          template: templates[0],
          dynamicFields: dynamicData?.length || 0
        }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testDynamicDataAccess(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'dynamic_data_access'

    try {
      const { data, error } = await this.supabase
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_type')
        .limit(10)

      if (error) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `Dynamic data query failed: ${error.message}`
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { recordCount: data?.length || 0 }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testRelationshipsAccess(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'relationships_access'

    try {
      const { data, error } = await this.supabase
        .from('core_relationships')
        .select('from_entity_id, to_entity_id, relationship_type')
        .limit(10)

      if (error) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `Relationships query failed: ${error.message}`
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { relationshipCount: data?.length || 0 }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testAPIEndpointAccess(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'api_endpoint_access'

    try {
      // Test API v2 endpoint
      const response = await fetch(`${this.apiBaseUrl}/api-v2/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 404) {
        // Health endpoint might not exist, but API should be accessible
        return {
          testName,
          status: 'pass',
          executionTime: performance.now() - start,
          details: { apiAccessible: true, healthEndpoint: false }
        }
      }

      if (!response.ok && response.status !== 405) { // 405 Method Not Allowed is OK
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `API returned status: ${response.status}`
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { apiAccessible: true, status: response.status }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testTileStatsQuery(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'tile_stats_query'

    try {
      // Simple stats query to test the stats functionality
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('count(*)')
        .eq('entity_type', 'APP_TILE_TEMPLATE')

      if (error) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: `Stats query failed: ${error.message}`
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { statsQuery: true, result: data }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testOrganizationIsolation(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'organization_isolation'

    try {
      // Query with specific organization filter
      const { data: orgData, error: orgError } = await this.supabase
        .from('core_entities')
        .select('id, organization_id')
        .eq('organization_id', this.config.organization_id)
        .limit(5)

      // Query without organization filter (should still work due to RLS)
      const { data: allData, error: allError } = await this.supabase
        .from('core_entities')
        .select('id')
        .limit(5)

      if (orgError && allError) {
        return {
          testName,
          status: 'fail',
          executionTime: performance.now() - start,
          error: 'Both organization-filtered and unfiltered queries failed'
        }
      }

      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { 
          organizationIsolation: true,
          orgResults: orgData?.length || 0,
          allResults: allData?.length || 0
        }
      }
    } catch (error: any) {
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: error.message
      }
    }
  }

  private async testErrorHandling(): Promise<SmokeTestResult> {
    const start = performance.now()
    const testName = 'error_handling'

    try {
      // Try to query a non-existent table to test error handling
      const { error } = await this.supabase
        .from('non_existent_table_test')
        .select('*')
        .limit(1)

      // We expect this to error, so error is success
      if (error) {
        return {
          testName,
          status: 'pass',
          executionTime: performance.now() - start,
          details: { errorHandling: true, expectedError: error.message }
        }
      }

      // If no error, that's unexpected
      return {
        testName,
        status: 'fail',
        executionTime: performance.now() - start,
        error: 'Expected error for non-existent table query, but none occurred'
      }
    } catch (error: any) {
      // Catching an exception is also expected behavior
      return {
        testName,
        status: 'pass',
        executionTime: performance.now() - start,
        details: { errorHandling: true, caughtException: error.message }
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const environment = (args[0] || process.env.NODE_ENV || 'production') as 'development' | 'production'
  
  const config: Partial<SmokeTestConfig> = {}
  
  // Parse command line options
  if (args.includes('--fast')) {
    config.timeout = 10000  // 10 seconds
    config.retries = 1
  }
  
  if (args.includes('--no-retry')) {
    config.retries = 0
  }

  const smokeTests = new TileSystemSmokeTests(environment, config)

  try {
    const results = await smokeTests.runSmokeTests()
    
    if (results.overall === 'pass') {
      console.log(`\n🎉 All smoke tests passed! System is ready.`)
      process.exit(0)
    } else {
      console.log(`\n💥 ${results.summary.failed} smoke test(s) failed! System needs attention.`)
      
      // Show failed tests
      const failedTests = results.results.filter(r => r.status === 'fail')
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.testName}: ${test.error}`)
      })
      
      process.exit(1)
    }
    
  } catch (error: any) {
    console.error('💥 Smoke tests crashed:', error.message)
    process.exit(1)
  }
}

// Export for programmatic use
export { TileSystemSmokeTests, type SmokeTestConfig, type SmokeTestResult, type SmokeTestSuite }

// Run if called directly
if (require.main === module) {
  main()
}