# HERA Inventory Phase 2 Migration Guide

## Overview

This guide covers migrating from **Phase 1** (stock in product dynamic data) to **Phase 2** (STOCK_LEVEL entities) for enterprise-grade inventory management.

## What's Different?

### Phase 1 (Legacy)
```
Product Entity
├── dynamic_data
│   ├── stock_quantity: 100
│   ├── reorder_level: 10
│   ├── stock_qty_branch1: 50
│   └── stock_qty_branch2: 50
└── relationships
    └── STOCK_AT → [branch1, branch2]
```

**Issues:**
- ❌ Stock stored in product dynamic data
- ❌ Branch-specific stock in separate dynamic fields (`stock_qty_{branchId}`)
- ❌ No transaction audit trail
- ❌ Difficult to query stock by branch
- ❌ No stock movement history

### Phase 2 (Enterprise)
```
STOCK_LEVEL Entity (per product, per branch)
├── id: stock-level-uuid
├── entity_name: "Stock: Product A @ Branch 1"
├── dynamic_data
│   ├── quantity: 50
│   └── reorder_level: 10
└── relationships
    ├── STOCK_OF_PRODUCT → product_id
    └── STOCK_AT_LOCATION → branch_id

Transaction (for every stock change)
├── transaction_type: INV_ADJUSTMENT
├── lines
│   └── line_type: INVENTORY_MOVE
│       ├── quantity: +10
│       └── details: { movement_type, reason }
```

**Benefits:**
- ✅ One entity per (product, branch) - clean, queryable
- ✅ Proper relationships to product and branch
- ✅ Transaction-driven inventory (full audit trail)
- ✅ Fast queries with proper indexes
- ✅ Multi-branch ready out of the box
- ✅ HERA-compliant (Sacred Six tables)

## Migration Steps

### Step 1: Prepare Environment

Ensure you have the necessary environment variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MIGRATION_USER_ID=your_system_user_id  # Optional, defaults to system user
```

### Step 2: Get Organization ID

Find your organization ID:

```bash
# Option 1: From database
node mcp-server/hera-query.js organizations

# Option 2: From browser
# Go to /salon/inventory
# Open browser console
# Type: localStorage.getItem('currentOrganizationId')
```

### Step 3: Run Migration Script

```bash
# Make script executable
chmod +x scripts/migrate-to-stock-level-entities.mjs

# Run migration
node scripts/migrate-to-stock-level-entities.mjs <organization_id>

# Example
node scripts/migrate-to-stock-level-entities.mjs 550e8400-e29b-41d4-a716-446655440000
```

### Step 4: Verify Migration

The script will output:

```
🚀 Starting Phase 2 Migration: Stock Level Entities
============================================================
Organization ID: 550e8400-e29b-41d4-a716-446655440000
============================================================

📍 Step 1: Fetching branches...
✅ Found 2 branches
   - Main Branch (branch-id-1)
   - Second Branch (branch-id-2)

📦 Step 2: Fetching products with inventory...
✅ Found 15 products

🔄 Step 3: Creating STOCK_LEVEL entities...
   Processing: Shampoo X (Qty: 100)
      Has global stock, creating for all branches...
         Creating stock level for Main Branch...
         ✅ Created stock level: 100 units
         Creating stock level for Second Branch...
         ✅ Created stock level: 100 units

============================================================
✅ Migration Complete!
============================================================
Products processed:      15
Branches found:          2
Stock levels created:    30
Stock levels updated:    0
Errors:                  0
============================================================

✅ Migration completed successfully!

📋 Next steps:
   1. Test the inventory page at /salon/inventory
   2. Verify stock levels display correctly
   3. Test stock adjustments and movements
   4. Once verified, you can remove Phase 1 dynamic fields
```

### Step 5: Test the UI

1. **Open Inventory Page:**
   ```
   http://localhost:3000/salon/inventory
   ```

2. **Check Phase Indicator:**
   - You should see a green banner: "✅ Phase 2: STOCK_LEVEL Entities (Enterprise-grade)"
   - If you see orange banner, Phase 2 entities weren't detected

3. **Test Stock Operations:**
   - View stock levels per branch
   - Adjust stock quantities
   - Check low stock alerts
   - Verify transaction audit trail

## Rollback (If Needed)

If you need to rollback to Phase 1:

```sql
-- Delete all STOCK_LEVEL entities
DELETE FROM core_entities
WHERE organization_id = '<org_id>'
  AND entity_type = 'STOCK_LEVEL';

-- Delete related relationships
DELETE FROM core_relationships
WHERE organization_id = '<org_id>'
  AND smart_code IN (
    'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1',
    'HERA.SALON.INV.REL.STOCKATLOCATION.V1'
  );

-- Delete related transactions
DELETE FROM universal_transactions
WHERE organization_id = '<org_id>'
  AND smart_code LIKE 'HERA.SALON.INV.TXN.%';
```

## API Usage

### Phase 1 (Legacy)
```typescript
// Get product with stock
const { data } = await apiV2.get('entities', {
  entity_type: 'product',
  include_dynamic: true
})

