/**
 * Appointment Sync Audit Logger
 * Smart Code: HERA.SALON.SYNC.AUDIT.v1
 *
 * Provides enterprise-grade audit trail for appointment service sync operations.
 * All sync events are logged for observability and debugging.
 */

// ============================================================================
// TYPES
// ============================================================================

export type SyncEventType =
  | 'sync_started'
  | 'sync_success'
  | 'sync_retry'
  | 'sync_failed'
  | 'sync_recovered'

export interface SyncEvent {
  type: SyncEventType
  appointmentId: string
  organizationId: string
  timestamp: string
  metadata: {
    originalServices?: string[]
    finalServices?: string[]
    servicesAdded?: string[]
    servicesRemoved?: string[]
    totalAmount?: number
    attempts?: number
    error?: string
    retryDelay?: number
  }
}

// ============================================================================
// SMART CODES
// ============================================================================

const SYNC_SMART_CODES = {
  started: 'HERA.SALON.SYNC.APPOINTMENT_SERVICES.STARTED.v1',
  success: 'HERA.SALON.SYNC.APPOINTMENT_SERVICES.SUCCESS.v1',
  retry: 'HERA.SALON.SYNC.APPOINTMENT_SERVICES.RETRY.v1',
  failed: 'HERA.SALON.SYNC.APPOINTMENT_SERVICES.FAILED.v1',
  recovered: 'HERA.SALON.SYNC.APPOINTMENT_SERVICES.RECOVERED.v1'
} as const

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log sync started event
 */
export async function logSyncStarted(params: {
  appointmentId: string
  organizationId: string
  originalServices: string[]
  finalServices: string[]
}): Promise<void> {
  const event: SyncEvent = {
    type: 'sync_started',
    appointmentId: params.appointmentId,
    organizationId: params.organizationId,
    timestamp: new Date().toISOString(),
    metadata: {
      originalServices: params.originalServices,
      finalServices: params.finalServices,
      servicesAdded: params.finalServices.filter(
        id => !params.originalServices.includes(id)
      ),
      servicesRemoved: params.originalServices.filter(
        id => !params.finalServices.includes(id)
      )
    }
  }

  await persistEvent(event, SYNC_SMART_CODES.started)
}

/**
 * Log sync success event
 */
export async function logSyncSuccess(params: {
  appointmentId: string
  organizationId: string
  servicesAdded: string[]
  servicesRemoved: string[]
  totalAmount: number
  attempts: number
}): Promise<void> {
  const event: SyncEvent = {
    type: 'sync_success',
    appointmentId: params.appointmentId,
    organizationId: params.organizationId,
    timestamp: new Date().toISOString(),
    metadata: {
      servicesAdded: params.servicesAdded,
      servicesRemoved: params.servicesRemoved,
      totalAmount: params.totalAmount,
      attempts: params.attempts
    }
  }

  await persistEvent(event, SYNC_SMART_CODES.success)

  // Log to console for immediate visibility
  console.log('✅ [SyncAudit] Success:', {
    appointment: params.appointmentId,
    added: params.servicesAdded.length,
    removed: params.servicesRemoved.length,
    amount: params.totalAmount,
    attempts: params.attempts
  })
}

/**
 * Log sync retry event
 */
export async function logSyncRetry(params: {
  appointmentId: string
  organizationId: string
  attempt: number
  error: string
  retryDelay: number
}): Promise<void> {
  const event: SyncEvent = {
    type: 'sync_retry',
    appointmentId: params.appointmentId,
    organizationId: params.organizationId,
    timestamp: new Date().toISOString(),
    metadata: {
      attempts: params.attempt,
      error: params.error,
      retryDelay: params.retryDelay
    }
  }

  await persistEvent(event, SYNC_SMART_CODES.retry)

  // Log to console for immediate visibility
  console.warn(`⚠️ [SyncAudit] Retry #${params.attempt}:`, {
    appointment: params.appointmentId,
    error: params.error,
    nextRetry: `${params.retryDelay}ms`
  })
}

/**
 * Log sync failed event (after all retries exhausted)
 */
export async function logSyncFailed(params: {
  appointmentId: string
  organizationId: string
  error: string
  attempts: number
}): Promise<void> {
  const event: SyncEvent = {
    type: 'sync_failed',
    appointmentId: params.appointmentId,
    organizationId: params.organizationId,
    timestamp: new Date().toISOString(),
    metadata: {
      error: params.error,
      attempts: params.attempts
    }
  }

  await persistEvent(event, SYNC_SMART_CODES.failed)

  // Log to console for immediate visibility
  console.error('❌ [SyncAudit] Failed:', {
    appointment: params.appointmentId,
    error: params.error,
    attempts: params.attempts
  })

  // TODO: Send notification to admin for manual review
  await notifyAdminOfFailure(params)
}

