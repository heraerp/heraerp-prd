import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    const commitSha =
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      null

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: {
        build: process.env.npm_package_version || '1.2.2',
        commitSha
      },
      env: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      railway: {
        service: process.env.RAILWAY_SERVICE_NAME,
        environment: process.env.RAILWAY_ENVIRONMENT_NAME,
        deployment: process.env.RAILWAY_DEPLOYMENT_ID
      }
    }

    return NextResponse.json(healthData, { 
      status: 200,
      headers 
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
