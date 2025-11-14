'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Play,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  RotateCw,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight
} from 'lucide-react'
import { useSyncJobs, useRunSyncJob, useToggleSyncJob } from '@/hooks/integration-hub/useSyncJobs'
import { useConnectors } from '@/hooks/integration-hub/useConnectors'
import { formatDistanceToNow } from 'date-fns'
import { NewSyncJobModal } from './modals/NewSyncJobModal'
import type { SyncJob } from '@/types/integration-hub'

interface SyncJobListProps {
  organizationId: string
}

export function SyncJobList({ organizationId }: SyncJobListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  const { data: syncJobs, isLoading } = useSyncJobs(organizationId)
  const { data: connectors } = useConnectors(organizationId)
  const { mutate: runSyncJob, isPending: isRunning } = useRunSyncJob()
  const { mutate: toggleSyncJob } = useToggleSyncJob()

  const filteredSyncJobs = syncJobs?.filter(job =>
    job.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getConnectorName = (connectorId: string) => {
    const connector = connectors?.find(c => c.id === connectorId)
    return connector?.entity_name || 'Unknown Connector'
  }

  const getDirectionIcon = (direction: SyncJob['sync_direction']) => {
    switch (direction) {
      case 'inbound':
        return <ArrowDownRight className="h-4 w-4 text-blue-500" />
      case 'outbound':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'bidirectional':
        return <ArrowLeftRight className="h-4 w-4 text-purple-500" />
    }
  }

  const getScheduleDisplay = (schedule?: SyncJob['schedule']) => {
    if (!schedule) return 'Manual'

    if (schedule.type === 'cron' && schedule.cron) {
      // Simple cron descriptions
      if (schedule.cron === '0 * * * *') return 'Every hour'
      if (schedule.cron === '0 0 * * *') return 'Daily'
      if (schedule.cron === '0 0 * * 0') return 'Weekly'
      if (schedule.cron === '0 0 1 * *') return 'Monthly'
      return schedule.cron
    }

    if (schedule.type === 'interval' && schedule.interval_minutes) {
      if (schedule.interval_minutes < 60) {
        return `Every ${schedule.interval_minutes} minutes`
      }
      const hours = Math.floor(schedule.interval_minutes / 60)
      return `Every ${hours} hour${hours > 1 ? 's' : ''}`
    }

    return 'Manual'
  }

  const handleToggle = (syncJob: SyncJob) => {
    const action = syncJob.status === 'active' ? 'pause' : 'resume'
    toggleSyncJob({
      syncJobId: syncJob.id,
      organizationId,
      action
    })
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Sync Jobs</h1>
          <p className="text-muted-foreground">Configure automated data synchronization</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Sync Job
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sync jobs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sync Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Sync Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Active</TableHead>
                <TableHead>Job Name</TableHead>
                <TableHead>Connector</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSyncJobs?.map(syncJob => (
                <TableRow key={syncJob.id}>
                  <TableCell>
                    <Switch
                      checked={syncJob.status === 'active'}
                      onCheckedChange={() => handleToggle(syncJob)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{syncJob.entity_name}</div>
                      <div className="text-xs text-muted-foreground">{syncJob.sync_type}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getConnectorName(syncJob.connector_id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(syncJob.sync_direction)}
                      <span className="text-sm capitalize">{syncJob.sync_direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {syncJob.schedule?.type === 'manual' ? (
                        <Play className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{getScheduleDisplay(syncJob.schedule)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {syncJob.last_run ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(syncJob.last_run.timestamp), {
                          addSuffix: true
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {syncJob.next_run ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(syncJob.next_run), {
                          addSuffix: true
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => runSyncJob(syncJob.id)}
                          disabled={isRunning}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RotateCw className="h-4 w-4 mr-2" />
                          View Runs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(syncJob)}>
                          {syncJob.status === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty State */}
              {filteredSyncJobs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sync jobs found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Create sync jobs to automate data synchronization'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowNewModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Sync Job
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Sync Job Modal */}
      <NewSyncJobModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        organizationId={organizationId}
      />
    </div>
  )
}
