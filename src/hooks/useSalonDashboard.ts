/**
 * HERA Enterprise Dashboard Hook V1
 * Smart Code: HERA.SALON.DASHBOARD.ENTERPRISE.HOOK.v1
 *
 * ✅ UPGRADED: Now using useUniversalEntityV1 and useUniversalTransactionV1
 * ⚡ 100% RPC-based with zero direct Supabase queries
 * 🛡️ Full HERA V1 compliance (orchestrator RPC pattern)
 *
 * Comprehensive enterprise-grade dashboard analytics:
 * - Appointment analytics and conversion rates
 * - Revenue trends and forecasting
 * - Staff performance metrics and leaderboard
 * - Customer insights and retention
 * - Service analytics and optimization
 * - Financial metrics and profit analysis
 */

'use client'

import { useMemo } from 'react'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import {
  startOfDay,
  endOfDay,
  startOfYesterday,
  endOfYesterday,
  subDays,
  startOfMonth,
  startOfYear,
  format,
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

/**
 * ✅ ENTERPRISE HELPER: Calculate payment method breakdown for any date range
 * Load data once, calculate instantly based on filter - no reloading needed
 */
function calculatePaymentBreakdown(
  transactions: any[],
  startDate?: Date,
  endDate?: Date
): PaymentMethodBreakdown {
  // Filter transactions by date range if provided
  const filteredTransactions = (startDate && endDate)
    ? transactions.filter(t => {
        const txDate = parseISO(t.transaction_date || t.created_at)
        return txDate >= startDate && txDate <= endDate
      })
    : transactions

  // ✅ DEBUG: Log first transaction structure to verify lines are included
  if (filteredTransactions.length > 0) {
    const firstTxn = filteredTransactions[0]
    console.log('[calculatePaymentBreakdown] 🔍 DEBUG - First transaction structure:', {
      id: firstTxn.id?.substring(0, 8),
      has_lines: !!firstTxn.lines,
      lines_count: firstTxn.lines?.length || 0,
      payment_lines_count: firstTxn.lines?.filter((l: any) => l.line_type === 'payment').length || 0,
      first_payment_line: firstTxn.lines?.find((l: any) => l.line_type === 'payment'),
      transaction_metadata: firstTxn.metadata
    })
  }

  return filteredTransactions.reduce(
    (acc, t) => {
      // ✅ ENTERPRISE FIX: Handle split payments by reading from transaction lines
      const paymentLines = t.lines?.filter((line: any) => line.line_type === 'payment') || []

      if (paymentLines.length > 0) {
        // Process each payment line separately (handles split payments correctly)
        paymentLines.forEach((line: any) => {
          // ✅ FIX: Check both metadata and line_data (API returns line_data)
          const paymentMethodData = line.metadata || line.line_data || {}
          const method = (
            paymentMethodData.payment_method ||
            line.payment_method ||
            ''
          ).toLowerCase()
          const amount = Math.abs(line.line_amount || 0)

          // ✅ DEBUG: Log payment line details
          console.log('[calculatePaymentBreakdown] 💳 Payment line:', {
            line_type: line.line_type,
            method_found: method || 'NONE',
            amount,
            has_metadata: !!line.metadata,
            has_line_data: !!line.line_data,
            raw_metadata: line.metadata,
            raw_line_data: line.line_data,
            description: line.description
          })

          if (!method || method === 'cash' || method.includes('cash')) {
            acc.cash += amount
          } else if (method === 'card' || method === 'credit_card' || method === 'debit_card' || method.includes('card')) {
            acc.card += amount
          } else if (method === 'bank_transfer' || method === 'transfer' || method.includes('bank')) {
            acc.bank_transfer += amount
          } else if (method === 'voucher' || method === 'gift_card' || method.includes('voucher')) {
            acc.voucher += amount
          } else {
            acc.cash += amount // Default to cash
          }
        })
      } else {
        // Fallback: Check transaction-level metadata (current implementation)
        // ✅ FIX: Handle payment_methods array from transaction metadata
        const paymentMethods = t.metadata?.payment_methods || []
        // For GL_JOURNAL, use metadata.total_cr as the transaction amount
        const amount = t.metadata?.total_cr || 0

        if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
          // If payment_methods is an array, use the first method
          // (For split payments, we'd need line-level data which isn't available)
          const method = paymentMethods[0]?.toLowerCase() || ''

          console.log('[calculatePaymentBreakdown] 💰 Fallback - Using metadata payment_methods:', {
            payment_methods_array: paymentMethods,
            selected_method: method,
            amount
          })

          if (!method || method === 'cash' || method.includes('cash')) {
            acc.cash += amount
          } else if (method === 'card' || method === 'credit_card' || method === 'debit_card' || method.includes('card')) {
            acc.card += amount
          } else if (method === 'bank_transfer' || method === 'transfer' || method.includes('bank')) {
            acc.bank_transfer += amount
          } else if (method === 'voucher' || method === 'gift_card' || method.includes('voucher')) {
            acc.voucher += amount
          } else {
            acc.cash += amount // Default to cash
          }
        } else {
          // Legacy: Single payment_method field
          const method = (
            t.metadata?.payment_method ||
            t.payment_method ||
            t.metadata?.paymentMethod ||
            t.paymentMethod ||
            ''
          ).toLowerCase()

          console.log('[calculatePaymentBreakdown] 💰 Fallback - Using legacy payment_method:', {
            method_found: method || 'NONE',
            amount
          })

          if (!method || method === 'cash' || method.includes('cash')) {
            acc.cash += amount
          } else if (method === 'card' || method === 'credit_card' || method === 'debit_card' || method.includes('card')) {
            acc.card += amount
          } else if (method === 'bank_transfer' || method === 'transfer' || method.includes('bank')) {
            acc.bank_transfer += amount
          } else if (method === 'voucher' || method === 'gift_card' || method.includes('voucher')) {
            acc.voucher += amount
          } else {
            acc.cash += amount // Default to cash
          }
        }
      }

      return acc
    },
    { cash: 0, card: 0, bank_transfer: 0, voucher: 0 }
  )
}

