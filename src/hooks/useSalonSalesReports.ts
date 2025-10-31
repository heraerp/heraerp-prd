// ================================================================================
// SALON SALES REPORTS HOOK V2
// Smart Code: HERA.HOOK.REPORTS.SALON.SALES.v2
// GL-based sales reporting using hera_txn_crud_v1 orchestrator RPC
// ✅ UPGRADED: Now supports GL v2.0 enhanced dimensional data
// ================================================================================

'use client'

import { useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export interface SalesSummary {
  total_gross: number
  total_net: number
  total_vat: number
  total_tips: number
  total_service: number
  total_product: number
  transaction_count: number
  average_ticket: number
  service_mix_percent: number
  product_mix_percent: number
  average_daily?: number
  working_days?: number
  growth_vs_previous?: number
}

export interface SalesRow {
  hour?: string
  date?: string
  service_net: number
  product_net: number
  tips: number
  vat: number
  gross: number
  txn_count: number
  avg_ticket: number
}

// ============================================================================
// HELPER FUNCTIONS - GL METADATA EXTRACTION
// ============================================================================

/**
 * ✅ GL v2.0 ADVANCED: Detect GL posting engine version
 * Returns 'v2.0.0' if enhanced metadata is present, otherwise 'v1.0.0'
 */
function detectGLEngineVersion(glJournalTransaction: any): string {
  if (glJournalTransaction?.metadata?.gl_engine_version) {
    return glJournalTransaction.metadata.gl_engine_version
  }
  // v2.0 detection: Check for enhanced metadata fields
  if (glJournalTransaction?.metadata?.service_revenue_net !== undefined ||
      glJournalTransaction?.metadata?.product_revenue_net !== undefined) {
    return 'v2.0.0'
  }
  return 'v1.0.0'
}

/**
 * ✅ GL v2.0 ADVANCED: Calculate dimensional breakdown statistics
 * Provides deep analytics only available with v2.0+ GL posting engine
 * Returns null for v1.0 transactions (not supported)
 */
export interface DimensionalBreakdown {
  // Revenue breakdown
  service_gross: number
  service_discount: number
  service_net: number
  service_vat: number
  product_gross: number
  product_discount: number
  product_net: number
  product_vat: number

  // Tip allocation (v2.0 only)
  tips_by_staff: Array<{
    staff_id: string
    staff_name?: string
    tip_amount: number
    service_count: number
  }>

  // Payment method breakdown (v2.0 only)
  payments_by_method: Array<{
    method: string
    amount: number
    count: number
  }>

  // Engine version
  engine_version: string
}

function extractDimensionalBreakdown(glJournalTransactions: any[]): DimensionalBreakdown | null {
  // Only works with v2.0+ transactions
  const v2Transactions = glJournalTransactions.filter(txn =>
    detectGLEngineVersion(txn).startsWith('v2')
  )

  if (v2Transactions.length === 0) {
    return null // No v2.0 data available
  }

  // Aggregate v2.0 enhanced metadata
  const breakdown: DimensionalBreakdown = {
    service_gross: 0,
    service_discount: 0,
    service_net: 0,
    service_vat: 0,
    product_gross: 0,
    product_discount: 0,
    product_net: 0,
    product_vat: 0,
    tips_by_staff: [],
    payments_by_method: [],
    engine_version: 'v2.0.0'
  }

  const staffTipsMap = new Map<string, { staff_name?: string; tip_amount: number; service_count: number }>()
  const paymentMethodMap = new Map<string, { amount: number; count: number }>()

  v2Transactions.forEach(txn => {
    const meta = txn.metadata || {}

    // Service breakdown
    breakdown.service_gross += meta.service_revenue_gross || 0
    breakdown.service_discount += meta.service_discount_total || 0
    breakdown.service_net += meta.service_revenue_net || 0
    breakdown.service_vat += meta.vat_on_services || 0

    // Product breakdown
    breakdown.product_gross += meta.product_revenue_gross || 0
    breakdown.product_discount += meta.product_discount_total || 0
    breakdown.product_net += meta.product_revenue_net || 0
    breakdown.product_vat += meta.vat_on_products || 0

    // Tips by staff
    if (meta.tips_by_staff && Array.isArray(meta.tips_by_staff)) {
      meta.tips_by_staff.forEach((staffTip: any) => {
        const existing = staffTipsMap.get(staffTip.staff_id) || {
          staff_name: staffTip.staff_name,
          tip_amount: 0,
          service_count: 0
        }
        existing.tip_amount += staffTip.tip_amount || 0
        existing.service_count += staffTip.service_count || 0
        staffTipsMap.set(staffTip.staff_id, existing)
      })
    }

    // Payments by method
    if (meta.payments_by_method && Array.isArray(meta.payments_by_method)) {
      meta.payments_by_method.forEach((payment: any) => {
        const existing = paymentMethodMap.get(payment.method) || { amount: 0, count: 0 }
        existing.amount += payment.amount || 0
        existing.count += payment.count || 0
        paymentMethodMap.set(payment.method, existing)
      })
    }
  })

  // Convert maps to arrays
  breakdown.tips_by_staff = Array.from(staffTipsMap.entries()).map(([staff_id, data]) => ({
    staff_id,
    staff_name: data.staff_name,
    tip_amount: data.tip_amount,
    service_count: data.service_count
  }))

  breakdown.payments_by_method = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
    method,
    amount: data.amount,
    count: data.count
  }))

  return breakdown
}

