'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Factory,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  User,
  Gauge
} from 'lucide-react'
import Link from 'next/link'
import {
  useDemoOrganization,
  OrganizationInfo,
  OrganizationLoading
} from '@/lib/dna/patterns/demo-org-pattern'
import {
  useUniversalData,
  universalFilters,
  universalSorters
} from '@/lib/dna/patterns/universal-api-loading-pattern'
import { cn } from '@/lib/utils'

export default function ProductionTracking() {
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()

  // Load active production orders
  const { data: productionOrders } = useUniversalData({
    table: 'universal_transactions',
    filter: t =>
      t.transaction_type === 'production_order' && t.smart_code?.includes('HERA.MFG.PROD'),
    sort: universalSorters.byCreatedDesc,
    organizationId,
    enabled: !!organizationId
  })

  // Load work centers
  const { data: workCenters } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('work_center'),
    organizationId,
    enabled: !!organizationId
  })

  // Load products
  const { data: products } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('product'),
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for real-time tracking
  const { data: transactionLines } = useUniversalData({
    table: 'universal_transaction_lines',
    organizationId,
    enabled: !!organizationId
  })

  // Load relationships for status
  const { data: relationships } = useUniversalData({
    table: 'core_relationships',
    filter: r => r.relationship_type === 'has_status',
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

  if (orgLoading) {
    return <OrganizationLoading />
  }

  // Get active orders only
  const activeOrders = productionOrders.filter(order => {
    const statusRel = relationships.find(r => r.from_entity_id === order.id)
    const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null
    return status?.entity_code === 'STATUS-IN_PROGRESS'
  })

  // Overall statistics
  const stats = {
    activeOperations: activeOrders.length,
    unitsInProgress: activeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    avgEfficiency: 85,
    onTimeRate: 92
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Real-Time Production Tracking</h1>
            <p className="text-gray-400 mt-1">Monitor live production status and performance</p>
            <OrganizationInfo name={organizationName} id={organizationId} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Auto-refresh: ON
            </Button>
          </div>
        </div>

        {/* Live Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-8 w-8 text-green-500" />
              <Badge variant="secondary" className="bg-green-500/10 text-green-400 animate-pulse">
                LIVE
              </Badge>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeOperations}</p>
            <p className="text-sm text-gray-400 mt-1">Active Operations</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-8 w-8 text-blue-500" />
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.unitsInProgress}</p>
            <p className="text-sm text-gray-400 mt-1">Units in Progress</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <Gauge className="h-8 w-8 text-purple-500" />
              <span className="text-sm font-medium text-white">{stats.avgEfficiency}%</span>
            </div>
            <Progress value={stats.avgEfficiency} className="h-2 bg-gray-700" />
            <p className="text-sm text-gray-400 mt-2">Average Efficiency</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-amber-500" />
              <span className="text-sm font-medium text-white">{stats.onTimeRate}%</span>
            </div>
            <Progress value={stats.onTimeRate} className="h-2 bg-gray-700" />
            <p className="text-sm text-gray-400 mt-2">On-Time Rate</p>
          </Card>
        </div>

        {/* Work Center Status Grid */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Work Center Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workCenters.map(center => {
              // Find active order for this work center
              const activeOrder = activeOrders.find(o => o.target_entity_id === center.id)
              const product = activeOrder
                ? products.find(p => p.id === activeOrder.source_entity_id)
                : null
              const orderLines = activeOrder
                ? transactionLines.filter(l => l.transaction_id === activeOrder.id)
                : []

              const currentOperation = orderLines.find(
                l => (l.metadata as any)?.status === 'in_progress'
              )
              const completedOperations = orderLines.filter(
                l => (l.metadata as any)?.status === 'completed'
              ).length
              const totalOperations = orderLines.length || 1
              const progress = (completedOperations / totalOperations) * 100

              return (
                <Card
                  key={center.id}
                  className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{center.entity_name}</h3>
                      <p className="text-sm text-gray-400">
                        {(center.metadata as any)?.location || 'Shop Floor'}
                      </p>
                    </div>
                    <Badge
                      className={
                        activeOrder
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }
                    >
                      {activeOrder ? 'Running' : 'Idle'}
                    </Badge>
                  </div>

                  {activeOrder ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {activeOrder.transaction_code}
                        </p>
                        <p className="text-xs text-gray-400">
                          {product?.entity_name || 'Unknown Product'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-gray-700" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Current Operation</span>
                        <span className="text-white">
                          {currentOperation?.metadata?.operation || 'Setup'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 h-8">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-8">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Factory className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500">No active order</p>
                      <Link href="/furniture/production/orders/new">
                        <Button size="sm" variant="outline" className="mt-2">
                          <Play className="h-3 w-3 mr-1" />
                          Start Production
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {/* Active Production Orders */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Active Production Orders</h2>
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="p-6">
              <div className="space-y-4">
                {activeOrders.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No active production orders at this time
                  </div>
                ) : (
                  activeOrders.map(order => {
                    const product = products.find(p => p.id === order.source_entity_id)
                    const workCenter = workCenters.find(w => w.id === order.target_entity_id)
                    const orderLines = transactionLines.filter(l => l.transaction_id === order.id)

                    const completedQty = orderLines.reduce(
                      (sum, line) => sum + ((line.metadata as any)?.completed_quantity || 0),
                      0
                    )
                    const progress = order.total_amount
                      ? (completedQty / order.total_amount) * 100
                      : 0

                    return (
                      <div
                        key={order.id}
                        className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-semibold text-white">{order.transaction_code}</p>
                                <p className="text-sm text-gray-400">
                                  {product?.entity_name} - {order.total_amount} units
                                </p>
                              </div>
                              <Badge className="bg-green-500/10 text-green-400 animate-pulse">
                                In Progress
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-gray-400">Work Center</p>
                                <p className="text-sm font-medium text-white">
                                  {workCenter?.entity_name || 'Not assigned'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Completed</p>
                                <p className="text-sm font-medium text-white">
                                  {completedQty} / {order.total_amount} units
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Time Elapsed</p>
                                <p className="text-sm font-medium text-white">2h 35m</p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <Progress value={progress} className="h-3 bg-gray-700" />
                            </div>
                          </div>

                          <div className="ml-4">
                            <Link href={`/furniture/production/orders/${order.id}/track`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activities</h2>
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 p-1.5 bg-green-500/10 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white">Operation completed on PRD-FRN-2025-0002</p>
                    <p className="text-xs text-gray-500">
                      Cutting completed - 15 units • 2 minutes ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 p-1.5 bg-blue-500/10 rounded">
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-white">Production started on Assembly Line 1</p>
                    <p className="text-xs text-gray-500">
                      Order PRD-FRN-2025-0002 • 15 minutes ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 p-1.5 bg-amber-500/10 rounded">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white">Quality check required</p>
                    <p className="text-xs text-gray-500">
                      Batch BATCH-2025-002 ready for inspection • 30 minutes ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
