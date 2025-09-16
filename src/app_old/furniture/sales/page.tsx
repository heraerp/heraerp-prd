'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ShoppingCart, FileText, Truck, Receipt, Users, Plus, TrendingUp, Clock, Package, DollarSign, Calendar, ArrowUp, ArrowDown, MoreVertical, Eye, Edit, RefreshCw
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
  const organizationId = currentOrganization?.id || demoOrg?.id || 'f0af4ced-9d12-4a55-a649-b484368db249'
  const organizationName = currentOrganization?.organization_name || demoOrg?.name || 'Kerala Furniture Works (Demo)'
  const orgLoading = isAuthenticated ? isLoadingOrgs : false

  // Use the optimized sales data hook
  const { stats, recentOrders, topProducts, salesTrend, loading, error, refresh } = useSalesData(organizationId)

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
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-[var(--color-text-primary)]'
      case 'confirmed':
        return 'bg-[var(--color-body)] dark:bg-[var(--color-body)]/30 text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]'
      case 'in_production':
        return 'bg-[var(--color-accent-teal)]-100 dark:bg-[var(--color-accent-teal)]-900/30 text-[var(--color-text-primary)]-700 dark:text-[var(--color-text-primary)]'
      case 'ready_for_delivery':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'delivered':
        return 'bg-[var(--color-body)] bg-[var(--color-body)]/30 text-[var(--color-text-primary)] dark:text-gray-300'
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'unpaid':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-[var(--color-text-primary)]'
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
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-[var(--color-accent-indigo)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--color-text-secondary)]">Loading organization...</p>
          </div>
        </div>
      </div>
    )
  } 
  // Show skeleton while data is loading
  if (loading && recentOrders.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-body)]">
        <div className="p-6">
          <SalesPageSkeleton />
        </div>
      </div>
    )
  } 
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading sales data: {error}</p>
          <Button onClick={refresh} variant="outline" className="gap-2 hover:bg-[var(--color-hover)]">
          <RefreshCw className="h-4 w-4" /> Retry </Button> </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
          <h1 className="bg-[var(--color-body)] text-3xl font-bold text-[var(--color-text-primary)]">Sales Management</h1>
          <p className="text-[var(--color-text-secondary)] mt-1"> {organizationName} - Manage sales orders, proforma, and customer relationships </p> </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="ghost" size="icon" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]" disabled={loading} >
          <RefreshCw className={cn(
            'h-4 w-4',
            loading && 'animate-spin'
          
          )} /> </Button>
          <NewSalesOrderModal organizationId={organizationId} organizationName={organizationName} onOrderCreated={orderId => {
            console.log('New sales order created:', orderId)
            // Refresh the data
            refresh()
          }} /> </div> </div> {/* Key Metrics */} 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50 hover:bg-[var(--color-body)]/70 transition-all">
          
            <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-[var(--color-body)]/20 rounded-xl">
          <ShoppingCart className="h-6 w-6 text-[#37353E]" /> </div>
          <Badge variant="secondary" className="bg-[var(--color-body)]/20 text-[var(--color-text-secondary)]">
              Live
            </Badge>
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Active Orders</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.activeOrders}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">{stats.todayOrders} new today</p> </div>
          </Card>
        
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50 hover:bg-[var(--color-body)]/70 transition-all">
          
            <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-[var(--color-body)]/10 rounded-xl">
          <FileText className="h-6 w-6 text-[#37353E]" /> </div>
          <Badge variant="secondary" className="bg-[var(--color-body)]/10 text-[var(--color-text-secondary)]">
              Pending
            </Badge>
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Pending Quotes</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.pendingQuotes}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">Awaiting approval</p> </div>
          </Card>
        
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50 hover:bg-[var(--color-body)]/70 transition-all">
          
            <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-[var(--color-body)]/10 rounded-xl">
          <Truck className="h-6 w-6 text-[#37353E]" /> </div>
          <Badge variant="secondary" className="bg-[var(--color-body)]/10 text-[var(--color-text-secondary)]">
              Ready
            </Badge>
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Ready to Dispatch</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.readyToDispatch}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">Awaiting delivery</p> </div>
          </Card>
        
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50 hover:bg-[var(--color-body)]/70 transition-all">
          
            <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
          <DollarSign className="h-6 w-6 text-green-500" /> </div>
        <div className="flex items-center gap-1"> 
              {stats.weeklyGrowth > 0 ? (
            <ArrowUp className="h-4 w-4 text-green-500" /> )
          : (
            <ArrowDown className="h-4 w-4 text-red-500" /> )} <span className={cn(
            'text-xs font-medium',
            stats.weeklyGrowth > 0 ? 'text-green-400' : 'text-red-400' 
          )} > {Math.abs(stats.weeklyGrowth).toFixed(1)}% </span> </div> </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">This Month</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]"> ₹{(stats.monthlyRevenue / 100000).toFixed(1)}L </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2"> ₹{(stats.todayRevenue / 1000).toFixed(1)}K today </p> </div>
          </Card> </div> 
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
          {/* Recent Orders - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
          <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)]">Recent Orders</h2>
          <Link href="/furniture/sales/orders">
          <Button variant="ghost" size="sm" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]" > View All </Button> </Link> </div>
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50">
          <div className="divide-y divide-gray-700/50"> {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">No orders found</div> ) : ( recentOrders.map(order => (
                  <div key={order.id} className="p-4 hover:bg-[var(--color-body)]/30 transition-colors">
          <div className="flex items-center justify-between">
          <div className="flex-1">
          <div className="bg-[var(--color-body)] flex items-start justify-between">
          <div>
          <p className="font-medium text-[var(--color-text-primary)]">{order.orderNumber}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1"> {order.customerName} </p>
          <div className="bg-[var(--color-body)] flex items-center gap-4 mt-2 text-xs text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {order.orderDate} </span>
          <span className="flex items-center gap-1">
          <Package className="h-3 w-3" /> {order.items} items </span>
          <span className="flex items-center gap-1">
          <Truck className="h-3 w-3" /> {order.deliveryDate} </span> </div> </div>
        <div className="bg-[var(--color-body)] text-right ml-4">
          <p className="font-semibold text-[var(--color-text-primary)]"> ₹{order.amount.toLocaleString('en-IN')} </p>
          <Badge className={cn('mt-2', getStatusColor(order.status))}> {getStatusLabel(order.status)} </Badge>
        </div> </div> </div>
        <div className="flex items-center gap-2 ml-4">
          <Link href={`/furniture/sales/orders/${order.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--color-hover)]">
          <Eye className="h-4 w-4" /> </Button> </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--color-hover)]">
          <MoreVertical className="h-4 w-4" /> </Button> </div> </div>
      </div>
    )) )} </div>
          </Card> </div> {/* Right Column - Stats & Charts */} <div className="space-y-4"> {/* Top Products */} <div>
          <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)] mb-4">Top Products</h2>
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50">
          <div className="p-4 space-y-3"> {topProducts.length === 0 ? (
            <div className="text-center text-[var(--color-text-secondary)] py-4">No sales data</div> ) : ( topProducts.map((product, index) => ( <div key={product.id} className="bg-[var(--color-body)] flex items-center justify-between">
          <div className="bg-[var(--color-body)] flex items-center gap-3">
          <div 
          className="w-8 h-8 bg-muted-foreground/10/50 rounded-lg flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]"
        > {index + 1} </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{product.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{product.category}</p> </div> </div>
        <div className="bg-[var(--color-body)] text-right">
          <p className="text-sm font-medium text-[var(--color-text-primary)]"> ₹{(product.revenue / 1000).toFixed(1)}K </p>
          <p className="text-xs text-[var(--color-text-secondary)]">{product.soldUnits} units</p> </div>
      </div>
    )) )} </div>
          </Card> </div> {/* Sales Trend */} <div>
          <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)] mb-4">7-Day Trend</h2>
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50 p-4">
          <div className="space-y-3"> {salesTrend.map((day, index) => ( <div key={index}>
          <div className="bg-[var(--color-body)] flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--color-text-secondary)]">{day.date}</span>
          <span className="text-xs font-medium text-[var(--color-text-primary)]"> ₹{(day.revenue / 1000).toFixed(1)}K </span> </div>
          <Progress value={ salesTrend.length > 0 ? (day.revenue / Math.max(...salesTrend.map(d => d.revenue))) * 100 : 0 } className="h-2 bg-muted-foreground/10" /> </div> ))} </div>
          </Card> </div> {/* Quick Stats */} <div>
          <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)] mb-4">Quick Stats</h2>
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 backdrop-blur-sm border-[var(--color-border)]/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Top Customer</span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{stats.topCustomer}</span> </div>
        <div className="bg-[var(--color-body)] flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Avg Order Value</span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]"> ₹ {stats.activeOrders > 0 ? (stats.monthlyRevenue / stats.activeOrders / 1000).toFixed(1) : '0'} K </span> </div>
        <div className="bg-[var(--color-body)] flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Conversion Rate</span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">68%</span> </div>
          </Card> </div> </div> </div> {/* Quick Actions */} <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/furniture/sales/proforma">
          <Card 
          className="p-4 hover:scale-105 transition-all cursor-pointer bg-[var(--color-body)]/30 backdrop-blur-sm border-[var(--color-border)]/30 hover:bg-[var(--color-body)]/50"
        >
          <div className="bg-[var(--color-body)] flex flex-col items-center text-center gap-2">
          <FileText className="h-8 w-8 text-[#37353E]" />
          <span className="text-sm font-medium text-gray-300">Proforma</span> </div>
          </Card> </Link>
          <Link href="/furniture/sales/orders">
          <Card 
          className="p-4 hover:scale-105 transition-all cursor-pointer bg-[var(--color-body)]/30 backdrop-blur-sm border-[var(--color-border)]/30 hover:bg-[var(--color-body)]/50"
        >
          <div className="bg-[var(--color-body)] flex flex-col items-center text-center gap-2">
          <ShoppingCart className="h-8 w-8 text-[#37353E]" />
          <span className="text-sm font-medium text-gray-300">Orders</span> </div>
          </Card> </Link>
          <Link href="/furniture/sales/dispatch">
          <Card 
          className="p-4 hover:scale-105 transition-all cursor-pointer bg-[var(--color-body)]/30 backdrop-blur-sm border-[var(--color-border)]/30 hover:bg-[var(--color-body)]/50"
        >
          <div className="bg-[var(--color-body)] flex flex-col items-center text-center gap-2">
          <Truck className="h-8 w-8 text-[#37353E]" />
          <span className="text-sm font-medium text-gray-300">Dispatch</span> </div>
          </Card> </Link>
          <Link href="/furniture/sales/invoices">
          <Card 
          className="p-4 hover:scale-105 transition-all cursor-pointer bg-[var(--color-body)]/30 backdrop-blur-sm border-[var(--color-border)]/30 hover:bg-[var(--color-body)]/50"
        >
          <div className="bg-[var(--color-body)] flex flex-col items-center text-center gap-2">
          <Receipt className="h-8 w-8 text-green-500" />
          <span className="text-sm font-medium text-gray-300">Invoices</span> </div>
          </Card> </Link>
          <Link href="/furniture/sales/customers">
          <Card 
          className="p-4 hover:scale-105 transition-all cursor-pointer bg-[var(--color-body)]/30 backdrop-blur-sm border-[var(--color-border)]/30 hover:bg-[var(--color-body)]/50"
        >
          <div className="bg-[var(--color-body)] flex flex-col items-center text-center gap-2">
          <Users className="h-8 w-8 text-indigo-500" />
          <span className="text-sm font-medium text-gray-300">Customers</span> </div>
          </Card> </Link> </div> </div>
      </div>
    )
}
