/**
 * HERA CLI Zod Validation Schemas
 * Smart Code: HERA.CLI.VALIDATION.SCHEMAS.v1
 */

import { z } from 'zod'

// Base schemas
export const SmartCodeSchema = z.string().regex(
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/,
  'Invalid smart code format: must match HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}'
)

export const UUIDSchema = z.string().uuid('Invalid UUID format')

export const CurrencySchema = z.string().length(3, 'Currency code must be 3 characters').regex(/^[A-Z]{3}$/)

// CLI Global Options
export const GlobalOptionsSchema = z.object({
  json: z.boolean().optional().default(false),
  verbose: z.boolean().optional().default(false),
  config: z.string().optional(),
  org: UUIDSchema.optional()
})

// Init Command Schemas
export const InitInputSchema = z.object({
  org: UUIDSchema.optional(),
  url: z.string().url().optional(),
  writeConfig: z.boolean().optional().default(false),
  interactive: z.boolean().optional().default(true)
})

export const InitOutputSchema = z.object({
  organization_id: UUIDSchema,
  sacred_tables_ok: z.boolean(),
  guardrails_version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  capabilities: z.array(z.enum([
    'finance_dna',
    'fiscal_year_close', 
    'auto_journal',
    'universal_cashflow',
    'ifrs_coa',
    'budgeting'
  ])),
  connection_status: z.enum(['connected', 'mock', 'offline']),
  config_written: z.boolean().optional()
})

// Smart Code Command Schemas
export const SmartCodeValidateInputSchema = z.object({
  smart_code: SmartCodeSchema,
  semantic: z.boolean().optional().default(false),
  json: z.boolean().optional().default(false)
})

export const SmartCodeValidateOutputSchema = z.object({
  smart_code: z.string(),
  valid: z.boolean(),
  pattern: z.string(),
  hints: z.array(z.string()),
  semantic_checks: z.object({
    industry_valid: z.boolean(),
    module_recognized: z.boolean(),
    version_current: z.boolean(),
    reserved_keywords: z.array(z.string()).optional()
  }).optional(),
  suggestions: z.array(z.string()).optional()
})

// Transaction Command Schemas
export const TransactionLineSchema = z.object({
  line_number: z.number().int().positive(),
  line_type: z.enum(['ITEM', 'GL', 'TAX', 'FEE', 'DISCOUNT', 'ADJUSTMENT']),
  entity_id: UUIDSchema.optional(),
  quantity: z.number().nonnegative().default(1),
  unit_amount: z.number().optional(),
  line_amount: z.number(),
  tax_amount: z.number().default(0),
  smart_code: SmartCodeSchema,
  line_data: z.record(z.any()).optional(),
  dimensions: z.object({
    cost_center: z.string().optional(),
    profit_center: z.string().optional(),
    project: z.string().optional(),
    department: z.string().optional()
  }).optional()
})

export const CreateTransactionInputSchema = z.object({
  org: UUIDSchema.optional(),
  code: SmartCodeSchema,
  type: z.enum(['SALE', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'GL_JE', 'TRANSFER', 'ADJUSTMENT']),
  total: z.number().nonnegative().optional(),
  txDate: z.string().datetime().optional(),
  currency: CurrencySchema.optional().default('USD'),
  meta: z.record(z.any()).optional(),
  lines: z.array(TransactionLineSchema).min(1, 'At least one transaction line is required'),
  validate_balance: z.boolean().optional().default(true),
  auto_journal: z.boolean().optional().default(false)
})

export const CreateTransactionOutputSchema = z.object({
  transaction_id: UUIDSchema,
  organization_id: UUIDSchema,
  transaction_type: z.string(),
  smart_code: SmartCodeSchema,
  transaction_date: z.string().datetime(),
  total_amount: z.number(),
  currency: CurrencySchema,
  lines: z.array(z.object({
    id: UUIDSchema,
    line_number: z.number().int(),
    line_type: z.string(),
    entity_id: UUIDSchema.optional(),
    line_amount: z.number(),
    smart_code: SmartCodeSchema
  })),
  ai_confidence: z.number().min(0).max(1).default(0),
  ai_insights: z.record(z.any()).default({}),
  guardrails_passed: z.object({
    multi_tenant: z.boolean(),
    smart_codes_valid: z.boolean(),
    gl_balanced: z.boolean(),
    schema_valid: z.boolean()
  }),
  auto_journal_result: z.object({
    processed: z.boolean(),
    journal_id: UUIDSchema.optional(),
    mode: z.enum(['immediate', 'batched', 'skipped']).optional()
  }).optional()
})

