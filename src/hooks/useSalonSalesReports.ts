// ================================================================================
// SALON SALES REPORTS HOOK
// Smart Code: HERA.HOOK.REPORTS.SALON.SALES.v1
// GL-based sales reporting using hera_txn_crud_v1 orchestrator RPC
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
 * Extract net revenue from GL transaction metadata
 * The GL auto-posting system stores aggregated amounts in metadata object
 */
function extractNetRevenue(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // net_revenue is the service revenue after discounts
      total += txn.metadata.net_revenue || 0
    }
  })

  return total
}

/**
 * Extract VAT from GL transaction metadata
 * VAT amount is calculated during GL auto-posting
 */
function extractVAT(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      // VAT is included in total_cr (credit side)
      // VAT = total_cr - net_revenue - tips
      const totalCr = txn.metadata.total_cr || 0
      const netRevenue = txn.metadata.net_revenue || 0
      const tips = txn.metadata.tips || 0
      const vat = totalCr - netRevenue - tips
      total += vat > 0 ? vat : 0
    }
  })

  return total
}

/**
 * Extract tips from GL transaction metadata
 */
function extractTips(glJournalTransactions: any[]): number {
  let total = 0

  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      total += txn.metadata.tips || 0
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
 * Calculate sales summary from GL transactions
 * Reads from metadata object where GL auto-posting stores aggregated amounts
 */
function calculateSummary(glJournalTransactions: any[]): SalesSummary {
  // Extract from metadata
  const netRevenue = extractNetRevenue(glJournalTransactions)
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

  // Service mix (assume all revenue is service for now - can be enhanced later)
  const serviceMixPercent = netRevenue > 0 ? 100 : 0
  const productMixPercent = 0 // Not tracked yet

  return {
    total_gross: totalGross,
    total_net: netRevenue,
    total_vat: vat,
    total_tips: tips,
    total_service: netRevenue, // Simplified: all net is service
    total_product: 0, // Not tracked yet
    transaction_count: transactionCount,
    average_ticket: averageTicket,
    service_mix_percent: serviceMixPercent,
    product_mix_percent: productMixPercent
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

export function useDailySalesReport(date: Date) {
  const startDate = startOfDay(date).toISOString()
  const endDate = endOfDay(date).toISOString()

  // Query GL_JOURNAL transactions for the day
  const {
    transactions: glJournalTransactions,
    isLoading,
    error,
    refetch
  } = useUniversalTransactionV1({
    filters: {
      transaction_type: 'GL_JOURNAL',
      smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
      date_from: startDate,
      date_to: endDate,
      include_lines: true,
      limit: 1000
    }
  })

  // Calculate summary and hourly breakdown
  const { summary, hourlyData } = useMemo(() => {
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
        hourlyData: []
      }
    }

    const calculatedSummary = calculateSummary(glJournalTransactions)
    const calculatedHourly = calculateHourlyRows(glJournalTransactions)

    return {
      summary: calculatedSummary,
      hourlyData: calculatedHourly
    }
  }, [glJournalTransactions])

  return {
    summary,
    hourlyData,
    isLoading,
    error,
    refetch
  }
}

// ============================================================================
// MONTHLY SALES REPORT HOOK
// ============================================================================

export function useMonthlySalesReport(month: number, year: number) {
  const monthDate = new Date(year, month - 1, 1)
  const startDate = startOfMonth(monthDate).toISOString()
  const endDate = endOfMonth(monthDate).toISOString()

  // Get all days in month for daily breakdown
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate)
  })

  // Query GL_JOURNAL transactions for the month
  const {
    transactions: glJournalTransactions,
    isLoading,
    error,
    refetch
  } = useUniversalTransactionV1({
    filters: {
      transaction_type: 'GL_JOURNAL',
      smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
      date_from: startDate,
      date_to: endDate,
      include_lines: true,
      limit: 5000
    }
  })

  // Calculate summary and daily breakdown
  const { summary, dailyData } = useMemo(() => {
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
          working_days: daysInMonth.length
        },
        dailyData: []
      }
    }

    const baseSummary = calculateSummary(glJournalTransactions)
    const workingDays = daysInMonth.length
    const averageDaily = workingDays > 0 ? baseSummary.total_gross / workingDays : 0

    return {
      summary: {
        ...baseSummary,
        average_daily: averageDaily,
        working_days: workingDays
      },
      dailyData: calculateDailyRows(glJournalTransactions, daysInMonth)
    }
  }, [glJournalTransactions, daysInMonth])

  return {
    summary,
    dailyData,
    isLoading,
    error,
    refetch
  }
}
