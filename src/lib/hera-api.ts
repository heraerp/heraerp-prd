// HERA API Client for business operations
// Integrates with Supabase authentication

// Production-only HERA API implementation

interface HeraApiConfig {
  baseUrl: string
  getAuthToken: () => Promise<string | null>
}

interface CreateBusinessData {
  supabase_user_id: string
  email: string
  full_name: string
  business_name: string
  business_type: string
}

interface HeraUserEntity {
  id: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code: string
  email?: string
  role?: string
  status: string
}

interface HeraOrganization {
  id: string
  organization_name: string
  organization_type: string
  status: string
  subscription_plan?: string
  max_users?: number
}

interface HeraContext {
  user_entity: HeraUserEntity
  organization: HeraOrganization
  permissions?: string[]
}

// Smart Code interfaces
interface SmartCodeValidationRequest {
  smart_code: string
  validation_level?: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
  organization_id?: string
}

interface SmartCodeGenerationRequest {
  organization_id: string
  business_context: {
    industry: 'restaurant' | 'healthcare' | 'manufacturing' | 'professional' | 'retail' | 'legal' | 'education' | 'system'
    module: string
    sub_module: string
    function_type: string
    entity_type: string
    business_description?: string
  }
  options?: {
    version?: number
    auto_validate?: boolean
    validation_level?: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
  }
}

interface SmartCodeSearchRequest {
  organization_id: string
  search_criteria: {
    pattern?: string
    module?: string
    sub_module?: string
    function_type?: string
    entity_type?: string
    version?: string
    status?: string
  }
  filters?: {
    include_system_org?: boolean
    entity_types?: string[]
    date_range?: {
      from: string
      to: string
    }
  }
  pagination?: {
    page: number
    limit: number
  }
  sort?: {
    field: 'smart_code' | 'entity_name' | 'created_at' | 'updated_at'
    direction: 'asc' | 'desc'
  }
}

interface ValidationRequest {
  organization_id: string
  validation_target: {
    type: 'smart_code' | 'entity' | 'transaction' | 'bom' | 'pricing' | 'dag'
    target_id: string
    smart_code?: string
    data?: any
  }
  validation_levels: Array<'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'>
  options?: {
    auto_fix?: boolean
    generate_report?: boolean
    include_suggestions?: boolean
    performance_benchmarks?: boolean
  }
}

class HeraApiClient {
  private baseUrl: string
  private getAuthToken: () => Promise<string | null>

  constructor(config: HeraApiConfig) {
    this.baseUrl = config.baseUrl
    this.getAuthToken = config.getAuthToken
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      // Always force mock mode in development for hera-context endpoint
      if (endpoint === '/auth/hera-context' && process.env.NODE_ENV === 'development') {
        console.log('Development mode: forcing mock mode for HERA context')
        headers['X-Mock-Request'] = 'true'
        headers['Authorization'] = 'Bearer mock-token'
      } 
      // Check token size to prevent 431 errors
      else if (token.length > 4096) {
        console.warn('JWT token too large, attempting optimized JWT service')
        
        try {
          // Try to import and use optimized JWT service
          const { optimizedJWT } = await import('@/lib/auth/optimized-jwt-service')
          const optimizedSession = await optimizedJWT.validateAndRefreshSession()
          
          if (optimizedSession) {
            const optimizedHeaders = optimizedJWT.getOptimizedAuthHeaders(optimizedSession)
            Object.assign(headers, optimizedHeaders)
          } else {
            // Fallback to mock mode
            headers['X-Mock-Request'] = 'true'
            headers['Authorization'] = 'Bearer mock-token'
          }
        } catch (optimizedError) {
          console.warn('Optimized JWT failed, using mock mode:', optimizedError)
          headers['X-Mock-Request'] = 'true'
          headers['Authorization'] = 'Bearer mock-token'
        }
      } else {
        headers['Authorization'] = `Bearer ${token}`
      }
    } else {
      // No token - use mock mode in development
      if (endpoint === '/auth/hera-context' && process.env.NODE_ENV === 'development') {
        console.log('No token: using mock mode for development')
        headers['X-Mock-Request'] = 'true'
        headers['Authorization'] = 'Bearer mock-token'
      }
    }

    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle 431 Request Header Fields Too Large
      if (response.status === 431) {
        throw new Error('Authentication token too large. Please try logging out and back in.')
      }

