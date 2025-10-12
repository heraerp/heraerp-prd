/**
 * HERA Automatic Claude Integration - Playbook Guardrail System
 * Smart Code: HERA.DNA.PLAYBOOK.CLAUDE.INTEGRATION.V1
 * 
 * REVOLUTIONARY: Automatic integration that intercepts all Claude development
 * requests and applies playbook guardrails BEFORE any coding begins.
 * NO MORE ASSUMPTIONS - Claude always follows HERA standards automatically.
 */

import { heraPlaybookGuardrail, DevelopmentApproach, HERA_ACTUAL_SCHEMA, HERA_FIELD_PLACEMENT_RULES, HERA_SMART_CODE_RULES } from './hera-development-playbook'
import { heraSelfImprovementEngine } from '../evolution/self-improvement-engine'
import { heraAutonomousCoding } from '../core/autonomous-coding-engine'

// ============================================================================
// AUTOMATIC CLAUDE PROMPT INTERCEPTOR
// ============================================================================

export class ClaudePlaybookInterceptor {
  private static instance: ClaudePlaybookInterceptor
  private interceptionHistory: Array<{
    originalPrompt: string
    enhancedPrompt: string
    guardrailsApplied: string[]
    timestamp: string
  }> = []

  private constructor() {}

  static getInstance(): ClaudePlaybookInterceptor {
    if (!ClaudePlaybookInterceptor.instance) {
      ClaudePlaybookInterceptor.instance = new ClaudePlaybookInterceptor()
    }
    return ClaudePlaybookInterceptor.instance
  }

  /**
   * CORE FUNCTION: Intercept and enhance all Claude development prompts
   */
  interceptAndEnhancePrompt(originalPrompt: string): EnhancedPromptResult {
    console.log('🛡️ INTERCEPTING CLAUDE PROMPT FOR GUARDRAIL ENHANCEMENT...')
    
    // Parse the development approach from prompt
    const approach = this.parsePromptToDevelopmentApproach(originalPrompt)
    
    // Validate against playbook guardrails
    const validation = heraPlaybookGuardrail.validateDevelopmentApproach(approach)
    
    // Generate enhanced prompt with guardrails
    const enhancedPrompt = this.generateEnhancedPrompt(originalPrompt, validation, approach)
    
    // Store for learning
    this.storeInterception(originalPrompt, enhancedPrompt, validation)
    
    return {
      originalPrompt,
      enhancedPrompt,
      validation,
      guardrailsApplied: this.extractGuardrailsApplied(validation),
      confidence: validation.confidence,
      schemaCorrections: this.extractSchemaCorrections(validation),
      fieldPlacementCorrections: this.extractFieldPlacementCorrections(validation),
      existingComponentWarnings: this.extractExistingComponentWarnings(validation)
    }
  }

  /**
   * Parse user prompt to understand development approach
   */
  private parsePromptToDevelopmentApproach(prompt: string): DevelopmentApproach {
    const approach: DevelopmentApproach = {
      description: prompt,
      database_fields: {},
      field_placement: {},
      relationships: [],
      smart_codes: [],
      api_endpoints: [],
      components: []
    }

    // Extract database field mentions
    this.extractDatabaseFields(prompt, approach)
    
    // Extract field placement intentions
    this.extractFieldPlacement(prompt, approach)
    
    // Extract relationship patterns
    this.extractRelationships(prompt, approach)
    
    // Extract smart code patterns
    this.extractSmartCodes(prompt, approach)
    
    // Extract API endpoint patterns
    this.extractApiEndpoints(prompt, approach)
    
    // Extract component patterns
    this.extractComponents(prompt, approach)

    return approach
  }

