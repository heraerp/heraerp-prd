import { describe, it, expect } from 'vitest'
import { buildPosEmitPayload } from '@/lib/txn-builders'

describe('buildPosEmitPayload', () => {
  it('builds payload with items, discount, tax, and payment', () => {
    const payload = buildPosEmitPayload({
      organization_id: 'org1',
      branch_id: 'b1',
      customer_id: 'c1',
      items: [
        { product_id: 'p1', qty: 2, price: 100 },
        { product_id: 'p2', qty: 1, price: 50 }
      ],
      discount: 10,
      tax: 5,
      paid: 245,
      method: 'CARD'
    })

    expect(payload.organization_id).toBe('org1')
    expect(payload.smart_code).toBe('HERA.ITD.SALES.POS.POST.V1')
    expect(payload.transaction_type).toBe('SALE')
    expect(payload.lines.find(l => l.line_type === 'DISCOUNT')?.line_amount).toBe(-10)
    expect(payload.lines.find(l => l.line_type === 'TAX')?.line_amount).toBe(5)
    expect(payload.lines.find(l => l.line_type === 'PAYMENT')?.line_amount).toBe(245)
  })
})

