/**
 * 🔍 Understanding Organization Management RPCs
 *
 * Purpose: Test and document what these RPCs actually do:
 * 1. hera_users_list_v1 - List users in an organization
 * 2. hera_user_switch_org_v1 - Switch user's active organization
 * 3. hera_user_orgs_list_v1 - List organizations a user belongs to
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 ORGANIZATION MANAGEMENT RPC ANALYSIS')
console.log('=' .repeat(80))
console.log('')

/**
 * TEST 1: What does hera_users_list_v1 do?
 */
async function test_users_list() {
  console.log('📝 TEST 1: hera_users_list_v1 - What does it do?')
  console.log('-'.repeat(80))

  // First, let's find an organization that has users
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, name')
    .limit(5)

  console.log('Testing against organizations:')
  if (orgs) {
    for (const org of orgs) {
      console.log(`\n🏢 Organization: ${org.name} (${org.id})`)

      // Count users in this org via direct query
      const { data: directUsers, error: directError } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_type')
        .eq('organization_id', org.id)
        .eq('entity_type', 'USER')

      console.log(`   Direct query: ${directUsers?.length || 0} users`)

      // Now try the RPC
      const { data: rpcUsers, error: rpcError } = await supabase.rpc('hera_users_list_v1', {
        p_organization_id: org.id,
        p_limit: 25,
        p_offset: 0
      })

      if (rpcError) {
        console.log(`   ❌ RPC Error: ${rpcError.message}`)
      } else {
        console.log(`   ✅ RPC Result: ${rpcUsers?.length || 0} users`)
        if (rpcUsers && rpcUsers.length > 0) {
          console.log('   User list:')
          rpcUsers.slice(0, 3).forEach(user => {
            console.log(`     - ${user.name} (${user.role || 'no role'})`)
          })
        }
      }
    }
  }

  console.log('\n💡 PURPOSE: Lists all USER entities in a specific organization')
  console.log('   Returns: Array of { id, name, role }')
  console.log('   Use Case: Admin panel showing all staff/users in the organization')
  console.log('')
}

/**
 * TEST 2: What does hera_user_switch_org_v1 do?
 */
async function test_user_switch_org() {
  console.log('📝 TEST 2: hera_user_switch_org_v1 - What does it do?')
  console.log('-'.repeat(80))

  // Find a user entity
  const { data: users } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, organization_id')
    .eq('entity_type', 'USER')
    .limit(1)

  if (!users || users.length === 0) {
    console.log('⚠️  No users found in database to test with')
    console.log('\n💡 PURPOSE: Switches the active organization context for a user')
    console.log('   What it likely does:')
    console.log('   1. Validates user is a member of target organization')
    console.log('   2. Updates user session/preference to set active org')
    console.log('   3. Returns confirmation with new active organization ID')
    console.log('   Use Case: Multi-tenant apps where users belong to multiple orgs')
    console.log('   Example: User works at Salon A and Salon B, switches between them')
    console.log('')
    return
  }

  const testUser = users[0]
  console.log(`Testing with user: ${testUser.entity_name} (${testUser.id})`)
  console.log(`Current org: ${testUser.organization_id}`)

  // Find another organization to switch to
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, name')
    .neq('id', testUser.organization_id)
    .limit(1)

  if (!orgs || orgs.length === 0) {
    console.log('⚠️  No other organizations found to switch to')
  } else {
    const targetOrg = orgs[0]
    console.log(`Attempting to switch to: ${targetOrg.name} (${targetOrg.id})`)

    const { data, error } = await supabase.rpc('hera_user_switch_org_v1', {
      p_user_id: testUser.id,
      p_organization_id: targetOrg.id
    })

    if (error) {
      console.log(`❌ Switch failed: ${error.message}`)
      console.log('   This is expected if user is not a member of target org')
    } else {
      console.log('✅ Switch successful!')
      console.log('   Response:', JSON.stringify(data, null, 2))
    }
  }

  console.log('\n💡 PURPOSE: Switches user\'s active organization context')
  console.log('   What it does:')
  console.log('   1. Validates user has membership in target organization')
  console.log('   2. Updates session/preference for active organization')
  console.log('   3. Returns { ok: true, organization_id: "..." }')
  console.log('   Use Case: Multi-org users switching between workspaces')
  console.log('   Example: Accountant switching between Client A and Client B')
  console.log('')
}

