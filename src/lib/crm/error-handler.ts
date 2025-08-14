/**
 * HERA CRM Error Handler - Comprehensive Edge Case Management
 * Provides user-friendly error messages and graceful fallbacks for all CRM operations
 */

export interface CRMError {
  code: string
  message: string
  userMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'validation' | 'network' | 'authentication' | 'permission' | 'data' | 'system'
  details?: any
  timestamp: string
  context?: {
    component?: string
    action?: string
    userId?: string
    organizationId?: string
  }
}

export interface ErrorHandlerResult {
  success: boolean
  error?: CRMError
  fallbackData?: any
  retryable: boolean
  retryAfter?: number
}

/**
 * CRM Error Codes and Messages
 */
const CRM_ERROR_CODES = {
  // Authentication & Authorization
  AUTH_REQUIRED: {
    code: 'AUTH_REQUIRED',
    message: 'User authentication required',
    userMessage: 'Please sign in to access your CRM',
    severity: 'high' as const,
    category: 'authentication' as const
  },
  AUTH_EXPIRED: {
    code: 'AUTH_EXPIRED',
    message: 'Authentication token expired',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'medium' as const,
    category: 'authentication' as const
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'User lacks required permissions',
    userMessage: 'You don\'t have permission to perform this action.',
    severity: 'medium' as const,
    category: 'permission' as const
  },

  // Data Validation
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format provided',
    userMessage: 'Please enter a valid email address.',
    severity: 'low' as const,
    category: 'validation' as const
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'Required field is missing',
    userMessage: 'Please fill in all required fields.',
    severity: 'low' as const,
    category: 'validation' as const
  },
  DUPLICATE_CONTACT: {
    code: 'DUPLICATE_CONTACT',
    message: 'Contact with this email already exists',
    userMessage: 'A contact with this email already exists. Would you like to update the existing contact?',
    severity: 'medium' as const,
    category: 'validation' as const
  },
  INVALID_PHONE: {
    code: 'INVALID_PHONE',
    message: 'Invalid phone number format',
    userMessage: 'Please enter a valid phone number.',
    severity: 'low' as const,
    category: 'validation' as const
  },
  INVALID_DATE: {
    code: 'INVALID_DATE',
    message: 'Invalid date format or value',
    userMessage: 'Please enter a valid date.',
    severity: 'low' as const,
    category: 'validation' as const
  },
  INVALID_AMOUNT: {
    code: 'INVALID_AMOUNT',
    message: 'Invalid monetary amount',
    userMessage: 'Please enter a valid amount (numbers only).',
    severity: 'low' as const,
    category: 'validation' as const
  },

  // Deal Management
  DEAL_NOT_FOUND: {
    code: 'DEAL_NOT_FOUND',
    message: 'Deal record not found',
    userMessage: 'This deal no longer exists or has been removed.',
    severity: 'medium' as const,
    category: 'data' as const
  },
  DEAL_STAGE_INVALID: {
    code: 'DEAL_STAGE_INVALID',
    message: 'Invalid deal stage transition',
    userMessage: 'Cannot move deal to this stage. Please check your pipeline configuration.',
    severity: 'low' as const,
    category: 'validation' as const
  },
  DEAL_VALUE_REQUIRED: {
    code: 'DEAL_VALUE_REQUIRED',
    message: 'Deal value is required for this stage',
    userMessage: 'Please enter a deal value before moving to this stage.',
    severity: 'low' as const,
    category: 'validation' as const
  },

  // Contact Management
  CONTACT_NOT_FOUND: {
    code: 'CONTACT_NOT_FOUND',
    message: 'Contact record not found',
    userMessage: 'This contact no longer exists or has been removed.',
    severity: 'medium' as const,
    category: 'data' as const
  },
  CONTACT_HAS_ACTIVE_DEALS: {
    code: 'CONTACT_HAS_ACTIVE_DEALS',
    message: 'Cannot delete contact with active deals',
    userMessage: 'This contact has active deals. Please close or reassign deals before deleting.',
    severity: 'medium' as const,
    category: 'validation' as const
  },

  // Task Management
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    message: 'Task record not found',
    userMessage: 'This task no longer exists or has been completed.',
    severity: 'low' as const,
    category: 'data' as const
  },
  TASK_OVERDUE: {
    code: 'TASK_OVERDUE',
    message: 'Task is overdue',
    userMessage: 'This task is overdue. Please update the due date or mark as completed.',
    severity: 'medium' as const,
    category: 'validation' as const
  },

  // Pipeline Configuration
  PIPELINE_CONFIG_INVALID: {
    code: 'PIPELINE_CONFIG_INVALID',
    message: 'Invalid pipeline configuration',
    userMessage: 'Your pipeline configuration has errors. Please check your stages and try again.',
    severity: 'high' as const,
    category: 'validation' as const
  },
  PIPELINE_STAGE_IN_USE: {
    code: 'PIPELINE_STAGE_IN_USE',
    message: 'Cannot delete pipeline stage with active deals',
    userMessage: 'This stage has active deals. Please move deals to another stage before deleting.',
    severity: 'medium' as const,
    category: 'validation' as const
  },

  // Network & API Errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    userMessage: 'Connection failed. Please check your internet connection and try again.',
    severity: 'medium' as const,
    category: 'network' as const
  },
  API_TIMEOUT: {
    code: 'API_TIMEOUT',
    message: 'API request timed out',
    userMessage: 'The request is taking longer than expected. Please try again.',
    severity: 'medium' as const,
    category: 'network' as const
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    userMessage: 'Something went wrong on our end. Please try again in a few moments.',
    severity: 'high' as const,
    category: 'system' as const
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    userMessage: 'Too many requests. Please wait a moment before trying again.',
    severity: 'medium' as const,
    category: 'system' as const
  },

  // Data Import/Export
  IMPORT_FILE_INVALID: {
    code: 'IMPORT_FILE_INVALID',
    message: 'Invalid import file format',
    userMessage: 'Please upload a valid CSV or Excel file.',
    severity: 'low' as const,
    category: 'validation' as const
  },
  IMPORT_DATA_CORRUPT: {
    code: 'IMPORT_DATA_CORRUPT',
    message: 'Import data contains errors',
    userMessage: 'Some data in your file has errors. Please check the error report and fix the issues.',
    severity: 'medium' as const,
    category: 'data' as const
  },
  EXPORT_FAILED: {
    code: 'EXPORT_FAILED',
    message: 'Data export failed',
    userMessage: 'Failed to export data. Please try again or contact support.',
    severity: 'medium' as const,
    category: 'system' as const
  },

  // Organization & Settings
  ORG_NOT_FOUND: {
    code: 'ORG_NOT_FOUND',
    message: 'Organization not found',
    userMessage: 'Your organization settings are missing. Please contact support.',
    severity: 'critical' as const,
    category: 'data' as const
  },
  SETTINGS_SAVE_FAILED: {
    code: 'SETTINGS_SAVE_FAILED',
    message: 'Failed to save settings',
    userMessage: 'Unable to save your settings. Please try again.',
    severity: 'medium' as const,
    category: 'system' as const
  },

  // Generic/Fallback
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: 'Something unexpected happened. Please try again or contact support.',
    severity: 'medium' as const,
    category: 'system' as const
  }
} as const

