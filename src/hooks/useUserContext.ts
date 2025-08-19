import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

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
  const { session, isAuthenticated } = useAuth()
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserContext() {
      if (!isAuthenticated || !session?.access_token) {
        setUserContext(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/v1/auth/user-context', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
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

    fetchUserContext()
  }, [isAuthenticated, session])

  return {
    userContext,
    organizationId: userContext?.organization?.id,
    loading,
    error
  }
}