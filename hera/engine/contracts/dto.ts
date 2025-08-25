/**
 * Data Transfer Objects for HERA Ledger Engine
 * Zod schemas and TypeScript types for API contracts
 */

import { z } from 'zod';

// ISO 4217 currency code pattern
const CurrencyCode = z.string().regex(/^[A-Z]{3}$/, 'Invalid ISO 4217 currency code');

// Smart code pattern
const SmartCode = z.string().regex(
  /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/,
  'Invalid smart code format (expected: HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.v1)'
);

/**
 * Input DTO for ledger requests
 */
export const LedgerRequestSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  event_smart_code: SmartCode,
  business_context: z.record(z.any()).optional(),
  total_amount: z.number().positive('Total amount must be positive'),
  currency: CurrencyCode,
  external_reference: z.string().optional(), // idempotency key
  simulate: z.boolean().optional().default(false),
});

export type LedgerRequest = z.infer<typeof LedgerRequestSchema>;

/**
 * Core ledger header structure
 */
export const LedgerHeaderSchema = z.object({
  organization_id: z.string().uuid(),
  transaction_type: z.literal('GL_JOURNAL'),
  smart_code: SmartCode,
  transaction_currency_code: CurrencyCode,
  base_currency_code: CurrencyCode,
  posting_period_code: z.string().nullable().optional(),
  business_context: z.record(z.any()).optional(),
  external_reference: z.string().nullable().optional(),
  total_amount: z.number(),
});

export type LedgerHeader = z.infer<typeof LedgerHeaderSchema>;

/**
 * Ledger line item structure
 */
export const LedgerLineSchema = z.object({
  entity_id: z.string().uuid('Entity ID must be a valid UUID'), // GL account
  line_type: z.enum(['debit', 'credit']),
  line_amount: z.number().positive('Line amount must be positive'),
  line_data: z.record(z.any()).optional(),
  smart_code: SmartCode,
});

export type LedgerLine = z.infer<typeof LedgerLineSchema>;

/**
 * Response for simulation requests
 */
export const SimulateResponseSchema = z.object({
  header: LedgerHeaderSchema,
  lines: z.array(LedgerLineSchema).min(2, 'Journal must have at least 2 lines'),
});

export type SimulateResponse = z.infer<typeof SimulateResponseSchema>;

/**
 * Response for post requests
 */
export const PostResponseSchema = z.object({
  transaction_id: z.string().uuid(),
});

export type PostResponse = z.infer<typeof PostResponseSchema>;

/**
 * Extended journal entry for complex postings
 */
export const JournalEntrySchema = z.object({
  header: LedgerHeaderSchema,
  lines: z.array(LedgerLineSchema),
  metadata: z.object({
    source_system: z.string().optional(),
    batch_id: z.string().optional(),
    approval_status: z.string().optional(),
    posted_by: z.string().optional(),
    posted_at: z.string().datetime().optional(),
  }).optional(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

/**
 * Dimension data for analytical postings
 */
export const DimensionDataSchema = z.object({
  cost_center: z.string().optional(),
  profit_center: z.string().optional(),
  project: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  product_line: z.string().optional(),
  channel: z.string().optional(),
  customer_segment: z.string().optional(),
});

export type DimensionData = z.infer<typeof DimensionDataSchema>;

/**
 * Tax calculation data embedded in lines
 */
export const TaxDataSchema = z.object({
  tax_rate: z.number(),
  tax_category: z.string(),
  tax_jurisdiction: z.string(),
  reverse_charge: z.boolean().optional(),
  tax_base_amount: z.number().optional(),
});

export type TaxData = z.infer<typeof TaxDataSchema>;

/**
 * Settlement data for payment postings
 */
export const SettlementDataSchema = z.object({
  payment_method: z.string(),
  payment_reference: z.string().optional(),
  settlement_date: z.string().date().optional(),
  bank_reference: z.string().optional(),
  fees_amount: z.number().optional(),
});

export type SettlementData = z.infer<typeof SettlementDataSchema>;

/**
 * Parse and validate ledger request
 */
export function parseLedgerRequest(data: unknown): z.SafeParseReturnType<LedgerRequest, LedgerRequest> {
  return LedgerRequestSchema.safeParse(data);
}

/**
 * Create a balanced journal entry
 */
export function createJournalEntry(
  header: Omit<LedgerHeader, 'transaction_type'>,
  lines: LedgerLine[]
): JournalEntry {
  return {
    header: {
      ...header,
      transaction_type: 'GL_JOURNAL',
    },
    lines,
  };
}

/**
 * Helper to create a simple two-line journal
 */
export function createSimpleJournal(
  organizationId: string,
  debitAccount: string,
  creditAccount: string,
  amount: number,
  smartCode: string,
  currency: string = 'USD'
): JournalEntry {
  return createJournalEntry(
    {
      organization_id: organizationId,
      smart_code: smartCode,
      transaction_currency_code: currency,
      base_currency_code: currency,
      total_amount: amount,
    },
    [
      {
        entity_id: debitAccount,
        line_type: 'debit',
        line_amount: amount,
        smart_code: smartCode,
      },
      {
        entity_id: creditAccount,
        line_type: 'credit',
        line_amount: amount,
        smart_code: smartCode,
      },
    ]
  );
}