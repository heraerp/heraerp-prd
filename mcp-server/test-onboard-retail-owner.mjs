/**
 * Test: Onboard Retail Owner User
 * Creates: retail@heraerp.com
 * Onboards to: HERA Retail Demo (ORG_OWNER)
 * Tests: Updated hera_onboard_user_v1 with auth metadata sync
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const RETAIL_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c'

async function onboardRetailOwner() {
  console.log('🏪 Creating and Onboarding Retail Owner...\n')
  console.log('Email:    retail@heraerp.com')
  console.log('Org:      HERA Retail Demo')
  console.log('Role:     ORG_OWNER')
  console.log('='.repeat(80) + '\n')

  // Step 1: Create Supabase auth user
  console.log('📝 Step 1: Creating Supabase auth user...')
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'retail@heraerp.com',
    password: 'demo2025!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Retail Owner',
      business_name: 'HERA Retail Demo',
      role: 'owner'
    }
  })

  if (authError) {
    console.error('❌ Auth Error:', authError.message)
    return
  }

  const userId = authData.user.id
  console.log('✅ User created:', userId)
  console.log('   Email:', authData.user.email)
  console.log('   Metadata:', JSON.stringify(authData.user.user_metadata, null, 2))
  console.log('')

  // Step 2: Get actor user (any existing user in platform org)
  console.log('📝 Step 2: Finding actor user...')
  const { data: actors } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .eq('entity_type', 'USER')
    .limit(1)

  const actorUserId = actors && actors.length > 0 ? actors[0].id : userId
  console.log('✅ Using actor:', actors && actors.length > 0 ? actors[0].entity_name : 'Self', '(' + actorUserId + ')')
  console.log('')

  // Step 3: Onboard user with hera_onboard_user_v1
  console.log('📝 Step 3: Onboarding user with hera_onboard_user_v1...')
  console.log('   Testing: Updated RPC with auth metadata sync')
  console.log('')

  const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: userId,
    p_organization_id: RETAIL_ORG_ID,
    p_actor_user_id: actorUserId,
    p_role: 'owner'
  })

  if (onboardError) {
    console.error('❌ Onboard Error:', onboardError)
    console.error('   Message:', onboardError.message)
    console.error('   Hint:', onboardError.hint)
    console.error('   Details:', onboardError.details)
    return
  }

  console.log('✅ User onboarded successfully!')
  console.log('📊 Onboard Result:')
  console.log(JSON.stringify(onboardResult, null, 2))
  console.log('')

  // Step 4: Verify bidirectional auth metadata sync
  console.log('📝 Step 4: Verifying bidirectional auth metadata sync...')
  console.log('='.repeat(80))

  // 4a: Check auth.users metadata -> hera_user_entity_id
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  
  const heraUserEntityId = authUser.user.user_metadata?.hera_user_entity_id || 
                          authUser.user.raw_user_meta_data?.hera_user_entity_id

  console.log('\n✅ Auth → Entity Mapping:')
  console.log('   auth.users.id:                    ', userId)
  console.log('   auth.users.user_metadata:          ', JSON.stringify(authUser.user.user_metadata, null, 2))
  console.log('   → hera_user_entity_id:            ', heraUserEntityId || '❌ NOT SET')

  // 4b: Check core_entities metadata -> supabase_user_id
  const userEntityId = onboardResult.user_entity_id
  const { data: userEntity } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('id', userEntityId)
    .single()

  const supabaseUserId = userEntity?.metadata?.supabase_user_id

  console.log('\n✅ Entity → Auth Mapping:')
  console.log('   core_entities.id:                 ', userEntity.id)
  console.log('   core_entities.entity_name:        ', userEntity.entity_name)
  console.log('   core_entities.metadata:            ', JSON.stringify(userEntity.metadata, null, 2))
  console.log('   → supabase_user_id:               ', supabaseUserId || '❌ NOT SET')

  // 4c: Verify bidirectional sync
  console.log('\n📊 BIDIRECTIONAL SYNC VERIFICATION:')
  console.log('='.repeat(80))
  
  const authToEntityWorks = heraUserEntityId === userEntityId
  const entityToAuthWorks = supabaseUserId === userId

  console.log('Auth → Entity:    ', authToEntityWorks ? '✅ WORKING' : '❌ FAILED')
  console.log('  Expected:       ', userEntityId)
  console.log('  Actual:         ', heraUserEntityId)
  console.log('')
  console.log('Entity → Auth:    ', entityToAuthWorks ? '✅ WORKING' : '❌ FAILED')
  console.log('  Expected:       ', userId)
  console.log('  Actual:         ', supabaseUserId)
  console.log('='.repeat(80))

  // Step 5: Verify membership and role
  console.log('\n📝 Step 5: Verifying membership and role...')
  
  const { data: membership } = await supabase
    .from('core_relationships')
    .select('id, relationship_type, relationship_data, from_entity_id, to_entity_id')
    .eq('organization_id', RETAIL_ORG_ID)
    .eq('from_entity_id', userEntityId)
    .eq('relationship_type', 'MEMBER_OF')
    .single()

  const { data: hasRole } = await supabase
    .from('core_relationships')
    .select('id, relationship_type, relationship_data, to_entity_id')
    .eq('organization_id', RETAIL_ORG_ID)
    .eq('from_entity_id', userEntityId)
    .eq('relationship_type', 'HAS_ROLE')
    .single()

  console.log('\n✅ MEMBER_OF Relationship:')
  console.log('   ID:              ', membership?.id)
  console.log('   Role:            ', membership?.relationship_data?.role)
  console.log('')
  console.log('✅ HAS_ROLE Relationship:')
  console.log('   ID:              ', hasRole?.id)
  console.log('   Role Code:       ', hasRole?.relationship_data?.role_code)
  console.log('   Is Primary:      ', hasRole?.relationship_data?.is_primary ? 'YES' : 'NO')

  // Final Summary
  console.log('\n' + '='.repeat(80))
  console.log('🎯 FINAL SUMMARY:')
  console.log('='.repeat(80))
  console.log('User Created:              ✅ YES')
  console.log('User Onboarded:            ✅ YES')
  console.log('Auth Metadata Sync:        ' + (authToEntityWorks && entityToAuthWorks ? '✅ WORKING' : '❌ FAILED'))
  console.log('Membership Created:        ' + (membership ? '✅ YES' : '❌ NO'))
  console.log('Role Assigned:             ' + (hasRole ? '✅ YES (ORG_OWNER)' : '❌ NO'))
  console.log('='.repeat(80))
  console.log('\n💡 You can now login with:')
  console.log('   Email:    retail@heraerp.com')
  console.log('   Password: demo2025!')
  console.log('   Org:      HERA Retail Demo\n')
}

onboardRetailOwner()
