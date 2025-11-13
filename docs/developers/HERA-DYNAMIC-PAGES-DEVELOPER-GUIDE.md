# HERA Dynamic Pages Developer Guide

**Smart Code**: `HERA.PLATFORM.DOCS.DYNAMIC_PAGES.DEVELOPER_GUIDE.v1`

## Quick Start: Creating Your First Dynamic Workspace

This guide shows you how to create new dynamic workspaces in HERA using the **Database-Driven Configuration System**. No code changes required - everything is configured through database entities.

## Prerequisites

- HERA platform setup with Sacred Six tables
- Access to platform organization (`00000000-0000-0000-0000-000000000000`)
- Understanding of HERA Smart Code patterns
- Basic knowledge of JSONB data structures

## Step-by-Step Workspace Creation

### Step 1: Create APP_DOMAIN Entity

First, create a domain entity that represents your business area:

```sql
-- Example: Creating a CRM domain
INSERT INTO core_entities (
  id,
  entity_type, 
  entity_code, 
  entity_name, 
  smart_code, 
  organization_id,
  created_by,
  updated_by
) VALUES (
  gen_random_uuid(),
  'APP_DOMAIN',
  'crm',
  'Customer Relationship Management',
  'HERA.PLATFORM.DOMAIN.CRM.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

Add domain configuration data:

```sql
-- Get the domain entity ID
SELECT id FROM core_entities WHERE entity_code = 'crm' AND entity_type = 'APP_DOMAIN';

-- Add dynamic configuration
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(domain_entity_id, 'icon', 'text', '"Users"'),
(domain_entity_id, 'color', 'text', '"#3b82f6"'),
(domain_entity_id, 'description', 'text', '"Customer relationship management and sales operations"'),
(domain_entity_id, 'order_priority', 'number', '3');
```

### Step 2: Create APP_SECTION Entities

Create sections within your domain:

```sql
-- Example: Creating a "leads" section
INSERT INTO core_entities (
  id,
  entity_type,
  entity_code, 
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by  
) VALUES (
  gen_random_uuid(),
  'APP_SECTION',
  'leads',
  'Lead Management', 
  'HERA.CRM.SECTION.LEADS.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);

-- Link section to domain via relationship
INSERT INTO core_relationships (
  source_entity_id,     -- CRM domain ID
  target_entity_id,     -- Leads section ID
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  domain_entity_id,
  section_entity_id,
  'HAS_SECTION',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

Add section configuration:

```sql
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text) VALUES
(section_entity_id, 'workspace_type', 'text', 'sales_operations'),
(section_entity_id, 'default_persona', 'text', 'sales_rep'),
(section_entity_id, 'icon', 'text', 'Target'),
(section_entity_id, 'description', 'text', 'Manage sales leads and prospects');
```

### Step 3: Create APP_WORKSPACE Entity

Create the actual workspace with full configuration:

```sql
-- Create workspace entity
INSERT INTO core_entities (
  id,
  entity_type,
  entity_code,
  entity_name, 
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  gen_random_uuid(),
  'APP_WORKSPACE',
  'main',
  'Lead Management Workspace',
  'HERA.CRM.LEADS.WORKSPACE.MAIN.v1', 
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);

-- Link workspace to section
INSERT INTO core_relationships (
  source_entity_id,     -- Leads section ID
  target_entity_id,     -- Workspace ID  
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  section_entity_id,
  workspace_entity_id,
  'HAS_WORKSPACE',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

### Step 4: Configure Workspace Layout and Navigation

Add the complete workspace configuration as JSONB:

```sql
-- Navigation configuration
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'nav_items', 'json', '[
  {
    "code": "overview", 
    "label": "Overview",
    "icon": "Home"
  },
  {
    "code": "leads",
    "label": "Lead Management", 
    "icon": "Target"
  },
  {
    "code": "analytics",
    "label": "Analytics",
    "icon": "BarChart3"
  }
]');

-- Default settings
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text) VALUES
(workspace_entity_id, 'layout', 'text', 'universal_sap'),
(workspace_entity_id, 'default_nav', 'text', 'overview'),
(workspace_entity_id, 'theme_color', 'text', '#10b981'),
(workspace_entity_id, 'subtitle', 'text', 'Sales Lead Pipeline');
```

### Step 5: Configure Workspace Cards

Define the functional cards that appear in each navigation section:

```sql
-- Overview section cards  
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'cards_overview', 'json', '[
  {
    "view_slug": "entities-leads",
    "card_title": "Lead Database", 
    "card_description": "Manage all sales leads and contact information",
    "card_type": "entities",
    "icon": "Users",
    "color": "#3b82f6",
    "priority": 1,
    "metadata": {
      "entity_type": "LEAD",
      "smart_code": "HERA.CRM.LEAD.ENTITY.v1"
    }
  },
  {
    "view_slug": "workflows-qualification",
    "card_title": "Lead Qualification", 
    "card_description": "Qualification workflow and scoring",
    "card_type": "workflows",
    "icon": "CheckCircle", 
    "color": "#10b981",
    "priority": 2
  },
  {
    "view_slug": "analytics-pipeline",
    "card_title": "Pipeline Overview",
    "card_description": "Lead conversion and pipeline analytics", 
    "card_type": "analytics",
    "icon": "TrendingUp",
    "color": "#8b5cf6", 
    "priority": 3
  }
]');

