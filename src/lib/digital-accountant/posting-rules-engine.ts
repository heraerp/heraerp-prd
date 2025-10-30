/**
 * 🧾 HERA Digital Accountant Posting Rules Engine
 *
 * Smart code-driven GL posting with intelligent rule evaluation
 * Replaces traditional posting configuration tables with dynamic rules
 *
 * Smart Code: HERA.FIN.ACCT.POSTING.ENGINE.V1
 */

import { supabase } from '@/lib/supabase'
import {
  PostingRule,
  PostingCondition,
  PostingAction,
  JournalLine,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ACCOUNTANT_SMART_CODES
} from '@/types/digital-accountant.types'
import { IPostingRulesEngine, IPostingRulesRepository } from './contracts'
import { SQLGuardrailValidator } from './sql-guardrails'

// ================================================================================
// POSTING RULE TEMPLATES
// ================================================================================

/**
 * Built-in posting rules for common business scenarios
 */
export const STANDARD_POSTING_RULES: PostingRule[] = [
  // Sales Order Rule
  {
    id: 'rule-sales-order',
    rule_code: 'SALES_ORDER_POSTING',
    rule_name: 'Sales Order GL Posting',
    priority: 100,
    conditions: [
      { field: 'transaction_type', operator: 'equals', value: 'sale' },
      { field: 'smart_code', operator: 'contains', value: '.SALE.', join_operator: 'AND' }
    ],
    actions: [
      {
        action_type: 'create_journal_line',
        gl_account_code: '1100', // Cash/AR
        debit_credit: 'debit',
        amount_formula: 'transaction.total_amount',
        description_template: 'Sales Order {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.SALE.V1'
      },
      {
        action_type: 'create_journal_line',
        gl_account_code: '4100', // Revenue
        debit_credit: 'credit',
        amount_formula: 'transaction.total_amount / (1 + tax_rate)',
        description_template: 'Revenue from {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.REVENUE.V1'
      },
      {
        action_type: 'create_journal_line',
        gl_account_code: '2250', // Sales Tax Payable
        debit_credit: 'credit',
        amount_formula: 'transaction.total_amount - (transaction.total_amount / (1 + tax_rate))',
        description_template: 'Sales Tax on {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.TAX.V1'
      }
    ],
    smart_code_pattern: 'HERA.*.SALE.*',
    is_active: true,
    metadata: {
      created_by: 'system',
      last_modified: new Date().toISOString(),
      usage_count: 0,
      success_rate: 100
    }
  },

  // Purchase Order Rule
  {
    id: 'rule-purchase-order',
    rule_code: 'PURCHASE_ORDER_POSTING',
    rule_name: 'Purchase Order GL Posting',
    priority: 100,
    conditions: [
      { field: 'transaction_type', operator: 'equals', value: 'purchase' },
      { field: 'smart_code', operator: 'contains', value: '.PUR.', join_operator: 'AND' }
    ],
    actions: [
      {
        action_type: 'create_journal_line',
        gl_account_code: '5100', // Purchases/Expense
        debit_credit: 'debit',
        amount_formula: 'transaction.total_amount / (1 + tax_rate)',
        description_template: 'Purchase {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.PURCHASE.V1'
      },
      {
        action_type: 'create_journal_line',
        gl_account_code: '1300', // Input Tax
        debit_credit: 'debit',
        amount_formula: 'transaction.total_amount - (transaction.total_amount / (1 + tax_rate))',
        description_template: 'Input Tax on {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.INPUT_TAX.V1'
      },
      {
        action_type: 'create_journal_line',
        gl_account_code: '2100', // Accounts Payable
        debit_credit: 'credit',
        amount_formula: 'transaction.total_amount',
        description_template: 'AP - {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.AP.V1'
      }
    ],
    smart_code_pattern: 'HERA.*.PUR.*',
    is_active: true,
    metadata: {
      created_by: 'system',
      last_modified: new Date().toISOString(),
      usage_count: 0,
      success_rate: 100
    }
  },

  // Payment Received Rule
  {
    id: 'rule-payment-received',
    rule_code: 'PAYMENT_RECEIVED_POSTING',
    rule_name: 'Payment Received GL Posting',
    priority: 90,
    conditions: [
      { field: 'transaction_type', operator: 'equals', value: 'payment' },
      {
        field: 'metadata.payment_direction',
        operator: 'equals',
        value: 'inbound',
        join_operator: 'AND'
      }
    ],
    actions: [
      {
        action_type: 'create_journal_line',
        gl_account_code: '1100', // Cash
        debit_credit: 'debit',
        amount_formula: 'transaction.total_amount',
        description_template: 'Payment received {{transaction.reference_number}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.CASH_IN.V1'
      },
      {
        action_type: 'create_journal_line',
        gl_account_code: '1200', // Accounts Receivable
        debit_credit: 'credit',
        amount_formula: 'transaction.total_amount',
        description_template: 'AR reduction {{transaction.reference_number}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.AR_REDUCE.V1'
      }
    ],
    smart_code_pattern: 'HERA.FIN.AR.TXN.RCP.*',
    is_active: true,
    metadata: {
      created_by: 'system',
      last_modified: new Date().toISOString(),
      usage_count: 0,
      success_rate: 100
    }
  },

  // Inventory Receipt Rule
  {
    id: 'rule-inventory-receipt',
    rule_code: 'INVENTORY_RECEIPT_POSTING',
    rule_name: 'Inventory Receipt GL Posting',
    priority: 85,
    conditions: [
      { field: 'transaction_type', operator: 'equals', value: 'goods_receipt' },
      { field: 'smart_code', operator: 'contains', value: '.INV.GR.', join_operator: 'AND' }
    ],
    actions: [
      {
        action_type: 'create_journal_line',
        gl_account_code: '1330', // Inventory
        debit_credit: 'debit',
        amount_formula: 'transaction.total_amount',
        description_template: 'Inventory receipt {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.INV_IN.V1'
      },
      {
        action_type: 'create_journal_line',
        gl_account_code: '2100', // Accounts Payable
        debit_credit: 'credit',
        amount_formula: 'transaction.total_amount',
        description_template: 'AP for inventory {{transaction.transaction_code}}',
        smart_code_template: 'HERA.FIN.GL.JE.AUTO.INV_AP.V1'
      }
    ],
    smart_code_pattern: 'HERA.INV.GR.*',
    is_active: true,
    metadata: {
      created_by: 'system',
      last_modified: new Date().toISOString(),
      usage_count: 0,
      success_rate: 100
    }
  }
]

