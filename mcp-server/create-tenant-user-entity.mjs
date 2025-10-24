/**
 * Create USER entity in tenant organization using RPC function
 * This ensures proper entity creation with all required fields
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '2300a665-6650-4f4c-8e85-c1a7e8f2973d'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function createTenantUserEntity() {
  console.log('🏗️ Creating USER entity in tenant organization...')
  console.log('User ID:', userId)
  console.log('Organization ID:', orgId)
  
  try {
    // Get user details from auth system
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
    
    if (!authUser) {
      throw new Error('User not found in auth system')
    }
    
    console.log('📧 User details:')
    console.log('  Email:', authUser.email)
    console.log('  Name:', authUser.user_metadata?.full_name || 'N/A')
    
    // Use RPC function to create entity properly
    const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
    
    console.log('\n🔧 Using hera_entities_crud_v2 RPC function...')
    
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: userId,
      p_organization_id: orgId,
      p_entity: {
        entity_type: 'USER',
        entity_name: userName,
        smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1'
      },
      p_dynamic: {
        email: {
          field_type: 'text',
          field_value_text: authUser.email,
          smart_code: 'HERA.SALON.USER.FIELD.EMAIL.V1'
        },
        role: {
          field_type: 'text', 
          field_value_text: 'owner',
          smart_code: 'HERA.SALON.USER.FIELD.ROLE.V1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (error) {
      console.error('❌ RPC function failed:', error)
      
      // Try direct entity creation as fallback
      console.log('\n🔄 Trying direct entity creation as fallback...')
      
      const { data: directEntity, error: directError } = await supabase
        .from('core_entities')
        .upsert({
          id: userId,
          organization_id: orgId,
          entity_type: 'USER',
          entity_name: userName,
          smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1',
          created_by: userId,
          updated_by: userId,
          metadata: {
            email: authUser.email,
            source: 'direct_creation',
            auth_provider: 'supabase'
          }
        }, {
          onConflict: 'id,organization_id',
          ignoreDuplicates: false
        })
        .select()
        .single()
      
      if (directError) {
        throw directError
      }
      
      console.log('✅ Entity created via direct insertion')
      console.log('Entity ID:', directEntity.id)
      console.log('Entity Name:', directEntity.entity_name)
      
    } else {
      console.log('✅ Entity created via RPC function')
      console.log('Response:', data)
    }
    
    // Verify entity was created
    console.log('\n🔍 Verifying entity creation...')
    
    const { data: createdEntity, error: verifyError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .single()
    
    if (verifyError) {
      throw verifyError
    }
    
    console.log('✅ USER entity verified in tenant organization:')
    console.log('  ID:', createdEntity.id)
    console.log('  Name:', createdEntity.entity_name)
    console.log('  Type:', createdEntity.entity_type)
    console.log('  Smart Code:', createdEntity.smart_code)
    console.log('  Organization:', createdEntity.organization_id)
    console.log('  Created:', createdEntity.created_at)
    
    // Check dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userId)
      .eq('organization_id', orgId)
    
    console.log(`\n📊 Dynamic data fields: ${dynamicData?.length || 0}`)
    dynamicData?.forEach(field => {
      console.log(`  ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_boolean}`)
    })
    
    // Test resolve-membership simulation
    console.log('\n🧪 Testing resolve-membership simulation...')
    
    const { data: membershipTest } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    if (membershipTest) {
      console.log('✅ Membership relationship found')
      
      const { data: userEntityTest } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', userId)
        .eq('organization_id', membershipTest.organization_id)
        .eq('entity_type', 'USER')
        .maybeSingle()
      
      if (userEntityTest) {
        console.log('✅ resolve-membership would now find USER entity')
        console.log('  This should fix the 404 authentication error')
      } else {
        console.log('❌ resolve-membership still would not find USER entity')
      }
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Failed to create tenant user entity:', error)
    return false
  }
}

// Run the creation
createTenantUserEntity()
  .then(success => {
    console.log(`\n🎯 Tenant user entity creation ${success ? 'COMPLETED' : 'FAILED'}!`)
    
    if (success) {
      console.log('\n✅ User should now be able to:')
      console.log('1. Log in at: http://localhost:3001/salon/auth')
      console.log('2. Have their membership resolved successfully')
      console.log('3. Access the salon dashboard without 404 errors')
      console.log('4. See their auth state in the test widget')
    }
    
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })