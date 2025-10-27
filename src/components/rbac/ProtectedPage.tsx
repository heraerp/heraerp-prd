/**
 * Protected Page Component
 * Smart Code: HERA.RBAC.PROTECTED.v1
 * 
 * Page-level access control wrapper component
 */

'use client'

import React from 'react'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Shield, AlertTriangle, Lock, Home } from 'lucide-react'
import Link from 'next/link'

interface ProtectedPageProps {
  children: React.ReactNode
  requiredSpace?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallbackComponent?: React.ReactNode
  showAccessDenied?: boolean
}

export function ProtectedPage({
  children,
  requiredSpace,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackComponent,
  showAccessDenied = true
}: ProtectedPageProps) {
  const { user, isAuthenticated, contextLoading } = useHERAAuth()
  const userId = user?.id || 'demo-user'
  
  const {
    canAccessSpace,
    hasPermission,
    hasRole,
    userRoles,
    isLoading
  } = useAccessControl({ userId })

  // Show loading while checking access
  if (contextLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Checking Access Permissions</h2>
          <p className="text-gray-600">Please wait while we verify your access rights...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You must be logged in to access this page.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Lock className="h-4 w-4 mr-2" />
            Login
          </Link>
        </div>
      </div>
    )
  }

  // Check space access
  if (requiredSpace && !canAccessSpace(requiredSpace)) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    if (!showAccessDenied) {
      return null
    }

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the <strong>{requiredSpace}</strong> module.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Current Roles:</h3>
            <div className="flex flex-wrap gap-2">
              {userRoles.map(role => (
                <span 
                  key={role.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/enterprise/home"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(permission => !hasPermission(permission))
    
    if (missingPermissions.length > 0) {
      if (fallbackComponent) {
        return <>{fallbackComponent}</>
      }

      if (!showAccessDenied) {
        return null
      }

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h1>
            <p className="text-gray-600 mb-4">
              You don't have the required permissions to perform this action.
            </p>
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-red-700 mb-2">Missing Permissions:</h3>
              <ul className="text-sm text-red-600 space-y-1">
                {missingPermissions.map(permission => (
                  <li key={permission} className="font-mono">• {permission}</li>
                ))}
              </ul>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/enterprise/home"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // Check specific roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(roleId => hasRole(roleId))
    
    if (!hasRequiredRole) {
      if (fallbackComponent) {
        return <>{fallbackComponent}</>
      }

      if (!showAccessDenied) {
        return null
      }

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
            <Shield className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Role Access Required</h1>
            <p className="text-gray-600 mb-4">
              This page requires specific role assignments.
            </p>
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-purple-700 mb-2">Required Roles:</h3>
              <ul className="text-sm text-purple-600 space-y-1">
                {requiredRoles.map(roleId => (
                  <li key={roleId}>• {roleId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                ))}
              </ul>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/enterprise/home"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // All access checks passed, render the protected content
  return <>{children}</>
}

// Convenience wrapper for protecting specific sections
interface ProtectedSectionProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallback?: React.ReactNode
  showPlaceholder?: boolean
}

export function ProtectedSection({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
  showPlaceholder = false
}: ProtectedSectionProps) {
  const { user } = useHERAAuth()
  const userId = user?.id || 'demo-user'
  
  const { hasPermission, hasRole, isLoading } = useAccessControl({ userId })

  if (isLoading) {
    return showPlaceholder ? (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ) : null
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
    if (!hasAllPermissions) {
      return fallback || (showPlaceholder ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Access restricted</p>
        </div>
      ) : null)
    }
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(roleId => hasRole(roleId))
    if (!hasRequiredRole) {
      return fallback || (showPlaceholder ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Role access required</p>
        </div>
      ) : null)
    }
  }

  return <>{children}</>
}