// ================================================================================
// GL ACCOUNT MAPPING
// ================================================================================

/**
 * Smart code to GL account mappings
 */
export const SMART_CODE_GL_MAPPINGS: Record<string, { debit: string; credit: string }> = {
  // Sales patterns
  'HERA.REST.SALE.ORDER': { debit: '1100', credit: '4110' }, // Restaurant food sales
  'HERA.RETAIL.SALE.POS': { debit: '1100', credit: '4100' }, // Retail sales
  'HERA.SVC.SALE.INVOICE': { debit: '1200', credit: '4200' }, // Service revenue

  // Purchase patterns
  'HERA.INV.PUR.ORDER': { debit: '1330', credit: '2100' }, // Inventory purchase
  'HERA.EXP.PUR.SUPPLIES': { debit: '5200', credit: '2100' }, // Supplies expense

  // Payment patterns
  'HERA.FIN.AR.TXN.RCP': { debit: '1100', credit: '1200' }, // AR receipt
  'HERA.FIN.AP.TXN.PAY': { debit: '2100', credit: '1100' }, // AP payment

  // Inventory patterns
  'HERA.INV.ADJ.COUNT': { debit: '5300', credit: '1330' }, // Inventory adjustment
  'HERA.INV.TRN.MOVE': { debit: '1331', credit: '1330' }, // Location transfer

  // Payroll patterns
  'HERA.HR.PAY.SALARY': { debit: '5400', credit: '2200' }, // Salary expense
  'HERA.HR.PAY.TAX': { debit: '2200', credit: '2250' } // Payroll tax
}

// ================================================================================
// POSTING RULES ENGINE IMPLEMENTATION
// ================================================================================

export class PostingRulesEngine implements IPostingRulesEngine {
  private repository: IPostingRulesRepository
  private guardrailValidator: SQLGuardrailValidator
  private cachedRules: Map<string, PostingRule>
  private organizationId: string
  private userId: string

  constructor(repository: IPostingRulesRepository, organizationId: string, userId: string) {
    this.repository = repository
    this.organizationId = organizationId
    this.userId = userId
    this.guardrailValidator = new SQLGuardrailValidator(organizationId, userId)
    this.cachedRules = new Map()
    this.loadStandardRules()
  }

  /**
   * Load standard rules into cache
   */
  private loadStandardRules(): void {
    STANDARD_POSTING_RULES.forEach(rule => {
      this.cachedRules.set(rule.rule_code, rule)
    })
  }

  /**
   * Evaluate transaction against posting rules
   */
  async evaluateTransaction(transaction: any): Promise<PostingRule[]> {
    const matchingRules: PostingRule[] = []

    // Get all active rules
    const activeRules = await this.getActiveRules()

    // Evaluate each rule
    for (const rule of activeRules) {
      if (await this.evaluateConditions(rule.conditions, transaction)) {
        matchingRules.push(rule)
      }
    }

    // Sort by priority
    matchingRules.sort((a, b) => b.priority - a.priority)

    return matchingRules
  }

