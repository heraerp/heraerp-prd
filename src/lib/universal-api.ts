/**
 * 🌐 HERA Universal API Client
 * 
 * Complete client for HERA's universal 7-table schema CRUD operations
 * - Auto organization_id handling
 * - Type-safe operations
 * - Mock mode support
 * - Batch operations
 * - Schema introspection
 */

interface UniversalApiConfig {
  baseUrl?: string
  organizationId?: string
  authToken?: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
  table?: string
  mode?: string
}

interface TableSchema {
  primary_key: string
  required_fields: string[]
  optional_fields: string[]
  auto_fields: string[]
  has_org_filter: boolean
  description: string
}

interface UniversalSchemaResponse {
  success: boolean
  tables: Record<string, TableSchema>
  table_count: number
  endpoints: Record<string, string>
}

type UniversalTable = 
  | 'core_clients'
  | 'core_organizations'
  | 'core_entities'
  | 'core_dynamic_data'
  | 'core_relationships'
  | 'universal_transactions'
  | 'universal_transaction_lines'

export class UniversalApiClient {
  private config: UniversalApiConfig
  private baseUrl: string

  constructor(config: UniversalApiConfig = {}) {
    this.config = {
      baseUrl: '/api/v1/universal',
      ...config
    }
    this.baseUrl = this.config.baseUrl || '/api/v1/universal'
  }

  // Configuration
  setOrganizationId(organizationId: string) {
    this.config.organizationId = organizationId
  }

  setAuthToken(token: string) {
    this.config.authToken = token
  }

  // Schema Operations
  async getSchema(table?: UniversalTable): Promise<UniversalSchemaResponse> {
    const url = table 
      ? `${this.baseUrl}?action=schema&table=${table}`
      : `${this.baseUrl}?action=schema`
      
    const response = await fetch(url, {
      headers: this.getHeaders()
    })
    
    return response.json()
  }

