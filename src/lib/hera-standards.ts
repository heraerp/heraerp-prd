/**
 * HERA Standardization System
 *
 * This module defines the standard types, patterns, and validation rules for HERA.
 * All standards are stored as entities in the system itself, making HERA self-aware.
 */

// Standard Entity Types
export const STANDARD_ENTITY_TYPES = {
  // Core System Types
  ENTITY_TYPE_DEFINITION: 'entity_type_definition',
  TRANSACTION_TYPE_DEFINITION: 'transaction_type_definition',
  RELATIONSHIP_TYPE_DEFINITION: 'relationship_type_definition',
  STATUS_DEFINITION: 'status_definition',
  SMART_CODE_PATTERN: 'smart_code_pattern',

  // Business Entity Types
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  PRODUCT: 'product',
  SERVICE: 'service',
  EMPLOYEE: 'employee',
  GL_ACCOUNT: 'gl_account',
  BUDGET: 'budget',
  FORECAST: 'forecast',
  LOCATION: 'location',
  PROJECT: 'project',
  DEVELOPMENT_TASK: 'development_task',
  USER: 'user',
  AI_AGENT: 'ai_agent',
  WORKFLOW_STATUS: 'workflow_status',

  // Document Types
  DOCUMENT: 'document',
  REPORT: 'report',
  POLICY: 'policy',

  // Configuration Types
  CONFIGURATION: 'configuration',
  RULE: 'rule',
  TEMPLATE: 'template'
} as const

// Standard Transaction Types
// ✅ UPDATED: Use UPPERCASE values to match HERA DNA standard (following appointments pattern)
export const STANDARD_TRANSACTION_TYPES = {
  // Financial Transactions
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  PAYMENT: 'PAYMENT',
  RECEIPT: 'RECEIPT',
  JOURNAL_ENTRY: 'JOURNAL_ENTRY',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',

  // POS-Specific Transactions (legacy - prefer SALE)
  POS_SALE: 'POS_SALE',
  POS_REFUND: 'POS_REFUND',
  POS_VOID: 'POS_VOID',
  CASH_RECONCILIATION: 'CASH_RECONCILIATION',
  TILL_OPEN: 'TILL_OPEN',
  TILL_CLOSE: 'TILL_CLOSE',

  // Budget & Forecast
  BUDGET_LINE: 'BUDGET_LINE',
  FORECAST_LINE: 'FORECAST_LINE',

  // Inventory Transactions
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  GOODS_ISSUE: 'GOODS_ISSUE',
  STOCK_TRANSFER: 'STOCK_TRANSFER',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',

  // Service Transactions
  SERVICE_ORDER: 'SERVICE_ORDER',
  SERVICE_DELIVERY: 'SERVICE_DELIVERY',
  TIME_ENTRY: 'TIME_ENTRY',
  APPOINTMENT: 'APPOINTMENT',

  // Auto-Journal Types
  AUTO_JOURNAL: 'AUTO_JOURNAL',
  BATCH_JOURNAL: 'BATCH_JOURNAL',

  // System Transactions
  AUDIT_EVENT: 'AUDIT_EVENT',
  STATUS_CHANGE: 'STATUS_CHANGE',
  APPROVAL: 'APPROVAL'
} as const

// Standard Relationship Types
export const STANDARD_RELATIONSHIP_TYPES = {
  // Hierarchical
  PARENT_OF: 'parent_of',
  CHILD_OF: 'child_of',

  // Status & Workflow
  HAS_STATUS: 'has_status',
  PREVIOUS_STATUS: 'previous_status',

  // Business Relationships
  CUSTOMER_OF: 'customer_of',
  VENDOR_OF: 'vendor_of',
  EMPLOYEE_OF: 'employee_of',
  MANAGER_OF: 'manager_of',
  REPORTS_TO: 'reports_to',
  MEMBER_OF: 'member_of',
  OWNER_OF: 'owner_of',

  // Document Relationships
  ATTACHMENT_OF: 'attachment_of',
  VERSION_OF: 'version_of',
  APPROVAL_FOR: 'approval_for',

  // Financial Relationships
  PAYMENT_FOR: 'payment_for',
  LINE_ITEM_OF: 'line_item_of',
  ALLOCATION_OF: 'allocation_of',

  // Product/Service Relationships
  COMPONENT_OF: 'component_of',
  SUBSTITUTE_FOR: 'substitute_for',
  BUNDLE_OF: 'bundle_of'
} as const

// Standard Status Values
export const STANDARD_STATUSES = {
  // Universal Statuses
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',

  // Transaction Statuses
  POSTED: 'posted',
  REVERSED: 'reversed',
  VOID: 'void',

  // Workflow Statuses
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  UNDER_REVIEW: 'under_review',

  // Entity Statuses
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
} as const

// Smart Code Pattern Definitions
export const SMART_CODE_PATTERNS = {
  // Pattern: HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}
  PATTERN_REGEX: /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/,

  // Industry Codes
  INDUSTRIES: {
    GEN: 'General',
    REST: 'Restaurant',
    HLTH: 'Healthcare',
    MFG: 'Manufacturing',
    PROF: 'Professional Services',
    RETAIL: 'Retail',
    SALON: 'Salon',
    FURN: 'Furniture',
    EDU: 'Education',
    FIN: 'Finance',
    TECH: 'Technology'
  },

  // Module Codes
  MODULES: {
    CRM: 'Customer Relationship Management',
    SCM: 'Supply Chain Management',
    FIN: 'Finance',
    HR: 'Human Resources',
    MFG: 'Manufacturing',
    INV: 'Inventory',
    POS: 'Point of Sale',
    PROJ: 'Project Management',
    AI: 'Artificial Intelligence',
    SYS: 'System',
    UI: 'User Interface',
    API: 'Application Programming Interface',
    RPT: 'Reporting',
    WF: 'Workflow'
  },

  // Function Codes
  FUNCTIONS: {
    // Entity Functions
    CUST: 'Customer',
    VEND: 'Vendor',
    PROD: 'Product',
    EMP: 'Employee',
    GL: 'General Ledger',

    // Transaction Functions
    SALE: 'Sale',
    PUR: 'Purchase',
    PAY: 'Payment',
    RCP: 'Receipt',
    JE: 'Journal Entry',

    // System Functions
    AUTH: 'Authorization',
    AUDIT: 'Audit',
    CONFIG: 'Configuration',
    ONBOARD: 'Onboarding',
    REPORT: 'Report'
  },

  // Type Codes
  TYPES: {
    ENT: 'Entity',
    TXN: 'Transaction',
    REL: 'Relationship',
    DYN: 'Dynamic Field',
    EVT: 'Event',
    RPT: 'Report',
    UI: 'User Interface',
    API: 'API Endpoint',
    WF: 'Workflow',
    RULE: 'Rule',
    TMPL: 'Template'
  }
}

// Type definitions for standards
export interface StandardDefinition {
  code: string
  name: string
  description: string
  category: string
  smart_code: string
  metadata?: Record<string, any>
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  value: any
  message: string
  suggestion?: string
}

export interface ValidationWarning {
  field: string
  value: any
  message: string
}

// Helper functions for smart code generation
export function generateSmartCode(
  industry: keyof typeof SMART_CODE_PATTERNS.INDUSTRIES,
  module: keyof typeof SMART_CODE_PATTERNS.MODULES,
  func: keyof typeof SMART_CODE_PATTERNS.FUNCTIONS,
  type: keyof typeof SMART_CODE_PATTERNS.TYPES,
  version: number = 1
): string {
  return `HERA.${industry}.${module}.${func}.${type}.v${version}`
}

export function validateSmartCode(smartCode: string): boolean {
  return SMART_CODE_PATTERNS.PATTERN_REGEX.test(smartCode)
}

export function parseSmartCode(smartCode: string): {
  industry: string
  module: string
  function: string
  type: string
  version: number
} | null {
  const match = smartCode.match(/^HERA\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.v(\d+)$/)
  if (!match) return null

  return {
    industry: match[1],
    module: match[2],
    function: match[3],
    type: match[4],
    version: parseInt(match[5])
  }
}

// Type guards
export function isStandardEntityType(type: string): type is keyof typeof STANDARD_ENTITY_TYPES {
  return Object.values(STANDARD_ENTITY_TYPES).includes(type as any)
}

export function isStandardTransactionType(
  type: string
): type is keyof typeof STANDARD_TRANSACTION_TYPES {
  return Object.values(STANDARD_TRANSACTION_TYPES).includes(type as any)
}

export function isStandardRelationshipType(
  type: string
): type is keyof typeof STANDARD_RELATIONSHIP_TYPES {
  return Object.values(STANDARD_RELATIONSHIP_TYPES).includes(type as any)
}

export function isStandardStatus(status: string): status is keyof typeof STANDARD_STATUSES {
  return Object.values(STANDARD_STATUSES).includes(status as any)
}

// Export type literals for TypeScript
export type StandardEntityType = (typeof STANDARD_ENTITY_TYPES)[keyof typeof STANDARD_ENTITY_TYPES]
export type StandardTransactionType =
  (typeof STANDARD_TRANSACTION_TYPES)[keyof typeof STANDARD_TRANSACTION_TYPES]
export type StandardRelationshipType =
  (typeof STANDARD_RELATIONSHIP_TYPES)[keyof typeof STANDARD_RELATIONSHIP_TYPES]
export type StandardStatus = (typeof STANDARD_STATUSES)[keyof typeof STANDARD_STATUSES]