  /**
   * Generate journal lines from matching rules
   */
  async generateJournalLines(rules: PostingRule[], transaction: any): Promise<JournalLine[]> {
    const journalLines: JournalLine[] = []
    const processedAccounts = new Set<string>()

    for (const rule of rules) {
      for (const action of rule.actions) {
        if (action.action_type === 'create_journal_line') {
          // Prevent duplicate postings to same account
          const accountKey = `${action.gl_account_code}-${action.debit_credit}`
          if (processedAccounts.has(accountKey)) continue
          processedAccounts.add(accountKey)

          const line = await this.createJournalLineFromAction(action, transaction)
          if (line) {
            journalLines.push(line)
          }
        }
      }
    }

    return journalLines
  }

  /**
   * Import posting rules
   */
  async importRules(rules: PostingRule[]): Promise<void> {
    for (const rule of rules) {
      const validation = await this.validateRule(rule)
      if (validation.is_valid) {
        await this.repository.createRule(rule)
        this.cachedRules.set(rule.rule_code, rule)
      } else {
        throw new Error(
          `Invalid rule ${rule.rule_code}: ${validation.errors.map(e => e.message).join(', ')}`
        )
      }
    }
  }

  /**
   * Export all posting rules
   */
  async exportRules(): Promise<PostingRule[]> {
    const rules: PostingRule[] = []

    // Get from repository
    const activeRules = await this.repository.getActiveRules()
    rules.push(...activeRules)

    // Include standard rules not in repository
    STANDARD_POSTING_RULES.forEach(standardRule => {
      if (!rules.find(r => r.rule_code === standardRule.rule_code)) {
        rules.push(standardRule)
      }
    })

    return rules
  }

  /**
   * Validate posting rule
   */
  async validateRule(rule: PostingRule): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate rule structure
    if (!rule.rule_code || !rule.rule_name) {
      errors.push({
        code: 'RULE_INVALID_STRUCTURE',
        message: 'Rule must have code and name',
        severity: 'error'
      })
    }

