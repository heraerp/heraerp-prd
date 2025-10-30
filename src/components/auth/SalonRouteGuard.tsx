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
      <div
        className="min-h-screen relative flex items-center justify-center p-4"
        style={{
          backgroundColor: '#1A1A1A',
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 0% 100%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)
          `
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 70% 80%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)
            `,
            animation: 'gradient-slow 20s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }}
        />

        <div className="max-w-lg w-full relative z-10">
          {/* Access Denied Card */}
          <div
            className="rounded-3xl p-10 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)'
            }}
          >
            {/* Shield Icon with Premium Styling */}
            <div
              className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(232, 180, 184, 0.08) 100%)',
                border: '2px solid rgba(232, 180, 184, 0.3)',
                boxShadow: '0 8px 24px rgba(232, 180, 184, 0.2)'
              }}
            >
              <ShieldOff className="w-12 h-12" style={{ color: '#E8B4B8' }} />

              {/* Pulsing ring effect */}
              <div
                className="absolute inset-0 rounded-2xl animate-pulse"
                style={{
                  border: '2px solid rgba(232, 180, 184, 0.2)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            </div>

            {/* Title with Gold Gradient */}
            <h1
              className="text-3xl font-bold text-center mb-3"
              style={{
                background: 'linear-gradient(135deg, #F5E6D3 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
            >
              Access Restricted
            </h1>

            <p className="text-center text-base mb-8" style={{ color: '#C9A961' }}>
              This page requires elevated permissions
            </p>

            {/* Message Box */}
            <div
              className="rounded-2xl p-6 mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(26,26,26,0.6) 0%, rgba(15,15,15,0.6) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                boxShadow: 'inset 0 1px 0 rgba(212, 175, 55, 0.1)'
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D4AF37' }} />
                <div>
                  <p className="text-sm mb-2" style={{ color: '#F5E6D3' }}>
                    You don't have permission to access this page.
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#C9A961' }}>
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#C9A961' }}>
                Your Role
              </span>
              <div
                className="px-4 py-2 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)'
                }}
              >
                <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#D4AF37' }}>
                  {userRole}
                </span>
              </div>
            </div>

            {/* Redirect Timer */}
            <div
              className="rounded-xl p-4 mb-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.1)'
              }}
            >
              <p className="text-sm" style={{ color: '#C9A961' }}>
                Redirecting to your dashboard in{' '}
                <span className="font-bold" style={{ color: '#D4AF37' }}>3 seconds</span>
              </p>
            </div>

            {/* Action Button - SalonLuxe Style */}
            <button
              onClick={() => router.replace(defaultPath)}
              className="w-full min-h-[56px] rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                color: '#1A1A1A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </button>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs mt-6" style={{ color: '#8B7355' }}>
            If you believe this is an error, please contact your administrator
          </p>
        </div>

        {/* Animation styles */}
        <style jsx>{`
          @keyframes gradient-slow {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1) rotate(0deg);
            }
            33% {
              opacity: 0.4;
              transform: scale(1.1) rotate(2deg);
            }
            66% {
              opacity: 0.25;
              transform: scale(0.95) rotate(-2deg);
            }
          }
        `}</style>
      </div>
    )
  }

  // User has access - render children
  return <>{children}</>
}
