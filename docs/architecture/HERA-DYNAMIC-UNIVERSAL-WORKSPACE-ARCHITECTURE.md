# HERA Dynamic Universal Workspace Architecture

**Smart Code**: `HERA.PLATFORM.ARCHITECTURE.DYNAMIC_WORKSPACES.v1`

## Overview

HERA's Dynamic Universal Workspace Architecture represents a revolutionary approach to enterprise application interfaces. Instead of hardcoded pages and routes, the entire user interface is generated dynamically from database entities using the Sacred Six compliance model.

This system enables:
- **Zero-Code Configuration**: New workspaces created by database entries
- **Universal Components**: Same interface works across all business domains  
- **Organization Customization**: Field configurations and preferences respected
- **Role-Based Access**: Dynamic based on user memberships and permissions
- **SAP Fiori UX Standards**: Enterprise-grade user experience patterns

## System Architecture

### 3-Level Dynamic Navigation Hierarchy

#### **Level 1 - Dashboard** (`/retail/dashboard`)
**Purpose**: Organization-specific entry point with role-based access control

**Technical Implementation**:
```typescript
// Dashboard loads user context and available domains
const { user, organization, isAuthenticated } = useHERAAuth()
const { data: domains } = useUniversalEntityV1({
  entity_type: 'APP_DOMAIN',
  organization_id: organization.id
})
```

**Key Features**:
- Organization-specific dashboard widgets
- Role-based domain visibility 
- Performance metrics and KPIs
- Quick navigation to frequently used workspaces

#### **Level 2 - Domain Pages** (`/retail/domains/[domain]`)
**Purpose**: Database-driven domain layouts with comprehensive 3-column enterprise layout

**Technical Implementation**:
```typescript
// Extract domain from URL params and fetch related sections
const domainEntity = await apiV2.get('entities', {
  entity_type: 'APP_DOMAIN',
  entity_code: domain,
  organization_id: orgId
})

const sections = await apiV2.get('relationships', {
  source_entity_type: 'APP_DOMAIN',
  source_entity_id: domainEntity.id,
  target_entity_type: 'APP_SECTION',
  relationship_type: 'HAS_SECTION'
})
```

**Layout Structure**:
- **Left Column**: Domain-specific news and updates
- **Center Column**: Dynamic section modules, apps, and insights  
- **Right Column**: HERA AI Assistant with domain context

**Data Flow**:
1. Extract domain from URL params
2. Find APP_DOMAIN entity matching domain slug
3. Fetch APP_SECTION entities where parent_entity_id = APP_DOMAIN.id
4. Display comprehensive domain overview with interactive components

#### **Level 3 - Section Workspaces** (`/retail/domains/[domain]/sections/[section]`)
**Purpose**: Universal SAP Fiori-style workspaces with fully database-driven configuration

**Technical Implementation**:
```typescript
// Load workspace configuration from APP_WORKSPACE entities
const workspaceData = await fetch(`/api/v2/${domain}/${section}/${workspace}`)
const { layout_config, nav_items, workspace_cards } = workspaceData
```

**Key Components**:
- **UniversalSAPWorkspace**: Main workspace container
- **Dynamic Card System**: Workspace cards generated from database config
- **Navigation**: Side nav items from workspace configuration
- **Content Areas**: Dynamic based on selected navigation item

## The 5 Universal CRUD Operation Types

From any Level 3 workspace, the system dynamically generates routes for complete business operations:

### 1. **Master Data CRUD** (`/entities/[type]`)
**Purpose**: Dynamic entity management with organization field configuration

**Route Generation**:
```typescript
case 'entities':
  const entityType = card.metadata?.entity_type || 'items'
  targetRoute = `/${domain}/${section}/${workspace}/entities/${entityType}`
```

