'use client';

/**
 * HERA Platform Organization Constants
 * Smart Code: HERA.PLATFORM.CONSTANTS.ORG.v1
 * 
 * Central definitions for platform organization and related configurations
 */

// ============================================================================
// PLATFORM ORGANIZATION
// ============================================================================

export const PLATFORM_ORG = {
  ID: 'org_hera_platform_00000000',
  NAME: 'HERA Platform System',
  CODE: 'PLATFORM',
  TYPE: 'PLATFORM_SYSTEM',
  SMART_CODE: 'HERA.PLATFORM.ORG.SYSTEM.v1',
  STATUS: 'ACTIVE'
} as const;

// ============================================================================
// PLATFORM ENTITY TYPES
// ============================================================================

export const PLATFORM_ENTITY_TYPES = {
  APP_TEMPLATE: 'APP_TEMPLATE',
  UNIVERSAL_COMPONENT: 'UNIVERSAL_COMPONENT', 
  SMART_CODE_TEMPLATE: 'SMART_CODE_TEMPLATE',
  VALIDATION_RULE: 'VALIDATION_RULE',
  AI_MODEL: 'AI_MODEL',
  WORKFLOW_TEMPLATE: 'WORKFLOW_TEMPLATE',
  UI_THEME: 'UI_THEME',
  INTEGRATION_TEMPLATE: 'INTEGRATION_TEMPLATE'
} as const;

// ============================================================================
// SMART CODE PATTERNS
// ============================================================================

export const PLATFORM_SMART_CODES = {
  // App Templates
  APP_TEMPLATE: {
    CRM: 'HERA.PLATFORM.APP_TEMPLATE.CRM.v1',
    SALON: 'HERA.PLATFORM.APP_TEMPLATE.SALON.v1',
    INVENTORY: 'HERA.PLATFORM.APP_TEMPLATE.INVENTORY.v1',
    RESTAURANT: 'HERA.PLATFORM.APP_TEMPLATE.RESTAURANT.v1',
    FINANCE: 'HERA.PLATFORM.APP_TEMPLATE.FINANCE.v1',
    HCM: 'HERA.PLATFORM.APP_TEMPLATE.HCM.v1'
  },
  
  // Universal Components
  UNIVERSAL_COMPONENT: {
    MASTER_DATA_WIZARD: 'HERA.PLATFORM.UNIVERSAL_COMPONENT.MDW.v1',
    TRANSACTION_WIZARD: 'HERA.PLATFORM.UNIVERSAL_COMPONENT.TXW.v1',
    WORKFLOW_ENGINE: 'HERA.PLATFORM.UNIVERSAL_COMPONENT.WFE.v1',
    RELATIONSHIP_MANAGER: 'HERA.PLATFORM.UNIVERSAL_COMPONENT.REM.v1',
    DASHBOARD_BUILDER: 'HERA.PLATFORM.UNIVERSAL_COMPONENT.DBB.v1',
    LIST_VIEW: 'HERA.PLATFORM.UNIVERSAL_COMPONENT.LVW.v1'
  },
  
  // Smart Code Templates
  SMART_CODE_TEMPLATE: {
    ENTITY: 'HERA.PLATFORM.SMART_CODE_TEMPLATE.ENTITY.v1',
    TRANSACTION: 'HERA.PLATFORM.SMART_CODE_TEMPLATE.TRANSACTION.v1',
    FIELD: 'HERA.PLATFORM.SMART_CODE_TEMPLATE.FIELD.v1',
    RELATIONSHIP: 'HERA.PLATFORM.SMART_CODE_TEMPLATE.RELATIONSHIP.v1',
    WORKFLOW: 'HERA.PLATFORM.SMART_CODE_TEMPLATE.WORKFLOW.v1'
  },
  
  // Validation Rules
  VALIDATION_RULE: {
    GL_BALANCE: 'HERA.PLATFORM.VALIDATION_RULE.GL_BALANCE.v1',
    SMART_CODE_PATTERN: 'HERA.PLATFORM.VALIDATION_RULE.SMART_CODE.v1',
    ACTOR_REQUIRED: 'HERA.PLATFORM.VALIDATION_RULE.ACTOR.v1',
    ORG_ISOLATION: 'HERA.PLATFORM.VALIDATION_RULE.ORG_ISOLATION.v1'
  },
  
  // AI Models
  AI_MODEL: {
    LEAD_SCORING: 'HERA.PLATFORM.AI_MODEL.LEAD_SCORING.v1',
    CUSTOMER_INTELLIGENCE: 'HERA.PLATFORM.AI_MODEL.CUSTOMER_INTEL.v1',
    WORKFLOW_OPTIMIZATION: 'HERA.PLATFORM.AI_MODEL.WORKFLOW_OPT.v1',
    CONTENT_RECOMMENDATION: 'HERA.PLATFORM.AI_MODEL.CONTENT_REC.v1'
  }
} as const;

