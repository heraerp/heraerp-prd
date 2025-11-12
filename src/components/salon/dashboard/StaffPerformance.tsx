/**
 * Staff Performance Leaderboard
 * Enterprise-grade staff analytics with ranking and metrics
 */

'use client'

import React from 'react'
import { Users, Award, TrendingUp, Star, Clock } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { SalonDashboardKPIs } from '@/hooks/useSalonDashboard'

interface StaffPerformanceProps {
  kpis: SalonDashboardKPIs
  formatCurrency: (amount: number) => string
  selectedPeriod: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

export function StaffPerformance({ kpis, formatCurrency, selectedPeriod }: StaffPerformanceProps) {
  const rankColors = [LUXE_COLORS.gold, LUXE_COLORS.goldLight, LUXE_COLORS.bronze]
  const rankIcons = ['🥇', '🥈', '🥉']

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
              backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.sapphire}25 0%, ${LUXE_COLORS.sapphire}10 100%)`,
              border: `1px solid ${LUXE_COLORS.sapphire}30`,
              boxShadow: `0 4px 12px ${LUXE_COLORS.sapphire}20`
            }}
          >
            <Award className="w-6 h-6" style={{ color: LUXE_COLORS.sapphire }} />
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
              Staff Performance
            </h2>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Top performers and team utilization • Filtered by:{' '}
              <span style={{ color: LUXE_COLORS.sapphire }}>
                {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'last7Days' ? 'Last 7 Days' : selectedPeriod === 'last30Days' ? 'Last 30 Days' : selectedPeriod === 'yearToDate' ? 'Year to Date' : 'All Time'}
              </span>
            </p>
          </div>
        </div>

        {/* Team Stats Badge */}
        <div
          className="px-4 py-2 rounded-lg"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
            border: `1px solid ${LUXE_COLORS.emerald}40`
          }}
        >
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: LUXE_COLORS.bronze }}>
              Team Utilization
            </p>
            <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.emerald }}>
              {kpis.averageStaffUtilization.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3 mb-6">
        {kpis.staffLeaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }} />
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              No staff performance data available yet
            </p>
          </div>
        ) : (
          kpis.staffLeaderboard.map((staff, index) => {
            const isTopThree = index < 3
            const rankColor = isTopThree ? rankColors[index] : LUXE_COLORS.bronze

            return (
              <div
                key={staff.staffId}
                className="group relative overflow-hidden rounded-xl p-5 transition-all duration-500 hover:scale-[1.008]"
                style={{
                  background: isTopThree
                    ? `linear-gradient(135deg, ${rankColor}15 0%, ${rankColor}05 100%)`
                    : `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
                  border: `1px solid ${rankColor}40`,
                  boxShadow: isTopThree
                    ? `0 4px 16px ${rankColor}30, 0 0 20px ${rankColor}20`
                    : `0 4px 12px ${LUXE_COLORS.black}40`
                }}
              >
                {/* Glow effect for top 3 */}
                {isTopThree && (
                  <div
                    className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
                    style={{ background: rankColor }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {isTopThree ? (
                      <span
                        className="text-3xl transition-transform duration-300 group-hover:scale-110 inline-block"
                        style={{ filter: `drop-shadow(0 0 4px ${rankColor}30)` }}
                      >
                        {rankIcons[index]}
                      </span>
                    ) : (
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color: LUXE_COLORS.bronze,
                          opacity: 0.6
                        }}
                      >
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Staff Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-bold mb-1 truncate"
                      style={{
                        color: isTopThree ? rankColor : LUXE_COLORS.champagne
                      }}
                    >
                      {staff.staffName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" style={{ color: LUXE_COLORS.gold }} />
                        <span style={{ color: LUXE_COLORS.lightText }}>
                          {staff.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ color: LUXE_COLORS.bronze }}>
                        {staff.servicesCompleted} services
                      </div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-2xl font-bold mb-1 transition-all duration-300 group-hover:scale-102"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${rankColor} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {formatCurrency(staff.revenue)}
                    </p>
                    {/* Utilization bar */}
                    <div
                      className="w-24 h-1.5 rounded-full overflow-hidden mt-2"
                      style={{ backgroundColor: `${rankColor}20` }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(staff.utilizationRate, 100)}%`,
                          backgroundImage: `linear-gradient(90deg, ${rankColor} 0%, ${LUXE_COLORS.gold} 100%)`,
                          boxShadow: `0 0 4px ${rankColor}30`
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                      {staff.utilizationRate.toFixed(0)}% utilized
                    </p>
                  </div>
                </div>

                {/* Decorative corner for top 3 */}
                {isTopThree && (
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 transition-all duration-500 group-hover:scale-120 group-hover:opacity-15"
                    style={{ background: rankColor }}
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
            border: `1px solid ${LUXE_COLORS.emerald}30`
          }}
        >
          <Users className="w-5 h-5 mx-auto mb-2" style={{ color: LUXE_COLORS.emerald }} />
          <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.emerald }}>
            {kpis.todayOnDutyStaff}
          </p>
          <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
            On Duty
          </p>
        </div>

        <div
          className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
            border: `1px solid ${LUXE_COLORS.sapphire}30`
          }}
        >
          <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: LUXE_COLORS.sapphire }} />
          <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.sapphire }}>
            {kpis.activeStaff}
          </p>
          <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
            Active Staff
          </p>
        </div>

        <div
          className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
            border: `1px solid ${LUXE_COLORS.gold}30`
          }}
        >
          <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: LUXE_COLORS.gold }} />
          <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold }}>
            {kpis.totalStaffHoursToday}h
          </p>
          <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
            Total Hours
          </p>
        </div>

        <div
          className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundImage: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoalDark} 100%)`,
            border: `1px solid ${LUXE_COLORS.plum}30`
          }}
        >
          <Star className="w-5 h-5 mx-auto mb-2" style={{ color: LUXE_COLORS.plum }} />
          <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.plum }}>
            {kpis.staffLeaderboard.length > 0
              ? (
                  kpis.staffLeaderboard.reduce((sum, s) => sum + s.averageRating, 0) /
                  kpis.staffLeaderboard.length
                ).toFixed(1)
              : '0.0'}
          </p>
          <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
            Avg Rating
          </p>
        </div>
      </div>
    </div>
  )
}
