'use client'

import React, { useState, useEffect } from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Users,
  Scissors,
  RefreshCw,
  Settings,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LUXE_COLORS } from '@/lib/constants/salon'

// ✅ ENTERPRISE: Filter Context
import {
  DashboardFilterProvider,
  useDashboardFilter,
  TimePeriod,
  getPeriodLabel
} from '@/contexts/DashboardFilterContext'

// ✅ PERFORMANCE: Simple loading skeleton for enterprise dashboard
const FastSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-gray-700" />
      ))}
    </div>
  </div>
)


// ============================================================================
// INNER DASHBOARD COMPONENT (Uses Filter Context)
// ============================================================================

function DashboardContent() {
  const { user, isLoading: authLoading } = useHERAAuth()
  const { hasPermission } = useAccessControl({ userId: user?.id || 'anonymous' })
  
  // Mock salon data for enterprise integration
  const organizationId = user?.id || 'demo-org'
  const organization = { 
    entity_name: 'Enterprise Salon', 
    name: 'Enterprise Salon',
    id: organizationId 
  }
  const role = 'owner' // Default to owner for enterprise users
  const isAuthenticated = !!user
  const orgLoading = authLoading
  const securityLoading = authLoading
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadStage, setLoadStage] = useState(1) // Progressive loading stages

  // ✅ ROLE-BASED REDIRECT: Redirect receptionist to their dashboard
  useEffect(() => {
    if (role && role.toLowerCase() === 'receptionist') {
      router.push('/salon/receptionist')
    }
  }, [role, router])

  // ✅ PERFORMANCE: Progressive component loading
  useEffect(() => {
    if (isAuthenticated && !orgLoading && !securityLoading) {
      // Load components progressively for better perceived performance
      const stages = [2, 3, 4, 5]
      stages.forEach((stage, index) => {
        setTimeout(() => {
          setLoadStage(stage)
        }, index * 300) // Load each stage 300ms apart
      })
    }
  }, [isAuthenticated, orgLoading, securityLoading])

  // ✅ ENTERPRISE: Use Filter Context
  const {
    globalPeriod,
    setGlobalPeriod,
    getOverrideCount,
    clearAllOverrides
  } = useDashboardFilter()

  // Mock salon dashboard data for enterprise integration
  const kpis = {
    todayRevenue: 8450,
    todayAppointments: 24,
    monthlyRevenue: 125000,
    customerSatisfaction: 4.8
  }
  const dashboardLoading = false
  const refreshAll = async () => {}
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`

  const isLoading = orgLoading || securityLoading || dashboardLoading

  // Refresh all data with animation
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAll()
      setLastRefresh(new Date())
    } finally {
      // Keep spinning for smooth UX
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <div className="text-center">
          <div className="relative inline-block">
            <Loader2
              className="h-12 w-12 animate-spin"
              style={{ color: LUXE_COLORS.gold }}
            />
            <div
              className="absolute inset-0 blur-xl opacity-50"
              style={{ background: LUXE_COLORS.gold }}
            />
          </div>
          <p className="mt-4 text-lg font-medium" style={{ color: LUXE_COLORS.bronze }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Auth check
  if (!isAuthenticated || !role) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Card
          className="max-w-md w-full border-0"
          style={{ backgroundColor: LUXE_COLORS.charcoalLight }}
        >
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
            <h3 className="text-xl mb-2" style={{ color: LUXE_COLORS.gold }}>
              Authentication Required
            </h3>
            <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
              {!isAuthenticated
                ? 'Please log in to access the dashboard.'
                : 'No role assigned. Please contact your administrator.'}
            </p>
            <Button
              onClick={() => router.push('/salon-access')}
              className="w-full"
              style={{
                backgroundColor: LUXE_COLORS.gold,
                color: LUXE_COLORS.charcoal
              }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading while redirecting receptionist
  if (role && role.toLowerCase() === 'receptionist') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <div className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
            Redirecting to Receptionist Dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Elegant gradient background overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, ${LUXE_COLORS.gold}06 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, ${LUXE_COLORS.plum}04 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, ${LUXE_COLORS.emerald}03 0%, transparent 50%)
          `,
          opacity: 0.4
        }}
      />

      {/* Premium Header */}
      <div
        className="sticky top-0 z-30 mb-8"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px ${LUXE_COLORS.gold}10`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Organization Icon */}
              <div
                className="p-4 rounded-xl transition-all duration-500 hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}15 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}40`,
                  boxShadow: `0 0 20px ${LUXE_COLORS.gold}20`
                }}
              >
                <Scissors className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
              </div>

              {/* Title and subtitle */}
              <div>
                <h1
                  className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {organization?.entity_name || organization?.name || 'Salon Dashboard'}
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ color: LUXE_COLORS.gold }} />
                </h1>
                <p
                  className="text-sm flex items-center gap-2"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  <span className="font-medium">
                    {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Dashboard
                  </span>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {/* User Info Card */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}CC 0%, ${LUXE_COLORS.charcoal}CC 100%)`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <Users className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: LUXE_COLORS.champagne }}>
                    {user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      localStorage.getItem('salonUserName') ||
                      'Demo User'}
                  </div>
                  <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    {user?.email || localStorage.getItem('salonUserEmail') || 'demo@hairtalkz.com'}
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.emerald}30`,
                  color: LUXE_COLORS.champagne,
                  boxShadow: isRefreshing ? `0 0 20px ${LUXE_COLORS.emerald}40` : undefined
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Logout Button */}
              <Button
                onClick={async () => {
                  try {
                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    localStorage.removeItem('salonUserName')
                    localStorage.removeItem('salonUserEmail')
                    localStorage.removeItem('salonRole')
                    router.push('/salon-access')
                  } catch (error) {
                    console.error('Logout error:', error)
                    router.push('/salon-access')
                  }
                }}
                variant="outline"
                className="px-4 py-2.5 font-medium transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.ruby}20 0%, ${LUXE_COLORS.ruby}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.ruby}40`,
                  color: LUXE_COLORS.ruby,
                  boxShadow: `0 0 0 1px ${LUXE_COLORS.ruby}20`
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ENTERPRISE: Global Period Filter Bar */}
      <div
        className="sticky top-[120px] z-20 mb-6"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}F0 0%, ${LUXE_COLORS.charcoal}F0 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}15`,
          boxShadow: `0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px ${LUXE_COLORS.gold}08`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between gap-4">
            {/* Left: Filter Label */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}30`
                }}
              >
                <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                    Global Time Period Filter
                  </h3>
                  {getOverrideCount() > 0 && (
                    <div
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: `${LUXE_COLORS.gold}30`,
                        border: `1px solid ${LUXE_COLORS.gold}50`,
                        color: LUXE_COLORS.gold
                      }}
                    >
                      {getOverrideCount()} Override{getOverrideCount() !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  {getOverrideCount() > 0
                    ? 'Some sections have custom filters'
                    : 'Applies to all dashboard sections'}
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Clear All Overrides Button */}
              {getOverrideCount() > 0 && (
                <button
                  onClick={clearAllOverrides}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    background: `${LUXE_COLORS.ruby}20`,
                    border: `1px solid ${LUXE_COLORS.ruby}40`,
                    color: LUXE_COLORS.ruby
                  }}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Clear All Custom Filters
                </button>
              )}

              {/* Period Selector Buttons */}
              <div className="flex gap-2 flex-wrap">
                {(['today', 'last7Days', 'last30Days', 'yearToDate', 'allTime'] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setGlobalPeriod(period)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 relative"
                    style={{
                      background:
                        globalPeriod === period
                          ? `linear-gradient(135deg, ${LUXE_COLORS.gold}50 0%, ${LUXE_COLORS.gold}30 100%)`
                          : `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}60 0%, ${LUXE_COLORS.charcoal}60 100%)`,
                      border:
                        globalPeriod === period
                          ? `1px solid ${LUXE_COLORS.gold}80`
                          : `1px solid ${LUXE_COLORS.bronze}20`,
                      color: globalPeriod === period ? LUXE_COLORS.champagne : LUXE_COLORS.bronze,
                      boxShadow:
                        globalPeriod === period
                          ? `0 0 24px ${LUXE_COLORS.gold}40, inset 0 1px 2px ${LUXE_COLORS.gold}30`
                          : undefined
                    }}
                  >
                    {getPeriodLabel(period)}
                    {globalPeriod === period && (
                      <TrendingUp
                        className="w-3 h-3 absolute -top-1 -right-1"
                        style={{ color: LUXE_COLORS.gold }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Compliance Alert Banner - Disabled for enterprise integration */}
        {/* <ComplianceAlertBanner organizationId={organizationId} /> */}

        {/* Stage 1: Hero Metrics - Enterprise mock dashboard */}
        {loadStage >= 1 && (
          <div className="animate-fadeInUp">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Today's Revenue</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(kpis.todayRevenue)}</p>
                <p className="text-sm text-green-500">+15.2% from yesterday</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Appointments</h3>
                <p className="text-2xl font-bold text-white">{kpis.todayAppointments}</p>
                <p className="text-sm text-blue-500">12 completed, 8 pending</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Monthly Revenue</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(kpis.monthlyRevenue)}</p>
                <p className="text-sm text-green-500">68% of target</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Satisfaction</h3>
                <p className="text-2xl font-bold text-white">{kpis.customerSatisfaction}/5</p>
                <p className="text-sm text-green-500">Excellent rating</p>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Dashboard Placeholder */}
        <div className="animate-fadeInUp">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Enterprise Salon Dashboard</h3>
            <p className="text-gray-400 mb-6">
              This is the enterprise-integrated salon dashboard. Full salon features will be available once authentication is properly configured.
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                View Appointments
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                Manage Staff
              </Button>
            </div>
          </div>
        </div>

        {/* Loading progress indicator */}
        {loadStage < 5 && (
          <div className="text-center py-8">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ 
                background: `${LUXE_COLORS.gold}10`, 
                border: `1px solid ${LUXE_COLORS.gold}20` 
              }}
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: LUXE_COLORS.gold }} />
              <span className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                Loading dashboard components... ({loadStage}/5)
              </span>
            </div>
          </div>
        )}

        {/* Footer Spacer */}
        <div className="h-8" />
      </div>

      {/* Global animations */}
      <style jsx>{`
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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// PROVIDER WRAPPER (Main Export)
// ============================================================================

/**
 * Main Dashboard Export with Filter Context Provider
 * Wraps the entire dashboard with DashboardFilterProvider for
 * enterprise-grade filter management
 */
export default function SalonDashboard() {
  return (
    <ProtectedPage requiredSpace="salon" requiredPermissions={["salon.appointments"]}>
      <DashboardFilterProvider defaultPeriod="allTime">
        <DashboardContent />
      </DashboardFilterProvider>
    </ProtectedPage>
  )
}
