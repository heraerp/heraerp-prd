# Universal UI System

## Overview

The Universal UI system is a revolutionary approach to building enterprise applications where UI is generated dynamically from metadata rather than being hardcoded. This enables zero-code UI development for any entity type while maintaining complete flexibility.

## Core Concepts

### 1. Smart Code Driven

Every entity has a smart code that determines:

- Which widgets to display
- How data should be presented
- Available actions and workflows
- Business rules and validations

### 2. Metadata-Powered Views

UI configuration is stored in `core_dynamic_data` as JSON metadata that describes:

- Widget types and layouts
- Field configurations
- Data sources and queries
- Actions and navigation

### 3. Zero Custom Components

New entity types automatically get:

- Complete CRUD interfaces
- List views with sorting/filtering
- Detail forms with validation
- Charts and analytics
- Workflow visualizations

## Architecture

```
UniversalRenderer (Main Component)
├── ViewMetaService (Metadata Engine)
│   ├── Reads smart codes
│   ├── Generates UI metadata
│   └── Manages view configurations
│
├── Widget Components
│   ├── FormWidget - Data entry forms
│   ├── GridWidget - Data tables with actions
│   ├── StatsWidget - KPI cards and metrics
│   ├── ChartWidget - Data visualizations
│   ├── TimelineWidget - Activity history
│   └── [More widgets...]
│
└── Universal API Integration
    ├── CRUD operations
    ├── Workflow actions
    └── Data aggregations
```

## Usage

### Basic Implementation

```tsx
import { UniversalRenderer } from '@/components/universal-ui/UniversalRenderer'
;<UniversalRenderer
  smartCode="HERA.FURN.BOM.ITEM.PRODUCT.V1"
  viewType="detail"
  entityId={productId}
  organizationId={orgId}
  onAction={handleAction}
/>
```

### View Types

- **detail** - Single entity view with all details
- **list** - Grid view of multiple entities
- **form** - Data entry/edit form
- **dashboard** - Analytics and KPIs
- **workflow** - Process visualization
- **timeline** - Activity history

## Metadata Structure

### View Metadata

```json
{
  "id": "view-id",
  "smart_code": "HERA.MODULE.ENTITY.VIEW.V1",
  "view_type": "detail",
  "title": "View Title",
  "widgets": [
    {
      "id": "widget-1",
      "type": "form",
      "config": {
        "fields": [...],
        "validation_rules": [...]
      }
    }
  ],
  "actions": [
    {
      "id": "save",
      "label": "Save",
      "type": "custom",
      "smart_code": "HERA.ACTION.SAVE.v1"
    }
  ]
}
```

### Widget Types

#### Form Widget

```json
{
  "type": "form",
  "config": {
    "fields": [
      {
        "name": "entity_name",
        "label": "Name",
        "type": "text",
        "required": true,
        "validation": [...]
      }
    ]
  }
}
```

#### Grid Widget

```json
{
  "type": "grid",
  "config": {
    "columns": [
      {
        "field": "entity_name",
        "header": "Name",
        "type": "text",
        "sortable": true
      }
    ],
    "row_actions": [...],
    "pagination": {...}
  }
}
```

## BOM Example

The Furniture BOM implementation demonstrates:

### 1. Complex Data Relationships

- Products have components (via relationships)
- Components can be raw materials or sub-assemblies
- Multi-level BOMs with cost rollup

### 2. Rich UI Without Code

- Stats dashboard with cost breakdowns
- Component grid with inline editing
- Cost charts and visualizations
- Revision timeline tracking
- Workflow status management

### 3. Smart Code Intelligence

```
HERA.FURN.BOM.ITEM.PRODUCT.V1
├── Industry: FURN (Furniture)
├── Module: BOM (Bill of Materials)
├── Type: ITEM (Product/Component)
└── Subtype: PRODUCT (Finished good)
```

## API Integration

### Get View Metadata

```typescript
GET /api/v1/universal-ui?action=get_metadata&smart_code=XXX&view_type=detail
```

### Execute Actions

```typescript
POST /api/v1/universal-ui
{
  "action": "execute_action",
  "actionConfig": {...},
  "entityId": "xxx",
  "data": {...}
}
```

### Calculate BOM Cost

```typescript
POST /api/v1/universal-ui
{
  "action": "calculate_bom_cost",
  "bomId": "xxx"
}
```

## Seeding Demo Data

To create demo BOM data:

```typescript
POST /api/v1/universal-ui/seed
{
  "organizationId": "your-org-id",
  "action": "seed"
}
```

This creates:

- Workflow statuses
- Raw material components
- Sub-assemblies with relationships
- Finished products with complete BOMs
- Revision history transactions

## Extending the System

### Adding New Widget Types

1. Create widget component in `/widgets`
2. Register in `UniversalRenderer`
3. Define widget config schema
4. Handle data loading and actions

### Custom View Metadata

1. Create metadata JSON structure
2. Store in `core_dynamic_data`
3. Reference by smart code
4. Override default generation

### Industry-Specific Patterns

- Use smart code prefixes (FURN, REST, HLTH)
- Define industry widgets and layouts
- Create reusable metadata templates
- Share across organizations

## Benefits

1. **Zero Development Time** - New entities get UI automatically
2. **Consistent UX** - All entities follow same patterns
3. **Easy Maintenance** - Change metadata, not code
4. **Perfect Flexibility** - Override anything via metadata
5. **Multi-Tenant Ready** - Organization isolation built-in
6. **Smart Code Intelligence** - Business context everywhere

## Future Enhancements

- [ ] Drag-and-drop layout designer
- [ ] More widget types (Gantt, Calendar, Map)
- [ ] AI-powered metadata generation
- [ ] Cross-entity dashboards
- [ ] Mobile-responsive layouts
- [ ] Offline support with sync
