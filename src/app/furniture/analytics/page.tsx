'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Factory,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Globe,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Percent,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Award,
  Star,
  Crown,
  Gem
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface AnalyticsMetric {
  id: string
  label: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ElementType
  color: string
}

interface ChartData {
  period: string
  revenue: number
  orders: number
  customers: number
  production: number
}

function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Key Performance Indicators
  const kpiMetrics: AnalyticsMetric[] = [
    {
      id: 'total-revenue',
      label: 'Total Revenue',
      value: '₹2.8Cr',
      change: '+18.5%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'active-orders',
      label: 'Active Orders',
      value: 147,
      change: '+12.3%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'customer-base',
      label: 'Customer Base',
      value: 1284,
      change: '+8.7%',
      changeType: 'increase',
      icon: Users,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'production-rate',
      label: 'Production Rate',
      value: '92%',
      change: '+5.2%',
      changeType: 'increase',
      icon: Factory,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'profit-margin',
      label: 'Profit Margin',
      value: '24.8%',
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'customer-satisfaction',
      label: 'Customer Satisfaction',
      value: '4.7/5',
      change: '+0.3',
      changeType: 'increase',
      icon: Star,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'inventory-turnover',
      label: 'Inventory Turnover',
      value: '6.2x',
      change: '+0.8x',
      changeType: 'increase',
      icon: Package,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'export-growth',
      label: 'Export Growth',
      value: '34%',
      change: '+11.2%',
      changeType: 'increase',
      icon: Globe,
      color: 'text-[var(--jewelry-gold-500)]'
    }
  ]

  // Sales Performance Data
  const salesMetrics = [
    {
      category: 'Luxury Furniture',
      revenue: 1200000,
      orders: 45,
      avgOrderValue: 26667,
      growth: '+23%'
    },
    {
      category: 'Hotel Furniture',
      revenue: 890000,
      orders: 23,
      avgOrderValue: 38696,
      growth: '+31%'
    },
    {
      category: 'Office Furniture',
      revenue: 540000,
      orders: 67,
      avgOrderValue: 8060,
      growth: '+12%'
    },
    {
      category: 'Export Orders',
      revenue: 780000,
      orders: 34,
      avgOrderValue: 22941,
      growth: '+45%'
    }
  ]

  // Production Analytics
  const productionMetrics = [
    {
      department: 'Cutting & Assembly',
      efficiency: 94,
      capacity: 85,
      quality: 98,
      status: 'optimal'
    },
    {
      department: 'Finishing',
      efficiency: 89,
      capacity: 92,
      quality: 96,
      status: 'good'
    },
    {
      department: 'Quality Control',
      efficiency: 96,
      capacity: 78,
      quality: 99,
      status: 'optimal'
    },
    {
      department: 'Packaging',
      efficiency: 88,
      capacity: 95,
      quality: 97,
      status: 'good'
    }
  ]

  // Regional Performance
  const regionalData = [
    {
      region: 'Kerala',
      revenue: 1800000,
      growth: '+15%',
      customers: 450,
      marketShare: '45%'
    },
    {
      region: 'Karnataka',
      revenue: 650000,
      growth: '+22%',
      customers: 180,
      marketShare: '18%'
    },
    {
      region: 'Tamil Nadu',
      revenue: 420000,
      growth: '+8%',
      customers: 120,
      marketShare: '12%'
    },
    {
      region: 'International',
      revenue: 580000,
      growth: '+38%',
      customers: 85,
      marketShare: '25%'
    }
  ]

  // Real-time metrics (simulated)
  const realTimeMetrics = [
    { label: 'Current Orders', value: '23', status: 'active' },
    { label: 'Production Lines', value: '8/10', status: 'running' },
    { label: 'Quality Checks', value: '12', status: 'pending' },
    { label: 'Shipments Today', value: '15', status: 'completed' }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-[var(--jewelry-success)]'
      case 'good': return 'text-[var(--jewelry-warning)]'
      case 'active': return 'text-[var(--jewelry-success)]'
      case 'running': return 'text-[var(--jewelry-info)]'
      case 'pending': return 'text-[var(--jewelry-warning)]'
      case 'completed': return 'text-[var(--jewelry-success)]'
      default: return 'text-gray-300'
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Business Analytics
            </h1>
            <p className="text-gray-300 mt-2">
              Comprehensive insights and performance metrics for your furniture business
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-white">Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span className="text-white">Export</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Eye className="h-4 w-4" />
              <span className="text-black font-medium">Live View</span>
            </Button>
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--jewelry-success)]" />
              <span className="text-white font-medium">Live Dashboard</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6">
              {realTimeMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  <p className={`font-semibold ${getStatusColor(metric.status)}`}>{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last updated</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiMetrics.map((metric) => (
            <div key={metric.id} className="jewelry-glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {metric.changeType === 'increase' ? (
                  <ArrowUp className="h-4 w-4 text-[var(--jewelry-success)]" />
                ) : metric.changeType === 'decrease' ? (
                  <ArrowDown className="h-4 w-4 text-[var(--jewelry-error)]" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className={`text-sm font-medium ${
                  metric.changeType === 'increase' ? 'text-[var(--jewelry-success)]' : 
                  metric.changeType === 'decrease' ? 'text-[var(--jewelry-error)]' : 
                  'text-gray-400'
                }`}>
                  {metric.change}
                </span>
                <span className="text-xs text-gray-400">vs last period</span>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="sales" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Sales Analytics
            </TabsTrigger>
            <TabsTrigger value="production" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Production
            </TabsTrigger>
            <TabsTrigger value="regional" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Regional
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Financial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            {/* Sales Performance */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Sales Performance by Category</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-white">Filter</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span className="text-white">Chart View</span>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salesMetrics.map((category, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{category.category}</h4>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        category.growth.includes('+') ? 'bg-green-500/20 text-[var(--jewelry-success)]' : 'bg-red-500/20 text-[var(--jewelry-error)]'
                      }`}>
                        {category.growth}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Revenue</span>
                        <span className="text-white font-medium">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Orders</span>
                        <span className="text-white font-medium">{category.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Order Value</span>
                        <span className="text-white font-medium">{formatCurrency(category.avgOrderValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            {/* Production Analytics */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Production Department Performance</h3>
                <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                  <Target className="h-4 w-4 mr-2" />
                  <span className="text-white">Set Targets</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productionMetrics.map((dept, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">{dept.department}</h4>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(dept.status)} bg-black/20`}>
                        {dept.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Efficiency</span>
                          <span className="text-white font-medium">{dept.efficiency}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full transition-all"
                            style={{ width: `${dept.efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Capacity</span>
                          <span className="text-white font-medium">{dept.capacity}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-blue-500)] h-2 rounded-full transition-all"
                            style={{ width: `${dept.capacity}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Quality</span>
                          <span className="text-white font-medium">{dept.quality}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${dept.quality}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regional" className="space-y-6">
            {/* Regional Performance */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Regional Market Performance</h3>
                <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                  <Globe className="h-4 w-4 mr-2" />
                  <span className="text-white">Expand Markets</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regionalData.map((region, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{region.region}</h4>
                      <span className="text-sm font-medium text-[var(--jewelry-success)]">{region.growth}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Revenue</span>
                        <span className="text-white font-medium">{formatCurrency(region.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Customers</span>
                        <span className="text-white font-medium">{region.customers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Market Share</span>
                        <span className="text-[var(--jewelry-gold-500)] font-medium">{region.marketShare}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* Financial Overview */}
            <div className="jewelry-glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Financial Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
                  </div>
                  <p className="text-2xl font-bold text-white">₹2.8Cr</p>
                  <p className="text-gray-400">Annual Revenue</p>
                  <p className="text-[var(--jewelry-success)] text-sm">+18.5% YoY</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gem className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
                  </div>
                  <p className="text-2xl font-bold text-white">24.8%</p>
                  <p className="text-gray-400">Profit Margin</p>
                  <p className="text-[var(--jewelry-success)] text-sm">+2.1% YoY</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
                  </div>
                  <p className="text-2xl font-bold text-white">₹69.4L</p>
                  <p className="text-gray-400">Net Profit</p>
                  <p className="text-[var(--jewelry-success)] text-sm">+21.2% YoY</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Quick Analytics Actions</h3>
              <p className="text-gray-400">Generate reports and insights instantly</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                <PieChart className="h-4 w-4" />
                <span className="text-white">Custom Report</span>
              </Button>
              <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                <LineChart className="h-4 w-4" />
                <span className="text-white">Trend Analysis</span>
              </Button>
              <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                <Zap className="h-4 w-4" />
                <span className="text-black font-medium">AI Insights</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(AnalyticsPage)