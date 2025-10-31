/**
 * HERA DNA SALES REPORTS: Branch Selector Component
 * Smart Code: HERA.SALON.REPORTS.COMPONENT.BRANCH_SELECTOR.v1
 *
 * ✅ ENTERPRISE: Luxury-themed branch filtering for sales reports
 * Provides multi-branch organization support with Salon Luxe styling
 *
 * Features:
 * - Salon Luxe theme integration (gold, charcoal, champagne)
 * - All branches option for organization-wide reporting
 * - Real-time branch data from useHeraBranches hook
 * - Mobile-responsive dropdown design
 * - Active state feedback with luxury animations
 */

'use client'

import React from 'react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useHeraBranches } from '@/hooks/useHeraBranches'

export interface BranchSelectorProps {
  organizationId: string
  selectedBranchId: string | null // null = "All Branches"
  onBranchChange: (branchId: string | null) => void
  className?: string
}

export function BranchSelector({
  organizationId,
  selectedBranchId,
  onBranchChange,
  className = ''
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Fetch branches for the organization
  const { branches, isLoading } = useHeraBranches({
    organizationId,
    includeArchived: false
  })

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Find selected branch name
  const selectedBranch = selectedBranchId
    ? branches?.find(b => b.id === selectedBranchId)
    : null
  const selectedName = selectedBranch?.entity_name || 'All Branches'

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Luxury selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full min-h-[48px] px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-between gap-2"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoal}`,
          color: LUXE_COLORS.champagne,
          border: `1px solid ${LUXE_COLORS.gold}40`,
          opacity: isLoading ? 0.6 : 1
        }}
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
          <span className="truncate">{isLoading ? 'Loading...' : selectedName}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: LUXE_COLORS.bronze }}
        />
      </button>

      {/* Luxury dropdown menu */}
      {isOpen && !isLoading && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-2xl overflow-hidden z-50 border backdrop-blur-md"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}f8`,
            borderColor: `${LUXE_COLORS.gold}40`,
            maxHeight: '320px',
            overflowY: 'auto'
          }}
        >
          {/* All Branches option */}
          <button
            onClick={() => {
              onBranchChange(null)
              setIsOpen(false)
            }}
            className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-opacity-20 transition-all duration-150 active:scale-98"
            style={{
              backgroundColor:
                selectedBranchId === null ? `${LUXE_COLORS.gold}20` : 'transparent',
              color:
                selectedBranchId === null ? LUXE_COLORS.gold : LUXE_COLORS.champagne
            }}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">All Branches</span>
            </div>
            {selectedBranchId === null && (
              <Check className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            )}
          </button>

          {/* Divider */}
          <div
            className="h-px mx-4"
            style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}
          />

          {/* Individual branch options */}
          {branches && branches.length > 0 ? (
            branches.map(branch => {
              const isSelected = selectedBranchId === branch.id
              return (
                <button
                  key={branch.id}
                  onClick={() => {
                    onBranchChange(branch.id)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-opacity-20 transition-all duration-150 active:scale-98"
                  style={{
                    backgroundColor: isSelected
                      ? `${LUXE_COLORS.gold}20`
                      : 'transparent',
                    color: isSelected ? LUXE_COLORS.gold : LUXE_COLORS.champagne
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{branch.entity_name}</span>
                    {branch.city && (
                      <span
                        className="text-xs"
                        style={{ color: LUXE_COLORS.bronze }}
                      >
                        {branch.city}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                  )}
                </button>
              )
            })
          ) : (
            <div
              className="px-4 py-6 text-center text-sm"
              style={{ color: LUXE_COLORS.bronze }}
            >
              No branches found
            </div>
          )}
        </div>
      )}

      {/* Subtle shimmer effect on open */}
      {isOpen && (
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(400%);
            }
          }
        `}</style>
      )}
    </div>
  )
}

export default BranchSelector
