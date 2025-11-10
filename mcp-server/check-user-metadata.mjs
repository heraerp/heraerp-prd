import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('🔍 CHECKING USER METADATA FOR EMAIL LINKING')
console.log('='.repeat(80))

// Get users from the organization
const { data: users, error: usersError } = await supabase
  .from('core_entities')
  .select('id, entity_name, metadata')
  .eq('entity_type', 'USER')
  .in('id', [
    'b3fcd455-7df2-42d2-bdd1-c962636cc8a7',
    '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
    '001a2eb9-b14c-4dda-ae8c-595fb377a982'
  ])

if (usersError) {
  console.log('❌ Error fetching users:', usersError)
  process.exit(1)
}

console.log('\n📊 USER METADATA CHECK:')
console.log('-'.repeat(80))

users.forEach(user => {
  console.log(`\n👤 User: ${user.entity_name} (${user.id})`)
  console.log(`   Metadata:`, JSON.stringify(user.metadata, null, 2))
  console.log(`   Has supabase_user_id: ${!!user.metadata?.supabase_user_id}`)
  console.log(`   supabase_user_id value: ${user.metadata?.supabase_user_id || 'MISSING'}`)
})

console.log('\n' + '='.repeat(80))
console.log('\n🔍 CHECKING IF THESE USERS EXIST IN auth.users:')
console.log('-'.repeat(80))

const supabaseUserIds = users
  .map(u => u.metadata?.supabase_user_id)
  .filter(Boolean)

if (supabaseUserIds.length === 0) {
  console.log('\n❌ NO USERS HAVE supabase_user_id IN METADATA!')
  console.log('   This is why emails are NULL - the JOIN cannot find auth.users records')
  console.log('\n💡 SOLUTION: USER entities need metadata.supabase_user_id = auth.users.id')
} else {
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log('❌ Error fetching auth users:', authError)
  } else {
    console.log(`\n✅ Found ${authUsers.users.length} auth.users records`)

    supabaseUserIds.forEach(id => {
      const authUser = authUsers.users.find(u => u.id === id)
      if (authUser) {
        console.log(`   ✅ ${id} → ${authUser.email}`)
      } else {
        console.log(`   ❌ ${id} → NOT FOUND in auth.users`)
      }
    })
  }
}

console.log('\n' + '='.repeat(80))
