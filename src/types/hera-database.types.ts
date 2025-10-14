// HERA Database Types - Auto-generated from actual schema
// Generated: 2025-10-14T09:09:22.322Z
// Run 'node mcp-server/schema-introspection.js' to update

export interface CoreOrganizations {
  id: string
  organization_name: string
  organization_code: string
  organization_type?: string
  industry_classification?: string
  parent_organization_id?: string
  ai_insights?: string
  ai_classification?: string
  ai_confidence?: string
  settings?: string
  status?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CoreEntities {
  id: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  entity_description?: string
  parent_entity_id?: string
  smart_code?: string
  smart_code_status?: string
  ai_confidence?: string
  ai_classification?: string
  ai_insights?: string
  business_rules?: string
  metadata?: any
  tags?: string
  status?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  version?: string
}

export interface CoreDynamicData {
  id: string
  organization_id: string
  entity_id: string
  field_name: string
  field_type?: string
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: string
  field_value_date?: string
  field_value_json?: any
  field_value_file_url?: string
  calculated_value?: string
  smart_code?: string
  smart_code_status?: string
  ai_confidence?: string
  ai_enhanced_value?: string
  ai_insights?: string
  validation_rules?: string
  validation_status?: string
  field_order?: string
  is_searchable?: boolean
  is_required?: boolean
  is_system_field?: boolean
  created_at: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  version?: string
}

export interface CoreRelationships {
  id: string
  organization_id: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  relationship_direction?: string
  relationship_strength?: string
  relationship_data?: string
  smart_code?: string
  smart_code_status?: string
  ai_confidence?: string
  ai_classification?: string
  ai_insights?: string
  business_logic?: string
  validation_rules?: string
  is_active?: boolean
  effective_date?: string
  expiration_date?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  version?: string
}

export interface UniversalTransactions {
  id: string
  organization_id: string
  transaction_type: string
  transaction_code?: string
  transaction_date: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount?: number
  transaction_status?: string
  reference_number?: number
  external_reference?: string
  smart_code?: string
  smart_code_status?: string
  ai_confidence?: string
  ai_classification?: string
  ai_insights?: string
  business_context?: string
  metadata?: any
  approval_required?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  version?: string
  transaction_currency_code?: string
  base_currency_code?: string
  exchange_rate?: string
  exchange_rate_date?: string
  exchange_rate_type?: string
  fiscal_period_entity_id?: string
  fiscal_year?: string
  fiscal_period?: string
  posting_period_code?: string
}

export interface UniversalTransactionLines {
  id: string
  organization_id: string
  transaction_id: string
  line_number: number
  entity_id?: string
  line_type?: string
  description?: string
  quantity?: string
  unit_amount?: number
  line_amount: number
  discount_amount?: number
  tax_amount?: number
  smart_code?: string
  smart_code_status?: string
  ai_confidence?: string
  ai_classification?: string
  ai_insights?: string
  line_data?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  version?: string
}

// Utility Types
export type EntityStatus = 'active' | 'inactive' | 'deleted' | 'draft'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'

// Type Guards
export const isDeleted = (entity: { status?: string }): boolean => 
  entity.status === 'deleted'

export const isActive = (entity: { status?: string }): boolean => 
  entity.status !== 'deleted' && entity.status !== 'inactive'

// Column existence helpers
export const hasColumn = (obj: any, column: string): boolean => 
  obj && typeof obj === 'object' && column in obj
