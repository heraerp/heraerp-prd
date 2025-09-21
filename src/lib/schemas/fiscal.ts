// ================================================================================
// FISCAL SCHEMAS - ZEST VALIDATION
// Smart Code: HERA.LIB.SCHEMAS.FISCAL.v1
// Production-ready fiscal period and configuration schemas
// ================================================================================

import { z } from 'zod'

// Period status enum
export const PeriodStatus = z.enum(['open', 'locked', 'closed'])

// Fiscal configuration schema
export const FiscalConfig = z.object({
  fiscal_year_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  retained_earnings_account: z.string().min(2, 'Account code required'),
  lock_after_days: z.number().int().min(0).max(90).default(7),
  updated_at: z.string().optional(),
  updated_by: z.string().optional()
})
export type FiscalConfig = z.infer<typeof FiscalConfig>

// Fiscal period schema
export const FiscalPeriod = z.object({
  code: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  status: PeriodStatus,
  locked_at: z.string().optional(),
  locked_by: z.string().optional(),
  closed_at: z.string().optional(),
  closed_by: z.string().optional()
})
export type FiscalPeriod = z.infer<typeof FiscalPeriod>

// Close checklist item schema
export const CloseChecklistItem = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  completed_at: z.string().optional(),
  completed_by: z.string().optional(),
  notes: z.string().optional()
})

export const CloseChecklist = z.array(CloseChecklistItem)
export type CloseChecklist = z.infer<typeof CloseChecklist>

// Year close request
export const YearCloseRequest = z.object({
  fiscal_year: z.string().regex(/^\d{4}$/, 'Must be YYYY format'),
  retained_earnings_account: z.string().min(2, 'Account code required'),
  confirm_all_periods_closed: z.boolean(),
  notes: z.string().optional()
})
export type YearCloseRequest = z.infer<typeof YearCloseRequest>

// Fiscal smart codes
export const FISCAL_SMART_CODES = {
  CONFIG_UPDATE: 'HERA.FIN.FISCAL.CONFIG.UPDATE.V1',
  PERIODS_UPDATE: 'HERA.FIN.FISCAL.PERIODS.UPDATE.V1',
  CHECKLIST_UPDATE: 'HERA.FIN.FISCAL.CHECKLIST.UPDATE.V1',
  PERIOD_LOCK: 'HERA.FIN.FISCAL.PERIOD.LOCK.V1',
  PERIOD_CLOSE: 'HERA.FIN.FISCAL.PERIOD.CLOSE.V1',
  YEAR_CLOSE: 'HERA.FIN.FISCAL.YEAR.CLOSE.V1'
} as const

// Fiscal dynamic data keys
export const FISCAL_DYNAMIC_DATA_KEYS = {
  CONFIG: 'FISCAL.CONFIG.v1',
  PERIODS: 'FISCAL.PERIODS.v1',
  CHECKLIST: 'FISCAL.CLOSE.CHECKLIST.v1'
} as const

// Default checklist items
export const DEFAULT_CHECKLIST_ITEMS: Omit<
  CloseChecklistItem,
  'completed' | 'completed_at' | 'completed_by'
>[] = [
  {
    key: 'pos_posted',
    label: 'All POS transactions posted',
    description: 'Ensure all daily sales are recorded'
  },
  {
    key: 'commissions_accrued',
    label: 'All commissions accrued',
    description: 'Staff commissions calculated and posted'
  },
  {
    key: 'vat_reconciled',
    label: 'VAT reconciled',
    description: 'Tax calculations verified and posted'
  },
  {
    key: 'inventory_valued',
    label: 'Inventory valuation posted',
    description: 'Physical counts match system records'
  },
  {
    key: 'bank_reconciled',
    label: 'Bank accounts reconciled',
    description: 'All bank statements matched'
  },
  {
    key: 'receivables_reviewed',
    label: 'Receivables reviewed',
    description: 'Customer balances verified'
  },
  {
    key: 'payables_reviewed',
    label: 'Payables reviewed',
    description: 'Vendor balances confirmed'
  },
  {
    key: 'depreciation_posted',
    label: 'Depreciation posted',
    description: 'Monthly depreciation calculated'
  },
  {
    key: 'accruals_posted',
    label: 'Accruals posted',
    description: 'Prepaid and accrued expenses recorded'
  },
  {
    key: 'reports_generated',
    label: 'Financial reports generated',
    description: 'P&L, Balance Sheet, and Cash Flow completed'
  },
  {
    key: 'backup_completed',
    label: 'System backup completed',
    description: 'Full backup of all data'
  },
  {
    key: 'management_approval',
    label: 'Management approval received',
    description: 'Finance manager has reviewed and approved'
  }
]
