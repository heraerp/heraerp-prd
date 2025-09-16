/**
 * Fiscal Dashboard Service
 * Manages financial period status, closing progress, and KPI calculations
 * Strictly uses Sacred Six tables with smart code conventions
 */

import { getSupabase } from '@/src/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export type PeriodStatus = 'open' | 'current' | 'closed'

export interface FiscalPeriod {
  period_code: string // e.g., '2025-Q1', '2025-01'
  period_type: 'month' | 'quarter' | 'year'
  status: PeriodStatus
  start_date: string
  end_date: string
  closing_progress: number // 0-100
  closing_steps_completed: string[]
  organization_id: string
  branch_id?: string
}

export interface ClosingStep {
  step_number: number
  step_code: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  completed_at?: string
  completed_by?: string
  notes?: string
}

export interface FinancialKPIs {
  revenue: number
  expenses: number
  net_income: number
  retained_earnings: number
  gross_margin?: number
  operating_margin?: number
  period: string
  branch_id?: string
}

export interface BranchConsolidation {
  branch_id: string
  branch_name: string
  kpis: FinancialKPIs
}

export class FiscalDashboardService {
  private static instance: FiscalDashboardService

  static getInstance(): FiscalDashboardService {
    if (!this.instance) {
      this.instance = new FiscalDashboardService()
    }
    return this.instance
  }

  /**
   * Get or create fiscal period entity
   */
  async ensureFiscalPeriod(
    organizationId: string,
    periodCode: string,
    periodType: 'month' | 'quarter' | 'year'
  ): Promise<string> {
    const supabase = getSupabase()

    // Check if period exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'fiscal_period')
      .eq('entity_code', periodCode)
      .eq('organization_id', organizationId)
      .single()

    if (existing) return existing.id

    // Calculate period dates
    const dates = this.calculatePeriodDates(periodCode, periodType)

    // Create period entity
    const { data: newPeriod, error } = await supabase
      .from('core_entities')
      .insert({
        id: uuidv4(),
        entity_type: 'fiscal_period',
        entity_name: `Fiscal Period ${periodCode}`,
        entity_code: periodCode,
        smart_code: `HERA.FISCAL.PERIOD.${periodType.toUpperCase()}.${periodCode}.v1`,
        organization_id: organizationId,
        metadata: {
          period_type: periodType,
          start_date: dates.start,
          end_date: dates.end,
          status: 'open'
        }
      })
      .select('id')
      .single()

    if (error) throw error

    // Initialize closing steps
    await this.initializeClosingSteps(newPeriod.id, organizationId)

    return newPeriod.id
  }

