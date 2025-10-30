// ================================================================================
// POS CHECKOUT HOOK
// Smart Code: HERA.HOOK.POS.CHECKOUT.V1
// Maps POS cart to universal_transaction payload with auto-journal posting
//
// ARCHITECTURE:
// - Uses UNIVERSAL HOOKS: useUniversalTransactionV1 (hera_txn_crud_v1 RPC)
// - Layer 2: Business logic for POS checkout
// - Handles cart calculation, line item building, payment validation
// - ✅ ENTERPRISE: Atomic transaction creation (header + lines in one call)
// ================================================================================

'use client'

import { useState } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { FinanceDNAServiceV2, FinanceGuardrails } from '@/lib/dna/integration/finance-integration-dna-v2'
import type { UniversalFinanceEventV2 } from '@/lib/dna/integration/finance-integration-dna-v2'

// Smart code templates for POS transactions
const SMART_CODES = {
  POS_SALE: 'HERA.SALON.TXN.SALE.CREATE.v1',
  SERVICE_COMPLETE: 'HERA.SALON.SVC.LINE.STANDARD.v1',
  PRODUCT_SALE: 'HERA.SALON.RETAIL.LINE.PRODUCT.v1',
  CASH_PAYMENT: 'HERA.SALON.PAYMENT.CAPTURE.CASH.v1',
  CARD_PAYMENT: 'HERA.SALON.PAYMENT.CAPTURE.CARD.v1',
  STAFF_COMMISSION: 'HERA.SALON.POS.LINE.COMMISSION.EXPENSE.v1'
} as const

