/**
 * Production UI Components - HERA DNA Pattern
 *
 * Reusable production management UI components that work across all manufacturing industries.
 * Provides consistent user experience while allowing industry-specific customizations.
 *
 * Acceleration: 100x (eliminates 95% of production UI development)
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Factory,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Calendar,
  Activity,
  Gauge,
  ArrowUp,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'

import { ProductionStats, ProductionProgress } from '../patterns/production-data-pattern'

// ============================================================================
// Production Metrics Cards - Universal across all industries
// ============================================================================

interface ProductionMetricsProps {
  stats: ProductionStats
  industryConfig?: any
}

export function ProductionMetricsCards({ stats, industryConfig }: ProductionMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Orders */}
      <Card className="p-6 bg-muted/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Factory className="h-6 w-6 text-blue-500" />
          </div>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
            Active
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Active Orders</p>
          <p className="text-3xl font-bold text-foreground">{stats.activeOrders}</p>
          <p className="text-xs text-muted-foreground mt-2">In production now</p>
        </div>
      </Card>

      {/* Planned Units */}
      <Card className="p-6 bg-muted/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Package className="h-6 w-6 text-purple-500" />
          </div>
          <ArrowUp className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Planned Units</p>
          <p className="text-3xl font-bold text-foreground">{stats.plannedQuantity}</p>
          <p className="text-xs text-muted-foreground mt-2">Total to produce</p>
        </div>
      </Card>

      {/* Completed Today */}
      <Card className="p-6 bg-muted/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400">
            Today
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
          <p className="text-3xl font-bold text-foreground">{stats.completedToday}</p>
          <p className="text-xs text-muted-foreground mt-2">Units finished</p>
        </div>
      </Card>

      {/* Work Center Utilization */}
      <Card className="p-6 bg-muted/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Gauge className="h-6 w-6 text-amber-500" />
          </div>
          <Activity className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Utilization</p>
          <p className="text-3xl font-bold text-foreground">{stats.workCenterUtilization}%</p>
          <p className="text-xs text-muted-foreground mt-2">Work center capacity</p>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// Production Order Card - Universal template with industry adaptations
// ============================================================================

interface ProductionOrderCardProps {
  order: any
  product?: any
  workCenter?: any
  progress: ProductionProgress
  status: string
  industryConfig?: any
  baseUrl?: string
}

