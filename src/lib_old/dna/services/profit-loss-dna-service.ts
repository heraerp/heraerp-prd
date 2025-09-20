/**
 * HERA Universal Profit & Loss DNA Service
 * Smart Code: HERA.FIN.PL.ENGINE.v1
 *
 * Factory service for creating industry-optimized P&L reporting services
 * that work with HERA's universal 6-table architecture.
 */

import { UniversalAPIClient } from '@/lib/universal-api'

// Core P&L DNA Configuration
export const PROFIT_LOSS_DNA_CONFIG = {
  component_id: 'HERA.FIN.PL.ENGINE.v1',
  component_name: 'Universal Profit & Loss Engine',
  version: '1.0.0',

  // Core capabilities of the P&L DNA
  capabilities: [
    'Daily P&L Generation',
    'Real-time Revenue & Expense Tracking',
    'Gross Profit Calculation',
    'Operating Income Analysis',
    'EBITDA Reporting',
    'Net Income Calculation',
    'Multi-Period Comparison',
    'Industry-Specific P&L Templates',
    'Margin Analysis',
    'YTD Performance Tracking',
    'Integration with Trial Balance DNA'
  ],

  // Industry-specific configurations
  industries: {
    salon: {
      name: 'Hair Salon & Beauty Services',
      revenue_structure: {
        service_revenue: {
          accounts: ['4110000', '4120000', '4130000', '4140000', '4150000'],
          categories: {
            '4110000': 'Hair Cutting Services',
            '4120000': 'Hair Coloring Services',
            '4130000': 'Hair Treatment Services',
            '4140000': 'Styling Services',
            '4150000': 'Other Beauty Services'
          }
        },
        product_revenue: {
          accounts: ['4200000', '4210000'],
          categories: {
            '4200000': 'Hair Care Product Sales',
            '4210000': 'Beauty Product Sales'
          }
        },
        package_revenue: {
          accounts: ['4300000'],
          categories: {
            '4300000': 'Service Package Sales'
          }
        }
      },
      expense_structure: {
        cost_of_goods_sold: {
          accounts: ['5100000', '5110000', '5200000'],
          categories: {
            '5100000': 'Cost of Products Sold - Hair Care',
            '5110000': 'Cost of Products Sold - Beauty',
            '5200000': 'Salon Supplies Used'
          }
        },
        payroll_expenses: {
          accounts: ['6100000', '6110000', '6120000', '6130000'],
          categories: {
            '6100000': 'Stylist Salaries',
            '6110000': 'Commission Expenses',
            '6120000': 'Payroll Taxes',
            '6130000': 'Employee Benefits'
          }
        },
        facility_expenses: {
          accounts: ['6200000', '6210000', '6220000'],
          categories: {
            '6200000': 'Rent Expense',
            '6210000': 'Utilities Expense',
            '6220000': 'Facility Maintenance'
          }
        },
        marketing_expenses: {
          accounts: ['6300000', '6310000'],
          categories: {
            '6300000': 'Advertising Expense',
            '6310000': 'Promotions & Discounts'
          }
        },
        general_expenses: {
          accounts: ['6400000', '6410000', '6420000'],
          categories: {
            '6400000': 'Insurance Expense',
            '6410000': 'License & Permits',
            '6420000': 'Office Supplies'
          }
        }
      },
      key_metrics: {
        service_gross_margin_target: 85,
        product_gross_margin_target: 50,
        staff_cost_percentage_target: 45,
        rent_percentage_target: 10,
        operating_margin_target: 20,
        net_margin_target: 15
      },
      alerts: {
        low_margin_threshold: 10,
        high_expense_ratio: 0.8,
        negative_profit: true
      },
      smart_codes: {
        daily_pl: 'HERA.SALON.PL.DAILY.REPORT.V1',
        margin_analysis: 'HERA.SALON.PL.MARGIN.ANALYSIS.V1',
        expense_breakdown: 'HERA.SALON.PL.EXPENSE.BREAKDOWN.V1'
      }
    },

    restaurant: {
      name: 'Restaurant & Food Service',
      revenue_structure: {
        food_revenue: {
          accounts: ['4100000', '4110000'],
          categories: {
            '4100000': 'Food Sales - Dine In',
            '4110000': 'Food Sales - Takeout'
          }
        },
        beverage_revenue: {
          accounts: ['4200000', '4210000'],
          categories: {
            '4200000': 'Beverage Sales',
            '4210000': 'Bar Sales'
          }
        }
      },
      expense_structure: {
        cost_of_goods_sold: {
          accounts: ['5100000', '5200000'],
          categories: {
            '5100000': 'Cost of Food Sold',
            '5200000': 'Cost of Beverages Sold'
          }
        },
        labor_expenses: {
          accounts: ['6100000', '6110000', '6120000'],
          categories: {
            '6100000': 'Kitchen Staff Wages',
            '6110000': 'Service Staff Wages',
            '6120000': 'Management Salaries'
          }
        }
      },
      key_metrics: {
        food_cost_percentage_target: 30,
        beverage_cost_percentage_target: 20,
        labor_cost_percentage_target: 30,
        prime_cost_target: 60,
        operating_margin_target: 15
      },
      smart_codes: {
        daily_pl: 'HERA.REST.PL.DAILY.REPORT.V1',
        food_cost_analysis: 'HERA.REST.PL.FOOD.COST.V1'
      }
    },

    healthcare: {
      name: 'Healthcare & Medical Services',
      revenue_structure: {
        patient_revenue: {
          accounts: ['4100000', '4110000', '4120000'],
          categories: {
            '4100000': 'Consultation Fees',
            '4110000': 'Procedure Fees',
            '4120000': 'Lab Test Fees'
          }
        },
        insurance_revenue: {
          accounts: ['4200000'],
          categories: {
            '4200000': 'Insurance Reimbursements'
          }
        }
      },
      expense_structure: {
        medical_staff: {
          accounts: ['6100000', '6110000'],
          categories: {
            '6100000': 'Doctor Salaries',
            '6110000': 'Nurse Salaries'
          }
        },
        medical_supplies: {
          accounts: ['6300000'],
          categories: {
            '6300000': 'Medical Supplies & Equipment'
          }
        }
      },
      key_metrics: {
        gross_margin_target: 75,
        staff_cost_percentage_target: 55,
        supply_cost_percentage_target: 12,
        operating_margin_target: 20
      },
      smart_codes: {
        daily_pl: 'HERA.HEALTH.PL.DAILY.REPORT.V1',
        patient_revenue_analysis: 'HERA.HEALTH.PL.PATIENT.REV.V1'
      }
    }
  }
}

