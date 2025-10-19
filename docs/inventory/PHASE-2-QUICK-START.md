# Phase 2 Inventory Migration - Quick Start

## TL;DR

Migrate your salon inventory from Phase 1 (stock in product dynamic data) to Phase 2 (STOCK_LEVEL entities) in 3 steps.

## Prerequisites

- [ ] Node.js installed
- [ ] Environment variables set (`.env.local`)
- [ ] Organization ID available
- [ ] Database access (Supabase)

## 3-Step Migration

### 1️⃣ Run Migration Script

```bash
node scripts/migrate-to-stock-level-entities.mjs <YOUR_ORG_ID>
```

**Example:**
```bash
node scripts/migrate-to-stock-level-entities.mjs 550e8400-e29b-41d4-a716-446655440000
```

### 2️⃣ Verify in UI

Open: `http://localhost:3000/salon/inventory`

**Look for:**
- ✅ Green banner: "Phase 2: STOCK_LEVEL Entities (Enterprise-grade)"
- ✅ Stock levels display correctly
- ✅ Branch filtering works

### 3️⃣ Test Operations

- [x] View stock by branch
- [x] Adjust stock quantities
- [x] Check low stock alerts
- [x] Verify transaction audit trail

## What Changed?

### Before (Phase 1)
```typescript
// Stock stored in product entity
product.stock_quantity = 100
product.dynamic_data.stock_qty_branch1 = 50
```

### After (Phase 2)
```typescript
// Stock stored in STOCK_LEVEL entities
stockLevel.entity_type = 'STOCK_LEVEL'
stockLevel.quantity = 50
stockLevel.relationships.STOCK_OF_PRODUCT → product_id
stockLevel.relationships.STOCK_AT_LOCATION → branch_id
```

## Benefits

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| Entity per (product, branch) | ❌ | ✅ |
| Transaction audit trail | ❌ | ✅ |
| Fast branch queries | ❌ | ✅ |
| Stock movement history | ❌ | ✅ |
| HERA compliant | ⚠️ | ✅ |
| Multi-branch ready | ⚠️ | ✅ |

## Migration Output

```
✅ Migration Complete!
Products processed:      15
Branches found:          2
Stock levels created:    30
Errors:                  0
```

## Troubleshooting

**Issue: Still showing Phase 1**
```bash
# Check if STOCK_LEVEL entities exist
psql -c "SELECT COUNT(*) FROM core_entities WHERE entity_type = 'STOCK_LEVEL';"
```

**Issue: Stock quantities wrong**
- Verify products had `stock_quantity` before migration
- Check migration script output for errors
- Re-run migration (it won't create duplicates)

**Issue: Missing branches**
- Migration auto-creates "Main Branch" if none exist
- Add branches via `/salon/settings`
- Re-run migration for new branches

## Rollback

```sql
-- If you need to rollback
DELETE FROM core_entities
WHERE entity_type = 'STOCK_LEVEL'
  AND organization_id = '<org_id>';
```

## Full Documentation

See: `/docs/inventory/PHASE-2-MIGRATION-GUIDE.md`

## Support

- Migration logs: Check console output
- Design docs: `/docs/inventory/STOCK-LEVEL-ENTITY-DESIGN.md`
- Test first: Run on staging environment

---

**Ready to migrate? Run the script and watch the magic happen!** ✨
