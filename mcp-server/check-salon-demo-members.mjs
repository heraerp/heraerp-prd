#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const salonDemoOrgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'

console.log('🔍 Checking HERA Salon Demo members...\n')

// Find all active memberships
const { data: memberships, error } = await supabase
  .from('core_relationships')
  .select('from_entity_id, relationship_type, is_active')
  .eq('organization_id', salonDemoOrgId)
  .eq('to_entity_id', salonDemoOrgId)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('is_active', true)

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

if (!memberships || memberships.length === 0) {
  console.log('❌ No active members found in HERA Salon Demo organization')
  console.log('\nLet me check if there are any relationships at all...\n')

  const { data: allRels } = await supabase
    .from('core_relationships')
    .select('from_entity_id, to_entity_id, relationship_type, is_active')
    .eq('organization_id', salonDemoOrgId)
    .limit(10)

  if (allRels && allRels.length > 0) {
    console.log(`Found ${allRels.length} relationships in this org:`)
    allRels.forEach((rel, idx) => {
      console.log(`${idx + 1}. ${rel.relationship_type}`)
      console.log(`   From: ${rel.from_entity_id}`)
      console.log(`   To: ${rel.to_entity_id}`)
      console.log(`   Active: ${rel.is_active}`)
    })
  } else {
    console.log('No relationships found at all')
  }
  process.exit(1)
}

console.log(`✅ Found ${memberships.length} active member(s):\n`)

// Get user details for each member
for (const membership of memberships) {
  const { data: user } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, metadata')
    .eq('id', membership.from_entity_id)
    .single()

  if (user) {
    const email = user.metadata?.email || user.metadata?.user_email || 'N/A'
    console.log(`User: ${user.entity_name}`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Email: ${email}`)
    console.log()

    if (email.includes('salon@heraerp.com')) {
      console.log(`🎯 FOUND salon@heraerp.com user!\n`)
      console.log(`Add to .env:`)
      console.log(`TEST_USER_ID=${user.id}`)
      console.log(`TEST_ORG_ID=${salonDemoOrgId}`)
      process.exit(0)
    }
  }
}

console.log('\n📝 Recommendation: Use the first user for testing')
console.log(`TEST_USER_ID=${memberships[0].from_entity_id}`)
console.log(`TEST_ORG_ID=${salonDemoOrgId}`)