// TypeScript interfaces
export interface PLLineItem {
  account_code: string
  account_name: string
  section_type: 'Revenue' | 'COGS' | 'Operating Expenses' | 'Other Income' | 'Other Expenses'
  subsection: string
  current_amount: number
  prior_amount?: number
  ytd_amount?: number
  budget_amount?: number
  variance_amount?: number
  variance_percentage?: number
}

export interface PLSummaryMetrics {
  total_revenue: number
  gross_profit: number
  gross_margin: number
  operating_income: number
  operating_margin: number
  ebitda: number
  ebitda_margin: number
  net_income: number
  net_margin: number
}

export interface PLReport {
  organization_id: string
  organization_name: string
  report_date: string
  industry_type: string
  line_items: PLLineItem[]
  summary_metrics: PLSummaryMetrics
  key_ratios: Record<string, number>
  performance_indicators: string[]
}

// Industry-specific P&L service interface
export interface IndustryPLService {
  generateDailyPL(date?: Date): Promise<PLReport>
  generateMonthlyPL(year: number, month: number): Promise<PLReport>
  generateYearlyPL(year: number): Promise<PLReport>
  calculateMargins(report: PLReport): PLSummaryMetrics
  analyzeExpenseRatios(report: PLReport): Record<string, number>
  detectAnomalies(report: PLReport): string[]
  generateInsights(report: PLReport): string[]
}

// Base P&L Service Implementation
export class BasePLService implements IndustryPLService {
  constructor(
    protected universalApi: UniversalAPIClient,
    protected organizationId: string,
    protected industryConfig: any
  ) {}

