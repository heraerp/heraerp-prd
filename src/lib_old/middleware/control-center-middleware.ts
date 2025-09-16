/**
 * HERA Control Center Middleware
 * Ensures all operations go through Control Center validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { controlCenterService } from '@/lib/control-center/control-center-service'

// Operations that require Control Center validation
const PROTECTED_OPERATIONS = [
  '/api/v1/universal',
  '/api/v1/transactions',
  '/api/v1/entities',
  '/api/v1/financial',
  '/api/v1/fiscal-close'
]

// Cache for health check results (5 minute TTL)
let healthCache: { timestamp: number; healthy: boolean } | null = null
const HEALTH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function controlCenterMiddleware(request: NextRequest) {
  // Skip for non-protected routes
  const isProtected = PROTECTED_OPERATIONS.some(op => request.nextUrl.pathname.startsWith(op))

  if (!isProtected) {
    return NextResponse.next()
  }

  try {
    // Check cached health status
    const now = Date.now()
    if (!healthCache || now - healthCache.timestamp > HEALTH_CACHE_TTL) {
      // Run quick health check
      const healthResult = await controlCenterService.runSystemHealthCheck()
      const isHealthy = healthResult.overallHealth >= 70

      healthCache = {
        timestamp: now,
        healthy: isHealthy
      }

      // Log critical issues
      if (!isHealthy) {
        console.warn('[Control Center] System health below threshold:', {
          health: healthResult.overallHealth,
          violations: healthResult.guardrailViolations.length,
          criticalIssues: healthResult.healthChecks
            .filter(h => h.status === 'critical')
            .map(h => h.component)
        })
      }
    }

    // Add health status to response headers
    const response = NextResponse.next()
    response.headers.set('X-HERA-Health', healthCache.healthy ? 'healthy' : 'degraded')
    response.headers.set('X-HERA-Control-Center', 'active')

    // If system is critical, return error for write operations
    if (!healthCache.healthy && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
      return NextResponse.json(
        {
          error: 'System health check failed',
          message:
            'Control Center has detected critical issues. Please run health check for details.',
          code: 'CONTROL_CENTER_HEALTH_FAILURE'
        },
        { status: 503 }
      )
    }

    return response
  } catch (error) {
    console.error('[Control Center Middleware] Error:', error)
    // Don't block operations if middleware fails
    return NextResponse.next()
  }
}

/**
 * Control Center validation for specific operations
 */
export async function validateOperation(
  operation: string,
  context: Record<string, any>
): Promise<{ valid: boolean; errors?: string[] }> {
  const errors: string[] = []

  // Check organization context
  if (!context.organizationId) {
    errors.push('Organization ID required for all operations')
  }

  // Check smart code
  if (!context.smartCode) {
    errors.push('Smart code required for operation tracking')
  }

  // Check for custom table operations
  if (context.tableName && !isValidTable(context.tableName)) {
    errors.push(`Invalid table: ${context.tableName}. Only sacred 6 tables allowed.`)
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function isValidTable(tableName: string): boolean {
  const sacredTables = [
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ]

  return sacredTables.includes(tableName)
}
