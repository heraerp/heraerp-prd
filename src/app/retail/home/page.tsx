"use client"

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useHera } from '@/lib/hooks/hera'
import { useLoadingCompletion } from '@/lib/hooks/useLoadingCompletion'
import {
  TrendingUp, Package, Wrench, CreditCard, Users, BarChart3,
  Settings, ShoppingCart, AlertTriangle, CheckCircle, Clock,
  ArrowUpRight, DollarSign, Star, Truck
} from 'lucide-react'

export default function RetailHomePage() {
  const { client, auth } = useHera()
  const now = useMemo(() => new Date(), [])
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)

  const [tiles, setTiles] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // ⚡ ENTERPRISE: Automatic loading completion using HERA hook
  useLoadingCompletion()

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    const org = auth.organization_id || 'mock-org'
    client
      .analyticsTiles({ organization_id: org, from: from.toISOString(), to: now.toISOString() })
      .then(res => { if (mounted) setTiles(res) })
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [auth.organization_id, client, from, now])

  const kpiData = tiles?.tiles || [
    { key: 'SalesToday', value: 15750, currency: true, change: '+12.3%', trend: 'up' },
    { key: 'OrdersToday', value: 47, change: '+8.1%', trend: 'up' },
    { key: 'ActiveCustomers', value: 1243, change: '+5.2%', trend: 'up' },
    { key: 'InventoryValue', value: 285000, currency: true, change: '-2.1%', trend: 'down' }
  ]

  const quickActions = [
    { 
      label: 'New Sale', 
      description: 'Process customer transactions',
      href: '/retail/sales/pos', 
      icon: ShoppingCart, 
      color: 'modern-primary',
      stats: '47 today'
    },
    { 
      label: 'Inventory', 
      description: 'Manage products & stock',
      href: '/retail/inventory/catalog', 
      icon: Package, 
      color: 'modern-surface',
      stats: '1,247 items'
    },
    { 
      label: 'Service Jobs', 
      description: 'Track repair & maintenance',
      href: '/retail/service/intake', 
      icon: Wrench, 
      color: 'modern-elevated',
      stats: '8 active'
    },
    { 
      label: 'Analytics', 
      description: 'View reports & insights',
      href: '/retail/analytics', 
      icon: BarChart3, 
      color: 'modern-surface',
      stats: 'Live data'
    },
    { 
      label: 'Customers', 
      description: 'Manage customer relationships',
      href: '/retail/crm', 
      icon: Users, 
      color: 'modern-elevated',
      stats: '1,243 total'
    },
    { 
      label: 'Procurement', 
      description: 'Purchase orders & vendors',
      href: '/retail/procurement/po', 
      icon: Truck, 
      color: 'modern-surface',
      stats: '3 pending'
    }
  ]

  const recentActivity = [
    { 
      type: 'sale', 
      message: 'Sale completed', 
      amount: 1250, 
      customer: 'John Smith', 
      time: '2 minutes ago',
      status: 'completed'
    },
    { 
      type: 'service', 
      message: 'Service job started', 
      customer: 'Tech Solutions Inc', 
      time: '15 minutes ago',
      status: 'in-progress'
    },
    { 
      type: 'inventory', 
      message: 'Low stock alert', 
      product: 'iPhone 15 Pro', 
      time: '1 hour ago',
      status: 'warning'
    },
    { 
      type: 'order', 
      message: 'Purchase order received', 
      supplier: 'Apple Inc', 
      time: '3 hours ago',
      status: 'completed'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="modern-card modern-primary">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="modern-heading text-3xl text-[#2C3E50] mb-2">
              Welcome to Modern Retail
            </h1>
            <p className="modern-subheading text-lg">
              Your enterprise management dashboard • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/retail/sales/pos" className="modern-btn-primary flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Quick Sale
            </Link>
            <Link href="/retail/analytics" className="modern-btn-secondary flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="modern-heading text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1E88E5]" />
            Today's Performance
          </h2>
          <Link href="/retail/analytics" className="modern-btn-secondary text-sm flex items-center gap-1">
            View Details
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {loading && (
            <div className="modern-loading col-span-full p-8 text-center">
              Loading performance data...
            </div>
          )}
          {error && (
            <div className="modern-card modern-status-error col-span-full p-6 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              {error}
            </div>
          )}
          {!loading && !error && kpiData.map((kpi: any, index: number) => {
            const kpiConfig = [
              { icon: DollarSign, title: 'Sales Today', color: 'modern-kpi' },
              { icon: ShoppingCart, title: 'Orders Today', color: 'modern-kpi-success' },
              { icon: Users, title: 'Active Customers', color: 'modern-kpi-success' },
              { icon: Package, title: 'Inventory Value', color: 'modern-kpi-warning' }
            ][index]
            
            const IconComponent = kpiConfig.icon
            const isPositive = kpi.trend === 'up'
            
            return (
              <div key={kpi.key} className={`modern-card ${kpiConfig.color} group cursor-pointer hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#1E88E5]/20 to-[#1565C0]/10">
                    <IconComponent className="w-6 h-6 text-[#1565C0]" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[#81C784]' : 'text-[#E53935]'}`}>
                    <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
                    {kpi.change}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="modern-caption text-[#4B5563]">
                    {kpiConfig.title}
                  </div>
                  <div className="modern-heading text-2xl text-[#1E1E20]">
                    {kpi.currency ? '₹' : ''}
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : String(kpi.value)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="modern-heading text-xl flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#1E88E5]" />
              Quick Actions
            </h2>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`modern-card ${action.color} group hover:scale-105 transition-all duration-300 no-underline`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1E88E5]/20 to-[#1565C0]/10 group-hover:from-[#1E88E5]/30 group-hover:to-[#1565C0]/20 transition-all">
                      <IconComponent className="w-6 h-6 text-[#1565C0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="modern-heading text-[#1E1E20] group-hover:text-[#1E88E5] transition-colors">
                          {action.label}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#4B5563] group-hover:text-[#1E88E5] transition-colors" />
                      </div>
                      <div className="modern-subheading text-sm mb-2">
                        {action.description}
                      </div>
                      <div className="modern-caption text-[#1E88E5] font-medium">
                        {action.stats}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="modern-heading text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1E88E5]" />
              Recent Activity
            </h2>
            <Link href="/retail/analytics" className="modern-btn-secondary text-sm">
              View All
            </Link>
          </div>
          
          <div className="modern-card space-y-4">
            {recentActivity.map((activity, index) => {
              const statusConfig = {
                'completed': { icon: CheckCircle, color: 'text-[#81C784]' },
                'in-progress': { icon: Clock, color: 'text-[#FFB74D]' },
                'warning': { icon: AlertTriangle, color: 'text-[#E53935]' }
              }[activity.status] || { icon: Clock, color: 'text-[#4B5563]' }
              
              const StatusIcon = statusConfig.icon
              
              return (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-[#E5E7EB] last:border-b-0 last:pb-0">
                  <div className={`p-2 rounded-lg bg-[#F3F4F6] ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="modern-body text-sm text-[#1E1E20] font-medium mb-1">
                      {activity.message}
                    </div>
                    {activity.customer && (
                      <div className="modern-subheading text-xs mb-1">
                        {activity.customer}
                      </div>
                    )}
                    {activity.product && (
                      <div className="modern-subheading text-xs mb-1">
                        {activity.product}
                      </div>
                    )}
                    {activity.supplier && (
                      <div className="modern-subheading text-xs mb-1">
                        {activity.supplier}
                      </div>
                    )}
                    <div className="modern-caption text-[#4B5563]">
                      {activity.time}
                    </div>
                  </div>
                  {activity.amount && (
                    <div className="modern-heading text-sm text-[#1E88E5]">
                      ₹{activity.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}