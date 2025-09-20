/**
 * HERA Demo Authorization Hook
 * Client-side hook for demo session management with Authorization DNA
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { demoAuthService, type DemoUserType } from '@/lib/auth/demo-auth-service'
import { useRouter } from 'next/navigation'

interface DemoAuthState {
  isAuthenticated: boolean
  user: {
    entity_id: string
    organization_id: string
    role: string
    scopes: string[]
    expires_at: string
  } | null
  isLoading: boolean
  error: string | null
}

interface UseDemoAuth extends DemoAuthState {
  // Actions
  initializeDemo: (demoType: DemoUserType) => Promise<boolean>
  logout: () => Promise<void>
  hasScope: (scope: string) => boolean
  
  // Session info
  sessionExpiry: Date | null
  timeRemaining: number // milliseconds
  isExpired: boolean
}

export function useDemoAuth(): UseDemoAuth {
  const router = useRouter()
  
  const [state, setState] = useState<DemoAuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  })

  // Check for existing demo session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Set up session expiry timer
  useEffect(() => {
    if (!state.user?.expires_at) return

    const expiryTime = new Date(state.user.expires_at).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    if (timeUntilExpiry <= 0) {
      handleSessionExpiry()
      return
    }

    const timer = setTimeout(() => {
      handleSessionExpiry()
    }, timeUntilExpiry)

    return () => clearTimeout(timer)
  }, [state.user?.expires_at])

  const checkExistingSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Check for demo session cookie
      const sessionCookie = getCookie('hera_demo_session')
      
      if (sessionCookie) {
        const sessionData = JSON.parse(sessionCookie)
        
        // Check if session is expired
        const expiryTime = new Date(sessionData.expires_at).getTime()
        const now = Date.now()
        
        if (expiryTime > now) {
          console.log('🧬 HERA Demo: Existing session found', {
            entity_id: sessionData.user_entity_id,
            organization_id: sessionData.organization_id,
            role: sessionData.role,
            expires_at: sessionData.expires_at
          })

          setState({
            isAuthenticated: true,
            user: {
              entity_id: sessionData.user_entity_id,
              organization_id: sessionData.organization_id,
              role: sessionData.role,
              scopes: sessionData.scopes,
              expires_at: sessionData.expires_at
            },
            isLoading: false,
            error: null
          })
          return
        } else {
          // Session expired, clean up
          await handleSessionExpiry()
          return
        }
      }

      // No session found
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false,
        user: null,
        isLoading: false 
      }))

    } catch (error) {
      console.error('💥 Session check error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session check failed'
      }))
    }
  }, [])

  const initializeDemo = useCallback(async (demoType: DemoUserType): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const result = await demoAuthService.initializeDemoSession(demoType)
      
      if (!result.success) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: result.error || 'Demo initialization failed'
        }))
        return false
      }

      setState({
        isAuthenticated: true,
        user: result.user!,
        isLoading: false,
        error: null
      })

      // Redirect to demo dashboard
      if (result.redirect_url) {
        router.push(result.redirect_url)
      }

      return true

    } catch (error) {
      console.error('💥 Demo initialization error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      return false
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await demoAuthService.clearDemoSession()
      
      // Clear cookies
      document.cookie = 'hera_demo_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'hera_org_context=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      })

      console.log('🧹 Demo session logged out')
      
      // Redirect to home
      router.push('/')

    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }, [router])

  const handleSessionExpiry = useCallback(async () => {
    console.log('⏰ Demo session expired')
    await logout()
  }, [logout])

  const hasScope = useCallback((scope: string): boolean => {
    if (!state.user?.scopes) return false
    return demoAuthService.hasScope(scope, state.user.scopes)
  }, [state.user?.scopes])

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  // Calculate session expiry info
  const sessionExpiry = state.user?.expires_at ? new Date(state.user.expires_at) : null
  const timeRemaining = sessionExpiry ? sessionExpiry.getTime() - Date.now() : 0
  const isExpired = timeRemaining <= 0

  return {
    ...state,
    initializeDemo,
    logout,
    hasScope,
    sessionExpiry,
    timeRemaining,
    isExpired
  }
}