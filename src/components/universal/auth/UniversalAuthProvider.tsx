'use client'

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js'

// Types
export interface User {
  id: string
  email: string
  full_name: string
  role: string
}

export interface Organization {
  id: string
  organization_name: string
  organization_type: string
  subscription_plan: string
}

export interface HeraContext {
  user_entity: any
  organization: any
  permissions: string[]
  client_id: string
}

export interface UniversalAuthConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  heraApiBaseUrl: string
  cacheDuration?: number
  throttleDuration?: number
  authTimeout?: number
}

export interface UniversalAuthContextType {
  // Core auth state
  isLoading: boolean
  isAuthenticated: boolean
  session: Session | null
  supabaseUser: SupabaseUser | null
  
  // HERA state
  user: User | null
  organization: Organization | null
  heraContext: HeraContext | null
  isHeraLoading: boolean
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshHeraContext: () => Promise<void>
  
  // Cache info
  lastContextFetch: number
  isCacheValid: boolean
}

const UniversalAuthContext = createContext<UniversalAuthContextType | undefined>(undefined)

interface UniversalAuthProviderProps {
  children: ReactNode
  config: UniversalAuthConfig
}

export function UniversalAuthProvider({ children, config }: UniversalAuthProviderProps) {
  // Initialize Supabase client
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)

  // Configuration with defaults
  const CACHE_DURATION = config.cacheDuration || 30000 // 30 seconds
  const THROTTLE_DURATION = config.throttleDuration || 2000 // 2 seconds  
  const AUTH_TIMEOUT = config.authTimeout || 3000 // 3 seconds

  // Core auth state
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)

  // HERA state
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [heraContext, setHeraContext] = useState<HeraContext | null>(null)
  const [isHeraLoading, setIsHeraLoading] = useState(false)

  // Cache and throttling state
  const [lastContextFetch, setLastContextFetch] = useState(0)
  const [isContextFetching, setIsContextFetching] = useState(false)

  // Computed values
  const isCacheValid = (Date.now() - lastContextFetch) < CACHE_DURATION
  const isAuthenticated = !!session && (!!heraContext || (isHeraLoading && lastContextFetch > 0))

  // Load HERA context with caching and throttling
  const loadHeraContext = async (supabaseUser: SupabaseUser): Promise<void> => {
    const now = Date.now()

    // Use cached data if still valid
    if (heraContext && isCacheValid) {
      console.log('🔄 Using cached HERA context')
      return
    }

    // Throttle rapid successive calls
    if (isContextFetching || (now - lastContextFetch) < THROTTLE_DURATION) {
      console.log('⏳ Throttling HERA context call')
      return
    }

    try {
      setIsContextFetching(true)
      setIsHeraLoading(true)
      console.log('🚀 Loading HERA context for:', supabaseUser.email)

      // Get auth token
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const authToken = currentSession?.access_token

      if (!authToken) {
        throw new Error('No auth token available')
      }

      // Call HERA context API
      const response = await fetch(`${config.heraApiBaseUrl}/auth/hera-context`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HERA API error: ${response.status}`)
      }

      const context = await response.json()
      console.log('✅ HERA context received:', context)

      setLastContextFetch(now)

      if (context && context.user_entity) {
        setHeraContext(context)

        // Set user data
        const userData: User = {
          id: context.user_entity.id,
          email: context.user_entity.email || supabaseUser.email || '',
          full_name: context.user_entity.entity_name,
          role: context.user_entity.role || 'user'
        }
        setUser(userData)

        // Set organization data
        if (context.organization) {
          setOrganization({
            id: context.organization.id,
            organization_name: context.organization.organization_name,
            organization_type: context.organization.organization_type,
            subscription_plan: context.organization.subscription_plan
          })
        }

        console.log('✅ Auth state updated successfully')
      } else {
        console.warn('⚠️ Invalid HERA context received:', context)
      }
    } catch (error) {
      console.error('❌ Failed to load HERA context:', error)

      // Handle specific error cases
      if (error instanceof Error && error.message.includes('Authentication token too large')) {
        console.warn('🔄 JWT token too large, forcing re-authentication')
        await supabase.auth.signOut()
        return
      }

      // In development, continue without HERA context
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: continuing without full HERA context')
      }
    } finally {
      setIsHeraLoading(false)
      setIsContextFetching(false)
      console.log('🏁 HERA context loading complete')
    }
  }

  // Clear all HERA state
  const clearHeraState = (): void => {
    setUser(null)
    setOrganization(null)
    setHeraContext(null)
    setLastContextFetch(0)
    setIsContextFetching(false)
    console.log('🧹 HERA state cleared')
  }

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      const authTimeout = setTimeout(() => {
        console.warn('⏰ Auth initialization timeout - forcing completion')
        setIsLoading(false)
      }, AUTH_TIMEOUT)

      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          return
        }

        if (initialSession) {
          setSession(initialSession)
          setSupabaseUser(initialSession.user)

          // Load HERA context with error handling
          try {
            await loadHeraContext(initialSession.user)
          } catch (heraError) {
            console.error('❌ HERA context load error:', heraError)
            // Continue anyway - user can still access basic features
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error)
      } finally {
        clearTimeout(authTimeout)
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state changed:', event)
      setSession(newSession)
      setSupabaseUser(newSession?.user || null)

      if (event === 'SIGNED_IN' && newSession) {
        await loadHeraContext(newSession.user)
      } else if (event === 'SIGNED_OUT') {
        clearHeraState()
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        // Keep existing context on token refresh
        console.log('🔄 Token refreshed - keeping existing context')
      } else if (event === 'USER_UPDATED' && newSession) {
        // Only refresh if cache is expired
        if (!isCacheValid) {
          await loadHeraContext(newSession.user)
        }
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Login error:', error)
        return { success: false, error: error.message }
      }

      if (data.session) {
        setSession(data.session)
        setSupabaseUser(data.session.user)
        await loadHeraContext(data.session.user)
        return { success: true }
      }

      return { success: false, error: 'No session created' }
    } catch (error) {
      console.error('❌ Login failed:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logging out...')
      clearHeraState()
      await supabase.auth.signOut()
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  // Refresh HERA context
  const refreshHeraContext = async (): Promise<void> => {
    if (supabaseUser) {
      await loadHeraContext(supabaseUser)
    }
  }

  const contextValue: UniversalAuthContextType = {
    // Core auth state
    isLoading,
    isAuthenticated,
    session,
    supabaseUser,

    // HERA state
    user,
    organization,
    heraContext,
    isHeraLoading,

    // Auth actions
    login,
    logout,
    refreshHeraContext,

    // Cache info
    lastContextFetch,
    isCacheValid
  }

  return (
    <UniversalAuthContext.Provider value={contextValue}>
      {children}
    </UniversalAuthContext.Provider>
  )
}

// Hook to use the auth context
export function useUniversalAuth(): UniversalAuthContextType {
  const context = useContext(UniversalAuthContext)
  if (context === undefined) {
    throw new Error('useUniversalAuth must be used within a UniversalAuthProvider')
  }
  return context
}

// Export the context for advanced usage
export { UniversalAuthContext }