/**
 * GL Account Mapping Configuration
 * Maps expense categories to Chart of Accounts GL codes
 *
 * HERA Standard GL Account Ranges:
 * 1000-1999: Assets (Cash, Bank, Receivables)
 * 2000-2999: Liabilities (Payables, Accruals)
 * 3000-3999: Equity
 * 4000-4999: Revenue
 * 5000-5999: Cost of Sales
 * 6000-6999: Operating Expenses
 * 7000-7999: Other Income/Expense
 */

export interface GLAccount {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  smart_code: string
}

/**
 * Standard GL Accounts for Salon Operations
 */
export const GL_ACCOUNTS: Record<string, GLAccount> = {
  // ============================================================================
  // ASSET ACCOUNTS (1000-1999)
  // ============================================================================
  '1000': {
    code: '1000',
    name: 'Cash on Hand',
    type: 'asset',
    category: 'Current Assets',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.ASSET.CASH.v1'
  },
  '1020': {
    code: '1020',
    name: 'Bank Account',
    type: 'asset',
    category: 'Current Assets',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.ASSET.BANK.v1'
  },
  '1030': {
    code: '1030',
    name: 'Card Payment Processor',
    type: 'asset',
    category: 'Current Assets',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.ASSET.CARD.v1'
  },
  '1040': {
    code: '1040',
    name: 'Petty Cash',
    type: 'asset',
    category: 'Current Assets',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.ASSET.PETTY_CASH.v1'
  },

  // ============================================================================
  // LIABILITY ACCOUNTS (2000-2999)
  // ============================================================================
  '2100': {
    code: '2100',
    name: 'Accounts Payable',
    type: 'liability',
    category: 'Current Liabilities',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.LIABILITY.AP.v1'
  },

  // ============================================================================
  // EXPENSE ACCOUNTS (6000-6999)
  // ============================================================================
  '6100': {
    code: '6100',
    name: 'Rent Expense',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.RENT.v1'
  },
  '6200': {
    code: '6200',
    name: 'Utilities Expense',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.UTILITIES.v1'
  },
  '6300': {
    code: '6300',
    name: 'Salaries and Wages',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.SALARIES.v1'
  },
  '6400': {
    code: '6400',
    name: 'Marketing and Advertising',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.MARKETING.v1'
  },
  '6500': {
    code: '6500',
    name: 'Inventory Purchases',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.INVENTORY.v1'
  },
  '6600': {
    code: '6600',
    name: 'Maintenance and Repairs',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.MAINTENANCE.v1'
  },
  '6900': {
    code: '6900',
    name: 'Other Operating Expenses',
    type: 'expense',
    category: 'Operating Expenses',
    smart_code: 'HERA.FINANCE.GL.ACCOUNT.EXPENSE.OTHER.v1'
  }
}

/**
 * Expense Category to GL Account Mapping
 */
export const EXPENSE_CATEGORY_TO_GL: Record<string, string> = {
  'Rent': '6100',
  'Utilities': '6200',
  'Salaries': '6300',
  'Marketing': '6400',
  'Inventory': '6500',
  'Maintenance': '6600',
  'Other': '6900'
}

/**
 * Payment Method to GL Account Mapping
 */
export const PAYMENT_METHOD_TO_GL: Record<string, string> = {
  'Cash': '1000',
  'Bank Transfer': '1020',
  'Card': '1030',
  'Other': '1040'
}

/**
 * Get GL account for expense category
 */
export function getExpenseGLAccount(category: string): GLAccount | null {
  const code = EXPENSE_CATEGORY_TO_GL[category]
  return code ? GL_ACCOUNTS[code] : null
}

/**
 * Get GL account for payment method
 */
export function getPaymentGLAccount(paymentMethod: string): GLAccount | null {
  const code = PAYMENT_METHOD_TO_GL[paymentMethod]
  return code ? GL_ACCOUNTS[code] : null
}

/**
 * Get all expense GL accounts
 */
export function getExpenseGLAccounts(): GLAccount[] {
  return Object.values(GL_ACCOUNTS).filter(acc => acc.type === 'expense')
}

/**
 * Get all asset GL accounts (for payment methods)
 */
export function getAssetGLAccounts(): GLAccount[] {
  return Object.values(GL_ACCOUNTS).filter(acc => acc.type === 'asset')
}

