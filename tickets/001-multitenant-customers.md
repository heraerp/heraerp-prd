# Ticket #001: Multi-Tenant Retail Customers Module

## Overview
Implement org-aware `/retail/customers` page with dynamic fields from `core_dynamic_data` and org overrides from `core_organizations.settings`.

## Tasks

### Phase 1: Foundation
- [x] Create platform invariants (`.claude/system.md`)
- [x] Create developer prompt (`.claude/dev.md`) 
- [ ] Build helper libraries (`org-context.ts`, `field-config.ts`, `dynamic-data.ts`)
- [ ] Create YAML configuration (`apps/retail_customers.yaml`)
- [ ] Enhance middleware to inject `X-Organization-Id`

### Phase 2: API & SDK
- [ ] Create `/api/v2/customers` read endpoint with RLS guards
- [ ] Enhance HERA client SDK with `.command()` wrapper
- [ ] Implement customer-specific methods (`listCustomers`, `createCustomer`)

### Phase 3: UI Implementation
- [ ] Build shared `/retail/customers` page with dynamic field rendering
- [ ] Implement org-aware form validation and submission
- [ ] Add per-org branding (logo, colors, theme) from org settings
- [ ] Display audit trail (WHO/WHEN) from entity stamps

### Phase 4: Demo Data
- [ ] Create demo seeds for two orgs with different customer fields:
  - **Org A (MatrixIT)**: `loyalty_tier`, `vip_status`, `preferred_branch`
  - **Org B (JewelsGalaxy)**: `preferred_branch`, `consent_flags`, `credit_rating`

### Phase 5: Testing
- [ ] **RLS Tests** (`tests/tenant/rls.spec.ts`): Cross-org access denied (403)
- [ ] **Actor Tests** (`tests/tenant/actor.spec.ts`): `created_by`/`updated_by` present (≥95%)
- [ ] **Guardrails Tests** (`tests/api/guardrails.spec.ts`): Smart Code regex enforced
- [ ] **UI Tests** (`tests/ui/customers.spec.ts`): Org switching changes fields/labels/order

## Technical Requirements

### API v2 Contract
```typescript
// Create Customer
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

### Field Configuration Merge
1. **Base**: `apps/retail_customers.yaml` (module defaults)
2. **Org Overrides**: `core_organizations.settings.ui_overrides.CUSTOMER.*` 
3. **Field Rules**: `core_dynamic_data.validation_rules` (row-level constraints)

### Security Requirements
- All writes via API v2 gateway → `hera_entities_crud_v1`
- Actor stamping on every Sacred Six write (`created_by`/`updated_by`)
- RLS isolation by `organization_id` 
- Smart Code regex validation on entities + dynamic fields
- Membership validation (actor must belong to org)

## Test Scenarios

### RLS Isolation
```typescript
// User from Org A cannot access Org B customers
const orgAClient = createHeraClient(token, 'org-a-uuid')
const orgBClient = createHeraClient(token, 'org-b-uuid')

await expect(
  orgAClient.listCustomers() // Should only see Org A customers
).resolves.toHaveLength(greaterThan(0))

await expect(
  orgBClient.listCustomers() // Should only see Org B customers  
).resolves.toHaveLength(greaterThan(0))

// Cross-org access should fail
await expect(
  orgAClient.getCustomer('org-b-customer-id')
).rejects.toThrow('403')
```

### Actor Stamping
```sql
-- Verify ≥95% coverage across Sacred Six tables
SELECT 
  'core_entities' as table_name,
  COUNT(*) as total_rows,
  COUNT(created_by) as stamped_rows,
  (COUNT(created_by) * 100.0 / COUNT(*)) as coverage_pct
FROM core_entities 
WHERE entity_type = 'CUSTOMER'
UNION ALL
SELECT 
  'core_dynamic_data' as table_name,
  COUNT(*) as total_rows, 
  COUNT(created_by) as stamped_rows,
  (COUNT(created_by) * 100.0 / COUNT(*)) as coverage_pct
FROM core_dynamic_data cd
JOIN core_entities ce ON cd.entity_id = ce.id
WHERE ce.entity_type = 'CUSTOMER'
-- Coverage must be ≥95% for CI to pass
```

### Smart Code Validation
```typescript
// Valid Smart Codes should pass
await expect(
  client.createCustomer({
    customerName: 'Test Customer',
    smartCode: 'HERA.RETAIL.CUSTOMER.v1',
    dynamicFields: [{
      fieldName: 'loyalty_tier',
      smartCode: 'HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1'
    }]
  })
).resolves.toBeTruthy()

// Invalid Smart Codes should fail
await expect(
  client.createCustomer({
    customerName: 'Test Customer',
    smartCode: 'invalid.format' // Missing HERA prefix
  })
).rejects.toThrow('SMARTCODE_INVALID')
```

### UI Field Differences
```typescript
// Playwright test: Switch org context → different fields
await page.setExtraHTTPHeaders({
  'X-Organization-Id': 'matrix-it-org-id'
})
await page.goto('/retail/customers')
await expect(page.locator('[data-field="loyalty_tier"]')).toBeVisible()
await expect(page.locator('[data-field="vip_status"]')).toBeVisible()

await page.setExtraHTTPHeaders({
  'X-Organization-Id': 'jewels-galaxy-org-id'  
})
await page.reload()
await expect(page.locator('[data-field="consent_flags"]')).toBeVisible()
await expect(page.locator('[data-field="credit_rating"]')).toBeVisible()
```

## Definition of Done

### Functional
- ✅ Single shared route `/retail/customers` renders different fields/layout/branding per org
- ✅ Switching `X-Organization-Id` header changes visible fields, labels, validation rules
- ✅ All writes go through `/api-v2/command` with proper `{ op: "entities" }` payloads
- ✅ Per-org branding (colors, logos, themes) applied from `core_organizations.settings`

### Security
- ✅ Actor must be organization member or receive 403 error
- ✅ RLS ensures only rows for `organization_id` are visible
- ✅ All entities and dynamic fields carry valid HERA DNA Smart Codes

### Technical  
- ✅ No new database tables or columns added (Sacred Six compliance)
- ✅ `created_by`/`updated_by` stamped on ≥95% of Sacred Six writes
- ✅ Field configuration cached 5min, invalidated on org settings change
- ✅ Performance: List 1k customers paginated, p95 < 200ms

### Testing
- ✅ CI gates pass: `npm run test:tenant-isolation`
- ✅ Actor coverage: `npm run test:actor-coverage` 
- ✅ Smart Code validation: `npm run test:smart-codes`
- ✅ Guardrails enforcement: All API v2 validation rules active

## Common Pitfalls to Avoid

❌ Reading database directly from browser (use API v2 only)
❌ Storing per-org fields as Sacred Six table columns
❌ Hardcoding field labels/validation in UI components  
❌ Missing Smart Codes on dynamic fields (not just entities)
❌ Cross-org data leakage via missing `organization_id` filters
❌ Bypassing API v2 security gateway for performance

## Success Metrics

This ticket demonstrates HERA's **"One Platform, Many Tenants"** architecture:
- Single codebase serves unlimited organizations
- Zero schema changes required for new tenants
- Complete data isolation with audit trails
- Enterprise-grade security and performance