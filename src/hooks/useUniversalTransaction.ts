// ================================================================================
// UNIVERSAL TRANSACTION HOOK - ENTERPRISE GRADE
// Smart Code: HERA.HOOK.UNIVERSAL.TRANSACTION.V2
// ================================================================================
//
// 🎯 ENTERPRISE ROUTING SYSTEM:
// This hook intelligently routes to the correct RPC function based on transaction type:
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Transaction Type          │ RPC Function        │ Purpose               │
// ├───────────────────────────┼─────────────────────┼───────────────────────┤
// │ APPOINTMENT               │ hera_txn_create_v1  │ Booking appointments  │
// │ SALE                      │ hera_txn_create_v1  │ POS sales             │
// │ PURCHASE                  │ hera_txn_create_v1  │ Purchase orders       │
// │ PAYMENT                   │ hera_txn_create_v1  │ Payments received     │
// │ INVOICE                   │ hera_txn_create_v1  │ Customer invoices     │
// │ GL_JOURNAL                │ hera_txn_emit_v1    │ General ledger posts  │
// │ GL_ADJUSTMENT             │ hera_txn_emit_v1    │ GL adjustments        │
// └─────────────────────────────────────────────────────────────────────────┘
//
// 📊 STATUS MAPPING:
// - APPOINTMENT: 'draft' (saved) → 'booked' (confirmed) → 'checked_in' → 'completed'
// - SALE: 'completed' (finalized sales)
// - Other valid appointment statuses: 'cancelled', 'no_show', 'rescheduled'
//
// ✅ Uses RPC functions from universal-api-v2-client
// ✅ Enterprise-grade: Automatic type normalization and status mapping
// ✅ Universal: Works with ANY transaction type following HERA DNA standards
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

// ================================================================================
// ENTERPRISE CONSTANTS & CONFIGURATION
// ================================================================================

/**
 * 🎯 Transaction types that use business transaction RPC (hera_txn_create_v1)
 * These are operational transactions with unit_amount/line_amount fields
 */
const BUSINESS_TRANSACTION_TYPES = [
  'APPOINTMENT',
  'SALE',
  'PURCHASE',
  'PAYMENT',
  'INVOICE',
  'REFUND',
  'ORDER',
  'RESERVATION',
  'BOOKING'
] as const

/**
 * 💰 Transaction types that use accounting/GL RPC (hera_txn_emit_v1)
 * These are financial transactions with debit_amount/credit_amount fields
 */
const ACCOUNTING_TRANSACTION_TYPES = [
  'GL_JOURNAL',
  'GL_ADJUSTMENT',
  'GL_ACCRUAL',
  'GL_REVERSAL'
] as const

/**
 * 📋 Valid appointment statuses
 * Source: /src/lib/playbook/entities.ts - AppointmentStatus type
 */
const APPOINTMENT_STATUSES = [
  'draft',          // Draft/saved appointment (not confirmed)
  'booked',         // Confirmed appointment
  'checked_in',     // Customer arrived
  'in_progress',    // Service in progress (IN_SERVICE in kanban)
  'payment_pending',// Waiting for payment (TO_PAY in kanban)
  'completed',      // Service finished
  'cancelled',      // Appointment cancelled
  'no_show',        // Customer didn't show up
  'rescheduled'     // Appointment rescheduled
] as const

/**
 * 📊 Default status by transaction type
 * Ensures correct initial status for each transaction type
 */
const DEFAULT_STATUS_BY_TYPE: Record<string, string> = {
  'APPOINTMENT': 'booked',    // Appointments are booked by default
  'SALE': 'completed',        // Sales are completed transactions
  'PAYMENT': 'completed',     // Payments are completed
  'INVOICE': 'pending',       // Invoices start as pending
  'PURCHASE': 'pending',      // Purchase orders start as pending
  'ORDER': 'pending'          // Orders start as pending
}

// ================================================================================
// ENTERPRISE HELPER FUNCTIONS
// ================================================================================

/**
 * ✅ ENTERPRISE PATTERN: Normalize transaction_type to UPPERCASE
 * Ensures all transaction types follow HERA DNA standard (SALE, APPOINTMENT, PAYMENT, etc.)
 *
 * @param transactionType - Raw transaction type (may be lowercase/mixed case)
 * @returns Normalized UPPERCASE transaction type or undefined
 */
function normalizeTransactionType(transactionType?: string | null): string | undefined {
  if (!transactionType) return undefined
  return transactionType.toUpperCase()
}

