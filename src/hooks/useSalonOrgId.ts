import { useEffect, useState } from 'react'
import { getSalonOrgId, HAIRTALKZ_ORG_ID } from '@/lib/constants/salon'

/**
 * Hook to get the current salon organization ID
 * This centralizes org ID detection logic
 */
export function useSalonOrgId() {
  const [orgId, setOrgId] = useState<string>(HAIRTALKZ_ORG_ID)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get org ID from hostname or path
      const detectedOrgId = getSalonOrgId(window.location.hostname, window.location.pathname)

      // Also check localStorage for override
      const storedOrgId = localStorage.getItem('organizationId')

      // Priority: stored > detected > default
      const finalOrgId = storedOrgId || detectedOrgId || HAIRTALKZ_ORG_ID

      console.log('Organization ID detection:', {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        detected: detectedOrgId,
        stored: storedOrgId,
        final: finalOrgId
      })

      setOrgId(finalOrgId)
      setIsLoading(false)
    }
  }, [])

  return { orgId, isLoading }
}
