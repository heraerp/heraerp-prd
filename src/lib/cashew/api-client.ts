/**
 * HERA Cashew Manufacturing API Client
 * Smart Code: HERA.CASHEW.API.CLIENT.v1
 * 
 * Connects cashew module to real HERA API v2 endpoints
 * Replaces mock data with live Sacred Six operations
 */

import { apiV2 } from '@/lib/client/fetchV2'

export interface CashewEntity {
  id?: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  organization_id: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface CashewDynamicField {
  entity_id?: string
  field_name: string
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'phone'
  smart_code: string
  organization_id: string
}

export interface CashewTransaction {
  id?: string
  transaction_type: string
  transaction_code?: string
  smart_code: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount?: number
  transaction_currency_code?: string
  transaction_date?: string
  transaction_status?: string
  organization_id: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface CashewTransactionLine {
  id?: string
  transaction_id?: string
  line_number: number
  line_type: string
  entity_id?: string
  quantity?: number
  unit_amount?: number
  line_amount?: number
  description?: string
  smart_code?: string
  organization_id?: string
}

/**
 * HERA Entities CRUD Operations
 */
export class CashewEntitiesAPI {
  /**
   * Create a new cashew entity with dynamic fields
   */
  static async createEntity(
    entity: Omit<CashewEntity, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
    dynamicFields: Omit<CashewDynamicField, 'entity_id' | 'organization_id'>[] = []
  ) {
    try {
      // Call hera_entities_crud_v1 RPC via API v2
      const { data, error } = await apiV2.post('rpc/hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: null, // Will be resolved by API v2 gateway
        p_organization_id: entity.organization_id,
        p_entity: {
          entity_type: entity.entity_type,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code || null,
          smart_code: entity.smart_code
        },
        p_dynamic: dynamicFields.reduce((acc, field) => {
          acc[field.field_name] = {
            field_type: field.field_type,
            field_value_text: field.field_value_text || null,
            field_value_number: field.field_value_number || null,
            field_value_boolean: field.field_value_boolean || null,
            field_value_date: field.field_value_date || null,
            smart_code: field.smart_code
          }
          return acc
        }, {} as Record<string, any>),
        p_relationships: [],
        p_options: {}
      })

      if (error) {
        console.error('[CashewAPI] Entity creation failed:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('[CashewAPI] Entity creation error:', error)
      return { 
        data: null, 
        error: { message: 'Failed to create entity', details: error }
      }
    }
  }

  /**
   * List entities by type with dynamic data
   */
  static async listEntities(
    entityType: string,
    organizationId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    try {
      const { data, error } = await apiV2.post('rpc/hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: null, // Will be resolved by API v2 gateway
        p_organization_id: organizationId,
        p_entity: {
          entity_type: entityType
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {
          limit: options.limit || 50,
          offset: options.offset || 0,
          include_dynamic: true,
          include_relationships: false
        }
      })

      if (error) {
        console.error('[CashewAPI] Entity listing failed:', error)
        return { data: [], error }
      }

      return { data: data?.entities || [], error: null }
    } catch (error) {
      console.error('[CashewAPI] Entity listing error:', error)
      return { 
        data: [], 
        error: { message: 'Failed to list entities', details: error }
      }
    }
  }

  /**
   * Update an existing entity
   */
  static async updateEntity(
    entityId: string,
    updates: Partial<CashewEntity>,
    dynamicFields: Omit<CashewDynamicField, 'entity_id' | 'organization_id'>[] = []
  ) {
    try {
      const { data, error } = await apiV2.post('rpc/hera_entities_crud_v1', {
        p_action: 'UPDATE',
        p_actor_user_id: null,
        p_organization_id: updates.organization_id!,
        p_entity: {
          id: entityId,
          ...updates
        },
        p_dynamic: dynamicFields.reduce((acc, field) => {
          acc[field.field_name] = {
            field_type: field.field_type,
            field_value_text: field.field_value_text || null,
            field_value_number: field.field_value_number || null,
            field_value_boolean: field.field_value_boolean || null,
            field_value_date: field.field_value_date || null,
            smart_code: field.smart_code
          }
          return acc
        }, {} as Record<string, any>),
        p_relationships: [],
        p_options: {}
      })

      return { data, error }
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to update entity', details: error }
      }
    }
  }

