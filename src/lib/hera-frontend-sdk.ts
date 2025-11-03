/**
 * HERA Frontend SDK - Production Ready Client
 * Smart Code: HERA.FRONTEND.SDK.CLIENT.PRODUCTION.v1
 * 
 * Lightweight SDK that Claude CLI will use for all generated frontends
 * Auto-wires to API v2 with proper headers, auth, and error handling
 * Never stubs or mocks - always connects to real HERA backend
 */

// =============================================================================
// Core Configuration Types
// =============================================================================

export interface HeraConfig {
  baseUrl: string;                           // VITE_HERA_BASE_URL
  getToken: () => Promise<string>;          // JWT token provider
  getOrgId: () => Promise<string | undefined>; // Organization ID provider
  timeout?: number;                         // Request timeout (default: 30s)
  retryCount?: number;                      // Retry attempts (default: 3)
}

export interface HeraRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  idempotencyKey?: string;
  skipRetry?: boolean;
}

// =============================================================================
// Response Types
// =============================================================================

export interface HeraResponse<T = any> {
  data: T;
  actor?: string;
  org?: string;
  requestId: string;
  runtime_version?: string;
  api_version?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface HeraErrorResponse {
  error: string;
  message: string;
  requestId: string;
  violations?: string[];
  warnings?: string[];
  metadata?: any;
  field?: string;
  code?: string;
}

export class HeraClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: HeraErrorResponse,
    public readonly requestId: string
  ) {
    super(response.message || `HTTP ${status}`);
    this.name = 'HeraClientError';
  }

  get isValidationError(): boolean {
    return this.status === 400 && !!this.response.violations?.length;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429 || this.status === 408;
  }
}

// =============================================================================
// Entity Types
// =============================================================================

export interface EntityCreateRequest {
  entity_type: string;
  entity_name?: string;
  entity_code?: string;
  smart_code: string;
  status?: string;
  organization_id?: string;
  metadata?: Record<string, any>;
  dynamic_fields?: Array<{
    field_name: string;
    field_type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'json';
    field_value?: any;
    field_value_text?: string;
    field_value_number?: number;
    field_value_boolean?: boolean;
    field_value_date?: string;
    field_value_json?: any;
    smart_code?: string;
  }>;
  relationships?: Array<{
    target_entity_id: string;
    relationship_type: string;
    relationship_data?: Record<string, any>;
    effective_date?: string;
    expiration_date?: string;
  }>;
}

export interface EntityListParams {
  entity_type?: string;
  status?: string;
  search?: string;
  smart_code?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// =============================================================================
// Transaction Types
// =============================================================================

export interface TransactionCreateRequest {
  transaction_type: string;
  smart_code: string;
  transaction_date?: string;
  transaction_currency?: string;
  total_amount?: number;
  source_entity_id?: string;
  target_entity_id?: string;
  transaction_status?: string;
  metadata?: Record<string, any>;
  lines?: Array<{
    line_number: number;
    line_type: string;
    description?: string;
    quantity?: number;
    unit_amount?: number;
    line_amount?: number;
    entity_id?: string;
    smart_code?: string;
    line_data?: {
      side?: 'DR' | 'CR';
      account_code?: string;
      cost_center?: string;
      project_code?: string;
      [key: string]: any;
    };
  }>;
}

export interface TransactionListParams {
  transaction_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  currency?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// =============================================================================
// Main HERA Client Class
// =============================================================================

export class HeraClient {
  private config: HeraConfig;

  constructor(config: HeraConfig) {
    this.config = {
      timeout: 30000,
      retryCount: 3,
      ...config
    };
  }

  /**
   * Generate request headers with authentication and organization context
   */
  private async headers(options?: HeraRequestOptions): Promise<Record<string, string>> {
    const token = await this.config.getToken();
    const orgId = await this.config.getOrgId();
    const requestId = crypto.randomUUID();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': requestId,
      'X-HERA-Client-Version': '2.2.0',
      'X-HERA-Environment': 'frontend-sdk',
      ...options?.headers
    };

