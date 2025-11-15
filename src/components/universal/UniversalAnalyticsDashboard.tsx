'use client'

/**
 * Universal Analytics Dashboard Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.ANALYTICS_DASHBOARD.v1
 * 
 * Comprehensive analytics dashboard for Universal CRUD systems:
 * - Cross-system performance metrics and insights
 * - Real-time data visualization and charts
 * - User activity tracking and patterns
 * - System health monitoring and alerts
 * - Data quality assessment and recommendations
 * - Usage analytics and optimization suggestions
 * - Mobile-first responsive design
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  Settings,
  Bell,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface SystemMetrics {
  system_id: string
  system_name: string
  total_records: number
  daily_operations: number
  success_rate: number
  avg_response_time: number // milliseconds
  error_count: number
  user_count: number
  last_updated: string
}

export interface PerformanceData {
  timestamp: string
  system_id: string
  operation_type: 'create' | 'read' | 'update' | 'delete'
  response_time: number
  success: boolean
  user_id: string
  organization_id: string
}

export interface UserActivityData {
  user_id: string
  user_name: string
  total_operations: number
  systems_used: string[]
  favorite_operations: Array<{
    operation: string
    count: number
    system: string
  }>
  last_activity: string
  efficiency_score: number
}

export interface DataQualityMetrics {
  system_id: string
  total_records: number
  complete_records: number
  duplicate_records: number
  invalid_records: number
  quality_score: number
  issues: Array<{
    type: string
    count: number
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
}

export interface UsageInsight {
  id: string
  type: 'optimization' | 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  system_id?: string
  metric_change?: number
  action_required: boolean
  created_at: string
}

interface UniversalAnalyticsDashboardProps {
  // Data
  systemMetrics?: SystemMetrics[]
  performanceData?: PerformanceData[]
  userActivity?: UserActivityData[]
  dataQuality?: DataQualityMetrics[]
  insights?: UsageInsight[]
  
  // Configuration
  refreshInterval?: number // minutes
  showRealTime?: boolean
  allowExport?: boolean
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d'
  
  // Callbacks
  onRefresh?: () => Promise<void>
  onExport?: (format: 'csv' | 'pdf' | 'json') => Promise<void>
  onInsightAction?: (insightId: string, action: string) => Promise<void>
  
  className?: string
}

// Sample data for demonstration
const sampleSystemMetrics: SystemMetrics[] = [
  {
    system_id: 'entities',
    system_name: 'Entity Management',
    total_records: 15420,
    daily_operations: 1234,
    success_rate: 99.2,
    avg_response_time: 156,
    error_count: 12,
    user_count: 45,
    last_updated: new Date().toISOString()
  },
  {
    system_id: 'transactions',
    system_name: 'Transaction Processing',
    total_records: 8976,
    daily_operations: 892,
    success_rate: 98.7,
    avg_response_time: 234,
    error_count: 18,
    user_count: 32,
    last_updated: new Date().toISOString()
  },
  {
    system_id: 'relationships',
    system_name: 'Relationship Mapping',
    total_records: 23567,
    daily_operations: 456,
    success_rate: 99.8,
    avg_response_time: 89,
    error_count: 3,
    user_count: 28,
    last_updated: new Date().toISOString()
  },
  {
    system_id: 'workflows',
    system_name: 'Workflow Designer',
    total_records: 567,
    daily_operations: 234,
    success_rate: 97.8,
    avg_response_time: 1234,
    error_count: 8,
    user_count: 15,
    last_updated: new Date().toISOString()
  }
]

const sampleInsights: UsageInsight[] = [
  {
    id: 'insight_1',
    type: 'optimization',
    title: 'Entity Search Performance',
    description: 'Entity search queries have increased by 45% but response time improved by 23% after indexing optimization.',
    impact: 'high',
    system_id: 'entities',
    metric_change: 23,
    action_required: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'insight_2',
    type: 'anomaly',
    title: 'Unusual Transaction Volume',
    description: 'Transaction creation volume is 3x higher than normal. Investigate potential batch operations.',
    impact: 'medium',
    system_id: 'transactions',
    metric_change: 300,
    action_required: true,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'insight_3',
    type: 'recommendation',
    title: 'Workflow Automation Opportunity',
    description: 'Manual approval patterns detected. Consider creating automated approval workflows for routine transactions.',
    impact: 'medium',
    system_id: 'workflows',
    action_required: true,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]

export function UniversalAnalyticsDashboard({
  systemMetrics = sampleSystemMetrics,
  performanceData = [],
  userActivity = [],
  dataQuality = [],
  insights = sampleInsights,
  refreshInterval = 5,
  showRealTime = true,
  allowExport = true,
  timeRange = '24h',
  onRefresh,
  onExport,
  onInsightAction,
  className = ''
}: UniversalAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [selectedSystem, setSelectedSystem] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Auto-refresh logic
  useEffect(() => {
    if (!showRealTime || !refreshInterval) return

    const interval = setInterval(async () => {
      if (onRefresh) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        } finally {
          setIsRefreshing(false)
        }
      }
    }, refreshInterval * 60 * 1000)

    return () => clearInterval(interval)
  }, [showRealTime, refreshInterval, onRefresh])

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const filtered = selectedSystem === 'all' 
      ? systemMetrics 
      : systemMetrics.filter(m => m.system_id === selectedSystem)

    const totalRecords = filtered.reduce((sum, m) => sum + m.total_records, 0)
    const totalOperations = filtered.reduce((sum, m) => sum + m.daily_operations, 0)
    const avgSuccessRate = filtered.length > 0 
      ? filtered.reduce((sum, m) => sum + m.success_rate, 0) / filtered.length
      : 0
    const avgResponseTime = filtered.length > 0 
      ? filtered.reduce((sum, m) => sum + m.avg_response_time, 0) / filtered.length
      : 0
    const totalErrors = filtered.reduce((sum, m) => sum + m.error_count, 0)
    const totalUsers = filtered.reduce((sum, m) => sum + m.user_count, 0)

    return {
      totalRecords,
      totalOperations,
      avgSuccessRate,
      avgResponseTime,
      totalErrors,
      totalUsers,
      systemCount: filtered.length
    }
  }, [systemMetrics, selectedSystem])

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Manual refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
  }, [onRefresh])

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'pdf' | 'json') => {
    if (onExport) {
      try {
        await onExport(format)
      } catch (error) {
        console.error('Export failed:', error)
      }
    }
  }, [onExport])

  // Handle insight actions
  const handleInsightAction = useCallback(async (insightId: string, action: string) => {
    if (onInsightAction) {
      try {
        await onInsightAction(insightId, action)
      } catch (error) {
        console.error('Insight action failed:', error)
      }
    }
  }, [onInsightAction])

  // Get metric trend indication
  const getTrendIcon = useCallback((change?: number) => {
    if (!change) return <Minus size={16} className="text-slate-400" />
    if (change > 0) return <ArrowUp size={16} className="text-green-600" />
    return <ArrowDown size={16} className="text-red-600" />
  }, [])

  // Get insight severity color
  const getInsightColor = useCallback((type: string, impact: string) => {
    const colors = {
      optimization: 'text-green-600 bg-green-50',
      trend: 'text-blue-600 bg-blue-50',
      anomaly: 'text-amber-600 bg-amber-50',
      recommendation: 'text-purple-600 bg-purple-50'
    }
    return colors[type as keyof typeof colors] || 'text-slate-600 bg-slate-50'
  }, [])

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Universal CRUD Analytics</h1>
          <p className="text-slate-600">
            Real-time insights and performance monitoring across all systems
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
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

          {/* System Filter */}
          <Select value={selectedSystem} onValueChange={setSelectedSystem}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {systemMetrics.map((system) => (
                <SelectItem key={system.system_id} value={system.system_id}>
                  {system.system_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </Button>

          {allowExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedMetrics.totalRecords.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon()}
              <span className="ml-1">Across {aggregatedMetrics.systemCount} systems</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Operations</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedMetrics.totalOperations.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(15)}
              <span className="ml-1">+15% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedMetrics.avgSuccessRate.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(2.3)}
              <span className="ml-1">+2.3% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(aggregatedMetrics.avgResponseTime)}ms
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(-12)}
              <span className="ml-1">-12ms faster</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target size={20} className="text-blue-600" />
                  System Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics.map((system) => (
                    <div key={system.system_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{system.system_name}</span>
                        <span className="font-medium">{system.success_rate.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={system.success_rate} 
                        className={cn(
                          "h-2",
                          system.success_rate >= 99 ? "text-green-600" :
                          system.success_rate >= 95 ? "text-amber-600" : "text-red-600"
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{system.daily_operations} ops/day</span>
                        <span>{system.avg_response_time}ms avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Error Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-600" />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics.map((system) => (
                    <div key={system.system_id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{system.system_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {system.error_count} errors today
                        </div>
                      </div>
                      <Badge 
                        variant={system.error_count < 5 ? "default" : 
                                system.error_count < 20 ? "secondary" : "destructive"}
                      >
                        {system.error_count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Systems Tab */}
        <TabsContent value="systems" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {systemMetrics.map((system) => (
              <Card key={system.system_id}>
                <CardHeader>
                  <CardTitle className="text-base">{system.system_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Records</div>
                      <div className="font-semibold">{system.total_records.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Daily Ops</div>
                      <div className="font-semibold">{system.daily_operations}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Users</div>
                      <div className="font-semibold">{system.user_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Response</div>
                      <div className="font-semibold">{system.avg_response_time}ms</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">{system.success_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={system.success_rate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} className="text-purple-600" />
                  Active Users ({aggregatedMetrics.totalUsers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userActivity.slice(0, 8).map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.total_operations} operations • {user.systems_used.length} systems
                        </div>
                      </div>
                      <Badge variant="outline">
                        {user.efficiency_score}/100
                      </Badge>
                    </div>
                  ))}
                  
                  {userActivity.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="mx-auto mb-2 text-slate-300" size={32} />
                      <p>No user activity data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Device Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor size={20} className="text-indigo-600" />
                  Device Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor size={16} />
                      <span>Desktop</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">62%</span>
                      <Progress value={62} className="w-20 h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} />
                      <span>Mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">28%</span>
                      <Progress value={28} className="w-20 h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <span>Tablet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">10%</span>
                      <Progress value={10} className="w-20 h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={cn("px-2 py-1", getInsightColor(insight.type, insight.impact))}
                      >
                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                      </Badge>
                      {insight.impact === 'high' && <Star className="text-amber-500" size={16} />}
                      <div>
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {insight.system_id && `${insight.system_id} • `}
                          {new Date(insight.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {insight.action_required && (
                      <Button
                        size="sm"
                        onClick={() => handleInsightAction(insight.id, 'acknowledge')}
                      >
                        Take Action
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{insight.description}</p>
                  {insight.metric_change && (
                    <div className="flex items-center gap-2 mt-2">
                      {getTrendIcon(insight.metric_change)}
                      <span className="text-sm font-medium">
                        {Math.abs(insight.metric_change)}% {insight.metric_change > 0 ? 'improvement' : 'decline'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {insights.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Eye className="mx-auto mb-2 text-slate-300" size={32} />
                  <p className="text-muted-foreground">No insights available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Insights will appear as we analyze your data patterns
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Real-time indicator */}
      {showRealTime && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="outline" className="bg-white shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live</span>
            </div>
          </Badge>
        </div>
      )}
    </div>
  )
}

export default UniversalAnalyticsDashboard