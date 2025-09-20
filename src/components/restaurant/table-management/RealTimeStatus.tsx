'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Wifi,
  WifiOff,
  Activity,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface RealTimeStatusProps {
  isConnected: boolean
  connectionState: string
  lastUpdate: any
  onConnect: () => void
  onDisconnect: () => void
  onReconnect: () => void
  enableNotifications: boolean
  enableSoundAlerts: boolean
  onToggleNotifications: (enabled: boolean) => void
  onToggleSoundAlerts: (enabled: boolean) => void
  isFallback?: boolean
}

export function RealTimeStatus({
  isConnected,
  connectionState,
  lastUpdate,
  onConnect,
  onDisconnect,
  onReconnect,
  enableNotifications,
  enableSoundAlerts,
  onToggleNotifications,
  onToggleSoundAlerts,
  isFallback = false
}: RealTimeStatusProps) {
  const getConnectionStatusIcon = () => {
    switch (connectionState) {
      case 'Open':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'Fallback':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      case 'Connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'Closing':
        return <WifiOff className="w-4 h-4 text-orange-500" />
      case 'Closed':
        return <WifiOff className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'Open':
        return 'bg-green-100 text-green-800'
      case 'Fallback':
        return 'bg-blue-100 text-blue-800'
      case 'Connecting':
        return 'bg-yellow-100 text-yellow-800'
      case 'Closing':
        return 'bg-orange-100 text-orange-800'
      case 'Closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {getConnectionStatusIcon()}
            <div>
              <Badge className={getConnectionStatusColor()}>
                {connectionState === 'Open'
                  ? 'Connected'
                  : connectionState === 'Fallback'
                    ? 'HTTP Polling'
                    : connectionState}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Real-time Updates</p>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <div>
                <p className="font-medium">Last Update</p>
                <p className="text-xs">{formatDate(new Date(lastUpdate.timestamp), 'HH:mm:ss')}</p>
              </div>
            </div>
          )}

          {/* Activity Indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Notification Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleNotifications(!enableNotifications)}
            className={enableNotifications ? 'text-primary' : 'text-muted-foreground'}
          >
            {enableNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSoundAlerts(!enableSoundAlerts)}
            className={enableSoundAlerts ? 'text-primary' : 'text-muted-foreground'}
          >
            {enableSoundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Connection Controls */}
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="text-orange-600 hover:text-orange-700"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={connectionState === 'Closed' ? onConnect : onReconnect}
              className="text-green-600 hover:text-green-700"
            >
              {connectionState === 'Connecting' ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {connectionState === 'Connecting' ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </div>

      {/* Recent Updates Feed */}
      {lastUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-sm">
            <div
              className={`w-3 h-3 rounded-full ${
                lastUpdate.new_status === 'occupied'
                  ? 'bg-red-500'
                  : lastUpdate.new_status === 'available'
                    ? 'bg-green-500'
                    : lastUpdate.new_status === 'reserved'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
              }`}
            />
            <div className="flex-1">
              <p className="font-medium">
                Table {lastUpdate.table_id} → {lastUpdate.new_status}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(new Date(lastUpdate.timestamp), 'MMM d, HH:mm:ss')}
              </p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        </div>
      )}

      {/* Connection Tips */}
      {!isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-800">Real-time updates disconnected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Table statuses will refresh automatically every 30 seconds
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
