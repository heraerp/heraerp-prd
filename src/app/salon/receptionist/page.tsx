/**
 * Receptionist Dashboard
 * Simplified dashboard for front-desk staff
 *
 * ✅ UPGRADED: Mobile-first responsive design
 * ✅ UPGRADED: Uses useReceptionistDashboard hook (RPC API v2)
 * ✅ UPGRADED: SalonLuxePage wrapper for consistent layout
 * ✅ UPGRADED: SalonLuxeKPICard components for stats
 * ✅ UPGRADED: PremiumMobileHeader with iOS-style design
 * ⚡ UPGRADED: 5-stage progressive lazy loading (Services page pattern)
 * ✅ UPGRADED: Touch-friendly interactions (44px minimum targets)
 * ⚡ PERFORMANCE: Instant page load with progressive content display
 */
'use client'

import React, { useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  UserPlus,
  Sparkles,
  RefreshCw,
  Settings,
  Loader2,
  LogOut,
  Bell
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useReceptionistDashboard } from '@/hooks/useReceptionistDashboard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'

// ⚡ PROGRESSIVE LAZY LOADING: Split page into 5 stages for instant load (Services page pattern)
// Stage 1: Header & Welcome Card (instant - inline below)
// Stage 2: Quick Actions (lazy - first interaction priority)
const QuickActionsSection = lazy(() => Promise.resolve({
  default: ({ router }: { router: any }) => {
    const quickActions = [
      { icon: UserPlus, label: 'New Appointment', href: '/salon/appointments/new', color: LUXE_COLORS.gold },
      { icon: Calendar, label: 'View Calendar', href: '/salon/appointments/calendar', color: LUXE_COLORS.emerald },
      { icon: Users, label: 'Add Customer', href: '/salon/customers', color: LUXE_COLORS.bronze }
    ]

    return (
      <div className="mb-8 animate-in fade-in duration-300">
        <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: LUXE_COLORS.champagne }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="min-h-[120px] md:min-h-[auto] p-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${action.color}20 0%, ${action.color}10 100%)`,
                border: `1px solid ${action.color}40`
              }}
            >
              <action.icon className="w-8 h-8 mx-auto mb-3" style={{ color: action.color }} />
              <p className="text-sm font-medium text-center" style={{ color: LUXE_COLORS.champagne }}>{action.label}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }
}))

// Stage 3: Stats Overview (lazy - secondary priority) - Using SalonLuxeKPICard
const StatsOverviewSection = lazy(() => Promise.resolve({
  default: ({ kpis }: { kpis: any }) => {
    return (
      <div className="mb-8 animate-in fade-in duration-300">
        <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: LUXE_COLORS.champagne }}>Today's Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <SalonLuxeKPICard
            title="Today's Appointments"
            value={kpis.todayAppointments || 0}
            icon={Calendar}
            color={LUXE_COLORS.gold}
            description="Scheduled today"
            animationDelay={0}
          />
          <SalonLuxeKPICard
            title="Completed"
            value={kpis.appointmentsByStatus.completed || 0}
            icon={CheckCircle}
            color={LUXE_COLORS.emerald}
            description="Finished today"
            animationDelay={100}
          />
          <SalonLuxeKPICard
            title="Pending"
            value={kpis.appointmentsByStatus.pending + kpis.appointmentsByStatus.in_progress || 0}
            icon={Clock}
            color={LUXE_COLORS.bronze}
            description="Awaiting service"
            animationDelay={200}
          />
          <SalonLuxeKPICard
            title="In Progress"
            value={kpis.appointmentsByStatus.in_progress || 0}
            icon={Users}
            color={LUXE_COLORS.plum}
            description="Currently servicing"
            animationDelay={300}
          />
        </div>
      </div>
    )
  }
}))

