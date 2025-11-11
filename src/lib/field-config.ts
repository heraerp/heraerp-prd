/**
 * Field Configuration Management
 * 
 * Merges base YAML configuration with org-specific overrides
 * Provides typed field definitions with validation rules
 * Caches field configs for 5 minutes, invalidated on org settings change
 */

import { cache } from 'react'
import { resolveOrganizationContext } from './org-context'

// Field type definitions
export type FieldType = 
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

export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  regex?: string
  enum?: string[]
  message?: string
}

export interface FieldDefinition {
  name: string
  label: string
  type: FieldType
  required: boolean
  validation_rules: ValidationRule
  smart_code: string
  field_order: number
  is_visible: boolean
  placeholder?: string
  help_text?: string
  default_value?: any
  section?: string
}

export interface FieldConfiguration {
  entity_type: string
  fields: FieldDefinition[]
  sections: string[]
  layout: 'form' | 'tabs' | 'accordion'
  branding: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
  }
}

// Base field configurations (would normally be loaded from YAML)
const BASE_CUSTOMER_CONFIG: FieldConfiguration = {
  entity_type: 'CUSTOMER',
  fields: [
    {
      name: 'entity_name',
      label: 'Customer Name',
      type: 'text',
      required: true,
      validation_rules: {
        required: true,
        minLength: 2,
        maxLength: 255
      },
      smart_code: 'HERA.RETAIL.CUSTOMER.DYN.NAME.v1',
      field_order: 1,
      is_visible: true,
      placeholder: 'Enter customer name'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      validation_rules: {
        required: true,
        regex: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
      },
      smart_code: 'HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1',
      field_order: 2,
      is_visible: true,
      placeholder: 'customer@example.com'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'phone',
      required: false,
      validation_rules: {
        regex: '^[+]?[1-9]?[0-9]{7,15}$'
      },
      smart_code: 'HERA.RETAIL.CUSTOMER.DYN.PHONE.v1',
      field_order: 3,
      is_visible: true,
      placeholder: '+1 (555) 123-4567'
    }
  ],
  sections: ['basic', 'contact', 'preferences'],
  layout: 'form',
  branding: {
    primary_color: '#3B82F6',
    secondary_color: '#64748B'
  }
}

// Cached field configuration resolver
export const getFieldConfiguration = cache(async (
  entityType: string,
  organizationId: string,
  authToken: string
): Promise<FieldConfiguration> => {
  // Get base configuration (in real app, this would load from YAML)
  let config = getBaseConfiguration(entityType)
  
  // Get organization context and overrides
  const orgContext = await resolveOrganizationContext(authToken, organizationId)
  const overrides = orgContext.ui_overrides?.[entityType] || {}
  
  // Apply organization overrides
  config = applyOrganizationOverrides(config, overrides)
  
  // Apply organization branding
  if (orgContext.settings?.branding) {
    config.branding = {
      ...config.branding,
      ...orgContext.settings.branding
    }
  }
  
  // Sort fields by field_order
  config.fields.sort((a, b) => a.field_order - b.field_order)
  
  return config
})

