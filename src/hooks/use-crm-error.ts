'use client'

import { useState, useCallback, useEffect } from 'react'
import { CRMError, crmErrorHandler, ErrorHandlerResult } from '@/src/lib/crm/error-handler'

interface UseCRMErrorOptions {
  showToast?: boolean
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  onError?: (error: CRMError) => void
  onRetry?: () => void
  onSuccess?: () => void
}

interface CRMErrorState {
  error: CRMError | null
  isLoading: boolean
  retryCount: number
  canRetry: boolean
}

/**
 * Custom hook for handling CRM errors with automatic retry and toast notifications
 */
export function useCRMError(options: UseCRMErrorOptions = {}) {
  const {
    showToast = true,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess
  } = options

  const [errorState, setErrorState] = useState<CRMErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    canRetry: false
  })

  const [toastError, setToastError] = useState<CRMError | null>(null)

  /**
   * Handle a new error
   */
  const handleError = useCallback(
    async (errorCode: string, details?: any, context?: CRMError['context']) => {
      const result = crmErrorHandler.handleError(errorCode, details, context)

      if (result.error) {
        setErrorState(prev => ({
          ...prev,
          error: result.error!,
          canRetry: result.retryable && prev.retryCount < maxRetries
        }))

        // Show toast notification
        if (showToast) {
          setToastError(result.error)
        }

        // Call error callback
        onError?.(result.error)

        // Auto retry if enabled and retryable
        if (autoRetry && result.retryable && errorState.retryCount < maxRetries) {
          setTimeout(() => {
            retry()
          }, result.retryAfter || retryDelay)
        }
      }

      return result
    },
    [errorState.retryCount, maxRetries, showToast, autoRetry, retryDelay, onError]
  )

  /**
   * Handle API errors
   */
  const handleApiError = useCallback(
    async (error: any, context?: CRMError['context']) => {
      setErrorState(prev => ({ ...prev, isLoading: false }))

      const result = await crmErrorHandler.handleApiError(error, context, maxRetries)

      if (result.error) {
        setErrorState(prev => ({
          ...prev,
          error: result.error!,
          canRetry: result.retryable && prev.retryCount < maxRetries
        }))

        if (showToast) {
          setToastError(result.error)
        }

        onError?.(result.error)

        if (autoRetry && result.retryable && errorState.retryCount < maxRetries) {
          setTimeout(() => {
            retry()
          }, result.retryAfter || retryDelay)
        }
      }

      return result
    },
    [errorState.retryCount, maxRetries, showToast, autoRetry, retryDelay, onError]
  )

  /**
   * Validate CRM data
   */
  const validateData = useCallback(
    (data: any, type: 'contact' | 'deal' | 'task' | 'organization'): ErrorHandlerResult => {
      const result = crmErrorHandler.validateCRMData(data, type)

      if (!result.success && result.error) {
        setErrorState(prev => ({
          ...prev,
          error: result.error!,
          canRetry: false
        }))

        if (showToast) {
          setToastError(result.error)
        }

        onError?.(result.error)
      }

      return result
    },
    [showToast, onError]
  )

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(() => {
    if (!errorState.canRetry) return

    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isLoading: true,
      error: null
    }))

    onRetry?.()
  }, [errorState.canRetry, onRetry])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      retryCount: 0,
      canRetry: false
    })
    setToastError(null)
  }, [])

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  /**
   * Handle success (clear errors and call callback)
   */
  const handleSuccess = useCallback(() => {
    clearError()
    onSuccess?.()
  }, [clearError, onSuccess])

  /**
   * Execute an operation with error handling
   */
  const executeWithErrorHandling = useCallback(
    async <T>(operation: () => Promise<T>, context?: CRMError['context']): Promise<T | null> => {
      setLoading(true)
      clearError()

      try {
        const result = await operation()
        handleSuccess()
        return result
      } catch (error) {
        await handleApiError(error, context)
        return null
      }
    },
    [setLoading, clearError, handleSuccess, handleApiError]
  )

  /**
   * Dismiss toast notification
   */
  const dismissToast = useCallback(() => {
    setToastError(null)
  }, [])

  return {
    // State
    error: errorState.error,
    isLoading: errorState.isLoading,
    retryCount: errorState.retryCount,
    canRetry: errorState.canRetry,
    toastError,

    // Actions
    handleError,
    handleApiError,
    validateData,
    retry,
    clearError,
    setLoading,
    handleSuccess,
    executeWithErrorHandling,
    dismissToast,

    // Utilities
    hasError: !!errorState.error,
    errorMessage: errorState.error ? crmErrorHandler.getErrorMessage(errorState.error) : null
  }
}

