#!/usr/bin/env node

/**
 * Test script for MCP WhatsApp Integration
 * Run this to verify your MCP tools are working correctly
 */

const fetch = require('node-fetch')

const API_URL = 'http://localhost:3002/api/v1/mcp/tools'
const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || 'test-org-id'

async function testMCPTool(tool, input) {
  console.log(`\n🧪 Testing ${tool}...`)
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': ORG_ID
      },
      body: JSON.stringify({ tool, input })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Success:', JSON.stringify(result.data, null, 2))
    } else {
      console.log('❌ Failed:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 MCP WhatsApp Integration Test Suite')
  console.log('=====================================')
  console.log(`Organization ID: ${ORG_ID}`)
  console.log(`API URL: ${API_URL}`)
  
  // Test 1: Check window state
  await testMCPTool('wa.window_state', {
    organization_id: ORG_ID,
    wa_contact_id: 'test_contact_123'
  })
  
  // Test 2: Find calendar slots
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  await testMCPTool('calendar.find_slots', {
    organization_id: ORG_ID,
    duration: 60,
    date_range: {
      start: tomorrow.toISOString(),
      end: nextWeek.toISOString()
    }
  })
  
  // Test 3: Check pricing estimate
  await testMCPTool('pricing.estimate', {
    organization_id: ORG_ID,
    region: 'US',
    category: 'utility'
  })
  
  // Test 4: Check budget
  await testMCPTool('budget.check', {
    organization_id: ORG_ID,
    category: 'marketing'
  })
  
  // Test 5: Create a test entity
  await testMCPTool('hera.entity.upsert', {
    organization_id: ORG_ID,
    entity_type: 'test_customer',
    payload: {
      entity_name: 'Test Customer',
      smart_code: 'HERA.SALON.CUSTOMER.TEST.v1',
      metadata: {
        phone: '+1234567890',
        created_via: 'mcp_test'
      }
    }
  })
  
  console.log('\n✨ Test suite completed!')
}

// Check if API is available
async function checkAPIHealth() {
  try {
    const response = await fetch(API_URL.replace('/tools', '/tools'), {
      method: 'GET'
    })
    const data = await response.json()
    console.log('🏥 API Health Check:', data.status)
    console.log('📦 Available tools:', data.available_tools.join(', '))
    return true
  } catch (error) {
    console.error('❌ API is not available. Make sure the Next.js server is running.')
    return false
  }
}

// Run tests
async function main() {
  const isHealthy = await checkAPIHealth()
  if (isHealthy) {
    await runTests()
  }
}

main().catch(console.error)