// ================================================================================
// UNIVERSAL TRANSACTION HOOK
// Smart Code: HERA.HOOK.UNIVERSAL.TXN.V1
// React hook for creating universal transactions with guardrails
// ================================================================================

'use client'

import { useState } from 'react'
import { useOrganization } from '@/components/organization/OrganizationProvider'

interface UniversalTransactionLine {
  line_number: number
  line_type: 'service' | 'product' | 'payment' | 'tax' | 'discount' | 'commission' | 'expense'
  entity_id: string
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  discount_amount?: number
  tax_amount?: number
  smart_code: string
  metadata?: Record<string, any>
}

interface UniversalTransactionPayload {
  transaction_type: string
  transaction_date?: string
  source_entity_id: string
  target_entity_id?: string
  total_amount: number
  smart_code: string
  reference_number?: string
  external_reference?: string
  metadata?: Record<string, any>
  lines: UniversalTransactionLine[]
}

interface UseUniversalTxnReturn {
  isLoading: boolean
  error: string | null
  createTransaction: (payload: Omit<UniversalTransactionPayload, 'organization_id'>) => Promise<any>
  clearError: () => void
}

export function useUniversalTxn(): UseUniversalTxnReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentOrganization } = useOrganization()

  const createTransaction = async (
    payload: Omit<UniversalTransactionPayload, 'organization_id'>
  ) => {
    if (!currentOrganization?.id) {
      throw new Error('Organization context required - guardrail enforced')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate smart code format
      if (!payload.smart_code.startsWith('HERA.')) {
        throw new Error('Invalid smart code format - must start with HERA.')
      }

      // Validate debits = credits for financial transactions
      const totalLines = payload.lines.reduce((sum, line) => sum + line.line_amount, 0)
      if (Math.abs(totalLines - payload.total_amount) > 0.01) {
        throw new Error('Debits must equal credits - line amounts must sum to total amount')
      }

      // Build complete payload with organization_id
      const completePayload = {
        ...payload,
        organization_id: currentOrganization.id,
        transaction_date: payload.transaction_date || new Date().toISOString()
      }

      console.log('Creating universal transaction:', completePayload)

      // Call Universal API
      const response = await fetch('/api/v1/universal/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completePayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create transaction')
      }

      const result = await response.json()
      console.log('Transaction created:', result)

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    isLoading,
    error,
    createTransaction,
    clearError
  }
}

// Utility function to generate transaction codes
export function generateTransactionCode(type: string): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${type.toUpperCase()}-${timestamp}-${random}`
}

// Smart code templates for common transactions
export const SMART_CODES = {
  // POS Transactions
  POS_SALE: 'HERA.SALON.POS.SALE.TXN.V1',
  POS_PAYMENT: 'HERA.SALON.POS.PAYMENT.TXN.V1',

  // Services
  SERVICE_APPOINTMENT: 'HERA.SALON.SVC.APPOINTMENT.TXN.V1',
  SERVICE_COMPLETE: 'HERA.SALON.SVC.COMPLETE.TXN.V1',

  // Products
  PRODUCT_SALE: 'HERA.SALON.PROD.SALE.TXN.V1',
  INVENTORY_ADJUSTMENT: 'HERA.SALON.INV.ADJUSTMENT.TXN.V1',

  // Payments
  CASH_PAYMENT: 'HERA.SALON.PAY.CASH.TXN.V1',
  CARD_PAYMENT: 'HERA.SALON.PAY.CARD.TXN.V1',

  // Commission and Staff
  STAFF_COMMISSION: 'HERA.SALON.STAFF.COMMISSION.TXN.V1'
} as const