/**
 * ✅ GL v2.0 ENHANCED: Extract service net revenue from GL transaction metadata
 * Supports both v1 (legacy) and v2 (enhanced) GL posting engines
 */
function extractServiceNetRevenue(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // v2.0: Use service_revenue_net if available
      if (txn.metadata.service_revenue_net !== undefined) {
        total += txn.metadata.service_revenue_net || 0
      }
      // v1.0 fallback: Use net_revenue (assumes all is service)
      else if (txn.metadata.net_revenue !== undefined) {
        total += txn.metadata.net_revenue || 0
      }
    }
  })

  return total
}

/**
 * ✅ GL v2.0 ENHANCED: Extract product net revenue from GL transaction metadata
 * Only available in v2.0+ GL posting engine
 */
function extractProductNetRevenue(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // v2.0: Product revenue is tracked separately
      total += txn.metadata.product_revenue_net || 0
    }
  })

  return total
}

/**
 * ✅ GL v2.0 ENHANCED: Extract total VAT from GL transaction metadata
 * Supports both v1 (legacy calculated) and v2 (enhanced split) GL posting engines
 */
function extractVAT(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // v2.0: Use split VAT if available (vat_on_services + vat_on_products)
      if (txn.metadata.vat_on_services !== undefined || txn.metadata.vat_on_products !== undefined) {
        total += (txn.metadata.vat_on_services || 0) + (txn.metadata.vat_on_products || 0)
      }
      // v1.0 fallback: Calculate from total_cr - net_revenue - tips
      else {
        const totalCr = txn.metadata.total_cr || 0
        const netRevenue = txn.metadata.net_revenue || 0
        const tips = txn.metadata.tips || 0
        const vat = totalCr - netRevenue - tips
        total += vat > 0 ? vat : 0
      }
    }
  })

  return total
}

/**
 * ✅ GL v2.0 ENHANCED: Extract service VAT from GL transaction metadata
 * Only available in v2.0+ GL posting engine
 */
function extractServiceVAT(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      total += txn.metadata.vat_on_services || 0
    }
  })

  return total
}

/**
 * ✅ GL v2.0 ENHANCED: Extract product VAT from GL transaction metadata
 * Only available in v2.0+ GL posting engine
 */
function extractProductVAT(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      total += txn.metadata.vat_on_products || 0
    }
  })

  return total
}

