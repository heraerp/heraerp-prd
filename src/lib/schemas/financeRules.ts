// ================================================================================
// FINANCE RULES SCHEMAS
// Smart Code: HERA.LIB.SCHEMAS.FINANCE_RULES.v1
// Zod schemas for Finance DNA posting rules (policy-as-data)
// ================================================================================

import { z } from 'zod'

export const Mapping = z.object({
  account: z.string().min(2), // e.g. "4100"
  side: z.enum(['debit', 'credit']),
  amount_source: z.enum(['net', 'tax', 'gross', 'tip', 'discount', 'cogs', 'commission', 'custom']),
  multiplier: z.number().default(1),
  memo: z.string().optional()
})

export const PostingRule = z.object({
  key: z.string().min(8), // FIN_DNA.RULES.<NAME>.vN
  title: z.string().min(3),
  description: z.string().optional(),
  category: z
    .enum(['pos', 'payments', 'inventory', 'commissions', 'fiscal', 'other'])
    .default('other'),
  enabled: z.boolean().default(true),
  smart_code: z.string().startsWith('HERA.'), // governing code
  applies_to: z.array(z.string()).min(1), // txn smart codes or line types
  conditions: z.record(z.any()).default({}), // JSON condition tree
  mappings: z.array(Mapping).min(1), // at least one mapping
  last_run_at: z.string().optional(), // ISO string
  version: z
    .string()
    .regex(/^v\d+$/)
    .default('v1'),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
})

export type PostingRule = z.infer<typeof PostingRule>
export type Mapping = z.infer<typeof Mapping>
