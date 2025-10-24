'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Factory, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Wrench, 
  TrendingUp, 
  Calendar 
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ManufacturingOrder {
  id: string
  transaction_code: string
  product_id: string
  product_name: string
  quantity_to_produce: number
  quantity_completed: number
  target_completion_date: string
  status: string
  progress_percent: number
  material_status: 'available' | 'partial' | 'shortage'
  sales_order_id?: string
}

interface ProductionStatus {
  planned: number
  in_progress: number
  quality_check: number
  completed: number
  total: number
}

interface ManufacturingOrderDashboardProps {
  organizationId?: string
}

export default function ManufacturingOrderDashboard({ organizationId }: ManufacturingOrderDashboardProps) {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>({ 
    planned: 0, 
    in_progress: 0, 
    quality_check: 0, 
    completed: 0, 
    total: 0 
  })

  useEffect(() => {
    loadManufacturingOrders()
  }, [])

  const loadManufacturingOrders = async () => {
    try {
      setLoading(true)
      
      if (organizationId) {
        universalApi.setOrganizationId(organizationId)
      }
      
      // Load manufacturing orders
      const ordersData = await universalApi.read({
        table: 'core_transactions',
        filter: { transaction_type: 'manufacturing_order' }
      })
      
      const formattedOrders: ManufacturingOrder[] = []
      const statusCounts: ProductionStatus = {
        planned: 0,
        in_progress: 0,
        quality_check: 0,
        completed: 0,
        total: 0
      }
      
      for (const order of ordersData.data || []) {
        // Get product details
        const productData = await universalApi.read({
          table: 'core_entities',
          filter: { id: order.source_entity_id }
        })
        
        const product = productData.data?.[0]
        const metadata = order.metadata || {}

        const status = metadata.status || 'planned'
        const quantityCompleted = metadata.quantity_completed || 0
        const quantityToProduce = metadata.quantity_to_produce || order.total_amount || 0
        
        // Count by status
        if (status in statusCounts) {
          statusCounts[status as keyof ProductionStatus]++
        }
        statusCounts.total++
        
        // Calculate progress percentage
        const progressPercent = quantityToProduce > 0 
          ? Math.round((quantityCompleted / quantityToProduce) * 100)
          : 0

        // Check material availability
        const materialStatus = await checkMaterialAvailability(order.source_entity_id)
        
        formattedOrders.push({
          id: order.id,
          transaction_code: order.transaction_code || `MO-${order.id.slice(-6)}`,
          product_id: order.source_entity_id,
          product_name: product?.entity_name || 'Unknown Product',
          quantity_to_produce: quantityToProduce,
          quantity_completed: quantityCompleted,
          target_completion_date: metadata.target_completion_date || order.transaction_date,
          status: status,
          progress_percent: progressPercent,
          material_status: materialStatus,
          sales_order_id: metadata.sales_order_id
        })
      }
      
      setOrders(formattedOrders)
      setProductionStatus(statusCounts)
      
    } catch (err) {
      console.error('Error loading manufacturing orders:', err)
      setError('Failed to load manufacturing orders')
    } finally {
      setLoading(false)
    }
  }

  const checkMaterialAvailability = async (productId: string): Promise<'available' | 'partial' | 'shortage'> => {
    try {
      // This is a simplified check - in practice, you'd check the BOM and inventory levels
      const bomData = await universalApi.read({
        table: 'core_relationships',
        filter: { 
          source_entity_id: productId,
          relationship_type: 'BOM_COMPONENT'
        }
      })

      if (!bomData.data || bomData.data.length === 0) {
        return 'available' // No BOM defined, assume materials available
      }

      // For demo purposes, randomly assign status
      const random = Math.random()
      if (random < 0.7) return 'available'
      if (random < 0.9) return 'partial'
      return 'shortage'
    } catch (err) {
      console.error('Error checking material availability:', err)
      return 'available'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'quality_check': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMaterialStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'partial': return 'text-yellow-600'
      case 'shortage': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const updatedMetadata = {
        ...order,
        status: newStatus
      }

      await universalApi.update({
        table: 'core_transactions',
        id: orderId,
        data: {
          metadata: updatedMetadata
        }
      })

      // Reload orders
      await loadManufacturingOrders()
    } catch (err) {
      console.error('Error updating order status:', err)
      setError('Failed to update order status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading manufacturing orders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Manufacturing Orders
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage production orders
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Production Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planned</p>
                <p className="text-2xl font-bold text-blue-600">{productionStatus.planned}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{productionStatus.in_progress}</p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quality Check</p>
                <p className="text-2xl font-bold text-purple-600">{productionStatus.quality_check}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{productionStatus.completed}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{productionStatus.total}</p>
              </div>
              <Factory className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manufacturing Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manufacturing Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="quality_check">Quality Check</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.transaction_code}</TableCell>
                      <TableCell>{order.product_name}</TableCell>
                      <TableCell>
                        {order.quantity_completed} / {order.quantity_to_produce}
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="space-y-1">
                          <Progress value={order.progress_percent} className="h-2" />
                          <span className="text-xs text-gray-600">{order.progress_percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getMaterialStatusColor(order.material_status)}>
                          {order.material_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(order.target_completion_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {order.status === 'planned' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'in_progress')}
                            >
                              Start
                            </Button>
                          )}
                          {order.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'quality_check')}
                            >
                              QC
                            </Button>
                          )}
                          {order.status === 'quality_check' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No manufacturing orders found for the selected status
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}