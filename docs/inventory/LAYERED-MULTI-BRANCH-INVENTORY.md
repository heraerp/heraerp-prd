# 🏗️ Layered Multi-Branch Inventory (HERA Way)

## 📋 Architecture Decision

Ship **Phase 1** (simple stock) now for UI compatibility, while implementing **Phase 2** (enterprise multi-branch) underneath. This allows seamless migration without breaking existing Products/POS functionality.

## ✅ Phase 1: SHIPPED (Simple Stock - Backward Compatible)

### What's Working Now:
1. **Single stock quantity** per product (`product.stock_quantity`)
2. **Inventory page** shows total stock across all branches
3. **Products page** remains unchanged
4. **POS** continues to work with existing stock model
5. **Inventory movements** emit transaction lines (Finance DNA ready)

### Implementation Status:

#### ✅ Inventory Service (`src/lib/services/inventory-service.ts`)
- Uses `product.stock_quantity` (single value)
- Emits universal transactions with inventory movement lines
- Creates transactions following header+lines pattern
- Finance DNA compatible (COGS/Inventory posting ready)

```typescript
// Current stock read path
const totalQuantity = product.stock_quantity || product.stock_level || 0

// Stock adjustment creates transaction with lines
await apiV2.post('transactions', {
  transaction_type: 'INV_MOVEMENT',
  smart_code: 'HERA.SALON.INV.TXN.ADJUST.V1',
  lines: [
    {
      line_type: 'INVENTORY_MOVE',
      smart_code: 'HERA.SALON.INV.LINE.MOVE.V1',
      quantity: -5, // Signed quantity (negative = decrease)
      details: {
        product_id: '...',
        from_location_id: branchId,
        movement_type: 'adjustment_out'
      }
    }
  ]
})
```

#### ✅ Inventory Page UI
- Displays total stock (backward compatible)
- Shows all branches with STOCK_AT relationships
- Branch stock manager works with current model
- Ready to switch to STOCK_LEVEL entities (Phase 2)

### Transaction Structure (Universal Pattern)

```typescript
{
  // Header (universal_transactions)
  "transaction_type": "INV_MOVEMENT",
  "smart_code": "HERA.SALON.INV.TXN.ADJUST.V1",
  "source_entity_id": "<product_id>",
  "target_entity_id": "<location_id>",
  "total_amount": 393.75,
  "business_context": {
    "movement_type": "adjustment_out",
    "location_id": "<branch_id>",
    "previous_quantity": 50,
    "new_quantity": 45
  },

  // Lines (universal_transaction_lines)
  "lines": [
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.MOVE.V1",
      "entity_id": "<product_id>",
      "quantity": -5, // Signed (negative = consumption)
      "unit_amount": 78.75,
      "line_amount": -393.75,
      "details": {
        "product_id": "<product_id>",
        "from_location_id": "<branch_id>",
        "to_location_id": null,
        "quantity": 5,
        "movement_type": "adjustment_out"
      }
    }
  ]
}
```

