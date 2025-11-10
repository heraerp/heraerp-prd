'use client'

import { useState } from 'react'
import { ShoppingCart, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { Button } from '@/components/ui/button'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface AppInfo {
  code: string
  name: string
  description: string
  icon: React.ElementType
  gradient: string
  features: string[]
  pricing: {
    plan: string
    description: string
  }
}

interface AppPurchaseModalProps {
  open: boolean
  onClose: () => void
  app: AppInfo | null
  onPurchaseSuccess?: () => void
}

/**
 * HERA APP PURCHASE MODAL
 *
 * Enterprise-grade app purchase/installation interface
 * Uses hera_org_link_app_v1 RPC for app installation
 *
 * Features:
 * - App details display with features
 * - Enterprise license configuration
 * - RPC-based purchase flow
 * - Success/error handling
 * - Auto-redirect to app after purchase
 * - Auto-set as default app if first app
 */
export function AppPurchaseModal({ open, onClose, app, onPurchaseSuccess }: AppPurchaseModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, currentOrganization, refreshAuth } = useHERAAuth()

  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  if (!app) return null

  const Icon = app.icon

  const handlePurchase = async () => {
    if (!user?.id || !currentOrganization?.id) {
      setPurchaseError('Authentication error: Missing user or organization context')
      return
    }

    setIsPurchasing(true)
    setPurchaseError(null)

    try {
      console.log('🛒 Purchasing app:', {
        app_code: app.code,
        organization_id: currentOrganization.id,
        actor_user_id: user.id
      })

      // Call hera_org_link_app_v1 RPC
      const { data, error } = await supabase.rpc('hera_org_link_app_v1', {
        p_actor_user_id: user.id,
        p_organization_id: currentOrganization.id,
        p_app_code: app.code.toUpperCase(),
        p_installed_at: new Date().toISOString(),
        p_subscription: {
          plan: app.pricing.plan,
          purchased_at: new Date().toISOString(),
          purchased_by: user.id,
          status: 'active'
        },
        p_config: {
          // Default configuration for the app
          enable_all_features: true,
          purchased_via: 'app_store_ui',
          initial_setup: 'pending'
        },
        p_is_active: true
      })

      if (error) {
        console.error('❌ Purchase error:', error)
        throw new Error(error.message || 'Failed to purchase app')
      }

      console.log('✅ App purchased successfully:', data)

      // Refresh auth context to update available apps
      await refreshAuth()

      // Call success callback if provided
      if (onPurchaseSuccess) {
        onPurchaseSuccess()
      }

      // Close modal
      onClose()

      // Show success message and redirect
      setTimeout(() => {
        // Redirect to app auth page (which handles role-based routing)
        const appPath = `/${app.code.toLowerCase()}/auth`
        console.log('🚀 Redirecting to app:', appPath)
        router.push(appPath)
      }, 500)

    } catch (error) {
      console.error('❌ Purchase failed:', error)
      setPurchaseError(error instanceof Error ? error.message : 'Failed to purchase app. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title={`Purchase ${app.name}`}
      description="Add this application to your organization"
      icon={<ShoppingCart className="w-6 h-6" />}
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onClose()}
            disabled={isPurchasing}
            className="outline-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="primary-button"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Purchasing...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase & Activate
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6 py-4">
        {/* App Header with Icon */}
        <div className="flex items-start gap-4">
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
          >
            <Icon className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-champagne mb-2">{app.name}</h3>
            <p className="text-sm text-bronze">{app.description}</p>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-champagne uppercase tracking-wide">
            Included Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {app.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-gold" />
                </div>
                <span className="text-sm text-champagne">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Information */}
        <div className="p-4 rounded-xl bg-charcoal-lighter border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-champagne">License Type</span>
            <span className="text-lg font-bold text-gold">{app.pricing.plan}</span>
          </div>
          <p className="text-xs text-bronze">{app.pricing.description}</p>
        </div>

        {/* Enterprise Benefits */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-gold/10 to-champagne/5 border border-gold/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-champagne mb-2">
                Enterprise Benefits
              </h4>
              <ul className="space-y-1 text-xs text-bronze">
                <li>✓ Multi-tenant security & data isolation</li>
                <li>✓ Role-based access control (RBAC)</li>
                <li>✓ Complete audit trail & compliance</li>
                <li>✓ Instant activation & configuration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Organization Context */}
        <div className="p-3 rounded-lg bg-charcoal-lighter border border-gold/10">
          <p className="text-xs text-bronze">
            Installing for: <span className="font-semibold text-champagne">{currentOrganization?.name}</span>
          </p>
        </div>

        {/* Error Message */}
        {purchaseError && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border-2 border-red-500/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-1">Purchase Failed</h4>
                <p className="text-xs text-red-200">{purchaseError}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SalonLuxeModal>
  )
}
