'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Factory, 
  Package, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  Activity,
  Gauge,
  Truck,
  Wrench,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import Link from 'next/link'
import { useDemoOrganization, OrganizationInfo, OrganizationLoading } from '@/lib/dna/patterns/demo-org-pattern'
import { useUniversalData, universalFilters, universalSorters } from '@/lib/dna/patterns/universal-api-loading-pattern'
import { cn } from '@/lib/utils'

export default function FurnitureProduction() {
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()
  
  // Load production orders
  const { data: productionOrders, loading: ordersLoading } = useUniversalData({
    table: 'universal_transactions',
    filter: (t) => 
      t.transaction_type === 'production_order' &&
      t.smart_code?.includes('HERA.MFG.PROD'),
    sort: universalSorters.byCreatedDesc,
    organizationId,
    enabled: !!organizationId
  })

  // Load work centers
  const { data: workCenters, loading: centersLoading } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('work_center'),
    organizationId,
    enabled: !!organizationId
  })

  // Load products for production order details
  const { data: products } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('product'),
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for progress tracking
  const { data: transactionLines } = useUniversalData({
    table: 'universal_transaction_lines',
    organizationId,
    enabled: !!organizationId
  })

  // Load relationships for status
  const { data: relationships } = useUniversalData({
    table: 'core_relationships',
    filter: (r) => r.relationship_type === 'has_status',
    organizationId,
    enabled: !!organizationId
  })

  // Load status entities
  const { data: statusEntities } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('workflow_status'),
    organizationId,
    enabled: !!organizationId
  })

  // Calculate production statistics
  const stats = {
    activeOrders: productionOrders.filter(o => {
      const statusRel = relationships.find(r => r.from_entity_id === o.id)
      const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null
      return status?.entity_code === 'STATUS-IN_PROGRESS' || !status
    }).length,
    
    plannedQuantity: productionOrders.reduce((sum, o) => 
      sum + (o.total_amount || 0), 0
    ),
    
    completedToday: productionOrders.filter(o => {
      const completedDate = new Date(o.metadata?.completed_date || '')
      const today = new Date()
      return completedDate.toDateString() === today.toDateString()
    }).length,
    
    workCenterUtilization: workCenters.length > 0 ? 78 : 0 // Would calculate from machine logs
  }

  if (orgLoading) {
    return <OrganizationLoading />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Production Management
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor and manage production orders and work centers
            </p>
            <OrganizationInfo name={organizationName} id={organizationId} />
          </div>
          <div className="flex gap-3">
            <Link href="/furniture/production/planning">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Planning
              </Button>
            </Link>
            <Link href="/furniture/production/orders/new">
              <Button className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                <Plus className="h-4 w-4" />
                New Production Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Factory className="h-6 w-6 text-blue-500" />
              </div>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                Active
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Orders</p>
              <p className="text-3xl font-bold text-white">{stats.activeOrders}</p>
              <p className="text-xs text-gray-500 mt-2">
                In production now
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Package className="h-6 w-6 text-purple-500" />
              </div>
              <ArrowUp className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Planned Units</p>
              <p className="text-3xl font-bold text-white">{stats.plannedQuantity}</p>
              <p className="text-xs text-gray-500 mt-2">
                Total to produce
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                Today
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Completed Today</p>
              <p className="text-3xl font-bold text-white">{stats.completedToday}</p>
              <p className="text-xs text-gray-500 mt-2">
                Units finished
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Gauge className="h-6 w-6 text-amber-500" />
              </div>
              <Activity className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Utilization</p>
              <p className="text-3xl font-bold text-white">{stats.workCenterUtilization}%</p>
              <p className="text-xs text-gray-500 mt-2">
                Work center capacity
              </p>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="orders">Production Orders</TabsTrigger>
            <TabsTrigger value="workcenters">Work Centers</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Active Production Orders</h2>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="text-center text-gray-400 py-8">Loading production orders...</div>
                  ) : productionOrders.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No production orders found</div>
                  ) : (
                    productionOrders.map((order) => {
                      const product = products.find(p => p.id === order.source_entity_id)
                      const workCenter = workCenters.find(w => w.id === order.target_entity_id)
                      const orderLines = transactionLines.filter(l => l.transaction_id === order.id)
                      
                      // Calculate progress
                      const completedQty = orderLines.reduce((sum, line) => 
                        sum + (line.metadata?.completed_quantity || 0), 0
                      )
                      const progress = order.total_amount ? (completedQty / order.total_amount) * 100 : 0

                      // Get status
                      const statusRel = relationships.find(r => r.from_entity_id === order.id)
                      const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null
                      const statusCode = status?.entity_code || 'STATUS-PLANNED'

                      return (
                        <div key={order.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:bg-gray-900/70 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-white">{order.transaction_code}</p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {product?.entity_name || 'Unknown Product'} - {order.total_amount} units
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Work Center: {workCenter?.entity_name || 'Not assigned'}
                                  </p>
                                </div>
                                <Badge className={cn(
                                  "ml-4",
                                  statusCode === 'STATUS-IN_PROGRESS' ? "bg-blue-500/10 text-blue-400" :
                                  statusCode === 'STATUS-COMPLETED' ? "bg-green-500/10 text-green-400" :
                                  "bg-gray-500/10 text-gray-400"
                                )}>
                                  {status?.entity_name || 'Planned'}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">Progress</span>
                                  <span className="text-gray-300">{completedQty} / {order.total_amount} units</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-gray-700" />
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Start: {new Date(order.metadata?.planned_start || order.transaction_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due: {new Date(order.metadata?.planned_end || order.transaction_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  Batch: {order.metadata?.batch_number || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <Link href={`/furniture/production/orders/${order.id}`}>
                              <Button variant="outline" size="sm" className="ml-4">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="workcenters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centersLoading ? (
                <div className="col-span-full text-center text-gray-400 py-8">Loading work centers...</div>
              ) : (
                workCenters.map((center) => {
                  // Get dynamic data for this work center
                  const capacity = 50 // Would load from dynamic data
                  const efficiency = 85 // Would load from dynamic data
                  
                  return (
                    <Card key={center.id} className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white">{center.entity_name}</h3>
                          <p className="text-sm text-gray-400">{center.entity_code}</p>
                        </div>
                        <Factory className="h-5 w-5 text-gray-400" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Capacity/Shift</span>
                          <span className="text-sm font-medium text-white">{capacity} units</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Efficiency</span>
                          <span className="text-sm font-medium text-white">{efficiency}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Location</span>
                          <span className="text-sm font-medium text-white">{center.metadata?.location || 'Shop Floor'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          <Badge className="bg-green-500/10 text-green-400">Active</Badge>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="w-full mt-4">
                        View Details
                      </Button>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Production Schedule</h3>
              <div className="text-center text-gray-400 py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Production scheduling view coming soon</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              <div className="text-center text-gray-400 py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance analytics coming soon</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/furniture/production/orders/new">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30 hover:bg-gray-800/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Factory className="h-8 w-8 text-amber-500" />
                <span className="text-sm font-medium text-gray-300">Create Order</span>
              </div>
            </Card>
          </Link>
          
          <Link href="/furniture/production/planning">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30 hover:bg-gray-800/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Calendar className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium text-gray-300">Planning</span>
              </div>
            </Card>
          </Link>
          
          <Link href="/furniture/production/tracking">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30 hover:bg-gray-800/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Activity className="h-8 w-8 text-purple-500" />
                <span className="text-sm font-medium text-gray-300">Tracking</span>
              </div>
            </Card>
          </Link>
          
          <Link href="/furniture/production/maintenance">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30 hover:bg-gray-800/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Wrench className="h-8 w-8 text-green-500" />
                <span className="text-sm font-medium text-gray-300">Maintenance</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}