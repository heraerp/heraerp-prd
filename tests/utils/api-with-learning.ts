import { createClient } from '@supabase/supabase-js'

// Enhanced API testing utilities with learning capabilities
export interface APITestConfig {
  token?: string
  organizationId?: string
  baseUrl?: string
  learningEnabled?: boolean
  sessionId?: string
}

export interface APITestResult {
  success: boolean
  statusCode: number
  responseTime: number
  data?: any
  error?: string
  learningData?: {
    pattern: string
    expectedFix?: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
}

export interface APILearningContext {
  sessionId: string
  testName: string
  patterns: string[]
  successes: number
  failures: number
  avgResponseTime: number
}

class APITestHelper {
  private config: APITestConfig
  private learningContext: APILearningContext

  constructor(config: APITestConfig = {}) {
    this.config = {
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      learningEnabled: config.learningEnabled ?? true,
      sessionId: config.sessionId || `api-test-${Date.now()}`,
      ...config
    }

    this.learningContext = {
      sessionId: this.config.sessionId!,
      testName: '',
      patterns: [],
      successes: 0,
      failures: 0,
      avgResponseTime: 0
    }
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<APITestResult> {
    const startTime = Date.now()
    const url = `${this.config.baseUrl}${endpoint}`

    try {
      // Add default headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // Add authentication if available
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }

      // Add organization context if available
      if (this.config.organizationId) {
        headers['X-Organization-Id'] = this.config.organizationId
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      const responseTime = Date.now() - startTime
      let data: any

      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }

      const result: APITestResult = {
        success: response.ok,
        statusCode: response.status,
        responseTime,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data?.error || `HTTP ${response.status}`)
      }

      // Add learning data for failures
      if (!response.ok && this.config.learningEnabled) {
        result.learningData = this.analyzeFillure(response.status, data, endpoint)
      }

      // Update learning context
      this.updateLearningContext(result)

      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: APITestResult = {
        success: false,
        statusCode: 0,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      }

      // Add learning data for network errors
      if (this.config.learningEnabled) {
        result.learningData = {
          pattern: 'network_error',
          expectedFix: 'Check network connectivity and service availability',
          severity: 'HIGH'
        }
      }

      this.updateLearningContext(result)
      return result
    }
  }

  private analyzeFillure(statusCode: number, data: any, endpoint: string): APITestResult['learningData'] {
    let pattern: string
    let expectedFix: string
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'

    switch (statusCode) {
      case 401:
        pattern = 'auth_failure'
        expectedFix = 'Check JWT token validity and authentication setup'
        severity = 'HIGH'
        break
      case 403:
        pattern = 'authorization_failure'
        expectedFix = 'Verify user permissions and organization membership'
        severity = 'HIGH'
        break
      case 400:
        if (data?.error?.includes('guardrail_violation')) {
          pattern = 'guardrail_violation'
          expectedFix = 'Fix guardrail violations: ' + data.error
          severity = 'CRITICAL'
        } else if (data?.error?.includes('organization')) {
          pattern = 'org_context_missing'
          expectedFix = 'Add X-Organization-Id header with valid organization UUID'
          severity = 'HIGH'
        } else {
          pattern = 'bad_request'
          expectedFix = 'Validate request payload and parameters'
          severity = 'MEDIUM'
        }
        break
      case 404:
        pattern = 'endpoint_not_found'
        expectedFix = 'Check API endpoint path and method'
        severity = 'MEDIUM'
        break
      case 429:
        pattern = 'rate_limit_exceeded'
        expectedFix = 'Implement request throttling and retry logic'
        severity = 'LOW'
        break
      case 500:
        pattern = 'server_error'
        expectedFix = 'Investigate server-side error and fix implementation'
        severity = 'CRITICAL'
        break
      default:
        pattern = `http_${statusCode}`
        expectedFix = `Handle HTTP ${statusCode} response appropriately`
        severity = 'MEDIUM'
    }

    return { pattern, expectedFix, severity }
  }

  private updateLearningContext(result: APITestResult): void {
    if (result.success) {
      this.learningContext.successes++
    } else {
      this.learningContext.failures++
      if (result.learningData) {
        this.learningContext.patterns.push(result.learningData.pattern)
      }
    }

    // Update average response time
    const totalRequests = this.learningContext.successes + this.learningContext.failures
    this.learningContext.avgResponseTime = 
      (this.learningContext.avgResponseTime * (totalRequests - 1) + result.responseTime) / totalRequests
  }

