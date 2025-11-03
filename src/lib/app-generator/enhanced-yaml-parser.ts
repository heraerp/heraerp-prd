/**
 * HERA Enhanced YAML App Parser v2.4
 * 
 * Parses comprehensive app definitions from YAML and generates complete HERA applications
 * Supports: entities, transactions, policies, UI pages, seeds, CI rules
 * Compatible with Jewelry ERP and other complex business applications
 */

import yaml from 'js-yaml'
import { z } from 'zod'

// Enhanced App Definition Schema for complex business applications
const AppConfigSchema = z.object({
  app: z.object({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    description: z.string(),
    industry: z.string(),
    settings: z.object({
      fiscal_calendar: z.string().optional(),
      base_currency: z.string().optional(),
      tax_enabled: z.boolean().optional(),
      default_tax_policy: z.string().optional(),
      gold_rate_source: z.string().optional(),
      time_zone: z.string().optional()
    }).optional()
  }),
  
  entities: z.array(z.object({
    entity_type: z.string(),
    smart_code_prefix: z.string(),
    entity_name_template: z.string(),
    entity_code_template: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().optional(),
      searchable: z.boolean().optional(),
      validation: z.string().optional(),
      pii: z.boolean().optional(),
      enum: z.array(z.string()).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      default: z.union([z.string(), z.number(), z.boolean()]).optional(),
      description: z.string().optional()
    })),
    relationships: z.array(z.object({
      type: z.string(),
      to_entity_type: z.string(),
      required: z.boolean().optional(),
      cardinality: z.string().optional()
    })).optional()
  })),
  
  transactions: z.array(z.object({
    transaction_type: z.string(),
    smart_code: z.string(),
    transaction_name: z.string(),
    posting_bundle: z.string(),
    header_fields: z.array(z.object({
      name: z.string(),
      entity_type: z.string().optional(),
      type: z.string().optional(),
      required: z.boolean().optional(),
      enum: z.array(z.string()).optional(),
      calculated: z.boolean().optional(),
      default: z.union([z.string(), z.number(), z.boolean()]).optional(),
      description: z.string().optional()
    })),
    lines: z.array(z.object({
      line_type: z.string(),
      fields: z.array(z.object({
        name: z.string(),
        entity_type: z.string().optional(),
        type: z.string().optional(),
        required: z.boolean().optional(),
        enum: z.array(z.string()).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        default: z.union([z.string(), z.number(), z.boolean()]).optional()
      })).optional(),
      generated_by: z.string().optional()
    })),
    workflow: z.object({
      requires_approval: z.boolean().optional(),
      approval_threshold: z.number().optional(),
      auto_post: z.boolean().optional(),
      reversible: z.boolean().optional()
    }).optional(),
    guardrails: z.array(z.string()).optional(),
    policies: z.array(z.object({
      policy_type: z.string(),
      rule: z.any()
    })).optional()
  })).optional(),
  
  policies: z.array(z.object({
    policy_type: z.string(),
    applies_to: z.string().optional(),
    rule: z.any()
  })).optional(),
  
  pages: z.array(z.object({
    page_type: z.string(),
    entity_type: z.string().optional(),
    transaction_type: z.string().optional(),
    title: z.string(),
    filters: z.array(z.string()).optional(),
    columns: z.array(z.string()).optional(),
    actions: z.array(z.string()).optional(),
    steps: z.array(z.object({
      step: z.string(),
      fields: z.array(z.string()).optional(),
      line_type: z.string().optional(),
      relationships: z.array(z.string()).optional(),
      allow_add_remove: z.boolean().optional(),
      show_guardrails: z.boolean().optional(),
      show_gl_preview: z.boolean().optional(),
      show_rule_trace: z.boolean().optional(),
      show_actor: z.boolean().optional(),
      show_audit: z.boolean().optional()
    })).optional(),
    widgets: z.array(z.object({
      type: z.string(),
      title: z.string(),
      metric: z.string().optional(),
      chart_type: z.string().optional(),
      filter: z.string().optional(),
      group_by: z.string().optional(),
      columns: z.array(z.string()).optional(),
      query: z.string().optional()
    })).optional()
  })).optional(),
  
  seeds: z.array(z.object({
    entity_type: z.string(),
    records: z.array(z.any())
  })).optional(),
  
  ci_rules: z.array(z.object({
    name: z.string(),
    check: z.string()
  })).optional(),
  
  metadata: z.object({
    generated_by: z.string().optional(),
    generated_at: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    estimated_entities: z.number().optional(),
    estimated_transactions: z.number().optional(),
    estimated_pages: z.number().optional(),
    estimated_apis: z.number().optional()
  }).optional()
})

export type EnhancedAppConfig = z.infer<typeof AppConfigSchema>

