'use client'

import React, { useState, useEffect } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useSalonDashboard } from '@/hooks/useSalonDashboard'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLoadingStore } from '@/lib/stores/loading-store'
import { Button } from '@/components/ui/button'
import { ComplianceAlertBanner } from '@/components/salon/ComplianceAlertBanner'
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
  Filter,
  LogOut
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { lazy, Suspense } from 'react'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'

// Fix: Use lazy instead of dynamic to avoid conflicts
const HeroMetrics = lazy(() => import('@/components/salon/dashboard/HeroMetrics').then(mod => ({ default: mod.HeroMetrics })))
const AppointmentAnalytics = lazy(() => import('@/components/salon/dashboard/AppointmentAnalytics').then(mod => ({ default: mod.AppointmentAnalytics })))
const RevenueTrends = lazy(() => import('@/components/salon/dashboard/RevenueTrends').then(mod => ({ default: mod.RevenueTrends })))
const StaffPerformance = lazy(() => import('@/components/salon/dashboard/StaffPerformance').then(mod => ({ default: mod.StaffPerformance })))
const CustomerAndServiceInsights = lazy(() => import('@/components/salon/dashboard/CustomerAndServiceInsights').then(mod => ({ default: mod.CustomerAndServiceInsights })))
const FinancialOverview = lazy(() => import('@/components/salon/dashboard/FinancialOverview').then(mod => ({ default: mod.FinancialOverview })))

// ✅ ENTERPRISE: Filter Context
import {
  DashboardFilterProvider,
  useDashboardFilter,
  TimePeriod,
  getPeriodLabel
} from '@/contexts/DashboardFilterContext'

// ✅ PERFORMANCE: Lazy load dashboard sections with fast skeletons
const FastSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />
      ))}
    </div>
  </div>
)


// ============================================================================
// INNER DASHBOARD COMPONENT (Uses Filter Context)
// ============================================================================

