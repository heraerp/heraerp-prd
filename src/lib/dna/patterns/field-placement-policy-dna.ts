/**
 * HERA DNA: Field Placement Policy
 *
 * Core DNA component that enforces HERA's universal field placement policy.
 * Ensures architectural integrity by directing fields to appropriate tables.
 *
 * Smart Code: HERA.DNA.PATTERN.FIELD.PLACEMENT.POLICY.V1
 */

export interface DynamicFieldSpec {
  field_name: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json'
  field_value?: any
  smart_code: string
  metadata?: Record<string, any>
}

export interface MetadataValidation {
  isValid: boolean
  category?: 'system_ai' | 'system_observability' | 'system_audit'
  violations: string[]
}

export type AllowedMetadataCategory = 'system_ai' | 'system_observability' | 'system_audit'

/**
 * HERA DNA Field Placement Policy Engine
 *
 * Enforces the core rule: Default to dynamic data, metadata requires justification
 */
export class FieldPlacementPolicyDNA {
  private static readonly ALLOWED_METADATA_CATEGORIES: AllowedMetadataCategory[] = [
    'system_ai',
    'system_observability',
    'system_audit'
  ]

  private static readonly BUSINESS_FIELD_PATTERNS = [
    // Pricing patterns
    /^.*price.*$/i,
    /^.*cost.*$/i,
    /^.*fee.*$/i,
    /^.*charge.*$/i,
    /^.*rate.*$/i,
    /^.*amount.*$/i,

    // Duration/time patterns
    /^.*duration.*$/i,
    /^.*time.*$/i,
    /^.*minutes.*$/i,
    /^.*hours.*$/i,
    /^.*buffer.*$/i,

    // Category/classification patterns
    /^.*category.*$/i,
    /^.*type.*$/i,
    /^.*classification.*$/i,
    /^.*tier.*$/i,
    /^.*level.*$/i,

    // Status/lifecycle patterns (ALWAYS forbidden in metadata)
    /^.*status.*$/i,
    /^.*state.*$/i,
    /^.*lifecycle.*$/i,
    /^.*workflow.*$/i,

    // Business attributes
    /^.*commission.*$/i,
    /^.*discount.*$/i,
    /^.*tax.*$/i,
    /^.*description.*$/i,
    /^.*notes.*$/i,
    /^.*requirements.*$/i
  ]

  /**
   * Validate if a field should go to metadata or dynamic data
   */
  static validateFieldPlacement(
    fieldName: string,
    metadata?: Record<string, any>
  ): {
    shouldUseDynamicData: boolean
    reason: string
    suggestedAction: string
    violations: string[]
  } {
    const violations: string[] = []

    // Check if it's a business field pattern
    const isBusinessField = this.BUSINESS_FIELD_PATTERNS.some(pattern => pattern.test(fieldName))

    // Check if it's a status field (always forbidden in metadata)
    const isStatusField = /^.*(status|state|lifecycle|workflow).*$/i.test(fieldName)

    if (isStatusField) {
      return {
        shouldUseDynamicData: false, // Should use universal_transactions instead
        reason: 'Status/lifecycle fields must be modeled as universal_transactions relationships',
        suggestedAction: 'Use universal_transactions table with relationship_type = "has_status"',
        violations: [
          `${fieldName} is a status/lifecycle field - forbidden in both metadata and dynamic data`
        ]
      }
    }

    if (isBusinessField) {
      return {
        shouldUseDynamicData: true,
        reason: `${fieldName} matches business field pattern - belongs in core_dynamic_data`,
        suggestedAction: `Move ${fieldName} to core_dynamic_data with appropriate field_type`,
        violations: violations
      }
    }

    // If metadata is provided, validate it has proper categorization
    if (metadata) {
      const metadataValidation = this.validateMetadataUsage(metadata)
      if (!metadataValidation.isValid) {
        return {
          shouldUseDynamicData: true,
          reason: 'Metadata usage requires explicit categorization',
          suggestedAction: 'Either add metadata_category or move to core_dynamic_data',
          violations: metadataValidation.violations
        }
      }
    }

    // Default: use dynamic data
    return {
      shouldUseDynamicData: true,
      reason: 'HERA default policy: new fields belong in core_dynamic_data',
      suggestedAction: `Create dynamic field for ${fieldName}`,
      violations: violations
    }
  }

  /**
   * Validate metadata usage requires proper categorization
   */
  static validateMetadataUsage(metadata: Record<string, any>): MetadataValidation {
    const violations: string[] = []

    if (!metadata.metadata_category) {
      violations.push('metadata_category is required when using metadata')
      return { isValid: false, violations }
    }

    if (!this.ALLOWED_METADATA_CATEGORIES.includes(metadata.metadata_category)) {
      violations.push(
        `metadata_category must be one of: ${this.ALLOWED_METADATA_CATEGORIES.join(', ')}`
      )
      return { isValid: false, violations }
    }

    return {
      isValid: true,
      category: metadata.metadata_category,
      violations: []
    }
  }