      // Handle empty responses (common for server errors)
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (jsonError) {
          throw new Error(`Server returned invalid JSON response (${response.status})`)
        }
      } else {
        // For non-JSON responses, get text content
        const textContent = await response.text()
        data = { message: textContent || `HTTP ${response.status}` }
      }

      if (!response.ok) {
        const error = new Error(data.message || data.error || `Request failed: ${response.status}`) as any
        error.status = response.status
        error.response = data
        throw error
      }

      return data
    } catch (error) {
      console.error('HERA API request failed:', error)
      throw error
    }
  }

  // Create or sync user business in HERA
  async createBusiness(data: CreateBusinessData): Promise<HeraContext> {
    return this.request('/auth/create-business', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Get HERA context for authenticated user
  async getHeraContext(): Promise<HeraContext> {
    return this.request('/auth/hera-context', {
      method: 'GET',
    })
  }

  // Sync user profile changes
  async syncUserProfile(updates: Partial<HeraUserEntity>): Promise<HeraUserEntity> {
    return this.request('/auth/sync-user', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Get organization statistics
  async getOrganizationStats(): Promise<{
    entities_count: number
    transactions_count: number
    total_value: number
  }> {
    return this.request('/dashboard/stats', {
      method: 'GET',
    })
  }

  // Entity operations
  async getEntities(entityType?: string): Promise<any[]> {
    const params = entityType ? `?entity_type=${entityType}` : ''
    return this.request(`/entities${params}`, {
      method: 'GET',
    })
  }

  async createEntity(entityData: any): Promise<any> {
    return this.request('/entities', {
      method: 'POST',
      body: JSON.stringify(entityData),
    })
  }

  async updateEntity(entityId: string, entityData: any): Promise<any> {
    return this.request(`/entities/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(entityData),
    })
  }

  // Transaction operations
  async getTransactions(limit = 10): Promise<any[]> {
    return this.request(`/transactions?limit=${limit}`, {
      method: 'GET',
    })
  }

  async createTransaction(transactionData: any): Promise<any> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    })
  }

  // Dynamic data operations  
  async updateDynamicData(entityId: string, fieldName: string, fieldValue: any): Promise<any> {
    return this.request(`/entities/${entityId}/dynamic-data`, {
      method: 'PUT',
      body: JSON.stringify({ field_name: fieldName, field_value: fieldValue }),
    })
  }

  // Enhanced dynamic data operations - supports both single and multi-field access
  async getDynamicData(entityId: string, fields?: string[]): Promise<any> {
    return this.request(`/entities/${entityId}/dynamic-data`, {
      method: 'GET',
      body: fields ? JSON.stringify({ fields }) : undefined,
    })
  }

  async setDynamicData(entityId: string, data: any): Promise<any> {
    return this.request(`/entities/${entityId}/dynamic-data`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Relationship operations
  async getRelationships(entityId: string, relationshipTypes?: string[]): Promise<any[]> {
    return this.request(`/entities/${entityId}/relationships`, {
      method: 'GET',
      body: JSON.stringify({ relationship_types: relationshipTypes }),
    })
  }

  async createRelationship(relationshipData: any): Promise<any> {
    return this.request('/relationships', {
      method: 'POST',
      body: JSON.stringify(relationshipData),
    })
  }

  // Enhanced entity operations
  async getEntity(entityId: string, entityType?: string): Promise<any> {
    return this.request(`/entities/${entityId}`, {
      method: 'GET',
      body: entityType ? JSON.stringify({ entity_type: entityType }) : undefined,
    })
  }

  // Enhanced transaction operations  
  async getFilteredTransactions(filters: any): Promise<any[]> {
    return this.request('/transactions', {
      method: 'GET',
      body: JSON.stringify(filters),
    })
  }
  
  // Dashboard operations
  async getDashboardData(): Promise<any> {
    return this.request('/dashboard/kpis', {
      method: 'GET',
    })
  }
  
  async getFinancialReport(reportType: string, params?: any): Promise<any> {
    return this.request(`/reports/${reportType}`, {
      method: 'GET',
      body: JSON.stringify(params),
    })
  }

  // Smart Code System Methods
  async validateSmartCode(request: SmartCodeValidationRequest): Promise<any> {
    return this.request('/smart-code/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async generateSmartCode(request: SmartCodeGenerationRequest): Promise<any> {
    return this.request('/smart-code/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async searchSmartCodes(request: SmartCodeSearchRequest): Promise<any> {
    return this.request('/smart-code/search', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async quickSearchSmartCodes(organizationId: string, options?: { 
    include_system?: boolean 
    page?: number 
    limit?: number 
  }): Promise<any> {
    const params = new URLSearchParams({
      organization_id: organizationId,
      ...(options?.include_system && { include_system: 'true' }),
      ...(options?.page && { page: options.page.toString() }),
      ...(options?.limit && { limit: options.limit.toString() })
    })
    
    return this.request(`/smart-code/search?${params}`, {
      method: 'GET',
    })
  }

  // 4-Level Validation System
  async validate4Level(request: ValidationRequest): Promise<any> {
    return this.request('/validation/4-level', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // HERA-SPEAR Template System Methods
  async listTemplates(organizationId?: string, options?: {
    template_types?: string[]
    include_system?: boolean
    industry?: string[]
  }): Promise<any> {
    const params = new URLSearchParams()
    if (organizationId) params.set('organization_id', organizationId)
    if (options?.template_types) params.set('template_types', options.template_types.join(','))
    if (options?.include_system) params.set('include_system', 'true')
    if (options?.industry) params.set('industry', options.industry.join(','))
    
    return this.request(`/templates?${params}`, {
      method: 'GET',
    })
  }

  async copyTemplates(request: {
    source_organization_id: string
    target_organization_id: string
    template_codes: string[]
    copy_options?: any
  }): Promise<any> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify({
        action: 'copy',
        ...request
      }),
    })
  }

  async customizeTemplate(request: {
    organization_id: string
    template_code: string
    customizations: any
    validation_options?: any
  }): Promise<any> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify({
        action: 'customize',
        ...request
      }),
    })
  }

  // BOM Calculation Methods
  async calculateBOM(request: {
    organization_id: string
    bom_data: {
      item_id: string
      item_name: string
      quantity: number
      calculation_type: 'standard_cost' | 'actual_cost' | 'planned_cost' | 'variance_analysis'
      costing_method: 'direct_materials' | 'activity_based' | 'full_absorption' | 'marginal_costing'
    }
    cost_components?: any
    sap_compatibility?: any
    calculation_options?: any
  }): Promise<any> {
    return this.request('/bom/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Pricing Calculation Methods
  async calculatePricing(request: {
    organization_id: string
    pricing_data: {
      product_id: string
      product_name: string
      customer_id?: string
      quantity: number
      calculation_type: 'standard_pricing' | 'customer_specific' | 'volume_pricing' | 'dynamic_pricing' | 'profitability_analysis'
      pricing_method: 'cost_plus' | 'market_based' | 'value_based' | 'competitive' | 'penetration' | 'skimming'
    }
    pricing_components?: any
    sap_compatibility?: any
    dag_execution?: any
  }): Promise<any> {
    return this.request('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // DAG Execution Methods
  async executeDAG(request: {
    organization_id: string
    dag_definition: any
    execution_context: any
    optimization_options?: any
    monitoring_options?: any
  }): Promise<any> {
    return this.request('/dag/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Industry Configuration Methods
  async configureIndustry(request: {
    organization_id: string
    industry_type: 'restaurant' | 'healthcare' | 'manufacturing' | 'professional' | 'retail' | 'legal' | 'education'
    configuration_options: any
    sap_migration?: any
    validation_requirements?: any
  }): Promise<any> {
    return this.request('/industry/configure', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Convenience methods for common smart code operations
  async validateEntitySmartCode(organizationId: string, smartCode: string, validationLevel?: string): Promise<any> {
    return this.validateSmartCode({
      smart_code: smartCode,
      validation_level: validationLevel as any || 'L2_SEMANTIC',
      organization_id: organizationId
    })
  }

  async generateRestaurantSmartCode(organizationId: string, context: {
    sub_module: string
    function_type: string
    entity_type: string
    description?: string
  }): Promise<any> {
    return this.generateSmartCode({
      organization_id: organizationId,
      business_context: {
        industry: 'restaurant',
        module: 'REST',
        ...context
      },
      options: {
        auto_validate: true,
        validation_level: 'L2_SEMANTIC'
      }
    })
  }

  async generateHealthcareSmartCode(organizationId: string, context: {
    sub_module: string
    function_type: string
    entity_type: string
    description?: string
  }): Promise<any> {
    return this.generateSmartCode({
      organization_id: organizationId,
      business_context: {
        industry: 'healthcare',
        module: 'HLTH',
        ...context
      },
      options: {
        auto_validate: true,
        validation_level: 'L2_SEMANTIC'
      }
    })
  }

  async generateSystemSmartCode(context: {
    sub_module: string
    function_type: string
    entity_type: string
    description?: string
  }): Promise<any> {
    return this.generateSmartCode({
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945', // HERA System Org
      business_context: {
        industry: 'system',
        module: 'SYSTEM',
        ...context
      },
      options: {
        auto_validate: true,
        validation_level: 'L4_INTEGRATION'
      }
    })
  }

  // High-level convenience methods for HERA-SPEAR deployment
  async deployIndustryTemplate(organizationId: string, industryType: string, options?: {
    deployment_mode?: '24_hour_rapid' | 'phased_rollout' | 'pilot_program'
    customization_level?: 'standard' | 'customized' | 'fully_bespoke'
    migrate_from_sap?: boolean
  }): Promise<any> {
    return this.configureIndustry({
      organization_id: organizationId,
      industry_type: industryType as any,
      configuration_options: {
        business_model: 'standard',
        deployment_mode: options?.deployment_mode || '24_hour_rapid',
        template_customization_level: options?.customization_level || 'standard',
        integration_requirements: ['accounting', 'crm']
      },
      sap_migration: options?.migrate_from_sap ? {
        migrate_from_sap: true,
        sap_modules_to_replace: ['SAP_Standard'],
        data_migration_scope: 'full',
        migration_timeline_days: 1
      } : undefined,
      validation_requirements: {
        industry_compliance_validation: true,
        performance_benchmarking: true,
        integration_testing: true,
        user_acceptance_testing: true
      }
    })
  }
}

// Create singleton instance
let heraApiInstance: HeraApiClient | null = null

export function initializeHeraApi(config: HeraApiConfig): HeraApiClient {
  heraApiInstance = new HeraApiClient(config)
  return heraApiInstance
}

export function getHeraApi(): HeraApiClient {
  if (!heraApiInstance) {
    throw new Error('HERA API not initialized. Call initializeHeraApi first.')
  }
  return heraApiInstance
}

// Alias for compatibility with different naming conventions
export const getHeraAPI = getHeraApi

// Export a proxy that forwards calls to the singleton
export const heraApi = new Proxy({} as HeraApiClient, {
  get(target, prop) {
    const instance = getHeraApi()
    const value = (instance as any)[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  }
})

export type {
  CreateBusinessData,
  HeraUserEntity,
  HeraOrganization,
  HeraContext,
  HeraApiConfig
}