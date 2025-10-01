/**
 * HERA UI Binder - Type Definitions
 */

export interface ListParams {
  entityType?: string
  smartCodePrefix?: string
  search?: string
  limit?: number
  offset?: number
  orderBy?: string
}

export interface RecordParams {
  entity_id: string
  organization_id: string
}

export interface RelListParams {
  from_entity_id?: string
  to_entity_id?: string
  smartCodePrefix?: string
  limit?: number
  offset?: number
}

export interface ActionParams {
  smart_code: string
  payload: {
    organization_id: string
    transaction_type: string
    smart_code: string
    transaction_date: string
    lines: Array<{
      line_number: number
      line_type: string
      smart_code: string
      entity_id?: string
      quantity?: number
      line_amount?: number
      line_data?: Record<string, any>
    }>
    [key: string]: any
  }
}

export interface UpsertParams {
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  entity_id?: string
  dynamic_fields?: Record<string, {
    value: any
    type: 'text' | 'number' | 'boolean' | 'json'
    smart_code: string
  }>
  metadata?: Record<string, any>
}

export interface QueryDSLParams {
  filter?: string
  order?: string
  pageSize?: number
  page?: number
  search?: string
}

export interface ParsedQuery {
  limit: number
  offset: number
  orderBy: string
  search?: string
  filters?: Record<string, any>
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any, row: any) => string | React.ReactNode
  width?: string
}

export interface FilterConfig {
  type: 'text' | 'select' | 'date' | 'number'
  key: string
  label: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

export interface ActionConfig {
  key: string
  label: string
  buildPayload: (context: any) => ActionParams['payload']
  confirm?: boolean
  confirmMessage?: string
  variant?: 'default' | 'destructive' | 'secondary'
}

export interface TabConfig {
  key: string
  label: string
  component: React.ComponentType<any>
  props?: Record<string, any>
}