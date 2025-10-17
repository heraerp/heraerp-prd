/**
 * Test Michele's complete auth flow locally
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0'
)

async function testMicheleAuthFlow() {
  console.log('🧪 Testing Michele auth flow...')
  
  try {
    // 1. Sign in as Michele
    console.log('1. Signing in as Michele...')
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'michele@hairtalkz.ae',
      password: 'HairTalkz2024!'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError)
      return false
    }
    
    console.log('✅ Signed in successfully')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    
    // 2. Test resolve-membership API with real JWT
    console.log('\n2. Testing resolve-membership API...')
    const token = authData.session.access_token
    
    const response = await fetch('http://localhost:3000/api/v2/auth/resolve-membership', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('API Response Status:', response.status)
    console.log('API Response:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('✅ resolve-membership API SUCCESS!')
      console.log('   User Entity ID:', result.user_entity_id)
      console.log('   Organization ID:', result.membership.organization_id)
    } else {
      console.log('❌ resolve-membership API FAILED')
    }
    
    // 3. Test Bearer auth endpoint
    console.log('\n3. Testing Bearer auth endpoint...')
    const bearerResponse = await fetch('http://localhost:3000/api/v2/bearer-test', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const bearerResult = await bearerResponse.json()
    console.log('Bearer Test Status:', bearerResponse.status)
    console.log('Bearer Test Response:', JSON.stringify(bearerResult, null, 2))
    
    // 4. Sign out
    console.log('\n4. Signing out...')
    await supabase.auth.signOut()
    console.log('✅ Signed out')
    
    return response.ok
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    return false
  }
}

// Run the test
testMicheleAuthFlow()
  .then(success => {
    console.log(`\n🎯 Test ${success ? 'PASSED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })