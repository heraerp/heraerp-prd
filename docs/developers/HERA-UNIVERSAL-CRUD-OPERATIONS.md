# HERA Universal CRUD Operations Reference

**Smart Code**: `HERA.PLATFORM.DOCS.UNIVERSAL_CRUD.REFERENCE.v1`

## Overview

HERA's Dynamic Workspace Architecture provides 5 universal CRUD operation types that can be applied to any business domain. These operations are automatically generated from database configuration and provide complete enterprise functionality without any hardcoding.

The 5 Universal Operation Types:
1. **Entities** - Master data management
2. **Transactions** - Business process transactions
3. **Workflows** - Process automation and state management
4. **Relationships** - Entity relationship management
5. **Analytics** - Business intelligence and reporting

## 1. Entities CRUD Operations

### Purpose
Master data management with complete CRUD operations, field configuration, and organization customization.

### Route Pattern
```
/{domain}/{section}/{workspace}/entities/{entity_type}
```

### Technical Implementation

#### Component Stack
```typescript
// Main component for entity management
<UniversalEntityListShell 
  title="Lead Management"
  module="CRM"
  entityType="LEAD"
  breadcrumbs={[
    { label: "CRM", href: "/retail/domains/crm" },
    { label: "Leads", href: "/retail/domains/crm/sections/leads" },
    { label: "Lead Database" }
  ]}
/>
```

#### API Integration
```typescript
// Universal Entity API v2 with organization filtering
const { data: entities, loading, error } = useUniversalEntityV1({
  entity_type: 'LEAD',
  organization_id: organization.id,
  include_dynamic_data: true,
  include_relationships: false
})

// Field configuration from organization preferences  
const { data: fieldConfig } = useOrganizationFieldConfig('LEAD')
```

#### Data Flow
```typescript
// 1. Load entity type definition
const entityDef = await apiV2.get('entities', {
  entity_type: 'ENTITY_TYPE_DEF',
  entity_code: 'LEAD',
  organization_id: PLATFORM_ORG_ID
})

// 2. Load field configuration (4-tier priority)
const fieldConfig = await organizationFieldConfigService.getFieldConfiguration(
  organization.id, 
  'LEAD'
)

// 3. Load actual entity data
const entities = await apiV2.get('entities', {
  entity_type: 'LEAD',
  organization_id: organization.id
})

// 4. Aggregate dynamic data for each entity
const entitiesWithDynamicData = entities.map(entity => ({
  ...entity,
  dynamic_data: aggregateDynamicFields(entity.core_dynamic_data)
}))
```

### Features

#### Responsive Interface
- **Mobile-First Design**: Three-panel layout that collapses on mobile
- **Grid/List Toggle**: Switch between card grid and data table views
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Progressive Enhancement**: Additional features unlock on larger screens

#### Advanced Filtering
```typescript
// Dynamic filters based on entity attributes
const entityFilters = {
  // Text search across all searchable fields
  search: "ACME Corporation",
  
  // Field-specific filters from field configuration
  lead_source: ["website", "referral"],
  lead_score: { min: 70, max: 100 },
  status: ["new", "qualified"],
  
  // Date range filters
  created_date: { 
    from: "2024-01-01", 
    to: "2024-01-31" 
  }
}
```

#### Bulk Operations
```typescript
// Select multiple entities for batch operations
const selectedEntities = ["uuid1", "uuid2", "uuid3"]

// Bulk update operations
await apiV2.post('entities/bulk', {
  action: 'UPDATE',
  entity_ids: selectedEntities,
  updates: {
    dynamic_data: {
      status: { field_value_text: "qualified" }
    }
  },
  organization_id: organization.id
})

// Bulk export
await apiV2.post('entities/export', {
  entity_type: 'LEAD',
  entity_ids: selectedEntities,
  format: 'excel',
  include_fields: ['lead_name', 'company', 'email', 'lead_score']
})
```

### Configuration Example

