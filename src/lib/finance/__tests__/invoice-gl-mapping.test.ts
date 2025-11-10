/**
 * Invoice GL Mapping Unit Tests
 *
 * Tests for invoice GL account mapping and double-entry validation
 */

import { describe, it, expect } from 'vitest'
import {
  INVOICE_GL_ACCOUNTS,
  INVOICE_PAYMENT_METHOD_TO_GL,
  generateInvoiceGLLines,
  generateInvoicePaymentGLLines,
  generateInvoiceSmartCode,
  calculateInvoiceAging,
  validateInvoiceData,
  InvoiceLineItem
} from '../invoice-gl-mapping'

describe('Invoice GL Account Mapping', () => {
  it('should have correct GL account definitions', () => {
    expect(INVOICE_GL_ACCOUNTS['120000']).toBeDefined()
    expect(INVOICE_GL_ACCOUNTS['120000'].name).toBe('Accounts Receivable')
    expect(INVOICE_GL_ACCOUNTS['120000'].type).toBe('asset')
    expect(INVOICE_GL_ACCOUNTS['120000'].normal_balance).toBe('DR')

    expect(INVOICE_GL_ACCOUNTS['400000']).toBeDefined()
    expect(INVOICE_GL_ACCOUNTS['400000'].name).toBe('Service Revenue')
    expect(INVOICE_GL_ACCOUNTS['400000'].type).toBe('revenue')
    expect(INVOICE_GL_ACCOUNTS['400000'].normal_balance).toBe('CR')
  })

  it('should have smart codes in HERA format', () => {
    Object.values(INVOICE_GL_ACCOUNTS).forEach(account => {
      expect(account.smart_code).toMatch(/^HERA\.SALON\.FINANCE\.GL\.ACCOUNT\.\w+\.\w+\.v1$/)
    })
  })

  it('should map payment methods to correct GL accounts', () => {
    expect(INVOICE_PAYMENT_METHOD_TO_GL['CASH']).toBe('110000')
    expect(INVOICE_PAYMENT_METHOD_TO_GL['BANK_TRANSFER']).toBe('110100')
    expect(INVOICE_PAYMENT_METHOD_TO_GL['CARD']).toBe('110200')
    expect(INVOICE_PAYMENT_METHOD_TO_GL['CHEQUE']).toBe('110100')
  })
})

describe('generateInvoiceGLLines', () => {
  it('should generate balanced DR/CR lines for simple invoice', () => {
    const invoiceLines: InvoiceLineItem[] = [
      {
        description: 'Hair Treatment',
        quantity: 1,
        unit_amount: 450,
        line_amount: 450
      },
      {
        description: 'Hair Coloring',
        quantity: 1,
        unit_amount: 300,
        line_amount: 300
      }
    ]

    const glLines = generateInvoiceGLLines(
      invoiceLines,
      750,
      'customer-entity-id'
    )

    expect(glLines).toHaveLength(2)

    // DR: Accounts Receivable
    const drLine = glLines.find(line => line.line_data?.side === 'DR')
    expect(drLine).toBeDefined()
    expect(drLine?.line_data?.gl_account_code).toBe('120000')
    expect(drLine?.line_amount).toBe(750)

    // CR: Service Revenue
    const crLine = glLines.find(line => line.line_data?.side === 'CR')
    expect(crLine).toBeDefined()
    expect(crLine?.line_data?.gl_account_code).toBe('400000')
    expect(crLine?.line_amount).toBe(750)

    // Verify balance
    const totalDR = glLines
      .filter(line => line.line_data?.side === 'DR')
      .reduce((sum, line) => sum + line.line_amount, 0)
    const totalCR = glLines
      .filter(line => line.line_data?.side === 'CR')
      .reduce((sum, line) => sum + line.line_amount, 0)

    expect(totalDR).toBe(totalCR)
    expect(totalDR).toBe(750)
  })

  it('should throw error if line items total does not match invoice total', () => {
    const invoiceLines: InvoiceLineItem[] = [
      {
        description: 'Service',
        quantity: 1,
        unit_amount: 100,
        line_amount: 100
      }
    ]

    expect(() => {
      generateInvoiceGLLines(invoiceLines, 200, 'customer-id')
    }).toThrow('Invoice line items total')
  })

  it('should link customer entity to AR line', () => {
    const invoiceLines: InvoiceLineItem[] = [
      {
        description: 'Service',
        quantity: 1,
        unit_amount: 100,
        line_amount: 100
      }
    ]

    const glLines = generateInvoiceGLLines(
      invoiceLines,
      100,
      'customer-uuid-123'
    )

    const arLine = glLines.find(line => line.line_data?.gl_account_code === '120000')
    expect(arLine?.entity_id).toBe('customer-uuid-123')
  })
})

