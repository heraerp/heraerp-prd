'use client'

// ================================================================================
// HERA DNA RESTAURANT DASHBOARD EXAMPLE
// Smart Code: HERA.DNA.EXAMPLE.DASHBOARD.RESTAURANT.v1
// Complete restaurant operations dashboard with real-time metrics
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  UtensilsCrossed,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  Phone,
  Star,
  Utensils,
  Coffee,
  Timer,
  ShoppingCart
} from 'lucide-react'
import { StatCardDNA } from '../../components/ui/stat-card-dna'
import { EnterpriseDataTable } from '../../components/organisms/EnterpriseDataTable'
import { motion } from 'framer-motion'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

interface RestaurantMetrics {
  dailySales: number
  dailySalesChange: number
  ordersToday: number
  ordersChange: number
  averageOrderValue: number
  aovChange: number
  tableOccupancy: number
  occupancyChange: number
}

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  orderCount: number
  revenue: number
  profitMargin: number
  status: 'available' | 'low_stock' | 'out_of_stock'
}

interface RecentOrder {
  id: string
  table: string
  items: number
  total: number
  status: 'preparing' | 'ready' | 'served' | 'paid'
  time: string
  server: string
}

interface RestaurantDashboardProps {
  organizationId?: string
  className?: string
}

// ================================================================================
// MOCK DATA
// ================================================================================

const mockMetrics: RestaurantMetrics = {
  dailySales: 8750.50,
  dailySalesChange: 12.5,
  ordersToday: 145,
  ordersChange: 8.2,
  averageOrderValue: 60.35,
  aovChange: -2.1,
  tableOccupancy: 78,
  occupancyChange: 15.3
}

const mockMenuItems: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Margherita Pizza',
    category: 'Pizza',
    price: 18.00,
    orderCount: 23,
    revenue: 414.00,
    profitMargin: 68.5,
    status: 'available'
  },
  {
    id: 'menu-2',
    name: 'Caesar Salad',
    category: 'Salads',
    price: 14.00,
    orderCount: 18,
    revenue: 252.00,
    profitMargin: 72.1,
    status: 'available'
  },
  {
    id: 'menu-3',
    name: 'Grilled Salmon',
    category: 'Seafood',
    price: 28.00,
    orderCount: 12,
    revenue: 336.00,
    profitMargin: 58.3,
    status: 'low_stock'
  },
  {
    id: 'menu-4',
    name: 'Tiramisu',
    category: 'Desserts',
    price: 12.00,
    orderCount: 15,
    revenue: 180.00,
    profitMargin: 78.9,
    status: 'available'
  },
  {
    id: 'menu-5',
    name: 'Lobster Bisque',
    category: 'Soups',
    price: 16.00,
    orderCount: 8,
    revenue: 128.00,
    profitMargin: 65.2,
    status: 'out_of_stock'
  }
]

