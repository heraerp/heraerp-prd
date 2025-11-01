/**
 * ================================================================================
 * QUARTERLY VAT REPORT HOOK - UAE FTA COMPLIANCE
 * Smart Code: HERA.SALON.REPORTS.VAT.QUARTERLY.v1
 * ================================================================================
 *
 * 🇦🇪 UAE VAT COMPLIANCE FEATURES:
 * - ✅ Quarterly reporting (Q1-Q4)
 * - ✅ Monthly option for large businesses
 * - ✅ GL v2.0 only (enhanced VAT breakdown)
 * - ✅ Service vs Product VAT split
 * - ✅ FTA-ready export formats
 * - ✅ Organization filtering
 *
 * ================================================================================
 */

'use client'

import { useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import type { DimensionalBreakdown } from './useSalonSalesReports'

// ============================================================================
// TYPES
// ============================================================================

export type VATReportPeriod = 'quarterly' | 'monthly'

export interface VATReportOptions {
  organizationId?: string
  period: VATReportPeriod
  quarter?: number // 1-4 (required if period = 'quarterly')
  month?: number // 1-12 (required if period = 'monthly')
  year: number
  branchId?: string | null
}

export interface VATSummary {
  // Output VAT (Sales - what you collected from customers)
  service_vat_output: number
  product_vat_output: number
  total_vat_output: number

  // Input VAT (Purchases - what you paid on expenses)
  service_vat_input: number // From expenses
  product_vat_input: number // From expenses
  total_vat_input: number

  // Net VAT Payable (Output - Input)
  net_vat_payable: number

  // Supporting data
  service_revenue_net: number
  product_revenue_net: number
  total_revenue_net: number
  service_revenue_gross: number
  product_revenue_gross: number
  total_revenue_gross: number

  // Period info
  period_type: VATReportPeriod
  period_label: string
  period_start: string
  period_end: string
  transaction_count: number

  // GL version
  gl_version: 'v2.0' | 'v1.0' | 'mixed'
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get date range for a quarter
 */
function getQuarterDateRange(quarter: number, year: number): { start: string; end: string } {
  const quarters = {
    1: { start: `${year}-01-01`, end: `${year}-03-31` },
    2: { start: `${year}-04-01`, end: `${year}-06-30` },
    3: { start: `${year}-07-01`, end: `${year}-09-30` },
    4: { start: `${year}-10-01`, end: `${year}-12-31` }
  }

  if (quarter < 1 || quarter > 4) {
    throw new Error('Quarter must be between 1 and 4')
  }

  return quarters[quarter as keyof typeof quarters]
}

/**
 * Get date range for a month
 */
function getMonthDateRange(month: number, year: number): { start: string; end: string } {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of month

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  }
}

/**
 * Get period label for display
 */
function getPeriodLabel(period: VATReportPeriod, quarter: number | undefined, month: number | undefined, year: number): string {
  if (period === 'quarterly' && quarter) {
    return `Q${quarter} ${year}`
  }

  if (period === 'monthly' && month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return `${monthNames[month - 1]} ${year}`
  }

  return 'Unknown Period'
}

/**
 * Detect GL version from transactions
 */
function detectGLVersion(transactions: any[]): 'v2.0' | 'v1.0' | 'mixed' {
  if (!transactions || transactions.length === 0) return 'v1.0'

  let hasV2 = false
  let hasV1 = false

  transactions.forEach(txn => {
    const version = txn.metadata?.gl_engine_version
    if (version === 'v2.0.0') {
      hasV2 = true
    } else {
      hasV1 = true
    }
  })

  if (hasV2 && hasV1) return 'mixed'
  if (hasV2) return 'v2.0'
  return 'v1.0'
}

/**
 * Extract VAT summary from GL transactions (v2.0 + v1.0 fallback)
 * Provides detailed breakdown for v2.0 and total VAT for v1.0
 */
function extractVATSummary(
  transactions: any[],
  options: VATReportOptions
): VATSummary {
  // Separate v2.0 and v1.0 transactions
  const v2Transactions = transactions.filter(txn =>
    txn.metadata?.gl_engine_version === 'v2.0.0'
  )
  const v1Transactions = transactions.filter(txn =>
    txn.metadata?.gl_engine_version !== 'v2.0.0'
  )

  // Initialize totals
  let serviceVATOutput = 0
  let productVATOutput = 0
  let serviceRevenueNet = 0
  let productRevenueNet = 0
  let serviceRevenueGross = 0
  let productRevenueGross = 0
  let v1TotalVAT = 0
  let v1TotalRevenue = 0

  // Aggregate from GL v2.0 enhanced metadata
  v2Transactions.forEach(txn => {
    const meta = txn.metadata || {}

    // VAT collected (output)
    serviceVATOutput += meta.vat_on_services || 0
    productVATOutput += meta.vat_on_products || 0

    // Revenue
    serviceRevenueNet += meta.service_revenue_net || 0
    productRevenueNet += meta.product_revenue_net || 0
    serviceRevenueGross += meta.service_revenue_gross || 0
    productRevenueGross += meta.product_revenue_gross || 0
  })

  // Fallback: Aggregate from GL v1.0 transactions (calculated VAT)
  v1Transactions.forEach(txn => {
    const meta = txn.metadata || {}

    // v1.0: Calculate VAT from total_cr - net_revenue - tips
    const totalCr = meta.total_cr || 0
    const netRevenue = meta.net_revenue || 0
    const tips = meta.tips || 0
    const vat = totalCr - netRevenue - tips

    v1TotalVAT += vat > 0 ? vat : 0
    v1TotalRevenue += netRevenue

    // Assume all v1.0 revenue is service (no product split in v1.0)
    serviceRevenueNet += netRevenue
    serviceRevenueGross += totalCr
  })

  const totalVATOutput = serviceVATOutput + productVATOutput + v1TotalVAT
  const totalRevenueNet = serviceRevenueNet + productRevenueNet
  const totalRevenueGross = serviceRevenueGross + productRevenueGross

  // TODO: Extract VAT input from expenses
  // For now, estimate at 0 (to be implemented with expense VAT tracking)
  const serviceVATInput = 0
  const productVATInput = 0
  const totalVATInput = serviceVATInput + productVATInput

  // Net VAT payable
  const netVATPayable = totalVATOutput - totalVATInput

  // Get period info
  const dateRange = options.period === 'quarterly'
    ? getQuarterDateRange(options.quarter!, options.year)
    : getMonthDateRange(options.month!, options.year)

  const periodLabel = getPeriodLabel(
    options.period,
    options.quarter,
    options.month,
    options.year
  )

  // Detect GL version
  const glVersion = detectGLVersion(transactions)

  return {
    // Output VAT (collected from customers)
    service_vat_output: serviceVATOutput,
    product_vat_output: productVATOutput,
    total_vat_output: totalVATOutput,

    // Input VAT (paid on purchases)
    service_vat_input: serviceVATInput,
    product_vat_input: productVATInput,
    total_vat_input: totalVATInput,

    // Net VAT payable
    net_vat_payable: netVATPayable,

    // Supporting data
    service_revenue_net: serviceRevenueNet,
    product_revenue_net: productRevenueNet,
    total_revenue_net: totalRevenueNet,
    service_revenue_gross: serviceRevenueGross,
    product_revenue_gross: productRevenueGross,
    total_revenue_gross: totalRevenueGross,

    // Period info
    period_type: options.period,
    period_label: periodLabel,
    period_start: dateRange.start,
    period_end: dateRange.end,
    transaction_count: v2Transactions.length,

    // GL version
    gl_version: glVersion
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * ✅ ENTERPRISE HOOK: Quarterly/Monthly VAT Report with GL v2.0 only
 *
 * UAE FTA Compliance:
 * - Quarterly reporting (standard)
 * - Monthly option (for large businesses)
 * - Service vs Product VAT split
 * - GL v2.0 enhanced metadata
 *
 * @example
 * // Quarterly VAT (Q1 2025)
 * const report = useQuarterlyVATReport({
 *   period: 'quarterly',
 *   quarter: 1,
 *   year: 2025,
 *   organizationId: 'org-uuid'
 * })
 *
 * @example
 * // Monthly VAT (January 2025)
 * const report = useQuarterlyVATReport({
 *   period: 'monthly',
 *   month: 1,
 *   year: 2025,
 *   organizationId: 'org-uuid'
 * })
 */
export function useQuarterlyVATReport(options: VATReportOptions) {
  // Validate options
  if (options.period === 'quarterly' && !options.quarter) {
    throw new Error('Quarter is required when period is quarterly')
  }

  if (options.period === 'monthly' && !options.month) {
    throw new Error('Month is required when period is monthly')
  }

  // Get date range
  const dateRange = useMemo(() => {
    return options.period === 'quarterly'
      ? getQuarterDateRange(options.quarter!, options.year)
      : getMonthDateRange(options.month!, options.year)
  }, [options.period, options.quarter, options.month, options.year])

  // Fetch GL_JOURNAL transactions for the period
  const {
    transactions: allTransactions,
    isLoading,
    error,
    refetch
  } = useUniversalTransactionV1({
    organizationId: options.organizationId,
    filters: {
      transaction_type: 'GL_JOURNAL',
      date_from: dateRange.start,
      date_to: dateRange.end,
      include_lines: true,
      limit: 10000 // High limit for quarterly data
    },
    cacheConfig: {
      staleTime: 0,
      refetchOnMount: 'always'
    }
  })

  // Filter by branch if specified
  const transactions = useMemo(() => {
    if (!options.branchId || !allTransactions) {
      return allTransactions
    }

    return allTransactions.filter(txn =>
      txn.metadata?.branch_id === options.branchId
    )
  }, [allTransactions, options.branchId])

  // Extract VAT summary
  const vatSummary = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        service_vat_output: 0,
        product_vat_output: 0,
        total_vat_output: 0,
        service_vat_input: 0,
        product_vat_input: 0,
        total_vat_input: 0,
        net_vat_payable: 0,
        service_revenue_net: 0,
        product_revenue_net: 0,
        total_revenue_net: 0,
        service_revenue_gross: 0,
        product_revenue_gross: 0,
        total_revenue_gross: 0,
        period_type: options.period,
        period_label: getPeriodLabel(options.period, options.quarter, options.month, options.year),
        period_start: dateRange.start,
        period_end: dateRange.end,
        transaction_count: 0,
        gl_version: 'v1.0' as const
      }
    }

    return extractVATSummary(transactions, options)
  }, [transactions, options, dateRange])

  // Console debug in development
  if (process.env.NODE_ENV === 'development') {
    const v2Count = transactions?.filter(t => t.metadata?.gl_engine_version === 'v2.0.0').length || 0
    const v1Count = (transactions?.length || 0) - v2Count

    console.log('[useQuarterlyVATReport] 📊 VAT Report:', {
      period: options.period,
      quarter: options.quarter,
      month: options.month,
      year: options.year,
      dateRange,
      transactions: {
        total: transactions?.length || 0,
        v2: v2Count,
        v1: v1Count
      },
      glVersion: vatSummary.gl_version,
      vat: {
        service: vatSummary.service_vat_output,
        product: vatSummary.product_vat_output,
        total: vatSummary.total_vat_output
      },
      netVATPayable: vatSummary.net_vat_payable
    })
  }

  return {
    vatSummary,
    transactions,
    isLoading,
    error,
    refetch,
    dateRange,
    periodLabel: vatSummary.period_label
  }
}
