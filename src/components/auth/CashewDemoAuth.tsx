'use client'

/**
 * Cashew Demo Authentication Provider
 * Simple demo auth for testing cashew app functionality
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

interface CashewDemoUser {
  id: string
  entity_id: string
  email: string
  name: string
  role: string
}

interface CashewDemoOrganization {
  id: string
  name: string
  type: string
}

interface CashewDemoAuthContext {
  user: CashewDemoUser | null
  organization: CashewDemoOrganization | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  login: (userId: string) => void
  logout: () => void
}

const CashewDemoAuthContext = createContext<CashewDemoAuthContext | undefined>(undefined)

// Demo user configurations
const DEMO_USERS = {
  'cashew-admin': {
    id: '75c61264-f5a0-4780-9f65-4bee0db4b4a2',
    entity_id: '75c61264-f5a0-4780-9f65-4bee0db4b4a2',
    email: 'admin@keralacashew.com',
    name: 'Cashew Manufacturing Admin',
    role: 'admin'
  },
  'cashew-manager': {
    id: 'b8f7c3d2-1a9e-4f5b-8c6d-9e2f3a4b5c6d',
    entity_id: 'b8f7c3d2-1a9e-4f5b-8c6d-9e2f3a4b5c6d',
    email: 'manager@keralacashew.com',
    name: 'Production Manager',
    role: 'manager'
  },
  'cashew-operator': {
    id: 'c9e8d4f3-2b0f-5a6c-9d7e-0f3a4b5c6d7e',
    entity_id: 'c9e8d4f3-2b0f-5a6c-9d7e-0f3a4b5c6d7e',
    email: 'operator@keralacashew.com',
    name: 'Plant Operator',
    role: 'operator'
  }
}

const DEMO_ORGANIZATION: CashewDemoOrganization = {
  id: '7288d538-f111-42d4-a07a-b4c535c5adc3',
  name: 'Kerala Cashew Processors',
  type: 'manufacturing'
}

export function CashewDemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CashewDemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUserId = localStorage.getItem('cashew-demo-user-id')
    const savedToken = localStorage.getItem('cashew-demo-token')
    
    if (savedUserId && DEMO_USERS[savedUserId as keyof typeof DEMO_USERS]) {
      setUser(DEMO_USERS[savedUserId as keyof typeof DEMO_USERS])
      setAccessToken(savedToken || 'demo-token-' + savedUserId)
    }
    
    setIsLoading(false)
  }, [])

  const login = (userId: string) => {
    const demoUser = DEMO_USERS[userId as keyof typeof DEMO_USERS]
    if (demoUser) {
      setUser(demoUser)
      const token = 'demo-token-' + userId
      setAccessToken(token)
      
      // Save to localStorage
      localStorage.setItem('cashew-demo-user-id', userId)
      localStorage.setItem('cashew-demo-token', token)
    }
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('cashew-demo-user-id')
    localStorage.removeItem('cashew-demo-token')
  }

  const value: CashewDemoAuthContext = {
    user,
    organization: DEMO_ORGANIZATION,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    login,
    logout
  }

  return (
    <CashewDemoAuthContext.Provider value={value}>
      {children}
    </CashewDemoAuthContext.Provider>
  )
}

export function useCashewDemoAuth() {
  const context = useContext(CashewDemoAuthContext)
  if (context === undefined) {
    throw new Error('useCashewDemoAuth must be used within a CashewDemoAuthProvider')
  }
  return context
}

// Demo login component
export function CashewDemoLogin() {
  const { login } = useCashewDemoAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🥜</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cashew Manufacturing Demo
          </h1>
          <p className="text-gray-600">
            Choose a demo user to access the system
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(DEMO_USERS).map(([userId, userData]) => (
            <button
              key={userId}
              onClick={() => login(userId)}
              className="w-full p-4 text-left bg-gray-50 hover:bg-amber-50 rounded-lg border border-gray-200 hover:border-amber-200 transition-colors"
            >
              <div className="font-semibold text-gray-900">{userData.name}</div>
              <div className="text-sm text-gray-600">{userData.email}</div>
              <div className="text-xs text-amber-600 uppercase font-medium">{userData.role}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Demo environment - no real authentication required
          </p>
        </div>
      </div>
    </div>
  )
}