'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, ShoppingCart, Package, IndianRupee, Clock, 
  Truck, CheckCircle, AlertCircle, FileText, Search,
  Filter, Calendar, TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { useUniversalSearchParams } from '@/lib/dna/hooks/search-params'
import { useFurnitureOrg } from '@/components/furniture/FurnitureOrgContext'
import { useQuery } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api-v2'
import { UniversalTable, UniversalTableRow } from '@/components/universal-ui/UniversalTable'
import { FurniturePageSkeleton } from '@/components/furniture/FurniturePageSkeleton'
import { FurnitureStatCard } from '@/components/furniture/FurnitureStatCard'
import { StatCardGrid } from '@/lib/dna/components/ui/stat-card-dna'
import { formatCurrency } from '@/lib/utils'

interface FurnitureItem {
  id: string
  name: string
  category: string
  sku: string
  price: number
}

const mockFurnitureItems: FurnitureItem[] = [
  { id: '1', name: 'Executive Teak Desk', category: 'Office Furniture', sku: 'OFC-DSK-001', price: 45000 },
  { id: '2', name: 'Rosewood Chair Set (6)', category: 'Dining', sku: 'DIN-CHR-002', price: 78000 },
  { id: '3', name: 'Sandalwood Bed Frame', category: 'Bedroom', sku: 'BED-FRM-003', price: 125000 },
  { id: '4', name: 'Custom Conference Table', category: 'Office Furniture', sku: 'OFC-TBL-004', price: 95000 }
]

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
  confirmed: { color: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
  in_production: { color: 'bg-yellow-100 text-yellow-700', label: 'In Production' },
  ready: { color: 'bg-green-100 text-green-700', label: 'Ready' },
  delivered: { color: 'bg-[var(--color-accent-teal)] text-cyan-700', label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
}

export default function SalesOrdersPage() {
  const { organizationId, orgLoading } = useFurnitureOrg()
  const searchParams = useUniversalSearchParams()
  const [selectedItems, setSelectedItems] = useState<FurnitureItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  
  const view = searchParams.get('view') || 'list'

  // Load orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['furniture-sales-orders', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const result = await universalApi.read({
        table: 'universal_transactions',
        filters: {
          organization_id: organizationId,
          transaction_type: 'sales_order'
        }
      })
      return result.data || []
    },
    enabled: !!organizationId
  })

  // Load products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['furniture-products', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          organization_id: organizationId,
          entity_type: 'product'
        }
      })
      return result.data || []
    },
    enabled: !!organizationId
  })

  const loading = ordersLoading || productsLoading
  
  const furnitureItems = products?.map(p => ({
    id: p.id,
    name: p.entity_name,
    category: p.metadata?.category || 'Furniture',
    sku: p.entity_code,
    price: p.metadata?.price || 0
  })) || mockFurnitureItems

  // Calculate stats
  const stats = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(o => o.metadata?.status === 'confirmed').length || 0,
    monthlyRevenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    avgOrderValue: orders?.length ? (orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length) : 0
  }

  const handleCreateOrder = async () => {
    if (!customerName || selectedItems.length === 0) {
      alert('Please enter customer name and select items')
      return
    }

    const total = selectedItems.reduce((sum, item) => sum + item.price, 0)
    
    try {
      await universalApi.create({
        table: 'universal_transactions',
        data: {
          organization_id: organizationId!,
          transaction_type: 'sales_order',
          transaction_date: new Date().toISOString(),
          total_amount: total,
          metadata: {
            customer_name: customerName,
            delivery_date: deliveryDate,
            status: 'draft',
            items: selectedItems
          },
          smart_code: 'HERA.FURNITURE.SALES.ORDER.V1'
        }
      })
      
      // Reset form
      setSelectedItems([])
      setCustomerName('')
      setDeliveryDate('')
      alert('Order created successfully!')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    }
  }

  if (orgLoading) {
    return <FurniturePageSkeleton />
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-900 dark:to-gray-300 bg-clip-text text-transparent">
              Sales Orders
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Create and manage furniture sales orders
            </p>
          </div>
          <div className="bg-[var(--color-body)] flex gap-3">
            <Link href="/furniture/sales/proforma">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Proforma
              </Button>
            </Link>
            <Link href="/furniture/sales/orders/new">
              <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <StatCardGrid>
          <FurnitureStatCard
            label="Total Orders"
            value={stats.totalOrders}
            change={`${stats.pendingOrders} pending`}
            trend="neutral"
            icon={Package}
            gradient="from-blue-500 to-cyan-500"
          />
          <FurnitureStatCard
            label="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            change="+15% vs last month"
            trend="up"
            icon={IndianRupee}
            gradient="from-green-500 to-emerald-500"
          />
          <FurnitureStatCard
            label="Avg Order Value"
            value={formatCurrency(stats.avgOrderValue)}
            change="Industry leading"
            trend="up"
            icon={TrendingUp}
            gradient="from-[var(--color-accent-teal)] to-[var(--color-accent-teal)]"
          />
          <FurnitureStatCard
            label="Production Queue"
            value="12"
            change="3 starting today"
            trend="neutral"
            icon={Clock}
            gradient="from-[var(--color-accent-teal)] to-orange-500"
          />
        </StatCardGrid>

        {/* Tabs for Order Management */}
        <Tabs defaultValue="orders" className="bg-[var(--color-body)] space-y-4">
          <TabsList className="bg-[var(--color-body)]/50 backdrop-blur-sm">
            <TabsTrigger value="orders">Order List</TabsTrigger>
            <TabsTrigger value="pos">Quick Order</TabsTrigger>
            <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="bg-[var(--color-body)] space-y-4">
            {/* Orders Table */}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)]">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Recent Orders</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Order ID</th>
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-indigo)] mx-auto"></div>
                          </td>
                        </tr>
                      ) : orders?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--color-text-secondary)]">
                            No orders found. Create your first order to get started.
                          </td>
                        </tr>
                      ) : (
                        orders?.map(order => (
                          <tr key={order.id} className="border-b hover:bg-[var(--color-body)]">
                            <td className="p-4">
                              <code className="text-sm">{order.transaction_code}</code>
                            </td>
                            <td className="p-4">{order.metadata?.customer_name || 'Unknown'}</td>
                            <td className="p-4">{format(new Date(order.transaction_date), 'MMM dd, yyyy')}</td>
                            <td className="p-4">{getStatusBadge(order.metadata?.status || 'draft')}</td>
                            <td className="p-4 font-semibold">{formatCurrency(order.total_amount || 0)}</td>
                            <td className="p-4">
                              <Link href={`/furniture/sales/orders/${order.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pos" className="bg-[var(--color-body)] space-y-4">
            {/* Quick Order Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Selection */}
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6">
                <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4">Select Products</h3>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-[var(--color-text-secondary)]">Loading products...</p>
                  ) : (
                    furnitureItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-body)] transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {item.category} • {item.sku}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setSelectedItems([...selectedItems, item])}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Cart */}
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6">
                <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4">
                  Cart ({selectedItems.length} items)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-3 mt-4 mb-4">
                  {selectedItems.length === 0 ? (
                    <p className="text-[var(--color-text-secondary)]">No items in cart</p>
                  ) : (
                    selectedItems.map((item, index) => (
                      <div key={index} className="bg-[var(--color-body)] flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>₹{item.price.toLocaleString('en-IN')}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total</span>
                        <span>₹{selectedItems.reduce((sum, item) => sum + item.price, 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4"
                      onClick={handleCreateOrder}
                      disabled={!customerName}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Create Order
                    </Button>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pipeline" className="bg-[var(--color-body)] space-y-4">
            {/* Sales Pipeline */}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6">
              <h3 className="text-lg font-semibold mb-6">Sales Pipeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const count = orders?.filter(o => o.metadata?.status === key).length || 0
                  return (
                    <div key={key} className="bg-[var(--color-body)] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{config.label}</h4>
                        <Badge className={config.color}>{count}</Badge>
                      </div>
                      <div className="space-y-2">
                        {orders?.filter(o => o.metadata?.status === key).slice(0, 3).map(order => (
                          <Link key={order.id} href={`/furniture/sales/orders/${order.id}`}>
                            <div className="p-2 bg-[var(--color-surface-raised)] rounded hover:shadow-sm transition-shadow cursor-pointer">
                              <p className="text-sm font-medium">{order.metadata?.customer_name}</p>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                {formatCurrency(order.total_amount || 0)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}