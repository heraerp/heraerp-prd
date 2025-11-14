'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Database,
  FileText,
  Download,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react'
import { useSyncRunLogs, useSyncRunErrors } from '@/hooks/integration-hub/useSyncRuns'
import { format } from 'date-fns'
import type { SyncRun } from '@/types/integration-hub'

interface SyncRunDetailsModalProps {
  open: boolean
  onClose: () => void
  syncRun: SyncRun
}

export function SyncRunDetailsModal({ open, onClose, syncRun }: SyncRunDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: logs } = useSyncRunLogs(syncRun.id)
  const { data: errors } = useSyncRunErrors(syncRun.id)

  const getStatusIcon = (status: SyncRun['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes} minutes ${remainingSeconds} seconds`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon(syncRun.status)}
            <span>Sync Run Details</span>
            <Badge variant="secondary">{syncRun.entity_code}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="logs">
              Logs {logs && logs.total > 0 && `(${logs.total})`}
            </TabsTrigger>
            <TabsTrigger value="errors">
              Errors {errors && errors.total > 0 && `(${errors.total})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(syncRun.status)}
                    <span className="text-lg font-semibold capitalize">{syncRun.status}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      {formatDuration(syncRun.duration_seconds)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Started At
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">{format(new Date(syncRun.started_at), 'PPpp')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ended At
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {syncRun.ended_at
                      ? format(new Date(syncRun.ended_at), 'PPpp')
                      : 'Still running...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Run Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Run ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{syncRun.id}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(syncRun.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Sync Job ID</span>
                  <code className="text-sm">{syncRun.sync_job_id}</code>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Organization ID</span>
                  <code className="text-sm">{syncRun.organization_id}</code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Record Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Total Records</span>
                        <span className="text-sm font-medium">{syncRun.stats.total_records}</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Processed</span>
                        <span className="text-sm font-medium">
                          {syncRun.stats.processed_records}
                        </span>
                      </div>
                      <Progress
                        value={
                          (syncRun.stats.processed_records / syncRun.stats.total_records) * 100
                        }
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-green-600">Created</span>
                        <span className="text-sm font-medium">{syncRun.stats.created_records}</span>
                      </div>
                      <Progress
                        value={(syncRun.stats.created_records / syncRun.stats.total_records) * 100}
                        className="h-2 [&>div]:bg-green-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-blue-600">Updated</span>
                        <span className="text-sm font-medium">{syncRun.stats.updated_records}</span>
                      </div>
                      <Progress
                        value={(syncRun.stats.updated_records / syncRun.stats.total_records) * 100}
                        className="h-2 [&>div]:bg-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-yellow-600">Skipped</span>
                        <span className="text-sm font-medium">{syncRun.stats.skipped_records}</span>
                      </div>
                      <Progress
                        value={(syncRun.stats.skipped_records / syncRun.stats.total_records) * 100}
                        className="h-2 [&>div]:bg-yellow-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-red-600">Errors</span>
                        <span className="text-sm font-medium">{syncRun.stats.error_records}</span>
                      </div>
                      <Progress
                        value={(syncRun.stats.error_records / syncRun.stats.total_records) * 100}
                        className="h-2 [&>div]:bg-red-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-muted-foreground">Records per Second</span>
                    <span className="text-sm font-medium">
                      {syncRun.duration_seconds
                        ? Math.round(syncRun.stats.processed_records / syncRun.duration_seconds)
                        : 0}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-sm text-muted-foreground">Data Volume</span>
                    <span className="text-sm font-medium">
                      {(syncRun.stats.data_volume_bytes / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-medium">
                      {syncRun.stats.processed_records > 0
                        ? (
                            ((syncRun.stats.processed_records - syncRun.stats.error_records) /
                              syncRun.stats.processed_records) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="text-sm font-medium">{errors?.error_rate || '0%'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Execution Logs</span>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {logs?.logs && logs.logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.logs.map((log, index) => (
                        <div
                          key={index}
                          className={cn(
                            'p-3 rounded-lg border text-sm',
                            log.level === 'error' &&
                              'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
                            log.level === 'warn' &&
                              'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                            log.level === 'info' &&
                              'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                            log.level === 'debug' &&
                              'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={
                                    log.level === 'error'
                                      ? 'destructive'
                                      : log.level === 'warn'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {log.level}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                                </span>
                              </div>
                              <p className="text-sm">{log.message}</p>
                              {log.context && (
                                <pre className="text-xs mt-2 p-2 bg-muted rounded">
                                  {JSON.stringify(log.context, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No logs available</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Error Details</span>
                  {errors && errors.total > 0 && (
                    <Badge variant="destructive">{errors.total} errors</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors?.errors && errors.errors.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {errors.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {error.error_type}
                                </Badge>
                                <span>{error.error_code}</span>
                                <span>{format(new Date(error.timestamp), 'HH:mm:ss')}</span>
                                {error.retry_count > 0 && <span>Retried {error.retry_count}x</span>}
                              </div>
                              <p className="text-sm font-medium">{error.message}</p>
                              {error.record_id && (
                                <p className="text-xs">Record ID: {error.record_id}</p>
                              )}
                              {error.details && (
                                <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                                  {JSON.stringify(error.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No errors encountered</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
