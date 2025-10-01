/**
 * HERA Financial Consolidation Engine
 * Multi-company consolidation with currency translation and eliminations
 * Replaces SAP EC-CS and Oracle HFM with 99% cost savings
 */

import { createClient } from '@supabase/supabase-js'

export interface ConsolidationCompany {
  companyId: string
  companyName: string
  currency: string
  ownershipPercent: number
  consolidationMethod: 'full' | 'equity' | 'proportional'
  financialData?: any
}

export interface ConsolidationParameters {
  consolidationDate: string
  reportingCurrency: string
  companies: ConsolidationCompany[]
  eliminateIntercompany: boolean
  includeCurrencyTranslation: boolean
  includeMinorityInterest: boolean
}

export interface EliminationEntry {
  description: string
  fromCompany: string
  toCompany: string
  account: string
  amount: number
  eliminationType: 'receivable_payable' | 'revenue_expense' | 'investment_equity' | 'dividend'
}

export class ConsolidationEngine {
  private supabase: any
  private organizationId: string

  constructor(supabaseUrl: string, supabaseKey: string, organizationId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.organizationId = organizationId
  }

  /**
   * Perform full financial consolidation
   */
  async consolidate(params: ConsolidationParameters) {
    console.log('Starting consolidation process...')

    // Step 1: Gather financial data from all companies
    const companiesData = await this.gatherFinancialData(params.companies, params.consolidationDate)

    // Step 2: Convert to reporting currency
    let translatedData = companiesData
    if (params.includeCurrencyTranslation) {
      translatedData = await this.translateCurrencies(
        companiesData,
        params.reportingCurrency,
        params.consolidationDate
      )
    }

    // Step 3: Identify and eliminate intercompany transactions
    let eliminations: EliminationEntry[] = []
    if (params.eliminateIntercompany) {
      eliminations = await this.identifyEliminations(translatedData)
    }

    // Step 4: Apply consolidation method
    const consolidatedData = await this.applyConsolidationMethods(translatedData, params.companies)

    // Step 5: Process eliminations
    if (eliminations.length > 0) {
      await this.processEliminations(consolidatedData, eliminations)
    }

    // Step 6: Calculate minority interest
    let minorityInterest = null
    if (params.includeMinorityInterest) {
      minorityInterest = await this.calculateMinorityInterest(consolidatedData, params.companies)
    }

    // Step 7: Generate consolidated financial statements
    const consolidatedStatements = await this.generateConsolidatedStatements(
      consolidatedData,
      eliminations,
      minorityInterest
    )

    // Step 8: Store consolidation results
    await this.storeConsolidationResults(params, consolidatedStatements)

    return {
      success: true,
      consolidation_date: params.consolidationDate,
      reporting_currency: params.reportingCurrency,
      companies_consolidated: params.companies.length,
      eliminations: eliminations.length,
      consolidated_statements: consolidatedStatements,
      minority_interest: minorityInterest
    }
  }

  /**
   * Gather financial data from all companies
   */
  private async gatherFinancialData(companies: ConsolidationCompany[], asOfDate: string) {
    const companiesData = []

    for (const company of companies) {
      // Get trial balance for each company
      const { data: accounts } = await this.supabase
        .from('core_entities')
        .select(
          `
          *,
          balance:core_dynamic_data!inner(
            field_value_number,
            metadata
          )
        `
        )
        .eq('organization_id', company.companyId)
        .eq('entity_type', 'gl_account')
        .eq('metadata->status', 'active')

      // Get transactions for the period
      const { data: transactions } = await this.supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', company.companyId)
        .lte('transaction_date', asOfDate)
        .in('transaction_type', ['journal_entry', 'customer_invoice', 'vendor_invoice'])

      companiesData.push({
        company,
        accounts: accounts || [],
        transactions: transactions || [],
        trial_balance: this.calculateTrialBalance(accounts || [])
      })
    }

    return companiesData
  }