// Transaction List Schemas
export const ListTransactionsInputSchema = z.object({
  org: UUIDSchema.optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  type: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
  include_lines: z.boolean().default(false),
  json: z.boolean().default(false)
})

export const ListTransactionsOutputSchema = z.object({
  transactions: z.array(z.object({
    id: UUIDSchema,
    transaction_type: z.string(),
    transaction_date: z.string().datetime(),
    total_amount: z.number(),
    currency: CurrencySchema,
    smart_code: SmartCodeSchema,
    line_count: z.number().int().nonnegative(),
    lines: z.array(TransactionLineSchema).optional()
  })),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    has_more: z.boolean()
  }),
  summary: z.object({
    total_amount: z.number(),
    transaction_count: z.number().int(),
    currencies: z.array(CurrencySchema),
    date_range: z.object({
      earliest: z.string().datetime(),
      latest: z.string().datetime()
    }).optional()
  })
})

// Data Command Schemas  
export const PutDataInputSchema = z.object({
  entity: UUIDSchema,
  key: z.string().min(1).max(100),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
  type: z.enum(['text', 'number', 'boolean', 'json', 'date', 'currency']).default('text'),
  org: UUIDSchema.optional(),
  smart_code: SmartCodeSchema.optional()
})

export const PutDataOutputSchema = z.object({
  field_id: UUIDSchema,
  entity_id: UUIDSchema,
  field_name: z.string(),
  field_value: z.union([z.string(), z.number(), z.boolean()]),
  field_type: z.string(),
  smart_code: SmartCodeSchema.optional(),
  created_at: z.string().datetime()
})

// Guardrail Command Schemas
export const GuardrailCheckOutputSchema = z.object({
  status: z.enum(['PASSED', 'FAILED', 'WARNING']),
  summary: z.object({
    total_checks: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative()
  }),
  checks: z.array(z.object({
    name: z.string(),
    status: z.enum(['PASS', 'FAIL', 'WARN']),
    message: z.string(),
    details: z.record(z.any()).optional()
  })),
  recommendations: z.array(z.string()),
  schema_version: z.string(),
  execution_time_ms: z.number().int().nonnegative()
})

// Error Response Schema
export const CLIErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.any()).optional(),
  suggestions: z.array(z.string()).optional(),
  exit_code: z.number().int().min(1).max(255)
})

// Configuration Schema
export const ConfigSchema = z.object({
  organization_id: UUIDSchema.optional(),
  database_url: z.string().url().optional(),
  api_endpoint: z.string().url().optional(),
  default_currency: CurrencySchema.default('USD'),
  timezone: z.string().default('UTC'),
  output_format: z.enum(['table', 'json', 'csv']).default('table'),
  auto_journal: z.boolean().default(false),
  guardrails: z.object({
    enforce_smart_codes: z.boolean().default(true),
    enforce_multi_tenancy: z.boolean().default(true),
    enforce_gl_balance: z.boolean().default(true),
    auto_fix_violations: z.boolean().default(false)
  }).default({}),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    endpoint: z.string().url().optional(),
    include_performance: z.boolean().default(true)
  }).default({})
})

// Helper validation functions
export const validateSmartCode = (code: string) => {
  return SmartCodeSchema.safeParse(code)
}

export const validateUUID = (id: string) => {
  return UUIDSchema.safeParse(id)
}

export const validateTransactionLines = (lines: any[]) => {
  return z.array(TransactionLineSchema).safeParse(lines)
}

// Type exports for TypeScript
export type SmartCode = z.infer<typeof SmartCodeSchema>
export type UUID = z.infer<typeof UUIDSchema>
export type Currency = z.infer<typeof CurrencySchema>
export type TransactionLine = z.infer<typeof TransactionLineSchema>
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>
export type CreateTransactionOutput = z.infer<typeof CreateTransactionOutputSchema>
export type InitInput = z.infer<typeof InitInputSchema>
export type InitOutput = z.infer<typeof InitOutputSchema>
export type SmartCodeValidateInput = z.infer<typeof SmartCodeValidateInputSchema>
export type SmartCodeValidateOutput = z.infer<typeof SmartCodeValidateOutputSchema>
export type CLIError = z.infer<typeof CLIErrorSchema>
export type Config = z.infer<typeof ConfigSchema>