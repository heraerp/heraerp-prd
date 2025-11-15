'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Cable,
  Activity,
  AlertCircle,
  TrendingUp,
  Clock,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  useIntegrationDashboard,
  useConnectorHealthMetrics
} from '@/hooks/integration-hub/useDashboard'
import { useSyncStatistics } from '@/hooks/integration-hub/useSyncRuns'
import { formatDistanceToNow } from 'date-fns'

interface IntegrationDashboardProps {
  organizationId: string
}

export function IntegrationDashboard({ organizationId }: IntegrationDashboardProps) {
  const { data: dashboard, isLoading: dashboardLoading } = useIntegrationDashboard(organizationId)
  const { data: healthData } = useConnectorHealthMetrics(organizationId)
  const { data: syncStats } = useSyncStatistics(organizationId, '24h')

  if (dashboardLoading || !dashboard) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Integration Hub</h1>
          <p className="text-muted-foreground">
            Centralized management for all external integrations
          </p>
        </div>
        <Button className="gap-2">
          <Cable className="h-4 w-4" />
          Add Connector
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Connectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{dashboard.active_connectors}</div>
              <div className="text-sm text-muted-foreground">of {dashboard.total_connectors}</div>
            </div>
            <Progress
              value={(dashboard.active_connectors / dashboard.total_connectors) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sync Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{dashboard.active_sync_jobs}</div>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {dashboard.total_sync_jobs} total configured
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h Data Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {(dashboard.last_24h_records / 1000).toFixed(1)}k
              </div>
              <Database className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {dashboard.last_24h_syncs} sync runs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {dashboard.last_24h_records > 0
                  ? ((dashboard.last_24h_errors / dashboard.last_24h_records) * 100).toFixed(1)
                  : 0}
                %
              </div>
              {dashboard.last_24h_errors > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {dashboard.last_24h_errors} errors
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connector Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connector Health</span>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  {dashboard.health_summary.healthy} Healthy
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  {dashboard.health_summary.degraded} Degraded
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  {dashboard.health_summary.unhealthy} Unhealthy
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData && healthData.metrics.length > 0 ? (
            <div className="space-y-3">
              {healthData.metrics.map(metric => (
                <div
                  key={metric.connector_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        metric.status === 'healthy' && 'bg-green-500',
                        metric.status === 'degraded' && 'bg-yellow-500',
                        metric.status === 'unhealthy' && 'bg-red-500'
                      )}
                    ></div>
                    <div>
                      <div className="font-medium">Connector {metric.connector_id.slice(-8)}</div>
                      <div className="text-sm text-muted-foreground">
                        Last checked{' '}
                        {formatDistanceToNow(new Date(metric.last_check), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{metric.response_time_ms}ms</div>
                      <div className="text-xs text-muted-foreground">Response time</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{metric.uptime_percentage}%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No connectors configured yet
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Syncs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcoming_syncs.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcoming_syncs.map(sync => (
                  <div key={sync.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{sync.entity_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sync.metadata?.next_run &&
                          formatDistanceToNow(new Date(sync.metadata.next_run), {
                            addSuffix: true
                          })}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {sync.sync_type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No upcoming syncs scheduled
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.top_errors.length > 0 ? (
              <div className="space-y-3">
                {dashboard.top_errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <div className="font-medium">{error.error_code}</div>
                      <div>{error.message}</div>
                      <div className="text-xs mt-1">Occurred {error.count} times</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">No recent errors</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Flow Stats */}
      {syncStats && (
        <Card>
          <CardHeader>
            <CardTitle>24-Hour Data Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Inbound</span>
                </div>
                <div className="text-2xl font-bold">
                  {(syncStats.totalInboundRecords / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-muted-foreground">
                  Peak hour: {syncStats.peakInboundHour}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Outbound</span>
                </div>
                <div className="text-2xl font-bold">
                  {(syncStats.totalOutboundRecords / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-muted-foreground">
                  Peak hour: {syncStats.peakOutboundHour}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Total Volume</span>
                </div>
                <div className="text-2xl font-bold">
                  {(
                    (syncStats.totalInboundRecords + syncStats.totalOutboundRecords) /
                    1000
                  ).toFixed(1)}
                  k
                </div>
                <div className="text-xs text-muted-foreground">
                  Error rate: {syncStats.errorRate}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
