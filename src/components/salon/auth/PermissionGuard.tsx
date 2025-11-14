'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useHairTalkzRBAC } from '@/hooks/useHairTalkzRBAC'
import { Loader2 } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requireAny?: boolean // If true, user needs ANY of the permissions. If false, needs ALL
  fallbackPath?: string
}

export function PermissionGuard({
  children,
  requiredPermissions = [],
  requireAny = true,
  fallbackPath = '/salon/auth'
}: PermissionGuardProps) {
  const router = useRouter()
  const { permissions, hasAnyPermission, hasAllPermissions, isLoading } = useHairTalkzRBAC()

  useEffect(() => {
    if (!isLoading && requiredPermissions.length > 0) {
      const hasAccess = requireAny
        ? hasAnyPermission(requiredPermissions)
        : hasAllPermissions(requiredPermissions)

      if (!hasAccess) {
        console.warn('Access denied. Missing permissions:', requiredPermissions)
        router.replace(fallbackPath)
      }
    }
  }, [
    isLoading,
    permissions,
    requiredPermissions,
    requireAny,
    fallbackPath,
    router,
    hasAnyPermission,
    hasAllPermissions
  ])

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  // If no permissions required or has access, render children
  if (requiredPermissions.length === 0) {
    return <>{children}</>
  }

  const hasAccess = requireAny
    ? hasAnyPermission(requiredPermissions)
    : hasAllPermissions(requiredPermissions)

  if (!hasAccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-lg"
          style={{
            backgroundColor: LUXE_COLORS.charcoalLight,
            border: `1px solid ${LUXE_COLORS.bronze}50`
          }}
        >
          <h1 className="text-2xl font-light mb-4" style={{ color: LUXE_COLORS.gold }}>
            Access Denied
          </h1>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            You don't have permission to access this page
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
