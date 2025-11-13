/**
 * HERA SDK Types - Complete Type Definitions
 * Smart Code: HERA.SDK.TYPES.CORE.v1
 */

/**
 * Base HERA Client Configuration
 */
export interface HeraClientOptions {
  supabaseUrl: string
  supabaseAnonKey: string
  organizationId: string
  authToken?: string
  environment?: 'development' | 'staging' | 'production'
  timeout?: number
  retryAttempts?: number
}

/**
 * Enhanced Gateway Response Types
 */
export interface HeraSuccessResponse<T = any> {
  success: true
  data: T
  request_id?: string
  actor?: string
  organization?: string
  duration?: number
}

export interface HeraErrorResponse {
  success: false
  error: string
  status?: number
  request_id?: string
  violations?: string[]
  suggestions?: string[]
}

export type HeraResponse<T = any> = HeraSuccessResponse<T> | HeraErrorResponse

/**
 * HERA Entity Types (Sacred Six)
 */
export interface HeraEntity {
  id: string
  entity_type: string
  entity_name: string
  entity_description?: string
  smart_code: string
  organization_id: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  metadata?: Record<string, any>
}

/**
 * HERA Dynamic Data (Field-Value Storage)
 */
export interface HeraDynamicField {
  id?: string
  entity_id: string
  field_name: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'email' | 'phone' | 'url'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  field_value_json?: Record<string, any>
  smart_code: string
  organization_id: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Relationships (Entity Connections)
 */
export interface HeraRelationship {
  id?: string
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  relationship_data?: Record<string, any>
  effective_date?: string
  expiration_date?: string
  smart_code: string
  organization_id: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Transactions (Financial Operations)
 */
export interface HeraTransaction {
  id?: string
  transaction_type: string
  transaction_number?: string
  transaction_date: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount: number
  transaction_currency_code: string
  transaction_status?: string
  smart_code: string
  organization_id: string
  lines?: HeraTransactionLine[]
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Transaction Lines (Line-Level Details)
 */
export interface HeraTransactionLine {
  id?: string
  transaction_id: string
  line_number: number
  line_type: string
  entity_id?: string
  description?: string
  quantity: number
  unit_amount: number
  line_amount: number
  line_data?: Record<string, any>
  smart_code: string
  organization_id: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Organizations (Multi-Tenant)
 */
export interface HeraOrganization {
  id: string
  organization_name: string
  organization_code?: string
  organization_type?: string
  settings?: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

/**
 * HERA Users (Actor System)
 */
export interface HeraUser {
  id: string
  auth_uid: string
  user_entity_id: string
  email: string
  display_name?: string
  user_role?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

/**
 * Search and Filter Types
 */
export interface HeraSearchParams {
  entity_type?: string
  search_text?: string
  filters?: Record<string, any>
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface HeraSearchResults<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

/**
 * Validation Types
 */
export interface HeraValidationResult {
  is_valid: boolean
  errors: string[]
  warnings?: string[]
  suggestions?: string[]
}

/**
 * Financial Analysis Types
 */
export interface HeraKPI {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  comparison?: {
    period: string
    value: number
    change_percent: number
  }
}

export interface HeraFinancialReport {
  report_type: string
  period: string
  currency: string
  sections: Array<{
    title: string
    items: Array<{
      label: string
      value: number
      sub_items?: Array<{
        label: string
        value: number
      }>
    }>
  }>
  summary: {
    total_revenue?: number
    total_expenses?: number
    net_income?: number
    total_assets?: number
    total_liabilities?: number
    equity?: number
  }
}

/**
 * AI Digital Accountant Types
 */
export interface HeraAIContext {
  entity_type?: string
  entity_id?: string
  transaction_id?: string
  report_type?: string
  period?: string
  additional_context?: Record<string, any>
}

export interface HeraAIUsage {
  request_id: string
  model: string
  input_tokens: number
  output_tokens: number
  total_cost: number
  duration: number
  timestamp: string
  organization_id: string
  actor_user_id: string
}

/**
 * MCP (Model Context Protocol) Types
 */
export interface HeraMCPMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  context?: HeraAIContext
  tools_available?: string[]
}

export interface HeraMCPResponse {
  message: string
  tools_used?: Array<{
    name: string
    parameters: Record<string, any>
    result: any
  }>
  cost: number
  duration: number
}

/**
 * Audit and Compliance Types
 */
export interface HeraAuditTrail {
  id: string
  entity_id: string
  entity_type: string
  action: string
  before_state?: Record<string, any>
  after_state?: Record<string, any>
  actor_user_id: string
  organization_id: string
  timestamp: string
  request_id?: string
  metadata?: Record<string, any>
}

/**
 * Chart of Accounts Types
 */
export interface HeraAccount {
  account_code: string
  account_name: string
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  account_subtype?: string
  parent_account_code?: string
  is_active: boolean
  balance: number
  currency: string
  smart_code: string
  organization_id: string
}

/**
 * GL (General Ledger) Types
 */
export interface HeraGLEntry {
  id?: string
  transaction_id: string
  line_number: number
  account_code: string
  side: 'DR' | 'CR'
  amount: number
  currency: string
  description?: string
  reference?: string
  posting_date: string
  smart_code: string
  organization_id: string
}

/**
 * Error and Status Types
 */
export interface HeraError extends Error {
  code?: string
  status?: number
  request_id?: string
  violations?: string[]
  context?: Record<string, any>
}

export interface HeraHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  timestamp: string
  components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>
  performance?: {
    response_time_ms: number
    memory_usage?: number
    active_connections?: number
  }
}

/**
 * Utility Types
 */
export type HeraEntityType = 
  | 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE' | 'PRODUCT' | 'SERVICE'
  | 'ACCOUNT' | 'LOCATION' | 'PROJECT' | 'DEPARTMENT'
  | 'ORGANIZATION' | 'USER' | 'ROLE' | 'PERMISSION'

export type HeraTransactionType =
  | 'sale' | 'purchase' | 'payment' | 'receipt' | 'transfer'
  | 'adjustment' | 'depreciation' | 'accrual' | 'reversal'

export type HeraRelationshipType =
  | 'PARENT_OF' | 'CHILD_OF' | 'MEMBER_OF' | 'OWNS' | 'ASSIGNED_TO'
  | 'MAPS_TO' | 'LINKED_TO' | 'HAS_STATUS' | 'CATEGORIZED_AS'

export type HeraCurrency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'JPY' | 'CNY' | 'INR'

export type HeraRole = 
  | 'admin' | 'manager' | 'accountant' | 'user' | 'viewer'
  | 'salon_owner' | 'salon_manager' | 'stylist' | 'receptionist'

/**
 * Smart Code Pattern Type
 */
export type HeraSmartCode = `HERA.${string}.${string}.${string}.v${number}`

