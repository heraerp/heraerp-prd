#!/usr/bin/env node

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Michele's complete identity mapping
const MICHELE_PROFILE = {
  email: 'michele@hairtalkz.ae',
  supabaseUID: '3ced4979-4c09-4e1e-8667-6707cfe6ec77',
  heraUserEntity: '2a81e783-85a0-4c5d-a434-916d3f72594a',
  organizationId: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  role: 'owner',
  platformOrg: '00000000-0000-0000-0000-000000000000'
}

async function verifyMicheleComplete() {
  console.log('🔍 HERA v2.2 Complete Verification - Michele Profile')
  console.log('='.repeat(60))
  console.log('Email:', MICHELE_PROFILE.email)
  console.log('Supabase UID:', MICHELE_PROFILE.supabaseUID)
  console.log('HERA USER Entity:', MICHELE_PROFILE.heraUserEntity)
  console.log('Organization:', MICHELE_PROFILE.organizationId)
  console.log('Role:', MICHELE_PROFILE.role)
  console.log('Platform Org:', MICHELE_PROFILE.platformOrg)
  console.log('='.repeat(60))

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 1. Verify USER entity exists with correct mapping
  console.log('\n1️⃣ Verifying HERA USER entity...')
  const { data: userEntity, error: userError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', MICHELE_PROFILE.heraUserEntity)
    .maybeSingle()

  if (userError || !userEntity) {
    console.error('❌ HERA USER entity not found:', userError)
  } else {
    console.log('✅ HERA USER entity found:')
    console.log(`   - ID: ${userEntity.id}`)
    console.log(`   - Type: ${userEntity.entity_type}`)
    console.log(`   - Name: ${userEntity.entity_name}`)
    console.log(`   - Organization: ${userEntity.organization_id}`)
    console.log(`   - Created by: ${userEntity.created_by}`)
  }

  // 2. Verify MEMBER_OF relationship exists
  console.log('\n2️⃣ Verifying MEMBER_OF relationship...')
  const { data: relationship, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', MICHELE_PROFILE.supabaseUID)  // Supabase UID
    .eq('to_entity_id', MICHELE_PROFILE.organizationId)
    .eq('relationship_type', 'MEMBER_OF')
    .maybeSingle()

  if (relError || !relationship) {
    console.error('❌ MEMBER_OF relationship not found:', relError)
  } else {
    console.log('✅ MEMBER_OF relationship found:')
    console.log(`   - From (Supabase UID): ${relationship.from_entity_id}`)
    console.log(`   - To (Organization): ${relationship.to_entity_id}`)
    console.log(`   - Type: ${relationship.relationship_type}`)
    console.log(`   - Role: ${relationship.relationship_data?.role}`)
    console.log(`   - Active: ${relationship.is_active}`)
  }

  // 3. Test resolve_user_identity_v1 RPC
  console.log('\n3️⃣ Testing resolve_user_identity_v1()...')
  try {
    const { data: identityResult, error: identityError } = await supabase
      .rpc('resolve_user_identity_v1')

    if (identityError) {
      console.error('❌ resolve_user_identity_v1 failed:', identityError)
    } else {
      console.log('✅ resolve_user_identity_v1 result:')
      console.log(JSON.stringify(identityResult, null, 2))
    }
  } catch (e) {
    console.error('❌ RPC call failed:', e.message)
  }

  // 4. Test resolve_user_roles_in_org RPC
  console.log('\n4️⃣ Testing resolve_user_roles_in_org()...')
  try {
    const { data: rolesResult, error: rolesError } = await supabase
      .rpc('resolve_user_roles_in_org', { p_org: MICHELE_PROFILE.organizationId })

    if (rolesError) {
      console.error('❌ resolve_user_roles_in_org failed:', rolesError)
    } else {
      console.log('✅ resolve_user_roles_in_org result:')
      console.log(JSON.stringify(rolesResult, null, 2))
    }
  } catch (e) {
    console.error('❌ RPC call failed:', e.message)
  }

  // 5. Verify organization entity
  console.log('\n5️⃣ Verifying organization entity...')
  const { data: orgEntity, error: orgError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', MICHELE_PROFILE.organizationId)
    .eq('entity_type', 'ORG')
    .maybeSingle()

  if (orgError || !orgEntity) {
    console.error('❌ Organization entity not found:', orgError)
  } else {
    console.log('✅ Organization entity found:')
    console.log(`   - ID: ${orgEntity.id}`)
    console.log(`   - Name: ${orgEntity.entity_name}`)
    console.log(`   - Type: ${orgEntity.entity_type}`)
    console.log(`   - Code: ${orgEntity.entity_code}`)
  }

  // 6. Test actor stamping verification
  console.log('\n6️⃣ Actor stamping verification summary:')
  console.log('Expected actor stamps for Michele writes:')
  console.log(`   - p_actor_user_id: "${MICHELE_PROFILE.heraUserEntity}"`)
  console.log(`   - p_organization_id: "${MICHELE_PROFILE.organizationId}"`)
  console.log(`   - created_by/updated_by: "${MICHELE_PROFILE.heraUserEntity}"`)

  console.log('\n🎉 HERA v2.2 Verification Complete!')
  console.log('Next: Test API endpoints with Michele\'s credentials')
}

verifyMicheleComplete().catch(console.error)