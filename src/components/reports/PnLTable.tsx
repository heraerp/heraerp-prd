// ================================================================================
// PROFIT & LOSS TABLE
// Smart Code: HERA.UI.REPORTS.PNL_TABLE.v1
// Hierarchical P&L statement with drill-down and accessibility features
// ================================================================================

'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Eye,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Minus
} from 'lucide-react'
import { PnLRow, ReportCalculations } from '@/lib/schemas/reports'
import { cn } from '@/lib/utils'

interface PnLTableProps {
  data: PnLRow[]
  currency?: string
  locale?: string
  isLoading?: boolean
  showComparison?: boolean
  onDrillDown?: (row: PnLRow) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
}

export function PnLTable({
  data,
  currency = 'AED',
  locale = 'en-AE',
  isLoading = false,
  showComparison = false,
  onDrillDown,
  onSort,
  sortColumn,
  sortDirection,
  className
}: PnLTableProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(['revenue', 'expenses'])
  )

  const formatCurrency = (amount: number) =>
    ReportCalculations.formatCurrency(amount, currency, locale)

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    )
  }

  const handleSort = (column: string) => {
    if (!onSort) return
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column, direction)
  }

  const toggleGroupExpansion = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const getGroupDisplayName = (group: string) => {
    const groupNames: Record<string, string> = {
      revenue: 'Revenue',
      cogs: 'Cost of Goods Sold',
      gross_profit: 'Gross Profit',
      expenses: 'Operating Expenses',
      operating_profit: 'Operating Profit',
      other: 'Other Income/Expenses',
      net_income: 'Net Income'
    }
    return groupNames[group] || group
  }

  const getGroupIcon = (group: string) => {
    const groupIcons: Record<string, React.ReactNode> = {
      revenue: <TrendingUp className="h-4 w-4 text-emerald-600" />,
      cogs: <TrendingDown className="h-4 w-4 text-red-600" />,
      gross_profit: <TrendingUp className="h-4 w-4 text-blue-600" />,
      expenses: <TrendingDown className="h-4 w-4 text-red-600" />,
      operating_profit: <TrendingUp className="h-4 w-4 text-blue-600" />,
      other: <Minus className="h-4 w-4 text-gray-600" />,
      net_income: <TrendingUp className="h-4 w-4 text-emerald-600" />
    }
    return groupIcons[group] || <FileText className="h-4 w-4 text-gray-600" />
  }

  const getAmountColor = (amount: number, group: string) => {
    // Revenue and profits are typically negative in accounting but positive for display
    const isPositive = group === 'revenue' ? amount < 0 : amount > 0

    if (group === 'revenue' || group.includes('profit') || group.includes('income')) {
      return isPositive
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-red-700 dark:text-red-400'
    }
    if (group === 'cogs' || group === 'expenses') {
      return amount > 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-400'
    }
    return 'text-gray-900 dark:text-gray-100'
  }

  const getRowStyles = (row: PnLRow, index: number) => {
    const baseClasses =
      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/30'

    if (row.is_subtotal) {
      const subtotalClasses = {
        revenue: 'bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-emerald-400',
        cogs: 'bg-red-50 dark:bg-red-950/30 border-l-2 border-red-400',
        gross_profit: 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-400 font-semibold',
        expenses: 'bg-red-50 dark:bg-red-950/30 border-l-2 border-red-400',
        operating_profit: 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-400 font-semibold',
        other: 'bg-gray-50 dark:bg-gray-950/30 border-l-2 border-gray-400',
        net_income:
          'bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-emerald-400 font-bold text-lg'
      }
      return subtotalClasses[row.group] || 'bg-gray-100 dark:bg-gray-800 font-semibold'
    }

    return `${baseClasses} hover:bg-violet-50/50 dark:hover:bg-violet-950/20`
  }

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow className="bg-violet-50 dark:bg-violet-950/50">
        <TableHead scope="col" className="font-semibold text-violet-900 dark:text-violet-100">
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('account_name')}
          >
            <FileText className="h-3 w-3 mr-1" />
            Account
            {getSortIcon('account_name')}
          </Button>
        </TableHead>

        <TableHead
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('amount')}
          >
            Amount ({currency}){getSortIcon('amount')}
          </Button>
        </TableHead>

        <TableHead
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          % of Revenue
        </TableHead>

        {showComparison && (
          <>
            <TableHead
              scope="col"
              className="text-right font-semibold text-violet-900 dark:text-violet-100"
            >
              Prior Period
            </TableHead>
            <TableHead
              scope="col"
              className="text-right font-semibold text-violet-900 dark:text-violet-100"
            >
              Variance
            </TableHead>
          </>
        )}

        {onDrillDown && (
          <TableHead scope="col" className="font-semibold text-violet-900 dark:text-violet-100">
            Actions
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  )

  const renderAccountRow = (row: PnLRow, index: number) => {
    const indentLevel = row.level || 0
    const paddingLeft = `${indentLevel * 1.5}rem`
    const isExpanded = expandedGroups.has(row.group)

    return (
      <TableRow key={`${row.account_code}-${index}`} className={getRowStyles(row, index)}>
        {/* Account Name */}
        <TableCell
          className={cn(
            'font-medium',
            row.is_subtotal && 'font-bold',
            indentLevel > 0 && 'text-sm'
          )}
          style={{ paddingLeft }}
        >
          <div className="flex items-center gap-2">
            {/* Group expansion toggle for subtotals */}
            {row.is_subtotal && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleGroupExpansion(row.group)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            {/* Group icon for subtotals */}
            {row.is_subtotal && getGroupIcon(row.group)}

            {/* Account info */}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    row.is_subtotal && 'text-base font-bold',
                    !row.is_subtotal && 'text-sm'
                  )}
                >
                  {row.is_subtotal ? getGroupDisplayName(row.group) : row.account_name}
                </span>
                {!row.is_subtotal && (
                  <Badge variant="outline" className="text-xs">
                    {row.account_code}
                  </Badge>
                )}
              </div>
              {row.sub_group && !row.is_subtotal && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{row.sub_group}</div>
              )}
            </div>
          </div>
        </TableCell>

        {/* Amount */}
        <TableCell
          className={cn(
            'text-right font-mono',
            getAmountColor(row.amount, row.group),
            row.is_subtotal && 'font-bold text-base'
          )}
        >
          {formatCurrency(Math.abs(row.amount))}
        </TableCell>

        {/* Percentage */}
        <TableCell className="text-right text-sm text-gray-600 dark:text-gray-400">
          {row.percentage ? `${row.percentage.toFixed(1)}%` : '—'}
        </TableCell>

        {/* Comparison columns */}
        {showComparison && (
          <>
            <TableCell className="text-right font-mono text-sm text-gray-600 dark:text-gray-400">
              {row.prior_period_amount ? formatCurrency(Math.abs(row.prior_period_amount)) : '—'}
            </TableCell>
            <TableCell className="text-right">
              {row.variance_amount && (
                <div className="flex items-center justify-end gap-1">
                  <span
                    className={cn(
                      'font-mono text-sm',
                      row.variance_amount > 0 ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {row.variance_amount > 0 ? '+' : ''}
                    {formatCurrency(row.variance_amount)}
                  </span>
                  {row.variance_percent && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs ml-1',
                        row.variance_percent > 0
                          ? 'text-emerald-700 border-emerald-300'
                          : 'text-red-700 border-red-300'
                      )}
                    >
                      {row.variance_percent > 0 ? '+' : ''}
                      {row.variance_percent.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              )}
            </TableCell>
          </>
        )}

        {/* Actions */}
        {onDrillDown && (
          <TableCell>
            {!row.is_subtotal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDrillDown(row)}
                className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            )}
          </TableCell>
        )}
      </TableRow>
    )
  }

  const getVisibleRows = () => {
    return data.filter(row => {
      if (row.is_subtotal) return true
      return expandedGroups.has(row.group)
    })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Profit & Loss Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading P&L data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Profit & Loss Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No financial data available for the selected period.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const visibleRows = getVisibleRows()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Profit & Loss Statement
          </div>
          <div className="flex items-center gap-2">
            {showComparison && (
              <Badge variant="outline" className="text-violet-700 border-violet-300">
                With Comparison
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (expandedGroups.size === 0) {
                  setExpandedGroups(new Set(['revenue', 'cogs', 'expenses', 'other']))
                } else {
                  setExpandedGroups(new Set())
                }
              }}
              className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100"
            >
              {expandedGroups.size === 0 ? 'Expand All' : 'Collapse All'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-violet-200 dark:border-violet-800">
          <Table>
            <caption className="sr-only">
              Profit and loss statement showing revenue, expenses, and net income with hierarchical
              grouping
            </caption>
            {renderTableHeader()}
            <TableBody>{visibleRows.map((row, index) => renderAccountRow(row, index))}</TableBody>
          </Table>
        </div>

        {/* Footer Notes */}
        <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-4">
            <span>• All amounts in {currency}</span>
            <span>• Revenue amounts shown as positive for clarity</span>
            {showComparison && <span>• Variance: Current - Prior Period</span>}
            <span>• Click group headers to expand/collapse details</span>
          </div>
          {onDrillDown && (
            <div>• Click "Details" to view underlying transactions for each account</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
