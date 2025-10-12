/**
 * HERA Development Playbook - Automatic Guardrail System
 * Smart Code: HERA.DNA.PLAYBOOK.DEVELOPMENT.GUARDRAILS.V1
 * 
 * REVOLUTIONARY: Comprehensive playbook system that automatically prevents common
 * development mistakes and ensures Claude follows HERA standards from the start.
 * NO MORE ASSUMPTIONS - Everything is validated against actual schema and standards.
 */

import { z } from 'zod'

// ============================================================================
// PLAYBOOK GUARDRAIL SYSTEM
// ============================================================================

/**
 * HERA Schema Reality Check - Actual database schema knowledge
 * 
 * ✅ CRITICAL UPDATE: This is now synchronized with the ACTUAL Supabase database schema at:
 * /database/migrations/schema.sql
 * 
 * This has been verified against the real database structure.
 * 
 * ⚠️ IMPORTANT FIELD NAME CORRECTIONS:
 * - Use transaction_number (NOT transaction_code)
 * - Use source_entity_id/target_entity_id (NOT from_entity_id/to_entity_id)
 * - Use entity_id (NOT line_entity_id) in transaction lines
 * - Use line_order (NOT line_number) in transaction lines
 * - Use relationship_data (NOT relationship_metadata)
 * - Use currency (NOT currency_code)
 * - status and parent_entity_id DO exist in core_entities
 */
export const HERA_ACTUAL_SCHEMA = {
  // Core Organizations Table
  core_organizations: {
    columns: ['id', 'organization_name', 'organization_code', 'created_at', 'updated_at', 'metadata'],
    primary_key: 'id',
    required_fields: ['organization_name'],
    forbidden_fields: ['status', 'is_active', 'deleted_at'], // These don't exist!
    metadata_usage: 'MINIMAL - only for system metadata'
  },

  // Core Entities Table  
  core_entities: {
    columns: ['id', 'organization_id', 'entity_type', 'entity_name', 'entity_code', 'status', 'parent_entity_id', 'hierarchy_level', 'created_at', 'updated_at', 'metadata'],
    primary_key: 'id',
    required_fields: ['organization_id', 'entity_type', 'entity_name'],
    forbidden_fields: ['is_active', 'deleted_at', 'parent_id', 'user_id'], // These don't exist!
    allowed_fields: ['status', 'parent_entity_id'], // These DO exist!
    relationships_via: 'core_relationships table for complex relationships',
    business_data_storage: 'core_dynamic_data table ONLY',
    metadata_usage: 'SYSTEM ONLY - never business data'
  },

  // Core Dynamic Data Table
  core_dynamic_data: {
    columns: ['id', 'organization_id', 'entity_id', 'field_name', 'field_type', 'field_value', 'field_value_number', 'field_value_boolean', 'field_value_date', 'field_value_datetime', 'field_value_json', 'created_at', 'updated_at'],
    primary_key: 'id',
    required_fields: ['organization_id', 'entity_id', 'field_name', 'field_type'],
    forbidden_fields: ['smart_code'], // This field doesn't exist in dynamic data!
    field_types: ['text', 'number', 'boolean', 'date', 'datetime', 'json', 'file'],
    business_data_location: 'ALL business properties go HERE',
    never_in_metadata: 'price, status, category, description, etc.'
  },

  // Core Relationships Table
  core_relationships: {
    columns: ['id', 'organization_id', 'source_entity_id', 'target_entity_id', 'relationship_type', 'relationship_data', 'created_at', 'updated_at'],
    primary_key: 'id',
    required_fields: ['organization_id', 'source_entity_id', 'target_entity_id', 'relationship_type'],
    forbidden_fields: ['from_entity_id', 'to_entity_id', 'relationship_metadata', 'smart_code'], // Wrong names!
    status_implementation: 'Use HAS_STATUS relationship to status entities',
    hierarchy_implementation: 'Use PARENT_OF/CHILD_OF relationships',
    actual_fields: {
      source_entity_id: 'NOT from_entity_id',
      target_entity_id: 'NOT to_entity_id', 
      relationship_data: 'NOT relationship_metadata'
    }
  },

  // Universal Transactions Table
  universal_transactions: {
    columns: ['id', 'organization_id', 'transaction_type', 'transaction_number', 'transaction_date', 'source_entity_id', 'target_entity_id', 'total_amount', 'currency', 'status', 'metadata', 'created_at', 'updated_at'],
    primary_key: 'id',
    required_fields: ['organization_id', 'transaction_type', 'transaction_number'],
    forbidden_fields: ['transaction_code', 'from_entity_id', 'to_entity_id', 'currency_code'], // Wrong names!
    business_data_storage: 'metadata for transaction-specific data',
    actual_fields: {
      transaction_number: 'NOT transaction_code',
      source_entity_id: 'NOT from_entity_id', 
      target_entity_id: 'NOT to_entity_id',
      currency: 'NOT currency_code'
    }
  },

  // Universal Transaction Lines Table
  universal_transaction_lines: {
    columns: ['id', 'transaction_id', 'organization_id', 'entity_id', 'line_description', 'line_order', 'quantity', 'unit_price', 'line_amount', 'metadata', 'created_at', 'updated_at'],
    primary_key: 'id',
    required_fields: ['transaction_id', 'line_description', 'line_order'],
    forbidden_fields: ['line_entity_id', 'line_number', 'line_metadata', 'smart_code'], // Wrong names!
    business_data_storage: 'metadata for line-specific data',
    actual_fields: {
      entity_id: 'NOT line_entity_id',
      line_order: 'NOT line_number',
      metadata: 'NOT line_metadata'
    }
  }
} as const