// Stage 4: Appointments List (lazy - heavy data section)
const AppointmentsListSection = lazy(() => Promise.resolve({
  default: ({ appointments, router }: { appointments: any[], router: any }) => {
    // Get today's appointments for display
    const todayAppointments = (appointments || [])
      .filter(apt => {
        const aptDate = new Date(apt.transaction_date || apt.created_at)
        const today = new Date()
        return aptDate.toDateString() === today.toDateString()
      })
      .slice(0, 5) // Show first 5

    const getStatusColor = (status: string) => {
      const s = status.toLowerCase()
      if (s === 'completed') return { bg: `${LUXE_COLORS.emerald}30`, text: LUXE_COLORS.emerald, label: 'Completed' }
      if (s === 'in_progress' || s === 'in_service') return { bg: `${LUXE_COLORS.plum}30`, text: LUXE_COLORS.plum, label: 'In Service' }
      if (s === 'checked_in') return { bg: `${LUXE_COLORS.gold}30`, text: LUXE_COLORS.gold, label: 'Checked In' }
      if (s === 'booked' || s === 'confirmed') return { bg: `${LUXE_COLORS.emerald}30`, text: LUXE_COLORS.emerald, label: 'Confirmed' }
      if (s === 'cancelled') return { bg: `${LUXE_COLORS.ruby}30`, text: LUXE_COLORS.ruby, label: 'Cancelled' }
      if (s === 'no_show') return { bg: `${LUXE_COLORS.bronze}30`, text: LUXE_COLORS.bronze, label: 'No Show' }
      return { bg: `${LUXE_COLORS.bronze}30`, text: LUXE_COLORS.bronze, label: 'Pending' }
    }

    return (
      <Card className="border-0 animate-in fade-in duration-300" style={{ background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`, border: `1px solid ${LUXE_COLORS.gold}20` }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: LUXE_COLORS.champagne }}>
            <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Today's Appointments ({todayAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt, index) => {
                const aptTime = apt.transaction_date
                  ? new Date(apt.transaction_date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  : 'Time TBD'

                const customerName = apt.metadata?.customer_name || 'Walk-in Customer'
                const serviceNames = apt.metadata?.service_names || apt.metadata?.services || 'Service details pending'
                const status = apt.transaction_status || apt.metadata?.status || 'pending'
                const statusDisplay = getStatusColor(status)

                return (
                  <div key={apt.id || index} className="p-4 rounded-lg animate-in fade-in slide-in-from-left-2" style={{ background: `${LUXE_COLORS.charcoalDark}80`, border: `1px solid ${LUXE_COLORS.bronze}20`, animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="font-semibold text-sm md:text-base" style={{ color: LUXE_COLORS.champagne }}>
                        {aptTime} - {customerName}
                      </p>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: statusDisplay.bg, color: statusDisplay.text }}
                      >
                        {statusDisplay.label}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm mb-2" style={{ color: LUXE_COLORS.bronze }}>
                      {serviceNames}
                    </p>
                    {status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'cancelled' && (
                      <Button
                        size="sm"
                        className="w-full min-h-[44px] active:scale-95 transition-transform"
                        onClick={() => router.push(`/salon/appointments/${apt.id}`)}
                        style={{ background: LUXE_COLORS.gold, color: LUXE_COLORS.charcoal }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                )
              })
            ) : (
              <div
                className="p-8 rounded-lg text-center"
                style={{ background: `${LUXE_COLORS.charcoalDark}80`, border: `1px solid ${LUXE_COLORS.bronze}20` }}
              >
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: LUXE_COLORS.bronze }} />
                <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  No appointments scheduled for today
                </p>
                <Button
                  size="sm"
                  className="mt-4 min-h-[44px] active:scale-95 transition-transform"
                  onClick={() => router.push('/salon/appointments/new')}
                  style={{ background: LUXE_COLORS.gold, color: LUXE_COLORS.charcoal }}
                >
                  Book New Appointment
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 min-h-[44px] active:scale-95 transition-transform"
            onClick={() => router.push('/salon/appointments')}
            style={{ borderColor: LUXE_COLORS.gold, color: LUXE_COLORS.gold }}
          >
            View All Appointments
          </Button>
        </CardContent>
      </Card>
    )
  }
}))

// ⚡ PERFORMANCE: Section-specific skeleton loaders
const QuickActionsSkeleton = () => (
  <div className="mb-8 animate-pulse">
    <div className="h-6 w-32 rounded mb-4" style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}>
          <div className="p-6 flex flex-col items-center justify-center h-full space-y-3">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: `${LUXE_COLORS.gold}20` }} />
            <div className="h-4 w-24 rounded" style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const StatsOverviewSkeleton = () => (
  <div className="mb-8 animate-pulse">
    <div className="h-6 w-40 rounded mb-4" style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg p-4" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: `${LUXE_COLORS.gold}20` }} />
            <div className="h-8 w-12 rounded" style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />
          </div>
          <div className="h-4 w-24 rounded" style={{ backgroundColor: `${LUXE_COLORS.bronze}20` }} />
        </div>
      ))}
    </div>
  </div>
)

const AppointmentsSkeleton = () => (
  <div className="rounded-lg p-6 animate-pulse" style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}>
    <div className="flex items-center gap-2 mb-6">
      <div className="w-5 h-5 rounded" style={{ backgroundColor: `${LUXE_COLORS.gold}20` }} />
      <div className="h-5 w-48 rounded" style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: `${LUXE_COLORS.charcoalDark}80` }}>
          <div className="p-4 space-y-2">
            <div className="h-4 w-48 rounded" style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }} />
            <div className="h-3 w-32 rounded" style={{ backgroundColor: `${LUXE_COLORS.bronze}20` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function ReceptionistDashboard() {
  const router = useRouter()
  const { organization, organizationId } = useSecuredSalonContext()
  const { user, role } = useSalonSecurity()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Redirect owner to their own dashboard
  React.useEffect(() => {
    if (role && role.toLowerCase() === 'owner') {
      router.push('/salon/dashboard')
    }
  }, [role, router])

  // ✅ UPGRADED: Use new RPC-based hook
  const {
    kpis,
    isLoading: dashboardLoading,
    refreshAll,
    appointments
  } = useReceptionistDashboard({
    organizationId: organizationId || '',
    currency: 'AED'
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAll()
    } finally {
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  // Logout handler
  const handleLogout = async () => {
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
  }

  // ⚡ PERFORMANCE: Show loading if redirecting owner (only blocking case)
  if (role && role.toLowerCase() === 'owner') {
    return (
      <SalonLuxePage>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
              Redirecting to Owner Dashboard...
            </div>
          </div>
        </div>
      </SalonLuxePage>
    )
  }

  // ⚡ REMOVED BLOCKING LOADER: Page now loads instantly with progressive sections
  // Data is fetched in background while UI renders progressively

  return (
    <SalonLuxePage
      title="Reception Desk"
      description="Front desk operations and appointment management"
      maxWidth="full"
      padding="lg"
      showAnimatedBackground={true}
      actions={
        <div className="flex items-center gap-3">
          {/* Refresh Button - Desktop */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
              border: `1px solid ${LUXE_COLORS.emerald}30`,
              color: LUXE_COLORS.champagne,
              boxShadow: isRefreshing ? `0 0 20px ${LUXE_COLORS.emerald}40` : undefined
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Logout Button - Desktop */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.ruby}20 0%, ${LUXE_COLORS.ruby}10 100%)`,
              border: `1px solid ${LUXE_COLORS.ruby}40`,
              color: LUXE_COLORS.ruby
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      }
    >
      {/* ⚡ STAGE 1: PREMIUM MOBILE HEADER - Instant load (no blocking) */}
      <PremiumMobileHeader
        title="Reception Desk"
        subtitle={dashboardLoading ? 'Loading...' : `${kpis.todayAppointments} appointments today`}
        showNotifications={true}
        notificationCount={dashboardLoading ? 0 : (kpis.appointmentsByStatus?.pending || 0)}
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

      {/* Main Content Container */}
      <div className="p-4 md:p-6 lg:p-8">
        {/* ⚡ STAGE 1: Welcome Card - Instant load (no lazy) */}
        {!dashboardLoading && (
          <div className="md:hidden bg-gradient-to-br from-gold/20 to-champagne/10 rounded-2xl p-6 mb-6 animate-in fade-in duration-300" style={{ borderColor: `${LUXE_COLORS.gold}40` }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: LUXE_COLORS.champagne }}>Welcome Back!</h2>
            <p style={{ color: LUXE_COLORS.bronze }}>You have {kpis.todayAppointments} appointments today</p>
          </div>
        )}

        {/* ⚡ STAGE 2: Quick Actions - Lazy loaded with Suspense */}
        <Suspense fallback={<QuickActionsSkeleton />}>
          {!dashboardLoading && <QuickActionsSection router={router} />}
        </Suspense>

        {/* ⚡ STAGE 3: Stats Overview - Lazy loaded with Suspense */}
        <Suspense fallback={<StatsOverviewSkeleton />}>
          {!dashboardLoading && <StatsOverviewSection kpis={kpis} />}
        </Suspense>

        {/* ⚡ STAGE 4: Appointments List - Lazy loaded with Suspense (heaviest section) */}
        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
            <span className="ml-3" style={{ color: LUXE_COLORS.bronze }}>Loading appointments...</span>
          </div>
        ) : (
          <Suspense fallback={<AppointmentsSkeleton />}>
            <AppointmentsListSection appointments={appointments || []} router={router} />
          </Suspense>
        )}

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-24 md:h-0" />
      </div>
    </SalonLuxePage>
  )
}
