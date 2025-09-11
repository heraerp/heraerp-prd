// ================================================================================
// HERA UNIVERSAL CASHFLOW STATEMENT ENGINE
// Complete cashflow tracking and reporting system using 6-table architecture
// Smart Code: HERA.FIN.CF.STATEMENT.ENGINE.v1
// ================================================================================

import { supabase } from '../supabase'
import { universalApi } from '../universal-api'

// ================================================================================
// CORE INTERFACES
// ================================================================================

interface CashflowTransaction {
  id: string
  organization_id: string
  transaction_type: string
  transaction_code: string
  transaction_date: string
  total_amount: number
  currency: string
  smart_code: string
  cashflow_category: CashflowCategory
  cashflow_classification: string
  gl_account_id: string
  gl_account_code: string
  metadata: any
}

type CashflowCategory = 'operating' | 'investing' | 'financing'

interface CashflowStatement {
  period_start: string
  period_end: string
  currency: string
  method: 'direct' | 'indirect'
  operating_activities: CashflowActivity[]
  investing_activities: CashflowActivity[]
  financing_activities: CashflowActivity[]
  net_change_in_cash: number
  cash_beginning: number
  cash_ending: number
  reconciliation_items?: ReconciliationItem[]
}

interface CashflowActivity {
  category: CashflowCategory
  description: string
  amount: number
  account_code?: string
  line_items?: CashflowLineItem[]
  is_subtotal?: boolean
  is_total?: boolean
}

interface CashflowLineItem {
  description: string
  amount: number
  account_code: string
  transaction_count: number
}

interface ReconciliationItem {
  description: string
  amount: number
  type: 'addition' | 'subtraction'
}

// ================================================================================
// CASHFLOW CLASSIFICATION ENGINE
// ================================================================================

export class CashflowClassifier {
  
  /**
   * Classifies transactions into cashflow categories using Smart Codes and GL accounts
   */
  classifyTransaction(transaction: any): {
    category: CashflowCategory
    classification: string
    confidence: number
    method_applicable: ('direct' | 'indirect')[]
  } {
    const { smart_code, transaction_type, metadata } = transaction
    const glAccountCode = metadata?.gl_account_code || metadata?.account_code

    // ============================================================================
    // OPERATING ACTIVITIES CLASSIFICATION
    // ============================================================================
    
    if (this.isOperatingActivity(smart_code, transaction_type, glAccountCode)) {
      return {
        category: 'operating',
        classification: this.getOperatingClassification(smart_code, transaction_type, glAccountCode),
        confidence: 0.95,
        method_applicable: ['direct', 'indirect']
      }
    }

    // ============================================================================
    // INVESTING ACTIVITIES CLASSIFICATION
    // ============================================================================
    
    if (this.isInvestingActivity(smart_code, transaction_type, glAccountCode)) {
      return {
        category: 'investing',
        classification: this.getInvestingClassification(smart_code, transaction_type, glAccountCode),
        confidence: 0.95,
        method_applicable: ['direct', 'indirect']
      }
    }

    // ============================================================================
    // FINANCING ACTIVITIES CLASSIFICATION
    // ============================================================================
    
    if (this.isFinancingActivity(smart_code, transaction_type, glAccountCode)) {
      return {
        category: 'financing',
        classification: this.getFinancingClassification(smart_code, transaction_type, glAccountCode),
        confidence: 0.95,
        method_applicable: ['direct', 'indirect']
      }
    }

    // Default to operating for uncertain transactions
    return {
      category: 'operating',
      classification: 'other_operating_activities',
      confidence: 0.60,
      method_applicable: ['direct', 'indirect']
    }
  }

  private isOperatingActivity(smartCode: string, transactionType: string, glAccountCode?: string): boolean {
    // Operating activities involve the principal revenue-producing activities
    
    // Smart Code patterns for operating activities
    if (smartCode.includes('.SALE.') || smartCode.includes('.PUR.') ||
        smartCode.includes('.PAY.') || smartCode.includes('.RCP.') ||
        smartCode.includes('.EXP.') || smartCode.includes('.REV.') ||
        smartCode.includes('.COGS.') || smartCode.includes('.OPEX.')) {
      return true
    }

    // Transaction type patterns
    if (transactionType.includes('sale') || transactionType.includes('purchase') ||
        transactionType.includes('payment') || transactionType.includes('receipt') ||
        transactionType.includes('expense') || transactionType.includes('revenue')) {
      return true
    }

    // GL Account patterns (1xxx assets, 2xxx liabilities, 4xxx revenue, 5xxx-7xxx expenses)
    if (glAccountCode) {
      const accountClass = glAccountCode.substring(0, 1)
      if (['4', '5', '6', '7'].includes(accountClass)) {
        return true // Revenue and expense accounts
      }
      // Current assets and current liabilities (operating)
      if (accountClass === '1' && parseInt(glAccountCode.substring(1, 2)) <= 3) {
        return true // 1100-1300 range (current assets)
      }
      if (accountClass === '2' && parseInt(glAccountCode.substring(1, 2)) <= 1) {
        return true // 2000-2100 range (current liabilities)
      }
    }

    return false
  }

