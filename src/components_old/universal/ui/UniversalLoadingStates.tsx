'use client'

import React, { ReactNode } from 'react'

/**
 * Universal Loading States & Error Boundaries
 *
 * Based on lessons learned from auth loading issues:
 * - Different loading states for different contexts
 * - Graceful error handling with recovery options
 * - Consistent styling and behavior
 * - Proper accessibility
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red'
  className?: string
}

interface FullPageLoadingProps {
  title?: string
  subtitle?: string
  timeout?: number
  onTimeout?: () => void
}

interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md'
}

interface SkeletonProps {
  rows?: number
  className?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface ErrorDisplayProps {
  title?: string
  message: string
  details?: string
  onRetry?: () => void
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
}

// Loading Spinner Component
export function UniversalSpinner({
  size = 'md',
  color = 'blue',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    blue: 'border-blue-200 border-t-blue-600',
    gray: 'border-border border-t-gray-600',
    white: 'border-border/20 border-t-white',
    green: 'border-green-200 border-t-green-600',
    red: 'border-red-200 border-t-red-600'
  }

  return (
    <div
      className={`${sizeClasses[size]} border-4 ${colorClasses[color]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Full Page Loading Component
export function UniversalFullPageLoading({
  title = 'Loading...',
  subtitle,
  timeout,
  onTimeout
}: FullPageLoadingProps) {
  const [showTimeout, setShowTimeout] = React.useState(false)

  React.useEffect(() => {
    if (timeout && onTimeout) {
      const timer = setTimeout(() => {
        setShowTimeout(true)
        onTimeout()
      }, timeout)

      return () => clearTimeout(timer)
    }
  }, [timeout, onTimeout])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <UniversalSpinner size="xl" />
        </div>

        <h2 className="text-xl font-semibold text-gray-100 mb-2">{title}</h2>

        {subtitle && <p className="text-muted-foreground mb-6">{subtitle}</p>}

        {showTimeout && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <p className="text-amber-800 text-sm">
              This is taking longer than expected. Please check your connection or try refreshing
              the page.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">If this persists, please contact support</p>
      </div>
    </div>
  )
}

// Inline Loading Component
export function UniversalInlineLoading({ text = 'Loading...', size = 'md' }: InlineLoadingProps) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className="flex items-center justify-center py-4">
      <UniversalSpinner size={size} className="mr-3" />
      <span className={`text-muted-foreground ${textSize}`}>{text}</span>
    </div>
  )
}

// Skeleton Loading Component
export function UniversalSkeleton({ rows = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

// Card Skeleton for lists
export function UniversalCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-background border border-border rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-3/4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-8 bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Error Boundary Class Component
class UniversalErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps & { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps & { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('UniversalErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <UniversalErrorDisplay
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
          details={this.state.error?.stack}
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

// Error Boundary Wrapper
export function UniversalErrorBoundary(props: ErrorBoundaryProps) {
  return <UniversalErrorBoundaryClass {...props} />
}

// Error Display Component
export function UniversalErrorDisplay({
  title = 'Error',
  message,
  details,
  onRetry,
  onDismiss,
  type = 'error'
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700 text-foreground'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      button: 'bg-amber-600 hover:bg-amber-700 text-foreground'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-foreground'
    }
  }

  const styles = typeStyles[type]

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-6 max-w-2xl mx-auto`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {type === 'error' && (
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {type === 'warning' && (
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          )}
          {type === 'info' && (
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        <div className="ml-3 flex-1">
          <h3 className={`text-lg font-medium ${styles.text} mb-2`}>{title}</h3>
          <p className={`${styles.text} mb-4`}>{message}</p>

          {details && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-sm ${styles.text} underline hover:no-underline`}
              >
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>

              {showDetails && (
                <pre
                  className={`mt-2 p-3 bg-background border rounded text-xs ${styles.text} overflow-auto max-h-40`}
                >
                  {details}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles.button}`}
              >
                Try Again
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 border border-border text-gray-700 bg-background rounded-lg hover:bg-muted font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading State Hook
export function useLoadingState() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const withLoading = async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await asyncFn()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Loading state error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    isLoading,
    error,
    withLoading,
    clearError
  }
}

// Network Status Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline: !isOnline }
}