// Generate transaction code
function generateTransactionCode(type: string): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${type.toUpperCase()}-${timestamp}-${random}`
}

interface PosCartItem {
  id: string
  entity_id: string
  name: string
  type: 'service' | 'product'
  quantity: number
  unit_price: number
  discount?: number
  staff_id?: string // For commission calculation
}

interface PosPayment {
  method: 'cash' | 'card' | 'bank_transfer'
  amount: number
  reference?: string
}

interface PosCheckoutData {
  customer_id?: string
  appointment_id?: string
  branch_id?: string // Branch where sale occurred
  transaction_date?: string // ✅ NEW: ISO string for custom transaction date (for old bills)
  items: PosCartItem[]
  payments: PosPayment[]
  tax_rate?: number
  discount_total?: number
  tip_total?: number // Added tip support
  notes?: string
}

interface UsePosCheckoutReturn {
  isProcessing: boolean
  error: string | null
  processCheckout: (checkoutData: PosCheckoutData) => Promise<any>
  clearError: () => void
}

export function usePosCheckout(): UsePosCheckoutReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const { currentOrganization } = useOrganization()

  // ✅ LAYER 1: Use useUniversalTransactionV1 (RPC hera_txn_crud_v1)
  const {
    create: createTransaction,
    isCreating,
    error: txnError
  } = useUniversalTransactionV1({
    organizationId: currentOrganization?.id
  })

  // ✅ LAYER 2: Initialize Finance DNA v2 Service
  const [financeDNA] = useState(() => {
    if (currentOrganization?.id) {
      return new FinanceDNAServiceV2(currentOrganization.id)
    }
    return null
  })

  const error = txnError
  const clearError = () => {} // Error will be cleared on next mutation

  const processCheckout = async (checkoutData: PosCheckoutData) => {
    setIsProcessing(true)

    try {
      const {
        customer_id,
        appointment_id,
        branch_id,
        transaction_date, // ✅ NEW: Custom date for old bills
        items,
        payments,
        tax_rate = 0.05,
        discount_total = 0,
        tip_total = 0,
        notes
      } = checkoutData

      // Calculate totals
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price - (item.discount || 0),
        0
      )

      const tax_amount = (subtotal - discount_total) * tax_rate
      const total_amount = subtotal - discount_total + tax_amount + tip_total

      // ✅ FIX: Validate payments cover total (allow overpayment for cash change)
      const payment_total = payments.reduce((sum, payment) => sum + payment.amount, 0)

      // Allow overpayment (for cash change), but not underpayment
      if (payment_total < total_amount - 0.01) {
        console.error('[usePosCheckout] Payment validation failed - UNDERPAID:', {
          subtotal: subtotal.toFixed(2),
          discount_total: discount_total.toFixed(2),
          tax_amount: tax_amount.toFixed(2),
          tip_total: tip_total.toFixed(2),
          total_amount: total_amount.toFixed(2),
          payment_total: payment_total.toFixed(2),
          shortfall: (total_amount - payment_total).toFixed(2)
        })
        throw new Error(`Payment amount (${payment_total.toFixed(2)}) is less than total (${total_amount.toFixed(2)})`)
      }

      // Log successful validation
      if (payment_total > total_amount + 0.01) {
        console.log('[usePosCheckout] ✅ Overpayment detected (change due):', {
          total_amount: total_amount.toFixed(2),
          payment_total: payment_total.toFixed(2),
          change_due: (payment_total - total_amount).toFixed(2)
        })
      } else {
        console.log('[usePosCheckout] ✅ Exact payment:', {
          total_amount: total_amount.toFixed(2),
          payment_total: payment_total.toFixed(2)
        })
      }

      // Build transaction lines
      const lines = []
      let line_number = 1

      // Service/Product lines
      for (const item of items) {
        const line_amount = item.quantity * item.unit_price - (item.discount || 0)

        // ✅ FIX: Handle custom "Other" items (temporary IDs starting with "custom-")
        // These don't exist in the database, so set entity_id to null
        const isCustomItem = item.entity_id?.startsWith('custom-')
        const entity_id = isCustomItem ? null : item.entity_id

        lines.push({
          line_number: line_number++,
          line_type: item.type,
          entity_id: entity_id,
          description: item.name,
          quantity: item.quantity,
          unit_amount: item.unit_price,
          line_amount,
          discount_amount: item.discount || 0,
          smart_code:
            item.type === 'service' ? SMART_CODES.SERVICE_COMPLETE : SMART_CODES.PRODUCT_SALE,
          metadata: {
            staff_id: item.staff_id,
            appointment_id,
            // ✅ Store original custom ID for reference if needed
            ...(isCustomItem ? { custom_item_id: item.entity_id } : {})
          }
        })

        // ❌ COMMISSION DISABLED - Commission tracking moved to separate system
        // Commission lines were incorrectly included in customer-facing totals
        // causing the transaction total to be inflated by commission amounts
      }

      // Discount line (if applicable)
      if (discount_total > 0) {
        lines.push({
          line_number: line_number++,
          line_type: 'discount',
          entity_id: null, // ✅ FIX: System line - no entity reference needed
          description: 'Total Discount',
          quantity: 1,
          unit_amount: -discount_total,
          line_amount: -discount_total,
          smart_code: 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.v1'
        })
      }

      // Tip line (if applicable)
      if (tip_total > 0) {
        lines.push({
          line_number: line_number++,
          line_type: 'tip',
          entity_id: null, // ✅ FIX: System line - no entity reference needed
          description: 'Gratuity',
          quantity: 1,
          unit_amount: tip_total,
          line_amount: tip_total,
          smart_code: 'HERA.SALON.POS.TIP.CARD.v1'
        })
      }

      // Tax line
      if (tax_amount > 0) {
        lines.push({
          line_number: line_number++,
          line_type: 'tax',
          entity_id: null, // ✅ FIX: System line - no entity reference needed
          description: `VAT (${(tax_rate * 100).toFixed(1)}%)`,
          quantity: 1,
          unit_amount: tax_amount,
          line_amount: tax_amount,
          smart_code: 'HERA.SALON.TAX.AE.VAT.STANDARD.v1'
        })
      }

      // ✅ ENTERPRISE FIX: Record NET cash received, not overpayment
      // Calculate net payment per method (excluding change)
      // payment_total already calculated above for validation
      const change_amount = Math.max(0, payment_total - total_amount)

      // Payment lines - record only NET amount received per method
      for (const payment of payments) {
        // For cash payments with change, reduce the recorded amount by the change
        let net_payment_amount = payment.amount

        if (payment.method === 'cash' && change_amount > 0) {
          // If this is a cash payment and there's change, subtract change from this payment
          // (assumes single cash payment; if multiple payments, this logic may need adjustment)
          net_payment_amount = payment.amount - change_amount
        }

        // Only record payment line if there's a net amount
        if (net_payment_amount > 0.01) {
          lines.push({
            line_number: line_number++,
            line_type: 'payment',
            entity_id: null, // ✅ System line - no entity reference needed
            description: `Payment - ${payment.method.toUpperCase()}`,
            quantity: 1,
            unit_amount: net_payment_amount,
            line_amount: net_payment_amount,
            smart_code:
              payment.method === 'cash' ? SMART_CODES.CASH_PAYMENT : SMART_CODES.CARD_PAYMENT,
            metadata: {
              payment_method: payment.method,
              reference: payment.reference,
              // ✅ ENTERPRISE AUDIT TRAIL: Store physical cash details in metadata
              ...(payment.method === 'cash' && change_amount > 0
                ? {
                    cash_received: payment.amount,
                    change_given: change_amount,
                    net_cash: net_payment_amount
                  }
                : {})
            }
          })
        }
      }

      // Determine primary staff ID (first staff from items)
      const primaryStaffId = items.find(item => item.staff_id)?.staff_id || null

      // ✅ ENTERPRISE TRACKING - Log all entity relationships
      console.log('[usePosCheckout] ENTERPRISE TRACKING - All entities linked:', {
        branch_id,
        customer_id,
        primary_staff: primaryStaffId,
        appointment_id,
        service_count: items.filter(i => i.type === 'service').length,
        product_count: items.filter(i => i.type === 'product').length,
        staff_assigned_count: items.filter(i => i.staff_id).length
      })

      // ✅ LAYER 2: Finance DNA v2 Pre-transaction Validation
      if (financeDNA && currentOrganization?.id) {
        await financeDNA.initialize()

        // Validate GL balance before processing
        const balanceValidation = FinanceGuardrails.validateDoubleEntry([
          { debit_amount: total_amount },
          { credit_amount: subtotal - discount_total },
          { credit_amount: tax_amount }
        ])

        if (!balanceValidation) {
          throw new Error('Finance DNA v2: Transaction amounts do not balance')
        }

        // Validate fiscal period
        const fiscalValidation = await FinanceGuardrails.validateFiscalPeriod(
          new Date().toISOString(),
          currentOrganization.id
        )

        if (!fiscalValidation.isValid) {
          throw new Error(`Finance DNA v2: ${fiscalValidation.reason}`)
        }

        // Validate currency support (AED for salon)
        const currencyValidation = await FinanceGuardrails.validateCurrencySupport(
          'AED',
          currentOrganization.id
        )

        if (!currencyValidation.isValid) {
          throw new Error('Finance DNA v2: AED currency not supported')
        }
      }

      // ✅ NEW: Determine if this is a backdated transaction
      const actualTransactionDate = transaction_date || new Date().toISOString()
      const isBackdated = !!transaction_date
      const entryDate = new Date().toISOString()

      // ✅ LAYER 1: Use createTransaction from useUniversalTransactionV1 (RPC hera_txn_crud_v1)
      const result = await createTransaction({
        transaction_type: 'SALE', // ✅ UPPERCASE - matches HERA DNA standard
        smart_code: 'HERA.SALON.TXN.SALE.CREATE.v1', // ✅ lowercase 'v' required by RPC validation
        transaction_date: actualTransactionDate, // ✅ Use custom date if provided, else current date
        source_entity_id: customer_id || null,
        target_entity_id: primaryStaffId, // ✅ Set to staff entity ID (like appointments)
        total_amount,
        transaction_status: 'completed', // ✅ FIX: Use transaction_status (not status)
        metadata: {
          subtotal,
          discount_total,
          tip_total,
          tax_amount,
          tax_rate,
          payment_methods: payments.map(p => p.method),
          notes,
          pos_session: Date.now().toString(),
          appointment_id, // Store appointment ID in metadata
          branch_id, // ✅ Store branch ID for location tracking
          // ✅ NEW: Backdated transaction audit trail
          ...(isBackdated ? {
            is_backdated: true,
            transaction_date: actualTransactionDate, // Historical date
            entry_date: entryDate, // When it was actually entered
            backdated_reason: 'Historical bill entry via POS'
          } : {}),
          // Enterprise-grade tracking: link to all entities (filter out custom temporary IDs)
          customer_entity_id: customer_id,
          staff_entity_id: primaryStaffId,
          service_ids: items.filter(i => i.type === 'service' && !i.entity_id?.startsWith('custom-')).map(i => i.entity_id),
          product_ids: items.filter(i => i.type === 'product' && !i.entity_id?.startsWith('custom-')).map(i => i.entity_id),
          // Finance DNA v2 integration markers
          finance_dna_version: 'v2', // Finance DNA v2 marker
          auto_journal_enabled: true,
          gl_posting_required: true
        },
        lines
      })

      // ✅ FIX: Extract transaction ID from hera_txn_crud_v1 response
      // useUniversalTransactionV1 returns the transformed transaction directly
      const transactionId = result?.id || result?.data?.id

      // ═══════════════════════════════════════════════════════════════════════════
      // ✅ GL JOURNAL AUTO-POSTING via hera_txn_crud_v1
      // Creates balanced GL entries using same RPC as POS sale
      // ═══════════════════════════════════════════════════════════════════════════

      let glJournalId = null
      try {
        // Build GL lines with proper debit/credit balance
        const glLines = []
        let glLineNum = 1

        // ──────────────────────────────────────────────────────────────────────────
        // DEBIT SIDE
        // ──────────────────────────────────────────────────────────────────────────

        // DR: Cash/Card (net amount collected)
        glLines.push({
          line_number: glLineNum++,
          line_type: 'gl',
          description: `Cash/Card received - Sale ${result.transaction_code || 'POS'}`,
          line_amount: total_amount,
          smart_code: 'HERA.SALON.FINANCE.GL.LINE.CASH.v1',
          line_data: {
            side: 'DR',
            account: payments[0]?.method === 'cash' ? '110000' : '110100',
            currency: 'AED',
            payment_method: payments[0]?.method
          }
        })

        // DR: Discount Given (promotional expense)
        if (discount_total > 0) {
          glLines.push({
            line_number: glLineNum++,
            line_type: 'gl',
            description: 'Promotional discount given to customer',
            line_amount: discount_total,
            smart_code: 'HERA.SALON.FINANCE.GL.LINE.DISCOUNT.v1',
            line_data: {
              side: 'DR',
              account: '550000',
              currency: 'AED',
              discount_percentage: ((discount_total / subtotal) * 100).toFixed(2)
            }
          })
        }

        // ──────────────────────────────────────────────────────────────────────────
        // CREDIT SIDE
        // ──────────────────────────────────────────────────────────────────────────

        // CR: Service Revenue (GROSS amount before discount)
        glLines.push({
          line_number: glLineNum++,
          line_type: 'gl',
          description: 'Service revenue (gross)',
          line_amount: subtotal,
          smart_code: 'HERA.SALON.FINANCE.GL.LINE.REVENUE.v1',
          line_data: {
            side: 'CR',
            account: '410000',
            currency: 'AED',
            revenue_type: 'service'
          }
        })

        // CR: VAT Payable
        if (tax_amount > 0) {
          glLines.push({
            line_number: glLineNum++,
            line_type: 'gl',
            description: `VAT payable (${(tax_rate * 100).toFixed(1)}%)`,
            line_amount: tax_amount,
            smart_code: 'HERA.SALON.FINANCE.GL.LINE.VAT.v1',
            line_data: {
              side: 'CR',
              account: '230000',
              currency: 'AED',
              tax_rate,
              tax_base: subtotal - discount_total
            }
          })
        }

        // CR: Tips Payable
        if (tip_total > 0) {
          glLines.push({
            line_number: glLineNum++,
            line_type: 'gl',
            description: 'Tips payable to staff',
            line_amount: tip_total,
            smart_code: 'HERA.SALON.FINANCE.GL.LINE.TIPS.v1',
            line_data: {
              side: 'CR',
              account: '240000',
              currency: 'AED'
            }
          })
        }

        // ──────────────────────────────────────────────────────────────────────────
        // BALANCE VALIDATION (Critical!)
        // ──────────────────────────────────────────────────────────────────────────

        const totalDR = glLines
          .filter(l => l.line_data.side === 'DR')
          .reduce((sum, l) => sum + l.line_amount, 0)
        const totalCR = glLines
          .filter(l => l.line_data.side === 'CR')
          .reduce((sum, l) => sum + l.line_amount, 0)

        console.log('[GL Auto-Post] Balance Check:', {
          total_dr: totalDR.toFixed(2),
          total_cr: totalCR.toFixed(2),
          difference: Math.abs(totalDR - totalCR).toFixed(2),
          is_balanced: Math.abs(totalDR - totalCR) < 0.01
        })

        if (Math.abs(totalDR - totalCR) > 0.01) {
          throw new Error(
            `GL Entry not balanced: DR ${totalDR.toFixed(2)} != CR ${totalCR.toFixed(2)}`
          )
        }

        // ──────────────────────────────────────────────────────────────────────────
        // CREATE GL JOURNAL TRANSACTION
        // ──────────────────────────────────────────────────────────────────────────

        const glResult = await createTransaction({
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
          transaction_date: actualTransactionDate,
          source_entity_id: customer_id || null, // ✅ FIX: Must reference core_entities (customer), not transaction
          target_entity_id: primaryStaffId || null, // Staff entity from core_entities
          total_amount: 0, // GL journals net to zero
          transaction_status: 'posted',
          metadata: {
            origin_transaction_id: transactionId, // ✅ Link to sale transaction via metadata
            origin_transaction_code: result.transaction_code,
            origin_transaction_type: 'SALE',
            posting_source: 'pos_auto_post',
            gl_balanced: true,
            total_dr: totalDR,
            total_cr: totalCR,
            gross_revenue: subtotal,
            discount_given: discount_total,
            net_revenue: subtotal - discount_total,
            vat_collected: tax_amount,
            tips_collected: tip_total,
            cash_received: total_amount,
            branch_id // Include branch for tracking
          },
          lines: glLines
        })

        glJournalId = glResult?.id || glResult?.data?.id

        console.log('[GL Auto-Post] ✅ GL Journal Entry created:', {
          journal_id: glJournalId,
          gl_lines: glLines.length,
          gross_revenue: subtotal,
          discount_expense: discount_total,
          net_revenue: subtotal - discount_total,
          cash_received: total_amount
        })

      } catch (glError) {
        console.error('[GL Auto-Post] ⚠️ GL posting failed (non-blocking):', glError)
        // Sale still succeeds - GL posting failure is logged for manual review
      }

      return {
        transaction_id: transactionId,
        transaction_code: generateTransactionCode('SALE'),
        total_amount,
        lines: lines.length,
        gl_journal_id: glJournalId,
        gl_posting_status: glJournalId ? 'posted' : 'failed',
        auto_journal_triggered: true
      }
    } catch (err) {
      console.error('POS checkout error:', err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing: isProcessing || isCreating,
    error,
    processCheckout,
    clearError
  }
}

// Utility functions for POS calculations
export const PosUtils = {
  calculateSubtotal: (items: PosCartItem[]) => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price - (item.discount || 0),
      0
    )
  },

  calculateTax: (subtotal: number, discountTotal: number, taxRate: number) => {
    return (subtotal - discountTotal) * taxRate
  },

  calculateTotal: (subtotal: number, discountTotal: number, taxAmount: number, tipTotal = 0) => {
    return subtotal - discountTotal + taxAmount + tipTotal
  },

  validatePayments: (payments: PosPayment[], totalAmount: number) => {
    const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
    return Math.abs(paymentTotal - totalAmount) <= 0.01
  }
}
