/**
 * V2 API Types
 */

export type EntityCreateRequest = {
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  dynamic_fields?: Record<string, {
    value: any
    type: 'text' | 'number' | 'boolean' | 'date'
    smart_code: string
  }>
  metadata?: Record<string, any>
}

export type EntityResponse = {
  entity_id: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  created_at: string
  updated_at: string
  dynamic_fields?: Record<string, any>
  metadata?: Record<string, any>
}

export type EntityListResponse = EntityResponse[]

export type TransactionCreateRequest = {
  organization_id: string
  transaction_type: string
  smart_code: string
  transaction_date: string
  business_context?: Record<string, any>
  lines: TransactionLineRequest[]
}

export type TransactionLineRequest = {
  line_number: number
  line_type: string
  smart_code: string
  entity_id?: string
  quantity?: number
  unit_price?: number
  line_amount: number
  line_data?: Record<string, any>
}

export type TransactionResponse = {
  transaction_id: string
  organization_id: string
  transaction_type: string
  smart_code: string
  transaction_date: string
  total_amount?: number
  business_context?: Record<string, any>
  created_at: string
  updated_at: string
  lines?: TransactionLineResponse[]
}

export type TransactionLineResponse = {
  line_id: string
  transaction_id: string
  line_number: number
  line_type: string
  smart_code: string
  entity_id?: string
  quantity?: number
  unit_price?: number
  line_amount: number
  line_data?: Record<string, any>
}