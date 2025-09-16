// ================================================================================
// REPORTS SCHEMAS - ZOD CONTRACTS
// Smart Code: HERA.SCHEMA.REPORTS.v1
// Production-grade validation for owner reports with drill-down support
// ================================================================================

import { z } from 'zod'

// Date and time validation
export const DateISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
export const MonthISO = z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM format')
export const DateTimeISO = z.string().datetime()

// Currency and amounts
export const CurrencyCode = z.string().length(3).default('AED')
export const Amount = z.number().finite()

// Core report filters
export const BaseReportFilters = z.object({
  organization_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  currency: CurrencyCode.optional()
})

// Sales report specific filters
export const SalesFilters = BaseReportFilters.extend({
  date: DateISO.optional(),
  month: MonthISO.optional(),
  include_tips: z.boolean().default(true),
  service_only: z.boolean().default(false),
  product_only: z.boolean().default(false)
})

export type SalesFilters = z.infer<typeof SalesFilters>

// Financial report filters
export const FinancialFilters = BaseReportFilters.extend({
  from_date: DateISO.optional(),
  to_date: DateISO.optional(),
  as_of_date: DateISO.optional(),
  consolidated: z.boolean().default(true)
})

export type FinancialFilters = z.infer<typeof FinancialFilters>

// ================================================================================
// SALES REPORTS DATA MODELS
// ================================================================================

export const SalesRow = z.object({
  date: DateISO.optional(),
  hour: z.string().optional(), // "09:00", "10:00", etc.
  branch_code: z.string().optional(),
  branch_name: z.string().optional(),
  service_net: Amount,
  product_net: Amount,
  tips: Amount.default(0),
  vat: Amount,
  gross: Amount,
  txn_count: z.number().int().nonnegative(),
  avg_ticket: Amount,
  commission_paid: Amount.optional()
})

export type SalesRow = z.infer<typeof SalesRow>

export const DailySalesReport = z.object({
  organization_id: z.string().uuid(),
  report_date: DateISO,
  branch_id: z.string().uuid().optional(),
  currency: CurrencyCode,
  summary: z.object({
    total_gross: Amount,
    total_net: Amount,
    total_vat: Amount,
    total_tips: Amount,
    total_service: Amount,
    total_product: Amount,
    transaction_count: z.number().int(),
    average_ticket: Amount,
    service_mix_percent: z.number().min(0).max(100),
    product_mix_percent: z.number().min(0).max(100)
  }),
  hourly_breakdown: z.array(SalesRow),
  top_services: z.array(z.object({
    service_name: z.string(),
    service_count: z.number(),
    service_revenue: Amount
  })),
  generated_at: DateTimeISO
})

export type DailySalesReport = z.infer<typeof DailySalesReport>

export const MonthlySalesReport = z.object({
  organization_id: z.string().uuid(),
  report_month: MonthISO,
  branch_id: z.string().uuid().optional(),
  currency: CurrencyCode,
  summary: z.object({
    total_gross: Amount,
    total_net: Amount,
    total_vat: Amount,
    total_tips: Amount,
    total_service: Amount,
    total_product: Amount,
    transaction_count: z.number().int(),
    average_ticket: Amount,
    average_daily: Amount,
    working_days: z.number().int().positive(),
    growth_vs_previous: z.number().optional()
  }),
  daily_breakdown: z.array(SalesRow),
  weekly_trends: z.array(z.object({
    week_start: DateISO,
    week_end: DateISO,
    weekly_total: Amount,
    daily_average: Amount,
    transaction_count: z.number()
  })),
  generated_at: DateTimeISO
})

export type MonthlySalesReport = z.infer<typeof MonthlySalesReport>

// ================================================================================
// FINANCIAL REPORTS DATA MODELS
// ================================================================================

export const PnLRow = z.object({
  account_code: z.string(),
  account_name: z.string(),
  group: z.enum(['revenue', 'cogs', 'gross_profit', 'expenses', 'operating_profit', 'other', 'net_income']),
  sub_group: z.string().optional(), // "Food Sales", "Beverage Sales", etc.
  amount: Amount,
  percentage: z.number().optional(), // % of revenue
  prior_period_amount: Amount.optional(),
  variance_amount: Amount.optional(),
  variance_percent: z.number().optional(),
  is_subtotal: z.boolean().default(false),
  level: z.number().int().min(0).max(5).default(0) // Indent level for hierarchy
})

