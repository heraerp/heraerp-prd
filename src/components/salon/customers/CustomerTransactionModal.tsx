'use client'

/**
 * CustomerTransactionModal Component
 *
 * Full-screen modal displaying complete customer transaction history
 * with filtering, sorting, and pagination
 *
 * Features:
 * - Date range filter (Last 30/90/365 days, Custom)
 * - Transaction table with sorting
 * - Pagination (25/50/100 per page)
 * - Mobile-optimized card view
 * - LUXE glassmorphism theme
 */

import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { subDays } from 'date-fns'
import {
  X,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Loader2,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C'
}

interface CustomerTransactionModalProps {
  open: boolean
  onClose: () => void
  customerId: string
  customerName: string
  organizationId: string
}

type DateRangeOption = 'last_30' | 'last_90' | 'last_365' | 'all'

export function CustomerTransactionModal({
  open,
  onClose,
  customerId,
  customerName,
  organizationId
}: CustomerTransactionModalProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Calculate date filters based on selection
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date()
    switch (dateRange) {
      case 'last_30':
        return {
          dateFrom: subDays(today, 30).toISOString(),
          dateTo: today.toISOString()
        }
      case 'last_90':
        return {
          dateFrom: subDays(today, 90).toISOString(),
          dateTo: today.toISOString()
        }
      case 'last_365':
        return {
          dateFrom: subDays(today, 365).toISOString(),
          dateTo: today.toISOString()
        }
      default:
        return { dateFrom: undefined, dateTo: undefined }
    }
  }, [dateRange])

  // 🚀 ENTERPRISE: Fetch ALL transactions for customer (not just SALE type)
  const {
    transactions: rawTransactions,
    isLoading,
    error
  } = useUniversalTransactionV1({
    organizationId: organizationId,
    filters: {
      source_entity_id: customerId, // Filter by customer
      include_lines: true,
      date_from: dateFrom,
      date_to: dateTo
    }
  })

  // 🔍 DEBUG: Verify customer filtering is working
  React.useEffect(() => {
    if (rawTransactions && rawTransactions.length > 0) {
      console.log('🔍 [CustomerTransactionModal] Transactions loaded:', {
        customerId,
        customerName,
        totalTransactions: rawTransactions.length,
        firstTransaction: rawTransactions[0],
        allSourceEntityIds: rawTransactions.map(t => t.source_entity_id),
        uniqueCustomers: [...new Set(rawTransactions.map(t => t.source_entity_id))],
        isFilteredCorrectly: rawTransactions.every(t => t.source_entity_id === customerId)
      })
    }
  }, [rawTransactions, customerId, customerName])

  // Extract transactions array
  const transactions = useMemo(() => {
    return rawTransactions || []
  }, [rawTransactions])

  // 📊 CALCULATE KPIS: Lifetime value, visit count, avg order
  const kpis = useMemo(() => {
    const completedTransactions = transactions.filter(
      t => t.transaction_status === 'completed'
    )

    const lifetimeValue = completedTransactions.reduce(
      (sum, t) => sum + (t.total_amount || 0),
      0
    )

    const visitCount = completedTransactions.length
    const avgOrderValue = visitCount > 0 ? lifetimeValue / visitCount : 0

    const lastVisit = transactions.length > 0
      ? transactions.sort(
          (a, b) =>
            new Date(b.transaction_date).getTime() -
            new Date(a.transaction_date).getTime()
        )[0]?.transaction_date
      : null

    return {
      lifetimeValue,
      visitCount,
      avgOrderValue,
      lastVisit,
      totalCount: transactions.length
    }
  }, [transactions])

  // 💰 FORMAT CURRENCY: AED format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return transactions.slice(startIndex, endIndex)
  }, [transactions, currentPage, pageSize])

  const totalPages = Math.ceil(transactions.length / pageSize)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, pageSize])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] p-0 flex flex-col overflow-hidden border-0 [&>button]:hidden"
        style={{
          backgroundColor: LUXE_COLORS.charcoal,
          border: `2px solid ${LUXE_COLORS.gold}`,
          boxShadow: `0 25px 80px rgba(0, 0, 0, 0.8), 0 0 120px ${LUXE_COLORS.gold}40, inset 0 0 80px rgba(212, 175, 55, 0.05)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}
      >
        {/* Header */}
        <div
          className="p-6 md:p-8 border-b flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoal} 100%)`,
            backdropFilter: 'blur(10px)',
            borderColor: `${LUXE_COLORS.gold}60`,
            boxShadow: `inset 0 -1px 0 ${LUXE_COLORS.gold}40`
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}20`,
                border: `1px solid ${LUXE_COLORS.gold}60`
              }}
            >
              <ShoppingBag className="w-6 h-6" style={{ color: LUXE_COLORS.gold }} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                Transaction History
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Customer:
                </span>
                <span
                  className="text-sm font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${LUXE_COLORS.gold}15`,
                    color: LUXE_COLORS.gold,
                    border: `1px solid ${LUXE_COLORS.gold}40`
                  }}
                >
                  {customerName}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-opacity-20 active:scale-95"
            style={{ color: LUXE_COLORS.gold }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters Bar */}
        <div
          className="p-4 border-b flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}60`,
            borderColor: `${LUXE_COLORS.gold}20`
          }}
        >
          {/* Date Range Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Calendar className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
            <Select value={dateRange} onValueChange={(value: DateRangeOption) => setDateRange(value)}>
              <SelectTrigger
                className="w-full md:w-[200px] min-h-[44px]"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="last_90">Last 90 Days</SelectItem>
                <SelectItem value="last_365">Last 365 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}15`,
                border: `1px solid ${LUXE_COLORS.gold}40`
              }}
            >
              <ShoppingBag className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
              <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                {transactions.length} transactions
              </span>
            </div>
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: `${LUXE_COLORS.emerald}15`,
                border: `1px solid ${LUXE_COLORS.emerald}40`
              }}
            >
              <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.emerald }} />
              <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                {formatCurrency(kpis.lifetimeValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
              <span className="ml-3" style={{ color: LUXE_COLORS.champagne }}>
                Loading transactions...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8" style={{ color: '#F87171' }} />
              <span className="ml-3" style={{ color: LUXE_COLORS.champagne }}>
                Error loading transactions
              </span>
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}10`,
                  border: `2px solid ${LUXE_COLORS.gold}30`
                }}
              >
                <ShoppingBag className="w-10 h-10" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <p className="text-xl font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                No transactions found
              </p>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                {customerName} hasn't made any transactions yet
              </p>
            </div>
          )}

          {!isLoading && !error && paginatedTransactions.length > 0 && (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {paginatedTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${LUXE_COLORS.gold}20`
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                          {transaction.transaction_code || transaction.id.slice(0, 8)}
                        </p>
                        <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                          {format(new Date(transaction.transaction_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <p className="text-lg font-bold" style={{ color: LUXE_COLORS.emerald }}>
                        {formatCurrency(transaction.total_amount || 0)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs px-2 py-1 rounded capitalize"
                        style={{
                          backgroundColor:
                            transaction.transaction_status === 'completed'
                              ? `${LUXE_COLORS.emerald}20`
                              : transaction.transaction_status === 'cancelled'
                                ? '#F8717120'
                                : `${LUXE_COLORS.bronze}20`,
                          color:
                            transaction.transaction_status === 'completed'
                              ? LUXE_COLORS.emerald
                              : transaction.transaction_status === 'cancelled'
                                ? '#F87171'
                                : LUXE_COLORS.bronze
                        }}
                      >
                        {transaction.transaction_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}20` }}>
                      <th className="text-left p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Transaction #
                      </th>
                      <th className="text-left p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Date & Time
                      </th>
                      <th className="text-right p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Amount
                      </th>
                      <th className="text-center p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map(transaction => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-opacity-40 transition-all"
                        style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}10` }}
                      >
                        <td className="p-3">
                          <p className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne }}>
                            {transaction.transaction_code || transaction.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                            {format(new Date(transaction.transaction_date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </td>
                        <td className="p-3 text-right">
                          <p className="text-sm font-bold" style={{ color: LUXE_COLORS.emerald }}>
                            {formatCurrency(transaction.total_amount || 0)}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className="text-xs px-3 py-1 rounded capitalize inline-block"
                            style={{
                              backgroundColor:
                                transaction.transaction_status === 'completed'
                                  ? `${LUXE_COLORS.emerald}20`
                                  : transaction.transaction_status === 'cancelled'
                                    ? '#F8717120'
                                    : `${LUXE_COLORS.bronze}20`,
                              color:
                                transaction.transaction_status === 'completed'
                                  ? LUXE_COLORS.emerald
                                  : transaction.transaction_status === 'cancelled'
                                    ? '#F87171'
                                    : LUXE_COLORS.bronze
                            }}
                          >
                            {transaction.transaction_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer with Pagination */}
        {!isLoading && paginatedTransactions.length > 0 && (
          <div
            className="p-4 border-t flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
              borderColor: `${LUXE_COLORS.gold}20`
            }}
          >
            {/* Page Size Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Show:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={value => setPageSize(parseInt(value))}
              >
                <SelectTrigger
                  className="w-[100px] min-h-[44px]"
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    borderColor: `${LUXE_COLORS.gold}40`,
                    color: LUXE_COLORS.champagne
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-w-[44px] min-h-[44px] rounded-lg active:scale-95"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm px-4" style={{ color: LUXE_COLORS.champagne }}>
                Page {currentPage} of {totalPages}
              </span>

              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-w-[44px] min-h-[44px] rounded-lg active:scale-95"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
