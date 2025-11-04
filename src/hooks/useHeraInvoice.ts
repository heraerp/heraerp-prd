/**
 * useHeraInvoice Hook
 *
 * Fetches invoice data from GL accounts (not estimates)
 * Tracks all invoice operations: creation, payments, aging
 *
 * HERA Standards:
 * - UPPERCASE transaction types: INVOICE, INVOICE_PAYMENT
 * - Real GL data from universal_transactions
 * - Organization isolation
 * - Smart code compliance
 */

import { useMemo, useCallback } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import { startOfMonth, endOfMonth } from 'date-fns'
import { apiV2 } from '@/lib/client/fetchV2'
import {
  generateInvoiceGLLines,
  generateInvoicePaymentGLLines,
  generateInvoiceSmartCode,
  calculateInvoiceAging,
  validateInvoiceData,
  InvoiceLineItem,
  InvoiceStatus
} from '@/lib/finance/invoice-gl-mapping'

/**
 * Invoice Summary Interface
 */
export interface InvoiceSummary {
  // Total metrics
  total_invoiced: number
  total_paid: number
  total_outstanding: number

  // Aging breakdown
  aging_current: number
  aging_1_30: number
  aging_31_60: number
  aging_61_90: number
  aging_90_plus: number

  // Counts
  invoice_count: number
  paid_count: number
  overdue_count: number

  // Invoice details
  invoices: Array<{
    invoice_id: string
    invoice_number: string
    customer_entity_id: string
    customer_name: string
    invoice_date: string
    due_date: string
    total_amount: number
    amount_paid: number
    amount_outstanding: number
    status: InvoiceStatus
    aging_bucket: string
  }>

  // Period info
  period_start: string
  period_end: string
}

/**
 * Create Invoice Input
 */
export interface CreateInvoiceInput {
  organizationId: string
  actorUserId: string
  customerEntityId: string
  customerName: string
  invoiceDate: string
  dueDate: string
  invoiceLines: InvoiceLineItem[]
  notes?: string
  paymentTerms?: string
}

/**
 * Record Invoice Payment Input
 */
export interface RecordInvoicePaymentInput {
  organizationId: string
  actorUserId: string
  invoiceTransactionId: string
  invoiceNumber: string
  customerEntityId: string
  paymentAmount: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'
  paymentDate: string
  notes?: string
}

interface UseHeraInvoiceOptions {
  organizationId?: string
  month?: number  // 1-12
  year?: number
}

/**
 * Hook to fetch and manage invoices with GL integration
 *
 * @example
 * const { invoiceSummary, isLoading, createInvoice, recordPayment } = useHeraInvoice({
 *   organizationId: 'org-uuid',
 *   month: 1,
 *   year: 2025
 * })
 */
