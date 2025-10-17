/**
 * HERA CRM Validation Rules
 * Smart Code: HERA.CRM.CORE.VALIDATION.RULES.V1
 * 
 * Validation functions for CRM entities and operations
 * Ensures data integrity and business rule compliance
 */

import { CRM_ENTITY_DEFINITIONS, type CRMEntityDefinition, type CRMDynamicFieldDefinition } from './entity-definitions'
import { CRM_STATUS_VALUES } from './smart-codes'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

/**
 * Validate CRM entity data
 */
export function validateCRMEntity(
  entityType: keyof typeof CRM_ENTITY_DEFINITIONS,
  data: {
    entity_name: string
    dynamic_fields?: Record<string, { value: any; type: string }>
    metadata?: Record<string, any>
  }
): ValidationResult {
  const definition = CRM_ENTITY_DEFINITIONS[entityType]
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate entity name
  if (!data.entity_name || data.entity_name.trim().length === 0) {
    errors.push({
      field: 'entity_name',
      message: 'Entity name is required',
      code: 'REQUIRED_FIELD'
    })
  } else if (data.entity_name.length > 255) {
    errors.push({
      field: 'entity_name',
      message: 'Entity name must be 255 characters or less',
      code: 'MAX_LENGTH_EXCEEDED'
    })
  }

  // Validate required fields
  for (const requiredField of definition.required_fields) {
    if (requiredField === 'entity_name') continue // Already validated above
    
    const fieldValue = data.dynamic_fields?.[requiredField]?.value
    if (!fieldValue && fieldValue !== 0 && fieldValue !== false) {
      errors.push({
        field: requiredField,
        message: `${requiredField} is required`,
        code: 'REQUIRED_FIELD'
      })
    }
  }

  // Validate dynamic fields
  if (data.dynamic_fields) {
    for (const [fieldName, fieldData] of Object.entries(data.dynamic_fields)) {
      const fieldDef = definition.dynamic_fields.find(f => f.field_name === fieldName)
      
      if (!fieldDef) {
        warnings.push({
          field: fieldName,
          message: `Field '${fieldName}' is not defined for ${entityType}`,
          code: 'UNDEFINED_FIELD'
        })
        continue
      }

      const fieldErrors = validateDynamicField(fieldDef, fieldData.value)
      errors.push(...fieldErrors.map(error => ({ ...error, field: fieldName })))
    }
  }

  // Entity-specific validations
  const entityErrors = validateEntitySpecificRules(entityType, data)
  errors.push(...entityErrors)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate dynamic field value
 */
export function validateDynamicField(
  fieldDef: CRMDynamicFieldDefinition,
  value: any
): ValidationError[] {
  const errors: ValidationError[] = []

  // Required field validation
  if (fieldDef.required && (value === null || value === undefined || value === '')) {
    errors.push({
      field: fieldDef.field_name,
      message: `${fieldDef.display_name} is required`,
      code: 'REQUIRED_FIELD'
    })
    return errors // Don't validate further if required field is missing
  }

  // Skip validation if value is empty and field is not required
  if (!fieldDef.required && (value === null || value === undefined || value === '')) {
    return errors
  }

  // Type validation
  const typeError = validateFieldType(fieldDef.field_type, value)
  if (typeError) {
    errors.push({
      field: fieldDef.field_name,
      message: typeError,
      code: 'INVALID_TYPE'
    })
    return errors // Don't validate further if type is wrong
  }

  // Validation rules
  if (fieldDef.validation_rules) {
    const rules = fieldDef.validation_rules

    // String validations
    if (fieldDef.field_type === 'text' && typeof value === 'string') {
      if (rules.min_length && value.length < rules.min_length) {
        errors.push({
          field: fieldDef.field_name,
          message: `${fieldDef.display_name} must be at least ${rules.min_length} characters`,
          code: 'MIN_LENGTH'
        })
      }
      
      if (rules.max_length && value.length > rules.max_length) {
        errors.push({
          field: fieldDef.field_name,
          message: `${fieldDef.display_name} must be ${rules.max_length} characters or less`,
          code: 'MAX_LENGTH'
        })
      }
      
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push({
          field: fieldDef.field_name,
          message: `${fieldDef.display_name} format is invalid`,
          code: 'INVALID_FORMAT'
        })
      }
      
      if (rules.options && !rules.options.includes(value)) {
        errors.push({
          field: fieldDef.field_name,
          message: `${fieldDef.display_name} must be one of: ${rules.options.join(', ')}`,
          code: 'INVALID_OPTION'
        })
      }
    }

    // Number validations
    if (fieldDef.field_type === 'number' && typeof value === 'number') {
      if (rules.min_value !== undefined && value < rules.min_value) {
        errors.push({
          field: fieldDef.field_name,
          message: `${fieldDef.display_name} must be at least ${rules.min_value}`,
          code: 'MIN_VALUE'
        })
      }
      
      if (rules.max_value !== undefined && value > rules.max_value) {
        errors.push({
          field: fieldDef.field_name,
          message: `${fieldDef.display_name} must be ${rules.max_value} or less`,
          code: 'MAX_VALUE'
        })
      }
    }
  }

  return errors
}

