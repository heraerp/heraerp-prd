'use client'

import React, { useCallback } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { InventorySettingsCard } from '@/components/salon/settings/InventorySettingsCard'
import { Package, ArrowLeft } from 'lucide-react'
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
  const { organizationId } = useSecuredSalonContext()

  // Memoize callback to prevent unnecessary re-renders
  const handleSettingsChange = useCallback(() => {
    console.log('[InventorySettings] Settings updated successfully')
  }, [])

  // Show loading only while waiting for organizationId
  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div className="text-center">
          <Package
            className="w-12 h-12 mx-auto mb-4 animate-pulse"
            style={{ color: COLORS.gold }}
          />
          <p style={{ color: COLORS.champagne }}>Loading...</p>
        </div>
      </div>
    )
  }

  // organizationId is available, render the page immediately
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.black }}>
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/salon/settings">
          <Button variant="ghost" size="sm" className="gap-2" style={{ color: COLORS.bronze }}>
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
          onSettingsChange={handleSettingsChange}
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
              <strong style={{ color: COLORS.champagne }}>Track by Branch:</strong> Maintain
              separate stock levels for each location
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: COLORS.gold }}>•</span>
            <span>
              <strong style={{ color: COLORS.champagne }}>Per-Product Control:</strong> Enable
              tracking only for physical products (not services)
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
