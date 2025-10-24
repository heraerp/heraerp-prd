/**
 * Test RLS permissions for the production user using anon key
 * This simulates what the frontend actually experiences
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

async function testRLSPermissions() {
  console.log('🔐 Testing RLS permissions with anon key...')
  
  try {
    // Create client with anon key (like frontend)
    const anonSupabase = createClient(
      'https://awfcrncxngqwbhqapffb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0'
    )
    
    // Sign in as production user
    console.log('\\n=== STEP 1: Sign in as production user ===')
    const { data: authData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: 'michele@hairtalkz.com',
      password: 'HairTalkz2024!'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError)
      return false
    }
    
    console.log('✅ Signed in successfully')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    
    const userId = authData.user.id
    
    // Test the exact same query that's failing in resolveUserEntity
    console.log('\\n=== STEP 2: Test RLS-protected relationship query ===')
    const { data: relationship, error: relError } = await anonSupabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
      
    console.log('Relationship query result:', { relationship, relError })
    
    if (relError) {
      console.log('❌ RLS is blocking the relationship query!')
      console.log('   Error:', relError)
      console.log('   This explains why production authentication fails')
    } else if (!relationship) {
      console.log('⚠️ Query succeeded but returned no data')
      console.log('   This could indicate RLS filtering out the data')
    } else {
      console.log('✅ Relationship query succeeded with anon key')
      console.log('   RLS is not the issue')
    }
    
    // Test additional queries
    console.log('\\n=== STEP 3: Test USER entity query ===')
    const { data: userEntity, error: userError } = await anonSupabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    console.log('USER entity query result:', { hasData: !!userEntity, error: userError })
    
    console.log('\\n=== STEP 4: Test organization context ===')
    if (relationship?.organization_id) {
      const orgId = relationship.organization_id
      console.log(`Testing queries in organization: ${orgId}`)
      
      // Test dynamic data query
      const { data: dynamicData, error: dynamicError } = await anonSupabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_number, field_value_boolean, field_value_date')
        .eq('entity_id', userId)
        .eq('organization_id', orgId)
      
      console.log('Dynamic data query result:', { 
        count: dynamicData?.length || 0, 
        error: dynamicError 
      })
    }
    
    // Sign out
    await anonSupabase.auth.signOut()
    console.log('\\n👋 Signed out')
    
    // Final analysis
    console.log('\\n=== ANALYSIS ===')
    if (relError) {
      console.log('🚨 ISSUE IDENTIFIED: RLS is blocking relationship queries')
      console.log('\\n🔧 SOLUTION NEEDED:')
      console.log('   1. Check RLS policies on core_relationships table')
      console.log('   2. Ensure authenticated users can read their own relationships')
      console.log('   3. Update RLS policies if needed')
    } else if (relationship) {
      console.log('✅ RLS is working correctly')
      console.log('⚠️ Issue must be elsewhere in the authentication flow')
    } else {
      console.log('⚠️ RLS may be filtering data without throwing errors')
      console.log('   Need to check RLS policy conditions')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    return false
  }
}

// Run the test
testRLSPermissions()
  .then(success => {
    console.log(`\\n🎯 RLS test ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })