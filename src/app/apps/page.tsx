/**
 * HERA Apps Index Page
 * Smart Code: HERA.PLATFORM.APPS.INDEX.v1
 *
 * Landing page for HERA application modules
 * Supports multiple modes:
 * - ?mode=store: Browse and purchase apps
 * - ?mode=manage: Manage installed apps
 * - Default: Auto-route to user's apps
 */

'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { AppStoreView } from '@/components/apps/AppStoreView'
import { AppManagementView } from '@/components/apps/AppManagementView'
import { Loader2, Grid3X3 } from 'lucide-react'
import { getRoleRedirectPath, type AppRole } from '@/lib/auth/role-normalizer'

function AppsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, contextLoading, availableApps, user, organization } = useHERAAuth()

  // Get mode and highlight parameters
  const mode = searchParams.get('mode') // 'store' or 'manage'
  const highlight = searchParams.get('highlight') // App to highlight in store

  // Show loading state
  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full blur-lg opacity-30" />
              <div className="relative bg-indigo-800 p-4 rounded-2xl border border-indigo-700">
                <Grid3X3 className="h-8 w-8 text-indigo-400 animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            HERA Application Modules
          </h1>

          <div className="flex items-center gap-2 text-indigo-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading your workspace...</span>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.replace('/auth/login')
    return null
  }

  // ✅ ENTERPRISE: App Store Mode - Browse and purchase apps
  if (mode === 'store') {
    return <AppStoreView highlightApp={highlight} />
  }

  // ✅ ENTERPRISE: App Management Mode - Manage installed apps
  if (mode === 'manage') {
    return <AppManagementView />
  }

  // ✅ ENTERPRISE: Default behavior - Route to user's apps
  if (availableApps.length === 0) {
    // No apps installed - show store automatically
    console.log('No apps installed, showing app store...')
    return <AppStoreView highlightApp={null} />
  }

  // User has apps - redirect to first available app's dashboard
  const firstApp = availableApps[0]
  const appCode = firstApp.code.toLowerCase()

  // Get role-based redirect path
  const role = (user as any)?.role || 'user'
  const redirectPath = getRoleRedirectPath(role as AppRole, appCode as any)

  console.log('✅ Redirecting to first available app:', {
    app: firstApp.name,
    code: appCode,
    role,
    path: redirectPath
  })

  router.replace(redirectPath)
  return null
}

export default function AppsIndexPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
        </div>
      </div>
    }>
      <AppsPageContent />
    </Suspense>
  )
}
