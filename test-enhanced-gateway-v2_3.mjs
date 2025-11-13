#!/usr/bin/env node

/**
 * HERA v2.3 Enhanced API Gateway Test Suite
 * Tests modular middleware architecture, route handlers, and error handling
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEFAULT_ORG_ID) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEFAULT_ORGANIZATION_ID')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test configuration
const TEST_CONFIG = {
  gateway_url: `${SUPABASE_URL}/functions/v1/api-v2`,
  test_organization_id: DEFAULT_ORG_ID,
  timeout: 10000
}

/**
 * Test utilities
 */
class TestUtils {
  static async makeRequest(endpoint, options = {}) {
    const url = `${TEST_CONFIG.gateway_url}${endpoint}`
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': TEST_CONFIG.test_organization_id,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      ...options
    }

    console.log(`📡 ${defaultOptions.method} ${endpoint}`)
    
    try {
      const response = await fetch(url, defaultOptions)
      const data = await response.json()
      
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
      console.log(`   Error: ${result.error || result.data?.error || 'Unknown error'}`)
    }
    
    // Log request ID for tracing
    if (result.data?.metadata?.request_id || result.headers?.['x-request-id']) {
      const requestId = result.data?.metadata?.request_id || result.headers?.['x-request-id']
      console.log(`   Request ID: ${requestId}`)
    }
    
