/**
 * Dynamic Data Helpers
 * 
 * Typed coercion and validation helpers for core_dynamic_data
 * Handles conversion between UI form data and Sacred Six storage format
 * Provides type-safe accessors for dynamic field values
 */

export type DynamicFieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'datetime' 
  | 'select' 
  | 'multiselect' 
  | 'json' 
  | 'file_url'

export interface DynamicFieldValue {
  field_name: string
  field_type: DynamicFieldType
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_json?: any
  field_value_date?: string
  smart_code: string
  validation_rules?: Record<string, any>
  field_order?: number
  is_required?: boolean
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
}

export interface TypedDynamicValue<T = any> {
  value: T
  type: DynamicFieldType
  smartCode: string
  isRequired: boolean
  validationRules: Record<string, any>
}

// Type-safe value extraction from dynamic fields
export const getDynamicValue = <T = any>(
  dynamicFields: DynamicFieldValue[],
  fieldName: string
): TypedDynamicValue<T> | null => {
  const field = dynamicFields.find(f => f.field_name === fieldName)
  if (!field) return null

  let value: any
  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'select':
    case 'file_url':
      value = field.field_value_text
      break
    case 'number':
      value = field.field_value_number
      break
    case 'boolean':
      value = field.field_value_boolean
      break
    case 'date':
    case 'datetime':
      value = field.field_value_date || field.field_value_text
      break
    case 'json':
    case 'multiselect':
      value = field.field_value_json
      break
    default:
      value = field.field_value_text
  }

  return {
    value: value as T,
    type: field.field_type,
    smartCode: field.smart_code,
    isRequired: field.is_required || false,
    validationRules: field.validation_rules || {}
  }
}

// Type-safe accessors for common field types
export const getStringValue = (
  dynamicFields: DynamicFieldValue[],
  fieldName: string
): string | null => {
  const field = getDynamicValue<string>(dynamicFields, fieldName)
  return field?.value || null
}

export const getNumberValue = (
  dynamicFields: DynamicFieldValue[],
  fieldName: string
): number | null => {
  const field = getDynamicValue<number>(dynamicFields, fieldName)
  return field?.value ?? null
}

export const getBooleanValue = (
  dynamicFields: DynamicFieldValue[],
  fieldName: string
): boolean | null => {
  const field = getDynamicValue<boolean>(dynamicFields, fieldName)
  return field?.value ?? null
}

export const getDateValue = (
  dynamicFields: DynamicFieldValue[],
  fieldName: string
): Date | null => {
  const field = getDynamicValue<string>(dynamicFields, fieldName)
  if (!field?.value) return null
  
  const date = new Date(field.value)
  return isNaN(date.getTime()) ? null : date
}

export const getJsonValue = <T = any>(
  dynamicFields: DynamicFieldValue[],
  fieldName: string
): T | null => {
  const field = getDynamicValue<T>(dynamicFields, fieldName)
  return field?.value ?? null
}

// Convert typed values to dynamic field format for storage
export const createDynamicField = (
  fieldName: string,
  value: any,
  fieldType: DynamicFieldType,
  smartCode: string,
  options: {
    validationRules?: Record<string, any>
    fieldOrder?: number
    isRequired?: boolean
  } = {}
): DynamicFieldValue => {
  const baseField: DynamicFieldValue = {
    field_name: fieldName,
    field_type: fieldType,
    smart_code: smartCode,
    validation_rules: options.validationRules,
    field_order: options.fieldOrder,
    is_required: options.isRequired
  }

  // Set the appropriate value field based on type
  switch (fieldType) {
    case 'text':
    case 'email':
    case 'phone':
    case 'select':
    case 'file_url':
      baseField.field_value_text = String(value)
      break
    case 'number':
      baseField.field_value_number = Number(value)
      break
    case 'boolean':
      baseField.field_value_boolean = Boolean(value)
      break
    case 'date':
    case 'datetime':
      if (value instanceof Date) {
        baseField.field_value_date = value.toISOString()
      } else {
        baseField.field_value_date = String(value)
      }
      break
    case 'json':
    case 'multiselect':
      baseField.field_value_json = value
      break
    default:
      baseField.field_value_text = String(value)
  }

  return baseField
}

// Coerce values to appropriate types based on field type
export const coerceValue = (
  value: any,
  fieldType: DynamicFieldType
): any => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  switch (fieldType) {
    case 'text':
    case 'email':
    case 'phone':
    case 'select':
    case 'file_url':
      return String(value)
    
    case 'number':
      const num = Number(value)
      return isNaN(num) ? null : num
    
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1'
      }
      return Boolean(value)
    
    case 'date':
    case 'datetime':
      if (value instanceof Date) return value
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    
    case 'json':
    case 'multiselect':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value
    
    default:
      return String(value)
  }
}

