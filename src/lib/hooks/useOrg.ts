/**
 * Organization Context Hook
 * 
 * Priority resolution: Header > JWT claim > first active membership
 * Provides cached org context with 5-minute TTL
 * Integrates with middleware for automatic org ID injection
 */

'use client'

import { useMemo, useEffect, useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { resolveOrganizationContext, validateActorMembership } from '@/lib/org-context'

export interface OrganizationContext {
  id: string
  name: string
  settings: Record<string, any>
  ui_overrides: Record<string, any>
}

export interface UseOrgResult {
  orgId: string | null
  organization: OrganizationContext | null
  isLoading: boolean
  error: string | null
  isValidMember: boolean
}

export function useOrg(): UseOrgResult {
  const auth = useHERAAuth()
  const [orgContext, setOrgContext] = useState<OrganizationContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidMember, setIsValidMember] = useState(false)

  // Priority 1: Middleware-injected org ID (from window.__ORG_ID__)
  const middlewareOrgId = typeof window !== 'undefined' ? 
    (window as any).__ORG_ID__ : undefined

  // Priority 2: Header from response (X-Organization-Context)
  const [headerOrgId, setHeaderOrgId] = useState<string | null>(null)

  useEffect(() => {
    // Listen for organization context from response headers
    const checkHeaders = () => {
      const metaOrgId = document.querySelector('meta[name="x-organization-id"]')?.getAttribute('content')
      if (metaOrgId) {
        setHeaderOrgId(metaOrgId)
      }
    }

    checkHeaders()
    const interval = setInterval(checkHeaders, 1000) // Check every second
    return () => clearInterval(interval)
  }, [])

  // Priority 3: JWT claim from auth provider
  const jwtOrgId = auth?.user?.user_metadata?.organization_id

  // Priority 4: First active membership
  const membershipOrgId = auth?.memberships?.[0]?.organization_id

  // Resolve final org ID based on priority
  const resolvedOrgId = useMemo(() => {
    return middlewareOrgId || headerOrgId || jwtOrgId || membershipOrgId || null
  }, [middlewareOrgId, headerOrgId, jwtOrgId, membershipOrgId])

  // Resolve organization context when org ID changes
  useEffect(() => {
    if (!resolvedOrgId || !auth?.user) {
      setOrgContext(null)
      setIsValidMember(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setError(null)

    const resolveContext = async () => {
      try {
        const token = auth.session?.access_token
        if (!token) {
          throw new Error('No access token available')
        }

        // Resolve organization context
        const context = await resolveOrganizationContext(token, resolvedOrgId)
        
        if (isCancelled) return

        setOrgContext(context)

        // Validate membership
        const membershipValid = await validateActorMembership(token, resolvedOrgId)
        setIsValidMember(membershipValid)

        // Store in window for other components
        if (typeof window !== 'undefined') {
          (window as any).__ORG_ID__ = resolvedOrgId
          (window as any).__ORG_CONTEXT__ = context
        }

      } catch (err) {
        if (isCancelled) return
        console.error('Organization context resolution failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to resolve organization context')
        setOrgContext(null)
        setIsValidMember(false)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    resolveContext()

    return () => {
      isCancelled = true
    }
  }, [resolvedOrgId, auth?.user?.id, auth?.session?.access_token])

  return {
    orgId: resolvedOrgId,
    organization: orgContext,
    isLoading,
    error,
    isValidMember
  }
}

/**
 * Hook for getting organization ID only (lightweight version)
 * Useful when you just need the org ID without full context
 */
export function useOrgId(): string | null {
  const { orgId } = useOrg()
  return orgId
}

/**
 * Hook for organization-aware operations
 * Throws error if no org context available
 */
export function useRequiredOrg(): OrganizationContext {
  const { organization, isLoading, error } = useOrg()

  if (isLoading) {
    throw new Error('Organization context is loading')
  }

  if (error) {
    throw new Error(`Organization context error: ${error}`)
  }

  if (!organization) {
    throw new Error('No organization context available')
  }

  return organization
}

/**
 * Hook for checking organization membership
 * Returns true if current user is a valid member of resolved org
 */
export function useOrgMembership(): {
  isValidMember: boolean
  isLoading: boolean
  error: string | null
} {
  const { isValidMember, isLoading, error } = useOrg()
  
  return {
    isValidMember,
    isLoading,
    error
  }
}

/**
 * Utility function to get org ID synchronously from window
 * Useful for non-React contexts or when you need immediate access
 */
export function getCurrentOrgId(): string | null {
  if (typeof window === 'undefined') return null
  return (window as any).__ORG_ID__ || null
}

/**
 * Utility function to get org context synchronously from window
 * Useful for non-React contexts
 */
export function getCurrentOrgContext(): OrganizationContext | null {
  if (typeof window === 'undefined') return null
  return (window as any).__ORG_CONTEXT__ || null
}