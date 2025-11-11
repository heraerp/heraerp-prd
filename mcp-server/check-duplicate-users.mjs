import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('🔍 INVESTIGATING DUPLICATE USERS')
console.log('='.repeat(80))

// Get all MEMBER_OF relationships for this org
const { data: memberships, error: memberError } = await supabase
  .from('core_relationships')
  .select('id, from_entity_id, created_at, relationship_data')
  .eq('organization_id', TEST_ORG_ID)
  .eq('relationship_type', 'MEMBER_OF')
  .order('created_at', { ascending: true })

if (memberError) {
  console.log('❌ Error:', memberError)
  process.exit(1)
}

console.log(`\n📊 Found ${memberships.length} MEMBER_OF relationships\n`)

// Group by from_entity_id to find duplicates
const userGroups = {}
memberships.forEach(m => {
  const userId = m.from_entity_id
  if (!userGroups[userId]) {
    userGroups[userId] = []
  }
  userGroups[userId].push(m)
})

// Get user details for all unique user IDs
const uniqueUserIds = Object.keys(userGroups)
const { data: users, error: userError } = await supabase
  .from('core_entities')
  .select('id, entity_name, metadata, created_at')
  .in('id', uniqueUserIds)
  .eq('entity_type', 'USER')

if (userError) {
  console.log('❌ Error:', userError)
  process.exit(1)
}

// Create a map for quick lookup
const userMap = {}
users.forEach(u => {
  userMap[u.id] = u
})

console.log('👥 USER ANALYSIS:')
console.log('-'.repeat(80))

for (const userId in userGroups) {
  const user = userMap[userId]
  const membershipCount = userGroups[userId].length

  console.log(`\n🔹 User: ${user?.entity_name || 'Unknown'} (${userId.substring(0, 8)}...)`)
  console.log(`   Email: ${user?.metadata?.email || 'No email'}`)
  console.log(`   Created: ${user?.created_at}`)
  console.log(`   MEMBER_OF count: ${membershipCount} ${membershipCount > 1 ? '⚠️ DUPLICATE!' : ''}`)

  if (membershipCount > 1) {
    console.log(`   Membership details:`)
    userGroups[userId].forEach((m, idx) => {
      console.log(`      ${idx + 1}. Created: ${m.created_at}`)
      console.log(`         ID: ${m.id}`)
      console.log(`         Data: ${JSON.stringify(m.relationship_data || {})}`)
    })
  }
}

console.log('\n' + '='.repeat(80))
console.log('\n📈 SUMMARY:')
const duplicateUsers = Object.keys(userGroups).filter(id => userGroups[id].length > 1)
console.log(`   Total unique users: ${uniqueUserIds.length}`)
console.log(`   Users with duplicate MEMBER_OF: ${duplicateUsers.length}`)
console.log(`   Total MEMBER_OF relationships: ${memberships.length}`)

if (duplicateUsers.length > 0) {
  console.log(`\n⚠️  ISSUE: ${duplicateUsers.length} users have multiple MEMBER_OF relationships`)
  console.log(`   This causes duplicate entries in hera_users_list_v1`)
  console.log(`\n💡 SOLUTION: Need to add DISTINCT or use proper de-duplication logic`)
}

console.log('\n' + '='.repeat(80))
