'use client';

/**
 * HERA Platform Template Manager
 * Smart Code: HERA.PLATFORM.TEMPLATE.MANAGER.v1
 * 
 * Manages app templates and configurations stored in platform organization
 */

import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1';
import { 
  PLATFORM_ORG, 
  PLATFORM_ENTITY_TYPES, 
  generatePlatformEntityCode, 
  generatePlatformSmartCode,
  canAccessPlatformEntity,
  PLATFORM_QUERY_FILTERS
} from './platform-org-constants';
import { HERAAppConfig, HERAAppConfigParser } from '@/lib/app-generator/yaml-parser';

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformTemplate {
  id: string;
  entity_code: string;
  smart_code: string;
  template_name: string;
  template_category: string;
  yaml_configuration: string;
  version: string;
  entities_count: number;
  transactions_count: number;
  workflows_count: number;
  supported_industries: string[];
  estimated_setup_time: string;
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  created_date: string;
  updated_date: string;
}

export interface PlatformComponent {
  id: string;
  entity_code: string;
  smart_code: string;
  component_name: string;
  component_type: string;
  config_schema: Record<string, any>;
  default_config: Record<string, any>;
  usage_examples: Record<string, any>;
  version: string;
  dependencies: string[];
}

export interface TemplateGenerationOptions {
  targetOrganizationId: string;
  customizations?: Record<string, any>;
  replaceValues?: Record<string, string>;
  skipValidation?: boolean;
}

// ============================================================================
// PLATFORM TEMPLATE MANAGER CLASS
// ============================================================================

export class PlatformTemplateManager {
  private platformOrgId = PLATFORM_ORG.ID;
  private templateHook: any;
  private componentHook: any;
  private savedTemplateData: any = null;

