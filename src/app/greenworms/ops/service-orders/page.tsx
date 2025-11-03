'use client'

/**
 * Greenworms Service Orders List Page
 * Smart Code: HERA.GREENWORMS.OPS.SERVICE_ORDERS.LIST.v1
 * 
 * Service orders listing with filtering, search, and CRUD operations
 */

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import GreenwormOpsNavbar from '@/components/greenworms/GreenwormOpsNavbar'
import { MobileCard } from '@/components/mobile/MobileCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Plus,
  Filter,
  RefreshCw,
  Calendar,
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package2,
  User,
  Phone,
  FileText,
  Edit,
  Trash2,
  Eye,
  MoreVertical
} from 'lucide-react'

/**
 * Service Order Interface
 */
interface ServiceOrder {
  id: string
  entity_name: string
  entity_code?: string
  organization_id: string
  smart_code: string
  status?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  // Dynamic fields
  customer_name?: string
  service_type?: string
  pickup_address?: string
  pickup_date?: string
  pickup_time?: string
  driver_name?: string
  vehicle_number?: string
  waste_type?: string
  estimated_weight?: number
  priority?: string
  special_instructions?: string
}

/**
 * Service Orders List Component
 */
export default function ServiceOrdersPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)

  // HERA Universal Entity Integration for service orders
  const serviceOrdersData = useUniversalEntity({
    entity_type: 'SERVICE_ORDER',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      ...(statusFilter !== 'all' && { status: statusFilter })
    },
    dynamicFields: [
      { name: 'customer_name', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.CUSTOMER_NAME.v1', required: true },
      { name: 'service_type', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.SERVICE_TYPE.v1', required: true },
      { name: 'pickup_address', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.PICKUP_ADDRESS.v1', required: true },
      { name: 'pickup_date', type: 'date', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.PICKUP_DATE.v1', required: true },
      { name: 'pickup_time', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.PICKUP_TIME.v1', required: false },
      { name: 'driver_name', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.DRIVER_NAME.v1', required: false },
      { name: 'vehicle_number', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.VEHICLE_NUMBER.v1', required: false },
      { name: 'waste_type', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.WASTE_TYPE.v1', required: false },
      { name: 'estimated_weight', type: 'number', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.ESTIMATED_WEIGHT.v1', required: false },
      { name: 'priority', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.PRIORITY.v1', required: false },
      { name: 'special_instructions', type: 'text', smart_code: 'HERA.GREENWORMS.SERVICE_ORDER.SPECIAL_INSTRUCTIONS.v1', required: false }
    ]
  })

  // Filter service orders based on search query
  const filteredOrders = (serviceOrdersData.data || []).filter((order: ServiceOrder) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      order.entity_name?.toLowerCase().includes(searchLower) ||
      order.entity_code?.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.pickup_address?.toLowerCase().includes(searchLower) ||
      order.service_type?.toLowerCase().includes(searchLower)
    )
  })

  // Refresh service orders data
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await serviceOrdersData.refetch()
      setTimeout(() => setRefreshing(false), 1000)
    } catch (error) {
      console.error('❌ Error refreshing service orders:', error)
      setRefreshing(false)
    }
  }

  // Create sample service order for testing
  const createSampleOrder = async () => {
    try {
      const sampleOrder = await serviceOrdersData.createEntity({
        entity_type: 'SERVICE_ORDER',
        entity_name: `Collection Request #${Date.now()}`,
        smart_code: 'HERA.GREENWORMS.OPS.SERVICE_ORDER.v1',
        status: 'pending',
        dynamic_fields: {
          customer_name: 'ACME Waste Management',
          service_type: 'Regular Collection',
          pickup_address: '123 Business District, Dubai',
          pickup_date: new Date().toISOString().split('T')[0],
          pickup_time: '09:00',
          waste_type: 'Mixed Commercial Waste',
          estimated_weight: 150,
          priority: 'medium',
          special_instructions: 'Please call reception upon arrival'
        }
      })
      
      console.log('✅ Sample service order created:', sampleOrder)
      await serviceOrdersData.refetch()
    } catch (error) {
      console.error('❌ Error creating sample order:', error)
    }
  }

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status icon
  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'assigned': return <User className="w-3 h-3" />
      case 'in_progress': return <Truck className="w-3 h-3" />
      case 'completed': return <CheckCircle className="w-3 h-3" />
      case 'cancelled': return <AlertTriangle className="w-3 h-3" />
      default: return <Package2 className="w-3 h-3" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p>Please log in to access Service Orders.</p>
        </div>
      </div>
    )
  }

  if (serviceOrdersData.contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading Service Orders...</p>
        </div>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p>No organization context found. Please select an organization.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Operations Secondary Navigation */}
      <GreenwormOpsNavbar />
      
      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Service Orders</h1>
            <p className="text-sm text-gray-600">
              Manage waste collection service orders
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                onClick={createSampleOrder}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Package2 className="w-4 h-4 mr-2" />
                Create Sample
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/greenworms/ops/service-orders/new'}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MobileCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviceOrdersData.data?.length || 0}
                </p>
              </div>
              <Package2 className="w-8 h-8 text-blue-500" />
            </div>
          </MobileCard>

          <MobileCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {serviceOrdersData.data?.filter((o: ServiceOrder) => o.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </MobileCard>

          <MobileCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {serviceOrdersData.data?.filter((o: ServiceOrder) => o.status === 'in_progress').length || 0}
                </p>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </MobileCard>

          <MobileCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {serviceOrdersData.data?.filter((o: ServiceOrder) => o.status === 'completed').length || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </MobileCard>
        </div>

        {/* Service Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <MobileCard className="p-8 text-center">
              <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Orders Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by creating your first service order.'
                }
              </p>
              <Button
                onClick={() => window.location.href = '/greenworms/ops/service-orders/new'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Service Order
              </Button>
            </MobileCard>
          ) : (
            filteredOrders.map((order: ServiceOrder) => (
              <MobileCard key={order.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {order.entity_name || `Order #${order.entity_code}`}
                      </h3>
                      <Badge className={`text-xs ${getStatusColor(order.status)} border`}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span>{order.status || 'Pending'}</span>
                        </span>
                      </Badge>
                      {order.priority && (
                        <Badge className={`text-xs ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      {order.customer_name && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{order.customer_name}</span>
                        </div>
                      )}
                      {order.pickup_address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{order.pickup_address}</span>
                        </div>
                      )}
                      {order.pickup_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.pickup_date)}</span>
                          {order.pickup_time && <span>at {order.pickup_time}</span>}
                        </div>
                      )}
                      {order.service_type && (
                        <div className="flex items-center space-x-2">
                          <Package2 className="w-4 h-4" />
                          <span>{order.service_type}</span>
                        </div>
                      )}
                    </div>

                    {order.driver_name && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Driver:</span> {order.driver_name}
                        {order.vehicle_number && <span> • Vehicle: {order.vehicle_number}</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/greenworms/ops/service-orders/${order.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/greenworms/ops/service-orders/${order.id}/edit`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {order.special_instructions && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions:</p>
                        <p className="text-xs text-yellow-700">{order.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </MobileCard>
            ))
          )}
        </div>
      </div>
    </div>
  )
}