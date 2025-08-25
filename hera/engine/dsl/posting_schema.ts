import { z } from 'zod';

// Ledger types enum
export const LedgerType = z.enum(['GL', 'STAT', 'MGMT', 'IFRS', 'LOCAL_GAAP']);

// Account mappings schema
export const AccountMappings = z.object({
  revenue: z.string().uuid('Revenue account must be a valid entity ID'),
  tax_output: z.string().uuid('Tax output account must be a valid entity ID'),
  tips_payable: z.string().uuid('Tips payable account must be a valid entity ID').optional(),
  clearing: z.string().uuid('Clearing account must be a valid entity ID'),
  fees: z.string().uuid('Fees account must be a valid entity ID').optional(),
  discount: z.string().uuid('Discount account must be a valid entity ID').optional(),
  rounding: z.string().uuid('Rounding account must be a valid entity ID').optional(),
}).catchall(z.string().uuid());

// Tax configuration schema
export const TaxConfig = z.object({
  profile_ref: z.string().uuid('Tax profile reference must be a valid entity ID'),
  inclusive_prices: z.boolean(),
  rounding: z.enum(['none', 'line', 'total', 'swedish'])
});

// Split dimension enum
export const SplitDimension = z.enum([
  'cost_center',
  'profit_center', 
  'project',
  'location',
  'department',
  'product_line',
  'channel',
  'customer_segment'
]);

// Split rule schema
export const SplitRule = z.object({
  event_pattern: z.string().regex(/^.+$/, 'Event pattern must be a valid regex'),
  split_by: z.string(),
  allocation_method: z.enum(['proportional', 'fixed', 'custom']),
  allocation_data: z.record(z.unknown()).optional()
});

// Splits configuration
export const SplitsConfig = z.object({
  dimensions: z.array(SplitDimension).min(1),
  rules: z.array(SplitRule)
});

// Dimension requirement schema
export const DimensionRequirement = z.object({
  account_pattern: z.string().regex(/^.+$/, 'Account pattern must be a valid regex'),
  required_dimensions: z.array(z.string()).min(1),
  enforcement: z.enum(['error', 'warning', 'auto_default']),
  default_values: z.record(z.string()).optional()
});

// Payment configuration
export const PaymentConfig = z.object({
  capture_type: z.enum(['immediate', 'deferred', 'manual']).default('immediate'),
  open_item: z.boolean().default(false),
  settlement_days: z.number().int().min(0).default(0)
});

// Validation configuration
export const ValidationConfig = z.object({
  max_line_count: z.number().int().min(1).default(1000),
  require_external_ref: z.boolean().default(false),
  allowed_currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).optional()
});

// Complete posting schema
export const PostingSchema = z.object({
  ledgers: z.array(LedgerType).min(1),
  accounts: AccountMappings,
  tax: TaxConfig,
  splits: SplitsConfig,
  dimension_requirements: z.array(DimensionRequirement),
  payments: PaymentConfig.optional(),
  validations: ValidationConfig.optional()
});

export type PostingSchemaType = z.infer<typeof PostingSchema>;
export type LedgerTypeType = z.infer<typeof LedgerType>;
export type TaxConfigType = z.infer<typeof TaxConfig>;
export type SplitRuleType = z.infer<typeof SplitRule>;
export type DimensionRequirementType = z.infer<typeof DimensionRequirement>;