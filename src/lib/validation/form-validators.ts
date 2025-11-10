/**
 * HERA Form Validation Utilities
 * Smart Code: HERA.PLATFORM.VALIDATION.FORM.UTILITIES.v1
 * 
 * Helper functions for form validation across HERA modules
 */

import { FIELD_VALIDATORS } from './global-validators'

// ============================================================================
// FORM FIELD VALIDATION HELPERS
// ============================================================================

/**
 * Validate form section data against field definitions
 */
export const validateFormSection = (
  formData: Record<string, any>,
  fields: Array<{
    id: string
    required?: boolean
    validation?: (value: string) => string | null
  }>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  
  fields.forEach(field => {
    const value = formData[field.id] || ''
    
    // Check required fields
    if (field.required && !value.trim()) {
      errors[field.id] = `${field.id.replace(/_/g, ' ')} is required`
      return
    }
    
    // Run custom validation if provided
    if (field.validation && value) {
      const validationError = field.validation(value)
      if (validationError) {
        errors[field.id] = validationError
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Create field validators for common patterns
 */
export const createFieldValidator = {
  required: (fieldName: string) => (value: string) => 
    FIELD_VALIDATORS.required(fieldName)(value),
    
  email: () => FIELD_VALIDATORS.email,
  
  phone: (type: 'indian' | 'international' = 'indian') => 
    type === 'indian' ? FIELD_VALIDATORS.phone_indian : FIELD_VALIDATORS.phone_international,
    
  address: (lineNumber: number = 1) => 
    lineNumber === 1 ? FIELD_VALIDATORS.address_line_1 : FIELD_VALIDATORS.address_line_2,
    
  amount: () => FIELD_VALIDATORS.currency_amount,
  
  quantity: (unit?: string) => (value: string) => 
    FIELD_VALIDATORS.quantity(value, unit),
    
  entityCode: () => FIELD_VALIDATORS.entity_code,
  
  indianPostal: () => FIELD_VALIDATORS.pin_code_indian,
  
  indianState: () => FIELD_VALIDATORS.state_indian,
  
  city: () => FIELD_VALIDATORS.city,
  
  percentage: () => FIELD_VALIDATORS.percentage,
  
  gst: () => FIELD_VALIDATORS.gst_number,
  
  url: () => FIELD_VALIDATORS.website
}

/**
 * Validation error message formatters
 */
export const formatValidationError = (fieldId: string, error: string) => {
  const fieldName = fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return `${fieldName}: ${error}`
}

/**
 * Validation helpers for specific business contexts
 */
export const BUSINESS_VALIDATORS = {
  // Manufacturing specific
  manufacturingCapacity: (value: string) => {
    const result = FIELD_VALIDATORS.quantity(value, 'units per day')
    if (result) return result
    
    const numValue = parseFloat(value)
    if (numValue < 1) return 'Manufacturing capacity must be at least 1 unit per day'
    if (numValue > 1000000) return 'Manufacturing capacity seems unrealistic (max 1,000,000)'
    
    return null
  },
  
  // Storage specific  
  storageCapacity: (value: string) => {
    const result = FIELD_VALIDATORS.quantity(value, 'KG')
    if (result) return result
    
    const numValue = parseFloat(value)
    if (numValue < 10) return 'Storage capacity must be at least 10 KG'
    if (numValue > 10000000) return 'Storage capacity seems unrealistic (max 10,000,000 KG)'
    
    return null
  },
  
  // Area specific
  facilityArea: (value: string) => {
    const result = FIELD_VALIDATORS.quantity(value, 'Sq Ft')
    if (result) return result
    
    const numValue = parseFloat(value)
    if (numValue < 100) return 'Facility area must be at least 100 Sq Ft'
    if (numValue > 10000000) return 'Facility area seems unrealistic (max 10,000,000 Sq Ft)'
    
    return null
  },
  
  // Employee count
  employeeCount: (value: string) => {
    const result = FIELD_VALIDATORS.quantity(value, 'employees')
    if (result) return result
    
    const numValue = parseFloat(value)
    if (numValue < 1) return 'Must have at least 1 employee'
    if (numValue > 100000) return 'Employee count seems unrealistic (max 100,000)'
    if (!Number.isInteger(numValue)) return 'Employee count must be a whole number'
    
    return null
  },
  
  // Location coordinates
  latitude: (value: string) => {
    if (!value) return null
    const num = parseFloat(value)
    if (isNaN(num)) return 'Latitude must be a number'
    if (num < -90 || num > 90) return 'Latitude must be between -90 and 90'
    return null
  },
  
  longitude: (value: string) => {
    if (!value) return null
    const num = parseFloat(value)
    if (isNaN(num)) return 'Longitude must be a number'
    if (num < -180 || num > 180) return 'Longitude must be between -180 and 180'
    return null
  }
}

/**
 * Validation rule builders for different entity types
 */
export const buildValidationRules = {
  location: () => ({
    location_code: createFieldValidator.entityCode(),
    location_name: createFieldValidator.required('Location Name'),
    address_line_1: createFieldValidator.address(1),
    city: createFieldValidator.city(),
    postal_code: createFieldValidator.indianPostal(),
    state: createFieldValidator.indianState(),
    contact_phone: createFieldValidator.phone('indian'),
    contact_email: createFieldValidator.email(),
    total_area_sqft: BUSINESS_VALIDATORS.facilityArea,
    storage_capacity_kg: BUSINESS_VALIDATORS.storageCapacity,
    processing_capacity_kg_day: BUSINESS_VALIDATORS.manufacturingCapacity
  }),
  
  customer: () => ({
    customer_code: createFieldValidator.entityCode(),
    customer_name: createFieldValidator.required('Customer Name'),
    email: createFieldValidator.email(),
    phone: createFieldValidator.phone('indian'),
    gst_number: createFieldValidator.gst(),
    address_line_1: createFieldValidator.address(1),
    city: createFieldValidator.city(),
    postal_code: createFieldValidator.indianPostal(),
    state: createFieldValidator.indianState()
  }),
  
  vendor: () => ({
    vendor_code: createFieldValidator.entityCode(),
    vendor_name: createFieldValidator.required('Vendor Name'),
    email: createFieldValidator.email(),
    phone: createFieldValidator.phone('indian'),
    gst_number: createFieldValidator.gst(),
    website: createFieldValidator.url(),
    address_line_1: createFieldValidator.address(1),
    city: createFieldValidator.city(),
    postal_code: createFieldValidator.indianPostal(),
    state: createFieldValidator.indianState()
  }),
  
  product: () => ({
    product_code: createFieldValidator.entityCode(),
    product_name: createFieldValidator.required('Product Name'),
    price: createFieldValidator.amount(),
    weight_kg: (value: string) => FIELD_VALIDATORS.quantity(value, 'KG'),
    dimensions: createFieldValidator.required('Dimensions')
  }),
  
  employee: () => ({
    employee_code: createFieldValidator.entityCode(),
    full_name: createFieldValidator.required('Full Name'),
    email: createFieldValidator.email(),
    phone: createFieldValidator.phone('indian'),
    address_line_1: createFieldValidator.address(1),
    city: createFieldValidator.city(),
    postal_code: createFieldValidator.indianPostal(),
    state: createFieldValidator.indianState()
  })
}

/**
 * Export the main validation system
 */
export { FIELD_VALIDATORS }
export default FIELD_VALIDATORS