'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import {
  getOrganizationContextFromURL,
  DEMO_ORGANIZATIONS,
  AppType
} from '@/lib/organization-context-client'

export interface OrganizationInfo {
  organizationId: string
  organizationName: string
  isDemo: boolean
  subdomain: string | null
}

/**
 * Hook to get the current organization context
 *
 * Priority order:
 * 1. If authenticated and has currentOrganization from MultiOrgAuth, use that
 * 2. If on a custom subdomain (e.g., mario.heraerp.com), use subdomain org
 * 3. If on a demo route (e.g., /salon), use demo organization
 * 4. Otherwise, return null
 */
export function useOrganizationContext(): {
  organization: OrganizationInfo | null
  isLoading: boolean
  error: string | null
} {
  const pathname = usePathname()
  const { currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const determineOrganization = () => {
      try {
        setIsLoading(true)
        setError(null)

        // Priority 1: Use authenticated organization if available
        if (!authLoading && isAuthenticated && currentOrganization) {
          setOrganization({
            organizationId: currentOrganization.id,
            organizationName: currentOrganization.name,
            isDemo: false,
            subdomain: currentOrganization.subdomain || null
          })
          return
        }

        // Priority 2 & 3: Check subdomain and demo routes
        if (typeof window === 'undefined') {
          // Server-side rendering - cannot access window
          setOrganization(null)
          return
        }
        const host = window.location.host
        const context = getOrganizationContextFromURL(host, pathname)

        if (context) {
          setOrganization({
            organizationId: context.organizationId,
            organizationName: context.organizationName || 'Demo Organization',
            isDemo: context.isDemo,
            subdomain: context.subdomain
          })
        } else {
          // No organization context available
          setOrganization(null)
        }
      } catch (err) {
        console.error('Error determining organization:', err)
        setError('Failed to determine organization context')
        setOrganization(null)
      } finally {
        setIsLoading(false)
      }
    }

    determineOrganization()
  }, [pathname, currentOrganization, isAuthenticated, authLoading])

  return { organization, isLoading, error }
}

/**
 * Hook to check if current route is a demo route
 */
export function useIsDemo(): boolean {
  const { organization } = useOrganizationContext()
  return organization?.isDemo || false
}

/**
 * Hook to get the demo organization ID for a specific app type
 */
export function useDemoOrganizationId(appType: AppType): string | null {
  return DEMO_ORGANIZATIONS[appType] || null
}