/**
 * Get Accounts Payable GL account
 */
export function getAccountsPayableGLAccount(): GLAccount {
  return GL_ACCOUNTS['2100']
}

/**
 * Get all liability GL accounts
 */
export function getLiabilityGLAccounts(): GLAccount[] {
  return Object.values(GL_ACCOUNTS).filter(acc => acc.type === 'liability')
}

/**
 * Generate GL transaction lines for a PENDING expense (DR Expense, CR Accounts Payable)
 * Used when expense is created but payment has not been made yet
 */
export function generatePendingExpenseGLLines(
  category: string,
  amount: number,
  costCenter?: string
): Array<{
  line_number: number
  line_type: 'GL'
  line_amount: number
  line_data: {
    account_code: string
    account_name: string
    side: 'DR' | 'CR'
    amount: number
    cost_center?: string
  }
}> {
  const expenseAccount = getExpenseGLAccount(category)
  const apAccount = getAccountsPayableGLAccount()

  if (!expenseAccount) {
    throw new Error(`Invalid expense category "${category}"`)
  }

  return [
    // DR: Expense Account (increases expense)
    {
      line_number: 1,
      line_type: 'GL' as const,
      line_amount: amount,
      line_data: {
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        side: 'DR' as const,
        amount: amount,
        ...(costCenter ? { cost_center: costCenter } : {})
      }
    },
    // CR: Accounts Payable (increases liability - unpaid expense)
    {
      line_number: 2,
      line_type: 'GL' as const,
      line_amount: amount,
      line_data: {
        account_code: apAccount.code,
        account_name: apAccount.name,
        side: 'CR' as const,
        amount: amount
      }
    }
  ]
}

/**
 * Generate GL transaction lines for PAYMENT of an expense (DR AP, CR Cash/Bank)
 * Used when paying a previously pending expense
 */
export function generateExpensePaymentGLLines(
  paymentMethod: string,
  amount: number
): Array<{
  line_number: number
  line_type: 'GL'
  line_amount: number
  line_data: {
    account_code: string
    account_name: string
    side: 'DR' | 'CR'
    amount: number
  }
}> {
  const paymentAccount = getPaymentGLAccount(paymentMethod)
  const apAccount = getAccountsPayableGLAccount()

  if (!paymentAccount) {
    throw new Error(`Invalid payment method "${paymentMethod}"`)
  }

  return [
    // DR: Accounts Payable (decreases liability - clearing the debt)
    {
      line_number: 1,
      line_type: 'GL' as const,
      line_amount: amount,
      line_data: {
        account_code: apAccount.code,
        account_name: apAccount.name,
        side: 'DR' as const,
        amount: amount
      }
    },
    // CR: Payment Account (decreases asset - cash/bank going out)
    {
      line_number: 2,
      line_type: 'GL' as const,
      line_amount: amount,
      line_data: {
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        side: 'CR' as const,
        amount: amount
      }
    }
  ]
}

/**
 * Generate GL transaction lines for an expense (LEGACY - direct payment)
 * Used when expense is created AND paid immediately (DR Expense, CR Cash/Bank)
 * @deprecated Use generatePendingExpenseGLLines + generateExpensePaymentGLLines for proper accrual accounting
 */
export function generateExpenseGLLines(
  category: string,
  paymentMethod: string,
  amount: number,
  costCenter?: string
): Array<{
  line_number: number
  line_type: 'GL'
  line_amount: number
  line_data: {
    account_code: string
    account_name: string
    side: 'DR' | 'CR'
    amount: number
    cost_center?: string
  }
}> {
  const expenseAccount = getExpenseGLAccount(category)
  const paymentAccount = getPaymentGLAccount(paymentMethod)

  if (!expenseAccount || !paymentAccount) {
    throw new Error(`Invalid category "${category}" or payment method "${paymentMethod}"`)
  }

  return [
    // DR: Expense Account (increases expense)
    {
      line_number: 1,
      line_type: 'GL' as const,
      line_amount: amount,
      line_data: {
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        side: 'DR' as const,
        amount: amount,
        ...(costCenter ? { cost_center: costCenter } : {})
      }
    },
    // CR: Payment Account (decreases asset)
    {
      line_number: 2,
      line_type: 'GL' as const,
      line_amount: amount,
      line_data: {
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        side: 'CR' as const,
        amount: amount
      }
    }
  ]
}
