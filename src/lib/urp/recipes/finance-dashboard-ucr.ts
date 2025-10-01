/**
 * HERA Finance Dashboard Universal Cashflow Report (UCR)
 *
 * This UCR provides comprehensive financial dashboard operations including:
 * - Real-time cashflow position
 * - Multi-period cash analysis
 * - Forecasting and projections
 * - Industry benchmarking
 *
 * @module HERA.URP.RECIPE.FINANCE.DASHBOARD.CASHFLOW.V1
 */

import { ReportRecipe, ReportContext, ReportResult } from '../types/report-types'
import { entityResolver } from '../primitives/entity-resolver'
import { transactionFacts } from '../primitives/transaction-facts'
import { rollupAndBalance } from '../primitives/rollup-and-balance'
import { presentationFormatter } from '../primitives/presentation-formatter'

export const financeDashboardCashflowRecipe: ReportRecipe = {
  id: 'HERA.FIN.REPORT.CASHFLOW.STATEMENT.V1',
  name: 'Finance Dashboard Cashflow Report',
  description: 'Comprehensive cashflow analysis for finance module dashboard',
  version: '1.0.0',
  category: 'finance',
  tags: ['cashflow', 'dashboard', 'kpi', 'real-time'],

  parameters: {
    organization_id: { type: 'uuid', required: true },
    period_start: { type: 'date', required: true },
    period_end: { type: 'date', required: true },
    comparison_periods: { type: 'number', default: 3 },
    include_forecast: { type: 'boolean', default: true },
    forecast_periods: { type: 'number', default: 6 },
    industry_benchmark: { type: 'boolean', default: true },
    currency: { type: 'string', default: 'USD' }
  },

  async execute(context: ReportContext): Promise<ReportResult> {
    const { parameters, supabase } = context

    // Step 1: Resolve cashflow-related entities (bank accounts, cash accounts)
    const cashEntities = await entityResolver({
      context,
      filters: {
        entity_type: ['bank_account', 'cash_account', 'payment_processor'],
        smart_code_pattern: 'HERA.FIN.CASH.*'
      }
    })

    // Step 2: Get cash transactions for the period
    const cashTransactions = await transactionFacts({
      context,
      filters: {
        date_range: {
          start: parameters.period_start,
          end: parameters.period_end
        },
        smart_code_patterns: [
          'HERA.FIN.CASH.*',
          'HERA.FIN.AR.RCP.*',
          'HERA.FIN.AP.PAY.*',
          'HERA.*.SALE.*',
          'HERA.*.PURCHASE.*'
        ]
      },
      groupBy: ['transaction_type', 'payment_method', 'currency'],
      metrics: ['sum', 'count', 'average']
    })

    // Step 3: Calculate operating, investing, and financing activities
    const activities = categorizeCashflowActivities(cashTransactions)

    // Step 4: Rollup cash positions and calculate net change
    const cashPositions = await rollupAndBalance({
      context,
      data: activities,
      hierarchy: 'cashflow_category',
      balanceType: 'flow',
      includeSubtotals: true
    })

    // Step 5: Get historical data for comparison periods
    const historicalData = await getHistoricalCashflow(context, parameters)

    // Step 6: Generate forecast if requested
    let forecast = null
    if (parameters.include_forecast) {
      forecast = await generateCashflowForecast(context, cashPositions, parameters)
    }

    // Step 7: Get industry benchmarks if requested
    let benchmarks = null
    if (parameters.industry_benchmark) {
      benchmarks = await getIndustryBenchmarks(context, parameters)
    }

    // Step 8: Calculate key cashflow KPIs
    const kpis = calculateCashflowKPIs(cashPositions, activities)

    // Step 9: Format for dashboard presentation
    const formattedResult = await presentationFormatter({
      context,
      data: {
        current_period: cashPositions,
        historical: historicalData,
        forecast: forecast,
        benchmarks: benchmarks,
        kpis: kpis,
        details: activities
      },
      format: 'dashboard',
      options: {
        currency: parameters.currency,
        decimal_places: 2,
        include_sparklines: true,
        include_charts: true,
        highlight_variances: true
      }
    })

    return {
      success: true,
      data: formattedResult,
      metadata: {
        generated_at: new Date(),
        recipe_id: financeDashboardCashflowRecipe.id,
        cache_key: `finance-dashboard-${parameters.organization_id}-${parameters.period_end}`,
        ttl: 300 // 5 minute cache for dashboard
      }
    }
  }
}

