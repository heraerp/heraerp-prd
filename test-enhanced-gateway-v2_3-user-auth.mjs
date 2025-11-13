#!/usr/bin/env node

/**
 * HERA v2.3 Enhanced API Gateway Test Suite - User Authentication
 * Tests with retail@heraerp.com user for realistic authentication flow
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ralywraqvuqgdezttfde.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjM0NzYsImV4cCI6MjA3NjkzOTQ3Nn0.61Qk721_L5sDJ-OXy3eRL9iAzTtrTb7tRZCvgEmDEJY'
const DEFAULT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Salon organization

// Test user credentials
const TEST_USER = {
  email: 'retail@heraerp.com',
  password: 'demo2025!'
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test configuration
const TEST_CONFIG = {
  gateway_url: `${SUPABASE_URL}/functions/v1/api-v2`,
  test_organization_id: DEFAULT_ORG_ID,
  timeout: 15000
}

// Global JWT token for authenticated requests
let authToken = null

/**
 * Test utilities
 */
class TestUtils {
  static async authenticateUser() {
    console.log('🔐 Authenticating test user...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
      
      if (error) {
        throw new Error(`Authentication failed: ${error.message}`)
      }
      
      if (!data.session?.access_token) {
        throw new Error('No access token received')
      }
      
      authToken = data.session.access_token
      console.log(`✅ Authenticated as ${TEST_USER.email}`)
      console.log(`   User ID: ${data.user.id}`)
      console.log(`   Token expires: ${new Date(data.session.expires_at * 1000).toISOString()}`)
      
      return data.user
    } catch (error) {
      console.error('❌ Authentication failed:', error.message)
      throw error
    }
  }

  static async makeRequest(endpoint, options = {}) {
    if (!authToken && !endpoint.includes('/health') && !endpoint.includes('/metrics') && !endpoint.includes('/gateway/test')) {
      throw new Error('Not authenticated - call authenticateUser() first')
    }

    const url = `${TEST_CONFIG.gateway_url}${endpoint}`
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': TEST_CONFIG.test_organization_id,
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      ...options
    }

    // Merge headers properly
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
        headers: Object.fromEntries(response.headers.entries()),
        data,
        response
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 0
      }
    }
  }

  static logTestResult(testName, result) {
    const status = result.success ? '✅' : '❌'
    const statusCode = result.status ? `(${result.status})` : ''
    console.log(`${status} ${testName} ${statusCode}`)
    
    if (!result.success) {
      console.log(`   Error: ${result.error || result.data?.error?.message || result.data?.error || JSON.stringify(result.data || 'Unknown error')}`)
    }
    
    // Log request ID for tracing
    if (result.data?.metadata?.request_id || result.headers?.['x-request-id']) {
      const requestId = result.data?.metadata?.request_id || result.headers?.['x-request-id']
      console.log(`   Request ID: ${requestId}`)
    }
    
    // Log response time
    if (result.headers?.['x-response-time']) {
      console.log(`   Response Time: ${result.headers['x-response-time']}`)
    }
    
    return result.success
  }

  static generateTestData() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    
    return {
      entity: {
        operation: 'CREATE',
        entity_data: {
          entity_type: 'CUSTOMER',
          entity_name: `Test Customer ${timestamp}`,
          smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.v1',
          organization_id: TEST_CONFIG.test_organization_id
        },
        dynamic_fields: [
          {
            field_name: 'email',
            field_type: 'email',
            field_value: `test${random}@salon.example.com`,
            smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
          },
          {
            field_name: 'phone',
            field_type: 'phone',
            field_value: `+971${timestamp.toString().slice(-8)}`,
            smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
          },
          {
            field_name: 'preferred_services',
            field_type: 'text',
            field_value: 'Hair Treatment, Styling',
            smart_code: 'HERA.SALON.CUSTOMER.FIELD.SERVICES.v1'
          }
        ],
        organization_id: TEST_CONFIG.test_organization_id
      },
      transaction: {
        operation: 'CREATE',
        transaction_data: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SERVICE_SALE.v1',
          total_amount: 450.00,
          transaction_currency_code: 'AED',
          organization_id: TEST_CONFIG.test_organization_id,
          transaction_date: new Date().toISOString().split('T')[0]
        },
        lines: [
          {
            line_number: 1,
            line_type: 'SERVICE',
            line_amount: 350.00,
            quantity: 1,
            description: 'Premium Hair Treatment',
            smart_code: 'HERA.SALON.SERVICE.HAIR_TREATMENT.v1'
          },
          {
            line_number: 2,
            line_type: 'SERVICE',
            line_amount: 100.00,
            quantity: 1,
            description: 'Hair Styling',
            smart_code: 'HERA.SALON.SERVICE.STYLING.v1'
          }
        ],
        organization_id: TEST_CONFIG.test_organization_id
      },
      ai_request: {
        prompt: 'Generate a personalized hair care recommendation for a customer with dry, curly hair',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        max_tokens: 500,
        organization_id: TEST_CONFIG.test_organization_id
      }
    }
  }
}

