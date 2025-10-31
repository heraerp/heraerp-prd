/**
 * HERA Receptionist Dashboard Hook V1
 * Smart Code: HERA.SALON.RECEPTIONIST.DASHBOARD.HOOK.v1
 *
 * ✅ UPGRADED: Uses useUniversalEntityV1 and useUniversalTransactionV1
 * ⚡ 100% RPC-based with zero direct Supabase queries
 * 🛡️ Full HERA V1 compliance (orchestrator RPC pattern)
 *
 * Receptionist-focused analytics:
 * - Today's appointments overview
 * - Quick action metrics
 * - Simple customer counting
 * - Appointment status tracking
 * - Basic revenue visibility
 */

'use client'

import { useMemo } from 'react'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import {
  startOfDay,
  endOfDay,
  parseISO
} from 'date-fns'

/**
 * ✅ ALIGNED WITH REPORTS: Extract gross revenue from GL_JOURNAL metadata
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

export interface AppointmentByStatus {
  completed: number
  in_progress: number
  pending: number
  cancelled: number
  no_show: number
}

export interface ReceptionistDashboardKPIs {
  // Today's metrics
  todayAppointments: number
  todayRevenue: number

  // Appointment breakdown
  appointmentsByStatus: AppointmentByStatus

  // Customer counting
  totalCustomers: number

  // Quick stats
  activeServices: number
  activeStaff: number
}

export interface UseReceptionistDashboardConfig {
  organizationId: string
  currency?: string
}

/**
 * Simplified hook for receptionist dashboard data
 * Uses useUniversalEntityV1 and useUniversalTransactionV1
 * All data fetched via RPC functions - zero direct Supabase queries
 */
export function useReceptionistDashboard(config: UseReceptionistDashboardConfig) {
  const { organizationId, currency = 'AED' } = config

  // Fetch customers using Universal Entity V1 hook (RPC-based)
  const {
    entities: customers,
    isLoading: customersLoading,
    refetch: refetchCustomers
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER',
    organizationId,
    filters: {
      include_dynamic: false, // Fast load - headers only
      include_relationships: false,
      list_mode: 'HEADERS' // Performance optimization
    }
  })

  // Fetch services using Universal Entity V1 hook (RPC-based)
  // ✅ FIXED: include_dynamic=true to load price_market and duration_min for appointment modal
  const {
    entities: services,
    isLoading: servicesLoading,
    refetch: refetchServices
  } = useUniversalEntityV1({
    entity_type: 'SERVICE',
    organizationId,
    filters: {
      include_dynamic: true, // ✅ REQUIRED for AppointmentModal to display service prices
      include_relationships: false,
      list_mode: 'FULL' // ✅ REQUIRED to get dynamic data
    }
  })

  // Fetch staff using Universal Entity V1 hook (RPC-based)
  const {
    entities: staff,
    isLoading: staffLoading,
    refetch: refetchStaff
  } = useUniversalEntityV1({
    entity_type: 'STAFF',
    organizationId,
    filters: {
      include_dynamic: false,
      include_relationships: false,
      list_mode: 'HEADERS'
    }
  })

  // Fetch appointments using Universal Transaction V1 hook (RPC-based)
  const {
    transactions: appointments,
    isLoading: appointmentsLoading,
    refetch: refetchAppointments
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'APPOINTMENT',
      limit: 1000,
      include_lines: false // Receptionists don't need line details
    }
  })

  // ✅ ALIGNED WITH REPORTS: Fetch GL_JOURNAL for revenue (same as /salon/reports/sales)
  // This ensures dashboard revenue matches reports page exactly
  const {
    transactions: glJournalTransactions,
    isLoading: salesLoading,
    refetch: refetchSales
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'GL_JOURNAL',
      smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
      limit: 1000,
      include_lines: true // Need lines for GL validation
    },
    // Disable caching to ensure fresh data
    cacheConfig: {
      staleTime: 0,
      refetchOnMount: 'always'
    }
  })

  // Calculate receptionist-focused KPIs
  const kpis: ReceptionistDashboardKPIs = useMemo(() => {
    if (!appointments || !customers || !services || !staff || !glJournalTransactions) {
      return {
        todayAppointments: 0,
        todayRevenue: 0,
        appointmentsByStatus: {
          completed: 0,
          in_progress: 0,
          pending: 0,
          cancelled: 0,
          no_show: 0
        },
        totalCustomers: 0,
        activeServices: 0,
        activeStaff: 0
      }
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    // Filter active entities
    const activeCustomers = customers?.filter(c => c.status !== 'archived' && c.status !== 'deleted') || []
    const activeServices = services?.filter(s => s.status === 'active' || !s.status) || []
    const activeStaff = staff?.filter(s => s.status === 'active' || !s.status) || []

    // Today's appointments
    const todayAppointments = (appointments || []).filter(apt => {
      const aptDate = parseISO(apt.transaction_date || apt.created_at)
      return aptDate >= todayStart && aptDate <= todayEnd
    })

    // Appointment status breakdown (today's appointments)
    const appointmentsByStatus: AppointmentByStatus = todayAppointments.reduce(
      (acc, apt) => {
        const status = apt.transaction_status?.toLowerCase() || apt.metadata?.status?.toLowerCase()

        if (status === 'completed') acc.completed++
        else if (status === 'in_progress' || status === 'in_service') acc.in_progress++
        else if (status === 'booked' || status === 'checked_in' || status === 'pending' || status === 'scheduled') acc.pending++
        else if (status === 'cancelled') acc.cancelled++
        else if (status === 'no_show') acc.no_show++
        else acc.pending++ // Default to pending

        return acc
      },
      { completed: 0, in_progress: 0, pending: 0, cancelled: 0, no_show: 0 }
    )

    // ✅ ALIGNED WITH REPORTS: Today's revenue from GL_JOURNAL transactions
    // Uses same calculation as /salon/reports/sales for consistency
    const todayGlTransactions = (glJournalTransactions || []).filter(t => {
      const txDate = parseISO(t.transaction_date)
      return txDate >= todayStart && txDate <= todayEnd
    })

    const todayRevenue = extractGrossRevenue(todayGlTransactions)

    return {
      todayAppointments: todayAppointments.length,
      todayRevenue,
      appointmentsByStatus,
      totalCustomers: activeCustomers.length,
      activeServices: activeServices.length,
      activeStaff: activeStaff.length
    }
  }, [customers, services, staff, appointments, glJournalTransactions])

  // Loading state
  const isLoading =
    customersLoading ||
    servicesLoading ||
    staffLoading ||
    appointmentsLoading ||
    salesLoading

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchServices(),
      refetchStaff(),
      refetchAppointments(),
      refetchSales()
    ])
  }

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return {
    // KPIs
    kpis,

    // Raw data (for detailed views)
    customers,
    services,
    staff,
    appointments,
    sales,

    // Loading state
    isLoading,

    // Actions
    refreshAll,
    formatCurrency,

    // Individual refetch functions
    refetchCustomers,
    refetchServices,
    refetchStaff,
    refetchAppointments,
    refetchSales
  }
}