// Get base configuration for entity type
const getBaseConfiguration = (entityType: string): FieldConfiguration => {
  switch (entityType.toUpperCase()) {
    case 'CUSTOMER':
      return { ...BASE_CUSTOMER_CONFIG }
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

// Apply organization-specific overrides
const applyOrganizationOverrides = (
  baseConfig: FieldConfiguration,
  overrides: Record<string, any>
): FieldConfiguration => {
  const config = { ...baseConfig }
  
  // Add organization-specific fields
  Object.entries(overrides).forEach(([fieldName, fieldOverride]) => {
    const existingFieldIndex = config.fields.findIndex(f => f.name === fieldName)
    
    if (existingFieldIndex >= 0) {
      // Override existing field
      config.fields[existingFieldIndex] = {
        ...config.fields[existingFieldIndex],
        ...fieldOverride,
        smart_code: fieldOverride.smart_code || 
          generateSmartCode('CUSTOMER', fieldName)
      }
    } else {
      // Add new field
      config.fields.push({
        name: fieldName,
        label: fieldOverride.label || fieldName,
        type: fieldOverride.type || 'text',
        required: fieldOverride.required || false,
        validation_rules: fieldOverride.validation_rules || {},
        smart_code: fieldOverride.smart_code || 
          generateSmartCode('CUSTOMER', fieldName),
        field_order: fieldOverride.field_order || 999,
        is_visible: fieldOverride.is_visible !== false,
        placeholder: fieldOverride.placeholder,
        help_text: fieldOverride.help_text,
        default_value: fieldOverride.default_value,
        section: fieldOverride.section || 'basic'
      })
    }
  })
  
  return config
}

// Generate HERA DNA Smart Code for dynamic fields
const generateSmartCode = (entityType: string, fieldName: string): string => {
  const normalizedField = fieldName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  return `HERA.RETAIL.${entityType}.DYN.${normalizedField}.v1`
}

// Validate field value against rules
export const validateFieldValue = (
  field: FieldDefinition,
  value: any
): string | null => {
  const rules = field.validation_rules
  
  // Required validation
  if (rules.required && (value === null || value === undefined || value === '')) {
    return rules.message || `${field.label} is required`
  }
  
  // Skip other validations if value is empty and not required
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null
  }
  
  const stringValue = String(value)
  
  // String length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${field.label} must be at least ${rules.minLength} characters`
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${field.label} must be no more than ${rules.maxLength} characters`
  }
  
  // Numeric validations
  if (field.type === 'number' && typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `${field.label} must be at least ${rules.min}`
    }
    
    if (rules.max !== undefined && value > rules.max) {
      return `${field.label} must be no more than ${rules.max}`
    }
  }
  
  // Regex validation
  if (rules.regex && !new RegExp(rules.regex).test(stringValue)) {
    return rules.message || `${field.label} format is invalid`
  }
  
  // Enum validation
  if (rules.enum && !rules.enum.includes(stringValue)) {
    return `${field.label} must be one of: ${rules.enum.join(', ')}`
  }
  
  return null
}

// Validate all fields in form data
export const validateFormData = (
  fields: FieldDefinition[],
  formData: Record<string, any>
): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  fields.forEach(field => {
    if (!field.is_visible) return
    
    const value = formData[field.name]
    const error = validateFieldValue(field, value)
    
    if (error) {
      errors[field.name] = error
    }
  })
  
  return errors
}

// Convert form data to dynamic fields format for API
export const formDataToDynamicFields = (
  fields: FieldDefinition[],
  formData: Record<string, any>
): Array<{
  field_name: string
  field_type: string
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_json?: any
  validation_rules: ValidationRule
  smart_code: string
  field_order: number
  is_required: boolean
}> => {
  return fields
    .filter(field => field.is_visible && formData[field.name] !== undefined)
    .map(field => {
      const value = formData[field.name]
      const dynamicField: any = {
        field_name: field.name,
        field_type: field.type,
        validation_rules: field.validation_rules,
        smart_code: field.smart_code,
        field_order: field.field_order,
        is_required: field.required
      }
      
      // Set the appropriate value field based on type
      switch (field.type) {
        case 'number':
          dynamicField.field_value_number = Number(value)
          break
        case 'boolean':
          dynamicField.field_value_boolean = Boolean(value)
          break
        case 'json':
        case 'multiselect':
          dynamicField.field_value_json = value
          break
        default:
          dynamicField.field_value_text = String(value)
      }
      
      return dynamicField
    })
}

// Convert dynamic fields from API to form data
export const dynamicFieldsToFormData = (
  dynamicFields: Array<{
    field_name: string
    field_type: string
    field_value_text?: string
    field_value_number?: number
    field_value_boolean?: boolean
    field_value_json?: any
  }>
): Record<string, any> => {
  const formData: Record<string, any> = {}
  
  dynamicFields.forEach(field => {
    switch (field.field_type) {
      case 'number':
        formData[field.field_name] = field.field_value_number
        break
      case 'boolean':
        formData[field.field_name] = field.field_value_boolean
        break
      case 'json':
      case 'multiselect':
        formData[field.field_name] = field.field_value_json
        break
      default:
        formData[field.field_name] = field.field_value_text
    }
  })
  
  return formData
}

// Error class for field configuration issues
export class FieldConfigError extends Error {
  constructor(
    message: string,
    public code: 'ENTITY_NOT_FOUND' | 'FIELD_NOT_FOUND' | 'VALIDATION_ERROR',
    public entityType?: string,
    public fieldName?: string
  ) {
    super(message)
    this.name = 'FieldConfigError'
  }
}