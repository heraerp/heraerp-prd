/**
 * HERA Finance DNA v3.5: AI Policy Tuning Client SDK
 * 
 * TypeScript client for autonomous policy tuning operations including
 * monitoring, suggesting, applying, reverting, and effectiveness analysis.
 * 
 * Smart Code: HERA.AI.POLICY.CLIENT.SDK.V3
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { callRPC } from '@/lib/server/index'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type PolicyCategory = 'ALLOCATION_ASSESSMENT' | 'FORECASTING' | 'GUARDRAILS' | 'CONSOLIDATION'
export type PolicyTarget = 'ALLOC_ASSESS_V2' | 'FORECAST_REFRESH_V3' | 'COA_DIM_REQUIREMENTS_V2' | 'CONSOLIDATION_V3'
export type VariancePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL'
export type VarianceStatus = 'URGENT_ACTION_REQUIRED' | 'THRESHOLD_EXCEEDED' | 'TRENDING_NEGATIVE' | 'IMPROVING' | 'WITHIN_BOUNDS'
export type EffectivenessRating = 'HIGHLY_EFFECTIVE' | 'EFFECTIVE' | 'MODERATELY_EFFECTIVE' | 'MINIMALLY_EFFECTIVE' | 'INEFFECTIVE'
export type ValidationStatus = 'PROVEN_SUCCESS' | 'STATISTICALLY_VALIDATED' | 'BUSINESS_VALIDATED' | 'OPERATIONALLY_VALIDATED' | 'POSITIVE_INDICATORS' | 'INCONCLUSIVE'
export type RecommendationAction = 'EXPAND_USAGE' | 'CONTINUE_MONITORING' | 'ADJUST_PARAMETERS' | 'CONSIDER_DISCONTINUATION' | 'INSUFFICIENT_DATA'

export interface PolicyMonitorRequest {
  period: string
  actor_id?: string
}

export interface PolicySuggestRequest {
  period: string
  targets: PolicyTarget[]
  actor_id?: string
}

export interface PolicyApplyRequest {
  suggestion_run_id: string
  approver_id?: string
}

export interface PolicyRevertRequest {
  apply_run_id: string
  actor_id?: string
}

export interface PolicyEffectivenessRequest {
  policy_id: string
  periods?: number
}

export interface PolicyMonitorResponse {
  success: boolean
  monitoring_run_id: string
  period: string
  organization_id: string
  processing_time_ms: number
  monitoring_summary: {
    total_candidates: number
    allocation_candidates: number
    forecast_candidates: number
    guardrail_candidates: number
    consolidation_candidates: number
    processing_time_ms: number
    period_analyzed: string
  }
  total_candidates: number
  smart_code: string
}

export interface PolicySuggestResponse {
  success: boolean
  suggestion_run_id: string
  period: string
  organization_id: string
  processing_time_ms: number
  suggestion_summary: {
    total_suggestions: number
    simulations_run: number
    targets_analyzed: number
    processing_time_ms: number
    period: string
    source_monitor_run: string
  }
  total_suggestions: number
  simulations_run: number
  smart_code: string
}

export interface PolicyApplyResponse {
  success: boolean
  apply_run_id: string
  suggestion_run_id: string
  organization_id: string
  processing_time_ms: number
  policies_updated: number
  changes_applied: any[]
  validation_errors: any[]
  safety_violations: any[]
  approval_status: {
    dual_approval_required: boolean
    controller_approved: boolean
    cfo_approved: boolean
    approval_count: number
  }
  smart_code: string
}

export interface PolicyRevertResponse {
  success: boolean
  revert_run_id: string
  apply_run_id: string
  organization_id: string
  processing_time_ms: number
  policies_reverted: number
  reversions_applied: any[]
  validation_errors: any[]
  revert_summary: {
    revert_allowed: boolean
    apply_age_days: number
    max_revert_days: number
    reverted_by: string
    reverted_at: string
  }
  smart_code: string
}

export interface PolicyEffectivenessResponse {
  success: boolean
  effectiveness_run_id: string
  policy_id: string
  organization_id: string
  processing_time_ms: number
  effectiveness_summary: any
  key_metrics: {
    variance_improvement_pct: number
    accuracy_improvement_pct: number
    financial_impact: number
    statistical_significance: boolean
    periods_analyzed: number
  }
  smart_code: string
}

export interface PolicyVariance {
  organization_id: string
  period: string
  profit_center_code: string
  product_code: string
  region_code: string
  policy_category: PolicyCategory
  policy_id: string
  allocation_driver: string
  allocation_basis: string
  variance_amount: number
  variance_pct: number
  variance_threshold_pct: number
  exceeds_threshold: boolean
  variance_3m_avg: number
  prior_period_variance_pct: number
  variance_trend: 'WORSENING' | 'IMPROVING' | 'STABLE' | 'NO_HISTORY'
  variance_amount_rank: number
  variance_pct_rank: number
  variance_severity_score: number
  variance_priority: VariancePriority
  variance_status: VarianceStatus
  policy_application_phase: 'NO_POLICY_APPLIED' | 'PRE_POLICY' | 'POST_POLICY' | 'UNKNOWN'
  apply_run_id?: string
  policy_applied_at?: string
  policy_change_pct?: number
  policy_confidence?: number
  policy_explanation?: string
  policy_effectiveness_positive: boolean
  days_since_policy_applied?: number
  fiscal_year: number
  fiscal_month: number
  period_date: string
  variance_recorded_at: string
}

export interface PolicyEffectiveness {
  effectiveness_run_id: string
  organization_id: string
  policy_id: string
  policy_type: PolicyCategory
  analysis_date: string
  periods_analyzed: number
  analysis_start_date: string
  analysis_end_date: string
  policy_apply_date?: string
  apply_runs_found: number
  days_since_application?: number
  analysis_duration_days?: number
  variance_improvement_pct?: number
  accuracy_improvement_pct?: number
  financial_impact?: number
  financial_impact_amount?: number
  statistical_significance: boolean
  confidence_interval_pct?: number
  improvement_verified: boolean
  roi_positive: boolean
  total_applications: number
  first_application_date?: string
  latest_application_date?: string
  historical_avg_change_pct?: number
  historical_avg_confidence?: number
  successful_applications: number
  failed_applications: number
  success_rate_pct: number
  total_variance_observations: number
  baseline_avg_variance_pct?: number
  baseline_variance_stddev?: number
  baseline_median_variance_pct?: number
  baseline_threshold_violations: number
  baseline_improving_periods: number
  baseline_worsening_periods: number
  variance_improvement_ratio?: number
  effectiveness_rank: number
  financial_impact_rank: number
  effectiveness_score: number
  estimated_roi?: number
  effectiveness_rating: EffectivenessRating
  validation_status: ValidationStatus
  recommendation: RecommendationAction
  recommendation_confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW'
  pre_metrics: any
  post_metrics: any
  operational_improvements: any
  latest_variance_date?: string
}

export interface PolicyTuningBounds {
  max_pct_change: number
  cooldown_days: number
  require_dual_approval: boolean
  allowed_targets: PolicyTarget[]
  blocked_fields: string[]
}

export interface PolicySafetyConfig {
  must_simulate: boolean
  min_confidence: number
  max_expected_variance_delta_pct: number
}

// ============================================================================
// Policy Tuning Client Class
// ============================================================================

export class PolicyTuningClient {
  constructor(private organizationId: string) {}

  // Monitor policy drift and identify candidates
  async monitor(request: PolicyMonitorRequest): Promise<PolicyMonitorResponse> {
    const result = await callRPC('hera_ai_policy_monitor_v3', {
      p_org_id: this.organizationId,
      p_period: request.period,
      p_actor_id: request.actor_id || null
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Policy monitoring failed')
    }

    return result
  }

  // Generate policy suggestions with simulation
  async suggest(request: PolicySuggestRequest): Promise<PolicySuggestResponse> {
    const result = await callRPC('hera_ai_policy_suggest_v3', {
      p_org_id: this.organizationId,
      p_period: request.period,
      p_targets: request.targets,
      p_actor_id: request.actor_id || null
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Policy suggestion failed')
    }

    return result
  }

  // Apply policy suggestions with validation
  async apply(request: PolicyApplyRequest): Promise<PolicyApplyResponse> {
    const result = await callRPC('hera_ai_policy_apply_v3', {
      p_org_id: this.organizationId,
      p_suggestion_run_id: request.suggestion_run_id,
      p_approver_id: request.approver_id || null
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Policy application failed')
    }

    return result
  }

  // Revert applied policy changes
  async revert(request: PolicyRevertRequest): Promise<PolicyRevertResponse> {
    const result = await callRPC('hera_ai_policy_revert_v3', {
      p_org_id: this.organizationId,
      p_apply_run_id: request.apply_run_id,
      p_actor_id: request.actor_id || null
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Policy reversion failed')
    }

    return result
  }

  // Measure policy effectiveness
  async effectiveness(request: PolicyEffectivenessRequest): Promise<PolicyEffectivenessResponse> {
    const result = await callRPC('hera_ai_policy_effectiveness_v3', {
      p_org_id: this.organizationId,
      p_policy_id: request.policy_id,
      p_periods: request.periods || 6
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Policy effectiveness analysis failed')
    }

    return result
  }

  // Query policy variances
  async getVariances(options?: {
    period?: string
    policy_id?: string
    priority?: VariancePriority
    status?: VarianceStatus
    limit?: number
  }): Promise<PolicyVariance[]> {
    let query = `
      SELECT * FROM vw_policy_variance_v3 
      WHERE organization_id = $1
    `
    const params: any[] = [this.organizationId]
    let paramIndex = 2

    if (options?.period) {
      query += ` AND period = $${paramIndex}`
      params.push(options.period)
      paramIndex++
    }

    if (options?.policy_id) {
      query += ` AND policy_id = $${paramIndex}`
      params.push(options.policy_id)
      paramIndex++
    }

    if (options?.priority) {
      query += ` AND variance_priority = $${paramIndex}`
      params.push(options.priority)
      paramIndex++
    }

    if (options?.status) {
      query += ` AND variance_status = $${paramIndex}`
      params.push(options.status)
      paramIndex++
    }

    query += ` ORDER BY variance_severity_score DESC, period DESC`

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`
      params.push(options.limit)
    }

    const result = await callRPC('hera_execute_query', {
      query,
      params
    }, { mode: 'service' })

    return result.data || []
  }

  // Query policy effectiveness data
  async getEffectiveness(options?: {
    policy_id?: string
    policy_type?: PolicyCategory
    rating?: EffectivenessRating
    validation_status?: ValidationStatus
    limit?: number
  }): Promise<PolicyEffectiveness[]> {
    let query = `
      SELECT * FROM vw_policy_effectiveness_v3 
      WHERE organization_id = $1
    `
    const params: any[] = [this.organizationId]
    let paramIndex = 2

    if (options?.policy_id) {
      query += ` AND policy_id = $${paramIndex}`
      params.push(options.policy_id)
      paramIndex++
    }

    if (options?.policy_type) {
      query += ` AND policy_type = $${paramIndex}`
      params.push(options.policy_type)
      paramIndex++
    }

    if (options?.rating) {
      query += ` AND effectiveness_rating = $${paramIndex}`
      params.push(options.rating)
      paramIndex++
    }

    if (options?.validation_status) {
      query += ` AND validation_status = $${paramIndex}`
      params.push(options.validation_status)
      paramIndex++
    }

    query += ` ORDER BY effectiveness_score DESC, analysis_date DESC`

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`
      params.push(options.limit)
    }

    const result = await callRPC('hera_execute_query', {
      query,
      params
    }, { mode: 'service' })

    return result.data || []
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

// Policy monitoring hook
export function usePolicyMonitor(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PolicyMonitorRequest) => {
      const client = new PolicyTuningClient(organizationId)
      return client.monitor(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policyTuning', organizationId] })
    }
  })
}

// Policy suggestion hook
export function usePolicySuggest(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PolicySuggestRequest) => {
      const client = new PolicyTuningClient(organizationId)
      return client.suggest(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policyTuning', organizationId] })
    }
  })
}

// Policy application hook
export function usePolicyApply(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PolicyApplyRequest) => {
      const client = new PolicyTuningClient(organizationId)
      return client.apply(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policyTuning', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['policyVariances', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['policyEffectiveness', organizationId] })
    }
  })
}

// Policy reversion hook
export function usePolicyRevert(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PolicyRevertRequest) => {
      const client = new PolicyTuningClient(organizationId)
      return client.revert(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policyTuning', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['policyVariances', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['policyEffectiveness', organizationId] })
    }
  })
}

// Policy effectiveness analysis hook
export function usePolicyEffectiveness(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: PolicyEffectivenessRequest) => {
      const client = new PolicyTuningClient(organizationId)
      return client.effectiveness(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policyEffectiveness', organizationId] })
    }
  })
}

// Policy variances query hook
export function usePolicyVariances(
  organizationId: string,
  options?: Parameters<PolicyTuningClient['getVariances']>[0]
) {
  return useQuery({
    queryKey: ['policyVariances', organizationId, options],
    queryFn: async () => {
      const client = new PolicyTuningClient(organizationId)
      return client.getVariances(options)
    },
    enabled: !!organizationId
  })
}

// Policy effectiveness query hook
export function usePolicyEffectivenessData(
  organizationId: string,
  options?: Parameters<PolicyTuningClient['getEffectiveness']>[0]
) {
  return useQuery({
    queryKey: ['policyEffectiveness', organizationId, options],
    queryFn: async () => {
      const client = new PolicyTuningClient(organizationId)
      return client.getEffectiveness(options)
    },
    enabled: !!organizationId
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatVariancePriority(priority: VariancePriority): string {
  const priorityMap = {
    'CRITICAL': 'Critical',
    'HIGH': 'High',
    'MEDIUM': 'Medium',
    'LOW': 'Low',
    'MINIMAL': 'Minimal'
  }
  return priorityMap[priority] || priority
}

export function formatEffectivenessRating(rating: EffectivenessRating): string {
  const ratingMap = {
    'HIGHLY_EFFECTIVE': 'Highly Effective',
    'EFFECTIVE': 'Effective',
    'MODERATELY_EFFECTIVE': 'Moderately Effective',
    'MINIMALLY_EFFECTIVE': 'Minimally Effective',
    'INEFFECTIVE': 'Ineffective'
  }
  return ratingMap[rating] || rating
}

export function getPriorityColor(priority: VariancePriority): string {
  switch (priority) {
    case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'MINIMAL': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export function getEffectivenessColor(rating: EffectivenessRating): string {
  switch (rating) {
    case 'HIGHLY_EFFECTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'EFFECTIVE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
    case 'MODERATELY_EFFECTIVE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'MINIMALLY_EFFECTIVE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case 'INEFFECTIVE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
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

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Smart code constants
export const POLICY_TUNING_SMART_CODES = {
  MONITOR: 'HERA.AI.POLICY.MONITOR.RUN.V3',
  SUGGEST: 'HERA.AI.POLICY.SUGGEST.RUN.V3',
  APPLY: 'HERA.AI.POLICY.APPLY.RUN.V3',
  REVERT: 'HERA.AI.POLICY.REVERT.RUN.V3',
  EFFECTIVENESS: 'HERA.AI.POLICY.EFFECTIVENESS.RUN.V3'
} as const

// Default configuration values
export const POLICY_TUNING_DEFAULTS = {
  MONITORING_PERIOD: getCurrentPeriod(),
  EFFECTIVENESS_PERIODS: 6,
  MAX_SUGGESTIONS_DISPLAY: 10,
  MIN_CONFIDENCE_THRESHOLD: 0.9,
  MAX_CHANGE_PERCENTAGE: 5.0,
  COOLDOWN_DAYS: 7,
  DUAL_APPROVAL_REQUIRED: true
} as const