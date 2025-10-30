/**
 * HERA API v2 Client SDK
 * Smart Code: HERA.CLIENT.SDK.API_V2.v1
 * 
 * Enforces API v2 gateway access - NEVER allows direct RPC calls
 * All requests must go through the security gateway for proper validation
 */

export interface HeraApiResponse<T = any> {
  rid: string;
  data: T;
  actor: string;
  org: string;
}

export interface HeraApiError {
  error: string;
  rid?: string;
  details?: any;
}

export class HeraClient {
  constructor(
    private baseUrl: string,
    private token: string,
    private orgId: string,
  ) {
    if (!baseUrl || !token || !orgId) {
      throw new Error('HeraClient requires baseUrl, token, and orgId');
    }
  }

  private headers(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.token}`,
      "X-Organization-Id": this.orgId,
      "Content-Type": "application/json",
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    payload?: any
  ): Promise<HeraApiResponse<T>> {
    const url = `${this.baseUrl}/functions/v1/api-v2${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: this.headers(),
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      const errorData: HeraApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        `API v2 request failed: ${errorData.error}${errorData.rid ? ` (${errorData.rid})` : ''}`
      );
    }

    return response.json();
  }

  /**
   * Create or update entity via API v2
   * Routes through guardrails validation before hitting hera_entities_crud_v2
   */
  async createEntity(payload: {
    operation: 'create' | 'update' | 'delete' | 'read';
    entity_type: string;
    smart_code: string;
    organization_id: string;
    entity_data?: any;
    dynamic_fields?: Array<{
      field_name: string;
      field_value: string;
      field_type: string;
      smart_code: string;
    }>;
    [key: string]: any;
  }): Promise<HeraApiResponse> {
    // Ensure organization_id matches client's orgId
    if (payload.organization_id !== this.orgId) {
      throw new Error('Payload organization_id must match client orgId');
    }

    return this.makeRequest('/entities', 'POST', payload);
  }

  /**
   * Post financial transaction via API v2
   * Routes through GL balance validation before hitting hera_transactions_post_v2
   */
  async postTransaction(payload: {
    operation: 'create' | 'update' | 'approve' | 'reverse';
    smart_code: string;
    organization_id: string;
    transaction_data?: any;
    lines?: Array<{
      smart_code: string;
      line_amount: number;
      transaction_currency_code: string;
      line_data?: any;
      [key: string]: any;
    }>;
    [key: string]: any;
  }): Promise<HeraApiResponse> {
    // Ensure organization_id matches client's orgId
    if (payload.organization_id !== this.orgId) {
      throw new Error('Payload organization_id must match client orgId');
    }

    return this.makeRequest('/transactions', 'POST', payload);
  }

  /**
   * Generic command interface for extensibility
   * Allows routing to different operations while maintaining API v2 security
   */
  async command(payload: {
    op: 'entities' | 'transactions';
    organization_id: string;
    [key: string]: any;
  }): Promise<HeraApiResponse> {
    // Ensure organization_id matches client's orgId
    if (payload.organization_id !== this.orgId) {
      throw new Error('Payload organization_id must match client orgId');
    }

    return this.makeRequest('/command', 'POST', payload);
  }

  /**
   * Master Data: Create customer via API v2
   */
  async createCustomer(customerData: {
    customerName: string;
    email: string;
    phone: string;
    [key: string]: any;
  }): Promise<HeraApiResponse> {
    return this.createEntity({
      operation: 'create',
      entity_type: 'CUSTOMER',
      smart_code: 'HERA.ENTERPRISE.CUSTOMER.v1',
      organization_id: this.orgId,
      entity_data: {
        entity_name: customerData.customerName,
        entity_type: 'CUSTOMER',
      },
      dynamic_fields: [
        {
          field_name: 'email',
          field_value: customerData.email,
          field_type: 'email',
          smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.EMAIL.v1',
        },
        {
          field_name: 'phone',
          field_value: customerData.phone,
          field_type: 'phone',
          smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.PHONE.v1',
        },
        ...Object.entries(customerData)
          .filter(([key]) => !['customerName', 'email', 'phone'].includes(key))
          .map(([key, value]) => ({
            field_name: key,
            field_value: String(value),
            field_type: 'text',
            smart_code: `HERA.ENTERPRISE.CUSTOMER.FIELD.${key.toUpperCase()}.v1`,
          })),
      ],
    });
  }

  /**
   * Finance: Post POS sale transaction via API v2
   */
  async postPOSSale(saleData: {
    totalAmount: number;
    currency: string;
    customerId?: string;
    items: Array<{
      description: string;
      amount: number;
    }>;
  }): Promise<HeraApiResponse> {
    const lines = [
      // DR: Cash/Card asset
      {
        smart_code: 'HERA.FINANCE.GL.ASSET.CASH.v1',
        line_amount: saleData.totalAmount,
        transaction_currency_code: saleData.currency,
        line_data: { side: 'DR', account_type: 'ASSET' },
      },
      // CR: Revenue
      {
        smart_code: 'HERA.FINANCE.GL.REVENUE.SALES.v1',
        line_amount: saleData.totalAmount,
        transaction_currency_code: saleData.currency,
        line_data: { side: 'CR', account_type: 'REVENUE' },
      },
    ];

    return this.postTransaction({
      operation: 'create',
      smart_code: 'HERA.FINANCE.TXN.POS_SALE.v1',
      organization_id: this.orgId,
      transaction_data: {
        transaction_type: 'POS_SALE',
        description: 'Point of Sale Transaction',
        customer_id: saleData.customerId,
        items: saleData.items,
      },
      lines,
    });
  }
}

/**
 * React Hook for HERA API v2 Client
 */
export function useHeraClient(baseUrl: string, token: string, orgId: string): HeraClient {
  if (!baseUrl || !token || !orgId) {
    throw new Error('useHeraClient requires baseUrl, token, and orgId');
  }
  
  return new HeraClient(baseUrl, token, orgId);
}

/**
 * Utility function to create a HERA client instance
 */
export function createHeraClient(config: {
  baseUrl: string;
  token: string;
  orgId: string;
}): HeraClient {
  return new HeraClient(config.baseUrl, config.token, config.orgId);
}

/**
 * Create environment-aware HERA client instance
 * Automatically uses correct Supabase environment based on NODE_ENV
 */
export async function createEnvironmentAwareHeraClient(
  token: string, 
  orgId: string, 
  environment?: string
): Promise<HeraClient> {
  const { getCurrentEnvironmentConfig } = await import('../config/environments');
  const config = getCurrentEnvironmentConfig(environment);
  
  return new HeraClient(config.apiV2BaseUrl, token, orgId);
}

/**
 * Type definitions for common HERA operations
 */
export type CreateEntityPayload = Parameters<HeraClient['createEntity']>[0];
export type PostTransactionPayload = Parameters<HeraClient['postTransaction']>[0];
export type CommandPayload = Parameters<HeraClient['command']>[0];

/**
 * Error class for HERA API v2 specific errors
 */
export class HeraApiError extends Error {
  constructor(
    message: string,
    public readonly rid?: string,
    public readonly statusCode?: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'HeraApiError';
  }
}