## 🔄 Phase 2: READY FOR IMPLEMENTATION (Enterprise Multi-Branch)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     READ PATH (Materialized View)                │
│  GET /api/v2/entities?entity_type=STOCK_LEVEL                   │
│    → Returns current stock per (product, location)               │
└─────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ Derived from
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                WRITE PATH (Source of Truth)                      │
│  POST /api/v2/transactions (INV_MOVEMENT)                       │
│    → Creates transaction with inventory movement lines           │
│    → Atomically updates STOCK_LEVEL entities                    │
│    → Finance DNA consumes for GL posting                        │
└─────────────────────────────────────────────────────────────────┘
```

### Entity Model

#### STOCK_LEVEL Entity
```typescript
{
  entity_type: 'STOCK_LEVEL',
  entity_name: 'Stock: Product X @ Location Y',
  smart_code: 'HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1',

  // Dynamic fields
  quantity: 50,
  reorder_level: 10,
  last_counted_at: '2025-01-15',
  last_counted_by: 'user-uuid',

  // Relationships
  relationships: {
    STOCK_OF_PRODUCT: [{ to_entity_id: '<product_id>' }],
    STOCK_AT_LOCATION: [{ to_entity_id: '<location_id>' }]
  }
}
```

### Preset Location
File created: `src/hooks/entityPresets/stockLevel.preset.ts`

### Transaction Types (All use same pattern)

#### 1. RECEIVE (Purchase/GRN)
```typescript
POST /api/v2/transactions
{
  "transaction_type": "INV_RECEIVE",
  "smart_code": "HERA.SALON.INV.TXN.RECEIVE.V1",
  "lines": [{
    "line_type": "INVENTORY_MOVE",
    "smart_code": "HERA.SALON.INV.LINE.RECEIVE.V1",
    "quantity": 100, // Positive = increase
    "details": {
      "to_location_id": "<branch>",
      "supplier_id": "..."
    }
  }]
}
```

#### 2. CONSUME (POS Sale/Manufacturing)
```typescript
POST /api/v2/transactions
{
  "transaction_type": "SALE",
  "smart_code": "HERA.SALON.POS.TXN.SALE.V1",
  "lines": [
    { "line_type": "ITEM", "quantity": 1, "unit_amount": 25 },
    { "line_type": "PAYMENT", "line_amount": 25 },
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.CONSUME.V1",
      "quantity": -1, // Negative = decrease
      "details": {
        "from_location_id": "<pos_branch>",
        "movement_type": "sale"
      }
    }
  ]
}
```

#### 3. TRANSFER (Branch → Branch)
```typescript
POST /api/v2/transactions
{
  "transaction_type": "INV_TRANSFER",
  "smart_code": "HERA.SALON.INV.TXN.TRANSFER.V1",
  "lines": [
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.MOVE.OUT.V1",
      "quantity": -5,
      "details": { "from_location_id": "<A>", "to_location_id": null }
    },
    {
      "line_type": "INVENTORY_MOVE",
      "smart_code": "HERA.SALON.INV.LINE.MOVE.IN.V1",
      "quantity": 5,
      "details": { "from_location_id": null, "to_location_id": "<B>" }
    }
  ]
}
```

#### 4. ADJUST (Manual Correction)
```typescript
POST /api/v2/transactions
{
  "transaction_type": "INV_ADJUST",
  "smart_code": "HERA.SALON.INV.TXN.ADJUST.V1",
  "lines": [{
    "line_type": "INVENTORY_MOVE",
    "smart_code": "HERA.SALON.INV.LINE.ADJUST.V1",
    "quantity": 3, // Can be + or -
    "details": {
      "to_location_id": "<branch>",
      "reason": "Physical count correction"
    }
  }]
}
```

### Implementation Steps

#### Step 1: POS Location Context
```typescript
// Add to POS session
const posSession = {
  pos_id: 'FRONTDESK-1',
  location_id: '<active_branch_id>', // ✅ This is the key addition
  cashier_id: '<user_id>'
}
```

#### Step 2: Emit Inventory Lines on Checkout
```typescript
// In POS checkout handler
const saleTransaction = {
  transaction_type: 'SALE',
  lines: [
    ...cartItems.map(item => ({
      line_type: 'ITEM',
      entity_id: item.product_id,
      quantity: item.quantity,
      unit_amount: item.price
    })),

    // ✅ Add inventory consumption lines
    ...cartItems.filter(item => item.requires_inventory).map(item => ({
      line_type: 'INVENTORY_MOVE',
      smart_code: 'HERA.SALON.INV.LINE.CONSUME.V1',
      entity_id: item.product_id,
      quantity: -item.quantity, // Negative = decrease
      details: {
        product_id: item.product_id,
        from_location_id: posSession.location_id,
        movement_type: 'sale'
      }
    })),

    ...paymentLines
  ]
}
```

#### Step 3: Create STOCK_LEVEL Entities
```typescript
import { createStockLevel } from '@/hooks/entityPresets/stockLevel.preset'

// For each (product, location) pair
await createStockLevel({
  organization_id: orgId,
  product_id: productId,
  location_id: branchId,
  quantity: 50,
  reorder_level: 10
})
```

#### Step 4: Query STOCK_LEVEL Entities
```typescript
import { getStockLevelsByProduct } from '@/hooks/entityPresets/stockLevel.preset'

// Get stock across all locations for a product
const stockLevels = await getStockLevelsByProduct(orgId, productId)

// Display in UI
stockLevels.forEach(sl => {
  console.log(`Branch: ${sl.location_name}, Qty: ${sl.quantity}`)
})
```

#### Step 5: Update Inventory Service (Phase 2 Mode)
```typescript
// In getProductInventory()
// Replace Phase 1 logic with:
const stockLevels = await getStockLevelsByProduct(organizationId, productId)

