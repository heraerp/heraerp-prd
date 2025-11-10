#!/usr/bin/env node

/**
 * Find the salon@heraerp.com user in HERA SalonDemo org
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Finding salon@heraerp.com user in HERA SalonDemo org\n')

// Step 1: Find HERA SalonDemo organization
console.log('Step 1: Finding HERA SalonDemo organization...')
const { data: org, error: orgError } = await supabase
  .from('core_organizations')
  .select('id, organization_name, organization_code')
  .ilike('organization_name', '%salon%demo%')
  .limit(5)

if (orgError) {
  console.error('❌ Error finding organization:', orgError.message)
  process.exit(1)
}

if (!org || org.length === 0) {
  console.log('❌ HERA SalonDemo organization not found')
  console.log('\nTrying alternative search...')

  const { data: allOrgs } = await supabase
    .from('core_organizations')
    .select('id, organization_name, organization_code')
    .limit(10)

  console.log('\nAvailable organizations:')
  allOrgs?.forEach((o, idx) => {
    console.log(`${idx + 1}. ${o.organization_name} (${o.organization_code})`)
    console.log(`   ID: ${o.id}`)
  })
  process.exit(1)
}

console.log('✅ Found organization(s):')
org.forEach((o, idx) => {
  console.log(`${idx + 1}. ${o.organization_name} (${o.organization_code})`)
  console.log(`   ID: ${o.id}`)
})

const selectedOrg = org[0]
console.log(`\n✅ Using: ${selectedOrg.organization_name}`)
console.log(`   ID: ${selectedOrg.id}\n`)

// Step 2: Find user entity with salon@heraerp.com
console.log('Step 2: Finding user entity for salon@heraerp.com...')

// Try finding in core_entities with metadata
const { data: entities, error: entityError } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_type, metadata, created_at')
  .eq('organization_id', selectedOrg.id)
  .eq('entity_type', 'USER')
  .limit(10)

if (entityError) {
  console.error('❌ Error finding user:', entityError.message)
  process.exit(1)
}

if (!entities || entities.length === 0) {
  console.log('❌ No USER entities found in this organization')

  // Try platform organization (where users might live)
  console.log('\nTrying platform organization...')
  const { data: platformUsers } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, metadata')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .eq('entity_type', 'USER')
    .limit(10)

  if (platformUsers && platformUsers.length > 0) {
    console.log('\n✅ Found USER entities in platform organization:')
    platformUsers.forEach((user, idx) => {
      const email = user.metadata?.email || user.metadata?.user_email || 'N/A'
      console.log(`${idx + 1}. ${user.entity_name}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${email}`)

      if (email.includes('salon@heraerp.com')) {
        console.log(`\n🎯 FOUND salon@heraerp.com user!`)
        console.log(`\nAdd to .env:`)
        console.log(`TEST_USER_ID=${user.id}`)
        console.log(`TEST_ORG_ID=${selectedOrg.id}`)
        process.exit(0)
      }
    })
  }
  process.exit(1)
}

console.log(`\n✅ Found ${entities.length} USER entities in organization:`)
entities.forEach((user, idx) => {
  const email = user.metadata?.email || user.metadata?.user_email || 'N/A'
  console.log(`${idx + 1}. ${user.entity_name}`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${email}`)
  console.log(`   Created: ${user.created_at}`)
  console.log()

  if (email.includes('salon@heraerp.com') || email.includes('salon')) {
    console.log(`🎯 Likely match for salon@heraerp.com!`)
    console.log(`\nAdd to .env:`)
    console.log(`TEST_USER_ID=${user.id}`)
    console.log(`TEST_ORG_ID=${selectedOrg.id}`)
  }
})

// Step 3: Check for membership relationships
console.log('\nStep 3: Checking membership relationships...')
const { data: relationships } = await supabase
  .from('core_relationships')
  .select('from_entity_id, to_entity_id, relationship_type, is_active')
  .eq('organization_id', selectedOrg.id)
  .eq('to_entity_id', selectedOrg.id)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('is_active', true)
  .limit(10)

if (relationships && relationships.length > 0) {
  console.log(`✅ Found ${relationships.length} active membership(s)`)
  console.log('\nUse any of these user IDs:')
  relationships.forEach((rel, idx) => {
    console.log(`${idx + 1}. User ID: ${rel.from_entity_id}`)
  })
  console.log(`\nRecommended .env configuration:`)
  console.log(`TEST_USER_ID=${relationships[0].from_entity_id}`)
  console.log(`TEST_ORG_ID=${selectedOrg.id}`)
} else {
  console.log('⚠️  No active USER_MEMBER_OF_ORG relationships found')
  console.log('You may need to create a membership relationship first')
}
