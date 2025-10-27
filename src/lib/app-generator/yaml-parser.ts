'use client';

/**
 * HERA App YAML Configuration Parser
 * Smart Code: HERA.LIB.APP.YAML_PARSER.v1
 * 
 * Parses and validates YAML app configurations for HERA applications
 * Generates complete app structure from configuration
 */

import { z } from 'zod';
import { PLATFORM_ORG, generatePlatformEntityCode, generatePlatformSmartCode } from '@/lib/platform/platform-org-constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HERAAppConfig {
  app: AppDefinition;
  entities: EntityDefinition[];
  transactions: TransactionDefinition[];
  workflows: WorkflowDefinition[];
  ui: UIConfiguration;
  deployment: DeploymentConfiguration;
  integrations?: IntegrationConfiguration;
  ai_assistance?: AIConfiguration;
  validation?: ValidationConfiguration;
  testing?: TestingConfiguration;
}

export interface AppDefinition {
  name: string;
  code: string;
  version: string;
  description: string;
  smart_code: string;
  organization: {
    id: string;
    name: string;
  };
  module: {
    code: string;
    icon: string;
    color: string;
    category: string;
  };
}

export interface EntityDefinition {
  entity_type: string;
  entity_name: string;
  description: string;
  smart_code: string;
  icon: string;
  core_fields?: CoreFieldDefinition;
  dynamic_fields: DynamicFieldDefinition[];
  relationships: RelationshipDefinition[];
}

export interface DynamicFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'json';
  required: boolean;
  smart_code: string;
  options?: string[];
  default?: any;
  min?: number;
  max?: number;
  max_length?: number;
  pattern?: string;
  schema?: Record<string, any>;
}

export interface RelationshipDefinition {
  type: string;
  target_entity: string;
  cardinality: 'one' | 'many';
  smart_code: string;
  required?: boolean;
}

export interface TransactionDefinition {
  transaction_type: string;
  transaction_name: string;
  description: string;
  smart_code: string;
  category: string;
  line_types: TransactionLineDefinition[];
  validation_rules?: ValidationRule[];
  balancing_rules?: BalancingRule[];
}

export interface TransactionLineDefinition {
  name: string;
  description: string;
  required: boolean;
  smart_code: string;
  account_type?: string;
  side?: 'DR' | 'CR';
}

export interface WorkflowDefinition {
  workflow_name: string;
  workflow_code: string;
  description: string;
  smart_code: string;
  trigger_entity: string;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowStepDefinition {
  step_name: string;
  step_code: string;
  description: string;
  actor_role: string;
  ai_assistance?: boolean;
  auto_execute?: boolean;
  transaction_type?: string;
  condition?: string;
}

export interface UIConfiguration {
  dashboard: DashboardConfig;
  navigation: NavigationConfig[];
  list_views: Record<string, ListViewConfig>;
}

export interface DashboardConfig {
  title: string;
  layout: string;
  refresh_interval: number;
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  type: 'metric' | 'chart';
  title: string;
  entity?: string;
  calculation: 'count' | 'sum' | 'avg';
  field?: string;
  filter?: string;
  color?: string;
  chart_type?: string;
  group_by?: string;
  timeframe?: string;
}

export interface NavigationConfig {
  section: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  label: string;
  entity?: string;
  view: 'list' | 'create' | 'custom';
  component?: string;
  icon: string;
}

export interface ListViewConfig {
  columns: ColumnConfig[];
  filters: FilterConfig[];
}

export interface ColumnConfig {
  field: string;
  title: string;
  sortable?: boolean;
  searchable?: boolean;
  filter?: boolean;
  format?: 'currency' | 'date' | 'number';
}

export interface FilterConfig {
  field: string;
  type: 'select' | 'range' | 'date';
  options?: string[];
  min?: number;
  max?: number;
}

export interface DeploymentConfiguration {
  database: {
    required_tables: string[];
  };
  api: {
    base_path: string;
    version: string;
    authentication: string;
  };
  permissions: {
    roles: RoleDefinition[];
  };
}

export interface RoleDefinition {
  role: string;
  permissions: string[];
  entities: string[];
  workflows?: string[];
  conditions?: string[];
}

export interface IntegrationConfiguration {
  external_apis?: ExternalAPIConfig[];
  hera_modules?: HERAModuleConfig[];
}

export interface ExternalAPIConfig {
  name: string;
  type: 'webhook' | 'rpc';
  endpoint: string;
  events: string[];
}

export interface HERAModuleConfig {
  module: string;
  integration_type: 'transaction_sync' | 'entity_relationship';
  sync_transactions?: string[];
  shared_entities?: string[];
}

export interface AIConfiguration {
  features: AIFeature[];
  suggestions: AISuggestion[];
}

export interface AIFeature {
  feature: string;
  description: string;
  entity: string;
  model: string;
}

export interface AISuggestion {
  context: string;
  suggestions: string[];
}

export interface ValidationConfiguration {
  global_rules: ValidationRule[];
  entity_validation: Record<string, ValidationRule[]>;
}

export interface ValidationRule {
  rule: string;
  description: string;
  condition?: string;
  pattern?: string;
  scope?: string;
  severity?: 'error' | 'warning';
}

export interface BalancingRule {
  rule: string;
  description: string;
  condition: string;
}

export interface TestingConfiguration {
  sample_data: Record<string, any[]>;
  test_scenarios: TestScenario[];
}

export interface TestScenario {
  scenario: string;
  description: string;
  steps: string[];
}

export interface CoreFieldDefinition {
  entity_code?: {
    required: boolean;
    pattern?: string;
    auto_generate?: boolean;
    max_length?: number;
  };
  entity_name?: {
    required: boolean;
    max_length?: number;
  };
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const DynamicFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'date', 'json']),
  required: z.boolean(),
  smart_code: z.string(),
  options: z.array(z.string()).optional(),
  default: z.any().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  max_length: z.number().optional(),
  pattern: z.string().optional(),
  schema: z.record(z.any()).optional(),
});

