'use client'

/**
 * HERA Retail Auth Gate
 * Smart Code: HERA.RETAIL.AUTH.GATE.v1
 *
 * Enterprise-grade app access validation for RETAIL app
 * Validates organization has RETAIL app before allowing access
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, ShoppingBag, ChevronRight } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { getRoleRedirectPath, type AppRole } from '@/lib/auth/role-normalizer'

export default function RetailAuthGate() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading, contextLoading, user } = useHERAAuth()
  const [error, setError] = useState<string | null>(null)
  const [showAppPurchaseButton, setShowAppPurchaseButton] = useState(false)
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    async function validateAccess() {
      // Wait for auth context to load
      if (isLoading || contextLoading) {
        return
      }

      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login...')
        router.replace('/auth/login?return_to=/retail')
        return
      }

      // Need to validate via HERAAuthProvider's membership data
      // We'll use the availableApps from context
      try {
        // Get membership data by triggering a re-login (this will resolve membership)
        const result = await login(
          user?.email || '',
          '', // Password not needed for re-validation
          { skipPassword: true } as any
        )

        const userOrganizations = result.membershipData?.organizations || []

        if (userOrganizations.length === 0) {
          setError('No organizations found for your account')
          setIsValidating(false)
          return
        }

        // ✅ ENTERPRISE: Validate user has RETAIL app access
        const firstOrg = userOrganizations[0]
        const userApps = firstOrg?.apps || []
        const hasRetailApp = userApps.some((app: any) => app.code.toUpperCase() === 'RETAIL')

        if (!hasRetailApp) {
          // ✅ ENTERPRISE: Role-based handling for app not purchased
          const userRole = result.role
          const isOwner = userRole === 'owner'

          if (isOwner) {
            // Owner: Show purchase option with button
            setShowAppPurchaseButton(true)
            setError(`Your organization (${firstOrg?.name || 'Unknown'}) does not have the RETAIL app.`)
          } else {
            // Non-owner: Show contact admin message (no button)
            setShowAppPurchaseButton(false)
            setError(`Your organization does not have the RETAIL app. Please contact your organization owner to purchase this app.`)
          }
          setIsValidating(false)
          return
        }

        // ✅ App validated - redirect to retail dashboard
        const role = result.role as AppRole
        const redirectPath = getRoleRedirectPath(role, 'retail')

        console.log('✅ RETAIL app validated, redirecting to:', redirectPath)
        router.replace(redirectPath)

      } catch (err) {
        console.error('Validation error:', err)
        setError('Failed to validate app access. Please try again.')
        setIsValidating(false)
      }
    }

    validateAccess()
  }, [isAuthenticated, isLoading, contextLoading, user, router, login])

  // Loading state
  if (isValidating || isLoading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white text-lg">Validating RETAIL app access...</p>
          <p className="text-blue-300 text-sm mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            RETAIL App Not Available
          </h1>

          {/* Error Message */}
          {error && (
            <Alert className="mb-6 bg-red-900/30 border-red-800/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {/* Purchase Button for Owners */}
          {showAppPurchaseButton && (
            <button
              onClick={() => router.push('/apps?mode=store&highlight=RETAIL')}
              className="w-full mb-4 relative group overflow-hidden rounded-lg px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-emerald-400 text-sm">Purchase RETAIL App</p>
                    <p className="text-xs text-emerald-300/70">Unlock retail management features</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}

          {/* Back to Apps */}
          <Button
            onClick={() => router.push('/apps')}
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Back to My Apps
          </Button>
        </div>
      </div>
    </div>
  )
}
