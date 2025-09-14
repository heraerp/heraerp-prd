# Furniture Module Data Architecture Analysis

## Overview
Complete reverse engineering of the furniture module showing all pages, their universal table dependencies, and hardcoded data that needs replacement.

## Page Directory Structure

```
/furniture
├── page.tsx                    # Dashboard
├── layout.tsx                  # Module layout with sidebar
├── sales/
│   └── page.tsx               # Sales pipeline
├── production/
│   ├── page.tsx               # Production dashboard
│   ├── planning/
│   │   └── page.tsx          # Production planning
│   ├── tracking/
│   │   └── page.tsx          # Production tracking
│   └── orders/
│       ├── page.tsx          # Production orders list
│       ├── new/
│       │   └── page.tsx      # New production order
│       └── [id]/
│           └── page.tsx      # Production order detail
├── inventory/
│   └── page.tsx               # Inventory management
├── quality/
│   └── page.tsx               # Quality control
├── tender/
│   └── page.tsx               # Government tender management
└── finance/
    └── page.tsx               # Financial overview
```

## Detailed Page Analysis

### 1. **Dashboard** (`/furniture/page.tsx`)

**UI Components:**
- Stat cards (orders, revenue, production, inventory)
- Recent activities list
- Quick action buttons

**Universal Tables:**
- ❌ **HARDCODED** - All stats are hardcoded

**Hardcoded Data to Replace:**
```typescript
// Current (WRONG):
const stats = {
  activeOrders: 47,
  monthlyRevenue: '₹28.5L',
  productionQueue: 23,
  inventoryValue: '₹1.2Cr'
}

// Should be (CORRECT):
// Calculate from universal_transactions where transaction_type = 'sales_order'
// Sum total_amount for current month from universal_transactions
// Count production_order transactions with status = 'pending'
// Sum product values from core_entities + core_dynamic_data
```

**Recent Activities:**
- Mock customer names: "Latha Builders", "John's Interiors", etc.
- Should load from actual transactions

### 2. **Sales Pipeline** (`/furniture/sales/page.tsx`)

**UI Components:**
- Pipeline stage cards
- Sales transactions table
- Monthly trend chart

**Universal Tables:**
- ✅ `universal_transactions` - Loads sales orders
- ✅ `core_entities` - Customer names
- ❌ **Pipeline stats hardcoded**

**Hardcoded Data to Replace:**
```typescript
// Current (WRONG):
const pipelineData = [
  { stage: 'Proforma', value: '₹45L', deals: 8 },
  { stage: 'Pending Approval', value: '₹1.2Cr', deals: 15 },
  { stage: 'In Production', value: '₹2.8Cr', deals: 23 },
  { stage: 'Completed', value: '₹5.2Cr', deals: 42 }
]

// Should be (CORRECT):
// Group by metadata.stage and sum total_amount
// Count transactions per stage
```

### 3. **Production Dashboard** (`/furniture/production/page.tsx`)

**UI Components:**
- Production KPI cards
- Active work orders table
- Capacity utilization chart

**Universal Tables:**
- ✅ `universal_transactions` - Production orders
- ✅ `core_entities` - Products and customers
- ❌ **KPIs hardcoded**

**Hardcoded Data to Replace:**
```typescript
// Current (WRONG):
capacityUtilization: 78,
onTimeDelivery: 92,
qualityPassRate: 96.5

// Should be (CORRECT):
// Calculate from production order completion dates vs delivery dates
// Track quality checks in transaction metadata
```

### 4. **Production Planning** (`/furniture/production/planning/page.tsx`)

**UI Components:**
- Calendar view
- Work center allocation
- BOM requirements

**Universal Tables:**
- ✅ `universal_transactions` - Production orders
- ✅ `core_entities` - Work centers (entity_type: 'work_center')
- ✅ `core_relationships` - BOM structure
- ✅ `universal_transaction_lines` - Order items

**Status:** Properly implemented with real data

### 5. **Production Tracking** (`/furniture/production/tracking/page.tsx`)

**UI Components:**
- Order progress cards
- Stage-wise tracking
- Completion timeline

**Universal Tables:**
- ✅ `universal_transactions` - Production orders
- ✅ `core_relationships` - Status tracking
- ✅ `core_dynamic_data` - Progress percentages

**Status:** Well implemented with status relationship pattern

### 6. **Production Orders** (`/furniture/production/orders/`)

**List Page:**
- ✅ Loads from `universal_transactions`
- ✅ Uses entity relationships
- ✅ Proper filtering and search

**New Order Page:**
- ✅ Creates transactions with smart codes
- ✅ Links to customer and product entities
- ✅ Stores metadata properly

