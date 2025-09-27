import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

// GET /api/integration-hub/sync-runs/[id]/logs
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await universalApi.read({
      table: 'core_entities',
      filters: {
        id: params.id,
        entity_type: 'integration_sync_run'
      }
    })

    if (!result.data || result.data.length === 0) {
      return NextResponse.json({ error: 'Sync run not found' }, { status: 404 })
    }

    const syncRun = result.data[0]
    const logs = syncRun.metadata?.logs || []

    return NextResponse.json({
      logs,
      total: logs.length,
      sync_run_id: params.id
    })
  } catch (error) {
    console.error('Error fetching sync run logs:', error)
    return NextResponse.json({ error: 'Failed to fetch sync run logs' }, { status: 500 })
  }
}
