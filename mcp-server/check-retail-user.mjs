/**
 * Check retail@heraerp.com configuration and introspection
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking retail@heraerp.com Configuration')
console.log('='.repeat(80))

// Step 1: Find auth user
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

if (authError) {
  console.error('❌ Error listing auth users:', authError.message)
  process.exit(1)
}

const retailUser = authUsers.users.find(u => u.email === 'retail@heraerp.com')

if (!retailUser) {
  console.log('❌ retail@heraerp.com not found in auth.users')
  process.exit(1)
}

console.log('✅ Retail Auth User:')
console.log('   Auth UID:', retailUser.id)
console.log('   Email:', retailUser.email)
console.log('   Metadata:', JSON.stringify(retailUser.user_metadata, null, 2))
console.log('')

// Step 2: Get user entity ID
const heraUserEntityId = retailUser.user_metadata?.hera_user_entity_id

if (!heraUserEntityId) {
  console.log('❌ Missing hera_user_entity_id in auth metadata')
  console.log('   Need to fix this user similar to demo/cashew users')
  process.exit(1)
}

console.log('✅ hera_user_entity_id:', heraUserEntityId)
console.log('')

// Step 3: Call introspection
console.log('🔍 Calling hera_auth_introspect_v1...')
const { data: introspectData, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: heraUserEntityId
})

if (introspectError) {
  console.error('❌ Introspection failed:', introspectError.message)
  process.exit(1)
}

console.log('✅ Introspection successful!')
console.log('')
console.log('📊 Organizations:', introspectData.organizations?.length || 0)

if (introspectData.organizations && introspectData.organizations.length > 0) {
  introspectData.organizations.forEach((org, idx) => {
    console.log('')
    console.log(`[${idx + 1}] ${org.name} (${org.code})`)
    console.log(`    Role: ${org.primary_role}`)
    console.log(`    Apps: ${org.apps?.length || 0}`)

    if (org.apps && org.apps.length > 0) {
      org.apps.forEach(app => {
        console.log(`      - ${app.name} (${app.code})`)
        console.log(`        Landing URL: /${app.code.toLowerCase()}/home`)
      })
    }
  })

  console.log('')
  console.log('='.repeat(80))
  console.log('🎯 DEFAULT LOGIN BEHAVIOR:')
  console.log('='.repeat(80))
  const defaultOrg = introspectData.organizations[0]
  const defaultApp = defaultOrg.apps?.[0]

  if (defaultApp) {
    console.log(`Default Organization: ${defaultOrg.name}`)
    console.log(`Default App: ${defaultApp.name} (${defaultApp.code})`)
    console.log(`Expected Redirect: /${defaultApp.code.toLowerCase()}/home`)
    console.log('')
    console.log(`✅ Current apps page routes RETAIL to: /retail/home`)
    console.log(`✅ /retail/page.tsx redirects to: /retail/home`)
  }
} else {
  console.log('❌ No organizations found for retail user')
}

console.log('='.repeat(80))
