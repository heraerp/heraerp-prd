// Ultra-minimal health check with zero dependencies
export const runtime = 'nodejs'
export const dynamic = 'force-static' 
export const revalidate = 0

// Don't import NextResponse - use native Response
export function GET() {
  // Log to stdout for Railway visibility
  console.log('[HEALTH]', new Date().toISOString(), 'GET /api/health - SERVER RESPONDING')
  console.log('[HEALTH]', 'Process details:', {
    pid: process.pid,
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    env: process.env.NODE_ENV
  })
  
  try {
    const response = new Response(
      JSON.stringify({ 
        ok: true, 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptime: Math.round(process.uptime()) + 's',
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        env: process.env.NODE_ENV || 'unknown'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'X-Health-Check': 'ok'
        }
      }
    )
    console.log('[HEALTH]', 'Response created successfully')
    return response
  } catch (error) {
    console.error('[HEALTH]', 'Error creating response:', error)
    return new Response('{"ok":false,"error":"health_check_failed"}', {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export function HEAD() {
  console.log('[HEALTH]', new Date().toISOString(), 'HEAD /api/health - SERVER RESPONDING')
  return new Response(null, { 
    status: 200,
    headers: {
      'X-Health-Check': 'ok',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export function OPTIONS() {
  console.log('[HEALTH]', new Date().toISOString(), 'OPTIONS /api/health')
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