/**
 * Validate field type
 */
function validateFieldType(expectedType: string, value: any): string | null {
  switch (expectedType) {
    case 'text':
      return typeof value === 'string' ? null : 'Must be a text value'
    
    case 'number':
      return typeof value === 'number' && !isNaN(value) ? null : 'Must be a valid number'
    
    case 'boolean':
      return typeof value === 'boolean' ? null : 'Must be true or false'
    
    case 'date':
      if (typeof value === 'string') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? 'Must be a valid date' : null
      }
      return value instanceof Date ? null : 'Must be a valid date'
    
    case 'json':
      try {
        if (typeof value === 'string') {
          JSON.parse(value)
        } else if (typeof value === 'object') {
          JSON.stringify(value)
        }
        return null
      } catch {
        return 'Must be valid JSON'
      }
    
    default:
      return null
  }
}

/**
 * Entity-specific validation rules
 */
function validateEntitySpecificRules(
  entityType: keyof typeof CRM_ENTITY_DEFINITIONS,
  data: any
): ValidationError[] {
  const errors: ValidationError[] = []

  switch (entityType) {
    case 'CONTACT':
      return validateContact(data)
    
    case 'OPPORTUNITY':
      return validateOpportunity(data)
    
    case 'LEAD':
      return validateLead(data)
    
    case 'ACCOUNT':
      return validateAccount(data)
    
    case 'TASK':
      return validateTask(data)
    
    default:
      return errors
  }
}

/**
 * Contact-specific validations
 */
function validateContact(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  const dynamicFields = data.dynamic_fields || {}

  // Email validation
  const email = dynamicFields.email?.value
  if (email && typeof email === 'string') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL'
      })
    }
  }

  // Phone number validation (basic)
  const phone = dynamicFields.phone?.value
  if (phone && typeof phone === 'string') {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      errors.push({
        field: 'phone',
        message: 'Phone number must be at least 10 digits',
        code: 'INVALID_PHONE'
      })
    }
  }

  // Contact role validation
  const role = dynamicFields.contact_role?.value
  if (role && !Object.values(CRM_STATUS_VALUES.CONTACT_ROLES).includes(role)) {
    errors.push({
      field: 'contact_role',
      message: `Contact role must be one of: ${Object.values(CRM_STATUS_VALUES.CONTACT_ROLES).join(', ')}`,
      code: 'INVALID_CONTACT_ROLE'
    })
  }

  return errors
}

/**
 * Opportunity-specific validations
 */
function validateOpportunity(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  const dynamicFields = data.dynamic_fields || {}

  // Amount validation
  const amount = dynamicFields.amount?.value
  if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
    errors.push({
      field: 'amount',
      message: 'Opportunity amount must be a positive number',
      code: 'INVALID_AMOUNT'
    })
  }

  // Probability validation
  const probability = dynamicFields.probability?.value
  if (probability !== undefined) {
    if (typeof probability !== 'number' || probability < 0 || probability > 100) {
      errors.push({
        field: 'probability',
        message: 'Probability must be between 0 and 100',
        code: 'INVALID_PROBABILITY'
      })
    }
  }

  // Close date validation
  const closeDate = dynamicFields.close_date?.value
  if (closeDate) {
    const date = new Date(closeDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) {
      errors.push({
        field: 'close_date',
        message: 'Close date cannot be in the past',
        code: 'INVALID_CLOSE_DATE'
      })
    }
  }

  // Stage validation
  const stage = dynamicFields.stage?.value
  if (stage && !Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES).includes(stage)) {
    errors.push({
      field: 'stage',
      message: `Stage must be one of: ${Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES).join(', ')}`,
      code: 'INVALID_STAGE'
    })
  }

  return errors
}

/**
 * Lead-specific validations
 */
