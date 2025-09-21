import { z } from 'zod'

export const LeaveRequestSchema = z.object({
  staff_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  type: z.enum(['ANNUAL', 'SICK', 'UNPAID']).default('ANNUAL'),
  from: z.coerce.date(),
  to: z.coerce.date(),
  half_day_start: z.boolean().optional(),
  half_day_end: z.boolean().optional(),
  notes: z.string().max(1000).optional()
})

export const LeavePolicySchema = z.object({
  name: z.string().min(2),
  code: z
    .string()
    .regex(/^[A-Z0-9_-]+$/i)
    .optional(),
  accrual: z.object({
    accrual_method: z.enum(['ANNUAL', 'MONTHLY', 'DAILY']).default('ANNUAL'),
    annual_entitlement: z.number().min(0).max(60),
    carry_over_cap: z.number().min(0).max(60).default(0),
    prorate: z.boolean().default(true),
    min_notice_days: z.number().min(0).max(90).default(7)
  })
})

export const LeaveApprovalSchema = z.object({
  request_id: z.string().uuid(),
  approver_id: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().max(500).optional()
})

export const LeaveBalanceSchema = z.object({
  staff_id: z.string().uuid(),
  policy_id: z.string().uuid(),
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
  entitlement_days: z.number(),
  carried_over_days: z.number().default(0),
  accrued_days: z.number().default(0),
  taken_days: z.number().default(0),
  scheduled_days: z.number().default(0)
})

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>
export type LeavePolicy = z.infer<typeof LeavePolicySchema>
export type LeaveApproval = z.infer<typeof LeaveApprovalSchema>
export type LeaveBalance = z.infer<typeof LeaveBalanceSchema>
