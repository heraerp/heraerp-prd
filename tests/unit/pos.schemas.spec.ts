// ================================================================================
// HERA POS SCHEMAS UNIT TESTS
// Smart Code: HERA.TEST.UNIT.POS.SCHEMAS.v1
// Test POS schema validation and calculations
// ================================================================================

import { describe, it, expect } from 'vitest'
import {
  CartLine,
  CartState,
  Totals,
  Payment,
  calculateTotals,
  calculateCommission,
} from '@/lib/schemas/pos'

describe('POS Schemas', () => {
  describe('calculateTotals', () => {
    it('should calculate totals for services only', () => {
      const lines: CartLine[] = [
        {
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut',
          qty: 1,
          unit_price: 100,
        },
        {
          kind: 'service',
          service_code: 'SRV-002',
          service_name: 'Hair Color',
          qty: 1,
          unit_price: 200,
        },
      ]

      const totals = calculateTotals(lines)
      
      expect(totals.subtotal_services).toBe(300)
      expect(totals.subtotal_items).toBe(0)
      expect(totals.taxable_subtotal).toBe(300)
      expect(totals.tax_total).toBe(15) // 5% of 300
      expect(totals.grand_total).toBe(315)
    })

    it('should calculate totals with products', () => {
      const lines: CartLine[] = [
        {
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut',
          qty: 1,
          unit_price: 100,
        },
        {
          kind: 'item',
          product_sku: 'PRD-001',
          product_name: 'Shampoo',
          qty: 2,
          unit_price: 50,
        },
      ]

      const totals = calculateTotals(lines)
      
      expect(totals.subtotal_services).toBe(100)
      expect(totals.subtotal_items).toBe(100) // 2 * 50
      expect(totals.taxable_subtotal).toBe(200)
      expect(totals.tax_total).toBe(10) // 5% of 200
      expect(totals.grand_total).toBe(210)
    })

    it('should apply discount correctly', () => {
      const lines: CartLine[] = [
        {
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut',
          qty: 1,
          unit_price: 100,
        },
        {
          kind: 'discount',
          amount: 20,
          reason: '20% discount',
          percentage: 20,
        },
      ]

      const totals = calculateTotals(lines)
      
      expect(totals.subtotal_services).toBe(100)
      expect(totals.discount_total).toBe(20)
      expect(totals.taxable_subtotal).toBe(80) // 100 - 20
      expect(totals.tax_total).toBe(4) // 5% of 80
      expect(totals.grand_total).toBe(84)
    })

    it('should add tip to grand total', () => {
      const lines: CartLine[] = [
        {
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut',
          qty: 1,
          unit_price: 100,
        },
        {
          kind: 'tip',
          amount: 15,
        },
      ]

      const totals = calculateTotals(lines)
      
      expect(totals.subtotal_services).toBe(100)
      expect(totals.tip_total).toBe(15)
      expect(totals.taxable_subtotal).toBe(100)
      expect(totals.tax_total).toBe(5) // 5% of 100
      expect(totals.grand_total).toBe(120) // 100 + 5 + 15
    })

    it('should handle complex cart with all line types', () => {
      const lines: CartLine[] = [
        {
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut',
          qty: 2,
          unit_price: 150,
        },
        {
          kind: 'item',
          product_sku: 'PRD-001',
          product_name: 'Shampoo',
          qty: 1,
          unit_price: 80,
        },
        {
          kind: 'discount',
          amount: 38,
          percentage: 10,
          reason: '10% discount',
        },
        {
          kind: 'tip',
          amount: 50,
        },
      ]

      const totals = calculateTotals(lines)
      
      expect(totals.subtotal_services).toBe(300) // 2 * 150
      expect(totals.subtotal_items).toBe(80)
      expect(totals.discount_total).toBe(38)
      expect(totals.taxable_subtotal).toBe(342) // 300 + 80 - 38
      expect(totals.tax_total).toBe(17.1) // 5% of 342
      expect(totals.tip_total).toBe(50)
      expect(totals.grand_total).toBe(409.1) // 342 + 17.1 + 50
    })

    it('should not allow negative taxable subtotal', () => {
      const lines: CartLine[] = [
        {
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut',
          qty: 1,
          unit_price: 100,
        },
        {
          kind: 'discount',
          amount: 150, // More than subtotal
        },
      ]

      const totals = calculateTotals(lines)
      
      expect(totals.taxable_subtotal).toBe(0) // Should be 0, not negative
      expect(totals.tax_total).toBe(0)
      expect(totals.grand_total).toBe(0)
    })
  })

  describe('calculateCommission', () => {
    it('should calculate 35% commission on services', () => {
      const totals: Totals = {
        currency: 'AED',
        subtotal_services: 1000,
        subtotal_items: 500,
        discount_total: 0,
        taxable_subtotal: 1500,
        tax_rate: 0.05,
        tax_total: 75,
        tip_total: 0,
        grand_total: 1575,
      }

      const commission = calculateCommission(totals)
      
      expect(commission.service_subtotal).toBe(1000)
      expect(commission.commission_rate).toBe(0.35)
      expect(commission.commission_amount).toBe(350) // 35% of 1000
    })

    it('should only calculate commission on services, not products', () => {
      const totals: Totals = {
        currency: 'AED',
        subtotal_services: 500,
        subtotal_items: 1000, // Products don't count
        discount_total: 0,
        taxable_subtotal: 1500,
        tax_rate: 0.05,
        tax_total: 75,
        tip_total: 0,
        grand_total: 1575,
      }

      const commission = calculateCommission(totals)
      
      expect(commission.service_subtotal).toBe(500)
      expect(commission.commission_amount).toBe(175) // 35% of 500, not 1500
    })

    it('should handle zero services', () => {
      const totals: Totals = {
        currency: 'AED',
        subtotal_services: 0,
        subtotal_items: 1000,
        discount_total: 0,
        taxable_subtotal: 1000,
        tax_rate: 0.05,
        tax_total: 50,
        tip_total: 0,
        grand_total: 1050,
      }

      const commission = calculateCommission(totals)
      
      expect(commission.service_subtotal).toBe(0)
      expect(commission.commission_amount).toBe(0)
    })
  })

  describe('Payment validation', () => {
    it('should accept valid cash payment', () => {
      const payment: Payment = {
        method: 'cash',
        amount: 100,
        reference: 'CASH-123456',
      }

      const result = Payment.safeParse(payment)
      expect(result.success).toBe(true)
    })

    it('should accept valid card payment', () => {
      const payment: Payment = {
        method: 'card',
        amount: 200,
        reference: 'CARD-789012',
        card_last_four: '1234',
      }

      const result = Payment.safeParse(payment)
      expect(result.success).toBe(true)
    })

    it('should reject negative payment amount', () => {
      const payment = {
        method: 'cash',
        amount: -50,
      }

      const result = Payment.safeParse(payment)
      expect(result.success).toBe(false)
    })

    it('should reject invalid payment method', () => {
      const payment = {
        method: 'bitcoin', // Not supported
        amount: 100,
      }

      const result = Payment.safeParse(payment)
      expect(result.success).toBe(false)
    })
  })
})