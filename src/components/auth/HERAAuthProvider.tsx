/**
 * HERA Authentication Provider
 * Simplified HERA v2.2 authentication for Hair Talkz salon
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// HERA v2.2 native types
interface HERAUser {
  id: string              // Supabase UID
  entity_id: string       // HERA USER entity ID
  name: string
  email: string
  role: string
}

interface HERAOrganization {
  id: string              // Tenant organization row ID
  entity_id: string       // HERA ORG entity ID
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

  // Initialize state with persisted data if available
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('heraAuthState')
        if (saved) {
          const parsed = JSON.parse(saved)
          console.log('🔄 Restoring auth state from session storage')
          return {
            ...parsed,
            isLoading: false
          }
        }
      } catch (error) {
        console.warn('Failed to restore auth state:', error)
      }
    }
    
    return {
      user: null as HERAUser | null,
      organization: null as HERAOrganization | null,
      isAuthenticated: false,
      isLoading: true,
      scopes: [] as string[]
    }
  })

  const isInitializedRef = useRef(false)
  const lastHandled = useRef<{userId?: string, event?: string}>({})
  
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const setupAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Subscribe to auth state changes with de-duplication
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          const userId = session?.user?.id
          
          // Ignore repeats for the same user/event
          if (lastHandled.current.userId === userId && lastHandled.current.event === event) {
            console.log(`🔇 Ignoring duplicate auth event: ${event} for user ${userId}`)
            return
          }
          
          console.log('🔐 Processing auth state change:', event, 'for user:', userId)
          
          if (event === 'SIGNED_IN' && userId) {
            lastHandled.current = { userId, event } // mark handled
            await handleSignIn(userId, session.user.email || '')
          } else if (event === 'SIGNED_OUT') {
            lastHandled.current = {} // reset on sign out
            handleSignOut()
          }
        })
        
        unsubscribe = data.subscription.unsubscribe
        
        // Only initialize once
        if (!isInitializedRef.current) {
          isInitializedRef.current = true
          
          // Skip initialization if we have valid cached state
          if (state.isAuthenticated && state.user && state.organization) {
            console.log('✅ Using cached authentication state')
            setState(prev => ({ ...prev, isLoading: false }))
            return
          }
          
          await initializeAuth()
        }
      } catch (error) {
        console.error('❌ Failed to set up auth:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    setupAuth()

    return () => {
      unsubscribe?.()
    }
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing HERA authentication...')
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('🔐 Valid session found:', session.user.email)
        
        // Check if user is authorized for Hair Talkz
        if (session.user.email?.includes('@hairtalkz.com') || session.user.email?.includes('michele')) {
          await handleSignIn(session.user.id, session.user.email)
          return
        } else {
          console.log('❌ User not authorized for Hair Talkz')
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }
      }
      
      // No session - redirect to login if not already there
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/auth') && !currentPath.includes('/salon/auth')) {
          console.log('❌ No session, redirecting to login')
          router.push('/auth/login')
          return
        }
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      console.error('💥 Auth initialization error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleSignIn = async (userId: string, email: string) => {
    try {
      // Prevent duplicate processing
      if (state.isAuthenticated && state.user?.id === userId) {
        console.log('⚠️ User already authenticated')
        return
      }

      console.log('🔍 Processing sign-in for Hair Talkz user:', email)
      
      const heraUser: HERAUser = {
        id: userId,
        entity_id: userId,
        name: email.split('@')[0] || 'Hair Talkz User',
        email: email,
        role: 'OWNER'
      }
      
      const heraOrg: HERAOrganization = {
        id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        entity_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        name: 'Hair Talkz Salon',
        type: 'salon',
        industry: 'beauty'
      }
      
      const newState = {
        user: heraUser,
        organization: heraOrg,
        isAuthenticated: true,
        isLoading: false,
        scopes: ['OWNER']
      }
      
      setState(newState)
      
      // Persist auth state
      try {
        sessionStorage.setItem('heraAuthState', JSON.stringify(newState))
      } catch (error) {
        console.warn('Failed to persist auth state:', error)
      }
      
      console.log('✅ Hair Talkz user authenticated successfully')
    } catch (error) {
      console.error('💥 Sign in error:', error)
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        isLoading: false 
      }))
    }
  }

  const handleSignOut = () => {
    console.log('👋 User signed out')
    const newState = {
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      scopes: []
    }
    
    setState(newState)
    
    try {
      sessionStorage.removeItem('heraAuthState')
    } catch (error) {
      console.warn('Failed to clear auth state:', error)
    }
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

// Legacy compatibility exports
export const useAuth = useHERAAuth
export const useMultiOrgAuth = useHERAAuth