// ================================================================================
// REPORTS FILTERS BAR
// Smart Code: HERA.UI.REPORTS.FILTERS.v1
// Universal filters for all report types with salon theme
// ================================================================================

'use client'

import React from 'react'
import { Calendar, Building2, DollarSign, Sliders3, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SalesFilters, FinancialFilters } from '@/lib/schemas/reports'

interface FiltersBarProps {
  filters: SalesFilters | FinancialFilters
  onChange: (filters: Partial<SalesFilters | FinancialFilters>) => void
  reportType: 'sales' | 'financial'
  branches?: Array<{ id: string; name: string; code: string }>
  isLoading?: boolean
  className?: string
}

export function FiltersBar({
  filters,
  onChange,
  reportType,
  branches = [],
  isLoading = false,
  className = ''
}: FiltersBarProps) {
  // Helper to get today's date in YYYY-MM-DD format
  const getTodayISO = () => new Date().toISOString().split('T')[0]

  // Helper to get current month in YYYY-MM format
  const getCurrentMonthISO = () => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  }

  // Count active filters for badge
  const getActiveFilterCount = () => {
    let count = 0
    if ('branch_id' in filters && filters.branch_id) count++
    if ('date' in filters && filters.date) count++
    if ('month' in filters && filters.month) count++
    if ('from_date' in filters && filters.from_date) count++
    if ('to_date' in filters && filters.to_date) count++
    if ('include_tips' in filters && !filters.include_tips) count++
    if ('service_only' in filters && filters.service_only) count++
    if ('product_only' in filters && filters.product_only) count++
    if ('consolidated' in filters && !filters.consolidated) count++
    return count
  }

  const clearFilters = () => {
    if (reportType === 'sales') {
      onChange({
        branch_id: undefined,
        date: undefined,
        month: undefined,
        include_tips: true,
        service_only: false,
        product_only: false
      })
    } else {
      onChange({
        branch_id: undefined,
        from_date: undefined,
        to_date: undefined,
        as_of_date: undefined,
        consolidated: true
      })
    }
  }

  return (
    <Card
      className={`bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 border-violet-200 dark:border-violet-800 ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Header with clear filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-violet-600" />
              <span className="font-medium text-violet-900 dark:text-violet-100">
                Report Filters
              </span>
              {getActiveFilterCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                >
                  {getActiveFilterCount()} active
                </Badge>
              )}
            </div>
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/50"
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Branch Selection */}
            {branches.length > 0 && (
              <div className="space-y-2">
                <Label
                  htmlFor="branch-select"
                  className="text-sm font-medium ink dark:text-gray-300"
                >
                  <Building2 className="inline h-3 w-3 mr-1" />
                  Branch
                </Label>
                <Select
                  value={filters.branch_id || 'all'}
                  onValueChange={value =>
                    onChange({ branch_id: value === 'all' ? undefined : value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="branch-select" className="bg-white dark:bg-gray-800">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Controls - Sales Reports */}
            {reportType === 'sales' && (
              <>
                {'date' in filters && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="date-select"
                      className="text-sm font-medium ink dark:text-gray-300"
                    >
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Date
                    </Label>
                    <Input
                      id="date-select"
                      type="date"
                      value={filters.date || getTodayISO()}
                      onChange={e => onChange({ date: e.target.value })}
                      disabled={isLoading}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                )}

                {'month' in filters && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="month-select"
                      className="text-sm font-medium ink dark:text-gray-300"
                    >
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Month
                    </Label>
                    <Input
                      id="month-select"
                      type="month"
                      value={filters.month || getCurrentMonthISO()}
                      onChange={e => onChange({ month: e.target.value })}
                      disabled={isLoading}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                )}
              </>
            )}

            {/* Date Controls - Financial Reports */}
            {reportType === 'financial' && (
              <>
                {'from_date' in filters && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="from-date"
                      className="text-sm font-medium ink dark:text-gray-300"
                    >
                      <Calendar className="inline h-3 w-3 mr-1" />
                      From Date
                    </Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={filters.from_date || ''}
                      onChange={e => onChange({ from_date: e.target.value })}
                      disabled={isLoading}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                )}

                {'to_date' in filters && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="to-date"
                      className="text-sm font-medium ink dark:text-gray-300"
                    >
                      <Calendar className="inline h-3 w-3 mr-1" />
                      To Date
                    </Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={filters.to_date || getTodayISO()}
                      onChange={e => onChange({ to_date: e.target.value })}
                      disabled={isLoading}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                )}

                {'as_of_date' in filters && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="as-of-date"
                      className="text-sm font-medium ink dark:text-gray-300"
                    >
                      <Calendar className="inline h-3 w-3 mr-1" />
                      As of Date
                    </Label>
                    <Input
                      id="as-of-date"
                      type="date"
                      value={filters.as_of_date || getTodayISO()}
                      onChange={e => onChange({ as_of_date: e.target.value })}
                      disabled={isLoading}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap gap-6 pt-2 border-t border-violet-200 dark:border-violet-800">
            {/* Sales-specific toggles */}
            {reportType === 'sales' && 'include_tips' in filters && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-tips"
                    checked={filters.include_tips}
                    onCheckedChange={checked => onChange({ include_tips: !!checked })}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="include-tips"
                    className="text-sm ink dark:text-gray-300 cursor-pointer"
                  >
                    <DollarSign className="inline h-3 w-3 mr-1" />
                    Include Tips
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="service-only"
                    checked={'service_only' in filters ? filters.service_only : false}
                    onCheckedChange={checked =>
                      onChange({
                        service_only: !!checked,
                        product_only: false // Mutually exclusive
                      })
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="service-only"
                    className="text-sm ink dark:text-gray-300 cursor-pointer"
                  >
                    Services Only
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="product-only"
                    checked={'product_only' in filters ? filters.product_only : false}
                    onCheckedChange={checked =>
                      onChange({
                        product_only: !!checked,
                        service_only: false // Mutually exclusive
                      })
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="product-only"
                    className="text-sm ink dark:text-gray-300 cursor-pointer"
                  >
                    Products Only
                  </Label>
                </div>
              </>
            )}

            {/* Financial-specific toggles */}
            {reportType === 'financial' && 'consolidated' in filters && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consolidated"
                  checked={filters.consolidated}
                  onCheckedChange={checked => onChange({ consolidated: !!checked })}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="consolidated"
                  className="text-sm ink dark:text-gray-300 cursor-pointer"
                >
                  <Sliders3 className="inline h-3 w-3 mr-1" />
                  Consolidated View
                </Label>
              </div>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-violet-200 dark:border-violet-800">
            <span className="text-xs font-medium ink-muted mr-2 self-center">
              Quick filters:
            </span>

            {reportType === 'sales' && 'date' in filters && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ date: getTodayISO() })}
                  disabled={isLoading}
                  className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    onChange({ date: yesterday.toISOString().split('T')[0] })
                  }}
                  disabled={isLoading}
                  className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  Yesterday
                </Button>
              </>
            )}

            {reportType === 'sales' && 'month' in filters && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ month: getCurrentMonthISO() })}
                  disabled={isLoading}
                  className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastMonth = new Date()
                    lastMonth.setMonth(lastMonth.getMonth() - 1)
                    const yearMonth = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`
                    onChange({ month: yearMonth })
                  }}
                  disabled={isLoading}
                  className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  Last Month
                </Button>
              </>
            )}

            {reportType === 'financial' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                    onChange({
                      from_date: firstDay.toISOString().split('T')[0],
                      to_date: getTodayISO()
                    })
                  }}
                  disabled={isLoading}
                  className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  Month to Date
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const firstDay = new Date(now.getFullYear(), 0, 1)
                    onChange({
                      from_date: firstDay.toISOString().split('T')[0],
                      to_date: getTodayISO()
                    })
                  }}
                  disabled={isLoading}
                  className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
                >
                  Year to Date
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper hook for managing filter state
export function useReportFilters<T extends SalesFilters | FinancialFilters>(
  initialFilters: T,
  onFiltersChange?: (filters: T) => void
) {
  const [filters, setFilters] = React.useState<T>(initialFilters)

  const updateFilters = React.useCallback(
    (updates: Partial<T>) => {
      const newFilters = { ...filters, ...updates } as T
      setFilters(newFilters)
      onFiltersChange?.(newFilters)
    },
    [filters, onFiltersChange]
  )

  const resetFilters = React.useCallback(() => {
    setFilters(initialFilters)
    onFiltersChange?.(initialFilters)
  }, [initialFilters, onFiltersChange])

  return {
    filters,
    updateFilters,
    resetFilters
  }
}