/**
 * ✅ GL v2.0 ENHANCED: Extract tips from GL transaction metadata
 * Supports both v1 (legacy) and v2 (enhanced) GL posting engines
 */
function extractTips(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // v2.0: Use tips_collected if available
      if (txn.metadata.tips_collected !== undefined) {
        total += txn.metadata.tips_collected || 0
      }
      // v1.0 fallback: Use tips field
      else if (txn.metadata.tips !== undefined) {
        total += txn.metadata.tips || 0
      }
    }
  })

  return total
}

/**
 * Extract total credit (gross revenue) from GL transaction metadata
 * This represents the total amount credited (revenue side)
 */
function extractTotalCredit(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      total += txn.metadata.total_cr || 0
    }
  })

  return total
}

/**
 * Extract total debit (cash/bank collection) from GL transaction metadata
 * This represents the total amount debited (cash collected)
 */
function extractTotalDebit(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      total += txn.metadata.total_dr || 0
    }
  })

  return total
}

/**
 * ✅ GL v2.0 ENHANCED: Calculate sales summary from GL transactions
 * Reads from metadata object where GL auto-posting stores aggregated amounts
 * Supports both v1 (legacy) and v2 (enhanced) GL posting engines
 */
function calculateSummary(glJournalTransactions: any[]): SalesSummary {
  // ✅ ENHANCED: Extract service and product revenue separately
  const serviceRevenue = extractServiceNetRevenue(glJournalTransactions)
  const productRevenue = extractProductNetRevenue(glJournalTransactions)
  const totalNetRevenue = serviceRevenue + productRevenue

  // Extract VAT, tips, and totals
  const vat = extractVAT(glJournalTransactions)
  const tips = extractTips(glJournalTransactions)
  const totalCredit = extractTotalCredit(glJournalTransactions)
  const totalDebit = extractTotalDebit(glJournalTransactions)

  // Total gross = Total credit side (what customer actually paid)
  const totalGross = totalCredit

  // Transaction count (unique GL_JOURNAL entries)
  const transactionCount = glJournalTransactions.length

  // Average ticket
  const averageTicket = transactionCount > 0 ? totalGross / transactionCount : 0

  // ✅ ENHANCED: Calculate service/product mix percentages
  const serviceMixPercent = totalNetRevenue > 0
    ? (serviceRevenue / totalNetRevenue) * 100
    : 0
  const productMixPercent = totalNetRevenue > 0
    ? (productRevenue / totalNetRevenue) * 100
    : 0

  return {
    total_gross: totalGross,
    total_net: totalNetRevenue,
    total_vat: vat,
    total_tips: tips,
    total_service: serviceRevenue, // ✅ ENHANCED: Accurate service revenue
    total_product: productRevenue, // ✅ ENHANCED: Accurate product revenue
    transaction_count: transactionCount,
    average_ticket: averageTicket,
    service_mix_percent: serviceMixPercent, // ✅ ENHANCED: Real percentage
    product_mix_percent: productMixPercent  // ✅ ENHANCED: Real percentage
  }
}

/**
 * Group GL transactions by hour and calculate row data
 */
function calculateHourlyRows(glJournalTransactions: any[]): SalesRow[] {
  // Group by hour
  const hourlyGroups: Record<string, any[]> = {}

  glJournalTransactions.forEach(txn => {
    const date = new Date(txn.transaction_date)
    const hour = format(date, 'HH:00')

    if (!hourlyGroups[hour]) {
      hourlyGroups[hour] = []
    }
    hourlyGroups[hour].push(txn)
  })

  // Calculate summary for each hour
  const rows: SalesRow[] = []
  Object.entries(hourlyGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([hour, transactions]) => {
      const summary = calculateSummary(transactions)
      rows.push({
        hour,
        service_net: summary.total_service,
        product_net: summary.total_product,
        tips: summary.total_tips,
        vat: summary.total_vat,
        gross: summary.total_gross,
        txn_count: summary.transaction_count,
        avg_ticket: summary.average_ticket
      })
    })

  return rows
}

