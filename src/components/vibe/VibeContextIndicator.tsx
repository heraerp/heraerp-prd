'use client'

// HERA 100% Vibe Coding System - Context Indicator Component
// Smart Code: HERA.VIBE.FRONTEND.INDICATOR.CONTEXT.V1
// Purpose: Visual indicator for vibe system status and context preservation

import React, { useState, useEffect } from 'react'
import { useVibe, useVibeContext } from './VibeProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Brain,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Network,
  Shield,
  Zap,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react'

interface VibeContextIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  compact?: boolean
  showDetails?: boolean
  className?: string
}

export function VibeContextIndicator({
  position = 'bottom-right',
  compact = false,
  showDetails = true,
  className = ''
}: VibeContextIndicatorProps) {
  const {
    isVibeInitialized,
    isInitializing,
    currentSession,
    lastError,
    initializeVibe,
    destroyVibe
  } = useVibe()

  const { preserveCurrentContext } = useVibeContext(
    'HERA.VIBE.FRONTEND.INDICATOR.CONTEXT.V1',
    'Monitor vibe system status'
  )

  const [isExpanded, setIsExpanded] = useState(false)
  const [lastContextSave, setLastContextSave] = useState<Date | null>(null)
  const [autoSaveTimer, setAutoSaveTimer] = useState(30)

  // Auto-save countdown timer
  useEffect(() => {
    if (!isVibeInitialized) return

    const interval = setInterval(() => {
      setAutoSaveTimer(prev => {
        if (prev <= 1) {
          // Trigger auto-save
          preserveCurrentContext({
            auto_save: true,
            timer_triggered: true,
            system_status: 'healthy'
          }).then(() => {
            setLastContextSave(new Date())
          })
          return 30 // Reset timer
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVibeInitialized, preserveCurrentContext])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50'
      case 'top-left':
        return 'fixed top-4 left-4 z-50'
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50'
      default:
        return 'fixed bottom-4 right-4 z-50'
    }
  }

  const getStatusColor = () => {
    if (!isVibeInitialized) return 'bg-gray-9000'
    if (lastError) return 'bg-red-500'
    return 'bg-green-500'
  }

  const getStatusIcon = () => {
    if (isInitializing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (!isVibeInitialized) return <Pause className="h-4 w-4" />
    if (lastError) return <XCircle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isInitializing) return 'Initializing...'
    if (!isVibeInitialized) return 'Inactive'
    if (lastError) return 'Error'
    return 'Active'
  }

  const handleToggleVibe = () => {
    if (isVibeInitialized) {
      destroyVibe()
    } else {
      initializeVibe()
    }
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${getPositionClasses()} ${className}`}>
              <Button
                size="sm"
                variant="outline"
                className={`h-10 w-10 p-0 ${getStatusColor()} border-2 border-white shadow-lg`}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Brain className="h-5 w-5 text-foreground" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">HERA Vibe System</div>
              <div>Status: {getStatusText()}</div>
              {isVibeInitialized && <div>Next save: {autoSaveTimer}s</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <div
        className={`bg-background border border-border rounded-lg shadow-lg transition-all duration-300 ${ isExpanded ?'w-80' : 'w-48'
        }`}
      >
        {/* Header */}
        <div
          className="p-3 border-b cursor-pointer flex items-center justify-between hover:bg-muted"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-sm">HERA Vibe</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${getStatusColor()} text-foreground border-none text-xs`}
            >
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-3 space-y-3">
            {/* Session Info */}
            {isVibeInitialized && currentSession && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Session</span>
                  <span className="font-mono">{currentSession.session_id.slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Quality</span>
                  <span className="text-green-600 font-semibold">
                    {currentSession.quality_score}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Contexts</span>
                  <span>{currentSession.context_count}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Integrations</span>
                  <span>{currentSession.integration_count}</span>
                </div>
              </div>
            )}

            {/* Auto-save Timer */}
            {isVibeInitialized && (
              <div className="bg-blue-50 p-2 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-700">Auto-save</span>
                  <span className="text-blue-700 font-semibold">{autoSaveTimer}s</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - autoSaveTimer) / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Last Context Save */}
            {lastContextSave && (
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Last saved: {lastContextSave.toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {lastError && (
              <div className="bg-red-50 p-2 rounded text-xs">
                <div className="flex items-center gap-1 text-red-700 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Error</span>
                </div>
                <div className="text-red-600 text-xs">{lastError}</div>
              </div>
            )}

            {/* Quick Stats */}
            {isVibeInitialized && showDetails && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <Activity className="h-4 w-4 mx-auto text-green-500 mb-1" />
                  <div className="text-green-700 font-semibold">100%</div>
                  <div className="text-green-600">Health</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <Network className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <div className="text-blue-700 font-semibold">98%</div>
                  <div className="text-primary">Integration</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <Shield className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                  <div className="text-purple-700 font-semibold">95%</div>
                  <div className="text-purple-600">Quality</div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="border-t pt-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isVibeInitialized ? 'destructive' : 'default'}
                  onClick={handleToggleVibe}
                  className="flex-1 text-xs"
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : isVibeInitialized ? (
                    <Pause className="h-3 w-3 mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  {isInitializing ? 'Starting...' : isVibeInitialized ? 'Shutdown' : 'Start'}
                </Button>

                {isVibeInitialized && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => preserveCurrentContext({ manual_save: true })}
                    className="text-xs"
                  >
                    <Database className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Minimized Status */}
        {!isExpanded && isVibeInitialized && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Auto-save: {autoSaveTimer}s</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span>Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple floating indicator version
export function VibeFloatingIndicator() {
  const { isVibeInitialized, lastError } = useVibe()

  const getStatusColor = () => {
    if (!isVibeInitialized) return 'bg-gray-9000'
    if (lastError) return 'bg-red-500'
    return 'bg-green-500'
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-lg animate-pulse`} />
    </div>
  )
}
