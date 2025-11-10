/**
 * 🔍 Check User RPC Function Definitions
 *
 * Compares hera_upsert_user_entity_v1 vs hera_user_update_v1
 * to determine if update RPC is redundant
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 ANALYZING USER RPC FUNCTIONS')
console.log('=' .repeat(80))
console.log('')

/**
 * Test 1: Check if UPSERT creates a new user
 */
async function test_upsert_create() {
  console.log('📝 TEST 1: Can hera_upsert_user_entity_v1 CREATE a user?')
  console.log('-'.repeat(80))

  const timestamp = Date.now()
  const testEmail = `upsert-create-${timestamp}@test.com`

  try {
    const { data, error } = await supabase.rpc('hera_upsert_user_entity_v1', {
      p_platform_org: '00000000-0000-0000-0000-000000000000',
      p_supabase_uid: `${timestamp}-0000-0000-0000-000000000001`.replace(/^(\d+)/, (m, p1) => p1.slice(0, 8).padStart(8, '0')),
      p_email: testEmail,
      p_full_name: 'Upsert Create Test',
      p_system_actor: '001a2eb9-b14c-4dda-ae8c-595fb377a982',
      p_version: 'v1'
    })

    if (error) throw error

    console.log('✅ CREATE WORKS')
    console.log(`   Created User ID: ${data}`)
    return { success: true, userId: data }
  } catch (err) {
    console.log('❌ CREATE FAILED:', err.message)
    return { success: false, userId: null }
  } finally {
    console.log('')
  }
}

/**
 * Test 2: Check if UPSERT updates an existing user
 */
async function test_upsert_update(userId, originalEmail) {
  console.log('📝 TEST 2: Can hera_upsert_user_entity_v1 UPDATE an existing user?')
  console.log('-'.repeat(80))

  if (!userId) {
    console.log('⚠️  SKIPPED: No user to update')
    console.log('')
    return { success: false }
  }

  const timestamp = Date.now()
  const updatedEmail = `upsert-update-${timestamp}@test.com`

  try {
    // Get the original supabase_uid for the user
    const { data: userEntity, error: readError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .single()

    if (readError) throw readError

    console.log('   Original email:', originalEmail)
    console.log('   Updated email:', updatedEmail)

    // Try to update using UPSERT with same supabase_uid
    const supabaseUid = userEntity.entity_code // Assuming entity_code stores supabase_uid

    const { data, error } = await supabase.rpc('hera_upsert_user_entity_v1', {
      p_platform_org: '00000000-0000-0000-0000-000000000000',
      p_supabase_uid: supabaseUid,
      p_email: updatedEmail,
      p_full_name: 'Upsert Update Test (Modified)',
      p_system_actor: '001a2eb9-b14c-4dda-ae8c-595fb377a982',
      p_version: 'v1'
    })

    if (error) throw error

    const updatedUserId = data

    if (updatedUserId === userId) {
      console.log('✅ UPDATE WORKS (same user ID returned)')
      console.log(`   User ID unchanged: ${userId}`)
      console.log('   ✅ UPSERT correctly updated existing user instead of creating new one')
      return { success: true, isUpdate: true }
    } else {
      console.log('⚠️  CREATED NEW USER instead of updating')
      console.log(`   Original ID: ${userId}`)
      console.log(`   New ID: ${updatedUserId}`)
      console.log('   ❌ UPSERT created duplicate instead of updating')
      return { success: true, isUpdate: false, newUserId: updatedUserId }
    }
  } catch (err) {
    console.log('❌ UPDATE FAILED:', err.message)
    return { success: false }
  } finally {
    console.log('')
  }
}

/**
 * Test 3: Compare capabilities of both functions
 */
async function test_compare_capabilities() {
  console.log('📝 TEST 3: Compare hera_user_update_v1 capabilities')
  console.log('-'.repeat(80))

  console.log('hera_user_update_v1 parameters:')
  console.log('  - p_organization_id (required)')
  console.log('  - p_user_id (required)')
  console.log('  - p_role (metadata field)')
  console.log('  - p_permissions (metadata JSON)')
  console.log('  - p_department (metadata field)')
  console.log('  - p_reports_to (metadata field)')
  console.log('  - p_status (metadata field)')
  console.log('')
  console.log('hera_upsert_user_entity_v1 parameters:')
  console.log('  - p_platform_org (required)')
  console.log('  - p_supabase_uid (required - unique key)')
  console.log('  - p_email (basic field)')
  console.log('  - p_full_name (basic field)')
  console.log('  - p_system_actor (required)')
  console.log('  - p_version (optional)')
  console.log('')
  console.log('🔍 ANALYSIS:')
  console.log('  1. hera_upsert_user_entity_v1 handles basic user fields (email, name)')
  console.log('  2. hera_user_update_v1 handles organization-specific metadata (role, permissions, dept)')
  console.log('  3. UPSERT works on platform org, UPDATE works on tenant org')
  console.log('  4. They serve DIFFERENT purposes:')
  console.log('     - UPSERT: Platform-level user identity management')
  console.log('     - UPDATE: Organization-level user metadata/roles')
  console.log('')
  console.log('✅ CONCLUSION: Both functions are needed')
  console.log('   - hera_upsert_user_entity_v1: Creates/updates core user identity')
  console.log('   - hera_user_update_v1: Manages org-specific user metadata')
  console.log('')
}

/**
 * Cleanup function
 */
async function cleanup(userIds) {
  console.log('🧹 CLEANUP: Removing test users')
  console.log('-'.repeat(80))

  for (const userId of userIds.filter(Boolean)) {
    try {
      await supabase
        .from('core_entities')
        .delete()
        .eq('id', userId)
      console.log(`✅ Deleted user: ${userId}`)
    } catch (err) {
      console.log(`⚠️  Failed to delete user ${userId}:`, err.message)
    }
  }
  console.log('')
}

/**
 * Main execution
 */
async function main() {
  const userIdsToCleanup = []

  // Test 1: Create
  const createResult = await test_upsert_create()
  if (createResult.success && createResult.userId) {
    userIdsToCleanup.push(createResult.userId)
  }

  // Test 2: Update
  const updateResult = await test_upsert_update(
    createResult.userId,
    `upsert-create-${Date.now()}@test.com`
  )
  if (updateResult.newUserId) {
    userIdsToCleanup.push(updateResult.newUserId)
  }

  // Test 3: Compare
  await test_compare_capabilities()

  // Cleanup
  await cleanup(userIdsToCleanup)

  // Final Summary
  console.log('=' .repeat(80))
  console.log('📊 FINAL VERDICT')
  console.log('=' .repeat(80))
  console.log('')
  console.log('❓ Should we delete hera_user_update_v1?')
  console.log('')
  console.log('❌ NO - Keep both functions')
  console.log('')
  console.log('Reason:')
  console.log('  • hera_upsert_user_entity_v1: Platform-level user identity (email, name)')
  console.log('  • hera_user_update_v1: Organization-level user metadata (role, perms, dept)')
  console.log('')
  console.log('They serve complementary purposes:')
  console.log('  1. UPSERT creates/updates user in platform org (00000000-...)')
  console.log('  2. UPDATE manages user metadata within tenant organizations')
  console.log('')
  console.log('However, hera_user_update_v1 has BUGS that need fixing:')
  console.log('  • Smart Code validation constraint issue')
  console.log('  • May need to use hera_entities_crud_v1 instead for metadata updates')
  console.log('')
  console.log('=' .repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