  /**
   * Generate dynamic field specification from field data
   */
  static generateDynamicFieldSpec(
    fieldName: string,
    fieldValue: any,
    smartCode: string,
    entityId: string,
    organizationId: string
  ): DynamicFieldSpec {
    // Auto-detect field type
    let fieldType: DynamicFieldSpec['field_type'] = 'text'

    if (typeof fieldValue === 'number') {
      fieldType = 'number'
    } else if (typeof fieldValue === 'boolean') {
      fieldType = 'boolean'
    } else if (fieldValue instanceof Date) {
      fieldType = 'datetime'
    } else if (typeof fieldValue === 'object' && fieldValue !== null) {
      fieldType = 'json'
    }

    return {
      field_name: fieldName,
      field_type: fieldType,
      field_value: fieldValue,
      smart_code: smartCode,
      metadata: {
        organization_id: organizationId,
        entity_id: entityId,
        auto_generated: true,
        placement_policy_version: 'v1'
      }
    }
  }

  /**
   * Bulk validate multiple fields for placement
   */
  static validateBulkFieldPlacement(fields: Record<string, any>): {
    dynamicFields: Array<{ name: string; value: any; reason: string }>
    metadataFields: Array<{ name: string; value: any; category: string }>
    statusFields: Array<{ name: string; value: any; action: string }>
    violations: Array<{ field: string; violations: string[] }>
  } {
    const result = {
      dynamicFields: [] as Array<{ name: string; value: any; reason: string }>,
      metadataFields: [] as Array<{ name: string; value: any; category: string }>,
      statusFields: [] as Array<{ name: string; value: any; action: string }>,
      violations: [] as Array<{ field: string; violations: string[] }>
    }

    Object.entries(fields).forEach(([fieldName, fieldValue]) => {
      const validation = this.validateFieldPlacement(fieldName)

      if (validation.violations.length > 0) {
        result.violations.push({
          field: fieldName,
          violations: validation.violations
        })
      }

      if (fieldName.match(/^.*(status|state|lifecycle|workflow).*$/i)) {
        result.statusFields.push({
          name: fieldName,
          value: fieldValue,
          action: 'Move to universal_transactions as relationship'
        })
      } else if (validation.shouldUseDynamicData) {
        result.dynamicFields.push({
          name: fieldName,
          value: fieldValue,
          reason: validation.reason
        })
      }
    })

    return result
  }

  /**
   * Generate smart code for dynamic field based on context
   */
  static generateSmartCodeForDynamicField(
    fieldName: string,
    industry: string = 'UNIVERSAL',
    module: string = 'DYN'
  ): string {
    // Convert field name to smart code segment
    const fieldSegment = fieldName.toUpperCase().replace(/_/g, '.').replace(/\s+/g, '.')

    return `HERA.${industry}.${module}.${fieldSegment}.V1`
  }
}

/**
 * Helper functions for common field placement operations
 */
export const FieldPlacementHelpers = {
  /**
   * Quick check if a field should be dynamic data
   */
  shouldBeDynamicData: (fieldName: string): boolean => {
    const validation = FieldPlacementPolicyDNA.validateFieldPlacement(fieldName)
    return validation.shouldUseDynamicData
  },

  /**
   * Quick check if metadata usage is valid
   */
  isValidMetadata: (metadata: Record<string, any>): boolean => {
    const validation = FieldPlacementPolicyDNA.validateMetadataUsage(metadata)
    return validation.isValid
  },

  /**
   * Generate field placement recommendations
   */
  getPlacementRecommendation: (fieldName: string) => {
    return FieldPlacementPolicyDNA.validateFieldPlacement(fieldName)
  }
}

/**
 * Type guards for field placement validation
 */
export const FieldPlacementTypeGuards = {
  isAllowedMetadataCategory: (category: string): category is AllowedMetadataCategory => {
    return ['system_ai', 'system_observability', 'system_audit'].includes(
      category as AllowedMetadataCategory
    )
  },

  isBusinessField: (fieldName: string): boolean => {
    const businessPatterns = [
      /^.*price.*$/i,
      /^.*cost.*$/i,
      /^.*duration.*$/i,
      /^.*category.*$/i,
      /^.*commission.*$/i
    ]
    return businessPatterns.some(pattern => pattern.test(fieldName))
  },

  isStatusField: (fieldName: string): boolean => {
    return /^.*(status|state|lifecycle|workflow).*$/i.test(fieldName)
  }
}

// Export the policy as a constant for easy reference
export const HERA_FIELD_PLACEMENT_POLICY = {
  SMART_CODE: 'HERA.DNA.PATTERN.FIELD.PLACEMENT.POLICY.V1',
  VERSION: 'v1',
  ALLOWED_METADATA_CATEGORIES: ['system_ai', 'system_observability', 'system_audit'] as const,
  DEFAULT_PLACEMENT: 'core_dynamic_data' as const,
  STATUS_PLACEMENT: 'universal_transactions' as const
} as const
