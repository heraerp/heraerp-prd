/**
 * HERA Smart Code Generator and Validator
 *
 * Ensures all smart codes follow the HERA DNA pattern:
 * HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{NUMBER}
 *
 * Rules:
 * - Exactly 4 segments between HERA and version (5 parts total)
 * - All segments UPPERCASE
 * - Version must be uppercase V followed by number (V1, V2, etc.)
 * - No snake_case or lowercase segments
 *
 * @example
 * ✅ HERA.SALON.PRODUCT.REL.LOCATION.V1
 * ✅ HERA.SALON.SERVICE.DYN.PRICE.V1
 * ❌ HERA.SALON.PRODUCT.REL.STOCK_AT.v1  (lowercase v, extra segment)
 * ❌ HERA.SALON.SERVICE.REL.HAS_CATEGORY.v1  (lowercase v, extra segment)
 */

/**
 * Smart Code Pattern Requirements
 * Must have exactly 6 parts: HERA.{SEGMENT}.{SEGMENT}.{SEGMENT}.{SEGMENT}.V{NUMBER}
 * Each segment must be UPPERCASE letters only (no underscores, no special characters)
 */
export const SMART_CODE_PATTERN = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V[0-9]+$/

/**
 * Smart Code Segment Types
 */
export type SmartCodeSegments = {
  industry: string      // SALON, REST, RETAIL, etc.
  module: string        // PRODUCT, SERVICE, CUSTOMER, etc.
  type: string          // REL (relationship), DYN (dynamic), ENT (entity), etc.
  subtype: string       // CATEGORY, LOCATION, PRICE, etc.
  version?: number      // Default: 1
}

/**
 * Validation Result
 */
export type SmartCodeValidation = {
  valid: boolean
  smartCode?: string
  errors: string[]
  warnings: string[]
}

/**
 * Generate a valid HERA smart code
 * Ensures no underscores or special characters in segments
 */
export function generateSmartCode(segments: SmartCodeSegments): string {
  const { industry, module, type, subtype, version = 1 } = segments

  // Normalize all segments to UPPERCASE and remove special characters
  const cleanSegment = (segment: string) => {
    return segment
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric except letters
      .replace(/[0-9]/g, '') // Remove numbers to keep only letters
  }

  const normalized = {
    industry: cleanSegment(industry),
    module: cleanSegment(module),
    type: cleanSegment(type),
    subtype: cleanSegment(subtype),
    version
  }

  // Build smart code
  const smartCode = `HERA.${normalized.industry}.${normalized.module}.${normalized.type}.${normalized.subtype}.V${normalized.version}`

  return smartCode
}

/**
 * Validate a smart code against HERA DNA pattern
 */
export function validateSmartCode(smartCode: string): SmartCodeValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if matches pattern
  if (!SMART_CODE_PATTERN.test(smartCode)) {
    const parts = smartCode.split('.')

    // Detailed error analysis
    if (parts.length !== 6) {
      errors.push(
        `Smart code must have exactly 6 parts (HERA.{4 segments}.V{number}), found ${parts.length} parts: ${smartCode}`
      )
    }

    if (parts[0] !== 'HERA') {
      errors.push(`Smart code must start with 'HERA', found: ${parts[0]}`)
    }

    // Check segments 1-4 are uppercase and contain no special characters
    for (let i = 1; i <= 4; i++) {
      if (parts[i]) {
        if (parts[i] !== parts[i].toUpperCase()) {
          errors.push(`Segment ${i} (${parts[i]}) must be UPPERCASE`)
        }
        if (!/^[A-Z]+$/.test(parts[i])) {
          errors.push(
            `Segment ${i} (${parts[i]}) can only contain uppercase letters (no underscores, numbers, or special characters)`
          )
        }
      }
    }

    // Check version format
    if (parts[5]) {
      if (!/^V[0-9]+$/.test(parts[5])) {
        errors.push(`Version must be uppercase 'V' followed by number (V1, V2, etc.), found: ${parts[5]}`)
      }
    } else {
      errors.push(`Missing version segment (V1, V2, etc.)`)
    }
  }

  // Add warnings for common mistakes
  if (smartCode.includes('v1') || smartCode.includes('v2')) {
    warnings.push(`Version should be uppercase: use 'V1' instead of 'v1'`)
  }

  const segments = smartCode.split('.')
  for (let i = 1; i <= 4; i++) {
    if (segments[i] && !/^[A-Z]+$/.test(segments[i])) {
      warnings.push(
        `Segment ${i} (${segments[i]}) contains non-letter characters - use only uppercase letters (A-Z)`
      )
    }
  }

  return {
    valid: errors.length === 0,
    smartCode: errors.length === 0 ? smartCode : undefined,
    errors,
    warnings
  }
}

