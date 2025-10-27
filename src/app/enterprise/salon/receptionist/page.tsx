'use client'
// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";


/**
 * Receptionist Dashboard
 * Simplified dashboard for front-desk staff
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  CreditCard,
  Search,
  UserPlus,
  Scissors,
  Sparkles,
  RefreshCw,
  Settings
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useSalonDashboard } from '@/hooks/useSalonDashboard'
import { Loader2 } from 'lucide-react'

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

  // Fetch real data from Supabase
  const {
    kpis,
    isLoading: dashboardLoading,
    refreshAll,
    appointments
  } = useSalonDashboard({
    organizationId: organizationId || '',
    currency: 'AED',
    selectedPeriod: 'today'
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAll()
    } finally {
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  // Show loading if redirecting owner
  if (role && role.toLowerCase() === 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
            Redirecting to Owner Dashboard...
          </div>
        </div>
      </div>
    )
  }

  // Show loading while fetching data
  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <div className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    )
  }

  const quickActions = [
    { icon: UserPlus, label: 'New Appointment', href: '/salon/appointments/new', color: LUXE_COLORS.gold },
    { icon: Calendar, label: 'View Calendar', href: '/salon/appointments/calendar', color: LUXE_COLORS.emerald },
    { icon: CreditCard, label: 'New Sale', href: '/salon/pos', color: LUXE_COLORS.plum },
    { icon: Users, label: 'Add Customer', href: '/salon/customers', color: LUXE_COLORS.bronze }
  ]

  const stats = [
    {
      label: "Today's Appointments",
      value: String(kpis.todayAppointments || 0),
      icon: Calendar,
      color: LUXE_COLORS.gold
    },
    {
      label: 'Completed',
      value: String(kpis.appointmentsByStatus.completed || 0),
      icon: CheckCircle,
      color: LUXE_COLORS.emerald
    },
    {
      label: 'Pending',
      value: String(kpis.appointmentsByStatus.pending + kpis.appointmentsByStatus.in_progress || 0),
      icon: Clock,
      color: LUXE_COLORS.bronze
    },
    {
      label: 'In Progress',
      value: String(kpis.appointmentsByStatus.in_progress || 0),
      icon: Users,
      color: LUXE_COLORS.plum
    }
  ]

  // Get today's appointments for display
  const todayAppointments = (appointments || [])
    .filter(apt => {
      const aptDate = new Date(apt.transaction_date || apt.created_at)
      const today = new Date()
      return aptDate.toDateString() === today.toDateString()
    })
    .slice(0, 5) // Show first 5

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
                  Receptionist Dashboard
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ color: LUXE_COLORS.gold }} />
                </h1>
                <p
                  className="text-sm flex items-center gap-2"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  <span className="font-medium">Front Desk Operations</span>
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

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: LUXE_COLORS.champagne }}>Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button key={index} onClick={() => router.push(action.href)} className="p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ background: `linear-gradient(135deg, ${action.color}20 0%, ${action.color}10 100%)`, border: `1px solid ${action.color}40` }}>
                <action.icon className="w-8 h-8 mx-auto mb-3" style={{ color: action.color }} />
                <p className="text-sm font-medium text-center" style={{ color: LUXE_COLORS.champagne }}>{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: LUXE_COLORS.champagne }}>Today's Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0" style={{ background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`, border: `1px solid ${stat.color}20` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
                    <div className="text-3xl font-bold" style={{ color: LUXE_COLORS.champagne }}>{stat.value}</div>
                  </div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-0" style={{ background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`, border: `1px solid ${LUXE_COLORS.gold}20` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: LUXE_COLORS.champagne }}>
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

                  const statusDisplay = getStatusColor(status)

                  return (
                    <div key={apt.id || index} className="p-4 rounded-lg" style={{ background: `${LUXE_COLORS.charcoalDark}80`, border: `1px solid ${LUXE_COLORS.bronze}20` }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                          {aptTime} - {customerName}
                        </p>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ background: statusDisplay.bg, color: statusDisplay.text }}
                        >
                          {statusDisplay.label}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: LUXE_COLORS.bronze }}>
                        {serviceNames}
                      </p>
                      {status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'cancelled' && (
                        <Button
                          size="sm"
                          className="w-full"
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
                    className="mt-4"
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
              className="w-full mt-4"
              onClick={() => router.push('/salon/appointments')}
              style={{ borderColor: LUXE_COLORS.gold, color: LUXE_COLORS.gold }}
            >
              View All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
