// Ultra-minimal health check with zero dependencies
export const runtime = 'nodejs'
export const dynamic = 'force-static' 
export const revalidate = 0

// Don't import NextResponse - use native Response
export function GET() {
  // Log to stdout for Railway visibility
  console.log('[HEALTH]', new Date().toISOString(), 'GET /api/health')
  
  return new Response(
    JSON.stringify({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  )
}

export function HEAD() {
  console.log('[HEALTH]', new Date().toISOString(), 'HEAD /api/health')
  return new Response(null, { status: 200 })
}
