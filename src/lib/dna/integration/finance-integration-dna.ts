/**
 * HERA DNA Finance Integration Pattern
 * Universal Finance↔SD↔MM↔HR Integration
 * 
 * Every app (restaurant, salon, ice-cream, etc.) gets automatic
 * financial integration through smart codes and declarative rules
 */

import { SmartCode } from '@/lib/smart-codes/types'

// Universal Event Contract - never changes
export interface UniversalFinanceEvent {
  // Header (universal_transactions)
  organization_id: string
  smart_code: string
  event_time: string
  currency: string
  source_system: string
  origin_txn_id: string
  ai_confidence: number
  metadata?: Record<string, any>
  
  // Lines (universal_transaction_lines)
  lines: UniversalFinanceLine[]
}

export interface UniversalFinanceLine {
  entity_id: string  // COA:120000, CUST:789, etc.
  role: string       // AR, Revenue, Tax Payable, etc.
  dr: number
  cr: number
  relationships?: Record<string, string>
  metadata?: Record<string, any>
}

// Smart Code Registry - Policy as Data
export interface PostingRule {
  smart_code: string
  validations: {
    required_header: string[]
    required_lines: string[]
    fiscal_check?: 'open_period' | 'allow_future' | 'block_past'
  }
  posting_recipe: {
    lines: PostingLineRule[]
  }
  outcomes: {
    auto_post_if: string  // Expression like "ai_confidence >= 0.8"
    else: 'stage_for_review' | 'reject' | 'post_to_suspense'
  }
}

export interface PostingLineRule {
  derive: string  // "DR AR", "CR Revenue"
  from: string    // Path to account derivation
  conditions?: Record<string, any>
}

// Activation Matrix - Per Organization
export interface OrgFinanceConfig {
  modules_enabled: Record<string, boolean>  // SD: true, MM: true, HR: false
  finance_policy: {
    default_coa_id: string
    default_cost_model?: string
    tax_profile_id?: string
    fx_source?: string
  }
  module_overrides?: Record<string, Record<string, string>>
  deactivation_behaviour?: {
    [module: string]: 'suppress_events' | 'post_to_suspense'
    fallback_account?: string
  }
}

// OOTB Smart Code Registry
export const FINANCE_DNA_POSTING_RULES: PostingRule[] = [
  // Sales & Distribution
  {
    smart_code: 'HERA.ERP.SD.Order.Created.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'role'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: []  // No GL impact - commitment only
    },
    outcomes: {
      auto_post_if: 'true',
      else: 'stage_for_review'
    }
  },
  {
    smart_code: 'HERA.ERP.SD.Delivery.PostGI.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { derive: 'DR COGS', from: 'finance.product.cogs_account' },
        { derive: 'CR Inventory', from: 'finance.product.inventory_account' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.8',
      else: 'stage_for_review'
    }
  },
  {
    smart_code: 'HERA.ERP.SD.Invoice.Posted.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { derive: 'DR AR', from: 'finance.customer.ar_control' },
        { derive: 'CR Revenue', from: 'finance.product.revenue_account' },
        { derive: 'CR Tax Payable', from: 'tax.profile.liability_account' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.8',
      else: 'stage_for_review'
    }
  },
  
  // Material Management
  {
    smart_code: 'HERA.ERP.MM.GRN.Posted.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { derive: 'DR Inventory', from: 'finance.material.inventory_account' },
        { derive: 'CR GR/IR', from: 'finance.defaults.grir_account' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.8',
      else: 'stage_for_review'
    }
  },
  {
    smart_code: 'HERA.ERP.MM.Invoice.Posted.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr']
    },
    posting_recipe: {
      lines: [
        { derive: 'DR GR/IR', from: 'finance.defaults.grir_account' },
        { derive: 'CR AP', from: 'finance.vendor.ap_control' },
        { derive: 'CR Tax Payable', from: 'tax.profile.liability_account' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.7',
      else: 'stage_for_review'
    }
  },
  
  // Human Resources
  {
    smart_code: 'HERA.ERP.HR.Payroll.Run.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr']
    },
    posting_recipe: {
      lines: [
        { derive: 'DR Payroll Expense', from: 'finance.employee.cost_center.expense_account' },
        { derive: 'CR Withholdings', from: 'finance.tax.withholding_account' },
        { derive: 'CR Net Pay', from: 'finance.defaults.payroll_liability' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.9',
      else: 'stage_for_review'
    }
  },
  {
    smart_code: 'HERA.ERP.HR.Accrual.MonthEnd.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr']
    },
    posting_recipe: {
      lines: [
        { derive: 'DR Payroll Expense', from: 'finance.defaults.payroll_expense' },
        { derive: 'CR Accrued Liabilities', from: 'finance.defaults.accrued_payroll' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.85',
      else: 'stage_for_review'
    }
  },
  
  // Restaurant-Specific Patterns
  {
    smart_code: 'HERA.RESTAURANT.FOH.ORDER.POSTED.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr']
    },
    posting_recipe: {
      lines: [
        { derive: 'DR Cash/AR', from: 'finance.payment.method.account' },
        { derive: 'CR Food Revenue', from: 'finance.category.revenue_account' },
        { derive: 'CR Tax Payable', from: 'tax.profile.liability_account' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.9',
      else: 'stage_for_review'
    }
  },
  
  // Salon-Specific Patterns
  {
    smart_code: 'HERA.SALON.SALE.SERVICE.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr']
    },
    posting_recipe: {
      lines: [
        { derive: 'DR Cash/AR', from: 'finance.payment.method.account' },
        { derive: 'CR Service Revenue', from: 'finance.service.revenue_account' },
        { derive: 'CR Tax Payable', from: 'tax.profile.liability_account' }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.9',
      else: 'stage_for_review'
    }
  }
]