// Validate dynamic field value against its type and rules
export const validateDynamicValue = (
  field: DynamicFieldValue,
  value: any
): string | null => {
  const coercedValue = coerceValue(value, field.field_type)
  const rules = field.validation_rules || {}

  // Required validation
  if (field.is_required && (coercedValue === null || coercedValue === undefined)) {
    return `${field.field_name} is required`
  }

  // Skip other validations if value is empty and not required
  if (!field.is_required && (coercedValue === null || coercedValue === undefined)) {
    return null
  }

  // Type-specific validations
  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'select':
      const strValue = String(coercedValue)
      
      if (rules.minLength && strValue.length < rules.minLength) {
        return `${field.field_name} must be at least ${rules.minLength} characters`
      }
      
      if (rules.maxLength && strValue.length > rules.maxLength) {
        return `${field.field_name} must be no more than ${rules.maxLength} characters`
      }
      
      if (rules.regex && !new RegExp(rules.regex).test(strValue)) {
        return `${field.field_name} format is invalid`
      }
      
      if (rules.enum && !rules.enum.includes(strValue)) {
        return `${field.field_name} must be one of: ${rules.enum.join(', ')}`
      }
      break

    case 'number':
      const numValue = Number(coercedValue)
      
      if (rules.min !== undefined && numValue < rules.min) {
        return `${field.field_name} must be at least ${rules.min}`
      }
      
      if (rules.max !== undefined && numValue > rules.max) {
        return `${field.field_name} must be no more than ${rules.max}`
      }
      break

    case 'multiselect':
      if (Array.isArray(coercedValue) && rules.enum) {
        const invalidValues = coercedValue.filter(v => !rules.enum.includes(v))
        if (invalidValues.length > 0) {
          return `${field.field_name} contains invalid values: ${invalidValues.join(', ')}`
        }
      }
      break
  }

  return null
}

// Create batch dynamic fields for entity creation/update
export const createDynamicFieldsBatch = (
  formData: Record<string, any>,
  fieldDefinitions: Array<{
    name: string
    type: DynamicFieldType
    smartCode: string
    validationRules?: Record<string, any>
    fieldOrder?: number
    isRequired?: boolean
  }>
): DynamicFieldValue[] => {
  return fieldDefinitions
    .map(def => {
      const value = formData[def.name]
      if (value === undefined) return null

      return createDynamicField(
        def.name,
        value,
        def.type,
        def.smartCode,
        {
          validationRules: def.validationRules,
          fieldOrder: def.fieldOrder,
          isRequired: def.isRequired
        }
      )
    })
    .filter((field): field is DynamicFieldValue => field !== null)
}

// Convert dynamic fields to flat form data object
export const dynamicFieldsToObject = (
  dynamicFields: DynamicFieldValue[]
): Record<string, any> => {
  const result: Record<string, any> = {}

  dynamicFields.forEach(field => {
    const value = getDynamicValue(dynamicFields, field.field_name)?.value
    result[field.field_name] = value
  })

  return result
}

// Merge dynamic fields (useful for updates)
export const mergeDynamicFields = (
  existing: DynamicFieldValue[],
  updates: DynamicFieldValue[]
): DynamicFieldValue[] => {
  const merged = [...existing]

  updates.forEach(update => {
    const existingIndex = merged.findIndex(f => f.field_name === update.field_name)
    
    if (existingIndex >= 0) {
      // Update existing field
      merged[existingIndex] = { ...merged[existingIndex], ...update }
    } else {
      // Add new field
      merged.push(update)
    }
  })

  return merged.sort((a, b) => (a.field_order || 999) - (b.field_order || 999))
}

// Filter dynamic fields by criteria
export const filterDynamicFields = (
  dynamicFields: DynamicFieldValue[],
  criteria: {
    fieldType?: DynamicFieldType
    smartCodePattern?: RegExp
    isRequired?: boolean
    hasValue?: boolean
  }
): DynamicFieldValue[] => {
  return dynamicFields.filter(field => {
    if (criteria.fieldType && field.field_type !== criteria.fieldType) {
      return false
    }

    if (criteria.smartCodePattern && !criteria.smartCodePattern.test(field.smart_code)) {
      return false
    }

    if (criteria.isRequired !== undefined && field.is_required !== criteria.isRequired) {
      return false
    }

    if (criteria.hasValue) {
      const hasValue = field.field_value_text || 
                      field.field_value_number !== undefined || 
                      field.field_value_boolean !== undefined || 
                      field.field_value_json || 
                      field.field_value_date
      if (!hasValue) return false
    }

    return true
  })
}

// Error class for dynamic data operations
export class DynamicDataError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION_ERROR' | 'TYPE_COERCION_ERROR' | 'FIELD_NOT_FOUND',
    public fieldName?: string,
    public fieldType?: DynamicFieldType
  ) {
    super(message)
    this.name = 'DynamicDataError'
  }
}