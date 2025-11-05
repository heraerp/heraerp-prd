# 🏪 HERA Salon Inventory & Purchase Order Implementation Checklist

**Branch:** `salon-PO-upgrade`
**Started:** 2025-11-05
**Status:** 🚧 In Progress

---

## 📋 Project Overview

Transform the salon inventory system into enterprise-grade inventory management with:
- ✅ Product-Inventory mapping with manual updates
- 🔄 Automatic low-stock detection
- 📦 Purchase Order generation from low stock
- 🚚 Automatic inventory updates when PO is delivered
- 📊 Complete audit trail and reporting

---

## 🏗️ Current Architecture Analysis

### ✅ What We Have (Phase 2 Architecture)

#### Entities & Relationships
- ✅ `PRODUCT` entities - Master product catalog
- ✅ `STOCK_LEVEL` entities - Inventory tracking per product per branch
- ✅ `STOCK_OF_PRODUCT` relationship - Links stock to product
- ✅ `STOCK_AT_LOCATION` relationship - Links stock to branch
- ✅ Multi-branch support via `useBranchFilter`

#### Hooks & Services
- ✅ `useStockLevels` - Fetches and manages STOCK_LEVEL entities
- ✅ `useHeraStockMovements` - Transaction-based audit trail
- ✅ Manual adjustments: `adjustStock`, `incrementStock`, `decrementStock`
- ✅ Stock movements tracked via transactions

#### UI Components
- ✅ `/salon/inventory/page.tsx` - Main inventory management page
- ✅ `BranchStockManager` - Branch-specific stock management
- ✅ Stock status badges (in_stock, low_stock, out_of_stock)
- ✅ Real-time inventory display

#### Purchase Order System
- ✅ `/components/procurement/PurchaseOrderManager.tsx` - Basic PO management
- ✅ PO statuses: draft → submitted → approved → processing → completed
- ✅ PO lines with product relationships
- ✅ Supplier management

### 🎯 What We Need to Build

1. **Enhanced Stock Level Tracking**
   - Cost price per stock level (for accurate valuation)
   - Selling price tracking
   - Supplier information per product

2. **Low Stock Detection & Reordering**
   - Automatic low-stock alerts
   - Reorder recommendation engine
   - Suggested order quantities (EOQ calculation)
   - Group recommendations by supplier

3. **PO Integration with Inventory**
   - Create PO from low-stock alerts
   - Bulk PO creation (multiple products)
   - PO delivery workflow
   - Automatic inventory updates on delivery

4. **Audit Trail & Reporting**
   - Stock movement history
   - PO-to-inventory tracking
   - Cost of goods received
   - Inventory valuation reports

---

## 📅 Implementation Phases

### ✅ PHASE 0: Setup & Documentation
- [x] Create implementation checklist
- [x] Analyze current architecture
- [x] Design data flow
- [ ] Create backup of current implementation
- [ ] Setup test data (products, suppliers, branches)

### 🚧 PHASE 1: Enhanced Product-Inventory Mapping

#### 1.1 Stock Level Enhancements
- [ ] Add `cost_price` dynamic field to STOCK_LEVEL
- [ ] Add `selling_price` dynamic field to STOCK_LEVEL
- [ ] Add `supplier_id` to PRODUCT dynamic fields
- [ ] Add `preferred_supplier` relationship to PRODUCT
- [ ] Update `useStockLevels` hook to include new fields
- [ ] Add cost price input to BranchStockManager component

**Files to Update:**
- `/src/hooks/useStockLevels.ts` - Add cost/selling price fields
- `/src/components/salon/products/BranchStockManager.tsx` - Add cost input
- `/src/app/salon/inventory/page.tsx` - Display cost & value

#### 1.2 Bulk Stock Initialization
- [ ] Create `BulkStockInitializer` component
- [ ] CSV template for bulk stock import
- [ ] Validation for bulk stock data
- [ ] API endpoint: `POST /api/v2/inventory/bulk-init`
- [ ] Show import history/results

**New Files:**
- `/src/components/salon/inventory/BulkStockInitializer.tsx`
- `/src/app/api/v2/inventory/bulk-init/route.ts`
- `/templates/stock-initialization-template.csv`

#### 1.3 Enhanced Inventory Visibility
- [ ] Add "Cost per Unit" column to inventory table
- [ ] Add "Total Value" calculation (qty × cost)
- [ ] Add "Margin %" display (selling - cost / selling × 100)
- [ ] Filter by supplier
- [ ] Enhanced search (include supplier name)

**Files to Update:**
- `/src/app/salon/inventory/page.tsx` - Enhanced display

#### Testing Checklist
- [ ] Create test products with cost prices
- [ ] Initialize stock for multiple branches
- [ ] Verify cost-based valuation calculations
- [ ] Test bulk import with sample CSV
- [ ] Verify all relationships are created correctly

---

### 🎯 PHASE 2: Low Stock Detection & Reorder Alerts

#### 2.1 Reorder Recommendation Service
- [ ] Create `inventory-reorder-service.ts`
- [ ] Function: `getReorderRecommendations()`
- [ ] Calculate optimal order quantities (EOQ)
- [ ] Group recommendations by supplier
- [ ] Consider lead times and safety stock
- [ ] API endpoint: `GET /api/v2/inventory/reorder-recommendations`

**New Files:**
- `/src/lib/services/inventory-reorder-service.ts`
- `/src/app/api/v2/inventory/reorder-recommendations/route.ts`

**Service Functions:**
```typescript
interface ReorderRecommendation {
  product_id: string
  product_name: string
  product_code: string
  location_id: string
  location_name: string
  supplier_id: string
  supplier_name: string
  current_qty: number
  reorder_level: number
  suggested_qty: number
  unit_cost: number
  total_cost: number
  days_until_stockout: number // Optional: based on usage patterns
}

// Main functions to implement
- getReorderRecommendations(organizationId, locationId?)
- calculateOptimalOrderQuantity(product, stockLevel, usageHistory?)
- groupRecommendationsBySupplier(recommendations)
- getSupplierLeadTime(supplierId)
```

#### 2.2 Reorder Alerts UI
- [ ] Add "Reorder Alerts" tab to inventory page
- [ ] Display low-stock products in dedicated view
- [ ] Show suggested order quantities
- [ ] Group alerts by supplier
- [ ] "Create PO" button for individual items
- [ ] "Bulk Create POs" button for supplier groups
- [ ] Alert badges showing reorder count

**Files to Update:**
- `/src/app/salon/inventory/page.tsx` - Add Reorder Alerts tab

**New Components:**
- `/src/components/salon/inventory/ReorderAlertsPanel.tsx`
- `/src/components/salon/inventory/ReorderRecommendationCard.tsx`

#### 2.3 Hook for Reorder Data
- [ ] Create `useReorderRecommendations` hook
- [ ] Fetch recommendations on mount
- [ ] Real-time updates when stock changes
- [ ] Filter/sort recommendations
- [ ] Cache recommendations (5 min TTL)

**New Files:**
- `/src/hooks/useReorderRecommendations.ts`

#### Testing Checklist
- [ ] Create products with low stock (below reorder level)
- [ ] Verify recommendations appear correctly
- [ ] Test EOQ calculations with different parameters
- [ ] Test supplier grouping
- [ ] Verify real-time updates after stock adjustments

---

### 📦 PHASE 3: Purchase Order Creation from Inventory

#### 3.1 PO Creation from Reorders
- [ ] Add "Create PO" action to reorder recommendations
- [ ] Pre-fill PO form with recommendation data
- [ ] Support multi-product PO creation
- [ ] Automatic supplier selection
- [ ] Set expected delivery date (supplier lead time)
- [ ] Link PO to reorder recommendation

**Files to Update:**
- `/src/components/procurement/PurchaseOrderManager.tsx` - Add creation from reorders

**New Components:**
- `/src/components/salon/inventory/CreatePOFromReorderModal.tsx`

#### 3.2 Bulk PO Creation
- [ ] Select multiple recommendations
- [ ] Group by supplier automatically
- [ ] Create multiple POs in one action
- [ ] Show creation progress
- [ ] Summary of created POs
- [ ] Navigate to PO manager after creation

**New Components:**
- `/src/components/salon/inventory/BulkPOCreator.tsx`

#### 3.3 PO Integration Service
- [ ] Function: `createPOFromRecommendation(recommendation)`
- [ ] Function: `createBulkPOsFromRecommendations(recommendations[])`
- [ ] Link PO to originating stock level
- [ ] Store recommendation metadata in PO
- [ ] API endpoint: `POST /api/v2/inventory/create-po-from-reorder`

**New Files:**
- `/src/lib/services/po-from-reorder-service.ts`
- `/src/app/api/v2/inventory/create-po-from-reorder/route.ts`

#### Testing Checklist
- [ ] Create PO from single reorder recommendation
- [ ] Create multiple POs from bulk selection
- [ ] Verify supplier is auto-selected
- [ ] Verify quantities match recommendations
- [ ] Test with products that have no supplier
- [ ] Check PO metadata includes reorder reference

---

### 🚚 PHASE 4: PO Delivery & Automatic Inventory Updates

#### 4.1 PO Delivery Handler Service
- [ ] Create `po-delivery-service.ts`
- [ ] Function: `handlePODelivery(poId, deliveryData)`
- [ ] Update stock levels for each PO line
- [ ] Create STOCK_MOVEMENT transactions
- [ ] Support partial deliveries
- [ ] Update PO status to "delivered"
- [ ] Create audit events

**New Files:**
- `/src/lib/services/po-delivery-service.ts`
- `/src/app/api/v2/procurement/po-delivery/route.ts`

**Service Functions:**
```typescript
interface PODeliveryData {
  po_id: string
  received_date: string
  received_by: string
  location_id: string  // Receiving branch
  line_adjustments?: Array<{
    line_id: string
    received_qty: number  // Allow different from ordered qty
    actual_cost?: number  // Allow cost adjustment
  }>
  notes?: string
  documents?: string[]  // Receipt photos, packing slips
}

// Main functions
- handlePODelivery(organizationId, actorUserId, deliveryData)
- updateStockFromPOLine(line, locationId)
- createReceivingTransaction(po, deliveryData)
- validatePOCanBeDelivered(po)
- handlePartialDelivery(po, receivedLines)
```

#### 4.2 Delivery UI in PO Manager
- [ ] Add "Mark as Delivered" button (status = processing)
- [ ] Delivery modal with form
- [ ] Select receiving branch
- [ ] Adjust quantities if needed (partial delivery)
- [ ] Upload delivery documents
- [ ] Add delivery notes
- [ ] Show stock level changes preview
- [ ] Confirmation before updating inventory

**Files to Update:**
- `/src/components/procurement/PurchaseOrderManager.tsx` - Add delivery workflow

**New Components:**
- `/src/components/procurement/PODeliveryModal.tsx`
- `/src/components/procurement/DeliveryLineAdjustment.tsx`

#### 4.3 Stock Movement Transaction Types
- [ ] Add new movement types to system
  - `receive` - Stock received from PO
  - `transfer_in` - Stock transferred from another branch
  - `transfer_out` - Stock transferred to another branch
  - `adjust_in` - Manual increase
  - `adjust_out` - Manual decrease
  - `sale` - Stock sold (from POS)

**Files to Update:**
- `/src/hooks/useStockLevels.ts` - Add new movement types
- `/src/hooks/useHeraInventory.ts` - Update movement type handling

#### 4.4 Inventory Update Flow
- [ ] Fetch PO with all lines
- [ ] For each line:
  - [ ] Find STOCK_LEVEL for product + location
  - [ ] Create if doesn't exist
  - [ ] Increase quantity by received amount
  - [ ] Create STOCK_MOVEMENT transaction
  - [ ] Update cost price if changed
- [ ] Update PO status to "delivered"
- [ ] Send notification to inventory manager
- [ ] Trigger inventory report recalculation

#### Testing Checklist
- [ ] Create and approve a test PO
- [ ] Mark PO as "processing"
- [ ] Deliver full PO (all quantities)
- [ ] Verify stock levels increased correctly
- [ ] Check STOCK_MOVEMENT transactions created
- [ ] Test partial delivery (some quantities)
- [ ] Test delivery to different branch
- [ ] Verify cost price updates
- [ ] Test with non-existent stock levels (auto-create)
- [ ] Verify PO status workflow

---

### 📊 PHASE 5: Advanced Features & Reporting

#### 5.1 Stock Transfer Between Branches
- [ ] Create `StockTransferManager` component
- [ ] Select source and destination branches
- [ ] Select products and quantities
- [ ] Create transfer transaction
- [ ] Update both branch stock levels
- [ ] Track transfer in-transit status
- [ ] Transfer approval workflow

**New Components:**
- `/src/components/salon/inventory/StockTransferManager.tsx`
- `/src/app/salon/inventory/transfers/page.tsx`

#### 5.2 Physical Stock Count (Stock Take)
- [ ] Create stock count session
- [ ] Scan/count actual quantities
- [ ] Compare with system quantities
- [ ] Show discrepancies
- [ ] Adjustment approval workflow
- [ ] Update stock levels after approval
- [ ] Generate variance report

**New Components:**
- `/src/components/salon/inventory/StockTakeManager.tsx`
- `/src/app/salon/inventory/stock-take/page.tsx`