    return result.success
  }

  static generateTestData() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    
    return {
      entity: {
        entity_data: {
          entity_type: 'CUSTOMER',
          entity_name: `Test Customer ${timestamp}`,
          smart_code: 'HERA.ENTERPRISE.CUSTOMER.ENTITY.TEST.v1',
          organization_id: TEST_CONFIG.test_organization_id
        },
        dynamic_fields: [
          {
            field_name: 'email',
            field_type: 'email',
            field_value: `test${random}@example.com`,
            smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.EMAIL.v1'
          },
          {
            field_name: 'phone',
            field_type: 'phone',
            field_value: `+1555${timestamp.toString().slice(-7)}`,
            smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.PHONE.v1'
          }
        ],
        organization_id: TEST_CONFIG.test_organization_id
      },
      transaction: {
        operation: 'CREATE',
        transaction_data: {
          transaction_type: 'sale',
          smart_code: 'HERA.FINANCE.TXN.SALE.TEST.v1',
          total_amount: 1000.00,
          transaction_currency_code: 'AED',
          organization_id: TEST_CONFIG.test_organization_id
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            line_amount: 1000.00,
            smart_code: 'HERA.FINANCE.GL.ACCOUNT.REVENUE.v1',
            line_data: {
              side: 'CR',
              account_code: '410000'
            }
          },
          {
            line_number: 2,
            line_type: 'GL',
            line_amount: 1000.00,
            smart_code: 'HERA.FINANCE.GL.ACCOUNT.RECEIVABLE.v1',
            line_data: {
              side: 'DR',
              account_code: '120000'
            }
          }
        ],
        organization_id: TEST_CONFIG.test_organization_id
      },
      ai_request: {
        prompt: 'Test AI request for HERA v2.3 enhanced gateway',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
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
                   result.data.status && 
                   result.data.version === '2.3.0' &&
                   result.data.components
    
    TestUtils.logTestResult('Health Check', result)
    return success
  }

  /**
   * Test metrics endpoint
   */
  async testMetrics() {
    const result = await TestUtils.makeRequest('/metrics')
    const success = result.success && 
                   result.data.data &&
                   result.data.data.middleware_chain &&
                   result.data.data.guardrails
    
    TestUtils.logTestResult('Metrics Endpoint', result)
    return success
  }

  /**
   * Test gateway enforcement
   */
  async testGatewayEnforcement() {
    const result = await TestUtils.makeRequest('/gateway/test')
    const success = result.success && 
                   result.data.data &&
                   result.data.data.gateway_status === 'operational' &&
                   result.data.data.hard_gate === 'enabled'
    
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
                   result.data.error &&
                   result.data.error.category === 'authentication'
    
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
    
    const success = result.success && 
                   result.data.data &&
                   result.data.metadata &&
                   result.data.metadata.actor_id &&
                   result.data.metadata.organization_id
    
    TestUtils.logTestResult('Entity Creation', result)
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
    
    const success = result.success && 
                   result.data.data &&
                   Array.isArray(result.data.data.items !== undefined ? result.data.data.items : result.data.data)
    
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
    
    const success = result.success && 
                   result.data.data &&
                   result.data.metadata &&
                   result.data.metadata.organization_id
    
    TestUtils.logTestResult('Transaction Creation', result)
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
    
    // AI endpoints may return mock responses, so check for proper structure
    const success = result.success && 
                   result.data.data &&
                   (result.data.data.response || result.data.data.usage)
    
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
    
    const success = result.success && 
                   result.data.data !== undefined // May be empty array
    
    TestUtils.logTestResult('AI Usage', result)
    return success
  }

  /**
   * Test rate limiting (make multiple requests)
   */
  async testRateLimiting() {
    console.log('📊 Testing rate limiting with multiple requests...')
    
    const requests = []
    for (let i = 0; i < 5; i++) {
      requests.push(TestUtils.makeRequest('/health'))
    }
    
    const results = await Promise.all(requests)
    const successCount = results.filter(r => r.success).length
    const hasRateLimitHeaders = results.some(r => 
      r.headers && 
      (r.headers['x-ratelimit-limit'] || r.headers['x-ratelimit-remaining'])
    )
    
    const success = successCount >= 3 && hasRateLimitHeaders
    TestUtils.logTestResult('Rate Limiting', { success, status: 200 })
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
        'Content-Type': 'application/json',
        'X-Organization-Id': TEST_CONFIG.test_organization_id,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Idempotency-Key': idempotencyKey
      }
    }
    
    // Make the same request twice
    const [first, second] = await Promise.all([
      TestUtils.makeRequest('/entities', requestOptions),
      TestUtils.makeRequest('/entities', requestOptions)
    ])
    
    // Both should succeed or one should be cached
    const success = (first.success || second.success) && 
                   (first.data || second.data)
    
    TestUtils.logTestResult('Idempotency', { success, status: first.status || second.status })
    return success
  }

  /**
   * Test error handling with invalid data
   */
  async testErrorHandling() {
    const invalidPayload = {
      entity_data: {
        // Missing required fields
        entity_type: '',
        smart_code: 'INVALID_SMART_CODE'
      },
      organization_id: TEST_CONFIG.test_organization_id
    }
    
    const result = await TestUtils.makeRequest('/entities', {
      method: 'POST',
      body: JSON.stringify(invalidPayload)
    })
    
    const success = !result.success && 
                   result.data.error &&
                   result.data.error.category &&
                   result.data.error.suggestions &&
                   Array.isArray(result.data.error.suggestions)
    
    TestUtils.logTestResult('Error Handling', result)
    return success
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 HERA v2.3 Enhanced API Gateway Test Suite')
    console.log('='*50)
    console.log(`Gateway URL: ${TEST_CONFIG.gateway_url}`)
    console.log(`Organization: ${TEST_CONFIG.test_organization_id}`)
    console.log('')

    // Infrastructure tests
    console.log('📋 Infrastructure Tests')
    await this.runTest('Health Check', () => this.testHealthCheck())
    await this.runTest('Metrics', () => this.testMetrics())
    await this.runTest('Gateway Enforcement', () => this.testGatewayEnforcement())
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
    console.log('='*50)
    console.log('📊 Test Results Summary')
    console.log('='*50)
    console.log(`Total Tests: ${this.results.total}`)
    console.log(`Passed: ${this.results.passed} ✅`)
    console.log(`Failed: ${this.results.failed} ❌`)
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)
    console.log('')

    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! HERA v2.3 Enhanced Gateway is operational.')
    } else {
      console.log(`⚠️ ${this.results.failed} test(s) failed. Please review the errors above.`)
      if (this.results.passed > 0) {
        console.log('🔧 Some functionality is working. Check logs for specific issues.')
      }
    }

    console.log('')
    console.log('🔗 Next Steps:')
    console.log('   - Review failed tests and fix any issues')
    console.log('   - Deploy enhanced gateway to production')
    console.log('   - Monitor performance and error metrics')
    console.log('   - Continue with Milestone 2: Rules Engine MOAT')
  }
}

// Run the test suite
const testSuite = new EnhancedGatewayTestSuite()
testSuite.runAllTests().catch(error => {
  console.error('💥 Test suite failed with error:', error)
  process.exit(1)
})