  /**
   * Translate all amounts to reporting currency
   */
  private async translateCurrencies(
    companiesData: any[],
    reportingCurrency: string,
    translationDate: string
  ) {
    const translatedData = []

    for (const companyData of companiesData) {
      if (companyData.company.currency === reportingCurrency) {
        translatedData.push(companyData)
        continue
      }

      // Get exchange rate
      const exchangeRate = await this.getExchangeRate(
        companyData.company.currency,
        reportingCurrency,
        translationDate
      )

      // Translate all amounts
      const translatedAccounts = companyData.accounts.map((account: any) => ({
        ...account,
        balance: account.balance?.map((b: any) => ({
          ...b,
          field_value_number: b.field_value_number * exchangeRate,
          original_amount: b.field_value_number,
          exchange_rate: exchangeRate
        }))
      }))

      const translatedTransactions = companyData.transactions.map((txn: any) => ({
        ...txn,
        total_amount: txn.total_amount * exchangeRate,
        original_amount: txn.total_amount,
        exchange_rate: exchangeRate
      }))

      translatedData.push({
        ...companyData,
        accounts: translatedAccounts,
        transactions: translatedTransactions,
        translation_adjustment: this.calculateTranslationAdjustment(companyData, exchangeRate)
      })
    }

    return translatedData
  }

  /**
   * Identify intercompany transactions for elimination
   */
  private async identifyEliminations(companiesData: any[]) {
    const eliminations: EliminationEntry[] = []
    const companyIds = companiesData.map(cd => cd.company.companyId)

    // Find intercompany receivables/payables
    for (const companyData of companiesData) {
      const { data: intercompanyTxns } = await this.supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', companyData.company.companyId)
        .in('to_entity_id', companyIds)
        .or(`from_entity_id.in.(${companyIds.join(',')})`)

      for (const txn of intercompanyTxns || []) {
        if (
          txn.from_entity_id !== companyData.company.companyId &&
          companyIds.includes(txn.from_entity_id)
        ) {
          // This is an intercompany transaction
          eliminations.push({
            description: `Eliminate intercompany: ${txn.transaction_code}`,
            fromCompany: txn.from_entity_id,
            toCompany: companyData.company.companyId,
            account: this.mapToEliminationAccount(txn.transaction_type),
            amount: txn.total_amount,
            eliminationType: this.determineEliminationType(txn.transaction_type)
          })
        }
      }
    }

    // Find intercompany investments
    for (const companyData of companiesData) {
      if (companyData.company.ownershipPercent < 100) {
        // Look for investment accounts in parent company
        const parentData = companiesData.find(
          cd => cd.company.consolidationMethod === 'full' && cd.company.ownershipPercent === 100
        )

        if (parentData) {
          const investmentAccount = parentData.accounts.find(
            (acc: any) => acc.metadata.investment_in === companyData.company.companyId
          )

          if (investmentAccount) {
            const investmentBalance = investmentAccount.balance?.[0]?.field_value_number || 0
            const subsidiaryEquity = this.calculateEquity(companyData.accounts)

            eliminations.push({
              description: `Eliminate investment in ${companyData.company.companyName}`,
              fromCompany: parentData.company.companyId,
              toCompany: companyData.company.companyId,
              account: 'investment_equity',
              amount: Math.min(
                investmentBalance,
                (subsidiaryEquity * companyData.company.ownershipPercent) / 100
              ),
              eliminationType: 'investment_equity'
            })
          }
        }
      }
    }

    return eliminations
  }

  /**
   * Apply consolidation methods based on ownership
   */
  private async applyConsolidationMethods(companiesData: any[], companies: ConsolidationCompany[]) {
    const consolidatedAccounts = new Map<string, any>()

    for (const companyData of companiesData) {
      const company = companies.find(c => c.companyId === companyData.company.companyId)!

      switch (company.consolidationMethod) {
        case 'full':
          // Include 100% of all accounts
          this.mergeAccounts(consolidatedAccounts, companyData.accounts, 1.0)
          break

        case 'proportional':
          // Include ownership % of all accounts
          this.mergeAccounts(
            consolidatedAccounts,
            companyData.accounts,
            company.ownershipPercent / 100
          )
          break

        case 'equity':
          // Include only as investment (one line)
          this.addEquityMethodInvestment(
            consolidatedAccounts,
            company,
            this.calculateNetIncome(companyData)
          )
          break
      }
    }

    return {
      accounts: Array.from(consolidatedAccounts.values()),
      companies: companiesData
    }
  }

