#!/usr/bin/env node

/**
 * Basic test to verify authentication is working
 */

import { config } from 'dotenv'

config()

// Demo auth token for testing
const TEST_TOKEN = 'demo-token-salon-receptionist'
const ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function testAuth() {
  try {
    const url = `http://localhost:3003/api/v2/entities?organization_id=${ORG_ID}&entity_type=customer&limit=1`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
        'x-hera-org-id': ORG_ID
      }
    })
    
    const data = await response.json()
    
    console.log('Auth test result:', {
      status: response.status,
      ok: response.ok,
      success: data.success,
      error: data.error,
      dataCount: data.data?.length || 0
    })
    
    if (response.ok) {
      console.log('✅ Authentication is working')
    } else {
      console.log('❌ Authentication failed')
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message)
  }
}

testAuth()