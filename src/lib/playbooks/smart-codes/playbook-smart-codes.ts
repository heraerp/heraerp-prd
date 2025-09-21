/**
 * HERA Playbooks Smart Code Generator and Validator
 *
 * Provides smart code generation, validation, and management
 * for all playbook-related entities following HERA patterns.
 */

export interface SmartCodeComponents {
  prefix: 'HERA'
  industry: string
  module: string
  type: string
  subtype: string
  version: string
}

export interface SmartCodeValidationResult {
  valid: boolean
  components?: SmartCodeComponents
  errors?: string[]
  suggestions?: string[]
}

export interface SmartCodeGenerationOptions {
  industry: string
  module: string
  type: string
  subtype: string
  version?: string
  autoIncrement?: boolean
}

/**
 * Playbook Smart Code Patterns
 */
export const PLAYBOOK_SMART_CODE_PATTERNS = {
  // Playbook Definitions
  PLAYBOOK_DEFINITION: 'HERA.{INDUSTRY}.PLAYBOOK.DEF.{NAME}.V{VERSION}',

  // Step Definitions
  STEP_DEFINITION: 'HERA.{INDUSTRY}.PLAYBOOK.STEP.{NAME}.V{VERSION}',

  // Playbook Runs
  PLAYBOOK_RUN: 'HERA.{INDUSTRY}.PLAYBOOK.RUN.{NAME}.V{VERSION}',

  // Step Executions
  STEP_EXECUTION: 'HERA.{INDUSTRY}.PLAYBOOK.STEP.EXEC.{NAME}.V{VERSION}',

  // Contracts
  INPUT_CONTRACT: 'HERA.PLAYBOOK.CONTRACT.INPUT.SCHEMA.V{VERSION}',
  OUTPUT_CONTRACT: 'HERA.PLAYBOOK.CONTRACT.OUTPUT.SCHEMA.V{VERSION}',
  STEP_INPUT_CONTRACT: 'HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V{VERSION}',
  STEP_OUTPUT_CONTRACT: 'HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V{VERSION}',

  // Policies
  SLA_POLICY: 'HERA.PLAYBOOK.POLICY.SLA.V{VERSION}',
  QUORUM_POLICY: 'HERA.PLAYBOOK.POLICY.QUORUM.V{VERSION}',
  SEGREGATION_POLICY: 'HERA.PLAYBOOK.POLICY.SEGREGATION.V{VERSION}',
  APPROVAL_POLICY: 'HERA.PLAYBOOK.POLICY.APPROVAL.V{VERSION}',
  RETRY_POLICY: 'HERA.PLAYBOOK.POLICY.RETRY.V{VERSION}',

  // Relationships
  PLAYBOOK_CONTAINS_STEP: 'HERA.PLAYBOOK.CONTAINS.STEP.V{VERSION}',
  STEP_FOLLOWS_STEP: 'HERA.PLAYBOOK.STEP.FOLLOWS.STEP.V{VERSION}',
  RUN_EXECUTES_STEP: 'HERA.PLAYBOOK.RUN.EXECUTES.STEP.V{VERSION}',

  // Compliance & Audit
  COMPLIANCE_AUDIT: 'HERA.PLAYBOOK.COMPLIANCE.{EVENT}.V{VERSION}',
  VALIDATION_RESULT: 'HERA.PLAYBOOK.VALIDATION.{TYPE}.V{VERSION}'
} as const

/**
 * Industry-specific smart code mappings
 */
export const INDUSTRY_CODES = {
  PUBLICSECTOR: 'PUBLICSECTOR',
  HEALTHCARE: 'HEALTHCARE',
  FINANCE: 'FINANCE',
  EDUCATION: 'EDUCATION',
  MANUFACTURING: 'MANUFACTURING',
  RETAIL: 'RETAIL',
  TECHNOLOGY: 'TECHNOLOGY',
  NONPROFIT: 'NONPROFIT',
  CONSULTING: 'CONSULTING',
  LEGAL: 'LEGAL'
} as const

/**
 * Module-specific codes
 */
