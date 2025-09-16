/**
 * HERA Universal Trial Balance DNA Service
 * Smart Code: HERA.FIN.TRIAL.BALANCE.ENGINE.v1
 *
 * Factory service for creating industry-optimized trial balance services
 * that work with HERA's universal 6-table architecture.
 */

import { UniversalAPIClient } from '@/src/lib/universal-api'

// Core Trial Balance DNA Configuration
export const TRIAL_BALANCE_DNA_CONFIG = {
  component_id: 'HERA.FIN.TRIAL.BALANCE.ENGINE.v1',
  component_name: 'Universal Trial Balance Engine',
  version: '1.0.0',

  // Core capabilities of the Trial Balance DNA
  capabilities: [
    'Multi-Tenant Trial Balance Generation',
    'Account Classification and Grouping',
    'Balance Validation and Analysis',
    'Group Consolidation Support',
    'Industry-Specific Account Templates',
    'Real-time Integration with Auto-Journal',
    'Professional IFRS/GAAP Formatting',
    'CLI Management Tools'
  ],

  // Industry-specific configurations
  industries: {
    restaurant: {
      name: 'Restaurant & Food Service',
      balance_expectations: {
        food_cost_percentage: 30,
        labor_cost_percentage: 30,
        gross_margin_target: 65
      },
      critical_accounts: ['Cash', 'Inventory - Food', 'Food Sales', 'Cost of Food Sold'],
      smart_codes: {
        revenue: 'HERA.REST.POS.TXN.SALE.v1',
        cogs: 'HERA.REST.INV.COGS.v1',
        labor: 'HERA.REST.HR.PAY.STAFF.v1'
      }
    },

    salon: {
      name: 'Hair Salon & Beauty Services',
      balance_expectations: {
        product_margin_target: 50,
        service_margin_target: 85,
        staff_cost_percentage: 45
      },
      critical_accounts: ['Cash', 'Service Revenue', 'Product Sales', 'Staff Salaries'],
      smart_codes: {
        service_revenue: 'HERA.SALON.SVC.TXN.SERVICE.v1',
        product_revenue: 'HERA.SALON.SVC.TXN.PRODUCT.v1',
        staff_costs: 'HERA.SALON.HR.PAY.STYLIST.v1'
      }
    },

    healthcare: {
      name: 'Healthcare & Medical Services',
      balance_expectations: {
        collection_rate_target: 85,
        supply_cost_percentage: 12,
        staff_cost_percentage: 55
      },
      critical_accounts: ['Patient Receivables', 'Insurance Receivables', 'Medical Supplies'],
      smart_codes: {
        patient_revenue: 'HERA.HLTH.PAT.PAYMENT.v1',
        insurance_revenue: 'HERA.HLTH.INS.REIMBURSEMENT.v1',
        supply_costs: 'HERA.HLTH.SUP.MEDICAL.v1'
      }
    },

    manufacturing: {
      name: 'Manufacturing & Production',
      balance_expectations: {
        inventory_turnover_target: 6,
        raw_material_percentage: 40,
        gross_margin_target: 35
      },
      critical_accounts: [
        'Raw Materials',
        'Work in Process',
        'Finished Goods',
        'Manufacturing Equipment'
      ],
      smart_codes: {
        sales: 'HERA.MFG.SALE.FINISHED.v1',
        materials: 'HERA.MFG.PUR.RAW.MATERIALS.v1',
        labor: 'HERA.MFG.HR.PAY.PRODUCTION.v1'
      }
    },

    professional_services: {
      name: 'Professional Services',
      balance_expectations: {
        utilization_rate_target: 75,
        collection_rate_target: 95,
        gross_margin_target: 70
      },
      critical_accounts: ['Accounts Receivable', 'Work in Progress', 'Professional Fees'],
      smart_codes: {
        fees: 'HERA.PROF.TIME.BILLING.v1',
        expenses: 'HERA.PROF.EXP.OPERATING.v1',
        salaries: 'HERA.PROF.HR.PAY.CONSULTANT.v1'
      }
    },

    retail: {
      name: 'Retail & E-commerce',
      balance_expectations: {
        inventory_turnover_target: 8,
        gross_margin_target: 45,
        shrinkage_allowance: 2
      },
      critical_accounts: [
        'Inventory',
        'Accounts Receivable',
        'Sales Revenue',
        'Cost of Goods Sold'
      ],
      smart_codes: {
        sales: 'HERA.RETAIL.POS.TXN.SALE.v1',
        inventory: 'HERA.RETAIL.INV.PUR.MERCHANDISE.v1',
        shrinkage: 'HERA.RETAIL.INV.SHRINKAGE.v1'
      }
    },

    universal: {
      name: 'Universal Business Template',
      balance_expectations: {
        gross_margin_target: 60,
        operating_margin_target: 20,
        current_ratio_target: 2.0
      },
      critical_accounts: ['Cash', 'Accounts Receivable', 'Revenue', 'Operating Expenses'],
      smart_codes: {
        revenue: 'HERA.UNIVERSAL.REVENUE.v1',
        expenses: 'HERA.UNIVERSAL.EXPENSES.v1',
        assets: 'HERA.UNIVERSAL.ASSETS.v1'
      }
    }
  }
} as const

