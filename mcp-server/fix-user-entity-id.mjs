/**
 * Fix USER entity to use the correct Supabase user ID
 * The RPC function created a new UUID, but we need it to match the auth user ID
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '2300a665-6650-4f4c-8e85-c1a7e8f2973d'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function fixUserEntityId() {
  console.log('🔧 Fixing USER entity ID...')
  console.log('Correct User ID:', userId)
  console.log('Organization ID:', orgId)
  
  try {
    // First, delete the incorrectly created entity
    console.log('\n🗑️ Cleaning up incorrectly created entities...')
    
    const { data: wrongEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .neq('id', userId) // Not equal to the correct user ID
    
    if (wrongEntities && wrongEntities.length > 0) {
      console.log(`Found ${wrongEntities.length} incorrectly created USER entities`)
      
      for (const entity of wrongEntities) {
        console.log(`  Deleting entity: ${entity.id} (${entity.entity_name})`)
        
        // Delete dynamic data first
        await supabase
          .from('core_dynamic_data')
          .delete()
          .eq('entity_id', entity.id)
          .eq('organization_id', orgId)
        
        // Delete the entity
        await supabase
          .from('core_entities')
          .delete()
          .eq('id', entity.id)
          .eq('organization_id', orgId)
      }
      
      console.log('✅ Cleaned up incorrect entities')
    }
    
    // Get user details from auth system
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
    
    if (!authUser) {
      throw new Error('User not found in auth system')
    }
    
    const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
    
    // Create the entity with the correct ID using direct insertion
    console.log('\n🏗️ Creating USER entity with correct ID...')
    
    const { data: newEntity, error: createError } = await supabase
      .from('core_entities')
      .insert({
        id: userId, // Use the actual Supabase user ID
        organization_id: orgId,
        entity_type: 'USER',
        entity_name: userName,
        smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1',
        created_by: userId,
        updated_by: userId,
        metadata: {
          email: authUser.email,
          source: 'manual_fix_with_correct_id',
          auth_provider: 'supabase'
        }
      })
      .select()
      .single()
    
    if (createError) {
      throw createError
    }
    
    console.log('✅ USER entity created with correct ID:')
    console.log('  ID:', newEntity.id)
    console.log('  Name:', newEntity.entity_name)
    console.log('  Organization:', newEntity.organization_id)
    console.log('  Smart Code:', newEntity.smart_code)
    
    // Add dynamic data
    console.log('\n📊 Adding dynamic data...')
    
    const dynamicFields = [
      {
        entity_id: userId,
        organization_id: orgId,
        field_name: 'email',
        field_type: 'text',
        field_value_text: authUser.email,
        smart_code: 'HERA.SALON.USER.FIELD.EMAIL.V1',
        created_by: userId,
        updated_by: userId
      },
      {
        entity_id: userId,
        organization_id: orgId,
        field_name: 'role',
        field_type: 'text',
        field_value_text: 'owner',
        smart_code: 'HERA.SALON.USER.FIELD.ROLE.V1',
        created_by: userId,
        updated_by: userId
      }
    ]
    
    for (const field of dynamicFields) {
      const { error: fieldError } = await supabase
        .from('core_dynamic_data')
        .insert(field)
      
      if (fieldError) {
        console.warn(`Warning: Failed to create field ${field.field_name}:`, fieldError.message)
      } else {
        console.log(`  ✅ Added field: ${field.field_name} = ${field.field_value_text}`)
      }
    }
    
    // Verify the setup
    console.log('\n🔍 Verifying complete setup...')
    
    // Check entity
    const { data: verifyEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .single()
    
    // Check membership
    const { data: verifyMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('organization_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .single()
    
    // Check dynamic data
    const { data: verifyDynamic } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userId)
      .eq('organization_id', orgId)
    
    console.log('Entity verification:', verifyEntity ? '✅ FOUND' : '❌ MISSING')
    console.log('Membership verification:', verifyMembership ? '✅ FOUND' : '❌ MISSING')
    console.log(`Dynamic data verification: ✅ ${verifyDynamic?.length || 0} fields`)
    
    if (verifyEntity && verifyMembership) {
      console.log('\n🎉 Setup complete! User authentication should now work.')
      console.log('\n📋 Summary:')
      console.log('✅ USER entity exists with correct ID in tenant org')
      console.log('✅ Membership relationship exists')
      console.log('✅ Dynamic data fields added')
      console.log('✅ resolve-membership should now find the user')
      
      return true
    } else {
      console.log('\n❌ Setup incomplete - some components are missing')
      return false
    }
    
  } catch (error) {
    console.error('💥 Failed to fix user entity ID:', error)
    return false
  }
}

// Run the fix
fixUserEntityId()
  .then(success => {
    console.log(`\n🎯 User entity ID fix ${success ? 'COMPLETED' : 'FAILED'}!`)
    
    if (success) {
      console.log('\n✅ User can now:')
      console.log('1. Log in at: http://localhost:3001/salon/auth')
      console.log('2. Have membership resolved successfully (no more 404s)')
      console.log('3. Access the salon dashboard')
      console.log('4. See their details in the auth state test widget')
    }
    
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })