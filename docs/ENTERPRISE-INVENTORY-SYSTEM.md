# HERA Enterprise Inventory Management System

## Overview

A complete enterprise-grade inventory management system built on HERA's universal architecture, providing multi-branch stock tracking, automated movements, transfers, and comprehensive reporting.

## Architecture

### Core Principles

1. **Universal Data Model**: All inventory data stored in HERA's 6 sacred tables
2. **Branch-Specific Stock**: Each branch maintains independent stock levels
3. **Transaction-Based**: All movements tracked via `universal_transactions`
4. **Relationship-Driven**: `STOCK_AT` relationships link products to branches
5. **Dynamic Fields**: Stock quantities stored in `core_dynamic_data`

### Data Storage Strategy

```typescript
// Product Entity (core_entities)
{
  id: "product-uuid",
  entity_type: "product",
  entity_name: "Premium Shampoo",
  organization_id: "org-uuid"
}

// Branch Stock Levels (core_dynamic_data)
{
  entity_id: "product-uuid",
  field_name: "stock_qty_branch-uuid",
  field_value_number: 50,
  smart_code: "HERA.SALON.INV.BRANCH.STOCK.QTY.V1"
}

// Reorder Levels (core_dynamic_data)
{
  entity_id: "product-uuid",
  field_name: "reorder_level_branch-uuid",
  field_value_number: 10,
  smart_code: "HERA.SALON.INV.BRANCH.STOCK.REORDER.V1"
}

// Product-Branch Relationship (core_relationships)
{
  from_entity_id: "product-uuid",
  to_entity_id: "branch-uuid",
  relationship_type: "STOCK_AT",
  smart_code: "HERA.SALON.PRODUCT.REL.STOCK_AT.v1"
}

// Stock Movement (universal_transactions)
{
  transaction_type: "stock_movement",
  smart_code: "HERA.SALON.INV.MOV.SALE.V1",
  from_entity_id: "product-uuid",
  to_entity_id: "branch-uuid",
  total_amount: 150.00,
  metadata: {
    movement_type: "sale",
    quantity: 3,
    previous_quantity: 50,
    new_quantity: 47
  }
}
```

## Features

### 1. Multi-Branch Inventory Tracking

**Purpose**: Track separate stock levels for each branch

**Implementation**:
```typescript
import { getProductInventory, setBranchStock } from '@/lib/services/inventory-service'

// Get complete inventory across all branches
const inventory = await getProductInventory(organizationId, productId)

// Set stock for specific branch
await setBranchStock(organizationId, productId, branchId, {
  branch_id: branchId,
  quantity: 100,
  reorder_level: 20
})
```

**Features**:
- ✅ Real-time stock levels per branch
- ✅ Automatic status calculation (in stock, low stock, out of stock, overstock)
- ✅ Stock value calculation
- ✅ Visual progress indicators
- ✅ Quick adjustments (+/- buttons)

### 2. Stock Movements

**Purpose**: Track all inventory changes with complete audit trail

**Types of Movements**:
- `purchase` - Receiving stock from supplier
- `sale` - Stock sold to customer
- `transfer_out` / `transfer_in` - Inter-branch transfers
- `adjustment_in` / `adjustment_out` - Stock count adjustments
- `return_from_customer` / `return_to_supplier` - Returns
- `damage` / `expiry` / `sample` - Write-offs

**Implementation**:
```typescript
import { recordStockMovement, adjustStock } from '@/lib/services/inventory-service'

// Record stock movement
await recordStockMovement(organizationId, userId, {
  movement_type: 'sale',
  product_id: productId,
  branch_id: branchId,
  quantity: 5,
  unit_cost: 25.00,
  reference_id: saleTransactionId, // Link to sale
  reason: 'Customer purchase'
})

// Quick adjustment
await adjustStock(organizationId, userId, {
  product_id: productId,
  branch_id: branchId,
  adjustment_type: 'set', // or 'increase' / 'decrease'
  quantity: 100,
  reason: 'Physical stock count'
})
```

**Features**:
- ✅ Complete audit trail
- ✅ Automatic stock level updates
- ✅ Negative stock prevention
- ✅ Transaction linking (sale → stock movement)
- ✅ Smart code classification

### 3. Stock Transfers

**Purpose**: Move inventory between branches with workflow

**Implementation**:
```typescript
import { createStockTransfer, completeStockTransfer } from '@/lib/services/inventory-service'

// Create transfer request
const transfer = await createStockTransfer(organizationId, userId, {
  from_branch_id: sourceBranchId,
  to_branch_id: destinationBranchId,
  items: [
    { product_id: product1Id, quantity: 10 },
    { product_id: product2Id, quantity: 5 }
  ],
  notes: 'Restocking main branch'
})

// Complete transfer (execute stock movements)
await completeStockTransfer(organizationId, userId, transfer.id)
```

