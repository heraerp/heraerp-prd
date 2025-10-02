# HERA DNA: Universal API v2 RPC Patterns

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-01
**DNA Component**: `HERA.DNA.API.RPC.PATTERNS.V1`

## Overview

HERA Universal API v2 is built on **Postgres RPC functions** accessed via Supabase. This DNA document provides the canonical patterns, signatures, and best practices for all RPC operations.

## Core Principles (SACRED)

### 1. **RPC-First Architecture**
- ✅ All CRUD operations go through Postgres functions
- ❌ Never use direct table access in API routes
- ✅ Functions provide business logic, validation, and audit trails
- ❌ Never bypass RPC for "convenience"

### 2. **Sacred Parameters**
```typescript
// ALWAYS required
p_organization_id: UUID  // Multi-tenant isolation
p_smart_code: string     // Business intelligence context

// Smart code regex (MUST validate)
^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$
// Minimum 6 segments: HERA + industry + module + 2+ middle + version
```

### 3. **Parameter Naming Rules**
- ✅ Use exact parameter names from function signature
- ✅ Prefix with `p_` (e.g., `p_organization_id`, `p_entity_type`)
- ❌ PostgREST matches by name - wrong names = function not found
- ❌ Never assume parameter order (PostgREST sorts alphabetically)

### 4. **Field Placement Policy**
```typescript
// Default: core_dynamic_data
color: "text" → core_dynamic_data.field_value_text
price: 99.99 → core_dynamic_data.field_value_number

// Only use metadata for system fields
metadata: {
  metadata_category: "system_ai",
  ai_confidence: 0.92
}

// Status: use universal_transactions relationships
// ❌ NEVER: status column
// ✅ ALWAYS: relationships with status entities
```

---

## Entity Functions

### `hera_entity_upsert_v1`
**Purpose**: Create or update entities
**Returns**: `entity_id` as TEXT

```typescript
// Minimal signature (7 core parameters)
{
  p_organization_id: UUID,
  p_entity_type: string,      // 'customer', 'product', 'product_category', etc.
  p_entity_name: string,
  p_smart_code: string,        // Must match regex
  p_entity_id: UUID | null,    // null for create, UUID for update
  p_entity_code: string | null,
  p_metadata: JSONB | null     // System metadata only
}

// Extended signature (17 parameters - deployed version)
{
  p_organization_id: UUID,
  p_entity_type: string,
  p_entity_name: string,
  p_smart_code: string,
  p_entity_id: UUID | null,
  p_entity_code: string | null,
  p_entity_description: string | null,
  p_parent_entity_id: UUID | null,
  p_status: string | null,
  p_tags: string[] | null,
  p_smart_code_status: string | null,
  p_business_rules: JSONB | null,
  p_metadata: JSONB | null,
  p_ai_confidence: number | null,
  p_ai_classification: string | null,
  p_ai_insights: JSONB | null,
  p_actor_user_id: UUID | null
}

// Usage example
const result = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'product_category',
  p_entity_name: 'Premium Services',
  p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1',
  p_entity_id: null,
  p_entity_code: 'CAT-PREMIUM-001',
  p_metadata: null
}, { mode: 'service' })

// Returns: { data: "uuid-here", error: null }
```

### `hera_entity_read_v1`
**Purpose**: Query entities with filters
**Returns**: JSONB with entity/entities

```typescript
{
  p_organization_id: UUID,
  p_entity_id?: UUID,              // Single entity lookup
  p_entity_type?: string,          // Filter by type
  p_entity_code?: string,          // Filter by code
  p_smart_code?: string,           // Filter by smart code
  p_status?: string,               // Filter by status
  p_include_relationships?: boolean,
  p_include_dynamic_data?: boolean,
  p_limit?: number,
  p_offset?: number
}

// Returns
{
  success: true,
  data: [...entities],
  metadata: {
    operation: 'read_multiple' | 'read_single',
    total: number,
    limit: number,
    offset: number,
    has_more: boolean
  }
}
```

### `hera_entity_delete_v1`
**Purpose**: Delete entity (soft/hard)
**Returns**: JSONB with operation result

