'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface SupabaseAuthContext {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, userData: any) => Promise<void>
}

const SupabaseAuthContextProvider = createContext<SupabaseAuthContext | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (mounted) {
          if (error) {
            console.warn('Supabase session error:', error.message)
          }
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      } catch (error) {
        if (mounted) {
          console.warn('Supabase initialization error:', error)
          setIsLoading(false)
        }
      }
    }

    // Listen for auth changes
    let subscription: any = null
    try {
      const {
        data: { subscription: authSubscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      })
      subscription = authSubscription
    } catch (error) {
      console.warn('Supabase auth listener error (demo mode):', error)
    }

    initializeAuth()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const value: SupabaseAuthContext = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register
  }

  return (
    <SupabaseAuthContextProvider.Provider value={value}>
      {children}
    </SupabaseAuthContextProvider.Provider>
  )
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContextProvider)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}