const RelationshipSchema = z.object({
  type: z.string(),
  target_entity: z.string(),
  cardinality: z.enum(['one', 'many']),
  smart_code: z.string(),
  required: z.boolean().optional(),
});

const EntitySchema = z.object({
  entity_type: z.string(),
  entity_name: z.string(),
  description: z.string(),
  smart_code: z.string(),
  icon: z.string(),
  core_fields: z.any().optional(),
  dynamic_fields: z.array(DynamicFieldSchema),
  relationships: z.array(RelationshipSchema),
});

const TransactionLineSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  smart_code: z.string(),
  account_type: z.string().optional(),
  side: z.enum(['DR', 'CR']).optional(),
});

const TransactionSchema = z.object({
  transaction_type: z.string(),
  transaction_name: z.string(),
  description: z.string(),
  smart_code: z.string(),
  category: z.string(),
  line_types: z.array(TransactionLineSchema),
  validation_rules: z.array(z.any()).optional(),
  balancing_rules: z.array(z.any()).optional(),
});

const WorkflowStepSchema = z.object({
  step_name: z.string(),
  step_code: z.string(),
  description: z.string(),
  actor_role: z.string(),
  ai_assistance: z.boolean().optional(),
  auto_execute: z.boolean().optional(),
  transaction_type: z.string().optional(),
  condition: z.string().optional(),
});

const WorkflowSchema = z.object({
  workflow_name: z.string(),
  workflow_code: z.string(),
  description: z.string(),
  smart_code: z.string(),
  trigger_entity: z.string(),
  steps: z.array(WorkflowStepSchema),
});

const AppConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    code: z.string(),
    version: z.string(),
    description: z.string(),
    smart_code: z.string(),
    organization: z.object({
      id: z.string(),
      name: z.string(),
    }),
    module: z.object({
      code: z.string(),
      icon: z.string(),
      color: z.string(),
      category: z.string(),
    }),
  }),
  entities: z.array(EntitySchema),
  transactions: z.array(TransactionSchema),
  workflows: z.array(WorkflowSchema),
  ui: z.any(), // UI schema is complex, simplified for now
  deployment: z.any(), // Deployment schema is complex, simplified for now
  integrations: z.any().optional(),
  ai_assistance: z.any().optional(),
  validation: z.any().optional(),
  testing: z.any().optional(),
});

// ============================================================================
// PARSER CLASS
// ============================================================================

export class HERAAppConfigParser {
  private config: HERAAppConfig | null = null;
  private platformOrgId = PLATFORM_ORG.ID;

