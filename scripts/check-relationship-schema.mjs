#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Checking core_relationships schema')
  console.log('=====================================')
  
  try {
    // Try to select from relationships table to see available columns
    const { data, error } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error querying relationships:', error.message)
      
      // Try with old field names
      console.log('\n🔄 Trying with legacy field names...')
      const { data: legacyData, error: legacyError } = await supabase
        .from('core_relationships')
        .select('id, organization_id, from_entity_id, to_entity_id, relationship_type, metadata')
        .limit(1)
      
      if (legacyError) {
        console.log('❌ Legacy fields also failed:', legacyError.message)
      } else {
        console.log('✅ Table uses legacy field names:')
        console.log('  - from_entity_id (not source_entity_id)')
        console.log('  - to_entity_id (not target_entity_id)')  
        console.log('  - metadata (not relationship_data)')
        
        if (legacyData.length > 0) {
          console.log('\nSample record:', legacyData[0])
        }
      }
    } else {
      console.log('✅ Modern field names work')
      if (data.length > 0) {
        console.log('Sample record:', data[0])
      }
    }
    
    // Check organizations table
    console.log('\n🔍 Checking core_organizations...')
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, status')
      .limit(3)
    
    if (orgError) {
      console.log('❌ Error:', orgError.message)
    } else {
      console.log('✅ Organizations table accessible:')
      orgs.forEach(org => {
        console.log(`  - ${org.organization_name} (${org.status})`)
      })
    }
    
    // Check entities table
    console.log('\n🔍 Checking core_entities...')
    const { data: entities, error: entError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, organization_id')
      .eq('entity_type', 'USER')
      .limit(3)
    
    if (entError) {
      console.log('❌ Error:', entError.message)
    } else {
      console.log('✅ User entities found:')
      entities.forEach(ent => {
        console.log(`  - ${ent.entity_name} (${ent.id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkSchema().catch(console.error)