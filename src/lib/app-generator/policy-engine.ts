/**
 * HERA Policy Engine v2.4
 * 
 * Implements validation, transform, and matcher rules from YAML configurations
 * Supports: jewelry ERP business rules, bank reconciliation, GST compliance, workflow policies
 * Compatible with complex business applications with sophisticated policy requirements
 */

import { EnhancedAppConfig } from './enhanced-yaml-parser'

// Policy types supported by the engine
export type PolicyType = 
  | 'validation'     // Field and entity validation rules
  | 'transform'      // Data transformation rules  
  | 'matcher'        // Automatic matching rules (bank reconciliation)
  | 'workflow'       // Business workflow rules
  | 'compliance'     // Regulatory compliance rules (GST, tax)
  | 'pricing'        // Dynamic pricing rules
  | 'approval'       // Approval threshold rules
  | 'notification'   // Notification trigger rules

// Policy execution context
export interface PolicyContext {
  actor_user_id: string
  organization_id: string
  entity_type?: string
  transaction_type?: string
  entity_data?: any
  transaction_data?: any
  current_state?: any
  external_data?: any
}

// Policy rule definition
export interface PolicyRule {
  rule_id: string
  rule_name: string
  policy_type: PolicyType
  applies_to: string
  condition: string | PolicyCondition
  action: string | PolicyAction
  priority: number
  is_active: boolean
  smart_code: string
  organization_id: string
  metadata?: {
    description?: string
    examples?: string[]
    created_by?: string
    created_at?: string
    tags?: string[]
  }
}

// Structured condition for complex logic
export interface PolicyCondition {
  operator: 'AND' | 'OR' | 'NOT'
  conditions?: PolicyCondition[]
  field?: string
  comparison?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches' | 'in' | 'exists'
  value?: any
  function?: string
  parameters?: any[]
}

// Structured action for policy execution
export interface PolicyAction {
  type: 'validate' | 'transform' | 'match' | 'approve' | 'reject' | 'notify' | 'calculate' | 'update'
  target?: string
  value?: any
  function?: string
  parameters?: any[]
  error_message?: string
  success_message?: string
}

// Policy execution result
export interface PolicyResult {
  rule_id: string
  rule_name: string
  status: 'success' | 'failure' | 'skipped' | 'error'
  message?: string
  transformed_data?: any
  matched_items?: any[]
  calculated_value?: any
  validation_errors?: string[]
  execution_time_ms: number
  context: PolicyContext
}

export class HERAPolicyEngine {
  private rules: Map<string, PolicyRule> = new Map()
  private executionLog: PolicyResult[] = []
  
  constructor() {
    this.initializeDefaultRules()
  }
  
  /**
   * Load policy rules from YAML configuration
   */
  loadRulesFromYAML(config: EnhancedAppConfig): void {
    // Load global policies
    config.policies?.forEach(policy => {
      const rule = this.convertYAMLPolicyToRule(policy, 'global')
      this.addRule(rule)
    })
    
    // Load transaction-specific policies
    config.transactions?.forEach(transaction => {
      transaction.policies?.forEach(policy => {
        const rule = this.convertYAMLPolicyToRule(policy, transaction.transaction_type)
        this.addRule(rule)
      })
    })
  }
  
  /**
   * Add a policy rule to the engine
   */
  addRule(rule: PolicyRule): void {
    this.rules.set(rule.rule_id, rule)
  }
  
  /**
   * Execute all applicable policies for given context
   */
  async executeAllPolicies(context: PolicyContext): Promise<PolicyResult[]> {
    const results: PolicyResult[] = []
    const applicableRules = this.getApplicableRules(context)
    
    // Sort by priority (higher priority first)
    applicableRules.sort((a, b) => b.priority - a.priority)
    
    for (const rule of applicableRules) {
      const result = await this.executeRule(rule, context)
      results.push(result)
      
      // Stop execution on critical failures
      if (result.status === 'failure' && rule.priority >= 100) {
        break
      }
    }
    
    this.executionLog.push(...results)
    return results
  }
  