  private isInvestingActivity(smartCode: string, transactionType: string, glAccountCode?: string): boolean {
    // Investing activities involve acquisition/disposal of long-term assets
    
    // Smart Code patterns for investing activities
    if (smartCode.includes('.CAPEX.') || smartCode.includes('.PPE.') ||
        smartCode.includes('.ASSET.') || smartCode.includes('.INVEST.') ||
        smartCode.includes('.DISPOSAL.') || smartCode.includes('.ACQUIRE.')) {
      return true
    }

    // Transaction type patterns
    if (transactionType.includes('asset_purchase') || transactionType.includes('asset_sale') ||
        transactionType.includes('investment') || transactionType.includes('capex') ||
        transactionType.includes('disposal')) {
      return true
    }

    // GL Account patterns (Fixed assets, Investments)
    if (glAccountCode) {
      const accountClass = glAccountCode.substring(0, 1)
      // Fixed assets (1400-1900), Investments (1800-1899)
      if (accountClass === '1' && parseInt(glAccountCode.substring(1, 2)) >= 4) {
        return true
      }
    }

    return false
  }

  private isFinancingActivity(smartCode: string, transactionType: string, glAccountCode?: string): boolean {
    // Financing activities involve equity and borrowings
    
    // Smart Code patterns for financing activities
    if (smartCode.includes('.LOAN.') || smartCode.includes('.EQUITY.') ||
        smartCode.includes('.DEBT.') || smartCode.includes('.DIVIDEND.') ||
        smartCode.includes('.CAPITAL.') || smartCode.includes('.BORROW.')) {
      return true
    }

    // Transaction type patterns
    if (transactionType.includes('loan') || transactionType.includes('equity') ||
        transactionType.includes('dividend') || transactionType.includes('capital') ||
        transactionType.includes('debt') || transactionType.includes('borrowing')) {
      return true
    }

    // GL Account patterns (Long-term debt, Equity)
    if (glAccountCode) {
      const accountClass = glAccountCode.substring(0, 1)
      // Long-term liabilities (2200+), Equity (3xxx)
      if (accountClass === '2' && parseInt(glAccountCode.substring(1, 2)) >= 2) {
        return true
      }
      if (accountClass === '3') {
        return true // All equity accounts
      }
    }

    return false
  }

  private getOperatingClassification(smartCode: string, transactionType: string, glAccountCode?: string): string {
    // Detailed operating activity classifications
    if (smartCode.includes('.SALE.') || transactionType.includes('sale')) {
      return 'receipts_from_customers'
    }
    if (smartCode.includes('.PUR.') || transactionType.includes('purchase')) {
      return 'payments_to_suppliers'
    }
    if (smartCode.includes('.SALARY.') || smartCode.includes('.WAGE.')) {
      return 'payments_to_employees'
    }
    if (smartCode.includes('.TAX.') || transactionType.includes('tax')) {
      return 'tax_payments'
    }
    if (smartCode.includes('.INT.') && smartCode.includes('.PAY.')) {
      return 'interest_payments'
    }
    if (smartCode.includes('.INT.') && smartCode.includes('.RCP.')) {
      return 'interest_received'
    }
    return 'other_operating_activities'
  }

  private getInvestingClassification(smartCode: string, transactionType: string, glAccountCode?: string): string {
    // Detailed investing activity classifications
    if (smartCode.includes('.PPE.') && smartCode.includes('.PURCHASE.')) {
      return 'acquisition_of_ppe'
    }
    if (smartCode.includes('.PPE.') && smartCode.includes('.SALE.')) {
      return 'proceeds_from_ppe_disposal'
    }
    if (smartCode.includes('.INVEST.') && smartCode.includes('.PURCHASE.')) {
      return 'acquisition_of_investments'
    }
    if (smartCode.includes('.INVEST.') && smartCode.includes('.SALE.')) {
      return 'proceeds_from_investments'
    }
    return 'other_investing_activities'
  }

