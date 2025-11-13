// HERA v2.3 API Gateway - Request Types
// Smart Code: HERA.API.V2.REQUEST.TYPES.v1

export interface HeraApiRequest {
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'UPSERT';
  organization_id: string;
  smart_code?: string;
  options?: {
    limit?: number;
    offset?: number;
    include_deleted?: boolean;
    dry_run?: boolean;
  };
}

export interface EntityRequest extends HeraApiRequest {
  entity_data?: {
    entity_type: string;
    entity_name?: string;
    entity_code?: string;
    smart_code?: string;
    status?: string;
    [key: string]: any;
  };
  dynamic_fields?: Array<{
    field_name: string;
    field_type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json';
    field_value?: string;
    field_value_number?: number;
    field_value_boolean?: boolean;
    field_value_date?: string;
    field_value_datetime?: string;
    field_value_json?: any;
    smart_code?: string;
  }>;
  relationships?: Array<{
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: string;
    relationship_data?: any;
    effective_date?: string;
    expiration_date?: string;
  }>;
}

export interface TransactionRequest extends HeraApiRequest {
  transaction_data?: {
    transaction_type: string;
    transaction_number?: string;
    transaction_date?: string;
    source_entity_id?: string;
    target_entity_id?: string;
    total_amount?: number;
    currency?: string;
    status?: string;
    smart_code?: string;
    metadata?: any;
  };
  lines?: Array<{
    line_order: number;
    line_description?: string;
    entity_id?: string;
    quantity?: number;
    unit_price?: number;
    line_amount?: number;
    smart_code?: string;
    line_data?: any;
    metadata?: any;
  }>;
}

export interface AIAssistantRequest {
  prompt: string;
  tools?: string[];
  context?: {
    entity_type?: string;
    entity_id?: string;
    organization_id: string;
  };
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface AIUsageRequest {
  provider: string;
  model: string;
  operation: string;
  tokens_used: number;
  cost_estimated?: number;
  request_data?: any;
  response_data?: any;
  smart_code: string;
  organization_id: string;
}