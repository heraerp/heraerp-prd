# HERA Playbook System - Claude Context Primer

## Quick Start
```yaml
# 1. Define your business in a playbook
entities:
  - entity_type: customer
    smart_code: HERA.CRM.CUSTOMER.V1
    fields:
      - { name: email, type: text, required: true }
      - { name: credit_limit, type: number }

# 2. Deploy to HERA (6 universal tables only!)
npm run playbook:deploy crm

# 3. Use generated TypeScript APIs
const customer = await api.createCustomer({
  name: "ACME Corp",
  email: "contact@acme.com",
  credit_limit: 50000
});
```

## Core Concept: 6 Sacred Tables Handle Everything
```sql
core_organizations      -- Multi-tenant isolation
core_entities          -- ALL business objects (customers, products, accounts)
core_dynamic_data      -- Custom fields without schema changes
core_relationships     -- Entity connections and hierarchies
universal_transactions -- Business transactions
universal_transaction_lines -- Transaction details
```

## Essential Playbook Structure
```yaml
# /hera/playbooks/{module}/entities.core.yml
entities:
  - entity_type: customer
    entity_name: Customer Entity
    smart_code: HERA.CRM.CUSTOMER.V1
    fields:
      - name: email
        type: text
        required: true
        smart_code: HERA.CRM.CUSTOMER.EMAIL.V1

# /hera/playbooks/{module}/relationships.seed.yml
relationships:
  - from_type: customer
    to_type: contact
    relationship_type: has_contact
    smart_code: HERA.CRM.REL.CUSTOMER_CONTACT.V1

# /hera/playbooks/{module}/orchestration.yml
orchestration:
  transactions:
    - type: sales_order
      smart_code: HERA.SALES.ORDER.V1
      workflow:
        - { status: draft, next: confirmed }
        - { status: confirmed, next: shipped }
```

## Critical Patterns

### 1. Smart Codes (MANDATORY)
```typescript
// Format: HERA.{MODULE}.{TYPE}.{SUBTYPE}.V{VERSION}
"HERA.CRM.CUSTOMER.V1"          // Entity
"HERA.CRM.CUSTOMER.EMAIL.V1"    // Field
"HERA.CRM.REL.CUSTOMER_CONTACT.V1" // Relationship
"HERA.SALES.ORDER.V1"           // Transaction
```

### 2. Field Storage Pattern
```typescript
// Simple fields → core_entities columns
{ name: "John", status: "active" }  // Stored directly

// Custom fields → core_dynamic_data
{ credit_limit: 50000, tax_id: "12-345" }  // Dynamic storage
```

### 3. TypeScript Generation
```typescript
// Playbook YAML → TypeScript interfaces
interface Customer {
  id: string;
  name: string;
  email: string;
  credit_limit?: number;
}

// Generated APIs
await api.createCustomer(data);
await api.updateCustomer(id, data);
await api.getCustomer(id);
```

### 4. Key/Surrogate Definitions
```yaml
# entities.keydefs.yml
keydefs:
  - entity_type: customer
    unique_keys:
      - [customer_code]  # Business key
      - [email]          # Natural key
    surrogate_key: true  # UUID primary key
```

## Essential Commands
```bash
# Development
npm run playbook:validate {module}  # Check YAML syntax
npm run playbook:deploy {module}    # Deploy to database
npm run playbook:generate {module}  # Generate TypeScript

# Testing
npm run playbook:test {module}      # Run UAT tests

# Production
npm run playbook:deploy:all        # Deploy all modules
npm run playbook:generate:all      # Generate all TypeScript
```

## Module Organization
```
/hera/playbooks/
  ├── {module}/
  │   ├── entities.core.yml       # Business objects
  │   ├── entities.keydefs.yml    # Keys/constraints
  │   ├── relationships.seed.yml  # Entity connections
  │   ├── dynamic_data.seed.yml   # Custom fields
  │   ├── orchestration.yml       # Workflows/rules
  │   └── tests.uat.yml          # Test scenarios
  └── registry/
      └── vocabulary/            # Shared definitions
```

## Top 10 Gotchas

1. **NO SCHEMA CHANGES** - Only use the 6 sacred tables
2. **SMART CODES REQUIRED** - Every entity/field/relationship needs one
3. **USE RELATIONSHIPS FOR STATUS** - Never add status columns
4. **ORGANIZATION_ID ALWAYS** - Multi-tenant isolation is sacred
5. **FIELD STORAGE RULES** - Check if field goes to entity or dynamic_data
6. **NO CUSTOM TABLES** - Everything fits in the 6 tables
7. **KEYDEFS MATTER** - Define business keys for duplicate prevention
8. **YAML INDENTATION** - 2 spaces, no tabs
9. **VALIDATE FIRST** - Always run validate before deploy
10. **USE GENERATED APIS** - Don't write custom SQL

## Integration Points

### 1. Universal API
```typescript
import { universalApi } from '@/lib/universal-api';

// All operations go through universal API
await universalApi.createEntity({
  entity_type: 'customer',
  organization_id: orgId,
  ...data
});
```

### 2. Generated Type-Safe APIs
```typescript
import { crmApi } from '@/lib/api/crm';

// Playbook-generated APIs
const customer = await crmApi.createCustomer({
  name: "ACME Corp",
  email: "test@acme.com"
});
```

### 3. React Query Hooks
```typescript
// Auto-generated hooks
const { data, isLoading } = useCustomer(customerId);
const mutation = useCreateCustomer();
```

## Complete Example: CRM Module
```yaml
# entities.core.yml
entities:
  - entity_type: customer
    smart_code: HERA.CRM.CUSTOMER.V1
    fields:
      - { name: email, type: text, required: true }
      - { name: phone, type: text }
      - { name: credit_limit, type: number }

# orchestration.yml
orchestration:
  transactions:
    - type: sales_order
      smart_code: HERA.SALES.ORDER.V1
      required_fields: [customer_id, order_date]
      workflow:
        - { status: draft, next: confirmed }

# Generated TypeScript usage
const customer = await crmApi.createCustomer({
  name: "ACME Corp",
  email: "sales@acme.com",
  credit_limit: 100000
});

const order = await salesApi.createSalesOrder({
  customer_id: customer.id,
  order_date: new Date(),
  items: [{ product_id: "...", quantity: 10 }]
});
```

## Best Practices

1. **Start Simple** - Basic entities first, add complexity later
2. **Use Vocabulary** - Shared types in registry/vocabulary
3. **Test Everything** - UAT tests prevent production issues
4. **Version Smart Codes** - Always end with .V1, .V2 etc
5. **Document Fields** - Use description for clarity

## Revolutionary Benefits
- **Zero Schema Changes** - Add features without migrations
- **Type Safety** - Full TypeScript generation
- **Multi-Tenant** - Perfect isolation built-in
- **No ORM Needed** - Direct SQL with type safety
- **Instant APIs** - CRUD operations auto-generated

---
**Remember**: HERA Playbooks let you define your entire business in YAML and get a complete, type-safe, production-ready system with zero custom database work!