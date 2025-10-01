// ================================================================================
// POS CHECKOUT HOOK
// Smart Code: HERA.HOOK.POS.CHECKOUT.V1
// Maps POS cart to universal_transaction payload with auto-journal posting
// ================================================================================

'use client'

import { useState } from 'react'
import { useUniversalTxn, generateTransactionCode, SMART_CODES } from './useUniversalTxn'

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
  items: PosCartItem[]
  payments: PosPayment[]
  tax_rate?: number
  discount_total?: number
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
  const { createTransaction, isLoading, error, clearError } = useUniversalTxn()

  const processCheckout = async (checkoutData: PosCheckoutData) => {
    setIsProcessing(true)

    try {
      const {
        customer_id,
        appointment_id,
        items,
        payments,
        tax_rate = 0.05,
        discount_total = 0,
        notes
      } = checkoutData

      // Calculate totals
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price - (item.discount || 0),
        0
      )

      const tax_amount = (subtotal - discount_total) * tax_rate
      const total_amount = subtotal - discount_total + tax_amount

      // Validate payments equal total
      const payment_total = payments.reduce((sum, payment) => sum + payment.amount, 0)
      if (Math.abs(payment_total - total_amount) > 0.01) {
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
          entity_id: 'DISCOUNT', // Generic discount entity
          description: 'Total Discount',
          quantity: 1,
          unit_amount: -discount_total,
          line_amount: -discount_total,
          smart_code: 'HERA.SALON.DISCOUNT.TXN.V1'
        })
      }

      // Tax line
      if (tax_amount > 0) {
        lines.push({
          line_number: line_number++,
          line_type: 'tax',
          entity_id: 'VAT_5PCT', // Tax entity
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
          entity_id: payment.method === 'cash' ? 'CASH_ACCOUNT' : 'BANK_ACCOUNT',
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

      // Create the universal transaction
      const transactionPayload = {
        transaction_type: 'pos_sale',
        transaction_code: generateTransactionCode('POS'),
        source_entity_id: customer_id || 'WALK_IN_CUSTOMER',
        target_entity_id: 'SALON_LOCATION',
        total_amount,
        smart_code: SMART_CODES.POS_SALE,
        reference_number: appointment_id,
        metadata: {
          subtotal,
          discount_total,
          tax_amount,
          tax_rate,
          payment_methods: payments.map(p => p.method),
          notes,
          pos_session: Date.now().toString()
        },
        lines
      }

      console.log('POS Checkout payload:', transactionPayload)

      // Process through Universal API
      const result = await createTransaction(transactionPayload)

      // Auto-journal posting will be handled by Finance DNA
      console.log('POS transaction created, auto-journal posting triggered')

      return {
        transaction_id: result.id,
        transaction_code: transactionPayload.transaction_code,
        total_amount,
        lines: lines.length,
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
    isProcessing: isProcessing || isLoading,
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

  calculateTotal: (subtotal: number, discountTotal: number, taxAmount: number) => {
    return subtotal - discountTotal + taxAmount
  },

  validatePayments: (payments: PosPayment[], totalAmount: number) => {
    const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
    return Math.abs(paymentTotal - totalAmount) <= 0.01
  }
}