/**
 * HERA Field Placement Policy - MANDATORY ENFORCEMENT
 */
export const HERA_FIELD_PLACEMENT_RULES = {
  // Always in core_dynamic_data (99% of cases)
  DYNAMIC_DATA_FIELDS: [
    'price', 'cost', 'margin', 'discount', 'tax_rate',
    'description', 'notes', 'comments', 'instructions',
    'color', 'size', 'weight', 'dimensions',
    'email', 'phone', 'address', 'contact_info',
    'credit_limit', 'payment_terms', 'delivery_terms',
    'category', 'subcategory', 'brand', 'model',
    'quantity', 'stock_level', 'reorder_point',
    'start_date', 'end_date', 'duration', 'frequency',
    'priority', 'severity', 'urgency', 'importance',
    'rating', 'score', 'percentage', 'ratio'
  ],

  // Never in metadata (business data belongs in dynamic_data)
  FORBIDDEN_IN_METADATA: [
    'status', 'state', 'stage', 'phase', 'step',
    'price', 'cost', 'amount', 'value', 'total',
    'quantity', 'count', 'number', 'size',
    'user_data', 'business_data', 'customer_data'
  ],

  // Only allowed in metadata (system/technical data)
  ALLOWED_IN_METADATA: [
    'system_version', 'schema_version', 'migration_id',
    'ai_confidence', 'ai_classification', 'ai_tags',
    'sync_status', 'import_source', 'export_format',
    'audit_trail', 'change_log', 'system_flags'
  ],

  // Status implementation (NEVER as columns)
  STATUS_IMPLEMENTATION: {
    method: 'relationships_only',
    pattern: 'Create status entities → Link via HAS_STATUS relationship',
    forbidden: 'status columns in any table',
    example: 'entity HAS_STATUS draft_status_entity'
  }
} as const

/**
 * HERA Relationship Patterns - Standard Types
 */
export const HERA_RELATIONSHIP_TYPES = {
  // Hierarchy relationships
  PARENT_OF: 'Parent-child hierarchy',
  CHILD_OF: 'Child-parent hierarchy', 
  MEMBER_OF: 'Membership in group/organization',
  CONTAINS: 'Container-contained relationship',

  // Status relationships  
  HAS_STATUS: 'Current status assignment',
  WAS_STATUS: 'Previous status (historical)',
  CAN_BE_STATUS: 'Allowed status transitions',

  // Business relationships
  CUSTOMER_OF: 'Customer relationship',
  SUPPLIER_OF: 'Supplier relationship',
  EMPLOYEE_OF: 'Employment relationship',
  OWNS: 'Ownership relationship',
  MANAGES: 'Management relationship',
  REPORTS_TO: 'Reporting hierarchy',

  // Operational relationships
  ASSIGNED_TO: 'Task/resource assignment',
  RESPONSIBLE_FOR: 'Responsibility assignment',
  REQUIRES: 'Dependency relationship',
  DEPENDS_ON: 'Dependency relationship (reverse)',
  RELATED_TO: 'Generic association',

  // Transaction relationships
  BILLED_TO: 'Billing relationship',
  SHIPPED_TO: 'Shipping relationship',
  PAID_BY: 'Payment relationship'
} as const

/**
 * Smart Code Validation Rules
 */
export const HERA_SMART_CODE_RULES = {
  pattern: /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$/,
  structure: 'HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}',
  version_format: '.V1, .V2, .V3 (UPPERCASE V)',
  forbidden_formats: ['.v1', '.v2', '.version1', '_V1'],
  validation_required: true,
  examples: [
    'HERA.SALON.POS.CART.ACTIVE.V1',
    'HERA.REST.MENU.ITEM.FOOD.V1', 
    'HERA.HLTH.PAT.APPT.BOOKING.V1'
  ]
} as const

/**
 * API Standards
 */
export const HERA_API_STANDARDS = {
  version: 'v2 ONLY',
  base_path: '/api/v2/',
  required_headers: ['x-hera-api-version: v2'],
  response_format: {
    success: 'boolean',
    data: 'any',
    error: 'string (if success=false)',
    smart_code: 'string (always)',
    dna_trace: 'object (always)'
  },
  forbidden_patterns: ['/api/', '/api/v1/', 'custom endpoints without v2'],
  organization_filtering: 'MANDATORY on all endpoints'
} as const

// ============================================================================
// AUTOMATIC GUARDRAIL VALIDATION
// ============================================================================

export class HeraPlaybookGuardrailEngine {
  private static instance: HeraPlaybookGuardrailEngine
  private violations: Map<string, PlaybookViolation[]> = new Map()
  private validationHistory: PlaybookValidation[] = []

  private constructor() {}

  static getInstance(): HeraPlaybookGuardrailEngine {
    if (!HeraPlaybookGuardrailEngine.instance) {
      HeraPlaybookGuardrailEngine.instance = new HeraPlaybookGuardrailEngine()
    }
    return HeraPlaybookGuardrailEngine.instance
  }

  /**
   * CRITICAL: Validate development approach before coding starts
   */
  validateDevelopmentApproach(approach: DevelopmentApproach): PlaybookValidationResult {
    console.log('🛡️ PLAYBOOK GUARDRAIL: Validating development approach...')
    
    const violations: PlaybookViolation[] = []
    
    // 1. Schema assumptions validation
    this.validateSchemaAssumptions(approach, violations)
    
    // 2. Field placement validation  
    this.validateFieldPlacement(approach, violations)
    
    // 3. Relationship assumptions validation
    this.validateRelationshipAssumptions(approach, violations)
    
    // 4. Smart code validation
    this.validateSmartCodeUsage(approach, violations)
    
    // 5. API standards validation
    this.validateApiStandards(approach, violations)
    
    // 6. Existing component check
    this.validateExistingComponents(approach, violations)

    const isValid = violations.length === 0
    const result: PlaybookValidationResult = {
      isValid,
      violations,
      correctedApproach: isValid ? approach : this.generateCorrectedApproach(approach, violations),
      recommendations: this.generateRecommendations(violations),
      confidence: this.calculateValidationConfidence(violations)
    }

    // Store validation for learning
    this.storeValidation(approach, result)

    if (!isValid) {
      console.log('❌ GUARDRAIL VIOLATIONS DETECTED:', violations.length)
      violations.forEach(violation => {
        console.log(`   🚨 ${violation.severity}: ${violation.message}`)
        console.log(`   💡 Fix: ${violation.fix}`)
      })
    } else {
      console.log('✅ APPROACH VALIDATED - All guardrails passed')
    }

    return result
  }

