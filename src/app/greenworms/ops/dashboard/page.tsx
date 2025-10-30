'use client'

/**
 * Greenworms Operations Dashboard Page
 * Generated using HERA Enterprise Patterns
 * 
 * Module: OPERATIONS
 * Entity: OPERATIONS_DASHBOARD
 * Smart Code: HERA.GREENWORMS.OPS.DASHBOARD.v1
 * Description: Real-time operations control center for waste management
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
  MapPin,
  Users,
  Package,
  AlertTriangle,
  Activity,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Route,
  Target,
  Timer,
  Fuel,
  Wrench,
  Shield,
  Plus
} from 'lucide-react'

/**
 * Operations KPI Interface
 */
interface OperationsKPI {
  id: string
  title: string
  value: string | number
  target?: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
  status: 'good' | 'warning' | 'critical'
  category: 'collection' | 'processing' | 'dispatch' | 'fleet'
}

/**
 * Route Status Interface
 */
interface RouteStatus {
  id: string
  route_name: string
  driver: string
  vehicle: string
  status: 'active' | 'completed' | 'delayed' | 'maintenance'
  progress: number
  next_pickup: string
  estimated_completion: string
  waste_collected_kg: number
}

/**
 * Greenworms Operations Dashboard Component
 * Real-time operations monitoring and control center
 */
export default function GreenwormsDashboardOpsPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('today')
  const [activeView, setActiveView] = useState<string>('overview')

  // HERA Universal Entity Integration for operations data
  const operationsData = useUniversalEntity({
    entity_type: 'SERVICE_ORDER',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      status: 'active'
    },
    dynamicFields: [
      { name: 'collection_weight_kg', type: 'number', smart_code: 'HERA.WASTE.TXN.COLLECTION.WEIGHT.v1', required: false },
      { name: 'route_efficiency', type: 'number', smart_code: 'HERA.WASTE.OPS.ROUTE.EFFICIENCY.v1', required: false },
      { name: 'processing_status', type: 'text', smart_code: 'HERA.WASTE.OPS.PROCESSING.STATUS.v1', required: false }
    ]
  })

  // Real-time operations KPIs
  const operationsKPIs: OperationsKPI[] = [
    {
      id: 'active_routes',
      title: 'Active Routes',
      value: '23',
      target: '25',
      change: '+1',
      trend: 'up',
      icon: Route,
      color: '#10b981',
      status: 'good',
      category: 'dispatch'
    },
    {
      id: 'pickups_completed',
      title: 'Pickups Completed',
      value: '47',
      target: '60',
      change: '+8',
      trend: 'up',
      icon: CheckCircle,
      color: '#059669',
      status: 'good',
      category: 'collection'
    },
    {
      id: 'waste_processed',
      title: 'Waste Processed (KG)',
      value: '2,340',
      target: '3,000',
      change: '+12%',
      trend: 'up',
      icon: Recycle,
      color: '#3b82f6',
      status: 'good',
      category: 'processing'
    },
    {
      id: 'fleet_utilization',
      title: 'Fleet Utilization',
      value: '87%',
      target: '90%',
      change: '+2%',
      trend: 'up',
      icon: Truck,
      color: '#8b5cf6',
      status: 'good',
      category: 'fleet'
    },
    {
      id: 'avg_collection_time',
      title: 'Avg Collection Time',
      value: '18 min',
      target: '15 min',
      change: '+2 min',
      trend: 'down',
      icon: Timer,
      color: '#f59e0b',
      status: 'warning',
      category: 'collection'
    },
    {
      id: 'route_delays',
      title: 'Route Delays',
      value: '3',
      target: '0',
      change: '+1',
      trend: 'down',
      icon: AlertTriangle,
      color: '#ef4444',
      status: 'critical',
      category: 'dispatch'
    },
    {
      id: 'processing_efficiency',
      title: 'Processing Efficiency',
      value: '94%',
      target: '95%',
      change: '+1%',
      trend: 'up',
      icon: Target,
      color: '#06b6d4',
      status: 'good',
      category: 'processing'
    },
    {
      id: 'fuel_consumption',
      title: 'Fuel Efficiency (L/KM)',
      value: '12.4',
      target: '11.0',
      change: '+0.8',
      trend: 'down',
      icon: Fuel,
      color: '#84cc16',
      status: 'warning',
      category: 'fleet'
    }
  ]

  // Mock route status data
  const routeStatuses: RouteStatus[] = [
    {
      id: 'R001',
      route_name: 'Central Business District',
      driver: 'Raj Kumar',
      vehicle: 'GW-001',
      status: 'active',
      progress: 75,
      next_pickup: 'Metro Mall',
      estimated_completion: '14:30',
      waste_collected_kg: 245
    },
    {
      id: 'R002',
      route_name: 'Residential Zone A',
      driver: 'Amit Singh',
      vehicle: 'GW-002',
      status: 'active',
      progress: 60,
      next_pickup: 'Green Valley Apartments',
      estimated_completion: '15:15',
      waste_collected_kg: 180
    },
    {
      id: 'R003',
      route_name: 'Industrial Area',
      driver: 'Suresh Patel',
      vehicle: 'GW-003',
      status: 'delayed',
      progress: 40,
      next_pickup: 'Tech Park Phase 2',
      estimated_completion: '16:45',
      waste_collected_kg: 320
    },
    {
      id: 'R004',
      route_name: 'Market District',
      driver: 'Vikram Yadav',
      vehicle: 'GW-004',
      status: 'completed',
      progress: 100,
      next_pickup: 'Completed',
      estimated_completion: 'Completed',
      waste_collected_kg: 210
    }
  ]

  // Filter KPIs by category
  const filteredKPIs = activeView === 'overview' 
    ? operationsKPIs 
    : operationsKPIs.filter(kpi => kpi.category === activeView)

  // Quick action buttons
  const quickActions = [
    {
      title: 'New Service Order',
      description: 'Create collection order',
      icon: Plus,
      color: '#10b981',
      href: '/greenworms/ops/service-orders/new'
    },
    {
      title: 'Dispatch Board',
      description: 'Route management',
      icon: MapPin,
      color: '#3b82f6',
      href: '/greenworms/dispatch/board'
    },
    {
      title: 'Fleet Status',
      description: 'Vehicle monitoring',
      icon: Truck,
      color: '#8b5cf6',
      href: '/greenworms/fleet/vehicles'
    },
    {
      title: 'Processing Center',
      description: 'MRF operations',
      icon: Package,
      color: '#f59e0b',
      href: '/greenworms/ops/mrf-sorting/new'
    }
  ]

  // Refresh operations data
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await operationsData.refetch()
      setTimeout(() => setRefreshing(false), 1000)
    } catch (error) {
      console.error('❌ Error refreshing operations data:', error)
      setRefreshing(false)
    }
  }

  // Get status color
  const getStatusColor = (status: OperationsKPI['status']) => {
    switch (status) {
      case 'good': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // Get route status color
  const getRouteStatusColor = (status: RouteStatus['status']) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'completed': return '#059669'
      case 'delayed': return '#ef4444'
      case 'maintenance': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Operations Dashboard.</p>
      </div>
    )
  }

  if (operationsData.contextLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p>Loading Operations Dashboard...</p>
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
      title="Operations Dashboard"
      subtitle="Real-time operations control center"
      primaryColor="#10b981"
      accentColor="#059669"
      showBackButton={true}
    >
      {/* Header with refresh and timeframe selector */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Control</h1>
          <p className="text-sm text-gray-600">Live monitoring and management</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
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

      {/* View filter pills */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['overview', 'collection', 'processing', 'dispatch', 'fleet'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
              activeView === view
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {filteredKPIs.map((kpi) => (
          <MobileCard key={kpi.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getStatusColor(kpi.status) }}
                />
              </div>
              <p className="text-xs text-gray-500">{kpi.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
                {kpi.target && (
                  <p className="text-sm text-gray-400">/ {kpi.target}</p>
                )}
              </div>
              <p className={`text-xs font-medium ${
                kpi.trend === 'up' ? 'text-green-600' : 
                kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {kpi.change}
              </p>
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

      {/* Live Route Status */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Route Status</h2>
        <div className="space-y-4">
          {routeStatuses.map((route) => (
            <MobileCard key={route.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRouteStatusColor(route.status) }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{route.route_name}</h3>
                    <p className="text-sm text-gray-600">{route.driver} • {route.vehicle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium capitalize" style={{ color: getRouteStatusColor(route.status) }}>
                    {route.status}
                  </p>
                  <p className="text-xs text-gray-500">{route.estimated_completion}</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{route.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${route.progress}%`,
                      backgroundColor: getRouteStatusColor(route.status)
                    }}
                  />
                </div>
              </div>

              {/* Route details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Next Pickup</p>
                  <p className="font-medium">{route.next_pickup}</p>
                </div>
                <div>
                  <p className="text-gray-600">Collected</p>
                  <p className="font-medium">{route.waste_collected_kg} kg</p>
                </div>
              </div>
            </MobileCard>
          ))}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileCard className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">Collection Efficiency Trend</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart: Collection efficiency over time</p>
            </div>
          </MobileCard>
          
          <MobileCard className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">Fleet Utilization</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart: Fleet utilization breakdown</p>
            </div>
          </MobileCard>
        </div>
      </div>
    </MobilePageLayout>
  )
}