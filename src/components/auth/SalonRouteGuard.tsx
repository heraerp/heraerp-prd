'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { hasPageAccess, getDefaultPath, getAccessDeniedMessage, type SalonRole } from '@/lib/auth/salon-rbac'
import { AlertCircle, ShieldOff, ArrowLeft } from 'lucide-react'

interface SalonRouteGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Client-side route guard for salon pages
 *
 * Checks user role and redirects if unauthorized
 * Shows loading state while checking permissions
 */
export function SalonRouteGuard({ children, fallback }: SalonRouteGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<SalonRole | null>(null)

  useEffect(() => {
    async function checkAccess() {
      setIsChecking(true)

      // Wait for auth context to load
      if (contextLoading) {
        return
      }

      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        console.log('[RouteGuard] Not authenticated, redirecting to /salon-access')
        router.replace('/salon-access')
        return
      }

      // No organization context - redirect to org selector
      if (!organization?.id) {
        console.log('[RouteGuard] No organization context, redirecting to /auth/organizations')
        router.replace('/auth/organizations')
        return
      }

      // Get user role from localStorage (set during login as 'salonRole')
      const storedRole = localStorage.getItem('salonRole') || localStorage.getItem('userRole')
      const role = (storedRole?.toLowerCase() || 'receptionist') as SalonRole

      console.log('[RouteGuard] Role from localStorage:', { storedRole, normalized: role })
      setUserRole(role)

      // Check if user has access to current path
      const canAccess = hasPageAccess(role, pathname)

      console.log('[RouteGuard]', {
        role,
        path: pathname,
        canAccess,
        user: user.id,
        org: organization.id
      })

      if (!canAccess) {
        console.log('[RouteGuard] Access denied, redirecting to default path')
        // Don't redirect immediately - show access denied message first
        setHasAccess(false)
        setIsChecking(false)

        // Redirect after 3 seconds
        setTimeout(() => {
          const defaultPath = getDefaultPath(role)
          router.replace(defaultPath)
        }, 3000)
      } else {
        setHasAccess(true)
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [pathname, isAuthenticated, user, organization, contextLoading, router])

  // Show loading state
  if (contextLoading || isChecking) {
    return (
      fallback || (
        <div className="min-h-screen bg-charcoal flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-champagne text-lg font-medium">Checking permissions...</p>
            <p className="text-bronze text-sm mt-2">Please wait</p>
          </div>
        </div>
      )
    )
  }

  // Show access denied message
  if (!hasAccess && userRole) {
    const message = getAccessDeniedMessage(userRole, pathname)
    const defaultPath = getDefaultPath(userRole)

    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Access Denied Card */}
          <div className="bg-gradient-to-br from-rose/20 to-rose/5 rounded-2xl p-8 border-2 border-rose/30">
            {/* Icon */}
            <div className="w-20 h-20 bg-rose/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldOff className="w-10 h-10 text-rose" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-champagne text-center mb-4">
              Access Denied
            </h1>

            {/* Message */}
            <div className="bg-charcoal/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-bronze text-sm mb-2">
                    You don't have permission to access this page.
                  </p>
                  <p className="text-champagne/70 text-xs">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-bronze text-xs uppercase tracking-wider">Your Role:</span>
              <span className="px-3 py-1 bg-gold/20 text-gold rounded-full text-xs font-bold uppercase">
                {userRole}
              </span>
            </div>

            {/* Redirect Message */}
            <p className="text-center text-bronze text-sm mb-6">
              Redirecting to your dashboard in <span className="text-gold font-bold">3 seconds</span>...
            </p>

            {/* Action Button */}
            <button
              onClick={() => router.replace(defaultPath)}
              className="w-full min-h-[48px] bg-gold hover:bg-gold/90 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Go to Dashboard
            </button>
          </div>

          {/* Help Text */}
          <p className="text-center text-bronze text-xs mt-6">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // User has access - render children
  return <>{children}</>
}
