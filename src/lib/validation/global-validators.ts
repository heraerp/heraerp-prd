/**
 * HERA Global Validation System
 * Smart Code: HERA.PLATFORM.VALIDATION.GLOBAL.VALIDATORS.v1
 * 
 * Comprehensive validation functions for common business fields
 * Used across all HERA modules for consistent validation
 */

export type ValidationResult = string | null

// ============================================================================
// MULTI-COUNTRY BUSINESS VALIDATIONS (INDIA, UK, UAE)
// ============================================================================

/**
 * Indian PIN Code Validation
 * Format: 6 digits (e.g., 695001, 400001)
 */
export const validateIndianPinCode = (value: string): ValidationResult => {
  if (!value) return null
  
  const pinCodePattern = /^[1-9][0-9]{5}$/
  if (!pinCodePattern.test(value)) {
    return 'Enter a valid Indian PIN code (6 digits, e.g., 695001)'
  }
  
  // Additional validation for known invalid ranges
  const firstDigit = parseInt(value[0])
  if (firstDigit === 0) {
    return 'PIN code cannot start with 0'
  }
  
  return null
}

/**
 * Indian Phone Number Validation
 * Supports: +91, 91, or direct 10-digit mobile numbers
 */
export const validateIndianPhoneNumber = (value: string): ValidationResult => {
  if (!value) return null
  
  // Clean the input
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  
  // Pattern for Indian mobile numbers
  const patterns = [
    /^\+91[6-9]\d{9}$/,     // +91 format
    /^91[6-9]\d{9}$/,       // 91 format
    /^[6-9]\d{9}$/,         // Direct 10-digit
    /^0[6-9]\d{9}$/         // With leading 0
  ]
  
  const isValid = patterns.some(pattern => pattern.test(cleaned))
  
  if (!isValid) {
    return 'Enter a valid Indian mobile number (10 digits starting with 6-9, e.g., 9876543210)'
  }
  
  return null
}

/**
 * Indian Landline Number Validation
 * Format: STD code + number (e.g., 0471-2345678, 011-12345678)
 */
export const validateIndianLandline = (value: string): ValidationResult => {
  if (!value) return null
  
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  
  // Indian landline patterns
  const landlinePattern = /^0[1-9]\d{1,4}\d{6,8}$/
  
  if (!landlinePattern.test(cleaned)) {
    return 'Enter a valid Indian landline (e.g., 0471-2345678, 011-12345678)'
  }
  
  return null
}

/**
 * GST Number Validation (GSTIN)
 * Format: 15 characters (2-state code, 10-PAN, 1-entity code, 1-Z, 1-check digit)
 */
export const validateGSTNumber = (value: string): ValidationResult => {
  if (!value) return null
  
  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  
  if (!gstPattern.test(value.toUpperCase())) {
    return 'Enter a valid GST number (15 characters, e.g., 29ABCDE1234F1Z5)'
  }
  
  return null
}

// ============================================================================
// INTERNATIONAL VALIDATIONS
// ============================================================================

/**
 * Email Address Validation
 * Comprehensive email validation with business rules
 */
export const validateEmail = (value: string): ValidationResult => {
  if (!value) return null
  
  // Basic email pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailPattern.test(value)) {
    return 'Enter a valid email address (e.g., user@company.com)'
  }
  
  // Additional business rules
  if (value.length > 254) {
    return 'Email address is too long (maximum 254 characters)'
  }
  
  // Check for common typos
  const commonTypos = [
    'gmail.co', 'yahoo.co', 'hotmail.co', 'outlook.co',
    'gmai.com', 'yahooo.com', 'gmial.com'
  ]
  
  const domain = value.split('@')[1]?.toLowerCase()
  if (commonTypos.some(typo => domain?.includes(typo))) {
    return 'Please check the email domain for typos'
  }
  
  return null
}

/**
 * International Phone Number Validation
 * Supports country codes and various formats
 */