export type PnLRow = z.infer<typeof PnLRow>

export const ProfitLossStatement = z.object({
  organization_id: z.string().uuid(),
  from_date: DateISO,
  to_date: DateISO,
  branch_id: z.string().uuid().optional(),
  currency: CurrencyCode,
  summary: z.object({
    total_revenue: Amount,
    total_cogs: Amount,
    gross_profit: Amount,
    gross_margin_percent: z.number(),
    total_expenses: Amount,
    operating_profit: Amount,
    operating_margin_percent: z.number(),
    net_income: Amount,
    net_margin_percent: z.number()
  }),
  line_items: z.array(PnLRow),
  comparison_available: z.boolean().default(false),
  generated_at: DateTimeISO
})

export type ProfitLossStatement = z.infer<typeof ProfitLossStatement>

export const BalanceRow = z.object({
  account_code: z.string(),
  account_name: z.string(),
  group: z.enum(['assets', 'liabilities', 'equity']),
  sub_group: z.string().optional(), // "Current Assets", "Non-Current Assets", etc.
  amount: Amount,
  percentage: z.number().optional(), // % of total assets
  prior_period_amount: Amount.optional(),
  variance_amount: Amount.optional(),
  is_subtotal: z.boolean().default(false),
  level: z.number().int().min(0).max(5).default(0)
})

export type BalanceRow = z.infer<typeof BalanceRow>

export const BalanceSheet = z.object({
  organization_id: z.string().uuid(),
  as_of_date: DateISO,
  branch_id: z.string().uuid().optional(),
  currency: CurrencyCode,
  summary: z.object({
    total_assets: Amount,
    total_liabilities: Amount,
    total_equity: Amount,
    balance_check: z.object({
      is_balanced: z.boolean(),
      difference: Amount,
      tolerance: Amount.default(0.01)
    }),
    current_ratio: z.number().optional(),
    debt_to_equity: z.number().optional()
  }),
  line_items: z.array(BalanceRow),
  comparison_available: z.boolean().default(false),
  generated_at: DateTimeISO
})

export type BalanceSheet = z.infer<typeof BalanceSheet>

// ================================================================================
// DRILL-DOWN AND TRANSACTION DETAILS
// ================================================================================

export const DrillDownFilters = BaseReportFilters.extend({
  from_date: DateISO.optional(),
  to_date: DateISO.optional(),
  account_code: z.string().optional(),
  service_only: z.boolean().default(false),
  product_only: z.boolean().default(false),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0)
})

export type DrillDownFilters = z.infer<typeof DrillDownFilters>

export const TransactionSummary = z.object({
  transaction_id: z.string().uuid(),
  transaction_date: DateISO,
  transaction_code: z.string(),
  transaction_type: z.string(),
  smart_code: z.string(),
  customer_name: z.string().optional(),
  staff_name: z.string().optional(),
  total_amount: Amount,
  description: z.string(),
  line_count: z.number().int().positive()
})

export type TransactionSummary = z.infer<typeof TransactionSummary>

export const TransactionDetail = z.object({
  transaction: z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    transaction_date: DateISO,
    transaction_code: z.string(),
    transaction_type: z.string(),
    smart_code: z.string(),
    total_amount: Amount,
    source_entity_id: z.string().uuid().optional(),
    target_entity_id: z.string().uuid().optional(),
    reference_number: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }),
  lines: z.array(z.object({
    line_number: z.number().int().positive(),
    line_type: z.string(),
    entity_id: z.string().uuid(),
    entity_name: z.string(),
    description: z.string(),
    quantity: z.number().optional(),
    unit_amount: Amount.optional(),
    line_amount: Amount,
    smart_code: z.string(),
    metadata: z.record(z.any()).optional()
  })),
  related_entities: z.array(z.object({
    entity_id: z.string().uuid(),
    entity_type: z.string(),
    entity_name: z.string(),
    role: z.string() // "customer", "staff", "product", "service", etc.
  })),
  auto_journal_entries: z.array(z.object({
    account_code: z.string(),
    account_name: z.string(),
    debit_amount: Amount.optional(),
    credit_amount: Amount.optional(),
    smart_code: z.string()
  })).optional()
})

export type TransactionDetail = z.infer<typeof TransactionDetail>

export const DrillDownResponse = z.object({
  filters: DrillDownFilters,
  total_count: z.number().int().nonnegative(),
  total_amount: Amount,
  transactions: z.array(TransactionSummary)
})

