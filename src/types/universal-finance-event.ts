/**
 * Universal Finance Event (UFE) Contract
 * HERA Modern Digital Accountant (MDA) System
 *
 * This contract defines the standardized format for all finance events
 * that need to be processed through the Auto-Posting Engine (APE).
 *
 * The APE will expand UFE → Universal Transactions + Transaction Lines
 * with balanced GL entries based on posting rules.
 */

import { z } from 'zod'

/**
 * Universal Finance Event Schema
 *
 * Input format for /api/v2/transactions/post endpoint
 * Lines array is intentionally left empty - APE will derive from rules
 */
export const UniversalFinanceEventSchema = z.object({
  // Required organization context (Sacred Six enforcement)
  organization_id: z.string().uuid('Organization ID must be a valid UUID'),

  // Transaction classification
  transaction_type: z
    .string()
    .regex(
      /^TX\.FINANCE\.[A-Z_]+\.V\d+$/,
      'Transaction type must follow TX.FINANCE.{KIND}.V{N} pattern'
    )
    .describe('Finance transaction type: TX.FINANCE.EXPENSE.V1, TX.FINANCE.REVENUE.V1, etc.'),

  // Smart Code for business intelligence and posting rules
  smart_code: z
    .string()
    .regex(
      /^HERA\.SALON\.FINANCE\.TXN\.[A-Z_]+\.[A-Z_]+\.V\d+$/,
      'Smart code must follow HERA.SALON.FINANCE.TXN.{KIND}.{SUBKIND}.V{N} pattern'
    )
    .describe('Business context smart code for automated posting rule resolution'),

  // Transaction timing
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .describe('Transaction date for fiscal period validation'),

  // Optional source entity (customer, vendor, staff)
  source_entity_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      'Optional entity reference (customer for sales, vendor for purchases, staff for payroll)'
    ),

  // Financial amounts
  total_amount: z
    .number()
    .positive('Total amount must be positive')
    .describe('Total transaction amount before any breakdowns'),

  // Currency handling
  transaction_currency_code: z
    .string()
    .length(3, 'Currency code must be 3 characters (ISO 4217)')
    .default('AED')
    .describe('Transaction currency (AED, USD, GBP, etc.)'),

  base_currency_code: z
    .string()
    .length(3, 'Base currency code must be 3 characters (ISO 4217)')
    .default('AED')
    .describe('Organization base currency for reporting'),

  exchange_rate: z
    .number()
    .positive('Exchange rate must be positive')
    .default(1.0)
    .describe('Exchange rate from transaction currency to base currency'),

  // Business context for posting rule resolution
  business_context: z
    .object({
      channel: z
        .enum(['MCP', 'POS', 'BANK', 'MANUAL', 'IMPORT'])
        .describe('Source channel for the transaction'),

      note: z.string().optional().describe('Free text description for the transaction'),

      branch_id: z.string().uuid().optional().describe('Optional branch/location reference'),

      category: z
        .string()
        .optional()
        .describe('Business category (Payroll, Rent, POS, etc.) for posting rule lookup'),

      // POS-specific context
      pos_terminal: z.string().optional().describe('POS terminal identifier for EOD summaries'),

      shift_id: z.string().uuid().optional().describe('Shift reference for POS transactions'),

      // Additional context for complex transactions
      is_eod_summary: z
        .boolean()
        .default(false)
        .describe('Flag indicating this is an end-of-day summary transaction'),

      vat_inclusive: z.boolean().default(true).describe('Whether the total_amount includes VAT')
    })
    .describe('Business context for automated posting rule resolution'),

  // Technical metadata
  metadata: z
    .object({
      ingest_source: z.string().describe('Technical source system (MCP_Bank, POS_Terminal, etc.)'),

      original_ref: z.string().optional().describe('Original reference from source system'),

      correlation_id: z
        .string()
        .uuid()
        .optional()
        .describe('Optional correlation ID for tracking related transactions'),

      batch_id: z.string().uuid().optional().describe('Batch identifier for bulk processing'),

      reconciliation_key: z.string().optional().describe('Key for bank reconciliation matching')
    })
    .describe('Technical metadata for audit and reconciliation'),

  // Lines intentionally left empty - APE will derive from posting rules
  lines: z
    .array(z.any())
    .max(0, 'Lines must be empty - Auto-Posting Engine will generate based on rules')
    .default([])
    .describe('Must be empty array - APE generates lines from posting rules'),

  // POS-specific totals for EOD summaries
  totals: z
    .object({
      gross_sales: z.number().optional().describe('Total sales before taxes and discounts'),

      vat: z.number().optional().describe('Total VAT amount'),

      tips: z.number().optional().describe('Total tips amount'),

      fees: z.number().optional().describe('Processing fees (card fees, etc.)'),

      cash_collected: z.number().optional().describe('Cash payment total'),

      card_settlement: z.number().optional().describe('Card payment settlement amount'),

      discounts: z.number().optional().describe('Total discount amount'),

      commission: z.number().optional().describe('Staff commission amount')
    })
    .optional()
    .describe('Breakdown totals for POS EOD summaries')
})

export type UniversalFinanceEvent = z.infer<typeof UniversalFinanceEventSchema>

/**
 * Finance Transaction Types
 * Standardized transaction types for the MDA system
 */