export const validateInternationalPhone = (value: string): ValidationResult => {
  if (!value) return null
  
  const cleaned = value.replace(/[\s\-\(\)\+]/g, '')
  
  // International phone pattern (7-15 digits)
  const internationalPattern = /^\d{7,15}$/
  
  if (!internationalPattern.test(cleaned)) {
    return 'Enter a valid phone number (7-15 digits with optional country code)'
  }
  
  return null
}

/**
 * URL Validation
 * Validates website URLs with proper protocol
 */
export const validateURL = (value: string): ValidationResult => {
  if (!value) return null
  
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'URL must use HTTP or HTTPS protocol'
    }
    
    if (!url.hostname.includes('.')) {
      return 'Enter a valid website URL (e.g., www.company.com)'
    }
    
    return null
  } catch {
    return 'Enter a valid website URL (e.g., https://www.company.com)'
  }
}

// ============================================================================
// BUSINESS FIELD VALIDATIONS
// ============================================================================

/**
 * Company/Entity Code Validation
 * Flexible format for business entity codes
 */
export const validateEntityCode = (value: string): ValidationResult => {
  if (!value) return null
  
  // Allow various business code formats
  const patterns = [
    /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}$/,    // Structured: PLT-KL-001
    /^[A-Z][A-Z0-9_-]{2,20}$/,             // Simple: PERUMPUZAH, PLANT_001
    /^[A-Z0-9]{3,10}$/                     // Alphanumeric: ABC123, PLANT1
  ]
  
  const isValid = patterns.some(pattern => pattern.test(value.toUpperCase()))
  
  if (!isValid) {
    return 'Use format like PLT-KL-001, PERUMPUZAH, or ABC123 (3-20 characters)'
  }
  
  return null
}

/**
 * Currency Amount Validation
 * Validates monetary amounts with proper formatting
 */
export const validateCurrencyAmount = (value: string): ValidationResult => {
  if (!value) return null
  
  const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
  
  if (isNaN(numericValue)) {
    return 'Enter a valid amount (e.g., 1000, 1000.50)'
  }
  
  if (numericValue < 0) {
    return 'Amount cannot be negative'
  }
  
  if (numericValue > 999999999) {
    return 'Amount is too large (maximum 999,999,999)'
  }
  
  // Check for too many decimal places
  const decimalPlaces = (value.split('.')[1] || '').length
  if (decimalPlaces > 2) {
    return 'Amount can have maximum 2 decimal places'
  }
  
  return null
}

/**
 * Percentage Validation
 * Validates percentage values (0-100%)
 */
export const validatePercentage = (value: string): ValidationResult => {
  if (!value) return null
  
  const numericValue = parseFloat(value.replace('%', ''))
  
  if (isNaN(numericValue)) {
    return 'Enter a valid percentage (e.g., 18, 18.5)'
  }
  
  if (numericValue < 0 || numericValue > 100) {
    return 'Percentage must be between 0 and 100'
  }
  
  return null
}

/**
 * Capacity/Quantity Validation
 * Validates quantities with units
 */
export const validateQuantity = (value: string, unit: string = ''): ValidationResult => {
  if (!value) return null
  
  const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
  
  if (isNaN(numericValue)) {
    return `Enter a valid quantity${unit ? ` in ${unit}` : ''} (e.g., 1000, 1000.5)`
  }
  
  if (numericValue <= 0) {
    return 'Quantity must be greater than 0'
  }
  
  if (numericValue > 999999999) {
    return 'Quantity is too large'
  }
  
  return null
}

// ============================================================================
// ADDRESS VALIDATIONS
// ============================================================================

/**
 * Indian State Validation
 * Validates against known Indian state codes
 */
export const validateIndianState = (value: string): ValidationResult => {
  if (!value) return null
  
  const validStates = [
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DN', 'DD', 'DL', 'GA', 'GJ', 
    'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 
    'NL', 'OR', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UT', 'WB'
  ]
  
  if (!validStates.includes(value.toUpperCase())) {
    return 'Please select a valid Indian state'
  }
  
  return null
}

