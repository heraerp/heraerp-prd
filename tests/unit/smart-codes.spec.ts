import { isValidHeraCode, heraCode } from '@/lib/smart-codes'
import { describe, it, expect } from 'vitest'

describe('smart-code regex', () => {
  it('matches lowercase v only', () => {
    // Valid patterns with lowercase v
    expect(isValidHeraCode('HERA.SALON.POS.SALE.LINE.PAYMENT.v1')).toBe(true)
    expect(isValidHeraCode('HERA.FIN.GL.ACC.ASSET.CASH.v1')).toBe(true)
    expect(isValidHeraCode('HERA.MFG.BOM.COMP.MAT.RAW.v10')).toBe(true)
    
    // Invalid patterns with uppercase V
    expect(isValidHeraCode('HERA.SALON.POS.SALE.LINE.PAYMENT.V1')).toBe(false)
    expect(isValidHeraCode('HERA.FIN.GL.ACC.ASSET.CASH.V1')).toBe(false)
    expect(isValidHeraCode('HERA.MFG.BOM.COMP.MAT.RAW.V10')).toBe(false)
  })

  it('enforces complete pattern requirements', () => {
    // Too short (not enough segments)
    expect(isValidHeraCode('HERA.SALON.v1')).toBe(false)
    expect(isValidHeraCode('HERA.SALON.POS.v1')).toBe(false)
    
    // Missing version
    expect(isValidHeraCode('HERA.SALON.POS.SALE.LINE.PAYMENT')).toBe(false)
    
    // Invalid characters (lowercase in segments)
    expect(isValidHeraCode('HERA.salon.POS.SALE.LINE.PAYMENT.v1')).toBe(false)
    expect(isValidHeraCode('HERA.SALON.pos.SALE.LINE.PAYMENT.v1')).toBe(false)
    
    // Not starting with HERA
    expect(isValidHeraCode('ERA.SALON.POS.SALE.LINE.PAYMENT.v1')).toBe(false)
    expect(isValidHeraCode('HERO.SALON.POS.SALE.LINE.PAYMENT.v1')).toBe(false)
  })

  it('heraCode helper fixes uppercase V to lowercase v', () => {
    expect(heraCode('HERA.SALON.POS.SALE.HEADER.V1')).toBe('HERA.SALON.POS.SALE.HEADER.v1')
    expect(heraCode('HERA.SALON.POS.SALE.HEADER.V10')).toBe('HERA.SALON.POS.SALE.HEADER.v10')
    expect(heraCode('HERA.SALON.POS.SALE.HEADER.v1')).toBe('HERA.SALON.POS.SALE.HEADER.v1')
  })

  it('validates POS-specific smart codes', () => {
    const posSmartCodes = [
      'HERA.SALON.POS.SALE.HEADER.v1',
      'HERA.SALON.POS.LINE.SERVICE.v1',
      'HERA.SALON.POS.LINE.PRODUCT.v1',
      'HERA.SALON.POS.LINE.TAX.v1',
      'HERA.SALON.POS.LINE.DISCOUNT.v1',
      'HERA.SALON.POS.LINE.TIP.v1',
      'HERA.SALON.POS.PAYMENT.CASH.v1',
      'HERA.SALON.POS.PAYMENT.CARD.v1',
      'HERA.SALON.POS.PAYMENT.VOUCHER.v1',
      'HERA.SALON.POS.LINE.COMMISSION.EXPENSE.v1',
      'HERA.SALON.POS.LINE.COMMISSION.PAYABLE.v1'
    ]

    posSmartCodes.forEach(code => {
      expect(isValidHeraCode(code)).toBe(true)
      // Verify they all end with lowercase v
      expect(code).toMatch(/\.v\d+$/)
    })
  })
})