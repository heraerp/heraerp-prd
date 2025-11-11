/**
 * HERA v2.4 Platform Configuration Types
 * Smart Code: HERA.TYPES.CONFIG.PLATFORM.v1
 * 
 * Complete type definitions for the JSON-driven ERP configuration system
 */

// =============================================================================
// Core Configuration Types
// =============================================================================

export interface HeraAppConfig {
  app_id: string
  version: string
  metadata: AppConfigMetadata
  entities?: EntityDefinition[]
  transactions?: TransactionDefinition[]
  screens?: ScreenDefinition[]
  business_rules?: BusinessRuleDefinition[]
  validations?: ValidationDefinition[]
  workflows?: WorkflowDefinition[]
  integrations?: IntegrationDefinition[]
}

export interface AppConfigMetadata {
  name: string
  description: string
  module: string
  icon: string
  category: string
  tags?: string[]
  author?: string
  created_at?: string
  updated_at?: string
}

// =============================================================================
// Entity Configuration Types
// =============================================================================

export interface EntityDefinition {
  entity_type: string
  smart_code_prefix: string
  display_name: string
  display_name_plural: string
  icon: string
  color: string
  master_data?: MasterDataConfig
  fields: FieldDefinition[]
  relationships?: RelationshipDefinition[]
  indexes?: IndexDefinition[]
}

export interface MasterDataConfig {
  is_master: boolean
  has_code: boolean
  code_pattern?: string
  has_hierarchy: boolean
  supports_versioning: boolean
}