export const FINANCE_TRANSACTION_TYPES = {
  EXPENSE: 'TX.FINANCE.EXPENSE.V1',
  REVENUE: 'TX.FINANCE.REVENUE.V1',
  PAYMENT: 'TX.FINANCE.PAYMENT.V1',
  RECEIPT: 'TX.FINANCE.RECEIPT.V1',
  JOURNAL: 'TX.FINANCE.JOURNAL.V1',
  POS_EOD: 'TX.FINANCE.POS_EOD.V1',
  BANK_FEE: 'TX.FINANCE.BANK_FEE.V1',
  TRANSFER: 'TX.FINANCE.TRANSFER.V1',
  ADJUSTMENT: 'TX.FINANCE.ADJUSTMENT.V1'
} as const

/**
 * Salon Finance Smart Codes
 * Comprehensive smart codes for salon operations
 */
export const SALON_FINANCE_SMART_CODES = {
  // Expense categories
  EXPENSE: {
    SALARY: 'HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1',
    COMMISSION: 'HERA.SALON.FINANCE.TXN.EXPENSE.COMMISSION.V1',
    RENT: 'HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1',
    UTILITIES: 'HERA.SALON.FINANCE.TXN.EXPENSE.UTILITIES.V1',
    SUPPLIES: 'HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1',
    MARKETING: 'HERA.SALON.FINANCE.TXN.EXPENSE.MARKETING.V1',
    INSURANCE: 'HERA.SALON.FINANCE.TXN.EXPENSE.INSURANCE.V1',
    MAINTENANCE: 'HERA.SALON.FINANCE.TXN.EXPENSE.MAINTENANCE.V1'
  },

  // Revenue categories
  REVENUE: {
    SERVICE: 'HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1',
    PRODUCT: 'HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1',
    PACKAGE: 'HERA.SALON.FINANCE.TXN.REVENUE.PACKAGE.V1'
  },

  // POS operations
  POS: {
    DAILY_SUMMARY: 'HERA.SALON.FINANCE.TXN.POS.DAILY_SUMMARY.V1',
    CASH_SALE: 'HERA.SALON.FINANCE.TXN.POS.CASH_SALE.V1',
    CARD_SALE: 'HERA.SALON.FINANCE.TXN.POS.CARD_SALE.V1',
    TIP_COLLECTION: 'HERA.SALON.FINANCE.TXN.POS.TIP_COLLECTION.V1'
  },

  // Banking
  BANK: {
    FEE: 'HERA.SALON.FINANCE.TXN.BANK.FEE.V1',
    TRANSFER: 'HERA.SALON.FINANCE.TXN.BANK.TRANSFER.V1',
    DEPOSIT: 'HERA.SALON.FINANCE.TXN.BANK.DEPOSIT.V1'
  },

  // Journal entries
  JOURNAL: {
    AUTO_POSTING: 'HERA.SALON.FINANCE.JE.AUTO.POSTING.V1',
    MANUAL_ADJUSTMENT: 'HERA.SALON.FINANCE.JE.MANUAL.ADJUSTMENT.V1',
    PERIOD_CLOSE: 'HERA.SALON.FINANCE.JE.PERIOD.CLOSE.V1'
  }
} as const

/**
 * API Response Types
 */
export interface UFEProcessingResult {
  success: boolean
  transaction_id?: string
  journal_entry_id?: string
  posting_period?: string
  gl_lines?: Array<{
    account_code: string
    account_name: string
    debit_amount?: number
    credit_amount?: number
    description: string
  }>
  validation_errors?: string[]
  posting_errors?: string[]
  message?: string
}

/**
 * Fiscal Period Validation
 */
export interface FiscalPeriod {
  period_code: string
  period_name: string
  start_date: string
  end_date: string
  status: 'open' | 'current' | 'closed'
  fiscal_year: string
}

/**
 * VAT Configuration
 */
export interface VATConfig {
  country_code: string
  standard_rate: number
  reduced_rate?: number
  zero_rate: number
  vat_account_payable: string
  vat_account_receivable: string
  vat_inclusive_default: boolean
}

/**
 * Helper function to create UFE for common salon operations
 */
export function createSalonUFE(
  organizationId: string,
  type: keyof typeof SALON_FINANCE_SMART_CODES,
  subtype: string,
  amount: number,
  businessContext: Partial<UniversalFinanceEvent['business_context']> = {},
  metadata: Partial<UniversalFinanceEvent['metadata']> = {}
): UniversalFinanceEvent {
  const smartCodeMap = SALON_FINANCE_SMART_CODES[type] as Record<string, string>
  const smartCode = smartCodeMap[subtype.toUpperCase()]

  if (!smartCode) {
    throw new Error(`Invalid salon finance operation: ${type}.${subtype}`)
  }

  return {
    organization_id: organizationId,
    transaction_type:
      type === 'EXPENSE'
        ? FINANCE_TRANSACTION_TYPES.EXPENSE
        : type === 'REVENUE'
          ? FINANCE_TRANSACTION_TYPES.REVENUE
          : FINANCE_TRANSACTION_TYPES.JOURNAL,
    smart_code: smartCode,
    transaction_date: new Date().toISOString().split('T')[0],
    total_amount: amount,
    transaction_currency_code: 'AED',
    base_currency_code: 'AED',
    exchange_rate: 1.0,
    business_context: {
      channel: 'MCP',
      ...businessContext
    },
    metadata: {
      ingest_source: 'MCP_System',
      ...metadata
    },
    lines: []
  }
}
