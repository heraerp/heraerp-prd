/**
 * HERA Universal Tile System - DSL Expression Evaluator
 * Evaluates condition expressions with dynamic context resolution
 * Smart Code: HERA.PLATFORM.UI.DSL.EVALUATOR.v1
 */

import { 
  ConditionExpression, 
  Condition, 
  ConditionGroup, 
  ConditionOperator,
  ConditionValueOrRef,
  DynamicValueRef,
  EvaluationContext,
  isCondition,
  isConditionGroup,
  isDynamicValueRef
} from './dsl-types'

// ================================================================================
// DYNAMIC VALUE RESOLUTION
// ================================================================================

/**
 * Resolve dynamic value references to actual values
 */
export function resolveDynamicValue(
  valueRef: DynamicValueRef, 
  context: EvaluationContext
): any {
  // Template variables: {{entity_type}}
  if (valueRef.startsWith('{{') && valueRef.endsWith('}}')) {
    const key = valueRef.slice(2, -2)
    return context.templates[key] ?? null
  }

  // User context: $user.role
  if (valueRef.startsWith('$user.')) {
    const path = valueRef.slice(6) // Remove '$user.'
    return getNestedValue(context.user, path)
  }

  // Organization context: $org.plan  
  if (valueRef.startsWith('$org.')) {
    const path = valueRef.slice(5) // Remove '$org.'
    return getNestedValue(context.organization, path)
  }

  // Environment context: $env.NODE_ENV
  if (valueRef.startsWith('$env.')) {
    const path = valueRef.slice(5) // Remove '$env.'
    return getNestedValue(context.environment, path)
  }

  // Time/date references
  const now = new Date()
  
  switch (valueRef) {
    case '$now':
      return now.toISOString()
    
    case '$today':
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      return today.toISOString()
    
    case '$week_start':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return weekStart.toISOString()
    
    case '$month_start':
      const monthStart = new Date(now)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      return monthStart.toISOString()
    
    case '$year_start':
      const yearStart = new Date(now)
      yearStart.setMonth(0, 1)
      yearStart.setHours(0, 0, 0, 0)
      return yearStart.toISOString()
    
    default:
      console.warn(`Unknown dynamic value reference: ${valueRef}`)
      return null
  }
}

/**
 * Get nested property value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key]
  }, obj)
}

/**
 * Resolve condition value (static or dynamic)
 */
export function resolveConditionValue(
  value: ConditionValueOrRef,
  context: EvaluationContext
): any {
  if (isDynamicValueRef(value)) {
    return resolveDynamicValue(value, context)
  }
  return value
}

// ================================================================================
// CONDITION EVALUATION
// ================================================================================

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: Condition, 
  context: EvaluationContext,
  data?: Record<string, any>
): boolean {
  try {
    // Get field value from context or data
    const fieldValue = getFieldValue(condition.field, context, data)
    
    // Resolve condition value
    const conditionValue = resolveConditionValue(condition.value, context)
    
    // Evaluate based on operator
    return evaluateOperator(
      fieldValue, 
      condition.operator, 
      conditionValue
    )
  } catch (error) {
    console.error(`Error evaluating condition:`, {
      condition,
      error: error instanceof Error ? error.message : error
    })
    return false
  }
}

/**
 * Get field value from evaluation context or data
 */
function getFieldValue(
  fieldPath: string, 
  context: EvaluationContext, 
  data?: Record<string, any>
): any {
  // Try data object first
  if (data) {
    const dataValue = getNestedValue(data, fieldPath)
    if (dataValue !== undefined) {
      return dataValue
    }
  }

  // Try context paths
  if (fieldPath.startsWith('user.')) {
    return getNestedValue(context.user, fieldPath.slice(5))
  }
  
  if (fieldPath.startsWith('org.') || fieldPath.startsWith('organization.')) {
    const path = fieldPath.startsWith('org.') ? fieldPath.slice(4) : fieldPath.slice(13)
    return getNestedValue(context.organization, path)
  }
  
  if (fieldPath.startsWith('env.') || fieldPath.startsWith('environment.')) {
    const path = fieldPath.startsWith('env.') ? fieldPath.slice(4) : fieldPath.slice(12)
    return getNestedValue(context.environment, path)
  }

  // Try templates
  if (context.templates[fieldPath] !== undefined) {
    return context.templates[fieldPath]
  }

  return undefined
}

/**
 * Evaluate comparison operation
 */
function evaluateOperator(
  fieldValue: any, 
  operator: ConditionOperator, 
  conditionValue: any
): boolean {
  switch (operator) {
    case 'eq':
      return fieldValue === conditionValue

    case 'neq':
      return fieldValue !== conditionValue

    case 'gt':
      return fieldValue > conditionValue

    case 'gte':
      return fieldValue >= conditionValue

    case 'lt':
      return fieldValue < conditionValue

    case 'lte':
      return fieldValue <= conditionValue

    case 'contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.includes(conditionValue)
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(conditionValue)
      }
      return false

    case 'not_contains':
      return !evaluateOperator(fieldValue, 'contains', conditionValue)

    case 'starts_with':
      return typeof fieldValue === 'string' && 
             typeof conditionValue === 'string' &&
             fieldValue.startsWith(conditionValue)

    case 'ends_with':
      return typeof fieldValue === 'string' && 
             typeof conditionValue === 'string' &&
             fieldValue.endsWith(conditionValue)

    case 'in':
      return Array.isArray(conditionValue) && 
             conditionValue.includes(fieldValue)

    case 'not_in':
      return Array.isArray(conditionValue) && 
             !conditionValue.includes(fieldValue)

    case 'is_null':
      return fieldValue === null || fieldValue === undefined

    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined

    case 'regex':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        try {
          const regex = new RegExp(conditionValue)
          return regex.test(fieldValue)
        } catch {
          return false
        }
      }
      return false

    case 'between':
      if (typeof conditionValue === 'object' && 
          conditionValue !== null &&
          'start' in conditionValue && 
          'end' in conditionValue) {
        return fieldValue >= conditionValue.start && 
               fieldValue <= conditionValue.end
      }
      return false

    default:
      console.error(`Unknown operator: ${operator}`)
      return false
  }
}