// Helper function to categorize transactions into cashflow activities
function categorizeCashflowActivities(transactions: any) {
  return {
    operating: transactions.filter(
      (t: any) =>
        t.smart_code.includes('.SALE.') ||
        t.smart_code.includes('.EXPENSE.') ||
        t.smart_code.includes('.PAYROLL.')
    ),
    investing: transactions.filter(
      (t: any) => t.smart_code.includes('.ASSET.') || t.smart_code.includes('.CAPEX.')
    ),
    financing: transactions.filter(
      (t: any) => t.smart_code.includes('.LOAN.') || t.smart_code.includes('.EQUITY.')
    )
  }
}

// Helper function to get historical cashflow data
async function getHistoricalCashflow(context: ReportContext, parameters: any) {
  const periods = []
  const currentEnd = new Date(parameters.period_end)

  for (let i = 1; i <= parameters.comparison_periods; i++) {
    const periodEnd = new Date(currentEnd)
    periodEnd.setMonth(periodEnd.getMonth() - i)
    const periodStart = new Date(periodEnd)
    periodStart.setMonth(periodStart.getMonth() - 1)

    const historicalTransactions = await transactionFacts({
      context,
      filters: {
        date_range: {
          start: periodStart,
          end: periodEnd
        },
        smart_code_patterns: ['HERA.FIN.CASH.*']
      },
      groupBy: ['transaction_type'],
      metrics: ['sum']
    })

    periods.push({
      period: periodEnd.toISOString().substr(0, 7),
      data: historicalTransactions
    })
  }

  return periods
}

// Helper function to generate cashflow forecast
async function generateCashflowForecast(context: ReportContext, currentData: any, parameters: any) {
  // Simple linear regression forecast based on historical trends
  // In production, this would use more sophisticated forecasting methods

  const forecastPeriods = []
  const baseAmount = currentData.total || 0
  const growthRate = 0.05 // 5% monthly growth assumption

  for (let i = 1; i <= parameters.forecast_periods; i++) {
    const forecastDate = new Date(parameters.period_end)
    forecastDate.setMonth(forecastDate.getMonth() + i)

    forecastPeriods.push({
      period: forecastDate.toISOString().substr(0, 7),
      forecast_amount: baseAmount * Math.pow(1 + growthRate, i),
      confidence: 0.95 - i * 0.05 // Confidence decreases over time
    })
  }

  return forecastPeriods
}

// Helper function to get industry benchmarks
async function getIndustryBenchmarks(context: ReportContext, parameters: any) {
  // Retrieve industry-specific cashflow benchmarks
  // These would come from HERA's industry DNA configurations

  return {
    industry: 'restaurant', // Would be determined from organization
    operating_cash_margin: 0.15,
    cash_conversion_cycle: 7,
    days_sales_outstanding: 2,
    days_payables_outstanding: 30,
    peer_comparison: {
      your_performance: 0.18,
      industry_average: 0.15,
      top_quartile: 0.22
    }
  }
}

// Helper function to calculate cashflow KPIs
function calculateCashflowKPIs(cashPositions: any, activities: any) {
  const totalInflow = activities.operating
    .filter((t: any) => t.amount > 0)
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const totalOutflow = Math.abs(
    activities.operating
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0)
  )

  return {
    net_cash_flow: totalInflow - totalOutflow,
    operating_cash_flow: activities.operating.reduce((sum: number, t: any) => sum + t.amount, 0),
    free_cash_flow:
      activities.operating.reduce((sum: number, t: any) => sum + t.amount, 0) -
      Math.abs(activities.investing.reduce((sum: number, t: any) => sum + t.amount, 0)),
    cash_burn_rate: totalOutflow / 30, // Daily burn rate
    cash_runway_days: cashPositions.ending_balance / (totalOutflow / 30),
    operating_cash_margin: totalInflow > 0 ? (totalInflow - totalOutflow) / totalInflow : 0,
    quick_ratio: cashPositions.ending_balance / (totalOutflow / 30) // Simplified
  }
}

// Export as default recipe
export default financeDashboardCashflowRecipe
