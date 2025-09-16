'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  ChefHat,
  AlertCircle,
  CheckCircle,
  Timer,
  Flame,
  Salad,
  Cookie,
  Coffee,
  Utensils,
  Bell,
  Users,
  Home,
  Package,
  Truck,
  AlertTriangle,
  Play,
  Pause,
  Check,
  X,
  RotateCcw,
  TrendingUp,
  Zap,
  ThermometerSun,
  User,
  Hash,
  MapPin,
  Phone,
  MessageSquare,
  Star,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

// Order status flow for kitchen
type OrderStatus = 'new' | 'acknowledged' | 'preparing' | 'ready' | 'served' | 'completed'
type Priority = 'normal' | 'rush' | 'vip'
type Station = 'grill' | 'salad' | 'dessert' | 'beverage' | 'expo'

interface OrderItem {
  id: string
  name: string
  quantity: number
  modifiers: string[]
  specialInstructions?: string
  allergens?: string[]
  station: Station
  prepTime: number // in minutes
  status: 'pending' | 'preparing' | 'ready'
  startedAt?: Date
}

interface KitchenOrder {
  id: string
  orderNumber: string
  orderType: 'dine-in' | 'takeout' | 'delivery'
  tableNumber?: string
  customerName?: string
  customerPhone?: string
  items: OrderItem[]
  status: OrderStatus
  priority: Priority
  createdAt: Date
  acknowledgedAt?: Date
  startedAt?: Date
  readyAt?: Date
  servedAt?: Date
  targetTime: Date // When order should be ready
  server?: string
  notes?: string
  totalItems: number
  itemsReady: number
  allergenAlert: boolean
  heraOrderId?: string // Link to HERA universal_transactions
}

interface StationMetrics {
  ordersInQueue: number
  avgPrepTime: number
  itemsPending: number
  itemsInProgress: number
  efficiency: number
}