export const MODULE_CODES = {
  // Public Sector
  GRANTS: 'GRANTS',
  PERMITS: 'PERMITS',
  LICENSING: 'LICENSING',
  PROCUREMENT: 'PROCUREMENT',
  COMPLIANCE: 'COMPLIANCE',

  // Healthcare
  PATIENT: 'PATIENT',
  CLINICAL: 'CLINICAL',
  BILLING: 'BILLING',
  PHARMACY: 'PHARMACY',
  RESEARCH: 'RESEARCH',

  // Finance
  LENDING: 'LENDING',
  INVESTMENT: 'INVESTMENT',
  RISK: 'RISK',
  AUDIT: 'AUDIT',
  REGULATORY: 'REGULATORY',

  // Generic
  WORKFLOW: 'WORKFLOW',
  APPROVAL: 'APPROVAL',
  REVIEW: 'REVIEW',
  PROCESSING: 'PROCESSING'
} as const

/**
 * Playbook Smart Code Generator and Validator
 */
export class PlaybookSmartCodeService {
  /**
   * Generate smart code for playbook definition
   */
  generatePlaybookDefinitionCode(options: {
    industry: string
    module: string
    name: string
    version?: string
  }): string {
    const version = options.version || '1'
    const name = this.normalizeCodeComponent(options.name)

    return `HERA.${options.industry}.PLAYBOOK.DEF.${name}.V${version}`
  }

  /**
   * Generate smart code for step definition
   */
  generateStepDefinitionCode(options: {
    industry: string
    module: string
    stepName: string
    version?: string
  }): string {
    const version = options.version || '1'
    const stepName = this.normalizeCodeComponent(options.stepName)

    return `HERA.${options.industry}.PLAYBOOK.STEP.${stepName}.V${version}`
  }

  /**
   * Generate smart code for playbook run
   */
  generatePlaybookRunCode(options: {
    industry: string
    module: string
    name: string
    version?: string
  }): string {
    const version = options.version || '1'
    const name = this.normalizeCodeComponent(options.name)

    return `HERA.${options.industry}.PLAYBOOK.RUN.${name}.V${version}`
  }

  /**
   * Generate smart code for step execution
   */
  generateStepExecutionCode(options: {
    industry: string
    module: string
    stepName: string
    version?: string
  }): string {
    const version = options.version || '1'
    const stepName = this.normalizeCodeComponent(options.stepName)

    return `HERA.${options.industry}.PLAYBOOK.STEP.EXEC.${stepName}.V${version}`
  }

  /**
   * Generate contract smart codes
   */
  generateContractCode(
    contractType: 'input' | 'output' | 'step_input' | 'step_output',
    version = '1'
  ): string {
    const patterns = {
      input: `HERA.PLAYBOOK.CONTRACT.INPUT.SCHEMA.V${version}`,
      output: `HERA.PLAYBOOK.CONTRACT.OUTPUT.SCHEMA.V${version}`,
      step_input: `HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V${version}`,
      step_output: `HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V${version}`
    }

    return patterns[contractType]
  }

  /**
   * Generate policy smart codes
   */
  generatePolicyCode(
    policyType: 'sla' | 'quorum' | 'segregation' | 'approval' | 'retry',
    version = '1'
  ): string {
    const policyTypeUpper = policyType.toUpperCase()
    return `HERA.PLAYBOOK.POLICY.${policyTypeUpper}.V${version}`
  }

  /**
   * Generate relationship smart codes
   */
  generateRelationshipCode(relationshipType: string, version = '1'): string {
    const normalized = this.normalizeCodeComponent(relationshipType)
    return `HERA.PLAYBOOK.${normalized}.V${version}`
  }

  /**
   * Generate compliance audit smart codes
   */
  generateComplianceCode(eventType: string, version = '1'): string {
    const eventUpper = eventType.toUpperCase()
    return `HERA.PLAYBOOK.COMPLIANCE.${eventUpper}.V${version}`
  }

