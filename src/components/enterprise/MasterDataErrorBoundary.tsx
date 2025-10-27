'use client'

/**
 * Master Data Error Boundary
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.ERROR_BOUNDARY.v1
 * 
 * Error boundary component to catch and handle errors in master data forms
 */

import React from 'react'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface MasterDataErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class MasterDataErrorBoundary extends React.Component<
  MasterDataErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: MasterDataErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MasterData Error Boundary caught an error:', error, errorInfo)
    
    // Log specific error patterns
    if (error.message.includes("reading 'length'")) {
      console.error('🔍 Array length access error - likely race condition in template loading')
      console.error('Stack trace:', error.stack)
    }
    
    if (error.message.includes('tabOrder') || error.message.includes('tabs')) {
      console.error('🔍 Tab configuration error - template may be malformed')
    }
    
    this.setState({ errorInfo })
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <div className="sap-font min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong with the form
            </h2>
            <p className="text-gray-600 mb-6">
              {this.state.error.message.includes("reading 'length'")
                ? "There was an issue loading the form template. This usually happens when the template is still loading."
                : this.state.error.message}
            </p>
            
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show technical details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <p className="mt-2"><strong>Stack:</strong><br />{this.state.error.stack}</p>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
              
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useMasterDataErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('Master Data Error:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      // Log error details
      if (error.message.includes("reading 'length'")) {
        console.error('🔍 Detected array length access error - likely template loading race condition')
      }
    }
  }, [error])

  return { error, resetError, handleError }
}