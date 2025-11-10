/**
 * Payroll GL Account Mapping
 *
 * Maps payroll categories to GL accounts for double-entry accounting.
 * Ensures all payroll transactions are properly recorded with DR/CR entries.
 *
 * @module payroll-gl-mapping
 */

import type { UniversalTransactionLine } from '@/types/hera-database.types'

/**
 * GL Account Definitions for Payroll
 * Following HERA Chart of Accounts
 */
export const PAYROLL_GL_ACCOUNTS = {
  // Expense Accounts (DR normal balance)
  '6300': {
    code: '6300',
    name: 'Salaries and Wages',
    type: 'expense' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.EXPENSE.SALARY.v1'
  },

  // Asset Accounts (DR normal balance) - Payment methods
  '1000': {
    code: '1000',
    name: 'Cash on Hand',
    type: 'asset' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.CASH.v1'
  },
  '1020': {
    code: '1020',
    name: 'Bank Account',
    type: 'asset' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.BANK.v1'
  },
  '1030': {
    code: '1030',
    name: 'Card Payment Processor',
    type: 'asset' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.CARD.v1'
  },

  // Liability Accounts (CR normal balance)
  '220000': {
    code: '220000',
    name: 'Tax Payable (Income Tax)',
    type: 'liability' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.LIABILITY.TAX.v1'
  },
  '240000': {
    code: '240000',
    name: 'Tips Payable to Staff',
    type: 'liability' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.LIABILITY.TIPS.v1'
  }
} as const

/**
 * Payroll Payment Method to GL Account Mapping
 */
export const PAYROLL_PAYMENT_METHOD_TO_GL: Record<string, string> = {
  'CASH': '1000',           // Cash on Hand
  'BANK_TRANSFER': '1020',  // Bank Account
  'CARD': '1030',           // Card Payment Processor
  'CHEQUE': '1020'          // Bank Account (cheques)
}

/**
 * Payroll Component Types
 */
export type PayrollComponentType =
  | 'BASIC_SALARY'
  | 'OVERTIME'
  | 'BONUS'
  | 'COMMISSION'
  | 'ALLOWANCE'
  | 'TAX_WITHHOLDING'
  | 'TIPS_PAYOUT'

/**
 * Payroll Transaction Line Interface
 */
export interface PayrollLineItem {
  staff_entity_id: string
  staff_name: string
  component_type: PayrollComponentType
  gross_amount: number
  tax_amount?: number
  net_amount: number
}

/**
 * Get GL Account for Payment Method
 */
export function getPayrollPaymentGLAccount(paymentMethod: string) {
  const accountCode = PAYROLL_PAYMENT_METHOD_TO_GL[paymentMethod]
  if (!accountCode) return null
  return PAYROLL_GL_ACCOUNTS[accountCode as keyof typeof PAYROLL_GL_ACCOUNTS]
}

/**
 * Generate GL Lines for Payroll Transaction
 *
 * Creates balanced DR/CR entries following double-entry accounting:
 *
 * DR: Salaries and Wages (6300)          [Expense increases]
 * CR: Bank Account (1020)                [Asset decreases - net pay]
 * CR: Tax Payable (220000)               [Liability increases - tax withheld]
 * CR: Tips Payable (240000)              [Liability decreases - tips paid out]
 *
 * @param payrollLines - Array of staff payroll line items
 * @param paymentMethod - Payment method (CASH, BANK_TRANSFER, CARD, CHEQUE)
 * @param includesTipsPayout - Whether this includes tips payout
 * @returns Array of GL transaction lines (balanced)
 */
