'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  RefreshCw,
  Settings,
  Power,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Link,
  Unlink
} from 'lucide-react'
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
  useUpdateConnectorSchedule
} from '@/hooks/use-integrations'
import { useToast } from '@/components/ui/use-toast'
import type { VendorType, Connector } from '@/types/integrations'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { OAUTH_CONFIGS } from '@/types/integrations'

interface ConnectorCardProps {
  vendor: VendorType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  features: string[]
  color: string
  connector?: Connector
  isDemo: boolean
  onConfigureMapping?: () => void
}

export function ConnectorCard({
  vendor,
  name,
  description,
  icon: Icon,
  features,
  color,
  connector,
  isDemo,
  onConfigureMapping
}: ConnectorCardProps) {
  const { toast } = useToast()
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [appPassword, setAppPassword] = useState('')
  const [scheduleType, setScheduleType] = useState('manual')
  const [cronExpression, setCronExpression] = useState('0 * * * *') // Hourly by default

  const connectMutation = useConnectIntegration()
  const disconnectMutation = useDisconnectIntegration()
  const syncMutation = useSyncIntegration()
  const updateScheduleMutation = useUpdateConnectorSchedule()

  const isConnected = connector?.status === 'active'
  const lastSync = connector?.last_sync_at ? new Date(connector.last_sync_at) : null
  const nextSync = connector?.next_sync_at ? new Date(connector.next_sync_at) : null

  const handleConnect = async () => {
    if (vendor === 'bluesky') {
      // BlueSky uses app passwords
      if (!appPassword) {
        toast({
          title: 'App password required',
          description: 'Please enter your BlueSky app password',
          variant: 'destructive'
        })
        return
      }

      await connectMutation.mutateAsync({ vendor, authCode: appPassword })
      setShowConnectDialog(false)
      setAppPassword('')
    } else if (isDemo) {
      // Demo mode - create simulated connection
      await connectMutation.mutateAsync({ vendor })
      setShowConnectDialog(false)
    } else {
      // Production OAuth flow
      const config = OAUTH_CONFIGS[vendor]
      if (config.authorization_url) {
        const params = new URLSearchParams({
          client_id: process.env[`NEXT_PUBLIC_${vendor.toUpperCase()}_CLIENT_ID`] || '',
          redirect_uri: `${window.location.origin}/api/integrations/${vendor}/auth/callback`,
          response_type: 'code',
          scope: config.scopes?.join(' ') || '',
          state: crypto.randomUUID()
        })

        window.location.href = `${config.authorization_url}?${params}`
      }
    }
  }

  const handleDisconnect = async () => {
    if (!connector) return

    await disconnectMutation.mutateAsync({
      connectorId: connector.id,
      vendor
    })
  }

  const handleSync = async () => {
    if (!connector) return

    await syncMutation.mutateAsync({
      vendor,
      connectorId: connector.id,
      syncType: 'incremental'
    })
  }

  const handleScheduleUpdate = async () => {
    if (!connector) return

    const schedule = scheduleType === 'manual' ? null : cronExpression
    await updateScheduleMutation.mutateAsync({
      connectorId: connector.id,
      schedule
    })

    setShowScheduleDialog(false)
  }

  const getStatusBadge = () => {
    if (!connector) return null

    switch (connector.status) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Token Expired
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Card className={cn('relative overflow-hidden', isConnected && 'ring-2 ring-primary/20')}>
        <div className={cn('absolute top-0 left-0 right-0 h-1', color)} />

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', color, 'bg-opacity-10')}>
                <Icon className={cn('h-6 w-6', color.replace('bg-', 'text-'))} />
              </div>
              <div>
                <CardTitle className="text-lg">{name}</CardTitle>
                {getStatusBadge()}
              </div>
            </div>
            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSync}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                  {onConfigureMapping && (
                    <DropdownMenuItem onClick={onConfigureMapping}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Mapping
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Features:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {isConnected && connector && (
            <div className="space-y-2 border-t pt-4">
              {connector.account_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium">{connector.account_name}</span>
                </div>
              )}
              {lastSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last sync:</span>
                  <span>{format(lastSync, 'MMM d, h:mm a')}</span>
                </div>
              )}
              {nextSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next sync:</span>
                  <span>{format(nextSync, 'MMM d, h:mm a')}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          {!isConnected ? (
            <Button
              onClick={() => setShowConnectDialog(true)}
              className="w-full"
              disabled={connectMutation.isPending}
            >
              <Link className="h-4 w-4 mr-2" />
              {connectMutation.isPending ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <Button
              onClick={handleSync}
              variant="outline"
              className="w-full"
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', syncMutation.isPending && 'animate-spin')} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {name}</DialogTitle>
            <DialogDescription>
              {vendor === 'bluesky'
                ? 'Enter your BlueSky app password to connect your account.'
                : isDemo
                  ? 'This will create a demo connection with simulated data.'
                  : `You'll be redirected to ${name} to authorize the connection.`}
            </DialogDescription>
          </DialogHeader>

          {vendor === 'bluesky' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-password">App Password</Label>
                <Input
                  id="app-password"
                  type="password"
                  value={appPassword}
                  onChange={e => setAppPassword(e.target.value)}
                  placeholder="Enter your BlueSky app password"
                />
                <p className="text-xs text-muted-foreground">
                  Generate an app password from your BlueSky account settings.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Schedule</DialogTitle>
            <DialogDescription>Configure automatic sync schedule for {name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Only</SelectItem>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  value={cronExpression}
                  onChange={e => setCronExpression(e.target.value)}
                  placeholder="0 * * * *"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid cron expression for custom scheduling.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleUpdate} disabled={updateScheduleMutation.isPending}>
              {updateScheduleMutation.isPending ? 'Updating...' : 'Update Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
