/**
 * 🔐 ENTERPRISE-GRADE AUTHENTICATION ERROR HANDLER
 *
 * Centralized system for handling 401 Unauthorized errors across the application.
 * Instead of throwing errors, redirects users to appropriate login pages with
 * proper messaging and context preservation.
 *
 * @module AuthenticationErrorHandler
 */

'use client'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthErrorContext {
  /** The API endpoint that failed */
  endpoint: string
  /** HTTP status code */
  status: number
  /** Original error message */
  message?: string
  /** Additional context */
  metadata?: Record<string, any>
}

export interface RedirectOptions {
  /** Message to display on login page */
  message?: string
  /** Severity of the message */
  severity?: 'info' | 'warning' | 'error'
  /** Return URL after successful login */
  returnUrl?: string
  /** Preserve query parameters */
  preserveParams?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SESSION_STORAGE_KEY = 'hera_auth_error_context'
const LOCAL_STORAGE_RETURN_URL = 'hera_return_url'

/**
 * Default redirect paths for different contexts
 */
const DEFAULT_LOGIN_PATHS = {
  salon: '/salon/auth',
  cashew: '/cashew/login',
  admin: '/auth/login',
  default: '/cashew/login'
} as const

/**
 * User-friendly error messages for different scenarios
 */
const ERROR_MESSAGES = {
  sessionExpired: 'Your session has expired. Please log in again to continue.',
  unauthorized: 'Authentication required. Please log in to access this page.',
  tokenInvalid: 'Your authentication token is invalid. Please log in again.',
  permissionDenied: 'You do not have permission to access this resource.'
} as const

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Store error context for display on login page
 */
function storeErrorContext(context: AuthErrorContext): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(context))
    }
  } catch (error) {
    console.warn('[AuthErrorHandler] Failed to store error context:', error)
  }
}

/**
 * Retrieve and clear error context
 */
export function getAndClearErrorContext(): AuthErrorContext | null {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        return JSON.parse(stored)
      }
    }
  } catch (error) {
    console.warn('[AuthErrorHandler] Failed to retrieve error context:', error)
  }
  return null
}

/**
 * Store return URL for post-login redirect
 */
function storeReturnUrl(url: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_RETURN_URL, url)
    }
  } catch (error) {
    console.warn('[AuthErrorHandler] Failed to store return URL:', error)
  }
}

/**
 * Get and clear return URL
 */
export function getAndClearReturnUrl(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const url = localStorage.getItem(LOCAL_STORAGE_RETURN_URL)
      if (url) {
        localStorage.removeItem(LOCAL_STORAGE_RETURN_URL)
        return url
      }
    }
  } catch (error) {
    console.warn('[AuthErrorHandler] Failed to retrieve return URL:', error)
  }
  return null
}

// ============================================================================
// PATH DETECTION
// ============================================================================

/**
 * Detect the appropriate login path based on current context
 */
function detectLoginPath(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_LOGIN_PATHS.default
  }

  const pathname = window.location.pathname

  // Salon context
  if (pathname.startsWith('/salon')) {
    return DEFAULT_LOGIN_PATHS.salon
  }

  // Admin context
  if (pathname.startsWith('/admin')) {
    return DEFAULT_LOGIN_PATHS.admin
  }

  // Default
  return DEFAULT_LOGIN_PATHS.default
}

/**
 * Get current URL for return after login
 */
function getCurrentUrl(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname + window.location.search
}

// ============================================================================
// CORE HANDLER
// ============================================================================

/**
 * Handle authentication error and redirect to login
 *
 * @param context - Error context information
 * @param options - Redirect options
 */
