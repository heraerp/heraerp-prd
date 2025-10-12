/**
 * HERA Profitability v2: Standard Definitions and Interfaces
 * 
 * Enterprise-grade profitability analysis with dimensional completeness,
 * allocation/assessment/settlement processing, IFRS 8 CODM compliance,
 * and sub-second analytics performance.
 * 
 * Smart Code: HERA.PROFITABILITY.STANDARD.V2
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export interface ProfitabilityFact {
  org_id: string
  period: string
  txn_date: string
  currency: string
  gl_account_id: string
  account_number: string
  account_group: 'REVENUE' | 'COGS' | 'OPEX' | 'OTHER'
  normal_balance: 'Dr' | 'Cr'
  profit_center_id?: string
  cost_center_id?: string
  product_id?: string
  customer_id?: string
  region_id?: string
  channel_id?: string
  project_id?: string
  amount_dr: number
  amount_cr: number
  amount_net: number
  qty?: number
  std_cost?: number
  variance_material?: number
  variance_labor?: number
  variance_overhead?: number
  source_txn_id: string
  source_smart_code: string
  created_at: string
}

export interface AllocationDriver {
  name: string
  source: 'CC' | 'PC' | 'PRODUCT' | 'CUSTOMER' | 'REGION' | 'CHANNEL'
  measure: string
  periodicity: 'monthly' | 'quarterly' | 'yearly'
  calculated_at?: string
}

export interface AllocationRule {
  name: string
  basis: string
  from: {
    cc_tags?: string[]
    pc_segment?: string
    gl_range?: string
    [key: string]: any
  }
  to: {
    pc?: string
    cc?: string
    product?: string
    [key: string]: any
  }
  threshold?: number
  method?: 'proportional' | 'even' | 'step'
}

export interface AllocationAssessmentPolicy {
  policy: 'ALLOC_ASSESS_V2'
  drivers: AllocationDriver[]
  rules: AllocationRule[]
  version: string
  effective_from: string
  effective_to?: string
  created_by: string
  metadata?: Record<string, any>
}

export interface SettlementPolicy {
  policy: 'SETTLEMENT_V2'
  project_settlement: {
    receiver: 'PCxPRODUCT' | 'COGS' | 'PC'
    basis: 'RevenueShare' | 'StdCostShare' | 'Even'
    threshold: number
  }
  variance_settlement: {
    receiver: 'COGS' | 'INVENTORY'
    inventory_share: number
  }
  version: string
  effective_from: string
  effective_to?: string
  created_by: string
  metadata?: Record<string, any>
}

export interface CODMPolicy {
  policy: 'IFRS8_CODM_V2'
  segment_map: string
  include_only_codm: boolean
  presentation_groups: {
    Revenue: string[]
    COGS: string[]
    OpEx: string[]
    [key: string]: string[]
  }
  version: string
  effective_from: string
  effective_to?: string
  created_by: string
  metadata?: Record<string, any>
}

export interface DimensionalCompletenessRule {
  account_range: string
  required_dimensions: string[]
  optional_dimensions: string[]
  validation_level: 'ERROR' | 'WARNING' | 'INFO'
}

export interface ProfitabilityRunRequest {
  organization_id: string
  period: string
  policy_ref: string
  actor_entity_id?: string
  dry_run?: boolean
  force_rerun?: boolean
}

export interface ProfitabilityRunResult {
  run_id: string
  run_type: 'ALLOCATION' | 'ASSESSMENT' | 'SETTLEMENT'
  organization_id: string
  period: string
  policy_ref: string
  totals: {
    lines_processed: number
    amount_allocated: number
    currencies: string[]
    dimensions_completed: number
  }
  txn_ids: string[]
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL'
  execution_time_ms: number
  errors?: string[]
  warnings?: string[]
  created_at: string
}

export interface ProfitabilityQuery {
  organization_id: string
  period?: string
  date_from?: string
  date_to?: string
  slice?: string[]
  filters?: Record<string, any>
  metrics?: string[]
  group_by?: string[]
  currency?: string
  include_codm_only?: boolean
  page?: number
  limit?: number
}

export interface ProfitabilityQueryResult {
  data: Record<string, any>[]
  metadata: {
    total_rows: number
    page: number
    limit: number
    execution_time_ms: number
    currency: string
    period: string
  }
  aggregates?: Record<string, number>
}

export interface ReconciliationRow {
  account_number: string
  account_name: string
  currency: string
  gl_balance: number
  fact_balance: number
  difference: number
  variance_pct: number
  status: 'OK' | 'VARIANCE' | 'ERROR'
}

export interface ReconciliationResult {
  organization_id: string
  period: string
  by_account: ReconciliationRow[]
  summary: {
    total_accounts: number
    accounts_reconciled: number
    total_variance: number
    max_variance_pct: number
    currencies: string[]
  }
  ok: boolean
  generated_at: string
}

// ============================================================================
// Smart Code Registry
// ============================================================================

export const PROFITABILITY_SMART_CODES = {
  // Allocation processes
  ALLOC_DISTRIBUTE: 'HERA.PROFITABILITY.ALLOC.DISTRIBUTE.V2',
  ALLOC_ASSESS: 'HERA.PROFITABILITY.ALLOC.ASSESS.V2',
  ALLOC_SETTLE: 'HERA.PROFITABILITY.ALLOC.SETTLE.V2',
  
  // Assessment processes  
  ASSESS_RUN: 'HERA.PROFITABILITY.ASSESS.RUN.V2',
  ASSESS_SECONDARY: 'HERA.PROFITABILITY.ASSESS.SECONDARY.V2',
  
  // Settlement processes
  SETTLE_RUN: 'HERA.PROFITABILITY.SETTLE.RUN.V2',
  SETTLE_PROJECT: 'HERA.PROFITABILITY.SETTLE.PROJECT.V2',
  SETTLE_VARIANCE: 'HERA.PROFITABILITY.SETTLE.VARIANCE.V2',
  
  // Reconciliation
  RECONCILE_RUN: 'HERA.PROFITABILITY.RECONCILE.RUN.V2',
  
  // Policy management
  POLICY_CREATE: 'HERA.PROFITABILITY.POLICY.CREATE.V2',
  POLICY_UPDATE: 'HERA.PROFITABILITY.POLICY.UPDATE.V2',
  POLICY_ARCHIVE: 'HERA.PROFITABILITY.POLICY.ARCHIVE.V2',
  
  // Dimensional completion
  DIM_COMPLETE: 'HERA.PROFITABILITY.DIM.COMPLETE.V2',
  DIM_VALIDATE: 'HERA.PROFITABILITY.DIM.VALIDATE.V2'
} as const

// ============================================================================
// Error Codes and Messages
// ============================================================================

export const PROFITABILITY_ERROR_CODES = {
  // Policy errors
  ERR_POLICY_INVALID: 'ERR_PROFITABILITY_POLICY_INVALID',
  ERR_POLICY_NOT_FOUND: 'ERR_PROFITABILITY_POLICY_NOT_FOUND',
  ERR_POLICY_EXPIRED: 'ERR_PROFITABILITY_POLICY_EXPIRED',
  ERR_POLICY_CONFLICT: 'ERR_PROFITABILITY_POLICY_CONFLICT',
  
  // Dimensional completeness errors
  ERR_DIM_INCOMPLETE: 'ERR_PROFITABILITY_DIM_INCOMPLETE',
  ERR_DIM_INVALID: 'ERR_PROFITABILITY_DIM_INVALID',
  ERR_DIM_REQUIRED: 'ERR_PROFITABILITY_DIM_REQUIRED',
  
  // Allocation errors
  ERR_ALLOC_WEIGHTS_INVALID: 'ERR_PROFITABILITY_ALLOC_WEIGHTS_INVALID',
  ERR_ALLOC_DRIVER_MISSING: 'ERR_PROFITABILITY_ALLOC_DRIVER_MISSING',
  ERR_ALLOC_LOOP_DETECTED: 'ERR_PROFITABILITY_ALLOC_LOOP_DETECTED',
  ERR_ALLOC_NEGATIVE_BASE: 'ERR_PROFITABILITY_ALLOC_NEGATIVE_BASE',
  
  // Period and timing errors
  ERR_PERIOD_CLOSED: 'ERR_PROFITABILITY_PERIOD_CLOSED',
  ERR_PERIOD_INVALID: 'ERR_PROFITABILITY_PERIOD_INVALID',
  ERR_PERIOD_FUTURE: 'ERR_PROFITABILITY_PERIOD_FUTURE',
  
  // Balance and reconciliation errors
  ERR_JOURNAL_UNBALANCED: 'ERR_PROFITABILITY_JOURNAL_UNBALANCED',
  ERR_CURRENCY_MISSING: 'ERR_PROFITABILITY_CURRENCY_MISSING',
  ERR_RECONCILE_FAILED: 'ERR_PROFITABILITY_RECONCILE_FAILED',
  
  // Run execution errors
  ERR_RUN_IN_PROGRESS: 'ERR_PROFITABILITY_RUN_IN_PROGRESS',
  ERR_RUN_FAILED: 'ERR_PROFITABILITY_RUN_FAILED',
  ERR_RUN_TIMEOUT: 'ERR_PROFITABILITY_RUN_TIMEOUT',
  
  // Data access errors
  ERR_DATA_NOT_FOUND: 'ERR_PROFITABILITY_DATA_NOT_FOUND',
  ERR_DATA_ACCESS_DENIED: 'ERR_PROFITABILITY_DATA_ACCESS_DENIED',
  ERR_DATA_CORRUPTED: 'ERR_PROFITABILITY_DATA_CORRUPTED'
} as const

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate allocation/assessment policy structure
 */