function DashboardContent() {
  const { organizationId, organization, isLoading: orgLoading } = useSecuredSalonContext()
  const {
    role,
    user,
    isLoading: securityLoading,
    isAuthenticated
  } = useSalonSecurity()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateProgress, finishLoading, reset: resetLoading } = useLoadingStore()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadStage, setLoadStage] = useState(1) // Progressive loading stages

  // ✅ REMOVED DUPLICATE: Receptionist redirect now handled in conditional render below (line ~235)
  // This prevents race condition between two redirect mechanisms

  // ✅ GLOBAL LOADING: Continue progress from login (70-100%)
  useEffect(() => {
    const isInitializing = searchParams?.get('initializing') === 'true'
    const isReceptionist = role && role.toLowerCase() === 'receptionist'

    if (isInitializing && isAuthenticated && !orgLoading && !securityLoading) {
      // Continue progress from 70% to 100%
      let currentProgress = 70
      const progressInterval = setInterval(() => {
        currentProgress += 5
        if (currentProgress <= 95) {
          updateProgress(currentProgress, 'Loading dashboard components...', 'Almost ready...')
        } else {
          clearInterval(progressInterval)
          // Finish loading when dashboard is ready
          setTimeout(() => {
            finishLoading()

            // ✅ ENTERPRISE: Redirect receptionist AFTER loading completes
            if (isReceptionist) {
              router.push('/salon/receptionist')
            } else {
              // Remove query parameter for clean URL (non-receptionist roles)
              router.replace('/salon/dashboard', { scroll: false })
            }
          }, 200)
        }
      }, 100)

      return () => clearInterval(progressInterval)
    }
  }, [searchParams, isAuthenticated, orgLoading, securityLoading, role, updateProgress, finishLoading, router])

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

  // Use the enhanced dashboard hook with global period filter
  const {
    kpis,
    isLoading: dashboardLoading,
    refreshAll,
    formatCurrency
  } = useSalonDashboard({
    organizationId: organizationId || '',
    currency: 'AED',
    selectedPeriod: globalPeriod
  })

  // ⚡ PERFORMANCE: No blocking - let progressive loading work
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

  // Logout handler
  const handleLogout = async () => {
    try {
      // ✅ CRITICAL: Reset global loading state before logout
      resetLoading()

      const { supabase } = await import('@/lib/supabase/client')
      await supabase.auth.signOut()
      localStorage.removeItem('salonUserName')
      localStorage.removeItem('salonUserEmail')
      localStorage.removeItem('salonRole')
      router.push('/salon/auth')
    } catch (error) {
      console.error('Logout error:', error)
      resetLoading() // Reset even on error
      router.push('/salon/auth')
    }
  }

  // ⚡ REMOVED BLOCKING LOADER: Page now loads instantly with progressive sections
  // The 5-stage progressive loading system (Lines 81-91, 557-603) now visible immediately!

  // ✅ ENTERPRISE STATE 1: Not authenticated at all
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: LUXE_COLORS.gold }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Authenticating...
          </h3>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Verifying your session
          </p>
        </div>
      </div>
    )
  }

  // ✅ ENTERPRISE STATE 2: Authenticated but role is being resolved
  // CRITICAL FIX: Check ALL loading flags to prevent "Access Restricted" flash
  if (isAuthenticated && (securityLoading || orgLoading || !role)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div className="text-center">
          <div className="relative mb-6">
            {/* Animated glow effect */}
            <div
              className="absolute inset-0 blur-2xl animate-pulse"
              style={{
                background: `radial-gradient(circle, ${LUXE_COLORS.gold}40 0%, transparent 70%)`
              }}
            />
            <Loader2
              className="h-12 w-12 animate-spin mx-auto relative"
              style={{ color: LUXE_COLORS.gold }}
            />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Setting up your workspace...
          </h3>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Loading your permissions and preferences
          </p>
        </div>
      </div>
    )
  }

  // ✅ ENTERPRISE STATE 3: Redirect receptionist with smooth transition
  // BUT: Let global loading complete first if initializing=true
  const isInitializing = searchParams?.get('initializing') === 'true'
  const isReceptionist = role && role.toLowerCase() === 'receptionist'

  if (isReceptionist && !isInitializing) {
    // Only redirect if NOT in initializing mode (loading already completed)
    React.useEffect(() => {
      const timer = setTimeout(() => {
        router.push('/salon/receptionist')
      }, 100) // Small delay prevents race conditions
      return () => clearTimeout(timer)
    }, [router])

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <div className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
            Redirecting to your dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* ⚡ STAGE 1: PREMIUM MOBILE HEADER - Instant load (no blocking) */}
      <PremiumMobileHeader
        title={organization?.entity_name || organization?.name || 'Dashboard'}
        subtitle={isLoading ? 'Loading data...' : `${role ? role.charAt(0).toUpperCase() + role.slice(1) : ''} • ${kpis.totalCustomers || 0} customers`}
        showNotifications={true}
        notificationCount={isLoading ? 0 : (kpis.appointmentsByStatus?.pending || 0)}
        shrinkOnScroll={true}
        rightAction={
          <div className="flex items-center gap-2">
            {/* Refresh Icon */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-200"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}30 0%, ${LUXE_COLORS.emerald}20 100%)`,
                border: `1px solid ${LUXE_COLORS.emerald}40`
              }}
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: LUXE_COLORS.emerald }} />
            </button>

            {/* Logout Icon */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-200"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.ruby}30 0%, ${LUXE_COLORS.ruby}20 100%)`,
                border: `1px solid ${LUXE_COLORS.ruby}40`
              }}
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" style={{ color: LUXE_COLORS.ruby }} />
            </button>
          </div>
        }
      />

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

      {/* Premium Desktop Header - Hidden on Mobile */}
      <div
        className="hidden md:block sticky top-0 z-30 mb-8"
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
                    // ✅ CRITICAL: Reset global loading state before logout
                    resetLoading()

                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    localStorage.removeItem('salonUserName')
                    localStorage.removeItem('salonUserEmail')
                    localStorage.removeItem('salonRole')
                    router.push('/salon/auth')
                  } catch (error) {
                    console.error('Logout error:', error)
                    resetLoading() // Reset even on error
                    router.push('/salon/auth')
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

      {/* ✅ ENTERPRISE: Global Period Filter Bar - Desktop Only */}
      <div
        className="hidden md:block sticky top-[120px] z-20 mb-6"
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

      {/* 📱 MOBILE PERIOD FILTER */}
      <div className="md:hidden px-4 mb-6">
        {/* Mobile Period Filter - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {(['today', 'last7Days', 'last30Days', 'yearToDate', 'allTime'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setGlobalPeriod(period)}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 active:scale-95"
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
                    ? `0 0 16px ${LUXE_COLORS.gold}30`
                    : undefined
              }}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Compliance Alert Banner - 30-Day Expiry Notifications */}
        <ComplianceAlertBanner organizationId={organizationId} />

        {/* Stage 1: Hero Metrics - Load immediately */}
        {loadStage >= 1 && (
          <div className="animate-fadeInUp">
            <Suspense fallback={<FastSkeleton />}>
              <HeroMetrics kpis={kpis} formatCurrency={formatCurrency} selectedPeriod={globalPeriod} />
            </Suspense>
          </div>
        )}

        {/* Stage 2: Appointment Analytics - Load after 300ms */}
        {loadStage >= 2 && (
          <div className="animate-fadeInUp">
            <Suspense fallback={<div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />}>
              <AppointmentAnalytics kpis={kpis} selectedPeriod={globalPeriod} />
            </Suspense>
          </div>
        )}

        {/* Stage 3: Revenue Trends - Load after 600ms */}
        {loadStage >= 3 && (
          <div className="animate-fadeInUp">
            <Suspense fallback={<div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />}>
              <RevenueTrends kpis={kpis} formatCurrency={formatCurrency} selectedPeriod={globalPeriod} />
            </Suspense>
          </div>
        )}

        {/* Stage 4: Staff Performance - Load after 900ms */}
        {loadStage >= 4 && (
          <div className="animate-fadeInUp">
            <Suspense fallback={<div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />}>
              <StaffPerformance kpis={kpis} formatCurrency={formatCurrency} selectedPeriod={globalPeriod} />
            </Suspense>
          </div>
        )}

        {/* Stage 5: Additional Insights - Load after 1200ms */}
        {loadStage >= 5 && (
          <div className="space-y-8 animate-fadeInUp">
            <Suspense fallback={<div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />}>
              <CustomerAndServiceInsights kpis={kpis} formatCurrency={formatCurrency} selectedPeriod={globalPeriod} />
            </Suspense>
            <Suspense fallback={<div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />}>
              <FinancialOverview kpis={kpis} formatCurrency={formatCurrency} selectedPeriod={globalPeriod} />
            </Suspense>
          </div>
        )}

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

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-24 md:h-0" />
      </div>

      {/* Global animations */}
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
    <DashboardFilterProvider defaultPeriod="last30Days">
      <DashboardContent />
    </DashboardFilterProvider>
  )
}
