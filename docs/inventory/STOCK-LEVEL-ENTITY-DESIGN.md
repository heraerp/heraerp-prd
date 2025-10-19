# HERA STOCK_LEVEL Entity Design

## Architecture Overview

**One STOCK_LEVEL entity per (product, branch)** - Clean, queryable, and fully HERA-compliant.

## Smart Code Architecture

### Entity Smart Code
```
HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1
```

### Dynamic Field Smart Codes
```
quantity         → HERA.SALON.INV.DYN.QTY.V1
reorder_level    → HERA.SALON.INV.DYN.REORDER.V1
last_counted_at  → HERA.SALON.INV.DYN.LAST_COUNT.V1
```

### Relationship Smart Codes
```
STOCK_OF_PRODUCT    → HERA.SALON.INV.REL.STOCK_OF_PRODUCT.V1
STOCK_AT_LOCATION   → HERA.SALON.INV.REL.STOCK_AT_LOCATION.V1
```

### Transaction Line Smart Codes
```
INVENTORY_MOVE (receive)   → HERA.SALON.INV.LINE.RECEIPT.V1
INVENTORY_MOVE (consume)   → HERA.SALON.INV.LINE.CONSUME.V1
INVENTORY_MOVE (out)       → HERA.SALON.INV.LINE.MOVE.OUT.V1
INVENTORY_MOVE (in)        → HERA.SALON.INV.LINE.MOVE.IN.V1
INVENTORY_MOVE (adjust+)   → HERA.SALON.INV.LINE.ADJUST.IN.V1
INVENTORY_MOVE (adjust-)   → HERA.SALON.INV.LINE.ADJUST.OUT.V1
```

## API Patterns

### 1. Create/Update STOCK_LEVEL

```typescript
POST /api/v2/entities
{
  "organization_id": "<ORG_ID>",
  "entity_type": "STOCK_LEVEL",
  "entity_name": "Stock • Shampoo X • Branch A",
  "smart_code": "HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1",
  "dynamic_fields": {
    "quantity": {
      "value": 50,
      "type": "number",
      "smart_code": "HERA.SALON.INV.DYN.QTY.V1"
    },
    "reorder_level": {
      "value": 10,
      "type": "number",
      "smart_code": "HERA.SALON.INV.DYN.REORDER.V1"
    }
  },
  "metadata_relationships": {
    "STOCK_OF_PRODUCT": ["<PRODUCT_ID>"],
    "STOCK_AT_LOCATION": ["<BRANCH_ID>"]
  }
}
```

### 2. Read Stock Levels

**Get all stock for a product:**
```typescript
GET /api/v2/entities?entity_type=STOCK_LEVEL
  &include_dynamic=true
  &include_relationships=true
  &filter_rel[STOCK_OF_PRODUCT]=<PRODUCT_ID>
  &organization_id=<ORG_ID>
```

**Get stock for product at specific branch:**
```typescript
GET /api/v2/entities?entity_type=STOCK_LEVEL
  &include_dynamic=true
  &include_relationships=true
  &filter_rel[STOCK_OF_PRODUCT]=<PRODUCT_ID>
  &filter_rel[STOCK_AT_LOCATION]=<BRANCH_ID>
  &organization_id=<ORG_ID>
  &limit=1
```

### 3. Transaction-Driven Inventory

**All stock changes MUST come from transactions (source of truth)**

#### A) Purchase Receipt (increment)
```typescript
POST /api/v2/transactions
{
  "organization_id": "<ORG_ID>",
  "transaction_type": "PURCHASE_RECEIPT",
  "smart_code": "HERA.SALON.INV.TXN.RECEIPT.V1",
  "business_context": {
    "supplier_ref": "PO-10023",
    "receipt_number": "RCP-2024-001"
  },
  "lines": [
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.RECEIPT.V1",
      "line_number": 1,
      "quantity": 100,
      "unit_amount": 15.50,
      "line_amount": 1550.00,
      "details": {
        "product_id": "<PROD>",
        "to_location_id": "<BRANCH_A>",
        "quantity": 100,
        "movement_type": "purchase"
      }
    }
  ]
}
```

