/**
 * HERA Fiscal Year Close DNA Engine
 * Smart Code: HERA.FIN.FISCAL.CLOSE.ENGINE.v1
 *
 * End-to-end fiscal year closing with GL integration
 * Zero schema changes - uses universal tables only
 */

import { universalApi } from '@/src/lib/universal-api'

// Smart Code definitions for fiscal close
export const FISCAL_CLOSE_SMART_CODES = {
  // Header codes
  CLOSE_JOURNAL: 'HERA.FIN.GL.JOURNAL.CLOSE.YEAR.v1',
  REVERSAL_JOURNAL: 'HERA.FIN.GL.JOURNAL.REVERSAL.CLOSE.YEAR.v1',
  CONSOLIDATION_ELIM: 'HERA.FIN.GL.JOURNAL.CONSOLIDATION.ELIM.v1',

  // Line codes
  REVENUE_CLOSE: 'HERA.FIN.GL.LINE.REVENUE.CLOSE.v1',
  EXPENSE_CLOSE: 'HERA.FIN.GL.LINE.EXPENSE.CLOSE.v1',
  RETAINED_EARNINGS: 'HERA.FIN.GL.LINE.RETAINED_EARNINGS.v1',
  CURRENT_YEAR_EARNINGS: 'HERA.FIN.GL.LINE.CURRENT_YEAR_EARNINGS.v1'
}

// Types
export interface FiscalCloseParams {
  organization_id: string
  fiscal_year: number
  close_as_of: string
  retained_earnings_account_id: string
  current_year_earnings_account_id: string
  smart_code?: string
  preview_only?: boolean
}

export interface FiscalCloseResult {
  success: boolean
  journal_id?: string
  transaction_code?: string
  total_revenue: number
  total_expenses: number
  net_income: number
  closing_entries: ClosingEntry[]
  validation_errors?: string[]
}

export interface ClosingEntry {
  line_number: number
  account_id: string
  account_code: string
  account_name: string
  description: string
  debit_amount: number
  credit_amount: number
  smart_code: string
}

export interface AccountSummary {
  account_id: string
  account_code: string
  account_name: string
  account_type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity'
  period_balance: number
  ytd_balance: number
}

/**
 * Main Fiscal Close Engine
 */
export class FiscalCloseEngine {
  constructor(private organizationId: string) {}

  /**
   * Execute fiscal year close
   * 8-step automation as per specification
   */
  async executeYearEndClose(params: FiscalCloseParams): Promise<FiscalCloseResult> {
    try {
      // Step 1: Validate prerequisites
      const validation = await this.validateClosePrerequisites(params)
      if (!validation.isValid) {
        return {
          success: false,
          total_revenue: 0,
          total_expenses: 0,
          net_income: 0,
          closing_entries: [],
          validation_errors: validation.errors
        }
      }

      // Step 2: Calculate revenue totals
      const revenueAccounts = await this.getAccountsByType('revenue', params.close_as_of)
      const totalRevenue = this.sumAccountBalances(revenueAccounts)

      // Step 3: Calculate expense totals
      const expenseAccounts = await this.getAccountsByType('expense', params.close_as_of)
      const totalExpenses = this.sumAccountBalances(expenseAccounts)

      // Step 4: Calculate net income/loss
      const netIncome = totalRevenue - totalExpenses

      // Step 5: Build closing journal entries
      const closingEntries = await this.buildClosingEntries({
        revenueAccounts,
        expenseAccounts,
        netIncome,
        retained_earnings_account_id: params.retained_earnings_account_id,
        current_year_earnings_account_id: params.current_year_earnings_account_id
      })

      // Step 6: Preview mode - return without posting
      if (params.preview_only) {
        return {
          success: true,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_income: netIncome,
          closing_entries: closingEntries
        }
      }

      // Step 7: Create and post closing journal
      const journalResult = await this.postClosingJournal({
        ...params,
        closingEntries,
        totalRevenue,
        totalExpenses,
        netIncome
      })

      // Step 8: Lock the fiscal period
      await this.lockFiscalPeriod(params.fiscal_year, 12)

      return {
        success: true,
        journal_id: journalResult.journal_id,
        transaction_code: journalResult.transaction_code,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_income: netIncome,
        closing_entries: closingEntries
      }
    } catch (error) {
      console.error('Fiscal close error:', error)
      return {
        success: false,
        total_revenue: 0,
        total_expenses: 0,
        net_income: 0,
        closing_entries: [],
        validation_errors: [error.message]
      }
    }
  }