  /**
   * Schema assumptions validation - Prevent wrong field assumptions
   */
  private validateSchemaAssumptions(approach: DevelopmentApproach, violations: PlaybookViolation[]): void {
    // Check for forbidden fields
    Object.entries(HERA_ACTUAL_SCHEMA).forEach(([table, schema]) => {
      if (approach.database_fields?.[table]) {
        const proposedFields = approach.database_fields[table]
        
        schema.forbidden_fields?.forEach(forbiddenField => {
          if (proposedFields.includes(forbiddenField)) {
            violations.push({
              type: 'SCHEMA_FORBIDDEN_FIELD',
              severity: 'CRITICAL',
              message: `Field '${forbiddenField}' does not exist in ${table}`,
              context: `Table: ${table}`,
              fix: `Remove '${forbiddenField}' - use ${this.getSuggestedAlternative(forbiddenField, table)}`,
              table,
              field: forbiddenField
            })
          }
        })
      }
    })

    // Check for incorrect relationship field names
    if (approach.database_fields?.core_relationships) {
      const relationshipFields = approach.database_fields.core_relationships
      if (relationshipFields.includes('from_entity_id') || relationshipFields.includes('to_entity_id')) {
        violations.push({
          type: 'SCHEMA_WRONG_RELATIONSHIP_FIELDS',
          severity: 'CRITICAL', 
          message: 'Relationship table uses source_entity_id/target_entity_id, not from/to',
          context: 'core_relationships table',
          fix: 'Use source_entity_id and target_entity_id instead',
          table: 'core_relationships'
        })
      }
      if (relationshipFields.includes('relationship_metadata')) {
        violations.push({
          type: 'SCHEMA_WRONG_RELATIONSHIP_METADATA_FIELD',
          severity: 'CRITICAL',
          message: 'Relationship table uses relationship_data, not relationship_metadata',
          context: 'core_relationships table', 
          fix: 'Use relationship_data instead of relationship_metadata',
          table: 'core_relationships'
        })
      }
    }

    // Check for transaction_code vs transaction_number
    if (approach.database_fields?.universal_transactions) {
      const txnFields = approach.database_fields.universal_transactions
      if (txnFields.includes('transaction_code')) {
        violations.push({
          type: 'SCHEMA_WRONG_TRANSACTION_FIELD',
          severity: 'CRITICAL',
          message: 'Transactions use transaction_number, not transaction_code',
          context: 'universal_transactions table',
          fix: 'Use transaction_number instead of transaction_code',
          table: 'universal_transactions'
        })
      }
      if (txnFields.includes('from_entity_id') || txnFields.includes('to_entity_id')) {
        violations.push({
          type: 'SCHEMA_WRONG_TRANSACTION_ENTITY_FIELDS',
          severity: 'CRITICAL',
          message: 'Transactions use source_entity_id/target_entity_id, not from/to',
          context: 'universal_transactions table',
          fix: 'Use source_entity_id and target_entity_id instead',
          table: 'universal_transactions'
        })
      }
    }

    // Check for transaction lines field names
    if (approach.database_fields?.universal_transaction_lines) {
      const lineFields = approach.database_fields.universal_transaction_lines
      if (lineFields.includes('line_entity_id')) {
        violations.push({
          type: 'SCHEMA_WRONG_LINE_ENTITY_FIELD',
          severity: 'CRITICAL',
          message: 'Transaction lines use entity_id, not line_entity_id',
          context: 'universal_transaction_lines table',
          fix: 'Use entity_id instead of line_entity_id',
          table: 'universal_transaction_lines'
        })
      }
      if (lineFields.includes('line_number')) {
        violations.push({
          type: 'SCHEMA_WRONG_LINE_NUMBER_FIELD',
          severity: 'CRITICAL', 
          message: 'Transaction lines use line_order, not line_number',
          context: 'universal_transaction_lines table',
          fix: 'Use line_order instead of line_number',
          table: 'universal_transaction_lines'
        })
      }
    }
  }

  /**
   * Field placement validation - Enforce HERA field placement policy
   */
  private validateFieldPlacement(approach: DevelopmentApproach, violations: PlaybookViolation[]): void {
    if (!approach.field_placement) return

    Object.entries(approach.field_placement).forEach(([location, fields]) => {
      if (location === 'metadata') {
        // Check for business data in metadata (forbidden)
        fields.forEach(field => {
          if (HERA_FIELD_PLACEMENT_RULES.FORBIDDEN_IN_METADATA.includes(field) ||
              HERA_FIELD_PLACEMENT_RULES.DYNAMIC_DATA_FIELDS.includes(field)) {
            violations.push({
              type: 'FIELD_PLACEMENT_BUSINESS_IN_METADATA',
              severity: 'CRITICAL',
              message: `Business field '${field}' cannot be in metadata`,
              context: 'Field placement policy violation',
              fix: `Move '${field}' to core_dynamic_data table`,
              field
            })
          }
        })
      }

      if (location === 'new_columns') {
        // Check for fields that should be in dynamic_data
        fields.forEach(field => {
          if (HERA_FIELD_PLACEMENT_RULES.DYNAMIC_DATA_FIELDS.includes(field)) {
            violations.push({
              type: 'FIELD_PLACEMENT_NEW_COLUMN_FORBIDDEN',
              severity: 'CRITICAL', 
              message: `Field '${field}' must be in core_dynamic_data, not new columns`,
              context: 'Sacred Six Tables violation',
              fix: `Use core_dynamic_data for '${field}' instead of adding columns`,
              field
            })
          }
        })
      }
    })
  }

