/**
 * 🌐 HERA Universal API Client
 * 
 * Complete client for HERA's universal 7-table schema CRUD operations
 * - Auto organization_id handling
 * - Type-safe operations
 * - Mock mode support
 * - Batch operations
 * - Schema introspection
 * - IFRS-compliant COA setup
 * - Auto-journal posting integration
 */

import { UniversalCOATemplateGenerator } from './coa/universal-coa-template'
import { processTransactionForJournal, runBatchProcessing, checkJournalRelevance } from './auto-journal-engine'
import { HeraSacredValidator } from './hera-sacred-validator'
import { createAutoJournalService, AutoJournalDNAService } from './dna/services/auto-journal-dna-service'

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
    // Determine base URL based on environment
    let defaultBaseUrl = '/api/v1/universal'
    
    // If we're on the server and have access to environment variables
    if (typeof window === 'undefined') {
      // Use localhost for server-side requests
      defaultBaseUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/universal`
        : 'http://localhost:3000/api/v1/universal'
    }
    
    this.config = {
      baseUrl: defaultBaseUrl,
      ...config
    }
    this.baseUrl = this.config.baseUrl || defaultBaseUrl
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
    // Validate against sacred 6-table architecture
    const validation = HeraSacredValidator.validate({
      table,
      operation: 'create',
      data: data as any,
      organizationId: organizationId || this.config.organizationId
    })
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        message: validation.warnings.join('; ')
      }
    }
    
    // Apply auto-fixes if available
    let finalData = data
    if (validation.autoFixes) {
      finalData = HeraSacredValidator.applyAutoFixes(data as any, validation.autoFixes) as any
      console.warn('HERA Sacred Validator applied auto-fixes:', validation.autoFixes)
    }
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        action: 'create',
        table,
        data: finalData,
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
   * Client Operations (Using core_entities with entity_type='client')
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
    // Transform to entity structure
    const entityData = {
      entity_type: 'client',
      entity_name: data.client_name,
      entity_code: data.client_code,
      smart_code: `HERA.CRM.CLIENT.ENT.${data.client_type?.toUpperCase() || 'GENERAL'}.v1`,
      status: data.status || 'active',
      ai_classification: data.ai_classification,
      ai_confidence: data.ai_confidence,
      metadata: {
        client_type: data.client_type,
        headquarters_country: data.headquarters_country,
        incorporation_country: data.incorporation_country,
        stock_exchange: data.stock_exchange,
        ticker_symbol: data.ticker_symbol,
        legal_entity_identifier: data.legal_entity_identifier,
        tax_identification_number: data.tax_identification_number,
        regulatory_status: data.regulatory_status,
        compliance_requirements: data.compliance_requirements,
        primary_contact_email: data.primary_contact_email,
        primary_contact_phone: data.primary_contact_phone,
        website: data.website,
        primary_address: data.primary_address,
        fiscal_year_end: data.fiscal_year_end,
        reporting_currency: data.reporting_currency,
        base_timezone: data.base_timezone,
        subscription_tier: data.subscription_tier,
        client_settings: data.client_settings,
        ai_insights: data.ai_insights,
        ai_risk_profile: data.ai_risk_profile
      }
    }

    // Create the entity
    const result = await this.createEntity(entityData)
    
    // If there's a parent client, create the relationship
    if (data.parent_client_id && result.success && result.data?.id) {
      await this.createRelationship({
        from_entity_id: data.parent_client_id,
        to_entity_id: result.data.id,
        relationship_type: 'parent_of',
        smart_code: 'HERA.CRM.REL.CLIENT.PARENT.v1'
      })
    }

    return result
  }

  async getClients() {
    // Read entities of type 'client'
    const response = await this.read('core_entities')
    if (response.success && response.data) {
      response.data = response.data.filter((entity: any) => entity.entity_type === 'client')
    }
    return response
  }

  async updateClient(id: string, data: Partial<any>) {
    // Transform data to entity structure if needed
    const entityData: any = {}
    
    if (data.client_name) entityData.entity_name = data.client_name
    if (data.client_code) entityData.entity_code = data.client_code
    if (data.status) entityData.status = data.status
    
    // Put all other fields in metadata
    const metadataFields = Object.keys(data).filter(key => 
      !['client_name', 'client_code', 'status', 'id'].includes(key)
    )
    
    if (metadataFields.length > 0) {
      entityData.metadata = {}
      metadataFields.forEach(field => {
        entityData.metadata[field] = data[field]
      })
    }

    return this.update('core_entities', id, entityData)
  }

  async getClientWithOrganizations(clientId: string) {
    // Get client details from core_entities
    const clientResponse = await this.read('core_entities', clientId)
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
      // Special handling for GL accounts (legacy compatibility)
      if (entityType === 'gl_account') {
        response.data = response.data?.filter((entity: any) => 
          entity.entity_type === 'account' && 
          entity.business_rules?.ledger_type === 'GL'
        )
      } else {
        response.data = response.data?.filter((entity: any) => 
          entity.entity_type === entityType
        )
      }
      response.count = response.data?.length || 0
    }
    
    return response
  }
  
  /**
   * Get GL accounts specifically (convenience method)
   */
  async getGLAccounts(organizationId?: string) {
    const response = await this.read('core_entities', undefined, organizationId)
    
    if (response.success) {
      response.data = response.data?.filter((entity: any) => 
        entity.entity_type === 'account' && 
        entity.business_rules?.ledger_type === 'GL'
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
   * Transaction Line Operations
   */
  async createTransactionLine(data: {
    transaction_id: string
    line_number: number
    line_amount: number
    line_entity_id?: string
    quantity?: number
    unit_price?: number
    smart_code?: string
    metadata?: any
  }, organizationId?: string) {
    return this.create('universal_transaction_lines', data, organizationId)
  }

  async getTransactionLines(transactionId: string, organizationId?: string) {
    return this.read('universal_transaction_lines', undefined, organizationId)
  }

  /**
   * Relationship Operations
   */
  async createRelationship(data: {
    from_entity_id: string
    to_entity_id: string
    relationship_type: string
    relationship_metadata?: any
    status?: string
    smart_code?: string
  }, organizationId?: string) {
    // Ensure smart_code is present
    if (!data.smart_code) {
      data.smart_code = `HERA.REL.${data.relationship_type.toUpperCase()}.GEN.v1`
    }
    return this.create('core_relationships', data, organizationId)
  }

  async getRelationships(entityId?: string, organizationId?: string) {
    const response = await this.read('core_relationships', undefined, organizationId)
    
    if (entityId && response.success) {
      response.data = response.data?.filter((rel: any) => 
        rel.from_entity_id === entityId || rel.to_entity_id === entityId
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

      // 5. Setup IFRS-compliant Chart of Accounts (STANDARD FEATURE)
      let coaSetupResult = null
      if (businessData.business_type) {
        console.log(`   🏛️ Setting up IFRS-compliant COA for ${businessData.business_type} business`)
        coaSetupResult = await this.setupIFRSChartOfAccounts({
          organizationId,
          industry: businessData.business_type,
          country: 'AE', // Default to UAE, can be enhanced later
          organizationName: businessData.organization_name
        })
      }

      // 6. Setup Annual Budget (NEW STANDARD FEATURE)
      let budgetSetupResult = null
      if (businessData.business_type) {
        console.log(`   💰 Setting up annual operating budget for ${businessData.organization_name}`)
        budgetSetupResult = await this.createBudget({
          organizationId,
          budgetName: `${businessData.organization_name} - ${new Date().getFullYear()} Annual Budget`,
          budgetCode: `BUDGET-${new Date().getFullYear()}-${businessData.organization_code}`,
          budgetType: 'operating',
          fiscalYear: new Date().getFullYear(),
          budgetPeriod: 'annual',
          budgetMethod: 'zero_based',
          baseCurrency: 'AED',
          consolidationLevel: 'organization',
          approvalHierarchy: ['OWNER', 'CFO', 'CEO'],
          templateFrom: businessData.business_type
        })

        // Create basic budget template based on industry
        if (budgetSetupResult.success) {
          await this.createBasicBudgetTemplate(
            budgetSetupResult.data.budget_id,
            organizationId,
            businessData.business_type,
            coaSetupResult
          )
        }
      }

      return {
        success: true,
        client_id: clientId,
        organization_id: organizationId,
        organization: orgResult.data,
        owner: ownerResult.data,
        coa_setup: coaSetupResult,
        budget_setup: budgetSetupResult,
        message: `Business setup completed successfully with client hierarchy${coaSetupResult?.success ? ', IFRS-compliant COA' : ''}${budgetSetupResult?.success ? ', and annual budget' : ''}`
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Business setup failed'
      }
    }
  }

  /**
   * 🏛️ IFRS-Compliant Chart of Accounts Setup (STANDARD FEATURE)
   * 
   * Sets up complete IFRS-compliant COA with mandatory lineage fields
   * Supports all industries and countries with universal 5-6-7-8-9 structure
   */
  async setupIFRSChartOfAccounts(params: {
    organizationId: string
    industry: string
    country?: string
    organizationName?: string
    replaceExisting?: boolean
  }) {
    try {
      const {
        organizationId,
        industry,
        country = 'AE',
        organizationName = 'Organization',
        replaceExisting = false
      } = params

      console.log(`🏛️ Setting up IFRS-compliant COA for ${industry} industry in ${country}`)

      // 1. Check if COA already exists
      const existingCOA = await this.read('core_entities', undefined, organizationId)
      const existingAccounts = existingCOA.data?.filter((e: any) => 
        e.entity_type === 'account' && 
        e.business_rules?.ledger_type === 'GL'
      ) || []
      
      if (existingAccounts.length > 0 && !replaceExisting) {
        return {
          success: false,
          error: 'Chart of Accounts already exists. Set replaceExisting=true to overwrite.',
          existing_accounts: existingAccounts.length
        }
      }

      // 2. Remove existing accounts if replacing
      if (replaceExisting && existingAccounts.length > 0) {
        console.log(`   🗑️ Removing ${existingAccounts.length} existing accounts`)
        for (const account of existingAccounts) {
          await this.deleteEntity(account.id, organizationId)
        }
      }

      // 3. Generate IFRS-compliant COA using Universal Template
      const generator = new UniversalCOATemplateGenerator()
      const coaTemplate = generator.generateUniversalCOA(industry, country, organizationName)

      console.log(`   📋 Generated ${coaTemplate.accounts.length} IFRS-compliant accounts`)

      // 4. Create GL account entities with complete IFRS lineage
      const createdAccounts = []
      let successCount = 0
      let errorCount = 0

      for (const account of coaTemplate.accounts) {
        try {
          // Create the account entity with GL ledger type
          const accountResult = await this.createEntity({
            entity_type: 'account',
            entity_name: account.entity_name,
            entity_code: account.entity_code,
            smart_code: account.smart_code,
            status: account.status,
            business_rules: {
              ledger_type: 'GL',
              account_classification: account.account_type,
              accounting_rules: {
                normal_balance: account.normal_balance,
                vat_applicable: account.vat_applicable,
                currency: account.currency
              }
            },
            metadata: {
              account_type: account.account_type,
              normal_balance: account.normal_balance,
              vat_applicable: account.vat_applicable,
              currency: account.currency
            }
          }, organizationId)

          if (accountResult.success && accountResult.data?.id) {
            const accountId = accountResult.data.id

            // Add complete IFRS lineage as dynamic fields
            const ifrsFields = [
              { name: 'ifrs_classification', value: account.ifrs_classification, type: 'text' },
              { name: 'parent_account', value: account.parent_account, type: 'text' },
              { name: 'account_level', value: account.account_level.toString(), type: 'number' },
              { name: 'ifrs_category', value: account.ifrs_category, type: 'text' },
              { name: 'presentation_order', value: account.presentation_order.toString(), type: 'number' },
              { name: 'is_header', value: account.is_header.toString(), type: 'boolean' },
              { name: 'rollup_account', value: account.rollup_account, type: 'text' },
              { name: 'ifrs_statement', value: account.ifrs_statement || 'SPL', type: 'text' },
              { name: 'ifrs_subcategory', value: account.ifrs_subcategory || '', type: 'text' },
              { name: 'consolidation_method', value: account.consolidation_method || 'sum', type: 'text' },
              { name: 'reporting_standard', value: account.reporting_standard || 'IFRS', type: 'text' }
            ]

            // Add each IFRS field
            for (const field of ifrsFields) {
              await this.setDynamicField(
                accountId,
                field.name,
                field.value,
                field.type,
                organizationId
              )
            }

            createdAccounts.push({
              id: accountId,
              code: account.entity_code,
              name: account.entity_name,
              ifrs_category: account.ifrs_category,
              level: account.account_level
            })
            successCount++

          } else {
            console.warn(`   ⚠️ Failed to create account ${account.entity_code}:`, accountResult.error)
            errorCount++
          }

        } catch (error) {
          console.error(`   ❌ Error creating account ${account.entity_code}:`, error)
          errorCount++
        }
      }

      // 5. Create setup tracking transaction
      await this.createTransaction({
        transaction_type: 'ifrs_coa_setup',
        transaction_number: `COA-SETUP-${Date.now()}`,
        description: `IFRS-compliant Chart of Accounts setup for ${industry} industry`,
        reference_number: `${industry.toUpperCase()}-${country}-${Date.now()}`,
        total_amount: successCount,
        metadata: {
          industry,
          country,
          accounts_created: successCount,
          accounts_failed: errorCount,
          ifrs_compliant: true,
          template_version: 'v2',
          setup_date: new Date().toISOString()
        }
      }, organizationId)

      return {
        success: true,
        message: 'IFRS-compliant Chart of Accounts setup completed successfully',
        summary: {
          industry,
          country,
          currency: coaTemplate.currency,
          vat_rate: coaTemplate.vat_rate,
          accounts_created: successCount,
          accounts_failed: errorCount,
          total_accounts: coaTemplate.accounts.length,
          ifrs_compliant: true,
          features: [
            'Complete IFRS lineage hierarchy',
            '5-6-7-8-9 universal numbering structure',
            'Multi-level account relationships',
            'Automatic financial statement mapping',
            'Consolidation method support',
            'Industry-specific customizations'
          ]
        },
        accounts: createdAccounts
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IFRS COA setup failed',
        message: 'Failed to setup IFRS-compliant Chart of Accounts'
      }
    }
  }

  /**
   * 📊 Get IFRS-compliant Chart of Accounts with hierarchy
   */
  async getIFRSChartOfAccounts(organizationId: string) {
    try {
      // Get all GL accounts (entity_type='account' with ledger_type='GL')
      const entitiesResponse = await this.read('core_entities', undefined, organizationId)
      if (!entitiesResponse.success || !entitiesResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch accounts',
          accounts: []
        }
      }
      
      // Filter for GL accounts
      const glAccounts = entitiesResponse.data.filter((e: any) => 
        e.entity_type === 'account' && 
        e.business_rules?.ledger_type === 'GL'
      )

      const accounts = []

      // Enrich each account with IFRS lineage data
      for (const account of glAccounts) {
        const dynamicDataResponse = await this.getDynamicData(account.id, organizationId)
        const dynamicData = dynamicDataResponse.success ? dynamicDataResponse.data || [] : []

        // Build IFRS lineage object
        const ifrsLineage: any = {}
        dynamicData.forEach((field: any) => {
          if (field.field_name.startsWith('ifrs_') || 
              ['parent_account', 'account_level', 'presentation_order', 'is_header', 'rollup_account', 'consolidation_method', 'reporting_standard'].includes(field.field_name)) {
            ifrsLineage[field.field_name] = field.field_value_number !== null ? field.field_value_number : field.field_value
          }
        })

        accounts.push({
          id: account.id,
          entity_code: account.entity_code,
          entity_name: account.entity_name,
          smart_code: account.smart_code,
          status: account.status,
          account_type: account.metadata?.account_type,
          normal_balance: account.metadata?.normal_balance,
          currency: account.metadata?.currency,
          ...ifrsLineage
        })
      }

      // Sort by presentation order
      accounts.sort((a, b) => (a.presentation_order || 0) - (b.presentation_order || 0))

      return {
        success: true,
        message: 'IFRS Chart of Accounts retrieved successfully',
        data: accounts,
        count: accounts.length,
        features: {
          ifrs_compliant: true,
          hierarchical: true,
          multi_level: true,
          statement_mapping: true
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve IFRS COA',
        accounts: []
      }
    }
  }

  /**
   * 🔍 Validate IFRS compliance of existing COA
   */
  async validateIFRSCompliance(organizationId: string) {
    try {
      const coaResponse = await this.getIFRSChartOfAccounts(organizationId)
      if (!coaResponse.success) {
        return {
          success: false,
          error: 'Failed to retrieve COA for validation'
        }
      }

      // Import validation at runtime to avoid circular dependencies
      const { IFRSValidator } = await import('./coa/ifrs-validation')
      const validation = IFRSValidator.validateIFRSCompliance(coaResponse.data || [])

      return {
        success: true,
        validation,
        message: validation.isValid ? 'COA is IFRS compliant' : 'COA has IFRS compliance issues',
        compliance_score: validation.compliance_score,
        status: validation.compliance_score >= 90 ? 'EXCELLENT' : 
                validation.compliance_score >= 75 ? 'GOOD' : 
                validation.compliance_score >= 60 ? 'ADEQUATE' : 'NEEDS_IMPROVEMENT'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IFRS validation failed'
      }
    }
  }

  // =============================================================================
  // 📊 UNIVERSAL BUDGETING SYSTEM - STANDARD FEATURE
  // =============================================================================

  /**
   * 💰 Create Universal Budget Entity
   * 
   * Creates budget as entity with comprehensive metadata and Smart Code classification
   */
  async createBudget(params: {
    organizationId: string
    budgetName: string
    budgetCode: string
    budgetType: 'operating' | 'capital' | 'cash_flow' | 'project'
    fiscalYear: number
    budgetPeriod: 'monthly' | 'quarterly' | 'annual' | 'rolling'
    budgetMethod: 'zero_based' | 'incremental' | 'activity_based' | 'driver_based'
    baseCurrency?: string
    consolidationLevel?: 'department' | 'organization' | 'group'
    approvalHierarchy?: string[]
    templateFrom?: string
  }) {
    try {
      const {
        organizationId,
        budgetName,
        budgetCode,
        budgetType,
        fiscalYear,
        budgetPeriod,
        budgetMethod,
        baseCurrency = 'AED',
        consolidationLevel = 'organization',
        approvalHierarchy = ['DEPT_HEAD', 'CFO', 'CEO'],
        templateFrom
      } = params

      console.log(`💰 Creating ${budgetType} budget for ${fiscalYear}`)

      // 1. Create budget entity
      const budgetEntity = await this.createEntity({
        entity_type: 'budget',
        entity_name: budgetName,
        entity_code: budgetCode,
        smart_code: `HERA.FIN.BUDGET.${budgetType.toUpperCase()}.${budgetPeriod.toUpperCase()}.v1`,
        status: 'draft',
        metadata: {
          budget_type: budgetType,
          budget_period: budgetPeriod,
          fiscal_year: fiscalYear,
          base_currency: baseCurrency,
          budget_method: budgetMethod,
          consolidation_level: consolidationLevel,
          
          // Workflow metadata
          approval_status: 'draft',
          approval_hierarchy: approvalHierarchy,
          version: 'v1.0',
          created_date: new Date().toISOString(),
          
          // Budget controls
          variance_thresholds: {
            revenue: { warning: 5.0, critical: 10.0 },
            costs: { warning: 8.0, critical: 15.0 },
            capex: { warning: 2.0, critical: 5.0 }
          }
        }
      }, organizationId)

      if (!budgetEntity.success) {
        throw new Error(`Failed to create budget entity: ${budgetEntity.error}`)
      }

      const budgetId = budgetEntity.data?.id

      // 2. Add budget configuration as dynamic fields
      const budgetFields = [
        { name: 'budget_start_date', value: `${fiscalYear}-01-01`, type: 'date' },
        { name: 'budget_end_date', value: `${fiscalYear}-12-31`, type: 'date' },
        { name: 'total_revenue_budget', value: '0', type: 'number' },
        { name: 'total_expense_budget', value: '0', type: 'number' },
        { name: 'net_income_budget', value: '0', type: 'number' },
        { name: 'approval_deadline', value: `${fiscalYear}-01-31`, type: 'date' },
        { name: 'budget_owner', value: 'BUDGET_MANAGER', type: 'text' }
      ]

      for (const field of budgetFields) {
        await this.setDynamicField(
          budgetId,
          field.name,
          field.value,
          field.type,
          organizationId
        )
      }

      // 3. Create budget setup transaction for tracking
      await this.createTransaction({
        transaction_type: 'budget_setup',
        transaction_number: `BUDGET-SETUP-${budgetCode}`,
        description: `${budgetType} budget setup for ${fiscalYear}`,
        reference_number: budgetCode,
        reference_entity_id: budgetId,
        total_amount: 0,
        metadata: {
          budget_type: budgetType,
          fiscal_year: fiscalYear,
          budget_method: budgetMethod,
          setup_date: new Date().toISOString(),
          template_from: templateFrom
        }
      }, organizationId)

      return {
        success: true,
        message: `${budgetType} budget created successfully`,
        data: {
          budget_id: budgetId,
          budget_code: budgetCode,
          budget_type: budgetType,
          fiscal_year: fiscalYear,
          status: 'draft'
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Budget creation failed'
      }
    }
  }

  /**
   * 📋 Create Budget Line Items
   * 
   * Creates budget line items as universal transactions with multi-dimensional breakdowns
   */
  async createBudgetLineItems(params: {
    budgetId: string
    organizationId: string
    lineItems: Array<{
      glAccountId: string
      accountCode: string
      accountName: string
      totalAmount: number
      budgetMethod: 'top_down' | 'bottom_up' | 'driver_based'
      budgetDriver?: string
      driverAssumptions?: any
      monthlyBreakdown?: number[]
      dimensions?: {
        costCenter?: string
        profitCenter?: string
        productLine?: string
        geography?: string
        project?: string
        activity?: string
      }
    }>
  }) {
    try {
      const { budgetId, organizationId, lineItems } = params

      console.log(`📋 Creating ${lineItems.length} budget line items`)

      const createdLines = []
      let successCount = 0
      let errorCount = 0

      for (const item of lineItems) {
        try {
          // Create budget line as transaction
          const lineResult = await this.createTransaction({
            transaction_type: 'budget_line',
            transaction_number: `BL-${item.accountCode}-${Date.now()}`,
            description: `Budget line for ${item.accountName}`,
            reference_number: item.accountCode,
            reference_entity_id: budgetId,
            total_amount: item.totalAmount,
            smart_code: `HERA.FIN.BUDGET.LINE.${item.accountCode.startsWith('4') ? 'REVENUE' : 'EXPENSE'}.v1`,
            metadata: {
              gl_account_id: item.glAccountId,
              account_code: item.accountCode,
              account_name: item.accountName,
              budget_method: item.budgetMethod,
              budget_driver: item.budgetDriver,
              driver_assumptions: item.driverAssumptions,
              dimensions: item.dimensions || {}
            }
          }, organizationId)

          if (lineResult.success && lineResult.data?.id) {
            const lineId = lineResult.data.id

            // Add monthly breakdown as transaction lines
            if (item.monthlyBreakdown && item.monthlyBreakdown.length === 12) {
              for (let month = 0; month < 12; month++) {
                await this.create('universal_transaction_lines', {
                  transaction_id: lineId,
                  line_number: month + 1,
                  line_description: `Month ${month + 1} budget`,
                  line_amount: item.monthlyBreakdown[month],
                  metadata: {
                    period: `${new Date().getFullYear()}-${String(month + 1).padStart(2, '0')}`,
                    period_type: 'monthly'
                  }
                }, organizationId)
              }
            }

            // Add dimensional data as dynamic fields
            if (item.dimensions) {
              for (const [dimension, value] of Object.entries(item.dimensions)) {
                if (value) {
                  await this.setDynamicField(
                    lineId,
                    `dimension_${dimension}`,
                    value,
                    'text',
                    organizationId
                  )
                }
              }
            }

            createdLines.push({
              line_id: lineId,
              account_code: item.accountCode,
              amount: item.totalAmount,
              method: item.budgetMethod
            })
            successCount++

          } else {
            console.warn(`Failed to create budget line for ${item.accountCode}:`, lineResult.error)
            errorCount++
          }

        } catch (error) {
          console.error(`Error creating budget line for ${item.accountCode}:`, error)
          errorCount++
        }
      }

      return {
        success: true,
        message: 'Budget line items created successfully',
        summary: {
          lines_created: successCount,
          lines_failed: errorCount,
          total_requested: lineItems.length
        },
        lines: createdLines
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Budget line creation failed'
      }
    }
  }

  /**
   * 📊 Get Budget vs Actual Variance Analysis
   * 
   * Compares budget to actual transactions with comprehensive variance calculation
   */
  async getBudgetVarianceAnalysis(params: {
    budgetId: string
    organizationId: string
    period?: string // 'MTD' | 'QTD' | 'YTD'
    varianceThreshold?: number
  }) {
    try {
      const { budgetId, organizationId, period = 'YTD', varianceThreshold = 5.0 } = params

      console.log(`📊 Analyzing budget variance for period: ${period}`)

      // 1. Get budget lines
      const budgetLinesResponse = await this.read('universal_transactions', undefined, organizationId)
      const budgetLines = budgetLinesResponse.data?.filter((txn: any) => 
        txn.transaction_type === 'budget_line' && txn.reference_entity_id === budgetId
      ) || []

      // 2. Get actual transactions for comparison
      const actualTransactionsResponse = await this.read('universal_transactions', undefined, organizationId)
      const actualTransactions = actualTransactionsResponse.data?.filter((txn: any) => 
        txn.transaction_type !== 'budget_line' && 
        txn.transaction_type !== 'budget_setup' &&
        this.isInCurrentPeriod(txn.transaction_date, period)
      ) || []

      // 3. Calculate variances by account
      const variances = []
      let totalBudgetAmount = 0
      let totalActualAmount = 0

      for (const budgetLine of budgetLines) {
        const accountCode = budgetLine.metadata?.account_code
        if (!accountCode) continue

        // Find actual transactions for this account
        const actualForAccount = actualTransactions.filter((txn: any) => {
          // Match by account code or GL account reference
          return txn.metadata?.gl_account_code === accountCode ||
                 txn.metadata?.account_code === accountCode
        })

        const budgetAmount = budgetLine.total_amount || 0
        const actualAmount = actualForAccount.reduce((sum: number, txn: any) => sum + (txn.total_amount || 0), 0)
        const variance = actualAmount - budgetAmount
        const variancePercent = budgetAmount !== 0 ? (variance / budgetAmount) * 100 : 0

        totalBudgetAmount += budgetAmount
        totalActualAmount += actualAmount

        variances.push({
          account_code: accountCode,
          account_name: budgetLine.metadata?.account_name || accountCode,
          budget_amount: budgetAmount,
          actual_amount: actualAmount,
          variance_amount: variance,
          variance_percent: variancePercent,
          status: Math.abs(variancePercent) > varianceThreshold ? 'critical' : 
                  Math.abs(variancePercent) > (varianceThreshold / 2) ? 'warning' : 'acceptable',
          transaction_count: actualForAccount.length
        })
      }

      // 4. Calculate overall variance
      const totalVariance = totalActualAmount - totalBudgetAmount
      const totalVariancePercent = totalBudgetAmount !== 0 ? (totalVariance / totalBudgetAmount) * 100 : 0

      // 5. Create variance tracking transaction
      await this.createTransaction({
        transaction_type: 'budget_variance_analysis',
        transaction_number: `VAR-${period}-${Date.now()}`,
        description: `Budget variance analysis for ${period}`,
        reference_entity_id: budgetId,
        total_amount: totalVariance,
        smart_code: `HERA.FIN.BUDGET.VARIANCE.${period}.v1`,
        metadata: {
          period,
          total_budget: totalBudgetAmount,
          total_actual: totalActualAmount,
          total_variance: totalVariance,
          variance_percent: totalVariancePercent,
          line_count: variances.length,
          analysis_date: new Date().toISOString()
        }
      }, organizationId)

      return {
        success: true,
        message: 'Budget variance analysis completed',
        data: {
          period,
          summary: {
            total_budget: totalBudgetAmount,
            total_actual: totalActualAmount,
            total_variance: totalVariance,
            variance_percent: totalVariancePercent,
            status: Math.abs(totalVariancePercent) > varianceThreshold ? 'critical' : 
                    Math.abs(totalVariancePercent) > (varianceThreshold / 2) ? 'warning' : 'on_track'
          },
          line_variances: variances.sort((a, b) => Math.abs(b.variance_percent) - Math.abs(a.variance_percent)),
          critical_variances: variances.filter(v => v.status === 'critical'),
          recommendations: this.generateVarianceRecommendations(variances)
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Budget variance analysis failed'
      }
    }
  }

  /**
   * 🔄 Create Rolling Forecast
   * 
   * Creates rolling forecast based on actuals + projections
   */
  async createRollingForecast(params: {
    organizationId: string
    forecastName: string
    forecastHorizon: number // months
    baseBudgetId?: string
    scenarios?: Array<{
      name: string
      probability: number
      assumptions: any
    }>
  }) {
    try {
      const {
        organizationId,
        forecastName,
        forecastHorizon,
        baseBudgetId,
        scenarios = [{ name: 'Base Case', probability: 100, assumptions: {} }]
      } = params

      console.log(`🔄 Creating ${forecastHorizon}-month rolling forecast`)

      // 1. Create forecast entity
      const forecastEntity = await this.createEntity({
        entity_type: 'forecast',
        entity_name: forecastName,
        entity_code: `FORECAST-${Date.now()}`,
        smart_code: 'HERA.FIN.FORECAST.ROLLING.MONTHLY.v1',
        status: 'active',
        metadata: {
          forecast_horizon: forecastHorizon,
          update_frequency: 'monthly',
          base_budget_id: baseBudgetId,
          scenarios: scenarios,
          ml_enabled: true,
          confidence_level: 'medium'
        }
      }, organizationId)

      if (!forecastEntity.success) {
        throw new Error(`Failed to create forecast entity: ${forecastEntity.error}`)
      }

      const forecastId = forecastEntity.data?.id

      // 2. Generate forecast data based on historical trends and scenarios
      for (const scenario of scenarios) {
        await this.generateScenarioForecast(forecastId, scenario, forecastHorizon, organizationId)
      }

      // 3. Create forecast setup transaction
      await this.createTransaction({
        transaction_type: 'forecast_setup',
        transaction_number: `FORECAST-SETUP-${Date.now()}`,
        description: `Rolling forecast setup for ${forecastHorizon} months`,
        reference_entity_id: forecastId,
        total_amount: forecastHorizon,
        metadata: {
          forecast_horizon: forecastHorizon,
          scenario_count: scenarios.length,
          base_budget_id: baseBudgetId,
          setup_date: new Date().toISOString()
        }
      }, organizationId)

      return {
        success: true,
        message: 'Rolling forecast created successfully',
        data: {
          forecast_id: forecastId,
          forecast_name: forecastName,
          horizon_months: forecastHorizon,
          scenario_count: scenarios.length
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rolling forecast creation failed'
      }
    }
  }

  // Helper methods for budgeting
  private isInCurrentPeriod(transactionDate: string, period: string): boolean {
    if (!transactionDate) return false
    
    const txnDate = new Date(transactionDate)
    const now = new Date()
    
    switch (period) {
      case 'MTD':
        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear()
      case 'QTD':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const txnQuarter = Math.floor(txnDate.getMonth() / 3)
        return txnQuarter === currentQuarter && txnDate.getFullYear() === now.getFullYear()
      case 'YTD':
      default:
        return txnDate.getFullYear() === now.getFullYear()
    }
  }

  private generateVarianceRecommendations(variances: any[]): string[] {
    const recommendations = []
    
    const criticalVariances = variances.filter(v => v.status === 'critical')
    if (criticalVariances.length > 0) {
      recommendations.push(`Review ${criticalVariances.length} critical variances requiring immediate attention`)
    }
    
    const revenueVariances = variances.filter(v => v.account_code.startsWith('4') && v.variance_percent < -5)
    if (revenueVariances.length > 0) {
      recommendations.push('Consider increasing marketing spend to address revenue shortfalls')
    }
    
    const costVariances = variances.filter(v => !v.account_code.startsWith('4') && v.variance_percent > 5)
    if (costVariances.length > 0) {
      recommendations.push('Review cost control measures for expense categories over budget')
    }
    
    return recommendations
  }

  private async generateScenarioForecast(forecastId: string, scenario: any, horizonMonths: number, organizationId: string) {
    // Implementation for scenario-based forecasting
    // This would include ML algorithms, trend analysis, etc.
    
    for (let month = 1; month <= horizonMonths; month++) {
      await this.createTransaction({
        transaction_type: 'forecast_line',
        transaction_number: `FL-${scenario.name}-M${month}-${Date.now()}`,
        description: `${scenario.name} forecast for month ${month}`,
        reference_entity_id: forecastId,
        total_amount: 0, // Would be calculated based on scenario assumptions
        metadata: {
          scenario_name: scenario.name,
          forecast_month: month,
          probability: scenario.probability,
          assumptions: scenario.assumptions
        }
      }, organizationId)
    }
  }

  /**
   * 📋 Create Basic Budget Template Based on Industry
   * 
   * Creates industry-specific budget line items using COA accounts
   */
  private async createBasicBudgetTemplate(
    budgetId: string,
    organizationId: string,
    industry: string,
    coaSetupResult: any
  ) {
    if (!coaSetupResult?.success || !coaSetupResult.accounts) {
      console.log(`   ⚠️ COA setup not available, creating basic budget structure`)
      return
    }

    console.log(`   📋 Creating ${industry} budget template with ${coaSetupResult.accounts.length} accounts`)

    // Industry-specific budget assumptions
    const industryDefaults = this.getIndustryBudgetDefaults(industry)

    const budgetLines = []

    // Create budget lines for key accounts
    for (const account of coaSetupResult.accounts) {
      const accountCode = account.code
      const accountName = account.name
      
      // Skip header accounts (level 1-2)
      if (account.level && account.level < 3) continue

      // Get industry-specific budget amount
      const budgetAmount = this.calculateIndustryBudgetAmount(accountCode, industryDefaults)
      
      if (budgetAmount > 0) {
        budgetLines.push({
          glAccountId: account.id,
          accountCode: accountCode,
          accountName: accountName,
          totalAmount: budgetAmount,
          budgetMethod: 'driver_based',
          budgetDriver: this.getBudgetDriver(accountCode, industry),
          driverAssumptions: this.getDriverAssumptions(accountCode, industry),
          monthlyBreakdown: this.generateMonthlyBreakdown(budgetAmount, accountCode),
          dimensions: {
            costCenter: 'MAIN_OPERATIONS',
            profitCenter: 'PRIMARY_BUSINESS',
            productLine: 'CORE_SERVICES',
            geography: 'LOCAL_MARKET'
          }
        })
      }
    }

    // Create the budget line items
    if (budgetLines.length > 0) {
      await this.createBudgetLineItems({
        budgetId,
        organizationId,
        lineItems: budgetLines
      })

      console.log(`   ✅ Created ${budgetLines.length} budget line items for ${industry} industry`)
    }
  }

  private getIndustryBudgetDefaults(industry: string): any {
    const defaults = {
      restaurant: {
        revenue_multiplier: 1.0,
        cogs_percentage: 0.35, // 35% of revenue
        labor_percentage: 0.30, // 30% of revenue
        rent_monthly: 8000,
        utilities_monthly: 1200,
        marketing_percentage: 0.05 // 5% of revenue
      },
      healthcare: {
        revenue_multiplier: 1.0,
        cogs_percentage: 0.25,
        labor_percentage: 0.45,
        rent_monthly: 12000,
        utilities_monthly: 2000,
        marketing_percentage: 0.03
      },
      retail: {
        revenue_multiplier: 1.0,
        cogs_percentage: 0.50,
        labor_percentage: 0.20,
        rent_monthly: 6000,
        utilities_monthly: 800,
        marketing_percentage: 0.08
      },
      salon: {
        revenue_multiplier: 1.0,
        cogs_percentage: 0.20,
        labor_percentage: 0.40,
        rent_monthly: 4000,
        utilities_monthly: 600,
        marketing_percentage: 0.06
      }
    }

    return defaults[industry as keyof typeof defaults] || defaults.restaurant
  }

  private calculateIndustryBudgetAmount(accountCode: string, industryDefaults: any): number {
    const baseRevenue = 120000 // $120K annual revenue assumption

    // Revenue accounts (4xxx)
    if (accountCode.startsWith('4')) {
      return baseRevenue * industryDefaults.revenue_multiplier
    }

    // Cost of sales (5xxx)
    if (accountCode.startsWith('5')) {
      return baseRevenue * industryDefaults.cogs_percentage
    }

    // Operating expenses (6xxx-7xxx)
    if (accountCode.startsWith('6') || accountCode.startsWith('7')) {
      // Labor costs
      if (accountCode.includes('SALARY') || accountCode.includes('WAGES') || accountCode.includes('LABOR')) {
        return baseRevenue * industryDefaults.labor_percentage
      }
      
      // Rent
      if (accountCode.includes('RENT') || accountCode.includes('LEASE')) {
        return industryDefaults.rent_monthly * 12
      }
      
      // Utilities
      if (accountCode.includes('UTILITIES') || accountCode.includes('ELECTRIC') || accountCode.includes('WATER')) {
        return industryDefaults.utilities_monthly * 12
      }
      
      // Marketing
      if (accountCode.includes('MARKETING') || accountCode.includes('ADVERTISING')) {
        return baseRevenue * industryDefaults.marketing_percentage
      }
      
      // Other operating expenses (small amounts)
      return 1200 // $100/month for miscellaneous expenses
    }

    return 0
  }

  private getBudgetDriver(accountCode: string, industry: string): string {
    if (accountCode.startsWith('4')) return 'customer_count'
    if (accountCode.startsWith('5')) return 'sales_volume'
    if (accountCode.includes('LABOR')) return 'employee_hours'
    if (accountCode.includes('RENT')) return 'square_footage'
    if (accountCode.includes('MARKETING')) return 'marketing_campaigns'
    return 'business_volume'
  }

  private getDriverAssumptions(accountCode: string, industry: string): any {
    const baseAssumptions = {
      customers_per_month: 300,
      average_spend: 33.33,
      employee_hours_per_month: 800,
      hourly_rate: 15.00,
      marketing_campaigns_per_quarter: 4
    }

    return baseAssumptions
  }

  private generateMonthlyBreakdown(annualAmount: number, accountCode: string): number[] {
    const baseMonthly = annualAmount / 12
    
    // Seasonal variations for revenue accounts
    if (accountCode.startsWith('4')) {
      // Higher in Dec, lower in Jan-Feb
      const seasonalFactors = [0.8, 0.8, 1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 1.0, 1.1, 1.1, 1.3]
      return seasonalFactors.map(factor => Math.round(baseMonthly * factor))
    }
    
    // Even distribution for most expenses
    return Array(12).fill(Math.round(baseMonthly))
  }

  // ================================================================================
  // AUTO-JOURNAL POSTING FUNCTIONS
  // ================================================================================

  /**
   * Process a transaction for automatic journal entry creation
   * Integrates with the HERA Auto-Journal Posting Engine
   */
  async processTransactionForAutoJournal(transactionId: string): Promise<ApiResponse> {
    try {
      if (!this.organizationId) {
        throw new Error('Organization ID is required for auto-journal processing')
      }

      if (this.mode === 'mock') {
        return {
          success: true,
          data: {
            journal_created: true,
            journal_id: `mock_journal_${Date.now()}`,
            processing_mode: 'immediate',
            ai_used: false,
            batched: false
          },
          message: 'Mock: Transaction processed for auto-journal creation',
          mode: 'mock'
        }
      }

      const result = await processTransactionForJournal(transactionId, this.organizationId)
      
      return {
        success: true,
        data: result,
        message: 'Transaction processed for auto-journal creation'
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: this.mode
      }
    }
  }

  /**
   * Run end-of-day batch processing for small transactions
   * Creates summary journal entries for efficiency
   */
  async runBatchJournalProcessing(): Promise<ApiResponse> {
    try {
      if (!this.organizationId) {
        throw new Error('Organization ID is required for batch processing')
      }

      if (this.mode === 'mock') {
        return {
          success: true,
          data: {
            batched: 15,
            journals_created: 3,
            total_amount: 1250.00,
            transaction_types: ['sale', 'expense', 'receipt']
          },
          message: 'Mock: Batch processing completed',
          mode: 'mock'
        }
      }

      const result = await runBatchProcessing(this.organizationId)
      
      return {
        success: true,
        data: result,
        message: 'Batch journal processing completed successfully'
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: this.mode
      }
    }
  }

  /**
   * Check if a transaction requires journal entry creation
   * Uses intelligent classification to determine journal relevance
   */
  async checkTransactionJournalRelevance(transactionData: any): Promise<ApiResponse> {
    try {
      if (this.mode === 'mock') {
        return {
          success: true,
          data: {
            isRelevant: true,
            reason: 'Sales transaction - revenue impact',
            confidence: 0.95,
            complexity: 'simple',
            recommended_action: 'immediate_journal'
          },
          message: 'Mock: Journal relevance check completed',
          mode: 'mock'
        }
      }

      const result = await checkJournalRelevance(transactionData)
      
      return {
        success: true,
        data: result,
        message: 'Journal relevance check completed'
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: this.mode
      }
    }
  }

  /**
   * Get auto-journal statistics for the organization
   * Provides insights into automation effectiveness
   */
  async getAutoJournalStatistics(days: number = 7): Promise<ApiResponse> {
    try {
      if (!this.organizationId) {
        throw new Error('Organization ID is required for statistics')
      }

      if (this.mode === 'mock') {
        return {
          success: true,
          data: {
            period_days: days,
            total_journals_created: 45,
            total_transactions_processed: 62,
            immediate_journals: 18,
            batch_journals: 27,
            automation_rate: '72.6%',
            ai_usage_rate: '15.5%',
            processing_modes: {
              immediate: 18,
              batched: 39,
              skipped: 5
            },
            savings: {
              time_saved_hours: 12.3,
              manual_entries_avoided: 45,
              efficiency_gain: '85%'
            }
          },
          message: 'Mock: Auto-journal statistics retrieved',
          mode: 'mock'
        }
      }

      // In production, this would call the auto-journal API
      const response = await fetch(`${this.baseUrl}/api/v1/auto-journal?action=statistics&organization_id=${this.organizationId}&days=${days}`, {
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: this.mode
      }
    }
  }

  /**
   * Get pending transactions that are queued for batch processing
   */
  async getPendingBatchTransactions(): Promise<ApiResponse> {
    try {
      if (!this.organizationId) {
        throw new Error('Organization ID is required')
      }

      if (this.mode === 'mock') {
        return {
          success: true,
          data: [
            {
              transaction_type: 'sale',
              count: 8,
              total_amount: 420.50,
              avg_amount: 52.56,
              ready_for_batch: true
            },
            {
              transaction_type: 'expense',
              count: 5,
              total_amount: 245.75,
              avg_amount: 49.15,
              ready_for_batch: false
            },
            {
              transaction_type: 'receipt',
              count: 12,
              total_amount: 890.25,
              avg_amount: 74.19,
              ready_for_batch: true
            }
          ],
          message: 'Mock: Pending batch transactions retrieved',
          mode: 'mock'
        }
      }

      // In production, this would call the auto-journal API
      const response = await fetch(`${this.baseUrl}/api/v1/auto-journal?action=pending_batch&organization_id=${this.organizationId}`, {
        headers: this.getHeaders()
      })

      const data = await response.json()
      return data

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: this.mode
      }
    }
  }

  /**
   * Enhanced transaction creation with automatic journal posting
   * Creates transaction and immediately processes for journal creation
   */
  async createTransactionWithAutoJournal(transactionData: any): Promise<ApiResponse> {
    try {
      // First create the transaction
      const transactionResult = await this.create('universal_transactions', transactionData)
      
      if (!transactionResult.success) {
        return transactionResult
      }

      // If transaction creation succeeded, process for auto-journal
      if (transactionResult.data?.id) {
        const journalResult = await this.processTransactionForAutoJournal(transactionResult.data.id)
        
        return {
          success: true,
          data: {
            transaction: transactionResult.data,
            journal_processing: journalResult.data
          },
          message: 'Transaction created and processed for auto-journal'
        }
      }

      return transactionResult

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        mode: this.mode
      }
    }
  }

  // ================================================================================
  // CASHFLOW STATEMENT FUNCTIONS
  // ================================================================================

  /**
   * Generate cashflow statement using direct or indirect method
   */
  async generateCashflowStatement(params: {
    organizationId?: string
    startDate: string
    endDate: string
    method?: 'direct' | 'indirect'
    currency?: string
  }): Promise<ApiResponse> {
    try {
      const {
        organizationId = this.config.organizationId,
        startDate,
        endDate,
        method = 'direct',
        currency = 'AED'
      } = params

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch(
        `${this.baseUrl}/api/v1/cashflow?action=generate_statement&organization_id=${organizationId}&start_date=${startDate}&end_date=${endDate}&method=${method}&currency=${currency}`,
        {
          headers: this.getHeaders()
        }
      )

      return response.json()

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate cashflow forecast
   */
  async generateCashflowForecast(params: {
    organizationId?: string
    forecastMonths?: number
    baselineMonths?: number
    currency?: string
  }): Promise<ApiResponse> {
    try {
      const {
        organizationId = this.config.organizationId,
        forecastMonths = 12,
        baselineMonths = 6,
        currency = 'AED'
      } = params

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch(
        `${this.baseUrl}/api/v1/cashflow?action=generate_forecast&organization_id=${organizationId}&forecast_months=${forecastMonths}&baseline_months=${baselineMonths}&currency=${currency}`,
        {
          headers: this.getHeaders()
        }
      )

      return response.json()

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Analyze cashflow trends
   */
  async analyzeCashflowTrends(params: {
    organizationId?: string
    periods?: number
    currency?: string
  }): Promise<ApiResponse> {
    try {
      const {
        organizationId = this.config.organizationId,
        periods = 6,
        currency = 'AED'
      } = params

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch(
        `${this.baseUrl}/api/v1/cashflow?action=analyze_trends&organization_id=${organizationId}&periods=${periods}&currency=${currency}`,
        {
          headers: this.getHeaders()
        }
      )

      return response.json()

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Setup cashflow tracking for organization
   */
  async setupCashflowTracking(organizationId?: string, industry?: string): Promise<ApiResponse> {
    try {
      const orgId = organizationId || this.config.organizationId

      if (!orgId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch(`${this.baseUrl}/api/v1/cashflow`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'setup_tracking',
          organization_id: orgId,
          industry
        })
      })

      return response.json()

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Setup Hair Salon demo data for cashflow testing
   */
  async setupHairSalonCashflowDemo(organizationId?: string): Promise<ApiResponse> {
    try {
      const orgId = organizationId || this.config.organizationId

      if (!orgId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch(`${this.baseUrl}/api/v1/cashflow/demo`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'setup_hair_salon_demo',
          organization_id: orgId
        })
      })

      return response.json()

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create cashflow scenario for testing
   */
  async createCashflowScenario(params: {
    organizationId?: string
    scenarioType: 'peak_season' | 'slow_season' | 'equipment_purchase' | 'new_stylist'
    description?: string
  }): Promise<ApiResponse> {
    try {
      const {
        organizationId = this.config.organizationId,
        scenarioType,
        description
      } = params

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch(`${this.baseUrl}/api/v1/cashflow/demo`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'create_scenario',
          organization_id: organizationId,
          scenario_type: scenarioType,
          description
        })
      })

      return response.json()

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ================================================================================
  // AUTO-JOURNAL DNA INTEGRATION
  // ================================================================================

  /**
   * Initialize auto-journal DNA service for the organization
   * Returns a configured service instance with industry-specific settings
   */
  async getAutoJournalDNAService(industryType?: string): Promise<AutoJournalDNAService | null> {
    try {
      if (!this.organizationId) {
        throw new Error('Organization ID is required for DNA service')
      }

      return await createAutoJournalService(this.organizationId, industryType)

    } catch (error: any) {
      console.error('Failed to create auto-journal DNA service:', error)
      return null
    }
  }

  /**
   * Process transaction using DNA-configured auto-journal service
   * Applies industry-specific rules and thresholds
   */
  async processTransactionWithDNA(transactionId: string): Promise<ApiResponse> {
    try {
      const service = await this.getAutoJournalDNAService()
      
      if (!service) {
        return {
          success: false,
          error: 'Failed to initialize auto-journal DNA service'
        }
      }

      const result = await service.processTransaction(transactionId)
      
      return {
        success: result.success,
        data: {
          journal_created: result.journal_created,
          journal_id: result.journal_id,
          processing_mode: result.processing_mode,
          industry_optimized: true
        },
        message: result.message
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Run DNA-configured batch processing
   * Applies industry-specific batching strategies
   */
  async runDNABatchProcessing(): Promise<ApiResponse> {
    try {
      const service = await this.getAutoJournalDNAService()
      
      if (!service) {
        return {
          success: false,
          error: 'Failed to initialize auto-journal DNA service'
        }
      }

      const result = await service.runBatchProcessing()
      
      return {
        success: result.success,
        data: {
          batched_count: result.batched_count,
          journals_created: result.journals_created,
          industry_optimized: true
        },
        message: result.message
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get comprehensive DNA auto-journal statistics
   * Includes industry-specific metrics and cost savings
   */
  async getDNAAutoJournalStatistics(days: number = 7): Promise<ApiResponse> {
    try {
      const service = await this.getAutoJournalDNAService()
      
      if (!service) {
        return {
          success: false,
          error: 'Failed to initialize auto-journal DNA service'
        }
      }

      const stats = await service.getStatistics(days)
      
      return {
        success: true,
        data: {
          ...stats,
          industry_optimized: true,
          dna_powered: true,
          savings_confidence: 'high'
        },
        message: 'DNA auto-journal statistics retrieved successfully'
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Configure auto-journal settings using DNA system
   * Updates industry-specific configuration with custom overrides
   */
  async configureAutoJournalDNA(updates: any): Promise<ApiResponse> {
    try {
      const service = await this.getAutoJournalDNAService()
      
      if (!service) {
        return {
          success: false,
          error: 'Failed to initialize auto-journal DNA service'
        }
      }

      const result = await service.updateConfiguration(updates)
      
      return {
        success: result.success,
        message: result.message,
        data: {
          configuration_updated: true,
          industry_optimized: true
        }
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enhanced transaction creation with DNA auto-journal processing
   * Uses industry-specific rules and AI classification
   */
  async createTransactionWithDNAAutoJournal(transactionData: any): Promise<ApiResponse> {
    try {
      // Create transaction first
      const transactionResult = await this.create('universal_transactions', transactionData)
      
      if (!transactionResult.success) {
        return transactionResult
      }

      // Process with DNA auto-journal service
      if (transactionResult.data?.id) {
        const journalResult = await this.processTransactionWithDNA(transactionResult.data.id)
        
        return {
          success: true,
          data: {
            transaction: transactionResult.data,
            journal_processing: journalResult.data,
            dna_enhanced: true
          },
          message: 'Transaction created and processed with DNA auto-journal optimization'
        }
      }

      return transactionResult

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get auto-journal DNA configuration for the organization
   * Returns industry-specific rules and thresholds
   */
  async getAutoJournalDNAConfiguration(): Promise<ApiResponse> {
    try {
      const service = await this.getAutoJournalDNAService()
      
      if (!service) {
        return {
          success: false,
          error: 'Failed to initialize auto-journal DNA service'
        }
      }

      // Access the configuration (note: this accesses private property for API purposes)
      const config = (service as any).config
      
      return {
        success: true,
        data: {
          ...config,
          industry_optimized: true,
          dna_powered: true
        },
        message: 'DNA auto-journal configuration retrieved successfully'
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message
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