-- Lead Management section cards
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'cards_leads', 'json', '[
  {
    "view_slug": "entities-leads",
    "card_title": "All Leads",
    "card_description": "Complete lead database with advanced filtering",
    "card_type": "entities", 
    "icon": "Database",
    "color": "#3b82f6",
    "priority": 1,
    "metadata": {
      "entity_type": "LEAD",
      "smart_code": "HERA.CRM.LEAD.ENTITY.v1"
    }
  },
  {
    "view_slug": "entities-contacts",
    "card_title": "Contacts",
    "card_description": "Contact information and communication history",
    "card_type": "entities",
    "icon": "User",
    "color": "#059669", 
    "priority": 2,
    "metadata": {
      "entity_type": "CONTACT",
      "smart_code": "HERA.CRM.CONTACT.ENTITY.v1"
    }
  },
  {
    "view_slug": "transactions-activities",
    "card_title": "Activities",
    "card_description": "Calls, meetings, and follow-up activities",
    "card_type": "transactions",
    "icon": "Calendar",
    "color": "#dc2626",
    "priority": 3,
    "metadata": {
      "transaction_type": "CRM_ACTIVITY",
      "smart_code": "HERA.CRM.TXN.ACTIVITY.v1"  
    }
  },
  {
    "view_slug": "relationships-accounts",
    "card_title": "Lead-Account Mapping",
    "card_description": "Map leads to accounts and opportunities", 
    "card_type": "relationships",
    "icon": "Link",
    "color": "#7c2d12",
    "priority": 4
  }
]');