// ============================================================================
// ACCESS CONTROL
// ============================================================================

export const PLATFORM_ACCESS_ROLES = {
  HERA_SYSTEM: 'HERA_SYSTEM',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  DEVELOPER: 'DEVELOPER',
  END_USER: 'END_USER'
} as const;

export const PLATFORM_PERMISSIONS = {
  READ_TEMPLATES: 'READ_TEMPLATES',
  WRITE_TEMPLATES: 'WRITE_TEMPLATES',
  GENERATE_APPS: 'GENERATE_APPS',
  MANAGE_COMPONENTS: 'MANAGE_COMPONENTS',
  CONFIGURE_AI: 'CONFIGURE_AI',
  ADMIN_PLATFORM: 'ADMIN_PLATFORM'
} as const;

// ============================================================================
// TEMPLATE CATEGORIES
// ============================================================================

export const TEMPLATE_CATEGORIES = {
  BUSINESS: 'business',
  FINANCIAL: 'financial',
  OPERATIONAL: 'operational',
  INDUSTRY_SPECIFIC: 'industry_specific',
  COMPLIANCE: 'compliance',
  ANALYTICS: 'analytics'
} as const;

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export const COMPONENT_TYPES = {
  WIZARD: 'wizard',
  FORM: 'form',
  LIST: 'list',
  DASHBOARD: 'dashboard',
  WORKFLOW: 'workflow',
  REPORT: 'report',
  CHART: 'chart',
  MODAL: 'modal'
} as const;

// ============================================================================
// VALIDATION RULE TYPES
// ============================================================================

export const VALIDATION_RULE_TYPES = {
  FINANCIAL: 'financial',
  SECURITY: 'security',
  BUSINESS: 'business',
  DATA_INTEGRITY: 'data_integrity',
  COMPLIANCE: 'compliance'
} as const;

// ============================================================================
// AI MODEL TYPES
// ============================================================================

export const AI_MODEL_TYPES = {
  CLASSIFICATION: 'classification',
  REGRESSION: 'regression',
  RECOMMENDATION: 'recommendation',
  OPTIMIZATION: 'optimization',
  NATURAL_LANGUAGE: 'natural_language',
  COMPUTER_VISION: 'computer_vision'
} as const;

// ============================================================================
// PLATFORM ENTITY CODE GENERATORS
// ============================================================================

export const generatePlatformEntityCode = (entityType: string, sequence: number): string => {
  const paddedSequence = sequence.toString().padStart(3, '0');
  
  const prefixes: Record<string, string> = {
    [PLATFORM_ENTITY_TYPES.APP_TEMPLATE]: 'TEMPLATE',
    [PLATFORM_ENTITY_TYPES.UNIVERSAL_COMPONENT]: 'COMPONENT', 
    [PLATFORM_ENTITY_TYPES.SMART_CODE_TEMPLATE]: 'SMARTCODE',
    [PLATFORM_ENTITY_TYPES.VALIDATION_RULE]: 'VALIDATION',
    [PLATFORM_ENTITY_TYPES.AI_MODEL]: 'AI',
    [PLATFORM_ENTITY_TYPES.WORKFLOW_TEMPLATE]: 'WORKFLOW',
    [PLATFORM_ENTITY_TYPES.UI_THEME]: 'THEME',
    [PLATFORM_ENTITY_TYPES.INTEGRATION_TEMPLATE]: 'INTEGRATION'
  };
  
  const prefix = prefixes[entityType] || 'PLATFORM';
  return `${prefix}-${paddedSequence}`;
};

export const generatePlatformSmartCode = (
  entityType: string, 
  specificType: string, 
  version: number = 1
): string => {
  const normalizedEntityType = entityType.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const normalizedSpecificType = specificType.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  
  return `HERA.PLATFORM.${normalizedEntityType}.${normalizedSpecificType}.v${version}`;
};

// ============================================================================
// PLATFORM METADATA SCHEMAS
// ============================================================================

