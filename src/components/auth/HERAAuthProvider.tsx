/**
 * HERA Authentication Provider
 * Pure HERA v2.2 "Authenticated Actor Everywhere" implementation
 * Replaces legacy demo authentication with proper Supabase auth
 */

'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createSecurityContextFromAuth } from '@/lib/security/user-entity-resolver'
import type { SecurityContext } from '@/lib/security/database-context'
import { getSafeOrgConfig, setSafeOrgContext } from '@/lib/salon/safe-org-loader'
import { normalizeRole, type AppRole } from '@/lib/auth/role-normalizer'

type HeraStatus = 'idle' | 'resolving' | 'authenticated' | 'error'

// HERA v2.2 native types
interface HERAUser {
  id: string              // Supabase UID
  entity_id: string       // HERA USER entity ID in tenant org
  name: string
  email: string
  role: string
}

interface HERAOrganization {
  id: string              // Tenant organization row ID
  entity_id: string       // HERA ORG entity ID in tenant org
  name: string
  type: string
  industry: string
  code?: string           // Organization code
  primary_role?: string   // User's primary role in this org
  roles?: string[]        // All roles user has in this org
  user_role?: string      // Alias for primary_role
  apps?: HERAApp[]        // Apps available in this org
  settings?: Record<string, any>  // Organization settings
  joined_at?: string      // When user joined
  is_owner?: boolean      // Quick ownership check
  is_admin?: boolean      // Quick admin check
}

interface HERAApp {
  code: string           // App code (SALON, CASHEW, CRM, etc.)
  name: string           // Display name
  config: Record<string, any>  // App configuration
}

interface HERAAuthContext {
  // Authentication state
  user: HERAUser | null
  organization: HERAOrganization | null
  isAuthenticated: boolean
  isLoading: boolean
  status: HeraStatus
  userEntityId?: string
  organizationId?: string

  // Authorization
  scopes: string[]
  hasScope: (scope: string) => boolean
  role?: 'owner' | 'manager' | 'staff' | 'receptionist' | 'user'

  // Dynamic Apps (NEW)
  availableApps: HERAApp[]
  defaultApp: string | null
  currentApp: string | null

  // Actions
  login: (email: string, password: string, options?: { clearFirst?: boolean }) => Promise<{
    user: any
    session: any
    organizationId: string
    role: string
    userEntityId: string
    membershipData: any
  }>
  register: (email: string, password: string, metadata?: any) => Promise<any>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  clearSession: () => Promise<void>  // NEW

  // App Helpers (NEW)
  hasApp: (appCode: string) => boolean
  getAppConfig: (appCode: string) => Record<string, any> | null

  // Organization Switching (NEW)
  switchOrganization: (orgId: string) => void

  // Legacy compatibility helpers
  currentOrganization: HERAOrganization | null
  organizations: HERAOrganization[]
  contextLoading: boolean
}

const HERAAuthContext = createContext<HERAAuthContext | undefined>(undefined)

interface HERAAuthProviderProps {
  children: ReactNode
}