  /**
   * Execute specific policy type
   */
  async executePolicyType(policyType: PolicyType, context: PolicyContext): Promise<PolicyResult[]> {
    const rules = Array.from(this.rules.values()).filter(rule => 
      rule.policy_type === policyType && 
      rule.is_active &&
      this.ruleAppliesTo(rule, context)
    )
    
    const results: PolicyResult[] = []
    for (const rule of rules) {
      const result = await this.executeRule(rule, context)
      results.push(result)
    }
    
    return results
  }
  
  /**
   * Execute a single policy rule
   */
  private async executeRule(rule: PolicyRule, context: PolicyContext): Promise<PolicyResult> {
    const startTime = Date.now()
    
    try {
      // Check if condition is met
      const conditionMet = await this.evaluateCondition(rule.condition, context)
      
      if (!conditionMet) {
        return {
          rule_id: rule.rule_id,
          rule_name: rule.rule_name,
          status: 'skipped',
          message: 'Condition not met',
          execution_time_ms: Date.now() - startTime,
          context
        }
      }
      
      // Execute action
      const actionResult = await this.executeAction(rule.action, context)
      
      return {
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        status: actionResult.success ? 'success' : 'failure',
        message: actionResult.message,
        transformed_data: actionResult.transformed_data,
        matched_items: actionResult.matched_items,
        calculated_value: actionResult.calculated_value,
        validation_errors: actionResult.validation_errors,
        execution_time_ms: Date.now() - startTime,
        context
      }
    } catch (error) {
      return {
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime,
        context
      }
    }
  }
  
  /**
   * Evaluate policy condition
   */
  private async evaluateCondition(condition: string | PolicyCondition, context: PolicyContext): Promise<boolean> {
    if (typeof condition === 'string') {
      // Simple string condition - use function evaluation
      return this.evaluateStringCondition(condition, context)
    }
    
    return this.evaluateStructuredCondition(condition, context)
  }
  