export function generatePayrollGLLines(
  payrollLines: PayrollLineItem[],
  paymentMethod: string,
  includesTipsPayout: boolean = false
): UniversalTransactionLine[] {
  const glLines: UniversalTransactionLine[] = []
  let lineNumber = 1

  // Calculate totals
  const totalGrossSalary = payrollLines
    .filter(line => line.component_type !== 'TIPS_PAYOUT')
    .reduce((sum, line) => sum + line.gross_amount, 0)

  const totalTaxWithholding = payrollLines
    .reduce((sum, line) => sum + (line.tax_amount || 0), 0)

  const totalTipsPayout = payrollLines
    .filter(line => line.component_type === 'TIPS_PAYOUT')
    .reduce((sum, line) => sum + line.gross_amount, 0)

  const totalNetPay = payrollLines
    .reduce((sum, line) => sum + line.net_amount, 0)

  // Get payment GL account
  const paymentAccount = getPayrollPaymentGLAccount(paymentMethod)
  if (!paymentAccount) {
    throw new Error(`Invalid payment method: ${paymentMethod}. Must be one of: ${Object.keys(PAYROLL_PAYMENT_METHOD_TO_GL).join(', ')}`)
  }

  // LINE 1: DR - Salaries and Wages (Expense)
  if (totalGrossSalary > 0) {
    glLines.push({
      line_number: lineNumber++,
      line_type: 'GL',
      line_amount: totalGrossSalary,
      line_data: {
        gl_account_code: '6300',
        account_code: '6300',
        account_name: 'Salaries and Wages',
        side: 'DR',
        description: 'Salary expense for period'
      }
    })
  }

  // LINE 2: CR - Payment Method (Asset - decreases)
  glLines.push({
    line_number: lineNumber++,
    line_type: 'GL',
    line_amount: totalNetPay,
    line_data: {
      gl_account_code: paymentAccount.code,
      account_code: paymentAccount.code,
      account_name: paymentAccount.name,
      side: 'CR',
      description: `Net salary paid via ${paymentMethod}`
    }
  })

  // LINE 3: CR - Tax Withholding (Liability - increases)
  if (totalTaxWithholding > 0) {
    glLines.push({
      line_number: lineNumber++,
      line_type: 'GL',
      line_amount: totalTaxWithholding,
      line_data: {
        gl_account_code: '220000',
        account_code: '220000',
        account_name: 'Tax Payable (Income Tax)',
        side: 'CR',
        description: 'Income tax withheld from salary'
      }
    })
  }

  // LINE 4: DR - Tips Payout (if included - reduces liability)
  if (includesTipsPayout && totalTipsPayout > 0) {
    glLines.push({
      line_number: lineNumber++,
      line_type: 'GL',
      line_amount: totalTipsPayout,
      line_data: {
        gl_account_code: '240000',
        account_code: '240000',
        account_name: 'Tips Payable to Staff',
        side: 'DR',
        description: 'Tips paid out to staff'
      }
    })
  }

  // Validate balance (DR = CR)
  const totalDR = glLines
    .filter(line => line.line_data?.side === 'DR')
    .reduce((sum, line) => sum + line.line_amount, 0)

  const totalCR = glLines
    .filter(line => line.line_data?.side === 'CR')
    .reduce((sum, line) => sum + line.line_amount, 0)

  if (Math.abs(totalDR - totalCR) > 0.01) {
    throw new Error(
      `Payroll GL entries not balanced! DR: ${totalDR.toFixed(2)}, CR: ${totalCR.toFixed(2)}`
    )
  }

  return glLines
}

/**
 * Generate Smart Code for Payroll Transaction
 * Format: HERA.SALON.TRANSACTION.PAYROLL.{TYPE}.v1
 *
 * UPPERCASE only, minimum 6 segments, no snake_case
 */
export function generatePayrollSmartCode(
  componentType: 'SALARY' | 'TIPS' | 'MIXED'
): string {
  return `HERA.SALON.TRANSACTION.PAYROLL.${componentType}.v1`
}

/**
 * Validate Payroll Transaction Structure
 */
export function validatePayrollTransaction(
  payrollLines: PayrollLineItem[],
  paymentMethod: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check payroll lines exist
  if (!payrollLines || payrollLines.length === 0) {
    errors.push('Payroll must have at least one line item')
  }

  // Check payment method valid
  if (!PAYROLL_PAYMENT_METHOD_TO_GL[paymentMethod]) {
    errors.push(`Invalid payment method: ${paymentMethod}`)
  }

  // Check each line
  payrollLines.forEach((line, index) => {
    if (!line.staff_entity_id) {
      errors.push(`Line ${index + 1}: staff_entity_id is required`)
    }
    if (!line.staff_name) {
      errors.push(`Line ${index + 1}: staff_name is required`)
    }
    if (!line.component_type) {
      errors.push(`Line ${index + 1}: component_type is required`)
    }
    if (line.gross_amount <= 0) {
      errors.push(`Line ${index + 1}: gross_amount must be positive`)
    }
    if (line.net_amount <= 0) {
      errors.push(`Line ${index + 1}: net_amount must be positive`)
    }
    if (line.tax_amount && line.tax_amount < 0) {
      errors.push(`Line ${index + 1}: tax_amount cannot be negative`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate Tax Withholding (UAE Progressive Tax Example)
 *
 * Note: UAE doesn't have personal income tax for residents.
 * This is a placeholder for future implementation or other jurisdictions.
 */
export function calculateTaxWithholding(
  grossAmount: number,
  taxRate: number = 0.0
): number {
  return grossAmount * taxRate
}

/**
 * Format Payroll Amount for Display
 */
export function formatPayrollAmount(amount: number): string {
  return `AED ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
