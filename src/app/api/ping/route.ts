import { NextResponse } from 'next/server'

/**
 * Ultra-simple ping endpoint for Railway health checks
 * This endpoint always returns 200 OK with minimal processing
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}