// HERA Database Types - Auto-generated from actual schema
// Generated: 2025-09-11T05:54:37.057Z
// Run 'node mcp-server/schema-introspection.js' to update

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

// Core Database Tables
export interface CoreOrganizations {
  id: string
  organization_name: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
  status?: EntityStatus
}

export interface CoreEntities {
  id: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code?: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
  status?: EntityStatus
}

export interface CoreDynamicData {
  id: string
  organization_id: string
  entity_id: string
  field_name: string
  field_value_text?: string
  field_value_number?: number
  field_value_date?: string
  field_value_boolean?: boolean
  field_value_json?: Record<string, any>
  smart_code?: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
}

export interface CoreRelationships {
  id: string
  organization_id: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  smart_code?: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
  status?: EntityStatus
}

export interface UniversalTransactions {
  id: string
  organization_id: string
  transaction_type: string
  transaction_date: string
  transaction_code?: string
  reference_entity_id?: string
  from_entity_id?: string
  to_entity_id?: string
  total_amount: number
  currency?: string
  smart_code?: string
  ai_confidence_score?: number
  ai_classification?: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
  status?: TransactionStatus
}

export interface UniversalTransactionLines {
  id: string
  organization_id: string
  transaction_id: string
  line_number: number
  line_entity_id?: string
  description?: string
  quantity?: number
  unit_price?: number
  line_amount: number
  smart_code?: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, any>
}
