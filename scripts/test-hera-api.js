#!/usr/bin/env node

/**
 * Test HERA API Endpoints for Documentation Sync
 * Verifies that all required API endpoints are available
 */

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    
    if (data) {
      options.body = JSON.stringify(data)
    }

    console.log(`Testing ${method} ${endpoint}...`)
    const response = await fetch(`${apiBase}${endpoint}`, options)
    
    if (response.ok) {
      console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`)
      return true
    } else {
      console.log(`❌ ${method} ${endpoint} - Status: ${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`)
    return false
  }
}

async function testHERAAPI() {
  console.log('🧪 Testing HERA API endpoints for documentation sync...')
  console.log(`Base URL: ${apiBase}`)
  console.log('')

  const tests = [
    // Client endpoints
    ['POST', '/api/v1/clients/search', { filters: { client_name: 'Test' } }],
    ['POST', '/api/v1/clients', { 
      client_name: 'Test Client',
      client_code: 'TEST',
      client_type: 'test',
      status: 'active'
    }],

    // Organization endpoints
    ['POST', '/api/v1/organizations/search', { filters: { organization_name: 'Test' } }],
    ['POST', '/api/v1/organizations', {
      organization_name: 'Test Organization',
      organization_type: 'test',
      status: 'active'
    }],

    // Entity endpoints
    ['POST', '/api/v1/entities/search', { entity_type: 'doc_page' }],
    ['POST', '/api/v1/entities', {
      entity_type: 'doc_page',
      entity_name: 'Test Page',
      entity_code: 'test-page',
      status: 'active'
    }],

    // Dynamic data endpoints
    ['POST', '/api/v1/dynamic-data', {
      field_name: 'content',
      field_type: 'text',
      field_value: 'Test content'
    }],

    // Relationship endpoints
    ['POST', '/api/v1/relationships', {
      relationship_type: 'navigation_next',
      relationship_strength: 1.0
    }],

    // Transaction endpoints
    ['POST', '/api/v1/transactions', {
      transaction_type: 'documentation_sync',
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    }]
  ]

  let passedTests = 0
  const totalTests = tests.length

  for (const [method, endpoint, data] of tests) {
    const passed = await testEndpoint(method, endpoint, data)
    if (passed) passedTests++
    console.log('')
  }

  console.log('📊 Test Results:')
  console.log(`✅ Passed: ${passedTests}/${totalTests}`)
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`)

  if (passedTests === totalTests) {
    console.log('🎉 All API endpoints are ready for documentation sync!')
  } else {
    console.log('⚠️  Some API endpoints need attention before syncing')
    console.log('💡 Make sure your HERA API server is running and all endpoints are implemented')
  }

  return passedTests === totalTests
}

// Test for development server
async function testDevelopmentServer() {
  console.log('🌐 Testing development server...')
  
  try {
    const response = await fetch(`${apiBase}/`)
    if (response.ok) {
      console.log('✅ Development server is running')
      return true
    } else {
      console.log('❌ Development server returned error:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Development server is not accessible:', error.message)
    console.log('💡 Make sure to run: npm run dev')
    return false
  }
}

// Main test function
async function runTests() {
  const serverRunning = await testDevelopmentServer()
  if (!serverRunning) {
    console.log('🛑 Cannot test API endpoints - server is not running')
    process.exit(1)
  }

  console.log('')
  const allTestsPassed = await testHERAAPI()
  
  if (allTestsPassed) {
    console.log('')
    console.log('🚀 Ready to sync documentation!')
    console.log('Run: npm run docs:sync')
  } else {
    console.log('')
    console.log('🔧 Fix API issues before running sync')
  }

  process.exit(allTestsPassed ? 0 : 1)
}

if (require.main === module) {
  runTests()
}

module.exports = { testHERAAPI, testDevelopmentServer }