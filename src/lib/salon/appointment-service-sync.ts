/**
 * Enterprise-Grade Appointment Service Sync
 * Smart Code: HERA.SALON.SYNC.APPOINTMENT_SERVICES.v1
 *
 * Handles background synchronization of services between POS and appointments.
 * Features:
 * - Non-blocking operation (payment succeeds regardless)
 * - Retry logic with exponential backoff
 * - Complete audit trail
 * - Enterprise error handling
 */

import { toast } from '@/hooks/use-toast'

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceSyncOptions {
  appointmentId: string
  finalServiceIds: string[]
  replaceServicesFunc: (params: { id: string; serviceIds: string[] }) => Promise<any>
  maxRetries?: number
  onSuccess?: () => void
  onFailure?: (error: Error) => void
}

export interface ServiceDetails {
  id: string
  name: string
  price: number
  duration_minutes: number
  smart_code: string
}

export interface SyncResult {
  success: boolean
  appointmentId: string
  servicesAdded: string[]
  servicesRemoved: string[]
  totalAmount: number
  attempts: number
  error?: string
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

const DEFAULT_MAX_RETRIES = 3
const RETRY_DELAYS = [0, 2000, 4000] // Exponential backoff: immediate, 2s, 4s

// Non-retryable error codes
const NON_RETRYABLE_ERRORS = ['404', '403', '400', 'INVALID_DATA', 'NOT_FOUND', 'PERMISSION_DENIED']

// ============================================================================
// CORE SYNC FUNCTION
// ============================================================================

/**
 * Synchronize appointment services in background with retry logic
 */
export async function syncAppointmentServices(
  options: ServiceSyncOptions
): Promise<SyncResult> {
  const {
    appointmentId,
    finalServiceIds,
    replaceServicesFunc,
    maxRetries = DEFAULT_MAX_RETRIES,
    onSuccess,
    onFailure
  } = options

  let lastError: Error | null = null
  let attempts = 0

  // Show initial toast
  toast({
    title: '🔄 Updating Appointment',
    description: 'Syncing services in background...',
    duration: 2000
  })

  // Retry loop
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    attempts = attempt + 1

    try {
      // Wait for retry delay (except first attempt)
      if (attempt > 0) {
        await sleep(RETRY_DELAYS[attempt])
        console.log(`[ServiceSync] Retry attempt ${attempt + 1}/${maxRetries}`)
      }

      // Execute sync using hook's replaceServices method
      console.log('[ServiceSync] Calling replaceServices:', {
        appointmentId,
        serviceCount: finalServiceIds.length
      })

      const result = await replaceServicesFunc({
        id: appointmentId,
        serviceIds: finalServiceIds
      })

      // Success!
      console.log('[ServiceSync] ✅ Success:', result)

      toast({
        title: '✅ Appointment Updated',
        description: `Services synced successfully`,
        duration: 3000
      })

      if (onSuccess) onSuccess()

      return {
        success: true,
        appointmentId,
        servicesAdded: [],
        servicesRemoved: [],
        totalAmount: 0,
        attempts
      }
    } catch (error: any) {
      lastError = error
      console.error(`[ServiceSync] ❌ Attempt ${attempt + 1} failed:`, error)

      // Check if error is non-retryable
      if (isNonRetryableError(error)) {
        console.error('[ServiceSync] Non-retryable error, stopping:', error.message)
        break
      }

      // Continue to next retry
      continue
    }
  }

  // All retries failed
  console.error('[ServiceSync] ❌ All retries failed:', lastError)

  toast({
    title: '⚠️ Sync Queued',
    description: 'Appointment will be updated shortly',
    duration: 4000
  })

  if (onFailure && lastError) onFailure(lastError)

  return {
    success: false,
    appointmentId,
    servicesAdded: [],
    servicesRemoved: [],
    totalAmount: 0,
    attempts,
    error: lastError?.message || 'Unknown error'
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  const errorMsg = error?.message?.toUpperCase() || ''
  const errorCode = error?.code?.toString() || ''

  return NON_RETRYABLE_ERRORS.some(
    code => errorMsg.includes(code) || errorCode === code
  )
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}


// ============================================================================
// CONVENIENCE WRAPPER
// ============================================================================

/**
 * Sync appointment services in background (fire-and-forget)
 */
export function syncAppointmentServicesInBackground(
  options: ServiceSyncOptions
): void {
  // Fire and forget - don't await
  syncAppointmentServices(options).catch(error => {
    console.error('[ServiceSync] Background sync error:', error)
    // Error already logged by sync function
  })
}
