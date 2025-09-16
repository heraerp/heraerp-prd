import { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'

interface UserContext {
  user: {
    id: string
    email: string
    name: string
    supabase_id: string
    role: string
    department?: string
    phone?: string
  }
  organization: {
    id: string
    name: string
  }
  permissions: string[]
}

export function useUserContext() {
  const { session, isAuthenticated } = useMultiOrgAuth()
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserContext = async (orgId?: string) => {
    if (!isAuthenticated || !session?.access_token) {
      setUserContext(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = orgId
        ? `/api/v1/auth/user-context?organization_id=${orgId}`
        : '/api/v1/auth/user-context'

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load user context')
      }

      const context = await response.json()
      setUserContext(context)
    } catch (err) {
      console.error('Failed to fetch user context:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUserContext(null)
    } finally {
      setLoading(false)
    }
  }

  const switchOrganization = async (organizationId: string): Promise<boolean> => {
    if (!session?.access_token) return false

    try {
      const response = await fetch('/api/v1/auth/switch-organization', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organization_id: organizationId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to switch organization')
      }

      // Refresh the user context with the new organization
      await fetchUserContext(organizationId)
      return true
    } catch (err) {
      console.error('Failed to switch organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch organization')
      return false
    }
  }

  useEffect(() => {
    fetchUserContext()
  }, [isAuthenticated, session])

  return {
    userContext,
    organizationId: userContext?.organization?.id,
    loading,
    error,
    switchOrganization
  }
}
