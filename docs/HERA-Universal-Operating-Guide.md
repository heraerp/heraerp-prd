# 🏛 HERA v2.4 Universal Operating Guide
**Purpose:**  
This document defines the universal operational behavior that every AI assistant (e.g., Claude, GPT, or HERA Copilot) must follow when interacting with the HERA ERP system.

---

## 0. Guiding Principle
> "Customization lives in data.  
> Standards live in the platform.  
> AI operates inside the contracts.  
> **Every app starts with YAML.**"

---

## 1. Immutable Platform Invariants (Never Override)

### 1.1 Sacred Six Schema Only
- `core_entities`, `core_dynamic_data`, `core_relationships`
- `universal_transactions`, `universal_transaction_lines`, `core_organizations`
- **No custom tables** - all business data goes in dynamic fields

### 1.2 API Standards
- **Primary Pattern**: v1 Orchestrator RPCs (`hera_entities_crud_v1`, `hera_txn_crud_v1`)
- **Hook Standard**: `useUniversalEntityV1`, `useUniversalTransactionV1` (tested, production-ready)
- **v2 APIs**: Available but v1 patterns are **recommended and proven**
- **Endpoint**: `/api/v2/command` for all operations

### 1.3 Guardrails v2.0 (Always Active)
- **Smart Code Pattern**: `^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$`
- **ORG-FILTER-REQUIRED**: Every query must filter by organization
- **GL-BALANCED-PER-CURRENCY**: DR = CR for all financial transactions
- **NO-BUSINESS-COLUMNS**: No custom columns on Sacred Six tables
- **ACTOR-STAMPING**: All operations require authenticated user context

### 1.4 Security Architecture (7-Layer)
1. **JWT Authentication** → Identity verification
2. **Identity Resolution** → User lookup and validation  
3. **Organization Context** → Org membership validation
4. **Membership Verification** → Role and permission checks
5. **Guardrails Enforcement** → Business rule validation
6. **Row Level Security (RLS)** → Database-level filtering
7. **Audit Triggers** → Actor stamping and change tracking

---

## 2. YAML-First App Development

### 2.1 Platform Organization Architecture
**All platform configurations** are stored in the dedicated Platform Organization:
- **Organization ID**: `org_hera_platform_00000000`
- **Purpose**: Centralized storage for templates, components, and configurations
- **Access Control**: Role-based permissions with tenant isolation
- **Data Types**: App templates, Universal components, Smart code patterns, Validation rules, AI models

### 2.2 App Configuration System
**Every HERA application** starts with a YAML configuration file defining:
- **Entities** with dynamic fields and relationships
- **Transactions** with line types and validation rules  
- **Workflows** with AI assistance and automation
- **UI Components** including dashboards and navigation
- **Permissions** and role-based access control
- **Integrations** with external systems and AI features

**Templates are stored** as entities in the Platform Organization for reuse and sharing.

### 2.3 YAML App Schema Structure
```yaml
app:
  name: "Application Name"
  code: "APP"  # 3-15 chars, uppercase
  smart_code: "HERA.APP.SYSTEM.v1"
  organization:
    id: "org_12345"

entities:
  - entity_type: "CUSTOMER"
    smart_code: "HERA.APP.CUSTOMER.ENTITY.v1"
    dynamic_fields:
      - name: "customer_type"
        type: "text"
        smart_code: "HERA.APP.CUSTOMER.FIELD.TYPE.v1"
        
transactions:
  - transaction_type: "SALE"
    smart_code: "HERA.APP.TXN.SALE.v1"
    
workflows:
  - workflow_name: "Customer Onboarding"
    smart_code: "HERA.APP.WORKFLOW.ONBOARDING.v1"
    
ui:
  dashboard:
    widgets: [...]
  navigation: [...]
```

### 2.4 Reference Examples
- **CRM System**: `/src/templates/app-config/hera-app-schema.yaml`
- **Salon Management**: `/src/templates/app-config/examples/salon-app.yaml`  
- **Inventory Management**: `/src/templates/app-config/examples/inventory-app.yaml`

---

## 3. App Lifecycle & Generation

### 3.1 Platform Template Management
```typescript
// Save template to Platform Organization
const templateManager = new PlatformTemplateManager();
await templateManager.saveTemplate('MyApp', yamlConfig, {
  category: 'business',
  complexity_level: 'intermediate'
});

// List available templates
const templates = await templateManager.listTemplates({
  category: 'business'
});

// Generate app from template
const result = await templateManager.generateFromTemplate(templateId, {
  targetOrganizationId: 'org_customer_12345'
});
```

