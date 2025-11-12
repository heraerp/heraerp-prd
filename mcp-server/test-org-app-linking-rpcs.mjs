#!/usr/bin/env node
/**
 * HERA Organization-App Linking RPC Functions - Focused Test Suite
 *
 * Tests 5 core organization-app linking RPC functions:
 * 1. hera_org_link_app_v1 - Link app to organization (install)
 * 2. hera_org_list_apps_v1 - List apps linked to organization (with filters)
 * 3. hera_org_apps_list_v1 - List apps for organization (simple)
 * 4. hera_org_set_default_app_v1 - Set default app for organization
 * 5. hera_org_unlink_app_v1 - Unlink app from organization (uninstall)
 *
 * Date: 2025-11-11
 * Purpose: Test and document newly discovered organization-app RPC functions
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
let TEST_ORG_ID = null
const TEST_APP_CODE = 'SALON' // Use existing SALON app for testing

console.log('🧪 HERA Organization-App Linking RPC Functions - Test Suite')
console.log('='.repeat(80))
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

// Helper: Resolve test organization (non-platform)
async function resolveTestOrganization() {
  // Try to find an organization where the test user is a member
  // First check for Hairtalkz (michele's organization)
  const { data: hairtalkz, error: hairtalkzError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .eq('organization_code', 'HAIRTALKZ')
    .single()

  if (!hairtalkzError && hairtalkz) {
    TEST_ORG_ID = hairtalkz.id
    console.log(`🏢 Test Organization: ${hairtalkz.organization_name} (${TEST_ORG_ID})`)
    return
  }

  // Fallback: use any non-platform org
  const { data, error } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .neq('id', PLATFORM_ORG_ID)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('❌ ERROR: Could not find test organization')
    console.error('Hint: Need at least one non-platform organization in database')
    process.exit(1)
  }

  TEST_ORG_ID = data.id
  console.log(`🏢 Test Organization: ${data.organization_name} (${TEST_ORG_ID})`)
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
 * TEST 1: hera_org_link_app_v1 - Link app to organization
 */
async function testOrgLinkApp() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 1: hera_org_link_app_v1 (LINK APP TO ORGANIZATION)')
  console.log('='.repeat(80))

  const payload = {
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_app_code: TEST_APP_CODE,
    p_installed_at: new Date().toISOString(),
    p_subscription: {
      plan: 'enterprise',
      status: 'active',
      seats: 10,
      billing_cycle: 'monthly'
    },
    p_config: {
      features_enabled: ['appointments', 'pos', 'inventory'],
      custom_branding: true,
      notifications_enabled: true
    },
    p_is_active: true
  }

  console.log('\nRequest Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const { data, error } = await supabase.rpc('hera_org_link_app_v1', payload)

  printResult('hera_org_link_app_v1', { data, error })
  return { data, error }
}

/**
 * TEST 2: hera_org_list_apps_v1 - List apps with filters
 */
async function testOrgListAppsWithFilters() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 2: hera_org_list_apps_v1 (LIST APPS WITH FILTERS)')
  console.log('='.repeat(80))

  const filters = {
    status: 'active',
    limit: 10
  }

  console.log('\nRequest:')
  console.log(JSON.stringify({
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_filters: filters
  }, null, 2))

  const { data, error } = await supabase.rpc('hera_org_list_apps_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_filters: filters
  })

  printResult('hera_org_list_apps_v1 (with filters)', { data, error })

  if (data && !error) {
    const list = data?.apps || data?.data?.list || data
    if (Array.isArray(list)) {
      console.log(`\n📊 Found ${list.length} apps`)
      list.forEach((app, idx) => {
        console.log(`   ${idx + 1}. ${app.code || app.app_code} - ${app.name || app.app_name || 'N/A'}`)
      })
    }
  }

  return { data, error }
}

/**
 * TEST 3: hera_org_apps_list_v1 - Simple list (no filters)
 */
