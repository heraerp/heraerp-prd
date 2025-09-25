/**
 * HERA Finance KPI Primitives
 *
 * Specialized report primitives for financial key performance indicators
 * Used by finance dashboard UCR and other financial reports
 *
 * @module HERA.URP.PRIMITIVES.FINANCE.KPI.v1
 */

import { ReportContext, PrimitiveResult } from '../types/report-types'

/**
 * Cash Position Primitive
 * Calculates current cash position across all cash-related accounts
 */
export async function cashPositionPrimitive(context: ReportContext): Promise<PrimitiveResult> {
  const { supabase, parameters } = context

  const { data: cashAccounts, error } = await supabase
    .from('core_entities')
    .select(
      `
      id,
      entity_name,
      entity_code,
      smart_code,
      core_dynamic_data!inner(
        field_name,
        field_value_number
      )
    `
    )
    .eq('organization_id', parameters.organization_id)
    .in('entity_type', ['bank_account', 'cash_account', 'payment_processor'])
    .like('smart_code', 'HERA.FIN.CASH.%')

  if (error) throw error

  // Calculate total cash position
  const cashPosition =
    cashAccounts?.reduce((total, account) => {
      const balance =
        account.core_dynamic_data?.find((d: any) => d.field_name === 'current_balance')
          ?.field_value_number || 0
      return total + balance
    }, 0) || 0

  return {
    data: {
      total_cash: cashPosition,
      accounts: cashAccounts?.map(a => ({
        id: a.id,
        name: a.entity_name,
        code: a.entity_code,
        balance:
          a.core_dynamic_data?.find((d: any) => d.field_name === 'current_balance')
            ?.field_value_number || 0
      }))
    },
    metadata: {
      primitive: 'cash_position',
      count: cashAccounts?.length || 0
    }
  }
}

/**
 * Revenue Run Rate Primitive
 * Calculates monthly and annual revenue run rates
 */
export async function revenueRunRatePrimitive(context: ReportContext): Promise<PrimitiveResult> {
  const { supabase, parameters } = context

  // Get last 3 months of revenue
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: revenueTransactions, error } = await supabase
    .from('universal_transactions')
    .select('total_amount, transaction_date')
    .eq('organization_id', parameters.organization_id)
    .like('smart_code', 'HERA.%.SALE.%')
    .gte('transaction_date', threeMonthsAgo.toISOString())
    .lte('transaction_date', new Date().toISOString())

  if (error) throw error

  const totalRevenue = revenueTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
  const monthlyRunRate = totalRevenue / 3
  const annualRunRate = monthlyRunRate * 12

  return {
    data: {
      three_month_revenue: totalRevenue,
      monthly_run_rate: monthlyRunRate,
      annual_run_rate: annualRunRate,
      transaction_count: revenueTransactions?.length || 0
    },
    metadata: {
      primitive: 'revenue_run_rate',
      period_months: 3
    }
  }
}

/**
 * Burn Rate Primitive
 * Calculates cash burn rate and runway
 */
export async function burnRatePrimitive(context: ReportContext): Promise<PrimitiveResult> {
  const { supabase, parameters } = context

  // Get last month's expenses
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const { data: expenseTransactions, error } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', parameters.organization_id)
    .or(
      'smart_code.like.HERA.%.EXPENSE.%,smart_code.like.HERA.%.PURCHASE.%,smart_code.like.HERA.%.PAYROLL.%'
    )
    .gte('transaction_date', lastMonth.toISOString())
    .lte('transaction_date', new Date().toISOString())

  if (error) throw error

  // Get current cash position
  const cashResult = await cashPositionPrimitive(context)
  const currentCash = cashResult.data.total_cash

  const monthlyExpenses = Math.abs(
    expenseTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
  )
  const dailyBurnRate = monthlyExpenses / 30
  const runwayDays = currentCash > 0 ? currentCash / dailyBurnRate : 0
  const runwayMonths = runwayDays / 30

  return {
    data: {
      current_cash: currentCash,
      monthly_burn_rate: monthlyExpenses,
      daily_burn_rate: dailyBurnRate,
      runway_days: Math.floor(runwayDays),
      runway_months: Number(runwayMonths.toFixed(1))
    },
    metadata: {
      primitive: 'burn_rate',
      expense_count: expenseTransactions?.length || 0
    }
  }
}

/**
 * Accounts Receivable Aging Primitive
 * Analyzes AR aging buckets
 */
