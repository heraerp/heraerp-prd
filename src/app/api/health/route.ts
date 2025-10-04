import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Health Check Endpoint
 *
 * Used by:
 * - Railway deployment checks
 * - GitHub Actions CI/CD
 * - Monitoring services
 * - Load balancers
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error', message?: string, duration?: number }> = {}

  // 1. Basic application health
  checks.application = { status: 'ok', message: 'Application running' }

  // 2. Environment variables check
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    checks.environment = {
      status: 'error',
      message: `Missing environment variables: ${missingVars.join(', ')}`
    }
  } else {
    checks.environment = { status: 'ok', message: 'All required env vars present' }
  }

  // 3. Database connectivity check (optional, only if env vars are present)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const dbCheckStart = Date.now()
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Simple query to check database connection
      const { error } = await supabase
        .from('core_organizations')
        .select('id')
        .limit(1)

      if (error) {
        checks.database = {
          status: 'error',
          message: `Database error: ${error.message}`,
          duration: Date.now() - dbCheckStart
        }
      } else {
        checks.database = {
          status: 'ok',
          message: 'Database connection successful',
          duration: Date.now() - dbCheckStart
        }
      }
    } catch (error) {
      checks.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }

  // 4. Overall health status
  const hasErrors = Object.values(checks).some(check => check.status === 'error')
  const overallStatus = hasErrors ? 'unhealthy' : 'healthy'
  const statusCode = hasErrors ? 503 : 200

  // 5. Build response
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.2.2',
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime,
    railway: {
      service: process.env.RAILWAY_SERVICE_NAME,
      environment: process.env.RAILWAY_ENVIRONMENT_NAME,
      deployment: process.env.RAILWAY_DEPLOYMENT_ID,
    }
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

/**
 * Simple ping endpoint for load balancers
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