/**
 * Address Line Validation
 * Validates address components
 */
export const validateAddressLine = (value: string, lineNumber: number = 1): ValidationResult => {
  if (!value && lineNumber === 1) {
    return 'Address line 1 is required'
  }
  
  if (value && value.length < 3) {
    return `Address line ${lineNumber} is too short (minimum 3 characters)`
  }
  
  if (value && value.length > 100) {
    return `Address line ${lineNumber} is too long (maximum 100 characters)`
  }
  
  return null
}

/**
 * City Name Validation
 * Validates city names with proper formatting
 */
export const validateCityName = (value: string): ValidationResult => {
  if (!value) return null
  
  if (value.length < 2) {
    return 'City name is too short (minimum 2 characters)'
  }
  
  if (value.length > 50) {
    return 'City name is too long (maximum 50 characters)'
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  const cityPattern = /^[a-zA-Z\s\-'\.]+$/
  if (!cityPattern.test(value)) {
    return 'City name can only contain letters, spaces, hyphens, and apostrophes'
  }
  
  return null
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Required Field Validation
 * Generic required field validator
 */
export const validateRequired = (value: string, fieldName: string = 'This field'): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Minimum Length Validation
 */
export const validateMinLength = (value: string, minLength: number, fieldName: string = 'This field'): ValidationResult => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`
  }
  return null
}

/**
 * Maximum Length Validation
 */
export const validateMaxLength = (value: string, maxLength: number, fieldName: string = 'This field'): ValidationResult => {
  if (value && value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`
  }
  return null
}

/**
 * Alphanumeric Validation
 */
export const validateAlphanumeric = (value: string, fieldName: string = 'This field'): ValidationResult => {
  if (!value) return null
  
  const alphanumericPattern = /^[a-zA-Z0-9\s]+$/
  if (!alphanumericPattern.test(value)) {
    return `${fieldName} can only contain letters, numbers, and spaces`
  }
  
  return null
}

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Create a composite validator that runs multiple validations
 */
export const createCompositeValidator = (...validators: Array<(value: string) => ValidationResult>) => {
  return (value: string): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value)
      if (result) return result
    }
    return null
  }
}

/**
 * Create a conditional validator
 */
export const createConditionalValidator = (
  condition: (value: string) => boolean,
  validator: (value: string) => ValidationResult
) => {
  return (value: string): ValidationResult => {
    if (condition(value)) {
      return validator(value)
    }
    return null
  }
}

// ============================================================================
// FIELD-SPECIFIC VALIDATORS (Ready to use)
// ============================================================================

export const FIELD_VALIDATORS = {
  // Contact Information
  email: validateEmail,
  phone_indian: validateIndianPhoneNumber,
  phone_international: validateInternationalPhone,
  landline_indian: validateIndianLandline,
  website: validateURL,
  
  // Address Fields
  address_line_1: (value: string) => validateAddressLine(value, 1),
  address_line_2: (value: string) => validateAddressLine(value, 2),
  city: validateCityName,
  state_indian: validateIndianState,
  pin_code_indian: validateIndianPinCode,
  
  // Business Fields
  entity_code: validateEntityCode,
  gst_number: validateGSTNumber,
  currency_amount: validateCurrencyAmount,
  percentage: validatePercentage,
  quantity: validateQuantity,
  
  // Generic Fields
  required: (fieldName: string) => (value: string) => validateRequired(value, fieldName),
  minLength: (min: number, fieldName: string) => (value: string) => validateMinLength(value, min, fieldName),
  maxLength: (max: number, fieldName: string) => (value: string) => validateMaxLength(value, max, fieldName),
  alphanumeric: (fieldName: string) => (value: string) => validateAlphanumeric(value, fieldName)
}

export default FIELD_VALIDATORS