import {
  heraCode,
  isValidHeraCode,
  createHeraCode,
  parseHeraCode,
  HERA_CODES
} from '../smart-codes'

describe('Smart Code Functions', () => {
  describe('heraCode', () => {
    it('should convert uppercase .V to lowercase .v', () => {
      expect(heraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBe('HERA.SALON.POS.SALE.HEADER.V1')
      expect(heraCode('HERA.SALON.POS.LINE.SERVICE.V2')).toBe('HERA.SALON.POS.LINE.SERVICE.V2')
      expect(heraCode('HERA.SALON.POS.LINE.TAX.V10')).toBe('HERA.SALON.POS.LINE.TAX.V10')
    })

    it('should not change already correct codes', () => {
      expect(heraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBe('HERA.SALON.POS.SALE.HEADER.V1')
      expect(heraCode('HERA.SALON.POS.LINE.SERVICE.V2')).toBe('HERA.SALON.POS.LINE.SERVICE.V2')
    })

    it('should handle codes without version', () => {
      expect(heraCode('HERA.SALON.POS.SALE.HEADER')).toBe('HERA.SALON.POS.SALE.HEADER')
    })
  })

  describe('isValidHeraCode', () => {
    it('should validate correct smart codes', () => {
      expect(isValidHeraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBe(true)
      expect(isValidHeraCode('HERA.FIN.GL.ACC.ASSET.CASH.V1')).toBe(true)
      expect(isValidHeraCode('HERA.MFG.BOM.REL.COMP.V1')).toBe(true)
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
      expect(code).toBe('HERA.SALON.POS.SALE.HEADER.V1')
      expect(isValidHeraCode(code)).toBe(true)
    })

    it('should handle custom version', () => {
      const code = createHeraCode(['SALON', 'POS', 'SALE', 'HEADER'], 2)
      expect(code).toBe('HERA.SALON.POS.SALE.HEADER.V2')
    })

    it('should convert segments to uppercase', () => {
      const code = createHeraCode(['salon', 'pos', 'sale', 'header'])
      expect(code).toBe('HERA.SALON.POS.SALE.HEADER.V1')
    })
  })

  describe('parseHeraCode', () => {
    it('should parse valid smart codes', () => {
      const parsed = parseHeraCode('HERA.SALON.POS.SALE.HEADER.V1')
      expect(parsed).toEqual({
        prefix: 'HERA',
        industry: 'SALON',
        module: 'POS',
        parts: ['SALE', 'HEADER'],
        version: 1
      })
    })

    it('should handle multi-digit versions', () => {
      const parsed = parseHeraCode('HERA.SALON.POS.SALE.HEADER.V10')
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
      expect(isValidHeraCode(HERA_CODES.SALON.POS.SALE.HEADER)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.SALON.POS.SALE.LINE.SERVICE)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.SALON.POS.SALE.PAYMENT.CASH)).toBe(true)

      // CRM codes
      expect(isValidHeraCode(HERA_CODES.CRM.CUSTOMER.ENTITY)).toBe(true)
      expect(isValidHeraCode(HERA_CODES.CRM.SALE.TRANSACTION)).toBe(true)

      // Finance codes
      expect(isValidHeraCode(HERA_CODES.FIN.GL.ACCOUNT)).toBe(true)
    })

    it('should use lowercase v', () => {
      const checkNestedCodes = (obj: any) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value).toMatch(/\.v\d+$/)
            expect(value).not.toMatch(/\.V\d+$/)
          } else if (typeof value === 'object' && value !== null) {
            checkNestedCodes(value)
          }
        })
      }

      checkNestedCodes(HERA_CODES)
    })
  })
})