/**
 * Group GL transactions by date and calculate row data
 */
function calculateDailyRows(glJournalTransactions: any[], daysInMonth: Date[]): SalesRow[] {
  // Group by date
  const dailyGroups: Record<string, any[]> = {}

  glJournalTransactions.forEach(txn => {
    const date = format(new Date(txn.transaction_date), 'yyyy-MM-dd')

    if (!dailyGroups[date]) {
      dailyGroups[date] = []
    }
    dailyGroups[date].push(txn)
  })

  // Calculate summary for each day (including days with zero transactions)
  const rows: SalesRow[] = daysInMonth.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const transactions = dailyGroups[dateStr] || []

    if (transactions.length === 0) {
      return {
        date: dateStr,
        service_net: 0,
        product_net: 0,
        tips: 0,
        vat: 0,
        gross: 0,
        txn_count: 0,
        avg_ticket: 0
      }
    }

    const summary = calculateSummary(transactions)
    return {
      date: dateStr,
      service_net: summary.total_service,
      product_net: summary.total_product,
      tips: summary.total_tips,
      vat: summary.total_vat,
      gross: summary.total_gross,
      txn_count: summary.transaction_count,
      avg_ticket: summary.average_ticket
    }
  })

  return rows
}

// ============================================================================
// DAILY SALES REPORT HOOK
// ============================================================================

export function useDailySalesReport(date: Date, branchId?: string | null) {
  const startDate = startOfDay(date).toISOString()
  const endDate = endOfDay(date).toISOString()

  console.log('📊 [useDailySalesReport] Filter params:', {
    date: date.toISOString(),
    startDate,
    endDate,
    branchId,
    hasBranch: !!branchId
  })

  // Query GL_JOURNAL transactions for the day
  // ⚠️ IMPORTANT: Branch ID is stored in metadata.branch_id, NOT target_entity_id
  // We fetch all transactions for the date and filter by branch client-side
  // ✅ BACKWARD COMPATIBLE: Fetch without smart_code filter to get BOTH v1 and v2 GL entries
  const {
    transactions: allGlTransactions,
    isLoading,
    error,
    refetch
  } = useUniversalTransactionV1({
    organizationId: undefined, // Let hook use context
    filters: {
      transaction_type: 'GL_JOURNAL',
      // ✅ REMOVED smart_code filter - get all GL_JOURNAL entries (v1 and v2)
      date_from: startDate,
      date_to: endDate,
      include_lines: true,
      limit: 1000
    },
    // ✅ FIX: Disable aggressive caching for sales reports - filters change frequently
    cacheConfig: {
      staleTime: 0, // Always consider data stale - refetch when filters change
      refetchOnMount: 'always' // Always refetch when component re-renders with new filters
    }
  })

  // ✅ FIX: Client-side branch filtering using metadata.branch_id
  const glJournalTransactions = useMemo(() => {
    if (!branchId || !allGlTransactions) {
      return allGlTransactions
    }

    const filtered = allGlTransactions.filter(txn =>
      txn.metadata?.branch_id === branchId
    )

    console.log('📊 [useDailySalesReport] Branch filter applied:', {
      branchId,
      allCount: allGlTransactions.length,
      filteredCount: filtered.length,
      sampleBranchIds: allGlTransactions.slice(0, 3).map(t => t.metadata?.branch_id)
    })

    return filtered
  }, [allGlTransactions, branchId])

  console.log('📊 [useDailySalesReport] useUniversalTransactionV1 response:', {
    transactionCount: glJournalTransactions?.length || 0,
    isLoading,
    error,
    dates: glJournalTransactions?.map(t => t.transaction_date).slice(0, 5)
  })

  // Calculate summary, hourly breakdown, and dimensional analysis
  const { summary, hourlyData, dimensionalBreakdown } = useMemo(() => {
    console.log('📊 [useDailySalesReport] Calculating summary from transactions:', {
      transactionCount: glJournalTransactions?.length || 0,
      firstTransaction: glJournalTransactions?.[0],
      dateRange: glJournalTransactions?.length > 0 ? {
        first: glJournalTransactions[0]?.transaction_date,
        last: glJournalTransactions[glJournalTransactions.length - 1]?.transaction_date
      } : null,
      branchIds: glJournalTransactions?.map(t => t.target_entity_id).filter((v, i, a) => a.indexOf(v) === i)
    })

    if (!glJournalTransactions || glJournalTransactions.length === 0) {
      return {
        summary: {
          total_gross: 0,
          total_net: 0,
          total_vat: 0,
          total_tips: 0,
          total_service: 0,
          total_product: 0,
          transaction_count: 0,
          average_ticket: 0,
          service_mix_percent: 0,
          product_mix_percent: 0
        },
        hourlyData: [],
        dimensionalBreakdown: null
      }
    }

    const calculatedSummary = calculateSummary(glJournalTransactions)
    const calculatedHourly = calculateHourlyRows(glJournalTransactions)
    const calculatedDimensional = extractDimensionalBreakdown(glJournalTransactions)

    console.log('📊 [useDailySalesReport] Calculated summary:', calculatedSummary)
    console.log('📊 [useDailySalesReport] Dimensional breakdown:', calculatedDimensional ? 'Available (GL v2.0)' : 'Not available (GL v1.0)')

    return {
      summary: calculatedSummary,
      hourlyData: calculatedHourly,
      dimensionalBreakdown: calculatedDimensional
    }
  }, [glJournalTransactions])

  return {
    summary,
    hourlyData,
    dimensionalBreakdown, // ✅ NEW: Advanced dimensional analytics (v2.0 only)
    isLoading,
    error,
    refetch
  }
}

