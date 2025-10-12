/**
 * HERA Profit Center v2: Guardrails Engine
 * 
 * Policy-as-data guardrails system for comprehensive profit center validation
 * including structure, dimensional requirements, and CODM compliance.
 * 
 * Smart Code: HERA.PROFITCENTER.GUARDRAILS.V2
 */

import {
  type ProfitCenter,
  type ProfitCenterCreateRequest,
  type ProfitCenterUpdateRequest,
  type ProfitCenterValidationError,
  type ProfitCenterValidationResult,
  validateProfitCenterCode,
  validateSegmentCode,
  validateValidityDates,
  validateTags,
  detectCycle,
  calculateProfitCenterDepth,
  isValidForCODMReporting,
  isProfitCenterValidForPosting
} from './profitcenter-v2-standard'

// ============================================================================
// Policy Definitions (Policy-as-Data)
// ============================================================================

export interface ProfitCenterStructurePolicy {
  policy: 'PROFIT_CENTER_STRUCTURE_V2'
  rules: {
    unique_pc_code_per_org: boolean
    no_cycles: boolean
    max_depth: number
    validity_dates_consistent: boolean
    codm_presence_if_reporting: boolean
  }
}

export interface COADimensionalPolicy {
  policy: 'COA_DIM_REQUIREMENTS_V2'
  ranges: Array<{
    range: string
    requires: string[]
    optional?: string[]
  }>
}

export interface PCCCAlignmentPolicy {
  policy: 'PC_CC_ALIGNMENT_V2'
  rules: {
    cc_must_map_to_pc_for_assessment: boolean
    pc_segment_consistency: boolean
  }
}

// Default policies
export const DEFAULT_PROFIT_CENTER_POLICIES: {
  structure: ProfitCenterStructurePolicy
  dimensional: COADimensionalPolicy
  alignment: PCCCAlignmentPolicy
} = {
  structure: {
    policy: 'PROFIT_CENTER_STRUCTURE_V2',
    rules: {
      unique_pc_code_per_org: true,
      no_cycles: true,
      max_depth: 6,
      validity_dates_consistent: true,
      codm_presence_if_reporting: true
    }
  },
  dimensional: {
    policy: 'COA_DIM_REQUIREMENTS_V2',
    ranges: [
      {
        range: '4xxx',
        requires: ['profit_center', 'product', 'region', 'channel'],
        optional: ['customer', 'project']
      },
      {
        range: '5xxx',
        requires: ['profit_center', 'product'],
        optional: ['region', 'channel', 'project']
      },
      {
        range: '6xxx',
        requires: ['cost_center'],
        optional: ['profit_center', 'project', 'region']
      }
    ]
  },
  alignment: {
    policy: 'PC_CC_ALIGNMENT_V2',
    rules: {
      cc_must_map_to_pc_for_assessment: true,
      pc_segment_consistency: true
    }
  }
}

// ============================================================================
// Guardrails Engine
// ============================================================================

export class ProfitCenterGuardrailsEngine {
  private structurePolicy: ProfitCenterStructurePolicy
  private dimensionalPolicy: COADimensionalPolicy
  private alignmentPolicy: PCCCAlignmentPolicy

  constructor(
    structurePolicy?: ProfitCenterStructurePolicy,
    dimensionalPolicy?: COADimensionalPolicy,
    alignmentPolicy?: PCCCAlignmentPolicy
  ) {
    this.structurePolicy = structurePolicy || DEFAULT_PROFIT_CENTER_POLICIES.structure
    this.dimensionalPolicy = dimensionalPolicy || DEFAULT_PROFIT_CENTER_POLICIES.dimensional
    this.alignmentPolicy = alignmentPolicy || DEFAULT_PROFIT_CENTER_POLICIES.alignment
  }

