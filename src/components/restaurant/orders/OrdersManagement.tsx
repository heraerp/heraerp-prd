'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  StatusIndicator, 
  AnimatedCounter, 
  MetricCard,
  ProgressRing,
  FloatingNotification,
  GlowButton
} from '../JobsStyleMicroInteractions'
import { NewOrderForm } from '../NewOrderForm'
import {
  Clock,
  Users,
  ChefHat,
  MapPin,
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Timer,
  Utensils,
  Coffee,
  Package,
  Star,
  Eye,
  Send,
  Printer,
  Bell,
  Activity,
  TrendingUp,
  ArrowRight,
  Circle,
  Pause,
  Play,
  RotateCw,
  Zap,
  Receipt
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

// Steve Jobs: "Focus is about saying no to the hundred other good ideas"

interface Order {
  id: string
  reference_number: string
  transaction_type: string
  customer_name?: string
  table_number?: string
  phone?: string
  address?: string
  order_time: Date
  estimated_ready_time?: Date
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  server_name?: string
  items: OrderItem[]
  special_notes?: string
  gl_posting?: {
    required: boolean
    journal_entry_created: boolean
    journal_reference?: string
    auto_posted: boolean
  }
  smart_code?: string
}

interface OrderItem {
  id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  line_total: number
  special_instructions?: string
  modifications?: string[]
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Mock real-time stats
  const [stats, setStats] = useState({
    totalOrders: 34,
    activeOrders: 12,
    averageTime: 18,
    totalRevenue: 2840,
    completionRate: 94,
    customerSatisfaction: 4.7
  })

  // Load orders data from universal API
  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/restaurant/orders')
      const result = await response.json()
      
      if (result.success) {
        setOrders(result.data)
        // Update stats based on real data
        const totalRevenue = result.data.reduce((sum: number, order: Order) => sum + (order.total_amount || 0), 0)
        const activeOrders = result.data.filter((order: Order) => 
          ['pending', 'preparing'].includes(order.status)
        ).length
        
        setStats(prev => ({
          ...prev,
          totalOrders: result.data.length,
          activeOrders,
          totalRevenue: Math.round(totalRevenue)
        }))
      } else {
        console.error('Failed to load orders:', result.message)
        setNotificationMessage(`Failed to load orders: ${result.message}`)
        setShowNotification(true)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setNotificationMessage('Error loading orders. Please try again.')
      setShowNotification(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    loadOrders()
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalOrders: prev.totalOrders + Math.floor(Math.random() * 2),
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 50)
      }))
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.table_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesType = filterType === 'all' || order.transaction_type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  // Status configurations - Restaurant workflow: pending → preparing → completed
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
    preparing: { color: 'bg-orange-100 text-orange-800', icon: ChefHat, label: 'Preparing' },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' },
    // Legacy statuses for backward compatibility
    confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
    ready: { color: 'bg-green-100 text-green-800', icon: Bell, label: 'Ready' },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/v1/restaurant/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })
      
      const result = await response.json()
      if (result.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
        ))
        setNotificationMessage('Order status updated successfully')
        setShowNotification(true)
      } else {
        setNotificationMessage(`Failed to update order: ${result.message}`)
        setShowNotification(true)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setNotificationMessage('Error updating order status')
      setShowNotification(true)
    }
  }

  const getTimeElapsed = (orderTime: Date) => {
    const minutes = Math.floor((Date.now() - new Date(orderTime).getTime()) / 60000)
    return minutes
  }

  const getPriorityColor = (order: Order) => {
    // Determine priority based on time elapsed and status
    const elapsed = getTimeElapsed(order.order_time)
    if (elapsed > 30 && ['pending', 'confirmed'].includes(order.status)) {
      return 'border-l-4 border-red-500' // Urgent
    } else if (elapsed > 15 && order.status === 'preparing') {
      return 'border-l-4 border-orange-500' // High
    }
    return 'border-l-4 border-blue-500' // Normal
  }

  const handleOrderCreated = () => {
    loadOrders() // Refresh orders list
    setNotificationMessage('New order created successfully!')
    setShowNotification(true)
  }

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full" />
          </div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Orders"
          value={stats.totalOrders}
          change={8.2}
          trend="up"
          icon={<Utensils className="w-5 h-5 text-white" />}
          color="from-blue-500 to-indigo-600"
        />
        
        <MetricCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={<Activity className="w-5 h-5 text-white" />}
          color="from-orange-500 to-red-600"
        />
        
        <MetricCard
          title="Avg Time"
          value={`${stats.averageTime}m`}
          change={-2.1}
          trend="down"
          icon={<Clock className="w-5 h-5 text-white" />}
          color="from-green-500 to-emerald-600"
        />
        
        <MetricCard
          title="Revenue"
          value={stats.totalRevenue}
          change={15.3}
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="from-purple-500 to-violet-600"
        />
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
            <ProgressRing progress={stats.completionRate} size={40} showPercentage={true} />
          </div>
        </div>
        
        <MetricCard
          title="Satisfaction"
          value={stats.customerSatisfaction}
          change={0.2}
          trend="up"
          icon={<Star className="w-5 h-5 text-white" />}
          color="from-yellow-500 to-amber-600"
        />
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="dine_in">Dine In</option>
              <option value="takeout">Takeout</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className="text-xs"
              >
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs"
              >
                List
              </Button>
            </div>
            
            <GlowButton
              onClick={() => setShowNewOrderForm(true)}
              glowColor="rgba(249, 115, 22, 0.4)"
              className="bg-gradient-to-r from-orange-500 to-red-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </GlowButton>
          </div>
        </div>
      </Card>

      {/* Orders Display */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <Card 
              key={order.id} 
              className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${getPriorityColor(order)}`}
              onClick={() => setSelectedOrder(order)}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.reference_number}</h3>
                  <p className="text-sm text-gray-500">
                    {order.table_number ? `Table ${order.table_number}` : order.transaction_type}
                  </p>
                  {order.smart_code && (
                    <p className="text-xs text-blue-600 font-mono">{order.smart_code}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className={statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {statusConfig[order.status]?.label || order.status}
                  </Badge>
                  {order.gl_posting && (
                    <div className="mt-1">
                      {order.gl_posting.journal_entry_created ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <Receipt className="w-3 h-3 mr-1" />
                          GL Posted
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Posting...
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              {order.customer_name && (
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{order.customer_name}</span>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.menu_item_name}</span>
                    <span className="text-gray-900 font-medium">${item.unit_price}</span>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-gray-500">+{order.items.length - 2} more items</p>
                )}
              </div>

              {/* GL Posting Info */}
              {order.gl_posting?.journal_reference && (
                <div className="mb-3 p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Journal Entry:</strong> {order.gl_posting.journal_reference}
                  </p>
                </div>
              )}

              {/* Time and Total */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {isClient ? (
                      <>
                        <AnimatedCounter value={getTimeElapsed(order.order_time)} />m ago
                      </>
                    ) : (
                      'Loading...'
                    )}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  ${(order.total_amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Status Actions - Restaurant workflow: pending → preparing → completed */}
              <div className="mt-4 flex space-x-2">
                {order.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'preparing')
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Start Cooking
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'cancelled')
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'completed')
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                {order.status === 'completed' && (
                  <div className="flex-1 text-center">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Order Complete
                    </Badge>
                  </div>
                )}
                {order.status === 'cancelled' && (
                  <div className="flex-1 text-center">
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Cancelled
                    </Badge>
                  </div>
                )}
                {/* Legacy status support */}
                {order.status === 'confirmed' && (
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'preparing')
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Start Cooking
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'completed')
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>

              {/* Special Instructions */}
              {order.special_notes && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> {order.special_notes}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{order.reference_number}</p>
                        <p className="text-sm text-gray-500">
                          {order.table_number ? `Table ${order.table_number}` : order.transaction_type}
                        </p>
                        {order.smart_code && (
                          <p className="text-xs text-blue-600 font-mono">{order.smart_code}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{order.customer_name || 'Walk-in'}</p>
                      {order.phone && (
                        <p className="text-sm text-gray-500">{order.phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{order.items.length} items</p>
                      <p className="text-sm text-gray-500">{order.items[0]?.menu_item_name}...</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <Badge className={statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                        {order.gl_posting && (
                          <div className="mt-1">
                            {order.gl_posting.journal_entry_created ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <Receipt className="w-3 h-3 mr-1" />
                                GL Posted
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                Posting...
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isClient ? (
                        <>
                          <AnimatedCounter value={getTimeElapsed(order.order_time)} />m ago
                        </>
                      ) : (
                        'Loading...'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(order.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Order Form Modal */}
      {showNewOrderForm && (
        <NewOrderForm
          onOrderCreated={handleOrderCreated}
          onClose={() => setShowNewOrderForm(false)}
        />
      )}

      {/* Floating Notification */}
      <FloatingNotification
        show={showNotification}
        message={notificationMessage}
        type="success"
        duration={3000}
        onClose={() => setShowNotification(false)}
      />
    </div>
  )
}