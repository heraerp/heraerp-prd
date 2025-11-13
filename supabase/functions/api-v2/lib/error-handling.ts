// HERA v2.3 API Gateway - Comprehensive Error Handling System
// Smart Code: HERA.API.V2.ERROR_HANDLING.v1

import type { RequestContext } from '../types/middleware.ts';
import { createErrorResponse, parseError, sanitizeForLog } from './utils.ts';

/**
 * Error categories for proper handling and metrics
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  IDEMPOTENCY = 'idempotency',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  INTERNAL = 'internal',
  NOT_FOUND = 'not_found',
  METHOD_NOT_ALLOWED = 'method_not_allowed'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Structured error information
 */
export interface StructuredError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
  retryable?: boolean;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  actorId?: string;
  organizationId?: string;
  endpoint?: string;
  context?: any;
}

/**
 * Error classification mapping
 */
const ERROR_CLASSIFICATIONS: Record<number, { category: ErrorCategory; severity: ErrorSeverity; retryable: boolean }> = {
  400: { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW, retryable: false },
  401: { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.MEDIUM, retryable: false },
  403: { category: ErrorCategory.AUTHORIZATION, severity: ErrorSeverity.MEDIUM, retryable: false },
  404: { category: ErrorCategory.NOT_FOUND, severity: ErrorSeverity.LOW, retryable: false },
  405: { category: ErrorCategory.METHOD_NOT_ALLOWED, severity: ErrorSeverity.LOW, retryable: false },
  409: { category: ErrorCategory.IDEMPOTENCY, severity: ErrorSeverity.LOW, retryable: true },
  429: { category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.MEDIUM, retryable: true },
  500: { category: ErrorCategory.INTERNAL, severity: ErrorSeverity.HIGH, retryable: true },
  502: { category: ErrorCategory.EXTERNAL_SERVICE, severity: ErrorSeverity.HIGH, retryable: true },
  503: { category: ErrorCategory.EXTERNAL_SERVICE, severity: ErrorSeverity.HIGH, retryable: true },
  504: { category: ErrorCategory.EXTERNAL_SERVICE, severity: ErrorSeverity.MEDIUM, retryable: true }
};

/**
 * Error suggestions mapping
 */
const ERROR_SUGGESTIONS: Record<ErrorCategory, string[]> = {
  [ErrorCategory.AUTHENTICATION]: [
    'Check that your JWT token is valid and not expired',
    'Ensure the Authorization header is properly formatted: Bearer <token>',
    'Verify your Supabase authentication is working'
  ],
  [ErrorCategory.AUTHORIZATION]: [
    'Verify you have permission to access this organization',
    'Check your organization membership status',
    'Ensure you have the required role for this operation'
  ],
  [ErrorCategory.VALIDATION]: [
    'Check the request payload format and required fields',
    'Ensure all Smart Codes follow HERA DNA patterns',
    'Verify organization_id is included and matches your context'
  ],
  [ErrorCategory.RATE_LIMIT]: [
    'Wait for the rate limit window to reset',
    'Implement exponential backoff in your client',
    'Consider reducing request frequency or upgrading your tier'
  ],
  [ErrorCategory.IDEMPOTENCY]: [
    'Wait for the current request to complete before retrying',
    'Use unique Idempotency-Key headers for different operations',
    'Check if the operation has already completed successfully'
  ],
  [ErrorCategory.BUSINESS_LOGIC]: [
    'Review the business rules for this operation',
    'Ensure GL transactions are balanced',
    'Verify entity relationships and dependencies'
  ],
  [ErrorCategory.EXTERNAL_SERVICE]: [
    'Retry the request after a brief delay',
    'Check the status of external services',
    'Consider implementing circuit breaker patterns'
  ],
  [ErrorCategory.INTERNAL]: [
    'Retry the request after a brief delay',
    'Contact support if the issue persists',
    'Check the system status page'
  ],
  [ErrorCategory.NOT_FOUND]: [
    'Verify the requested resource exists',
    'Check the URL path and parameters',
    'Ensure you have access to the organization context'
  ],
  [ErrorCategory.METHOD_NOT_ALLOWED]: [
    'Check the HTTP method for this endpoint',
    'Review the API documentation for supported methods',
    'Ensure you\'re using the correct endpoint URL'
  ]
};

