// ================================================================================
// HERA CASHFLOW DEMO DATA GENERATOR
// Creates realistic demo transactions for Hair Talkz salon cashflow demonstration
// Smart Code: HERA.FIN.CF.DEMO.GENERATOR.v1
// ================================================================================

import { universalApi } from '../universal-api'
import { HairSalonCashflowTemplate } from './industry-templates'

// ================================================================================
// DEMO TRANSACTION TEMPLATES
// ================================================================================

interface DemoTransaction {
  transaction_type: string
  description: string
  smart_code: string
  amount_range: [number, number]
  frequency_per_month: number
  category: 'operating' | 'investing' | 'financing'
  cash_impact: 'inflow' | 'outflow'
  seasonality_factor?: number
}

const HairSalonDemoTransactions: DemoTransaction[] = [
  // Operating Activities - Cash Inflows
  {
    transaction_type: 'service_revenue',
    description: 'Haircut service',
    smart_code: 'HERA.SALON.SVC.TXN.HAIRCUT.v1',
    amount_range: [35, 85],
    frequency_per_month: 180, // ~6 haircuts per day
    category: 'operating',
    cash_impact: 'inflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'service_revenue',
    description: 'Hair coloring service',
    smart_code: 'HERA.SALON.SVC.TXN.COLOR.v1',
    amount_range: [120, 350],
    frequency_per_month: 45, // ~1.5 per day
    category: 'operating',
    cash_impact: 'inflow',
    seasonality_factor: 1.2 // Higher demand for special occasions
  },
  {
    transaction_type: 'service_revenue',
    description: 'Hair styling service',
    smart_code: 'HERA.SALON.SVC.TXN.STYLE.v1',
    amount_range: [45, 120],
    frequency_per_month: 60, // ~2 per day
    category: 'operating',
    cash_impact: 'inflow',
    seasonality_factor: 1.3 // High for events
  },
  {
    transaction_type: 'product_sale',
    description: 'Hair care product sale',
    smart_code: 'HERA.SALON.PRD.TXN.SALE.v1',
    amount_range: [15, 85],
    frequency_per_month: 90, // ~3 per day
    category: 'operating',
    cash_impact: 'inflow',
    seasonality_factor: 1.1
  },

  // Operating Activities - Cash Outflows
  {
    transaction_type: 'supply_purchase',
    description: 'Hair product supplies',
    smart_code: 'HERA.SALON.INV.PUR.SUPPLY.v1',
    amount_range: [200, 800],
    frequency_per_month: 8, // Weekly supply orders
    category: 'operating',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'staff_payment',
    description: 'Stylist salary payment',
    smart_code: 'HERA.SALON.HR.PAY.STYLIST.v1',
    amount_range: [2500, 4500],
    frequency_per_month: 6, // 3 stylists × 2 payments per month
    category: 'operating',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'rent_payment',
    description: 'Salon rent payment',
    smart_code: 'HERA.SALON.FAC.PAY.RENT.v1',
    amount_range: [4500, 4500], // Fixed rent
    frequency_per_month: 1,
    category: 'operating',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'utility_payment',
    description: 'Electricity and water bill',
    smart_code: 'HERA.SALON.FAC.PAY.UTIL.v1',
    amount_range: [350, 650],
    frequency_per_month: 2, // Monthly bills
    category: 'operating',
    cash_impact: 'outflow',
    seasonality_factor: 1.2 // Higher in summer (AC)
  },
  {
    transaction_type: 'marketing_payment',
    description: 'Social media advertising',
    smart_code: 'HERA.SALON.MKT.PAY.SOCIAL.v1',
    amount_range: [200, 500],
    frequency_per_month: 2, // Bi-weekly ad campaigns
    category: 'operating',
    cash_impact: 'outflow',
    seasonality_factor: 1.5 // Higher marketing for events
  },
  {
    transaction_type: 'insurance_payment',
    description: 'Business insurance premium',
    smart_code: 'HERA.SALON.INS.PAY.PREM.v1',
    amount_range: [450, 450], // Fixed premium
    frequency_per_month: 0.33, // Quarterly payment
    category: 'operating',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },

  // Investing Activities
  {
    transaction_type: 'equipment_purchase',
    description: 'Professional hair dryer',
    smart_code: 'HERA.SALON.EQP.PUR.DRYER.v1',
    amount_range: [300, 800],
    frequency_per_month: 0.2, // Every 5 months
    category: 'investing',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'equipment_purchase',
    description: 'Salon chair',
    smart_code: 'HERA.SALON.EQP.PUR.CHAIR.v1',
    amount_range: [800, 2500],
    frequency_per_month: 0.1, // Every 10 months
    category: 'investing',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'renovation',
    description: 'Salon renovation/upgrade',
    smart_code: 'HERA.SALON.CAP.INV.RENO.v1',
    amount_range: [2000, 15000],
    frequency_per_month: 0.05, // Every 20 months
    category: 'investing',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },

  // Financing Activities
  {
    transaction_type: 'owner_contribution',
    description: 'Owner cash injection',
    smart_code: 'HERA.SALON.FIN.OWNER.CONTRIB.v1',
    amount_range: [5000, 25000],
    frequency_per_month: 0.08, // Every 12-15 months
    category: 'financing',
    cash_impact: 'inflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'loan_payment',
    description: 'Equipment loan repayment',
    smart_code: 'HERA.SALON.FIN.LOAN.REPAY.v1',
    amount_range: [850, 850], // Fixed loan payment
    frequency_per_month: 1,
    category: 'financing',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  },
  {
    transaction_type: 'owner_withdrawal',
    description: 'Owner salary/distribution',
    smart_code: 'HERA.SALON.FIN.OWNER.WITHDRAW.v1',
    amount_range: [3000, 5000],
    frequency_per_month: 2, // Bi-weekly
    category: 'financing',
    cash_impact: 'outflow',
    seasonality_factor: 1.0
  }
]

