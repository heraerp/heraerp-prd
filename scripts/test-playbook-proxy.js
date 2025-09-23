#!/usr/bin/env node

/**
 * Test script for Playbook proxy
 * 
 * Usage:
 *   node scripts/test-playbook-proxy.js
 * 
 * This tests the secure proxy setup by making requests through the /api/playbook route
 */

const organizationId = process.env.TEST_ORG_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0' // Hair Talkz

// Test configuration
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const tests = []

// Helper to make requests
async function testRequest(name, options) {
  console.log(`\n🧪 Testing: ${name}`)
  console.log(`   URL: ${options.url}`)
  
  try {
    const response = await fetch(`${baseUrl}${options.url}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    })

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = responseText
    }

    if (response.ok) {
      console.log(`✅ Success (${response.status})`)
      console.log(`   Response: ${JSON.stringify(data, null, 2).slice(0, 200)}...`)
    } else {
      console.log(`❌ Failed (${response.status})`)
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`)
    }

    tests.push({ name, success: response.ok, status: response.status })
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    tests.push({ name, success: false, error: error.message })
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Testing Playbook Proxy Setup')
  console.log(`   Base URL: ${baseUrl}`)
  console.log(`   Organization: ${organizationId}`)

  // Test 1: List services
  await testRequest('List Services', {
    url: `/api/playbook/entities?type=HERA.SALON.SERVICE.V1&organization_id=${organizationId}&limit=5`
  })

  // Test 2: Test with branch filter
  await testRequest('List Services (with branch)', {
    url: `/api/playbook/entities?type=HERA.SALON.SERVICE.V1&organization_id=${organizationId}&branch_id=ALL&limit=5`
  })

  // Test 3: Test dynamic data endpoint
  await testRequest('Query Dynamic Data', {
    url: '/api/playbook/dynamic_data/query',
    method: 'POST',
    body: {
      entity_ids: ['test-id'],
      smart_code: 'HERA.SALON.SERVICE.PRICE.V1'
    }
  })

  // Test 4: Test security - blocked path
  await testRequest('Blocked Path (Security)', {
    url: '/api/playbook/admin/users' // Not in allowed paths
  })
  
  // Test 5: Test correlation ID
  await testRequest('With Correlation ID', {
    url: `/api/playbook/entities?type=HERA.SALON.SERVICE.V1&organization_id=${organizationId}&limit=1`,
    headers: {
      'X-Correlation-ID': `test_${Date.now()}`
    }
  })
  
  // Test 6: Test large body rejection
  await testRequest('Large Body (Security)', {
    url: '/api/playbook/entities',
    method: 'POST',
    body: {
      large_data: 'x'.repeat(1024 * 1024 + 1) // Over 1MB limit
    }
  })
  
  // Test 7: Test error handling
  await testRequest('Invalid Endpoint', {
    url: '/api/playbook/v2/unknown' // Valid path prefix but non-existent
  })

  // Summary
  console.log('\n📊 Test Summary:')
  const passed = tests.filter(t => t.success).length
  const failed = tests.filter(t => !t.success).length
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed tests:')
    tests.filter(t => !t.success).forEach(t => {
      console.log(`   - ${t.name}: ${t.error || `HTTP ${t.status}`}`)
    })
  }

  // Check environment
  console.log('\n🔧 Environment Check:')
  const envCheck = await fetch(`${baseUrl}/api/health`)
  if (envCheck.ok) {
    console.log('   ✅ Server is running')
  } else {
    console.log('   ❌ Server health check failed')
  }

  console.log('\n💡 Next Steps:')
  console.log('   1. Ensure PLAYBOOK_BASE_URL and PLAYBOOK_API_KEY are set in .env.local')
  console.log('   2. Set NEXT_PUBLIC_DEBUG_PLAYBOOK=1 for detailed console logging')
  console.log('   3. Visit http://localhost:3001/salon/services to see live data')
  console.log('   4. Open browser DevTools > Network to verify /api/playbook requests')
}

// Run the tests
runTests().catch(console.error)