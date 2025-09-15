'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import {
  useUniversalData,
  universalFilters
} from '@/lib/dna/patterns/universal-api-loading-pattern'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function ProductionOrdersPage() {
  const { organizationId, orgLoading } = useDemoOrganization()
  const [searchTerm, setSearchTerm] = useState('')

  // Load production orders from universal_transactions
  const { data: productionOrders, isLoading: ordersLoading } = useUniversalData({
    table: 'universal_transactions',
    filter: item =>
      item.transaction_type === 'production_order' &&
      item.organization_id === organizationId &&
      (!searchTerm ||
        item.transaction_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())),
    organizationId,
    enabled: !!organizationId
  })

  // Load entities for customer names and products
  const { data: entities } = useUniversalData({
    table: 'core_entities',
    filter: item => item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for order details
  const { data: transactionLines } = useUniversalData({
    table: 'universal_transaction_lines',
    filter: item => item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const getCustomerName = (customerId: string) => {
    const customer = entities?.find(e => e.id === customerId && e.entity_type === 'customer')
    return customer?.entity_name || 'Unknown Customer'
  }

  const getOrderItems = (orderId: string) => {
    return transactionLines?.filter(line => line.transaction_id === orderId) || []
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: Clock
      },
      in_progress: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        icon: Package
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        icon: CheckCircle
      },
      cancelled: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        icon: AlertCircle
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  const stats = {
    total: productionOrders?.length || 0,
    pending: productionOrders?.filter(o => o.metadata?.status === 'pending').length || 0,
    inProgress: productionOrders?.filter(o => o.metadata?.status === 'in_progress').length || 0,
    completed: productionOrders?.filter(o => o.metadata?.status === 'completed').length || 0
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Production Orders</h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Manage manufacturing orders and track production
          </p>
        </div>
        <Link
          href="/furniture/production/orders/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-foreground bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Production Order
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background dark:bg-muted overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Package className="h-6 w-6 text-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground dark:text-muted-foreground truncate">
                    Total Orders
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                      {stats.total}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background dark:bg-muted overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <Clock className="h-6 w-6 text-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground dark:text-muted-foreground truncate">
                    Pending
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                      {stats.pending}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background dark:bg-muted overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Package className="h-6 w-6 text-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground dark:text-muted-foreground truncate">
                    In Progress
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                      {stats.inProgress}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background dark:bg-muted overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-foreground" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground dark:text-muted-foreground truncate">
                    Completed
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                      {stats.completed}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-background dark:bg-muted shadow rounded-lg">
        <div className="p-4 border-b border-border dark:border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background dark:bg-muted-foreground/10 dark:border-border placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                placeholder="Search orders..."
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-border dark:border-border text-sm leading-5 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-background dark:bg-muted-foreground/10 hover:text-muted-foreground focus:outline-none focus:border-blue-300 focus:ring focus:ring-blue-200 active:text-gray-800 active:bg-muted transition ease-in-out duration-150">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-muted dark:bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-background dark:bg-muted divide-y divide-gray-200 dark:divide-gray-700">
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
                  </td>
                </tr>
              ) : productionOrders?.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-muted-foreground dark:text-muted-foreground"
                  >
                    No production orders found. Create your first order to get started.
                  </td>
                </tr>
              ) : (
                productionOrders?.map(order => {
                  const items = getOrderItems(order.id)
                  return (
                    <tr key={order.id} className="hover:bg-muted dark:hover:bg-muted-foreground/10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-foreground">
                          {order.transaction_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-foreground">
                          {getCustomerName(order.from_entity_id || '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {format(new Date(order.transaction_date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-foreground">
                          {items.length} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-foreground">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.metadata?.status || 'pending')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/furniture/production/orders/${order.id}`}
                          className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/furniture/production/tracking"
          className="bg-background dark:bg-muted p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                Track Production
              </h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                Monitor order progress
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>

        <Link
          href="/furniture/production/planning"
          className="bg-background dark:bg-muted p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">Planning</h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Schedule production</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>

        <Link
          href="/furniture/inventory"
          className="bg-background dark:bg-muted p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">Check Inventory</h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">View material stock</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </div>
  )
}
