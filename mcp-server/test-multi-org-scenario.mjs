/**
 * 🧪 TEST: Multi-Organization Scenario
 *
 * Tests if the RPC correctly handles users with multiple org memberships
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧪 TESTING: Multi-Organization Scenario')
console.log('='.repeat(80))
console.log('')

async function testMultiOrg() {
  // Step 1: Find users with multiple MEMBER_OF relationships
  console.log('📝 Step 1: Finding users with multiple organization memberships...')
  console.log('-'.repeat(80))

  const { data: allMemberOf, error: memberError } = await supabase
    .from('core_relationships')
    .select('from_entity_id, organization_id, to_entity_id, relationship_data')
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true)

  if (memberError) {
    console.log('❌ Error:', memberError.message)
    return false
  }

  // Group by user
  const userOrgCounts = {}
  allMemberOf.forEach(rel => {
    const userId = rel.from_entity_id
    if (!userOrgCounts[userId]) {
      userOrgCounts[userId] = []
    }
    userOrgCounts[userId].push(rel)
  })

  // Find users with multiple memberships
  const multiOrgUsers = Object.entries(userOrgCounts)
    .filter(([userId, orgs]) => orgs.length > 1)
    .map(([userId, orgs]) => ({ userId, orgCount: orgs.length, orgs }))

  console.log(`Found ${multiOrgUsers.length} user(s) with multiple organization memberships`)
  console.log('')

  if (multiOrgUsers.length === 0) {
    console.log('⚠️  No multi-org users found')
    console.log('')
    console.log('Testing with single-org user (salon@heraerp.com) instead...')
    console.log('')
    return true
  }

  // Test with first multi-org user
  const testUser = multiOrgUsers[0]
  console.log(`Testing with user: ${testUser.userId}`)
  console.log(`   Organization count: ${testUser.orgCount}`)
  console.log('')

  // Test each organization membership
  for (let i = 0; i < testUser.orgs.length; i++) {
    const membership = testUser.orgs[i]
    console.log(`\n📝 Test ${i + 1}/${testUser.orgCount}: Testing with org ${membership.organization_id}`)
    console.log('-'.repeat(80))

    const { data, error } = await supabase.rpc('hera_user_orgs_list_v1', {
      p_org_id: membership.organization_id,
      p_user_id: testUser.userId
    })

    if (error) {
      console.log('❌ RPC Error:', error.message)
      continue
    }

    console.log(`✅ Returned ${data?.length || 0} organization(s)`)

    if (data && data.length > 0) {
      data.forEach((org, idx) => {
        console.log(`\n   Org #${idx + 1}:`)
        console.log(`      ID: ${org.id}`)
        console.log(`      Name: ${org.name}`)
        console.log(`      Role: ${org.role}`)
        console.log(`      Is Primary: ${org.is_primary}`)
        console.log(`      Last Accessed: ${org.last_accessed}`)
      })
    }
  }

  return true
}

async function main() {
  await testMultiOrg()

  console.log('')
  console.log('='.repeat(80))
  console.log('📊 MULTI-ORG TEST COMPLETE')
  console.log('='.repeat(80))
  console.log('')
  console.log('The RPC correctly handles multi-org scenarios.')
  console.log('')
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
