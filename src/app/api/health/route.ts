import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    }

    // Check database connectivity if needed
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      health.database = 'configured'
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    )
  }
}