#### B) POS Sale (decrement)
```typescript
POST /api/v2/transactions
{
  "organization_id": "<ORG_ID>",
  "transaction_type": "SALE",
  "smart_code": "HERA.SALON.POS.TXN.SALE.V1",
  "lines": [
    // Service line
    {
      "line_type": "SERVICE",
      "smart_code": "HERA.SALON.POS.LINE.SERVICE.V1",
      "line_number": 1,
      "quantity": 1,
      "unit_amount": 150.00,
      "line_amount": 150.00
    },
    // Product consumption line
    {
      "line_type": "PRODUCT",
      "smart_code": "HERA.SALON.POS.LINE.PRODUCT.V1",
      "line_number": 2,
      "quantity": 1,
      "unit_amount": 45.00,
      "line_amount": 45.00
    },
    // INVENTORY MOVE (consume stock)
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.CONSUME.V1",
      "line_number": 3,
      "quantity": 1,
      "unit_amount": 0,
      "line_amount": 0,
      "details": {
        "product_id": "<PROD>",
        "from_location_id": "<BRANCH_ACTIVE>",
        "quantity": 1,
        "movement_type": "sale"
      }
    }
  ]
}
```

#### C) Branch Transfer (A → B)
```typescript
POST /api/v2/transactions
{
  "organization_id": "<ORG_ID>",
  "transaction_type": "INV_TRANSFER",
  "smart_code": "HERA.SALON.INV.TXN.TRANSFER.V1",
  "business_context": {
    "transfer_number": "TRF-2024-001",
    "requested_by": "<USER_ID>"
  },
  "lines": [
    // Outbound from Branch A
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.MOVE.OUT.V1",
      "line_number": 1,
      "quantity": 5,
      "unit_amount": 15.50,
      "line_amount": 77.50,
      "details": {
        "product_id": "<PROD>",
        "from_location_id": "<BRANCH_A>",
        "quantity": 5,
        "movement_type": "transfer_out"
      }
    },
    // Inbound to Branch B
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.MOVE.IN.V1",
      "line_number": 2,
      "quantity": 5,
      "unit_amount": 15.50,
      "line_amount": 77.50,
      "details": {
        "product_id": "<PROD>",
        "to_location_id": "<BRANCH_B>",
        "quantity": 5,
        "movement_type": "transfer_in"
      }
    }
  ]
}
```

#### D) Stock Adjustment
```typescript
POST /api/v2/transactions
{
  "organization_id": "<ORG_ID>",
  "transaction_type": "INV_ADJUSTMENT",
  "smart_code": "HERA.SALON.INV.TXN.ADJUST.V1",
  "business_context": {
    "adjustment_reason": "Physical count variance",
    "approved_by": "<MANAGER_ID>"
  },
  "lines": [
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.ADJUST.IN.V1",
      "line_number": 1,
      "quantity": 3,
      "unit_amount": 15.50,
      "line_amount": 46.50,
      "details": {
        "product_id": "<PROD>",
        "to_location_id": "<BRANCH_A>",
        "quantity": 3,
        "movement_type": "adjustment_in",
        "reason": "Found in back storage"
      }
    }
  ]
}
```

## Materialization Strategy

### Option 1: Derived Read (No Write)
- Compute stock per (product, branch) by summing INVENTORY_MOVE lines
- Fast with proper indexes and caching
- Always accurate, no sync issues

### Option 2: Materialized Entity (Recommended)
- After each transaction, playbook step upserts STOCK_LEVEL entity
- Set quantity to new total (recalculated from movements)
- Blazing fast reads, transactions remain source of truth

**Recommended**: Start with Option 2 for better UX performance.

## Uniqueness Enforcement

**Business Rule**: One STOCK_LEVEL per (product_id, branch_id)

### Playbook Guard
```typescript
// Before upsert, check for existing STOCK_LEVEL
const existing = await getEntities({
  entity_type: 'STOCK_LEVEL',
  filter_rel: {
    STOCK_OF_PRODUCT: productId,
    STOCK_AT_LOCATION: branchId
  },
  organization_id: orgId
})

if (existing.length > 0 && existing[0].id !== stock_level_id) {
  throw new Error('STOCK_LEVEL already exists for this product/branch')
}
```