  // Helper methods for common test scenarios
  async testAuth(token: string): Promise<APITestResult> {
    return this.request('/api/v2/entities', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        operation: 'READ',
        entity_type: 'test_auth',
        organization_id: this.config.organizationId
      })
    })
  }

  async testOrgContext(orgId: string): Promise<APITestResult> {
    return this.request('/api/v2/entities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'X-Organization-Id': orgId
      },
      body: JSON.stringify({
        operation: 'READ',
        entity_type: 'test_org',
        organization_id: orgId
      })
    })
  }

  async testSmartCodeValidation(invalidSmartCode: string): Promise<APITestResult> {
    return this.request('/api/v2/entities', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'CREATE',
        entity_type: 'test_entity',
        smart_code: invalidSmartCode,
        organization_id: this.config.organizationId,
        entity_data: {
          entity_name: 'Test Entity',
          entity_type: 'test_entity'
        }
      })
    })
  }

  async testGLBalance(unbalancedLines: any[]): Promise<APITestResult> {
    return this.request('/api/v2/transactions', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'CREATE',
        smart_code: 'HERA.TEST.TXN.GL.UNBALANCED.v1',
        organization_id: this.config.organizationId,
        transaction_data: {
          transaction_type: 'test_transaction',
          total_amount: 1000.00
        },
        lines: unbalancedLines
      })
    })
  }

  async testConcurrentRequests(requestCount: number): Promise<APITestResult[]> {
    const requests = Array.from({ length: requestCount }, (_, i) =>
      this.request('/api/v2/entities', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'CREATE',
          entity_type: 'concurrent_test',
          smart_code: `HERA.TEST.CONCURRENT.ENTITY.${i}.v1`,
          organization_id: this.config.organizationId,
          entity_data: {
            entity_name: `Concurrent Test Entity ${i}`,
            entity_type: 'concurrent_test'
          }
        })
      })
    )

    return Promise.all(requests)
  }

  async testPerformance(endpoint: string, options: RequestInit = {}): Promise<{
    result: APITestResult
    performanceMetrics: {
      responseTime: number
      throughput: number
      memoryUsage?: number
    }
  }> {
    const startTime = performance.now()
    const result = await this.request(endpoint, options)
    const endTime = performance.now()

    const performanceMetrics = {
      responseTime: endTime - startTime,
      throughput: 1000 / (endTime - startTime), // requests per second
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    }

    return { result, performanceMetrics }
  }

  // Learning data export
  getLearningContext(): APILearningContext {
    return { ...this.learningContext }
  }

  exportLearningData(): {
    sessionId: string
    summary: {
      totalRequests: number
      successRate: number
      avgResponseTime: number
      commonPatterns: string[]
    }
    patterns: { [pattern: string]: number }
    recommendations: string[]
  } {
    const totalRequests = this.learningContext.successes + this.learningContext.failures
    const successRate = totalRequests > 0 ? this.learningContext.successes / totalRequests : 0

    // Count pattern frequencies
    const patterns: { [pattern: string]: number } = {}
    this.learningContext.patterns.forEach(pattern => {
      patterns[pattern] = (patterns[pattern] || 0) + 1
    })

    // Generate recommendations based on patterns
    const recommendations: string[] = []
    if (patterns['auth_failure']) {
      recommendations.push('Implement robust JWT token refresh mechanism')
    }
    if (patterns['guardrail_violation']) {
      recommendations.push('Add client-side validation for guardrail compliance')
    }
    if (patterns['rate_limit_exceeded']) {
      recommendations.push('Implement exponential backoff for rate-limited requests')
    }
    if (this.learningContext.avgResponseTime > 1000) {
      recommendations.push('Optimize API performance - average response time exceeds 1 second')
    }

    return {
      sessionId: this.learningContext.sessionId,
      summary: {
        totalRequests,
        successRate,
        avgResponseTime: this.learningContext.avgResponseTime,
        commonPatterns: Object.keys(patterns).sort((a, b) => patterns[b] - patterns[a]).slice(0, 5)
      },
      patterns,
      recommendations
    }
  }
}

// Database testing utilities
export class DatabaseTestHelper {
  private supabase: ReturnType<typeof createClient>
  private learningEnabled: boolean

  constructor(config: { learningEnabled?: boolean } = {}) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.learningEnabled = config.learningEnabled ?? true
  }

  async testRLSIsolation(userAToken: string, userBToken: string, orgA: string, orgB: string): Promise<{
    isolation: boolean
    violations: Array<{
      table: string
      operation: string
      expectedRows: number
      actualRows: number
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    }>
  }> {
    const violations: any[] = []

    // Test cross-tenant read isolation
    const userAClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { 'Authorization': `Bearer ${userAToken}` } }
    })

    const { data: crossTenantData } = await userAClient
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgB) // User A trying to read User B's data

    if (crossTenantData && crossTenantData.length > 0) {
      violations.push({
        table: 'core_entities',
        operation: 'read',
        expectedRows: 0,
        actualRows: crossTenantData.length,
        severity: 'CRITICAL'
      })
    }

    return {
      isolation: violations.length === 0,
      violations
    }
  }

  async testActorStamping(table: string): Promise<{
    coverage: number
    violations: Array<{
      id: string
      missingFields: string[]
    }>
  }> {
    const { data, error } = await this.supabase
      .from(table)
      .select('id, created_by, updated_by')
      .limit(1000)

    if (error) throw error

    const violations: any[] = []
    let covered = 0

    data?.forEach(row => {
      const missing: string[] = []
      if (!row.created_by) missing.push('created_by')
      if (!row.updated_by) missing.push('updated_by')

      if (missing.length > 0) {
        violations.push({ id: row.id, missingFields: missing })
      } else {
        covered++
      }
    })

    const coverage = data ? covered / data.length : 0

    return { coverage, violations }
  }

  async testSmartCodeCompliance(table: string): Promise<{
    compliance: number
    violations: Array<{
      id: string
      smartCode: string | null
      issue: string
    }>
  }> {
    const smartCodeRegex = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
    
    const { data, error } = await this.supabase
      .from(table)
      .select('id, smart_code')
      .limit(1000)

    if (error) throw error

    const violations: any[] = []
    let compliant = 0

    data?.forEach(row => {
      if (!row.smart_code) {
        violations.push({
          id: row.id,
          smartCode: null,
          issue: 'Missing smart code'
        })
      } else if (!smartCodeRegex.test(row.smart_code)) {
        violations.push({
          id: row.id,
          smartCode: row.smart_code,
          issue: 'Invalid smart code pattern'
        })
      } else {
        compliant++
      }
    })

    const compliance = data ? compliant / data.length : 0

    return { compliance, violations }
  }
}

// Export helper instances
export const apiTest = (config?: APITestConfig) => new APITestHelper(config)
export const dbTest = (config?: { learningEnabled?: boolean }) => new DatabaseTestHelper(config)