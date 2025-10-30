# HERA Platform Organization Architecture
**Smart Code**: `HERA.PLATFORM.ORG.ARCHITECTURE.v1`

## Overview

The **Platform Organization** serves as the central repository for all HERA platform-related configuration data, templates, and system definitions. This provides clean separation between platform configurations and tenant-specific data while leveraging HERA's organization-centric architecture.

## Platform Organization Design

### Organization Structure
```json
{
  "id": "org_hera_platform_00000000",
  "organization_name": "HERA Platform System",
  "organization_code": "PLATFORM",
  "organization_type": "PLATFORM_SYSTEM",
  "smart_code": "HERA.PLATFORM.ORG.SYSTEM.v1",
  "status": "ACTIVE",
  "metadata": {
    "is_platform_org": true,
    "access_level": "SYSTEM_ONLY",
    "created_for": "Platform configuration and templates"
  }
}
```

### Platform Entity Types

#### 1. App Templates (`APP_TEMPLATE`)
**Purpose**: Store YAML app configurations and generated metadata
**Smart Code Pattern**: `HERA.PLATFORM.APP_TEMPLATE.{TEMPLATE_TYPE}.v1`

```yaml
entity_type: "APP_TEMPLATE"
smart_code: "HERA.PLATFORM.APP_TEMPLATE.CRM.v1"
dynamic_fields:
  template_name: "CRM System Template"
  template_category: "business"
  yaml_configuration: "{...}"  # Full YAML config
  generated_metadata: "{...}"  # Generation artifacts
  version: "1.0.0"
  supported_industries: ["salon", "retail", "services"]
```

#### 2. Universal Components (`UNIVERSAL_COMPONENT`)
**Purpose**: Define reusable UI components and their configurations
**Smart Code Pattern**: `HERA.PLATFORM.UNIVERSAL_COMPONENT.{COMPONENT_TYPE}.v1`

```yaml
entity_type: "UNIVERSAL_COMPONENT"
smart_code: "HERA.PLATFORM.UNIVERSAL_COMPONENT.MASTER_DATA_WIZARD.v1"
dynamic_fields:
  component_name: "Universal Master Data Wizard"
  component_type: "wizard"
  config_schema: "{...}"  # Component configuration schema
  default_config: "{...}"  # Default settings
  usage_examples: "{...}"  # Implementation examples
```

#### 3. Smart Code Templates (`SMART_CODE_TEMPLATE`)
**Purpose**: Define smart code patterns and validation rules
**Smart Code Pattern**: `HERA.PLATFORM.SMART_CODE_TEMPLATE.{PATTERN_TYPE}.v1`

```yaml
entity_type: "SMART_CODE_TEMPLATE"
smart_code: "HERA.PLATFORM.SMART_CODE_TEMPLATE.ENTITY.v1"
dynamic_fields:
  pattern_name: "Entity Smart Code Pattern"
  regex_pattern: "^HERA\\.{MODULE}\\.{ENTITY_TYPE}\\.ENTITY\\.v[0-9]+$"
  validation_rules: "{...}"
  example_codes: ["HERA.CRM.CUSTOMER.ENTITY.v1"]
```

#### 4. Validation Rules (`VALIDATION_RULE`)
**Purpose**: Store platform-wide validation and business rules
**Smart Code Pattern**: `HERA.PLATFORM.VALIDATION_RULE.{RULE_TYPE}.v1`

```yaml
entity_type: "VALIDATION_RULE"
smart_code: "HERA.PLATFORM.VALIDATION_RULE.GL_BALANCE.v1"
dynamic_fields:
  rule_name: "GL Balance Validation"
  rule_type: "financial"
  rule_expression: "sum(DR) == sum(CR)"
  error_message: "Debits must equal credits"
  severity: "error"
```

#### 5. AI Models (`AI_MODEL`)
**Purpose**: Define AI assistance models and their configurations
**Smart Code Pattern**: `HERA.PLATFORM.AI_MODEL.{MODEL_TYPE}.v1`

```yaml
entity_type: "AI_MODEL"
smart_code: "HERA.PLATFORM.AI_MODEL.LEAD_SCORING.v1"
dynamic_fields:
  model_name: "Lead Scoring Model"
  model_type: "classification"
  input_schema: "{...}"
  output_schema: "{...}"
  training_data_requirements: "{...}"
```

## Platform Data Organization

