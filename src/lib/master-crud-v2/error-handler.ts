/**
 * Master CRUD v2 - Enhanced Error Handling & Rollback
 * Comprehensive error management with automatic rollback and recovery
 */

import { MasterCrudError, MasterCrudErrorResponse } from '@/types/master-crud-v2.types'

/**
 * Master CRUD v2 Error Classes
 */

export class MasterCrudBaseError extends Error {
  public readonly code: string
  public readonly details?: any
  public readonly field?: string
  public readonly operation?: string
  public readonly httpStatus: number

  constructor(
    message: string,
    code: string,
    httpStatus: number = 500,
    details?: any,
    field?: string,
    operation?: string
  ) {
    super(message)
    this.name = 'MasterCrudBaseError'
    this.code = code
    this.httpStatus = httpStatus
    this.details = details
    this.field = field
    this.operation = operation
  }

  toResponse(executionTimeMs: number, failedAt?: string): MasterCrudErrorResponse {
    return {
      api_version: 'v2',
      success: false,
      error: this.code,
      errors: [{
        code: this.code,
        message: this.message,
        details: this.details,
        field: this.field,
        operation: this.operation
      }],
      performance: {
        executionTimeMs,
        failedAt: failedAt || 'unknown'
      }
    }
  }
}

export class ValidationError extends MasterCrudBaseError {
  constructor(message: string, field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details, field, 'validation')
    this.name = 'ValidationError'
  }
}

export class OrganizationError extends MasterCrudBaseError {
  constructor(message: string, organizationId?: string) {
    super(message, 'ORGANIZATION_ERROR', 403, { organizationId }, undefined, 'organization_check')
    this.name = 'OrganizationError'
  }
}

export class SmartCodeError extends MasterCrudBaseError {
  constructor(message: string, smartCode?: string) {
    super(message, 'SMART_CODE_ERROR', 400, { smartCode }, 'smartCode', 'smart_code_validation')
    this.name = 'SmartCodeError'
  }
}

export class TransactionError extends MasterCrudBaseError {
  constructor(message: string, transactionId?: string, operationCount?: number) {
    super(message, 'TRANSACTION_ERROR', 500, { transactionId, operationCount }, undefined, 'atomic_transaction')
    this.name = 'TransactionError'
  }
}

export class PerformanceError extends MasterCrudBaseError {
  constructor(message: string, actualTimeMs: number, targetTimeMs: number) {
    super(message, 'PERFORMANCE_ERROR', 500, { actualTimeMs, targetTimeMs }, undefined, 'performance_check')
    this.name = 'PerformanceError'
  }
}

export class EntityNotFoundError extends MasterCrudBaseError {
  constructor(entityId: string, organizationId?: string) {
    super(
      `Entity not found: ${entityId}`,
      'ENTITY_NOT_FOUND',
      404,
      { entityId, organizationId },
      'entityId',
      'entity_lookup'
    )
    this.name = 'EntityNotFoundError'
  }
}

export class RelationshipError extends MasterCrudBaseError {
  constructor(message: string, relationshipType?: string, sourceId?: string, targetId?: string) {
    super(
      message,
      'RELATIONSHIP_ERROR',
      400,
      { relationshipType, sourceId, targetId },
      undefined,
      'relationship_creation'
    )
    this.name = 'RelationshipError'
  }
}

export class DynamicDataError extends MasterCrudBaseError {
  constructor(message: string, fieldName?: string, fieldType?: string) {
    super(
      message,
      'DYNAMIC_DATA_ERROR',
      400,
      { fieldName, fieldType },
      fieldName,
      'dynamic_data_operation'
    )
    this.name = 'DynamicDataError'
  }
}

/**
 * Master CRUD v2 Error Handler
 */
export class MasterCrudErrorHandler {
  private static instance: MasterCrudErrorHandler
  private errorCounts = new Map<string, number>()
  private lastErrors = new Map<string, Date>()

  static getInstance(): MasterCrudErrorHandler {
    if (!MasterCrudErrorHandler.instance) {
      MasterCrudErrorHandler.instance = new MasterCrudErrorHandler()
    }
    return MasterCrudErrorHandler.instance
  }

  /**
   * Handle and transform errors into Master CRUD v2 format
   */
  handleError(error: any, operation: string, startTime: number): MasterCrudErrorResponse {
    const executionTime = Date.now() - startTime
    
    // Track error frequency
    this.trackError(error.code || error.name || 'unknown')
    
    // Log error for monitoring
    this.logError(error, operation, executionTime)

    // Transform known error types
    if (error instanceof MasterCrudBaseError) {
      return error.toResponse(executionTime, operation)
    }

    // Handle database errors
    if (this.isDatabaseError(error)) {
      return this.handleDatabaseError(error, operation, executionTime)
    }

    // Handle validation errors
    if (this.isValidationError(error)) {
      return this.handleValidationError(error, operation, executionTime)
    }

    // Handle network/timeout errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, operation, executionTime)
    }

