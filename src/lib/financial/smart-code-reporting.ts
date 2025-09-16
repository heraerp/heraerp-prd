/**
 * Financial Reporting Layer via Smart Codes
 * Dynamically generates financial reports based on smart code families
 * No hardcoded GL accounts - everything resolved through smart codes
 */

import { getSupabase } from '@/src/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export type ReportType = 'pl' | 'balance_sheet' | 'cashflow' | 'trial_balance'

export interface ReportConfig {
  report_type: ReportType
  name: string
  smart_code_families: string[]
  grouping_rules: GroupingRule[]
  calculation_rules?: CalculationRule[]
}

export interface GroupingRule {
  group_name: string
  smart_code_patterns: string[]
  display_order: number
  aggregation: 'sum' | 'average' | 'count'
  show_details: boolean
}

export interface CalculationRule {
  name: string
  formula: string // e.g., "revenue - expenses"
  groups_involved: string[]
}

export interface ReportLine {
  group_name: string
  account_name?: string
  smart_code?: string
  amount: number
  percentage_of_total?: number
  line_items?: ReportLine[]
}

export interface FinancialReport {
  report_type: ReportType
  organization_id: string
  period: string
  generated_at: string
  currency: string
  sections: ReportSection[]
  totals: Record<string, number>
  metadata: Record<string, any>
}

export interface ReportSection {
  section_name: string
  lines: ReportLine[]
  subtotal: number
  display_order: number
}

export class SmartCodeReportingService {
  private static instance: SmartCodeReportingService
  private reportConfigs: Map<ReportType, ReportConfig>

  constructor() {
    this.reportConfigs = this.initializeReportConfigs()
  }

  static getInstance(): SmartCodeReportingService {
    if (!this.instance) {
      this.instance = new SmartCodeReportingService()
    }
    return this.instance
  }

  /**
   * Initialize standard report configurations
   */
  private initializeReportConfigs(): Map<ReportType, ReportConfig> {
    const configs = new Map<ReportType, ReportConfig>()

    // P&L Configuration
    configs.set('pl', {
      report_type: 'pl',
      name: 'Profit & Loss Statement',
      smart_code_families: ['.REVENUE.', '.EXPENSE.', '.COST.'],
      grouping_rules: [
        {
          group_name: 'Revenue',
          smart_code_patterns: ['.REVENUE.', '.SALES.', '.SERVICE.INCOME.'],
          display_order: 1,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Cost of Goods Sold',
          smart_code_patterns: ['.COGS.', '.COST.DIRECT.', '.COST.MATERIAL.'],
          display_order: 2,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Operating Expenses',
          smart_code_patterns: ['.EXPENSE.OPERATING.', '.PAYROLL.', '.RENT.', '.UTILITIES.'],
          display_order: 3,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Other Income/Expenses',
          smart_code_patterns: ['.EXPENSE.OTHER.', '.INCOME.OTHER.'],
          display_order: 4,
          aggregation: 'sum',
          show_details: true
        }
      ],
      calculation_rules: [
        {
          name: 'Gross Profit',
          formula: 'revenue - cogs',
          groups_involved: ['Revenue', 'Cost of Goods Sold']
        },
        {
          name: 'Operating Income',
          formula: 'gross_profit - operating_expenses',
          groups_involved: ['Gross Profit', 'Operating Expenses']
        },
        {
          name: 'Net Income',
          formula: 'operating_income + other_income_expenses',
          groups_involved: ['Operating Income', 'Other Income/Expenses']
        }
      ]
    })

    // Balance Sheet Configuration
    configs.set('balance_sheet', {
      report_type: 'balance_sheet',
      name: 'Balance Sheet',
      smart_code_families: ['.ASSET.', '.LIABILITY.', '.EQUITY.'],
      grouping_rules: [
        {
          group_name: 'Current Assets',
          smart_code_patterns: ['.ASSET.CURRENT.', '.CASH.', '.RECEIVABLE.', '.INVENTORY.'],
          display_order: 1,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Fixed Assets',
          smart_code_patterns: ['.ASSET.FIXED.', '.PROPERTY.', '.EQUIPMENT.'],
          display_order: 2,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Current Liabilities',
          smart_code_patterns: ['.LIABILITY.CURRENT.', '.PAYABLE.', '.ACCRUED.'],
          display_order: 3,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Long-term Liabilities',
          smart_code_patterns: ['.LIABILITY.LONGTERM.', '.LOAN.', '.MORTGAGE.'],
          display_order: 4,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Equity',
          smart_code_patterns: ['.EQUITY.', '.CAPITAL.', '.RETAINED.EARNINGS.'],
          display_order: 5,
          aggregation: 'sum',
          show_details: true
        }
      ]
    })

    // Cash Flow Configuration
    configs.set('cashflow', {
      report_type: 'cashflow',
      name: 'Cash Flow Statement',
      smart_code_families: ['.CASHFLOW.'],
      grouping_rules: [
        {
          group_name: 'Operating Activities',
          smart_code_patterns: ['.CASHFLOW.OPERATING.', '.CASH.FROM.SALES.', '.CASH.TO.SUPPLIERS.'],
          display_order: 1,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Investing Activities',
          smart_code_patterns: [
            '.CASHFLOW.INVESTING.',
            '.CASH.ASSET.PURCHASE.',
            '.CASH.ASSET.SALE.'
          ],
          display_order: 2,
          aggregation: 'sum',
          show_details: true
        },
        {
          group_name: 'Financing Activities',
          smart_code_patterns: ['.CASHFLOW.FINANCING.', '.CASH.LOAN.', '.CASH.EQUITY.'],
          display_order: 3,
          aggregation: 'sum',
          show_details: true
        }
      ]
    })

    return configs
  }