// ================================================================================
// DEMO DATA GENERATOR CLASS
// ================================================================================

export class CashflowDemoDataGenerator {
  private organizationId: string
  private salonTemplate = HairSalonCashflowTemplate

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Generate comprehensive demo data for Hair Talkz salon
   */
  async generateHairSalonDemoData(months: number = 6): Promise<{
    success: boolean
    transactions_created: number
    total_revenue: number
    total_expenses: number
    net_cashflow: number
    summary: any
  }> {
    console.log(`🎭 Generating ${months} months of Hair Talkz salon demo data`)

    let transactionsCreated = 0
    let totalRevenue = 0
    let totalExpenses = 0
    const monthlySummary = []

    // Generate data for each month
    for (let month = 0; month < months; month++) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - month)

      const seasonalityFactor = this.getSeasonalityFactor(monthDate.getMonth())
      const monthTransactions = await this.generateMonthlyTransactions(monthDate, seasonalityFactor)

      transactionsCreated += monthTransactions.count
      totalRevenue += monthTransactions.revenue
      totalExpenses += monthTransactions.expenses

      monthlySummary.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        transactions: monthTransactions.count,
        revenue: monthTransactions.revenue,
        expenses: monthTransactions.expenses,
        net_cashflow: monthTransactions.revenue - monthTransactions.expenses
      })
    }

    // Create initial cash balance transaction
    await this.createInitialCashBalance()

    const netCashflow = totalRevenue - totalExpenses

    return {
      success: true,
      transactions_created: transactionsCreated,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_cashflow: netCashflow,
      summary: {
        business_name: 'Hair Talkz Salon',
        demo_period_months: months,
        monthly_breakdown: monthlySummary.reverse(), // Show chronologically
        average_monthly_revenue: totalRevenue / months,
        average_monthly_expenses: totalExpenses / months,
        cash_flow_positive_months: monthlySummary.filter(m => m.net_cashflow > 0).length,
        peak_month: monthlySummary.reduce((prev, current) =>
          prev.revenue > current.revenue ? prev : current
        ),
        industry_benchmarks: {
          operating_margin: (netCashflow / totalRevenue) * 100,
          target_margin: this.salonTemplate.benchmark_ratios.operating_cf_margin * 100,
          performance:
            netCashflow / totalRevenue >= this.salonTemplate.benchmark_ratios.operating_cf_margin
              ? 'Above Target'
              : 'Below Target'
        }
      }
    }
  }

  private async generateMonthlyTransactions(monthDate: Date, seasonalityFactor: number) {
    let transactionCount = 0
    let monthlyRevenue = 0
    let monthlyExpenses = 0

    for (const template of HairSalonDemoTransactions) {
      // Calculate how many transactions to generate this month
      const adjustedFrequency = Math.max(
        1,
        Math.round(
          template.frequency_per_month * seasonalityFactor * (template.seasonality_factor || 1)
        )
      )

      for (let i = 0; i < adjustedFrequency; i++) {
        const transactionDate = this.getRandomDateInMonth(monthDate)
        const amount = this.getRandomAmount(template.amount_range)

        try {
          const transaction = await universalApi.createTransaction(
            {
              transaction_type: template.transaction_type,
              transaction_code: this.generateTransactionNumber(template.transaction_type),
              transaction_date: transactionDate.toISOString(),
              reference_number: `DEMO-${template.transaction_type.toUpperCase()}-${Date.now()}-${i}`,
              description: template.description,
              total_amount: template.cash_impact === 'inflow' ? amount : -amount,
              status: 'completed',
              smart_code: template.smart_code,
              metadata: {
                demo_data: true,
                salon_name: 'Hair Talkz',
                cashflow_category: template.category,
                cash_impact: template.cash_impact,
                month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                seasonality_factor: seasonalityFactor
              }
            },
            this.organizationId
          )

          if (transaction.success) {
            transactionCount++

            if (template.cash_impact === 'inflow') {
              monthlyRevenue += amount
            } else {
              monthlyExpenses += amount
            }
          }
        } catch (error) {
          console.error('Error creating demo transaction:', error)
        }
      }
    }

    return {
      count: transactionCount,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses
    }
  }

  private async createInitialCashBalance() {
    // Create an initial cash balance transaction
    await universalApi.createTransaction(
      {
        transaction_type: 'opening_balance',
        transaction_code: 'OB-CASH-001',
        transaction_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
        description: 'Opening cash balance for Hair Talkz salon',
        reference_number: 'OPENING-BALANCE',
        total_amount: 25000, // Starting with $25k cash
        status: 'completed',
        smart_code: 'HERA.SALON.FIN.CASH.OPENING.v1',
        metadata: {
          demo_data: true,
          salon_name: 'Hair Talkz',
          cashflow_category: 'financing',
          cash_impact: 'inflow',
          gl_account_code: '1000', // Cash account
          account_name: 'Cash - Bank Account'
        }
      },
      this.organizationId
    )
  }

  private getSeasonalityFactor(month: number): number {
    // Convert 0-based month to quarters and apply salon seasonality
    const quarter = Math.floor(month / 3)
    const factors = [
      this.salonTemplate.seasonality_factors.q1, // Jan-Mar
      this.salonTemplate.seasonality_factors.q2, // Apr-Jun
      this.salonTemplate.seasonality_factors.q3, // Jul-Sep
      this.salonTemplate.seasonality_factors.q4 // Oct-Dec
    ]
    return factors[quarter] || 1.0
  }

  private getRandomDateInMonth(monthDate: Date): Date {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1

    return new Date(
      year,
      month,
      randomDay,
      Math.floor(Math.random() * 12) + 8, // Business hours: 8am-8pm
      Math.floor(Math.random() * 60)
    )
  }

  private getRandomAmount(range: [number, number]): number {
    const [min, max] = range
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private generateTransactionNumber(type: string): string {
    const prefix = type.toUpperCase().substring(0, 3)
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  /**
   * Create specific industry transactions for testing different scenarios
   */
  async createScenarioTransactions(
    scenario: 'peak_season' | 'slow_season' | 'equipment_purchase' | 'new_stylist'
  ) {
    console.log(`🎯 Creating ${scenario} scenario transactions`)

    switch (scenario) {
      case 'peak_season':
        return await this.createPeakSeasonScenario()
      case 'slow_season':
        return await this.createSlowSeasonScenario()
      case 'equipment_purchase':
        return await this.createEquipmentPurchaseScenario()
      case 'new_stylist':
        return await this.createNewStylistScenario()
      default:
        throw new Error('Unknown scenario type')
    }
  }

  private async createPeakSeasonScenario() {
    const transactions = [
      {
        type: 'service_revenue',
        description: 'Wedding party hair styling (5 people)',
        smart_code: 'HERA.SALON.SVC.TXN.WEDDING.v1',
        amount: 850,
        impact: 'inflow'
      },
      {
        type: 'service_revenue',
        description: 'Prom hair and makeup package',
        smart_code: 'HERA.SALON.SVC.TXN.PROM.v1',
        amount: 180,
        impact: 'inflow'
      },
      {
        type: 'supply_purchase',
        description: 'Extra styling products for events',
        smart_code: 'HERA.SALON.INV.PUR.EVENT.v1',
        amount: -450,
        impact: 'outflow'
      }
    ]

    return await this.createScenarioTransactionBatch(transactions, 'Peak Season')
  }

  private async createSlowSeasonScenario() {
    const transactions = [
      {
        type: 'marketing_payment',
        description: 'Promotional discount campaign',
        smart_code: 'HERA.SALON.MKT.PAY.PROMO.v1',
        amount: -300,
        impact: 'outflow'
      },
      {
        type: 'staff_payment',
        description: 'Reduced hours for stylist',
        smart_code: 'HERA.SALON.HR.PAY.REDUCED.v1',
        amount: -2000,
        impact: 'outflow'
      }
    ]

    return await this.createScenarioTransactionBatch(transactions, 'Slow Season')
  }

  private async createEquipmentPurchaseScenario() {
    const transactions = [
      {
        type: 'equipment_purchase',
        description: 'Professional hair washing station',
        smart_code: 'HERA.SALON.EQP.PUR.WASHSTATION.v1',
        amount: -3500,
        impact: 'outflow'
      },
      {
        type: 'loan_proceed',
        description: 'Equipment financing for wash station',
        smart_code: 'HERA.SALON.FIN.LOAN.EQUIP.v1',
        amount: 3000,
        impact: 'inflow'
      }
    ]

    return await this.createScenarioTransactionBatch(transactions, 'Equipment Purchase')
  }

  private async createNewStylistScenario() {
    const transactions = [
      {
        type: 'staff_expense',
        description: 'New stylist recruitment costs',
        smart_code: 'HERA.SALON.HR.EXP.RECRUIT.v1',
        amount: -800,
        impact: 'outflow'
      },
      {
        type: 'equipment_purchase',
        description: 'Styling tools for new stylist',
        smart_code: 'HERA.SALON.EQP.PUR.TOOLS.v1',
        amount: -450,
        impact: 'outflow'
      },
      {
        type: 'service_revenue',
        description: 'Increased revenue from additional stylist',
        smart_code: 'HERA.SALON.SVC.TXN.NEWREV.v1',
        amount: 2200,
        impact: 'inflow'
      }
    ]

    return await this.createScenarioTransactionBatch(transactions, 'New Stylist')
  }

  private async createScenarioTransactionBatch(transactions: any[], scenarioName: string) {
    let createdCount = 0

    for (const txn of transactions) {
      try {
        const result = await universalApi.createTransaction(
          {
            transaction_type: txn.type,
            transaction_code: this.generateTransactionNumber(txn.type),
            transaction_date: new Date().toISOString(),
            description: txn.description,
            reference_number: `SCENARIO-${scenarioName.toUpperCase()}-${Date.now()}`,
            total_amount: txn.amount,
            status: 'completed',
            smart_code: txn.smart_code,
            metadata: {
              demo_data: true,
              scenario: scenarioName,
              salon_name: 'Hair Talkz',
              cashflow_category: this.getCashflowCategory(txn.smart_code),
              cash_impact: txn.impact
            }
          },
          this.organizationId
        )

        if (result.success) {
          createdCount++
        }
      } catch (error) {
        console.error(`Error creating ${scenarioName} transaction:`, error)
      }
    }

    return {
      success: true,
      scenario: scenarioName,
      transactions_created: createdCount
    }
  }

  private getCashflowCategory(smartCode: string): 'operating' | 'investing' | 'financing' {
    if (
      smartCode.includes('.SVC.') ||
      smartCode.includes('.INV.') ||
      smartCode.includes('.HR.') ||
      smartCode.includes('.MKT.')
    ) {
      return 'operating'
    }
    if (smartCode.includes('.EQP.') || smartCode.includes('.CAP.')) {
      return 'investing'
    }
    if (smartCode.includes('.FIN.') || smartCode.includes('.LOAN.')) {
      return 'financing'
    }
    return 'operating' // Default
  }

  /**
   * Generate GL account mapping for cashflow categories
   */
  async setupHairSalonGLAccounts(): Promise<{
    success: boolean
    accounts_created: number
    mapping: any
  }> {
    console.log('💰 Setting up Hair Talkz GL accounts for cashflow tracking')

    const glAccounts = [
      // Cash and Cash Equivalents
      { code: '1000', name: 'Cash - Bank Account', category: 'asset', normal_balance: 'debit' },
      { code: '1010', name: 'Cash - Petty Cash', category: 'asset', normal_balance: 'debit' },

      // Revenue Accounts
      { code: '4100', name: 'Hair Service Revenue', category: 'revenue', normal_balance: 'credit' },
      {
        code: '4200',
        name: 'Product Sales Revenue',
        category: 'revenue',
        normal_balance: 'credit'
      },

      // Operating Expense Accounts
      { code: '5100', name: 'Cost of Products Sold', category: 'expense', normal_balance: 'debit' },
      { code: '6100', name: 'Salaries and Wages', category: 'expense', normal_balance: 'debit' },
      { code: '6200', name: 'Rent Expense', category: 'expense', normal_balance: 'debit' },
      { code: '6300', name: 'Utilities Expense', category: 'expense', normal_balance: 'debit' },
      { code: '6400', name: 'Supplies Expense', category: 'expense', normal_balance: 'debit' },
      { code: '6500', name: 'Marketing Expense', category: 'expense', normal_balance: 'debit' },
      { code: '6600', name: 'Insurance Expense', category: 'expense', normal_balance: 'debit' },

      // Fixed Assets (Investing)
      { code: '1500', name: 'Salon Equipment', category: 'asset', normal_balance: 'debit' },
      { code: '1510', name: 'Furniture and Fixtures', category: 'asset', normal_balance: 'debit' },

      // Liabilities (Financing)
      {
        code: '2100',
        name: 'Equipment Loan Payable',
        category: 'liability',
        normal_balance: 'credit'
      },
      { code: '2200', name: 'Line of Credit', category: 'liability', normal_balance: 'credit' },

      // Equity (Financing)
      { code: '3100', name: 'Owner Equity', category: 'equity', normal_balance: 'credit' },
      { code: '3200', name: 'Retained Earnings', category: 'equity', normal_balance: 'credit' }
    ]

    let accountsCreated = 0
    const accountMapping: any = {}

    for (const account of glAccounts) {
      try {
        const result = await universalApi.createEntity(
          {
            entity_type: 'account',
            entity_name: account.name,
            entity_code: account.code,
            smart_code: `HERA.SALON.GL.ACC.${account.code}.v1`,
            status: 'active',
            business_rules: {
              ledger_type: 'GL',
              account_classification: account.category,
              accounting_rules: {
                normal_balance: account.normal_balance
              }
            },
            metadata: {
              account_type: account.category,
              normal_balance: account.normal_balance,
              salon_specific: true
            }
          },
          this.organizationId
        )

        if (result.success) {
          accountsCreated++
          accountMapping[account.code] = {
            id: result.data?.id,
            name: account.name,
            category: account.category
          }
        }
      } catch (error) {
        console.error(`Error creating GL account ${account.code}:`, error)
      }
    }

    return {
      success: true,
      accounts_created: accountsCreated,
      mapping: accountMapping
    }
  }
}

// ================================================================================
// CONVENIENCE FUNCTIONS
// ================================================================================

/**
 * Quick setup function for Hair Talkz demo
 */
export async function setupHairSalonCashflowDemo(organizationId: string) {
  console.log('🚀 Setting up complete Hair Talkz cashflow demo')

  const generator = new CashflowDemoDataGenerator(organizationId)

  // Setup GL accounts first
  const glSetup = await generator.setupHairSalonGLAccounts()
  console.log(`✅ GL Accounts setup: ${glSetup.accounts_created} accounts created`)

  // Generate 6 months of demo data
  const demoData = await generator.generateHairSalonDemoData(6)
  console.log(`✅ Demo data generated: ${demoData.transactions_created} transactions`)

  // Create some scenario transactions
  const scenarios = ['peak_season', 'equipment_purchase', 'new_stylist']
  const scenarioResults = []

  for (const scenario of scenarios) {
    const result = await generator.createScenarioTransactions(scenario as any)
    scenarioResults.push(result)
    console.log(`✅ ${scenario} scenario: ${result.transactions_created} transactions`)
  }

  return {
    success: true,
    message: 'Hair Talkz cashflow demo setup completed successfully',
    details: {
      gl_accounts: glSetup,
      demo_data: demoData,
      scenarios: scenarioResults
    },
    next_steps: [
      'Access cashflow dashboard to view statements',
      'Generate direct and indirect method reports',
      'Analyze cashflow trends and forecasts',
      'Compare against salon industry benchmarks',
      'Test different reporting periods and scenarios'
    ]
  }
}
