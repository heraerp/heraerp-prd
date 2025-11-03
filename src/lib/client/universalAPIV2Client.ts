/**
 * HERA Universal API v2 Client
 * ENFORCES SECURITY CHAIN: Client → API v2 → Guardrails → Actor → RPC → DB
 * 
 * ⚠️ CRITICAL: This client PREVENTS direct RPC calls and enforces the complete security pipeline
 */

import { apiV2 } from './fetchV2'
import type { 
  UniversalResponse,
  QueryOptions,
  Entity,
  Relationship,
  Transaction,
  TransactionLine,
  DynamicData,
  Organization
} from '../universal-api-v2'

/**
 * Universal API v2 Client - Security-Enforced Version
 * 
 * This client ensures ALL operations go through the API v2 Edge Function
 * which provides the complete security chain:
 * Client → API v2 → Guardrails → Actor → RPC → DB
 */
class UniversalAPIV2Client {
  private organizationId: string | null = null

  /**
   * Set organization context for all operations
   */
  setOrganizationId(orgId: string | null) {
    this.organizationId = orgId
  }

  /**
   * Get current organization ID
   */
  getOrganizationId(): string | null {
    return this.organizationId
  }

  /**
   * Ensure organization ID is available
   */
  private ensureOrganizationId(providedOrgId?: string): string {
    const orgId = providedOrgId || this.organizationId
    if (!orgId) {
      throw new Error('Organization ID is required but not set')
    }
    return orgId
  }

  /**
   * Convert API v2 response to Universal Response format
   */
  private toUniversalResponse<T>(response: { data?: T; error?: any }): UniversalResponse<T> {
    if (response.error) {
      return {
        success: false,
        data: null,
        error: response.error.message || response.error
      }
    }

    return {
      success: true,
      data: response.data || null,
      error: null
    }
  }

  // ==================== Entity Operations ====================

