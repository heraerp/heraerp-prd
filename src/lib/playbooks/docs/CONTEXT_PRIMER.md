# HERA Playbook System - Context Primer

> **Purpose**: This document provides a complete introduction to the HERA Playbook System for Claude or other AI assistants. Copy and paste relevant sections when starting work on HERA playbooks.

## 🏗️ Core Architecture

### The Sacred 6-Table Foundation

HERA is built on **exactly 6 universal tables** that model any business without schema changes:

```sql
1. core_organizations      -- WHO: Multi-tenant isolation
2. core_entities          -- WHAT: All business objects
3. core_dynamic_data      -- HOW: Custom fields without schema changes
4. core_relationships     -- WHY: Entity connections and workflows
5. universal_transactions -- WHEN: All business transactions
6. universal_transaction_lines -- DETAILS: Transaction line items
```

### How Playbooks Map to the 6 Tables

Playbooks are YAML configurations that define business structures on top of the universal schema:

```yaml
# Entity definitions → core_entities
entities:
  - entity_type: customer
    fields: [...] → core_dynamic_data

# Relationships → core_relationships  
relationships:
  - type: belongs_to
    from: customer
    to: customer_group

# Transactions → universal_transactions + lines
orchestrations:
  - transaction_type: sale_order
    lines: [...] → universal_transaction_lines
```

## 🧠 Smart Code System

### Format and Rules

**Format**: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}`

```typescript
// Examples:
'HERA.CRM.CUST.ENT.PROF.V1'      // Customer entity
'HERA.CRM.SALE.TXN.ORDER.V1'     // Sales transaction
'HERA.CRM.REL.CUST.GROUP.V1'     // Customer relationship
```

**Critical Rules**:
- 6-10 segments, uppercase, ends with `.V1` (not `.v1`)
- Use existing families - don't invent new ones
- Every entity, transaction, and line MUST have a valid smart_code
- Smart codes enable automatic GL posting and business intelligence

### Common Patterns by Module

```typescript
// CRM Module
HERA.CRM.CUST.ENT.*      // Customer entities
HERA.CRM.LEAD.ENT.*      // Lead entities
HERA.CRM.SALE.TXN.*      // Sales transactions

// Finance Module
HERA.FINANCE.GL.ENT.*    // GL account entities
HERA.FINANCE.JE.TXN.*    // Journal entries
HERA.FINANCE.INV.TXN.*   // Invoices

// Inventory Module
HERA.INVENTORY.PROD.ENT.*   // Product entities
HERA.INVENTORY.MOVE.TXN.*   // Stock movements
HERA.INVENTORY.COUNT.TXN.*  // Stock counts
```

## 🔌 API Endpoints

### Core Playbook APIs

```typescript
// 1. Entity Management
GET  /api/v1/{module}/entities
POST /api/v1/{module}/entities
PUT  /api/v1/{module}/entities/:id
DELETE /api/v1/{module}/entities/:id

// 2. Transaction Processing
GET  /api/v1/{module}/transactions
POST /api/v1/{module}/transactions
PUT  /api/v1/{module}/transactions/:id

// 3. Reporting
GET  /api/v1/{module}/reports
POST /api/v1/{module}/reports/execute

// 4. Validation
POST /api/v1/{module}/validations
```

### Universal DNA Service

```typescript
POST /api/v1/universal/dna
{
  action: "process_orchestration",
  module: "crm",
  orchestration_key: "customer_onboarding",
  data: { ... }
}
```

### Module-Specific Examples

```typescript
// CRM
POST /api/v1/crm/entities
{
  entity_type: "customer",
  entity_name: "Acme Corp",
  smart_code: "HERA.CRM.CUST.ENT.CORP.V1",
  fields: { credit_limit: 50000 }
}

// Sales
POST /api/v1/sales/transactions
{
  transaction_type: "sale_order",
  smart_code: "HERA.SALES.ORDER.TXN.STD.V1",
  customer_id: "uuid",
  lines: [...]
}
```

## 🎭 Orchestrator Architecture

### Core Components

```typescript
// 1. Orchestration Definition (YAML)
orchestrations:
  customer_onboarding:
    transaction_type: onboarding
    steps:
      - create_customer
      - assign_credit_limit
      - send_welcome_email

// 2. DNA Service Handler
const dnaService = new UniversalDnaService(supabase);
const result = await dnaService.processOrchestration({
  module: 'crm',
  orchestrationKey: 'customer_onboarding',
  data: inputData,
  organizationId: 'org-uuid'
});

// 3. Transaction Processing
- Creates header in universal_transactions
- Creates lines in universal_transaction_lines  
- Updates entities via relationships
- Maintains complete audit trail
```

### Orchestration Flow

```mermaid
Input → Validation → Transaction Header → Process Steps → Transaction Lines → Update Entities → Response
```

## 🔐 Security & Multi-Tenancy

### Organization Isolation

**CRITICAL**: Every operation MUST include `organization_id`:

```typescript
// ✅ CORRECT
const customer = await api.createEntity({
  entity_type: 'customer',
  organization_id: currentOrg.id,  // REQUIRED
  ...
});