  /**
   * Store report configuration
   */
  async storeReportConfig(
    organizationId: string,
    reportType: ReportType,
    customConfig?: Partial<ReportConfig>
  ): Promise<void> {
    const supabase = getSupabase()
    const baseConfig = this.reportConfigs.get(reportType)!
    const config = { ...baseConfig, ...customConfig }

    // Store as entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: uuidv4(),
        entity_type: 'financial_report',
        entity_name: config.name,
        entity_code: `REPORT-${reportType.toUpperCase()}`,
        smart_code: `HERA.FIN.REPORT.${reportType.toUpperCase()}.CONFIG.v1`,
        organization_id: organizationId,
        metadata: {
          report_type: reportType,
          smart_code_families: config.smart_code_families
        }
      })
      .select('id')
      .single()

    if (entityError) throw entityError

    // Store config details in dynamic data
    await supabase.from('core_dynamic_data').insert({
      id: uuidv4(),
      entity_id: entity.id,
      field_name: 'report_config',
      field_value_text: JSON.stringify(config),
      field_type: 'json',
      smart_code: `HERA.FIN.REPORT.${reportType.toUpperCase()}.RULES.v1`,
      organization_id: organizationId
    })
  }

  /**
   * Generate financial report
   */
  async generateReport(
    organizationId: string,
    reportType: ReportType,
    period: string,
    options?: {
      branch_id?: string
      currency?: string
      include_details?: boolean
      comparison_period?: string
    }
  ): Promise<FinancialReport> {
    const config = this.reportConfigs.get(reportType)
    if (!config) {
      throw new Error(`Unknown report type: ${reportType}`)
    }

    // Parse period (e.g., "2025-Q1", "2025-01", "2025")
    const { startDate, endDate } = this.parsePeriod(period)

    // Fetch transactions based on smart code families
    const transactions = await this.fetchTransactionsBySmartCode(
      organizationId,
      config.smart_code_families,
      startDate,
      endDate,
      options?.branch_id
    )

    // Group transactions according to rules
    const sections = await this.groupTransactions(transactions, config.grouping_rules)

    // Apply calculations if defined
    const totals = this.calculateTotals(sections, config.calculation_rules)

    // Generate report structure
    const report: FinancialReport = {
      report_type: reportType,
      organization_id: organizationId,
      period,
      generated_at: new Date().toISOString(),
      currency: options?.currency || 'USD',
      sections,
      totals,
      metadata: {
        transaction_count: transactions.length,
        branch_id: options?.branch_id,
        config_used: config.name
      }
    }

    // Log report generation
    await this.logReportGeneration(organizationId, report)

    return report
  }

  /**
   * Parse period string into date range
   */
  private parsePeriod(period: string): { startDate: string; endDate: string } {
    const parts = period.split('-')

    if (parts.length === 1) {
      // Year: "2025"
      return {
        startDate: `${parts[0]}-01-01`,
        endDate: `${parts[0]}-12-31`
      }
    } else if (parts[1].startsWith('Q')) {
      // Quarter: "2025-Q1"
      const year = parseInt(parts[0])
      const quarter = parseInt(parts[1].substring(1))
      const startMonth = (quarter - 1) * 3 + 1
      const endMonth = quarter * 3

      return {
        startDate: `${year}-${String(startMonth).padStart(2, '0')}-01`,
        endDate: new Date(year, endMonth, 0).toISOString().split('T')[0]
      }
    } else {
      // Month: "2025-01"
      const year = parseInt(parts[0])
      const month = parseInt(parts[1])

      return {
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        endDate: new Date(year, month, 0).toISOString().split('T')[0]
      }
    }
  }

  /**
   * Fetch transactions by smart code patterns
   */
  private async fetchTransactionsBySmartCode(
    organizationId: string,
    smartCodeFamilies: string[],
    startDate: string,
    endDate: string,
    branchId?: string
  ): Promise<any[]> {
    const supabase = getSupabase()

    // Build OR conditions for smart code patterns
    const patterns = smartCodeFamilies.map(family => `smart_code.ilike.%${family}%`).join(',')

    let query = supabase
      .from('universal_transaction_lines')
      .select(
        `
        *,
        universal_transactions!inner(
          transaction_date,
          transaction_type,
          smart_code,
          metadata
        ),
        line_entity:core_entities!line_entity_id(
          entity_name,
          entity_type,
          smart_code
        )
      `
      )
      .eq('organization_id', organizationId)
      .gte('universal_transactions.transaction_date', startDate)
      .lte('universal_transactions.transaction_date', endDate)
      .or(patterns)

    if (branchId) {
      query = query.eq('universal_transactions.metadata->>branch_id', branchId)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  }

  /**
   * Group transactions according to rules
   */
  private async groupTransactions(
    transactions: any[],
    groupingRules: GroupingRule[]
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = []

    for (const rule of groupingRules) {
      const matchingTransactions = transactions.filter(txn => {
        const smartCode = txn.smart_code || txn.universal_transactions?.smart_code || ''
        return rule.smart_code_patterns.some(pattern =>
          smartCode.includes(pattern.replace(/\./g, ''))
        )
      })

      const lines: ReportLine[] = []
      let subtotal = 0

      if (rule.show_details) {
        // Group by account
        const accountGroups = new Map<string, any[]>()

        matchingTransactions.forEach(txn => {
          const accountName = txn.line_entity?.entity_name || 'Unknown Account'
          if (!accountGroups.has(accountName)) {
            accountGroups.set(accountName, [])
          }
          accountGroups.get(accountName)!.push(txn)
        })

        // Create lines for each account
        accountGroups.forEach((txns, accountName) => {
          const amount = txns.reduce((sum, t) => sum + (t.line_amount || 0), 0)
          lines.push({
            group_name: rule.group_name,
            account_name: accountName,
            smart_code: txns[0]?.smart_code,
            amount,
            percentage_of_total: 0 // Calculate later
          })
          subtotal += amount
        })
      } else {
        // Just show total
        subtotal = matchingTransactions.reduce((sum, t) => sum + (t.line_amount || 0), 0)
        lines.push({
          group_name: rule.group_name,
          amount: subtotal
        })
      }

      sections.push({
        section_name: rule.group_name,
        lines,
        subtotal,
        display_order: rule.display_order
      })
    }

    return sections.sort((a, b) => a.display_order - b.display_order)
  }

  /**
   * Calculate report totals and derived values
   */
  private calculateTotals(
    sections: ReportSection[],
    calculationRules?: CalculationRule[]
  ): Record<string, number> {
    const totals: Record<string, number> = {}

    // First, get section totals
    sections.forEach(section => {
      totals[section.section_name.toLowerCase().replace(/\s+/g, '_')] = section.subtotal
    })

    // Apply calculation rules
    if (calculationRules) {
      calculationRules.forEach(rule => {
        // Simple formula parser (for demo - would be more sophisticated in production)
        let result = 0

        if (rule.formula.includes(' - ')) {
          const parts = rule.formula.split(' - ')
          result = (totals[parts[0]] || 0) - (totals[parts[1]] || 0)
        } else if (rule.formula.includes(' + ')) {
          const parts = rule.formula.split(' + ')
          result = (totals[parts[0]] || 0) + (totals[parts[1]] || 0)
        }

        totals[rule.name.toLowerCase().replace(/\s+/g, '_')] = result
      })
    }

    // Calculate percentages
    const grandTotal = Object.values(totals).reduce((sum, val) => sum + Math.abs(val), 0)
    sections.forEach(section => {
      section.lines.forEach(line => {
        line.percentage_of_total = grandTotal > 0 ? (line.amount / grandTotal) * 100 : 0
      })
    })

    return totals
  }

  /**
   * Log report generation for audit
   */
  private async logReportGeneration(
    organizationId: string,
    report: FinancialReport
  ): Promise<void> {
    const supabase = getSupabase()

    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'report_generation',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: `HERA.FIN.REPORT.${report.report_type.toUpperCase()}.GENERATED.v1`,
      organization_id: organizationId,
      metadata: {
        report_type: report.report_type,
        period: report.period,
        sections_count: report.sections.length,
        totals: report.totals
      }
    })
  }

  /**
   * Generate comparative report
   */
  async generateComparativeReport(
    organizationId: string,
    reportType: ReportType,
    periods: string[],
    options?: any
  ): Promise<{
    reports: FinancialReport[]
    comparison: any
  }> {
    const reports = await Promise.all(
      periods.map(period => this.generateReport(organizationId, reportType, period, options))
    )

    // Calculate variances
    const comparison = {
      periods,
      variances: {} as Record<string, number[]>,
      growth_rates: {} as Record<string, number[]>
    }

    if (reports.length > 1) {
      Object.keys(reports[0].totals).forEach(key => {
        comparison.variances[key] = []
        comparison.growth_rates[key] = []

        for (let i = 1; i < reports.length; i++) {
          const current = reports[i].totals[key] || 0
          const previous = reports[i - 1].totals[key] || 0

          comparison.variances[key].push(current - previous)
          comparison.growth_rates[key].push(
            previous !== 0 ? ((current - previous) / previous) * 100 : 0
          )
        }
      })
    }

    return { reports, comparison }
  }
}

export const smartCodeReporting = SmartCodeReportingService.getInstance()