export function validateAllocationPolicy(policy: AllocationAssessmentPolicy): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Basic structure validation
  if (!policy.policy || policy.policy !== 'ALLOC_ASSESS_V2') {
    errors.push('Policy type must be ALLOC_ASSESS_V2')
  }
  
  if (!policy.drivers || !Array.isArray(policy.drivers) || policy.drivers.length === 0) {
    errors.push('Policy must have at least one allocation driver')
  }
  
  if (!policy.rules || !Array.isArray(policy.rules) || policy.rules.length === 0) {
    errors.push('Policy must have at least one allocation rule')
  }
  
  // Validate drivers
  policy.drivers?.forEach((driver, index) => {
    if (!driver.name || typeof driver.name !== 'string') {
      errors.push(`Driver ${index + 1}: name is required`)
    }
    
    if (!['CC', 'PC', 'PRODUCT', 'CUSTOMER', 'REGION', 'CHANNEL'].includes(driver.source)) {
      errors.push(`Driver ${index + 1}: invalid source '${driver.source}'`)
    }
    
    if (!driver.measure || typeof driver.measure !== 'string') {
      errors.push(`Driver ${index + 1}: measure is required`)
    }
    
    if (!['monthly', 'quarterly', 'yearly'].includes(driver.periodicity)) {
      errors.push(`Driver ${index + 1}: invalid periodicity '${driver.periodicity}'`)
    }
  })
  
  // Validate rules
  policy.rules?.forEach((rule, index) => {
    if (!rule.name || typeof rule.name !== 'string') {
      errors.push(`Rule ${index + 1}: name is required`)
    }
    
    if (!rule.basis || typeof rule.basis !== 'string') {
      errors.push(`Rule ${index + 1}: basis is required`)
    }
    
    // Check if basis references a valid driver
    const driverExists = policy.drivers?.some(d => d.name === rule.basis)
    if (!driverExists) {
      errors.push(`Rule ${index + 1}: basis '${rule.basis}' references unknown driver`)
    }
    
    if (!rule.from || typeof rule.from !== 'object') {
      errors.push(`Rule ${index + 1}: from criteria is required`)
    }
    
    if (!rule.to || typeof rule.to !== 'object') {
      errors.push(`Rule ${index + 1}: to criteria is required`)
    }
    
    // Validate threshold
    if (rule.threshold !== undefined && (typeof rule.threshold !== 'number' || rule.threshold < 0)) {
      errors.push(`Rule ${index + 1}: threshold must be a non-negative number`)
    }
  })
  
  // Check for version and effective dates
  if (!policy.version || typeof policy.version !== 'string') {
    warnings.push('Policy version is recommended for tracking')
  }
  
  if (!policy.effective_from) {
    warnings.push('Policy effective_from date is recommended')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate settlement policy structure
 */
export function validateSettlementPolicy(policy: SettlementPolicy): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!policy.policy || policy.policy !== 'SETTLEMENT_V2') {
    errors.push('Policy type must be SETTLEMENT_V2')
  }
  
  // Validate project settlement
  if (!policy.project_settlement) {
    errors.push('Project settlement configuration is required')
  } else {
    const ps = policy.project_settlement
    
    if (!['PCxPRODUCT', 'COGS', 'PC'].includes(ps.receiver)) {
      errors.push(`Invalid project settlement receiver: ${ps.receiver}`)
    }
    
    if (!['RevenueShare', 'StdCostShare', 'Even'].includes(ps.basis)) {
      errors.push(`Invalid project settlement basis: ${ps.basis}`)
    }
    
    if (typeof ps.threshold !== 'number' || ps.threshold < 0 || ps.threshold > 1) {
      errors.push('Project settlement threshold must be between 0 and 1')
    }
  }
  
  // Validate variance settlement
  if (!policy.variance_settlement) {
    errors.push('Variance settlement configuration is required')
  } else {
    const vs = policy.variance_settlement
    
    if (!['COGS', 'INVENTORY'].includes(vs.receiver)) {
      errors.push(`Invalid variance settlement receiver: ${vs.receiver}`)
    }
    
    if (typeof vs.inventory_share !== 'number' || vs.inventory_share < 0 || vs.inventory_share > 1) {
      errors.push('Variance settlement inventory_share must be between 0 and 1')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate CODM policy structure
 */
export function validateCODMPolicy(policy: CODMPolicy): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!policy.policy || policy.policy !== 'IFRS8_CODM_V2') {
    errors.push('Policy type must be IFRS8_CODM_V2')
  }
  
  if (!policy.segment_map || typeof policy.segment_map !== 'string') {
    errors.push('Segment map specification is required')
  }
  
  if (typeof policy.include_only_codm !== 'boolean') {
    errors.push('include_only_codm must be a boolean value')
  }
  
  if (!policy.presentation_groups || typeof policy.presentation_groups !== 'object') {
    errors.push('Presentation groups configuration is required')
  } else {
    const requiredGroups = ['Revenue', 'COGS', 'OpEx']
    requiredGroups.forEach(group => {
      if (!policy.presentation_groups[group] || !Array.isArray(policy.presentation_groups[group])) {
        errors.push(`Presentation group '${group}' must be an array`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate period format
 */
export function validatePeriod(period: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check format YYYY-MM
  const periodRegex = /^\d{4}-\d{2}$/
  if (!periodRegex.test(period)) {
    errors.push('Period must be in YYYY-MM format')
    return { valid: false, errors, warnings }
  }
  
  // Check valid month
  const [year, month] = period.split('-')
  const monthNum = parseInt(month, 10)
  if (monthNum < 1 || monthNum > 12) {
    errors.push('Month must be between 01 and 12')
  }
  
  // Check reasonable year range
  const yearNum = parseInt(year, 10)
  const currentYear = new Date().getFullYear()
  if (yearNum < 2020 || yearNum > currentYear + 2) {
    warnings.push(`Period year ${yearNum} seems outside reasonable range`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate dimensional completeness for transaction
 */
export function validateDimensionalCompleteness(
  accountGroup: string,
  dimensions: Record<string, any>,
  rules: DimensionalCompletenessRule[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const applicableRule = rules.find(rule => {
    // Simple range matching - in production would be more sophisticated
    if (rule.account_range === '4xxx') return accountGroup === 'REVENUE'
    if (rule.account_range === '5xxx') return accountGroup === 'COGS'
    if (rule.account_range === '6xxx') return accountGroup === 'OPEX'
    return false
  })
  
  if (!applicableRule) {
    warnings.push(`No dimensional completeness rule found for account group ${accountGroup}`)
    return { valid: true, errors, warnings }
  }
  
  // Check required dimensions
  applicableRule.required_dimensions.forEach(dim => {
    if (!dimensions[dim] || dimensions[dim] === null || dimensions[dim] === '') {
      const message = `Required dimension '${dim}' is missing for ${accountGroup} transactions`
      
      if (applicableRule.validation_level === 'ERROR') {
        errors.push(message)
      } else if (applicableRule.validation_level === 'WARNING') {
        warnings.push(message)
      }
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate allocation weights sum to approximately 1.0
 */
export function validateAllocationWeights(weights: number[], tolerance: number = 0.001): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!Array.isArray(weights) || weights.length === 0) {
    errors.push('Allocation weights array is required')
    return { valid: false, errors, warnings }
  }
  
  // Check all weights are non-negative numbers
  weights.forEach((weight, index) => {
    if (typeof weight !== 'number' || isNaN(weight)) {
      errors.push(`Weight at index ${index} is not a valid number`)
    } else if (weight < 0) {
      errors.push(`Weight at index ${index} cannot be negative`)
    }
  })
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }
  
  // Check sum is approximately 1.0
  const sum = weights.reduce((acc, weight) => acc + weight, 0)
  const difference = Math.abs(sum - 1.0)
  
  if (difference > tolerance) {
    errors.push(`Allocation weights sum to ${sum.toFixed(6)} but should sum to 1.0 (tolerance: ${tolerance})`)
  } else if (difference > tolerance / 2) {
    warnings.push(`Allocation weights sum to ${sum.toFixed(6)}, close to tolerance limit`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate allocation weights based on driver values
 */
export function calculateAllocationWeights(driverValues: number[]): number[] {
  const total = driverValues.reduce((sum, value) => sum + Math.max(0, value), 0)
  
  if (total === 0) {
    // Equal distribution if no positive values
    return driverValues.map(() => 1 / driverValues.length)
  }
  
  return driverValues.map(value => Math.max(0, value) / total)
}

/**
 * Format period for display
 */
export function formatPeriod(period: string, format: 'short' | 'long' = 'short'): string {
  const [year, month] = period.split('-')
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  if (format === 'long') {
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }
  
  return `${month}/${year}`
}

/**
 * Generate allocation run reference
 */
export function generateRunReference(type: 'ALLOCATION' | 'ASSESSMENT' | 'SETTLEMENT', period: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  return `${type.charAt(0)}${period.replace('-', '')}${timestamp}`
}

/**
 * Check if two periods are in the same fiscal year
 */
export function isSameFiscalYear(period1: string, period2: string, fiscalYearStart: number = 1): boolean {
  const [year1, month1] = period1.split('-').map(Number)
  const [year2, month2] = period2.split('-').map(Number)
  
  const fy1 = month1 >= fiscalYearStart ? year1 : year1 - 1
  const fy2 = month2 >= fiscalYearStart ? year2 : year2 - 1
  
  return fy1 === fy2
}

/**
 * Default dimensional completeness rules
 */
export const DEFAULT_DIMENSIONAL_RULES: DimensionalCompletenessRule[] = [
  {
    account_range: '4xxx',
    required_dimensions: ['profit_center_id', 'product_id', 'region_id', 'channel_id'],
    optional_dimensions: ['customer_id', 'project_id'],
    validation_level: 'ERROR'
  },
  {
    account_range: '5xxx',
    required_dimensions: ['profit_center_id', 'product_id'],
    optional_dimensions: ['region_id', 'channel_id', 'project_id'],
    validation_level: 'ERROR'
  },
  {
    account_range: '6xxx',
    required_dimensions: ['cost_center_id'],
    optional_dimensions: ['profit_center_id', 'project_id'],
    validation_level: 'WARNING'
  }
]

// ============================================================================
// Standard Policy Templates
// ============================================================================

export const STANDARD_ALLOCATION_POLICY: AllocationAssessmentPolicy = {
  policy: 'ALLOC_ASSESS_V2',
  drivers: [
    {
      name: 'Headcount',
      source: 'CC',
      measure: 'HC',
      periodicity: 'monthly'
    },
    {
      name: 'RevenueShare',
      source: 'PC',
      measure: 'Revenue',
      periodicity: 'monthly'
    },
    {
      name: 'StdCostShare',
      source: 'PRODUCT',
      measure: 'StdCost',
      periodicity: 'monthly'
    }
  ],
  rules: [
    {
      name: 'Distribute_Admin_CC_to_PC',
      basis: 'Headcount',
      from: { cc_tags: ['ADMIN'] },
      to: { pc_segment: '*' },
      threshold: 0.01,
      method: 'proportional'
    },
    {
      name: 'Assess_Rent_to_PC',
      basis: 'RevenueShare',
      from: { gl_range: '6xxx' },
      to: { pc: '*' },
      threshold: 0.01,
      method: 'proportional'
    }
  ],
  version: '1.0',
  effective_from: '2024-01-01',
  created_by: 'system'
}

export const STANDARD_SETTLEMENT_POLICY: SettlementPolicy = {
  policy: 'SETTLEMENT_V2',
  project_settlement: {
    receiver: 'PCxPRODUCT',
    basis: 'RevenueShare',
    threshold: 0.01
  },
  variance_settlement: {
    receiver: 'COGS',
    inventory_share: 0.0
  },
  version: '1.0',
  effective_from: '2024-01-01',
  created_by: 'system'
}

export const STANDARD_CODM_POLICY: CODMPolicy = {
  policy: 'IFRS8_CODM_V2',
  segment_map: 'pc.segment_code',
  include_only_codm: true,
  presentation_groups: {
    Revenue: ['REVENUE'],
    COGS: ['COGS'],
    OpEx: ['OPEX']
  },
  version: '1.0',
  effective_from: '2024-01-01',
  created_by: 'system'
}

export default {
  PROFITABILITY_SMART_CODES,
  PROFITABILITY_ERROR_CODES,
  validateAllocationPolicy,
  validateSettlementPolicy,
  validateCODMPolicy,
  validatePeriod,
  validateDimensionalCompleteness,
  validateAllocationWeights,
  calculateAllocationWeights,
  formatPeriod,
  generateRunReference,
  isSameFiscalYear,
  DEFAULT_DIMENSIONAL_RULES,
  STANDARD_ALLOCATION_POLICY,
  STANDARD_SETTLEMENT_POLICY,
  STANDARD_CODM_POLICY
}