  /**
   * Parse YAML configuration string
   */
  async parseYAML(yamlContent: string): Promise<HERAAppConfig> {
    try {
      // For now, we'll use JSON.parse to simulate YAML parsing
      // In a real implementation, you'd use a YAML library like js-yaml
      const jsonContent = this.yamlToJson(yamlContent);
      const parsed = JSON.parse(jsonContent);
      
      // Validate against schema
      const validated = AppConfigSchema.parse(parsed);
      
      this.config = validated;
      return validated;
    } catch (error) {
      throw new Error(`Failed to parse HERA app configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simple YAML to JSON converter (for demonstration)
   * In production, use js-yaml library
   */
  private yamlToJson(yamlContent: string): string {
    // Use js-yaml library to parse YAML content
    try {
      const yaml = require('js-yaml');
      const parsed = yaml.load(yamlContent);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error(`YAML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate smart code patterns
   */
  validateSmartCodes(): string[] {
    if (!this.config) return ['No configuration loaded'];
    
    const errors: string[] = [];
    const smartCodePattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
    
    // Validate app smart code
    if (!smartCodePattern.test(this.config.app.smart_code)) {
      errors.push(`Invalid app smart code: ${this.config.app.smart_code}`);
    }
    
    // Validate entity smart codes
    this.config.entities.forEach(entity => {
      if (!smartCodePattern.test(entity.smart_code)) {
        errors.push(`Invalid entity smart code: ${entity.smart_code} for ${entity.entity_type}`);
      }
      
      // Validate dynamic field smart codes
      entity.dynamic_fields.forEach(field => {
        if (!smartCodePattern.test(field.smart_code)) {
          errors.push(`Invalid field smart code: ${field.smart_code} for ${entity.entity_type}.${field.name}`);
        }
      });
      
      // Validate relationship smart codes
      entity.relationships.forEach(rel => {
        if (!smartCodePattern.test(rel.smart_code)) {
          errors.push(`Invalid relationship smart code: ${rel.smart_code} for ${entity.entity_type}.${rel.type}`);
        }
      });
    });
    
    // Validate transaction smart codes
    this.config.transactions.forEach(txn => {
      if (!smartCodePattern.test(txn.smart_code)) {
        errors.push(`Invalid transaction smart code: ${txn.smart_code} for ${txn.transaction_type}`);
      }
    });
    
    return errors;
  }

  /**
   * Generate entity configurations for useUniversalEntityV1
   */
  generateEntityConfigs(): Record<string, any> {
    if (!this.config) return {};
    
    const configs: Record<string, any> = {};
    
    this.config.entities.forEach(entity => {
      configs[entity.entity_type] = {
        entity_type: entity.entity_type,
        organizationId: this.config!.app.organization.id,
        dynamicFields: entity.dynamic_fields.map(field => ({
          name: field.name,
          type: field.type,
          smart_code: field.smart_code,
          required: field.required,
          defaultValue: field.default,
        })),
        relationships: entity.relationships.map(rel => ({
          type: rel.type,
          smart_code: rel.smart_code,
          cardinality: rel.cardinality,
        })),
      };
    });
    
    return configs;
  }

  /**
   * Generate transaction configurations for useUniversalTransactionV1
   */
  generateTransactionConfigs(): Record<string, any> {
    if (!this.config) return {};
    
    const configs: Record<string, any> = {};
    
    this.config.transactions.forEach(txn => {
      configs[txn.transaction_type] = {
        organizationId: this.config!.app.organization.id,
        filters: {
          transaction_type: txn.transaction_type,
          include_lines: true,
        },
      };
    });
    
    return configs;
  }

  /**
   * Generate page components based on configuration
   */
  generatePageStructure(): any {
    if (!this.config) return {};
    
    const pages: Record<string, any> = {};
    
    // Generate entity pages
    this.config.entities.forEach(entity => {
      pages[`${entity.entity_type.toLowerCase()}-list`] = {
        type: 'entity-list',
        entity_type: entity.entity_type,
        title: `${entity.entity_name} List`,
        config: this.config!.ui.list_views[entity.entity_type] || {},
      };
      
      pages[`${entity.entity_type.toLowerCase()}-create`] = {
        type: 'entity-create',
        entity_type: entity.entity_type,
        title: `Create ${entity.entity_name}`,
        useWizard: true,
      };
    });
    
    // Generate dashboard page
    pages['dashboard'] = {
      type: 'dashboard',
      title: this.config.ui.dashboard.title,
      widgets: this.config.ui.dashboard.widgets,
      layout: this.config.ui.dashboard.layout,
    };
    
    return pages;
  }

  /**
   * Generate navigation structure
   */
  generateNavigation(): any[] {
    if (!this.config) return [];
    
    return this.config.ui.navigation.map(section => ({
      section: section.section,
      items: section.items.map(item => ({
        label: item.label,
        href: item.entity ? `/${item.entity.toLowerCase()}` : `/${item.component?.toLowerCase()}`,
        icon: item.icon,
        view: item.view,
      })),
    }));
  }

  /**
   * Save app template to platform organization
   */
  async saveAppTemplate(
    templateName: string,
    category: string = 'business',
    metadata: Record<string, any> = {}
  ): Promise<any> {
    if (!this.config) {
      throw new Error('No configuration loaded. Parse YAML first.');
    }

    const entityCode = generatePlatformEntityCode('APP_TEMPLATE', Date.now());
    const smartCode = generatePlatformSmartCode('APP_TEMPLATE', templateName);

    const template = {
      entity_type: 'APP_TEMPLATE',
      entity_name: `${templateName} Application Template`,
      entity_code: entityCode,
      smart_code: smartCode,
      organization_id: this.platformOrgId,
      status: 'ACTIVE',
      dynamic_fields: {
        template_name: templateName,
        template_category: category,
        yaml_configuration: JSON.stringify(this.config),
        generated_metadata: {
          entities_count: this.config.entities.length,
          transactions_count: this.config.transactions.length,
          workflows_count: this.config.workflows.length,
          generated_date: new Date().toISOString(),
          generator_version: 'v1.0.0'
        },
        version: this.config.app.version,
        supported_industries: metadata.supported_industries || [],
        estimated_setup_time: metadata.estimated_setup_time || '30_minutes',
        complexity_level: metadata.complexity_level || 'intermediate',
        prerequisites: metadata.prerequisites || [],
        ...metadata
      }
    };

    return template;
  }

  /**
   * Load app template from platform organization
   */
  async loadAppTemplate(templateId: string): Promise<HERAAppConfig> {
    // This would integrate with the universal entity hook to load from platform org
    // For now, return a placeholder that shows the structure
    throw new Error('Template loading requires integration with useUniversalEntityV1 hook');
  }

  /**
   * List available app templates from platform organization
   */
  async listAppTemplates(category?: string): Promise<any[]> {
    // This would integrate with the universal entity hook to query platform org
    // For now, return a placeholder that shows the structure
    const filters: any = {
      entity_type: 'APP_TEMPLATE',
      organization_id: this.platformOrgId
    };

    if (category) {
      filters['dynamic_fields.template_category'] = category;
    }

    // Would use: await entityHook.query(filters)
    throw new Error('Template listing requires integration with useUniversalEntityV1 hook');
  }

  /**
   * Save universal component configuration to platform organization
   */
  async saveComponentConfig(
    componentType: string,
    componentName: string,
    config: Record<string, any>
  ): Promise<any> {
    const entityCode = generatePlatformEntityCode('UNIVERSAL_COMPONENT', Date.now());
    const smartCode = generatePlatformSmartCode('UNIVERSAL_COMPONENT', componentType);

    const component = {
      entity_type: 'UNIVERSAL_COMPONENT',
      entity_name: componentName,
      entity_code: entityCode,
      smart_code: smartCode,
      organization_id: this.platformOrgId,
      status: 'ACTIVE',
      dynamic_fields: {
        component_name: componentName,
        component_type: componentType,
        config_schema: config.schema || {},
        default_config: config.defaults || {},
        usage_examples: config.examples || {},
        dependencies: config.dependencies || [],
        version: config.version || '1.0.0',
        compatibility: config.compatibility || {}
      }
    };

    return component;
  }

  /**
   * Generate app metadata for platform storage
   */
  generatePlatformMetadata(): Record<string, any> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    return {
      app_code: this.config.app.code,
      app_name: this.config.app.name,
      app_version: this.config.app.version,
      module_code: this.config.app.module.code,
      module_category: this.config.app.module.category,
      
      // Entity statistics
      entities: this.config.entities.map(entity => ({
        entity_type: entity.entity_type,
        smart_code: entity.smart_code,
        dynamic_fields_count: entity.dynamic_fields.length,
        relationships_count: entity.relationships.length
      })),
      
      // Transaction statistics
      transactions: this.config.transactions.map(txn => ({
        transaction_type: txn.transaction_type,
        smart_code: txn.smart_code,
        line_types_count: txn.line_types.length,
        has_validation_rules: !!(txn.validation_rules && txn.validation_rules.length > 0)
      })),
      
      // Workflow statistics
      workflows: this.config.workflows.map(workflow => ({
        workflow_code: workflow.workflow_code,
        smart_code: workflow.smart_code,
        steps_count: workflow.steps.length,
        has_ai_assistance: workflow.steps.some(step => step.ai_assistance)
      })),
      
      // Feature flags
      features: {
        has_ai_assistance: !!(this.config.ai_assistance),
        has_integrations: !!(this.config.integrations),
        has_external_apis: !!(this.config.integrations?.external_apis?.length),
        has_dashboard_widgets: !!(this.config.ui.dashboard.widgets.length),
        has_navigation: !!(this.config.ui.navigation.length)
      },
      
      // Complexity metrics
      complexity: {
        total_entities: this.config.entities.length,
        total_transactions: this.config.transactions.length,
        total_workflows: this.config.workflows.length,
        total_dynamic_fields: this.config.entities.reduce((sum, entity) => sum + entity.dynamic_fields.length, 0),
        total_relationships: this.config.entities.reduce((sum, entity) => sum + entity.relationships.length, 0)
      }
    };
  }

  /**
   * Get the parsed configuration
   */
  getConfig(): HERAAppConfig | null {
    return this.config;
  }

  /**
   * Validate entity relationships
   */
  validateRelationships(): string[] {
    if (!this.config) return ['No configuration loaded'];
    
    const errors: string[] = [];
    const entityTypes = new Set(this.config.entities.map(e => e.entity_type));
    
    this.config.entities.forEach(entity => {
      entity.relationships.forEach(rel => {
        if (!entityTypes.has(rel.target_entity)) {
          errors.push(`Entity ${entity.entity_type} references unknown target entity: ${rel.target_entity}`);
        }
      });
    });
    
    return errors;
  }

  /**
   * Generate complete app summary
   */
  generateAppSummary(): string {
    if (!this.config) return 'No configuration loaded';
    
    const summary = [
      `HERA Application: ${this.config.app.name} (${this.config.app.code})`,
      `Version: ${this.config.app.version}`,
      `Organization: ${this.config.app.organization.name}`,
      ``,
      `Entities: ${this.config.entities.length}`,
      ...this.config.entities.map(e => `  - ${e.entity_type}: ${e.entity_name}`),
      ``,
      `Transactions: ${this.config.transactions.length}`,
      ...this.config.transactions.map(t => `  - ${t.transaction_type}: ${t.transaction_name}`),
      ``,
      `Workflows: ${this.config.workflows.length}`,
      ...this.config.workflows.map(w => `  - ${w.workflow_code}: ${w.workflow_name}`),
    ];
    
    return summary.join('\n');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create parser instance and parse YAML configuration
 */
export async function parseHERAAppConfig(yamlContent: string): Promise<HERAAppConfig> {
  const parser = new HERAAppConfigParser();
  return await parser.parseYAML(yamlContent);
}

/**
 * Validate complete HERA app configuration
 */
export async function validateHERAAppConfig(yamlContent: string): Promise<{
  isValid: boolean;
  errors: string[];
  config?: HERAAppConfig;
}> {
  try {
    const parser = new HERAAppConfigParser();
    const config = await parser.parseYAML(yamlContent);
    
    const smartCodeErrors = parser.validateSmartCodes();
    const relationshipErrors = parser.validateRelationships();
    
    const allErrors = [...smartCodeErrors, ...relationshipErrors];
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      config,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

/**
 * Generate app structure from YAML configuration
 */
export async function generateAppFromYAML(yamlContent: string): Promise<{
  isValid: boolean;
  errors: string[];
  appStructure?: {
    config: HERAAppConfig;
    entityConfigs: Record<string, any>;
    transactionConfigs: Record<string, any>;
    pages: Record<string, any>;
    navigation: any[];
    summary: string;
  };
}> {
  const validation = await validateHERAAppConfig(yamlContent);
  
  if (!validation.isValid || !validation.config) {
    return {
      isValid: false,
      errors: validation.errors,
    };
  }
  
  const parser = new HERAAppConfigParser();
  await parser.parseYAML(yamlContent);
  
  return {
    isValid: true,
    errors: [],
    appStructure: {
      config: validation.config,
      entityConfigs: parser.generateEntityConfigs(),
      transactionConfigs: parser.generateTransactionConfigs(),
      pages: parser.generatePageStructure(),
      navigation: parser.generateNavigation(),
      summary: parser.generateAppSummary(),
    },
  };
}