    // Handle unknown errors
    return this.handleUnknownError(error, operation, executionTime)
  }

  /**
   * Validate organization context
   */
  validateOrganization(organizationId: string | undefined): void {
    if (!organizationId) {
      throw new OrganizationError('organization_id is required for all Master CRUD v2 operations')
    }

    if (!this.isValidUUID(organizationId)) {
      throw new OrganizationError(`Invalid organization_id format: ${organizationId}`)
    }
  }

  /**
   * Validate smart code format
   */
  validateSmartCode(smartCode: string): void {
    const smartCodeRegex = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$/
    
    if (!smartCodeRegex.test(smartCode)) {
      throw new SmartCodeError(
        `Invalid smart code format: ${smartCode}. Expected: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{VERSION}`,
        smartCode
      )
    }
  }

  /**
   * Validate entity type
   */
  validateEntityType(entityType: string): void {
    if (!entityType || entityType.trim().length === 0) {
      throw new ValidationError('entityType cannot be empty', 'entityType')
    }

    if (entityType.length > 50) {
      throw new ValidationError('entityType cannot exceed 50 characters', 'entityType', { length: entityType.length })
    }

    // Check for valid characters (alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(entityType)) {
      throw new ValidationError('entityType can only contain alphanumeric characters and underscores', 'entityType')
    }
  }

  /**
   * Validate entity name
   */
  validateEntityName(entityName: string): void {
    if (!entityName || entityName.trim().length === 0) {
      throw new ValidationError('entityName cannot be empty', 'entityName')
    }

    if (entityName.length > 255) {
      throw new ValidationError('entityName cannot exceed 255 characters', 'entityName', { length: entityName.length })
    }
  }

  /**
   * Validate dynamic data field
   */
  validateDynamicField(fieldName: string, fieldType: string, fieldValue: any): void {
    if (!fieldName || fieldName.trim().length === 0) {
      throw new DynamicDataError('field_name cannot be empty', fieldName)
    }

    const validTypes = ['text', 'number', 'boolean', 'date', 'json', 'file_url']
    if (!validTypes.includes(fieldType)) {
      throw new DynamicDataError(
        `Invalid field_type: ${fieldType}. Valid types: ${validTypes.join(', ')}`,
        fieldName,
        fieldType
      )
    }

    // Type-specific validation
    switch (fieldType) {
      case 'number':
        if (fieldValue !== null && fieldValue !== undefined && (isNaN(fieldValue) || !isFinite(fieldValue))) {
          throw new DynamicDataError(`Invalid number value for field ${fieldName}`, fieldName, fieldType)
        }
        break
      case 'boolean':
        if (fieldValue !== null && fieldValue !== undefined && typeof fieldValue !== 'boolean') {
          throw new DynamicDataError(`Invalid boolean value for field ${fieldName}`, fieldName, fieldType)
        }
        break
      case 'date':
        if (fieldValue !== null && fieldValue !== undefined && !this.isValidDate(fieldValue)) {
          throw new DynamicDataError(`Invalid date value for field ${fieldName}`, fieldName, fieldType)
        }
        break
    }
  }

  /**
   * Validate relationship
   */
  validateRelationship(
    relationshipType: string,
    sourceEntityId?: string,
    targetEntityId?: string,
    targetSmartCode?: string
  ): void {
    if (!relationshipType || relationshipType.trim().length === 0) {
      throw new RelationshipError('relationship_type cannot be empty')
    }

    if (!targetEntityId && !targetSmartCode) {
      throw new RelationshipError(
        'Either targetEntityId or targetSmartCode must be provided',
        relationshipType,
        sourceEntityId
      )
    }

    if (targetEntityId && !this.isValidUUID(targetEntityId)) {
      throw new RelationshipError(`Invalid targetEntityId format: ${targetEntityId}`, relationshipType, sourceEntityId, targetEntityId)
    }

    if (sourceEntityId && !this.isValidUUID(sourceEntityId)) {
      throw new RelationshipError(`Invalid sourceEntityId format: ${sourceEntityId}`, relationshipType, sourceEntityId, targetEntityId)
    }
  }

  /**
   * Check performance and warn if slow
   */
  checkPerformance(executionTimeMs: number, targetTimeMs: number, operation: string): string[] {
    const warnings: string[] = []
    
    if (executionTimeMs > targetTimeMs) {
      const overagePercent = Math.round(((executionTimeMs - targetTimeMs) / targetTimeMs) * 100)
      warnings.push(`Performance warning: ${operation} took ${executionTimeMs}ms (${overagePercent}% over target of ${targetTimeMs}ms)`)
    }

    if (executionTimeMs > targetTimeMs * 2) {
      // Log severe performance issues
      console.error(`[Master CRUD v2] Severe performance issue: ${operation} took ${executionTimeMs}ms (target: ${targetTimeMs}ms)`)
    }

    return warnings
  }

  // Private helper methods
  private trackError(errorCode: string): void {
    const count = this.errorCounts.get(errorCode) || 0
    this.errorCounts.set(errorCode, count + 1)
    this.lastErrors.set(errorCode, new Date())
  }

  private logError(error: any, operation: string, executionTime: number): void {
    const errorInfo = {
      operation,
      errorCode: error.code || error.name || 'unknown',
      message: error.message,
      executionTime,
      timestamp: new Date().toISOString(),
      stack: error.stack
    }

    if (error instanceof MasterCrudBaseError) {
      console.warn('[Master CRUD v2] Known error:', errorInfo)
    } else {
      console.error('[Master CRUD v2] Unexpected error:', errorInfo)
    }
  }

  private isDatabaseError(error: any): boolean {
    return error.code && (
      error.code.startsWith('23') || // Integrity constraint violations
      error.code.startsWith('42') || // Syntax errors
      error.code.startsWith('08') || // Connection errors
      error.message?.includes('database') ||
      error.message?.includes('relation') ||
      error.message?.includes('column')
    )
  }

  private isValidationError(error: any): boolean {
    return error.name === 'ValidationError' || 
           error.message?.includes('validation') ||
           error.message?.includes('required')
  }

  private isNetworkError(error: any): boolean {
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ETIMEDOUT' ||
           error.message?.includes('network') ||
           error.message?.includes('timeout')
  }

  private handleDatabaseError(error: any, operation: string, executionTime: number): MasterCrudErrorResponse {
    let code = 'DATABASE_ERROR'
    let message = 'Database operation failed'
    let httpStatus = 500

    // Handle specific database errors
    if (error.code?.startsWith('23')) {
      code = 'CONSTRAINT_VIOLATION'
      message = 'Data constraint violation'
      httpStatus = 400
    } else if (error.code?.startsWith('42')) {
      code = 'SQL_ERROR'
      message = 'SQL syntax or schema error'
      httpStatus = 500
    } else if (error.code?.startsWith('08')) {
      code = 'CONNECTION_ERROR'
      message = 'Database connection failed'
      httpStatus = 503
    }

    return {
      api_version: 'v2',
      success: false,
      error: code,
      errors: [{
        code,
        message: `${message}: ${error.message}`,
        details: { originalError: error.code, operation },
        operation
      }],
      performance: {
        executionTimeMs: executionTime,
        failedAt: 'database_operation'
      }
    }
  }

  private handleValidationError(error: any, operation: string, executionTime: number): MasterCrudErrorResponse {
    return {
      api_version: 'v2',
      success: false,
      error: 'VALIDATION_FAILED',
      errors: [{
        code: 'VALIDATION_FAILED',
        message: error.message || 'Validation failed',
        details: error.details,
        operation
      }],
      performance: {
        executionTimeMs: executionTime,
        failedAt: 'validation'
      }
    }
  }

  private handleNetworkError(error: any, operation: string, executionTime: number): MasterCrudErrorResponse {
    return {
      api_version: 'v2',
      success: false,
      error: 'NETWORK_ERROR',
      errors: [{
        code: 'NETWORK_ERROR',
        message: `Network operation failed: ${error.message}`,
        details: { code: error.code, operation },
        operation
      }],
      performance: {
        executionTimeMs: executionTime,
        failedAt: 'network_operation'
      }
    }
  }

  private handleUnknownError(error: any, operation: string, executionTime: number): MasterCrudErrorResponse {
    return {
      api_version: 'v2',
      success: false,
      error: 'INTERNAL_ERROR',
      errors: [{
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: { 
          errorType: error.constructor.name,
          operation,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        operation
      }],
      performance: {
        executionTimeMs: executionTime,
        failedAt: 'unknown'
      }
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  private isValidDate(date: any): boolean {
    if (!date) return false
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): { 
    errorCounts: Map<string, number>
    lastErrors: Map<string, Date>
    totalErrors: number
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)
    
    return {
      errorCounts: new Map(this.errorCounts),
      lastErrors: new Map(this.lastErrors),
      totalErrors
    }
  }

  /**
   * Reset error tracking (useful for tests)
   */
  resetErrorTracking(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
  }
}

// Export singleton instance
export const errorHandler = MasterCrudErrorHandler.getInstance()