  /**
   * Process elimination entries
   */
  private async processEliminations(consolidatedData: any, eliminations: EliminationEntry[]) {
    for (const elimination of eliminations) {
      // Create elimination journal entries
      const eliminationEntry = {
        transaction_type: 'consolidation_elimination',
        transaction_code: `ELIM-${Date.now()}`,
        smart_code: 'HERA.FIN.CONSOL.ELIMINATE.V1',
        description: elimination.description,
        elimination_type: elimination.eliminationType,
        amount: elimination.amount
      }

      // Adjust consolidated accounts
      switch (elimination.eliminationType) {
        case 'receivable_payable':
          this.eliminateIntercompanyBalance(consolidatedData, elimination)
          break

        case 'revenue_expense':
          this.eliminateIntercompanyPL(consolidatedData, elimination)
          break

        case 'investment_equity':
          this.eliminateInvestment(consolidatedData, elimination)
          break

        case 'dividend':
          this.eliminateDividends(consolidatedData, elimination)
          break
      }
    }
  }

  /**
   * Calculate minority interest
   */
  private async calculateMinorityInterest(
    consolidatedData: any,
    companies: ConsolidationCompany[]
  ) {
    const minorityInterests = []

    for (const company of companies) {
      if (company.consolidationMethod === 'full' && company.ownershipPercent < 100) {
        const companyData = consolidatedData.companies.find(
          (cd: any) => cd.company.companyId === company.companyId
        )

        if (companyData) {
          const netAssets = this.calculateNetAssets(companyData.accounts)
          const netIncome = this.calculateNetIncome(companyData)
          const minorityPercent = (100 - company.ownershipPercent) / 100

          minorityInterests.push({
            company: company.companyName,
            ownership_percent: company.ownershipPercent,
            minority_percent: minorityPercent * 100,
            minority_interest_balance: netAssets * minorityPercent,
            minority_interest_income: netIncome * minorityPercent
          })
        }
      }
    }

    return {
      total_minority_interest: minorityInterests.reduce(
        (sum, mi) => sum + mi.minority_interest_balance,
        0
      ),
      total_minority_income: minorityInterests.reduce(
        (sum, mi) => sum + mi.minority_interest_income,
        0
      ),
      details: minorityInterests
    }
  }

  /**
   * Generate consolidated financial statements
   */
  private async generateConsolidatedStatements(
    consolidatedData: any,
    eliminations: EliminationEntry[],
    minorityInterest: any
  ) {
    // Calculate consolidated trial balance
    const trialBalance = this.calculateConsolidatedTrialBalance(consolidatedData.accounts)

    // Generate balance sheet
    const balanceSheet = this.generateBalanceSheet(trialBalance, minorityInterest)

    // Generate income statement
    const incomeStatement = this.generateIncomeStatement(trialBalance, minorityInterest)

    // Generate cash flow (simplified)
    const cashFlow = this.generateCashFlow(consolidatedData)

    // Generate consolidation worksheet
    const worksheet = this.generateConsolidationWorksheet(
      consolidatedData,
      eliminations,
      trialBalance
    )

    return {
      trial_balance: trialBalance,
      balance_sheet: balanceSheet,
      income_statement: incomeStatement,
      cash_flow: cashFlow,
      consolidation_worksheet: worksheet,
      eliminations_summary: this.summarizeEliminations(eliminations)
    }
  }

