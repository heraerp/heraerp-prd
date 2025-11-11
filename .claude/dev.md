# Multi-Tenant Retail Customers Implementation Guide

## Goal
Implement multi-tenant `/retail/customers` with per-org fields, validation, layout, branding, and policies WITHOUT schema changes or per-tenant routes.

## Deliverables

### 1. Core Implementation
- **Next.js page**: `app/retail/customers/page.tsx` (reads org context, renders dynamic fields, uses Client SDK)
- **Client SDK**: `src/lib/hera-client.ts` (calls `/api-v2/command` only)
- **Org-aware middleware**: `middleware.ts` (injects `X-Organization-Id`)
- **App YAML**: `apps/retail_customers.yaml` (base layout/flows; allow org overrides from `core_organizations.settings`)

### 2. Helper Libraries
- **Org context**: `src/lib/org-context.ts` (resolve Header > JWT claim > membership)
- **Field config**: `src/lib/field-config.ts` (merge YAML + org overrides, 5min cache)
- **Dynamic data**: `src/lib/dynamic-data.ts` (typed coercion, validation helpers)

### 3. API Routes
- **Read endpoint**: `src/app/api/v2/customers/route.ts` (RLS-guarded, org-filtered)

### 4. Test Suite
- **RLS isolation**: `tests/tenant/rls.spec.ts` (cross-org read/write → 403)
- **Actor stamping**: `tests/tenant/actor.spec.ts` (≥95% coverage on Sacred Six)
- **Smart Code validation**: `tests/api/guardrails.spec.ts` (regex enforcement)
- **UI differences**: `tests/ui/customers.spec.ts` (org changes → field set/labels/order change)

### 5. Demo & Documentation
- **Seeds**: `seeds/retail-customers-demo.ts` (two orgs with different field configurations)
- **Usage guide**: `docs/retail-customers-demo-guide.md`

### 6. CI Scripts
```bash
npm run hera:auth:test         # Authentication flow validation
npm run test:tenant-isolation  # Cross-org security verification
npm run test:actor-coverage    # Audit stamp verification
npm run test:smart-codes       # HERA DNA compliance
```

## Strict Requirements

### No Database Shortcuts
- No DB access from UI
- Use API v2 only with `{ op: "entities" | "transactions" }` payloads
- Enforce SMARTCODE regex on all entities and dynamic fields
- Never create new tables or add columns to Sacred Six

### API v2 Contract
```typescript
// Create/Update Customer
POST /api-v2/command
{
  "op": "entities",
  "p_operation": "CREATE",
  "p_data": {
    "entity_type": "CUSTOMER",
    "entity_name": "Jane Doe",
    "smart_code": "HERA.RETAIL.CUSTOMER.v1",
    "dynamic_fields": [
      {
        "field_name": "loyalty_tier",
        "field_type": "text", 
        "field_value_text": "VIP",
        "validation_rules": {"enum":["VIP","REGULAR","NEW"]},
        "smart_code": "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1",
        "field_order": 2,
        "is_required": true
      }
    ]
  }
}

// Read Customers
GET /api-v2/customers?search=&limit=50&offset=0
Headers: Authorization, X-Organization-Id
```

### Dynamic Field Configuration

**Source Priority**:
1. Base: `apps/retail_customers.yaml`
2. Org overrides: `core_organizations.settings.ui_overrides.CUSTOMER.*`
3. Field validation: `core_dynamic_data.validation_rules`

**Per-Org Examples**:
- **Org A**: `loyalty_tier`, `vip_status`, `preferred_branch` (blue/gold theme)
- **Org B**: `preferred_branch`, `consent_flags`, `credit_rating` (purple/silver theme)

### Three-Layer Validation
1. **Client**: Merged validation rules before POST
2. **Edge Guardrails**: Org filter + Smart Code regex
3. **RPC/DB**: Actor stamps + RLS enforcement

## Test Requirements

### RLS Isolation Test
```typescript
// With Org A header, cannot access Org B customers
await expect(
  apiClient.getCustomers({ orgId: 'org-b' })
).rejects.toThrow('403')
```

### Actor Stamping Coverage
```sql
-- Assert ≥95% of Sacred Six tables have non-null actor stamps
SELECT table_name, 
  (COUNT(created_by) * 100.0 / COUNT(*)) as coverage_pct
FROM (core_entities UNION core_dynamic_data UNION ...)
GROUP BY table_name
HAVING coverage_pct >= 95
```

### Smart Code Validation
```typescript
// Reject invalid Smart Codes
await expect(
  client.createCustomer({ smartCode: 'invalid.format' })
).rejects.toThrow('SMARTCODE_INVALID')
```

### UI Differences
```typescript
// Switch org → different fields visible
await page.setExtraHTTPHeaders({ 'X-Organization-Id': 'org-a' })
await expect(page.locator('[data-field="loyalty_tier"]')).toBeVisible()
```

## Success Criteria

### Functional
- ✅ One shared route `/retail/customers` 
- ✅ Switching `X-Organization-Id` changes fields/labels/order/branding
- ✅ All writes via `/api-v2/command` with proper payloads
- ✅ Actor must be org member or fail with 403

### Security 
- ✅ RLS ensures only `organization_id` rows visible
- ✅ All entities/dynamic fields have valid Smart Codes
- ✅ `created_by`/`updated_by` set on every write

### Performance
- ✅ List 1k customers paginated, p95 < 200ms
- ✅ Field config cached 5min, busted on org settings change

This implementation demonstrates HERA's "One Platform, Many Tenants" architecture while maintaining enterprise-grade security and performance.