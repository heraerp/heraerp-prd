/**
 * HERA Field Placement Validation
 *
 * API validation schemas and middleware to enforce the HERA Field Placement Policy
 */

import { z } from 'zod'
import { FieldPlacementPolicyDNA } from '@/lib/dna/patterns/field-placement-policy-dna'

/**
 * Allowed metadata categories schema
 */
export const AllowedMetadataCategorySchema = z.enum([
  'system_ai',
  'system_observability',
  'system_audit'
])

/**
 * Metadata schema that requires explicit categorization
 */
export const MetadataSchema = z
  .object({
    metadata_category: AllowedMetadataCategorySchema
    // Additional fields allowed based on category
  })
  .catchall(z.any())
  .refine(
    data => {
      // Custom validation logic can be added here
      return data.metadata_category !== undefined
    },
    {
      message: 'metadata_category is required when using metadata'
    }
  )

/**
 * Dynamic field schema
 */
export const DynamicFieldSchema = z
  .object({
    organization_id: z.string().uuid(),
    entity_id: z.string().uuid(),
    field_name: z.string().min(1).max(100),
    field_type: z.enum(['text', 'number', 'boolean', 'date', 'datetime', 'json']),
    field_value_text: z.string().optional(),
    field_value_number: z.number().optional(),
    field_value_boolean: z.boolean().optional(),
    field_value_date: z.string().optional(),
    field_value_datetime: z.string().optional(),
    field_value_json: z.any().optional(),
    smart_code: z.string().regex(/^HERA\.[A-Z]+(\.[A-Z0-9]+)*\.V\d+$/, 'Invalid smart code format'),
    metadata: z.record(z.any()).optional()
  })
  .refine(
    data => {
      // Validate that status fields are not allowed
      const isStatusField = /^.*(status|state|lifecycle|workflow).*$/i.test(data.field_name)
      if (isStatusField) {
        return false
      }
      return true
    },
    {
      message: 'Status/lifecycle fields must be modeled as universal_transactions relationships'
    }
  )

/**
 * Entity upsert schema with field placement validation
 */
export const EntityUpsertSchema = z
  .object({
    organization_id: z.string().uuid(),
    entity_type: z.string(),
    entity_name: z.string(),
    entity_code: z.string().optional(),
    entity_description: z.string().optional(),
    smart_code: z.string().regex(/^HERA\.[A-Z]+(\.[A-Z0-9]+)*\.V\d+$/, 'Invalid smart code format'),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),

    // Metadata requires explicit categorization
    metadata: MetadataSchema.optional(),

    // Business rules and attributes are allowed
    business_rules: z.record(z.any()).optional(),
    attributes: z.record(z.any()).optional(),

    // AI fields with system categorization
    ai_confidence: z.number().min(0).max(1).optional(),
    ai_classification: z.string().optional(),
    ai_insights: z.record(z.any()).optional(),

    // Relationship fields
    parent_entity_id: z.string().uuid().optional(),

    // Audit fields
    created_at: z.string().optional(),
    updated_at: z.string().optional()
  })
  .refine(
    data => {
      // Custom validation for business fields in metadata
      if (data.metadata) {
        const businessFieldsInMetadata = Object.keys(data.metadata).filter(key => {
          if (key === 'metadata_category') return false

          const validation = FieldPlacementPolicyDNA.validateFieldPlacement(key)
          return validation.shouldUseDynamicData
        })

        if (businessFieldsInMetadata.length > 0) {
          return false
        }
      }

      return true
    },
    {
      message: 'Business fields detected in metadata - these should be moved to core_dynamic_data'
    }
  )

/**
 * Validation middleware for field placement policy
 */
