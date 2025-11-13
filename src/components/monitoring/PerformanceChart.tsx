'use client'

/**
 * HERA Performance Chart Component
 * Interactive performance metrics visualization
 * Smart Code: HERA.MONITORING.PERFORMANCE.CHART.v1
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Clock, 
  MemoryStick, 
  Zap, 
  Activity, 
  Server, 
  Globe,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

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

interface PerformanceChartProps {
  data: PerformanceMetrics[]
  selectedMetric: string
  onMetricChange: (metric: string) => void
  timeRange: '1h' | '6h' | '24h' | '7d'
}

const METRICS_CONFIG = {
  pageLoad: {
    name: 'Page Load Time',
    icon: Clock,
    color: '#3b82f6',
    unit: 'ms',
    threshold: 3000,
    formatter: (value: number) => `${Math.round(value)}ms`
  },
  timeToInteractive: {
    name: 'Time to Interactive',
    icon: Zap,
    color: '#eab308',
    unit: 'ms',
    threshold: 5000,
    formatter: (value: number) => `${Math.round(value)}ms`
  },
  memoryUsage: {
    name: 'Memory Usage',
    icon: MemoryStick,
    color: '#8b5cf6',
    unit: 'MB',
    threshold: 100 * 1024 * 1024,
    formatter: (value: number) => `${Math.round(value / 1024 / 1024)}MB`
  },
  apiLatency: {
    name: 'API Latency',
    icon: Server,
    color: '#ef4444',
    unit: 'ms',
    threshold: 1000,
    formatter: (value: number) => `${Math.round(value)}ms`
  },
  activeUsers: {
    name: 'Active Users',
    icon: Activity,
    color: '#10b981',
    unit: 'users',
    threshold: 100,
    formatter: (value: number) => `${Math.round(value)}`
  },
  cacheHitRate: {
    name: 'Cache Hit Rate',
    icon: Globe,
    color: '#06b6d4',
    unit: '%',
    threshold: 0.8,
    formatter: (value: number) => `${Math.round(value * 100)}%`
  }
}

export function PerformanceChart({ 
  data, 
  selectedMetric, 
  onMetricChange, 
  timeRange 
}: PerformanceChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line')

  // Format data for charts
  const chartData = data.map(metrics => ({
    ...metrics,
    time: new Date(metrics.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      ...(timeRange === '7d' && { month: 'short', day: 'numeric' })
    }),
    memoryMB: Math.round(metrics.memoryUsage / 1024 / 1024),
    cacheHitPercent: Math.round(metrics.cacheHitRate * 100)
  }))

  const metricConfig = METRICS_CONFIG[selectedMetric as keyof typeof METRICS_CONFIG]
  
  // Calculate trend
  const calculateTrend = (metric: string) => {
    if (data.length < 2) return { trend: 'stable', change: 0 }
    
    const recent = data.slice(-5).map(d => d[metric as keyof PerformanceMetrics] as number)
    const older = data.slice(-10, -5).map(d => d[metric as keyof PerformanceMetrics] as number)
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length || recentAvg
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    
    return {
      trend: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down',
      change: Math.abs(change)
    }
  }

  // Performance summary
  const getPerformanceSummary = () => {
    if (data.length === 0) return null

    const latest = data[data.length - 1]
    const avg = data.reduce((sum, metric) => {
      return sum + (metric[selectedMetric as keyof PerformanceMetrics] as number)
    }, 0) / data.length

    const max = Math.max(...data.map(metric => metric[selectedMetric as keyof PerformanceMetrics] as number))
    const min = Math.min(...data.map(metric => metric[selectedMetric as keyof PerformanceMetrics] as number))

    return { latest, avg, max, min }
  }

  const summary = getPerformanceSummary()
  const trend = calculateTrend(selectedMetric)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <div className="space-y-1">
            {Object.entries(METRICS_CONFIG).map(([key, config]) => {
              const value = key === 'memoryUsage' ? data.memoryMB * 1024 * 1024 : 
                           key === 'cacheHitRate' ? data.cacheHitPercent / 100 : 
                           data[key]
              return (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{config.name}</span>
                  <span className="text-xs font-medium">{config.formatter(value)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Metric Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Performance Metrics
            {metricConfig && <metricConfig.icon className="w-5 h-5" style={{ color: metricConfig.color }} />}
          </CardTitle>
          <CardDescription>
            Real-time performance monitoring and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(METRICS_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              return (
                <Button
                  key={key}
                  variant={selectedMetric === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onMetricChange(key)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {config.name}
                </Button>
              )
            })}
          </div>

          {/* Chart Type Selector */}
          <div className="flex gap-2 mb-4">
            {(['line', 'area', 'bar'] as const).map((type) => (
              <Button
                key={type}
                variant={chartType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {summary && metricConfig && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Current</div>
              <div className="text-xl font-bold">
                {metricConfig.formatter(summary.latest[selectedMetric as keyof PerformanceMetrics] as number)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {trend.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
                {trend.trend === 'down' && <TrendingDown className="w-3 h-3 text-green-500" />}
                <span className={`text-xs ${trend.trend === 'up' ? 'text-red-500' : trend.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {trend.trend === 'stable' ? 'Stable' : `${Math.round(trend.change)}% ${trend.trend}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Average</div>
              <div className="text-xl font-bold">
                {metricConfig.formatter(summary.avg)}
              </div>
              <Badge variant={summary.avg < metricConfig.threshold ? 'default' : 'destructive'} className="mt-2">
                {summary.avg < metricConfig.threshold ? 'Good' : 'Above Threshold'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Maximum</div>
              <div className="text-xl font-bold">
                {metricConfig.formatter(summary.max)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Minimum</div>
              <div className="text-xl font-bold">
                {metricConfig.formatter(summary.min)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{metricConfig?.name} Over Time</CardTitle>
          <CardDescription>
            Performance trend for the last {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              {chartType === 'line' && (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(0,0,0,0.5)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(0,0,0,0.5)"
                    fontSize={12}
                    tickFormatter={(value) => metricConfig?.formatter(value) || value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric === 'memoryUsage' ? 'memoryMB' : 
                             selectedMetric === 'cacheHitRate' ? 'cacheHitPercent' : 
                             selectedMetric}
                    stroke={metricConfig?.color || '#3b82f6'}
                    strokeWidth={2}
                    dot={{ fill: metricConfig?.color || '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: metricConfig?.color || '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              )}

              {chartType === 'area' && (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(0,0,0,0.5)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(0,0,0,0.5)"
                    fontSize={12}
                    tickFormatter={(value) => metricConfig?.formatter(value) || value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric === 'memoryUsage' ? 'memoryMB' : 
                             selectedMetric === 'cacheHitRate' ? 'cacheHitPercent' : 
                             selectedMetric}
                    stroke={metricConfig?.color || '#3b82f6'}
                    fill={metricConfig?.color || '#3b82f6'}
                    fillOpacity={0.2}
                  />
                </AreaChart>
              )}

              {chartType === 'bar' && (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(0,0,0,0.5)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(0,0,0,0.5)"
                    fontSize={12}
                    tickFormatter={(value) => metricConfig?.formatter(value) || value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={selectedMetric === 'memoryUsage' ? 'memoryMB' : 
                             selectedMetric === 'cacheHitRate' ? 'cacheHitPercent' : 
                             selectedMetric}
                    fill={metricConfig?.color || '#3b82f6'}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5" />
              Memory Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'JavaScript', value: 45, color: '#3b82f6' },
                      { name: 'Images', value: 25, color: '#ef4444' },
                      { name: 'CSS', value: 15, color: '#10b981' },
                      { name: 'Other', value: 15, color: '#6b7280' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'JavaScript', value: 45, color: '#3b82f6' },
                      { name: 'Images', value: 25, color: '#ef4444' },
                      { name: 'CSS', value: 15, color: '#10b981' },
                      { name: 'Other', value: 15, color: '#6b7280' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Score */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Score</CardTitle>
            <CardDescription>
              Overall performance health based on key metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary && Object.entries(METRICS_CONFIG).map(([key, config]) => {
              const value = summary.avg
              const score = Math.max(0, Math.min(100, (1 - (value / config.threshold)) * 100))
              const Icon = config.icon
              
              return (
                <div key={key} className="flex items-center gap-4">
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{config.name}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(score)}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${score}%`,
                          backgroundColor: score > 80 ? '#10b981' : score > 60 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}