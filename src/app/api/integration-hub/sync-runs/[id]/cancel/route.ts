import { NextRequest, NextResponse } from 'next/server'
import { SyncScheduler } from '@/lib/integration-hub/sync-scheduler'

// POST /api/integration-hub/sync-runs/[id]/cancel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Update sync run status to cancelled
    await SyncScheduler.updateSyncRun(params.id, {
      status: 'cancelled',
      ended_at: new Date().toISOString()
    })

    // Log cancellation
    await SyncScheduler.logSyncActivity(
      params.id,
      'warn',
      'Sync run cancelled by user'
    )

    return NextResponse.json({
      success: true,
      message: 'Sync run cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling sync run:', error)
    return NextResponse.json(
      { error: 'Failed to cancel sync run' },
      { status: 500 }
    )
  }
}