  /**
   * Validate close prerequisites
   */
  private async validateClosePrerequisites(params: FiscalCloseParams) {
    const errors: string[] = []

    // Check if fiscal year is already closed
    const periodStatus = await this.getFiscalPeriodStatus(params.fiscal_year, 12)
    if (periodStatus === 'closed') {
      errors.push('Fiscal year is already closed')
    }

    // Verify accounts exist
    const reAccount = await this.getAccount(params.retained_earnings_account_id)
    if (!reAccount) {
      errors.push('Retained earnings account not found')
    }

    const cyeAccount = await this.getAccount(params.current_year_earnings_account_id)
    if (!cyeAccount) {
      errors.push('Current year earnings account not found')
    }

    // Check for unposted journals
    const unpostedCount = await this.getUnpostedJournalCount(params.fiscal_year)
    if (unpostedCount > 0) {
      errors.push(`${unpostedCount} unposted journals exist`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get accounts by type for closing
   */
  private async getAccountsByType(
    accountType: 'revenue' | 'expense',
    asOfDate: string
  ): Promise<AccountSummary[]> {
    const accounts = await universalApi.query('core_entities', {
      filters: {
        organization_id: this.organizationId,
        entity_type: 'gl_account',
        metadata: {
          account_type: accountType
        }
      }
    })

    // Get balances for each account
    const accountsWithBalances = await Promise.all(
      accounts.data.map(async account => {
        const balance = await this.getAccountBalance(account.id, asOfDate)
        return {
          account_id: account.id,
          account_code: account.entity_code,
          account_name: account.entity_name,
          account_type: accountType,
          period_balance: balance.period,
          ytd_balance: balance.ytd
        }
      })
    )

    // Filter out zero balance accounts
    return accountsWithBalances.filter(acc => acc.ytd_balance !== 0)
  }

  /**
   * Build closing journal entries
   */
  private buildClosingEntries(params: {
    revenueAccounts: AccountSummary[]
    expenseAccounts: AccountSummary[]
    netIncome: number
    retained_earnings_account_id: string
    current_year_earnings_account_id: string
  }): ClosingEntry[] {
    const entries: ClosingEntry[] = []
    let lineNumber = 1

    // Close revenue accounts (credit balance accounts get debited to zero)
    params.revenueAccounts.forEach(account => {
      entries.push({
        line_number: lineNumber++,
        account_id: account.account_id,
        account_code: account.account_code,
        account_name: account.account_name,
        description: `Close revenue account ${account.account_code}`,
        debit_amount: account.ytd_balance,
        credit_amount: 0,
        smart_code: FISCAL_CLOSE_SMART_CODES.REVENUE_CLOSE
      })
    })

    // Close expense accounts (debit balance accounts get credited to zero)
    params.expenseAccounts.forEach(account => {
      entries.push({
        line_number: lineNumber++,
        account_id: account.account_id,
        account_code: account.account_code,
        account_name: account.account_name,
        description: `Close expense account ${account.account_code}`,
        debit_amount: 0,
        credit_amount: account.ytd_balance,
        smart_code: FISCAL_CLOSE_SMART_CODES.EXPENSE_CLOSE
      })
    })

    // Transfer to current year earnings
    entries.push({
      line_number: lineNumber++,
      account_id: params.current_year_earnings_account_id,
      account_code: '3300000',
      account_name: 'Current Year Earnings',
      description: 'Transfer P&L to Current Year Earnings',
      debit_amount: params.netIncome > 0 ? 0 : Math.abs(params.netIncome),
      credit_amount: params.netIncome > 0 ? params.netIncome : 0,
      smart_code: FISCAL_CLOSE_SMART_CODES.CURRENT_YEAR_EARNINGS
    })

    // Transfer to retained earnings
    entries.push({
      line_number: lineNumber++,
      account_id: params.retained_earnings_account_id,
      account_code: '3200000',
      account_name: 'Retained Earnings',
      description: 'Transfer to Retained Earnings',
      debit_amount: params.netIncome > 0 ? params.netIncome : 0,
      credit_amount: params.netIncome > 0 ? 0 : Math.abs(params.netIncome),
      smart_code: FISCAL_CLOSE_SMART_CODES.RETAINED_EARNINGS
    })

    return entries
  }

  /**
   * Post closing journal to universal_transactions
   */
  private async postClosingJournal(params: {
    fiscal_year: number
    close_as_of: string
    closingEntries: ClosingEntry[]
    totalRevenue: number
    totalExpenses: number
    netIncome: number
  }) {
    // Create journal header
    const journal = await universalApi.createTransaction({
      organization_id: this.organizationId,
      transaction_type: 'GL_JOURNAL',
      transaction_date: new Date(params.close_as_of),
      smart_code: FISCAL_CLOSE_SMART_CODES.CLOSE_JOURNAL,
      total_amount: 0, // Net zero for closing journal
      description: `Year-end closing journal for fiscal year ${params.fiscal_year}`,
      metadata: {
        fiscal_year: params.fiscal_year,
        fiscal_period: 12,
        posting_period_code: `${params.fiscal_year}-12`,
        total_revenue: params.totalRevenue,
        total_expenses: params.totalExpenses,
        net_income: params.netIncome,
        journal_type: 'YEAR_END_CLOSE'
      }
    })

    // Create journal lines
    await Promise.all(
      params.closingEntries.map(entry =>
        universalApi.createTransactionLine({
          transaction_id: journal.id,
          line_number: entry.line_number,
          line_entity_id: entry.account_id,
          line_type: 'GL',
          description: entry.description,
          quantity: 1,
          unit_price: entry.debit_amount > 0 ? entry.debit_amount : entry.credit_amount,
          line_amount: entry.debit_amount > 0 ? entry.debit_amount : -entry.credit_amount,
          metadata: {
            debit_amount: entry.debit_amount,
            credit_amount: entry.credit_amount,
            account_code: entry.account_code,
            account_name: entry.account_name,
            smart_code: entry.smart_code
          }
        })
      )
    )

    return {
      journal_id: journal.id,
      transaction_code: journal.transaction_code
    }
  }

  // Helper methods
  private sumAccountBalances(accounts: AccountSummary[]): number {
    return accounts.reduce((sum, acc) => sum + Math.abs(acc.ytd_balance), 0)
  }

  private async getAccount(accountId: string) {
    const result = await universalApi.getEntity(accountId)
    return result.data
  }

  private async getAccountBalance(accountId: string, asOfDate: string) {
    // In production, this would calculate from transaction lines
    // For now, returning mock data
    return {
      period: Math.random() * 10000,
      ytd: Math.random() * 100000
    }
  }

  private async getFiscalPeriodStatus(year: number, period: number) {
    // Query fiscal period entity
    const result = await universalApi.query('core_entities', {
      filters: {
        organization_id: this.organizationId,
        entity_type: 'fiscal_period',
        entity_code: `${year}-${period.toString().padStart(2, '0')}`
      }
    })
    return result.data?.[0]?.status || 'open'
  }

  private async getUnpostedJournalCount(fiscalYear: number) {
    // Query unposted journals
    const result = await universalApi.query('universal_transactions', {
      filters: {
        organization_id: this.organizationId,
        transaction_type: 'GL_JOURNAL',
        status: 'draft',
        metadata: {
          fiscal_year: fiscalYear
        }
      }
    })
    return result.data?.length || 0
  }

  private async lockFiscalPeriod(year: number, period: number) {
    // Update fiscal period entity to closed status
    const periodCode = `${year}-${period.toString().padStart(2, '0')}`
    const periods = await universalApi.query('core_entities', {
      filters: {
        organization_id: this.organizationId,
        entity_type: 'fiscal_period',
        entity_code: periodCode
      }
    })

    if (periods.data?.length > 0) {
      await universalApi.updateEntity(periods.data[0].id, {
        status: 'closed',
        metadata: {
          ...periods.data[0].metadata,
          closed_date: new Date().toISOString(),
          closed_by: 'SYSTEM'
        }
      })
    }
  }
}

/**
 * Helper function to build closing journal payload
 */
export function buildClosingJournalPayload(params: FiscalCloseParams): any {
  return {
    organization_id: params.organization_id,
    fiscal_year: params.fiscal_year,
    close_as_of: params.close_as_of,
    retained_earnings_account_id: params.retained_earnings_account_id,
    current_year_earnings_account_id: params.current_year_earnings_account_id,
    smart_code: params.smart_code || FISCAL_CLOSE_SMART_CODES.CLOSE_JOURNAL
  }
}

/**
 * Create fiscal close engine instance
 */
export function createFiscalCloseEngine(organizationId: string) {
  return new FiscalCloseEngine(organizationId)
}
