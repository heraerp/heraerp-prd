/**
 * HERA Configuration-Driven Validation System v2
 * Smart Code: HERA.PLATFORM.VALIDATION.CONFIG.DRIVEN.v2
 * 
 * Dynamic validation system that loads configurations from HERA Platform Organization
 * Enables runtime configuration updates without deployments
 */

import { heraConfigService, ConfigLoaders } from '@/lib/config/hera-config-service'
import type { CountryValidationConfig } from '@/lib/config/config-types'

// Static fallback import for offline/emergency scenarios
import staticValidationConfig from '@/config/validation/countries.json'

export type ValidationResult = string | null
export type CountryCode = 'IN' | 'GB' | 'AE'

// Configuration cache for performance
let cachedValidationConfig: CountryValidationConfig | null = null
let configLoadPromise: Promise<CountryValidationConfig> | null = null

// ============================================================================
// DYNAMIC CONFIGURATION LOADER
// ============================================================================

/**
 * Load validation configuration dynamically from Platform Organization
 * Uses caching for performance and fallback for reliability
 */
async function loadValidationConfig(actorId: string): Promise<CountryValidationConfig> {
  // Return cached config if available
  if (cachedValidationConfig) {
    return cachedValidationConfig
  }

  // Return existing promise if already loading
  if (configLoadPromise) {
    return configLoadPromise
  }

  // Create new loading promise
  configLoadPromise = (async () => {
    try {
      console.log('🔄 HERA Validation: Loading configuration from Platform org')
      
      // Load configuration from HERA Config Service
      const dynamicConfig = await ConfigLoaders.loadValidationCountries(actorId)
      
      if (dynamicConfig && dynamicConfig.countries) {
        console.log('✅ HERA Validation: Dynamic configuration loaded successfully')
        cachedValidationConfig = dynamicConfig
        return dynamicConfig
      } else {
        console.warn('⚠️ HERA Validation: No dynamic configuration found, using static fallback')
        cachedValidationConfig = staticValidationConfig as CountryValidationConfig
        return cachedValidationConfig
      }
    } catch (error) {
      console.error('❌ HERA Validation: Failed to load dynamic configuration:', error)
      console.log('🔄 HERA Validation: Falling back to static configuration')
      cachedValidationConfig = staticValidationConfig as CountryValidationConfig
      return cachedValidationConfig
    } finally {
      configLoadPromise = null
    }
  })()

  return configLoadPromise
}

/**
 * Get country configuration by country code (dynamic)
 */
export const getCountryConfig = async (countryCode: CountryCode, actorId: string) => {
  const config = await loadValidationConfig(actorId)
  return config.countries[countryCode]
}

/**
 * Get country configuration by country code (synchronous with cache)
 * Use this when you already have loaded the configuration
 */
export const getCountryConfigSync = (countryCode: CountryCode) => {
  if (!cachedValidationConfig) {
    console.warn('⚠️ HERA Validation: No cached config, using static fallback')
    return (staticValidationConfig as CountryValidationConfig).countries[countryCode]
  }
  return cachedValidationConfig.countries[countryCode]
}

/**
 * Get all supported countries (dynamic)
 */
export const getSupportedCountries = async (actorId: string) => {
  const config = await loadValidationConfig(actorId)
  return Object.values(config.countries).map(country => ({
    code: country.code,
    name: country.name,
    currency: country.currency,
    currency_symbol: country.currency_symbol
  }))
}

/**
 * Get all supported countries (synchronous with cache)
 */
export const getSupportedCountriesSync = () => {
  const config = cachedValidationConfig || (staticValidationConfig as CountryValidationConfig)
  return Object.values(config.countries).map(country => ({
    code: country.code,
    name: country.name,
    currency: country.currency,
    currency_symbol: country.currency_symbol
  }))
}

/**
 * Get validation rules (dynamic)
 */
export const getValidationRules = async (actorId: string) => {
  const config = await loadValidationConfig(actorId)
  return config.validation_rules
}

/**
 * Get validation rules (synchronous with cache)
 */
export const getValidationRulesSync = () => {
  const config = cachedValidationConfig || (staticValidationConfig as CountryValidationConfig)
  return config.validation_rules
}

/**
 * Get business context rules (dynamic)
 */
