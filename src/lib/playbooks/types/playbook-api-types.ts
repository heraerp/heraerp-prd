/**
 * HERA Playbooks API Types
 * 
 * TypeScript interfaces for all playbook API requests and responses,
 * ensuring type safety across the entire playbooks system.
 */

// Base API Response
export interface PlaybookApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  metadata?: Record<string, any>;
}

// Pagination
export interface PlaybookPagination {
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  offset: number;
}

// Create Playbook Request
export interface CreatePlaybookRequest {
  name: string;
  description?: string;
  industry: string;
  module: string;
  version?: string;
  estimated_duration_hours?: number;
  worker_types?: ('human' | 'system' | 'ai' | 'external')[];
  metadata?: Record<string, any>;
  steps?: CreateStepRequest[];
  contracts?: CreateContractRequest[];
  policies?: CreatePolicyRequest[];
}

// Create Step Request
export interface CreateStepRequest {
  name: string;
  step_number: number;
  step_type: 'human' | 'system' | 'ai' | 'external';
  worker_type: string;
  estimated_duration_minutes: number;
  required_roles: string[];
  description: string;
  business_rules?: string[];
  error_handling?: string;
  metadata?: Record<string, any>;
}

// Create Contract Request
export interface CreateContractRequest {
  type: 'input_contract' | 'output_contract' | 'step_input_contract' | 'step_output_contract';
  schema: Record<string, any>;
  entity_id?: string; // For step-specific contracts
  metadata?: Record<string, any>;
}

// Create Policy Request
export interface CreatePolicyRequest {
  type: 'sla_policy' | 'quorum_policy' | 'segregation_policy' | 'approval_policy' | 'retry_policy';
  rules: Record<string, any>;
  metadata?: Record<string, any>;
}

// Playbook Query Parameters
export interface PlaybookQueryParams {
  industry?: string;
  module?: string;
  status?: 'draft' | 'active' | 'deprecated' | 'deleted';
  latest_only?: boolean;
  include_contracts?: boolean;
  include_policies?: boolean;
  include_steps?: boolean;
  limit?: number;
  offset?: number;
}

// Playbook Detail Parameters
export interface PlaybookDetailParams {
  include_steps?: boolean;
  include_contracts?: boolean;
  include_policies?: boolean;
  include_runs?: boolean;
  include_analytics?: boolean;
  resolve_latest?: boolean;
  expand_relationships?: boolean;
}

// Playbook Definition Response
export interface PlaybookDefinitionResponse {
  id: string;
  organization_id: string;
  smart_code: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'deprecated' | 'deleted';
  version: string;
  ai_confidence: number;
  ai_insights: string;
  metadata: PlaybookMetadata;
  created_at: string;
  updated_at: string;
  smart_code_analysis?: SmartCodeAnalysis;
  steps?: StepDefinitionResponse[];
  contracts?: ContractResponse[];
  policies?: PolicyResponse[];
  recent_runs?: PlaybookRunSummary[];
  analytics?: PlaybookAnalytics;
  step_relationships?: StepRelationships;
}

// Playbook Metadata
export interface PlaybookMetadata {
  industry: string;
  module: string;
  estimated_duration_hours: number;
  worker_types: string[];
  step_count: number;
  input_schema_ref: string;
  output_schema_ref: string;
  created_by: string;
  last_modified: string;
  steps_created?: number;
  contracts_created?: number;
  policies_created?: number;
  creation_summary?: CreationSummary;
  [key: string]: any;
}

// Creation Summary
export interface CreationSummary {
  steps: Array<{ id: string; name: string; type: string }>;
  contracts: Array<{ type: string; entity_id: string }>;
  policies: Array<{ type: string; rules_count: number }>;
}

// Step Definition Response
export interface StepDefinitionResponse {
  id: string;
  organization_id: string;
  smart_code: string;
  name: string;
  status: 'active' | 'deprecated';
  version: string;
  ai_confidence: number;
  ai_insights: string;
  metadata: StepMetadata;
  created_at: string;
  updated_at: string;
  smart_code_analysis?: SmartCodeAnalysis;
}

