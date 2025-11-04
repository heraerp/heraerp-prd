/**
 * useCashFlow Hook
 *
 * Fetches real cash flow data from GL accounts (not estimates)
 * Tracks all cash movements: inflows and outflows
 */

import { useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * Cash Account Codes
 * These are the GL accounts that represent cash/bank in the system
 */
const CASH_ACCOUNTS = {
  // POS Cash Accounts (from gl-posting-engine.ts)
  POS_CASH: '110000',           // Cash on Hand (POS)
  POS_BANK: '110100',           // Bank Account (POS)
  POS_CARD_CLEARING: '110200',  // Card Payment Clearing (POS)

  // Expense Cash Accounts (from gl-account-mapping.ts)
  EXPENSE_CASH: '1000',         // Cash on Hand (Expenses)
  EXPENSE_BANK: '1020',         // Bank Account (Expenses)
  EXPENSE_CARD: '1030',         // Card Payment Processor (Expenses)
  EXPENSE_PETTY_CASH: '1040'    // Petty Cash (Expenses)
}

const ALL_CASH_ACCOUNT_CODES = Object.values(CASH_ACCOUNTS)

export interface CashFlowSummary {
  // Opening balance
  opening_balance: number

  // Cash Inflows (money coming in - DR to cash accounts)
  total_inflows: number
  inflow_from_sales: number
  inflow_from_card: number
  inflow_from_bank: number
  inflow_from_other: number

  // Cash Outflows (money going out - CR from cash accounts)
  total_outflows: number
  outflow_for_expenses: number
  outflow_for_salaries: number
  outflow_for_tips: number
  outflow_for_other: number

  // Net cash flow
  net_cash_flow: number
  closing_balance: number

  // Transaction counts
  inflow_transaction_count: number
  outflow_transaction_count: number

  // Period info
  period_start: string
  period_end: string
}

interface UseCashFlowOptions {
  organizationId?: string
  month?: number  // 1-12
  year?: number
  openingBalance?: number  // Optional starting balance (will calculate if not provided)
}

/**
 * Hook to fetch and calculate cash flow from GL transactions
 *
 * @example
 * const { cashFlow, isLoading } = useCashFlow({
 *   organizationId: 'org-uuid',
 *   month: 1,
 *   year: 2025
 * })
 */
export function useCashFlow(options: UseCashFlowOptions) {
  const { organizationId, month, year, openingBalance } = options

  // Calculate date range
  const currentMonth = month || new Date().getMonth() + 1
  const currentYear = year || new Date().getFullYear()
  const selectedMonthDate = new Date(currentYear, currentMonth - 1, 1)

  const periodStart = startOfMonth(selectedMonthDate).toISOString()
  const periodEnd = endOfMonth(selectedMonthDate).toISOString()

  // Fetch all GL transactions for the period with line details
  const {
    transactions: glTransactions,
    isLoading
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'GL_JOURNAL',
      date_from: periodStart,
      date_to: periodEnd,
      include_lines: true,
      limit: 10000  // High limit to get all transactions
    }
  })

  // Fetch expense transactions (these also affect cash)
  const {
    transactions: expenseTransactions,
    isLoading: expensesLoading
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'EXPENSE',
      date_from: periodStart,
      date_to: periodEnd,
      include_lines: true,
      limit: 10000
    }
  })

  // Calculate cash flow from GL lines
  const cashFlow = useMemo<CashFlowSummary>(() => {
    // Initialize summary
    const summary: CashFlowSummary = {
      opening_balance: openingBalance || 0,
      total_inflows: 0,
      inflow_from_sales: 0,
      inflow_from_card: 0,
      inflow_from_bank: 0,
      inflow_from_other: 0,
      total_outflows: 0,
      outflow_for_expenses: 0,
      outflow_for_salaries: 0,
      outflow_for_tips: 0,
      outflow_for_other: 0,
      net_cash_flow: 0,
      closing_balance: 0,
      inflow_transaction_count: 0,
      outflow_transaction_count: 0,
      period_start: periodStart,
      period_end: periodEnd
    }

    // Process GL_JOURNAL transactions (POS sales)
    if (glTransactions && glTransactions.length > 0) {
      glTransactions.forEach(transaction => {
        const lines = transaction.lines || []

        lines.forEach((line: any) => {
          const lineData = line.line_data || {}
          const accountCode = lineData.gl_account_code || lineData.account_code
          const side = lineData.side
          const amount = line.line_amount || 0

          // Check if this line affects cash accounts
          if (ALL_CASH_ACCOUNT_CODES.includes(accountCode)) {
            if (side === 'DR') {
              // Money coming IN (cash increases)
              summary.total_inflows += amount
              summary.inflow_transaction_count++

              // Categorize by account type
              if (accountCode === CASH_ACCOUNTS.POS_CASH || accountCode === CASH_ACCOUNTS.EXPENSE_CASH) {
                summary.inflow_from_sales += amount
              } else if (accountCode === CASH_ACCOUNTS.POS_CARD_CLEARING || accountCode === CASH_ACCOUNTS.EXPENSE_CARD) {
                summary.inflow_from_card += amount
              } else if (accountCode === CASH_ACCOUNTS.POS_BANK || accountCode === CASH_ACCOUNTS.EXPENSE_BANK) {
                summary.inflow_from_bank += amount
              } else {
                summary.inflow_from_other += amount
              }
            } else if (side === 'CR') {
              // Money going OUT (cash decreases)
              summary.total_outflows += amount
              summary.outflow_transaction_count++

              // This is rare in POS (usually DR to cash), but track it
              summary.outflow_for_other += amount
            }
          }
        })
      })
    }

    // Process EXPENSE transactions
    if (expenseTransactions && expenseTransactions.length > 0) {
      expenseTransactions.forEach(transaction => {
        const lines = transaction.lines || []
        const metadata = transaction.metadata || {}
        const category = metadata.expense_category || 'Other'

        lines.forEach((line: any) => {
          const lineData = line.line_data || {}
          const accountCode = lineData.gl_account_code || lineData.account_code
          const side = lineData.side
          const amount = line.line_amount || 0

          // Check if this line affects cash accounts (CR side for expenses)
          if (ALL_CASH_ACCOUNT_CODES.includes(accountCode) && side === 'CR') {
            // Money going OUT (expense payment)
            summary.total_outflows += amount
            summary.outflow_transaction_count++

            // Categorize by expense type
            if (category === 'Salaries') {
              summary.outflow_for_salaries += amount
            } else {
              summary.outflow_for_expenses += amount
            }
          }
        })
      })
    }

    // Calculate net cash flow and closing balance
    summary.net_cash_flow = summary.total_inflows - summary.total_outflows
    summary.closing_balance = summary.opening_balance + summary.net_cash_flow

    return summary
  }, [glTransactions, expenseTransactions, openingBalance, periodStart, periodEnd])

  return {
    cashFlow,
    isLoading: isLoading || expensesLoading,
    refresh: () => {
      // TODO: Implement refresh logic if needed
    }
  }
}