/**
 * CRM Error Handler Class
 */
export class CRMErrorHandler {
  private static instance: CRMErrorHandler
  private errorLog: CRMError[] = []

  private constructor() {}

  static getInstance(): CRMErrorHandler {
    if (!CRMErrorHandler.instance) {
      CRMErrorHandler.instance = new CRMErrorHandler()
    }
    return CRMErrorHandler.instance
  }

  /**
   * Handle and process CRM errors with appropriate fallbacks
   */
  handleError(
    errorCode: keyof typeof CRM_ERROR_CODES | string,
    details?: any,
    context?: CRMError['context']
  ): ErrorHandlerResult {
    const errorTemplate = CRM_ERROR_CODES[errorCode as keyof typeof CRM_ERROR_CODES] || CRM_ERROR_CODES.UNKNOWN_ERROR
    
    const error: CRMError = {
      ...errorTemplate,
      details,
      context,
      timestamp: new Date().toISOString()
    }

    // Log error for debugging
    this.logError(error)

    // Determine if error is retryable
    const retryable = this.isRetryable(error)
    const retryAfter = this.getRetryDelay(error)

    // Get fallback data if available
    const fallbackData = this.getFallbackData(error)

    return {
      success: false,
      error,
      fallbackData,
      retryable,
      retryAfter
    }
  }