// Guardrails Library
export class FinanceGuardrails {
  static validateDoubleEntry(lines: UniversalFinanceLine[]): boolean {
    const totalDr = lines.reduce((sum, line) => sum + line.dr, 0)
    const totalCr = lines.reduce((sum, line) => sum + line.cr, 0)
    return Math.abs(totalDr - totalCr) < 0.01  // Allow penny rounding
  }
  
  static validatePeriod(event_time: string, org_config: any): boolean {
    // Check if period is open for posting
    // Implementation depends on fiscal calendar setup
    return true  // Simplified
  }
  
  static generateIdempotencyKey(event: UniversalFinanceEvent): string {
    return `${event.organization_id}:${event.smart_code}:${event.origin_txn_id}`
  }
}

// Account Derivation Engine
export class AccountDerivationEngine {
  static deriveAccount(
    path: string, 
    event: UniversalFinanceEvent,
    masterData: Record<string, any>
  ): string {
    // Path like "finance.customer.ar_control" 
    // Resolves to actual COA account based on master data
    
    const parts = path.split('.')
    let current = masterData
    
    for (const part of parts) {
      current = current?.[part]
      if (!current) {
        throw new Error(`Cannot derive account from path: ${path}`)
      }
    }
    
    return current
  }
}

// Default COA Templates
export const COA_TEMPLATES = {
  restaurant: {
    // Assets
    '110000': { name: 'Cash', type: 'Asset', subtype: 'Current' },
    '120000': { name: 'Accounts Receivable', type: 'Asset', subtype: 'Current' },
    '130000': { name: 'Food Inventory', type: 'Asset', subtype: 'Current' },
    '131000': { name: 'Beverage Inventory', type: 'Asset', subtype: 'Current' },
    
    // Liabilities
    '210000': { name: 'Accounts Payable', type: 'Liability', subtype: 'Current' },
    '210500': { name: 'GR/IR Clearing', type: 'Liability', subtype: 'Current' },
    '220000': { name: 'Sales Tax Payable', type: 'Liability', subtype: 'Current' },
    '230000': { name: 'Payroll Liabilities', type: 'Liability', subtype: 'Current' },
    
    // Revenue
    '400000': { name: 'Food Revenue', type: 'Revenue', subtype: 'Operating' },
    '401000': { name: 'Beverage Revenue', type: 'Revenue', subtype: 'Operating' },
    '402000': { name: 'Delivery Revenue', type: 'Revenue', subtype: 'Operating' },
    
    // COGS
    '500000': { name: 'Food COGS', type: 'Expense', subtype: 'COGS' },
    '501000': { name: 'Beverage COGS', type: 'Expense', subtype: 'COGS' },
    
    // Expenses
    '600000': { name: 'Payroll Expense', type: 'Expense', subtype: 'Operating' },
    '610000': { name: 'Rent Expense', type: 'Expense', subtype: 'Operating' },
    '620000': { name: 'Utilities Expense', type: 'Expense', subtype: 'Operating' }
  },
  
  salon: {
    // Assets
    '110000': { name: 'Cash', type: 'Asset', subtype: 'Current' },
    '120000': { name: 'Accounts Receivable', type: 'Asset', subtype: 'Current' },
    '130000': { name: 'Beauty Supplies Inventory', type: 'Asset', subtype: 'Current' },
    
    // Revenue
    '400000': { name: 'Service Revenue', type: 'Revenue', subtype: 'Operating' },
    '401000': { name: 'Product Sales Revenue', type: 'Revenue', subtype: 'Operating' },
    
    // Similar pattern...
  }
}