### 3.2 Development Workflow
```bash
# 1. Create YAML configuration
vim apps/my-app.yaml

# 2. Generate application using Platform Templates
npm run hera:app:generate apps/my-app.yaml

# 3. Deploy to target organization
npm run hera:app:deploy my-app --org org_customer_12345
```

### 3.3 Generated Components
From YAML configuration, the system automatically generates:
- ✅ **Entity CRUD Components** using `UniversalMasterDataWizard`
- ✅ **Transaction Forms** using `UniversalTransactionWizard`
- ✅ **Workflow Engines** with step-by-step processing
- ✅ **Dashboard Widgets** with real-time metrics
- ✅ **Navigation Menus** with role-based access
- ✅ **API Endpoints** following HERA patterns
- ✅ **Database Relationships** in Sacred Six tables

### 3.4 Universal Templates
**Location**: `/src/components/universal/`
- **Master Data**: 4-step wizard (Basics → Relationships → Attributes → Review)
- **Transactions**: S/4HANA-style wizard (Header → Lines → Validate → Post)
- **Workflows**: State management with AI assistance
- **Relationships**: Visual graph editor for entity connections

---

## 4. Standard UX Patterns

### 4.1 Master Data Wizard (4 Steps)
1. **Basics** - Core entity information and smart code generation
2. **Relationships** - Entity connections and hierarchies  
3. **Attributes** - Dynamic fields with AI recommendations
4. **Review & Activate** - Final validation and creation

**Implementation**: `UniversalMasterDataWizard` with `useUniversalEntityV1`

### 4.2 Transaction Wizard (S/4HANA Style)
1. **Type Selection** - Choose transaction type and smart code
2. **Header Details** - Date, currency, fiscal period, context
3. **Transaction Lines** - DR/CR entries with AI assistance  
4. **Validate & Post** - Guardrails validation and posting

**Implementation**: `UniversalTransactionWizard` with `useUniversalTransactionV1`

### 4.3 Workflow Engine
- **Step-by-step processing** with actor assignments
- **AI assistance integration** for recommendations
- **Auto-execution** for system tasks
- **Conditional branching** based on business rules

---

## 5. Hook Standards & API Patterns

### 5.1 Recommended Patterns (v1 - Production Ready)
```typescript
// Entity Management
const customerHook = useUniversalEntityV1({
  entity_type: 'CUSTOMER',
  dynamicFields: [...],
  relationships: [...]
});

// Transaction Management  
const transactionHook = useUniversalTransactionV1({
  filters: { transaction_type: 'SALE', include_lines: true }
});
```

### 5.2 Transaction Rules (Always Enforced)
- All `.GL.` lines **must have** `side = DR|CR` and **positive** `line_amount`
- **Guardrails enforce** per-currency DR = CR balance
- **Outbox + audit record** created on every RPC call
- **Rule Engine trace** stored in `ai_insights` field

### 5.3 Smart Code Generation
```typescript
// Auto-generated following HERA pattern
const smartCode = `HERA.${moduleCode}.${entityType}.${fieldType}.${fieldName}.v1`;

// Validation enforced at API level
const isValid = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/.test(smartCode);
```

---

## 6. Operational Policies

### 6.1 Cache Strategy
- **Redis/Upstash TTL**: 300 seconds (5 minutes)
- **Invalidation triggers**: User role or org membership changes
- **Expected hit rate**: ≥ 80%
- **Performance target**: < 200ms cache resolution

### 6.2 Idempotency
- **Key format**: `idem:{org_id}:{smart_code}:{sha256(payload)}`
- **TTL**: 24 hours
- **Duplicate handling**: Return 409 with original result

### 6.3 Rate Limits
| Tier | Reads/min | Writes/min | GL Transactions/min |
|------|-----------|------------|-------------------|
| Default | 1000 | 100 | 50 |
| Premium | 5000 | 500 | 100 |
| Enterprise | 10000 | 1000 | 200 |

### 6.4 Retry Policy
| HTTP Status | Action |
|-------------|---------|
| 409 (Duplicate) | Return original result |
| 429 (Rate limit) | Exponential backoff ×3 |
| 5xx (Server error) | Retry ×3 with backoff |

---

## 7. Monitoring & Observability

### 7.1 Critical Metrics
| Metric | Threshold | Alert Channel |
|---------|-----------|---------------|
| `actor_coverage_pct` | ≥ 95% | Slack #ops |
| `gl_balance_violations` | 0 | PagerDuty Finance |
| `identity_resolution_p99` | ≤ 200ms | Slack #perf |
| `cache_hit_rate` | ≥ 80% | Slack #infra |
| `yaml_generation_success_rate` | ≥ 95% | Slack #dev |

