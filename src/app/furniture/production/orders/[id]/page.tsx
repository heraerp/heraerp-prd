'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, Calendar, Package, User, FileText, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import { useUniversalData, universalFilters } from '@/lib/dna/patterns/universal-api-loading-pattern'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function ProductionOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { organizationId, orgLoading } = useDemoOrganization()
  const [activeTab, setActiveTab] = useState('details')

  // Load the specific production order
  const { data: productionOrders } = useUniversalData({
    table: 'universal_transactions',
    filter: (item) => 
      item.id === params.id &&
      item.transaction_type === 'production_order' &&
      item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const order = productionOrders?.[0]

  // Load entities for customer and product names
  const { data: entities } = useUniversalData({
    table: 'core_entities',
    filter: (item) => item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for order items
  const { data: transactionLines } = useUniversalData({
    table: 'universal_transaction_lines',
    filter: (item) => 
      item.transaction_id === params.id &&
      item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const getEntityName = (entityId: string) => {
    const entity = entities?.find(e => e.id === entityId)
    return entity?.entity_name || 'Unknown'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
      in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', icon: Package },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200' },
      normal: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
      urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  if (orgLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/furniture/production/orders"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {order.transaction_code}
              </h1>
              {getStatusBadge(order.metadata?.status || 'pending')}
              {getPriorityBadge(order.metadata?.priority || 'normal')}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Created on {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
            Update Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'production'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Production Progress
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timeline'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Timeline
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Information</h3>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Customer
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {getEntityName(order.from_entity_id || '')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Order Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(order.transaction_date), 'MMM dd, yyyy')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    Delivery Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {order.metadata?.delivery_date 
                      ? format(new Date(order.metadata.delivery_date), 'MMM dd, yyyy')
                      : 'Not set'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Amount
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(order.total_amount)}
                  </dd>
                </div>
              </dl>
              
              {order.metadata?.notes && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-1" />
                    Notes
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                    {order.metadata.notes}
                  </dd>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Items</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactionLines?.map((line) => (
                      <tr key={line.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getEntityName(line.line_entity_id || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {line.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(line.unit_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(line.line_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                        Total
                      </td>
                      <td className="px-6 py-4 text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md">
                  Start Production
                </button>
                <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md">
                  Update Progress
                </button>
                <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md">
                  Generate Invoice
                </button>
                <button className="w-full text-left px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md">
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Related Links */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Related</h3>
              <div className="space-y-2">
                <Link
                  href={`/furniture/customers/${order.from_entity_id}`}
                  className="block text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  View Customer Profile
                </Link>
                <Link
                  href="/furniture/production/tracking"
                  className="block text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Production Tracking
                </Link>
                <Link
                  href="/furniture/inventory"
                  className="block text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Check Inventory
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Production Progress</h3>
          <p className="text-gray-600 dark:text-gray-400">Production tracking details would be displayed here.</p>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Timeline</h3>
          <p className="text-gray-600 dark:text-gray-400">Order history and timeline would be displayed here.</p>
        </div>
      )}
    </div>
  )
}