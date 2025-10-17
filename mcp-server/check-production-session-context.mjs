/**
 * Check what organization context the production user session has
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

async function checkProductionSessionContext() {
  console.log('🔍 Checking production user session context...')
  
  try {
    // Sign in as production user
    const anonSupabase = createClient(
      'https://awfcrncxngqwbhqapffb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0'
    )
    
    const { data: authData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: 'michele@hairtalkz.com',
      password: 'HairTalkz2024!'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError)
      return false
    }
    
    console.log('✅ Signed in successfully')
    const user = authData.user
    const session = authData.session
    
    console.log('\\n=== USER INFO ===')
    console.log('User ID:', user.id)
    console.log('Email:', user.email)
    console.log('App metadata:', JSON.stringify(user.app_metadata, null, 2))
    console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2))
    
    console.log('\\n=== JWT TOKEN CLAIMS ===')
    // Decode JWT to see what claims it has
    const tokenParts = session.access_token.split('.')
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    console.log('JWT payload:', JSON.stringify(payload, null, 2))
    
    // Check if organization_id is in the JWT
    if (payload.organization_id) {
      console.log(`\\n🏢 JWT contains organization_id: ${payload.organization_id}`)
    } else {
      console.log('\\n⚠️ JWT does NOT contain organization_id')
    }
    
    // Test the actual API endpoints that production uses
    console.log('\\n=== TESTING PRODUCTION API ENDPOINTS ===')
    
    // Test local resolve-membership endpoint
    console.log('\\n1. Testing local resolve-membership...')
    try {
      const localResponse = await fetch('http://localhost:3000/api/v2/auth/resolve-membership', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Local API Status:', localResponse.status)
      if (localResponse.ok) {
        const localData = await localResponse.json()
        console.log('Local API Success:', localData.success)
        if (localData.success) {
          console.log('  User Entity ID:', localData.user_entity_id)
          console.log('  Organization ID:', localData.membership.organization_id)
        }
      } else {
        const errorText = await localResponse.text()
        console.log('Local API Error:', errorText)
      }
    } catch (error) {
      console.log('Local API Error:', error.message)
    }
    
    // Test production resolve-membership endpoint
    console.log('\\n2. Testing production resolve-membership...')
    try {
      const prodResponse = await fetch('https://heraerp.com/api/v2/auth/resolve-membership', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Production API Status:', prodResponse.status)
      if (prodResponse.ok) {
        const prodData = await prodResponse.json()
        console.log('Production API Success:', prodData.success)
        if (prodData.success) {
          console.log('  User Entity ID:', prodData.user_entity_id)
          console.log('  Organization ID:', prodData.membership.organization_id)
        } else {
          console.log('  Error:', prodData.error || prodData.message)
        }
      } else {
        const errorText = await prodResponse.text()
        console.log('Production API Error:', errorText)
      }
    } catch (error) {
      console.log('Production API Error:', error.message)
    }
    
    await anonSupabase.auth.signOut()
    
    // Analysis
    console.log('\\n=== ANALYSIS ===')
    console.log('If local works but production fails, the issue is likely:')
    console.log('1. Environment variable mismatch between local/production')
    console.log('2. Different organization context in JWT claims')
    console.log('3. Different deployment/build artifacts')
    console.log('4. Network/CORS issues')
    
    return true
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    return false
  }
}

// Run the test
checkProductionSessionContext()
  .then(success => {
    console.log(`\\n🎯 Session context check ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })