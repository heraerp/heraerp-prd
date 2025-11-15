'use client'

/**
 * Workspace Universal Analytics Component
 * Smart Code: HERA.WORKSPACE.COMPONENT.ANALYTICS.v1
 * 
 * Workspace-aware analytics dashboard that automatically configures metrics,
 * charts, and insights based on domain/section context.
 * 
 * Features:
 * - Domain-specific KPIs and metrics
 * - Workspace-themed visualizations
 * - Context-aware data filtering and aggregation
 * - Real-time analytics with workspace-specific insights
 * - Integration with Universal Analytics Dashboard
 * - Mobile-first responsive design
 */

import React, { useState, useMemo, useCallback } from 'react'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Calculator,
  Target,
  Clock,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { UniversalAnalyticsDashboard } from '../UniversalAnalyticsDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useWorkspaceContext } from '@/lib/workspace/workspace-context'
import { cn } from '@/lib/utils'

interface WorkspaceKPI {
  id: string
  name: string
  value: number | string
  previousValue?: number
  format: 'currency' | 'number' | 'percentage' | 'text'
  trend: 'up' | 'down' | 'flat'
  change?: number
  icon: React.ComponentType<any>
  color: string
  description: string
}

interface WorkspaceChart {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: any[]
  height: number
  color: string
}

interface WorkspaceUniversalAnalyticsProps {
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d'
  showRealTime?: boolean
  allowExport?: boolean
  onRefresh?: () => Promise<void>
  className?: string
}

// Domain-specific KPI configurations
const getDomainKPIs = (domain: string, section: string): WorkspaceKPI[] => {
  const kpiConfigs = {
    sales: [
      {
        id: 'revenue',
        name: 'Total Revenue',
        value: 125430,
        previousValue: 98200,
        format: 'currency' as const,
        trend: 'up' as const,
        change: 27.8,
        icon: DollarSign,
        color: 'text-green-600',
        description: 'Total sales revenue for the period'
      },
      {
        id: 'transactions',
        name: 'Sales Transactions',
        value: 1247,
        previousValue: 1089,
        format: 'number' as const,
        trend: 'up' as const,
        change: 14.5,
        icon: Activity,
        color: 'text-blue-600',
        description: 'Number of completed sales transactions'
      },
      {
        id: 'avg_order_value',
        name: 'Avg Order Value',
        value: 89.50,
        previousValue: 85.20,
        format: 'currency' as const,
        trend: 'up' as const,
        change: 5.0,
        icon: Target,
        color: 'text-purple-600',
        description: 'Average value per sales transaction'
      },
      {
        id: 'customers',
        name: 'Active Customers',
        value: 892,
        previousValue: 834,
        format: 'number' as const,
        trend: 'up' as const,
        change: 7.0,
        icon: Users,
        color: 'text-orange-600',
        description: 'Number of customers with recent activity'
      }
    ],
    
    purchase: [
      {
        id: 'spend',
        name: 'Total Spend',
        value: 78432,
        previousValue: 82100,
        format: 'currency' as const,
        trend: 'down' as const,
        change: -4.5,
        icon: DollarSign,
        color: 'text-red-600',
        description: 'Total procurement spend for the period'
      },
      {
        id: 'orders',
        name: 'Purchase Orders',
        value: 234,
        previousValue: 198,
        format: 'number' as const,
        trend: 'up' as const,
        change: 18.2,
        icon: Package,
        color: 'text-blue-600',
        description: 'Number of purchase orders created'
      },
      {
        id: 'vendors',
        name: 'Active Vendors',
        value: 45,
        previousValue: 43,
        format: 'number' as const,
        trend: 'up' as const,
        change: 4.7,
        icon: Users,
        color: 'text-green-600',
        description: 'Number of vendors with recent orders'
      },
      {
        id: 'delivery_time',
        name: 'Avg Delivery Time',
        value: '5.2 days',
        format: 'text' as const,
        trend: 'down' as const,
        change: -8.9,
        icon: Clock,
        color: 'text-purple-600',
        description: 'Average time from order to delivery'
      }
    ],
    
    inventory: [
      {
        id: 'stock_value',
        name: 'Stock Value',
        value: 234567,
        previousValue: 221400,
        format: 'currency' as const,
        trend: 'up' as const,
        change: 5.9,
        icon: Package,
        color: 'text-blue-600',
        description: 'Total value of inventory on hand'
      },
      {
        id: 'stock_items',
        name: 'Stock Items',
        value: 1834,
        previousValue: 1789,
        format: 'number' as const,
        trend: 'up' as const,
        change: 2.5,
        icon: Package,
        color: 'text-green-600',
        description: 'Total number of items in inventory'
      },
      {
        id: 'low_stock',
        name: 'Low Stock Items',
        value: 23,
        previousValue: 31,
        format: 'number' as const,
        trend: 'down' as const,
        change: -25.8,
        icon: TrendingDown,
        color: 'text-amber-600',
        description: 'Items below minimum stock level'
      },
      {
        id: 'turnover',
        name: 'Inventory Turnover',
        value: 4.2,
        previousValue: 3.8,
        format: 'number' as const,
        trend: 'up' as const,
        change: 10.5,
        icon: TrendingUp,
        color: 'text-purple-600',
        description: 'Inventory turnover ratio'
      }
    ],
    
    finance: [
      {
        id: 'cash_flow',
        name: 'Net Cash Flow',
        value: 45670,
        previousValue: 38900,
        format: 'currency' as const,
        trend: 'up' as const,
        change: 17.4,
        icon: DollarSign,
        color: 'text-green-600',
        description: 'Net cash flow for the period'
      },
      {
        id: 'receivables',
        name: 'Accounts Receivable',
        value: 123450,
        previousValue: 118900,
        format: 'currency' as const,
        trend: 'up' as const,
        change: 3.8,
        icon: Calculator,
        color: 'text-blue-600',
        description: 'Outstanding customer receivables'
      },
      {
        id: 'payables',
        name: 'Accounts Payable',
        value: 87650,
        previousValue: 92100,
        format: 'currency' as const,
        trend: 'down' as const,
        change: -4.8,
        icon: Calculator,
        color: 'text-red-600',
        description: 'Outstanding vendor payables'
      },
      {
        id: 'profit_margin',
        name: 'Profit Margin',
        value: 23.5,
        previousValue: 21.2,
        format: 'percentage' as const,
        trend: 'up' as const,
        change: 10.8,
        icon: Target,
        color: 'text-purple-600',
        description: 'Net profit margin percentage'
      }
    ]
  }
  
  return kpiConfigs[domain as keyof typeof kpiConfigs] || kpiConfigs.sales
}

