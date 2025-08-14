/**
 * Deal Pipeline Configuration Service
 * 
 * Manages organization-specific deal pipeline configurations using HERA's universal 6-table architecture.
 * Stores pipeline configs as core_entities with dynamic data for flexibility.
 */

import { heraApi } from './hera-api'

export interface PipelineStage {
  id: string
  name: string
  color: string
  icon?: React.ReactNode
  description: string
  order: number
}

export interface PipelineConfig {
  id?: string
  organizationId: string
  template: 'simple' | 'standard' | 'enterprise' | 'custom'
  stages: PipelineStage[]
  customStages?: PipelineStage[]
  createdAt: string
  updatedAt: string
}

// Default templates
export const PIPELINE_TEMPLATES = {
  simple: {
    name: 'Simple Pipeline',
    description: 'Steve Jobs style - Essential stages only',
    complexity: 'Beginner',
    recommended: 'Startups, Small Teams',
    stages: [
      { id: 'interested', name: 'Interested', color: 'bg-blue-500', description: 'They want to learn more', order: 1 },
      { id: 'proposal', name: 'Proposal Sent', color: 'bg-orange-500', description: 'Waiting for their decision', order: 2 },
      { id: 'won', name: 'Deal Won', color: 'bg-green-500', description: 'Success! New customer', order: 3 }
    ]
  },
  standard: {
    name: 'Standard Pipeline',
    description: 'Balanced approach with qualification',
    complexity: 'Intermediate', 
    recommended: 'Growing Companies, Sales Teams',
    stages: [
      { id: 'lead', name: 'Lead', color: 'bg-gray-500', description: 'Initial contact made', order: 1 },
      { id: 'qualified', name: 'Qualified', color: 'bg-blue-500', description: 'Meets our criteria', order: 2 },
      { id: 'proposal', name: 'Proposal', color: 'bg-orange-500', description: 'Proposal submitted', order: 3 },
      { id: 'won', name: 'Won', color: 'bg-green-500', description: 'Deal closed successfully', order: 4 }
    ]
  },
  enterprise: {
    name: 'Enterprise Pipeline',
    description: 'Comprehensive tracking for complex sales',
    complexity: 'Advanced',
    recommended: 'Large Companies, Enterprise Sales',
    stages: [
      { id: 'lead', name: 'Lead', color: 'bg-gray-500', description: 'Initial contact made', order: 1 },
      { id: 'qualified', name: 'Qualified', color: 'bg-blue-500', description: 'Meets criteria & budget', order: 2 },
      { id: 'discovery', name: 'Discovery', color: 'bg-purple-500', description: 'Understanding needs', order: 3 },
      { id: 'proposal', name: 'Proposal', color: 'bg-orange-500', description: 'Formal proposal sent', order: 4 },
      { id: 'won', name: 'Won', color: 'bg-green-500', description: 'Deal closed & signed', order: 5 }
    ]
  }
}

class DealPipelineService {
  /**
   * Get pipeline configuration for an organization
   */
  async getPipelineConfig(organizationId: string): Promise<PipelineConfig | null> {
    try {
      // First try to get from HERA universal tables
      const entities = await heraApi.getEntities('deal_pipeline_config')
      const orgConfig = entities.find((entity: any) => entity.organization_id === organizationId)
      
      if (orgConfig) {
        // Get dynamic data for the configuration
        const dynamicData = await heraApi.getDynamicData(orgConfig.id, [
          'template',
          'stages_config',
          'custom_stages',
          'created_at',
          'updated_at'
        ])
        
        return {
          id: orgConfig.id,
          organizationId,
          template: dynamicData.template || 'simple',
          stages: JSON.parse(dynamicData.stages_config || '[]'),
          customStages: dynamicData.custom_stages ? JSON.parse(dynamicData.custom_stages) : null,
          createdAt: dynamicData.created_at || new Date().toISOString(),
          updatedAt: dynamicData.updated_at || new Date().toISOString()
        }
      }
      
      // Fallback to localStorage for demo/development
      const saved = localStorage.getItem(`deal-config-${organizationId}`)
      if (saved) {
        return JSON.parse(saved)
      }
      
      return null
    } catch (error) {
      console.error('Failed to load pipeline config:', error)
      
      // Fallback to localStorage
      const saved = localStorage.getItem(`deal-config-${organizationId}`)
      if (saved) {
        return JSON.parse(saved)
      }
      
      return null
    }
  }

