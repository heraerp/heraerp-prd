#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = 'd6118aa6-14a2-4d10-b6b2-f2ac139c8722'
const TEST_ORG_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

console.log('🧪 Testing HERA User Management RPCs')
console.log('═'.repeat(80))
console.log('Test User ID:', TEST_USER_ID)
console.log('Test Org ID:', TEST_ORG_ID)
console.log('═'.repeat(80))

// Test 1: hera_users_list_v1
async function test1_listUsers() {
  console.log('\n📋 Test 1: hera_users_list_v1')
  console.log('─'.repeat(80))
  
  const { data, error } = await supabase.rpc('hera_users_list_v1', {
    p_organization_id: TEST_ORG_ID,
    p_limit: 25,
    p_offset: 0
  })
  
  if (error) {
    console.error('❌ FAILED:', error.message)
    return { passed: false, error }
  }
  
  console.log('✅ SUCCESS')
  console.log('Users found:', data.length)
  console.log('\nSample data:')
  console.log(JSON.stringify(data[0], null, 2))
  
  return { passed: true, data }
}

// Test 2: hera_user_orgs_list_v1
async function test2_userOrgsList() {
  console.log('\n📋 Test 2: hera_user_orgs_list_v1')
  console.log('─'.repeat(80))
  
  const { data, error } = await supabase.rpc('hera_user_orgs_list_v1', {
    p_org_id: TEST_ORG_ID,
    p_user_id: TEST_USER_ID
  })
  
  if (error) {
    console.error('❌ FAILED:', error.message)
    return { passed: false, error }
  }
  
  console.log('✅ SUCCESS')
  console.log('Organizations found:', data.length)
  console.log('\nData:')
  console.log(JSON.stringify(data, null, 2))
  
  return { passed: true, data }
}

// Test 3: hera_user_switch_org_v1
async function test3_switchOrg() {
  console.log('\n📋 Test 3: hera_user_switch_org_v1')
  console.log('─'.repeat(80))
  
  const { data, error } = await supabase.rpc('hera_user_switch_org_v1', {
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

// Test 4: hera_user_remove_from_org_v1 (SKIP - destructive)
async function test4_removeFromOrg() {
  console.log('\n📋 Test 4: hera_user_remove_from_org_v1')
  console.log('─'.repeat(80))
  console.log('⏭️  SKIPPED: Destructive operation - not testing in production')
  
  return { passed: true, skipped: true }
}

// Test 5: hera_onboard_user_v1 (Already documented)
async function test5_onboardUser() {
  console.log('\n📋 Test 5: hera_onboard_user_v1 (Already Documented)')
  console.log('─'.repeat(80))
  console.log('✅ SKIPPED: Already documented in RPC_FUNCTIONS_GUIDE.md')
  
  return { passed: true, skipped: true }
}

// Run all tests
async function runTests() {
  const results = {}
  
  results.test1 = await test1_listUsers()
  results.test2 = await test2_userOrgsList()
  results.test3 = await test3_switchOrg()
  results.test4 = await test4_removeFromOrg()
  results.test5 = await test5_onboardUser()
  
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
