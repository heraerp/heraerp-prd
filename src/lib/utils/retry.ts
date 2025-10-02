/**
 * Retry utility for handling transient failures
 */

import { logger } from './logger'

interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (error: Error, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  onRetry: () => {}
}

export async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === opts.maxAttempts) {
        logger.error(`All retry attempts failed after ${attempt} attempts`, {
          error: lastError.message
        })
        throw lastError
      }

      // Calculate delay based on backoff strategy
      const delayMs =
        opts.backoff === 'exponential'
          ? opts.delay * Math.pow(2, attempt - 1)
          : opts.delay * attempt

      logger.warn(`Retry attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delayMs}ms`, {
        error: lastError.message
      })

      // Call the onRetry callback if provided
      opts.onRetry(lastError, attempt)

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  // This should never be reached, but TypeScript doesn't know that
  throw lastError || new Error('Retry failed')
}

/**
 * Retry with exponential backoff helper
 */
export function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  initialDelay = 1000
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    delay: initialDelay,
    backoff: 'exponential'
  })
}

/**
 * Retry with linear backoff helper
 */
export function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    delay,
    backoff: 'linear'
  })
}
