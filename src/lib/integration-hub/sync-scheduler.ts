import { universalApi } from '@/lib/universal-api'
import { createNormalizedEntity } from '@/lib/services/entity-normalization-service'
import type { 
  SyncJob, 
  SyncRun, 
  SyncSchedule, 
  SyncOptions, 
  SyncStats,
  SyncError,
  SyncLog 
} from '@/types/integration-hub'
import * as cron from 'cron-parser'

export class SyncScheduler {
  // Create a new sync job
  static async createSyncJob(
    organizationId: string,
    connectorId: string,
    mappingId: string,
    config: {
      name: string
      syncType: SyncJob['sync_type']
      syncDirection: SyncJob['sync_direction']
      schedule?: SyncSchedule
      options: SyncOptions
      filters?: any[]
    }
  ): Promise<SyncJob> {
    const syncJob = await createNormalizedEntity(
      organizationId,
      'integration_sync_job',
      config.name,
      {
        entity_code: `SYNC-${Date.now()}`,
        smart_code: `HERA.INTEGRATIONS.SYNC.${config.syncType.toUpperCase()}.v1`,
        connector_id: connectorId,
        mapping_id: mappingId,
        sync_type: config.syncType,
        sync_direction: config.syncDirection,
        schedule: config.schedule,
        filters: config.filters || [],
        options: config.options,
        status: 'active',
        next_run: config.schedule ? this.calculateNextRun(config.schedule) : null
      }
    )

    return syncJob.data as SyncJob
  }

  // Calculate next run time based on schedule
  static calculateNextRun(schedule: SyncSchedule): string | null {
    if (!schedule || schedule.type === 'manual') {
      return null
    }

    const now = new Date()

    if (schedule.type === 'cron' && schedule.cron) {
      try {
        const interval = cron.parseExpression(schedule.cron, {
          currentDate: now,
          tz: schedule.timezone
        })
        const next = interval.next()
        
        // Check if within active hours
        if (schedule.active_hours) {
          const nextDate = next.toDate()
          const hours = nextDate.getHours()
          const startHour = parseInt(schedule.active_hours.start.split(':')[0])
          const endHour = parseInt(schedule.active_hours.end.split(':')[0])
          
          if (hours < startHour || hours >= endHour) {
            // Adjust to next active window
            nextDate.setHours(startHour, 0, 0, 0)
            if (hours >= endHour) {
              nextDate.setDate(nextDate.getDate() + 1)
            }
            return nextDate.toISOString()
          }
        }
        
        return next.toISOString()
      } catch (error) {
        console.error('Invalid cron expression:', error)
        return null
      }
    }

    if (schedule.type === 'interval' && schedule.interval_minutes) {
      const nextRun = new Date(now.getTime() + schedule.interval_minutes * 60 * 1000)
      return nextRun.toISOString()
    }

    return null
  }

  // Create a new sync run
  static async createSyncRun(
    organizationId: string,
    syncJobId: string,
    syncJobName: string
  ): Promise<SyncRun> {
    const syncRun = await createNormalizedEntity(
      organizationId,
      'integration_sync_run',
      `${syncJobName} - ${new Date().toISOString()}`,
      {
        entity_code: `RUN-${syncJobId}-${Date.now()}`,
        smart_code: `HERA.INTEGRATIONS.RUN.v1`,
        sync_job_id: syncJobId,
        status: 'running',
        started_at: new Date().toISOString(),
        stats: {
          total_records: 0,
          processed_records: 0,
          created_records: 0,
          updated_records: 0,
          deleted_records: 0,
          skipped_records: 0,
          error_records: 0,
          data_volume_bytes: 0
        },
        errors: [],
        logs: []
      }
    )

    return syncRun.data as SyncRun
  }

