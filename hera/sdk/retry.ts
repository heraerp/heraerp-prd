/**
 * Retry strategy with exponential backoff and full jitter
 * Framework-agnostic implementation
 */

import type { HeraErrorCode } from '../engine/contracts/errors';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 4000,
};

// Retryable error codes from contracts/http.ts
const RETRYABLE_ERROR_CODES: Set<HeraErrorCode> = new Set([
  'E_PERIOD_CLOSED',
  'E_UPSTREAM',
  'E_INTERNAL',
]);

/**
 * Check if an error code is retryable
 */
export function isRetryableError(code: HeraErrorCode): boolean {
  return RETRYABLE_ERROR_CODES.has(code);
}

/**
 * Calculate delay with exponential backoff and full jitter
 * Formula: random(0, min(maxDelay, baseDelay * 2^attempt))
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(config.maxDelayMs, exponentialDelay);
  // Full jitter: random between 0 and capped delay
  return Math.floor(Math.random() * cappedDelay);
}

/**
 * Parse Retry-After header
 * Supports both seconds (e.g., "120") and HTTP date format
 */
export function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null;

  // Try parsing as seconds
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP date
  const date = new Date(headerValue);
  if (!isNaN(date.getTime())) {
    const delay = date.getTime() - Date.now();
    return delay > 0 ? delay : null;
  }

  return null;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RetryContext {
  attempt: number;
  delay: number;
  error: {
    code: HeraErrorCode;
    message: string;
  };
}

export interface RetryOptions {
  config?: Partial<RetryConfig>;
  onRetry?: (context: RetryContext) => void;
  signal?: AbortSignal;
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (error: any) => { retryable: boolean; code?: HeraErrorCode; retryAfter?: string | null },
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options?.config };
  let lastError: any;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Check if aborted
      if (options?.signal?.aborted) {
        throw new Error('Operation aborted');
      }

      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const { retryable, code, retryAfter } = isRetryable(error);
      
      if (!retryable || attempt === config.maxAttempts - 1) {
        throw error;
      }

      // Calculate delay
      let delay = calculateDelay(attempt, config);
      
      // Honor Retry-After header if present
      const retryAfterMs = parseRetryAfter(retryAfter || null);
      if (retryAfterMs !== null) {
        delay = retryAfterMs;
      }

      // Notify retry callback
      if (options?.onRetry) {
        options.onRetry({
          attempt: attempt + 1,
          delay,
          error: {
            code: code || 'E_INTERNAL',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable function with preset configuration
 */
export function createRetryableFunction<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  isRetryable: (error: any) => { retryable: boolean; code?: HeraErrorCode; retryAfter?: string | null },
  config?: Partial<RetryConfig>
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => 
    withRetry(() => fn(...args), isRetryable, { config });
}