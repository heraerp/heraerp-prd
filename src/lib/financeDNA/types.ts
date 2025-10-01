/**
 * HERA Finance DNA - Type Definitions
 * Common types for Finance DNA integration
 */

/**
 * General Ledger Entry
 */
export interface GLEntry {
  account_code: string
  account_name: string
  debit_amount: number
  credit_amount: number
  smart_code: string
  line_reference: string
  metadata?: Record<string, any>
}

/**
 * Finance Context - Organization financial configuration
 */
export interface FinanceContext {
  organization_id: string
  base_currency: string
  fiscal_year_start?: string
  chart_of_accounts_id?: string
  businessLocation?: string
  tax_profile?: {
    default_gst_rate: number
    cgst_account: string
    sgst_account: string
    igst_account: string
  }
  gl_accounts?: {
    cash: string
    bank: string
    sales_revenue: string
    cost_of_goods_sold: string
    inventory: string
    accounts_receivable: string
    accounts_payable: string
    [key: string]: string
  }
}

/**
 * Multi-currency support
 */
export interface CurrencyConversion {
  from_currency: string
  to_currency: string
  exchange_rate: number
  conversion_date: string
}

/**
 * GL Posting validation result
 */
export interface GLValidationResult {
  balanced: boolean
  total_debits: number
  total_credits: number
  difference: number
  errors: string[]
  warnings: string[]
}

/**
 * Finance DNA processing result
 */
export interface FinanceDNAResult {
  success: boolean
  gl_entries: GLEntry[]
  validation: GLValidationResult
  metadata: {
    processing_time_ms: number
    rules_applied: string[]
    auto_posted: boolean
  }
  errors: string[]
}

/**
 * Account derivation path
 */
export interface AccountDerivation {
  path: string // e.g., 'finance.customer.ar_control'
  fallback_account?: string
  required: boolean
}

/**
 * Business rule validation
 */
export interface BusinessRuleValidation {
  rule_name: string
  passed: boolean
  message?: string
  severity: 'error' | 'warning' | 'info'
}