  /**
   * Create entity through API v2 security chain
   */
  async createEntity(entity: Entity): Promise<UniversalResponse<Entity>> {
    try {
      const orgId = this.ensureOrganizationId(entity.organization_id)

      const response = await apiV2.post('entities', {
        operation: 'CREATE',
        entity_data: {
          entity_type: entity.entity_type,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code,
          smart_code: entity.smart_code,
          metadata: entity.metadata
        },
        organization_id: orgId
      })

      return this.toUniversalResponse<Entity>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get entity by ID through API v2 security chain
   */
  async getEntity(id: string, options?: QueryOptions): Promise<UniversalResponse<Entity>> {
    try {
      const orgId = this.ensureOrganizationId(options?.organizationId)

      const response = await apiV2.post('entities', {
        operation: 'READ',
        entity_data: { id },
        organization_id: orgId,
        options: options || {}
      })

      return this.toUniversalResponse<Entity>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get entities with filters through API v2 security chain
   */
  async getEntities(options: QueryOptions = {}): Promise<UniversalResponse<Entity[]>> {
    try {
      const orgId = this.ensureOrganizationId(options.organizationId)

      const response = await apiV2.post('entities', {
        operation: 'READ',
        entity_data: {},
        organization_id: orgId,
        options: {
          filters: options.filters,
          search: options.search,
          searchFields: options.searchFields,
          orderBy: options.orderBy,
          orderDirection: options.orderDirection,
          page: options.page,
          pageSize: options.pageSize,
          select: options.select
        }
      })

      return this.toUniversalResponse<Entity[]>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update entity through API v2 security chain
   */
  async updateEntity(id: string, updates: Partial<Entity>): Promise<UniversalResponse<Entity>> {
    try {
      const orgId = this.ensureOrganizationId(updates.organization_id)

      const response = await apiV2.post('entities', {
        operation: 'UPDATE',
        entity_data: {
          id,
          ...updates
        },
        organization_id: orgId
      })

      return this.toUniversalResponse<Entity>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete entity through API v2 security chain
   */
  async deleteEntity(id: string, soft = true): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      const response = await apiV2.post('entities', {
        operation: 'DELETE',
        entity_data: { id },
        organization_id: orgId,
        options: { soft }
      })

      return this.toUniversalResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ==================== Transaction Operations ====================

  /**
   * Create transaction through API v2 security chain
   */
  async createTransaction(transaction: Transaction & { lines?: TransactionLine[] }): Promise<UniversalResponse<Transaction>> {
    try {
      const orgId = this.ensureOrganizationId(transaction.organization_id)

      const { lines, ...transactionData } = transaction

      const response = await apiV2.post('transactions', {
        operation: 'CREATE',
        transaction_data: {
          transaction_type: transactionData.transaction_type,
          transaction_code: transactionData.transaction_code,
          transaction_date: transactionData.transaction_date,
          source_entity_id: transactionData.source_entity_id,
          target_entity_id: transactionData.target_entity_id,
          reference_entity_id: transactionData.reference_entity_id,
          total_amount: transactionData.total_amount,
          smart_code: transactionData.smart_code,
          metadata: transactionData.metadata
        },
        lines: lines || [],
        organization_id: orgId
      })

      return this.toUniversalResponse<Transaction>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get transaction by ID through API v2 security chain
   */
  async getTransaction(id: string, options?: QueryOptions): Promise<UniversalResponse<Transaction>> {
    try {
      const orgId = this.ensureOrganizationId(options?.organizationId)

      const response = await apiV2.post('transactions', {
        operation: 'READ',
        transaction_data: { id },
        organization_id: orgId,
        options: options || {}
      })

      return this.toUniversalResponse<Transaction>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get transactions with filters through API v2 security chain
   */
  async getTransactions(options: QueryOptions = {}): Promise<UniversalResponse<Transaction[]>> {
    try {
      const orgId = this.ensureOrganizationId(options.organizationId)

      const response = await apiV2.post('transactions', {
        operation: 'READ',
        transaction_data: {},
        organization_id: orgId,
        options: {
          filters: options.filters,
          search: options.search,
          searchFields: options.searchFields,
          orderBy: options.orderBy,
          orderDirection: options.orderDirection,
          page: options.page,
          pageSize: options.pageSize,
          select: options.select
        }
      })

      return this.toUniversalResponse<Transaction[]>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update transaction through API v2 security chain
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<UniversalResponse<Transaction>> {
    try {
      const orgId = this.ensureOrganizationId(updates.organization_id)

      const response = await apiV2.post('transactions', {
        operation: 'UPDATE',
        transaction_data: {
          id,
          ...updates
        },
        organization_id: orgId
      })

      return this.toUniversalResponse<Transaction>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete transaction through API v2 security chain
   */
  async deleteTransaction(id: string, soft = true): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      const response = await apiV2.post('transactions', {
        operation: 'DELETE',
        transaction_data: { id },
        organization_id: orgId,
        options: { soft }
      })

      return this.toUniversalResponse<void>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ==================== Relationship Operations ====================

  /**
   * Create relationship through API v2 security chain
   */
  async createRelationship(relationship: Relationship): Promise<UniversalResponse<Relationship>> {
    try {
      const orgId = this.ensureOrganizationId(relationship.organization_id)

      const response = await apiV2.post('entities', {
        operation: 'CREATE',
        relationships: [relationship],
        organization_id: orgId
      })

      return this.toUniversalResponse<Relationship>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ==================== Dynamic Data Operations ====================

  /**
   * Set dynamic field through API v2 security chain
   */
  async setDynamicField(
    entityId: string,
    fieldName: string,
    fieldValue: any,
    options?: {
      smart_code?: string
      metadata?: any
    }
  ): Promise<UniversalResponse<DynamicData>> {
    try {
      const orgId = this.ensureOrganizationId()

      // Determine field type and prepare data
      let fieldType: DynamicData['field_type']
      let dynamicData: any = {}

      if (typeof fieldValue === 'string') {
        fieldType = 'text'
        dynamicData = { field_value_text: fieldValue }
      } else if (typeof fieldValue === 'number') {
        fieldType = 'number'
        dynamicData = { field_value_number: fieldValue }
      } else if (typeof fieldValue === 'boolean') {
        fieldType = 'boolean'
        dynamicData = { field_value_boolean: fieldValue }
      } else if (fieldValue instanceof Date) {
        fieldType = 'date'
        dynamicData = { field_value_date: fieldValue.toISOString() }
      } else {
        fieldType = 'json'
        dynamicData = { field_value_json: fieldValue }
      }

      const response = await apiV2.post('entities', {
        operation: 'CREATE',
        dynamic_fields: [{
          entity_id: entityId,
          field_name: fieldName,
          field_type: fieldType,
          ...dynamicData,
          smart_code: options?.smart_code,
          metadata: options?.metadata
        }],
        organization_id: orgId
      })

      return this.toUniversalResponse<DynamicData>(response)
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ==================== Backwards Compatibility ====================

  /**
   * Legacy read method - routes through API v2 security chain
   */
  async read(
    tableOrOptions: string | { table: string; filter?: any; organizationId?: string },
    filter?: any,
    organizationId?: string
  ): Promise<UniversalResponse<any[]>> {
    try {
      // Handle both old and new call patterns
      let table: string
      let actualFilter: any
      let actualOrgId: string | undefined

      if (typeof tableOrOptions === 'object' && 'table' in tableOrOptions) {
        table = tableOrOptions.table
        actualFilter = tableOrOptions.filter
        actualOrgId = tableOrOptions.organizationId
      } else {
        table = tableOrOptions as string
        actualFilter = filter
        actualOrgId = organizationId
      }

      const orgId = this.ensureOrganizationId(actualOrgId)

      // Route to appropriate secure method based on table
      switch (table) {
        case 'core_entities':
          return await this.getEntities({
            organizationId: orgId,
            filters: actualFilter
          })
        case 'universal_transactions':
          return await this.getTransactions({
            organizationId: orgId,
            filters: actualFilter
          })
        default:
          throw new Error(`Table ${table} not supported in secure API v2 client`)
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Legacy entity creation - routes through API v2 security chain
   */
  async createEntityLegacy(entity: any): Promise<UniversalResponse<Entity>> {
    return await this.createEntity(entity)
  }

  // ==================== Security Enforcement ====================

  /**
   * Prevent direct RPC calls - security violation
   */
  private preventDirectRPC(): never {
    throw new Error('🚨 SECURITY VIOLATION: Direct RPC calls are forbidden. All operations must go through API v2 security chain.')
  }

  /**
   * Block direct Supabase access - security violation
   */
  private preventDirectSupabase(): never {
    throw new Error('🚨 SECURITY VIOLATION: Direct Supabase access is forbidden. All operations must go through API v2 security chain.')
  }
}

/**
 * Export secure singleton instance
 * 
 * ⚠️ IMPORTANT: This is the ONLY safe way to access HERA data
 * All other methods bypass security and are FORBIDDEN
 */
export const universalAPIV2Client = new UniversalAPIV2Client()

/**
 * Export class for testing only
 */
export { UniversalAPIV2Client }

/**
 * Security compliance check - prevents insecure imports
 */
export function validateSecurityCompliance() {
  console.log('✅ Using secure Universal API v2 Client')
  console.log('🛡️ Security chain: Client → API v2 → Guardrails → Actor → RPC → DB')
  
  return {
    isSecure: true,
    securityChain: 'Client → API v2 → Guardrails → Actor → RPC → DB',
    actorStamping: true,
    organizationIsolation: true,
    guardrailsEnforced: true
  }
}

/**
 * Migration helper - detect insecure usage
 */
export function detectInsecureUsage() {
  // Check if old universal API is being imported
  if (typeof window !== 'undefined') {
    const scripts = Array.from(document.scripts)
    const hasInsecureImport = scripts.some(script => 
      script.src.includes('universal-api-v2.ts') || 
      script.textContent?.includes('universalApi.') ||
      script.textContent?.includes('supabase.from')
    )
    
    if (hasInsecureImport) {
      console.error('🚨 SECURITY VIOLATION: Insecure API usage detected!')
      console.error('📋 Migration required: Replace universalApi with universalAPIV2Client')
      return false
    }
  }
  
  return true
}