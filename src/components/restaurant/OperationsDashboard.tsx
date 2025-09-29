'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Clock,
  Users,
  Car,
  MapPin,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Phone,
  Navigation,
  Calendar,
  Timer,
  DollarSign,
  Utensils,
  Truck,
  ShoppingBag,
  Home,
  Star,
  Activity,
  Target,
  Zap
} from 'lucide-react'

// Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
// This operations dashboard is designed to give restaurant managers omniscient control

interface OperationsData {
  date: string
  timestamp: string
  metrics: {
    total_orders: number
    dine_in_orders: number
    pickup_orders: number
    delivery_orders: number
    total_revenue: number
    average_order_value: number
    pending_orders: number
    processing_orders: number
    ready_orders: number
    completed_orders: number
    total_tables: number
    occupied_tables: number
    available_tables: number
    table_occupancy_rate: number
    total_drivers: number
    available_drivers: number
    active_deliveries: number
    ready_for_pickup: number
  }
  orders: {
    all: any[]
    by_type: {
      dine_in: any[]
      pickup: any[]
      delivery: any[]
      total: number
    }
  }
  tables: any[]
  drivers: any[]
  insights: Array<{
    type: 'alert' | 'info' | 'warning'
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
}

export function OperationsDashboard() {
  const [operationsData, setOperationsData] = useState<OperationsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedView, setSelectedView] = useState<'overview' | 'tables' | 'delivery' | 'pickup'>(
    'overview'
  )

  // Load operations data
  const loadOperationsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🎯 Loading operations dashboard data...')
      const response = await fetch('/api/v1/restaurant/operations')
      const result = await response.json()