-- Analytics section cards
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES  
(workspace_entity_id, 'cards_analytics', 'json', '[
  {
    "view_slug": "analytics-conversion",
    "card_title": "Conversion Funnel",
    "card_description": "Lead-to-customer conversion analytics",
    "card_type": "analytics",
    "icon": "TrendingUp", 
    "color": "#7c3aed",
    "priority": 1
  },
  {
    "view_slug": "analytics-sources",
    "card_title": "Lead Sources",
    "card_description": "Analysis of lead generation sources",
    "card_type": "analytics", 
    "icon": "PieChart",
    "color": "#dc2626",
    "priority": 2
  },
  {
    "view_slug": "analytics-performance",
    "card_title": "Sales Performance",
    "card_description": "Individual and team performance metrics",
    "card_type": "analytics",
    "icon": "Award",
    "color": "#059669",
    "priority": 3
  }
]');
```

## Testing Your Workspace

After creating the database entities, your workspace will be automatically available at:

```
http://localhost:3000/retail/domains/crm/sections/leads
```

The system will:
1. **Auto-detect the route** based on your entity configuration
2. **Load workspace data** from the database via `/api/v2/crm/leads/main` 
3. **Render the interface** using UniversalSAPWorkspace component
4. **Generate navigation** based on your nav_items configuration
5. **Display cards** for each navigation section

## Advanced Configuration Options

### Custom Workspace Themes

```sql
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'theme', 'json', '{
  "primary_color": "#3b82f6",
  "secondary_color": "#1e40af", 
  "accent_color": "#10b981",
  "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "typography": {
    "font_family": "Inter",
    "heading_weight": "600"
  }
}');
```

### Role-Based Card Visibility

```sql
-- Add role restrictions to specific cards
UPDATE core_dynamic_data 
SET field_value_json = jsonb_set(
  field_value_json::jsonb,
  '{0,metadata,required_roles}',
  '["sales_manager", "admin"]'::jsonb
)
WHERE field_name = 'cards_analytics';
```

### Custom Layouts

```sql
-- Configure grid layout options
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'layout_config', 'json', '{
  "card_grid_cols": {
    "mobile": 1,
    "tablet": 2, 
    "desktop": 3,
    "wide": 4
  },
  "card_sizes": {
    "default": "medium",
    "priority_1": "large",
    "analytics": "wide"
  },
  "spacing": "comfortable",
  "show_descriptions": true
}');
```

## Entity Type Definitions

When creating cards with `card_type: "entities"`, you need to define the corresponding entity types:

```sql
-- Create LEAD entity type definition in platform organization
INSERT INTO core_entities (
  entity_type,
  entity_code, 
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'ENTITY_TYPE_DEF',
  'LEAD',
  'Sales Lead',
  'HERA.CRM.ENTITY_TYPE.LEAD.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);

-- Define field configuration
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(lead_entity_type_id, 'fields', 'json', '[
  {
    "id": "lead_name",
    "label": "Lead Name", 
    "type": "text",
    "required": true,
    "smart_code": "HERA.CRM.LEAD.FIELD.NAME.v1"
  },
  {
    "id": "company",
    "label": "Company",
    "type": "text", 
    "required": true,
    "smart_code": "HERA.CRM.LEAD.FIELD.COMPANY.v1"
  },
  {
    "id": "email",
    "label": "Email",
    "type": "email",
    "required": true,
    "smart_code": "HERA.CRM.LEAD.FIELD.EMAIL.v1"
  },
  {
    "id": "phone", 
    "label": "Phone",
    "type": "phone",
    "smart_code": "HERA.CRM.LEAD.FIELD.PHONE.v1"
  },
  {
    "id": "lead_score",
    "label": "Lead Score",
    "type": "number",
    "min": 0,
    "max": 100,
    "smart_code": "HERA.CRM.LEAD.FIELD.SCORE.v1"
  }
]');
```

## Card Type Reference

### 1. Entities Card (`"card_type": "entities"`)
**Purpose**: Master data CRUD operations

**Required metadata**:
```json
{
  "entity_type": "LEAD",
  "smart_code": "HERA.CRM.LEAD.ENTITY.v1"
}
```

**Generated route**: `/crm/leads/main/entities/LEAD`

**Features**:
- Full CRUD operations via UniversalEntityListShell
- Field configuration from organization preferences
- Search, filter, and sort capabilities
- Bulk operations and export functionality

### 2. Transactions Card (`"card_type": "transactions"`) 
**Purpose**: Business transaction processing

**Required metadata**:
```json
{
  "transaction_type": "CRM_ACTIVITY", 
  "smart_code": "HERA.CRM.TXN.ACTIVITY.v1"
}
```

**Generated route**: `/crm/leads/main/transactions/CRM_ACTIVITY`

**Features**:
- Transaction creation and processing
- Workflow integration
- Audit trails and approval processes
- Related entity linking

### 3. Workflows Card (`"card_type": "workflows"`)
**Purpose**: Process automation and state management

**Generated route**: `/crm/leads/main/workflows/qualification`

**Features**:
- State machine configuration
- Approval workflows
- Business rule enforcement  
- Notification management

### 4. Relationships Card (`"card_type": "relationships"`)
**Purpose**: Entity relationship management

**Generated route**: `/crm/leads/main/relationships/accounts`

**Features**:
- Hierarchical relationship mapping
- Visual relationship diagrams
- Temporal relationship tracking
- Bulk relationship operations

### 5. Analytics Card (`"card_type": "analytics"`)
**Purpose**: Business intelligence and reporting

**Generated route**: `/crm/leads/main/analytics/conversion`

**Features**:
- Dynamic dashboard creation
- Custom report builder
- Real-time data visualization  
- Export and scheduling capabilities

## Organization Field Configuration Integration

Your dynamic workspaces automatically respect organization field configurations:

```sql
-- Example: Customize lead fields for a specific organization
UPDATE core_organizations 
SET settings = jsonb_set(
  settings,
  '{entity_field_configs,LEAD}',
  '{
    "entity_type": "LEAD",
    "smart_code": "HERA.ACME.LEAD.CONFIG.v1",
    "fields": [
      {
        "id": "lead_name",
        "required": true,
        "validation": {"minLength": 3}
      },
      {
        "id": "industry", 
        "type": "select",
        "enum": ["technology", "healthcare", "finance"],
        "required": true
      },
      {
        "id": "budget_range",
        "type": "select", 
        "enum": ["<10k", "10k-50k", "50k-100k", ">100k"]
      }
    ]
  }'::jsonb
)
WHERE id = 'target-organization-id';
```

## Best Practices

### 1. Smart Code Naming Convention
Always follow the HERA DNA pattern:
```
HERA.{DOMAIN}.{MODULE}.{TYPE}.{SUBTYPE}.v1
```

Examples:
- `HERA.CRM.LEAD.ENTITY.v1` - Lead entity type
- `HERA.CRM.TXN.ACTIVITY.v1` - Activity transaction
- `HERA.CRM.WORKFLOW.QUALIFICATION.v1` - Lead qualification workflow

### 2. Icon and Color Standards
Use consistent Lucide React icons and brand colors:

**Common Icons**:
- `Users` - Customer/contact management
- `Target` - Sales/leads
- `DollarSign` - Financial operations  
- `Package` - Inventory/products
- `BarChart3` - Analytics
- `Settings` - Configuration
- `Calendar` - Time-based activities

**Color Palette**:
- Blue (`#3b82f6`) - Primary actions, entities
- Green (`#10b981`) - Success, completed workflows
- Purple (`#8b5cf6`) - Analytics, reports
- Orange (`#f59e0b`) - Warnings, pending items
- Red (`#dc2626`) - Urgent, critical items

