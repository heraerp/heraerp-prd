import { NextRequest, NextResponse } from 'next/server'
import { controlCenterService } from '@/src/lib/control-center/control-center-service'

/**
 * Control Center Health API Endpoint
 * Provides quick health check for the widget
 */

export async function GET(request: NextRequest) {
  try {
    // Quick health check (cached)
    const report = await controlCenterService.runSystemHealthCheck()

    const response = NextResponse.json({
      overall: report.overallHealth,
      status:
        report.overallHealth >= 90
          ? 'healthy'
          : report.overallHealth >= 70
            ? 'warning'
            : 'critical',
      components: report.healthChecks.map(h => ({
        name: h.component,
        status: h.status,
        score: h.score
      })),
      violations: report.guardrailViolations.length,
      deploymentReady: report.deploymentReady,
      timestamp: report.timestamp
    })

    // Add health header
    response.headers.set('X-HERA-Health', report.overallHealth >= 70 ? 'healthy' : 'degraded')

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed', message: error.message },
      { status: 500 }
    )
  }
}