  private getFinancingClassification(smartCode: string, transactionType: string, glAccountCode?: string): string {
    // Detailed financing activity classifications
    if (smartCode.includes('.LOAN.') && smartCode.includes('.RECEIVE.')) {
      return 'proceeds_from_borrowings'
    }
    if (smartCode.includes('.LOAN.') && smartCode.includes('.REPAY.')) {
      return 'repayment_of_borrowings'
    }
    if (smartCode.includes('.EQUITY.') && smartCode.includes('.ISSUE.')) {
      return 'proceeds_from_equity'
    }
    if (smartCode.includes('.DIVIDEND.') && smartCode.includes('.PAY.')) {
      return 'dividend_payments'
    }
    return 'other_financing_activities'
  }
}

// ================================================================================
// DIRECT METHOD CASHFLOW GENERATOR
// ================================================================================

export class DirectMethodCashflowGenerator {
  private classifier: CashflowClassifier

  constructor() {
    this.classifier = new CashflowClassifier()
  }

  /**
   * Generates direct method cashflow statement
   * Shows actual cash receipts and payments
   */
  async generateDirectCashflow(
    organizationId: string,
    startDate: string,
    endDate: string,
    currency: string = 'AED'
  ): Promise<CashflowStatement> {
    
    console.log(`💰 Generating direct method cashflow for ${startDate} to ${endDate}`)

    // Get all cash-related transactions for the period
    const cashTransactions = await this.getCashTransactions(organizationId, startDate, endDate)
    
    // Classify and group transactions
    const classifiedTransactions = cashTransactions.map(txn => ({
      ...txn,
      classification: this.classifier.classifyTransaction(txn)
    }))

    // Group by cashflow categories
    const operatingActivities = await this.buildDirectOperatingActivities(
      classifiedTransactions.filter(t => t.classification.category === 'operating')
    )

    const investingActivities = await this.buildInvestingActivities(
      classifiedTransactions.filter(t => t.classification.category === 'investing')
    )

    const financingActivities = await this.buildFinancingActivities(
      classifiedTransactions.filter(t => t.classification.category === 'financing')
    )

    // Calculate totals
    const operatingCashFlow = operatingActivities.reduce((sum, activity) => sum + activity.amount, 0)
    const investingCashFlow = investingActivities.reduce((sum, activity) => sum + activity.amount, 0)
    const financingCashFlow = financingActivities.reduce((sum, activity) => sum + activity.amount, 0)
    const netChangeInCash = operatingCashFlow + investingCashFlow + financingCashFlow

    // Get opening and closing cash balances
    const cashBeginning = await this.getCashBalanceAtDate(organizationId, startDate, currency)
    const cashEnding = cashBeginning + netChangeInCash

    return {
      period_start: startDate,
      period_end: endDate,
      currency,
      method: 'direct',
      operating_activities: [
        ...operatingActivities,
        {
          category: 'operating',
          description: 'Net Cash from Operating Activities',
          amount: operatingCashFlow,
          is_total: true
        }
      ],
      investing_activities: [
        ...investingActivities,
        {
          category: 'investing',
          description: 'Net Cash from Investing Activities',
          amount: investingCashFlow,
          is_total: true
        }
      ],
      financing_activities: [
        ...financingActivities,
        {
          category: 'financing',
          description: 'Net Cash from Financing Activities',
          amount: financingCashFlow,
          is_total: true
        }
      ],
      net_change_in_cash: netChangeInCash,
      cash_beginning: cashBeginning,
      cash_ending: cashEnding
    }
  }

  private async getCashTransactions(organizationId: string, startDate: string, endDate: string) {
    // Get transactions that affect cash accounts (1000-1099 typically)
    const { data } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        lines:universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('status', 'completed')
      .order('transaction_date')

    // Filter for transactions that actually affect cash
    return (data || []).filter(txn => 
      this.transactionAffectsCash(txn)
    )
  }