  // Update sync run status
  static async updateSyncRun(
    syncRunId: string,
    updates: {
      status?: SyncRun['status']
      stats?: Partial<SyncStats>
      errors?: SyncError[]
      logs?: SyncLog[]
      ended_at?: string
      duration_seconds?: number
    }
  ): Promise<void> {
    const syncRun = await universalApi.read({
      table: 'core_entities',
      filters: { id: syncRunId }
    })

    if (!syncRun.data[0]) {
      throw new Error('Sync run not found')
    }

    const currentMetadata = syncRun.data[0].metadata

    await universalApi.updateEntity({
      id: syncRunId,
      metadata: {
        ...currentMetadata,
        status: updates.status || currentMetadata.status,
        stats: updates.stats ? { ...currentMetadata.stats, ...updates.stats } : currentMetadata.stats,
        errors: updates.errors ? [...currentMetadata.errors, ...updates.errors] : currentMetadata.errors,
        logs: updates.logs ? [...currentMetadata.logs, ...updates.logs] : currentMetadata.logs,
        ended_at: updates.ended_at || currentMetadata.ended_at,
        duration_seconds: updates.duration_seconds || currentMetadata.duration_seconds
      }
    })
  }

  // Log sync activity
  static async logSyncActivity(
    syncRunId: string,
    level: SyncLog['level'],
    message: string,
    context?: any
  ): Promise<void> {
    const log: SyncLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    const syncRun = await universalApi.read({
      table: 'core_entities',
      filters: { id: syncRunId }
    })

    if (!syncRun.data[0]) {
      throw new Error('Sync run not found')
    }

    await universalApi.updateEntity({
      id: syncRunId,
      metadata: {
        ...syncRun.data[0].metadata,
        logs: [...(syncRun.data[0].metadata.logs || []), log]
      }
    })
  }

  // Record sync error
  static async recordSyncError(
    syncRunId: string,
    error: Omit<SyncError, 'timestamp'>
  ): Promise<void> {
    const syncError: SyncError = {
      ...error,
      timestamp: new Date().toISOString()
    }

    const syncRun = await universalApi.read({
      table: 'core_entities',
      filters: { id: syncRunId }
    })

    if (!syncRun.data[0]) {
      throw new Error('Sync run not found')
    }

    const currentMetadata = syncRun.data[0].metadata
    const errors = [...(currentMetadata.errors || []), syncError]
    const stats = {
      ...currentMetadata.stats,
      error_records: (currentMetadata.stats.error_records || 0) + 1
    }

    await universalApi.updateEntity({
      id: syncRunId,
      metadata: {
        ...currentMetadata,
        errors,
        stats
      }
    })
  }

  // Get sync jobs ready to run
  static async getJobsToRun(organizationId: string): Promise<SyncJob[]> {
    const now = new Date()

    const syncJobs = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_sync_job',
        organization_id: organizationId
      }
    })

    return syncJobs.data.filter(job => {
      const metadata = job.metadata as any
      
      // Only active jobs
      if (metadata.status !== 'active') return false
      
      // Manual jobs are not auto-run
      if (!metadata.schedule || metadata.schedule.type === 'manual') return false
      
      // Check if next run time has passed
      if (metadata.next_run && new Date(metadata.next_run) <= now) {
        return true
      }
      
      return false
    }) as SyncJob[]
  }

  // Update next run time after execution
  static async updateNextRunTime(syncJobId: string): Promise<void> {
    const syncJob = await universalApi.read({
      table: 'core_entities',
      filters: { id: syncJobId }
    })

    if (!syncJob.data[0]) {
      throw new Error('Sync job not found')
    }

    const metadata = syncJob.data[0].metadata as any
    const nextRun = metadata.schedule ? this.calculateNextRun(metadata.schedule) : null

    await universalApi.updateEntity({
      id: syncJobId,
      metadata: {
        ...metadata,
        last_run: {
          ...metadata.last_run,
          timestamp: new Date().toISOString()
        },
        next_run: nextRun
      }
    })
  }

  // Calculate retry delay with exponential backoff
  static calculateRetryDelay(retryCount: number, baseDelaySeconds: number): number {
    return Math.min(baseDelaySeconds * Math.pow(2, retryCount), 3600) // Max 1 hour
  }

  // Check if error threshold exceeded
  static isErrorThresholdExceeded(stats: SyncStats, threshold: number): boolean {
    if (stats.processed_records === 0) return false
    
    const errorRate = (stats.error_records / stats.processed_records) * 100
    return errorRate > threshold
  }

  // Create idempotency key for deduplication
  static createIdempotencyKey(
    connectorId: string,
    resource: string,
    recordId: string
  ): string {
    return `${connectorId}-${resource}-${recordId}`
  }
}