**Features**:
- **UniversalEntityListShell**: Reusable entity management interface
- **Sacred Six Compliance**: All operations use core_entities + core_dynamic_data
- **Field Configuration**: Respects organization preferences and industry templates
- **Mobile-First Design**: Responsive three-panel layout with grid/list views
- **Dynamic Filtering**: Search, sort, and filter based on entity attributes

**Technical Stack**:
- Component: `UniversalEntityListShell`
- API: Universal Entity API v2 with organization filtering
- Data Model: core_entities + core_dynamic_data aggregation

### 2. **Transaction CRUD** (`/transactions/[type]`)
**Purpose**: Universal transaction processing with automatic GL posting

**Route Generation**:
```typescript
case 'transactions':
  const transactionType = card.metadata?.transaction_type || 'general'  
  targetRoute = `/${domain}/${section}/${workspace}/transactions/${transactionType}`
```

**Features**:
- **Universal Transaction Interface**: Supports any business transaction type
- **Automatic GL Posting**: RPC-driven with balance validation
- **Audit Trails**: Complete actor stamping and transaction history
- **Multi-Currency Support**: Currency conversion and rate management
- **Tax Integration**: GST/VAT calculations with regional compliance

**Technical Stack**:
- RPC Function: `hera_txn_crud_v1` 
- Data Model: universal_transactions + universal_transaction_lines
- Validation: Smart Code patterns + GL balance enforcement

### 3. **Workflow CRUD** (`/workflows/[type]`)
**Purpose**: Process automation and workflow management with state machines

**Route Generation**:
```typescript
case 'workflows':
  targetRoute = `/${domain}/${section}/${workspace}/workflows/${card.view_slug}`
```

**Features**:
- **State Machine Management**: Workflows driven by relationships
- **Business Rule Enforcement**: Policy engine integration
- **Approval Hierarchies**: Multi-level approval workflows
- **Notification System**: Email/SMS notifications on state changes
- **SLA Tracking**: Performance monitoring and escalation

**Technical Stack**:
- Data Model: core_relationships for state transitions
- Rules Engine: FICO policy-as-data integration
- Events: universal_transactions for workflow audit trail

### 4. **Relationship CRUD** (`/relationships/[type]`)
**Purpose**: Entity relationship management with temporal tracking

**Route Generation**:
```typescript
case 'relationships':
  targetRoute = `/${domain}/${section}/${workspace}/relationships/${card.view_slug}`
```

**Features**:
- **Hierarchical Management**: Parent-child entity relationships
- **Mapping Interfaces**: Cross-domain entity associations
- **Temporal Relationships**: Effective/expiry date management
- **Visual Relationship Maps**: Interactive relationship diagrams
- **Bulk Operations**: Mass relationship updates and imports

**Technical Stack**:
- Data Model: core_relationships with source/target entity IDs
- Validation: Prevents circular dependencies and invalid relationships
- UI: Interactive relationship graph with drag-drop interface

### 5. **Analytics** (`/analytics/[type]`)
**Purpose**: Dynamic reporting and analytics with real-time dashboards

**Route Generation**:
```typescript
case 'analytics':
  targetRoute = `/${domain}/${section}/${workspace}/analytics/${card.view_slug}`
```

**Features**:
- **JSONB-Powered Queries**: Flexible analytics on dynamic data
- **Real-Time Dashboards**: Live KPI monitoring and alerts
- **Custom Report Builder**: Drag-drop report creation interface
- **Data Export**: Excel/PDF/CSV export with formatting
- **Scheduled Reports**: Automated report generation and distribution

**Technical Stack**:
- Query Engine: PostgreSQL JSONB with GIN indexes
- Visualization: Chart.js/D3.js for interactive charts
- Export: Server-side report generation with templates

## Database-Driven Configuration

### API Route Architecture
**Primary Route**: `/api/v2/[domain]/[section]/[workspace]/route.ts`