export function useHeraInvoice(options: UseHeraInvoiceOptions) {
  const { organizationId, month, year } = options

  // Calculate date range
  const currentMonth = month || new Date().getMonth() + 1
  const currentYear = year || new Date().getFullYear()
  const selectedMonthDate = new Date(currentYear, currentMonth - 1, 1)

  const periodStart = startOfMonth(selectedMonthDate).toISOString()
  const periodEnd = endOfMonth(selectedMonthDate).toISOString()

  // Fetch INVOICE transactions (invoice creation)
  const {
    transactions: invoiceTransactions,
    isLoading: invoicesLoading
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'INVOICE',  // UPPERCASE
      date_from: periodStart,
      date_to: periodEnd,
      include_lines: true,
      limit: 1000
    }
  })

  // Fetch INVOICE_PAYMENT transactions (payments against invoices)
  const {
    transactions: paymentTransactions,
    isLoading: paymentsLoading
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'INVOICE_PAYMENT',  // UPPERCASE
      date_from: periodStart,
      date_to: periodEnd,
      include_lines: true,
      limit: 1000
    }
  })

  // Calculate invoice summary from GL transactions
  const invoiceSummary = useMemo<InvoiceSummary>(() => {
    const summary: InvoiceSummary = {
      total_invoiced: 0,
      total_paid: 0,
      total_outstanding: 0,
      aging_current: 0,
      aging_1_30: 0,
      aging_31_60: 0,
      aging_61_90: 0,
      aging_90_plus: 0,
      invoice_count: 0,
      paid_count: 0,
      overdue_count: 0,
      invoices: [],
      period_start: periodStart,
      period_end: periodEnd
    }

    // Build invoice map
    const invoiceMap = new Map<string, any>()

    // Process INVOICE transactions
    if (invoiceTransactions && invoiceTransactions.length > 0) {
      invoiceTransactions.forEach(transaction => {
        const metadata = transaction.metadata || {}
        const totalAmount = transaction.total_amount || 0
        const dueDate = metadata.due_date || transaction.transaction_date

        // Calculate aging
        const agingBucket = calculateInvoiceAging(dueDate)

        const invoice = {
          invoice_id: transaction.id,
          invoice_number: transaction.transaction_number || transaction.transaction_code || 'INV-UNKNOWN',
          customer_entity_id: transaction.source_entity_id || '',
          customer_name: metadata.customer_name || 'Unknown Customer',
          invoice_date: transaction.transaction_date,
          due_date: dueDate,
          total_amount: totalAmount,
          amount_paid: 0,  // Will be updated from payments
          amount_outstanding: totalAmount,
          status: 'SENT' as InvoiceStatus,
          aging_bucket: agingBucket
        }

        invoiceMap.set(transaction.id, invoice)

        // Update totals
        summary.total_invoiced += totalAmount
        summary.total_outstanding += totalAmount
        summary.invoice_count++

        // Update aging buckets
        switch (agingBucket) {
          case 'CURRENT':
            summary.aging_current += totalAmount
            break
          case '1-30 DAYS':
            summary.aging_1_30 += totalAmount
            break
          case '31-60 DAYS':
            summary.aging_31_60 += totalAmount
            break
          case '61-90 DAYS':
            summary.aging_61_90 += totalAmount
            break
          case '90+ DAYS':
            summary.aging_90_plus += totalAmount
            break
        }
      })
    }

    // Process INVOICE_PAYMENT transactions
    if (paymentTransactions && paymentTransactions.length > 0) {
      paymentTransactions.forEach(payment => {
        const metadata = payment.metadata || {}
        const invoiceId = metadata.invoice_transaction_id
        const paymentAmount = payment.total_amount || 0

        if (invoiceId && invoiceMap.has(invoiceId)) {
          const invoice = invoiceMap.get(invoiceId)
          invoice.amount_paid += paymentAmount
          invoice.amount_outstanding -= paymentAmount

          // Update status
          if (invoice.amount_outstanding <= 0.01) {
            invoice.status = 'PAID'
          } else if (invoice.amount_paid > 0) {
            invoice.status = 'PARTIAL'
          }

          // Update totals
          summary.total_paid += paymentAmount
          summary.total_outstanding -= paymentAmount
        }
      })
    }

    // Convert map to array and update counts
    summary.invoices = Array.from(invoiceMap.values())
    summary.paid_count = summary.invoices.filter(inv => inv.status === 'PAID').length
    summary.overdue_count = summary.invoices.filter(inv =>
      inv.status !== 'PAID' && new Date(inv.due_date) < new Date()
    ).length

    return summary
  }, [invoiceTransactions, paymentTransactions, periodStart, periodEnd])

  /**
   * Create a new invoice with GL entries
   */
  const createInvoice = useCallback(async (input: CreateInvoiceInput) => {
    // Validate input
    validateInvoiceData({
      customerEntityId: input.customerEntityId,
      totalAmount: input.invoiceLines.reduce((sum, line) => sum + line.line_amount, 0),
      dueDate: input.dueDate,
      invoiceLines: input.invoiceLines
    })

    const totalAmount = input.invoiceLines.reduce((sum, line) => sum + line.line_amount, 0)

    // Generate GL lines (DR AR, CR Revenue)
    const glLines = generateInvoiceGLLines(
      input.invoiceLines,
      totalAmount,
      input.customerEntityId
    )

    // Generate smart code
    const smartCode = generateInvoiceSmartCode('CREATION')

    // Create INVOICE transaction via API v2
    const result = await apiV2.post('transactions', {
      organization_id: input.organizationId,
      transaction_type: 'INVOICE',  // UPPERCASE
      smart_code: smartCode,
      transaction_date: input.invoiceDate,
      source_entity_id: input.customerEntityId,  // Customer
      total_amount: totalAmount,
      metadata: {
        customer_name: input.customerName,
        due_date: input.dueDate,
        payment_terms: input.paymentTerms || 'NET 30',
        notes: input.notes,
        invoice_lines: input.invoiceLines
      },
      lines: glLines
    })

    return result
  }, [])

  /**
   * Record payment against an invoice
   */
  const recordPayment = useCallback(async (input: RecordInvoicePaymentInput) => {
    // Generate GL lines (DR Cash/Bank/Card, CR AR)
    const glLines = generateInvoicePaymentGLLines(
      input.paymentAmount,
      input.paymentMethod,
      input.customerEntityId,
      input.invoiceTransactionId
    )

    // Generate smart code
    const smartCode = generateInvoiceSmartCode('PAYMENT')

    // Create INVOICE_PAYMENT transaction via API v2
    const result = await apiV2.post('transactions', {
      organization_id: input.organizationId,
      transaction_type: 'INVOICE_PAYMENT',  // UPPERCASE
      smart_code: smartCode,
      transaction_date: input.paymentDate,
      source_entity_id: input.customerEntityId,  // Customer
      total_amount: input.paymentAmount,
      metadata: {
        invoice_transaction_id: input.invoiceTransactionId,
        invoice_number: input.invoiceNumber,
        payment_method: input.paymentMethod,
        notes: input.notes
      },
      lines: glLines
    })

    return result
  }, [])

  /**
   * Refetch invoice data
   */
  const refetch = useCallback(() => {
    // The useUniversalTransactionV1 hooks will automatically refetch
    // when their dependencies change. For manual refetch, we would need
    // to trigger a re-render or use a query invalidation mechanism.
    // For now, this is a placeholder that consumers can call.
  }, [])

  return {
    invoiceSummary,
    isLoading: invoicesLoading || paymentsLoading,
    createInvoice,
    recordPayment,
    refetch
  }
}

/**
 * Helper function to format currency
 */
export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Helper function to determine invoice status color
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'PAID':
      return 'text-green-500'
    case 'SENT':
      return 'text-blue-500'
    case 'OVERDUE':
      return 'text-red-500'
    case 'PARTIAL':
      return 'text-yellow-500'
    case 'DRAFT':
      return 'text-gray-500'
    case 'CANCELLED':
      return 'text-gray-400'
    default:
      return 'text-gray-500'
  }
}

/**
 * Helper function to determine aging bucket color
 */
export function getAgingBucketColor(bucket: string): string {
  switch (bucket) {
    case 'CURRENT':
      return 'text-green-500'
    case '1-30 DAYS':
      return 'text-blue-500'
    case '31-60 DAYS':
      return 'text-yellow-500'
    case '61-90 DAYS':
      return 'text-orange-500'
    case '90+ DAYS':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}