### 3. Card Priority and Organization
**Priority 1**: Most frequently used operations
**Priority 2**: Secondary operations  
**Priority 3+**: Advanced/admin functions

**Group by frequency of use**:
- Overview section: High-level summary cards
- Main section: Core business operations
- Analytics section: Reporting and insights

### 4. Performance Considerations

**Card Loading**:
```sql
-- Add loading hints for heavy operations
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'performance_hints', 'json', '{
  "lazy_load": ["analytics", "heavy_reports"],
  "cache_duration": 300,
  "preload": ["entities-leads"],
  "batch_size": 50
}');
```

**Route Prefetching**:
The system automatically prefetches related routes, but you can configure priorities:

```sql
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workspace_entity_id, 'prefetch_routes', 'json', '[
  "/crm/domains/crm",
  "/retail/dashboard", 
  "/crm/leads/main/entities/LEAD"
]');
```

## Troubleshooting

### Common Issues

**1. Workspace not appearing**
- Check that all relationships are correctly created
- Verify organization_id is platform organization UUID
- Ensure Smart Codes follow HERA DNA pattern

**2. Cards not loading**
- Validate JSON structure in card configuration 
- Check that entity_type exists for entities cards
- Verify icon names match Lucide React icons

**3. Navigation not working**  
- Confirm nav_items JSON is valid
- Check that card sections match navigation codes
- Verify default_nav matches an existing nav code

**4. Field configuration not loading**
- Ensure entity type definitions exist
- Check organization field config service is working
- Verify field Smart Codes are correct

### Debug SQL Queries

**Check workspace configuration**:
```sql
-- Get complete workspace setup
SELECT 
  ce.entity_code,
  ce.entity_name,
  ce.smart_code,
  cdd.field_name,
  cdd.field_value_json
FROM core_entities ce
LEFT JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id  
WHERE ce.entity_type = 'APP_WORKSPACE'
AND ce.entity_code = 'main'
ORDER BY ce.entity_code, cdd.field_name;
```

**Verify relationships**:
```sql
-- Check domain -> section -> workspace relationships
SELECT 
  source.entity_code as source_code,
  source.entity_name as source_name,
  target.entity_code as target_code, 
  target.entity_name as target_name,
  cr.relationship_type
FROM core_relationships cr
JOIN core_entities source ON cr.source_entity_id = source.id
JOIN core_entities target ON cr.target_entity_id = target.id  
WHERE source.entity_type IN ('APP_DOMAIN', 'APP_SECTION')
AND target.entity_type IN ('APP_SECTION', 'APP_WORKSPACE')
ORDER BY source.entity_type, target.entity_type;
```

## Next Steps

1. **Create Entity Types**: Define the entity types referenced in your cards
2. **Test Navigation**: Verify all routes work correctly  
3. **Configure Fields**: Set up organization field configurations
4. **Add Security**: Configure role-based access controls
5. **Optimize Performance**: Add caching and prefetching hints

## Support

For additional help:
- Review existing retail app examples in `/src/app/retail/domains/`
- Check component documentation in `/docs/components/`
- Reference Sacred Six schema in `/docs/schema/hera-sacred-six-schema.yaml`
- Test with MCP tools in `/mcp-server/`

The Dynamic Pages system is designed to be intuitive and follow consistent patterns. Once you understand the basic entity -> relationship -> configuration flow, creating new workspaces becomes straightforward.