/**
 * Enhanced error handler that creates structured error responses
 */
export class ErrorHandler {
  /**
   * Process and structure an error
   */
  static processError(
    error: any, 
    context?: Partial<RequestContext>, 
    endpoint?: string
  ): StructuredError {
    const parsed = parseError(error);
    const classification = ERROR_CLASSIFICATIONS[parsed.status] || {
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.HIGH,
      retryable: true
    };

    const structuredError: StructuredError = {
      category: classification.category,
      severity: classification.severity,
      code: parsed.code || 'UNKNOWN_ERROR',
      message: parsed.message,
      retryable: classification.retryable,
      statusCode: parsed.status,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
      actorId: context?.actor?.id,
      organizationId: context?.orgContext?.org_id,
      endpoint,
      suggestions: ERROR_SUGGESTIONS[classification.category] || []
    };

    // Add specific details for known error patterns
    this.enrichErrorDetails(structuredError, error, context);

    return structuredError;
  }

  /**
   * Create a structured error response
   */
  static createStructuredResponse(
    error: any,
    context?: Partial<RequestContext>,
    endpoint?: string
  ): Response {
    const structuredError = this.processError(error, context, endpoint);
    
    // Log error based on severity
    this.logError(structuredError, error);

    // Create response with structured error
    const errorResponse = {
      error: {
        code: structuredError.code,
        message: structuredError.message,
        category: structuredError.category,
        severity: structuredError.severity,
        retryable: structuredError.retryable,
        suggestions: structuredError.suggestions,
        details: structuredError.details,
        context: {
          request_id: structuredError.requestId,
          actor_id: structuredError.actorId,
          organization_id: structuredError.organizationId,
          endpoint: structuredError.endpoint,
          timestamp: structuredError.timestamp
        }
      }
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-Request-ID', structuredError.requestId || 'unknown');
    headers.set('X-Error-Category', structuredError.category);
    headers.set('X-Error-Retryable', structuredError.retryable.toString());

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: structuredError.statusCode,
        headers
      }
    );
  }

  /**
   * Enrich error with specific details
   */
  private static enrichErrorDetails(
    structuredError: StructuredError,
    originalError: any,
    context?: Partial<RequestContext>
  ): void {
    // Rate limit errors
    if (structuredError.category === ErrorCategory.RATE_LIMIT) {
      const headerMatch = structuredError.message.match(/Headers: ({.*})/);
      if (headerMatch) {
        try {
          structuredError.details = {
            type: 'rate_limit_exceeded',
            headers: JSON.parse(headerMatch[1])
          };
        } catch (e) {
          // Ignore header parsing errors
        }
      }
    }

    // Validation errors
    if (structuredError.category === ErrorCategory.VALIDATION) {
      if (structuredError.message.includes('smart_code')) {
        structuredError.details = {
          type: 'smart_code_validation',
          pattern: 'HERA.[INDUSTRY].[MODULE].[TYPE].[SUBTYPE].v[VERSION]',
          examples: [
            'HERA.SALON.CUSTOMER.ENTITY.PROFILE.v1',
            'HERA.FINANCE.GL.ACCOUNT.ASSET.v1',
            'HERA.CRM.LEAD.ENTITY.PROSPECT.v1'
          ]
        };
      }

      if (structuredError.message.includes('organization_id')) {
        structuredError.details = {
          type: 'organization_filter_required',
          current_org: context?.orgContext?.org_id,
          required: 'organization_id must be present and match authenticated context'
        };
      }

      if (structuredError.message.includes('GL')) {
        structuredError.details = {
          type: 'gl_balance_validation',
          rule: 'Debit total must equal Credit total per currency',
          currencies_supported: ['AED', 'USD', 'EUR', 'GBP', 'DOC']
        };
      }
    }

    // Authentication errors
    if (structuredError.category === ErrorCategory.AUTHENTICATION) {
      structuredError.details = {
        type: 'authentication_failure',
        required_header: 'Authorization: Bearer <jwt_token>',
        identity_resolution: structuredError.message.includes('identity_not_resolved')
      };
    }

    // Authorization errors
    if (structuredError.category === ErrorCategory.AUTHORIZATION) {
      if (structuredError.message.includes('not_member')) {
        structuredError.details = {
          type: 'membership_required',
          organization_id: context?.orgContext?.org_id,
          actor_id: context?.actor?.id,
          available_memberships: context?.actor?.memberships?.map(m => m.org_id) || []
        };
      }
    }

    // Business logic errors (GL balance, entity relationships, etc.)
    if (structuredError.message.includes('GL') || 
        structuredError.message.includes('balance') ||
        structuredError.message.includes('relationship')) {
      structuredError.category = ErrorCategory.BUSINESS_LOGIC;
      structuredError.severity = ErrorSeverity.MEDIUM;
      structuredError.suggestions = ERROR_SUGGESTIONS[ErrorCategory.BUSINESS_LOGIC];
    }

    // Database/RPC errors
    if (structuredError.message.includes('rpc') || 
        structuredError.message.includes('function') ||
        structuredError.message.includes('database')) {
      structuredError.details = {
        type: 'database_operation',
        context: sanitizeForLog(context)
      };
    }

    // Middleware errors
    if (structuredError.message.includes('middleware')) {
      structuredError.details = {
        type: 'middleware_execution',
        middleware_chain: ['auth', 'org-context', 'guardrails', 'rate-limit', 'idempotency']
      };
    }
  }

  /**
   * Log error based on severity level
   */
  private static logError(structuredError: StructuredError, originalError: any): void {
    const logData = {
      ...structuredError,
      original_error: originalError instanceof Error ? originalError.message : String(originalError),
      stack: originalError instanceof Error ? originalError.stack : undefined
    };

    switch (structuredError.severity) {
      case ErrorSeverity.LOW:
        console.info(`[${structuredError.category.toUpperCase()}] ${structuredError.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(`[${structuredError.category.toUpperCase()}] ${structuredError.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(`[${structuredError.category.toUpperCase()}] ${structuredError.message}`, logData);
        break;
    }
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: StructuredError): boolean {
    return error.retryable && [
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorCategory.INTERNAL,
      ErrorCategory.IDEMPOTENCY
    ].includes(error.category);
  }

  /**
   * Get retry delay for retryable errors
   */
  static getRetryDelay(error: StructuredError, attempt: number): number {
    if (!this.isRetryable(error)) {
      return 0;
    }

    switch (error.category) {
      case ErrorCategory.RATE_LIMIT:
        // Extract retry-after from details if available
        if (error.details?.headers?.['Retry-After']) {
          return parseInt(error.details.headers['Retry-After']) * 1000;
        }
        return Math.min(1000 * Math.pow(2, attempt), 60000); // Exponential backoff, max 1 minute

      case ErrorCategory.EXTERNAL_SERVICE:
        return Math.min(500 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30 seconds

      case ErrorCategory.INTERNAL:
        return Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10 seconds

      case ErrorCategory.IDEMPOTENCY:
        return 1000 + Math.random() * 1000; // 1-2 seconds with jitter

      default:
        return 1000; // Default 1 second
    }
  }

  /**
   * Create a simplified error response for health checks and metrics
   */
  static createSimpleResponse(error: any, requestId: string): Response {
    const parsed = parseError(error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: parsed.code,
          message: parsed.message,
          request_id: requestId,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: parsed.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );
  }
}