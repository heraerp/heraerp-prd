/**
 * HERA Branch P&L Report Generator
 * Smart Code: HERA.REPORT.BRANCH.PNL.V1
 * 
 * Generates branch-level profit & loss reports:
 * - Aggregates by branch and account type
 * - Supports date range filtering
 * - Uses sacred six tables only
 * - Multi-tenant safe with organization_id
 */

import { universalApi } from '@/lib/universal-api-v2'

export interface BranchPnLParams {
  organization_id: string
  branch_id?: string        // optional: all branches if not provided
  date_from?: string        // ISO date
  date_to?: string          // ISO date
}

export interface BranchPnLRow {
  branch_id: string
  branch_name?: string
  line_type: string
  amount: number
  transaction_count?: number
}

export interface BranchPnLResult {
  rows: BranchPnLRow[]
  summary?: {
    total_revenue: number
    total_expenses: number
    net_income: number
    branches_count: number
  }
}

/**
 * Get Branch P&L data using universal tables
 * Aggregates universal_transaction_lines by branch_id and line_type
 */
export async function getBranchPnL(
  params: BranchPnLParams
): Promise<BranchPnLResult> {
  const { organization_id, branch_id, date_from, date_to } = params

  try {
    // Set organization context
    universalApi.setOrganizationId(organization_id)

    // 1) Get relevant transactions with optional date range
    const txnFilters: any = { organization_id }
    
    // Add date filtering if provided
    if (date_from || date_to) {
      // Build date filter conditions
      const dateConditions: any[] = []
      if (date_from) {
        dateConditions.push({ transaction_date: { gte: date_from } })
      }
      if (date_to) {
        dateConditions.push({ transaction_date: { lte: date_to } })
      }
      
      // Apply date filters
      if (dateConditions.length === 1) {
        Object.assign(txnFilters, dateConditions[0])
      } else {
        txnFilters.and = dateConditions
      }
    }

    const txnResponse = await universalApi.read('universal_transactions', txnFilters)
    
    if (!txnResponse.success || !txnResponse.data?.length) {
      console.log('No transactions found for branch P&L')
      return { rows: [] }
    }

    const txnIds = txnResponse.data.map((t: any) => t.id)

    // 2) Pull GL lines for these transactions
    const lineResponse = await universalApi.read('universal_transaction_lines', {
      organization_id,
      transaction_id: txnIds // Uses array filter with .in()
    })

    if (!lineResponse.success || !lineResponse.data?.length) {
      console.log('No transaction lines found')
      return { rows: [] }
    }

    // 3) Filter by branch and aggregate
    const lines = lineResponse.data
    const aggregates: Record<string, { amount: number; count: number }> = {}
    const branchNames: Record<string, string> = {}

    for (const line of lines) {
      // Extract branch_id from line metadata
      const lineBranch = line.metadata?.branch_id
      
      // Skip if no branch_id or doesn't match filter
      if (!lineBranch) continue
      if (branch_id && lineBranch !== branch_id) continue

      // Create aggregation key
      const key = `${lineBranch}::${line.line_type || 'OTHER'}`
      
      if (!aggregates[key]) {
        aggregates[key] = { amount: 0, count: 0 }
      }
      
      aggregates[key].amount += Number(line.line_amount || 0)
      aggregates[key].count += 1
    }

    // 4) Get branch names for better reporting
    if (Object.keys(aggregates).length > 0) {
      const branchIds = [...new Set(
        Object.keys(aggregates).map(k => k.split('::')[0])
      )]
      
      const branchResponse = await universalApi.read('core_entities', {
        organization_id,
        entity_type: 'branch',
        id: branchIds
      })
      
      if (branchResponse.success && branchResponse.data) {
        branchResponse.data.forEach((branch: any) => {
          branchNames[branch.id] = branch.entity_name
        })
      }
    }

    // 5) Transform to result rows
    const rows: BranchPnLRow[] = Object.entries(aggregates).map(([key, data]) => {
      const [branchId, lineType] = key.split('::')
      return {
        branch_id: branchId,
        branch_name: branchNames[branchId],
        line_type: lineType,
        amount: data.amount,
        transaction_count: data.count
      }
    })

    // 6) Calculate summary
    const summary = calculateSummary(rows)

    return { rows, summary }

  } catch (error) {
    console.error('Error generating branch P&L:', error)
    throw error
  }
}

/**
 * Calculate P&L summary from rows
 */
function calculateSummary(rows: BranchPnLRow[]): BranchPnLResult['summary'] {
  let total_revenue = 0
  let total_expenses = 0
  const branches = new Set<string>()

  for (const row of rows) {
    branches.add(row.branch_id)
    
    // Categorize by line_type
    // Revenue is typically negative in double-entry
    if (['REVENUE', 'SALES', 'SERVICE_REVENUE'].includes(row.line_type)) {
      total_revenue += Math.abs(row.amount)
    } else if (['EXPENSE', 'COST', 'COGS', 'OPERATING_EXPENSE'].includes(row.line_type)) {
      total_expenses += Math.abs(row.amount)
    }
  }

  return {
    total_revenue,
    total_expenses,
    net_income: total_revenue - total_expenses,
    branches_count: branches.size
  }
}

/**
 * Get branch comparison data
 * Useful for multi-branch performance analysis
 */
export async function getBranchComparison(
  params: Omit<BranchPnLParams, 'branch_id'>
): Promise<{
  branches: Array<{
    branch_id: string
    branch_name: string
    revenue: number
    expenses: number
    net_income: number
    margin_percentage: number
  }>
}> {
  const { rows } = await getBranchPnL(params)
  
  // Group by branch
  const branchData: Record<string, any> = {}
  
  for (const row of rows) {
    if (!branchData[row.branch_id]) {
      branchData[row.branch_id] = {
        branch_id: row.branch_id,
        branch_name: row.branch_name || row.branch_id,
        revenue: 0,
        expenses: 0
      }
    }
    
    if (['REVENUE', 'SALES', 'SERVICE_REVENUE'].includes(row.line_type)) {
      branchData[row.branch_id].revenue += Math.abs(row.amount)
    } else {
      branchData[row.branch_id].expenses += Math.abs(row.amount)
    }
  }
  
  // Calculate net income and margin
  const branches = Object.values(branchData).map(b => ({
    ...b,
    net_income: b.revenue - b.expenses,
    margin_percentage: b.revenue > 0 ? ((b.revenue - b.expenses) / b.revenue) * 100 : 0
  }))
  
  return { branches }
}