#### 5.3 Reporting & Analytics
- [ ] Inventory Valuation Report
  - Total inventory value by branch
  - Value by category/supplier
  - Slow-moving items
  - Dead stock identification
- [ ] Stock Movement Report
  - Movements by type
  - Movements by period
  - High-activity products
- [ ] Purchase Order Report
  - PO by status
  - PO by supplier
  - Average lead times
  - Cost variance analysis
- [ ] Reorder Report
  - Items needing reorder
  - Reorder frequency
  - Stockout incidents

**New Components:**
- `/src/components/salon/inventory/reports/InventoryValuationReport.tsx`
- `/src/components/salon/inventory/reports/StockMovementReport.tsx`
- `/src/components/salon/inventory/reports/PurchaseOrderReport.tsx`
- `/src/app/salon/inventory/reports/page.tsx`

#### 5.4 Notifications & Alerts
- [ ] Low stock email alerts
- [ ] PO approval notifications
- [ ] Delivery confirmation emails
- [ ] Weekly inventory summary
- [ ] Stockout alerts

#### Testing Checklist
- [ ] Create stock transfer between branches
- [ ] Conduct physical stock count
- [ ] Generate all reports with sample data
- [ ] Test notification delivery
- [ ] Verify analytics calculations

---

## 🔧 Technical Implementation Details

### Database Schema (Sacred Six Compliant)

#### STOCK_LEVEL Entity
```yaml
entity_type: STOCK_LEVEL
smart_code: HERA.SALON.INV.ENTITY.STOCKLEVEL.v1
dynamic_fields:
  - quantity (number) - Current stock quantity
  - reorder_level (number) - Minimum before reorder
  - cost_price (number) - Cost per unit
  - selling_price (number) - Selling price per unit
  - last_counted_at (date) - Last physical count
  - last_counted_by (text) - User who counted
relationships:
  - STOCK_OF_PRODUCT → PRODUCT entity
  - STOCK_AT_LOCATION → BRANCH entity
```

#### STOCK_MOVEMENT Transaction
```yaml
transaction_type: INV_ADJUSTMENT
smart_code: HERA.SALON.INV.TXN.ADJUST.v1
source_entity_id: product_id
target_entity_id: location_id
metadata:
  movement_type: receive|transfer_in|transfer_out|adjust_in|adjust_out|sale
  stock_level_id: string
  previous_quantity: number
  new_quantity: number
  reason: string
  reference: string (PO ID, transfer ID, etc.)
```

#### PURCHASE_ORDER Transaction
```yaml
transaction_type: PURCHASE_ORDER
smart_code: HERA.SALON.PROCUREMENT.PO.v1
source_entity_id: supplier_id
target_entity_id: receiving_location_id
status: draft|submitted|approved|rejected|processing|delivered|completed|cancelled
metadata:
  po_number: string
  expected_delivery: date
  payment_terms: string
  reorder_reference_ids: string[] (STOCK_LEVEL IDs that triggered PO)
lines:
  - product_id: string
  - quantity: number
  - unit_price: number
  - line_amount: number
```

### API Endpoints

```typescript
// Inventory Management
GET    /api/v2/inventory/stock-levels
POST   /api/v2/inventory/stock-levels
PATCH  /api/v2/inventory/stock-levels/:id
POST   /api/v2/inventory/bulk-init
GET    /api/v2/inventory/reorder-recommendations
POST   /api/v2/inventory/create-po-from-reorder
POST   /api/v2/inventory/stock-transfer
POST   /api/v2/inventory/stock-take

// Purchase Orders
GET    /api/v2/procurement/purchase-orders
POST   /api/v2/procurement/purchase-orders
PATCH  /api/v2/procurement/purchase-orders/:id
POST   /api/v2/procurement/po-delivery
GET    /api/v2/procurement/po-delivery-history/:id

// Reporting
GET    /api/v2/inventory/reports/valuation
GET    /api/v2/inventory/reports/movements
GET    /api/v2/inventory/reports/purchase-orders
GET    /api/v2/inventory/reports/reorder-analysis
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] `inventory-reorder-service.test.ts` - Reorder calculation logic
- [ ] `po-delivery-service.test.ts` - Delivery handler logic
- [ ] `useStockLevels.test.ts` - Hook behavior
- [ ] `useReorderRecommendations.test.ts` - Hook behavior

### Integration Tests
- [ ] Full PO → Delivery → Inventory update flow
- [ ] Multi-branch stock transfer flow
- [ ] Bulk PO creation from reorders
- [ ] Stock count adjustment flow

### E2E Tests
- [ ] Complete inventory management workflow
- [ ] User creates product → initializes stock → receives low stock alert → creates PO → marks delivered → verifies inventory updated

### Performance Tests
- [ ] 1000+ products inventory page load
- [ ] 100+ concurrent stock updates
- [ ] Report generation with 6 months data

---

## 📝 Documentation Requirements

- [ ] API documentation for new endpoints
- [ ] User guide for inventory management
- [ ] User guide for purchase orders
- [ ] Admin guide for bulk operations
- [ ] Training video for staff
- [ ] Troubleshooting guide

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Database migrations ready
- [ ] Backup current production data
- [ ] Test data cleanup scripts

### Deployment
- [ ] Run database migrations
- [ ] Deploy API endpoints
- [ ] Deploy frontend changes
- [ ] Verify health checks
- [ ] Test critical flows in production

### Post-Deployment
- [ ] Monitor error logs
- [ ] Verify inventory calculations
- [ ] Check PO workflow
- [ ] Validate audit trail
- [ ] User acceptance testing

---

## 📊 Success Metrics

### Functional Metrics
- ✅ 100% of low-stock products detected automatically
- ✅ PO creation time reduced by 80% (from manual to auto)
- ✅ Zero inventory discrepancies after PO delivery
- ✅ Complete audit trail for all stock movements

### Performance Metrics
- ✅ Inventory page loads < 2 seconds
- ✅ Stock updates process < 500ms
- ✅ PO delivery updates inventory in < 5 seconds
- ✅ Reports generate < 10 seconds

### Business Metrics
- ✅ Reduce stockouts by 90%
- ✅ Reduce excess inventory by 30%
- ✅ Improve order accuracy to 99%+
- ✅ Reduce inventory carrying costs

---

## 🐛 Known Issues & Limitations

### Current Limitations
- [ ] No automated demand forecasting (manual reorder levels)
- [ ] No supplier performance tracking
- [ ] No inventory aging analysis
- [ ] No multi-currency support for international suppliers

### Future Enhancements
- [ ] AI-powered demand forecasting
- [ ] Automatic reorder level optimization
- [ ] Supplier scorecarding
- [ ] Barcode scanning for stock counts
- [ ] Mobile app for inventory management
- [ ] Integration with accounting system (COGS)

---

## 📞 Support & Escalation

### Development Team
- **Lead Developer:** [Name]
- **Backend:** [Name]
- **Frontend:** [Name]
- **QA:** [Name]

### Contact Information
- **Slack Channel:** #salon-inventory-upgrade
- **Issue Tracker:** GitHub Issues (salon-PO-upgrade branch)
- **Documentation:** `/docs/salon/`

---

## 📅 Timeline & Progress

| Phase | Start Date | Target Date | Status | Completion % |
|-------|-----------|-------------|---------|--------------|
| Phase 0: Setup | 2025-11-05 | 2025-11-05 | 🚧 In Progress | 25% |
| Phase 1: Enhanced Mapping | TBD | TBD | ⏳ Pending | 0% |
| Phase 2: Reorder Alerts | TBD | TBD | ⏳ Pending | 0% |
| Phase 3: PO Creation | TBD | TBD | ⏳ Pending | 0% |
| Phase 4: PO Delivery | TBD | TBD | ⏳ Pending | 0% |
| Phase 5: Advanced Features | TBD | TBD | ⏳ Pending | 0% |

**Overall Progress:** 5% Complete

---

## 🎯 Current Sprint Focus

**Sprint Goal:** Complete Phase 0 and start Phase 1

**This Week:**
- [x] Create implementation checklist
- [x] Analyze current architecture
- [ ] Setup test data
- [ ] Begin Phase 1.1 (Stock Level Enhancements)

**Next Week:**
- [ ] Complete Phase 1.1
- [ ] Begin Phase 1.2 (Bulk Stock Initialization)

---

## 📝 Change Log

### 2025-11-05
- Created initial implementation checklist
- Analyzed current Phase 2 inventory architecture
- Documented data flow and technical requirements
- Set up project tracking structure

---

## 🔗 Related Documents

- [HERA Sacred Six Schema](/docs/schema/hera-sacred-six-schema.yaml)
- [Mobile-First Standardization](/docs/salon/MOBILE-FIRST-STANDARDIZATION-CHECKLIST.md)
- [HERA Development Playbook](/src/lib/dna/playbook/hera-development-playbook.ts)
- [Universal API V2 Patterns](/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md)

---

**Last Updated:** 2025-11-05
**Document Version:** 1.0
**Status:** 🚧 Active Development