export type DrillDownResponse = z.infer<typeof DrillDownResponse>

// ================================================================================
// EXPORT AND PRINT CONFIGURATIONS
// ================================================================================

export const ExportFormat = z.enum(['csv', 'excel', 'pdf'])
export const PrintOptions = z.object({
  include_header: z.boolean().default(true),
  include_summary: z.boolean().default(true),
  include_details: z.boolean().default(true),
  page_orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  font_size: z.enum(['small', 'normal', 'large']).default('normal')
})

export type PrintOptions = z.infer<typeof PrintOptions>

// ================================================================================
// VALIDATION HELPERS
// ================================================================================

export const validateSalesFilters = (data: unknown): SalesFilters => {
  return SalesFilters.parse(data)
}

export const validateFinancialFilters = (data: unknown): FinancialFilters => {
  return FinancialFilters.parse(data)
}

export const validateDrillDownFilters = (data: unknown): DrillDownFilters => {
  return DrillDownFilters.parse(data)
}

// ================================================================================
// CALCULATION HELPERS FOR UNIT TESTS
// ================================================================================

export const ReportCalculations = {
  // Calculate totals for sales rows
  calculateSalesTotals: (rows: SalesRow[]) => {
    return rows.reduce((acc, row) => ({
      service_net: acc.service_net + row.service_net,
      product_net: acc.product_net + row.product_net,
      tips: acc.tips + row.tips,
      vat: acc.vat + row.vat,
      gross: acc.gross + row.gross,
      txn_count: acc.txn_count + row.txn_count
    }), {
      service_net: 0,
      product_net: 0,
      tips: 0,
      vat: 0,
      gross: 0,
      txn_count: 0
    })
  },

  // Calculate P&L subtotals by group
  calculatePnLSubtotals: (rows: PnLRow[]) => {
    const subtotals = new Map<string, number>()
    
    for (const row of rows) {
      if (!row.is_subtotal) {
        const current = subtotals.get(row.group) || 0
        subtotals.set(row.group, current + row.amount)
      }
    }

    return {
      revenue: Math.abs(subtotals.get('revenue') || 0), // Revenue is negative in accounting
      cogs: subtotals.get('cogs') || 0,
      expenses: subtotals.get('expenses') || 0,
      other: subtotals.get('other') || 0,
      gross_profit: Math.abs(subtotals.get('revenue') || 0) - (subtotals.get('cogs') || 0),
      operating_profit: Math.abs(subtotals.get('revenue') || 0) - (subtotals.get('cogs') || 0) - (subtotals.get('expenses') || 0),
      net_income: Math.abs(subtotals.get('revenue') || 0) - (subtotals.get('cogs') || 0) - (subtotals.get('expenses') || 0) + (subtotals.get('other') || 0)
    }
  },

  // Validate balance sheet equation
  validateBalanceEquation: (rows: BalanceRow[], tolerance: number = 0.01) => {
    const totals = rows.reduce((acc, row) => {
      if (!row.is_subtotal) {
        switch (row.group) {
          case 'assets':
            acc.assets += row.amount
            break
          case 'liabilities':
            acc.liabilities += row.amount
            break
          case 'equity':
            acc.equity += row.amount
            break
        }
      }
      return acc
    }, { assets: 0, liabilities: 0, equity: 0 })

    const difference = totals.assets - (totals.liabilities + totals.equity)
    
    return {
      is_balanced: Math.abs(difference) <= tolerance,
      difference,
      assets: totals.assets,
      liabilities: totals.liabilities,
      equity: totals.equity
    }
  },

  // Calculate service/product mix percentages
  calculateSalesMix: (serviceNet: number, productNet: number) => {
    const total = serviceNet + productNet
    if (total === 0) return { service_percent: 0, product_percent: 0 }
    
    return {
      service_percent: Math.round((serviceNet / total) * 100 * 100) / 100, // Round to 2 decimals
      product_percent: Math.round((productNet / total) * 100 * 100) / 100
    }
  },

  // Format currency amounts
  formatCurrency: (amount: number, currency: string = 'AED', locale: string = 'en-AE') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  },

  // Calculate percentage with safe division
  calculatePercentage: (numerator: number, denominator: number, decimals: number = 2) => {
    if (denominator === 0) return 0
    return Math.round((numerator / denominator) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }
}

// All types are already exported at their definitions