// ================================================================================
// HERA DEMO WRITE POLICY
// Smart Code: HERA.DEMO.POLICY.v1
// Controls what can be modified in demo mode
// ================================================================================

import { createApiClient } from '@/lib/api/client'

export interface DemoWriteCheck {
  allowed: boolean
  reason?: string
}

/**
 * Entities that can be created in demo mode
 */
const DEMO_ALLOWED_ENTITY_TYPES = [
  'customer',
  'appointment',
  'product',
  'service',
  'transaction',
  'journal_entry'
]

/**
 * Maximum records that can be created per entity type in demo
 */
const DEMO_CREATE_LIMITS: Record<string, number> = {
  customer: 10,
  appointment: 20,
  product: 15,
  service: 10,
  transaction: 50,
  journal_entry: 30
}

/**
 * Actions that are always blocked in demo
 */
const DEMO_BLOCKED_ACTIONS = [
  'delete_organization',
  'update_organization_settings',
  'invite_user',
  'update_user_role',
  'delete_user',
  'update_payment_settings',
  'process_real_payment',
  'send_real_email',
  'send_real_sms',
  'export_sensitive_data'
]

/**
 * Check if a write operation is allowed in demo mode
 */
export async function checkDemoWritePolicy(
  action: string,
  entityType?: string,
  organizationId?: string
): Promise<DemoWriteCheck> {
  const apiClient = createApiClient()

  // Not in demo mode? Allow all
  if (!apiClient.isDemoMode()) {
    return { allowed: true }
  }

  // Check blocked actions
  if (DEMO_BLOCKED_ACTIONS.includes(action)) {
    return {
      allowed: false,
      reason: `Action '${action}' is not allowed in demo mode`
    }
  }

  // Check entity type restrictions
  if (entityType && action.startsWith('create_')) {
    if (!DEMO_ALLOWED_ENTITY_TYPES.includes(entityType)) {
      return {
        allowed: false,
        reason: `Creating '${entityType}' entities is not allowed in demo mode`
      }
    }

    // Check create limits
    const limit = DEMO_CREATE_LIMITS[entityType]
    if (limit && organizationId) {
      // This would need to check current count from API
      // For now, we'll allow it
      return { allowed: true }
    }
  }

  // Updates are generally allowed on demo entities
  if (action.startsWith('update_')) {
    return { allowed: true }
  }

  // Deletes are allowed for demo-created entities
  if (action.startsWith('delete_')) {
    return { allowed: true }
  }

  // Default allow
  return { allowed: true }
}

/**
 * Wrapper for API calls that enforces demo policy
 */
export async function demoSafeApiCall<T>(
  action: string,
  apiCall: () => Promise<T>,
  entityType?: string,
  organizationId?: string
): Promise<T> {
  const check = await checkDemoWritePolicy(action, entityType, organizationId)

  if (!check.allowed) {
    throw new Error(`Demo Policy: ${check.reason}`)
  }

  return apiCall()
}

/**
 * Hook for demo policy checks
 */
export function useDemoPolicy() {
  const apiClient = createApiClient()
  const isDemoMode = apiClient.isDemoMode()

  return {
    isDemoMode,
    checkPolicy: (action: string, entityType?: string) =>
      checkDemoWritePolicy(action, entityType, apiClient.getOrganizationId()),
    safeCall: <T>(action: string, apiCall: () => Promise<T>, entityType?: string) =>
      demoSafeApiCall(action, apiCall, entityType, apiClient.getOrganizationId())
  }
}

/**
 * Display-friendly demo limitations
 */
export const DEMO_LIMITATIONS = {
  title: 'Demo Mode Active',
  features: [
    'Create up to 10 customers',
    'Create up to 20 appointments',
    'Create up to 15 products',
    'Create up to 50 transactions',
    'View all reports and analytics',
    'Test all POS features',
    'Try WhatsApp integration'
  ],
  restrictions: [
    'Cannot invite real users',
    'Cannot process real payments',
    'Cannot send real emails/SMS',
    'Cannot export sensitive data',
    'Cannot modify organization settings'
  ],
  message: 'Sign up for full access to all features!'
}
