'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LoadingState } from '@/components/states/Loading'
import { setOrgId } from '@/lib/api-client'
import { useOrgStore } from '@/state/org'
import { Shield, AlertTriangle } from 'lucide-react'

interface SalonAuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requireOwnerOnly?: boolean
}

// Hair Talkz Salon Organization ID
const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Michele's salon

// Role-based route permissions
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/salon/dashboard': ['Owner', 'Administrator'],
  '/salon/pos2': ['Owner', 'Receptionist', 'Administrator'],
  '/salon/customers': ['Owner', 'Receptionist', 'Administrator'],
  '/salon/appointments': ['Owner', 'Receptionist', 'Administrator'],
  '/salon/finance': ['Owner', 'Accountant', 'Administrator'],
  '/salon/inventory': ['Owner', 'Administrator'],
  '/salon/services': ['Owner', 'Administrator'],
  '/salon/settings': ['Owner', 'Administrator'],
  '/salon/whatsapp': ['Owner', 'Receptionist', 'Administrator'],
  '/salon/leave': ['Owner', 'Administrator'],
  '/salon/staff': ['Owner', 'Administrator'],
  '/salon/reports': ['Owner', 'Accountant', 'Administrator']
}

export function SalonAuthGuard({
  children,
  requiredRoles = [],
  requireOwnerOnly = false
}: SalonAuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setCurrentOrgId } = useOrgStore()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [pathname])

  useEffect(() => {
    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if this is a salon user
        const userMetadata = session.user.user_metadata
        if (userMetadata?.organization_id === SALON_ORG_ID) {
          setIsAuthenticated(true)
          setUserRole(userMetadata.role || 'Staff')
          setUserName(userMetadata.full_name || 'User')
          localStorage.setItem('organizationId', SALON_ORG_ID)
          localStorage.setItem('salonRole', userMetadata.role || 'Staff')
          localStorage.setItem('salonUserName', userMetadata.full_name || 'User')
          setCurrentOrgId(SALON_ORG_ID as any)
          setOrgId(SALON_ORG_ID as any)
          checkRouteAccess(userMetadata.role || 'Staff')
        } else {
          setIsAuthenticated(false)
          router.push('/salon/auth')
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        localStorage.removeItem('organizationId')
        localStorage.removeItem('salonRole')
        localStorage.removeItem('salonUserName')
        router.push('/salon/auth')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, setCurrentOrgId, pathname])

  const checkAuth = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Check if this is a salon demo user
        const userMetadata = session.user.user_metadata
        if (userMetadata?.organization_id === SALON_ORG_ID) {
          setIsAuthenticated(true)
          setUserRole(userMetadata.role || 'Staff')
          setUserName(userMetadata.full_name || 'User')
          localStorage.setItem('organizationId', SALON_ORG_ID)
          localStorage.setItem('salonRole', userMetadata.role || 'Staff')
          localStorage.setItem('salonUserName', userMetadata.full_name || 'User')
          setCurrentOrgId(SALON_ORG_ID as any)
          setOrgId(SALON_ORG_ID as any)
          checkRouteAccess(userMetadata.role || 'Staff')
        } else {
          // Wrong org user, redirect to salon auth
          setIsAuthenticated(false)
          router.push('/salon/auth')
        }
      } else {
        setIsAuthenticated(false)
        router.push('/salon/auth')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      router.push('/salon/auth')
    } finally {
      setIsLoading(false)
    }
  }

  const checkRouteAccess = (role: string) => {
    // Normalize role to handle case variations
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

    // Check if owner-only access is required
    if (requireOwnerOnly && normalizedRole !== 'Owner') {
      setAccessDenied(true)
      return
    }

    // Check required roles from props (case-insensitive)
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(r => r.toLowerCase() === role.toLowerCase())
      if (!hasRequiredRole) {
        setAccessDenied(true)
        return
      }
    }

    // Check route-based permissions
    const allowedRoles = ROUTE_PERMISSIONS[pathname]
    if (allowedRoles) {
      const hasRouteAccess = allowedRoles.some(r => r.toLowerCase() === role.toLowerCase())
      if (!hasRouteAccess) {
        setAccessDenied(true)
        return
      }
    }

    setAccessDenied(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <LoadingState message="Verifying access permissions..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router will redirect
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>

            <p className="text-muted-foreground mb-2">
              You don't have permission to access this page.
            </p>

            <p className="text-sm text-muted-foreground mb-6">
              Logged in as: <span className="font-medium">{userName}</span> ({userRole})
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const roleRedirects: Record<string, string> = {
                    Owner: '/salon/dashboard',
                    Receptionist: '/salon/pos2',
                    Accountant: '/salon/finance',
                    Administrator: '/salon/settings'
                  }
                  const redirectPath = roleRedirects[userRole || ''] || '/salon'
                  router.push(redirectPath)
                }}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Your Dashboard
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/salon/auth')
                }}
                className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Switch Account
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Role display component for showing current user info
export function SalonRoleDisplay() {
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setRole(localStorage.getItem('salonRole'))
    setUserName(localStorage.getItem('salonUserName'))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('organizationId')
    localStorage.removeItem('salonRole')
    localStorage.removeItem('salonUserName')
    router.push('/salon/auth')
  }

  if (!role || !userName) return null

  const roleColors: Record<string, string> = {
    Owner: 'from-purple-500 to-pink-500',
    Receptionist: 'from-blue-500 to-cyan-500',
    Accountant: 'from-green-500 to-emerald-500',
    Administrator: 'from-orange-500 to-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
        <div
          className={`h-8 w-8 rounded-lg bg-gradient-to-br ${roleColors[role] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}
        >
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-accent rounded-lg transition-colors"
      >
        Logout
      </button>
    </div>
  )
}
