'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

// Simplified auth context for audit system
interface AuditUser {
  id: string
  email: string
  full_name: string
  firm_id?: string
  firm_name?: string
  firm_code?: string
  role: string
  organization_id: string
}

interface SimpleAuditAuthContextType {
  // Auth state
  user: AuditUser | null
  supabaseUser: SupabaseUser | null
  session: Session | null

  // Loading states
  isLoading: boolean
  isAuthenticated: boolean

  // Auth functions
  signUp: (
    email: string,
    password: string,
    userData: any
  ) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>

  // Refresh user data
  refreshUser: () => Promise<void>
}

const SimpleAuditAuthContext = createContext<SimpleAuditAuthContextType | undefined>(undefined)

interface SimpleAuditAuthProviderProps {
  children: ReactNode
}

export function SimpleAuditAuthProvider({ children }: SimpleAuditAuthProviderProps) {
  const [user, setUser] = useState<AuditUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!session && !!user

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (mounted) {
          setSession(session)
          setSupabaseUser(session?.user || null)

          if (session?.user) {
            await loadUserProfile(session.user)
          }

          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔐 Auth state changed:', event)

      setSession(session)
      setSupabaseUser(session?.user || null)

      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setUser(null)
      }

      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Load user profile from audit firm data
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('👤 Loading user profile for:', supabaseUser.email)

      // Try to get user's audit firm data
      const firmResponse = await fetch('/api/v1/audit/firm?action=current', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })

      let firmData = null
      if (firmResponse.ok) {
        const firmResult = await firmResponse.json()
        firmData = firmResult.data
      }

      // Create audit user profile
      const auditUser: AuditUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
        firm_id: firmData?.id,
        firm_name: firmData?.entity_name,
        firm_code: firmData?.entity_code,
        role: supabaseUser.user_metadata?.role || 'auditor',
        organization_id:
          firmData?.organization_id ||
          `${supabaseUser.email?.split('@')[1]?.replace('.', '_')}_audit_org`
      }

      setUser(auditUser)
      console.log('✅ User profile loaded:', auditUser.firm_name || 'No firm')
    } catch (error) {
      console.error('❌ Error loading user profile:', error)

      // Fallback user profile
      const fallbackUser: AuditUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
        role: 'auditor',
        organization_id: 'unknown_audit_org'
      }

      setUser(fallbackUser)
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('📝 Signing up user:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        console.error('❌ Signup error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Signup successful')
      return { success: true }
    } catch (error) {
      console.error('❌ Signup exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      }
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Signing in user:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Signin error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Signin successful')
      return { success: true }
    } catch (error) {
      console.error('❌ Signin exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      console.log('🚪 Signing out user')

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Signout error:', error)
      } else {
        console.log('✅ Signout successful')
        setUser(null)
        setSupabaseUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error('❌ Signout exception:', error)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    if (supabaseUser) {
      await loadUserProfile(supabaseUser)
    }
  }

  const value: SimpleAuditAuthContextType = {
    user,
    supabaseUser,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshUser
  }

  return <SimpleAuditAuthContext.Provider value={value}>{children}</SimpleAuditAuthContext.Provider>
}

// Custom hook to use the auth context
export function useSimpleAuditAuth() {
  const context = useContext(SimpleAuditAuthContext)
  if (context === undefined) {
    throw new Error('useSimpleAuditAuth must be used within a SimpleAuditAuthProvider')
  }
  return context
}

// Protected route component
interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedAuditRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSimpleAuditAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access this page.</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
