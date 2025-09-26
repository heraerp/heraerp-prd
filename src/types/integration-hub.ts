// Integration Hub Types - Core definitions for multi-tenant integration management
// All entities stored using Sacred Six architecture

export interface IntegrationConnector {
  id: string
  entity_type: 'integration_connector'
  entity_name: string
  entity_code: string // e.g., 'CONN-MS365', 'CONN-GOOGLE'
  smart_code: string // e.g., 'HERA.INTEGRATIONS.CONNECTOR.MS365.v1'
  organization_id: string
  vendor: IntegrationVendor
  status: 'active' | 'inactive' | 'error' | 'configuring'
  config: ConnectorConfig
  capabilities: ConnectorCapability[]
  last_health_check: string
  created_at: string
  updated_at: string
}

export type IntegrationVendor =
  | 'microsoft_365'
  | 'google'
  | 'mailchimp'
  | 'linkedin'
  | 'bluesky'
  | 'twinfield'
  | 'craft_cms'
  | 'eventbrite'
  | 'power_bi'
  | 'tableau'

export interface ConnectorConfig {
  auth_type: 'oauth2' | 'api_key' | 'basic' | 'custom'
  oauth?: {
    client_id: string
    client_secret?: string // Stored encrypted
    redirect_uri: string
    scopes: string[]
    token?: OAuthToken
  }
  api_key?: string // Stored encrypted
  custom_fields?: Record<string, any>
  base_url?: string
  version?: string
}

export interface OAuthToken {
  access_token: string // Stored encrypted
  refresh_token?: string // Stored encrypted
  expires_at: string
  scope: string
}

export interface ConnectorCapability {
  type: 'read' | 'write' | 'webhook' | 'realtime' | 'batch'
  resource: string // e.g., 'contacts', 'emails', 'events'
  operations: string[] // e.g., ['list', 'get', 'create', 'update', 'delete']
}

export interface DataMapping {
  id: string
  entity_type: 'integration_mapping'
  entity_name: string
  entity_code: string // e.g., 'MAP-MS365-CONTACTS'
  smart_code: string // e.g., 'HERA.INTEGRATIONS.MAPPING.MS365.CONTACTS.v1'
  organization_id: string
  connector_id: string
  source_schema: DataSchema
  target_schema: DataSchema
  field_mappings: FieldMapping[]
  transform_operations: TransformOperation[]
  validation_rules: ValidationRule[]
  created_at: string
  updated_at: string
}

export interface DataSchema {
  vendor: IntegrationVendor
  resource: string // e.g., 'contacts', 'emails'
  version: string
  fields: SchemaField[]
  sample_data?: any
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required: boolean
  description?: string
  format?: string // e.g., 'email', 'phone', 'date-time'
  enum?: any[]
  properties?: Record<string, SchemaField> // For object types
  items?: SchemaField // For array types
}

export interface FieldMapping {
  id: string
  source_field: string // Dot notation e.g., 'person.email.address'
  target_field: string // HERA field path
  transform?: TransformOperation
  default_value?: any
  is_key?: boolean // Used for matching/deduplication
}

export interface TransformOperation {
  type: 'filter' | 'map' | 'merge' | 'split' | 'validate' | 'enrich' | 'redact'
  config: Record<string, any>
  order: number
}

export interface ValidationRule {
  field: string
  type: 'required' | 'format' | 'range' | 'custom'
  config: Record<string, any>
  error_message: string
}

export interface SyncJob {
  id: string
  entity_type: 'integration_sync_job'
  entity_name: string
  entity_code: string // e.g., 'SYNC-MS365-CONTACTS-DAILY'
  smart_code: string // e.g., 'HERA.INTEGRATIONS.SYNC.MS365.CONTACTS.DAILY.v1'
  organization_id: string
  connector_id: string
  mapping_id: string
  sync_type: 'full' | 'incremental' | 'delta' | 'webhook'
  sync_direction: 'inbound' | 'outbound' | 'bidirectional'
  schedule?: SyncSchedule
  filters?: SyncFilter[]
  options: SyncOptions
  status: 'active' | 'paused' | 'error'
  last_run?: SyncRun
  next_run?: string
  created_at: string
  updated_at: string
}

export interface SyncSchedule {
  type: 'cron' | 'interval' | 'manual'
  cron?: string // e.g., '0 */6 * * *' (every 6 hours)
  interval_minutes?: number
  timezone?: string
  active_hours?: {
    start: string // e.g., '09:00'
    end: string // e.g., '17:00'
  }
}