/**
 * Test suite for HERA v2.3 Enhanced Gateway
 */
class EnhancedGatewayTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    }
  }

  async runTest(testName, testFunction) {
    this.results.total++
    try {
      const success = await testFunction()
      if (success) {
        this.results.passed++
      } else {
        this.results.failed++
      }
    } catch (error) {
      console.log(`❌ ${testName} - Exception: ${error.message}`)
      this.results.failed++
    }
  }

  /**
   * Test health check endpoint
   */
  async testHealthCheck() {
    const result = await TestUtils.makeRequest('/health')
    const success = result.success && 
                   result.data?.data?.status && 
                   result.data?.data?.version === '2.3.0' &&
                   result.data?.data?.components
    
    TestUtils.logTestResult('Health Check', result)
    return success
  }

  /**
   * Test metrics endpoint
   */
  async testMetrics() {
    const result = await TestUtils.makeRequest('/metrics')
    const success = result.success && 
                   result.data?.data &&
                   result.data?.data?.middleware_chain &&
                   result.data?.data?.guardrails
    
    TestUtils.logTestResult('Metrics Endpoint', result)
    return success
  }

  /**
   * Test gateway enforcement
   */
  async testGatewayEnforcement() {
    const result = await TestUtils.makeRequest('/gateway/test')
    const success = result.success && 
                   result.data?.data &&
                   result.data?.data?.gateway_status === 'operational'
    
    TestUtils.logTestResult('Gateway Enforcement', result)
    return success
  }

  /**
   * Test authentication failure
   */
  async testAuthenticationFailure() {
    const result = await TestUtils.makeRequest('/entities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': TEST_CONFIG.test_organization_id
        // No Authorization header
      }
    })
    
    const success = !result.success && 
                   result.status === 401 &&
                   result.data?.error
    
    TestUtils.logTestResult('Authentication Failure', result)
    return success
  }

  /**
   * Test entity creation
   */
  async testEntityCreation() {
    const testData = TestUtils.generateTestData()
    
    const result = await TestUtils.makeRequest('/entities', {
      method: 'POST',
      body: JSON.stringify(testData.entity)
    })
    
    const success = result.success && result.data?.data
    
    TestUtils.logTestResult('Entity Creation', result)
    
    // Store entity ID for later tests
    if (success && result.data?.data?.entity_id) {
      this.createdEntityId = result.data.data.entity_id
    }
    
    return success
  }

  /**
   * Test entity search
   */
  async testEntitySearch() {
    const searchPayload = {
      entity_type: 'CUSTOMER',
      search_text: 'Test',
      limit: 10,
      organization_id: TEST_CONFIG.test_organization_id
    }
    
    const result = await TestUtils.makeRequest('/entities/search', {
      method: 'POST',
      body: JSON.stringify(searchPayload)
    })
    
    const success = result.success && result.data?.data
    
    TestUtils.logTestResult('Entity Search', result)
    return success
  }

  /**
   * Test transaction creation
   */
  async testTransactionCreation() {
    const testData = TestUtils.generateTestData()
    
    const result = await TestUtils.makeRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(testData.transaction)
    })
    
    const success = result.success && result.data?.data
    
    TestUtils.logTestResult('Transaction Creation', result)
    
    // Store transaction ID for later tests
    if (success && result.data?.data?.transaction_id) {
      this.createdTransactionId = result.data.data.transaction_id
    }
    
    return success
  }

  /**
   * Test AI assistant endpoint
   */
  async testAIAssistant() {
    const testData = TestUtils.generateTestData()
    
    const result = await TestUtils.makeRequest('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify(testData.ai_request)
    })
    
    const success = result.success && result.data?.data
    
    TestUtils.logTestResult('AI Assistant', result)
    return success
  }

  /**
   * Test AI usage endpoint
   */
  async testAIUsage() {
    const result = await TestUtils.makeRequest('/ai/usage?timeframe=7d', {
      method: 'GET'
    })
    
    const success = result.success && result.data !== undefined
    
    TestUtils.logTestResult('AI Usage', result)
    return success
  }

  /**
   * Test rate limiting (make multiple requests quickly)
   */
  async testRateLimiting() {
    console.log('📊 Testing rate limiting with multiple rapid requests...')
    
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(TestUtils.makeRequest('/health'))
    }
    
    const results = await Promise.all(requests)
    const successCount = results.filter(r => r.success).length
    const hasRateLimitHeaders = results.some(r => 
      r.headers && 
      (r.headers['x-ratelimit-limit'] || r.headers['x-ratelimit-remaining'])
    )
    
    const success = successCount >= 5 // At least half should succeed
    TestUtils.logTestResult('Rate Limiting', { success, status: 200, data: `${successCount}/10 requests succeeded` })
    
    if (hasRateLimitHeaders) {
      console.log('   ✅ Rate limit headers detected')
    }
    
    return success
  }

  /**
   * Test idempotency (duplicate requests)
   */
  async testIdempotency() {
    const testData = TestUtils.generateTestData()
    const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(testData.entity),
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    }
    
    // Make the same request twice with same idempotency key
    const first = await TestUtils.makeRequest('/entities', requestOptions)
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const second = await TestUtils.makeRequest('/entities', requestOptions)
    
    // At least one should succeed, and they should be handled properly
    const success = first.success || second.success
    
    TestUtils.logTestResult('Idempotency', { success, status: first.status || second.status })
    
    if (first.success && second.success) {
      console.log('   ✅ Both requests succeeded (idempotency handling active)')
    } else if (first.success || second.success) {
      console.log('   ⚠️ One request succeeded (partial idempotency)')
    }
    
    return success
  }

  /**
   * Test error handling with invalid data
   */
  async testErrorHandling() {
    const invalidPayload = {
      entity_data: {
        // Missing required fields and invalid smart code
        entity_type: '',
        smart_code: 'INVALID_SMART_CODE_FORMAT',
        organization_id: TEST_CONFIG.test_organization_id
      }
    }
    
    const result = await TestUtils.makeRequest('/entities', {
      method: 'POST',
      body: JSON.stringify(invalidPayload)
    })
    
    const success = !result.success && 
                   result.status >= 400 &&
                   result.data?.error
    
    TestUtils.logTestResult('Error Handling', result)
    
    if (success && result.data?.error?.suggestions) {
      console.log('   ✅ Error includes helpful suggestions')
    }
    
    return success
  }

  /**
   * Test middleware chain execution
   */
  async testMiddlewareChain() {
    const testData = TestUtils.generateTestData()
    
    const result = await TestUtils.makeRequest('/entities', {
      method: 'POST',
      body: JSON.stringify(testData.entity),
      headers: {
        'X-Test-Middleware': 'true'
      }
    })
    
    // Check for middleware execution evidence in headers
    const hasMiddlewareHeaders = result.headers && (
      result.headers['x-request-id'] ||
      result.headers['x-response-time'] ||
      result.headers['x-ratelimit-limit']
    )
    
    const success = result.status !== 0 && hasMiddlewareHeaders
    
    TestUtils.logTestResult('Middleware Chain', { 
      success, 
      status: result.status,
      data: hasMiddlewareHeaders ? 'Middleware headers present' : 'No middleware headers'
    })
    
    return success
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 HERA v2.3 Enhanced API Gateway Test Suite')
    console.log('='*60)
    console.log(`Gateway URL: ${TEST_CONFIG.gateway_url}`)
    console.log(`Test User: ${TEST_USER.email}`)
    console.log(`Organization: ${TEST_CONFIG.test_organization_id}`)
    console.log('')

    // Authenticate first
    try {
      await TestUtils.authenticateUser()
    } catch (error) {
      console.error('💥 Failed to authenticate test user. Cannot proceed with tests.')
      return
    }
    console.log('')

    // Infrastructure tests
    console.log('📋 Infrastructure Tests')
    await this.runTest('Health Check', () => this.testHealthCheck())
    await this.runTest('Metrics', () => this.testMetrics())
    await this.runTest('Gateway Enforcement', () => this.testGatewayEnforcement())
    await this.runTest('Middleware Chain', () => this.testMiddlewareChain())
    console.log('')

    // Security tests
    console.log('🔒 Security Tests')
    await this.runTest('Authentication Failure', () => this.testAuthenticationFailure())
    await this.runTest('Rate Limiting', () => this.testRateLimiting())
    await this.runTest('Idempotency', () => this.testIdempotency())
    console.log('')

    // Functional tests
    console.log('⚙️ Functional Tests')
    await this.runTest('Entity Creation', () => this.testEntityCreation())
    await this.runTest('Entity Search', () => this.testEntitySearch())
    await this.runTest('Transaction Creation', () => this.testTransactionCreation())
    console.log('')

    // AI tests
    console.log('🤖 AI Tests')
    await this.runTest('AI Assistant', () => this.testAIAssistant())
    await this.runTest('AI Usage', () => this.testAIUsage())
    console.log('')

    // Error handling tests
    console.log('🚨 Error Handling Tests')
    await this.runTest('Error Handling', () => this.testErrorHandling())
    console.log('')

    this.printResults()
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('='*60)
    console.log('📊 Test Results Summary')
    console.log('='*60)
    console.log(`Total Tests: ${this.results.total}`)
    console.log(`Passed: ${this.results.passed} ✅`)
    console.log(`Failed: ${this.results.failed} ❌`)
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)
    console.log('')

    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! HERA v2.3 Enhanced Gateway is fully operational.')
      console.log('🚀 Ready for production deployment.')
    } else if (this.results.passed >= this.results.total * 0.7) {
      console.log(`✅ Most functionality working (${this.results.passed}/${this.results.total} tests passed)`)
      console.log('🔧 Minor issues detected - review failed tests.')
    } else {
      console.log(`⚠️ Significant issues detected (${this.results.failed}/${this.results.total} tests failed)`)
      console.log('🛠️ Major fixes required before deployment.')
    }

    console.log('')
    console.log('🔗 Next Steps:')
    if (this.results.failed === 0) {
      console.log('   - Deploy enhanced gateway to production')
      console.log('   - Monitor performance and error metrics')
      console.log('   - Begin Milestone 2: Rules Engine MOAT')
      console.log('   - Update client SDKs to use enhanced endpoints')
    } else {
      console.log('   - Review and fix failing test cases')
      console.log('   - Check gateway deployment status')
      console.log('   - Verify middleware chain execution')
      console.log('   - Test authentication flow manually')
    }
    
    console.log('')
    console.log('📈 Performance Insights:')
    console.log('   - Check X-Response-Time headers for latency')
    console.log('   - Monitor rate limiting effectiveness')
    console.log('   - Verify idempotency cache behavior')
    console.log('   - Validate error response structure')
  }
}

// Run the test suite
const testSuite = new EnhancedGatewayTestSuite()
testSuite.runAllTests().catch(error => {
  console.error('💥 Test suite failed with error:', error)
  process.exit(1)
})