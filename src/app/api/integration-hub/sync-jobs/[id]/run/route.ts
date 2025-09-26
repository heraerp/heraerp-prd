import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { SyncScheduler } from '@/lib/integration-hub/sync-scheduler'

// POST /api/integration-hub/sync-jobs/[id]/run
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Fetch sync job
    const jobResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        id: params.id,
        entity_type: 'integration_sync_job'
      }
    })

    if (!jobResult.data || jobResult.data.length === 0) {
      return NextResponse.json({ error: 'Sync job not found' }, { status: 404 })
    }

    const syncJob = jobResult.data[0]

    // Check if job is active
    if (syncJob.metadata?.status !== 'active') {
      return NextResponse.json({ error: 'Sync job is not active' }, { status: 400 })
    }

    // Create a new sync run
    const syncRun = await SyncScheduler.createSyncRun(
      syncJob.organization_id,
      syncJob.id,
      syncJob.entity_name
    )

    // Log start of sync
    await SyncScheduler.logSyncActivity(syncRun.id, 'info', 'Sync run started', {
      sync_job_id: syncJob.id,
      sync_job_name: syncJob.entity_name,
      triggered_by: 'manual'
    })

    // In a real implementation, this would trigger the actual sync process
    // For now, we'll simulate a successful sync after a delay
    setTimeout(async () => {
      try {
        const stats = {
          total_records: 100,
          processed_records: 100,
          created_records: 10,
          updated_records: 85,
          deleted_records: 0,
          skipped_records: 5,
          error_records: 0,
          data_volume_bytes: 102400
        }

        await SyncScheduler.updateSyncRun(syncRun.id, {
          status: 'completed',
          stats,
          ended_at: new Date().toISOString(),
          duration_seconds: Math.floor(Math.random() * 60) + 10
        })

        await SyncScheduler.logSyncActivity(syncRun.id, 'info', 'Sync run completed successfully', {
          stats
        })

        // Update next run time
        await SyncScheduler.updateNextRunTime(syncJob.id)
      } catch (error) {
        console.error('Error completing sync run:', error)
      }
    }, 5000)

    return NextResponse.json({
      success: true,
      syncRunId: syncRun.id,
      message: 'Sync job started successfully'
    })
  } catch (error) {
    console.error('Error running sync job:', error)
    return NextResponse.json({ error: 'Failed to run sync job' }, { status: 500 })
  }
}