### Directory Structure in Platform Org
```
Platform Organization (org_hera_platform_00000000)
├── App Templates/
│   ├── CRM System (entity_id: template_crm_001)
│   ├── Salon Management (entity_id: template_salon_001)
│   ├── Inventory Management (entity_id: template_inventory_001)
│   └── Custom Templates...
│
├── Universal Components/
│   ├── Master Data Wizard (entity_id: component_mdw_001)
│   ├── Transaction Wizard (entity_id: component_txw_001)
│   ├── Workflow Engine (entity_id: component_wfe_001)
│   └── Relationship Manager (entity_id: component_rem_001)
│
├── Smart Code Templates/
│   ├── Entity Patterns (entity_id: smartcode_entity_001)
│   ├── Transaction Patterns (entity_id: smartcode_txn_001)
│   ├── Field Patterns (entity_id: smartcode_field_001)
│   └── Relationship Patterns (entity_id: smartcode_rel_001)
│
├── Validation Rules/
│   ├── Financial Rules (entity_id: validation_fin_001)
│   ├── Security Rules (entity_id: validation_sec_001)
│   └── Business Rules (entity_id: validation_biz_001)
│
└── AI Models/
    ├── Lead Scoring (entity_id: ai_lead_scoring_001)
    ├── Customer Intelligence (entity_id: ai_customer_intel_001)
    └── Workflow Optimization (entity_id: ai_workflow_opt_001)
```

## Implementation Strategy

### 1. Platform Organization Creation
```typescript
const platformOrg = {
  organization_name: "HERA Platform System",
  organization_code: "PLATFORM", 
  organization_type: "PLATFORM_SYSTEM",
  smart_code: "HERA.PLATFORM.ORG.SYSTEM.v1",
  metadata: {
    is_platform_org: true,
    access_level: "SYSTEM_ONLY"
  }
};
```

### 2. App Template Storage
```typescript
// Store YAML configurations as entities in platform org
const appTemplate = {
  entity_type: "APP_TEMPLATE",
  entity_name: "CRM System Template",
  entity_code: "TEMPLATE-CRM-001",
  smart_code: "HERA.PLATFORM.APP_TEMPLATE.CRM.v1",
  dynamic_fields: {
    yaml_configuration: yamlContent,
    template_category: "business",
    supported_modules: ["sales", "marketing", "service"],
    version: "1.0.0"
  }
};
```

### 3. Component Configuration Storage
```typescript
// Store Universal Component configurations
const componentConfig = {
  entity_type: "UNIVERSAL_COMPONENT",
  entity_name: "Master Data Wizard Configuration",
  smart_code: "HERA.PLATFORM.UNIVERSAL_COMPONENT.MDW.v1",
  dynamic_fields: {
    component_type: "wizard",
    steps: ["basics", "relationships", "attributes", "review"],
    validation_rules: {...},
    ai_assistance_config: {...}
  }
};
```

## Access Control & Security

### Platform Org Access Rules
```yaml
access_control:
  platform_org:
    read_access:
      - "HERA_SYSTEM"
      - "PLATFORM_ADMIN"
      - "APP_GENERATOR_SERVICE"
    
    write_access:
      - "HERA_SYSTEM"
      - "PLATFORM_ADMIN"
    
    generate_access:
      - "TENANT_ADMIN"  # Can generate apps from templates
      - "DEVELOPER"     # Can use templates for development
      
    restrictions:
      - "NO_TENANT_WRITE"  # Tenants cannot modify platform configs
      - "AUDIT_ALL_CHANGES"  # All modifications are audited
      - "VERSION_CONTROLLED"  # All changes create new versions
```

### RLS Implementation
```sql
-- Row Level Security for Platform Organization
CREATE POLICY "platform_org_system_access" ON core_entities
FOR ALL TO authenticated
USING (
  organization_id = 'org_hera_platform_00000000' 
  AND (
    current_setting('app.user_role') = 'HERA_SYSTEM'
    OR current_setting('app.user_role') = 'PLATFORM_ADMIN'
    OR (
      current_setting('app.user_role') = 'TENANT_ADMIN'
      AND current_setting('app.operation_type') = 'READ'
    )
  )
);
```

## App Generation Integration

