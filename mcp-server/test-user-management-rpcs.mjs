/**
 * 🧪 HERA USER MANAGEMENT RPC TEST SUITE
 *
 * Tests all user management RPC functions:
 * 1. hera_upsert_user_entity_v1 - Create/update user entity
 * 2. hera_users_list_v1 - List users in organization
 * 3. hera_user_read_v1 - Read single user details
 * 4. hera_user_update_v1 - Update user metadata
 * 5. hera_user_orgs_list_v1 - List organizations for user
 * 6. hera_user_switch_org_v1 - Switch user's active organization
 * 7. hera_user_remove_from_org_v1 - Remove user from organization
 *
 * ⚠️ SAFETY: Does NOT edit existing users, only creates test users
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 🎯 Test Configuration
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const SYSTEM_ACTOR_ID = '001a2eb9-b14c-4dda-ae8c-595fb377a982' // Michele Rodriguez

// Generate unique test data
const timestamp = Date.now()
const TEST_USER_EMAIL = `test-user-${timestamp}@heratest.com`
const TEST_USER_NAME = `Test User ${timestamp}`
// Generate a valid UUID v4 for testing
const TEST_SUPABASE_UID = randomUUID()

let createdUserId = null

console.log('🧪 HERA USER MANAGEMENT RPC TEST SUITE')
console.log('=' .repeat(80))
console.log('📋 Test Configuration:')
console.log(`   Platform Org: ${PLATFORM_ORG_ID}`)
console.log(`   Test Org: ${TEST_ORG_ID}`)
console.log(`   System Actor: ${SYSTEM_ACTOR_ID}`)
console.log(`   Test Email: ${TEST_USER_EMAIL}`)
console.log('=' .repeat(80))
console.log('')

/**
 * TEST 1: hera_upsert_user_entity_v1
 * Creates a new user entity in the platform organization
 */