export function WorkspaceUniversalAnalytics({
  timeRange = '30d',
  showRealTime = true,
  allowExport = true,
  onRefresh,
  className = ''
}: WorkspaceUniversalAnalyticsProps) {
  const workspace = useWorkspaceContext()
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  
  // Get workspace-specific KPIs
  const workspaceKPIs = useMemo(() => 
    getDomainKPIs(workspace.domain, workspace.section), 
    [workspace.domain, workspace.section]
  )
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }, [onRefresh])
  
  // Format KPI value
  const formatKPIValue = useCallback((kpi: WorkspaceKPI) => {
    switch (kpi.format) {
      case 'currency':
        return `$${typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}`
      case 'percentage':
        return `${kpi.value}%`
      case 'number':
        return typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value
      default:
        return kpi.value.toString()
    }
  }, [])
  
  // Get trend icon
  const getTrendIcon = useCallback((trend: string, change?: number) => {
    if (trend === 'up') return <ArrowUp size={16} className="text-green-600" />
    if (trend === 'down') return <ArrowDown size={16} className="text-red-600" />
    return <Minus size={16} className="text-slate-400" />
  }, [])

  // Render KPI cards
  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {workspaceKPIs.map((kpi) => {
        const Icon = kpi.icon
        const trendIcon = getTrendIcon(kpi.trend, kpi.change)
        
        return (
          <Card key={kpi.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-opacity-10", kpi.color.replace('text-', 'bg-'))}>
                  <Icon className={cn("w-6 h-6", kpi.color)} />
                </div>
                {kpi.change && (
                  <div className="flex items-center gap-1">
                    {trendIcon}
                    <span className={cn(
                      "text-sm font-medium",
                      kpi.trend === 'up' ? "text-green-600" : 
                      kpi.trend === 'down' ? "text-red-600" : "text-slate-600"
                    )}>
                      {Math.abs(kpi.change)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.name}</p>
                <p className="text-2xl font-bold">{formatKPIValue(kpi)}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  // Render workspace-specific insights
  const renderWorkspaceInsights = () => {
    const insights = getWorkspaceInsights(workspace.domain, workspace.section)
    
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {workspace.displayName} Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                <div className={cn(
                  "p-2 rounded-full",
                  insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                  insight.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                )}>
                  {insight.type === 'positive' ? <TrendingUp size={16} /> :
                   insight.type === 'warning' ? <TrendingDown size={16} /> :
                   <Activity size={16} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.action && (
                    <Button variant="outline" size="sm" className="mt-2">
                      {insight.action}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render performance trends
  const renderPerformanceTrends = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Trends
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            {allowExport && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Interactive charts would be rendered here</p>
            <p className="text-sm">Integration with charting library (Chart.js, Recharts, etc.)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{workspace.displayName} Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics for your {workspace.domain} operations
          </p>
        </div>
        
        {showRealTime && (
          <Badge variant="outline" className="w-fit">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Data
            </div>
          </Badge>
        )}
      </div>

      {/* Workspace-specific view */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="universal">Universal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {renderKPICards()}
          {renderWorkspaceInsights()}
          {renderPerformanceTrends()}
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-6">
          {renderKPICards()}
          {/* Additional detailed charts and metrics would go here */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed analytics specific to {workspace.domain} domain would be displayed here.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Comparative Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Period-over-period comparisons and trend analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="universal">
          <UniversalAnalyticsDashboard
            timeRange={selectedTimeRange}
            showRealTime={showRealTime}
            allowExport={allowExport}
            onRefresh={onRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get workspace-specific insights
function getWorkspaceInsights(domain: string, section: string) {
  const insightConfigs: Record<string, any[]> = {
    sales: [
      {
        type: 'positive',
        title: 'Strong Sales Growth',
        description: 'Sales revenue increased by 27.8% compared to last month, driven by higher customer acquisition.',
        action: 'View Sales Report'
      },
      {
        type: 'info',
        title: 'Peak Sales Hours',
        description: 'Most sales occur between 2-4 PM. Consider staff optimization during these hours.',
        action: 'Schedule Analysis'
      }
    ],
    purchase: [
      {
        type: 'positive',
        title: 'Cost Reduction',
        description: 'Procurement costs decreased by 4.5% while maintaining quality standards.',
        action: 'View Vendor Analysis'
      },
      {
        type: 'warning',
        title: 'Delivery Delays',
        description: 'Average delivery time increased. Consider alternative vendors for critical items.',
        action: 'Review Vendors'
      }
    ],
    inventory: [
      {
        type: 'warning',
        title: 'Low Stock Alert',
        description: '23 items are below minimum stock levels. Consider reordering to avoid stockouts.',
        action: 'Create Purchase Orders'
      },
      {
        type: 'positive',
        title: 'Improved Turnover',
        description: 'Inventory turnover improved by 10.5%, indicating better demand forecasting.',
        action: 'View Turnover Report'
      }
    ],
    finance: [
      {
        type: 'positive',
        title: 'Strong Cash Position',
        description: 'Net cash flow increased by 17.4%, improving overall financial health.',
        action: 'View Cash Flow Statement'
      },
      {
        type: 'info',
        title: 'Receivables Management',
        description: 'Accounts receivable increased. Consider payment term optimization.',
        action: 'Review Payment Terms'
      }
    ]
  }
  
  return insightConfigs[domain] || []
}

export default WorkspaceUniversalAnalytics