**Detail Page:**
- ✅ Loads complete order with lines
- ✅ Shows related entities
- ✅ Status management ready

**Status:** Fully implemented correctly

### 7. **Inventory Management** (`/furniture/inventory/page.tsx`)

**UI Components:**
- Stock level cards
- Product inventory table
- Stock movement history

**Universal Tables:**
- ✅ `core_entities` - Products with entity_type: 'product'
- ✅ `core_dynamic_data` - Stock levels, reorder points
- ✅ `universal_transactions` - Stock movements
- ❌ **Some stock calculations hardcoded**

**Improvements Needed:**
- Calculate actual stock from transaction history
- Track location-wise inventory

### 8. **Quality Control** (`/furniture/quality/page.tsx`)

**UI Components:**
- Quality metrics dashboard
- Inspection checklist
- Non-conformance tracking

**Universal Tables:**
- ✅ Basic structure uses entities
- ❌ **Quality metrics hardcoded**
- ❌ **Missing quality check transactions**

**Needs Implementation:**
- Quality check as transaction type
- Non-conformance in relationships
- Inspection results in dynamic data

### 9. **Tender Management** (`/furniture/tender/page.tsx`)

**UI Components:**
- Active tenders list
- Bid preparation wizard
- EMD tracking
- Competitor analysis

**Universal Tables:**
- ✅ `core_entities` - Tenders as entities
- ✅ `universal_transactions` - Bid submissions, EMD payments
- ✅ `core_dynamic_data` - Tender details
- ✅ Uses FurnitureTenderService

**Status:** Excellently implemented with full universal architecture

### 10. **Finance Overview** (`/furniture/finance/page.tsx`)

**UI Components:**
- Revenue/expense cards
- P&L summary
- Cash flow chart
- Pending receivables

**Universal Tables:**
- ✅ `core_entities` - GL accounts
- ✅ `universal_transactions` - All financial transactions
- ❌ **Financial summaries hardcoded**
- ❌ **Missing actual GL postings**

**Needs Implementation:**
- Auto-journal posting integration
- Real-time P&L calculation
- Cash flow from transactions

## Summary of Hardcoded Data

### Priority 1 - Dashboard Stats
```typescript
// All dashboard statistics need real-time calculation:
activeOrders: COUNT(universal_transactions WHERE transaction_type = 'sales_order' AND status != 'completed')
monthlyRevenue: SUM(total_amount WHERE transaction_date >= start_of_month)
productionQueue: COUNT(production_orders WHERE status = 'pending')
inventoryValue: SUM(product_cost * stock_quantity FROM entities + dynamic_data)
```

### Priority 2 - Sales Pipeline
```typescript
// Pipeline stages from transaction metadata:
GROUP BY metadata.stage, SUM(total_amount), COUNT(*)
```

### Priority 3 - Production KPIs
```typescript
// Calculate from actual performance:
capacityUtilization: (actual_hours / available_hours) * 100
onTimeDelivery: (on_time_orders / total_orders) * 100
qualityPassRate: (passed_checks / total_checks) * 100
```

### Priority 4 - Financial Summaries
```typescript
// From actual GL postings:
totalRevenue: SUM(credit_amounts) for revenue accounts
totalExpenses: SUM(debit_amounts) for expense accounts
netProfit: revenue - expenses
cashFlow: cash account movements
```

## Universal API Usage Patterns

### Correct Patterns Found:
```typescript
// 1. Organization-scoped queries
useUniversalData({
  table: 'core_entities',
  filter: (item) => item.organization_id === organizationId,
  organizationId,
  enabled: !!organizationId
})

// 2. Smart code filtering
filter: (item) => item.smart_code?.startsWith('HERA.FURNITURE.PRODUCT')

// 3. Relationship-based status
// Never using status columns, always relationships

// 4. Transaction with lines
universalApi.createTransaction({
  ...transactionData,
  line_items: orderLines
})
```

### Anti-Patterns to Fix:
```typescript
// 1. Hardcoded stats instead of calculations
// 2. Mock data in recent activities
// 3. Static pipeline values
// 4. Missing GL integration
```

## Recommendations

1. **Create a furniture data service** to centralize all calculations
2. **Implement real-time aggregations** for all dashboard stats
3. **Add comprehensive seed data** for realistic demos
4. **Complete GL posting integration** for financial accuracy
5. **Track all quality events** as transactions
6. **Implement BOM explosion** for production planning

## Organization Details
- **Organization ID**: `f0af4ced-9d12-4a55-a649-b484368db249`
- **Organization Name**: Kerala Furniture Works
- **Demo User**: sanadh@keralafurniture.com