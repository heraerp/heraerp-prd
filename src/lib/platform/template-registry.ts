/**
 * HERA v3.0 Template Pack Registry
 * Manages loading, validation, and compilation of industry template packs
 */

import { createClient } from '@/lib/supabase/client'
import { 
  type IndustryType,
  TEMPLATE_PACKS,
  getTemplatePack 
} from './constants'

export interface TemplatePack {
  pack_id: string
  pack_version: string
  pack_name: string
  description: string
  industry: IndustryType
  author: string
  license: string
  created_at: string
  updated_at: string
  
  entities: string[]
  transactions: string[]
  relationships: string[]
  dashboards: string[]
  workflows: string[]
  
  posting_bundle?: string
  chart_of_accounts?: string
  
  navigation: NavigationConfig
  branding: BrandingConfig
  features: Record<string, boolean>
  configuration: Record<string, any>
  
  dependencies: string[]
  compatibility: {
    hera_version: string
    required_modules: string[]
    optional_modules: string[]
  }
}

export interface NavigationConfig {
  sections: NavigationSection[]
}

export interface NavigationSection {
  id: string
  label: string
  icon: string
  order: number
  items: NavigationItem[]
}

export interface NavigationItem {
  label: string
  route: string
  icon: string
  badge?: string
  permissions?: string[]
}

export interface BrandingConfig {
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  theme: 'light' | 'dark'
}

export interface EntityTemplate {
  template_id: string
  template_name: string
  template_version: string
  entity_type: string
  smart_code_prefix: string
  description: string
  
  standard_fields: Record<string, FieldConfig>
  dynamic_fields: DynamicFieldConfig[]
  
  ui_config: {
    form_view: FormViewConfig
    list_view: ListViewConfig
    card_view: CardViewConfig
  }
  
  business_rules: BusinessRulesConfig
  relationships: RelationshipsConfig
  reporting: ReportingConfig
  integration: IntegrationConfig
}

export interface FieldConfig {
  label: string
  required: boolean
  placeholder?: string
  validation?: Record<string, any>
  auto_generate?: {
    pattern: string
  }
}

export interface DynamicFieldConfig {
  field_name: string
  field_type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'boolean' | 'json'
  label: string
  required?: boolean
  default?: any
  validation_rules?: Record<string, any>
  ui_hints?: Record<string, any>
  smart_code: string
}

export interface FormViewConfig {
  tabs: FormTab[]
}

export interface FormTab {
  id: string
  label: string
  icon: string
  fields: string[]
  component?: string
  relationship_type?: string
}

export interface ListViewConfig {
  columns: ListColumn[]
  default_sort: { field: string; direction: 'asc' | 'desc' }
  page_size: number
}

export interface ListColumn {
  field: string
  label: string
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  format?: string
}

export interface CardViewConfig {
  mobile_fields: string[]
  card_template: string
}

export interface BusinessRulesConfig {
  duplicate_detection?: {
    enabled: boolean
    fields: string[]
    fuzzy_matching?: boolean
  }
  audit_trail?: {
    enabled: boolean
    track_changes?: boolean
    retention_days?: number
  }
  validation?: {
    required_fields: string[]
    custom_validation?: string
  }
  workflows?: Record<string, string>
}

export interface RelationshipsConfig {
  allowed_types: string[]
  required_relationships?: Array<{
    type: string
    min: number
    max?: number
  }>
}

export interface ReportingConfig {
  kpi_metrics: Array<{
    metric: string
    label: string
  }>
  standard_reports: string[]
}

export interface IntegrationConfig {
  external_systems?: Record<string, any>
  webhooks?: Record<string, string>
}

/**
 * Template Pack Registry Class
 */
export class TemplatePackRegistry {
  private supabase = createClient()
  private cache = new Map<string, TemplatePack>()
  private entityTemplateCache = new Map<string, EntityTemplate>()

  /**
   * Load template pack by industry
   */
  async loadTemplatePack(industry: IndustryType): Promise<TemplatePack | null> {
    const packId = getTemplatePack(industry)
    
    // Check cache first
    if (this.cache.has(packId)) {
      return this.cache.get(packId)!
    }

    try {
      // Phase 2: Load from Supabase Storage with fallback to local files
      const { templateStorage } = await import('./template-storage')
      const pack = await templateStorage.loadTemplatePack(industry)
      
      if (pack) {
        this.cache.set(packId, pack)
        console.log(`✅ Loaded template pack: ${packId}`)
      }
      
      return pack
    } catch (error) {
      console.error(`❌ Failed to load template pack ${packId}:`, error)
      return null
    }
  }

  /**
   * Load entity template
   */
  async loadEntityTemplate(
    industry: IndustryType, 
    templateId: string
  ): Promise<EntityTemplate | null> {
    const cacheKey = `${industry}_${templateId}`
    
    // Check cache first
    if (this.entityTemplateCache.has(cacheKey)) {
      return this.entityTemplateCache.get(cacheKey)!
    }

    try {
      // Phase 2: Load from Supabase Storage with fallback to local files
      const { templateStorage } = await import('./template-storage')
      const template = await templateStorage.loadEntityTemplate(industry, templateId)
      
      if (template) {
        this.entityTemplateCache.set(cacheKey, template)
        console.log(`✅ Loaded entity template: ${templateId}`)
      }
      
      return template
    } catch (error) {
      console.error(`❌ Failed to load entity template ${templateId}:`, error)
      return null
    }
  }