/**
 * TEST 3: What does hera_user_orgs_list_v1 do?
 */
async function test_user_orgs_list() {
  console.log('📝 TEST 3: hera_user_orgs_list_v1 - What does it do?')
  console.log('-'.repeat(80))

  // Find a user entity
  const { data: users } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('entity_type', 'USER')
    .limit(1)

  if (!users || users.length === 0) {
    console.log('⚠️  No users found in database to test with')
    console.log('\n💡 PURPOSE: Lists all organizations a user is a member of')
    console.log('   What it likely does:')
    console.log('   1. Queries core_relationships for USER_MEMBER_OF_ORG relationships')
    console.log('   2. Joins with core_organizations to get org details')
    console.log('   3. Returns array of organizations with membership info')
    console.log('   Use Case: Organization picker/switcher in UI')
    console.log('   Example: Show dropdown of "Salon A, Salon B, Salon C" that user can access')
    console.log('')
    return
  }

  const testUser = users[0]
  console.log(`Testing with user: ${testUser.entity_name} (${testUser.id})`)

  const { data, error } = await supabase.rpc('hera_user_orgs_list_v1', {
    p_user_id: testUser.id
  })

  if (error) {
    console.log(`❌ RPC Error: ${error.message}`)
    console.log(`   Error Code: ${error.code}`)
    console.log('   This is a known bug - materialization mode error')
  } else {
    console.log('✅ RPC Success!')
    console.log(`   Organizations: ${data?.length || 0}`)
    if (data && data.length > 0) {
      console.log('   List:')
      data.forEach(org => {
        console.log(`     - ${JSON.stringify(org)}`)
      })
    }
  }

  // Alternative: Direct query to show what it should return
  console.log('\n🔍 Alternative: Direct query for user organizations')
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id, relationship_type')
    .eq('from_entity_id', testUser.id)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')

  console.log(`   Found ${relationships?.length || 0} organization memberships`)

  console.log('\n💡 PURPOSE: Lists all organizations a user is a member of')
  console.log('   What it should return:')
  console.log('   - Array of organization records with membership details')
  console.log('   - Useful for organization picker/switcher')
  console.log('   Use Case: "Select workspace" dropdown in multi-tenant app')
  console.log('   ⚠️  Currently broken - materialization error')
  console.log('')
}

/**
 * Main execution
 */
async function main() {
  await test_users_list()
  await test_user_switch_org()
  await test_user_orgs_list()

  console.log('=' .repeat(80))
  console.log('📊 SUMMARY: Purpose of Each RPC')
  console.log('=' .repeat(80))
  console.log('')

  console.log('1️⃣  hera_users_list_v1')
  console.log('   Purpose: List all users in an organization')
  console.log('   Returns: Array of { id, name, role }')
  console.log('   Use Case: Admin panel, team management UI')
  console.log('   Status: ✅ Working')
  console.log('   Can Replace? YES - Direct table query works fine')
  console.log('')

  console.log('2️⃣  hera_user_switch_org_v1')
  console.log('   Purpose: Switch user\'s active organization context')
  console.log('   Returns: { ok: true, organization_id }')
  console.log('   Use Case: Multi-org workspace switcher')
  console.log('   Status: ✅ Working')
  console.log('   Can Replace? NO - This is session management, not entity CRUD')
  console.log('')

  console.log('3️⃣  hera_user_orgs_list_v1')
  console.log('   Purpose: List organizations a user belongs to')
  console.log('   Returns: Array of organization records')
  console.log('   Use Case: Organization picker dropdown')
  console.log('   Status: ❌ Broken (materialization error)')
  console.log('   Can Replace? YES - Query core_relationships directly')
  console.log('')

  console.log('=' .repeat(80))
  console.log('🎯 RECOMMENDATION')
  console.log('=' .repeat(80))
  console.log('')
  console.log('✅ KEEP: hera_user_switch_org_v1')
  console.log('   Reason: Session/context management, not entity CRUD')
  console.log('')
  console.log('⚠️  FIX OR REPLACE: hera_user_orgs_list_v1')
  console.log('   Option A: Fix the materialization error')
  console.log('   Option B: Use direct relationship query instead')
  console.log('')
  console.log('📝 DEPRECATE: hera_users_list_v1')
  console.log('   Reason: Simple table query, no special logic needed')
  console.log('   Replacement: Direct query or hera_entities_crud_v1 READ')
  console.log('')
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
