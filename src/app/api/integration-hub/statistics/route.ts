import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { DataFlowEngine } from '@/lib/integration-hub/data-flow-engine'

// GET /api/integration-hub/statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const period = (searchParams.get('period') || '24h') as '1h' | '24h' | '7d' | '30d'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Fetch sync runs
    const syncRuns = await universalApi.read({
      table: 'core_entities',
      filter: {
        entity_type: 'integration_sync_run',
        organization_id: organizationId
      }
    })

    // Generate statistics
    const stats = DataFlowEngine.generateDataFlowStats(syncRuns.data, period)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