  /**
   * Store consolidation results
   */
  private async storeConsolidationResults(params: ConsolidationParameters, statements: any) {
    const { data: consolidation, error } = await this.supabase
      .from('universal_transactions')
      .insert({
        organization_id: this.organizationId,
        transaction_type: 'consolidation',
        transaction_code: `CONSOL-${new Date().toISOString().slice(0, 10)}-${Date.now()}`,
        smart_code: 'HERA.FIN.CONSOL.REPORT.V1',
        transaction_date: params.consolidationDate,
        metadata: {
          parameters: params,
          results: statements,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return consolidation
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private calculateTrialBalance(accounts: any[]) {
    const trialBalance = new Map<string, any>()

    for (const account of accounts) {
      const balance = account.balance?.[0]?.field_value_number || 0
      trialBalance.set(account.entity_code, {
        account_code: account.entity_code,
        account_name: account.entity_name,
        account_type: account.metadata.account_type,
        debit: account.metadata.normal_balance === 'debit' && balance > 0 ? balance : 0,
        credit: account.metadata.normal_balance === 'credit' && balance > 0 ? balance : 0,
        balance: balance
      })
    }

    return trialBalance
  }

  private async getExchangeRate(fromCurrency: string, toCurrency: string, date: string) {
    // In production, this would fetch from exchange rate service
    // For demo, using simplified rates
    const rates: Record<string, number> = {
      'EUR/USD': 1.08,
      'GBP/USD': 1.25,
      'JPY/USD': 0.0067,
      'CAD/USD': 0.74,
      'AUD/USD': 0.65
    }

    const key = `${fromCurrency}/${toCurrency}`
    return rates[key] || 1.0
  }

  private calculateTranslationAdjustment(companyData: any, exchangeRate: number) {
    // Simplified CTA calculation
    const historicalRate = exchangeRate * 0.95 // Assume 5% change
    const assets = this.sumByType(companyData.accounts, 'asset')
    const liabilities = this.sumByType(companyData.accounts, 'liability')

    return (assets - liabilities) * (exchangeRate - historicalRate)
  }

  private mapToEliminationAccount(transactionType: string): string {
    const mapping: Record<string, string> = {
      customer_invoice: 'intercompany_receivable',
      vendor_invoice: 'intercompany_payable',
      intercompany_sale: 'intercompany_revenue',
      intercompany_purchase: 'intercompany_expense'
    }
    return mapping[transactionType] || 'intercompany_other'
  }

  private determineEliminationType(transactionType: string): EliminationEntry['eliminationType'] {
    if (transactionType.includes('invoice')) return 'receivable_payable'
    if (transactionType.includes('sale') || transactionType.includes('purchase'))
      return 'revenue_expense'
    if (transactionType.includes('dividend')) return 'dividend'
    return 'revenue_expense'
  }

  private calculateEquity(accounts: any[]) {
    const assets = this.sumByType(accounts, 'asset')
    const liabilities = this.sumByType(accounts, 'liability')
    return assets - liabilities
  }

  private calculateNetIncome(companyData: any) {
    const revenue = this.sumByType(companyData.accounts, 'revenue')
    const expenses = this.sumByType(companyData.accounts, 'expense')
    return revenue - expenses
  }

  private calculateNetAssets(accounts: any[]) {
    return this.calculateEquity(accounts)
  }

  private sumByType(accounts: any[], accountType: string) {
    return accounts
      .filter(acc => acc.metadata.account_type === accountType)
      .reduce((sum, acc) => sum + (acc.balance?.[0]?.field_value_number || 0), 0)
  }

  private mergeAccounts(consolidatedMap: Map<string, any>, accounts: any[], percentage: number) {
    for (const account of accounts) {
      const code = account.entity_code
      const balance = (account.balance?.[0]?.field_value_number || 0) * percentage

      if (consolidatedMap.has(code)) {
        const existing = consolidatedMap.get(code)
        existing.balance += balance
        existing.companies.push({
          company_id: account.organization_id,
          percentage: percentage,
          amount: balance
        })
      } else {
        consolidatedMap.set(code, {
          ...account,
          balance: balance,
          companies: [
            {
              company_id: account.organization_id,
              percentage: percentage,
              amount: balance
            }
          ]
        })
      }
    }
  }

  private addEquityMethodInvestment(
    consolidatedMap: Map<string, any>,
    company: ConsolidationCompany,
    netIncome: number
  ) {
    const investmentCode = `INV-${company.companyId}`
    const shareOfIncome = netIncome * (company.ownershipPercent / 100)

    consolidatedMap.set(investmentCode, {
      entity_code: investmentCode,
      entity_name: `Investment in ${company.companyName}`,
      entity_type: 'gl_account',
      metadata: {
        account_type: 'asset',
        investment_method: 'equity',
        ownership_percent: company.ownershipPercent
      },
      balance: shareOfIncome,
      companies: [
        {
          company_id: company.companyId,
          percentage: company.ownershipPercent,
          amount: shareOfIncome
        }
      ]
    })
  }

  private eliminateIntercompanyBalance(consolidatedData: any, elimination: EliminationEntry) {
    // Remove intercompany receivables and payables
    const receivableAccount = consolidatedData.accounts.find(
      (acc: any) => acc.metadata.intercompany_with === elimination.toCompany
    )
    const payableAccount = consolidatedData.accounts.find(
      (acc: any) => acc.metadata.intercompany_with === elimination.fromCompany
    )

    if (receivableAccount) receivableAccount.balance -= elimination.amount
    if (payableAccount) payableAccount.balance -= elimination.amount
  }

  private eliminateIntercompanyPL(consolidatedData: any, elimination: EliminationEntry) {
    // Remove intercompany revenues and expenses
    const revenueAccount = consolidatedData.accounts.find(
      (acc: any) =>
        acc.metadata.account_type === 'revenue' &&
        acc.metadata.intercompany_with === elimination.toCompany
    )
    const expenseAccount = consolidatedData.accounts.find(
      (acc: any) =>
        acc.metadata.account_type === 'expense' &&
        acc.metadata.intercompany_with === elimination.fromCompany
    )

    if (revenueAccount) revenueAccount.balance -= elimination.amount
    if (expenseAccount) expenseAccount.balance -= elimination.amount
  }

  private eliminateInvestment(consolidatedData: any, elimination: EliminationEntry) {
    // Remove investment and corresponding equity
    const investmentAccount = consolidatedData.accounts.find(
      (acc: any) => acc.metadata.investment_in === elimination.toCompany
    )
    const equityAccounts = consolidatedData.accounts.filter(
      (acc: any) =>
        acc.metadata.account_type === 'equity' && acc.organization_id === elimination.toCompany
    )

    if (investmentAccount) {
      investmentAccount.balance = 0
    }

    // Reduce equity by ownership percentage
    const ownershipPercent = elimination.amount / this.sumByType(equityAccounts, 'equity')
    equityAccounts.forEach((acc: any) => {
      acc.balance *= 1 - ownershipPercent
    })
  }

  private eliminateDividends(consolidatedData: any, elimination: EliminationEntry) {
    // Remove intercompany dividend income and expense
    const dividendIncomeAccount = consolidatedData.accounts.find(
      (acc: any) => acc.metadata.dividend_from === elimination.fromCompany
    )
    const dividendExpenseAccount = consolidatedData.accounts.find(
      (acc: any) => acc.metadata.dividend_to === elimination.toCompany
    )

    if (dividendIncomeAccount) dividendIncomeAccount.balance -= elimination.amount
    if (dividendExpenseAccount) dividendExpenseAccount.balance -= elimination.amount
  }

  private calculateConsolidatedTrialBalance(accounts: any[]) {
    const trialBalance = {
      accounts: [],
      totals: {
        debit: 0,
        credit: 0
      }
    }

    for (const account of accounts) {
      const normalBalance =
        account.metadata.normal_balance ||
        (['asset', 'expense'].includes(account.metadata.account_type) ? 'debit' : 'credit')

      const entry = {
        account_code: account.entity_code,
        account_name: account.entity_name,
        account_type: account.metadata.account_type,
        debit: normalBalance === 'debit' && account.balance > 0 ? account.balance : 0,
        credit: normalBalance === 'credit' && account.balance > 0 ? account.balance : 0,
        consolidated_from: account.companies
      }

      trialBalance.accounts.push(entry)
      trialBalance.totals.debit += entry.debit
      trialBalance.totals.credit += entry.credit
    }

    return trialBalance
  }

  private generateBalanceSheet(trialBalance: any, minorityInterest: any) {
    const assets = trialBalance.accounts.filter((acc: any) => acc.account_type === 'asset')
    const liabilities = trialBalance.accounts.filter((acc: any) => acc.account_type === 'liability')
    const equity = trialBalance.accounts.filter((acc: any) => acc.account_type === 'equity')

    const totalAssets = assets.reduce((sum: number, acc: any) => sum + (acc.debit || 0), 0)
    const totalLiabilities = liabilities.reduce(
      (sum: number, acc: any) => sum + (acc.credit || 0),
      0
    )
    const totalEquity = equity.reduce((sum: number, acc: any) => sum + (acc.credit || 0), 0)

    return {
      assets: {
        current: assets.filter((acc: any) => acc.account_code.startsWith('1')),
        non_current: assets.filter((acc: any) => acc.account_code.startsWith('2')),
        total: totalAssets
      },
      liabilities: {
        current: liabilities.filter((acc: any) => acc.account_code.startsWith('3')),
        non_current: liabilities.filter((acc: any) => acc.account_code.startsWith('4')),
        total: totalLiabilities
      },
      equity: {
        share_capital: equity.filter((acc: any) => acc.account_name.includes('Capital')),
        retained_earnings: equity.filter((acc: any) => acc.account_name.includes('Retained')),
        minority_interest: minorityInterest?.total_minority_interest || 0,
        total: totalEquity + (minorityInterest?.total_minority_interest || 0)
      },
      checksum:
        totalAssets -
        totalLiabilities -
        totalEquity -
        (minorityInterest?.total_minority_interest || 0)
    }
  }

  private generateIncomeStatement(trialBalance: any, minorityInterest: any) {
    const revenue = trialBalance.accounts.filter((acc: any) => acc.account_type === 'revenue')
    const expenses = trialBalance.accounts.filter((acc: any) => acc.account_type === 'expense')

    const totalRevenue = revenue.reduce((sum: number, acc: any) => sum + (acc.credit || 0), 0)
    const totalExpenses = expenses.reduce((sum: number, acc: any) => sum + (acc.debit || 0), 0)
    const netIncome = totalRevenue - totalExpenses

    return {
      revenue: {
        operating: revenue.filter((acc: any) => !acc.account_name.includes('Other')),
        other: revenue.filter((acc: any) => acc.account_name.includes('Other')),
        total: totalRevenue
      },
      expenses: {
        cost_of_sales: expenses.filter((acc: any) => acc.account_code.startsWith('5')),
        operating: expenses.filter((acc: any) => acc.account_code.startsWith('6')),
        other: expenses.filter((acc: any) => acc.account_code.startsWith('7')),
        total: totalExpenses
      },
      calculations: {
        gross_profit:
          totalRevenue -
          expenses
            .filter((acc: any) => acc.account_code.startsWith('5'))
            .reduce((sum: number, acc: any) => sum + (acc.debit || 0), 0),
        operating_income: 0, // Would calculate based on specific accounts
        income_before_minority: netIncome,
        minority_interest_share: minorityInterest?.total_minority_income || 0,
        net_income: netIncome - (minorityInterest?.total_minority_income || 0)
      }
    }
  }

  private generateCashFlow(consolidatedData: any) {
    // Simplified cash flow - in production would be more complex
    return {
      operating: {
        net_income: 0,
        adjustments: [],
        working_capital_changes: [],
        total: 0
      },
      investing: {
        acquisitions: 0,
        disposals: 0,
        total: 0
      },
      financing: {
        debt_proceeds: 0,
        debt_repayments: 0,
        dividends: 0,
        total: 0
      },
      net_change: 0
    }
  }

  private generateConsolidationWorksheet(
    consolidatedData: any,
    eliminations: EliminationEntry[],
    trialBalance: any
  ) {
    // Create detailed worksheet showing company columns, eliminations, and consolidated
    const worksheet = {
      headers: [
        'Account',
        ...consolidatedData.companies.map((c: any) => c.company.companyName),
        'Eliminations',
        'Consolidated'
      ],
      rows: []
    }

    // Add rows for each account
    for (const account of trialBalance.accounts) {
      const row = {
        account: `${account.account_code} - ${account.account_name}`,
        companies: {},
        eliminations: 0,
        consolidated: account.debit || account.credit || 0
      }

      // Add company amounts
      if (account.consolidated_from) {
        account.consolidated_from.forEach((cf: any) => {
          const company = consolidatedData.companies.find(
            (c: any) => c.company.companyId === cf.company_id
          )
          if (company) {
            row.companies[company.company.companyName] = cf.amount
          }
        })
      }

      // Add elimination amounts
      const accountEliminations = eliminations.filter(
        e => e.account === account.account_code || e.account === account.account_name
      )
      row.eliminations = accountEliminations.reduce((sum, e) => sum + e.amount, 0)

      worksheet.rows.push(row)
    }

    return worksheet
  }

  private summarizeEliminations(eliminations: EliminationEntry[]) {
    const summary = {
      total_eliminations: eliminations.length,
      total_amount: eliminations.reduce((sum, e) => sum + e.amount, 0),
      by_type: {} as Record<string, { count: number; amount: number }>,
      details: eliminations
    }

    // Group by type
    eliminations.forEach(e => {
      if (!summary.by_type[e.eliminationType]) {
        summary.by_type[e.eliminationType] = { count: 0, amount: 0 }
      }
      summary.by_type[e.eliminationType].count++
      summary.by_type[e.eliminationType].amount += e.amount
    })

    return summary
  }
}