// Access stock
const stockQty = data[0].stock_quantity
```

### Phase 2 (New)
```typescript
// Get stock levels for a product
const { data } = await apiV2.get('entities', {
  entity_type: 'STOCK_LEVEL',
  include_relationships: true,
  filter_rel: {
    STOCK_OF_PRODUCT: productId
  }
})

// Each result is a (product, branch) stock level
data.forEach(stockLevel => {
  console.log(stockLevel.quantity)
  console.log(stockLevel.reorder_level)
})
```

### Using the Unified Hook

The `useUnifiedInventory` hook automatically detects which phase you're on:

```typescript
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory'

const {
  items,              // Stock items (works for both phases)
  phase,              // 'phase1' | 'phase2' | 'checking'
  isLoading,
  refetch,
  // Phase 2 specific
  createStockLevel,
  adjustStock,
  incrementStock,
  decrementStock
} = useUnifiedInventory({
  organizationId,
  branchId
})

// Check which phase you're on
if (phase === 'phase2') {
  console.log('✅ Using enterprise-grade STOCK_LEVEL entities')
} else if (phase === 'phase1') {
  console.log('📦 Using legacy dynamic data')
}
```

## Migration Validation Checklist

- [ ] Migration script ran without errors
- [ ] Phase indicator shows "Phase 2" in UI
- [ ] All products have stock levels created
- [ ] Stock quantities match pre-migration values
- [ ] Branch filtering works correctly
- [ ] Stock adjustments create transactions
- [ ] Low stock alerts work
- [ ] Stock movements are tracked
- [ ] No duplicate STOCK_LEVEL entities
- [ ] Relationships are correctly linked

## Troubleshooting

### Issue: Phase indicator still shows Phase 1

**Solution:**
```typescript
// Check if STOCK_LEVEL entities exist
const { data } = await apiV2.get('entities', {
  organization_id: orgId,
  entity_type: 'STOCK_LEVEL',
  limit: 1
})

console.log('Stock levels found:', data?.length || 0)
```

### Issue: Stock quantities are zero

**Solution:**
- Check if products had `stock_quantity` in dynamic data before migration
- Re-run migration with verbose logging
- Verify dynamic data fields: `stock_qty_${branchId}`

### Issue: Duplicate stock levels created

**Solution:**
```sql
-- Find duplicates
SELECT
  from_entity_id,
  COUNT(*) as count
FROM core_relationships
WHERE smart_code = 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1'
GROUP BY from_entity_id
HAVING COUNT(*) > 1;

-- Delete duplicates (keep the first one)
-- Manual cleanup required based on results
```

### Issue: Missing branches

**Solution:**
- Migration script auto-creates a "Main Branch" if none exist
- Add branches via UI: `/salon/settings`
- Re-run migration to create stock levels for new branches

## Performance Considerations

### Indexes

The following indexes improve Phase 2 performance:

```sql
-- Fast STOCK_LEVEL lookups
CREATE INDEX idx_stock_level_product
ON core_relationships (organization_id, from_entity_id)
WHERE smart_code = 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1';

CREATE INDEX idx_stock_level_location
ON core_relationships (organization_id, from_entity_id)
WHERE smart_code = 'HERA.SALON.INV.REL.STOCKATLOCATION.V1';

-- Fast INVENTORY_MOVE queries
CREATE INDEX idx_txn_lines_inventory
ON universal_transaction_lines (organization_id, smart_code)
WHERE smart_code LIKE 'HERA.SALON.INV.LINE.%';
```

### Query Optimization

**❌ Bad (N+1 queries):**
```typescript
for (const product of products) {
  const stockLevels = await getStockLevels(product.id)
}
```

**✅ Good (single query):**
```typescript
const allStockLevels = await apiV2.get('entities', {
  entity_type: 'STOCK_LEVEL',
  include_relationships: true,
  limit: 500
})

// Group by product
const stockByProduct = groupBy(allStockLevels, 'product_id')
```

## Next Steps

After successful migration:

1. **Enable Transaction Tracking:**
   - Update POS to create INVENTORY_MOVE lines on sales
   - Update purchases to create INVENTORY_MOVE lines
   - Update transfers to create INVENTORY_MOVE lines

2. **Add Reporting:**
   - Stock movement reports
   - Inventory valuation by branch
   - Low stock trend analysis
   - COGS calculation from transactions

3. **Cleanup Legacy Data (Optional):**
   - Remove `stock_quantity` from product dynamic data
   - Remove `stock_qty_{branchId}` fields
   - Archive old stock adjustment records

4. **Enable Advanced Features:**
   - Stock transfers between branches
   - Physical stock counts
   - Automated reorder points
   - Supplier integration

## Support

For issues or questions:
- Check logs: `console.log` output during migration
- Review: `/docs/inventory/STOCK-LEVEL-ENTITY-DESIGN.md`
- Test: Run migration on staging first
- Validate: Use the checklist above

**Migration complete! You're now using enterprise-grade inventory management!** 🎉
