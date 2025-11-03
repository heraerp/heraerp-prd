'use client'

/**
 * MatrixIT World ERP - Customer Management (Enterprise)
 * SAP Fiori Design System Implementation
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.CUSTOMERS.ENTERPRISE.v1
 * 
 * Enterprise-grade customer management with Fiori design patterns
 */

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEntities, useEntity, useUpsertEntity, useDeleteEntity } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { 
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
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
  X
} from 'lucide-react'

// Enterprise interfaces following Fiori standards
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  customerType: 'individual' | 'business'
  creditLimit: number
  totalOrders: number
  totalRevenue: number
  lastOrderDate: string
  status: 'active' | 'inactive' | 'blocked'
  rating: number
  preferredBranch: string
  joinDate: string
}

interface CustomerFilter {
  status: string
  customerType: string
  branch: string
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const ENTITY_TYPE = 'CUSTOMER'
const SMART_CODE_BASE = 'HERA.RETAIL.CUSTOMERS.CUSTOMER'

export default function MatrixITWorldCustomersEnterprise() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Filters state
  const [filters, setFilters] = useState<CustomerFilter>({
    status: 'all',
    customerType: 'all',
    branch: 'all',
    searchTerm: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // Authentication check
  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/retail1/matrixitworld/login')
    }
  }, [isAuthenticated, contextLoading, router])

  // HERA Entity hooks
  const {
    entities: customers,
    loading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useEntities({
    entityType: ENTITY_TYPE,
    organizationId: organization?.id,
    includeDeleted: false
  })

  const { upsertEntity: upsertCustomer, loading: upsertLoading } = useUpsertEntity()
  const { deleteEntity: deleteCustomer, loading: deleteLoading } = useDeleteEntity()

  // Initialize branding
  useEffect(() => {
    if (organization?.id) {
      brandingEngine.initializeBranding(organization.id)
    }
  }, [organization?.id])

  // Sample data for demo - replace with real data from HERA entities
  const sampleCustomers: Customer[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 9876543210',
      address: 'MG Road, Kochi',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682001',
      customerType: 'individual',
      creditLimit: 50000,
      totalOrders: 12,
      totalRevenue: 185000,
      lastOrderDate: '2024-10-25',
      status: 'active',
      rating: 4.5,
      preferredBranch: 'Kochi Main',
      joinDate: '2023-05-15'
    },
    {
      id: '2',
      name: 'TechCorp Solutions Pvt Ltd',
      email: 'procurement@techcorp.com',
      phone: '+91 9123456789',
      address: 'Infopark, Kakkanad',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682030',
      customerType: 'business',
      creditLimit: 500000,
      totalOrders: 45,
      totalRevenue: 2850000,
      lastOrderDate: '2024-10-28',
      status: 'active',
      rating: 4.8,
      preferredBranch: 'Kochi Main',
      joinDate: '2022-08-20'
    },
    {
      id: '3',
      name: 'Priya Nair',
      email: 'priya.nair@gmail.com',
      phone: '+91 8765432109',
      address: 'Civil Lines Road, Thrissur',
      city: 'Thrissur',
      state: 'Kerala',
      pincode: '680001',
      customerType: 'individual',
      creditLimit: 25000,
      totalOrders: 8,
      totalRevenue: 95000,
      lastOrderDate: '2024-10-20',
      status: 'active',
      rating: 4.2,
      preferredBranch: 'Thrissur',
      joinDate: '2024-01-10'
    }
  ]

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let filtered = sampleCustomers.filter(customer => {
      // Status filter
      if (filters.status !== 'all' && customer.status !== filters.status) return false
      
      // Customer type filter
      if (filters.customerType !== 'all' && customer.customerType !== filters.customerType) return false
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        return (
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(searchLower)
        )
      }
      
      return true
    })

    // Sort customers
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'revenue':
          aValue = a.totalRevenue
          bValue = b.totalRevenue
          break
        case 'orders':
          aValue = a.totalOrders
          bValue = b.totalOrders
          break
        case 'joinDate':
          aValue = new Date(a.joinDate).getTime()
          bValue = new Date(b.joinDate).getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
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
    await refetchCustomers()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDetail(true)
  }

  const handleFilterChange = (key: keyof CustomerFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCustomerTypeIcon = (type: string) => {
    return type === 'business' ? Building2 : Users
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Customer Management...</p>
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
              <span className="font-medium text-gray-900">Customer Management</span>
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
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                <p className="text-gray-600">Manage customer relationships and data</p>
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
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+5.2% from last month</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">1,187</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+2.1% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">₹15,420</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+8.3% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">47</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+12.5% from last month</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer List</h3>
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
              placeholder="Search customers by name, email, or phone..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                <select
                  value={filters.customerType}
                  onChange={(e) => handleFilterChange('customerType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="revenue">Revenue</option>
                  <option value="orders">Orders</option>
                  <option value="joinDate">Join Date</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredCustomers.length} of {sampleCustomers.length} customers
            </p>
            {selectedCustomers.length > 0 && (
              <p className="text-sm font-medium text-blue-600">
                {selectedCustomers.length} customer(s) selected
              </p>
            )}
          </div>
        </div>

        {/* Customer Table/Cards */}
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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const CustomerTypeIcon = getCustomerTypeIcon(customer.customerType)
                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleCustomerClick(customer)}
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
                              <span className="text-sm font-medium text-blue-600">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.preferredBranch}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.email}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CustomerTypeIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 capitalize">{customer.customerType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(customer.status)}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{customer.totalRevenue.toLocaleString()}
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
              {filteredCustomers.map((customer) => {
                const CustomerTypeIcon = getCustomerTypeIcon(customer.customerType)
                return (
                  <div
                    key={customer.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(customer.status)}`}>
                        {customer.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{customer.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <CustomerTypeIcon className="w-4 h-4 mr-1" />
                      <span className="capitalize">{customer.customerType}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.totalOrders}</p>
                        <p className="text-xs text-gray-500">Orders</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">₹{(customer.totalRevenue / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </div>
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
              <span className="font-medium">{filteredCustomers.length}</span> results
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

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => setShowCustomerDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-medium text-blue-600">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-gray-600 capitalize">{selectedCustomer.customerType} Customer</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <span>{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Credit Limit:</span>
                        <span className="ml-2 font-medium">₹{selectedCustomer.creditLimit.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.totalOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="ml-2 font-medium">₹{selectedCustomer.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Customer Since:</span>
                        <span className="ml-2 font-medium">{new Date(selectedCustomer.joinDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Preferred Branch:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.preferredBranch}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit Customer
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Orders
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