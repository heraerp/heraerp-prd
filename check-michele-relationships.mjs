#!/usr/bin/env node

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MICHELE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

async function checkMicheleRelationships() {
  console.log('🔍 Checking relationships for Michele...')
  console.log('User ID:', MICHELE_USER_ID)
  console.log('='.repeat(60))

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Check all relationships for this user
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', MICHELE_USER_ID)

  if (relError) {
    console.error('❌ Error fetching relationships:', relError)
    return
  }

  console.log(`📊 Found ${relationships?.length || 0} relationships:`)
  
  if (relationships && relationships.length > 0) {
    relationships.forEach((rel, i) => {
      console.log(`${i + 1}. Type: ${rel.relationship_type}`)
      console.log(`   From: ${rel.from_entity_id}`)
      console.log(`   To: ${rel.to_entity_id}`)
      console.log(`   Org: ${rel.organization_id}`)
      console.log(`   Active: ${rel.is_active}`)
      console.log(`   Data: ${JSON.stringify(rel.relationship_data)}`)
      console.log(`   Created: ${rel.created_at}`)
      console.log('')
    })
  } else {
    console.log('❌ No relationships found!')
    
    // Check if user entity exists
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', MICHELE_USER_ID)
      .maybeSingle()
    
    if (userError) {
      console.error('❌ Error checking user entity:', userError)
    } else if (userEntity) {
      console.log('✅ User entity exists:', {
        id: userEntity.id,
        entity_type: userEntity.entity_type,
        entity_name: userEntity.entity_name,
        organization_id: userEntity.organization_id
      })
    } else {
      console.log('❌ User entity does not exist!')
    }
  }

  // Also check what the user-entity-resolver would find
  console.log('\n🔍 Testing user-entity-resolver query...')
  const { data: resolverResult, error: resolverError } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id')
    .eq('from_entity_id', MICHELE_USER_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .maybeSingle()

  if (resolverError) {
    console.error('❌ Resolver query error:', resolverError)
  } else if (resolverResult) {
    console.log('✅ Resolver would find:', resolverResult)
  } else {
    console.log('❌ Resolver would find nothing')
  }
}

checkMicheleRelationships().catch(console.error)