'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ShoppingCart,
  FileText,
  Truck,
  Receipt,
  Users,
  Plus,
  TrendingUp,
  Clock,
  Package,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { getDemoOrganizationInfo } from '@/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'
import NewSalesOrderModal from '@/components/furniture/NewSalesOrderModal'

interface SalesStats {
  activeOrders: number
  pendingQuotes: number
  readyToDispatch: number
  monthlyRevenue: number
  todayOrders: number
  todayRevenue: number
  weeklyGrowth: number
  topCustomer: string
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  orderDate: string
  amount: number
  status: string
  items: number
  deliveryDate: string
}

interface TopProduct {
  id: string
  name: string
  category: string
  soldUnits: number
  revenue: number
  growth: number
}

export default function FurnitureSales() {
  const pathname = usePathname()
  const { currentOrganization, isLoadingOrgs, isAuthenticated } = useMultiOrgAuth()
  const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)

  // Use authenticated org if available, otherwise use demo org, fallback to Kerala Furniture Works
  const organizationId =
    currentOrganization?.id || demoOrg?.id || 'f0af4ced-9d12-4a55-a649-b484368db249'
  const organizationName =
    currentOrganization?.organization_name || demoOrg?.name || 'Kerala Furniture Works (Demo)'
  const orgLoading = isAuthenticated ? isLoadingOrgs : false

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SalesStats>({
    activeOrders: 0,
    pendingQuotes: 0,
    readyToDispatch: 0,
    monthlyRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    weeklyGrowth: 0,
    topCustomer: '-'
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [salesTrend, setSalesTrend] = useState<any[]>([])

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
          console.log('Demo organization loaded:', orgInfo)
        }
      }
    }
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])

  const loadSalesData = useCallback(async () => {
    console.log('loadSalesData called with organizationId:', organizationId)
    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)

      // Load all transactions
      console.log('Loading transactions for organization:', organizationId, organizationName)
      console.log('Using direct Supabase query...')

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      console.log('Transactions query result:', {
        data: transactionsData,
        error: transactionsError
      })

      if (transactionsError) {
        console.error('Failed to load transactions:', transactionsError)
        return
      }

      const transactionsResponse = {
        success: true,
        data: transactionsData || [],
        error: null
      }

      console.log('Total transactions loaded:', transactionsResponse.data.length)
      console.log('Sample transaction:', transactionsResponse.data[0])

      // Debug: Log all transaction types and smart codes
      console.log('All transaction types:', [
        ...new Set(transactionsResponse.data.map((t: any) => t.transaction_type))
      ])
      console.log('All smart codes:', [
        ...new Set(transactionsResponse.data.map((t: any) => t.smart_code).filter(Boolean))
      ])

      // Filter sales orders and sales invoices - be more flexible with the filter
      const salesOrders = transactionsResponse.data
        .filter((t: any) => {
          // Check if it's a sales order or sales invoice type
          if (!['sales_order', 'sales_invoice'].includes(t.transaction_type)) return false

          // Check if it has a furniture-related smart code or belongs to this organization
          if (t.smart_code) {
            return (
              t.smart_code.includes('FURNITURE') ||
              t.smart_code.includes('SALES.ORDER') ||
              t.smart_code.includes('SALES.INVOICE') ||
              t.smart_code.includes('HERA.FURNITURE')
            )
          }

          // If no smart code but it's a sales transaction in a furniture org, include it
          return true
        })
        .sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

      console.log('Furniture sales orders/invoices found:', salesOrders.length)
      if (salesOrders.length > 0) {
        console.log('First sales transaction:', salesOrders[0])
      }

      // Filter proforma invoices
      const proformaInvoices = transactionsResponse.data.filter(
        (t: any) =>
          t.transaction_type === 'proforma_invoice' && t.smart_code?.includes('FURNITURE.SALES')
      )

      // Calculate statistics
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now.setDate(now.getDate() - 7))

      const activeOrders = salesOrders.filter((o: any) => {
        const status = (o.metadata as any)?.status || 'pending_approval'
        // Include different statuses based on transaction type
        if (o.transaction_type === 'sales_invoice') {
          return ['unpaid', 'pending', 'overdue'].includes(status)
        }
        return ['pending_approval', 'confirmed', 'in_production'].includes(status)
      }).length

      const pendingQuotes = proformaInvoices.filter((p: any) => {
        const status = (p.metadata as any)?.status || 'pending'
        return status === 'pending'
      }).length

      const readyToDispatch = salesOrders.filter((o: any) => {
        const status = (o.metadata as any)?.status || ''
        // Include ready orders and paid invoices
        if (o.transaction_type === 'sales_invoice') {
          return status === 'paid'
        }
        return status === 'ready_for_delivery'
      }).length

      const monthlyOrders = salesOrders.filter(
        (o: any) => new Date(o.transaction_date) >= startOfMonth
      )
      const monthlyRevenue = monthlyOrders.reduce(
        (sum: number, o: any) => sum + (o.total_amount || 0),
        0
      )

      const todayOrders = salesOrders.filter((o: any) => new Date(o.transaction_date) >= startOfDay)
      const todayOrdersCount = todayOrders.length
      const todayRevenue = todayOrders.reduce(
        (sum: number, o: any) => sum + (o.total_amount || 0),
        0
      )

      // Calculate weekly growth
      const thisWeekOrders = salesOrders.filter(
        (o: any) => new Date(o.transaction_date) >= startOfWeek
      )
      const thisWeekRevenue = thisWeekOrders.reduce(
        (sum: number, o: any) => sum + (o.total_amount || 0),
        0
      )

      const lastWeekStart = new Date(startOfWeek)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekOrders = salesOrders.filter(
        (o: any) =>
          new Date(o.transaction_date) >= lastWeekStart &&
          new Date(o.transaction_date) < startOfWeek
      )
      const lastWeekRevenue = lastWeekOrders.reduce(
        (sum: number, o: any) => sum + (o.total_amount || 0),
        0
      )

      const weeklyGrowth =
        lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0

      // Get top customer
      const customerOrders: { [key: string]: { name: string; revenue: number } } = {}

      // Load all entities to get customer names
      const { data: entitiesData, error: entitiesError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)

      if (entitiesError) {
        console.error('Failed to load entities:', entitiesError)
      }
      const customerEntities = entitiesData?.filter((e: any) => e.entity_type === 'customer') || []
      console.log('Customer entities loaded:', customerEntities.length)

      for (const order of salesOrders) {
        if (order.source_entity_id || order.target_entity_id) {
          const customerId = order.source_entity_id || order.target_entity_id
          const customer = customerEntities.find((c: any) => c.id === customerId)

          if (customer) {
            if (!customerOrders[customer.id]) {
              customerOrders[customer.id] = { name: customer.entity_name, revenue: 0 }
            }
            customerOrders[customer.id].revenue += order.total_amount || 0
          }
        }
      }

      const topCustomerId = Object.entries(customerOrders).sort(
        ([, a], [, b]) => b.revenue - a.revenue
      )[0]
      const topCustomer = topCustomerId ? topCustomerId[1].name : '-'

      setStats({
        activeOrders,
        pendingQuotes,
        readyToDispatch,
        monthlyRevenue,
        todayOrders: todayOrdersCount,
        todayRevenue,
        weeklyGrowth,
        topCustomer
      })

      // Load recent orders with details
      const recentOrdersData = await Promise.all(
        salesOrders.slice(0, 10).map(async (order: any) => {
          let customerName = 'Walk-in Customer'
          const customerId = order.source_entity_id || order.target_entity_id
          if (customerId) {
            const customer = customerEntities.find((c: any) => c.id === customerId)
            if (customer) {
              customerName = customer.entity_name
            }
          }

          // Get line items count
          const { data: linesData, error: linesError } = await supabase
            .from('universal_transaction_lines')
            .select('*')
            .eq('transaction_id', order.id)

          if (linesError) {
            console.error('Failed to load transaction lines for order:', order.id, linesError)
          }
          const orderLines = linesData || []

          const deliveryDateStr =
            (order.metadata as any)?.delivery_date ||
            new Date(
              new Date(order.transaction_date).getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString()

          return {
            id: order.id,
            orderNumber: order.transaction_code || `ORD-${order.id.slice(0, 8)}`,
            customerName,
            orderDate: new Date(order.transaction_date).toLocaleDateString('en-IN'),
            amount: order.total_amount || 0,
            status: (order.metadata as any)?.status || 'pending_approval',
            items: orderLines.length,
            deliveryDate: new Date(deliveryDateStr).toLocaleDateString('en-IN')
          }
        })
      )

      setRecentOrders(recentOrdersData)

      // Load top products (simulated from transactions)
      const productSales: {
        [key: string]: { name: string; category: string; units: number; revenue: number }
      } = {}

      // Get all transaction lines
      const { data: allLinesData, error: allLinesError } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('organization_id', organizationId)

      if (allLinesError) {
        console.error('Failed to load all transaction lines:', allLinesError)
      }
      const allLines = allLinesData || []

      // Get all products
      const productEntities = entitiesData?.filter((e: any) => e.entity_type === 'product') || []

      for (const order of salesOrders) {
        const orderLines = allLines.filter((line: any) => line.transaction_id === order.id)

        for (const line of orderLines) {
          if (line.entity_id) {
            const product = productEntities.find((p: any) => p.id === line.entity_id)

            if (product) {
              if (!productSales[product.id]) {
                productSales[product.id] = {
                  name: product.entity_name,
                  category: (product.metadata as any)?.category || 'General',
                  units: 0,
                  revenue: 0
                }
              }
              productSales[product.id].units += parseFloat(line.quantity || '1')
              productSales[product.id].revenue += line.line_amount || 0
            }
          }
        }
      }

      const topProductsData = Object.entries(productSales)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(([id, data]) => ({
          id,
          name: data.name,
          category: data.category,
          soldUnits: data.units,
          revenue: data.revenue,
          growth: Math.random() * 40 - 10 // Simulated growth
        }))

      setTopProducts(topProductsData)

      // Generate sales trend data
      const trendData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayOrders = salesOrders.filter((o: any) => {
          const orderDate = new Date(o.transaction_date)
          return orderDate.toDateString() === date.toDateString()
        })
        const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
        trendData.push({
          date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
          revenue: dayRevenue,
          orders: dayOrders.length
        })
      }
      setSalesTrend(trendData)
    } catch (error) {
      console.error('Failed to load sales data:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      setLoading(false)
    }
  }, [organizationId, organizationName])

  useEffect(() => {
    // Load data when organization is ready
    // If we have an organizationId, load data even if still loading orgs (for demo/fallback scenarios)
    if (organizationId) {
      loadSalesData()
    }
  }, [organizationId, loadSalesData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'in_production':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'ready_for_delivery':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'delivered':
        return 'bg-gray-100 dark:bg-muted/30 text-gray-700 dark:text-gray-300'
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'unpaid':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'in_production':
        return 'In Production'
      case 'ready_for_delivery':
        return 'Ready'
      case 'delivered':
        return 'Delivered'
      case 'paid':
        return 'Paid'
      case 'unpaid':
        return 'Unpaid'
      case 'overdue':
        return 'Overdue'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }
  }

  // Show loading state while organization is loading
  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading organization...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
            <p className="text-muted-foreground mt-1">
              {organizationName} - Manage sales orders, proforma, and customer relationships
            </p>
          </div>
          <NewSalesOrderModal
            organizationId={organizationId}
            organizationName={organizationName}
            onOrderCreated={orderId => {
              console.log('New sales order created:', orderId)
              // Refresh the data
              loadSalesData()
            }}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                Live
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Orders</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.activeOrders}
              </p>
              <p className="text-xs text-gray-500 mt-2">{stats.todayOrders} new today</p>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                Pending
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Quotes</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.pendingQuotes}
              </p>
              <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Truck className="h-6 w-6 text-purple-500" />
              </div>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                Ready
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ready to Dispatch</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.readyToDispatch}
              </p>
              <p className="text-xs text-gray-500 mt-2">Awaiting delivery</p>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex items-center gap-1">
                {stats.weeklyGrowth > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    stats.weeklyGrowth > 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {Math.abs(stats.weeklyGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">This Month</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : `₹${(stats.monthlyRevenue / 100000).toFixed(1)}L`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ₹{(stats.todayRevenue / 1000).toFixed(1)}K today
              </p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
              <Link href="/furniture/sales/orders">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  View All
                </Button>
              </Link>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <div className="divide-y divide-gray-700/50">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No orders found</div>
                ) : (
                  recentOrders.map(order => (
                    <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.customerName}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {order.orderDate}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {order.items} items
                                </span>
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {order.deliveryDate}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-foreground">
                                ₹{order.amount.toLocaleString('en-IN')}
                              </p>
                              <Badge className={cn('mt-2', getStatusColor(order.status))}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link href={`/furniture/sales/orders/${order.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Stats & Charts */}
          <div className="space-y-4">
            {/* Top Products */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Top Products</h2>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <div className="p-4 space-y-3">
                  {loading ? (
                    <div className="text-center text-muted-foreground py-4">Loading...</div>
                  ) : topProducts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">No sales data</div>
                  ) : (
                    topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted-foreground/10/50 rounded-lg flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            ₹{(product.revenue / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-gray-500">{product.soldUnits} units</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Sales Trend */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">7-Day Trend</h2>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
                <div className="space-y-3">
                  {salesTrend.map((day, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{day.date}</span>
                        <span className="text-xs font-medium text-foreground">
                          ₹{(day.revenue / 1000).toFixed(1)}K
                        </span>
                      </div>
                      <Progress
                        value={
                          salesTrend.length > 0
                            ? (day.revenue / Math.max(...salesTrend.map(d => d.revenue))) * 100
                            : 0
                        }
                        className="h-2 bg-muted-foreground/10"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Stats</h2>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Top Customer</span>
                  <span className="text-sm font-medium text-foreground">{stats.topCustomer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Order Value</span>
                  <span className="text-sm font-medium text-foreground">
                    ₹
                    {stats.activeOrders > 0
                      ? (stats.monthlyRevenue / stats.activeOrders / 1000).toFixed(1)
                      : '0'}
                    K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="text-sm font-medium text-foreground">68%</span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/furniture/sales/proforma">
            <Card className="p-4 hover:scale-105 transition-all cursor-pointer bg-muted/30 backdrop-blur-sm border-border/30 hover:bg-card/50">
              <div className="flex flex-col items-center text-center gap-2">
                <FileText className="h-8 w-8 text-amber-500" />
                <span className="text-sm font-medium text-gray-300">Proforma</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/sales/orders">
            <Card className="p-4 hover:scale-105 transition-all cursor-pointer bg-muted/30 backdrop-blur-sm border-border/30 hover:bg-card/50">
              <div className="flex flex-col items-center text-center gap-2">
                <ShoppingCart className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium text-gray-300">Orders</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/sales/dispatch">
            <Card className="p-4 hover:scale-105 transition-all cursor-pointer bg-muted/30 backdrop-blur-sm border-border/30 hover:bg-card/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="h-8 w-8 text-purple-500" />
                <span className="text-sm font-medium text-gray-300">Dispatch</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/sales/invoices">
            <Card className="p-4 hover:scale-105 transition-all cursor-pointer bg-muted/30 backdrop-blur-sm border-border/30 hover:bg-card/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Receipt className="h-8 w-8 text-green-500" />
                <span className="text-sm font-medium text-gray-300">Invoices</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/sales/customers">
            <Card className="p-4 hover:scale-105 transition-all cursor-pointer bg-muted/30 backdrop-blur-sm border-border/30 hover:bg-card/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Users className="h-8 w-8 text-indigo-500" />
                <span className="text-sm font-medium text-gray-300">Customers</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
