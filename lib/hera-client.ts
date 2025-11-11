/**
 * HERA v2.2 Environment-Aware Client SDK
 * Smart Code: HERA.CLIENT.SDK.V22.ENVIRONMENT.v1
 * 
 * Environment-aware client that automatically routes to correct Supabase environment
 * Integrates with existing API v2 endpoints and preserves all enterprise features
 */

import { HERA_CONFIG, getConfigurationSummary, isProductionEnvironment } from './hera.config';

// Re-export configuration for convenience
export { HERA_CONFIG, getConfigurationSummary, isProductionEnvironment } from './hera.config';

// ============================================================================= 
// Types and Interfaces
// =============================================================================

export interface HeraClientConfig {
  baseUrl?: string;
  getToken: () => Promise<string>;
  organizationId?: string;
  environmentType?: 'development' | 'production' | 'auto';
  timeout?: number;
  retries?: number;
}

export interface HeraRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  idempotencyKey?: string;
  requestId?: string;
}

export interface HeraResponse<T = any> {
  data: T;
  actor: string;
  org: string;
  requestId: string;
  runtime_version?: string;
  api_version?: string;
}

export interface HeraErrorResponse {
  error: string;
  message: string;
  requestId: string;
  violations?: string[];
  warnings?: string[];
  metadata?: any;
}

// Entity operation types
export interface EntityCreateRequest {
  operation: 'CREATE';
  entity_type: string;
  entity_name?: string;
  entity_code?: string;
  smart_code: string;
  organization_id: string;
  entity_data?: Record<string, any>;
  dynamic_fields?: Array<{
    field_name: string;
    field_type: string;
    field_value?: any;
    field_value_text?: string;
    field_value_number?: number;
    field_value_boolean?: boolean;
    field_value_date?: string;
    smart_code?: string;
  }>;
  relationships?: Array<{
    source_entity_id?: string;
    target_entity_id: string;
    relationship_type: string;
    organization_id: string;
    relationship_data?: Record<string, any>;
  }>;
}

export interface EntityReadRequest {
  operation: 'READ';
  entity_type?: string;
  entity_id?: string;
  organization_id: string;
  options?: {
    limit?: number;
    include_deleted?: boolean;
  };
}

// Transaction operation types  
export interface TransactionCreateRequest {
  operation: 'CREATE';
  transaction_type: string;
  smart_code: string;
  organization_id: string;
  transaction_data?: {
    transaction_number?: string;
    source_entity_id?: string;
    target_entity_id?: string;
    total_amount?: number;
    transaction_status?: string;
    transaction_currency?: string;
  };
  lines?: Array<{
    line_number: number;
    line_type: string;
    description?: string;
    quantity?: number;
    unit_amount?: number;
    line_amount?: number;
    entity_id?: string;
    smart_code?: string;
    line_data?: Record<string, any>;
  }>;
}

// =============================================================================
// Environment Configuration
// =============================================================================

const ENVIRONMENT_URLS = {
  development: 'https://qqagokigwuujyeyrgdkq.supabase.co/functions/v1',
  production: 'https://awfcrncxngqwbhqapffb.supabase.co/functions/v1'
};

function detectEnvironment(): 'development' | 'production' {
  // Try multiple detection methods
  
  // 1. Explicit environment variable
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'development') return 'development';
    
    // Check for Supabase project ref
    const projectRef = process.env.SUPABASE_PROJECT_REF;
    if (projectRef === HERA_CONFIG.ENVIRONMENT.PRODUCTION) return 'production';
    if (projectRef === HERA_CONFIG.ENVIRONMENT.DEVELOPMENT) return 'development';
  }
  
  // 2. Browser location detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    if (hostname.includes('.heraerp.com') || hostname.includes('production')) {
      return 'production';  
    }
  }
  
  // 3. Default to development for safety
  return 'development';
}

function getEnvironmentUrl(environmentType: 'development' | 'production' | 'auto'): string {
  if (environmentType === 'auto') {
    environmentType = detectEnvironment();
  }
  
  return ENVIRONMENT_URLS[environmentType];
}

// =============================================================================
// Main HERA Client Class
// =============================================================================

export class HeraClient {
  private config: HeraClientConfig;
  private baseUrl: string;
  private environmentType: 'development' | 'production';

