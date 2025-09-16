'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NewOrderForm } from './NewOrderForm'
import {
  UniversalErrorBoundary,
  UniversalInlineLoading,
  UniversalCardSkeleton,
  UniversalErrorDisplay,
  useLoadingState,
  createUniversalAPIClient
} from '@/components/universal'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  MapPin,
  Plus,
  Eye,
  Printer
} from 'lucide-react'

// Initialize Universal API Client
const api = createUniversalAPIClient({
  baseUrl: '/api/v1',
  retries: { maxRetries: 1, retryDelay: 500 }, // Reduced retries for faster failure
  cache: { ttl: 3000 }, // 3 second cache for order updates
  onError: error => console.error('Order Manager API Error:', error)
})

// Order interface (maps to universal_transactions + universal_transaction_lines)
interface OrderItem {
  id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  line_total: number
  special_instructions?: string
  modifications?: string[]
}

interface Order {
  id: string
  reference_number: string // transaction reference
  transaction_type: 'dine_in' | 'takeout' | 'delivery'
  customer_name?: string
  table_number?: string
  phone?: string
  address?: string
  order_time: Date
  estimated_ready_time: Date
  status: 'pending' | 'processing' | 'approved' | 'completed' | 'cancelled'
  total_amount: number
  payment_status: 'pending' | 'paid' | 'refunded'
  server_name?: string
  items: OrderItem[]
  special_notes?: string
}