#### Entity Type Definition
```sql
-- Create entity type in platform organization
INSERT INTO core_entities (
  entity_type, entity_code, entity_name, smart_code, organization_id
) VALUES (
  'ENTITY_TYPE_DEF', 'LEAD', 'Sales Lead', 'HERA.CRM.ENTITY_TYPE.LEAD.v1',
  '00000000-0000-0000-0000-000000000000'
);

-- Define field schema
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(entity_type_id, 'field_schema', 'json', '{
  "fields": [
    {
      "id": "lead_name",
      "label": "Lead Name", 
      "type": "text",
      "required": true,
      "searchable": true,
      "smart_code": "HERA.CRM.LEAD.FIELD.NAME.v1"
    },
    {
      "id": "company",
      "label": "Company",
      "type": "text",
      "required": true,
      "searchable": true,
      "smart_code": "HERA.CRM.LEAD.FIELD.COMPANY.v1"
    },
    {
      "id": "lead_score",
      "label": "Lead Score",
      "type": "number",
      "min": 0,
      "max": 100,
      "filterable": true,
      "smart_code": "HERA.CRM.LEAD.FIELD.SCORE.v1"
    }
  ]
}');
```

#### Workspace Card Configuration
```json
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
    "smart_code": "HERA.CRM.LEAD.ENTITY.v1",
    "default_view": "grid",
    "page_size": 25
  }
}
```

## 2. Transactions CRUD Operations

### Purpose
Business process transactions with workflow integration, audit trails, and automatic GL posting.

### Route Pattern
```
/{domain}/{section}/{workspace}/transactions/{transaction_type}
```

### Technical Implementation

#### RPC Integration
```typescript
// Universal transaction processing
const result = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: user.id,
  p_organization_id: organization.id,
  p_transaction: {
    transaction_type: 'CRM_ACTIVITY',
    smart_code: 'HERA.CRM.TXN.ACTIVITY.v1',
    source_entity_id: leadId, // Lead entity
    target_entity_id: userId,  // Assigned user
    transaction_status: 'SCHEDULED'
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'ACTIVITY_DETAIL',
      description: 'Follow-up call with ACME Corp',
      entity_id: leadId,
      smart_code: 'HERA.CRM.ACTIVITY.LINE.DETAIL.v1'
    }
  ],
  p_options: {
    auto_notify: true,
    validate_workflow: true
  }
})
```

#### Transaction Types
```typescript
// Different transaction types for various business processes
const transactionTypes = {
  // CRM transactions  
  CRM_ACTIVITY: 'Customer activities and interactions',
  CRM_OPPORTUNITY: 'Sales opportunity progression',
  CRM_CAMPAIGN: 'Marketing campaign execution',
  
  // Financial transactions
  AP_INVOICE: 'Accounts payable invoice processing', 
  AR_INVOICE: 'Accounts receivable billing',
  PAYMENT: 'Payment processing and allocation',
  
  // Inventory transactions
  STOCK_RECEIPT: 'Inventory receipt from vendors',
  STOCK_ISSUE: 'Inventory issue to production',
  STOCK_TRANSFER: 'Inter-location stock transfer',
  
  // HR transactions
  PAYROLL: 'Payroll processing and payments',
  EXPENSE_CLAIM: 'Employee expense reimbursement',
  LEAVE_REQUEST: 'Time-off request processing'
}
```

### Features

#### Workflow Integration
```typescript
// Automatic workflow progression based on transaction state
const workflowConfig = {
  states: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PROCESSED'],
  transitions: [
    { from: 'DRAFT', to: 'SUBMITTED', trigger: 'submit' },
    { from: 'SUBMITTED', to: 'APPROVED', trigger: 'approve', role: 'manager' },
    { from: 'APPROVED', to: 'PROCESSED', trigger: 'process', auto: true }
  ],
  notifications: {
    'SUBMITTED': ['assigned_manager'],
    'APPROVED': ['requestor', 'finance_team']
  }
}
```

#### Audit Trails
```typescript
// Complete audit history automatically maintained
const auditTrail = {
  transaction_id: 'txn_uuid',
  changes: [
    {
      timestamp: '2024-01-25T10:30:00Z',
      actor_user_id: 'user_uuid',
      field_changed: 'transaction_status', 
      old_value: 'SUBMITTED',
      new_value: 'APPROVED',
      reason: 'Manager approval completed'
    }
  ],
  related_entities: [
    { entity_type: 'LEAD', entity_id: 'lead_uuid' },
    { entity_type: 'USER', entity_id: 'manager_uuid' }
  ]
}
```

### Configuration Example