export class EnhancedYAMLAppParser {
  /**
   * Parse YAML string into validated app configuration
   */
  static parseYAML(yamlContent: string): EnhancedAppConfig {
    try {
      // Parse YAML
      const rawData = yaml.load(yamlContent) as any
      
      // Validate against schema
      const appConfig = AppConfigSchema.parse(rawData)
      
      return appConfig
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('\n')
        throw new Error(`YAML validation failed:\n${errorDetails}`)
      }
      
      throw new Error(`YAML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Parse YAML file into validated app configuration
   */
  static parseYAMLFile(filePath: string): EnhancedAppConfig {
    const fs = require('fs')
    const yamlContent = fs.readFileSync(filePath, 'utf8')
    return this.parseYAML(yamlContent)
  }
  
  /**
   * Validate app configuration for HERA compatibility
   */
  static validateHERACompatibility(config: EnhancedAppConfig): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Check Smart Code patterns
    config.entities.forEach(entity => {
      if (!entity.smart_code_prefix.startsWith('HERA.')) {
        issues.push(`Entity ${entity.entity_type}: Smart code prefix must start with 'HERA.'`)
      }
      
      if (!entity.smart_code_prefix.match(/^HERA\.[A-Z_]+(\.[A-Z_]+)*$/)) {
        issues.push(`Entity ${entity.entity_type}: Invalid Smart code format`)
      }
    })
    
    // Check transaction Smart Codes
    config.transactions?.forEach(transaction => {
      if (!transaction.smart_code.startsWith('HERA.')) {
        issues.push(`Transaction ${transaction.transaction_type}: Smart code must start with 'HERA.'`)
      }
      
      if (!transaction.smart_code.endsWith('.v1')) {
        issues.push(`Transaction ${transaction.transaction_type}: Smart code must end with '.v1'`)
      }
    })
    
    // Check required posting bundles
    config.transactions?.forEach(transaction => {
      if (!transaction.posting_bundle) {
        issues.push(`Transaction ${transaction.transaction_type}: Posting bundle is required`)
      }
    })
    
    // Check for actor stamping requirements
    const hasActorFields = config.entities.some(entity => 
      entity.fields.some(field => ['created_by', 'updated_by'].includes(field.name))
    )
    
    if (hasActorFields) {
      issues.push('Entities should not define actor stamping fields (created_by, updated_by) - these are automatic')
    }
    
    // Check organization_id requirements
    const hasOrgIdFields = config.entities.some(entity =>
      entity.fields.some(field => field.name === 'organization_id')
    )
    
    if (hasOrgIdFields) {
      issues.push('Entities should not define organization_id field - this is automatic')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  }
  
  /**
   * Extract entity types for code generation
   */
  static extractEntityTypes(config: EnhancedAppConfig): string[] {
    return config.entities.map(entity => entity.entity_type)
  }
  
  /**
   * Extract transaction types for code generation
   */
  static extractTransactionTypes(config: EnhancedAppConfig): string[] {
    return config.transactions?.map(tx => tx.transaction_type) || []
  }
  
  /**
   * Extract page configurations for UI generation
   */
  static extractPageConfigs(config: EnhancedAppConfig): EnhancedAppConfig['pages'] {
    return config.pages || []
  }
  
  /**
   * Extract policy configurations for business rules
   */
  static extractPolicies(config: EnhancedAppConfig): EnhancedAppConfig['policies'] {
    return config.policies || []
  }
  
  /**
   * Extract seed data for demo setup
   */
  static extractSeedData(config: EnhancedAppConfig): EnhancedAppConfig['seeds'] {
    return config.seeds || []
  }
  
  /**
   * Generate app statistics
   */
  static generateStats(config: EnhancedAppConfig): {
    entities: number
    transactions: number
    pages: number
    policies: number
    seedRecords: number
    estimatedFiles: number
  } {
    const entities = config.entities.length
    const transactions = config.transactions?.length || 0
    const pages = config.pages?.length || 0
    const policies = config.policies?.length || 0
    const seedRecords = config.seeds?.reduce((total, seed) => total + seed.records.length, 0) || 0
    
    // Estimate generated files
    const estimatedFiles = 
      entities * 5 + // Entity hooks, API routes, tests per entity
      transactions * 3 + // Transaction types, policies, tests
      pages * 2 + // Page components and routes
      10 // Base infrastructure files
    
    return {
      entities,
      transactions,
      pages,
      policies,
      seedRecords,
      estimatedFiles
    }
  }
  
  /**
   * Convert to generation context for template engine
   */
  static toGenerationContext(config: EnhancedAppConfig): GenerationContext {
    const stats = this.generateStats(config)
    
    return {
      app: config.app,
      entities: config.entities.map(entity => ({
        ...entity,
        // Convert template placeholders
        entityNameTemplate: entity.entity_name_template,
        entityCodeTemplate: entity.entity_code_template,
        smartCodePrefix: entity.smart_code_prefix,
        // Generate derived names
        entityName: entity.entity_type.toLowerCase(),
        EntityName: this.capitalize(entity.entity_type),
        ENTITY_TYPE: entity.entity_type.toUpperCase()
      })),
      transactions: config.transactions || [],
      policies: config.policies || [],
      pages: config.pages || [],
      seeds: config.seeds || [],
      stats,
      timestamp: new Date().toISOString()
    }
  }
  
  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
}

export interface GenerationContext {
  app: EnhancedAppConfig['app']
  entities: Array<EnhancedAppConfig['entities'][0] & {
    entityName: string
    EntityName: string
    ENTITY_TYPE: string
    entityNameTemplate: string
    entityCodeTemplate: string
    smartCodePrefix: string
  }>
  transactions: EnhancedAppConfig['transactions']
  policies: EnhancedAppConfig['policies']
  pages: EnhancedAppConfig['pages']
  seeds: EnhancedAppConfig['seeds']
  stats: {
    entities: number
    transactions: number
    pages: number
    policies: number
    seedRecords: number
    estimatedFiles: number
  }
  timestamp: string
}

export default EnhancedYAMLAppParser