  /**
   * Validate smart code format and components
   */
  validateSmartCode(smartCode: string): SmartCodeValidationResult {
    const errors: string[] = []
    const suggestions: string[] = []

    // Basic format validation
    if (!smartCode) {
      return {
        valid: false,
        errors: ['Smart code cannot be empty']
      }
    }

    // Split into components
    const parts = smartCode.split('.')

    // Check minimum structure
    if (parts.length < 4) {
      errors.push('Smart code must have at least 4 components (HERA.INDUSTRY.MODULE.TYPE)')
    }

    // Validate prefix
    if (parts[0] !== 'HERA') {
      errors.push('Smart code must start with "HERA"')
      suggestions.push('Use "HERA" as the first component')
    }

    // Validate version pattern
    const lastPart = parts[parts.length - 1]
    if (!lastPart.match(/^V\d+$/)) {
      errors.push('Smart code must end with version pattern (V1, V2, etc.)')
      suggestions.push('Add version suffix like ".V1"')
    }

    // Check for valid industry
    if (parts.length > 1) {
      const industry = parts[1]
      if (!Object.values(INDUSTRY_CODES).includes(industry as any)) {
        suggestions.push(
          `Consider using standard industry codes: ${Object.values(INDUSTRY_CODES).join(', ')}`
        )
      }
    }

    // Check for playbook-specific patterns
    if (parts.length > 2 && parts[2] === 'PLAYBOOK') {
      const isValidPattern = this.validatePlaybookPattern(parts)
      if (!isValidPattern.valid) {
        errors.push(...isValidPattern.errors)
        suggestions.push(...isValidPattern.suggestions)
      }
    }

    // Build components if valid structure
    let components: SmartCodeComponents | undefined
    if (parts.length >= 5) {
      components = {
        prefix: parts[0] as 'HERA',
        industry: parts[1],
        module: parts[2],
        type: parts[3],
        subtype: parts.slice(4, -1).join('.'),
        version: lastPart.substring(1) // Remove 'V' prefix
      }
    }

    return {
      valid: errors.length === 0,
      components,
      errors: errors.length > 0 ? errors : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    }
  }

  /**
   * Parse smart code into components
   */
  parseSmartCode(smartCode: string): SmartCodeComponents | null {
    const validation = this.validateSmartCode(smartCode)
    return validation.components || null
  }

  /**
   * Check if smart code is playbook-related
   */
  isPlaybookSmartCode(smartCode: string): boolean {
    const parts = smartCode.split('.')
    return parts.length > 2 && parts[2] === 'PLAYBOOK'
  }

  /**
   * Get smart code category
   */
  getSmartCodeCategory(smartCode: string): string | null {
    const parts = smartCode.split('.')

    if (parts.length < 4) return null

    if (parts[2] === 'PLAYBOOK') {
      if (parts[3] === 'DEF') return 'playbook_definition'
      if (parts[3] === 'RUN') return 'playbook_run'
      if (parts[3] === 'STEP') return 'step_definition'
      if (parts[3] === 'CONTRACT') return 'contract'
      if (parts[3] === 'POLICY') return 'policy'
      if (parts[3] === 'COMPLIANCE') return 'compliance'
    }

    return 'unknown'
  }

  /**
   * Generate next version of smart code
   */
  generateNextVersion(smartCode: string): string {
    const parts = smartCode.split('.')
    const lastPart = parts[parts.length - 1]

    if (lastPart.match(/^V(\d+)$/)) {
      const currentVersion = parseInt(lastPart.substring(1))
      const nextVersion = currentVersion + 1
      parts[parts.length - 1] = `V${nextVersion}`
      return parts.join('.')
    }

    return smartCode + '.V1'
  }

