#!/usr/bin/env node

/**
 * Test the fixed auth/attach endpoint
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testAttachEndpoint() {
  try {
    console.log('🔍 Testing auth/attach endpoint...')
    console.log('='.repeat(50))
    
    // Test the endpoint by making HTTP request with proper auth
    const response = await fetch('http://localhost:3001/api/v2/auth/attach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token',  // This will use fallback auth
        'x-hera-org-id': '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
      }
    })
    
    console.log('📊 Response Status:', response.status)
    console.log('📊 Response Headers:', [...response.headers.entries()])
    
    const result = await response.text()
    console.log('📊 Response Body:', result)
    
    if (response.status === 200) {
      console.log('✅ Auth attach endpoint working!')
    } else {
      console.log('❌ Auth attach endpoint failed')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAttachEndpoint()