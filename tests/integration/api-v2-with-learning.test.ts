import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { apiV2 } from '@/lib/client/fetchV2'
import { createClient } from '@supabase/supabase-js'

// Enhanced API v2 integration tests with learning capabilities
describe('API v2 Integration Tests with Learning', () => {
  let supabase: ReturnType<typeof createClient>
  let testOrgId: string
  let testUserId: string
  let authToken: string
  
  const learningData: TestLearningData = {
    patterns: [],
    successes: [],
    failures: [],
    sessionId: `api-v2-${Date.now()}`
  }

  interface TestLearningData {
    patterns: string[]
    successes: TestSuccess[]
    failures: TestFailure[]
    sessionId: string
  }

  interface TestSuccess {
    test: string
    pattern: string
    responseTime: number
    statusCode: number
  }

  interface TestFailure {
    test: string
    error: string
    pattern: string
    expectedFix: string
  }

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Set up test data
    testOrgId = process.env.TEST_ORGANIZATION_ID || '12345678-1234-1234-1234-123456789012'
    testUserId = process.env.TEST_USER_ID || '87654321-4321-4321-4321-210987654321'
    authToken = process.env.TEST_AUTH_TOKEN || 'mock-jwt-token'

    console.log(`🧪 Starting API v2 learning session: ${learningData.sessionId}`)
  })

  afterEach(async () => {
    await updateLearningData()
  })

  async function updateLearningData() {
    // Update knowledge base with learning from this test session
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const learningFile = path.join('.claude/learning', `api-v2-session-${learningData.sessionId}.json`)
    await fs.writeFile(learningFile, JSON.stringify(learningData, null, 2))
  }

  async function recordSuccess(testName: string, pattern: string, responseTime: number, statusCode: number) {
    learningData.successes.push({
      test: testName,
      pattern,
      responseTime,
      statusCode
    })
    
    if (!learningData.patterns.includes(pattern)) {
      learningData.patterns.push(pattern)
    }
  }

  async function recordFailure(testName: string, error: string, pattern: string, expectedFix: string) {
    learningData.failures.push({
      test: testName,
      error,
      pattern,
      expectedFix
    })
  }

  describe('Authentication & Authorization Flow', () => {
    it('rejects missing JWT token (401)', async () => {
      const testName = 'missing_jwt_401'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': testOrgId
          },
          body: JSON.stringify({ entity_type: 'test' })
        })
        
        const responseTime = Date.now() - startTime
        
        expect(response.status).toBe(401)
        await recordSuccess(testName, 'auth_rejection', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'auth_rejection', 'Ensure API v2 gateway validates JWT tokens')
        throw error
      }
    })

    it('rejects missing organization header (400)', async () => {
      const testName = 'missing_org_header_400'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ entity_type: 'test' })
        })
        
        const responseTime = Date.now() - startTime
        
        expect(response.status).toBe(400)
        await recordSuccess(testName, 'org_context_validation', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'org_context_validation', 'Ensure API v2 gateway requires X-Organization-Id header')
        throw error
      }
    })

    it('rejects non-member access (403)', async () => {
      const testName = 'non_member_403'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Organization-Id': '00000000-0000-0000-0000-000000000000' // Different org
          },
          body: JSON.stringify({ entity_type: 'test' })
        })
        
        const responseTime = Date.now() - startTime
        
        expect(response.status).toBe(403)
        await recordSuccess(testName, 'membership_validation', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'membership_validation', 'Ensure API v2 gateway validates organization membership')
        throw error
      }
    })
  })

  describe('Actor Resolution & Stamping', () => {
    it('resolves actor identity correctly', async () => {
      const testName = 'actor_resolution'
      const startTime = Date.now()
      
      try {
        // Test actor resolution via resolve_user_identity_v1
        const { data, error } = await supabase.rpc('resolve_user_identity_v1', {
          p_auth_uid: testUserId
        })
        
        const responseTime = Date.now() - startTime
        
        expect(error).toBeNull()
        expect(data).toHaveProperty('user_entity_id')
        expect(data.user_entity_id).toBeTruthy()
        
        await recordSuccess(testName, 'actor_resolution', responseTime, 200)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'actor_resolution', 'Ensure resolve_user_identity_v1 function exists and works correctly')
        throw error
      }
    })

    it('stamps actor on entity creation', async () => {
      const testName = 'actor_stamping_entities'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Organization-Id': testOrgId
          },
          body: JSON.stringify({
            operation: 'CREATE',
            entity_type: 'test_entity',
            smart_code: 'HERA.TEST.ENTITY.AUTOPILOT.LEARNING.v1',
            organization_id: testOrgId,
            entity_data: {
              entity_name: 'Test Entity for Learning',
              entity_type: 'test_entity'
            }
          })
        })
        
        const responseTime = Date.now() - startTime
        const responseData = await response.json()
        
        expect(response.status).toBe(200)
        expect(responseData).toHaveProperty('actor')
        expect(responseData.actor).toBeTruthy()
        
        await recordSuccess(testName, 'actor_stamping', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'actor_stamping', 'Ensure API v2 gateway stamps actor on all write operations')
        throw error
      }
    })
  })

  describe('Guardrails Validation', () => {
    it('validates Smart Code patterns', async () => {
      const testName = 'smart_code_validation'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Organization-Id': testOrgId
          },
          body: JSON.stringify({
            operation: 'CREATE',
            entity_type: 'test_entity',
            smart_code: 'invalid-smart-code', // Invalid format
            organization_id: testOrgId,
            entity_data: {
              entity_name: 'Test Entity',
              entity_type: 'test_entity'
            }
          })
        })
        
        const responseTime = Date.now() - startTime
        const responseData = await response.json()
        
        expect(response.status).toBe(400)
        expect(responseData.error).toContain('guardrail_violation')
        expect(responseData.error).toContain('SMARTCODE_REGEX_FAIL')
        
        await recordSuccess(testName, 'smart_code_validation', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'smart_code_validation', 'Ensure API v2 gateway validates Smart Code patterns')
        throw error
      }
    })

    it('validates organization filtering', async () => {
      const testName = 'org_filtering_validation'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Organization-Id': testOrgId
          },
          body: JSON.stringify({
            operation: 'CREATE',
            entity_type: 'test_entity',
            smart_code: 'HERA.TEST.ENTITY.ORG.MISMATCH.v1',
            organization_id: '00000000-0000-0000-0000-000000000000', // Different org
            entity_data: {
              entity_name: 'Test Entity',
              entity_type: 'test_entity'
            }
          })
        })
        
        const responseTime = Date.now() - startTime
        const responseData = await response.json()
        
        expect(response.status).toBe(400)
        expect(responseData.error).toContain('guardrail_violation')
        expect(responseData.error).toContain('ORG_FILTER_MISMATCH')
        
        await recordSuccess(testName, 'org_filtering', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'org_filtering', 'Ensure API v2 gateway validates organization ID consistency')
        throw error
      }
    })

    it('validates GL balance for transactions', async () => {
      const testName = 'gl_balance_validation'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Organization-Id': testOrgId
          },
          body: JSON.stringify({
            operation: 'CREATE',
            smart_code: 'HERA.TEST.TXN.GL.UNBALANCED.v1',
            organization_id: testOrgId,
            transaction_data: {
              transaction_type: 'test_transaction',
              total_amount: 1000.00
            },
            lines: [
              {
                line_number: 1,
                line_type: 'GL',
                smart_code: 'HERA.TEST.GL.DEBIT.v1',
                line_amount: 1000.00,
                line_data: { side: 'DR', account: '1001' }
              },
              {
                line_number: 2,
                line_type: 'GL',
                smart_code: 'HERA.TEST.GL.CREDIT.v1',
                line_amount: 500.00, // Unbalanced!
                line_data: { side: 'CR', account: '2001' }
              }
            ]
          })
        })
        
        const responseTime = Date.now() - startTime
        const responseData = await response.json()
        
        expect(response.status).toBe(400)
        expect(responseData.error).toContain('guardrail_violation')
        expect(responseData.error).toContain('GL_NOT_BALANCED')
        
        await recordSuccess(testName, 'gl_balance_validation', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'gl_balance_validation', 'Ensure API v2 gateway validates GL balance per currency')
        throw error
      }
    })
  })

  describe('Performance & Reliability', () => {
    it('responds within performance SLA', async () => {
      const testName = 'performance_sla'
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v2/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Organization-Id': testOrgId
          },
          body: JSON.stringify({
            operation: 'READ',
            entity_type: 'test_entity',
            organization_id: testOrgId,
            options: { limit: 10 }
          })
        })
        
        const responseTime = Date.now() - startTime
        
        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(200) // p99 < 200ms SLA
        
        await recordSuccess(testName, 'performance_sla', responseTime, response.status)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'performance_sla', 'Optimize API v2 gateway performance or database queries')
        throw error
      }
    })

    it('handles concurrent requests safely', async () => {
      const testName = 'concurrent_safety'
      const startTime = Date.now()
      
      try {
        const requests = Array.from({ length: 10 }, (_, i) =>
          fetch('/api/v2/entities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'X-Organization-Id': testOrgId
            },
            body: JSON.stringify({
              operation: 'CREATE',
              entity_type: 'concurrent_test',
              smart_code: `HERA.TEST.CONCURRENT.ENTITY.${i}.v1`,
              organization_id: testOrgId,
              entity_data: {
                entity_name: `Concurrent Test Entity ${i}`,
                entity_type: 'concurrent_test'
              }
            })
          })
        )
        
        const responses = await Promise.all(requests)
        const responseTime = Date.now() - startTime
        
        // All requests should succeed
        for (const response of responses) {
          expect(response.status).toBe(200)
        }
        
        await recordSuccess(testName, 'concurrent_safety', responseTime, 200)
        
      } catch (error) {
        await recordFailure(testName, String(error), 'concurrent_safety', 'Ensure API v2 gateway handles concurrent requests safely')
        throw error
      }
    })
  })

  describe('Learning Validation', () => {
    it('accumulates learning data correctly', () => {
      expect(learningData.sessionId).toBeDefined()
      expect(learningData.patterns.length).toBeGreaterThan(0)
      
      // Should have recorded both successes and pattern validations
      expect(learningData.successes.length).toBeGreaterThan(0)
      
      // Common patterns we should have learned
      const expectedPatterns = [
        'auth_rejection',
        'org_context_validation', 
        'membership_validation',
        'actor_resolution',
        'actor_stamping',
        'smart_code_validation',
        'org_filtering',
        'gl_balance_validation',
        'performance_sla',
        'concurrent_safety'
      ]
      
      const learnedPatterns = new Set(learningData.patterns)
      for (const pattern of expectedPatterns) {
        expect(learnedPatterns.has(pattern)).toBe(true)
      }
    })

    it('tracks performance metrics for learning', () => {
      const performanceSuccesses = learningData.successes.filter(s => s.responseTime > 0)
      expect(performanceSuccesses.length).toBeGreaterThan(0)
      
      // Calculate average response time
      const avgResponseTime = performanceSuccesses.reduce((sum, s) => sum + s.responseTime, 0) / performanceSuccesses.length
      expect(avgResponseTime).toBeLessThan(500) // Should be fast overall
      
      console.log(`📊 Average API v2 response time: ${avgResponseTime.toFixed(1)}ms`)
    })
  })
})