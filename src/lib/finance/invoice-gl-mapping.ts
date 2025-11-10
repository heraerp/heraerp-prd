/**
 * Invoice GL Account Mapping
 *
 * Maps invoice operations to GL accounts for double-entry accounting.
 *
 * HERA Standards:
 * - UPPERCASE transaction types: INVOICE, INVOICE_PAYMENT
 * - UPPERCASE status: DRAFT, SENT, PAID, OVERDUE, CANCELLED
 * - Smart codes: Minimum 6 segments, UPPERCASE with lowercase version
 * - Balance validation: DR must equal CR
 *
 * GL Accounts Used:
 * - 120000: Accounts Receivable (Asset, DR increases when invoice created)
 * - 400000: Service Revenue (Revenue, CR increases when invoice created)
 * - 110000: Cash on Hand (Asset, DR increases when paid by cash)
 * - 110100: Bank Account (Asset, DR increases when paid by bank)
 * - 110200: Card Payment Clearing (Asset, DR increases when paid by card)
 *
 * Double-Entry Logic:
 *
 * Invoice Creation (INVOICE):
 * DR: Accounts Receivable (120000)  [Asset increases]
 * CR: Service Revenue (400000)      [Revenue increases]
 *
 * Invoice Payment (INVOICE_PAYMENT):
 * DR: Cash/Bank/Card (110000/110100/110200)  [Asset increases]
 * CR: Accounts Receivable (120000)           [Asset decreases]
 */

import { UniversalTransactionLine } from '@/types/hera-database.types'

/**
 * GL Account Definitions for Invoice Management
 */
export const INVOICE_GL_ACCOUNTS = {
  '120000': {
    code: '120000',
    name: 'Accounts Receivable',
    type: 'asset' as const,
    normal_balance: 'DR' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.AR.v1',
    description: 'Money owed by customers for services/products rendered'
  },
  '400000': {
    code: '400000',
    name: 'Service Revenue',
    type: 'revenue' as const,
    normal_balance: 'CR' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.REVENUE.SERVICE.v1',
    description: 'Revenue from salon services'
  },
  '110000': {
    code: '110000',
    name: 'Cash on Hand',
    type: 'asset' as const,
    normal_balance: 'DR' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.CASH.v1',
    description: 'Physical cash in salon'
  },
  '110100': {
    code: '110100',
    name: 'Bank Account',
    type: 'asset' as const,
    normal_balance: 'DR' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.BANK.v1',
    description: 'Money in bank accounts'
  },
  '110200': {
    code: '110200',
    name: 'Card Payment Clearing',
    type: 'asset' as const,
    normal_balance: 'DR' as const,
    smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.CARD.v1',
    description: 'Card payments pending settlement'
  }
}

/**
 * Payment Method to GL Account Mapping
 */
export const INVOICE_PAYMENT_METHOD_TO_GL: Record<string, string> = {
  'CASH': '110000',         // Cash on Hand
  'BANK_TRANSFER': '110100', // Bank Account
  'CARD': '110200',          // Card Payment Clearing
  'CHEQUE': '110100'         // Bank Account (cheques deposited to bank)
}

/**
 * Invoice Status Types (UPPERCASE)
 */
export type InvoiceStatus =
  | 'DRAFT'      // Not yet sent to customer
  | 'SENT'       // Sent to customer, awaiting payment
  | 'PAID'       // Fully paid
  | 'PARTIAL'    // Partially paid
  | 'OVERDUE'    // Past due date
  | 'CANCELLED'  // Cancelled/void

/**
 * Invoice Line Item Interface
 */
export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  service_entity_id?: string  // Optional: link to service/product entity
  tax_amount?: number
  discount_amount?: number
}

/**
 * Generate GL Lines for Invoice Creation
 *
 * Creates double-entry GL lines for an invoice.
 *
 * @param invoiceLines - Line items on the invoice
 * @param totalAmount - Total invoice amount (including tax, after discounts)
 * @param customerEntityId - Customer entity ID
 * @returns Array of GL transaction lines (balanced DR = CR)
 *
 * @example
 * const lines = generateInvoiceGLLines(
 *   [
 *     { description: 'Hair Treatment', quantity: 1, unit_amount: 450, line_amount: 450 },
 *     { description: 'Hair Coloring', quantity: 1, unit_amount: 300, line_amount: 300 }
 *   ],
 *   750,
 *   'customer-entity-id'
 * )
 * // Returns:
 * // [
 * //   { DR: Accounts Receivable 750 },
 * //   { CR: Service Revenue 750 }
 * // ]
 */
