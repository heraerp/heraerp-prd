/**
 * HERA Client - Enforces API v2 Gateway Usage
 * 
 * SECURITY GUARANTEE: All operations go through Enhanced Gateway
 * - No direct RPC access
 * - Complete actor stamping
 * - Organization isolation
 * - Guardrails v2.0 validation
 * 
 * Smart Code: HERA.SDK.CLIENT.MAIN.v1
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { 
  HeraClientOptions, 
  HeraEntity, 
  HeraTransaction, 
  HeraResponse, 
  HeraErrorResponse,
  HeraDynamicField,
  HeraRelationship
} from '../types'
import { validateSmartCode, validateOrganizationId } from '../validation'

export class HeraClient {
  private supabase: SupabaseClient
  protected gatewayBaseUrl: string
  protected organizationId: string
  private authToken?: string

  constructor(options: HeraClientOptions) {
    // Validate required options
    if (!options.supabaseUrl || !options.supabaseAnonKey) {
      throw new Error('Supabase URL and anon key are required')
    }
    
    if (!validateOrganizationId(options.organizationId)) {
      throw new Error('Valid organization ID is required')
    }

    this.supabase = createClient(options.supabaseUrl, options.supabaseAnonKey)
    this.gatewayBaseUrl = `${options.supabaseUrl}/functions/v1/api-v2`
    this.organizationId = options.organizationId
    this.authToken = options.authToken
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token
  }

  /**
   * Get current authentication status
   */
  async getAuth() {
    return this.supabase.auth.getSession()
  }

  /**
   * ENTITIES API - All operations via Enhanced Gateway
   */
  
  /**
   * Create entity via Enhanced Gateway
   * ENFORCES: Actor stamping, org isolation, guardrails validation
   */
  async createEntity(entityData: Partial<HeraEntity>): Promise<HeraResponse<HeraEntity>> {
    return this.makeGatewayRequest('POST', '/entities', {
      operation: 'CREATE',
      entity_data: {
        ...entityData,
        organization_id: this.organizationId
      },
      organization_id: this.organizationId
    })
  }

  /**
   * Read entity via Enhanced Gateway
   */
  async readEntity(entityId: string): Promise<HeraResponse<HeraEntity>> {
    return this.makeGatewayRequest('POST', '/entities', {
      operation: 'READ',
      entity_data: { 
        id: entityId,
        organization_id: this.organizationId 
      },
      organization_id: this.organizationId
    })
  }

  /**
   * Update entity via Enhanced Gateway
   */
  async updateEntity(entityId: string, updates: Partial<HeraEntity>): Promise<HeraResponse<HeraEntity>> {
    return this.makeGatewayRequest('POST', '/entities', {
      operation: 'UPDATE',
      entity_data: {
        id: entityId,
        ...updates,
        organization_id: this.organizationId
      },
      organization_id: this.organizationId
    })
  }

  /**
   * Delete entity via Enhanced Gateway
   */
  async deleteEntity(entityId: string): Promise<HeraResponse<{ success: boolean }>> {
    return this.makeGatewayRequest('POST', '/entities', {
      operation: 'DELETE',
      entity_data: {
        id: entityId,
        organization_id: this.organizationId
      },
      organization_id: this.organizationId
    })
  }

  /**
   * Search entities via Enhanced Gateway
   */
  async searchEntities(params: {
    entity_type?: string
    search_text?: string
    limit?: number
  }): Promise<HeraResponse<{ entities: HeraEntity[], total: number }>> {
    return this.makeGatewayRequest('POST', '/entities/search', {
      ...params,
      organization_id: this.organizationId
    })
  }

  /**
   * TRANSACTIONS API - All operations via Enhanced Gateway
   */
  
  /**
   * Create transaction via Enhanced Gateway
   * ENFORCES: GL balance validation, actor stamping
   */
  async createTransaction(transactionData: Partial<HeraTransaction>): Promise<HeraResponse<HeraTransaction>> {
    // Validate Smart Code if present
    if (transactionData.smart_code && !validateSmartCode(transactionData.smart_code)) {
      throw new Error('Invalid Smart Code format')
    }

    return this.makeGatewayRequest('POST', '/transactions', {
      operation: 'CREATE',
      transaction_data: {
        ...transactionData,
        organization_id: this.organizationId
      },
      organization_id: this.organizationId
    })
  }

  /**
   * Read transaction via Enhanced Gateway
   */
  async readTransaction(transactionId: string): Promise<HeraResponse<HeraTransaction>> {
    return this.makeGatewayRequest('POST', '/transactions', {
      operation: 'READ',
      transaction_data: {
        id: transactionId,
        organization_id: this.organizationId
      },
      organization_id: this.organizationId
    })
  }

  /**
   * DYNAMIC DATA API - Field-level operations
   */
  
  /**
   * Set dynamic field value
   */
  async setDynamicField(entityId: string, field: HeraDynamicField): Promise<HeraResponse<HeraDynamicField>> {
    return this.makeGatewayRequest('POST', '/entities', {
      operation: 'UPDATE',
      entity_data: {
        id: entityId,
        organization_id: this.organizationId
      },
      dynamic_fields: [field],
      organization_id: this.organizationId
    })
  }

  /**
   * RELATIONSHIPS API - Entity relationships
   */
  
  /**
   * Create relationship between entities
   */
  async createRelationship(relationship: HeraRelationship): Promise<HeraResponse<HeraRelationship>> {
    return this.makeGatewayRequest('POST', '/entities', {
      operation: 'UPDATE',
      entity_data: {
        id: relationship.source_entity_id,
        organization_id: this.organizationId
      },
      relationships: [relationship],
      organization_id: this.organizationId
    })
  }

  /**
   * HEALTH & STATUS API
   */
  
  /**
   * Check Enhanced Gateway health
   */
  async healthCheck(): Promise<HeraResponse<any>> {
    return this.makeGatewayRequest('GET', '/health')
  }

  /**
   * Get Enhanced Gateway metrics
   */
  async getMetrics(): Promise<HeraResponse<any>> {
    return this.makeGatewayRequest('GET', '/metrics')
  }

  /**
   * PRIVATE METHODS - Gateway communication
   */
  
  /**
   * Make request to Enhanced Gateway (ENFORCES SECURITY)
   * 
   * CRITICAL: This method ensures all requests go through:
   * 1. JWT validation
   * 2. Actor resolution
   * 3. Organization context
   * 4. Guardrails v2.0 validation
   * 5. Audit trail logging
   */
  protected async makeGatewayRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<HeraResponse<T>> {
    const url = `${this.gatewayBaseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Organization-Id': this.organizationId
    }

    // Add authentication if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (method === 'POST' && data) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      const responseData = await response.json()

      if (!response.ok) {
        const errorResponse: HeraErrorResponse = {
          success: false,
          error: responseData.error || 'Request failed',
          status: response.status,
          request_id: responseData.rid || responseData.request_id
        }
        return errorResponse
      }

      return {
        success: true,
        data: responseData.data || responseData,
        request_id: responseData.rid || responseData.request_id,
        actor: responseData.actor,
        organization: responseData.org || this.organizationId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0
      }
    }
  }

  /**
   * FORBIDDEN METHODS - Prevent RPC bypass
   * 
   * These methods are intentionally NOT implemented to prevent
   * direct RPC access that bypasses Enhanced Gateway security.
   */
  
  // ❌ FORBIDDEN: Direct RPC access
  // rpc() - NOT IMPLEMENTED (use Enhanced Gateway)
  // from() - NOT IMPLEMENTED (use Enhanced Gateway)
  // select() - NOT IMPLEMENTED (use Enhanced Gateway)
  // insert() - NOT IMPLEMENTED (use Enhanced Gateway)
  // update() - NOT IMPLEMENTED (use Enhanced Gateway)
  // delete() - NOT IMPLEMENTED (use Enhanced Gateway)
}