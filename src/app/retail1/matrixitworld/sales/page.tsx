'use client'

/**
 * MatrixIT World ERP - Sales Management (Enterprise)
 * SAP Fiori Design System Implementation
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.SALES.ENTERPRISE.v1
 * 
 * Enterprise-grade sales management with Fiori design patterns
 */

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEntities, useEntity, useUpsertEntity, useDeleteEntity } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { 
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Building2,
  CreditCard,
  Star,
  Activity,
  FileText,
  Bell,
  X,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Target,
  BarChart3
} from 'lucide-react'

// Enterprise interfaces following Fiori standards
interface SalesOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderDate: string
  deliveryDate: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  totalAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
  branch: string
  salesRep: string
  itemCount: number
  category: 'pc' | 'mobile' | 'accessories' | 'components'
  customerType: 'individual' | 'business'
}

interface SalesFilter {
  status: string
  paymentStatus: string
  priority: string
  branch: string
  category: string
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateRange: string
}

const ENTITY_TYPE = 'SALES_ORDER'
const SMART_CODE_BASE = 'HERA.RETAIL.SALES.ORDER'

export default function MatrixITWorldSalesEnterprise() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Filters state
  const [filters, setFilters] = useState<SalesFilter>({
    status: 'all',
    paymentStatus: 'all',
    priority: 'all',
    branch: 'all',
    category: 'all',
    searchTerm: '',
    sortBy: 'orderDate',
    sortOrder: 'desc',
    dateRange: 'all'
  })

  // Authentication check
  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/retail1/matrixitworld/login')
    }
  }, [isAuthenticated, contextLoading, router])

  // HERA Entity hooks
  const {
    entities: orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useEntities({
    entityType: ENTITY_TYPE,
    organizationId: organization?.id,
    includeDeleted: false
  })

  const { upsertEntity: upsertOrder, loading: upsertLoading } = useUpsertEntity()
  const { deleteEntity: deleteOrder, loading: deleteLoading } = useDeleteEntity()

  // Initialize branding
  useEffect(() => {
    if (organization?.id) {
      brandingEngine.initializeBranding(organization.id)
    }
  }, [organization?.id])

  // Sample data for demo - replace with real data from HERA entities
  const sampleOrders: SalesOrder[] = [
    {
      id: '1',
      orderNumber: 'SO-2024-001',
      customerName: 'Rajesh Kumar',
      customerEmail: 'rajesh.kumar@email.com',
      customerPhone: '+91 9876543210',
      orderDate: '2024-10-28',
      deliveryDate: '2024-11-02',
      status: 'confirmed',
      priority: 'high',
      totalAmount: 85000,
      paymentStatus: 'paid',
      branch: 'Kochi Main',
      salesRep: 'Priya Nair',
      itemCount: 3,
      category: 'pc',
      customerType: 'business'
    },
    {
      id: '2',
      orderNumber: 'SO-2024-002',
      customerName: 'TechCorp Solutions',
      customerEmail: 'orders@techcorp.com',
      customerPhone: '+91 9123456789',
      orderDate: '2024-10-27',
      deliveryDate: '2024-11-01',
      status: 'processing',
      priority: 'urgent',
      totalAmount: 245000,
      paymentStatus: 'partial',
      branch: 'Kochi Main',
      salesRep: 'Arjun Menon',
      itemCount: 12,
      category: 'pc',
      customerType: 'business'
    },
    {
      id: '3',
      orderNumber: 'SO-2024-003',
      customerName: 'Sunitha Pillai',
      customerEmail: 'sunitha.pillai@gmail.com',
      customerPhone: '+91 8765432109',
      orderDate: '2024-10-26',
      deliveryDate: '2024-10-30',
      status: 'shipped',
      priority: 'medium',
      totalAmount: 42000,
      paymentStatus: 'paid',
      branch: 'Thrissur',
      salesRep: 'Deepak Raj',
      itemCount: 2,
      category: 'mobile',
      customerType: 'individual'
    },
    {
      id: '4',
      orderNumber: 'SO-2024-004',
      customerName: 'Digital Media Hub',
      customerEmail: 'procurement@dmhub.com',
      customerPhone: '+91 7654321098',
      orderDate: '2024-10-25',
      deliveryDate: '2024-11-05',
      status: 'pending',
      priority: 'low',
      totalAmount: 125000,
      paymentStatus: 'pending',
      branch: 'Kozhikode',
      salesRep: 'Maya Thomas',
      itemCount: 8,
      category: 'components',
      customerType: 'business'
    }
  ]

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let filtered = sampleOrders.filter(order => {
      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) return false
      
      // Payment status filter
      if (filters.paymentStatus !== 'all' && order.paymentStatus !== filters.paymentStatus) return false
      
      // Priority filter
      if (filters.priority !== 'all' && order.priority !== filters.priority) return false
      
      // Branch filter
      if (filters.branch !== 'all' && order.branch !== filters.branch) return false
      
      // Category filter
      if (filters.category !== 'all' && order.category !== filters.category) return false
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        return (
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.customerEmail.toLowerCase().includes(searchLower) ||
          order.salesRep.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })

    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (filters.sortBy) {
        case 'orderNumber':
          aValue = a.orderNumber.toLowerCase()
          bValue = b.orderNumber.toLowerCase()
          break
        case 'customerName':
          aValue = a.customerName.toLowerCase()
          bValue = b.customerName.toLowerCase()
          break
        case 'totalAmount':
          aValue = a.totalAmount
          bValue = b.totalAmount
          break
        case 'orderDate':
          aValue = new Date(a.orderDate).getTime()
          bValue = new Date(b.orderDate).getTime()
          break
        default:
          aValue = new Date(a.orderDate).getTime()
          bValue = new Date(b.orderDate).getTime()
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [filters])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchOrders()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleOrderClick = (order: SalesOrder) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }

  const handleFilterChange = (key: keyof SalesFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partial':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pc': return Building2
      case 'mobile': return Phone
      case 'accessories': return Package
      case 'components': return Settings
      default: return Package
    }
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Sales Management...</p>
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
            {/* Left side - Breadcrumb */}
            <div className="flex items-center space-x-4">
              <Link href="/retail1/matrixitworld/dashboard" className="text-blue-600 hover:text-blue-700">
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">Sales Management</span>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/retail1/matrixitworld/dashboard">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
                <p className="text-gray-600">Manage customer orders and sales operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+8.2% from last month</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue (MTD)</p>
                <p className="text-2xl font-bold text-gray-900">₹42.5L</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+15.3% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">₹34,150</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+4.7% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 ml-1">-2 from yesterday</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Orders</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
                  showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by number, customer, or sales rep..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Branches</option>
                  <option value="Kochi Main">Kochi Main</option>
                  <option value="Thrissur">Thrissur</option>
                  <option value="Kozhikode">Kozhikode</option>
                  <option value="Kottayam">Kottayam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="orderDate">Order Date</option>
                  <option value="orderNumber">Order Number</option>
                  <option value="customerName">Customer</option>
                  <option value="totalAmount">Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {sampleOrders.length} orders
            </p>
            {selectedOrders.length > 0 && (
              <p className="text-sm font-medium text-blue-600">
                {selectedOrders.length} order(s) selected
              </p>
            )}
          </div>
        </div>

        {/* Sales Orders Table/Cards */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const CategoryIcon = getCategoryIcon(order.category)
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleOrderClick(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <CategoryIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                              <div className="text-sm text-gray-500">{order.orderDate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-700">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-700">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredOrders.map((order) => {
                const CategoryIcon = getCategoryIcon(order.category)
                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CategoryIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600 mb-2">{order.customerName}</p>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <div className="flex items-center justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Items:</span>
                        <span className="font-medium">{order.itemCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Branch:</span>
                        <span className="font-medium">{order.branch}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
              <span className="font-medium">{filteredOrders.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Date:</span>
                        <span className="font-medium">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(selectedOrder.priority)}`}>
                          {selectedOrder.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{selectedOrder.customerEmail}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{selectedOrder.customerPhone}</span>
                      </div>
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="capitalize">{selectedOrder.customerType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Financial Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-lg">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusBadge(selectedOrder.paymentStatus)}`}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Item Count:</span>
                        <span className="font-medium">{selectedOrder.itemCount} items</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium capitalize">{selectedOrder.category}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Operations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branch:</span>
                        <span className="font-medium">{selectedOrder.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sales Rep:</span>
                        <span className="font-medium">{selectedOrder.salesRep}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit Order
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}