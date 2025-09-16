// ================================================================================
// HERA AUTH GUARD - ROLE-BASED ACCESS CONTROL
// Smart Code: HERA.AUTH.GUARD.RBAC.v1
// Guard component for protecting routes and features based on user roles
// ================================================================================

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, ShieldX } from 'lucide-react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { Card } from '@/src/components/ui/card'
import { landingForRole, isAllowed, getUnauthorizedRedirect, Role as RBACRole } from './rbac'

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
  redirectTo = '/auth/login',
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
  const pathname = usePathname()
  const { user, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Wait for auth to initialize
    if (!contextLoading) {
      setIsInitialized(true)
    }
  }, [contextLoading])

  useEffect(() => {
    if (!isInitialized || contextLoading) return

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      if (!silent) {
        router.push(redirectTo)
      }
      return
    }

    // Check RBAC access for current path
    if (isAuthenticated && user) {
      const userRole = (user.role || 'customer') as RBACRole
      const pathAllowed = isAllowed(userRole, pathname)

      // First check path-based access
      if (!pathAllowed) {
        if (!silent) {
          const redirect = getUnauthorizedRedirect(userRole)
          router.push(redirect)
        }
        return
      }

      // Then check explicit role requirements
      const hasRequiredRole = requiredRole ? user.role === requiredRole : true
      const hasAllowedRole = allowedRoles.length > 0 
        ? allowedRoles.includes(user.role || 'customer')
        : true

      if (!hasRequiredRole || !hasAllowedRole) {
        if (!silent && !showUnauthorized) {
          const redirect = getUnauthorizedRedirect(userRole)
          router.push(redirect)
        }
        return
      }

      // Custom permission check
      if (permissionCheck && !permissionCheck(user)) {
        if (!silent && !showUnauthorized) {
          const redirect = getUnauthorizedRedirect(userRole)
          router.push(redirect)
        }
        return
      }
    }
  }, [
    isInitialized,
    contextLoading,
    isAuthenticated,
    pathname,
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
  if (!isInitialized || contextLoading) {
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
    const userRole = user.role || 'customer'
    const hasRequiredRole = requiredRole ? userRole === requiredRole : true
    const hasAllowedRole = allowedRoles.length > 0 
      ? allowedRoles.includes(userRole)
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
                    <p>Your role: {user.role || 'customer'}</p>
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
  const { user, isAuthenticated } = useMultiOrgAuth()

  const hasRole = (role: string): boolean => {
    return isAuthenticated && user ? user.role === role : false
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return isAuthenticated && user ? roles.includes(user.role || 'customer') : false
  }

  const hasAllRoles = (roles: string[]): boolean => {
    // User can only have one role in this system
    return false
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
  ADMIN: 'admin',
  MANAGER: 'manager',
  STYLIST: 'stylist',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
  ACCOUNTANT: 'accountant'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Hook for route guard
export function useRouteGuard(): { allowed: boolean; redirect: string } {
  const { user } = useMultiOrgAuth()
  const pathname = usePathname()
  
  const role = (user?.role || 'customer') as RBACRole
  const allowed = isAllowed(role, pathname)
  const redirect = allowed ? '' : getUnauthorizedRedirect(role)
  
  return { allowed, redirect }
}

// Hook to redirect to role landing
export function useRoleLanding() {
  const router = useRouter()
  const { user } = useMultiOrgAuth()
  
  const redirectToLanding = () => {
    const role = (user?.role || 'customer') as RBACRole
    const landing = landingForRole(role)
    router.replace(landing)
  }
  
  return { redirectToLanding }
}

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