async function testOrgAppsListSimple() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 3: hera_org_apps_list_v1 (SIMPLE LIST - NO FILTERS)')
  console.log('='.repeat(80))

  console.log('\nRequest:')
  console.log(JSON.stringify({
    p_organization_id: TEST_ORG_ID
  }, null, 2))

  const { data, error } = await supabase.rpc('hera_org_apps_list_v1', {
    p_organization_id: TEST_ORG_ID
  })

  printResult('hera_org_apps_list_v1 (no filters)', { data, error })

  if (data && !error) {
    const list = data?.apps || data?.data?.list || data
    if (Array.isArray(list)) {
      console.log(`\n📊 Total apps: ${list.length}`)
      list.forEach((app, idx) => {
        console.log(`   ${idx + 1}. ${app.code || app.app_code} - ${app.name || app.app_name || 'N/A'}`)
      })
    }
  }

  return { data, error }
}

/**
 * TEST 4: hera_org_set_default_app_v1 - Set default app
 */
async function testOrgSetDefaultApp() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 4: hera_org_set_default_app_v1 (SET DEFAULT APP)')
  console.log('='.repeat(80))

  console.log('\nRequest:')
  console.log(JSON.stringify({
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_app_code: TEST_APP_CODE
  }, null, 2))

  const { data, error } = await supabase.rpc('hera_org_set_default_app_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_app_code: TEST_APP_CODE
  })

  printResult('hera_org_set_default_app_v1', { data, error })
  return { data, error }
}

/**
 * TEST 5: hera_org_unlink_app_v1 - Unlink app (soft delete)
 */
async function testOrgUnlinkAppSoft() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 5: hera_org_unlink_app_v1 (SOFT DELETE - UNLINK APP)')
  console.log('='.repeat(80))

  console.log('\nRequest:')
  console.log(JSON.stringify({
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_app_code: TEST_APP_CODE,
    p_uninstalled_at: new Date().toISOString(),
    p_hard_delete: false
  }, null, 2))

  const { data, error } = await supabase.rpc('hera_org_unlink_app_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_app_code: TEST_APP_CODE,
    p_uninstalled_at: new Date().toISOString(),
    p_hard_delete: false
  })

  printResult('hera_org_unlink_app_v1 (soft delete)', { data, error })
  return { data, error }
}

/**
 * TEST 6: Verify unlink - List apps after unlink
 */
async function testVerifyUnlink() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 6: VERIFY UNLINK (LIST APPS AFTER UNLINK)')
  console.log('='.repeat(80))

  const { data, error } = await supabase.rpc('hera_org_list_apps_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_filters: {}
  })

  printResult('Verify Unlink (list apps)', { data, error })

  if (data && !error) {
    const list = data?.apps || data?.data?.list || data
    if (Array.isArray(list)) {
      console.log(`\n📊 Apps after unlink: ${list.length}`)
      const salonApp = list.find(app =>
        (app.code === TEST_APP_CODE || app.app_code === TEST_APP_CODE)
      )
      console.log(`   SALON app still linked: ${!!salonApp}`)
      if (salonApp) {
        console.log(`   Status: ${salonApp.status || salonApp.is_active ? 'active' : 'inactive'}`)
      }
    }
  }

  return { data, error }
}

/**
 * TEST 7: Re-link app for cleanup
 */
async function testRelinkAppCleanup() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 7: RE-LINK APP (CLEANUP)')
  console.log('='.repeat(80))

  console.log('\nRe-linking SALON app for cleanup...')

  const { data, error } = await supabase.rpc('hera_org_link_app_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_app_code: TEST_APP_CODE,
    p_installed_at: new Date().toISOString(),
    p_subscription: {
      plan: 'enterprise',
      status: 'active'
    },
    p_config: {},
    p_is_active: true
  })

  printResult('Re-link app (cleanup)', { data, error })
  return { data, error }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    console.log('🔧 Initializing...\n')
    await resolveTestUser()
    await resolveTestOrganization()

    console.log('\n' + '='.repeat(80))
    console.log('STARTING TESTS')
    console.log('='.repeat(80))

    const results = {
      linkApp: await testOrgLinkApp(),
      listAppsFiltered: await testOrgListAppsWithFilters(),
      listAppsSimple: await testOrgAppsListSimple(),
      setDefaultApp: await testOrgSetDefaultApp(),
      unlinkApp: await testOrgUnlinkAppSoft(),
      verifyUnlink: await testVerifyUnlink(),
      relinkCleanup: await testRelinkAppCleanup()
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

    console.log(`\n📌 Test Organization: ${TEST_ORG_ID}`)
    console.log(`📌 Test App Code: ${TEST_APP_CODE}`)

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
