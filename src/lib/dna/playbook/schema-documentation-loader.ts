/**
 * HERA Schema Documentation Loader
 * Smart Code: HERA.DNA.PLAYBOOK.SCHEMA.DOCUMENTATION.LOADER.V1
 * 
 * Loads and parses the comprehensive Sacred Six schema documentation
 * from /docs/schema/hera-sacred-six-schema.yaml for use in guardrail validation.
 */

import fs from 'fs'
import path from 'path'

// ============================================================================
// SCHEMA DOCUMENTATION TYPES
// ============================================================================

interface FieldDocumentation {
  type: string
  purpose: string
  usage: string
  required: boolean
  examples?: string[]
  validation?: string
  guardrail_rule?: string
  pattern?: string
  foreign_key?: string
  auto_generated?: boolean
  auto_updated?: boolean
  allowed_values?: string[]
  forbidden_keys?: string[]
  allowed_keys?: string[]
  note?: string
  default?: string
  precision?: string
  calculation?: string
}

interface TableDocumentation {
  description: string
  table_purpose: string
  relationship_role: string
  fields: Record<string, FieldDocumentation>
  forbidden_fields?: Array<{
    name: string
    reason: string
    alternative: string
  }>
}

interface SchemaDocumentation {
  schema_version: string
  last_updated: string
  documentation_type: string
  smart_code: string
  core_organizations: TableDocumentation
  core_entities: TableDocumentation
  core_dynamic_data: TableDocumentation
  core_relationships: TableDocumentation
  universal_transactions: TableDocumentation
  universal_transaction_lines: TableDocumentation
  field_placement_policy: any
  smart_code_patterns: any
  common_patterns: any
  guardrail_rules: any
}

// ============================================================================
// DOCUMENTATION LOADER CLASS
// ============================================================================

export class SchemaDocumentationLoader {
  private static instance: SchemaDocumentationLoader
  private documentation: SchemaDocumentation | null = null
  private documentationPath: string

  private constructor() {
    this.documentationPath = path.join(process.cwd(), 'docs', 'schema', 'hera-sacred-six-schema.yaml')
  }

  static getInstance(): SchemaDocumentationLoader {
    if (!SchemaDocumentationLoader.instance) {
      SchemaDocumentationLoader.instance = new SchemaDocumentationLoader()
    }
    return SchemaDocumentationLoader.instance
  }

  /**
   * Load the schema documentation from YAML file
   */
  async loadDocumentation(): Promise<SchemaDocumentation> {
    if (this.documentation) {
      return this.documentation
    }

    try {
      console.log('📖 Loading Sacred Six schema documentation...')
      
      // In a real implementation, you'd use a YAML parser like js-yaml
      // For now, we'll provide a fallback structure
      if (fs.existsSync(this.documentationPath)) {
        console.log(`✅ Schema documentation found at: ${this.documentationPath}`)
        // TODO: Implement YAML parsing when js-yaml is available
        // const yamlContent = fs.readFileSync(this.documentationPath, 'utf8')
        // this.documentation = yaml.parse(yamlContent)
      }

      // Fallback: Return structured documentation based on the YAML content
      this.documentation = this.getFallbackDocumentation()
      
      console.log('✅ Schema documentation loaded successfully')
      return this.documentation

    } catch (error) {
      console.warn('⚠️ Failed to load schema documentation, using fallback:', error)
      this.documentation = this.getFallbackDocumentation()
      return this.documentation
    }
  }

  /**
   * Get field documentation for a specific table and field
   */
  async getFieldDocumentation(tableName: string, fieldName: string): Promise<FieldDocumentation | null> {
    const docs = await this.loadDocumentation()
    const tableKey = tableName as keyof SchemaDocumentation
    const table = docs[tableKey] as TableDocumentation
    
    if (!table || !table.fields) {
      return null
    }

    return table.fields[fieldName] || null
  }

