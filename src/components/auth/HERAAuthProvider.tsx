/**
 * HERA Authentication Provider
 * Pure HERA v2.2 "Authenticated Actor Everywhere" implementation
 * Replaces legacy demo authentication with proper Supabase auth
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createSecurityContextFromAuth } from '@/lib/security/user-entity-resolver'
import type { SecurityContext } from '@/lib/security/database-context'

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

  // Authorization
  scopes: string[]
  hasScope: (scope: string) => boolean

  // Actions
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>

  // Legacy compatibility helpers
  currentOrganization: HERAOrganization | null
  organizations: HERAOrganization[]
  contextLoading: boolean
  organizationId: string | null
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
    scopes: [] as string[]
  })

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth()
    
    // Subscribe to auth state changes
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 HERA Auth state change:', event, { hasSession: !!session })
          
          if (event === 'SIGNED_IN' && session) {
            await handleSignIn(session.user.id, session.access_token)
          } else if (event === 'SIGNED_OUT') {
            handleSignOut()
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Don't trigger full auth refresh on token refresh to prevent loops
            console.log('🔄 Token refreshed, maintaining current auth state')
          }
        })
        
        unsubscribe = data.subscription.unsubscribe
      } catch (error) {
        console.error('❌ Failed to set up auth state listener:', error)
      }
    })()

    return () => {
      unsubscribe?.()
    }
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing HERA v2.2 authentication...')
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session error:', error)
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      if (session?.user) {
        await handleSignIn(session.user.id, session.access_token)
      } else {
        console.log('📭 No active session found')
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('💥 Auth initialization error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleSignIn = async (userId: string, accessToken?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      console.log('🔍 Resolving HERA v2.2 user context for:', userId)
      
      // Use HERA v2.2 canonical entity resolution
      const result = await createSecurityContextFromAuth(userId, { 
        accessToken, 
        retries: 2 
      })
      
      if (!result.success || !result.securityContext) {
        console.error('❌ Failed to resolve user context:', result.error)
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          isLoading: false 
        }))
        return
      }

      const { securityContext } = result
      
      // Get user details from Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      
      if (!supabaseUser) {
        console.error('❌ No Supabase user found')
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      // Resolve user entity details via API
      const membershipResponse = await fetch('/api/v2/auth/resolve-membership', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!membershipResponse.ok) {
        console.error('❌ Failed to resolve membership')
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      const membershipData = await membershipResponse.json()
      
      if (!membershipData.success) {
        console.error('❌ Membership resolution failed:', membershipData)
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      const heraUser: HERAUser = {
        id: userId,
        entity_id: membershipData.user_entity_id,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        role: membershipData.membership.roles[0] || 'USER'
      }

      const heraOrg: HERAOrganization = {
        id: membershipData.membership.organization_id,
        entity_id: membershipData.membership.org_entity_id,
        name: 'Hair Talkz Salon', // TODO: Get from org entity
        type: 'salon',
        industry: 'beauty'
      }

      console.log('✅ HERA v2.2 authentication successful:', {
        user_entity_id: heraUser.entity_id,
        org_entity_id: heraOrg.entity_id,
        organization_id: heraOrg.id,
        role: heraUser.role
      })

      setState({
        user: heraUser,
        organization: heraOrg,
        isAuthenticated: true,
        isLoading: false,
        scopes: membershipData.membership.roles
      })

    } catch (error) {
      console.error('💥 Sign in handling error:', error)
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        isLoading: false 
      }))
    }
  }

  const handleSignOut = () => {
    console.log('👋 User signed out')
    setState({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      scopes: []
    })
  }

  const logout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      await supabase.auth.signOut()
      handleSignOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }

  const refreshAuth = async () => {
    await initializeAuth()
  }

  const hasScope = (scope: string): boolean => {
    return state.scopes.includes('OWNER') || state.scopes.includes(scope)
  }

  const contextValue: HERAAuthContext = {
    ...state,
    logout,
    refreshAuth,
    hasScope,
    // Legacy compatibility
    currentOrganization: state.organization,
    organizations: state.organization ? [state.organization] : [],
    contextLoading: state.isLoading,
    organizationId: state.organization?.id || null
  }

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