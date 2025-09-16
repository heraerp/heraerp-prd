// ================================================================================
// HERA AUTH GUARD - ROLE-BASED ACCESS CONTROL
// Smart Code: HERA.AUTH.GUARD.RBAC.v1
// Guard component for protecting routes and features based on user roles
// ================================================================================

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldX } from 'lucide-react'
import { useAuth } from './session'
import { Card } from '@/src/components/ui/Card'

export interface GuardProps {
  children: React.ReactNode
  
  // Authentication requirements
  requireAuth?: boolean
  redirectTo?: string
  
  // Role-based access
  allowedRoles?: string[]
  requiredRole?: string
  
  // Feature-based access (for future feature flags)
  requiredFeatures?: string[]
  
  // Custom permission check
  permissionCheck?: (user: any) => boolean
  
  // Loading and error states
  loadingComponent?: React.ReactNode
  unauthorizedComponent?: React.ReactNode
  
  // Behavior options
  showUnauthorized?: boolean
  silent?: boolean
}

export function Guard({
  children,
  requireAuth = true,
  redirectTo = '/login',
  allowedRoles = [],
  requiredRole,
  requiredFeatures = [],
  permissionCheck,
  loadingComponent,
  unauthorizedComponent,
  showUnauthorized = true,
  silent = false,
}: GuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Wait for auth to initialize
    if (!isLoading) {
      setIsInitialized(true)
    }
  }, [isLoading])

  useEffect(() => {
    if (!isInitialized || isLoading) return

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      if (!silent) {
        router.push(redirectTo)
      }
      return
    }

    // Check role-based access
    if (isAuthenticated && user) {
      const hasRequiredRole = requiredRole ? user.roles.includes(requiredRole) : true
      const hasAllowedRole = allowedRoles.length > 0 
        ? user.roles.some(role => allowedRoles.includes(role))
        : true

      if (!hasRequiredRole || !hasAllowedRole) {
        if (!silent && !showUnauthorized) {
          router.push('/unauthorized')
        }
        return
      }

      // Custom permission check
      if (permissionCheck && !permissionCheck(user)) {
        if (!silent && !showUnauthorized) {
          router.push('/unauthorized')
        }
        return
      }
    }
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    user,
    requireAuth,
    requiredRole,
    allowedRoles,
    permissionCheck,
    redirectTo,
    router,
    silent,
    showUnauthorized,
  ])

  // Show loading state
  if (!isInitialized || isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    if (silent) return null
    
    // Will redirect via useEffect, show loading state
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Redirecting to login...</span>
        </div>
      </div>
    )
  }

  // Check authorization
  if (isAuthenticated && user) {
    const hasRequiredRole = requiredRole ? user.roles.includes(requiredRole) : true
    const hasAllowedRole = allowedRoles.length > 0 
      ? user.roles.some(role => allowedRoles.includes(role))
      : true
    const hasCustomPermission = permissionCheck ? permissionCheck(user) : true

    if (!hasRequiredRole || !hasAllowedRole || !hasCustomPermission) {
      if (silent) return null
      
      if (showUnauthorized) {
        if (unauthorizedComponent) {
          return <>{unauthorizedComponent}</>
        }

        return (
          <div className="flex items-center justify-center min-h-[200px] px-4">
            <Card className="max-w-md w-full text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldX className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Access Denied
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You don't have permission to access this feature.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>Your roles: {user.roles.join(', ')}</p>
                    {requiredRole && (
                      <p>Required role: {requiredRole}</p>
                    )}
                    {allowedRoles.length > 0 && (
                      <p>Allowed roles: {allowedRoles.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      }

      // Will redirect via useEffect
      return null
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

// Higher-order component version
export function withGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<GuardProps, 'children'>
) {
  const GuardedComponent = (props: P) => {
    return (
      <Guard {...guardProps}>
        <Component {...props} />
      </Guard>
    )
  }

  GuardedComponent.displayName = `withGuard(${Component.displayName || Component.name})`
  
  return GuardedComponent
}

// Utility hooks for permission checking
export function usePermissions() {
  const { user, isAuthenticated } = useAuth()

  const hasRole = (role: string): boolean => {
    return isAuthenticated && user ? user.roles.includes(role) : false
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return isAuthenticated && user ? user.roles.some(role => roles.includes(role)) : false
  }

  const hasAllRoles = (roles: string[]): boolean => {
    return isAuthenticated && user ? roles.every(role => user.roles.includes(role)) : false
  }

  const canAccess = (permission: string | string[] | ((user: any) => boolean)): boolean => {
    if (!isAuthenticated || !user) return false

    if (typeof permission === 'function') {
      return permission(user)
    }

    if (Array.isArray(permission)) {
      return hasAnyRole(permission)
    }

    return hasRole(permission)
  }

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
  }
}

// Common role constants for type safety
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  STYLIST: 'stylist',
  CASHIER: 'cashier',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Pre-configured guard components for common use cases
export const OwnerOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Guard requiredRole={ROLES.OWNER}>{children}</Guard>
)

export const ManagerOrOwner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Guard allowedRoles={[ROLES.OWNER, ROLES.MANAGER]}>{children}</Guard>
)

export const StaffOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Guard allowedRoles={[ROLES.OWNER, ROLES.MANAGER, ROLES.STYLIST]}>{children}</Guard>
)

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Guard requireAuth>{children}</Guard>
)