import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import type { IntegrationHealth } from '@/types/integration-hub'

// GET /api/integration-hub/health-metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Fetch all connectors
    const connectors = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_connector',
        organization_id: organizationId
      }
    })

    // Generate health metrics for each connector
    const healthMetrics: IntegrationHealth[] = connectors.data.map(connector => {
      const now = new Date()
      const lastCheck = new Date(connector.metadata?.last_health_check || now)
      const hoursSinceCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)

      let status: IntegrationHealth['status'] = 'healthy'
      if (connector.metadata?.status === 'error') {
        status = 'unhealthy'
      } else if (hoursSinceCheck > 1) {
        status = 'degraded'
      }

      return {
        connector_id: connector.id,
        status,
        last_check: connector.metadata?.last_health_check || now.toISOString(),
        uptime_percentage: 99.5, // Mock data
        response_time_ms: Math.floor(Math.random() * 200) + 50,
        error_rate: Math.random() * 0.05,
        quota_usage: {
          api_calls: {
            used: Math.floor(Math.random() * 9000),
            limit: 10000,
            reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
          },
          data_volume: {
            used_bytes: Math.floor(Math.random() * 900000000),
            limit_bytes: 1000000000
          }
        },
        alerts: []
      }
    })

    return NextResponse.json({ 
      metrics: healthMetrics,
      summary: {
        total: healthMetrics.length,
        healthy: healthMetrics.filter(m => m.status === 'healthy').length,
        degraded: healthMetrics.filter(m => m.status === 'degraded').length,
        unhealthy: healthMetrics.filter(m => m.status === 'unhealthy').length
      }
    })
  } catch (error) {
    console.error('Error fetching health metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health metrics' },
      { status: 500 }
    )
  }
}