export const getBusinessContext = async (context: string, actorId: string) => {
  const config = await loadValidationConfig(actorId)
  return config.business_contexts[context] || config.business_contexts.manufacturing
}

/**
 * Get business context rules (synchronous with cache)
 */
export const getBusinessContextSync = (context: string) => {
  const config = cachedValidationConfig || (staticValidationConfig as CountryValidationConfig)
  return config.business_contexts[context] || config.business_contexts.manufacturing
}

/**
 * Pre-load validation configuration for better performance
 * Call this during application initialization
 */
export const preloadValidationConfig = async (actorId: string): Promise<void> => {
  try {
    await loadValidationConfig(actorId)
    console.log('✅ HERA Validation: Configuration preloaded successfully')
  } catch (error) {
    console.error('❌ HERA Validation: Failed to preload configuration:', error)
  }
}

/**
 * Refresh validation configuration (force reload from database)
 */
export const refreshValidationConfig = async (actorId: string): Promise<void> => {
  console.log('🔄 HERA Validation: Refreshing configuration from Platform org')
  
  // Clear cache and loading promise
  cachedValidationConfig = null
  configLoadPromise = null
  
  // Force reload
  await loadValidationConfig(actorId)
  
  console.log('✅ HERA Validation: Configuration refreshed successfully')
}

/**
 * Subscribe to configuration changes for real-time updates
 */
export const subscribeToConfigChanges = (actorId: string, callback?: () => void) => {
  return heraConfigService.subscribeToConfigChanges('VALIDATION_COUNTRIES', (newConfig) => {
    console.log('🔔 HERA Validation: Configuration updated, refreshing cache')
    
    // Update cache with new configuration
    cachedValidationConfig = newConfig
    
    // Notify callback if provided
    if (callback) {
      callback()
    }
  })
}

/**
 * Check if dynamic configuration is available
 */
export const isDynamicConfigAvailable = (): boolean => {
  return cachedValidationConfig !== null && cachedValidationConfig !== staticValidationConfig
}

// ============================================================================
// PHONE NUMBER VALIDATION (ASYNC & SYNC VERSIONS)
// ============================================================================

/**
 * Validate phone number based on country (async with dynamic config)
 */
export const validatePhoneByCountry = async (
  value: string, 
  countryCode: CountryCode, 
  actorId: string
): Promise<ValidationResult> => {
  if (!value) return null
  
  const config = await getCountryConfig(countryCode, actorId)
  if (!config) return 'Unsupported country'
  
  // Clean the input
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  
  // Test against country-specific patterns
  const isValid = config.phone.patterns.some(pattern => 
    new RegExp(pattern.pattern).test(cleaned)
  )
  
  if (!isValid) {
    return config.phone.error_message
  }
  
  return null
}

/**
 * Validate phone number based on country (sync with cached config)
 */
export const validatePhoneByCountrySync = (value: string, countryCode: CountryCode): ValidationResult => {
  if (!value) return null
  
  const config = getCountryConfigSync(countryCode)
  if (!config) return 'Unsupported country'
  
  // Clean the input
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  
  // Test against country-specific patterns
  const isValid = config.phone.patterns.some(pattern => 
    new RegExp(pattern.pattern).test(cleaned)
  )
  
  if (!isValid) {
    return config.phone.error_message
  }
  
  return null
}

/**
 * Validate landline number based on country (async with dynamic config)
 */
export const validateLandlineByCountry = async (
  value: string, 
  countryCode: CountryCode, 
  actorId: string
): Promise<ValidationResult> => {
  if (!value) return null
  
  const config = await getCountryConfig(countryCode, actorId)
  if (!config || !config.phone.landline_pattern) return 'Landline validation not supported for this country'
  
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  const pattern = new RegExp(config.phone.landline_pattern)
  
  if (!pattern.test(cleaned)) {
    return `Enter a valid ${config.name} landline number`
  }
  
  return null
}

/**
 * Validate landline number based on country (sync with cached config)
 */
export const validateLandlineByCountrySync = (value: string, countryCode: CountryCode): ValidationResult => {
  if (!value) return null
  
  const config = getCountryConfigSync(countryCode)
  if (!config || !config.phone.landline_pattern) return 'Landline validation not supported for this country'
  
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  const pattern = new RegExp(config.phone.landline_pattern)
  
  if (!pattern.test(cleaned)) {
    return `Enter a valid ${config.name} landline number`
  }
  
  return null
}

