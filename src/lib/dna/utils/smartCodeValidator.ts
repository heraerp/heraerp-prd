// HERA DNA Smart Code Validator
// Ensures all smart codes follow the canonical pattern

const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$/

export interface SmartCodeValidation {
  isValid: boolean
  normalized?: string
  errors?: string[]
  suggestions?: string[]
}

/**
 * Validates a smart code against HERA DNA pattern
 */
export function validateSmartCode(code: string): boolean {
  return SMART_CODE_PATTERN.test(code)
}

/**
 * Normalizes a smart code (uppercase V in version)
 */
export function normalizeSmartCode(code: string): string {
  return code.replace(/\.[Vv](\d+)$/, (_, n) => `.V${n}`)
}

/**
 * Comprehensive validation with error details
 */
export function validateSmartCodeWithDetails(code: string): SmartCodeValidation {
  const errors: string[] = []
  const suggestions: string[] = []

  // Check basic format
  if (!code) {
    errors.push('Smart code is required')
    return { isValid: false, errors }
  }

  // Check prefix
  if (!code.startsWith('HERA.')) {
    errors.push('Smart code must start with HERA.')
    suggestions.push(`Try: HERA.${code}`)
  }

  // Check version suffix
  const versionMatch = code.match(/\.[Vv]\d+$/)
  if (!versionMatch) {
    errors.push('Smart code must end with version (e.g., .V1)')
    suggestions.push(`${code}.V1`)
  }

  // Check segments
  const segments = code.split('.')
  if (segments.length < 6 || segments.length > 10) {
    errors.push(`Smart code must have 6-10 segments (found ${segments.length})`)
  }

  // Check character validity
  segments.forEach((segment, index) => {
    if (index === 0 && segment !== 'HERA') return
    if (index === segments.length - 1 && /^[Vv]\d+$/.test(segment)) return

    if (!/^[A-Z0-9_]+$/.test(segment)) {
      errors.push(`Segment '${segment}' contains invalid characters (only A-Z, 0-9, _ allowed)`)
      suggestions.push(
        `Replace '${segment}' with '${segment.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}'`
      )
    }
  })

  // Normalize if valid pattern
  if (SMART_CODE_PATTERN.test(code)) {
    const normalized = normalizeSmartCode(code)
    return {
      isValid: true,
      normalized,
      errors: [],
      suggestions: normalized !== code ? [`Normalized to: ${normalized}`] : []
    }
  }

  return { isValid: false, errors, suggestions }
}

/**
 * Common salon smart code families
 */
export const SALON_SMART_CODES = {
  // POS Cart
  CART_ACTIVE: 'HERA.SALON.POS.CART.ACTIVE.V1',
  CART_DRAFT: 'HERA.SALON.POS.CART.DRAFT.V1',
  CART_LOCKED: 'HERA.SALON.POS.CART.LOCKED.V1',

  // Service Lines
  SERVICE_STANDARD: 'HERA.SALON.SVC.LINE.STANDARD.V1',
  SERVICE_ADDON: 'HERA.SALON.SVC.LINE.ADDON.V1',

  // Retail Lines
  RETAIL_PRODUCT: 'HERA.SALON.RETAIL.LINE.PRODUCT.V1',
  RETAIL_GIFT: 'HERA.SALON.RETAIL.LINE.GIFT.V1',

  // Adjustments
  DISCOUNT_LINE_PCT: 'HERA.SALON.POS.ADJUST.DISCOUNT.LINE.PCT.V1',
  DISCOUNT_LINE_AMT: 'HERA.SALON.POS.ADJUST.DISCOUNT.LINE.AMT.V1',
  DISCOUNT_CART_PCT: 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1',
  DISCOUNT_CART_AMT: 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.AMT.V1',
  PRICE_OVERRIDE: 'HERA.SALON.POS.ADJUST.PRICE.OVERRIDE.V1',

  // Tips
  TIP_CASH: 'HERA.SALON.TIP.CASH.V1',
  TIP_CARD: 'HERA.SALON.TIP.CARD.V1',

  // Tax
  TAX_UK_VAT: 'HERA.SALON.TAX.UK.VAT.STANDARD.V1',
  TAX_US_SALES: 'HERA.SALON.TAX.US.SALES.STATE.V1',
  TAX_AE_VAT: 'HERA.SALON.TAX.AE.VAT.STANDARD.V1',

  // Inventory
  INV_RESERVE_SOFT: 'HERA.SALON.INV.RESERVE.SOFT.V1',
  INV_RESERVE_RELEASE: 'HERA.SALON.INV.RESERVE.RELEASE.V1',
  INV_COMMIT_SALE: 'HERA.SALON.INV.COMMIT.SALE.V1',

  // Payments
  PAYMENT_INTENT: 'HERA.SALON.PAYMENT.INTENT.CREATE.V1',
  PAYMENT_CARD: 'HERA.SALON.PAYMENT.CAPTURE.CARD.V1',
  PAYMENT_CASH: 'HERA.SALON.PAYMENT.CAPTURE.CASH.V1',

  // Sale
  SALE_COMMIT: 'HERA.SALON.POS.SALE.COMMIT.V1',
  SALE_MIXED: 'HERA.SALON.POS.SALE.MIXED.V1',

  // Appointments
  APPT_STANDARD: 'HERA.SALON.APPT.STANDARD.V1',
  APPT_BOOKING: 'HERA.SALON.APPT.BOOKING.V1',
  APPT_STATUS_UPDATE: 'HERA.SALON.APPT.STATUS.UPDATE.V1',

  // Relationships
  REL_CART_FROM_APPT: 'HERA.SALON.POS.REL.CART_FROM_APPT.V1',
  REL_CART_BILLS_CUSTOMER: 'HERA.SALON.POS.REL.CART_BILLS_CUSTOMER.V1',
  REL_LINE_PERFORMED_BY_STAFF: 'HERA.SALON.POS.REL.LINE_PERFORMED_BY_STAFF.V1',
  REL_SALE_FULFILLS_APPT: 'HERA.SALON.POS.REL.SALE_FULFILLS_APPT.V1'
} as const

/**
 * Get smart code by line type
 */
export function getLineSmartCode(lineType: 'SERVICE' | 'RETAIL' | 'ADJUSTMENT'): string {
  switch (lineType) {
    case 'SERVICE':
      return SALON_SMART_CODES.SERVICE_STANDARD
    case 'RETAIL':
      return SALON_SMART_CODES.RETAIL_PRODUCT
    case 'ADJUSTMENT':
      return SALON_SMART_CODES.DISCOUNT_LINE_AMT
    default:
      throw new Error(`Unknown line type: ${lineType}`)
  }
}
