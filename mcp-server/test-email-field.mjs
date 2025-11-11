import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'

console.log('🔍 TESTING EMAIL FIELD IN hera_users_list_v1')
console.log('='.repeat(80))

const { data, error } = await supabase.rpc('hera_users_list_v1', {
  p_organization_id: TEST_ORG_ID,
  p_limit: 5,
  p_offset: 0
})

if (error) {
  console.log('❌ Error:', error)
  process.exit(1)
}

console.log('\n📊 RAW DATA STRUCTURE:')
console.log(JSON.stringify(data, null, 2))

console.log('\n📋 EMAIL FIELD CHECK:')
data?.forEach((user, idx) => {
  console.log(`\nUser #${idx + 1}:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email || '(null)'}`)
  console.log(`   Email Type: ${typeof user.email}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Role Entity ID: ${user.role_entity_id || '(null)'}`)
})

console.log('\n' + '='.repeat(80))
