import { toast } from 'sonner'
import { X, AlertCircle, WifiOff } from 'lucide-react'

export interface PlaybookError {
  message: string
  code?: string
  context?: string
  retryable?: boolean
}

/**
 * Display a consolidated error toast for Playbook API errors
 */
export function showPlaybookError(error: PlaybookError | string | Error) {
  const errorData = normalizeError(error)

  toast.error(
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {getErrorIcon(errorData)}
        <span className="font-medium">{getErrorTitle(errorData)}</span>
      </div>
      <p className="text-sm opacity-90">{errorData.message}</p>
      {errorData.context && <p className="text-xs opacity-70 mt-1">{errorData.context}</p>}
      {errorData.retryable && (
        <p className="text-xs opacity-70 mt-1">Please try again in a moment.</p>
      )}
    </div>,
    {
      duration: 5000,
      className: 'playbook-error-toast'
    }
  )
}

/**
 * Normalize various error formats into PlaybookError
 */
function normalizeError(error: PlaybookError | string | Error): PlaybookError {
  if (typeof error === 'string') {
    return { message: error }
  }

  if (error instanceof Error) {
    const message = error.message

    // Check for specific error patterns
    if (message.includes('timeout')) {
      return {
        message: 'Request timed out',
        code: 'TIMEOUT',
        context: 'The server is taking too long to respond',
        retryable: true
      }
    }

    if (message.includes('fetch failed') || message.includes('network')) {
      return {
        message: 'Network connection error',
        code: 'NETWORK',
        context: 'Please check your internet connection',
        retryable: true
      }
    }

    if (message.includes('HTTP 5')) {
      return {
        message: 'Server error',
        code: 'SERVER',
        context: 'The server encountered an error',
        retryable: true
      }
    }

    if (message.includes('missing') || message.includes('required')) {
      return {
        message: 'Missing required information',
        code: 'VALIDATION',
        context: message,
        retryable: false
      }
    }

    return { message }
  }

  return error
}

/**
 * Get appropriate icon for error type
 */
function getErrorIcon(error: PlaybookError) {
  switch (error.code) {
    case 'NETWORK':
      return <WifiOff className="h-4 w-4" />
    case 'TIMEOUT':
    case 'SERVER':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <X className="h-4 w-4" />
  }
}

/**
 * Get appropriate title for error type
 */
function getErrorTitle(error: PlaybookError): string {
  switch (error.code) {
    case 'NETWORK':
      return 'Connection Error'
    case 'TIMEOUT':
      return 'Request Timeout'
    case 'SERVER':
      return 'Server Error'
    case 'VALIDATION':
      return 'Invalid Data'
    default:
      return 'Error'
  }
}

/**
 * Success toast helper
 */
export function showPlaybookSuccess(message: string) {
  toast.success(message)
}