/**
 * Log sync recovered event (succeeded after initial failures)
 */
export async function logSyncRecovered(params: {
  appointmentId: string
  organizationId: string
  attempts: number
  totalAmount: number
}): Promise<void> {
  const event: SyncEvent = {
    type: 'sync_recovered',
    appointmentId: params.appointmentId,
    organizationId: params.organizationId,
    timestamp: new Date().toISOString(),
    metadata: {
      attempts: params.attempts,
      totalAmount: params.totalAmount
    }
  }

  await persistEvent(event, SYNC_SMART_CODES.recovered)

  // Log to console for immediate visibility
  console.log('🔄 [SyncAudit] Recovered:', {
    appointment: params.appointmentId,
    attempts: params.attempts,
    amount: params.totalAmount
  })
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Persist event to database for audit trail
 * Uses console.log as fallback if database write fails
 */
async function persistEvent(event: SyncEvent, smartCode: string): Promise<void> {
  try {
    // Log to console immediately
    console.log(`📝 [SyncAudit] ${event.type}:`, event)

    // TODO: Persist to database using universal_transactions
    // This would create an audit record that can be queried later
    // For now, we rely on console logs which are captured by logging infrastructure

    /*
    Example implementation:

    await fetch('/api/v2/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        transaction_type: 'AUDIT_LOG',
        smart_code: smartCode,
        source_entity_id: event.appointmentId,
        organization_id: event.organizationId,
        metadata: {
          event_type: event.type,
          ...event.metadata
        }
      })
    })
    */
  } catch (error) {
    // Non-critical - logging failure should not break the sync
    console.error('[SyncAudit] Failed to persist event:', error)
  }
}

// ============================================================================
// ADMIN NOTIFICATIONS
// ============================================================================

/**
 * Notify admin of sync failure requiring manual review
 */
async function notifyAdminOfFailure(params: {
  appointmentId: string
  organizationId: string
  error: string
  attempts: number
}): Promise<void> {
  try {
    console.error('🚨 [SyncAudit] Admin notification:', params)

    // TODO: Implement actual notification system
    // Options:
    // 1. Create a notification entity in database
    // 2. Send email to admin
    // 3. Create Slack/Teams notification
    // 4. Add to admin review queue

    /*
    Example implementation:

    await fetch('/api/notifications/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sync_failure',
        severity: 'high',
        title: 'Appointment Service Sync Failed',
        description: `Failed to sync services for appointment ${params.appointmentId} after ${params.attempts} attempts`,
        metadata: params,
        actions: [
          {
            label: 'Retry Manually',
            url: `/admin/sync-failures/${params.appointmentId}`
          },
          {
            label: 'View Appointment',
            url: `/salon/appointments/${params.appointmentId}`
          }
        ]
      })
    })
    */
  } catch (error) {
    console.error('[SyncAudit] Failed to notify admin:', error)
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Query sync events for an appointment
 */
export async function getAppointmentSyncHistory(
  appointmentId: string,
  organizationId: string
): Promise<SyncEvent[]> {
  try {
    // TODO: Implement actual database query
    // For now, return empty array - events are in console logs

    /*
    Example implementation:

    const response = await fetch('/api/v2/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'READ',
        transaction_type: 'AUDIT_LOG',
        filters: {
          source_entity_id: appointmentId,
          organization_id: organizationId,
          smart_code_pattern: 'HERA.SALON.SYNC.APPOINTMENT_SERVICES.%.v1'
        }
      })
    })

    const data = await response.json()
    return data.items.map(transformToSyncEvent)
    */

    return []
  } catch (error) {
    console.error('[SyncAudit] Failed to query sync history:', error)
    return []
  }
}

/**
 * Get failed syncs requiring admin review
 */
export async function getFailedSyncs(
  organizationId: string
): Promise<SyncEvent[]> {
  try {
    // TODO: Implement actual database query
    // Should return all sync_failed events that haven't been resolved

    /*
    Example implementation:

    const response = await fetch('/api/v2/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'READ',
        transaction_type: 'AUDIT_LOG',
        filters: {
          organization_id: organizationId,
          smart_code: SYNC_SMART_CODES.failed,
          status: 'pending' // Not yet resolved
        }
      })
    })

    const data = await response.json()
    return data.items.map(transformToSyncEvent)
    */

    return []
  } catch (error) {
    console.error('[SyncAudit] Failed to query failed syncs:', error)
    return []
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get sync success rate for analytics
 */
export async function getSyncSuccessRate(
  organizationId: string,
  dateRange: { from: string; to: string }
): Promise<{
  total: number
  successful: number
  failed: number
  successRate: number
}> {
  try {
    // TODO: Implement actual analytics query
    // Should aggregate sync events by success/failure

    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0
    }
  } catch (error) {
    console.error('[SyncAudit] Failed to calculate success rate:', error)
    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0
    }
  }
}
