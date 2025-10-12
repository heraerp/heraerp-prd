/**
 * Appointment Analytics Section
 * Enterprise-grade appointment breakdown with pie charts
 */

'use client'

import React from 'react'
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { SalonDashboardKPIs } from '@/hooks/useSalonDashboard'
import { LuxePieChart } from './charts/LuxePieChart'

interface AppointmentAnalyticsProps {
  kpis: SalonDashboardKPIs
  selectedPeriod: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

export function AppointmentAnalytics({ kpis, selectedPeriod }: AppointmentAnalyticsProps) {
  const statusData = [
    {
      name: 'Completed',
      value: kpis.appointmentsByStatus.completed,
      color: LUXE_COLORS.success,
      icon: CheckCircle
    },
    {
      name: 'In Progress',
      value: kpis.appointmentsByStatus.in_progress,
      color: LUXE_COLORS.sapphire,
      icon: Clock
    },
    {
      name: 'Pending',
      value: kpis.appointmentsByStatus.pending,
      color: LUXE_COLORS.warning,
      icon: AlertCircle
    },
    {
      name: 'Cancelled',
      value: kpis.appointmentsByStatus.cancelled,
      color: LUXE_COLORS.danger,
      icon: XCircle
    },
    {
      name: 'No Show',
      value: kpis.appointmentsByStatus.no_show,
      color: LUXE_COLORS.orange,
      icon: AlertCircle
    }
  ].filter(item => item.value > 0)

  const metrics = [
    {
      label: 'Conversion Rate',
      value: `${kpis.appointmentConversionRate.toFixed(1)}%`,
      color: LUXE_COLORS.success,
      icon: TrendingUp
    },
    {
      label: 'No-Show Rate',
      value: `${kpis.noShowRate.toFixed(1)}%`,
      color: kpis.noShowRate > 10 ? LUXE_COLORS.danger : LUXE_COLORS.warning,
      icon: AlertCircle,
      warning: kpis.noShowRate > 10
    },
    {
      label: 'Cancellation Rate',
      value: `${kpis.cancellationRate.toFixed(1)}%`,
      color: kpis.cancellationRate > 15 ? LUXE_COLORS.danger : LUXE_COLORS.info,
      icon: XCircle,
      warning: kpis.cancellationRate > 15
    }
  ]

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
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.emerald}25 0%, ${LUXE_COLORS.emerald}10 100%)`,
            border: `1px solid ${LUXE_COLORS.emerald}30`,
            boxShadow: `0 4px 12px ${LUXE_COLORS.emerald}20`
          }}
        >
          <Calendar className="w-6 h-6" style={{ color: LUXE_COLORS.emerald }} />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.emerald} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Appointment Analytics
          </h2>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Status breakdown and conversion metrics • Filtered by:{' '}
            <span style={{ color: LUXE_COLORS.emerald }}>
              {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'last7Days' ? 'Last 7 Days' : selectedPeriod === 'last30Days' ? 'Last 30 Days' : selectedPeriod === 'yearToDate' ? 'Year to Date' : 'All Time'}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: LUXE_COLORS.bronze }}
          >
            Appointment Status Distribution
          </h3>
          <LuxePieChart
            data={statusData}
            height={280}
            innerRadius={60}
            outerRadius={100}
            showLegend={false}
          />

          {/* Status Legend with values */}
          <div className="mt-6 space-y-3">
            {statusData.map((status, index) => {
              const Icon = status.icon
              const total = Object.values(kpis.appointmentsByStatus).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((status.value / total) * 100).toFixed(1) : '0'

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${status.color}15 0%, ${status.color}05 100%)`,
                    border: `1px solid ${status.color}30`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: status.color,
                        boxShadow: `0 0 4px ${status.color}30`
                      }}
                    />
                    <Icon className="w-4 h-4" style={{ color: status.color }} />
                    <span className="text-sm font-medium" style={{ color: LUXE_COLORS.lightText }}>
                      {status.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" style={{ color: status.color }}>
                      {status.value}
                    </span>
                    <span className="text-xs font-medium" style={{ color: LUXE_COLORS.bronze }}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Key Metrics */}
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: LUXE_COLORS.bronze }}
          >
            Performance Metrics
          </h3>
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className="group p-5 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
                    border: `1px solid ${metric.color}30`,
                    boxShadow: `0 4px 12px ${LUXE_COLORS.black}40`
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg transition-all duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${metric.color}25 0%, ${metric.color}10 100%)`,
                          border: `1px solid ${metric.color}30`
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: metric.color }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.lightText }}>
                        {metric.label}
                      </span>
                    </div>
                    {metric.warning && (
                      <div
                        className="px-2 py-1 rounded-md text-xs font-bold"
                        style={{
                          backgroundColor: `${LUXE_COLORS.danger}20`,
                          color: LUXE_COLORS.danger,
                          border: `1px solid ${LUXE_COLORS.danger}40`
                        }}
                      >
                        HIGH
                      </div>
                    )}
                  </div>
                  <p
                    className="text-3xl font-bold transition-all duration-300 group-hover:scale-102"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${metric.color} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {metric.value}
                  </p>
                </div>
              )
            })}

            {/* Average Appointment Value */}
            <div
              className="group p-5 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
              style={{
                backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}15 0%, ${LUXE_COLORS.gold}05 100%)`,
                border: `1px solid ${LUXE_COLORS.gold}40`,
                boxShadow: `0 4px 12px ${LUXE_COLORS.gold}20`
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-2 rounded-lg transition-all duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.gold}40 0%, ${LUXE_COLORS.gold}20 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}50`,
                    boxShadow: `0 0 6px ${LUXE_COLORS.gold}15`
                  }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                  Average Appointment Value
                </span>
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
                {new Intl.NumberFormat('en-AE', {
                  style: 'currency',
                  currency: 'AED',
                  minimumFractionDigits: 0
                }).format(kpis.averageAppointmentValue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
