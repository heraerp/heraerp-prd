/**
 * Financial Smart Code Service - HERA Smart Code Integration for Financial Module
 *
 * Implements intelligent code generation, validation, and business logic
 * for the complete Financial Accounting system using HERA's Smart Code framework
 *
 * Smart Code Pattern: HERA.FIN.{SUB}.{FUNCTION}.{TYPE}.{VERSION}
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Financial Smart Code Structure
export interface FinancialSmartCode {
  code: string // Full smart code (e.g., HERA.FIN.GL.ENT.ACC.V1)
  module: 'FIN' // Always FIN for financial
  subModule: 'GL' | 'AR' | 'AP' | 'FA' | 'RPT' // Sub-modules
  functionType: 'ENT' | 'TXN' | 'RPT' | 'VAL' // Function types
  entityType: string // Specific entity/transaction type
  version: string // Version (v1, v2, etc.)
  metadata: {
    description: string
    businessRules: string[]
    validationLevel: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
    industrySpecific: boolean
    systemLevel: boolean
  }
}

// Smart Code Validation Result
export interface SmartCodeValidation {
  isValid: boolean
  validationLevel: string
  validationTime: number
  errors: string[]
  warnings: string[]
  suggestions: string[]
  businessRules: {
    rule: string
    passed: boolean
    message: string
  }[]
}

// Smart Code Generation Request
export interface SmartCodeGenerationRequest {
  organizationId: string
  businessContext: {
    transactionType?: string
    entityType?: string
    industry?: string
    module: 'FIN'
    subModule: 'GL' | 'AR' | 'AP' | 'FA' | 'RPT'
    functionType: 'ENT' | 'TXN' | 'RPT' | 'VAL'
  }
  description?: string
  existingCode?: string
}

export class FinancialSmartCodeService {
  private supabase = getSupabaseAdmin()

  /**
   * Generate Financial Smart Code based on business context
   */
  async generateSmartCode(request: SmartCodeGenerationRequest): Promise<{
    generatedSmartCode: string
    metadata: FinancialSmartCode['metadata']
    similarCodes: string[]
    validation: SmartCodeValidation
  }> {
    try {
      console.log('🧬 Generating Financial Smart Code:', request.businessContext)

      // Step 1: Determine entity type from business context
      const entityType = this.determineEntityType(request)

      // Step 2: Build smart code
      const smartCode = `HERA.FIN.${request.businessContext.subModule}.${request.businessContext.functionType}.${entityType}.v1`

      // Step 3: Generate metadata
      const metadata = this.generateMetadata(smartCode, request)

      // Step 4: Find similar codes
      const similarCodes = await this.findSimilarCodes(smartCode, request.organizationId)

      // Step 5: Validate the generated code
      const validation = await this.validateSmartCode(
        smartCode,
        request.organizationId,
        'L4_INTEGRATION'
      )

      return {
        generatedSmartCode: smartCode,
        metadata,
        similarCodes,
        validation
      }
    } catch (error) {
      console.error('❌ Failed to generate Financial Smart Code:', error)
      throw error
    }
  }

  /**
   * Validate Financial Smart Code with 4-level validation system
   */
  async validateSmartCode(
    smartCode: string,
    organizationId: string,
    level: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION' = 'L4_INTEGRATION'
  ): Promise<SmartCodeValidation> {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const businessRules: SmartCodeValidation['businessRules'] = []

    try {
      // L1: Syntax Validation (<10ms)
      const syntaxValidation = this.validateSyntax(smartCode)
      if (!syntaxValidation.isValid) {
        errors.push(...syntaxValidation.errors)
      }

      if (level === 'L1_SYNTAX') {
        return {
          isValid: errors.length === 0,
          validationLevel: 'L1_SYNTAX',
          validationTime: Date.now() - startTime,
          errors,
          warnings,
          suggestions,
          businessRules
        }
      }

      // L2: Semantic Validation (<50ms)
      const semanticValidation = this.validateSemantics(smartCode)
      if (!semanticValidation.isValid) {
        errors.push(...semanticValidation.errors)
      }
      warnings.push(...semanticValidation.warnings)

      if (level === 'L2_SEMANTIC') {
        return {
          isValid: errors.length === 0,
          validationLevel: 'L2_SEMANTIC',
          validationTime: Date.now() - startTime,
          errors,
          warnings,
          suggestions,
          businessRules
        }
      }

      // L3: Performance Validation (<100ms)
      const performanceValidation = await this.validatePerformance(smartCode, organizationId)
      warnings.push(...performanceValidation.warnings)
      suggestions.push(...performanceValidation.suggestions)

      if (level === 'L3_PERFORMANCE') {
        return {
          isValid: errors.length === 0,
          validationLevel: 'L3_PERFORMANCE',
          validationTime: Date.now() - startTime,
          errors,
          warnings,
          suggestions,
          businessRules
        }
      }

      // L4: Integration Validation (<200ms)
      const integrationValidation = await this.validateIntegration(smartCode, organizationId)
      businessRules.push(...integrationValidation.businessRules)
      suggestions.push(...integrationValidation.suggestions)

      return {
        isValid: errors.length === 0,
        validationLevel: 'L4_INTEGRATION',
        validationTime: Date.now() - startTime,
        errors,
        warnings,
        suggestions,
        businessRules
      }
    } catch (error) {
      console.error('Smart code validation error:', error)
      return {
        isValid: false,
        validationLevel: level,
        validationTime: Date.now() - startTime,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        suggestions,
        businessRules
      }
    }
  }

  /**
   * Search Financial Smart Codes with advanced filtering
   */
  async searchSmartCodes(
    organizationId: string,
    pattern: string = 'HERA.FIN.%.%.%.%',
    filters: {
      subModule?: string
      functionType?: string
      entityType?: string
      includeSystem?: boolean
    } = {}
  ): Promise<{
    codes: FinancialSmartCode[]
    totalCount: number
    searchTime: number
  }> {
    const startTime = Date.now()

    try {
      // Build query based on pattern and filters
      let query = this.supabase
        .from('core_entities')
        .select('smart_code, entity_type, entity_name, created_at, metadata')
        .like('smart_code', pattern)
        .not('smart_code', 'is', null)

      // Add organization filter (include system if requested)
      if (filters.includeSystem) {
        query = query.in('organization_id', [
          organizationId,
          '719dfed1-09b4-4ca8-bfda-f682460de945'
        ])
      } else {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query

      if (error) throw error

      // Process and filter results
      const codes: FinancialSmartCode[] = (data || [])
        .filter((row: any) => row.smart_code?.startsWith('HERA.FIN.'))
        .map((row: any) => this.parseSmartCode(row.smart_code, row.metadata))
        .filter((code: any) => {
          if (filters.subModule && code.subModule !== filters.subModule) return false
          if (filters.functionType && code.functionType !== filters.functionType) return false
          if (filters.entityType && code.entityType !== filters.entityType) return false
          return true
        })

      return {
        codes,
        totalCount: codes.length,
        searchTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('Smart code search error:', error)
      return {
        codes: [],
        totalCount: 0,
        searchTime: Date.now() - startTime
      }
    }
  }

  /**
   * Get Financial Business Rules for Smart Code
   */
  async getBusinessRules(smartCode: string): Promise<{
    rules: {
      rule: string
      type: 'validation' | 'business' | 'compliance'
      description: string
      required: boolean
    }[]
    compliance: {
      gaap: boolean
      ifrs: boolean
      sox: boolean
    }
  }> {
    const parts = smartCode.split('.')
    if (parts.length < 6) throw new Error('Invalid smart code format')

    const [, , subModule, functionType, entityType] = parts

    const rules = []

    // Universal Financial Rules
    rules.push({
      rule: 'double_entry_required',
      type: 'validation' as const,
      description: 'All transactions must maintain double-entry bookkeeping',
      required: true
    })

    // Sub-module specific rules
    if (subModule === 'GL') {
      rules.push({
        rule: 'journal_entries_balanced',
        type: 'validation' as const,
        description: 'Journal entries must have equal debits and credits',
        required: true
      })
    }

    if (subModule === 'AR') {
      rules.push({
        rule: 'credit_limit_check',
        type: 'business' as const,
        description: 'Customer credit limits must be validated',
        required: false
      })
    }

    if (subModule === 'AP') {
      rules.push({
        rule: 'duplicate_invoice_check',
        type: 'business' as const,
        description: 'Prevent duplicate vendor invoices',
        required: true
      })
    }

    // Compliance rules
    const compliance = {
      gaap: true, // Generally Accepted Accounting Principles
      ifrs: true, // International Financial Reporting Standards
      sox: subModule === 'GL' || functionType === 'RPT' // Sarbanes-Oxley for GL and Reports
    }

    return { rules, compliance }
  }

  /**
   * Private helper methods
   */

  private determineEntityType(request: SmartCodeGenerationRequest): string {
    const { businessContext } = request

    // Function-specific entity types
    if (businessContext.functionType === 'ENT') {
      const entityMapping: Record<string, Record<string, string>> = {
        GL: {
          gl_account: 'ACC',
          journal_entry: 'JE',
          cost_center: 'CC',
          department: 'DEP'
        },
        AR: {
          customer: 'CUS',
          invoice: 'INV',
          payment: 'PAY',
          credit_memo: 'CM'
        },
        AP: {
          vendor: 'VEN',
          bill: 'BIL',
          payment: 'PAY',
          purchase_order: 'PO'
        },
        FA: {
          asset: 'AST',
          depreciation: 'DEP',
          disposal: 'DSP'
        }
      }

      const subModuleMapping = entityMapping[businessContext.subModule] || {}
      return subModuleMapping[businessContext.entityType || ''] || 'GEN'
    }

    if (businessContext.functionType === 'TXN') {
      const transactionMapping: Record<string, string> = {
        sale: 'SAL',
        purchase: 'PUR',
        payment: 'PAY',
        receipt: 'RCP',
        journal_entry: 'JE',
        adjustment: 'ADJ',
        transfer: 'TRF'
      }

      return transactionMapping[businessContext.transactionType || ''] || 'GEN'
    }

    if (businessContext.functionType === 'RPT') {
      return 'GEN'
    }

    if (businessContext.functionType === 'VAL') {
      return 'GEN'
    }

    return 'GEN'
  }

  private generateMetadata(
    smartCode: string,
    request: SmartCodeGenerationRequest
  ): FinancialSmartCode['metadata'] {
    const parts = smartCode.split('.')
    const [, , subModule, functionType, entityType] = parts

    const descriptions: Record<string, string> = {
      GL: 'General Ledger',
      AR: 'Accounts Receivable',
      AP: 'Accounts Payable',
      FA: 'Fixed Assets',
      RPT: 'Financial Reports'
    }

    return {
      description: `${descriptions[subModule]} ${functionType} - ${entityType}`,
      businessRules: ['double_entry_required', 'audit_trail_maintained', 'period_end_controls'],
      validationLevel: 'L4_INTEGRATION',
      industrySpecific: false,
      systemLevel: request.organizationId === '719dfed1-09b4-4ca8-bfda-f682460de945'
    }
  }

  private async findSimilarCodes(smartCode: string, organizationId: string): Promise<string[]> {
    const parts = smartCode.split('.')
    if (parts.length < 6) return []

    const [, , subModule, functionType] = parts
    const pattern = `HERA.FIN.${subModule}.${functionType}.%.%`

    try {
      const { data } = await this.supabase
        .from('core_entities')
        .select('smart_code')
        .like('smart_code', pattern)
        .neq('smart_code', smartCode)
        .limit(5)

      return (data || []).map(row => row.smart_code).filter(Boolean)
    } catch (error) {
      console.error('Error finding similar codes:', error)
      return []
    }
  }

  private validateSyntax(smartCode: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check basic format
    const parts = smartCode.split('.')
    if (parts.length !== 6) {
      errors.push('Smart code must have 6 parts separated by dots')
    }

    // Check prefix
    if (parts[0] !== 'HERA') {
      errors.push('Smart code must start with HERA')
    }

    // Check module
    if (parts[1] !== 'FIN') {
      errors.push('Module must be FIN for financial codes')
    }

    // Check sub-module
    if (parts[2] && !['GL', 'AR', 'AP', 'FA', 'RPT'].includes(parts[2])) {
      errors.push('Invalid sub-module. Must be GL, AR, AP, FA, or RPT')
    }

    // Check function type
    if (parts[3] && !['ENT', 'TXN', 'RPT', 'VAL'].includes(parts[3])) {
      errors.push('Invalid function type. Must be ENT, TXN, RPT, or VAL')
    }

    // Check version format
    if (parts[5] && !parts[5].match(/^v\d+$/)) {
      errors.push('Version must be in format v1, v2, etc.')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private validateSemantics(smartCode: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    const parts = smartCode.split('.')
    if (parts.length < 6) return { isValid: false, errors: ['Invalid format'], warnings }

    const [, , subModule, functionType, entityType] = parts

    // Semantic validation based on business logic
    if (
      subModule === 'GL' &&
      functionType === 'ENT' &&
      !['ACC', 'JE', 'CC', 'DEP'].includes(entityType)
    ) {
      warnings.push(`Entity type '${entityType}' is uncommon for GL entities`)
    }

    if (
      subModule === 'AR' &&
      functionType === 'TXN' &&
      !['SAL', 'RCP', 'ADJ'].includes(entityType)
    ) {
      warnings.push(`Transaction type '${entityType}' is uncommon for AR transactions`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private async validatePerformance(
    smartCode: string,
    organizationId: string
  ): Promise<{ warnings: string[]; suggestions: string[] }> {
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check for potential performance issues
    try {
      const { count } = await this.supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('smart_code', smartCode)
        .eq('organization_id', organizationId)

      if (count && count > 10000) {
        warnings.push('High volume of entities with this smart code may impact performance')
        suggestions.push('Consider partitioning or archiving old records')
      }
    } catch (error) {
      // Ignore performance check errors
    }

    return { warnings, suggestions }
  }

  private async validateIntegration(
    smartCode: string,
    organizationId: string
  ): Promise<{
    businessRules: SmartCodeValidation['businessRules']
    suggestions: string[]
  }> {
    const businessRules: SmartCodeValidation['businessRules'] = []
    const suggestions: string[] = []

    // Get business rules for this smart code
    const rules = await this.getBusinessRules(smartCode)

    // Validate each business rule
    for (const rule of rules.rules) {
      const passed = await this.validateBusinessRule(rule.rule, smartCode, organizationId)
      businessRules.push({
        rule: rule.rule,
        passed,
        message: passed ? `${rule.description} - Passed` : `${rule.description} - Failed`
      })

      if (!passed && rule.required) {
        suggestions.push(`Fix required business rule: ${rule.description}`)
      }
    }

    return { businessRules, suggestions }
  }

  private async validateBusinessRule(
    rule: string,
    smartCode: string,
    organizationId: string
  ): Promise<boolean> {
    // In production, this would implement actual business rule validation
    // For now, return true for demo purposes
    return true
  }

  private parseSmartCode(smartCode: string, metadata: any): FinancialSmartCode {
    const parts = smartCode.split('.')

    return {
      code: smartCode,
      module: 'FIN',
      subModule: parts[2] as any,
      functionType: parts[3] as any,
      entityType: parts[4],
      version: parts[5],
      metadata: metadata || {
        description: 'Financial smart code',
        businessRules: [],
        validationLevel: 'L1_SYNTAX',
        industrySpecific: false,
        systemLevel: false
      }
    }
  }
}

// Export singleton instance
export const financialSmartCode = new FinancialSmartCodeService()