  /**
   * Delete an entity
   */
  static async deleteEntity(entityId: string, organizationId: string) {
    try {
      const { data, error } = await apiV2.post('rpc/hera_entities_crud_v1', {
        p_action: 'DELETE',
        p_actor_user_id: null,
        p_organization_id: organizationId,
        p_entity: {
          id: entityId
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      })

      return { data, error }
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to delete entity', details: error }
      }
    }
  }
}

/**
 * HERA Transactions CRUD Operations
 */
export class CashewTransactionsAPI {
  /**
   * Create a new manufacturing transaction
   */
  static async createTransaction(
    transaction: Omit<CashewTransaction, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
    lines: Omit<CashewTransactionLine, 'id' | 'transaction_id' | 'organization_id'>[] = []
  ) {
    try {
      const { data, error } = await apiV2.post('rpc/hera_txn_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: null, // Will be resolved by API v2 gateway
        p_organization_id: transaction.organization_id,
        p_transaction: {
          transaction_type: transaction.transaction_type,
          transaction_code: transaction.transaction_code || null,
          smart_code: transaction.smart_code,
          source_entity_id: transaction.source_entity_id || null,
          target_entity_id: transaction.target_entity_id || null,
          total_amount: transaction.total_amount || 0,
          transaction_currency_code: transaction.transaction_currency_code || 'INR',
          transaction_date: transaction.transaction_date || new Date().toISOString(),
          transaction_status: transaction.transaction_status || 'draft'
        },
        p_lines: lines.map((line, index) => ({
          line_number: line.line_number || (index + 1),
          line_type: line.line_type,
          entity_id: line.entity_id || null,
          quantity: line.quantity || 1,
          unit_amount: line.unit_amount || 0,
          line_amount: line.line_amount || 0,
          description: line.description || '',
          smart_code: line.smart_code || transaction.smart_code
        })),
        p_options: {}
      })

      if (error) {
        console.error('[CashewAPI] Transaction creation failed:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('[CashewAPI] Transaction creation error:', error)
      return { 
        data: null, 
        error: { message: 'Failed to create transaction', details: error }
      }
    }
  }

  /**
   * List transactions by type
   */
  static async listTransactions(
    transactionType: string,
    organizationId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    try {
      const { data, error } = await apiV2.post('rpc/hera_txn_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: null,
        p_organization_id: organizationId,
        p_transaction: {
          transaction_type: transactionType
        },
        p_lines: [],
        p_options: {
          limit: options.limit || 50,
          offset: options.offset || 0,
          include_lines: true
        }
      })

      if (error) {
        console.error('[CashewAPI] Transaction listing failed:', error)
        return { data: [], error }
      }

      return { data: data?.transactions || [], error: null }
    } catch (error) {
      console.error('[CashewAPI] Transaction listing error:', error)
      return { 
        data: [], 
        error: { message: 'Failed to list transactions', details: error }
      }
    }
  }
}

/**
 * Cashew-specific entity type helpers
 */
export const CashewEntityTypes = {
  MATERIAL: 'MATERIAL',
  PRODUCT: 'PRODUCT', 
  BATCH: 'BATCH',
  WORK_CENTER: 'WORK_CENTER',
  LOCATION: 'LOCATION',
  BOM: 'BOM',
  COST_CENTER: 'COST_CENTER',
  PROFIT_CENTER: 'PROFIT_CENTER'
} as const

export const CashewTransactionTypes = {
  MFG_ISSUE: 'MFG_ISSUE',
  MFG_LABOR: 'MFG_LABOR',
  MFG_OVERHEAD: 'MFG_OVERHEAD',
  MFG_RECEIPT: 'MFG_RECEIPT',
  MFG_BATCHCOST: 'MFG_BATCHCOST',
  MFG_QC: 'MFG_QC'
} as const

/**
 * Smart code generators for cashew entities
 */
export const CashewSmartCodes = {
  entity: (entityType: string, subType?: string) => 
    `HERA.CASHEW.${entityType.toUpperCase()}${subType ? `.${subType.toUpperCase()}` : ''}.ENTITY.v1`,
  
  transaction: (transactionType: string) => 
    `HERA.CASHEW.${transactionType.toUpperCase()}.TXN.v1`,
    
  field: (entityType: string, fieldName: string) =>
    `HERA.CASHEW.${entityType.toUpperCase()}.FIELD.${fieldName.toUpperCase()}.v1`
}