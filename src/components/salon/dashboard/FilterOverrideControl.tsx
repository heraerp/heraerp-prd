
import React from 'react'
/**
 * 🎛️ FILTER OVERRIDE CONTROL COMPONENT
 *
 * Reusable UI for component-level filter overrides
 * Shows:
 * - Current filter state (global vs override)
 * - Toggle buttons for available periods
 * - Reset button when override is active
 * - Visual indicator of override state
 *
 * @example
 * <FilterOverrideControl
 *   componentId="revenue-trends"
 *   availablePeriods={['last7Days', 'last30Days']}
 *   label="Revenue Period"
 * />
 */

'use client'

import { RotateCcw, Info } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import {
  useDashboardFilter,
  TimePeriod,
  getPeriodLabel,
  getPeriodShortLabel
} from '@/contexts/DashboardFilterContext'

// ============================================================================
// TYPES
// ============================================================================

interface FilterOverrideControlProps {
  componentId: string
  availablePeriods: TimePeriod[]
  label?: string
  compact?: boolean
  showGlobalIndicator?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilterOverrideControl({
  componentId,
  availablePeriods,
  label = 'Local Filter',
  compact = false,
  showGlobalIndicator = true
}: FilterOverrideControlProps) {
  const {
    globalPeriod,
    getComponentPeriod,
    setComponentOverride,
    hasOverride,
    clearComponentOverride
  } = useDashboardFilter()

  const currentPeriod = getComponentPeriod(componentId)
  const isOverridden = hasOverride(componentId)

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handlePeriodChange = (period: TimePeriod) => {
    if (period === globalPeriod) {
      // If selecting global period, clear override
      clearComponentOverride(componentId)
    } else {
      // Otherwise set override
      setComponentOverride(componentId, period)
    }
  }

  const handleReset = () => {
    clearComponentOverride(componentId)
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="flex items-center gap-2">
      {/* Override Indicator */}
      {showGlobalIndicator && !isOverridden && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
          style={{
            background: `${LUXE_COLORS.sapphire}15`,
            border: `1px solid ${LUXE_COLORS.sapphire}30`,
            color: LUXE_COLORS.sapphire
          }}
          title="Using global dashboard filter"
        >
          <Info className="w-3 h-3" />
          <span className="font-medium">Global</span>
        </div>
      )}

      {/* Period Toggle Buttons */}
      <div
        className="flex items-center p-1 rounded-lg"
        style={{
          background: LUXE_COLORS.charcoalDark,
          border: `1px solid ${isOverridden ? LUXE_COLORS.gold : LUXE_COLORS.bronze}30`,
          boxShadow: isOverridden ? `0 0 12px ${LUXE_COLORS.gold}20` : undefined
        }}
      >
        {availablePeriods.map((period) => {
          const isActive = currentPeriod === period
          const isGlobalPeriod = period === globalPeriod

          return (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 relative"
              style={{
                backgroundColor: isActive
                  ? isGlobalPeriod
                    ? `${LUXE_COLORS.sapphire}30`
                    : `${LUXE_COLORS.gold}30`
                  : 'transparent',
                color: isActive
                  ? isGlobalPeriod
                    ? LUXE_COLORS.sapphire
                    : LUXE_COLORS.gold
                  : LUXE_COLORS.bronze,
                border: isActive
                  ? `1px solid ${isGlobalPeriod ? LUXE_COLORS.sapphire : LUXE_COLORS.gold}40`
                  : '1px solid transparent'
              }}
              title={
                isGlobalPeriod
                  ? `${getPeriodLabel(period)} (matches global filter)`
                  : getPeriodLabel(period)
              }
            >
              {compact ? getPeriodShortLabel(period) : getPeriodLabel(period)}
              {isGlobalPeriod && isActive && (
                <div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{
                    background: LUXE_COLORS.sapphire,
                    boxShadow: `0 0 4px ${LUXE_COLORS.sapphire}`
                  }}
                  title="Global filter"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Reset Button (only shown when overridden) */}
      {isOverridden && (
        <button
          onClick={handleReset}
          className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
          style={{
            background: `${LUXE_COLORS.ruby}20`,
            border: `1px solid ${LUXE_COLORS.ruby}40`,
            color: LUXE_COLORS.ruby
          }}
          title="Reset to global filter"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// FILTER STATUS BADGE (Optional companion component)
// ============================================================================

interface FilterStatusBadgeProps {
  componentId: string
}

/**
 * Simple badge that shows if a component has an active override
 * Use this in component headers for quick visual feedback
 */
export function FilterStatusBadge({ componentId }: FilterStatusBadgeProps) {
  const { hasOverride, getComponentPeriod, globalPeriod } = useDashboardFilter()

  if (!hasOverride(componentId)) {
    return null
  }

  const currentPeriod = getComponentPeriod(componentId)

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
      style={{
        background: `${LUXE_COLORS.gold}20`,
        border: `1px solid ${LUXE_COLORS.gold}40`,
        color: LUXE_COLORS.gold
      }}
    >
      <span>Custom Filter: {getPeriodLabel(currentPeriod)}</span>
      <span className="text-[10px]" style={{ color: LUXE_COLORS.bronze }}>
        (Global: {getPeriodLabel(globalPeriod)})
      </span>
    </div>
  )
}
