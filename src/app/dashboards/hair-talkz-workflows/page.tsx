'use client'

/**
 * Hair Talkz Workflow Monitoring Dashboard
 * Real-time monitoring for the salon canary deployment
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase-client'

const HAIR_TALKZ_ORG_ID = 'hair-talkz-salon-org-uuid'
const REFRESH_INTERVAL = 30000 // 30 seconds

interface Metrics {
  p95_latency_ms: number
  error_rate_percent: number
  correlation_coverage_percent: number
  timer_backlog_count: number
  request_count: number
  timestamp: string
}

interface FeatureFlag {
  feature: string
  enabled: boolean
  enabledAt?: string
}

export default function HairTalkzWorkflowDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      // Fetch latest metrics
      const { data: metricsData } = await supabase
        .from('universal_transactions')
        .select('metadata')
        .eq('organization_id', HAIR_TALKZ_ORG_ID)
        .eq('smart_code', 'HERA.METRICS.CANARY.MONITORING.V1')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (metricsData) {
        setMetrics(metricsData.metadata as Metrics)
      }

      // Fetch feature flags
      const { data: flagsData } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value, metadata')
        .eq('organization_id', HAIR_TALKZ_ORG_ID)
        .eq('entity_id', HAIR_TALKZ_ORG_ID)
        .like('field_name', 'playbook_mode_%')

      if (flagsData) {
        const flags = flagsData.map(f => ({
          feature: f.field_name.replace('playbook_mode_', ''),
          enabled: f.field_value === 'true',
          enabledAt: f.metadata?.enabled_at
        }))
        setFeatureFlags(flags)
      }

      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getMetricStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'p95_latency':
        return value <= 200
      case 'error_rate':
        return value < 0.1
      case 'correlation_coverage':
        return value >= 95
      case 'timer_backlog':
        return value === 0
      default:
        return true
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Hair Talkz Workflow Monitoring</h1>
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hair Talkz Workflow Monitoring</h1>
        <p className="text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh: {REFRESH_INTERVAL / 1000}s
        </p>
      </div>

      {/* Feature Flags */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Playbook mode status for each feature</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featureFlags.map(flag => (
              <div key={flag.feature} className="flex items-center space-x-2">
                <Badge variant={flag.enabled ? 'default' : 'secondary'}>{flag.feature}</Badge>
                {flag.enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">P95 Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{metrics.p95_latency_ms}ms</p>
                  <p className="text-sm text-gray-500">Target: ≤200ms</p>
                </div>
                {getStatusIcon(getMetricStatus('p95_latency', metrics.p95_latency_ms))}
              </div>
              <Progress value={(200 - metrics.p95_latency_ms) / 2} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{metrics.error_rate_percent.toFixed(2)}%</p>
                  <p className="text-sm text-gray-500">Target: &lt;0.1%</p>
                </div>
                {getStatusIcon(getMetricStatus('error_rate', metrics.error_rate_percent))}
              </div>
              <Progress value={100 - metrics.error_rate_percent * 1000} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Correlation Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {metrics.correlation_coverage_percent.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Target: ≥95%</p>
                </div>
                {getStatusIcon(
                  getMetricStatus('correlation_coverage', metrics.correlation_coverage_percent)
                )}
              </div>
              <Progress value={metrics.correlation_coverage_percent} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Timer Backlog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{metrics.timer_backlog_count}</p>
                  <p className="text-sm text-gray-500">Target: 0</p>
                </div>
                {getStatusIcon(getMetricStatus('timer_backlog', metrics.timer_backlog_count))}
              </div>
              {metrics.timer_backlog_count > 0 && (
                <Badge variant="destructive" className="mt-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Backlog detected
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request Volume */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request Volume</CardTitle>
          <CardDescription>POS cart operations in the last hour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Activity className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-4xl font-bold">{metrics?.request_count || 0}</p>
              <p className="text-sm text-gray-500">Total requests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">If metrics are red, run rollback immediately:</p>
            <code className="block p-2 bg-gray-100 rounded text-sm">
              npm run salon:canary:rollback
            </code>
            <p className="text-sm text-gray-600 mt-4">View detailed logs:</p>
            <code className="block p-2 bg-gray-100 rounded text-sm">
              tail -f /var/log/hera/workflow-engine.log | grep hair-talkz
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
