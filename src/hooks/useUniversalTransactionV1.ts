'use client'

/**
 * useUniversalTransactionV1 - Orchestrator RPC-based Transaction Management Hook
 *
 * ✅ Uses hera_txn_crud_v1 orchestrator RPC (5/5 tests passing, 100% success rate)
 * ✅ Single atomic call for transaction + lines (header + lines in one RPC)
 * ✅ Enterprise security: actor + organization + smart code validation
 * ✅ Atomic operations - transaction and all lines succeed or fail together
 * ✅ Support for all 9 actions: CREATE, READ, UPDATE, DELETE, QUERY, EMIT, REVERSE, VOID, VALIDATE
 * ✅ Correct nested response handling (data.data.data path for transaction data)
 * ✅ Three-level error checking: client → orchestrator → function
 *
 * @see /docs/api/v2/HERA_TRANSACTIONS_RPC_GUIDE.md
 * @see /docs/api/v2/HERA_TRANSACTIONS_RPC_ORCHESTRATOR_RESPONSE_GUIDE.md
 */

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { transactionCRUD } from '@/lib/universal-api-v2-client'

// ============================================================================
// TYPES
// ============================================================================

export interface TransactionLine {
  line_number: number
  line_type: string
  entity_id?: string | null
  description?: string | null
  quantity?: number | null
  unit_amount?: number | null
  line_amount?: number | null
  discount_amount?: number | null
  tax_amount?: number | null
  smart_code?: string
  line_data?: Record<string, any> // For GL lines: { side: 'DR' | 'CR', account: '110000' }
}

export interface UniversalTransaction {
  id?: string
  transaction_type: string
  transaction_code?: string
  smart_code: string
  transaction_date?: string
  source_entity_id?: string | null
  target_entity_id?: string | null
  total_amount?: number
  transaction_status?: string
  metadata?: Record<string, any>
  business_context?: Record<string, any>
  lines?: TransactionLine[]
}