### 7.2 Dashboards
- **Actor Audit Coverage** - Track user stamping compliance
- **GL Transaction Health** - Monitor financial data integrity  
- **Organization Membership** - User access and permissions
- **App Generation Metrics** - YAML→App success rates

---

## 8. YAML App Configuration Guide

### 8.1 Entity Definition Best Practices
```yaml
entities:
  - entity_type: "CUSTOMER"  # Always UPPERCASE
    entity_name: "Customer"  # Human readable
    smart_code: "HERA.CRM.CUSTOMER.ENTITY.v1"  # Follow pattern
    
    dynamic_fields:
      - name: "customer_type"  # snake_case
        type: "text"  # text|number|boolean|date|json
        required: true
        smart_code: "HERA.CRM.CUSTOMER.FIELD.TYPE.v1"
        options: ["individual", "corporate"]  # For select fields
        
    relationships:
      - type: "HAS_SALES_REP"  # Clear relationship type
        target_entity: "EMPLOYEE"
        cardinality: "one"  # one|many
        smart_code: "HERA.CRM.CUSTOMER.REL.SALES_REP.v1"
```

### 8.2 Transaction Definition Best Practices
```yaml
transactions:
  - transaction_type: "SALE"  # Always UPPERCASE
    smart_code: "HERA.CRM.TXN.SALE.v1"
    
    line_types:
      - name: "receivable"
        description: "Accounts receivable booking"
        side: "DR"  # Debit/Credit for GL transactions
        account_type: "asset"
        smart_code: "HERA.CRM.TXN.LINE.AR.v1"
        
    validation_rules:
      - rule: "payment_required"
        condition: "total_amount > 0"
        
    balancing_rules:
      - rule: "dr_cr_balance"
        condition: "sum(DR) == sum(CR)"
```

### 8.3 UI Configuration Best Practices
```yaml
ui:
  dashboard:
    widgets:
      - type: "metric"
        title: "Total Customers"
        entity: "CUSTOMER"
        calculation: "count"
        color: "blue"
        
  navigation:
    - section: "Customers"
      items:
        - label: "Customer List"
          entity: "CUSTOMER"
          view: "list"
          icon: "users"
```

---

## 9. Security & Compliance

### 9.1 Authentication Flow
1. **JWT Token** validation and extraction
2. **User Identity** resolution from token claims
3. **Organization Context** validation and membership check
4. **Role Assignment** and permission verification
5. **Guardrails Application** based on user and org context

### 9.2 Data Isolation
- **Organization-level RLS** on all Sacred Six tables
- **User membership verification** for every operation
- **Actor stamping** on all create/update operations
- **Audit trail** preservation for compliance

### 9.3 Permission Model
```yaml
deployment:
  permissions:
    roles:
      - role: "admin"
        permissions: ["create", "read", "update", "delete"]
        entities: ["*"]
        
      - role: "user"  
        permissions: ["read", "update"]
        entities: ["CUSTOMER", "APPOINTMENT"]
        conditions:
          - "assigned_to == current_user.id"
```

---

## 9. Platform Organization Management

### 9.1 Platform Entity Types
**Stored in Platform Organization** (`org_hera_platform_00000000`):

| Entity Type | Purpose | Smart Code Pattern |
|-------------|---------|-------------------|
| `APP_TEMPLATE` | YAML app configurations | `HERA.PLATFORM.APP_TEMPLATE.{NAME}.v1` |
| `UNIVERSAL_COMPONENT` | UI component configs | `HERA.PLATFORM.UNIVERSAL_COMPONENT.{TYPE}.v1` |
| `SMART_CODE_TEMPLATE` | Code pattern definitions | `HERA.PLATFORM.SMART_CODE_TEMPLATE.{TYPE}.v1` |
| `VALIDATION_RULE` | Business rule definitions | `HERA.PLATFORM.VALIDATION_RULE.{RULE}.v1` |
| `AI_MODEL` | AI assistance models | `HERA.PLATFORM.AI_MODEL.{MODEL}.v1` |

### 9.2 Access Control Matrix
| Role | Read Templates | Write Templates | Generate Apps | Admin Platform |
|------|---------------|----------------|---------------|----------------|
| `HERA_SYSTEM` | ✅ | ✅ | ✅ | ✅ |
| `PLATFORM_ADMIN` | ✅ | ✅ | ✅ | ✅ |
| `TENANT_ADMIN` | ✅ | ❌ | ✅ | ❌ |
| `DEVELOPER` | ✅ | ❌ | ✅ | ❌ |
| `END_USER` | ❌ | ❌ | ❌ | ❌ |