  constructor(config: HeraClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      environmentType: 'auto',
      ...config
    };

    // Determine environment and base URL
    this.environmentType = this.config.environmentType === 'auto' 
      ? detectEnvironment() 
      : this.config.environmentType as 'development' | 'production';
      
    this.baseUrl = this.config.baseUrl || getEnvironmentUrl(this.environmentType);
  }

  /**
   * Get current environment information
   */
  getEnvironmentInfo() {
    return {
      environmentType: this.environmentType,
      baseUrl: this.baseUrl,
      heraConfig: getConfigurationSummary(),
      detectedEnvironment: detectEnvironment()
    };
  }

  /**
   * Core request method with enterprise features
   */
  private async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}, 
    heraOptions: HeraRequestOptions = {}
  ): Promise<HeraResponse<T>> {
    const token = await this.config.getToken();
    const requestId = heraOptions.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': requestId,
      'X-HERA-Client-Version': '2.2.0',
      'X-HERA-Environment': this.environmentType,
      ...heraOptions.headers
    };

    // Add organization context if available
    if (this.config.organizationId) {
      headers['X-Organization-Id'] = this.config.organizationId;
    }

    // Add idempotency key for write operations
    if (heraOptions.idempotencyKey) {
      headers['X-Idempotency-Key'] = heraOptions.idempotencyKey;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const timeout = heraOptions.timeout || this.config.timeout || 30000;

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: HeraErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: 'http_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            requestId
          };
        }
        
        throw new HeraClientError(errorData.message, response.status, errorData);
      }

      const data = await response.json() as HeraResponse<T>;
      
      // Ensure response includes required HERA metadata
      return {
        requestId,
        runtime_version: HERA_CONFIG.RPC_VERSION,
        api_version: HERA_CONFIG.API_VERSION,
        ...data
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof HeraClientError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HeraClientError(`Request timeout after ${timeout}ms`, 408, {
          error: 'timeout',
          message: `Request timeout after ${timeout}ms`,
          requestId
        });
      }
      
      throw new HeraClientError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        {
          error: 'network_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          requestId
        }
      );
    }
  }

  /**
   * Test API connectivity and configuration
   */
  async healthCheck(): Promise<HeraResponse<{
    status: string;
    hera_config: any;
    features: any;
    security: any;
  }>> {
    return this.request('/api-v2/health', { method: 'GET' });
  }

  // =========================================================================
  // Entity Operations
  // =========================================================================

  /**
   * Create a new entity
   */
  async createEntity(
    request: EntityCreateRequest, 
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<{ entity_id: string; message: string }>> {
    return this.request('/api-v2/entities', {
      method: 'POST',
      body: JSON.stringify(request)
    }, options);
  }

  /**
   * Read entities
   */
  async readEntities(
    request: EntityReadRequest,
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (request.entity_type) queryParams.set('entity_type', request.entity_type);
    if (request.entity_id) queryParams.set('entity_id', request.entity_id);
    if (request.organization_id) queryParams.set('organization_id', request.organization_id);
    if (request.options?.limit) queryParams.set('limit', request.options.limit.toString());

    const url = `/api-v2/entities${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(url, { method: 'GET' }, options);
  }

  /**
   * Update an entity
   */
  async updateEntity(
    entityId: string,
    updates: Partial<EntityCreateRequest>,
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<{ entity_id: string; message: string }>> {
    return this.request(`/api-v2/entities/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, operation: 'UPDATE' })
    }, options);
  }

  /**
   * Delete an entity (soft delete)
   */
  async deleteEntity(
    entityId: string,
    organizationId: string,
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<{ entity_id: string; message: string }>> {
    return this.request(`/api-v2/entities/${entityId}`, {
      method: 'DELETE',
      body: JSON.stringify({ 
        operation: 'DELETE',
        entity_id: entityId,
        organization_id: organizationId 
      })
    }, options);
  }

  // =========================================================================
  // Transaction Operations
  // =========================================================================

  /**
   * Create a new transaction
   */
  async createTransaction(
    request: TransactionCreateRequest,
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<{ transaction_id: string; lines_created: number; message: string }>> {
    return this.request('/api-v2/transactions', {
      method: 'POST',
      body: JSON.stringify(request)
    }, options);
  }

  /**
   * Read transactions
   */
  async readTransactions(
    organizationId: string,
    filters: {
      transaction_type?: string;
      transaction_id?: string;
      limit?: number;
    } = {},
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<any[]>> {
    const queryParams = new URLSearchParams();
    queryParams.set('organization_id', organizationId);
    if (filters.transaction_type) queryParams.set('transaction_type', filters.transaction_type);
    if (filters.transaction_id) queryParams.set('transaction_id', filters.transaction_id);
    if (filters.limit) queryParams.set('limit', filters.limit.toString());

    const url = `/api-v2/transactions?${queryParams.toString()}`;
    return this.request(url, { method: 'GET' }, options);
  }

  // =========================================================================
  // Convenience Methods
  // =========================================================================

  /**
   * Create a customer entity with common fields
   */
  async createCustomer(
    organizationId: string,
    customerData: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    },
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<{ entity_id: string; message: string }>> {
    const dynamicFields = [];
    
    if (customerData.email) {
      dynamicFields.push({
        field_name: 'email',
        field_type: 'email',
        field_value: customerData.email,
        smart_code: 'HERA.CUSTOMER.FIELD.EMAIL.v1'
      });
    }
    
    if (customerData.phone) {
      dynamicFields.push({
        field_name: 'phone',
        field_type: 'text',
        field_value: customerData.phone,
        smart_code: 'HERA.CUSTOMER.FIELD.PHONE.v1'
      });
    }

    return this.createEntity({
      operation: 'CREATE',
      entity_type: 'CUSTOMER',
      entity_name: customerData.name,
      smart_code: 'HERA.CUSTOMER.ENTITY.v1',
      organization_id: organizationId,
      dynamic_fields: dynamicFields
    }, options);
  }

  /**
   * Create a simple sale transaction
   */
  async createSaleTransaction(
    organizationId: string,
    saleData: {
      customerId?: string;
      totalAmount: number;
      currency?: string;
      items: Array<{
        description: string;
        quantity: number;
        unitAmount: number;
        lineAmount: number;
      }>;
    },
    options: HeraRequestOptions = {}
  ): Promise<HeraResponse<{ transaction_id: string; lines_created: number; message: string }>> {
    
    const lines = saleData.items.map((item, index) => ({
      line_number: index + 1,
      line_type: 'SALE_ITEM',
      description: item.description,
      quantity: item.quantity,
      unit_amount: item.unitAmount,
      line_amount: item.lineAmount,
      smart_code: 'HERA.SALE.LINE.ITEM.v1'
    }));

    return this.createTransaction({
      operation: 'CREATE',
      transaction_type: 'sale',
      smart_code: 'HERA.FINANCE.TXN.SALE.v1',
      organization_id: organizationId,
      transaction_data: {
        source_entity_id: saleData.customerId,
        total_amount: saleData.totalAmount,
        transaction_currency: saleData.currency || 'USD',
        transaction_status: 'completed'
      },
      lines
    }, options);
  }
}

// =============================================================================
// Error Handling
// =============================================================================

export class HeraClientError extends Error {
  public readonly status: number;
  public readonly response: HeraErrorResponse;

  constructor(message: string, status: number, response: HeraErrorResponse) {
    super(message);
    this.name = 'HeraClientError';
    this.status = status;
    this.response = response;
  }

  isRetryable(): boolean {
    return this.status >= 500 || this.status === 429 || this.status === 408;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create environment-aware HERA client
 */
export async function createEnvironmentAwareHeraClient(
  token: string,
  organizationId: string,
  environmentType: 'development' | 'production' | 'auto' = 'auto'
): Promise<HeraClient> {
  const client = new HeraClient({
    getToken: async () => token,
    organizationId,
    environmentType
  });

  // Test connectivity
  try {
    await client.healthCheck();
  } catch (error) {
    console.warn('HERA Client: Initial health check failed', error);
    // Don't throw - allow client to be created for retry scenarios
  }

  return client;
}

/**
 * Create HERA client with async token provider
 */
export function createHeraClient(config: HeraClientConfig): HeraClient {
  return new HeraClient(config);
}

// =============================================================================
// Default Export
// =============================================================================

export default HeraClient;