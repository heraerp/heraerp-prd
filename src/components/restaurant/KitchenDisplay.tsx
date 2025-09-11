'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { universalApi } from '@/lib/universal-api'
import { extractData, ensureDefaultEntities, formatCurrency } from '@/lib/universal-helpers'
import { useEntities, useTransactions } from '@/hooks/useUniversalData'
import { StatCardGrid, StatCardData } from '@/components/universal/StatCardGrid'
import { 
  ChefHat,
  Clock,
  AlertCircle,
  CheckCircle,
  Timer,
  Flame,
  Soup,
  Pizza,
  Coffee,
  Loader2,
  RefreshCw,
  Bell,
  Users,
  TrendingUp,
  Utensils
} from 'lucide-react'
import { formatDate, differenceInMinutesSafe } from '@/lib/date-utils'

interface KitchenDisplayProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface Order {
  id: string
  transaction_code: string
  transaction_date: string
  total_amount: number
  metadata?: {
    table_number?: string
    server_name?: string
    order_type?: string
    special_instructions?: string
    priority?: 'normal' | 'rush' | 'vip'
    status?: string
  }
  items?: OrderItem[]
  prepTime?: number
}

interface OrderItem {
  id: string
  line_number: number
  quantity: number
  metadata?: {
    item_name?: string
    modifiers?: string[]
    special_requests?: string
    station?: string
  }
}

interface KitchenStation {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    station_type?: string
    active_orders?: number
    avg_prep_time?: number
    icon?: string
  }
}

