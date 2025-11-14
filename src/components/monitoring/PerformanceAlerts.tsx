'use client'

/**
 * HERA Performance Alerts Component
 * Real-time performance alerts and notifications
 * Smart Code: HERA.MONITORING.PERFORMANCE.ALERTS.v1
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock,
  X,
  Bell,
  BellOff,
  Filter,
  Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PerformanceAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  metric: string
  threshold: number
  currentValue: number
  message: string
  timestamp: number
  resolved: boolean
}

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[]
  onDismissAlert: (id: string) => void
}

export function PerformanceAlerts({ alerts, onDismissAlert }: PerformanceAlertsProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [showResolved, setShowResolved] = useState(false)

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (!showResolved && alert.resolved) return false
    if (filter !== 'all' && alert.type !== filter) return false
    return true
  })

  // Alert statistics
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical' && !a.resolved).length,
    warning: alerts.filter(a => a.type === 'warning' && !a.resolved).length,
    info: alerts.filter(a => a.type === 'info' && !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length
  }

  // Get alert icon and color
  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical':
        return { Icon: AlertTriangle, color: 'text-red-500' }
      case 'warning':
        return { Icon: AlertCircle, color: 'text-yellow-500' }
      case 'info':
        return { Icon: Info, color: 'text-blue-500' }
    }
  }

  // Get alert badge variant
  const getAlertBadge = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'info':
        return 'outline'
    }
  }

  // Export alerts
  const exportAlerts = () => {
    const data = alerts.map(alert => ({
      ...alert,
      timestamp: new Date(alert.timestamp).toISOString(),
      timeAgo: formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-alerts-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  // Resolve all alerts of a type
  const resolveAllOfType = (type: PerformanceAlert['type']) => {
    alerts
      .filter(alert => alert.type === type && !alert.resolved)
      .forEach(alert => onDismissAlert(alert.id))
  }

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Alerts</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.warning}</div>
            <div className="text-sm text-muted-foreground">Warning</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.info}</div>
            <div className="text-sm text-muted-foreground">Info</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Performance Alerts
              </CardTitle>
              <CardDescription>
                Real-time performance monitoring alerts and notifications
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResolved(!showResolved)}
                className="gap-2"
              >
                {showResolved ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {showResolved ? 'Hide Resolved' : 'Show Resolved'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportAlerts}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              All ({filteredAlerts.length})
            </Button>

            <Button
              variant={filter === 'critical' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
              className="gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Critical ({stats.critical})
            </Button>

            <Button
              variant={filter === 'warning' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilter('warning')}
              className="gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Warning ({stats.warning})
            </Button>

            <Button
              variant={filter === 'info' ? 'outline' : 'outline'}
              size="sm"
              onClick={() => setFilter('info')}
              className="gap-2"
            >
              <Info className="w-4 h-4" />
              Info ({stats.info})
            </Button>
          </div>

          {/* Bulk Actions */}
          {filteredAlerts.some(alert => !alert.resolved) && (
            <div className="flex flex-wrap gap-2 mb-6 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Bulk Actions:</span>
              
              {stats.critical > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveAllOfType('critical')}
                  className="text-red-600 hover:text-red-700"
                >
                  Resolve All Critical
                </Button>
              )}

              {stats.warning > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveAllOfType('warning')}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  Resolve All Warnings
                </Button>
              )}

              {stats.info > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveAllOfType('info')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Resolve All Info
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'All systems are performing within acceptable thresholds.'
                  : `No ${filter} alerts at this time.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const { Icon, color } = getAlertIcon(alert.type)
            const badgeVariant = getAlertBadge(alert.type)

            return (
              <Card 
                key={alert.id} 
                className={`${alert.resolved ? 'opacity-60' : ''} ${
                  alert.type === 'critical' ? 'border-red-200 bg-red-50/50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50/50' :
                  'border-blue-200 bg-blue-50/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Alert Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {alert.resolved ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Icon className={`w-5 h-5 ${color}`} />
                      )}
                    </div>

                    {/* Alert Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={badgeVariant as any}>
                              {alert.type.toUpperCase()}
                            </Badge>
                            
                            {alert.resolved && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                RESOLVED
                              </Badge>
                            )}
                            
                            <span className="text-sm font-medium">{alert.metric}</span>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                            </div>
                            
                            <div>
                              Current: <span className="font-medium">
                                {typeof alert.currentValue === 'number' 
                                  ? alert.currentValue.toLocaleString()
                                  : alert.currentValue
                                }
                              </span>
                            </div>
                            
                            <div>
                              Threshold: <span className="font-medium">
                                {typeof alert.threshold === 'number' 
                                  ? alert.threshold.toLocaleString()
                                  : alert.threshold
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        {!alert.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismissAlert(alert.id)}
                            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Performance Recommendations */}
      {stats.critical > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Immediate Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Critical Performance Issues Detected</h4>
              <ul className="space-y-1 text-sm text-red-700">
                <li>• Review and optimize slow-loading components immediately</li>
                <li>• Check for memory leaks in event listeners and subscriptions</li>
                <li>• Consider implementing performance budgets to prevent future issues</li>
                <li>• Monitor API response times and optimize database queries</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Recommendations */}
      {stats.warning > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              Performance Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Recommended Optimizations</h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>• Implement code splitting and lazy loading for better initial load times</li>
                <li>• Optimize images and assets with compression and modern formats</li>
                <li>• Consider implementing virtual scrolling for large data lists</li>
                <li>• Review and optimize React component re-renders</li>
                <li>• Enable service worker caching for static assets</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}