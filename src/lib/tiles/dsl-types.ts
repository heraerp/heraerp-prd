/**
 * HERA Universal Tile System - DSL Expression Types
 * Defines the Domain Specific Language for dynamic tile conditions
 * Smart Code: HERA.PLATFORM.UI.DSL.TYPES.v1
 */

// ================================================================================
// CONDITION OPERATORS
// ================================================================================

/**
 * Comparison operators for field evaluation
 */
export type ConditionOperator = 
  | 'eq'           // equals
  | 'neq'          // not equals
  | 'gt'           // greater than
  | 'gte'          // greater than or equal
  | 'lt'           // less than
  | 'lte'          // less than or equal
  | 'contains'     // string/array contains
  | 'not_contains' // string/array does not contain
  | 'starts_with'  // string starts with
  | 'ends_with'    // string ends with
  | 'in'           // value is in array
  | 'not_in'       // value is not in array
  | 'is_null'      // field is null
  | 'is_not_null'  // field is not null
  | 'regex'        // matches regular expression
  | 'between'      // value between two values

// ================================================================================
// VALUE TYPES
// ================================================================================

/**
 * Supported value types in conditions
 */
export type ConditionValue = 
  | string
  | number  
  | boolean
  | null
  | Date
  | string[]   // Array of strings
  | number[]   // Array of numbers
  | { start: number | Date; end: number | Date }  // For between operator

/**
 * Dynamic value references (resolved at runtime)
 */
export type DynamicValueRef = 
  | `{{${string}}}`     // Template variable: {{entity_type}}
  | `$user.${string}`   // User context: $user.role, $user.permissions
  | `$org.${string}`    // Organization context: $org.settings, $org.plan  
  | `$env.${string}`    // Environment: $env.NODE_ENV, $env.FEATURE_FLAGS
  | `$now`              // Current timestamp
  | `$today`            // Today's date (start of day)
  | `$week_start`       // Start of current week
  | `$month_start`      // Start of current month
  | `$year_start`       // Start of current year

/**
 * Condition value that can be static or dynamic
 */
export type ConditionValueOrRef = ConditionValue | DynamicValueRef

// ================================================================================
// CONDITION STRUCTURE
// ================================================================================

/**
 * Single condition expression
 */
export interface Condition {
  field: string                          // Field path: 'user.role', 'entity.status'
  operator: ConditionOperator            // Comparison operator
  value: ConditionValueOrRef            // Value to compare against
  description?: string                   // Human-readable description
}

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'all' | 'any' | 'none'

/**
 * Complex condition group with logical operators
 */
export interface ConditionGroup {
  all?: (Condition | ConditionGroup)[]   // AND logic - all must be true
  any?: (Condition | ConditionGroup)[]   // OR logic - any must be true  
  none?: (Condition | ConditionGroup)[]  // NOT logic - none must be true
  description?: string                   // Human-readable description
}

/**
 * Root condition expression (can be simple condition or complex group)
 */
export type ConditionExpression = Condition | ConditionGroup

// ================================================================================
// EVALUATION CONTEXT
// ================================================================================

/**
 * User context for condition evaluation
 */
export interface UserContext {
  id: string
  entity_id: string
  organization_id: string
  role: string
  permissions: string[]
  metadata?: Record<string, any>
  [key: string]: any  // Allow additional user properties
}

/**
 * Organization context for condition evaluation
 */
export interface OrganizationContext {
  id: string
  name: string
  type: string
  plan: string
  settings: Record<string, any>
  features: string[]
  [key: string]: any  // Allow additional org properties
}

/**
 * Environment context for condition evaluation
 */
export interface EnvironmentContext {
  NODE_ENV: 'development' | 'production' | 'test'
  FEATURE_FLAGS: Record<string, boolean>
  [key: string]: any  // Allow additional environment variables
}

/**
 * Template variables for condition evaluation
 */
export interface TemplateVariables {
  entity_type?: string
  transaction_type?: string
  relationship_type?: string
  analytics_category?: string
  workspace_type?: string
  user_id?: string
  organization_id?: string
  [key: string]: any  // Allow additional template variables
}

/**
 * Complete evaluation context
 */
export interface EvaluationContext {
  user: UserContext
  organization: OrganizationContext
  environment: EnvironmentContext
  templates: TemplateVariables
  data?: Record<string, any>  // Additional data context
}

// ================================================================================
// QUERY DSL FOR STATS
// ================================================================================

/**
 * Database operation types for stats queries
 */
export type QueryOperation = 
  | 'count'         // Count records
  | 'sum'           // Sum numeric field
  | 'avg'           // Average of numeric field  
  | 'min'           // Minimum value
  | 'max'           // Maximum value
  | 'custom'        // Custom SQL query

/**
 * Query definition for tile statistics
 */
