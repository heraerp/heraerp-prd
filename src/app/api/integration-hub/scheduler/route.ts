import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

// This endpoint would be called by a cron job or scheduler
export async function POST(request: NextRequest) {
  try {
    // Get all active sync jobs across all organizations
    // In production, this would be scoped to specific orgs
    const syncJobsResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_sync_job'
      }
    })

    if (!syncJobsResult.success || !syncJobsResult.data) {
      return NextResponse.json({
        success: true,
        message: 'No sync jobs found',
        triggered: 0
      })
    }

    let triggered = 0
    const errors: string[] = []

    // Process each sync job
    for (const job of syncJobsResult.data) {
      try {
        const orgId = job.organization_id
        universalApi.setOrganizationId(orgId)

        // Get job configuration from dynamic fields
        const fieldsResult = await universalApi.read({
          table: 'core_dynamic_data',
          filters: {
            entity_id: job.id,
            organization_id: orgId
          }
        })

        const fields = fieldsResult.data || []
        const getFieldValue = (name: string) => 
          fields.find(f => f.field_name === name)?.field_value_text || ''
        const getFieldBoolean = (name: string) => 
          fields.find(f => f.field_name === name)?.field_value_text === 'true'

        const isActive = getFieldBoolean('is_active')
        const schedule = getFieldValue('schedule')
        const vendor = getFieldValue('vendor')
        const domain = getFieldValue('domain')
        const lastRunAt = getFieldValue('last_run_at')

        // Skip if not active
        if (!isActive) continue

        // Check if should run based on schedule
        if (!shouldRunNow(schedule, lastRunAt)) continue

        // Special handling for Eventbrite events
        if (vendor === 'eventbrite' && domain === 'events') {
          // Trigger the sync
          const response = await fetch('/api/integration-hub/run/trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            },
            body: JSON.stringify({
              vendor,
              domain,
              syncJobId: job.id
            })
          })

          if (response.ok) {
            triggered++
            
            // Update last run time
            await universalApi.setDynamicField(
              job.id,
              'last_run_at',
              new Date().toISOString(),
              'text'
            )

            // Calculate next run time
            const nextRun = calculateNextRun(schedule)
            await universalApi.setDynamicField(
              job.id,
              'next_run_at',
              nextRun.toISOString(),
              'text'
            )
          } else {
            const error = await response.text()
            errors.push(`Job ${job.id}: ${error}`)
          }
        }

      } catch (error) {
        errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Triggered ${triggered} sync jobs`,
      triggered,
      errors
    })

  } catch (error) {
    console.error('Scheduler error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Scheduler failed' 
      },
      { status: 500 }
    )
  }
}

function shouldRunNow(schedule: string, lastRunAt?: string): boolean {
  // Handle manual schedule
  if (schedule === 'manual' || schedule === 'realtime') {
    return false
  }

  // If never run, should run now
  if (!lastRunAt) {
    return true
  }

  const lastRun = new Date(lastRunAt)
  const now = new Date()
  const timeSinceLastRun = now.getTime() - lastRun.getTime()

  switch (schedule) {
    case '15m':
      return timeSinceLastRun >= 15 * 60 * 1000
    case 'hourly':
      return timeSinceLastRun >= 60 * 60 * 1000
    case 'daily':
      return timeSinceLastRun >= 24 * 60 * 60 * 1000
    case 'weekly':
      return timeSinceLastRun >= 7 * 24 * 60 * 60 * 1000
    default:
      return false
  }
}

function calculateNextRun(schedule: string): Date {
  const now = new Date()
  
  switch (schedule) {
    case '15m':
      return new Date(now.getTime() + 15 * 60 * 1000)
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() + 60 * 60 * 1000) // Default 1 hour
  }
}