export class FieldPlacementValidator {
  /**
   * Validate entity data against field placement policy
   */
  static validateEntityData(entityData: any): {
    isValid: boolean
    violations: Array<{ field: string; violation: string; suggestion: string }>
    recommendations: Array<{ action: string; field: string; reason: string }>
  } {
    const violations: Array<{ field: string; violation: string; suggestion: string }> = []
    const recommendations: Array<{ action: string; field: string; reason: string }> = []

    // Check metadata fields
    if (entityData.metadata) {
      // Validate metadata categorization
      const metadataValidation = FieldPlacementPolicyDNA.validateMetadataUsage(entityData.metadata)
      if (!metadataValidation.isValid) {
        violations.push({
          field: 'metadata',
          violation: metadataValidation.violations.join(', '),
          suggestion:
            'Add metadata_category with value: system_ai, system_observability, or system_audit'
        })
      }

      // Check for business fields in metadata
      Object.keys(entityData.metadata).forEach(fieldName => {
        if (fieldName === 'metadata_category') return

        const placementValidation = FieldPlacementPolicyDNA.validateFieldPlacement(fieldName)
        if (placementValidation.shouldUseDynamicData) {
          violations.push({
            field: fieldName,
            violation: `Business field '${fieldName}' found in metadata`,
            suggestion: placementValidation.suggestedAction
          })

          recommendations.push({
            action: 'move_to_dynamic_data',
            field: fieldName,
            reason: placementValidation.reason
          })
        }
      })
    }

    // Check for status fields anywhere
    const allFields = {
      ...entityData,
      ...(entityData.metadata || {}),
      ...(entityData.business_rules || {}),
      ...(entityData.attributes || {})
    }

    Object.keys(allFields).forEach(fieldName => {
      if (/^.*(status|state|lifecycle|workflow).*$/i.test(fieldName)) {
        violations.push({
          field: fieldName,
          violation: `Status field '${fieldName}' should not be stored in entity data`,
          suggestion: 'Use universal_transactions with relationship_type = "has_status"'
        })

        recommendations.push({
          action: 'move_to_transactions',
          field: fieldName,
          reason: 'Status/lifecycle fields must be modeled as relationships'
        })
      }
    })

    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Generate dynamic field suggestions from entity metadata
   */
  static generateDynamicFieldSuggestions(entityData: any): Array<{
    field_name: string
    suggested_type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json'
    current_value: any
    smart_code_suggestion: string
  }> {
    const suggestions: Array<any> = []

    if (entityData.metadata) {
      Object.entries(entityData.metadata).forEach(([fieldName, fieldValue]) => {
        if (fieldName === 'metadata_category') return

        const placementValidation = FieldPlacementPolicyDNA.validateFieldPlacement(fieldName)
        if (placementValidation.shouldUseDynamicData) {
          // Auto-detect field type
          let suggestedType: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json' = 'text'

          if (typeof fieldValue === 'number') {
            suggestedType = 'number'
          } else if (typeof fieldValue === 'boolean') {
            suggestedType = 'boolean'
          } else if (fieldValue instanceof Date) {
            suggestedType = 'datetime'
          } else if (typeof fieldValue === 'object' && fieldValue !== null) {
            suggestedType = 'json'
          }

          suggestions.push({
            field_name: fieldName,
            suggested_type: suggestedType,
            current_value: fieldValue,
            smart_code_suggestion: FieldPlacementPolicyDNA.generateSmartCodeForDynamicField(
              fieldName,
              'UNIVERSAL',
              'DYN'
            )
          })
        }
      })
    }

    return suggestions
  }

  /**
   * Express.js middleware for API validation
   */
  static createValidationMiddleware() {
    return (req: any, res: any, next: any) => {
      if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
        const validation = this.validateEntityData(req.body)

        if (!validation.isValid) {
          return res.status(400).json({
            error: 'field_placement_violation',
            message: 'Request violates HERA Field Placement Policy',
            violations: validation.violations,
            recommendations: validation.recommendations,
            policy_url: 'https://docs.hera.com/field-placement-policy'
          })
        }

        // Add suggestions to response context for client guidance
        if (validation.recommendations.length > 0) {
          req.heraFieldPlacementRecommendations = validation.recommendations
        }
      }

      next()
    }
  }
}

/**
 * Helper functions for common validation scenarios
 */
export const FieldPlacementValidationHelpers = {
  /**
   * Quick validation for API routes
   */
  validateQuick: (data: any) => {
    const validation = FieldPlacementValidator.validateEntityData(data)
    return {
      isValid: validation.isValid,
      errors: validation.violations.map(v => `${v.field}: ${v.violation}`)
    }
  },

  /**
   * Generate corrected entity data following policy
   */
  generateCorrectedEntityData: (originalData: any) => {
    const correctedData = { ...originalData }
    const dynamicFields: any[] = []

    // Move business fields from metadata to dynamic field suggestions
    if (correctedData.metadata) {
      const { metadata_category, ...otherMetadataFields } = correctedData.metadata

      Object.entries(otherMetadataFields).forEach(([fieldName, fieldValue]) => {
        const placementValidation = FieldPlacementPolicyDNA.validateFieldPlacement(fieldName)

        if (placementValidation.shouldUseDynamicData) {
          // Remove from metadata
          delete correctedData.metadata[fieldName]

          // Add to dynamic fields
          dynamicFields.push({
            field_name: fieldName,
            field_value: fieldValue,
            suggested_smart_code:
              FieldPlacementPolicyDNA.generateSmartCodeForDynamicField(fieldName)
          })
        }
      })

      // Keep metadata_category if it exists
      if (metadata_category) {
        correctedData.metadata = { metadata_category }
      } else {
        delete correctedData.metadata
      }
    }

    return {
      corrected_entity: correctedData,
      dynamic_fields_to_create: dynamicFields
    }
  }
}
