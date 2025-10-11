// ================================================================================
// POS CHECKOUT HOOK
// Smart Code: HERA.HOOK.POS.CHECKOUT.V1
// Maps POS cart to universal_transaction payload with auto-journal posting
//
// ARCHITECTURE:
// - Uses UNIVERSAL HOOKS: useUniversalTransaction (RPC API v2)
// - Layer 2: Business logic for POS checkout
// - Handles cart calculation, line item building, payment validation
// ================================================================================

'use client'

import { useState } from 'react'
import { useUniversalTransaction } from './useUniversalTransaction'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { FinanceDNAServiceV2, FinanceGuardrails } from '@/lib/dna/integration/finance-integration-dna-v2'
import type { UniversalFinanceEventV2 } from '@/lib/dna/integration/finance-integration-dna-v2'

// Smart code templates for POS transactions
const SMART_CODES = {
  POS_SALE: 'HERA.SALON.TXN.SALE.CREATE.V1',
  SERVICE_COMPLETE: 'HERA.SALON.TXN.SERVICE.COMPLETE.V1',
  PRODUCT_SALE: 'HERA.SALON.TXN.PRODUCT.SALE.V1',
  CASH_PAYMENT: 'HERA.SALON.POS.PAYMENT.CASH.V1',
  CARD_PAYMENT: 'HERA.SALON.POS.PAYMENT.CARD.V1',
  STAFF_COMMISSION: 'HERA.SALON.POS.LINE.COMMISSION.EXPENSE.V1'
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

  // ✅ LAYER 1: Use useUniversalTransaction (RPC API v2)
  const {
    create: createTransaction,
    isCreating,
    error: txnError
  } = useUniversalTransaction({
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

      // Validate payments equal total
      const payment_total = payments.reduce((sum, payment) => sum + payment.amount, 0)
      if (Math.abs(payment_total - total_amount) > 0.01) {
        console.error('[usePosCheckout] Payment validation failed:', {
          subtotal: subtotal.toFixed(2),
          discount_total: discount_total.toFixed(2),
          tax_amount: tax_amount.toFixed(2),
          tip_total: tip_total.toFixed(2),
          total_amount: total_amount.toFixed(2),
          payment_total: payment_total.toFixed(2),
          difference: (payment_total - total_amount).toFixed(2)
        })
        throw new Error('Payment amount must equal transaction total')
      }

      // Build transaction lines
      const lines = []
      let line_number = 1

      // Service/Product lines
      for (const item of items) {
        const line_amount = item.quantity * item.unit_price - (item.discount || 0)

        lines.push({
          line_number: line_number++,
          line_type: item.type,
          entity_id: item.entity_id,
          description: item.name,
          quantity: item.quantity,
          unit_amount: item.unit_price,
          line_amount,
          discount_amount: item.discount || 0,
          smart_code:
            item.type === 'service' ? SMART_CODES.SERVICE_COMPLETE : SMART_CODES.PRODUCT_SALE,
          metadata: {
            staff_id: item.staff_id,
            appointment_id
          }
        })

        // Add commission line if staff assigned
        if (item.staff_id && item.type === 'service') {
          const commission_rate = 0.4 // 40% commission
          const commission_amount = line_amount * commission_rate

          lines.push({
            line_number: line_number++,
            line_type: 'commission',
            entity_id: item.staff_id,
            description: `Commission - ${item.name}`,
            quantity: 1,
            unit_amount: commission_amount,
            line_amount: commission_amount,
            smart_code: SMART_CODES.STAFF_COMMISSION,
            metadata: {
              commission_rate,
              base_amount: line_amount,
              service_entity_id: item.entity_id
            }
          })
        }
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
          smart_code: 'HERA.SALON.DISCOUNT.TXN.V1'
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
          smart_code: 'HERA.SALON.TIP.TXN.V1'
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
          smart_code: 'HERA.SALON.TAX.VAT.TXN.V1'
        })
      }

      // Payment lines
      for (const payment of payments) {
        lines.push({
          line_number: line_number++,
          line_type: 'payment',
          entity_id: null, // ✅ FIX: System line - no entity reference needed
          description: `Payment - ${payment.method.toUpperCase()}`,
          quantity: 1,
          unit_amount: payment.amount,
          line_amount: payment.amount,
          smart_code:
            payment.method === 'cash' ? SMART_CODES.CASH_PAYMENT : SMART_CODES.CARD_PAYMENT,
          metadata: {
            payment_method: payment.method,
            reference: payment.reference
          }
        })
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

      // ✅ LAYER 1: Use createTransaction from useUniversalTransaction (RPC API v2)
      const result = await createTransaction({
        transaction_type: 'SALE', // ✅ UPPERCASE - matches HERA DNA standard
        smart_code: 'HERA.SALON.TXN.SALE.CREATE.V1',
        transaction_date: new Date().toISOString(),
        source_entity_id: customer_id || null,
        target_entity_id: primaryStaffId, // ✅ Set to staff entity ID (like appointments)
        total_amount,
        status: 'completed', // POS sales are immediately completed
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
          // Enterprise-grade tracking: link to all entities
          customer_entity_id: customer_id,
          staff_entity_id: primaryStaffId,
          service_ids: items.filter(i => i.type === 'service').map(i => i.entity_id),
          product_ids: items.filter(i => i.type === 'product').map(i => i.entity_id),
          // Finance DNA v2 integration markers
          finance_dna_version: 'v2', // Finance DNA v2 marker
          auto_journal_enabled: true,
          gl_posting_required: true
        },
        lines
      })

      // Extract transaction ID from RPC response
      const transactionId = typeof result.data === 'string' ? result.data : result.data?.transaction_id || result.data?.id

      // ✅ LAYER 2: Finance DNA v2 Auto-Journal Processing
      let autoJournalResult = null
      if (financeDNA && transactionId && currentOrganization?.id) {
        try {
          // Create Finance DNA v2 event
          const financeEvent: UniversalFinanceEventV2 = {
            organization_id: currentOrganization.id,
            transaction_id: transactionId,
            transaction_type: 'SALE',
            smart_code: 'HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1', // Use Finance DNA v2 smart code
            transaction_date: new Date().toISOString(),
            total_amount,
            transaction_currency_code: 'AED',
            metadata: {
              subtotal,
              discount_total,
              tax_amount,
              tax_rate,
              payment_methods: payments.map(p => p.method),
              pos_session: Date.now().toString(),
              original_smart_code: 'HERA.SALON.TXN.SALE.CREATE.V1'
            },
            business_context: {
              industry: 'salon',
              transaction_source: 'pos',
              payment_immediate: true,
              vat_applicable: tax_amount > 0,
              vat_rate: tax_rate
            },
            v2_enhancements: {
              view_optimized: true,
              rpc_processed: true,
              performance_tier: 'standard',
              real_time_insights: true
            }
          }

          // Process the event through Finance DNA v2
          autoJournalResult = await financeDNA.processEvent(financeEvent)

          console.log('[Finance DNA v2] Auto-journal result:', {
            success: autoJournalResult.success,
            outcome: autoJournalResult.outcome,
            performance: autoJournalResult.performance_metrics
          })

        } catch (autoJournalError) {
          console.warn('[Finance DNA v2] Auto-journal failed (non-blocking):', autoJournalError)
          // Don't fail the POS transaction if auto-journal fails
        }
      }

      return {
        transaction_id: transactionId,
        transaction_code: generateTransactionCode('SALE'),
        total_amount,
        lines: lines.length,
        auto_journal_triggered: true,
        finance_dna_v2: {
          enabled: !!financeDNA,
          validation_passed: true,
          auto_journal_result: autoJournalResult,
          performance_metrics: autoJournalResult?.performance_metrics
        }
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
