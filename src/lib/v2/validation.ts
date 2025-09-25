/**
 * HERA V2 Validation Utilities
 *
 * Centralized validation functions for V2 API endpoints
 * Provides schema validation, business rule enforcement, and error formatting
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'

// Standard validation response interface
export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validates data against a Zod schema and returns standardized result
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)

    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    }

    const errors: ValidationError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code
    }))

    return {
      success: false,
      errors
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'schema',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        code: 'VALIDATION_ERROR'
      }]
    }
  }
}

/**
 * Validates and returns a NextResponse with standardized error format
 */
export function validateSchemaWithResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> | NextResponse {
  const validation = validateSchema(schema, data)

  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      context: context || 'request_validation',
      validation_errors: validation.errors
    }, { status: 400 })
  }

  return validation
}

/**
 * Organization ID validation
 */
export const organizationIdSchema = z.string().uuid('Invalid organization ID format')

/**
 * Entity ID validation
 */
export const entityIdSchema = z.string().uuid('Invalid entity ID format')

/**
 * Smart Code validation
 */
export const smartCodeSchema = z.string()
  .min(1, 'Smart code is required')
  .regex(/^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*){5,}\.V\d+$/,
    'Smart code must follow HERA pattern: UPPERCASE segments separated by dots, ending with .V{number}')

/**
 * Common request validation schemas
 */
export const baseRequestSchema = z.object({
  organization_id: organizationIdSchema
})

export const entityRequestSchema = baseRequestSchema.extend({
  entity_type: z.string().min(1, 'Entity type is required'),
  entity_name: z.string().min(1, 'Entity name is required'),
  smart_code: smartCodeSchema
})

export const relationshipRequestSchema = baseRequestSchema.extend({
  from_entity_id: entityIdSchema,
  to_entity_id: entityIdSchema,
  relationship_type: z.string().min(1, 'Relationship type is required'),
  smart_code: smartCodeSchema
})

/**
 * Transaction validation schemas
 */
export const transactionRequestSchema = baseRequestSchema.extend({
  transaction_type: z.string().min(1, 'Transaction type is required'),
  transaction_date: z.string().datetime('Invalid transaction date format'),
  smart_code: smartCodeSchema,
  total_amount: z.number().optional(),
  lines: z.array(z.object({
    line_number: z.number().min(1),
    entity_id: entityIdSchema.optional(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
    line_amount: z.number(),
    smart_code: smartCodeSchema
  })).optional()
})

/**
 * Query parameter validation
 */
export const queryParamsSchema = z.object({
  organization_id: organizationIdSchema,
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
  include_inactive: z.coerce.boolean().optional().default(false)
})

/**
 * Utility function to extract and validate organization ID from request
 */
export function extractOrganizationId(searchParams: URLSearchParams): ValidationResult<string> {
  const orgId = searchParams.get('organization_id')

  if (!orgId) {
    return {
      success: false,
      errors: [{
        field: 'organization_id',
        message: 'Organization ID is required',
        code: 'REQUIRED'
      }]
    }
  }

  return validateSchema(organizationIdSchema, orgId)
}

/**
 * Business rule validation utilities
 */
export class BusinessRuleValidator {
  /**
   * Validates that entity exists and belongs to organization
   */
  static async validateEntityAccess(
    supabase: any,
    entityId: string,
    organizationId: string
  ): Promise<ValidationResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .select('id')
        .eq('id', entityId)
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) {
        return {
          success: false,
          errors: [{
            field: 'entity_id',
            message: 'Entity not found or access denied',
            code: 'ENTITY_ACCESS_DENIED'
          }]
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'entity_validation',
          message: 'Failed to validate entity access',
          code: 'VALIDATION_ERROR'
        }]
      }
    }
  }

  /**
   * Validates smart code format and business context
   */
  static validateSmartCodeContext(smartCode: string, context: string): ValidationResult<boolean> {
    // Basic format validation
    const schemaValidation = validateSchema(smartCodeSchema, smartCode)
    if (!schemaValidation.success) {
      return schemaValidation
    }

    // Context-specific validation
    const segments = smartCode.split('.')
    const expectedContext = context.toLowerCase()

    // Check if smart code matches expected context
    if (expectedContext === 'transaction' && !segments.some(s => ['TXN', 'TRANSACTION'].includes(s))) {
      return {
        success: false,
        errors: [{
          field: 'smart_code',
          message: 'Smart code should contain transaction context (TXN or TRANSACTION)',
          code: 'SMART_CODE_CONTEXT_MISMATCH'
        }]
      }
    }

    if (expectedContext === 'relationship' && !segments.some(s => ['REL', 'RELATIONSHIP'].includes(s))) {
      return {
        success: false,
        errors: [{
          field: 'smart_code',
          message: 'Smart code should contain relationship context (REL or RELATIONSHIP)',
          code: 'SMART_CODE_CONTEXT_MISMATCH'
        }]
      }
    }

    return { success: true, data: true }
  }
}

/**
 * Error response helper
 */
export function createErrorResponse(
  message: string,
  errors?: ValidationError[],
  status = 400
): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    validation_errors: errors,
    timestamp: new Date().toISOString()
  }, { status })
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  metadata?: Record<string, any>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    metadata,
    timestamp: new Date().toISOString()
  })
}