'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useReportsMetadata } from '@/hooks/useReportsMetadata'
import { useReportsStats } from '@/hooks/useReportsStats'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Clock,
  CalendarDays,
  Sparkles,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { LUXE_COLORS } from '@/lib/constants/salon'

// ============================================================================
// LAZY LOADED COMPONENTS - PERFORMANCE OPTIMIZATION
// ============================================================================

const ReportCardSkeleton = () => (
  <div className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }} />
)

const FastSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />
      ))}
    </div>
  </div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReportsPage() {
  const router = useRouter()
  const { organizationId, salonRole, isLoading: orgLoading } = useSecuredSalonContext()
  const { isAuthenticated, role: userRole, isLoading: securityLoading } = useSalonSecurity()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'financial' | 'operational' | 'analytics'>('all')
  const [loadStage, setLoadStage] = useState(1) // Progressive loading stages

  // 🎯 Custom Hooks - Use salonRole (owner/receptionist) not system role (user)
  const currentRole = (salonRole || userRole)?.toUpperCase()

  // ✅ PERFORMANCE: Progressive component loading
  useEffect(() => {
    if (isAuthenticated && !orgLoading && !securityLoading) {
      // Load components progressively for better perceived performance
      const stages = [2, 3]
      stages.forEach((stage, index) => {
        setTimeout(() => {
          setLoadStage(stage)
        }, index * 200) // Load each stage 200ms apart
      })
    }
  }, [isAuthenticated, orgLoading, securityLoading])

  const {
    featuredReports,
    filteredReports,
    categories,
    countByCategory
  } = useReportsMetadata({
    userRole: currentRole,
    selectedCategory
  })

  const { stats, isLoading: statsLoading, refetch: refetchStats } = useReportsStats({
    organizationId: organizationId || undefined
  })

  // ============================================================================
  // AUTH CHECKS
  // ============================================================================

  if (!isAuthenticated || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <Alert className="border-red-200 bg-red-50 max-w-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {!isAuthenticated
              ? 'Please log in to access reports.'
              : 'No role assigned. Please contact your administrator.'}
            <button
              onClick={() => router.push('/salon/auth')}
              className="ml-2 underline hover:no-underline"
            >
              Go to Login
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: LUXE_COLORS.lightText, opacity: 0.7 }}>Setting up reports.</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // STATS CONFIGURATION
  // ============================================================================

  const statsConfig = [
    {
      title: 'Total Revenue',
      value: `AED ${stats.totalRevenue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: 'This month',
      icon: DollarSign,
      color: LUXE_COLORS.emerald
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      desc: 'Active',
      icon: Users,
      color: LUXE_COLORS.gold
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      desc: 'This month',
      icon: Calendar,
      color: LUXE_COLORS.bronze
    },
    {
      title: 'Avg Ticket',
      value: `AED ${stats.averageTicket.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: 'Per visit',
      icon: TrendingUp,
      color: LUXE_COLORS.champagne
    }
  ]

  const regularReports = filteredReports.filter(r => !r.featured)

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SalonLuxePage
      title="Reports & Analytics"
      description="Comprehensive insights into your salon performance"
      maxWidth="full"
      padding="lg"
    >
      {/* ========================================================================
          MOBILE HEADER (iOS-Style)
      ======================================================================== */}

      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      <PremiumMobileHeader
        title="Reports"
        subtitle="Analytics & Insights"
        showNotifications={false}
      />

      {/* ========================================================================
          DESKTOP BREADCRUMB
      ======================================================================== */}

      <div className="hidden md:flex items-center gap-2 text-sm mb-6">
        <span style={{ color: LUXE_COLORS.bronze }}>HERA</span>
        <ChevronRight className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
        <span style={{ color: LUXE_COLORS.bronze }}>SALON OS</span>
        <ChevronRight className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
        <span style={{ color: LUXE_COLORS.champagne }}>Reports</span>
      </div>

      {/* ========================================================================
          QUICK STATS - SALONLUXEKPICARD (STAGE 1)
      ======================================================================== */}

      {loadStage >= 1 && (
        <div className="animate-fadeInUp">
          <Suspense fallback={<FastSkeleton />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 px-4 md:px-0">
              {statsConfig.map((stat, index) => (
                <SalonLuxeKPICard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  description={stat.desc}
                  animationDelay={index * 100}
                />
              ))}
            </div>
          </Suspense>
        </div>
      )}

      {/* ========================================================================
          FEATURED SALES REPORTS (STAGE 2)
      ======================================================================== */}

      {loadStage >= 2 && featuredReports.length > 0 && (
        <div className="mb-8 px-4 md:px-0 animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                Sales Reports
              </h2>
            </div>
            <Badge
              style={{
                backgroundColor: `${LUXE_COLORS.emerald}20`,
                color: LUXE_COLORS.emerald,
                border: `1px solid ${LUXE_COLORS.emerald}40`
              }}
            >
              GL-Powered
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {featuredReports.map(report => (
              <Link
                key={report.id}
                href={report.href || '#'}
                className="block group"
              >
                <Card
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `2px solid ${LUXE_COLORS.gold}30`,
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer'
                  }}
                  className="h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-95"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${report.color}20 0%, ${report.color}08 100%)`,
                          border: `1px solid ${report.color}40`,
                          boxShadow: `0 8px 24px ${report.color}20`
                        }}
                      >
                        <report.icon className="h-6 w-6 md:h-8 md:w-8" style={{ color: report.color }} />
                      </div>
                      <ArrowRight
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        style={{ color: LUXE_COLORS.gold }}
                      />
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                      {report.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4" style={{ color: LUXE_COLORS.bronze }}>
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {report.id === 'daily-sales' && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: LUXE_COLORS.emerald }}>
                          <Clock className="w-4 h-4" />
                          <span>Hourly Breakdown</span>
                        </div>
                      )}
                      {report.id === 'monthly-sales' && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: LUXE_COLORS.gold }}>
                          <CalendarDays className="w-4 h-4" />
                          <span>Daily Trends</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================
          CATEGORY FILTER (MOBILE HORIZONTAL SCROLL)
      ======================================================================== */}

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6 px-4 md:px-0">
        <span className="text-sm md:text-base font-medium" style={{ color: LUXE_COLORS.bronze }}>
          Filter by category:
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as any)}
              className="flex-shrink-0 min-h-[44px] px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 active:scale-95"
              style={{
                backgroundColor: selectedCategory === category ? LUXE_COLORS.gold : 'transparent',
                borderColor: LUXE_COLORS.gold,
                border: `1px solid ${LUXE_COLORS.gold}${selectedCategory === category ? '80' : '30'}`,
                color: selectedCategory === category ? LUXE_COLORS.black : LUXE_COLORS.champagne,
                boxShadow: selectedCategory === category ? `0 0 16px ${LUXE_COLORS.gold}30` : undefined
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {countByCategory[category] > 0 && (
                <span className="ml-2 opacity-75">({countByCategory[category]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================
          OTHER REPORTS GRID (STAGE 3)
      ======================================================================== */}

      {loadStage >= 3 && regularReports.length > 0 && (
        <div className="px-4 md:px-0 animate-fadeInUp">
          <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: LUXE_COLORS.champagne }}>
            All Reports
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Suspense fallback={<ReportCardSkeleton />}>
              {regularReports.map(report => (
                <Link
                  key={report.id}
                  href={report.href || '#'}
                  className="block transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <Card
                    style={{
                      backgroundColor: LUXE_COLORS.charcoalLight,
                      border: `1px solid ${LUXE_COLORS.gold}20`,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                      cursor: report.href ? 'pointer' : 'not-allowed',
                      opacity: report.href ? 1 : 0.7
                    }}
                    className="h-full min-h-[160px]"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <report.icon className="h-6 w-6 md:h-8 md:w-8" style={{ color: report.color }} />
                        {!report.href && (
                          <Badge
                            style={{
                              backgroundColor: `${LUXE_COLORS.bronze}20`,
                              color: LUXE_COLORS.bronze,
                              border: `1px solid ${LUXE_COLORS.bronze}40`
                            }}
                          >
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base md:text-lg mt-3" style={{ color: LUXE_COLORS.champagne }}>
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                        {report.description}
                      </p>
                      <div className="mt-3">
                        <Badge
                          style={{
                            backgroundColor: `${report.color}20`,
                            color: report.color,
                            border: `1px solid ${report.color}40`
                          }}
                        >
                          {report.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </Suspense>
          </div>
        </div>
      )}

      {/* ========================================================================
          EMPTY STATE
      ======================================================================== */}

      {filteredReports.length === 0 && (
        <div className="text-center py-12 px-4">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.bronze }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            No reports available
          </h3>
          <p style={{ color: LUXE_COLORS.bronze }}>
            You don't have access to any reports in this category.
          </p>
        </div>
      )}

      {/* ========================================================================
          MOBILE BOTTOM SPACING
      ======================================================================== */}

      <div className="h-24 md:h-0" />

      {/* ========================================================================
          STYLES
      ======================================================================== */}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </SalonLuxePage>
  )
}
