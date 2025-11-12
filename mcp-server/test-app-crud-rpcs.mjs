#!/usr/bin/env node
/**
 * HERA App CRUD RPC Functions - Focused Test Suite
 *
 * Tests 4 core app management RPC functions:
 * 1. hera_apps_register_v1 - Register/create new app
 * 2. hera_apps_get_v1 - Get single app by selector
 * 3. hera_apps_list_v1 - List apps with filters
 * 4. hera_apps_update_v1 - Update app details
 *
 * Date: 2025-11-11
 * Purpose: Test and document newly discovered RPC functions
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

// Test data
let TEST_USER_ID = null
let TEST_APP_ID = null
const TEST_APP_CODE = `TESTAPP${Date.now().toString().slice(-6)}` // UPPERCASE, no underscores

console.log('🧪 HERA App CRUD RPC Functions - Test Suite')
console.log('=' .repeat(80))
console.log()

// Helper: Resolve test user
async function resolveTestUser() {
  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('entity_type', 'USER')
    .limit(1)
    .single()

  if (error || !data) {
    console.error('❌ ERROR: Could not find test user')
    process.exit(1)
  }

  TEST_USER_ID = data.id
  console.log(`👤 Test User: ${data.entity_name} (${TEST_USER_ID})`)
}

// Helper: Print result
function printResult(testName, result) {
  const status = result.error ? '❌ FAIL' : '✅ PASS'
  console.log(`\n${status} ${testName}`)

  if (result.error) {
    console.log('Error:', result.error.message)
    if (result.error.details) console.log('Details:', result.error.details)
    if (result.error.hint) console.log('Hint:', result.error.hint)
  } else {
    console.log('Result:', JSON.stringify(result.data, null, 2))
  }
}

/**
 * TEST 1: hera_apps_register_v1 - Register new app
 */
async function testAppsRegister() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 1: hera_apps_register_v1 (REGISTER/CREATE APP)')
  console.log('='.repeat(80))

  const payload = {
    code: TEST_APP_CODE,
    name: `Test Application ${TEST_APP_CODE}`,
    smart_code: `HERA.PLATFORM.APP.ENTITY.${TEST_APP_CODE}.v1`,
    status: 'active',
    metadata: {
      category: 'testing',
      version: '1.0.0',
      description: 'Test app for RPC validation',
      icon: 'TestTube',
      features: ['test', 'validation', 'demo']
    }
  }

  console.log('\nRequest Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const { data, error } = await supabase.rpc('hera_apps_register_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_payload: payload
  })

  printResult('hera_apps_register_v1', { data, error })

  // Extract app ID
  if (data?.success && data?.data?.entity_id) {
    TEST_APP_ID = data.data.entity_id
    console.log('\n📌 Created App ID:', TEST_APP_ID)
  } else if (data?.entity_id) {
    TEST_APP_ID = data.entity_id
    console.log('\n📌 Created App ID:', TEST_APP_ID)
  } else if (data?.app?.id) {
    TEST_APP_ID = data.app.id
    console.log('\n📌 Created App ID:', TEST_APP_ID)
  }

  return { data, error }
}

/**
 * TEST 2: hera_apps_get_v1 - Get app by ID
 */
async function testAppsGetById() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 2: hera_apps_get_v1 (GET BY ID)')
  console.log('='.repeat(80))

  if (!TEST_APP_ID) {
    console.log('\n⚠️  SKIPPED - No app ID from register test')
    return { data: null, error: { message: 'Skipped - no app ID' } }
  }

  const selector = { id: TEST_APP_ID }  // Use "id" not "entity_id"
  console.log('\nRequest Selector:')
  console.log(JSON.stringify(selector, null, 2))

  const { data, error } = await supabase.rpc('hera_apps_get_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_selector: selector
  })

  printResult('hera_apps_get_v1 (by ID)', { data, error })
  return { data, error }
}

/**
 * TEST 3: hera_apps_get_v1 - Get app by code
 */
async function testAppsGetByCode() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 3: hera_apps_get_v1 (GET BY CODE)')
  console.log('='.repeat(80))

  const selector = { code: TEST_APP_CODE }
  console.log('\nRequest Selector:')
  console.log(JSON.stringify(selector, null, 2))

  const { data, error } = await supabase.rpc('hera_apps_get_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_selector: selector
  })

  printResult('hera_apps_get_v1 (by code)', { data, error })
  return { data, error }
}

/**
 * TEST 4: hera_apps_list_v1 - List with filters
 */
