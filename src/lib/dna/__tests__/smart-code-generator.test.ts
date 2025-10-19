/**
 * Smart Code Generator Tests
 *
 * Ensures smart code generation and validation works correctly
 */

import {
  generateSmartCode,
  validateSmartCode,
  SmartCodeBuilder,
  parseSmartCode,
  validateSmartCodes,
  COMMON_PATTERNS
} from '../smart-code-generator'

describe('Smart Code Generator', () => {
  describe('generateSmartCode', () => {
    it('should generate valid smart code with all segments', () => {
      const result = generateSmartCode({
        industry: 'SALON',
        module: 'PRODUCT',
        type: 'REL',
        subtype: 'CATEGORY'
      })
      expect(result).toBe('HERA.SALON.PRODUCT.REL.CATEGORY.V1')
    })

    it('should normalize lowercase to uppercase', () => {
      const result = generateSmartCode({
        industry: 'salon',
        module: 'product',
        type: 'rel',
        subtype: 'category'
      })
      expect(result).toBe('HERA.SALON.PRODUCT.REL.CATEGORY.V1')
    })

    it('should use custom version', () => {
      const result = generateSmartCode({
        industry: 'SALON',
        module: 'PRODUCT',
        type: 'REL',
        subtype: 'CATEGORY',
        version: 2
      })
      expect(result).toBe('HERA.SALON.PRODUCT.REL.CATEGORY.V2')
    })
  })

  describe('validateSmartCode', () => {
    it('should validate correct smart codes', () => {
      const valid = [
        'HERA.SALON.PRODUCT.REL.CATEGORY.V1',
        'HERA.SALON.SERVICE.DYN.PRICE.V1',
        'HERA.SALON.STAFF.REL.BRANCH.V1',
        'HERA.REST.MENU.ENT.FOOD.V1'
      ]

      valid.forEach(smartCode => {
        const result = validateSmartCode(smartCode)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject lowercase version', () => {
      const result = validateSmartCode('HERA.SALON.PRODUCT.REL.CATEGORY.v1')
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true)
    })

    it('should reject too many segments', () => {
      const result = validateSmartCode('HERA.SALON.PRODUCT.REL.STOCK_AT.EXTRA.V1')
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('6 parts'))).toBe(true)
    })

    it('should reject too few segments', () => {
      const result = validateSmartCode('HERA.SALON.PRODUCT.V1')
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('6 parts'))).toBe(true)
    })

    it('should reject lowercase segments', () => {
      const result = validateSmartCode('HERA.salon.PRODUCT.REL.CATEGORY.V1')
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('UPPERCASE'))).toBe(true)
    })

    it('should warn about snake_case', () => {
      const result = validateSmartCode('HERA.SALON.PRODUCT.REL.STOCK_AT.V1')
      expect(result.valid).toBe(false) // Still invalid due to extra segment
      expect(result.warnings.some(w => w.includes('snake_case'))).toBe(true)
    })
  })

  describe('SmartCodeBuilder', () => {
    it('should build entity smart codes', () => {
      const result = SmartCodeBuilder.entity('SALON', 'PRODUCT', 'TREATMENT')
      expect(result).toBe('HERA.SALON.PRODUCT.ENT.TREATMENT.V1')
    })

    it('should build relationship smart codes', () => {
      const result = SmartCodeBuilder.relationship('SALON', 'PRODUCT', 'CATEGORY')
      expect(result).toBe('HERA.SALON.PRODUCT.REL.CATEGORY.V1')
    })

    it('should build dynamic field smart codes', () => {
      const result = SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'PRICE')
      expect(result).toBe('HERA.SALON.PRODUCT.DYN.PRICE.V1')
    })

    it('should build transaction smart codes', () => {
      const result = SmartCodeBuilder.transaction('SALON', 'POS', 'SALE')
      expect(result).toBe('HERA.SALON.POS.TXN.SALE.V1')
    })

    it('should build workflow smart codes', () => {
      const result = SmartCodeBuilder.workflow('SALON', 'BOOKING', 'CONFIRMED')
      expect(result).toBe('HERA.SALON.BOOKING.WF.CONFIRMED.V1')
    })
  })

  describe('parseSmartCode', () => {
    it('should parse valid smart code', () => {
      const result = parseSmartCode('HERA.SALON.PRODUCT.REL.CATEGORY.V1')
      expect(result).toEqual({
        industry: 'SALON',
        module: 'PRODUCT',
        type: 'REL',
        subtype: 'CATEGORY',
        version: 1
      })
    })

    it('should return null for invalid smart code', () => {
      const result = parseSmartCode('INVALID.CODE')
      expect(result).toBeNull()
    })
  })

  describe('validateSmartCodes', () => {
    it('should validate multiple smart codes', () => {
      const smartCodes = [
        'HERA.SALON.PRODUCT.REL.CATEGORY.V1',
        'HERA.SALON.SERVICE.DYN.PRICE.V1',
        'INVALID.CODE.v1'
      ]

      const result = validateSmartCodes(smartCodes)
      expect(result.valid).toBe(false)
      expect(result.summary.total).toBe(3)
      expect(result.summary.valid).toBe(2)
      expect(result.summary.invalid).toBe(1)
    })
  })

  describe('COMMON_PATTERNS', () => {
    it('should have valid common patterns', () => {
      const patterns = Object.values(COMMON_PATTERNS)
      patterns.forEach(pattern => {
        const result = validateSmartCode(pattern)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('Real-world fixes', () => {
    it('should reject old product relationship format', () => {
      const oldFormats = [
        'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1',
        'HERA.SALON.PRODUCT.REL.STOCK_AT.v1'
      ]

      oldFormats.forEach(oldFormat => {
        const result = validateSmartCode(oldFormat)
        expect(result.valid).toBe(false)
      })
    })

    it('should accept new product relationship format', () => {
      const newFormats = [
        'HERA.SALON.PRODUCT.REL.CATEGORY.V1',
        'HERA.SALON.PRODUCT.REL.LOCATION.V1'
      ]

      newFormats.forEach(newFormat => {
        const result = validateSmartCode(newFormat)
        expect(result.valid).toBe(true)
      })
    })

    it('should reject old service relationship format', () => {
      const oldFormats = [
        'HERA.SALON.SERVICE.REL.HAS_CATEGORY.v1',
        'HERA.SALON.SERVICE.REL.PERFORMED_BY_ROLE.v1',
        'HERA.SALON.SERVICE.REL.REQUIRES_PRODUCT.v1',
        'HERA.SALON.SERVICE.REL.AVAILABLE_AT.v1'
      ]

      oldFormats.forEach(oldFormat => {
        const result = validateSmartCode(oldFormat)
        expect(result.valid).toBe(false)
      })
    })

    it('should accept new service relationship format', () => {
      const newFormats = [
        'HERA.SALON.SERVICE.REL.CATEGORY.V1',
        'HERA.SALON.SERVICE.REL.ROLE.V1',
        'HERA.SALON.SERVICE.REL.PRODUCT.V1',
        'HERA.SALON.SERVICE.REL.LOCATION.V1'
      ]

      newFormats.forEach(newFormat => {
        const result = validateSmartCode(newFormat)
        expect(result.valid).toBe(true)
      })
    })
  })
})
