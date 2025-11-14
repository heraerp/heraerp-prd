// HERA v2.3 API Gateway - Response Types
// Smart Code: HERA.API.V2.RESPONSE.TYPES.v1

export interface HeraApiResponse<T = any> {
  ok: boolean;
  data?: T;
  meta: {
    actor_id: string;
    org_id: string;
    request_id: string;
    timestamp: string;
    duration_ms: number;
    gateway_version: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    trace_id?: string;
  };
  warnings?: string[];
}

export interface EntityResponse {
  entity_id?: string;
  entities?: Array<{
    id: string;
    entity_type: string;
    entity_name: string;
    entity_code?: string;
    smart_code?: string;
    status: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
  }>;
  dynamic_fields?: Array<{
    field_name: string;
    field_type: string;
    field_value: any;
    smart_code?: string;
  }>;
  relationships?: Array<{
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: string;
    relationship_data?: any;
  }>;
}

export interface TransactionResponse {
  transaction_id?: string;
  transactions?: Array<{
    id: string;
    transaction_type: string;
    transaction_number: string;
    transaction_date: string;
    total_amount: number;
    currency: string;
    status: string;
    smart_code?: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
  }>;
  lines?: Array<{
    id: string;
    line_order: number;
    line_description?: string;
    quantity?: number;
    unit_price?: number;
    line_amount?: number;
    smart_code?: string;
    metadata?: any;
  }>;
  rules_applied?: {
    bundle_id: string;
    mutations: Array<any>;
    trace: any;
  };
}

export interface AIAssistantResponse {
  response: string;
  tools_used?: string[];
  usage: {
    tokens: number;
    cost_estimated: number;
    model: string;
  };
  confidence?: number;
  sources?: Array<{
    type: string;
    entity_id?: string;
    description: string;
  }>;
}

export interface AIUsageResponse {
  usage_id: string;
  logged_at: string;
  cost_total: number;
  status: 'logged' | 'billed' | 'credited';
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  components: {
    api_gateway: string;
    redis: string;
    rate_limiter: string;
    idempotency: string;
    guardrails: string;
    database: string;
  };
  performance: {
    redis_latency_ms?: number;
    caching_enabled: boolean;
    rate_limiting_enabled: boolean;
    idempotency_enabled: boolean;
  };
}