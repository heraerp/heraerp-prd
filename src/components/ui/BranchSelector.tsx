/**
 * Branch Selector Component
 * Smart Code: HERA.UI.BRANCH.SELECTOR.V1
 *
 * Reusable branch selection dropdown for POS and reports
 */

import React from 'react'
import { Branch } from '@/hooks/useBranchFilter'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BranchSelectorProps {
  value?: string
  branches: Branch[]
  onChange: (branchId: string | undefined) => void
  loading?: boolean
  error?: string | null
  placeholder?: string
  className?: string
  disabled?: boolean
  showAllOption?: boolean
  allOptionLabel?: string
}

export function BranchSelector({
  value,
  branches,
  onChange,
  loading,
  error,
  placeholder = 'Select branch',
  className,
  disabled,
  showAllOption = false,
  allOptionLabel = 'All Branches'
}: BranchSelectorProps) {
  if (error) {
    return <div className={cn('text-sm text-red-500', className)}>Error loading branches</div>
  }

  return (
    <Select
      value={value || 'all'}
      onValueChange={val => onChange(val === 'all' ? undefined : val)}
      disabled={disabled || loading}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 ink-muted" />
          <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="hera-select-content">
        {showAllOption && (
          <SelectItem value="all" className="hera-select-item">
            {allOptionLabel}
          </SelectItem>
        )}
        {branches.map(branch => (
          <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
            <div className="flex flex-col">
              <span className="font-medium">{branch.name}</span>
              {branch.code && <span className="text-xs ink-muted">{branch.code}</span>}
            </div>
          </SelectItem>
        ))}
        {branches.length === 0 && !loading && (
          <div className="px-2 py-4 text-center text-sm ink-muted">No branches available</div>
        )}
      </SelectContent>
    </Select>
  )
}

/**
 * Compact branch pill for displaying selected branch
 */
export function BranchPill({ branch }: { branch?: Branch }) {
  if (!branch) return null

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
      <Building2 className="h-3 w-3" />
      <span>{branch.name}</span>
    </div>
  )
}

/**
 * Multi-branch selector for comparison reports
 */
export function MultiBranchSelector({
  branches,
  selectedBranches,
  onToggle,
  onSelectAll,
  onDeselectAll,
  loading,
  className
}: {
  branches: Branch[]
  selectedBranches: string[]
  onToggle: (branchId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  loading?: boolean
  className?: string
}) {
  const selectedSet = new Set(selectedBranches)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Select Branches</h4>
        <div className="space-x-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs ink-muted hover:text-gray-800"
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
        {branches.map(branch => (
          <label
            key={branch.id}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(branch.id)}
              onChange={() => onToggle(branch.id)}
              disabled={loading}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{branch.name}</div>
              {branch.code && <div className="text-xs ink-muted">{branch.code}</div>}
            </div>
          </label>
        ))}
      </div>

      <div className="text-xs ink-muted">
        {selectedBranches.length} of {branches.length} selected
      </div>
    </div>
  )
}
