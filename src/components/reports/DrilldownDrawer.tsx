// ================================================================================
// REPORTS DRILL-DOWN DRAWER
// Smart Code: HERA.UI.REPORTS.DRILLDOWN.V1
// Transaction details drawer with smart code visibility and pagination
// ================================================================================

'use client'

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  X,
  FileText,
  Calendar,
  DollarSign,
  User,
  Code,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Building
} from 'lucide-react'
import {
  TransactionSummary,
  TransactionDetail,
  DrillDownResponse,
  ReportCalculations
} from '@/lib/schemas/reports'
import { cn } from '@/lib/utils'

interface DrilldownDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  data: DrillDownResponse | null
  selectedTransaction: TransactionDetail | null
  currency?: string
  locale?: string
  isLoading?: boolean
  isLoadingDetail?: boolean
  onTransactionClick?: (transactionId: string) => void
  onLoadMore?: () => void
  onPageChange?: (page: number) => void
  hasMore?: boolean
  currentPage?: number
  totalPages?: number
  className?: string
}

export function DrilldownDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  selectedTransaction,
  currency = 'AED',
  locale = 'en-AE',
  isLoading = false,
  isLoadingDetail = false,
  onTransactionClick,
  onLoadMore,
  onPageChange,
  hasMore = false,
  currentPage = 1,
  totalPages = 1,
  className
}: DrilldownDrawerProps) {
  const formatCurrency = (amount: number) =>
    ReportCalculations.formatCurrency(amount, currency, locale)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getTransactionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      pos_sale: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      appointment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      payment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      journal_entry: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      inventory_adjustment:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }

  const renderTransactionsList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
          <span className="ml-2 text-sm dark:ink-muted">
            Loading transactions...
          </span>
        </div>
      )
    }

    if (!data || data.transactions.length === 0) {
      return (
        <div className="text-center py-8 dark:ink-muted">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No transactions found for the selected criteria.</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {data.transactions.map(transaction => (
          <Card
            key={transaction.transaction_id}
            className="hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors cursor-pointer"
            onClick={() => onTransactionClick?.(transaction.transaction_id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {/* Transaction Code and Type */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getTransactionTypeColor(transaction.transaction_type)}
                    >
                      {transaction.transaction_code}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Description */}
                  <div className="text-sm font-medium ink dark:text-gray-100">
                    {transaction.description}
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 text-xs dark:ink-muted">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.transaction_date)}
                    </div>
                    {transaction.customer_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {transaction.customer_name}
                      </div>
                    )}
                    {transaction.staff_name && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {transaction.staff_name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                        {transaction.smart_code}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Amount and Action */}
                <div className="text-right space-y-1">
                  <div className="text-lg font-semibold ink dark:text-gray-100">
                    {formatCurrency(transaction.total_amount)}
                  </div>
                  <div className="text-xs dark:ink-muted">
                    {transaction.line_count} line{transaction.line_count !== 1 ? 's' : ''}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-violet-600 hover:text-violet-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderTransactionDetail = () => {
    if (isLoadingDetail) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
          <span className="ml-2 text-sm dark:ink-muted">
            Loading transaction details...
          </span>
        </div>
      )
    }

    if (!selectedTransaction) {
      return null
    }

    const { transaction, lines, related_entities, auto_journal_entries } = selectedTransaction

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => onTransactionClick?.('')}
          className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 p-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Button>

        {/* Transaction Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transaction Details
              </div>
              <Badge
                variant="outline"
                className={getTransactionTypeColor(transaction.transaction_type)}
              >
                {transaction.transaction_code}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium ink-muted uppercase tracking-wide">
                  Date
                </label>
                <p className="text-sm font-medium">{formatDate(transaction.transaction_date)}</p>
              </div>
              <div>
                <label className="text-xs font-medium ink-muted uppercase tracking-wide">
                  Total Amount
                </label>
                <p className="text-sm font-bold text-lg">
                  {formatCurrency(transaction.total_amount)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium ink-muted uppercase tracking-wide">
                  Transaction Type
                </label>
                <p className="text-sm font-medium">
                  {transaction.transaction_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium ink-muted uppercase tracking-wide">
                  Smart Code
                </label>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {transaction.smart_code}
                </code>
              </div>
            </div>

            {/* Reference Number */}
            {transaction.reference_number && (
              <div>
                <label className="text-xs font-medium ink-muted uppercase tracking-wide">
                  Reference
                </label>
                <p className="text-sm font-medium">{transaction.reference_number}</p>
              </div>
            )}

            {/* Related Entities */}
            {related_entities && related_entities.length > 0 && (
              <div>
                <label className="text-xs font-medium ink-muted uppercase tracking-wide mb-2 block">
                  Related Entities
                </label>
                <div className="flex flex-wrap gap-2">
                  {related_entities.map((entity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {entity.role}: {entity.entity_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Transaction Lines ({lines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Smart Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(line => (
                    <TableRow key={line.line_number}>
                      <TableCell className="font-mono text-xs">{line.line_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{line.description}</div>
                          <div className="text-xs ink-muted">
                            {line.entity_name} ({line.line_type})
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {line.quantity || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {line.unit_amount ? formatCurrency(line.unit_amount) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(line.line_amount)}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                          {line.smart_code}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Auto Journal Entries (if available) */}
        {auto_journal_entries && auto_journal_entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Auto-Journal Entries ({auto_journal_entries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50 dark:bg-emerald-900/30">
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Smart Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auto_journal_entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{entry.account_name}</div>
                            <div className="text-xs ink-muted">{entry.account_code}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.debit_amount ? formatCurrency(entry.debit_amount) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.credit_amount ? formatCurrency(entry.credit_amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                            {entry.smart_code}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                ✓ These GL entries were automatically generated by Finance DNA
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderPagination = () => {
    if (!data || totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900">
        <div className="text-sm dark:ink-muted">
          Showing {data.transactions.length} of {data.total_count} transactions
          {data.total_amount !== undefined && (
            <span className="ml-2">• Total: {formatCurrency(data.total_amount)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
              if (page > totalPages) return null

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange?.(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <MoreHorizontal className="h-3 w-3 ink-muted" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange?.(totalPages)}
                  className="h-8 w-8 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] p-0" side="right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-violet-900 dark:text-violet-100 text-lg">
                  {title}
                </SheetTitle>
                {subtitle && (
                  <SheetDescription className="text-violet-700 dark:text-violet-300 mt-1">
                    {subtitle}
                  </SheetDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {selectedTransaction ? renderTransactionDetail() : renderTransactionsList()}
            </div>
          </ScrollArea>

          {/* Footer Pagination */}
          {!selectedTransaction && renderPagination()}
        </div>
      </SheetContent>
    </Sheet>
  )
}
