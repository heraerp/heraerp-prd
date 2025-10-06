'use client'

import React, { useEffect, useState } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { InventorySettingsCard } from '@/components/salon/settings/InventorySettingsCard'
import { PageHeader } from '@/components/universal/PageHeader'
import { Settings, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  charcoalDark: '#0F0F0F'
}

export default function InventorySettingsPage() {
  const { organizationId, isLoading, isAuthenticated } = useSecuredSalonContext()
  const [showTimeout, setShowTimeout] = useState(false)

  // Add debugging
  useEffect(() => {
    console.log('[InventorySettings] Context state:', { organizationId, isLoading, isAuthenticated })
  }, [organizationId, isLoading, isAuthenticated])

  // Set timeout to show message if loading takes too long (10 seconds)
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowTimeout(true)
      }, 10000)
      return () => clearTimeout(timer)
    } else {
      setShowTimeout(false)
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div className="text-center max-w-md">
          <Package className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: COLORS.gold }} />
          <p style={{ color: COLORS.champagne }}>Loading settings...</p>
          {showTimeout && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: COLORS.charcoalDark, border: `1px solid ${COLORS.bronze}30` }}>
              <p className="text-sm mb-2" style={{ color: COLORS.bronze }}>
                Taking longer than expected. This may indicate:
              </p>
              <ul className="text-xs text-left space-y-1" style={{ color: COLORS.bronze }}>
                <li>• No active session - try refreshing the page</li>
                <li>• Network connectivity issues</li>
                <li>• Session expired - you may need to <Link href="/salon/auth" className="underline" style={{ color: COLORS.gold }}>log in again</Link></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div className="text-center max-w-md">
          <Package className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.champagne }}>
            Authentication Required
          </h2>
          <p className="mb-4" style={{ color: COLORS.bronze }}>
            Please sign in to access inventory settings.
          </p>
          <Link href="/salon/auth">
            <Button style={{ backgroundColor: COLORS.gold, color: COLORS.black }}>
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: COLORS.black }}
    >
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/salon/settings">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            style={{ color: COLORS.bronze }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}10 100%)`,
              border: `1px solid ${COLORS.gold}40`
            }}
          >
            <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
              Inventory Settings
            </h1>
            <p className="text-sm" style={{ color: COLORS.bronze }}>
              Configure how inventory tracking works for your organization
            </p>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="max-w-4xl">
        <InventorySettingsCard
          organizationId={organizationId}
          onSettingsChange={() => {
            console.log('[InventorySettings] Settings updated successfully')
          }}
        />
      </div>

      {/* Help Section */}
      <div
        className="max-w-4xl mt-6 p-4 rounded-xl border"
        style={{
          backgroundColor: COLORS.charcoalDark + '80',
          borderColor: COLORS.bronze + '30'
        }}
      >
        <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.champagne }}>
          Need Help?
        </h3>
        <p className="text-xs mb-3" style={{ color: COLORS.bronze }}>
          Inventory management controls how products are tracked across your locations:
        </p>
        <ul className="text-xs space-y-1.5" style={{ color: COLORS.bronze }}>
          <li className="flex items-start gap-2">
            <span style={{ color: COLORS.gold }}>•</span>
            <span>
              <strong style={{ color: COLORS.champagne }}>Enable Inventory Tracking:</strong> Master
              switch that controls all inventory features
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: COLORS.gold }}>•</span>
            <span>
              <strong style={{ color: COLORS.champagne }}>Track by Branch:</strong> Maintain separate
              stock levels for each location
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: COLORS.gold }}>•</span>
            <span>
              <strong style={{ color: COLORS.champagne }}>Per-Product Control:</strong> Enable tracking
              only for physical products (not services)
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