// Trial Balance Data Interfaces
export interface TrialBalanceAccount {
  accountId: string
  accountCode: string
  accountName: string
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'
  accountCategory: string
  normalBalance: 'Debit' | 'Credit'
  debitTotal: number
  creditTotal: number
  netBalance: number
  transactionCount: number
}

export interface TrialBalanceValidation {
  totalDebits: number
  totalCredits: number
  balanceDifference: number
  isBalanced: boolean
  accountCount: number
  validationMessage: string
}

export interface TrialBalanceRatios {
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  grossMarginPercent: number
  debtToEquityRatio: number
  currentRatio: number
}

export interface TrialBalanceOptions {
  organizationId: string
  startDate?: string
  endDate?: string
  industryType?: keyof typeof TRIAL_BALANCE_DNA_CONFIG.industries
  includeRatios?: boolean
  includeValidation?: boolean
  groupByType?: boolean
  format?: 'summary' | 'detailed' | 'consolidated'
}

/**
 * Universal Trial Balance DNA Service Class
 * Provides industry-optimized trial balance functionality
 */
export class TrialBalanceDNAService {
  private api: UniversalAPIClient
  private organizationId: string
  private industryConfig: any

  constructor(api: UniversalAPIClient, organizationId: string, industryType: string = 'universal') {
    this.api = api
    this.organizationId = organizationId
    this.industryConfig =
      TRIAL_BALANCE_DNA_CONFIG.industries[
        industryType as keyof typeof TRIAL_BALANCE_DNA_CONFIG.industries
      ] || TRIAL_BALANCE_DNA_CONFIG.industries.universal
  }

  /**
   * Generate trial balance with industry-specific intelligence
   */
  async generateTrialBalance(options: Partial<TrialBalanceOptions> = {}): Promise<{
    accounts: TrialBalanceAccount[]
    validation: TrialBalanceValidation
    ratios?: TrialBalanceRatios
    industryInsights: any
  }> {
    const {
      startDate = '2025-01-01',
      endDate = new Date().toISOString().split('T')[0],
      includeRatios = true,
      includeValidation = true
    } = options

    try {
      // Get trial balance data from universal API
      const response = await this.api.query({
        action: 'custom_query',
        smart_code: 'HERA.FIN.TB.GENERATE.v1',
        query: 'get_trial_balance_data',
        params: {
          organization_id: this.organizationId,
          start_date: startDate,
          end_date: endDate,
          industry_type: this.industryConfig.name.toLowerCase()
        }
      })

      const accounts: TrialBalanceAccount[] =
        response.data?.map((account: any) => ({
          accountId: account.account_id,
          accountCode: account.account_code,
          accountName: account.account_name,
          accountType: account.account_type,
          accountCategory: account.account_category,
          normalBalance: account.normal_balance,
          debitTotal: parseFloat(account.debit_total),
          creditTotal: parseFloat(account.credit_total),
          netBalance: parseFloat(account.net_balance),
          transactionCount: account.transaction_count
        })) || []

      // Validate trial balance
      let validation: TrialBalanceValidation = {
        totalDebits: 0,
        totalCredits: 0,
        balanceDifference: 0,
        isBalanced: false,
        accountCount: 0,
        validationMessage: ''
      }

      if (includeValidation) {
        const validationResponse = await this.api.query({
          action: 'custom_query',
          smart_code: 'HERA.FIN.TB.VALIDATE.v1',
          query: 'validate_trial_balance',
          params: {
            organization_id: this.organizationId,
            start_date: startDate,
            end_date: endDate
          }
        })

        if (validationResponse.data?.[0]) {
          const v = validationResponse.data[0]
          validation = {
            totalDebits: parseFloat(v.total_debits),
            totalCredits: parseFloat(v.total_credits),
            balanceDifference: parseFloat(v.balance_difference),
            isBalanced: v.is_balanced,
            accountCount: v.account_count,
            validationMessage: v.validation_message
          }
        }
      }

      // Calculate financial ratios
      let ratios: TrialBalanceRatios | undefined

      if (includeRatios) {
        const ratiosResponse = await this.api.query({
          action: 'custom_query',
          smart_code: 'HERA.FIN.TB.RATIOS.v1',
          query: 'calculate_trial_balance_ratios',
          params: {
            organization_id: this.organizationId,
            start_date: startDate,
            end_date: endDate
          }
        })

        if (ratiosResponse.data?.[0]) {
          const r = ratiosResponse.data[0]
          ratios = {
            totalAssets: parseFloat(r.total_assets),
            totalLiabilities: parseFloat(r.total_liabilities),
            totalEquity: parseFloat(r.total_equity),
            totalRevenue: parseFloat(r.total_revenue),
            totalExpenses: parseFloat(r.total_expenses),
            netIncome: parseFloat(r.net_income),
            grossMarginPercent: parseFloat(r.gross_margin_percent),
            debtToEquityRatio: parseFloat(r.debt_to_equity_ratio),
            currentRatio: parseFloat(r.current_ratio)
          }
        }
      }

      // Generate industry-specific insights
      const industryInsights = this.generateIndustryInsights(accounts, ratios)

      return {
        accounts,
        validation,
        ratios,
        industryInsights
      }
    } catch (error) {
      console.error('Error generating trial balance:', error)
      throw new Error(`Failed to generate trial balance: ${error}`)
    }
  }

