'use client'

import React from 'react'
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
  accentColor?: string
  darkColor?: string
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
  accentColor,
  darkColor,
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
      if (!appPassword && !isDemo) {
        toast({
          title: 'App password required',
          description: 'Please enter your BlueSky app password',
          variant: 'destructive'
        })
        return
      }

      // In demo mode, use a dummy password if none provided
      const password = appPassword || (isDemo ? 'demo-password' : '')
      await connectMutation.mutateAsync({ vendor, authCode: password })
      setShowConnectDialog(false)
      setAppPassword('')
    } else if (isDemo) {
      // Demo mode - create simulated connection
      try {
        await connectMutation.mutateAsync({ vendor })
        setShowConnectDialog(false)
      } catch (error: any) {
        console.error('Connection error:', error)
        // Show error details in development
        if (process.env.NODE_ENV === 'development') {
          alert(`Connection failed: ${error.message}`)
        }
      }
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
          <Badge
            variant="default"
            className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        )
      case 'expired':
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          >
            <Clock className="h-3 w-3" />
            Token Expired
          </Badge>
        )
      case 'error':
        return (
          <Badge
            variant="destructive"
            className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
          >
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
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
          isConnected && 'ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-700'
        )}
      >
        <div className={cn('absolute top-0 left-0 right-0 h-1', color, darkColor)} />

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-3 rounded-lg',
                  color.replace('600', '100'),
                  darkColor?.replace('700', '900/30')
                )}
              >
                <Icon className={cn('h-6 w-6', accentColor || color.replace('bg-', 'text-'))} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {name}
                </CardTitle>
                {getStatusBadge()}
              </div>
            </div>
            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleSync}
                    className="text-gray-700 dark:text-gray-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowScheduleDialog(true)}
                    className="text-gray-700 dark:text-gray-300"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                  {onConfigureMapping && (
                    <DropdownMenuItem
                      onClick={onConfigureMapping}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Mapping
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleDisconnect}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription className="text-gray-700 dark:text-gray-300">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Features:</p>
            <ul className="text-sm space-y-1">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span
                    className={cn(
                      'font-semibold mt-0.5',
                      accentColor || 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    •
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {isConnected && connector && (
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              {connector.account_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-400">Account:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {connector.account_name}
                  </span>
                </div>
              )}
              {lastSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-400">Last sync:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {format(lastSync, 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
              {nextSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-400">Next sync:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {format(nextSync, 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          {!isConnected ? (
            <Button
              onClick={() => setShowConnectDialog(true)}
              className={cn(
                'w-full font-semibold',
                color,
                darkColor,
                'text-white hover:opacity-90'
              )}
              disabled={connectMutation.isPending}
            >
              <Link className="h-4 w-4 mr-2" />
              {connectMutation.isPending ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <Button
              onClick={handleSync}
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
