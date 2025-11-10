import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('🔍 TESTING FIXED hera_users_list_v1 WITH METADATA EMAIL')
console.log('='.repeat(80))

const { data, error } = await supabase.rpc('hera_users_list_v1', {
  p_organization_id: TEST_ORG_ID,
  p_limit: 10,
  p_offset: 0
})

if (error) {
  console.log('❌ Error:', error)
  process.exit(1)
}

console.log('\n✅ SUCCESS - RPC returned data')
console.log(`📊 Found ${data.length} users\n`)

data.forEach((user, idx) => {
  console.log(`User #${idx + 1}:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email || '(null)'}`)
  console.log(`   Has Email: ${!!user.email ? '✅ YES' : '❌ NO'}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Role Entity ID: ${user.role_entity_id || '(null)'}`)
  console.log('')
})

const usersWithEmail = data.filter(u => u.email)
const usersWithoutEmail = data.filter(u => !u.email)

console.log('='.repeat(80))
console.log(`\n📈 SUMMARY:`)
console.log(`   Total Users: ${data.length}`)
console.log(`   Users with Email: ${usersWithEmail.length} ✅`)
console.log(`   Users without Email: ${usersWithoutEmail.length} ${usersWithoutEmail.length > 0 ? '⚠️' : ''}`)

if (usersWithEmail.length > 0) {
  console.log(`\n✅ FIX SUCCESSFUL - Emails are now being returned!`)
} else {
  console.log(`\n❌ ISSUE - No emails found, check metadata`)
}

console.log('\n' + '='.repeat(80))
