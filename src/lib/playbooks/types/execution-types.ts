/**
 * HERA Playbooks Execution Types
 *
 * Comprehensive TypeScript interfaces for playbook execution system,
 * including requests, responses, states, and analytics.
 */

// Base Execution Types
export type ExecutionStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'waiting'
export type WorkerType = 'human' | 'system' | 'ai' | 'external'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type StepErrorType = 'validation' | 'execution' | 'timeout' | 'permission' | 'system'

// Execution Request Types
export interface PlaybookExecutionRequest {
  playbook_id: string
  initiated_by: string
  execution_context: ExecutionContext
  input_data: Record<string, any>
  execution_options?: PlaybookExecutionOptions
}

export interface ExecutionContext {
  organization_id: string
  user_id?: string
  initiated_at: string
  client_info?: ClientInfo
  environment?: 'development' | 'staging' | 'production'
  priority?: 'low' | 'normal' | 'high' | 'critical'
  tags?: string[]
  [key: string]: any
}

export interface ClientInfo {
  user_agent?: string
  ip_address?: string
  session_id?: string
  request_id?: string
}

export interface PlaybookExecutionOptions {
  skip_validation?: boolean
  parallel_execution?: boolean
  max_retries?: number
  timeout_minutes?: number
  notification_settings?: NotificationSettings
  context_variables?: Record<string, any>
  execution_mode?: 'standard' | 'debug' | 'simulation'
  auto_approve_human_steps?: boolean
  checkpoint_intervals?: number // minutes
}

export interface NotificationSettings {
  on_start?: boolean
  on_completion?: boolean
  on_failure?: boolean
  on_step_completion?: boolean
  on_milestone?: boolean
  notification_channels?: NotificationChannel[]
  custom_webhooks?: WebhookConfig[]
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook' | 'sms'
  address: string
  enabled: boolean
  filters?: NotificationFilter[]
}

export interface NotificationFilter {
  event_type: string
  conditions: Record<string, any>
}

export interface WebhookConfig {
  url: string
  headers?: Record<string, string>
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key'
    credentials: Record<string, string>
  }
  retry_config?: {
    max_retries: number
    backoff_strategy: 'linear' | 'exponential'
  }
}

// Execution Result Types
export interface ExecutionResult {
  execution_id: string
  status: ExecutionStatus
  playbook_id: string
  playbook_name?: string
  started_at: string
  completed_at?: string
  paused_at?: string
  resumed_at?: string
  cancelled_at?: string
  total_steps: number
  completed_steps: number
  failed_steps: number
  skipped_steps: number
  current_step?: StepExecutionState
  output_data: Record<string, any>
  execution_summary: ExecutionSummary
  error_details?: ExecutionError
  checkpoints?: ExecutionCheckpoint[]
  resource_usage?: ResourceUsage
}

export interface StepExecutionState {
  step_id: string
  step_name: string
  step_number: number
  status: StepStatus
  started_at: string
  completed_at?: string
  paused_at?: string
  duration_ms?: number
  input_data: Record<string, any>
  output_data?: Record<string, any>
  error?: StepError
  retry_count: number
  retry_history?: RetryAttempt[]
  worker_info?: WorkerInfo
  dependencies?: StepDependency[]
  validation_results?: ValidationResult[]
  resource_consumption?: StepResourceConsumption
}

export interface WorkerInfo {
  worker_type: WorkerType
  worker_id?: string
  worker_name?: string
  assigned_at: string
  claimed_at?: string
  availability_status?: 'available' | 'busy' | 'offline'
  capabilities?: string[]
  performance_metrics?: WorkerPerformanceMetrics
}

export interface WorkerPerformanceMetrics {
  success_rate: number
  average_completion_time_ms: number
  total_tasks_completed: number
  reliability_score: number
}

export interface StepDependency {
  depends_on_step_id: string
  dependency_type: 'sequential' | 'conditional' | 'data'
  condition?: Record<string, any>
  satisfied: boolean
}

export interface ValidationResult {
  validator_type: 'input' | 'output' | 'business_rule' | 'compliance'
  is_valid: boolean
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  validated_at: string
}

export interface ValidationError {
  field_path: string
  error_code: string
  error_message: string
  suggested_fix?: string
}

export interface ValidationWarning {
  field_path: string
  warning_code: string
  warning_message: string
  severity: 'low' | 'medium' | 'high'
}

export interface StepResourceConsumption {
  cpu_usage_percent: number
  memory_usage_mb: number
  network_io_bytes: number
  storage_io_bytes: number
  external_api_calls: number
  duration_ms: number
}

