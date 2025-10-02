# HERA RPC Quick Reference Card

**One-Page Cheat Sheet for Universal API v2**

---

## Core Rules

```typescript
// ALWAYS include
p_organization_id: UUID  // Multi-tenant isolation
p_smart_code: string     // 6+ segments, uppercase .V1

// Smart code regex
^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$
```

---

## Entity Operations

### Create/Update Entity
```typescript
callRPC('hera_entity_upsert_v1', {
  p_organization_id: UUID,
  p_entity_type: string,
  p_entity_name: string,
  p_smart_code: string,
  p_entity_id: UUID | null,
  p_entity_code: string | null,
  p_metadata: JSONB | null
})
// Returns: entity_id as TEXT
```

### Read Entities
```typescript
callRPC('hera_entity_read_v1', {
  p_organization_id: UUID,
  p_entity_type?: string,
  p_entity_code?: string,
  p_smart_code?: string,
  p_include_dynamic_data?: boolean
})
// Returns: { success, data: [...], metadata: {...} }
```

### Delete Entity
```typescript
callRPC('hera_entity_delete_v1', {
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_hard_delete?: boolean,
  p_cascade?: boolean
})
```

---

## Dynamic Data (Custom Fields)

### Batch Set Fields
```typescript
callRPC('hera_dynamic_data_batch_v1', {
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_smart_code: string,
  p_fields: [{
    field_name: string,
    field_type: 'text'|'number'|'boolean'|'date'|'json',
    field_value: any,
    field_value_number?: number,
    field_value_text?: string,
    // ...
  }]
})
```

### Get Fields
```typescript
callRPC('hera_dynamic_data_get_v1', {
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_field_name?: string
})
```

---

## Relationships

### Create Relationship
```typescript
callRPC('hera_relationship_create_v1', {
  p_organization_id: UUID,
  p_from_entity_id: UUID,
  p_to_entity_id: UUID,
  p_relationship_type: string,
  p_smart_code?: string
})
```

### Query Relationships
```typescript
callRPC('hera_relationship_query_v1', {
  p_organization_id: UUID,
  p_entity_id?: UUID,
  p_side?: 'from'|'to'|'both',
  p_relationship_type?: string
})
```

---

## Transactions

### Create Transaction
```typescript
callRPC('hera_txn_create_v1', {
  p_header: {
    organization_id: UUID,
    transaction_type: string,
    smart_code: string,
    total_amount: number,
    // ...
  },
  p_lines: [{
    line_number: number,
    line_entity_id: UUID,
    quantity: number,
    unit_price: number,
    line_amount: number,
    smart_code: string
  }]
})
```

### Validate Transaction
```typescript
callRPC('hera_txn_validate_v1', {
  p_org_id: UUID,
  p_transaction_id: UUID
})
```

### Reverse Transaction
```typescript
callRPC('hera_txn_reverse_v1', {
  p_organization_id: UUID,
  p_transaction_id: UUID,
  p_reversal_date?: string,
  p_reason?: string
})
```

---

## Two-Step Pattern

**Standard: Entity + Dynamic Data**

```typescript
// Step 1: Create entity
const entityId = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'product_category',
  p_entity_name: 'Premium',
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

---

## Common Smart Codes

```typescript
// Entities
'HERA.SALON.PROD.CATEGORY.FIELD.V1'
'HERA.SALON.PROD.FIELD.DATA.V1'
'HERA.CRM.CUST.ENT.PROF.V1'
'HERA.FIN.GL.ACC.TXN.POST.V1'

// Transactions
'HERA.SALON.SVC.TXN.SERVICE.V1'
'HERA.REST.SALE.ORDER.V1'
'HERA.FIN.GL.TXN.JE.V1'

// Relationships
'HERA.WORKFLOW.STATUS.ASSIGN.V1'
'HERA.ORG.HIERARCHY.PARENT.V1'
```

---

## Error Handling

```typescript
const result = await callRPC('hera_entity_upsert_v1', params)

if (result.error) {
  // Check error code
  switch(result.error.code) {
    case 'HERA_ORG_REQUIRED':
      throw new Error('Organization ID required')
    case 'HERA_SMARTCODE_INVALID':
      throw new Error('Invalid smart code format')
    default:
      throw new Error(result.error.message)
  }
}

return result.data
```

---

## Debugging Quick Checks

```bash
# 1. Test deployed function
node test-entity-upsert-rpc.js

# 2. Check actual schema
node check-schema.js core_entities

# 3. Validate smart code
node -e "
const { guardSmartCode } = require('./src/lib/universal/guardrails')
guardSmartCode('HERA.SALON.PROD.CATEGORY.FIELD.V1')
console.log('✅ Valid')
"
```

---

## Field Placement

```typescript
// ✅ Business data → core_dynamic_data
color, price, category, description
→ Use hera_dynamic_data_batch_v1

// ✅ System metadata → p_metadata
ai_confidence, ai_classification
→ Include metadata_category: 'system_ai'

// ❌ Status → NEVER use columns
→ Use hera_relationship_create_v1 with status entity
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Could not find function" | Parameter mismatch | Check error hint for signature |
| "record not assigned" | Function bug | Use minimal params |
| "organization_id required" | Missing param | Always include p_organization_id |
| "Invalid smart code" | Format wrong | 6+ segments, uppercase .V1 |
| "Column does not exist" | Using removed column | Check actual schema |

---

## Production Checklist

- [ ] Include `p_organization_id`
- [ ] Validate smart code (6+ segments, .V1)
- [ ] Use two-step pattern (entity → dynamic)
- [ ] Handle `result.error` properly
- [ ] Test with deployed function
- [ ] Never use direct table access
- [ ] Business data → dynamic fields
- [ ] Status → relationships

---

**Version**: HERA.DNA.RPC.CHEAT.V1
**Last Updated**: 2025-10-01
**Full Guide**: `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`