#### Transaction Type Definition
```sql
-- Create transaction type
INSERT INTO core_entities (
  entity_type, entity_code, entity_name, smart_code, organization_id
) VALUES (
  'TRANSACTION_TYPE_DEF', 'CRM_ACTIVITY', 'CRM Activity', 
  'HERA.CRM.TRANSACTION_TYPE.ACTIVITY.v1', 
  '00000000-0000-0000-0000-000000000000'
);

-- Configure workflow and validation rules
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(txn_type_id, 'workflow_config', 'json', '{
  "states": ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  "default_state": "SCHEDULED",
  "auto_transitions": {
    "SCHEDULED": {
      "trigger_date": "activity_date",
      "next_state": "IN_PROGRESS"
    }
  }
}');
```

#### Workspace Card Configuration
```json
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
    "smart_code": "HERA.CRM.TXN.ACTIVITY.v1",
    "default_filter": "status:SCHEDULED,IN_PROGRESS"
  }
}
```

## 3. Workflows CRUD Operations

### Purpose
Process automation and state management with business rule enforcement and approval hierarchies.

### Route Pattern
```
/{domain}/{section}/{workspace}/workflows/{workflow_type}
```

### Technical Implementation

#### State Machine Management
```typescript
// Workflow state management through relationships
const workflowState = {
  entity_id: 'lead_uuid',
  current_state: 'QUALIFIED',
  state_history: [
    { state: 'NEW', entered: '2024-01-20T10:00:00Z', actor: 'system' },
    { state: 'CONTACTED', entered: '2024-01-21T14:30:00Z', actor: 'sales_rep' },
    { state: 'QUALIFIED', entered: '2024-01-22T09:15:00Z', actor: 'sales_manager' }
  ],
  next_actions: ['convert_to_opportunity', 'mark_unqualified', 'schedule_demo']
}

// State transitions via relationships
await createRelationship({
  source_entity_id: leadId,
  target_entity_id: qualifiedStateId,
  relationship_type: 'HAS_STATE', 
  metadata: {
    state_name: 'QUALIFIED',
    entered_by: userId,
    entered_at: new Date().toISOString(),
    reason: 'Passed qualification criteria'
  }
})
```

#### Business Rule Enforcement
```typescript
// FICO policy integration for workflow rules
const workflowRules = {
  'lead_qualification': [
    {
      rule: 'minimum_score_required',
      condition: 'lead_score >= 70',
      action: 'auto_qualify',
      message: 'Lead automatically qualified based on score'
    },
    {
      rule: 'manager_approval_required', 
      condition: 'deal_value > 50000',
      action: 'require_approval',
      approver_role: 'sales_manager'
    }
  ]
}
```

### Features

#### Visual Workflow Designer
```typescript
// Workflow configuration interface
const workflowDesigner = {
  nodes: [
    { id: 'start', type: 'start', label: 'New Lead' },
    { id: 'contact', type: 'task', label: 'Initial Contact' },
    { id: 'qualify', type: 'decision', label: 'Qualification Check' },
    { id: 'demo', type: 'task', label: 'Product Demo' },
    { id: 'proposal', type: 'task', label: 'Send Proposal' },
    { id: 'close', type: 'end', label: 'Deal Closed' }
  ],
  edges: [
    { from: 'start', to: 'contact', condition: 'always' },
    { from: 'contact', to: 'qualify', condition: 'always' },
    { from: 'qualify', to: 'demo', condition: 'qualified' },
    { from: 'qualify', to: 'close', condition: 'unqualified' },
    { from: 'demo', to: 'proposal', condition: 'interested' },
    { from: 'proposal', to: 'close', condition: 'always' }
  ]
}
```

#### SLA Tracking
```typescript
// Performance monitoring and escalation
const slaConfig = {
  'initial_contact': {
    target: '4 hours',
    escalation_after: '8 hours',
    escalation_to: 'sales_manager'
  },
  'proposal_response': {
    target: '2 business_days', 
    escalation_after: '3 business_days',
    escalation_to: 'sales_director'
  }
}
```

### Configuration Example

#### Workflow Definition
```sql
-- Create workflow type
INSERT INTO core_entities (
  entity_type, entity_code, entity_name, smart_code, organization_id
) VALUES (
  'WORKFLOW_DEF', 'LEAD_QUALIFICATION', 'Lead Qualification Process',
  'HERA.CRM.WORKFLOW.LEAD_QUALIFICATION.v1',
  '00000000-0000-0000-0000-000000000000'  
);

-- Configure states and transitions
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
(workflow_id, 'state_config', 'json', '{
  "states": [
    {"id": "NEW", "label": "New Lead", "color": "#6b7280"},
    {"id": "CONTACTED", "label": "Initial Contact", "color": "#3b82f6"},
    {"id": "QUALIFIED", "label": "Qualified", "color": "#10b981"},
    {"id": "UNQUALIFIED", "label": "Unqualified", "color": "#dc2626"}
  ],
  "transitions": [
    {
      "from": "NEW", 
      "to": "CONTACTED",
      "trigger": "contact_made",
      "required_fields": ["contact_method", "contact_notes"]
    },
    {
      "from": "CONTACTED",
      "to": "QUALIFIED", 
      "trigger": "qualify",
      "conditions": ["lead_score >= 70", "budget_confirmed"],
      "required_role": "sales_rep"
    }
  ]
}');
```

