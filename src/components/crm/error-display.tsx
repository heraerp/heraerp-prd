'use client'

import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Wifi,
  Database,
  User,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CRMError, crmErrorHandler } from '@/lib/crm/error-handler'

interface ErrorDisplayProps {
  error: CRMError
  onRetry?: () => void
  onDismiss?: () => void
  onAction?: () => void
  showDetails?: boolean
  className?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: CRMError; onRetry: () => void }>
  context?: {
    component: string
    action?: string
  }
}

interface ErrorToastProps {
  error: CRMError
  onClose: () => void
  duration?: number
}

/**
 * Main Error Display Component
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  onAction,
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const errorMessage = crmErrorHandler.getErrorMessage(error)

  const getIcon = () => {
    switch (error.category) {
      case 'authentication':
        return <Shield className="h-5 w-5" />
      case 'network':
        return <Wifi className="h-5 w-5" />
      case 'data':
        return <Database className="h-5 w-5" />
      case 'permission':
        return <User className="h-5 w-5" />
      case 'system':
        return <Settings className="h-5 w-5" />
      default:
        return error.severity === 'high' || error.severity === 'critical' ? (
          <AlertCircle className="h-5 w-5" />
        ) : error.severity === 'medium' ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Info className="h-5 w-5" />
        )
    }
  }

  const getVariant = () => {
    switch (errorMessage.type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={className}
    >
      <Alert variant={getVariant()} className="relative">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 ${ errorMessage.type ==='error'
                ? 'text-red-600'
                : errorMessage.type === 'warning'
                  ? 'text-yellow-600'
                  : 'text-primary'
            }`}
          >
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <AlertTitle className="flex items-center gap-2 mb-1">
              {errorMessage.title}
              <Badge variant="outline" className="text-xs">
                {error.code}
              </Badge>
            </AlertTitle>

            <AlertDescription className="text-sm">{errorMessage.message}</AlertDescription>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} className="h-8">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}

              {onAction && errorMessage.action && (
                <Button size="sm" onClick={onAction} className="h-8">
                  {errorMessage.action}
                </Button>
              )}

              {showDetails && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Details
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Expandable Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-border"
                >
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div>
                      <strong>Error Code:</strong> {error.code}
                    </div>
                    <div>
                      <strong>Category:</strong> {error.category}
                    </div>
                    <div>
                      <strong>Severity:</strong> {error.severity}
                    </div>
                    <div>
                      <strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}
                    </div>
                    {error.context && (
                      <div>
                        <strong>Context:</strong> {JSON.stringify(error.context, null, 2)}
                      </div>
                    )}
                    {error.details && (
                      <div>
                        <strong>Details:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dismiss Button */}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Alert>
    </motion.div>
  )
}

/**
 * Error Toast Notification
 */
export function ErrorToast({ error, onClose, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-4 right-4 z-50 w-96"
    >
      <ErrorDisplay
        error={error}
        onDismiss={onClose}
        className="shadow-lg border-l-4 border-l-red-500"
      />
    </motion.div>
  )
}

/**
 * Error Page Component for Critical Errors
 */
export function ErrorPage({ error, onRetry }: { error: CRMError; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorDisplay error={error} onRetry={onRetry} showDetails={true} />

          <div className="text-center text-sm text-muted-foreground">
            If this problem persists, please{' '}
            <a href="mailto:support@heraerp.com" className="text-primary hover:underline">
              contact support
            </a>{' '}
            or{' '}
            <a href="/docs" className="text-primary hover:underline inline-flex items-center">
              view documentation
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error Boundary Component
 */
export class CRMErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: CRMError | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    // Convert JavaScript error to CRM error
    const crmError = crmErrorHandler.handleError(
      'UNKNOWN_ERROR',
      { originalError: error.message, stack: error.stack },
      { component: 'ErrorBoundary' }
    )

    return {
      hasError: true,
      error: crmError.error || null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('CRM Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorPage

      return (
        <FallbackComponent
          error={this.state.error}
          onRetry={() => {
            this.setState({ hasError: false, error: null })
            window.location.reload()
          }}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Error Statistics Dashboard (for monitoring)
 */
export function ErrorStatsDashboard() {
  const [stats, setStats] = useState(crmErrorHandler.getErrorStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(crmErrorHandler.getErrorStats())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Error Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalErrors}</div>
            <div className="text-sm text-muted-foreground">Total Errors (24h)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.recentErrors.length}</div>
            <div className="text-sm text-muted-foreground">Recent Errors</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">By Category</h4>
          {Object.entries(stats.errorsByCategory).map(([category, count]) => (
            <div key={category} className="flex justify-between text-sm">
              <span className="capitalize">{category}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">By Severity</h4>
          {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
            <div key={severity} className="flex justify-between text-sm">
              <span className="capitalize">{severity}</span>
              <Badge
                variant={
                  severity === 'critical' || severity === 'high'
                    ? 'destructive'
                    : severity === 'medium'
                      ? 'default'
                      : 'secondary'
                }
              >
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
