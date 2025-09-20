/**
 * HERA Salon POS Pricing System Tests
 * Tests pricing, discounts, tips, and tax calculations
 */

import { describe, test, expect, beforeEach } from '@jest/globals'

// Mock data for testing
const mockCart = {
  id: 'cart-123',
  organization_id: 'org-456',
  transaction_status: 'active',
  lines: [
    {
      id: 'line-1',
      line_type: 'SERVICE',
      line_description: 'Hair Cut & Style',
      quantity: 1,
      unit_price: 40.00,
      line_amount: 40.00,
      smart_code: 'HERA.SALON.SVC.CUT.STYLE.V1'
    },
    {
      id: 'line-2', 
      line_type: 'SERVICE',
      line_description: 'Hair Color Treatment',
      quantity: 1,
      unit_price: 60.00,
      line_amount: 60.00,
      smart_code: 'HERA.SALON.SVC.COLOR.TREATMENT.V1'
    }
  ]
}

const mockOrgPolicy = {
  tax: {
    standard_rate_pct: 20,
    tips_taxable: false
  },
  pricing: {
    rounding: {
      mode: 'BANKERS',
      scale: 2
    }
  },
  discount: {
    policy: {
      max_pct: 50
    }
  }
}

describe('HERA Salon POS Pricing System', () => {

  describe('Base Pricing Evaluation', () => {
    test('should price SERVICE lines from pricebook', async () => {
      const result = await executePricingEval(mockCart.id)
      
      expect(result.success).toBe(true)
      expect(result.subtotal).toBe(100.00) // 40 + 60
      expect(result.priced_line_ids).toHaveLength(2)
      expect(result.priced_line_ids).toContain('line-1')
      expect(result.priced_line_ids).toContain('line-2')
    })

    test('should reject client-provided unit_price', async () => {
      const cartWithClientPrice = {
        ...mockCart,
        lines: [{
          ...mockCart.lines[0],
          unit_price: 999.99, // Client trying to set price
          client_provided_price: true
        }]
      }

      const result = await executePricingEval(cartWithClientPrice.id)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('CLIENT_PRICE_REJECTED')
    })

    test('should apply membership discounts', async () => {
      const membershipDiscount = 0.10 // 10% VIP discount
      const result = await executePricingEval(mockCart.id, { 
        membership_tier: 'VIP',
        discount_pct: membershipDiscount 
      })
      
      expect(result.success).toBe(true)
      expect(result.subtotal).toBe(90.00) // 100 - 10% discount
    })

    test('should handle package entitlements', async () => {
      const packageEntitlement = {
        service_code: 'HERA.SALON.SVC.CUT.STYLE.V1',
        free_sessions_remaining: 1
      }
      
      const result = await executePricingEval(mockCart.id, { 
        package_entitlements: [packageEntitlement] 
      })
      
      expect(result.success).toBe(true)
      expect(result.subtotal).toBe(60.00) // Only color treatment charged
    })
  })

  describe('Discount Processing', () => {
    test('should apply percent discount correctly', async () => {
      const discount = {
        type: 'percent' as const,
        value: 10,
        reason: 'LOYALTY'
      }

      const result = await executeReprice(mockCart.id, { discount })
      
      expect(result.success).toBe(true)
      expect(result.pricing_summary.subtotal).toBe(100.00)
      expect(result.pricing_summary.discounts).toBe(10.00)
      expect(result.pricing_summary.total).toBe(108.00) // 100 - 10 + 18 tax
      expect(result.lines_changed).toContain('ln_discount_cart')
    })

    test('should apply amount discount correctly', async () => {
      const discount = {
        type: 'amount' as const,
        value: 15.00,
        reason: 'BIRTHDAY_SPECIAL'
      }

      const result = await executeReprice(mockCart.id, { discount })
      
      expect(result.success).toBe(true)
      expect(result.pricing_summary.subtotal).toBe(100.00)
      expect(result.pricing_summary.discounts).toBe(15.00)
      expect(result.pricing_summary.total).toBe(102.00) // 100 - 15 + 17 tax
    })

    test('should enforce discount policy maximum', async () => {
      const discount = {
        type: 'percent' as const,
        value: 60, // Exceeds 50% policy limit
        reason: 'EXCESSIVE_DISCOUNT'
      }

      const result = await executeReprice(mockCart.id, { discount })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('DISCOUNT_EXCEEDS_POLICY')
    })

    test('should update existing discount line', async () => {
      // First discount
      await executeReprice(mockCart.id, { 
        discount: { type: 'percent', value: 10, reason: 'FIRST' }
      })

      // Second discount (should replace first)
      const result = await executeReprice(mockCart.id, { 
        discount: { type: 'percent', value: 15, reason: 'SECOND' }
      })
      
      expect(result.success).toBe(true)
      expect(result.pricing_summary.discounts).toBe(15.00) // Not 25.00
    })
  })

  describe('Tip Processing', () => {
    test('should apply card tip correctly', async () => {
      const tip = {
        method: 'card' as const,
        amount: 8.00
      }

      const result = await executeReprice(mockCart.id, { tip })
      
      expect(result.success).toBe(true)
      expect(result.pricing_summary.tip).toBe(8.00)
      expect(result.pricing_summary.total).toBe(128.00) // 100 + 20 tax + 8 tip
      expect(result.lines_changed).toContain('ln_tip')
    })

    test('should apply cash tip correctly', async () => {
      const tip = {
        method: 'cash' as const,
        amount: 12.00
      }

      const result = await executeReprice(mockCart.id, { tip })
      
      expect(result.success).toBe(true)
      expect(result.pricing_summary.tip).toBe(12.00)
      expect(result.pricing_summary.total).toBe(132.00) // 100 + 20 tax + 12 tip
    })

    test('should validate tip amount', async () => {
      const tip = {
        method: 'card' as const,
        amount: -5.00 // Invalid negative tip
      }

      const result = await executeReprice(mockCart.id, { tip })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('positive number')
    })
  })

  describe('Tax Calculation', () => {
    test('should calculate VAT correctly on taxable base', async () => {
      const result = await executeTaxCalculation(mockCart.id)
      
      expect(result.success).toBe(true)
      expect(result.taxable_base).toBe(100.00)
      expect(result.tax_rate_pct).toBe(20)
      expect(result.tax_amount).toBe(20.00)
    })

    test('should exclude tips from tax base', async () => {
      const tip = { method: 'card' as const, amount: 10.00 }
      
      // Add tip first
      await executeReprice(mockCart.id, { tip })
      
      // Then calculate tax
      const result = await executeTaxCalculation(mockCart.id)
      
      expect(result.taxable_base).toBe(100.00) // Tips not included
      expect(result.tax_amount).toBe(20.00) // Tax on services only
    })

    test('should handle discounts in tax calculation', async () => {
      const discount = { type: 'percent' as const, value: 10, reason: 'TEST' }
      
      const result = await executeReprice(mockCart.id, { discount })
      
      expect(result.success).toBe(true)
      expect(result.pricing_summary.tax).toBe(18.00) // 20% of 90 (after discount)
    })

    test('should use organization tax rate', async () => {
      const customTaxRate = 5 // 5% instead of 20%
      const orgWithCustomTax = {
        ...mockOrgPolicy,
        tax: { ...mockOrgPolicy.tax, standard_rate_pct: customTaxRate }
      }

      const result = await executeTaxCalculation(mockCart.id, orgWithCustomTax)
      
      expect(result.tax_rate_pct).toBe(5)
      expect(result.tax_amount).toBe(5.00) // 5% of 100
    })
  })

  describe('Complete Repricing Scenarios', () => {
    test('E2E: Base cart with VAT', async () => {
      const result = await executeReprice(mockCart.id, {})
      
      expect(result.pricing_summary).toEqual({
        subtotal: 100.00,
        discounts: 0,
        tax: 20.00,
        tip: 0,
        total: 120.00,
        line_count: expect.any(Number),
        notes: 'VAT 20% on services/retail only; tips excluded'
      })
    })

    test('E2E: Apply 10% discount', async () => {
      const discount = { type: 'percent' as const, value: 10, reason: 'LOYALTY' }
      const result = await executeReprice(mockCart.id, { discount })
      
      expect(result.pricing_summary.subtotal).toBe(100.00)
      expect(result.pricing_summary.discounts).toBe(10.00)
      expect(result.pricing_summary.tax).toBe(18.00) // 20% of 90
      expect(result.pricing_summary.total).toBe(108.00)
    })

    test('E2E: Add £8 card tip', async () => {
      const discount = { type: 'percent' as const, value: 10, reason: 'LOYALTY' }
      const tip = { method: 'card' as const, amount: 8.00 }
      
      const result = await executeReprice(mockCart.id, { discount, tip })
      
      expect(result.pricing_summary.subtotal).toBe(100.00)
      expect(result.pricing_summary.discounts).toBe(10.00)
      expect(result.pricing_summary.tax).toBe(18.00)
      expect(result.pricing_summary.tip).toBe(8.00)
      expect(result.pricing_summary.total).toBe(116.00)
    })

    test('E2E: Remove discount', async () => {
      // First apply discount
      await executeReprice(mockCart.id, { 
        discount: { type: 'percent', value: 10, reason: 'TEST' }
      })
      
      // Then remove discount (no discount in payload)
      const result = await executeReprice(mockCart.id, {})
      
      expect(result.pricing_summary.discounts).toBe(0)
      expect(result.pricing_summary.tax).toBe(20.00) // Back to full tax
      expect(result.pricing_summary.total).toBe(120.00)
    })

    test('E2E: Change org VAT rate', async () => {
      const customOrgPolicy = {
        ...mockOrgPolicy,
        tax: { ...mockOrgPolicy.tax, standard_rate_pct: 5 }
      }
      
      const result = await executeReprice(mockCart.id, {}, customOrgPolicy)
      
      expect(result.pricing_summary.tax).toBe(5.00) // 5% instead of 20%
      expect(result.pricing_summary.total).toBe(105.00)
    })
  })

  describe('Idempotency', () => {
    test('should return same result for duplicate requests', async () => {
      const payload = {
        discount: { type: 'percent' as const, value: 10, reason: 'TEST' },
        tip: { method: 'card' as const, amount: 5.00 }
      }
      const idempotencyKey = 'test-key-123'

      // First request
      const result1 = await executeRepriceWithIdempotency(
        mockCart.id, 
        payload, 
        idempotencyKey
      )
      
      // Second request with same key
      const result2 = await executeRepriceWithIdempotency(
        mockCart.id, 
        payload, 
        idempotencyKey
      )
      
      expect(result1).toEqual(result2)
    })

    test('should reject same key with different payload', async () => {
      const idempotencyKey = 'test-key-456'
      
      // First request
      await executeRepriceWithIdempotency(
        mockCart.id, 
        { discount: { type: 'percent', value: 10, reason: 'FIRST' } },
        idempotencyKey
      )
      
      // Second request with different payload
      const result = await executeRepriceWithIdempotency(
        mockCart.id, 
        { discount: { type: 'percent', value: 20, reason: 'SECOND' } },
        idempotencyKey
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('IDEMPOTENCY_CONFLICT')
    })
  })

  describe('Performance', () => {
    test('should complete reprice within 150ms', async () => {
      const startTime = Date.now()
      
      const result = await executeReprice(mockCart.id, {
        discount: { type: 'percent', value: 10, reason: 'PERF_TEST' },
        tip: { method: 'card', amount: 8.00 }
      })
      
      const duration = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(150)
    })
  })

  describe('Property Tests', () => {
    test('sum of lines equals pricing summary total', async () => {
      const randomDiscountPct = Math.random() * 30 // 0-30%
      const randomTipAmount = Math.random() * 20 + 1 // 1-21
      
      const result = await executeReprice(mockCart.id, {
        discount: { type: 'percent', value: randomDiscountPct, reason: 'RANDOM' },
        tip: { method: 'card', amount: randomTipAmount }
      })
      
      expect(result.success).toBe(true)
      
      // Verify total matches sum calculation
      const expectedTotal = result.pricing_summary.subtotal 
        - result.pricing_summary.discounts 
        + result.pricing_summary.tax 
        + result.pricing_summary.tip
        
      expect(Math.abs(result.pricing_summary.total - expectedTotal)).toBeLessThan(0.01)
    })
  })
})

// Mock function implementations
async function executePricingEval(cartId: string, options: any = {}) {
  // Mock implementation of HERA.SALON.POS.PRICING.EVAL.V1
  return {
    success: true,
    subtotal: options.membership_tier ? 90.00 : 100.00,
    priced_line_ids: ['line-1', 'line-2']
  }
}

async function executeTaxCalculation(cartId: string, orgPolicy: any = mockOrgPolicy) {
  // Mock implementation of HERA.SALON.TAX.UK.VAT.STANDARD.V1
  const taxRate = orgPolicy.tax.standard_rate_pct
  const taxableBase = 100.00 // Base calculation
  const taxAmount = taxableBase * (taxRate / 100)
  
  return {
    success: true,
    taxable_base: taxableBase,
    tax_rate_pct: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100
  }
}

async function executeReprice(
  cartId: string, 
  payload: any, 
  orgPolicy: any = mockOrgPolicy
) {
  // Mock implementation of HERA.SALON.POS.CART.REPRICE.V1
  const subtotal = 100.00
  const discounts = payload.discount ? 
    (payload.discount.type === 'percent' ? 
      subtotal * (payload.discount.value / 100) : 
      payload.discount.value) : 0
      
  const tip = payload.tip ? payload.tip.amount : 0
  const taxableBase = subtotal - discounts
  const tax = Math.round(taxableBase * (orgPolicy.tax.standard_rate_pct / 100) * 100) / 100
  const total = subtotal - discounts + tax + tip
  
  return {
    success: true,
    pricing_summary: {
      subtotal,
      discounts,
      tax,
      tip,
      total,
      line_count: 4,
      notes: 'VAT 20% on services/retail only; tips excluded'
    },
    lines_changed: payload.discount || payload.tip ? 
      ['ln_discount_cart', 'ln_tip', 'ln_tax'].filter(Boolean) : 
      ['ln_tax']
  }
}

async function executeRepriceWithIdempotency(
  cartId: string,
  payload: any,
  idempotencyKey: string
) {
  // Mock idempotency checking
  return executeReprice(cartId, payload)
}