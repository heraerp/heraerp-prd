/**
 * Test the exact flow that's failing in production
 * Simulate the resolveUserEntity function step by step
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const productionUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674' // michele@hairtalkz.com

async function testExactProductionFlow() {
  console.log('🧪 Testing exact production resolveUserEntity flow...')
  console.log(`User ID: ${productionUserId}`)
  
  try {
    // Step 1: Exact same query from resolveUserEntity line 77-83
    console.log('\\n=== STEP 1: Direct relationship query ===')
    console.log(`🔍 Resolving user entity for: ${productionUserId} (attempt #0)`)
    
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
      
    console.log(`🔍 Direct relationship query result:`, { relationship, relError })
    
    if (relError) {
      console.log('❌ Relationship query failed:', relError)
      console.log('   This would trigger service endpoint fallback')
      
      // Step 2: Service endpoint fallback
      console.log('\\n=== STEP 2: Service endpoint fallback ===')
      console.log('🔧 Attempting membership resolution via service endpoint...')
      
      // Simulate the production environment - use anon key
      const prodSupabase = createClient(
        'https://awfcrncxngqwbhqapffb.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0'
      )
      
      // Sign in as the production user
      const { data: authData, error: signInError } = await prodSupabase.auth.signInWithPassword({
        email: 'michele@hairtalkz.com',
        password: 'HairTalkz2024!'
      })
      
      if (signInError) {
        console.error('❌ Could not sign in as production user:', signInError)
        return false
      }
      
      console.log('✅ Signed in as production user')
      console.log('   User ID:', authData.user.id)
      console.log('   Email:', authData.user.email)
      
      // Test the API endpoint that's failing
      const response = await fetch('http://localhost:3000/api/v2/auth/resolve-membership', {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'x-force-refresh': 'true'
        }
      })
      
      console.log('API Response Status:', response.status)
      
      if (response.ok) {
        const serviceData = await response.json()
        console.log('✅ Service endpoint response:', JSON.stringify(serviceData, null, 2))
        
        if (serviceData.success) {
          console.log('✅ Service endpoint resolved membership successfully')
          console.log('   This means the issue is in the frontend RLS context')
        } else {
          console.log('❌ Service endpoint returned unsuccessful response')
        }
      } else {
        const errorText = await response.text()
        console.log('❌ Service endpoint failed:', errorText)
      }
      
      // Sign out
      await prodSupabase.auth.signOut()
      
    } else if (!relationship) {
      console.log('❌ No relationship found (but no error)')
      console.log('   This would trigger service endpoint fallback')
    } else {
      console.log('✅ Relationship found:', relationship)
      console.log('   Direct query should work - no need for service endpoint')
    }
    
    // Step 3: Check what's different about the production query context
    console.log('\\n=== STEP 3: RLS Context Analysis ===')
    
    // Check if RLS is affecting the query
    const { data: allUserRelationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
    
    console.log(`All MEMBER_OF relationships for user: ${allUserRelationships?.length || 0}`)
    allUserRelationships?.forEach((rel, i) => {
      console.log(`  ${i + 1}. Org: ${rel.organization_id}, Active: ${rel.is_active}, To: ${rel.to_entity_id}`)
    })
    
    // Check active relationships only
    const { data: activeRelationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
    
    console.log(`Active MEMBER_OF relationships: ${activeRelationships?.length || 0}`)
    
    if (activeRelationships?.length === 1) {
      console.log('✅ Production user has exactly 1 active relationship - data is correct')
      console.log('   Issue must be in RLS context or frontend permissions')
    } else if (activeRelationships?.length === 0) {
      console.log('❌ No active relationships - this explains the failure')
    } else {
      console.log('⚠️ Multiple active relationships - may cause maybeSingle() to fail')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    return false
  }
}

// Run the test
testExactProductionFlow()
  .then(success => {
    console.log(`\\n🎯 Test ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })