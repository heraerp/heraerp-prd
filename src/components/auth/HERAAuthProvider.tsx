/**
 * HERA Authentication Provider
 * Pure HERA Authorization DNA implementation - replaces MultiOrgAuthProvider
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
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

  // Config knobs (env-overridable)
  const AUTH_INTROSPECT_FALLBACK_ENABLED =
    (process.env.NEXT_PUBLIC_AUTH_INTROSPECT_FALLBACK_ENABLED ?? 'true') !== 'false'
  const INTROSPECT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_INTROSPECT_TIMEOUT_MS || 2000)
  const CONTEXT_TTL_MS = Number(process.env.NEXT_PUBLIC_CONTEXT_TTL_MS || 5 * 60 * 1000)
  const CACHE_KEY = 'hera-auth-context-cache-v1'

  // In-memory cache for this tab (persists across renders)
  const memoryCacheRef = useRef<any>(null)

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
    // Subscribe to auth state changes to invalidate cache on sign-in/out/refresh
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 HERA Auth onAuthStateChange:', event, {
              hasSession: !!session
            })
          }
          clearCachedContext()
          initializeAuth()
        })
        unsubscribe = () => data.subscription.unsubscribe()
      } catch (_) {
        // no-op
      }
    })()

    // Re-validate on tab focus if cache expired
    const onFocus = () => {
      const cached = getCachedContext()
      if (!cached || Date.now() > cached.expiresAt) {
        clearCachedContext()
        initializeAuth()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
      }
      if (unsubscribe) unsubscribe()
    }
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

      // Only log once to avoid spam
      if (process.env.NODE_ENV === 'development' && !memoryCacheRef.current) {
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
          // Try cached context first (short TTL)
          const cached = getCachedContext()
          if (cached && cached.user_id === session.user.id && Date.now() < cached.expiresAt) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🗄️  HERA Auth: Using cached context', {
                source: cached.source,
                ttl_ms_remaining: cached.expiresAt - Date.now()
              })
            }
            applyResolvedContext(cached)
            return
          }

          // Try API introspection first (if deployed)
          try {
            const introspectRes = await fetchWithTimeout(
              '/api/v2/auth/introspect',
              {
                headers: { Authorization: `Bearer ${session.access_token}` },
                credentials: 'include'
              },
              INTROSPECT_TIMEOUT_MS
            )
            if (introspectRes.ok) {
              const info = await introspectRes.json()

              // Ensure attach is complete (idempotent)
              await fetch('/api/v2/auth/attach', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'x-hera-org-id': info.organization_id
                },
                credentials: 'include'
              })
                .then(r => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('✅ TX.AUTH_ATTACH_OK.V1')
                  }
                })
                .catch(() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('⚠️  TX.AUTH_ATTACH_FAIL.V1')
                  }
                })

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

              setCookie('HERA_ORG_ID', organization.id)

              const payload = {
                user_id: user.id,
                email: user.email,
                organization_id: organization.id,
                roles: info.roles || [user.role],
                permissions: info.permissions || [],
                source: 'server'
              }
              cacheContext(payload)
              applyResolvedContext(payload)
              return
            }
          } catch (_) {
            // Ignore and fallback to client-side resolution
          }

          // Fallback: resolve org/role/permissions client-side (no API dependency)
          if (AUTH_INTROSPECT_FALLBACK_ENABLED)
            try {
              const { resolveUserEntity } = await import('@/lib/security/user-entity-resolver')
              const resolution = await resolveUserEntity(session.user.id)
              if (resolution.success && resolution.data) {
                // Ensure attach endpoint runs if available (idempotent)
                fetch('/api/v2/auth/attach', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'x-hera-org-id': resolution.data.organizationId
                  },
                  credentials: 'include'
                })
                  .then(r => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ TX.AUTH_ATTACH_OK.V1')
                    }
                  })
                  .catch(() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('⚠️  TX.AUTH_ATTACH_FAIL.V1')
                    }
                  })

                const payload = {
                  user_id: resolution.data.userId,
                  email: session.user.email || '',
                  organization_id: resolution.data.organizationId,
                  roles: [resolution.data.salonRole || 'user'],
                  permissions: Array.isArray(resolution.data.permissions)
                    ? resolution.data.permissions
                    : [],
                  source: 'fallback'
                }
                cacheContext(payload)
                applyResolvedContext(payload)
                return
              }
            } catch (_) {
              // If resolution fails, fall through to unauthenticated
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
      clearCachedContext()

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

  // Fetch with timeout helper
  async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(input, { ...init, signal: controller.signal })
      return res
    } finally {
      clearTimeout(id)
    }
  }

  // Cache helpers
  function cacheContext(payload: {
    user_id: string
    email: string
    organization_id: string
    roles: string[]
    permissions: string[]
    source: 'server' | 'fallback'
  }) {
    const wrapped = {
      ...payload,
      expiresAt: Date.now() + CONTEXT_TTL_MS
    }
    memoryCacheRef.current = wrapped
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(wrapped))
      }
    } catch (_) {}
    if (process.env.NODE_ENV === 'development') {
      console.log('🧠 HERA Auth: Context cached', {
        source: payload.source,
        ttl_ms: CONTEXT_TTL_MS
      })
    }
  }

  function getCachedContext():
    | (ReturnType<typeof JSON.parse> & { expiresAt: number; source: string; user_id: string })
    | null {
    if (memoryCacheRef.current && Date.now() < memoryCacheRef.current.expiresAt)
      return memoryCacheRef.current
    try {
      if (typeof sessionStorage === 'undefined') return null
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed
    } catch (_) {
      return null
    }
  }

  function clearCachedContext() {
    memoryCacheRef.current = null
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(CACHE_KEY)
    } catch (_) {}
  }

  // Apply resolved context into provider state
  function applyResolvedContext(payload: {
    user_id: string
    email: string
    organization_id: string
    roles: string[]
    permissions: string[]
    source: 'server' | 'fallback'
  }) {
    const user: HERAUser = {
      id: payload.user_id,
      entity_id: payload.user_id,
      name: payload.email?.split('@')[0] || 'User',
      email: payload.email || '',
      role: payload.roles?.[0] || 'user',
      session_type: 'real',
      expires_at: new Date(Date.now() + 50 * 60 * 1000).toISOString()
    }
    const organization: HERAOrganization = {
      id: payload.organization_id,
      name: 'Organization',
      type: 'business',
      industry: 'services'
    }
    setCookie('HERA_ORG_ID', organization.id)
    setState(prev => ({
      ...prev,
      user,
      organization,
      isAuthenticated: true,
      isLoading: false,
      sessionType: 'real',
      scopes: payload.permissions || []
    }))
    if (process.env.NODE_ENV === 'development') {
      console.log(
        payload.source === 'fallback'
          ? '✅ TX.AUTH_INTROSPECT_FALLBACK.V1'
          : '✅ TX.AUTH_INTROSPECT_OK.V1',
        { source: payload.source }
      )
    }
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