```typescript
{
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_hard_delete?: boolean,        // Default: false (soft delete)
  p_cascade?: boolean,            // Delete related records
  p_actor_user_id?: UUID
}
```

### `hera_entity_recover_v1`
**Purpose**: Recover soft-deleted entity
**Returns**: JSONB with operation result

```typescript
{
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_cascade?: boolean,
  p_actor_user_id?: UUID
}
```

---

## Dynamic Data Functions

### `hera_dynamic_data_set_v1`
**Purpose**: Create/update single dynamic field
**Returns**: `{ success, data: { id, operation } }`

```typescript
{
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_field_name: string,
  p_field_type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json',
  p_field_value_text?: string,
  p_field_value_number?: number,
  p_field_value_boolean?: boolean,
  p_field_value_date?: string,
  p_field_value_datetime?: string,
  p_field_value_json?: JSONB,
  p_smart_code?: string
}
```

### `hera_dynamic_data_batch_v1`
**Purpose**: Batch set multiple fields
**Returns**: `{ success, results: [...] }`

```typescript
{
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_smart_code: string,
  p_fields: Array<{
    field_name: string,
    field_type: string,
    field_value?: any,           // Auto-routes to correct column
    field_value_number?: number,
    field_value_text?: string,
    // etc.
  }>
}

// Example: Product category with color/icon
await setDynamicDataBatch('', {
  p_organization_id: orgId,
  p_entity_id: categoryId,
  p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1',
  p_fields: [
    { field_name: 'color', field_type: 'text', field_value: '#8B5CF6' },
    { field_name: 'icon', field_type: 'text', field_value: 'Sparkles' },
    { field_name: 'sort_order', field_type: 'number', field_value_number: 0 }
  ]
})
```

### `hera_dynamic_data_get_v1`
**Purpose**: Retrieve dynamic fields
**Returns**: Array of fields

```typescript
{
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_field_name?: string  // Optional: get specific field
}

// Returns: Array<{
//   id, field_name, field_type,
//   field_value_text, field_value_number, ...
// }>
```

### `hera_dynamic_data_delete_v1`
**Purpose**: Delete dynamic fields
**Returns**: `{ success, deleted_count }`

```typescript
{
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_field_name?: string  // Optional: delete specific field, else all
}
```

---

## Relationship Functions

### `hera_relationship_create_v1`
**Purpose**: Create entity relationship
**Returns**: `relationship_id`

```typescript
{
  p_organization_id: UUID,
  p_from_entity_id: UUID,
  p_to_entity_id: UUID,
  p_relationship_type: string,    // 'has_status', 'parent_of', 'uses', etc.
  p_smart_code?: string,
  p_relationship_data?: JSONB
}
```

### `hera_relationship_upsert_v1`
**Purpose**: Insert or update relationship
**Returns**: `{ relationship_id, is_update }`

```typescript
{
  p_organization_id: UUID,
  p_from_entity_id: UUID,
  p_to_entity_id: UUID,
  p_relationship_type: string,
  p_smart_code: string,
  p_relationship_data?: JSONB
}
```

### `hera_relationship_query_v1`
**Purpose**: Query relationships with filters
**Returns**: Paginated JSONB array

```typescript
{
  p_organization_id: UUID,
  p_entity_id?: UUID,             // Filter by entity (either side)
  p_side?: 'from' | 'to' | 'both',
  p_relationship_type?: string,
  p_limit?: number,
  p_offset?: number
}
```

### `hera_relationship_delete_v1`
**Purpose**: Delete relationship
**Returns**: `{ success, id }`

```typescript
{
  p_organization_id: UUID,
  p_relationship_id: UUID
}
```

---

## Transaction Functions

### `hera_txn_create_v1`
**Purpose**: Create transaction with lines
**Returns**: `{ success, transaction_id }`

```typescript
{
  p_header: {
    organization_id: UUID,
    transaction_type: string,
    smart_code: string,
    transaction_date: string,
    total_amount: number,
    from_entity_id?: UUID,
    to_entity_id?: UUID,
    // ... other header fields
  },
  p_lines: [{
    line_number: number,
    line_entity_id: UUID,
    quantity: number,
    unit_price: number,
    line_amount: number,
    smart_code: string,
    // ... other line fields
  }]
}
```

