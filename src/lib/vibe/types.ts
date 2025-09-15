// HERA 100% Vibe Coding System - Type Definitions
// Smart Code: HERA.VIBE.FOUNDATION.TYPES.DEFINITIONS.v1
// Purpose: Universal type definitions for vibe coding system

// Core vibe context for seamless continuity
export interface VibeContext {
  smart_code: string // HERA.VIBE.CONTEXT.{TYPE}.{PURPOSE}.v1
  session_id: string // Unique session identifier
  conversation_state: object // Complete conversation history
  task_lineage: string[] // Chain of related tasks
  code_evolution: CodeEvolution[] // Code change history
  relationship_map: object // Component dependencies
  business_context: object // Domain-specific context
  user_intent: string // Original user intention
  timestamp: Date // Context creation time
  organization_id: string // Multi-tenant context
}

// Self-documenting component definition
export interface VibeComponent {
  id: string // Unique component identifier
  name: string // Human-readable component name
  smart_code: string // HERA.VIBE.{MODULE}.{FUNCTION}.{TYPE}.v1
  purpose: string // Why this component exists
  relationships: string[] // What it connects to (smart codes)
  evolution_history: CodeEvolution[] // How it changed over time
  usage_patterns: UsagePattern[] // How it's typically used
  maintenance_notes: string[] // Important maintenance info
  test_scenarios: TestScenario[] // Self-testing capabilities
  performance_metrics: object // Performance characteristics
  organization_id: string // Multi-tenant isolation
  created_at: Date // Creation timestamp
  updated_at: Date // Last update timestamp
  created_by: string // Creator identifier
}

// Universal integration weaving pattern
export interface IntegrationWeave {
  id: string // Unique integration identifier
  smart_code: string // HERA.VIBE.INTEGRATION.{PATTERN}.{TYPE}.v1
  source_component: string // Source component smart code
  target_component: string // Target component smart code
  weave_pattern: string // Integration pattern type
  compatibility_matrix: object // Compatibility verification
  error_recovery: ErrorRecovery // Error handling strategies
  performance_impact: object // Performance considerations
  rollback_strategy: object // Rollback mechanisms
  health_status: 'healthy' | 'warning' | 'unhealthy' // Integration health
  organization_id: string // Multi-tenant context
  created_at: Date // Creation timestamp
  last_validated: Date // Last health check
}

// Code evolution tracking
export interface CodeEvolution {
  timestamp: Date // When change occurred
  change_type: 'creation' | 'modification' | 'deletion' | 'integration' // Type of change
  description: string // What changed
  author: string // Who made the change
  context: object // Why change was made
  smart_code: string // Smart code at time of change
  version: string // Component version
  impact_assessment: object // Change impact analysis
}

// Usage pattern tracking
export interface UsagePattern {
  pattern_type: 'initialization' | 'operation' | 'integration' | 'error_handling' // Pattern category
  frequency: number // How often used
  context: object // When typically used
  parameters: object // Common parameters
  outcomes: object // Typical results
  recommendations: string[] // Best practices
  last_used: Date // Last usage timestamp
}

// Self-testing capabilities
export interface TestScenario {
  scenario_name: string // Test scenario identifier
  test_type: 'unit' | 'integration' | 'performance' | 'security' // Test category
  description: string // What is being tested
  setup_steps: string[] // Test setup requirements
  execution_steps: string[] // Test execution steps
  expected_outcomes: object // Expected results
  success_criteria: object // Pass/fail criteria
  last_executed: Date // Last test execution
  success_rate: number // Historical success rate
}

// Error recovery strategies
export interface ErrorRecovery {
  strategy_type: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' // Recovery type
  trigger_conditions: object // When to activate
  recovery_steps: string[] // How to recover
  fallback_options: string[] // Alternative approaches
  monitoring_points: string[] // What to monitor
  escalation_rules: object // When to escalate
  success_indicators: object // Recovery success metrics
}

// Session management
export interface VibeSession {
  session_id: string // Unique session identifier
  organization_id: string // Organization context
  start_time: Date // Session start time
  context_count: number // Number of contexts preserved
  integration_count: number // Number of integrations created
  quality_score: number // Average quality score
  user_id?: string // Optional user identifier
  metadata?: object // Additional session data
}

// Smart code registry entry
export interface SmartCodeEntry {
  smart_code: string // The smart code identifier
  component_id: string // Associated component ID
  registration_date: Date // When registered
  usage_count: number // How many times used
  integration_count: number // How many integrations
  quality_score: number // Current quality score
  status: 'active' | 'deprecated' | 'experimental' // Entry status
  organization_id: string // Multi-tenant context
}

// Context preservation request
export interface ContextPreservationRequest {
  context: Partial<VibeContext> // Context to preserve
  preservation_type: 'session' | 'permanent' | 'backup' // How long to keep
  priority: 'low' | 'medium' | 'high' | 'critical' // Importance level
  metadata?: object // Additional preservation data
}

// Integration creation request
export interface IntegrationRequest {
  source_smart_code: string // Source component
  target_smart_code: string // Target component
  pattern_type: string // Integration pattern
  configuration?: object // Optional configuration
  validation_rules?: object // Custom validation rules
  performance_requirements?: object // Performance expectations
}

// Manufacturing quality metrics
export interface QualityMetrics {
  smart_code_compliance: number // Smart code format compliance
  integration_health: number // Integration health score
  documentation_quality: number // Self-documentation completeness
  performance_score: number // Performance characteristics
  security_compliance: number // Security pattern adherence
  overall_score: number // Combined quality score
  measurement_time: Date // When measured
  recommendations: string[] // Improvement suggestions
}

// Universal pattern definitions
export interface UniversalPattern {
  pattern_name: string // Pattern identifier
  category: 'memory' | 'weaving' | 'recovery' | 'evolution' | 'quality' // Pattern type
  smart_code: string // Pattern smart code
  description: string // What pattern does
  implementation: object // How to implement
  usage_guidelines: string[] // When to use
  compatibility: string[] // Compatible patterns
  performance_impact: object // Performance considerations
}

// Vibe engine configuration
export interface VibeEngineConfig {
  organization_id: string // Organization context
  session_config: {
    auto_preserve: boolean // Automatically preserve context
    preservation_interval: number // How often to preserve (ms)
    max_context_age: number // Max context age (ms)
  }
  quality_config: {
    min_quality_score: number // Minimum acceptable quality
    auto_validation: boolean // Automatically validate components
    validation_interval: number // How often to validate (ms)
  }
  integration_config: {
    auto_weaving: boolean // Automatically create integrations
    compatibility_checking: boolean // Check compatibility before integration
    health_monitoring: boolean // Monitor integration health
  }
}

// Error types for vibe system
export class VibeError extends Error {
  constructor(
    message: string,
    public smart_code: string,
    public context?: object
  ) {
    super(message)
    this.name = 'VibeError'
  }
}

export class ContextPreservationError extends VibeError {
  constructor(message: string, context?: object) {
    super(message, 'HERA.VIBE.ERROR.CONTEXT.PRESERVATION.v1', context)
    this.name = 'ContextPreservationError'
  }
}

export class IntegrationError extends VibeError {
  constructor(message: string, context?: object) {
    super(message, 'HERA.VIBE.ERROR.INTEGRATION.FAILURE.v1', context)
    this.name = 'IntegrationError'
  }
}

export class QualityValidationError extends VibeError {
  constructor(message: string, context?: object) {
    super(message, 'HERA.VIBE.ERROR.QUALITY.VALIDATION.v1', context)
    this.name = 'QualityValidationError'
  }
}
