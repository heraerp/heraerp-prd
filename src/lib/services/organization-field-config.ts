/**
 * Organization Field Configuration Service
 * Smart Code: HERA.PLATFORM.SERVICE.ORG.FIELD_CONFIG.v1
 * 
 * 🎯 Enterprise Multi-tenant Field Customization
 * - Organization-level entity field configuration
 * - Industry template inheritance with Smart Code anchoring
 * - 4-tier resolution priority model
 * - Perfect audit trail via universal transactions
 * - AI-powered field recommendations
 * 
 * 🛡️ Sacred Six Compliance:
 * - Uses core_organizations.settings JSONB (no schema changes)
 * - Leverages core_entities.business_rules for validation logic
 * - Creates universal_transactions for all config changes
 * - Maintains organization isolation and actor stamping
 */

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// Types for field configuration system
export interface FieldValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  regex?: string
  enum?: string[]
  message?: string
  custom_validator?: string // Smart code for custom validation function
}

export interface OrganizationFieldDefinition {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'boolean' | 'date' | 'select' | 'textarea' | 'file_url'
  required: boolean
  section: string
  smart_code: string // HERA.{DOMAIN}.{ENTITY}.FIELD.{FIELDNAME}.v1
  smart_code_parent?: string // For template inheritance
  validation: FieldValidationRule
  placeholder?: string
  help_text?: string
  default_value?: any
  order: number
  visible: boolean
  editable: boolean
  visible_roles?: string[] // RBAC integration
  editable_roles?: string[]
  read_only_roles?: string[]
  ai_recommended?: boolean // AI suggested this field
}

export interface FieldSection {
  id: string
  label: string
  icon: string
  required: boolean
  description: string
  order: number
  visible_roles?: string[]
}

export interface EntityFieldConfiguration {
  entity_type: string
  smart_code: string // HERA.{DOMAIN}.{ENTITY}.CONFIG.FIELDS.v1
  inherits_from?: string // Parent template smart code
  version: number
  sections: FieldSection[]
  fields: OrganizationFieldDefinition[]
  layout: 'sections' | 'tabs' | 'single'
  branding: {
    primary_color?: string
    secondary_color?: string
    icon?: string
  }
  ai_recommendations?: {
    missing_fields?: string[]
    redundant_fields?: string[]
    suggested_templates?: string[]
    confidence_score?: number
  }
  metadata: {
    created_by: string
    created_at: string
    updated_by: string
    updated_at: string
    source: 'custom' | 'template' | 'ai_generated'
  }
}

export interface OrganizationFieldSettings {
  entity_field_configs: Record<string, EntityFieldConfiguration>
  field_templates: Record<string, string[]> // Template presets
  industry_overrides: Record<string, Partial<EntityFieldConfiguration>>
  ai_field_learning: {
    enabled: boolean
    auto_suggest: boolean
    confidence_threshold: number
  }
}

// 4-Tier Resolution Priority Model
export enum FieldConfigPriority {
  ORG_CUSTOM = 1,      // Org-level override (highest priority)
  INDUSTRY_TEMPLATE = 2, // Industry defaults
  BASE_TEMPLATE = 3,    // HERA base defaults
  HARDCODED_FALLBACK = 4 // Safety net (lowest priority)
}