## 4. Relationships CRUD Operations

### Purpose
Entity relationship management with hierarchical structures, temporal tracking, and visual relationship mapping.

### Route Pattern
```
/{domain}/{section}/{workspace}/relationships/{relationship_type}
```

### Technical Implementation

#### Hierarchical Management
```typescript
// Parent-child entity relationships
const hierarchyData = {
  entity_type: 'ACCOUNT',
  entity_id: 'parent_account_id',
  children: [
    {
      entity_id: 'subsidiary_1_id',
      relationship_type: 'SUBSIDIARY',
      effective_date: '2024-01-01',
      metadata: { ownership_percentage: 75 }
    },
    {
      entity_id: 'subsidiary_2_id', 
      relationship_type: 'SUBSIDIARY',
      effective_date: '2024-01-15',
      metadata: { ownership_percentage: 100 }
    }
  ]
}

// Create hierarchical relationships
for (const child of hierarchyData.children) {
  await createRelationship({
    source_entity_id: hierarchyData.entity_id,
    target_entity_id: child.entity_id,
    relationship_type: child.relationship_type,
    effective_date: child.effective_date,
    metadata: child.metadata
  })
}
```

#### Cross-Domain Mapping
```typescript
// Map entities across different domains
const crossDomainMapping = {
  // Map CRM leads to finance customers
  lead_to_customer: {
    source_entity_type: 'LEAD',
    target_entity_type: 'CUSTOMER', 
    relationship_type: 'CONVERTS_TO',
    auto_create: true,
    field_mappings: {
      'lead_name': 'customer_name',
      'company': 'customer_company',
      'contact_email': 'billing_email'
    }
  },
  
  // Map inventory items to GL accounts  
  item_to_account: {
    source_entity_type: 'INVENTORY_ITEM',
    target_entity_type: 'GL_ACCOUNT',
    relationship_type: 'POSTS_TO',
    field_mappings: {
      'item_category': 'account_category'
    }
  }
}
```

#### Temporal Relationships
```typescript
// Time-based relationship management
const temporalRelationship = {
  source_entity_id: 'employee_id',
  target_entity_id: 'department_id', 
  relationship_type: 'WORKS_IN',
  effective_date: '2024-01-01',
  expiry_date: '2024-12-31',
  metadata: {
    role: 'Software Engineer',
    employment_type: 'Full Time',
    reporting_manager: 'manager_id'
  }
}
```

### Features

#### Visual Relationship Maps
```typescript
// Interactive relationship visualization
const relationshipMap = {
  center_entity: 'customer_uuid',
  relationships: [
    {
      type: 'HAS_CONTACT',
      entities: ['contact_1_uuid', 'contact_2_uuid'],
      color: '#3b82f6',
      label: 'Contacts'
    },
    {
      type: 'HAS_OPPORTUNITY', 
      entities: ['opp_1_uuid', 'opp_2_uuid'],
      color: '#10b981',
      label: 'Opportunities'
    },
    {
      type: 'PART_OF',
      entities: ['parent_account_uuid'],
      color: '#8b5cf6',
      label: 'Parent Account'
    }
  ]
}
```

#### Bulk Relationship Operations
```typescript
// Mass relationship updates
const bulkRelationshipUpdate = {
  action: 'UPDATE_RELATIONSHIPS',
  relationship_type: 'ASSIGNED_TO',
  source_entities: ['lead_1', 'lead_2', 'lead_3'],
  target_entity: 'sales_rep_uuid',
  effective_date: '2024-01-25',
  replace_existing: true
}
```