export interface FieldDefinition {
  field_name: string
  display_label: string
  field_type: FieldType
  is_required: boolean
  is_unique?: boolean
  is_searchable?: boolean
  is_system_field?: boolean
  field_order: number
  validation?: FieldValidation
  ui_hints?: FieldUIHints
  computed?: ComputedFieldConfig
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'json' | 'entity_reference'

export interface FieldValidation {
  min_length?: number
  max_length?: number
  min?: number
  max?: number
  pattern?: string
  enum?: string[]
  custom_validator?: string
  json_schema?: object
  min_date?: string
  max_date?: string
  error_message: string
  async?: boolean
}

export interface FieldUIHints {
  placeholder?: string
  help_text?: string
  input_type: UIInputType
  autocomplete?: string
  format?: string
  currency?: string
  readonly?: boolean
  options?: SelectOption[]
  default?: any
}

export type UIInputType = 
  | 'text' | 'email' | 'tel' | 'date' | 'datetime' | 'number' 
  | 'select' | 'multiselect' | 'textarea' | 'json_editor' 
  | 'entity_lookup' | 'file_upload' | 'color_picker'

export interface SelectOption {
  value: string
  label: string
  color?: string
  icon?: string
  disabled?: boolean
}

export interface ComputedFieldConfig {
  auto_calculate: boolean
  rule_id?: string
  formula?: string
  dependencies: string[]
  refresh_interval?: string
}

export interface RelationshipDefinition {
  relationship_type: string
  to_entity_type: string
  cardinality: 'one_to_one' | 'one_to_many' | 'many_to_many'
  is_required: boolean
  display_name?: string
}

export interface IndexDefinition {
  name: string
  columns: string[]
  unique?: boolean
  partial_condition?: string
}

// =============================================================================
// Transaction Configuration Types
// =============================================================================

export interface TransactionDefinition {
  transaction_type: string
  smart_code_prefix: string
  display_name: string
  display_name_plural: string
  icon: string
  color: string
  header_fields: FieldDefinition[]
  line_fields: FieldDefinition[]
  computed_totals?: ComputedTotalDefinition[]
  posting_rules?: PostingRulesConfig
  state_machine?: StateMachineConfig
}

export interface ComputedTotalDefinition {
  field_name: string
  formula: string
  display_label: string
  format?: string
  currency?: string
}

export interface PostingRulesConfig {
  bundle_id: string
  rule_id: string
  auto_post: boolean
  requires_approval: boolean
}

export interface StateMachineConfig {
  initial_state: string
  states: StateDefinition[]
  transitions: TransitionDefinition[]
}

export interface StateDefinition {
  name: string
  color: string
  actions: string[]
  display_label?: string
}

export interface TransitionDefinition {
  from: string
  to: string
  action: string
  guard?: string
  display_label?: string
}

// =============================================================================
// Screen Configuration Types
// =============================================================================

export interface ScreenDefinition {
  screen_id: string
  screen_type: ScreenType
  entity_type?: string
  transaction_type?: string
  display_name: string
  icon: string
  layout?: ScreenLayout
  filters?: FilterDefinition[]
  columns?: ColumnDefinition[]
  actions?: ActionDefinition[]
  row_actions?: ActionDefinition[]
  tabs?: TabDefinition[]
  sections?: SectionDefinition[]
  validations?: ValidationRule[]
}

export type ScreenType = 'entity_list' | 'entity_form' | 'transaction_form' | 'dashboard' | 'report'
export type ScreenLayout = 'single_page' | 'wizard' | 'tabs' | 'accordion'

export interface FilterDefinition {
  field_name: string
  display_label: string
  filter_type: FilterType
  options?: string[]
  min?: number
  max?: number
  default_value?: any
}

export type FilterType = 'text' | 'select' | 'multi_select' | 'range' | 'date_range' | 'boolean'

export interface ColumnDefinition {
  field_name: string
  display_label: string
  sortable: boolean
  width?: string
  render?: ColumnRenderType
  align?: 'left' | 'center' | 'right'
}

export type ColumnRenderType = 'text' | 'badge' | 'currency' | 'date' | 'boolean' | 'image' | 'link'

export interface ActionDefinition {
  action_id: string
  display_label: string
  icon: string
  primary?: boolean
  confirm?: boolean
  permissions?: string[]
}

export interface TabDefinition {
  tab_id: string
  display_label: string
  icon: string
  fields?: string[]
  layout_grid?: LayoutGridConfig
  component?: string
  relationship?: string
  transaction_type?: string
  filter?: Record<string, any>
}

export interface LayoutGridConfig {
  columns: number
  field_spans?: Record<string, number>
}

export interface SectionDefinition {
  section_id: string
  display_label: string
  fields?: string[]
  component?: string
  collapsible?: boolean
  add_line_button?: string
  min_lines?: number
  max_lines?: number
}

// =============================================================================
// Business Rules Configuration Types
// =============================================================================

export interface BusinessRuleDefinition {
  rule_id: string
  display_name: string
  description: string
  entity_type?: string
  transaction_type?: string
  trigger: RuleTrigger
  schedule?: string
  conditions?: ConditionDefinition[]
  actions: ActionDefinition[]
  query?: QueryDefinition
  enabled?: boolean
}

export type RuleTrigger = 'on_save' | 'on_field_change' | 'on_calculate' | 'on_submit' | 'scheduled'

export interface ConditionDefinition {
  field: string
  operator: ConditionOperator
  value?: any
  field_reference?: string
}

export type ConditionOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'in' | 'not_in' | 'like' | 'not_like'
  | 'is_null' | 'is_not_null' | 'between'

export interface ActionDefinition {
  type: ActionType
  field?: string
  value?: any
  value_expression?: any
  endpoint?: string
  method?: string
  payload?: any
  success_action?: ActionDefinition
  error_action?: ActionDefinition
}

export type ActionType = 
  | 'set_field' | 'fetch_related' | 'validate_external' 
  | 'show_error' | 'show_warning' | 'call_rpc'

export interface QueryDefinition {
  aggregate?: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN'
  field?: string
  from: string
  where: any
  group_by?: string[]
  having?: any
}

// =============================================================================
// Validation Configuration Types
// =============================================================================

export interface ValidationDefinition {
  validation_id: string
  display_name: string
  entity_type?: string
  transaction_type?: string
  field?: string
  type: ValidationType
  scope?: 'organization' | 'global'
  trigger?: RuleTrigger
  logic?: any
  operator?: ConditionOperator
  value?: any
  error_message: string
  error_code: string
}

export type ValidationType = 'unique' | 'custom' | 'threshold' | 'pattern' | 'range'

export interface ValidationRule {
  rule_id: string
  type: ValidationType
  validator?: string
  error_message: string
}

// =============================================================================
// Workflow Configuration Types
// =============================================================================

export interface WorkflowDefinition {
  workflow_id: string
  display_name: string
  transaction_type?: string
  entity_type?: string
  enabled: boolean
  trigger: WorkflowTriggerConfig
  steps: WorkflowStepDefinition[]
  notifications?: NotificationConfig[]
}

export interface WorkflowTriggerConfig {
  event: string
  conditions?: ConditionDefinition[]
}

export interface WorkflowStepDefinition {
  step_id: string
  display_name: string
  type?: 'manual' | 'automated'
  assignee_type?: 'user' | 'role' | 'expression'
  assignee_role?: string
  assignee_user?: string
  assignee_expression?: string
  due_in_hours?: number
  conditions?: ConditionDefinition[]
  actions: WorkflowActionDefinition[]
}

export interface WorkflowActionDefinition {
  action: string
  next_step?: string
  set_status?: string
  display_label?: string
}

export interface NotificationConfig {
  event: string
  recipients: string[]
  template: string
  method?: 'email' | 'sms' | 'push' | 'in_app'
}

// =============================================================================
// Integration Configuration Types
// =============================================================================

export interface IntegrationDefinition {
  integration_id: string
  display_name: string
  type: IntegrationType
  enabled: boolean
  triggers?: IntegrationTriggerConfig[]
  endpoint: string
  method: string
  auth: IntegrationAuthConfig
  payload?: any
  query?: QueryDefinition
  schedule?: string
  retry_config?: RetryConfig
}

export type IntegrationType = 'webhook' | 'scheduled' | 'real_time'

export interface IntegrationTriggerConfig {
  event: string
  entity_type?: string
  transaction_type?: string
  conditions?: ConditionDefinition[]
}

export interface IntegrationAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key'
  username?: string
  password?: string
  token?: string
  api_key?: string
  header_name?: string
}

