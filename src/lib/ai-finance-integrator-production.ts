/**
 * PRODUCTION-HARDENED AI Finance Integrator
 * Addresses all critical production concerns from code review
 */

import { supabase } from '@/src/lib/supabase/client'
import { CircuitBreaker, CircuitBreakerOptions } from './circuit-breaker'
import { RetryService } from './retry-service'
import { CacheService } from './cache-service'
import { ValidationService } from './validation-service'
import { MonitoringService } from './monitoring-service'
import { AuditLogger } from './audit-logger'

// ============================================================================
// PRODUCTION ERROR CLASSES
// ============================================================================

export class AIClassificationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AIClassificationError'
  }
}

export class DatabaseConnectionError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// PRODUCTION-READY AI FINANCE INTEGRATOR
// ============================================================================

export class ProductionAIFinanceIntegrator {
  private circuitBreaker: CircuitBreaker
  private retryService: RetryService
  private cache: CacheService
  private validator: ValidationService
  private monitoring: MonitoringService
  private auditLogger: AuditLogger

  constructor(private organizationId: string) {
    // Initialize production services
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringPeriod: 60000
    })

    this.retryService = new RetryService({
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2
    })

    this.cache = new CacheService({
      defaultTtl: 3600,
      maxSize: 10000
    })

    this.validator = new ValidationService()
    this.monitoring = new MonitoringService()
    this.auditLogger = new AuditLogger()
  }

  // ========================================================================
  // PRODUCTION-HARDENED TRANSACTION PROCESSING
  // ========================================================================

  /**
   * Create Universal Transaction with Full Production Error Handling
   */
  async createUniversalTransaction(
    transactionData: BusinessTransactionEvent,
    options: {
      skipValidation?: boolean
      bypassCache?: boolean
      priority?: 'low' | 'normal' | 'high' | 'critical'
    } = {}
  ): Promise<string> {
    const startTime = Date.now()
    const operationId = this.generateOperationId()

    try {
      // 1. Input Validation
      if (!options.skipValidation) {
        await this.validateTransactionData(transactionData)
      }

      // 2. Security & Audit Logging
      await this.auditLogger.logTransactionCreation({
        organizationId: this.organizationId,
        operationId,
        transactionType: transactionData.transaction_type,
        amount: transactionData.total_amount,
        priority: options.priority || 'normal'
      })

      // 3. Rate Limiting Check
      await this.checkRateLimit(this.organizationId, 'transaction_creation')

      // 4. Circuit Breaker Protection
      const transactionId = await this.circuitBreaker.execute(async () => {
        return this.retryService.execute(async () => {
          return this.performTransactionCreation(transactionData)
        })
      })

      // 5. Success Monitoring
      await this.monitoring.recordSuccess('transaction_creation', {
        organizationId: this.organizationId,
        duration: Date.now() - startTime,
        transactionId
      })

      return transactionId
    } catch (error) {
      // Comprehensive Error Handling
      await this.handleTransactionError(error, {
        organizationId: this.organizationId,
        operationId,
        transactionData,
        duration: Date.now() - startTime
      })

      throw error
    }
  }

  /**
   * AI Classification with Production Error Handling
   */
  async classifyTransaction(
    smartCode: string,
    transactionMetadata: Record<string, any>,
    options: {
      useCache?: boolean
      timeoutMs?: number
    } = {}
  ): Promise<AIClassificationResult | null> {
    const cacheKey = this.generateCacheKey('classification', smartCode, transactionMetadata)
    const timeoutMs = options.timeoutMs || 5000

    try {
      // 1. Cache Check
      if (options.useCache !== false) {
        const cachedResult = await this.cache.get<AIClassificationResult>(cacheKey)
        if (cachedResult) {
          await this.monitoring.incrementCounter('ai_classification_cache_hit')
          return cachedResult
        }
      }

      // 2. Input Validation
      await this.validator.validateSmartCode(smartCode)
      await this.validator.validateTransactionMetadata(transactionMetadata)

      // 3. Circuit Breaker + Timeout Protection
      const result = await this.circuitBreaker.execute(async () => {
        return this.retryService.executeWithTimeout(async () => {
          return this.performAIClassification(smartCode, transactionMetadata)
        }, timeoutMs)
      })

      // 4. Cache Result
      if (result && options.useCache !== false) {
        await this.cache.set(cacheKey, result, { ttl: 1800 }) // 30 minutes
      }

      // 5. Monitoring
      await this.monitoring.recordAIClassification({
        organizationId: this.organizationId,
        smartCode,
        confidence: result?.confidence || 0,
        success: !!result
      })

      return result
    } catch (error) {
      await this.handleAIClassificationError(error, {
        smartCode,
        organizationId: this.organizationId,
        metadataSize: JSON.stringify(transactionMetadata).length
      })

      // Graceful degradation - return null instead of throwing
      if (error instanceof CircuitBreakerOpenError) {
        await this.monitoring.recordAIServiceDegradation('circuit_breaker_open')
        return null
      }

      throw error
    }
  }

  // ========================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // ========================================================================

  private async validateTransactionData(data: BusinessTransactionEvent): Promise<void> {
    const errors: string[] = []

    if (!data.organization_id) {
      errors.push('organization_id is required')
    }

    if (!data.transaction_type) {
      errors.push('transaction_type is required')
    }

    if (!data.smart_code || !this.validator.isValidSmartCode(data.smart_code)) {
      errors.push('valid smart_code is required')
    }

    if (!data.total_amount || data.total_amount <= 0) {
      errors.push('total_amount must be positive')
    }

    if (data.reference_number && !this.validator.isValidReferenceNumber(data.reference_number)) {
      errors.push('reference_number format is invalid')
    }

    // Sanitize transaction metadata
    if (data.transaction_metadata) {
      data.transaction_metadata = this.validator.sanitizeJsonObject(data.transaction_metadata)
    }

    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.join(', ')}`, 'transaction_data', data)
    }
  }

  private async performTransactionCreation(
    transactionData: BusinessTransactionEvent
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert([
          {
            organization_id: transactionData.organization_id,
            transaction_type: transactionData.transaction_type,
            smart_code: transactionData.smart_code,
            reference_number: transactionData.reference_number,
            total_amount: transactionData.total_amount,
            transaction_metadata: transactionData.transaction_metadata,
            source_module: transactionData.source_module,
            source_document_id: transactionData.source_document_id,
            transaction_date: new Date().toISOString(),
            status: 'active',
            created_at: new Date().toISOString()
          }
        ])
        .select('id')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new DatabaseConnectionError('Database connection failed', error)
        }
        throw new Error(`Database operation failed: ${error.message}`)
      }

      return data.id
    } catch (error) {
      if (error instanceof DatabaseConnectionError) {
        throw error
      }
      throw new DatabaseConnectionError('Transaction creation failed', error as Error)
    }
  }

  private async performAIClassification(
    smartCode: string,
    transactionMetadata: Record<string, any>
  ): Promise<AIClassificationResult | null> {
    try {
      const { data, error } = await supabase.rpc('ai_classify_transaction', {
        p_smart_code: smartCode,
        p_transaction_data: transactionMetadata,
        p_organization_id: this.organizationId
      })

      if (error) {
        throw new AIClassificationError('AI classification RPC failed', error)
      }

      return data?.[0] || null
    } catch (error) {
      if (error instanceof AIClassificationError) {
        throw error
      }
      throw new AIClassificationError('AI service unavailable', error as Error)
    }
  }

  private async handleTransactionError(
    error: Error,
    context: {
      organizationId: string
      operationId: string
      transactionData: BusinessTransactionEvent
      duration: number
    }
  ): Promise<void> {
    // Log comprehensive error details
    await this.auditLogger.logError({
      error: error.message,
      stack: error.stack,
      context,
      severity: this.determineErrorSeverity(error),
      timestamp: new Date().toISOString()
    })

    // Update monitoring metrics
    await this.monitoring.recordError('transaction_creation', {
      errorType: error.constructor.name,
      organizationId: context.organizationId,
      duration: context.duration
    })

    // Alert if critical
    if (this.isCriticalError(error)) {
      await this.monitoring.sendAlert('CRITICAL_TRANSACTION_FAILURE', {
        organizationId: context.organizationId,
        error: error.message,
        operationId: context.operationId
      })
    }
  }

  private async handleAIClassificationError(
    error: Error,
    context: {
      smartCode: string
      organizationId: string
      metadataSize: number
    }
  ): Promise<void> {
    await this.auditLogger.logAIError({
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    })

    await this.monitoring.incrementCounter('ai_classification_errors', {
      errorType: error.constructor.name,
      smartCode: context.smartCode
    })
  }

  private async checkRateLimit(organizationId: string, operation: string): Promise<void> {
    const key = `rate_limit:${organizationId}:${operation}`
    const limit = 100 // per minute
    const window = 60 // seconds

    const current = await this.cache.increment(key, 1, { ttl: window })

    if (current > limit) {
      throw new Error(`Rate limit exceeded for ${operation}`)
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCacheKey(prefix: string, ...parts: any[]): string {
    const hash = require('crypto').createHash('md5').update(JSON.stringify(parts)).digest('hex')
    return `${prefix}:${this.organizationId}:${hash}`
  }

  private determineErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof DatabaseConnectionError) return 'critical'
    if (error instanceof ValidationError) return 'medium'
    if (error instanceof AIClassificationError) return 'high'
    return 'medium'
  }

  private isCriticalError(error: Error): boolean {
    return (
      error instanceof DatabaseConnectionError ||
      (error instanceof AIClassificationError && error.message.includes('unavailable'))
    )
  }
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface BusinessTransactionEvent {
  id?: string
  organization_id: string
  transaction_type: string
  smart_code: string
  reference_number: string
  total_amount: number
  transaction_metadata?: Record<string, any>
  source_module: string
  source_document_id?: string
}

interface AIClassificationResult {
  gl_mapping: any
  confidence: number
}

class CircuitBreakerOpenError extends Error {
  constructor() {
    super('Circuit breaker is open')
    this.name = 'CircuitBreakerOpenError'
  }
}

export default ProductionAIFinanceIntegrator