// Step Metadata
export interface StepMetadata {
  step_number: number;
  step_type: 'human' | 'system' | 'ai' | 'external';
  worker_type: string;
  estimated_duration_minutes: number;
  required_roles: string[];
  description: string;
  business_rules: string[];
  next_steps: string[];
  error_handling: string;
  [key: string]: any;
}

// Contract Response
export interface ContractResponse {
  id: string;
  organization_id: string;
  entity_id: string;
  code: string;
  value_json: Record<string, any>;
  data_type: string;
  validation_rule: string;
  created_at: string;
  updated_at: string;
  schema_analysis?: SchemaAnalysis;
  usage_info?: ContractUsageInfo;
}

// Policy Response
export interface PolicyResponse {
  id: string;
  organization_id: string;
  entity_id: string;
  code: string;
  value_json: Record<string, any>;
  data_type: string;
  validation_rule: string;
  created_at: string;
  updated_at: string;
  rules_analysis?: PolicyRulesAnalysis;
  enforcement_history?: PolicyEnforcementHistory;
}

// Smart Code Analysis
export interface SmartCodeAnalysis {
  prefix: string;
  industry: string;
  module: string;
  type: string;
  subtype: string;
  version: string;
}

// Schema Analysis
export interface SchemaAnalysis {
  type: string;
  required_fields: string[];
  optional_fields: string[];
  total_fields: number;
  has_validation: boolean;
}

// Policy Rules Analysis
export interface PolicyRulesAnalysis {
  rule_count: number;
  rule_types: string[];
  has_thresholds: boolean;
  complexity_score: number;
}

// Contract Usage Info
export interface ContractUsageInfo {
  validation_count: number;
  last_used: string | null;
  failure_rate: number;
}

// Policy Enforcement History
export interface PolicyEnforcementHistory {
  enforcement_count: number;
  violation_count: number;
  last_enforced: string | null;
}

// Step Relationships
export interface StepRelationships {
  playbook_contains_steps: RelationshipResponse[];
  step_sequences: RelationshipResponse[];
}

// Relationship Response
export interface RelationshipResponse {
  id: string;
  organization_id: string;
  from_entity_id: string;
  to_entity_id: string;
  smart_code: string;
  metadata: Record<string, any>;
}

// Playbook Run Summary
export interface PlaybookRunSummary {
  id: string;
  organization_id: string;
  smart_code: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  subject_entity_id: string;
  occurred_at: string;
  ai_confidence: number;
  ai_insights: string;
  metadata: Record<string, any>;
  duration_summary: RunDurationSummary;
  status_summary: RunStatusSummary;
}

// Run Duration Summary
export interface RunDurationSummary {
  duration_ms: number;
  duration_minutes: number;
  duration_hours: number;
  is_completed: boolean;
}

// Run Status Summary
export interface RunStatusSummary {
  current_status: string;
  current_step: number;
  progress_percentage: number;
}

// Playbook Analytics
export interface PlaybookAnalytics {
  execution_stats: ExecutionStats;
  performance_trends: PerformanceTrends;
  common_failure_points: FailurePoint[];
  usage_patterns: UsagePatterns;
}

// Execution Stats
export interface ExecutionStats {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  success_rate: number;
  average_duration_hours: number;
}

// Performance Trends
export interface PerformanceTrends {
  last_30_days: TrendPeriod;
  last_7_days: TrendPeriod;
}

// Trend Period
export interface TrendPeriod {
  total_runs: number;
  success_rate: number;
  average_duration: number;
}

// Failure Point
export interface FailurePoint {
  step: string;
  failure_count: number;
}

// Usage Patterns
export interface UsagePatterns {
  peak_hours: PeakHour[];
  frequent_users: FrequentUser[];
}

// Peak Hour
export interface PeakHour {
  hour: number;
  run_count: number;
}

// Frequent User
export interface FrequentUser {
  user_id: string;
  run_count: number;
}

// List Playbooks Response
export interface ListPlaybooksResponse {
  success: boolean;
  data: PlaybookDefinitionResponse[];
  pagination: PlaybookPagination;
  summary: PlaybookListSummary;
  filters_applied: PlaybookQueryParams;
  metadata: ListPlaybooksMetadata;
}