**Core Function**:
```typescript
async function getWorkspaceFromDatabase(domain: string, section: string, workspace: string) {
  // 1. Find APP_DOMAIN entity matching domain slug
  const domainEntity = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_DOMAIN')
    .eq('entity_code', domain)
    .single()

  // 2. Find APP_SECTION entity as child of domain
  const sectionEntity = await getRelatedEntity(domainEntity.id, 'APP_SECTION', section)
  
  // 3. Find APP_WORKSPACE entity as child of section  
  const workspaceEntity = await getRelatedEntity(sectionEntity.id, 'APP_WORKSPACE', workspace)
  
  // 4. Build workspace configuration from dynamic data
  const workspaceConfig = aggregateDynamicData(workspaceEntity.core_dynamic_data)
  
  // 5. Load workspace cards and navigation
  const cards = await getWorkspaceCards(workspaceEntity.id)
  const navItems = await getNavigationItems(workspaceEntity.id)
  
  return {
    workspace: workspaceConfig,
    layout_config: {
      default_nav_code: workspaceConfig.default_nav || 'overview',
      nav_items: navItems
    },
    sections: buildWorkspaceSections(cards, navItems)
  }
}
```

### Entity Type Hierarchy
```yaml
Platform Organization:
  APP_DOMAIN:           # finance, inventory, planning, etc.
    - entity_code: "finance"
    - entity_name: "Finance & Accounting" 
    - dynamic_data:
        icon: "DollarSign"
        color: "#10b981"
        description: "Financial management and accounting operations"
        
    APP_SECTION:          # Children of APP_DOMAIN
      - entity_code: "ap"
      - entity_name: "Accounts Payable"
      - parent_entity_id: finance_domain_id
      - dynamic_data:
          workspace_type: "financial_operations"
          default_persona: "accountant"
          
      APP_WORKSPACE:      # Children of APP_SECTION  
        - entity_code: "main"
        - entity_name: "AP Main Workspace"
        - parent_entity_id: ap_section_id
        - dynamic_data:
            layout: "universal_sap"
            nav_items: [...]
            workspace_cards: [...]
```

### Workspace Card Configuration
**Cards are defined as JSONB data in APP_WORKSPACE entities**:

```json
{
  "workspace_cards": [
    {
      "view_slug": "entities-vendors",
      "card_title": "Vendor Master",
      "card_description": "Manage vendor information and relationships",
      "card_type": "entities",
      "icon": "Building",
      "color": "#3b82f6", 
      "priority": 1,
      "metadata": {
        "entity_type": "VENDOR",
        "smart_code": "HERA.FINANCE.VENDOR.ENTITY.v1"
      }
    },
    {
      "view_slug": "transactions-invoices", 
      "card_title": "Invoice Processing",
      "card_description": "Process and approve vendor invoices",
      "card_type": "transactions",
      "icon": "Receipt",
      "color": "#10b981",
      "priority": 2,
      "metadata": {
        "transaction_type": "AP_INVOICE",
        "smart_code": "HERA.FINANCE.TXN.AP_INVOICE.v1"
      }
    },
    {
      "view_slug": "workflows-approval",
      "card_title": "Approval Workflow", 
      "card_description": "Manage invoice approval processes",
      "card_type": "workflows",
      "icon": "CheckCircle",
      "color": "#f59e0b",
      "priority": 3
    },
    {
      "view_slug": "analytics-aging",
      "card_title": "Aging Analysis",
      "card_description": "Vendor payment aging reports",
      "card_type": "analytics", 
      "icon": "BarChart3",
      "color": "#8b5cf6",
      "priority": 4
    }
  ]
}
```

## Universal Component System

### UniversalSAPWorkspace
**Main workspace container with SAP Fiori design patterns**

**Key Features**:
- **Responsive Layout**: 3-panel layout that collapses on mobile
- **Dynamic Navigation**: Left sidebar navigation from database configuration
- **Content Areas**: Right content area updates based on selected navigation
- **Performance Optimization**: Route prefetching and caching
- **Context Management**: Organization and user context throughout