export interface RetryAttempt {
  attempt_number: number
  started_at: string
  completed_at?: string
  status: 'succeeded' | 'failed'
  error?: StepError
  retry_strategy: 'immediate' | 'delayed' | 'exponential_backoff'
  delay_ms?: number
}

export interface ExecutionSummary {
  duration_ms: number
  success_rate: number
  steps_executed: number
  parallel_steps: number
  retries_performed: number
  worker_assignments: Record<WorkerType, number>
  performance_grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'
  cost_analysis?: CostAnalysis
  efficiency_metrics?: EfficiencyMetrics
}

export interface CostAnalysis {
  total_cost_usd: number
  cost_breakdown: {
    compute_cost: number
    worker_cost: number
    external_api_cost: number
    storage_cost: number
  }
  cost_per_step: number
  budget_utilization_percent: number
}

export interface EfficiencyMetrics {
  time_efficiency: number // 0-100
  resource_efficiency: number // 0-100
  cost_efficiency: number // 0-100
  quality_score: number // 0-100
  bottleneck_indicators: BottleneckIndicator[]
}

export interface BottleneckIndicator {
  type: 'cpu' | 'memory' | 'network' | 'worker_availability' | 'dependency_wait'
  severity: 'low' | 'medium' | 'high' | 'critical'
  affected_steps: string[]
  impact_description: string
  suggested_solutions: string[]
}

export interface ExecutionError {
  error_code: string
  error_message: string
  failed_step?: string
  stack_trace?: string
  context: Record<string, any>
  error_category: 'user_input' | 'system' | 'network' | 'permission' | 'business_logic'
  recoverable: boolean
  recovery_suggestions?: string[]
  error_timestamp: string
}

export interface StepError {
  error_type: StepErrorType
  error_code: string
  error_message: string
  details?: Record<string, any>
  recoverable: boolean
  retry_recommended: boolean
  max_retry_attempts?: number
  cooldown_period_ms?: number
}

export interface ExecutionCheckpoint {
  checkpoint_id: string
  created_at: string
  step_number: number
  execution_state: Record<string, any>
  context_data: Record<string, any>
  resource_state: Record<string, any>
  validation_passed: boolean
}

export interface ResourceUsage {
  peak_cpu_percent: number
  peak_memory_mb: number
  total_network_bytes: number
  total_storage_bytes: number
  external_api_calls: number
  concurrent_workers: number
}

// API Response Types
export interface ExecutePlaybookResponse {
  success: boolean
  data: ExecutionStartResult
  metadata: ExecutionStartMetadata
}

export interface ExecutionStartResult {
  execution_id: string
  status: ExecutionStatus
  playbook_id: string
  playbook_name: string
  started_at: string
  total_steps: number
  estimated_duration_hours: number
  execution_options: PlaybookExecutionOptions
  tracking_url: string
  estimated_completion_at?: string
}

export interface ExecutionStartMetadata {
  organization_id: string
  initiated_by: string
  validation_performed: boolean
  execution_time: string
  priority: string
  estimated_cost_usd?: number
}

export interface ListExecutionsResponse {
  success: boolean
  data: ExecutionListItem[]
  pagination: ExecutionPagination
  summary: ExecutionListSummary
  filters_applied: ExecutionListFilters
  metadata: ListExecutionsMetadata
}

export interface ExecutionListItem {
  execution_id: string
  status: ExecutionStatus
  playbook_id: string
  playbook_name: string
  playbook_industry: string
  playbook_version: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  total_steps: number
  completed_steps: number
  failed_steps: number
  success_rate: number
  initiated_by: string
  priority?: string
  performance_grade?: string
  step_executions?: StepExecutionSummary[]
  performance_metrics?: PerformanceMetrics
}

export interface StepExecutionSummary {
  step_number: number
  step_name: string
  status: StepStatus
  duration_ms?: number
  worker_type: WorkerType
  retry_count: number
  error_summary?: string
}

export interface PerformanceMetrics {
  execution_efficiency: number
  time_per_step: number
  performance_grade: string
  bottlenecks: string[]
  resource_utilization: ResourceUtilization
}

export interface ResourceUtilization {
  cpu_efficiency: number
  memory_efficiency: number
  network_efficiency: number
  worker_utilization: number
}

export interface ExecutionPagination {
  total: number
  filtered: number
  page: number
  limit: number
  offset: number
  has_more: boolean
}

export interface ExecutionListSummary {
  total_executions: number
  filtered_executions: number
  status_breakdown: Record<ExecutionStatus, number>
  average_duration_minutes: number
  success_rate: number
  most_executed_playbooks: PopularPlaybook[]
  recent_trends: TrendAnalysis
}

