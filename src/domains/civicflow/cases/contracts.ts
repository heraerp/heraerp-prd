/**
 * HERA CivicFlow Cases Contracts
 *
 * Single-source contracts for all cases-related types and schemas.
 * These contracts enforce type safety at both compile time and runtime.
 */

import { z } from 'zod'

// ==================== Smart Codes ====================
// Following HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION} pattern
export const CASE_SMART_CODES = {
  MASTER: 'HERA.CIVICFLOW.CASE.MASTER.v1',
  STATUS_CHANGE: 'HERA.CIVICFLOW.CASE.EVENT.STATUS_CHANGE.v1',
  PRIORITY_UPDATE: 'HERA.CIVICFLOW.CASE.EVENT.PRIORITY_UPDATE.v1',
  ASSIGNMENT: 'HERA.CIVICFLOW.CASE.EVENT.ASSIGNMENT.v1',
  COMMENT_ADDED: 'HERA.CIVICFLOW.CASE.EVENT.COMMENT_ADDED.v1',
  ATTACHMENT_ADDED: 'HERA.CIVICFLOW.CASE.EVENT.ATTACHMENT_ADDED.v1',
  ESCALATION: 'HERA.CIVICFLOW.CASE.EVENT.ESCALATION.v1',
  RESOLUTION: 'HERA.CIVICFLOW.CASE.EVENT.RESOLUTION.v1'
} as const

// ==================== Base Schemas ====================
const UuidSchema = z.string().uuid()
const IsoDateTimeSchema = z.string().datetime({ offset: true })
const NonEmptyStringSchema = z.string().min(1).trim()

// ==================== Enums ====================
export const CaseStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED'])

export const CasePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const CaseCategorySchema = z.enum([
  'SERVICE_REQUEST',
  'COMPLAINT',
  'INQUIRY',
  'APPLICATION',
  'APPEAL',
  'EMERGENCY',
  'OTHER'
])

// ==================== Case DTO Schemas ====================
export const CaseDTO = z.object({
  id: UuidSchema,
  organization_id: UuidSchema,
  case_number: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  status: CaseStatusSchema,
  priority: CasePrioritySchema,
  category: CaseCategorySchema.optional(),
  owner_entity_id: UuidSchema.nullable().optional(),
  constituent_entity_id: UuidSchema.nullable().optional(),
  program_entity_id: UuidSchema.nullable().optional(),
  opened_at: IsoDateTimeSchema,
  closed_at: IsoDateTimeSchema.nullable().optional(),
  due_date: IsoDateTimeSchema.nullable().optional(),
  sla_breach_at: IsoDateTimeSchema.nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  metadata: z.object({}).passthrough().default({}),
  dynamic: z.record(z.string(), z.unknown()).default({}),
  created_at: IsoDateTimeSchema.optional(),
  updated_at: IsoDateTimeSchema.optional()
})

export const CaseCreateDTO = z.object({
  organization_id: UuidSchema,
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  status: CaseStatusSchema.default('OPEN'),
  priority: CasePrioritySchema.default('MEDIUM'),
  category: CaseCategorySchema.optional(),
  owner_entity_id: UuidSchema.nullable().optional(),
  constituent_entity_id: UuidSchema.nullable().optional(),
  program_entity_id: UuidSchema.nullable().optional(),
  due_date: IsoDateTimeSchema.nullable().optional(),
  metadata: z.object({}).passthrough().optional(),
  dynamic: z.record(z.string(), z.unknown()).optional()
})

export const CaseUpdateDTO = z
  .object({
    title: NonEmptyStringSchema.optional(),
    description: z.string().optional(),
    status: CaseStatusSchema.optional(),
    priority: CasePrioritySchema.optional(),
    category: CaseCategorySchema.optional(),
    owner_entity_id: UuidSchema.nullable().optional(),
    constituent_entity_id: UuidSchema.nullable().optional(),
    program_entity_id: UuidSchema.nullable().optional(),
    due_date: IsoDateTimeSchema.nullable().optional(),
    resolution_notes: z.string().nullable().optional(),
    metadata: z.object({}).passthrough().optional(),
    dynamic: z.record(z.string(), z.unknown()).optional()
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })

// ==================== Query/Filter Schemas ====================
export const CaseQuery = z.object({
  // Search
  q: z.string().optional(),

  // Filters
  status: z.array(CaseStatusSchema).optional(),
  priority: z.array(CasePrioritySchema).optional(),
  category: z.array(CaseCategorySchema).optional(),
  owner_id: UuidSchema.optional(),
  constituent_id: UuidSchema.optional(),
  program_id: UuidSchema.optional(),

  // Date range
  from: IsoDateTimeSchema.optional(),
  to: IsoDateTimeSchema.optional(),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  page: z.number().int().min(1).optional(),

  // Sorting
  sort_by: z
    .enum([
      'case_number',
      'title',
      'status',
      'priority',
      'opened_at',
      'closed_at',
      'due_date',
      'updated_at'
    ])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// ==================== Response Schemas ====================
export const CaseListResponse = z.object({
  data: z.array(CaseDTO),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive(),
  cursor: z.string().nullable().optional(),
  has_more: z.boolean()
})

export const CaseSingleResponse = z.object({
  data: CaseDTO,
  related: z
    .object({
      owner: z.any().optional(),
      constituent: z.any().optional(),
      program: z.any().optional(),
      attachments: z.array(z.any()).optional(),
      comments: z.array(z.any()).optional()
    })
    .optional()
})

// ==================== Type Exports ====================
export type CaseDTO = z.infer<typeof CaseDTO>
export type CaseCreateDTO = z.infer<typeof CaseCreateDTO>
export type CaseUpdateDTO = z.infer<typeof CaseUpdateDTO>
export type CaseQuery = z.infer<typeof CaseQuery>
export type CaseStatus = z.infer<typeof CaseStatusSchema>
export type CasePriority = z.infer<typeof CasePrioritySchema>
export type CaseCategory = z.infer<typeof CaseCategorySchema>
export type CaseListResponse = z.infer<typeof CaseListResponse>
export type CaseSingleResponse = z.infer<typeof CaseSingleResponse>

// ==================== Helper Functions ====================
export function parsePagination(query: any): { limit: number; offset: number } {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100)
  const page = Math.max(parseInt(query.page) || 1, 1)
  const offset = (page - 1) * limit
  return { limit, offset }
}

export function parseQueryFilters(query: any): CaseQuery {
  const parsed = CaseQuery.safeParse(query)
  if (parsed.success) {
    return parsed.data
  }
  // Return defaults on parse failure
  return {
    limit: 20,
    sort_order: 'desc'
  }
}

export function buildCaseNumber(organizationId: string, sequenceNumber: number): string {
  const year = new Date().getFullYear()
  const paddedNumber = String(sequenceNumber).padStart(6, '0')
  const orgPrefix = organizationId.substring(0, 4).toUpperCase()
  return `CASE-${orgPrefix}-${year}-${paddedNumber}`
}