// ============================================================================
// POSTAL CODE VALIDATION (ASYNC & SYNC VERSIONS)
// ============================================================================

/**
 * Validate postal code based on country (async with dynamic config)
 */
export const validatePostalCodeByCountry = async (
  value: string, 
  countryCode: CountryCode, 
  actorId: string
): Promise<ValidationResult> => {
  const config = await getCountryConfig(countryCode, actorId)
  if (!config) return 'Unsupported country'
  
  // Check if postal code is required for this country
  if (config.postal_code.required === false && !value) {
    return null
  }
  
  if (!value && config.postal_code.required !== false) {
    return `Postal code is required for ${config.name}`
  }
  
  const pattern = new RegExp(config.postal_code.pattern)
  if (!pattern.test(value.toUpperCase())) {
    return config.postal_code.error_message
  }
  
  return null
}

/**
 * Validate postal code based on country (sync with cached config)
 */
export const validatePostalCodeByCountrySync = (value: string, countryCode: CountryCode): ValidationResult => {
  const config = getCountryConfigSync(countryCode)
  if (!config) return 'Unsupported country'
  
  // Check if postal code is required for this country
  if (config.postal_code.required === false && !value) {
    return null
  }
  
  if (!value && config.postal_code.required !== false) {
    return `Postal code is required for ${config.name}`
  }
  
  const pattern = new RegExp(config.postal_code.pattern)
  if (!pattern.test(value.toUpperCase())) {
    return config.postal_code.error_message
  }
  
  return null
}

// ============================================================================
// STATE/REGION VALIDATION (ASYNC & SYNC VERSIONS)
// ============================================================================

/**
 * Validate state/region based on country (async with dynamic config)
 */
export const validateStateByCountry = async (
  value: string, 
  countryCode: CountryCode, 
  actorId: string
): Promise<ValidationResult> => {
  if (!value) return null
  
  const config = await getCountryConfig(countryCode, actorId)
  if (!config) return 'Unsupported country'
  
  const validStates = config.states.map(state => state.code)
  if (!validStates.includes(value.toUpperCase())) {
    return `Please select a valid state/region for ${config.name}`
  }
  
  return null
}

/**
 * Validate state/region based on country (sync with cached config)
 */
export const validateStateByCountrySync = (value: string, countryCode: CountryCode): ValidationResult => {
  if (!value) return null
  
  const config = getCountryConfigSync(countryCode)
  if (!config) return 'Unsupported country'
  
  const validStates = config.states.map(state => state.code)
  if (!validStates.includes(value.toUpperCase())) {
    return `Please select a valid state/region for ${config.name}`
  }
  
  return null
}

/**
 * Get states/regions for a country (async with dynamic config)
 */
export const getStatesByCountry = async (countryCode: CountryCode, actorId: string) => {
  const config = await getCountryConfig(countryCode, actorId)
  return config?.states || []
}

/**
 * Get states/regions for a country (sync with cached config)
 */
export const getStatesByCountrySync = (countryCode: CountryCode) => {
  const config = getCountryConfigSync(countryCode)
  return config?.states || []
}

// ============================================================================
// BUSINESS NUMBER VALIDATION
// ============================================================================

/**
 * Validate business registration number (GST/VAT/TRN) based on country
 */
export const validateBusinessNumberByCountry = (value: string, countryCode: CountryCode): ValidationResult => {
  if (!value) return null
  
  const config = getCountryConfig(countryCode)
  if (!config || !config.business) return 'Business number validation not supported for this country'
  
  let pattern: string
  let errorMessage: string
  
  switch (countryCode) {
    case 'IN':
      pattern = config.business.gst_pattern
      errorMessage = config.business.gst_error
      break
    case 'GB':
      pattern = config.business.vat_pattern
      errorMessage = config.business.vat_error
      break
    case 'AE':
      pattern = config.business.trn_pattern
      errorMessage = config.business.trn_error
      break
    default:
      return 'Business number validation not configured for this country'
  }
  
  if (!new RegExp(pattern).test(value.toUpperCase())) {
    return errorMessage
  }
  
  return null
}

// ============================================================================
// GENERIC FIELD VALIDATION
// ============================================================================

/**
 * Validate entity code using configuration
 */