// ❌ WRONG - Will fail RLS policies
const customer = await api.createEntity({
  entity_type: 'customer',
  // Missing organization_id!
});
```

### RLS Policies

All tables enforce Row Level Security:

```sql
-- Example: Entities can only be accessed by their organization
CREATE POLICY entities_isolation ON core_entities
  USING (organization_id = auth.organization_id());
```

## 📝 Common Operations

### Creating an Entity

```typescript
// Using DNA Service
const customer = await dnaService.processEntityCreation({
  module: 'crm',
  entityType: 'customer',
  data: {
    entity_name: 'Acme Corp',
    smart_code: 'HERA.CRM.CUST.ENT.CORP.V1',
    fields: {
      email: 'contact@acme.com',
      credit_limit: 50000,
      payment_terms: 'NET30'
    }
  },
  organizationId: 'org-uuid'
});
```

### Creating a Transaction

```typescript
// Sales Order with Lines
const order = await dnaService.processTransaction({
  module: 'sales',
  transactionType: 'sale_order',
  data: {
    smart_code: 'HERA.SALES.ORDER.TXN.STD.V1',
    customer_id: 'customer-uuid',
    order_date: new Date(),
    lines: [
      {
        product_id: 'product-uuid',
        quantity: 10,
        unit_price: 99.99,
        smart_code: 'HERA.SALES.ORDER.LINE.PROD.V1'
      }
    ]
  },
  organizationId: 'org-uuid'
});
```

### Running Reports

```typescript
// Execute a report
const report = await dnaService.executeReport({
  module: 'sales',
  reportKey: 'sales_by_customer',
  parameters: {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    customer_id: 'optional-filter'
  },
  organizationId: 'org-uuid'
});
```

## ⚠️ Common Gotchas

### 1. Smart Code Validation

```typescript
// Always validate smart codes
import { validateSmartCode } from '@/lib/dna/utils/smartCodeValidator';

if (!validateSmartCode(smartCode)) {
  throw new Error(`Invalid smart code: ${smartCode}`);
}
```

### 2. Organization Context

```typescript
// Always check organization context
if (!organizationId) {
  return new Response('No organization context', { status: 400 });
}
```

### 3. Transaction Atomicity

```typescript
// Use transactions for multi-step operations
const result = await supabase.rpc('process_orchestration', {
  p_module: 'crm',
  p_orchestration: orchestrationData,
  p_organization_id: organizationId
});
```

### 4. Dynamic Field Types

```typescript
// Use correct field columns
{
  field_value_text: 'For text values',
  field_value_number: 123.45,  // For numbers
  field_value_date: '2024-01-01',  // For dates
  field_value_boolean: true,  // For booleans
  field_value_json: { complex: 'data' }  // For JSON
}
```

## 🚀 Best Practices

### 1. Always Use Playbooks

```yaml
# Define structure in playbooks, not code
entities:
  - entity_type: customer
    smart_code_pattern: 'HERA.CRM.CUST.ENT.{subtype}.V1'
    required_fields: [name, email]
```

### 2. Leverage Smart Codes

```typescript
// Smart codes enable automatic behavior
if (smartCode.includes('.GL.')) {
  // Automatically handle GL posting
}
```

### 3. Use the DNA Service

```typescript
// Don't write direct SQL, use DNA service
const result = await dnaService.processOrchestration({...});
```

### 4. Maintain Audit Trail

```typescript
// All operations automatically logged
{
  created_by: userId,
  created_at: timestamp,
  ip_address: request.ip,
  user_agent: request.headers['user-agent']
}
```

## 📚 Quick Reference

### File Structure

```
/hera/playbooks/
  └── {module}/
      ├── entities.core.yml       # Core entity definitions
      ├── entities.keydefs.yml    # Key field definitions
      ├── relationships.seed.yml  # Relationships
      ├── orchestration.yml       # Business processes
      ├── read_models.yml         # Query definitions
      ├── reports.yml            # Report definitions
      └── tests.uat.yml          # Test scenarios
```

### Key Functions

```typescript
// Entity Operations
dnaService.processEntityCreation()
dnaService.processEntityUpdate()
dnaService.getEntities()

// Transaction Operations
dnaService.processTransaction()
dnaService.getTransactions()

// Orchestrations
dnaService.processOrchestration()
dnaService.validateOrchestration()

// Reports
dnaService.executeReport()
dnaService.getAvailableReports()
```

### Environment Variables

```bash
# Required for all operations
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 🎯 Getting Started Checklist

When working on a playbook module:

1. ✅ Check the module's playbook files exist
2. ✅ Verify smart code patterns are defined
3. ✅ Ensure organization_id is available
4. ✅ Use DNA service for all operations
5. ✅ Validate all inputs before processing
6. ✅ Test with multiple scenarios
7. ✅ Verify audit trail is complete

---

**Remember**: HERA's power comes from its universal architecture. Always think in terms of the 6 sacred tables and how your business logic maps to them through playbooks and smart codes.