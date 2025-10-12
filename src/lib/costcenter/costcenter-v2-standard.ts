/**
 * HERA Cost Center v2: Enterprise-Grade Cost Center Standard
 * 
 * Bulletproof, multi-tenant, zero-schema-change cost center system
 * with policy-as-data guardrails and complete audit trails.
 * 
 * Smart Code: HERA.COSTCENTER.STANDARD.V2
 */

// ============================================================================
// 1) Cost Center Types and Interfaces (Six-Table Mapping)
// ============================================================================

export interface CostCenter {
  // From core_entities
  id: string
  organization_id: string
  entity_type: 'COST_CENTER'
  entity_name: string
  entity_code?: string
  status: 'ACTIVE' | 'ARCHIVED'
  smart_code: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  
  // From core_dynamic_data (required fields)
  cc_code: string                    // "CC-OPS-UK-001" - unique per org
  depth: number                      // Integer depth in hierarchy
  cost_center_type: string           // "ADMIN" | "PRODUCTION" | "SALES" | "SERVICE"
  
  // From core_dynamic_data (optional but recommended)
  valid_from?: string               // Date
  valid_to?: string                 // Date (null = indefinite)
  responsible_person?: string       // Employee ID or name
  segment?: string                  // Business segment
  allocation_policy_ref?: Record<string, any> // For future allocation rules
  tags?: string[]                   // ["HQ", "UK", "Ops"]
  
  // From core_relationships
  parent_id?: string                // Parent cost center ID
  children?: CostCenter[]           // Child cost centers (for tree view)
  sort_order?: number               // Display order within parent
}

export interface CostCenterCreateRequest {
  entity_name: string
  cc_code: string
  cost_center_type: string
  parent_id?: string
  valid_from?: string
  valid_to?: string
  responsible_person?: string
  segment?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CostCenterUpdateRequest {
  entity_name?: string
  cc_code?: string
  cost_center_type?: string
  parent_id?: string
  valid_from?: string
  valid_to?: string
  responsible_person?: string
  segment?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CostCenterResponse {
  id: string
  entity_name: string
  cc_code: string
  depth: number
  cost_center_type: string
  status: 'ACTIVE' | 'ARCHIVED'
  parent_id?: string
  valid_from?: string
  valid_to?: string
  responsible_person?: string
  segment?: string
  tags?: string[]
  audit_txn_id: string
}

// ============================================================================
// 2) Cost Center Types and Categories
// ============================================================================

export const COST_CENTER_TYPES = {
  ADMIN: 'ADMIN',                    // Administrative/overhead
  PRODUCTION: 'PRODUCTION',          // Direct production activities
  SALES: 'SALES',                    // Sales and marketing
  SERVICE: 'SERVICE',                // Customer service/support
  FINANCE: 'FINANCE',                // Financial operations
  HR: 'HR',                          // Human resources
  IT: 'IT',                          // Information technology
  FACILITY: 'FACILITY',              // Facilities management
  R_AND_D: 'R_AND_D'                 // Research and development
} as const

export type CostCenterType = keyof typeof COST_CENTER_TYPES

// ============================================================================
// 3) Guardrails (Policy-as-Data)
// ============================================================================

export interface CostCenterStructurePolicy {
  policy: 'COST_CENTER_STRUCTURE_V2'
  rules: Array<{
    name: string
    scope?: string
    enforce: boolean
    value?: any
    map?: Record<string, any>
  }>
}

export interface CostCenterDimensionalPolicy {
  policy: 'COA_DIM_REQUIREMENTS_V2'
  ranges: Array<{
    range: string
    requires: string[]
    optional: string[]
  }>
}

export interface CostCenterAlignmentPolicy {
  policy: 'CC_PC_ALIGNMENT_V2'
  rules: Array<{
    name: string
    enforce: boolean
    description?: string
  }>
}

export const DEFAULT_COST_CENTER_STRUCTURE_POLICY: CostCenterStructurePolicy = {
  policy: 'COST_CENTER_STRUCTURE_V2',
  rules: [
    { name: 'unique_cc_code_per_org', enforce: true },
    { name: 'no_cycles', enforce: true },
    { name: 'max_depth', value: 6, enforce: true },
    { name: 'validity_dates_consistent', enforce: true },
    { name: 'active_parent_required', enforce: true }
  ]
}

export const DEFAULT_COST_CENTER_DIMENSIONAL_POLICY: CostCenterDimensionalPolicy = {
  policy: 'COA_DIM_REQUIREMENTS_V2',
  ranges: [
    { 
      range: '6xxx', 
      requires: ['cost_center'], 
      optional: ['profit_center', 'project', 'region'] 
    },
    { 
      range: '5xxx', 
      requires: ['profit_center', 'product'], 
      optional: ['cost_center'] 
    }
  ]
}

export const DEFAULT_COST_CENTER_ALIGNMENT_POLICY: CostCenterAlignmentPolicy = {
  policy: 'CC_PC_ALIGNMENT_V2',
  rules: [
    { 
      name: 'cc_must_roll_to_segment_if_pc_rolls_to_segment', 
      enforce: false,
      description: 'Cost centers should align with profit center segment mappings'
    }
  ]
}

// ============================================================================
// 4) Smart Code Canonical Set (v2)
// ============================================================================

export const COST_CENTER_SMART_CODES = {
  // Entities
  ENTITY_COST_CENTER: 'HERA.COSTCENTER.ENTITY.COST_CENTER.v2',
  
  // Dynamic Data Fields
  DYN_CODE: 'HERA.COSTCENTER.DYN.CODE.v2',
  DYN_DEPTH: 'HERA.COSTCENTER.DYN.DEPTH.v2',
  DYN_TYPE: 'HERA.COSTCENTER.DYN.TYPE.v2',
  DYN_VALID_FROM: 'HERA.COSTCENTER.DYN.VALID_FROM.v2',
  DYN_VALID_TO: 'HERA.COSTCENTER.DYN.VALID_TO.v2',
  DYN_RESPONSIBLE_PERSON: 'HERA.COSTCENTER.DYN.RESPONSIBLE_PERSON.v2',
  DYN_SEGMENT: 'HERA.COSTCENTER.DYN.SEGMENT.v2',
  DYN_ALLOCATION_POLICY: 'HERA.COSTCENTER.DYN.ALLOCATION_POLICY.v2',
  DYN_TAGS: 'HERA.COSTCENTER.DYN.TAGS.v2',
  
  // Relationships
  REL_PARENT_OF: 'HERA.COSTCENTER.REL.PARENT_OF.v2',
  REL_ASSIGNED_TO_PC: 'HERA.COSTCENTER.REL.ASSIGNED_TO_PC.v2',
  REL_ROLLS_UP_TO_SEGMENT: 'HERA.COSTCENTER.REL.ROLLS_UP_TO_SEGMENT.v2',
  
  // Transactions
  TXN_CREATE: 'HERA.COSTCENTER.TXN.CREATE.v2',
  TXN_UPDATE: 'HERA.COSTCENTER.TXN.UPDATE.v2',
  TXN_ARCHIVE: 'HERA.COSTCENTER.TXN.ARCHIVE.v2',
  TXN_RESTORE: 'HERA.COSTCENTER.TXN.RESTORE.v2',
  TXN_REL_UPSERT: 'HERA.COSTCENTER.TXN.REL_UPSERT.v2',
  TXN_FIELD_SET: 'HERA.COSTCENTER.TXN.FIELD_SET.v2'
} as const

// Regex rule for CI guard
export const COST_CENTER_SMART_CODE_REGEX = /^HERA\.COSTCENTER\.[A-Z0-9_]{2,30}(?:\.[A-Z0-9_]{2,30}){2,6}\.v[0-9]+$/

// ============================================================================
// 5) Utility Functions
// ============================================================================

export function calculateCostCenterDepth(parentDepth: number | null): number {
  return (parentDepth || 0) + 1
}

export function generateCostCenterCode(prefix: string, type: string, sequence: number): string {
  const typeCode = type.substring(0, 3).toUpperCase()
  const seqCode = sequence.toString().padStart(3, '0')
  return `${prefix}-${typeCode}-${seqCode}`
}

export function validateCostCenterCode(ccCode: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Must not be empty
  if (!ccCode || ccCode.trim().length === 0) {
    errors.push('Cost center code is required')
  }
  
  // Length constraints
  if (ccCode.length < 3 || ccCode.length > 50) {
    errors.push('Cost center code must be between 3 and 50 characters')
  }
  
  // Must contain only alphanumeric characters, hyphens, and underscores
  if (!/^[A-Za-z0-9_-]+$/.test(ccCode)) {
    errors.push('Cost center code can only contain letters, numbers, hyphens, and underscores')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateCostCenterType(type: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!type) {
    errors.push('Cost center type is required')
  } else if (!Object.values(COST_CENTER_TYPES).includes(type as CostCenterType)) {
    errors.push(`Invalid cost center type. Must be one of: ${Object.values(COST_CENTER_TYPES).join(', ')}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateValidityDates(validFrom?: string, validTo?: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (validFrom && validTo) {
    const fromDate = new Date(validFrom)
    const toDate = new Date(validTo)
    
    if (isNaN(fromDate.getTime())) {
      errors.push('Invalid valid_from date format')
    }
    
    if (isNaN(toDate.getTime())) {
      errors.push('Invalid valid_to date format')
    }
    
    if (fromDate.getTime() >= toDate.getTime()) {
      errors.push('valid_to date must be after valid_from date')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!Array.isArray(tags)) {
    errors.push('Tags must be an array')
    return { valid: false, errors }
  }
  
  // Check for duplicate tags
  const uniqueTags = new Set(tags)
  if (uniqueTags.size !== tags.length) {
    errors.push('Duplicate tags are not allowed')
  }
  
  // Validate individual tag format
  const invalidTags = tags.filter(tag => 
    typeof tag !== 'string' || 
    tag.length === 0 || 
    tag.length > 50 ||
    !/^[A-Za-z0-9_-]+$/.test(tag)
  )
  
  if (invalidTags.length > 0) {
    errors.push('Tags must be non-empty strings (max 50 chars) containing only letters, numbers, hyphens, and underscores')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateSmartCode(smartCode: string): boolean {
  return COST_CENTER_SMART_CODE_REGEX.test(smartCode)
}

// ============================================================================
// 6) Error Codes (Machine-Readable)
// ============================================================================

export const COST_CENTER_ERROR_CODES = {
  ERR_CC_DUPLICATE_CODE: 'ERR_CC_DUPLICATE_CODE',
  ERR_CC_INVALID_CODE_FORMAT: 'ERR_CC_INVALID_CODE_FORMAT',
  ERR_CC_INVALID_TYPE: 'ERR_CC_INVALID_TYPE',
  ERR_CC_PARENT_NOT_FOUND: 'ERR_CC_PARENT_NOT_FOUND',
  ERR_CC_CYCLE_DETECTED: 'ERR_CC_CYCLE_DETECTED',
  ERR_CC_MAX_DEPTH_EXCEEDED: 'ERR_CC_MAX_DEPTH_EXCEEDED',
  ERR_CC_INVALID_VALIDITY_DATES: 'ERR_CC_INVALID_VALIDITY_DATES',
  ERR_CC_INVALID_TAGS: 'ERR_CC_INVALID_TAGS',
  ERR_CC_ARCHIVED_PARENT: 'ERR_CC_ARCHIVED_PARENT',
  ERR_CC_INVALID_SMART_CODE: 'ERR_CC_INVALID_SMART_CODE',
  ERR_CC_IN_USE: 'ERR_CC_IN_USE',
  ERR_DIM_MISSING_COST_CENTER: 'ERR_DIM_MISSING_COST_CENTER'
} as const

export type CostCenterErrorCode = keyof typeof COST_CENTER_ERROR_CODES

export interface CostCenterValidationError {
  code: CostCenterErrorCode
  message: string
  field?: string
  value?: any
}

// ============================================================================
// 7) Standard Cost Center Templates
// ============================================================================

export const STANDARD_COST_CENTER_TEMPLATES = {
  // Salon Industry Templates
  SALON_ADMIN: {
    entity_name: 'Administration',
    cc_code: 'CC-ADMIN-001',
    cost_center_type: 'ADMIN',
    tags: ['ADMIN', 'OVERHEAD']
  },
  SALON_FRONT_OFFICE: {
    entity_name: 'Front Office',
    cc_code: 'CC-FRONT-001', 
    cost_center_type: 'SERVICE',
    tags: ['CUSTOMER_FACING', 'SERVICE']
  },
  SALON_BACK_OFFICE: {
    entity_name: 'Back Office Operations',
    cc_code: 'CC-BACK-001',
    cost_center_type: 'PRODUCTION',
    tags: ['OPERATIONS', 'PRODUCTION']
  },
  
  // Restaurant Industry Templates
  RESTAURANT_KITCHEN: {
    entity_name: 'Kitchen Operations',
    cc_code: 'CC-KITCHEN-001',
    cost_center_type: 'PRODUCTION',
    tags: ['KITCHEN', 'PRODUCTION']
  },
  RESTAURANT_FRONT_HOUSE: {
    entity_name: 'Front of House',
    cc_code: 'CC-FOH-001',
    cost_center_type: 'SERVICE',
    tags: ['CUSTOMER_FACING', 'SERVICE']
  },
  RESTAURANT_ADMIN: {
    entity_name: 'Restaurant Administration',
    cc_code: 'CC-ADMIN-001',
    cost_center_type: 'ADMIN',
    tags: ['ADMIN', 'OVERHEAD']
  },
  
  // General Business Templates
  GENERAL_ADMIN: {
    entity_name: 'General Administration',
    cc_code: 'CC-ADMIN-001',
    cost_center_type: 'ADMIN',
    tags: ['ADMIN']
  },
  GENERAL_SALES: {
    entity_name: 'Sales Department',
    cc_code: 'CC-SALES-001',
    cost_center_type: 'SALES',
    tags: ['SALES', 'REVENUE']
  },
  GENERAL_IT: {
    entity_name: 'Information Technology',
    cc_code: 'CC-IT-001',
    cost_center_type: 'IT',
    tags: ['IT', 'SUPPORT']
  }
} as const

// ============================================================================
// 8) Validation Matrix (Acceptance Criteria)
// ============================================================================

export interface CostCenterValidationCheck {
  check: string
  enforced_at: string
  fails_when: string
  error_code: CostCenterErrorCode
}

export const COST_CENTER_VALIDATION_MATRIX: CostCenterValidationCheck[] = [
  {
    check: 'Unique cc_code per organization',
    enforced_at: 'Cost center create/update',
    fails_when: 'duplicate cc_code exists',
    error_code: 'ERR_CC_DUPLICATE_CODE'
  },
  {
    check: 'Valid cost center type',
    enforced_at: 'Cost center create/update',
    fails_when: 'type not in allowed list',
    error_code: 'ERR_CC_INVALID_TYPE'
  },
  {
    check: 'No cycles in hierarchy',
    enforced_at: 'Relationship upsert',
    fails_when: 'parent chain creates cycle',
    error_code: 'ERR_CC_CYCLE_DETECTED'
  },
  {
    check: 'Maximum depth constraint',
    enforced_at: 'Cost center create/update',
    fails_when: 'depth > max_depth policy',
    error_code: 'ERR_CC_MAX_DEPTH_EXCEEDED'
  },
  {
    check: 'Validity date consistency',
    enforced_at: 'Cost center create/update',
    fails_when: 'valid_to <= valid_from',
    error_code: 'ERR_CC_INVALID_VALIDITY_DATES'
  },
  {
    check: 'Cost center required for OPEX posting',
    enforced_at: 'Transaction posting (6xxx accounts)',
    fails_when: 'missing cost_center_id',
    error_code: 'ERR_DIM_MISSING_COST_CENTER'
  },
  {
    check: 'Active parent requirement',
    enforced_at: 'Cost center create/update',
    fails_when: 'parent_id points to archived cost center',
    error_code: 'ERR_CC_ARCHIVED_PARENT'
  }
]

// ============================================================================
// 9) Helper Functions for Hierarchy Management
// ============================================================================

export function buildCostCenterPath(costCenter: CostCenter, allCostCenters: CostCenter[]): string[] {
  const path: string[] = [costCenter.cc_code]
  let current = costCenter
  
  while (current.parent_id) {
    const parent = allCostCenters.find(cc => cc.id === current.parent_id)
    if (!parent) break
    
    path.unshift(parent.cc_code)
    current = parent
  }
  
  return path
}

export function getCostCenterAncestors(costCenterId: string, allCostCenters: CostCenter[]): CostCenter[] {
  const ancestors: CostCenter[] = []
  const costCenter = allCostCenters.find(cc => cc.id === costCenterId)
  
  if (!costCenter) return ancestors
  
  let current = costCenter
  while (current.parent_id) {
    const parent = allCostCenters.find(cc => cc.id === current.parent_id)
    if (!parent) break
    
    ancestors.push(parent)
    current = parent
  }
  
  return ancestors
}

export function getCostCenterDescendants(costCenterId: string, allCostCenters: CostCenter[]): CostCenter[] {
  const descendants: CostCenter[] = []
  const directChildren = allCostCenters.filter(cc => cc.parent_id === costCenterId)
  
  for (const child of directChildren) {
    descendants.push(child)
    descendants.push(...getCostCenterDescendants(child.id, allCostCenters))
  }
  
  return descendants
}

export function detectCycle(costCenterId: string, parentId: string, allCostCenters: CostCenter[]): boolean {
  if (costCenterId === parentId) return true
  
  const ancestors = getCostCenterAncestors(parentId, allCostCenters)
  return ancestors.some(ancestor => ancestor.id === costCenterId)
}

export default {
  COST_CENTER_TYPES,
  COST_CENTER_SMART_CODES,
  DEFAULT_COST_CENTER_STRUCTURE_POLICY,
  DEFAULT_COST_CENTER_DIMENSIONAL_POLICY,
  DEFAULT_COST_CENTER_ALIGNMENT_POLICY,
  STANDARD_COST_CENTER_TEMPLATES,
  COST_CENTER_ERROR_CODES,
  COST_CENTER_VALIDATION_MATRIX,
  calculateCostCenterDepth,
  generateCostCenterCode,
  validateCostCenterCode,
  validateCostCenterType,
  validateValidityDates,
  validateTags,
  validateSmartCode,
  buildCostCenterPath,
  getCostCenterAncestors,
  getCostCenterDescendants,
  detectCycle
}