export interface StatsQuery {
  table: string                          // Source table name
  operation: QueryOperation              // Type of operation
  field?: string                         // Field to operate on (for sum/avg/min/max)
  custom_query?: string                 // Custom SQL (for operation: 'custom')
  conditions: ConditionGroup            // Filter conditions
  group_by?: string[]                   // Group by fields
  order_by?: { field: string; direction: 'ASC' | 'DESC' }[]
  limit?: number                        // Result limit
}

// ================================================================================
// ACTION DSL
// ================================================================================

/**
 * Action types supported by tiles
 */
export type ActionType = 
  | 'NAVIGATE'      // Navigate to URL/route
  | 'MODAL'         // Open modal component
  | 'API_CALL'      // Make API request
  | 'CUSTOM'        // Custom action handler

/**
 * Action definition with conditional visibility
 */
export interface TileAction {
  action_id: string                     // Unique identifier
  label: string                         // Display label
  action_type: ActionType              // Type of action
  icon?: string                        // Icon name (lucide-react)
  is_primary: boolean                  // Primary action styling
  visibility_when: ConditionGroup     // When action should be visible
  
  // Action type specific config
  route_template?: string              // For NAVIGATE: URL template
  modal_component?: string             // For MODAL: component name
  api_endpoint?: string                // For API_CALL: endpoint URL
  api_method?: 'GET' | 'POST' | 'PUT' | 'DELETE'  // For API_CALL
  custom_handler?: string              // For CUSTOM: handler function name
  
  // Additional configuration
  confirmation?: {
    title: string
    message: string
    confirm_text?: string
    cancel_text?: string
  }
}

// ================================================================================
// TILE STAT DEFINITIONS
// ================================================================================

/**
 * Format types for displaying statistics
 */
export type StatFormat = 
  | 'number'        // Plain number: 1,234
  | 'currency'      // Currency: $1,234.56
  | 'percentage'    // Percentage: 45.6%
  | 'duration'      // Duration: 2h 30m
  | 'date'          // Date: Nov 13, 2024
  | 'relative_time' // Relative: 2 hours ago

/**
 * Statistic definition for tiles
 */
export interface TileStat {
  stat_id: string                      // Unique identifier
  label: string                        // Display label
  query: StatsQuery                   // Query definition
  format: StatFormat | string         // Display format (can be template)
  is_primary: boolean                 // Primary stat styling
  icon?: string                       // Icon name
  color?: string                      // Color theme
  trend?: {
    comparison_query: StatsQuery      // Query for comparison value
    improvement_direction: 'higher' | 'lower'  // What direction is good
  }
}

// ================================================================================
// VALIDATION HELPERS
// ================================================================================

/**
 * Type guards for condition expressions
 */
export function isCondition(expr: ConditionExpression): expr is Condition {
  return 'field' in expr && 'operator' in expr && 'value' in expr
}

export function isConditionGroup(expr: ConditionExpression): expr is ConditionGroup {
  return 'all' in expr || 'any' in expr || 'none' in expr
}

/**
 * Type guard for dynamic value references
 */
export function isDynamicValueRef(value: ConditionValueOrRef): value is DynamicValueRef {
  return typeof value === 'string' && (
    value.startsWith('{{') || 
    value.startsWith('$user.') || 
    value.startsWith('$org.') ||
    value.startsWith('$env.') ||
    value === '$now' ||
    value === '$today' ||
    value === '$week_start' ||
    value === '$month_start' ||
    value === '$year_start'
  )
}

// ================================================================================
// EXAMPLE EXPRESSIONS
// ================================================================================

/**
 * Example condition expressions for reference
 */
export const EXAMPLE_CONDITIONS = {
  // Simple condition
  userIsAdmin: {
    field: 'user.role',
    operator: 'eq' as const,
    value: 'admin'
  },

  // Complex condition group
  canCreateEntities: {
    all: [
      {
        field: 'user.permissions',
        operator: 'contains' as const,
        value: 'entity.create'
      },
      {
        any: [
          {
            field: 'user.role',
            operator: 'in' as const,
            value: ['admin', 'manager']
          },
          {
            field: 'org.plan',
            operator: 'neq' as const,
            value: 'free'
          }
        ]
      }
    ]
  },

  // Dynamic value references
  recentEntities: {
    all: [
      {
        field: 'entity_type',
        operator: 'eq' as const,
        value: '{{entity_type}}'
      },
      {
        field: 'created_at',
        operator: 'gte' as const,
        value: '$week_start' as const
      }
    ]
  }
} satisfies Record<string, ConditionExpression>

export default {
  // Export types for external use
  type: {} as {
    ConditionOperator: ConditionOperator
    ConditionValue: ConditionValue
    DynamicValueRef: DynamicValueRef
    ConditionValueOrRef: ConditionValueOrRef
    Condition: Condition
    ConditionGroup: ConditionGroup
    ConditionExpression: ConditionExpression
    EvaluationContext: EvaluationContext
    StatsQuery: StatsQuery
    TileAction: TileAction
    TileStat: TileStat
  }
}