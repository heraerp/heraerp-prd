/**
 * HERA Universal Auth Provider
 * Smart Code: HERA.AUTH.PROVIDER.UNIVERSAL.v1
 * 
 * Top-class authentication provider that:
 * - Works across all apps (salon, cashew, retail, etc.)
 * - Handles complete HERA auth flow
 * - Shares authorization credentials
 * - Provides consistent auth interface
 */

'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useHERAAuth, HERAUser, HERAOrganization } from '@/lib/auth/hera-universal-auth'

interface HERAUniversalAuthContextType {
  // Authentication state
  isAuthenticated: boolean
  isLoading: boolean
  user: HERAUser | null
  
  // Organization state
  organizations: HERAOrganization[]
  organization: HERAOrganization | null
  
  // App state
  currentApp: string | null
  registeredApps: string[]
  
  // JWT for API calls
  accessToken: string | null
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  selectOrganization: (orgId: string) => Promise<void>
  registerApp: (appName: string) => Promise<void>
  
  // Context helpers
  requireAuth: () => boolean
  requireOrg: () => boolean
  hasAppAccess: (appName: string) => boolean
}

const HERAUniversalAuthContext = createContext<HERAUniversalAuthContextType | null>(null)

interface HERAUniversalAuthProviderProps {
  children: ReactNode
  appName?: string
  requireOrganization?: boolean
  redirectTo?: string
}

export function HERAUniversalAuthProvider({ 
  children, 
  appName,
  requireOrganization = true,
  redirectTo = '/auth/login'
}: HERAUniversalAuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const authStore = useHERAAuth()
  
  // Auto-register app when provider mounts
  useEffect(() => {
    if (appName && authStore.isAuthenticated && authStore.currentOrganization) {
      if (!authStore.registeredApps.includes(appName)) {
        authStore.registerApp(appName)
      }
    }
  }, [appName, authStore.isAuthenticated, authStore.currentOrganization?.id])
  
  // Handle authentication redirects
  useEffect(() => {
    // Skip auth checks for public routes
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/organizations']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    
    if (isPublicRoute) return
    
    // Redirect if not authenticated
    if (!authStore.isLoading && !authStore.isAuthenticated) {
      router.push(redirectTo)
      return
    }
    
    // Redirect if organization required but not selected
    if (
      requireOrganization && 
      authStore.isAuthenticated && 
      !authStore.currentOrganization &&
      !pathname.startsWith('/auth/organizations')
    ) {
      router.push('/auth/organizations')
      return
    }
    
  }, [
    authStore.isAuthenticated, 
    authStore.isLoading, 
    authStore.currentOrganization,
    pathname,
    requireOrganization,
    redirectTo,
    router
  ])
  
  const contextValue: HERAUniversalAuthContextType = {
    // Authentication state
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    user: authStore.user,
    
    // Organization state  
    organizations: authStore.organizations,
    organization: authStore.currentOrganization,
    
    // App state
    currentApp: authStore.currentApp,
    registeredApps: authStore.registeredApps,
    
    // JWT token
    accessToken: authStore.accessToken,
    
    // Actions
    signIn: authStore.signIn,
    signUp: authStore.signUp,
    signOut: authStore.signOut,
    selectOrganization: authStore.selectOrganization,
    registerApp: authStore.registerApp,
    
    // Context helpers
    requireAuth: () => {
      if (!authStore.isAuthenticated) {
        router.push(redirectTo)
        return false
      }
      return true
    },
    
    requireOrg: () => {
      if (!authStore.currentOrganization) {
        router.push('/auth/organizations')
        return false
      }
      return true
    },
    
    hasAppAccess: (app: string) => {
      return authStore.registeredApps.includes(app)
    }
  }
  
  return (
    <HERAUniversalAuthContext.Provider value={contextValue}>
      {children}
    </HERAUniversalAuthContext.Provider>
  )
}

// Universal hook that works across all apps
export function useHERAUniversalAuth(): HERAUniversalAuthContextType {
  const context = useContext(HERAUniversalAuthContext)
  
  if (!context) {
    throw new Error('useHERAUniversalAuth must be used within HERAUniversalAuthProvider')
  }
  
  return context
}

// Backwards compatibility hooks
export function useCashewAuth() {
  return useHERAUniversalAuth()
}

export function useSalonAuth() {
  return useHERAUniversalAuth()
}

export function useRetailAuth() {
  return useHERAUniversalAuth()
}

// HOC for protected routes
export function withHERAAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    appName?: string
    requireOrganization?: boolean
    redirectTo?: string
  } = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <HERAUniversalAuthProvider {...options}>
        <Component {...props} />
      </HERAUniversalAuthProvider>
    )
  }
}

// Auth guard component
export function HERAAuthGuard({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  const { isAuthenticated, isLoading } = useHERAUniversalAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}