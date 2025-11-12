'use client'

/**
 * CustomerTransactionSummary Component
 *
 * Expandable inline section showing customer transaction KPIs and recent history
 * Displays when customer card/row is expanded
 *
 * Features:
 * - 4 KPI cards (Lifetime Value, Visit Count, Avg Order, Last Visit)
 * - Recent 5 transactions list
 * - "View All" button to open full modal
 * - Mobile-first responsive design
 * - LUXE glassmorphism theme
 */

import React from 'react'
import { format } from 'date-fns'
import { ChevronRight, ShoppingBag, TrendingUp, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCustomerTransactions } from '@/hooks/useCustomerTransactions'

const LUXE_COLORS = {
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C'
}

interface CustomerTransactionSummaryProps {
  customerId: string
  customerName: string
  organizationId: string
  onViewAll: () => void
}

export function CustomerTransactionSummary({
  customerId,
  customerName,
  organizationId,
  onViewAll
}: CustomerTransactionSummaryProps) {
  const { kpis, recentTransactions, isLoading, formatCurrency } = useCustomerTransactions({
    customerId,
    organizationId
  })

  if (isLoading) {
    return (
      <div
        className="p-6 flex items-center justify-center"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${LUXE_COLORS.gold}20`
        }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: LUXE_COLORS.gold }} />
        <span className="ml-3" style={{ color: LUXE_COLORS.champagne }}>
          Loading transaction history...
        </span>
      </div>
    )
  }

  return (
    <div
      className="p-4 md:p-6 space-y-6"
      style={{
        backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${LUXE_COLORS.gold}20`
      }}
    >
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Lifetime Value */}
        <div
          className="p-4 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: `${LUXE_COLORS.emerald}20`,
            border: `1px solid ${LUXE_COLORS.emerald}40`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5" style={{ color: LUXE_COLORS.emerald }} />
          </div>
          <p className="text-lg md:text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
            {formatCurrency(kpis.lifetimeValue)}
          </p>
          <p className="text-xs md:text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Lifetime Value
          </p>
        </div>

        {/* Visit Count */}
        <div
          className="p-4 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: `${LUXE_COLORS.gold}20`,
            border: `1px solid ${LUXE_COLORS.gold}40`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" style={{ color: LUXE_COLORS.gold }} />
          </div>
          <p className="text-lg md:text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
            {kpis.visitCount}
          </p>
          <p className="text-xs md:text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Total Visits
          </p>
        </div>

        {/* Average Order Value */}
        <div
          className="p-4 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: `${LUXE_COLORS.goldDark}20`,
            border: `1px solid ${LUXE_COLORS.goldDark}40`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" style={{ color: LUXE_COLORS.goldDark }} />
          </div>
          <p className="text-lg md:text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
            {formatCurrency(kpis.averageOrderValue)}
          </p>
          <p className="text-xs md:text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Avg Order
          </p>
        </div>

        {/* Last Visit */}
        <div
          className="p-4 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: `${LUXE_COLORS.bronze}20`,
            border: `1px solid ${LUXE_COLORS.bronze}40`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5" style={{ color: LUXE_COLORS.bronze }} />
          </div>
          <p className="text-sm md:text-base font-bold" style={{ color: LUXE_COLORS.champagne }}>
            {kpis.lastVisitDate ? format(new Date(kpis.lastVisitDate), 'MMM d, yyyy') : 'Never'}
          </p>
          <p className="text-xs md:text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Last Visit
          </p>
        </div>
      </div>

      {/* Recent Transactions List */}
      {recentTransactions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm md:text-base font-semibold" style={{ color: LUXE_COLORS.champagne }}>
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {recentTransactions.map(transaction => (
              <div
                key={transaction.id}
                className="p-3 md:p-4 rounded-lg flex items-center justify-between hover:scale-[1.02] transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}60`,
                  border: `1px solid ${LUXE_COLORS.gold}20`
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" style={{ color: LUXE_COLORS.gold }} />
                    <p className="text-xs md:text-sm font-medium truncate" style={{ color: LUXE_COLORS.champagne }}>
                      {transaction.transaction_code || transaction.id.slice(0, 8)}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm md:text-base font-bold" style={{ color: LUXE_COLORS.emerald }}>
                    {formatCurrency(transaction.total_amount || 0)}
                  </p>
                  <p
                    className="text-xs capitalize"
                    style={{
                      color:
                        transaction.transaction_status === 'completed'
                          ? LUXE_COLORS.emerald
                          : transaction.transaction_status === 'cancelled'
                            ? '#F87171'
                            : LUXE_COLORS.bronze
                    }}
                  >
                    {transaction.transaction_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Transactions Message */}
      {recentTransactions.length === 0 && (
        <div className="text-center py-8">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: LUXE_COLORS.bronze }} />
          <p className="text-sm md:text-base" style={{ color: LUXE_COLORS.bronze }}>
            No transactions yet for {customerName}
          </p>
        </div>
      )}

      {/* View All Button */}
      {kpis.totalTransactions > 5 && (
        <Button
          onClick={onViewAll}
          className="w-full min-h-[44px] md:min-h-[48px] rounded-lg font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: LUXE_COLORS.gold,
            color: LUXE_COLORS.charcoal
          }}
        >
          View All {kpis.totalTransactions} Transactions
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  )
}
