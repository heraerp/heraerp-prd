/**
 * Server-side Supabase Client with Organization Context
 * This handles organization context for server-side operations
 */

import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Create server-side Supabase client with organization context from headers
 */
export const createServerSupabaseClient = async () => {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Get organization context from headers
  const headersList = headers()
  const orgId =
    headersList.get('x-hera-org-id') ||
    headersList.get('X-Organization-Id') ||
    process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID

  // Set organization context if available
  if (orgId) {
    try {
      await client.rpc('set_current_org_id', { org_id: orgId })
    } catch (error) {
      console.warn('Could not set server organization context:', error)
    }
  }

  return { client, organizationId: orgId }
}

/**
 * Helper to create client with explicit organization context
 */
export const createServerClientWithOrg = async (organizationId: string) => {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Set organization context
  try {
    await client.rpc('set_current_org_id', { org_id: organizationId })
  } catch (error) {
    console.warn('Could not set organization context:', error)
  }

  return client
}

/**
 * Admin client for system operations (backwards compatibility)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export { createServerClient as createClient } from './supabase/create-server-client'