    // Validate conditions
    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push({
        code: 'RULE_NO_CONDITIONS',
        message: 'Rule must have at least one condition',
        severity: 'error'
      })
    }

    // Validate actions
    if (!rule.actions || rule.actions.length === 0) {
      errors.push({
        code: 'RULE_NO_ACTIONS',
        message: 'Rule must have at least one action',
        severity: 'error'
      })
    }

    // Validate GL accounts in actions
    for (const action of rule.actions || []) {
      if (action.action_type === 'create_journal_line' && !action.gl_account_code) {
        errors.push({
          code: 'RULE_MISSING_GL_ACCOUNT',
          message: `Action missing GL account code`,
          severity: 'error',
          field: 'actions'
        })
      }
    }

    // Validate smart code pattern
    if (rule.smart_code_pattern && !this.isValidSmartCodePattern(rule.smart_code_pattern)) {
      warnings.push({
        code: 'RULE_INVALID_SMART_CODE_PATTERN',
        message: 'Smart code pattern may not match expected format',
        can_override: true
      })
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      info: []
    }
  }

  /**
   * Map smart code to GL accounts
   */
  async mapSmartCodeToAccounts(smartCode: string): Promise<{ debit: string; credit: string }> {
    // First check exact match
    if (SMART_CODE_GL_MAPPINGS[smartCode]) {
      return SMART_CODE_GL_MAPPINGS[smartCode]
    }

    // Then check pattern match
    const smartCodeBase = smartCode.split('.').slice(0, 4).join('.')
    if (SMART_CODE_GL_MAPPINGS[smartCodeBase]) {
      return SMART_CODE_GL_MAPPINGS[smartCodeBase]
    }

    // Finally check rules for mapping
    const rules = await this.repository.getRulesBySmartCode(smartCode)
    if (rules.length > 0) {
      const rule = rules[0]
      const debitAction = rule.actions.find(a => a.debit_credit === 'debit')
      const creditAction = rule.actions.find(a => a.debit_credit === 'credit')

      if (debitAction?.gl_account_code && creditAction?.gl_account_code) {
        return {
          debit: debitAction.gl_account_code,
          credit: creditAction.gl_account_code
        }
      }
    }

    // Default mapping
    return { debit: '9999', credit: '9999' } // Suspense accounts
  }

  /**
   * Update smart code mapping
   */
  async updateSmartCodeMapping(
    smartCode: string,
    accounts: { debit: string; credit: string }
  ): Promise<void> {
    // Store in dynamic data
    await supabase.from('core_dynamic_data').insert({
      organization_id: this.organizationId,
      entity_id: this.organizationId, // Organization-level setting
      field_name: `gl_mapping_${smartCode}`,
      field_type: 'json',
      field_value_json: accounts,
      smart_code: 'HERA.FIN.GL.MAPPING.V1',
      is_system_field: true
    })

    // Update cache
    SMART_CODE_GL_MAPPINGS[smartCode] = accounts
  }

  // ================================================================================
  // PRIVATE HELPER METHODS
  // ================================================================================

  private async evaluateConditions(
    conditions: PostingCondition[],
    transaction: any
  ): Promise<boolean> {
    let result = true
    let previousOperator: 'AND' | 'OR' = 'AND'

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, transaction)

      if (previousOperator === 'AND') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }

      previousOperator = condition.join_operator || 'AND'
    }

    return result
  }

  private evaluateCondition(condition: PostingCondition, transaction: any): boolean {
    const fieldValue = this.getFieldValue(transaction, condition.field)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value

      case 'contains':
        return String(fieldValue).includes(String(condition.value))

      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)

      case 'less_than':
        return Number(fieldValue) < Number(condition.value)

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)

      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)

      default:
        return false
    }
  }

  private getFieldValue(object: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value = object

    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) break
    }

    return value
  }

  private async createJournalLineFromAction(
    action: PostingAction,
    transaction: any
  ): Promise<JournalLine | null> {
    try {
      // Evaluate amount formula
      const amount = this.evaluateFormula(action.amount_formula, transaction)

      // Process description template
      const description = this.processTemplate(action.description_template, transaction)

      // Get GL account
      const glAccount = await this.getGLAccount(action.gl_account_code)
      if (!glAccount) {
        console.error(`GL account ${action.gl_account_code} not found`)
        return null
      }

      const line: Partial<JournalLine> = {
        gl_account_id: glAccount.id,
        unit_amount: amount, // ✅ Use unit_amount as per database schema
        debit_credit: action.debit_credit, // ✅ Store debit/credit flag separately
        description,
        smart_code: this.processTemplate(action.smart_code_template, transaction),
        metadata: {
          source_document_type: transaction.transaction_type,
          source_document_id: transaction.id,
          debit_amount: action.debit_credit === 'debit' ? amount : 0, // ✅ Keep for compatibility
          credit_amount: action.debit_credit === 'credit' ? amount : 0 // ✅ Keep for compatibility
        }
      }

      return line as JournalLine
    } catch (error) {
      console.error('Error creating journal line from action:', error)
      return null
    }
  }

  private evaluateFormula(formula: string, context: any): number {
    try {
      // Simple formula evaluation (in production, use a proper expression evaluator)
      let expression = formula

      // Replace variables with values
      Object.entries(context).forEach(([key, value]) => {
        expression = expression.replace(new RegExp(`transaction\\.${key}`, 'g'), String(value))
      })

      // Add common variables
      expression = expression.replace(/tax_rate/g, '0.05') // 5% default tax rate

      // Evaluate (WARNING: This is simplified - use proper expression evaluator in production)
      const result = eval(expression)
      return Number(result) || 0
    } catch (error) {
      console.error('Error evaluating formula:', formula, error)
      return 0
    }
  }

  private processTemplate(template: string, context: any): string {
    let result = template

    // Replace {{variable}} patterns
    const matches = template.match(/\{\{([^}]+)\}\}/g) || []

    matches.forEach(match => {
      const variable = match.slice(2, -2)
      const value = this.getFieldValue(context, variable)
      result = result.replace(match, String(value || ''))
    })

    return result
  }

  private async getGLAccount(accountCode: string): Promise<any> {
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'gl_account')
      .eq('entity_code', accountCode)
      .single()

    return error ? null : data
  }

  private async getActiveRules(): Promise<PostingRule[]> {
    const rules: PostingRule[] = []

    // Get from cache
    this.cachedRules.forEach(rule => {
      if (rule.is_active) {
        rules.push(rule)
      }
    })

    // Get from repository
    try {
      const repoRules = await this.repository.getActiveRules()
      repoRules.forEach(rule => {
        if (!rules.find(r => r.rule_code === rule.rule_code)) {
          rules.push(rule)
        }
      })
    } catch (error) {
      console.error('Error getting rules from repository:', error)
    }

    return rules
  }

  private isValidSmartCodePattern(pattern: string): boolean {
    // Check if pattern follows HERA smart code format
    const parts = pattern.split('.')
    return parts.length >= 3 && parts[0] === 'HERA'
  }
}