export interface RetryConfig {
  max_retries: number
  backoff_strategy: 'fixed' | 'exponential'
  delay_ms: number
}

// =============================================================================
// Configuration API Types
// =============================================================================

export interface AppConfigResponse {
  app_id: string
  merged_config: HeraAppConfig
  has_platform_config: boolean
  has_org_override: boolean
  merged_from: string[]
  cache_key?: string
  cached_at?: string
}

export interface ConfigValidationResponse {
  is_valid: boolean
  errors: ConfigError[]
  warnings: ConfigWarning[]
}

export interface ConfigError {
  error: string
  path?: string
  entity_type?: string
  field_name?: string
  screen_id?: string
  rule_id?: string
}

export interface ConfigWarning {
  warning: string
  path?: string
  suggestion?: string
}

export interface ConfigOperationResult {
  entity_id: string
  app_id: string
  is_override: boolean
  validation: ConfigValidationResponse
  action: string
  actor_user_id: string
  organization_id: string
  processed_at: string
}

// =============================================================================
// Configuration Storage Model
// =============================================================================

export interface AppConfigEntity {
  id: string
  entity_type: 'APP_CONFIG' | 'APP_CONFIG_OVERRIDE' | 'UI_COMPONENT_CONFIG' | 'BUSINESS_RULE_CONFIG'
  entity_name: string
  smart_code: string
  organization_id: string
  status: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface AppConfigData {
  entity_id: string
  field_name: 'app_definition' | 'app_override' | 'ui_config' | 'rule_config'
  field_type: 'json'
  field_value_json: HeraAppConfig | Partial<HeraAppConfig>
  organization_id: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

// =============================================================================
// Smart Code Patterns
// =============================================================================

export class AppConfigSmartCodes {
  static PLATFORM_CONFIG = (appId: string) => 
    `HERA.PLATFORM.CONFIG.APP.${appId.toUpperCase()}.v1`
    
  static ORG_OVERRIDE = (appId: string) => 
    `HERA.ORG.CONFIG.APP.${appId.toUpperCase()}.v1`
    
  static UI_COMPONENT = (componentId: string) => 
    `HERA.UI.COMPONENT.CONFIG.${componentId.toUpperCase()}.v1`
    
  static BUSINESS_RULE = (ruleId: string) => 
    `HERA.RULE.CONFIG.${ruleId.toUpperCase()}.v1`
}

// =============================================================================
// Configuration Utility Types
// =============================================================================

export interface ConfigMergeOptions {
  arrayMergeStrategy: 'replace' | 'merge' | 'replace_by_key'
  keyMatchers: Record<string, string>
  preserveRequired: boolean
}

export interface ConfigCacheEntry {
  app_id: string
  organization_id: string
  merged_config: HeraAppConfig
  cached_at: Date
  expires_at: Date
  version: string
}

// =============================================================================
// Export All Types
// =============================================================================

export type {
  // Core types
  HeraAppConfig,
  AppConfigMetadata,
  
  // Entity types
  EntityDefinition,
  FieldDefinition,
  FieldValidation,
  FieldUIHints,
  
  // Transaction types
  TransactionDefinition,
  StateMachineConfig,
  
  // Screen types
  ScreenDefinition,
  FilterDefinition,
  ColumnDefinition,
  
  // Rule types
  BusinessRuleDefinition,
  ValidationDefinition,
  
  // Workflow types
  WorkflowDefinition,
  
  // Integration types
  IntegrationDefinition,
  
  // API types
  AppConfigResponse,
  ConfigValidationResponse,
  ConfigOperationResult
}