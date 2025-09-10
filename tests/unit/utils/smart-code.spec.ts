import { describe, it, expect } from 'vitest'
import { isSmartCode } from '../../../src/lib/smart-code'

describe('isSmartCode', () => {
  it('accepts valid HERA smart codes', () => {
    expect(isSmartCode('HERA.RETAIL.ORDERS.SALE.ONLINE.v1')).toBe(true)
    expect(isSmartCode('HERA.ERP.FI.JE.POST.v2')).toBe(true)
  })

  it('rejects invalid codes', () => {
    expect(isSmartCode('hera.RETAIL.ORDERS.SALE.ONLINE.v1')).toBe(false)
    expect(isSmartCode('HERA.RETAIL.ORDERS.v1')).toBe(false)
    expect(isSmartCode('HERA.RETAIL.ORDERS.SALE.ONLINE')).toBe(false)
  })
})

