'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Scissors,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles,
  Settings,
  BarChart3,
  Star,
  Phone,
  Package,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'

export default function FastSalonDashboard() {
  // Fast static data - loads instantly like furniture pages
  const stats = [
    {
      label: 'Today\'s Revenue',
      value: 'AED 3,240',
      change: '+18%',
      trend: 'up' as const,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Appointments',
      value: '28',
      change: '6 remaining',
      trend: 'neutral' as const,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Customer Satisfaction',
      value: '4.9',
      change: '+0.2 this week',
      trend: 'up' as const,
      icon: Star,
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      label: 'Staff Utilization',
      value: '92%',
      change: 'Above target',
      trend: 'up' as const,
      icon: Users,
      gradient: 'from-amber-500 to-orange-500'
    }
  ]

  const recentActivities = [
    {
      id: '1',
      type: 'appointment' as const,
      title: 'Haircut & Styling',
      description: 'Sarah Johnson - 2:30 PM',
      time: '15 mins',
      amount: 'AED 180'
    },
    {
      id: '2',
      type: 'payment' as const,
      title: 'Payment received',
      description: 'Color treatment completed',
      time: '1 hour ago',
      amount: 'AED 420'
    },
    {
      id: '3',
      type: 'booking' as const,
      title: 'New booking',
      description: 'Weekend spa package',
      time: '2 hours ago',
      amount: 'AED 650'
    }
  ]

  const staffKPIs = [
    { label: 'Booking Rate', value: 85, target: 80, color: 'blue' },
    { label: 'Customer Rating', value: 94, target: 90, color: 'green' },
    { label: 'Revenue per Hour', value: 320, target: 300, color: 'purple' },
    { label: 'Repeat Customers', value: 78, target: 75, color: 'amber' }
  ]

  const quickActions = [
    { label: 'New Appointment', href: '/salon/appointments/new', icon: Calendar },
    { label: 'Walk-in Customer', href: '/salon/customers/new', icon: Users },
    { label: 'Process Payment', href: '/salon/pos', icon: CreditCard },
    { label: 'Staff Schedule', href: '/salon/staffs', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header with Salon Branding */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Scissors className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Hair Talkz Salon
                  </h1>
                  <p className="text-lg text-gray-600">Professional salon management</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Today's Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map(stat => (
                <div key={stat.label} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-gray-600'}`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {quickActions.map(action => (
                <Link key={action.label} href={action.href}>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <div className="flex flex-col items-center text-center gap-2">
                      <action.icon className="h-8 w-8 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Recent Activities */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                        {activity.amount && (
                          <p className="font-semibold text-green-600">{activity.amount}</p>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      View All Activities
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {staffKPIs.map(kpi => (
                    <div key={kpi.label} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">{kpi.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}%</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Target: {kpi.target}%</span>
                            <span className={kpi.value >= kpi.target ? 'text-green-600' : 'text-amber-500'}>
                              {kpi.value >= kpi.target ? '✓' : '↓'}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                              style={{ width: `${kpi.value}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="finance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Today's Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">AED 3,240</p>
                      <p className="text-sm text-green-600">+18% vs yesterday</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Weekly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">AED 18,500</p>
                      <p className="text-sm text-green-600">Target achieved</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Outstanding</p>
                      <p className="text-2xl font-bold text-gray-900">AED 850</p>
                      <p className="text-sm text-amber-600">2 pending payments</p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Module Navigation */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Salon Management Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { href: '/salon/appointments', icon: Calendar, label: 'Appointments' },
                { href: '/salon/customers', icon: Users, label: 'Customers' },
                { href: '/salon/staffs', icon: Users, label: 'Staff Management' },
                { href: '/salon/services', icon: Scissors, label: 'Services' },
                { href: '/salon/pos', icon: CreditCard, label: 'Point of Sale' },
                { href: '/salon/inventory', icon: Package, label: 'Inventory' },
                { href: '/salon/reports', icon: BarChart3, label: 'Reports' },
                { href: '/salon/settings', icon: Settings, label: 'Settings' }
              ].map(module => (
                <Link key={module.label} href={module.href}>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <div className="flex flex-col items-center text-center gap-2">
                      <module.icon className="h-8 w-8 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{module.label}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}