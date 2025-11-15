/**
 * HERA Universal Tile System - Production Performance Dashboard
 * Smart Code: HERA.MONITORING.DASHBOARD.PRODUCTION.PERFORMANCE.v1
 * 
 * Real-time production monitoring dashboard with comprehensive metrics,
 * alerts, and performance insights for the Universal Tile System
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Loader2,
  Monitor,
  RefreshCw,
  Server,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Eye,
  Download,
  Settings,
  AlertCircle,
  Cpu,
  HardDrive
} from 'lucide-react'
import { ProductionMonitor, ProductionMetrics } from '@/lib/monitoring/ProductionMonitor'
import { ErrorTracker } from '@/lib/monitoring/ErrorTracker'

interface DashboardProps {
  deploymentId: string
  environment: string
  refreshInterval?: number
}

export const ProductionDashboard: React.FC<DashboardProps> = ({
  deploymentId,
  environment = 'production',
  refreshInterval = 5000
}) => {
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [errorStats, setErrorStats] = useState<any>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const monitorRef = useRef<ProductionMonitor | null>(null)
  const errorTrackerRef = useRef<ErrorTracker | null>(null)
  
  useEffect(() => {
    initializeMonitoring()
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring()
      }
    }
  }, [deploymentId, environment])
  
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshMetrics()
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])
  
  const initializeMonitoring = () => {
    try {
      monitorRef.current = new ProductionMonitor(deploymentId, environment)
      errorTrackerRef.current = new ErrorTracker()
      
      // Initial data load
      refreshMetrics()
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to initialize monitoring:', error)
      setIsLoading(false)
    }
  }
  
  const refreshMetrics = () => {
    if (monitorRef.current) {
      const currentMetrics = monitorRef.current.getCurrentMetrics()
      setMetrics(currentMetrics)
      setLastUpdate(new Date())
    }
    
    if (errorTrackerRef.current) {
      const stats = errorTrackerRef.current.getErrorStatistics()
      setErrorStats(stats)
      
      // Get recent alerts (unresolved high/critical errors)
      const recentAlerts = errorTrackerRef.current.getErrors({
        severity: 'high',
        resolved: false,
        limit: 5
      })
      setAlerts(recentAlerts)
    }
  }
  
  const generateReport = () => {
    if (monitorRef.current) {
      const report = monitorRef.current.generateReport()
      
      // Create downloadable report
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hera-performance-report-${deploymentId}-${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  
  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-50'
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }
  
  const getPerformanceGrade = (metrics: ProductionMetrics): { grade: string; color: string } => {
    if (!metrics) return { grade: 'N/A', color: 'gray' }
    
    const score = Math.max(0, Math.min(100, 
      (100 - metrics.performance.averageRenderTime) +
      (metrics.performance.cacheHitRate * 50) +
      (Math.max(0, 100 - metrics.performance.memoryUsage)) * 0.5
    ))
    
    if (score >= 90) return { grade: 'A+', color: 'green' }
    if (score >= 80) return { grade: 'A', color: 'green' }
    if (score >= 70) return { grade: 'B', color: 'yellow' }
    if (score >= 60) return { grade: 'C', color: 'orange' }
    return { grade: 'D', color: 'red' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Initializing production monitoring...</span>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load production metrics. Please check your monitoring configuration.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const performanceGrade = getPerformanceGrade(metrics)

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring for HERA Universal Tile System
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Deployment: {deploymentId}</span>
            <span>Environment: {environment}</span>
            {lastUpdate && (
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
          
          <Button variant="outline" size="sm" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-800">
                {alerts.length} active alert{alerts.length > 1 ? 's' : ''} require attention
              </span>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300">
                View Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Performance Grade */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Performance Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-4xl font-bold text-${performanceGrade.color}-600`}>
                {performanceGrade.grade}
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Render: {metrics.performance.averageRenderTime.toFixed(1)}ms</div>
                <div>Cache: {(metrics.performance.cacheHitRate * 100).toFixed(1)}%</div>
                <div>Memory: {metrics.performance.memoryUsage.toFixed(1)}MB</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{metrics.userExperience.activeUsers}</div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+12% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold">99.9%</span>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>API: {metrics.health.apiResponseTime}ms</div>
                <div>DB: {metrics.health.databaseConnectionTime}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {(metrics.userExperience.errorRate * 100).toFixed(2)}%
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {errorStats ? `${errorStats.last24h} errors in 24h` : 'No recent errors'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Render Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Render Time</span>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(metrics.performance.averageRenderTime, { warning: 30, critical: 50 })}>
                  {metrics.performance.averageRenderTime.toFixed(1)}ms
                </Badge>
              </div>
            </div>

            {/* P95 Render Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">P95 Render Time</span>
              <Badge className={getStatusColor(metrics.performance.p95RenderTime, { warning: 50, critical: 100 })}>
                {metrics.performance.p95RenderTime.toFixed(1)}ms
              </Badge>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Memory Usage</span>
              <Badge className={getStatusColor(metrics.performance.memoryUsage, { warning: 75, critical: 100 })}>
                {metrics.performance.memoryUsage.toFixed(1)}MB
              </Badge>
            </div>

            {/* Cache Hit Rate */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cache Hit Rate</span>
              <Badge className={getStatusColor((1 - metrics.performance.cacheHitRate) * 100, { warning: 30, critical: 50 })}>
                {(metrics.performance.cacheHitRate * 100).toFixed(1)}%
              </Badge>
            </div>

            {/* Network Latency */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network Latency</span>
              <Badge className={getStatusColor(metrics.performance.networkLatency, { warning: 100, critical: 200 })}>
                {metrics.performance.networkLatency.toFixed(1)}ms
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Business Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Business Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tiles Rendered */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tiles Rendered</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{metrics.business.tilesRendered.toLocaleString()}</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>

            {/* Actions Performed */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Actions Performed</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{metrics.business.actionsPerformed.toLocaleString()}</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>

            {/* Workspaces Accessed */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Workspaces Accessed</span>
              <span className="text-lg font-bold">{metrics.business.workspacesAccessed}</span>
            </div>

            {/* Conversion Rate */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Rate</span>
              <Badge className="bg-blue-50 text-blue-600">
                {(metrics.business.conversionRate * 100).toFixed(1)}%
              </Badge>
            </div>

            {/* Revenue Impact */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenue Impact</span>
              <span className="text-lg font-bold text-green-600">
                ${metrics.business.revenueImpact.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Experience & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              User Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Duration</span>
              <span className="text-lg font-bold">
                {Math.round(metrics.userExperience.sessionDuration / 60)}min
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bounce Rate</span>
              <Badge className={getStatusColor(metrics.userExperience.bounceRate * 100, { warning: 40, critical: 60 })}>
                {(metrics.userExperience.bounceRate * 100).toFixed(1)}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Satisfaction Score</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${i < Math.floor(metrics.userExperience.satisfactionScore) ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  ({metrics.userExperience.satisfactionScore.toFixed(1)})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uptime</span>
              <Badge className="bg-green-50 text-green-600">
                {((metrics.health.uptime / (24 * 60 * 60 * 1000)) * 100).toFixed(2)}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Response Time</span>
              <Badge className={getStatusColor(metrics.health.apiResponseTime, { warning: 200, critical: 500 })}>
                {metrics.health.apiResponseTime}ms
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Connection</span>
              <Badge className={getStatusColor(metrics.health.databaseConnectionTime, { warning: 50, critical: 100 })}>
                {metrics.health.databaseConnectionTime}ms
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Error Count</span>
              <span className="text-lg font-bold text-red-600">
                {metrics.health.errorCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Statistics */}
      {errorStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">By Severity</h4>
                <div className="space-y-2">
                  {Object.entries(errorStats.bySeverity).map(([severity, count]: [string, any]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{severity}</span>
                      <Badge className={
                        severity === 'critical' ? 'bg-red-100 text-red-600' :
                        severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">By Type</h4>
                <div className="space-y-2">
                  {Object.entries(errorStats.byType).map(([type, count]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Top Patterns</h4>
                <div className="space-y-2">
                  {errorStats.patterns.slice(0, 3).map((pattern: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium truncate">{pattern.pattern}</div>
                      <div className="text-gray-500">{pattern.count} occurrences</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4">
        HERA Universal Tile System Production Dashboard v1.0 | 
        Last updated: {lastUpdate?.toLocaleString()} | 
        Monitoring deployment: {deploymentId}
      </div>
    </div>
  )
}

export default ProductionDashboard