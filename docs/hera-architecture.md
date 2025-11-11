# HERA Architecture Summary

## Actor-Everywhere Pattern

HERA enforces that every write operation is traceable to a specific actor (user) who performs the action. This creates a complete audit trail and enables security validation.

### Flow
```
JWT Token → resolve_user_identity_v1() → Actor Entity ID → Membership Check → Write with Actor Stamp
```

### Implementation
- All RPC functions require `p_actor_user_id` parameter
- `created_by` and `updated_by` fields automatically populated
- Actor must be active member of target organization
- Membership validated via `core_relationships` with `USER_MEMBER_OF_ORG` type

## Sacred Six Tables

HERA's universal data model consists of exactly six tables that handle all business data:

### Core Tables
1. **`core_entities`** - Master data records (customers, products, users, etc.)
2. **`core_dynamic_data`** - Key-value business attributes 
3. **`core_relationships`** - Directed links between entities
4. **`core_organizations`** - Tenant boundaries and settings

### Transaction Tables  
5. **`universal_transactions`** - Transaction headers
6. **`universal_transaction_lines`** - Transaction line items

### Key Principles
- **No custom business tables** - All data fits into Sacred Six
- **Organization isolation** - Every row has `organization_id` 
- **Actor stamping** - Every row has `created_by`/`updated_by`
- **Smart Codes** - Every entity/field has HERA DNA identifier

## Multi-Tenant Architecture

### Tenant Isolation
- **Data**: RLS (Row Level Security) enforces `organization_id` filtering
- **Code**: Single shared application serves all tenants  
- **Config**: Per-tenant customization via `core_organizations.settings`

### Customization Layers
1. **Base Configuration**: YAML files define default fields/layouts
2. **Org Overrides**: `core_organizations.settings.ui_overrides` for tenant-specific changes
3. **Dynamic Data**: Business values stored in `core_dynamic_data`
4. **Relationships**: Entity hierarchies in `core_relationships`

### Example: Customer Fields
```yaml
# Base: apps/retail_customers.yaml
fields:
  - name: customerName
    type: string
    required: true

# Org A Override: core_organizations.settings.ui_overrides.CUSTOMER
loyalty_tier:
  type: select
  options: ["VIP", "REGULAR", "NEW"]
  required: true
  field_order: 2

# Org B Override: 
consent_flags:
  type: boolean
  label: "Marketing Consent"
  required: false
  field_order: 3
```

## Security Model

### Defense in Depth
1. **Edge Gateway** - JWT validation, org context resolution
2. **Guardrails** - Smart Code validation, org filtering
3. **RPC Layer** - Actor verification, business logic
4. **Database** - RLS policies, audit triggers

### API v2 Enforcement
- All client requests go through `/functions/v1/api-v2/*`
- Direct RPC calls from clients are forbidden
- Required headers: `Authorization`, `X-Organization-Id`
- Automatic actor resolution and membership validation

### Smart Code Validation
Every entity and dynamic field must have valid HERA DNA Smart Code:
```
Pattern: HERA.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}
Example: HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1
```

## Development Patterns

### Single Route, Multiple Tenants
```typescript
// ✅ Correct: One route serves all orgs
/retail/customers

// ❌ Wrong: Per-tenant routes
/retail/customers/org-a
/retail/customers/org-b
```

### Data-Driven UI
```typescript
// Read org-specific field configuration
const fieldConfig = await getFieldConfig('CUSTOMER', orgId)

// Render dynamic form based on config
return (
  <Form>
    {fieldConfig.fields.map(field => (
      <Field key={field.name} config={field} />
    ))}
  </Form>
)
```

### API v2 Only
```typescript
// ✅ Correct: Use API v2 gateway
const result = await heraClient.command({
  op: 'entities',
  p_operation: 'CREATE',
  p_data: customerData
})

// ❌ Wrong: Direct RPC call
const result = await supabase.rpc('hera_entities_crud_v1', ...)
```

This architecture enables unlimited multi-tenancy while maintaining enterprise-grade security, performance, and maintainability.