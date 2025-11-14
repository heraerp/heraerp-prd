#!/usr/bin/env node

/**
 * Test the resolve-membership API fix
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Test the API endpoint directly
const testResolveAPI = async () => {
  console.log('🧪 Testing resolve-membership API...')
  
  // First login to get a token
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@heraerp.com',
    password: 'AdminPass123!'
  })
  
  if (authError) {
    console.error('❌ Login failed:', authError.message)
    return
  }
  
  console.log('✅ Login successful, testing membership API...')
  
  // Test the resolve-membership endpoint
  const response = await fetch('http://localhost:3000/api/v2/auth/resolve-membership', {
    headers: {
      'Authorization': `Bearer ${authData.session.access_token}`,
      'Cache-Control': 'no-cache'
    }
  })
  
  if (!response.ok) {
    console.error('❌ API failed:', response.status, response.statusText)
    const errorData = await response.text()
    console.error('Error data:', errorData)
    return
  }
  
  const data = await response.json()
  console.log('✅ API Success!')
  console.log('Organizations:', data.organizations?.length || 0)
  
  data.organizations?.forEach(org => {
    console.log(`  - ${org.name} (${org.code}): ${org.apps?.length || 0} apps`)
    org.apps?.forEach(app => {
      console.log(`    • ${app.name} (${app.code}): ${app.url}`)
    })
  })
  
  // Logout
  await supabase.auth.signOut()
  
  console.log('\n🎉 Test complete - apps should now be available!')
}

testResolveAPI().catch(console.error)