  async getHealth(): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}?action=health`, {
      headers: this.getHeaders()
    })
    
    return response.json()
  }

  // CRUD Operations
  
  /**
   * Create a new record in any universal table
   */
  async create<T = any>(
    table: UniversalTable, 
    data: Partial<T>, 
    organizationId?: string
  ): Promise<ApiResponse<T>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        action: 'create',
        table,
        data,
        organization_id: organizationId || this.config.organizationId
      })
    })
    
    return response.json()
  }

  /**
   * Read records from any universal table
   */
  async read<T = any>(
    table: UniversalTable,
    id?: string,
    organizationId?: string
  ): Promise<ApiResponse<T[]>> {
    const params = new URLSearchParams({
      action: 'read',
      table
    })
    
    if (id) params.set('id', id)
    if (organizationId || this.config.organizationId) {
      params.set('organization_id', organizationId || this.config.organizationId!)
    }
    
    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: this.getHeaders()
    })
    
    return response.json()
  }

  /**
   * Update a record in any universal table
   */
  async update<T = any>(
    table: UniversalTable,
    id: string,
    data: Partial<T>,
    organizationId?: string
  ): Promise<ApiResponse<T>> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        table,
        id,
        data,
        organization_id: organizationId || this.config.organizationId
      })
    })
    
    return response.json()
  }

  /**
   * Delete a record from any universal table
   */
  async delete(
    table: UniversalTable,
    id: string,
    organizationId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      table,
      id
    })
    
    if (organizationId || this.config.organizationId) {
      params.set('organization_id', organizationId || this.config.organizationId!)
    }
    
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    return response.json()
  }

  /**
   * Batch create multiple records
   */
  async batchCreate<T = any>(
    table: UniversalTable,
    records: Partial<T>[],
    organizationId?: string
  ): Promise<ApiResponse<T[]>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        action: 'batch_create',
        table,
        data: records,
        organization_id: organizationId || this.config.organizationId
      })
    })
    
    return response.json()
  }

  /**
   * Validate data before creating/updating
   */
  async validate<T = any>(
    table: UniversalTable,
    data: Partial<T>
  ): Promise<ApiResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        action: 'validate',
        table,
        data
      })
    })
    
    return response.json()
  }

  // Convenience Methods for Common Operations

  /**
   * Client Operations (Top-level consolidation groups)
   */
  async createClient(data: {
    client_name: string
    client_code: string
    client_type: string
    parent_client_id?: string
    headquarters_country?: string
    incorporation_country?: string
    stock_exchange?: string
    ticker_symbol?: string
    legal_entity_identifier?: string
    tax_identification_number?: string
    regulatory_status?: string
    compliance_requirements?: any
    primary_contact_email?: string
    primary_contact_phone?: string
    website?: string
    primary_address?: any
    fiscal_year_end?: string
    reporting_currency?: string
    base_timezone?: string
    status?: string
    subscription_tier?: string
    client_settings?: any
    ai_insights?: any
    ai_classification?: string
    ai_confidence?: number
    ai_risk_profile?: any
  }) {
    return this.create('core_clients', data)
  }

  async getClients() {
    return this.read('core_clients')
  }

  async updateClient(id: string, data: Partial<any>) {
    return this.update('core_clients', id, data)
  }

  async getClientWithOrganizations(clientId: string) {
    // Get client details
    const clientResponse = await this.read('core_clients', clientId)
    if (!clientResponse.success) return clientResponse

    // Get all organizations for this client
    const orgsResponse = await this.read('core_organizations')
    const clientOrganizations = orgsResponse.data?.filter((org: any) => 
      org.client_id === clientId
    )

    return {
      success: true,
      data: {
        client: clientResponse.data?.[0],
        organizations: clientOrganizations || [],
        organization_count: clientOrganizations?.length || 0
      }
    }
  }

  /**
   * Organization Operations
   */
  async createOrganization(data: {
    organization_name: string
    organization_code: string
    status?: string
    subscription_plan?: string
    max_users?: number
    metadata?: any
  }) {
    return this.create('core_organizations', data)
  }

  async getOrganizations() {
    return this.read('core_organizations')
  }

  async updateOrganization(id: string, data: Partial<any>) {
    return this.update('core_organizations', id, data)
  }

  /**
   * Entity Operations (customers, products, GL accounts, etc.)
   */
  async createEntity(data: {
    entity_type: string
    entity_name: string
    entity_code?: string
    smart_code?: string
    status?: string
    metadata?: any
  }, organizationId?: string) {
    return this.create('core_entities', data, organizationId)
  }

  async getEntities(entityType?: string, organizationId?: string) {
    const response = await this.read('core_entities', undefined, organizationId)
    
    if (entityType && response.success) {
      response.data = response.data?.filter((entity: any) => 
        entity.entity_type === entityType
      )
      response.count = response.data?.length || 0
    }
    
    return response
  }

  async updateEntity(id: string, data: Partial<any>, organizationId?: string) {
    return this.update('core_entities', id, data, organizationId)
  }

  async deleteEntity(id: string, organizationId?: string) {
    return this.delete('core_entities', id, organizationId)
  }

  /**
   * Dynamic Data Operations (custom fields)
   */
  async setDynamicField(
    entityId: string,
    fieldName: string,
    fieldValue: string,
    fieldType?: string,
    organizationId?: string
  ) {
    return this.create('core_dynamic_data', {
      entity_id: entityId,
      field_name: fieldName,
      field_value: fieldValue,
      field_type: fieldType || 'text'
    }, organizationId)
  }

  async getDynamicData(entityId?: string, organizationId?: string) {
    const response = await this.read('core_dynamic_data', undefined, organizationId)
    
    if (entityId && response.success) {
      response.data = response.data?.filter((item: any) => 
        item.entity_id === entityId
      )
      response.count = response.data?.length || 0
    }
    
    return response
  }

  /**
   * Transaction Operations
   */
  async createTransaction(data: {
    transaction_type: string
    transaction_date?: string
    reference_number?: string
    total_amount?: number
    status?: string
    smart_code?: string
    metadata?: any
  }, organizationId?: string) {
    return this.create('universal_transactions', data, organizationId)
  }

  async getTransactions(organizationId?: string) {
    return this.read('universal_transactions', undefined, organizationId)
  }

  async updateTransaction(id: string, data: Partial<any>, organizationId?: string) {
    return this.update('universal_transactions', id, data, organizationId)
  }

  /**
   * Relationship Operations
   */
  async createRelationship(data: {
    parent_entity_id: string
    child_entity_id: string
    relationship_type: string
    relationship_metadata?: any
    status?: string
  }, organizationId?: string) {
    return this.create('core_relationships', data, organizationId)
  }

  async getRelationships(entityId?: string, organizationId?: string) {
    const response = await this.read('core_relationships', undefined, organizationId)
    
    if (entityId && response.success) {
      response.data = response.data?.filter((rel: any) => 
        rel.parent_entity_id === entityId || rel.child_entity_id === entityId
      )
      response.count = response.data?.length || 0
    }
    
    return response
  }

  // Helper Methods
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (this.config.authToken) {
      headers.Authorization = `Bearer ${this.config.authToken}`
    }
    
    return headers
  }

  /**
   * Quick setup for common business scenarios with client hierarchy
   */
  async setupBusiness(businessData: {
    client_name?: string
    client_code?: string
    client_type?: string
    organization_name: string
    organization_code: string
    organization_type: string
    owner_name: string
    owner_email: string
    business_type: string
    create_client?: boolean
  }) {
    try {
      let clientId: string | undefined

      // 1. Create client if requested (for consolidation groups)
      if (businessData.create_client) {
        const clientResult = await this.createClient({
          client_name: businessData.client_name || businessData.organization_name + ' Group',
          client_code: businessData.client_code || businessData.organization_code + '-GRP',
          client_type: businessData.client_type || 'enterprise_group',
          headquarters_country: 'United States',
          reporting_currency: 'USD',
          status: 'active'
        })

        if (!clientResult.success) {
          throw new Error(`Failed to create client: ${clientResult.error}`)
        }

        clientId = clientResult.data?.id
      }

      // 2. Create organization
      const orgResult = await this.createOrganization({
        organization_name: businessData.organization_name,
        organization_code: businessData.organization_code,
        organization_type: businessData.organization_type,
        client_id: clientId || '123e4567-e89b-12d3-a456-426614174000', // Default client
        industry: businessData.business_type,
        status: 'active'
      })

      if (!orgResult.success) {
        throw new Error(`Failed to create organization: ${orgResult.error}`)
      }

      const organizationId = orgResult.data?.id

      // 3. Create owner entity
      const ownerResult = await this.createEntity({
        entity_type: 'user',
        entity_name: businessData.owner_name,
        entity_code: `USER001`,
        status: 'active'
      }, organizationId)

      // 4. Add owner dynamic data
      if (ownerResult.success) {
        await this.setDynamicField(
          ownerResult.data?.id,
          'email',
          businessData.owner_email,
          'text',
          organizationId
        )
        
        await this.setDynamicField(
          ownerResult.data?.id,
          'role',
          'owner',
          'text',
          organizationId
        )
      }

      return {
        success: true,
        client_id: clientId,
        organization_id: organizationId,
        organization: orgResult.data,
        owner: ownerResult.data,
        message: 'Business setup completed successfully with client hierarchy'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Business setup failed'
      }
    }
  }
}

// Default instance
export const universalApi = new UniversalApiClient()

// Export types for TypeScript usage
export type { 
  UniversalTable, 
  ApiResponse, 
  TableSchema, 
  UniversalSchemaResponse,
  UniversalApiConfig 
}