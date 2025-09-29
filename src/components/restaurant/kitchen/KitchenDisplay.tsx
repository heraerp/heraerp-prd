'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MetricCard,
  AnimatedCounter,
  StatusIndicator,
  FloatingNotification,
  GlowButton,
  ProgressRing
} from '../JobsStyleMicroInteractions'
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle,
  AlertTriangle,
  Timer,
  Users,
  Utensils,
  Activity,
  Flame,
  Coffee,
  Play,
  Pause,
  RotateCw,
  Zap,
  Target,
  Award,
  Eye,
  MessageSquare,
  Phone,
  MapPin,
  DollarSign,
  Star,
  TrendingUp,
  Package,
  Thermometer,
  Volume2,
  VolumeX,
  Settings,
  Monitor,
  Grid3x3,
  List,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

// Steve Jobs: "Innovation distinguishes between a leader and a follower"

// Use same order interface as restaurant orders for consistency
interface KitchenOrder {
  id: string
  reference_number: string
  transaction_type: string
  customer_name?: string
  table_number?: string
  phone?: string
  address?: string
  order_time: Date
  estimated_ready_time?: Date
  status: 'pending' | 'preparing' | 'completed' | 'cancelled'
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  server_name?: string
  items: KitchenOrderItem[]
  special_notes?: string
  gl_posting?: {
    required: boolean
    journal_entry_created: boolean
    journal_reference?: string
    auto_posted: boolean
  }
  smart_code?: string
}

interface KitchenOrderItem {
  id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  line_total: number
  special_instructions?: string
  modifications?: string[]
}

export function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'board'>('cards')
  const [filterStation, setFilterStation] = useState<string>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClient, setIsClient] = useState(false)

  // Kitchen stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    inProgress: 0,
    readyToServe: 0,
    averageCookTime: 14,
    onTimeRate: 94,
    efficiency: 87
  })

  // Real-time connection status (simulated for now)
  const [isConnected, setIsConnected] = useState(true)
  const [isFallback, setIsFallback] = useState(false)

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update time every second for precise timing
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load kitchen orders from universal API
  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/restaurant/orders')
      const result = await response.json()

      if (result.success) {
        // Filter to only show orders that need kitchen attention (pending + preparing)
        const kitchenOrders = result.data.filter((order: KitchenOrder) =>
          ['pending', 'preparing'].includes(order.status)
        )

        setOrders(kitchenOrders)

        // Update kitchen stats
        const totalOrders = result.data.length
        const inProgress = result.data.filter(
          (order: KitchenOrder) => order.status === 'preparing'
        ).length
        const pending = result.data.filter(
          (order: KitchenOrder) => order.status === 'pending'
        ).length

        setStats(prev => ({
          ...prev,
          totalOrders,
          inProgress,
          readyToServe: pending
        }))
      } else {
        console.error('Failed to load kitchen orders:', result.message)
        setNotificationMessage(`Failed to load orders: ${result.message}`)
        setShowNotification(true)
      }
    } catch (error) {
      console.error('Error loading kitchen orders:', error)
      setNotificationMessage('Error loading orders. Please try again.')
      setShowNotification(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    // Refresh orders every 30 seconds
    const interval = setInterval(() => {
      loadOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/v1/restaurant/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })

      const result = await response.json()
      if (result.success) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus as KitchenOrder['status'] } : order
          )
        )
        setNotificationMessage(`Order ${newStatus === 'preparing' ? 'started' : 'completed'}`)
        setShowNotification(true)

        // Reload orders to get updated data
        loadOrders()
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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterStation === 'all') return true
    // For now, show all orders as we don't have station data
    return true
  })

  // Status configurations - same as restaurant orders
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'New Order' },
    preparing: { color: 'bg-orange-100 text-orange-800', icon: ChefHat, label: 'Cooking' },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Ready' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' }
  }

  const getTimeElapsed = (orderTime: Date) => {
    const minutes = Math.floor((Date.now() - new Date(orderTime).getTime()) / 60000)
    return minutes
  }

  const getPriorityColor = (order: KitchenOrder) => {
    const elapsed = getTimeElapsed(order.order_time)
    if (elapsed > 20) return 'border-l-4 border-red-500' // Urgent - over 20 min
    if (elapsed > 10) return 'border-l-4 border-orange-500' // High - over 10 min
    return 'border-l-4 border-blue-500' // Normal
  }

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full" />
          </div>
          <p className="text-muted-foreground">Loading kitchen orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Kitchen Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<Utensils className="w-5 h-5 text-foreground" />}
          color="from-blue-500 to-indigo-600"
        />

        <MetricCard
          title="In Progress"
          value={stats.inProgress}
          icon={<ChefHat className="w-5 h-5 text-foreground" />}
          color="from-orange-500 to-red-600"
        />

        <MetricCard
          title="New Orders"
          value={stats.readyToServe}
          icon={<Bell className="w-5 h-5 text-foreground" />}
          color="from-yellow-500 to-amber-600"
        />

        <MetricCard
          title="Avg Cook Time"
          value={`${stats.averageCookTime}m`}
          icon={<Clock className="w-5 h-5 text-foreground" />}
          color="from-green-500 to-emerald-600"
        />

        <div className="bg-background rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">On Time Rate</h3>
            <ProgressRing progress={stats.onTimeRate} size={40} showPercentage={true} />
          </div>
        </div>

        <div className="bg-background rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Efficiency</h3>
            <ProgressRing progress={stats.efficiency} size={40} showPercentage={true} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center space-x-4">
            <Button onClick={loadOrders} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <select
              value={filterStation}
              onChange={e => setFilterStation(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stations</option>
              <option value="grill">Grill</option>
              <option value="saute">Sauté</option>
              <option value="fryer">Fryer</option>
              <option value="cold">Cold Station</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <StatusIndicator
              status={isConnected ? 'success' : 'error'}
              text={isConnected ? 'Connected' : 'Disconnected'}
              showText={true}
            />

            <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="sm">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Kitchen Orders */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">No Active Orders</h3>
          <p className="text-muted-foreground">All caught up! New orders will appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map(order => (
            <Card
              key={order.id}
              className={`p-6 transition-all hover:shadow-lg hover:scale-105 ${getPriorityColor(order)}`}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-100">{order.reference_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.table_number ? `Table ${order.table_number}` : order.transaction_type}
                  </p>
                </div>
                <Badge className={statusConfig[order.status]?.color || 'bg-muted text-gray-200'}>
                  {statusConfig[order.status]?.label || order.status}
                </Badge>
              </div>

              {/* Customer Info */}
              {order.customer_name && (
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm ink">{order.customer_name}</span>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="ink">
                      {item.quantity}x {item.menu_item_name}
                    </span>
                    {item.special_instructions && (
                      <span className="text-xs text-orange-600">*</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              {order.special_notes && (
                <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> {order.special_notes}
                  </p>
                </div>
              )}

              {/* Time and Actions */}
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isClient ? (
                      <>
                        <AnimatedCounter value={getTimeElapsed(order.order_time)} />m ago
                      </>
                    ) : (
                      'Loading...'
                    )}
                  </span>
                </div>
                <span className="font-semibold text-gray-100">
                  ${(order.total_amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Kitchen Actions */}
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Start Cooking
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Ready
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
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