/**
 * Helper function to format cash flow summary for display
 */
export function formatCashFlowSummary(cashFlow: CashFlowSummary) {
  return {
    opening: `AED ${cashFlow.opening_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    inflows: `AED ${cashFlow.total_inflows.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    outflows: `AED ${cashFlow.total_outflows.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    net: `AED ${cashFlow.net_cash_flow.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    closing: `AED ${cashFlow.closing_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
}

/**
 * Helper function to get previous month/year
 */
export function getPreviousPeriod(month: number, year: number): { month: number, year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

/**
 * Hook to get opening balance from previous period's closing balance
 *
 * This ensures continuity in cash flow statements:
 * - Current Month Opening = Previous Month Closing
 * - Provides accurate cash position tracking
 */
export function useOpeningBalance(options: {
  organizationId?: string
  month: number
  year: number
}) {
  const { organizationId, month, year } = options

  // Get previous period
  const { month: prevMonth, year: prevYear } = getPreviousPeriod(month, year)

  // Fetch previous period's cash flow
  const { cashFlow: prevCashFlow, isLoading } = useCashFlow({
    organizationId,
    month: prevMonth,
    year: prevYear,
    openingBalance: 0  // For first period, start with 0 (will be overridden in UI)
  })

  // Return previous period's closing balance as current opening balance
  return {
    openingBalance: prevCashFlow.closing_balance,
    isLoading
  }
}
