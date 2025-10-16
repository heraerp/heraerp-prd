#!/usr/bin/env node

/**
 * Test what the resolve_user_roles_in_org RPC function actually returns
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testRpcRoles() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log('🔍 Testing resolve_user_roles_in_org RPC function')
    console.log('Organization ID:', ORG_ID)
    console.log('='.repeat(50))
    
    const { data: roleData, error: roleError } = await supabase
      .rpc('resolve_user_roles_in_org', { p_org: ORG_ID })
    
    console.log('\n📊 RPC Function Result:')
    if (roleError) {
      console.log('❌ Error:', roleError)
    } else {
      console.log('✅ Success')
      console.log('Data type:', typeof roleData)
      console.log('Is array:', Array.isArray(roleData))
      console.log('Length:', roleData?.length || 0)
      console.log('Raw data:', JSON.stringify(roleData, null, 2))
      
      if (Array.isArray(roleData)) {
        roleData.forEach((item, index) => {
          console.log(`\nItem ${index}:`)
          console.log('  - Type:', typeof item)
          console.log('  - Value:', JSON.stringify(item))
          if (typeof item === 'object' && item) {
            console.log('  - Keys:', Object.keys(item))
            if (item.role_name) {
              console.log('  - Role Name:', item.role_name)
            }
          }
        })
      }
    }
    
    // Also test what should be returned based on our relationship data
    console.log('\n📋 Expected Data from Relationship:')
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', '09b0b92a-d797-489e-bc03-5ca0a6272674')
      .eq('to_entity_id', ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    if (relError || !relationship) {
      console.log('❌ Could not get relationship data')
    } else {
      console.log('✅ Relationship data:', JSON.stringify(relationship.relationship_data, null, 2))
      const role = relationship.relationship_data?.role
      if (role) {
        console.log('Expected role result:', [{ role_name: role }])
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testRpcRoles()