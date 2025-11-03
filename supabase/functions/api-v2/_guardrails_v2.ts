/**
 * HERA API v2 - Enhanced Guardrails System v2.0
 * Smart Code: HERA.API.V2.GUARDRAILS.ENHANCED.v2
 * 
 * Tightened validation rules with comprehensive business logic enforcement
 * Enhanced Smart Code validation, GL balance checking, and security rules
 */

export interface GuardrailValidationResult {
  isValid: boolean
  violations: string[]
  warnings: string[]
  metadata: {
    validationTime: number
    rulesChecked: number
    securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
}

export interface GuardrailContext {
  orgId: string
  actorUserEntityId: string
  operation: string
  endpoint: string
  payload: any
  headers: Record<string, string>
  timestamp: number
}

/**
 * Enhanced Guardrails Engine v2.0
 */
export class GuardrailsEngineV2 {
  private readonly SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
  private readonly ORGANIZATION_PLATFORM_ID = '00000000-0000-0000-0000-000000000000'
  
  // Enhanced validation rules
  private validationRules: Array<{
    name: string
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    validator: (ctx: GuardrailContext) => { isValid: boolean; violations: string[]; warnings: string[] }
  }>

  constructor() {
    this.validationRules = [
      // CRITICAL SECURITY RULES
      {
        name: 'Organization Boundary Enforcement',
        level: 'CRITICAL',
        validator: this.validateOrganizationBoundary.bind(this)
      },
      {
        name: 'Actor Authentication Validation',
        level: 'CRITICAL',
        validator: this.validateActorAuthentication.bind(this)
      },
      {
        name: 'Platform Organization Protection',
        level: 'CRITICAL',
        validator: this.validatePlatformOrganizationProtection.bind(this)
      },

      // HIGH BUSINESS RULES
      {
        name: 'Smart Code Validation',
        level: 'HIGH',
        validator: this.validateSmartCode.bind(this)
      },
      {
        name: 'GL Balance Enforcement',
        level: 'HIGH',
        validator: this.validateGLBalance.bind(this)
      },
      {
        name: 'Transaction Integrity',
        level: 'HIGH',
        validator: this.validateTransactionIntegrity.bind(this)
      },
      {
        name: 'Entity Relationship Validation',
        level: 'HIGH',
        validator: this.validateEntityRelationships.bind(this)
      },

      // MEDIUM VALIDATION RULES
      {
        name: 'Payload Structure Validation',
        level: 'MEDIUM',
        validator: this.validatePayloadStructure.bind(this)
      },
      {
        name: 'Business Logic Validation',
        level: 'MEDIUM',
        validator: this.validateBusinessLogic.bind(this)
      },
      {
        name: 'Data Type Validation',
        level: 'MEDIUM',
        validator: this.validateDataTypes.bind(this)
      },

      // LOW QUALITY RULES
      {
        name: 'Field Format Validation',
        level: 'LOW',
        validator: this.validateFieldFormats.bind(this)
      },
      {
        name: 'Performance Guidelines',
        level: 'LOW',
        validator: this.validatePerformanceGuidelines.bind(this)
      }
    ]
  }

  /**
   * Main validation entry point
   */
  async validateRequest(ctx: GuardrailContext): Promise<GuardrailValidationResult> {
    const startTime = performance.now()
    let allViolations: string[] = []
    let allWarnings: string[] = []
    let rulesChecked = 0
    let highestSecurityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'

    // Run all validation rules
    for (const rule of this.validationRules) {
      try {
        const result = rule.validator(ctx)
        rulesChecked++

        if (result.violations.length > 0) {
          allViolations.push(...result.violations.map(v => `[${rule.name}] ${v}`))
        }

        if (result.warnings.length > 0) {
          allWarnings.push(...result.warnings.map(w => `[${rule.name}] ${w}`))
        }

        // Track highest security level
        if (this.getSecurityLevelPriority(rule.level) > this.getSecurityLevelPriority(highestSecurityLevel)) {
          highestSecurityLevel = rule.level
        }

      } catch (error) {
        allViolations.push(`[${rule.name}] Validation error: ${(error as Error).message}`)
        rulesChecked++
      }
    }

    const validationTime = performance.now() - startTime

    return {
      isValid: allViolations.length === 0,
      violations: allViolations,
      warnings: allWarnings,
      metadata: {
        validationTime,
        rulesChecked,
        securityLevel: highestSecurityLevel
      }
    }
  }

