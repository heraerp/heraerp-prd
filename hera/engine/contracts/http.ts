/**
 * HTTP Status Mapping for HERA Error Codes
 * Maps internal errors to HTTP responses with retry semantics
 */

import { HeraErrorCode, Result, isOk, isError } from './errors';

// HTTP mapping configuration
type HttpMapping = {
  status: number;
  retryable: boolean;
};

// Error code to HTTP status mapping
const ERROR_HTTP_MAP: Record<HeraErrorCode, HttpMapping> = {
  E_ORG_REQUIRED: { status: 400, retryable: false },
  E_SMART_CODE_REQUIRED: { status: 400, retryable: false },
  E_SCHEMA: { status: 404, retryable: false },
  E_DIM_MISSING: { status: 422, retryable: false },
  E_TAX_PROFILE: { status: 424, retryable: false },
  E_RATE_RESOLUTION: { status: 422, retryable: false },
  E_UNBALANCED: { status: 422, retryable: false },
  E_PERIOD_CLOSED: { status: 409, retryable: true },
  E_NOT_FOUND: { status: 404, retryable: false },
  E_IDEMPOTENT: { status: 200, retryable: false }, // treat as success
  E_GUARDRAIL: { status: 400, retryable: false },
  E_UPSTREAM: { status: 502, retryable: true },
  E_INTERNAL: { status: 500, retryable: true },
};

/**
 * HTTP response structure
 */
export type HttpResponse = {
  status: number;
  body: {
    success: boolean;
    data?: any;
    error?: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
      hint?: string;
      retryable: boolean;
    };
    meta?: Record<string, unknown>;
  };
};

/**
 * Convert a Result to an HTTP response
 */
export function toHttpResponse<T>(result: Result<T>): HttpResponse {
  if (isOk(result)) {
    return {
      status: 200,
      body: {
        success: true,
        data: result.data,
        ...(result.meta && { meta: result.meta })
      }
    };
  }

  const error = result.error;
  const mapping = ERROR_HTTP_MAP[error.code];

  // Special handling for idempotency
  if (error.code === 'E_IDEMPOTENT' && error.context?.transaction_id) {
    return {
      status: 200,
      body: {
        success: true,
        data: { transaction_id: error.context.transaction_id },
        meta: { idempotent: true }
      }
    };
  }

  return {
    status: mapping.status,
    body: {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        ...(error.hint && { hint: error.hint }),
        retryable: mapping.retryable
      }
    }
  };
}

/**
 * Check if an error code is retryable
 */
export function isRetryable(code: HeraErrorCode): boolean {
  return ERROR_HTTP_MAP[code].retryable;
}

/**
 * Get HTTP status for an error code
 */
export function getHttpStatus(code: HeraErrorCode): number {
  return ERROR_HTTP_MAP[code].status;
}

/**
 * Create a standardized API response
 */
export function apiResponse<T>(result: Result<T>): Response {
  const httpResp = toHttpResponse(result);
  
  return new Response(
    JSON.stringify(httpResp.body),
    {
      status: httpResp.status,
      headers: {
        'Content-Type': 'application/json',
        ...(isError(result) && ERROR_HTTP_MAP[result.error.code].retryable && {
          'Retry-After': '5' // 5 seconds default retry
        })
      }
    }
  );
}

/**
 * Parse error from HTTP response
 */
export async function parseHttpError(response: Response): Promise<Result<never>> {
  try {
    const body = await response.json();
    if (body.error) {
      return {
        ok: false,
        error: {
          code: body.error.code as HeraErrorCode,
          message: body.error.message,
          details: body.error.details,
          hint: body.error.hint
        }
      };
    }
  } catch {
    // Fallback for non-JSON responses
  }

  // Generic error based on status
  const code: HeraErrorCode = response.status >= 500 ? 'E_UPSTREAM' : 'E_INTERNAL';
  return {
    ok: false,
    error: {
      code,
      message: `HTTP ${response.status}: ${response.statusText}`
    }
  };
}