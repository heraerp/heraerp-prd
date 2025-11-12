/**
 * Hero Metrics Section
 * Enterprise-grade dashboard hero metrics with animations
 */

'use client'

import React from 'react'
import { DollarSign, Calendar, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { SalonDashboardKPIs } from '@/hooks/useSalonDashboard'

interface HeroMetricsProps {
  kpis: SalonDashboardKPIs
  formatCurrency: (amount: number) => string
  selectedPeriod: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

export function HeroMetrics({ kpis, formatCurrency, selectedPeriod }: HeroMetricsProps) {
  // Get period-specific financial metrics
  const selectedMetrics = kpis.financialMetricsSplitAnalysis[selectedPeriod]

  // Period labels for display
  const periodLabels: Record<string, string> = {
    today: 'vs yesterday',
    last7Days: 'last 7 days',
    last30Days: 'last 30 days',
    yearToDate: 'year to date',
    allTime: 'all time'
  }

  const metrics = [
    {
      title: 'Revenue',
      value: formatCurrency(selectedMetrics.revenue),
      change: selectedPeriod === 'today' ? kpis.todayRevenueGrowth : undefined,
      changeLabel: periodLabels[selectedPeriod],
      icon: DollarSign,
      color: LUXE_COLORS.gold,
      gradient: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}10 100%)`
    },
    {
      title: 'Transactions',
      value: selectedMetrics.transactionCount,
      change: selectedPeriod === 'today' ? kpis.todayAppointmentsGrowth : undefined,
      changeLabel: periodLabels[selectedPeriod],
      icon: Calendar,
      color: LUXE_COLORS.emerald,
      gradient: `linear-gradient(135deg, ${LUXE_COLORS.emerald}25 0%, ${LUXE_COLORS.emerald}10 100%)`
    },
    {
      title: 'Active Staff',
      value: `${kpis.todayOnDutyStaff}/${kpis.activeStaff}`,
      subtitle: `${kpis.averageStaffUtilization.toFixed(0)}% utilization`,
      icon: Users,
      color: LUXE_COLORS.sapphire,
      gradient: `linear-gradient(135deg, ${LUXE_COLORS.sapphire}25 0%, ${LUXE_COLORS.sapphire}10 100%)`
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl transition-all duration-500 hover:scale-[1.008] hover:shadow-lg"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark} 0%, ${LUXE_COLORS.charcoal} 100%)`,
            border: `1px solid ${metric.color}20`,
            boxShadow: `0 4px 16px ${LUXE_COLORS.black}30`,
            animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
          }}
        >
          {/* Subtle shimmer background */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-700"
            style={{
              backgroundImage: `linear-gradient(135deg, transparent 0%, ${metric.color}05 50%, transparent 100%)`,
              transform: 'translateX(-100%)',
              animation: 'shimmer 3s infinite'
            }}
          />

          {/* Subtle glow effect on hover */}
          <div
            className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
            style={{ background: metric.color }}
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              {/* Icon */}
              <div
                className="p-3.5 rounded-xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-1"
                style={{
                  background: metric.gradient,
                  border: `1px solid ${metric.color}30`,
                  boxShadow: `0 2px 8px ${metric.color}15`
                }}
              >
                <metric.icon className="w-6 h-6" style={{ color: metric.color }} />
              </div>

              {/* Change indicator */}
              {metric.change !== undefined && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor:
                      metric.change >= 0
                        ? `${LUXE_COLORS.success}15`
                        : `${LUXE_COLORS.danger}15`,
                    color: metric.change >= 0 ? LUXE_COLORS.success : LUXE_COLORS.danger,
                    border: `1px solid ${metric.change >= 0 ? LUXE_COLORS.success : LUXE_COLORS.danger}25`,
                    boxShadow: `0 0 6px ${metric.change >= 0 ? LUXE_COLORS.success : LUXE_COLORS.danger}10`
                  }}
                >
                  {metric.change >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Title */}
            <h3
              className="text-sm font-semibold mb-3 uppercase tracking-wide transition-all duration-300"
              style={{ color: LUXE_COLORS.bronze }}
            >
              {metric.title}
            </h3>

            {/* Value */}
            <p
              className="text-4xl font-bold mb-2 transition-all duration-300 group-hover:scale-102"
              style={{
                backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${metric.color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {metric.value}
            </p>

            {/* Subtitle/Change Label */}
            {(metric.changeLabel || metric.subtitle) && (
              <p className="text-xs font-medium" style={{ color: LUXE_COLORS.lightText, opacity: 0.7 }}>
                {metric.changeLabel || metric.subtitle}
              </p>
            )}

            {/* Progress bar for utilization */}
            {metric.subtitle && metric.subtitle.includes('utilization') && (
              <div
                className="mt-3 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${kpis.averageStaffUtilization}%`,
                    backgroundImage: `linear-gradient(90deg, ${metric.color} 0%, ${LUXE_COLORS.gold} 100%)`,
                    boxShadow: `0 0 10px ${metric.color}60`,
                    animation: 'growWidth 1.5s ease-out'
                  }}
                />
              </div>
            )}
          </div>

          {/* Decorative corner accent */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 transition-all duration-500 group-hover:scale-150 group-hover:opacity-10"
            style={{ background: metric.color }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes growWidth {
          from {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