export function ProductionOrderCard({
  order,
  product,
  workCenter,
  progress,
  status,
  industryConfig,
  baseUrl = '/production'
}: ProductionOrderCardProps) {
  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'STATUS-IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400'
      case 'STATUS-COMPLETED':
        return 'bg-green-500/10 text-green-400'
      case 'STATUS-ON_HOLD':
        return 'bg-amber-500/10 text-amber-400'
      case 'STATUS-CANCELLED':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-gray-500/10 text-muted-foreground'
    }
  }

  const formatStatusName = (statusCode: string) => {
    return statusCode.replace('STATUS-', '').replace('_', ' ')
  }

  return (
    <div className="p-4 bg-background/50 rounded-lg border border-border/50 hover:bg-background/70 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-foreground">{order.transaction_code}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {product?.entity_name || 'Unknown Product'} - {order.total_amount} units
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Work Center: {workCenter?.entity_name || 'Not assigned'}
              </p>
            </div>
            <Badge className={cn('ml-4', getStatusColor(status))}>{formatStatusName(status)}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-gray-300">
                {progress.completedQty} / {order.total_amount} units
              </span>
            </div>
            <Progress value={progress.progress} className="h-2 bg-muted-foreground/10" />
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Start:{' '}
              {new Date(
                (order.metadata as any)?.planned_start || order.transaction_date
              ).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due:{' '}
              {new Date(
                (order.metadata as any)?.planned_end || order.transaction_date
              ).toLocaleDateString()}
            </span>
            {(order.metadata as any)?.batch_number && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Batch: {order.metadata.batch_number}
              </span>
            )}
          </div>

          {/* Industry-specific details */}
          {industryConfig?.showExpiryDate && (order.metadata as any)?.expiry_date && (
            <div className="text-xs text-amber-400 mt-2">
              Expires: {new Date(order.metadata.expiry_date).toLocaleDateString()}
            </div>
          )}

          {progress.activeOperation && (
            <div className="text-xs text-blue-400 mt-2">
              Current: {(progress.activeOperation.metadata as any)?.operation || 'Processing'}
            </div>
          )}
        </div>

        <Link href={`${baseUrl}/orders/${order.id}`}>
          <Button variant="outline" size="sm" className="ml-4">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ============================================================================
// Work Center Status Grid - Universal with industry adaptations
// ============================================================================

interface WorkCenterGridProps {
  workCenters: any[]
  activeOrders: any[]
  products: any[]
  transactionLines: any[]
  getOrderProgress: (orderId: string, amount: number) => ProductionProgress
  industryConfig?: any
  baseUrl?: string
}

export function WorkCenterGrid({
  workCenters,
  activeOrders,
  products,
  transactionLines,
  getOrderProgress,
  industryConfig,
  baseUrl = '/production'
}: WorkCenterGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {workCenters.map(center => {
        // Find active order for this work center
        const activeOrder = activeOrders.find(o => o.target_entity_id === center.id)
        const product = activeOrder
          ? products.find(p => p.id === activeOrder.source_entity_id)
          : null
        const progress = activeOrder
          ? getOrderProgress(activeOrder.id, activeOrder.total_amount)
          : null

        return (
          <Card key={center.id} className="p-6 bg-muted/50 backdrop-blur-sm border-border/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{center.entity_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {(center.metadata as any)?.location || 'Shop Floor'}
                </p>

                {/* Industry-specific work center info */}
                {industryConfig?.showTemperature && (center.metadata as any)?.temperature && (
                  <p className="text-xs text-blue-400 mt-1">
                    Temp: {center.metadata.temperature}°C
                  </p>
                )}
              </div>
              <Badge
                className={
                  activeOrder ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-muted-foreground'
                }
              >
                {activeOrder ? 'Running' : 'Idle'}
              </Badge>
            </div>

            {activeOrder && progress ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{activeOrder.transaction_code}</p>
                  <p className="text-xs text-muted-foreground">
                    {product?.entity_name || 'Unknown Product'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2 bg-muted-foreground/10" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current Operation</span>
                  <span className="text-foreground">
                    {progress.activeOperation?.metadata?.operation || 'Setup'}
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
                <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No active order</p>
                <Link href={`${baseUrl}/orders/new`}>
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
  )
}

// ============================================================================
// Live Status Badge - Real-time indicators
// ============================================================================

interface LiveStatusBadgeProps {
  isActive: boolean
  label?: string
}

export function LiveStatusBadge({ isActive, label = 'LIVE' }: LiveStatusBadgeProps) {
  if (isActive) {
    return (
      <Badge variant="secondary" className="bg-green-500/10 text-green-400 animate-pulse">
        {label}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-gray-500/10 text-muted-foreground">
      OFFLINE
    </Badge>
  )
}

// ============================================================================
// Production Activity Feed - Recent operations
// ============================================================================

interface Activity {
  type: 'completed' | 'started' | 'alert' | 'paused'
  description: string
  details: string
  timestamp: string
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
}

export function ProductionActivityFeed({ activities, maxItems = 5 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'started':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityBgColor = (type: Activity['type']) => {
    switch (type) {
      case 'completed':
        return 'bg-green-500/10'
      case 'started':
        return 'bg-blue-500/10'
      case 'paused':
        return 'bg-yellow-500/10'
      case 'alert':
        return 'bg-amber-500/10'
      default:
        return 'bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3 text-sm">
          <div className={cn('mt-0.5 p-1.5 rounded', getActivityBgColor(activity.type))}>
            {getActivityIcon(activity.type)}
          </div>
          <div>
            <p className="text-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {activity.details} • {activity.timestamp}
            </p>
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center text-muted-foreground py-8">No recent activities</div>
      )}
    </div>
  )
}

// ============================================================================
// Production Quick Actions Grid
// ============================================================================

interface QuickAction {
  title: string
  href: string
  icon: React.ElementType
  color: string
  description?: string
}

interface QuickActionsGridProps {
  actions: QuickAction[]
  baseUrl?: string
}

export function ProductionQuickActions({
  actions,
  baseUrl = '/production'
}: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map(action => {
        const Icon = action.icon

        return (
          <Link key={action.href} href={`${baseUrl}${action.href}`}>
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-muted/30 backdrop-blur-sm border-border/30 hover:bg-muted/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Icon className={cn('h-8 w-8', action.color)} />
                <span className="text-sm font-medium text-gray-300">{action.title}</span>
                {action.description && (
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                )}
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

// ============================================================================
// Production Planning Cards - For demand/capacity planning
// ============================================================================

interface PlanningMetric {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  color: string
  badge?: string
  badgeColor?: string
}

interface PlanningMetricsProps {
  metrics: PlanningMetric[]
}

export function ProductionPlanningMetrics({ metrics }: PlanningMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon

        return (
          <Card key={index} className="p-6 bg-muted/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between mb-4">
              <Icon className={cn('h-8 w-8', metric.color)} />
              {metric.badge && (
                <Badge
                  variant="secondary"
                  className={metric.badgeColor || 'bg-blue-500/10 text-blue-400'}
                >
                  {metric.badge}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{metric.subtitle}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================================
// Default Quick Actions for Production Modules
// ============================================================================

export const DEFAULT_PRODUCTION_ACTIONS: QuickAction[] = [
  {
    title: 'Create Order',
    href: '/orders/new',
    icon: Factory,
    color: 'text-amber-500',
    description: 'New production order'
  },
  {
    title: 'Planning',
    href: '/planning',
    icon: Calendar,
    color: 'text-blue-500',
    description: 'Production planning'
  },
  {
    title: 'Tracking',
    href: '/tracking',
    icon: Activity,
    color: 'text-purple-500',
    description: 'Real-time tracking'
  },
  {
    title: 'Quality',
    href: '/quality',
    icon: CheckCircle,
    color: 'text-green-500',
    description: 'Quality control'
  }
]

// ============================================================================
// Industry-Specific Configurations
// ============================================================================

export const INDUSTRY_UI_CONFIGS = {
  FURNITURE: {
    primaryColor: 'amber',
    showSerialNumbers: true,
    showQualityChecks: true,
    workCenterIcon: Factory,
    customFields: ['wood_type', 'finish', 'dimensions']
  },

  FOOD: {
    primaryColor: 'green',
    showBatchNumbers: true,
    showExpiryDate: true,
    showTemperature: true,
    workCenterIcon: Package,
    customFields: ['batch_size', 'expiry_date', 'temperature']
  },

  PHARMACEUTICAL: {
    primaryColor: 'blue',
    showBatchNumbers: true,
    showExpiryDate: true,
    showCompliance: true,
    workCenterIcon: Target,
    customFields: ['api_content', 'potency', 'stability']
  },

  AUTOMOTIVE: {
    primaryColor: 'purple',
    showSerialNumbers: true,
    showQualityChecks: true,
    showTestResults: true,
    workCenterIcon: Factory,
    customFields: ['vin_number', 'test_results', 'paint_code']
  }
} as const

// ============================================================================
// Usage Examples and Templates
// ============================================================================

/*
USAGE EXAMPLE 1: Basic Production Dashboard

import { useProductionData } from '@/src/lib/dna/patterns/production-data-pattern'
import { ProductionMetricsCards, ProductionOrderCard } from '@/src/lib/dna/components/production-ui-pattern'

function ProductionDashboard() {
  const { organizationId } = useDemoOrganization()
  const production = useProductionData(organizationId)
  
  return (
    <div>
      <ProductionMetricsCards stats={production.stats} />
      
      {production.productionOrders.map(order => (
        <ProductionOrderCard
          key={order.id}
          order={order}
          product={production.products.find(p => p.id === order.source_entity_id)}
          progress={production.getOrderProgress(order.id, order.total_amount)}
          status={production.getOrderStatus(order.id)}
        />
      ))}
    </div>
  )
}

USAGE EXAMPLE 2: Industry-Specific Dashboard

function FurnitureProductionDashboard() {
  const production = useProductionData(organizationId)
  const config = INDUSTRY_UI_CONFIGS.FURNITURE
  
  return (
    <div>
      <ProductionMetricsCards 
        stats={production.stats} 
        industryConfig={config}
      />
      
      <WorkCenterGrid
        workCenters={production.workCenters}
        activeOrders={production.activeOrders}
        products={production.products}
        transactionLines={production.transactionLines}
        getOrderProgress={production.getOrderProgress}
        industryConfig={config}
      />
    </div>
  )
}
*/