const mockRecentOrders: RecentOrder[] = [
  {
    id: 'ord-001',
    table: 'Table 7',
    items: 3,
    total: 67.50,
    status: 'preparing',
    time: '2 min ago',
    server: 'Maria'
  },
  {
    id: 'ord-002',
    table: 'Table 12',
    items: 2,
    total: 45.00,
    status: 'ready',
    time: '5 min ago',
    server: 'John'
  },
  {
    id: 'ord-003',
    table: 'Table 3',
    items: 4,
    total: 89.25,
    status: 'served',
    time: '8 min ago',
    server: 'Lisa'
  },
  {
    id: 'ord-004',
    table: 'Table 15',
    items: 1,
    total: 18.00,
    status: 'paid',
    time: '12 min ago',
    server: 'Carlos'
  }
]

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const getStatusColor = (status: string) => {
  const colors = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    low_stock: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ready: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    served: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  const icons = {
    available: CheckCircle,
    low_stock: AlertTriangle,
    out_of_stock: AlertTriangle,
    preparing: Clock,
    ready: CheckCircle,
    served: Utensils,
    paid: DollarSign
  }
  return icons[status as keyof typeof icons] || CheckCircle
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function RestaurantDashboard({ 
  organizationId,
  className 
}: RestaurantDashboardProps) {
  const [metrics, setMetrics] = useState<RestaurantMetrics>(mockMetrics)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(mockRecentOrders)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])

  // Table columns for menu items
  const menuColumns = [
    {
      accessorKey: 'name',
      header: 'Item',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.category}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: { row: any }) => formatCurrency(row.original.price)
    },
    {
      accessorKey: 'orderCount',
      header: 'Orders',
      cell: ({ row }: { row: any }) => (
        <div className="text-center">
          {row.original.orderCount}
        </div>
      )
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }: { row: any }) => formatCurrency(row.original.revenue)
    },
    {
      accessorKey: 'profitMargin',
      header: 'Margin',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.profitMargin} className="w-16" />
          <span className="text-sm">{row.original.profitMargin}%</span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const StatusIcon = getStatusIcon(row.original.status)
        return (
          <Badge className={getStatusColor(row.original.status)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {row.original.status.replace('_', ' ')}
          </Badge>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100">
            Restaurant Dashboard
          </h1>
          <p className="text-muted-foreground">
            Mario's Authentic Italian Restaurant • {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Open
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCardDNA
            title="Daily Sales"
            value={formatCurrency(metrics.dailySales)}
            trend={metrics.dailySalesChange > 0 ? `+${metrics.dailySalesChange}%` : `${metrics.dailySalesChange}%`}
            trendDirection={metrics.dailySalesChange > 0 ? 'up' : 'down'}
            icon={DollarSign}
            description="Today's total revenue"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCardDNA
            title="Orders Today"
            value={metrics.ordersToday.toString()}
            trend={metrics.ordersChange > 0 ? `+${metrics.ordersChange}%` : `${metrics.ordersChange}%`}
            trendDirection={metrics.ordersChange > 0 ? 'up' : 'down'}
            icon={ShoppingCart}
            description="Total orders served"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCardDNA
            title="Avg Order Value"
            value={formatCurrency(metrics.averageOrderValue)}
            trend={metrics.aovChange > 0 ? `+${metrics.aovChange}%` : `${metrics.aovChange}%`}
            trendDirection={metrics.aovChange > 0 ? 'up' : 'down'}
            icon={BarChart3}
            description="Average per order"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCardDNA
            title="Table Occupancy"
            value={`${metrics.tableOccupancy}%`}
            trend={metrics.occupancyChange > 0 ? `+${metrics.occupancyChange}%` : `${metrics.occupancyChange}%`}
            trendDirection={metrics.occupancyChange > 0 ? 'up' : 'down'}
            icon={Users}
            description="Current capacity usage"
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status)
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'ready' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'served' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <p className="font-medium">{order.table}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items} items • {order.server}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <p className="text-sm text-muted-foreground">{order.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Kitchen Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Orders in Queue</span>
                <Badge variant="outline">8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Prep Time</span>
                <span className="text-sm font-medium">12 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ready to Serve</span>
                <Badge className="bg-orange-100 text-orange-800">3</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Salmon (Low Stock)</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Lobster (Out of Stock)</span>
              </div>
              <Button size="sm" className="w-full">
                Manage Inventory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Menu Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Menu Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnterpriseDataTable
            data={menuItems}
            columns={menuColumns}
            searchable={true}
            exportable={true}
            pagination={true}
          />
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Customer Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.8</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Reviews Today</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Satisfaction Score</span>
              <span className="font-medium text-green-600">96%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Restaurant Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm">123 Italian Street</p>
                <p className="text-sm text-muted-foreground">Downtown, City 12345</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">(555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">11:00 AM - 10:00 PM</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ================================================================================
// EXPORTS
// ================================================================================

export default RestaurantDashboard

// Export types for external use
export type { RestaurantDashboardProps, RestaurantMetrics, MenuItem, RecentOrder }