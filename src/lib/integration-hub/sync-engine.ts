import type { SyncJob, SyncRun, DataMapping, Connector } from '@/types/integration-hub'
import { universalApi } from '@/lib/universal-api'
import { MappingEngine } from './mapping-engine'
import { ConnectorFactory } from './connector-factory'

export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsSynced: number
  recordsFailed: number
  errors: Array<{
    recordId: string
    error: string
  }>
  duration: number
}

export class SyncEngine {
  static async runSync(
    organizationId: string,
    syncJob: SyncJob,
    mapping: DataMapping,
    sourceConnector: Connector,
    targetConnector: Connector
  ): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: Array<{ recordId: string; error: string }> = []
    let recordsProcessed = 0
    let recordsSynced = 0
    let recordsFailed = 0

    try {
      // Create sync run record
      const syncRun = await this.createSyncRun(organizationId, syncJob.id)

      // Fetch data from source
      const sourceData = await this.fetchSourceData(sourceConnector, mapping.mappingType)

      // Process each record
      for (const record of sourceData) {
        recordsProcessed++

        try {
          // Apply mapping
          const mappedData = MappingEngine.applyMapping(record, mapping)

          // Apply transformations
          const transformedData = this.applyTransformations(mappedData, mapping.transformations)

          // Sync to target
          await this.syncToTarget(targetConnector, transformedData, mapping.mappingType)

          recordsSynced++
        } catch (error) {
          recordsFailed++
          errors.push({
            recordId: record.id || String(recordsProcessed),
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // Update sync run status
      await this.updateSyncRun(syncRun.id, {
        status: errors.length === 0 ? 'success' : 'partial_success',
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        errors,
        endTime: new Date().toISOString()
      })

      // Update sync job stats
      await this.updateSyncJobStats(organizationId, syncJob.id, errors.length === 0)

      return {
        success: errors.length === 0,
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        errors,
        duration: Date.now() - startTime
      }
    } catch (error) {
      // Update sync run as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        errors: [{ recordId: 'sync_job', error: errorMessage }],
        duration: Date.now() - startTime
      }
    }
  }

  private static async createSyncRun(organizationId: string, syncJobId: string): Promise<SyncRun> {
    universalApi.setOrganizationId(organizationId)

    const result = await universalApi.createEntity({
      entity_type: 'integration_sync_run',
      entity_name: `Sync Run - ${new Date().toISOString()}`,
      smart_code: 'HERA.INTEGRATION.SYNC_RUN.v1',
      organization_id: organizationId
    })

    if (!result.success) {
      throw new Error('Failed to create sync run')
    }

    // Set dynamic fields
    await Promise.all([
      universalApi.setDynamicField(result.data.id, 'sync_job_id', syncJobId, 'text'),
      universalApi.setDynamicField(result.data.id, 'status', 'running', 'text'),
      universalApi.setDynamicField(result.data.id, 'start_time', new Date().toISOString(), 'text'),
      universalApi.setDynamicField(result.data.id, 'records_processed', 0, 'number'),
      universalApi.setDynamicField(result.data.id, 'records_synced', 0, 'number'),
      universalApi.setDynamicField(result.data.id, 'records_failed', 0, 'number')
    ])

    return {
      id: result.data.id,
      syncJobId,
      status: 'running',
      startTime: new Date().toISOString(),
      recordsProcessed: 0,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
      createdAt: result.data.created_at
    } as SyncRun
  }

  private static async updateSyncRun(syncRunId: string, updates: Partial<SyncRun>): Promise<void> {
    const fieldUpdates = []

    if (updates.status) {
      fieldUpdates.push(universalApi.setDynamicField(syncRunId, 'status', updates.status, 'text'))
    }
    if (updates.recordsProcessed !== undefined) {
      fieldUpdates.push(
        universalApi.setDynamicField(
          syncRunId,
          'records_processed',
          updates.recordsProcessed,
          'number'
        )
      )
    }
    if (updates.recordsSynced !== undefined) {
      fieldUpdates.push(
        universalApi.setDynamicField(syncRunId, 'records_synced', updates.recordsSynced, 'number')
      )
    }
    if (updates.recordsFailed !== undefined) {
      fieldUpdates.push(
        universalApi.setDynamicField(syncRunId, 'records_failed', updates.recordsFailed, 'number')
      )
    }
    if (updates.endTime) {
      fieldUpdates.push(
        universalApi.setDynamicField(syncRunId, 'end_time', updates.endTime, 'text')
      )
    }
    if (updates.errors) {
      fieldUpdates.push(
        universalApi.setDynamicField(syncRunId, 'errors', JSON.stringify(updates.errors), 'text')
      )
    }

    await Promise.all(fieldUpdates)
  }

  private static async updateSyncJobStats(
    organizationId: string,
    syncJobId: string,
    success: boolean
  ): Promise<void> {
    universalApi.setOrganizationId(organizationId)

    // Get current stats
    const fieldsResult = await universalApi.read({
      table: 'core_dynamic_data',
      filters: {
        entity_id: syncJobId,
        organization_id: organizationId
      }
    })

    const fields = fieldsResult.data || []
    const totalRuns = fields.find(f => f.field_name === 'total_runs')?.field_value_number || 0
    const successfulRuns =
      fields.find(f => f.field_name === 'successful_runs')?.field_value_number || 0
    const failedRuns = fields.find(f => f.field_name === 'failed_runs')?.field_value_number || 0

    // Update stats
    await Promise.all([
      universalApi.setDynamicField(syncJobId, 'last_run_at', new Date().toISOString(), 'text'),
      universalApi.setDynamicField(
        syncJobId,
        'last_status',
        success ? 'success' : 'failed',
        'text'
      ),
      universalApi.setDynamicField(syncJobId, 'total_runs', totalRuns + 1, 'number'),
      universalApi.setDynamicField(
        syncJobId,
        'successful_runs',
        success ? successfulRuns + 1 : successfulRuns,
        'number'
      ),
      universalApi.setDynamicField(
        syncJobId,
        'failed_runs',
        success ? failedRuns : failedRuns + 1,
        'number'
      )
    ])
  }

  private static async fetchSourceData(connector: Connector, resourceType: string): Promise<any[]> {
    // This would integrate with the actual connector API
    // For now, return mock data
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Tech Industries'
      }
    ]
  }