### `hera_txn_update_v1`
**Purpose**: Update transaction header
**Returns**: `{ success, transaction_id }`

```typescript
{
  p_organization_id: UUID,
  p_transaction_id: UUID,
  p_patch: {
    // Only fields to update
    total_amount?: number,
    status?: string,
    // etc.
  }
}
```

### `hera_txn_read_v1`
**Purpose**: Read transaction with optional lines
**Returns**: Transaction JSONB

```typescript
{
  p_org_id: UUID,
  p_transaction_id: UUID,
  p_include_lines?: boolean
}
```

### `hera_txn_validate_v1`
**Purpose**: Validate transaction integrity
**Returns**: `{ success, checks: [...] }`

```typescript
{
  p_org_id: UUID,
  p_transaction_id: UUID
}

// Returns validation checks:
// - GL balance (debits = credits)
// - Line totals = header total
// - Currency consistency
// - Required fields present
```

### `hera_txn_reverse_v1`
**Purpose**: Create reversal transaction
**Returns**: `{ success, reversal_id, original_id }`

```typescript
{
  p_organization_id: UUID,
  p_transaction_id: UUID,
  p_reversal_date?: string,
  p_reason?: string
}
```

### `hera_txn_void_v1`
**Purpose**: Void transaction
**Returns**: `{ success, transaction_id }`

```typescript
{
  p_organization_id: UUID,
  p_transaction_id: UUID,
  p_reason?: string
}
```

---

## Validation Functions

### `hera_validate_coa`
**Purpose**: Validate Chart of Accounts
**Returns**: Array of validation issues

```typescript
{
  p_org: UUID
}

// Returns issues about:
// - Smart code format
// - Ledger semantics
// - Account uniqueness
// - Hierarchy integrity
```

### `hera_validate_journals`
**Purpose**: Validate journal entries
**Returns**: Array of journal issues

```typescript
{
  p_org: UUID
}
```

### `hera_validate_smartcodes`
**Purpose**: Detect duplicate smart codes
**Returns**: Array of duplicate issues

```typescript
{
  p_org: UUID
}
```

### `hera_validate_coa_smartcode_all`
**Purpose**: Run all COA validations
**Returns**: Combined validation results

```typescript
{
  p_org: UUID
}
```

---

## Report Functions

### `hera_entity_profiles`
**Purpose**: Query materialized entity view
**Returns**: Rows from MV

```typescript
{
  p_organization_id: UUID,
  p_entity_type?: string,
  p_smartcode_like?: string
}
```

### `hera_refresh_rpt_entity_profiles`
**Purpose**: Refresh materialized view
**Returns**: `{ success }`

```typescript
// No parameters - refreshes all orgs
```

---

## Best Practices & Patterns

### ✅ Two-Step Entity Creation Pattern

**Pattern**: Create entity → Add dynamic fields

```typescript
// Step 1: Create entity
const entityId = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'product_category',
  p_entity_name: 'Premium Services',
  p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1',
  p_entity_id: null,
  p_entity_code: 'CAT-001',
  p_metadata: null
})

// Step 2: Add dynamic fields
await callRPC('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId.data,
  p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1',
  p_fields: [
    { field_name: 'color', field_type: 'text', field_value: '#8B5CF6' },
    { field_name: 'icon', field_type: 'text', field_value: 'Sparkles' }
  ]
})
```

### ✅ Status Workflow Pattern

**Pattern**: Use relationships, NOT status columns

```typescript
// ❌ WRONG: status column
UPDATE core_entities SET status = 'approved'

// ✅ CORRECT: relationship
await callRPC('hera_relationship_create_v1', {
  p_organization_id: orgId,
  p_from_entity_id: transactionId,
  p_to_entity_id: approvedStatusId,
  p_relationship_type: 'has_status',
  p_smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.V1'
})
```

### ✅ Error Handling Pattern