export const validateEntityCode = (value: string): ValidationResult => {
  if (!value) return null
  
  const rules = getValidationRules().entity_code
  const isValid = rules.patterns.some(pattern => 
    new RegExp(pattern.pattern).test(value.toUpperCase())
  )
  
  if (!isValid) {
    return rules.error_message
  }
  
  return null
}

/**
 * Validate email using configuration
 */
export const validateEmail = (value: string): ValidationResult => {
  if (!value) return null
  
  const rules = getValidationRules().email
  
  // Basic pattern validation
  const emailPattern = new RegExp(rules.pattern)
  if (!emailPattern.test(value)) {
    return rules.error_message
  }
  
  // Length validation
  if (value.length > rules.max_length) {
    return `Email address is too long (maximum ${rules.max_length} characters)`
  }
  
  // Check for common typos
  const domain = value.split('@')[1]?.toLowerCase()
  if (domain && rules.common_typos.some(typo => domain.includes(typo))) {
    return 'Please check the email domain for typos'
  }
  
  return null
}

/**
 * Validate currency amount using configuration
 */
export const validateCurrencyAmount = (value: string): ValidationResult => {
  if (!value) return null
  
  const rules = getValidationRules().currency
  const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
  
  if (isNaN(numericValue)) {
    return rules.error_message
  }
  
  if (numericValue < rules.min_value) {
    return 'Amount cannot be negative'
  }
  
  if (numericValue > rules.max_value) {
    return `Amount is too large (maximum ${rules.max_value.toLocaleString()})`
  }
  
  // Check decimal places
  const decimalPlaces = (value.split('.')[1] || '').length
  if (decimalPlaces > rules.max_decimals) {
    return `Amount can have maximum ${rules.max_decimals} decimal places`
  }
  
  return null
}

/**
 * Validate percentage using configuration
 */
export const validatePercentage = (value: string): ValidationResult => {
  if (!value) return null
  
  const rules = getValidationRules().percentage
  const numericValue = parseFloat(value.replace('%', ''))
  
  if (isNaN(numericValue)) {
    return rules.error_message
  }
  
  if (numericValue < rules.min_value || numericValue > rules.max_value) {
    return rules.error_message
  }
  
  return null
}

/**
 * Validate quantity using configuration
 */
export const validateQuantity = (value: string, unit: string = ''): ValidationResult => {
  if (!value) return null
  
  const rules = getValidationRules().quantity
  const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
  
  if (isNaN(numericValue)) {
    return `Enter a valid quantity${unit ? ` in ${unit}` : ''} (e.g., 1000, 1000.5)`
  }
  
  if (numericValue <= rules.min_value) {
    return 'Quantity must be greater than 0'
  }
  
  if (numericValue > rules.max_value) {
    return 'Quantity is too large'
  }
  
  return null
}

/**
 * Validate address line using configuration
 */
export const validateAddressLine = (value: string, lineNumber: number = 1): ValidationResult => {
  const rules = getValidationRules().address
  const lineRule = lineNumber === 1 ? rules.line1 : rules.line2
  
  if (!value && lineRule.required) {
    return lineRule.error_message
  }
  
  if (value && value.length < lineRule.min_length) {
    return lineRule.error_message
  }
  
  if (value && value.length > lineRule.max_length) {
    return `Address line ${lineNumber} is too long (maximum ${lineRule.max_length} characters)`
  }
  
  return null
}

/**
 * Validate city name using configuration
 */
export const validateCityName = (value: string): ValidationResult => {
  if (!value) return null
  
  const rules = getValidationRules().address.city
  
  if (value.length < rules.min_length) {
    return `City name is too short (minimum ${rules.min_length} characters)`
  }
  
  if (value.length > rules.max_length) {
    return `City name is too long (maximum ${rules.max_length} characters)`
  }
  
  const pattern = new RegExp(rules.pattern)
  if (!pattern.test(value)) {
    return rules.error_message
  }
  
  return null
}

// ============================================================================
// BUSINESS CONTEXT VALIDATION
// ============================================================================

/**
 * Validate manufacturing capacity using business context
 */
