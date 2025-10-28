/**
 * HERA Smart Code Validator
 *
 * Validates and normalizes HERA DNA smart codes to prevent validation errors.
 *
 * CRITICAL RULES:
 * 1. Version MUST be lowercase: .v1, .v2, etc. (NOT .V1, .V2)
 * 2. Must have 6-10 segments total
 * 3. Pattern: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$
 * 4. All segments UPPERCASE except version
 *
 * @example
 * ✅ CORRECT: 'HERA.SALON.POS.SALE.COMMIT.v1'
 * ❌ WRONG:   'HERA.SALON.POS.SALE.COMMIT.V1'  (uppercase V)
 * ❌ WRONG:   'HERA.SALON.SALE.v1'            (only 4 segments)
 */

// Official RPC validation pattern from Supabase
const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

export interface SmartCodeValidationResult {
  isValid: boolean
  error?: string
  normalized?: string
}

/**
 * Validates a smart code against HERA DNA pattern
 */
export function validateSmartCode(code: string): SmartCodeValidationResult {
  if (!code) {
    return { isValid: false, error: 'Smart code is required' }
  }

  // Check segment count (must be 6-10 total: HERA + 3-8 segments + version)
  const segments = code.split('.')
  if (segments.length < 6 || segments.length > 10) {
    return {
      isValid: false,
      error: `Smart code must have 6-10 segments, found ${segments.length}: ${code}`
    }
  }

  // Check if version is uppercase (common mistake)
  if (/\.V\d+$/.test(code)) {
    return {
      isValid: false,
      error: `Version must be lowercase (e.g., .v1 not .V1): ${code}`,
      normalized: normalizeSmartCode(code)
    }
  }

  // Validate against official pattern
  if (!SMART_CODE_PATTERN.test(code)) {
    return {
      isValid: false,
      error: `Smart code does not match HERA DNA pattern: ${code}`
    }
  }

  return { isValid: true }
}

/**
 * Normalizes a smart code by fixing common issues:
 * - Converts uppercase .V to lowercase .v
 * - Ensures proper formatting
 */
export function normalizeSmartCode(code: string): string {
  // Fix uppercase version to lowercase
  return code.replace(/\.V(\d+)$/, '.v$1')
}

/**
 * Validates and throws if invalid (for use in production code)
 */
export function assertValidSmartCode(code: string): void {
  const result = validateSmartCode(code)
  if (!result.isValid) {
    throw new Error(`Invalid smart code: ${result.error}`)
  }
}

/**
 * Validates and auto-corrects smart code (returns normalized version)
 */
export function ensureValidSmartCode(code: string): string {
  const normalized = normalizeSmartCode(code)
  const result = validateSmartCode(normalized)

  if (!result.isValid) {
    throw new Error(`Cannot fix invalid smart code: ${result.error}`)
  }

  return normalized
}

/**
 * Type-safe smart code builder
 */
export class SmartCodeBuilder {
  private segments: string[] = ['HERA']

  industry(value: string): this {
    this.segments.push(value.toUpperCase())
    return this
  }

  module(value: string): this {
    this.segments.push(value.toUpperCase())
    return this
  }

  type(value: string): this {
    this.segments.push(value.toUpperCase())
    return this
  }

  subtype(value: string): this {
    this.segments.push(value.toUpperCase())
    return this
  }

  detail(value: string): this {
    this.segments.push(value.toUpperCase())
    return this
  }

  version(value: number): string {
    const code = `${this.segments.join('.')}.v${value}`

    // Validate before returning
    const result = validateSmartCode(code)
    if (!result.isValid) {
      throw new Error(`Invalid smart code generated: ${result.error}`)
    }

    return code
  }
}

/**
 * Pre-defined smart code constants (all validated)
 */
