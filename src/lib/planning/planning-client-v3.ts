/**
 * HERA Finance DNA v3.3: Dynamic Planning & Forecasting Client SDK
 * 
 * TypeScript client for dynamic planning and forecasting with AI-driven
 * insights, rolling horizon planning, and complete audit trail.
 * 
 * Smart Code: HERA.PLAN.CLIENT.SDK.V3
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchV2Json, apiV2 } from '@/lib/client/fetchV2'

// ============================================================================
// Type Definitions
// ============================================================================

export type PlanType = 'BUDGET' | 'FORECAST' | 'ROLLING_FORECAST'
export type PlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'REFRESHED'
export type ApprovalAction = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'
export type VarianceCategory = 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK'
export type FinancialCategory = 'REVENUE' | 'COST' | 'OTHER'

export interface PlanGenerationRequest {
  plan_type: PlanType
  horizon_months?: number
  driver_policy?: Record<string, any>
  plan_metadata?: Record<string, any>
  dry_run?: boolean
}

export interface PlanGenerationResult {
  success: boolean
  run_id: string
  plan_entity_id: string
  plan_type: PlanType
  plan_version: number
  period_start: string
  period_end: string
  plan_lines_generated: number
  processing_time_ms: number
  drivers_applied: number
  ai_insights_used: number
  forecast_accuracy_mape: number
  approval_required: boolean
  variance_guardrails: Record<string, any>
  smart_code: string
}

export interface PlanRefreshRequest {
  plan_id: string
  refresh_horizon_months?: number
  auto_approve_threshold_pct?: number
  include_ai_adjustments?: boolean
  dry_run?: boolean
}

export interface PlanRefreshResult {
  success: boolean
  refresh_run_id: string
  plan_id: string
  refresh_summary: {
    refresh_period_start: string
    refresh_period_end: string
    original_plan_type: PlanType
    lines_refreshed: number
    significant_changes: number
    ai_adjustments_applied: number
    approval_required: boolean
    trend_analysis: Record<string, any>
    policy_checks: Record<string, any>
    processing_time_ms: number
    refresh_quality: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  approval_required: boolean
  dry_run: boolean
  smart_code: string
}

export interface PlanVarianceRequest {
  plan_id: string
  actual_period: string
  variance_threshold_pct?: number
  include_ai_explanation?: boolean
}

export interface PlanVarianceResult {
  success: boolean
  variance_run_id: string
  plan_id: string
  actual_period: string
  variance_summary: {
    total_plan_amount: number
    total_actual_amount: number
    total_variance_amount: number
    total_variance_pct: number
    plan_lines_analyzed: number
    significant_variances: number
    variance_threshold_pct: number
    period: string
    analysis_quality: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  ai_explanations: Array<{
    variance_pattern: string
    gl_account: string
    profit_center: string
    variance_pct: number
    variance_amount: number
    line_type: string
    explanation: string
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    smart_code: string
  }>
  processing_time_ms: number
  smart_code: string
}

export interface PlanApprovalRequest {
  plan_id: string
  approval_action: ApprovalAction
  approval_comments?: string
  override_policy?: boolean
}

export interface PlanApprovalResult {
  success: boolean
  approval_run_id: string
  plan_id: string
  approval_action: ApprovalAction
  approval_level: number
  required_approvals: number
  approval_complete: boolean
  new_plan_status: PlanStatus
  processing_time_ms: number
  smart_code: string
}

export interface PlanActualFact {
  org_id: string
  plan_entity_id: string
  period: string
  gl_account_id: string
  profit_center_id?: string
  cost_center_id?: string
  product_id?: string
  customer_id?: string
  plan_type: PlanType
  plan_version: number
  line_type: string
  driver_basis: string
  data_quality: 'HIGH' | 'MEDIUM' | 'LOW'
  plan_status: PlanStatus
  gl_account_name: string
  gl_account_code: string
  account_type: string
  ifrs_classification: string
  profit_center_name?: string
  cost_center_name?: string
  product_name?: string
  customer_name?: string
  plan_amount: number
  actual_amount: number
  variance_amount: number
  variance_pct: number
  is_significant_variance: boolean
  revenue_achievement_pct?: number
  cost_efficiency_pct?: number
  gross_margin_aed?: number
  gross_margin_pct?: number
  quantity?: number
  unit_cost_aed?: number
  analysis_quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_ACTUAL'
  financial_category: FinancialCategory
  variance_category: VarianceCategory
  period_year: number
  period_month: number
  period_quarter: number
  fact_last_updated: string
}

export interface PlanDashboardSummary {
  org_id: string
  period: string
  total_plans: number
  active_budgets: number
  pending_approvals: number
  total_plan_amount: number
  total_actual_amount: number
  total_variance_amount: number
  total_variance_pct: number
  significant_variances: number
  revenue_achievement_pct: number
  cost_efficiency_pct: number
  last_refresh_date?: string
  next_refresh_due?: string
}

export interface PlanQuery {
  org_id?: string
  plan_type?: PlanType
  period?: string
  status?: PlanStatus
  limit?: number
  offset?: number
}

export interface VarianceQuery {
  org_id?: string
  plan_id?: string
  period?: string
  variance_category?: VarianceCategory
  significant_only?: boolean
  limit?: number
  offset?: number
}

// ============================================================================
// API Client Class
// ============================================================================

export class PlanningClient {
  constructor(private organizationId: string) {}

  // Plan Generation
  async generatePlan(request: PlanGenerationRequest): Promise<PlanGenerationResult> {
    const response = await apiV2.post('planning/generate', {
      ...request,
      organization_id: this.organizationId
    })
    return response.data
  }

  // Plan Refresh
  async refreshPlan(request: PlanRefreshRequest): Promise<PlanRefreshResult> {
    const response = await apiV2.post('planning/refresh', {
      ...request,
      organization_id: this.organizationId
    })
    return response.data
  }

  // Variance Analysis
  async analyzePlanVariance(request: PlanVarianceRequest): Promise<PlanVarianceResult> {
    const response = await apiV2.post('planning/variance', {
      ...request,
      organization_id: this.organizationId
    })
    return response.data
  }

  // Plan Approval
  async approvePlan(request: PlanApprovalRequest): Promise<PlanApprovalResult> {
    const response = await apiV2.post('planning/approve', {
      ...request,
      organization_id: this.organizationId,
      approver_entity_id: this.organizationId // Would be actual user entity in real app
    })
    return response.data
  }

  // Query Plan vs Actual Facts
  async getPlanActualFacts(query: PlanQuery): Promise<{ data: PlanActualFact[], total: number }> {
    const response = await apiV2.get('planning/facts', {
      ...query,
      organization_id: this.organizationId
    })
    return response.data
  }

  // Get Variance Analysis
  async getVarianceAnalysis(query: VarianceQuery): Promise<{ data: PlanVarianceResult[], total: number }> {
    const response = await apiV2.get('planning/variance-analysis', {
      ...query,
      organization_id: this.organizationId
    })
    return response.data
  }

  // Dashboard Summary
  async getDashboardSummary(period?: string): Promise<PlanDashboardSummary> {
    const response = await apiV2.get('planning/dashboard', {
      organization_id: this.organizationId,
      period: period || getCurrentPeriod()
    })
    return response.data
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

// Plan Generation Hook
export function useGeneratePlan(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PlanGenerationRequest) => {
      const client = new PlanningClient(organizationId)
      return client.generatePlan(request)
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['planning', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['plan-facts', organizationId] })
    }
  })
}

// Plan Refresh Hook
export function useRefreshPlan(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PlanRefreshRequest) => {
      const client = new PlanningClient(organizationId)
      return client.refreshPlan(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['plan-facts', organizationId] })
    }
  })
}

// Variance Analysis Hook
export function useAnalyzePlanVariance(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PlanVarianceRequest) => {
      const client = new PlanningClient(organizationId)
      return client.analyzePlanVariance(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variance-analysis', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['plan-facts', organizationId] })
    }
  })
}

// Plan Approval Hook
export function useApprovePlan(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PlanApprovalRequest) => {
      const client = new PlanningClient(organizationId)
      return client.approvePlan(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['plan-approvals', organizationId] })
    }
  })
}

// Plan vs Actual Facts Query
export function usePlanActualFacts(organizationId: string, query: PlanQuery = {}) {
  return useQuery({
    queryKey: ['plan-facts', organizationId, query],
    queryFn: async () => {
      const client = new PlanningClient(organizationId)
      return client.getPlanActualFacts({ ...query, org_id: organizationId })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Variance Analysis Query
export function useVarianceAnalysis(organizationId: string, query: VarianceQuery = {}) {
  return useQuery({
    queryKey: ['variance-analysis', organizationId, query],
    queryFn: async () => {
      const client = new PlanningClient(organizationId)
      return client.getVarianceAnalysis({ ...query, org_id: organizationId })
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  })
}

// Dashboard Summary Query
export function usePlanningDashboard(organizationId: string, period?: string) {
  return useQuery({
    queryKey: ['planning-dashboard', organizationId, period],
    queryFn: async () => {
      const client = new PlanningClient(organizationId)
      return client.getDashboardSummary(period)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getCurrentPeriod(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM format
}

export function getNextPeriod(period: string, months: number = 1): string {
  const date = new Date(period + '-01')
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 7)
}

export function getPeriodRange(startPeriod: string, months: number): string[] {
  const periods: string[] = []
  for (let i = 0; i < months; i++) {
    periods.push(getNextPeriod(startPeriod, i))
  }
  return periods
}

export function formatVariancePct(variancePct: number): string {
  const sign = variancePct >= 0 ? '+' : ''
  return `${sign}${variancePct.toFixed(1)}%`
}

export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getVarianceColor(varianceCategory: VarianceCategory): string {
  switch (varianceCategory) {
    case 'FAVORABLE': return 'text-green-600'
    case 'UNFAVORABLE': return 'text-red-600'
    case 'ON_TRACK': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

export function getPlanStatusColor(status: PlanStatus): string {
  switch (status) {
    case 'APPROVED': return 'text-green-600 bg-green-100'
    case 'PENDING_APPROVAL': return 'text-yellow-600 bg-yellow-100'
    case 'REJECTED': return 'text-red-600 bg-red-100'
    case 'CHANGES_REQUESTED': return 'text-orange-600 bg-orange-100'
    case 'DRAFT': return 'text-gray-600 bg-gray-100'
    case 'REFRESHED': return 'text-blue-600 bg-blue-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export function getConfidenceLevel(accuracy: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (accuracy >= 0.9) return 'HIGH'
  if (accuracy >= 0.7) return 'MEDIUM'
  return 'LOW'
}

// ============================================================================
// Default Configuration
// ============================================================================

export const PLANNING_DEFAULTS = {
  HORIZON_MONTHS: 12,
  VARIANCE_THRESHOLD_PCT: 5.0,
  AUTO_APPROVE_THRESHOLD_PCT: 5.0,
  REFRESH_INTERVAL_HOURS: 24,
  AI_ADJUSTMENTS_ENABLED: true,
  DRY_RUN: false,
  PLAN_TYPES: ['BUDGET', 'FORECAST', 'ROLLING_FORECAST'] as PlanType[],
  APPROVAL_ACTIONS: ['APPROVE', 'REJECT', 'REQUEST_CHANGES'] as ApprovalAction[],
} as const

// ============================================================================
// Error Handling
// ============================================================================

export class PlanningError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'PlanningError'
  }
}

export function handlePlanningError(error: any): PlanningError {
  if (error.response?.data?.error_code) {
    return new PlanningError(
      error.response.data.error_message || 'Planning operation failed',
      error.response.data.error_code,
      error.response.data
    )
  }
  
  return new PlanningError(
    error.message || 'Unknown planning error',
    'UNKNOWN_ERROR',
    { originalError: error }
  )
}