  /**
   * Calculate period start and end dates
   */
  private calculatePeriodDates(
    periodCode: string,
    periodType: string
  ): { start: string; end: string } {
    const parts = periodCode.split('-')
    const year = parseInt(parts[0])

    switch (periodType) {
      case 'month':
        const month = parseInt(parts[1]) - 1
        const start = new Date(year, month, 1)
        const end = new Date(year, month + 1, 0)
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        }

      case 'quarter':
        const quarter = parseInt(parts[1].replace('Q', ''))
        const startMonth = (quarter - 1) * 3
        const qStart = new Date(year, startMonth, 1)
        const qEnd = new Date(year, startMonth + 3, 0)
        return {
          start: qStart.toISOString().split('T')[0],
          end: qEnd.toISOString().split('T')[0]
        }

      case 'year':
        return {
          start: `${year}-01-01`,
          end: `${year}-12-31`
        }

      default:
        throw new Error(`Invalid period type: ${periodType}`)
    }
  }

  /**
   * Initialize standard closing steps
   */
  private async initializeClosingSteps(periodId: string, organizationId: string) {
    const standardSteps: ClosingStep[] = [
      {
        step_number: 1,
        step_code: 'VERIFY_TRANSACTIONS',
        description: 'Verify all transactions are posted',
        status: 'pending'
      },
      {
        step_number: 2,
        step_code: 'RECONCILE_ACCOUNTS',
        description: 'Reconcile all balance sheet accounts',
        status: 'pending'
      },
      {
        step_number: 3,
        step_code: 'ACCRUE_EXPENSES',
        description: 'Record accrued expenses and prepayments',
        status: 'pending'
      },
      {
        step_number: 4,
        step_code: 'DEPRECIATION',
        description: 'Calculate and post depreciation',
        status: 'pending'
      },
      {
        step_number: 5,
        step_code: 'INVENTORY_ADJUSTMENT',
        description: 'Adjust inventory to physical count',
        status: 'pending'
      },
      {
        step_number: 6,
        step_code: 'RUN_REPORTS',
        description: 'Generate trial balance and financial statements',
        status: 'pending'
      },
      {
        step_number: 7,
        step_code: 'MANAGEMENT_REVIEW',
        description: 'Management review and approval',
        status: 'pending'
      },
      {
        step_number: 8,
        step_code: 'CLOSE_PERIOD',
        description: 'Close period and lock transactions',
        status: 'pending'
      }
    ]

    const supabase = getSupabase()

    for (const step of standardSteps) {
      await supabase.from('core_dynamic_data').insert({
        id: uuidv4(),
        entity_id: periodId,
        field_name: `closing_step_${step.step_number}`,
        field_value_text: JSON.stringify(step),
        field_type: 'json',
        smart_code: `HERA.FISCAL.CLOSING.STEP.${step.step_code}.v1`,
        organization_id: organizationId
      })
    }
  }

  /**
   * Get fiscal period status
   */
  async getFiscalPeriodStatus(organizationId: string, periodCode: string): Promise<FiscalPeriod> {
    const supabase = getSupabase()

    // Get period entity
    const { data: period, error } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('entity_type', 'fiscal_period')
      .eq('entity_code', periodCode)
      .eq('organization_id', organizationId)
      .single()

    if (error) throw error

    // Extract closing steps
    const closingSteps = period.core_dynamic_data
      .filter((d: any) => d.field_name.startsWith('closing_step_'))
      .map((d: any) => JSON.parse(d.field_value_text))
      .sort((a: ClosingStep, b: ClosingStep) => a.step_number - b.step_number)

    const completedSteps = closingSteps.filter((s: ClosingStep) => s.status === 'completed')
    const progress = Math.round((completedSteps.length / closingSteps.length) * 100)

    // Determine status based on current date and progress
    const today = new Date()
    const endDate = new Date(period.metadata.end_date)
    let status: PeriodStatus = 'open'

    if (progress === 100) {
      status = 'closed'
    } else if (today > endDate) {
      status = 'current' // Past end date but not closed
    }

    return {
      period_code: periodCode,
      period_type: period.metadata.period_type,
      status,
      start_date: period.metadata.start_date,
      end_date: period.metadata.end_date,
      closing_progress: progress,
      closing_steps_completed: completedSteps.map((s: ClosingStep) => s.step_code),
      organization_id: organizationId
    }
  }

  /**
   * Calculate financial KPIs from transactions
   */
  async calculateKPIs(
    organizationId: string,
    periodStart: string,
    periodEnd: string,
    branchId?: string
  ): Promise<FinancialKPIs> {
    const supabase = getSupabase()

    // Build query with optional branch filter
    let query = supabase
      .from('universal_transactions')
      .select('transaction_type, total_amount, smart_code, metadata')
      .eq('organization_id', organizationId)
      .gte('transaction_date', periodStart)
      .lte('transaction_date', periodEnd)

    if (branchId) {
      query = query.eq('metadata->>branch_id', branchId)
    }

    const { data: transactions, error } = await query

    if (error) throw error

    // Calculate KPIs based on smart codes
    let revenue = 0
    let expenses = 0
    let retainedEarnings = 0

    transactions?.forEach(txn => {
      const smartCode = txn.smart_code || ''
      const amount = txn.total_amount || 0

      // Revenue transactions
      if (
        smartCode.includes('.REVENUE.') ||
        smartCode.includes('.SALE.') ||
        smartCode.includes('.SERVICE.')
      ) {
        revenue += amount
      }

      // Expense transactions
      else if (
        smartCode.includes('.EXPENSE.') ||
        smartCode.includes('.COST.') ||
        smartCode.includes('.PAYROLL.')
      ) {
        expenses += amount
      }

      // Retained earnings adjustments
      else if (smartCode.includes('.EQUITY.RETAINED.')) {
        retainedEarnings += amount
      }
    })

    const netIncome = revenue - expenses
    const grossMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
    const operatingMargin = grossMargin // Simplified for now

    return {
      revenue,
      expenses,
      net_income: netIncome,
      retained_earnings: retainedEarnings + netIncome,
      gross_margin: grossMargin,
      operating_margin: operatingMargin,
      period: `${periodStart}_${periodEnd}`,
      branch_id: branchId
    }
  }

  /**
   * Get branch consolidation view
   */
  async getBranchConsolidation(
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{
    branches: BranchConsolidation[]
    consolidated: FinancialKPIs
  }> {
    const supabase = getSupabase()

    // Get all branches
    const { data: branches, error } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', 'branch')
      .eq('organization_id', organizationId)

    if (error) throw error

    // Calculate KPIs for each branch
    const branchResults: BranchConsolidation[] = []

    for (const branch of branches || []) {
      const kpis = await this.calculateKPIs(organizationId, periodStart, periodEnd, branch.id)
      branchResults.push({
        branch_id: branch.id,
        branch_name: branch.entity_name,
        kpis
      })
    }

    // Calculate consolidated KPIs
    const consolidated = await this.calculateKPIs(organizationId, periodStart, periodEnd)

    return {
      branches: branchResults,
      consolidated
    }
  }

  /**
   * Update closing step status
   */
  async updateClosingStep(
    organizationId: string,
    periodCode: string,
    stepCode: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    completedBy?: string,
    notes?: string
  ): Promise<void> {
    const periodId = await this.ensureFiscalPeriod(organizationId, periodCode, 'month')
    const supabase = getSupabase()

    // Get current step data
    const { data: stepData, error: fetchError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', periodId)
      .like('smart_code', `%${stepCode}%`)
      .single()

    if (fetchError) throw fetchError

    const step: ClosingStep = JSON.parse(stepData.field_value_text)
    step.status = status

    if (status === 'completed') {
      step.completed_at = new Date().toISOString()
      step.completed_by = completedBy
    }

    if (notes) {
      step.notes = notes
    }

    // Update step
    const { error: updateError } = await supabase
      .from('core_dynamic_data')
      .update({
        field_value_text: JSON.stringify(step),
        updated_at: new Date().toISOString()
      })
      .eq('id', stepData.id)

    if (updateError) throw updateError

    // Log to transactions for audit trail
    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'GL.CLOSE',
      transaction_date: new Date().toISOString(),
      source_entity_id: periodId,
      total_amount: 0,
      smart_code: `HERA.FISCAL.CLOSING.UPDATE.${stepCode}.v1`,
      organization_id: organizationId,
      metadata: {
        period_code: periodCode,
        step_code: stepCode,
        new_status: status,
        updated_by: completedBy,
        notes
      }
    })
  }

  /**
   * Get closing checklist for a period
   */
  async getClosingChecklist(organizationId: string, periodCode: string): Promise<ClosingStep[]> {
    const periodId = await this.ensureFiscalPeriod(organizationId, periodCode, 'month')
    const supabase = getSupabase()

    const { data: steps, error } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', periodId)
      .like('field_name', 'closing_step_%')
      .order('field_name')

    if (error) throw error

    return steps
      .map(s => JSON.parse(s.field_value_text))
      .sort((a: ClosingStep, b: ClosingStep) => a.step_number - b.step_number)
  }
}

export const fiscalDashboard = FiscalDashboardService.getInstance()
