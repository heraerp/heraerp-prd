'use client'

import React, { useEffect } from 'react'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  DollarSign,
  Users,
  Scissors,
  TrendingUp,
  Receipt,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import Link from 'next/link'

// Define what each role can see
const ROLE_FEATURES = {
  owner: {
    widgets: ['revenue', 'appointments', 'customers', 'staff', 'expenses', 'inventory'],
    quickLinks: [
      { title: 'Financial Reports', href: '/salon/finance', icon: BarChart3 },
      { title: 'Staff Management', href: '/salon/team', icon: Users },
      { title: 'Inventory', href: '/salon/inventory', icon: Package },
      { title: 'Analytics', href: '/salon/analytics', icon: TrendingUp },
      { title: 'Settings', href: '/salon/settings', icon: Settings }
    ]
  },
  receptionist: {
    widgets: ['todayAppointments', 'walkIns', 'checkedIn', 'todayRevenue'],
    quickLinks: [
      { title: 'Book Appointment', href: '/salon/appointments/new', icon: Calendar },
      { title: 'Customer Check-in', href: '/salon/pos', icon: CheckCircle },
      { title: 'Process Payment', href: '/salon/pos', icon: CreditCard },
      { title: 'View Services', href: '/salon/services', icon: Scissors },
      { title: 'Customer List', href: '/salon/customers', icon: Users }
    ]
  },
  accountant: {
    widgets: ['revenue', 'expenses', 'profit', 'vat', 'pending'],
    quickLinks: [
      { title: 'P&L Report', href: '/salon/finance#pnl', icon: FileText },
      { title: 'VAT Reports', href: '/salon/finance#vat', icon: Receipt },
      { title: 'Expense Management', href: '/salon/finance#expenses', icon: Receipt },
      { title: 'Invoices', href: '/salon/invoices', icon: FileText },
      { title: 'Export Data', href: '/salon/reports', icon: BarChart3 }
    ]
  },
  admin: {
    widgets: ['activeUsers', 'systemStatus', 'backups', 'security'],
    quickLinks: [
      { title: 'User Management', href: '/salon/settings#users', icon: Users },
      { title: 'Security Settings', href: '/salon/settings#security', icon: Shield },
      { title: 'System Logs', href: '/salon/logs', icon: FileText },
      { title: 'Integrations', href: '/salon/settings#integrations', icon: Settings },
      { title: 'Backup & Restore', href: '/salon/backup', icon: Package }
    ]
  }
}

// Widget data (in production, this would come from API)
const WIDGET_DATA = {
  // Financial widgets
  revenue: {
    title: 'Monthly Revenue',
    value: 'AED 125,000',
    change: '+12%',
    icon: DollarSign,
    color: LUXE_COLORS.gold
  },
  expenses: {
    title: 'Total Expenses',
    value: 'AED 75,000',
    change: '-5%',
    icon: Receipt,
    color: LUXE_COLORS.ruby
  },
  profit: {
    title: 'Net Profit',
    value: 'AED 50,000',
    change: '+18%',
    icon: TrendingUp,
    color: LUXE_COLORS.emerald
  },
  vat: { title: 'VAT Collected', value: 'AED 6,250', icon: FileText, color: LUXE_COLORS.plum },
  pending: {
    title: 'Pending Payments',
    value: 'AED 15,000',
    icon: Clock,
    color: LUXE_COLORS.orange
  },

  // Operational widgets
  appointments: {
    title: "Today's Appointments",
    value: '12',
    icon: Calendar,
    color: LUXE_COLORS.gold
  },
  customers: {
    title: 'Active Customers',
    value: '348',
    change: '+23',
    icon: Users,
    color: LUXE_COLORS.emerald
  },
  staff: { title: 'Staff Members', value: '15', icon: Users, color: LUXE_COLORS.plum },
  inventory: { title: 'Low Stock Items', value: '7', icon: Package, color: LUXE_COLORS.ruby },

  // Reception widgets
  todayAppointments: {
    title: "Today's Appointments",
    value: '12',
    icon: Calendar,
    color: LUXE_COLORS.gold
  },
  walkIns: { title: 'Walk-ins Waiting', value: '3', icon: Clock, color: LUXE_COLORS.orange },
  checkedIn: { title: 'Checked In', value: '8', icon: CheckCircle, color: LUXE_COLORS.emerald },
  todayRevenue: {
    title: "Today's Revenue",
    value: 'AED 3,450',
    icon: DollarSign,
    color: LUXE_COLORS.gold
  },

  // Admin widgets
  activeUsers: { title: 'Active Users', value: '24', icon: Users, color: LUXE_COLORS.emerald },
  systemStatus: {
    title: 'System Status',
    value: 'Healthy',
    icon: CheckCircle,
    color: LUXE_COLORS.emerald
  },
  backups: { title: 'Last Backup', value: '2 hours ago', icon: Package, color: LUXE_COLORS.plum },
  security: { title: 'Security Alerts', value: '0', icon: Shield, color: LUXE_COLORS.emerald }
}