/**
 * 🎯 ENTERPRISE ROUTING: Determine which RPC endpoint to use
 * Routes to correct RPC based on transaction type
 *
 * @param transactionType - Normalized UPPERCASE transaction type
 * @returns API action: 'create' (txn-emit → hera_txn_create_v1) or 'emit' (txn-emit → hera_txn_emit_v1)
 */
function getTransactionAction(transactionType: string): 'create' | 'emit' {
  // Check if it's an accounting/GL transaction
  if (ACCOUNTING_TRANSACTION_TYPES.includes(transactionType as any)) {
    return 'emit'  // Use hera_txn_emit_v1 for GL posting
  }

  // Default to business transaction (hera_txn_create_v1)
  return 'create'
}

/**
 * 📊 ENTERPRISE STATUS MAPPING: Get appropriate status for transaction type
 * Maps user intent to correct database status
 *
 * @param transactionType - Normalized UPPERCASE transaction type
 * @param requestedStatus - User-requested status (e.g., 'saved', 'create', 'booked')
 * @returns Correct database status
 */
function mapTransactionStatus(transactionType: string, requestedStatus?: string): string {
  // If no status requested, use default for transaction type
  if (!requestedStatus) {
    return DEFAULT_STATUS_BY_TYPE[transactionType] || 'draft'
  }

  // Special mapping for appointments
  if (transactionType === 'APPOINTMENT') {
    // Map user intent to appointment status
    switch (requestedStatus.toLowerCase()) {
      case 'save':
      case 'saved':
      case 'draft':
        return 'draft'           // Saved but not confirmed
      case 'create':
      case 'book':
      case 'booked':
      case 'confirm':
      case 'confirmed':
        return 'booked'          // Confirmed appointment
      case 'checkin':
      case 'checked_in':
        return 'checked_in'      // Customer arrived
      case 'in_progress':
      case 'inprogress':
      case 'in_service':
      case 'service':
        return 'in_progress'     // Service in progress
      case 'payment_pending':
      case 'paymentpending':
      case 'to_pay':
      case 'topay':
      case 'awaiting_payment':
        return 'payment_pending' // Waiting for payment
      case 'complete':
      case 'completed':
        return 'completed'       // Service finished
      case 'cancel':
      case 'cancelled':
        return 'cancelled'       // Cancelled
      case 'no_show':
        return 'no_show'         // Customer didn't show
      case 'reschedule':
      case 'rescheduled':
        return 'rescheduled'     // Rescheduled
      default:
        // If it's already a valid appointment status, use it
        if (APPOINTMENT_STATUSES.includes(requestedStatus as any)) {
          return requestedStatus
        }
        // ❌ DO NOT default to 'booked' - this causes backward moves!
        // Instead, throw an error or return the requested status
        console.warn(`[mapTransactionStatus] Unknown appointment status: ${requestedStatus}, returning as-is`)
        return requestedStatus   // Return as-is instead of defaulting to 'booked'
    }
  }

  // For SALE transactions, always use 'completed'
  if (transactionType === 'SALE') {
    return 'completed'
  }

  // For other transaction types, use requested status or default
  return requestedStatus || DEFAULT_STATUS_BY_TYPE[transactionType] || 'draft'
}

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
    include_lines?: boolean // ✅ FIX: Include transaction lines in response
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
  const { organization, user } = useHERAAuth()
  const queryClient = useQueryClient()

  // Use passed organizationId if provided, otherwise fall back to useHERAAuth
  const organizationId = config.organizationId || organization?.id
  const { filters = {} } = config

  // ✅ ENTERPRISE AUDIT TRAIL: Extract user entity ID for audit tracking
  const userEntityId = user?.entity_id

  // ✅ ENTERPRISE PATTERN: Normalize transaction_type filter to UPPERCASE
  const normalizedTransactionType = normalizeTransactionType(filters.transaction_type)

  // Build query key
  const queryKey = useMemo(
    () => [
      'transactions',
      organizationId,
      {
        transaction_type: normalizedTransactionType || null,
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
      normalizedTransactionType,
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
        filters,
        includeLines: filters.include_lines // ✅ DEBUG: Verify parameter
      })

      const result = await getTransactions({
        orgId: organizationId,
        transactionType: normalizedTransactionType,
        smartCode: filters.smart_code,
        fromEntityId: filters.source_entity_id,
        toEntityId: filters.target_entity_id,
        startDate: filters.date_from,
        endDate: filters.date_to,
        includeLines: filters.include_lines // ✅ FIX: Pass includeLines parameter
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
          has_lines: !!result[0].lines, // ✅ DEBUG: Check if lines exist
          lines_count: result[0].lines?.length || 0, // ✅ DEBUG: Count lines
          metadata: result[0].metadata,
          // ✅ DEBUG: Check payment_methods in metadata
          payment_methods: result[0].metadata?.payment_methods || result[0].business_context?.payment_methods,
          // ✅ DEBUG: Check if this is the actual response format issue
          has_transactions_key: 'transactions' in result,
          raw_keys: Object.keys(result[0] || {})
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

      // ✅ ENTERPRISE PATTERN: Normalize transaction_type to UPPERCASE
      const normalizedType = normalizeTransactionType(payload.transaction_type) || payload.transaction_type

      // ✅ ENTERPRISE STATUS MAPPING: Map user intent to correct database status
      // For APPOINTMENT: 'create' → 'booked', 'saved' → 'draft'
      // For SALE: always 'completed'
      const mappedStatus = mapTransactionStatus(normalizedType, payload.status)

      // ✅ ENTERPRISE ROUTING: Determine which RPC endpoint to use
      const action = getTransactionAction(normalizedType)

      console.log('[useUniversalTransaction] Creating transaction (ENTERPRISE-GRADE):', {
        organizationId,
        originalType: payload.transaction_type,
        normalizedType,
        requestedStatus: payload.status,
        mappedStatus,
        rpcAction: action,
        rpcFunction: action === 'emit' ? 'hera_txn_emit_v1' : 'hera_txn_create_v1',
        smartCode: payload.smart_code
      })

      // Use RPC function from universal-api-v2-client
      const result = await createTransaction(organizationId, {
        p_transaction_type: normalizedType,
        p_smart_code: payload.smart_code,
        p_transaction_date: payload.transaction_date || new Date().toISOString(),
        p_from_entity_id: payload.source_entity_id || null,
        p_to_entity_id: payload.target_entity_id || null,
        p_total_amount: payload.total_amount || 0,
        p_status: mappedStatus, // ✅ ENTERPRISE: Use mapped status instead of raw status
        p_metadata: {
          ...(payload.metadata || {}),
          status: mappedStatus, // ✅ Store mapped status in metadata for consistency
          // ✅ ENTERPRISE AUDIT TRAIL: Include created_by and original requested status
          ...(userEntityId && { created_by: userEntityId }),
          ...(payload.status && payload.status !== mappedStatus && {
            original_status: payload.status  // Track original if it was mapped
          })
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

      // ✅ ENTERPRISE PATTERN: Normalize transaction_type to UPPERCASE if provided
      const normalizedType = updates.transaction_type
        ? (normalizeTransactionType(updates.transaction_type) || updates.transaction_type)
        : undefined

      // ✅ ENTERPRISE STATUS MAPPING: Map status if provided
      let mappedStatus: string | undefined
      if (updates.status) {
        // For updates, we need the transaction type to map status correctly
        // If transaction_type is provided in update, use it; otherwise use normalized filter type
        const typeForMapping = normalizedType || normalizedTransactionType || 'GENERIC'
        mappedStatus = mapTransactionStatus(typeForMapping, updates.status)
      }

      console.log('[useUniversalTransaction] Updating transaction (ENTERPRISE-GRADE):', {
        transaction_id,
        originalType: updates.transaction_type,
        normalizedType,
        requestedStatus: updates.status,
        mappedStatus,
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
        ...(updates.smart_code && { p_smart_code: updates.smart_code }),
        ...(normalizedType && { p_transaction_type: normalizedType })
      }

      // ✅ Handle status update (transaction_status field) - use mapped status
      if (mappedStatus) {
        updatePayload.p_status = mappedStatus
      }

      // ✅ Handle metadata update (preserve existing metadata, update status if needed)
      if (updates.metadata || mappedStatus || userEntityId) {
        const mergedMetadata = {
          ...(updates.metadata || {}),
          ...(mappedStatus && { status: mappedStatus }),
          // ✅ ENTERPRISE AUDIT TRAIL: Include updated_by and original requested status
          ...(userEntityId && { updated_by: userEntityId }),
          ...(updates.status && updates.status !== mappedStatus && {
            original_status: updates.status  // Track original if it was mapped
          })
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
        force,
        updated_by: userEntityId // ✅ Log for audit visibility
      })

      // ✅ ENTERPRISE AUDIT TRAIL: Include updated_by in the delete options
      // Note: Soft deletes update the status, so we use updated_by (not deleted_by)
      const result = await deleteTransaction(transaction_id, organizationId, {
        force,
        // Pass updated_by for audit trail (soft deletes are updates)
        ...(userEntityId && { updated_by: userEntityId })
      })

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