export function generateInvoiceGLLines(
  invoiceLines: InvoiceLineItem[],
  totalAmount: number,
  customerEntityId: string
): UniversalTransactionLine[] {
  const glLines: UniversalTransactionLine[] = []

  // Calculate total from line items
  const calculatedTotal = invoiceLines.reduce((sum, line) => sum + line.line_amount, 0)

  // Validate totals match (within 0.01 tolerance for rounding)
  if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
    throw new Error(
      `Invoice line items total (${calculatedTotal.toFixed(2)}) does not match invoice total (${totalAmount.toFixed(2)})`
    )
  }

  // Line 1: DR Accounts Receivable (Customer owes us money)
  glLines.push({
    line_number: 1,
    line_type: 'GL',
    description: 'Accounts Receivable',
    quantity: 1,
    unit_amount: totalAmount,
    line_amount: totalAmount,
    entity_id: customerEntityId,  // Link to customer entity
    line_data: {
      gl_account_code: '120000',
      gl_account_name: 'Accounts Receivable',
      side: 'DR',
      account_type: 'asset',
      amount: totalAmount,
      smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.AR.v1'
    }
  })

  // Line 2: CR Service Revenue (We earned revenue)
  glLines.push({
    line_number: 2,
    line_type: 'GL',
    description: 'Service Revenue',
    quantity: 1,
    unit_amount: totalAmount,
    line_amount: totalAmount,
    line_data: {
      gl_account_code: '400000',
      gl_account_name: 'Service Revenue',
      side: 'CR',
      account_type: 'revenue',
      amount: totalAmount,
      smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.REVENUE.SERVICE.v1'
    }
  })

  // Validate balance (DR must equal CR)
  const totalDR = glLines
    .filter(line => line.line_data?.side === 'DR')
    .reduce((sum, line) => sum + line.line_amount, 0)

  const totalCR = glLines
    .filter(line => line.line_data?.side === 'CR')
    .reduce((sum, line) => sum + line.line_amount, 0)

  if (Math.abs(totalDR - totalCR) > 0.01) {
    throw new Error(
      `Invoice GL entries not balanced! DR: ${totalDR.toFixed(2)}, CR: ${totalCR.toFixed(2)}`
    )
  }

  return glLines
}

/**
 * Generate GL Lines for Invoice Payment
 *
 * Creates double-entry GL lines for recording payment against an invoice.
 *
 * @param paymentAmount - Amount paid
 * @param paymentMethod - Payment method (CASH, BANK_TRANSFER, CARD, CHEQUE)
 * @param customerEntityId - Customer entity ID
 * @param invoiceTransactionId - Original invoice transaction ID
 * @returns Array of GL transaction lines (balanced DR = CR)
 *
 * @example
 * const lines = generateInvoicePaymentGLLines(
 *   750,
 *   'BANK_TRANSFER',
 *   'customer-entity-id',
 *   'invoice-txn-id'
 * )
 * // Returns:
 * // [
 * //   { DR: Bank Account 750 },
 * //   { CR: Accounts Receivable 750 }
 * // ]
 */
export function generateInvoicePaymentGLLines(
  paymentAmount: number,
  paymentMethod: string,
  customerEntityId: string,
  invoiceTransactionId: string
): UniversalTransactionLine[] {
  const glLines: UniversalTransactionLine[] = []

  // Get GL account for payment method
  const cashAccountCode = INVOICE_PAYMENT_METHOD_TO_GL[paymentMethod]
  if (!cashAccountCode) {
    throw new Error(`Invalid payment method: ${paymentMethod}`)
  }

  const cashAccount = INVOICE_GL_ACCOUNTS[cashAccountCode]
  if (!cashAccount) {
    throw new Error(`GL account not found for payment method: ${paymentMethod}`)
  }

  // Line 1: DR Cash/Bank/Card (Money coming in)
  glLines.push({
    line_number: 1,
    line_type: 'GL',
    description: `Payment received - ${cashAccount.name}`,
    quantity: 1,
    unit_amount: paymentAmount,
    line_amount: paymentAmount,
    line_data: {
      gl_account_code: cashAccountCode,
      gl_account_name: cashAccount.name,
      side: 'DR',
      account_type: cashAccount.type,
      amount: paymentAmount,
      payment_method: paymentMethod,
      smart_code: cashAccount.smart_code
    }
  })

  // Line 2: CR Accounts Receivable (Customer debt decreases)
  glLines.push({
    line_number: 2,
    line_type: 'GL',
    description: 'Accounts Receivable - Payment',
    quantity: 1,
    unit_amount: paymentAmount,
    line_amount: paymentAmount,
    entity_id: customerEntityId,  // Link to customer entity
    line_data: {
      gl_account_code: '120000',
      gl_account_name: 'Accounts Receivable',
      side: 'CR',
      account_type: 'asset',
      amount: paymentAmount,
      invoice_transaction_id: invoiceTransactionId,  // Link to original invoice
      smart_code: 'HERA.SALON.FINANCE.GL.ACCOUNT.ASSET.AR.v1'
    }
  })

  // Validate balance (DR must equal CR)
  const totalDR = glLines
    .filter(line => line.line_data?.side === 'DR')
    .reduce((sum, line) => sum + line.line_amount, 0)

  const totalCR = glLines
    .filter(line => line.line_data?.side === 'CR')
    .reduce((sum, line) => sum + line.line_amount, 0)

  if (Math.abs(totalDR - totalCR) > 0.01) {
    throw new Error(
      `Payment GL entries not balanced! DR: ${totalDR.toFixed(2)}, CR: ${totalCR.toFixed(2)}`
    )
  }

  return glLines
}

