/**
 * HERA DNA SECURITY: Universal Security Middleware
 * Core DNA Component: HERA.DNA.SECURITY.MIDDLEWARE.v1
 *
 * Revolutionary security DNA that provides unified security enforcement across all APIs.
 * Integrates database context, auth resolver, rate limiting, and audit logging into a
 * single, powerful middleware stack.
 *
 * Key DNA Features:
 * - Universal API security enforcement
 * - Role-based access control with dynamic permissions
 * - Rate limiting with sliding window algorithm
 * - Real-time audit logging and security events
 * - Automatic RLS enforcement and bypass protection
 * - Organization context validation with zero data leakage
 */

import { NextRequest, NextResponse } from 'next/server'
import { authResolver } from './auth-resolver'
import { dbContext } from './database-context'
import type { SecurityContext } from './database-context'

interface SecurityMiddlewareOptions {
  requireAuth?: boolean
  allowedRoles?: string[]
  requireOrgContext?: boolean
  enableAuditLogging?: boolean
  enableRateLimit?: boolean
  bypassRLS?: boolean
}

const DEFAULT_OPTIONS: SecurityMiddlewareOptions = {
  requireAuth: true,
  allowedRoles: ['owner', 'admin', 'manager', 'user'],
  requireOrgContext: true,
  enableAuditLogging: true,
  enableRateLimit: true,
  bypassRLS: false
}

/**
 * Main security middleware function
 */
export function withSecurity(
  handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Skip auth for health checks and public endpoints
      if (isPublicEndpoint(req.url)) {
        const publicContext: SecurityContext = {
          orgId: 'public',
          userId: 'anonymous',
          role: 'public',
          authMode: 'service'
        }
        return handler(req, publicContext)
      }

      // Extract and validate authentication
      let securityContext: SecurityContext

      if (config.requireAuth) {
        securityContext = await authResolver.getOrgContext(req)

        // Validate role permissions
        if (config.allowedRoles && !config.allowedRoles.includes(securityContext.role)) {
          return NextResponse.json(
            {
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
              required_roles: config.allowedRoles,
              user_role: securityContext.role
            },
            { status: 403 }
          )
        }

        // Check rate limits
        if (config.enableRateLimit) {
          const action = req.method.toLowerCase()
          const allowed = await authResolver.checkRateLimit(securityContext, action)

          if (!allowed) {
            return NextResponse.json(
              {
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retry_after: 60
              },
              { status: 429 }
            )
          }
        }
      } else {
        // Create minimal context for public endpoints
        securityContext = {
          orgId: 'public',
          userId: 'anonymous',
          role: 'public',
          authMode: 'service'
        }
      }

      // Execute handler within database context
      return await dbContext.executeWithContext(
        securityContext,
        async () => handler(req, securityContext),
        {
          bypassRLS: config.bypassRLS,
          auditDetails: {
            endpoint: new URL(req.url).pathname,
            method: req.method,
            user_agent: req.headers.get('user-agent'),
            ip_address: getClientIP(req)
          }
        }
      )
    } catch (error) {
      console.error('Security middleware error:', error)

      // Determine appropriate error response
      if (error.message.includes('authentication') || error.message.includes('authorization')) {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            code: 'UNAUTHORIZED',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 401 }
        )
      }

      if (error.message.includes('permission') || error.message.includes('forbidden')) {
        return NextResponse.json(
          {
            error: 'Access denied',
            code: 'FORBIDDEN',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 403 }
        )
      }

      // Generic server error
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Express-style middleware wrapper
 */
export function createSecurityMiddleware(options: SecurityMiddlewareOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return async (req: any, res: any, next: any) => {
    try {
      // Skip auth for health checks
      if (isPublicEndpoint(req.originalUrl || req.url)) {
        req.securityContext = {
          orgId: 'public',
          userId: 'anonymous',
          role: 'public',
          authMode: 'service'
        }
        return next()
      }

      // Get auth context
      let securityContext: SecurityContext

      if (config.requireAuth) {
        securityContext = await authResolver.getOrgContext(req)

        // Validate permissions
        if (config.allowedRoles && !config.allowedRoles.includes(securityContext.role)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'FORBIDDEN'
          })
        }

        // Check rate limits
        if (config.enableRateLimit) {
          const action = req.method.toLowerCase()
          const allowed = await authResolver.checkRateLimit(securityContext, action)

          if (!allowed) {
            return res.status(429).json({
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED'
            })
          }
        }
      } else {
        securityContext = {
          orgId: 'public',
          userId: 'anonymous',
          role: 'public',
          authMode: 'service'
        }
      }

      // Set up executeInContext function
      req.executeInContext = async (operation: any, options: any = {}) => {
        return dbContext.executeWithContext(securityContext, operation, {
          bypassRLS: config.bypassRLS,
          auditDetails: {
            endpoint: req.originalUrl || req.url,
            method: req.method,
            user_agent: req.headers['user-agent'],
            ip_address: getClientIP(req)
          },
          ...options
        })
      }

      req.securityContext = securityContext
      next()
    } catch (error) {
      console.error('Security middleware error:', error)

      if (error.message.includes('authentication') || error.message.includes('authorization')) {
        return res.status(401).json({
          error: 'Authentication failed',
          code: 'UNAUTHORIZED'
        })
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      })
    }
  }
}

