# HERA Universal Dynamic Workspace System

## 🎯 Overview

The **Universal Dynamic Workspace System** enables you to create fully database-driven, SAP Fiori-style workspaces that work with **ANY app** (retail, agro, central, salon, etc.) without writing any code.

**Smart Code:** `HERA.UNIVERSAL.WORKSPACE.v1`

---

## ✨ Key Features

- 🌍 **App-Agnostic**: Works with retail, agro, central, salon, or any future app
- 📊 **Database-Driven**: All configuration stored in Sacred Six tables
- 🔗 **Relationship-Based**: Uses APP_HAS_DOMAIN → HAS_SECTION → HAS_WORKSPACE chain
- 🎨 **SAP Fiori Design**: Professional enterprise UI with glassmorphism
- ⚡ **Zero Code Required**: Add new workspaces without touching code
- 🚀 **Performance Optimized**: Built-in caching and prefetching

---

## 📐 URL Architecture

### Pattern
```
/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]
```

### Examples
```
✅ /retail/domains/analytics/sections/fin/workspaces/main
✅ /agro/domains/farm/sections/crops/workspaces/planning
✅ /central/domains/admin/sections/users/workspaces/main
✅ /salon/domains/operations/sections/appointments/workspaces/calendar
```

---

## 🗄️ Database Structure

### Relationship Chain

```
APP Entity (entity_type='APP')
  ↓ APP_HAS_DOMAIN
DOMAIN Entity (entity_type='DOMAIN')
  ↓ HAS_SECTION
SECTION Entity (entity_type='SECTION')
  ↓ HAS_WORKSPACE
WORKSPACE Entity (entity_type='WORKSPACE')
```

### Required Tables (Sacred Six)

1. **core_entities** - Stores APP, DOMAIN, SECTION, WORKSPACE entities
2. **core_relationships** - Stores the relationship chain
3. **core_dynamic_data** - Stores layout_config for workspaces

---

## 🔧 Setup Guide

### Step 1: Create the APP Entity (if not exists)

```sql
-- Create APP entity (platform organization)
INSERT INTO core_entities (
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'APP',
  'retail',  -- or 'agro', 'central', etc.
  'Retail Application',
  'HERA.RETAIL.APP.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;
```

### Step 2: Create DOMAIN Entity