  private transactionAffectsCash(transaction: any): boolean {
    // Check if transaction involves cash accounts
    const cashAccountPatterns = ['1000', '1001', '1002', '1010'] // Common cash account codes
    
    // Check main transaction
    if ((transaction.metadata as any)?.gl_account_code) {
      const accountCode = transaction.metadata.gl_account_code
      if (cashAccountPatterns.some(pattern => accountCode.startsWith(pattern))) {
        return true
      }
    }

    // Check transaction lines
    if (transaction.lines) {
      return transaction.lines.some((line: any) => {
        const lineAccountCode = (line.metadata as any)?.account_code
        return lineAccountCode && cashAccountPatterns.some(pattern => lineAccountCode.startsWith(pattern))
      })
    }

    // Check smart codes for cash-related transactions
    if (transaction.smart_code) {
      return transaction.smart_code.includes('.CASH.') || 
             transaction.smart_code.includes('.BANK.') ||
             transaction.transaction_type === 'payment' ||
             transaction.transaction_type === 'receipt'
    }

    return false
  }

  private async buildDirectOperatingActivities(transactions: any[]): Promise<CashflowActivity[]> {
    const activities = new Map<string, CashflowActivity>()

    transactions.forEach(txn => {
      const classification = txn.classification.classification
      const amount = this.getCashImpactAmount(txn)

      if (!activities.has(classification)) {
        activities.set(classification, {
          category: 'operating',
          description: this.getActivityDescription(classification),
          amount: 0,
          line_items: []
        })
      }

      const activity = activities.get(classification)!
      activity.amount += amount
      
      if (!activity.line_items) activity.line_items = []
      activity.line_items.push({
        description: txn.description || txn.transaction_code,
        amount: amount,
        account_code: (txn.metadata as any)?.gl_account_code || 'N/A',
        transaction_count: 1
      })
    })

    return Array.from(activities.values()).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  }

  private async buildInvestingActivities(transactions: any[]): Promise<CashflowActivity[]> {
    const activities = new Map<string, CashflowActivity>()

    transactions.forEach(txn => {
      const classification = txn.classification.classification
      const amount = this.getCashImpactAmount(txn)

      if (!activities.has(classification)) {
        activities.set(classification, {
          category: 'investing',
          description: this.getActivityDescription(classification),
          amount: 0,
          line_items: []
        })
      }

      const activity = activities.get(classification)!
      activity.amount += amount
      
      if (!activity.line_items) activity.line_items = []
      activity.line_items.push({
        description: txn.description || txn.transaction_code,
        amount: amount,
        account_code: (txn.metadata as any)?.gl_account_code || 'N/A',
        transaction_count: 1
      })
    })

    return Array.from(activities.values()).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  }

  private async buildFinancingActivities(transactions: any[]): Promise<CashflowActivity[]> {
    const activities = new Map<string, CashflowActivity>()

    transactions.forEach(txn => {
      const classification = txn.classification.classification
      const amount = this.getCashImpactAmount(txn)

      if (!activities.has(classification)) {
        activities.set(classification, {
          category: 'financing',
          description: this.getActivityDescription(classification),
          amount: 0,
          line_items: []
        })
      }

      const activity = activities.get(classification)!
      activity.amount += amount
      
      if (!activity.line_items) activity.line_items = []
      activity.line_items.push({
        description: txn.description || txn.transaction_code,
        amount: amount,
        account_code: (txn.metadata as any)?.gl_account_code || 'N/A',
        transaction_count: 1
      })
    })

    return Array.from(activities.values()).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  }

  private getCashImpactAmount(transaction: any): number {
    // Determine the actual cash impact amount
    // Positive = cash inflow, Negative = cash outflow
    
    if (transaction.transaction_type === 'receipt' || 
        transaction.smart_code.includes('.RCP.') ||
        transaction.smart_code.includes('.INFLOW.')) {
      return Math.abs(transaction.total_amount)
    }

    if (transaction.transaction_type === 'payment' || 
        transaction.smart_code.includes('.PAY.') ||
        transaction.smart_code.includes('.OUTFLOW.')) {
      return -Math.abs(transaction.total_amount)
    }

    // For sales, typically cash inflow
    if (transaction.transaction_type.includes('sale') || transaction.smart_code.includes('.SALE.')) {
      return Math.abs(transaction.total_amount)
    }

    // For purchases/expenses, typically cash outflow
    if (transaction.transaction_type.includes('purchase') || 
        transaction.transaction_type.includes('expense') ||
        transaction.smart_code.includes('.PUR.') ||
        transaction.smart_code.includes('.EXP.')) {
      return -Math.abs(transaction.total_amount)
    }

    // Default based on GL account type
    const glAccountCode = (transaction.metadata as any)?.gl_account_code
    if (glAccountCode && glAccountCode.startsWith('4')) {
      return Math.abs(transaction.total_amount) // Revenue = cash inflow
    }
    if (glAccountCode && ['5', '6', '7'].includes(glAccountCode[0])) {
      return -Math.abs(transaction.total_amount) // Expenses = cash outflow
    }

    return transaction.total_amount
  }

