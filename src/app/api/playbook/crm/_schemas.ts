import { z } from 'zod'

export const CRMQuerySchema = z.object({
  orgId: z.string().uuid().or(z.string().min(8)),
  from: z.string().optional(),
  to: z.string().optional(),
  // Accept stage as single or multiple and normalize to array
  stage: z.preprocess(v => (Array.isArray(v) ? v : v ? [v] : []), z.array(z.string()).optional()),
  owner: z.preprocess(v => (Array.isArray(v) ? v : v ? [v] : []), z.array(z.string()).optional()),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
})

export const OrgIdQuerySchema = z.object({ orgId: z.string().uuid().or(z.string().min(8)) })

export const LookupItemSchema = z.object({ id: z.string().min(1), name: z.string().min(1) })
export const LookupListSchema = z.object({ items: z.array(LookupItemSchema) })

// Write payload schemas
export const BaseWriteSchema = z.object({
  orgId: z.string().uuid().or(z.string().min(8)),
  smart_code: z.string().regex(/^HERA\.CRM\.[A-Z0-9_.]+\.[Vv][0-9]+$/),
  idempotency_key: z.string().min(8),
  actor_user_id: z.string().uuid().or(z.string().min(8))
})

export const LeadCreateSchema = BaseWriteSchema.extend({
  lead_name: z.string().min(1),
  source: z.string().optional(),
  owner_id: z.string().optional()
})

export const LeadQualifySchema = BaseWriteSchema.extend({
  lead_id: z.string().min(8),
  opportunity_name: z.string().min(1),
  amount: z.number().min(0).optional(),
  close_date: z.string().optional()
})

export const OppUpdateStageSchema = BaseWriteSchema.extend({
  opportunity_id: z.string().min(8),
  from_stage: z.string().optional(),
  to_stage: z.string().min(1)
})

export const OppUpdateOwnerSchema = BaseWriteSchema.extend({
  opportunity_id: z.string().min(8),
  owner_id: z.string().min(8)
})

export const OppUpdateProbabilitySchema = BaseWriteSchema.extend({
  opportunity_id: z.string().min(8),
  probability: z.number().min(0).max(100)
})

export const ActivityLogSchema = BaseWriteSchema.extend({
  activity_type: z.enum(['call', 'email', 'meeting', 'task']),
  subject: z.string().min(1),
  opportunity_id: z.string().optional(),
  account_id: z.string().optional(),
  contact_id: z.string().optional(),
  due_at: z.string().optional(),
  status: z.enum(['completed', 'pending', 'overdue']).optional()
})

export const OpportunitySchema = z.object({
  id: z.string(),
  entity_name: z.string(),
  amount: z.number(),
  currency: z.string().optional(),
  stage: z.string(),
  probability: z.number().optional(),
  close_date: z.string().optional(),
  owner_id: z.string().optional(),
  account_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const LeadSchema = z.object({
  id: z.string(),
  entity_name: z.string(),
  owner_id: z.string().optional(),
  stage: z.string().optional(),
  source: z.string().optional(),
  amount: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const ActivitySchema = z.object({
  id: z.string(),
  activity_type: z.enum(['call', 'email', 'meeting', 'task']),
  subject: z.string(),
  assigned_to: z.string().optional(),
  due_at: z.string().optional(),
  status: z.enum(['completed', 'pending', 'overdue']),
  account_id: z.string().optional(),
  contact_id: z.string().optional(),
  created_at: z.string()
})

export const PageResult = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), page: z.number(), pageSize: z.number(), total: z.number() })

// Pipeline / Funnel response schemas
export const PipelineStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
  amount: z.number()
})
export const PipelineSummarySchema = z.object({
  byStage: z.array(PipelineStageSchema),
  totals: z.object({ count: z.number(), amount: z.number() })
})

export const FunnelStageSchema = z.object({
  name: z.string(),
  count: z.number(),
  rate: z.number().optional()
})
export const FunnelSchema = z.object({
  stages: z.array(FunnelStageSchema),
  conversionRate: z.number()
})

// Accounts
export const AccountSchema = z.object({
  id: z.string(),
  entity_name: z.string(),
  industry: z.string().optional(),
  segment: z.string().optional(),
  website: z.string().optional(),
  revenue: z.number().optional(),
  employees: z.number().optional(),
  status: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const AccountCreateSchema = BaseWriteSchema.extend({
  account_name: z.string().min(1),
  industry: z.string().optional(),
  segment: z.string().optional(),
  website: z.string().optional(),
  revenue: z.number().optional(),
  employees: z.number().optional(),
  status: z.string().optional()
})

export const AccountUpdateSchema = BaseWriteSchema.extend({
  account_id: z.string().min(8),
  account_name: z.string().optional(),
  industry: z.string().optional(),
  segment: z.string().optional(),
  website: z.string().optional(),
  revenue: z.number().optional(),
  employees: z.number().optional(),
  status: z.string().optional()
})
