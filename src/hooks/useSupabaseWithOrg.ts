/**
 * React Hook for Supabase Client with Automatic Organization Context
 * This hook provides a Supabase client that automatically sets organization context
 * based on the current user's organization or URL parameters
 */

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseWithOrgContext, SupabaseClientWithOrg } from '@/lib/supabase-client-with-org'

interface UseSupabaseWithOrgOptions {
  organizationId?: string
  autoDetect?: boolean // Auto-detect from URL params or environment
}

export const useSupabaseWithOrg = (options?: UseSupabaseWithOrgOptions) => {
  const searchParams = useSearchParams()
  const client = useMemo(() => getSupabaseWithOrgContext(), [])

  // Determine organization ID
  const organizationId = useMemo(() => {
    if (options?.organizationId) {
      return options.organizationId
    }

    if (options?.autoDetect !== false) {
      // Try to get from URL parameters
      const urlOrgId = searchParams?.get('organization_id') || searchParams?.get('org')
      if (urlOrgId) return urlOrgId

      // Try to get from environment (default demo org)
      return process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || null
    }

    return null
  }, [options?.organizationId, options?.autoDetect, searchParams])

  // Set organization context when it changes
  useEffect(() => {
    if (organizationId) {
      client.setOrganizationContext(organizationId)
    } else {
      client.clearOrganizationContext()
    }
  }, [client, organizationId])

  return {
    client,
    organizationId,
    setOrganizationId: (newOrgId: string) => client.setOrganizationContext(newOrgId),
    clearOrganization: () => client.clearOrganizationContext()
  }
}

// Simplified hook for cases where you just want the client with default org
export const useSupabaseClient = () => {
  const { client } = useSupabaseWithOrg({ autoDetect: true })
  return client
}