  /**
   * Extract database field assumptions from prompt
   */
  private extractDatabaseFields(prompt: string, approach: DevelopmentApproach): void {
    const lowerPrompt = prompt.toLowerCase()

    // Common field assumption patterns
    const fieldPatterns = {
      'status': ['status', 'active', 'inactive', 'enabled', 'disabled'],
      'user_id': ['user id', 'user_id', 'userid', 'owner'],
      'parent_id': ['parent id', 'parent_id', 'parentid'],
      'transaction_number': ['transaction number', 'transaction_number', 'txn_number'],
      'is_active': ['is active', 'is_active', 'isactive'],
      'deleted_at': ['deleted at', 'deleted_at', 'soft delete']
    }

    Object.entries(fieldPatterns).forEach(([field, patterns]) => {
      if (patterns.some(pattern => lowerPrompt.includes(pattern))) {
        // Detect which table this might be for
        if (lowerPrompt.includes('organization') || lowerPrompt.includes('company')) {
          if (!approach.database_fields!.core_organizations) approach.database_fields!.core_organizations = []
          approach.database_fields!.core_organizations.push(field)
        } else if (lowerPrompt.includes('transaction') || lowerPrompt.includes('payment') || lowerPrompt.includes('sale')) {
          if (!approach.database_fields!.universal_transactions) approach.database_fields!.universal_transactions = []
          approach.database_fields!.universal_transactions.push(field)
        } else if (lowerPrompt.includes('relationship') || lowerPrompt.includes('parent') || lowerPrompt.includes('child')) {
          if (!approach.database_fields!.core_relationships) approach.database_fields!.core_relationships = []
          approach.database_fields!.core_relationships.push(field)
        } else {
          // Default to entities table
          if (!approach.database_fields!.core_entities) approach.database_fields!.core_entities = []
          approach.database_fields!.core_entities.push(field)
        }
      }
    })
  }

  /**
   * Extract field placement assumptions
   */
  private extractFieldPlacement(prompt: string, approach: DevelopmentApproach): void {
    const lowerPrompt = prompt.toLowerCase()

    // Business data that should be in dynamic_data
    HERA_FIELD_PLACEMENT_RULES.DYNAMIC_DATA_FIELDS.forEach(field => {
      if (lowerPrompt.includes(field)) {
        if (lowerPrompt.includes('metadata') || lowerPrompt.includes('meta data')) {
          if (!approach.field_placement!.metadata) approach.field_placement!.metadata = []
          approach.field_placement!.metadata.push(field)
        } else if (lowerPrompt.includes('column') || lowerPrompt.includes('field')) {
          if (!approach.field_placement!.new_columns) approach.field_placement!.new_columns = []
          approach.field_placement!.new_columns.push(field)
        }
      }
    })

    // Status mentions (should be relationships)
    if (lowerPrompt.includes('status') && (lowerPrompt.includes('column') || lowerPrompt.includes('field'))) {
      if (!approach.field_placement!.new_columns) approach.field_placement!.new_columns = []
      approach.field_placement!.new_columns.push('status')
    }
  }

  /**
   * Extract relationship assumptions
   */
  private extractRelationships(prompt: string, approach: DevelopmentApproach): void {
    const lowerPrompt = prompt.toLowerCase()

    // Common relationship patterns
    const relationshipPatterns = [
      { pattern: ['parent', 'child'], type: 'PARENT_OF' },
      { pattern: ['member', 'belongs to'], type: 'MEMBER_OF' },
      { pattern: ['customer', 'client'], type: 'CUSTOMER_OF' },
      { pattern: ['employee', 'staff'], type: 'EMPLOYEE_OF' },
      { pattern: ['status'], type: 'HAS_STATUS' },
      { pattern: ['assigned', 'assignment'], type: 'ASSIGNED_TO' },
      { pattern: ['owns', 'ownership'], type: 'OWNS' }
    ]

    relationshipPatterns.forEach(({ pattern, type }) => {
      if (pattern.some(p => lowerPrompt.includes(p))) {
        approach.relationships!.push({
          from: 'entity',
          to: 'target_entity',
          type
        })
      }
    })
  }

  /**
   * Extract smart code patterns
   */
  private extractSmartCodes(prompt: string, approach: DevelopmentApproach): void {
    // Look for existing smart codes in prompt
    const smartCodeMatches = prompt.match(/HERA\.[A-Z0-9._]+/g) || []
    approach.smart_codes!.push(...smartCodeMatches)

    // Look for lowercase versions that need fixing
    const lowercaseMatches = prompt.match(/hera\.[a-z0-9._]+/g) || []
    approach.smart_codes!.push(...lowercaseMatches)

    // Look for version issues
    const versionIssues = prompt.match(/HERA\.[A-Z0-9._]+\.v\d+/g) || []
    approach.smart_codes!.push(...versionIssues)
  }

  /**
   * Extract API endpoint patterns
   */
  private extractApiEndpoints(prompt: string, approach: DevelopmentApproach): void {
    // Look for API endpoint mentions
    const apiMatches = prompt.match(/\/api\/[^\s\]]+/g) || []
    approach.api_endpoints!.push(...apiMatches)

