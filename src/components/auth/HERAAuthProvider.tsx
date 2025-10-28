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
  role?: 'owner' | 'manager' | 'staff'

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, metadata?: any) => Promise<any>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>

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
    role?: 'owner' | 'manager' | 'staff'
  }>({
    status: 'idle',
    user: null,
    organization: null,
    isAuthenticated: false,
    isLoading: true,
    scopes: [],
    userEntityId: undefined,
    organizationId: undefined,
    role: undefined
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
            // If session disappeared, reset context
            if (!session) {
              console.log('🔐 Session disappeared, resetting context')
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
                role: undefined
              })
              return
            }
            // If session exists but context is missing (page navigation/reload), allow re-resolution
            // This handles the case where the provider re-mounts but session is still valid
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
                  console.warn('🚨 Membership API v2 failed, using fallback')
                  res = { organization_id: safeConfig.organizationId }
                }
              } catch (error) {
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

              // Extract role from v2 response
              const role = (
                res.membership?.roles?.[0] ??
                res.role ??
                'member'
              ).toLowerCase()

              const userEntityId = res.user_entity_id ?? user?.id

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
                role: role as 'owner' | 'manager' | 'staff'
              })

              didResolveRef.current = true
              console.debug('✅ HERA normalized context', {
                userEntityId,
                organizationId: normalizedOrgId,
                role,
                heraOrg,
                currentOrganization: heraOrg
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

  // Remove initializeAuth - handled in useEffect

  // Remove handleSignIn - handled in useEffect

  // Remove handleSignOut - handled in useEffect

  const login = async (email: string, password: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Auth state change handler will update context automatically
      console.log('✅ Login successful, auth state will update automatically')
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
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      await supabase.auth.signOut()
      didResolveRef.current = false
      router.push('/auth/login')
    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }

  const refreshAuth = async () => {
    didResolveRef.current = false
    setCtx(prev => ({ ...prev, isLoading: true }))
  }

  const hasScope = (scope: string): boolean => {
    return ctx.scopes.includes('OWNER') || ctx.scopes.includes(scope)
  }

  const contextValue: HERAAuthContext = useMemo(() => ({
    ...ctx,
    login,
    register,
    logout,
    refreshAuth,
    hasScope,
    // Legacy compatibility
    currentOrganization: ctx.organization,
    organizations: ctx.organization ? [ctx.organization] : [],
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