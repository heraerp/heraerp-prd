'use client'

import React from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  Server,
  ShieldAlert,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  Info
} from 'lucide-react'

// Smart Code: HERA.UI.ERROR.STATES.ENHANCED.v1
// Comprehensive error handling for restaurant platform

interface ErrorBoundaryProps {
  title?: string
  description?: string
  onRetry?: () => void
  showRetry?: boolean
  children?: React.ReactNode
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  title = 'Something went wrong',
  description = "We're sorry, but something unexpected happened.",
  onRetry,
  showRetry = true,
  children
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-100">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {children}
          {showRetry && (
            <Button onClick={onRetry} className="w-full bg-red-600 hover:bg-red-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface ApiErrorProps {
  error: Error | string
  endpoint?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export const ApiError: React.FC<ApiErrorProps> = ({ error, endpoint, onRetry, onDismiss }) => {
  const errorMessage = typeof error === 'string' ? error : error.message

  const getErrorType = (message: string) => {
    if (message.includes('network') || message.includes('fetch')) {
      return { type: 'network', icon: Wifi, color: 'orange' }
    }
    if (message.includes('timeout')) {
      return { type: 'timeout', icon: Clock, color: 'yellow' }
    }
    if (message.includes('server') || message.includes('500')) {
      return { type: 'server', icon: Server, color: 'red' }
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return { type: 'auth', icon: ShieldAlert, color: 'purple' }
    }
    return { type: 'general', icon: AlertCircle, color: 'red' }
  }

  const errorInfo = getErrorType(errorMessage)
  const IconComponent = errorInfo.icon

  const getColorClasses = (color: string) => {
    const colorMap = {
      red: 'border-red-200 bg-red-50 text-red-800',
      orange: 'border-orange-200 bg-orange-50 text-orange-800',
      yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      purple: 'border-purple-200 bg-purple-50 text-purple-800'
    }
    return colorMap[color] || colorMap.red
  }

  const getActionText = (type: string) => {
    switch (type) {
      case 'network':
        return 'Check your connection and try again'
      case 'timeout':
        return 'The request took too long. Please try again'
      case 'server':
        return 'Our servers are experiencing issues. Please try again later'
      case 'auth':
        return 'You may need to log in again'
      default:
        return 'Please try again or contact support if the issue persists'
    }
  }

  return (
    <Alert className={getColorClasses(errorInfo.color)}>
      <IconComponent className="h-4 w-4" />
      <AlertTitle>Error occurred</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{errorMessage}</p>
        {endpoint && <p className="text-xs opacity-75">Endpoint: {endpoint}</p>}
        <p className="text-sm">{getActionText(errorInfo.type)}</p>
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface MenuErrorProps {
  onRetry?: () => void
  showFallback?: boolean
}

export const MenuError: React.FC<MenuErrorProps> = ({ onRetry, showFallback = true }) => {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          Unable to load menu
        </CardTitle>
        <CardDescription className="text-red-600">
          We couldn't fetch the latest menu items. This might be due to a connection issue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRetry} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="h-3 w-3 mr-1" />
            Reload Menu
          </Button>
          {showFallback && (
            <Button size="sm" variant="outline">
              View Cached Menu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface OrderErrorProps {
  orderId?: string
  onRetry?: () => void
  onCancel?: () => void
}

export const OrderError: React.FC<OrderErrorProps> = ({ orderId, onRetry, onCancel }) => {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          Order Failed
        </CardTitle>
        <CardDescription className="text-red-600">
          {orderId
            ? `Order ${orderId} could not be processed.`
            : 'Your order could not be processed at this time.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-red-600">This could be due to:</p>
          <ul className="text-sm text-red-600 space-y-1 ml-4">
            <li>• Network connectivity issues</li>
            <li>• Menu items no longer available</li>
            <li>• Payment processing error</li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={onRetry} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  isOffline?: boolean
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, isOffline = false }) => {
  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800">
      <Wifi className="h-4 w-4" />
      <AlertTitle>{isOffline ? "You're offline" : 'Connection issues'}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          {isOffline
            ? 'Some features may not be available while offline.'
            : "We're having trouble connecting to our servers."}
        </p>
        <div className="flex gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface ValidationErrorProps {
  errors: Record<string, string>
  onDismiss?: () => void
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ errors, onDismiss }) => {
  const errorCount = Object.keys(errors).length

  if (errorCount === 0) return null

  return (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        Please correct {errorCount} error{errorCount > 1 ? 's' : ''}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <ul className="space-y-1">
          {Object.entries(errors).map(([field, error]) => (
            <li key={field} className="text-sm">
              • <span className="font-medium capitalize">{field}</span>: {error}
            </li>
          ))}
        </ul>
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface SuccessMessageProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
  autoHide?: boolean
  hideAfter?: number
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title = 'Success!',
  message,
  action,
  onDismiss,
  autoHide = false,
  hideAfter = 5000
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, hideAfter)
      return () => clearTimeout(timer)
    }
  }, [autoHide, hideAfter, onDismiss])

  return (
    <Alert className="border-green-200 bg-green-50 text-green-800">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        <div className="flex gap-2">
          {action && (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface InfoMessageProps {
  title?: string
  message: string
  onDismiss?: () => void
}

export const InfoMessage: React.FC<InfoMessageProps> = ({
  title = 'Information',
  message,
  onDismiss
}) => {
  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-800">
      <Info className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto mb-4 p-3 rounded-full bg-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