// ============================================================================
// MONTHLY SALES REPORT HOOK
// ============================================================================

export function useMonthlySalesReport(month: number, year: number, branchId?: string | null) {
  const monthDate = new Date(year, month - 1, 1)
  const startDate = startOfMonth(monthDate).toISOString()
  const endDate = endOfMonth(monthDate).toISOString()

  // ✅ GROWTH CALCULATION: Calculate previous month dates
  const prevMonthDate = new Date(year, month - 2, 1) // month - 2 because month is 1-indexed
  const prevStartDate = startOfMonth(prevMonthDate).toISOString()
  const prevEndDate = endOfMonth(prevMonthDate).toISOString()

  console.log('📊 [useMonthlySalesReport] Filter params:', {
    month,
    year,
    startDate,
    endDate,
    prevMonth: prevMonthDate.getMonth() + 1,
    prevYear: prevMonthDate.getFullYear(),
    prevStartDate,
    prevEndDate,
    branchId,
    hasBranch: !!branchId
  })

  // Get all days in month for daily breakdown
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate)
  })

  // Query GL_JOURNAL transactions for the current month
  // ⚠️ IMPORTANT: Branch ID is stored in metadata.branch_id, NOT target_entity_id
  // We fetch all transactions for the month and filter by branch client-side
  // ✅ BACKWARD COMPATIBLE: Fetch without smart_code filter to get BOTH v1 and v2 GL entries
  const {
    transactions: allGlTransactions,
    isLoading,
    error,
    refetch
  } = useUniversalTransactionV1({
    filters: {
      transaction_type: 'GL_JOURNAL',
      // ✅ REMOVED smart_code filter - get all GL_JOURNAL entries (v1 and v2)
      date_from: startDate,
      date_to: endDate,
      include_lines: true,
      limit: 5000
    },
    // ✅ FIX: Disable aggressive caching for sales reports - filters change frequently
    cacheConfig: {
      staleTime: 0, // Always consider data stale - refetch when filters change
      refetchOnMount: 'always' // Always refetch when component re-renders with new filters
    }
  })

  // ✅ GROWTH CALCULATION: Query previous month's transactions
  const {
    transactions: allPrevGlTransactions,
    isLoading: isPrevLoading
  } = useUniversalTransactionV1({
    filters: {
      transaction_type: 'GL_JOURNAL',
      date_from: prevStartDate,
      date_to: prevEndDate,
      include_lines: true,
      limit: 5000
    },
    cacheConfig: {
      staleTime: 0,
      refetchOnMount: 'always'
    }
  })

  // ✅ FIX: Client-side branch filtering using metadata.branch_id
  const glJournalTransactions = useMemo(() => {
    if (!branchId || !allGlTransactions) {
      return allGlTransactions
    }

    return allGlTransactions.filter(txn =>
      txn.metadata?.branch_id === branchId
    )
  }, [allGlTransactions, branchId])

  // ✅ GROWTH CALCULATION: Filter previous month's transactions by branch
  const prevGlJournalTransactions = useMemo(() => {
    if (!branchId || !allPrevGlTransactions) {
      return allPrevGlTransactions
    }

    return allPrevGlTransactions.filter(txn =>
      txn.metadata?.branch_id === branchId
    )
  }, [allPrevGlTransactions, branchId])

  // Calculate summary, daily breakdown, and dimensional analysis
  const { summary, dailyData, dimensionalBreakdown } = useMemo(() => {
    if (!glJournalTransactions || glJournalTransactions.length === 0) {
      return {
        summary: {
          total_gross: 0,
          total_net: 0,
          total_vat: 0,
          total_tips: 0,
          total_service: 0,
          total_product: 0,
          transaction_count: 0,
          average_ticket: 0,
          service_mix_percent: 0,
          product_mix_percent: 0,
          average_daily: 0,
          working_days: daysInMonth.length,
          growth_vs_previous: 0
        },
        dailyData: [],
        dimensionalBreakdown: null
      }
    }

    const baseSummary = calculateSummary(glJournalTransactions)
    const workingDays = daysInMonth.length
    const averageDaily = workingDays > 0 ? baseSummary.total_gross / workingDays : 0
    const calculatedDimensional = extractDimensionalBreakdown(glJournalTransactions)

    // ✅ GROWTH CALCULATION: Calculate growth vs previous month
    let growthVsPrevious: number | undefined = undefined
    if (prevGlJournalTransactions && prevGlJournalTransactions.length > 0) {
      const prevSummary = calculateSummary(prevGlJournalTransactions)
      if (prevSummary.total_gross > 0) {
        // Normal case: previous month has revenue
        growthVsPrevious = ((baseSummary.total_gross - prevSummary.total_gross) / prevSummary.total_gross) * 100
      } else if (baseSummary.total_gross > 0) {
        // Edge case: previous month was 0, current month has revenue = infinite growth
        // Display as undefined (UI will show "N/A" instead of percentage)
        growthVsPrevious = undefined
      } else {
        // Both months are 0
        growthVsPrevious = 0
      }
    }

    console.log('📊 [useMonthlySalesReport] Growth calculation:', {
      currentGross: baseSummary.total_gross,
      prevGross: prevGlJournalTransactions?.length > 0
        ? calculateSummary(prevGlJournalTransactions).total_gross
        : 0,
      growthVsPrevious: growthVsPrevious !== undefined ? `${growthVsPrevious.toFixed(1)}%` : 'N/A'
    })

    return {
      summary: {
        ...baseSummary,
        average_daily: averageDaily,
        working_days: workingDays,
        growth_vs_previous: growthVsPrevious
      },
      dailyData: calculateDailyRows(glJournalTransactions, daysInMonth),
      dimensionalBreakdown: calculatedDimensional
    }
  }, [glJournalTransactions, prevGlJournalTransactions, daysInMonth])

  return {
    summary,
    dailyData,
    dimensionalBreakdown, // ✅ NEW: Advanced dimensional analytics (v2.0 only)
    isLoading,
    error,
    refetch
  }
}
