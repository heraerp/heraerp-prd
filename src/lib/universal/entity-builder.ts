// src/lib/universal/entity-builder.ts
// HERA Entity Builder - Self-Assembling Entity Handler
// Dynamically generates validation schemas and creates entities based on Smart Code DNA

import { z, ZodSchema } from 'zod'
import { serverSupabase } from './supabase'
import {
  guardSmartCode,
  guardOrganization,
  normalizeEntityType,
  validateSmartCodeSegment,
  parseSmartCode,
  GuardrailViolation,
  UUID
} from './guardrails'

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

export interface EntityCreationResult {
  entity_id: string
  smart_code: string
  entity_type: string
  entity_name: string
  normalized_type?: string
  metadata?: Record<string, any>
  procedures_executed?: string[]
  gl_posted?: boolean
  validation_errors?: Array<{ field: string; message: string }>
}

export interface DynamicEntitySchema {
  smart_code: string
  base_schema: ZodSchema
  field_schemas: FieldSchema[]
  required_fields: string[]
  optional_fields: string[]
}

export interface FieldSchema {
  field_name: string
  field_type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'enum' | 'boolean' | 'json'
  required: boolean
  validations: {
    min_length?: number
    max_length?: number
    min_value?: number
    max_value?: number
    pattern?: string
    allowed_values?: string[]
    error_message?: string
  }
}

export interface UCRRule {
  rule_type: string
  rule_definition: any
  rule_config: {
    required_fields?: string[]
    optional_fields?: string[]
    validations?: FieldSchema[]
  }
}

export interface Procedure {
  procedure_name: string
  database_function: string
  procedure_type: string
  execution_order: number
}

// ================================================================================
// ENTITY BUILDER CLASS
// ================================================================================

export class EntityBuilder {
  /**
   * Build dynamic Zod schema from UCR rules
   */
  static async buildSchema(smartCode: string, orgId: string): Promise<DynamicEntitySchema> {
    guardSmartCode(smartCode)
    guardOrganization(orgId)
    // Fix #1: Use validateSmartCodeSegment instead of validateSmartCodeType
    validateSmartCodeSegment(smartCode, 2, 'ENT') // segment 2 is typically the type

    const supabase = serverSupabase()

    // Load UCR bundle
    const { loadUCRBundle } = await import('./ucr-loader')
    const bundle = await loadUCRBundle(smartCode, orgId)

    if (!bundle) {
      // No bundle found, return basic schema
      return {
        smart_code: smartCode,
        base_schema: z.object({
          p_organization_id: UUID,
          p_smart_code: z.string(),
          p_entity_name: z.string().min(1).max(500),
          p_entity_type: z.string().optional(),
          p_entity_code: z.string().optional(),
          p_entity_description: z.string().optional(),
          p_parent_entity_id: UUID.optional()
        }),
        field_schemas: [],
        required_fields: [],
        optional_fields: []
      }
    }

    const rules = bundle.rules || {}

    // Extract field schemas and required/optional fields from UCR bundle
    const fieldSchemas: FieldSchema[] = []
    const requiredFields: string[] = []
    const optionalFields: string[] = []

    // Convert UCR field rules to internal FieldSchema format
    if (rules.fields) {
      for (const [fieldName, fieldRule] of Object.entries(rules.fields)) {
        // Skip parameter fields (start with p_)
        if (fieldName.startsWith('p_')) continue

        const fieldSchema: FieldSchema = {
          field_name: fieldName,
          field_type: this.mapFieldType(fieldRule.type),
          required: typeof fieldRule.required === 'boolean' ? fieldRule.required : false,
          validations: {
            min_length: fieldRule.length?.min,
            max_length: fieldRule.length?.max,
            min_value: fieldRule.min,
            max_value: fieldRule.max,
            pattern: fieldRule.regex,
            allowed_values: fieldRule.enum,
            error_message: fieldRule.description
          }
        }

        fieldSchemas.push(fieldSchema)

        if (fieldRule.required === true) {
          requiredFields.push(fieldName)
        } else {
          optionalFields.push(fieldName)
        }
      }
    }

    // Build base schema with universal fields
    let schemaShape: Record<string, ZodSchema> = {
      p_organization_id: UUID,
      p_smart_code: z.string(),
      p_entity_name: z.string().min(1).max(500),
      p_entity_type: z.string().optional(),
      p_entity_code: z.string().optional(),
      p_entity_description: z.string().optional(),
      p_parent_entity_id: UUID.optional()
    }

    // Add dynamic fields from UCR rules
    for (const fieldSchema of fieldSchemas) {
      const validator = this.buildFieldValidator(fieldSchema)

      if (fieldSchema.required) {
        schemaShape[fieldSchema.field_name] = validator
      } else {
        schemaShape[fieldSchema.field_name] = validator.optional()
      }
    }

    const base_schema = z.object(schemaShape)

    return {
      smart_code,
      base_schema,
      field_schemas: fieldSchemas,
      required_fields: [...new Set(requiredFields)],
      optional_fields: [...new Set(optionalFields)]
    }
  }

