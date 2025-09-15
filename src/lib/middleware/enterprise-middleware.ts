/**
 * HERA Enterprise Middleware Stack
 * Combines all enterprise features into cohesive middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { heraLogger } from '@/lib/observability/logger'
import { heraTracer } from '@/lib/observability/tracer'
import { heraMetrics } from '@/lib/observability/metrics'
import { rateLimiter } from '@/lib/limits/rate-limiter'
import { rbacPolicy } from '@/lib/rbac/policy-engine'
import { RLSQueryBuilder } from '@/lib/rbac/query-builder-middleware'
import { normalizeSmartCode } from '@/lib/guardrails/smart-code-normalizer'
import { checkPeriodPostingAllowed } from '@/lib/guardrails/period-close-validator'
import { validateGLBalance, normalizeGLAccount } from '@/lib/guardrails/gl-balance-validator'

export interface MiddlewareContext {
  requestId: string
  organizationId?: string
  userId?: string
  roles: string[]
  traceId: string
  startTime: number
}

/**
 * Enterprise middleware stack
 */
export async function enterpriseMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, ctx: MiddlewareContext) => Promise<Response>
): Promise<Response> {
  const ctx: MiddlewareContext = {
    requestId: request.headers.get('x-request-id') || uuidv4(),
    traceId: request.headers.get('x-trace-id') || heraTracer.generateTraceId(),
    startTime: Date.now(),
    roles: ['USER'] // Default role
  }

  // Extract auth context
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    // Extract from JWT
    const token = authHeader.replace('Bearer ', '')
    const payload = decodeJWT(token) // Simplified - use proper JWT library
    ctx.organizationId = payload.organization_id
    ctx.userId = payload.sub
    ctx.roles = payload.roles || ['USER']
  }

  // Set up logging context
  heraLogger.setContext(ctx.requestId, {
    organization_id: ctx.organizationId!,
    user_id: ctx.userId,
    trace_id: ctx.traceId,
    request_id: ctx.requestId
  })

  // Set up RLS context
  if (ctx.organizationId) {
    RLSQueryBuilder.setContext(ctx.requestId, {
      organization_id: ctx.organizationId,
      user_id: ctx.userId!,
      roles: ctx.roles
    })
  }

  try {
    // 1. Rate limiting
    const rateLimitResult = await checkRateLimit(request, ctx)
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    // 2. RBAC check
    const rbacResult = await checkRBAC(request, ctx)
    if (!rbacResult.allowed) {
      return createForbiddenResponse(rbacResult)
    }

    // 3. Idempotency check
    const idempotencyKey = request.headers.get('idempotency-key')
    if (idempotencyKey && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const cached = await checkIdempotency(idempotencyKey, ctx)
      if (cached.exists) {
        return createIdempotentResponse(cached)
      }
    }

    // 4. Execute handler with tracing
    const response = await heraTracer.traceAPI(
      request.method,
      request.nextUrl.pathname,
      ctx.organizationId!,
      async () => {
        return handler(request, ctx)
      }
    )

    // 5. Store idempotency result
    if (idempotencyKey && response.ok) {
      await storeIdempotencyResult(idempotencyKey, request, response, ctx)
    }

    // 6. Add security headers
    addSecurityHeaders(response.headers)

    // 7. Log and metrics
    const duration = Date.now() - ctx.startTime
    logAndRecordMetrics(request, response, ctx, duration)

    return response
  } catch (error) {
    // Error handling
    const duration = Date.now() - ctx.startTime

    heraLogger.error(
      'Request failed',
      error as Error,
      {
        method: request.method,
        path: request.nextUrl.pathname,
        duration
      },
      ctx.requestId
    )

    heraMetrics.recordAPIError(
      request.method,
      request.nextUrl.pathname,
      (error as any).code || 'INTERNAL_ERROR'
    )

    return createErrorResponse(error as Error, ctx)
  } finally {
    // Cleanup
    heraLogger.clearContext(ctx.requestId)
    RLSQueryBuilder.clearContext(ctx.requestId)
  }
}

/**
 * Rate limit check
 */
async function checkRateLimit(request: NextRequest, ctx: MiddlewareContext): Promise<any> {
  if (!ctx.organizationId) {
    return { allowed: true }
  }

  const apiGroup = getApiGroup(request.nextUrl.pathname)
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'

  return rateLimiter.checkLimit({
    organization_id: ctx.organizationId,
    ip_address: ip,
    endpoint: request.nextUrl.pathname,
    api_group: apiGroup
  })
}