### Optional Index (Performance)
```sql
-- Speed up uniqueness checks
CREATE INDEX idx_stock_level_uniqueness
ON core_relationships (organization_id, from_entity_id, to_entity_id)
WHERE smart_code IN (
  'HERA.SALON.INV.REL.STOCK_OF_PRODUCT.V1',
  'HERA.SALON.INV.REL.STOCK_AT_LOCATION.V1'
);
```

## Concurrency & Safety

### Rules
1. **Optimistic Updates**: Recalculate from movements, then write
2. **No Negatives**: Block quantity < 0 unless manager override
3. **Permissions**: Restrict INV_ADJUST and INV_TRANSFER by role
4. **Atomic**: All stock changes via transactions (atomic by design)

### Validation Playbook
```typescript
// Before allowing adjustment
if (new_quantity < 0 && !hasRole(user, 'manager')) {
  throw new Error('Cannot set negative stock without manager approval')
}
```

## Migration from Legacy (Dynamic Fields)

### Phase 1: Seed STOCK_LEVEL entities
```typescript
// For each product with stock
const products = await getProducts()

for (const product of products) {
  // Get all branches with stock
  const branches = await getBranches()

  for (const branch of branches) {
    // Read legacy dynamic field
    const stockQty = await getDynamicData(orgId, {
      entity_id: product.id,
      field_name: `stock_qty_${branch.id}`
    })

    if (stockQty && stockQty > 0) {
      // Create STOCK_LEVEL entity
      await createStockLevel({
        product_id: product.id,
        branch_id: branch.id,
        quantity: stockQty,
        reorder_level: 10
      })
    }
  }
}
```

### Phase 2: Enable Transaction Lines
- Add INVENTORY_MOVE lines to POS sales
- Add INVENTORY_MOVE lines to purchases
- Add INVENTORY_MOVE lines to transfers

### Phase 3: Turn on Materialization
- After each transaction, update STOCK_LEVEL entities
- Keep transactions as source of truth

### Phase 4: Feature Flag Flip
- Update UI to read from STOCK_LEVEL entities
- Keep "Total Stock" as sum across branches
- Deprecate dynamic fields approach

## Performance Indexes

```sql
-- Fast STOCK_LEVEL lookups
CREATE INDEX idx_stock_level_product
ON core_relationships (organization_id, from_entity_id)
WHERE smart_code = 'HERA.SALON.INV.REL.STOCK_OF_PRODUCT.V1';

CREATE INDEX idx_stock_level_location
ON core_relationships (organization_id, from_entity_id)
WHERE smart_code = 'HERA.SALON.INV.REL.STOCK_AT_LOCATION.V1';

-- Fast INVENTORY_MOVE queries
CREATE INDEX idx_txn_lines_inventory
ON universal_transaction_lines (organization_id, smart_code)
WHERE smart_code LIKE 'HERA.SALON.INV.LINE.%';

-- GIN on line_data for product/location lookups
-- Already exists from HERA DB Performance Upgrades (C-F)
```

## Benefits

### 1. Cleaner Data Model
- Each stock level is a queryable entity
- No dynamic field naming gymnastics (`stock_qty_{branchId}`)
- Standard relationships for product and location

### 2. Better Performance
- Materialized reads are instant (no calculation needed)
- Proper indexes on relationships
- GIN indexes on JSONB for complex queries

### 3. Transaction Audit Trail
- Every stock change has a transaction
- Full audit history
- Finance integration ready (COGS, Inventory GL)

### 4. Multi-Branch Ready
- Natural model for multi-location
- Easy to add branch-specific rules
- Transfer tracking built-in

### 5. HERA Compliant
- Uses Sacred Six (no schema changes)
- Universal API v2 patterns
- Playbook guardrails
- Smart code everywhere

## Next Steps

1. ✅ Create enhanced `inventory.ts` types with STOCK_LEVEL
2. ✅ Update `inventory-service.ts` to use STOCK_LEVEL entities
3. ✅ Add transaction line support for INVENTORY_MOVE
4. ✅ Create migration script for legacy data
5. ✅ Update UI to read from STOCK_LEVEL
6. ✅ Add playbook validation rules

**This design gives you enterprise-grade inventory while staying 100% HERA-compliant!**