const branchStocks = stockLevels.map(sl => ({
  branch_id: sl.location_id,
  branch_name: sl.location_name,
  quantity: sl.quantity,
  reorder_level: sl.reorder_level,
  status: getStockStatus(sl.quantity, sl.reorder_level)
}))
```

### Migration Strategy (Zero Downtime)

#### Option A: Feature Flag
```typescript
const USE_STOCK_LEVEL_ENTITIES = process.env.NEXT_PUBLIC_USE_STOCK_LEVELS === 'true'

async function getProductInventory(orgId: string, productId: string) {
  if (USE_STOCK_LEVEL_ENTITIES) {
    // Phase 2: Query STOCK_LEVEL entities
    return getFromStockLevels(orgId, productId)
  } else {
    // Phase 1: Query product.stock_quantity
    return getFromProduct(orgId, productId)
  }
}
```

#### Option B: Gradual Rollout
1. **Week 1**: Start emitting inventory movement lines (already done ✅)
2. **Week 2**: Backfill STOCK_LEVEL entities from current stock
3. **Week 3**: Enable STOCK_LEVEL reads for new products only
4. **Week 4**: Enable for all products, deprecate product.stock_quantity

### Finance DNA Integration

Once inventory movements are in transactions with lines:

```typescript
// Finance DNA posting rule
{
  "rule_name": "inventory_consumption",
  "match": {
    "line_type": "INVENTORY_MOVE",
    "details.movement_type": "sale"
  },
  "postings": [
    {
      "account": "5000", // COGS
      "side": "DR",
      "amount": "line.quantity * product.cost_price"
    },
    {
      "account": "1400", // Inventory
      "side": "CR",
      "amount": "line.quantity * product.cost_price"
    }
  ]
}
```

## 🎯 Summary

### Phase 1 (✅ COMPLETE)
- Simple stock model (`product.stock_quantity`)
- Universal transactions with inventory lines
- Finance DNA ready
- Zero breaking changes

### Phase 2 (🔄 READY TO IMPLEMENT)
- STOCK_LEVEL entities per (product, location)
- Preset created: `stockLevel.preset.ts`
- Transaction types defined
- Migration path planned
- Feature flag strategy ready

### Phase 1 Completion Status

✅ **COMPLETED**:
1. ✅ POS `branch_id` context in checkout flow (`src/app/salon/pos/page.tsx:956-957`)
2. ✅ Inventory movement lines emitted on POS checkout (`src/hooks/usePosCheckout.ts:178-198`)
3. ✅ Product stock automatically reduced on sale (`src/hooks/usePosCheckout.ts:377-429`)
4. ✅ Transaction audit trail with branch tracking
5. ✅ Finance DNA compatible structure

**How It Works Now (Phase 1)**:
- POS captures branch context during checkout
- For each product sold, creates:
  1. Product sale line (revenue)
  2. Inventory movement line (consumption tracking)
  3. Stock update (reduces product.stock_quantity)
- Full audit trail for Finance DNA
- Backward compatible with existing Products/Inventory pages

**Test the System**:
1. Navigate to `/salon/pos`
2. Select a branch
3. Add products to cart
4. Complete checkout
5. Verify stock reduced in `/salon/inventory`
6. Check transaction includes INVENTORY_MOVE lines

### Next Steps (Phase 2)
1. Create initial STOCK_LEVEL entities per (product, location)
2. Enable feature flag for STOCK_LEVEL reads
3. Update queries to read from STOCK_LEVEL instead of product.stock_quantity
4. Build materialized view for branch stock aggregation
5. Migrate gradually with zero downtime

## 📚 Related Files
- Inventory Service: `/src/lib/services/inventory-service.ts`
- STOCK_LEVEL Preset: `/src/hooks/entityPresets/stockLevel.preset.ts`
- Inventory Page: `/src/app/salon/inventory/page.tsx`
- Transaction Types: `/src/types/inventory.ts`

## 🔗 HERA Principles Followed
- ✅ Universal API v2 only
- ✅ Header+lines transaction pattern
- ✅ Sacred Six tables (no schema changes)
- ✅ Smart codes everywhere
- ✅ Organization isolation (RLS)
- ✅ Finance DNA compatible
- ✅ Zero downtime migration
- ✅ Backward compatible