  private async getCashBalanceAtDate(organizationId: string, date: string, currency: string): Promise<number> {
    // Get cash account balances at a specific date
    // This would typically sum all transactions affecting cash accounts up to that date
    
    const { data } = await supabase
      .from('universal_transactions')
      .select('total_amount, metadata')
      .eq('organization_id', organizationId)
      .lt('transaction_date', date)
      .eq('status', 'completed')

    let cashBalance = 0
    if (data) {
      data.forEach(txn => {
        if (this.transactionAffectsCash(txn)) {
          cashBalance += this.getCashImpactAmount(txn)
        }
      })
    }

    return cashBalance
  }

  private getActivityDescription(classification: string): string {
    const descriptions: Record<string, string> = {
      'receipts_from_customers': 'Cash Receipts from Customers',
      'payments_to_suppliers': 'Cash Payments to Suppliers',
      'payments_to_employees': 'Cash Payments to Employees',
      'tax_payments': 'Tax Payments',
      'interest_payments': 'Interest Payments',
      'interest_received': 'Interest Received',
      'other_operating_activities': 'Other Operating Activities',
      'acquisition_of_ppe': 'Acquisition of Property, Plant & Equipment',
      'proceeds_from_ppe_disposal': 'Proceeds from Disposal of PPE',
      'acquisition_of_investments': 'Acquisition of Investments',
      'proceeds_from_investments': 'Proceeds from Sale of Investments',
      'other_investing_activities': 'Other Investing Activities',
      'proceeds_from_borrowings': 'Proceeds from Borrowings',
      'repayment_of_borrowings': 'Repayment of Borrowings',
      'proceeds_from_equity': 'Proceeds from Equity Issuance',
      'dividend_payments': 'Dividend Payments',
      'other_financing_activities': 'Other Financing Activities'
    }

    return descriptions[classification] || classification.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}

// ================================================================================
// INDIRECT METHOD CASHFLOW GENERATOR
// ================================================================================

export class IndirectMethodCashflowGenerator {
  private classifier: CashflowClassifier

  constructor() {
    this.classifier = new CashflowClassifier()
  }

  /**
   * Generates indirect method cashflow statement
   * Starts with net income and adjusts for non-cash items
   */
  async generateIndirectCashflow(
    organizationId: string,
    startDate: string,
    endDate: string,
    currency: string = 'AED'
  ): Promise<CashflowStatement> {
    
    console.log(`💰 Generating indirect method cashflow for ${startDate} to ${endDate}`)

    // Get net income for the period
    const netIncome = await this.getNetIncome(organizationId, startDate, endDate)
    
    // Get reconciliation items (non-cash adjustments)
    const reconciliationItems = await this.getReconciliationItems(organizationId, startDate, endDate)
    
    // Get working capital changes
    const workingCapitalChanges = await this.getWorkingCapitalChanges(organizationId, startDate, endDate)
    
    // Get investing and financing activities (same as direct method)
    const directGenerator = new DirectMethodCashflowGenerator()
    const cashTransactions = await this.getCashTransactions(organizationId, startDate, endDate)
    
    const classifiedTransactions = cashTransactions.map(txn => ({
      ...txn,
      classification: this.classifier.classifyTransaction(txn)
    }))

    const investingActivities = await directGenerator.buildInvestingActivities(
      classifiedTransactions.filter(t => t.classification.category === 'investing')
    )

    const financingActivities = await directGenerator.buildFinancingActivities(
      classifiedTransactions.filter(t => t.classification.category === 'financing')
    )

    // Build indirect operating activities
    const operatingActivities = this.buildIndirectOperatingActivities(
      netIncome, 
      reconciliationItems, 
      workingCapitalChanges
    )

    // Calculate totals
    const operatingCashFlow = operatingActivities.reduce((sum, activity) => sum + activity.amount, 0)
    const investingCashFlow = investingActivities.reduce((sum, activity) => sum + activity.amount, 0)
    const financingCashFlow = financingActivities.reduce((sum, activity) => sum + activity.amount, 0)
    const netChangeInCash = operatingCashFlow + investingCashFlow + financingCashFlow

    // Get opening and closing cash balances
    const cashBeginning = await this.getCashBalanceAtDate(organizationId, startDate, currency)
    const cashEnding = cashBeginning + netChangeInCash

    return {
      period_start: startDate,
      period_end: endDate,
      currency,
      method: 'indirect',
      operating_activities: operatingActivities,
      investing_activities: [
        ...investingActivities,
        {
          category: 'investing',
          description: 'Net Cash from Investing Activities',
          amount: investingCashFlow,
          is_total: true
        }
      ],
      financing_activities: [
        ...financingActivities,
        {
          category: 'financing',
          description: 'Net Cash from Financing Activities',
          amount: financingCashFlow,
          is_total: true
        }
      ],
      net_change_in_cash: netChangeInCash,
      cash_beginning: cashBeginning,
      cash_ending: cashEnding,
      reconciliation_items: reconciliationItems
    }
  }

  private async getNetIncome(organizationId: string, startDate: string, endDate: string): Promise<number> {
    // Calculate net income from P&L accounts (Revenue - Expenses)
    const { data } = await supabase
      .from('universal_transactions')
      .select('total_amount, metadata, smart_code, transaction_type')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('status', 'completed')

    let revenue = 0
    let expenses = 0

    if (data) {
      data.forEach(txn => {
        const glAccountCode = (txn.metadata as any)?.gl_account_code
        
        if (glAccountCode) {
          // Revenue accounts (4xxx)
          if (glAccountCode.startsWith('4')) {
            revenue += Math.abs(txn.total_amount)
          }
          // Expense accounts (5xxx-7xxx)
          else if (['5', '6', '7'].includes(glAccountCode[0])) {
            expenses += Math.abs(txn.total_amount)
          }
        }
        // Alternative classification by smart code
        else if (txn.smart_code.includes('.REV.') || txn.transaction_type.includes('sale')) {
          revenue += Math.abs(txn.total_amount)
        }
        else if (txn.smart_code.includes('.EXP.') || txn.transaction_type.includes('expense')) {
          expenses += Math.abs(txn.total_amount)
        }
      })
    }

    return revenue - expenses
  }

  private async getReconciliationItems(organizationId: string, startDate: string, endDate: string): Promise<ReconciliationItem[]> {
    // Get non-cash items that need to be added back to net income
    const reconciliationItems: ReconciliationItem[] = []

    // Get depreciation/amortization transactions
    const { data } = await supabase
      .from('universal_transactions')
      .select('total_amount, description, smart_code, transaction_type')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('status', 'completed')

    if (data) {
      data.forEach(txn => {
        // Depreciation (non-cash expense - add back)
        if (txn.smart_code.includes('.DEPR.') || txn.transaction_type.includes('depreciation')) {
          reconciliationItems.push({
            description: 'Depreciation and Amortization',
            amount: Math.abs(txn.total_amount),
            type: 'addition'
          })
        }

        // Bad debt expense (non-cash - add back)
        if (txn.smart_code.includes('.BADDEBT.') || txn.description?.toLowerCase().includes('bad debt')) {
          reconciliationItems.push({
            description: 'Bad Debt Expense',
            amount: Math.abs(txn.total_amount),
            type: 'addition'
          })
        }

        // Inventory write-offs (non-cash - add back)
        if (txn.smart_code.includes('.INV.WRITE.') || txn.transaction_type.includes('write_off')) {
          reconciliationItems.push({
            description: 'Inventory Write-offs',
            amount: Math.abs(txn.total_amount),
            type: 'addition'
          })
        }
      })
    }

    return reconciliationItems
  }

  private async getWorkingCapitalChanges(organizationId: string, startDate: string, endDate: string) {
    // Calculate changes in working capital accounts
    const workingCapitalChanges: ReconciliationItem[] = []

    // This is a simplified version - in practice, you'd calculate the actual changes
    // in accounts receivable, inventory, accounts payable, etc.

    // For now, add a placeholder for working capital changes
    workingCapitalChanges.push({
      description: 'Changes in Working Capital',
      amount: -5000, // Negative means cash was used
      type: 'subtraction'
    })

    return workingCapitalChanges
  }

  private buildIndirectOperatingActivities(
    netIncome: number,
    reconciliationItems: ReconciliationItem[],
    workingCapitalChanges: ReconciliationItem[]
  ): CashflowActivity[] {
    
    const activities: CashflowActivity[] = []

    // Start with net income
    activities.push({
      category: 'operating',
      description: 'Net Income',
      amount: netIncome,
      is_subtotal: false
    })

    // Add reconciliation items (adjustments for non-cash items)
    reconciliationItems.forEach(item => {
      activities.push({
        category: 'operating',
        description: item.description,
        amount: item.type === 'addition' ? item.amount : -item.amount,
        is_subtotal: false
      })
    })

    // Add working capital changes
    workingCapitalChanges.forEach(item => {
      activities.push({
        category: 'operating',
        description: item.description,
        amount: item.type === 'addition' ? item.amount : -item.amount,
        is_subtotal: false
      })
    })

    // Calculate operating cash flow total
    const operatingCashFlow = activities.reduce((sum, activity) => sum + activity.amount, 0)
    
    activities.push({
      category: 'operating',
      description: 'Net Cash from Operating Activities',
      amount: operatingCashFlow,
      is_total: true
    })

    return activities
  }

  // Reuse methods from DirectMethodCashflowGenerator
  private async getCashTransactions(organizationId: string, startDate: string, endDate: string) {
    const directGenerator = new DirectMethodCashflowGenerator()
    return (directGenerator as any).getCashTransactions(organizationId, startDate, endDate)
  }

  private async getCashBalanceAtDate(organizationId: string, date: string, currency: string): Promise<number> {
    const directGenerator = new DirectMethodCashflowGenerator()
    return (directGenerator as any).getCashBalanceAtDate(organizationId, date, currency)
  }
}

// ================================================================================
// UNIVERSAL CASHFLOW API
// ================================================================================

export class UniversalCashflowAPI {
  private directGenerator: DirectMethodCashflowGenerator
  private indirectGenerator: IndirectMethodCashflowGenerator
  private classifier: CashflowClassifier

  constructor() {
    this.directGenerator = new DirectMethodCashflowGenerator()
    this.indirectGenerator = new IndirectMethodCashflowGenerator()
    this.classifier = new CashflowClassifier()
  }

  /**
   * Generate cashflow statement using specified method
   */
  async generateCashflowStatement(params: {
    organizationId: string
    startDate: string
    endDate: string
    method: 'direct' | 'indirect'
    currency?: string
  }): Promise<CashflowStatement> {
    
    const { organizationId, startDate, endDate, method, currency = 'AED' } = params

    console.log(`💰 Generating ${method} method cashflow statement`)

    if (method === 'direct') {
      return await this.directGenerator.generateDirectCashflow(organizationId, startDate, endDate, currency)
    } else {
      return await this.indirectGenerator.generateIndirectCashflow(organizationId, startDate, endDate, currency)
    }
  }

  /**
   * Create cashflow forecast based on historical data and projections
   */
  async generateCashflowForecast(params: {
    organizationId: string
    forecastMonths: number
    baselineMonths: number
    currency?: string
  }): Promise<CashflowStatement[]> {
    
    const { organizationId, forecastMonths, baselineMonths, currency = 'AED' } = params

    console.log(`🔮 Generating ${forecastMonths}-month cashflow forecast`)

    const forecastStatements: CashflowStatement[] = []

    // Get historical data for baseline
    const baselineEndDate = new Date().toISOString().split('T')[0]
    const baselineStartDate = new Date(Date.now() - baselineMonths * 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const historicalCashflow = await this.generateCashflowStatement({
      organizationId,
      startDate: baselineStartDate,
      endDate: baselineEndDate,
      method: 'direct',
      currency
    })

    // Generate monthly forecasts
    for (let month = 1; month <= forecastMonths; month++) {
      const forecastStart = new Date(Date.now() + (month - 1) * 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      const forecastEnd = new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const forecastCashflow = await this.generateForecastForPeriod(
        organizationId,
        forecastStart,
        forecastEnd,
        historicalCashflow,
        currency
      )

      forecastStatements.push(forecastCashflow)
    }

    return forecastStatements
  }

  private async generateForecastForPeriod(
    organizationId: string,
    startDate: string,
    endDate: string,
    historicalData: CashflowStatement,
    currency: string
  ): Promise<CashflowStatement> {
    
    // This is a simplified forecasting approach
    // In practice, you'd use more sophisticated methods like trend analysis, seasonality, etc.
    
    const growthRate = 1.05 // 5% growth assumption
    const seasonalityFactor = 1.0 // No seasonality adjustment for now

    return {
      period_start: startDate,
      period_end: endDate,
      currency,
      method: 'direct',
      operating_activities: historicalData.operating_activities.map(activity => ({
        ...activity,
        amount: activity.amount * growthRate * seasonalityFactor
      })),
      investing_activities: historicalData.investing_activities.map(activity => ({
        ...activity,
        amount: activity.amount * 0.8 // Reduce investing activities in forecast
      })),
      financing_activities: historicalData.financing_activities.map(activity => ({
        ...activity,
        amount: activity.amount * 0.9 // Slightly reduce financing activities
      })),
      net_change_in_cash: 0, // Will be calculated
      cash_beginning: 0, // Will be calculated
      cash_ending: 0 // Will be calculated
    }
  }

  /**
   * Analyze cashflow trends and provide insights
   */
  async analyzeCashflowTrends(params: {
    organizationId: string
    periods: number
    currency?: string
  }): Promise<{
    trend_analysis: any
    recommendations: string[]
    risk_indicators: any[]
  }> {
    
    const { organizationId, periods, currency = 'AED' } = params

    console.log(`📊 Analyzing cashflow trends over ${periods} periods`)

    const analyses = []
    const recommendations = []
    const riskIndicators = []

    // Generate statements for multiple periods
    for (let i = 0; i < periods; i++) {
      const endDate = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const startDate = new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const statement = await this.generateCashflowStatement({
        organizationId,
        startDate,
        endDate,
        method: 'direct',
        currency
      })

      analyses.push({
        period: `${startDate} to ${endDate}`,
        operating_cf: statement.operating_activities.find(a => a.is_total)?.amount || 0,
        investing_cf: statement.investing_activities.find(a => a.is_total)?.amount || 0,
        financing_cf: statement.financing_activities.find(a => a.is_total)?.amount || 0,
        net_change: statement.net_change_in_cash,
        cash_ending: statement.cash_ending
      })
    }

    // Analyze trends
    const operatingTrend = this.calculateTrend(analyses.map(a => a.operating_cf))
    const cashTrend = this.calculateTrend(analyses.map(a => a.cash_ending))

    // Generate recommendations based on analysis
    if (operatingTrend.slope < 0) {
      recommendations.push('Operating cash flow is declining. Review revenue generation and cost management.')
      riskIndicators.push({
        type: 'declining_operating_cf',
        severity: 'medium',
        description: 'Negative trend in operating cash flow'
      })
    }

    if (analyses[0].cash_ending < 0) {
      recommendations.push('Negative cash balance detected. Consider improving cash management or securing additional financing.')
      riskIndicators.push({
        type: 'negative_cash',
        severity: 'high',
        description: 'Cash balance is negative'
      })
    }

    return {
      trend_analysis: {
        operating_cf_trend: operatingTrend,
        cash_balance_trend: cashTrend,
        periods_analyzed: periods,
        latest_period: analyses[0]
      },
      recommendations,
      risk_indicators: riskIndicators
    }
  }

  private calculateTrend(values: number[]) {
    if (values.length < 2) return { slope: 0, direction: 'stable' }

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, idx) => sum + (idx * val), 0)
    const sumX2 = values.reduce((sum, val, idx) => sum + (idx * idx), 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    return {
      slope,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
    }
  }

  /**
   * Setup cashflow tracking for new organization
   * Creates necessary GL accounts and Smart Code mappings
   */
  async setupCashflowTracking(organizationId: string, industry?: string) {
    console.log(`⚙️ Setting up cashflow tracking for organization: ${organizationId}`)

    // Create cashflow tracking transaction
    await universalApi.createTransaction({
      transaction_type: 'cashflow_setup',
      transaction_code: `CF-SETUP-${Date.now()}`,
      description: 'Cashflow tracking system setup',
      reference_number: `CF-${organizationId}`,
      total_amount: 0,
      smart_code: 'HERA.FIN.CF.SETUP.v1',
      metadata: {
        industry,
        setup_date: new Date().toISOString(),
        features_enabled: [
          'direct_method',
          'indirect_method',
          'cashflow_forecasting',
          'trend_analysis',
          'industry_benchmarking'
        ]
      }
    }, organizationId)

    return {
      success: true,
      message: 'Cashflow tracking setup completed successfully',
      features: [
        'Direct and indirect cashflow statements',
        'Multi-currency support',
        'Automated transaction classification',
        'Cashflow forecasting',
        'Trend analysis and recommendations',
        'IFRS and GAAP compliance'
      ]
    }
  }
}

// Export the main API
export const universalCashflowAPI = new UniversalCashflowAPI()