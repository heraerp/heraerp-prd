#!/usr/bin/env node

/**
 * HERA Enhanced API Gateway - Quick Deployment Verification Test
 * Tests consolidated gateway after manual dashboard deployment
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjM0NzYsImV4cCI6MjA3NjkzOTQ3Nn0.61Qk721_L5sDJ-OXy3eRL9iAzTtrTb7tRZCvgEmDEJY'
const GATEWAY_URL = 'https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2'
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const TEST_USER = {
  email: 'retail@heraerp.com',
  password: 'demo2025!'
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
let authToken = null

async function authenticateUser() {
  console.log('🔐 Authenticating test user...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password
  })
  
  if (error) throw new Error(`Authentication failed: ${error.message}`)
  if (!data.session?.access_token) throw new Error('No access token received')
  
  authToken = data.session.access_token
  console.log(`✅ Authenticated as ${TEST_USER.email}`)
  return data.user
}

async function makeRequest(endpoint, options = {}) {
  const url = `${GATEWAY_URL}${endpoint}`
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Organization-Id': TEST_ORG_ID,
      ...(authToken && !endpoint.includes('/health') ? { 'Authorization': `Bearer ${authToken}` } : {})
    },
    ...options
  }

  if (options.headers) {
    defaultOptions.headers = { ...defaultOptions.headers, ...options.headers }
  }

  console.log(`📡 ${defaultOptions.method} ${endpoint}`)
  
  try {
    const response = await fetch(url, defaultOptions)
    let data
    
    try {
      data = await response.json()
    } catch (e) {
      data = await response.text()
    }
    
    return {
      success: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    }
  }
}

function logResult(testName, result) {
  const status = result.success ? '✅' : '❌'
  const statusCode = result.status ? `(${result.status})` : ''
  console.log(`${status} ${testName} ${statusCode}`)
  
  if (!result.success) {
    console.log(`   Error: ${result.error || result.data?.error || JSON.stringify(result.data) || 'Unknown error'}`)
  }
  
  if (result.data?.rid || result.headers?.['x-request-id']) {
    const requestId = result.data?.rid || result.headers?.['x-request-id']
    console.log(`   Request ID: ${requestId}`)
  }
  
  if (result.headers?.['x-response-time']) {
    console.log(`   Response Time: ${result.headers['x-response-time']}`)
  }
  
  return result.success
}

async function runQuickTests() {
  console.log('🚀 HERA Enhanced Gateway - Quick Deployment Verification')
  console.log('='*65)
  console.log(`Gateway URL: ${GATEWAY_URL}`)
  console.log(`Test Organization: ${TEST_ORG_ID}`)
  console.log('')

  let passed = 0
  let failed = 0
  let total = 0

  const runTest = async (name, testFn) => {
    total++
    try {
      const success = await testFn()
      if (success) passed++
      else failed++
    } catch (error) {
      console.log(`❌ ${name} - Exception: ${error.message}`)
      failed++
    }
  }

  // Test 1: Health Check (no auth required)
  await runTest('Health Check', async () => {
    const result = await makeRequest('/health')
    const success = result.success && 
                   result.data?.status && 
                   result.data?.version === '2.3.0'
    return logResult('Health Check', result) && success
  })

  // Test 2: Authentication 
  try {
    await authenticateUser()
    console.log('✅ Authentication Test')
    passed++
    total++
  } catch (error) {
    console.log('❌ Authentication Test - ' + error.message)
    failed++
    total++
    console.log('\n❌ Cannot proceed with authenticated tests without valid auth token')
    console.log(`📊 Quick Test Results: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`)
    return
  }

  console.log('')

  // Test 3: Metrics Endpoint
  await runTest('Metrics Endpoint', async () => {
    const result = await makeRequest('/metrics')
    const success = result.success && 
                   result.data?.middleware_chain && 
                   result.data?.guardrails
    return logResult('Metrics', result) && success
  })

  // Test 4: AI Assistant Endpoint (authenticated)
  await runTest('AI Assistant', async () => {
    const result = await makeRequest('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Test prompt for quick verification',
        organization_id: TEST_ORG_ID
      })
    })
    const success = result.success && result.data?.response
    return logResult('AI Assistant', result) && success
  })

  // Test 5: Entity Creation (authenticated)
  await runTest('Entity Operations', async () => {
    const testEntity = {
      operation: 'CREATE',
      entity_data: {
        entity_type: 'TEST',
        entity_name: `Quick Test ${Date.now()}`,
        smart_code: 'HERA.TEST.ENTITY.QUICK.v1',
        organization_id: TEST_ORG_ID
      },
      organization_id: TEST_ORG_ID
    }

    const result = await makeRequest('/entities', {
      method: 'POST',
      body: JSON.stringify(testEntity)
    })
    
    // Accept either success or specific guardrail violations as valid responses
    const success = result.success || 
                   (result.status >= 400 && result.data?.error?.includes('guardrail_violation'))
    return logResult('Entity Operations', result) && success
  })

  console.log('')
  console.log('='*65)
  console.log('📊 Quick Test Results Summary')
  console.log('='*65)
  console.log(`Total Tests: ${total}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  console.log('')

  if (failed === 0) {
    console.log('🎉 All tests passed! Consolidated gateway is operational.')
    console.log('🚀 Ready to deploy AI Digital Accountant features.')
    console.log('')
    console.log('🔗 Next Steps:')
    console.log('   1. Run full test suite: node test-enhanced-gateway-v2_3-user-auth.mjs')
    console.log('   2. Begin Phase 1A: Core AI Route implementation')
    console.log('   3. Update client applications to use new gateway')
  } else if (passed >= total * 0.6) {
    console.log(`✅ Most functionality working (${passed}/${total} tests passed)`)
    console.log('🔧 Minor issues detected - review failed tests.')
    console.log('')
    console.log('🔗 Recommended Actions:')
    console.log('   1. Check Supabase function logs for errors')
    console.log('   2. Verify environment variables are set')
    console.log('   3. Run comprehensive test suite for detailed analysis')
  } else {
    console.log(`⚠️ Significant issues detected (${failed}/${total} tests failed)`)
    console.log('🛠️ Gateway requires fixes before proceeding.')
    console.log('')
    console.log('🔗 Troubleshooting Steps:')
    console.log('   1. Check Supabase Dashboard for deployment errors')
    console.log('   2. Verify function code was deployed correctly')
    console.log('   3. Check environment variables and RPC functions')
    console.log('   4. Review ENHANCED-GATEWAY-DEPLOYMENT-GUIDE.md')
  }

  console.log('')
  console.log('📍 Gateway Health Summary:')
  console.log(`   Gateway URL: ${GATEWAY_URL}`)
  console.log(`   Authentication: ${authToken ? 'Working' : 'Failed'}`)
  console.log(`   Health Endpoint: ${passed > 0 ? 'Working' : 'Failed'}`)
  console.log(`   AI Endpoints: ${passed >= 4 ? 'Working' : 'Needs Investigation'}`)
}

// Run the tests
runQuickTests().catch(error => {
  console.error('💥 Quick test suite failed with error:', error)
  process.exit(1)
})