/**
 * Setup user membership for new user ID: 2300a665-6650-4f4c-8e85-c1a7e8f2973d
 * Assign to org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8 (Hair Talkz Salon)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

async function setupNewUserMembership() {
  console.log('🔧 Setting up user membership...')
  console.log('User ID: 2300a665-6650-4f4c-8e85-c1a7e8f2973d')
  console.log('Org ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8')
  
  try {
    // Call the setup_user_membership function
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_supabase_user_id: '2300a665-6650-4f4c-8e85-c1a7e8f2973d',
      p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
    })
    
    if (error) {
      console.error('❌ Failed to setup user membership:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return false
    }
    
    console.log('✅ User membership setup successful!')
    console.log('Response:', data)
    
    // Verify the setup by checking relationships
    console.log('\n🔍 Verifying membership setup...')
    
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', '2300a665-6650-4f4c-8e85-c1a7e8f2973d')
      .eq('relationship_type', 'MEMBER_OF')
    
    if (relError) {
      console.error('❌ Error verifying relationships:', relError)
    } else {
      console.log(`✅ Found ${relationships?.length || 0} MEMBER_OF relationships`)
      relationships?.forEach((rel, i) => {
        console.log(`  ${i + 1}. Organization: ${rel.organization_id}`)
        console.log(`     Target Entity: ${rel.to_entity_id}`)
        console.log(`     Active: ${rel.is_active}`)
        console.log(`     Created: ${rel.created_at}`)
      })
    }
    
    // Check user entity in tenant org
    console.log('\n🔍 Checking user entity in tenant organization...')
    
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', '2300a665-6650-4f4c-8e85-c1a7e8f2973d')
      .eq('organization_id', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    if (userError) {
      console.error('❌ Error checking user entity:', userError)
    } else if (userEntity) {
      console.log('✅ User entity found in tenant organization:')
      console.log('  Entity Name:', userEntity.entity_name)
      console.log('  Entity Type:', userEntity.entity_type)
      console.log('  Smart Code:', userEntity.smart_code)
      console.log('  Created:', userEntity.created_at)
    } else {
      console.log('⚠️ User entity not found in tenant organization')
    }
    
    // Test authentication by calling resolve-membership
    console.log('\n🧪 Testing authentication API...')
    
    // First get a session for this user (if possible)
    try {
      const { data: users } = await supabase.auth.admin.listUsers()
      const targetUser = users.users.find(u => u.id === '2300a665-6650-4f4c-8e85-c1a7e8f2973d')
      
      if (targetUser) {
        console.log('✅ Found user in auth system:')
        console.log('  Email:', targetUser.email)
        console.log('  Created:', targetUser.created_at)
        console.log('  Last Sign In:', targetUser.last_sign_in_at || 'Never')
        
        // Note: We can't easily test the API without a valid session
        console.log('\n📝 To test authentication:')
        console.log('1. Have the user log in at: http://localhost:3001/salon/auth')
        console.log('2. They should be able to access: http://localhost:3001/salon/dashboard')
        console.log('3. The auth state test widget should show their details')
      } else {
        console.log('⚠️ User not found in auth system - they may need to sign up first')
      }
    } catch (authError) {
      console.warn('Could not check auth system:', authError.message)
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    return false
  }
}

// Run the setup
setupNewUserMembership()
  .then(success => {
    console.log(`\n🎯 User membership setup ${success ? 'COMPLETED' : 'FAILED'}!`)
    
    if (success) {
      console.log('\n🎉 Next Steps:')
      console.log('1. User can now log in at: http://localhost:3001/salon/auth')
      console.log('2. They will have access to Hair Talkz Salon dashboard')
      console.log('3. Default role will be assigned based on email pattern')
      console.log('4. Organization context will be automatically resolved')
    }
    
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })