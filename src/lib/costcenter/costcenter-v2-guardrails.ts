/**
 * HERA Cost Center v2: Guardrails Engine
 * 
 * Policy-as-data guardrails applied at cost center create/update and posting time.
 * Zero code changes required - all rules stored as JSON policies.
 * 
 * Smart Code: HERA.COSTCENTER.GUARDRAILS.ENGINE.V2
 */

import {
  type CostCenter,
  type CostCenterCreateRequest,
  type CostCenterUpdateRequest,
  type CostCenterValidationError,
  type CostCenterStructurePolicy,
  type CostCenterDimensionalPolicy,
  type CostCenterAlignmentPolicy,
  COST_CENTER_ERROR_CODES,
  DEFAULT_COST_CENTER_STRUCTURE_POLICY,
  DEFAULT_COST_CENTER_DIMENSIONAL_POLICY,
  DEFAULT_COST_CENTER_ALIGNMENT_POLICY,
  calculateCostCenterDepth,
  validateCostCenterCode,
  validateCostCenterType,
  validateValidityDates,
  validateTags,
  validateSmartCode,
  detectCycle
} from './costcenter-v2-standard'

// ============================================================================
// Guardrails Engine Core
// ============================================================================

export class CostCenterGuardrailsEngine {
  private structurePolicy: CostCenterStructurePolicy
  private dimensionalPolicy: CostCenterDimensionalPolicy
  private alignmentPolicy: CostCenterAlignmentPolicy

  constructor(
    structurePolicy: CostCenterStructurePolicy = DEFAULT_COST_CENTER_STRUCTURE_POLICY,
    dimensionalPolicy: CostCenterDimensionalPolicy = DEFAULT_COST_CENTER_DIMENSIONAL_POLICY,
    alignmentPolicy: CostCenterAlignmentPolicy = DEFAULT_COST_CENTER_ALIGNMENT_POLICY
  ) {
    this.structurePolicy = structurePolicy
    this.dimensionalPolicy = dimensionalPolicy
    this.alignmentPolicy = alignmentPolicy
  }