export const validateManufacturingCapacity = (value: string, context: string = 'manufacturing'): ValidationResult => {
  const result = validateQuantity(value, 'units per day')
  if (result) return result
  
  const businessRules = getBusinessContext(context)
  const numValue = parseFloat(value)
  
  if (numValue < businessRules.capacity_min) {
    return `Manufacturing capacity must be at least ${businessRules.capacity_min} unit per day`
  }
  
  if (numValue > businessRules.capacity_max) {
    return `Manufacturing capacity seems unrealistic (max ${businessRules.capacity_max.toLocaleString()})`
  }
  
  return null
}

/**
 * Validate storage capacity using business context
 */
export const validateStorageCapacity = (value: string, context: string = 'manufacturing'): ValidationResult => {
  const result = validateQuantity(value, 'KG')
  if (result) return result
  
  const businessRules = getBusinessContext(context)
  const numValue = parseFloat(value)
  
  if (numValue < businessRules.storage_min) {
    return `Storage capacity must be at least ${businessRules.storage_min} KG`
  }
  
  if (numValue > businessRules.storage_max) {
    return `Storage capacity seems unrealistic (max ${businessRules.storage_max.toLocaleString()} KG)`
  }
  
  return null
}

/**
 * Validate facility area using business context
 */
export const validateFacilityArea = (value: string, context: string = 'manufacturing'): ValidationResult => {
  const result = validateQuantity(value, 'Sq Ft')
  if (result) return result
  
  const businessRules = getBusinessContext(context)
  const numValue = parseFloat(value)
  
  if (numValue < businessRules.area_min) {
    return `Facility area must be at least ${businessRules.area_min} Sq Ft`
  }
  
  if (numValue > businessRules.area_max) {
    return `Facility area seems unrealistic (max ${businessRules.area_max.toLocaleString()} Sq Ft)`
  }
  
  return null
}

// ============================================================================
// COUNTRY-AWARE FIELD VALIDATORS
// ============================================================================

/**
 * Create country-aware validators
 */