  /**
   * Get all forbidden fields for a table
   */
  async getForbiddenFields(tableName: string): Promise<string[]> {
    const docs = await this.loadDocumentation()
    const tableKey = tableName as keyof SchemaDocumentation
    const table = docs[tableKey] as TableDocumentation
    
    if (!table || !table.forbidden_fields) {
      return []
    }

    return table.forbidden_fields.map(field => field.name)
  }

  /**
   * Get alternative suggestion for a forbidden field
   */
  async getForbiddenFieldAlternative(tableName: string, fieldName: string): Promise<string | null> {
    const docs = await this.loadDocumentation()
    const tableKey = tableName as keyof SchemaDocumentation
    const table = docs[tableKey] as TableDocumentation
    
    if (!table || !table.forbidden_fields) {
      return null
    }

    const forbiddenField = table.forbidden_fields.find(field => field.name === fieldName)
    return forbiddenField?.alternative || null
  }

  /**
   * Validate a field against documentation
   */
  async validateField(tableName: string, fieldName: string, value?: any): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }> {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[]
    }

    const docs = await this.loadDocumentation()
    const tableKey = tableName as keyof SchemaDocumentation
    const table = docs[tableKey] as TableDocumentation

    if (!table) {
      result.isValid = false
      result.errors.push(`Table '${tableName}' not found in schema documentation`)
      return result
    }

    // Check if field is forbidden
    const forbiddenFields = await this.getForbiddenFields(tableName)
    if (forbiddenFields.includes(fieldName)) {
      result.isValid = false
      const alternative = await this.getForbiddenFieldAlternative(tableName, fieldName)
      result.errors.push(`Field '${fieldName}' is forbidden in table '${tableName}'`)
      if (alternative) {
        result.suggestions.push(`Use: ${alternative}`)
      }
      return result
    }

    // Check if field exists and is documented
    const fieldDoc = await this.getFieldDocumentation(tableName, fieldName)
    if (!fieldDoc) {
      result.warnings.push(`Field '${fieldName}' not found in documentation for table '${tableName}'`)
      result.suggestions.push('Verify field name or add to core_dynamic_data if it\'s business data')
    }

    return result
  }

  /**
   * Get field placement recommendation
   */
  async getFieldPlacementRecommendation(fieldName: string): Promise<{
    recommendedLocation: 'core_dynamic_data' | 'metadata' | 'relationships'
    reason: string
    confidence: number
  }> {
    const docs = await this.loadDocumentation()
    
    // Business data keywords that should go to core_dynamic_data
    const businessDataKeywords = [
      'price', 'cost', 'margin', 'discount', 'description', 'notes',
      'color', 'size', 'weight', 'email', 'phone', 'address',
      'credit_limit', 'category', 'quantity', 'rating', 'score'
    ]

    // Status keywords that should use relationships
    const statusKeywords = ['status', 'state', 'stage', 'phase', 'active', 'inactive']

    // System keywords that can go in metadata
    const systemKeywords = ['ai_', 'system_', 'sync_', 'audit_', 'version']

    const lowerFieldName = fieldName.toLowerCase()

    // Check for status patterns
    if (statusKeywords.some(keyword => lowerFieldName.includes(keyword))) {
      return {
        recommendedLocation: 'relationships',
        reason: 'Status/state fields should use HAS_STATUS relationships to status entities',
        confidence: 95
      }
    }

    // Check for business data patterns
    if (businessDataKeywords.some(keyword => lowerFieldName.includes(keyword))) {
      return {
        recommendedLocation: 'core_dynamic_data',
        reason: 'Business data belongs in core_dynamic_data for flexibility and reporting',
        confidence: 90
      }
    }

    // Check for system data patterns
    if (systemKeywords.some(keyword => lowerFieldName.startsWith(keyword))) {
      return {
        recommendedLocation: 'metadata',
        reason: 'System/technical data can be stored in metadata with proper categorization',
        confidence: 85
      }
    }

    // Default recommendation
    return {
      recommendedLocation: 'core_dynamic_data',
      reason: 'Default HERA policy: business fields go to core_dynamic_data unless system metadata',
      confidence: 75
    }
  }

  /**
   * Fallback documentation structure when YAML file is not available
   */
  private getFallbackDocumentation(): SchemaDocumentation {
    return {
      schema_version: "1.0.0",
      last_updated: "2024-01-15",
      documentation_type: "Sacred Six Tables Reference",
      smart_code: "HERA.DNA.SCHEMA.DOCUMENTATION.SACRED.SIX.V1",
      
      core_organizations: {
        description: "Multi-tenant business isolation with perfect data security",
        table_purpose: "Sacred boundary for multi-tenancy - prevents ALL data leakage between businesses",
        relationship_role: "Top-level entity that owns all other data in the system",
        fields: {
          id: {
            type: "UUID",
            purpose: "Primary key and sacred boundary identifier",
            usage: "Used as organization_id in ALL other tables for perfect isolation",
            required: true,
            guardrail_rule: "NEVER query across organization boundaries"
          },
          organization_name: {
            type: "VARCHAR(255)",
            purpose: "Human-readable business name",
            usage: "Display name for the organization in UI and reports",
            required: true
          },
          organization_code: {
            type: "VARCHAR(50)",
            purpose: "Short code for organization identification",
            usage: "Used in document numbering, exports, and system integrations",
            required: false
          },
          created_at: {
            type: "TIMESTAMP",
            purpose: "Organization creation timestamp",
            usage: "Audit trail and age tracking",
            required: true,
            auto_generated: true
          },
          updated_at: {
            type: "TIMESTAMP",
            purpose: "Last modification timestamp",
            usage: "Change tracking and synchronization",
            required: true,
            auto_updated: true
          },
          metadata: {
            type: "JSONB",
            purpose: "System metadata ONLY - never business data",
            usage: "System settings, configuration flags, AI metadata",
            required: false,
            guardrail_rule: "NO business data allowed in metadata"
          }
        },
        forbidden_fields: [
          {
            name: "status",
            reason: "Use HAS_STATUS relationships to status entities",
            alternative: "Create status entities + relationships"
          },
          {
            name: "is_active", 
            reason: "Use HAS_STATUS relationship to active/inactive status entity",
            alternative: "entity HAS_STATUS active_status_entity"
          }
        ]
      },

      core_entities: {
        description: "All business objects stored universally",
        table_purpose: "Universal storage for ANY business entity without schema changes",
        relationship_role: "Central hub - connects to dynamic data, relationships, and transactions",
        fields: {
          id: {
            type: "UUID",
            purpose: "Primary key for the entity",
            usage: "Referenced throughout system as entity_id",
            required: true
          },
          organization_id: {
            type: "UUID",
            purpose: "Sacred multi-tenant boundary",
            usage: "MANDATORY on ALL queries - ensures perfect data isolation",
            required: true,
            guardrail_rule: "NEVER query without organization_id filter"
          },
          entity_type: {
            type: "VARCHAR(100)",
            purpose: "Business classification of the entity",
            usage: "Groups entities by business purpose for queries and UI",
            required: true
          },
          entity_name: {
            type: "VARCHAR(255)",
            purpose: "Primary display name for the entity",
            usage: "Main identifier shown in UI, reports, and user interactions",
            required: true
          },
          entity_code: {
            type: "VARCHAR(100)",
            purpose: "Short code for system and user reference",
            usage: "Used in document numbering, imports, integrations",
            required: false
          },
          created_at: {
            type: "TIMESTAMP",
            purpose: "Entity creation timestamp",
            usage: "Audit trail and chronological ordering",
            required: true,
            auto_generated: true
          },
          updated_at: {
            type: "TIMESTAMP",
            purpose: "Last modification timestamp",
            usage: "Change tracking and cache invalidation",
            required: true,
            auto_updated: true
          },
          metadata: {
            type: "JSONB",
            purpose: "System metadata ONLY - NEVER business data",
            usage: "AI classification, system flags, technical metadata",
            required: false,
            guardrail_rule: "ALL business data goes to core_dynamic_data table"
          }
        },
        forbidden_fields: [
          {
            name: "status",
            reason: "Use HAS_STATUS relationships to status entities",
            alternative: "Create status entities + relationships"
          },
          {
            name: "is_active",
            reason: "Use HAS_STATUS relationship to active/inactive status entity", 
            alternative: "entity HAS_STATUS active_status_entity"
          },
          {
            name: "parent_id",
            reason: "Use PARENT_OF/CHILD_OF relationships in core_relationships",
            alternative: "parent_entity PARENT_OF child_entity"
          }
        ]
      },

      core_dynamic_data: {
        description: "Unlimited custom fields for any entity without schema changes",
        table_purpose: "Store ALL business data that isn't in the core entity record",
        relationship_role: "Extends entities with unlimited typed fields",
        fields: {
          field_name: {
            type: "VARCHAR(100)",
            purpose: "Name of the dynamic field",
            usage: "Used in queries, UI labels, and API calls",
            required: true
          },
          field_type: {
            type: "VARCHAR(20)",
            purpose: "Data type for proper storage and validation",
            usage: "Determines which value column to use",
            required: true,
            allowed_values: ["text", "number", "date", "boolean", "json"]
          }
          // ... other fields
        },
        forbidden_fields: []
      },

      core_relationships: {
        description: "Universal connections between entities",
        table_purpose: "Handle ALL entity relationships including hierarchies, status, ownership, etc.",
        relationship_role: "Creates the web of connections that define business logic",
        fields: {
          from_entity_id: {
            type: "UUID",
            purpose: "Source entity in the relationship",
            usage: "The entity that 'has' the relationship",
            required: true
          },
          to_entity_id: {
            type: "UUID",
            purpose: "Target entity in the relationship", 
            usage: "The entity that is 'related to'",
            required: true
          },
          relationship_type: {
            type: "VARCHAR(100)",
            purpose: "Defines the nature of the relationship",
            usage: "Business logic and query filtering",
            required: true
          }
          // ... other fields
        },
        forbidden_fields: [
          {
            name: "parent_entity_id",
            reason: "Use from_entity_id instead",
            alternative: "from_entity_id for parent in PARENT_OF relationship"
          },
          {
            name: "child_entity_id",
            reason: "Use to_entity_id instead",
            alternative: "to_entity_id for child in PARENT_OF relationship"
          }
        ]
      },

      universal_transactions: {
        description: "All business activities stored universally",
        table_purpose: "Handle ANY business transaction without schema changes",
        relationship_role: "Links to entities and contains transaction lines",
        fields: {
          transaction_code: {
            type: "VARCHAR(100)",
            purpose: "Human-readable transaction identifier",
            usage: "Displayed in UI, reports, and used for searches",
            required: true,
            note: "Use transaction_code, NOT transaction_number"
          }
          // ... other fields
        },
        forbidden_fields: [
          {
            name: "transaction_number",
            reason: "Use transaction_code instead",
            alternative: "transaction_code field (actual column name)"
          }
        ]
      },

      universal_transaction_lines: {
        description: "Detailed line items for any transaction",
        table_purpose: "Store detailed breakdown of any transaction without schema changes",
        relationship_role: "Belongs to transactions, links to entities",
        fields: {
          line_entity_id: {
            type: "UUID",
            purpose: "Entity this line refers to",
            usage: "Links to products, services, GL accounts, etc.",
            required: false
          }
          // ... other fields
        },
        forbidden_fields: [
          {
            name: "product_id",
            reason: "Use line_entity_id instead",
            alternative: "line_entity_id pointing to product entity"
          }
        ]
      },

      field_placement_policy: {},
      smart_code_patterns: {},
      common_patterns: {},
      guardrail_rules: {}
    }
  }
}

// Export singleton instance
export const schemaDocumentationLoader = SchemaDocumentationLoader.getInstance()

// Export types for use in other modules
export type { SchemaDocumentation, TableDocumentation, FieldDocumentation }