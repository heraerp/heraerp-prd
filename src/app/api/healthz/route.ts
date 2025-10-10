export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Enhanced health check with comprehensive diagnostics
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      environment: {
        node_env: process.env.NODE_ENV || 'unknown',
        port: process.env.PORT || 'unknown',
        hostname: process.env.HOSTNAME || 'unknown'
      },
      railway: {
        deployment_id: process.env.RAILWAY_DEPLOYMENT_ID || 'unknown',
        environment: process.env.RAILWAY_ENVIRONMENT || 'unknown',
        service_id: process.env.RAILWAY_SERVICE_ID || 'unknown'
      },
      version: '1.2.2'
    }

    // Log health check for debugging
    console.log('✅ Health check requested:', {
      timestamp: health.timestamp,
      uptime: health.uptime,
      memory: health.memory.heapUsed
    })

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('❌ Health check failed:', error)
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: {
          'content-type': 'application/json'
        }
      }
    )
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