export function UnifiedDashboard() {
  const context = useSecuredSalonContext()
  const {
    role,
    user,
    isLoading,
    isAuthenticated,
    getDashboardWidgets,
    getNavigationItems,
    canViewFinancials
  } = useSalonSecurity()
  const router = useRouter()

  // Redirect to role-specific dashboards
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const userRole = role?.toLowerCase()
      if (userRole === 'receptionist') {
        router.push('/salon/receptionist')
      } else if (userRole === 'admin') {
        router.push('/salon/admin/dashboard')
      }
    }
  }, [role, isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

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
              onClick={() => router.push('/salon/auth')}
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

  // Use security-aware dashboard widgets
  const dashboardWidgets = getDashboardWidgets()
  const navigationItems = getNavigationItems()

  // Filter widgets based on role permissions
  const widgets = dashboardWidgets
  const quickLinks = ROLE_FEATURES[role]?.quickLinks || []

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

      <div className="relative container mx-auto px-8 py-8">
        {/* Enhanced Header */}
        <div
          className="mb-8 p-6 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px ${LUXE_COLORS.gold}10`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Organization Icon */}
              <div
                className="p-4 rounded-xl"
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
                  className="text-4xl font-bold tracking-tight mb-1"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Hair Talkz Salon
                </h1>
                <p
                  className="text-sm flex items-center gap-2"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  <span className="font-medium">
                    {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
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

            {/* User Info and Logout */}
            <div className="flex items-center gap-4">
              {/* User Info Card */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl"
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

              {/* Logout Button */}
              <Button
                onClick={async () => {
                  try {
                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    localStorage.removeItem('salonUserName')
                    localStorage.removeItem('salonUserEmail')
                    localStorage.removeItem('salonRole')
                    router.push('/salon/auth')
                  } catch (error) {
                    console.error('Logout error:', error)
                    router.push('/salon/auth')
                  }
                }}
                variant="outline"
                className="px-5 py-3 font-medium transition-all hover:scale-105"
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

        {/* Enhanced Widgets Grid - Luxury Salon Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {widgets.map(widgetKey => {
            const widget = WIDGET_DATA[widgetKey as keyof typeof WIDGET_DATA]
            if (!widget) return null
            const Icon = widget.icon

            return (
              <Card
                key={widgetKey}
                className="border-0 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}20`,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${LUXE_COLORS.gold}10`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.bronze }}>
                        {widget.title}
                      </p>
                      <p
                        className="text-3xl font-bold tracking-tight"
                        style={{ color: widget.color }}
                      >
                        {/* Hide financial values if user doesn't have permission */}
                        {widget.title.toLowerCase().includes('revenue') ||
                        widget.title.toLowerCase().includes('expense') ||
                        widget.title.toLowerCase().includes('profit') ||
                        widget.title.toLowerCase().includes('payment')
                          ? canViewFinancials
                            ? widget.value
                            : '***'
                          : widget.value}
                      </p>
                      {widget.change && canViewFinancials && (
                        <p
                          className="text-xs mt-2 font-semibold flex items-center gap-1"
                          style={{
                            color: widget.change.startsWith('+')
                              ? LUXE_COLORS.emerald
                              : LUXE_COLORS.ruby
                          }}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {widget.change} from last month
                        </p>
                      )}
                    </div>
                    <div
                      className="p-3 rounded-xl transition-all group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${widget.color}20 0%, ${widget.color}10 100%)`,
                        border: `1px solid ${widget.color}30`,
                        boxShadow: `0 0 12px ${widget.color}15`
                      }}
                    >
                      <Icon className="h-7 w-7" style={{ color: widget.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Enhanced Quick Actions - Luxury Theme */}
        <Card
          className="border-0 mb-8"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${LUXE_COLORS.gold}10`
          }}
        >
          <CardHeader>
            <CardTitle
              className="text-2xl font-bold tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Quick Actions
            </CardTitle>
            <CardDescription className="text-base" style={{ color: LUXE_COLORS.bronze }}>
              Frequently used features for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map(link => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between p-5 rounded-xl transition-all duration-200 group hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}80 0%, ${LUXE_COLORS.charcoal}80 100%)`,
                      border: `1px solid ${LUXE_COLORS.gold}30`,
                      boxShadow: `0 2px 8px rgba(0, 0, 0, 0.2)`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                          border: `1px solid ${LUXE_COLORS.gold}30`
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.gold }} />
                      </div>
                      <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        {link.title}
                      </span>
                    </div>
                    <ArrowRight
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                      style={{ color: LUXE_COLORS.gold }}
                    />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Role-specific Sections */}
        {role === 'owner' && (
          <Card
            className="border-0"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}20`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${LUXE_COLORS.gold}10`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Business Overview
              </CardTitle>
              <CardDescription className="text-base" style={{ color: LUXE_COLORS.bronze }}>
                Key metrics and insights for your salon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-center py-12 rounded-xl"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoalDark}80`,
                  border: `1px solid ${LUXE_COLORS.gold}20`
                }}
              >
                <div
                  className="p-4 rounded-xl inline-block mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <BarChart3 className="h-12 w-12" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <p className="text-base" style={{ color: LUXE_COLORS.bronze }}>
                  Detailed analytics and reports will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {role === 'receptionist' && (
          <Card
            className="border-0"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}20`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${LUXE_COLORS.gold}10`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Upcoming Appointments
              </CardTitle>
              <CardDescription className="text-base" style={{ color: LUXE_COLORS.bronze }}>
                Next appointments for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className="p-5 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}80 0%, ${LUXE_COLORS.charcoal}80 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                        Sarah Johnson - Hair Color
                      </p>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                        2:00 PM with Emma
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
                        border: `1px solid ${LUXE_COLORS.emerald}40`,
                        color: LUXE_COLORS.emerald
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {role === 'accountant' && (
          <Card
            className="border-0"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}20`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${LUXE_COLORS.gold}10`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Pending Tasks
              </CardTitle>
              <CardDescription className="text-base" style={{ color: LUXE_COLORS.bronze }}>
                Financial tasks requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}80 0%, ${LUXE_COLORS.charcoal}80 100%)`,
                    border: `1px solid ${LUXE_COLORS.orange}30`
                  }}
                >
                  <AlertCircle className="h-6 w-6" style={{ color: LUXE_COLORS.orange }} />
                  <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                    VAT return due in 5 days
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}80 0%, ${LUXE_COLORS.charcoal}80 100%)`,
                    border: `1px solid ${LUXE_COLORS.plum}30`
                  }}
                >
                  <Receipt className="h-6 w-6" style={{ color: LUXE_COLORS.plum }} />
                  <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                    15 invoices pending approval
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {role === 'admin' && (
          <Card
            className="border-0"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}20`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${LUXE_COLORS.gold}10`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                System Health
              </CardTitle>
              <CardDescription className="text-base" style={{ color: LUXE_COLORS.bronze }}>
                Current system status and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}80 0%, ${LUXE_COLORS.charcoal}80 100%)`,
                    border: `1px solid ${LUXE_COLORS.emerald}30`
                  }}
                >
                  <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                    Database Status
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" style={{ color: LUXE_COLORS.emerald }} />
                    <span className="font-semibold" style={{ color: LUXE_COLORS.emerald }}>
                      Healthy
                    </span>
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}80 0%, ${LUXE_COLORS.charcoal}80 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <span className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                    API Performance
                  </span>
                  <span className="font-semibold" style={{ color: LUXE_COLORS.gold }}>
                    98.5% uptime
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