  /**
   * Save pipeline configuration for an organization
   */
  async savePipelineConfig(config: PipelineConfig): Promise<void> {
    try {
      const configData = {
        entity_type: 'deal_pipeline_config',
        entity_name: `Deal Pipeline - ${config.template}`,
        entity_code: `PIPELINE-${config.organizationId}`,
        organization_id: config.organizationId,
        status: 'active'
      }

      let entityId = config.id

      if (config.id) {
        // Update existing configuration
        await heraApi.updateEntity(config.id, configData)
      } else {
        // Create new configuration
        const entity = await heraApi.createEntity(configData)
        entityId = entity.id
      }

      // Save dynamic data
      const dynamicFields = [
        { field_name: 'template', field_value: config.template },
        { field_name: 'stages_config', field_value: JSON.stringify(config.stages) },
        { field_name: 'custom_stages', field_value: config.customStages ? JSON.stringify(config.customStages) : null },
        { field_name: 'created_at', field_value: config.createdAt },
        { field_name: 'updated_at', field_value: new Date().toISOString() }
      ]

      for (const field of dynamicFields) {
        await heraApi.updateDynamicData(entityId!, field.field_name, field.field_value)
      }

      // Also save to localStorage as backup
      localStorage.setItem(`deal-config-${config.organizationId}`, JSON.stringify({
        ...config,
        id: entityId,
        updatedAt: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Failed to save pipeline config:', error)
      
      // Fallback to localStorage
      localStorage.setItem(`deal-config-${config.organizationId}`, JSON.stringify({
        ...config,
        updatedAt: new Date().toISOString()
      }))
    }
  }

  /**
   * Get default configuration for a template
   */
  getTemplateConfig(template: keyof typeof PIPELINE_TEMPLATES, organizationId: string): PipelineConfig {
    const templateData = PIPELINE_TEMPLATES[template]
    
    return {
      organizationId,
      template,
      stages: templateData.stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Create custom pipeline configuration
   */
  createCustomConfig(stages: PipelineStage[], organizationId: string): PipelineConfig {
    return {
      organizationId,
      template: 'custom',
      stages: stages.map((stage, index) => ({ ...stage, order: index + 1 })),
      customStages: stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get all organizations using a specific template
   */
  async getOrganizationsByTemplate(template: string): Promise<string[]> {
    try {
      const entities = await heraApi.getEntities('deal_pipeline_config')
      const orgIds = []
      
      for (const entity of entities) {
        const dynamicData = await heraApi.getDynamicData(entity.id, ['template'])
        if (dynamicData.template === template) {
          orgIds.push(entity.organization_id)
        }
      }
      
      return orgIds
    } catch (error) {
      console.error('Failed to get organizations by template:', error)
      return []
    }
  }

  /**
   * Migration helper - migrate organizations to new template
   */
  async migratePipelineTemplate(organizationId: string, newTemplate: keyof typeof PIPELINE_TEMPLATES): Promise<void> {
    const currentConfig = await this.getPipelineConfig(organizationId)
    const newConfig = this.getTemplateConfig(newTemplate, organizationId)
    
    if (currentConfig) {
      newConfig.id = currentConfig.id
      newConfig.createdAt = currentConfig.createdAt
    }
    
    await this.savePipelineConfig(newConfig)
  }
}

// Export singleton instance
export const dealPipelineService = new DealPipelineService()

// HERA Smart Code for pipeline configuration
export const PIPELINE_SMART_CODES = {
  SIMPLE_PIPELINE: 'HERA.DEAL.PIPELINE.SIMPLE.v1',
  STANDARD_PIPELINE: 'HERA.DEAL.PIPELINE.STANDARD.v1', 
  ENTERPRISE_PIPELINE: 'HERA.DEAL.PIPELINE.ENTERPRISE.v1',
  CUSTOM_PIPELINE: 'HERA.DEAL.PIPELINE.CUSTOM.v1',
  PIPELINE_CONFIG: 'HERA.DEAL.CONFIG.PIPELINE.v1'
}