/**
 * HERA Playbooks Authentication Provider
 *
 * React context provider for playbook authentication state
 * with automatic organization context management.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  PlaybookAuthContext,
  PlaybookAuthState,
  playbookAuthService
} from '@/lib/playbooks/auth/playbook-auth'

// Create React context
const PlaybookAuthReactContext = createContext<PlaybookAuthContext | null>(null)

interface PlaybookAuthProviderProps {
  children: ReactNode
  autoInitialize?: boolean
  requireAuth?: boolean
  fallbackComponent?: ReactNode
}

/**
 * Playbook Authentication Provider Component
 */
export function PlaybookAuthProvider({
  children,
  autoInitialize = true,
  requireAuth = false,
  fallbackComponent
}: PlaybookAuthProviderProps) {
  const [authState, setAuthState] = useState<PlaybookAuthState>(playbookAuthService.getState())
  const [isInitialized, setIsInitialized] = useState(false)

  // Subscribe to auth service changes
  useEffect(() => {
    const unsubscribe = playbookAuthService.subscribe(state => {
      setAuthState(state)
    })

    return unsubscribe
  }, [])

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initializeAuth()
    }
  }, [autoInitialize, isInitialized])

  const initializeAuth = async () => {
    try {
      await playbookAuthService.refreshAuth()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    } finally {
      setIsInitialized(true)
    }
  }

  // Auth context methods
  const login = async (email: string, password: string): Promise<boolean> => {
    return playbookAuthService.login(email, password)
  }

  const logout = async (): Promise<void> => {
    return playbookAuthService.logout()
  }

  const refreshAuth = async (): Promise<void> => {
    return initializeAuth()
  }

  const switchOrganization = async (orgId: string): Promise<void> => {
    return playbookAuthService.switchOrganization(orgId)
  }

  const hasPermission = (permission: string): boolean => {
    return playbookAuthService.hasPermission(permission)
  }

  const hasRole = (role: string): boolean => {
    return playbookAuthService.hasRole(role)
  }

  const canExecutePlaybook = (playbookId: string): boolean => {
    return playbookAuthService.canExecutePlaybook(playbookId)
  }

  const canManagePlaybooks = (): boolean => {
    return playbookAuthService.canManagePlaybooks()
  }

  // Build context value
  const contextValue: PlaybookAuthContext = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    organization: authState.organization,
    organizationId: authState.organization?.id || null,
    login,
    logout,
    refreshAuth,
    switchOrganization,
    hasPermission,
    hasRole,
    canExecutePlaybook,
    canManagePlaybooks
  }

  // Show loading state during initialization
  if (!isInitialized && autoInitialize) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Initializing playbooks...</span>
      </div>
    )
  }

  // Show auth required state
  if (requireAuth && !authState.isAuthenticated && isInitialized) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the playbooks system.</p>
          <PlaybookLoginForm />
        </div>
      </div>
    )
  }

  return (
    <PlaybookAuthReactContext.Provider value={contextValue}>
      {children}
    </PlaybookAuthReactContext.Provider>
  )
}

/**
 * Hook to use playbook authentication context
 */
export function usePlaybookAuthContext(): PlaybookAuthContext {
  const context = useContext(PlaybookAuthReactContext)

  if (!context) {
    throw new Error('usePlaybookAuthContext must be used within a PlaybookAuthProvider')
  }

  return context
}

/**
 * Simple login form component
 */
function PlaybookLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const success = await playbookAuthService.login(email, password)

      if (!success) {
        setError('Invalid credentials. Please try again.')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  )
}

/**
 * Higher-order component for protecting routes with authentication
 */
export function withPlaybookAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean
    requiredPermissions?: string[]
    requiredRoles?: string[]
    fallback?: ReactNode
  }
) {
  return function AuthenticatedComponent(props: P) {
    const auth = usePlaybookAuthContext()

    // Check authentication
    if (options?.requireAuth && !auth.isAuthenticated) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Authentication required to access this page.</p>
        </div>
      )
    }

    // Check permissions
    if (options?.requiredPermissions?.length) {
      const hasAllPermissions = options.requiredPermissions.every(permission =>
        auth.hasPermission(permission)
      )

      if (!hasAllPermissions) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        )
      }
    }

    // Check roles
    if (options?.requiredRoles?.length) {
      const hasRequiredRole = options.requiredRoles.some(role => auth.hasRole(role))

      if (!hasRequiredRole) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have the required role to access this page.</p>
          </div>
        )
      }
    }

    // Show fallback if provided
    if (options?.fallback && auth.isLoading) {
      return <>{options.fallback}</>
    }

    return <Component {...props} />
  }
}

/**
 * Component for displaying current auth status (useful for debugging)
 */
export function PlaybookAuthStatus() {
  const auth = usePlaybookAuthContext()

  return (
    <div className="bg-gray-50 p-4 rounded-lg text-sm">
      <h3 className="font-medium text-gray-900 mb-2">Authentication Status</h3>
      <div className="space-y-1">
        <div>
          <span className="text-gray-600">Authenticated:</span>{' '}
          <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {auth.isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        {auth.user && (
          <div>
            <span className="text-gray-600">User:</span> {auth.user.name} ({auth.user.email})
          </div>
        )}
        {auth.organization && (
          <div>
            <span className="text-gray-600">Organization:</span> {auth.organization.name}
          </div>
        )}
        {auth.user?.roles && (
          <div>
            <span className="text-gray-600">Roles:</span> {auth.user.roles.join(', ')}
          </div>
        )}
        <div>
          <span className="text-gray-600">Can Manage Playbooks:</span>{' '}
          <span className={auth.canManagePlaybooks() ? 'text-green-600' : 'text-red-600'}>
            {auth.canManagePlaybooks() ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  )
}