/**
 * Hook for form validation with CRM error handling
 */
export function useCRMFormValidation(formType: 'contact' | 'deal' | 'task' | 'organization') {
  const { validateData, error, hasError, errorMessage, clearError } = useCRMError({
    showToast: false // Don't show toast for form validation
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  /**
   * Validate individual field
   */
  const validateField = useCallback(
    (fieldName: string, value: any, required: boolean = false): boolean => {
      // Clear existing error
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })

      // Required field validation
      if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: 'This field is required'
        }))
        return false
      }

      // Field-specific validations
      switch (fieldName) {
        case 'email':
          if (value && !crmErrorHandler['isValidEmail'](value)) {
            setFieldErrors(prev => ({
              ...prev,
              [fieldName]: 'Please enter a valid email address'
            }))
            return false
          }
          break

        case 'phone':
          if (value && !crmErrorHandler['isValidPhone'](value)) {
            setFieldErrors(prev => ({
              ...prev,
              [fieldName]: 'Please enter a valid phone number'
            }))
            return false
          }
          break

        case 'value':
        case 'amount':
          if (value && (isNaN(value) || parseFloat(value) < 0)) {
            setFieldErrors(prev => ({
              ...prev,
              [fieldName]: 'Please enter a valid amount'
            }))
            return false
          }
          break

        case 'dueDate':
        case 'closeDate':
          if (value && new Date(value) < new Date()) {
            setFieldErrors(prev => ({
              ...prev,
              [fieldName]: 'Date cannot be in the past'
            }))
            return false
          }
          break
      }

      return true
    },
    []
  )

  /**
   * Validate entire form
   */
  const validateForm = useCallback(
    (formData: any): boolean => {
      const result = validateData(formData, formType)

      if (!result.success && result.error) {
        // Extract field-specific errors from validation result
        if (result.error.details?.field) {
          setFieldErrors({
            [result.error.details.field]: result.error.userMessage
          })
        }
      }

      return result.success
    },
    [validateData, formType]
  )

  /**
   * Clear field error
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setFieldErrors({})
    clearError()
  }, [clearError])

  return {
    // Validation functions
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,

    // Error state
    fieldErrors,
    hasFieldErrors: Object.keys(fieldErrors).length > 0,
    formError: error,
    hasFormError: hasError,
    formErrorMessage: errorMessage,

    // Utilities
    getFieldError: (fieldName: string) => fieldErrors[fieldName],
    hasFieldError: (fieldName: string) => !!fieldErrors[fieldName]
  }
}

/**
 * Hook for async operations with error handling and loading states
 */
export function useCRMAsyncOperation<T = any>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) {
  const { executeWithErrorHandling, isLoading, error, hasError, retry, clearError } = useCRMError({
    autoRetry: false
  })

  const [data, setData] = useState<T | null>(null)

  /**
   * Execute the operation
   */
  const execute = useCallback(
    async (context?: CRMError['context']) => {
      const result = await executeWithErrorHandling(operation, context)
      if (result !== null) {
        setData(result)
      }
      return result
    },
    [executeWithErrorHandling, operation]
  )

  /**
   * Retry with context
   */
  const retryOperation = useCallback(
    async (context?: CRMError['context']) => {
      retry()
      return execute(context)
    },
    [retry, execute]
  )

  return {
    // Data
    data,

    // State
    isLoading,
    error,
    hasError,

    // Actions
    execute,
    retry: retryOperation,
    clearError,

    // Utilities
    refetch: execute
  }
}
