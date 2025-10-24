/**
 * Customer and Service Insights
 * Enterprise-grade customer and service analytics
 */

'use client'

import React from 'react'
import { Users, Heart, TrendingUp, Scissors, Star, TrendingDown } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { SalonDashboardKPIs } from '@/hooks/useSalonDashboard'

interface CustomerAndServiceInsightsProps {
  kpis: SalonDashboardKPIs
  formatCurrency: (amount: number) => string
  selectedPeriod: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

export function CustomerAndServiceInsights({ kpis, formatCurrency, selectedPeriod }: CustomerAndServiceInsightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Insights */}
      <div
        className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-500 hover:shadow-lg"
        style={{
          backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark} 0%, ${LUXE_COLORS.charcoal} 100%)`,
          border: `1px solid ${LUXE_COLORS.emerald}20`,
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
            <Heart className="w-6 h-6" style={{ color: LUXE_COLORS.emerald }} />
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
              Customer Insights
            </h2>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Acquisition and retention metrics • Filtered by:{' '}
              <span style={{ color: LUXE_COLORS.emerald }}>
                {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'last7Days' ? 'Last 7 Days' : selectedPeriod === 'last30Days' ? 'Last 30 Days' : selectedPeriod === 'yearToDate' ? 'Year to Date' : 'All Time'}
              </span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
              border: `1px solid ${LUXE_COLORS.emerald}30`
            }}
          >
            <Users className="w-5 h-5 mb-2" style={{ color: LUXE_COLORS.emerald }} />
            <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.emerald }}>
              {kpis.newCustomersToday}
            </p>
            <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
              New Today
            </p>
          </div>

          <div
            className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
              border: `1px solid ${LUXE_COLORS.sapphire}30`
            }}
          >
            <TrendingUp className="w-5 h-5 mb-2" style={{ color: LUXE_COLORS.sapphire }} />
            <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.sapphire }}>
              {kpis.returningCustomersToday}
            </p>
            <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
              Returning
            </p>
          </div>

          <div
            className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}30`
            }}
          >
            <Star className="w-5 h-5 mb-2" style={{ color: LUXE_COLORS.gold }} />
            <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold }}>
              {kpis.vipCustomers}
            </p>
            <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
              VIP Clients
            </p>
          </div>

          <div
            className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.008] cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
              border: `1px solid ${LUXE_COLORS.plum}30`
            }}
          >
            <Heart className="w-5 h-5 mb-2" style={{ color: LUXE_COLORS.plum }} />
            <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.plum }}>
              {kpis.customerRetentionRate.toFixed(0)}%
            </p>
            <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
              Retention
            </p>
          </div>
        </div>

        {/* Customer LTV */}
        <div
          className="p-5 rounded-xl"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.emerald}15 0%, ${LUXE_COLORS.emerald}05 100%)`,
            border: `1px solid ${LUXE_COLORS.emerald}40`,
            boxShadow: `0 4px 12px ${LUXE_COLORS.emerald}20`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: LUXE_COLORS.bronze }}>
                Average Customer Lifetime Value
              </p>
              <p
                className="text-3xl font-bold"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.emerald} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {formatCurrency(kpis.averageCustomerLifetimeValue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: LUXE_COLORS.emerald, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Service Analytics */}
      <div
        className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-500 hover:shadow-lg"
        style={{
          backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark} 0%, ${LUXE_COLORS.charcoal} 100%)`,
          border: `1px solid ${LUXE_COLORS.sapphire}20`,
          boxShadow: `0 8px 32px ${LUXE_COLORS.black}40`
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.sapphire}25 0%, ${LUXE_COLORS.sapphire}10 100%)`,
              border: `1px solid ${LUXE_COLORS.sapphire}30`,
              boxShadow: `0 4px 12px ${LUXE_COLORS.sapphire}20`
            }}
          >
            <Scissors className="w-6 h-6" style={{ color: LUXE_COLORS.sapphire }} />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.sapphire} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Service Analytics
            </h2>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Most and least popular services • Filtered by:{' '}
              <span style={{ color: LUXE_COLORS.sapphire }}>
                {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'last7Days' ? 'Last 7 Days' : selectedPeriod === 'last30Days' ? 'Last 30 Days' : selectedPeriod === 'yearToDate' ? 'Year to Date' : 'All Time'}
              </span>
            </p>
          </div>
        </div>

        {/* Top Services */}
        <div className="mb-6">
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
            style={{ color: LUXE_COLORS.bronze }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: LUXE_COLORS.success }} />
            Top Performing Services
          </h3>
          <div className="space-y-2">
            {kpis.topServices.length === 0 ? (
              <div className="text-center py-6">
                <Scissors className="w-8 h-8 mx-auto mb-2" style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }} />
                <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  No service data available yet
                </p>
              </div>
            ) : (
              kpis.topServices.slice(0, 5).map((service, index) => (
                <div
                  key={service.serviceId}
                  className="group flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-[1.008] cursor-pointer"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
                    border: `1px solid ${index === 0 ? LUXE_COLORS.gold : LUXE_COLORS.emerald}30`
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className="text-lg font-bold px-2"
                      style={{
                        color: index === 0 ? LUXE_COLORS.gold : LUXE_COLORS.emerald
                      }}
                    >
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold truncate"
                        style={{ color: LUXE_COLORS.lightText }}
                      >
                        {service.serviceName}
                      </p>
                      <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                        {service.bookings} bookings
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold" style={{ color: LUXE_COLORS.gold }}>
                    {formatCurrency(service.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Least Popular Services */}
        {kpis.leastPopularServices.length > 0 && (
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              <TrendingDown className="w-4 h-4" style={{ color: LUXE_COLORS.warning }} />
              Needs Attention
            </h3>
            <div className="space-y-2">
              {kpis.leastPopularServices.slice(0, 3).map(service => (
                <div
                  key={service.serviceId}
                  className="flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-[1.008] cursor-pointer"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.warning}10 0%, ${LUXE_COLORS.warning}05 100%)`,
                    border: `1px solid ${LUXE_COLORS.warning}30`
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: LUXE_COLORS.lightText }}>
                      {service.serviceName}
                    </p>
                    <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                      Only {service.bookings} bookings
                    </p>
                  </div>
                  <div
                    className="px-2 py-1 rounded-md text-xs font-bold"
                    style={{
                      backgroundColor: `${LUXE_COLORS.warning}20`,
                      color: LUXE_COLORS.warning,
                      border: `1px solid ${LUXE_COLORS.warning}40`
                    }}
                  >
                    LOW
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
