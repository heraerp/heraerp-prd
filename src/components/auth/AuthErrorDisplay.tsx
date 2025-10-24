/**
 * 🚨 AUTH ERROR DISPLAY COMPONENT
 *
 * Displays authentication error messages on login/auth pages
 * Automatically retrieves and displays errors from URL parameters
 * and/or session storage (set by authentication-error-handler)
 *
 * @example
 * // In your auth page:
 * <AuthErrorDisplay />
 */

'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getAndClearErrorContext } from '@/lib/auth/authentication-error-handler'

// ============================================================================
// TYPES
// ============================================================================

type Severity = 'info' | 'warning' | 'error'

interface ErrorMessage {
  message: string
  severity: Severity
  endpoint?: string
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const SeverityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle
} as const

const SeverityColors = {
  info: {
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  warning: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  error: {
    border: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400'
  }
} as const

// ============================================================================
// COMPONENT
// ============================================================================

export function AuthErrorDisplay() {
  const [error, setError] = useState<ErrorMessage | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlError = params.get('error')
      const urlSeverity = params.get('severity') as Severity | null

      if (urlError) {
        setError({
          message: urlError,
          severity: urlSeverity || 'warning'
        })
        // Clean URL without reload
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        url.searchParams.delete('severity')
        window.history.replaceState({}, '', url.toString())
        return
      }
    }

    // Check session storage (from error handler)
    const context = getAndClearErrorContext()
    if (context) {
      setError({
        message: context.message || 'Authentication required',
        severity: 'warning',
        endpoint: context.endpoint
      })
    }
  }, [])

  if (!error || !isVisible) {
    return null
  }

  const Icon = SeverityIcons[error.severity]
  const colors = SeverityColors[error.severity]

  return (
    <div className="w-full max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <Alert className={`${colors.border} ${colors.bg} border-l-4`}>
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 ${colors.icon}`} />
          <div className="flex-1 space-y-1">
            <AlertTitle className={`font-semibold ${colors.text}`}>
              {error.severity === 'error'
                ? 'Authentication Error'
                : error.severity === 'warning'
                  ? 'Session Expired'
                  : 'Information'}
            </AlertTitle>
            <AlertDescription className={colors.text}>{error.message}</AlertDescription>
            {process.env.NODE_ENV === 'development' && error.endpoint && (
              <p className="text-xs opacity-70 mt-2">Endpoint: {error.endpoint}</p>
            )}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className={`${colors.text} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </Alert>
    </div>
  )
}

// ============================================================================
// ALTERNATIVE: INLINE ERROR (for forms)
// ============================================================================

export function InlineAuthError({ message, severity = 'error' }: ErrorMessage) {
  const Icon = SeverityIcons[severity]
  const colors = SeverityColors[severity]

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-md ${colors.bg} ${colors.border} border-l-4`}
    >
      <Icon className={`h-4 w-4 ${colors.icon}`} />
      <span className={`text-sm ${colors.text}`}>{message}</span>
    </div>
  )
}