/**
 * Common smart code builders for HERA entities
 */
export const SmartCodeBuilder = {
  /**
   * Generate entity smart code
   * @example SmartCodeBuilder.entity('SALON', 'PRODUCT', 'TREATMENT') → HERA.SALON.PRODUCT.ENT.TREATMENT.V1
   */
  entity: (industry: string, module: string, subtype: string, version = 1) =>
    generateSmartCode({ industry, module, type: 'ENT', subtype, version }),

  /**
   * Generate relationship smart code
   * @example SmartCodeBuilder.relationship('SALON', 'PRODUCT', 'CATEGORY') → HERA.SALON.PRODUCT.REL.CATEGORY.V1
   */
  relationship: (industry: string, module: string, subtype: string, version = 1) =>
    generateSmartCode({ industry, module, type: 'REL', subtype, version }),

  /**
   * Generate dynamic field smart code
   * @example SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'PRICE') → HERA.SALON.PRODUCT.DYN.PRICE.V1
   */
  dynamic: (industry: string, module: string, subtype: string, version = 1) =>
    generateSmartCode({ industry, module, type: 'DYN', subtype, version }),

  /**
   * Generate transaction smart code
   * @example SmartCodeBuilder.transaction('SALON', 'POS', 'SALE') → HERA.SALON.POS.TXN.SALE.V1
   */
  transaction: (industry: string, module: string, subtype: string, version = 1) =>
    generateSmartCode({ industry, module, type: 'TXN', subtype, version }),

  /**
   * Generate workflow smart code
   * @example SmartCodeBuilder.workflow('SALON', 'BOOKING', 'CONFIRMED') → HERA.SALON.BOOKING.WF.CONFIRMED.V1
   */
  workflow: (industry: string, module: string, subtype: string, version = 1) =>
    generateSmartCode({ industry, module, type: 'WF', subtype, version })
}

/**
 * Parse a smart code into its components
 */
export function parseSmartCode(smartCode: string): SmartCodeSegments | null {
  const validation = validateSmartCode(smartCode)
  if (!validation.valid) {
    console.error('Invalid smart code:', validation.errors)
    return null
  }

  const parts = smartCode.split('.')
  return {
    industry: parts[1],
    module: parts[2],
    type: parts[3],
    subtype: parts[4],
    version: parseInt(parts[5].replace('V', ''))
  }
}

/**
 * Common smart code patterns for quick reference
 */
export const COMMON_PATTERNS = {
  // Product relationships
  PRODUCT_CATEGORY: 'HERA.SALON.PRODUCT.REL.CATEGORY.V1',
  PRODUCT_LOCATION: 'HERA.SALON.PRODUCT.REL.LOCATION.V1',

  // Service relationships
  SERVICE_CATEGORY: 'HERA.SALON.SERVICE.REL.CATEGORY.V1',
  SERVICE_ROLE: 'HERA.SALON.SERVICE.REL.ROLE.V1',
  SERVICE_PRODUCT: 'HERA.SALON.SERVICE.REL.PRODUCT.V1',
  SERVICE_LOCATION: 'HERA.SALON.SERVICE.REL.LOCATION.V1',

  // Staff relationships
  STAFF_BRANCH: 'HERA.SALON.STAFF.REL.BRANCH.V1',
  STAFF_ROLE: 'HERA.SALON.STAFF.REL.ROLE.V1',

  // Dynamic fields
  PRODUCT_PRICE: 'HERA.SALON.PRODUCT.DYN.PRICE.V1',
  PRODUCT_COST: 'HERA.SALON.PRODUCT.DYN.COST.V1',
  PRODUCT_CATEGORY: 'HERA.SALON.PRODUCT.DYN.CATEGORY.V1',
  SERVICE_PRICE: 'HERA.SALON.SERVICE.DYN.PRICE.V1',
  SERVICE_DURATION: 'HERA.SALON.SERVICE.DYN.DURATION.V1'
} as const

/**
 * Batch validate multiple smart codes
 */
export function validateSmartCodes(smartCodes: string[]): {
  valid: boolean
  results: Record<string, SmartCodeValidation>
  summary: {
    total: number
    valid: number
    invalid: number
  }
} {
  const results: Record<string, SmartCodeValidation> = {}
  let validCount = 0
  let invalidCount = 0

  for (const smartCode of smartCodes) {
    const validation = validateSmartCode(smartCode)
    results[smartCode] = validation

    if (validation.valid) {
      validCount++
    } else {
      invalidCount++
    }
  }

  return {
    valid: invalidCount === 0,
    results,
    summary: {
      total: smartCodes.length,
      valid: validCount,
      invalid: invalidCount
    }
  }
}
