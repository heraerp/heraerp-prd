// ================================================================================
// PROMETHEUS METRICS API ENDPOINT
// Exposes HERA ERP metrics in Prometheus format for Grafana monitoring
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { heraMetrics } from '@/lib/monitoring/prometheus-metrics'

export async function GET(request: NextRequest) {
  try {
    // Track the metrics endpoint access
    heraMetrics.trackAPICall('/api/metrics', 'GET', 200, Date.now())

    // Get metrics in Prometheus format
    const prometheusMetrics = heraMetrics.exportPrometheusFormat()

    // Add system-level metrics
    const systemMetrics = generateSystemMetrics()

    // Combine all metrics
    const allMetrics = prometheusMetrics + systemMetrics

    return new NextResponse(allMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    })
  } catch (error) {
    console.error('Metrics endpoint error:', error)

    // Track error
    heraMetrics.trackAPICall('/api/metrics', 'GET', 500, Date.now())

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * Generate additional system-level metrics
 */
function generateSystemMetrics(): string {
  const now = Math.floor(Date.now() / 1000)

  return `
# HELP hera_system_uptime_seconds System uptime in seconds
# TYPE hera_system_uptime_seconds gauge
hera_system_uptime_seconds ${process.uptime()}

# HELP hera_system_memory_usage_bytes Memory usage in bytes
# TYPE hera_system_memory_usage_bytes gauge
hera_system_memory_usage_bytes{type="used"} ${process.memoryUsage().heapUsed}
hera_system_memory_usage_bytes{type="total"} ${process.memoryUsage().heapTotal}

# HELP hera_system_timestamp_seconds Current system timestamp
# TYPE hera_system_timestamp_seconds gauge
hera_system_timestamp_seconds ${now}

# HELP hera_build_info Build information
# TYPE hera_build_info gauge
hera_build_info{version="${process.env.BUILD_VERSION || 'dev'}", environment="${process.env.NODE_ENV || 'development'}", region="${process.env.RAILWAY_DEPLOYMENT_DOMAIN || 'local'}"} 1
`
}

// Middleware to track metrics for incoming requests
// Note: Middleware functionality has been moved to src/middleware.ts
