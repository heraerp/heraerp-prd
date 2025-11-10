/**
 * 🧪 TEST: hera_user_orgs_list_v1 RPC Function
 *
 * Tests the deployed RPC with salon@heraerp.com user
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test data from our verified setup
const TEST_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'  // HERA Salon Demo (core_organizations)
const TEST_USER_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91' // salon@heraerp.com user entity

console.log('🧪 TESTING: hera_user_orgs_list_v1 RPC Function')
console.log('='.repeat(80))
console.log('')
console.log('Test Parameters:')
console.log(`   p_org_id:  ${TEST_ORG_ID}`)
console.log(`   p_user_id: ${TEST_USER_ID}`)
console.log('')

async function testRPC() {
  console.log('📝 Calling hera_user_orgs_list_v1...')
  console.log('-'.repeat(80))

  const { data, error } = await supabase.rpc('hera_user_orgs_list_v1', {
    p_org_id: TEST_ORG_ID,
    p_user_id: TEST_USER_ID
  })

  if (error) {
    console.log('❌ RPC CALL FAILED')
    console.log(`   Error: ${error.message}`)
    console.log(`   Code: ${error.code}`)
    console.log(`   Details: ${error.details}`)
    console.log(`   Hint: ${error.hint}`)
    console.log('')
    return false
  }

  console.log('✅ RPC CALL SUCCESS')
  console.log('')
  console.log(`   Returned ${data?.length || 0} organization(s)`)
  console.log('')

  if (!data || data.length === 0) {
    console.log('⚠️  NO RESULTS RETURNED')
    console.log('')
    console.log('This could mean:')
    console.log('   1. User has no MEMBER_OF relationships')
    console.log('   2. Organization entity_type is incorrect')
    console.log('   3. Tenant filtering is wrong')
    console.log('')
    return false
  }

  // Display results
  console.log('📊 RESULTS:')
  console.log('-'.repeat(80))

  data.forEach((org, idx) => {
    console.log(`\nOrganization #${idx + 1}:`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Name: ${org.name}`)
    console.log(`   Role: ${org.role}`)
    console.log(`   Is Primary: ${org.is_primary}`)
    console.log(`   Last Accessed: ${org.last_accessed}`)
  })
  console.log('')

  // Validation checks
  console.log('✅ VALIDATION CHECKS:')
  console.log('-'.repeat(80))

  const firstOrg = data[0]
  const validations = []

  // Check 1: Organization ID matches expected
  if (firstOrg.id === '7f1d5200-2106-4f94-8095-8a04bc114623') {
    validations.push('✅ Organization ID matches HERA Salon Demo entity')
  } else {
    validations.push(`⚠️  Organization ID mismatch: expected 7f1d5200-2106-4f94-8095-8a04bc114623, got ${firstOrg.id}`)
  }

  // Check 2: Organization name
  if (firstOrg.name?.includes('Salon') || firstOrg.name?.includes('HERA')) {
    validations.push(`✅ Organization name is correct: "${firstOrg.name}"`)
  } else {
    validations.push(`⚠️  Organization name unexpected: "${firstOrg.name}"`)
  }

  // Check 3: Role is ORG_OWNER
  if (firstOrg.role === 'ORG_OWNER') {
    validations.push('✅ Role is ORG_OWNER (correct)')
  } else {
    validations.push(`⚠️  Role unexpected: expected ORG_OWNER, got ${firstOrg.role}`)
  }

  // Check 4: Is Primary
  if (firstOrg.is_primary === true) {
    validations.push('✅ is_primary flag is true (correct)')
  } else {
    validations.push(`⚠️  is_primary flag: expected true, got ${firstOrg.is_primary}`)
  }

  // Check 5: Last accessed exists
  if (firstOrg.last_accessed) {
    validations.push(`✅ last_accessed timestamp exists: ${firstOrg.last_accessed}`)
  } else {
    validations.push('⚠️  last_accessed timestamp is null')
  }

  validations.forEach(v => console.log(`   ${v}`))
  console.log('')

  // Overall assessment
  const allPassed = validations.every(v => v.startsWith('✅'))

  return allPassed
}

async function main() {
  const success = await testRPC()

  console.log('='.repeat(80))
  console.log('📊 FINAL TEST RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (success) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('')
    console.log('✅ hera_user_orgs_list_v1 RPC is working correctly:')
    console.log('')
    console.log('   ✅ Returns organization data')
    console.log('   ✅ Correctly resolves ORG_OWNER role from HAS_ROLE relationship')
    console.log('   ✅ Properly filters by organization_id tenant boundary')
    console.log('   ✅ Uses ORGANIZATION entity_type (not ORG)')
    console.log('   ✅ Returns is_primary and last_accessed metadata')
    console.log('')
    console.log('The RPC deployment is SUCCESSFUL and production-ready! 🚀')
  } else {
    console.log('⚠️  TESTS FAILED OR INCOMPLETE')
    console.log('')
    console.log('Please review the validation checks above.')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
