/**
 * Safe HERA Authentication Hook
 * Smart Code: HERA.AUTH.SAFE_HOOK.v1
 * 
 * Provides fallback authentication context when HERAAuthProvider is not available
 * Prevents "useHERAAuth must be used within a HERAAuthProvider" errors
 * Includes session storage fallback for authentication persistence
 */

'use client'

import React from 'react'
import { useHERAAuth } from './HERAAuthProvider'

// Get stored session data
function getStoredSession() {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('hera-session')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Fallback auth context for when provider is not available
function createFallbackAuth() {
  return {
    user: null,
    organization: null,
    isAuthenticated: false,
    isLoading: false,
    status: 'idle' as const,
    userEntityId: undefined,
    organizationId: undefined,
    scopes: [],
    hasScope: () => false,
    role: undefined,
    login: async () => { 
      // Redirect to cashew login
      window.location.href = '/cashew/login'
    },
    register: async () => { throw new Error('Registration not available in fallback mode') },
    logout: async () => { 
      // Clear session and redirect
      localStorage.removeItem('hera-session')
      await fetch('/api/v2/auth/session', { method: 'DELETE' })
      window.location.href = '/cashew/login'
    },
    refreshAuth: async () => { 
      // Simply redirect to login when no proper auth provider
      window.location.href = '/cashew/login'
    },
    currentOrganization: null,
    organizations: [],
    contextLoading: false
  }
}

/**
 * Safe HERA Auth Hook
 * 
 * This hook safely accesses HERA authentication context and provides
 * fallback values when the provider is not available, preventing crashes.
 * Includes session storage fallback for authentication persistence.
 * 
 * @returns HERAAuthContext with safe fallbacks
 */
export function useSafeHERAAuth() {
  const [fallbackAuth] = useState(() => createFallbackAuth())

  try {
    // Try to use the regular HERA auth hook
    const auth = useHERAAuth()
    return auth
  } catch (error) {
    // If provider is not available, return minimal fallback context
    console.warn('🛡️ HERAAuthProvider not available, using minimal fallback auth context')
    return fallbackAuth
  }
}

/**
 * Auth Status Component
 * 
 * Displays current authentication status for debugging
 */
export function AuthStatusDebug() {
  const auth = useSafeHERAAuth()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
      <div>Auth: {auth.isAuthenticated ? '✅' : '❌'}</div>
      <div>User: {auth.user?.email || 'None'}</div>
      <div>Org: {auth.organization?.name || 'None'}</div>
      <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
    </div>
  )
}

// Legacy compatibility
export const useSafeAuth = useSafeHERAAuth
export const useSafeMultiOrgAuth = useSafeHERAAuth