/**
 * HERA Authentication Provider
 * Pure HERA Authorization DNA implementation - replaces MultiOrgAuthProvider
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { demoAuthService, type DemoUserType } from '@/lib/auth/demo-auth-service'
import { useRouter } from 'next/navigation'

// HERA-native types following Authorization DNA
interface HERAUser {
  id: string
  entity_id: string
  name: string
  email: string
  role: string
  session_type: 'demo' | 'real'
  expires_at?: string
}

interface HERAOrganization {
  id: string
  name: string
  type: string
  industry: string
}

interface HERAAuthContext {
  // Authentication state
  user: HERAUser | null
  organization: HERAOrganization | null
  isAuthenticated: boolean
  isLoading: boolean

  // Authorization
  scopes: string[]
  hasScope: (scope: string) => boolean

  // Session info
  sessionType: 'demo' | 'real' | null
  timeRemaining: number // milliseconds
  isExpired: boolean

  // Actions
  initializeDemo: (demoType: DemoUserType) => Promise<boolean>
  logout: () => Promise<void>

  // Legacy compatibility helpers
  currentOrganization: HERAOrganization | null
  organizations: HERAOrganization[]
  contextLoading: boolean // Legacy compatibility for existing components
}

const HERAAuthContext = createContext<HERAAuthContext | undefined>(undefined)

interface HERAAuthProviderProps {
  children: ReactNode
}

export function HERAAuthProvider({ children }: HERAAuthProviderProps) {
  const router = useRouter()

  const [state, setState] = useState({
    user: null as HERAUser | null,
    organization: null as HERAOrganization | null,
    isAuthenticated: false,
    isLoading: true,
    scopes: [] as string[],
    sessionType: null as 'demo' | 'real' | null,
    timeRemaining: 0,
    isExpired: false
  })

  // Initialize on mount - check for existing sessions
  useEffect(() => {
    initializeAuth()
  }, [])

  // Session expiry timer
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

    // Update time remaining every second
    const intervalTimer = setInterval(() => {
      const currentTime = Date.now()
      const remaining = Math.max(0, expiryTime - currentTime)
      setState(prev => ({
        ...prev,
        timeRemaining: remaining,
        isExpired: remaining <= 0
      }))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(intervalTimer)
    }
  }, [state.user?.expires_at])

  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Check for HERA demo session cookie
      const sessionCookie = getCookie('hera-demo-session')

      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 HERA Auth: Checking session cookie:', {
          hasSessionCookie: !!sessionCookie,
          timestamp: new Date().toISOString()
        })
      }

      if (sessionCookie) {
        // Decode URL-encoded cookie value first
        const decodedCookie = decodeURIComponent(sessionCookie)
        const sessionData = JSON.parse(decodedCookie)

        // Check if session is expired
        const expiryTime = new Date(sessionData.expires_at).getTime()
        const now = Date.now()

        if (expiryTime > now) {
          console.log('🧬 HERA Auth: Restoring existing demo session')

          const user: HERAUser = {
            id: sessionData.user_id || sessionData.user_entity_id,
            entity_id: sessionData.entity_id || sessionData.user_entity_id || sessionData.user_id,
            name: 'Demo Receptionist',
            email: 'demo@herasalon.com',
            role: sessionData.role,
            session_type: 'demo',
            expires_at: sessionData.expires_at
          }

          // Try to get organization from multiple sources
          let organization: HERAOrganization | null = null

          // 1) First try cookie (check both possible names)
          const cookieOrgId = getCookie('HERA_ORG_ID') || getCookie('hera-organization-id')
          if (cookieOrgId) {
            console.log('📍 HERA Auth: Found organization in cookie:', cookieOrgId)
            organization = {
              id: cookieOrgId,
              name: 'Hair Talkz Salon (Demo)',
              type: 'salon',
              industry: 'beauty_services'
            }
            // Ensure the organization ID is saved
            setState(prev => ({ ...prev, organization }))
          } else if (sessionData.organization_id) {
            // 2) Use organization from session if available
            console.log(
              '📍 HERA Auth: Using organization from session:',
              sessionData.organization_id
            )
            organization = {
              id: sessionData.organization_id,
              name: 'Hair Talkz Salon (Demo)',
              type: 'salon',
              industry: 'beauty_services'
            }
            // Save to cookie for next time
            setCookie('HERA_ORG_ID', sessionData.organization_id)
          } else {
            // 3) Try to get from server
            console.log('🔍 HERA Auth: Fetching organization context from server...')
            try {
              const orgContext = await fetch('/api/auth/org-context', {
                cache: 'no-store',
                credentials: 'include' // Include cookies in the request
              }).then(r => r.json())
              if (orgContext?.organization?.id) {
                console.log('📍 HERA Auth: Got organization from server:', orgContext.organization)
                organization = orgContext.organization
                setCookie('HERA_ORG_ID', orgContext.organization.id)
              } else {
                console.error('❌ HERA Auth: No organization from server:', orgContext)
              }
            } catch (e) {
              console.error('❌ Failed to fetch org context:', e)
            }
          }

          if (!organization) {
            console.error('❌ HERA Auth: No organization found for user')
            setState(prev => ({
              ...prev,
              isLoading: false,
              isAuthenticated: false
            }))
            return
          }

          setState({
            user,
            organization,
            isAuthenticated: true,
            isLoading: false,
            scopes: sessionData.scopes || [],
            sessionType: 'demo',
            timeRemaining: expiryTime - now,
            isExpired: false
          })

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ HERA Auth: Session restored:', {
              orgId: organization.id,
              orgName: organization.name,
              userId: user.entity_id,
              timeRemaining: Math.round((expiryTime - now) / 1000) + 's'
            })
          }

          return
        } else {
          // Session expired, clean up
          await handleSessionExpiry()
          return
        }
      }

      // Check for real Supabase session
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (session?.access_token) {
          // Introspect via API v2 to get org/role/permissions
          const introspectRes = await fetch('/api/v2/auth/introspect', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            credentials: 'include'
          })
          if (introspectRes.ok) {
            const info = await introspectRes.json()

            // Ensure attach is complete (idempotent)
            await fetch('/api/v2/auth/attach', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
              credentials: 'include'
            }).catch(() => {})

            const user: HERAUser = {
              id: info.user_id,
              entity_id: info.user_id,
              name: info.email?.split('@')[0] || 'User',
              email: info.email || '',
              role: (info.roles && info.roles[0]) || 'user',
              session_type: 'real',
              expires_at: new Date(Date.now() + 50 * 60 * 1000).toISOString()
            }
            const organization: HERAOrganization = {
              id: info.organization_id,
              name: 'Organization',
              type: 'business',
              industry: 'services'
            }

            // Save org cookie for legacy consumers
            setCookie('HERA_ORG_ID', organization.id)

            setState(prev => ({
              ...prev,
              user,
              organization,
              isAuthenticated: true,
              isLoading: false,
              sessionType: 'real',
              scopes: info.permissions || []
            }))
            return
          }
        }
      } catch (e) {
        // Ignore and fall through to unauthenticated
      }

      // Default: not authenticated
      setState(prev => ({ ...prev, isAuthenticated: false, isLoading: false }))
    } catch (error) {
      console.error('💥 HERA Auth initialization error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false
      }))
    }
  }

  const initializeDemo = async (demoType: DemoUserType): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const result = await demoAuthService.initializeDemoSession(demoType)

      if (!result.success || !result.user) {
        setState(prev => ({ ...prev, isLoading: false }))
        return false
      }

      const user: HERAUser = {
        id: result.user.id,
        entity_id: result.user.entity_id,
        name: 'Demo Receptionist',
        email: 'demo@herasalon.com',
        role: result.user.role,
        session_type: 'demo',
        expires_at: result.user.expires_at
      }

      const organization: HERAOrganization = {
        id: result.user.organization_id,
        name: 'Hair Talkz Salon (Demo)',
        type: 'salon',
        industry: 'beauty_services'
      }

      // Save organization ID to cookie
      setCookie('HERA_ORG_ID', result.user.organization_id)

      const expiryTime = new Date(result.user.expires_at).getTime()
      const now = Date.now()

      setState({
        user,
        organization,
        isAuthenticated: true,
        isLoading: false,
        scopes: result.user.scopes,
        sessionType: 'demo',
        timeRemaining: expiryTime - now,
        isExpired: false
      })

      console.log('✅ HERA Auth: Demo session initialized', {
        user_id: user.entity_id,
        organization_id: organization.id,
        scopes_count: result.user.scopes.length
      })

      return true
    } catch (error) {
      console.error('💥 Demo initialization error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = async () => {
    try {
      await demoAuthService.clearDemoSession()

      // Clear the org cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'HERA_ORG_ID=; Path=/; Max-Age=0; SameSite=Lax'
      }

      setState({
        user: null,
        organization: null,
        isAuthenticated: false,
        isLoading: false,
        scopes: [],
        sessionType: null,
        timeRemaining: 0,
        isExpired: false
      })

      console.log('🧹 HERA Auth: Logged out')
      router.push('/')
    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }

  const handleSessionExpiry = async () => {
    console.log('⏰ HERA Auth: Session expired')
    // Clear the org cookie too
    if (typeof document !== 'undefined') {
      document.cookie = 'HERA_ORG_ID=; Path=/; Max-Age=0; SameSite=Lax'
    }
    await logout()
  }

  const hasScope = (requiredScope: string): boolean => {
    return demoAuthService.hasScope(requiredScope, state.scopes)
  }

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

  // Helper function to set cookie
  const setCookie = (name: string, value: string): void => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }

  const contextValue: HERAAuthContext = {
    // Core auth state
    user: state.user,
    organization: state.organization,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,

    // Authorization
    scopes: state.scopes,
    hasScope,

    // Session info
    sessionType: state.sessionType,
    timeRemaining: state.timeRemaining,
    isExpired: state.isExpired,

    // Actions
    initializeDemo,
    logout,

    // Legacy compatibility
    currentOrganization: state.organization,
    organizations: state.organization ? [state.organization] : [],
    contextLoading: state.isLoading // Legacy compatibility for existing components
  }

  return <HERAAuthContext.Provider value={contextValue}>{children}</HERAAuthContext.Provider>
}

// Hook to use HERA Auth context
export function useHERAAuth(): HERAAuthContext {
  const context = useContext(HERAAuthContext)
  if (context === undefined) {
    throw new Error('useHERAAuth must be used within a HERAAuthProvider')
  }
  return context
}

// Legacy compatibility hook
export function useMultiOrgAuth(): HERAAuthContext {
  console.warn('🚨 useMultiOrgAuth is deprecated. Use useHERAAuth instead.')
  return useHERAAuth()
}
