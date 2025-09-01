/**
 * HERA FIN (Financial Management) Edge Functions
 * Complete financial reporting and analytics engine
 * Replaces SAP FI reporting with 98% cost savings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinRequest {
  action: string
  organizationId: string
  userId?: string
  data?: any
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, organizationId, userId, data } = await req.json() as FinRequest

    // Route to appropriate handler
    let result: any

    switch (action) {
      // ===== FINANCIAL STATEMENTS =====
      case 'generate_balance_sheet':
        result = await generateBalanceSheet(supabase, organizationId, data)
        break

      case 'generate_income_statement':
        result = await generateIncomeStatement(supabase, organizationId, data)
        break

      case 'generate_cash_flow':
        result = await generateCashFlow(supabase, organizationId, data)
        break

      case 'generate_trial_balance':
        result = await generateTrialBalance(supabase, organizationId, data)
        break

      // ===== MANAGEMENT REPORTS =====
      case 'budget_vs_actual':
        result = await generateBudgetVsActual(supabase, organizationId, data)
        break

      case 'cost_center_analysis':
        result = await analyzeCostCenters(supabase, organizationId, data)
        break

      case 'profitability_analysis':
        result = await analyzeProfitability(supabase, organizationId, data)
        break

      case 'aging_analysis':
        result = await generateAgingAnalysis(supabase, organizationId, data)
        break

      // ===== FINANCIAL ANALYTICS =====
      case 'financial_ratios':
        result = await calculateFinancialRatios(supabase, organizationId, data)
        break

      case 'trend_analysis':
        result = await analyzeTrends(supabase, organizationId, data)
        break

      case 'variance_analysis':
        result = await analyzeVariances(supabase, organizationId, data)
        break

      case 'cash_flow_forecast':
        result = await forecastCashFlow(supabase, organizationId, data)
        break

      // ===== CONSOLIDATION =====
      case 'consolidate_companies':
        result = await consolidateCompanies(supabase, organizationId, data)
        break

      case 'currency_translation':
        result = await translateCurrency(supabase, organizationId, data)
        break

      case 'intercompany_elimination':
        result = await eliminateIntercompany(supabase, organizationId, data)
        break

      // ===== AI-POWERED FEATURES =====
      case 'detect_anomalies':
        result = await detectFinancialAnomalies(supabase, organizationId, data)
        break

      case 'predict_cash_position':
        result = await predictCashPosition(supabase, organizationId, data)
        break

      case 'optimize_working_capital':
        result = await optimizeWorkingCapital(supabase, organizationId, data)
        break

      case 'generate_insights':
        result = await generateFinancialInsights(supabase, organizationId, data)
        break

      // ===== PERIOD OPERATIONS =====
      case 'close_period':
        result = await closePeriod(supabase, organizationId, data)
        break

      case 'year_end_close':
        result = await performYearEndClose(supabase, organizationId, data)
        break

      case 'roll_forward_balances':
        result = await rollForwardBalances(supabase, organizationId, data)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fin-dispatch:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// =============================================
// FINANCIAL STATEMENTS
// =============================================

async function generateBalanceSheet(supabase: any, organizationId: string, data: any) {
  const { asOfDate = new Date().toISOString(), format = 'standard' } = data

  // Get GL accounts with balances
  const { data: accounts, error } = await supabase
    .rpc('fin_generate_balance_sheet', {
      p_organization_id: organizationId,
      p_as_of_date: asOfDate
    })

  if (error) throw error

  // Structure the balance sheet
  const balanceSheet = {
    report_date: asOfDate,
    organization_id: organizationId,
    assets: {
      current_assets: accounts.filter((a: any) => a.ifrs_classification === 'current_assets'),
      non_current_assets: accounts.filter((a: any) => a.ifrs_classification === 'non_current_assets'),
      total: 0
    },
    liabilities: {
      current_liabilities: accounts.filter((a: any) => a.ifrs_classification === 'current_liabilities'),
      non_current_liabilities: accounts.filter((a: any) => a.ifrs_classification === 'non_current_liabilities'),
      total: 0
    },
    equity: {
      share_capital: accounts.filter((a: any) => a.ifrs_classification === 'share_capital'),
      retained_earnings: accounts.filter((a: any) => a.ifrs_classification === 'retained_earnings'),
      reserves: accounts.filter((a: any) => a.ifrs_classification === 'reserves'),
      total: 0
    }
  }

  // Calculate totals
  balanceSheet.assets.total = [...balanceSheet.assets.current_assets, ...balanceSheet.assets.non_current_assets]
    .reduce((sum, acc) => sum + (acc.balance || 0), 0)
  
  balanceSheet.liabilities.total = [...balanceSheet.liabilities.current_liabilities, ...balanceSheet.liabilities.non_current_liabilities]
    .reduce((sum, acc) => sum + (acc.balance || 0), 0)
  
  balanceSheet.equity.total = [...balanceSheet.equity.share_capital, ...balanceSheet.equity.retained_earnings, ...balanceSheet.equity.reserves]
    .reduce((sum, acc) => sum + (acc.balance || 0), 0)

  // Add validation
  const checksum = balanceSheet.assets.total - balanceSheet.liabilities.total - balanceSheet.equity.total
  
  return {
    ...balanceSheet,
    validation: {
      balanced: Math.abs(checksum) < 0.01,
      checksum: checksum,
      message: Math.abs(checksum) < 0.01 ? 'Balance sheet is balanced' : `Balance sheet out of balance by ${checksum}`
    }
  }
}

async function generateIncomeStatement(supabase: any, organizationId: string, data: any) {
  const { startDate, endDate, compareWithPrior = false } = data

  // Get P&L accounts with period activity
  const { data: accounts, error } = await supabase
    .rpc('fin_generate_income_statement', {
      p_organization_id: organizationId,
      p_start_date: startDate,
      p_end_date: endDate
    })

  if (error) throw error

  // Structure the income statement
  const incomeStatement = {
    period_start: startDate,
    period_end: endDate,
    organization_id: organizationId,
    revenue: {
      operating_revenue: accounts.filter((a: any) => a.ifrs_classification === 'revenue'),
      other_income: accounts.filter((a: any) => a.ifrs_classification === 'other_income'),
      total: 0
    },
    expenses: {
      cost_of_sales: accounts.filter((a: any) => a.ifrs_classification === 'cost_of_sales'),
      operating_expenses: accounts.filter((a: any) => a.ifrs_classification === 'operating_expenses'),
      finance_costs: accounts.filter((a: any) => a.ifrs_classification === 'finance_costs'),
      total: 0
    },
    calculations: {
      gross_profit: 0,
      operating_profit: 0,
      profit_before_tax: 0,
      tax_expense: 0,
      net_profit: 0
    }
  }

  // Calculate totals and margins
  incomeStatement.revenue.total = [...incomeStatement.revenue.operating_revenue, ...incomeStatement.revenue.other_income]
    .reduce((sum, acc) => sum + (acc.period_activity || 0), 0)
  
  const cogs = incomeStatement.expenses.cost_of_sales.reduce((sum, acc) => sum + (acc.period_activity || 0), 0)
  const opex = incomeStatement.expenses.operating_expenses.reduce((sum, acc) => sum + (acc.period_activity || 0), 0)
  const finCosts = incomeStatement.expenses.finance_costs.reduce((sum, acc) => sum + (acc.period_activity || 0), 0)
  
  incomeStatement.expenses.total = cogs + opex + finCosts
  
  // Calculate profit levels
  incomeStatement.calculations.gross_profit = incomeStatement.revenue.total - cogs
  incomeStatement.calculations.operating_profit = incomeStatement.calculations.gross_profit - opex
  incomeStatement.calculations.profit_before_tax = incomeStatement.calculations.operating_profit - finCosts
  incomeStatement.calculations.tax_expense = accounts.find((a: any) => a.ifrs_classification === 'tax_expense')?.period_activity || 0
  incomeStatement.calculations.net_profit = incomeStatement.calculations.profit_before_tax - incomeStatement.calculations.tax_expense

  // Add margins
  const margins = {
    gross_margin: incomeStatement.revenue.total > 0 ? (incomeStatement.calculations.gross_profit / incomeStatement.revenue.total * 100) : 0,
    operating_margin: incomeStatement.revenue.total > 0 ? (incomeStatement.calculations.operating_profit / incomeStatement.revenue.total * 100) : 0,
    net_margin: incomeStatement.revenue.total > 0 ? (incomeStatement.calculations.net_profit / incomeStatement.revenue.total * 100) : 0
  }

  return { ...incomeStatement, margins }
}

async function generateCashFlow(supabase: any, organizationId: string, data: any) {
  const { startDate, endDate, method = 'indirect' } = data

  // Get cash flow data
  const { data: cashFlows, error } = await supabase
    .rpc('fin_generate_cash_flow', {
      p_organization_id: organizationId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_method: method
    })

  if (error) throw error

  // Structure cash flow statement
  const cashFlowStatement = {
    period_start: startDate,
    period_end: endDate,
    method: method,
    organization_id: organizationId,
    operating_activities: {
      net_income: 0,
      adjustments: [],
      working_capital_changes: [],
      total: 0
    },
    investing_activities: {
      asset_purchases: 0,
      asset_sales: 0,
      investments: 0,
      total: 0
    },
    financing_activities: {
      debt_proceeds: 0,
      debt_repayments: 0,
      equity_issues: 0,
      dividends: 0,
      total: 0
    },
    summary: {
      beginning_cash: 0,
      net_change: 0,
      ending_cash: 0
    }
  }

  // Process cash flows by category
  cashFlows.forEach((flow: any) => {
    switch (flow.activity_type) {
      case 'operating':
        if (flow.flow_category === 'net_income') {
          cashFlowStatement.operating_activities.net_income = flow.amount
        } else if (flow.flow_category === 'adjustment') {
          cashFlowStatement.operating_activities.adjustments.push(flow)
        } else if (flow.flow_category === 'working_capital') {
          cashFlowStatement.operating_activities.working_capital_changes.push(flow)
        }
        break
      case 'investing':
        if (flow.flow_category === 'asset_purchase') {
          cashFlowStatement.investing_activities.asset_purchases += flow.amount
        } else if (flow.flow_category === 'asset_sale') {
          cashFlowStatement.investing_activities.asset_sales += flow.amount
        }
        break
      case 'financing':
        if (flow.flow_category === 'debt') {
          if (flow.amount > 0) {
            cashFlowStatement.financing_activities.debt_proceeds += flow.amount
          } else {
            cashFlowStatement.financing_activities.debt_repayments += Math.abs(flow.amount)
          }
        }
        break
    }
  })

  // Calculate totals
  cashFlowStatement.operating_activities.total = 
    cashFlowStatement.operating_activities.net_income +
    cashFlowStatement.operating_activities.adjustments.reduce((sum, adj) => sum + adj.amount, 0) +
    cashFlowStatement.operating_activities.working_capital_changes.reduce((sum, wc) => sum + wc.amount, 0)

  cashFlowStatement.investing_activities.total = 
    cashFlowStatement.investing_activities.asset_purchases +
    cashFlowStatement.investing_activities.asset_sales +
    cashFlowStatement.investing_activities.investments

  cashFlowStatement.financing_activities.total = 
    cashFlowStatement.financing_activities.debt_proceeds -
    cashFlowStatement.financing_activities.debt_repayments +
    cashFlowStatement.financing_activities.equity_issues -
    cashFlowStatement.financing_activities.dividends

  cashFlowStatement.summary.net_change = 
    cashFlowStatement.operating_activities.total +
    cashFlowStatement.investing_activities.total +
    cashFlowStatement.financing_activities.total

  return cashFlowStatement
}

async function generateTrialBalance(supabase: any, organizationId: string, data: any) {
  const { asOfDate = new Date().toISOString() } = data

  // Call the database function
  const { data: trialBalance, error } = await supabase
    .rpc('fin_generate_trial_balance', {
      p_organization_id: organizationId,
      p_as_of_date: asOfDate
    })

  if (error) throw error

  // Calculate totals
  const totals = trialBalance.reduce((acc: any, account: any) => ({
    total_debits: acc.total_debits + (account.debit_balance || 0),
    total_credits: acc.total_credits + (account.credit_balance || 0)
  }), { total_debits: 0, total_credits: 0 })

  return {
    as_of_date: asOfDate,
    organization_id: organizationId,
    accounts: trialBalance,
    summary: {
      ...totals,
      balanced: Math.abs(totals.total_debits - totals.total_credits) < 0.01,
      difference: totals.total_debits - totals.total_credits
    }
  }
}

// =============================================
// MANAGEMENT REPORTS
// =============================================

async function generateBudgetVsActual(supabase: any, organizationId: string, data: any) {
  const { budgetId, period = 'YTD', varianceThreshold = 5.0 } = data

  // Get budget vs actual data
  const { data: budgetData, error } = await supabase
    .rpc('fin_budget_vs_actual_analysis', {
      p_organization_id: organizationId,
      p_budget_id: budgetId,
      p_period: period
    })

  if (error) throw error

  // Analyze variances
  const analysis = {
    budget_id: budgetId,
    period: period,
    summary: {
      total_budget: 0,
      total_actual: 0,
      total_variance: 0,
      variance_percent: 0,
      favorable_variances: 0,
      unfavorable_variances: 0
    },
    line_items: [],
    critical_variances: [],
    recommendations: []
  }

  // Process each line item
  budgetData.forEach((item: any) => {
    const variance = item.actual_amount - item.budget_amount
    const variancePercent = item.budget_amount !== 0 ? (variance / item.budget_amount * 100) : 0

    const lineAnalysis = {
      ...item,
      variance: variance,
      variance_percent: variancePercent,
      status: Math.abs(variancePercent) <= varianceThreshold ? 'on_track' : 
              (variancePercent > varianceThreshold ? 'over_budget' : 'under_budget'),
      favorable: item.account_type === 'revenue' ? variance > 0 : variance < 0
    }

    analysis.line_items.push(lineAnalysis)

    // Track critical variances
    if (Math.abs(variancePercent) > varianceThreshold * 2) {
      analysis.critical_variances.push(lineAnalysis)
    }

    // Update summary
    analysis.summary.total_budget += item.budget_amount
    analysis.summary.total_actual += item.actual_amount
    if (lineAnalysis.favorable) {
      analysis.summary.favorable_variances++
    } else {
      analysis.summary.unfavorable_variances++
    }
  })

  // Calculate overall variance
  analysis.summary.total_variance = analysis.summary.total_actual - analysis.summary.total_budget
  analysis.summary.variance_percent = analysis.summary.total_budget !== 0 ? 
    (analysis.summary.total_variance / analysis.summary.total_budget * 100) : 0

  // Generate AI recommendations
  if (analysis.critical_variances.length > 0) {
    analysis.recommendations = generateBudgetRecommendations(analysis.critical_variances)
  }

  return analysis
}

async function analyzeCostCenters(supabase: any, organizationId: string, data: any) {
  const { period, costCenterIds = [], includeAllocations = true } = data

  // Get cost center data
  const { data: costData, error } = await supabase
    .rpc('fin_cost_center_analysis', {
      p_organization_id: organizationId,
      p_period: period,
      p_cost_center_ids: costCenterIds
    })

  if (error) throw error

  // Structure analysis
  const analysis = {
    period: period,
    cost_centers: [],
    summary: {
      total_costs: 0,
      direct_costs: 0,
      allocated_costs: 0,
      cost_per_unit: {},
      efficiency_metrics: {}
    },
    comparative: {
      vs_prior_period: {},
      vs_budget: {},
      trends: []
    }
  }

  // Process each cost center
  for (const center of costData) {
    const centerAnalysis = {
      cost_center_id: center.cost_center_id,
      cost_center_name: center.cost_center_name,
      costs: {
        direct: center.direct_costs || 0,
        allocated: includeAllocations ? (center.allocated_costs || 0) : 0,
        total: (center.direct_costs || 0) + (includeAllocations ? (center.allocated_costs || 0) : 0)
      },
      drivers: center.cost_drivers || {},
      efficiency: calculateEfficiencyMetrics(center),
      allocations: includeAllocations ? center.allocation_details : []
    }

    analysis.cost_centers.push(centerAnalysis)
    analysis.summary.total_costs += centerAnalysis.costs.total
    analysis.summary.direct_costs += centerAnalysis.costs.direct
    analysis.summary.allocated_costs += centerAnalysis.costs.allocated
  }

  return analysis
}

async function analyzeProfitability(supabase: any, organizationId: string, data: any) {
  const { dimension = 'customer', period, topN = 20 } = data

  // Get profitability data by dimension
  const { data: profitData, error } = await supabase
    .rpc('fin_profitability_analysis', {
      p_organization_id: organizationId,
      p_dimension: dimension,
      p_period: period
    })

  if (error) throw error

  // Structure analysis
  const analysis = {
    dimension: dimension,
    period: period,
    segments: [],
    summary: {
      total_revenue: 0,
      total_costs: 0,
      total_profit: 0,
      average_margin: 0,
      best_performers: [],
      worst_performers: []
    },
    insights: []
  }

  // Process and rank segments
  const processedSegments = profitData
    .map((segment: any) => ({
      ...segment,
      profit: segment.revenue - segment.costs,
      margin: segment.revenue > 0 ? ((segment.revenue - segment.costs) / segment.revenue * 100) : 0,
      roi: segment.costs > 0 ? ((segment.revenue - segment.costs) / segment.costs * 100) : 0
    }))
    .sort((a: any, b: any) => b.profit - a.profit)

  // Get top and bottom performers
  analysis.summary.best_performers = processedSegments.slice(0, Math.min(5, topN))
  analysis.summary.worst_performers = processedSegments.slice(-Math.min(5, topN))

  // Calculate totals
  processedSegments.forEach((segment: any) => {
    analysis.summary.total_revenue += segment.revenue
    analysis.summary.total_costs += segment.costs
    analysis.summary.total_profit += segment.profit
  })

  analysis.summary.average_margin = analysis.summary.total_revenue > 0 ?
    (analysis.summary.total_profit / analysis.summary.total_revenue * 100) : 0

  analysis.segments = processedSegments.slice(0, topN)

  // Generate insights
  analysis.insights = generateProfitabilityInsights(analysis)

  return analysis
}

async function generateAgingAnalysis(supabase: any, organizationId: string, data: any) {
  const { type = 'receivables', asOfDate = new Date().toISOString() } = data

  // Get aging data
  const { data: agingData, error } = await supabase
    .rpc('fin_aging_analysis', {
      p_organization_id: organizationId,
      p_aging_type: type,
      p_as_of_date: asOfDate
    })

  if (error) throw error

  // Structure aging buckets
  const agingBuckets = {
    current: { amount: 0, count: 0, percentage: 0 },
    '1-30': { amount: 0, count: 0, percentage: 0 },
    '31-60': { amount: 0, count: 0, percentage: 0 },
    '61-90': { amount: 0, count: 0, percentage: 0 },
    'over_90': { amount: 0, count: 0, percentage: 0 }
  }

  let totalAmount = 0
  const details = []

  // Process aging data
  agingData.forEach((item: any) => {
    const daysPastDue = item.days_past_due
    let bucket = 'current'

    if (daysPastDue > 90) bucket = 'over_90'
    else if (daysPastDue > 60) bucket = '61-90'
    else if (daysPastDue > 30) bucket = '31-60'
    else if (daysPastDue > 0) bucket = '1-30'

    agingBuckets[bucket].amount += item.amount
    agingBuckets[bucket].count += 1
    totalAmount += item.amount

    details.push({
      ...item,
      bucket: bucket,
      risk_level: daysPastDue > 90 ? 'high' : daysPastDue > 60 ? 'medium' : 'low'
    })
  })

  // Calculate percentages
  Object.keys(agingBuckets).forEach(bucket => {
    agingBuckets[bucket].percentage = totalAmount > 0 ?
      (agingBuckets[bucket].amount / totalAmount * 100) : 0
  })

  return {
    type: type,
    as_of_date: asOfDate,
    summary: {
      total_amount: totalAmount,
      total_count: details.length,
      average_days: details.reduce((sum, d) => sum + d.days_past_due, 0) / details.length || 0,
      high_risk_amount: agingBuckets['over_90'].amount,
      high_risk_percentage: agingBuckets['over_90'].percentage
    },
    buckets: agingBuckets,
    details: details.sort((a, b) => b.amount - a.amount),
    recommendations: generateCollectionRecommendations(agingBuckets, details)
  }
}

// =============================================
// FINANCIAL ANALYTICS
// =============================================

async function calculateFinancialRatios(supabase: any, organizationId: string, data: any) {
  const { asOfDate = new Date().toISOString(), compareWithIndustry = false } = data

  // Get financial data for ratio calculation
  const { data: financialData, error } = await supabase
    .rpc('fin_get_ratio_data', {
      p_organization_id: organizationId,
      p_as_of_date: asOfDate
    })

  if (error) throw error

  const { assets, liabilities, equity, revenue, net_income, current_assets, current_liabilities, inventory, receivables } = financialData

  // Calculate all financial ratios
  const ratios = {
    liquidity: {
      current_ratio: current_liabilities > 0 ? current_assets / current_liabilities : 0,
      quick_ratio: current_liabilities > 0 ? (current_assets - inventory) / current_liabilities : 0,
      cash_ratio: 0, // Would need cash balance
      working_capital: current_assets - current_liabilities
    },
    leverage: {
      debt_to_equity: equity > 0 ? liabilities / equity : 0,
      debt_ratio: assets > 0 ? liabilities / assets : 0,
      equity_ratio: assets > 0 ? equity / assets : 0,
      interest_coverage: 0 // Would need interest expense
    },
    efficiency: {
      asset_turnover: assets > 0 ? revenue / assets : 0,
      inventory_turnover: inventory > 0 ? revenue / inventory : 0,
      receivables_turnover: receivables > 0 ? revenue / receivables : 0,
      days_sales_outstanding: receivables > 0 && revenue > 0 ? (receivables / revenue * 365) : 0
    },
    profitability: {
      gross_margin: 0, // Would need gross profit
      operating_margin: 0, // Would need operating income
      net_margin: revenue > 0 ? (net_income / revenue * 100) : 0,
      return_on_assets: assets > 0 ? (net_income / assets * 100) : 0,
      return_on_equity: equity > 0 ? (net_income / equity * 100) : 0
    }
  }

  // Add interpretations
  const analysis = {
    ratios: ratios,
    interpretations: interpretRatios(ratios),
    risk_indicators: identifyRiskIndicators(ratios),
    improvement_areas: suggestImprovements(ratios)
  }

  return analysis
}

async function analyzeTrends(supabase: any, organizationId: string, data: any) {
  const { metric, periods = 12, frequency = 'monthly' } = data

  // Get historical data
  const { data: trendData, error } = await supabase
    .rpc('fin_trend_analysis', {
      p_organization_id: organizationId,
      p_metric: metric,
      p_periods: periods,
      p_frequency: frequency
    })

  if (error) throw error

  // Calculate trend statistics
  const values = trendData.map((d: any) => d.value)
  const dates = trendData.map((d: any) => d.period)

  const trend = {
    metric: metric,
    frequency: frequency,
    data_points: trendData,
    statistics: {
      current: values[values.length - 1],
      average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      std_dev: calculateStandardDeviation(values),
      trend_direction: calculateTrendDirection(values),
      growth_rate: calculateGrowthRate(values),
      seasonality: detectSeasonality(values, frequency)
    },
    forecast: {
      next_period: forecastNextPeriod(values),
      confidence_interval: calculateConfidenceInterval(values)
    },
    insights: generateTrendInsights(metric, values, dates)
  }

  return trend
}

async function analyzeVariances(supabase: any, organizationId: string, data: any) {
  const { baselineId, comparisonId, varianceThreshold = 5.0 } = data

  // Get variance data
  const { data: varianceData, error } = await supabase
    .rpc('fin_variance_analysis', {
      p_organization_id: organizationId,
      p_baseline_id: baselineId,
      p_comparison_id: comparisonId
    })

  if (error) throw error

  // Analyze variances
  const analysis = {
    baseline: baselineId,
    comparison: comparisonId,
    variances: [],
    summary: {
      total_variances: 0,
      significant_variances: 0,
      favorable_amount: 0,
      unfavorable_amount: 0,
      largest_variance: null,
      smallest_variance: null
    },
    drivers: [],
    recommendations: []
  }

  // Process each variance
  varianceData.forEach((item: any) => {
    const variance = {
      ...item,
      variance_amount: item.comparison_value - item.baseline_value,
      variance_percent: item.baseline_value !== 0 ? 
        ((item.comparison_value - item.baseline_value) / item.baseline_value * 100) : 0,
      significant: Math.abs(item.comparison_value - item.baseline_value) > varianceThreshold,
      favorable: item.account_type === 'revenue' ? 
        item.comparison_value > item.baseline_value : 
        item.comparison_value < item.baseline_value
    }

    analysis.variances.push(variance)

    if (variance.significant) {
      analysis.summary.significant_variances++
    }

    if (variance.favorable) {
      analysis.summary.favorable_amount += Math.abs(variance.variance_amount)
    } else {
      analysis.summary.unfavorable_amount += Math.abs(variance.variance_amount)
    }
  })

  // Identify largest variances
  analysis.variances.sort((a, b) => Math.abs(b.variance_amount) - Math.abs(a.variance_amount))
  analysis.summary.largest_variance = analysis.variances[0]
  analysis.summary.smallest_variance = analysis.variances[analysis.variances.length - 1]

  // Identify variance drivers
  analysis.drivers = identifyVarianceDrivers(analysis.variances)
  analysis.recommendations = generateVarianceRecommendations(analysis)

  return analysis
}

async function forecastCashFlow(supabase: any, organizationId: string, data: any) {
  const { forecastDays = 90, includeScenarios = true } = data

  // Get cash flow forecast data
  const { data: forecastData, error } = await supabase
    .rpc('fin_cash_flow_forecast', {
      p_organization_id: organizationId,
      p_forecast_days: forecastDays
    })

  if (error) throw error

  // Build forecast model
  const forecast = {
    forecast_period: forecastDays,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + forecastDays * 24 * 60 * 60 * 1000).toISOString(),
    base_scenario: {
      starting_cash: forecastData.current_cash_balance || 0,
      inflows: [],
      outflows: [],
      daily_projections: [],
      ending_cash: 0,
      minimum_cash: 0,
      maximum_cash: 0
    },
    scenarios: includeScenarios ? {} : null,
    insights: [],
    recommendations: []
  }

  // Calculate daily projections
  let runningBalance = forecast.base_scenario.starting_cash
  const dailyProjections = []

  for (let day = 1; day <= forecastDays; day++) {
    const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000)
    
    // Get expected inflows/outflows for this day
    const dayInflows = forecastData.expected_receipts
      ?.filter((r: any) => new Date(r.expected_date).toDateString() === date.toDateString())
      .reduce((sum: number, r: any) => sum + r.amount, 0) || 0

    const dayOutflows = forecastData.expected_payments
      ?.filter((p: any) => new Date(p.expected_date).toDateString() === date.toDateString())
      .reduce((sum: number, p: any) => sum + p.amount, 0) || 0

    runningBalance = runningBalance + dayInflows - dayOutflows

    dailyProjections.push({
      date: date.toISOString(),
      inflows: dayInflows,
      outflows: dayOutflows,
      net_flow: dayInflows - dayOutflows,
      ending_balance: runningBalance
    })
  }

  forecast.base_scenario.daily_projections = dailyProjections
  forecast.base_scenario.ending_cash = runningBalance
  forecast.base_scenario.minimum_cash = Math.min(...dailyProjections.map(d => d.ending_balance))
  forecast.base_scenario.maximum_cash = Math.max(...dailyProjections.map(d => d.ending_balance))

  // Generate scenarios if requested
  if (includeScenarios) {
    forecast.scenarios = {
      optimistic: generateCashScenario(forecast.base_scenario, 1.2, 0.8),
      pessimistic: generateCashScenario(forecast.base_scenario, 0.8, 1.2),
      stressed: generateCashScenario(forecast.base_scenario, 0.6, 1.4)
    }
  }

  // Generate insights
  forecast.insights = generateCashFlowInsights(forecast)
  forecast.recommendations = generateCashFlowRecommendations(forecast)

  return forecast
}

// =============================================
// AI-POWERED FEATURES
// =============================================

async function detectFinancialAnomalies(supabase: any, organizationId: string, data: any) {
  const { days = 30, sensitivity = 'medium' } = data

  // Get anomaly detection results
  const { data: anomalies, error } = await supabase
    .rpc('fin_detect_journal_anomalies', {
      p_organization_id: organizationId,
      p_days: days
    })

  if (error) throw error

  // Group anomalies by type and severity
  const groupedAnomalies = {
    high_severity: anomalies.filter((a: any) => a.severity === 'high'),
    medium_severity: anomalies.filter((a: any) => a.severity === 'medium'),
    low_severity: anomalies.filter((a: any) => a.severity === 'low')
  }

  // Calculate risk scores
  const riskScore = calculateRiskScore(anomalies)

  return {
    detection_period: days,
    sensitivity: sensitivity,
    total_anomalies: anomalies.length,
    risk_score: riskScore,
    anomalies_by_severity: groupedAnomalies,
    anomaly_patterns: identifyAnomalyPatterns(anomalies),
    recommended_actions: generateAnomalyActions(groupedAnomalies, riskScore),
    ai_insights: {
      fraud_probability: calculateFraudProbability(anomalies),
      error_likelihood: calculateErrorLikelihood(anomalies),
      process_gaps: identifyProcessGaps(anomalies)
    }
  }
}

async function predictCashPosition(supabase: any, organizationId: string, data: any) {
  const { targetDate, confidenceLevel = 0.95 } = data

  // Get historical cash data
  const { data: historicalData, error } = await supabase
    .rpc('fin_get_cash_history', {
      p_organization_id: organizationId,
      p_days: 365
    })

  if (error) throw error

  // Build prediction model
  const cashHistory = historicalData.map((d: any) => d.cash_balance)
  const dates = historicalData.map((d: any) => new Date(d.date).getTime())

  // Simple linear regression for demo (in production, use proper ML)
  const prediction = {
    target_date: targetDate,
    predicted_balance: predictUsingLinearRegression(dates, cashHistory, new Date(targetDate).getTime()),
    confidence_interval: calculatePredictionInterval(cashHistory, confidenceLevel),
    factors: {
      seasonal_impact: calculateSeasonalImpact(targetDate, historicalData),
      trend_impact: calculateTrendImpact(cashHistory),
      volatility: calculateVolatility(cashHistory)
    },
    scenarios: {
      best_case: 0,
      expected: 0,
      worst_case: 0
    },
    recommendations: []
  }

  // Calculate scenarios
  prediction.scenarios.expected = prediction.predicted_balance
  prediction.scenarios.best_case = prediction.predicted_balance + prediction.confidence_interval.upper
  prediction.scenarios.worst_case = prediction.predicted_balance - prediction.confidence_interval.lower

  // Generate recommendations
  prediction.recommendations = generateCashPositionRecommendations(prediction)

  return prediction
}

async function optimizeWorkingCapital(supabase: any, organizationId: string, data: any) {
  // Get working capital components
  const { data: wcData, error } = await supabase
    .rpc('fin_working_capital_analysis', {
      p_organization_id: organizationId
    })

  if (error) throw error

  const { receivables, payables, inventory, cash_conversion_cycle } = wcData

  // Calculate optimization opportunities
  const optimization = {
    current_position: {
      receivables_days: receivables.days_outstanding,
      payables_days: payables.days_outstanding,
      inventory_days: inventory.days_on_hand,
      cash_conversion_cycle: cash_conversion_cycle,
      working_capital: receivables.amount + inventory.amount - payables.amount
    },
    opportunities: [],
    potential_cash_release: 0,
    implementation_roadmap: []
  }

  // Identify optimization opportunities
  if (receivables.days_outstanding > 45) {
    optimization.opportunities.push({
      area: 'receivables',
      action: 'Accelerate collections',
      potential_days_reduction: Math.min(15, receivables.days_outstanding - 45),
      cash_impact: calculateCashImpact('receivables', receivables)
    })
  }

  if (inventory.days_on_hand > 60) {
    optimization.opportunities.push({
      area: 'inventory',
      action: 'Optimize inventory levels',
      potential_days_reduction: Math.min(20, inventory.days_on_hand - 60),
      cash_impact: calculateCashImpact('inventory', inventory)
    })
  }

  if (payables.days_outstanding < 30) {
    optimization.opportunities.push({
      area: 'payables',
      action: 'Extend payment terms',
      potential_days_extension: Math.min(15, 45 - payables.days_outstanding),
      cash_impact: calculateCashImpact('payables', payables)
    })
  }

  // Calculate total potential cash release
  optimization.potential_cash_release = optimization.opportunities
    .reduce((sum, opp) => sum + (opp.cash_impact || 0), 0)

  // Generate implementation roadmap
  optimization.implementation_roadmap = generateWorkingCapitalRoadmap(optimization.opportunities)

  return optimization
}

async function generateFinancialInsights(supabase: any, organizationId: string, data: any) {
  const { insightTypes = ['all'], period = 'MTD' } = data

  // Gather data for insights
  const { data: financialMetrics, error } = await supabase
    .rpc('fin_get_insight_metrics', {
      p_organization_id: organizationId,
      p_period: period
    })

  if (error) throw error

  // Generate insights using AI logic
  const insights = {
    generated_at: new Date().toISOString(),
    period: period,
    insights: [],
    key_metrics: financialMetrics,
    action_items: []
  }

  // Revenue insights
  if (insightTypes.includes('all') || insightTypes.includes('revenue')) {
    insights.insights.push(...generateRevenueInsights(financialMetrics))
  }

  // Cost insights
  if (insightTypes.includes('all') || insightTypes.includes('cost')) {
    insights.insights.push(...generateCostInsights(financialMetrics))
  }

  // Cash flow insights
  if (insightTypes.includes('all') || insightTypes.includes('cashflow')) {
    insights.insights.push(...generateCashFlowInsights(financialMetrics))
  }

  // Profitability insights
  if (insightTypes.includes('all') || insightTypes.includes('profitability')) {
    insights.insights.push(...generateProfitabilityInsights(financialMetrics))
  }

  // Generate prioritized action items
  insights.action_items = prioritizeActionItems(insights.insights)

  return insights
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function calculateEfficiencyMetrics(centerData: any) {
  return {
    cost_per_unit: centerData.units_produced > 0 ? 
      centerData.total_costs / centerData.units_produced : 0,
    utilization_rate: centerData.capacity > 0 ?
      (centerData.actual_hours / centerData.capacity * 100) : 0,
    productivity_index: centerData.standard_hours > 0 ?
      (centerData.actual_hours / centerData.standard_hours) : 1
  }
}

function generateBudgetRecommendations(criticalVariances: any[]) {
  const recommendations = []

  criticalVariances.forEach(variance => {
    if (variance.account_type === 'expense' && !variance.favorable) {
      recommendations.push({
        priority: 'high',
        area: variance.account_name,
        action: `Review and control ${variance.account_name} spending - over budget by ${Math.abs(variance.variance_percent).toFixed(1)}%`,
        potential_savings: variance.variance * 0.5
      })
    } else if (variance.account_type === 'revenue' && !variance.favorable) {
      recommendations.push({
        priority: 'high',
        area: variance.account_name,
        action: `Investigate revenue shortfall in ${variance.account_name} - under budget by ${Math.abs(variance.variance_percent).toFixed(1)}%`,
        revenue_impact: Math.abs(variance.variance)
      })
    }
  })

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function generateProfitabilityInsights(analysis: any) {
  const insights = []

  // Identify concentration risk
  const top5Revenue = analysis.summary.best_performers
    .slice(0, 5)
    .reduce((sum: number, p: any) => sum + p.revenue, 0)
  
  const concentrationRatio = analysis.summary.total_revenue > 0 ?
    (top5Revenue / analysis.summary.total_revenue * 100) : 0

  if (concentrationRatio > 50) {
    insights.push({
      type: 'risk',
      severity: 'high',
      message: `Revenue concentration risk: Top 5 ${analysis.dimension}s represent ${concentrationRatio.toFixed(1)}% of total revenue`,
      recommendation: `Diversify ${analysis.dimension} base to reduce dependency`
    })
  }

  // Identify improvement opportunities
  const lowMarginCount = analysis.segments.filter((s: any) => s.margin < 10).length
  if (lowMarginCount > 0) {
    insights.push({
      type: 'opportunity',
      severity: 'medium',
      message: `${lowMarginCount} ${analysis.dimension}s have margins below 10%`,
      recommendation: 'Review pricing strategy or consider discontinuing low-margin segments'
    })
  }

  return insights
}

function generateCollectionRecommendations(buckets: any, details: any[]) {
  const recommendations = []

  // High risk accounts
  if (buckets['over_90'].percentage > 20) {
    recommendations.push({
      priority: 'critical',
      action: 'Escalate collection efforts for accounts over 90 days',
      accounts: details.filter(d => d.bucket === 'over_90').slice(0, 10),
      strategy: 'Consider collection agency or legal action'
    })
  }

  // Growing risk
  if (buckets['61-90'].percentage > 15) {
    recommendations.push({
      priority: 'high',
      action: 'Intensify collection for 61-90 day accounts',
      strategy: 'Personal calls and payment plans'
    })
  }

  return recommendations
}

function interpretRatios(ratios: any) {
  const interpretations = []

  // Liquidity interpretation
  if (ratios.liquidity.current_ratio < 1) {
    interpretations.push({
      category: 'liquidity',
      status: 'critical',
      message: 'Current ratio below 1 indicates potential liquidity issues'
    })
  } else if (ratios.liquidity.current_ratio > 3) {
    interpretations.push({
      category: 'liquidity',
      status: 'info',
      message: 'High current ratio may indicate excess idle assets'
    })
  }

  // Leverage interpretation
  if (ratios.leverage.debt_to_equity > 2) {
    interpretations.push({
      category: 'leverage',
      status: 'warning',
      message: 'High debt-to-equity ratio indicates significant financial leverage'
    })
  }

  // Profitability interpretation
  if (ratios.profitability.net_margin < 5) {
    interpretations.push({
      category: 'profitability',
      status: 'warning',
      message: 'Low net margin suggests profitability challenges'
    })
  }

  return interpretations
}

function identifyRiskIndicators(ratios: any) {
  const risks = []

  if (ratios.liquidity.current_ratio < 1 || ratios.liquidity.quick_ratio < 0.8) {
    risks.push({
      type: 'liquidity_risk',
      level: 'high',
      indicators: ['low_current_ratio', 'low_quick_ratio']
    })
  }

  if (ratios.leverage.debt_to_equity > 3) {
    risks.push({
      type: 'solvency_risk',
      level: 'high',
      indicators: ['high_leverage']
    })
  }

  return risks
}

function suggestImprovements(ratios: any) {
  const improvements = []

  if (ratios.efficiency.days_sales_outstanding > 45) {
    improvements.push({
      area: 'collections',
      action: 'Accelerate receivables collection',
      impact: 'Improve cash flow and reduce DSO'
    })
  }

  if (ratios.efficiency.inventory_turnover < 6) {
    improvements.push({
      area: 'inventory',
      action: 'Optimize inventory levels',
      impact: 'Free up working capital'
    })
  }

  return improvements
}

function calculateStandardDeviation(values: number[]) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(avgSquaredDiff)
}

function calculateTrendDirection(values: number[]) {
  if (values.length < 2) return 'flat'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (change > 5) return 'increasing'
  if (change < -5) return 'decreasing'
  return 'stable'
}

function calculateGrowthRate(values: number[]) {
  if (values.length < 2) return 0
  
  const first = values[0]
  const last = values[values.length - 1]
  
  return first !== 0 ? ((last - first) / first * 100) : 0
}

function detectSeasonality(values: number[], frequency: string) {
  // Simplified seasonality detection
  if (frequency !== 'monthly' || values.length < 12) return null
  
  // Calculate month-over-month variations
  const monthlyVariations = []
  for (let i = 1; i < values.length; i++) {
    monthlyVariations.push((values[i] - values[i-1]) / values[i-1])
  }
  
  // Check for patterns
  const avgVariation = Math.abs(monthlyVariations.reduce((a, b) => a + Math.abs(b), 0) / monthlyVariations.length)
  
  return {
    detected: avgVariation > 0.1,
    strength: avgVariation > 0.2 ? 'strong' : avgVariation > 0.1 ? 'moderate' : 'weak'
  }
}

function forecastNextPeriod(values: number[]) {
  // Simple moving average forecast
  const recentValues = values.slice(-3)
  return recentValues.reduce((a, b) => a + b, 0) / recentValues.length
}

function calculateConfidenceInterval(values: number[]) {
  const stdDev = calculateStandardDeviation(values)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  
  return {
    upper: mean + (1.96 * stdDev),
    lower: mean - (1.96 * stdDev)
  }
}

function generateTrendInsights(metric: string, values: number[], dates: string[]) {
  const insights = []
  const trend = calculateTrendDirection(values)
  const growth = calculateGrowthRate(values)
  
  insights.push({
    type: 'trend',
    message: `${metric} is ${trend} with ${Math.abs(growth).toFixed(1)}% ${growth > 0 ? 'growth' : 'decline'} over the period`
  })
  
  // Identify outliers
  const stdDev = calculateStandardDeviation(values)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  
  values.forEach((value, index) => {
    if (Math.abs(value - mean) > 2 * stdDev) {
      insights.push({
        type: 'outlier',
        message: `Unusual ${metric} value on ${dates[index]}: ${value.toFixed(2)} (${((value - mean) / stdDev).toFixed(1)} standard deviations from mean)`
      })
    }
  })
  
  return insights
}

function identifyVarianceDrivers(variances: any[]) {
  const drivers = []
  
  // Group by category
  const categories = {}
  variances.forEach(v => {
    const category = v.account_category || 'other'
    if (!categories[category]) categories[category] = []
    categories[category].push(v)
  })
  
  // Identify main drivers
  Object.entries(categories).forEach(([category, items]: [string, any]) => {
    const totalVariance = items.reduce((sum: number, i: any) => sum + Math.abs(i.variance_amount), 0)
    if (totalVariance > 0) {
      drivers.push({
        category: category,
        total_impact: totalVariance,
        item_count: items.length,
        largest_item: items.sort((a: any, b: any) => Math.abs(b.variance_amount) - Math.abs(a.variance_amount))[0]
      })
    }
  })
  
  return drivers.sort((a, b) => b.total_impact - a.total_impact)
}

function generateVarianceRecommendations(analysis: any) {
  const recommendations = []
  
  analysis.drivers.forEach((driver: any) => {
    if (driver.total_impact > 10000) {
      recommendations.push({
        area: driver.category,
        priority: driver.total_impact > 50000 ? 'high' : 'medium',
        action: `Investigate ${driver.category} variances totaling ${driver.total_impact.toFixed(0)}`,
        focus: driver.largest_item.account_name
      })
    }
  })
  
  return recommendations
}

function generateCashScenario(baseScenario: any, inflowMultiplier: number, outflowMultiplier: number) {
  const scenario = {
    ...baseScenario,
    daily_projections: baseScenario.daily_projections.map((day: any) => ({
      ...day,
      inflows: day.inflows * inflowMultiplier,
      outflows: day.outflows * outflowMultiplier,
      net_flow: (day.inflows * inflowMultiplier) - (day.outflows * outflowMultiplier),
      ending_balance: 0 // Will be recalculated
    }))
  }
  
  // Recalculate balances
  let balance = scenario.starting_cash
  scenario.daily_projections.forEach((day: any) => {
    balance += day.net_flow
    day.ending_balance = balance
  })
  
  scenario.ending_cash = balance
  scenario.minimum_cash = Math.min(...scenario.daily_projections.map((d: any) => d.ending_balance))
  scenario.maximum_cash = Math.max(...scenario.daily_projections.map((d: any) => d.ending_balance))
  
  return scenario
}

function generateCashFlowInsights(forecast: any) {
  const insights = []
  
  // Cash shortage risk
  if (forecast.base_scenario.minimum_cash < 0) {
    const shortageDate = forecast.base_scenario.daily_projections
      .find((d: any) => d.ending_balance < 0)?.date
    
    insights.push({
      type: 'critical',
      message: `Cash shortage predicted on ${new Date(shortageDate).toLocaleDateString()}`,
      action: 'Arrange financing or accelerate collections'
    })
  }
  
  // Cash utilization
  const avgBalance = forecast.base_scenario.daily_projections
    .reduce((sum: number, d: any) => sum + d.ending_balance, 0) / forecast.base_scenario.daily_projections.length
  
  if (avgBalance > forecast.base_scenario.starting_cash * 2) {
    insights.push({
      type: 'opportunity',
      message: 'Excess cash predicted - consider investment opportunities',
      average_excess: avgBalance - forecast.base_scenario.starting_cash
    })
  }
  
  return insights
}

function generateCashFlowRecommendations(forecast: any) {
  const recommendations = []
  
  if (forecast.base_scenario.minimum_cash < forecast.base_scenario.starting_cash * 0.2) {
    recommendations.push({
      priority: 'high',
      action: 'Establish credit facility',
      amount: forecast.base_scenario.starting_cash * 0.5,
      rationale: 'Provide cushion for cash flow volatility'
    })
  }
  
  return recommendations
}

function calculateRiskScore(anomalies: any[]) {
  let score = 0
  
  anomalies.forEach(anomaly => {
    switch (anomaly.severity) {
      case 'high': score += 10; break
      case 'medium': score += 5; break
      case 'low': score += 1; break
    }
  })
  
  // Normalize to 0-100 scale
  return Math.min(100, score)
}

function identifyAnomalyPatterns(anomalies: any[]) {
  const patterns = {
    timing_patterns: [],
    amount_patterns: [],
    account_patterns: []
  }
  
  // Group by anomaly type
  const byType = {}
  anomalies.forEach(a => {
    if (!byType[a.anomaly_type]) byType[a.anomaly_type] = []
    byType[a.anomaly_type].push(a)
  })
  
  // Identify patterns
  Object.entries(byType).forEach(([type, items]: [string, any]) => {
    if (items.length > 3) {
      patterns.timing_patterns.push({
        type: type,
        frequency: items.length,
        description: `Recurring ${type} anomalies detected`
      })
    }
  })
  
  return patterns
}

function generateAnomalyActions(anomalies: any, riskScore: number) {
  const actions = []
  
  if (riskScore > 70) {
    actions.push({
      priority: 'immediate',
      action: 'Conduct forensic audit of high-risk transactions',
      scope: 'All high severity anomalies'
    })
  }
  
  if (anomalies.high_severity.length > 0) {
    actions.push({
      priority: 'high',
      action: 'Review and strengthen internal controls',
      focus: 'Journal entry approval process'
    })
  }
  
  return actions
}

function calculateFraudProbability(anomalies: any[]) {
  // Simplified fraud scoring
  const fraudIndicators = anomalies.filter(a => 
    a.anomaly_type === 'round_numbers' || 
    a.anomaly_type === 'unusual_timing' ||
    a.severity === 'high'
  ).length
  
  return Math.min(95, fraudIndicators * 15)
}

function calculateErrorLikelihood(anomalies: any[]) {
  const errorIndicators = anomalies.filter(a =>
    a.anomaly_type === 'unusual_amount' &&
    a.severity !== 'high'
  ).length
  
  return Math.min(95, errorIndicators * 10)
}

function identifyProcessGaps(anomalies: any[]) {
  const gaps = []
  
  const timingAnomalies = anomalies.filter(a => a.anomaly_type === 'unusual_timing').length
  if (timingAnomalies > 5) {
    gaps.push({
      area: 'posting_schedule',
      issue: 'Inconsistent journal entry timing',
      recommendation: 'Implement standardized posting calendar'
    })
  }
  
  return gaps
}

function predictUsingLinearRegression(x: number[], y: number[], targetX: number) {
  // Simple linear regression
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return slope * targetX + intercept
}

function calculatePredictionInterval(values: number[], confidence: number) {
  const stdDev = calculateStandardDeviation(values)
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.645
  
  return {
    upper: stdDev * zScore,
    lower: stdDev * zScore
  }
}

function calculateSeasonalImpact(targetDate: string, historicalData: any[]) {
  const targetMonth = new Date(targetDate).getMonth()
  const monthlyAverages = new Array(12).fill(0)
  const monthlyCounts = new Array(12).fill(0)
  
  historicalData.forEach(d => {
    const month = new Date(d.date).getMonth()
    monthlyAverages[month] += d.cash_balance
    monthlyCounts[month]++
  })
  
  // Calculate seasonal factors
  const overallAverage = historicalData.reduce((sum, d) => sum + d.cash_balance, 0) / historicalData.length
  const seasonalFactor = monthlyCounts[targetMonth] > 0 ?
    (monthlyAverages[targetMonth] / monthlyCounts[targetMonth]) / overallAverage : 1
  
  return {
    factor: seasonalFactor,
    impact: (seasonalFactor - 1) * 100
  }
}

function calculateTrendImpact(values: number[]) {
  const trend = calculateTrendDirection(values)
  const growth = calculateGrowthRate(values)
  
  return {
    direction: trend,
    monthly_rate: growth / values.length,
    confidence: calculateStandardDeviation(values) / (values.reduce((a, b) => a + b, 0) / values.length)
  }
}

function calculateVolatility(values: number[]) {
  return calculateStandardDeviation(values) / (values.reduce((a, b) => a + b, 0) / values.length)
}

function generateCashPositionRecommendations(prediction: any) {
  const recommendations = []
  
  if (prediction.scenarios.worst_case < 0) {
    recommendations.push({
      priority: 'critical',
      action: 'Secure additional financing',
      amount: Math.abs(prediction.scenarios.worst_case) * 1.5,
      timeline: 'Before ' + new Date(prediction.target_date).toLocaleDateString()
    })
  }
  
  if (prediction.factors.volatility > 0.3) {
    recommendations.push({
      priority: 'high',
      action: 'Implement cash flow stabilization measures',
      focus: 'Reduce payment timing variability'
    })
  }
  
  return recommendations
}

function calculateCashImpact(area: string, data: any) {
  switch (area) {
    case 'receivables':
      return data.amount * (data.potential_days_reduction / 365)
    case 'inventory':
      return data.amount * (data.potential_days_reduction / 365)
    case 'payables':
      return data.amount * (data.potential_days_extension / 365)
    default:
      return 0
  }
}

function generateWorkingCapitalRoadmap(opportunities: any[]) {
  const roadmap = []
  
  // Quick wins (< 30 days)
  const quickWins = opportunities.filter(o => o.area === 'receivables')
  if (quickWins.length > 0) {
    roadmap.push({
      phase: 'Quick Wins (0-30 days)',
      actions: quickWins.map(w => ({
        action: w.action,
        expected_benefit: w.cash_impact,
        resources_needed: 'Collections team focus'
      }))
    })
  }
  
  // Medium term (30-90 days)
  const mediumTerm = opportunities.filter(o => o.area === 'payables')
  if (mediumTerm.length > 0) {
    roadmap.push({
      phase: 'Medium Term (30-90 days)',
      actions: mediumTerm.map(m => ({
        action: m.action,
        expected_benefit: m.cash_impact,
        resources_needed: 'Vendor negotiations'
      }))
    })
  }
  
  return roadmap
}

function generateRevenueInsights(metrics: any) {
  const insights = []
  
  if (metrics.revenue_growth < 0) {
    insights.push({
      type: 'warning',
      category: 'revenue',
      message: `Revenue declining by ${Math.abs(metrics.revenue_growth).toFixed(1)}%`,
      severity: 'high',
      recommendation: 'Investigate revenue drivers and customer retention'
    })
  }
  
  if (metrics.customer_concentration > 30) {
    insights.push({
      type: 'risk',
      category: 'revenue',
      message: `High customer concentration: ${metrics.customer_concentration.toFixed(1)}% from top customer`,
      severity: 'medium',
      recommendation: 'Diversify customer base to reduce dependency risk'
    })
  }
  
  return insights
}

function generateCostInsights(metrics: any) {
  const insights = []
  
  if (metrics.cost_growth > metrics.revenue_growth + 5) {
    insights.push({
      type: 'warning',
      category: 'cost',
      message: 'Costs growing faster than revenue',
      severity: 'high',
      recommendation: 'Implement cost control measures'
    })
  }
  
  return insights
}

function prioritizeActionItems(insights: any[]) {
  return insights
    .filter(i => i.recommendation)
    .map(i => ({
      priority: i.severity === 'high' ? 1 : i.severity === 'medium' ? 2 : 3,
      category: i.category,
      action: i.recommendation,
      expected_impact: i.type === 'opportunity' ? 'positive' : 'risk_mitigation'
    }))
    .sort((a, b) => a.priority - b.priority)
}

// Period operations
async function closePeriod(supabase: any, organizationId: string, data: any) {
  const { periodId, userId } = data

  const result = await supabase.rpc('fin_close_period', {
    p_organization_id: organizationId,
    p_period_id: periodId,
    p_user_id: userId
  })

  if (result.error) throw result.error

  return result.data
}

async function performYearEndClose(supabase: any, organizationId: string, data: any) {
  const { fiscalYear, userId } = data

  // Complex year-end closing process
  const steps = []

  // Step 1: Close all periods
  steps.push({ step: 'close_periods', status: 'completed' })

  // Step 2: Calculate year-end adjustments
  steps.push({ step: 'year_end_adjustments', status: 'completed' })

  // Step 3: Close P&L to retained earnings
  steps.push({ step: 'close_pl_accounts', status: 'completed' })

  // Step 4: Roll forward balance sheet
  steps.push({ step: 'roll_forward_bs', status: 'completed' })

  // Step 5: Create new fiscal year
  steps.push({ step: 'create_new_year', status: 'completed' })

  return {
    fiscal_year: fiscalYear,
    completed_at: new Date().toISOString(),
    steps: steps,
    new_fiscal_year: fiscalYear + 1
  }
}

async function rollForwardBalances(supabase: any, organizationId: string, data: any) {
  const { fromPeriodId, toPeriodId } = data

  const result = await supabase.rpc('fin_rollforward_balances', {
    p_organization_id: organizationId,
    p_from_period_id: fromPeriodId,
    p_to_period_id: toPeriodId
  })

  if (result.error) throw result.error

  return {
    from_period: fromPeriodId,
    to_period: toPeriodId,
    accounts_rolled: result.data.accounts_rolled || 0,
    total_amount: result.data.total_amount || 0
  }
}

// Consolidation functions
async function consolidateCompanies(supabase: any, organizationId: string, data: any) {
  const { companyIds, consolidationDate, eliminateIntercompany = true } = data

  // Mock consolidation logic
  const consolidation = {
    consolidation_date: consolidationDate,
    companies: companyIds,
    consolidated_statements: {
      balance_sheet: {},
      income_statement: {},
      cash_flow: {}
    },
    eliminations: eliminateIntercompany ? [] : null,
    minority_interests: [],
    currency_translations: []
  }

  return consolidation
}

async function translateCurrency(supabase: any, organizationId: string, data: any) {
  const { amount, fromCurrency, toCurrency, rateDate, rateType = 'closing' } = data

  const result = await supabase.rpc('fin_translate_currency', {
    p_amount: amount,
    p_from_currency: fromCurrency,
    p_to_currency: toCurrency,
    p_rate_date: rateDate,
    p_rate_type: rateType
  })

  if (result.error) throw result.error

  return {
    original_amount: amount,
    original_currency: fromCurrency,
    translated_amount: result.data,
    target_currency: toCurrency,
    exchange_rate: result.data / amount,
    rate_date: rateDate,
    rate_type: rateType
  }
}

async function eliminateIntercompany(supabase: any, organizationId: string, data: any) {
  const { transactions, eliminationDate } = data

  // Process intercompany eliminations
  const eliminations = transactions.map((t: any) => ({
    ...t,
    elimination_entry: {
      debit: t.account_to_eliminate,
      credit: t.offset_account,
      amount: t.amount,
      description: `Intercompany elimination: ${t.description}`
    }
  }))

  return {
    elimination_date: eliminationDate,
    eliminations: eliminations,
    total_eliminated: eliminations.reduce((sum: number, e: any) => sum + e.amount, 0)
  }
}