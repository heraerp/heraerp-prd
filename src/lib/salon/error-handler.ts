/**
 * HERA Salon Error Handler
 * Production-ready error handling with logging and user-friendly messages
 */

import { toast } from 'sonner'

export class SalonError extends Error {
  code?: string
  details?: any

  constructor(message: string, code?: string, details?: any) {
    super(message)
    this.name = 'SalonError'
    this.code = code
    this.details = details
  }
}

interface ErrorConfig {
  showToast?: boolean
  fallbackMessage?: string
  logToConsole?: boolean
  reportToAnalytics?: boolean
}

/**
 * Production-ready error handler
 * - Shows user-friendly toast messages
 * - Logs to console in development
 * - Can report to analytics in production
 * - Returns formatted error for UI display
 */
export function handleError(
  error: unknown,
  context: string,
  config: ErrorConfig = {}
): { message: string; code?: string } {
  const {
    showToast = true,
    fallbackMessage = 'An unexpected error occurred',
    logToConsole = process.env.NODE_ENV === 'development',
    reportToAnalytics = process.env.NODE_ENV === 'production'
  } = config

  let message = fallbackMessage
  let code: string | undefined

  // Extract error details
  if (error instanceof SalonError) {
    message = error.message
    code = error.code
    if (logToConsole) {
      console.error(`[${context}] SalonError:`, {
        message: error.message,
        code: error.code,
        details: error.details
      })
    }
  } else if (error instanceof Error) {
    message = error.message
    if (logToConsole) {
      console.error(`[${context}] Error:`, error)
    }
  } else if (typeof error === 'string') {
    message = error
    if (logToConsole) {
      console.error(`[${context}] String error:`, error)
    }
  } else {
    if (logToConsole) {
      console.error(`[${context}] Unknown error:`, error)
    }
  }

  // Show user-friendly toast
  if (showToast) {
    toast.error(getUserFriendlyMessage(message, context))
  }

  // Report to analytics in production
  if (reportToAnalytics) {
    // TODO: Integrate with your analytics service
    // analytics.track('error', {
    //   context,
    //   message,
    //   code,
    //   timestamp: new Date().toISOString()
    // })
  }

  return { message, code }
}

/**
 * Convert technical error messages to user-friendly ones
 */
function getUserFriendlyMessage(technicalMessage: string, context: string): string {
  // Common error mappings
  const errorMappings: Record<string, string> = {
    'Network request failed': 'Unable to connect. Please check your internet connection.',
    'Failed to fetch': 'Unable to load data. Please try again.',
    'Unauthorized': 'Your session has expired. Please sign in again.',
    'Forbidden': 'You don\'t have permission to perform this action.',
    'Not found': 'The requested item could not be found.',
    'Conflict': 'This action conflicts with existing data.',
    'Invalid input': 'Please check your input and try again.',
    'Server error': 'Something went wrong on our end. Please try again later.'
  }

  // Context-specific messages
  const contextMessages: Record<string, Record<string, string>> = {
    'pos-sale': {
      'insufficient_stock': 'Some items are out of stock.',
      'payment_failed': 'Payment could not be processed. Please try again.',
      'customer_required': 'Please select a customer for this transaction.'
    },
    'appointment-booking': {
      'time_slot_taken': 'This time slot is no longer available.',
      'staff_unavailable': 'The selected staff member is not available.',
      'service_unavailable': 'This service is currently unavailable.'
    },
    'inventory': {
      'negative_stock': 'Stock cannot go below zero.',
      'duplicate_sku': 'This SKU already exists.',
      'invalid_cost': 'Please enter a valid cost amount.'
    },
    'payroll': {
      'processing_failed': 'Payroll processing failed. Please review and try again.',
      'insufficient_funds': 'Insufficient funds for payroll.',
      'missing_bank_info': 'Some employees are missing bank information.'
    }
  }

  // Check for context-specific message
  const contextMap = contextMessages[context]
  if (contextMap) {
    for (const [key, friendlyMessage] of Object.entries(contextMap)) {
      if (technicalMessage.toLowerCase().includes(key)) {
        return friendlyMessage
      }
    }
  }

  // Check for general message mappings
  for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
    if (technicalMessage.toLowerCase().includes(key.toLowerCase())) {
      return friendlyMessage
    }
  }

  // Default to technical message if no mapping found
  return technicalMessage
}

/**
 * Async wrapper for error handling
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context: string,
  config?: ErrorConfig
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, context, config)
    return null
  }
}

/**
 * Format API errors consistently
 */
export function formatApiError(response: any): SalonError {
  if (response?.error) {
    return new SalonError(
      response.error.message || 'API request failed',
      response.error.code,
      response.error.details
    )
  }
  return new SalonError('Unknown API error occurred')
}