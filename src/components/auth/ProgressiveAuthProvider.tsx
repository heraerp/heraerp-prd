'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  getOrCreateAnonymousWorkspace, 
  getProgressiveAuthState,
  upgradeToIdentified,
  completeRegistration,
  clearWorkspace,
  type ProgressiveWorkspace,
  type ProgressiveAuthState
} from '@/lib/auth/progressive-auth'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface ProgressiveUser {
  id: string
  name: string
  email: string | null
  organizationId: string
  organizationName: string
  authState: 'anonymous' | 'identified' | 'registered'
}

interface ProgressiveAuthContextType extends ProgressiveAuthState {
  // Actions
  startAnonymous: () => Promise<void>
  saveWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  register: (details: {
    password: string
    full_name: string
    business_name: string
    business_type: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  
  // State
  user: ProgressiveUser | null
  isLoading: boolean
  supabaseUser: SupabaseUser | null
}

const ProgressiveAuthContext = createContext<ProgressiveAuthContextType | undefined>(undefined)

interface ProgressiveAuthProviderProps {
  children: ReactNode
}

export function ProgressiveAuthProvider({ children }: ProgressiveAuthProviderProps) {
  // Initialize with safe default state for SSR
  const [authState, setAuthState] = useState<ProgressiveAuthState>({
    workspace: null,
    isAnonymous: false,
    isIdentified: false,
    isRegistered: false,
    daysRemaining: 0,
    canUpgrade: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // SSR safety check - only run on client
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        // Check for existing Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setSupabaseUser(session.user)
        }
        
        // Get existing state first (client-side only)
        const state = getProgressiveAuthState()
        setAuthState(state)
        
        // If no workspace and no session, create anonymous workspace
        if (!state.workspace && !session) {
          try {
            const workspace = await getOrCreateAnonymousWorkspace()
            const newState = getProgressiveAuthState()
            setAuthState(newState)
          } catch (error) {
            console.error('Failed to create workspace:', error)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeAuth()
    
    // Listen for auth changes (client-side only)
    let authListener: { subscription: { unsubscribe: () => void } } | null = null
    
    if (typeof window !== 'undefined') {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setSupabaseUser(session?.user || null)
        if (event === 'SIGNED_OUT') {
          clearWorkspace()
          setAuthState(getProgressiveAuthState())
        }
      })
      authListener = data
    }
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])
  
  // Start anonymous session
  const startAnonymous = async () => {
    setIsLoading(true)
    try {
      const workspace = await getOrCreateAnonymousWorkspace()
      const newState = getProgressiveAuthState()
      setAuthState(newState)
    } catch (error) {
      console.error('Failed to start anonymous session:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Save workspace with email
  const saveWithEmail = async (email: string) => {
    if (!authState.workspace) {
      return { success: false, error: 'No workspace found' }
    }
    
    try {
      // Use the progressive auth library to upgrade and persist
      const updatedWorkspace = await upgradeToIdentified(authState.workspace, email)
      
      // 🎯 CAPTURE AS WARM LEAD FOR CRM
      try {
        const { captureProgressiveLead } = await import('@/lib/progressive-lead-capture')
        const leadResult = await captureProgressiveLead(email)
        
        if (leadResult.success) {
          console.log('✅ Warm lead captured:', leadResult.leadId)
        } else {
          console.warn('⚠️ Lead capture failed:', leadResult.error)
        }
      } catch (leadError) {
        console.warn('⚠️ Lead capture system error:', leadError)
        // Don't fail the main flow if lead capture fails
      }
      
      // Also call the API endpoint for server-side tracking
      const response = await fetch('/api/v1/auth/progressive', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Workspace-Id': authState.workspace.id || authState.workspace.workspaceId
        },
        body: JSON.stringify({
          action: 'save_with_email',
          email: email
        })
      })
      
      const result = await response.json()
      
      if (result.success || response.ok) {
        // Update the auth state with the persisted workspace
        const newState = getProgressiveAuthState()
        setAuthState(newState)
      }
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save workspace' 
      }
    }
  }
  
  // Complete registration
  const register = async (details: {
    password: string
    full_name: string
    business_name: string
    business_type: string
  }) => {
    if (!authState.workspace?.email) {
      return { success: false, error: 'Email required before registration' }
    }
    
    try {
      // Call the API endpoint for registration
      const response = await fetch('/api/v1/auth/progressive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: authState.workspace.email,
          password: details.password,
          fullName: details.full_name,
          businessName: details.business_name,
          businessType: details.business_type
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update auth state to registered
        const updatedWorkspace = {
          ...authState.workspace,
          authState: 'registered' as const
        }
        setAuthState({
          workspace: updatedWorkspace,
          isAnonymous: false,
          isIdentified: false,
          isRegistered: true,
          daysRemaining: 999999, // Permanent
          canUpgrade: false
        })
        
        // Set Supabase user if available
        if (result.user?.id) {
          // The user will be set via Supabase auth state change
        }
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }
  
  // Logout
  const logout = async () => {
    try {
      if (supabaseUser) {
        await supabase.auth.signOut()
      }
      clearWorkspace()
      setAuthState(getProgressiveAuthState())
      setSupabaseUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  // Create user object from workspace and supabase data
  const user: ProgressiveUser | null = authState.workspace ? {
    id: supabaseUser?.id || authState.workspace.workspaceId,
    name: supabaseUser?.user_metadata?.full_name || 'Guest',
    email: supabaseUser?.email || authState.workspace.email,
    organizationId: authState.workspace.organization_id,
    organizationName: supabaseUser?.user_metadata?.business_name || authState.workspace.organization_id,
    authState: authState.workspace.authState
  } : null

  const contextValue: ProgressiveAuthContextType = {
    ...authState,
    user,
    startAnonymous,
    saveWithEmail,
    register,
    logout,
    isLoading,
    supabaseUser
  }
  
  return (
    <ProgressiveAuthContext.Provider value={contextValue}>
      {children}
    </ProgressiveAuthContext.Provider>
  )
}

export function useProgressiveAuth() {
  const context = useContext(ProgressiveAuthContext)
  if (context === undefined) {
    throw new Error('useProgressiveAuth must be used within a ProgressiveAuthProvider')
  }
  return context
}