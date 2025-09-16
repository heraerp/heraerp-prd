/**
 * Production-grade API error handling utilities
 */

import { NextResponse } from 'next/server'

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: any
    timestamp: string
    requestId?: string
  }
}

/**
 * Standardized error response handler
 */
export function errorResponse(error: unknown, requestId?: string): NextResponse<ErrorResponse> {
  console.error('[API Error]', {
    error,
    requestId,
    timestamp: new Date().toISOString()
  })

  // Handle known APIError instances
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId
        }
      },
      { status: error.statusCode }
    )
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    return NextResponse.json(
      {
        error: {
          message: supabaseError.message || 'Database error',
          code: supabaseError.code,
          details: supabaseError.details,
          timestamp: new Date().toISOString(),
          requestId
        }
      },
      { status: 400 }
    )
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'Internal server error'

  return NextResponse.json(
    {
      error: {
        message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId
      }
    },
    { status: 500 }
  )
}

/**
 * Async error handler wrapper
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse(error, requestId)
    }
  }) as T
}

/**
 * Input validation error helper
 */
export function validationError(field: string, message: string): APIError {
  return new APIError(`Validation error: ${message}`, 400, 'VALIDATION_ERROR', { field, message })
}

/**
 * Authentication error helper
 */
export function authError(message: string = 'Unauthorized'): APIError {
  return new APIError(message, 401, 'AUTH_ERROR')
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string): APIError {
  return new APIError(`${resource} not found`, 404, 'NOT_FOUND', { resource })
}

/**
 * Rate limit error helper
 */
export function rateLimitError(retryAfter?: number): APIError {
  return new APIError('Too many requests', 429, 'RATE_LIMIT', { retryAfter })
}
