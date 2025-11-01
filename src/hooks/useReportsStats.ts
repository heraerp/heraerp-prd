// ================================================================================
// REPORTS STATS HOOK
// Smart Code: HERA.HOOK.REPORTS.STATS.v2
// Fetches real-time dashboard statistics for reports page
// ✅ UPDATED: Uses useUniversalEntityV1 and useUniversalTransactionV1 hooks
// ✅ UPDATED: Uses hera_entities_crud_v1 and hera_txn_crud_v1 orchestrator RPCs
// ✅ ALIGNED: Uses GL_JOURNAL transactions with metadata.total_cr (matches sales reports)
// ================================================================================

'use client'

import { useMemo } from 'react'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

/**
 * ✅ ALIGNED WITH SALES REPORTS: Extract gross revenue from GL_JOURNAL metadata
 * Uses same calculation method as /salon/reports/sales for consistency
 * Reads from metadata.total_cr (total credit = gross revenue)
 */
function extractGrossRevenue(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // total_cr = Total credit (gross revenue including VAT and tips)
      total += txn.metadata.total_cr || 0
    }
  })

  return total
}

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
 * - ✅ ALIGNED: Uses GL_JOURNAL with metadata.total_cr (matches /salon/reports/sales)
 * - ✅ Month filtering for "This month" revenue display
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

  // ✅ ALIGNED WITH SALES REPORTS: Fetch GL_JOURNAL for revenue (same as /salon/reports/sales)
  // This ensures dashboard revenue matches sales reports page exactly
  const {
    transactions: glJournalTransactions,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'GL_JOURNAL',
      smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
      limit: 10000,
      include_lines: true // Need lines for GL validation
    },
    // Disable caching to ensure fresh data
    cacheConfig: {
      staleTime: 0,
      refetchOnMount: 'always'
    }
  })

  // ✅ Calculate stats from data
  const stats = useMemo<ReportStats>(() => {
    const totalCustomers = customers?.length || 0

    // ✅ ALIGNED WITH SALES REPORTS: Filter for current month
    // This matches the "This month" label shown on the reports page
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // ✅ FIX: Filter appointments by transaction_date for current month
    const currentMonthAppointments = (appointments || []).filter(appt => {
      if (!appt.transaction_date) return false
      const apptDate = parseISO(appt.transaction_date)
      return apptDate >= monthStart && apptDate <= monthEnd
    })
    const totalAppointments = currentMonthAppointments.length

    // ✅ ALIGNED WITH SALES REPORTS: Filter GL_JOURNAL for current month
    const currentMonthTransactions = (glJournalTransactions || []).filter(t => {
      const txDate = parseISO(t.transaction_date)
      return txDate >= monthStart && txDate <= monthEnd
    })

    // ✅ ALIGNED WITH SALES REPORTS: Revenue from GL_JOURNAL metadata.total_cr
    // Uses same calculation as /salon/reports/sales for consistency
    const totalRevenue = extractGrossRevenue(currentMonthTransactions)

    // Calculate average ticket (revenue / number of GL transactions)
    const totalSalesCount = currentMonthTransactions.length
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
      totalCustomers,
      totalAppointments,
      averageTicket: Math.round(averageTicket * 100) / 100 // Round to 2 decimals
    }
  }, [customers, appointments, glJournalTransactions])

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