// Playbook List Summary
export interface PlaybookListSummary {
  total_playbooks: number;
  active_playbooks: number;
  draft_playbooks: number;
  industries: string[];
  modules: string[];
  avg_duration_hours: number;
  total_steps: number;
}

// List Playbooks Metadata
export interface ListPlaybooksMetadata {
  organization_id: string;
  query_time_ms: number;
  latest_version_resolution: boolean;
}

// Get Playbook Response
export interface GetPlaybookResponse {
  success: boolean;
  data: PlaybookDefinitionResponse;
  metadata: GetPlaybookMetadata;
}

// Get Playbook Metadata
export interface GetPlaybookMetadata {
  organization_id: string;
  requested_id: string;
  resolved_id: string;
  version_resolution: VersionResolution | null;
  query_time_ms: number;
  includes_applied: PlaybookDetailParams;
  user_permissions: UserPermissions;
  version_info: VersionInfo;
}

// Version Resolution
export interface VersionResolution {
  requested_id: string;
  resolved_id: string;
  resolved_version: string;
  resolution_type: 'latest_version' | 'direct_match';
}

// User Permissions
export interface UserPermissions {
  can_execute: boolean;
  can_manage: boolean;
  can_view_analytics: boolean;
}

// Version Info
export interface VersionInfo {
  current_version: string;
  total_versions: number;
  is_latest: boolean;
  available_versions: VersionSummary[];
}

// Version Summary
export interface VersionSummary {
  id: string;
  version: string;
  status: string;
}

// Create Playbook Response
export interface CreatePlaybookResponse {
  success: boolean;
  data: CreatePlaybookResult;
  metadata: CreatePlaybookMetadata;
}

// Create Playbook Result
export interface CreatePlaybookResult {
  playbook: PlaybookDefinitionResponse;
  steps: StepDefinitionResponse[];
  contracts: ContractResponse[];
  policies: PolicyResponse[];
  relationships_created: number;
}

// Create Playbook Metadata
export interface CreatePlaybookMetadata {
  smart_code: string;
  validation: {
    valid: boolean;
    errors?: string[];
    suggestions?: string[];
  };
  organization_id: string;
  created_at: string;
  creation_time_ms: number;
}

// Update Playbook Request
export interface UpdatePlaybookRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'deprecated';
  metadata?: Partial<PlaybookMetadata>;
}

// Update Playbook Response
export interface UpdatePlaybookResponse {
  success: boolean;
  data: PlaybookDefinitionResponse;
  metadata: UpdatePlaybookMetadata;
}

// Update Playbook Metadata
export interface UpdatePlaybookMetadata {
  organization_id: string;
  updated_fields: string[];
  update_time: string;
}

// Delete Playbook Response
export interface DeletePlaybookResponse {
  success: boolean;
  data: DeletePlaybookResult;
  metadata: DeletePlaybookMetadata;
}

// Delete Playbook Result
export interface DeletePlaybookResult {
  id: string;
  status: 'deleted';
  deletion_time: string;
}

// Delete Playbook Metadata
export interface DeletePlaybookMetadata {
  organization_id: string;
  soft_delete: boolean;
  active_runs_checked: boolean;
}

// Error Response Types
export interface PlaybookErrorResponse {
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'SMART_CODE_ERROR' | 'DUPLICATE_PLAYBOOK' | 'ACTIVE_RUNS_EXIST' | 'INTERNAL_ERROR';
  message?: string;
  details?: any;
  requested_id?: string;
  resolved_id?: string;
  active_runs_count?: number;
}

// Type guards for API responses
export function isPlaybookApiError(response: any): response is PlaybookErrorResponse {
  return !response.success && response.error && response.code;
}

export function isPlaybookDefinitionResponse(data: any): data is PlaybookDefinitionResponse {
  return data && typeof data.id === 'string' && typeof data.smart_code === 'string';
}

export function isListPlaybooksResponse(response: any): response is ListPlaybooksResponse {
  return response.success && Array.isArray(response.data) && response.pagination;
}

export function isGetPlaybookResponse(response: any): response is GetPlaybookResponse {
  return response.success && isPlaybookDefinitionResponse(response.data);
}

export function isCreatePlaybookResponse(response: any): response is CreatePlaybookResponse {
  return response.success && response.data?.playbook && Array.isArray(response.data.steps);
}