**Technical Implementation**:
```typescript
const UniversalSAPWorkspace: React.FC<UniversalSAPWorkspaceProps> = ({
  domain, section, workspace  
}) => {
  // Load workspace configuration from API
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  
  // Dynamic navigation based on database config
  const [activeNavCode, setActiveNavCode] = useState('overview')
  
  // Load data on mount with caching
  useEffect(() => {
    loadWorkspaceData()
  }, [domain, section, workspace])
  
  // Render dynamic content based on navigation selection
  const currentSection = workspaceData?.sections.find(s => s.nav_code === activeNavCode)
  
  return (
    <div className="h-screen flex flex-col">
      {/* SAP Fiori Header */}
      <SAPWorkspaceHeader />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Dynamic Navigation Sidebar */}
        <WorkspaceNavigation 
          items={workspaceData?.layout_config.nav_items}
          activeCode={activeNavCode}
          onNavigate={setActiveNavCode}
        />
        
        {/* Dynamic Content Area */}
        <WorkspaceContent 
          section={currentSection}
          cards={workspaceData?.sections.find(s => s.nav_code === activeNavCode)?.cards}
        />
      </div>
    </div>
  )
}
```

### UniversalEntityListShell
**Reusable entity management interface with complete CRUD operations**

**Key Features**:
- **Mobile-First Design**: Responsive three-panel layout
- **Grid/List Views**: Toggle between grid cards and data table
- **Advanced Filtering**: Dynamic filters based on entity attributes
- **Search Integration**: Full-text search with highlights
- **Bulk Operations**: Select multiple entities for batch operations
- **Field Configuration**: Respects organization field preferences

**Technical Implementation**:
```typescript
export const UniversalEntityListShell: React.FC<UniversalEntityListShellProps> = ({
  title, description, breadcrumbs, module, entityType
}) => {
  // Load entities using Universal Entity API v2
  const { data: entities, loading, error } = useUniversalEntityV1({
    entity_type: entityType,
    organization_id: organization.id,
    include_dynamic_data: true
  })
  
  // Field configuration from organization preferences
  const { data: fieldConfig } = useOrganizationFieldConfig(entityType)
  
  // Dynamic filtering based on entity attributes
  const [filters, setFilters] = useState<EntityFilters>({})
  
  return (
    <div className="space-y-6">
      {/* Mobile-First Header */}
      <MobileEntityHeader title={title} description={description} />
      
      {/* Responsive Three-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Filters (Desktop) / Collapsible (Mobile) */}
        <EntityFilterPanel 
          fields={fieldConfig?.fields}
          filters={filters}
          onChange={setFilters}
        />
        
        {/* Center Panel - Entity List */}
        <div className="lg:col-span-2">
          <EntityDataView 
            entities={filteredEntities}
            viewMode={viewMode}
            fieldConfig={fieldConfig}
            onEntitySelect={handleEntitySelect}
          />
        </div>
        
        {/* Right Panel - Details/Actions */}
        <EntityDetailsPanel
          selectedEntity={selectedEntity}
          fieldConfig={fieldConfig}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
```

## Sacred Six Integration

All dynamic workspace operations maintain strict Sacred Six compliance:

### Data Model Integration
```typescript
// Entity operations always use core tables
const entityData = {
  entity_type: 'VENDOR',
  entity_name: 'ACME Corporation',
  entity_code: 'ACME001',
  smart_code: 'HERA.FINANCE.VENDOR.ENTITY.v1',
  organization_id: organization.id
}

// Business data in core_dynamic_data
const dynamicFields = [
  {
    entity_id: entityId,
    field_name: 'tax_id',
    field_type: 'text', 
    field_value_text: 'TAX123456',
    smart_code: 'HERA.FINANCE.VENDOR.FIELD.TAX_ID.v1'
  },
  {
    entity_id: entityId,
    field_name: 'credit_limit',
    field_type: 'number',
    field_value_number: 50000.00,
    smart_code: 'HERA.FINANCE.VENDOR.FIELD.CREDIT_LIMIT.v1'
  }
]
```