export function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedStation, setSelectedStation] = useState<Station | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [showUrgentOnly, setShowUrgentOnly] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Station configuration
  const stations: { id: Station | 'all'; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', name: 'All Orders', icon: <Utensils />, color: 'orange' },
    { id: 'grill', name: 'Grill', icon: <Flame />, color: 'red' },
    { id: 'salad', name: 'Salad/Cold', icon: <Salad />, color: 'green' },
    { id: 'dessert', name: 'Dessert', icon: <Cookie />, color: 'pink' },
    { id: 'beverage', name: 'Beverage', icon: <Coffee />, color: 'blue' },
    { id: 'expo', name: 'Expo', icon: <CheckCircle />, color: 'purple' }
  ]

  // Sample orders with HERA integration points
  const sampleOrders: KitchenOrder[] = [
    {
      id: '1',
      orderNumber: '#0142',
      orderType: 'dine-in',
      tableNumber: '12',
      items: [
        {
          id: '1-1',
          name: 'Grilled Salmon',
          quantity: 2,
          modifiers: ['No butter'],
          station: 'grill',
          prepTime: 12,
          status: 'preparing',
          startedAt: new Date(Date.now() - 5 * 60000),
          allergens: ['fish']
        },
        {
          id: '1-2',
          name: 'Caesar Salad',
          quantity: 2,
          modifiers: ['Extra dressing'],
          station: 'salad',
          prepTime: 5,
          status: 'ready'
        }
      ],
      status: 'preparing',
      priority: 'normal',
      createdAt: new Date(Date.now() - 10 * 60000),
      acknowledgedAt: new Date(Date.now() - 9 * 60000),
      startedAt: new Date(Date.now() - 8 * 60000),
      targetTime: new Date(Date.now() + 7 * 60000),
      server: 'Sarah',
      totalItems: 4,
      itemsReady: 2,
      allergenAlert: true,
      heraOrderId: 'txn_001' // Links to universal_transactions
    },
    {
      id: '2',
      orderNumber: '#0143',
      orderType: 'takeout',
      customerName: 'John Smith',
      customerPhone: '555-0123',
      items: [
        {
          id: '2-1',
          name: 'Truffle Pasta',
          quantity: 1,
          modifiers: [],
          station: 'grill',
          prepTime: 15,
          status: 'pending',
          specialInstructions: 'Extra truffle oil'
        },
        {
          id: '2-2',
          name: 'Tiramisu',
          quantity: 1,
          modifiers: [],
          station: 'dessert',
          prepTime: 2,
          status: 'pending'
        }
      ],
      status: 'acknowledged',
      priority: 'rush',
      createdAt: new Date(Date.now() - 5 * 60000),
      acknowledgedAt: new Date(Date.now() - 4 * 60000),
      targetTime: new Date(Date.now() + 10 * 60000),
      totalItems: 2,
      itemsReady: 0,
      allergenAlert: false,
      heraOrderId: 'txn_002'
    },
    {
      id: '3',
      orderNumber: '#0144',
      orderType: 'delivery',
      customerName: 'Lisa Wang',
      customerPhone: '555-0456',
      items: [
        {
          id: '3-1',
          name: 'Vegetarian Bowl',
          quantity: 1,
          modifiers: ['Gluten free'],
          station: 'salad',
          prepTime: 8,
          status: 'pending',
          allergens: ['nuts']
        }
      ],
      status: 'new',
      priority: 'vip',
      createdAt: new Date(Date.now() - 2 * 60000),
      targetTime: new Date(Date.now() + 20 * 60000),
      totalItems: 1,
      itemsReady: 0,
      allergenAlert: true,
      notes: 'VIP customer - Extra care',
      heraOrderId: 'txn_003'
    }
  ]

  useEffect(() => {
    setOrders(sampleOrders)

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Calculate time elapsed or remaining
  const getTimeDisplay = (order: KitchenOrder) => {
    const now = currentTime.getTime()
    const target = order.targetTime.getTime()
    const created = order.createdAt.getTime()
    const elapsed = Math.floor((now - created) / 60000) // minutes
    const remaining = Math.floor((target - now) / 60000) // minutes

    return { elapsed, remaining }
  }

  // Get order urgency color
  const getUrgencyColor = (remaining: number, priority: Priority) => {
    if (priority === 'vip') return 'bg-purple-500'
    if (priority === 'rush') return 'bg-orange-500'
    if (remaining < 0) return 'bg-red-500'
    if (remaining <= 5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status: newStatus }

          // Set timestamps
          if (newStatus === 'acknowledged') updatedOrder.acknowledgedAt = new Date()
          if (newStatus === 'preparing') updatedOrder.startedAt = new Date()
          if (newStatus === 'ready') updatedOrder.readyAt = new Date()
          if (newStatus === 'served') updatedOrder.servedAt = new Date()

          // Update HERA transaction status via Universal API
          if (order.heraOrderId) {
            universalApi.update('universal_transactions', order.heraOrderId, {
              workflow_state: newStatus,
              metadata: {
                ...order,
                kitchen_status: newStatus,
                last_updated: new Date().toISOString()
              }
            })
          }

          return updatedOrder
        }
        return order
      })
    )

    // Play sound for new orders
    if (audioEnabled && newStatus === 'new') {
      playNotificationSound()
    }
  }

  // Update item status
  const updateItemStatus = (
    orderId: string,
    itemId: string,
    status: 'pending' | 'preparing' | 'ready'
  ) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              const updatedItem = { ...item, status }
              if (status === 'preparing') updatedItem.startedAt = new Date()
              return updatedItem
            }
            return item
          })

          const itemsReady = updatedItems.filter(i => i.status === 'ready').length
          const allReady = itemsReady === updatedItems.length

          return {
            ...order,
            items: updatedItems,
            itemsReady,
            status: allReady ? 'ready' : order.status === 'new' ? 'acknowledged' : order.status
          }
        }
        return order
      })
    )
  }

  // Play notification sound
  const playNotificationSound = () => {
    // In real app, would play actual sound
    console.log('🔔 New order alert!')
  }

  // Filter orders by station
  const filteredOrders = orders
    .filter(order => {
      if (selectedStation === 'all') return true
      if (selectedStation === 'expo') return order.status === 'ready'
      return order.items.some(item => item.station === selectedStation && item.status !== 'ready')
    })
    .filter(order => {
      if (showUrgentOnly) {
        const { remaining } = getTimeDisplay(order)
        return remaining <= 10 || order.priority !== 'normal'
      }
      return true
    })

  // Calculate station metrics
  const getStationMetrics = (station: Station): StationMetrics => {
    const stationOrders = orders.filter(o => o.items.some(i => i.station === station))

    const stationItems = orders.flatMap(o => o.items).filter(i => i.station === station)

    return {
      ordersInQueue: stationOrders.filter(o => o.status !== 'completed').length,
      avgPrepTime: 12, // Would calculate from historical data
      itemsPending: stationItems.filter(i => i.status === 'pending').length,
      itemsInProgress: stationItems.filter(i => i.status === 'preparing').length,
      efficiency: 85 // Would calculate from actual vs expected times
    }
  }

  // Order card component
  const OrderCard = ({ order }: { order: KitchenOrder }) => {
    const { elapsed, remaining } = getTimeDisplay(order)
    const urgencyColor = getUrgencyColor(remaining, order.priority)

    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg',
          selectedOrder?.id === order.id && 'ring-2 ring-orange-500',
          order.status === 'ready' && 'bg-green-50 border-green-300'
        )}
        onClick={() => setSelectedOrder(order)}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{order.orderNumber}</h3>
              {order.orderType === 'dine-in' && (
                <Badge variant="outline" className="gap-1">
                  <Home className="w-3 h-3" />
                  Table {order.tableNumber}
                </Badge>
              )}
              {order.orderType === 'takeout' && (
                <Badge variant="outline" className="gap-1">
                  <Package className="w-3 h-3" />
                  Takeout
                </Badge>
              )}
              {order.orderType === 'delivery' && (
                <Badge variant="outline" className="gap-1">
                  <Truck className="w-3 h-3" />
                  Delivery
                </Badge>
              )}
            </div>
            <Badge className={cn(urgencyColor, 'text-foreground')}>
              {remaining < 0 ? `${Math.abs(remaining)}m LATE` : `${remaining}m`}
            </Badge>
          </div>

          {order.priority !== 'normal' && (
            <Badge
              className={
                order.priority === 'vip'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-orange-100 text-orange-700'
              }
            >
              {order.priority.toUpperCase()}
            </Badge>
          )}

          {order.allergenAlert && (
            <Alert className="mt-2 p-2 border-red-200 bg-red-50">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <AlertDescription className="text-xs text-red-700">
                Allergen Alert: Check special instructions
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Items list */}
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    {item.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {item.status === 'preparing' && (
                      <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                    )}
                  </div>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-muted-foreground">{item.modifiers.join(', ')}</p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠ {item.specialInstructions}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={e => {
                        e.stopPropagation()
                        updateItemStatus(order.id, item.id, 'preparing')
                      }}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  {item.status === 'preparing' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50"
                      onClick={e => {
                        e.stopPropagation()
                        updateItemStatus(order.id, item.id, 'ready')
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {order.itemsReady} of {order.totalItems} ready
              </span>
              <span>{elapsed}m elapsed</span>
            </div>
            <Progress value={(order.itemsReady / order.totalItems) * 100} className="h-2" />
          </div>

          {/* Customer info for takeout/delivery */}
          {(order.orderType === 'takeout' || order.orderType === 'delivery') && (
            <div className="pt-2 border-t text-xs space-y-1">
              {order.customerName && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{order.customerName}</span>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {order.status === 'new' && (
              <Button
                size="sm"
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={e => {
                  e.stopPropagation()
                  updateOrderStatus(order.id, 'acknowledged')
                }}
              >
                Acknowledge
              </Button>
            )}
            {order.status === 'acknowledged' && (
              <Button
                size="sm"
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={e => {
                  e.stopPropagation()
                  updateOrderStatus(order.id, 'preparing')
                }}
              >
                Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && order.itemsReady === order.totalItems && (
              <Button
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={e => {
                  e.stopPropagation()
                  updateOrderStatus(order.id, 'ready')
                }}
              >
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                size="sm"
                className="flex-1 bg-purple-500 hover:bg-purple-600"
                onClick={e => {
                  e.stopPropagation()
                  updateOrderStatus(order.id, 'served')
                }}
              >
                Mark Served
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-muted border-b border-border p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-orange-500" />
              Kitchen Display System
            </h1>
            <Badge variant="outline" className="text-foreground border-white">
              {currentTime.toLocaleTimeString()}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={showUrgentOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowUrgentOnly(!showUrgentOnly)}
              className={showUrgentOnly ? 'bg-red-500' : ''}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Urgent Only
            </Button>
            <Button
              variant={audioEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              <Bell className={cn('w-4 h-4', !audioEnabled && 'line-through')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Station Tabs */}
      <div className="bg-muted px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {stations.map(station => {
            const metrics = station.id !== 'all' ? getStationMetrics(station.id as Station) : null
            return (
              <Button
                key={station.id}
                variant={selectedStation === station.id ? 'default' : 'outline'}
                onClick={() => setSelectedStation(station.id)}
                className={cn(
                  'min-w-[120px]',
                  selectedStation === station.id &&
                    `bg-${station.color}-500 hover:bg-${station.color}-600`
                )}
              >
                <div className="flex items-center gap-2">
                  {station.icon}
                  <span>{station.name}</span>
                  {metrics && metrics.itemsPending > 0 && (
                    <Badge className="bg-red-500 text-foreground text-xs">{metrics.itemsPending}</Badge>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Orders Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ChefHat className="w-16 h-16 mb-4" />
                <p className="text-xl">No orders in queue</p>
                <p className="text-sm mt-2">Orders will appear here when placed</p>
              </div>
            ) : (
              filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </ScrollArea>

        {/* Station Metrics Sidebar */}
        {selectedStation !== 'all' && (
          <div className="w-80 bg-muted border-l border-border p-4">
            <h2 className="text-lg font-bold mb-4">
              {stations.find(s => s.id === selectedStation)?.name} Station
            </h2>

            <div className="space-y-4">
              <Card className="bg-muted-foreground/10 border-border">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {getStationMetrics(selectedStation as Station).itemsPending}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {getStationMetrics(selectedStation as Station).itemsInProgress}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted-foreground/10 border-border">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">Efficiency</p>
                    <Badge className="bg-green-500">
                      {getStationMetrics(selectedStation as Station).efficiency}%
                    </Badge>
                  </div>
                  <Progress
                    value={getStationMetrics(selectedStation as Station).efficiency}
                    className="h-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-muted-foreground/10 border-border">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Avg Prep Time</p>
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-500" />
                    <span className="text-xl font-bold">
                      {getStationMetrics(selectedStation as Station).avgPrepTime}m
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-muted border-t border-border p-4">
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">New Orders</p>
            <p className="text-xl font-bold text-blue-500">
              {orders.filter(o => o.status === 'new').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-xl font-bold text-orange-500">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ready</p>
            <p className="text-xl font-bold text-green-500">
              {orders.filter(o => o.status === 'ready').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Wait</p>
            <p className="text-xl font-bold text-purple-500">15m</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Efficiency</p>
            <p className="text-xl font-bold text-cyan-500">92%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
