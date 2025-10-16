#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFunctions() {
  console.log('🧪 Testing Deployed HERA v2.2 Functions')
  console.log('=======================================')
  
  // Test 1: resolve_user_identity_v1
  console.log('\n📋 Test 1: resolve_user_identity_v1()')
  try {
    const { data, error } = await supabase.rpc('resolve_user_identity_v1')
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Function exists and returned:', data)
    }
  } catch (e) {
    console.log('❌ Function not found or error:', e.message)
  }
  
  // Test 2: Check available organizations
  console.log('\n📋 Test 2: Available organizations')
  try {
    const { data, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_type, status')
      .limit(5)
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Organizations found:')
      data.forEach(org => {
        console.log(`  - ${org.organization_name} (${org.organization_type}) - ${org.id}`)
      })
    }
  } catch (e) {
    console.log('❌ Error querying organizations:', e.message)
  }
  
  // Test 3: Create user entity manually
  console.log('\n📋 Test 3: Manual user assignment')
  const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
  const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
  
  try {
    // First, check if user entity exists
    const { data: existingUser, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', PLATFORM_ORG_ID)
      .contains('metadata', { auth_user_id: USER_ID })
      .maybeSingle()
    
    if (userError) {
      console.log('❌ Error checking user:', userError.message)
      return
    }
    
    let userEntityId = existingUser?.id
    
    if (!existingUser) {
      console.log('📝 Creating user entity...')
      
      // Create user entity
      const { data: newUser, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'USER',
          entity_name: `User ${USER_ID.substring(0, 8)}`,
          metadata: {
            auth_user_id: USER_ID
          },
          created_by: USER_ID, // Self-reference
          updated_by: USER_ID
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Error creating user:', createError.message)
        
        // Try using create_user_entity_simple function
        console.log('🔄 Trying with create_user_entity_simple function...')
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('create_user_entity_simple', {
            p_auth_user_id: USER_ID,
            p_entity_name: `User ${USER_ID.substring(0, 8)}`
          })
        
        if (rpcError) {
          console.log('❌ RPC Error:', rpcError.message)
          return
        }
        
        userEntityId = rpcResult
        console.log('✅ User entity created via RPC:', userEntityId)
      } else {
        userEntityId = newUser.id
        console.log('✅ User entity created:', userEntityId)
      }
    } else {
      console.log('✅ User entity exists:', userEntityId)
    }
    
    // Get first active organization
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('status', 'active')
      .limit(1)
      .single()
    
    if (orgError) {
      console.log('❌ Error getting organization:', orgError.message)
      return
    }
    
    console.log(`🏢 Target organization: ${orgs.organization_name} (${orgs.id})`)
    
    // Check if relationship exists
    const { data: existingRel } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('source_entity_id', userEntityId)
      .eq('target_entity_id', orgs.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle()
    
    if (existingRel) {
      console.log('✅ User already has membership relationship')
    } else {
      console.log('🔗 Creating membership relationship...')
      
      // Create relationship
      const { data: newRel, error: relError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgs.id,
          source_entity_id: userEntityId,
          target_entity_id: orgs.id,
          relationship_type: 'USER_MEMBER_OF_ORG',
          relationship_data: {
            role: 'user',
            permissions: ['read', 'write'],
            assigned_at: new Date().toISOString(),
            status: 'active'
          },
          created_by: userEntityId,
          updated_by: userEntityId
        })
        .select()
        .single()
      
      if (relError) {
        console.log('❌ Error creating relationship:', relError.message)
        return
      }
      
      console.log('✅ Membership relationship created:', newRel.id)
    }
    
    // Test resolve_user_identity_v1 again
    console.log('\n🧪 Testing resolve_user_identity_v1 again...')
    const { data: identityResult, error: identityError } = await supabase
      .rpc('resolve_user_identity_v1')
    
    if (identityError) {
      console.log('❌ Error testing identity resolution:', identityError.message)
    } else {
      console.log('✅ Identity resolution result:', identityResult)
    }
    
  } catch (e) {
    console.log('❌ Unexpected error:', e.message)
  }
}

testFunctions().catch(console.error)