export function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const { isLoading: isLoadingOrders, error, withLoading, clearError } = useLoadingState()

  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Load orders using universal API
  const loadOrders = async () => {
    const result = await withLoading(async () => {
      return await api.get('/transactions?transaction_type=order&include_lines=true&limit=100')
    })

    if (result?.success && result.data && Array.isArray(result.data)) {
      console.log('🍽️ Orders loaded from universal API:', result.data.length)
      // Transform universal transaction data to order format
      const transformedOrders = result.data.map((transaction: any) => ({
        id: transaction.id,
        reference_number:
          transaction.reference_number || `#${transaction.id.slice(-6).toUpperCase()}`,
        transaction_type: transaction.transaction_data?.order_type || 'dine_in',
        customer_name: transaction.transaction_data?.customer_name || 'Walk-in Customer',
        table_number: transaction.transaction_data?.table_number || 'Table 1',
        phone: transaction.transaction_data?.phone || null,
        address: transaction.transaction_data?.address || null,
        order_time: new Date(transaction.transaction_date),
        estimated_ready_time: new Date(
          new Date(transaction.transaction_date).getTime() + 20 * 60000
        ),
        status: transaction.status,
        total_amount: transaction.total_amount || 0,
        payment_status: transaction.transaction_data?.payment_status || 'pending',
        server_name: transaction.transaction_data?.server_name || 'Server',
        items:
          transaction.lines?.map((line: any) => ({
            id: line.id,
            menu_item_name: line.entity_name || line.line_description,
            quantity: line.quantity || 0,
            unit_price: line.unit_price || 0,
            line_total: line.line_total || 0,
            special_instructions: line.line_data?.special_instructions || null,
            modifications: line.line_data?.modifications || []
          })) || [],
        special_notes: transaction.notes
      }))

      setOrders(transformedOrders)
    }
  }

  useEffect(() => {
    loadOrders()

    // Refresh orders every 10 seconds
    const ordersTimer = setInterval(loadOrders, 10000)
    return () => clearInterval(ordersTimer)
  }, [])

  // Filter orders by status
  const filteredOrders = orders.filter(
    order => selectedStatus === 'all' || order.status === selectedStatus
  )

  // Sort orders by status priority and time
  const sortedOrders = filteredOrders.sort((a, b) => {
    const statusPriority = { approved: 0, processing: 1, pending: 2, completed: 3, cancelled: 4 }
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status]
    if (priorityDiff !== 0) return priorityDiff

    // Handle null/undefined order_time safely
    if (!a.order_time || !b.order_time) return 0

    // Convert to Date objects if they're strings
    const aTime = typeof a.order_time === 'string' ? new Date(a.order_time) : a.order_time
    const bTime = typeof b.order_time === 'string' ? new Date(b.order_time) : b.order_time

    // Additional safety check for invalid dates
    if (isNaN(aTime.getTime()) || isNaN(bTime.getTime())) return 0

    return aTime.getTime() - bTime.getTime()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'completed':
        return 'bg-muted text-gray-200 border-border'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />
      case 'processing':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in':
        return <User className="w-4 h-4" />
      case 'takeout':
        return <Plus className="w-4 h-4" />
      case 'delivery':
        return <MapPin className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown'

    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid date'

    const diffMs = currentTime.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 min ago'
    if (diffMins < 60) return `${diffMins} mins ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    return `${diffHours} hours ago`
  }

  const getTimeUntilReady = (readyTime: Date | string | null | undefined) => {
    if (!readyTime) return 'Unknown'

    const readyTimeObj = typeof readyTime === 'string' ? new Date(readyTime) : readyTime
    if (isNaN(readyTimeObj.getTime())) return 'Invalid time'

    const diffMs = readyTimeObj.getTime() - currentTime.getTime()
    const diffMins = Math.ceil(diffMs / 60000)

    if (diffMins <= 0) return 'Ready now!'
    if (diffMins === 1) return '1 min'
    return `${diffMins} mins`
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log('🍽️ Order Manager: Updating order status', { orderId, newStatus })

    const result = await withLoading(async () => {
      console.log('📡 Making API call to /transactions (Order Manager)')
      return await api.put('/transactions', {
        id: orderId,
        status: newStatus
      })
    })

    console.log('📥 Order Manager API Response:', result)

    if (result?.success) {
      console.log('✅ Order status updated successfully (Order Manager)')
      // Update local state
      setOrders(prev =>
        prev.map(order => (order.id === orderId ? { ...order, status: newStatus as any } : order))
      )
      // Reload orders to get fresh data
      setTimeout(() => loadOrders(), 1000)
    } else {
      console.error('❌ Failed to update order status (Order Manager):', result)
    }
  }

  // Get status counts for filter tabs
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    approved: orders.filter(o => o.status === 'approved').length,
    completed: orders.filter(o => o.status === 'completed').length
  }

  return (
    <UniversalErrorBoundary>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 mb-2">Order Management</h1>
              <p className="text-muted-foreground">
                Real-time order tracking using HERA's universal transaction system
              </p>
            </div>
            <Button
              onClick={() => setShowNewOrderForm(true)}
              className="bg-green-600 hover:bg-green-700 text-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <UniversalErrorDisplay message={error} onDismiss={clearError} onRetry={loadOrders} />
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-muted p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: 'All Orders', count: statusCounts.all },
              { key: 'pending', label: 'Pending', count: statusCounts.pending },
              { key: 'processing', label: 'Processing', count: statusCounts.processing },
              { key: 'approved', label: 'Ready', count: statusCounts.approved },
              { key: 'completed', label: 'Completed', count: statusCounts.completed }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedStatus === tab.key
                    ? 'bg-background text-gray-100 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedOrders.map(order => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getOrderTypeIcon(order.transaction_type)}
                    <span className="font-semibold text-gray-100">{order.reference_number}</span>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                    {getStatusIcon(order.status)}
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{order.customer_name}</p>
                  {order.table_number && <p>{order.table_number}</p>}
                  {order.phone && <p>{order.phone}</p>}
                  {order.address && <p>{order.address}</p>}
                </div>
              </div>

              {/* Order Details */}
              <div className="p-4">
                {/* Timing Info */}
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-muted-foreground">Ordered: {formatTimeAgo(order.order_time)}</span>
                  <span
                    className={`font-medium ${
                      order.status === 'approved' ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {order.status === 'approved'
                      ? 'Ready!'
                      : getTimeUntilReady(order.estimated_ready_time)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="text-gray-100">
                          {item.quantity || 0}x {item.menu_item_name || 'Unknown Item'}
                        </span>
                        {item.modifications && item.modifications.length > 0 && (
                          <div className="text-xs text-primary mt-1">
                            Mods: {item.modifications.join(', ')}
                          </div>
                        )}
                        {item.special_instructions && (
                          <div className="text-xs text-orange-600 mt-1">
                            Note: {item.special_instructions}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-700 font-medium ml-2">
                        ${(item.line_total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Special Notes */}
                {order.special_notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> {order.special_notes}
                    </p>
                  </div>
                )}

                {/* Total and Payment */}
                <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-100">
                    Total: ${(order.total_amount || 0).toFixed(2)}
                  </span>
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {order.payment_status}
                  </Badge>
                </div>

                {/* Server Info */}
                {order.server_name && (
                  <p className="text-xs text-muted-foreground mb-4">Server: {order.server_name}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Start Processing
                    </Button>
                  )}
                  {order.status === 'processing' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-gray-600 hover:bg-muted-foreground/10"
                    >
                      Complete Order
                    </Button>
                  )}

                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedOrders.length === 0 && (
          <Card className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-gray-100 mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {selectedStatus === 'all'
                ? 'No orders yet today. Orders will appear here as they come in.'
                : `No ${selectedStatus} orders at the moment.`}
            </p>
          </Card>
        )}

        {/* Universal Architecture Info */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Universal Transaction System
            </h3>
            <p className="text-sm text-green-800 mb-4">
              This order management system uses HERA's universal transaction architecture:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-green-700">
              <div className="bg-background/50 p-3 rounded-lg">
                <strong>universal_transactions</strong>
                <br />
                Each order is a transaction with type "order", storing header info like customer,
                total, status
              </div>
              <div className="bg-background/50 p-3 rounded-lg">
                <strong>universal_transaction_lines</strong>
                <br />
                Order items stored as transaction lines with quantity, price, modifications
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4">
              Same table structure handles orders, payments, inventory purchases, and payroll
            </p>
          </div>
        </Card>

        {/* New Order Form Modal */}
        {showNewOrderForm && (
          <NewOrderForm
            onOrderCreated={() => {
              loadOrders() // Refresh orders list
            }}
            onClose={() => setShowNewOrderForm(false)}
          />
        )}
      </div>
    </UniversalErrorBoundary>
  )
}
