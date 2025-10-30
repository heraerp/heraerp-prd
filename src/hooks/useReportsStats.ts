// ================================================================================
// REPORTS STATS HOOK
// Smart Code: HERA.HOOK.REPORTS.STATS.v2
// Fetches real-time dashboard statistics for reports page
// ✅ UPDATED: Uses useUniversalEntityV1 and useUniversalTransactionV1 hooks
// ✅ UPDATED: Uses hera_entities_crud_v1 and hera_txn_crud_v1 orchestrator RPCs
// ================================================================================

'use client'

import { useMemo } from 'react'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'

// ============================================================================
// TYPES
// ============================================================================

export interface ReportStats {
  totalRevenue: number
  totalCustomers: number
  totalAppointments: number
  averageTicket: number
}

export interface UseReportsStatsOptions {
  /** Organization ID for multi-tenant filtering */
  organizationId?: string
}

export interface UseReportsStatsReturn {
  /** Current statistics */
  stats: ReportStats
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: string | undefined
  /** Manual refetch function */
  refetch: () => Promise<void>
}

// ============================================================================
// HOOK: useReportsStats
// ============================================================================

/**
 * Fetches real-time dashboard statistics for reports page
 *
 * Features:
 * - ✅ Uses useUniversalEntityV1 for customer count
 * - ✅ Uses useUniversalTransactionV1 for appointments and revenue
 * - ✅ Orchestrator RPC pattern (hera_entities_crud_v1, hera_txn_crud_v1)
 * - ✅ React Query caching and automatic refetch
 * - ✅ Combined loading states
 *
 * @example
 * const { stats, isLoading, refetch } = useReportsStats({
 *   organizationId: '123'
 * })
 */
export function useReportsStats(
  options: UseReportsStatsOptions = {}
): UseReportsStatsReturn {
  const { organizationId } = options

  // ✅ Fetch customers using useUniversalEntityV1 (orchestrator RPC)
  const {
    entities: customers,
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER', // Entity type at top level
    organizationId,
    filters: {
      status: 'active', // Only count active customers
      limit: 10000, // High limit to get all customers
      list_mode: 'HEADERS' // Only need count, not full data
    }
  })

  // ✅ Fetch appointments using useUniversalTransactionV1 (orchestrator RPC)
  const {
    transactions: appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'APPOINTMENT',
      limit: 10000, // High limit to get all appointments
      include_lines: false // Only need headers for stats
    }
  })

  // ✅ Fetch sales transactions for revenue calculation
  const {
    transactions: sales,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'SALE',
      limit: 10000,
      include_lines: false
    }
  })

  // ✅ Calculate stats from data
  const stats = useMemo<ReportStats>(() => {
    const totalCustomers = customers?.length || 0
    const totalAppointments = appointments?.length || 0
    const totalSalesCount = sales?.length || 0

    // Calculate total revenue from sales transactions
    const totalRevenue = sales?.reduce((sum, sale) => {
      return sum + (sale.total_amount || 0)
    }, 0) || 0

    // Calculate average ticket (revenue / number of sales transactions)
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
      totalCustomers,
      totalAppointments,
      averageTicket: Math.round(averageTicket * 100) / 100 // Round to 2 decimals
    }
  }, [customers, appointments, sales])

  // ✅ Combined loading state
  const isLoading = customersLoading || appointmentsLoading || salesLoading

  // ✅ Combined error state (show first error encountered)
  const error = customersError || appointmentsError || salesError

  // ✅ Refetch all data
  const refetch = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchAppointments(),
      refetchSales()
    ])
  }

  return {
    stats,
    isLoading,
    error,
    refetch
  }
}
