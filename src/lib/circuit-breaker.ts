/**
 * Production Circuit Breaker Implementation
 * Prevents cascade failures in AI service dependencies
 */

export interface CircuitBreakerOptions {
  failureThreshold: number // Number of failures before opening
  resetTimeout: number // Time before attempting reset (ms)
  monitoringPeriod: number // Window for failure counting (ms)
  successThreshold?: number // Successes needed to close circuit
}

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing fast
  HALF_OPEN = 'half-open' // Testing if service recovered
}

export class CircuitBreakerOpenError extends Error {
  constructor() {
    super('Circuit breaker is open - service unavailable')
    this.name = 'CircuitBreakerOpenError'
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number = 0
  private nextAttemptTime: number = 0

  constructor(private options: CircuitBreakerOptions) {
    this.options.successThreshold = options.successThreshold || 3
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerOpenError()
      }
      this.state = CircuitState.HALF_OPEN
      this.successCount = 0
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.options.successThreshold!) {
        this.reset()
      }
    } else {
      this.reset()
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      this.open()
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.open()
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN
    this.nextAttemptTime = Date.now() + this.options.resetTimeout
  }

  private reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.nextAttemptTime = 0
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): {
    state: CircuitState
    failureCount: number
    successCount: number
    nextAttemptTime: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime
    }
  }
}