  async generateDailyPL(date: Date = new Date()): Promise<PLReport> {
    // Get trial balance data for P&L accounts
    const { data: glAccounts } = await this.universalApi.query('core_entities', {
      filters: {
        organization_id: this.organizationId,
        entity_type: 'gl_account',
        entity_code: { startsWith: ['4', '5', '6', '7', '8'] }
      }
    })

    // Get journal entries for the day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: transactions } = await this.universalApi.query('universal_transactions', {
      filters: {
        organization_id: this.organizationId,
        transaction_type: 'journal_entry',
        transaction_date: { between: [startOfDay, endOfDay] }
      }
    })

    // Process and categorize line items
    const lineItems = this.processLineItems(glAccounts, transactions)
    const summaryMetrics = this.calculateMargins({ line_items: lineItems } as PLReport)

    return {
      organization_id: this.organizationId,
      organization_name: 'Organization Name', // Would fetch from org data
      report_date: date.toISOString(),
      industry_type: this.industryConfig.name,
      line_items: lineItems,
      summary_metrics: summaryMetrics,
      key_ratios: this.calculateKeyRatios(summaryMetrics),
      performance_indicators: this.generatePerformanceIndicators(summaryMetrics)
    }
  }

  async generateMonthlyPL(year: number, month: number): Promise<PLReport> {
    // Similar implementation for monthly P&L
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Aggregate daily data for the month
    // Implementation would follow similar pattern

    return {} as PLReport
  }

  async generateYearlyPL(year: number): Promise<PLReport> {
    // Yearly P&L aggregation
    return {} as PLReport
  }

  calculateMargins(report: PLReport): PLSummaryMetrics {
    const revenue = report.line_items
      .filter(item => item.section_type === 'Revenue')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const cogs = report.line_items
      .filter(item => item.section_type === 'COGS')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const opex = report.line_items
      .filter(item => item.section_type === 'Operating Expenses')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const otherIncome = report.line_items
      .filter(item => item.section_type === 'Other Income')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const otherExpenses = report.line_items
      .filter(item => item.section_type === 'Other Expenses')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const grossProfit = revenue - cogs
    const operatingIncome = grossProfit - opex
    const ebitda = operatingIncome + otherIncome
    const netIncome = ebitda - otherExpenses

    return {
      total_revenue: revenue,
      gross_profit: grossProfit,
      gross_margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operating_income: operatingIncome,
      operating_margin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      ebitda: ebitda,
      ebitda_margin: revenue > 0 ? (ebitda / revenue) * 100 : 0,
      net_income: netIncome,
      net_margin: revenue > 0 ? (netIncome / revenue) * 100 : 0
    }
  }

  analyzeExpenseRatios(report: PLReport): Record<string, number> {
    const revenue = report.summary_metrics.total_revenue
    const ratios: Record<string, number> = {}

    // Calculate expense ratios by category
    const expenseCategories = report.line_items
      .filter(item => item.section_type === 'Operating Expenses')
      .reduce(
        (acc, item) => {
          acc[item.subsection] = (acc[item.subsection] || 0) + item.current_amount
          return acc
        },
        {} as Record<string, number>
      )

    Object.entries(expenseCategories).forEach(([category, amount]) => {
      ratios[`${category}_ratio`] = revenue > 0 ? (amount / revenue) * 100 : 0
    })

    return ratios
  }

  detectAnomalies(report: PLReport): string[] {
    const anomalies: string[] = []
    const metrics = report.summary_metrics
    const industryMetrics = this.industryConfig.key_metrics

    // Check against industry benchmarks
    if (metrics.gross_margin < industryMetrics.service_gross_margin_target - 10) {
      anomalies.push('Gross margin significantly below industry target')
    }

    if (metrics.net_margin < 0) {
      anomalies.push('Negative net income - business is operating at a loss')
    }

    // Check expense ratios
    const expenseRatios = this.analyzeExpenseRatios(report)
    if (
      expenseRatios['Payroll & Benefits_ratio'] >
      industryMetrics.staff_cost_percentage_target + 5
    ) {
      anomalies.push('Staff costs exceed industry benchmark')
    }

    return anomalies
  }

  generateInsights(report: PLReport): string[] {
    const insights: string[] = []
    const metrics = report.summary_metrics

    // Revenue insights
    if (metrics.total_revenue > 0) {
      insights.push(`Daily revenue: ${this.formatCurrency(metrics.total_revenue)}`)
    }

    // Profitability insights
    if (metrics.net_margin >= 15) {
      insights.push('Excellent profitability - exceeding industry standards')
    } else if (metrics.net_margin >= 10) {
      insights.push('Good profitability - meeting targets')
    } else if (metrics.net_margin >= 5) {
      insights.push('Moderate profitability - opportunities for improvement')
    } else {
      insights.push('Low profitability - cost optimization needed')
    }

    // Expense insights
    const expenseRatios = this.analyzeExpenseRatios(report)
    const highestExpense = Object.entries(expenseRatios).sort(([, a], [, b]) => b - a)[0]

    if (highestExpense) {
      insights.push(
        `Highest expense category: ${highestExpense[0]} at ${highestExpense[1].toFixed(1)}% of revenue`
      )
    }

    return insights
  }

  protected processLineItems(accounts: any[], transactions: any[]): PLLineItem[] {
    // Process GL accounts and transactions to create line items
    // This would aggregate transaction amounts by account
    return []
  }

  protected calculateKeyRatios(metrics: PLSummaryMetrics): Record<string, number> {
    return {
      gross_margin: metrics.gross_margin,
      operating_margin: metrics.operating_margin,
      net_margin: metrics.net_margin,
      ebitda_margin: metrics.ebitda_margin
    }
  }

  protected generatePerformanceIndicators(metrics: PLSummaryMetrics): string[] {
    const indicators: string[] = []

    if (metrics.net_income > 0) {
      indicators.push('profitable')
    } else {
      indicators.push('loss-making')
    }

    if (metrics.gross_margin > 70) {
      indicators.push('high-margin')
    } else if (metrics.gross_margin > 50) {
      indicators.push('moderate-margin')
    } else {
      indicators.push('low-margin')
    }

    return indicators
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
}

