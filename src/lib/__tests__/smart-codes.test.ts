import { heraCode, isValidHeraCode, createHeraCode, parseHeraCode, HERA_CODES } from '../smart-codes'

describe('Smart Code Functions', () => {
  describe('heraCode', () => {
    it('should convert uppercase .V to lowercase .v', () => {
      expect(heraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBe('HERA.SALON.POS.SALE.HEADER.v1')
      expect(heraCode('HERA.SALON.POS.LINE.SERVICE.V2')).toBe('HERA.SALON.POS.LINE.SERVICE.v2')
      expect(heraCode('HERA.SALON.POS.LINE.TAX.V10')).toBe('HERA.SALON.POS.LINE.TAX.v10')
    })

    it('should not change already correct codes', () => {
      expect(heraCode('HERA.SALON.POS.SALE.HEADER.v1')).toBe('HERA.SALON.POS.SALE.HEADER.v1')
      expect(heraCode('HERA.SALON.POS.LINE.SERVICE.v2')).toBe('HERA.SALON.POS.LINE.SERVICE.v2')
    })

    it('should handle codes without version', () => {
      expect(heraCode('HERA.SALON.POS.SALE.HEADER')).toBe('HERA.SALON.POS.SALE.HEADER')
    })
  })

  describe('isValidHeraCode', () => {
    it('should validate correct smart codes', () => {
      expect(isValidHeraCode('HERA.SALON.POS.SALE.HEADER.v1')).toBe(true)
      expect(isValidHeraCode('HERA.FIN.GL.ACC.ASSET.CASH.v1')).toBe(true)
      expect(isValidHeraCode('HERA.MFG.BOM.REL.COMP.v1')).toBe(true)
    })

    it('should reject invalid smart codes', () => {
      // Uppercase V
      expect(isValidHeraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBe(false)
      // Missing version
      expect(isValidHeraCode('HERA.SALON.POS.SALE.HEADER')).toBe(false)
      // Too few segments
      expect(isValidHeraCode('HERA.SALON.v1')).toBe(false)
      // Invalid characters
      expect(isValidHeraCode('HERA.SALON.POS.SALE.header.v1')).toBe(false)
      // Not starting with HERA
      expect(isValidHeraCode('ERA.SALON.POS.SALE.HEADER.v1')).toBe(false)
    })
  })

  describe('createHeraCode', () => {
    it('should create valid smart codes', () => {
      const code = createHeraCode(['SALON', 'POS', 'SALE', 'HEADER'])
      expect(code).toBe('HERA.SALON.POS.SALE.HEADER.v1')
      expect(isValidHeraCode(code)).toBe(true)
    })

    it('should handle custom version', () => {
      const code = createHeraCode(['SALON', 'POS', 'SALE', 'HEADER'], 2)
      expect(code).toBe('HERA.SALON.POS.SALE.HEADER.v2')
    })

    it('should convert segments to uppercase', () => {
      const code = createHeraCode(['salon', 'pos', 'sale', 'header'])
      expect(code).toBe('HERA.SALON.POS.SALE.HEADER.v1')
    })
  })

  describe('parseHeraCode', () => {
    it('should parse valid smart codes', () => {
      const parsed = parseHeraCode('HERA.SALON.POS.SALE.HEADER.v1')
      expect(parsed).toEqual({
        prefix: 'HERA',
        segments: ['SALON', 'POS', 'SALE', 'HEADER'],
        version: 1,
        isValid: true
      })
    })

    it('should handle multi-digit versions', () => {
      const parsed = parseHeraCode('HERA.SALON.POS.SALE.HEADER.v10')
      expect(parsed?.version).toBe(10)
    })

    it('should return null for invalid codes', () => {
      expect(parseHeraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBeNull()
      expect(parseHeraCode('INVALID.CODE')).toBeNull()
    })
  })

  describe('HERA_CODES constants', () => {
    it('should have valid smart codes', () => {
      // POS codes
      expect(isValidHeraCode(HERA_CODES.POS.SALE_HEADER)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.POS.LINE_SERVICE)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.POS.PAYMENT_CASH)).toBe(true)

      // Entity codes
      expect(isValidHeraCode(HERA_CODES.ENTITY.CUSTOMER)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.ENTITY.EMPLOYEE)).toBe(true)

      // GL codes
      expect(isValidHeraCode(HERA_CODES.GL.ACCOUNT_ASSET)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.GL.ACCOUNT_EXPENSE)).toBe(true)
    })

    it('should use lowercase v', () => {
      Object.values(HERA_CODES).forEach(category => {
        Object.values(category).forEach(code => {
          expect(code).toMatch(/\.v\d+$/)
          expect(code).not.toMatch(/\.V\d+$/)
        })
      })
    })
  })
})