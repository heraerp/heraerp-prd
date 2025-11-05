/**
 * Check what hera_auth_introspect_v1 returns for demo@heraerp.com
 * This shows us EXACTLY what the authentication system sees
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DEMO_USER_AUTH_UID = 'a55cc033-e909-4c59-b974-8ff3e098f2bf'

console.log('🔍 Checking demo@heraerp.com Authentication Context')
console.log('='.repeat(80))
console.log('Auth UID:', DEMO_USER_AUTH_UID)
console.log('')

// Step 1: Check auth user metadata
console.log('📋 Step 1: Checking auth.users metadata...')
const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(DEMO_USER_AUTH_UID)

if (authError) {
  console.error('❌ Error fetching auth user:', authError.message)
  process.exit(1)
}

console.log('✅ Auth User Found:')
console.log('   Email:', authUser.user.email)
console.log('   Metadata:', JSON.stringify(authUser.user.user_metadata, null, 2))

const heraUserEntityId = authUser.user.user_metadata?.hera_user_entity_id
console.log('   hera_user_entity_id:', heraUserEntityId || '❌ NOT SET')
console.log('')

// Step 2: Try to find USER entity by metadata lookup
console.log('📋 Step 2: Looking up USER entity by supabase_user_id in metadata...')
const { data: userEntities, error: lookupError } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_type, metadata')
  .eq('entity_type', 'USER')
  .contains('metadata', { supabase_user_id: DEMO_USER_AUTH_UID })

if (lookupError) {
  console.error('❌ Error looking up USER entity:', lookupError.message)
} else if (userEntities && userEntities.length > 0) {
  console.log('✅ USER entity found via metadata lookup:')
  userEntities.forEach(ue => {
    console.log('   ID:', ue.id)
    console.log('   Name:', ue.entity_name)
    console.log('   Metadata:', JSON.stringify(ue.metadata, null, 2))
  })
} else {
  console.log('❌ No USER entity found with supabase_user_id in metadata')
}
console.log('')

// Step 3: Determine which user entity ID to use (mimics API logic)
const userEntityId = heraUserEntityId || userEntities?.[0]?.id || DEMO_USER_AUTH_UID

console.log('📋 Step 3: User Entity ID Resolution')
console.log('   Using user_entity_id:', userEntityId)
if (heraUserEntityId) {
  console.log('   Source: auth.user_metadata.hera_user_entity_id')
} else if (userEntities?.[0]?.id) {
  console.log('   Source: metadata lookup (core_entities.metadata->>supabase_user_id)')
} else {
  console.log('   Source: fallback to auth UID')
}
console.log('')

// Step 4: Call hera_auth_introspect_v1 (EXACTLY like the API does)
console.log('📋 Step 4: Calling hera_auth_introspect_v1...')
console.log('   RPC: hera_auth_introspect_v1')
console.log('   Params: { p_actor_user_id:', userEntityId, '}')
console.log('')

const { data: introspectData, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userEntityId
})

if (introspectError) {
  console.error('❌ Introspection RPC Error:', introspectError.message)
  console.error('   Code:', introspectError.code)
  console.error('   Details:', introspectError.details)
  console.error('   Hint:', introspectError.hint)
  process.exit(1)
}

console.log('✅ Introspection RPC Result:')
console.log('='.repeat(80))
console.log(JSON.stringify(introspectData, null, 2))
console.log('='.repeat(80))
console.log('')

// Step 5: Parse organizations and apps
console.log('📊 Step 5: Parsing Organizations and Apps...')
console.log('='.repeat(80))

if (!introspectData || !introspectData.organizations || introspectData.organizations.length === 0) {
  console.log('❌ NO ORGANIZATIONS FOUND')
  console.log('   User has no organization memberships in the system')
} else {
  console.log(`✅ Found ${introspectData.organizations.length} organization(s):`)
  console.log('')

  introspectData.organizations.forEach((org, idx) => {
    console.log(`[${idx + 1}] ${org.name}`)
    console.log('   ID:           ', org.id)
    console.log('   Code:         ', org.code)
    console.log('   Primary Role: ', org.primary_role)
    console.log('   All Roles:    ', JSON.stringify(org.roles || []))
    console.log('   Is Owner:     ', org.is_owner ? 'YES' : 'NO')
    console.log('   Is Admin:     ', org.is_admin ? 'YES' : 'NO')
    console.log('   Joined At:    ', org.joined_at)
    console.log('   Apps:         ', org.apps?.length || 0, 'app(s)')

    if (org.apps && org.apps.length > 0) {
      org.apps.forEach((app, appIdx) => {
        console.log(`      [${appIdx + 1}] ${app.name} (${app.code})`)
        if (app.config) {
          console.log('         Config:', JSON.stringify(app.config, null, 2))
        }
      })
    } else {
      console.log('      ❌ NO APPS linked to this organization')
    }
    console.log('')
  })
}

console.log('='.repeat(80))
console.log('🎯 SUMMARY')
console.log('='.repeat(80))
console.log('Auth UID:              ', DEMO_USER_AUTH_UID)
console.log('User Entity ID Used:   ', userEntityId)
console.log('Organizations Found:   ', introspectData?.organizations?.length || 0)
console.log('Total Apps Available:  ', introspectData?.organizations?.reduce((sum, org) => sum + (org.apps?.length || 0), 0) || 0)
console.log('')

if (introspectData?.organizations && introspectData.organizations.length > 0) {
  const defaultOrg = introspectData.organizations[0]
  console.log('Default Organization:  ', defaultOrg.name)
  console.log('Default Org ID:        ', defaultOrg.id)
  console.log('Default Org Apps:      ', defaultOrg.apps?.map(a => a.code).join(', ') || 'NONE')
  console.log('')

  if (defaultOrg.apps && defaultOrg.apps.some(a => a.code === 'CASHEW')) {
    console.log('🎯 FOUND THE ISSUE: CASHEW app IS linked to default organization!')
    console.log('   This is why the system loads Cashew app automatically.')
  } else {
    console.log('❓ MYSTERY: Cashew app NOT found in introspection data')
    console.log('   Need to check where Cashew data is coming from...')
  }
}

console.log('='.repeat(80))