export const PLATFORM_METADATA_SCHEMAS = {
  APP_TEMPLATE: {
    template_name: 'string',
    template_category: 'string',
    yaml_configuration: 'text',
    generated_metadata: 'json',
    version: 'string',
    supported_industries: 'array',
    entities_count: 'number',
    transactions_count: 'number',
    workflows_count: 'number',
    estimated_setup_time: 'string',
    complexity_level: 'string',
    prerequisites: 'array'
  },
  
  UNIVERSAL_COMPONENT: {
    component_name: 'string',
    component_type: 'string',
    config_schema: 'json',
    default_config: 'json',
    usage_examples: 'json',
    dependencies: 'array',
    version: 'string',
    compatibility: 'json'
  },
  
  SMART_CODE_TEMPLATE: {
    pattern_name: 'string',
    regex_pattern: 'string',
    validation_rules: 'json',
    example_codes: 'array',
    usage_context: 'string',
    validation_error_messages: 'json'
  },
  
  VALIDATION_RULE: {
    rule_name: 'string',
    rule_type: 'string',
    rule_expression: 'string',
    error_message: 'string',
    severity: 'string',
    applies_to: 'array',
    bypass_conditions: 'json'
  },
  
  AI_MODEL: {
    model_name: 'string',
    model_type: 'string',
    input_schema: 'json',
    output_schema: 'json',
    training_requirements: 'json',
    performance_metrics: 'json',
    usage_context: 'string',
    version: 'string'
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an organization ID is the platform organization
 */
export const isPlatformOrg = (organizationId: string): boolean => {
  return organizationId === PLATFORM_ORG.ID;
};

/**
 * Validate platform entity access based on user role
 */
export const canAccessPlatformEntity = (
  userRole: string, 
  operation: 'read' | 'write' | 'admin'
): boolean => {
  switch (operation) {
    case 'read':
      return [
        PLATFORM_ACCESS_ROLES.HERA_SYSTEM,
        PLATFORM_ACCESS_ROLES.PLATFORM_ADMIN,
        PLATFORM_ACCESS_ROLES.TENANT_ADMIN,
        PLATFORM_ACCESS_ROLES.DEVELOPER
      ].includes(userRole as any);
      
    case 'write':
      return [
        PLATFORM_ACCESS_ROLES.HERA_SYSTEM,
        PLATFORM_ACCESS_ROLES.PLATFORM_ADMIN
      ].includes(userRole as any);
      
    case 'admin':
      return [
        PLATFORM_ACCESS_ROLES.HERA_SYSTEM,
        PLATFORM_ACCESS_ROLES.PLATFORM_ADMIN
      ].includes(userRole as any);
      
    default:
      return false;
  }
};

/**
 * Generate platform entity configuration
 */
export const createPlatformEntityConfig = (
  entityType: string,
  specificType: string,
  metadata: Record<string, any>,
  sequence?: number
) => {
  const entityCode = sequence 
    ? generatePlatformEntityCode(entityType, sequence)
    : `${entityType.toUpperCase()}-${Date.now()}`;
    
  const smartCode = generatePlatformSmartCode(entityType, specificType);
  
  return {
    entity_type: entityType,
    entity_name: metadata.name || `${entityType} ${specificType}`,
    entity_code: entityCode,
    smart_code: smartCode,
    organization_id: PLATFORM_ORG.ID,
    status: 'ACTIVE',
    metadata: {
      is_platform_entity: true,
      created_by: 'HERA_SYSTEM',
      ...metadata
    },
    dynamic_fields: metadata.dynamic_fields || {}
  };
};

// ============================================================================
// PLATFORM QUERIES
// ============================================================================

/**
 * Common filters for platform entity queries
 */
export const PLATFORM_QUERY_FILTERS = {
  byEntityType: (entityType: string) => ({
    entity_type: entityType,
    organization_id: PLATFORM_ORG.ID
  }),
  
  byCategory: (entityType: string, category: string) => ({
    entity_type: entityType,
    organization_id: PLATFORM_ORG.ID,
    'dynamic_fields.category': category
  }),
  
  byVersion: (entityType: string, version: string) => ({
    entity_type: entityType,
    organization_id: PLATFORM_ORG.ID,
    'dynamic_fields.version': version
  }),
  
  activeOnly: (entityType: string) => ({
    entity_type: entityType,
    organization_id: PLATFORM_ORG.ID,
    status: 'ACTIVE'
  })
} as const;

export default {
  PLATFORM_ORG,
  PLATFORM_ENTITY_TYPES,
  PLATFORM_SMART_CODES,
  PLATFORM_ACCESS_ROLES,
  PLATFORM_PERMISSIONS,
  TEMPLATE_CATEGORIES,
  COMPONENT_TYPES,
  VALIDATION_RULE_TYPES,
  AI_MODEL_TYPES,
  PLATFORM_METADATA_SCHEMAS,
  generatePlatformEntityCode,
  generatePlatformSmartCode,
  isPlatformOrg,
  canAccessPlatformEntity,
  createPlatformEntityConfig,
  PLATFORM_QUERY_FILTERS
};