    if (orgId) {
      headers['X-Organization-Id'] = orgId;
    }

    if (options?.idempotencyKey) {
      headers['X-Idempotency-Key'] = options.idempotencyKey;
    }

    return headers;
  }

  /**
   * Core HTTP request method with retry logic and error handling
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
    heraOptions: HeraRequestOptions = {}
  ): Promise<HeraResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    const timeout = heraOptions.timeout || this.config.timeout!;
    const maxRetries = heraOptions.skipRetry ? 0 : this.config.retryCount!;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers: await this.headers(heraOptions),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse response body
        let responseData: any;
        try {
          responseData = await response.json();
        } catch {
          responseData = { message: 'Invalid JSON response' };
        }

        // Handle success
        if (response.ok) {
          return {
            data: responseData.data || responseData,
            actor: responseData.actor,
            org: responseData.org,
            requestId: responseData.requestId || heraOptions.headers?.['X-Request-ID'] || 'unknown',
            runtime_version: responseData.runtime_version,
            api_version: responseData.api_version,
            pagination: responseData.pagination
          };
        }

        // Handle errors
        const errorResponse: HeraErrorResponse = {
          error: responseData.error || 'unknown_error',
          message: responseData.message || `HTTP ${response.status}`,
          requestId: responseData.requestId || 'unknown',
          violations: responseData.violations,
          warnings: responseData.warnings,
          metadata: responseData.metadata,
          field: responseData.field,
          code: responseData.code
        };

        const error = new HeraClientError(response.status, errorResponse, errorResponse.requestId);

        // Don't retry client errors (400-499) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }

        // Retry on server errors and rate limits
        if (attempt < maxRetries && error.isRetryable) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;

      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof HeraClientError) {
          throw err;
        }

        if (err instanceof Error && err.name === 'AbortError') {
          const timeoutError = new HeraClientError(408, {
            error: 'timeout',
            message: `Request timeout after ${timeout}ms`,
            requestId: 'timeout'
          }, 'timeout');

          if (attempt < maxRetries) {
            continue;
          }
          throw timeoutError;
        }

        // Network or other errors
        const networkError = new HeraClientError(0, {
          error: 'network_error',
          message: err instanceof Error ? err.message : 'Unknown network error',
          requestId: 'network_error'
        }, 'network_error');

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw networkError;
      }
    }

    throw new Error('Max retries exceeded');
  }

  // ==========================================================================
  // Entity Operations
  // ==========================================================================

  /**
   * List entities with filtering and pagination
   */
  async listEntities(params: EntityListParams = {}): Promise<HeraResponse<any[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const path = `/api/v2/entities${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(path, { method: 'GET' });
  }

  /**
   * Get a single entity by ID
   */
  async getEntity(id: string): Promise<HeraResponse<any>> {
    return this.request<any>(`/api/v2/entities/${id}`, { method: 'GET' });
  }

  /**
   * Create a new entity
   */
  async createEntity(entity: EntityCreateRequest): Promise<HeraResponse<{ entity_id: string }>> {
    return this.request<{ entity_id: string }>('/api/v2/entities', {
      method: 'POST',
      body: JSON.stringify({ operation: 'CREATE', ...entity })
    });
  }

  /**
   * Update an existing entity
   */
  async updateEntity(id: string, updates: Partial<EntityCreateRequest>): Promise<HeraResponse<{ entity_id: string }>> {
    return this.request<{ entity_id: string }>(`/api/v2/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ operation: 'UPDATE', ...updates })
    });
  }

  /**
   * Delete an entity (soft delete)
   */
  async deleteEntity(id: string): Promise<HeraResponse<{ entity_id: string }>> {
    return this.request<{ entity_id: string }>(`/api/v2/entities/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ operation: 'DELETE' })
    });
  }

  // ==========================================================================
  // Transaction Operations
  // ==========================================================================

  /**
   * List transactions with filtering and pagination
   */
  async listTransactions(params: TransactionListParams = {}): Promise<HeraResponse<any[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const path = `/api/v2/transactions${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(path, { method: 'GET' });
  }

  /**
   * Create a new transaction with idempotency support
   */
  async postTransaction(
    transaction: TransactionCreateRequest, 
    idempotencyKey?: string
  ): Promise<HeraResponse<{ transaction_id: string; lines_created: number }>> {
    const idemKey = idempotencyKey || crypto.randomUUID();
    
    return this.request<{ transaction_id: string; lines_created: number }>('/api/v2/transactions', {
      method: 'POST',
      body: JSON.stringify({ operation: 'CREATE', ...transaction })
    }, { idempotencyKey: idemKey });
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(id: string): Promise<HeraResponse<any>> {
    return this.request<any>(`/api/v2/transactions/${id}`, { method: 'GET' });
  }

  // ==========================================================================
  // Dynamic Data Operations
  // ==========================================================================

  /**
   * List dynamic data fields
   */
  async listDynamicData(params: { entity_id?: string; field_name?: string; limit?: number; offset?: number } = {}): Promise<HeraResponse<any[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const path = `/api/v2/dynamic-data${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any[]>(path, { method: 'GET' });
  }

  /**
   * Create dynamic data field
   */
  async createDynamicData(data: {
    entity_id: string;
    field_name: string;
    field_type: string;
    field_value?: any;
    smart_code?: string;
  }): Promise<HeraResponse<{ field_id: string }>> {
    return this.request<{ field_id: string }>('/api/v2/dynamic-data', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HeraResponse<{ status: string }>> {
    return this.request<{ status: string }>('/api/v2/health', { method: 'GET' });
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<HeraConfig> {
    return { ...this.config };
  }

  /**
   * Validate GL transaction balance client-side
   */
  validateGLBalance(lines: TransactionCreateRequest['lines'] = []): {
    isBalanced: boolean;
    drTotal: number;
    crTotal: number;
    difference: number;
    currency?: string;
  } {
    const glLines = lines.filter(line => line.line_data?.side);
    
    const drTotal = glLines
      .filter(line => line.line_data?.side === 'DR')
      .reduce((sum, line) => sum + (line.line_amount || 0), 0);
    
    const crTotal = glLines
      .filter(line => line.line_data?.side === 'CR')
      .reduce((sum, line) => sum + (line.line_amount || 0), 0);
    
    const difference = Math.abs(drTotal - crTotal);
    const isBalanced = difference < 0.01; // Allow for rounding errors

    return {
      isBalanced,
      drTotal,
      crTotal,
      difference,
      currency: lines[0]?.line_data?.currency
    };
  }

  /**
   * Generate Smart Code suggestion
   */
  generateSmartCode(params: {
    industry?: string;
    module?: string;
    type: string;
    subtype?: string;
    version?: string;
  }): string {
    const {
      industry = 'ENTERPRISE',
      module = 'CORE',
      type,
      subtype = 'STANDARD',
      version = 'v1'
    } = params;

    return `HERA.${industry.toUpperCase()}.${module.toUpperCase()}.${type.toUpperCase()}.${subtype.toUpperCase()}.${version}`;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create HERA client with environment detection
 */
export function createHeraClient(config: HeraConfig): HeraClient {
  return new HeraClient(config);
}

/**
 * Create HERA client for Vite applications
 */
export function createViteHeraClient(
  getToken: () => Promise<string>,
  getOrgId: () => Promise<string | undefined>
): HeraClient {
  const baseUrl = import.meta.env.VITE_HERA_BASE_URL as string;
  
  if (!baseUrl) {
    throw new Error('VITE_HERA_BASE_URL environment variable is required');
  }

  return createHeraClient({
    baseUrl,
    getToken,
    getOrgId
  });
}

// =============================================================================
// Default Export
// =============================================================================

export default HeraClient;