// Finance DNA Service
export class FinanceDNAService {
  private orgConfig: OrgFinanceConfig
  private postingRules: Map<string, PostingRule>
  
  constructor(organizationId: string) {
    this.loadOrgConfig(organizationId)
    this.loadPostingRules()
  }
  
  private loadOrgConfig(organizationId: string) {
    // Load from core_organizations.metadata
    // This is the activation matrix and finance policy
  }
  
  private loadPostingRules() {
    // Load from core_dynamic_data or use defaults
    this.postingRules = new Map(
      FINANCE_DNA_POSTING_RULES.map(rule => [rule.smart_code, rule])
    )
  }
  
  async processEvent(event: UniversalFinanceEvent): Promise<{
    success: boolean
    outcome: 'posted' | 'staged' | 'rejected'
    gl_lines?: any[]
    reason?: string
  }> {
    // 1. Module activation check
    const module = this.extractModule(event.smart_code)
    if (!this.orgConfig.modules_enabled[module]) {
      const behavior = this.orgConfig.deactivation_behaviour?.[module]
      if (behavior === 'suppress_events') {
        return { success: true, outcome: 'rejected', reason: 'Module not active' }
      }
      // Otherwise post to suspense...
    }
    
    // 2. Get posting rule
    const rule = this.postingRules.get(event.smart_code)
    if (!rule) {
      return { success: false, outcome: 'rejected', reason: 'Unknown smart code' }
    }
    
    // 3. Validate
    if (!FinanceGuardrails.validateDoubleEntry(event.lines)) {
      return { success: false, outcome: 'rejected', reason: 'Lines do not balance' }
    }
    
    // 4. Derive GL lines
    const glLines = await this.deriveGLLines(event, rule)
    
    // 5. Check auto-post criteria
    const shouldAutoPost = this.evaluateOutcome(event, rule)
    
    if (shouldAutoPost) {
      // Post to GL
      await this.postToGL(glLines)
      return { success: true, outcome: 'posted', gl_lines: glLines }
    } else {
      // Stage for review
      await this.stageForReview(event, glLines, rule)
      return { success: true, outcome: 'staged', gl_lines: glLines }
    }
  }
  
  private extractModule(smartCode: string): string {
    // HERA.ERP.SD.Invoice.Posted.v1 -> SD
    const parts = smartCode.split('.')
    return parts[2] || 'UNKNOWN'
  }
  
  private async deriveGLLines(event: UniversalFinanceEvent, rule: PostingRule) {
    // Implementation to derive GL lines based on posting recipe
    return []
  }
  
  private evaluateOutcome(event: UniversalFinanceEvent, rule: PostingRule): boolean {
    // Evaluate the expression like "ai_confidence >= 0.8"
    return event.ai_confidence >= 0.8
  }
  
  private async postToGL(glLines: any[]) {
    // Post to universal_transactions
  }
  
  private async stageForReview(event: UniversalFinanceEvent, glLines: any[], rule: PostingRule) {
    // Stage for manual review
  }
}

// Export the DNA pattern
export const FINANCE_INTEGRATION_DNA = {
  name: 'HERA.DNA.FINANCE.INTEGRATION.v1',
  description: 'Universal Finance↔SD↔MM↔HR Integration Pattern',
  components: {
    PostingRules: FINANCE_DNA_POSTING_RULES,
    COATemplates: COA_TEMPLATES,
    Guardrails: FinanceGuardrails,
    DerivationEngine: AccountDerivationEngine,
    Service: FinanceDNAService
  }
}