/**
 * Generate Smart Code for Invoice Transactions
 *
 * @param operationType - Type of operation (CREATION, PAYMENT, CANCELLATION)
 * @returns HERA-compliant smart code
 *
 * @example
 * generateInvoiceSmartCode('CREATION')
 * // Returns: 'HERA.SALON.TRANSACTION.INVOICE.CREATION.v1'
 */
export function generateInvoiceSmartCode(
  operationType: 'CREATION' | 'PAYMENT' | 'CANCELLATION'
): string {
  return `HERA.SALON.TRANSACTION.INVOICE.${operationType}.v1`
}

/**
 * Calculate Invoice Aging
 *
 * Determines aging bucket for an invoice based on due date.
 *
 * @param dueDate - Invoice due date
 * @param currentDate - Current date (defaults to now)
 * @returns Aging bucket: CURRENT, 1-30, 31-60, 61-90, 90+
 */
export function calculateInvoiceAging(
  dueDate: Date | string,
  currentDate: Date = new Date()
): string {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const daysPastDue = Math.floor((currentDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))

  if (daysPastDue <= 0) return 'CURRENT'
  if (daysPastDue <= 30) return '1-30 DAYS'
  if (daysPastDue <= 60) return '31-60 DAYS'
  if (daysPastDue <= 90) return '61-90 DAYS'
  return '90+ DAYS'
}

/**
 * Validate Invoice Data
 *
 * Validates invoice data before creating GL entries.
 *
 * @param invoiceData - Invoice data to validate
 * @throws Error if validation fails
 */
export function validateInvoiceData(invoiceData: {
  customerEntityId: string
  totalAmount: number
  dueDate: Date | string
  invoiceLines: InvoiceLineItem[]
}): void {
  const { customerEntityId, totalAmount, dueDate, invoiceLines } = invoiceData

  // Validate customer
  if (!customerEntityId) {
    throw new Error('Customer entity ID is required')
  }

  // Validate total amount
  if (totalAmount <= 0) {
    throw new Error('Invoice total must be greater than zero')
  }

  // Validate due date
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  if (isNaN(due.getTime())) {
    throw new Error('Invalid due date')
  }

  // Validate line items
  if (!invoiceLines || invoiceLines.length === 0) {
    throw new Error('Invoice must have at least one line item')
  }

  // Validate line item totals
  invoiceLines.forEach((line, index) => {
    if (line.quantity <= 0) {
      throw new Error(`Line ${index + 1}: Quantity must be greater than zero`)
    }
    if (line.unit_amount < 0) {
      throw new Error(`Line ${index + 1}: Unit amount cannot be negative`)
    }
    if (Math.abs(line.line_amount - (line.quantity * line.unit_amount)) > 0.01) {
      throw new Error(
        `Line ${index + 1}: Line amount (${line.line_amount}) does not match quantity × unit_amount (${line.quantity * line.unit_amount})`
      )
    }
  })

  // Validate total matches sum of lines
  const calculatedTotal = invoiceLines.reduce((sum, line) => sum + line.line_amount, 0)
  if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
    throw new Error(
      `Invoice total (${totalAmount}) does not match sum of line items (${calculatedTotal})`
    )
  }
}
