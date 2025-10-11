// ================================================================================
// UNIVERSAL TRANSACTION HOOK
// Smart Code: HERA.HOOK.UNIVERSAL.TXN.V1
// React hook for creating universal transactions with RPC pattern (like appointments)
// ✅ UPDATED: Uses universal-api-v2-client RPC functions
// ================================================================================

'use client'

import { useState } from 'react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { createTransaction, updateTransaction, deleteTransaction } from '@/lib/universal-api-v2-client'
import type { Json } from '@/lib/universal-api-v2-client'

interface UniversalTransactionLine {
  line_type: string
  entity_id?: string | null
  description?: string | null
  quantity?: number | null
  unit_amount?: number | null
  line_amount?: number | null
  discount_amount?: number
  tax_amount?: number
  smart_code?: string
  metadata?: Record<string, any>
}

interface UniversalTransactionPayload {
  transaction_type: string
  transaction_date?: string
  source_entity_id?: string | null
  target_entity_id?: string | null
  total_amount?: number
  smart_code: string
  reference_number?: string
  external_reference?: string
  metadata?: Record<string, any>
  lines?: UniversalTransactionLine[]
}

interface UseUniversalTxnReturn {
  isLoading: boolean
  error: string | null
  createTxn: (payload: UniversalTransactionPayload) => Promise<any>
  updateTxn: (transactionId: string, payload: Partial<UniversalTransactionPayload>) => Promise<any>
  deleteTxn: (transactionId: string, force?: boolean) => Promise<any>
  clearError: () => void
}

export function useUniversalTxn(): UseUniversalTxnReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentOrganization } = useOrganization()

  const createTxn = async (payload: UniversalTransactionPayload) => {
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

      console.log('[useUniversalTxn] Creating transaction:', {
        orgId: currentOrganization.id,
        type: payload.transaction_type,
        smartCode: payload.smart_code
      })

      // Use universal-api-v2-client RPC function (like appointments)
      const result = await createTransaction(currentOrganization.id, {
        p_transaction_type: payload.transaction_type, // Already uppercase (e.g., 'SALE', 'APPOINTMENT')
        p_smart_code: payload.smart_code,
        p_transaction_date: payload.transaction_date || new Date().toISOString(),
        p_from_entity_id: payload.source_entity_id || null,
        p_to_entity_id: payload.target_entity_id || null,
        p_total_amount: payload.total_amount || 0,
        p_metadata: payload.metadata || {},
        p_lines: payload.lines || []
      })

      console.log('[useUniversalTxn] Transaction created:', result)

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTxn = async (transactionId: string, payload: Partial<UniversalTransactionPayload>) => {
    if (!currentOrganization?.id) {
      throw new Error('Organization context required')
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await updateTransaction(transactionId, currentOrganization.id, {
        p_transaction_date: payload.transaction_date,
        p_source_entity_id: payload.source_entity_id,
        p_target_entity_id: payload.target_entity_id,
        p_total_amount: payload.total_amount,
        p_metadata: payload.metadata as Json,
        p_smart_code: payload.smart_code
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTxn = async (transactionId: string, force: boolean = false) => {
    if (!currentOrganization?.id) {
      throw new Error('Organization context required')
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await deleteTransaction(transactionId, currentOrganization.id, { force })
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
    createTxn,
    updateTxn,
    deleteTxn,
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
// ✅ UPDATED: Use new TXN pattern - HERA.{INDUSTRY}.TXN.{TYPE}.{OPERATION}.V{VERSION}
export const SMART_CODES = {
  // POS Transactions (new pattern)
  POS_SALE: 'HERA.SALON.TXN.SALE.CREATE.V1',
  POS_PAYMENT: 'HERA.SALON.TXN.PAYMENT.RECEIVE.V1',

  // Services
  SERVICE_APPOINTMENT: 'HERA.SALON.TXN.APPOINTMENT.CREATE.V1',
  SERVICE_COMPLETE: 'HERA.SALON.TXN.SERVICE.COMPLETE.V1',

  // Products
  PRODUCT_SALE: 'HERA.SALON.TXN.PRODUCT.SALE.V1',
  INVENTORY_ADJUSTMENT: 'HERA.SALON.TXN.INVENTORY.ADJUST.V1',

  // Payments (line-level smart codes)
  CASH_PAYMENT: 'HERA.SALON.POS.PAYMENT.CASH.V1',
  CARD_PAYMENT: 'HERA.SALON.POS.PAYMENT.CARD.V1',

  // Commission and Staff (line-level smart codes)
  STAFF_COMMISSION: 'HERA.SALON.POS.LINE.COMMISSION.EXPENSE.V1'
} as const
