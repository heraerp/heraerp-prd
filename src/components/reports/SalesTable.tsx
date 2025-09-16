// ================================================================================
// SALES REPORTS TABLE
// Smart Code: HERA.UI.REPORTS.SALES_TABLE.v1
// Accessible tables for daily/monthly sales with drill-down capability
// ================================================================================

'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { SalesRow, ReportCalculations } from '@/src/lib/schemas/reports'
import { cn } from '@/src/lib/utils'

interface SalesTableProps {
  data: SalesRow[]
  reportType: 'daily' | 'monthly'
  currency?: string
  locale?: string
  isLoading?: boolean
  onDrillDown?: (row: SalesRow, type: 'service' | 'product' | 'total') => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
}

export function SalesTable({
  data,
  reportType,
  currency = 'AED',
  locale = 'en-AE',
  isLoading = false,
  onDrillDown,
  onSort,
  sortColumn,
  sortDirection,
  className
}: SalesTableProps) {
  
  const formatCurrency = (amount: number) => ReportCalculations.formatCurrency(amount, currency, locale)
  
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }
  
  const handleSort = (column: string) => {
    if (!onSort) return
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column, direction)
  }

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow className="bg-violet-50 dark:bg-violet-950/50">
        <TableHead 
          scope="col"
          className="font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort(reportType === 'daily' ? 'hour' : 'date')}
          >
            {reportType === 'daily' ? (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Hour
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3 mr-1" />
                Date
              </>
            )}
            {getSortIcon(reportType === 'daily' ? 'hour' : 'date')}
          </Button>
        </TableHead>
        
        <TableHead 
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('service_net')}
          >
            Service Revenue
            {getSortIcon('service_net')}
          </Button>
        </TableHead>
        
        <TableHead 
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('product_net')}
          >
            Product Revenue
            {getSortIcon('product_net')}
          </Button>
        </TableHead>
        
        <TableHead 
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('vat')}
          >
            VAT
            {getSortIcon('vat')}
          </Button>
        </TableHead>
        
        <TableHead 
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('gross')}
          >
            Gross Total
            {getSortIcon('gross')}
          </Button>
        </TableHead>
        
        <TableHead 
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('txn_count')}
          >
            Transactions
            {getSortIcon('txn_count')}
          </Button>
        </TableHead>
        
        <TableHead 
          scope="col"
          className="text-right font-semibold text-violet-900 dark:text-violet-100"
        >
          <Button
            variant="ghost"
            className="h-auto p-0 font-semibold hover:bg-transparent"
            onClick={() => handleSort('avg_ticket')}
          >
            Avg Ticket
            {getSortIcon('avg_ticket')}
          </Button>
        </TableHead>
        
        {onDrillDown && (
          <TableHead 
            scope="col"
            className="font-semibold text-violet-900 dark:text-violet-100"
          >
            Actions
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  )

  const formatTimeOrDate = (row: SalesRow) => {
    if (reportType === 'daily' && row.hour) {
      return row.hour
    }
    if (reportType === 'monthly' && row.date) {
      // Format date nicely
      const date = new Date(row.date + 'T00:00:00')
      return date.toLocaleDateString(locale, { 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    }
    return 'N/A'
  }

  const getRowVariant = (row: SalesRow, index: number) => {
    // Highlight high-performing rows
    const isHighPerforming = row.gross > (data.reduce((sum, r) => sum + r.gross, 0) / data.length) * 1.5
    const isLowPerforming = row.gross < (data.reduce((sum, r) => sum + r.gross, 0) / data.length) * 0.5
    
    const baseClasses = index % 2 === 0 
      ? 'bg-white dark:bg-gray-900' 
      : 'bg-gray-50/50 dark:bg-gray-800/50'
    
    if (isHighPerforming) {
      return `${baseClasses} border-l-2 border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20`
    }
    if (isLowPerforming && row.gross > 0) {
      return `${baseClasses} border-l-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20`
    }
    
    return `${baseClasses} hover:bg-violet-50/50 dark:hover:bg-violet-950/20`
  }

  const renderTableBody = () => (
    <TableBody>
      {data.map((row, index) => (
        <TableRow 
          key={`${row.date || row.hour || index}`}
          className={getRowVariant(row, index)}
        >
          {/* Time/Date Column */}
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              {reportType === 'daily' ? (
                <Clock className="h-3 w-3 text-gray-500" />
              ) : (
                <Calendar className="h-3 w-3 text-gray-500" />
              )}
              {formatTimeOrDate(row)}
              {row.branch_name && (
                <Badge variant="outline" className="text-xs">
                  {row.branch_code}
                </Badge>
              )}
            </div>
          </TableCell>
          
          {/* Service Revenue */}
          <TableCell className="text-right font-mono">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 font-mono hover:bg-transparent hover:text-violet-600"
              onClick={() => onDrillDown?.(row, 'service')}
              disabled={!onDrillDown || row.service_net === 0}
            >
              {formatCurrency(row.service_net)}
              {onDrillDown && row.service_net > 0 && (
                <Eye className="h-3 w-3 ml-1 opacity-50" />
              )}
            </Button>
          </TableCell>
          
          {/* Product Revenue */}
          <TableCell className="text-right font-mono">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 font-mono hover:bg-transparent hover:text-violet-600"
              onClick={() => onDrillDown?.(row, 'product')}
              disabled={!onDrillDown || row.product_net === 0}
            >
              {formatCurrency(row.product_net)}
              {onDrillDown && row.product_net > 0 && (
                <Eye className="h-3 w-3 ml-1 opacity-50" />
              )}
            </Button>
          </TableCell>
          
          {/* VAT */}
          <TableCell className="text-right font-mono text-gray-600 dark:text-gray-400">
            {formatCurrency(row.vat)}
          </TableCell>
          
          {/* Gross Total */}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(row.gross)}
              </span>
              {row.gross > 0 && (
                <div className="flex items-center text-xs text-gray-500">
                  {/* Show trend if this is monthly data */}
                  {reportType === 'monthly' && index > 0 && (
                    <>
                      {row.gross > data[index - 1].gross ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : row.gross < data[index - 1].gross ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          </TableCell>
          
          {/* Transaction Count */}
          <TableCell className="text-right">
            <Badge 
              variant="secondary" 
              className="font-mono bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {row.txn_count.toLocaleString(locale)}
            </Badge>
          </TableCell>
          
          {/* Average Ticket */}
          <TableCell className="text-right font-mono text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(row.avg_ticket)}
          </TableCell>
          
          {/* Actions */}
          {onDrillDown && (
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDrillDown(row, 'total')}
                disabled={row.gross === 0}
                className="text-xs h-7 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  )

  const calculateTotals = () => {
    return data.reduce((acc, row) => ({
      service_net: acc.service_net + row.service_net,
      product_net: acc.product_net + row.product_net,
      vat: acc.vat + row.vat,
      gross: acc.gross + row.gross,
      txn_count: acc.txn_count + row.txn_count
    }), { service_net: 0, product_net: 0, vat: 0, gross: 0, txn_count: 0 })
  }

  const totals = calculateTotals()
  const avgTicket = totals.txn_count > 0 ? totals.gross / totals.txn_count : 0

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {reportType === 'daily' ? 'Daily Sales Breakdown' : 'Monthly Sales Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading sales data...</span>
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
            <Calendar className="h-4 w-4" />
            {reportType === 'daily' ? 'Daily Sales Breakdown' : 'Monthly Sales Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sales data available for the selected period.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {reportType === 'daily' ? 'Daily Sales Breakdown' : 'Monthly Sales Summary'}
          </div>
          <Badge variant="outline" className="text-violet-700 border-violet-300">
            {data.length} {reportType === 'daily' ? 'hours' : 'days'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-violet-200 dark:border-violet-800">
          <Table>
            <caption className="sr-only">
              {reportType === 'daily' 
                ? 'Hourly breakdown of sales revenue, VAT, and transaction counts' 
                : 'Daily breakdown of sales revenue, VAT, and transaction counts'
              }
            </caption>
            {renderTableHeader()}
            {renderTableBody()}
            
            {/* Totals Footer */}
            <TableBody>
              <TableRow className="border-t-2 border-violet-300 dark:border-violet-700 bg-violet-100 dark:bg-violet-900/30 font-semibold">
                <TableCell className="font-bold text-violet-900 dark:text-violet-100">
                  TOTAL
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-violet-900 dark:text-violet-100">
                  {formatCurrency(totals.service_net)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-violet-900 dark:text-violet-100">
                  {formatCurrency(totals.product_net)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-violet-900 dark:text-violet-100">
                  {formatCurrency(totals.vat)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-violet-900 dark:text-violet-100">
                  {formatCurrency(totals.gross)}
                </TableCell>
                <TableCell className="text-right font-bold text-violet-900 dark:text-violet-100">
                  {totals.txn_count.toLocaleString(locale)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-violet-900 dark:text-violet-100">
                  {formatCurrency(avgTicket)}
                </TableCell>
                {onDrillDown && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Footer Note */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          All amounts in {currency}. VAT rate: 5%. 
          {reportType === 'daily' && ' Times shown in 24-hour format.'}
          {onDrillDown && ' Click on amounts to view transaction details.'}
        </div>
      </CardContent>
    </Card>
  )
}