  /**
   * Get available template packs
   */
  async getAvailableTemplatePacks(): Promise<TemplatePack[]> {
    const packs: TemplatePack[] = []
    
    // Load all industry template packs
    for (const industry of Object.values(TEMPLATE_PACKS)) {
      const pack = await this.loadTemplatePack(industry as IndustryType)
      if (pack) {
        packs.push(pack)
      }
    }
    
    return packs
  }

  /**
   * Validate template pack compatibility
   */
  validateTemplatePack(pack: TemplatePack): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check HERA version compatibility
    if (!this.isVersionCompatible(pack.compatibility.hera_version, '3.0.0')) {
      errors.push(`Incompatible HERA version: requires ${pack.compatibility.hera_version}`)
    }

    // Check required modules
    const missingModules = pack.compatibility.required_modules.filter(
      module => !this.isModuleAvailable(module)
    )
    if (missingModules.length > 0) {
      errors.push(`Missing required modules: ${missingModules.join(', ')}`)
    }

    // Check smart code format
    if (!pack.pack_id.match(/^[a-z_]+_v\d+$/)) {
      errors.push('Invalid pack ID format')
    }

    // Validate navigation structure
    if (!pack.navigation?.sections || pack.navigation.sections.length === 0) {
      warnings.push('No navigation sections defined')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Generate navigation from template pack
   */
  generateNavigation(pack: TemplatePack): NavigationConfig {
    // Return the navigation config from the pack
    // In the future, this could include dynamic generation based on entities
    return pack.navigation
  }

  /**
   * Apply template pack branding
   */
  applyBranding(pack: TemplatePack): void {
    const { branding } = pack
    
    // Apply CSS variables
    const root = document.documentElement
    root.style.setProperty('--template-primary', branding.primary_color)
    root.style.setProperty('--template-secondary', branding.secondary_color)
    root.style.setProperty('--template-accent', branding.accent_color)
    root.style.setProperty('--template-font', branding.font_family)
    
    console.log(`✅ Applied branding for template pack: ${pack.pack_id}`)
  }

  /**
   * Phase 1: Load template pack from local file
   */
  private async loadTemplatePackFromFile(industry: IndustryType): Promise<TemplatePack | null> {
    try {
      // In a real implementation, this would fetch from the file system or CDN
      // For now, we'll simulate with hardcoded data based on industry
      
      if (industry === 'waste_management') {
        // Return the waste management pack we created
        const response = await fetch('/templates/industries/waste_management/pack.json')
        if (!response.ok) throw new Error('Failed to load pack')
        return await response.json()
      }
      
      if (industry === 'salon_beauty') {
        // Return the salon beauty pack we created
        const response = await fetch('/templates/industries/salon_beauty/pack.json')
        if (!response.ok) throw new Error('Failed to load pack')
        return await response.json()
      }
      
      // For other industries, return a generic pack
      return this.createGenericTemplatePack(industry)
    } catch (error) {
      console.error('Failed to load template pack from file:', error)
      return null
    }
  }

  /**
   * Phase 1: Load entity template from local file
   */
  private async loadEntityTemplateFromFile(
    industry: IndustryType, 
    templateId: string
  ): Promise<EntityTemplate | null> {
    try {
      const response = await fetch(`/templates/industries/${industry}/entities/${templateId}.json`)
      if (!response.ok) throw new Error('Failed to load entity template')
      return await response.json()
    } catch (error) {
      console.error('Failed to load entity template from file:', error)
      return null
    }
  }

  /**
   * Create generic template pack for unsupported industries
   */
  private createGenericTemplatePack(industry: IndustryType): TemplatePack {
    return {
      pack_id: `${industry}_v1`,
      pack_version: '1.0.0',
      pack_name: `${industry.replace('_', ' ')} Solution`,
      description: `Generic template pack for ${industry}`,
      industry,
      author: 'HERA Core Team',
      license: 'MIT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entities: ['customer_v1', 'product_v1', 'order_v1'],
      transactions: ['sale_v1', 'payment_v1'],
      relationships: ['customer_has_order'],
      dashboards: ['revenue_dashboard_v1'],
      workflows: ['order_fulfillment_v1'],
      navigation: {
        sections: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'LayoutDashboard',
            order: 1,
            items: [
              { label: 'Overview', route: '/dashboard', icon: 'BarChart' }
            ]
          },
          {
            id: 'customers',
            label: 'Customers',
            icon: 'Users',
            order: 2,
            items: [
              { label: 'All Customers', route: '/entities/customer', icon: 'Users' }
            ]
          }
        ]
      },
      branding: {
        primary_color: '#3b82f6',
        secondary_color: '#1d4ed8',
        accent_color: '#f59e0b',
        font_family: 'Inter',
        theme: 'light'
      },
      features: {},
      configuration: {},
      dependencies: [],
      compatibility: {
        hera_version: '>=3.0.0',
        required_modules: [],
        optional_modules: []
      }
    }
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(required: string, current: string): boolean {
    // Simple version comparison - would need more robust implementation
    return required.includes('3.0.0')
  }

  /**
   * Check if module is available
   */
  private isModuleAvailable(module: string): boolean {
    // In real implementation, check if module is installed/enabled
    const availableModules = ['finance', 'inventory', 'crm', 'calendar', 'payments', 'communications']
    return availableModules.includes(module)
  }
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Singleton instance
 */
export const templateRegistry = new TemplatePackRegistry()