### 9.3 Template Management
```typescript
// Platform template operations
const templateManager = new PlatformTemplateManager();

// Save new template
await templateManager.saveTemplate('CRM', yamlConfig);

// Clone and modify template
await templateManager.cloneTemplate('template_crm_001', 'Custom CRM');

// List templates by category
const businessTemplates = await templateManager.listTemplates({
  category: 'business'
});
```

### 9.4 Platform Access Control
```typescript
// Check platform access
const accessControl = new PlatformAccessControl();
const result = accessControl.checkAccess(user, {
  resource_type: 'template',
  operation: 'read'
});

// Use React hook for access control
const { canAccessTemplates, canAdminPlatform } = usePlatformAccess(user);
```

---

## 10. AI Assistant Integration

### 10.1 AI Features in YAML Config
```yaml
ai_assistance:
  features:
    - feature: "lead_scoring"
      description: "Auto-score leads based on behavior"
      entity: "LEAD"
      model: "lead_scoring_v1"
      
  suggestions:
    - context: "creating_customer"
      suggestions:
        - "Suggest customer type from email domain"
        - "Recommend tier based on company size"
```

### 10.2 Workflow AI Integration
- **Step recommendations** based on context and history
- **Auto-assignment** of tasks to appropriate actors
- **Validation assistance** for complex business rules
- **Exception handling** with AI-powered resolution suggestions

---

## 11. Development Standards

### 11.1 Code Generation Rules
- **Always use** YAML configuration first
- **Generate components** using Universal Templates
- **Follow** Fiori-style 4-step wizards for master data
- **Implement** S/4HANA-style transaction processing
- **Include** audit fields visibility in all generated UIs

### 11.2 Testing Requirements
```yaml
testing:
  sample_data:
    CUSTOMER:
      - entity_code: "CUST-0001"
        entity_name: "Test Customer"
        
  test_scenarios:
    - scenario: "customer_creation_flow"
      steps:
        - "Create customer via wizard"
        - "Verify audit fields populated"
        - "Test relationship creation"
```

### 11.3 Quality Gates
- **Smart code validation** passes regex pattern
- **Actor coverage** ≥ 95% in all generated components
- **GL balance validation** for all financial transactions
- **RLS isolation test** passes for multi-tenant scenarios

---

## 12. Disaster Recovery & Business Continuity

### 12.1 Backup Strategy
- **Database backups**: WAL streaming + daily snapshots
- **Configuration backups**: YAML files versioned in Git
- **Generated code backups**: Automated daily backup of `/src/generated/`
- **Retention policy**: 30 days hot storage, 7 years cold storage

### 12.2 Recovery Targets
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 5 minutes
- **Data consistency**: All Sacred Six tables atomically restored
- **Configuration restore**: YAML→App regeneration within 1 hour

### 12.3 Runbooks
- `database_restore`: Full Sacred Six schema restoration
- `cache_rebuild`: Redis cache warm-up and validation
- `org_data_recovery`: Organization-specific data isolation recovery
- `app_regeneration`: YAML configuration to running app restoration

---

## 13. Deployment Pipeline

### 13.1 Environment Progression
- **Development** → Local YAML editing and testing
- **Staging** → Full app generation and integration testing  
- **Production** → Canary deployment (5% → 25% → 100%)

### 13.2 CI/CD Gates
- ✅ **YAML validation** against schema
- ✅ **Smart code pattern** compliance check
- ✅ **Actor coverage** ≥ 95% validation
- ✅ **GL balance** enforcement test
- ✅ **RLS isolation** verification
- ✅ **Generated component** syntax validation

### 13.3 Rollback Procedures
- **Trigger conditions**: Error rate > 5% OR actor coverage < 90%
- **Rollback method**: Previous YAML configuration restoration
- **Recovery time**: < 30 minutes for configuration rollback
- **Validation**: Full integration test suite post-rollback

---

## 14. Finance DNA Extensions

### 14.1 Advanced Financial Features
| Feature | Implementation | Smart Code Pattern |
|---------|----------------|-------------------|
| Multi-ledger | `ledger_id` FK to LEDGER entity | `HERA.FIN.LEDGER.*` |
| Inter-company | `counterparty_org_id` + elimination | `HERA.FIN.INTERCO.*` |
| Tax handling | `tax_details[]` JSON in transaction lines | `HERA.FIN.TAX.*` |
| FX management | Per-currency balancing rules | `HERA.FIN.FX.*` |
| Parallel books | Multi-ledger isolation guardrail | `HERA.FIN.PARALLEL.*` |

