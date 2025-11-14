'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Clock,
  Calendar
} from 'lucide-react'
import { useCreateSyncJob } from '@/hooks/integration-hub/useSyncJobs'
import { useConnectors } from '@/hooks/integration-hub/useConnectors'
import { useConnectorMappings } from '@/hooks/integration-hub/useMappings'
import type { SyncJob, SyncSchedule, SyncOptions } from '@/types/integration-hub'

interface NewSyncJobModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
}

export function NewSyncJobModal({ open, onClose, organizationId }: NewSyncJobModalProps) {
  const [jobName, setJobName] = useState('')
  const [selectedConnector, setSelectedConnector] = useState('')
  const [selectedMapping, setSelectedMapping] = useState('')
  const [syncType, setSyncType] = useState<SyncJob['sync_type']>('incremental')
  const [syncDirection, setSyncDirection] = useState<SyncJob['sync_direction']>('inbound')
  const [scheduleType, setScheduleType] = useState<'manual' | 'interval' | 'cron'>('manual')
  const [intervalMinutes, setIntervalMinutes] = useState(60)
  const [cronExpression, setCronExpression] = useState('0 * * * *')
  const [batchSize, setBatchSize] = useState(100)
  const [maxRetries, setMaxRetries] = useState(3)
  const [errorThreshold, setErrorThreshold] = useState(10)
  const [deleteMissing, setDeleteMissing] = useState(false)

  const { data: connectors } = useConnectors(organizationId)
  const { data: mappings } = useConnectorMappings(selectedConnector)
  const { mutate: createSyncJob, isPending } = useCreateSyncJob()

  const handleCreate = () => {
    if (!jobName || !selectedConnector || !selectedMapping) return

    let schedule: SyncSchedule | undefined

    if (scheduleType === 'interval') {
      schedule = {
        type: 'interval',
        interval_minutes: intervalMinutes
      }
    } else if (scheduleType === 'cron') {
      schedule = {
        type: 'cron',
        cron: cronExpression
      }
    } else {
      schedule = {
        type: 'manual'
      }
    }

    const options: SyncOptions = {
      batch_size: batchSize,
      max_retries: maxRetries,
      retry_delay_seconds: 60,
      timeout_seconds: 300,
      error_threshold: errorThreshold,
      duplicate_handling: 'update',
      delete_missing: deleteMissing,
      dry_run: false
    }

    createSyncJob(
      {
        organizationId,
        connectorId: selectedConnector,
        mappingId: selectedMapping,
        name: jobName,
        syncType,
        syncDirection,
        schedule,
        options
      },
      {
        onSuccess: () => {
          onClose()
          // Reset form
          setJobName('')
          setSelectedConnector('')
          setSelectedMapping('')
          setSyncType('incremental')
          setSyncDirection('inbound')
          setScheduleType('manual')
        }
      }
    )
  }

  const getDirectionIcon = (direction: typeof syncDirection) => {
    switch (direction) {
      case 'inbound':
        return <ArrowDownRight className="h-4 w-4" />
      case 'outbound':
        return <ArrowUpRight className="h-4 w-4" />
      case 'bidirectional':
        return <ArrowLeftRight className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sync Job</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Job Name */}
            <div>
              <Label htmlFor="name">Job Name</Label>
              <Input
                id="name"
                value={jobName}
                onChange={e => setJobName(e.target.value)}
                placeholder="e.g. Daily Contact Sync"
                className="mt-1"
              />
            </div>

            {/* Connector Selection */}
            <div>
              <Label htmlFor="connector">Connector</Label>
              <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a connector" />
                </SelectTrigger>
                <SelectContent>
                  {connectors
                    ?.filter(c => c.status === 'active')
                    .map(connector => (
                      <SelectItem key={connector.id} value={connector.id}>
                        <div className="flex items-center gap-2">
                          <span>{connector.entity_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {connector.vendor}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mapping Selection */}
            {selectedConnector && (
              <div>
                <Label htmlFor="mapping">Data Mapping</Label>
                <Select value={selectedMapping} onValueChange={setSelectedMapping}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a mapping" />
                  </SelectTrigger>
                  <SelectContent>
                    {mappings?.map(mapping => (
                      <SelectItem key={mapping.id} value={mapping.id}>
                        {mapping.entity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sync Type */}
            <div>
              <Label>Sync Type</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(['full', 'incremental', 'delta'] as const).map(type => (
                  <Card
                    key={type}
                    className={`p-3 cursor-pointer transition-all ${
                      syncType === type
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSyncType(type)}
                  >
                    <div className="text-center">
                      <div className="font-medium text-sm capitalize">{type}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {type === 'full' && 'Complete sync'}
                        {type === 'incremental' && 'Changes only'}
                        {type === 'delta' && 'Differences'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sync Direction */}
            <div>
              <Label>Sync Direction</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(['inbound', 'outbound', 'bidirectional'] as const).map(direction => (
                  <Card
                    key={direction}
                    className={`p-3 cursor-pointer transition-all ${
                      syncDirection === direction
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSyncDirection(direction)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {getDirectionIcon(direction)}
                      <span className="font-medium text-sm capitalize">{direction}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div>
              <Label>Schedule Type</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Card
                  className={`p-3 cursor-pointer transition-all ${
                    scheduleType === 'manual'
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setScheduleType('manual')}
                >
                  <div className="text-center">
                    <Play className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm font-medium">Manual</div>
                  </div>
                </Card>

                <Card
                  className={`p-3 cursor-pointer transition-all ${
                    scheduleType === 'interval'
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setScheduleType('interval')}
                >
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm font-medium">Interval</div>
                  </div>
                </Card>

                <Card
                  className={`p-3 cursor-pointer transition-all ${
                    scheduleType === 'cron'
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setScheduleType('cron')}
                >
                  <div className="text-center">
                    <Calendar className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm font-medium">Cron</div>
                  </div>
                </Card>
              </div>
            </div>

            {scheduleType === 'interval' && (
              <div>
                <Label>Run Every</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[intervalMinutes]}
                      onValueChange={([value]) => setIntervalMinutes(value)}
                      min={5}
                      max={1440}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-20 text-sm font-medium">
                      {intervalMinutes < 60
                        ? `${intervalMinutes} min`
                        : `${Math.floor(intervalMinutes / 60)} hr`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {scheduleType === 'cron' && (
              <div>
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  value={cronExpression}
                  onChange={e => setCronExpression(e.target.value)}
                  placeholder="0 * * * *"
                  className="mt-1"
                />
                <div className="mt-2 space-y-1">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setCronExpression('0 * * * *')}
                  >
                    Every hour
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs ml-4"
                    onClick={() => setCronExpression('0 0 * * *')}
                  >
                    Daily at midnight
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs ml-4"
                    onClick={() => setCronExpression('0 0 * * 1')}
                  >
                    Weekly on Monday
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label>Batch Size</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[batchSize]}
                  onValueChange={([value]) => setBatchSize(value)}
                  min={10}
                  max={1000}
                  step={10}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{batchSize}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Number of records to process at once
              </p>
            </div>

            <div>
              <Label>Max Retries</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[maxRetries]}
                  onValueChange={([value]) => setMaxRetries(value)}
                  min={0}
                  max={10}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{maxRetries}</span>
              </div>
            </div>

            <div>
              <Label>Error Threshold (%)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[errorThreshold]}
                  onValueChange={([value]) => setErrorThreshold(value)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{errorThreshold}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Stop sync if error rate exceeds this threshold
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Missing Records</Label>
                <p className="text-xs text-muted-foreground">
                  Remove records that no longer exist in source
                </p>
              </div>
              <Switch checked={deleteMissing} onCheckedChange={setDeleteMissing} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!jobName || !selectedConnector || !selectedMapping || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Create Sync Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