export async function arAgingPrimitive(context: ReportContext): Promise<PrimitiveResult> {
  const { supabase, parameters } = context
  const today = new Date()

  const { data: arTransactions, error } = await supabase
    .from('universal_transactions')
    .select(
      `
      id,
      transaction_code,
      total_amount,
      transaction_date,
      from_entity_id,
      core_entities!from_entity_id(entity_name)
    `
    )
    .eq('organization_id', parameters.organization_id)
    .like('smart_code', 'HERA.FIN.AR.%')
    .eq('status', 'pending')

  if (error) throw error

  // Categorize by age
  const agingBuckets = {
    current: { amount: 0, count: 0 },
    '1-30': { amount: 0, count: 0 },
    '31-60': { amount: 0, count: 0 },
    '61-90': { amount: 0, count: 0 },
    over_90: { amount: 0, count: 0 }
  }

  arTransactions?.forEach(transaction => {
    const daysOld = Math.floor(
      (today.getTime() - new Date(transaction.transaction_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const amount = transaction.total_amount || 0

    if (daysOld <= 0) {
      agingBuckets.current.amount += amount
      agingBuckets.current.count++
    } else if (daysOld <= 30) {
      agingBuckets['1-30'].amount += amount
      agingBuckets['1-30'].count++
    } else if (daysOld <= 60) {
      agingBuckets['31-60'].amount += amount
      agingBuckets['31-60'].count++
    } else if (daysOld <= 90) {
      agingBuckets['61-90'].amount += amount
      agingBuckets['61-90'].count++
    } else {
      agingBuckets.over_90.amount += amount
      agingBuckets.over_90.count++
    }
  })

  const totalAR = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0)

  return {
    data: {
      total_ar: totalAR,
      aging_buckets: agingBuckets,
      average_days_outstanding: calculateAverageDaysOutstanding(arTransactions),
      at_risk_amount: agingBuckets['61-90'].amount + agingBuckets.over_90.amount
    },
    metadata: {
      primitive: 'ar_aging',
      total_invoices: arTransactions?.length || 0
    }
  }
}

/**
 * Gross Margin Primitive
 * Calculates gross margin from revenue and COGS
 */
export async function grossMarginPrimitive(context: ReportContext): Promise<PrimitiveResult> {
  const { supabase, parameters } = context

  // Get revenue for the period
  const { data: revenue, error: revError } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', parameters.organization_id)
    .like('smart_code', 'HERA.%.SALE.%')
    .gte('transaction_date', parameters.period_start)
    .lte('transaction_date', parameters.period_end)

  if (revError) throw revError

  // Get COGS for the period
  const { data: cogs, error: cogsError } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', parameters.organization_id)
    .like('smart_code', 'HERA.%.COGS.%')
    .gte('transaction_date', parameters.period_start)
    .lte('transaction_date', parameters.period_end)

  if (cogsError) throw cogsError

  const totalRevenue = revenue?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
  const totalCOGS = Math.abs(cogs?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0)
  const grossProfit = totalRevenue - totalCOGS
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return {
    data: {
      revenue: totalRevenue,
      cogs: totalCOGS,
      gross_profit: grossProfit,
      gross_margin_percent: Number(grossMargin.toFixed(2))
    },
    metadata: {
      primitive: 'gross_margin',
      revenue_transactions: revenue?.length || 0,
      cogs_transactions: cogs?.length || 0
    }
  }
}

/**
 * Working Capital Primitive
 * Calculates working capital metrics
 */
export async function workingCapitalPrimitive(context: ReportContext): Promise<PrimitiveResult> {
  // Get current assets
  const cashResult = await cashPositionPrimitive(context)
  const arResult = await arAgingPrimitive(context)

  // Get current liabilities (simplified - would include more in production)
  const { supabase, parameters } = context

  const { data: apTransactions, error } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', parameters.organization_id)
    .like('smart_code', 'HERA.FIN.AP.%')
    .eq('status', 'pending')

  if (error) throw error

  const totalAP = Math.abs(apTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0)

  const currentAssets = cashResult.data.total_cash + arResult.data.total_ar
  const currentLiabilities = totalAP
  const workingCapital = currentAssets - currentLiabilities
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0

  return {
    data: {
      current_assets: currentAssets,
      current_liabilities: currentLiabilities,
      working_capital: workingCapital,
      current_ratio: Number(currentRatio.toFixed(2)),
      cash: cashResult.data.total_cash,
      accounts_receivable: arResult.data.total_ar,
      accounts_payable: totalAP
    },
    metadata: {
      primitive: 'working_capital',
      ap_count: apTransactions?.length || 0
    }
  }
}

// Helper function to calculate average days outstanding
function calculateAverageDaysOutstanding(transactions: any[]): number {
  if (!transactions || transactions.length === 0) return 0

  const today = new Date()
  const totalDays = transactions.reduce((sum, t) => {
    const daysOld = Math.floor(
      (today.getTime() - new Date(t.transaction_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    return sum + daysOld
  }, 0)

  return Math.floor(totalDays / transactions.length)
}

// Export all primitives
export const financeKPIPrimitives = {
  cashPosition: cashPositionPrimitive,
  revenueRunRate: revenueRunRatePrimitive,
  burnRate: burnRatePrimitive,
  arAging: arAgingPrimitive,
  grossMargin: grossMarginPrimitive,
  workingCapital: workingCapitalPrimitive
}
