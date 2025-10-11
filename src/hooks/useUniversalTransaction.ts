// ================================================================================
// UNIVERSAL TRANSACTION HOOK
// Smart Code: HERA.HOOK.UNIVERSAL.TRANSACTION.V1
// Following the same pattern as useUniversalEntity for consistency
// ✅ Uses RPC functions from universal-api-v2-client
// ✅ Enterprise-grade: Handles all transaction data fields correctly
// ✅ Universal: Works with ANY transaction type (SALE, APPOINTMENT, PAYMENT, etc.)
// ================================================================================

'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Json
} from '@/lib/universal-api-v2-client'

// Transaction line interface (matches createTransaction RPC signature)
export interface TransactionLine {
  line_type: string
  entity_id?: string | null
  description?: string | null
  quantity?: number | null
  unit_amount?: number | null
  line_amount?: number | null
  smart_code?: string
  metadata?: Record<string, any>
}

// Transaction create/update payload
export interface TransactionPayload {
  transaction_type: string // UPPERCASE (e.g., 'SALE', 'APPOINTMENT', 'PAYMENT')
  smart_code: string
  transaction_date?: string
  source_entity_id?: string | null // Customer ID for sales/appointments
  target_entity_id?: string | null // Staff ID for appointments/sales
  total_amount?: number
  status?: string // Transaction status (transaction_status field)
  metadata?: Record<string, any>
  lines?: TransactionLine[]
}

// Config for the hook
export interface UseUniversalTransactionConfig {
  organizationId?: string // Optional: if not provided, will use useHERAAuth
  filters?: {
    transaction_type?: string
    smart_code?: string
    source_entity_id?: string
    target_entity_id?: string
    status?: string // Filter by transaction_status
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }
  // Query options (matching useUniversalEntity pattern)
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

/**
 * Universal hook for transaction management
 * Works with any transaction type: SALE, APPOINTMENT, PAYMENT, etc.
 * Follows the same pattern as useUniversalEntity
 */
export function useUniversalTransaction(config: UseUniversalTransactionConfig = {}) {
  const { organization } = useHERAAuth()
  const queryClient = useQueryClient()

  // Use passed organizationId if provided, otherwise fall back to useHERAAuth
  const organizationId = config.organizationId || organization?.id
  const { filters = {} } = config

  // Build query key
  const queryKey = useMemo(
    () => [
      'transactions',
      organizationId,
      {
        transaction_type: filters.transaction_type || null,
        smart_code: filters.smart_code || null,
        source_entity_id: filters.source_entity_id || null,
        target_entity_id: filters.target_entity_id || null,
        date_from: filters.date_from || null,
        date_to: filters.date_to || null,
        limit: filters.limit || 100,
        offset: filters.offset || 0
      }
    ],
    [
      organizationId,
      filters.transaction_type,
      filters.smart_code,
      filters.source_entity_id,
      filters.target_entity_id,
      filters.date_from,
      filters.date_to,
      filters.limit,
      filters.offset
    ]
  )

  // Fetch transactions
  const {
    data: transactions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      console.log('[useUniversalTransaction] Fetching transactions:', {
        organizationId,
        filters
      })

      const result = await getTransactions({
        orgId: organizationId,
        transactionType: filters.transaction_type,
        smartCode: filters.smart_code,
        fromEntityId: filters.source_entity_id,
        toEntityId: filters.target_entity_id,
        startDate: filters.date_from,
        endDate: filters.date_to
      })

      console.log('[useUniversalTransaction] Fetched transactions:', {
        count: result.length,
        first: result[0],
        firstFields: result[0] ? {
          id: result[0].id?.substring(0, 8),
          transaction_code: result[0].transaction_code,
          transaction_status: result[0].transaction_status,
          source_entity_id: result[0].source_entity_id,
          target_entity_id: result[0].target_entity_id,
          metadata: result[0].metadata
        } : null
      })

      // ✅ Filter by status if provided (client-side filtering)
      let filtered = Array.isArray(result) ? result : []
      if (filters.status) {
        filtered = filtered.filter((txn: any) =>
          txn.transaction_status === filters.status ||
          txn.metadata?.status === filters.status
        )
      }

      return filtered
    },
    enabled: !!organizationId,
    staleTime: config.staleTime || 10_000,
    refetchOnWindowFocus: config.refetchOnWindowFocus !== undefined ? config.refetchOnWindowFocus : false
  })

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (payload: TransactionPayload) => {
      if (!organizationId) {
        throw new Error('Organization ID required')
      }

      console.log('[useUniversalTransaction] Creating transaction:', {
        organizationId,
        type: payload.transaction_type,
        smartCode: payload.smart_code
      })

      // Use RPC function from universal-api-v2-client
      const result = await createTransaction(organizationId, {
        p_transaction_type: payload.transaction_type,
        p_smart_code: payload.smart_code,
        p_transaction_date: payload.transaction_date || new Date().toISOString(),
        p_from_entity_id: payload.source_entity_id || null,
        p_to_entity_id: payload.target_entity_id || null,
        p_total_amount: payload.total_amount || 0,
        p_metadata: {
          ...(payload.metadata || {}),
          ...(payload.status && { status: payload.status }) // ✅ Include status in metadata
        },
        p_lines: payload.lines || []
      })

      console.log('[useUniversalTransaction] Transaction created:', result)

      // Extract transaction ID from RPC response
      const transactionId = typeof result.data === 'string'
        ? result.data
        : result.data?.transaction_id || result.data?.id

      return { id: transactionId, ...result }
    },
    onSuccess: async () => {
      // Invalidate and refetch all transaction queries to ensure all pages update immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.refetchQueries({ queryKey: ['transactions'], type: 'active' })
      console.log('✅ Invalidated and refetched transaction queries after creation')
    }
  })

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      transaction_id,
      ...updates
    }: Partial<TransactionPayload> & { transaction_id: string }) => {
      if (!organizationId) {
        throw new Error('Organization ID required')
      }

      console.log('[useUniversalTransaction] Updating transaction:', {
        transaction_id,
        updates
      })

      // ✅ ENTERPRISE PATTERN: Handle status field correctly
      // Status can be in updates.status OR updates.metadata.status
      // Update both transaction_status (database field) and metadata.status for consistency
      const updatePayload: any = {
        ...(updates.transaction_date && { p_transaction_date: updates.transaction_date }),
        ...(updates.source_entity_id !== undefined && { p_source_entity_id: updates.source_entity_id }),
        ...(updates.target_entity_id !== undefined && { p_target_entity_id: updates.target_entity_id }),
        ...(updates.total_amount !== undefined && { p_total_amount: updates.total_amount }),
        ...(updates.smart_code && { p_smart_code: updates.smart_code })
      }

      // ✅ Handle status update (transaction_status field)
      if (updates.status) {
        updatePayload.p_status = updates.status
      }

      // ✅ Handle metadata update (preserve existing metadata, update status if needed)
      if (updates.metadata || updates.status) {
        const mergedMetadata = {
          ...(updates.metadata || {}),
          ...(updates.status && { status: updates.status })
        }
        updatePayload.p_metadata = mergedMetadata as Json
      }

      console.log('[useUniversalTransaction] Update payload:', updatePayload)

      const result = await updateTransaction(transaction_id, organizationId, updatePayload)

      console.log('[useUniversalTransaction] Update result:', result)

      return result
    },
    onSuccess: async () => {
      // Invalidate and refetch all transaction queries to ensure all pages update immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.refetchQueries({ queryKey: ['transactions'], type: 'active' })
      console.log('✅ Invalidated and refetched transaction queries after update')
    }
  })

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async ({
      transaction_id,
      force = false
    }: {
      transaction_id: string
      force?: boolean
    }) => {
      if (!organizationId) {
        throw new Error('Organization ID required')
      }

      console.log('[useUniversalTransaction] Deleting transaction:', {
        transaction_id,
        force
      })

      const result = await deleteTransaction(transaction_id, organizationId, { force })

      return result
    },
    onSuccess: async () => {
      // Invalidate and refetch all transaction queries to ensure all pages update immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.refetchQueries({ queryKey: ['transactions'], type: 'active' })
      console.log('✅ Invalidated and refetched transaction queries after deletion')
    }
  })

  return {
    // Data (matching useUniversalEntity pattern)
    transactions: transactions || [],
    isLoading,
    error: (error as any)?.message,
    refetch,

    // Mutations (following useUniversalEntity pattern)
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,

    // Loading states (matching useUniversalEntity pattern)
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // ✅ Additional helpers for convenience
    updateStatus: async (transaction_id: string, status: string) => {
      return updateMutation.mutateAsync({ transaction_id, status })
    }
  }
}