/**
 * RBAC check
 */
async function checkRBAC(request: NextRequest, ctx: MiddlewareContext): Promise<any> {
  if (!ctx.organizationId || !ctx.userId) {
    return { allowed: false, reason: 'Missing authentication context' }
  }

  const action = `${request.method} ${request.nextUrl.pathname}`
  const smartCode = extractSmartCode(request)

  return rbacPolicy.checkPermission({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    roles: ctx.roles,
    action,
    smartCode,
    context: {
      ip: request.headers.get('x-forwarded-for') || request.ip,
      mfa_verified: request.headers.get('x-mfa-verified') === 'true'
    }
  })
}

/**
 * Idempotency check
 */
async function checkIdempotency(key: string, ctx: MiddlewareContext): Promise<any> {
  if (!ctx.organizationId) {
    return { exists: false }
  }

  return rateLimiter.checkIdempotency(key, ctx.organizationId)
}

/**
 * Store idempotency result
 */
async function storeIdempotencyResult(
  key: string,
  request: NextRequest,
  response: Response,
  ctx: MiddlewareContext
): Promise<void> {
  if (!ctx.organizationId) return

  const requestHash = rateLimiter.hashRequest({
    method: request.method,
    path: request.nextUrl.pathname,
    body: await request.json().catch(() => null),
    organization_id: ctx.organizationId
  })

  const responseBody = await response
    .clone()
    .json()
    .catch(() => null)

  await rateLimiter.storeIdempotency({
    key,
    organization_id: ctx.organizationId,
    request_hash: requestHash,
    response: responseBody,
    status_code: response.status
  })
}

/**
 * Add security headers
 */
function addSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
}

/**
 * Log and record metrics
 */
function logAndRecordMetrics(
  request: NextRequest,
  response: Response,
  ctx: MiddlewareContext,
  duration: number
): void {
  // Log
  heraLogger.logAPIRequest({
    requestId: ctx.requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    statusCode: response.status,
    duration,
    organizationId: ctx.organizationId
  })

  // Metrics
  heraMetrics.recordAPIRequest(request.method, request.nextUrl.pathname, response.status)

  heraMetrics.recordAPIDuration(request.method, request.nextUrl.pathname, duration)
}

/**
 * Response creators
 */
function createRateLimitResponse(result: any): Response {
  return new Response(
    JSON.stringify({
      type: 'https://hera.app/errors/rate-limit',
      title: 'Rate Limit Exceeded',
      status: 429,
      detail: `Rate limit exceeded. Retry after ${result.retry_after} seconds.`,
      retry_after: result.retry_after
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/problem+json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset_at.toISOString(),
        'Retry-After': result.retry_after.toString()
      }
    }
  )
}

function createForbiddenResponse(result: any): Response {
  return new Response(
    JSON.stringify({
      type: 'https://hera.app/errors/forbidden',
      title: 'Access Denied',
      status: 403,
      detail: result.reason,
      audit_id: result.audit_id
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/problem+json'
      }
    }
  )
}

function createIdempotentResponse(cached: any): Response {
  return new Response(JSON.stringify(cached.response), {
    status: cached.status_code,
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotent-Replay': 'true',
      'X-Original-Date': cached.created_at
    }
  })
}

function createErrorResponse(error: Error, ctx: MiddlewareContext): Response {
  const errorId = uuidv4()

  return new Response(
    JSON.stringify({
      type: 'https://hera.app/errors/internal',
      title: 'Internal Server Error',
      status: 500,
      detail: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
      instance: `/errors/${errorId}`,
      trace_id: ctx.traceId
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/problem+json'
      }
    }
  )
}

/**
 * Helpers
 */
function getApiGroup(path: string): string {
  if (path.includes('/reports')) return 'report'
  if (['POST', 'PUT', 'PATCH', 'DELETE'].some(m => path.includes(m))) return 'write'
  if (path.includes('/auth')) return 'auth'
  if (path.includes('/admin')) return 'admin'
  return 'read'
}

function extractSmartCode(request: NextRequest): string | undefined {
  // Extract from body or headers
  const smartCode = request.headers.get('x-smart-code') || undefined

  // Normalize if present (V1 → v1)
  if (smartCode) {
    try {
      return normalizeSmartCode(smartCode)
    } catch (error) {
      // Invalid smart code will be caught by validation
      return smartCode
    }
  }

  return undefined
}

function decodeJWT(token: string): any {
  // Simplified - use proper JWT library
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64').toString())
  } catch {
    return {}
  }
}