### Configuration Example
```json
{
  "view_slug": "relationships-accounts",
  "card_title": "Lead-Account Mapping", 
  "card_description": "Map leads to accounts and opportunities",
  "card_type": "relationships",
  "icon": "Link",
  "color": "#7c2d12",
  "priority": 4,
  "metadata": {
    "relationship_types": ["BELONGS_TO", "CONVERTS_TO", "RELATED_TO"],
    "source_entity_type": "LEAD",
    "target_entity_types": ["ACCOUNT", "OPPORTUNITY"]
  }
}
```

## 5. Analytics CRUD Operations

### Purpose  
Business intelligence and reporting with dynamic dashboards, custom report builder, and real-time data visualization.

### Route Pattern
```
/{domain}/{section}/{workspace}/analytics/{analytics_type}
```

### Technical Implementation

#### JSONB-Powered Queries
```typescript
// Flexible analytics using PostgreSQL JSONB
const analyticsQuery = {
  entity_type: 'LEAD',
  filters: {
    // JSONB path queries on dynamic data
    lead_score: { $gte: 70 },
    industry: { $in: ['technology', 'healthcare'] },
    created_date: { 
      $gte: '2024-01-01',
      $lt: '2024-02-01' 
    }
  },
  aggregations: [
    {
      field: 'lead_score',
      type: 'avg',
      alias: 'average_score'
    },
    {
      field: 'status', 
      type: 'count',
      group_by: true
    },
    {
      field: 'deal_value',
      type: 'sum',
      alias: 'total_pipeline'
    }
  ]
}

// Execute using GIN indexed JSONB queries
const results = await supabase.rpc('hera_analytics_query_v1', {
  p_query_config: analyticsQuery,
  p_organization_id: organization.id
})
```

#### Real-Time Dashboards
```typescript
// Live KPI monitoring with WebSocket updates
const realtimeDashboard = {
  widgets: [
    {
      id: 'lead_conversion_rate',
      type: 'kpi',
      title: 'Conversion Rate',
      query: 'SELECT COUNT(*) FILTER (WHERE status = \'qualified\') * 100.0 / COUNT(*) FROM leads',
      format: 'percentage',
      target: 25,
      update_interval: 300 // 5 minutes
    },
    {
      id: 'pipeline_by_source',
      type: 'pie_chart',
      title: 'Pipeline by Source',
      query: 'SELECT lead_source, SUM(deal_value) FROM leads GROUP BY lead_source',
      update_interval: 900 // 15 minutes
    }
  ]
}
```

#### Custom Report Builder
```typescript
// Drag-drop report creation interface
const reportBuilder = {
  data_sources: ['LEAD', 'OPPORTUNITY', 'CONTACT', 'ACCOUNT'],
  available_fields: [
    { field: 'lead_name', type: 'text', source: 'LEAD' },
    { field: 'lead_score', type: 'number', source: 'LEAD' },
    { field: 'deal_value', type: 'currency', source: 'OPPORTUNITY' },
    { field: 'close_probability', type: 'percentage', source: 'OPPORTUNITY' }
  ],
  filters: [
    { field: 'lead_score', operator: '>=', value: 70 },
    { field: 'status', operator: 'in', value: ['qualified', 'demo'] }
  ],
  grouping: ['lead_source', 'assigned_to'],
  sorting: [{ field: 'deal_value', direction: 'desc' }],
  chart_type: 'bar'
}
```

### Features

#### Performance Optimization
```typescript
// Materialized views for complex analytics
const materializedView = {
  name: 'lead_pipeline_summary',
  refresh_schedule: 'hourly',
  query: `
    SELECT 
      DATE_TRUNC('week', created_date) as week,
      lead_source,
      COUNT(*) as lead_count,
      AVG(lead_score) as avg_score,
      SUM(deal_value) as total_pipeline
    FROM leads 
    WHERE status IN ('qualified', 'demo', 'proposal')
    GROUP BY week, lead_source
  `
}
```

#### Data Export and Scheduling
```typescript
// Automated report generation and distribution  
const scheduledReport = {
  report_id: 'weekly_pipeline_report',
  schedule: 'cron:0 9 * * MON', // Every Monday at 9 AM
  recipients: ['sales_manager@company.com', 'ceo@company.com'],
  format: 'pdf',
  template: 'executive_summary',
  filters: {
    date_range: 'last_7_days',
    include_forecast: true
  }
}
```

### Configuration Example
```json
{
  "view_slug": "analytics-conversion", 
  "card_title": "Conversion Funnel",
  "card_description": "Lead-to-customer conversion analytics",
  "card_type": "analytics",
  "icon": "TrendingUp",
  "color": "#7c3aed",
  "priority": 1,
  "metadata": {
    "dashboard_config": {
      "default_time_range": "30_days",
      "auto_refresh": 300,
      "widgets": ["conversion_rate", "pipeline_trend", "source_analysis"]
    }
  }
}
```