  constructor() {
    // For now, we'll simulate the hook functionality
    // In a real implementation, this would use the actual API calls
    this.templateHook = {
      create: async (data: any) => this.simulateEntityCreate(data),
      read: async (id: string) => this.simulateEntityRead(id),
      update: async (id: string, data: any) => this.simulateEntityUpdate(id, data),
      delete: async (id: string) => this.simulateEntityDelete(id),
      query: async (filters: any) => this.simulateEntityQuery(filters)
    };

    this.componentHook = {
      create: async (data: any) => this.simulateEntityCreate(data),
      read: async (id: string) => this.simulateEntityRead(id),
      update: async (id: string, data: any) => this.simulateEntityUpdate(id, data),
      delete: async (id: string) => this.simulateEntityDelete(id),
      query: async (filters: any) => this.simulateEntityQuery(filters)
    };
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Save app template to platform organization
   */
  async saveTemplate(
    templateName: string,
    yamlConfig: HERAAppConfig,
    metadata: {
      category?: string;
      supported_industries?: string[];
      complexity_level?: 'beginner' | 'intermediate' | 'advanced';
      estimated_setup_time?: string;
      prerequisites?: string[];
    } = {}
  ): Promise<PlatformTemplate> {
    const entityCode = generatePlatformEntityCode(PLATFORM_ENTITY_TYPES.APP_TEMPLATE, Date.now());
    const smartCode = generatePlatformSmartCode('APP_TEMPLATE', templateName);

    const template = {
      entity_type: PLATFORM_ENTITY_TYPES.APP_TEMPLATE,
      entity_name: `${templateName} Application Template`,
      entity_code: entityCode,
      smart_code: smartCode,
      dynamic_fields: {
        template_name: templateName,
        template_category: metadata.category || 'business',
        yaml_configuration: JSON.stringify(yamlConfig),
        version: yamlConfig.app.version,
        entities_count: yamlConfig.entities.length,
        transactions_count: yamlConfig.transactions.length,
        workflows_count: yamlConfig.workflows.length,
        supported_industries: metadata.supported_industries || [],
        estimated_setup_time: metadata.estimated_setup_time || '30_minutes',
        complexity_level: metadata.complexity_level || 'intermediate',
        prerequisites: metadata.prerequisites || [],
        generated_metadata: {
          app_code: yamlConfig.app.code,
          module_code: yamlConfig.app.module.code,
          created_date: new Date().toISOString(),
          generator_version: 'v1.0.0'
        }
      }
    };

    const result = await this.templateHook.create(template);
    
    return this.mapToTemplate(result);
  }

  /**
   * Load template by ID
   */
  async loadTemplate(templateId: string): Promise<PlatformTemplate> {
    const template = await this.templateHook.read(templateId);
    return this.mapToTemplate(template);
  }

  /**
   * List available templates
   */
  async listTemplates(filters: {
    category?: string;
    industry?: string;
    complexity?: string;
    limit?: number;
  } = {}): Promise<PlatformTemplate[]> {
    const queryFilters = PLATFORM_QUERY_FILTERS.activeOnly(PLATFORM_ENTITY_TYPES.APP_TEMPLATE);

    if (filters.category) {
      queryFilters['dynamic_fields.template_category'] = filters.category;
    }

    if (filters.complexity) {
      queryFilters['dynamic_fields.complexity_level'] = filters.complexity;
    }

    const result = await this.templateHook.query({
      ...queryFilters,
      limit: filters.limit || 50,
      include_dynamic: true
    });

    return result.map((template: any) => this.mapToTemplate(template));
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string, 
    updates: Partial<PlatformTemplate>
  ): Promise<PlatformTemplate> {
    const updateData: any = {};

    if (updates.template_name) updateData['dynamic_fields.template_name'] = updates.template_name;
    if (updates.template_category) updateData['dynamic_fields.template_category'] = updates.template_category;
    if (updates.yaml_configuration) updateData['dynamic_fields.yaml_configuration'] = updates.yaml_configuration;
    if (updates.version) updateData['dynamic_fields.version'] = updates.version;

    const result = await this.templateHook.update(templateId, updateData);
    return this.mapToTemplate(result);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.templateHook.delete(templateId);
  }

  // ============================================================================
  // COMPONENT MANAGEMENT
  // ============================================================================

  /**
   * Save universal component configuration
   */
  async saveComponent(
    componentName: string,
    componentType: string,
    config: {
      schema?: Record<string, any>;
      defaults?: Record<string, any>;
      examples?: Record<string, any>;
      dependencies?: string[];
      version?: string;
    }
  ): Promise<PlatformComponent> {
    const entityCode = generatePlatformEntityCode(PLATFORM_ENTITY_TYPES.UNIVERSAL_COMPONENT, Date.now());
    const smartCode = generatePlatformSmartCode('UNIVERSAL_COMPONENT', componentType);

    const component = {
      entity_type: PLATFORM_ENTITY_TYPES.UNIVERSAL_COMPONENT,
      entity_name: componentName,
      entity_code: entityCode,
      smart_code: smartCode,
      dynamic_fields: {
        component_name: componentName,
        component_type: componentType,
        config_schema: config.schema || {},
        default_config: config.defaults || {},
        usage_examples: config.examples || {},
        dependencies: config.dependencies || [],
        version: config.version || '1.0.0',
        created_date: new Date().toISOString()
      }
    };

    const result = await this.componentHook.create(component);
    return this.mapToComponent(result);
  }

  /**
   * List universal components
   */
  async listComponents(componentType?: string): Promise<PlatformComponent[]> {
    const queryFilters = PLATFORM_QUERY_FILTERS.activeOnly(PLATFORM_ENTITY_TYPES.UNIVERSAL_COMPONENT);

    if (componentType) {
      queryFilters['dynamic_fields.component_type'] = componentType;
    }

    const result = await this.componentHook.query({
      ...queryFilters,
      include_dynamic: true
    });

    return result.map((component: any) => this.mapToComponent(component));
  }

  // ============================================================================
  // APP GENERATION
  // ============================================================================

  /**
   * Generate app from template
   */
  async generateFromTemplate(
    templateId: string,
    options: TemplateGenerationOptions
  ): Promise<{
    success: boolean;
    appConfig: HERAAppConfig;
    generatedComponents: any[];
    errors: string[];
  }> {
    try {
      // Load template
      const template = await this.loadTemplate(templateId);
      
      // Parse YAML configuration
      const parser = new HERAAppConfigParser();
      const yamlConfig = JSON.parse(template.yaml_configuration);
      
      // Apply customizations
      const customizedConfig = this.applyCustomizations(yamlConfig, options);
      
      // Validate configuration
      const validation = await parser.parseYAML(JSON.stringify(customizedConfig));
      
      if (!validation) {
        return {
          success: false,
          appConfig: customizedConfig,
          generatedComponents: [],
          errors: ['Failed to validate customized configuration']
        };
      }

      // Generate app structure
      const appStructure = parser.generateAppStructure(options.targetOrganizationId);
      
      return {
        success: true,
        appConfig: customizedConfig,
        generatedComponents: appStructure.components,
        errors: []
      };
      
    } catch (error) {
      return {
        success: false,
        appConfig: {} as HERAAppConfig,
        generatedComponents: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Clone template with modifications
   */
  async cloneTemplate(
    sourceTemplateId: string,
    newTemplateName: string,
    modifications: Record<string, any> = {}
  ): Promise<PlatformTemplate> {
    const sourceTemplate = await this.loadTemplate(sourceTemplateId);
    const yamlConfig = JSON.parse(sourceTemplate.yaml_configuration);
    
    // Apply modifications
    const modifiedConfig = { ...yamlConfig, ...modifications };
    modifiedConfig.app.name = newTemplateName;
    modifiedConfig.app.code = newTemplateName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Save as new template
    return await this.saveTemplate(newTemplateName, modifiedConfig, {
      category: sourceTemplate.template_category,
      complexity_level: sourceTemplate.complexity_level,
      supported_industries: sourceTemplate.supported_industries
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private mapToTemplate(entity: any): PlatformTemplate {
    return {
      id: entity.id,
      entity_code: entity.entity_code,
      smart_code: entity.smart_code,
      template_name: entity.dynamic_fields?.template_name || entity.entity_name,
      template_category: entity.dynamic_fields?.template_category || 'business',
      yaml_configuration: entity.dynamic_fields?.yaml_configuration || '{}',
      version: entity.dynamic_fields?.version || '1.0.0',
      entities_count: entity.dynamic_fields?.entities_count || 0,
      transactions_count: entity.dynamic_fields?.transactions_count || 0,
      workflows_count: entity.dynamic_fields?.workflows_count || 0,
      supported_industries: entity.dynamic_fields?.supported_industries || [],
      estimated_setup_time: entity.dynamic_fields?.estimated_setup_time || '30_minutes',
      complexity_level: entity.dynamic_fields?.complexity_level || 'intermediate',
      created_date: entity.created_at || new Date().toISOString(),
      updated_date: entity.updated_at || new Date().toISOString()
    };
  }

  private mapToComponent(entity: any): PlatformComponent {
    return {
      id: entity.id,
      entity_code: entity.entity_code,
      smart_code: entity.smart_code,
      component_name: entity.dynamic_fields?.component_name || entity.entity_name,
      component_type: entity.dynamic_fields?.component_type || 'unknown',
      config_schema: entity.dynamic_fields?.config_schema || {},
      default_config: entity.dynamic_fields?.default_config || {},
      usage_examples: entity.dynamic_fields?.usage_examples || {},
      version: entity.dynamic_fields?.version || '1.0.0',
      dependencies: entity.dynamic_fields?.dependencies || []
    };
  }

  private applyCustomizations(
    yamlConfig: HERAAppConfig, 
    options: TemplateGenerationOptions
  ): HERAAppConfig {
    const customized = JSON.parse(JSON.stringify(yamlConfig)); // Deep clone
    
    // Update organization ID
    customized.app.organization.id = options.targetOrganizationId;
    
    // Apply custom replacements
    if (options.replaceValues) {
      const configString = JSON.stringify(customized);
      let replacedString = configString;
      
      Object.entries(options.replaceValues).forEach(([key, value]) => {
        replacedString = replacedString.replace(new RegExp(key, 'g'), value);
      });
      
      return JSON.parse(replacedString);
    }
    
    // Apply customizations
    if (options.customizations) {
      Object.entries(options.customizations).forEach(([path, value]) => {
        this.setNestedValue(customized, path, value);
      });
    }
    
    return customized;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if user can access platform templates
   */
  canAccess(userRole: string, operation: 'read' | 'write' | 'admin' = 'read'): boolean {
    return canAccessPlatformEntity(userRole, operation);
  }

  // ============================================================================
  // SIMULATION METHODS (for development/testing)
  // ============================================================================

  private async simulateEntityCreate(data: any): Promise<any> {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = {
      id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store the template data for later retrieval
    this.savedTemplateData = result;
    
    // In a real implementation, this would make an API call
    console.log(`  ✅ Simulated entity creation: ${id}`);
    
    return result;
  }

  private async simulateEntityRead(id: string): Promise<any> {
    // In simulation mode, return the saved template data if it exists
    if (this.savedTemplateData && id === this.savedTemplateData.id) {
      const result = {
        ...this.savedTemplateData,
        template_name: this.savedTemplateData.dynamic_fields?.template_name || 'CRM Sales & Lead Management',
        template_category: this.savedTemplateData.dynamic_fields?.template_category || 'crm_sales',
        yaml_configuration: this.savedTemplateData.dynamic_fields?.yaml_configuration || '{}',
        version: this.savedTemplateData.dynamic_fields?.version || '1.0.0',
        entities_count: this.savedTemplateData.dynamic_fields?.entities_count || 6,
        transactions_count: this.savedTemplateData.dynamic_fields?.transactions_count || 3,
        workflows_count: this.savedTemplateData.dynamic_fields?.workflows_count || 2
      };
      
      console.log(`  ✅ Simulated entity read: ${id}`);
      return result;
    }
    
    // Fallback for unknown IDs
    const result = {
      id,
      entity_type: PLATFORM_ENTITY_TYPES.APP_TEMPLATE,
      entity_code: `TEMPLATE-${Date.now()}`,
      smart_code: generatePlatformSmartCode('APP_TEMPLATE', 'TEST'),
      organization_id: this.platformOrgId,
      dynamic_fields: {
        template_name: 'Test Template',
        template_category: 'business',
        yaml_configuration: '{}',
        version: '1.0.0',
        entities_count: 6,
        transactions_count: 3,
        workflows_count: 2
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`  ✅ Simulated entity read: ${id}`);
    
    return result;
  }

  private async simulateEntityUpdate(id: string, data: any): Promise<any> {
    // In a real implementation, this would make an API call
    const result = {
      id,
      ...data,
      updated_at: new Date().toISOString()
    };
    
    console.log(`  ✅ Simulated entity update: ${id}`);
    
    return result;
  }

  private async simulateEntityDelete(id: string): Promise<void> {
    // In a real implementation, this would make an API call
    console.log(`  ✅ Simulated entity deletion: ${id}`);
  }

  private async simulateEntityQuery(filters: any): Promise<any[]> {
    // In a real implementation, this would make an API call
    const results = [
      {
        id: `template_${Date.now()}_1`,
        entity_type: filters.entity_type || PLATFORM_ENTITY_TYPES.APP_TEMPLATE,
        entity_code: `TEMPLATE-${Date.now()}`,
        dynamic_fields: {
          template_name: 'Sample Template',
          template_category: filters['dynamic_fields.template_category'] || 'business'
        }
      }
    ];
    
    console.log(`  ✅ Simulated entity query: ${results.length} results`);
    
    return results;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new platform template manager instance
 */
export function createPlatformTemplateManager(): PlatformTemplateManager {
  return new PlatformTemplateManager();
}

/**
 * Get predefined template categories
 */
export function getTemplateCategories(): string[] {
  return ['business', 'financial', 'operational', 'industry_specific', 'compliance', 'analytics'];
}

/**
 * Get predefined complexity levels
 */
export function getComplexityLevels(): Array<{ value: string; label: string; description: string }> {
  return [
    {
      value: 'beginner',
      label: 'Beginner',
      description: 'Simple apps with 1-3 entities, basic workflows'
    },
    {
      value: 'intermediate',
      label: 'Intermediate', 
      description: 'Standard business apps with 4-10 entities, multiple workflows'
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'Complex enterprise apps with 10+ entities, advanced integrations'
    }
  ];
}

export default PlatformTemplateManager;