// Salon-specific P&L Service
export class SalonPLService extends BasePLService {
  constructor(universalApi: UniversalAPIClient, organizationId: string) {
    super(universalApi, organizationId, PROFIT_LOSS_DNA_CONFIG.industries.salon)
  }

  generateInsights(report: PLReport): string[] {
    const baseInsights = super.generateInsights(report)
    const salonInsights: string[] = []

    // Salon-specific insights
    const serviceRevenue = report.line_items
      .filter(item => item.subsection === 'Service Revenue')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const productRevenue = report.line_items
      .filter(item => item.subsection === 'Product Revenue')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const totalRevenue = report.summary_metrics.total_revenue

    if (totalRevenue > 0) {
      const serviceMix = (serviceRevenue / totalRevenue) * 100
      const productMix = (productRevenue / totalRevenue) * 100

      salonInsights.push(`Service revenue mix: ${serviceMix.toFixed(1)}%`)
      salonInsights.push(`Product revenue mix: ${productMix.toFixed(1)}%`)

      if (productMix < 20) {
        salonInsights.push('Consider promoting retail products to increase revenue')
      }
    }

    // Staff productivity
    const staffCosts = report.line_items
      .filter(item => item.subsection === 'Payroll & Benefits')
      .reduce((sum, item) => sum + item.current_amount, 0)

    if (staffCosts > 0 && serviceRevenue > 0) {
      const staffProductivity = serviceRevenue / staffCosts
      salonInsights.push(`Staff productivity ratio: ${staffProductivity.toFixed(2)}x`)

      if (staffProductivity < 2) {
        salonInsights.push('Staff productivity below target - review scheduling or pricing')
      }
    }

    return [...baseInsights, ...salonInsights]
  }
}

// Restaurant-specific P&L Service
export class RestaurantPLService extends BasePLService {
  constructor(universalApi: UniversalAPIClient, organizationId: string) {
    super(universalApi, organizationId, PROFIT_LOSS_DNA_CONFIG.industries.restaurant)
  }

  generateInsights(report: PLReport): string[] {
    const baseInsights = super.generateInsights(report)
    const restaurantInsights: string[] = []

    // Calculate prime cost (COGS + Labor)
    const cogs = report.line_items
      .filter(item => item.section_type === 'COGS')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const laborCosts = report.line_items
      .filter(item => item.subsection === 'Labor Costs')
      .reduce((sum, item) => sum + item.current_amount, 0)

    const primeCost = cogs + laborCosts
    const revenue = report.summary_metrics.total_revenue

    if (revenue > 0) {
      const primeCostPercentage = (primeCost / revenue) * 100
      restaurantInsights.push(`Prime cost: ${primeCostPercentage.toFixed(1)}%`)

      if (primeCostPercentage > 60) {
        restaurantInsights.push(
          'Prime cost exceeds target - review food costs and labor efficiency'
        )
      }
    }

    return [...baseInsights, ...restaurantInsights]
  }
}

// Factory function to create industry-specific P&L services
export function createPLService(
  universalApi: UniversalAPIClient,
  organizationId: string,
  industryType: string = 'universal'
): IndustryPLService {
  switch (industryType) {
    case 'salon':
      return new SalonPLService(universalApi, organizationId)
    case 'restaurant':
      return new RestaurantPLService(universalApi, organizationId)
    case 'healthcare':
      // Would create HealthcarePLService
      return new BasePLService(
        universalApi,
        organizationId,
        PROFIT_LOSS_DNA_CONFIG.industries.healthcare
      )
    default:
      return new BasePLService(
        universalApi,
        organizationId,
        PROFIT_LOSS_DNA_CONFIG.industries[industryType] || {}
      )
  }
}

// React hook for P&L data
export function useProfitLossData(organizationId: string, industryType: string, date?: Date) {
  const universalApi = new UniversalAPIClient()
  const plService = createPLService(universalApi, organizationId, industryType)

  // This would be implemented with React Query or similar
  // to fetch and cache P&L data

  return {
    plService,
    generateDailyReport: () => plService.generateDailyPL(date),
    generateMonthlyReport: (year: number, month: number) => plService.generateMonthlyPL(year, month)
  }
}