### Updated YAML Parser
```typescript
export class HERAAppConfigParser {
  private platformOrgId = 'org_hera_platform_00000000';
  
  async saveTemplate(yamlContent: string, templateName: string) {
    // Save app template to platform organization
    const template = {
      entity_type: 'APP_TEMPLATE',
      entity_name: templateName,
      smart_code: `HERA.PLATFORM.APP_TEMPLATE.${templateName.toUpperCase()}.v1`,
      organization_id: this.platformOrgId,
      dynamic_fields: {
        yaml_configuration: yamlContent,
        created_date: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    return await this.entityHook.create(template);
  }
  
  async loadTemplate(templateId: string) {
    // Load template from platform organization
    return await this.entityHook.read(templateId, {
      organizationId: this.platformOrgId
    });
  }
}
```

### Template Management API
```typescript
// Platform template management
export class PlatformTemplateManager {
  private platformOrgId = 'org_hera_platform_00000000';
  
  async listTemplates(category?: string) {
    return await this.entityHook.query({
      entity_type: 'APP_TEMPLATE',
      organization_id: this.platformOrgId,
      filters: category ? { template_category: category } : {}
    });
  }
  
  async generateAppFromTemplate(templateId: string, targetOrgId: string) {
    // Load template from platform org
    const template = await this.loadTemplate(templateId);
    
    // Generate app in target organization
    return await this.appGenerator.generate({
      yamlConfig: template.dynamic_fields.yaml_configuration,
      targetOrganization: targetOrgId,
      templateMetadata: template
    });
  }
}
```

## Benefits of Platform Organization

### 1. **Clean Separation**
- **Platform configs** isolated from tenant data
- **System-level** access controls
- **Centralized** template management

### 2. **Scalability**
- **Multi-tenant** template sharing
- **Version control** for platform components
- **Consistent** deployment patterns

### 3. **Security**
- **Read-only access** for tenants to templates
- **Audit trail** for all platform changes
- **Role-based** access to platform features

### 4. **Maintainability**
- **Single source of truth** for platform configs
- **Easy updates** to universal components
- **Centralized** validation rule management

## Migration Strategy

### Phase 1: Platform Org Creation
1. Create platform organization entity
2. Set up access control policies
3. Implement RLS for platform data

### Phase 2: Template Migration
1. Move existing YAML templates to platform org
2. Update app generator to use platform templates
3. Migrate component configurations

### Phase 3: Enhanced Features
1. Add versioning for platform components
2. Implement template marketplace
3. Add usage analytics and optimization

## Example Platform Entities

### CRM App Template
```json
{
  "entity_type": "APP_TEMPLATE",
  "entity_code": "TEMPLATE-CRM-001",
  "smart_code": "HERA.PLATFORM.APP_TEMPLATE.CRM.v1",
  "organization_id": "org_hera_platform_00000000",
  "dynamic_fields": {
    "template_name": "Customer Relationship Management",
    "template_category": "business",
    "yaml_configuration": "...",
    "supported_industries": ["salon", "retail", "professional_services"],
    "entities_count": 4,
    "transactions_count": 3,
    "workflows_count": 2,
    "estimated_setup_time": "30_minutes"
  }
}
```

### Universal Master Data Wizard Config
```json
{
  "entity_type": "UNIVERSAL_COMPONENT",
  "entity_code": "COMPONENT-MDW-001",
  "smart_code": "HERA.PLATFORM.UNIVERSAL_COMPONENT.MDW.v1",
  "organization_id": "org_hera_platform_00000000",
  "dynamic_fields": {
    "component_name": "Universal Master Data Wizard",
    "component_type": "wizard",
    "steps": ["basics", "relationships", "attributes", "review"],
    "ai_assistance_enabled": true,
    "validation_rules": {...},
    "styling_config": {...}
  }
}
```

## Smart Code Patterns for Platform

### Platform-Specific Patterns
```
HERA.PLATFORM.{ENTITY_TYPE}.{SPECIFIC}.v{VERSION}

Examples:
- HERA.PLATFORM.APP_TEMPLATE.CRM.v1
- HERA.PLATFORM.UNIVERSAL_COMPONENT.MDW.v1
- HERA.PLATFORM.VALIDATION_RULE.GL_BALANCE.v1
- HERA.PLATFORM.AI_MODEL.LEAD_SCORING.v1
- HERA.PLATFORM.SMART_CODE_TEMPLATE.ENTITY.v1
```

This platform organization architecture provides a robust foundation for managing all HERA platform configurations while maintaining clean separation from tenant data and enabling scalable, secure template management! 🏗️