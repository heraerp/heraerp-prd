/**
 * ============================================================================
 * GL POSTING ENGINE V2.0 - COMPREHENSIVE UNIT TESTS
 * ============================================================================
 * Smart Code: HERA.FINANCE.TEST.GL_POSTING_ENGINE.v1
 *
 * Test Coverage:
 * - Revenue breakdown calculation (service vs product)
 * - Proportional cart discount allocation
 * - Staff-based tip allocation
 * - GL line generation with dimensions
 * - GL balance validation (DR = CR)
 * - Enhanced metadata generation
 * - Backward compatibility with v1.0
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest'
import {
  calculateRevenueBreakdown,
  allocateTipsByStaff,
  generateEnhancedGLLines,
  validateGLBalance,
  generateEnhancedMetadata,
  GL_ACCOUNTS,
  GL_SMART_CODES
} from '@/lib/finance/gl-posting-engine'

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const MOCK_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_BRANCH_ID = '00000000-0000-0000-0000-000000000002'
const MOCK_CUSTOMER_ID = '00000000-0000-0000-0000-000000000003'
const MOCK_STAFF_1 = { id: '00000000-0000-0000-0000-000000000004', name: 'Alice Smith' }
const MOCK_STAFF_2 = { id: '00000000-0000-0000-0000-000000000005', name: 'Bob Johnson' }

const MOCK_SERVICE_ITEMS = [
  {
    id: '1',
    entity_id: 'service-1',
    name: 'Haircut',
    type: 'service' as const,
    quantity: 1,
    unit_price: 100,
    discount: 0,
    staff_id: MOCK_STAFF_1.id
  },
  {
    id: '2',
    entity_id: 'service-2',
    name: 'Hair Coloring',
    type: 'service' as const,
    quantity: 1,
    unit_price: 200,
    discount: 10,
    staff_id: MOCK_STAFF_2.id
  }
]

const MOCK_PRODUCT_ITEMS = [
  {
    id: '3',
    entity_id: 'product-1',
    name: 'Shampoo',
    type: 'product' as const,
    quantity: 2,
    unit_price: 50,
    discount: 0
  },
  {
    id: '4',
    entity_id: 'product-2',
    name: 'Conditioner',
    type: 'product' as const,
    quantity: 1,
    unit_price: 30,
    discount: 5
  }
]

const MOCK_MIXED_CART = [...MOCK_SERVICE_ITEMS, ...MOCK_PRODUCT_ITEMS]

const MOCK_PAYMENTS = [
  { method: 'card' as const, amount: 350 },
  { method: 'cash' as const, amount: 100 }
]

// ============================================================================
// TEST SUITE: Revenue Breakdown Calculation
// ============================================================================

describe('calculateRevenueBreakdown', () => {
  it('should correctly separate service and product revenue', () => {
    const result = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)

    // Service gross = 100 + 200 = 300
    expect(result.service.gross).toBe(300)
    // Product gross = (2 * 50) + 30 = 130
    expect(result.product.gross).toBe(130)
    // Total gross = 300 + 130 = 430
    expect(result.totals.total_gross).toBe(430)
  })

  it('should calculate item-level discounts correctly', () => {
    const result = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)

    // Service item discounts: 0 + 10 = 10
    expect(result.service.item_discount).toBe(10)
    // Product item discounts: 0 + 5 = 5
    expect(result.product.item_discount).toBe(5)
  })

  it('should allocate cart-level discount proportionally', () => {
    const cartDiscount = 43 // 10% of 430 total
    const result = calculateRevenueBreakdown(MOCK_MIXED_CART, cartDiscount, 0.05)

    // Service proportion: 300/430 = 0.6977 -> cart discount = 30
    // Product proportion: 130/430 = 0.3023 -> cart discount = 13
    expect(result.service.cart_discount).toBeCloseTo(30, 0)
    expect(result.product.cart_discount).toBeCloseTo(13, 0)
  })

  it('should calculate net amounts after all discounts', () => {
    const cartDiscount = 43
    const result = calculateRevenueBreakdown(MOCK_MIXED_CART, cartDiscount, 0.05)

    // Service net = 300 - 10 (item) - 30 (cart) = 260
    expect(result.service.net).toBeCloseTo(260, 0)
    // Product net = 130 - 5 (item) - 13 (cart) = 112
    expect(result.product.net).toBeCloseTo(112, 0)
  })

  it('should calculate VAT on net amounts', () => {
    const taxRate = 0.05 // 5% VAT
    const result = calculateRevenueBreakdown(MOCK_MIXED_CART, 43, taxRate)

    // Service VAT = 260 * 0.05 = 13
    expect(result.service.vat).toBeCloseTo(13, 0)
    // Product VAT = 112 * 0.05 = 5.6
    expect(result.product.vat).toBeCloseTo(5.6, 0)
  })

  it('should handle zero-discount scenario', () => {
    const result = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)

    expect(result.service.item_discount).toBe(10) // Only item discount
    expect(result.service.cart_discount).toBe(0)
  })

  it('should handle service-only cart', () => {
    const result = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)

    expect(result.service.gross).toBe(300)
    expect(result.product.gross).toBe(0)
    expect(result.product.item_count).toBe(0)
  })

  it('should handle product-only cart', () => {
    const result = calculateRevenueBreakdown(MOCK_PRODUCT_ITEMS, 0, 0.05)

    expect(result.product.gross).toBe(130)
    expect(result.service.gross).toBe(0)
    expect(result.service.item_count).toBe(0)
  })

  it('should handle empty cart', () => {
    const result = calculateRevenueBreakdown([], 0, 0.05)

    expect(result.service.gross).toBe(0)
    expect(result.product.gross).toBe(0)
    expect(result.totals.total_gross).toBe(0)
  })
})

// ============================================================================
// TEST SUITE: Tip Allocation by Staff
// ============================================================================

describe('allocateTipsByStaff', () => {
  it('should allocate tips proportionally to service value', () => {
    const totalTips = 45
    const result = allocateTipsByStaff(MOCK_SERVICE_ITEMS, totalTips)

    // Staff 1 service value: 100 (33.33%)
    // Staff 2 service value: 200 (66.67%)
    expect(result).toHaveLength(2)

    const staff1 = result.find(s => s.staff_id === MOCK_STAFF_1.id)
    const staff2 = result.find(s => s.staff_id === MOCK_STAFF_2.id)

    expect(staff1?.tip_amount).toBeCloseTo(15, 0) // 45 * 0.3333
    expect(staff2?.tip_amount).toBeCloseTo(30, 0) // 45 * 0.6667
  })

  it('should count services correctly per staff', () => {
    const result = allocateTipsByStaff(MOCK_SERVICE_ITEMS, 45)

    const staff1 = result.find(s => s.staff_id === MOCK_STAFF_1.id)
    const staff2 = result.find(s => s.staff_id === MOCK_STAFF_2.id)

    expect(staff1?.service_count).toBe(1)
    expect(staff2?.service_count).toBe(1)
  })

  it('should handle multiple services for same staff', () => {
    const multipleServices = [
      { ...MOCK_SERVICE_ITEMS[0], staff_id: MOCK_STAFF_1.id },
      { ...MOCK_SERVICE_ITEMS[1], staff_id: MOCK_STAFF_1.id }
    ]
    const result = allocateTipsByStaff(multipleServices, 30)

    expect(result).toHaveLength(1)
    expect(result[0].service_count).toBe(2)
    expect(result[0].tip_amount).toBe(30) // All tips go to one staff
  })

  it('should handle zero tips', () => {
    const result = allocateTipsByStaff(MOCK_SERVICE_ITEMS, 0)

    result.forEach(staff => {
      expect(staff.tip_amount).toBe(0)
    })
  })

  it('should handle items without staff assignment', () => {
    const itemsWithoutStaff = MOCK_SERVICE_ITEMS.map(item => ({ ...item, staff_id: undefined }))
    const result = allocateTipsByStaff(itemsWithoutStaff, 45)

    expect(result).toHaveLength(0) // No staff to allocate to
  })

  it('should ignore product items when allocating tips', () => {
    const result = allocateTipsByStaff(MOCK_MIXED_CART, 30)

    // Only service items (with staff) should receive tips
    expect(result).toHaveLength(2)
    result.forEach(staff => {
      expect(staff.tip_amount).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// TEST SUITE: GL Line Generation
// ============================================================================

describe('generateEnhancedGLLines', () => {
  it('should generate balanced GL entry (DR = CR)', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 43, 0.05)
    const tipAllocation = allocateTipsByStaff(MOCK_SERVICE_ITEMS, 30)
    const totalAmount = 450

    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      tipAllocation,
      totalAmount,
      {
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        sale_code: 'SALE-001',
        tax_rate: 0.05
      }
    )

    const validation = validateGLBalance(glLines)
    expect(validation.isBalanced).toBe(true)
    expect(validation.totalDR).toBeCloseTo(validation.totalCR, 2)
  })

  it('should create debit entries for payment methods', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      [],
      450,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const cashLine = glLines.find(l => l.line_data?.payment_method === 'cash')
    const cardLine = glLines.find(l => l.line_data?.payment_method === 'card')

    expect(cashLine?.side).toBe('DR')
    expect(cashLine?.amount).toBe(100)
    expect(cardLine?.side).toBe('DR')
    expect(cardLine?.amount).toBe(350)
  })

  it('should create credit entries for service revenue', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      [],
      450,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const serviceRevenueLine = glLines.find(
      l => l.gl_account_code === GL_ACCOUNTS.SERVICE_REVENUE.code && l.side === 'CR'
    )

    expect(serviceRevenueLine).toBeDefined()
    expect(serviceRevenueLine?.line_data?.revenue_type).toBe('service')
    expect(serviceRevenueLine?.amount).toBeGreaterThan(0)
  })

  it('should create credit entries for product revenue', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_PRODUCT_ITEMS, 0, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      [{ method: 'cash', amount: 130 }],
      [],
      130,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const productRevenueLine = glLines.find(
      l => l.gl_account_code === GL_ACCOUNTS.PRODUCT_REVENUE.code && l.side === 'CR'
    )

    expect(productRevenueLine).toBeDefined()
    expect(productRevenueLine?.line_data?.revenue_type).toBe('product')
  })

  it('should create debit entries for discounts', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 43, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      [],
      450,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const serviceDiscountLine = glLines.find(
      l => l.gl_account_code === GL_ACCOUNTS.SERVICE_DISCOUNT.code
    )
    const productDiscountLine = glLines.find(
      l => l.gl_account_code === GL_ACCOUNTS.PRODUCT_DISCOUNT.code
    )

    expect(serviceDiscountLine?.side).toBe('DR')
    expect(productDiscountLine?.side).toBe('DR')
  })

  it('should create credit entries for VAT', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      [],
      450,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const vatLines = glLines.filter(l => l.gl_account_code === GL_ACCOUNTS.VAT_PAYABLE.code)

    // Should have 2 VAT lines: one for service, one for product
    expect(vatLines.length).toBeGreaterThanOrEqual(1)
    vatLines.forEach(line => {
      expect(line.side).toBe('CR')
      expect(line.line_data?.revenue_type).toBeDefined()
    })
  })

  it('should create credit entries for tips by staff', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)
    const tipAllocation = allocateTipsByStaff(MOCK_SERVICE_ITEMS, 30)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      tipAllocation,
      480,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const tipLines = glLines.filter(l => l.gl_account_code === GL_ACCOUNTS.TIPS_PAYABLE.code)

    expect(tipLines.length).toBe(2) // One per staff member
    tipLines.forEach(line => {
      expect(line.side).toBe('CR')
      expect(line.line_data?.staff_id).toBeDefined()
      expect(line.amount).toBeGreaterThan(0)
    })
  })

  it('should include dimensional data in line_data', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      [],
      450,
      {
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        sale_code: 'SALE-001',
        tax_rate: 0.05
      }
    )

    glLines.forEach(line => {
      expect(line.line_data).toBeDefined()
      expect(line.line_data?.branch_id).toBe(MOCK_BRANCH_ID)
      expect(line.line_data?.customer_id).toBe(MOCK_CUSTOMER_ID)
      expect(line.line_data?.sale_code).toBe('SALE-001')
    })
  })

  it('should assign correct smart codes to GL lines', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)
    const glLines = generateEnhancedGLLines(
      breakdown,
      MOCK_PAYMENTS,
      [],
      300,
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    glLines.forEach(line => {
      expect(line.smart_code).toBeDefined()
      expect(line.smart_code).toMatch(/^HERA\./)
    })
  })
})

// ============================================================================
// TEST SUITE: GL Balance Validation
// ============================================================================

describe('validateGLBalance', () => {
  it('should validate balanced entry correctly', () => {
    const glLines = [
      { side: 'DR', amount: 100 },
      { side: 'DR', amount: 50 },
      { side: 'CR', amount: 150 }
    ]

    const result = validateGLBalance(glLines as any)

    expect(result.isBalanced).toBe(true)
    expect(result.totalDR).toBe(150)
    expect(result.totalCR).toBe(150)
    expect(result.difference).toBe(0)
  })

  it('should detect unbalanced entry', () => {
    const glLines = [
      { side: 'DR', amount: 100 },
      { side: 'CR', amount: 90 }
    ]

    const result = validateGLBalance(glLines as any)

    expect(result.isBalanced).toBe(false)
    expect(result.difference).toBe(10)
  })

  it('should handle rounding differences within tolerance', () => {
    const glLines = [
      { side: 'DR', amount: 100.005 },
      { side: 'CR', amount: 100.004 }
    ]

    const result = validateGLBalance(glLines as any)

    // Within 0.01 tolerance
    expect(result.isBalanced).toBe(true)
  })

  it('should handle empty GL lines', () => {
    const result = validateGLBalance([])

    expect(result.isBalanced).toBe(true)
    expect(result.totalDR).toBe(0)
    expect(result.totalCR).toBe(0)
  })
})

// ============================================================================
// TEST SUITE: Enhanced Metadata Generation
// ============================================================================

describe('generateEnhancedMetadata', () => {
  it('should include backward-compatible v1 fields', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const metadata = generateEnhancedMetadata(
      breakdown,
      [],
      MOCK_PAYMENTS,
      { totalDR: 450, totalCR: 450, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.origin_transaction_id).toBe('txn-123')
    expect(metadata.posting_source).toBe('pos_auto_post_v2')
    expect(metadata.total_dr).toBe(450)
    expect(metadata.total_cr).toBe(450)
  })

  it('should include v2 enhanced revenue breakdown', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 43, 0.05)
    const metadata = generateEnhancedMetadata(
      breakdown,
      [],
      MOCK_PAYMENTS,
      { totalDR: 450, totalCR: 450, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.service_revenue_gross).toBeGreaterThan(0)
    expect(metadata.service_revenue_net).toBeGreaterThan(0)
    expect(metadata.product_revenue_gross).toBeGreaterThan(0)
    expect(metadata.product_revenue_net).toBeGreaterThan(0)
  })

  it('should include VAT breakdown by category', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const metadata = generateEnhancedMetadata(
      breakdown,
      [],
      MOCK_PAYMENTS,
      { totalDR: 450, totalCR: 450, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.vat_on_services).toBeGreaterThan(0)
    expect(metadata.vat_on_products).toBeGreaterThan(0)
  })

  it('should include tips allocation data', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)
    const tipAllocation = allocateTipsByStaff(MOCK_SERVICE_ITEMS, 30)
    const metadata = generateEnhancedMetadata(
      breakdown,
      tipAllocation,
      MOCK_PAYMENTS,
      { totalDR: 330, totalCR: 330, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.tips_by_staff).toHaveLength(2)
    metadata.tips_by_staff.forEach(staffTip => {
      expect(staffTip.staff_id).toBeDefined()
      expect(staffTip.tip_amount).toBeGreaterThan(0)
    })
  })

  it('should include payment method breakdown', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const metadata = generateEnhancedMetadata(
      breakdown,
      [],
      MOCK_PAYMENTS,
      { totalDR: 450, totalCR: 450, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.payments_by_method).toHaveLength(2)
    const cashPayment = metadata.payments_by_method.find(p => p.method === 'cash')
    const cardPayment = metadata.payments_by_method.find(p => p.method === 'card')

    expect(cashPayment?.amount).toBe(100)
    expect(cardPayment?.amount).toBe(350)
  })

  it('should include GL engine version', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const metadata = generateEnhancedMetadata(
      breakdown,
      [],
      MOCK_PAYMENTS,
      { totalDR: 450, totalCR: 450, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.gl_engine_version).toBe('v2.0.0')
  })

  it('should include posting timestamp', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_MIXED_CART, 0, 0.05)
    const metadata = generateEnhancedMetadata(
      breakdown,
      [],
      MOCK_PAYMENTS,
      { totalDR: 450, totalCR: 450, isBalanced: true, difference: 0 },
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: 0.05
      }
    )

    expect(metadata.posting_timestamp).toBeDefined()
    expect(new Date(metadata.posting_timestamp).toISOString()).toBe(metadata.posting_timestamp)
  })
})

// ============================================================================
// TEST SUITE: Edge Cases & Error Handling
// ============================================================================

describe('Edge Cases', () => {
  it('should handle cart with only discounts (no positive revenue)', () => {
    const discountedItems = MOCK_SERVICE_ITEMS.map(item => ({
      ...item,
      discount: item.unit_price // 100% discount
    }))

    const breakdown = calculateRevenueBreakdown(discountedItems, 0, 0.05)

    expect(breakdown.service.net).toBe(0)
    expect(breakdown.service.vat).toBe(0)
  })

  it('should handle very small amounts (rounding edge case)', () => {
    const smallItems = [
      {
        id: '1',
        entity_id: 'service-1',
        name: 'Small Service',
        type: 'service' as const,
        quantity: 1,
        unit_price: 0.01,
        discount: 0,
        staff_id: MOCK_STAFF_1.id
      }
    ]

    const breakdown = calculateRevenueBreakdown(smallItems, 0, 0.05)

    expect(breakdown.service.gross).toBe(0.01)
    expect(breakdown.service.vat).toBeCloseTo(0.0005, 4)
  })

  it('should handle large transaction amounts', () => {
    const largeItems = [
      {
        id: '1',
        entity_id: 'service-1',
        name: 'Large Service',
        type: 'service' as const,
        quantity: 1,
        unit_price: 999999.99,
        discount: 0,
        staff_id: MOCK_STAFF_1.id
      }
    ]

    const breakdown = calculateRevenueBreakdown(largeItems, 0, 0.05)

    expect(breakdown.service.gross).toBe(999999.99)
    expect(breakdown.service.vat).toBeCloseTo(49999.9995, 2)
  })

  it('should handle mixed payments totaling exact amount', () => {
    const breakdown = calculateRevenueBreakdown(MOCK_SERVICE_ITEMS, 0, 0.05)
    const payments = [
      { method: 'cash' as const, amount: 100 },
      { method: 'card' as const, amount: 215 }
    ]

    const glLines = generateEnhancedGLLines(
      breakdown,
      payments,
      [],
      315, // 300 revenue + 15 VAT
      { branch_id: MOCK_BRANCH_ID, customer_id: MOCK_CUSTOMER_ID, sale_code: 'SALE-001', tax_rate: 0.05 }
    )

    const validation = validateGLBalance(glLines)
    expect(validation.isBalanced).toBe(true)
  })
})

// ============================================================================
// TEST SUITE: Integration Tests
// ============================================================================

describe('Full GL Posting Integration', () => {
  it('should create complete GL entry for realistic POS sale', () => {
    // Realistic scenario: Mixed cart with discounts, tips, VAT, multiple payments
    const cartItems = MOCK_MIXED_CART
    const cartDiscount = 43 // 10% cart-wide discount
    const tips = 30
    const taxRate = 0.05
    const payments = MOCK_PAYMENTS

    // Step 1: Calculate revenue breakdown
    const breakdown = calculateRevenueBreakdown(cartItems, cartDiscount, taxRate)

    // Step 2: Allocate tips
    const tipAllocation = allocateTipsByStaff(cartItems, tips)

    // Step 3: Generate GL lines
    const totalAmount = breakdown.totals.total_gross + breakdown.totals.total_vat + tips
    const glLines = generateEnhancedGLLines(
      breakdown,
      payments,
      tipAllocation,
      totalAmount,
      {
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        sale_code: 'SALE-001',
        tax_rate: taxRate
      }
    )

    // Step 4: Validate balance
    const validation = validateGLBalance(glLines)

    // Step 5: Generate metadata
    const metadata = generateEnhancedMetadata(
      breakdown,
      tipAllocation,
      payments,
      validation,
      {
        origin_transaction_id: 'txn-123',
        origin_transaction_code: 'SALE-001',
        branch_id: MOCK_BRANCH_ID,
        customer_id: MOCK_CUSTOMER_ID,
        tax_rate: taxRate
      }
    )

    // Assertions
    expect(validation.isBalanced).toBe(true)
    expect(glLines.length).toBeGreaterThan(5) // Multiple GL lines
    expect(metadata.gl_engine_version).toBe('v2.0.0')
    expect(metadata.service_revenue_net).toBeGreaterThan(0)
    expect(metadata.product_revenue_net).toBeGreaterThan(0)
    expect(metadata.tips_by_staff.length).toBe(2)
    expect(metadata.payments_by_method.length).toBe(2)
  })
})
