import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { SyncScheduler } from '@/lib/integration-hub/sync-scheduler'

// GET /api/integration-hub/sync-jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const connectorId = searchParams.get('connectorId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const result = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_sync_job',
        organization_id: organizationId
      }
    })

    let syncJobs = result.data
    if (connectorId) {
      syncJobs = syncJobs.filter((job: any) => job.metadata?.connector_id === connectorId)
    }

    return NextResponse.json({ syncJobs })
  } catch (error) {
    console.error('Error fetching sync jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch sync jobs' }, { status: 500 })
  }
}

// POST /api/integration-hub/sync-jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      connectorId,
      mappingId,
      name,
      syncType,
      syncDirection,
      schedule,
      options,
      filters
    } = body

    if (
      !organizationId ||
      !connectorId ||
      !mappingId ||
      !name ||
      !syncType ||
      !syncDirection ||
      !options
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const syncJob = await SyncScheduler.createSyncJob(organizationId, connectorId, mappingId, {
      name,
      syncType,
      syncDirection,
      schedule,
      options,
      filters
    })

    return NextResponse.json({ syncJob })
  } catch (error) {
    console.error('Error creating sync job:', error)
    return NextResponse.json({ error: 'Failed to create sync job' }, { status: 500 })
  }
}