### 14.2 Compliance Features
- **SOX compliance**: Full audit trail with actor stamping
- **IFRS support**: Multi-ledger with parallel book capability
- **Tax compliance**: Configurable tax calculation engines
- **Regulatory reporting**: Automated financial statement generation

---

## 15. Performance Optimization

### 15.1 Caching Strategy
- **Entity metadata**: 1 hour TTL for entity type definitions
- **Relationship graphs**: 30 minutes TTL for entity relationships
- **User permissions**: 15 minutes TTL for role-based access
- **Smart code validation**: 6 hours TTL for pattern validation

### 15.2 Query Optimization
- **Pagination**: Default limit 100, max 1000 records
- **Filtering**: Always include organization_id in WHERE clause
- **Indexing**: Composite indexes on (org_id, entity_type, created_at)
- **Materialized views**: Pre-computed aggregations for dashboards

---

## 16. Behavioral Rules for AI Assistants

### 16.1 Platform-First Development
- **Always start** with Platform Organization templates for new applications
- **Use PlatformTemplateManager** for template operations
- **Check access permissions** before platform operations
- **Store configurations** in Platform Organization entities
- **Never suggest** direct schema modifications
- **Use dynamic fields** for all business-specific attributes
- **Generate components** using Universal Templates
- **Follow** established Smart Code patterns

### 16.2 Code Generation Standards
- **Default to** Fiori-style React components with 4-step wizards
- **Use** tested v1 hooks (`useUniversalEntityV1`, `useUniversalTransactionV1`)
- **Include** audit fields visibility in all generated UIs
- **Implement** organization-aware filtering in all queries
- **Add** AI assistance where specified in YAML configuration

### 16.3 Security & Compliance
- **Always require** Smart Codes and actor context in examples
- **Assume** audit, RLS, and guardrails are active
- **Never bypass** validation or recommend unsafe operations
- **Explain within** HERA's contracts (RPCs, guardrails, bundles)
- **Include** organization isolation in all data operations

### 16.4 Error Handling
- **Provide** specific Smart Code pattern guidance for validation errors
- **Suggest** YAML configuration fixes rather than code modifications
- **Reference** established patterns from example applications
- **Include** troubleshooting steps for common guardrail violations

---

## 17. Reference Architecture

### 17.1 Component Locations
- **Platform Organization**: Platform constants and access control
  - `/src/lib/platform/platform-org-constants.ts`
  - `/src/lib/platform/platform-template-manager.ts`
  - `/src/lib/platform/platform-access-control.ts`
- **Universal Templates**: `/src/components/universal/`
- **YAML Schemas**: `/src/templates/app-config/`
- **Example Apps**: `/src/templates/app-config/examples/`
- **Generated Components**: `/src/generated/apps/`
- **Hook Libraries**: `/src/hooks/`

### 17.2 Documentation References
- **Platform Organization Architecture**: `/docs/PLATFORM-ORG-ARCHITECTURE.md`
- **App Configuration Guide**: `/src/templates/app-config/README.md`
- **Universal Templates**: `/src/components/universal/README.md`
- **API Documentation**: `/docs/api/README.md`
- **Security Guide**: `/docs/SECURITY-IMPLEMENTATION.md`
- **Smart Code Guide**: `/docs/SMART-CODE-GUIDE.md`

---

## 18. Summary Principles

> "Every app starts with YAML.  
> Every component uses Universal Templates.  
> Every transaction is balanced.  
> Every action is audited.  
> Every tenant is isolated.  
> Every AI follows the guardrails.  
> Every rule is data-driven."

### 18.1 Development Mantra
1. **Platform First** - Start with Platform Organization templates
2. **YAML Configuration** - Define before you build
3. **Templates Always** - Reuse proven patterns  
4. **v1 Hooks** - Use tested, production-ready APIs
5. **Smart Codes** - Follow established patterns
6. **Organization Isolation** - Security by design
7. **Access Control** - Role-based permissions everywhere
8. **Audit Everything** - Compliance from day one

### 18.2 Quality Standards
- **95%+ Actor Coverage** in all generated components
- **100% GL Balance** compliance for financial transactions
- **Zero Guardrail Violations** in production deployments
- **Sub-200ms** identity resolution performance
- **80%+ Cache Hit Rate** for optimal user experience

---

**File:** `/docs/HERA-Universal-Operating-Guide.md`  
**Version:** v2.4.2  
**Maintainer:** HERA Platform Team  
**Last Updated:** 2025-10-25  
**Key Addition:** YAML-First App Development with Universal Templates