## Universal Component Integration

All 5 CRUD operation types integrate seamlessly with HERA's universal component architecture:

### Shared Features Across All Types

#### Organization Field Configuration
```typescript
// All operations respect organization field preferences
const fieldConfig = await organizationFieldConfigService.getFieldConfiguration(
  organization.id,
  entityType || transactionType || workflowType
)

// 4-tier priority resolution automatically applied
// ORG_CUSTOM → INDUSTRY_TEMPLATE → BASE_TEMPLATE → HARDCODED_FALLBACK
```

#### Mobile-First Responsive Design
```typescript
// All interfaces follow HERA mobile standards
const responsiveDesign = {
  touch_targets: '44px minimum',
  grid_breakpoints: {
    mobile: '1 column',
    tablet: '2 columns', 
    desktop: '3-4 columns'
  },
  navigation: {
    mobile: 'bottom_tabs',
    desktop: 'sidebar'
  }
}
```

#### Performance Optimization
```typescript
// Shared performance patterns
const performanceFeatures = {
  lazy_loading: true,
  route_prefetching: true,
  component_caching: '5 minutes',
  data_pagination: 50,
  virtual_scrolling: true // For large datasets
}
```

#### Security and Audit
```typescript
// All operations include automatic security
const securityFeatures = {
  organization_isolation: true,
  actor_stamping: true,
  audit_trails: true,
  role_based_access: true,
  field_level_security: true
}
```

## Development Best Practices

### 1. Smart Code Consistency
```typescript
// Follow HERA DNA patterns for all operation types
const smartCodePatterns = {
  entity: 'HERA.{DOMAIN}.{ENTITY}.ENTITY.v1',
  transaction: 'HERA.{DOMAIN}.TXN.{TYPE}.v1', 
  workflow: 'HERA.{DOMAIN}.WORKFLOW.{TYPE}.v1',
  relationship: 'HERA.{DOMAIN}.REL.{TYPE}.v1',
  analytics: 'HERA.{DOMAIN}.ANALYTICS.{TYPE}.v1'
}
```

### 2. Configuration Validation
```typescript
// Validate workspace card configurations
const validateCardConfig = (cardConfig) => {
  const requiredFields = ['view_slug', 'card_title', 'card_type', 'icon', 'priority']
  const typeSpecificFields = {
    entities: ['metadata.entity_type'],
    transactions: ['metadata.transaction_type'],
    workflows: ['metadata.workflow_type'],
    relationships: ['metadata.relationship_types'],
    analytics: ['metadata.dashboard_config']
  }
  
  // Validate required fields present
  // Validate type-specific metadata
  // Validate Smart Code patterns
  // Validate icon exists in Lucide React
}
```

### 3. Error Handling
```typescript
// Consistent error handling across all operation types
const errorHandling = {
  // User-friendly error messages
  validation_errors: 'Show field-level validation with suggestions',
  permission_errors: 'Explain required roles/permissions clearly',
  data_errors: 'Provide context and suggested actions',
  
  // Graceful degradation
  offline_mode: 'Cache critical operations for offline use',
  partial_failures: 'Show what succeeded and what failed',
  retry_logic: 'Automatic retry with exponential backoff'
}
```

### 4. Testing Strategy
```typescript
// Comprehensive testing for all operation types
const testingApproach = {
  unit_tests: 'Test individual operation functions',
  integration_tests: 'Test complete workflows end-to-end',
  ui_tests: 'Test responsive design on all devices',
  performance_tests: 'Test with realistic data volumes',
  security_tests: 'Test authorization and data isolation'
}
```

## Conclusion

HERA's 5 Universal CRUD Operation Types provide a complete enterprise application framework that can be configured entirely through database entities. This approach enables:

- **Zero-code workspace creation**: Add new business operations without any programming
- **Consistent user experience**: Same interface patterns across all business domains  
- **Organization customization**: Field configurations and preferences respected throughout
- **Enterprise scalability**: Performance optimization and security built-in
- **Mobile-first design**: Responsive interfaces that work on any device

By understanding these 5 operation types and their configuration patterns, developers can create sophisticated business applications entirely through database configuration while maintaining enterprise-grade functionality and user experience.