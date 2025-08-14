'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, DEMO_MODE } from '@/lib/supabase'

interface AuthContext {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, userData?: any) => Promise<void>
}

const AuthContextProvider = createContext<AuthContext | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    if (DEMO_MODE) {
      // In demo mode, create a mock user for testing
      const mockUser = {
        id: 'demo-user-123',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: { name: 'Demo User' },
        identities: [],
        factors: []
      } as User

      const mockSession = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      } as Session

      setSession(mockSession)
      setUser(mockUser)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  }

  const logout = async () => {
    if (DEMO_MODE) {
      setSession(null)
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  const register = async (email: string, password: string, userData: any = {}) => {
    if (DEMO_MODE) {
      throw new Error('Registration is disabled in demo mode. Please configure Supabase.')
    }

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

  const value: AuthContext = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  }

  return (
    <AuthContextProvider.Provider value={value}>
      {children}
    </AuthContextProvider.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContextProvider)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export the provider for compatibility
export default AuthProvider