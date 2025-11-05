/**
 * Verify that demo@heraerp.com and cashew@heraerp.com are now properly configured
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USERS_TO_VERIFY = [
  'demo@heraerp.com',
  'cashew@heraerp.com',
  'salon@heraerp.com' // Include salon as reference
]

console.log('🔍 Verifying User Metadata Sync')
console.log('='.repeat(80))
console.log('')

async function verifyUser(email) {
  console.log(`📝 Verifying ${email}...`)
  console.log('-'.repeat(80))

  // Step 1: Get auth user
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.email === email)

  if (!authUser) {
    console.log(`❌ ${email} not found in auth.users`)
    console.log('')
    return false
  }

  const authUid = authUser.id
  const heraEntityId = authUser.user_metadata?.hera_user_entity_id

  console.log(`Auth UID: ${authUid}`)
  console.log(`hera_user_entity_id: ${heraEntityId || '❌ NOT SET'}`)

  if (!heraEntityId) {
    console.log(`❌ Missing hera_user_entity_id in auth metadata`)
    console.log('')
    return false
  }

  // Step 2: Get USER entity
  const { data: userEntity } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('id', heraEntityId)
    .single()

  if (!userEntity) {
    console.log(`❌ USER entity not found: ${heraEntityId}`)
    console.log('')
    return false
  }

  const entitySupabaseId = userEntity.metadata?.supabase_user_id

  console.log(`Entity ID: ${userEntity.id}`)
  console.log(`supabase_user_id: ${entitySupabaseId || '❌ NOT SET'}`)

  // Step 3: Verify bidirectional sync
  const authToEntity = heraEntityId === userEntity.id
  const entityToAuth = entitySupabaseId === authUid

  console.log('')
  console.log(`Auth → Entity: ${authToEntity ? '✅ MATCH' : '❌ MISMATCH'}`)
  console.log(`Entity → Auth: ${entityToAuth ? '✅ MATCH' : '❌ MISMATCH'}`)

  // Step 4: Test introspection
  console.log('')
  console.log(`🔍 Testing introspection...`)

  const { data: introspectData, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: heraEntityId
  })

  if (introspectError) {
    console.log(`❌ Introspection failed:`, introspectError.message)
    console.log('')
    return false
  }

  console.log(`✅ Introspection successful!`)
  console.log(`   Organizations: ${introspectData.organizations?.length || 0}`)
  console.log(`   Total Apps: ${introspectData.organizations?.reduce((sum, org) => sum + (org.apps?.length || 0), 0) || 0}`)

  if (introspectData.organizations && introspectData.organizations.length > 0) {
    const defaultOrg = introspectData.organizations[0]
    console.log(`   Default Org: ${defaultOrg.name}`)
    console.log(`   Default Org Apps: ${defaultOrg.apps?.map(a => a.code).join(', ') || 'NONE'}`)
  }

  console.log('')
  const success = authToEntity && entityToAuth && !introspectError
  console.log(success ? '✅ USER FULLY VERIFIED' : '❌ USER HAS ISSUES')
  console.log('')

  return success
}

// Verify all users
let results = []

for (const email of USERS_TO_VERIFY) {
  const success = await verifyUser(email)
  results.push({ email, success })
  console.log('='.repeat(80))
  console.log('')
}

// Final Summary
console.log('🎯 VERIFICATION SUMMARY:')
console.log('='.repeat(80))

results.forEach(({ email, success }) => {
  console.log(`${success ? '✅' : '❌'} ${email}`)
})

const allSuccess = results.every(r => r.success)

console.log('')
if (allSuccess) {
  console.log('🎉 ALL USERS ARE PROPERLY CONFIGURED!')
  console.log('✨ Authentication will work correctly for all verified users.')
} else {
  console.log('⚠️ Some users still have configuration issues.')
  console.log('Please review the detailed output above.')
}

console.log('='.repeat(80))
