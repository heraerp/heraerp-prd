#!/usr/bin/env node

/**
 * Fix User Membership for HERA Organization
 *
 * This script checks and fixes the USER_MEMBER_OF_ORG relationship
 * to resolve HERA_ACTOR_NOT_MEMBER errors.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ID = 'd794e63a-2d70-4b65-b560-0df667de221e'
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('🔍 CHECKING USER MEMBERSHIP')
console.log('=' .repeat(60))
console.log(`User ID: ${USER_ID}`)
console.log(`Organization ID: ${ORGANIZATION_ID}`)
console.log('')

// Step 1: Check if user entity exists
console.log('Step 1: Checking if user entity exists...')
const { data: userEntity, error: userError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', USER_ID)
  .single()

if (userError || !userEntity) {
  console.error('❌ User entity not found:', userError)
  process.exit(1)
}

console.log('✅ User entity found:', {
  id: userEntity.id,
  entity_name: userEntity.entity_name,
  entity_type: userEntity.entity_type,
  organization_id: userEntity.organization_id
})
console.log('')

// Step 2: Check if organization exists
console.log('Step 2: Checking if organization exists...')
const { data: orgEntity, error: orgError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', ORGANIZATION_ID)
  .eq('entity_type', 'ORGANIZATION')
  .single()

if (orgError || !orgEntity) {
  console.error('❌ Organization not found:', orgError)
  process.exit(1)
}

console.log('✅ Organization found:', {
  id: orgEntity.id,
  entity_name: orgEntity.entity_name,
  entity_type: orgEntity.entity_type
})
console.log('')

// Step 3: Check existing membership relationship
console.log('Step 3: Checking existing membership relationship...')
const { data: existingRel, error: relError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', USER_ID)
  .eq('to_entity_id', ORGANIZATION_ID)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('organization_id', ORGANIZATION_ID)

if (relError) {
  console.error('❌ Error checking relationship:', relError)
}

if (existingRel && existingRel.length > 0) {
  console.log('✅ Membership relationship already exists:', {
    count: existingRel.length,
    relationships: existingRel.map(r => ({
      id: r.id,
      from_entity_id: r.from_entity_id,
      to_entity_id: r.to_entity_id,
      relationship_type: r.relationship_type,
      organization_id: r.organization_id,
      status: r.status
    }))
  })

  // Check if any are inactive
  const inactiveRels = existingRel.filter(r => r.status !== 'active')
  if (inactiveRels.length > 0) {
    console.log('⚠️  Found inactive membership relationships')
    console.log('Activating them...')

    for (const rel of inactiveRels) {
      const { error: updateError } = await supabase
        .from('core_relationships')
        .update({ status: 'active' })
        .eq('id', rel.id)

      if (updateError) {
        console.error('❌ Failed to activate relationship:', updateError)
      } else {
        console.log('✅ Activated relationship:', rel.id)
      }
    }
  }
} else {
  console.log('⚠️  No membership relationship found. Creating one...')

  // Step 4: Create membership relationship
  const { data: newRel, error: createError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: USER_ID,
      to_entity_id: ORGANIZATION_ID,
      relationship_type: 'USER_MEMBER_OF_ORG',
      organization_id: ORGANIZATION_ID,
      smart_code: 'HERA.CORE.REL.USER_MEMBER_OF_ORG.V1',
      status: 'active',
      created_by: USER_ID,
      updated_by: USER_ID
    })
    .select()
    .single()

  if (createError) {
    console.error('❌ Failed to create membership relationship:', createError)
    process.exit(1)
  }

  console.log('✅ Created membership relationship:', {
    id: newRel.id,
    from_entity_id: newRel.from_entity_id,
    to_entity_id: newRel.to_entity_id,
    relationship_type: newRel.relationship_type,
    organization_id: newRel.organization_id,
    status: newRel.status
  })
}

console.log('')
console.log('=' .repeat(60))
console.log('✅ USER MEMBERSHIP CHECK/FIX COMPLETED')
console.log('')
console.log('You can now try deleting the customer again.')