    // Check for implementation patterns
    if (prompt.toLowerCase().includes('api') && !prompt.toLowerCase().includes('organization_id')) {
      approach.api_implementation = 'missing organization filtering'
    }
  }

  /**
   * Extract component patterns
   */
  private extractComponents(prompt: string, approach: DevelopmentApproach): void {
    const componentPatterns = [
      'component', 'page', 'form', 'table', 'list', 'card', 'modal', 'dialog',
      'dashboard', 'chart', 'graph', 'button', 'input', 'dropdown', 'menu'
    ]

    componentPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b\\w*${pattern}\\w*\\b`, 'gi')
      const matches = prompt.match(regex) || []
      approach.components!.push(...matches)
    })
  }

  /**
   * Generate enhanced prompt with guardrail enforcement
   */
  private generateEnhancedPrompt(originalPrompt: string, validation: any, approach: DevelopmentApproach): string {
    let enhancedPrompt = `🛡️ HERA GUARDRAIL-ENHANCED DEVELOPMENT REQUEST\n\n`
    
    enhancedPrompt += `**ORIGINAL REQUEST**: ${originalPrompt}\n\n`
    
    enhancedPrompt += `**📋 SCHEMA REFERENCE**: For complete field documentation, see:\n`
    enhancedPrompt += `   📖 /docs/schema/hera-sacred-six-schema.yaml (DEFINITIVE REFERENCE)\n\n`
    
    enhancedPrompt += `**🚨 CRITICAL GUARDRAILS - MUST FOLLOW**:\n\n`
    
    // Schema guardrails
    enhancedPrompt += `**1. ACTUAL DATABASE SCHEMA** (NO ASSUMPTIONS):\n`
    Object.entries(HERA_ACTUAL_SCHEMA).forEach(([table, schema]) => {
      enhancedPrompt += `   • ${table}: ${schema.columns.join(', ')}\n`
      if (schema.forbidden_fields && schema.forbidden_fields.length > 0) {
        enhancedPrompt += `     ❌ FORBIDDEN: ${schema.forbidden_fields.join(', ')} (these fields DO NOT EXIST)\n`
      }
    })
    
    // Field placement rules
    enhancedPrompt += `\n**2. FIELD PLACEMENT POLICY** (MANDATORY):\n`
    enhancedPrompt += `   • Business data → core_dynamic_data table ONLY\n`
    enhancedPrompt += `   • Status → HAS_STATUS relationships ONLY (never columns)\n`
    enhancedPrompt += `   • Metadata → system data only, never business data\n`
    enhancedPrompt += `   • FORBIDDEN in metadata: ${HERA_FIELD_PLACEMENT_RULES.FORBIDDEN_IN_METADATA.join(', ')}\n`
    
    // Smart code rules
    enhancedPrompt += `\n**3. SMART CODE FORMAT** (ENFORCE STRICTLY):\n`
    enhancedPrompt += `   • Pattern: ${HERA_SMART_CODE_RULES.structure}\n`
    enhancedPrompt += `   • Version: .V1, .V2, .V3 (UPPERCASE V)\n`
    enhancedPrompt += `   • ❌ NEVER: .v1, .v2, .version1\n`
    
    // API standards
    enhancedPrompt += `\n**4. API STANDARDS** (UNIVERSAL V2 ONLY):\n`
    enhancedPrompt += `   • ALL endpoints: /api/v2/* ONLY\n`
    enhancedPrompt += `   • ALWAYS include: organization_id filtering\n`
    enhancedPrompt += `   • ALWAYS include: x-hera-api-version: v2 header\n`
    
    // Relationship rules
    enhancedPrompt += `\n**5. RELATIONSHIP PATTERNS**:\n`
    enhancedPrompt += `   • Use: from_entity_id/to_entity_id (NOT parent_id/child_id)\n`
    enhancedPrompt += `   • Status: HAS_STATUS relationships to status entities\n`
    enhancedPrompt += `   • Hierarchy: PARENT_OF/CHILD_OF relationships\n`
    
    // Validation results
    if (validation.violations.length > 0) {
      enhancedPrompt += `\n**🚨 DETECTED VIOLATIONS** (MUST FIX):\n`
      validation.violations.forEach((violation: any, index: number) => {
        enhancedPrompt += `   ${index + 1}. ${violation.severity}: ${violation.message}\n`
        enhancedPrompt += `      Fix: ${violation.fix}\n`
      })
      
      enhancedPrompt += `\n**✅ CORRECTED APPROACH**: Use this instead:\n`
      enhancedPrompt += JSON.stringify(validation.correctedApproach, null, 2)
    }
    
    // Existing components check
    const existingComponents = this.getExistingComponentsForPrompt(approach.components || [])
    if (existingComponents.length > 0) {
      enhancedPrompt += `\n**🔍 EXISTING COMPONENTS** (CHECK BEFORE CREATING NEW):\n`
      existingComponents.forEach(component => {
        enhancedPrompt += `   • ${component.name} (${component.path})\n`
      })
      enhancedPrompt += `   Consider extending existing components instead of creating new ones.\n`
    }
    
    // Self-improvement integration
    enhancedPrompt += `\n**🧠 SELF-IMPROVEMENT INTEGRATION**:\n`
    enhancedPrompt += `   • Use heraSelfImprovementEngine.optimizeGenerationInRealTime() before coding\n`
    enhancedPrompt += `   • Call learnFromGeneration() after completion for continuous improvement\n`
    enhancedPrompt += `   • Apply real-time quality optimization patterns\n`
    
    enhancedPrompt += `\n**📋 IMPLEMENTATION CHECKLIST**:\n`
    enhancedPrompt += `   ✅ Verify actual schema before using any fields\n`
    enhancedPrompt += `   ✅ Put business data in core_dynamic_data (never metadata)\n`
    enhancedPrompt += `   ✅ Use HAS_STATUS relationships (never status columns)\n`
    enhancedPrompt += `   ✅ Use /api/v2/ endpoints with organization_id filtering\n`
    enhancedPrompt += `   ✅ Follow HERA smart code format with uppercase .V1\n`
    enhancedPrompt += `   ✅ Check for existing components before creating new ones\n`
    enhancedPrompt += `   ✅ Apply self-improvement optimization patterns\n`
    
    enhancedPrompt += `\n**NOW PROCEED WITH ENHANCED REQUIREMENTS**:\n${originalPrompt}\n`
    
    return enhancedPrompt
  }

  /**
   * Helper methods for extracting validation results
   */
  private extractGuardrailsApplied(validation: any): string[] {
    const guardrails = []
    
    if (validation.violations.some((v: any) => v.type.includes('SCHEMA'))) {
      guardrails.push('Schema Reality Check')
    }
    if (validation.violations.some((v: any) => v.type.includes('FIELD_PLACEMENT'))) {
      guardrails.push('Field Placement Policy')
    }
    if (validation.violations.some((v: any) => v.type.includes('SMART_CODE'))) {
      guardrails.push('Smart Code Format')
    }
    if (validation.violations.some((v: any) => v.type.includes('API'))) {
      guardrails.push('API Standards')
    }
    if (validation.violations.some((v: any) => v.type.includes('COMPONENT'))) {
      guardrails.push('Existing Component Check')
    }
    
    return guardrails
  }

  private extractSchemaCorrections(validation: any): string[] {
    return validation.violations
      .filter((v: any) => v.type.includes('SCHEMA'))
      .map((v: any) => `${v.field || v.table}: ${v.fix}`)
  }

  private extractFieldPlacementCorrections(validation: any): string[] {
    return validation.violations
      .filter((v: any) => v.type.includes('FIELD_PLACEMENT'))
      .map((v: any) => `${v.field}: ${v.fix}`)
  }

  private extractExistingComponentWarnings(validation: any): Array<{component: string, existing: string, path: string}> {
    return validation.violations
      .filter((v: any) => v.type === 'COMPONENT_ALREADY_EXISTS')
      .map((v: any) => ({
        component: v.component,
        existing: v.existing_component,
        path: v.existing_path
      }))
  }

  private getExistingComponentsForPrompt(requestedComponents: string[]): Array<{name: string, path: string}> {
    // In real implementation, this would check actual codebase
    const existingComponents = [
      { name: 'CustomerList', path: 'src/components/customers/CustomerList.tsx' },
      { name: 'ProductCard', path: 'src/components/products/ProductCard.tsx' },
      { name: 'UserProfile', path: 'src/components/auth/UserProfile.tsx' },
      { name: 'Dashboard', path: 'src/components/dashboard/Dashboard.tsx' },
      { name: 'DataTable', path: 'src/components/ui/DataTable.tsx' },
      { name: 'FormBuilder', path: 'src/components/forms/FormBuilder.tsx' }
    ]

    return existingComponents.filter(existing => 
      requestedComponents.some(requested => 
        existing.name.toLowerCase().includes(requested.toLowerCase()) ||
        requested.toLowerCase().includes(existing.name.toLowerCase())
      )
    )
  }

  private storeInterception(originalPrompt: string, enhancedPrompt: string, validation: any): void {
    this.interceptionHistory.push({
      originalPrompt,
      enhancedPrompt,
      guardrailsApplied: this.extractGuardrailsApplied(validation),
      timestamp: new Date().toISOString()
    })

    // Keep only last 50 interceptions
    if (this.interceptionHistory.length > 50) {
      this.interceptionHistory.shift()
    }
  }

  /**
   * Get interception statistics
   */
  getInterceptionStatistics(): InterceptionStatistics {
    return {
      totalInterceptions: this.interceptionHistory.length,
      averageGuardrailsPerPrompt: this.interceptionHistory.reduce((sum, i) => sum + i.guardrailsApplied.length, 0) / this.interceptionHistory.length,
      mostCommonGuardrails: this.getMostCommonGuardrails(),
      recentInterceptions: this.interceptionHistory.slice(-10)
    }
  }

  private getMostCommonGuardrails(): Array<{guardrail: string, count: number}> {
    const guardrailCounts = new Map<string, number>()
    
    this.interceptionHistory.forEach(interception => {
      interception.guardrailsApplied.forEach(guardrail => {
        guardrailCounts.set(guardrail, (guardrailCounts.get(guardrail) || 0) + 1)
      })
    })

    return Array.from(guardrailCounts.entries())
      .map(([guardrail, count]) => ({ guardrail, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }
}

// ============================================================================
// AUTOMATIC INTEGRATION MIDDLEWARE
// ============================================================================

/**
 * Middleware that automatically intercepts Claude prompts
 */
export function withPlaybookGuardrails<T extends (...args: any[]) => any>(
  originalFunction: T,
  options: {
    enableInterception?: boolean
    enhancePrompts?: boolean
    validateApproach?: boolean
  } = {}
): T {
  const {
    enableInterception = true,
    enhancePrompts = true,
    validateApproach = true
  } = options

  return ((...args: any[]) => {
    if (!enableInterception) {
      return originalFunction(...args)
    }

    // Find prompt in arguments (usually first string argument)
    const promptIndex = args.findIndex(arg => typeof arg === 'string' && arg.length > 10)
    
    if (promptIndex === -1) {
      return originalFunction(...args)
    }

    const originalPrompt = args[promptIndex]
    
    try {
      console.log('🛡️ PLAYBOOK GUARDRAIL: Intercepting development request...')
      
      const interceptor = ClaudePlaybookInterceptor.getInstance()
      const enhanced = interceptor.interceptAndEnhancePrompt(originalPrompt)
      
      if (enhancePrompts && !enhanced.validation.isValid) {
        console.log('⚠️ GUARDRAIL VIOLATIONS DETECTED - Enhancing prompt...')
        args[promptIndex] = enhanced.enhancedPrompt
      }
      
      console.log('✅ PLAYBOOK GUARDRAILS APPLIED:', {
        violationsFound: enhanced.validation.violations.length,
        guardrailsApplied: enhanced.guardrailsApplied.length,
        confidence: enhanced.confidence
      })
      
      return originalFunction(...args)
      
    } catch (error) {
      console.warn('⚠️ Playbook guardrail failed (non-critical):', error)
      return originalFunction(...args)
    }
  }) as T
}

// ============================================================================
// AUTOMATIC PROMPT ENHANCEMENT FUNCTION
// ============================================================================

/**
 * Function to automatically enhance any development prompt
 */
export function enhancePromptWithPlaybookGuardrails(userPrompt: string): string {
  try {
    const interceptor = ClaudePlaybookInterceptor.getInstance()
    const enhanced = interceptor.interceptAndEnhancePrompt(userPrompt)
    
    if (enhanced.validation.violations.length === 0) {
      // No violations, just add basic guardrails
      return `${userPrompt}\n\n🛡️ HERA GUARDRAIL REMINDER: Follow HERA standards - use core_dynamic_data for business fields, HAS_STATUS relationships for status, /api/v2/ endpoints only, and uppercase smart code versions (.V1).`
    }
    
    // Return enhanced prompt with full guardrails
    return enhanced.enhancedPrompt
    
  } catch (error) {
    console.warn('⚠️ Prompt enhancement failed:', error)
    return userPrompt
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EnhancedPromptResult {
  originalPrompt: string
  enhancedPrompt: string
  validation: any
  guardrailsApplied: string[]
  confidence: number
  schemaCorrections: string[]
  fieldPlacementCorrections: string[]
  existingComponentWarnings: Array<{component: string, existing: string, path: string}>
}

export interface InterceptionStatistics {
  totalInterceptions: number
  averageGuardrailsPerPrompt: number
  mostCommonGuardrails: Array<{guardrail: string, count: number}>
  recentInterceptions: Array<{
    originalPrompt: string
    enhancedPrompt: string
    guardrailsApplied: string[]
    timestamp: string
  }>
}

// Export singleton instance
export const claudePlaybookInterceptor = ClaudePlaybookInterceptor.getInstance()