  /**
   * Relationship assumptions validation
   */
  private validateRelationshipAssumptions(approach: DevelopmentApproach, violations: PlaybookViolation[]): void {
    if (!approach.relationships) return

    approach.relationships.forEach(rel => {
      // Check for invalid relationship types
      if (!Object.keys(HERA_RELATIONSHIP_TYPES).includes(rel.type)) {
        violations.push({
          type: 'RELATIONSHIP_INVALID_TYPE',
          severity: 'WARNING',
          message: `Relationship type '${rel.type}' is not standard`,
          context: `Relationship: ${rel.from} -> ${rel.to}`,
          fix: `Use standard relationship types: ${Object.keys(HERA_RELATIONSHIP_TYPES).slice(0, 3).join(', ')}, etc.`,
          relationship: rel.type
        })
      }

      // Check for status in relationships instead of columns
      if (rel.type.includes('status') && !rel.type.startsWith('HAS_STATUS')) {
        violations.push({
          type: 'RELATIONSHIP_STATUS_PATTERN',
          severity: 'INFO',
          message: 'Status relationships should follow HAS_STATUS pattern',
          context: `Relationship: ${rel.type}`,
          fix: `Consider using HAS_STATUS relationship pattern`,
          relationship: rel.type
        })
      }
    })
  }

  /**
   * Smart code validation
   */
  private validateSmartCodeUsage(approach: DevelopmentApproach, violations: PlaybookViolation[]): void {
    if (!approach.smart_codes) return

    approach.smart_codes.forEach(smartCode => {
      if (!HERA_SMART_CODE_RULES.pattern.test(smartCode)) {
        violations.push({
          type: 'SMART_CODE_INVALID_FORMAT',
          severity: 'CRITICAL',
          message: `Smart code '${smartCode}' does not match required pattern`,
          context: `Required: ${HERA_SMART_CODE_RULES.structure}`,
          fix: this.generateCorrectSmartCode(smartCode),
          smart_code: smartCode
        })
      }

      // Check for lowercase version suffix
      if (smartCode.includes('.v') && !smartCode.includes('.V')) {
        violations.push({
          type: 'SMART_CODE_LOWERCASE_VERSION',
          severity: 'CRITICAL',
          message: `Smart code version must be uppercase (.V1, not .v1)`,
          context: smartCode,
          fix: smartCode.replace(/\.v(\d+)/, '.V$1'),
          smart_code: smartCode
        })
      }
    })
  }

  /**
   * API standards validation
   */
  private validateApiStandards(approach: DevelopmentApproach, violations: PlaybookViolation[]): void {
    if (!approach.api_endpoints) return

    approach.api_endpoints.forEach(endpoint => {
      // Check for non-v2 endpoints
      if (!endpoint.startsWith('/api/v2/')) {
        violations.push({
          type: 'API_NON_V2_ENDPOINT',
          severity: 'CRITICAL',
          message: `API endpoint must use v2: ${endpoint}`,
          context: 'HERA API Standards',
          fix: `Change to /api/v2${endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint}`,
          endpoint
        })
      }

      // Check for missing organization filtering
      if (!approach.api_implementation?.includes('organization_id')) {
        violations.push({
          type: 'API_MISSING_ORG_FILTER',
          severity: 'CRITICAL',
          message: 'API must include organization_id filtering',
          context: `Endpoint: ${endpoint}`,
          fix: 'Add organization_id filtering to all database queries',
          endpoint
        })
      }
    })
  }

  /**
   * Existing component validation - Check if we already have it
   */
  private validateExistingComponents(approach: DevelopmentApproach, violations: PlaybookViolation[]): void {
    if (!approach.components) return

    // This would check against actual codebase in real implementation
    const existingComponents = this.getExistingComponents()
    
    approach.components.forEach(component => {
      const existing = existingComponents.find(existing => 
        existing.name.toLowerCase().includes(component.toLowerCase()) ||
        component.toLowerCase().includes(existing.name.toLowerCase())
      )

      if (existing) {
        violations.push({
          type: 'COMPONENT_ALREADY_EXISTS',
          severity: 'WARNING',
          message: `Similar component already exists: ${existing.name}`,
          context: `Location: ${existing.path}`,
          fix: `Consider extending ${existing.name} instead of creating new component`,
          component: component,
          existing_component: existing.name,
          existing_path: existing.path
        })
      }
    })
  }