export interface SyncFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in' | 'between'
  value: any
}

export interface SyncOptions {
  batch_size: number
  max_retries: number
  retry_delay_seconds: number
  timeout_seconds: number
  error_threshold: number // Stop sync if error rate exceeds this %
  duplicate_handling: 'skip' | 'update' | 'create_new'
  delete_missing: boolean
  dry_run: boolean
}

export interface SyncRun {
  id: string
  entity_type: 'integration_sync_run'
  entity_name: string
  entity_code: string // e.g., 'RUN-SYNC-MS365-CONTACTS-20240125-143000'
  smart_code: string // e.g., 'HERA.INTEGRATIONS.RUN.MS365.CONTACTS.v1'
  organization_id: string
  sync_job_id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  ended_at?: string
  duration_seconds?: number
  stats: SyncStats
  errors: SyncError[]
  logs: SyncLog[]
}

export interface SyncStats {
  total_records: number
  processed_records: number
  created_records: number
  updated_records: number
  deleted_records: number
  skipped_records: number
  error_records: number
  data_volume_bytes: number
}

export interface SyncError {
  timestamp: string
  record_id?: string
  error_type: 'validation' | 'transformation' | 'api' | 'system'
  error_code: string
  message: string
  details?: any
  retry_count: number
}

export interface SyncLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: any
}

// Data Contract Types
export interface DataContract {
  id: string
  entity_type: 'integration_contract'
  entity_name: string
  entity_code: string // e.g., 'CONTRACT-MS365-CONTACTS-v2'
  smart_code: string // e.g., 'HERA.INTEGRATIONS.CONTRACT.MS365.CONTACTS.v2'
  organization_id: string
  vendor: IntegrationVendor
  resource: string
  version: string
  schema: DataSchema
  breaking_changes?: BreakingChange[]
  deprecated_fields?: DeprecatedField[]
  created_at: string
}

export interface BreakingChange {
  version: string
  field: string
  change_type: 'removed' | 'type_changed' | 'required_added'
  description: string
  migration_guide?: string
}

export interface DeprecatedField {
  field: string
  deprecated_in_version: string
  remove_in_version?: string
  replacement_field?: string
  reason: string
}

// Monitoring Types
export interface IntegrationHealth {
  connector_id: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  last_check: string
  uptime_percentage: number
  response_time_ms: number
  error_rate: number
  quota_usage?: QuotaUsage
  alerts: HealthAlert[]
}

export interface QuotaUsage {
  api_calls: {
    used: number
    limit: number
    reset_at: string
  }
  data_volume: {
    used_bytes: number
    limit_bytes: number
  }
  rate_limit?: {
    requests_per_minute: number
    current_usage: number
  }
}

export interface HealthAlert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  type: 'quota' | 'rate_limit' | 'auth' | 'api_error' | 'data_quality'
  message: string
  timestamp: string
  resolved: boolean
}

// UI Types
export interface IntegrationDashboard {
  total_connectors: number
  active_connectors: number
  total_sync_jobs: number
  active_sync_jobs: number
  last_24h_syncs: number
  last_24h_records: number
  last_24h_errors: number
  health_summary: {
    healthy: number
    degraded: number
    unhealthy: number
  }
  top_errors: SyncError[]
  upcoming_syncs: SyncJob[]
}

// Flow Diagram Types
export interface FlowDiagram {
  nodes: FlowNode[]
  edges: FlowEdge[]
  layout: 'horizontal' | 'vertical' | 'radial'
}

export interface FlowNode {
  id: string
  type: 'connector' | 'transformer' | 'validator' | 'target'
  label: string
  status: 'active' | 'inactive' | 'error'
  metadata: any
  position?: { x: number; y: number }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  style?: any
}

// Webhook Types
export interface WebhookEndpoint {
  id: string
  entity_type: 'integration_webhook'
  entity_name: string
  entity_code: string
  smart_code: string
  organization_id: string
  connector_id: string
  url: string // Generated endpoint URL
  secret: string // For signature verification
  events: string[] // Events to listen for
  active: boolean
  last_received?: string
  failure_count: number
}

// Export helper types
export type SyncStatus = SyncJob['status']
export type SyncDirection = SyncJob['sync_direction']
export type TransformType = TransformOperation['type']
export type AuthType = ConnectorConfig['auth_type']