  /**
   * Generate consolidated trial balance for multiple organizations
   */
  async generateConsolidatedTrialBalance(
    organizationIds: string[],
    options: Partial<TrialBalanceOptions> = {}
  ): Promise<{
    consolidatedAccounts: TrialBalanceAccount[]
    organizationSummaries: any[]
    consolidatedValidation: TrialBalanceValidation
    consolidatedRatios: TrialBalanceRatios
  }> {
    const organizationSummaries = []
    const consolidatedAccountMap = new Map<string, TrialBalanceAccount>()

    // Generate trial balance for each organization
    for (const orgId of organizationIds) {
      const service = new TrialBalanceDNAService(this.api, orgId, options.industryType)
      const trialBalance = await service.generateTrialBalance(options)

      organizationSummaries.push({
        organizationId: orgId,
        trialBalance
      })

      // Consolidate accounts
      trialBalance.accounts.forEach(account => {
        const key = `${account.accountType}-${account.accountCategory}`

        if (consolidatedAccountMap.has(key)) {
          const existing = consolidatedAccountMap.get(key)!
          existing.debitTotal += account.debitTotal
          existing.creditTotal += account.creditTotal
          existing.netBalance += account.netBalance
          existing.transactionCount += account.transactionCount
        } else {
          consolidatedAccountMap.set(key, { ...account })
        }
      })
    }

    const consolidatedAccounts = Array.from(consolidatedAccountMap.values())

    // Calculate consolidated validation
    const consolidatedValidation: TrialBalanceValidation = {
      totalDebits: consolidatedAccounts.reduce((sum, acc) => sum + acc.debitTotal, 0),
      totalCredits: consolidatedAccounts.reduce((sum, acc) => sum + acc.creditTotal, 0),
      balanceDifference: 0,
      isBalanced: false,
      accountCount: consolidatedAccounts.length,
      validationMessage: ''
    }

    consolidatedValidation.balanceDifference =
      consolidatedValidation.totalDebits - consolidatedValidation.totalCredits
    consolidatedValidation.isBalanced = Math.abs(consolidatedValidation.balanceDifference) < 0.01
    consolidatedValidation.validationMessage = consolidatedValidation.isBalanced
      ? 'Consolidated Trial Balance is BALANCED'
      : `Consolidated imbalance of ${consolidatedValidation.balanceDifference.toFixed(2)}`

    // Calculate consolidated ratios
    const consolidatedRatios = this.calculateConsolidatedRatios(consolidatedAccounts)

    return {
      consolidatedAccounts,
      organizationSummaries,
      consolidatedValidation,
      consolidatedRatios
    }
  }