export interface PopularPlaybook {
  playbook_id: string
  playbook_name: string
  execution_count: number
  success_rate: number
  average_duration_minutes: number
}

export interface TrendAnalysis {
  last_7_days: TrendPeriod
  last_30_days: TrendPeriod
  growth_indicators: GrowthIndicator[]
}

export interface TrendPeriod {
  total_executions: number
  success_rate: number
  average_duration_minutes: number
  peak_concurrent_executions: number
}

export interface GrowthIndicator {
  metric: string
  change_percent: number
  trend_direction: 'up' | 'down' | 'stable'
  significance: 'low' | 'medium' | 'high'
}

export interface ExecutionListFilters {
  playbook_id?: string
  status?: ExecutionStatus
  initiated_by?: string
  date_from?: string
  date_to?: string
  include_steps?: boolean
  include_analytics?: boolean
  include_output_data?: boolean
  limit?: number
  offset?: number
  sort_by?: 'started_at' | 'completed_at' | 'duration' | 'status' | 'success_rate'
  sort_direction?: 'asc' | 'desc'
}

export interface ListExecutionsMetadata {
  organization_id: string
  query_time_ms: number
  includes_applied: {
    steps: boolean
    analytics: boolean
    output_data: boolean
  }
  performance_stats: QueryPerformanceStats
}

export interface QueryPerformanceStats {
  database_query_ms: number
  data_processing_ms: number
  serialization_ms: number
  cache_hit_rate: number
}

export interface GetExecutionResponse {
  success: boolean
  data: DetailedExecutionResult
  metadata: GetExecutionMetadata
}

export interface DetailedExecutionResult extends ExecutionResult {
  playbook_details: PlaybookDetails
  step_executions?: DetailedStepExecution[]
  execution_logs?: ExecutionLog[]
  performance_metrics?: DetailedPerformanceMetrics
  execution_timeline?: TimelineEvent[]
  progress: ExecutionProgress
  user_permissions: ExecutionPermissions
  related_executions?: RelatedExecution[]
}

export interface PlaybookDetails {
  id: string
  name: string
  description?: string
  industry: string
  version: string
  estimated_duration_hours: number
  complexity_score?: number
  last_updated: string
}

export interface DetailedStepExecution extends StepExecutionState {
  step_details?: StepDetails
  input_validation?: ValidationResult
  output_validation?: ValidationResult
  business_rule_validations?: ValidationResult[]
  performance_analysis?: StepPerformanceAnalysis
  related_logs?: ExecutionLog[]
}

export interface StepDetails {
  description: string
  business_rules: string[]
  required_roles: string[]
  estimated_duration_minutes: number
  complexity_score: number
  automation_level: 'manual' | 'semi_automated' | 'fully_automated'
}

export interface StepPerformanceAnalysis {
  efficiency_score: number
  resource_optimization_suggestions: string[]
  bottleneck_analysis: string[]
  comparison_to_baseline: PerformanceComparison
}

