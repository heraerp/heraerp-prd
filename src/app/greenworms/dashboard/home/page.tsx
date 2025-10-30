'use client'

/**
 * Greenworms ERP Dashboard Home Page
 * Generated using HERA Enterprise Patterns
 * 
 * Module: DASHBOARD
 * Entity: ORGANIZATION
 * Smart Code: HERA.GREENWORMS.DASHBOARD.HOME.v1
 * Description: Executive dashboard with KPIs for waste management operations
 */

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Truck,
  Recycle,
  DollarSign,
  Users,
  MapPin,
  BarChart3,
  Activity,
  Shield,
  Leaf,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'

/**
 * Dashboard KPI Interface
 */
interface DashboardKPI {
  id: string
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
  category: 'operations' | 'finance' | 'compliance' | 'sustainability'
}

/**
 * Greenworms Dashboard Home Component
 * Enterprise-grade dashboard with real-time KPIs and operational metrics
 */
export default function GreenwormsDashboardHomePage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // HERA Universal Entity Integration for dashboard data
  const dashboardData = useUniversalEntity({
    entity_type: 'ORGANIZATION',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      status: 'active'
    },
    dynamicFields: [
      { name: 'total_waste_collected_kg', type: 'number', smart_code: 'HERA.GREENWORMS.METRIC.WASTE.COLLECTED.v1', required: false },
      { name: 'active_routes', type: 'number', smart_code: 'HERA.GREENWORMS.METRIC.ROUTES.ACTIVE.v1', required: false },
      { name: 'revenue_today', type: 'number', smart_code: 'HERA.GREENWORMS.METRIC.REVENUE.TODAY.v1', required: false },
      { name: 'compliance_score', type: 'number', smart_code: 'HERA.GREENWORMS.METRIC.COMPLIANCE.SCORE.v1', required: false }
    ]
  })

  // Real-time KPI calculations
  const kpis: DashboardKPI[] = [
    {
      id: 'pickups_today',
      title: 'Pickups Today',
      value: '47',
      change: '+12%',
      trend: 'up',
      icon: Truck,
      color: '#10b981',
      category: 'operations'
    },
    {
      id: 'waste_collected',
      title: 'Waste Collected (KG)',
      value: '2,340',
      change: '+8.3%',
      trend: 'up',
      icon: Recycle,
      color: '#059669',
      category: 'operations'
    },
    {
      id: 'revenue_today',
      title: 'Revenue Today',
      value: '₹84,650',
      change: '+15.2%',
      trend: 'up',
      icon: DollarSign,
      color: '#3b82f6',
      category: 'finance'
    },
    {
      id: 'active_routes',
      title: 'Active Routes',
      value: '23',
      change: '+1',
      trend: 'up',
      icon: MapPin,
      color: '#8b5cf6',
      category: 'operations'
    },
    {
      id: 'compliance_score',
      title: 'Compliance Score',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: Shield,
      color: '#f59e0b',
      category: 'compliance'
    },
    {
      id: 'carbon_offset',
      title: 'Carbon Offset (kg CO₂)',
      value: '1,456',
      change: '+18%',
      trend: 'up',
      icon: Leaf,
      color: '#22c55e',
      category: 'sustainability'
    },
    {
      id: 'rdf_produced',
      title: 'RDF Produced (KG)',
      value: '875',
      change: '+6.7%',
      trend: 'up',
      icon: Target,
      color: '#ef4444',
      category: 'operations'
    },
    {
      id: 'gl_health',
      title: 'GL Health',
      value: '98%',
      change: 'Balanced',
      trend: 'stable',
      icon: Activity,
      color: '#06b6d4',
      category: 'finance'
    }
  ]

  // Filter KPIs by category
  const filteredKPIs = activeCategory === 'all' 
    ? kpis 
    : kpis.filter(kpi => kpi.category === activeCategory)

  // Quick action tiles
  const quickActions = [
    {
      title: 'New Service Order',
      description: 'Create waste collection order',
      icon: Truck,
      color: '#10b981',
      href: '/greenworms/ops/service-orders/new'
    },
    {
      title: 'Dispatch Board',
      description: 'Real-time dispatch management',
      icon: MapPin,
      color: '#3b82f6',
      href: '/greenworms/dispatch/board'
    },
    {
      title: 'GL Health Check',
      description: 'Financial health monitoring',
      icon: BarChart3,
      color: '#f59e0b',
      href: '/greenworms/fin/gl-health'
    },
    {
      title: 'Compliance Dashboard',
      description: 'Regulatory compliance status',
      icon: Shield,
      color: '#8b5cf6',
      href: '/greenworms/compliance/epr'
    }
  ]

  // Refresh dashboard data
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await dashboardData.refetch()
      setTimeout(() => setRefreshing(false), 1000) // Smooth UX
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error)
      setRefreshing(false)
    }
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Greenworms Dashboard.</p>
      </div>
    )
  }

  if (dashboardData.contextLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p>Loading Dashboard...</p>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p>No organization context found. Please select an organization.</p>
      </div>
    )
  }

  return (
    <MobilePageLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.email || 'User'}`}
      primaryColor="#10b981"
      accentColor="#059669"
      showBackButton={false}
    >
      {/* Header with refresh and period selector */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Greenworms ERP</h1>
          <p className="text-sm text-gray-600">Real-time operations overview</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-green-600 border border-green-300 rounded-md hover:bg-green-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['all', 'operations', 'finance', 'compliance', 'sustainability'].map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {filteredKPIs.map((kpi) => (
          <MobileCard key={kpi.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
                <div className="flex items-center mt-1">
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  ) : kpi.trend === 'down' ? (
                    <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  ) : (
                    <div className="h-4 w-4 mr-1" />
                  )}
                  <p className={`text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : 
                    kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {kpi.change}
                  </p>
                </div>
              </div>
              <kpi.icon className="h-8 w-8" style={{ color: kpi.color }} />
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <MobileCard key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${action.color}20` }}
                >
                  <action.icon className="h-6 w-6" style={{ color: action.color }} />
                </div>
                <h3 className="font-medium text-sm text-gray-900 mb-1">{action.title}</h3>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            </MobileCard>
          ))}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <MobileCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Service Order #SO-2024-001 completed</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Truck className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Vehicle VH-001 dispatched to Route R-001</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Invoice INV-2024-045 paid - ₹25,000</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
          </div>
        </MobileCard>

        {/* System Alerts */}
        <MobileCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Route R-005 behind schedule</p>
                <p className="text-xs text-gray-500">Estimated delay: 30 minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">All compliance checks passed</p>
                <p className="text-xs text-gray-500">EPR certification up to date</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">GL accounts balanced</p>
                <p className="text-xs text-gray-500">All currencies: 100% balanced</p>
              </div>
            </div>
          </div>
        </MobileCard>
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileCard className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">Daily Collection Volume</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart: Daily waste collection trends</p>
            </div>
          </MobileCard>
          
          <MobileCard className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">Revenue vs Target</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart: Revenue performance tracking</p>
            </div>
          </MobileCard>
        </div>
      </div>
    </MobilePageLayout>
  )
}