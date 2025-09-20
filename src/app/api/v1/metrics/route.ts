import { NextRequest, NextResponse } from 'next/server'
import { heraMetrics } from '@/lib/observability/metrics'

/**
 * GET /api/v1/metrics
 * Prometheus-compatible metrics endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Get metrics in Prometheus format
    const metrics = heraMetrics.getMetrics()

    return new Response(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4'
      }
    })
  } catch (error) {
    console.error('Error generating metrics:', error)
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 })
  }
}

/**
 * POST /api/v1/metrics/persist
 * Persist current metrics snapshot
 */
export async function POST(request: NextRequest) {
  try {
    const { organization_id } = await request.json()

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    // Persist metrics to database
    await heraMetrics.persistMetrics(organization_id)

    // Also update some gauges based on current state
    // This would be done periodically in production
    await updateBusinessMetrics(organization_id)

    return NextResponse.json({
      success: true,
      message: 'Metrics persisted successfully'
    })
  } catch (error) {
    console.error('Error persisting metrics:', error)
    return NextResponse.json({ error: 'Failed to persist metrics' }, { status: 500 })
  }
}

/**
 * Update business metrics
 */
async function updateBusinessMetrics(organizationId: string) {
  // These would be calculated from actual data
  // For now, using example values

  // Update entity counts
  heraMetrics.updateEntityCount(organizationId, 'customer', 1250)
  heraMetrics.updateEntityCount(organizationId, 'product', 450)
  heraMetrics.updateEntityCount(organizationId, 'employee', 25)

  // Update active organizations by tier
  heraMetrics.updateActiveOrganizations('enterprise', 150)
  heraMetrics.updateActiveOrganizations('professional', 500)
  heraMetrics.updateActiveOrganizations('free', 2000)

  // Update cache hit rates
  heraMetrics.updateCacheHitRate('api', 0.85)
  heraMetrics.updateCacheHitRate('report', 0.65)

  // Update database connections
  heraMetrics.updateDBConnections(45)
}
