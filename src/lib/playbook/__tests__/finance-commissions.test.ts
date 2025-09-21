/**
 * Unit tests for POS posting wrapper and guardrails
 * Tests the commission calculation and validation logic
 */

import { postEventWithBranch, postPosSaleWithCommission, validators } from '../finance-commissions'

const { assertBranchOnEvent, assertCommissionOnPosSale, validateBalancedLines } = validators

describe('POS Posting Wrapper Tests', () => {
  const mockOrganizationId = 'test-org-123'
  const mockBranchId = 'branch-main'

  describe('Branch Validation', () => {
    it('should pass when branch_id is consistent across business_context and lines', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: 100,
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
            line_data: {
              branch_id: mockBranchId,
              stylist_id: 'stylist-1'
            }
          }
        ]
      }

      const result = assertBranchOnEvent(transactionData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when branch_id is missing from business_context', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          source: 'POS'
          // branch_id missing
        },
        line_items: []
      }

      const result = assertBranchOnEvent(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('branch_id is required in business_context')
    })

    it('should fail when line has mismatched branch_id', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: 100,
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
            line_data: {
              branch_id: 'different-branch', // Mismatch
              stylist_id: 'stylist-1'
            }
          }
        ]
      }

      const result = assertBranchOnEvent(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        `Line 1 has mismatched branch_id: expected ${mockBranchId}, got different-branch`
      )
    })
  })

  describe('Commission Validation', () => {
    it('should pass for valid POS sale with service lines and stylists', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 150,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: 100,
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
            line_data: {
              branch_id: mockBranchId,
              stylist_id: 'stylist-1'
            }
          },
          {
            line_number: 2,
            line_amount: 50,
            smart_code: 'HERA.SALON.PROD.LINE.RETAIL.V1',
            line_data: {
              branch_id: mockBranchId
            }
          }
        ]
      }

      const result = assertCommissionOnPosSale(transactionData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail for non-POS sale transaction', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'journal_entry',
        smart_code: 'HERA.ACCOUNTING.GL.TXN.JOURNAL.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'MANUAL'
        },
        line_items: []
      }

      const result = assertCommissionOnPosSale(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Transaction must be a POS sale to require commission validation'
      )
    })

    it('should fail when no service lines with stylists', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 50,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: 50,
            smart_code: 'HERA.SALON.PROD.LINE.RETAIL.V1', // Product, not service
            line_data: {
              branch_id: mockBranchId
            }
          }
        ]
      }

      const result = assertCommissionOnPosSale(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'POS sale must have at least one service line with assigned stylist'
      )
    })

    it('should fail when service line missing stylist_id', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: 100,
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
            line_data: {
              branch_id: mockBranchId
              // stylist_id missing
            }
          }
        ]
      }

      const result = assertCommissionOnPosSale(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Service line 1 must have stylist_id in line_data')
    })

    it('should fail when service line has invalid amount', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 0,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: 0, // Invalid amount
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
            line_data: {
              branch_id: mockBranchId,
              stylist_id: 'stylist-1'
            }
          }
        ]
      }

      const result = assertCommissionOnPosSale(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Service line 1 must have positive line_amount')
    })
  })

  describe('Balanced Lines Validation', () => {
    it('should pass when lines balance to zero', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          // Service revenue (credit)
          {
            line_number: 1,
            line_amount: -100,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.REVENUE.V1',
            line_data: { branch_id: mockBranchId }
          },
          // Cash received (debit)
          {
            line_number: 2,
            line_amount: 100,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.CASH.V1',
            line_data: { branch_id: mockBranchId }
          }
        ]
      }

      const result = validateBalancedLines(transactionData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when lines do not balance', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: -100,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.REVENUE.V1',
            line_data: { branch_id: mockBranchId }
          },
          {
            line_number: 2,
            line_amount: 95, // Unbalanced by 5
            smart_code: 'HERA.ACCOUNTING.GL.LINE.CASH.V1',
            line_data: { branch_id: mockBranchId }
          }
        ]
      }

      const result = validateBalancedLines(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Currency AED does not balance: total = -5.00')
    })

    it('should handle multiple currencies', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          // AED lines (balanced)
          {
            line_number: 1,
            line_amount: -100,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.REVENUE.V1',
            line_data: { branch_id: mockBranchId, currency: 'AED' }
          },
          {
            line_number: 2,
            line_amount: 100,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.CASH.V1',
            line_data: { branch_id: mockBranchId, currency: 'AED' }
          },
          // USD lines (unbalanced)
          {
            line_number: 3,
            line_amount: -50,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.REVENUE.V1',
            line_data: { branch_id: mockBranchId, currency: 'USD' }
          },
          {
            line_number: 4,
            line_amount: 45, // Unbalanced USD
            smart_code: 'HERA.ACCOUNTING.GL.LINE.CASH.V1',
            line_data: { branch_id: mockBranchId, currency: 'USD' }
          }
        ]
      }

      const result = validateBalancedLines(transactionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Currency USD does not balance: total = -5.00')
      expect(result.errors).not.toContain('Currency AED does not balance')
    })

    it('should pass with small rounding differences within tolerance', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS'
        },
        line_items: [
          {
            line_number: 1,
            line_amount: -100.005, // Small rounding difference
            smart_code: 'HERA.ACCOUNTING.GL.LINE.REVENUE.V1',
            line_data: { branch_id: mockBranchId }
          },
          {
            line_number: 2,
            line_amount: 100.006,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.CASH.V1',
            line_data: { branch_id: mockBranchId }
          }
        ]
      }

      const result = validateBalancedLines(transactionData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Integration Test - Complete POS Sale Flow', () => {
    it('should validate a complete POS sale with commissions', () => {
      const transactionData = {
        organization_id: mockOrganizationId,
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        total_amount: 100,
        business_context: {
          branch_id: mockBranchId,
          source: 'POS',
          customer_id: 'customer-123',
          appointment_id: 'appt-456'
        },
        line_items: [
          // Service line
          {
            line_number: 1,
            line_amount: -100, // Credit revenue
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
            line_data: {
              branch_id: mockBranchId,
              stylist_id: 'stylist-1',
              appointment_id: 'appt-456'
            }
          },
          // Cash payment
          {
            line_number: 2,
            line_amount: 100, // Debit cash
            smart_code: 'HERA.ACCOUNTING.GL.LINE.CASH.V1',
            line_data: {
              branch_id: mockBranchId,
              payment_method: 'cash'
            }
          },
          // Commission expense
          {
            line_number: 3,
            line_amount: 30, // Debit commission expense
            smart_code: 'HERA.SALON.GL.LINE.COMMISSION_EXPENSE.V1',
            line_data: {
              branch_id: mockBranchId,
              stylist_id: 'stylist-1',
              commission_rate: 30,
              commission_type: 'percentage'
            }
          },
          // Commission payable
          {
            line_number: 4,
            line_amount: -30, // Credit commission payable
            smart_code: 'HERA.SALON.GL.LINE.COMMISSION_PAYABLE.V1',
            line_data: {
              branch_id: mockBranchId,
              stylist_id: 'stylist-1',
              commission_rate: 30,
              commission_type: 'percentage'
            }
          }
        ]
      }

      // Test all validations
      const branchValidation = assertBranchOnEvent(transactionData)
      expect(branchValidation.isValid).toBe(true)

      const commissionValidation = assertCommissionOnPosSale(transactionData)
      expect(commissionValidation.isValid).toBe(true)

      const balanceValidation = validateBalancedLines(transactionData)
      expect(balanceValidation.isValid).toBe(true)

      // All validations should pass for a properly structured POS sale
      expect(
        branchValidation.isValid && commissionValidation.isValid && balanceValidation.isValid
      ).toBe(true)
    })
  })
})

// Mock the validateBalancedLines function in the finance-commissions module
// since it's not exported directly
const { validateBalancedLines } = require('../finance-commissions')

// Add validateBalancedLines to validators for testing
if (validateBalancedLines) {
  Object.assign(validators, { validateBalancedLines })
}