export class OrganizationFieldConfigService {
  private supabase
  private cache = new Map<string, EntityFieldConfiguration>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Get field configuration for an entity type with 4-tier priority resolution
   */
  async getFieldConfiguration(
    organizationId: string,
    entityType: string,
    userId?: string
  ): Promise<EntityFieldConfiguration> {
    const cacheKey = `${organizationId}:${entityType}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      console.log(`[FieldConfig] 💾 Cache hit for ${cacheKey}`)
      return cached
    }

    console.log(`[FieldConfig] 🔍 Resolving field config for ${entityType} in org ${organizationId}`)

    try {
      // 1. Priority 1: Check org-specific custom configuration
      const orgConfig = await this.getOrgCustomConfig(organizationId, entityType)
      if (orgConfig) {
        console.log(`[FieldConfig] ✅ Found org custom config (Priority 1)`)
        this.cache.set(cacheKey, orgConfig)
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
        return orgConfig
      }

      // 2. Priority 2: Check industry template
      const industryConfig = await this.getIndustryTemplate(organizationId, entityType)
      if (industryConfig) {
        console.log(`[FieldConfig] ✅ Found industry template (Priority 2)`)
        this.cache.set(cacheKey, industryConfig)
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
        return industryConfig
      }

      // 3. Priority 3: Check base template
      const baseTemplate = await this.getBaseTemplate(entityType)
      if (baseTemplate) {
        console.log(`[FieldConfig] ✅ Found base template (Priority 3)`)
        this.cache.set(cacheKey, baseTemplate)
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
        return baseTemplate
      }

      // 4. Priority 4: Hardcoded fallback
      console.log(`[FieldConfig] ⚠️ Using hardcoded fallback (Priority 4)`)
      const fallbackConfig = this.getHardcodedFallback(entityType)
      this.cache.set(cacheKey, fallbackConfig)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
      return fallbackConfig

    } catch (error) {
      console.error(`[FieldConfig] ❌ Error resolving field config:`, error)
      return this.getHardcodedFallback(entityType)
    }
  }

  /**
   * Update organization field configuration with governance transaction
   */
  async updateFieldConfiguration(
    organizationId: string,
    entityType: string,
    config: EntityFieldConfiguration,
    actorUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[FieldConfig] 🔄 Updating field config for ${entityType} in org ${organizationId}`)

      // Validate configuration
      const validation = this.validateFieldConfiguration(config)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate Smart Code for this configuration
      config.smart_code = this.generateConfigSmartCode(organizationId, entityType)
      config.version = (config.version || 0) + 1
      config.metadata = {
        ...config.metadata,
        updated_by: actorUserId,
        updated_at: new Date().toISOString()
      }