  /**
   * Map UCR field type to internal field type
   */
  private static mapFieldType(ucrType: string): FieldSchema['field_type'] {
    switch (ucrType) {
      case 'text':
        return 'text'
      case 'number':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'date':
        return 'date'
      case 'json':
        return 'json'
      default:
        return 'text'
    }
  }

  /**
   * Build field validator from field schema
   */
  private static buildFieldValidator(fieldSchema: FieldSchema): ZodSchema {
    let validator: ZodSchema

    switch (fieldSchema.field_type) {
      case 'text':
        validator = z.string()
        if (fieldSchema.validations.min_length) {
          validator = (validator as z.ZodString).min(fieldSchema.validations.min_length)
        }
        if (fieldSchema.validations.max_length) {
          validator = (validator as z.ZodString).max(fieldSchema.validations.max_length)
        }
        if (fieldSchema.validations.pattern) {
          validator = (validator as z.ZodString).regex(
            new RegExp(fieldSchema.validations.pattern),
            fieldSchema.validations.error_message
          )
        }
        break

      case 'number':
        validator = z.number()
        if (fieldSchema.validations.min_value !== undefined) {
          validator = (validator as z.ZodNumber).min(fieldSchema.validations.min_value)
        }
        if (fieldSchema.validations.max_value !== undefined) {
          validator = (validator as z.ZodNumber).max(fieldSchema.validations.max_value)
        }
        break

      case 'email':
        validator = z.string().email(fieldSchema.validations.error_message || 'Invalid email')
        break

      case 'phone':
        validator = z
          .string()
          .regex(
            /^\+?[1-9]\d{1,14}$/,
            fieldSchema.validations.error_message || 'Invalid phone number'
          )
        break

      case 'date':
        // Fix #9: Use coerce for better date handling
        validator = z.coerce.date()
        break

      case 'enum':
        if (
          fieldSchema.validations.allowed_values &&
          fieldSchema.validations.allowed_values.length > 0
        ) {
          validator = z.enum(fieldSchema.validations.allowed_values as [string, ...string[]])
        } else {
          validator = z.string()
        }
        break

      case 'boolean':
        validator = z.boolean()
        break

      case 'json':
        validator = z.any()
        break

      default:
        validator = z.any()
    }

    return validator
  }

