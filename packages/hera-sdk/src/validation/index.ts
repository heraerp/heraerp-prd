/**
 * HERA SDK Validation - Smart Code and Organization Validation
 * Smart Code: HERA.SDK.VALIDATION.CORE.v1
 */

import { z } from 'zod'

/**
 * HERA Smart Code Regex Pattern
 * Format: HERA.MODULE.TYPE.SUBTYPE.v1
 */
export const HERA_SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

/**
 * Organization ID Regex Pattern (UUID)
 */
export const ORGANIZATION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validate HERA Smart Code format
 */
export function validateSmartCode(smartCode: string): boolean {
  return HERA_SMART_CODE_REGEX.test(smartCode)
}

/**
 * Validate Organization ID format
 */
export function validateOrganizationId(organizationId: string): boolean {
  return ORGANIZATION_ID_REGEX.test(organizationId)
}

/**
 * HERA Entity Schema (Zod validation)
 */
export const HeraEntitySchema = z.object({
  id: z.string().uuid().optional(),
  entity_type: z.string().min(1, 'Entity type is required'),
  entity_name: z.string().min(1, 'Entity name is required'),
  entity_description: z.string().optional(),
  smart_code: z.string().refine(validateSmartCode, {
    message: 'Invalid Smart Code format. Expected: HERA.MODULE.TYPE.SUBTYPE.v1'
  }),
  organization_id: z.string().refine(validateOrganizationId, {
    message: 'Invalid organization ID format'
  }),
  metadata: z.record(z.any()).optional()
})

/**
 * HERA Transaction Schema (Zod validation)
 */
export const HeraTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  transaction_type: z.string().min(1, 'Transaction type is required'),
  transaction_number: z.string().optional(),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  source_entity_id: z.string().uuid().optional(),
  target_entity_id: z.string().uuid().optional(),
  total_amount: z.number().min(0, 'Total amount must be non-negative'),
  transaction_currency_code: z.string().length(3, 'Currency code must be 3 characters'),
  transaction_status: z.string().optional(),
  smart_code: z.string().refine(validateSmartCode, {
    message: 'Invalid Smart Code format. Expected: HERA.MODULE.TYPE.SUBTYPE.v1'
  }),
  organization_id: z.string().refine(validateOrganizationId, {
    message: 'Invalid organization ID format'
  })
})

/**
 * HERA Dynamic Field Schema (Zod validation)
 */
export const HeraDynamicFieldSchema = z.object({
  id: z.string().uuid().optional(),
  entity_id: z.string().uuid('Invalid entity ID format'),
  field_name: z.string().min(1, 'Field name is required'),
  field_type: z.enum(['text', 'number', 'boolean', 'date', 'json', 'email', 'phone', 'url']),
  field_value_text: z.string().optional(),
  field_value_number: z.number().optional(),
  field_value_boolean: z.boolean().optional(),
  field_value_date: z.string().optional(),
  field_value_json: z.record(z.any()).optional(),
  smart_code: z.string().refine(validateSmartCode, {
    message: 'Invalid Smart Code format'
  }),
  organization_id: z.string().refine(validateOrganizationId, {
    message: 'Invalid organization ID format'
  })
})

/**
 * Validate entity data
 */
export function validateEntity(data: any) {
  return HeraEntitySchema.safeParse(data)
}

/**
 * Validate transaction data
 */
export function validateTransaction(data: any) {
  return HeraTransactionSchema.safeParse(data)
}

/**
 * Validate dynamic field data
 */
export function validateDynamicField(data: any) {
  return HeraDynamicFieldSchema.safeParse(data)
}

/**
 * Validation result helper
 */
export interface ValidationResult {
  success: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Comprehensive data validation
 */
export function validateHeraData(
  data: any, 
  type: 'entity' | 'transaction' | 'dynamic_field'
): ValidationResult {
  let result
  
  switch (type) {
    case 'entity':
      result = validateEntity(data)
      break
    case 'transaction':
      result = validateTransaction(data)
      break
    case 'dynamic_field':
      result = validateDynamicField(data)
      break
    default:
      return {
        success: false,
        errors: [`Unknown validation type: ${type}`]
      }
  }
  
  if (result.success) {
    return {
      success: true,
      errors: []
    }
  } else {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    }
  }
}