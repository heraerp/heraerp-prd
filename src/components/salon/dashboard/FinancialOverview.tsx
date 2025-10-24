/**
 * Financial Overview Section
 * Enterprise-grade financial metrics with payment breakdown
 * ✅ ENTERPRISE FEATURE: Split analysis by time periods (Today/7Days/30Days/Year)
 */

'use client'

import React from 'react'
import { DollarSign, CreditCard, Wallet, TrendingUp, PieChart } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { SalonDashboardKPIs, PaymentMethodBreakdown } from '@/hooks/useSalonDashboard'
import { LuxePieChart } from './charts/LuxePieChart'

interface FinancialOverviewProps {
  kpis: SalonDashboardKPIs
  formatCurrency: (amount: number) => string
  selectedPeriod: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

type TimePeriod = 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'

export function FinancialOverview({ kpis, formatCurrency, selectedPeriod }: FinancialOverviewProps) {
  // ✅ ENTERPRISE: Use global period filter (passed as prop)

  // Get breakdown for selected period (instant calculation, no reload)
  const selectedBreakdown: PaymentMethodBreakdown =
    kpis.paymentMethodSplitAnalysis[selectedPeriod]

  // ✅ ENTERPRISE: Get financial metrics for selected period (revenue, profit, etc.)
  const selectedMetrics = kpis.financialMetricsSplitAnalysis[selectedPeriod]

  const paymentData = [
    {
      name: 'Card',
      value: selectedBreakdown.card,
      color: LUXE_COLORS.sapphire
    },
    {
      name: 'Cash',
      value: selectedBreakdown.cash,
      color: LUXE_COLORS.emerald
    },
    {
      name: 'Bank Transfer',
      value: selectedBreakdown.bank_transfer,
      color: LUXE_COLORS.gold
    },
    {
      name: 'Voucher',
      value: selectedBreakdown.voucher,
      color: LUXE_COLORS.plum
    }
  ].filter(item => item.value > 0)

  const totalPayments = Object.values(selectedBreakdown).reduce((a, b) => a + b, 0)

  // Period labels for tabs
  const periodLabels: Record<TimePeriod, string> = {
    today: 'Today',
    last7Days: '7 Days',
    last30Days: '30 Days',
    yearToDate: 'Year',
    allTime: 'All Time'
  }

  return (
    <div
      className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-500 hover:shadow-lg"
      style={{
        backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark} 0%, ${LUXE_COLORS.charcoal} 100%)`,
        border: `1px solid ${LUXE_COLORS.gold}20`,
        boxShadow: `0 8px 32px ${LUXE_COLORS.black}40`
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="p-3 rounded-xl"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}10 100%)`,
            border: `1px solid ${LUXE_COLORS.gold}30`,
            boxShadow: `0 4px 12px ${LUXE_COLORS.gold}20`
          }}
        >
          <PieChart className="w-6 h-6" style={{ color: LUXE_COLORS.gold }} />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Financial Overview
          </h2>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Profit margins and payment methods • {periodLabels[selectedPeriod]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Metrics */}
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: LUXE_COLORS.bronze }}
          >
            Profitability Metrics
          </h3>

          {/* Gross Profit */}
          <div
            className="group p-5 rounded-xl mb-4 transition-all duration-300 hover:scale-[1.008] cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.emerald}15 0%, ${LUXE_COLORS.emerald}05 100%)`,
              border: `1px solid ${LUXE_COLORS.emerald}40`,
              boxShadow: `0 4px 12px ${LUXE_COLORS.emerald}20`
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg transition-all duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.emerald}40 0%, ${LUXE_COLORS.emerald}20 100%)`,
                    border: `1px solid ${LUXE_COLORS.emerald}50`
                  }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: LUXE_COLORS.emerald }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.lightText }}>
                  Gross Profit
                </span>
              </div>
            </div>
            <p
              className="text-3xl font-bold transition-all duration-300 group-hover:scale-102"
              style={{
                backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.emerald} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {formatCurrency(selectedMetrics.grossProfit)}
            </p>
            <p className="text-xs mt-2" style={{ color: LUXE_COLORS.bronze }}>
              {selectedMetrics.transactionCount} transactions • {periodLabels[selectedPeriod]}
            </p>
          </div>

          {/* Profit Margin */}
          <div
            className="group p-5 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}15 0%, ${LUXE_COLORS.gold}05 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}40`,
              boxShadow: `0 4px 12px ${LUXE_COLORS.gold}20`
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg transition-all duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}40 0%, ${LUXE_COLORS.gold}20 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}50`,
                    boxShadow: `0 0 6px ${LUXE_COLORS.gold}15`
                  }}
                >
                  <DollarSign className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                  Profit Margin
                </span>
              </div>
            </div>
            <p
              className="text-3xl font-bold transition-all duration-300 group-hover:scale-102"
              style={{
                backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {selectedMetrics.profitMargin.toFixed(1)}%
            </p>
            <p className="text-xs mt-2" style={{ color: LUXE_COLORS.bronze }}>
              Revenue: {formatCurrency(selectedMetrics.revenue)} • {periodLabels[selectedPeriod]}
            </p>
            {/* Progress bar */}
            <div
              className="mt-3 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${selectedMetrics.profitMargin}%`,
                  backgroundImage: `linear-gradient(90deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.emerald} 100%)`,
                  boxShadow: `0 0 10px ${LUXE_COLORS.gold}60`
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center justify-between"
            style={{ color: LUXE_COLORS.bronze }}
          >
            <span>Payment Method Breakdown</span>
            <span className="text-xs font-normal normal-case" style={{ color: LUXE_COLORS.gold }}>
              {periodLabels[selectedPeriod]}
            </span>
          </h3>

          {totalPayments === 0 ? (
            <div className="text-center py-12">
              <CreditCard
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }}
              />
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                No payment data available yet
              </p>
            </div>
          ) : (
            <>
              <LuxePieChart
                data={paymentData}
                height={220}
                innerRadius={50}
                outerRadius={80}
                showLegend={false}
                formatValue={value => formatCurrency(value)}
              />

              {/* Payment Method Details */}
              <div className="mt-6 space-y-3">
                {paymentData.map((method, index) => {
                  const percentage =
                    totalPayments > 0 ? ((method.value / totalPayments) * 100).toFixed(1) : '0'

                  const icons = {
                    Card: CreditCard,
                    Cash: Wallet,
                    'Bank Transfer': DollarSign,
                    Voucher: TrendingUp
                  }

                  const Icon = icons[method.name as keyof typeof icons] || CreditCard

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${method.color}15 0%, ${method.color}05 100%)`,
                        border: `1px solid ${method.color}30`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${method.color}30 0%, ${method.color}15 100%)`,
                            border: `1px solid ${method.color}40`
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: method.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: LUXE_COLORS.lightText }}>
                            {method.name}
                          </p>
                          <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                            {percentage}% of payments
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold" style={{ color: method.color }}>
                        {formatCurrency(method.value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
