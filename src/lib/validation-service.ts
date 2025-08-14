/**
 * Production Security & Validation Service
 * Comprehensive input validation and sanitization
 */

import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any,
    public readonly code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ValidationService {
  private smartCodePattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/
  private referenceNumberPattern = /^[A-Z0-9\-_]{3,50}$/
  private accountCodePattern = /^\d{7}$/

  /**
   * Validate Smart Code format
   */
  isValidSmartCode(smartCode: string): boolean {
    if (!smartCode || typeof smartCode !== 'string') {
      return false
    }
    return this.smartCodePattern.test(smartCode.trim())
  }

  /**
   * Validate reference number format
   */
  isValidReferenceNumber(refNumber: string): boolean {
    if (!refNumber || typeof refNumber !== 'string') {
      return false
    }
    return this.referenceNumberPattern.test(refNumber.trim())
  }

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false
    }
    return validator.isUUID(uuid.trim())
  }

  /**
   * Validate account code format (7-digit)
   */
  isValidAccountCode(accountCode: string): boolean {
    if (!accountCode || typeof accountCode !== 'string') {
      return false
    }
    return this.accountCodePattern.test(accountCode.trim())
  }

  /**
   * Validate transaction amount
   */
  validateTransactionAmount(amount: any): number {
    if (amount === null || amount === undefined) {
      throw new ValidationError('Amount is required', 'amount', amount)
    }

    const numAmount = Number(amount)
    
    if (isNaN(numAmount)) {
      throw new ValidationError('Amount must be a valid number', 'amount', amount)
    }

    if (numAmount <= 0) {
      throw new ValidationError('Amount must be positive', 'amount', amount)
    }

    if (numAmount > 1000000000) { // 1 billion limit
      throw new ValidationError('Amount exceeds maximum limit', 'amount', amount)
    }

    // Check for reasonable decimal places (max 2)
    if (!Number.isInteger(numAmount * 100)) {
      throw new ValidationError('Amount can have maximum 2 decimal places', 'amount', amount)
    }

    return numAmount
  }

  /**
   * Validate and sanitize transaction metadata
   */
  validateTransactionMetadata(metadata: any): Record<string, any> {
    if (!metadata) {
      return {}
    }

    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new ValidationError('Metadata must be an object', 'metadata', metadata)
    }

    // Check size limit (prevent DoS)
    const metadataString = JSON.stringify(metadata)
    if (metadataString.length > 10000) { // 10KB limit
      throw new ValidationError('Metadata size exceeds limit', 'metadata', metadata)
    }

    return this.sanitizeJsonObject(metadata)
  }

  /**
   * Validate Smart Code against transaction metadata
   */
  validateSmartCodeMetadataConsistency(
    smartCode: string, 
    metadata: Record<string, any>
  ): void {
    const codeParts = smartCode.split('.')
    if (codeParts.length < 4) return

    const module = codeParts[1]
    const subModule = codeParts[2]

    // Validate required fields based on Smart Code
    switch (module) {
      case 'PROC': // Procurement
        if (subModule === 'GR') {
          this.validateRequiredFields(metadata, ['vendor_id', 'po_number'], 'procurement')
        }
        break

      case 'SALES': // Sales
        if (subModule === 'INV') {
          this.validateRequiredFields(metadata, ['customer_id'], 'sales')
        }
        break

      case 'HR': // Human Resources
        if (subModule === 'PAYROLL') {
          this.validateRequiredFields(metadata, ['pay_period', 'employee_count'], 'payroll')
        }
        break

      case 'INV': // Inventory
        if (subModule === 'ADJ') {
          this.validateRequiredFields(metadata, ['adjustment_type', 'reason'], 'inventory')
        }
        break
    }
  }

  /**
   * Sanitize JSON object recursively
   */
  sanitizeJsonObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const cleanKey = this.sanitizeString(key)
      
      if (value === null || value === undefined) {
        sanitized[cleanKey] = value
      } else if (typeof value === 'string') {
        sanitized[cleanKey] = this.sanitizeString(value)
      } else if (typeof value === 'number') {
        sanitized[cleanKey] = this.sanitizeNumber(value)
      } else if (typeof value === 'boolean') {
        sanitized[cleanKey] = value
      } else if (Array.isArray(value)) {
        sanitized[cleanKey] = value.map(item => 
          typeof item === 'object' ? this.sanitizeJsonObject(item) : this.sanitizeString(String(item))
        )
      } else if (typeof value === 'object') {
        sanitized[cleanKey] = this.sanitizeJsonObject(value)
      } else {
        // Convert other types to string and sanitize
        sanitized[cleanKey] = this.sanitizeString(String(value))
      }
    }

    return sanitized
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    // Remove null bytes and control characters
    let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Trim whitespace
    cleaned = cleaned.trim()
    
    // Limit length
    if (cleaned.length > 1000) {
      cleaned = cleaned.substring(0, 1000)
    }

    // Sanitize HTML/XML
    cleaned = DOMPurify.sanitize(cleaned, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })

    // Additional SQL injection protection
    cleaned = cleaned.replace(/['";\\]/g, '')

    return cleaned
  }

  /**
   * Sanitize numeric input
   */
  sanitizeNumber(input: number): number {
    if (typeof input !== 'number' || isNaN(input)) {
      return 0
    }

    // Check for infinity
    if (!isFinite(input)) {
      return 0
    }

    return input
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(
    data: Record<string, any>, 
    requiredFields: string[],
    context: string
  ): void {
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
        throw new ValidationError(
          `Required field '${field}' is missing for ${context} transaction`,
          field,
          data[field],
          'MISSING_REQUIRED_FIELD'
        )
      }
    }
  }

  /**
   * Validate organization access
   */
  async validateOrganizationAccess(
    userId: string, 
    organizationId: string
  ): Promise<boolean> {
    try {
      // This would typically check against your auth system
      // For now, implement basic UUID validation
      if (!this.isValidUUID(userId) || !this.isValidUUID(organizationId)) {
        return false
      }

      // TODO: Implement actual org access check
      // const hasAccess = await this.authService.checkOrganizationAccess(userId, organizationId)
      // return hasAccess

      return true // Placeholder
    } catch (error) {
      console.error('Organization access validation error:', error)
      return false
    }
  }

  /**
   * Validate API key format and permissions
   */
  async validateApiKey(
    apiKey: string, 
    requiredPermissions: string[] = []
  ): Promise<{ valid: boolean; permissions: string[] }> {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        return { valid: false, permissions: [] }
      }

      // Basic format validation (adjust based on your API key format)
      if (apiKey.length < 32 || !apiKey.startsWith('hera_')) {
        return { valid: false, permissions: [] }
      }

      // TODO: Implement actual API key validation
      // const keyInfo = await this.authService.validateApiKey(apiKey)
      // const hasRequiredPermissions = requiredPermissions.every(
      //   perm => keyInfo.permissions.includes(perm)
      // )

      return { 
        valid: true, 
        permissions: ['transaction:create', 'ai:classify'] // Placeholder
      }
    } catch (error) {
      console.error('API key validation error:', error)
      return { valid: false, permissions: [] }
    }
  }

  /**
   * Rate limiting validation
   */
  validateRateLimit(
    identifier: string,
    action: string,
    limits: { requests: number; windowMs: number }
  ): { allowed: boolean; retryAfter?: number } {
    // This would typically integrate with your rate limiting service
    // For now, return basic validation
    
    if (!identifier || !action) {
      return { allowed: false }
    }

    // TODO: Implement actual rate limiting logic
    // const usage = await this.rateLimiter.getUsage(identifier, action)
    // if (usage.requests >= limits.requests) {
    //   return { allowed: false, retryAfter: usage.resetTime }
    // }

    return { allowed: true }
  }

  /**
   * Batch validation for multiple items
   */
  validateBatch<T>(
    items: T[],
    validator: (item: T, index: number) => void,
    maxBatchSize: number = 100
  ): void {
    if (!Array.isArray(items)) {
      throw new ValidationError('Batch data must be an array', 'batch', items)
    }

    if (items.length === 0) {
      throw new ValidationError('Batch cannot be empty', 'batch', items)
    }

    if (items.length > maxBatchSize) {
      throw new ValidationError(
        `Batch size exceeds maximum of ${maxBatchSize}`,
        'batch',
        items.length
      )
    }

    const errors: Array<{ index: number; error: Error }> = []

    items.forEach((item, index) => {
      try {
        validator(item, index)
      } catch (error) {
        errors.push({ index, error: error as Error })
      }
    })

    if (errors.length > 0) {
      const errorMessage = `Validation failed for ${errors.length} items: ${
        errors.map(e => `[${e.index}] ${e.error.message}`).join(', ')
      }`
      throw new ValidationError(errorMessage, 'batch', errors)
    }
  }
}

export default ValidationService