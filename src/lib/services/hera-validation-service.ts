/**
 * HERA Validation Service
 *
 * Provides validation services for HERA entities, transactions, and other data
 * against registered standards. Uses HERA's own architecture to store and retrieve
 * validation rules.
 */

import { supabase } from '../supabase'
import {
  STANDARD_ENTITY_TYPES,
  STANDARD_TRANSACTION_TYPES,
  STANDARD_RELATIONSHIP_TYPES,
  STANDARD_STATUSES,
  SMART_CODE_PATTERNS,
  validateSmartCode,
  parseSmartCode,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type StandardDefinition
} from '../hera-standards'

export class HeraValidationService {
  private supabase = supabase
  private standards: Map<string, StandardDefinition[]> = new Map()
  private lastCacheUpdate: Date | null = null
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Use the singleton supabase instance
  }

  /**
   * Load standards from database and cache them
   */
  async loadStandards(organizationId: string): Promise<void> {
    const now = new Date()

    // Check if cache is still valid
    if (
      this.lastCacheUpdate &&
      now.getTime() - this.lastCacheUpdate.getTime() < this.cacheTimeout
    ) {
      return
    }

    try {
      // Load all standard definitions from the system organization
      const systemOrgId = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

      const { data: standards, error } = await this.supabase
        .from('core_entities')
        .select(
          `
          id,
          entity_type,
          entity_name,
          entity_code,
          smart_code,
          metadata,
          core_dynamic_data (
            field_name,
            field_value_text,
            field_value_number,
            field_value_boolean
          )
        `
        )
        .in('entity_type', [
          'entity_type_definition',
          'transaction_type_definition',
          'relationship_type_definition',
          'status_definition',
          'smart_code_pattern'
        ])
        .eq('organization_id', systemOrgId)

      if (error) throw error

      // Process and cache the standards
      this.standards.clear()

      for (const standard of standards || []) {
        const category = standard.entity_type
        if (!this.standards.has(category)) {
          this.standards.set(category, [])
        }

        const standardDef: StandardDefinition = {
          code: standard.entity_code || '',
          name: standard.entity_name || '',
          description: this.getDynamicFieldValue(standard.core_dynamic_data, 'description') || '',
          category: category,
          smart_code: standard.smart_code || '',
          metadata: standard.metadata || {}
        }

        this.standards.get(category)!.push(standardDef)
      }

      this.lastCacheUpdate = now
    } catch (error) {
      console.error('Failed to load standards:', error)
      // Fall back to hardcoded standards if database load fails
      this.loadHardcodedStandards()
    }
  }

  /**
   * Load hardcoded standards as fallback
   */
  private loadHardcodedStandards(): void {
    this.standards.clear()

    // Load entity type standards
    const entityTypes = Object.entries(STANDARD_ENTITY_TYPES).map(([key, value]) => ({
      code: value,
      name: this.formatName(key),
      description: `Standard entity type: ${this.formatName(key)}`,
      category: 'entity_type_definition',
      smart_code: `HERA.SYS.STD.ENTITY_TYPE.${key}.v1`
    }))
    this.standards.set('entity_type_definition', entityTypes)

    // Load transaction type standards
    const transactionTypes = Object.entries(STANDARD_TRANSACTION_TYPES).map(([key, value]) => ({
      code: value,
      name: this.formatName(key),
      description: `Standard transaction type: ${this.formatName(key)}`,
      category: 'transaction_type_definition',
      smart_code: `HERA.SYS.STD.TRANSACTION_TYPE.${key}.v1`
    }))
    this.standards.set('transaction_type_definition', transactionTypes)

    // Load relationship type standards
    const relationshipTypes = Object.entries(STANDARD_RELATIONSHIP_TYPES).map(([key, value]) => ({
      code: value,
      name: this.formatName(key),
      description: `Standard relationship type: ${this.formatName(key)}`,
      category: 'relationship_type_definition',
      smart_code: `HERA.SYS.STD.RELATIONSHIP_TYPE.${key}.v1`
    }))
    this.standards.set('relationship_type_definition', relationshipTypes)

    // Load status standards
    const statuses = Object.entries(STANDARD_STATUSES).map(([key, value]) => ({
      code: value,
      name: this.formatName(key),
      description: `Standard status: ${this.formatName(key)}`,
      category: 'status_definition',
      smart_code: `HERA.SYS.STD.STATUS.${key}.v1`
    }))
    this.standards.set('status_definition', statuses)
  }

  /**
   * Format a constant name for display
   */
  private formatName(constantName: string): string {
    return constantName
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Get dynamic field value from array
   */
  private getDynamicFieldValue(
    dynamicData: any[],
    fieldName: string
  ): string | number | boolean | null {
    if (!dynamicData || !Array.isArray(dynamicData)) return null

    const field = dynamicData.find(d => d.field_name === fieldName)
    if (!field) return null

    return field.field_value_text || field.field_value_number || field.field_value_boolean
  }

  /**
   * Validate entity data against standards
   */
  async validateEntity(entityData: {
    entity_type: string
    entity_name: string
    entity_code?: string
    smart_code?: string
    organization_id: string
  }): Promise<ValidationResult> {
    await this.loadStandards(entityData.organization_id)

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate entity type
    const entityTypeStandards = this.standards.get('entity_type_definition') || []
    const isValidEntityType = entityTypeStandards.some(std => std.code === entityData.entity_type)

    if (!isValidEntityType) {
      errors.push({
        field: 'entity_type',
        value: entityData.entity_type,
        message: `Entity type '${entityData.entity_type}' is not a recognized standard type`,
        suggestion: this.suggestSimilar(
          entityData.entity_type,
          entityTypeStandards.map(s => s.code)
        )
      })
    }

    // Validate smart code
    if (entityData.smart_code) {
      if (!validateSmartCode(entityData.smart_code)) {
        errors.push({
          field: 'smart_code',
          value: entityData.smart_code,
          message: `Smart code '${entityData.smart_code}' does not follow the standard pattern HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}`
        })
      } else {
        // Additional smart code validation
        const parsed = parseSmartCode(entityData.smart_code)
        if (parsed) {
          if (!(parsed.industry in SMART_CODE_PATTERNS.INDUSTRIES)) {
            warnings.push({
              field: 'smart_code',
              value: entityData.smart_code,
              message: `Industry code '${parsed.industry}' is not in standard industry list`
            })
          }
          if (!(parsed.module in SMART_CODE_PATTERNS.MODULES)) {
            warnings.push({
              field: 'smart_code',
              value: entityData.smart_code,
              message: `Module code '${parsed.module}' is not in standard module list`
            })
          }
        }
      }
    } else {
      warnings.push({
        field: 'smart_code',
        value: null,
        message: 'Smart code is recommended for all entities to enable intelligent business context'
      })
    }

    // Validate entity name
    if (!entityData.entity_name || entityData.entity_name.trim().length === 0) {
      errors.push({
        field: 'entity_name',
        value: entityData.entity_name,
        message: 'Entity name is required and cannot be empty'
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate transaction data against standards
   */
  async validateTransaction(transactionData: {
    transaction_type: string
    transaction_code?: string
    smart_code?: string
    organization_id: string
    total_amount?: number
  }): Promise<ValidationResult> {
    await this.loadStandards(transactionData.organization_id)

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate transaction type
    const transactionTypeStandards = this.standards.get('transaction_type_definition') || []
    const isValidTransactionType = transactionTypeStandards.some(
      std => std.code === transactionData.transaction_type
    )

    if (!isValidTransactionType) {
      errors.push({
        field: 'transaction_type',
        value: transactionData.transaction_type,
        message: `Transaction type '${transactionData.transaction_type}' is not a recognized standard type`,
        suggestion: this.suggestSimilar(
          transactionData.transaction_type,
          transactionTypeStandards.map(s => s.code)
        )
      })
    }

    // Validate smart code
    if (transactionData.smart_code) {
      if (!validateSmartCode(transactionData.smart_code)) {
        errors.push({
          field: 'smart_code',
          value: transactionData.smart_code,
          message: `Smart code '${transactionData.smart_code}' does not follow the standard pattern`
        })
      }
    } else {
      errors.push({
        field: 'smart_code',
        value: null,
        message:
          'Smart code is required for all transactions to enable auto-journal posting and business intelligence'
      })
    }

    // Validate total amount for financial transactions
    const financialTypes = ['sale', 'purchase', 'payment', 'receipt', 'journal_entry']
    if (financialTypes.includes(transactionData.transaction_type)) {
      if (transactionData.total_amount === undefined || transactionData.total_amount === null) {
        errors.push({
          field: 'total_amount',
          value: transactionData.total_amount,
          message: `Total amount is required for ${transactionData.transaction_type} transactions`
        })
      } else if (transactionData.total_amount <= 0) {
        warnings.push({
          field: 'total_amount',
          value: transactionData.total_amount,
          message: 'Transaction amount is zero or negative - please verify this is correct'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate relationship data against standards
   */
  async validateRelationship(relationshipData: {
    relationship_type: string
    from_entity_id: string
    to_entity_id: string
    organization_id: string
  }): Promise<ValidationResult> {
    await this.loadStandards(relationshipData.organization_id)

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate relationship type
    const relationshipTypeStandards = this.standards.get('relationship_type_definition') || []
    const isValidRelationshipType = relationshipTypeStandards.some(
      std => std.code === relationshipData.relationship_type
    )

    if (!isValidRelationshipType) {
      errors.push({
        field: 'relationship_type',
        value: relationshipData.relationship_type,
        message: `Relationship type '${relationshipData.relationship_type}' is not a recognized standard type`,
        suggestion: this.suggestSimilar(
          relationshipData.relationship_type,
          relationshipTypeStandards.map(s => s.code)
        )
      })
    }

    // Validate entity IDs are not the same (prevent self-references)
    if (relationshipData.from_entity_id === relationshipData.to_entity_id) {
      errors.push({
        field: 'to_entity_id',
        value: relationshipData.to_entity_id,
        message: 'An entity cannot have a relationship with itself'
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get all standards for a category
   */
  async getStandards(category: string, organizationId: string): Promise<StandardDefinition[]> {
    await this.loadStandards(organizationId)
    return this.standards.get(category) || []
  }

  /**
   * Suggest similar values using simple string similarity
   */
  private suggestSimilar(input: string, options: string[]): string | undefined {
    if (!input || options.length === 0) return undefined

    let bestMatch = ''
    let bestScore = 0

    for (const option of options) {
      const score = this.calculateSimilarity(input.toLowerCase(), option.toLowerCase())
      if (score > bestScore && score > 0.3) {
        // Minimum similarity threshold
        bestScore = score
        bestMatch = option
      }
    }

    return bestMatch || undefined
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length)
    if (maxLength === 0) return 1

    const distance = this.levenshteinDistance(str1, str2)
    return (maxLength - distance) / maxLength
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Clear the standards cache
   */
  clearCache(): void {
    this.standards.clear()
    this.lastCacheUpdate = null
  }

  /**
   * Get validation statistics for an organization
   */
  async getValidationStats(organizationId: string): Promise<{
    totalEntities: number
    standardCompliantEntities: number
    totalTransactions: number
    standardCompliantTransactions: number
    compliancePercentage: number
  }> {
    try {
      // Get total entities count
      const { count: totalEntities } = await this.supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      // Get entities with valid entity types
      await this.loadStandards(organizationId)
      const entityTypeStandards = this.standards.get('entity_type_definition') || []
      const validEntityTypes = entityTypeStandards.map(s => s.code)

      const { count: standardCompliantEntities } = await this.supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('entity_type', validEntityTypes)

      // Get total transactions count
      const { count: totalTransactions } = await this.supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      // Get transactions with valid transaction types
      const transactionTypeStandards = this.standards.get('transaction_type_definition') || []
      const validTransactionTypes = transactionTypeStandards.map(s => s.code)

      const { count: standardCompliantTransactions } = await this.supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('transaction_type', validTransactionTypes)

      const totalItems = (totalEntities || 0) + (totalTransactions || 0)
      const compliantItems = (standardCompliantEntities || 0) + (standardCompliantTransactions || 0)
      const compliancePercentage = totalItems > 0 ? (compliantItems / totalItems) * 100 : 100

      return {
        totalEntities: totalEntities || 0,
        standardCompliantEntities: standardCompliantEntities || 0,
        totalTransactions: totalTransactions || 0,
        standardCompliantTransactions: standardCompliantTransactions || 0,
        compliancePercentage: Math.round(compliancePercentage * 100) / 100
      }
    } catch (error) {
      console.error('Error getting validation stats:', error)
      return {
        totalEntities: 0,
        standardCompliantEntities: 0,
        totalTransactions: 0,
        standardCompliantTransactions: 0,
        compliancePercentage: 0
      }
    }
  }
}

// Export singleton instance
export const heraValidationService = new HeraValidationService()
