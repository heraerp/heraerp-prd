'use client'

import React, { useEffect } from 'react'
import { useSalonContext } from '../SalonProvider'
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
      { title: 'Customer Check-in', href: '/salon/pos2', icon: CheckCircle },
      { title: 'Process Payment', href: '/salon/pos2', icon: CreditCard },
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
  revenue: { title: 'Monthly Revenue', value: 'AED 125,000', change: '+12%', icon: DollarSign, color: LUXE_COLORS.gold },
  expenses: { title: 'Total Expenses', value: 'AED 75,000', change: '-5%', icon: Receipt, color: LUXE_COLORS.ruby },
  profit: { title: 'Net Profit', value: 'AED 50,000', change: '+18%', icon: TrendingUp, color: LUXE_COLORS.emerald },
  vat: { title: 'VAT Collected', value: 'AED 6,250', icon: FileText, color: LUXE_COLORS.plum },
  pending: { title: 'Pending Payments', value: 'AED 15,000', icon: Clock, color: LUXE_COLORS.orange },
  
  // Operational widgets
  appointments: { title: "Today's Appointments", value: '12', icon: Calendar, color: LUXE_COLORS.gold },
  customers: { title: 'Active Customers', value: '348', change: '+23', icon: Users, color: LUXE_COLORS.emerald },
  staff: { title: 'Staff Members', value: '15', icon: Users, color: LUXE_COLORS.plum },
  inventory: { title: 'Low Stock Items', value: '7', icon: Package, color: LUXE_COLORS.ruby },
  
  // Reception widgets
  todayAppointments: { title: "Today's Appointments", value: '12', icon: Calendar, color: LUXE_COLORS.gold },
  walkIns: { title: 'Walk-ins Waiting', value: '3', icon: Clock, color: LUXE_COLORS.orange },
  checkedIn: { title: 'Checked In', value: '8', icon: CheckCircle, color: LUXE_COLORS.emerald },
  todayRevenue: { title: "Today's Revenue", value: 'AED 3,450', icon: DollarSign, color: LUXE_COLORS.gold },
  
  // Admin widgets
  activeUsers: { title: 'Active Users', value: '24', icon: Users, color: LUXE_COLORS.emerald },
  systemStatus: { title: 'System Status', value: 'Healthy', icon: CheckCircle, color: LUXE_COLORS.emerald },
  backups: { title: 'Last Backup', value: '2 hours ago', icon: Package, color: LUXE_COLORS.plum },
  security: { title: 'Security Alerts', value: '0', icon: Shield, color: LUXE_COLORS.emerald }
}

export function UnifiedDashboard() {
  const { role, user, isLoading, isAuthenticated } = useSalonContext()
  const router = useRouter()
  
  // Redirect to role-specific dashboards
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const userRole = role?.toLowerCase()
      if (userRole === 'receptionist') {
        router.push('/salon/receptionist/dashboard')
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
    console.log('Dashboard auth check failed:', { isAuthenticated, role, user })
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Card className="max-w-md w-full border-0" style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
            <h3 className="text-xl mb-2" style={{ color: LUXE_COLORS.gold }}>
              Authentication Required
            </h3>
            <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
              {!isAuthenticated ? 'Please log in to access the dashboard.' : 'No role assigned. Please contact your administrator.'}
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

  const userRole = role.toLowerCase() as keyof typeof ROLE_FEATURES
  const features = ROLE_FEATURES[userRole] || ROLE_FEATURES.owner
  const widgets = features.widgets
  const quickLinks = features.quickLinks

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-light mb-2"
            style={{ color: LUXE_COLORS.gold }}
          >
            Welcome back, {user?.user_metadata?.full_name || 'User'}
          </h1>
          <p 
            className="text-sm"
            style={{ color: LUXE_COLORS.bronze }}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Widgets Grid - Dynamic based on role */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {widgets.map((widgetKey) => {
            const widget = WIDGET_DATA[widgetKey as keyof typeof WIDGET_DATA]
            if (!widget) return null
            const Icon = widget.icon

            return (
              <Card 
                key={widgetKey}
                className="border-0 hover:scale-[1.02] transition-transform cursor-pointer"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.bronze}30`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                        {widget.title}
                      </p>
                      <p className="text-2xl font-light mt-1" style={{ color: widget.color }}>
                        {widget.value}
                      </p>
                      {widget.change && (
                        <p 
                          className="text-xs mt-1" 
                          style={{ 
                            color: widget.change.startsWith('+') ? LUXE_COLORS.emerald : LUXE_COLORS.ruby 
                          }}
                        >
                          {widget.change} from last month
                        </p>
                      )}
                    </div>
                    <Icon className="h-8 w-8 opacity-50" style={{ color: widget.color }} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions - Dynamic based on role */}
        <Card 
          className="border-0 mb-8"
          style={{
            backgroundColor: LUXE_COLORS.charcoalLight,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: LUXE_COLORS.gold }}>Quick Actions</CardTitle>
            <CardDescription style={{ color: LUXE_COLORS.bronze }}>
              Frequently used features for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-black/20 transition-colors group"
                    style={{
                      backgroundColor: LUXE_COLORS.charcoal,
                      border: `1px solid ${LUXE_COLORS.bronze}20`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.gold }} />
                      <span style={{ color: LUXE_COLORS.champagne }}>{link.title}</span>
                    </div>
                    <ArrowRight 
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                      style={{ color: LUXE_COLORS.gold }} 
                    />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Role-specific content sections */}
        {userRole === 'owner' && (
          <Card 
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: LUXE_COLORS.gold }}>Business Overview</CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                Key metrics and insights for your salon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8" style={{ color: LUXE_COLORS.bronze }}>
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Detailed analytics and reports will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === 'receptionist' && (
          <Card 
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: LUXE_COLORS.gold }}>Upcoming Appointments</CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                Next appointments for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p style={{ color: LUXE_COLORS.champagne }}>Sarah Johnson - Hair Color</p>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>2:00 PM with Emma</p>
                    </div>
                    <Button size="sm" variant="outline">Check In</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === 'accountant' && (
          <Card 
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: LUXE_COLORS.gold }}>Pending Tasks</CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                Financial tasks requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
                  <AlertCircle className="h-5 w-5" style={{ color: LUXE_COLORS.orange }} />
                  <span style={{ color: LUXE_COLORS.champagne }}>VAT return due in 5 days</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
                  <Receipt className="h-5 w-5" style={{ color: LUXE_COLORS.plum }} />
                  <span style={{ color: LUXE_COLORS.champagne }}>15 invoices pending approval</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === 'admin' && (
          <Card 
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: LUXE_COLORS.gold }}>System Health</CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                Current system status and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
                  <span style={{ color: LUXE_COLORS.champagne }}>Database Status</span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: LUXE_COLORS.emerald }} />
                    <span style={{ color: LUXE_COLORS.emerald }}>Healthy</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
                  <span style={{ color: LUXE_COLORS.champagne }}>API Performance</span>
                  <span style={{ color: LUXE_COLORS.gold }}>98.5% uptime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}