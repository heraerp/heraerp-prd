import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check Railway deployment status
 */
export async function GET() {
  const debug = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
      RAILWAY_DEPLOYMENT_ID: process.env.RAILWAY_DEPLOYMENT_ID,
      PORT: process.env.PORT
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
    },
    server: {
      hostname: process.env.HOSTNAME || 'unknown',
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  }

  return NextResponse.json(debug, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Debug-Timestamp': new Date().toISOString()
    }
  })
}