  /**
   * CRITICAL: Organization boundary enforcement
   */
  private validateOrganizationBoundary(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Ensure organization_id is present in payload
    if (!ctx.payload?.organization_id) {
      violations.push('organization_id is required in all requests')
    }

    // Ensure organization_id matches context
    if (ctx.payload?.organization_id && ctx.payload.organization_id !== ctx.orgId) {
      violations.push(`organization_id mismatch: payload(${ctx.payload.organization_id}) vs context(${ctx.orgId})`)
    }

    // Check for cross-organization data leakage attempts
    if (ctx.payload?.entity_data?.organization_id && ctx.payload.entity_data.organization_id !== ctx.orgId) {
      violations.push('Cross-organization entity reference detected')
    }

    // Validate relationship organization boundaries
    if (ctx.payload?.relationships) {
      for (const rel of ctx.payload.relationships) {
        if (rel.organization_id && rel.organization_id !== ctx.orgId) {
          violations.push('Cross-organization relationship detected')
        }
      }
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * CRITICAL: Actor authentication validation
   */
  private validateActorAuthentication(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Validate actor UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(ctx.actorUserEntityId)) {
      violations.push('Invalid actor user entity ID format')
    }

    // Validate organization UUID format
    if (!uuidRegex.test(ctx.orgId)) {
      violations.push('Invalid organization ID format')
    }

    // Check for null UUID attempts (security attack)
    if (ctx.actorUserEntityId === '00000000-0000-0000-0000-000000000000') {
      violations.push('Null UUID actor not allowed')
    }

    if (ctx.orgId === '00000000-0000-0000-0000-000000000000' && 
        !this.isSystemOperation(ctx.operation)) {
      violations.push('Platform organization access restricted to system operations')
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * CRITICAL: Platform organization protection
   */
  private validatePlatformOrganizationProtection(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Platform organization can only be accessed by system operations
    if (ctx.orgId === this.ORGANIZATION_PLATFORM_ID) {
      if (!this.isSystemOperation(ctx.operation)) {
        violations.push('Platform organization access restricted to system operations')
      }

      // Additional checks for platform organization
      if (ctx.payload?.entity_type !== 'USER' && ctx.operation === 'CREATE') {
        violations.push('Platform organization can only create USER entities')
      }
    }

    // Prevent creation of entities in platform organization via business operations
    if (ctx.payload?.organization_id === this.ORGANIZATION_PLATFORM_ID && 
        !this.isSystemOperation(ctx.operation)) {
      violations.push('Cannot create business entities in platform organization')
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * HIGH: Enhanced Smart Code validation
   */
  private validateSmartCode(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Check main smart code
    if (ctx.payload?.smart_code) {
      if (!this.SMART_CODE_REGEX.test(ctx.payload.smart_code)) {
        violations.push(`Invalid smart code format: ${ctx.payload.smart_code}`)
      } else {
        // Validate HERA DNA structure
        const parts = ctx.payload.smart_code.split('.')
        if (parts[0] !== 'HERA') {
          violations.push('Smart code must start with HERA')
        }
        if (!parts[parts.length - 1].startsWith('v')) {
          violations.push('Smart code must end with version (v1, v2, etc.)')
        }
      }
    }

    // Check entity smart codes
    if (ctx.payload?.entity_data?.smart_code) {
      if (!this.SMART_CODE_REGEX.test(ctx.payload.entity_data.smart_code)) {
        violations.push(`Invalid entity smart code: ${ctx.payload.entity_data.smart_code}`)
      }
    }

    // Check dynamic fields smart codes
    if (ctx.payload?.dynamic_fields) {
      for (const field of ctx.payload.dynamic_fields) {
        if (field.smart_code && !this.SMART_CODE_REGEX.test(field.smart_code)) {
          violations.push(`Invalid dynamic field smart code: ${field.smart_code}`)
        }
      }
    }

    // Check transaction lines smart codes
    if (ctx.payload?.lines) {
      for (const line of ctx.payload.lines) {
        if (line.smart_code && !this.SMART_CODE_REGEX.test(line.smart_code)) {
          violations.push(`Invalid transaction line smart code: ${line.smart_code}`)
        }
      }
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * HIGH: Enhanced GL balance validation
   */
  private validateGLBalance(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    if (!ctx.payload?.lines || !Array.isArray(ctx.payload.lines)) {
      return { isValid: true, violations, warnings }
    }

    // Extract GL lines only
    const glLines = ctx.payload.lines.filter((line: any) => 
      line.smart_code && line.smart_code.includes('.GL.')
    )

    if (glLines.length === 0) {
      return { isValid: true, violations, warnings }
    }

    // Group by currency for balance checking
    const currencyTotals = new Map<string, { dr: number; cr: number; lines: number }>()

    for (const line of glLines) {
      const currency = line.transaction_currency_code || line.currency || 'DOC'
      const side = line.line_data?.side
      const amount = Number(line.line_amount || 0)

      // Validate required GL fields
      if (!side || !['DR', 'CR'].includes(side)) {
        violations.push(`GL line missing or invalid side: ${side}`)
        continue
      }

      if (amount < 0) {
        violations.push(`GL line amount cannot be negative: ${amount}`)
        continue
      }

      if (amount === 0) {
        warnings.push(`GL line has zero amount`)
      }

      // Accumulate totals
      const totals = currencyTotals.get(currency) || { dr: 0, cr: 0, lines: 0 }
      
      if (side === 'DR') {
        totals.dr += amount
      } else {
        totals.cr += amount
      }
      totals.lines += 1
      
      currencyTotals.set(currency, totals)
    }

    // Check balance for each currency
    for (const [currency, totals] of currencyTotals) {
      const difference = Math.abs(totals.dr - totals.cr)
      
      if (difference > 0.01) { // Allow for floating point precision
        violations.push(`GL not balanced for ${currency}: DR=${totals.dr}, CR=${totals.cr}, Diff=${difference}`)
      }

      if (totals.lines < 2) {
        warnings.push(`GL transaction for ${currency} has only ${totals.lines} line(s)`)
      }
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * HIGH: Transaction integrity validation
   */
  private validateTransactionIntegrity(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    if (!ctx.endpoint.includes('/transactions')) {
      return { isValid: true, violations, warnings }
    }

    const transaction = ctx.payload?.transaction_data || ctx.payload

    // Validate transaction number format
    if (transaction?.transaction_number) {
      if (typeof transaction.transaction_number !== 'string' || transaction.transaction_number.length < 3) {
        violations.push('Transaction number must be a string with at least 3 characters')
      }
    }

    // Validate transaction type
    if (!transaction?.transaction_type) {
      violations.push('Transaction type is required')
    }

    // Validate amounts consistency
    if (transaction?.total_amount !== undefined) {
      const totalAmount = Number(transaction.total_amount)
      if (isNaN(totalAmount) || totalAmount < 0) {
        violations.push('Total amount must be a non-negative number')
      }

      // Check if total matches line amounts
      if (ctx.payload?.lines && Array.isArray(ctx.payload.lines)) {
        const lineTotal = ctx.payload.lines
          .filter((line: any) => !line.smart_code?.includes('.GL.'))
          .reduce((sum: number, line: any) => sum + (Number(line.line_amount) || 0), 0)
        
        if (Math.abs(totalAmount - lineTotal) > 0.01) {
          violations.push(`Total amount (${totalAmount}) does not match line total (${lineTotal})`)
        }
      }
    }

    // Validate source/target entities
    if (transaction?.source_entity_id && transaction?.target_entity_id && 
        transaction.source_entity_id === transaction.target_entity_id) {
      warnings.push('Transaction source and target entities are the same')
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * HIGH: Entity relationship validation
   */
  private validateEntityRelationships(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    if (!ctx.payload?.relationships || !Array.isArray(ctx.payload.relationships)) {
      return { isValid: true, violations, warnings }
    }

    for (const rel of ctx.payload.relationships) {
      // Validate required fields
      if (!rel.source_entity_id) {
        violations.push('Relationship missing source_entity_id')
      }
      if (!rel.target_entity_id) {
        violations.push('Relationship missing target_entity_id')
      }
      if (!rel.relationship_type) {
        violations.push('Relationship missing relationship_type')
      }

      // Validate relationship type format
      if (rel.relationship_type && typeof rel.relationship_type === 'string') {
        const validTypes = ['HAS_STATUS', 'PARENT_OF', 'MEMBER_OF', 'CUSTOMER_OF', 'SUPPLIER_OF', 'OWNS', 'ASSIGNED_TO']
        if (!validTypes.includes(rel.relationship_type)) {
          warnings.push(`Non-standard relationship type: ${rel.relationship_type}`)
        }
      }

      // Validate self-reference
      if (rel.source_entity_id === rel.target_entity_id) {
        warnings.push('Self-referencing relationship detected')
      }

      // Validate organization consistency
      if (rel.organization_id && rel.organization_id !== ctx.orgId) {
        violations.push('Relationship organization_id must match context organization')
      }
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * MEDIUM: Payload structure validation
   */
  private validatePayloadStructure(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Check for required operation field
    if (!ctx.operation) {
      violations.push('Operation field is required')
    }

    // Validate operation values
    const validOperations = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REVERSE', 'UPSERT']
    if (ctx.operation && !validOperations.includes(ctx.operation.toUpperCase())) {
      violations.push(`Invalid operation: ${ctx.operation}`)
    }

    // Check payload size
    const payloadSize = JSON.stringify(ctx.payload).length
    if (payloadSize > 1000000) { // 1MB limit
      violations.push(`Payload too large: ${payloadSize} bytes (max 1MB)`)
    }

    // Check for circular references
    try {
      JSON.stringify(ctx.payload)
    } catch (error) {
      violations.push('Payload contains circular references')
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * MEDIUM: Business logic validation
   */
  private validateBusinessLogic(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Entity-specific validations
    if (ctx.payload?.entity_type) {
      const entityType = ctx.payload.entity_type.toLowerCase()

      switch (entityType) {
        case 'customer':
          if (!ctx.payload.entity_name) {
            violations.push('Customer entities require entity_name')
          }
          break

        case 'gl_account':
          if (!ctx.payload.entity_code) {
            violations.push('GL account entities require entity_code')
          }
          break

        case 'product':
          if (ctx.payload.dynamic_fields) {
            const hasPrice = ctx.payload.dynamic_fields.some((f: any) => f.field_name === 'price')
            if (!hasPrice) {
              warnings.push('Product entities should have a price field')
            }
          }
          break
      }
    }

    // Financial operation validations
    if (ctx.endpoint.includes('/transactions') && ctx.operation === 'CREATE') {
      if (!ctx.payload?.transaction_type) {
        violations.push('Financial transactions require transaction_type')
      }

      const financeTypes = ['sale', 'purchase', 'payment', 'receipt', 'journal_entry']
      if (ctx.payload?.transaction_type && 
          !financeTypes.includes(ctx.payload.transaction_type.toLowerCase())) {
        warnings.push(`Non-standard transaction type: ${ctx.payload.transaction_type}`)
      }
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * MEDIUM: Data type validation
   */
  private validateDataTypes(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Validate dynamic fields data types
    if (ctx.payload?.dynamic_fields) {
      for (const field of ctx.payload.dynamic_fields) {
        if (!field.field_type) {
          violations.push(`Dynamic field ${field.field_name} missing field_type`)
          continue
        }

        switch (field.field_type) {
          case 'number':
            if (field.field_value_number !== undefined && isNaN(Number(field.field_value_number))) {
              violations.push(`Invalid number value for field ${field.field_name}`)
            }
            break

          case 'boolean':
            if (field.field_value_boolean !== undefined && typeof field.field_value_boolean !== 'boolean') {
              violations.push(`Invalid boolean value for field ${field.field_name}`)
            }
            break

          case 'date':
            if (field.field_value_date && !this.isValidDate(field.field_value_date)) {
              violations.push(`Invalid date value for field ${field.field_name}`)
            }
            break

          case 'email':
            if (field.field_value && !this.isValidEmail(field.field_value)) {
              violations.push(`Invalid email format for field ${field.field_name}`)
            }
            break
        }
      }
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * LOW: Field format validation
   */
  private validateFieldFormats(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Email format validation
    if (ctx.payload?.email && !this.isValidEmail(ctx.payload.email)) {
      violations.push('Invalid email format')
    }

    // Phone format validation
    if (ctx.payload?.phone && ctx.payload.phone.length < 10) {
      warnings.push('Phone number seems too short')
    }

    // Currency code validation
    if (ctx.payload?.currency && ctx.payload.currency.length !== 3) {
      warnings.push('Currency code should be 3 characters (ISO 4217)')
    }

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * LOW: Performance guidelines validation
   */
  private validatePerformanceGuidelines(ctx: GuardrailContext): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = []
    const warnings: string[] = []

    // Check for excessive array sizes
    if (ctx.payload?.lines && ctx.payload.lines.length > 1000) {
      warnings.push(`Large transaction with ${ctx.payload.lines.length} lines may impact performance`)
    }

    if (ctx.payload?.dynamic_fields && ctx.payload.dynamic_fields.length > 100) {
      warnings.push(`Entity with ${ctx.payload.dynamic_fields.length} dynamic fields may impact performance`)
    }

    // Check for excessive text content
    const checkTextLength = (obj: any, path: string = '') => {
      if (typeof obj === 'string' && obj.length > 10000) {
        warnings.push(`Large text field at ${path}: ${obj.length} characters`)
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          checkTextLength(value, path ? `${path}.${key}` : key)
        }
      }
    }

    checkTextLength(ctx.payload)

    return { isValid: violations.length === 0, violations, warnings }
  }

  /**
   * Helper methods
   */
  private isSystemOperation(operation: string): boolean {
    const systemOps = ['SYSTEM_CREATE', 'SYSTEM_UPDATE', 'RESOLVE_IDENTITY', 'AUTHENTICATE']
    return systemOps.includes(operation.toUpperCase())
  }

  private getSecurityLevelPriority(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): number {
    const priorities = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    return priorities[level]
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Get guardrails statistics
   */
  getGuardrailsStats(): {
    totalRules: number
    rulesByLevel: Record<string, number>
    smartCodeRegex: string
  } {
    const rulesByLevel: Record<string, number> = {}
    
    for (const rule of this.validationRules) {
      rulesByLevel[rule.level] = (rulesByLevel[rule.level] || 0) + 1
    }

    return {
      totalRules: this.validationRules.length,
      rulesByLevel,
      smartCodeRegex: this.SMART_CODE_REGEX.source
    }
  }

  /**
   * Test guardrails system functionality
   */
  async testGuardrails(): Promise<{ success: boolean; results: any[] }> {
    const results = []
    let allSuccess = true

    try {
      // Test 1: Smart Code Validation
      const validSmartCode = 'HERA.FINANCE.TXN.SALE.v1'
      const invalidSmartCode = 'invalid-code'
      
      const smartCodeTest = this.SMART_CODE_REGEX.test(validSmartCode) && !this.SMART_CODE_REGEX.test(invalidSmartCode)
      results.push({
        test: 'Smart Code Validation',
        success: smartCodeTest,
        details: smartCodeTest ? 'Regex working correctly' : 'Smart code regex failed'
      })
      allSuccess = allSuccess && smartCodeTest

      // Test 2: Full Validation
      const testContext: GuardrailContext = {
        orgId: 'test-org-123',
        actorUserEntityId: 'test-actor-123',
        operation: 'CREATE',
        endpoint: '/entities',
        payload: {
          organization_id: 'test-org-123',
          entity_type: 'customer',
          smart_code: validSmartCode
        },
        headers: {},
        timestamp: Date.now()
      }

      const validationResult = await this.validateRequest(testContext)
      results.push({
        test: 'Full Validation',
        success: validationResult.isValid,
        details: validationResult.isValid ? 
          `${validationResult.metadata.rulesChecked} rules passed` : 
          `Violations: ${validationResult.violations.join(', ')}`
      })
      allSuccess = allSuccess && validationResult.isValid

      // Test 3: GL Balance Validation
      const glTestContext: GuardrailContext = {
        ...testContext,
        endpoint: '/transactions',
        payload: {
          organization_id: 'test-org-123',
          lines: [
            {
              smart_code: 'HERA.FINANCE.GL.ASSET.CASH.v1',
              line_amount: 100,
              line_data: { side: 'DR' },
              transaction_currency_code: 'USD'
            },
            {
              smart_code: 'HERA.FINANCE.GL.REVENUE.SALES.v1',
              line_amount: 100,
              line_data: { side: 'CR' },
              transaction_currency_code: 'USD'
            }
          ]
        }
      }

      const glValidation = await this.validateRequest(glTestContext)
      const glSuccess = glValidation.isValid
      results.push({
        test: 'GL Balance Validation',
        success: glSuccess,
        details: glSuccess ? 'GL balance validation passed' : 'GL balance validation failed'
      })
      allSuccess = allSuccess && glSuccess

      // Test 4: Security Rules
      const securityTestContext: GuardrailContext = {
        ...testContext,
        payload: {
          organization_id: 'different-org-123', // Mismatched org
          entity_type: 'customer'
        }
      }

      const securityValidation = await this.validateRequest(securityTestContext)
      const securitySuccess = !securityValidation.isValid // Should fail due to org mismatch
      results.push({
        test: 'Security Rules',
        success: securitySuccess,
        details: securitySuccess ? 'Security violations detected correctly' : 'Security rules failed'
      })
      allSuccess = allSuccess && securitySuccess

    } catch (error) {
      results.push({
        test: 'System Test',
        success: false,
        details: `Error: ${(error as Error).message}`
      })
      allSuccess = false
    }

    return { success: allSuccess, results }
  }
}

/**
 * Singleton instance for Edge Function usage
 */
export const guardrailsEngine = new GuardrailsEngineV2()

/**
 * Helper function for Edge Function integration
 */
export async function validateRequestPayload(
  orgId: string,
  actorUserEntityId: string,
  operation: string,
  endpoint: string,
  payload: any,
  headers: Record<string, string> = {}
): Promise<{ isValid: boolean; response?: Response; result: GuardrailValidationResult }> {
  const context: GuardrailContext = {
    orgId,
    actorUserEntityId,
    operation,
    endpoint,
    payload,
    headers,
    timestamp: Date.now()
  }

  const result = await guardrailsEngine.validateRequest(context)

  if (!result.isValid) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: 'guardrail_violations',
          message: 'Request failed validation checks',
          violations: result.violations,
          warnings: result.warnings,
          metadata: result.metadata
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Validation-Time': result.metadata.validationTime.toFixed(2),
            'X-Rules-Checked': result.metadata.rulesChecked.toString(),
            'X-Security-Level': result.metadata.securityLevel
          }
        }
      ),
      result
    }
  }

  return {
    isValid: true,
    result
  }
}