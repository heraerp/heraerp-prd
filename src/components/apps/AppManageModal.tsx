'use client'

import { useState } from 'react'
import { Settings, Trash2, AlertTriangle, Loader2, Check, Calendar, User } from 'lucide-react'
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
  installed_at?: string
  subscription?: {
    plan?: string
    status?: string
  }
}

interface AppManageModalProps {
  open: boolean
  onClose: () => void
  app: AppInfo | null
  onUnlinkSuccess?: () => void
}

/**
 * HERA APP MANAGE MODAL
 *
 * Enterprise-grade app management interface with unlink functionality
 * Uses hera_org_unlink_app_v1 RPC for app uninstallation
 *
 * Features:
 * - App configuration details
 * - Unlink/uninstall functionality (soft delete)
 * - Confirmation workflow for safety
 * - RPC-based unlink flow
 * - Success/error handling
 * - Auto-refresh auth context after unlink
 */
export function AppManageModal({ open, onClose, app, onUnlinkSuccess }: AppManageModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, currentOrganization, refreshAuth } = useHERAAuth()

  const [isUnlinking, setIsUnlinking] = useState(false)
  const [unlinkError, setUnlinkError] = useState<string | null>(null)
  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState(false)

  if (!app) return null

  const Icon = app.icon

  const handleUnlinkClick = () => {
    setShowUnlinkConfirmation(true)
    setUnlinkError(null)
  }

  const handleCancelUnlink = () => {
    setShowUnlinkConfirmation(false)
    setUnlinkError(null)
  }

  const handleConfirmUnlink = async () => {
    if (!user?.id || !currentOrganization?.id) {
      setUnlinkError('Authentication error: Missing user or organization context')
      return
    }

    setIsUnlinking(true)
    setUnlinkError(null)

    try {
      console.log('🗑️ Unlinking app:', {
        app_code: app.code,
        organization_id: currentOrganization.id,
        actor_user_id: user.entity_id || user.id
      })

      // Call hera_org_unlink_app_v1 RPC (soft delete by default)
      const { data, error } = await supabase.rpc('hera_org_unlink_app_v1', {
        p_actor_user_id: user.entity_id || user.id,
        p_organization_id: currentOrganization.id,
        p_app_code: app.code.toUpperCase(),
        p_uninstalled_at: new Date().toISOString(),
        p_hard_delete: false // Soft delete - preserves data
      })

      if (error) {
        console.error('❌ Unlink error:', error)
        throw new Error(error.message || 'Failed to unlink app')
      }

      console.log('✅ App unlinked successfully:', data)

      // Refresh auth context to update available apps
      await refreshAuth()

      // Call success callback if provided
      if (onUnlinkSuccess) {
        onUnlinkSuccess()
      }

      // Close modal
      onClose()

      // Redirect to apps page
      setTimeout(() => {
        router.push('/apps')
      }, 500)

    } catch (error) {
      console.error('❌ Unlink failed:', error)
      setUnlinkError(error instanceof Error ? error.message : 'Failed to unlink app. Please try again.')
    } finally {
      setIsUnlinking(false)
      setShowUnlinkConfirmation(false)
    }
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title={`Manage ${app.name}`}
      description="Configure application settings and access"
      icon={<Settings className="w-6 h-6" />}
      size="lg"
      footer={
        !showUnlinkConfirmation ? (
          <>
            <Button
              variant="outline"
              onClick={() => onClose()}
              className="outline-button"
            >
              Close
            </Button>
            <Button
              onClick={handleUnlinkClick}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Unlink App
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleCancelUnlink}
              disabled={isUnlinking}
              className="outline-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUnlink}
              disabled={isUnlinking}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirm Unlink
                </>
              )}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6 py-4">
        {!showUnlinkConfirmation ? (
          <>
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

            {/* Installation Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-champagne uppercase tracking-wide">
                Installation Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Installed Date */}
                {app.installed_at && (
                  <div className="p-3 rounded-lg bg-charcoal-lighter border border-gold/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gold" />
                      <span className="text-xs font-semibold text-champagne uppercase tracking-wide">
                        Installed
                      </span>
                    </div>
                    <p className="text-sm text-bronze">
                      {new Date(app.installed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {/* License Type */}
                {app.subscription?.plan && (
                  <div className="p-3 rounded-lg bg-charcoal-lighter border border-gold/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-gold" />
                      <span className="text-xs font-semibold text-champagne uppercase tracking-wide">
                        License
                      </span>
                    </div>
                    <p className="text-sm text-bronze">{app.subscription.plan}</p>
                  </div>
                )}

                {/* Status */}
                <div className="p-3 rounded-lg bg-charcoal-lighter border border-gold/10">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gold" />
                    <span className="text-xs font-semibold text-champagne uppercase tracking-wide">
                      Status
                    </span>
                  </div>
                  <p className="text-sm text-bronze capitalize">
                    {app.subscription?.status || 'Active'}
                  </p>
                </div>

                {/* Organization */}
                <div className="p-3 rounded-lg bg-charcoal-lighter border border-gold/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-gold" />
                    <span className="text-xs font-semibold text-champagne uppercase tracking-wide">
                      Organization
                    </span>
                  </div>
                  <p className="text-sm text-bronze">{currentOrganization?.name}</p>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-champagne uppercase tracking-wide">
                Active Features
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

            {/* Warning Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-300 mb-2">
                    About Unlinking
                  </h4>
                  <ul className="space-y-1 text-xs text-amber-200/80">
                    <li>• Unlinking removes app access for all users in your organization</li>
                    <li>• Your data is safely preserved and can be restored</li>
                    <li>• Only organization owners and admins can unlink apps</li>
                    <li>• You can re-purchase and reactivate the app anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Unlink Confirmation */}
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border-2 border-red-500/50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-red-200 mb-2">
                      Confirm App Unlink
                    </h4>
                    <p className="text-sm text-red-100/90">
                      Are you sure you want to unlink <strong className="text-red-50">{app.name}</strong> from{' '}
                      <strong className="text-red-50">{currentOrganization?.name}</strong>?
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-black/20 border border-red-500/30">
                  <h5 className="text-sm font-semibold text-red-200 mb-2">This action will:</h5>
                  <ul className="space-y-1 text-xs text-red-100/80">
                    <li>✓ Remove app access for all organization users</li>
                    <li>✓ Preserve all your data (soft delete)</li>
                    <li>✓ Allow re-activation with data restore</li>
                    <li>✓ Redirect you to the apps page</li>
                  </ul>
                </div>
              </div>

              {/* Error Message */}
              {unlinkError && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-600/30 to-rose-600/30 border-2 border-red-600/60">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-200 mb-1">Unlink Failed</h4>
                      <p className="text-xs text-red-100">{unlinkError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SalonLuxeModal>
  )
}
