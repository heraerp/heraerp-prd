/**
 * HERA Profitability v2: Guardrails Engine
 * 
 * Policy-as-data guardrails for profitability operations with dimensional
 * completeness validation, allocation loop detection, balance verification,
 * and IFRS compliance enforcement.
 * 
 * Smart Code: HERA.PROFITABILITY.GUARDRAILS.V2
 */

import {
  type AllocationAssessmentPolicy,
  type SettlementPolicy,
  type CODMPolicy,
  type ProfitabilityRunRequest,
  type DimensionalCompletenessRule,
  type ValidationResult,
  PROFITABILITY_ERROR_CODES,
  validateAllocationPolicy,
  validateSettlementPolicy,
  validateCODMPolicy,
  validatePeriod,
  validateDimensionalCompleteness,
  validateAllocationWeights,
  DEFAULT_DIMENSIONAL_RULES
} from './profitability-v2-standard'

// ============================================================================
// Guardrails Engine Class
// ============================================================================

export class ProfitabilityGuardrailsEngine {
  private organizationId: string
  private dimensionalRules: DimensionalCompletenessRule[]
  
  constructor(organizationId: string, customRules?: DimensionalCompletenessRule[]) {
    this.organizationId = organizationId
    this.dimensionalRules = customRules || DEFAULT_DIMENSIONAL_RULES
  }
  
  /**
   * Validate allocation run request
   */
  async validateAllocationRun(
    request: ProfitabilityRunRequest,
    policy: AllocationAssessmentPolicy,
    existingRuns: any[] = []
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validate basic request structure
    const requestValidation = this.validateRunRequest(request)
    errors.push(...requestValidation.errors)
    warnings.push(...requestValidation.warnings)
    
    // Validate period
    const periodValidation = validatePeriod(request.period)
    errors.push(...periodValidation.errors)
    warnings.push(...periodValidation.warnings)
    
    // Validate policy structure
    const policyValidation = validateAllocationPolicy(policy)
    errors.push(...policyValidation.errors)
    warnings.push(...policyValidation.warnings)
    
    // Check for concurrent runs
    const concurrentRun = existingRuns.find(run => 
      run.organization_id === request.organization_id &&
      run.period === request.period &&
      run.status === 'IN_PROGRESS'
    )
    
    if (concurrentRun && !request.force_rerun) {
      errors.push(`${PROFITABILITY_ERROR_CODES.ERR_RUN_IN_PROGRESS}: Another allocation run is in progress for period ${request.period}`)
    }
    
    // Validate policy is effective for the period
    if (policy.effective_from && request.period < policy.effective_from.substring(0, 7)) {
      errors.push(`${PROFITABILITY_ERROR_CODES.ERR_POLICY_EXPIRED}: Policy not effective for period ${request.period}`)
    }
    
    if (policy.effective_to && request.period > policy.effective_to.substring(0, 7)) {
      errors.push(`${PROFITABILITY_ERROR_CODES.ERR_POLICY_EXPIRED}: Policy expired for period ${request.period}`)
    }
    
    // Validate allocation drivers and rules
    await this.validateAllocationDrivers(policy, request.period, errors, warnings)
    this.validateAllocationRules(policy, errors, warnings)
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate settlement run request
   */
  async validateSettlementRun(
    request: ProfitabilityRunRequest,
    policy: SettlementPolicy,
    existingRuns: any[] = []
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validate basic request structure
    const requestValidation = this.validateRunRequest(request)
    errors.push(...requestValidation.errors)
    warnings.push(...requestValidation.warnings)
    
    // Validate period
    const periodValidation = validatePeriod(request.period)
    errors.push(...periodValidation.errors)
    warnings.push(...periodValidation.warnings)
    
    // Validate policy structure
    const policyValidation = validateSettlementPolicy(policy)
    errors.push(...policyValidation.errors)
    warnings.push(...policyValidation.warnings)
    
    // Check for concurrent runs
    const concurrentRun = existingRuns.find(run => 
      run.organization_id === request.organization_id &&
      run.period === request.period &&
      run.status === 'IN_PROGRESS'
    )
    
    if (concurrentRun && !request.force_rerun) {
      errors.push(`${PROFITABILITY_ERROR_CODES.ERR_RUN_IN_PROGRESS}: Another settlement run is in progress for period ${request.period}`)
    }
    
    // Settlement runs should typically happen after allocation/assessment
    const hasAllocationRun = existingRuns.some(run =>
      run.organization_id === request.organization_id &&
      run.period === request.period &&
      run.run_type === 'ALLOCATION' &&
      run.status === 'SUCCESS'
    )
    
    if (!hasAllocationRun && !request.force_rerun) {
      warnings.push('Settlement run recommended after successful allocation run')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate dimensional completeness for transaction lines
   */
  validateTransactionDimensions(
    transactionLines: any[],
    accountGroups: Record<string, string>
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    transactionLines.forEach((line, index) => {
      const accountGroup = accountGroups[line.gl_account_id] || 'OTHER'
      
      const dimensions = {
        profit_center_id: line.profit_center_id,
        cost_center_id: line.cost_center_id,
        product_id: line.product_id,
        customer_id: line.customer_id,
        region_id: line.region_id,
        channel_id: line.channel_id,
        project_id: line.project_id
      }
      
      const validation = validateDimensionalCompleteness(
        accountGroup,
        dimensions,
        this.dimensionalRules
      )
      
      validation.errors.forEach(error => {
        errors.push(`Line ${index + 1}: ${error}`)
      })
      
      validation.warnings.forEach(warning => {
        warnings.push(`Line ${index + 1}: ${warning}`)
      })
    })
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate journal balance for allocation entries
   */
  validateJournalBalance(
    entries: Array<{
      currency: string
      amount_dr: number
      amount_cr: number
    }>,
    tolerance: number = 0.01
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Group by currency
    const byCurrency = entries.reduce((acc, entry) => {
      if (!acc[entry.currency]) {
        acc[entry.currency] = { dr: 0, cr: 0 }
      }
      acc[entry.currency].dr += entry.amount_dr
      acc[entry.currency].cr += entry.amount_cr
      return acc
    }, {} as Record<string, { dr: number; cr: number }>)
    
    // Check balance for each currency
    Object.entries(byCurrency).forEach(([currency, totals]) => {
      const difference = Math.abs(totals.dr - totals.cr)
      
      if (difference > tolerance) {
        errors.push(`${PROFITABILITY_ERROR_CODES.ERR_JOURNAL_UNBALANCED}: Journal unbalanced in ${currency} by ${difference.toFixed(2)}`)
      } else if (difference > tolerance / 10) {
        warnings.push(`Journal balance difference in ${currency}: ${difference.toFixed(4)}`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Detect allocation loops in policy rules
   */
  detectAllocationLoops(policy: AllocationAssessmentPolicy): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Build allocation graph
    const graph: Record<string, string[]> = {}
    
    policy.rules.forEach(rule => {
      const fromKey = this.serializeAllocationCriteria(rule.from)
      const toKey = this.serializeAllocationCriteria(rule.to)
      
      if (!graph[fromKey]) {
        graph[fromKey] = []
      }
      graph[fromKey].push(toKey)
    })
    
    // Detect cycles using DFS
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        return true // Cycle detected
      }
      
      if (visited.has(node)) {
        return false
      }
      
      visited.add(node)
      recursionStack.add(node)
      
      const neighbors = graph[node] || []
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true
        }
      }
      
      recursionStack.delete(node)
      return false
    }
    
    for (const node of Object.keys(graph)) {
      if (!visited.has(node) && hasCycle(node)) {
        errors.push(`${PROFITABILITY_ERROR_CODES.ERR_ALLOC_LOOP_DETECTED}: Allocation loop detected in policy rules`)
        break
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate period closure status
   */
  async validatePeriodStatus(
    organizationId: string,
    period: string,
    allowedStatuses: string[] = ['OPEN', 'SOFT_CLOSE']
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    
    // This would check period closure status from database
    // For now, we'll implement basic date validation
    
    const [year, month] = period.split('-').map(Number)
    const periodDate = new Date(year, month - 1, 1)
    const currentDate = new Date()
    
    // Check if period is too far in the future
    const monthsInFuture = (currentDate.getFullYear() - year) * 12 + (currentDate.getMonth() - (month - 1))
    if (monthsInFuture < -2) {
      warnings.push(`Period ${period} is ${Math.abs(monthsInFuture)} months in the future`)
    }
    
    // Check if period is too old
    if (monthsInFuture > 24) {
      warnings.push(`Period ${period} is ${monthsInFuture} months old`)
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate CODM compliance
   */
  validateCODMCompliance(
    policy: CODMPolicy,
    profitCenters: any[]
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validate policy structure
    const policyValidation = validateCODMPolicy(policy)
    errors.push(...policyValidation.errors)
    warnings.push(...policyValidation.warnings)
    
    if (policy.include_only_codm) {
      // Check that all included profit centers have CODM segment mapping
      profitCenters.forEach(pc => {
        if (!pc.segment_code && !pc.codm_excluded) {
          warnings.push(`Profit center ${pc.code} lacks CODM segment mapping`)
        }
      })
    }
    
    // Validate presentation groups mapping
    const presentationGroups = Object.keys(policy.presentation_groups)
    const requiredGroups = ['Revenue', 'COGS', 'OpEx']
    
    requiredGroups.forEach(group => {
      if (!presentationGroups.includes(group)) {
        errors.push(`Required presentation group '${group}' is missing`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  private validateRunRequest(request: ProfitabilityRunRequest): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!request.organization_id || typeof request.organization_id !== 'string') {
      errors.push('Organization ID is required')
    }
    
    if (!request.period || typeof request.period !== 'string') {
      errors.push('Period is required')
    }
    
    if (!request.policy_ref || typeof request.policy_ref !== 'string') {
      errors.push('Policy reference is required')
    }
    
    if (request.dry_run !== undefined && typeof request.dry_run !== 'boolean') {
      warnings.push('dry_run should be a boolean value')
    }
    
    if (request.force_rerun !== undefined && typeof request.force_rerun !== 'boolean') {
      warnings.push('force_rerun should be a boolean value')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  private async validateAllocationDrivers(
    policy: AllocationAssessmentPolicy,
    period: string,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Validate driver availability for period
    for (const driver of policy.drivers) {
      // Check if driver data exists for the period
      // This would query the database to verify driver data availability
      
      if (driver.periodicity === 'yearly' && !period.endsWith('-12')) {
        warnings.push(`Driver '${driver.name}' is yearly but period ${period} is not December`)
      }
      
      // Validate driver measure
      if (!driver.measure || driver.measure.trim().length === 0) {
        errors.push(`Driver '${driver.name}' has invalid measure`)
      }
      
      // Check for negative driver values (would be done with actual data)
      // This is a placeholder for actual database validation
    }
  }
  
  private validateAllocationRules(
    policy: AllocationAssessmentPolicy,
    errors: string[],
    warnings: string[]
  ): void {
    // Check for overlapping rules
    const ruleSignatures = new Set<string>()
    
    policy.rules.forEach((rule, index) => {
      const signature = `${rule.basis}:${JSON.stringify(rule.from)}:${JSON.stringify(rule.to)}`
      
      if (ruleSignatures.has(signature)) {
        warnings.push(`Rule '${rule.name}' appears to be duplicate or overlapping`)
      }
      
      ruleSignatures.add(signature)
      
      // Validate rule criteria
      if (Object.keys(rule.from).length === 0) {
        errors.push(`Rule '${rule.name}' has empty 'from' criteria`)
      }
      
      if (Object.keys(rule.to).length === 0) {
        errors.push(`Rule '${rule.name}' has empty 'to' criteria`)
      }
      
      // Check for wildcard usage
      const hasWildcard = Object.values(rule.to).some(value => value === '*')
      if (hasWildcard && !rule.threshold) {
        warnings.push(`Rule '${rule.name}' uses wildcard without threshold - may create many small allocations`)
      }
    })
  }
  
  private serializeAllocationCriteria(criteria: Record<string, any>): string {
    return JSON.stringify(criteria, Object.keys(criteria).sort())
  }
}

// ============================================================================
// Exported Validation Functions
// ============================================================================

/**
 * Apply all profitability guardrails for allocation run
 */
export async function applyProfitabilityGuardrails(
  operation: 'allocation' | 'assessment' | 'settlement',
  request: ProfitabilityRunRequest,
  policy: AllocationAssessmentPolicy | SettlementPolicy,
  organizationId: string,
  existingRuns: any[] = []
): Promise<ValidationResult> {
  const engine = new ProfitabilityGuardrailsEngine(organizationId)
  
  switch (operation) {
    case 'allocation':
    case 'assessment':
      return engine.validateAllocationRun(
        request,
        policy as AllocationAssessmentPolicy,
        existingRuns
      )
    
    case 'settlement':
      return engine.validateSettlementRun(
        request,
        policy as SettlementPolicy,
        existingRuns
      )
    
    default:
      return {
        valid: false,
        errors: [`Unknown operation: ${operation}`],
        warnings: []
      }
  }
}

/**
 * Validate allocation weights for a specific driver
 */
export function validateAllocationDriver(
  driverName: string,
  driverValues: number[],
  tolerance: number = 0.001
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!driverName || typeof driverName !== 'string') {
    errors.push('Driver name is required')
  }
  
  if (!Array.isArray(driverValues) || driverValues.length === 0) {
    errors.push('Driver values array is required')
    return { valid: false, errors, warnings }
  }
  
  // Check for negative values
  const negativeValues = driverValues.filter(value => value < 0)
  if (negativeValues.length > 0) {
    errors.push(`${PROFITABILITY_ERROR_CODES.ERR_ALLOC_NEGATIVE_BASE}: Driver '${driverName}' contains negative values`)
  }
  
  // Check for all zero values
  const totalValue = driverValues.reduce((sum, value) => sum + Math.max(0, value), 0)
  if (totalValue === 0) {
    errors.push(`${PROFITABILITY_ERROR_CODES.ERR_ALLOC_DRIVER_MISSING}: Driver '${driverName}' has no positive values for allocation`)
  }
  
  // Validate calculated weights
  if (totalValue > 0) {
    const weights = driverValues.map(value => Math.max(0, value) / totalValue)
    const weightValidation = validateAllocationWeights(weights, tolerance)
    errors.push(...weightValidation.errors)
    warnings.push(...weightValidation.warnings)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate period closure for profitability operations
 */
export async function validatePeriodClosure(
  organizationId: string,
  period: string,
  operation: 'allocation' | 'assessment' | 'settlement'
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Basic period format validation
  const periodValidation = validatePeriod(period)
  errors.push(...periodValidation.errors)
  warnings.push(...periodValidation.warnings)
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }
  
  // Check period status (this would query actual period closure data)
  const [year, month] = period.split('-').map(Number)
  const periodDate = new Date(year, month - 1, 1)
  const currentDate = new Date()
  
  // Don't allow operations on future periods
  if (periodDate > currentDate) {
    errors.push(`${PROFITABILITY_ERROR_CODES.ERR_PERIOD_FUTURE}: Cannot perform ${operation} on future period ${period}`)
  }
  
  // Warn about operations on very old periods
  const monthsOld = (currentDate.getFullYear() - year) * 12 + (currentDate.getMonth() - (month - 1))
  if (monthsOld > 12) {
    warnings.push(`Performing ${operation} on period ${period} which is ${monthsOld} months old`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate reconciliation requirements
 */
export function validateReconciliationRequirements(
  factsTotal: Record<string, number>,
  glTotal: Record<string, number>,
  tolerance: number = 0.01
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check all currencies are present in both totals
  const factCurrencies = new Set(Object.keys(factsTotal))
  const glCurrencies = new Set(Object.keys(glTotal))
  
  const missingInGL = [...factCurrencies].filter(currency => !glCurrencies.has(currency))
  const missingInFacts = [...glCurrencies].filter(currency => !factCurrencies.has(currency))
  
  missingInGL.forEach(currency => {
    errors.push(`${PROFITABILITY_ERROR_CODES.ERR_CURRENCY_MISSING}: Currency ${currency} exists in profitability facts but not in GL`)
  })
  
  missingInFacts.forEach(currency => {
    errors.push(`${PROFITABILITY_ERROR_CODES.ERR_CURRENCY_MISSING}: Currency ${currency} exists in GL but not in profitability facts`)
  })
  
  // Check balances for common currencies
  const commonCurrencies = [...factCurrencies].filter(currency => glCurrencies.has(currency))
  
  commonCurrencies.forEach(currency => {
    const factsAmount = factsTotal[currency] || 0
    const glAmount = glTotal[currency] || 0
    const difference = Math.abs(factsAmount - glAmount)
    
    if (difference > tolerance) {
      errors.push(`${PROFITABILITY_ERROR_CODES.ERR_RECONCILE_FAILED}: Reconciliation failed for ${currency}: Facts=${factsAmount}, GL=${glAmount}, Diff=${difference}`)
    } else if (difference > tolerance / 10) {
      warnings.push(`Small reconciliation difference in ${currency}: ${difference.toFixed(4)}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

export default {
  ProfitabilityGuardrailsEngine,
  applyProfitabilityGuardrails,
  validateAllocationDriver,
  validatePeriodClosure,
  validateReconciliationRequirements
}