  private evaluateStringCondition(condition: string, context: PolicyContext): boolean {
    // Handle common condition patterns
    try {
      // Replace context variables
      const processedCondition = condition
        .replace(/\$\{([^}]+)\}/g, (match, path) => {
          return this.getValueFromPath(context, path)
        })
      
      // Evaluate as JavaScript expression (in controlled environment)
      return this.safeEvaluate(processedCondition, context)
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error)
      return false
    }
  }
  
  private async evaluateStructuredCondition(condition: PolicyCondition, context: PolicyContext): Promise<boolean> {
    switch (condition.operator) {
      case 'AND':
        if (!condition.conditions) return true
        return Promise.all(
          condition.conditions.map(c => this.evaluateStructuredCondition(c, context))
        ).then(results => results.every(r => r))
        
      case 'OR':
        if (!condition.conditions) return false
        return Promise.all(
          condition.conditions.map(c => this.evaluateStructuredCondition(c, context))
        ).then(results => results.some(r => r))
        
      case 'NOT':
        if (!condition.conditions || condition.conditions.length === 0) return true
        return this.evaluateStructuredCondition(condition.conditions[0], context)
          .then(result => !result)
        
      default:
        // Direct field comparison
        if (!condition.field || !condition.comparison) return false
        
        const fieldValue = this.getValueFromPath(context, condition.field)
        return this.compareValues(fieldValue, condition.comparison, condition.value)
    }
  }
  
  /**
   * Execute policy action
   */
  private async executeAction(action: string | PolicyAction, context: PolicyContext): Promise<{
    success: boolean
    message?: string
    transformed_data?: any
    matched_items?: any[]
    calculated_value?: any
    validation_errors?: string[]
  }> {
    if (typeof action === 'string') {
      return this.executeStringAction(action, context)
    }
    
    return this.executeStructuredAction(action, context)
  }
  
  private async executeStringAction(action: string, context: PolicyContext): Promise<any> {
    // Handle function-style actions
    if (action.includes('(')) {
      const functionMatch = action.match(/^(\w+)\((.*)\)$/)
      if (functionMatch) {
        const [, functionName, argsString] = functionMatch
        const args = argsString.split(',').map(arg => arg.trim().replace(/['"]/g, ''))
        return this.executeFunction(functionName, args, context)
      }
    }
    
    // Handle assignment-style actions
    if (action.includes('=')) {
      const [target, valueExpr] = action.split('=').map(s => s.trim())
      const value = this.evaluateExpression(valueExpr, context)
      return {
        success: true,
        transformed_data: { [target]: value },
        message: `Set ${target} to ${value}`
      }
    }
    
    return { success: false, message: `Unknown action: ${action}` }
  }
  
  private async executeStructuredAction(action: PolicyAction, context: PolicyContext): Promise<any> {
    switch (action.type) {
      case 'validate':
        return this.executeValidation(action, context)
        
      case 'transform':
        return this.executeTransformation(action, context)
        
      case 'match':
        return this.executeMatching(action, context)
        
      case 'calculate':
        return this.executeCalculation(action, context)
        
      case 'approve':
      case 'reject':
        return this.executeApproval(action, context)
        
      case 'notify':
        return this.executeNotification(action, context)
        
      case 'update':
        return this.executeUpdate(action, context)
        
      default:
        return { success: false, message: `Unknown action type: ${action.type}` }
    }
  }
  
  /**
   * Specialized action executors
   */
  private executeValidation(action: PolicyAction, context: PolicyContext): any {
    const errors: string[] = []
    
    if (action.target && action.value) {
      const fieldValue = this.getValueFromPath(context, action.target)
      
      // Common validations
      if (action.parameters?.includes('required') && !fieldValue) {
        errors.push(`${action.target} is required`)
      }
      
      if (action.parameters?.includes('email') && fieldValue && !this.isValidEmail(fieldValue)) {
        errors.push(`${action.target} must be a valid email`)
      }
      
      if (action.parameters?.includes('phone') && fieldValue && !this.isValidPhone(fieldValue)) {
        errors.push(`${action.target} must be a valid phone number`)
      }
    }
    
    return {
      success: errors.length === 0,
      validation_errors: errors,
      message: errors.length > 0 ? errors.join(', ') : 'Validation passed'
    }
  }
  
  private executeTransformation(action: PolicyAction, context: PolicyContext): any {
    if (!action.target || !action.function) {
      return { success: false, message: 'Transform action requires target and function' }
    }
    
    const currentValue = this.getValueFromPath(context, action.target)
    let transformedValue: any
    
    switch (action.function) {
      case 'uppercase':
        transformedValue = String(currentValue).toUpperCase()
        break
        
      case 'lowercase':
        transformedValue = String(currentValue).toLowerCase()
        break
        
      case 'round':
        transformedValue = Math.round(Number(currentValue))
        break
        
      case 'format_currency':
        const currency = action.parameters?.[0] || 'USD'
        transformedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(Number(currentValue))
        break
        
      case 'calculate_gst':
        const rate = action.parameters?.[0] || 18 // Default GST rate 18%
        const amount = Number(currentValue)
        transformedValue = amount * (rate / 100)
        break
        
      case 'normalize_gold_weight':
        // Convert various weight units to grams
        const unit = action.parameters?.[0] || 'grams'
        const weight = Number(currentValue)
        switch (unit.toLowerCase()) {
          case 'ounces':
            transformedValue = weight * 28.3495
            break
          case 'tola':
            transformedValue = weight * 11.6638
            break
          default:
            transformedValue = weight
        }
        break
        
      default:
        return { success: false, message: `Unknown transform function: ${action.function}` }
    }
    
    return {
      success: true,
      transformed_data: { [action.target]: transformedValue },
      message: `Transformed ${action.target} from ${currentValue} to ${transformedValue}`
    }
  }
  
  private executeMatching(action: PolicyAction, context: PolicyContext): any {
    // Bank reconciliation matching example
    if (action.function === 'bank_reconciliation') {
      const transactions = context.external_data?.bank_transactions || []
      const erpTransactions = context.entity_data?.transactions || []
      
      const matches: any[] = []
      const tolerance = action.parameters?.[0] || 0.01 // Default tolerance $0.01
      
      transactions.forEach((bankTxn: any) => {
        const match = erpTransactions.find((erpTxn: any) => 
          Math.abs(bankTxn.amount - erpTxn.amount) <= tolerance &&
          this.datesMatch(bankTxn.date, erpTxn.date, 3) // 3 day tolerance
        )
        
        if (match) {
          matches.push({
            bank_transaction: bankTxn,
            erp_transaction: match,
            confidence: this.calculateMatchConfidence(bankTxn, match)
          })
        }
      })
      
      return {
        success: true,
        matched_items: matches,
        message: `Found ${matches.length} potential matches`
      }
    }
    
    return { success: false, message: 'Matching function not implemented' }
  }
  
  private executeCalculation(action: PolicyAction, context: PolicyContext): any {
    if (!action.function) {
      return { success: false, message: 'Calculation requires function' }
    }
    
    let result: any
    
    switch (action.function) {
      case 'gold_price_calculation':
        const weight = this.getValueFromPath(context, 'weight')
        const purity = this.getValueFromPath(context, 'purity') || 24
        const goldRate = context.external_data?.gold_rate || 5000 // Default rate per gram
        
        result = (weight * purity / 24) * goldRate
        break
        
      case 'gst_calculation':
        const amount = this.getValueFromPath(context, 'amount')
        const gstRate = action.parameters?.[0] || 18
        
        result = {
          base_amount: amount,
          gst_amount: amount * (gstRate / 100),
          total_amount: amount * (1 + gstRate / 100)
        }
        break
        
      case 'markup_calculation':
        const cost = this.getValueFromPath(context, 'cost')
        const markupPercent = action.parameters?.[0] || 30
        
        result = {
          cost: cost,
          markup: cost * (markupPercent / 100),
          selling_price: cost * (1 + markupPercent / 100)
        }
        break
        
      default:
        return { success: false, message: `Unknown calculation: ${action.function}` }
    }
    
    return {
      success: true,
      calculated_value: result,
      message: `Calculated ${action.function}: ${JSON.stringify(result)}`
    }
  }
  
  private executeApproval(action: PolicyAction, context: PolicyContext): any {
    const isApproval = action.type === 'approve'
    const amount = this.getValueFromPath(context, 'amount') || 0
    const threshold = action.value || 1000
    
    const requiresApproval = amount > threshold
    
    if (isApproval && requiresApproval) {
      return {
        success: true,
        message: `Approval required for amount ${amount} (threshold: ${threshold})`,
        transformed_data: { requires_approval: true, approval_threshold: threshold }
      }
    }
    
    return {
      success: true,
      message: isApproval ? 'No approval required' : 'Transaction rejected',
      transformed_data: { requires_approval: false }
    }
  }
  
  private executeNotification(action: PolicyAction, context: PolicyContext): any {
    // Placeholder for notification logic
    return {
      success: true,
      message: `Notification sent: ${action.value}`,
      transformed_data: { notification_sent: true }
    }
  }
  
  private executeUpdate(action: PolicyAction, context: PolicyContext): any {
    if (!action.target || action.value === undefined) {
      return { success: false, message: 'Update requires target and value' }
    }
    
    return {
      success: true,
      transformed_data: { [action.target]: action.value },
      message: `Updated ${action.target} to ${action.value}`
    }
  }
  
  // Helper methods
  private getApplicableRules(context: PolicyContext): PolicyRule[] {
    return Array.from(this.rules.values()).filter(rule => 
      rule.is_active && this.ruleAppliesTo(rule, context)
    )
  }
  
  private ruleAppliesTo(rule: PolicyRule, context: PolicyContext): boolean {
    if (rule.applies_to === 'ALL') return true
    if (rule.applies_to === context.entity_type) return true
    if (rule.applies_to === context.transaction_type) return true
    
    return false
  }
  
  private convertYAMLPolicyToRule(yamlPolicy: any, appliesTo: string): PolicyRule {
    return {
      rule_id: `${appliesTo}_${yamlPolicy.policy_type}_${Date.now()}`,
      rule_name: `${appliesTo} ${yamlPolicy.policy_type}`,
      policy_type: yamlPolicy.policy_type as PolicyType,
      applies_to: appliesTo,
      condition: yamlPolicy.rule.condition || 'true',
      action: yamlPolicy.rule.action || yamlPolicy.rule,
      priority: yamlPolicy.rule.priority || 50,
      is_active: true,
      smart_code: `HERA.POLICY.${yamlPolicy.policy_type.toUpperCase()}.${appliesTo.toUpperCase()}.v1`,
      organization_id: '', // Will be set when rule is loaded
      metadata: {
        description: yamlPolicy.rule.description,
        created_by: 'yaml_import',
        created_at: new Date().toISOString()
      }
    }
  }
  
  private getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  private compareValues(value1: any, comparison: string, value2: any): boolean {
    switch (comparison) {
      case 'equals': return value1 === value2
      case 'not_equals': return value1 !== value2
      case 'greater_than': return Number(value1) > Number(value2)
      case 'less_than': return Number(value1) < Number(value2)
      case 'contains': return String(value1).includes(String(value2))
      case 'matches': return new RegExp(value2).test(String(value1))
      case 'in': return Array.isArray(value2) && value2.includes(value1)
      case 'exists': return value1 !== null && value1 !== undefined
      default: return false
    }
  }
  
  private safeEvaluate(expression: string, context: PolicyContext): boolean {
    // Simple safe evaluation - in production, use a proper sandbox
    try {
      // Allow only basic comparison operations
      const safeExpression = expression.replace(/[^a-zA-Z0-9._\s\(\)\>\<\=\!\&\|]/g, '')
      return Function(`"use strict"; return (${safeExpression})`)()
    } catch {
      return false
    }
  }
  
  private evaluateExpression(expression: string, context: PolicyContext): any {
    // Simple expression evaluation
    return expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
      return this.getValueFromPath(context, path)
    })
  }
  
  private executeFunction(functionName: string, args: string[], context: PolicyContext): any {
    // Function registry for policy actions
    switch (functionName) {
      case 'reject':
        return { success: false, message: args[0] || 'Rejected by policy' }
      case 'approve':
        return { success: true, message: args[0] || 'Approved by policy' }
      default:
        return { success: false, message: `Unknown function: ${functionName}` }
    }
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  private isValidPhone(phone: string): boolean {
    return /^\+?[\d\s\-\(\)]{10,}$/.test(phone)
  }
  
  private datesMatch(date1: string, date2: string, toleranceDays: number): boolean {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= toleranceDays
  }
  
  private calculateMatchConfidence(bankTxn: any, erpTxn: any): number {
    let confidence = 0
    
    // Amount match (50% weight)
    if (bankTxn.amount === erpTxn.amount) confidence += 50
    else if (Math.abs(bankTxn.amount - erpTxn.amount) <= 0.01) confidence += 40
    
    // Date match (30% weight)
    if (this.datesMatch(bankTxn.date, erpTxn.date, 0)) confidence += 30
    else if (this.datesMatch(bankTxn.date, erpTxn.date, 1)) confidence += 20
    else if (this.datesMatch(bankTxn.date, erpTxn.date, 3)) confidence += 10
    
    // Description match (20% weight)
    if (bankTxn.description && erpTxn.description) {
      const similarity = this.stringSimilarity(bankTxn.description, erpTxn.description)
      confidence += similarity * 20
    }
    
    return Math.min(confidence, 100)
  }
  
  private stringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.toLowerCase().split(/\s+/))
    const set2 = new Set(str2.toLowerCase().split(/\s+/))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }
  
  private initializeDefaultRules(): void {
    // Add some default HERA policies
    this.addRule({
      rule_id: 'default_entity_validation',
      rule_name: 'Default Entity Validation',
      policy_type: 'validation',
      applies_to: 'ALL',
      condition: 'true',
      action: {
        type: 'validate',
        target: 'entity_name',
        parameters: ['required']
      },
      priority: 10,
      is_active: true,
      smart_code: 'HERA.POLICY.VALIDATION.DEFAULT.v1',
      organization_id: 'ALL'
    })
  }
  
  /**
   * Get execution log
   */
  getExecutionLog(): PolicyResult[] {
    return this.executionLog
  }
  
  /**
   * Clear execution log
   */
  clearExecutionLog(): void {
    this.executionLog = []
  }
  
  /**
   * Get rule by ID
   */
  getRule(ruleId: string): PolicyRule | undefined {
    return this.rules.get(ruleId)
  }
  
  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }
  
  /**
   * Get all rules
   */
  getAllRules(): PolicyRule[] {
    return Array.from(this.rules.values())
  }
}

/**
 * Helper function to create policy engine and load YAML rules
 */
export function createPolicyEngineFromYAML(config: EnhancedAppConfig): HERAPolicyEngine {
  const engine = new HERAPolicyEngine()
  engine.loadRulesFromYAML(config)
  return engine
}

export default HERAPolicyEngine