```typescript
const result = await callRPC('hera_entity_upsert_v1', params, options)

if (result.error) {
  // Check for guardrail violations
  if (result.error.code === 'HERA_ORG_REQUIRED') {
    throw new Error('Organization ID is required')
  }

  if (result.error.code === 'HERA_SMARTCODE_INVALID') {
    throw new Error('Invalid smart code format')
  }

  // Handle other errors
  console.error('[RPC Error]', result.error)
  throw new Error(result.error.message)
}

return result.data
```

### ✅ Testing RPC Functions

```typescript
// 1. Use test scripts to verify deployed functions
node test-entity-upsert-rpc.js

// 2. Start with minimal parameters
const minimal = {
  p_organization_id: orgId,
  p_entity_type: 'test',
  p_entity_name: 'Test',
  p_smart_code: 'HERA.TEST.ENTITY.SIMPLE.V1'
}

// 3. Add optional parameters as needed
const extended = {
  ...minimal,
  p_entity_code: 'TEST-001',
  p_metadata: { test: true }
}

// 4. Check actual deployed signature if errors occur
// Error message will show expected parameters
```

---

## Common Errors & Solutions

### Error: "Could not find function"
**Cause**: Parameter names don't match deployed signature
**Solution**: Check deployed function signature via test script

```bash
node test-entity-upsert-rpc.js
# Shows which parameters work
```

### Error: "record v_existing_entity is not assigned yet"
**Cause**: Function bug checking NULL record's field
**Solution**: Use minimal parameters or fix function (IF FOUND pattern)

### Error: "organization_id is required"
**Cause**: Missing `p_organization_id` parameter
**Solution**: Always include `p_organization_id` in every RPC call

### Error: "Invalid smart code format"
**Cause**: Smart code doesn't match regex
**Solution**: Validate format: `HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.V1` (min 6 segments)

---

## Smart Code Catalog

### Entity Smart Codes
```typescript
// Product categories
'HERA.SALON.PROD.CATEGORY.FIELD.V1'
'HERA.REST.PROD.CATEGORY.MENU.V1'

// Products
'HERA.SALON.PROD.FIELD.DATA.V1'
'HERA.REST.PROD.MENU.ITEM.V1'

// Customers
'HERA.CRM.CUST.ENT.PROF.V1'
'HERA.SALON.CUST.PROFILE.V1'

// GL Accounts
'HERA.FIN.GL.ACC.TXN.POST.V1'
'HERA.FIN.GL.ACC.ASSET.CASH.V1'
```

### Transaction Smart Codes
```typescript
// Sales
'HERA.SALON.SVC.TXN.SERVICE.V1'
'HERA.REST.SALE.ORDER.V1'

// Inventory
'HERA.INV.RCV.TXN.IN.V1'
'HERA.INV.ISS.TXN.OUT.V1'

// Journal entries
'HERA.FIN.GL.TXN.JE.V1'
'HERA.FIN.AP.TXN.PAY.V1'
```

### Relationship Smart Codes
```typescript
// Status workflows
'HERA.WORKFLOW.STATUS.ASSIGN.V1'
'HERA.WORKFLOW.STATUS.CHANGE.V1'

// Hierarchies
'HERA.ORG.HIERARCHY.PARENT.V1'
'HERA.PROD.BOM.COMPONENT.V1'
```

---

## Migration Checklist

When deploying new RPC functions:

- [ ] Define exact parameter signature (names, types, order)
- [ ] Include `p_organization_id` validation
- [ ] Include `p_smart_code` validation (if applicable)
- [ ] Use `IF FOUND THEN` pattern for record checks
- [ ] Return consistent JSONB structure
- [ ] Add GRANT EXECUTE permissions
- [ ] Add function comments
- [ ] Create test script
- [ ] Document in this DNA file

---

## DNA Evolution

This DNA document evolves with HERA. When adding new RPC functions:

1. Update this document with signature and examples
2. Add to smart code catalog
3. Create test script in `/test-*-rpc.js`
4. Update CLAUDE.md with quick reference
5. Increment DNA version: `HERA.DNA.API.RPC.PATTERNS.V2`

---

**Last Validated**: 2025-10-01
**Validation Method**: Product category creation end-to-end test
**Success Rate**: 100% ✅
