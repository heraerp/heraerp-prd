'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CRMError, crmErrorHandler } from '@/lib/crm/error-handler'
import { ErrorToast } from './error-display'

interface ErrorContextType {
  errors: CRMError[]
  showError: (error: CRMError) => void
  dismissError: (errorId: string) => void
  clearAllErrors: () => void
  hasErrors: boolean
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function useErrorContext() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider')
  }
  return context
}

interface ErrorProviderProps {
  children: React.ReactNode
  maxErrors?: number
  defaultDuration?: number
}

export function CRMErrorProvider({
  children,
  maxErrors = 5,
  defaultDuration = 5000
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<(CRMError & { id: string })[]>([])

  /**
   * Show a new error
   */
  const showError = useCallback(
    (error: CRMError) => {
      const errorWithId = {
        ...error,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      setErrors(prev => {
        const newErrors = [...prev, errorWithId]
        // Keep only the latest maxErrors
        return newErrors.slice(-maxErrors)
      })
    },
    [maxErrors]
  )

  /**
   * Dismiss a specific error
   */
  const dismissError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId))
  }, [])

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  /**
   * Auto-dismiss critical errors after longer duration
   */
  useEffect(() => {
    errors.forEach(error => {
      if (error.severity === 'critical') {
        const timer = setTimeout(() => {
          dismissError(error.id)
        }, defaultDuration * 2) // Critical errors stay longer

        return () => clearTimeout(timer)
      }
    })
  }, [errors, dismissError, defaultDuration])

  const contextValue: ErrorContextType = {
    errors: errors,
    showError,
    dismissError,
    clearAllErrors,
    hasErrors: errors.length > 0
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}

      {/* Error Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {errors.map(error => (
            <ErrorToast
              key={error.id}
              error={error}
              onClose={() => dismissError(error.id)}
              duration={
                error.severity === 'critical'
                  ? defaultDuration * 2
                  : error.severity === 'high'
                    ? defaultDuration * 1.5
                    : error.severity === 'medium'
                      ? defaultDuration
                      : defaultDuration * 0.8
              }
            />
          ))}
        </AnimatePresence>
      </div>
    </ErrorContext.Provider>
  )
}

/**
 * Global error handler hook that integrates with the error context
 */
export function useGlobalErrorHandler() {
  const { showError } = useErrorContext()

  /**
   * Handle errors and show them globally
   */
  const handleError = useCallback(
    (errorCode: string, details?: any, context?: CRMError['context']) => {
      const result = crmErrorHandler.handleError(errorCode, details, context)
      if (result.error) {
        showError(result.error)
      }
      return result
    },
    [showError]
  )

  /**
   * Handle API errors globally
   */
  const handleApiError = useCallback(
    async (error: any, context?: CRMError['context']) => {
      const result = await crmErrorHandler.handleApiError(error, context)
      if (result.error) {
        showError(result.error)
      }
      return result
    },
    [showError]
  )

  return {
    handleError,
    handleApiError
  }
}

/**
 * Error boundary that integrates with the error context
 */
export class GlobalCRMErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Create CRM error from JavaScript error
    const crmError = crmErrorHandler.handleError(
      'UNKNOWN_ERROR',
      {
        originalError: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      },
      { component: 'GlobalErrorBoundary' }
    )

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global CRM Error Boundary:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-foreground px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