/**
 * Example Usage:
 *
 * // POS Sale Transaction
 * const posTxn = useUniversalTransaction({
 *   filters: { transaction_type: 'SALE' }
 * })
 *
 * await posTxn.create({
 *   transaction_type: 'SALE',
 *   smart_code: 'HERA.SALON.TXN.SALE.CREATE.V1',
 *   source_entity_id: customerId,
 *   target_entity_id: staffId, // Assigned staff member
 *   total_amount: 150.00,
 *   metadata: { branch_id: branchId, notes: 'Walk-in customer' },
 *   lines: [
 *     {
 *       line_type: 'service',
 *       entity_id: serviceId,
 *       quantity: 1,
 *       unit_amount: 150.00,
 *       line_amount: 150.00,
 *       smart_code: 'HERA.SALON.POS.LINE.SERVICE.V1'
 *     }
 *   ]
 * })
 *
 * // Appointment Transaction
 * const appointments = useUniversalTransaction({
 *   filters: { transaction_type: 'APPOINTMENT' }
 * })
 *
 * await appointments.create({
 *   transaction_type: 'APPOINTMENT',
 *   smart_code: 'HERA.SALON.TXN.APPOINTMENT.CREATE.V1',
 *   source_entity_id: customerId,
 *   target_entity_id: stylistId,
 *   total_amount: 0,
 *   metadata: {
 *     start_time: '2024-01-15T10:00:00Z',
 *     end_time: '2024-01-15T11:00:00Z',
 *     duration_minutes: 60
 *   }
 * })
 */