export function KitchenDisplay({ 
  organizationId, 
  smartCodes,
  isDemoMode = false 
}: KitchenDisplayProps) {
  const [activeStation, setActiveStation] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stations, setStations] = useState<KitchenStation[]>([])
  const [stats, setStats] = useState({
    newOrders: 0,
    inProgress: 0,
    ready: 0,
    avgPrepTime: 0
  })
  
  // Auto refresh every 30 seconds (but not while updating)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!updating) {
        loadData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [organizationId, updating])
  
  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
      loadData()
    }
  }, [organizationId, isDemoMode])
  
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Ensure kitchen stations exist
      const kitchenStations = await ensureDefaultEntities(
        'kitchen_station',
        [
          { 
            entity_name: 'Grill Station', 
            entity_code: 'STATION-GRILL',
            metadata: { station_type: 'hot', icon: 'flame' }
          },
          { 
            entity_name: 'Cold Station', 
            entity_code: 'STATION-COLD',
            metadata: { station_type: 'cold', icon: 'snowflake' }
          },
          { 
            entity_name: 'Pizza Oven', 
            entity_code: 'STATION-PIZZA',
            metadata: { station_type: 'hot', icon: 'pizza' }
          },
          { 
            entity_name: 'Dessert Station', 
            entity_code: 'STATION-DESSERT',
            metadata: { station_type: 'cold', icon: 'cake' }
          }
        ],
        smartCodes.KITCHEN_STATION,
        organizationId
      )
      
      setStations(kitchenStations)
      
      // Load today's orders
      const today = new Date().toISOString().split('T')[0]
      const transactionsResponse = await universalApi.getTransactions()
      const allTransactions = extractData(transactionsResponse)
      
      // Filter for today's orders (sales)
      const todayOrders = allTransactions
        .filter(t => 
          t.transaction_type === 'sale' && 
          t.transaction_date &&
          t.transaction_date.startsWith(today)
        )
        .map(order => ({
          ...order,
          prepTime: differenceInMinutesSafe(new Date(), new Date(order.transaction_date))
        }))
        .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
      
      // Load transaction lines for each order
      for (const order of todayOrders) {
        const linesResponse = await universalApi.getTransactionLines(order.id)
        order.items = extractData(linesResponse).filter(line => line.transaction_id === order.id)
      }
      
      setOrders(todayOrders)
      
      // Calculate stats
      const newOrders = todayOrders.filter(o => !o.metadata?.status || o.metadata.status === 'new').length
      const inProgress = todayOrders.filter(o => o.metadata?.status === 'in_progress').length
      const ready = todayOrders.filter(o => o.metadata?.status === 'ready').length
      const avgPrepTime = todayOrders
        .filter(o => o.metadata?.status === 'ready' || o.metadata?.status === 'served')
        .reduce((sum, o) => sum + (o.prepTime || 0), 0) / (ready || 1)
      
      setStats({ newOrders, inProgress, ready, avgPrepTime })
      
    } catch (err) {
      console.error('Error loading kitchen data:', err)
      setError('Failed to load kitchen data')
    } finally {
      setLoading(false)
    }
  }
  
  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(true)
    setUpdatingOrderId(orderId)
    try {
      // Find the order to update
      const orderToUpdate = orders.find(o => o.id === orderId)
      if (!orderToUpdate) return
      
      // Optimistically update the UI
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, metadata: { ...order.metadata, status } }
            : order
        )
      )
      
      // Update stats optimistically
      setStats(prevStats => {
        const newStats = { ...prevStats }
        
        // Decrease count from previous status
        const prevStatus = orderToUpdate.metadata?.status || 'new'
        if (prevStatus === 'new') newStats.newOrders--
        else if (prevStatus === 'in_progress') newStats.inProgress--
        else if (prevStatus === 'ready') newStats.ready--
        
        // Increase count for new status
        if (status === 'new') newStats.newOrders++
        else if (status === 'in_progress') newStats.inProgress++
        else if (status === 'ready') newStats.ready++
        
        return newStats
      })
      
      // Make the API call
      const response = await universalApi.updateTransaction(orderId, {
        metadata: { 
          ...orderToUpdate.metadata,
          status 
        }
      })
      
      // If the API call fails, revert the optimistic update
      if (!response.success) {
        await loadData() // Reload to get correct state
        throw new Error('Failed to update order status')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      setError('Failed to update order status')
      // Reload data to ensure UI is in sync
      await loadData()
    } finally {
      setUpdating(false)
      setUpdatingOrderId(null)
    }
  }
  
  const getStationIcon = (icon?: string) => {
    switch (icon) {
      case 'flame': return <Flame className="h-4 w-4" />
      case 'snowflake': return <Soup className="h-4 w-4" />
      case 'pizza': return <Pizza className="h-4 w-4" />
      case 'cake': return <Coffee className="h-4 w-4" />
      default: return <Utensils className="h-4 w-4" />
    }
  }
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'new': return 'destructive'
      case 'in_progress': return 'warning' 
      case 'ready': return 'success'
      case 'served': return 'secondary'
      default: return 'default'
    }
  }
  
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'rush': return <Badge variant="destructive">RUSH</Badge>
      case 'vip': return <Badge variant="default">VIP</Badge>
      default: return null
    }
  }
  
  // Define stats for the grid
  const statCards: StatCardData[] = [
    {
      key: 'new',
      title: 'New Orders',
      value: stats.newOrders,
      subtitle: 'Awaiting prep',
      icon: Bell,
      format: 'number',
      variant: stats.newOrders > 5 ? 'warning' : 'default'
    },
    {
      key: 'progress',
      title: 'In Progress',
      value: stats.inProgress,
      subtitle: 'Being prepared',
      icon: Timer,
      format: 'number'
    },
    {
      key: 'ready',
      title: 'Ready',
      value: stats.ready,
      subtitle: 'Awaiting pickup',
      icon: CheckCircle,
      format: 'number',
      variant: stats.ready > 3 ? 'warning' : 'success'
    },
    {
      key: 'avgTime',
      title: 'Avg Prep Time',
      value: Math.round(stats.avgPrepTime),
      subtitle: 'Minutes',
      icon: Clock,
      format: 'number'
    }
  ]
  
  const filterOrdersByStation = (orders: Order[], station: string) => {
    if (station === 'all') return orders
    
    return orders.filter(order => 
      order.items?.some(item => 
        item.metadata?.station === station
      )
    )
  }
  
  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4 transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Order #{order.transaction_code.split('-')[1]}
              {getPriorityBadge(order.metadata?.priority)}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Table {order.metadata?.table_number || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {order.prepTime} min ago
              </span>
            </div>
          </div>
          <Badge variant={getStatusColor(order.metadata?.status)}>
            {order.metadata?.status || 'new'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div>
                <span className="font-medium">{item.quantity}x</span>{' '}
                {item.metadata?.item_name || 'Item'}
                {item.metadata?.modifiers && item.metadata.modifiers.length > 0 && (
                  <div className="text-xs text-muted-foreground ml-4">
                    {item.metadata.modifiers.join(', ')}
                  </div>
                )}
                {item.metadata?.special_requests && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 ml-4">
                    Note: {item.metadata.special_requests}
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {item.metadata?.station || 'General'}
              </Badge>
            </div>
          ))}
        </div>
        
        {order.metadata?.special_instructions && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {order.metadata.special_instructions}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          {(!order.metadata?.status || order.metadata.status === 'new') && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => updateOrderStatus(order.id, 'in_progress')}
              disabled={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
              ) : (
                'Start Preparing'
              )}
            </Button>
          )}
          {order.metadata?.status === 'in_progress' && (
            <Button 
              size="sm" 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => updateOrderStatus(order.id, 'ready')}
              disabled={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
              ) : (
                'Mark Ready'
              )}
            </Button>
          )}
          {order.metadata?.status === 'ready' && (
            <Button 
              size="sm" 
              className="flex-1" 
              variant="secondary"
              onClick={() => updateOrderStatus(order.id, 'served')}
              disabled={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
              ) : (
                'Mark Served'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            Kitchen Display System
          </h1>
          <p className="text-muted-foreground">Real-time order management and tracking</p>
        </div>
        <Button onClick={() => loadData()} variant="outline" disabled={updating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
          {updating ? 'Updating...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Kitchen Stats */}
      <StatCardGrid 
        stats={statCards} 
        columns={{ default: 1, sm: 2, md: 4 }}
      />
      
      {/* Station Tabs */}
      <Tabs value={activeStation} onValueChange={setActiveStation}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All Stations ({orders.length})
          </TabsTrigger>
          {stations.map(station => {
            const stationOrders = filterOrdersByStation(orders, station.entity_code)
            return (
              <TabsTrigger key={station.id} value={station.entity_code}>
                <span className="flex items-center gap-1">
                  {getStationIcon(station.metadata?.icon)}
                  {station.entity_name} ({stationOrders.length})
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        
        <TabsContent value={activeStation} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New Orders Column */}
            <div>
              <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">New Orders</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filterOrdersByStation(orders, activeStation)
                    .filter(o => !o.metadata?.status || o.metadata.status === 'new')
                    .map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </ScrollArea>
            </div>
            
            {/* In Progress Column */}
            <div>
              <h3 className="font-semibold mb-3 text-yellow-600 dark:text-yellow-400">In Progress</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filterOrdersByStation(orders, activeStation)
                    .filter(o => o.metadata?.status === 'in_progress')
                    .map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </ScrollArea>
            </div>
            
            {/* Ready Column */}
            <div>
              <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">Ready for Pickup</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filterOrdersByStation(orders, activeStation)
                    .filter(o => o.metadata?.status === 'ready')
                    .map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </ScrollArea>
            </div>
            
            {/* Recently Served Column */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-600 dark:text-gray-400">Recently Served</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filterOrdersByStation(orders, activeStation)
                    .filter(o => o.metadata?.status === 'served')
                    .slice(0, 5)
                    .map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}