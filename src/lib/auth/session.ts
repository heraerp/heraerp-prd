// ================================================================================
// HERA SESSION MANAGEMENT - PRODUCTION READY
// Smart Code: HERA.AUTH.SESSION.CORE.v1
// Session state management with persistent storage and auto-refresh
// ================================================================================

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createApiClient } from '../api/clientFactory'
import { createClient } from '@/src/lib/supabase/client'
import type { User, LoginRequest, LoginResponse } from '../schemas/universal'

// Session state interface
interface SessionState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  signup: (credentials: any) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
  checkSession: () => Promise<void>
}

// Import reset function
import { resetApiClient } from '../api/clientFactory'

// Reset client to ensure we're using the right one based on env
resetApiClient()

// Create API client instance
const apiClient = createApiClient()

// Session store with persistence
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const supabase = createClient()
          
          // Sign in with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })
          
          if (error) throw error
          
          // Create user object compatible with our schema
          const user: User = {
            id: data.user!.id,
            email: data.user!.email!,
            name: data.user!.user_metadata?.name || data.user!.email!.split('@')[0],
            roles: ['user'], // Default role, should be fetched from database
            organization_id: data.user!.user_metadata?.organization_id || '',
            created_at: data.user!.created_at,
            last_login: new Date().toISOString(),
          }
          
          // Update API client with token
          apiClient.setToken(data.session!.access_token)
          apiClient.setOrganizationId(user.organization_id)
          
          set({
            user,
            token: data.session!.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // Store in localStorage for persistence across tabs
          if (typeof window !== 'undefined') {
            localStorage.setItem('hera-auth-token', data.session!.access_token)
            localStorage.setItem('hera-user', JSON.stringify(user))
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      signup: async (credentials: any) => {
        set({ isLoading: true, error: null })
        
        try {
          // Call the signup API endpoint
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Signup failed')
          }
          
          // If session returned (instant signup), log them in
          if (data.session) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              roles: ['user'],
              organization_id: '',
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
            }
            
            // Update API client with token
            apiClient.setToken(data.session.access_token)
            apiClient.setOrganizationId(user.organization_id)
            
            set({
              user,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            
            // Store in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('hera-auth-token', data.session.access_token)
              localStorage.setItem('hera-user', JSON.stringify(user))
            }
            
            return { needsEmailConfirmation: false }
          }
          
          // Email confirmation required
          set({
            isLoading: false,
            error: null,
          })
          
          return { needsEmailConfirmation: data.needsEmailConfirmation }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Signup failed'
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const supabase = createClient()
          
          // Sign out with Supabase
          const { error } = await supabase.auth.signOut()
          
          if (error) {
            console.warn('Logout failed:', error)
          }
        } catch (error) {
          console.warn('Logout API call failed:', error)
          // Continue with local logout even if API fails
        } finally {
          // Clear local state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          
          // Clear API client
          apiClient.setToken('')
          apiClient.setOrganizationId('')
          
          // Clear localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('hera-auth-token')
            localStorage.removeItem('hera-user')
          }
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
        
        if (user && typeof window !== 'undefined') {
          localStorage.setItem('hera-user', JSON.stringify(user))
        }
      },

      setToken: (token: string | null) => {
        set({ token, isAuthenticated: !!token })
        
        if (token) {
          apiClient.setToken(token)
          if (typeof window !== 'undefined') {
            localStorage.setItem('hera-auth-token', token)
          }
        } else {
          apiClient.setToken('')
          if (typeof window !== 'undefined') {
            localStorage.removeItem('hera-auth-token')
          }
        }
      },

      clearError: () => {
        set({ error: null })
      },

      checkSession: async () => {
        // Only run on client side
        if (typeof window === 'undefined') return
        
        const storedToken = localStorage.getItem('hera-auth-token')
        const storedUser = localStorage.getItem('hera-user')
        
        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser) as User
            
            // Restore session
            apiClient.setToken(storedToken)
            apiClient.setOrganizationId(user.organization_id)
            
            set({
              user,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            
          } catch (error) {
            console.error('Failed to restore session:', error)
            // Clear invalid stored data
            localStorage.removeItem('hera-auth-token')
            localStorage.removeItem('hera-user')
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        } else {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'hera-session-storage',
      partialize: (state) => ({
        // Only persist essential data
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Initialize session on client side
if (typeof window !== 'undefined') {
  useSession.getState().checkSession()
}

// Utility functions for easier usage
export const authUtils = {
  getCurrentUser: () => useSession.getState().user,
  getToken: () => useSession.getState().token,
  isAuthenticated: () => useSession.getState().isAuthenticated,
  hasRole: (role: string) => {
    const user = useSession.getState().user
    return user?.roles.includes(role as any) || false
  },
  hasAnyRole: (roles: string[]) => {
    const user = useSession.getState().user
    return user?.roles.some(role => roles.includes(role)) || false
  },
  getOrganizationId: () => useSession.getState().user?.organization_id,
}

// React hook for auth status
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  } = useSession()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
    // Utility methods
    hasRole: (role: string) => user?.roles.includes(role as any) || false,
    hasAnyRole: (roles: string[]) => user?.roles.some(role => roles.includes(role)) || false,
    organizationId: user?.organization_id,
  }
}

// Export API client for use in components
export { apiClient }