  /**
   * Generate industry-specific insights from trial balance data
   */
  private generateIndustryInsights(
    accounts: TrialBalanceAccount[],
    ratios?: TrialBalanceRatios
  ): any {
    const insights = {
      industryType: this.industryConfig.name,
      keyFindings: [] as string[],
      recommendations: [] as string[],
      benchmarkComparison: {} as any,
      criticalAccounts: [] as any[]
    }

    // Industry-specific analysis
    if (ratios) {
      const expectations = this.industryConfig.balance_expectations

      // Analyze gross margin
      if (
        expectations.gross_margin_target &&
        ratios.grossMarginPercent < expectations.gross_margin_target
      ) {
        insights.keyFindings.push(
          `Gross margin (${ratios.grossMarginPercent.toFixed(1)}%) below industry target (${expectations.gross_margin_target}%)`
        )
        insights.recommendations.push('Review pricing strategy and cost control measures')
      }

      // Analyze industry-specific ratios
      Object.entries(expectations).forEach(([key, target]) => {
        insights.benchmarkComparison[key] = {
          target: target,
          actual: this.getActualRatio(key, ratios, accounts),
          variance: 0
        }
      })
    }

    // Identify critical accounts
    this.industryConfig.critical_accounts.forEach((criticalAccountName: string) => {
      const account = accounts.find(acc =>
        acc.accountName.toLowerCase().includes(criticalAccountName.toLowerCase())
      )

      if (account) {
        insights.criticalAccounts.push({
          name: account.accountName,
          balance: account.netBalance,
          activity: account.transactionCount,
          significance: 'critical'
        })
      }
    })

    return insights
  }

  /**
   * Calculate consolidated ratios from account data
   */
  private calculateConsolidatedRatios(accounts: TrialBalanceAccount[]): TrialBalanceRatios {
    const assets = accounts
      .filter(acc => acc.accountType === 'Asset')
      .reduce(
        (sum, acc) => sum + (acc.normalBalance === 'Debit' ? acc.netBalance : -acc.netBalance),
        0
      )

    const liabilities = accounts
      .filter(acc => acc.accountType === 'Liability')
      .reduce(
        (sum, acc) => sum + (acc.normalBalance === 'Credit' ? -acc.netBalance : acc.netBalance),
        0
      )

    const equity = accounts
      .filter(acc => acc.accountType === 'Equity')
      .reduce(
        (sum, acc) => sum + (acc.normalBalance === 'Credit' ? -acc.netBalance : acc.netBalance),
        0
      )

    const revenue = accounts
      .filter(acc => acc.accountType === 'Revenue')
      .reduce(
        (sum, acc) => sum + (acc.normalBalance === 'Credit' ? -acc.netBalance : acc.netBalance),
        0
      )

    const expenses = accounts
      .filter(acc => acc.accountType === 'Expense')
      .reduce(
        (sum, acc) => sum + (acc.normalBalance === 'Debit' ? acc.netBalance : -acc.netBalance),
        0
      )

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      totalEquity: equity,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netIncome: revenue - expenses,
      grossMarginPercent: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
      debtToEquityRatio: equity > 0 ? liabilities / equity : 0,
      currentRatio: 2.0 // Placeholder - would need current asset/liability breakdown
    }
  }

  /**
   * Get actual ratio value for benchmarking
   */
  private getActualRatio(
    ratioName: string,
    ratios: TrialBalanceRatios,
    accounts: TrialBalanceAccount[]
  ): number {
    switch (ratioName) {
      case 'gross_margin_target':
        return ratios.grossMarginPercent
      case 'current_ratio_target':
        return ratios.currentRatio
      case 'debt_to_equity_ratio':
        return ratios.debtToEquityRatio
      default:
        return 0
    }
  }
}

/**
 * Factory function to create industry-specific Trial Balance DNA services
 */
export const trialBalanceDNAService = {
  /**
   * Create a Trial Balance DNA service for a specific industry
   */
  createForIndustry: (
    industryType: keyof typeof TRIAL_BALANCE_DNA_CONFIG.industries,
    options: {
      api: UniversalAPIClient
      organizationId: string
      customizations?: any
    }
  ): TrialBalanceDNAService => {
    const { api, organizationId, customizations } = options

    const service = new TrialBalanceDNAService(api, organizationId, industryType)

    // Apply any custom configurations
    if (customizations) {
      // Merge customizations with industry config
      Object.assign(service['industryConfig'], customizations)
    }

    return service
  },

  /**
   * Get available industry configurations
   */
  getAvailableIndustries: () => {
    return Object.entries(TRIAL_BALANCE_DNA_CONFIG.industries).map(([key, config]) => ({
      key,
      name: config.name,
      capabilities: Object.keys(config.balance_expectations),
      criticalAccounts: config.critical_accounts
    }))
  },

  /**
   * Validate industry configuration
   */
  validateIndustryConfig: (industryType: string): boolean => {
    return industryType in TRIAL_BALANCE_DNA_CONFIG.industries
  }
}

export default trialBalanceDNAService