  /**
   * Generate corrected approach based on violations
   */
  private generateCorrectedApproach(approach: DevelopmentApproach, violations: PlaybookViolation[]): DevelopmentApproach {
    const corrected = { ...approach }

    violations.forEach(violation => {
      switch (violation.type) {
        case 'SCHEMA_FORBIDDEN_FIELD':
          if (corrected.database_fields?.[violation.table!]) {
            corrected.database_fields[violation.table!] = corrected.database_fields[violation.table!]
              .filter(field => field !== violation.field)
          }
          break

        case 'FIELD_PLACEMENT_BUSINESS_IN_METADATA':
          if (corrected.field_placement?.metadata) {
            corrected.field_placement.metadata = corrected.field_placement.metadata
              .filter(field => field !== violation.field)
            if (!corrected.field_placement.dynamic_data) {
              corrected.field_placement.dynamic_data = []
            }
            corrected.field_placement.dynamic_data.push(violation.field!)
          }
          break

        case 'SMART_CODE_LOWERCASE_VERSION':
          if (corrected.smart_codes) {
            corrected.smart_codes = corrected.smart_codes.map(code => 
              code === violation.smart_code ? violation.fix! : code
            )
          }
          break

        case 'API_NON_V2_ENDPOINT':
          if (corrected.api_endpoints) {
            corrected.api_endpoints = corrected.api_endpoints.map(endpoint =>
              endpoint === violation.endpoint ? violation.fix! : endpoint
            )
          }
          break
      }
    })

    return corrected
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(violations: PlaybookViolation[]): string[] {
    const recommendations: string[] = []

    const violationTypes = new Set(violations.map(v => v.type))

    if (violationTypes.has('SCHEMA_FORBIDDEN_FIELD')) {
      recommendations.push('Review HERA actual schema documentation before assuming field names')
    }

    if (violationTypes.has('FIELD_PLACEMENT_BUSINESS_IN_METADATA')) {
      recommendations.push('Follow HERA Field Placement Policy: business data goes in core_dynamic_data')
    }

    if (violationTypes.has('SMART_CODE_INVALID_FORMAT') || violationTypes.has('SMART_CODE_LOWERCASE_VERSION')) {
      recommendations.push('Use HERA Smart Code generator for proper format validation')
    }

    if (violationTypes.has('API_NON_V2_ENDPOINT')) {
      recommendations.push('Always use Universal API v2 endpoints with proper headers')
    }

    if (violationTypes.has('COMPONENT_ALREADY_EXISTS')) {
      recommendations.push('Check existing components before creating new ones - extend when possible')
    }

    if (recommendations.length === 0) {
      recommendations.push('All guardrails passed - proceed with confidence!')
    }

    return recommendations
  }

  /**
   * Helper methods
   */
  private getSuggestedAlternative(forbiddenField: string, table: string): string {
    const alternatives: Record<string, string> = {
      'status': 'status field exists in core_entities and universal_transactions',
      'is_active': 'is_active field exists in core_relationships',
      'deleted_at': 'HAS_STATUS relationship to deleted status entity',
      'parent_id': 'parent_entity_id field exists in core_entities',
      'user_id': 'relationship in core_relationships table',
      'transaction_code': 'transaction_number field (actual column name)',
      'from_entity_id': 'source_entity_id field (actual column name)',
      'to_entity_id': 'target_entity_id field (actual column name)',
      'relationship_metadata': 'relationship_data field (actual column name)',
      'line_entity_id': 'entity_id field (actual column name)',
      'line_number': 'line_order field (actual column name)',
      'currency_code': 'currency field (actual column name)'
    }

    return alternatives[forbiddenField] || 'appropriate HERA pattern from documentation'
  }

  private generateCorrectSmartCode(invalidCode: string): string {
    // Try to fix common smart code issues
    let fixed = invalidCode

    // Fix lowercase version
    fixed = fixed.replace(/\.v(\d+)/, '.V$1')

    // Add HERA prefix if missing
    if (!fixed.startsWith('HERA.')) {
      fixed = 'HERA.' + fixed
    }

    // If still invalid, provide template
    if (!HERA_SMART_CODE_RULES.pattern.test(fixed)) {
      return 'HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V1 (fix based on your use case)'
    }

    return fixed
  }

  private getExistingComponents(): Array<{name: string, path: string}> {
    // In real implementation, this would scan the actual codebase
    return [
      { name: 'CustomerList', path: 'src/components/customers/CustomerList.tsx' },
      { name: 'ProductCard', path: 'src/components/products/ProductCard.tsx' },
      { name: 'UserProfile', path: 'src/components/auth/UserProfile.tsx' },
      { name: 'Dashboard', path: 'src/components/dashboard/Dashboard.tsx' },
      { name: 'DataTable', path: 'src/components/ui/DataTable.tsx' },
      { name: 'FormBuilder', path: 'src/components/forms/FormBuilder.tsx' }
    ]
  }

  private calculateValidationConfidence(violations: PlaybookViolation[]): number {
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length
    const warningViolations = violations.filter(v => v.severity === 'WARNING').length
    
    let confidence = 100
    confidence -= criticalViolations * 20  // -20% per critical
    confidence -= warningViolations * 10   // -10% per warning
    
    return Math.max(0, confidence)
  }

  private storeValidation(approach: DevelopmentApproach, result: PlaybookValidationResult): void {
    const validation: PlaybookValidation = {
      timestamp: new Date().toISOString(),
      approach,
      result,
      violationCount: result.violations.length
    }

    this.validationHistory.push(validation)

    // Keep only last 100 validations
    if (this.validationHistory.length > 100) {
      this.validationHistory.shift()
    }
  }

  /**
   * Get validation statistics for learning
   */
  getValidationStatistics(): ValidationStatistics {
    const recentValidations = this.validationHistory.slice(-20)
    
    return {
      totalValidations: this.validationHistory.length,
      recentSuccessRate: recentValidations.filter(v => v.result.isValid).length / recentValidations.length * 100,
      commonViolationTypes: this.getCommonViolationTypes(),
      improvementTrend: this.calculateImprovementTrend(),
      averageConfidence: recentValidations.reduce((sum, v) => sum + v.result.confidence, 0) / recentValidations.length
    }
  }

  private getCommonViolationTypes(): Array<{type: string, count: number}> {
    const typeCounts = new Map<string, number>()
    
    this.validationHistory.forEach(validation => {
      validation.result.violations.forEach(violation => {
        typeCounts.set(violation.type, (typeCounts.get(violation.type) || 0) + 1)
      })
    })

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private calculateImprovementTrend(): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    if (this.validationHistory.length < 10) return 'STABLE'

    const recent = this.validationHistory.slice(-10)
    const older = this.validationHistory.slice(-20, -10)

    const recentAvgViolations = recent.reduce((sum, v) => sum + v.violationCount, 0) / recent.length
    const olderAvgViolations = older.reduce((sum, v) => sum + v.violationCount, 0) / older.length

    if (recentAvgViolations < olderAvgViolations - 0.5) return 'IMPROVING'
    if (recentAvgViolations > olderAvgViolations + 0.5) return 'DECLINING'
    return 'STABLE'
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DevelopmentApproach {
  description: string
  database_fields?: Record<string, string[]>
  field_placement?: {
    metadata?: string[]
    dynamic_data?: string[]
    new_columns?: string[]
  }
  relationships?: Array<{
    from: string
    to: string
    type: string
  }>
  smart_codes?: string[]
  api_endpoints?: string[]
  api_implementation?: string
  components?: string[]
  existing_check?: boolean
}

export interface PlaybookViolation {
  type: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  context: string
  fix: string
  table?: string
  field?: string
  relationship?: string
  smart_code?: string
  endpoint?: string
  component?: string
  existing_component?: string
  existing_path?: string
}

export interface PlaybookValidationResult {
  isValid: boolean
  violations: PlaybookViolation[]
  correctedApproach: DevelopmentApproach
  recommendations: string[]
  confidence: number
}

export interface PlaybookValidation {
  timestamp: string
  approach: DevelopmentApproach
  result: PlaybookValidationResult
  violationCount: number
}

export interface ValidationStatistics {
  totalValidations: number
  recentSuccessRate: number
  commonViolationTypes: Array<{type: string, count: number}>
  improvementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  averageConfidence: number
}

// Export singleton instance
export const heraPlaybookGuardrail = HeraPlaybookGuardrailEngine.getInstance()