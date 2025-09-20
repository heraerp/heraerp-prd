/**
 * HERA Authentication Provider
 * Pure HERA Authorization DNA implementation - replaces MultiOrgAuthProvider
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { demoAuthService, type DemoUserType } from '@/lib/auth/demo-auth-service'
import { useRouter } from 'next/navigation'

// HERA-native types following Authorization DNA
interface HERAUser {
  id: string
  entity_id: string
  name: string
  email: string
  role: string
  session_type: 'demo' | 'real'
  expires_at?: string
}

interface HERAOrganization {
  id: string
  name: string
  type: string
  industry: string
}

interface HERAAuthContext {
  // Authentication state
  user: HERAUser | null
  organization: HERAOrganization | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Authorization
  scopes: string[]
  hasScope: (scope: string) => boolean
  
  // Session info
  sessionType: 'demo' | 'real' | null
  timeRemaining: number // milliseconds
  isExpired: boolean
  
  // Actions
  initializeDemo: (demoType: DemoUserType) => Promise<boolean>
  logout: () => Promise<void>
  
  // Legacy compatibility helpers
  currentOrganization: HERAOrganization | null
  organizations: HERAOrganization[]
  contextLoading: boolean // Legacy compatibility for existing components
}

const HERAAuthContext = createContext<HERAAuthContext | undefined>(undefined)

interface HERAAuthProviderProps {
  children: ReactNode
}

export function HERAAuthProvider({ children }: HERAAuthProviderProps) {
  const router = useRouter()
  
  const [state, setState] = useState({
    user: null as HERAUser | null,
    organization: null as HERAOrganization | null,
    isAuthenticated: false,
    isLoading: true,
    scopes: [] as string[],
    sessionType: null as 'demo' | 'real' | null,
    timeRemaining: 0,
    isExpired: false
  })

  // Initialize on mount - check for existing sessions
  useEffect(() => {
    initializeAuth()
  }, [])

  // Session expiry timer
  useEffect(() => {
    if (!state.user?.expires_at) return

    const expiryTime = new Date(state.user.expires_at).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    if (timeUntilExpiry <= 0) {
      handleSessionExpiry()
      return
    }

    const timer = setTimeout(() => {
      handleSessionExpiry()
    }, timeUntilExpiry)

    // Update time remaining every second
    const intervalTimer = setInterval(() => {
      const currentTime = Date.now()
      const remaining = Math.max(0, expiryTime - currentTime)
      setState(prev => ({ 
        ...prev, 
        timeRemaining: remaining,
        isExpired: remaining <= 0
      }))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(intervalTimer)
    }
  }, [state.user?.expires_at])

  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Check for HERA demo session cookie
      const sessionCookie = getCookie('hera-demo-session')
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 HERA Auth: Checking session cookie:', {
          hasSessionCookie: !!sessionCookie,
          timestamp: new Date().toISOString()
        })
      }
      
      if (sessionCookie) {
        // Decode URL-encoded cookie value first
        const decodedCookie = decodeURIComponent(sessionCookie)
        const sessionData = JSON.parse(decodedCookie)
        
        // Check if session is expired
        const expiryTime = new Date(sessionData.expires_at).getTime()
        const now = Date.now()
        
        if (expiryTime > now) {
          console.log('🧬 HERA Auth: Restoring existing demo session')
          
          const user: HERAUser = {
            id: sessionData.user_id || sessionData.user_entity_id,
            entity_id: sessionData.entity_id || sessionData.user_entity_id || sessionData.user_id,
            name: 'Demo Receptionist',
            email: 'demo@herasalon.com',
            role: sessionData.role,
            session_type: 'demo',
            expires_at: sessionData.expires_at
          }
          
          const organization: HERAOrganization = {
            id: sessionData.organization_id,
            name: 'Hair Talkz Salon (Demo)',
            type: 'salon',
            industry: 'beauty_services'
          }
          
          setState({
            user,
            organization,
            isAuthenticated: true,
            isLoading: false,
            scopes: sessionData.scopes || [],
            sessionType: 'demo',
            timeRemaining: expiryTime - now,
            isExpired: false
          })
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ HERA Auth: Session restored:', {
              orgId: organization.id,
              orgName: organization.name,
              userId: user.entity_id,
              timeRemaining: Math.round((expiryTime - now) / 1000) + 's'
            })
          }
          
          return
        } else {
          // Session expired, clean up
          await handleSessionExpiry()
          return
        }
      }

      // TODO: Check for real user session here
      // For now, just set not authenticated
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false,
        isLoading: false 
      }))

    } catch (error) {
      console.error('💥 HERA Auth initialization error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAuthenticated: false
      }))
    }
  }

  const initializeDemo = async (demoType: DemoUserType): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const result = await demoAuthService.initializeDemoSession(demoType)
      
      if (!result.success || !result.user) {
        setState(prev => ({ ...prev, isLoading: false }))
        return false
      }

      const user: HERAUser = {
        id: result.user.id,
        entity_id: result.user.entity_id,
        name: 'Demo Receptionist',
        email: 'demo@herasalon.com',
        role: result.user.role,
        session_type: 'demo',
        expires_at: result.user.expires_at
      }
      
      const organization: HERAOrganization = {
        id: result.user.organization_id,
        name: 'Hair Talkz Salon (Demo)', 
        type: 'salon',
        industry: 'beauty_services'
      }

      const expiryTime = new Date(result.user.expires_at).getTime()
      const now = Date.now()

      setState({
        user,
        organization,
        isAuthenticated: true,
        isLoading: false,
        scopes: result.user.scopes,
        sessionType: 'demo',
        timeRemaining: expiryTime - now,
        isExpired: false
      })

      console.log('✅ HERA Auth: Demo session initialized', {
        user_id: user.entity_id,
        organization_id: organization.id,
        scopes_count: result.user.scopes.length
      })

      return true

    } catch (error) {
      console.error('💥 Demo initialization error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = async () => {
    try {
      await demoAuthService.clearDemoSession()
      
      setState({
        user: null,
        organization: null,
        isAuthenticated: false,
        isLoading: false,
        scopes: [],
        sessionType: null,
        timeRemaining: 0,
        isExpired: false
      })

      console.log('🧹 HERA Auth: Logged out')
      router.push('/')

    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }

  const handleSessionExpiry = async () => {
    console.log('⏰ HERA Auth: Session expired')
    await logout()
  }

  const hasScope = (requiredScope: string): boolean => {
    return demoAuthService.hasScope(requiredScope, state.scopes)
  }

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  const contextValue: HERAAuthContext = {
    // Core auth state
    user: state.user,
    organization: state.organization,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    
    // Authorization
    scopes: state.scopes,
    hasScope,
    
    // Session info
    sessionType: state.sessionType,
    timeRemaining: state.timeRemaining,
    isExpired: state.isExpired,
    
    // Actions
    initializeDemo,
    logout,
    
    // Legacy compatibility
    currentOrganization: state.organization,
    organizations: state.organization ? [state.organization] : [],
    contextLoading: state.isLoading // Legacy compatibility for existing components
  }

  return (
    <HERAAuthContext.Provider value={contextValue}>
      {children}
    </HERAAuthContext.Provider>
  )
}

// Hook to use HERA Auth context
export function useHERAAuth(): HERAAuthContext {
  const context = useContext(HERAAuthContext)
  if (context === undefined) {
    throw new Error('useHERAAuth must be used within a HERAAuthProvider')
  }
  return context
}

// Legacy compatibility hook
export function useMultiOrgAuth(): HERAAuthContext {
  console.warn('🚨 useMultiOrgAuth is deprecated. Use useHERAAuth instead.')
  return useHERAAuth()
}