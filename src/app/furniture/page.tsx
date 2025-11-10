'use client'

import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useLoadingStore } from '@/lib/stores/loading-store'
import {
  Package,
  ShoppingCart,
  Factory,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Truck,
  BarChart3,
  Settings,
  FileText,
  Brain,
  Sparkles,
  Armchair,
  Hammer,
  TreePine,
  Sofa,
  Calculator,
  Target,
  PenTool
} from 'lucide-react'
import Link from 'next/link'

export default function Furniture1Dashboard() {
  const { updateProgress, finishLoading } = useLoadingStore()

  // ⚡ ENTERPRISE: Complete loading animation on mount (if coming from login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('🪑 Furniture Dashboard: Completing loading animation from 70% → 100%')

      // Animate from 70% to 100% smoothly
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading your workspace...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          // Complete and hide overlay after brief delay
          setTimeout(() => {
            finishLoading()
            // Clean up URL parameter
            window.history.replaceState({}, '', window.location.pathname)
            console.log('✅ Furniture Dashboard: Loading complete!')
          }, 500)
        }
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  // Dashboard stats for furniture business
  const stats = [
    {
      label: 'Active Orders',
      value: '47',
      change: '+12%',
      trend: 'up' as const,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Production Queue',
      value: '23',
      change: '5 urgent',
      trend: 'neutral' as const,
      icon: Factory,
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      label: 'Monthly Revenue',
      value: '₹28.5L',
      change: '+18%',
      trend: 'up' as const,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Inventory Value',
      value: '₹45.2L',
      change: 'Well stocked',
      trend: 'neutral' as const,
      icon: Package,
      gradient: 'from-amber-500 to-orange-500'
    }
  ]

  const recentActivities = [
    {
      id: '1',
      type: 'order' as const,
      title: 'New order from Marriott Hotels',
      description: '150 Executive Room Chairs',
      time: '2 hours ago',
      amount: '₹12,50,000'
    },
    {
      id: '2',
      type: 'production' as const,
      title: 'Production completed',
      description: 'Order #FRN-2025-0234 ready for dispatch',
      time: '4 hours ago'
    },
    {
      id: '3',
      type: 'payment' as const,
      title: 'Payment received',
      description: 'ITC Hotels - ₹8,50,000',
      time: '6 hours ago',
      amount: '₹8,50,000'
    }
  ]

  const productionKPIs = [
    { label: 'Capacity Utilization', value: 78, target: 85, color: 'blue' },
    { label: 'On-Time Delivery', value: 92, target: 95, color: 'green' },
    { label: 'Quality Pass Rate', value: 96.5, target: 98, color: 'purple' },
    { label: 'Machine Efficiency', value: 84, target: 90, color: 'amber' }
  ]

  const quickActions = [
    { label: 'Create Order', href: '/furniture/orders', icon: ShoppingCart },
    { label: 'Production Planning', href: '/furniture/production', icon: Factory },
    { label: 'View Inventory', href: '/furniture/inventory', icon: Package },
    { label: 'Payroll Processing', href: '/furniture/hr', icon: Users }
  ]

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header with Furniture Branding */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Armchair className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Kerala Furniture Works</h1>
                  <p className="text-lg text-gray-300">Complete furniture business management</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Settings className="h-4 w-4 jewelry-text-luxury" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <BarChart3 className="h-4 w-4 jewelry-text-luxury" />
                  Reports
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold jewelry-text-luxury">Business Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map(stat => (
                <div key={stat.label} className="jewelry-glass-card p-6 jewelry-scale-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">{stat.label}</p>
                      <p className="text-2xl font-bold jewelry-text-luxury">{stat.value}</p>
                      <p className={`text-sm ${stat.trend === 'up' ? 'jewelry-text-gold' : 'text-gray-300'}`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Manager Card */}
          <div className="jewelry-glass-card p-6 bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold jewelry-text-luxury flex items-center gap-2">
                    AI Business Manager{' '}
                    <Sparkles className="h-4 w-4 jewelry-text-gold" />
                  </h3>
                  <p className="text-sm text-gray-300">
                    Get instant insights, recommendations, and strategic analysis for your furniture business
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium jewelry-text-luxury">Ask anything</span>
                <span className="text-xs text-gray-300">Powered by AI</span>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="overview" className="jewelry-glass-btn jewelry-text-luxury">Overview</TabsTrigger>
              <TabsTrigger value="production" className="jewelry-glass-btn jewelry-text-luxury">Production</TabsTrigger>
              <TabsTrigger value="finance" className="jewelry-glass-btn jewelry-text-luxury">Finance</TabsTrigger>
              <TabsTrigger value="hr" className="jewelry-glass-btn jewelry-text-luxury">HR & Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {quickActions.map(action => (
                    <div key={action.label} className="jewelry-glass-card p-4 jewelry-scale-hover cursor-pointer">
                      <div className="flex flex-col items-center text-center gap-2">
                        <action.icon className="h-8 w-8 jewelry-text-gold" />
                        <span className="text-sm font-medium jewelry-text-luxury">{action.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Recent Activities</h3>
                <div className="jewelry-glass-card p-6">
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium jewelry-text-luxury">{activity.title}</p>
                          <p className="text-sm text-gray-300">{activity.description}</p>
                          <p className="text-xs text-gray-300 mt-1">{activity.time}</p>
                        </div>
                        {activity.amount && (
                          <p className="font-semibold jewelry-text-gold">{activity.amount}</p>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                      View All Activities
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="production" className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Production KPIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {productionKPIs.map(kpi => (
                    <div key={kpi.label} className="jewelry-glass-card p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300">{kpi.label}</p>
                        <p className="text-2xl font-bold jewelry-text-luxury">{kpi.value}%</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-300">Target: {kpi.target}%</span>
                            <span className={kpi.value >= kpi.target ? 'jewelry-text-gold' : 'text-amber-500'}>
                              {kpi.value >= kpi.target ? '✓' : '↓'}
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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

              <div className="space-y-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Work Center Status</h3>
                <div className="jewelry-glass-card p-6">
                  <div className="space-y-4">
                    {[
                      { label: 'Cutting Station', value: 85, icon: TreePine },
                      { label: 'Assembly Line 1', value: 72, icon: Hammer },
                      { label: 'Finishing Bay', value: 90, icon: Sparkles },
                      { label: 'Quality Check', value: 65, icon: CheckCircle }
                    ].map(center => (
                      <div key={center.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <center.icon className="h-4 w-4 jewelry-text-gold" />
                            <span className="font-medium jewelry-text-luxury">{center.label}</span>
                          </div>
                          <span className="text-sm font-medium jewelry-text-luxury">{center.value}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                            style={{ width: `${center.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="finance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="jewelry-glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Outstanding Receivables</p>
                      <p className="text-2xl font-bold jewelry-text-luxury">₹15.2L</p>
                      <p className="text-sm text-amber-500">5 overdue</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <div className="jewelry-glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">GST Payable</p>
                      <p className="text-2xl font-bold jewelry-text-luxury">₹2.8L</p>
                      <p className="text-sm text-green-500">Due in 7 days</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="jewelry-glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Cash Position</p>
                      <p className="text-2xl font-bold jewelry-text-luxury">₹8.5L</p>
                      <p className="text-sm text-green-500">Healthy</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hr" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 jewelry-text-gold" />
                      <p className="text-sm text-gray-300">Total Employees</p>
                    </div>
                    <p className="text-2xl font-bold jewelry-text-luxury">124</p>
                    <p className="text-sm text-green-500">98% attendance today</p>
                  </div>
                </div>
                <div className="jewelry-glass-card p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 jewelry-text-gold" />
                      <p className="text-sm text-gray-300">Payroll Status</p>
                    </div>
                    <p className="text-lg font-semibold jewelry-text-luxury">Processing</p>
                    <p className="text-sm text-amber-500">Due: 25th Jan</p>
                  </div>
                </div>
                <div className="jewelry-glass-card p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 jewelry-text-gold" />
                      <p className="text-sm text-gray-300">PF Remittance</p>
                    </div>
                    <p className="text-lg font-semibold jewelry-text-luxury">Completed</p>
                    <p className="text-sm text-green-500">For Dec 2024</p>
                  </div>
                </div>
                <div className="jewelry-glass-card p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 jewelry-text-gold" />
                      <p className="text-sm text-gray-300">ESI Status</p>
                    </div>
                    <p className="text-lg font-semibold jewelry-text-luxury">Pending</p>
                    <p className="text-sm text-amber-500">Submit by 31st Jan</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Module Navigation */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold jewelry-text-luxury">Kerala Furniture Business Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { href: '/furniture/design-studio', icon: PenTool, label: 'Design Studio' },
                { href: '/furniture/ai-manager', icon: Brain, label: 'AI Business Manager' },
                { href: '/furniture/digital-accountant', icon: Calculator, label: 'Digital Accountant' },
                { href: '/furniture/leads', icon: Target, label: 'Lead Management' },
                { href: '/furniture/production', icon: Factory, label: 'Production Planning' },
                { href: '/furniture/inventory', icon: Package, label: 'Inventory Management' },
                { href: '/furniture/customers', icon: Users, label: 'Customer Management' },
                { href: '/furniture/sales', icon: ShoppingCart, label: 'Sales Dashboard' },
                { href: '/furniture/financial', icon: DollarSign, label: 'Financial Reports' },
                { href: '/furniture/suppliers', icon: Truck, label: 'Supplier Management' },
                { href: '/furniture/quality', icon: CheckCircle, label: 'Quality Control' },
                { href: '/furniture/analytics', icon: BarChart3, label: 'Analytics' },
                { href: '/furniture/settings', icon: Settings, label: 'Settings' }
              ].map(module => (
                <Link key={module.label} href={module.href}>
                  <div className="jewelry-glass-card p-4 jewelry-scale-hover cursor-pointer">
                    <div className="flex flex-col items-center text-center gap-2">
                      <module.icon className="h-8 w-8 jewelry-text-gold" />
                      <span className="text-sm font-medium jewelry-text-luxury">{module.label}</span>
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