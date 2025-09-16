/**
 * HERA Sacred 6-Table Architecture Validator
 * Enforces the universal 6-table pattern and prevents violations
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  autoFixes?: Record<string, any>
}

export class HeraSacredValidator {
  // The 6 sacred tables
  private static readonly SACRED_TABLES = [
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ] as const

  // Required fields for each operation
  private static readonly REQUIRED_FIELDS = {
    core_entities: {
      create: ['organization_id', 'entity_type', 'entity_name', 'smart_code'],
      update: [],
      query: ['organization_id']
    },
    core_dynamic_data: {
      create: ['organization_id', 'entity_id', 'field_name', 'field_type'],
      update: [],
      query: ['organization_id']
    },
    core_relationships: {
      create: [
        'organization_id',
        'from_entity_id',
        'to_entity_id',
        'relationship_type',
        'smart_code'
      ],
      update: [],
      query: ['organization_id']
    },
    universal_transactions: {
      create: ['organization_id', 'transaction_type', 'transaction_code', 'smart_code'],
      update: [],
      query: ['organization_id']
    },
    universal_transaction_lines: {
      create: ['transaction_id', 'organization_id', 'line_description', 'smart_code'],
      update: [],
      query: ['organization_id']
    },
    core_organizations: {
      create: ['organization_name', 'organization_code', 'organization_type'],
      update: [],
      query: [] // Organizations don't require organization_id in queries
    }
  }

  /**
   * Validate table name is one of the sacred 6
   */
  static validateTable(tableName: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!this.SACRED_TABLES.includes(tableName as any)) {
      result.isValid = false
      result.errors.push(
        `Table '${tableName}' violates HERA's sacred 6-table architecture. Use only: ${this.SACRED_TABLES.join(', ')}`
      )

      // Suggest migrations for common violations
      if (tableName === 'core_clients') {
        result.autoFixes = {
          table: 'core_entities',
          entity_type: 'client',
          business_rules: { ledger_type: 'client_consolidation' }
        }
        result.warnings.push("Migrate to core_entities with entity_type='client'")
      } else if (tableName === 'gl_chart_of_accounts') {
        result.autoFixes = {
          table: 'core_entities',
          entity_type: 'account',
          business_rules: { ledger_type: 'GL' }
        }
        result.warnings.push(
          "Migrate to core_entities with entity_type='account' and business_rules.ledger_type='GL'"
        )
      }
    }

    return result
  }

  /**
   * Validate required fields for operations
   */
  static validateOperation(
    table: string,
    operation: 'create' | 'update' | 'query',
    data: Record<string, any>
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // First validate table
    const tableValidation = this.validateTable(table)
    if (!tableValidation.isValid) {
      return tableValidation
    }

    // Check required fields
    const requiredFields =
      this.REQUIRED_FIELDS[table as keyof typeof this.REQUIRED_FIELDS]?.[operation] || []
    const missingFields = requiredFields.filter(field => !data[field])

    if (missingFields.length > 0) {
      result.isValid = false
      result.errors.push(
        `Missing required fields for ${operation} on ${table}: ${missingFields.join(', ')}`
      )
    }

    // Special validations
    if (table === 'core_entities' && operation === 'create') {
      // Normalize entity types
      if (data.entity_type === 'gl_account') {
        result.warnings.push(
          "Use entity_type='account' with business_rules.ledger_type='GL' instead of 'gl_account'"
        )
        result.autoFixes = {
          entity_type: 'account',
          business_rules: { ...data.business_rules, ledger_type: 'GL' }
        }
      }
    }

    if (table === 'core_relationships' && operation === 'create') {
      // Check for wrong column names
      if ('source_entity_id' in data || 'target_entity_id' in data) {
        result.isValid = false
        result.errors.push(
          "Use 'from_entity_id' and 'to_entity_id' instead of 'source_entity_id' and 'target_entity_id'"
        )
        result.autoFixes = {
          from_entity_id: data.source_entity_id || data.from_entity_id,
          to_entity_id: data.target_entity_id || data.to_entity_id
        }
      }
    }

    // Validate smart codes
    if (
      [
        'core_entities',
        'core_relationships',
        'universal_transactions',
        'universal_transaction_lines'
      ].includes(table)
    ) {
      if (operation === 'create' && data.smart_code) {
        const smartCodeValidation = this.validateSmartCode(data.smart_code)
        if (!smartCodeValidation.isValid) {
          result.warnings.push(...smartCodeValidation.errors)
        }
      }
    }

    return result
  }

  /**
   * Validate smart code format
   */
  static validateSmartCode(smartCode: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    const pattern = /^HERA\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.v\d+$/
    if (!pattern.test(smartCode)) {
      result.isValid = false
      result.errors.push(
        `Invalid smart code format: ${smartCode}. Expected: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}`
      )
    }

    return result
  }

  /**
   * Validate organization_id is present for multi-tenant operations
   */
  static validateMultiTenancy(
    table: string,
    operation: 'create' | 'update' | 'query' | 'delete',
    data: Record<string, any>
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Organizations table doesn't need organization_id
    if (table === 'core_organizations') {
      return result
    }

    if (!data.organization_id) {
      result.isValid = false
      result.errors.push(
        `SACRED VIOLATION: organization_id is required for all ${operation} operations on ${table}`
      )
    }

    return result
  }

  /**
   * Apply auto-fixes to data
   */
  static applyAutoFixes(
    data: Record<string, any>,
    fixes: Record<string, any>
  ): Record<string, any> {
    const fixed = { ...data }

    // Remove deprecated fields
    delete fixed.source_entity_id
    delete fixed.target_entity_id

    // Apply fixes
    Object.entries(fixes).forEach(([key, value]) => {
      if (key === 'business_rules' && fixed.business_rules) {
        fixed.business_rules = { ...fixed.business_rules, ...value }
      } else {
        fixed[key] = value
      }
    })

    return fixed
  }

  /**
   * Comprehensive validation for any HERA operation
   */
  static validate(params: {
    table: string
    operation: 'create' | 'update' | 'query' | 'delete'
    data: Record<string, any>
    organizationId?: string
  }): ValidationResult {
    const { table, operation, data, organizationId } = params
    const errors: string[] = []
    const warnings: string[] = []
    let autoFixes: Record<string, any> = {}

    // Add organization_id if provided separately
    const dataWithOrgId = organizationId ? { ...data, organization_id: organizationId } : data

    // 1. Validate table
    const tableResult = this.validateTable(table)
    errors.push(...tableResult.errors)
    warnings.push(...tableResult.warnings)
    if (tableResult.autoFixes) {
      autoFixes = { ...autoFixes, ...tableResult.autoFixes }
    }

    // 2. Validate multi-tenancy
    const multiTenantResult = this.validateMultiTenancy(table, operation, dataWithOrgId)
    errors.push(...multiTenantResult.errors)
    warnings.push(...multiTenantResult.warnings)

    // 3. Validate operation requirements
    if (operation !== 'delete') {
      const opResult = this.validateOperation(table, operation as any, dataWithOrgId)
      errors.push(...opResult.errors)
      warnings.push(...opResult.warnings)
      if (opResult.autoFixes) {
        autoFixes = { ...autoFixes, ...opResult.autoFixes }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      autoFixes: Object.keys(autoFixes).length > 0 ? autoFixes : undefined
    }
  }
}

// Export validator instance for convenience
export const sacredValidator = HeraSacredValidator