/**
 * Role-specific middleware factories
 */
export const requireOwner = withSecurity.bind(null, undefined, { allowedRoles: ['owner'] })
export const requireManager = withSecurity.bind(null, undefined, {
  allowedRoles: ['owner', 'admin', 'manager']
})
export const requireUser = withSecurity.bind(null, undefined, {
  allowedRoles: ['owner', 'admin', 'manager', 'user']
})
export const requireService = withSecurity.bind(null, undefined, {
  allowedRoles: ['service'],
  bypassRLS: true
})

/**
 * Public endpoint middleware (no auth required)
 */
export const publicEndpoint = withSecurity.bind(null, undefined, {
  requireAuth: false,
  enableRateLimit: false,
  enableAuditLogging: false
})

/**
 * Check if endpoint is public (no auth required)
 */
function isPublicEndpoint(url: string): boolean {
  const publicPaths = [
    '/api/health',
    '/api/public',
    '/api/status',
    '/api/metrics',
    '/auth/callback',
    '/auth/signin',
    '/auth/signup'
  ]

  const pathname = new URL(url, 'http://localhost').pathname
  return publicPaths.some(path => pathname.startsWith(path))
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: any): string {
  // Check various headers for real IP
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.headers['x-client-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

/**
 * Middleware for service-to-service authentication
 */
export function withServiceAuth(
  handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  allowedServices: string[] = []
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Validate service token
      const serviceToken = req.headers.get('x-service-token')
      const serviceName = req.headers.get('x-service-name')

      if (!serviceToken || !serviceName) {
        return NextResponse.json(
          { error: 'Service authentication required', code: 'SERVICE_AUTH_REQUIRED' },
          { status: 401 }
        )
      }

      // Validate service token (implement your service token validation logic)
      const isValidService = await validateServiceToken(serviceToken, serviceName)
      if (!isValidService) {
        return NextResponse.json(
          { error: 'Invalid service credentials', code: 'INVALID_SERVICE_CREDS' },
          { status: 401 }
        )
      }

      // Check if service is allowed
      if (allowedServices.length > 0 && !allowedServices.includes(serviceName)) {
        return NextResponse.json(
          { error: 'Service not authorized', code: 'SERVICE_NOT_AUTHORIZED' },
          { status: 403 }
        )
      }

      // Create service context
      const context: SecurityContext = {
        orgId: req.headers.get('x-org-id') || 'service',
        userId: serviceName,
        role: 'service',
        authMode: 'service'
      }

      return handler(req, context)
    } catch (error) {
      console.error('Service auth error:', error)
      return NextResponse.json(
        { error: 'Service authentication failed', code: 'SERVICE_AUTH_ERROR' },
        { status: 500 }
      )
    }
  }
}

/**
 * Validate service token (implement based on your service auth strategy)
 */
async function validateServiceToken(token: string, serviceName: string): Promise<boolean> {
  // This is a placeholder - implement your actual service token validation
  // Options:
  // 1. JWT tokens signed with service-specific keys
  // 2. API keys stored in database/env
  // 3. mTLS certificates
  // 4. OAuth2 client credentials flow

  const serviceTokens = {
    'hera-analytics': process.env.ANALYTICS_SERVICE_TOKEN,
    'hera-notifications': process.env.NOTIFICATIONS_SERVICE_TOKEN,
    'hera-integrations': process.env.INTEGRATIONS_SERVICE_TOKEN
  }

  return serviceTokens[serviceName] === token
}

/**
 * Utility function to create org-scoped service context
 */
export function createOrgServiceContext(orgId: string): SecurityContext {
  return {
    orgId,
    userId: 'service',
    role: 'service',
    authMode: 'service'
  }
}

export default withSecurity
