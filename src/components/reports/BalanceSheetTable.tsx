// ================================================================================
// BALANCE SHEET TABLE
// Smart Code: HERA.UI.REPORTS.BALANCE_SHEET_TABLE.V1
// Hierarchical balance sheet with balance equation validation
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
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  CheckCircle,
  AlertCircle,
  Building,
  CreditCard,
  Users
} from 'lucide-react'
import { BalanceRow, ReportCalculations } from '@/lib/schemas/reports'
import { cn } from '@/lib/utils'

interface BalanceSheetTableProps {
  data: BalanceRow[]
  balanceCheck: {
    is_balanced: boolean
    difference: number
    tolerance: number
  }
  currency?: string
  locale?: string
  isLoading?: boolean
  showComparison?: boolean
  onDrillDown?: (row: BalanceRow) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
}

export function BalanceSheetTable({
  data,
  balanceCheck,
  currency = 'AED',
  locale = 'en-AE',
  isLoading = false,
  showComparison = false,
  onDrillDown,
  onSort,
  sortColumn,
  sortDirection,
  className
}: BalanceSheetTableProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(['assets', 'liabilities', 'equity'])
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
      assets: 'ASSETS',
      liabilities: 'LIABILITIES',
      equity: 'EQUITY'
    }
    return groupNames[group] || group.toUpperCase()
  }

  const getGroupIcon = (group: string) => {
    const groupIcons: Record<string, React.ReactNode> = {
      assets: <Building className="h-4 w-4 text-blue-600" />,
      liabilities: <CreditCard className="h-4 w-4 text-red-600" />,
      equity: <Users className="h-4 w-4 text-emerald-600" />
    }
    return groupIcons[group] || <FileText className="h-4 w-4 ink-muted" />
  }

  const getAmountColor = (amount: number, group: string) => {
    // All amounts are typically positive in balance sheet
    if (amount < 0) {
      return 'text-red-700 dark:text-red-400'
    }

    switch (group) {
      case 'assets':
        return 'text-blue-700 dark:text-blue-400'
      case 'liabilities':
        return 'text-red-700 dark:text-red-400'
      case 'equity':
        return 'text-emerald-700 dark:text-emerald-400'
      default:
        return 'text-gray-900 dark:text-gray-100'
    }
  }

  const getRowStyles = (row: BalanceRow, index: number) => {
    const baseClasses =
      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/30'

    if (row.is_subtotal) {
      const subtotalClasses = {
        assets: 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 font-bold',
        liabilities: 'bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 font-bold',
        equity: 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-400 font-bold'
      }
      return subtotalClasses[row.group] || 'bg-gray-100 dark:bg-gray-800 font-semibold'
    }

    return `${baseClasses} hover:bg-violet-50/50 dark:hover:bg-violet-950/20`
  }

  const calculateTotals = () => {
    const totals = data.reduce(
      (acc, row) => {
        if (!row.is_subtotal) {
          switch (row.group) {
            case 'assets':
              acc.assets += row.amount
              break
            case 'liabilities':
              acc.liabilities += row.amount
              break
            case 'equity':
              acc.equity += row.amount
              break
          }
        }
        return acc
      },
      { assets: 0, liabilities: 0, equity: 0 }
    )

    return totals
  }

  const renderBalanceCheckAlert = () => {
    const totals = calculateTotals()

    return (
      <Alert
        className={cn(
          'mb-6',
          balanceCheck.is_balanced
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
        )}
      >
        <div className="flex items-center gap-2">
          {balanceCheck.is_balanced ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={cn(
              balanceCheck.is_balanced
                ? 'text-emerald-800 dark:text-emerald-200'
                : 'text-red-800 dark:text-red-200'
            )}
          >
            <div className="font-semibold mb-2">
              Balance Sheet Equation:{' '}
              {balanceCheck.is_balanced ? '✅ Balanced' : '⚠️ Out of Balance'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Assets:</span> {formatCurrency(totals.assets)}
              </div>
              <div>
                <span className="font-medium">Liabilities:</span>{' '}
                {formatCurrency(totals.liabilities)}
              </div>
              <div>
                <span className="font-medium">Equity:</span> {formatCurrency(totals.equity)}
              </div>
            </div>
            {!balanceCheck.is_balanced && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Difference:</span>{' '}
                {formatCurrency(Math.abs(balanceCheck.difference))}
                <span className="ml-2 text-xs">
                  (Tolerance: {formatCurrency(balanceCheck.tolerance)})
                </span>
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
    )
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
          % of Assets
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
              Change
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

  const renderAccountRow = (row: BalanceRow, index: number) => {
    const indentLevel = row.level || 0
    const paddingLeft = `${indentLevel * 1.5}rem`
    const isExpanded = expandedGroups.has(row.group)

    return (
      <TableRow key={`${row.account_code}-${index}`} className={getRowStyles(row, index)}>
        {/* Account Name */}
        <TableCell
          className={cn(
            'font-medium',
            row.is_subtotal && 'font-bold text-base',
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
                    row.is_subtotal && 'text-base font-bold uppercase tracking-wide',
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
                <div className="text-xs dark:ink-muted mt-1">{row.sub_group}</div>
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
          {formatCurrency(row.amount)}
        </TableCell>

        {/* Percentage of Assets */}
        <TableCell className="text-right text-sm dark:ink-muted">
          {row.percentage ? `${row.percentage.toFixed(1)}%` : '—'}
        </TableCell>

        {/* Comparison columns */}
        {showComparison && (
          <>
            <TableCell className="text-right font-mono text-sm dark:ink-muted">
              {row.prior_period_amount ? formatCurrency(row.prior_period_amount) : '—'}
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
                  {Math.abs(row.variance_amount) > 0 && (
                    <>
                      {row.variance_amount > 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                    </>
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
            Balance Sheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            <span className="ml-2 dark:ink-muted">Loading balance sheet data...</span>
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
            Balance Sheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 dark:ink-muted">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No balance sheet data available for the selected date.</p>
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
            Balance Sheet
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
                  setExpandedGroups(new Set(['assets', 'liabilities', 'equity']))
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
        {/* Balance Check Alert */}
        {renderBalanceCheckAlert()}

        <div className="rounded-md border border-violet-200 dark:border-violet-800">
          <Table>
            <caption className="sr-only">
              Balance sheet showing assets, liabilities, and equity with balance equation validation
            </caption>
            {renderTableHeader()}
            <TableBody>{visibleRows.map((row, index) => renderAccountRow(row, index))}</TableBody>
          </Table>
        </div>

        {/* Footer Notes */}
        <div className="mt-4 space-y-2 text-xs dark:ink-muted">
          <div className="flex flex-wrap gap-4">
            <span>• All amounts in {currency}</span>
            <span>• Percentages calculated as % of Total Assets</span>
            {showComparison && <span>• Change: Current - Prior Period</span>}
            <span>• Click group headers to expand/collapse details</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <span>• Balance equation: Assets = Liabilities + Equity</span>
            {onDrillDown && <span>• Click "Details" to view underlying transactions</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
