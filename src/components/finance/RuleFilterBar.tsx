// ================================================================================
// RULE FILTER BAR COMPONENT
// Smart Code: HERA.UI.FINANCE.RULE_FILTER_BAR.v1
// Filter bar for Finance DNA posting rules
// ================================================================================

'use client'

import React from 'react'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Switch } from '@/src/components/ui/switch'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Search, Filter, RefreshCw } from 'lucide-react'

export type CategoryFilter = 'all' | 'pos' | 'payments' | 'inventory' | 'commissions' | 'fiscal' | 'other'

interface RuleFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: CategoryFilter
  onCategoryChange: (value: CategoryFilter) => void
  enabledOnly: boolean
  onEnabledOnlyChange: (value: boolean) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  totalRules?: number
  filteredCount?: number
}

export function RuleFilterBar({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  enabledOnly,
  onEnabledOnlyChange,
  onRefresh,
  isRefreshing = false,
  totalRules = 0,
  filteredCount = 0
}: RuleFilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by key or title..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search rules"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="hera-select-content">
            <SelectItem value="all" className="hera-select-item">All Categories</SelectItem>
            <SelectItem value="pos" className="hera-select-item">POS</SelectItem>
            <SelectItem value="payments" className="hera-select-item">Payments</SelectItem>
            <SelectItem value="inventory" className="hera-select-item">Inventory</SelectItem>
            <SelectItem value="commissions" className="hera-select-item">Commissions</SelectItem>
            <SelectItem value="fiscal" className="hera-select-item">Fiscal</SelectItem>
            <SelectItem value="other" className="hera-select-item">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Enabled Only Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="enabled-only"
            checked={enabledOnly}
            onCheckedChange={onEnabledOnlyChange}
            aria-label="Show enabled rules only"
          />
          <Label htmlFor="enabled-only" className="text-sm cursor-pointer">
            Enabled only
          </Label>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh rules"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isRefreshing && "animate-spin"
            )} />
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Showing</span>
        <Badge variant="outline" className="text-violet-700 border-violet-300">
          {filteredCount}
        </Badge>
        <span>of</span>
        <Badge variant="outline" className="text-gray-700 border-gray-300">
          {totalRules}
        </Badge>
        <span>rules</span>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}