export function handleAuthenticationError(
  context: AuthErrorContext,
  options: RedirectOptions = {}
): void {
  // Only handle in browser
  if (typeof window === 'undefined') {
    console.error('[AuthErrorHandler] Cannot redirect on server side:', context)
    return
  }

  console.warn('[AuthErrorHandler] Authentication error detected:', {
    endpoint: context.endpoint,
    status: context.status,
    message: context.message
  })

  // Store error context for login page
  storeErrorContext(context)

  // Store return URL if requested
  const returnUrl = options.returnUrl || getCurrentUrl()
  if (returnUrl && returnUrl !== '/' && !returnUrl.includes('/auth')) {
    storeReturnUrl(returnUrl)
  }

  // Build login URL with query parameters
  const loginPath = detectLoginPath()
  const params = new URLSearchParams()

  // Add error message
  const message =
    options.message ||
    (context.status === 401
      ? ERROR_MESSAGES.sessionExpired
      : ERROR_MESSAGES.unauthorized)
  params.set('error', message)

  // Add severity
  params.set('severity', options.severity || 'warning')

  // Add return URL if specified
  if (options.returnUrl) {
    params.set('returnUrl', options.returnUrl)
  }

  // Construct full URL
  const fullUrl = `${loginPath}?${params.toString()}`

  console.log('[AuthErrorHandler] Redirecting to:', fullUrl)

  // Perform redirect
  window.location.href = fullUrl
}

// ============================================================================
// RESPONSE CHECKER
// ============================================================================

/**
 * Check if a fetch response is a 401 and handle it
 *
 * @param response - Fetch Response object
 * @param endpoint - API endpoint that was called
 * @returns true if 401 was handled, false otherwise
 */
export function checkAndHandleAuthError(response: Response, endpoint: string): boolean {
  if (response.status === 401) {
    handleAuthenticationError(
      {
        endpoint,
        status: 401,
        message: response.statusText || 'Unauthorized'
      },
      {
        message: ERROR_MESSAGES.sessionExpired,
        severity: 'warning'
      }
    )
    return true
  }

  return false
}

// ============================================================================
// FETCH WRAPPER
// ============================================================================

/**
 * Enhanced fetch wrapper that automatically handles 401 errors
 *
 * @param input - Fetch input
 * @param init - Fetch init
 * @returns Promise that never resolves if 401 (redirects instead)
 */
export async function fetchWithAuthHandling(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const endpoint = typeof input === 'string' ? input : input.toString()

  try {
    const response = await fetch(input, init)

    // Check for 401
    if (checkAndHandleAuthError(response, endpoint)) {
      // Return a never-resolving promise to prevent further processing
      // (redirect is already happening)
      return new Promise(() => {})
    }

    return response
  } catch (error) {
    // Re-throw non-auth errors
    throw error
  }
}

// ============================================================================
// CLEAR AUTH STATE UTILITY
// ============================================================================

/**
 * Clear all authentication-related state
 * Use this on logout
 */
export async function clearAuthenticationState(): Promise<void> {
  try {
    // Clear session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }

    // Clear Supabase session
    if (typeof window !== 'undefined') {
      const { supabase } = await import('@/lib/supabase/client')
      await supabase.auth.signOut()
    }

    // Clear local storage items
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('salonUserName')
      localStorage.removeItem('salonUserEmail')
      localStorage.removeItem('salonRole')
      // Note: Intentionally keep returnUrl for after re-login
    }

    console.log('[AuthErrorHandler] Authentication state cleared')
  } catch (error) {
    console.error('[AuthErrorHandler] Error clearing auth state:', error)
  }
}

// ============================================================================
// REACT HOOK (OPTIONAL)
// ============================================================================

/**
 * Hook to check for authentication errors on page load
 * Use this in auth/login pages to display error messages
 */
export function useAuthError(): {
  error: AuthErrorContext | null
  clearError: () => void
} {
  const [error, setError] = React.useState<AuthErrorContext | null>(null)

  React.useEffect(() => {
    const context = getAndClearErrorContext()
    if (context) {
      setError(context)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, clearError }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Simple usage - call this when you detect a 401:
 *
 * @example
 * if (response.status === 401) {
 *   handleAuthenticationError({
 *     endpoint: '/api/v2/entities',
 *     status: 401
 *   })
 *   // No need to throw or return - redirect happens automatically
 * }
 */

import React from 'react'
