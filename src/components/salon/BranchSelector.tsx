/**
 * HERA Branch Selector Component
 * Industry DNA Component: HERA.SALON.UI.BRANCH.SELECTOR.V1
 *
 * Provides branch selection functionality in the header/sidebar
 * with automatic context management and multi-location support.
 */

'use client'

import React from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { MapPin, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface BranchSelectorProps {
  className?: string
  variant?: 'default' | 'minimal' | 'sidebar'
  showIcon?: boolean
}

export function BranchSelector({
  className,
  variant = 'default',
  showIcon = true
}: BranchSelectorProps) {
  const { selectedBranchId, selectedBranch, availableBranches, setSelectedBranchId, isLoading } =
    useSecuredSalonContext()

  // Always show selector when there are branches (removed single branch auto-hide)
  // This allows users to explicitly choose "All Locations" even with one branch

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div
          className="h-10 w-48 rounded-lg"
          style={{ backgroundColor: `${LUXE_COLORS.bronze}20` }}
        />
      </div>
    )
  }

  // No branches available
  if (availableBranches.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        {showIcon && <Building2 className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />}
        <span style={{ color: LUXE_COLORS.bronze }}>No branches</span>
      </div>
    )
  }

  // Show selector with "All Locations" option
  const selectorStyles = {
    default: {
      trigger: 'h-10 w-[240px]', // Increased from 200px to fit longer branch names
      bg: LUXE_COLORS.charcoalLight,
      border: `${LUXE_COLORS.bronze}30`,
      text: LUXE_COLORS.gold
    },
    minimal: {
      trigger: 'h-9 w-[220px]', // Increased from 180px to fit longer branch names
      bg: 'transparent',
      border: `${LUXE_COLORS.bronze}50`,
      text: LUXE_COLORS.bronze
    },
    sidebar: {
      trigger: 'h-9 w-full',
      bg: `${LUXE_COLORS.charcoalLight}80`,
      border: `${LUXE_COLORS.bronze}20`,
      text: LUXE_COLORS.gold
    }
  }

  const style = selectorStyles[variant]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: style.text }} />}
      <Select
        value={selectedBranchId || '__ALL__'}
        onValueChange={value => {
          // Convert special "__ALL__" marker to null for "All Locations"
          setSelectedBranchId(value === '__ALL__' ? null : value)
        }}
      >
        <SelectTrigger
          className={cn('font-medium transition-all', style.trigger)}
          style={{
            backgroundColor: style.bg,
            border: `1px solid ${style.border}`,
            color: style.text
          }}
        >
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent
          className="hera-select-content"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          {/* All Locations Option - Default */}
          <SelectItem
            value="__ALL__"
            className="hera-select-item font-semibold"
            style={{ color: LUXE_COLORS.gold }}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              <span>All Locations</span>
              <span className="text-xs ml-auto" style={{ color: `${LUXE_COLORS.bronze}80` }}>
                {availableBranches.length} {availableBranches.length === 1 ? 'branch' : 'branches'}
              </span>
            </div>
          </SelectItem>

          {/* Individual Branches */}
          {availableBranches.map(branch => (
            <SelectItem
              key={branch.id}
              value={branch.id}
              className="hera-select-item"
              style={{ color: LUXE_COLORS.cream }}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{branch.entity_name}</span>
                {branch.entity_code && (
                  <span className="text-xs ml-auto" style={{ color: `${LUXE_COLORS.bronze}80` }}>
                    {branch.entity_code}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Branch indicator for displaying current branch without selection
 */
export function BranchIndicator({
  className,
  showCode = false
}: {
  className?: string
  showCode?: boolean
}) {
  const { selectedBranch, isLoading } = useSecuredSalonContext()

  if (isLoading || !selectedBranch) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <MapPin className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
      <span style={{ color: LUXE_COLORS.gold }}>{selectedBranch.entity_name}</span>
      {showCode && selectedBranch.entity_code && (
        <span style={{ color: `${LUXE_COLORS.bronze}60` }}>({selectedBranch.entity_code})</span>
      )}
    </div>
  )
}

export default BranchSelector
