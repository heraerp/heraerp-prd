/**
 * Server-side organization utilities
 * Smart Code: HERA.LIB.SERVER.ORGS.V1
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/hera-database.types'

// Server-side Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface Organization {
  id: string
  organization_name: string
  organization_code: string
  organization_type: string | null
  settings?: any
  metadata?: any
  status: string
}

/**
 * Get organization by subdomain or custom domain
 * Uses the settings->subdomain field as per HERA DNA
 */
export async function getOrgByHostOrSubdomain(key: string): Promise<Organization | null> {
  try {
    // Try exact subdomain match first
    const { data: orgBySubdomain, error: subdomainError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('settings->>subdomain', key)
      .eq('status', 'active')
      .single()

    if (orgBySubdomain && !subdomainError) {
      return orgBySubdomain
    }

    // Try domains array if no subdomain match
    // This is more complex in Supabase, so we'll use RPC function if available
    const { data: orgByDomain, error: domainError } = await supabase
      .rpc('get_organization_by_subdomain', { p_subdomain: key })
      .single()

    if (orgByDomain && !domainError) {
      return orgByDomain
    }

    return null
  } catch (error) {
    console.error('Error fetching organization by subdomain:', error)
    return null
  }
}

/**
 * Check if a subdomain is available
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('settings->>subdomain', subdomain)
      .single()

    // If no data and error is PGRST116 (no rows), subdomain is available
    return !data && error?.code === 'PGRST116'
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return false
  }
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    // Get user's organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('core_entities')
      .select(
        `
        organization_id,
        metadata
      `
      )
      .eq('entity_type', 'user')
      .eq('metadata->>auth_user_id', userId)

    if (membershipError || !memberships) {
      console.error('Error fetching user memberships:', membershipError)
      return []
    }

    const orgIds = memberships.map(m => m.organization_id).filter(Boolean)

    if (orgIds.length === 0) {
      return []
    }

    // Get organization details
    const { data: organizations, error: orgsError } = await supabase
      .from('core_organizations')
      .select('*')
      .in('id', orgIds)
      .eq('status', 'active')

    if (orgsError || !organizations) {
      console.error('Error fetching organizations:', orgsError)
      return []
    }

    return organizations
  } catch (error) {
    console.error('Error getting user organizations:', error)
    return []
  }
}
