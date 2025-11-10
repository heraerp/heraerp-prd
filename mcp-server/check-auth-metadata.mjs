import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const RETAIL_USER_AUTH_ID = 'b9789231-866a-4bca-921f-9148deb36eac'

console.log('🔍 Checking Auth User Metadata\n')
console.log('='.repeat(80))

const { data: authUser, error } = await supabase.auth.admin.getUserById(RETAIL_USER_AUTH_ID)

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log('✅ Auth User Data:')
console.log('='.repeat(80))
console.log('Auth UID:          ', authUser.user.id)
console.log('Email:             ', authUser.user.email)
console.log('')
console.log('📋 user_metadata:')
console.log(JSON.stringify(authUser.user.user_metadata, null, 2))
console.log('')

console.log('='.repeat(80))
console.log('🎯 KEY FIELDS FOR LOGIN:')
console.log('='.repeat(80))
console.log('Auth UID (from session):           ', authUser.user.id)
console.log('User Entity ID (from metadata):    ', authUser.user.user_metadata?.hera_user_entity_id || '❌ NOT SET')
console.log('')
console.log('💡 WHEN USER LOGS IN:')
console.log('1. Supabase auth returns session.user object')
console.log('2. session.user.id = Auth UID =', authUser.user.id)
console.log('3. session.user.user_metadata.hera_user_entity_id = User Entity ID')
console.log('4. We should use the entity ID to query memberships!')
console.log('='.repeat(80))
