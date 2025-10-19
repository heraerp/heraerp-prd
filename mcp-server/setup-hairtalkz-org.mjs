#!/usr/bin/env node

/**
 * Setup Hair Talkz Organization
 *
 * Creates the Hair Talkz organization entity and user membership.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ID = 'd794e63a-2d70-4b65-b560-0df667de221e'
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('🏢 SETTING UP HAIR TALKZ ORGANIZATION')
console.log('=' .repeat(60))

// Step 1: Check if organization exists
console.log('Step 1: Checking if Hair Talkz organization exists...')
const { data: existingOrg, error: checkError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', ORGANIZATION_ID)
  .maybeSingle()

if (existingOrg) {
  console.log('✅ Organization already exists:', {
    id: existingOrg.id,
    entity_name: existingOrg.entity_name,
    entity_type: existingOrg.entity_type
  })
} else {
  console.log('⚠️  Organization not found. Creating Hair Talkz organization...')

  const { data: newOrg, error: createError } = await supabase
    .from('core_entities')
    .insert({
      id: ORGANIZATION_ID,
      entity_type: 'ORGANIZATION',
      entity_name: 'Hair Talkz',
      smart_code: 'HERA.SALON.ORG.V1',
      organization_id: ORGANIZATION_ID, // Organizations are self-referential
      status: 'active',
      created_by: USER_ID,
      updated_by: USER_ID,
      metadata: {
        industry: 'salon',
        business_type: 'beauty_salon'
      }
    })
    .select()
    .single()

  if (createError) {
    console.error('❌ Failed to create organization:', createError)
    process.exit(1)
  }

  console.log('✅ Created Hair Talkz organization:', {
    id: newOrg.id,
    entity_name: newOrg.entity_name,
    entity_type: newOrg.entity_type
  })
}

console.log('')

// Step 2: Check/Create membership relationship
console.log('Step 2: Setting up user membership...')
const { data: existingRel, error: relError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', USER_ID)
  .eq('to_entity_id', ORGANIZATION_ID)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('organization_id', ORGANIZATION_ID)

if (existingRel && existingRel.length > 0) {
  console.log('✅ Membership relationship already exists:', {
    count: existingRel.length,
    id: existingRel[0].id
  })
} else {
  console.log('⚠️  Creating membership relationship...')

  const { data: newRel, error: createRelError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: USER_ID,
      to_entity_id: ORGANIZATION_ID,
      relationship_type: 'USER_MEMBER_OF_ORG',
      organization_id: ORGANIZATION_ID,
      smart_code: 'HERA.CORE.REL.USER_MEMBER_OF_ORG.V1',
      created_by: USER_ID,
      updated_by: USER_ID,
      relationship_data: {
        role: 'owner',
        granted_at: new Date().toISOString(),
        permissions: ['admin', 'delete', 'write', 'read']
      }
    })
    .select()
    .single()

  if (createRelError) {
    console.error('❌ Failed to create membership:', createRelError)
    process.exit(1)
  }

  console.log('✅ Created membership relationship:', {
    id: newRel.id,
    from_entity_id: newRel.from_entity_id,
    to_entity_id: newRel.to_entity_id,
    relationship_type: newRel.relationship_type
  })
}

console.log('')
console.log('=' .repeat(60))
console.log('✅ HAIR TALKZ ORGANIZATION SETUP COMPLETED')
console.log('')
console.log('Summary:')
console.log(`  • Organization: Hair Talkz (${ORGANIZATION_ID})`)
console.log(`  • User: hairtalkz01 (${USER_ID})`)
console.log(`  • Membership: USER_MEMBER_OF_ORG (owner)`)
console.log('')
console.log('The user can now perform DELETE operations.')