/**
 * ✅ ENTERPRISE HELPER: Calculate financial metrics for any date range
 * Revenue, gross profit, profit margin, transaction count, average value
 * Load data once, calculate instantly based on filter - no reloading needed
 */
function calculateFinancialMetrics(
  transactions: any[],
  startDate?: Date,
  endDate?: Date,
  profitMarginRate: number = 0.6
): PeriodFinancialMetrics {
  // Filter transactions by date range if provided
  const filteredTransactions = (startDate && endDate)
    ? transactions.filter(t => {
        const txDate = parseISO(t.transaction_date || t.created_at)
        return txDate >= startDate && txDate <= endDate
      })
    : transactions

  // ✅ ALIGNED WITH REPORTS: Extract revenue from GL_JOURNAL metadata
  const revenue = extractGrossRevenue(filteredTransactions)
  const transactionCount = filteredTransactions.length
  const grossProfit = revenue * profitMarginRate
  const profitMargin = profitMarginRate * 100
  const averageTransactionValue = transactionCount > 0 ? revenue / transactionCount : 0

  return {
    revenue,
    grossProfit,
    profitMargin,
    transactionCount,
    averageTransactionValue
  }
}

export interface AppointmentByStatus {
  completed: number
  in_progress: number
  pending: number
  cancelled: number
  no_show: number
}

export interface StaffPerformance {
  staffId: string
  staffName: string
  revenue: number
  servicesCompleted: number
  averageRating: number
  utilizationRate: number
}

export interface ServicePerformance {
  serviceId: string
  serviceName: string
  bookings: number
  revenue: number
  averagePrice: number
  popularityRank: number
}

export interface DailyRevenue {
  date: string
  revenue: number
  appointments: number
  averageTicket: number
}

export interface PaymentMethodBreakdown {
  cash: number
  card: number
  bank_transfer: number
  voucher: number
}

export interface PaymentMethodSplitAnalysis {
  today: PaymentMethodBreakdown
  last7Days: PaymentMethodBreakdown
  last30Days: PaymentMethodBreakdown
  yearToDate: PaymentMethodBreakdown
  allTime: PaymentMethodBreakdown
}

export interface PeriodFinancialMetrics {
  revenue: number
  grossProfit: number
  profitMargin: number
  transactionCount: number
  averageTransactionValue: number
}

export interface FinancialMetricsSplitAnalysis {
  today: PeriodFinancialMetrics
  last7Days: PeriodFinancialMetrics
  last30Days: PeriodFinancialMetrics
  yearToDate: PeriodFinancialMetrics
  allTime: PeriodFinancialMetrics
}

export interface SalonDashboardKPIs {
  // Base metrics
  totalCustomers: number
  vipCustomers: number
  totalRevenue: number
  activeServices: number
  totalProducts: number
  lowStockProducts: number
  inventoryValue: number
  activeStaff: number