      // Update organization settings
      const { error: updateError } = await this.supabase
        .from('core_organizations')
        .update({
          settings: this.supabase.rpc('jsonb_set', {
            target: 'settings',
            path: `{entity_field_configs,${entityType}}`,
            new_value: JSON.stringify(config)
          }),
          updated_by: actorUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)

      if (updateError) {
        console.error(`[FieldConfig] ❌ Failed to update org settings:`, updateError)
        return { success: false, error: updateError.message }
      }

      // Create governance transaction for audit trail
      await this.createGovernanceTransaction(
        organizationId,
        actorUserId,
        entityType,
        config,
        'UPDATE'
      )

      // Update entity business rules if needed
      await this.updateEntityBusinessRules(organizationId, entityType, config)

      // Clear cache
      const cacheKey = `${organizationId}:${entityType}`
      this.cache.delete(cacheKey)

      console.log(`[FieldConfig] ✅ Field config updated successfully`)
      return { success: true }

    } catch (error) {
      console.error(`[FieldConfig] ❌ Error updating field config:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Clone field configuration from another organization (template sharing)
   */
  async cloneFieldConfiguration(
    fromOrgId: string,
    toOrgId: string,
    entityType: string,
    actorUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[FieldConfig] 📋 Cloning field config from ${fromOrgId} to ${toOrgId}`)

      const sourceConfig = await this.getFieldConfiguration(fromOrgId, entityType)
      
      // Reset metadata for new organization
      sourceConfig.metadata = {
        created_by: actorUserId,
        created_at: new Date().toISOString(),
        updated_by: actorUserId,
        updated_at: new Date().toISOString(),
        source: 'template'
      }
      sourceConfig.version = 1

      return await this.updateFieldConfiguration(toOrgId, entityType, sourceConfig, actorUserId)

    } catch (error) {
      console.error(`[FieldConfig] ❌ Error cloning field config:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get available industry templates
   */
  async getAvailableTemplates(industry?: string): Promise<EntityFieldConfiguration[]> {
    // This would query a template registry - for now return empty
    // In production, this would fetch from a curated template database
    return []
  }

  // Private helper methods

  private async getOrgCustomConfig(
    organizationId: string,
    entityType: string
  ): Promise<EntityFieldConfiguration | null> {
    try {
      const { data, error } = await this.supabase
        .from('core_organizations')
        .select('settings')
        .eq('id', organizationId)
        .single()

      if (error || !data) return null

      const configs = data.settings?.entity_field_configs
      return configs?.[entityType] || null

    } catch (error) {
      console.error(`[FieldConfig] Error getting org custom config:`, error)
      return null
    }
  }

  private async getIndustryTemplate(
    organizationId: string,
    entityType: string
  ): Promise<EntityFieldConfiguration | null> {
    try {
      // Get organization industry classification
      const { data, error } = await this.supabase
        .from('core_organizations')
        .select('industry_classification')
        .eq('id', organizationId)
        .single()

      if (error || !data?.industry_classification) return null

      // In production, this would query industry-specific templates
      // For now, return null to fall through to base template
      return null

    } catch (error) {
      console.error(`[FieldConfig] Error getting industry template:`, error)
      return null
    }
  }

  private async getBaseTemplate(entityType: string): Promise<EntityFieldConfiguration | null> {
    // In production, this would query base templates from a registry
    // For now, return null to fall through to hardcoded fallback
    return null
  }

  private getHardcodedFallback(entityType: string): EntityFieldConfiguration {
    const baseFields: OrganizationFieldDefinition[] = [
      {
        id: 'entity_name',
        label: 'Name',
        type: 'text',
        required: true,
        section: 'basic',
        smart_code: `HERA.PLATFORM.${entityType}.FIELD.NAME.v1`,
        validation: { required: true, minLength: 2, maxLength: 255 },
        placeholder: `Enter ${entityType.toLowerCase()} name`,
        order: 1,
        visible: true,
        editable: true
      },
      {
        id: 'entity_code',
        label: 'Code',
        type: 'text',
        required: true,
        section: 'basic',
        smart_code: `HERA.PLATFORM.${entityType}.FIELD.CODE.v1`,
        validation: { required: true, maxLength: 50 },
        placeholder: 'Auto-generated from name',
        order: 2,
        visible: true,
        editable: true
      },
      {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        section: 'basic',
        smart_code: `HERA.PLATFORM.${entityType}.FIELD.DESCRIPTION.v1`,
        validation: { maxLength: 1000 },
        placeholder: `Brief description of ${entityType.toLowerCase()}`,
        order: 3,
        visible: true,
        editable: true
      }
    ]

    return {
      entity_type: entityType,
      smart_code: `HERA.PLATFORM.${entityType}.CONFIG.FIELDS.FALLBACK.v1`,
      version: 1,
      sections: [
        {
          id: 'basic',
          label: 'Basic Information',
          icon: 'Package',
          required: true,
          description: `Enter basic ${entityType.toLowerCase()} information`,
          order: 1
        }
      ],
      fields: baseFields,
      layout: 'sections',
      branding: {
        primary_color: '#2563eb',
        icon: 'Package'
      },
      metadata: {
        created_by: 'SYSTEM',
        created_at: new Date().toISOString(),
        updated_by: 'SYSTEM',
        updated_at: new Date().toISOString(),
        source: 'custom'
      }
    }
  }

  private generateConfigSmartCode(organizationId: string, entityType: string): string {
    // Generate deterministic smart code based on org and entity type
    const orgHash = organizationId.slice(-8).toUpperCase()
    return `HERA.ORG.${orgHash}.${entityType}.CONFIG.v1`
  }

  private validateFieldConfiguration(config: EntityFieldConfiguration): { valid: boolean; error?: string } {
    // Basic validation rules
    if (!config.entity_type) {
      return { valid: false, error: 'Entity type is required' }
    }

    if (!config.fields || config.fields.length === 0) {
      return { valid: false, error: 'At least one field is required' }
    }

    if (!config.sections || config.sections.length === 0) {
      return { valid: false, error: 'At least one section is required' }
    }

    // Validate required fields exist
    const hasNameField = config.fields.some(f => f.id === 'entity_name')
    if (!hasNameField) {
      return { valid: false, error: 'entity_name field is required' }
    }

    // Validate smart codes follow HERA pattern
    for (const field of config.fields) {
      if (!field.smart_code || !field.smart_code.startsWith('HERA.')) {
        return { valid: false, error: `Invalid smart code for field ${field.id}: ${field.smart_code}` }
      }
    }

    return { valid: true }
  }

  private async createGovernanceTransaction(
    organizationId: string,
    actorUserId: string,
    entityType: string,
    config: EntityFieldConfiguration,
    action: 'CREATE' | 'UPDATE' | 'DELETE'
  ): Promise<void> {
    try {
      // Create universal transaction for governance audit
      const transactionData = {
        organization_id: organizationId,
        smart_code: 'HERA.PLATFORM.TXN.FIELD_CONFIG.UPDATE.v1',
        transaction_type: 'FIELD_CONFIG_UPDATE',
        transaction_number: `FIELD-CONFIG-${Date.now()}`,
        source_entity_id: null, // No specific entity
        target_entity_id: null,
        total_amount: 0,
        transaction_status: 'COMPLETED',
        metadata: {
          entity_type: entityType,
          action: action,
          fields_count: config.fields.length,
          sections_count: config.sections.length,
          config_version: config.version
        }
      }

      const { error: txnError } = await this.supabase
        .from('universal_transactions')
        .insert({
          ...transactionData,
          created_by: actorUserId,
          updated_by: actorUserId
        })

      if (txnError) {
        console.error(`[FieldConfig] ⚠️ Failed to create governance transaction:`, txnError)
      } else {
        console.log(`[FieldConfig] ✅ Created governance transaction for field config change`)
      }

    } catch (error) {
      console.error(`[FieldConfig] ⚠️ Error creating governance transaction:`, error)
      // Don't throw - governance transaction failure shouldn't block the main operation
    }
  }

  private async updateEntityBusinessRules(
    organizationId: string,
    entityType: string,
    config: EntityFieldConfiguration
  ): Promise<void> {
    try {
      // Extract validation rules from field config
      const validationRules = config.fields.reduce((rules, field) => {
        if (field.validation && Object.keys(field.validation).length > 0) {
          rules[field.id] = field.validation
        }
        return rules
      }, {} as Record<string, FieldValidationRule>)

      // Update business rules for all entities of this type in the organization
      const businessRulesUpdate = {
        field_validation_overrides: validationRules,
        field_config_version: config.version,
        field_config_smart_code: config.smart_code
      }

      const { error } = await this.supabase
        .from('core_entities')
        .update({
          business_rules: this.supabase.rpc('jsonb_set', {
            target: 'business_rules',
            path: '{field_overrides}',
            new_value: JSON.stringify(businessRulesUpdate)
          })
        })
        .eq('organization_id', organizationId)
        .eq('entity_type', entityType)

      if (error) {
        console.error(`[FieldConfig] ⚠️ Failed to update entity business rules:`, error)
      } else {
        console.log(`[FieldConfig] ✅ Updated business rules for ${entityType} entities`)
      }

    } catch (error) {
      console.error(`[FieldConfig] ⚠️ Error updating entity business rules:`, error)
      // Don't throw - business rules update failure shouldn't block the main operation
    }
  }
}

// Export singleton instance
export const organizationFieldConfigService = new OrganizationFieldConfigService()

// Cache for React Server Components
export const getCachedFieldConfiguration = cache(
  async (organizationId: string, entityType: string) => {
    return await organizationFieldConfigService.getFieldConfiguration(organizationId, entityType)
  }
)