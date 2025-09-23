/**
 * HERA Financial Reports API
 * Fetches real financial data from universal_transactions
 * for generating P&L, Balance Sheet, and other financial reports
 */

import { getSupabase } from '../supabase'
import { useQuery } from '@tanstack/react-query'

interface FinancialSummary {
  revenue: number
  cogs: number
  opex: number
  grossProfit: number
  netProfit: number
  transactions: Array<{
    id: string
    date: string
    type: string
    amount: number
    description: string
  }>
}

interface PeriodParams {
  organizationId: string
  startDate: string
  endDate: string
  branchId?: string
}

/**
 * Fetch revenue data for a period
 */
export async function getRevenueData({ organizationId, startDate, endDate, branchId }: PeriodParams) {
  const supabase = getSupabase()
  
  let query = supabase
    .from('universal_transactions')
    .select(`
      id,
      transaction_date,
      transaction_type,
      total_amount,
      metadata,
      smart_code
    `)
    .eq('organization_id', organizationId)
    .in('transaction_type', ['sale', 'service_sale', 'product_sale'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .neq('transaction_status', 'cancelled')
  
  if (branchId && branchId !== 'all') {
    query = query.eq('metadata->branch_id', branchId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  // Group revenue by type
  const revenueByType = {
    serviceRevenue: 0,
    productRevenue: 0,
    otherRevenue: 0,
    totalRevenue: 0
  }
  
  data?.forEach(txn => {
    const amount = txn.total_amount || 0
    
    // Classify based on smart code or transaction type
    if (txn.smart_code?.includes('.SVC.') || txn.transaction_type === 'service_sale') {
      revenueByType.serviceRevenue += amount
    } else if (txn.smart_code?.includes('.PROD.') || txn.transaction_type === 'product_sale') {
      revenueByType.productRevenue += amount
    } else {
      revenueByType.otherRevenue += amount
    }
    
    revenueByType.totalRevenue += amount
  })
  
  return {
    transactions: data || [],
    summary: revenueByType
  }
}

/**
 * Fetch expense data for a period
 */
export async function getExpenseData({ organizationId, startDate, endDate, branchId }: PeriodParams) {
  const supabase = getSupabase()
  
  let query = supabase
    .from('universal_transactions')
    .select(`
      id,
      transaction_date,
      transaction_type,
      total_amount,
      metadata,
      smart_code
    `)
    .eq('organization_id', organizationId)
    .in('transaction_type', ['expense', 'purchase', 'payroll', 'rent', 'utilities'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .neq('transaction_status', 'cancelled')
  
  if (branchId && branchId !== 'all') {
    query = query.eq('metadata->branch_id', branchId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  // Group expenses by category
  const expenseByCategory = {
    productCost: 0,
    staffCost: 0,
    rentExpense: 0,
    utilities: 0,
    marketing: 0,
    otherExpense: 0,
    totalExpense: 0
  }
  
  data?.forEach(txn => {
    const amount = txn.total_amount || 0
    
    // Classify based on transaction type or metadata
    switch (txn.transaction_type) {
      case 'purchase':
        expenseByCategory.productCost += amount
        break
      case 'payroll':
        expenseByCategory.staffCost += amount
        break
      case 'rent':
        expenseByCategory.rentExpense += amount
        break
      case 'utilities':
        expenseByCategory.utilities += amount
        break
      default:
        // Check metadata for more specific categorization
        if (txn.metadata?.expense_category === 'marketing') {
          expenseByCategory.marketing += amount
        } else {
          expenseByCategory.otherExpense += amount
        }
    }
    
    expenseByCategory.totalExpense += amount
  })
  
  return {
    transactions: data || [],
    summary: expenseByCategory
  }
}

/**
 * Generate P&L data from real transactions
 */
export async function generatePnLData({ organizationId, startDate, endDate, branchId }: PeriodParams) {
  try {
    // Fetch revenue and expense data in parallel
    const [revenueData, expenseData] = await Promise.all([
      getRevenueData({ organizationId, startDate, endDate, branchId }),
      getExpenseData({ organizationId, startDate, endDate, branchId })
    ])
    
    const revenue = revenueData.summary
    const expenses = expenseData.summary
    
    // Calculate COGS (Cost of Goods Sold)
    const cogs = expenses.productCost
    
    // Calculate OPEX (Operating Expenses)
    const opex = expenses.staffCost + expenses.rentExpense + expenses.utilities + 
                 expenses.marketing + expenses.otherExpense
    
    // Calculate key metrics
    const grossProfit = revenue.totalRevenue - cogs
    const grossMargin = revenue.totalRevenue > 0 ? (grossProfit / revenue.totalRevenue) * 100 : 0
    
    const ebitda = grossProfit - opex
    const ebitdaMargin = revenue.totalRevenue > 0 ? (ebitda / revenue.totalRevenue) * 100 : 0
    
    const netProfit = ebitda // Simplified - no interest, tax, depreciation
    const netMargin = revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue) * 100 : 0
    
    return {
      revenue: revenue,
      expenses: expenses,
      kpis: {
        revenue_net: revenue.totalRevenue,
        cogs: cogs,
        gross_profit: grossProfit,
        gross_margin: grossMargin,
        opex: opex,
        ebitda: ebitda,
        ebitda_margin: ebitdaMargin,
        operating_income: ebitda,
        profit_before_tax: netProfit,
        income_tax: 0, // UAE - no corporate tax for small business
        net_profit: netProfit,
        net_margin: netMargin
      },
      transactions: {
        revenue: revenueData.transactions,
        expenses: expenseData.transactions
      }
    }
  } catch (error) {
    console.error('Error generating P&L data:', error)
    throw error
  }
}

/**
 * React Query hook for P&L data
 */
export function useRealPnLData({ organizationId, startDate, endDate, branchId }: PeriodParams) {
  return useQuery({
    queryKey: ['pnl-data', organizationId, startDate, endDate, branchId],
    queryFn: () => generatePnLData({ organizationId, startDate, endDate, branchId }),
    enabled: !!organizationId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Get daily sales report
 */
export async function getDailySalesReport(organizationId: string, date: string) {
  const supabase = getSupabase()
  
  const startDate = `${date}T00:00:00.000Z`
  const endDate = `${date}T23:59:59.999Z`
  
  const { data, error } = await supabase
    .from('universal_transactions')
    .select(`
      id,
      transaction_date,
      transaction_type,
      total_amount,
      metadata,
      smart_code,
      source_entity:core_entities!universal_transactions_source_entity_id_fkey(entity_name),
      target_entity:core_entities!universal_transactions_target_entity_id_fkey(entity_name)
    `)
    .eq('organization_id', organizationId)
    .in('transaction_type', ['sale', 'service_sale', 'product_sale', 'appointment'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .neq('transaction_status', 'cancelled')
    .order('transaction_date', { ascending: false })
  
  if (error) throw error
  
  // Calculate summary
  const summary = {
    totalSales: 0,
    totalTransactions: data?.length || 0,
    serviceRevenue: 0,
    productRevenue: 0,
    averageTicket: 0,
    topServices: new Map<string, { name: string; count: number; revenue: number }>(),
    salesByHour: new Map<string, number>(),
    salesByStylist: new Map<string, { name: string; revenue: number; count: number }>()
  }
  
  data?.forEach(txn => {
    const amount = txn.total_amount || 0
    summary.totalSales += amount
    
    // Categorize revenue
    if (txn.smart_code?.includes('.SVC.') || txn.transaction_type === 'service_sale') {
      summary.serviceRevenue += amount
    } else if (txn.smart_code?.includes('.PROD.') || txn.transaction_type === 'product_sale') {
      summary.productRevenue += amount
    }
    
    // Sales by hour
    const hour = new Date(txn.transaction_date).getHours()
    const hourKey = `${hour}:00`
    summary.salesByHour.set(hourKey, (summary.salesByHour.get(hourKey) || 0) + amount)
    
    // Sales by stylist
    if (txn.target_entity?.entity_name) {
      const stylistName = txn.target_entity.entity_name
      const current = summary.salesByStylist.get(stylistName) || { name: stylistName, revenue: 0, count: 0 }
      current.revenue += amount
      current.count += 1
      summary.salesByStylist.set(stylistName, current)
    }
  })
  
  summary.averageTicket = summary.totalTransactions > 0 ? summary.totalSales / summary.totalTransactions : 0
  
  return {
    date,
    transactions: data || [],
    summary
  }
}

/**
 * React Query hook for daily sales
 */
export function useDailySalesReport(organizationId: string, date: string) {
  return useQuery({
    queryKey: ['daily-sales', organizationId, date],
    queryFn: () => getDailySalesReport(organizationId, date),
    enabled: !!organizationId && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}