describe('generateInvoicePaymentGLLines', () => {
  it('should generate balanced DR/CR lines for cash payment', () => {
    const glLines = generateInvoicePaymentGLLines(
      750,
      'CASH',
      'customer-entity-id',
      'invoice-txn-id'
    )

    expect(glLines).toHaveLength(2)

    // DR: Cash
    const drLine = glLines.find(line => line.line_data?.side === 'DR')
    expect(drLine).toBeDefined()
    expect(drLine?.line_data?.gl_account_code).toBe('110000')
    expect(drLine?.line_amount).toBe(750)

    // CR: Accounts Receivable
    const crLine = glLines.find(line => line.line_data?.side === 'CR')
    expect(crLine).toBeDefined()
    expect(crLine?.line_data?.gl_account_code).toBe('120000')
    expect(crLine?.line_amount).toBe(750)

    // Verify balance
    const totalDR = glLines
      .filter(line => line.line_data?.side === 'DR')
      .reduce((sum, line) => sum + line.line_amount, 0)
    const totalCR = glLines
      .filter(line => line.line_data?.side === 'CR')
      .reduce((sum, line) => sum + line.line_amount, 0)

    expect(totalDR).toBe(totalCR)
    expect(totalDR).toBe(750)
  })

  it('should use correct GL account for bank transfer', () => {
    const glLines = generateInvoicePaymentGLLines(
      500,
      'BANK_TRANSFER',
      'customer-id',
      'invoice-id'
    )

    const drLine = glLines.find(line => line.line_data?.side === 'DR')
    expect(drLine?.line_data?.gl_account_code).toBe('110100') // Bank Account
  })

  it('should use correct GL account for card payment', () => {
    const glLines = generateInvoicePaymentGLLines(
      300,
      'CARD',
      'customer-id',
      'invoice-id'
    )

    const drLine = glLines.find(line => line.line_data?.side === 'DR')
    expect(drLine?.line_data?.gl_account_code).toBe('110200') // Card Payment Clearing
  })

  it('should throw error for invalid payment method', () => {
    expect(() => {
      generateInvoicePaymentGLLines(
        100,
        'INVALID_METHOD',
        'customer-id',
        'invoice-id'
      )
    }).toThrow('Invalid payment method')
  })

  it('should link invoice transaction ID to payment', () => {
    const glLines = generateInvoicePaymentGLLines(
      100,
      'CASH',
      'customer-id',
      'invoice-txn-123'
    )

    const crLine = glLines.find(line => line.line_data?.side === 'CR')
    expect(crLine?.line_data?.invoice_transaction_id).toBe('invoice-txn-123')
  })
})

describe('generateInvoiceSmartCode', () => {
  it('should generate smart code for invoice creation', () => {
    const smartCode = generateInvoiceSmartCode('CREATION')
    expect(smartCode).toBe('HERA.SALON.TRANSACTION.INVOICE.CREATION.v1')
  })

  it('should generate smart code for payment', () => {
    const smartCode = generateInvoiceSmartCode('PAYMENT')
    expect(smartCode).toBe('HERA.SALON.TRANSACTION.INVOICE.PAYMENT.v1')
  })

  it('should generate smart code for cancellation', () => {
    const smartCode = generateInvoiceSmartCode('CANCELLATION')
    expect(smartCode).toBe('HERA.SALON.TRANSACTION.INVOICE.CANCELLATION.v1')
  })

  it('should follow HERA smart code format (UPPERCASE with lowercase version)', () => {
    const smartCode = generateInvoiceSmartCode('CREATION')

    // Should not contain lowercase except version
    const withoutVersion = smartCode.replace(/\.v\d+$/, '')
    expect(withoutVersion).not.toMatch(/[a-z]/)

    // Should match HERA pattern
    expect(smartCode).toMatch(/^[A-Z.]+\.v[0-9]+$/)

    // Should have minimum 6 segments
    const segments = smartCode.split('.')
    expect(segments.length).toBeGreaterThanOrEqual(6)

    // Version should be lowercase
    expect(smartCode).toMatch(/\.v1$/)
  })
})

describe('calculateInvoiceAging', () => {
  it('should return CURRENT for future due date', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
    const aging = calculateInvoiceAging(futureDate)
    expect(aging).toBe('CURRENT')
  })

  it('should return CURRENT for due date today', () => {
    const today = new Date()
    const aging = calculateInvoiceAging(today)
    expect(aging).toBe('CURRENT')
  })

  it('should return 1-30 DAYS for 15 days past due', () => {
    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    const aging = calculateInvoiceAging(pastDate)
    expect(aging).toBe('1-30 DAYS')
  })

  it('should return 31-60 DAYS for 45 days past due', () => {
    const pastDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    const aging = calculateInvoiceAging(pastDate)
    expect(aging).toBe('31-60 DAYS')
  })

  it('should return 61-90 DAYS for 75 days past due', () => {
    const pastDate = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000)
    const aging = calculateInvoiceAging(pastDate)
    expect(aging).toBe('61-90 DAYS')
  })

  it('should return 90+ DAYS for 100 days past due', () => {
    const pastDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
    const aging = calculateInvoiceAging(pastDate)
    expect(aging).toBe('90+ DAYS')
  })
})