### RPC Function Integration
```typescript
// All CRUD operations via RPC functions with actor stamping
const result = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: user.id,
  p_organization_id: organization.id,
  p_entity: entityData,
  p_dynamic: dynamicFields,
  p_relationships: [],
  p_options: {}
})
```

### Organization Field Configuration
```typescript
// Field configurations respect 4-tier priority resolution
const fieldConfig = await organizationFieldConfigService.getFieldConfiguration(
  organization.id,
  'VENDOR'
)
// Priority: ORG_CUSTOM → INDUSTRY_TEMPLATE → BASE_TEMPLATE → HARDCODED_FALLBACK
```

## Performance Optimization

### Route Prefetching
```typescript
// Preload related workspace routes in background
const relatedRoutes = [
  `/retail/domains/${domain}`,
  `/retail/dashboard`,
  `/retail/domains/${domain}/sections/${relatedSection}`
]
preloadRoutes(relatedRoutes)
```

### Caching Strategy
```typescript
// Cache workspace configuration for 5 minutes
const cachedData = await getCachedOrFetch(apiUrl, { ttl: 300 })

// React cache for server components
export const getCachedWorkspaceData = cache(async (domain, section, workspace) => {
  return await getWorkspaceFromDatabase(domain, section, workspace)
})
```

### Mobile Performance
```typescript
// Lazy loading for heavy components
const UniversalEntityListShell = lazy(() => import('./UniversalEntityListShell'))

// Suspense boundaries with skeletons
<Suspense fallback={<EntityListSkeleton />}>
  <UniversalEntityListShell />
</Suspense>

// Touch targets >= 44px for mobile
<button className="min-h-[44px] min-w-[44px] rounded-full">
```

## Development Workflow

### Creating New Workspaces
**1. Create Database Entities**:
```sql
-- Create APP_DOMAIN entity
INSERT INTO core_entities (
  entity_type, entity_code, entity_name, smart_code, organization_id
) VALUES (
  'APP_DOMAIN', 'crm', 'Customer Relationship Management', 
  'HERA.PLATFORM.DOMAIN.CRM.v1', '00000000-0000-0000-0000-000000000000'
);

-- Add dynamic data for domain configuration  
INSERT INTO core_dynamic_data (
  entity_id, field_name, field_type, field_value_json
) VALUES (
  domain_entity_id, 'config', 'json', 
  '{"icon": "Users", "color": "#3b82f6", "description": "Customer management"}'
);
```

**2. Create APP_SECTION entities as children**
**3. Create APP_WORKSPACE entities with card configuration**
**4. No code changes required - routes automatically available**

### Adding New Card Types
**Extend the card type router in UniversalSAPWorkspace**:
```typescript
case 'my_custom_type':
  targetRoute = `/${domain}/${section}/${workspace}/custom/${card.view_slug}`
  break
```

**Create corresponding route handler and component**

## Future Enhancements

1. **Visual Workspace Designer**: Drag-drop interface for workspace configuration
2. **AI-Powered Suggestions**: Smart recommendations for workspace layouts
3. **Advanced Analytics**: Machine learning insights on workspace usage
4. **Custom Component Library**: Organization-specific component extensions
5. **Real-Time Collaboration**: Multi-user workspace editing with conflict resolution

## Conclusion

HERA's Dynamic Universal Workspace Architecture represents a fundamental shift from traditional hardcoded enterprise applications to truly dynamic, database-driven interfaces. This system enables:

- **Zero-deployment workspace creation**: New business areas without code changes
- **Universal scalability**: Same architecture works for any industry or business model
- **Organization customization**: Every aspect configurable per organization needs
- **Sacred Six compliance**: All operations maintain data integrity and audit trails
- **SAP Fiori UX standards**: Enterprise-grade user experience throughout

This architecture positions HERA as a true no-code enterprise platform while maintaining the flexibility and power that enterprise customers demand.