  // Today's metrics
  todayRevenue: number
  todayAppointments: number
  todayRevenueGrowth: number
  todayAppointmentsGrowth: number
  todayOnDutyStaff: number

  // Appointment analytics
  appointmentsByStatus: AppointmentByStatus
  appointmentConversionRate: number
  averageAppointmentValue: number
  noShowRate: number
  cancellationRate: number

  // Revenue trends
  last7DaysRevenue: DailyRevenue[]
  last30DaysRevenue: DailyRevenue[]
  monthToDateRevenue: number
  revenueVsLastMonth: number
  averageTransactionValue: number

  // Staff performance
  staffLeaderboard: StaffPerformance[]
  averageStaffUtilization: number
  totalStaffHoursToday: number

  // Customer insights
  newCustomersToday: number
  returningCustomersToday: number
  customerRetentionRate: number
  averageCustomerLifetimeValue: number
  vipCustomerActivityToday: number

  // Service analytics
  topServices: ServicePerformance[]
  leastPopularServices: ServicePerformance[]
  averageServiceDuration: number

  // Financial metrics
  grossProfit: number
  profitMargin: number
  paymentMethodBreakdown: PaymentMethodBreakdown // Deprecated: Use paymentMethodSplitAnalysis instead
  paymentMethodSplitAnalysis: PaymentMethodSplitAnalysis // ✅ ENTERPRISE: Payment method split by time periods
  financialMetricsSplitAnalysis: FinancialMetricsSplitAnalysis // ✅ ENTERPRISE: Revenue/profit metrics by time periods
}

export interface UseSalonDashboardConfig {
  organizationId: string
  currency?: string
  selectedPeriod?: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}

/**
 * Universal hook for salon dashboard data with enterprise analytics
 * ✅ UPGRADED: Uses useUniversalEntityV1 and useUniversalTransactionV1
 * All data fetched via RPC functions (hera_entities_crud_v1 / hera_txn_crud_v1)
 * Zero direct Supabase queries - 100% compliant with HERA V1 architecture
 */