export const HERA_SMART_CODES = {
  // POS Sale Transactions
  POS_SALE_COMMIT: 'HERA.SALON.POS.SALE.COMMIT.v1',
  POS_SALE_MIXED: 'HERA.SALON.POS.SALE.MIXED.v1',
  POS_SALE_VOID: 'HERA.SALON.POS.SALE.VOID.v1',

  // Service Lines
  SERVICE_LINE_STANDARD: 'HERA.SALON.SVC.LINE.STANDARD.v1',
  SERVICE_LINE_ADDON: 'HERA.SALON.SVC.LINE.ADDON.v1',
  SERVICE_LINE_PACKAGE: 'HERA.SALON.SVC.LINE.PACKAGE.v1',

  // Product Lines
  PRODUCT_LINE_RETAIL: 'HERA.SALON.RETAIL.LINE.PRODUCT.v1',
  PRODUCT_LINE_GIFT: 'HERA.SALON.RETAIL.LINE.GIFT.v1',

  // Adjustments
  DISCOUNT_CART: 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.v1',
  DISCOUNT_LINE: 'HERA.SALON.POS.ADJUST.DISCOUNT.LINE.v1',

  // Payments
  PAYMENT_CASH: 'HERA.SALON.PAYMENT.CAPTURE.CASH.v1',
  PAYMENT_CARD: 'HERA.SALON.PAYMENT.CAPTURE.CARD.v1',
  PAYMENT_BANK: 'HERA.SALON.PAYMENT.CAPTURE.BANK.v1',

  // Tips
  TIP_CASH: 'HERA.SALON.POS.TIP.CASH.v1',
  TIP_CARD: 'HERA.SALON.POS.TIP.CARD.v1',

  // Tax
  TAX_AE_VAT: 'HERA.SALON.TAX.AE.VAT.STANDARD.v1',
  TAX_UK_VAT: 'HERA.SALON.TAX.UK.VAT.STANDARD.v1',
  TAX_US_SALES: 'HERA.SALON.TAX.US.SALES.STATE.v1',

  // Appointments
  APPT_STANDARD: 'HERA.SALON.APPT.BOOKING.STANDARD.v1',
  APPT_CANCEL: 'HERA.SALON.APPT.STATUS.CANCEL.v1',
  APPT_COMPLETE: 'HERA.SALON.APPT.STATUS.COMPLETE.v1',

  // Entities
  ENTITY_CUSTOMER: 'HERA.SALON.ENTITY.CUSTOMER.PROFILE.v1',
  ENTITY_STAFF: 'HERA.SALON.ENTITY.STAFF.PROFILE.v1',
  ENTITY_SERVICE: 'HERA.SALON.ENTITY.SERVICE.CATALOG.v1',
  ENTITY_PRODUCT: 'HERA.SALON.ENTITY.PRODUCT.CATALOG.v1',
  ENTITY_BRANCH: 'HERA.SALON.ENTITY.BRANCH.LOCATION.v1',
} as const

// Validate all constants at module load time
Object.entries(HERA_SMART_CODES).forEach(([key, code]) => {
  const result = validateSmartCode(code)
  if (!result.isValid) {
    throw new Error(`Invalid smart code constant ${key}: ${result.error}`)
  }
})

/**
 * Example usage:
 *
 * // Method 1: Use pre-defined constants (safest)
 * const code = HERA_SMART_CODES.POS_SALE_COMMIT
 *
 * // Method 2: Build custom smart code
 * const code = new SmartCodeBuilder()
 *   .industry('SALON')
 *   .module('POS')
 *   .type('SALE')
 *   .subtype('COMMIT')
 *   .version(1)
 *
 * // Method 3: Validate and normalize existing code
 * const code = ensureValidSmartCode('HERA.SALON.POS.SALE.COMMIT.V1') // auto-fixes to .v1
 *
 * // Method 4: Validate before use
 * const result = validateSmartCode(myCode)
 * if (!result.isValid) {
 *   throw new Error(result.error)
 * }
 */
