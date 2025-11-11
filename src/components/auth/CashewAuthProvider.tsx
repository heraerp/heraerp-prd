'use client'

/**
 * Dedicated Cashew Authentication Provider
 * Simple, direct authentication for cashew manufacturing ERP
 * Bypasses complex multi-tenant organization logic
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CashewUser {
  id: string
  email: string
  name: string
  role: string
}

interface CashewOrganization {
  id: string
  name: string
  type: string
}

interface CashewAuthContext {
  user: CashewUser | null
  organization: CashewOrganization | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const CashewAuthContext = createContext<CashewAuthContext | undefined>(undefined)

// Hardcoded cashew organization details (no database lookup needed)
const CASHEW_ORGANIZATION: CashewOrganization = {
  id: '7288d538-f111-42d4-a07a-b4c535c5adc3',
  name: 'Kerala Cashew Processors',
  type: 'manufacturing'
}

// Valid cashew user credentials
const CASHEW_CREDENTIALS = {
  'admin@keralacashew.com': {
    id: '75c61264-f5a0-4780-9f65-4bee0db4b4a2',
    email: 'admin@keralacashew.com',
    name: 'Cashew Manufacturing Admin',
    role: 'admin',
    password: 'CashewAdmin2024!'
  }
}

export function CashewAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CashewUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const cashewUser = CASHEW_CREDENTIALS[session.user.email as keyof typeof CASHEW_CREDENTIALS]
        if (cashewUser && session.user.id === cashewUser.id) {
          setUser({
            id: cashewUser.id,
            email: cashewUser.email,
            name: cashewUser.name,
            role: cashewUser.role
          })
        }
      }
    } catch (error) {
      console.error('Session check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const cashewUser = CASHEW_CREDENTIALS[email as keyof typeof CASHEW_CREDENTIALS]
    
    if (!cashewUser || password !== cashewUser.password) {
      throw new Error('Invalid cashew credentials')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user?.id === cashewUser.id) {
        setUser({
          id: cashewUser.id,
          email: cashewUser.email,
          name: cashewUser.name,
          role: cashewUser.role
        })
      } else {
        throw new Error('User ID mismatch')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const value: CashewAuthContext = {
    user,
    organization: CASHEW_ORGANIZATION,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }

  return (
    <CashewAuthContext.Provider value={value}>
      {children}
    </CashewAuthContext.Provider>
  )
}

export function useCashewAuth() {
  const context = useContext(CashewAuthContext)
  if (context === undefined) {
    throw new Error('useCashewAuth must be used within a CashewAuthProvider')
  }
  return context
}