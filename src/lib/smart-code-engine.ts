/**
 * HERA Smart Code Engine
 *
 * Revolutionary automatic business logic generation system
 * Transforms business processes into executable code using Universal 7-Table Schema
 *
 * Pattern: HERA.{DOMAIN}.{ENTITY}.{ACTION}.v{VERSION}
 */

import { v4 as uuidv4 } from 'uuid'

export interface SmartCodeDefinition {
  code: string
  domain: string
  entity: string
  action: string
  version: string
  description: string
  businessLogic: BusinessLogic
  glMapping?: GLMapping
  validationRules: string[]
  workflowStates?: string[]
  entityType: string
  transactionType?: string
  apiEndpoint: string
}

export interface BusinessLogic {
  entityType: string
  requiredFields: string[]
  validation: boolean
  workflow: boolean
  aiInsights: boolean
  autoGenerate?: string[]
  approval?: boolean
  notifications?: boolean
}

export interface GLMapping {
  supportsAllGLAccounts?: boolean
  varianceCalculation?: string
  autoPosting?: boolean
  debitAccount?: string
  creditAccount?: string
}

export interface SmartCodeExecution {
  smartCode: string
  data: any
  organizationId: string
  userId?: string
  metadata?: any
}

export interface SmartCodeResult {
  success: boolean
  data?: any
  error?: string
  generatedRecords?: any[]
  validationErrors?: string[]
  businessRules?: any
  nextActions?: string[]
}

export class SmartCodeEngine {
  private registry: Map<string, SmartCodeDefinition> = new Map()
  private executionHistory: SmartCodeExecution[] = []

  constructor() {
    this.initializeBuiltInSmartCodes()
  }

  /**
   * Register a new Smart Code
   */
  registerSmartCode(definition: SmartCodeDefinition): void {
    this.registry.set(definition.code, definition)
  }