  /**
   * Validate profit center creation
   */
  async validateCreate(
    request: ProfitCenterCreateRequest,
    organizationId: string,
    existingProfitCenters: ProfitCenter[]
  ): Promise<ProfitCenterValidationResult> {
    const errors: ProfitCenterValidationError[] = []

    // 1. Basic field validation
    const codeValidation = validateProfitCenterCode(request.pc_code)
    if (!codeValidation.valid) {
      errors.push(...codeValidation.errors)
    }

    const segmentValidation = validateSegmentCode(request.segment_code)
    if (!segmentValidation.valid) {
      errors.push(...segmentValidation.errors)
    }

    const datesValidation = validateValidityDates(request.valid_from, request.valid_to)
    if (!datesValidation.valid) {
      errors.push(...datesValidation.errors)
    }

    const tagsValidation = validateTags(request.tags)
    if (!tagsValidation.valid) {
      errors.push(...tagsValidation.errors)
    }

    // 2. Structure policy validation
    if (this.structurePolicy.rules.unique_pc_code_per_org) {
      const duplicate = existingProfitCenters.find(pc => 
        pc.pc_code === request.pc_code && pc.status === 'ACTIVE'
      )
      if (duplicate) {
        errors.push({
          code: 'ERR_PC_DUPLICATE_CODE',
          message: `Profit center code ${request.pc_code} already exists in organization`,
          field: 'pc_code',
          value: request.pc_code
        })
      }
    }

    // 3. Parent relationship validation
    if (request.parent_id) {
      const parent = existingProfitCenters.find(pc => pc.id === request.parent_id)
      if (!parent) {
        errors.push({
          code: 'ERR_PC_PARENT_NOT_FOUND',
          message: `Parent profit center ${request.parent_id} not found`,
          field: 'parent_id',
          value: request.parent_id
        })
      } else if (parent.status === 'ARCHIVED') {
        errors.push({
          code: 'ERR_PC_ARCHIVED_PARENT',
          message: 'Cannot assign archived profit center as parent',
          field: 'parent_id',
          value: request.parent_id
        })
      } else {
        // Check depth limits
        const newDepth = calculateProfitCenterDepth(parent.depth)
        if (newDepth > this.structurePolicy.rules.max_depth) {
          errors.push({
            code: 'ERR_PC_MAX_DEPTH_EXCEEDED',
            message: `Maximum depth ${this.structurePolicy.rules.max_depth} exceeded (would be ${newDepth})`,
            field: 'parent_id',
            value: request.parent_id
          })
        }
      }
    }

    // 4. CODM validation
    if (this.structurePolicy.rules.codm_presence_if_reporting) {
      if (request.codm_inclusion === true && !request.segment_code) {
        errors.push({
          code: 'ERR_PC_CODM_MAPPING_REQUIRED',
          message: 'CODM inclusion requires valid segment mapping',
          field: 'codm_inclusion',
          value: request.codm_inclusion
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate profit center update
   */
  async validateUpdate(
    profitCenterId: string,
    request: ProfitCenterUpdateRequest,
    existingProfitCenter: ProfitCenter,
    allProfitCenters: ProfitCenter[]
  ): Promise<ProfitCenterValidationResult> {
    const errors: ProfitCenterValidationError[] = []

    // 1. Basic field validation (only for fields being updated)
    if (request.pc_code !== undefined) {
      const codeValidation = validateProfitCenterCode(request.pc_code)
      if (!codeValidation.valid) {
        errors.push(...codeValidation.errors)
      }

      // Check uniqueness if code is changing
      if (this.structurePolicy.rules.unique_pc_code_per_org && 
          request.pc_code !== existingProfitCenter.pc_code) {
        const duplicate = allProfitCenters.find(pc => 
          pc.pc_code === request.pc_code && pc.status === 'ACTIVE' && pc.id !== profitCenterId
        )
        if (duplicate) {
          errors.push({
            code: 'ERR_PC_DUPLICATE_CODE',
            message: `Profit center code ${request.pc_code} already exists in organization`,
            field: 'pc_code',
            value: request.pc_code
          })
        }
      }
    }

    if (request.segment_code !== undefined) {
      const segmentValidation = validateSegmentCode(request.segment_code)
      if (!segmentValidation.valid) {
        errors.push(...segmentValidation.errors)
      }
    }

    if (request.valid_from !== undefined || request.valid_to !== undefined) {
      const validFrom = request.valid_from !== undefined ? request.valid_from : existingProfitCenter.valid_from
      const validTo = request.valid_to !== undefined ? request.valid_to : existingProfitCenter.valid_to
      
      const datesValidation = validateValidityDates(validFrom, validTo)
      if (!datesValidation.valid) {
        errors.push(...datesValidation.errors)
      }
    }

    if (request.tags !== undefined) {
      const tagsValidation = validateTags(request.tags)
      if (!tagsValidation.valid) {
        errors.push(...tagsValidation.errors)
      }
    }

    // 2. Cycle detection if parent is changing
    if (request.parent_id !== undefined && request.parent_id !== existingProfitCenter.parent_id) {
      if (request.parent_id) {
        const parent = allProfitCenters.find(pc => pc.id === request.parent_id)
        if (!parent) {
          errors.push({
            code: 'ERR_PC_PARENT_NOT_FOUND',
            message: `Parent profit center ${request.parent_id} not found`,
            field: 'parent_id',
            value: request.parent_id
          })
        } else if (parent.status === 'ARCHIVED') {
          errors.push({
            code: 'ERR_PC_ARCHIVED_PARENT',
            message: 'Cannot assign archived profit center as parent',
            field: 'parent_id',
            value: request.parent_id
          })
        } else {
          // Check for cycles
          if (this.structurePolicy.rules.no_cycles) {
            const mockUpdatedPC: ProfitCenter = { ...existingProfitCenter, parent_id: request.parent_id }
            const mockAllPCs = allProfitCenters.map(pc => pc.id === profitCenterId ? mockUpdatedPC : pc)
            
            if (detectCycle(request.parent_id, profitCenterId, mockAllPCs)) {
              errors.push({
                code: 'ERR_PC_CYCLE_DETECTED',
                message: 'Setting this parent would create a cycle in the hierarchy',
                field: 'parent_id',
                value: request.parent_id
              })
            }
          }

          // Check depth limits
          const newDepth = calculateProfitCenterDepth(parent.depth)
          if (newDepth > this.structurePolicy.rules.max_depth) {
            errors.push({
              code: 'ERR_PC_MAX_DEPTH_EXCEEDED',
              message: `Maximum depth ${this.structurePolicy.rules.max_depth} exceeded (would be ${newDepth})`,
              field: 'parent_id',
              value: request.parent_id
            })
          }
        }
      }
    }

    // 3. CODM validation
    if (this.structurePolicy.rules.codm_presence_if_reporting) {
      const finalCODMInclusion = request.codm_inclusion !== undefined ? request.codm_inclusion : existingProfitCenter.codm_inclusion
      const finalSegmentCode = request.segment_code !== undefined ? request.segment_code : existingProfitCenter.segment_code
      
      if (finalCODMInclusion === true && !finalSegmentCode) {
        errors.push({
          code: 'ERR_PC_CODM_MAPPING_REQUIRED',
          message: 'CODM inclusion requires valid segment mapping',
          field: 'codm_inclusion',
          value: finalCODMInclusion
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate posting requirements for dimensional completeness
   */
  validatePostingRequirement(
    accountCode: string,
    profitCenterId?: string,
    allProfitCenters: ProfitCenter[] = [],
    postingDate: Date = new Date()
  ): ProfitCenterValidationResult {
    const errors: ProfitCenterValidationError[] = []

    // Determine account range
    const accountRange = this.getAccountRange(accountCode)
    
    // Find dimensional requirements for this range
    const requirements = this.dimensionalPolicy.ranges.find(r => r.range === accountRange)
    
    if (requirements && requirements.requires.includes('profit_center')) {
      if (!profitCenterId) {
        errors.push({
          code: 'ERR_DIM_MISSING_PROFIT_CENTER',
          message: `Profit center dimension required for account range ${accountRange}`,
          field: 'profit_center_id',
          value: null
        })
      } else {
        // Validate profit center exists and is valid for posting
        const profitCenter = allProfitCenters.find(pc => pc.id === profitCenterId)
        
        if (!profitCenter) {
          errors.push({
            code: 'ERR_PC_PARENT_NOT_FOUND',
            message: `Profit center ${profitCenterId} not found`,
            field: 'profit_center_id',
            value: profitCenterId
          })
        } else if (!isProfitCenterValidForPosting(profitCenter, postingDate)) {
          errors.push({
            code: 'ERR_PC_ARCHIVED_PARENT',
            message: `Profit center ${profitCenter.pc_code} not valid for posting on ${postingDate.toISOString().split('T')[0]}`,
            field: 'profit_center_id',
            value: profitCenterId
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
   * Validate profit center archival
   */
  validateArchive(
    profitCenter: ProfitCenter,
    allProfitCenters: ProfitCenter[],
    hasTransactions: boolean
  ): ProfitCenterValidationResult {
    const errors: ProfitCenterValidationError[] = []

    // Check for child profit centers
    const hasChildren = allProfitCenters.some(pc => 
      pc.parent_id === profitCenter.id && pc.status === 'ACTIVE'
    )

    if (hasChildren) {
      errors.push({
        code: 'ERR_PC_IN_USE',
        message: 'Cannot archive profit center with active child profit centers',
        field: 'status',
        value: 'ARCHIVED'
      })
    }

    // Check for transactions (if policy enforces)
    if (hasTransactions) {
      errors.push({
        code: 'ERR_PC_IN_USE',
        message: 'Cannot archive profit center with associated transactions',
        field: 'status',
        value: 'ARCHIVED'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Determine account range from account code
   */
  private getAccountRange(accountCode: string): string {
    if (accountCode.startsWith('4')) return '4xxx'
    if (accountCode.startsWith('5')) return '5xxx'
    if (accountCode.startsWith('6')) return '6xxx'
    return 'other'
  }
}

// ============================================================================
// Standalone Validation Functions
// ============================================================================

/**
 * Apply profit center guardrails validation
 */
export async function applyProfitCenterGuardrails(
  operation: 'create' | 'update',
  data: ProfitCenterCreateRequest | ProfitCenterUpdateRequest,
  organizationId: string,
  existingProfitCenters: ProfitCenter[],
  policies?: {
    structure?: ProfitCenterStructurePolicy
    dimensional?: COADimensionalPolicy
    alignment?: PCCCAlignmentPolicy
  }
): Promise<ProfitCenterValidationResult> {
  const engine = new ProfitCenterGuardrailsEngine(
    policies?.structure,
    policies?.dimensional,
    policies?.alignment
  )

  if (operation === 'create') {
    return engine.validateCreate(data as ProfitCenterCreateRequest, organizationId, existingProfitCenters)
  } else {
    // For update, we need the existing profit center and its ID
    // This should be provided in the data or handled by the calling function
    throw new Error('Update validation requires existing profit center data')
  }
}

/**
 * Validate posting profit center requirement
 */
export function validatePostingProfitCenter(
  accountCode: string,
  profitCenterId?: string,
  allProfitCenters: ProfitCenter[] = [],
  postingDate: Date = new Date()
): ProfitCenterValidationResult {
  const engine = new ProfitCenterGuardrailsEngine()
  return engine.validatePostingRequirement(accountCode, profitCenterId, allProfitCenters, postingDate)
}

/**
 * Validate profit center archive operation
 */
export function validateProfitCenterArchive(
  profitCenter: ProfitCenter,
  allProfitCenters: ProfitCenter[],
  hasTransactions: boolean
): ProfitCenterValidationResult {
  const engine = new ProfitCenterGuardrailsEngine()
  return engine.validateArchive(profitCenter, allProfitCenters, hasTransactions)
}

/**
 * Batch validate multiple profit centers
 */
export async function batchValidateProfitCenters(
  requests: ProfitCenterCreateRequest[],
  organizationId: string,
  existingProfitCenters: ProfitCenter[]
): Promise<ProfitCenterValidationResult[]> {
  const engine = new ProfitCenterGuardrailsEngine()
  const results: ProfitCenterValidationResult[] = []
  
  // Track codes being created in this batch to detect duplicates within the batch
  const batchCodes = new Set<string>()
  
  for (const request of requests) {
    // Check for duplicates within the batch
    if (batchCodes.has(request.pc_code)) {
      results.push({
        valid: false,
        errors: [{
          code: 'ERR_PC_DUPLICATE_CODE',
          message: `Duplicate profit center code ${request.pc_code} within batch`,
          field: 'pc_code',
          value: request.pc_code
        }]
      })
      continue
    }
    
    batchCodes.add(request.pc_code)
    
    // Validate individual request
    const result = await engine.validateCreate(request, organizationId, existingProfitCenters)
    results.push(result)
  }
  
  return results
}

/**
 * Validate CODM reporting requirements
 */
export function validateCODMRequirements(
  profitCenters: ProfitCenter[]
): ProfitCenterValidationResult {
  const errors: ProfitCenterValidationError[] = []
  
  const codmProfitCenters = profitCenters.filter(pc => pc.codm_inclusion === true)
  
  for (const pc of codmProfitCenters) {
    if (!pc.segment_code) {
      errors.push({
        code: 'ERR_PC_CODM_MAPPING_REQUIRED',
        message: `Profit center ${pc.pc_code} marked for CODM reporting but missing segment mapping`,
        field: 'segment_code',
        value: pc.id
      })
    }
    
    if (!isValidForCODMReporting(pc)) {
      errors.push({
        code: 'ERR_PC_CODM_MAPPING_REQUIRED',
        message: `Profit center ${pc.pc_code} not valid for CODM reporting`,
        field: 'codm_inclusion',
        value: pc.id
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export default ProfitCenterGuardrailsEngine