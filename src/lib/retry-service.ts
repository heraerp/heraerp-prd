/**
 * Production Retry Service with Exponential Backoff
 * Handles transient failures in AI and database operations
 */

export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryCondition?: (error: Error) => boolean
  jitterMs?: number
}

export class RetryExhaustedError extends Error {
  constructor(
    public readonly lastError: Error,
    public readonly attemptCount: number
  ) {
    super(`Retry exhausted after ${attemptCount} attempts: ${lastError.message}`)
    this.name = 'RetryExhaustedError'
  }
}

export class RetryService {
  constructor(private options: RetryOptions) {
    this.options.jitterMs = options.jitterMs || 100
    this.options.retryCondition = options.retryCondition || this.defaultRetryCondition
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry if condition fails
        if (!this.options.retryCondition!(lastError)) {
          throw lastError
        }
        
        // Don't delay on last attempt
        if (attempt < this.options.maxAttempts) {
          const delay = this.calculateDelay(attempt)
          await this.sleep(delay)
        }
      }
    }
    
    throw new RetryExhaustedError(lastError!, this.options.maxAttempts)
  }

  /**
   * Execute with timeout and retry
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return this.execute(async () => {
      return Promise.race([
        operation(),
        this.createTimeoutPromise(timeoutMs)
      ])
    })
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.options.baseDelayMs * 
      Math.pow(this.options.backoffMultiplier, attempt - 1)
    
    const cappedDelay = Math.min(exponentialDelay, this.options.maxDelayMs)
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.options.jitterMs!
    
    return cappedDelay + jitter
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  private defaultRetryCondition(error: Error): boolean {
    // Retry on transient errors
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN'
    ]
    
    const retryableMessages = [
      'database connection',
      'network error',
      'timeout',
      'service unavailable',
      'too many connections'
    ]
    
    // Check error codes
    if ('code' in error && retryableErrors.includes(error.code as string)) {
      return true
    }
    
    // Check error messages
    const errorMessage = error.message.toLowerCase()
    return retryableMessages.some(msg => errorMessage.includes(msg))
  }
}