'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { universalApi } from '@/lib/universal-api'
import { extractData, formatCurrency, generateSmartCode } from '@/lib/universal-helpers'
import { StatCardGrid, StatCardData } from '@/components/universal/StatCardGrid'
import {
  ShoppingCart,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Loader2,
  RefreshCw,
  Receipt,
  CreditCard,
  Utensils,
  Coffee,
  Home,
  Truck,
  Phone,
  MapPin,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Printer,
  ChefHat,
  User,
  Hash,
  FileText,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { formatDistanceToNow } from 'date-fns'

interface OrderManagementProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface Order {
  id: string
  transaction_code: string
  transaction_date: string
  total_amount: number
  from_entity_id?: string
  to_entity_id?: string
  metadata?: {
    order_number?: string
    order_type?: 'dine-in' | 'takeout' | 'delivery' | 'pickup'
    table_number?: number
    table_name?: string
    customer_name?: string
    customer_phone?: string
    delivery_address?: string
    status?: 'new' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    kitchen_status?: 'pending' | 'cooking' | 'plating' | 'sent'
    payment_status?: 'pending' | 'paid' | 'refunded' | 'partial'
    payment_method?: string
    server_name?: string
    preparation_time?: number
    special_instructions?: string
    items_count?: number
    created_at?: string
    updated_at?: string
    estimated_ready_time?: string
  }
}

interface OrderItem {
  id: string
  line_number: number
  line_entity_id?: string
  quantity: number
  unit_price: number
  line_amount: number
  metadata?: {
    item_name?: string
    item_code?: string
    category?: string
    modifiers?: string[]
    special_requests?: string
    status?: 'pending' | 'preparing' | 'ready'
    preparation_time?: number
  }
}

// Order status colors
const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  confirmed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-muted text-gray-200 dark:bg-background/30 dark:text-gray-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
}

// Order type icons
const ORDER_TYPE_ICONS = {
  'dine-in': Utensils,
  takeout: Package,
  delivery: Truck,
  pickup: Home
}

// Payment status colors
const PAYMENT_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  refunded: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
}

