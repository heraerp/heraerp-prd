#!/usr/bin/env node

// Test the demo initialization API
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

async function testDemoInit() {
  try {
    console.log('🧪 Testing demo initialization API...')
    console.log(`📍 Base URL: ${baseUrl}`)
    
    const response = await fetch(`${baseUrl}/api/v1/demo/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ demoType: 'salon-receptionist' })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    
    const result = await response.json()
    console.log('📦 Response body:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('✅ Demo initialization successful!')
      console.log(`   User ID: ${result.user.entity_id}`)
      console.log(`   Organization ID: ${result.user.organization_id}`)
      console.log(`   Redirect URL: ${result.redirect_url}`)
      console.log(`   Scopes: ${result.user.scopes.length} permissions`)
    } else {
      console.log('❌ Demo initialization failed:', result.error)
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testDemoInit()