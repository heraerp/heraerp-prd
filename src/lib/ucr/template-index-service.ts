/**
 * UCR Template Index Service
 * Manages the central catalog of UCR templates across all industries
 * Uses core_entities and core_dynamic_data for storage
 */

import { getSupabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface UCRTemplateEntry {
  template_id: string
  industry: string
  name: string
  description: string
  rule_families: string[]
  smart_code: string
  version: string
  status: 'active' | 'deprecated' | 'draft'
  created_at?: string
  updated_at?: string
}

export interface UCRTemplateIndex {
  version: string
  last_updated: string
  templates: UCRTemplateEntry[]
}

export class UCRTemplateIndexService {
  private static instance: UCRTemplateIndexService
  private indexEntityId?: string

  static getInstance(): UCRTemplateIndexService {
    if (!this.instance) {
      this.instance = new UCRTemplateIndexService()
    }
    return this.instance
  }

  /**
   * Initialize or get the template index entity
   */
  async ensureIndexEntity(organizationId: string): Promise<string> {
    const supabase = getSupabase()
    
    // Check if index entity exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'ucr_template_index')
      .eq('organization_id', organizationId)
      .single()

    if (existing) {
      this.indexEntityId = existing.id
      return existing.id
    }

    // Create index entity
    const { data: newEntity, error } = await supabase
      .from('core_entities')
      .insert({
        id: uuidv4(),
        entity_type: 'ucr_template_index',
        entity_name: 'UCR Template Master Index',
        entity_code: 'UCR-TEMPLATE-INDEX-001',
        smart_code: 'HERA.UCR.TEMPLATE.INDEX.MASTER.v1',
        organization_id: organizationId,
        metadata: {
          description: 'Central catalog of all UCR templates across industries',
          version: '1.0.0'
        }
      })
      .select('id')
      .single()

    if (error) throw error
    
    this.indexEntityId = newEntity.id

    // Initialize with default templates
    await this.initializeDefaultTemplates(newEntity.id, organizationId)

    return newEntity.id
  }

  /**
   * Initialize default industry templates
   */
  private async initializeDefaultTemplates(entityId: string, organizationId: string) {
    const defaultTemplates: UCRTemplateEntry[] = [
      // Salon Templates
      {
        template_id: 'ucr-salon-complete-v1',
        industry: 'salon',
        name: 'Salon Complete Business Rules',
        description: 'Comprehensive rule set for salon operations including booking, pricing, and notifications',
        rule_families: ['BOOKING', 'PRICING', 'NOTIFICATION', 'WORKFLOW', 'VALIDATION'],
        smart_code: 'HERA.UCR.TEMPLATE.SALON.COMPLETE.v1',
        version: '1.0.0',
        status: 'active'
      },
      {
        template_id: 'ucr-salon-booking-v1',
        industry: 'salon',
        name: 'Salon Booking Management',
        description: 'Advanced booking rules with double-booking prevention and peak hour management',
        rule_families: ['BOOKING', 'VALIDATION'],
        smart_code: 'HERA.UCR.TEMPLATE.SALON.BOOKING.v1',
        version: '1.0.0',
        status: 'active'
      },

      // Restaurant Templates
      {
        template_id: 'ucr-restaurant-complete-v1',
        industry: 'restaurant',
        name: 'Restaurant Complete Business Rules',
        description: 'Full restaurant management rules including orders, pricing, and kitchen workflow',
        rule_families: ['ORDER', 'PRICING', 'INVENTORY', 'WORKFLOW', 'NOTIFICATION'],
        smart_code: 'HERA.UCR.TEMPLATE.RESTAURANT.COMPLETE.v1',
        version: '1.0.0',
        status: 'active'
      },
      {
        template_id: 'ucr-restaurant-happyhour-v1',
        industry: 'restaurant',
        name: 'Restaurant Happy Hour Pricing',
        description: 'Dynamic pricing rules for happy hour and special promotions',
        rule_families: ['PRICING'],
        smart_code: 'HERA.UCR.TEMPLATE.RESTAURANT.HAPPYHOUR.v1',
        version: '1.0.0',
        status: 'active'
      },

      // Healthcare Templates
      {
        template_id: 'ucr-healthcare-complete-v1',
        industry: 'healthcare',
        name: 'Healthcare Complete Business Rules',
        description: 'Comprehensive healthcare rules including appointments, insurance, and compliance',
        rule_families: ['APPOINTMENT', 'INSURANCE', 'COMPLIANCE', 'WORKFLOW', 'NOTIFICATION'],
        smart_code: 'HERA.UCR.TEMPLATE.HEALTHCARE.COMPLETE.v1',
        version: '1.0.0',
        status: 'active'
      },
      {
        template_id: 'ucr-healthcare-insurance-v1',
        industry: 'healthcare',
        name: 'Healthcare Insurance Processing',
        description: 'Insurance verification and pre-authorization workflow rules',
        rule_families: ['INSURANCE', 'WORKFLOW'],
        smart_code: 'HERA.UCR.TEMPLATE.HEALTHCARE.INSURANCE.v1',
        version: '1.0.0',
        status: 'active'
      },

      // Retail Templates
      {
        template_id: 'ucr-retail-complete-v1',
        industry: 'retail',
        name: 'Retail Complete Business Rules',
        description: 'Full retail management including inventory, pricing, and loyalty programs',
        rule_families: ['INVENTORY', 'PRICING', 'LOYALTY', 'PROMOTION', 'NOTIFICATION'],
        smart_code: 'HERA.UCR.TEMPLATE.RETAIL.COMPLETE.v1',
        version: '1.0.0',
        status: 'active'
      },
      {
        template_id: 'ucr-retail-loyalty-v1',
        industry: 'retail',
        name: 'Retail Loyalty Program',
        description: 'Customer loyalty tiers, points accumulation, and rewards',
        rule_families: ['LOYALTY', 'PRICING'],
        smart_code: 'HERA.UCR.TEMPLATE.RETAIL.LOYALTY.v1',
        version: '1.0.0',
        status: 'active'
      },

      // Manufacturing Templates
      {
        template_id: 'ucr-manufacturing-complete-v1',
        industry: 'manufacturing',
        name: 'Manufacturing Complete Business Rules',
        description: 'Production planning, quality control, and supply chain management',
        rule_families: ['PRODUCTION', 'QUALITY', 'INVENTORY', 'SUPPLY_CHAIN', 'WORKFLOW'],
        smart_code: 'HERA.UCR.TEMPLATE.MANUFACTURING.COMPLETE.v1',
        version: '1.0.0',
        status: 'active'
      },
      {
        template_id: 'ucr-manufacturing-quality-v1',
        industry: 'manufacturing',
        name: 'Manufacturing Quality Control',
        description: 'Quality assurance rules, defect tracking, and compliance',
        rule_families: ['QUALITY', 'COMPLIANCE'],
        smart_code: 'HERA.UCR.TEMPLATE.MANUFACTURING.QUALITY.v1',
        version: '1.0.0',
        status: 'active'
      }
    ]

    const index: UCRTemplateIndex = {
      version: '1.0.0',
      last_updated: new Date().toISOString(),
      templates: defaultTemplates
    }

    await this.saveIndex(entityId, organizationId, index)
  }

  /**
   * Save template index to core_dynamic_data
   */
  private async saveIndex(entityId: string, organizationId: string, index: UCRTemplateIndex) {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('core_dynamic_data')
      .upsert({
        id: uuidv4(),
        entity_id: entityId,
        field_name: 'template_index',
        field_value_text: JSON.stringify(index),
        field_type: 'json',
        smart_code: 'HERA.UCR.TEMPLATE.INDEX.DATA.v1',
        organization_id: organizationId,
        metadata: {
          version: index.version,
          template_count: index.templates.length,
          last_updated: index.last_updated
        }
      })

    if (error) throw error
  }

  /**
   * Get template index
   */
  async getTemplateIndex(organizationId: string, filters?: {
    industry?: string
    rule_family?: string
    status?: string
  }): Promise<UCRTemplateIndex> {
    const entityId = await this.ensureIndexEntity(organizationId)
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', entityId)
      .eq('field_name', 'template_index')
      .single()

    if (error) throw error

    const index: UCRTemplateIndex = JSON.parse(data.field_value_text)

    // Apply filters if provided
    if (filters) {
      let filteredTemplates = [...index.templates]

      if (filters.industry) {
        filteredTemplates = filteredTemplates.filter(t => t.industry === filters.industry)
      }

      if (filters.rule_family) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.rule_families.includes(filters.rule_family!)
        )
      }

      if (filters.status) {
        filteredTemplates = filteredTemplates.filter(t => t.status === filters.status)
      }

      return {
        ...index,
        templates: filteredTemplates
      }
    }

    return index
  }

  /**
   * Get template by ID
   */
  async getTemplateById(organizationId: string, templateId: string): Promise<UCRTemplateEntry | null> {
    const index = await this.getTemplateIndex(organizationId)
    return index.templates.find(t => t.template_id === templateId) || null
  }

  /**
   * Add or update template
   */
  async upsertTemplate(organizationId: string, template: UCRTemplateEntry): Promise<void> {
    const index = await this.getTemplateIndex(organizationId)
    
    const existingIndex = index.templates.findIndex(t => t.template_id === template.template_id)
    
    if (existingIndex >= 0) {
      // Update existing
      index.templates[existingIndex] = {
        ...template,
        updated_at: new Date().toISOString()
      }
    } else {
      // Add new
      index.templates.push({
        ...template,
        created_at: new Date().toISOString()
      })
    }

    index.last_updated = new Date().toISOString()
    
    const entityId = await this.ensureIndexEntity(organizationId)
    await this.saveIndex(entityId, organizationId, index)
  }

  /**
   * Get templates grouped by industry
   */
  async getTemplatesByIndustry(organizationId: string): Promise<Record<string, UCRTemplateEntry[]>> {
    const index = await this.getTemplateIndex(organizationId)
    
    return index.templates.reduce((acc, template) => {
      if (!acc[template.industry]) {
        acc[template.industry] = []
      }
      acc[template.industry].push(template)
      return acc
    }, {} as Record<string, UCRTemplateEntry[]>)
  }

  /**
   * Search templates
   */
  async searchTemplates(organizationId: string, query: string): Promise<UCRTemplateEntry[]> {
    const index = await this.getTemplateIndex(organizationId)
    const lowerQuery = query.toLowerCase()
    
    return index.templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.industry.toLowerCase().includes(lowerQuery) ||
      template.rule_families.some(rf => rf.toLowerCase().includes(lowerQuery))
    )
  }
}

export const ucrTemplateIndex = UCRTemplateIndexService.getInstance()