#!/usr/bin/env npx tsx

/**
 * Comprehensive test to check availability of ALL V2 RPC CRUD functions
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80))
  log(title, 'bright')
  console.log('='.repeat(80))
}

// Define all expected V2 RPC functions by category
const functionCategories = {
  'Entity CRUD': [
    'hera_entity_upsert_v1',
    'hera_entity_read_v1',
    'hera_entity_delete_v1',
    'hera_entity_query_v1',
    'hera_entity_recover_v1',
    'hera_entity_batch_v1',
    'hera_entity_exists_v1'
  ],
  'Dynamic Data CRUD': [
    'hera_dynamic_data_upsert_v1',
    'hera_dynamic_data_read_v1',
    'hera_dynamic_data_delete_v1',
    'hera_dynamic_data_query_v1',
    'hera_dynamic_data_set_v1',
    'hera_dynamic_data_get_v1',
    'hera_dynamic_data_batch_v1'
  ],
  'Relationship CRUD': [
    'hera_relationship_upsert_v1',
    'hera_relationship_read_v1',
    'hera_relationship_delete_v1',
    'hera_relationship_query_v1',
    'hera_relationship_upsert_batch_v1',
    'hera_relationship_exists_v1'
  ],
  'Transaction CRUD': [
    'hera_txn_emit_v1',
    'hera_txn_read_v1',
    'hera_txn_query_v1',
    'hera_txn_reverse_v1',
    'hera_txn_validate_v1',
    'hera_txn_update_v1',
    'hera_txn_delete_v1'
  ],
  'Helper Functions': [
    'hera_validate_smart_code',
    'hera_assert_txn_org',
    'fn_dynamic_fields_json',
    'fn_dynamic_fields_select',
    'hera_can_access_org'
  ]
}

interface FunctionTestResult {
  name: string
  exists: boolean
  error?: string
  responseType?: string
}

async function testFunction(funcName: string): Promise<FunctionTestResult> {
  try {
    // Try to call the function with minimal/empty parameters
    // This should either:
    // 1. Return an error about missing params (function exists)
    // 2. Return "Could not find function" (function doesn't exist)
    // 3. Actually execute with empty params (unlikely but possible)

    const { data, error } = await supabase.rpc(funcName, {})

    if (error) {
      // Check error message to determine if function exists
      const errorMsg = error.message.toLowerCase()

      if (errorMsg.includes('could not find the function')) {
        return {
          name: funcName,
          exists: false,
          error: 'Function not found'
        }
      } else if (
        errorMsg.includes('required') ||
        errorMsg.includes('parameter') ||
        errorMsg.includes('null') ||
        errorMsg.includes('uuid') ||
        errorMsg.includes('invalid') ||
        errorMsg.includes('organization')
      ) {
        // Function exists but parameters are wrong/missing
        return {
          name: funcName,
          exists: true,
          error: 'Parameter validation error (function exists)'
        }
      } else {
        // Some other error - function likely exists
        return {
          name: funcName,
          exists: true,
          error: error.message
        }
      }
    }

    // No error - function exists and executed
    return {
      name: funcName,
      exists: true,
      responseType: data ? typeof data : 'null'
    }

  } catch (err: any) {
    // Unexpected error
    return {
      name: funcName,
      exists: false,
      error: err?.message || 'Unknown error'
    }
  }
}

async function testFunctionWithValidParams(funcName: string): Promise<FunctionTestResult> {
  const TEST_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945' // HERA Demo Organization
  const TEST_ENTITY_ID = '550e8400-e29b-41d4-a716-446655440001'

  try {
    let params: any = {}

    // Provide minimal valid parameters based on function name
    if (funcName.includes('entity')) {
      if (funcName.includes('read')) {
        params = { p_org_id: TEST_ORG_ID, p_entity_id: TEST_ENTITY_ID }
      } else if (funcName.includes('query')) {
        params = { p_org_id: TEST_ORG_ID, p_filters: {} }
      } else if (funcName.includes('upsert')) {
        params = {
          p_org_id: TEST_ORG_ID,
          p_entity_type: 'test',
          p_entity_name: 'Test Entity',
          p_smart_code: 'HERA.TEST.ENTITY.V1'
        }
      } else if (funcName.includes('delete')) {
        params = { p_org_id: TEST_ORG_ID, p_entity_id: TEST_ENTITY_ID }
      } else {
        params = { p_org_id: TEST_ORG_ID }
      }
    } else if (funcName.includes('dynamic')) {
      if (funcName.includes('read') || funcName.includes('get')) {
        params = { p_org_id: TEST_ORG_ID, p_entity_id: TEST_ENTITY_ID }
      } else if (funcName.includes('upsert') || funcName.includes('set')) {
        params = {
          p_org_id: TEST_ORG_ID,
          p_entity_id: TEST_ENTITY_ID,
          p_field_name: 'test_field',
          p_field_value: 'test_value'
        }
      } else {
        params = { p_org_id: TEST_ORG_ID }
      }
    } else if (funcName.includes('relationship')) {
      if (funcName.includes('read')) {
        params = { p_org_id: TEST_ORG_ID, p_relationship_id: TEST_ENTITY_ID }
      } else if (funcName.includes('query')) {
        params = { p_org_id: TEST_ORG_ID, p_filters: {} }
      } else if (funcName.includes('upsert')) {
        params = {
          p_org_id: TEST_ORG_ID,
          p_from_entity_id: TEST_ENTITY_ID,
          p_to_entity_id: TEST_ENTITY_ID,
          p_relationship_type: 'test',
          p_smart_code: 'HERA.TEST.REL.V1'
        }
      } else {
        params = { p_org_id: TEST_ORG_ID }
      }
    } else if (funcName.includes('txn')) {
      if (funcName.includes('read')) {
        params = { p_org_id: TEST_ORG_ID, p_transaction_id: TEST_ENTITY_ID }
      } else if (funcName.includes('query')) {
        params = { p_org_id: TEST_ORG_ID, p_filters: {} }
      } else if (funcName.includes('emit')) {
        params = {
          p_org_id: TEST_ORG_ID,
          p_transaction_type: 'test',
          p_smart_code: 'HERA.TEST.TXN.V1',
          p_transaction_date: new Date().toISOString()
        }
      } else {
        params = { p_org_id: TEST_ORG_ID }
      }
    } else {
      // Helper functions might not need org_id
      params = {}
    }

    const { data, error } = await supabase.rpc(funcName, params)

    if (error) {
      const errorMsg = error.message.toLowerCase()
      if (errorMsg.includes('could not find the function')) {
        return {
          name: funcName,
          exists: false,
          error: 'Function not found'
        }
      }
      // Function exists but returned an error (which is fine for testing)
      return {
        name: funcName,
        exists: true,
        error: `Exists (error: ${error.message.substring(0, 50)}...)`
      }
    }

    return {
      name: funcName,
      exists: true,
      responseType: data ? typeof data : 'executed successfully'
    }

  } catch (err: any) {
    return {
      name: funcName,
      exists: false,
      error: err?.message || 'Unknown error'
    }
  }
}

async function main() {
  console.clear()
  log('\n🔍 COMPREHENSIVE V2 RPC FUNCTION AVAILABILITY CHECK', 'bright')
  log(`Supabase URL: ${supabaseUrl}`, 'cyan')
  log(`Checking ${Object.values(functionCategories).flat().length} functions...`, 'cyan')

  const allResults: { category: string; results: FunctionTestResult[] }[] = []
  let totalFound = 0
  let totalMissing = 0

  // Test each category
  for (const [category, functions] of Object.entries(functionCategories)) {
    logSection(`Testing ${category}`)

    const categoryResults: FunctionTestResult[] = []

    for (const funcName of functions) {
      // First try with empty params
      let result = await testFunction(funcName)

      // If not found, try with valid params
      if (!result.exists) {
        result = await testFunctionWithValidParams(funcName)
      }

      categoryResults.push(result)

      if (result.exists) {
        log(`  ✅ ${funcName}`, 'green')
        if (result.error && !result.error.includes('Parameter validation')) {
          log(`      ${result.error.substring(0, 60)}...`, 'yellow')
        }
        totalFound++
      } else {
        log(`  ❌ ${funcName} - NOT FOUND`, 'red')
        totalMissing++
      }
    }

    allResults.push({ category, results: categoryResults })
  }

  // Summary
  logSection('📊 SUMMARY')

  log(`Total Functions Checked: ${totalFound + totalMissing}`, 'cyan')
  log(`Functions Found: ${totalFound}`, 'green')
  log(`Functions Missing: ${totalMissing}`, totalMissing > 0 ? 'red' : 'green')

  // Show missing functions by category
  if (totalMissing > 0) {
    log('\n⚠️ Missing Functions by Category:', 'yellow')
    for (const { category, results } of allResults) {
      const missing = results.filter(r => !r.exists)
      if (missing.length > 0) {
        log(`\n${category}:`, 'cyan')
        missing.forEach(r => log(`  - ${r.name}`, 'red'))
      }
    }
  }

  // Show available functions that we can use
  log('\n✅ Available Functions for V2 API:', 'green')
  for (const { category, results } of allResults) {
    const available = results.filter(r => r.exists)
    if (available.length > 0) {
      log(`\n${category}: ${available.length}/${results.length} available`, 'cyan')
    }
  }

  // Recommendations
  logSection('📝 RECOMMENDATIONS')

  if (totalMissing > 0) {
    log('⚠️ Some functions are missing. You need to:', 'yellow')
    log('1. Apply the SQL files from database/functions/v2/', 'cyan')
    log('2. Check for any function name mismatches', 'cyan')
    log('3. Ensure all migrations have been run', 'cyan')
  } else {
    log('✅ All expected functions are available!', 'green')
    log('You can proceed with using the V2 API.', 'green')
  }

  // Test actual functionality with real data
  logSection('🧪 FUNCTIONAL TEST WITH REAL PARAMETERS')

  log('\nTesting a complete entity creation flow...', 'cyan')

  const TEST_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945'

  // Try to create an entity
  const { data: entityResult, error: entityError } = await supabase.rpc('hera_entity_upsert_v1', {
    p_org_id: TEST_ORG_ID,
    p_entity_type: 'test_service',
    p_entity_name: `Test Service ${Date.now()}`,
    p_smart_code: 'HERA.TEST.SERVICE.V1',
    p_entity_code: `TEST-${Date.now()}`
  })

  if (entityError) {
    log(`❌ Entity creation failed: ${entityError.message}`, 'red')
  } else if (entityResult?.success) {
    log(`✅ Entity created successfully: ${entityResult.data?.id}`, 'green')

    // Try to add dynamic data
    const entityId = entityResult.data?.id
    if (entityId) {
      const { data: dynamicResult, error: dynamicError } = await supabase.rpc('hera_dynamic_data_upsert_v1', {
        p_org_id: TEST_ORG_ID,
        p_entity_id: entityId,
        p_field_name: 'test_field',
        p_field_value: JSON.stringify({ test: 'value' }),
        p_smart_code: 'HERA.TEST.FIELD.V1'
      })

      if (dynamicError) {
        log(`❌ Dynamic data creation failed: ${dynamicError.message}`, 'red')
      } else if (dynamicResult?.success) {
        log(`✅ Dynamic data added successfully`, 'green')
      }
    }
  }

  log('\n✅ Function availability check complete!', 'green')
}

// Run the test
main().catch(console.error)