async function testAppsList() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 4: hera_apps_list_v1 (LIST WITH FILTERS)')
  console.log('='.repeat(80))

  const filters = {
    status: 'active',
    limit: 10
  }
  console.log('\nRequest Filters:')
  console.log(JSON.stringify(filters, null, 2))

  const { data, error } = await supabase.rpc('hera_apps_list_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_filters: filters
  })

  printResult('hera_apps_list_v1 (with filters)', { data, error })

  if (data && !error) {
    const list = data?.apps || data?.data?.list || data
    if (Array.isArray(list)) {
      console.log(`\n📊 Found ${list.length} apps`)
    }
  }

  return { data, error }
}

/**
 * TEST 5: hera_apps_list_v1 - List all (no filters)
 */
async function testAppsListAll() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 5: hera_apps_list_v1 (LIST ALL - NO FILTERS)')
  console.log('='.repeat(80))

  console.log('\nRequest: Empty filters (list all)')

  const { data, error } = await supabase.rpc('hera_apps_list_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_filters: {}
  })

  printResult('hera_apps_list_v1 (no filters)', { data, error })

  if (data && !error) {
    const list = data?.apps || data?.data?.list || data
    if (Array.isArray(list)) {
      console.log(`\n📊 Total apps: ${list.length}`)
    }
  }

  return { data, error }
}

/**
 * TEST 6: hera_apps_update_v1 - Update app
 */
async function testAppsUpdate() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 6: hera_apps_update_v1 (UPDATE APP)')
  console.log('='.repeat(80))

  if (!TEST_APP_ID) {
    console.log('\n⚠️  SKIPPED - No app ID from register test')
    return { data: null, error: { message: 'Skipped - no app ID' } }
  }

  const payload = {
    id: TEST_APP_ID,  // Use "id" not "entity_id"
    name: `UPDATED Test App ${TEST_APP_CODE}`,
    status: 'inactive',
    metadata: {
      category: 'testing',
      version: '2.0.0',
      description: 'UPDATED test app description',
      icon: 'CheckCircle',
      features: ['test', 'validation', 'demo', 'updated'],
      updated_by_test: true,
      last_updated: new Date().toISOString()
    }
  }

  console.log('\nRequest Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const { data, error } = await supabase.rpc('hera_apps_update_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_payload: payload
  })

  printResult('hera_apps_update_v1', { data, error })
  return { data, error }
}

/**
 * TEST 7: Verify update - Get updated app
 */
async function testVerifyUpdate() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 7: VERIFY UPDATE (GET UPDATED APP)')
  console.log('='.repeat(80))

  if (!TEST_APP_ID) {
    console.log('\n⚠️  SKIPPED - No app ID')
    return { data: null, error: { message: 'Skipped - no app ID' } }
  }

  const selector = { id: TEST_APP_ID }  // Use "id" not "entity_id"

  const { data, error } = await supabase.rpc('hera_apps_get_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_selector: selector
  })

  printResult('Verify Update', { data, error })

  if (data && !error) {
    const app = data?.app || data
    console.log('\n🔍 Verification:')
    console.log(`   Name contains "UPDATED": ${app?.name?.includes('UPDATED')}`)
    console.log(`   Status is "inactive": ${app?.status === 'inactive'}`)
    console.log(`   Version is "2.0.0": ${app?.metadata?.version === '2.0.0'}`)
    console.log(`   Has update marker: ${app?.metadata?.updated_by_test === true}`)
  }

  return { data, error }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    console.log('🔧 Initializing...\n')
    await resolveTestUser()

    console.log('\n' + '='.repeat(80))
    console.log('STARTING TESTS')
    console.log('='.repeat(80))

    const results = {
      register: await testAppsRegister(),
      getById: await testAppsGetById(),
      getByCode: await testAppsGetByCode(),
      list: await testAppsList(),
      listAll: await testAppsListAll(),
      update: await testAppsUpdate(),
      verify: await testVerifyUpdate()
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(80))

    const passed = Object.values(results).filter(r => !r.error).length
    const failed = Object.values(results).filter(r => r.error).length
    const total = Object.keys(results).length
    const successRate = ((passed / total) * 100).toFixed(1)

    console.log(`\nTotal Tests:     ${total}`)
    console.log(`✅ Passed:       ${passed}`)
    console.log(`❌ Failed:       ${failed}`)
    console.log(`📈 Success Rate:  ${successRate}%`)

    console.log('\nDetailed Results:')
    Object.entries(results).forEach(([test, result]) => {
      const status = result.error ? '❌ FAIL' : '✅ PASS'
      console.log(`   ${status} - ${test}`)
    })

    if (TEST_APP_ID) {
      console.log(`\n📌 Test App ID: ${TEST_APP_ID}`)
      console.log(`📌 Test App Code: ${TEST_APP_CODE}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✨ Test suite completed!')
    console.log('='.repeat(80))
    console.log()

    process.exit(failed > 0 ? 1 : 0)

  } catch (error) {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
