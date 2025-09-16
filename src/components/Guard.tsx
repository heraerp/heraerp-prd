// ================================================================================
// HERA AUTH GUARD
// Smart Code: HERA.GUARD.AUTH.v1
// Route protection with RBAC
// ================================================================================

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/lib/auth/session'

interface GuardProps {
  children: React.ReactNode
  roles?: string[]
  redirect?: string
}

export function Guard({ children, roles, redirect = '/login' }: GuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push(redirect)
      return
    }

    // Check role requirements
    if (roles && roles.length > 0 && user) {
      const hasRequiredRole = user.roles.some(role => roles.includes(role))
      if (!hasRequiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [isAuthenticated, isLoading, user, roles, redirect, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render children until authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}