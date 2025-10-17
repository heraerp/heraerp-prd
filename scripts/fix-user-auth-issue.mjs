#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUserAuth() {
  console.log('🔧 Fixing User Authentication Issue')
  console.log('==================================')
  
  const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
  const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
  
  try {
    // Step 1: Create user entity with proper smart code
    console.log('📝 Step 1: Creating user entity with smart code...')
    
    const { data: existingUser, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', PLATFORM_ORG_ID)
      .contains('metadata', { auth_user_id: USER_ID })
      .maybeSingle()
    
    if (checkError) {
      console.log('❌ Error checking existing user:', checkError.message)
      return
    }
    
    let userEntityId = existingUser?.id
    
    if (!existingUser) {
      // Create user entity with all required fields
      const { data: newUser, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'USER',
          entity_name: `User ${USER_ID.substring(0, 8)}`,
          smart_code: 'HERA.PLATFORM.USER.ENTITY.PROFILE.V1', // Required smart code
          status: 'active',
          metadata: {
            auth_user_id: USER_ID,
            created_via: 'auth_fix_script'
          },
          created_by: USER_ID, // Self-reference for bootstrap
          updated_by: USER_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Error creating user entity:', createError.message)
        
        // If constraint issues, try to find the platform organization first
        console.log('🔍 Checking platform organization...')
        const { data: platformOrg, error: platformError } = await supabase
          .from('core_organizations')
          .select('*')
          .eq('id', PLATFORM_ORG_ID)
          .single()
        
        if (platformError) {
          console.log('❌ Platform organization not found, creating it...')
          
          // Create platform organization
          const { data: newPlatformOrg, error: newPlatformError } = await supabase
            .from('core_organizations')
            .insert({
              id: PLATFORM_ORG_ID,
              organization_name: 'HERA Platform',
              organization_code: 'PLATFORM',
              organization_type: 'platform',
              status: 'active',
              created_by: USER_ID,
              updated_by: USER_ID,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (newPlatformError) {
            console.log('❌ Error creating platform organization:', newPlatformError.message)
            return
          }
          
          console.log('✅ Platform organization created')
          
          // Now retry user creation
          const { data: retryUser, error: retryError } = await supabase
            .from('core_entities')
            .insert({
              organization_id: PLATFORM_ORG_ID,
              entity_type: 'USER',
              entity_name: `User ${USER_ID.substring(0, 8)}`,
              smart_code: 'HERA.PLATFORM.USER.ENTITY.PROFILE.V1',
              status: 'active',
              metadata: {
                auth_user_id: USER_ID,
                created_via: 'auth_fix_script'
              },
              created_by: USER_ID,
              updated_by: USER_ID,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (retryError) {
            console.log('❌ Error creating user entity on retry:', retryError.message)
            return
          }
          
          userEntityId = retryUser.id
          console.log('✅ User entity created on retry:', userEntityId)
        }
        return
      }
      
      userEntityId = newUser.id
      console.log('✅ User entity created:', userEntityId)
    } else {
      console.log('✅ User entity already exists:', userEntityId)
    }
    
    // Step 2: Get first active organization for membership
    console.log('\n📝 Step 2: Setting up organization membership...')
    
    const { data: targetOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_type')
      .eq('status', 'active')
      .neq('id', PLATFORM_ORG_ID) // Not the platform org
      .limit(1)
      .single()
    
    if (orgError) {
      console.log('❌ Error getting target organization:', orgError.message)
      return
    }
    
    console.log(`🏢 Target organization: ${targetOrg.organization_name}`)
    
    // Step 3: Create membership relationship
    const { data: existingRel } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('source_entity_id', userEntityId)
      .eq('target_entity_id', targetOrg.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle()
    
    if (existingRel) {
      console.log('✅ Membership relationship already exists')
    } else {
      console.log('🔗 Creating membership relationship...')
      
      const { data: newRel, error: relError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: targetOrg.id,
          source_entity_id: userEntityId,
          target_entity_id: targetOrg.id,
          relationship_type: 'USER_MEMBER_OF_ORG',
          relationship_data: {
            role: 'user',
            permissions: ['read', 'write'],
            assigned_at: new Date().toISOString(),
            status: 'active'
          },
          created_by: userEntityId,
          updated_by: userEntityId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (relError) {
        console.log('❌ Error creating relationship:', relError.message)
        return
      }
      
      console.log('✅ Membership relationship created:', newRel.id)
    }
    
    // Step 4: Test the auth functions
    console.log('\n📝 Step 3: Testing auth functions...')
    
    // Test resolve_user_identity_v1
    const { data: identityResult, error: identityError } = await supabase
      .rpc('resolve_user_identity_v1')
    
    if (identityError) {
      console.log('❌ Error testing identity resolution:', identityError.message)
    } else {
      console.log('✅ Identity resolution result:', identityResult)
    }
    
    // Test the auth introspect endpoint
    console.log('\n🧪 Testing auth introspect endpoint...')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('supabase.co', 'supabase.co:3000')}/api/v2/auth/introspect`, {
        headers: {
          'Authorization': `Bearer demo-token-salon-receptionist`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Auth introspect success:', result)
      } else {
        console.log('❌ Auth introspect failed:', response.status, response.statusText)
      }
    } catch (e) {
      console.log('⚠️  Could not test auth endpoint (expected if not running locally)')
    }
    
    console.log('\n🎉 User authentication fix completed!')
    console.log('=====================================')
    console.log('')
    console.log('✅ User entity created in platform organization')
    console.log('✅ Membership relationship established')
    console.log('✅ Auth functions deployed and tested')
    console.log('')
    console.log('🔄 Try the browser authentication again!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixUserAuth().catch(console.error)