  /**
   * Handle network/API errors with automatic retry logic
   */
  async handleApiError(
    error: any,
    context?: CRMError['context'],
    maxRetries: number = 3
  ): Promise<ErrorHandlerResult> {
    let errorCode = 'UNKNOWN_ERROR'
    
    // Map common HTTP errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorCode = 'AUTH_REQUIRED'
          break
        case 403:
          errorCode = 'INSUFFICIENT_PERMISSIONS'
          break
        case 404:
          errorCode = this.getNotFoundErrorCode(context)
          break
        case 408:
        case 504:
          errorCode = 'API_TIMEOUT'
          break
        case 429:
          errorCode = 'RATE_LIMITED'
          break
        case 500:
        case 502:
        case 503:
          errorCode = 'SERVER_ERROR'
          break
        default:
          errorCode = 'UNKNOWN_ERROR'
      }
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      errorCode = 'NETWORK_ERROR'
    }

    return this.handleError(errorCode, error, context)
  }

  /**
   * Validate CRM data with comprehensive checks
   */
  validateCRMData(data: any, type: 'contact' | 'deal' | 'task' | 'organization'): ErrorHandlerResult {
    const errors: string[] = []

    switch (type) {
      case 'contact':
        if (!data.name || data.name.trim().length < 2) {
          return this.handleError('MISSING_REQUIRED_FIELD', { field: 'name' })
        }
        if (data.email && !this.isValidEmail(data.email)) {
          return this.handleError('INVALID_EMAIL', { email: data.email })
        }
        if (data.phone && !this.isValidPhone(data.phone)) {
          return this.handleError('INVALID_PHONE', { phone: data.phone })
        }
        break

      case 'deal':
        if (!data.name || data.name.trim().length < 2) {
          return this.handleError('MISSING_REQUIRED_FIELD', { field: 'name' })
        }
        if (data.value && (isNaN(data.value) || data.value < 0)) {
          return this.handleError('INVALID_AMOUNT', { value: data.value })
        }
        if (data.closeDate && !this.isValidDate(data.closeDate)) {
          return this.handleError('INVALID_DATE', { date: data.closeDate })
        }
        break

      case 'task':
        if (!data.title || data.title.trim().length < 2) {
          return this.handleError('MISSING_REQUIRED_FIELD', { field: 'title' })
        }
        if (data.dueDate && !this.isValidDate(data.dueDate)) {
          return this.handleError('INVALID_DATE', { date: data.dueDate })
        }
        break

      case 'organization':
        if (!data.name || data.name.trim().length < 2) {
          return this.handleError('MISSING_REQUIRED_FIELD', { field: 'name' })
        }
        break
    }

    return { success: true, retryable: false }
  }

  /**
   * Get user-friendly error message with suggested actions
   */
  getErrorMessage(error: CRMError): {
    title: string
    message: string
    action?: string
    type: 'error' | 'warning' | 'info'
  } {
    const baseMessage = {
      title: this.getErrorTitle(error),
      message: error.userMessage,
      type: this.getErrorType(error)
    }

    // Add suggested actions based on error type
    switch (error.code) {
      case 'AUTH_REQUIRED':
      case 'AUTH_EXPIRED':
        return { ...baseMessage, action: 'Sign In' }
      case 'NETWORK_ERROR':
        return { ...baseMessage, action: 'Retry' }
      case 'DUPLICATE_CONTACT':
        return { ...baseMessage, action: 'Update Existing' }
      case 'CONTACT_HAS_ACTIVE_DEALS':
        return { ...baseMessage, action: 'View Deals' }
      case 'IMPORT_DATA_CORRUPT':
        return { ...baseMessage, action: 'View Report' }
      default:
        return baseMessage
    }
  }

  /**
   * Get fallback data for graceful degradation
   */
  private getFallbackData(error: CRMError): any {
    switch (error.code) {
      case 'CONTACT_NOT_FOUND':
        return { name: 'Unknown Contact', email: '', phone: '', status: 'inactive' }
      case 'DEAL_NOT_FOUND':
        return { name: 'Unknown Deal', value: 0, stage: 'closed_lost', probability: 0 }
      case 'TASK_NOT_FOUND':
        return { title: 'Task Removed', completed: true, priority: 'low' }
      case 'ORG_NOT_FOUND':
        return { name: 'Demo Organization', type: 'business' }
      default:
        return null
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: CRMError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'API_TIMEOUT', 
      'SERVER_ERROR',
      'RATE_LIMITED'
    ]
    return retryableCodes.includes(error.code)
  }

  /**
   * Get retry delay in milliseconds
   */
  private getRetryDelay(error: CRMError): number {
    switch (error.code) {
      case 'RATE_LIMITED':
        return 5000 // 5 seconds
      case 'SERVER_ERROR':
        return 3000 // 3 seconds
      case 'API_TIMEOUT':
        return 2000 // 2 seconds
      case 'NETWORK_ERROR':
        return 1000 // 1 second
      default:
        return 0
    }
  }

  /**
   * Map context to appropriate not found error
   */
  private getNotFoundErrorCode(context?: CRMError['context']): string {
    if (!context?.component) return 'UNKNOWN_ERROR'
    
    if (context.component.includes('contact')) return 'CONTACT_NOT_FOUND'
    if (context.component.includes('deal')) return 'DEAL_NOT_FOUND'
    if (context.component.includes('task')) return 'TASK_NOT_FOUND'
    if (context.component.includes('org')) return 'ORG_NOT_FOUND'
    
    return 'UNKNOWN_ERROR'
  }

  /**
   * Get error title based on severity
   */
  private getErrorTitle(error: CRMError): string {
    switch (error.severity) {
      case 'critical':
        return 'Critical Error'
      case 'high':
        return 'Error'
      case 'medium':
        return 'Warning'
      case 'low':
        return 'Validation Error'
      default:
        return 'Notice'
    }
  }

  /**
   * Get error type for UI styling
   */
  private getErrorType(error: CRMError): 'error' | 'warning' | 'info' {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'info'
    }
  }

  /**
   * Validation helpers
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return phoneRegex.test(cleaned)
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: CRMError): void {
    // Add to in-memory log (could be sent to external service)
    this.errorLog.push(error)
    
    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('CRM Error:', error)
    }

    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number
    errorsByCategory: Record<string, number>
    errorsBySeverity: Record<string, number>
    recentErrors: CRMError[]
  } {
    const recentTime = Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    const recentErrors = this.errorLog.filter(
      error => new Date(error.timestamp).getTime() > recentTime
    )

    const errorsByCategory = recentErrors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors: recentErrors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    }
  }
}

// Export singleton instance
export const crmErrorHandler = CRMErrorHandler.getInstance()

// Export helper functions
export const handleCRMError = (errorCode: string, details?: any, context?: CRMError['context']) => 
  crmErrorHandler.handleError(errorCode, details, context)

export const validateCRMData = (data: any, type: 'contact' | 'deal' | 'task' | 'organization') =>
  crmErrorHandler.validateCRMData(data, type)

export const handleApiError = (error: any, context?: CRMError['context'], maxRetries?: number) =>
  crmErrorHandler.handleApiError(error, context, maxRetries)