export function useSalonDashboard(config: UseSalonDashboardConfig) {
  const { organizationId, currency = 'AED', selectedPeriod = 'allTime' } = config

  // Fetch customers using Universal Entity V1 hook (RPC-based)
  const {
    entities: customers,
    isLoading: customersLoading,
    refetch: refetchCustomers
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  // Fetch services using Universal Entity V1 hook (RPC-based)
  const {
    entities: services,
    isLoading: servicesLoading,
    refetch: refetchServices
  } = useUniversalEntityV1({
    entity_type: 'SERVICE',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  // Fetch products using Universal Entity V1 hook (RPC-based)
  const {
    entities: products,
    isLoading: productsLoading,
    refetch: refetchProducts
  } = useUniversalEntityV1({
    entity_type: 'PRODUCT',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
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
      include_dynamic: true,
      include_relationships: false
    }
  })

  // ✅ ALIGNED WITH REPORTS: Fetch GL_JOURNAL for revenue (same as /salon/reports/sales)
  // This ensures dashboard revenue matches reports page exactly
  const {
    transactions: tickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets
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

  // 🔍 DEBUG: Log GL_JOURNAL transaction data
  console.log('📊 [useSalonDashboard] GL_JOURNAL Transactions:', {
    transactionCount: tickets?.length || 0,
    isLoading: ticketsLoading,
    organizationId,
    firstTransaction: tickets?.[0],
    sampleMetadata: tickets?.[0]?.metadata
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
      limit: 1000
    }
  })

  // Calculate comprehensive KPIs
  const kpis: SalonDashboardKPIs = useMemo(() => {
    if (!tickets || !customers || !staff || !services || !appointments) {
      return {
        // Base metrics
        totalCustomers: 0,
        vipCustomers: 0,
        totalRevenue: 0,
        activeServices: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        inventoryValue: 0,
        activeStaff: 0,

        // Today's metrics
        todayRevenue: 0,
        todayAppointments: 0,
        todayRevenueGrowth: 0,
        todayAppointmentsGrowth: 0,
        todayOnDutyStaff: 0,

        // Appointment analytics
        appointmentsByStatus: {
          completed: 0,
          in_progress: 0,
          pending: 0,
          cancelled: 0,
          no_show: 0
        },
        appointmentConversionRate: 0,
        averageAppointmentValue: 0,
        noShowRate: 0,
        cancellationRate: 0,

        // Revenue trends
        last7DaysRevenue: [],
        last30DaysRevenue: [],
        monthToDateRevenue: 0,
        revenueVsLastMonth: 0,
        averageTransactionValue: 0,

        // Staff performance
        staffLeaderboard: [],
        averageStaffUtilization: 0,
        totalStaffHoursToday: 0,

        // Customer insights
        newCustomersToday: 0,
        returningCustomersToday: 0,
        customerRetentionRate: 0,
        averageCustomerLifetimeValue: 0,
        vipCustomerActivityToday: 0,

        // Service analytics
        topServices: [],
        leastPopularServices: [],
        averageServiceDuration: 0,

        // Financial metrics
        grossProfit: 0,
        profitMargin: 0,
        paymentMethodBreakdown: {
          cash: 0,
          card: 0,
          bank_transfer: 0,
          voucher: 0
        },
        paymentMethodSplitAnalysis: {
          today: { cash: 0, card: 0, bank_transfer: 0, voucher: 0 },
          last7Days: { cash: 0, card: 0, bank_transfer: 0, voucher: 0 },
          last30Days: { cash: 0, card: 0, bank_transfer: 0, voucher: 0 },
          yearToDate: { cash: 0, card: 0, bank_transfer: 0, voucher: 0 },
          allTime: { cash: 0, card: 0, bank_transfer: 0, voucher: 0 }
        },
        financialMetricsSplitAnalysis: {
          today: { revenue: 0, grossProfit: 0, profitMargin: 0, transactionCount: 0, averageTransactionValue: 0 },
          last7Days: { revenue: 0, grossProfit: 0, profitMargin: 0, transactionCount: 0, averageTransactionValue: 0 },
          last30Days: { revenue: 0, grossProfit: 0, profitMargin: 0, transactionCount: 0, averageTransactionValue: 0 },
          yearToDate: { revenue: 0, grossProfit: 0, profitMargin: 0, transactionCount: 0, averageTransactionValue: 0 },
          allTime: { revenue: 0, grossProfit: 0, profitMargin: 0, transactionCount: 0, averageTransactionValue: 0 }
        }
      }
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterdayStart = startOfYesterday()
    const yesterdayEnd = endOfYesterday()
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)
    const sevenDaysAgo = subDays(now, 6) // Include today
    const thirtyDaysAgo = subDays(now, 29) // Include today

    // ✅ ENTERPRISE: Get date range based on selected period
    const getPeriodDateRange = () => {
      switch (selectedPeriod) {
        case 'today':
          return { start: todayStart, end: todayEnd }
        case 'last7Days':
          return { start: startOfDay(sevenDaysAgo), end: todayEnd }
        case 'last30Days':
          return { start: startOfDay(thirtyDaysAgo), end: todayEnd }
        case 'yearToDate':
          return { start: yearStart, end: todayEnd }
        case 'allTime':
        default:
          return null // No date filtering
      }
    }

    const periodRange = getPeriodDateRange()

    // Filter active entities
    const activeCustomers = customers?.filter(c => c.status !== 'archived' && c.status !== 'deleted') || []
    const activeServices = services?.filter(s => s.status === 'active' || !s.status) || []
    const activeProducts = products?.filter(p => p.status !== 'archived' && p.status !== 'deleted') || []
    const activeStaff = staff?.filter(s => s.status === 'active' || !s.status) || []

    // ✅ ALIGNED WITH REPORTS: GL_JOURNAL transactions don't need status filtering
    // They are automatically posted and represent completed financial transactions
    const completedTickets = tickets || []

    console.log('📊 [useSalonDashboard] Completed Tickets:', {
      totalTickets: tickets?.length || 0,
      completedTickets: completedTickets.length,
      sampleTicket: completedTickets[0]
    })

    // ═══════════════════════════════════════════════════════════════
    // BASE METRICS
    // ═══════════════════════════════════════════════════════════════

    // VIP Customers count
    const vipCustomers = activeCustomers.filter(c =>
      c.vip === true ||
      c.is_vip === true ||
      c.dynamic_fields?.vip?.value === true ||
      c.metadata?.vip === true
    ).length

    // ✅ ALIGNED WITH REPORTS: Total revenue from GL_JOURNAL metadata
    const totalRevenue = extractGrossRevenue(completedTickets)

    console.log('📊 [useSalonDashboard] Revenue Calculation:', {
      completedTicketsCount: completedTickets.length,
      totalRevenue,
      sampleTransaction: completedTickets[0],
      sampleMetadata: completedTickets[0]?.metadata,
      sampleTotalCr: completedTickets[0]?.metadata?.total_cr,
      allTotalCr: completedTickets.map(t => t.metadata?.total_cr).slice(0, 10)
    })

    // Low stock products
    const lowStockProducts = activeProducts.filter(p => {
      const stockQty = p.stock_quantity || p.stock_level || p.qty_on_hand || 0
      const reorderLevel = p.reorder_level || 0
      return stockQty > 0 && stockQty <= reorderLevel
    }).length

    // Total inventory value
    const inventoryValue = activeProducts.reduce((sum, product) => {
      const costPrice = product.price_cost || product.cost_price || product.price || 0
      const stockQty = product.stock_quantity || product.stock_level || product.qty_on_hand || 0
      const productValue = costPrice && stockQty ? costPrice * stockQty : 0
      return sum + productValue
    }, 0)

    // ═══════════════════════════════════════════════════════════════
    // TODAY'S METRICS
    // ═══════════════════════════════════════════════════════════════

    const todayTransactions = completedTickets.filter(t => {
      const txDate = parseISO(t.transaction_date || t.created_at)
      return txDate >= todayStart && txDate <= todayEnd
    })

    const yesterdayTransactions = completedTickets.filter(t => {
      const txDate = parseISO(t.transaction_date || t.created_at)
      return txDate >= yesterdayStart && txDate <= yesterdayEnd
    })

    // ✅ ALIGNED WITH REPORTS: Today's revenue from GL_JOURNAL metadata
    const todayRevenue = extractGrossRevenue(todayTransactions)
    const yesterdayRevenue = extractGrossRevenue(yesterdayTransactions)

    const todayAppointments = todayTransactions.length
    const yesterdayAppointments = yesterdayTransactions.length

    const todayRevenueGrowth =
      yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    const todayAppointmentsGrowth =
      yesterdayAppointments > 0
        ? ((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100
        : 0

    const todayOnDutyStaff = activeStaff.filter(
      s => s.status === 'active' || s.metadata?.on_duty === true
    ).length

    // ═══════════════════════════════════════════════════════════════
    // APPOINTMENT ANALYTICS
    // ═══════════════════════════════════════════════════════════════

    // ✅ ENTERPRISE: Filter appointments by selected period
    const periodAppointments = periodRange
      ? (appointments || []).filter(apt => {
          const aptDate = parseISO(apt.transaction_date || apt.created_at)
          return aptDate >= periodRange.start && aptDate <= periodRange.end
        })
      : (appointments || [])

    // ✅ FIX: Count APPOINTMENT transactions, not SALE transactions
    const appointmentsByStatus: AppointmentByStatus = periodAppointments.reduce(
      (acc, apt) => {
        const status = apt.transaction_status?.toLowerCase() || apt.metadata?.status?.toLowerCase()

        if (status === 'completed') acc.completed++
        else if (status === 'in_progress' || status === 'in_service') acc.in_progress++
        else if (status === 'booked' || status === 'checked_in' || status === 'pending' || status === 'scheduled' || status === 'payment_pending') acc.pending++
        else if (status === 'cancelled') acc.cancelled++
        else if (status === 'no_show') acc.no_show++
        else if (status === 'draft') acc.pending++ // Draft appointments count as pending
        else acc.pending++ // Default unknown statuses to pending

        return acc
      },
      { completed: 0, in_progress: 0, pending: 0, cancelled: 0, no_show: 0 }
    )

    const totalAppointments = Object.values(appointmentsByStatus).reduce((sum, count) => sum + count, 0)
    const appointmentConversionRate =
      totalAppointments > 0 ? (appointmentsByStatus.completed / totalAppointments) * 100 : 0

    // ✅ FIX: Calculate average appointment value from completed appointments only (with period filter)
    const completedAppointments = periodAppointments.filter(apt => {
      const status = apt.transaction_status?.toLowerCase() || apt.metadata?.status?.toLowerCase()
      return status === 'completed'
    })
    // Note: Using tickets (GL_JOURNAL) revenue divided by completed appointments count
    // This approximates average appointment value from financial records
    const averageAppointmentValue =
      completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0

    const noShowRate = totalAppointments > 0 ? (appointmentsByStatus.no_show / totalAppointments) * 100 : 0
    const cancellationRate =
      totalAppointments > 0 ? (appointmentsByStatus.cancelled / totalAppointments) * 100 : 0

    // ═══════════════════════════════════════════════════════════════
    // REVENUE TRENDS
    // ═══════════════════════════════════════════════════════════════

    // ✅ ALIGNED WITH REPORTS: Last 7 days revenue from GL_JOURNAL metadata
    const last7DaysRevenue: DailyRevenue[] = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayTransactions = completedTickets.filter(t => {
        const txDate = parseISO(t.transaction_date || t.created_at)
        return txDate >= dayStart && txDate <= dayEnd
      })

      const revenue = extractGrossRevenue(dayTransactions)

      return {
        date: format(date, 'MMM dd'),
        revenue,
        appointments: dayTransactions.length,
        averageTicket: dayTransactions.length > 0 ? revenue / dayTransactions.length : 0
      }
    })

    // ✅ ALIGNED WITH REPORTS: Last 30 days revenue from GL_JOURNAL metadata
    const last30DaysRevenue: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayTransactions = completedTickets.filter(t => {
        const txDate = parseISO(t.transaction_date || t.created_at)
        return txDate >= dayStart && txDate <= dayEnd
      })

      const revenue = extractGrossRevenue(dayTransactions)

      return {
        date: format(date, 'MMM dd'),
        revenue,
        appointments: dayTransactions.length,
        averageTicket: dayTransactions.length > 0 ? revenue / dayTransactions.length : 0
      }
    })

    // ✅ ALIGNED WITH REPORTS: Month-to-date revenue from GL_JOURNAL metadata
    const monthTransactions = completedTickets.filter(t => {
      const txDate = parseISO(t.transaction_date || t.created_at)
      return txDate >= monthStart
    })

    const monthToDateRevenue = extractGrossRevenue(monthTransactions)

    // Revenue vs last month (simplified)
    const revenueVsLastMonth = 0

    // ✅ ALIGNED WITH REPORTS: Average transaction value from GL_JOURNAL metadata
    const averageTransactionValue =
      completedTickets.length > 0
        ? extractGrossRevenue(completedTickets) / completedTickets.length
        : 0

    // ═══════════════════════════════════════════════════════════════
    // STAFF PERFORMANCE
    // ═══════════════════════════════════════════════════════════════

    // ✅ ENTERPRISE: Filter completed tickets by selected period for staff performance
    const periodCompletedTickets = periodRange
      ? completedTickets.filter(t => {
          const txDate = parseISO(t.transaction_date || t.created_at)
          return txDate >= periodRange.start && txDate <= periodRange.end
        })
      : completedTickets

    const staffStats = activeStaff.map(s => {
      // More comprehensive staff ID matching (using period-filtered tickets)
      const staffTransactions = periodCompletedTickets.filter(
        t =>
          t.metadata?.staff_id === s.id ||
          t.metadata?.stylist_id === s.id ||
          t.metadata?.stylist_entity_id === s.id ||
          t.source_entity_id === s.id || // Staff as source entity
          t.target_entity_id === s.id    // Staff as target entity
      )

      // ✅ ALIGNED WITH REPORTS: Staff revenue from GL_JOURNAL metadata
      const revenue = extractGrossRevenue(staffTransactions)
      const servicesCompleted = staffTransactions.length

      // Get staff rating
      const averageRating = s.dynamic_fields?.rating?.value || s.metadata?.rating || 5.0

      // Better utilization calculation: (services completed in period / expected services per day) * 100
      // Expected services per day: 8 (assuming 8 services per 8-hour day)
      // Use appointment transactions for accurate service count (with period filter)
      const todayStaffAppointments = periodAppointments.filter(apt => {
        const aptDate = parseISO(apt.transaction_date || apt.created_at)
        const isToday = aptDate >= todayStart && aptDate <= todayEnd
        const status = apt.transaction_status?.toLowerCase() || apt.metadata?.status?.toLowerCase()
        const isCompletedOrInService = status === 'completed' || status === 'in_service' || status === 'in_progress'

        const isStaffMatch =
          apt.metadata?.staff_id === s.id ||
          apt.metadata?.stylist_id === s.id ||
          apt.metadata?.stylist_entity_id === s.id ||
          apt.source_entity_id === s.id ||
          apt.target_entity_id === s.id

        return isToday && isCompletedOrInService && isStaffMatch
      })

      const todayServices = todayStaffAppointments.length
      const utilizationRate = Math.min(100, (todayServices / 8) * 100) // Cap at 100%

      return {
        staffId: s.id,
        staffName: s.entity_name,
        revenue,
        servicesCompleted,
        averageRating: Number(averageRating),
        utilizationRate
      }
    })

    const staffLeaderboard = staffStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate team utilization based on period appointments/services
    // Filter period appointments (completed or in-service)
    const todayAppointmentTransactions = periodAppointments.filter(apt => {
      const aptDate = parseISO(apt.transaction_date || apt.created_at)
      const status = apt.transaction_status?.toLowerCase() || apt.metadata?.status?.toLowerCase()
      const isCompletedOrInService = status === 'completed' || status === 'in_service' || status === 'in_progress'
      return aptDate >= todayStart && aptDate <= todayEnd && isCompletedOrInService
    })

    const totalTodayServices = todayAppointmentTransactions.length
    const expectedDailyCapacity = activeStaff.length * 8 // 8 services per staff per day
    const averageStaffUtilization = expectedDailyCapacity > 0
      ? Math.min(100, (totalTodayServices / expectedDailyCapacity) * 100)
      : 0

    const totalStaffHoursToday = todayOnDutyStaff * 8

    // ═══════════════════════════════════════════════════════════════
    // CUSTOMER INSIGHTS
    // ═══════════════════════════════════════════════════════════════

    // ✅ ENTERPRISE: Filter customers by selected period
    const periodCustomers = periodRange
      ? activeCustomers.filter(c => {
          const createdAt = parseISO(c.created_at)
          return createdAt >= periodRange.start && createdAt <= periodRange.end
        })
      : activeCustomers

    const newCustomersToday = periodCustomers.length

    const periodCustomerIds = new Set(
      periodCompletedTickets
        .map(t => t.metadata?.customer_id || t.source_entity_id)
        .filter(Boolean)
    )

    const returningCustomersToday = Array.from(periodCustomerIds).filter(customerId => {
      const customerTransactions = periodCompletedTickets.filter(
        t => t.metadata?.customer_id === customerId || t.source_entity_id === customerId
      )
      return customerTransactions.length > 1
    }).length

    const customersWithMultipleVisits = activeCustomers.filter(c => {
      const customerTransactions = completedTickets.filter(
        t => t.metadata?.customer_id === c.id || t.source_entity_id === c.id
      )
      return customerTransactions.length > 1
    }).length

    const customerRetentionRate =
      activeCustomers.length > 0 ? (customersWithMultipleVisits / activeCustomers.length) * 100 : 0

    const averageCustomerLifetimeValue = activeCustomers.length > 0 ? totalRevenue / activeCustomers.length : 0

    const vipCustomerIds = activeCustomers
      .filter(c =>
        c.vip === true ||
        c.is_vip === true ||
        c.dynamic_fields?.vip?.value === true ||
        c.metadata?.vip === true
      )
      .map(c => c.id)

    const vipCustomerActivityToday = periodCompletedTickets.filter(t => {
      const customerId = t.metadata?.customer_id || t.source_entity_id
      return vipCustomerIds.includes(customerId)
    }).length

    // ═══════════════════════════════════════════════════════════════
    // SERVICE ANALYTICS
    // ═══════════════════════════════════════════════════════════════

    const serviceStats = activeServices.map(service => {
      // Use period-filtered tickets for service analytics
      const serviceTransactions = periodCompletedTickets.filter(
        t =>
          t.metadata?.service_id === service.id ||
          t.metadata?.service_ids?.includes(service.id)
      )

      const bookings = serviceTransactions.length
      // ✅ ALIGNED WITH REPORTS: Service revenue from GL_JOURNAL metadata
      const revenue = extractGrossRevenue(serviceTransactions)
      const averagePrice = bookings > 0 ? revenue / bookings : 0

      return {
        serviceId: service.id,
        serviceName: service.entity_name,
        bookings,
        revenue,
        averagePrice,
        popularityRank: 0
      }
    }).filter(s => s.bookings > 0)

    const sortedServices = serviceStats.sort((a, b) => b.bookings - a.bookings)
    sortedServices.forEach((s, index) => {
      s.popularityRank = index + 1
    })

    const topServices = sortedServices.slice(0, 5)
    const leastPopularServices = sortedServices.slice(-5).reverse()
    const averageServiceDuration = 60

    // ═══════════════════════════════════════════════════════════════
    // FINANCIAL METRICS
    // ═══════════════════════════════════════════════════════════════

    // ✅ ENTERPRISE FEATURE: Payment Method Split Analysis by Time Periods
    // Load once, calculate instantly based on filter - no reloading needed
    const paymentMethodSplitAnalysis: PaymentMethodSplitAnalysis = {
      today: calculatePaymentBreakdown(completedTickets, todayStart, todayEnd),
      last7Days: calculatePaymentBreakdown(completedTickets, startOfDay(sevenDaysAgo), todayEnd),
      last30Days: calculatePaymentBreakdown(completedTickets, startOfDay(thirtyDaysAgo), todayEnd),
      yearToDate: calculatePaymentBreakdown(completedTickets, yearStart, todayEnd),
      allTime: calculatePaymentBreakdown(completedTickets) // No date filter = all time
    }

    // ✅ ENTERPRISE FEATURE: Financial Metrics Split Analysis by Time Periods
    // Revenue, gross profit, profit margin calculated for each period
    const profitMarginRate = 0.6 // 60% profit margin

    const financialMetricsSplitAnalysis: FinancialMetricsSplitAnalysis = {
      today: calculateFinancialMetrics(completedTickets, todayStart, todayEnd, profitMarginRate),
      last7Days: calculateFinancialMetrics(completedTickets, startOfDay(sevenDaysAgo), todayEnd, profitMarginRate),
      last30Days: calculateFinancialMetrics(completedTickets, startOfDay(thirtyDaysAgo), todayEnd, profitMarginRate),
      yearToDate: calculateFinancialMetrics(completedTickets, yearStart, todayEnd, profitMarginRate),
      allTime: calculateFinancialMetrics(completedTickets, undefined, undefined, profitMarginRate)
    }

    // Backward compatibility: Use allTime for legacy fields
    const paymentMethodBreakdown = paymentMethodSplitAnalysis.allTime
    const grossProfit = financialMetricsSplitAnalysis.allTime.grossProfit
    const profitMargin = financialMetricsSplitAnalysis.allTime.profitMargin

    // ═══════════════════════════════════════════════════════════════
    // RETURN ALL KPIS
    // ═══════════════════════════════════════════════════════════════

    return {
      // Base metrics
      totalCustomers: activeCustomers.length,
      vipCustomers,
      totalRevenue,
      activeServices: activeServices.length,
      totalProducts: activeProducts.length,
      lowStockProducts,
      inventoryValue,
      activeStaff: activeStaff.length,

      // Today's metrics
      todayRevenue,
      todayAppointments,
      todayRevenueGrowth,
      todayAppointmentsGrowth,
      todayOnDutyStaff,

      // Appointment analytics
      appointmentsByStatus,
      appointmentConversionRate,
      averageAppointmentValue,
      noShowRate,
      cancellationRate,

      // Revenue trends
      last7DaysRevenue,
      last30DaysRevenue,
      monthToDateRevenue,
      revenueVsLastMonth,
      averageTransactionValue,

      // Staff performance
      staffLeaderboard,
      averageStaffUtilization,
      totalStaffHoursToday,

      // Customer insights
      newCustomersToday,
      returningCustomersToday,
      customerRetentionRate,
      averageCustomerLifetimeValue,
      vipCustomerActivityToday,

      // Service analytics
      topServices,
      leastPopularServices,
      averageServiceDuration,

      // Financial metrics
      grossProfit,
      profitMargin,
      paymentMethodBreakdown, // Deprecated: Use paymentMethodSplitAnalysis instead
      paymentMethodSplitAnalysis, // ✅ ENTERPRISE: Payment method split by time periods
      financialMetricsSplitAnalysis // ✅ ENTERPRISE: Revenue/profit metrics by time periods
    }
  }, [customers, services, products, staff, tickets, appointments, selectedPeriod])

  // Loading state
  const isLoading =
    customersLoading ||
    servicesLoading ||
    productsLoading ||
    staffLoading ||
    ticketsLoading ||
    appointmentsLoading

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchServices(),
      refetchProducts(),
      refetchStaff(),
      refetchTickets(),
      refetchAppointments()
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
    // KPIs with all enterprise analytics
    kpis,

    // Raw data
    customers,
    services,
    products,
    staff,
    tickets,
    appointments,

    // Loading state
    isLoading,

    // Actions
    refreshAll,
    formatCurrency,

    // Individual refetch functions
    refetchCustomers,
    refetchServices,
    refetchProducts,
    refetchStaff,
    refetchTickets,
    refetchAppointments
  }
}
