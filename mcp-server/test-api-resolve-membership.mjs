#!/usr/bin/env node

/**
 * Test /api/v2/auth/resolve-membership API
 * Simulates what happens when salon@heraerp.com logs in
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAPIResolveMembership() {
  console.log('🧪 Testing /api/v2/auth/resolve-membership API\n')
  console.log('='.repeat(80))

  const targetEmail = 'salon@heraerp.com'
  const targetPassword = 'demo2025!'

  try {
    // 1. Authenticate as the user
    console.log('\n📧 Step 1: Authenticate as salon@heraerp.com')
    console.log('-'.repeat(80))

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword
    })

    if (authError) {
      console.error('❌ Auth failed:', authError)
      return
    }

    console.log('✅ Authentication successful')
    console.log('   Auth UID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Session token:', authData.session.access_token.substring(0, 20) + '...')
    console.log('   User metadata:', JSON.stringify(authData.user.user_metadata, null, 2))

    // 2. Get user from admin API to see full metadata
    console.log('\n👤 Step 2: Get user metadata from admin API')
    console.log('-'.repeat(80))

    const { data: adminUser, error: adminError } = await supabase.auth.admin.getUserById(
      authData.user.id
    )

    if (adminError) {
      console.error('❌ Admin get user failed:', adminError)
    } else {
      console.log('✅ User metadata from admin API:')
      console.log(JSON.stringify(adminUser.user.user_metadata, null, 2))
    }

    // 3. Test the API endpoint that HERAAuthProvider calls
    console.log('\n🌐 Step 3: Test /api/v2/auth/resolve-membership')
    console.log('-'.repeat(80))

    const apiUrl = 'http://localhost:3000/api/v2/auth/resolve-membership'

    console.log('   API URL:', apiUrl)
    console.log('   Auth token:', authData.session.access_token.substring(0, 20) + '...')

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    })

    console.log('   Response status:', response.status, response.statusText)

    const responseData = await response.json()

    if (response.ok) {
      console.log('\n✅ API returned success:')
      console.log(JSON.stringify(responseData, null, 2))

      console.log('\n📊 Parsed data:')
      console.log('   User Entity ID:', responseData.user_entity_id)
      console.log('   Organization ID:', responseData.membership?.organization_id || responseData.organization_id)
      console.log('   Role:', responseData.membership?.primary_role)
      console.log('   Organizations:', responseData.organization_count)
    } else {
      console.log('\n❌ API returned error:')
      console.log('   Error code:', responseData.error)
      console.log('   Error message:', responseData.message)
      console.log('   Full response:', JSON.stringify(responseData, null, 2))
    }

    // 4. Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Signed out')

  } catch (error) {
    console.error('\n💥 Test failed:', error)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Test complete')
}

testAPIResolveMembership()
