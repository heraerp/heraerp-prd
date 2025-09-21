/**
 * Enhanced Supabase Client with Organization Context for RLS
 * This client automatically sets organization context for all queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

// Use the singleton client instead of creating a new one
const getBaseClient = () => {
  return getSupabase()
}

/**
 * Enhanced Supabase client that automatically sets organization context
 * This ensures RLS policies work correctly by setting app.current_org_id
 */
export class SupabaseClientWithOrg {
  private client: SupabaseClient
  private organizationId: string | null = null

  constructor() {
    const client = getBaseClient()
    if (!client) {
      throw new Error('Supabase client not available')
    }
    this.client = client
  }

  /**
   * Set organization context for all subsequent queries
   */
  async setOrganizationContext(organizationId: string) {
    if (this.organizationId === organizationId) return // Already set

    this.organizationId = organizationId

    try {
      // Try to call the RPC function to set organization context
      const { error } = await this.client.rpc('set_current_org_id', {
        org_id: organizationId
      })

      if (error && error.code !== 'P0001') {
        console.warn('Could not set organization context via RPC:', error)
      }
    } catch (err) {
      console.warn('set_current_org_id RPC not available, using headers')
    }
  }

  /**
   * Enhanced from() method that automatically sets organization context
   */
  from(table: string) {
    const query = this.client.from(table)

    // If we have organization context, automatically filter by it for multi-tenant tables
    const multiTenantTables = [
      'core_entities',
      'core_dynamic_data',
      'core_relationships',
      'universal_transactions',
      'universal_transaction_lines'
    ]

    if (this.organizationId && multiTenantTables.includes(table)) {
      // For multi-tenant tables, always include organization filter
      return query.eq('organization_id', this.organizationId)
    }

    return query
  }

  /**
   * Enhanced RPC method that includes organization context
   */
  async rpc(functionName: string, params?: any) {
    // If we have organization context, ensure it's set before RPC call
    if (this.organizationId) {
      try {
        await this.client.rpc('set_current_org_id', {
          org_id: this.organizationId
        })
      } catch (err) {
        // Ignore if function doesn't exist
      }
    }

    return this.client.rpc(functionName, params)
  }

  /**
   * Get current organization context
   */
  getOrganizationId(): string | null {
    return this.organizationId
  }

  /**
   * Clear organization context
   */
  clearOrganizationContext() {
    this.organizationId = null
  }

  // Proxy all other methods to the base client
  get auth() {
    return this.client.auth
  }

  get storage() {
    return this.client.storage
  }

  get realtime() {
    return this.client.realtime
  }

  get rest() {
    return this.client.rest
  }
}

// Export singleton instance
let clientInstance: SupabaseClientWithOrg | null = null

export const getSupabaseWithOrgContext = (): SupabaseClientWithOrg => {
  if (!clientInstance) {
    clientInstance = new SupabaseClientWithOrg()
  }
  return clientInstance
}

// Helper function to create client with organization context from headers
export const createClientWithOrgFromHeaders = (headers?: Headers): SupabaseClientWithOrg => {
  const client = getSupabaseWithOrgContext()

  // Set organization from headers if available
  if (headers) {
    const orgId =
      headers.get('x-hera-org-id') ||
      headers.get('X-Organization-Id') ||
      process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID

    if (orgId) {
      client.setOrganizationContext(orgId)
    }
  }

  return client
}

// Export for backward compatibility
export const createClientComponentClient = () => getSupabaseWithOrgContext()