describe('validateInvoiceData', () => {
  it('should validate correct invoice data', () => {
    const validData = {
      customerEntityId: 'customer-123',
      totalAmount: 750,
      dueDate: new Date(),
      invoiceLines: [
        {
          description: 'Service',
          quantity: 1,
          unit_amount: 750,
          line_amount: 750
        }
      ]
    }

    expect(() => validateInvoiceData(validData)).not.toThrow()
  })

  it('should throw error if customer ID is missing', () => {
    const invalidData = {
      customerEntityId: '',
      totalAmount: 100,
      dueDate: new Date(),
      invoiceLines: [
        {
          description: 'Service',
          quantity: 1,
          unit_amount: 100,
          line_amount: 100
        }
      ]
    }

    expect(() => validateInvoiceData(invalidData)).toThrow('Customer entity ID is required')
  })

  it('should throw error if total amount is zero', () => {
    const invalidData = {
      customerEntityId: 'customer-123',
      totalAmount: 0,
      dueDate: new Date(),
      invoiceLines: []
    }

    expect(() => validateInvoiceData(invalidData)).toThrow('Invoice total must be greater than zero')
  })

  it('should throw error if no line items', () => {
    const invalidData = {
      customerEntityId: 'customer-123',
      totalAmount: 100,
      dueDate: new Date(),
      invoiceLines: []
    }

    expect(() => validateInvoiceData(invalidData)).toThrow('Invoice must have at least one line item')
  })

  it('should throw error if line quantity is zero', () => {
    const invalidData = {
      customerEntityId: 'customer-123',
      totalAmount: 100,
      dueDate: new Date(),
      invoiceLines: [
        {
          description: 'Service',
          quantity: 0,
          unit_amount: 100,
          line_amount: 100
        }
      ]
    }

    expect(() => validateInvoiceData(invalidData)).toThrow('Quantity must be greater than zero')
  })

  it('should throw error if line amount does not match quantity × unit_amount', () => {
    const invalidData = {
      customerEntityId: 'customer-123',
      totalAmount: 100,
      dueDate: new Date(),
      invoiceLines: [
        {
          description: 'Service',
          quantity: 2,
          unit_amount: 50,
          line_amount: 90 // Should be 100
        }
      ]
    }

    expect(() => validateInvoiceData(invalidData)).toThrow('Line amount')
  })

  it('should throw error if total does not match sum of lines', () => {
    const invalidData = {
      customerEntityId: 'customer-123',
      totalAmount: 200,
      dueDate: new Date(),
      invoiceLines: [
        {
          description: 'Service',
          quantity: 1,
          unit_amount: 100,
          line_amount: 100
        }
      ]
    }

    expect(() => validateInvoiceData(invalidData)).toThrow('Invoice total')
  })
})

describe('Double-Entry Validation', () => {
  it('should maintain DR = CR for all invoice operations', () => {
    // Invoice creation
    const invoiceLines: InvoiceLineItem[] = [
      { description: 'Service 1', quantity: 1, unit_amount: 450, line_amount: 450 },
      { description: 'Service 2', quantity: 1, unit_amount: 300, line_amount: 300 }
    ]

    const creationLines = generateInvoiceGLLines(invoiceLines, 750, 'customer-id')

    const creationDR = creationLines
      .filter(line => line.line_data?.side === 'DR')
      .reduce((sum, line) => sum + line.line_amount, 0)
    const creationCR = creationLines
      .filter(line => line.line_data?.side === 'CR')
      .reduce((sum, line) => sum + line.line_amount, 0)

    expect(creationDR).toBe(creationCR)

    // Payment
    const paymentLines = generateInvoicePaymentGLLines(750, 'BANK_TRANSFER', 'customer-id', 'invoice-id')

    const paymentDR = paymentLines
      .filter(line => line.line_data?.side === 'DR')
      .reduce((sum, line) => sum + line.line_amount, 0)
    const paymentCR = paymentLines
      .filter(line => line.line_data?.side === 'CR')
      .reduce((sum, line) => sum + line.line_amount, 0)

    expect(paymentDR).toBe(paymentCR)
  })
})

describe('HERA Standards Compliance', () => {
  it('should use UPPERCASE for all transaction types', () => {
    // Smart codes should be UPPERCASE (except version)
    const smartCode = generateInvoiceSmartCode('CREATION')
    const withoutVersion = smartCode.replace(/\.v\d+$/, '')
    expect(withoutVersion).toBe(withoutVersion.toUpperCase())
  })

  it('should follow Smart Code minimum 6 segments rule', () => {
    const smartCode = generateInvoiceSmartCode('PAYMENT')
    const segments = smartCode.split('.')
    expect(segments.length).toBeGreaterThanOrEqual(6)
  })

  it('should have lowercase version suffix', () => {
    const smartCode = generateInvoiceSmartCode('CANCELLATION')
    expect(smartCode).toMatch(/\.v\d+$/)
    expect(smartCode.endsWith('.v1')).toBe(true)
  })
})
