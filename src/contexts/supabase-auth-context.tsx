'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, DEMO_MODE } from '@/lib/supabase'

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
      throw new Error('Login is disabled in demo mode. Please configure Supabase.')
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
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  const register = async (email: string, password: string, userData: any) => {
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

  const value: SupabaseAuthContext = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
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