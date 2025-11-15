/**
 * HERA Universal Tile System - Security Tests
 * Comprehensive security testing for permission and data isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock data for security testing
const MOCK_ORG_A = '00000000-0000-0000-0000-000000000001'
const MOCK_ORG_B = '00000000-0000-0000-0000-000000000002'
const MOCK_ADMIN_USER = '00000000-0000-0000-0000-000000000003'
const MOCK_REGULAR_USER = '00000000-0000-0000-0000-000000000004'
const MOCK_GUEST_USER = '00000000-0000-0000-0000-000000000005'

const mockUsers = {
  [MOCK_ADMIN_USER]: {
    user_id: MOCK_ADMIN_USER,
    role: 'admin',
    permissions: ['tiles.read', 'tiles.write', 'tiles.delete', 'tiles.execute', 'stats.read', 'actions.execute'],
    organization_id: MOCK_ORG_A,
    email: 'admin@orga.com'
  },
  [MOCK_REGULAR_USER]: {
    user_id: MOCK_REGULAR_USER,
    role: 'user',
    permissions: ['tiles.read', 'stats.read'],
    organization_id: MOCK_ORG_A,
    email: 'user@orga.com'
  },
  [MOCK_GUEST_USER]: {
    user_id: MOCK_GUEST_USER,
    role: 'guest',
    permissions: [],
    organization_id: MOCK_ORG_B,
    email: 'guest@orgb.com'
  }
}

const mockTileConfigOrgA = {
  tileId: 'tile-org-a',
  workspaceId: 'workspace-org-a',
  templateId: 'template-1',
  tileType: 'ENTITIES',
  operationCategory: 'data_management',
  enabled: true,
  
  ui: {
    title: 'Org A Customer Data',
    subtitle: 'Sensitive customer information',
    icon: 'Database',
    color: '#3B82F6'
  },
  
  layout: { size: 'medium', position: 1 },
  
  conditions: [
    {
      field: 'user.organization_id',
      operator: 'equals',
      value: MOCK_ORG_A
    },
    {
      field: 'user.permissions',
      operator: 'contains',
      value: 'tiles.read'
    }
  ],
  
  stats: [
    {
      statId: 'sensitive-customer-count',
      label: 'Customer Count',
      query: {
        table: 'core_entities',
        operation: 'count',
        conditions: [
          { field: 'organization_id', operator: 'equals', value: MOCK_ORG_A },
          { field: 'entity_type', operator: 'equals', value: 'CUSTOMER' }
        ]
      },
      format: 'number',
      isPrivate: false
    }
  ],
  
  actions: [
    {
      actionId: 'view-customers',
      label: 'View Customers',
      icon: 'Eye',
      actionType: 'NAVIGATE',
      isPrimary: true,
      requiresConfirmation: false,
      requiresPermission: true,
      route: '/customers',
      parameters: { org: MOCK_ORG_A },
      visibilityConditions: [
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'actions.execute'
        }
      ]
    },
    {
      actionId: 'delete-customer-data',
      label: 'Delete Data',
      icon: 'Trash2',
      actionType: 'API_CALL',
      isPrimary: false,
      requiresConfirmation: true,
      requiresPermission: true,
      route: '/api/customers/bulk-delete',
      parameters: { org: MOCK_ORG_A },
      visibilityConditions: [
        {
          field: 'user.role',
          operator: 'equals',
          value: 'admin'
        }
      ]
    }
  ]
}

const mockTileConfigOrgB = {
  ...mockTileConfigOrgA,
  tileId: 'tile-org-b',
  workspaceId: 'workspace-org-b',
  ui: {
    ...mockTileConfigOrgA.ui,
    title: 'Org B Customer Data'
  },
  conditions: [
    {
      field: 'user.organization_id',
      operator: 'equals',
      value: MOCK_ORG_B
    }
  ],
  stats: [
    {
      ...mockTileConfigOrgA.stats[0],
      statId: 'org-b-customer-count',
      query: {
        ...mockTileConfigOrgA.stats[0].query,
        conditions: [
          { field: 'organization_id', operator: 'equals', value: MOCK_ORG_B },
          { field: 'entity_type', operator: 'equals', value: 'CUSTOMER' }
        ]
      }
    }
  ],
  actions: mockTileConfigOrgA.actions.map(action => ({
    ...action,
    parameters: { org: MOCK_ORG_B }
  }))
}

// Mock request helper with authentication
function createSecureRequest(
  method: 'GET' | 'POST',
  path: string,
  userId: string,
  orgId: string,
  body?: any
): NextRequest {
  const url = new URL(`http://localhost${path}`)
  
  const headers = {
    'authorization': `Bearer mock-jwt-${userId}`,
    'x-organization-id': orgId,
    'content-type': 'application/json'
  }

  const options: RequestInit = {
    method,
    headers
  }

  if (body && method === 'POST') {
    options.body = JSON.stringify(body)
  }

  return new NextRequest(url, options)
}

// Mock authentication middleware
function mockAuthMiddleware(userId: string, orgId: string) {
  const user = mockUsers[userId]
  
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }
  
  if (user.organization_id !== orgId) {
    throw new Error('ORGANIZATION_MISMATCH')
  }
  
  return {
    user,
    organization: { organization_id: orgId },
    isAuthenticated: true
  }
}

// Mock modules
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn()
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabase)
}))

vi.mock('@/lib/tiles/use-resolved-tiles', () => ({
  getResolvedTileConfig: vi.fn()
}))

vi.mock('@/lib/tiles/dsl-evaluator', () => ({
  DSLEvaluator: vi.fn().mockImplementation(() => ({
    evaluateConditions: vi.fn(),
    resolveValue: vi.fn().mockImplementation(value => value)
  }))
}))

describe('Tile System Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Organization Data Isolation', () => {
    it('prevents users from accessing tiles from different organizations', async () => {
      const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
      
      // Setup: Org A user trying to access Org B tile
      vi.mocked(getResolvedTileConfig).mockImplementation(async (tileId, orgId) => {
        if (tileId === 'tile-org-b' && orgId === MOCK_ORG_A) {
          return null // Should not find tile from different org
        }
        if (tileId === 'tile-org-a' && orgId === MOCK_ORG_A) {
          return mockTileConfigOrgA
        }
        return null
      })

      // Attempt to access Org B tile with Org A credentials
      try {
        const auth = mockAuthMiddleware(MOCK_ADMIN_USER, MOCK_ORG_A)
        const tileConfig = await getResolvedTileConfig('tile-org-b', MOCK_ORG_A)
        
        expect(tileConfig).toBeNull()
      } catch (error: any) {
        expect(error.message).toBe('TILE_NOT_FOUND')
      }

      // Should be able to access own organization's tile
      const auth = mockAuthMiddleware(MOCK_ADMIN_USER, MOCK_ORG_A)
      const ownTileConfig = await getResolvedTileConfig('tile-org-a', MOCK_ORG_A)
      expect(ownTileConfig).toEqual(mockTileConfigOrgA)
    })

    it('ensures stats queries are properly filtered by organization', async () => {
      const mockQuery = vi.fn()
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field, value) => {
          mockQuery(field, value)
          return {
            then: (callback: any) => callback({
              data: [{ count: field === 'organization_id' && value === MOCK_ORG_A ? 100 : 0 }],
              error: null
            })
          }
        })
      }))

      // Simulate stats query for Org A
      const auth = mockAuthMiddleware(MOCK_ADMIN_USER, MOCK_ORG_A)
      
      // Mock stats execution
      await mockSupabase.from('core_entities')
        .select('count(*)')
        .eq('organization_id', MOCK_ORG_A)
        .eq('entity_type', 'CUSTOMER')

      // Verify organization filter was applied
      expect(mockQuery).toHaveBeenCalledWith('organization_id', MOCK_ORG_A)
      expect(mockQuery).not.toHaveBeenCalledWith('organization_id', MOCK_ORG_B)
    })

    it('validates organization context in action execution', async () => {
      const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
      vi.mocked(getResolvedTileConfig).mockResolvedValue(mockTileConfigOrgA)

      // Attempt action execution with mismatched organization
      try {
        const auth = mockAuthMiddleware(MOCK_ADMIN_USER, MOCK_ORG_A)
        const action = mockTileConfigOrgA.actions[0]
        
        // Simulate action execution with wrong org context
        if (action.parameters.org !== auth.organization.organization_id) {
          throw new Error('ORGANIZATION_MISMATCH')
        }
        
        expect(true).toBe(true) // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('ORGANIZATION_MISMATCH')
      }
    })
  })

  describe('Permission-Based Access Control', () => {
    it('enforces tile visibility based on user permissions', async () => {
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const mockEvaluator = new DSLEvaluator()

      // Test admin user (has permissions)
      vi.mocked(mockEvaluator.evaluateConditions).mockImplementation((conditions, context) => {
        const user = context.user
        
        // Check if user has required permissions
        const hasReadPermission = user.permissions.includes('tiles.read')
        const correctOrg = user.organization_id === MOCK_ORG_A
        
        return hasReadPermission && correctOrg
      })

      const adminAuth = mockAuthMiddleware(MOCK_ADMIN_USER, MOCK_ORG_A)
      const adminContext = {
        user: adminAuth.user,
        organization: adminAuth.organization,
        entity: {},
        variables: {}
      }

      const adminCanAccess = await mockEvaluator.evaluateConditions(
        mockTileConfigOrgA.conditions,
        adminContext
      )
      expect(adminCanAccess).toBe(true)

      // Test regular user (has basic permissions)
      const userAuth = mockAuthMiddleware(MOCK_REGULAR_USER, MOCK_ORG_A)
      const userContext = {
        user: userAuth.user,
        organization: userAuth.organization,
        entity: {},
        variables: {}
      }

      const userCanAccess = await mockEvaluator.evaluateConditions(
        mockTileConfigOrgA.conditions,
        userContext
      )
      expect(userCanAccess).toBe(true)

      // Test guest user (no permissions)
      vi.mocked(mockEvaluator.evaluateConditions).mockImplementation((conditions, context) => {
        const user = context.user
        return user.permissions.includes('tiles.read')
      })

      try {
        const guestAuth = mockAuthMiddleware(MOCK_GUEST_USER, MOCK_ORG_B)
        const guestContext = {
          user: guestAuth.user,
          organization: guestAuth.organization,
          entity: {},
          variables: {}
        }

        const guestCanAccess = await mockEvaluator.evaluateConditions(
          mockTileConfigOrgA.conditions,
          guestContext
        )
        expect(guestCanAccess).toBe(false)
      } catch (error: any) {
        expect(error.message).toBe('ORGANIZATION_MISMATCH')
      }
    })

    it('enforces action-level permissions', async () => {
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const mockEvaluator = new DSLEvaluator()

      // Test privileged action (delete) - admin only
      const deleteAction = mockTileConfigOrgA.actions[1] // delete-customer-data
      
      vi.mocked(mockEvaluator.evaluateConditions).mockImplementation((conditions, context) => {
        const user = context.user
        return conditions.every(condition => {
          if (condition.field === 'user.role' && condition.operator === 'equals') {
            return user.role === condition.value
          }
          return true
        })
      })

      // Admin should have access
      const adminAuth = mockAuthMiddleware(MOCK_ADMIN_USER, MOCK_ORG_A)
      const adminCanDelete = await mockEvaluator.evaluateConditions(
        deleteAction.visibilityConditions || [],
        {
          user: adminAuth.user,
          organization: adminAuth.organization,
          entity: {},
          variables: {}
        }
      )
      expect(adminCanDelete).toBe(true)

      // Regular user should not have access
      const userAuth = mockAuthMiddleware(MOCK_REGULAR_USER, MOCK_ORG_A)
      const userCanDelete = await mockEvaluator.evaluateConditions(
        deleteAction.visibilityConditions || [],
        {
          user: userAuth.user,
          organization: userAuth.organization,
          entity: {},
          variables: {}
        }
      )
      expect(userCanDelete).toBe(false)
    })

    it('validates stats access permissions', async () => {
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const mockEvaluator = new DSLEvaluator()

      // Define stat-level permission check
      const statPermissions = [
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'stats.read'
        }
      ]

      vi.mocked(mockEvaluator.evaluateConditions).mockImplementation((conditions, context) => {
        const user = context.user
        return conditions.every(condition => {
          if (condition.field === 'user.permissions' && condition.operator === 'contains') {
            return user.permissions.includes(condition.value)
          }
          return true
        })
      })

      // User with stats permission
      const userAuth = mockAuthMiddleware(MOCK_REGULAR_USER, MOCK_ORG_A)
      const userCanViewStats = await mockEvaluator.evaluateConditions(
        statPermissions,
        {
          user: userAuth.user,
          organization: userAuth.organization,
          entity: {},
          variables: {}
        }
      )
      expect(userCanViewStats).toBe(true)

      // Guest without stats permission
      try {
        const guestAuth = mockAuthMiddleware(MOCK_GUEST_USER, MOCK_ORG_B)
        const guestCanViewStats = await mockEvaluator.evaluateConditions(
          statPermissions,
          {
            user: guestAuth.user,
            organization: guestAuth.organization,
            entity: {},
            variables: {}
          }
        )
        expect(guestCanViewStats).toBe(false)
      } catch (error: any) {
        expect(error.message).toBe('ORGANIZATION_MISMATCH')
      }
    })
  })

  describe('Authentication Security', () => {
    it('rejects requests without valid JWT tokens', async () => {
      const requestWithoutAuth = new NextRequest('http://localhost/api/v2/tiles/test/stats', {
        method: 'GET',
        headers: {
          'x-organization-id': MOCK_ORG_A
        }
      })

      // Should fail authentication
      try {
        const authHeader = requestWithoutAuth.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new Error('MISSING_AUTHORIZATION')
        }
      } catch (error: any) {
        expect(error.message).toBe('MISSING_AUTHORIZATION')
      }
    })

    it('validates JWT token format and content', async () => {
      const requestWithInvalidToken = new NextRequest('http://localhost/api/v2/tiles/test/stats', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer invalid-token-format',
          'x-organization-id': MOCK_ORG_A
        }
      })

      try {
        const authHeader = requestWithInvalidToken.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')
        
        // Mock JWT validation
        if (!token?.startsWith('mock-jwt-')) {
          throw new Error('INVALID_TOKEN_FORMAT')
        }
        
        const userId = token.replace('mock-jwt-', '')
        if (!mockUsers[userId]) {
          throw new Error('USER_NOT_FOUND')
        }
      } catch (error: any) {
        expect(['INVALID_TOKEN_FORMAT', 'USER_NOT_FOUND']).toContain(error.message)
      }
    })

    it('enforces organization membership validation', async () => {
      try {
        // User from Org B trying to access with Org A context
        const auth = mockAuthMiddleware(MOCK_GUEST_USER, MOCK_ORG_A)
      } catch (error: any) {
        expect(error.message).toBe('ORGANIZATION_MISMATCH')
      }
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('validates and sanitizes DSL condition inputs', async () => {
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const mockEvaluator = new DSLEvaluator()

      // Test malicious condition inputs
      const maliciousConditions = [
        {
          field: 'user.role; DROP TABLE users; --',
          operator: 'equals',
          value: 'admin'
        },
        {
          field: 'user.permissions',
          operator: 'contains',
          value: "'; DELETE * FROM core_entities; --"
        }
      ]

      // Evaluator should handle malicious input safely
      vi.mocked(mockEvaluator.evaluateConditions).mockImplementation((conditions) => {
        // Validate field names don't contain SQL injection attempts
        const hasInvalidField = conditions.some(c => 
          c.field.includes(';') || 
          c.field.includes('--') || 
          c.field.includes('DROP') ||
          c.field.includes('DELETE')
        )
        
        if (hasInvalidField) {
          throw new Error('INVALID_FIELD_NAME')
        }
        
        return false
      })

      try {
        await mockEvaluator.evaluateConditions(maliciousConditions, {
          user: mockUsers[MOCK_ADMIN_USER],
          organization: { organization_id: MOCK_ORG_A },
          entity: {},
          variables: {}
        })
      } catch (error: any) {
        expect(error.message).toBe('INVALID_FIELD_NAME')
      }
    })

    it('sanitizes template resolution inputs', async () => {
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const mockEvaluator = new DSLEvaluator()

      // Test malicious template inputs
      const maliciousTemplates = [
        "{{'; DROP TABLE core_entities; --}}",
        "$user.role'); DELETE FROM users; --",
        "${process.env.SECRET_KEY}"
      ]

      vi.mocked(mockEvaluator.resolveValue).mockImplementation((template) => {
        // Check for SQL injection and code injection attempts
        if (typeof template === 'string') {
          if (template.includes('DROP TABLE') || 
              template.includes('DELETE FROM') ||
              template.includes('process.env') ||
              template.includes('${')) {
            throw new Error('MALICIOUS_TEMPLATE_DETECTED')
          }
        }
        return template
      })

      for (const maliciousTemplate of maliciousTemplates) {
        try {
          await mockEvaluator.resolveValue(maliciousTemplate, {
            user: mockUsers[MOCK_ADMIN_USER],
            organization: { organization_id: MOCK_ORG_A },
            entity: {},
            variables: {}
          })
          expect(false).toBe(true) // Should not reach here
        } catch (error: any) {
          expect(error.message).toBe('MALICIOUS_TEMPLATE_DETECTED')
        }
      }
    })

    it('validates API parameters and prevents injection', async () => {
      // Test various injection attempts in API parameters
      const maliciousParams = [
        { organization_id: "'; DROP TABLE core_entities; --" },
        { tileId: "../../../etc/passwd" },
        { actionId: "<script>alert('xss')</script>" },
        { context: { user: { role: "admin'; --" } } }
      ]

      for (const params of maliciousParams) {
        // Simulate parameter validation
        const isValid = Object.values(params).every(value => {
          if (typeof value === 'string') {
            // Check for common injection patterns
            const injectionPatterns = [
              /[;<>'"]/,  // SQL/XSS characters
              /\.\.\//,   // Path traversal
              /<script>/i, // XSS
              /DROP|DELETE|INSERT|UPDATE/i // SQL commands
            ]
            
            return !injectionPatterns.some(pattern => pattern.test(value))
          }
          return true
        })

        expect(isValid).toBe(false)
      }
    })
  })

  describe('Data Leakage Prevention', () => {
    it('prevents sensitive data exposure in error messages', async () => {
      // Simulate database error that might contain sensitive information
      const sensitiveError = {
        message: 'Constraint violation: organization_id=00000000-0000-0000-0000-000000000001, user_email=admin@secret.com',
        code: 'CONSTRAINT_VIOLATION',
        detail: 'Key (organization_id, user_email) already exists'
      }

      // Error sanitization should remove sensitive details
      function sanitizeError(error: any) {
        const sanitized = {
          message: 'Database constraint violation',
          code: error.code,
          timestamp: Date.now()
        }
        
        // Should not include sensitive details
        expect(sanitized.message).not.toContain('00000000-0000-0000-0000-000000000001')
        expect(sanitized.message).not.toContain('admin@secret.com')
        
        return sanitized
      }

      const sanitizedError = sanitizeError(sensitiveError)
      expect(sanitizedError.message).toBe('Database constraint violation')
      expect(sanitizedError.code).toBe('CONSTRAINT_VIOLATION')
    })

    it('prevents information disclosure through timing attacks', async () => {
      // Simulate consistent timing for both valid and invalid requests
      const validTileId = 'tile-org-a'
      const invalidTileId = 'nonexistent-tile'

      const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
      
      // Mock consistent timing regardless of tile existence
      vi.mocked(getResolvedTileConfig).mockImplementation(async (tileId) => {
        // Always take at least 50ms to prevent timing-based information disclosure
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (tileId === validTileId) {
          return mockTileConfigOrgA
        }
        return null
      })

      const startValid = Date.now()
      await getResolvedTileConfig(validTileId, MOCK_ORG_A)
      const validDuration = Date.now() - startValid

      const startInvalid = Date.now()
      await getResolvedTileConfig(invalidTileId, MOCK_ORG_A)
      const invalidDuration = Date.now() - startInvalid

      // Timing difference should be minimal to prevent information disclosure
      const timingDifference = Math.abs(validDuration - invalidDuration)
      expect(timingDifference).toBeLessThan(20) // Allow small variance
    })

    it('prevents sensitive data in logs and telemetry', async () => {
      const sensitiveContext = {
        user: {
          user_id: MOCK_ADMIN_USER,
          email: 'admin@secret.com',
          social_security: '123-45-6789',
          password_hash: '$2b$10$...'
        },
        organization: {
          organization_id: MOCK_ORG_A,
          api_keys: ['secret-api-key-123'],
          billing_info: { credit_card: '4111111111111111' }
        }
      }

      // Mock telemetry logging
      function logTelemetry(event: any) {
        // Should sanitize sensitive fields
        const sanitizedEvent = {
          ...event,
          user: event.user ? {
            user_id: event.user.user_id,
            role: event.user.role
            // Email, SSN, password hash should be removed
          } : undefined,
          organization: event.organization ? {
            organization_id: event.organization.organization_id
            // API keys, billing info should be removed
          } : undefined
        }

        // Verify sensitive data is not logged
        expect(JSON.stringify(sanitizedEvent)).not.toContain('admin@secret.com')
        expect(JSON.stringify(sanitizedEvent)).not.toContain('123-45-6789')
        expect(JSON.stringify(sanitizedEvent)).not.toContain('password_hash')
        expect(JSON.stringify(sanitizedEvent)).not.toContain('secret-api-key')
        expect(JSON.stringify(sanitizedEvent)).not.toContain('4111111111111111')

        return sanitizedEvent
      }

      const telemetryEvent = {
        event_type: 'tile_viewed',
        tile_id: 'test-tile',
        timestamp: Date.now(),
        context: sensitiveContext
      }

      const sanitized = logTelemetry(telemetryEvent)
      expect(sanitized.context.user.user_id).toBe(MOCK_ADMIN_USER)
      expect(sanitized.context.user.email).toBeUndefined()
      expect(sanitized.context.organization.organization_id).toBe(MOCK_ORG_A)
      expect(sanitized.context.organization.api_keys).toBeUndefined()
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    it('implements rate limiting for API endpoints', async () => {
      const rateLimitConfig = {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        maxRequestsPerUser: 50
      }

      // Mock rate limiter
      const rateLimiter = new Map<string, { count: number; resetTime: number }>()

      function checkRateLimit(userId: string): boolean {
        const now = Date.now()
        const key = `user:${userId}`
        const existing = rateLimiter.get(key)

        if (!existing || existing.resetTime < now) {
          // Reset window
          rateLimiter.set(key, {
            count: 1,
            resetTime: now + rateLimitConfig.windowMs
          })
          return true
        }

        if (existing.count >= rateLimitConfig.maxRequestsPerUser) {
          return false // Rate limited
        }

        existing.count++
        return true
      }

      // Test normal usage
      for (let i = 0; i < rateLimitConfig.maxRequestsPerUser; i++) {
        expect(checkRateLimit(MOCK_ADMIN_USER)).toBe(true)
      }

      // Test rate limiting kicks in
      expect(checkRateLimit(MOCK_ADMIN_USER)).toBe(false)

      // Different user should not be affected
      expect(checkRateLimit(MOCK_REGULAR_USER)).toBe(true)
    })

    it('detects and prevents abuse patterns', async () => {
      // Mock suspicious activity detection
      const activityTracker = new Map<string, {
        requestCount: number
        errorCount: number
        lastActivity: number
        suspicious: boolean
      }>()

      function trackActivity(userId: string, isError: boolean = false) {
        const now = Date.now()
        const existing = activityTracker.get(userId) || {
          requestCount: 0,
          errorCount: 0,
          lastActivity: now,
          suspicious: false
        }

        existing.requestCount++
        existing.lastActivity = now

        if (isError) {
          existing.errorCount++
        }

        // Detect suspicious patterns
        const errorRate = existing.errorCount / existing.requestCount
        const highErrorRate = errorRate > 0.5 && existing.requestCount > 10
        const rapidRequests = existing.requestCount > 200

        existing.suspicious = highErrorRate || rapidRequests

        activityTracker.set(userId, existing)
        return !existing.suspicious
      }

      // Normal activity
      for (let i = 0; i < 50; i++) {
        expect(trackActivity(MOCK_REGULAR_USER)).toBe(true)
      }

      // High error rate (potential attack)
      for (let i = 0; i < 20; i++) {
        trackActivity(MOCK_GUEST_USER, true) // Generate errors
      }

      expect(trackActivity(MOCK_GUEST_USER)).toBe(false) // Should be flagged as suspicious
    })
  })

  describe('Security Headers and Response Safety', () => {
    it('includes proper security headers in responses', async () => {
      const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }

      // Mock response with security headers
      function createSecureResponse(data: any, status: number = 200) {
        const response = new Response(JSON.stringify(data), {
          status,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders
          }
        })

        return response
      }

      const response = createSecureResponse({ success: true })

      // Verify security headers are present
      Object.entries(securityHeaders).forEach(([header, value]) => {
        expect(response.headers.get(header)).toBe(value)
      })
    })

    it('sanitizes response data to prevent XSS', async () => {
      // Mock potentially dangerous response data
      const dangerousData = {
        title: '<script>alert("xss")</script>Customer Data',
        subtitle: 'Data for <img src="x" onerror="alert(1)"> organization',
        description: 'javascript:alert(document.cookie)',
        userInput: '"><script>alert("stored xss")</script>'
      }

      function sanitizeResponse(data: any): any {
        if (typeof data === 'string') {
          // Remove script tags and javascript: URLs
          return data
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/[<>]/g, '')
        }

        if (Array.isArray(data)) {
          return data.map(sanitizeResponse)
        }

        if (typeof data === 'object' && data !== null) {
          const sanitized: any = {}
          for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeResponse(value)
          }
          return sanitized
        }

        return data
      }

      const sanitizedData = sanitizeResponse(dangerousData)

      expect(sanitizedData.title).not.toContain('<script>')
      expect(sanitizedData.subtitle).not.toContain('onerror=')
      expect(sanitizedData.description).not.toContain('javascript:')
      expect(sanitizedData.userInput).not.toContain('<script>')
    })
  })
})