async function test1_upsertUser() {
  console.log('📝 TEST 1: hera_upsert_user_entity_v1 (Create User)')
  console.log('-'.repeat(80))

  try {
    const { data, error } = await supabase.rpc('hera_upsert_user_entity_v1', {
      p_platform_org: PLATFORM_ORG_ID,
      p_supabase_uid: TEST_SUPABASE_UID,
      p_email: TEST_USER_EMAIL,
      p_full_name: TEST_USER_NAME,
      p_system_actor: SYSTEM_ACTOR_ID,
      p_version: 'v1'
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    createdUserId = data
    console.log('✅ SUCCESS: User created')
    console.log(`   User ID: ${createdUserId}`)
    console.log(`   Email: ${TEST_USER_EMAIL}`)
    console.log(`   Full Name: ${TEST_USER_NAME}`)
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * TEST 2: hera_users_list_v1
 * Lists all users in the test organization
 */
async function test2_listUsers() {
  console.log('📝 TEST 2: hera_users_list_v1 (List Users)')
  console.log('-'.repeat(80))

  try {
    const { data, error } = await supabase.rpc('hera_users_list_v1', {
      p_organization_id: TEST_ORG_ID,
      p_limit: 25,
      p_offset: 0
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    console.log('✅ SUCCESS: Users retrieved')
    console.log(`   Total Users: ${data.length}`)
    console.log('   User List:')
    data.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.role}) - ID: ${user.id}`)
    })
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * TEST 3: hera_user_read_v1
 * Reads details of a single user
 */
async function test3_readUser() {
  console.log('📝 TEST 3: hera_user_read_v1 (Read User Details)')
  console.log('-'.repeat(80))

  if (!createdUserId) {
    console.log('⚠️  SKIPPED: No user created in previous tests')
    console.log('')
    return false
  }

  try {
    const { data, error } = await supabase.rpc('hera_user_read_v1', {
      p_organization_id: TEST_ORG_ID,
      p_user_id: createdUserId
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    console.log('✅ SUCCESS: User details retrieved')
    console.log('   User Data:')
    console.log(JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * TEST 4: hera_user_update_v1
 * Updates user metadata (role, permissions, department, etc.)
 */
async function test4_updateUser() {
  console.log('📝 TEST 4: hera_user_update_v1 (Update User Metadata)')
  console.log('-'.repeat(80))

  if (!createdUserId) {
    console.log('⚠️  SKIPPED: No user created in previous tests')
    console.log('')
    return false
  }

  try {
    const { data, error } = await supabase.rpc('hera_user_update_v1', {
      p_organization_id: TEST_ORG_ID,
      p_user_id: createdUserId,
      p_role: 'test_role',
      p_permissions: { can_read: true, can_write: false },
      p_department: 'Test Department',
      p_reports_to: SYSTEM_ACTOR_ID,
      p_status: 'active'
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    console.log('✅ SUCCESS: User metadata updated')
    console.log('   Updated fields:')
    console.log(`   - Role: test_role`)
    console.log(`   - Permissions: { can_read: true, can_write: false }`)
    console.log(`   - Department: Test Department`)
    console.log(`   - Reports To: ${SYSTEM_ACTOR_ID}`)
    console.log(`   - Status: active`)
    console.log('   Response:', JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * TEST 5: hera_user_orgs_list_v1
 * Lists all organizations that a user belongs to
 */
async function test5_listUserOrgs() {
  console.log('📝 TEST 5: hera_user_orgs_list_v1 (List User Organizations)')
  console.log('-'.repeat(80))

  if (!createdUserId) {
    console.log('⚠️  SKIPPED: No user created in previous tests')
    console.log('')
    return false
  }

  try {
    const { data, error } = await supabase.rpc('hera_user_orgs_list_v1', {
      p_user_id: createdUserId
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    console.log('✅ SUCCESS: User organizations retrieved')
    console.log(`   Total Organizations: ${data.length}`)
    if (data.length > 0) {
      console.log('   Organization List:')
      data.forEach((org, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(org)}`)
      })
    } else {
      console.log('   ℹ️  User not yet added to any organizations')
    }
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * TEST 6: hera_user_switch_org_v1
 * Switches user's active organization context
 */
async function test6_switchOrg() {
  console.log('📝 TEST 6: hera_user_switch_org_v1 (Switch Active Organization)')
  console.log('-'.repeat(80))

  if (!createdUserId) {
    console.log('⚠️  SKIPPED: No user created in previous tests')
    console.log('')
    return false
  }

  try {
    const { data, error } = await supabase.rpc('hera_user_switch_org_v1', {
      p_user_id: createdUserId,
      p_organization_id: TEST_ORG_ID
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    console.log('✅ SUCCESS: Organization switch completed')
    console.log(`   User ID: ${createdUserId}`)
    console.log(`   Active Org: ${TEST_ORG_ID}`)
    console.log('   Response:', JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * TEST 7: hera_user_remove_from_org_v1
 * Removes user from an organization (CLEANUP)
 */
async function test7_removeFromOrg() {
  console.log('📝 TEST 7: hera_user_remove_from_org_v1 (Remove User from Org)')
  console.log('-'.repeat(80))

  if (!createdUserId) {
    console.log('⚠️  SKIPPED: No user created in previous tests')
    console.log('')
    return false
  }

  try {
    const { data, error } = await supabase.rpc('hera_user_remove_from_org_v1', {
      p_organization_id: TEST_ORG_ID,
      p_user_id: createdUserId
    })

    if (error) {
      console.error('❌ FAILED:', error.message)
      console.error('   Details:', error)
      return false
    }

    console.log('✅ SUCCESS: User removed from organization')
    console.log(`   User ID: ${createdUserId}`)
    console.log(`   Organization: ${TEST_ORG_ID}`)
    console.log('   Response:', JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    console.error('❌ EXCEPTION:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * CLEANUP: Delete test user entity
 */
async function cleanup_deleteTestUser() {
  console.log('🧹 CLEANUP: Deleting test user entity')
  console.log('-'.repeat(80))

  if (!createdUserId) {
    console.log('ℹ️  No cleanup needed - no user was created')
    console.log('')
    return true
  }

  try {
    // Delete the user entity from core_entities
    const { error } = await supabase
      .from('core_entities')
      .delete()
      .eq('id', createdUserId)

    if (error) {
      console.error('⚠️  Cleanup warning:', error.message)
      console.log('   Manual cleanup may be required for user:', createdUserId)
      return false
    }

    console.log('✅ Cleanup successful')
    console.log(`   Deleted user entity: ${createdUserId}`)
    return true
  } catch (err) {
    console.error('⚠️  Cleanup exception:', err.message)
    return false
  } finally {
    console.log('')
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('🚀 Starting User Management RPC Test Suite...\n')

  const results = {
    test1_upsertUser: false,
    test2_listUsers: false,
    test3_readUser: false,
    test4_updateUser: false,
    test5_listUserOrgs: false,
    test6_switchOrg: false,
    test7_removeFromOrg: false,
    cleanup: false
  }

  // Run tests sequentially
  results.test1_upsertUser = await test1_upsertUser()
  results.test2_listUsers = await test2_listUsers()
  results.test3_readUser = await test3_readUser()
  results.test4_updateUser = await test4_updateUser()
  results.test5_listUserOrgs = await test5_listUserOrgs()
  results.test6_switchOrg = await test6_switchOrg()
  results.test7_removeFromOrg = await test7_removeFromOrg()

  // Cleanup
  results.cleanup = await cleanup_deleteTestUser()

  // Print Summary
  console.log('=' .repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(80))

  let passed = 0
  let failed = 0

  Object.entries(results).forEach(([testName, success]) => {
    const status = success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${testName}`)
    if (success) passed++
    else failed++
  })

  console.log('')
  console.log(`Total: ${passed + failed} tests`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('=' .repeat(80))

  // Exit code
  process.exit(failed > 0 ? 1 : 0)
}

// Execute test suite
runAllTests().catch(err => {
  console.error('💥 Fatal error running test suite:', err)
  process.exit(1)
})
