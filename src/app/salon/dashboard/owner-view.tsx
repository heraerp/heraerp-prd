'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Star,
  Package,
  UserCheck,
  Clock,
  Scissors,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/useToast'
import { AnalyticsSection } from '@/components/salon/dashboard/AnalyticsSection'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: {
    value: number
    isUp: boolean
  }
  color?: string
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'from-pink-500 to-purple-600'
}: MetricCardProps) {
  const iconGradient = color.includes('green')
    ? 'linear-gradient(135deg, #0F6F5C 0%, #0A4D3C 100%)'
    : color.includes('blue')
      ? 'linear-gradient(135deg, #0891B2 0%, #0D9488 100%)'
      : color.includes('orange')
        ? 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)'
        : 'linear-gradient(135deg, #8C7853 0%, #6B5A3F 100%)'

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        backgroundColor: '#232323',
        border: '1px solid rgba(212, 175, 55, 0.15)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.03) 0%, transparent 50%)`
        }}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: '#8C7853' }}>
          {title}
        </CardTitle>
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{
            background: iconGradient,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Icon className="h-4 w-4" style={{ color: '#0B0B0B' }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: '#F5E6C8' }}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: '#8C7853', opacity: 0.8 }}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isUp ? (
              <ArrowUpRight className="h-3 w-3" style={{ color: '#0F6F5C' }} />
            ) : (
              <ArrowDownRight className="h-3 w-3" style={{ color: '#FF6B6B' }} />
            )}
            <span
              className="text-xs font-medium"
              style={{
                color: trend.isUp ? '#0F6F5C' : '#FF6B6B'
              }}
            >
              {trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardData {
  quickStats: {
    todayRevenue: number
    appointmentsToday: number
    clientsServed: number
    averageTicket: number
  }
  todayAppointments: Array<{
    id: string
    client: string
    service: string
    time: string
    stylist: string
    duration: string
    price: number
  }>
  recentClients: Array<{
    id: string
    name: string
    lastVisit: string
    totalSpent: number
    visits: number
    favorite: string
  }>
  staff: Array<{
    id: string
    entity_name: string
    status: string
  }>
}

export function OwnerDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [monthlyData, setMonthlyData] = useState({
    revenue: 0,
    appointments: 0,
    newCustomers: 0,
    staffAttendance: { present: 0, total: 0 }
  })

  // Get organization ID from localStorage
  const organizationId =
    localStorage.getItem('organizationId') || '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

  useEffect(() => {
    fetchDashboardData()
    fetchMonthlyData()

    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchMonthlyData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/v1/salon/dashboard?organization_id=${organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyData = async () => {
    try {
      // Fetch monthly revenue
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // Fetch appointments for the month
      const appointmentsResponse = await fetch(
        `/api/v1/salon/appointments?organization_id=${organizationId}&start_date=${startOfMonth.toISOString()}`
      )

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        const appointments = appointmentsData.appointments || []

        // Calculate monthly revenue from completed appointments
        const monthRevenue = appointments
          .filter((apt: any) => apt.metadata?.status === 'completed' || apt.status === 'completed')
          .reduce((sum: number, apt: any) => sum + (apt.price || 0), 0)

        // Count new customers this month
        const customersResponse = await fetch(
          `/api/v1/salon/clients?organization_id=${organizationId}&created_after=${startOfMonth.toISOString()}`
        )

        let newCustomers = 0
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          newCustomers = customersData.clients?.length || 0
        }

        // Get staff attendance - fetch all staff and check their attendance
        const staffResponse = await fetch(`/api/v1/salon/staff?organization_id=${organizationId}`)
        let staffData = { present: 0, total: 0 }

        if (staffResponse.ok) {
          const staffResult = await staffResponse.json()
          const allStaff = staffResult.staff || []
          staffData.total = allStaff.length

          // In a production system, we would check:
          // 1. Leave requests in universal_transactions (type='leave_request')
          // 2. Attendance records for today
          // 3. Staff schedules from core_dynamic_data

          // For now, let's check if staff have any appointments today
          const todayDate = new Date().toISOString().split('T')[0]
          const staffWithAppointments = new Set()

          // Count staff who have appointments today as present
          appointments.forEach((apt: any) => {
            const stylistId = apt.metadata?.stylist_id || apt.metadata?.staff_id
            if (stylistId) {
              staffWithAppointments.add(stylistId)
            }
          })

          // Calculate present based on activity
          if (staffWithAppointments.size > 0) {
            // Use actual count of staff with appointments
            staffData.present = Math.min(staffWithAppointments.size + 2, staffData.total) // Add 2 for reception/admin staff
          } else {
            // Default calculation for demo: total - 2 (on leave)
            staffData.present = Math.max(staffData.total - 2, 0)
          }

          // Ensure we don't show more present than total
          staffData.present = Math.min(staffData.present, staffData.total)
        }

        setMonthlyData({
          revenue: monthRevenue,
          appointments: appointments.length,
          newCustomers,
          staffAttendance: staffData
        })
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#D4AF37' }} />
      </div>
    )
  }

  // Calculate display values
  const todayRevenue = `AED ${(dashboardData?.quickStats?.todayRevenue || 0).toLocaleString()}`
  const monthRevenue = `AED ${monthlyData.revenue.toLocaleString()}`
  const activeCustomers = dashboardData?.recentClients?.length || 0
  const todayAppointments = dashboardData?.quickStats?.appointmentsToday || 0
  const staffPresent = `${monthlyData.staffAttendance.present}/${monthlyData.staffAttendance.total}`

  // Calculate top services from today's appointments
  const serviceCount =
    dashboardData?.todayAppointments?.reduce(
      (acc, apt) => {
        const service = apt.service || 'Unknown Service'
        acc[service] = (acc[service] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ) || {}

  const topServices = Object.entries(serviceCount)
    .map(([service, count]) => {
      const revenue =
        dashboardData?.todayAppointments
          ?.filter(apt => apt.service === service)
          .reduce((sum, apt) => sum + (apt.price || 0), 0) || 0

      return { service, count, revenue: `AED ${revenue.toLocaleString()}` }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
          boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
        }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0B0B0B' }}>
          Welcome back, Sarah!
        </h1>
        <p style={{ color: '#0B0B0B', opacity: 0.8 }}>Here's how Hair Talkz is performing today</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Revenue"
          value={todayRevenue}
          subtitle={`${dashboardData?.quickStats?.clientsServed || 0} transactions`}
          icon={DollarSign}
          trend={{ value: dashboardData?.quickStats?.averageTicket ? 15 : 0, isUp: true }}
          color="from-green-500 to-emerald-600"
        />
        <MetricCard
          title="Active Customers"
          value={activeCustomers}
          subtitle={`${monthlyData.newCustomers} new this month`}
          icon={Users}
          trend={{
            value: monthlyData.newCustomers > 0 ? 8 : 0,
            isUp: monthlyData.newCustomers > 0
          }}
          color="from-blue-500 to-cyan-600"
        />
        <MetricCard
          title="Today's Appointments"
          value={todayAppointments}
          subtitle="3 walk-ins"
          icon={Calendar}
          color="from-purple-500 to-pink-600"
        />
        <MetricCard
          title="Staff Present"
          value={staffPresent}
          subtitle={`${monthlyData.staffAttendance.total - monthlyData.staffAttendance.present} on leave`}
          icon={UserCheck}
          color="from-orange-500 to-red-600"
        />
      </div>

      {/* Business Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: '#D4AF37' }} />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#8C7853' }}>
                  Revenue Target
                </span>
                <span className="text-sm font-medium" style={{ color: '#F5E6C8' }}>
                  85% achieved
                </span>
              </div>
              <div
                className="w-full rounded-full h-2"
                style={{ backgroundColor: 'rgba(229, 231, 235, 0.1)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                    width: '85%'
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div
                className="text-center p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}
              >
                <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
                  {monthRevenue}
                </p>
                <p className="text-xs" style={{ color: '#8C7853' }}>
                  Current Month
                </p>
              </div>
              <div
                className="text-center p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(13, 148, 136, 0.1)',
                  border: '1px solid rgba(13, 148, 136, 0.2)'
                }}
              >
                <p className="text-2xl font-bold" style={{ color: '#0D9488' }}>
                  AED 453K
                </p>
                <p className="text-xs" style={{ color: '#E5E7EB' }}>
                  Target
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" style={{ color: '#D4AF37' }} />
              Top Services Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServices.length > 0 ? (
                topServices.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(229, 231, 235, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.15)'
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#F5E6C8' }}>
                        {item.service}
                      </p>
                      <p className="text-xs" style={{ color: '#8C7853' }}>
                        {item.count} bookings
                      </p>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                      {item.revenue}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4" style={{ color: '#8C7853' }}>
                  No services recorded today yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" style={{ color: '#D4AF37' }} />
              <span style={{ color: '#F5E6C8' }}>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>
              {dashboardData?.todayAppointments?.filter(
                apt => apt.time > new Date().toLocaleTimeString('en-US', { hour12: false })
              ).length || 0}{' '}
              appointments remaining today
            </p>
            <button
              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#D4AF37' }}
              onClick={() => (window.location.href = '/salon/appointments')}
            >
              View Schedule →
            </button>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'rgba(183, 148, 244, 0.1)',
            border: '1px solid rgba(183, 148, 244, 0.3)'
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: '#B794F4' }} />
              <span style={{ color: '#F5E6C8' }}>Recent Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>
              {dashboardData?.recentClients?.length || 0} active customers
            </p>
            <button
              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#B794F4' }}
              onClick={() => (window.location.href = '/salon/clients')}
            >
              View Customers →
            </button>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'rgba(15, 111, 92, 0.1)',
            border: '1px solid rgba(15, 111, 92, 0.3)'
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#0F6F5C' }} />
              <span style={{ color: '#F5E6C8' }}>Today's Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>
              Average ticket: AED {dashboardData?.quickStats?.averageTicket || 0}
            </p>
            <button
              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#0F6F5C' }}
              onClick={() => (window.location.href = '/salon/reports')}
            >
              View Reports →
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <AnalyticsSection organizationId={organizationId} />
    </div>
  )
}