**Features**:
- ✅ Multi-product transfers
- ✅ Availability checking
- ✅ Transfer workflow (pending → in transit → completed)
- ✅ Automatic dual stock movements
- ✅ Transfer history tracking

### 4. Stock Alerts

**Purpose**: Automatic low stock notifications

**Implementation**:
```typescript
import { getStockAlerts } from '@/lib/services/inventory-service'

// Get all active alerts
const alerts = await getStockAlerts(organizationId)

// Get branch-specific alerts
const branchAlerts = await getStockAlerts(organizationId, branchId)
```

**Alert Types**:
- `low_stock` - Quantity ≤ reorder level (Warning)
- `out_of_stock` - Quantity = 0 (Critical)
- `overstock` - Quantity > reorder level × 3 (Info)

**Features**:
- ✅ Automatic alert creation on stock changes
- ✅ Severity levels (critical, warning, info)
- ✅ Acknowledgment system
- ✅ Per-branch alerts

### 5. Inventory Reports

**Purpose**: Business intelligence and analytics

**Implementation**:
```typescript
import { getInventoryValuation } from '@/lib/services/inventory-service'

// Organization-wide valuation
const report = await getInventoryValuation(organizationId)

// Branch-specific valuation
const branchReport = await getInventoryValuation(organizationId, branchId)
```

**Report Data**:
```typescript
{
  total_value: 125000.00,
  total_items: 5000,
  by_category: [
    { category: "Hair Products", value: 75000.00, count: 3000 },
    { category: "Skin Care", value: 50000.00, count: 2000 }
  ]
}
```

## UI Components

### BranchStockManager

**Purpose**: Enterprise UI for managing branch stock levels

**Location**: `/src/components/salon/products/BranchStockManager.tsx`

**Features**:
- Visual stock level cards with status indicators
- Inline editing of quantities and reorder levels
- Quick adjust buttons (+/-)
- Progress bars showing stock status
- Real-time value calculations
- Glassmorphic design

**Usage**:
```tsx
import { BranchStockManager } from '@/components/salon/products/BranchStockManager'

<BranchStockManager
  productId={productId}
  inventory={inventory}
  onStockUpdate={async (branchId, quantity, reorderLevel) => {
    await setBranchStock(organizationId, productId, branchId, {
      branch_id: branchId,
      quantity,
      reorder_level: reorderLevel
    })
  }}
  onQuickAdjust={async (branchId, type, amount) => {
    const currentQty = inventory.branch_stocks.find(bs => bs.branch_id === branchId)?.quantity || 0
    const newQty = type === 'increase' ? currentQty + amount : currentQty - amount
    await adjustStock(organizationId, userId, {
      product_id: productId,
      branch_id: branchId,
      adjustment_type: 'set',
      quantity: Math.max(0, newQty),
      reason: 'Quick adjustment'
    })
  }}
/>
```

### StockTransferDialog

**Purpose**: Create and manage stock transfers between branches

**Location**: `/src/components/salon/inventory/StockTransferDialog.tsx`

**Features**:
- Branch selection (from/to)
- Multi-product transfer builder
- Availability validation
- Real-time value calculation
- Transfer summary
- Notes support

**Usage**:
```tsx
import { StockTransferDialog } from '@/components/salon/inventory/StockTransferDialog'

<StockTransferDialog
  open={open}
  onClose={() => setOpen(false)}
  branches={branches}
  products={products}
  currentBranchId={branchId}
  onTransfer={async (data) => {
    await createStockTransfer(organizationId, userId, data)
  }}
/>
```

## Integration Guide

### 1. Update Product Hook

Add inventory management to `useHeraProducts`:

```typescript
// Add to useHeraProducts.ts
import { getProductInventory, setBranchStock } from '@/lib/services/inventory-service'

export function useHeraProducts(options) {
  // ... existing code ...

  const getInventory = async (productId: string) => {
    return getProductInventory(options.organizationId, productId)
  }

  const updateBranchStock = async (
    productId: string,
    branchId: string,
    quantity: number,
    reorderLevel: number
  ) => {
    await setBranchStock(options.organizationId, productId, branchId, {
      branch_id: branchId,
      quantity,
      reorder_level: reorderLevel
    })
    await refetch()
  }

  return {
    // ... existing exports ...
    getInventory,
    updateBranchStock
  }
}
```

### 2. Update ProductModal

Add inventory tab to product modal:

```tsx
// Add to ProductModal.tsx
import { BranchStockManager } from './BranchStockManager'
import { getProductInventory } from '@/lib/services/inventory-service'

function ProductModal({ product, ... }) {
  const [inventory, setInventory] = useState<ProductInventory | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'inventory'>('details')

  useEffect(() => {
    if (product && activeTab === 'inventory') {
      getProductInventory(organizationId, product.id)
        .then(setInventory)
    }
  }, [product, activeTab])

  return (
    <Dialog>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {/* Existing product form */}
        </TabsContent>

        <TabsContent value="inventory">
          {inventory && (
            <BranchStockManager
              productId={product.id}
              inventory={inventory}
              onStockUpdate={updateBranchStock}
            />
          )}
        </TabsContent>
      </Tabs>
    </Dialog>
  )
}
```

### 3. Link Sales to Inventory

Automatically update inventory when sales occur:

```typescript
// In POS or sales module
import { recordStockMovement } from '@/lib/services/inventory-service'

async function completeSale(saleData) {
  // Create sale transaction
  const sale = await createSaleTransaction(saleData)

  // Update inventory for each item
  for (const item of saleData.items) {
    await recordStockMovement(organizationId, userId, {
      movement_type: 'sale',
      product_id: item.product_id,
      branch_id: saleData.branch_id,
      quantity: item.quantity,
      unit_cost: item.cost_price,
      reference_id: sale.id,
      reason: `Sale #${sale.transaction_code}`
    })
  }
}
```

## Smart Codes Reference

All inventory operations use HERA smart codes for AI classification:

```typescript
// Stock Movements
HERA.SALON.INV.MOV.PURCHASE.V1      // Purchase from supplier
HERA.SALON.INV.MOV.SALE.V1          // Sale to customer
HERA.SALON.INV.MOV.TRANSFER.OUT.V1  // Transfer out
HERA.SALON.INV.MOV.TRANSFER.IN.V1   // Transfer in
HERA.SALON.INV.MOV.ADJUST.IN.V1     // Stock increase adjustment
HERA.SALON.INV.MOV.ADJUST.OUT.V1    // Stock decrease adjustment
HERA.SALON.INV.MOV.RETURN.CUSTOMER.V1  // Customer return
HERA.SALON.INV.MOV.RETURN.SUPPLIER.V1  // Return to supplier
HERA.SALON.INV.MOV.DAMAGE.V1        // Damaged stock
HERA.SALON.INV.MOV.EXPIRY.V1        // Expired stock
HERA.SALON.INV.MOV.SAMPLE.V1        // Sample usage

// Stock Transfers
HERA.SALON.INV.TRANSFER.V1          // Stock transfer

// Alerts
HERA.SALON.INV.ALERT.LOW.STOCK.V1   // Low stock alert
HERA.SALON.INV.ALERT.OUT.STOCK.V1   // Out of stock alert
HERA.SALON.INV.ALERT.OVERSTOCK.V1   // Overstock alert

// Branch Stock
HERA.SALON.INV.BRANCH.STOCK.QTY.V1     // Branch stock quantity
HERA.SALON.INV.BRANCH.STOCK.REORDER.V1 // Branch reorder level
```

## Benefits

### Business Value

- **Multi-Branch Management**: Independent stock levels per location
- **Real-Time Visibility**: Instant stock status across all branches
- **Automated Alerts**: Never run out of stock unexpectedly
- **Complete Audit Trail**: Every movement tracked and auditable
- **Cost Control**: Accurate inventory valuation
- **Efficient Transfers**: Streamlined inter-branch stock movements

### Technical Excellence

- **Zero Schema Changes**: Built on universal 6-table architecture
- **Scalable**: Handles unlimited products and branches
- **Type-Safe**: Full TypeScript coverage
- **Transaction-Based**: ACID compliance through universal transactions
- **AI-Ready**: Smart codes enable intelligent insights
- **Enterprise-Grade**: Production-ready with comprehensive error handling

## Future Enhancements

- [ ] Batch/Serial number tracking
- [ ] Expiry date management
- [ ] Automated reordering
- [ ] Supplier integration
- [ ] Advanced forecasting
- [ ] Mobile stock counting app
- [ ] Barcode scanning
- [ ] Multi-currency support
- [ ] Physical stock count workflows
- [ ] Cycle counting schedules

## Support

For questions or issues:
- Review this documentation
- Check `/src/types/inventory.ts` for complete type definitions
- See `/src/lib/services/inventory-service.ts` for implementation
- Reference component files for UI examples
