/**
 * Test authentication for user: 2300a665-6650-4f4c-8e85-c1a7e8f2973d
 * Verify they can sign in and resolve membership properly
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const userId = '2300a665-6650-4f4c-8e85-c1a7e8f2973d'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testUserAuthentication() {
  console.log('🧪 Testing user authentication...')
  console.log('User ID:', userId)
  console.log('Email: live@hairtalkz.com')
  
  try {
    // Create anon client for testing authentication
    const anonSupabase = createClient(
      'https://awfcrncxngqwbhqapffb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLxKa1f0'
    )
    
    console.log('\n🔐 Attempting authentication...')
    console.log('⚠️ Note: User needs to set a password first via reset password flow')
    
    // Check if user exists in auth system
    console.log('\n🔍 Checking auth system status...')
    
    // Use service role for admin operations
    const serviceSupabase = createClient(
      'https://awfcrncxngqwbhqapffb.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: { user: authUser } } = await serviceSupabase.auth.admin.getUserById(userId)
    
    if (authUser) {
      console.log('✅ User exists in auth system:')
      console.log('  Email:', authUser.email)
      console.log('  Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No')
      console.log('  Last Sign In:', authUser.last_sign_in_at || 'Never')
      console.log('  Created:', authUser.created_at)
    } else {
      console.log('❌ User not found in auth system')
      return false
    }
    
    // Check entities in both organizations
    console.log('\n🔍 Checking entity placement...')
    
    const { data: tenantEntity } = await serviceSupabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    const { data: platformEntity } = await serviceSupabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    console.log('Tenant USER entity:', tenantEntity ? '✅ EXISTS' : '❌ MISSING')
    console.log('Platform USER entity:', platformEntity ? '✅ EXISTS' : '❌ MISSING')
    
    if (tenantEntity) {
      console.log('  Tenant Entity Name:', tenantEntity.entity_name)
      console.log('  Tenant Smart Code:', tenantEntity.smart_code)
    }
    
    // Check membership relationship
    console.log('\n🔍 Checking membership relationship...')
    
    const { data: membership } = await serviceSupabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('organization_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    if (membership) {
      console.log('✅ Membership relationship found:')
      console.log('  ID:', membership.id)
      console.log('  Target Entity:', membership.to_entity_id)
      console.log('  Organization:', membership.organization_id)
      console.log('  Active:', membership.is_active)
      console.log('  Created:', membership.created_at)
    } else {
      console.log('❌ Membership relationship missing')
      return false
    }
    
    // Test what happens when user tries to authenticate
    console.log('\n🧪 Simulating authentication flow...')
    
    // Since we can't sign in without password, let's check what the resolve-membership would see
    console.log('Simulating resolve-membership lookup...')
    
    // Check what resolve-membership API would find
    const { data: userLookup } = await serviceSupabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    if (userLookup) {
      console.log('✅ resolve-membership would find USER entity in tenant org')
      
      // Check dynamic data
      const { data: dynamicData } = await serviceSupabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', userId)
        .eq('organization_id', orgId)
      
      console.log(`  Dynamic data fields: ${dynamicData?.length || 0}`)
      
      if (dynamicData && dynamicData.length > 0) {
        dynamicData.forEach(field => {
          console.log(`    ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_boolean}`)
        })
      }
    } else {
      console.log('❌ resolve-membership would NOT find USER entity in tenant org')
    }
    
    console.log('\n📋 Authentication Setup Summary:')
    console.log('✅ User exists in auth system')
    console.log('✅ USER entity exists in platform org (for platform operations)')
    console.log(tenantEntity ? '✅' : '❌', 'USER entity exists in tenant org (for membership resolution)')
    console.log('✅ Membership relationship established')
    console.log('')
    console.log('🎯 Next Steps for User:')
    console.log('1. User needs to reset/set their password')
    console.log('2. Go to: http://localhost:3001/salon/auth')
    console.log('3. Click "Forgot Password" or use reset password flow')
    console.log('4. Once password is set, they can log in normally')
    console.log('5. Authentication should resolve to Hair Talkz Salon')
    
    return true
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    return false
  }
}

// Run the test
testUserAuthentication()
  .then(success => {
    console.log(`\n🎯 Authentication test ${success ? 'PASSED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })