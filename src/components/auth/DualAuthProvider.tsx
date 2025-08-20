'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Types for dual authentication
interface DualUser {
  id: string
  email: string
  name?: string
  full_name?: string
  role?: string
  organizationName?: string
}

interface Organization {
  id: string
  organization_name: string
  organization_type?: string
  subscription_plan?: string
}

interface HeraUserContext {
  user: DualUser | null
  organization: Organization | null
  role: string
}

interface DualAuthContext {
  // Auth state
  user: DualUser | null
  organization: Organization | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isHeraLoading: boolean
  heraContext: HeraUserContext | null

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, userData?: any) => Promise<void>
  refreshContext: () => Promise<void>
}

const DualAuthContextProvider = createContext<DualAuthContext | null>(null)

interface DualAuthProviderProps {
  children: ReactNode
}

export function DualAuthProvider({ children }: DualAuthProviderProps) {
  // Core auth state
  const [user, setUser] = useState<DualUser | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHeraLoading, setIsHeraLoading] = useState(false)

  // Load HERA context for authenticated users
  const loadHeraContext = async (supabaseUser: User): Promise<void> => {
    if (!supabaseUser) return

    try {
      setIsHeraLoading(true)

      // Get auth token
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const authToken = currentSession?.access_token

      if (!authToken) {
        console.warn('No auth token available for HERA context')
        return
      }

      // Call HERA context API (using the correct endpoint)
      const response = await fetch('/api/v1/auth/user-context', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const context = await response.json()
        
        if (context && context.user_entity) {
          // Set enhanced user data
          const enhancedUser: DualUser = {
            id: context.user_entity.id || supabaseUser.id,
            email: context.user_entity.email || supabaseUser.email || '',
            name: context.user_entity.entity_name || supabaseUser.user_metadata?.name || '',
            full_name: context.user_entity.entity_name || supabaseUser.user_metadata?.full_name || '',
            role: context.user_entity.role || 'user',
            organizationName: context.organization?.organization_name || 'Unknown Organization'
          }
          setUser(enhancedUser)

          // Set organization data
          if (context.organization) {
            setOrganization({
              id: context.organization.id,
              organization_name: context.organization.organization_name,
              organization_type: context.organization.organization_type,
              subscription_plan: context.organization.subscription_plan
            })
          }
        }
      } else {
        // Fallback to basic Supabase user data
        const basicUser: DualUser = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || '',
          full_name: supabaseUser.user_metadata?.full_name || '',
          role: 'user',
          organizationName: 'Demo Organization'
        }
        setUser(basicUser)
      }
    } catch (error) {
      console.error('Failed to load HERA context:', error)
      
      // Fallback to basic Supabase user data
      const basicUser: DualUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || '',
        full_name: supabaseUser.user_metadata?.full_name || '',
        role: 'user',
        organizationName: 'Demo Organization'
      }
      setUser(basicUser)
    } finally {
      setIsHeraLoading(false)
    }
  }

  // Clear all state
  const clearState = (): void => {
    setUser(null)
    setOrganization(null)
    setSession(null)
  }

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        if (initialSession) {
          setSession(initialSession)
          await loadHeraContext(initialSession.user)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event)
      setSession(newSession)

      if (event === 'SIGNED_IN' && newSession) {
        await loadHeraContext(newSession.user)
      } else if (event === 'SIGNED_OUT') {
        clearState()
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        // Keep existing context on token refresh unless it's been a while
        if (!user) {
          await loadHeraContext(newSession.user)
        }
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    if (data.session) {
      setSession(data.session)
      await loadHeraContext(data.session.user)
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    clearState()
  }

  const register = async (email: string, password: string, userData: any = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    if (error) {
      throw error
    }

    return data
  }

  const refreshContext = async () => {
    if (session?.user) {
      await loadHeraContext(session.user)
    }
  }

  const heraContext: HeraUserContext | null = user && organization ? {
    user,
    organization,
    role: user.role || 'user'
  } : null

  const value: DualAuthContext = {
    user,
    organization,
    session,
    isAuthenticated: !!user,
    isLoading,
    isHeraLoading,
    heraContext,
    login,
    logout,
    register,
    refreshContext,
  }

  return (
    <DualAuthContextProvider.Provider value={value}>
      {children}
    </DualAuthContextProvider.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(DualAuthContextProvider)
  if (!context) {
    throw new Error('useAuth must be used within a DualAuthProvider')
  }
  return context
}

// Export the provider for compatibility
export default DualAuthProvider