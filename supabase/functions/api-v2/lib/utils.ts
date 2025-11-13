// HERA v2.3 API Gateway - Utility Functions
// Smart Code: HERA.API.V2.UTILS.v1

/**
 * Generate secure random ID (UUID v4 compatible)
 */
export function generateSecureId(): string {
  return crypto.randomUUID();
}

/**
 * Generate request ID for tracing
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `req_${timestamp}_${random}`;
}

/**
 * Parse error message with status code
 */
export function parseError(error: any): { status: number; message: string; code?: string } {
  if (typeof error === 'string') {
    const match = error.match(/^(\d{3}):(.*)/);
    if (match) {
      return {
        status: parseInt(match[1]),
        message: match[2],
        code: getErrorCode(parseInt(match[1]))
      };
    }
    return { status: 500, message: error, code: 'INTERNAL_ERROR' };
  }
  
  if (error instanceof Error) {
    const match = error.message.match(/^(\d{3}):(.*)/);
    if (match) {
      return {
        status: parseInt(match[1]),
        message: match[2],
        code: getErrorCode(parseInt(match[1]))
      };
    }
    return { status: 500, message: error.message, code: 'INTERNAL_ERROR' };
  }
  
  return { 
    status: 500, 
    message: 'Unknown error occurred', 
    code: 'INTERNAL_ERROR' 
  };
}

/**
 * Get error code from HTTP status
 */
function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  };
  
  return codes[status] || 'UNKNOWN_ERROR';
}

/**
 * Create error response with consistent format
 */
export function createErrorResponse(error: any, requestId?: string): Response {
  const parsed = parseError(error);
  
  const errorResponse = {
    error: {
      code: parsed.code,
      message: parsed.message,
      status: parsed.status,
      request_id: requestId || 'unknown',
      timestamp: new Date().toISOString()
    }
  };
  
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('X-Request-ID', requestId || 'unknown');
  
  // Add rate limit headers if it's a rate limit error
  if (parsed.status === 429) {
    const headerMatch = parsed.message.match(/Headers: ({.*})/);
    if (headerMatch) {
      try {
        const rateLimitHeaders = JSON.parse(headerMatch[1]);
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          headers.set(key, String(value));
        });
      } catch (e) {
        // Ignore header parsing errors
      }
    }
  }
  
  return new Response(
    JSON.stringify(errorResponse, null, 2),
    {
      status: parsed.status,
      headers
    }
  );
}

/**
 * Create success response with consistent format
 */
export function createSuccessResponse(
  data: any, 
  requestId: string, 
  metadata?: Record<string, any>
): Response {
  const response = {
    data,
    metadata: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
  
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('X-Request-ID', requestId);
  
  return new Response(
    JSON.stringify(response, null, 2),
    {
      status: 200,
      headers
    }
  );
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Sanitize string for logging (remove sensitive data)
 */
export function sanitizeForLog(obj: any): any {
  if (typeof obj === 'string') {
    return obj.length > 100 ? `${obj.substring(0, 100)}...` : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLog(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Extract IP address from request
 */
export function getClientIP(req: Request): string {
  // Check various headers for IP (CloudFlare, etc.)
  const headers = [
    'CF-Connecting-IP',
    'X-Forwarded-For',
    'X-Real-IP',
    'X-Client-IP'
  ];
  
  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // X-Forwarded-For can contain multiple IPs
      return value.split(',')[0].trim();
    }
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('User-Agent') || 'unknown';
}

/**
 * Validate Smart Code format
 */
export function isValidSmartCode(smartCode: string): boolean {
  const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
  return pattern.test(smartCode);
}

/**
 * Parse Smart Code components
 */
export function parseSmartCode(smartCode: string): {
  valid: boolean;
  prefix?: string;
  industry?: string;
  module?: string;
  type?: string;
  subtype?: string;
  version?: string;
  components?: string[];
} {
  if (!isValidSmartCode(smartCode)) {
    return { valid: false };
  }
  
  const components = smartCode.split('.');
  
  return {
    valid: true,
    prefix: components[0], // HERA
    industry: components[1], // SALON, ENTERPRISE, etc.
    module: components[2], // CUSTOMER, PRODUCT, etc.
    type: components[3], // ENTITY, FIELD, etc.
    subtype: components[4], // PROFILE, etc.
    version: components[components.length - 1], // v1
    components
  };
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${label} FAILED after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = undefined;
      func(...args);
    };
    
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}