```sql
-- Create DOMAIN entity
INSERT INTO core_entities (
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'DOMAIN',
  'analytics',  -- domain code (used in URL)
  'Analytics Domain',
  'HERA.RETAIL.DOMAIN.ANALYTICS.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;

-- Link domain to app with APP_HAS_DOMAIN relationship
INSERT INTO core_relationships (
  from_entity_id,  -- APP entity ID
  to_entity_id,    -- DOMAIN entity ID
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  '<app_entity_id>',
  '<domain_entity_id>',
  'APP_HAS_DOMAIN',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

### Step 3: Create SECTION Entity

```sql
-- Create SECTION entity
INSERT INTO core_entities (
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'SECTION',
  'fin',  -- section code (used in URL)
  'Finance Section',
  'HERA.RETAIL.SECTION.FIN.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;

-- Link section to domain with HAS_SECTION relationship
INSERT INTO core_relationships (
  from_entity_id,  -- DOMAIN entity ID
  to_entity_id,    -- SECTION entity ID
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  '<domain_entity_id>',
  '<section_entity_id>',
  'HAS_SECTION',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

### Step 4: Create WORKSPACE Entity

```sql
-- Create WORKSPACE entity
INSERT INTO core_entities (
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  metadata,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'WORKSPACE',
  'main',  -- workspace code (used in URL)
  'Main Workspace',
  'HERA.RETAIL.WORKSPACE.MAIN.v1',
  '{
    "subtitle": "Main workspace for finance analytics",
    "icon": "Grid3x3",
    "color": "#6366f1",
    "persona_label": "Finance Manager",
    "visible_roles": ["manager", "analyst"]
  }'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;

-- Link workspace to section with HAS_WORKSPACE relationship
INSERT INTO core_relationships (
  from_entity_id,  -- SECTION entity ID
  to_entity_id,    -- WORKSPACE entity ID
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  '<section_entity_id>',
  '<workspace_entity_id>',
  'HAS_WORKSPACE',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

### Step 5: Configure Workspace Layout

```sql
-- Add layout_config to workspace dynamic data
INSERT INTO core_dynamic_data (
  entity_id,  -- WORKSPACE entity ID
  field_name,
  field_type,
  field_value_json,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  '<workspace_entity_id>',
  'layout_config',
  'json',
  '{
    "default_nav_code": "overview",
    "nav_items": [
      { "code": "overview", "label": "Overview" },
      { "code": "reports", "label": "Reports" },
      { "code": "analytics", "label": "Analytics" }
    ],
    "sections": [
      {
        "nav_code": "overview",
        "title": "Overview",
        "cards": [
          {
            "label": "Revenue Dashboard",
            "subtitle": "View revenue metrics and trends",
            "icon": "BarChart3",
            "view_slug": "revenue-dashboard",
            "target_type": "analytics",
            "priority": "high",
            "status": "active",
            "metrics": {
              "value": "$1.2M",
              "label": "This Month",
              "trend": "up",
              "change": "+12%"
            }
          },
          {
            "label": "Customer Reports",
            "subtitle": "Customer analytics and insights",
            "icon": "Users",
            "view_slug": "customer-reports",
            "target_type": "report",
            "priority": "medium"
          }
        ]
      },
      {
        "nav_code": "reports",
        "title": "Reports",
        "cards": [
          {
            "label": "Sales Report",
            "subtitle": "Detailed sales analysis",
            "icon": "FileText",
            "view_slug": "sales-report",
            "target_type": "report"
          }
        ]
      }
    ]
  }'::jsonb,
  'HERA.RETAIL.WORKSPACE.LAYOUT.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

---

## 🎨 Layout Configuration Schema

### Top-Level Structure

```typescript
interface LayoutConfig {
  default_nav_code: string        // Which section to show first
  nav_items: NavItem[]            // Left sidebar navigation items
  sections: WorkspaceSection[]    // Content sections
}
```

### Nav Items

```typescript
interface NavItem {
  code: string      // Unique identifier (matches section nav_code)
  label: string     // Display text in sidebar
}
```

### Sections

```typescript
interface WorkspaceSection {
  nav_code: string           // Matches nav_item code
  title: string              // Section title
  cards: WorkspaceCard[]     // Cards displayed in this section
}
```

### Cards

```typescript
interface WorkspaceCard {
  label: string              // Card title
  subtitle: string           // Card description
  icon: string               // Lucide icon name
  view_slug: string          // Unique identifier for routing
  target_type: string        // Type of target page (see below)

  // Optional fields
  entity_type?: string       // For entity cards
  priority?: 'high' | 'medium' | 'low'
  status?: 'active' | 'warning' | 'error' | 'disabled'

  metrics?: {
    value: string | number   // Main metric value
    unit?: string            // Unit (e.g., '$', 'items')
    label?: string           // Metric label
    trend?: 'up' | 'down' | 'neutral'
    change?: string          // Change percentage (e.g., '+12%')
  }

  lastUpdated?: string       // ISO date string
}
```

### Target Types

Cards are automatically routed based on `target_type`:

| Target Type | Route Pattern | Example |
|------------|---------------|---------|
| `entity` or `entities` | `/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/entities/[type]` | Entities list page |
| `transaction` or `transactions` | `/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/transactions/[type]` | Transactions page |
| `workflow` or `workflows` | `/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/workflows/[slug]` | Workflow page |
| `relationship` or `relationships` | `/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/relationships/[slug]` | Relationships page |
| `analytics` | `/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/analytics/[slug]` | Analytics page |
| `report` or `reports` | `/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/reports/[slug]` | Report page |

---

## 📊 Complete Example: Agro App

### SQL Setup Script

```sql
-- 1. Create AGRO app
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, organization_id, created_by, updated_by)
VALUES ('APP', 'agro', 'Agriculture Application', 'HERA.AGRO.APP.v1', '00000000-0000-0000-0000-000000000000', 'system', 'system')
RETURNING id AS app_id;

-- 2. Create FARM domain
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, organization_id, created_by, updated_by)
VALUES ('DOMAIN', 'farm', 'Farm Management Domain', 'HERA.AGRO.DOMAIN.FARM.v1', '00000000-0000-0000-0000-000000000000', 'system', 'system')
RETURNING id AS domain_id;

-- 3. Link domain to app
INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
VALUES ('<app_id>', '<domain_id>', 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', 'system', 'system');

-- 4. Create CROPS section
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, organization_id, created_by, updated_by)
VALUES ('SECTION', 'crops', 'Crops Management Section', 'HERA.AGRO.SECTION.CROPS.v1', '00000000-0000-0000-0000-000000000000', 'system', 'system')
RETURNING id AS section_id;

-- 5. Link section to domain
INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
VALUES ('<domain_id>', '<section_id>', 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', 'system', 'system');

-- 6. Create PLANNING workspace
INSERT INTO core_entities (
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  metadata,
  organization_id,
  created_by,
  updated_by
)
VALUES (
  'WORKSPACE',
  'planning',
  'Crop Planning Workspace',
  'HERA.AGRO.WORKSPACE.PLANNING.v1',
  '{
    "subtitle": "Plan and manage crop cultivation",
    "icon": "Calendar",
    "color": "#10b981",
    "persona_label": "Farm Manager",
    "visible_roles": ["farm_manager", "agronomist"]
  }'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id AS workspace_id;

-- 7. Link workspace to section
INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
VALUES ('<section_id>', '<workspace_id>', 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', 'system', 'system');

-- 8. Add layout configuration
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_type,
  field_value_json,
  smart_code,
  organization_id,
  created_by,
  updated_by
)
VALUES (
  '<workspace_id>',
  'layout_config',
  'json',
  '{
    "default_nav_code": "overview",
    "nav_items": [
      { "code": "overview", "label": "Overview" },
      { "code": "planting", "label": "Planting" },
      { "code": "harvest", "label": "Harvest" }
    ],
    "sections": [
      {
        "nav_code": "overview",
        "title": "Crop Planning Overview",
        "cards": [
          {
            "label": "Active Crops",
            "subtitle": "Currently growing crops",
            "icon": "Package",
            "view_slug": "active-crops",
            "target_type": "entity",
            "entity_type": "CROP",
            "priority": "high",
            "status": "active",
            "metrics": {
              "value": 24,
              "unit": "crops",
              "label": "Growing",
              "trend": "up",
              "change": "+3"
            }
          },
          {
            "label": "Planting Schedule",
            "subtitle": "Upcoming planting activities",
            "icon": "Calendar",
            "view_slug": "planting-schedule",
            "target_type": "workflow",
            "priority": "high"
          },
          {
            "label": "Harvest Forecast",
            "subtitle": "Expected harvest dates",
            "icon": "TrendingUp",
            "view_slug": "harvest-forecast",
            "target_type": "analytics",
            "priority": "medium"
          },
          {
            "label": "Crop Performance",
            "subtitle": "Yield and quality metrics",
            "icon": "BarChart3",
            "view_slug": "crop-performance",
            "target_type": "report"
          }
        ]
      },
      {
        "nav_code": "planting",
        "title": "Planting Management",
        "cards": [
          {
            "label": "New Planting",
            "subtitle": "Create new planting plan",
            "icon": "PlusCircle",
            "view_slug": "new-planting",
            "target_type": "workflow"
          },
          {
            "label": "Seed Inventory",
            "subtitle": "Available seeds",
            "icon": "Package",
            "view_slug": "seed-inventory",
            "target_type": "entity",
            "entity_type": "SEED"
          }
        ]
      },
      {
        "nav_code": "harvest",
        "title": "Harvest Planning",
        "cards": [
          {
            "label": "Ready to Harvest",
            "subtitle": "Crops ready for harvest",
            "icon": "Clock",
            "view_slug": "ready-harvest",
            "target_type": "entity",
            "entity_type": "CROP",
            "metrics": {
              "value": 5,
              "unit": "crops",
              "label": "Ready"
            }
          },
          {
            "label": "Harvest Report",
            "subtitle": "Historical harvest data",
            "icon": "FileText",
            "view_slug": "harvest-report",
            "target_type": "report"
          }
        ]
      }
    ]
  }'::jsonb,
  'HERA.AGRO.WORKSPACE.LAYOUT.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);
```

### Access the Workspace

```
http://localhost:3000/agro/domains/farm/sections/crops/workspaces/planning
```

---

## 🔍 API Endpoint

### Endpoint
```
GET /api/v2/[domain]/[section]/[workspace]
```

**Note:** The `app` parameter is used for UI routing only, not in the API endpoint.

### Example Request
```
GET /api/v2/farm/crops/planning
```

### Response Format
```json
{
  "workspace": {
    "id": "workspace-uuid",
    "entity_name": "Crop Planning Workspace",
    "entity_code": "planning",
    "slug": "planning",
    "subtitle": "Plan and manage crop cultivation",
    "icon": "Calendar",
    "color": "#10b981",
    "persona_label": "Farm Manager",
    "visible_roles": ["farm_manager", "agronomist"],
    "route": "/agro/domains/farm/sections/crops/workspaces/planning"
  },
  "layout_config": {
    "default_nav_code": "overview",
    "nav_items": [...],
    "sections": [...]
  }
}
```

---

## 🛠️ Files and Components

### Core Components

| File | Purpose |
|------|---------|
| `/src/components/universal/workspace/UniversalWorkspace.tsx` | Universal workspace component (app-agnostic) |
| `/src/app/[app]/domains/[domain]/sections/[section]/workspaces/[workspace]/page.tsx` | Dynamic route page |
| `/src/app/api/v2/[domain]/[section]/[workspace]/route.ts` | Existing database-driven API endpoint |

### Legacy Components (Deprecated)

| File | Status | Migration |
|------|--------|-----------|
| `/src/components/retail/workspace/UniversalSAPWorkspace.tsx` | ⚠️ Deprecated | Use UniversalWorkspace instead |
| `/src/app/retail/domains/[domain]/sections/[section]/page.tsx` | ✅ Updated | Now uses UniversalWorkspace with app="retail" |

---

## 🎯 Usage Examples

### Retail Analytics Workspace
```
URL: /retail/domains/analytics/sections/fin/workspaces/main
App: retail
Domain: analytics
Section: fin
Workspace: main
```

### Agro Farm Planning Workspace
```
URL: /agro/domains/farm/sections/crops/workspaces/planning
App: agro
Domain: farm
Section: crops
Workspace: planning
```

### Central Admin Workspace
```
URL: /central/domains/admin/sections/users/workspaces/main
App: central
Domain: admin
Section: users
Workspace: main
```

---

## 🔐 Security & Multi-Tenancy

### Organization Isolation

- Platform entities (APP, DOMAIN, SECTION, WORKSPACE) stored with organization_id = `00000000-0000-0000-0000-000000000000`
- User data isolated by actual organization_id
- API automatically filters by organization context from HERAAuthProvider

### Access Control

- `visible_roles` in workspace metadata controls role-based access
- HERAAuthProvider validates user authentication and organization membership
- API enforces organization isolation automatically

---

## 📈 Performance Features

### Caching

- **Client-side cache**: 5-minute TTL with stale-while-revalidate
- **API cache headers**: `Cache-Control: public, max-age=300, stale-while-revalidate=600`
- **Prefetching**: Related routes preloaded in background

### Optimizations

- Lazy loading for sections
- Debounced search filtering
- Recently used tracking
- Favorite cards persistence

---

## 🧪 Testing Your Workspace

### Step 1: Verify Database Setup

```sql
-- Check if relationship chain exists
SELECT
  app.entity_code AS app,
  domain.entity_code AS domain,
  section.entity_code AS section,
  workspace.entity_code AS workspace
FROM core_entities app
JOIN core_relationships r1 ON r1.from_entity_id = app.id AND r1.relationship_type = 'APP_HAS_DOMAIN'
JOIN core_entities domain ON domain.id = r1.to_entity_id
JOIN core_relationships r2 ON r2.from_entity_id = domain.id AND r2.relationship_type = 'HAS_SECTION'
JOIN core_entities section ON section.id = r2.to_entity_id
JOIN core_relationships r3 ON r3.from_entity_id = section.id AND r3.relationship_type = 'HAS_WORKSPACE'
JOIN core_entities workspace ON workspace.id = r3.to_entity_id
WHERE app.entity_code = 'agro';
```

### Step 2: Test API Endpoint

```bash
curl http://localhost:3000/api/v2/workspace/agro/farm/crops/planning
```

### Step 3: Access in Browser

```
http://localhost:3000/agro/domains/farm/sections/crops/workspaces/planning
```

---

## 🚨 Troubleshooting

### Common Issues

**Issue:** "App not found"
```
Solution: Verify APP entity exists with correct entity_code
```

**Issue:** "Domain not found for app"
```
Solution: Check APP_HAS_DOMAIN relationship exists
```

**Issue:** "Section not found for domain"
```
Solution: Check HAS_SECTION relationship exists
```

**Issue:** "Workspace not found"
```
Solution: Check HAS_WORKSPACE relationship exists
```

**Issue:** "Layout config not loading"
```
Solution: Verify core_dynamic_data has layout_config field for workspace entity
```

### Debug Queries

```sql
-- Find APP entity
SELECT * FROM core_entities
WHERE entity_type = 'APP' AND entity_code = 'agro';

-- Find all domains for an app
SELECT domain.*
FROM core_entities app
JOIN core_relationships r ON r.from_entity_id = app.id
JOIN core_entities domain ON domain.id = r.to_entity_id
WHERE app.entity_code = 'agro'
  AND r.relationship_type = 'APP_HAS_DOMAIN';

-- Find workspace layout config
SELECT cdd.field_value_json
FROM core_entities workspace
JOIN core_dynamic_data cdd ON cdd.entity_id = workspace.id
WHERE workspace.entity_code = 'planning'
  AND cdd.field_name = 'layout_config';
```

---

## 🎓 Best Practices

### 1. Naming Conventions

- **entity_code**: Use lowercase, kebab-case (e.g., `crop-planning`, `main`)
- **Smart Codes**: Follow HERA DNA pattern (e.g., `HERA.AGRO.WORKSPACE.PLANNING.v1`)
- **Icons**: Use valid Lucide icon names

### 2. Layout Design

- Keep nav_items between 3-7 for usability
- Use meaningful card priorities (high, medium, low)
- Include metrics where relevant to show live data
- Group related cards in the same section

### 3. Performance

- Keep layout_config under 100KB
- Limit cards per section to 20-30
- Use appropriate target_types for proper routing
- Test with real data volumes

### 4. Security

- Always use platform organization for APP/DOMAIN/SECTION/WORKSPACE
- Never hardcode organization IDs in layouts
- Use visible_roles for role-based access
- Validate user permissions at API layer

---

## 📝 Summary

The Universal Dynamic Workspace System provides:

✅ **Zero-code workspace creation** - Just configure in database
✅ **Works with any app** - retail, agro, central, salon, etc.
✅ **SAP Fiori design** - Professional enterprise UI
✅ **Fully dynamic** - All configuration database-driven
✅ **Performance optimized** - Caching and prefetching built-in
✅ **Secure by default** - Multi-tenant with organization isolation

**Start building your workspaces today!** 🚀
