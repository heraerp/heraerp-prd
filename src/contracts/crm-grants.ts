/**
 * HERA CRM Grants Contracts
 *
 * Single-source contracts for all grants-related types and schemas.
 * These contracts enforce type safety at both compile time and runtime.
 */

import { z } from 'zod'

import type { Brand } from '@/utils/exact'

import {
  BaseEntitySchema,
  CommonStatusSchema,
  DateTimeSchema,
  EntityIdSchema,
  OrganizationIdSchema,
  PaginatedResponseSchema,
  PaginationSchema,
  SmartCodeSchema,
  UuidSchema,
  nonEmptyString,
  nonNegativeNumber,
  positiveNumber
} from './base'

// Brand Types for Grants Domain
export type GrantApplicationId = Brand<string, 'GrantApplicationId'>
export type GrantProgramId = Brand<string, 'GrantProgramId'>
export type GrantRoundId = Brand<string, 'GrantRoundId'>
export type ConstituentId = Brand<string, 'ConstituentId'>

// Grant-specific Status Types
export const GrantApplicationStatusSchema = z.enum([
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'awarded',
  'closed'
])

export type GrantApplicationStatus = z.infer<typeof GrantApplicationStatusSchema>

export const GrantRoundStatusSchema = z.enum(['draft', 'open', 'closed', 'awarded', 'completed'])

export type GrantRoundStatus = z.infer<typeof GrantRoundStatusSchema>

// Grant Application Scoring Schema
export const GrantScoringSchema = z
  .object({
    need: z.number().int().min(1).max(10),
    impact: z.number().int().min(1).max(10),
    feasibility: z.number().int().min(1).max(10),
    total: z.number().int().min(3).max(30)
  })
  .strict()

export type GrantScoring = z.infer<typeof GrantScoringSchema>

// Workflow Step Schema
export const WorkflowStepSchema = z
  .object({
    step_name: nonEmptyString('Step name is required'),
    awaiting_input: z.boolean().default(false),
    assigned_to: UuidSchema.optional(),
    due_date: DateTimeSchema.optional()
  })
  .strict()

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>

// Applicant Type Schema
export const ApplicantTypeSchema = z.enum(['constituent', 'ps_org'])
export type ApplicantType = z.infer<typeof ApplicantTypeSchema>

export const ApplicantSchema = z
  .object({
    type: ApplicantTypeSchema,
    id: nonEmptyString('Applicant ID is required')
  })
  .strict()

export type Applicant = z.infer<typeof ApplicantSchema>

// Grant Program Schema
export const GrantProgramSchema = BaseEntitySchema.extend({
  code: nonEmptyString('Program code is required'),
  title: nonEmptyString('Program title is required'),
  description: z.string().optional(),
  budget: positiveNumber('Budget must be positive').optional(),
  sponsor_org_id: UuidSchema.optional(),
  tags: z.array(nonEmptyString()).default([]),
  status: CommonStatusSchema.default('active')
}).strict()

export type GrantProgram = z.infer<typeof GrantProgramSchema>

// Grant Round Schema
export const GrantRoundSchema = BaseEntitySchema.extend({
  program_id: UuidSchema.transform(val => val as GrantProgramId),
  round_code: nonEmptyString('Round code is required'),
  title: nonEmptyString('Round title is required'),
  description: z.string().optional(),
  budget: positiveNumber('Budget must be positive').optional(),
  max_award: positiveNumber('Max award must be positive').optional(),
  application_deadline: DateTimeSchema,
  start_date: DateTimeSchema,
  end_date: DateTimeSchema,
  status: GrantRoundStatusSchema.default('draft')
}).strict()

export type GrantRound = z.infer<typeof GrantRoundSchema>

// Grant Application Schema
export const GrantApplicationSchema = BaseEntitySchema.extend({
  applicant: ApplicantSchema,
  round_id: UuidSchema.transform(val => val as GrantRoundId),
  summary: z.string().optional(),
  amount_requested: positiveNumber('Requested amount must be positive').optional(),
  amount_awarded: positiveNumber('Awarded amount must be positive').optional(),
  status: GrantApplicationStatusSchema.default('draft'),
  tags: z.array(nonEmptyString()).default([]),
  scoring: GrantScoringSchema.optional(),
  pending_step: WorkflowStepSchema.optional(),
  rejection_reason: z.string().optional()
}).strict()

export type GrantApplication = z.infer<typeof GrantApplicationSchema>

// Create Grant Application Request Schema
export const CreateGrantApplicationRequestSchema = z
  .object({
    applicant: ApplicantSchema,
    round_id: nonEmptyString('Round ID is required'),
    summary: z.string().optional(),
    amount_requested: positiveNumber('Requested amount must be positive').optional(),
    tags: z.array(nonEmptyString()).default([]),
    start_run: z.boolean().default(false)
  })
  .strict()

export type CreateGrantApplicationRequest = z.infer<typeof CreateGrantApplicationRequestSchema>

// Grant Review Actions
export const GrantReviewActionSchema = z.enum(['approve', 'reject', 'award'])
export type GrantReviewAction = z.infer<typeof GrantReviewActionSchema>

// Review Grant Request Schema
export const ReviewGrantRequestSchema = z
  .object({
    action: GrantReviewActionSchema,
    amount_awarded: positiveNumber('Awarded amount must be positive').optional(),
    notes: z.string().default('')
  })
  .strict()

export type ReviewGrantRequest = z.infer<typeof ReviewGrantRequestSchema>