      if (result.success) {
        setOperationsData(result.data)
        setLastUpdated(new Date())
        console.log('✅ Operations data loaded:', result.data.metrics)
      } else {
        throw new Error(result.message || 'Failed to load operations data')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Operations dashboard error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    loadOperationsData()
    const interval = setInterval(loadOperationsData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Helper functions
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const getTimeAgo = (dateString: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-muted text-gray-200 border-border'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-muted border-border text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading operations dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !operationsData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Unable to Load Operations Data
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadOperationsData}
            className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  const { metrics, orders, tables, drivers, insights } = operationsData

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time restaurant operations powered by HERA's universal architecture
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={loadOperationsData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.total_orders}</p>
              <p className="text-xs text-blue-700 mt-1">
                {metrics.pending_orders} pending • {metrics.processing_orders} processing
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Today's Revenue</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(metrics.total_revenue)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Avg: {formatCurrency(metrics.average_order_value)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Table Occupancy */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Table Occupancy</p>
              <p className="text-2xl font-bold text-purple-900">
                {metrics.table_occupancy_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {metrics.occupied_tables}/{metrics.total_tables} tables
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Driver Status */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Delivery Status</p>
              <p className="text-2xl font-bold text-orange-900">
                {metrics.available_drivers}/{metrics.total_drivers}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {metrics.active_deliveries} active deliveries
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Selection */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ selectedView ==='overview'
                ? 'bg-blue-600 text-foreground'
                : 'bg-muted text-gray-700 hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setSelectedView('tables')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ selectedView ==='tables'
                ? 'bg-blue-600 text-foreground'
                : 'bg-muted text-gray-700 hover:bg-gray-700'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Dine-In ({metrics.dine_in_orders})
          </button>
          <button
            onClick={() => setSelectedView('delivery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ selectedView ==='delivery'
                ? 'bg-blue-600 text-foreground'
                : 'bg-muted text-gray-700 hover:bg-gray-700'
            }`}
          >
            <Truck className="w-4 h-4 inline mr-2" />
            Delivery ({metrics.delivery_orders})
          </button>
          <button
            onClick={() => setSelectedView('pickup')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ selectedView ==='pickup'
                ? 'bg-blue-600 text-foreground'
                : 'bg-muted text-gray-700 hover:bg-gray-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-2" />
            Pick-Up ({metrics.pickup_orders})
          </button>
        </div>
      </Card>

      {/* Operational Insights */}
      {insights.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-100">Operational Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start space-x-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <p className="text-sm font-medium capitalize">{insight.type}</p>
                    <p className="text-sm mt-1">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dynamic Content Based on Selected View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Order Status Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <Timer className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Pending Orders</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{metrics.pending_orders}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="font-medium text-blue-900">Processing</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{metrics.processing_orders}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Ready</span>
                </div>
                <Badge className="bg-green-100 text-green-800">{metrics.ready_orders}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-gray-100">Completed</span>
                </div>
                <Badge className="bg-muted text-gray-200">{metrics.completed_orders}</Badge>
              </div>
            </div>
          </Card>

          {/* Fulfillment Type Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Fulfillment Type Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Home className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Dine-In</span>
                </div>
                <div className="text-right">
                  <Badge className="bg-purple-100 text-purple-800">{metrics.dine_in_orders}</Badge>
                  <p className="text-xs text-purple-700 mt-1">
                    {metrics.total_orders > 0
                      ? ((metrics.dine_in_orders / metrics.total_orders) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Delivery</span>
                </div>
                <div className="text-right">
                  <Badge className="bg-orange-100 text-orange-800">{metrics.delivery_orders}</Badge>
                  <p className="text-xs text-orange-700 mt-1">
                    {metrics.total_orders > 0
                      ? ((metrics.delivery_orders / metrics.total_orders) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">Pick-Up</span>
                </div>
                <div className="text-right">
                  <Badge className="bg-indigo-100 text-indigo-800">{metrics.pickup_orders}</Badge>
                  <p className="text-xs text-indigo-700 mt-1">
                    {metrics.total_orders > 0
                      ? ((metrics.pickup_orders / metrics.total_orders) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedView === 'tables' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-100">Table Management</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Available ({metrics.available_tables})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Occupied ({metrics.occupied_tables})</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(table => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 transition-all ${ table.status ==='occupied'
                    ? 'bg-red-50 border-red-200'
                    : table.status === 'reserved'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-100">Table {table.table_number}</h4>
                  <Badge
                    className={
                      table.status === 'occupied'
                        ? 'bg-red-100 text-red-800'
                        : table.status === 'reserved'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }
                  >
                    {table.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {table.capacity}</span>
                    {table.current_party_size > 0 && (
                      <span>• Party: {table.current_party_size}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{table.location}</span>
                  </div>
                  {table.server_name && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Server: {table.server_name}</span>
                    </div>
                  )}
                  {table.seated_at && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Seated: {getTimeAgo(table.seated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedView === 'delivery' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Driver Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Driver Status</h3>
            <div className="space-y-4">
              {drivers.map(driver => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${driver.is_available ?'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-100">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {driver.vehicle_type} • {driver.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        driver.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {driver.current_orders} orders
                    </Badge>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {driver.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Delivery Orders */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Active Delivery Orders</h3>
            <div className="space-y-3">
              {orders.by_type.delivery
                .filter((order: any) =>
                  ['pending', 'processing', 'approved'].includes(order.status)
                )
                .map((order: any) => (
                  <div key={order.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-100">{order.order_number}</span>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <span className="font-semibold text-gray-100">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{order.customer.name}</span>
                        {order.customer.phone && (
                          <>
                            <Phone className="w-4 h-4" />
                            <span>{order.customer.phone}</span>
                          </>
                        )}
                      </div>
                      {order.delivery_address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}
                      {order.driver_name && (
                        <div className="flex items-center space-x-2">
                          <Car className="w-4 h-4" />
                          <span>Driver: {order.driver_name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Ordered: {getTimeAgo(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {selectedView === 'pickup' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Pick-Up Orders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.by_type.pickup.map((order: any) => (
              <div key={order.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-100">{order.order_number}</span>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                  <span className="font-semibold text-gray-100">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{order.customer.name}</span>
                    {order.customer.phone && (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>{order.customer.phone}</span>
                      </>
                    )}
                  </div>
                  {order.pickup_code && (
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span className="font-mono font-semibold">Code: {order.pickup_code}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Ordered: {getTimeAgo(order.created_at)}</span>
                  </div>
                  {order.estimated_ready_time && (
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4" />
                      <span>Ready by: {formatTime(order.estimated_ready_time)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {order.items.length} items:{' '}
                    {order.items.map((item: any) => `${item.quantity}× ${item.name}`).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* HERA Architecture Attribution */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            HERA Universal Operations Intelligence
          </h3>
          <p className="text-sm text-indigo-800 mb-4">
            This comprehensive operations dashboard demonstrates HERA's universal architecture
            powering real-time restaurant operations:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-indigo-700">
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Real-Time Operations</strong>
              <br />
              Unified view of dine-in, pickup, and delivery orders from universal transactions
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Dynamic Entity Management</strong>
              <br />
              Tables and drivers as flexible entities with unlimited custom properties
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Steve Jobs Excellence</strong>
              <br />
              "Focus and simplicity" - omniscient control through elegant interface design
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-4">
            Same architecture supports healthcare facilities, manufacturing operations, and
            professional services
          </p>
        </div>
      </Card>
    </div>
  )
}