function validateLead(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  const dynamicFields = data.dynamic_fields || {}

  // Lead score validation
  const score = dynamicFields.score?.value
  if (score !== undefined) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      errors.push({
        field: 'score',
        message: 'Lead score must be between 0 and 100',
        code: 'INVALID_SCORE'
      })
    }
  }

  // Budget validation
  const budget = dynamicFields.budget?.value
  if (budget !== undefined && (typeof budget !== 'number' || budget < 0)) {
    errors.push({
      field: 'budget',
      message: 'Budget must be a positive number',
      code: 'INVALID_BUDGET'
    })
  }

  // Status validation
  const status = dynamicFields.status?.value
  if (status && !Object.values(CRM_STATUS_VALUES.LEAD_STATUS).includes(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${Object.values(CRM_STATUS_VALUES.LEAD_STATUS).join(', ')}`,
      code: 'INVALID_STATUS'
    })
  }

  return errors
}

/**
 * Account-specific validations
 */
function validateAccount(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  const dynamicFields = data.dynamic_fields || {}

  // Website validation
  const website = dynamicFields.website?.value
  if (website && typeof website === 'string') {
    try {
      new URL(website)
    } catch {
      errors.push({
        field: 'website',
        message: 'Website must be a valid URL',
        code: 'INVALID_URL'
      })
    }
  }

  // Annual revenue validation
  const revenue = dynamicFields.annual_revenue?.value
  if (revenue !== undefined && (typeof revenue !== 'number' || revenue < 0)) {
    errors.push({
      field: 'annual_revenue',
      message: 'Annual revenue must be a positive number',
      code: 'INVALID_REVENUE'
    })
  }

  // Employee count validation
  const employees = dynamicFields.employee_count?.value
  if (employees !== undefined && (typeof employees !== 'number' || employees < 1 || !Number.isInteger(employees))) {
    errors.push({
      field: 'employee_count',
      message: 'Employee count must be a positive integer',
      code: 'INVALID_EMPLOYEE_COUNT'
    })
  }

  return errors
}

/**
 * Task-specific validations
 */
function validateTask(data: any): ValidationError[] {
  const errors: ValidationError[] = []
  const dynamicFields = data.dynamic_fields || {}

  // Due date validation
  const dueDate = dynamicFields.due_date?.value
  if (dueDate) {
    const date = new Date(dueDate)
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'due_date',
        message: 'Due date must be a valid date',
        code: 'INVALID_DATE'
      })
    }
  }

  // Priority validation
  const priority = dynamicFields.priority?.value
  if (priority && !Object.values(CRM_STATUS_VALUES.TASK_PRIORITY).includes(priority)) {
    errors.push({
      field: 'priority',
      message: `Priority must be one of: ${Object.values(CRM_STATUS_VALUES.TASK_PRIORITY).join(', ')}`,
      code: 'INVALID_PRIORITY'
    })
  }

  return errors
}

/**
 * Validate relationship creation
 */
export function validateCRMRelationship(
  relationshipType: string,
  sourceEntityId: string,
  targetEntityId: string
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Basic validations
  if (!sourceEntityId) {
    errors.push({
      field: 'source_entity_id',
      message: 'Source entity ID is required',
      code: 'REQUIRED_FIELD'
    })
  }

  if (!targetEntityId) {
    errors.push({
      field: 'target_entity_id',
      message: 'Target entity ID is required',
      code: 'REQUIRED_FIELD'
    })
  }

  if (sourceEntityId === targetEntityId) {
    errors.push({
      field: 'target_entity_id',
      message: 'Cannot create relationship with same entity',
      code: 'SELF_RELATIONSHIP'
    })
  }

  if (!relationshipType) {
    errors.push({
      field: 'relationship_type',
      message: 'Relationship type is required',
      code: 'REQUIRED_FIELD'
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Utility functions
 */

// Check if entity name might be a duplicate
export function checkPotentialDuplicate(entityName: string, entityType: string): boolean {
  // Simple heuristic - in a real implementation, this would check against existing entities
  const normalizedName = entityName.toLowerCase().trim()
  
  // Check for common duplicate patterns
  const duplicatePatterns = [
    /\(copy\)/i,
    /\(duplicate\)/i,
    /\s+copy$/i,
    /\s+\d+$/,  // Names ending with numbers
  ]

  return duplicatePatterns.some(pattern => pattern.test(normalizedName))
}

// Sanitize input data
export function sanitizeCRMInput(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data }

  // Trim string values
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim()
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeCRMInput(value)
    }
  }

  return sanitized
}

// Format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => error.message)
}

// Get field validation rules for UI
export function getFieldValidationRules(
  entityType: keyof typeof CRM_ENTITY_DEFINITIONS,
  fieldName: string
): CRMDynamicFieldDefinition | null {
  const definition = CRM_ENTITY_DEFINITIONS[entityType]
  return definition.dynamic_fields.find(f => f.field_name === fieldName) || null
}