  /**
   * Get available smart code templates
   */
  getSmartCodeTemplates(): Record<string, string> {
    return {
      // Definitions
      'playbook-definition': 'HERA.{INDUSTRY}.PLAYBOOK.DEF.{NAME}.V1',
      'step-definition': 'HERA.{INDUSTRY}.PLAYBOOK.STEP.{NAME}.V1',

      // Runtime
      'playbook-run': 'HERA.{INDUSTRY}.PLAYBOOK.RUN.{NAME}.V1',
      'step-execution': 'HERA.{INDUSTRY}.PLAYBOOK.STEP.EXEC.{NAME}.V1',

      // Contracts
      'input-contract': 'HERA.PLAYBOOK.CONTRACT.INPUT.SCHEMA.V1',
      'output-contract': 'HERA.PLAYBOOK.CONTRACT.OUTPUT.SCHEMA.V1',
      'step-input-contract': 'HERA.PLAYBOOK.CONTRACT.STEP.INPUT.V1',
      'step-output-contract': 'HERA.PLAYBOOK.CONTRACT.STEP.OUTPUT.V1',

      // Policies
      'sla-policy': 'HERA.PLAYBOOK.POLICY.SLA.V1',
      'quorum-policy': 'HERA.PLAYBOOK.POLICY.QUORUM.V1',
      'segregation-policy': 'HERA.PLAYBOOK.POLICY.SEGREGATION.V1',
      'approval-policy': 'HERA.PLAYBOOK.POLICY.APPROVAL.V1',
      'retry-policy': 'HERA.PLAYBOOK.POLICY.RETRY.V1',

      // Relationships
      'contains-step': 'HERA.PLAYBOOK.CONTAINS.STEP.V1',
      'follows-step': 'HERA.PLAYBOOK.STEP.FOLLOWS.STEP.V1',
      'executes-step': 'HERA.PLAYBOOK.RUN.EXECUTES.STEP.V1',

      // Compliance
      'compliance-audit': 'HERA.PLAYBOOK.COMPLIANCE.{EVENT}.V1',
      'validation-result': 'HERA.PLAYBOOK.VALIDATION.{TYPE}.V1'
    }
  }

  // Private helper methods

  private normalizeCodeComponent(component: string): string {
    return component
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .replace(/\s+/g, '')
  }

