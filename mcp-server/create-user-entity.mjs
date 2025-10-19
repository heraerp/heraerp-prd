#!/usr/bin/env node

/**
 * Create User Entity and Membership for HERA
 *
 * Creates a USER entity for authenticated user and establishes
 * USER_MEMBER_OF_ORG relationship.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ID = 'd794e63a-2d70-4b65-b560-0df667de221e'
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

console.log('🔧 CREATING USER ENTITY AND MEMBERSHIP')
console.log('=' .repeat(60))
console.log(`User ID: ${USER_ID}`)
console.log(`Organization ID: ${ORGANIZATION_ID}`)
console.log(`Platform Org ID: ${PLATFORM_ORG_ID}`)
console.log('')

// Step 1: Check if user exists in Supabase Auth
console.log('Step 1: Checking Supabase Auth user...')
const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID)

if (authError || !authUser?.user) {
  console.error('❌ Auth user not found:', authError)
  process.exit(1)
}

console.log('✅ Auth user found:', {
  id: authUser.user.id,
  email: authUser.user.email,
  created_at: authUser.user.created_at
})
console.log('')

// Step 2: Check if platform organization exists
console.log('Step 2: Checking platform organization...')
const { data: platformOrg, error: platformOrgError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', PLATFORM_ORG_ID)
  .eq('entity_type', 'ORGANIZATION')
  .maybeSingle()

if (!platformOrg) {
  console.log('⚠️  Platform organization not found, creating it...')

  const { data: newPlatformOrg, error: createPlatformError } = await supabase
    .from('core_entities')
    .insert({
      id: PLATFORM_ORG_ID,
      entity_type: 'ORGANIZATION',
      entity_name: 'HERA Platform',
      smart_code: 'HERA.PLATFORM.ORG.V1',
      organization_id: PLATFORM_ORG_ID,
      status: 'active',
      created_by: USER_ID,
      updated_by: USER_ID
    })
    .select()
    .single()

  if (createPlatformError) {
    console.error('❌ Failed to create platform organization:', createPlatformError)
    process.exit(1)
  }

  console.log('✅ Created platform organization:', newPlatformOrg.id)
} else {
  console.log('✅ Platform organization exists:', platformOrg.id)
}
console.log('')

// Step 3: Check if user entity exists
console.log('Step 3: Checking if USER entity exists...')
const { data: existingUserEntity, error: checkError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', USER_ID)
  .maybeSingle()

if (existingUserEntity) {
  console.log('✅ USER entity already exists:', {
    id: existingUserEntity.id,
    entity_name: existingUserEntity.entity_name,
    entity_type: existingUserEntity.entity_type,
    organization_id: existingUserEntity.organization_id
  })
} else {
  console.log('⚠️  USER entity not found, creating it...')

  // Step 4: Create USER entity in platform organization
  const userName = authUser.user.email?.split('@')[0] || 'User'

  const { data: newUserEntity, error: createUserError } = await supabase
    .from('core_entities')
    .insert({
      id: USER_ID,
      entity_type: 'USER',
      entity_name: userName,
      smart_code: 'HERA.PLATFORM.USER.V1',
      organization_id: PLATFORM_ORG_ID, // Users belong to platform org
      status: 'active',
      created_by: USER_ID,
      updated_by: USER_ID,
      metadata: {
        email: authUser.user.email,
        auth_user_id: USER_ID
      }
    })
    .select()
    .single()

  if (createUserError) {
    console.error('❌ Failed to create USER entity:', createUserError)
    process.exit(1)
  }

  console.log('✅ Created USER entity:', {
    id: newUserEntity.id,
    entity_name: newUserEntity.entity_name,
    entity_type: newUserEntity.entity_type,
    organization_id: newUserEntity.organization_id
  })
}
console.log('')

// Step 5: Check target organization exists
console.log('Step 5: Checking target organization...')
const { data: targetOrg, error: targetOrgError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', ORGANIZATION_ID)
  .eq('entity_type', 'ORGANIZATION')
  .single()

if (targetOrgError || !targetOrg) {
  console.error('❌ Target organization not found:', targetOrgError)
  process.exit(1)
}

console.log('✅ Target organization found:', {
  id: targetOrg.id,
  entity_name: targetOrg.entity_name
})
console.log('')

// Step 6: Check/Create membership relationship
console.log('Step 6: Checking membership relationship...')
const { data: existingRel, error: relError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', USER_ID)
  .eq('to_entity_id', ORGANIZATION_ID)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('organization_id', ORGANIZATION_ID)

if (existingRel && existingRel.length > 0) {
  console.log('✅ Membership relationship already exists:', existingRel[0].id)

  // Ensure it's active
  const inactiveRels = existingRel.filter(r => r.status !== 'active')
  if (inactiveRels.length > 0) {
    for (const rel of inactiveRels) {
      await supabase
        .from('core_relationships')
        .update({ status: 'active' })
        .eq('id', rel.id)
      console.log('✅ Activated membership:', rel.id)
    }
  }
} else {
  console.log('⚠️  Membership relationship not found, creating it...')

  const { data: newRel, error: createRelError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: USER_ID,
      to_entity_id: ORGANIZATION_ID,
      relationship_type: 'USER_MEMBER_OF_ORG',
      organization_id: ORGANIZATION_ID,
      smart_code: 'HERA.CORE.REL.USER_MEMBER_OF_ORG.V1',
      status: 'active',
      created_by: USER_ID,
      updated_by: USER_ID,
      relationship_data: {
        role: 'admin',
        granted_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (createRelError) {
    console.error('❌ Failed to create membership relationship:', createRelError)
    process.exit(1)
  }

  console.log('✅ Created membership relationship:', {
    id: newRel.id,
    from_entity_id: newRel.from_entity_id,
    to_entity_id: newRel.to_entity_id,
    relationship_type: newRel.relationship_type,
    organization_id: newRel.organization_id
  })
}

console.log('')
console.log('=' .repeat(60))
console.log('✅ USER ENTITY AND MEMBERSHIP SETUP COMPLETED')
console.log('')
console.log('Summary:')
console.log(`  • User Entity: ${USER_ID}`)
console.log(`  • Organization: ${ORGANIZATION_ID}`)
console.log(`  • Membership: USER_MEMBER_OF_ORG`)
console.log('')
console.log('You can now try deleting the customer again.')
