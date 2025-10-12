/**
 * Revenue Trends Section
 * Enterprise-grade revenue analytics with line/bar charts
 */

'use client'

import React, { useState } from 'react'
import { DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { SalonDashboardKPIs } from '@/hooks/useSalonDashboard'
import { LuxeLineChart } from './charts/LuxeLineChart'
import { LuxeBarChart } from './charts/LuxeBarChart'

interface RevenueTrendsProps {
  kpis: SalonDashboardKPIs
  formatCurrency: (amount: number) => string
  selectedPeriod: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

export function RevenueTrends({ kpis, formatCurrency, selectedPeriod }: RevenueTrendsProps) {
  const [viewMode, setViewMode] = useState<'7days' | '30days'>('7days')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const data = viewMode === '7days' ? kpis.last7DaysRevenue : kpis.last30DaysRevenue

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}10 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              boxShadow: `0 4px 12px ${LUXE_COLORS.gold}20`
            }}
          >
            <TrendingUp className="w-6 h-6" style={{ color: LUXE_COLORS.gold }} />
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
              Revenue Trends
            </h2>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Daily revenue performance • Filtered by:{' '}
              <span style={{ color: LUXE_COLORS.gold }}>
                {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'last7Days' ? 'Last 7 Days' : selectedPeriod === 'last30Days' ? 'Last 30 Days' : selectedPeriod === 'yearToDate' ? 'Year to Date' : 'All Time'}
              </span>
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          <div
            className="flex items-center p-1 rounded-lg"
            style={{
              background: LUXE_COLORS.charcoalDark,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <button
              onClick={() => setChartType('line')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor:
                  chartType === 'line' ? `${LUXE_COLORS.gold}30` : 'transparent',
                color: chartType === 'line' ? LUXE_COLORS.gold : LUXE_COLORS.bronze,
                border:
                  chartType === 'line' ? `1px solid ${LUXE_COLORS.gold}40` : '1px solid transparent'
              }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor: chartType === 'bar' ? `${LUXE_COLORS.gold}30` : 'transparent',
                color: chartType === 'bar' ? LUXE_COLORS.gold : LUXE_COLORS.bronze,
                border:
                  chartType === 'bar' ? `1px solid ${LUXE_COLORS.gold}40` : '1px solid transparent'
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Period Toggle */}
          <div
            className="flex items-center p-1 rounded-lg"
            style={{
              background: LUXE_COLORS.charcoalDark,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <button
              onClick={() => setViewMode('7days')}
              className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor:
                  viewMode === '7days' ? `${LUXE_COLORS.emerald}30` : 'transparent',
                color: viewMode === '7days' ? LUXE_COLORS.emerald : LUXE_COLORS.bronze,
                border:
                  viewMode === '7days'
                    ? `1px solid ${LUXE_COLORS.emerald}40`
                    : '1px solid transparent'
              }}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewMode('30days')}
              className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor:
                  viewMode === '30days' ? `${LUXE_COLORS.emerald}30` : 'transparent',
                color: viewMode === '30days' ? LUXE_COLORS.emerald : LUXE_COLORS.bronze,
                border:
                  viewMode === '30days'
                    ? `1px solid ${LUXE_COLORS.emerald}40`
                    : '1px solid transparent'
              }}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {chartType === 'line' ? (
          <LuxeLineChart
            data={data}
            xKey="date"
            yKey="revenue"
            color={LUXE_COLORS.gold}
            gradient={true}
            height={350}
            formatYAxis={value => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
              return value.toString()
            }}
            formatTooltip={value => formatCurrency(value)}
          />
        ) : (
          <LuxeBarChart
            data={data}
            xKey="date"
            yKey="revenue"
            color={LUXE_COLORS.gold}
            height={350}
            formatYAxis={value => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
              return value.toString()
            }}
            formatTooltip={value => formatCurrency(value)}
          />
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Month-to-Date Revenue */}
        <div
          className="group p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.emerald}15 0%, ${LUXE_COLORS.emerald}05 100%)`,
            border: `1px solid ${LUXE_COLORS.emerald}30`,
            boxShadow: `0 4px 12px ${LUXE_COLORS.black}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: LUXE_COLORS.emerald }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: LUXE_COLORS.bronze }}>
              Month-to-Date
            </span>
          </div>
          <p
            className="text-2xl font-bold transition-all duration-300 group-hover:scale-102"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.emerald} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {formatCurrency(kpis.monthToDateRevenue)}
          </p>
        </div>

        {/* Average Transaction Value */}
        <div
          className="group p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.sapphire}15 0%, ${LUXE_COLORS.sapphire}05 100%)`,
            border: `1px solid ${LUXE_COLORS.sapphire}30`,
            boxShadow: `0 4px 12px ${LUXE_COLORS.black}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.sapphire }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: LUXE_COLORS.bronze }}>
              Avg Transaction
            </span>
          </div>
          <p
            className="text-2xl font-bold transition-all duration-300 group-hover:scale-102"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.sapphire} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {formatCurrency(kpis.averageTransactionValue)}
          </p>
        </div>

        {/* Total Revenue */}
        <div
          className="group p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}15 0%, ${LUXE_COLORS.gold}05 100%)`,
            border: `1px solid ${LUXE_COLORS.gold}40`,
            boxShadow: `0 4px 12px ${LUXE_COLORS.gold}20`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: LUXE_COLORS.bronze }}>
              Total Revenue
            </span>
          </div>
          <p
            className="text-2xl font-bold transition-all duration-300 group-hover:scale-102"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {formatCurrency(kpis.totalRevenue)}
          </p>
        </div>
      </div>
    </div>
  )
}
