'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
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
  Edit,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { cn } from '@/lib/utils'
import { getDemoOrganizationInfo } from '@/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'
import NewSalesOrderModal from '@/components/furniture/NewSalesOrderModal'
import { useSalesData } from '@/lib/furniture/use-sales-data'
import { SalesPageSkeleton } from '@/components/furniture/SalesPageSkeleton'

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

  // Use the optimized sales data hook
  const { stats, recentOrders, topProducts, salesTrend, loading, error, refresh } =
    useSalesData(organizationId)

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
        }
      }
    }
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])

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
        return 'bg-muted dark:bg-muted/30 text-gray-700 dark:text-gray-300'
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

  // Show skeleton while data is loading
  if (loading && recentOrders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <SalesPageSkeleton />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading sales data: {error}</p>
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
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
          <div className="flex items-center gap-2">
            <Button
              onClick={refresh}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            <NewSalesOrderModal
              organizationId={organizationId}
              organizationName={organizationName}
              onOrderCreated={orderId => {
                console.log('New sales order created:', orderId)
                // Refresh the data
                refresh()
              }}
            />
          </div>
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
              <p className="text-3xl font-bold text-foreground">{stats.activeOrders}</p>
              <p className="text-xs text-muted-foreground mt-2">{stats.todayOrders} new today</p>
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
              <p className="text-3xl font-bold text-foreground">{stats.pendingQuotes}</p>
              <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
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
              <p className="text-3xl font-bold text-foreground">{stats.readyToDispatch}</p>
              <p className="text-xs text-muted-foreground mt-2">Awaiting delivery</p>
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
                ₹{(stats.monthlyRevenue / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-muted-foreground mt-2">
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
                {recentOrders.length === 0 ? (
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
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                  {topProducts.length === 0 ? (
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
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            ₹{(product.revenue / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-muted-foreground">{product.soldUnits} units</p>
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
