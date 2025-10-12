/**
 * HERA COA v2: Enterprise-Grade Chart of Accounts Standard
 * 
 * Bulletproof, IFRS-aligned, multi-tenant, zero-schema-change COA system
 * that flows like a Japanese production line.
 * 
 * Smart Code: HERA.FIN.COA.STANDARD.V2
 */

// ============================================================================
// 1) COA Number Range Standard (Universal & IFRS-aligned)
// ============================================================================

export const COA_RANGES = {
  ASSETS: '1xxx',           // Normal Balance: Dr
  LIABILITIES: '2xxx',      // Normal Balance: Cr  
  EQUITY: '3xxx',          // Normal Balance: Cr
  REVENUE: '4xxx',         // Normal Balance: Cr
  COST_OF_GOODS_SOLD: '5xxx', // Normal Balance: Dr
  OPERATING_EXPENSES: '6xxx',  // Normal Balance: Dr
  OTHER_INCOME_EXPENSE: '7xxx', // Normal Balance: ±
  TAX_FINANCE_EXCEPTIONAL: '8xxx', // Normal Balance: ±
  STATISTICAL_CONTROL: '9xxx'     // No external presentation
} as const

export const NORMAL_BALANCE_BY_RANGE = {
  '1': 'Dr',  // Assets
  '2': 'Cr',  // Liabilities  
  '3': 'Cr',  // Equity
  '4': 'Cr',  // Revenue
  '5': 'Dr',  // Cost of Goods Sold
  '6': 'Dr',  // Operating Expenses
  '7': 'Dr',  // Other Income/Expense (default Dr, can be Cr)
  '8': 'Dr',  // Tax/Finance/Exceptional (default Dr, can be Cr)
  '9': 'Dr'   // Statistical/Control
} as const

// ============================================================================
// 2) TypeScript Interfaces (Six-Table Mapping)
// ============================================================================

export interface COAAccount {
  // From core_entities
  id: string
  organization_id: string
  entity_type: 'ACCOUNT'
  entity_name: string
  entity_code?: string
  status: 'ACTIVE' | 'ARCHIVED'
  smart_code: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  
  // From core_dynamic_data (required fields)
  account_number: string        // "4.1.2" - unique per org
  normal_balance: 'Dr' | 'Cr'   // Normal balance type
  depth: number                 // Integer depth in hierarchy
  is_postable: boolean          // Leaf accounts only
  ifrs_tags: string[]           // ["PP&E","TANGIBLE"]
  
  // From core_dynamic_data (optional but recommended)
  display_number?: string       // Zero-padded format "040102"
  presentation_group?: string   // "Current Assets", "Admin Opex"
  consolidation_group?: string  // For group consolidation
  effective_from?: string       // Date
  effective_to?: string         // Date
  coa_policy_ref?: Record<string, any> // Snapshot of rules when created
  
  // From core_relationships
  parent_id?: string            // Parent account ID
  children?: COAAccount[]       // Child accounts (for tree view)
  sort_order?: number           // Display order within parent
}

export interface COACreateRequest {
  entity_name: string
  account_number: string
  normal_balance?: 'Dr' | 'Cr'  // Auto-inferred from range if not provided
  is_postable: boolean
  ifrs_tags: string[]
  parent_id?: string
  display_number?: string
  presentation_group?: string
  consolidation_group?: string
  effective_from?: string
  effective_to?: string
  metadata?: Record<string, any>
}

export interface COAUpdateRequest {
  entity_name?: string
  account_number?: string
  normal_balance?: 'Dr' | 'Cr'
  is_postable?: boolean
  ifrs_tags?: string[]
  parent_id?: string
  display_number?: string
  presentation_group?: string
  consolidation_group?: string
  effective_from?: string
  effective_to?: string
  metadata?: Record<string, any>
}

export interface COAResponse {
  account_id: string
  entity_name: string
  account_number: string
  depth: number
  is_postable: boolean
  ifrs_tags: string[]
  parent_id?: string
  audit_txn_id: string
  normal_balance: 'Dr' | 'Cr'
  display_number?: string
  presentation_group?: string
  status: 'ACTIVE' | 'ARCHIVED'
}

// ============================================================================
// 3) Guardrails (Policy-as-Data)
// ============================================================================

export interface COAStructurePolicy {
  policy: 'COA_STRUCTURE_V2'
  rules: Array<{
    name: string
    scope?: string
    enforce: boolean
    value?: any
    map?: Record<string, any>
  }>
}

export interface COADimensionalPolicy {
  policy: 'COA_DIM_REQUIREMENTS_V2'
  ranges: Array<{
    range: string
    requires: string[]
    optional: string[]
  }>
}

export interface IFRSPresentationPolicy {
  policy: 'IFRS_PRESENTATION_V2'
  mappings: Array<{
    ifrs_tag: string
    presentation: string
  }>
  validation: string[]
}

export const DEFAULT_COA_STRUCTURE_POLICY: COAStructurePolicy = {
  policy: 'COA_STRUCTURE_V2',
  rules: [
    { name: 'unique_account_number', scope: 'organization', enforce: true },
    { 
      name: 'normal_balance_by_range', 
      map: {
        '1xxx': 'Dr', '2xxx': 'Cr', '3xxx': 'Cr', '4xxx': 'Cr', 
        '5xxx': 'Dr', '6xxx': 'Dr', '7xxx': 'Dr', '8xxx': 'Dr', '9xxx': 'Dr'
      }
    },
    { name: 'is_postable_leaf_only', enforce: true },
    { name: 'max_depth', value: 8, enforce: true },
    { name: 'no_cycles', enforce: true }
  ]
}

export const DEFAULT_DIMENSIONAL_POLICY: COADimensionalPolicy = {
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
}

export const DEFAULT_IFRS_POLICY: IFRSPresentationPolicy = {
  policy: 'IFRS_PRESENTATION_V2',
  mappings: [
    { ifrs_tag: 'PP&E', presentation: 'Non-current assets' },
    { ifrs_tag: 'REVENUE', presentation: 'Revenue' },
    { ifrs_tag: 'COGS', presentation: 'Cost of sales' },
    { ifrs_tag: 'CURRENT_ASSETS', presentation: 'Current assets' },
    { ifrs_tag: 'CURRENT_LIABILITIES', presentation: 'Current liabilities' },
    { ifrs_tag: 'OPERATING', presentation: 'Operating activities' },
    { ifrs_tag: 'FINANCING', presentation: 'Financing activities' },
    { ifrs_tag: 'INVESTING', presentation: 'Investing activities' }
  ],
  validation: ['must_have_ifrs_tag_on_postable']
}

// ============================================================================
// 4) Smart Code Canonical Set (v2)
// ============================================================================

export const COA_SMART_CODES = {
  // Entities
  ENTITY_ACCOUNT: 'HERA.FIN.COA.ENTITY.ACCOUNT.v2',
  
  // Dynamic Data Fields
  DYN_ACCOUNT_NUMBER: 'HERA.FIN.COA.DYN.ACCOUNT_NUMBER.v2',
  DYN_NORMAL_BALANCE: 'HERA.FIN.COA.DYN.NORMAL_BALANCE.v2',
  DYN_DEPTH: 'HERA.FIN.COA.DYN.DEPTH.v2',
  DYN_IS_POSTABLE: 'HERA.FIN.COA.DYN.IS_POSTABLE.v2',
  DYN_IFRS_TAGS: 'HERA.FIN.COA.DYN.IFRS_TAGS.v2',
  DYN_DISPLAY_NUMBER: 'HERA.FIN.COA.DYN.DISPLAY_NUMBER.v2',
  DYN_PRESENTATION_GROUP: 'HERA.FIN.COA.DYN.PRESENTATION_GROUP.v2',
  DYN_CONSOLIDATION_GROUP: 'HERA.FIN.COA.DYN.CONSOLIDATION_GROUP.v2',
  DYN_EFFECTIVE_FROM: 'HERA.FIN.COA.DYN.EFFECTIVE_FROM.v2',
  DYN_EFFECTIVE_TO: 'HERA.FIN.COA.DYN.EFFECTIVE_TO.v2',
  DYN_COA_POLICY_REF: 'HERA.FIN.COA.DYN.COA_POLICY_REF.v2',
  
  // Relationships
  REL_PARENT_OF: 'HERA.FIN.COA.REL.PARENT_OF.v2',
  REL_ALT_ROLLUP_OF: 'HERA.FIN.COA.REL.ALT_ROLLUP_OF.v2',
  
  // Transactions
  TXN_CREATE: 'HERA.FIN.COA.TXN.CREATE.v2',
  TXN_UPDATE: 'HERA.FIN.COA.TXN.UPDATE.v2',
  TXN_ARCHIVE: 'HERA.FIN.COA.TXN.ARCHIVE.v2',
  TXN_RESTORE: 'HERA.FIN.COA.TXN.RESTORE.v2',
  TXN_REL_UPSERT: 'HERA.FIN.COA.TXN.REL_UPSERT.v2',
  TXN_FIELD_SET: 'HERA.FIN.COA.TXN.FIELD_SET.v2',
  TXN_MERGE: 'HERA.FIN.COA.TXN.MERGE.v2',
  TXN_SPLIT: 'HERA.FIN.COA.TXN.SPLIT.v2'
} as const

// Regex rule for CI guard
export const SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

// ============================================================================
// 5) Utility Functions
// ============================================================================

export function getAccountRange(accountNumber: string): string {
  const firstDigit = accountNumber.charAt(0)
  return `${firstDigit}xxx`
}

export function inferNormalBalance(accountNumber: string): 'Dr' | 'Cr' {
  const firstDigit = accountNumber.charAt(0)
  return NORMAL_BALANCE_BY_RANGE[firstDigit as keyof typeof NORMAL_BALANCE_BY_RANGE] as 'Dr' | 'Cr'
}

export function calculateDepth(accountNumber: string): number {
  return accountNumber.split('.').length
}

export function generateDisplayNumber(accountNumber: string, width: number = 6): string {
  // Convert "4.1.2" to "041002" (zero-padded)
  const parts = accountNumber.split('.')
  return parts.map(part => part.padStart(2, '0')).join('').padEnd(width, '0')
}

export function validateAccountNumber(accountNumber: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Must follow hierarchical format (e.g., "4.1.2")
  if (!/^\d+(\.\d+)*$/.test(accountNumber)) {
    errors.push('Account number must follow hierarchical format (e.g., "4.1.2")')
  }
  
  // First digit must be 1-9
  const firstDigit = accountNumber.charAt(0)
  if (!/[1-9]/.test(firstDigit)) {
    errors.push('Account number must start with digit 1-9')
  }
  
  // Maximum depth of 8 levels
  const depth = calculateDepth(accountNumber)
  if (depth > 8) {
    errors.push('Account number cannot exceed 8 levels of depth')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateIFRSTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!Array.isArray(tags) || tags.length === 0) {
    errors.push('IFRS tags are required for postable accounts')
  }
  
  // Validate tag format (uppercase, alphanumeric + underscore)
  const invalidTags = tags.filter(tag => !/^[A-Z0-9_]+$/.test(tag))
  if (invalidTags.length > 0) {
    errors.push(`Invalid IFRS tag format: ${invalidTags.join(', ')}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateSmartCode(smartCode: string): boolean {
  return SMART_CODE_REGEX.test(smartCode)
}

// ============================================================================
// 6) Error Codes (Machine-Readable)
// ============================================================================

export const COA_ERROR_CODES = {
  ERR_COA_DUPLICATE_NUMBER: 'ERR_COA_DUPLICATE_NUMBER',
  ERR_COA_INVALID_NUMBER_FORMAT: 'ERR_COA_INVALID_NUMBER_FORMAT',
  ERR_COA_INVALID_NORMAL_BALANCE: 'ERR_COA_INVALID_NORMAL_BALANCE',
  ERR_COA_PARENT_NOT_FOUND: 'ERR_COA_PARENT_NOT_FOUND',
  ERR_COA_CYCLE_DETECTED: 'ERR_COA_CYCLE_DETECTED',
  ERR_COA_MAX_DEPTH_EXCEEDED: 'ERR_COA_MAX_DEPTH_EXCEEDED',
  ERR_COA_POSTABLE_NOT_LEAF: 'ERR_COA_POSTABLE_NOT_LEAF',
  ERR_COA_MISSING_IFRS_TAGS: 'ERR_COA_MISSING_IFRS_TAGS',
  ERR_COA_DIM_REQUIREMENT_MISSING: 'ERR_COA_DIM_REQUIREMENT_MISSING',
  ERR_COA_ACCOUNT_IN_USE: 'ERR_COA_ACCOUNT_IN_USE',
  ERR_COA_INVALID_SMART_CODE: 'ERR_COA_INVALID_SMART_CODE'
} as const

export type COAErrorCode = keyof typeof COA_ERROR_CODES

export interface COAValidationError {
  code: COAErrorCode
  message: string
  field?: string
  value?: any
}

// ============================================================================
// 7) IFRS Standard Tags
// ============================================================================

export const IFRS_STANDARD_TAGS = {
  // Assets
  CURRENT_ASSETS: 'CURRENT_ASSETS',
  CASH: 'CASH',
  TRADE_RECEIVABLES: 'TRADE_RECEIVABLES',
  INVENTORY: 'INVENTORY',
  PPE: 'PP&E',
  INTANGIBLE: 'INTANGIBLE',
  INVESTMENT_PROPERTY: 'INVESTMENT_PROPERTY',
  
  // Liabilities
  CURRENT_LIABILITIES: 'CURRENT_LIABILITIES',
  TRADE_PAYABLES: 'TRADE_PAYABLES',
  BORROWINGS: 'BORROWINGS',
  PROVISIONS: 'PROVISIONS',
  
  // Equity
  SHARE_CAPITAL: 'SHARE_CAPITAL',
  RETAINED_EARNINGS: 'RETAINED_EARNINGS',
  
  // Income Statement
  REVENUE: 'REVENUE',
  COGS: 'COGS',
  OPERATING: 'OPERATING',
  FINANCING: 'FINANCING',
  INVESTING: 'INVESTING',
  TAX: 'TAX',
  
  // Special
  TANGIBLE: 'TANGIBLE',
  FINANCIAL: 'FINANCIAL',
  DEPRECIATION: 'DEPRECIATION'
} as const

export type IFRSTag = keyof typeof IFRS_STANDARD_TAGS

// ============================================================================
// 8) Validation Matrix (Acceptance Criteria)
// ============================================================================

export interface ValidationCheck {
  check: string
  enforced_at: string
  fails_when: string
  error_code: COAErrorCode
}

export const VALIDATION_MATRIX: ValidationCheck[] = [
  {
    check: 'Unique account_number per org',
    enforced_at: 'COA create/update',
    fails_when: 'duplicate',
    error_code: 'ERR_COA_DUPLICATE_NUMBER'
  },
  {
    check: 'Normal balance matches range',
    enforced_at: 'COA create/update',
    fails_when: '4xxx set to Dr, etc.',
    error_code: 'ERR_COA_INVALID_NORMAL_BALANCE'
  },
  {
    check: 'Leaf only postable',
    enforced_at: 'COA update or posting',
    fails_when: 'internal node marked postable',
    error_code: 'ERR_COA_POSTABLE_NOT_LEAF'
  },
  {
    check: 'No cycles, bounded depth',
    enforced_at: 'Relationship upsert',
    fails_when: 'cycle or > max_depth',
    error_code: 'ERR_COA_CYCLE_DETECTED'
  },
  {
    check: 'Dim completeness per range',
    enforced_at: 'Posting',
    fails_when: 'missing required dims',
    error_code: 'ERR_COA_DIM_REQUIREMENT_MISSING'
  },
  {
    check: 'IFRS tags on postable accounts',
    enforced_at: 'COA create/update',
    fails_when: 'postable account without IFRS tags',
    error_code: 'ERR_COA_MISSING_IFRS_TAGS'
  }
]

export default {
  COA_RANGES,
  NORMAL_BALANCE_BY_RANGE,
  COA_SMART_CODES,
  DEFAULT_COA_STRUCTURE_POLICY,
  DEFAULT_DIMENSIONAL_POLICY,
  DEFAULT_IFRS_POLICY,
  IFRS_STANDARD_TAGS,
  COA_ERROR_CODES,
  VALIDATION_MATRIX,
  getAccountRange,
  inferNormalBalance,
  calculateDepth,
  generateDisplayNumber,
  validateAccountNumber,
  validateIFRSTags,
  validateSmartCode
}