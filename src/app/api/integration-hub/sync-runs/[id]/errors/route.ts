import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

// GET /api/integration-hub/sync-runs/[id]/errors
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
    const errors = syncRun.metadata?.errors || []

    return NextResponse.json({
      errors,
      total: errors.length,
      sync_run_id: params.id,
      error_rate:
        syncRun.metadata?.stats?.processed_records > 0
          ? ((errors.length / syncRun.metadata.stats.processed_records) * 100).toFixed(2) + '%'
          : '0%'
    })
  } catch (error) {
    console.error('Error fetching sync run errors:', error)
    return NextResponse.json({ error: 'Failed to fetch sync run errors' }, { status: 500 })
  }
}
