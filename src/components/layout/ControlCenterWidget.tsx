'use client'

/**
 * Control Center Widget
 * Always-visible widget for quick access to Control Center
 */

import React, { useState, useEffect } from 'react'
import { Command, Activity, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface HealthStatus {
  overall: number
  status: 'healthy' | 'warning' | 'critical'
  lastCheck: Date
}

export function ControlCenterWidget() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    overall: 90,
    status: 'healthy',
    lastCheck: new Date()
  })

  // Check health every 5 minutes
  useEffect(() => {
    const checkHealth = async () => {
      try {
        // In production, this would call the actual health API
        const response = await fetch('/api/v1/control-center/health')
        if (response.headers.get('X-HERA-Health') === 'degraded') {
          setHealthStatus(prev => ({
            ...prev,
            status: 'warning'
          }))
        }
      } catch (error) {
        console.error('Health check failed:', error)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return 'border-green-500 bg-green-50 dark:bg-green-950'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950'
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsMinimized(false)}
          className={cn('rounded-full shadow-lg', getStatusColor())}
        >
          <Command className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-300">
      <Card
        className={cn(
          'shadow-xl border-2 overflow-hidden',
          getStatusColor(),
          isExpanded ? 'w-96' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-background/95">
          <div className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            <span className="font-semibold text-sm">Control Center</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Status */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">System Health</span>
            </div>
            <Badge variant="outline">{healthStatus.overall}%</Badge>
          </div>

          {isExpanded && (
            <>
              {/* Quick Actions */}
              <div className="space-y-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('/control-center', '_blank')}
                >
                  <Command className="h-4 w-4 mr-2" />
                  Open Dashboard
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Run health check
                    console.log('Running health check...')
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Run Health Check
                </Button>

                <Link href="/control-center" className="block">
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    View Full Report
                  </Button>
                </Link>
              </div>

              {/* Last Check */}
              <div className="mt-4 text-xs text-muted-foreground">
                Last check: {healthStatus.lastCheck.toLocaleTimeString()}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