  /**
   * Validate cost center creation request
   */
  async validateCreate(
    request: CostCenterCreateRequest,
    organizationId: string,
    existingCostCenters: CostCenter[] = []
  ): Promise<{ valid: boolean; errors: CostCenterValidationError[] }> {
    const errors: CostCenterValidationError[] = []

    // 1. Validate cost center code format
    const codeValidation = validateCostCenterCode(request.cc_code)
    if (!codeValidation.valid) {
      errors.push({
        code: 'ERR_CC_INVALID_CODE_FORMAT',
        message: codeValidation.errors.join(', '),
        field: 'cc_code',
        value: request.cc_code
      })
    }

    // 2. Check uniqueness per organization
    if (this.isRuleEnforced('unique_cc_code_per_org')) {
      const duplicate = existingCostCenters.find(
        cc => cc.cc_code === request.cc_code && cc.status === 'ACTIVE'
      )
      if (duplicate) {
        errors.push({
          code: 'ERR_CC_DUPLICATE_CODE',
          message: `Cost center code ${request.cc_code} already exists`,
          field: 'cc_code',
          value: request.cc_code
        })
      }
    }

    // 3. Validate cost center type
    const typeValidation = validateCostCenterType(request.cost_center_type)
    if (!typeValidation.valid) {
      errors.push({
        code: 'ERR_CC_INVALID_TYPE',
        message: typeValidation.errors.join(', '),
        field: 'cost_center_type',
        value: request.cost_center_type
      })
    }

    // 4. Validate validity dates
    if (request.valid_from || request.valid_to) {
      const datesValidation = validateValidityDates(request.valid_from, request.valid_to)
      if (!datesValidation.valid) {
        errors.push({
          code: 'ERR_CC_INVALID_VALIDITY_DATES',
          message: datesValidation.errors.join(', '),
          field: 'validity_dates',
          value: { valid_from: request.valid_from, valid_to: request.valid_to }
        })
      }
    }

    // 5. Validate tags format
    if (request.tags && request.tags.length > 0) {
      const tagsValidation = validateTags(request.tags)
      if (!tagsValidation.valid) {
        errors.push({
          code: 'ERR_CC_INVALID_TAGS',
          message: tagsValidation.errors.join(', '),
          field: 'tags',
          value: request.tags
        })
      }
    }

    // 6. Validate parent relationship (if parent_id provided)
    if (request.parent_id) {
      const parent = existingCostCenters.find(cc => cc.id === request.parent_id)
      if (!parent) {
        errors.push({
          code: 'ERR_CC_PARENT_NOT_FOUND',
          message: `Parent cost center ${request.parent_id} not found`,
          field: 'parent_id',
          value: request.parent_id
        })
      } else {
        // Check if parent is active
        if (this.isRuleEnforced('active_parent_required') && parent.status !== 'ACTIVE') {
          errors.push({
            code: 'ERR_CC_ARCHIVED_PARENT',
            message: `Parent cost center ${parent.cc_code} is not active`,
            field: 'parent_id',
            value: request.parent_id
          })
        }

        // Check depth limits
        const newDepth = calculateCostCenterDepth(parent.depth)
        const maxDepth = this.getMaxDepth()
        if (newDepth > maxDepth) {
          errors.push({
            code: 'ERR_CC_MAX_DEPTH_EXCEEDED',
            message: `Cost center depth ${newDepth} exceeds maximum allowed depth ${maxDepth}`,
            field: 'parent_id',
            value: request.parent_id
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate cost center update request
   */
  async validateUpdate(
    costCenterId: string,
    request: CostCenterUpdateRequest,
    existingCostCenter: CostCenter,
    allCostCenters: CostCenter[] = []
  ): Promise<{ valid: boolean; errors: CostCenterValidationError[] }> {
    const errors: CostCenterValidationError[] = []

    // 1. If changing cost center code, validate new code
    if (request.cc_code && request.cc_code !== existingCostCenter.cc_code) {
      const codeValidation = validateCostCenterCode(request.cc_code)
      if (!codeValidation.valid) {
        errors.push({
          code: 'ERR_CC_INVALID_CODE_FORMAT',
          message: codeValidation.errors.join(', '),
          field: 'cc_code',
          value: request.cc_code
        })
      }

      // Check uniqueness
      if (this.isRuleEnforced('unique_cc_code_per_org')) {
        const duplicate = allCostCenters.find(
          cc => cc.cc_code === request.cc_code && 
               cc.id !== costCenterId && 
               cc.status === 'ACTIVE'
        )
        if (duplicate) {
          errors.push({
            code: 'ERR_CC_DUPLICATE_CODE',
            message: `Cost center code ${request.cc_code} already exists`,
            field: 'cc_code',
            value: request.cc_code
          })
        }
      }
    }

    // 2. If changing cost center type, validate
    if (request.cost_center_type) {
      const typeValidation = validateCostCenterType(request.cost_center_type)
      if (!typeValidation.valid) {
        errors.push({
          code: 'ERR_CC_INVALID_TYPE',
          message: typeValidation.errors.join(', '),
          field: 'cost_center_type',
          value: request.cost_center_type
        })
      }
    }

    // 3. If changing validity dates, validate
    if (request.valid_from !== undefined || request.valid_to !== undefined) {
      const newValidFrom = request.valid_from ?? existingCostCenter.valid_from
      const newValidTo = request.valid_to ?? existingCostCenter.valid_to
      
      const datesValidation = validateValidityDates(newValidFrom, newValidTo)
      if (!datesValidation.valid) {
        errors.push({
          code: 'ERR_CC_INVALID_VALIDITY_DATES',
          message: datesValidation.errors.join(', '),
          field: 'validity_dates',
          value: { valid_from: newValidFrom, valid_to: newValidTo }
        })
      }
    }

    // 4. If changing tags, validate
    if (request.tags) {
      const tagsValidation = validateTags(request.tags)
      if (!tagsValidation.valid) {
        errors.push({
          code: 'ERR_CC_INVALID_TAGS',
          message: tagsValidation.errors.join(', '),
          field: 'tags',
          value: request.tags
        })
      }
    }

    // 5. If changing parent, validate hierarchy
    if (request.parent_id !== undefined) {
      if (request.parent_id) {
        const parent = allCostCenters.find(cc => cc.id === request.parent_id)
        if (!parent) {
          errors.push({
            code: 'ERR_CC_PARENT_NOT_FOUND',
            message: `Parent cost center ${request.parent_id} not found`,
            field: 'parent_id',
            value: request.parent_id
          })
        } else {
          // Check for cycles
          if (this.isRuleEnforced('no_cycles')) {
            if (detectCycle(costCenterId, request.parent_id, allCostCenters)) {
              errors.push({
                code: 'ERR_CC_CYCLE_DETECTED',
                message: `Setting parent would create a cycle in the hierarchy`,
                field: 'parent_id',
                value: request.parent_id
              })
            }
          }

          // Check if parent is active
          if (this.isRuleEnforced('active_parent_required') && parent.status !== 'ACTIVE') {
            errors.push({
              code: 'ERR_CC_ARCHIVED_PARENT',
              message: `Parent cost center ${parent.cc_code} is not active`,
              field: 'parent_id',
              value: request.parent_id
            })
          }

          // Check depth limits
          const newDepth = calculateCostCenterDepth(parent.depth)
          const maxDepth = this.getMaxDepth()
          if (newDepth > maxDepth) {
            errors.push({
              code: 'ERR_CC_MAX_DEPTH_EXCEEDED',
              message: `Cost center depth ${newDepth} exceeds maximum allowed depth ${maxDepth}`,
              field: 'parent_id',
              value: request.parent_id
            })
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate cost center requirement for posting transactions
   */
  validatePostingRequirement(
    accountNumber: string,
    costCenterId?: string,
    allCostCenters: CostCenter[] = []
  ): { valid: boolean; errors: CostCenterValidationError[] } {
    const errors: CostCenterValidationError[] = []
    
    // Check if account range requires cost center
    const accountRange = accountNumber.charAt(0) + 'xxx'
    const rangePolicy = this.dimensionalPolicy.ranges.find(r => r.range === accountRange)
    
    if (rangePolicy && rangePolicy.requires.includes('cost_center')) {
      if (!costCenterId) {
        errors.push({
          code: 'ERR_DIM_MISSING_COST_CENTER',
          message: `Cost center is required for posting to ${accountRange} accounts`,
          field: 'cost_center_id',
          value: costCenterId
        })
      } else {
        // Validate that cost center exists and is active
        const costCenter = allCostCenters.find(cc => cc.id === costCenterId)
        if (!costCenter) {
          errors.push({
            code: 'ERR_CC_PARENT_NOT_FOUND',
            message: `Cost center ${costCenterId} not found`,
            field: 'cost_center_id',
            value: costCenterId
          })
        } else if (costCenter.status !== 'ACTIVE') {
          errors.push({
            code: 'ERR_CC_ARCHIVED_PARENT',
            message: `Cost center ${costCenter.cc_code} is not active`,
            field: 'cost_center_id',
            value: costCenterId
          })
        } else {
          // Check validity dates if posting date is available
          const today = new Date().toISOString().split('T')[0]
          if (costCenter.valid_from && today < costCenter.valid_from) {
            errors.push({
              code: 'ERR_CC_INVALID_VALIDITY_DATES',
              message: `Cost center ${costCenter.cc_code} is not yet valid`,
              field: 'cost_center_id',
              value: costCenterId
            })
          }
          if (costCenter.valid_to && today > costCenter.valid_to) {
            errors.push({
              code: 'ERR_CC_INVALID_VALIDITY_DATES',
              message: `Cost center ${costCenter.cc_code} is no longer valid`,
              field: 'cost_center_id',
              value: costCenterId
            })
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate cost center archive request
   */
  validateArchive(
    costCenter: CostCenter,
    allCostCenters: CostCenter[],
    hasTransactions: boolean = false
  ): { valid: boolean; errors: CostCenterValidationError[] } {
    const errors: CostCenterValidationError[] = []

    // Check if cost center has active child cost centers
    const activeChildren = allCostCenters.filter(cc => 
      cc.parent_id === costCenter.id && cc.status === 'ACTIVE'
    )
    
    if (activeChildren.length > 0) {
      errors.push({
        code: 'ERR_CC_IN_USE',
        message: `Cannot archive cost center with ${activeChildren.length} active child cost centers`,
        field: 'status',
        value: 'ARCHIVED'
      })
    }

    // Check if cost center has transactions (if policy enforces)
    if (hasTransactions && this.isRuleEnforced('no_archive_with_transactions')) {
      errors.push({
        code: 'ERR_CC_IN_USE',
        message: `Cannot archive cost center with existing transactions`,
        field: 'status',
        value: 'ARCHIVED'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private isRuleEnforced(ruleName: string): boolean {
    const rule = this.structurePolicy.rules.find(r => r.name === ruleName)
    return rule?.enforce === true
  }

  private getMaxDepth(): number {
    const rule = this.structurePolicy.rules.find(r => r.name === 'max_depth')
    return rule?.value || 6
  }

  private isAlignmentRuleEnforced(ruleName: string): boolean {
    const rule = this.alignmentPolicy.rules.find(r => r.name === ruleName)
    return rule?.enforce === true
  }
}

// ============================================================================
// Guardrails Application Functions
// ============================================================================

/**
 * Apply all cost center guardrails before create/update operations
 */
export async function applyCostCenterGuardrails(
  operation: 'create' | 'update',
  request: CostCenterCreateRequest | CostCenterUpdateRequest,
  organizationId: string,
  existingCostCenters: CostCenter[] = [],
  costCenterId?: string
): Promise<{ valid: boolean; errors: CostCenterValidationError[] }> {
  const guardrails = new CostCenterGuardrailsEngine()

  if (operation === 'create') {
    return guardrails.validateCreate(request as CostCenterCreateRequest, organizationId, existingCostCenters)
  } else {
    const existingCostCenter = existingCostCenters.find(cc => cc.id === costCenterId)
    if (!existingCostCenter) {
      return {
        valid: false,
        errors: [{
          code: 'ERR_CC_PARENT_NOT_FOUND',
          message: `Cost center ${costCenterId} not found`,
          field: 'id',
          value: costCenterId
        }]
      }
    }
    return guardrails.validateUpdate(costCenterId!, request as CostCenterUpdateRequest, existingCostCenter, existingCostCenters)
  }
}

/**
 * Validate posting transaction against cost center requirements
 */
export function validatePostingCostCenter(
  accountNumber: string,
  costCenterId?: string,
  allCostCenters: CostCenter[] = []
): { valid: boolean; errors: CostCenterValidationError[] } {
  const guardrails = new CostCenterGuardrailsEngine()
  return guardrails.validatePostingRequirement(accountNumber, costCenterId, allCostCenters)
}

/**
 * Check if cost center can be safely archived
 */
export function validateCostCenterArchive(
  costCenter: CostCenter,
  allCostCenters: CostCenter[],
  hasTransactions: boolean = false
): { valid: boolean; errors: CostCenterValidationError[] } {
  const guardrails = new CostCenterGuardrailsEngine()
  return guardrails.validateArchive(costCenter, allCostCenters, hasTransactions)
}

/**
 * Batch validate multiple cost centers
 */
export async function batchValidateCostCenters(
  costCenters: (CostCenterCreateRequest | CostCenterUpdateRequest)[],
  organizationId: string,
  existingCostCenters: CostCenter[] = []
): Promise<Array<{ valid: boolean; errors: CostCenterValidationError[]; index: number }>> {
  const results = []
  
  for (let i = 0; i < costCenters.length; i++) {
    const costCenter = costCenters[i]!
    const operation = 'id' in costCenter ? 'update' : 'create'
    
    const validation = await applyCostCenterGuardrails(
      operation,
      costCenter,
      organizationId,
      existingCostCenters,
      'id' in costCenter ? (costCenter as any).id : undefined
    )
    
    results.push({
      ...validation,
      index: i
    })
  }
  
  return results
}

/**
 * Validate cross-entity alignment (cost center to profit center)
 */
export function validateCostCenterAlignment(
  costCenter: CostCenter,
  profitCenters: any[] = [],
  segments: any[] = []
): { valid: boolean; errors: CostCenterValidationError[] } {
  const errors: CostCenterValidationError[] = []
  
  // This is a placeholder for future cross-entity validation
  // In a full implementation, this would check alignment policies
  // between cost centers, profit centers, and business segments
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export default CostCenterGuardrailsEngine