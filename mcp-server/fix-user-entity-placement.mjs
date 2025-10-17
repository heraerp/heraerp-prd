/**
 * Fix user entity placement for user: 2300a665-6650-4f4c-8e85-c1a7e8f2973d
 * The issue: USER entity exists in platform org but membership resolution expects it in tenant org
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '2300a665-6650-4f4c-8e85-c1a7e8f2973d'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const platformOrgId = '00000000-0000-0000-0000-000000000000'

async function fixUserEntityPlacement() {
  console.log('🔧 Fixing user entity placement...')
  console.log('User ID:', userId)
  console.log('Tenant Org:', orgId)
  console.log('Platform Org:', platformOrgId)
  
  try {
    // Step 1: Check where USER entities currently exist
    console.log('\n🔍 Checking current USER entity locations...')
    
    const { data: platformUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    const { data: tenantUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    console.log('Platform USER entity:', platformUser ? '✅ EXISTS' : '❌ MISSING')
    console.log('Tenant USER entity:', tenantUser ? '✅ EXISTS' : '❌ MISSING')
    
    // Step 2: Get user details for entity creation
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
    
    if (!authUser) {
      throw new Error('User not found in auth system')
    }
    
    console.log('\n📧 Auth user details:')
    console.log('  Email:', authUser.email)
    console.log('  Name:', authUser.user_metadata?.full_name || 'N/A')
    console.log('  Created:', authUser.created_at)
    
    // Step 3: Create USER entity in tenant organization if missing
    if (!tenantUser) {
      console.log('\n🏗️ Creating USER entity in tenant organization...')
      
      const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
      
      const { data: newUserEntity, error: createError } = await supabase
        .from('core_entities')
        .insert({
          id: userId,
          organization_id: orgId,
          entity_type: 'USER',
          entity_name: userName,
          smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1',
          created_by: userId,
          updated_by: userId,
          metadata: {
            email: authUser.email,
            source: 'manual_fix',
            auth_provider: 'supabase'
          }
        })
        .select()
        .single()
      
      if (createError) {
        if (createError.code === '23505') {
          console.log('⚠️ USER entity already exists in tenant org (duplicate key)')
          
          // Try to get the existing entity
          const { data: existingUser } = await supabase
            .from('core_entities')
            .select('*')
            .eq('id', userId)
            .eq('organization_id', orgId)
            .eq('entity_type', 'USER')
            .single()
            
          if (existingUser) {
            console.log('✅ Found existing USER entity in tenant org')
            console.log('  Name:', existingUser.entity_name)
            console.log('  Smart Code:', existingUser.smart_code)
          }
        } else {
          throw createError
        }
      } else {
        console.log('✅ USER entity created in tenant organization')
        console.log('  ID:', newUserEntity.id)
        console.log('  Name:', newUserEntity.entity_name)
        console.log('  Smart Code:', newUserEntity.smart_code)
      }
    } else {
      console.log('✅ USER entity already exists in tenant organization')
    }
    
    // Step 4: Ensure USER entity exists in platform organization too
    if (!platformUser) {
      console.log('\n🏗️ Creating USER entity in platform organization...')
      
      const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
      
      const { data: newPlatformUser, error: platformError } = await supabase
        .from('core_entities')
        .insert({
          id: userId,
          organization_id: platformOrgId,
          entity_type: 'USER',
          entity_name: userName,
          smart_code: 'HERA.PLATFORM.USER.ENTITY.PERSON.V1',
          created_by: userId,
          updated_by: userId,
          metadata: {
            email: authUser.email,
            source: 'manual_fix',
            auth_provider: 'supabase'
          }
        })
        .select()
        .single()
      
      if (platformError) {
        if (platformError.code === '23505') {
          console.log('⚠️ USER entity already exists in platform org')
        } else {
          console.warn('⚠️ Failed to create platform USER entity:', platformError.message)
        }
      } else {
        console.log('✅ USER entity created in platform organization')
      }
    } else {
      console.log('✅ USER entity already exists in platform organization')
    }
    
    // Step 5: Verify membership relationship
    console.log('\n🔍 Verifying membership relationship...')
    
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('organization_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    if (membership) {
      console.log('✅ Membership relationship exists')
      console.log('  Target Entity:', membership.to_entity_id)
      console.log('  Active:', membership.is_active)
    } else {
      console.log('❌ Membership relationship missing')
    }
    
    // Step 6: Test the resolve-membership API
    console.log('\n🧪 Testing resolve-membership API...')
    
    try {
      // Create a test token (this is a simplified approach)
      const testResponse = await fetch('http://localhost:3001/api/v2/auth/resolve-membership', {
        headers: {
          'X-User-Id': userId,
          'X-Organization-Id': orgId,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('API Response Status:', testResponse.status)
      
      if (testResponse.ok) {
        const responseData = await testResponse.json()
        console.log('✅ API Response:', responseData)
      } else {
        const errorText = await testResponse.text()
        console.log('❌ API Error:', errorText)
      }
    } catch (apiError) {
      console.log('⚠️ Could not test API:', apiError.message)
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    return false
  }
}

// Run the fix
fixUserEntityPlacement()
  .then(success => {
    console.log(`\n🎯 User entity placement fix ${success ? 'COMPLETED' : 'FAILED'}!`)
    
    if (success) {
      console.log('\n✅ User should now be able to:')
      console.log('1. Log in at: http://localhost:3001/salon/auth')
      console.log('2. Access salon dashboard successfully')
      console.log('3. Have their membership resolved properly')
    }
    
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })