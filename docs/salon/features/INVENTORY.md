# HERA Salon - Inventory Feature Guide

**Version**: 0.5 (DRAFT - UNDER ACTIVE DEVELOPMENT)
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.INVENTORY.v1`

> **⚠️ DRAFT NOTICE**: This feature is currently under active development. Documentation will be updated upon completion.

---

## 🚧 Development Status

### Current Phase: Phase 2 (Stock Level Entities)

**What's Implemented**:
- ✅ useHeraStockLevels hook (515 lines) - Stock level entity management
- ✅ useUnifiedInventory hook (146 lines) - Phase detection and migration support
- ✅ Stock level entities (STOCK_LEVEL entity type)
- ✅ Transaction-driven stock movements with audit trail
- ✅ Multi-branch stock tracking via relationships (STOCK_AT_LOCATION)
- ✅ Product-location relationship mapping (STOCK_OF_PRODUCT)
- ✅ Phase 1.1 pricing fields (cost_price, selling_price in dynamic_data)

**In Progress**:
- 🚧 Inventory movements UI refinement
- 🚧 Purchase order integration
- 🚧 Supplier management
- 🚧 Stock valuation reports
- 🚧 Barcode scanning for stock takes

---

## 🎯 Architectural Overview

### Phase 1 vs Phase 2

**Phase 1 (Legacy)**:
- Stock stored as `product.stock_quantity` dynamic field
- No branch-specific tracking
- Simple inventory management

**Phase 2 (Current)**:
- Stock stored as `STOCK_LEVEL` entities
- Branch-specific stock tracking
- Product-location relationships
- Transaction audit trail
- Cost/price tracking per location

### Data Model

```
STOCK_LEVEL Entity
├── Core Fields
│   ├── entity_type = 'STOCK_LEVEL'
│   ├── entity_name = "Stock: {PRODUCT_NAME} @ {LOCATION_NAME}"
│   └── smart_code = 'HERA.SALON.INV.ENTITY.STOCKLEVEL.v1'
│
├── Dynamic Fields
│   ├── quantity (number)
│   ├── reorder_level (number)
│   ├── cost_price (number) - Phase 1.1
│   ├── selling_price (number) - Phase 1.1
│   ├── last_counted_at (date)
│   └── last_counted_by (text)
│
└── Relationships
    ├── STOCK_OF_PRODUCT → Product entity
    └── STOCK_AT_LOCATION → Branch entity
```

**File Path**: `/src/hooks/useHeraStockLevels.ts:14-41`

---

## 🔑 Key Hooks

### useHeraStockLevels

**File**: `/src/hooks/useHeraStockLevels.ts` (515 lines)

**Purpose**: Manage stock level entities with transaction-driven adjustments

**Key Features**:
- Create/update stock levels per product-location
- Automatic stock status calculation (in_stock, low_stock, out_of_stock)
- Transaction audit trail for all stock movements
- Product and location name enrichment from relationships

**File Path**: `/src/hooks/useHeraStockLevels.ts:79`

### useUnifiedInventory

**File**: `/src/hooks/useUnifiedInventory.ts` (146 lines)

**Purpose**: Automatic phase detection and seamless migration support

**How It Works**:
1. Check if STOCK_LEVEL entities exist
2. If yes → Use Phase 2 (useHeraStockLevels)
3. If no → Use Phase 1 (legacy product.stock_quantity)
4. Return unified interface for both phases

**File Path**: `/src/hooks/useUnifiedInventory.ts:25`

---

## 📋 Transaction-Driven Stock Management

### Movement Types

```typescript
type MovementType =
  | 'adjust_in'      // Manual increase
  | 'adjust_out'     // Manual decrease
  | 'receive'        // Purchase order receipt
  | 'transfer_in'    // From another branch
  | 'transfer_out'   // To another branch
  | 'sale'           // POS transaction
```

### Adjustment with Audit Trail

```typescript
const { adjustStock } = useHeraStockLevels({ organizationId })

await adjustStock({
  stock_level_id: 'stock-uuid',
  product_id: 'product-uuid',
  location_id: 'branch-uuid',
  movement: {
    movement_type: 'adjust_in',
    quantity: 10,
    reason: 'Stock count correction',
    reference: 'SC-2025-001'
  },
  current_quantity: 50
})

// Result:
// 1. Creates INV_ADJUSTMENT transaction with line item
// 2. Updates stock level quantity to 60
// 3. Complete audit trail preserved
```

**File Path**: `/src/hooks/useHeraStockLevels.ts:414-470`

---

## 🏗️ Page Structure

**File**: `/src/app/salon/inventory/page.tsx` (1,100+ lines)

**Key Sections**:
1. **Summary Cards**: Total items, total value, low stock, out of stock
2. **Items Tab**: List of stock levels with manage buttons
3. **Movements Tab**: Transaction history with audit trail
4. **Valuation Tab**: Total inventory value calculations
5. **Branch Filter**: Multi-branch stock tracking
6. **Deep Links**: Filter by product and branch from Products page

**File Path**: `/src/app/salon/inventory/page.tsx:107`

---

## 📝 TODO: Pending Documentation

Once inventory feature is complete, document:

- [ ] Purchase order workflow
- [ ] Supplier management
- [ ] Stock transfer between branches
- [ ] Stock valuation methods (FIFO, LIFO, Weighted Average)
- [ ] Physical stock count process
- [ ] Barcode scanning for stock takes
- [ ] Inventory reports and analytics
- [ ] Reorder point automation
- [ ] Low stock alerts and notifications
- [ ] Integration with Finance module (COGS posting)

---

## 🔗 Related Documentation

### Feature Documentation
- [PRODUCTS.md](./PRODUCTS.md) - Product catalog with inventory integration
- [POINT-OF-SALE.md](./POINT-OF-SALE.md) - POS inventory deduction

### Technical Reference
- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema

---

## 📌 Notes for Future Updates

**When completing inventory documentation, include**:
1. Complete movement workflow diagrams
2. Purchase order entity structure
3. Supplier entity relationships
4. Stock transfer transaction patterns
5. Finance integration (GL posting for COGS)
6. Reorder point calculation logic
7. Stock valuation algorithms
8. Physical count variance handling

**Key Files to Document**:
- `/src/components/salon/inventory/InventoryMovementModal.tsx`
- `/src/hooks/useHeraStockMovements.ts`
- `/src/lib/services/inventory-service.ts`
- `/src/services/inventory-posting-processor.ts`
- `/src/services/inventory-finance-integration.ts`

---

<div align="center">

**Built with HERA DNA** | **Inventory Module v0.5 (DRAFT)** | **Under Development**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Products →](./PRODUCTS.md)

**⚠️ This documentation will be updated once inventory feature development is complete**

</div>
