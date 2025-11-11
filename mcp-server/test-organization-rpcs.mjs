#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = 'd6118aa6-14a2-4d10-b6b2-f2ac139c8722'
const TEST_ORG_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

console.log('🧪 Testing HERA Organization Management RPCs')
console.log('═'.repeat(80))
console.log('Test User ID:', TEST_USER_ID)
console.log('Test Org ID:', TEST_ORG_ID)
console.log('═'.repeat(80))

// Test 1: hera_organizations_crud_v1 (LIST operation)
async function test1_organizationsCrudList() {
  console.log('\n📋 Test 1: hera_organizations_crud_v1 (LIST)')
  console.log('─'.repeat(80))

  const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
    p_action: 'LIST',
    p_actor_user_id: TEST_USER_ID,
    p_payload: {},
    p_limit: 10,
    p_offset: 0
  })

  if (error) {
    console.error('❌ FAILED:', error.message)
    return { passed: false, error }
  }

  console.log('✅ SUCCESS')
  console.log('Response:')
  console.log(JSON.stringify(data, null, 2))

  return { passed: true, data }
}

// Test 1b: hera_organizations_crud_v1 (GET operation)
async function test1b_organizationsCrudGet() {
  console.log('\n📋 Test 1b: hera_organizations_crud_v1 (GET)')
  console.log('─'.repeat(80))

  const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
    p_action: 'GET',
    p_actor_user_id: TEST_USER_ID,
    p_payload: { id: TEST_ORG_ID },
    p_limit: 10,
    p_offset: 0
  })

  if (error) {
    console.error('❌ FAILED:', error.message)
    return { passed: false, error }
  }

  console.log('✅ SUCCESS')
  console.log('Organization details:')
  console.log(JSON.stringify(data, null, 2))

  return { passed: true, data }
}

// Test 2: hera_set_organization_context_v2
async function test2_setOrgContext() {
  console.log('\n📋 Test 2: hera_set_organization_context_v2')
  console.log('─'.repeat(80))

  const { data, error } = await supabase.rpc('hera_set_organization_context_v2', {
    p_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID
  })

  if (error) {
    console.error('❌ FAILED:', error.message)
    return { passed: false, error }
  }

  console.log('✅ SUCCESS')
  console.log('Response:')
  console.log(JSON.stringify(data, null, 2))

  return { passed: true, data }
}

// Test 3: hera_organization_create_v1 (SKIP - requires careful setup)
async function test3_organizationCreate() {
  console.log('\n📋 Test 3: hera_organization_create_v1')
  console.log('─'.repeat(80))
  console.log('⏭️  SKIPPED: Creating organizations requires careful validation')
  console.log('   Use this for manual testing with proper data')

  return { passed: true, skipped: true }
}

// Test 4: hera_organization_delete_v1 (SKIP - destructive)
async function test4_organizationDelete() {
  console.log('\n📋 Test 4: hera_organization_delete_v1')
  console.log('─'.repeat(80))
  console.log('⏭️  SKIPPED: Destructive operation - not testing in production')

  return { passed: true, skipped: true }
}

// Run all tests
async function runTests() {
  const results = {}

  results.test1 = await test1_organizationsCrudList()
  results.test1b = await test1b_organizationsCrudGet()
  results.test2 = await test2_setOrgContext()
  results.test3 = await test3_organizationCreate()
  results.test4 = await test4_organizationDelete()

  // Summary
  console.log('\n' + '═'.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('═'.repeat(80))

  const total = Object.keys(results).length
  const passed = Object.values(results).filter(r => r.passed).length
  const failed = Object.values(results).filter(r => !r.passed && !r.skipped).length
  const skipped = Object.values(results).filter(r => r.skipped).length

  console.log(`Total Tests:   ${total}`)
  console.log(`✅ Passed:     ${passed}`)
  console.log(`❌ Failed:     ${failed}`)
  console.log(`⏭️  Skipped:    ${skipped}`)

  console.log('\nDetailed Results:')
  Object.entries(results).forEach(([test, result]) => {
    const status = result.skipped ? '⏭️ ' : result.passed ? '✅' : '❌'
    console.log(`  ${status} ${test}`)
  })

  console.log('\n' + '═'.repeat(80))

  process.exit(failed > 0 ? 1 : 0)
}

runTests()
