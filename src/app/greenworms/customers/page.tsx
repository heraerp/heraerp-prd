'use client'

/**
 * Greenworms ERP - Customers Overview
 * SAP S/4HANA inspired tile-based customer management
 * 
 * Module: CUSTOMER_MANAGEMENT
 * Entity: CUSTOMER
 * Smart Code: HERA.WASTE.MASTER.ENTITY.CUSTOMER.v1
 * Description: Waste collection customers with enterprise-grade design
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import GreenwormNavbar from '@/components/greenworms/GreenwormNavbar'
import { 
  AlertCircle,
  ArrowUpRight,
  Building,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Filter,
  Home,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Recycle,
  Route,
  Save,
  Search,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  Users,
  X
} from 'lucide-react'

/**
 * Customer Entity Interface with Dynamic Fields
 */
interface Customer {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  created_at?: string
  updated_at?: string
  
  // Dynamic fields from core_dynamic_data
  customer_type?: string
  billing_email?: string
  phone?: string
  contract_type?: string
  billing_terms?: string
  geo_location?: string
  service_level?: string
  route_code?: string
  units?: number
  monthly_waste?: string
}

/**
 * Customer Type Icons and Colors
 */
const getCustomerTypeConfig = (type: string) => {
  const configs = {
    'Residential Complex': { icon: Home, color: '#16a34a', bg: 'bg-green-50' },
    'Residential Community': { icon: Home, color: '#16a34a', bg: 'bg-green-50' },
    'Commercial': { icon: Building2, color: '#0891b2', bg: 'bg-cyan-50' },
    'Commercial Complex': { icon: Building2, color: '#0891b2', bg: 'bg-cyan-50' },
    'Commercial Office': { icon: Building, color: '#0f766e', bg: 'bg-teal-50' },
    'Shopping Mall': { icon: Building2, color: '#7c3aed', bg: 'bg-purple-50' },
    'Government': { icon: Building, color: '#dc2626', bg: 'bg-red-50' },
    'Airport/Transport': { icon: Truck, color: '#ea580c', bg: 'bg-orange-50' },
    'default': { icon: Building, color: '#6b7280', bg: 'bg-gray-50' }
  }
  return configs[type as keyof typeof configs] || configs.default
}

/**
 * Service Level Badge Colors
 */
const getServiceLevelColor = (level: string) => {
  const colors = {
    'Premium': 'bg-yellow-100 text-yellow-800',
    'Enterprise': 'bg-blue-100 text-blue-800', 
    'Standard': 'bg-gray-100 text-gray-800',
    'Municipal': 'bg-green-100 text-green-800',
    'Corporate': 'bg-purple-100 text-purple-800',
    'Critical Infrastructure': 'bg-red-100 text-red-800'
  }
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

/**
 * Greenworms Customers Overview - SAP S/4HANA Style
 */
export default function CustomersPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles')
  const [showAddModal, setShowAddModal] = useState(false)

  // Redirect to Greenworms login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/greenworms/login')
    }
  }, [isAuthenticated, router])

  // Use the universal entity hook
  const {
    entities: customers,
    loading,
    error,
    refresh
  } = useUniversalEntity({
    entityType: 'CUSTOMER',
    organizationId: currentOrganization?.id,
    includeRelationships: false,
    includeDynamicData: true
  }) as { entities: Customer[], loading: boolean, error: any, refresh: () => void }

  // Filter customers based on search and type
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.geo_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customer_type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedFilter === 'all') return matchesSearch
    return matchesSearch && customer.customer_type === selectedFilter
  })

  // Get unique customer types for filter dropdown
  const customerTypes = Array.from(new Set(customers.map(c => c.customer_type).filter(Boolean)))

  // Calculate KPIs
  const totalCustomers = customers.length
  const totalWasteThisMonth = customers.reduce((sum, customer) => {
    const waste = customer.monthly_waste?.match(/[\d.]+/)
    return sum + (waste ? parseFloat(waste[0]) : 0)
  }, 0)
  const averageUnits = customers.reduce((sum, customer) => sum + (customer.units || 0), 0) / customers.length

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Login</h2>
          <p className="text-gray-600">Please wait while we redirect you to the Greenworms login page.</p>
        </div>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Required</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enterprise Navigation */}
      <GreenwormNavbar />

      {/* Page Header - SAP S/4HANA Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                Customers Overview
              </h1>
              <p className="text-gray-600 mt-1">
                Manage waste collection customers and service agreements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/greenworms/customers/new')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <Recycle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Waste</p>
                <p className="text-2xl font-bold text-gray-900">{totalWasteThisMonth.toFixed(1)} tons</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Units/Customer</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(averageUnits)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100">
                <Route className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(customers.map(c => c.route_code).filter(Boolean)).size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Types</option>
                {customerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <button
                onClick={() => setViewMode(viewMode === 'tiles' ? 'list' : 'tiles')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {viewMode === 'tiles' ? 'List View' : 'Tile View'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading customers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700">Error loading customers: {error.message}</p>
            </div>
          </div>
        )}

        {/* Customer Tiles Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCustomers.map((customer) => {
              const typeConfig = getCustomerTypeConfig(customer.customer_type || '')
              const TypeIcon = typeConfig.icon

              return (
                <div
                  key={customer.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-green-300 cursor-pointer"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${typeConfig.bg}`}>
                        <TypeIcon className="h-6 w-6" style={{ color: typeConfig.color }} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {customer.entity_name}
                    </h3>

                    {/* Customer Type Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {customer.customer_type}
                      </span>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location
                        </span>
                        <span className="font-medium text-gray-900">{customer.geo_location}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          Route
                        </span>
                        <span className="font-medium text-gray-900">{customer.route_code}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Recycle className="h-3 w-3" />
                          Monthly Waste
                        </span>
                        <span className="font-medium text-gray-900">{customer.monthly_waste}</span>
                      </div>
                    </div>

                    {/* Service Level */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceLevelColor(customer.service_level || '')}`}>
                        {customer.service_level}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      {customer.billing_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{customer.billing_email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                      <button className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                        View Details
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by adding your first customer.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          </div>
        )}

        {/* Bottom Spacing for Mobile */}
        <div className="h-24 md:h-0" />
      </div>
    </div>
  )
}
