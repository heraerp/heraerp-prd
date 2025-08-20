'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface UniversalAuthenticatedLayoutProps {
  children: React.ReactNode
  requiredRole?: string | string[] // Optional role requirements
  redirectTo?: string // Custom redirect path instead of default /auth/login
  onboardingPath?: string // Custom onboarding path instead of default /onboarding
  loadingComponent?: React.ReactNode // Custom loading component
  appName?: string // App name for branding
  appIcon?: React.ReactNode // App icon for loading state
  backgroundColor?: string // Custom background for loading state
}

export function UniversalAuthenticatedLayout({
  children,
  requiredRole,
  redirectTo = '/auth/login',
  onboardingPath = '/onboarding',
  loadingComponent,
  appName = 'HERA',
  appIcon,
  backgroundColor = 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
}: UniversalAuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading, organization, heraContext } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push(redirectTo)
      return
    }

    // Authenticated but no organization - redirect to onboarding
    if (!organization?.id) {
      toast({
        title: 'Organization Required',
        description: 'You need to complete your organization setup to access this area.',
        variant: 'destructive',
        duration: 5000
      })
      router.push(onboardingPath)
      return
    }

    // Check role requirements if specified
    if (requiredRole && heraContext?.role) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(heraContext.role)) {
        toast({
          title: 'Access Denied',
          description: `You need ${roles.join(' or ')} role to access this area.`,
          variant: 'destructive',
          duration: 5000
        })
        router.push('/dashboard')
        return
      }
    }
  }, [isAuthenticated, isLoading, organization, heraContext, router, toast, redirectTo, onboardingPath, requiredRole])

  // Show loading state while checking auth
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className={`min-h-screen ${backgroundColor} flex items-center justify-center`}>
        <div className="text-center">
          {appIcon || <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />}
          <p className="text-gray-600">Loading {appName}...</p>
        </div>
      </div>
    )
  }

  // Don't render children until we've confirmed authentication and organization
  if (!isAuthenticated || !organization?.id) {
    return null
  }

  // Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (heraContext?.role && !roles.includes(heraContext.role)) {
      return null
    }
  }

  return <>{children}</>
}