  private validatePlaybookPattern(parts: string[]): {
    valid: boolean
    errors: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const suggestions: string[] = []

    if (parts.length < 5) {
      errors.push('Playbook smart codes must have at least 5 components')
      return { valid: false, errors, suggestions }
    }

    const type = parts[3]
    const validTypes = ['DEF', 'RUN', 'STEP', 'CONTRACT', 'POLICY', 'COMPLIANCE']

    if (!validTypes.includes(type)) {
      errors.push(`Invalid playbook type "${type}". Valid types: ${validTypes.join(', ')}`)
      suggestions.push('Use DEF for definitions, RUN for executions, STEP for step definitions')
    }

    // Type-specific validation
    if (type === 'STEP' && parts.length > 4) {
      const stepType = parts[4]
      const validStepTypes = ['EXEC'] // Add more as needed

      if (parts.length > 5 && !validStepTypes.includes(stepType)) {
        suggestions.push('Step codes typically use EXEC for executions')
      }
    }

    if (type === 'CONTRACT' && parts.length > 4) {
      const contractTypes = ['INPUT', 'OUTPUT']
      const contractType = parts[4]

      if (!contractTypes.includes(contractType)) {
        suggestions.push('Contract codes should specify INPUT or OUTPUT')
      }
    }

    if (type === 'POLICY' && parts.length > 4) {
      const policyTypes = ['SLA', 'QUORUM', 'SEGREGATION', 'APPROVAL', 'RETRY']
      const policyType = parts[4]

      if (!policyTypes.includes(policyType)) {
        suggestions.push(`Policy type should be one of: ${policyTypes.join(', ')}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions
    }
  }
}

// Singleton instance
export const playbookSmartCodeService = new PlaybookSmartCodeService()

/**
 * Utility functions for common smart code operations
 */
export const PlaybookSmartCodes = {
  // Quick generators
  forPlaybookDefinition: (industry: string, name: string, version = '1') =>
    playbookSmartCodeService.generatePlaybookDefinitionCode({
      industry,
      module: 'PLAYBOOK',
      name,
      version
    }),

  forStepDefinition: (industry: string, stepName: string, version = '1') =>
    playbookSmartCodeService.generateStepDefinitionCode({
      industry,
      module: 'PLAYBOOK',
      stepName,
      version
    }),

  forPlaybookRun: (industry: string, name: string, version = '1') =>
    playbookSmartCodeService.generatePlaybookRunCode({
      industry,
      module: 'PLAYBOOK',
      name,
      version
    }),

  forStepExecution: (industry: string, stepName: string, version = '1') =>
    playbookSmartCodeService.generateStepExecutionCode({
      industry,
      module: 'PLAYBOOK',
      stepName,
      version
    }),

  forContract: (type: 'input' | 'output' | 'step_input' | 'step_output', version = '1') =>
    playbookSmartCodeService.generateContractCode(type, version),

  forPolicy: (type: 'sla' | 'quorum' | 'segregation' | 'approval' | 'retry', version = '1') =>
    playbookSmartCodeService.generatePolicyCode(type, version),

  forCompliance: (eventType: string, version = '1') =>
    playbookSmartCodeService.generateComplianceCode(eventType, version),

  // Validation
  validate: (smartCode: string) => playbookSmartCodeService.validateSmartCode(smartCode),

  // Parsing
  parse: (smartCode: string) => playbookSmartCodeService.parseSmartCode(smartCode),

  // Category detection
  getCategory: (smartCode: string) => playbookSmartCodeService.getSmartCodeCategory(smartCode),

  // Versioning
  nextVersion: (smartCode: string) => playbookSmartCodeService.generateNextVersion(smartCode),

  // Templates
  getTemplates: () => playbookSmartCodeService.getSmartCodeTemplates(),

  // Constant smart codes for common operations
  EXECUTION: {
    RUN_START: 'HERA.PLAYBOOK.EXECUTION.RUN.START.V1',
    RUN_COMPLETE: 'HERA.PLAYBOOK.EXECUTION.RUN.COMPLETE.V1',
    RUN_FAIL: 'HERA.PLAYBOOK.EXECUTION.RUN.FAIL.V1',
    STEP_START: 'HERA.PLAYBOOK.EXECUTION.STEP.START.V1',
    STEP_COMPLETE: 'HERA.PLAYBOOK.EXECUTION.STEP.COMPLETE.V1',
    STEP_FAIL: 'HERA.PLAYBOOK.EXECUTION.STEP.FAIL.V1',
    STEP_SKIP: 'HERA.PLAYBOOK.EXECUTION.STEP.SKIP.V1',
    STEP_READY: 'HERA.PLAYBOOK.EXECUTION.STEP.READY.V1',
    SYSTEM_RESULT: 'HERA.PLAYBOOK.EXECUTION.SYSTEM.RESULT.V1',
    HUMAN_RESULT: 'HERA.PLAYBOOK.EXECUTION.HUMAN.RESULT.V1',
    AI_RESULT: 'HERA.PLAYBOOK.EXECUTION.AI.RESULT.V1',
    EXTERNAL_RESULT: 'HERA.PLAYBOOK.EXECUTION.EXTERNAL.RESULT.V1',
    SIGNAL: 'HERA.PLAYBOOK.EXECUTION.SIGNAL.V1',
    ERROR: 'HERA.PLAYBOOK.EXECUTION.ERROR.V1'
  },

  SECURITY: {
    PERMISSION_CHECK: 'HERA.PLAYBOOK.SECURITY.PERMISSION_CHECK.V1',
    PERMISSION_ERROR: 'HERA.PLAYBOOK.SECURITY.PERMISSION_ERROR.V1',
    ACCESS_GRANTED: 'HERA.PLAYBOOK.SECURITY.ACCESS_GRANTED.V1',
    ACCESS_DENIED: 'HERA.PLAYBOOK.SECURITY.ACCESS_DENIED.V1'
  },

  IDEMPOTENCY: {
    RECORD: 'HERA.PLAYBOOK.IDEMPOTENCY.RECORD.V1',
    DUPLICATE: 'HERA.PLAYBOOK.IDEMPOTENCY.DUPLICATE.V1',
    CLEANUP: 'HERA.PLAYBOOK.IDEMPOTENCY.CLEANUP.V1',
    ERROR: 'HERA.PLAYBOOK.IDEMPOTENCY.ERROR.V1'
  }
}