export interface PerformanceComparison {
  baseline_duration_ms: number
  current_duration_ms: number
  performance_delta_percent: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface ExecutionLog {
  log_id: string
  timestamp: string
  level: LogLevel
  message: string
  context: Record<string, any>
  step_id?: string
  worker_id?: string
  correlation_id?: string
  tags?: string[]
}

export interface DetailedPerformanceMetrics {
  execution_efficiency: number
  time_utilization: number
  resource_usage: DetailedResourceUsage
  bottleneck_analysis: BottleneckAnalysis
  performance_score: number
  optimization_recommendations: OptimizationRecommendation[]
  benchmark_comparison?: BenchmarkComparison
}

export interface DetailedResourceUsage {
  cpu: ResourceMetric
  memory: ResourceMetric
  network: ResourceMetric
  storage: ResourceMetric
  external_services: ExternalServiceUsage[]
}

export interface ResourceMetric {
  peak_usage: number
  average_usage: number
  efficiency_score: number
  utilization_trend: DataPoint[]
}

export interface DataPoint {
  timestamp: string
  value: number
}

export interface ExternalServiceUsage {
  service_name: string
  api_calls: number
  total_latency_ms: number
  error_rate: number
  cost_usd?: number
}

export interface BottleneckAnalysis {
  primary_bottlenecks: Bottleneck[]
  performance_impact: PerformanceImpact
  resolution_priority: ResolutionPriority[]
}

export interface Bottleneck {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affected_steps: string[]
  impact_description: string
  duration_impact_ms: number
  cost_impact_usd?: number
}

export interface PerformanceImpact {
  total_delay_ms: number
  cost_increase_percent: number
  user_experience_impact: 'minimal' | 'moderate' | 'significant' | 'severe'
}

export interface ResolutionPriority {
  bottleneck_id: string
  priority_score: number
  expected_improvement_percent: number
  implementation_effort: 'low' | 'medium' | 'high'
}

export interface OptimizationRecommendation {
  category: 'performance' | 'cost' | 'reliability' | 'user_experience'
  title: string
  description: string
  expected_impact: OptimizationImpact
  implementation_complexity: 'low' | 'medium' | 'high'
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimated_effort_hours: number
}

export interface OptimizationImpact {
  performance_improvement_percent: number
  cost_reduction_percent: number
  reliability_improvement: string
  user_satisfaction_impact: string
}

export interface BenchmarkComparison {
  industry_average: BenchmarkMetrics
  organization_average: BenchmarkMetrics
  top_performer: BenchmarkMetrics
  performance_percentile: number
}

export interface BenchmarkMetrics {
  average_duration_minutes: number
  success_rate: number
  cost_per_execution_usd: number
  resource_efficiency_score: number
}

export interface TimelineEvent {
  timestamp: string
  event: string
  description: string
  metadata: Record<string, any>
  severity?: 'info' | 'warning' | 'error'
  step_id?: string
  duration_ms?: number
}

export interface ExecutionProgress {
  percentage: number
  current_step?: StepExecutionState
  estimated_completion: string | null
  time_remaining_minutes: number | null
  milestones_completed: Milestone[]
  next_milestone?: Milestone
}

export interface Milestone {
  name: string
  step_number: number
  completed_at?: string
  description: string
  significance: 'minor' | 'major' | 'critical'
}

export interface ExecutionPermissions {
  can_cancel: boolean
  can_retry: boolean
  can_pause: boolean
  can_resume: boolean
  can_view_logs: boolean
  can_modify: boolean
  can_export_data: boolean
  can_view_sensitive_data: boolean
}

export interface RelatedExecution {
  execution_id: string
  playbook_name: string
  relationship_type: 'retry' | 'continuation' | 'parallel' | 'child' | 'parent'
  started_at: string
  status: ExecutionStatus
}

export interface GetExecutionMetadata {
  organization_id: string
  execution_id: string
  query_time_ms: number
  includes_applied: ExecutionDetailIncludes
  real_time_data: boolean
  cache_status: 'hit' | 'miss' | 'partial'
  data_freshness_seconds: number
}

export interface ExecutionDetailIncludes {
  steps: boolean
  step_details: boolean
  logs: boolean
  performance_metrics: boolean
  timeline: boolean
}

// Error Response Types
export interface ExecutionErrorResponse {
  error: string
  code: ExecutionErrorCode
  message?: string
  details?: any
  execution_id?: string
  step_id?: string
  context?: Record<string, any>
}

export type ExecutionErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INPUT_VALIDATION_ERROR'
  | 'INVALID_PLAYBOOK_STATUS'
  | 'DUPLICATE_EXECUTION'
  | 'EXECUTION_ERROR'
  | 'STEP_EXECUTION_FAILED'
  | 'TIMEOUT_ERROR'
  | 'RESOURCE_LIMIT_EXCEEDED'
  | 'WORKER_UNAVAILABLE'
  | 'DEPENDENCY_FAILED'
  | 'INVALID_STATUS'
  | 'INVALID_ACTION'
  | 'ALREADY_CANCELLED'
  | 'CANCELLATION_FAILED'
  | 'INTERNAL_ERROR'

// Type guards
export function isExecutionError(response: any): response is ExecutionErrorResponse {
  return !response.success && response.error && response.code
}

export function isExecutionResult(data: any): data is ExecutionResult {
  return data && typeof data.execution_id === 'string' && typeof data.status === 'string'
}

export function isStepExecutionState(data: any): data is StepExecutionState {
  return data && typeof data.step_id === 'string' && typeof data.status === 'string'
}

export function isExecutionInProgress(execution: ExecutionResult): boolean {
  return execution.status === 'in_progress'
}

export function isExecutionCompleted(execution: ExecutionResult): boolean {
  return execution.status === 'completed'
}

export function isExecutionFailed(execution: ExecutionResult): boolean {
  return execution.status === 'failed'
}

export function canExecutionBeCancelled(execution: ExecutionResult): boolean {
  return (
    execution.status === 'in_progress' ||
    execution.status === 'queued' ||
    execution.status === 'paused'
  )
}

export function canExecutionBeRetried(execution: ExecutionResult): boolean {
  return execution.status === 'failed' || execution.status === 'cancelled'
}
