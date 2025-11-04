/**
 * HERA Enterprise Role-Based Redirect Hook
 * Centralized role routing with loop prevention and persistence
 *
 * Usage:
 * ```tsx
 * const { isRedirecting, redirectReason } = useRoleBasedRedirect()
 * if (isRedirecting) return <LoadingScreen reason={redirectReason} />
 * ```
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  getSafeRedirectPath,
  getRoleDashboardPath,
  type RoleRoutingConfig
} from '@/lib/auth/role-router'

interface UseRoleBasedRedirectOptions {
  /**
   * App code (SALON, CASHEW, CRM, etc.)
   * If not provided, will auto-detect from URL
   */
  app?: string

  /**
   * Enable redirect (default: true)
   * Set to false to disable automatic redirects
   */
  enabled?: boolean

  /**
   * Debug mode (logs redirect decisions)
   */
  debug?: boolean
}

interface UseRoleBasedRedirectReturn {
  isRedirecting: boolean
  redirectReason: string | null
  expectedPath: string | null
}

export function useRoleBasedRedirect(
  options: UseRoleBasedRedirectOptions = {}
): UseRoleBasedRedirectReturn {
  const { app: providedApp, enabled = true, debug = false } = options

  const router = useRouter()
  const pathname = usePathname()
  const { user, organization, role, isAuthenticated, isLoading } = useHERAAuth()

  const [isRedirecting, setIsRedirecting] = useState(false)
  const [redirectReason, setRedirectReason] = useState<string | null>(null)
  const [expectedPath, setExpectedPath] = useState<string | null>(null)

  const previousPathRef = useRef<string | null>(null)
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    // Skip if disabled, still loading, or not authenticated
    if (!enabled || isLoading || !isAuthenticated || !role || !organization) {
      if (debug) {
        console.log('🔍 Role redirect skipped:', {
          enabled,
          isLoading,
          isAuthenticated,
          hasRole: !!role,
          hasOrg: !!organization
        })
      }
      return
    }

    // Auto-detect app from URL if not provided
    const appCode =
      providedApp ||
      pathname
        ?.split('/')
        .filter(Boolean)[0]
        ?.toUpperCase()

    if (!appCode) {
      if (debug) console.log('⚠️ Could not detect app code from URL:', pathname)
      return
    }

    // Build routing config
    const config: RoleRoutingConfig = {
      app: appCode,
      role: role,
      organizationId: organization.id
    }

    // Calculate expected path
    const calculatedExpectedPath = getRoleDashboardPath(appCode, role)
    setExpectedPath(calculatedExpectedPath)

    // Determine if redirect is needed
    const redirectPath = getSafeRedirectPath(config, pathname, previousPathRef.current || undefined)

    if (redirectPath && !hasRedirectedRef.current) {
      // Redirect needed and not yet performed
      setIsRedirecting(true)
      setRedirectReason(`Redirecting ${role} to correct dashboard`)

      if (debug) {
        console.log('🔄 Role-based redirect:', {
          role,
          app: appCode,
          from: pathname,
          to: redirectPath,
          organization: organization.name
        })
      }

      // Mark as redirected to prevent duplicate redirects
      hasRedirectedRef.current = true

      // Store current path as previous
      previousPathRef.current = pathname

      // Perform redirect with slight delay for smooth UX
      setTimeout(() => {
        router.push(redirectPath)

        // Reset redirect flag after navigation
        setTimeout(() => {
          setIsRedirecting(false)
          hasRedirectedRef.current = false
        }, 1000)
      }, 100)
    } else {
      // No redirect needed or already redirected
      setIsRedirecting(false)
      setRedirectReason(null)

      if (debug && !redirectPath) {
        console.log('✅ User on correct path:', {
          role,
          app: appCode,
          path: pathname,
          expected: calculatedExpectedPath
        })
      }
    }
  }, [
    enabled,
    isLoading,
    isAuthenticated,
    role,
    organization,
    pathname,
    providedApp,
    debug,
    router
  ])

  return {
    isRedirecting,
    redirectReason,
    expectedPath
  }
}

/**
 * Simple redirect loader component
 */
export function RoleBasedRedirectLoader({ reason }: { reason?: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 animate-pulse" />
          <div className="relative w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Setting up your workspace</h3>
        {reason && <p className="text-sm text-gray-400">{reason}</p>}
      </div>
    </div>
  )
}