// Grant Application with Related Data Schema
export const GrantApplicationWithRelatedSchema = GrantApplicationSchema.extend({
  program: z
    .object({
      id: UuidSchema,
      code: nonEmptyString(),
      title: nonEmptyString()
    })
    .strict(),
  round: z
    .object({
      id: UuidSchema,
      round_code: nonEmptyString(),
      title: nonEmptyString(),
      application_deadline: DateTimeSchema
    })
    .strict(),
  applicant: z
    .object({
      id: UuidSchema,
      name: nonEmptyString(),
      type: ApplicantTypeSchema,
      contact_email: z.string().email().optional()
    })
    .strict()
}).strict()

export type GrantApplicationWithRelated = z.infer<typeof GrantApplicationWithRelatedSchema>

// Grant Filters Schema
export const GrantFiltersSchema = PaginationSchema.extend({
  q: z.string().optional(),
  status: GrantApplicationStatusSchema.optional(),
  tags: z.array(nonEmptyString()).optional(),
  round_id: UuidSchema.optional(),
  applicant_type: ApplicantTypeSchema.optional(),
  min_amount: nonNegativeNumber().optional(),
  max_amount: positiveNumber().optional(),
  date_from: DateTimeSchema.optional(),
  date_to: DateTimeSchema.optional()
}).strict()

export type GrantFilters = z.infer<typeof GrantFiltersSchema>

// Grant KPIs Schema
export const GrantKpisSchema = z
  .object({
    open_rounds: nonNegativeNumber(),
    in_review: nonNegativeNumber(),
    approval_rate: z.number().min(0).max(1),
    avg_award: nonNegativeNumber(),
    total_applications: nonNegativeNumber(),
    total_awarded: nonNegativeNumber()
  })
  .strict()

export type GrantKpis = z.infer<typeof GrantKpisSchema>

// Export Formats
export const ExportFormatSchema = z.enum(['csv', 'json', 'excel'])
export type ExportFormat = z.infer<typeof ExportFormatSchema>

// Export Request Schema
export const ExportGrantsRequestSchema = z
  .object({
    filters: GrantFiltersSchema,
    format: ExportFormatSchema,
    include_related: z.boolean().default(true)
  })
  .strict()

export type ExportGrantsRequest = z.infer<typeof ExportGrantsRequestSchema>

// Paginated Responses
export const PaginatedGrantApplicationsSchema = PaginatedResponseSchema(
  GrantApplicationWithRelatedSchema
)
export type PaginatedGrantApplications = z.infer<typeof PaginatedGrantApplicationsSchema>

export const PaginatedGrantProgramsSchema = PaginatedResponseSchema(GrantProgramSchema)
export type PaginatedGrantPrograms = z.infer<typeof PaginatedGrantProgramsSchema>

export const PaginatedGrantRoundsSchema = PaginatedResponseSchema(GrantRoundSchema)
export type PaginatedGrantRounds = z.infer<typeof PaginatedGrantRoundsSchema>

// Smart Codes for Grants Domain
export const GRANT_SMART_CODES = {
  PROGRAM: 'HERA.CIVIC.PROG.ENT.GOV.V1' as const,
  GRANT_ROUND: 'HERA.CIVIC.ROUND.ENT.FUNDING.V1' as const,
  GRANT_APPLICATION: 'HERA.CIVIC.GRANT.APP.SUBMISSION.V1' as const,
  CONSTITUENT: 'HERA.CIVIC.CONST.ENT.CITIZEN.V1' as const,
  PARTNER_ORG: 'HERA.CIVIC.ORG.ENT.PARTNER.V1' as const,
  APPLICATION_REVIEW: 'HERA.CIVIC.GRANT.TXN.REVIEW.V1' as const,
  APPLICATION_AWARD: 'HERA.CIVIC.GRANT.TXN.AWARD.V1' as const
} as const

// Validation Functions
export const validateGrantApplication = (data: unknown): GrantApplication =>
  GrantApplicationSchema.parse(data)

export const validateCreateGrantRequest = (data: unknown): CreateGrantApplicationRequest =>
  CreateGrantApplicationRequestSchema.parse(data)

export const validateReviewGrantRequest = (data: unknown): ReviewGrantRequest =>
  ReviewGrantRequestSchema.parse(data)

export const validateGrantFilters = (data: unknown): GrantFilters => GrantFiltersSchema.parse(data)

// Type Guards
export const isGrantApplicationStatus = (status: string): status is GrantApplicationStatus =>
  GrantApplicationStatusSchema.safeParse(status).success

export const isGrantReviewAction = (action: string): action is GrantReviewAction =>
  GrantReviewActionSchema.safeParse(action).success

export const isApplicantType = (type: string): type is ApplicantType =>
  ApplicantTypeSchema.safeParse(type).success

// Default Values
export const DEFAULT_GRANT_FILTERS: GrantFilters = {
  page: 1,
  page_size: 20
}

export const DEFAULT_GRANT_SCORING: GrantScoring = {
  need: 5,
  impact: 5,
  feasibility: 5,
  total: 15
}

// Error Messages
export const GRANT_ERROR_MESSAGES = {
  INVALID_APPLICANT_TYPE: 'Invalid applicant type. Must be "constituent" or "ps_org".',
  INVALID_STATUS: 'Invalid grant application status.',
  INVALID_REVIEW_ACTION: 'Invalid review action. Must be "approve", "reject", or "award".',
  AMOUNT_REQUIRED: 'Amount is required for award action.',
  APPLICATION_NOT_FOUND: 'Grant application not found.',
  ROUND_NOT_FOUND: 'Grant round not found.',
  PROGRAM_NOT_FOUND: 'Grant program not found.',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to grant application.'
} as const
