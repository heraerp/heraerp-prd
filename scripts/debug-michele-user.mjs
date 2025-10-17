#!/usr/bin/env node

/**
 * Debug the actual database state for michele user
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

async function debugUserState() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log('🔍 Debugging user state for:', USER_ID)
    console.log('='.repeat(60))
    
    // Check if user entity exists
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
    
    console.log('\n1️⃣ User Entity Check:')
    if (userError) {
      console.log('❌ Error:', userError)
    } else {
      console.log(`📊 Found ${userEntity?.length || 0} user entities`)
      userEntity?.forEach(u => {
        console.log(`  - ID: ${u.id}`)
        console.log(`  - Type: ${u.entity_type}`)
        console.log(`  - Org: ${u.organization_id}`)
        console.log(`  - Name: ${u.entity_name}`)
      })
    }
    
    // Check relationships
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
    
    console.log('\n2️⃣ User Relationships:')
    if (relError) {
      console.log('❌ Error:', relError)
    } else {
      console.log(`📊 Found ${relationships?.length || 0} relationships`)
      relationships?.forEach(r => {
        console.log(`  - Type: ${r.relationship_type}`)
        console.log(`  - From: ${r.from_entity_id}`)
        console.log(`  - To: ${r.to_entity_id}`)
        console.log(`  - Org: ${r.organization_id}`)
        console.log(`  - Active: ${r.is_active}`)
        console.log('  ---')
      })
    }
    
    // Test the exact query from resolveUserEntity
    const { data: testQuery, error: testError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    console.log('\n3️⃣ Exact Query Test (from resolveUserEntity):')
    if (testError) {
      console.log('❌ Error:', testError)
    } else if (!testQuery) {
      console.log('❌ No MEMBER_OF relationship found')
    } else {
      console.log('✅ MEMBER_OF relationship found:')
      console.log('  - Organization:', testQuery.organization_id)
      console.log('  - Target Entity:', testQuery.to_entity_id)
    }
    
    // Check if relationship exists but organization filter is wrong
    const { data: allOrgRels, error: allOrgError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
    
    console.log('\n4️⃣ All MEMBER_OF relationships (any org):')
    if (allOrgError) {
      console.log('❌ Error:', allOrgError)
    } else {
      console.log(`📊 Found ${allOrgRels?.length || 0} MEMBER_OF relationships`)
      allOrgRels?.forEach(r => {
        console.log(`  - From: ${r.from_entity_id}`)
        console.log(`  - To: ${r.to_entity_id}`)
        console.log(`  - Org: ${r.organization_id}`)
        console.log(`  - Active: ${r.is_active}`)
        console.log(`  - Data: ${JSON.stringify(r.relationship_data)}`)
      })
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugUserState()