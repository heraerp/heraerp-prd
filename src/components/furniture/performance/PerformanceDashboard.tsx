import React, { useState, useEffect }
from 'react'
import { Activity, Clock, Database, AlertCircle, TrendingUp, TrendingDown, CheckCircle, Zap, BarChart3, Gauge
}
from 'lucide-react'
import { cn }
from '@/src/lib/utils'


interface PerformanceMetric {
  label: string
  value: number
  unit: string
  trend?: 'up' | 'down' | 'stable'
  status?: 'good' | 'warning' | 'critical'
  threshold?: number
}

interface SystemHealth {
  cpu: number
  memory: number
  disk: number
  network: number
}

interface ApiEndpoint {
  name: string
  avgResponseTime: number
  calls: number
  errorRate: number
  ResponseTime: number
}

interface QueryPerformance {
  query: string
  avgDuration: number
  count: number
  slowest: number
}

interface PerformanceDashboardProps {
  className?: string
  refreshInterval?: number // in seconds
  onRefresh?: () => Promise<{ metrics: PerformanceMetric[] systemHealth: SystemHealth apiEndpoints: ApiEndpoint[] queryPerformance: QueryPerformance[] alerts: string[]
}>
}

export function PerformanceDashboard({ className, refreshInterval = 30, onRefresh
}: PerformanceDashboardProps) {
  const [loading, setLoading] = useState(true)

const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

const [metrics, setMetrics] = useState<PerformanceMetric[]>([])

const [systemHealth, setSystemHealth] = useState<SystemHealth>({ cpu: 0, memory: 0, disk: 0, network: 0 })

const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])

const [queryPerformance, setQueryPerformance] = useState<QueryPerformance[]>([])

const [alerts, setAlerts] = useState<string[]>([]) // Default metrics if no onRefresh provided const defaultMetrics: PerformanceMetric[] = [
  { label: 'Avg Response Time', value: 245, unit: 'ms', trend: 'down', status: 'good' },
  { label: 'Requests/sec', value: 142, unit: 'req/s', trend: 'up', status: 'good' },
  { label: 'Error Rate', value: 0.3, unit: '%', trend: 'stable', status: 'good' },
  { label: 'Cache Hit Rate', value: 89.5, unit: '%', trend: 'up', status: 'good' }
] // Fetch performance data const fetchData = async () => { setLoading(true) try { if (onRefresh) {
  const data = await onRefresh() setMetrics(data.metrics) setSystemHealth(data.systemHealth) setApiEndpoints(data.apiEndpoints) setQueryPerformance(data.queryPerformance) setAlerts(data.alerts  ) else { // Use default data for demo setMetrics(defaultMetrics) setSystemHealth({ cpu: 45, memory: 62, disk: 38, network: 15 }) setApiEndpoints([
  { name: 'GET /products', avgResponseTime: 120, calls: 1542, errorRate: 0.1, p95ResponseTime: 180 },
  { name: 'POST /orders', avgResponseTime: 350, calls: 423, errorRate: 0.5, p95ResponseTime: 520 },
  { name: 'GET /customers', avgResponseTime: 95, calls: 892, errorRate: 0.0, p95ResponseTime: 145 }
]) setQueryPerformance([
  { query: 'SELECT * FROM products', avgDuration: 45, count: 1200, slowest: 120 },
  { query: 'SELECT * FROM orders JOIN...', avgDuration: 180, count: 400, slowest: 850 }
]) setAlerts([]  ) setLastUpdate(new Date()  ) catch (error) {
  console.error('Failed to fetch performance data:', error)   } finally {
    setLoading(false)
  }
} // Initial fetch and setup interval useEffect(() => { fetchData()

const interval = setInterval(fetchData, refreshInterval * 1000) return () => clearInterval(interval  ), [refreshInterval])

const getStatusColor = (status?: PerformanceMetric['status']) => { switch (status) {
  case 'good': return 'text-green-600 dark:text-green-400' case 'warning': return 'text-yellow-600 dark:text-yellow-400' case 'critical': return 'text-red-600 dark:text-red-400' default: return 'text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]' } }

const getHealthColor = (value: number) => { if (value < 50) return 'bg-green-500' if (value < 75) return 'bg-yellow-500' return 'bg-red-500' }

const getTrendIcon = (trend?: PerformanceMetric['trend']) => { switch (trend) {
  case 'up': return <TrendingUp className="h-4 w-4 text-green-600" /> case 'down': return <TrendingDown className="h-4 w-4 text-red-600" /> default: return <Activity className="h-4 w-4 text-[var(--color-text-primary)]" /> } } return ( <div className={cn('space-y-6', className)}> {/* Header */} <div className="bg-[var(--color-body)] flex items-center justify-between"> <div> <h2 className="bg-[var(--color-body)] text-2xl font-bold text-[var(--color-text-primary)] text-[var(--color-text-primary)]"> Performance Monitoring </h2> <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] mt-1"> Last updated: {lastUpdate.toLocaleTimeString()} </p> </div> <button onClick={fetchData} disabled={loading} className={cn( 'px-4 py-2 rounded-lg text-sm font-medium transition-colors', 'bg-[var(--color-body)] text-[var(--color-text-primary)] hover:bg-[var(--color-body)]/80', 'disabled:opacity-50 disabled:cursor-not-allowed' )} > {loading ? 'Refreshing...' : 'Refresh Now'} </button> </div> {/* Alerts */} {alerts.length > 0 && ( <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"> <div className="bg-[var(--color-body)] flex items-center space-x-2 text-red-800 dark:text-red-200"> <AlertCircle className="h-5 w-5" /> <span className="font-medium">Active Alerts</span> </div> <ul className="bg-[var(--color-body)] mt-2 space-y-1"> {alerts.map((alert, index) => ( <li key={index} className="bg-[var(--color-body)] text-sm text-red-700 dark:text-red-300"> • {alert} </li> ))} </ul> </div> )} {/* Key Metrics */} <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> {metrics.map((metric, index) => ( <div key={index} className="bg-[var(--color-body)] bg-[var(--color-body)] rounded-lg p-6 shadow-sm border border-[var(--color-border)] border-[var(--color-border)]" > <div className="flex items-center justify-between mb-2"> <span className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]"> {metric.label} </span> {getTrendIcon(metric.trend)} </div> <div className="bg-[var(--color-body)] flex items-baseline"> <span className={cn('text-3xl font-bold', getStatusColor(metric.status))}> {metric.value} </span> <span className="ml-2 text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">{metric.unit}</span> </div> {metric.threshold && ( <div className="bg-[var(--color-body)] mt-2 text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]"> Threshold: {metric.threshold} {metric.unit} </div> )} </div> ))} </div> {/* System Health */} <div className="bg-[var(--color-body)] bg-[var(--color-body)] rounded-lg p-6 shadow-sm border border-[var(--color-border)] border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] text-[var(--color-text-primary)] mb-4 flex items-center"> <Gauge className="h-5 w-5 mr-2" /> System Health </h3> <div className="bg-[var(--color-body)] space-y-3"> {Object.entries(systemHealth).map(([key, value]) => ( <div key={key} className="bg-[var(--color-body)] flex items-center justify-between"> <span className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] capitalize"> {key} </span> <div className="bg-[var(--color-body)] flex items-center space-x-2 flex-1 ml-4"> <div className="flex-1 bg-[var(--color-body)] bg-muted-foreground/10 rounded-full h-2 overflow-hidden"> <div className={cn('h-full transition-all duration-500', getHealthColor(value))} style={{ width: `${value}%` }} /> </div> <span className="text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-secondary)] w-12 text-right"> {value}% </span> </div> </div> ))} </div> </div> {/* API Performance */} <div className="bg-[var(--color-body)] bg-[var(--color-body)] rounded-lg p-6 shadow-sm border border-[var(--color-border)] border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] text-[var(--color-text-primary)] mb-4 flex items-center"> <Zap className="h-5 w-5 mr-2" /> API Performance </h3> <div className="bg-[var(--color-body)] overflow-x-auto"> <table className="bg-[var(--color-body)] min-w-full"> <thead> <tr className="bg-[var(--color-body)] text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] uppercase tracking-wider"> <th className="bg-[var(--color-body)] text-left py-2">Endpoint</th> <th className="bg-[var(--color-body)] text-right py-2">Avg Response</th> <th className="bg-[var(--color-body)] text-right py-2">P95</th> <th className="bg-[var(--color-body)] text-right py-2">Calls</th> <th className="bg-[var(--color-body)] text-right py-2">Error %</th> </tr> </thead> <tbody className="bg-[var(--color-body)] divide-y divide-gray-200 dark:divide-gray-700"> {apiEndpoints.map((endpoint, index) => ( <tr key={index}> <td className="bg-[var(--color-body)] py-2 text-sm font-medium text-[var(--color-text-primary)] text-[var(--color-text-primary)]"> {endpoint.name} </td> <td className="bg-[var(--color-body)] py-2 text-sm text-right text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]"> {endpoint.avgResponseTime}ms </td> <td className="bg-[var(--color-body)] py-2 text-sm text-right text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]"> {endpoint.p95ResponseTime}ms </td> <td className="bg-[var(--color-body)] py-2 text-sm text-right text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]"> {endpoint.calls.toLocaleString()} </td> <td className={cn( 'py-2 text-sm text-right', endpoint.errorRate > 1 ? 'text-red-600' : 'text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]' )} > {endpoint.errorRate}% </td> </tr> ))} </tbody> </table> </div> </div> {/* Database Performance */} <div className="bg-[var(--color-body)] bg-[var(--color-body)] rounded-lg p-6 shadow-sm border border-[var(--color-border)] border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] text-[var(--color-text-primary)] mb-4 flex items-center"> <Database className="h-5 w-5 mr-2" /> Database Performance </h3> <div className="bg-[var(--color-body)] space-y-3"> {queryPerformance.map((query, index) => ( <div key={index} className="bg-[var(--color-body)] border-b border-[var(--color-border)] border-[var(--color-border)] pb-3 last:border-0 last:pb-0" > <div className="flex items-start justify-between"> <code className="bg-[var(--color-body)] text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] font-mono"> {query.query.substring(0, 50)}... </code> <span className="text-xs text-[var(--color-text-secondary)] ml-2">{query.count} calls</span> </div> <div className="flex items-center justify-between mt-2"> <span className="text-sm text-[var(--color-text-primary)] dark:text-[var(--color-text-secondary)]"> Avg: {query.avgDuration}ms </span> <span className="text-sm text-red-600 dark:text-red-400"> Slowest: {query.slowest}ms </span> </div> </div> ))} </div> </div> </div> )
}