export function HERAAuthProvider({ children }: HERAAuthProviderProps) {
  const router = useRouter()
  const didResolveRef = useRef(false) // prevents double work in dev StrictMode
  const subRef = useRef<ReturnType<any> | null>(null)
  const ctxRef = useRef<{
    user: HERAUser | null
    organization: HERAOrganization | null
    isAuthenticated: boolean
  }>({
    user: null,
    organization: null,
    isAuthenticated: false
  })

  const [ctx, setCtx] = useState<{
    status: HeraStatus
    user: HERAUser | null
    organization: HERAOrganization | null
    isAuthenticated: boolean
    isLoading: boolean
    scopes: string[]
    userEntityId?: string
    organizationId?: string
    role?: 'owner' | 'manager' | 'staff' | 'receptionist' | 'user'
    availableApps: HERAApp[]
    defaultApp: string | null
    currentApp: string | null
    organizations: HERAOrganization[]  // NEW: Store all organizations
  }>({
    status: 'idle',
    user: null,
    organization: null,
    isAuthenticated: false,
    isLoading: true,
    scopes: [],
    userEntityId: undefined,
    organizationId: undefined,
    role: undefined,
    availableApps: [],
    defaultApp: null,
    currentApp: null,
    organizations: []  // NEW: Initialize empty
  })

  // Keep ref in sync with state
  useEffect(() => {
    ctxRef.current = {
      user: ctx.user,
      organization: ctx.organization,
      isAuthenticated: ctx.isAuthenticated
    }
  }, [ctx.user, ctx.organization, ctx.isAuthenticated])

  // Initialize authentication on mount
  useEffect(() => {
    // Ensure single subscription per mount
    if (subRef.current) return

    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        subRef.current = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 HERA Auth state change:', event, {
            hasSession: !!session,
            didResolve: didResolveRef.current,
            currentUser: ctxRef.current.user?.email
          })

          // Handle session state changes
          if (didResolveRef.current) {
            // If session disappeared, reset context AND clear salon cache
            if (!session) {
              console.log('🔐 Session disappeared, resetting context')

              // ✅ CLEAR SALON CACHE when session ends (prevents stale role)
              if (typeof window !== 'undefined') {
                const salonKeys = ['salonRole', 'salonUserName', 'salonUserEmail', 'salonOrgId']
                salonKeys.forEach(key => {
                  localStorage.removeItem(key)
                })
                console.log('🧹 Cleared salon cache on session end')
              }

              didResolveRef.current = false
              setCtx({
                status: 'idle',
                user: null,
                organization: null,
                isAuthenticated: false,
                isLoading: false,
                scopes: [],
                userEntityId: undefined,
                organizationId: undefined,
                role: undefined,
                availableApps: [],
                defaultApp: null,
                currentApp: null,
                organizations: []  // NEW: Reset organizations
              })
              return
            }
            // ✅ SMART RE-RESOLUTION: Allow re-resolution when context is missing
            // This handles page navigation/reload while preventing infinite loops
            if (session && !ctxRef.current.user) {
              console.log('🔄 Session exists but context missing, re-resolving...')
              didResolveRef.current = false
              // Fall through to resolution logic below
            } else if (session && ctxRef.current.user && !ctxRef.current.organization) {
              // Session and user exist but organization missing - allow re-resolution
              console.log('🔄 Session and user exist but organization missing, re-resolving...')
              didResolveRef.current = false
              // Fall through to resolution logic below
            } else {
              // Session exists and context is valid, no action needed
              console.log('✅ Session and context both valid, no re-resolution needed')
              return
            }
          }

          if (!session) {
            setCtx(prev => ({ ...prev, status: 'idle', isLoading: false }))
            return
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            // Only resolve once
            if (didResolveRef.current) return
            setCtx(prev => ({ ...prev, status: 'resolving', isLoading: true }))
            
            try {
              const { user } = session
              
              // Get safe config first
              const safeConfig = getSafeOrgConfig()
              
              // Fetch membership data from API v2
              let res = {}
              try {
                const response = await fetch('/api/v2/auth/resolve-membership', {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                  cache: 'no-store',
                })
                if (response.ok) {
                  const apiResponse = await response.json()
                  // Handle HERA standard response format
                  res = apiResponse.success ? apiResponse : apiResponse
                  console.log('✅ Membership resolved from v2 API:', res)
                } else {
                  // ✅ ENTERPRISE: Check for specific error codes
                  const errorData = await response.json().catch(() => ({}))
                  const errorCode = errorData.error || 'unknown'

                  if (errorCode === 'no_membership') {
                    console.error('❌ No organization membership found for user')
                    // Don't use fallback for no_membership - user genuinely has no access
                    throw new Error('NO_ORGANIZATION_MEMBERSHIP')
                  } else {
                    console.warn('🚨 Membership API v2 failed, using fallback:', errorCode)
                    res = { organization_id: safeConfig.organizationId }
                  }
                }
              } catch (error) {
                // If NO_ORGANIZATION_MEMBERSHIP error, re-throw (don't use fallback)
                if (error.message === 'NO_ORGANIZATION_MEMBERSHIP') {
                  throw error
                }
                console.warn('🚨 Membership API v2 error, using fallback:', error)
                res = { organization_id: safeConfig.organizationId }
              }
              // Parse v2 API response structure
              const normalizedOrgId =
                res.membership?.organization_id ??
                res.organization_id ??
                res.org_entity_id ??
                safeConfig.organizationId

              // Set safe context as backup
              setSafeOrgContext()

              // Extract role from v2 response and normalize
              const rawRole = res.membership?.roles?.[0] ??
                             res.role ??
                             'member'

              // ✅ ENTERPRISE: Normalize role using centralized role normalizer
              const role = normalizeRole(rawRole)

              console.log('✅ Role normalized:', {
                rawRole,
                normalizedRole: role,
                source: 'HERAAuthProvider.onAuthStateChange'
              })

              const userEntityId = res.user_entity_id ?? user?.id

              // Extract available apps from introspection response (NEW)
              const availableApps: HERAApp[] = []
              const defaultApp = res.default_app || null

              // Parse ALL organizations from API response (NEW)
              const allOrganizations: HERAOrganization[] = []

              // Get apps from organizations array
              if (res.organizations && res.organizations.length > 0) {
                // ✅ FIX: Parse all organizations INCLUDING role data from introspection
                res.organizations.forEach((orgData: any) => {
                  allOrganizations.push({
                    id: orgData.id,
                    entity_id: orgData.entity_id || orgData.id,
                    name: orgData.name,
                    code: orgData.code, // ✅ ADD: Organization code
                    type: orgData.type || 'general',
                    industry: orgData.industry || 'general',
                    // ✅ CRITICAL: Include role data from introspection!
                    primary_role: orgData.primary_role,
                    roles: orgData.roles || [],
                    user_role: orgData.primary_role, // Alias for compatibility
                    apps: orgData.apps || [], // ✅ ADD: Include apps array
                    settings: orgData.settings || {}, // ✅ ADD: Include settings
                    joined_at: orgData.joined_at,
                    is_owner: orgData.is_owner,
                    is_admin: orgData.is_admin
                  } as any)

                  // Extract apps from current org to populate availableApps
                  if (orgData.id === normalizedOrgId && orgData.apps && Array.isArray(orgData.apps)) {
                    orgData.apps.forEach((app: any) => {
                      availableApps.push({
                        code: app.code,
                        name: app.name,
                        config: app.config || {}
                      })
                    })
                  }
                })
              }

              // Detect current app from URL (NEW)
              let currentApp: string | null = null
              if (typeof window !== 'undefined') {
                const pathname = window.location.pathname
                const pathSegments = pathname.split('/').filter(Boolean)
                if (pathSegments.length > 0) {
                  const firstSegment = pathSegments[0].toUpperCase()
                  const matchedApp = availableApps.find(app => app.code.toUpperCase() === firstSegment)
                  if (matchedApp) {
                    currentApp = matchedApp.code
                  }
                }
              }

              const heraUser: HERAUser = {
                id: user.id,
                entity_id: userEntityId,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                role: res.membership?.roles?.[0] || 'USER'
              }

              const heraOrg: HERAOrganization = {
                id: normalizedOrgId,
                entity_id: res.membership?.org_entity_id || normalizedOrgId,
                name: res.membership?.organization_name || safeConfig.fallbackName,
                type: 'salon',
                industry: 'beauty'
              }

              setCtx({
                status: 'authenticated',
                user: heraUser,
                organization: heraOrg,
                isAuthenticated: true,
                isLoading: false,
                scopes: res.membership?.roles || [],
                userEntityId,
                organizationId: normalizedOrgId,
                role: role as 'owner' | 'manager' | 'staff' | 'receptionist' | 'user',
                availableApps,
                defaultApp,
                currentApp,
                organizations: allOrganizations  // NEW: Store all organizations
              })

              // ✅ CRITICAL FIX: Store COMPLETE auth context in localStorage (9 keys)
              // This handles users created via hera_onboard_user_v1 where auth UID ≠ user entity ID
              // Also ensures full backwards compatibility with SecuredSalonProvider
              if (typeof window !== 'undefined') {
                localStorage.setItem('user_entity_id', userEntityId)
                localStorage.setItem('organizationId', normalizedOrgId)
                localStorage.setItem('safeOrganizationId', normalizedOrgId)
                localStorage.setItem('salonOrgId', normalizedOrgId)
                localStorage.setItem('salonRole', role)
                localStorage.setItem('userId', user.id)
                localStorage.setItem('userEmail', user.email || '')
                localStorage.setItem('salonUserEmail', user.email || '')
                localStorage.setItem('salonUserName', user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')

                console.log('✅ Stored complete auth context in localStorage (9 keys):', {
                  user_entity_id: userEntityId,
                  organizationId: normalizedOrgId,
                  safeOrganizationId: normalizedOrgId,
                  userId: user.id,
                  userEmail: user.email,
                  salonRole: role
                })
              }

              didResolveRef.current = true
              console.debug('✅ HERA normalized context', {
                userEntityId,
                organizationId: normalizedOrgId,
                role,
                heraOrg,
                currentOrganization: heraOrg,
                availableApps,
                defaultApp,
                currentApp
              })
            } catch (e) {
              console.error('HERA resolve error', e)
              setCtx(prev => ({ ...prev, status: 'error', isLoading: false }))
            }
          }
        })
        
      } catch (error) {
        console.error('❌ Failed to set up auth state listener:', error)
      }
    })()

    return () => {
      subRef.current?.data?.subscription?.unsubscribe?.()
      subRef.current = null
    }
  }, [])

  // Clear session with event-based cleanup
  const clearSession = async () => {
    console.log('🧹 Clearing session...')

    // 1. Emit cleanup event (apps listen and clean their own stores)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hera:session:clear'))
    }

    // 2. Clear browser storage
    localStorage.clear()
    sessionStorage.clear()

    // 3. Sign out
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()

    didResolveRef.current = false
  }

  const login = async (email: string, password: string, options?: { clearFirst?: boolean }) => {
    try {
      // ✅ ENTERPRISE SECURITY: Clear browser storage WITHOUT calling signOut()
      // This prevents race conditions while maintaining complete security
      if (options?.clearFirst) {
        console.log('🛡️ ENTERPRISE: Clearing browser storage before login (secure + no race condition)')

        if (typeof window !== 'undefined') {
          // 1. Emit cleanup event to clear app-specific stores (e.g., salon security store)
          window.dispatchEvent(new CustomEvent('hera:session:clear'))
          console.log('✅ ENTERPRISE: Emitted hera:session:clear event for app stores')

          // 2. Clear ALL localStorage (security ✅)
          localStorage.clear()

          // 3. Clear ALL sessionStorage (security ✅)
          sessionStorage.clear()

          // 4. Clear ALL cookies that might contain sensitive data (security ✅)
          document.cookie.split(";").forEach(c => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
          })

          // 5. Reset resolution flag
          didResolveRef.current = false

          console.log('✅ ENTERPRISE: Browser storage cleared (localStorage + sessionStorage + cookies)')
          console.log('🔐 SECURITY NOTE: NOT calling signOut() to prevent race condition')
          console.log('🔐 SECURITY GUARANTEE: Old tokens will be invalidated by new session (OAuth 2.0 standard)')
        }
      }

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // 1. Authenticate with Supabase (this invalidates old session server-side)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      if (!data.session) throw new Error('No session created')

      console.log('✅ Login successful, resolving membership...')

      // 2. Resolve membership immediately (synchronous pattern)
      const response = await fetch('/api/v2/auth/resolve-membership', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: 'no-store'
      })

      if (!response.ok) {
        // ✅ ENTERPRISE: Parse error response for better error messages
        const errorData = await response.json().catch(() => ({}))
        const errorCode = errorData.error || 'unknown'
        const errorMessage = errorData.message || 'Failed to resolve membership'

        console.error('❌ Membership resolution failed:', {
          status: response.status,
          errorCode,
          errorMessage
        })

        // ✅ ENTERPRISE: Throw specific error codes for better handling
        if (errorCode === 'no_membership') {
          throw new Error('NO_ORGANIZATION_MEMBERSHIP: User has no organization access. Please contact support.')
        } else if (errorCode === 'unauthorized') {
          throw new Error('INVALID_AUTH: Authentication failed. Please login again.')
        } else if (errorCode === 'database_error') {
          throw new Error('DATABASE_ERROR: Failed to resolve authentication context. Please try again.')
        } else {
          throw new Error(`AUTH_ERROR: ${errorMessage}`)
        }
      }

      const membershipData = await response.json()
      console.log('✅ Membership resolved:', membershipData)

      // 3. Extract data from API response
      const organizationId = membershipData.membership?.organization_id ||
                            membershipData.organization_id
      const userEntityId = membershipData.user_entity_id || data.user.id
      const rawRole = membershipData.membership?.roles?.[0] ||
                      membershipData.role ||
                      'member'

      // ✅ ENTERPRISE: Normalize role using centralized role normalizer
      const role = normalizeRole(rawRole)

      console.log('✅ Role normalized:', {
        rawRole,
        normalizedRole: role,
        source: 'HERAAuthProvider.login()'
      })

      if (!organizationId) {
        throw new Error('No organization ID in membership response')
      }

      // 4. Store COMPLETE auth context in localStorage (9 keys for full compatibility)
      if (typeof window !== 'undefined') {
        localStorage.setItem('organizationId', organizationId)
        localStorage.setItem('safeOrganizationId', organizationId)
        localStorage.setItem('salonOrgId', organizationId)
        localStorage.setItem('salonRole', role)
        localStorage.setItem('userId', data.user.id)
        localStorage.setItem('userEmail', data.user.email || email)
        localStorage.setItem('user_entity_id', userEntityId)
        localStorage.setItem('salonUserEmail', data.user.email || email)
        localStorage.setItem('salonUserName', data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User')

        console.log('✅ Stored complete auth context in localStorage:', {
          organizationId,
          userId: data.user.id,
          user_entity_id: userEntityId,
          salonRole: role,
          userEmail: data.user.email
        })
      }

      // 5. Return resolved data for page to use (enables synchronous redirect)
      return {
        user: data.user,
        session: data.session,
        organizationId,
        role,
        userEntityId,
        membershipData
      }

    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, metadata?: any) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })

      if (error) throw error

      console.log('✅ Registration successful')
      return data
    } catch (error) {
      console.error('❌ Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🔓 Logging out...')

      // 1. Reset context immediately (don't wait for auth state change)
      didResolveRef.current = false
      setCtx({
        status: 'idle',
        user: null,
        organization: null,
        isAuthenticated: false,
        isLoading: false,
        scopes: [],
        userEntityId: undefined,
        organizationId: undefined,
        role: undefined,
        availableApps: [],
        defaultApp: null,
        currentApp: null,
        organizations: []  // NEW: Reset organizations
      })

      // 2. Sign out from Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()

      // 3. Clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // 4. Redirect to login
      console.log('✅ Logged out, redirecting to login...')
      router.push('/auth/login')
    } catch (error) {
      console.error('💥 Logout error:', error)
      // Even if signout fails, still redirect
      router.push('/auth/login')
    }
  }

  const refreshAuth = async () => {
    didResolveRef.current = false
    setCtx(prev => ({ ...prev, isLoading: true }))
  }

  const hasScope = (scope: string): boolean => {
    return ctx.scopes.includes('OWNER') || ctx.scopes.includes(scope)
  }

  // App helper methods
  const hasApp = (appCode: string): boolean => {
    return ctx.availableApps.some(app => app.code.toUpperCase() === appCode.toUpperCase())
  }

  const getAppConfig = (appCode: string): Record<string, any> | null => {
    const app = ctx.availableApps.find(app => app.code.toUpperCase() === appCode.toUpperCase())
    return app?.config || null
  }

  // Switch organization (updates context with selected organization)
  const switchOrganization = async (orgId: string) => {
    console.log('🔄 [HERAAuth] Switching to organization:', orgId)
    console.log('🔍 [HERAAuth] Available organizations:', ctx.organizations.map(o => ({ id: o.id, name: o.name })))

    // ✅ ENTERPRISE FIX: Find org data with role from introspection (already have it!)
    const fullOrgData = ctx.organizations.find((o: any) => o.id === orgId) as any

    if (!fullOrgData) {
      console.error('❌ [HERAAuth] Organization not found in context:', orgId)
      console.error('❌ [HERAAuth] Available org IDs:', ctx.organizations.map(o => o.id))
      return
    }

    // ✅ Extract role from organizations array (introspection already has this!)
    const roleForOrg = (
      fullOrgData.primary_role ||
      fullOrgData.roles?.[0] ||
      fullOrgData.user_role ||
      'user'
    ).toLowerCase().replace(/^org_/, '')

    console.log('✅ [HERAAuth] Role extracted from organizations array:', {
      orgId,
      orgName: fullOrgData.name,
      orgCode: fullOrgData.code,
      primaryRole: fullOrgData.primary_role,
      extractedRole: roleForOrg,
      allRoles: fullOrgData.roles,
      apps: fullOrgData.apps?.map((a: any) => a.code)
    })

    // Get apps for this organization
    const apps = fullOrgData.apps || []

    // ✅ Update context with new organization AND correct role
    setCtx(prev => ({
      ...prev,
      organization: {
        id: fullOrgData.id,
        entity_id: fullOrgData.id,
        name: fullOrgData.name,
        type: fullOrgData.type || 'general',
        industry: fullOrgData.industry || 'general'
      },
      organizationId: fullOrgData.id,
      role: roleForOrg as 'owner' | 'manager' | 'staff' | 'receptionist' | 'user', // ✅ UPDATE ROLE
      availableApps: apps.map((app: any) => ({
        code: app.code,
        name: app.name,
        config: app.config || {}
      })),
      defaultApp: fullOrgData.settings?.default_app_code || apps[0]?.code || null,
      currentApp: null
    }))

    // ✅ ENTERPRISE: Update localStorage with role for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('organizationId', fullOrgData.id)
      localStorage.setItem('safeOrganizationId', fullOrgData.id)
      localStorage.setItem('salonOrgId', fullOrgData.id)
      localStorage.setItem('salonRole', roleForOrg) // ✅ PERSIST ROLE

      console.log('✅ [HERAAuth] Updated localStorage with new organization and role:', {
        orgId: fullOrgData.id,
        orgName: fullOrgData.name,
        orgCode: fullOrgData.code,
        role: roleForOrg,
        allLocalStorageKeys: {
          organizationId: localStorage.getItem('organizationId'),
          salonOrgId: localStorage.getItem('salonOrgId'),
          salonRole: localStorage.getItem('salonRole')
        }
      })
    }

    console.log('✅ [HERAAuth] Switch complete - context updated')
  }

  const contextValue: HERAAuthContext = useMemo(() => ({
    ...ctx,
    login,
    register,
    logout,
    refreshAuth,
    clearSession,
    hasScope,
    hasApp,
    getAppConfig,
    switchOrganization,  // NEW: Expose organization switching
    // Legacy compatibility
    currentOrganization: ctx.organization,
    organizations: ctx.organizations,  // NEW: Expose all organizations
    contextLoading: ctx.isLoading
  }), [ctx])

  return (
    <HERAAuthContext.Provider value={contextValue}>
      {children}
    </HERAAuthContext.Provider>
  )
}

export function useHERAAuth() {
  const context = useContext(HERAAuthContext)
  if (context === undefined) {
    throw new Error('useHERAAuth must be used within a HERAAuthProvider')
  }
  return context
}

// Legacy compatibility export
export const useAuth = useHERAAuth
export const useMultiOrgAuth = useHERAAuth