  private static applyTransformations(data: any, transformations: any[]): any {
    let result = data

    for (const transformation of transformations) {
      result = MappingEngine.applyTransformations(result, [transformation])
    }

    return result
  }

  private static async syncToTarget(
    connector: Connector,
    data: any,
    resourceType: string
  ): Promise<void> {
    // This would integrate with the actual connector API
    // For now, just simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  static async getScheduledJobs(organizationId: string): Promise<SyncJob[]> {
    universalApi.setOrganizationId(organizationId)

    const result = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_sync_job',
        organization_id: organizationId
      }
    })

    if (!result.success || !result.data) {
      return []
    }

    const syncJobs = await Promise.all(
      result.data.map(async entity => {
        const fieldsResult = await universalApi.read({
          table: 'core_dynamic_data',
          filters: {
            entity_id: entity.id,
            organization_id: organizationId
          }
        })

        const fields = fieldsResult.data || []
        const getFieldValue = (name: string) =>
          fields.find(f => f.field_name === name)?.field_value_text || ''
        const getFieldNumber = (name: string) =>
          fields.find(f => f.field_name === name)?.field_value_number || 0
        const getFieldBoolean = (name: string) =>
          fields.find(f => f.field_name === name)?.field_value_text === 'true'

        const isActive = getFieldBoolean('is_active')
        const schedule = getFieldValue('schedule')

        // Check if job should run based on schedule
        // This is simplified - in production, use a proper cron parser
        const shouldRun = isActive && this.shouldRunBasedOnSchedule(schedule)

        return {
          id: entity.id,
          name: entity.entity_name,
          mappingId: getFieldValue('mapping_id'),
          isActive,
          schedule,
          lastRunAt: getFieldValue('last_run_at'),
          nextRunAt: getFieldValue('next_run_at'),
          lastStatus: getFieldValue('last_status') as any,
          totalRuns: getFieldNumber('total_runs'),
          successfulRuns: getFieldNumber('successful_runs'),
          failedRuns: getFieldNumber('failed_runs'),
          createdAt: entity.created_at,
          shouldRun
        }
      })
    )

    return syncJobs.filter(job => job.shouldRun)
  }

  private static shouldRunBasedOnSchedule(schedule: string): boolean {
    // Simple schedule check - in production, use a proper cron parser
    if (schedule === 'realtime' || schedule === 'manual') {
      return false
    }

    // For now, always return true for other schedules
    return true
  }
}