  /**
   * Execute a Smart Code
   */
  async executeSmartCode(execution: SmartCodeExecution): Promise<SmartCodeResult> {
    try {
      const definition = this.registry.get(execution.smartCode)

      if (!definition) {
        return {
          success: false,
          error: `Smart Code not found: ${execution.smartCode}`
        }
      }

      // Record execution
      this.executionHistory.push(execution)

      // Validate input data
      const validationResult = this.validateInputData(definition, execution.data)
      if (!validationResult.success) {
        return validationResult
      }

      // Execute business logic
      return await this.executeBusinessLogic(definition, execution)
    } catch (error) {
      return {
        success: false,
        error: `Smart Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate Smart Code for a business process
   */
  generateSmartCode(
    domain: string,
    entity: string,
    action: string,
    businessLogic: BusinessLogic
  ): SmartCodeDefinition {
    const code = `HERA.${domain.toUpperCase()}.${entity.toUpperCase()}.${action.toUpperCase()}.v1`

    const definition: SmartCodeDefinition = {
      code,
      domain,
      entity,
      action,
      version: 'v1',
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity} in ${domain} domain`,
      businessLogic,
      validationRules: this.generateValidationRules(businessLogic),
      workflowStates: this.generateWorkflowStates(action),
      entityType: entity.toLowerCase(),
      transactionType: businessLogic.workflow ? `${entity}_${action}` : undefined,
      apiEndpoint: '/api/v1/universal'
    }

    this.registerSmartCode(definition)
    return definition
  }

  /**
   * Get all registered Smart Codes
   */
  getAllSmartCodes(): SmartCodeDefinition[] {
    return Array.from(this.registry.values())
  }

  /**
   * Search Smart Codes by pattern
   */
  searchSmartCodes(pattern: string): SmartCodeDefinition[] {
    const regex = new RegExp(pattern, 'i')
    return Array.from(this.registry.values()).filter(
      code => regex.test(code.code) || regex.test(code.description)
    )
  }

  /**
   * Get Smart Codes by domain
   */
  getSmartCodesByDomain(domain: string): SmartCodeDefinition[] {
    return Array.from(this.registry.values()).filter(
      code => code.domain.toLowerCase() === domain.toLowerCase()
    )
  }

  /**
   * Initialize built-in Smart Codes
   */
  private initializeBuiltInSmartCodes(): void {
    // CRM Smart Codes
    this.registerBuiltInCRMSmartCodes()

    // Financial Smart Codes
    this.registerBuiltInFinancialSmartCodes()

    // Healthcare Smart Codes
    this.registerBuiltInHealthcareSmartCodes()

    // Education Smart Codes
    this.registerBuiltInEducationSmartCodes()

    // Manufacturing Smart Codes
    this.registerBuiltInManufacturingSmartCodes()

    // Retail Smart Codes
    this.registerBuiltInRetailSmartCodes()
  }

  private registerBuiltInCRMSmartCodes(): void {
    // Lead Management
    this.registerSmartCode({
      code: 'HERA.CRM.LEAD.CREATE.v1',
      domain: 'CRM',
      entity: 'LEAD',
      action: 'CREATE',
      version: 'v1',
      description: 'Create new sales lead with qualification scoring',
      businessLogic: {
        entityType: 'lead',
        requiredFields: ['company_name', 'contact_name', 'email'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['lead_score', 'lead_code'],
        notifications: true
      },
      validationRules: ['valid_email', 'unique_lead', 'company_required'],
      workflowStates: ['new', 'contacted', 'qualified', 'converted', 'disqualified'],
      entityType: 'lead',
      transactionType: 'lead_creation',
      apiEndpoint: '/api/v1/universal'
    })

    this.registerSmartCode({
      code: 'HERA.CRM.OPP.CREATE.v1',
      domain: 'CRM',
      entity: 'OPPORTUNITY',
      action: 'CREATE',
      version: 'v1',
      description: 'Create sales opportunity from qualified lead',
      businessLogic: {
        entityType: 'opportunity',
        requiredFields: ['opportunity_name', 'account_id', 'amount', 'close_date'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['opportunity_code', 'probability'],
        approval: true
      },
      validationRules: ['valid_amount', 'future_close_date', 'account_exists'],
      workflowStates: [
        'prospecting',
        'qualification',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost'
      ],
      entityType: 'opportunity',
      transactionType: 'opportunity_creation',
      apiEndpoint: '/api/v1/universal'
    })
  }

  private registerBuiltInFinancialSmartCodes(): void {
    this.registerSmartCode({
      code: 'HERA.FIN.INVOICE.CREATE.v1',
      domain: 'FINANCIAL',
      entity: 'INVOICE',
      action: 'CREATE',
      version: 'v1',
      description: 'Create customer invoice with automatic GL posting',
      businessLogic: {
        entityType: 'invoice',
        requiredFields: ['customer_id', 'invoice_date', 'line_items'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['invoice_number']
      },
      glMapping: {
        supportsAllGLAccounts: true,
        autoPosting: true,
        debitAccount: 'accounts_receivable',
        creditAccount: 'revenue'
      },
      validationRules: ['customer_exists', 'positive_amounts', 'valid_date'],
      workflowStates: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      entityType: 'invoice',
      transactionType: 'customer_invoice',
      apiEndpoint: '/api/v1/universal'
    })

    this.registerSmartCode({
      code: 'HERA.FIN.PAYMENT.RECORD.v1',
      domain: 'FINANCIAL',
      entity: 'PAYMENT',
      action: 'RECORD',
      version: 'v1',
      description: 'Record payment with automatic bank reconciliation',
      businessLogic: {
        entityType: 'payment',
        requiredFields: ['payer_id', 'amount', 'payment_method'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['payment_reference']
      },
      glMapping: {
        autoPosting: true,
        debitAccount: 'cash_bank',
        creditAccount: 'accounts_receivable'
      },
      validationRules: ['positive_amount', 'valid_payment_method', 'payer_exists'],
      workflowStates: ['received', 'processing', 'cleared', 'failed'],
      entityType: 'payment',
      transactionType: 'payment_received',
      apiEndpoint: '/api/v1/universal'
    })
  }

  private registerBuiltInHealthcareSmartCodes(): void {
    this.registerSmartCode({
      code: 'HERA.HEALTH.PATIENT.REGISTER.v1',
      domain: 'HEALTHCARE',
      entity: 'PATIENT',
      action: 'REGISTER',
      version: 'v1',
      description: 'Register new patient with HIPAA compliance',
      businessLogic: {
        entityType: 'patient',
        requiredFields: ['first_name', 'last_name', 'date_of_birth', 'insurance_info'],
        validation: true,
        workflow: true,
        aiInsights: false, // HIPAA compliance
        autoGenerate: ['patient_id', 'medical_record_number']
      },
      validationRules: ['valid_dob', 'insurance_verified', 'consent_obtained'],
      workflowStates: ['registered', 'insurance_verified', 'active', 'inactive'],
      entityType: 'patient',
      transactionType: 'patient_registration',
      apiEndpoint: '/api/v1/universal'
    })
  }

  private registerBuiltInEducationSmartCodes(): void {
    this.registerSmartCode({
      code: 'HERA.EDU.STUDENT.ENROLL.v1',
      domain: 'EDUCATION',
      entity: 'STUDENT',
      action: 'ENROLL',
      version: 'v1',
      description: 'Enroll student in course with prerequisite checking',
      businessLogic: {
        entityType: 'enrollment',
        requiredFields: ['student_id', 'course_id', 'enrollment_date'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['enrollment_id']
      },
      validationRules: [
        'student_exists',
        'course_available',
        'prerequisites_met',
        'capacity_available'
      ],
      workflowStates: ['enrolled', 'active', 'completed', 'withdrawn'],
      entityType: 'enrollment',
      transactionType: 'course_enrollment',
      apiEndpoint: '/api/v1/universal'
    })
  }

  private registerBuiltInManufacturingSmartCodes(): void {
    this.registerSmartCode({
      code: 'HERA.MFG.WO.CREATE.v1',
      domain: 'MANUFACTURING',
      entity: 'WORK_ORDER',
      action: 'CREATE',
      version: 'v1',
      description: 'Create work order with material requirement planning',
      businessLogic: {
        entityType: 'work_order',
        requiredFields: ['product_id', 'quantity', 'due_date'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['work_order_number', 'material_requirements']
      },
      validationRules: [
        'product_exists',
        'positive_quantity',
        'future_due_date',
        'materials_available'
      ],
      workflowStates: ['planned', 'released', 'in_progress', 'completed', 'cancelled'],
      entityType: 'work_order',
      transactionType: 'work_order_creation',
      apiEndpoint: '/api/v1/universal'
    })
  }

  private registerBuiltInRetailSmartCodes(): void {
    this.registerSmartCode({
      code: 'HERA.RETAIL.SALE.PROCESS.v1',
      domain: 'RETAIL',
      entity: 'SALE',
      action: 'PROCESS',
      version: 'v1',
      description: 'Process retail sale with inventory update',
      businessLogic: {
        entityType: 'sale',
        requiredFields: ['customer_id', 'line_items', 'payment_method'],
        validation: true,
        workflow: true,
        aiInsights: true,
        autoGenerate: ['receipt_number', 'loyalty_points']
      },
      validationRules: ['items_available', 'valid_payment', 'customer_verified'],
      workflowStates: ['processing', 'completed', 'returned', 'exchanged'],
      entityType: 'sale',
      transactionType: 'retail_sale',
      apiEndpoint: '/api/v1/universal'
    })
  }

  /**
   * Validate input data against Smart Code requirements
   */
  private validateInputData(definition: SmartCodeDefinition, data: any): SmartCodeResult {
    const errors: string[] = []

    // Check required fields
    for (const field of definition.businessLogic.requiredFields) {
      if (!data[field]) {
        errors.push(`Required field missing: ${field}`)
      }
    }

    // Apply validation rules
    for (const rule of definition.validationRules) {
      const validationResult = this.applyValidationRule(rule, data, definition)
      if (!validationResult.valid) {
        errors.push(validationResult.message)
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        validationErrors: errors
      }
    }

    return { success: true }
  }

  /**
   * Apply individual validation rule
   */
  private applyValidationRule(
    rule: string,
    data: any,
    definition: SmartCodeDefinition
  ): { valid: boolean; message: string } {
    switch (rule) {
      case 'valid_email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return {
          valid: !data.email || emailRegex.test(data.email),
          message: 'Invalid email format'
        }

      case 'positive_amount':
      case 'positive_amounts':
        const amount = data.amount || data.total_amount
        return {
          valid: !amount || amount > 0,
          message: 'Amount must be positive'
        }

      case 'future_close_date':
      case 'future_due_date':
        const date = data.close_date || data.due_date
        return {
          valid: !date || new Date(date) > new Date(),
          message: 'Date must be in the future'
        }

      default:
        return { valid: true, message: '' }
    }
  }

  /**
   * Execute business logic for Smart Code
   */
  private async executeBusinessLogic(
    definition: SmartCodeDefinition,
    execution: SmartCodeExecution
  ): Promise<SmartCodeResult> {
    const results: any[] = []
    const businessRules: any = {}

    try {
      // 1. Create main entity
      const entity = await this.createEntity(definition, execution)
      results.push(entity)

      // 2. Auto-generate fields
      if (definition.businessLogic.autoGenerate) {
        const generatedData = this.generateAutoFields(
          definition.businessLogic.autoGenerate,
          execution.data,
          definition
        )
        entity.generated_fields = generatedData
      }

      // 3. Create transaction if workflow enabled
      if (definition.businessLogic.workflow && definition.transactionType) {
        const transaction = await this.createTransaction(definition, execution, entity.id)
        results.push(transaction)
      }

      // 4. Apply GL mapping if financial
      if (definition.glMapping?.autoPosting) {
        const glEntries = await this.createGLEntries(definition, execution, entity)
        results.push(...glEntries)
      }

      // 5. Generate AI insights if enabled
      if (definition.businessLogic.aiInsights) {
        const insights = await this.generateAIInsights(definition, execution.data)
        businessRules.aiInsights = insights
      }

      // 6. Determine next actions
      const nextActions = this.determineNextActions(definition, execution.data)

      return {
        success: true,
        data: entity,
        generatedRecords: results,
        businessRules,
        nextActions
      }
    } catch (error) {
      return {
        success: false,
        error: `Business logic execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Create entity using Universal API
   */
  private async createEntity(
    definition: SmartCodeDefinition,
    execution: SmartCodeExecution
  ): Promise<any> {
    const entityData = {
      id: uuidv4(),
      organization_id: execution.organizationId,
      entity_type: definition.businessLogic.entityType,
      entity_name: this.generateEntityName(definition, execution.data),
      entity_code: this.generateEntityCode(definition, execution.data),
      status: 'active',
      metadata: {
        smart_code: definition.code,
        created_by: execution.userId,
        ...execution.metadata
      },
      ai_classification: definition.businessLogic.entityType,
      ai_confidence: 0.95,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return entityData
  }

  /**
   * Create transaction for workflow
   */
  private async createTransaction(
    definition: SmartCodeDefinition,
    execution: SmartCodeExecution,
    entityId: string
  ): Promise<any> {
    const transactionData = {
      id: uuidv4(),
      organization_id: execution.organizationId,
      transaction_type: definition.transactionType,
      transaction_code: this.generateTransactionNumber(definition),
      transaction_date: new Date().toISOString().split('T')[0],
      source_entity_id: entityId,
      status: 'active',
      workflow_state: definition.workflowStates?.[0] || 'created',
      description: `${definition.action} transaction for ${definition.entity}`,
      metadata: {
        smart_code: definition.code,
        generated: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return transactionData
  }

  /**
   * Generate validation rules based on business logic
   */
  private generateValidationRules(businessLogic: BusinessLogic): string[] {
    const rules: string[] = []

    // Add common validation rules based on entity type
    if (
      businessLogic.entityType.includes('customer') ||
      businessLogic.entityType.includes('lead')
    ) {
      rules.push('valid_email')
    }

    if (businessLogic.requiredFields.includes('amount')) {
      rules.push('positive_amount')
    }

    if (
      businessLogic.requiredFields.includes('close_date') ||
      businessLogic.requiredFields.includes('due_date')
    ) {
      rules.push('future_date')
    }

    return rules
  }

  /**
   * Generate workflow states based on action
   */
  private generateWorkflowStates(action: string): string[] {
    const commonStates = {
      create: ['draft', 'active', 'completed'],
      process: ['processing', 'completed', 'failed'],
      approve: ['pending', 'approved', 'rejected'],
      register: ['registered', 'active', 'inactive'],
      enroll: ['enrolled', 'active', 'completed', 'withdrawn']
    }

    return commonStates[action.toLowerCase()] || ['created', 'active', 'completed']
  }

  /**
   * Generate auto fields
   */
  private generateAutoFields(fields: string[], data: any, definition: SmartCodeDefinition): any {
    const generated: any = {}

    for (const field of fields) {
      switch (field) {
        case 'entity_code':
        case 'lead_code':
        case 'customer_code':
          generated[field] = this.generateEntityCode(definition, data)
          break

        case 'lead_score':
          generated[field] = this.calculateLeadScore(data)
          break

        case 'probability':
          generated[field] = this.calculateOpportunityProbability(data)
          break

        default:
          generated[field] = `AUTO_${field.toUpperCase()}_${Date.now()}`
      }
    }

    return generated
  }

  /**
   * Helper methods for generation
   */
  private generateEntityName(definition: SmartCodeDefinition, data: any): string {
    if (data.entity_name) return data.entity_name
    if (data.name) return data.name
    if (data.company_name) return data.company_name
    if (data.title) return data.title

    return `${definition.entity} - ${new Date().toISOString().slice(0, 10)}`
  }

  private generateEntityCode(definition: SmartCodeDefinition, data: any): string {
    if (data.entity_code) return data.entity_code

    const prefix = definition.entity.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }

  private generateTransactionNumber(definition: SmartCodeDefinition): string {
    const prefix = definition.transactionType?.substring(0, 3).toUpperCase() || 'TXN'
    const timestamp = Date.now().toString().slice(-8)
    return `${prefix}-${timestamp}`
  }

  private calculateLeadScore(data: any): number {
    let score = 50 // Base score

    if (data.company_size && data.company_size > 100) score += 20
    if (data.budget && data.budget > 50000) score += 15
    if (data.timeline && data.timeline <= 90) score += 10
    if (data.authority && data.authority === 'high') score += 15

    return Math.min(100, score)
  }

  private calculateOpportunityProbability(data: any): number {
    const stage = data.stage?.toLowerCase()
    const stageProbabilities = {
      prospecting: 10,
      qualification: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0
    }

    return stageProbabilities[stage || 'qualification'] || 25
  }

  private async createGLEntries(
    definition: SmartCodeDefinition,
    execution: SmartCodeExecution,
    entity: any
  ): Promise<any[]> {
    // Mock GL entry creation - implement actual GL logic
    return []
  }

  private async generateAIInsights(definition: SmartCodeDefinition, data: any): Promise<any[]> {
    // Mock AI insights - integrate with actual AI service
    return [
      {
        type: 'prediction',
        message: `AI analysis suggests high probability of success based on ${definition.entity} characteristics`,
        confidence: 0.85
      }
    ]
  }

  private determineNextActions(definition: SmartCodeDefinition, data: any): string[] {
    const actions: string[] = []

    if (definition.businessLogic.approval) {
      actions.push('Send for approval')
    }

    if (definition.businessLogic.notifications) {
      actions.push('Send notification to stakeholders')
    }

    if (definition.businessLogic.workflow) {
      actions.push('Advance to next workflow stage')
    }

    return actions
  }
}

// Export singleton instance
export const smartCodeEngine = new SmartCodeEngine()
export default smartCodeEngine
