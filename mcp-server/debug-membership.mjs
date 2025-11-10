#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const userId = '4d93b3f8-dfe8-430c-83ea-3128f6a520cf'
const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'

console.log('🔍 Debugging membership check...\n')
console.log(`User ID: ${userId}`)
console.log(`Org ID: ${orgId}\n`)

// Check exact query the RPC is using
const { data, error } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('organization_id', orgId)
  .eq('from_entity_id', userId)
  .eq('to_entity_id', orgId)
  .in('relationship_type', ['USER_MEMBER_OF_ORG', 'MEMBER_OF'])
  .eq('is_active', true)

if (error) {
  console.error('❌ Query error:', error)
  process.exit(1)
}

console.log('Query results:', data?.length || 0, 'rows\n')

if (data && data.length > 0) {
  console.log('✅ FOUND membership(s):')
  data.forEach((rel, idx) => {
    console.log(`\n${idx + 1}. Relationship:`)
    console.log(`   Type: ${rel.relationship_type}`)
    console.log(`   From: ${rel.from_entity_id}`)
    console.log(`   To: ${rel.to_entity_id}`)
    console.log(`   Active: ${rel.is_active}`)
    console.log(`   Org: ${rel.organization_id}`)
    console.log(`   Expiration: ${rel.expiration_date || 'None'}`)
  })
} else {
  console.log('❌ NO membership found')
  console.log('\nLet me check what relationships DO exist...\n')

  // Check what relationships exist for this user
  const { data: userRels } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', userId)
    .limit(10)

  if (userRels && userRels.length > 0) {
    console.log(`Found ${userRels.length} relationships FROM this user:`)
    userRels.forEach((rel, idx) => {
      console.log(`\n${idx + 1}. ${rel.relationship_type}`)
      console.log(`   To: ${rel.to_entity_id}`)
      console.log(`   Org: ${rel.organization_id}`)
      console.log(`   Active: ${rel.is_active}`)
    })
  }

  // Check if the target is different
  const { data: orgRels } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('organization_id', orgId)
    .eq('from_entity_id', userId)
    .limit(10)

  if (orgRels && orgRels.length > 0) {
    console.log(`\n\nFound ${orgRels.length} relationships from this user in this org:`)
    orgRels.forEach((rel, idx) => {
      console.log(`\n${idx + 1}. ${rel.relationship_type}`)
      console.log(`   From: ${rel.from_entity_id}`)
      console.log(`   To: ${rel.to_entity_id}`)
      console.log(`   Active: ${rel.is_active}`)
      console.log(`   Expiration: ${rel.expiration_date || 'None'}`)
    })
  }
}