export const createCountryValidators = (countryCode: CountryCode) => {
  return {
    // Contact Information
    phone: (value: string) => validatePhoneByCountry(value, countryCode),
    landline: (value: string) => validateLandlineByCountry(value, countryCode),
    email: validateEmail,
    
    // Address Fields
    address_line_1: (value: string) => validateAddressLine(value, 1),
    address_line_2: (value: string) => validateAddressLine(value, 2),
    city: validateCityName,
    state: (value: string) => validateStateByCountry(value, countryCode),
    postal_code: (value: string) => validatePostalCodeByCountry(value, countryCode),
    
    // Business Fields
    entity_code: validateEntityCode,
    business_number: (value: string) => validateBusinessNumberByCountry(value, countryCode),
    currency_amount: validateCurrencyAmount,
    percentage: validatePercentage,
    quantity: validateQuantity,
    
    // Business Context
    manufacturing_capacity: validateManufacturingCapacity,
    storage_capacity: validateStorageCapacity,
    facility_area: validateFacilityArea
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get country name by code
 */
export const getCountryName = (countryCode: CountryCode): string => {
  return getCountryConfig(countryCode)?.name || 'Unknown Country'
}

/**
 * Get currency symbol by country
 */
export const getCurrencySymbol = (countryCode: CountryCode): string => {
  return getCountryConfig(countryCode)?.currency_symbol || '$'
}

/**
 * Get phone country code
 */
export const getPhoneCountryCode = (countryCode: CountryCode): string => {
  return getCountryConfig(countryCode)?.phone.country_code || '+1'
}

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (value: string, countryCode: CountryCode): string => {
  if (!value) return ''
  
  const cleaned = value.replace(/[\s\-\(\)]/g, '')
  const countryPrefix = getPhoneCountryCode(countryCode)
  
  // If it doesn't start with country code, add it
  if (!cleaned.startsWith(countryPrefix.replace('+', ''))) {
    return `${countryPrefix} ${cleaned}`
  }
  
  return cleaned
}

/**
 * Export the main configuration-driven validation system v2
 * Provides both async (dynamic) and sync (cached) validators
 */
export const CONFIG_VALIDATORS = {
  // ============================================================================
  // ASYNC VALIDATORS (Dynamic Configuration Loading)
  // ============================================================================
  async: {
    // Multi-country validators
    phone: validatePhoneByCountry,
    landline: validateLandlineByCountry,
    postal_code: validatePostalCodeByCountry,
    state: validateStateByCountry,
    business_number: validateBusinessNumberByCountry,
    
    // Configuration loaders
    getCountryConfig,
    getSupportedCountries,
    getStatesByCountry,
    getValidationRules,
    getBusinessContext,
    
    // Utility functions
    preloadValidationConfig,
    refreshValidationConfig,
    subscribeToConfigChanges
  },

  // ============================================================================
  // SYNC VALIDATORS (Cached Configuration)
  // ============================================================================
  sync: {
    // Multi-country validators (for forms and immediate validation)
    phone: validatePhoneByCountrySync,
    landline: validateLandlineByCountrySync,
    postal_code: validatePostalCodeByCountrySync,
    state: validateStateByCountrySync,
    business_number: validateBusinessNumberByCountrySync,
    
    // Configuration getters
    getCountryConfig: getCountryConfigSync,
    getSupportedCountries: getSupportedCountriesSync,
    getStatesByCountry: getStatesByCountrySync,
    getValidationRules: getValidationRulesSync,
    getBusinessContext: getBusinessContextSync,
    
    // Status checkers
    isDynamicConfigAvailable
  },

  // ============================================================================
  // GENERIC VALIDATORS (No configuration dependency)
  // ============================================================================
  
  // Generic validators (unchanged)
  email: validateEmail,
  entity_code: validateEntityCode,
  currency_amount: validateCurrencyAmount,
  percentage: validatePercentage,
  quantity: validateQuantity,
  address_line_1: (value: string) => validateAddressLine(value, 1),
  address_line_2: (value: string) => validateAddressLine(value, 2),
  city: validateCityName,
  
  // Business context validators (unchanged)
  manufacturing_capacity: validateManufacturingCapacity,
  storage_capacity: validateStorageCapacity,
  facility_area: validateFacilityArea,
  
  // ============================================================================
  // MIGRATION HELPERS (Backward Compatibility)
  // ============================================================================
  
  // Backward compatibility - uses sync validators
  phone: validatePhoneByCountrySync,
  landline: validateLandlineByCountrySync,
  postal_code: validatePostalCodeByCountrySync,
  state: validateStateByCountrySync,
  business_number: validateBusinessNumberByCountrySync,
  
  // Country utilities (sync versions for backward compatibility)
  getSupportedCountries: getSupportedCountriesSync,
  getStatesByCountry: getStatesByCountrySync,
  getCountryName: (countryCode: CountryCode) => getCountryConfigSync(countryCode)?.name || 'Unknown Country',
  getCurrencySymbol: (countryCode: CountryCode) => getCountryConfigSync(countryCode)?.currency_symbol || '$',
  getPhoneCountryCode: (countryCode: CountryCode) => getCountryConfigSync(countryCode)?.phone.country_code || '+1',
  formatPhoneNumber: (value: string, countryCode: CountryCode) => {
    if (!value) return ''
    const cleaned = value.replace(/[\s\-\(\)]/g, '')
    const config = getCountryConfigSync(countryCode)
    const countryPrefix = config?.phone.country_code || '+1'
    if (!cleaned.startsWith(countryPrefix.replace('+', ''))) {
      return `${countryPrefix} ${cleaned}`
    }
    return cleaned
  },
  
  // Legacy function (uses sync by default)
  createCountryValidators: (countryCode: CountryCode) => ({
    phone: (value: string) => validatePhoneByCountrySync(value, countryCode),
    landline: (value: string) => validateLandlineByCountrySync(value, countryCode),
    postal_code: (value: string) => validatePostalCodeByCountrySync(value, countryCode),
    state: (value: string) => validateStateByCountrySync(value, countryCode),
    business_number: (value: string) => validateBusinessNumberByCountrySync(value, countryCode)
  })
}

/**
 * Enhanced configuration validators with dynamic loading capabilities
 */
export const DYNAMIC_CONFIG_VALIDATORS = {
  // Configuration management
  loadConfig: loadValidationConfig,
  preloadConfig: preloadValidationConfig,
  refreshConfig: refreshValidationConfig,
  subscribeToChanges: subscribeToConfigChanges,
  
  // Status checks
  isDynamicConfigAvailable,
  
  // Async validators (require actorId)
  async: CONFIG_VALIDATORS.async,
  
  // Sync validators (use cached config)
  sync: CONFIG_VALIDATORS.sync
}

export default CONFIG_VALIDATORS