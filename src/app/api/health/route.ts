// ================================================================================
// HERA ERP HEALTH CHECK ENDPOINT
// Simple health check and basic monitoring endpoint
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health check data
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'hera-erp',
      version: process.env.BUILD_VERSION || 'dev',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      response_time_ms: Date.now() - startTime,
      monitoring: {
        metrics_enabled: process.env.ENABLE_PROMETHEUS_METRICS === 'true',
        analytics_enabled: process.env.ENABLE_CUSTOMER_ANALYTICS === 'true',
        performance_monitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
      }
    };

    // Simple Prometheus-format metrics in response header
    const prometheusMetrics = generateBasicMetrics(healthData);
    
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'healthy',
        'X-Response-Time': `${healthData.response_time_ms}ms`,
        'X-Prometheus-Metrics': prometheusMetrics
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Generate basic Prometheus metrics
 */
function generateBasicMetrics(healthData: any): string {
  return [
    `hera_health_status{service="hera-erp"} 1`,
    `hera_uptime_seconds{service="hera-erp"} ${healthData.uptime}`,
    `hera_memory_used_mb{service="hera-erp"} ${healthData.memory.used}`,
    `hera_response_time_ms{endpoint="/api/health"} ${healthData.response_time_ms}`
  ].join('\\n');
}