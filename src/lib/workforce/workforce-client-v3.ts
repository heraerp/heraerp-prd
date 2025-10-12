/**
 * HERA Finance DNA V3.6: Workforce Optimization Client SDK
 * 
 * TypeScript client for workforce optimization operations including
 * scheduling, timesheet processing, payroll accrual, and optimization
 * suggestions with application management.
 * 
 * Smart Code: HERA.WORK.CLIENT.SDK.V3
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { callRPC } from '@/lib/db/rpc-client'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type OptimizationObjective = 'cost_reduce' | 'efficiency_improve' | 'overtime_minimize' | 'coverage_optimize'
export type OpportunityType = 'OVERTIME_REDUCTION' | 'UTILIZATION_IMPROVEMENT' | 'CROSS_TRAINING' | 'SCHEDULE_EFFICIENCY'
export type WorkforceStatus = 'OPTIMIZED' | 'UNDERUTILIZED' | 'OVERWORKED' | 'NEEDS_OPTIMIZATION'
export type ApplicationStatus = 'PROCESSING' | 'VALIDATION_FAILED' | 'SAFETY_REVIEW_REQUIRED' | 'COMPLETED' | 'FAILED'

export interface ScheduleRunRequest {
  schedule_id: string
  period: string
  location_ids?: string[]
  objective?: OptimizationObjective
  locked?: boolean
}

export interface TimesheetPostRequest {
  employee_id: string
  period_date: string
  time_entries: TimeEntry[]
  approval_status?: string
  submitted_by?: string
}

export interface TimeEntry {
  start_time: string
  end_time: string
  break_minutes?: number
  location_id?: string
  role_id?: string
  task_description?: string
  entry_type?: string
}

export interface PayrollAccrualRequest {
  period_start: string
  period_end: string
  accrual_period?: string
  location_ids?: string[]
  employee_ids?: string[]
  include_benefits?: boolean
  include_taxes?: boolean
}

export interface OptimizationSuggestRequest {
  analysis_period?: string
  location_ids?: string[]
  objectives?: OptimizationObjective[]
  constraints?: OptimizationConstraints
}

export interface OptimizationConstraints {
  max_staff_change_pct?: number
  min_coverage_hours?: number
  max_overtime_pct?: number
  preserve_core_team?: boolean
}

export interface OptimizationApplyRequest {
  optimization_run_id: string
  selected_suggestions?: string[]
  implementation_date?: string
  approver_id?: string
  approval_notes?: string
}

export interface ScheduleRunResponse {
  success: boolean
  schedule_run_id: string
  schedule_id: string
  period: string
  organization_id: string
  processing_time_ms: number
  schedule_summary: {
    total_shifts_assigned: number
    employees_scheduled: number
    total_hours: number
    total_labor_cost: number
    overtime_hours: number
    average_hourly_rate: number
  }
  optimization_results: {
    objective: string
    cost_efficiency_score: number
    utilization_rate_pct: number
    overtime_rate_pct: number
  }
  guardrail_compliance: {
    total_checks: number
    violations_blocked: number
    compliance_rate_pct: number
    violations_detail: any[]
  }
  shifts_assigned: number
  employees_scheduled: number
  total_labor_cost: number
  smart_code: string
}

export interface TimesheetPostResponse {
  success: boolean
  timesheet_run_id: string
  employee_id: string
  period_date: string
  organization_id: string
  processing_time_ms: number
  timesheet_summary: {
    total_hours: number
    regular_hours: number
    overtime_hours: number
    total_pay: number
    entries_processed: number
  }
  schedule_variance: {
    scheduled_hours: number
    actual_hours: number
    variance_hours: number
    variance_pct: number
    variance_type: string
    efficiency_score: number
  }
  compliance_status: 'VIOLATIONS_FOUND' | 'COMPLIANT'
  violations_count: number
  approval_required: boolean
  smart_code: string
}

export interface PayrollAccrualResponse {
  success: boolean
  payroll_accrual_run_id: string
  period: string
  period_start: string
  period_end: string
  organization_id: string
  processing_time_ms: number
  accrual_summary: {
    employees_processed: number
    gl_entries_created: number
    total_labor_cost: number
    total_benefits_cost: number
    total_payroll_taxes: number
    total_accrued_amount: number
  }
  gl_impact: {
    entries_created: number
    balanced_entries: boolean
    total_debits: number
    total_credits: number
  }
  smart_code: string
}

export interface OptimizationSuggestResponse {
  success: boolean
  optimization_run_id: string
  analysis_period: string
  organization_id: string
  processing_time_ms: number
  optimization_summary: {
    employees_analyzed: number
    schedules_analyzed: number
    total_suggestions: number
    opportunities_identified: number
    potential_annual_savings: number
    implementation_complexity: number
  }
  suggestion_categories: {
    overtime_reduction: OptimizationSuggestion[]
    staffing_optimization: OptimizationSuggestion[]
    cross_training_opportunities: OptimizationSuggestion[]
    schedule_optimizations: OptimizationSuggestion[]
  }
  top_recommendations: OptimizationSuggestion[]
  smart_code: string
}

export interface OptimizationSuggestion {
  employee_id?: string
  employee_name?: string
  opportunity_type: OpportunityType
  recommended_action: string
  potential_savings_weekly?: number
  potential_value_increase?: number
  implementation_effort: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence_score: number
  current_overtime_hours?: number
  current_utilization_pct?: number
  current_skills_count?: number
  recommended_skills?: string[]
  template_name?: string
  current_avg_employees?: number
  current_avg_cost?: number
  potential_savings_per_shift?: number
}

export interface OptimizationApplyResponse {
  success: boolean
  application_run_id: string
  optimization_run_id: string
  organization_id: string
  processing_time_ms: number
  suggestions_applied: number
  suggestions_failed: number
  total_expected_savings: number
  implementation_date: string
  validation_errors: any[]
  safety_violations: any[]
  approval_status: {
    dual_approval_required: boolean
    controller_approved: boolean
    cfo_approved: boolean
    approval_count: number
    approver_role: string
    approver_name: string
    approval_notes: string
  }
  smart_code: string
}

export interface WorkforceOptimization {
  organization_id: string
  total_employees: number
  avg_hourly_rate: number
  avg_hours_per_employee: number
  avg_overtime_per_employee: number
  avg_utilization_rate: number
  total_labor_cost_30d: number
  avg_skills_per_employee: number
  high_utilization_employees: number
  low_utilization_employees: number
  high_overtime_employees: number
  low_skill_employees: number
  underutilization_rate_pct: number
  overtime_risk_rate_pct: number
  skill_gap_rate_pct: number
  optimization_run_id?: string
  latest_analysis_date?: string
  potential_annual_savings?: number
  employees_analyzed?: number
  total_suggestions?: number
  suggestion_categories?: any
  application_run_id?: string
  application_date?: string
  applied_expected_savings?: number
  suggestions_applied?: number
  suggestions_failed?: number
  application_status?: ApplicationStatus
  approval_status?: any
  latest_week_employees?: number
  latest_week_hours?: number
  latest_week_cost?: number
  latest_week_avg_rate?: number
  cost_per_hour_latest_week?: number
  latest_month_payroll?: number
  latest_month_employees_paid?: number
  latest_month_labor_cost?: number
  latest_month_employer_contributions?: number
  cost_per_employee_30d?: number
  workforce_efficiency_score: number
  optimization_potential_pct?: number
  workforce_status: WorkforceStatus
  analysis_year: number
  analysis_month: number
  analysis_quarter: string
  view_generated_at: string
  smart_code: string
}

// ============================================================================
// Workforce Client Class
// ============================================================================

export class WorkforceClient {
  constructor(private organizationId: string) {}

  // Schedule workforce with AI optimization
  async scheduleRun(request: ScheduleRunRequest): Promise<ScheduleRunResponse> {
    const result = await callRPC('hera_work_sched_run_V3', {
      p_org_id: this.organizationId,
      p_actor_id: null, // Will be set by middleware
      p_schedule_meta: {
        schedule_id: request.schedule_id,
        period: request.period,
        location_ids: request.location_ids || [],
        objective: request.objective || 'cost_minimize',
        locked: request.locked || false
      }
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Schedule run failed')
    }

    return result
  }

  // Post employee timesheet data
  async postTimesheet(request: TimesheetPostRequest): Promise<TimesheetPostResponse> {
    const result = await callRPC('hera_work_time_post_V3', {
      p_org_id: this.organizationId,
      p_actor_id: null, // Will be set by middleware
      p_timesheet_data: {
        employee_id: request.employee_id,
        period_date: request.period_date,
        time_entries: request.time_entries,
        approval_status: request.approval_status || 'SUBMITTED',
        submitted_by: request.submitted_by
      }
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Timesheet posting failed')
    }

    return result
  }

  // Accrue payroll to GL accounts
  async accruePayroll(request: PayrollAccrualRequest): Promise<PayrollAccrualResponse> {
    const result = await callRPC('hera_work_payroll_accrue_V3', {
      p_org_id: this.organizationId,
      p_actor_id: null, // Will be set by middleware
      p_accrual_meta: {
        period_start: request.period_start,
        period_end: request.period_end,
        accrual_period: request.accrual_period,
        location_ids: request.location_ids || [],
        employee_ids: request.employee_ids || [],
        include_benefits: request.include_benefits !== false,
        include_taxes: request.include_taxes !== false
      }
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Payroll accrual failed')
    }

    return result
  }

  // Generate optimization suggestions
  async suggestOptimizations(request: OptimizationSuggestRequest): Promise<OptimizationSuggestResponse> {
    const result = await callRPC('hera_work_opt_suggest_V3', {
      p_org_id: this.organizationId,
      p_actor_id: null, // Will be set by middleware
      p_optimization_meta: {
        analysis_period: request.analysis_period,
        location_ids: request.location_ids || [],
        objectives: request.objectives || ['cost_reduce', 'efficiency_improve'],
        constraints: request.constraints || {}
      }
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Optimization suggestion failed')
    }

    return result
  }

  // Apply optimization suggestions
  async applyOptimizations(request: OptimizationApplyRequest): Promise<OptimizationApplyResponse> {
    const result = await callRPC('hera_work_opt_apply_V3', {
      p_org_id: this.organizationId,
      p_actor_id: null, // Will be set by middleware
      p_application_meta: {
        optimization_run_id: request.optimization_run_id,
        selected_suggestions: request.selected_suggestions || [],
        implementation_date: request.implementation_date,
        approver_id: request.approver_id,
        approval_notes: request.approval_notes
      }
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Optimization application failed')
    }

    return result
  }

  // Query workforce optimization data
  async getOptimizationData(): Promise<WorkforceOptimization | null> {
    const result = await callRPC('hera_execute_query', {
      query: `
        SELECT * FROM vw_workforce_optimization_V3 
        WHERE organization_id = $1
      `,
      params: [this.organizationId]
    }, { mode: 'service' })

    return result.data?.[0] || null
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

// Schedule run hook
export function useScheduleRun(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ScheduleRunRequest) => {
      const client = new WorkforceClient(organizationId)
      return client.scheduleRun(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['schedules', organizationId] })
    }
  })
}

// Timesheet posting hook
export function useTimesheetPost(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: TimesheetPostRequest) => {
      const client = new WorkforceClient(organizationId)
      return client.postTimesheet(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['timesheets', organizationId] })
    }
  })
}

// Payroll accrual hook
export function usePayrollAccrual(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PayrollAccrualRequest) => {
      const client = new WorkforceClient(organizationId)
      return client.accruePayroll(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['payroll', organizationId] })
    }
  })
}

// Optimization suggestion hook
export function useOptimizationSuggest(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: OptimizationSuggestRequest) => {
      const client = new WorkforceClient(organizationId)
      return client.suggestOptimizations(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforceOptimization', organizationId] })
    }
  })
}

// Optimization application hook
export function useOptimizationApply(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: OptimizationApplyRequest) => {
      const client = new WorkforceClient(organizationId)
      return client.applyOptimizations(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforceOptimization', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['workforce', organizationId] })
    }
  })
}

// Workforce optimization data query hook
export function useWorkforceOptimization(organizationId: string) {
  return useQuery({
    queryKey: ['workforceOptimization', organizationId],
    queryFn: async () => {
      const client = new WorkforceClient(organizationId)
      return client.getOptimizationData()
    },
    enabled: !!organizationId
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatOpportunityType(type: OpportunityType): string {
  const typeMap = {
    'OVERTIME_REDUCTION': 'Overtime Reduction',
    'UTILIZATION_IMPROVEMENT': 'Utilization Improvement',
    'CROSS_TRAINING': 'Cross Training',
    'SCHEDULE_EFFICIENCY': 'Schedule Efficiency'
  }
  return typeMap[type] || type
}

export function formatWorkforceStatus(status: WorkforceStatus): string {
  const statusMap = {
    'OPTIMIZED': 'Optimized',
    'UNDERUTILIZED': 'Underutilized',
    'OVERWORKED': 'Overworked',
    'NEEDS_OPTIMIZATION': 'Needs Optimization'
  }
  return statusMap[status] || status
}

export function getStatusColor(status: WorkforceStatus): string {
  switch (status) {
    case 'OPTIMIZED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'UNDERUTILIZED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'OVERWORKED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'NEEDS_OPTIMIZATION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export function getOpportunityColor(type: OpportunityType): string {
  switch (type) {
    case 'OVERTIME_REDUCTION': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'UTILIZATION_IMPROVEMENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'CROSS_TRAINING': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case 'SCHEDULE_EFFICIENCY': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return `${wholeHours}h ${minutes}m`
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Smart code constants
export const WORKFORCE_SMART_CODES = {
  SCHEDULE_RUN: 'HERA.WORK.SCHED.RUN.V3',
  TIMESHEET_POST: 'HERA.WORK.TIME.TXN.POST.V3',
  PAYROLL_ACCRUE: 'HERA.WORK.PAYROLL.ACCRUE.V3',
  OPTIMIZATION_SUGGEST: 'HERA.WORK.OPT.SUGGEST.V3',
  OPTIMIZATION_APPLY: 'HERA.WORK.OPT.APPLY.V3'
} as const

// Default configuration values
export const WORKFORCE_DEFAULTS = {
  ANALYSIS_PERIOD: getCurrentPeriod(),
  MAX_OVERTIME_HOURS: 5,
  TARGET_UTILIZATION_PCT: 85,
  MIN_SKILLS_PER_EMPLOYEE: 3,
  IMPLEMENTATION_LEAD_DAYS: 7,
  DUAL_APPROVAL_REQUIRED: true,
  BENEFITS_RATE_PCT: 25,
  PAYROLL_TAX_RATE_PCT: 7.65
} as const