// ================================================================================
// CONDITION GROUP EVALUATION
// ================================================================================

/**
 * Evaluate a condition group with logical operators
 */
export function evaluateConditionGroup(
  group: ConditionGroup, 
  context: EvaluationContext,
  data?: Record<string, any>
): boolean {
  try {
    // Handle 'all' logic (AND)
    if (group.all && Array.isArray(group.all)) {
      return group.all.every(expr => 
        evaluateConditionExpression(expr, context, data)
      )
    }

    // Handle 'any' logic (OR)
    if (group.any && Array.isArray(group.any)) {
      return group.any.some(expr => 
        evaluateConditionExpression(expr, context, data)
      )
    }

    // Handle 'none' logic (NOT)
    if (group.none && Array.isArray(group.none)) {
      return !group.none.some(expr => 
        evaluateConditionExpression(expr, context, data)
      )
    }

    // Empty group defaults to true
    return true
    
  } catch (error) {
    console.error(`Error evaluating condition group:`, {
      group,
      error: error instanceof Error ? error.message : error
    })
    return false
  }
}

// ================================================================================
// MAIN EVALUATION FUNCTION
// ================================================================================

/**
 * Evaluate any condition expression (condition or group)
 */
export function evaluateConditionExpression(
  expression: ConditionExpression, 
  context: EvaluationContext,
  data?: Record<string, any>
): boolean {
  if (isCondition(expression)) {
    return evaluateCondition(expression, context, data)
  }
  
  if (isConditionGroup(expression)) {
    return evaluateConditionGroup(expression, context, data)
  }
  
  console.error('Invalid condition expression:', expression)
  return false
}

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

/**
 * Validate condition expression structure
 */
export function validateConditionExpression(
  expression: ConditionExpression
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    validateExpressionRecursive(expression, errors, 0)
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : error}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function validateExpressionRecursive(
  expression: ConditionExpression, 
  errors: string[], 
  depth: number
): void {
  if (depth > 10) {
    errors.push('Expression nesting too deep (max 10 levels)')
    return
  }

  if (isCondition(expression)) {
    validateCondition(expression, errors)
  } else if (isConditionGroup(expression)) {
    validateConditionGroup(expression, errors, depth)
  } else {
    errors.push('Invalid expression: must be Condition or ConditionGroup')
  }
}

function validateCondition(condition: Condition, errors: string[]): void {
  if (!condition.field) {
    errors.push('Condition missing required field')
  }
  
  if (!condition.operator) {
    errors.push('Condition missing required operator')
  }
  
  if (condition.value === undefined) {
    errors.push('Condition missing required value')
  }

  // Validate operator-specific requirements
  if (condition.operator === 'between' && 
      typeof condition.value === 'object' &&
      condition.value !== null) {
    const betweenValue = condition.value as any
    if (!('start' in betweenValue) || !('end' in betweenValue)) {
      errors.push('Between operator requires value with start and end properties')
    }
  }
}

function validateConditionGroup(
  group: ConditionGroup, 
  errors: string[], 
  depth: number
): void {
  const logicalKeys = ['all', 'any', 'none']
  const presentKeys = logicalKeys.filter(key => key in group)
  
  if (presentKeys.length === 0) {
    errors.push('ConditionGroup must have at least one logical operator (all, any, none)')
    return
  }
  
  if (presentKeys.length > 1) {
    errors.push('ConditionGroup cannot have multiple logical operators')
    return
  }

  // Validate nested expressions
  presentKeys.forEach(key => {
    const expressions = group[key as keyof ConditionGroup]
    if (Array.isArray(expressions)) {
      expressions.forEach(expr => {
        validateExpressionRecursive(expr, errors, depth + 1)
      })
    }
  })
}

/**
 * Create a basic evaluation context for testing
 */
export function createTestContext(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    user: {
      id: 'test-user-id',
      entity_id: 'test-user-entity-id', 
      organization_id: 'test-org-id',
      role: 'admin',
      permissions: ['entity.read', 'entity.create', 'entity.update'],
      ...overrides.user
    },
    organization: {
      id: 'test-org-id',
      name: 'Test Organization',
      type: 'BUSINESS',
      plan: 'pro',
      settings: { timezone: 'UTC' },
      features: ['advanced_analytics', 'custom_fields'],
      ...overrides.organization
    },
    environment: {
      NODE_ENV: 'development',
      FEATURE_FLAGS: { new_ui: true, beta_features: false },
      ...overrides.environment
    },
    templates: {
      entity_type: 'CUSTOMER',
      organization_id: 'test-org-id',
      user_id: 'test-user-id',
      ...overrides.templates
    },
    data: overrides.data
  }
}

// Export everything
export {
  // Re-export types for convenience
  type ConditionExpression,
  type Condition,
  type ConditionGroup,
  type EvaluationContext
}