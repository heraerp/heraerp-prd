/**
 * HERA Profit Center v2: Standard Definitions & Types
 * 
 * Complete TypeScript interfaces, validation functions, and business logic
 * for Profit Center v2 master data with IFRS 8 (CODM) support.
 * 
 * Smart Code: HERA.PROFITCENTER.STANDARD.V2
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export interface ProfitCenter {
  id: string
  organization_id: string
  entity_type: 'PROFIT_CENTER'
  entity_name: string
  entity_code: string
  status: 'ACTIVE' | 'ARCHIVED'
  smart_code: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  
  // Dynamic data fields
  pc_code: string
  segment_code?: string
  depth: number
  parent_id?: string | null
  valid_from?: string
  valid_to?: string | null
  manager?: string
  region_code?: string
  tags?: string[]
  codm_inclusion?: boolean
}

export interface ProfitCenterCreateRequest {
  entity_name: string
  pc_code: string
  parent_id?: string | null
  segment_code?: string
  valid_from?: string
  valid_to?: string | null
  manager?: string
  region_code?: string
  tags?: string[]
  codm_inclusion?: boolean
  metadata?: Record<string, any>
}

export interface ProfitCenterUpdateRequest {
  entity_name?: string
  pc_code?: string
  parent_id?: string | null
  segment_code?: string
  valid_from?: string
  valid_to?: string | null
  manager?: string
  region_code?: string
  tags?: string[]
  codm_inclusion?: boolean
  metadata?: Record<string, any>
}

export interface ProfitCenterResponse {
  id: string
  entity_name: string
  pc_code: string
  segment_code?: string
  depth: number
  status: 'ACTIVE' | 'ARCHIVED'
  parent_id?: string | null
  valid_from?: string
  valid_to?: string | null
  manager?: string
  region_code?: string
  tags?: string[]
  codm_inclusion?: boolean
  audit_txn_id?: string
}

export interface ProfitCenterValidationError {
  code: string
  message: string
  field?: string
  value?: any
}

export interface ProfitCenterValidationResult {
  valid: boolean
  errors: ProfitCenterValidationError[]
}

// ============================================================================
// Smart Code Registry
// ============================================================================

export const PROFIT_CENTER_SMART_CODES = {
  // Entity smart codes
  ENTITY_PROFIT_CENTER: 'HERA.PROFITCENTER.ENTITY.PROFIT_CENTER.v2',
  
  // Dynamic data smart codes
  DYN_CODE: 'HERA.PROFITCENTER.DYN.CODE.v2',
  DYN_SEGMENT_CODE: 'HERA.PROFITCENTER.DYN.SEGMENT_CODE.v2',
  DYN_VALID_FROM: 'HERA.PROFITCENTER.DYN.VALID_FROM.v2',
  DYN_VALID_TO: 'HERA.PROFITCENTER.DYN.VALID_TO.v2',
  DYN_MANAGER: 'HERA.PROFITCENTER.DYN.MANAGER.v2',
  DYN_REGION_CODE: 'HERA.PROFITCENTER.DYN.REGION_CODE.v2',
  DYN_TAGS: 'HERA.PROFITCENTER.DYN.TAGS.v2',
  DYN_CODM_INCLUSION: 'HERA.PROFITCENTER.DYN.CODM_INCLUSION.v2',
  
  // Relationship smart codes
  REL_PARENT_OF: 'HERA.PROFITCENTER.REL.PARENT_OF.v2',
  REL_BELONGS_TO_SEGMENT: 'HERA.PROFITCENTER.REL.BELONGS_TO_SEGMENT.v2',
  REL_HAS_REGION: 'HERA.PROFITCENTER.REL.HAS_REGION.v2',
  REL_COST_CENTER_ASSIGNED: 'HERA.PROFITCENTER.REL.COST_CENTER_ASSIGNED.v2',
  
  // Transaction smart codes
  TXN_CREATE: 'HERA.PROFITCENTER.TXN.CREATE.v2',
  TXN_UPDATE: 'HERA.PROFITCENTER.TXN.UPDATE.v2',
  TXN_ARCHIVE: 'HERA.PROFITCENTER.TXN.ARCHIVE.v2',
  TXN_RESTORE: 'HERA.PROFITCENTER.TXN.RESTORE.v2',
  TXN_REL_UPSERT: 'HERA.PROFITCENTER.TXN.REL_UPSERT.v2',
  TXN_FIELD_SET: 'HERA.PROFITCENTER.TXN.FIELD_SET.v2',
  TXN_STATUS_CHANGE: 'HERA.PROFITCENTER.TXN.STATUS_CHANGE.v2'
} as const

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate profit center code format
 */
export function validateProfitCenterCode(pcCode: string): ProfitCenterValidationResult {
  const errors: ProfitCenterValidationError[] = []
  
  if (!pcCode || pcCode.trim().length === 0) {
    errors.push({
      code: 'ERR_PC_INVALID_CODE_FORMAT',
      message: 'Profit center code is required',
      field: 'pc_code',
      value: pcCode
    })
  } else if (pcCode.length < 3 || pcCode.length > 50) {
    errors.push({
      code: 'ERR_PC_INVALID_CODE_FORMAT',
      message: 'Profit center code must be between 3 and 50 characters',
      field: 'pc_code',
      value: pcCode
    })
  } else if (!/^[A-Za-z0-9_-]+$/.test(pcCode)) {
    errors.push({
      code: 'ERR_PC_INVALID_CODE_FORMAT',
      message: 'Profit center code can only contain letters, numbers, hyphens, and underscores',
      field: 'pc_code',
      value: pcCode
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate segment code format
 */
export function validateSegmentCode(segmentCode?: string): ProfitCenterValidationResult {
  const errors: ProfitCenterValidationError[] = []
  
  if (segmentCode !== undefined && segmentCode !== null) {
    if (segmentCode.trim().length === 0) {
      errors.push({
        code: 'ERR_PC_INVALID_SEGMENT_CODE',
        message: 'Segment code cannot be empty if provided',
        field: 'segment_code',
        value: segmentCode
      })
    } else if (segmentCode.length < 2 || segmentCode.length > 30) {
      errors.push({
        code: 'ERR_PC_INVALID_SEGMENT_CODE',
        message: 'Segment code must be between 2 and 30 characters',
        field: 'segment_code',
        value: segmentCode
      })
    } else if (!/^[A-Za-z0-9_-]+$/.test(segmentCode)) {
      errors.push({
        code: 'ERR_PC_INVALID_SEGMENT_CODE',
        message: 'Segment code can only contain letters, numbers, hyphens, and underscores',
        field: 'segment_code',
        value: segmentCode
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate validity date range
 */
export function validateValidityDates(validFrom?: string, validTo?: string): ProfitCenterValidationResult {
  const errors: ProfitCenterValidationError[] = []
  
  if (validFrom) {
    const fromDate = new Date(validFrom)
    if (isNaN(fromDate.getTime())) {
      errors.push({
        code: 'ERR_PC_INVALID_VALIDITY_DATES',
        message: 'Invalid valid_from date format',
        field: 'valid_from',
        value: validFrom
      })
    }
    
    if (validTo) {
      const toDate = new Date(validTo)
      if (isNaN(toDate.getTime())) {
        errors.push({
          code: 'ERR_PC_INVALID_VALIDITY_DATES',
          message: 'Invalid valid_to date format',
          field: 'valid_to',
          value: validTo
        })
      } else if (fromDate >= toDate) {
        errors.push({
          code: 'ERR_PC_INVALID_VALIDITY_DATES',
          message: 'valid_to date must be after valid_from date',
          field: 'valid_to',
          value: validTo
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
 * Validate tags array
 */
export function validateTags(tags?: string[]): ProfitCenterValidationResult {
  const errors: ProfitCenterValidationError[] = []
  
  if (tags && Array.isArray(tags)) {
    // Check for duplicates
    const uniqueTags = new Set(tags)
    if (uniqueTags.size !== tags.length) {
      errors.push({
        code: 'ERR_PC_INVALID_TAGS',
        message: 'Duplicate tags are not allowed',
        field: 'tags',
        value: tags
      })
    }
    
    // Validate each tag
    tags.forEach((tag, index) => {
      if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
        errors.push({
          code: 'ERR_PC_INVALID_TAGS',
          message: `Tags must be non-empty strings (invalid tag at index ${index})`,
          field: 'tags',
          value: tag
        })
      } else if (tag.length > 50) {
        errors.push({
          code: 'ERR_PC_INVALID_TAGS',
          message: `Tag "${tag}" exceeds maximum length of 50 characters`,
          field: 'tags',
          value: tag
        })
      } else if (!/^[A-Za-z0-9_-]+$/.test(tag)) {
        errors.push({
          code: 'ERR_PC_INVALID_TAGS',
          message: `Tag "${tag}" contains invalid characters. Only letters, numbers, hyphens, and underscores allowed`,
          field: 'tags',
          value: tag
        })
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate smart code format
 */
export function validateSmartCode(smartCode: string): boolean {
  // HERA smart code pattern: HERA.MODULE.SUBMODULE.TYPE.SUBTYPE.VERSION
  const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
  return pattern.test(smartCode)
}

// ============================================================================
// Business Logic Functions
// ============================================================================

/**
 * Calculate profit center depth based on parent depth
 */
export function calculateProfitCenterDepth(parentDepth: number | null | undefined): number {
  if (parentDepth === null || parentDepth === undefined || parentDepth === 0) {
    return 1
  }
  return parentDepth + 1
}

/**
 * Generate profit center code with standard format
 */
export function generateProfitCenterCode(prefix: string, segment: string, sequence: number): string {
  const segmentAbbr = segment.substring(0, 3).toUpperCase()
  const sequenceStr = sequence.toString().padStart(3, '0')
  return `${prefix}-${segmentAbbr}-${sequenceStr}`
}

/**
 * Detect cycles in profit center hierarchy
 */
export function detectCycle(
  potentialParentId: string,
  childId: string,
  profitCenters: ProfitCenter[]
): boolean {
  const visited = new Set<string>()
  
  function hasPath(fromId: string, toId: string): boolean {
    if (fromId === toId) return true
    if (visited.has(fromId)) return false
    
    visited.add(fromId)
    
    const children = profitCenters.filter(pc => pc.parent_id === fromId)
    for (const child of children) {
      if (hasPath(child.id, toId)) {
        return true
      }
    }
    
    return false
  }
  
  return hasPath(childId, potentialParentId)
}

/**
 * Build profit center path as array of codes
 */
export function buildProfitCenterPath(profitCenter: ProfitCenter, allProfitCenters: ProfitCenter[]): string[] {
  const path: string[] = []
  let current: ProfitCenter | undefined = profitCenter
  
  while (current) {
    path.unshift(current.pc_code)
    current = allProfitCenters.find(pc => pc.id === current?.parent_id)
  }
  
  return path
}

/**
 * Get all ancestors of a profit center
 */
export function getProfitCenterAncestors(profitCenterId: string, allProfitCenters: ProfitCenter[]): ProfitCenter[] {
  const ancestors: ProfitCenter[] = []
  let current = allProfitCenters.find(pc => pc.id === profitCenterId)
  
  while (current && current.parent_id) {
    const parent = allProfitCenters.find(pc => pc.id === current!.parent_id)
    if (parent) {
      ancestors.push(parent)
      current = parent
    } else {
      break
    }
  }
  
  return ancestors
}

/**
 * Get all descendants of a profit center
 */
export function getProfitCenterDescendants(profitCenterId: string, allProfitCenters: ProfitCenter[]): ProfitCenter[] {
  const descendants: ProfitCenter[] = []
  
  function addDescendants(parentId: string) {
    const children = allProfitCenters.filter(pc => pc.parent_id === parentId)
    children.forEach(child => {
      descendants.push(child)
      addDescendants(child.id)
    })
  }
  
  addDescendants(profitCenterId)
  return descendants
}

/**
 * Check if profit center is valid for CODM reporting
 */
export function isValidForCODMReporting(profitCenter: ProfitCenter): boolean {
  return profitCenter.status === 'ACTIVE' && 
         profitCenter.codm_inclusion === true &&
         (profitCenter.segment_code !== undefined && profitCenter.segment_code !== null)
}

/**
 * Check if profit center is valid for posting on a given date
 */
export function isProfitCenterValidForPosting(profitCenter: ProfitCenter, date: Date = new Date()): boolean {
  if (profitCenter.status !== 'ACTIVE') {
    return false
  }
  
  const checkDate = date.toISOString().split('T')[0]
  
  if (profitCenter.valid_from && checkDate < profitCenter.valid_from) {
    return false
  }
  
  if (profitCenter.valid_to && checkDate > profitCenter.valid_to) {
    return false
  }
  
  return true
}

// ============================================================================
// Standard Templates
// ============================================================================

export const STANDARD_PROFIT_CENTER_TEMPLATES = {
  // Salon Industry Templates
  SALON_MAIN_BRANCH: {
    entity_name: 'Main Salon Branch',
    pc_code: 'PC-MAIN-001',
    segment_code: 'SALON-OPERATIONS',
    codm_inclusion: true,
    tags: ['SALON', 'MAIN_BRANCH', 'CUSTOMER_FACING'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  SALON_SATELLITE_BRANCH: {
    entity_name: 'Satellite Salon Branch',
    pc_code: 'PC-SAT-001',
    segment_code: 'SALON-OPERATIONS',
    codm_inclusion: true,
    tags: ['SALON', 'SATELLITE_BRANCH', 'CUSTOMER_FACING'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  SALON_ADMIN: {
    entity_name: 'Salon Administration',
    pc_code: 'PC-ADMIN-001',
    segment_code: 'SALON-SUPPORT',
    codm_inclusion: false,
    tags: ['SALON', 'ADMIN', 'SUPPORT'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  // Restaurant Industry Templates
  RESTAURANT_DINING: {
    entity_name: 'Restaurant Dining',
    pc_code: 'PC-DINING-001',
    segment_code: 'RESTAURANT-OPERATIONS',
    codm_inclusion: true,
    tags: ['RESTAURANT', 'DINING', 'CUSTOMER_FACING'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  RESTAURANT_TAKEOUT: {
    entity_name: 'Restaurant Takeout',
    pc_code: 'PC-TAKEOUT-001',
    segment_code: 'RESTAURANT-OPERATIONS',
    codm_inclusion: true,
    tags: ['RESTAURANT', 'TAKEOUT', 'DELIVERY'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  RESTAURANT_CATERING: {
    entity_name: 'Restaurant Catering',
    pc_code: 'PC-CATERING-001',
    segment_code: 'RESTAURANT-CATERING',
    codm_inclusion: true,
    tags: ['RESTAURANT', 'CATERING', 'EVENTS'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  // Healthcare Industry Templates
  HEALTHCARE_OUTPATIENT: {
    entity_name: 'Outpatient Services',
    pc_code: 'PC-OUTPATIENT-001',
    segment_code: 'HEALTHCARE-CLINICAL',
    codm_inclusion: true,
    tags: ['HEALTHCARE', 'OUTPATIENT', 'CLINICAL'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  HEALTHCARE_PHARMACY: {
    entity_name: 'Pharmacy Services',
    pc_code: 'PC-PHARMACY-001',
    segment_code: 'HEALTHCARE-RETAIL',
    codm_inclusion: true,
    tags: ['HEALTHCARE', 'PHARMACY', 'RETAIL'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  // Manufacturing Industry Templates
  MANUFACTURING_PRODUCTION: {
    entity_name: 'Production Division',
    pc_code: 'PC-PRODUCTION-001',
    segment_code: 'MANUFACTURING-CORE',
    codm_inclusion: true,
    tags: ['MANUFACTURING', 'PRODUCTION', 'CORE'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  },
  
  MANUFACTURING_R_AND_D: {
    entity_name: 'Research & Development',
    pc_code: 'PC-RND-001',
    segment_code: 'MANUFACTURING-INNOVATION',
    codm_inclusion: false,
    tags: ['MANUFACTURING', 'R_AND_D', 'INNOVATION'],
    smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER
  }
} as const

// ============================================================================
// Error Codes and Messages
// ============================================================================

export const PROFIT_CENTER_ERROR_CODES = {
  ERR_PC_INVALID_REQUEST: 'Invalid request format or missing required fields',
  ERR_PC_DUPLICATE_CODE: 'Profit center code already exists in organization',
  ERR_PC_INVALID_CODE_FORMAT: 'Invalid profit center code format',
  ERR_PC_INVALID_SEGMENT_CODE: 'Invalid segment code format',
  ERR_PC_INVALID_VALIDITY_DATES: 'Invalid validity date range',
  ERR_PC_INVALID_TAGS: 'Invalid tags format or content',
  ERR_PC_PARENT_NOT_FOUND: 'Parent profit center not found',
  ERR_PC_ARCHIVED_PARENT: 'Cannot assign archived profit center as parent',
  ERR_PC_CYCLE_DETECTED: 'Circular reference detected in hierarchy',
  ERR_PC_MAX_DEPTH_EXCEEDED: 'Maximum hierarchy depth exceeded',
  ERR_PC_IN_USE: 'Profit center cannot be archived - in use by transactions or child profit centers',
  ERR_PC_CODM_MAPPING_REQUIRED: 'CODM inclusion requires valid segment mapping',
  ERR_DIM_MISSING_PROFIT_CENTER: 'Profit center dimension required for this account range',
  ERR_PC_CREATE_FAILED: 'Failed to create profit center',
  ERR_PC_UPDATE_FAILED: 'Failed to update profit center',
  ERR_PC_ARCHIVE_FAILED: 'Failed to archive profit center',
  ERR_PC_READ_FAILED: 'Failed to read profit centers',
  ERR_PC_GUARDRAILS_FAILED: 'Profit center guardrails validation failed',
  ERR_PC_VALIDATION_FAILED: 'Profit center validation failed',
  ERR_PC_BATCH_FAILED: 'Batch operation failed'
} as const

// ============================================================================
// Validation Matrix for Acceptance Criteria
// ============================================================================

export const PROFIT_CENTER_VALIDATION_MATRIX = {
  // Structure validation
  UNIQUE_PC_CODE_PER_ORG: true,
  NO_CYCLES_IN_HIERARCHY: true,
  MAX_DEPTH_SIX_LEVELS: true,
  VALIDITY_DATES_CONSISTENT: true,
  
  // CODM validation
  CODM_REQUIRES_SEGMENT: true,
  CODM_INCLUSION_BOOLEAN: true,
  
  // Posting requirements
  REVENUE_REQUIRES_PC: true, // 4xxx accounts
  COGS_REQUIRES_PC: true,    // 5xxx accounts
  OPEX_PC_OPTIONAL: true,    // 6xxx accounts (optional based on policy)
  
  // Audit requirements
  COMPLETE_AUDIT_TRAIL: true,
  GRANULAR_FIELD_TRACKING: true,
  RELATIONSHIP_TRACKING: true,
  
  // Performance requirements
  TREE_VIEW_SUB_200MS: true,
  UPSERT_RPC_SUB_80MS: true,
  MATERIALIZED_VIEWS: true
} as const

export default {
  PROFIT_CENTER_SMART_CODES,
  STANDARD_PROFIT_CENTER_TEMPLATES,
  PROFIT_CENTER_ERROR_CODES,
  PROFIT_CENTER_VALIDATION_MATRIX,
  validateProfitCenterCode,
  validateSegmentCode,
  validateValidityDates,
  validateTags,
  validateSmartCode,
  calculateProfitCenterDepth,
  generateProfitCenterCode,
  detectCycle,
  buildProfitCenterPath,
  getProfitCenterAncestors,
  getProfitCenterDescendants,
  isValidForCODMReporting,
  isProfitCenterValidForPosting
}