'use client'

/**
 * MatrixIT World ERP - Enterprise Dashboard
 * SAP Fiori Design System Implementation
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.DASHBOARD.ENTERPRISE.v1
 * 
 * Enterprise-grade retail dashboard with Fiori design patterns
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  Monitor,
  Smartphone,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Warehouse,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  Download,
  Settings,
  Plus,
  Target,
  Activity,
  Bell,
  Search,
  Calendar,
  MapPin,
  Truck,
  HardDrive,
  Building2,
  Calculator,
  Route,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronRight,
  Zap
} from 'lucide-react'

/**
 * Enterprise KPI Interface - Fiori Standard
 */
interface EnterpriseKPI {
  id: string
  title: string
  value: string | number
  target?: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
  status: 'good' | 'warning' | 'critical'
  category: 'sales' | 'inventory' | 'operations' | 'finance'
  description?: string
}

/**
 * Fiori Tile Interface
 */
interface FioriTile {
  id: string
  title: string
  subtitle: string
  value?: string
  target?: string
  href: string
  icon: React.ComponentType<any>
  color: string
  size: 'small' | 'medium' | 'large'
  type: 'navigation' | 'analytic' | 'monitor'
}

/**
 * Alert Interface - Enterprise Standard
 */
interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
}

export default function MatrixITWorldEnterpriseDashboard() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('today')
  const [activeView, setActiveView] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // HERA Universal Entity Integration
  const salesData = useUniversalEntity({
    entity_type: 'SALES_ORDER',
    organizationId: organization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      status: 'active'
    },
    dynamicFields: [
      { name: 'order_value', type: 'number', smart_code: 'HERA.RETAIL.SALES.ORDER.VALUE.v1', required: false },
      { name: 'payment_status', type: 'text', smart_code: 'HERA.RETAIL.SALES.PAYMENT.STATUS.v1', required: false },
      { name: 'delivery_branch', type: 'text', smart_code: 'HERA.RETAIL.SALES.DELIVERY.BRANCH.v1', required: false }
    ]
  })

  // Authentication check
  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/retail1/matrixitworld/login')
    }
  }, [isAuthenticated, contextLoading, router])

  // Enterprise KPIs - Fiori Standard
  const enterpriseKPIs: EnterpriseKPI[] = [
    {
      id: 'daily_revenue',
      title: 'Daily Revenue',
      value: '₹2.85L',
      target: '₹3.2L',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: '#0F7B0F',
      status: 'good',
      category: 'finance',
      description: 'Across all 6 branches'
    },
    {
      id: 'units_sold',
      title: 'Units Sold Today',
      value: '147',
      target: '180',
      change: '+8.5%',
      trend: 'up',
      icon: ShoppingCart,
      color: '#1F69FF',
      status: 'good',
      category: 'sales'
    },
    {
      id: 'inventory_turnover',
      title: 'Inventory Turnover',
      value: '87%',
      target: '90%',
      change: '-2.1%',
      trend: 'down',
      icon: Package,
      color: '#FF7F00',
      status: 'warning',
      category: 'inventory',
      description: 'Weekly average'
    },
    {
      id: 'customer_satisfaction',
      title: 'Customer Satisfaction',
      value: '4.7/5',
      target: '4.8/5',
      change: '+0.1',
      trend: 'up',
      icon: Users,
      color: '#0F7B0F',
      status: 'good',
      category: 'operations'
    },
    {
      id: 'pc_sales',
      title: 'PC Sales (Units)',
      value: '23',
      target: '30',
      change: '-7',
      trend: 'down',
      icon: Monitor,
      color: '#D9001B',
      status: 'critical',
      category: 'sales',
      description: 'Below target'
    },
    {
      id: 'mobile_sales',
      title: 'Mobile Sales (Units)',
      value: '89',
      target: '85',
      change: '+4',
      trend: 'up',
      icon: Smartphone,
      color: '#0F7B0F',
      status: 'good',
      category: 'sales'
    },
    {
      id: 'stock_alerts',
      title: 'Stock Alerts',
      value: '12',
      target: '5',
      change: '+3',
      trend: 'down',
      icon: AlertTriangle,
      color: '#D9001B',
      status: 'critical',
      category: 'inventory',
      description: 'Immediate attention required'
    },
    {
      id: 'branch_performance',
      title: 'Branch Performance',
      value: '94%',
      target: '95%',
      change: '+1%',
      trend: 'up',
      icon: Building2,
      color: '#1F69FF',
      status: 'good',
      category: 'operations'
    }
  ]

  // Fiori Navigation Tiles
  const fioriTiles: FioriTile[] = [
    {
      id: 'sales_orders',
      title: 'Sales Orders',
      subtitle: 'Manage customer orders',
      value: '47',
      target: '60',
      href: '/retail1/matrixitworld/sales',
      icon: ShoppingCart,
      color: '#1F69FF',
      size: 'medium',
      type: 'analytic'
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      subtitle: 'Stock levels & procurement',
      value: '2,847',
      href: '/retail1/matrixitworld/inventory',
      icon: Warehouse,
      color: '#0F7B0F',
      size: 'medium',
      type: 'analytic'
    },
    {
      id: 'customers',
      title: 'Customer Management',
      subtitle: 'CRM and support',
      value: '1,234',
      href: '/retail1/matrixitworld/customers',
      icon: Users,
      color: '#7030A0',
      size: 'medium',
      type: 'analytic'
    },
    {
      id: 'finance',
      title: 'Financial Management',
      subtitle: 'Accounting & reports',
      href: '/retail1/matrixitworld/finance',
      icon: Calculator,
      color: '#FF7F00',
      size: 'medium',
      type: 'navigation'
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      subtitle: 'Business intelligence',
      href: '/retail1/matrixitworld/reports',
      icon: BarChart3,
      color: '#D9001B',
      size: 'large',
      type: 'navigation'
    },
    {
      id: 'settings',
      title: 'System Configuration',
      subtitle: 'Admin settings',
      href: '/retail1/matrixitworld/settings',
      icon: Settings,
      color: '#68217A',
      size: 'small',
      type: 'navigation'
    }
  ]

  // Enterprise Alerts
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'iPhone 15 Pro stock below minimum threshold in Kochi Main branch',
      timestamp: '15 minutes ago',
      priority: 'high'
    },
    {
      id: '2',
      type: 'info',
      title: 'New Order',
      message: 'Bulk order received for 50 gaming laptops - Corporate client',
      timestamp: '1 hour ago',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'success',
      title: 'Target Achieved',
      message: 'Thrissur branch achieved monthly sales target',
      timestamp: '2 hours ago',
      priority: 'low'
    }
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />
      default: return <div className="w-4 h-4" />
    }
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MatrixIT World Enterprise Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SAP Fiori Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">MatrixIT World</h1>
                  <p className="text-sm text-gray-500">Enterprise Dashboard</p>
                </div>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications, reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              <p className="text-gray-600">Real-time insights across all business operations</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Alerts & Notifications</h3>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 ${
                        alert.type === 'warning' ? 'text-orange-600' :
                        alert.type === 'error' ? 'text-red-600' :
                        alert.type === 'success' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {alert.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        {alert.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                        {alert.type === 'success' && <CheckCircle className="w-5 h-5" />}
                        {alert.type === 'info' && <Bell className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Grid - Enterprise Style */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {enterpriseKPIs.map((kpi) => (
              <div key={kpi.id} className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${getStatusColor(kpi.status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  {getTrendIcon(kpi.trend)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h4>
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                    {kpi.target && (
                      <span className="text-sm text-gray-500">/ {kpi.target}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      kpi.trend === 'up' ? 'text-green-600' : 
                      kpi.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {kpi.change}
                    </span>
                    {kpi.description && (
                      <span className="text-xs text-gray-500">{kpi.description}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fiori Navigation Tiles */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fioriTiles.map((tile) => (
              <Link key={tile.id} href={tile.href}>
                <div className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                  tile.size === 'large' ? 'sm:col-span-2' : 
                  tile.size === 'small' ? '' : ''
                }`}>
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="p-3 rounded-lg group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${tile.color}15`, color: tile.color }}
                    >
                      <tile.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {tile.title}
                      </h4>
                      <p className="text-sm text-gray-600">{tile.subtitle}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  {tile.value && (
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{tile.value}</span>
                      {tile.target && (
                        <span className="text-sm text-gray-500">Target: {tile.target}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Plus, label: 'New Sale', href: '/retail1/matrixitworld/sales/new' },
              { icon: Package, label: 'Add Product', href: '/retail1/matrixitworld/inventory/new' },
              { icon: Users, label: 'New Customer', href: '/retail1/matrixitworld/customers/new' },
              { icon: Calculator, label: 'Generate Report', href: '/retail1/matrixitworld/reports' },
              { icon: MapPin, label: 'Branch Status', href: '/retail1/matrixitworld/branches' },
              { icon: Settings, label: 'Settings', href: '/retail1/matrixitworld/settings' }
            ].map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                  <action.icon className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}