  /**
   * Validate data against UCR rules
   */
  private static async validateAgainstRules(
    smartCode: string,
    orgId: string,
    data: Record<string, any>
  ): Promise<{ valid: boolean; errors: Array<{ field: string; message: string }> }> {
    const supabase = serverSupabase()

    // Get validation rules
    const { data: rulesData, error: rulesError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('organization_id', orgId)
      .eq('smart_code', smartCode)
      .eq('field_name', 'ucr_rule')
      .single()

    if (rulesError && rulesError.code !== 'PGRST116') {
      return { valid: true, errors: [] } // No rules found, pass validation
    }

    const rules: UCRRule[] = rulesData?.field_value_json || []
    const errors: Array<{ field: string; message: string }> = []

    // Execute validation rules
    for (const rule of rules) {
      if (rule.rule_type === 'validation') {
        // Check required fields
        if (rule.rule_config.required_fields) {
          for (const field of rule.rule_config.required_fields) {
            if (!data[field]) {
              errors.push({ field, message: `${field} is required` })
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if approval is required
   */
  private static async checkApprovalRequired(
    smartCode: string,
    orgId: string,
    data: Record<string, any>
  ): Promise<{ requires_approval: boolean; approver_roles?: string[] }> {
    const supabase = serverSupabase()

    // Get approval rules
    const { data: rulesData, error: rulesError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('organization_id', orgId)
      .eq('smart_code', smartCode)
      .eq('field_name', 'ucr_rule')
      .single()

    if (rulesError && rulesError.code !== 'PGRST116') {
      return { requires_approval: false }
    }

    const rules: UCRRule[] = rulesData?.field_value_json || []

    // Check for approval rules
    for (const rule of rules) {
      if (rule.rule_type === 'approval') {
        return {
          requires_approval: true,
          approver_roles: rule.rule_definition.approver_roles || []
        }
      }
    }

    return { requires_approval: false }
  }

  /**
   * Get procedures for an action
   */
  private static async getProcedures(
    smartCode: string,
    orgId: string,
    action: 'create' | 'update' | 'delete'
  ): Promise<Procedure[]> {
    const supabase = serverSupabase()

    // Get procedures from core_dynamic_data
    const { data: proceduresData, error: proceduresError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('organization_id', orgId)
      .eq('smart_code', smartCode)
      .eq('field_name', 'procedures')
      .single()

    if (proceduresError && proceduresError.code !== 'PGRST116') {
      return []
    }

    const allProcedures: Procedure[] = proceduresData?.field_value_json || []

    // Filter by action and sort by execution order
    return allProcedures
      .filter(p => p.procedure_type === action)
      .sort((a, b) => a.execution_order - b.execution_order)
  }

  /**
   * Create entity with auto-validation and procedure execution
   */
  static async create(data: Record<string, any>, orgId: string): Promise<EntityCreationResult> {
    const smartCode = data.p_smart_code
    guardSmartCode(smartCode)
    guardOrganization(orgId)
    // Fix #1: Use validateSmartCodeSegment
    validateSmartCodeSegment(smartCode, 2, 'ENT')

    const supabase = serverSupabase()
    const procedures_executed: string[] = []

    try {
      // 1. Validate against UCR rules
      const validation = await this.validateAgainstRules(smartCode, orgId, data)
      if (!validation.valid) {
        throw new GuardrailViolation('VALIDATION_FAILED', 'Entity validation failed', {
          errors: validation.errors
        })
      }

      // 2. Validate against dynamic schema
      const dynamicSchema = await this.buildSchema(smartCode, orgId)
      const validated = dynamicSchema.base_schema.parse(data)

      // 3. Normalize entity type (prevent schema drift)
      // Fix #6: Use parseSmartCode from guardrails
      const parsed = parseSmartCode(smartCode)
      const entityType = validated.p_entity_type ?? parsed.segments[3]?.toLowerCase() ?? 'entity'
      const { normalized, metadata: normalizationMetadata } = normalizeEntityType(entityType)

      // 4. Check if approval is required
      const approval = await this.checkApprovalRequired(smartCode, orgId, validated)
      if (approval.requires_approval) {
        // Create entity in "pending_approval" status
        validated.status = 'pending_approval'
        validated.approval_required_by = approval.approver_roles
      }

      // 5. Get procedures to execute
      const procedures = await this.getProcedures(smartCode, orgId, 'create')

      // 6. Execute procedures in order
      let result: any = null
      for (const procedure of procedures) {
        // Fix #4: Use database_function instead of rpc_function
        const { data: procResult, error } = await supabase.rpc(procedure.database_function, {
          ...validated,
          p_entity_type: normalized,
          p_metadata: {
            ...validated.p_metadata,
            ...normalizationMetadata,
            original_entity_type: entityType !== normalized ? entityType : undefined
          },
          p_previous_result: result
        })

        if (error) {
          throw new Error(`Procedure ${procedure.procedure_name} failed: ${error.message}`)
        }

        result = procResult
        procedures_executed.push(procedure.procedure_name)
      }

      // 7. If no procedures, use default entity upsert
      if (procedures.length === 0) {
        const { data: entityResult, error } = await supabase.rpc('hera_entity_upsert_v1', {
          p_organization_id: orgId,
          p_entity_type: normalized,
          p_entity_name: validated.p_entity_name,
          p_smart_code: smartCode,
          p_entity_code: validated.p_entity_code,
          p_entity_description: validated.p_entity_description,
          p_parent_entity_id: validated.p_parent_entity_id
        })

        if (error) {
          throw new Error(`Entity creation failed: ${error.message}`)
        }

        result = entityResult
      }

      // 8. Store dynamic fields in core_dynamic_data
      const dynamicFields = Object.entries(validated).filter(
        ([key]) =>
          !key.startsWith('p_') && dynamicSchema.field_schemas.some(f => f.field_name === key)
      )

      if (dynamicFields.length > 0 && result?.entity_id) {
        await this.storeDynamicFields(result.entity_id, orgId, smartCode, dynamicFields)
      }

      return {
        entity_id: result?.entity_id || result?.id,
        smart_code: smartCode,
        entity_type: normalized,
        entity_name: validated.p_entity_name,
        normalized_type: entityType !== normalized ? normalized : undefined,
        metadata: result?.metadata,
        procedures_executed,
        gl_posted: false // Will be handled by Finance DNA
      }
    } catch (error) {
      if (error instanceof GuardrailViolation) {
        throw error
      }
      throw new Error(`Entity creation failed: ${error.message}`)
    }
  }

  /**
   * Update entity with validation
   */
  static async update(
    entityId: string,
    data: Record<string, any>,
    orgId: string
  ): Promise<EntityCreationResult> {
    guardOrganization(orgId)

    const supabase = serverSupabase()

    // 1. Get existing entity to retrieve smart code
    const { data: existingData, error: readError } = await supabase.rpc('hera_entity_read_v1', {
      p_entity_id: entityId,
      p_organization_id: orgId
    })

    if (readError) {
      throw new Error('Entity not found')
    }

    // Fix #8: Handle array returns from RPC
    const existing = Array.isArray(existingData) ? existingData[0] : existingData

    if (!existing) {
      throw new Error('Entity not found')
    }

    const smartCode = existing.smart_code
    guardSmartCode(smartCode)
    // Fix #1: Use validateSmartCodeSegment
    validateSmartCodeSegment(smartCode, 2, 'ENT')

    // 2. Validate updates against UCR rules
    const validation = await this.validateAgainstRules(smartCode, orgId, data)
    if (!validation.valid) {
      throw new GuardrailViolation('VALIDATION_FAILED', 'Entity update validation failed', {
        errors: validation.errors
      })
    }

    // 3. Get update procedures
    const procedures = await this.getProcedures(smartCode, orgId, 'update')
    const procedures_executed: string[] = []

    // 4. Execute update procedures
    let result: any = null
    for (const procedure of procedures) {
      // Fix #4: Use database_function
      const { data: procResult, error } = await supabase.rpc(procedure.database_function, {
        p_entity_id: entityId,
        p_organization_id: orgId,
        ...data,
        p_previous_result: result
      })

      if (error) {
        throw new Error(`Update procedure ${procedure.procedure_name} failed: ${error.message}`)
      }

      result = procResult
      procedures_executed.push(procedure.procedure_name)
    }

    // 5. If no procedures, use default update
    if (procedures.length === 0) {
      const { data: updateResult, error } = await supabase.rpc('hera_entity_upsert_v1', {
        p_entity_id: entityId,
        p_organization_id: orgId,
        p_entity_type: data.p_entity_type || existing.entity_type,
        p_entity_name: data.p_entity_name || existing.entity_name,
        p_smart_code: smartCode,
        p_entity_code: data.p_entity_code,
        p_entity_description: data.p_entity_description,
        p_parent_entity_id: data.p_parent_entity_id
      })

      if (error) {
        throw new Error(`Entity update failed: ${error.message}`)
      }

      result = updateResult
    }

    return {
      entity_id: entityId,
      smart_code: smartCode,
      entity_type: result?.entity_type || existing.entity_type,
      entity_name: result?.entity_name || existing.entity_name,
      procedures_executed,
      gl_posted: false
    }
  }

  /**
   * Delete entity with procedures
   */
  static async delete(
    entityId: string,
    orgId: string
  ): Promise<{ success: boolean; procedures_executed: string[] }> {
    guardOrganization(orgId)

    const supabase = serverSupabase()

    // 1. Get entity to retrieve smart code
    const { data: existingData, error: readError } = await supabase.rpc('hera_entity_read_v1', {
      p_entity_id: entityId,
      p_organization_id: orgId
    })

    if (readError) {
      throw new Error('Entity not found')
    }

    // Fix #8: Handle array returns
    const existing = Array.isArray(existingData) ? existingData[0] : existingData

    if (!existing) {
      throw new Error('Entity not found')
    }

    const smartCode = existing.smart_code
    guardSmartCode(smartCode)

    // 2. Get delete procedures
    const procedures = await this.getProcedures(smartCode, orgId, 'delete')
    const procedures_executed: string[] = []

    // 3. Execute delete procedures
    for (const procedure of procedures) {
      // Fix #4: Use database_function
      const { error } = await supabase.rpc(procedure.database_function, {
        p_entity_id: entityId,
        p_organization_id: orgId
      })

      if (error) {
        throw new Error(`Delete procedure ${procedure.procedure_name} failed: ${error.message}`)
      }

      procedures_executed.push(procedure.procedure_name)
    }

    // 4. If no procedures, use default delete
    if (procedures.length === 0) {
      const { error } = await supabase.rpc('hera_entity_delete_v1', {
        p_entity_id: entityId,
        p_organization_id: orgId
      })

      if (error) {
        throw new Error(`Entity deletion failed: ${error.message}`)
      }
    }

    return {
      success: true,
      procedures_executed
    }
  }

  /**
   * Store dynamic fields in core_dynamic_data
   */
  private static async storeDynamicFields(
    entityId: string,
    orgId: string,
    smartCode: string,
    fields: Array<[string, any]>
  ): Promise<void> {
    const supabase = serverSupabase()

    const fieldData = fields.map(([field_name, value]) => {
      const field_type = this.inferFieldType(value)

      return {
        entity_id: entityId,
        field_name,
        field_type,
        field_value: field_type === 'text' ? value : null,
        field_value_number: field_type === 'number' ? value : null,
        field_value_boolean: field_type === 'boolean' ? value : null,
        field_value_date: field_type === 'date' ? value : null,
        field_value_json: field_type === 'json' ? value : null
      }
    })

    // Fix #7: Use p_items instead of p_fields
    const { error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
      p_organization_id: orgId,
      p_entity_id: entityId,
      p_items: fieldData,
      p_smart_code: smartCode
    })

    if (error) {
      console.error('[EntityBuilder] Failed to store dynamic fields:', error)
      throw new Error(`Failed to store dynamic fields: ${error.message}`)
    }
  }

  /**
   * Infer field type from value
   */
  private static inferFieldType(value: any): 'text' | 'number' | 'boolean' | 'date' | 'json' {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'string') {
      // Check if it's a date
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date'
      return 'text'
    }
    return 'json'
  }

  /**
   * Get entity with dynamic fields populated
   */
  static async get(entityId: string, orgId: string): Promise<any> {
    guardOrganization(orgId)

    const supabase = serverSupabase()

    // Get entity
    const { data: entityData, error: entityError } = await supabase.rpc('hera_entity_read_v1', {
      p_entity_id: entityId,
      p_organization_id: orgId
    })

    if (entityError) {
      throw new Error(`Failed to get entity: ${entityError.message}`)
    }

    // Fix #8: Handle array returns
    const entity = Array.isArray(entityData) ? entityData[0] : entityData

    if (!entity) {
      throw new Error('Entity not found')
    }

    // Get dynamic fields
    const { data: dynamicFields, error: fieldsError } = await supabase.rpc(
      'hera_dynamic_data_get_v1',
      {
        p_entity_id: entityId,
        p_organization_id: orgId
      }
    )

    if (fieldsError) {
      console.error('[EntityBuilder] Failed to get dynamic fields:', fieldsError)
    }

    // Merge dynamic fields into entity
    if (dynamicFields && Array.isArray(dynamicFields)) {
      for (const field of dynamicFields) {
        const value =
          field.field_value_number ??
          field.field_value_boolean ??
          field.field_value_date ??
          field.field_value_json ??
          field.field_value
        entity[field.field_name] = value
      }
    }

    return entity
  }
}

export default EntityBuilder
