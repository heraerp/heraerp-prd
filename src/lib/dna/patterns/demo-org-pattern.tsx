/**
 * HERA DNA Pattern: Demo Organization Loading
 *
 * CRITICAL LEARNINGS:
 * 1. DO NOT provide fallback organization ID - infinite loading is a good debugging symptom
 * 2. The loading logic bug was: isAuthenticated ? isLoadingOrgs : !demoOrg
 *    - This caused infinite loading when demoOrg was null
 *    - Fixed by: isAuthenticated ? isLoadingOrgs : false
 * 3. Load demo org only when not authenticated
 * 4. Always show organization info in UI for transparency
 * 5. Add proper error states when no org is found
 *
 * This pattern properly handles demo org loading without masking issues
 */

import { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { getDemoOrganizationInfo } from '@/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'

export function useDemoOrganization() {
  const pathname = usePathname()
  const { currentOrganization, isLoadingOrgs, isAuthenticated } = useMultiOrgAuth()
  const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)
  const [demoOrgLoading, setDemoOrgLoading] = useState(true)

  // CRITICAL: No fallback - let the component handle missing org
  const organizationId = currentOrganization?.id || demoOrg?.id || ''
  const organizationName = currentOrganization?.organization_name || demoOrg?.name || ''

  // CRITICAL FIX: The bug was using !demoOrg which caused infinite loading
  // Correct logic: only show loading for authenticated users who are loading orgs
  const orgLoading = isAuthenticated ? isLoadingOrgs : false

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        setDemoOrgLoading(true)
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
          console.log('Demo organization loaded:', orgInfo)
        }
        setDemoOrgLoading(false)
      } else {
        setDemoOrgLoading(false)
      }
    }
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])

  return {
    organizationId,
    organizationName,
    orgLoading: orgLoading || (!isAuthenticated && demoOrgLoading),
    hasOrganization: !!organizationId,
    isDemo: !isAuthenticated
  }
}

/**
 * Standard Organization Display Component
 * Always show org info for transparency
 */
export function OrganizationInfo({
  name,
  id,
  className = ''
}: {
  name: string
  id: string
  className?: string
}) {
  const baseClasses =
    'mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 inline-block'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <div className={combinedClasses}>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="text-gray-500 dark:text-gray-500">Organization:</span>{' '}
        <span className="font-medium text-gray-900 dark:text-white">{name}</span>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Organization ID: {id}</p>
    </div>
  )
}

/**
 * Standard Loading State Component
 */
export function OrganizationLoading({ message = 'Loading organization...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  )
}
