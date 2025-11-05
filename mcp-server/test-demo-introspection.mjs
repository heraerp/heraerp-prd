import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DEMO_EMAIL = 'demo@heraerp.com'
const DEMO_PASSWORD = 'demo123' // Assuming standard demo password

console.log('🔐 Testing demo@heraerp.com authentication flow...\n')
console.log('='.repeat(80))

// Step 1: Sign in as demo user
console.log('Step 1: Signing in as demo@heraerp.com...')
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD
})

if (authError) {
  console.error('❌ Auth error:', authError.message)
  process.exit(1)
}

console.log('✅ Signed in successfully')
console.log('   Auth UID:', authData.user.id)
console.log('   Email:', authData.user.email)
console.log('   Session token:', authData.session.access_token.substring(0, 20) + '...')
console.log('')

// Step 2: Call introspection RPC to see what it returns
console.log('Step 2: Calling hera_auth_introspect_v1...')

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: introspectData, error: introspectError } = await serviceClient.rpc(
  'hera_auth_introspect_v1',
  {
    p_auth_uid: authData.user.id
  }
)

if (introspectError) {
  console.error('❌ Introspection error:', introspectError.message)
  console.error('   Details:', introspectError)
} else {
  console.log('✅ Introspection successful')
  console.log('')
  console.log('📊 INTROSPECTION RESULT:')
  console.log('='.repeat(80))
  console.log(JSON.stringify(introspectData, null, 2))
  console.log('='.repeat(80))
  console.log('')

  // Parse the result
  if (introspectData) {
    console.log('📋 Parsed Data:')
    console.log('   User Entity ID:', introspectData.user_entity_id || 'NOT SET')
    console.log('   Organizations:', introspectData.organizations?.length || 0)

    if (introspectData.organizations && introspectData.organizations.length > 0) {
      introspectData.organizations.forEach((org, idx) => {
        console.log('')
        console.log(`   Organization ${idx + 1}:`)
        console.log('     Name:', org.name)
        console.log('     ID:', org.id)
        console.log('     Code:', org.code)
        console.log('     Role:', org.primary_role || org.user_role)
        console.log('     Apps:', org.apps?.length || 0)

        if (org.apps && org.apps.length > 0) {
          org.apps.forEach(app => {
            console.log('       - ' + app.name + ' (' + app.code + ')')
          })
        }
      })
    }
  }
}

console.log('')
console.log('='.repeat(80))
console.log('✅ Test complete')

// Sign out
await supabase.auth.signOut()