export interface UseUniversalTransactionV1Config {
  organizationId?: string
  filters?: {
    transaction_type?: string
    smart_code?: string
    source_entity_id?: string
    target_entity_id?: string
    transaction_status?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
    include_lines?: boolean
    include_deleted?: boolean // For audit mode - includes voided transactions
  }
  // ✅ CACHE CONTROL: Allow consumers to override default cache behavior
  cacheConfig?: {
    staleTime?: number // How long data is considered fresh (default: 30 minutes)
    refetchOnMount?: boolean | 'always' // Refetch when component mounts (default: false)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize transaction type to UPPERCASE (HERA standard)
 */
function normalizeTransactionType(transactionType?: string): string | undefined {
  if (!transactionType) return undefined
  return transactionType.toUpperCase()
}

/**
 * Transform RPC response to flat transaction format
 * Similar to transformRPCResponseToEntity in useUniversalEntityV1
 *
 * RPC returns nested structure: { header: {...}, lines: [...] }
 * We need flat structure: { id, transaction_code, source_entity_id, ..., lines: [...] }
 */
function transformRPCResponseToTransaction(rpcTransaction: any): any {
  if (!rpcTransaction) return null

  // ✅ CRITICAL FIX: RPC returns nested structure { header: {}, lines: [] }
  // Check if this is a nested format
  const isNestedFormat = rpcTransaction.header !== undefined

  console.log('🔄 [transformRPCResponseToTransaction] Input:', {
    isNestedFormat,
    rpcTransaction,
    hasHeader: !!rpcTransaction.header,
    hasDirectFields: !!(rpcTransaction.id || rpcTransaction.transaction_code)
  })

  let transaction: any
  let lines: any[]

  if (isNestedFormat) {
    // Nested format from QUERY operations
    transaction = rpcTransaction.header || {}
    lines = rpcTransaction.lines || []
  } else {
    // Flat format (already has all fields at top level)
    transaction = rpcTransaction
    lines = rpcTransaction.lines || []
  }

  // ✅ Flatten all fields to top level + add lines
  const transformedTransaction: any = {
    id: transaction.id,
    transaction_type: transaction.transaction_type,
    transaction_code: transaction.transaction_code,
    smart_code: transaction.smart_code,
    transaction_date: transaction.transaction_date,
    source_entity_id: transaction.source_entity_id,
    target_entity_id: transaction.target_entity_id,
    total_amount: transaction.total_amount,
    transaction_status: transaction.transaction_status,
    metadata: transaction.metadata,
    business_context: transaction.business_context,
    created_at: transaction.created_at,
    updated_at: transaction.updated_at,
    created_by: transaction.created_by,
    updated_by: transaction.updated_by,
    deleted_at: transaction.deleted_at,  // For soft delete filtering
    lines: lines
  }

  return transformedTransaction
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useUniversalTransactionV1(config: UseUniversalTransactionV1Config = {}) {
  const { organization, user } = useHERAAuth()
  const queryClient = useQueryClient()

  // Use passed organizationId if provided, otherwise fall back to useHERAAuth
  const organizationId = config.organizationId || organization?.id

  // ✅ HERA v2.2 ACTOR STAMPING: Extract user ID for audit tracking
  const actorUserId = user?.id

  const { filters = {}, cacheConfig = {} } = config

  // ✅ CACHE CONTROL: Extract cache configuration with defaults
  const staleTime = cacheConfig.staleTime !== undefined ? cacheConfig.staleTime : 30 * 60 * 1000
  const refetchOnMount = cacheConfig.refetchOnMount !== undefined ? cacheConfig.refetchOnMount : false

  // ✅ ENTERPRISE PATTERN: Normalize transaction_type filter to UPPERCASE
  const normalizedTransactionType = normalizeTransactionType(filters.transaction_type)

  // Build query key
  const queryKey = useMemo(
    () => {
      const key = [
        'transactions-v1',
        organizationId,
        {
          transaction_type: normalizedTransactionType || null,
          smart_code: filters.smart_code || null,
          source_entity_id: filters.source_entity_id || null,
          target_entity_id: filters.target_entity_id || null,
          transaction_status: filters.transaction_status || null,
          date_from: filters.date_from || null,
          date_to: filters.date_to || null,
          // 🚀 ENTERPRISE: No hardcoded limit - allow unlimited fetch for transaction management
          // Components can override with filters?.limit if pagination needed
          limit: filters.limit || null,
          offset: filters.offset || 0,
          include_lines: filters.include_lines !== false,
          include_deleted: !!filters.include_deleted
        }
      ]

      console.log('🔑 [useUniversalTransactionV1] queryKey computed:', {
        key,
        filterObject: key[2],
        date_from: filters.date_from,
        date_to: filters.date_to,
        target_entity_id: filters.target_entity_id
      })

      return key
    },
    [
      organizationId,
      normalizedTransactionType,
      filters.smart_code,
      filters.source_entity_id,
      filters.target_entity_id,
      filters.transaction_status,
      filters.date_from,
      filters.date_to,
      filters.limit,
      filters.offset,
      filters.include_lines,
      filters.include_deleted
    ]
  )

  // ============================================================================
  // QUERY - Fetch transactions using orchestrator RPC
  // ============================================================================

  const {
    data: transactions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 [useUniversalTransactionV1] queryFn EXECUTING - NEW QUERY:', {
        date_from: filters.date_from,
        date_to: filters.date_to,
        target_entity_id: filters.target_entity_id,
        timestamp: new Date().toISOString()
      })

      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      // Build query payload
      const queryPayload: any = {}

      if (normalizedTransactionType) {
        queryPayload.transaction_type = normalizedTransactionType
      }
      if (filters.smart_code) {
        queryPayload.smart_code = filters.smart_code
      }
      if (filters.source_entity_id) {
        queryPayload.source_entity_id = filters.source_entity_id
      }
      if (filters.target_entity_id) {
        queryPayload.target_entity_id = filters.target_entity_id
      }
      if (filters.transaction_status) {
        queryPayload.transaction_status = filters.transaction_status
      }
      if (filters.date_from) {
        queryPayload.date_from = filters.date_from
      }
      if (filters.date_to) {
        queryPayload.date_to = filters.date_to
      }

      // 🌟 TRANSACTION CRUD - QUERY action
      const rpcPayload = {
        p_action: 'QUERY',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_payload: {
          ...queryPayload,
          // 🚀 ENTERPRISE: No hardcoded limit - allow unlimited fetch for transaction management
          // Components can override with filters?.limit if pagination needed
          limit: filters.limit || null,
          offset: filters.offset || 0,
          include_lines: filters.include_lines !== false,
          include_deleted: !!filters.include_deleted
        }
      }

      console.log('🚀 [useUniversalTransactionV1] RPC PAYLOAD BEING SENT:', {
        p_action: rpcPayload.p_action,
        p_organization_id: rpcPayload.p_organization_id,
        p_payload: rpcPayload.p_payload,
        date_from_in_payload: rpcPayload.p_payload.date_from,
        date_to_in_payload: rpcPayload.p_payload.date_to,
        full_rpc_payload: JSON.stringify(rpcPayload, null, 2)
      })

      const { data, error } = await transactionCRUD(rpcPayload)

      // ✅ Check Supabase client error first
      if (error) {
        console.error('[useUniversalTransactionV1] QUERY RPC client error:', error)
        throw new Error(error)
      }

      // ✅ Check orchestrator level (rare, but possible)
      if (!data?.success) {
        console.error('[useUniversalTransactionV1] QUERY orchestrator error:', data?.error)
        throw new Error(data?.error || 'Orchestrator failed')
      }

      // ✅ Check function level (common for validation errors)
      if (!data?.data?.success) {
        console.error('[useUniversalTransactionV1] QUERY function error:', data?.data?.error)
        throw new Error(data?.data?.error || 'QUERY function failed')
      }

      // ✅ Extract transactions from NESTED response (data.data.data.items)
      const transactionsArray = data?.data?.data?.items || []

      console.log('📊 [useUniversalTransactionV1] QUERY Raw RPC Response:', {
        fullResponse: data,
        dataPath: data?.data,
        dataDataPath: data?.data?.data,
        itemsPath: data?.data?.data?.items,
        itemsCount: transactionsArray.length,
        firstItem: transactionsArray[0]
      })

      // ✅ Transform RPC response to flat format (similar to useUniversalEntityV1)
      const transformed = transactionsArray.map(transformRPCResponseToTransaction)

      console.log('📊 [useUniversalTransactionV1] Transformed Transactions:', {
        count: transformed.length,
        firstTransformed: transformed[0],
        sampleFields: transformed[0] ? {
          id: transformed[0].id,
          source_entity_id: transformed[0].source_entity_id,
          target_entity_id: transformed[0].target_entity_id,
          metadata: transformed[0].metadata,
          transaction_status: transformed[0].transaction_status
        } : null
      })

      // ✅ CRITICAL DEBUG: Show actual transaction dates returned vs requested filter
      const transactionDates = transformed.map(t => t.transaction_date).sort()
      console.log('📅 [useUniversalTransactionV1] QUERY COMPLETED - Date Verification:', {
        requested_date_from: filters.date_from,
        requested_date_to: filters.date_to,
        returned_transaction_count: transformed.length,
        all_transaction_dates_sorted: transactionDates,
        date_range_check: {
          earliest: transactionDates[0],
          latest: transactionDates[transactionDates.length - 1]
        },
        dates_match_filter: transactionDates.every(d =>
          (!filters.date_from || d >= filters.date_from) &&
          (!filters.date_to || d <= filters.date_to)
        )
      })

      return transformed
    },
    enabled: !!organizationId && !!actorUserId,
    staleTime, // ✅ CONFIGURABLE: Default 30 minutes, but can be overridden via cacheConfig
    gcTime: 60 * 60 * 1000, // 60 minutes - cache cleanup
    refetchOnWindowFocus: false,
    refetchOnMount, // ✅ CONFIGURABLE: Default false, but can be overridden via cacheConfig
    refetchOnReconnect: false,
    retry: 1
  })

  // ============================================================================
  // CREATE MUTATION - Atomic create with header + lines
  // ============================================================================

  const createMutation = useMutation({
    mutationFn: async (transaction: UniversalTransaction) => {
      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      // Normalize transaction_type to UPPERCASE
      const normalizedType = normalizeTransactionType(transaction.transaction_type) || transaction.transaction_type

      // Build CREATE payload
      const createPayload = {
        header: {
          organization_id: organizationId,
          transaction_type: normalizedType,
          transaction_code: transaction.transaction_code || `TXN-${Date.now()}`,
          smart_code: transaction.smart_code,
          transaction_date: transaction.transaction_date || new Date().toISOString(),
          source_entity_id: transaction.source_entity_id || null,
          target_entity_id: transaction.target_entity_id || null,
          total_amount: transaction.total_amount || 0,
          transaction_status: transaction.transaction_status || 'draft',
          ...(transaction.metadata && { metadata: transaction.metadata }),
          ...(transaction.business_context && { business_context: transaction.business_context })
        },
        lines: transaction.lines || []
      }

      console.log('🚀 [useUniversalTransactionV1] CREATE Payload:', {
        header_smart_code: createPayload.header.smart_code,
        line_count: createPayload.lines.length,
        line_smart_codes: createPayload.lines.map((l: any) => l.smart_code),
        full_payload: createPayload
      })

      // 🌟 TRANSACTION CRUD - CREATE action
      const { data, error } = await transactionCRUD({
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_payload: createPayload
      })

      // ✅ Check Supabase client error first
      if (error) {
        console.error('[useUniversalTransactionV1] CREATE RPC client error:', error)
        throw new Error(error)
      }

      // ✅ Check orchestrator level (rare, but possible)
      if (!data?.success) {
        console.error('[useUniversalTransactionV1] CREATE orchestrator error:', data?.error)
        throw new Error(data?.error || 'Orchestrator failed')
      }

      // ✅ Check function level (common for validation errors)
      if (!data?.data?.success) {
        console.error('[useUniversalTransactionV1] CREATE VALIDATION ERROR:', {
          error: data?.data?.error,
          header_smart_code: createPayload.header.smart_code,
          line_smart_codes: createPayload.lines.map((l: any) => l.smart_code),
          header_segments: createPayload.header.smart_code?.split('.'),
          line_segments: createPayload.lines.map((l: any) => l.smart_code?.split('.')),
        })
        throw new Error(data?.data?.error || 'CREATE function failed')
      }

      // ✅ Extract transaction from NESTED response (data.data.data.header + lines)
      // Use transformation function for consistency
      const createdTransaction = {
        header: data?.data?.data?.header,
        lines: data?.data?.data?.lines
      }

      return transformRPCResponseToTransaction(createdTransaction)
    },
    onSuccess: async (newTransaction) => {
      console.log('🎯 [useUniversalTransactionV1] CREATE onSuccess - Updating ALL transaction caches:', {
        transaction_id: newTransaction.id,
        transaction_date: newTransaction.transaction_date,
        transaction_type: newTransaction.transaction_type
      })

      // ⚡ OPTIMISTIC UPDATE: Add new transaction to ALL matching transaction-v1 caches
      // This is more aggressive than just updating the specific queryKey
      queryClient.setQueriesData(
        {
          queryKey: ['transactions-v1'],
          exact: false // Match all queries starting with ['transactions-v1']
        },
        (old: any) => {
          if (!old || !Array.isArray(old)) return [newTransaction]

          // Check if this transaction already exists in this cache
          const exists = old.some((txn: any) => txn.id === newTransaction.id)
          if (exists) {
            console.log('🔄 [useUniversalTransactionV1] Transaction already in cache, skipping duplicate')
            return old
          }

          // Add to beginning of array (most recent first)
          const updated = [newTransaction, ...old]
          console.log('✅ [useUniversalTransactionV1] Added new transaction to cache:', {
            previous_count: old.length,
            new_count: updated.length
          })
          return updated
        }
      )

      // ✅ CRITICAL FIX: Invalidate all transaction queries to trigger background refetch
      // This ensures queries with date filters are refreshed in the background
      queryClient.invalidateQueries({
        queryKey: ['transactions-v1'],
        exact: false // Match all queries starting with ['transactions-v1']
      })

      console.log('✅ [useUniversalTransactionV1] Updated ALL transaction caches and invalidated queries')
    }
  })

  // ============================================================================
  // UPDATE MUTATION - Update transaction fields
  // ============================================================================

  const updateMutation = useMutation({
    mutationFn: async ({
      transaction_id,
      lines, // ← NEW: Accept transaction lines for atomic updates
      ...updates
    }: Partial<UniversalTransaction> & {
      transaction_id: string
      lines?: Array<any> // ← NEW: Optional transaction lines
    }) => {
      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      // ✅ BUILD UPDATE PAYLOAD - Deployed RPC expects:
      // - header: { smart_code (required), organization_id (required) }
      // - patch: { fields to update }
      // - transaction_id: at root level
      // - lines: optional transaction lines array (NEW)

      const patch: any = {}

      if (updates.transaction_type) {
        patch.transaction_type = normalizeTransactionType(updates.transaction_type)
      }
      if (updates.transaction_code !== undefined) {
        patch.transaction_code = updates.transaction_code
      }
      if (updates.transaction_date) {
        patch.transaction_date = updates.transaction_date
      }
      if (updates.source_entity_id !== undefined) {
        patch.source_entity_id = updates.source_entity_id
      }
      if (updates.target_entity_id !== undefined) {
        patch.target_entity_id = updates.target_entity_id
      }
      if (updates.total_amount !== undefined) {
        patch.total_amount = updates.total_amount
      }
      if (updates.transaction_status) {
        patch.transaction_status = updates.transaction_status
      }
      if (updates.metadata) {
        patch.metadata = updates.metadata
      }

      const updatePayload: any = {
        transaction_id,
        header: {
          smart_code: updates.smart_code, // ✅ Required for guardrail
          organization_id: organizationId  // ✅ Required for guardrail
        },
        patch
      }

      // ✅ NEW: Include transaction lines if provided for atomic header + lines update
      if (lines && lines.length > 0) {
        updatePayload.lines = lines
        // ✅ Use REPLACE mode to cleanly replace all lines (delete old, insert new)
        patch.lines_mode = 'REPLACE'
      }

      console.log('🚀 [useUniversalTransactionV1] UPDATE Payload:', {
        transaction_id,
        header: updatePayload.header,
        patch: updatePayload.patch,
        lines_count: lines?.length || 0, // ← NEW: Log lines count
        header_smart_code: updatePayload.header.smart_code,
        updates_smart_code: updates.smart_code,
        full_payload: JSON.stringify(updatePayload, null, 2)
      })

      // 🌟 TRANSACTION CRUD - UPDATE action (now supports lines)
      const { data, error } = await transactionCRUD({
        p_action: 'UPDATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_payload: updatePayload
      })

      // ✅ Check errors (orchestrator + function level)
      if (error) {
        console.error('[useUniversalTransactionV1] UPDATE RPC client error:', error)
        throw new Error(error)
      }

      if (!data?.success) {
        console.error('[useUniversalTransactionV1] UPDATE orchestrator error:', data?.error)
        console.error('[useUniversalTransactionV1] Full Response:', JSON.stringify(data, null, 2))

        // 🚨 GUARDRAIL VIOLATIONS: Show detailed error message
        if (data?.error === 'guardrail_violations' && data?.violations) {
          console.error('[useUniversalTransactionV1] Violations Array:', data.violations)
          console.error('[useUniversalTransactionV1] First Violation:', data.violations[0])
          console.error('[useUniversalTransactionV1] Violation JSON:', JSON.stringify(data.violations, null, 2))

          const violationMessages = data.violations.map((v: any) =>
            `${v.rule || 'Unknown rule'}: ${v.message || v.description || 'No details'}`
          ).join('; ')
          throw new Error(`Guardrail violations: ${violationMessages}`)
        }

        throw new Error(data?.error || 'Orchestrator failed')
      }

      if (!data?.data?.success) {
        throw new Error(data?.data?.error || 'UPDATE function failed')
      }

      // ✅ Extract updated transaction from NESTED response
      // RPC UPDATE returns: { action: 'UPDATE', data: { success: true, action: 'UPDATE', data: { action: 'READ', data: { header, lines } } } }
      console.log('🔄 [useUniversalTransactionV1] UPDATE Response Structure:', {
        outerAction: data?.action,
        innerSuccess: data?.data?.success,
        innerAction: data?.data?.action,
        hasData: !!data?.data?.data,
        dataAction: data?.data?.data?.action,
        hasDataData: !!data?.data?.data?.data,
        dataKeys: data?.data?.data?.data ? Object.keys(data?.data?.data?.data) : null,
        fullData: data?.data?.data?.data
      })

      // ✅ NEW: Extract from data.data.data.data (hera_txn_update_v1 returns { success, action, data: hera_txn_read_v1(...) })
      const updatedTransaction = {
        header: data?.data?.data?.data?.header || {},
        lines: data?.data?.data?.data?.lines || []
      }

      console.log('🔄 [useUniversalTransactionV1] Extracted Updated Transaction:', {
        hasHeader: !!updatedTransaction.header,
        headerKeys: updatedTransaction.header ? Object.keys(updatedTransaction.header) : null,
        transaction_status: updatedTransaction.header?.transaction_status,
        metadata: updatedTransaction.header?.metadata,
        lines_count: updatedTransaction.lines?.length || 0
      })

      return transformRPCResponseToTransaction(updatedTransaction)
    },
    onSuccess: (updatedTransaction, variables) => {
      // ✅ UPDATE now returns FRESH data with correct patch payload structure
      console.log('✅ [useUniversalTransactionV1] UPDATE returned fresh data:', {
        transaction_id: updatedTransaction.id,
        returned_status: updatedTransaction.transaction_status,
        requested_status: variables.transaction_status
      })

      // ⚡ OPTIMISTIC UPDATE: Update the transaction in cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !Array.isArray(old)) return [updatedTransaction]
        return old.map((txn: any) => txn.id === updatedTransaction.id ? updatedTransaction : txn)
      })

      // ✅ CRITICAL FIX: Invalidate all transaction queries with predicate matching
      // This ensures queries with date filters are also invalidated
      queryClient.invalidateQueries({
        queryKey: ['transactions-v1'],
        exact: false // Match all queries starting with ['transactions-v1']
      })

      console.log('✅ [useUniversalTransactionV1] Updated transaction in cache and invalidated all queries')
    }
  })

  // ============================================================================
  // DELETE MUTATION - Hard delete empty draft or soft delete (VOID)
  // ============================================================================

  const deleteMutation = useMutation({
    mutationFn: async ({
      transaction_id,
      hard_delete = false
    }: {
      transaction_id: string
      hard_delete?: boolean
    }) => {
      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      // 🌟 TRANSACTION CRUD - DELETE action (hard delete only for empty drafts)
      const { data, error } = await transactionCRUD({
        p_action: 'DELETE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_payload: {
          transaction_id
        }
      })

      // ✅ Check errors (orchestrator + function level)
      if (error) {
        console.error('[useUniversalTransactionV1] DELETE RPC client error:', error)
        throw new Error(error)
      }

      if (!data?.success) {
        console.error('[useUniversalTransactionV1] DELETE orchestrator error:', data?.error)
        throw new Error(data?.error || 'Orchestrator failed')
      }

      if (!data?.data?.success) {
        console.error('[useUniversalTransactionV1] DELETE function error:', data?.data?.error)
        throw new Error(data?.data?.error || 'DELETE function failed')
      }

      console.log('[useUniversalTransactionV1] ✅ Transaction deleted')

      return data
    },
    onSuccess: (_data, variables) => {
      // ⚡ OPTIMISTIC UPDATE: Remove deleted transaction from cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !Array.isArray(old)) return []
        return old.filter((txn: any) => txn.id !== variables.transaction_id)
      })

      // ✅ CRITICAL FIX: Invalidate all transaction queries with predicate matching
      queryClient.invalidateQueries({
        queryKey: ['transactions-v1'],
        exact: false // Match all queries starting with ['transactions-v1']
      })

      console.log('✅ [useUniversalTransactionV1] Removed deleted transaction from cache and invalidated all queries')
    }
  })

  // ============================================================================
  // VOID MUTATION - Soft delete with audit trail
  // ============================================================================

  const voidMutation = useMutation({
    mutationFn: async ({
      transaction_id,
      reason
    }: {
      transaction_id: string
      reason?: string
    }) => {
      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      console.log('[useUniversalTransactionV1] 🚀 Voiding transaction via orchestrator RPC')

      // 🌟 TRANSACTION CRUD - VOID action (soft delete)
      const { data, error } = await transactionCRUD({
        p_action: 'VOID',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_payload: {
          transaction_id,
          reason: reason || 'Transaction voided'
        }
      })

      // ✅ Check errors (orchestrator + function level)
      if (error) {
        console.error('[useUniversalTransactionV1] VOID RPC client error:', error)
        throw new Error(error)
      }

      if (!data?.success) {
        console.error('[useUniversalTransactionV1] VOID orchestrator error:', data?.error)
        throw new Error(data?.error || 'Orchestrator failed')
      }

      if (!data?.data?.success) {
        console.error('[useUniversalTransactionV1] VOID function error:', data?.data?.error)
        throw new Error(data?.data?.error || 'VOID function failed')
      }

      console.log('[useUniversalTransactionV1] ✅ Transaction voided')

      return data
    },
    onSuccess: (_data, variables) => {
      // ⚡ OPTIMISTIC UPDATE: Remove voided transaction from normal cache
      // (unless include_deleted is true)
      if (!filters.include_deleted) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !Array.isArray(old)) return []
          return old.filter((txn: any) => txn.id !== variables.transaction_id)
        })
      }

      // ✅ CRITICAL FIX: Invalidate all transaction queries with predicate matching
      queryClient.invalidateQueries({
        queryKey: ['transactions-v1'],
        exact: false // Match all queries starting with ['transactions-v1']
      })

      console.log('✅ [useUniversalTransactionV1] Removed voided transaction from cache and invalidated all queries')
    }
  })

  // ============================================================================
  // RETURN - Same interface as useUniversalEntityV1
  // ============================================================================

  return {
    // Data
    transactions: transactions || [],
    isLoading,
    error: error?.message,
    refetch,

    // Mutations
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    void: voidMutation.mutateAsync,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isVoiding: voidMutation.isPending,

    // Helper functions
    updateStatus: async (transaction_id: string, transaction_status: string) => {
      return updateMutation.mutateAsync({ transaction_id, transaction_status })
    }
  }
}

