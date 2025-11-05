import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DEMO_AUTH_UID = 'a55cc033-e909-4c59-b974-8ff3e098f2bf'

console.log('🔍 Testing hera_auth_introspect_v1 for demo@heraerp.com...\n')
console.log('='.repeat(80))
console.log('Auth UID:', DEMO_AUTH_UID)
console.log('')

console.log('Calling hera_auth_introspect_v1...')
const { data: introspectData, error: introspectError } = await supabase.rpc(
  'hera_auth_introspect_v1',
  {
    p_auth_uid: DEMO_AUTH_UID
  }
)

if (introspectError) {
  console.error('❌ Introspection error:', introspectError.message)
  console.error('   Code:', introspectError.code)
  console.error('   Details:', introspectError.details)
  console.error('   Hint:', introspectError.hint)
  process.exit(1)
}

console.log('✅ Introspection successful')
console.log('')
console.log('📊 FULL INTROSPECTION RESULT:')
console.log('='.repeat(80))
console.log(JSON.stringify(introspectData, null, 2))
console.log('='.repeat(80))
console.log('')

// Parse the result
if (introspectData) {
  console.log('📋 PARSED DATA:')
  console.log('   User Entity ID:', introspectData.user_entity_id || 'NOT SET')
  console.log('   Email:', introspectData.email || 'NOT SET')
  console.log('   Organizations:', introspectData.organizations?.length || 0)
  console.log('')

  if (introspectData.organizations && introspectData.organizations.length > 0) {
    introspectData.organizations.forEach((org, idx) => {
      console.log(`Organization ${idx + 1}: ${org.name}`)
      console.log('  ID:', org.id)
      console.log('  Code:', org.code)
      console.log('  Primary Role:', org.primary_role || 'NOT SET')
      console.log('  User Role:', org.user_role || 'NOT SET')
      console.log('  Roles Array:', JSON.stringify(org.roles || []))
      console.log('  Apps:', org.apps?.length || 0)

      if (org.apps && org.apps.length > 0) {
        org.apps.forEach(app => {
          console.log('    - ' + app.name + ' (' + app.code + ')')
          console.log('      ID:', app.id)
          console.log('      Config:', JSON.stringify(app.config || {}))
        })
      } else {
        console.log('    ❌ No apps')
      }
      console.log('')
    })
  } else {
    console.log('❌ No organizations found')
  }
}

console.log('='.repeat(80))
console.log('✅ Check complete')
