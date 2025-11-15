'use client'

/**
 * HERA Performance Monitoring Dashboard
 * Real-time performance metrics, analytics, and alerts
 * Smart Code: HERA.MONITORING.PERFORMANCE.DASHBOARD.v1
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Clock, 
  MemoryStick, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Download,
  Eye,
  Server,
  Globe
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { PerformanceMetricsCollector } from '@/lib/monitoring/performance-metrics-collector'
import { PerformanceChart } from '@/components/monitoring/PerformanceChart'
import { PerformanceAlerts } from '@/components/monitoring/PerformanceAlerts'
import { PageLoadAnalytics } from '@/components/monitoring/PageLoadAnalytics'

interface PerformanceMetrics {
  timestamp: number
  pageLoad: number
  timeToInteractive: number
  memoryUsage: number
  errorCount: number
  activeUsers: number
  apiLatency: number
  bundleSize: number
  cacheHitRate: number
}

interface PerformanceAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  metric: string
  threshold: number
  currentValue: number
  message: string
  timestamp: number
  resolved: boolean
}

interface PagePerformance {
  path: string
  avgLoadTime: number
  p95LoadTime: number
  visits: number
  bounceRate: number
  errorRate: number
  trend: 'up' | 'down' | 'stable'
}

export default function PerformanceDashboard() {
  const { user, organization } = useHERAAuth()
  
  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h')
  const [selectedMetric, setSelectedMetric] = useState<string>('pageLoad')
  
  // Performance data
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null)
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([])
  
  // Performance collector instance
  const [collector] = useState(() => new PerformanceMetricsCollector(organization?.id || 'demo-org'))

  /**
   * Load performance data
   */
  const loadPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Get current real-time metrics
      const current = await collector.getCurrentMetrics()
      setCurrentMetrics(current)
      
      // Get historical data
      const historical = await collector.getHistoricalData(timeRange)
      setHistoricalData(historical)
      
      // Get active alerts
      const activeAlerts = await collector.getActiveAlerts()
      setAlerts(activeAlerts)
      
      // Get page-specific performance
      const pages = await collector.getPagePerformance(timeRange)
      setPagePerformance(pages)
      
    } catch (error) {
      console.error('📊 Failed to load performance data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [collector, timeRange])

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    loadPerformanceData()
    
    if (autoRefresh) {
      const interval = setInterval(loadPerformanceData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [loadPerformanceData, autoRefresh])

  /**
   * Get performance status
   */
  const getPerformanceStatus = (metrics: PerformanceMetrics) => {
    if (!metrics) return { status: 'unknown', color: 'gray' }
    
    const issues = []
    if (metrics.pageLoad > 3000) issues.push('slow page loads')
    if (metrics.memoryUsage > 100 * 1024 * 1024) issues.push('high memory usage')
    if (metrics.apiLatency > 1000) issues.push('slow API responses')
    if (metrics.errorCount > 10) issues.push('elevated errors')
    
    if (issues.length === 0) {
      return { status: 'excellent', color: 'green', message: 'All systems performing optimally' }
    } else if (issues.length <= 2) {
      return { status: 'good', color: 'yellow', message: `Minor issues: ${issues.join(', ')}` }
    } else {
      return { status: 'poor', color: 'red', message: `Performance issues: ${issues.join(', ')}` }
    }
  }

  /**
   * Export performance report
   */
  const exportReport = async () => {
    try {
      const report = await collector.generateReport(timeRange)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `hera-performance-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('📊 Failed to export report:', error)
    }
  }

  const performanceStatus = currentMetrics ? getPerformanceStatus(currentMetrics) : null

  if (!user || !organization) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Access Required</h3>
            <p className="text-muted-foreground">Please log in to view performance dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Real-time performance monitoring for {organization.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPerformanceData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Auto: {autoRefresh ? 'On' : 'Off'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Status Overview */}
      {performanceStatus && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {performanceStatus.status === 'excellent' && <CheckCircle className="w-8 h-8 text-green-500" />}
              {performanceStatus.status === 'good' && <AlertTriangle className="w-8 h-8 text-yellow-500" />}
              {performanceStatus.status === 'poor' && <AlertTriangle className="w-8 h-8 text-red-500" />}
              
              <div>
                <h3 className="text-xl font-semibold">
                  Performance Status: 
                  <Badge className="ml-2" variant={performanceStatus.color === 'green' ? 'default' : performanceStatus.color === 'yellow' ? 'secondary' : 'destructive'}>
                    {performanceStatus.status.toUpperCase()}
                  </Badge>
                </h3>
                <p className="text-muted-foreground">{performanceStatus.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Range:</span>
        {(['1h', '6h', '24h', '7d'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Page Load Time</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{currentMetrics.pageLoad}ms</span>
                <Progress value={(currentMetrics.pageLoad / 5000) * 100} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium">Time to Interactive</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{currentMetrics.timeToInteractive}ms</span>
                <Progress value={(currentMetrics.timeToInteractive / 8000) * 100} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">
                  {Math.round(currentMetrics.memoryUsage / 1024 / 1024)}MB
                </span>
                <Progress value={(currentMetrics.memoryUsage / (200 * 1024 * 1024)) * 100} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Active Users</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{currentMetrics.activeUsers}</span>
                <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% from last hour</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Performance Charts</TabsTrigger>
          <TabsTrigger value="pages">Page Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Real-time System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentMetrics && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">API Response Time</span>
                      <span className="font-medium">{currentMetrics.apiLatency}ms</span>
                    </div>
                    <Progress value={(currentMetrics.apiLatency / 2000) * 100} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="font-medium">{Math.round(currentMetrics.cacheHitRate * 100)}%</span>
                    </div>
                    <Progress value={currentMetrics.cacheHitRate * 100} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bundle Size</span>
                      <span className="font-medium">{Math.round(currentMetrics.bundleSize / 1024)}KB</span>
                    </div>
                    <Progress value={(currentMetrics.bundleSize / (2 * 1024 * 1024)) * 100} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Top Performing Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pagePerformance.slice(0, 5).map((page, index) => (
                    <div key={page.path} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{page.path}</div>
                        <div className="text-xs text-muted-foreground">
                          {page.visits} visits • {page.avgLoadTime}ms avg
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {page.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {page.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        <Badge variant={page.avgLoadTime < 2000 ? 'default' : page.avgLoadTime < 4000 ? 'secondary' : 'destructive'}>
                          {page.avgLoadTime < 2000 ? 'Fast' : page.avgLoadTime < 4000 ? 'Average' : 'Slow'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <PerformanceChart 
            data={historicalData}
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            timeRange={timeRange}
          />
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <PageLoadAnalytics 
            pages={pagePerformance}
            timeRange={timeRange}
          />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <PerformanceAlerts 
            alerts={alerts}
            onDismissAlert={(id) => {
              setAlerts(alerts.map(alert => 
                alert.id === id ? { ...alert, resolved: true } : alert
              ))
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}