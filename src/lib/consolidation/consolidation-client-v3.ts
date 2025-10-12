/**
 * HERA Finance DNA v3.4: Cross-Org Consolidation Client SDK
 * 
 * TypeScript client for IFRS 10 compliant multi-entity consolidation
 * with elimination, translation, aggregation, and reconciliation operations.
 * 
 * Smart Code: HERA.CONSOL.CLIENT.SDK.V3
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { callRPC } from '@/lib/db/rpc-client'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ConsolidationMethod = 'FULL' | 'PROPORTIONATE' | 'EQUITY'
export type TranslationMethod = 'CURRENT_RATE' | 'TEMPORAL' | 'NET_INVESTMENT'
export type ConsolidationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RECONCILIATION_FAILED'
export type VarianceCategory = 'PASS' | 'FAIL'
export type AdjustmentStatus = 'ADJUSTED' | 'UNADJUSTED'

export interface ConsolidationRunRequest {
  group_id: string
  period: string
  actor_id?: string
  base_currency?: string
  dry_run?: boolean
}

export interface ConsolidationPrepareRequest extends ConsolidationRunRequest {
  validation_mode?: boolean
}

export interface ConsolidationEliminateRequest extends ConsolidationRunRequest {
  // Inherits base fields
}

export interface ConsolidationTranslateRequest extends ConsolidationRunRequest {
  translation_method?: TranslationMethod
}

export interface ConsolidationAggregateRequest extends ConsolidationRunRequest {
  consolidation_level?: ConsolidationMethod
}

export interface ConsolidationReconcileRequest extends ConsolidationRunRequest {
  tolerance_amount?: number
  auto_adjust?: boolean
}

export interface ConsolidationRunResponse {
  success: boolean
  run_id: string
  group_id: string
  period: string
  processing_time_ms: number
  smart_code: string
  error_code?: string
  error_message?: string
}

export interface ConsolidationPrepareResponse extends ConsolidationRunResponse {
  preparation_summary: {
    group_name: string
    member_count: number
    fx_pairs_validated: number
    elimination_pairs_validated: number
    policy_violations: PolicyViolation[]
    validation_passed: boolean
    cached_members: GroupMember[]
    fx_rates: Record<string, FxRateInfo>
  }
  validation_passed: boolean
}

export interface ConsolidationEliminateResponse extends ConsolidationRunResponse {
  elimination_summary: {
    elimination_pairs_processed: number
    elimination_entries_created: number
    total_eliminated_amount: number
    balance_check_passed: boolean
  }
  balance_check_passed: boolean
}

export interface ConsolidationTranslateResponse extends ConsolidationRunResponse {
  translation_summary: {
    translation_method: TranslationMethod
    members_translated: number
    translation_entries_created: number
    total_translation_adjustment: number
    fx_rates_used: Record<string, FxRateInfo>
    ifrs_21_compliant: boolean
  }
  members_translated: number
  total_translation_adjustment: number
}

export interface ConsolidationAggregateResponse extends ConsolidationRunResponse {
  aggregation_summary: {
    consolidation_level: ConsolidationMethod
    members_aggregated: number
    aggregate_entries_created: number
    totals: {
      total_consolidated_amount: number
      total_elimination_amount: number
      total_translation_amount: number
    }
    consolidated_balances_by_category: Record<string, ConsolidatedBalance>
  }
  members_aggregated: number
  total_consolidated_amount: number
  consolidated_balances: Record<string, ConsolidatedBalance>
}

export interface ConsolidationReconcileResponse extends ConsolidationRunResponse {
  reconciliation_summary: {
    reconciliation_checks: number
    reconciliation_entries_created: number
    reconciliation_passed: boolean
    variance_summary: VarianceSummary
    auto_adjust_enabled: boolean
    ifrs_10_compliant: boolean
    balance_checks: BalanceCheck[]
    variance_details_by_type: VarianceDetail[]
  }
  reconciliation_passed: boolean
  total_variance_amount: number
  max_variance_amount: number
  tolerance_amount: number
  auto_adjustments_made: number
  ifrs_10_compliant: boolean
}

export interface PolicyViolation {
  violation_type: string
  violation_count: number
  policy_rule: string
}

export interface GroupMember {
  member_entity_id: string
  member_name: string
  member_org_id: string
  ownership_pct: number
  consolidation_method: ConsolidationMethod
  local_currency: string
  validation_status: string
  member_since: string
}

export interface FxRateInfo {
  currency_pair_entity_id: string
  avg_rate: number
  closing_rate: number
  validation_status: string
}

export interface ConsolidatedBalance {
  total_consolidated: number
  total_nci: number
  balance_lines: number
  nci_lines: number
}

export interface VarianceSummary {
  total_variance_amount: number
  max_variance_amount: number
  tolerance_amount: number
  tolerance_exceeded: boolean
}

export interface BalanceCheck {
  check_type: string
  transaction_code: string
  variance_amount: number
  abs_variance: number
  check_status: VarianceCategory
  variance_rank: number
  tolerance_amount: number
  check_details: Record<string, any>
}

export interface VarianceDetail {
  check_type: string
  checks_count: number
  total_variance: number
  avg_variance: number
  max_variance: number
  failed_checks: number
  passed_checks: number
  pass_rate_pct: number
}

export interface ConsolidatedFact {
  group_id: string
  period: string
  member_entity_id: string
  member_name: string
  gl_account_id: string
  gl_account_code: string
  gl_account_name: string
  account_category: string
  ownership_pct: number
  consolidation_method: ConsolidationMethod
  consolidated_balance_amount: number
  non_controlling_interest_amount: number
  elimination_adjustment_amount: number
  translation_adjustment_amount: number
  total_consolidated_amount: number
  financial_statement_category: string
  balance_type: string
  absolute_amount: number
  consolidation_completeness: string
  adjustment_status: AdjustmentStatus
  fx_translated: boolean
  fiscal_year: number
  fiscal_month: number
}

export interface SegmentNote {
  group_id: string
  period: string
  operating_segment: string
  geographic_segment: string
  industry_segment: string
  business_unit: string
  country_code: string
  region_code: string
  segment_revenue: number
  segment_operating_result: number
  segment_assets: number
  segment_liabilities: number
  segment_capex: number
  segment_depreciation_amortization: number
  revenue_materiality_pct: number
  operating_result_materiality_pct: number
  assets_materiality_pct: number
  is_reportable_segment: boolean
  member_entities_count: number
  operating_margin_pct: number
  asset_turnover_ratio: number
  return_on_segment_assets_pct: number
  revenue_growth_pct: number
}

export interface FxTranslationDiff {
  group_id: string
  period: string
  member_entity_id: string
  member_name: string
  country_code: string
  functional_currency: string
  local_currency: string
  base_currency: string
  currency_pair: string
  translation_method: TranslationMethod
  avg_fx_rate: number
  closing_fx_rate: number
  avg_rate_change_pct: number
  closing_rate_change_pct: number
  fx_volatility_12m: number
  balance_sheet_translation_diff: number
  income_statement_translation_diff: number
  cumulative_translation_adjustment: number
  total_translation_difference: number
  cumulative_cta_total: number
  translation_impact_direction: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL'
  translation_materiality: 'HIGH' | 'MEDIUM' | 'LOW'
  fx_risk_profile: 'HIGH_VOLATILITY' | 'MEDIUM_VOLATILITY' | 'LOW_VOLATILITY'
  local_currency_trend: 'WEAKENING' | 'STRENGTHENING' | 'STABLE'
  ifrs_21_compliance_status: string
}

// ============================================================================
// Consolidation Client Class
// ============================================================================

export class ConsolidationClient {
  constructor(private organizationId: string) {}

  // Consolidation preparation
  async prepareConsolidation(request: ConsolidationPrepareRequest): Promise<ConsolidationPrepareResponse> {
    const result = await callRPC('hera_consol_prepare_v3', {
      p_group_id: request.group_id,
      p_period: request.period,
      p_actor_id: request.actor_id || null,
      p_base_currency: request.base_currency || 'GBP',
      p_validation_mode: request.validation_mode ?? true
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Consolidation preparation failed')
    }

    return result
  }

  // Intercompany elimination
  async eliminateIntercompany(request: ConsolidationEliminateRequest): Promise<ConsolidationEliminateResponse> {
    const result = await callRPC('hera_consol_eliminate_v3', {
      p_group_id: request.group_id,
      p_period: request.period,
      p_actor_id: request.actor_id || null,
      p_base_currency: request.base_currency || 'GBP',
      p_dry_run: request.dry_run ?? false
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Intercompany elimination failed')
    }

    return result
  }

  // FX translation
  async translateForeignCurrency(request: ConsolidationTranslateRequest): Promise<ConsolidationTranslateResponse> {
    const result = await callRPC('hera_consol_translate_v3', {
      p_group_id: request.group_id,
      p_period: request.period,
      p_actor_id: request.actor_id || null,
      p_base_currency: request.base_currency || 'GBP',
      p_translation_method: request.translation_method || 'CURRENT_RATE',
      p_dry_run: request.dry_run ?? false
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'FX translation failed')
    }

    return result
  }

  // Financial aggregation
  async aggregateConsolidation(request: ConsolidationAggregateRequest): Promise<ConsolidationAggregateResponse> {
    const result = await callRPC('hera_consol_aggregate_v3', {
      p_group_id: request.group_id,
      p_period: request.period,
      p_actor_id: request.actor_id || null,
      p_base_currency: request.base_currency || 'GBP',
      p_consolidation_level: request.consolidation_level || 'FULL',
      p_dry_run: request.dry_run ?? false
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Consolidation aggregation failed')
    }

    return result
  }

  // Consolidation reconciliation
  async reconcileConsolidation(request: ConsolidationReconcileRequest): Promise<ConsolidationReconcileResponse> {
    const result = await callRPC('hera_consol_reconcile_v3', {
      p_group_id: request.group_id,
      p_period: request.period,
      p_actor_id: request.actor_id || null,
      p_base_currency: request.base_currency || 'GBP',
      p_tolerance_amount: request.tolerance_amount ?? 0.01,
      p_auto_adjust: request.auto_adjust ?? false
    }, { mode: 'service' })

    if (!result.success) {
      throw new Error(result.error_message || 'Consolidation reconciliation failed')
    }

    return result
  }

  // Complete consolidation run (all steps)
  async runCompleteConsolidation(request: ConsolidationRunRequest): Promise<{
    prepare: ConsolidationPrepareResponse
    eliminate: ConsolidationEliminateResponse
    translate: ConsolidationTranslateResponse
    aggregate: ConsolidationAggregateResponse
    reconcile: ConsolidationReconcileResponse
    totalProcessingTimeMs: number
  }> {
    const startTime = Date.now()

    // Step 1: Prepare
    const prepare = await this.prepareConsolidation(request)
    if (!prepare.validation_passed) {
      throw new Error('Consolidation preparation failed validation')
    }

    // Step 2: Eliminate
    const eliminate = await this.eliminateIntercompany(request)

    // Step 3: Translate
    const translate = await this.translateForeignCurrency({
      ...request,
      translation_method: 'CURRENT_RATE'
    })

    // Step 4: Aggregate
    const aggregate = await this.aggregateConsolidation({
      ...request,
      consolidation_level: 'FULL'
    })

    // Step 5: Reconcile
    const reconcile = await this.reconcileConsolidation({
      ...request,
      tolerance_amount: 0.01,
      auto_adjust: true
    })

    const totalProcessingTimeMs = Date.now() - startTime

    return {
      prepare,
      eliminate,
      translate,
      aggregate,
      reconcile,
      totalProcessingTimeMs
    }
  }

  // Query consolidated facts
  async getConsolidatedFacts(groupId: string, period: string, options?: {
    memberEntityId?: string
    glAccountId?: string
    accountCategory?: string
    financialStatementCategory?: string
    limit?: number
  }): Promise<ConsolidatedFact[]> {
    let query = `
      SELECT * FROM fact_consolidated_v3 
      WHERE group_id = $1 AND period = $2
    `
    const params: any[] = [groupId, period]
    let paramIndex = 3

    if (options?.memberEntityId) {
      query += ` AND member_entity_id = $${paramIndex}`
      params.push(options.memberEntityId)
      paramIndex++
    }

    if (options?.glAccountId) {
      query += ` AND gl_account_id = $${paramIndex}`
      params.push(options.glAccountId)
      paramIndex++
    }

    if (options?.accountCategory) {
      query += ` AND account_category = $${paramIndex}`
      params.push(options.accountCategory)
      paramIndex++
    }

    if (options?.financialStatementCategory) {
      query += ` AND financial_statement_category = $${paramIndex}`
      params.push(options.financialStatementCategory)
      paramIndex++
    }

    query += ` ORDER BY absolute_amount DESC`

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

  // Query segment notes
  async getSegmentNotes(groupId: string, period: string, options?: {
    reportableOnly?: boolean
    operatingSegment?: string
    geographicSegment?: string
    limit?: number
  }): Promise<SegmentNote[]> {
    let query = `
      SELECT * FROM vw_consol_segment_note_v3 
      WHERE group_id = $1 AND period = $2
    `
    const params: any[] = [groupId, period]
    let paramIndex = 3

    if (options?.reportableOnly) {
      query += ` AND is_reportable_segment = true`
    }

    if (options?.operatingSegment) {
      query += ` AND operating_segment = $${paramIndex}`
      params.push(options.operatingSegment)
      paramIndex++
    }

    if (options?.geographicSegment) {
      query += ` AND geographic_segment = $${paramIndex}`
      params.push(options.geographicSegment)
      paramIndex++
    }

    query += ` ORDER BY revenue_materiality_pct DESC`

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

  // Query FX translation differences
  async getFxTranslationDifferences(groupId: string, period: string, options?: {
    memberEntityId?: string
    currencyPair?: string
    materialityLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
    limit?: number
  }): Promise<FxTranslationDiff[]> {
    let query = `
      SELECT * FROM vw_fx_translation_diff_v3 
      WHERE group_id = $1 AND period = $2
    `
    const params: any[] = [groupId, period]
    let paramIndex = 3

    if (options?.memberEntityId) {
      query += ` AND member_entity_id = $${paramIndex}`
      params.push(options.memberEntityId)
      paramIndex++
    }

    if (options?.currencyPair) {
      query += ` AND currency_pair = $${paramIndex}`
      params.push(options.currencyPair)
      paramIndex++
    }

    if (options?.materialityLevel) {
      query += ` AND translation_materiality = $${paramIndex}`
      params.push(options.materialityLevel)
      paramIndex++
    }

    query += ` ORDER BY total_absolute_translation_diff DESC`

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

  // Refresh materialized views
  async refreshConsolidatedViews(groupId?: string, period?: string): Promise<string> {
    const result = await callRPC('refresh_fact_consolidated_v3', {
      p_group_id: groupId || null,
      p_period: period || null
    }, { mode: 'service' })

    return result.data || 'Refresh completed'
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

// Prepare consolidation hook
export function usePrepareConsolidation(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ConsolidationPrepareRequest) => {
      const client = new ConsolidationClient(organizationId)
      return client.prepareConsolidation(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', organizationId] })
    }
  })
}

// Eliminate intercompany hook
export function useEliminateIntercompany(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ConsolidationEliminateRequest) => {
      const client = new ConsolidationClient(organizationId)
      return client.eliminateIntercompany(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', organizationId] })
    }
  })
}

// Translate FX hook
export function useTranslateForeignCurrency(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ConsolidationTranslateRequest) => {
      const client = new ConsolidationClient(organizationId)
      return client.translateForeignCurrency(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', organizationId] })
    }
  })
}

// Aggregate consolidation hook
export function useAggregateConsolidation(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ConsolidationAggregateRequest) => {
      const client = new ConsolidationClient(organizationId)
      return client.aggregateConsolidation(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', organizationId] })
    }
  })
}

// Reconcile consolidation hook
export function useReconcileConsolidation(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ConsolidationReconcileRequest) => {
      const client = new ConsolidationClient(organizationId)
      return client.reconcileConsolidation(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', organizationId] })
    }
  })
}

// Complete consolidation run hook
export function useCompleteConsolidation(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ConsolidationRunRequest) => {
      const client = new ConsolidationClient(organizationId)
      return client.runCompleteConsolidation(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['consolidatedFacts', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['segmentNotes', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['fxTranslationDiffs', organizationId] })
    }
  })
}

// Consolidated facts query hook
export function useConsolidatedFacts(
  organizationId: string, 
  groupId: string, 
  period: string, 
  options?: Parameters<ConsolidationClient['getConsolidatedFacts']>[2]
) {
  return useQuery({
    queryKey: ['consolidatedFacts', organizationId, groupId, period, options],
    queryFn: async () => {
      const client = new ConsolidationClient(organizationId)
      return client.getConsolidatedFacts(groupId, period, options)
    },
    enabled: !!groupId && !!period
  })
}

// Segment notes query hook
export function useSegmentNotes(
  organizationId: string, 
  groupId: string, 
  period: string, 
  options?: Parameters<ConsolidationClient['getSegmentNotes']>[2]
) {
  return useQuery({
    queryKey: ['segmentNotes', organizationId, groupId, period, options],
    queryFn: async () => {
      const client = new ConsolidationClient(organizationId)
      return client.getSegmentNotes(groupId, period, options)
    },
    enabled: !!groupId && !!period
  })
}

// FX translation differences query hook
export function useFxTranslationDifferences(
  organizationId: string, 
  groupId: string, 
  period: string, 
  options?: Parameters<ConsolidationClient['getFxTranslationDifferences']>[2]
) {
  return useQuery({
    queryKey: ['fxTranslationDiffs', organizationId, groupId, period, options],
    queryFn: async () => {
      const client = new ConsolidationClient(organizationId)
      return client.getFxTranslationDifferences(groupId, period, options)
    },
    enabled: !!groupId && !!period
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

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

export function getVarianceColor(category: VarianceCategory): string {
  switch (category) {
    case 'PASS': return 'text-green-500'
    case 'FAIL': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

export function getConsolidationStatusColor(status: ConsolidationStatus): string {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
    case 'FAILED': return 'bg-red-100 text-red-800'
    case 'RECONCILIATION_FAILED': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Smart code constants
export const CONSOLIDATION_SMART_CODES = {
  PREPARE: 'HERA.CONSOL.PREP.RUN.V3',
  ELIMINATE: 'HERA.CONSOL.ELIM.TXN.V3',
  TRANSLATE: 'HERA.CONSOL.TRANSLATE.TXN.V3',
  AGGREGATE: 'HERA.CONSOL.AGGREGATE.TXN.V3',
  RECONCILE: 'HERA.CONSOL.RECONCILE.TXN.V3'
} as const

// Default values
export const CONSOLIDATION_DEFAULTS = {
  BASE_CURRENCY: 'GBP',
  TOLERANCE_AMOUNT: 0.01,
  TRANSLATION_METHOD: 'CURRENT_RATE' as TranslationMethod,
  CONSOLIDATION_METHOD: 'FULL' as ConsolidationMethod,
  DRY_RUN: false,
  AUTO_ADJUST: false,
  VALIDATION_MODE: true
} as const