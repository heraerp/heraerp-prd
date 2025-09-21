import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

/**
 * Production-ready Supabase client with organization context support
 * This wrapper ensures RLS policies work correctly by setting the organization context
 */

// Store the current organization context
let currentOrgId: string | null = null

/**
 * Get a Supabase client configured for a specific organization
 * This reuses the singleton client but sets headers for organization context
 */
export function getSupabaseWithOrg(organizationId?: string): SupabaseClient {
  const baseClient = getSupabase()

  // If no organization ID, return base client
  if (!organizationId) {
    return baseClient
  }

  // Update the organization context if different
  if (currentOrgId !== organizationId) {
    currentOrgId = organizationId

    // Set custom headers on the existing client
    // Note: This modifies the singleton client's headers
    if (baseClient && typeof baseClient.rest !== 'undefined') {
      // Update headers for REST API calls
      const restClient = (baseClient as any).rest
      if (restClient && restClient.headers) {
        restClient.headers['X-Organization-Id'] = organizationId
      }

      // Update headers for Realtime if needed
      const realtimeClient = (baseClient as any).realtime
      if (realtimeClient && realtimeClient.headers) {
        realtimeClient.headers['X-Organization-Id'] = organizationId
      }
    }
  }

  return baseClient
}

/**
 * Set organization context for a Supabase query
 * HERA DNA AUTH: No longer needed since we use JWT-based RLS policies
 * This is kept for backwards compatibility but does nothing
 */
export async function setOrgContext(client: SupabaseClient, organizationId: string): Promise<void> {
  // HERA DNA AUTH: JWT-based RLS policies handle organization isolation automatically
  // No need to set session variables anymore
  return Promise.resolve()
}

/**
 * Execute a query with organization context
 * This ensures RLS policies work correctly
 */
export async function queryWithOrgContext<T>(
  organizationId: string,
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = getSupabaseWithOrg(organizationId)

  // Try to set organization context
  await setOrgContext(client, organizationId)

  // Execute the query
  return queryFn(client)
}

/**
 * Clear organization context (useful for testing or when switching organizations)
 */
export function clearOrgClientCache(): void {
  currentOrgId = null
}