export function OrderManagement({
  organizationId,
  smartCodes,
  isDemoMode = false
}: OrderManagementProps) {
  const [activeTab, setActiveTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
      loadData()
    } else {
      createDemoData()
    }

    // Auto-refresh every 10 seconds for active orders
    const interval = setInterval(() => {
      if (!isDemoMode && activeTab === 'active') {
        refreshData()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isDemoMode, organizationId, activeTab])

  const createDemoData = async () => {
    setLoading(true)
    try {
      // Create demo orders
      const demoOrders: Order[] = [
        // Active orders
        {
          id: 'order-1',
          transaction_code: 'ORD-2024-001',
          transaction_date: new Date().toISOString(),
          total_amount: 125.5,
          metadata: {
            order_number: '001',
            order_type: 'dine-in',
            table_number: 5,
            table_name: 'Table 5',
            customer_name: 'Walk-in',
            status: 'new',
            kitchen_status: 'pending',
            payment_status: 'pending',
            server_name: 'Sarah',
            items_count: 4,
            created_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
            estimated_ready_time: new Date(Date.now() + 900000).toISOString() // 15 min
          }
        },
        {
          id: 'order-2',
          transaction_code: 'ORD-2024-002',
          transaction_date: new Date().toISOString(),
          total_amount: 78.25,
          metadata: {
            order_number: '002',
            order_type: 'takeout',
            customer_name: 'John Smith',
            customer_phone: '+1-555-0123',
            status: 'confirmed',
            kitchen_status: 'cooking',
            payment_status: 'paid',
            payment_method: 'credit_card',
            items_count: 3,
            created_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
            estimated_ready_time: new Date(Date.now() + 600000).toISOString() // 10 min
          }
        },
        {
          id: 'order-3',
          transaction_code: 'ORD-2024-003',
          transaction_date: new Date().toISOString(),
          total_amount: 156.75,
          metadata: {
            order_number: '003',
            order_type: 'delivery',
            customer_name: 'Emily Johnson',
            customer_phone: '+1-555-0124',
            delivery_address: '123 Main St, Dubai',
            status: 'preparing',
            kitchen_status: 'plating',
            payment_status: 'paid',
            payment_method: 'online',
            items_count: 6,
            special_instructions: 'Extra spicy, ring doorbell',
            created_at: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
            estimated_ready_time: new Date(Date.now() + 300000).toISOString() // 5 min
          }
        },
        {
          id: 'order-4',
          transaction_code: 'ORD-2024-004',
          transaction_date: new Date().toISOString(),
          total_amount: 45.0,
          metadata: {
            order_number: '004',
            order_type: 'dine-in',
            table_number: 12,
            table_name: 'Table 12',
            customer_name: 'Walk-in',
            status: 'ready',
            kitchen_status: 'sent',
            payment_status: 'pending',
            server_name: 'Mike',
            items_count: 2,
            created_at: new Date(Date.now() - 1800000).toISOString() // 30 min ago
          }
        },
        // Completed orders
        {
          id: 'order-5',
          transaction_code: 'ORD-2024-005',
          transaction_date: new Date().toISOString(),
          total_amount: 234.5,
          metadata: {
            order_number: '005',
            order_type: 'dine-in',
            table_number: 8,
            table_name: 'Table 8',
            customer_name: 'Birthday Party',
            status: 'completed',
            kitchen_status: 'sent',
            payment_status: 'paid',
            payment_method: 'cash',
            server_name: 'Sarah',
            items_count: 8,
            created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            updated_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          }
        },
        {
          id: 'order-6',
          transaction_code: 'ORD-2024-006',
          transaction_date: new Date().toISOString(),
          total_amount: 67.25,
          metadata: {
            order_number: '006',
            order_type: 'pickup',
            customer_name: 'Robert Brown',
            customer_phone: '+1-555-0125',
            status: 'completed',
            kitchen_status: 'sent',
            payment_status: 'paid',
            payment_method: 'credit_card',
            items_count: 3,
            created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
            updated_at: new Date(Date.now() - 9000000).toISOString() // 2.5 hours ago
          }
        }
      ]

      // Create demo order items
      const demoOrderItems: Record<string, OrderItem[]> = {
        'order-1': [
          {
            id: 'item-1-1',
            line_number: 1,
            quantity: 1,
            unit_price: 45.0,
            line_amount: 45.0,
            metadata: {
              item_name: 'Grilled Salmon',
              item_code: 'MAIN-001',
              category: 'Main Course',
              modifiers: ['Extra Lemon', 'No Salt'],
              status: 'pending'
            }
          },
          {
            id: 'item-1-2',
            line_number: 2,
            quantity: 2,
            unit_price: 28.0,
            line_amount: 56.0,
            metadata: {
              item_name: 'Caesar Salad',
              item_code: 'SALAD-002',
              category: 'Salads',
              status: 'pending'
            }
          },
          {
            id: 'item-1-3',
            line_number: 3,
            quantity: 1,
            unit_price: 12.5,
            line_amount: 12.5,
            metadata: {
              item_name: 'Garlic Bread',
              item_code: 'APPETIZER-003',
              category: 'Appetizers',
              status: 'pending'
            }
          },
          {
            id: 'item-1-4',
            line_number: 4,
            quantity: 2,
            unit_price: 6.0,
            line_amount: 12.0,
            metadata: {
              item_name: 'Soft Drink',
              item_code: 'BEV-001',
              category: 'Beverages',
              status: 'ready'
            }
          }
        ],
        'order-2': [
          {
            id: 'item-2-1',
            line_number: 1,
            quantity: 1,
            unit_price: 32.5,
            line_amount: 32.5,
            metadata: {
              item_name: 'Margherita Pizza',
              item_code: 'PIZZA-001',
              category: 'Pizza',
              modifiers: ['Extra Cheese'],
              status: 'preparing'
            }
          },
          {
            id: 'item-2-2',
            line_number: 2,
            quantity: 1,
            unit_price: 28.75,
            line_amount: 28.75,
            metadata: {
              item_name: 'Pasta Carbonara',
              item_code: 'PASTA-002',
              category: 'Pasta',
              status: 'preparing'
            }
          },
          {
            id: 'item-2-3',
            line_number: 3,
            quantity: 2,
            unit_price: 8.5,
            line_amount: 17.0,
            metadata: {
              item_name: 'Tiramisu',
              item_code: 'DESSERT-001',
              category: 'Desserts',
              status: 'pending'
            }
          }
        ],
        'order-3': [
          {
            id: 'item-3-1',
            line_number: 1,
            quantity: 2,
            unit_price: 38.0,
            line_amount: 76.0,
            metadata: {
              item_name: 'BBQ Ribs',
              item_code: 'MAIN-005',
              category: 'Main Course',
              modifiers: ['Extra Spicy'],
              special_requests: 'Extra sauce on side',
              status: 'ready'
            }
          },
          {
            id: 'item-3-2',
            line_number: 2,
            quantity: 2,
            unit_price: 15.0,
            line_amount: 30.0,
            metadata: {
              item_name: 'French Fries',
              item_code: 'SIDE-001',
              category: 'Sides',
              status: 'ready'
            }
          },
          {
            id: 'item-3-3',
            line_number: 3,
            quantity: 1,
            unit_price: 22.5,
            line_amount: 22.5,
            metadata: {
              item_name: 'Chicken Wings',
              item_code: 'APPETIZER-005',
              category: 'Appetizers',
              modifiers: ['Buffalo Sauce'],
              status: 'ready'
            }
          },
          {
            id: 'item-3-4',
            line_number: 4,
            quantity: 2,
            unit_price: 7.0,
            line_amount: 14.0,
            metadata: {
              item_name: 'Cola',
              item_code: 'BEV-002',
              category: 'Beverages',
              status: 'ready'
            }
          },
          {
            id: 'item-3-5',
            line_number: 5,
            quantity: 1,
            unit_price: 9.25,
            line_amount: 9.25,
            metadata: {
              item_name: 'Ice Cream Sundae',
              item_code: 'DESSERT-003',
              category: 'Desserts',
              status: 'pending'
            }
          },
          {
            id: 'item-3-6',
            line_number: 6,
            quantity: 1,
            unit_price: 5.0,
            line_amount: 5.0,
            metadata: {
              item_name: 'Delivery Fee',
              item_code: 'SERVICE-001',
              category: 'Service',
              status: 'ready'
            }
          }
        ]
      }

      setOrders(demoOrders)
      setOrderItems(demoOrderItems)
    } catch (err) {
      setError('Failed to create demo data')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load orders (transactions)
      const ordersResponse = await universalApi.getTransactions({
        transaction_type: 'sale',
        smart_code: smartCodes.ORDER_SALE || 'HERA.RESTAURANT.ORDER.SALE.V1'
      })
      const ordersData = extractData(ordersResponse) as Order[]

      // Sort orders by date (newest first)
      const sortedOrders = ordersData.sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )

      setOrders(sortedOrders)

      // Load order items for each order
      const itemsMap: Record<string, OrderItem[]> = {}
      for (const order of sortedOrders) {
        const itemsResponse = await universalApi.getTransactionLines(order.id)
        itemsMap[order.id] = extractData(itemsResponse) as OrderItem[]
      }
      setOrderItems(itemsMap)
    } catch (err) {
      setError('Failed to load orders')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const updatedMetadata = {
        ...order.metadata,
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Update kitchen status based on order status
      if (newStatus === 'confirmed') {
        updatedMetadata.kitchen_status = 'cooking'
      } else if (newStatus === 'ready') {
        updatedMetadata.kitchen_status = 'sent'
      }

      await universalApi.updateTransaction(orderId, {
        metadata: updatedMetadata
      })

      // Update local state
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, metadata: updatedMetadata } : o)))
    } catch (err) {
      console.error('Error updating order status:', err)
      setError('Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: string,
    paymentMethod?: string
  ) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const updatedMetadata = {
        ...order.metadata,
        payment_status: paymentStatus,
        payment_method: paymentMethod || (order.metadata as any)?.payment_method,
        updated_at: new Date().toISOString()
      }

      await universalApi.updateTransaction(orderId, {
        metadata: updatedMetadata
      })

      // Update local state
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, metadata: updatedMetadata } : o)))
    } catch (err) {
      console.error('Error updating payment status:', err)
      setError('Failed to update payment status')
    }
  }

  // Calculate statistics
  const activeOrders = orders.filter(o =>
    ['new', 'confirmed', 'preparing', 'ready'].includes((o.metadata as any)?.status || '')
  )
  const completedOrders = orders.filter(o => (o.metadata as any)?.status === 'completed')
  const todaysOrders = orders.filter(
    o =>
      formatDate(new Date(o.transaction_date), 'yyyy-MM-dd') ===
      formatDate(new Date(), 'yyyy-MM-dd')
  )
  const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total_amount, 0)

  const stats: StatCardData[] = [
    {
      title: 'Active Orders',
      value: activeOrders.length.toString(),
      icon: ShoppingCart,
      trend: '+12%',
      trendLabel: 'from yesterday'
    },
    {
      title: 'Avg. Prep Time',
      value: '18 min',
      icon: Clock,
      className: 'text-primary'
    },
    {
      title: "Today's Orders",
      value: todaysOrders.length.toString(),
      icon: Receipt,
      trend: '+8',
      trendLabel: 'orders'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(todaysRevenue),
      icon: DollarSign,
      className: 'text-emerald-600'
    },
    {
      title: 'Dine-in',
      value: orders.filter(o => (o.metadata as any)?.order_type === 'dine-in').length.toString(),
      icon: Utensils
    },
    {
      title: 'Delivery/Takeout',
      value: orders
        .filter(o =>
          ['delivery', 'takeout', 'pickup'].includes((o.metadata as any)?.order_type || '')
        )
        .length.toString(),
      icon: Package
    }
  ]

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      searchTerm === '' ||
      order.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.metadata as any)?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.metadata as any)?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.metadata as any)?.customer_phone?.includes(searchTerm)

    const matchesType = filterType === 'all' || (order.metadata as any)?.order_type === filterType
    const matchesStatus = filterStatus === 'all' || (order.metadata as any)?.status === filterStatus

    const isActive = ['new', 'confirmed', 'preparing', 'ready'].includes(
      (order.metadata as any)?.status || ''
    )
    const matchesTab =
      (activeTab === 'active' && isActive) ||
      (activeTab === 'completed' && !isActive) ||
      activeTab === 'all'

    return matchesSearch && matchesType && matchesStatus && matchesTab
  })

  const getOrderTypeIcon = (type: string) => {
    const Icon = ORDER_TYPE_ICONS[type as keyof typeof ORDER_TYPE_ICONS] || Package
    return <Icon className="h-4 w-4" />
  }

  const getTimeSinceOrder = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Order Management
          </h2>
          <p className="text-muted-foreground">Track and manage all restaurant orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refreshData()} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <StatCardGrid stats={stats} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="takeout">Takeout</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          Order #{(order.metadata as any)?.order_number || order.transaction_code}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[(order.metadata as any)?.status || 'new']}
                        >
                          {(order.metadata as any)?.status || 'new'}
                        </Badge>
                        {(order.metadata as any)?.kitchen_status && (
                          <Badge variant="outline">
                            <ChefHat className="h-3 w-3 mr-1" />
                            {order.metadata.kitchen_status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getOrderTypeIcon((order.metadata as any)?.order_type || 'dine-in')}
                          <span className="capitalize">
                            {(order.metadata as any)?.order_type || 'dine-in'}
                          </span>
                        </div>
                        {(order.metadata as any)?.table_number && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {order.metadata.table_name || `Table ${order.metadata.table_number}`}
                          </div>
                        )}
                        {(order.metadata as any)?.customer_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.metadata.customer_name}
                          </div>
                        )}
                        {(order.metadata as any)?.customer_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.metadata.customer_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(order.metadata as any)?.created_at
                            ? getTimeSinceOrder(order.metadata.created_at)
                            : 'Just now'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(order.total_amount)}</p>
                        <Badge
                          variant="secondary"
                          className={
                            PAYMENT_STATUS_COLORS[
                              (order.metadata as any)?.payment_status || 'pending'
                            ]
                          }
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {(order.metadata as any)?.payment_status || 'pending'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderDetails(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items Preview */}
                  <div className="space-y-2 mb-3">
                    {orderItems[order.id]?.slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.quantity}x</span>
                          <span>{(item.metadata as any)?.item_name}</span>
                          {(item.metadata as any)?.modifiers &&
                            item.metadata.modifiers.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({item.metadata.modifiers.join(', ')})
                              </span>
                            )}
                        </div>
                        <span>{formatCurrency(item.line_amount)}</span>
                      </div>
                    ))}
                    {orderItems[order.id]?.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{orderItems[order.id].length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Special Instructions */}
                  {(order.metadata as any)?.special_instructions && (
                    <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
                      <span className="font-medium">Note:</span>{' '}
                      {order.metadata.special_instructions}
                    </div>
                  )}

                  {/* Delivery Address */}
                  {(order.metadata as any)?.delivery_address && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {order.metadata.delivery_address}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-2">
                      {(order.metadata as any)?.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Confirm Order'
                          )}
                        </Button>
                      )}
                      {(order.metadata as any)?.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          disabled={updatingOrderId === order.id}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {(order.metadata as any)?.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          disabled={updatingOrderId === order.id}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Mark Ready
                        </Button>
                      )}
                      {(order.metadata as any)?.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          disabled={updatingOrderId === order.id}
                        >
                          Complete Order
                        </Button>
                      )}
                      {(order.metadata as any)?.payment_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePaymentStatus(order.id, 'paid', 'cash')}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredOrders.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No orders found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Order Details - #
              {selectedOrder?.metadata?.order_number || selectedOrder?.transaction_code}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Type</p>
                  <p className="font-medium capitalize">
                    {(selectedOrder.metadata as any)?.order_type || 'dine-in'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[(selectedOrder.metadata as any)?.status || 'new']}
                  >
                    {(selectedOrder.metadata as any)?.status || 'new'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {(selectedOrder.metadata as any)?.customer_name || 'Walk-in'}
                  </p>
                  {(selectedOrder.metadata as any)?.customer_phone && (
                    <p className="text-xs">{selectedOrder.metadata.customer_phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Server</p>
                  <p className="font-medium">
                    {(selectedOrder.metadata as any)?.server_name || 'Not assigned'}
                  </p>
                </div>
                {(selectedOrder.metadata as any)?.table_number && (
                  <div>
                    <p className="text-muted-foreground">Table</p>
                    <p className="font-medium">
                      {selectedOrder.metadata.table_name ||
                        `Table ${selectedOrder.metadata.table_number}`}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Order Time</p>
                  <p className="font-medium">
                    {(selectedOrder.metadata as any)?.created_at
                      ? formatDate(new Date(selectedOrder.metadata.created_at), 'MMM dd, HH:mm')
                      : 'Just now'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {orderItems[selectedOrder.id]?.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-2 rounded hover:bg-muted dark:hover:bg-background/20"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.quantity}x</span>
                            <span>{(item.metadata as any)?.item_name}</span>
                          </div>
                          {(item.metadata as any)?.modifiers &&
                            item.metadata.modifiers.length > 0 && (
                              <p className="text-xs text-muted-foreground ml-6">
                                {item.metadata.modifiers.join(', ')}
                              </p>
                            )}
                          {(item.metadata as any)?.special_requests && (
                            <p className="text-xs text-muted-foreground ml-6">
                              Note: {item.metadata.special_requests}
                            </p>
                          )}
                        </div>
                        <span className="font-medium">{formatCurrency(item.line_amount)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.total_amount * 0.9)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>{formatCurrency(selectedOrder.total_amount * 0.1)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between p-3 bg-muted dark:bg-background/20 rounded">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment Status:</span>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    PAYMENT_STATUS_COLORS[
                      (selectedOrder.metadata as any)?.payment_status || 'pending'
                    ]
                  }
                >
                  {(selectedOrder.metadata as any)?.payment_status || 'pending'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
            <Button>
              <Printer className="h-4 w-4 mr-1" />
              Print Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
