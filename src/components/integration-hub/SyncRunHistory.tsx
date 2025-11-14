'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  History,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Database,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react'
import { useSyncRuns, useSyncRunErrors } from '@/hooks/integration-hub/useSyncRuns'
import { useSyncJobs } from '@/hooks/integration-hub/useSyncJobs'
import { formatDistanceToNow, format } from 'date-fns'
import { SyncRunDetailsModal } from './modals/SyncRunDetailsModal'
import type { SyncRun } from '@/types/integration-hub'

interface SyncRunHistoryProps {
  organizationId: string
}

export function SyncRunHistory({ organizationId }: SyncRunHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRun, setSelectedRun] = useState<SyncRun | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { data: syncRuns, isLoading } = useSyncRuns(organizationId, 100)
  const { data: syncJobs } = useSyncJobs(organizationId)

  const filteredRuns = syncRuns?.filter(run => {
    const matchesSearch = run.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: SyncRun['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: SyncRun['status']) => {
    const variants: Record<SyncRun['status'], string> = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-yellow-100 text-yellow-800'
    }

    return <Badge className={variants[status]}>{status}</Badge>
  }

  const getSyncJobName = (syncJobId: string) => {
    const job = syncJobs?.find(j => j.id === syncJobId)
    return job?.entity_name || 'Unknown Job'
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalRuns = filteredRuns?.length || 0
  const completedRuns = filteredRuns?.filter(r => r.status === 'completed').length || 0
  const failedRuns = filteredRuns?.filter(r => r.status === 'failed').length || 0
  const successRate = totalRuns > 0 ? ((completedRuns / totalRuns) * 100).toFixed(1) : '0'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Sync Run History</h1>
          <p className="text-muted-foreground">View and analyze past synchronization runs</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={parseFloat(successRate)} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{completedRuns}</div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{failedRuns}</div>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sync runs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Sync Job</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns?.map(run => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedRun(run)
                    setShowDetailsModal(true)
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      {getStatusBadge(run.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getSyncJobName(run.sync_job_id)}</div>
                      <div className="text-xs text-muted-foreground">{run.entity_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {format(new Date(run.started_at), 'MMM d, HH:mm')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDuration(run.duration_seconds)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3 text-muted-foreground" />
                        {run.stats.processed_records}
                      </div>
                      {run.stats.created_records > 0 && (
                        <div className="text-xs text-green-600">
                          +{run.stats.created_records} created
                        </div>
                      )}
                      {run.stats.updated_records > 0 && (
                        <div className="text-xs text-blue-600">
                          {run.stats.updated_records} updated
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {run.stats.error_records > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {run.stats.error_records} errors
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedRun(run)
                        setShowDetailsModal(true)
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty State */}
              {filteredRuns?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sync runs found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Sync runs will appear here once jobs are executed'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedRun && (
        <SyncRunDetailsModal
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedRun(null)
          }}
          syncRun={selectedRun}
        />
      )}
    </div>
  )
}
