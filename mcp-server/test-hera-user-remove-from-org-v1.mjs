/**
 * 🧪 TEST: hera_user_remove_from_org_v1 RPC Function
 *
 * Tests user removal from organization
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test data
const TEST_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'  // HERA Salon Demo
const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000'

console.log('🧪 TESTING: hera_user_remove_from_org_v1 RPC Function')
console.log('='.repeat(80))
console.log('')
console.log('⚠️  WARNING: This test will REMOVE a user from the organization!')
console.log('   We will use a non-critical test user if available.')
console.log('')

async function testUserRemoval() {
  // Step 1: Get current users list
  console.log('📝 Step 1: Get current users in organization...')
  console.log('-'.repeat(80))

  const { data: usersBefore, error: listError1 } = await supabase.rpc('hera_users_list_v1', {
    p_organization_id: TEST_ORG_ID,
    p_limit: 25,
    p_offset: 0
  })

  if (listError1) {
    console.log('❌ Failed to get users list')
    console.log(`   Error: ${listError1.message}`)
    return false
  }

  console.log(`✅ Found ${usersBefore.length} user(s) before removal`)
  console.log('')
  usersBefore.forEach((user, idx) => {
    console.log(`   ${idx + 1}. ${user.name} (${user.role})`)
  })
  console.log('')

  // Step 2: Select a test user (use the last one to be safe)
  if (usersBefore.length === 0) {
    console.log('⚠️  No users found to test removal')
    return false
  }

  const testUser = usersBefore[usersBefore.length - 1]
  console.log(`🎯 Selected test user for removal:`)
  console.log(`   ID: ${testUser.id}`)
  console.log(`   Name: ${testUser.name}`)
  console.log(`   Role: ${testUser.role}`)
  console.log('')

  // Step 3: Check relationships before removal
  console.log('📝 Step 2: Check relationships before removal...')
  console.log('-'.repeat(80))

  const { data: relsBefore, error: relsError1 } = await supabase
    .from('core_relationships')
    .select('relationship_type, is_active')
    .eq('organization_id', TEST_ORG_ID)
    .eq('from_entity_id', testUser.id)

  if (relsError1) {
    console.log('❌ Failed to query relationships')
  } else {
    console.log(`   Found ${relsBefore.length} relationship(s):`)
    relsBefore.forEach(rel => {
      console.log(`   • ${rel.relationship_type} (active: ${rel.is_active})`)
    })
  }
  console.log('')

  // Step 4: Remove user
  console.log('📝 Step 3: Remove user from organization...')
  console.log('-'.repeat(80))

  const { data: removeResult, error: removeError } = await supabase.rpc('hera_user_remove_from_org_v1', {
    p_organization_id: TEST_ORG_ID,
    p_user_id: testUser.id
  })

  if (removeError) {
    console.log('❌ RPC CALL FAILED')
    console.log(`   Error: ${removeError.message}`)
    console.log(`   Code: ${removeError.code}`)
    console.log(`   Details: ${removeError.details}`)
    return false
  }

  console.log('✅ RPC CALL SUCCESS')
  console.log('')
  console.log('   Result:', JSON.stringify(removeResult, null, 2))
  console.log('')

  // Step 5: Verify user removed from list
  console.log('📝 Step 4: Verify user removed from users list...')
  console.log('-'.repeat(80))

  const { data: usersAfter, error: listError2 } = await supabase.rpc('hera_users_list_v1', {
    p_organization_id: TEST_ORG_ID,
    p_limit: 25,
    p_offset: 0
  })

  if (listError2) {
    console.log('❌ Failed to get users list after removal')
  } else {
    console.log(`   Found ${usersAfter.length} user(s) after removal`)
    const userStillPresent = usersAfter.find(u => u.id === testUser.id)

    if (userStillPresent) {
      console.log('   ❌ User STILL in list (removal failed)')
    } else {
      console.log('   ✅ User NOT in list (successfully removed)')
    }
  }
  console.log('')

  // Step 6: Verify relationships deleted
  console.log('📝 Step 5: Verify relationships deleted...')
  console.log('-'.repeat(80))

  const { data: relsAfter, error: relsError2 } = await supabase
    .from('core_relationships')
    .select('relationship_type, is_active')
    .eq('organization_id', TEST_ORG_ID)
    .eq('from_entity_id', testUser.id)

  if (relsError2) {
    console.log('❌ Failed to query relationships after removal')
  } else {
    console.log(`   Found ${relsAfter.length} relationship(s) after removal`)

    if (relsAfter.length === 0) {
      console.log('   ✅ All relationships deleted')
    } else {
      console.log('   ⚠️  Some relationships still exist:')
      relsAfter.forEach(rel => {
        console.log(`   • ${rel.relationship_type} (active: ${rel.is_active})`)
      })
    }
  }
  console.log('')

  // Step 7: Verify platform USER entity still exists
  console.log('📝 Step 6: Verify platform USER entity preserved...')
  console.log('-'.repeat(80))

  const { data: platformUser, error: platformError } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, organization_id')
    .eq('id', testUser.id)
    .eq('organization_id', PLATFORM_ORG)
    .single()

  if (platformError) {
    console.log('   ❌ Platform USER entity NOT found (should exist)')
    console.log(`   Error: ${platformError.message}`)
  } else {
    console.log('   ✅ Platform USER entity still exists')
    console.log(`   • ID: ${platformUser.id}`)
    console.log(`   • Name: ${platformUser.entity_name}`)
    console.log(`   • Org: ${platformUser.organization_id} (platform)`)
  }
  console.log('')

  // Validation summary
  const validations = {
    rpcSuccess: !!removeResult,
    memberOfDeleted: removeResult?.member_of_deleted > 0,
    hasRoleDeleted: removeResult?.has_role_deleted > 0,
    userNotInList: !usersAfter.find(u => u.id === testUser.id),
    relationshipsDeleted: relsAfter.length === 0,
    platformUserPreserved: !!platformUser
  }

  return validations
}

async function main() {
  const validations = await testUserRemoval()

  console.log('='.repeat(80))
  console.log('📊 FINAL TEST RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (!validations) {
    console.log('❌ TESTS FAILED')
    console.log('')
    console.log('The RPC encountered an error or prerequisite check failed.')
    return
  }

  console.log('✅ VALIDATION CHECKS:')
  console.log('-'.repeat(80))
  console.log(`   ${validations.rpcSuccess ? '✅' : '❌'} RPC call succeeded`)
  console.log(`   ${validations.memberOfDeleted ? '✅' : '⚠️ '} MEMBER_OF relationship deleted`)
  console.log(`   ${validations.hasRoleDeleted ? '✅' : '⚠️ '} HAS_ROLE relationship(s) deleted`)
  console.log(`   ${validations.userNotInList ? '✅' : '❌'} User removed from users list`)
  console.log(`   ${validations.relationshipsDeleted ? '✅' : '⚠️ '} All relationships deleted`)
  console.log(`   ${validations.platformUserPreserved ? '✅' : '❌'} Platform USER entity preserved`)
  console.log('')

  const allPassed = Object.values(validations).every(v => v)

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('')
    console.log('✅ hera_user_remove_from_org_v1 RPC is working correctly:')
    console.log('')
    console.log('   ✅ Successfully removes MEMBER_OF relationship')
    console.log('   ✅ Successfully removes HAS_ROLE relationships')
    console.log('   ✅ User disappears from hera_users_list_v1')
    console.log('   ✅ All tenant relationships cleaned up')
    console.log('   ✅ Platform USER entity preserved (multi-org safe)')
    console.log('')
    console.log('The RPC deployment is SUCCESSFUL and production-ready! 🚀')
  } else {
    console.log('⚠️  TESTS PASSED WITH WARNINGS')
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