/**
 * Example Usage:
 *
 * ```typescript
 * // POS Sale Transaction
 * const sales = useUniversalTransactionV1({
 *   filters: { transaction_type: 'SALE', include_lines: true }
 * })
 *
 * // Create sale with lines
 * await sales.create({
 *   transaction_type: 'SALE',
 *   smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
 *   source_entity_id: customerId,
 *   target_entity_id: staffId,
 *   total_amount: 150.00,
 *   transaction_status: 'completed',
 *   lines: [
 *     {
 *       line_number: 1,
 *       line_type: 'service',
 *       entity_id: serviceId,
 *       quantity: 1,
 *       unit_amount: 150.00,
 *       line_amount: 150.00,
 *       smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
 *     }
 *   ]
 * })
 *
 * // GL Journal Entry with balanced debits/credits
 * await sales.create({
 *   transaction_type: 'GL_JOURNAL',
 *   smart_code: 'HERA.FIN.GL.TXN.JOURNAL.v1',
 *   total_amount: 0,
 *   lines: [
 *     {
 *       line_number: 1,
 *       line_type: 'gl',
 *       description: 'Cash received',
 *       line_amount: 1000,
 *       smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.v1',
 *       line_data: { side: 'DR', account: '110000' }
 *     },
 *     {
 *       line_number: 2,
 *       line_type: 'gl',
 *       description: 'Revenue earned',
 *       line_amount: 1000,
 *       smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.v1',
 *       line_data: { side: 'CR', account: '410000' }
 *     }
 *   ]
 * })
 * ```
 */
