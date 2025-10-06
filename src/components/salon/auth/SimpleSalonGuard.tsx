'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { LoadingState } from '@/components/states/Loading'
import { AlertTriangle } from 'lucide-react'

interface SimpleSalonGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

// Role-based route permissions - more permissive for demo
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/salon/dashboard': ['owner', 'admin', 'receptionist', 'accountant'],
  '/salon/owner': ['owner', 'admin'], // Owner dashboard - restricted access
  '/salon/appointments': ['owner', 'receptionist', 'admin', 'accountant'],
  '/salon/appointments1': ['owner', 'receptionist', 'admin', 'accountant'],
  '/salon/pos': ['owner', 'receptionist', 'admin'],
  '/pos/sale': ['owner', 'receptionist', 'admin'],
  '/salon/pos': ['owner', 'receptionist', 'admin'],
  '/pos/sale': ['owner', 'receptionist', 'admin'],
  '/salon/customers': ['owner', 'receptionist', 'admin', 'accountant'],
  '/salon/finance': ['owner', 'accountant', 'admin', 'receptionist'],
  '/salon/inventory': ['owner', 'admin', 'receptionist', 'accountant'],
  '/salon/services': ['owner', 'admin', 'receptionist'],
  '/salon/settings': ['owner', 'admin'],
  '/salon/reports': ['owner', 'accountant', 'admin', 'receptionist'],
  '/salon/staff': ['owner', 'admin', 'receptionist', 'accountant'],
  '/salon/products': ['owner', 'admin', 'receptionist', 'accountant'],
  '/salon/categories': ['owner', 'admin', 'receptionist']
}

export function SimpleSalonGuard({ children, requiredRoles = [] }: SimpleSalonGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, isAuthenticated, salonRole, user } = useSecuredSalonContext()
  const role = salonRole

  // Debug mode - check localStorage
  const debugMode =
    typeof window !== 'undefined' && localStorage.getItem('salonDebugMode') === 'true'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('SimpleSalonGuard: Not authenticated, redirecting to auth')
      router.push('/salon/auth')
    }
  }, [isLoading, isAuthenticated, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null // Will redirect via useEffect
  }

  // Check role permissions
  const userRole = role?.toLowerCase() || ''

  // Skip permission checks in debug mode
  if (debugMode) {
    console.log('SimpleSalonGuard: Debug mode enabled, skipping permission checks')
    return <>{children}</>
  }

  // Check required roles from props
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(r => r.toLowerCase() === userRole)
    if (!hasRequiredRole) {
      return (
        <AccessDenied
          userRole={role}
          userName={user?.user_metadata?.full_name}
          pathname={pathname}
        />
      )
    }
  }

  // Check route-based permissions
  const allowedRoles = ROUTE_PERMISSIONS[pathname]
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <AccessDenied userRole={role} userName={user?.user_metadata?.full_name} pathname={pathname} />
    )
  }

  // All checks passed
  return <>{children}</>
}

function AccessDenied({
  userRole,
  userName,
  pathname
}: {
  userRole?: string | null
  userName?: string
  pathname?: string
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>

          <p className="text-muted-foreground mb-2">
            You don't have permission to access this page.
          </p>

          <p className="text-sm text-muted-foreground mb-2">
            Logged in as: <span className="font-medium">{userName || 'User'}</span> (
            {userRole || 'Unknown'})
          </p>

          {pathname && (
            <p className="text-xs text-muted-foreground mb-6">Trying to access: {pathname}</p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/salon/dashboard')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => {
                localStorage.setItem('salonDebugMode', 'true')
                window.location.reload()
              }}
              className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors text-sm"
            >
              Enable Debug Mode (Temporary)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
