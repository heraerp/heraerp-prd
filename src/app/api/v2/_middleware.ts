/**
 * V2 API Observability Middleware
 * Provides request tracking, timing, and structured logging for all V2 endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface LogEntry {
  requestId: string
  route: string
  method: string
  status: number
  organization_id?: string
  actor_user_id?: string
  smart_code?: string
  latency_ms: number
  timestamp: string
  api_version: 'v2'
  user_agent?: string
  ip_address?: string
  error_message?: string
}

interface AuthContext {
  organizationId?: string
  userId?: string
}

/**
 * Extract organization and user context from request
 */
function extractAuthContext(request: NextRequest): AuthContext {
  const authHeader = request.headers.get('authorization')
  const orgHeader = request.headers.get('x-organization-id')
  
  // Try to get organization ID from header or URL params
  const { searchParams } = new URL(request.url)
  const organizationId = orgHeader || searchParams.get('organization_id') || undefined
  
  // For now, we'll extract basic info from headers
  // In production, this would decode JWT token
  return {
    organizationId,
    userId: request.headers.get('x-user-id') || undefined
  }
}

/**
 * Extract smart code from request body or URL
 */
async function extractSmartCode(request: NextRequest): Promise<string | undefined> {
  try {
    // Clone request to read body without consuming it
    const clonedRequest = request.clone()
    
    // Only try to read body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const body = await clonedRequest.json()
      return body?.smart_code || undefined
    }
  } catch (error) {
    // Ignore JSON parsing errors - body might not be JSON
  }
  
  return undefined
}

/**
 * Extract client IP address
 */
function extractIpAddress(request: NextRequest): string | undefined {
  // Check various headers for client IP
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    undefined
  )
}

/**
 * Log structured entry to console (in production, would go to logging service)
 */
function logEntry(entry: LogEntry): void {
  // In development/testing, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[V2-API] ${entry.method} ${entry.route} - ${entry.status} (${entry.latency_ms}ms)`)
    
    if (entry.error_message) {
      console.error(`[V2-API] Error: ${entry.error_message}`)
    }
  }
  
  // In production, send to structured logging service
  // Example: sendToDatadog(entry) or sendToCloudWatch(entry)
  
  // For now, write structured JSON to stdout for log aggregation
  process.stdout.write(JSON.stringify(entry) + '\n')
}

/**
 * V2 API Observability Middleware
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Development auth bypass
  if (process.env.HERA_DEV_BYPASS_AUTH === '1') {
    const url = new URL(request.url)
    const isLocal = ['localhost','127.0.0.1'].includes(url.hostname)
    if (isLocal) {
      console.log(`[DEV-BYPASS] ${request.method} ${url.pathname}`)
      return NextResponse.next({ request: { headers: new Headers(request.headers) }})
    }
  }
  
  const startTime = Date.now()
  const requestId = uuidv4()
  const route = new URL(request.url).pathname
  const method = request.method
  
  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)
  
  // Extract context
  const authContext = extractAuthContext(request)
  const smartCode = await extractSmartCode(request)
  const ipAddress = extractIpAddress(request)
  const userAgent = request.headers.get('user-agent') || undefined
  
  let response: NextResponse
  let status = 200
  let errorMessage: string | undefined
  
  try {
    // Continue to the actual API handler
    response = NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
    
    status = response.status
    
  } catch (error) {
    // Handle middleware errors
    status = 500
    errorMessage = error instanceof Error ? error.message : 'Unknown middleware error'
    
    response = NextResponse.json(
      { 
        error: 'middleware_error', 
        message: errorMessage,
        requestId 
      },
      { status: 500 }
    )
  }
  
  // Calculate latency
  const latencyMs = Date.now() - startTime
  
  // Create log entry
  const logEntry: LogEntry = {
    requestId,
    route,
    method,
    status,
    organization_id: authContext.organizationId,
    actor_user_id: authContext.userId,
    smart_code: smartCode,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
    api_version: 'v2',
    user_agent: userAgent,
    ip_address: ipAddress,
    error_message: errorMessage
  }
  
  // Log the entry
  logEntry(logEntry)
  
  // Add observability headers to response
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-api-version', 'v2')
  response.headers.set('x-response-time', `${latencyMs}ms`)
  
  return response
}

/**
 * Configuration for Next.js middleware
 */
export const config = {
  matcher: [
    '/api/v2/:path*'
  ]
}

/**
 * Enhanced middleware wrapper for specific route handlers
 * Use this in route handlers for additional context
 */
export function withV2Observability<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  routeName?: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    const requestId = uuidv4()
    
    try {
      const result = await handler(...args)
      
      const latencyMs = Date.now() - startTime
      
      // Log successful handler execution
      if (process.env.NODE_ENV === 'development') {
        console.log(`[V2-Handler] ${routeName || 'unknown'} completed in ${latencyMs}ms`)
      }
      
      return result
      
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown handler error'
      
      // Log handler error
      const logEntry: Partial<LogEntry> = {
        requestId,
        route: routeName || 'unknown',
        method: 'HANDLER',
        status: 500,
        latency_ms: latencyMs,
        timestamp: new Date().toISOString(),
        api_version: 'v2',
        error_message: errorMessage
      }
      
      process.stdout.write(JSON.stringify(logEntry) + '\n')
      
      throw error
    }
  }
}

/**
 * Request context helper for accessing observability data in handlers
 */
export function getRequestContext(request: NextRequest): {
  requestId: string
  organizationId?: string
  userId?: string
} {
  return {
    requestId: request.headers.get('x-request-id') || 'unknown',
    organizationId: extractAuthContext(request).organizationId,
    userId: extractAuthContext(request).userId
  }
}

export default middleware