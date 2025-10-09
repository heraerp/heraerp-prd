import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Enhanced ping endpoint for Railway health checks
 * Includes startup checks and better error handling
 */
export async function GET() {
  try {
    // Basic health checks
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      railway: {
        deployment: process.env.RAILWAY_DEPLOYMENT_ID || 'unknown',
        environment: process.env.RAILWAY_ENVIRONMENT || 'unknown'
      }
    }

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
}
