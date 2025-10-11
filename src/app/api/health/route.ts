// Absolutely minimal health check - no imports except NextResponse
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-static' 
export const revalidate = 0

export function GET() {
  console.log('Health check hit at', new Date().toISOString())
  return NextResponse.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    pid: process.pid 
  }, { status: 200 })
}

// Also support HEAD requests (sometimes used by health checkers)
export function HEAD() {
  console.log('Health check HEAD at', new Date().toISOString())
  return new NextResponse(null, { status: 200 })
}
