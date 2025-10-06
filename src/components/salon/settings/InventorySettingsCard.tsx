/**
 * HERA Enterprise Inventory Settings Card
 * Smart Code: HERA.UI.SETTINGS.INVENTORY.CARD.V1
 *
 * Enterprise-grade inventory management control panel
 * Provides hierarchical inventory settings with clear visual feedback
 */

'use client'

import React from 'react'
import { useInventorySettings } from '@/hooks/useInventorySettings'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Building2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  Loader2
} from 'lucide-react'

const COLORS = {
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface InventorySettingsCardProps {
  organizationId: string
  onSettingsChange?: () => void
}

export function InventorySettingsCard({ organizationId, onSettingsChange }: InventorySettingsCardProps) {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleToggle = async (value: boolean) => {
    setIsLoading(true)
    try {
      // TODO: Save to database via API
      setIsEnabled(value)
      onSettingsChange?.()
    } catch (error) {
      console.error('Failed to update inventory settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      className="p-6"
      style={{
        backgroundColor: COLORS.charcoalDark + 'E6',
        borderColor: COLORS.bronze + '30',
        boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}10 100%)`,
              border: `2px solid ${COLORS.gold}50`
            }}
          >
            <Package className="w-6 h-6" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.champagne }}>
              Inventory Management
            </h3>
            <p className="text-sm" style={{ color: COLORS.bronze }}>
              Enable or disable inventory tracking for your products
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <Badge
          variant={isEnabled ? 'default' : 'secondary'}
          className="flex items-center gap-1.5"
          style={{
            backgroundColor: isEnabled ? COLORS.gold + '20' : COLORS.bronze + '20',
            color: isEnabled ? COLORS.gold : COLORS.bronze,
            border: `1px solid ${isEnabled ? COLORS.gold : COLORS.bronze}40`
          }}
        >
          {isEnabled ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Disabled
            </>
          )}
        </Badge>
      </div>

      {/* Simple Toggle */}
      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: isEnabled ? COLORS.gold + '08' : COLORS.charcoalLight + '50',
          borderColor: isEnabled ? COLORS.gold + '40' : COLORS.bronze + '30'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Package className="w-6 h-6" style={{ color: COLORS.gold }} />
            <div>
              <p className="font-semibold text-base mb-1" style={{ color: COLORS.champagne }}>
                Track Inventory
              </p>
              <p className="text-sm" style={{ color: COLORS.bronze }}>
                Enable stock tracking and management for products
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="scale-125"
            style={{
              backgroundColor: isEnabled ? COLORS.gold : COLORS.bronze + '40'
            }}
          />
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="mt-6 p-4 rounded-lg flex items-start gap-3"
        style={{
          backgroundColor: isEnabled ? COLORS.gold + '10' : COLORS.bronze + '15',
          border: `1px solid ${isEnabled ? COLORS.gold : COLORS.bronze}30`
        }}
      >
        {isEnabled ? (
          <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: COLORS.gold }} />
        ) : (
          <Info className="w-5 h-5 mt-0.5" style={{ color: COLORS.bronze }} />
        )}
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: isEnabled ? COLORS.gold : COLORS.bronze }}>
            {isEnabled ? 'Inventory Tracking Enabled' : 'Inventory Tracking Disabled'}
          </p>
          <p className="text-xs" style={{ color: COLORS.bronze }}>
            {isEnabled
              ? 'Products will show stock information and you can manage inventory levels from the Inventory page.'
              : 'Products will not show stock information. Enable this to start tracking inventory.'}
          </p>
        </div>
      </div>
    </Card>
  )
}
