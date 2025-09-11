'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Factory, 
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useDemoOrganization, OrganizationInfo, OrganizationLoading } from '@/lib/dna/patterns/demo-org-pattern'
import { useUniversalData, universalFilters, universalSorters } from '@/lib/dna/patterns/universal-api-loading-pattern'
import { cn } from '@/lib/utils'

export default function ProductionPlanning() {
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()

  // Load products
  const { data: products } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('product'),
    organizationId,
    enabled: !!organizationId
  })

  // Load sales orders for demand planning
  const { data: salesOrders } = useUniversalData({
    table: 'universal_transactions',
    filter: (t) => 
      t.transaction_type === 'sales_order' &&
      t.smart_code?.includes('FURNITURE.SALES'),
    sort: universalSorters.byCreatedDesc,
    organizationId,
    enabled: !!organizationId
  })

  // Load raw materials
  const { data: rawMaterials } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('raw_material'),
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

  if (orgLoading) {
    return <OrganizationLoading />
  }

  // Calculate demand from sales orders
  const demandByProduct = salesOrders.reduce((acc, order) => {
    const productId = order.source_entity_id
    if (productId) {
      acc[productId] = (acc[productId] || 0) + (order.total_amount || 0)
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Production Planning
            </h1>
            <p className="text-gray-400 mt-1">
              Plan and schedule production based on demand and capacity
            </p>
            <OrganizationInfo name={organizationName} id={organizationId} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/furniture/production/orders/new">
              <Button className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                <Plus className="h-4 w-4" />
                Create Production Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Planning Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-blue-500" />
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                Demand
              </Badge>
            </div>
            <p className="text-2xl font-bold text-white">{Object.keys(demandByProduct).length}</p>
            <p className="text-sm text-gray-400 mt-1">Products in demand</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <Factory className="h-8 w-8 text-purple-500" />
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                Capacity
              </Badge>
            </div>
            <p className="text-2xl font-bold text-white">{workCenters.length * 8}</p>
            <p className="text-sm text-gray-400 mt-1">Hours available today</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                Critical
              </Badge>
            </div>
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-sm text-gray-400 mt-1">Material shortages</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-green-500" />
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                On Time
              </Badge>
            </div>
            <p className="text-2xl font-bold text-white">92%</p>
            <p className="text-sm text-gray-400 mt-1">Delivery performance</p>
          </Card>
        </div>

        {/* Main Planning Content */}
        <Tabs defaultValue="demand" className="space-y-4">
          <TabsList className="bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="demand">Demand Planning</TabsTrigger>
            <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
            <TabsTrigger value="materials">Material Requirements</TabsTrigger>
            <TabsTrigger value="schedule">Master Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="demand" className="space-y-4">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Product Demand Analysis</h2>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <div className="space-y-4">
                  {products.map((product) => {
                    const demand = demandByProduct[product.id] || 0
                    const hasOrders = demand > 0

                    return (
                      <div key={product.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{product.entity_name}</p>
                            <p className="text-sm text-gray-400">{product.entity_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-white">{demand} units</p>
                            <Badge className={hasOrders ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}>
                              {hasOrders ? 'Active Demand' : 'No Demand'}
                            </Badge>
                          </div>
                        </div>
                        {hasOrders && (
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm">Plan Production</Button>
                            <Button variant="ghost" size="sm">View Orders</Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="capacity" className="space-y-4">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Work Center Capacity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workCenters.map((center) => (
                    <div key={center.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">{center.entity_name}</p>
                          <p className="text-sm text-gray-400">{center.metadata?.location || 'Shop Floor'}</p>
                        </div>
                        <Factory className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Available</span>
                          <span className="text-white">8 hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Scheduled</span>
                          <span className="text-white">6.5 hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Utilization</span>
                          <span className="text-white">81%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Material Requirements Planning</h2>
                <div className="space-y-4">
                  {rawMaterials.map((material) => (
                    <div key={material.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{material.entity_name}</p>
                          <p className="text-sm text-gray-400">{material.entity_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Current Stock</p>
                          <p className="text-lg font-semibold text-white">
                            {material.entity_code?.includes('TEAK') ? '250' : 
                             material.entity_code?.includes('LEATHER') ? '150' : '5000'} 
                            {' '}{material.metadata?.unit || 'units'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Master Production Schedule</h3>
              <div className="text-center text-gray-400 py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced scheduling view coming soon</p>
                <p className="text-sm mt-2">Will include Gantt charts and resource optimization</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30">
            <Link href="/furniture/production/orders/new">
              <div className="flex flex-col items-center text-center gap-2">
                <Factory className="h-8 w-8 text-amber-500" />
                <span className="text-sm font-medium text-gray-300">Create Order</span>
              </div>
            </Link>
          </Card>
          
          <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30">
            <Link href="/furniture/production">
              <div className="flex flex-col items-center text-center gap-2">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium text-gray-300">View Orders</span>
              </div>
            </Link>
          </Card>
          
          <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30">
            <div className="flex flex-col items-center text-center gap-2">
              <Users className="h-8 w-8 text-purple-500" />
              <span className="text-sm font-medium text-gray-300">Workforce</span>
            </div>
          </Card>
          
          <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-gray-800/30 backdrop-blur-sm border-gray-700/30">
            <div className="flex flex-col items-center text-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-sm font-medium text-gray-300">Quality</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}