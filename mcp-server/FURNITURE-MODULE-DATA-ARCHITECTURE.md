# Furniture Module Data Architecture Analysis

## Overview
The Furniture module is built on HERA's universal 6-table architecture, demonstrating how a complex manufacturing business can be modeled without custom tables. This analysis shows exactly how each page uses the universal tables and identifies areas where hardcoded data should be replaced with real data.

## Universal Tables Usage

### 1. `core_entities` 
Used for all master data objects:
- **Products** (entity_type: 'product', smart_codes: 'HERA.FURNITURE.PRODUCT.*')
- **Customers** (entity_type: 'customer')
- **Suppliers/Vendors** (entity_type: 'vendor')
- **Locations** (entity_type: 'location')
- **Tender Notices** (entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1')
- **Workflow Status** (entity_type: 'workflow_status')
- **GL Accounts** (entity_type: 'gl_account')

### 2. `universal_transactions`
Used for all business transactions:
- **Sales Orders** (transaction_type: 'sales_order')
- **Production Orders** (transaction_type: 'production_order')
- **Stock Movements** (transaction_type: 'stock_movement', 'purchase_receipt', 'sales_delivery', etc.)
- **Tender Activities** (transaction_type: 'tender_discovery', 'bid_submission', 'emd_payment')
- **Purchase Orders** (transaction_type: 'purchase_order')

### 3. `universal_transaction_lines`
Used for transaction details:
- Order line items (products, quantities, prices)
- Stock movement details
- Tender bid breakdowns
- Production order components

### 4. `core_dynamic_data`
Used for flexible attributes:
- Product attributes (selling_price, cost_price, dimensions, color, material)
- Inventory levels (stock_quantity, reorder_point, location)
- Tender attributes (department, closing_date, estimated_value, emd_amount)
- Customer attributes (credit_limit, payment_terms)

### 5. `core_relationships`
Used for entity connections:
- Product hierarchies (parent-child relationships)
- BOM structures (product to component relationships)
- Status workflows (entity to status relationships)
- Organization structures
- Supplier relationships

### 6. `core_organizations`
Used for multi-tenant isolation:
- Organization ID: `f0af4ced-9d12-4a55-a649-b484368db249` (Kerala Furniture Works)
- All data filtered by organization_id

## Page-by-Page Analysis

### 1. **Dashboard** (`/furniture/page.tsx`)
**UI Components:**
- StatCardGrid, FurnitureStatCard
- Tabs, TabsContent
- ModuleLink cards

**Data Access:**
- ❌ **Hardcoded Stats** (lines 37-70): Active Orders (47), Production Queue (23), Monthly Revenue (₹28.5L), Inventory Value (₹45.2L)
- ❌ **Hardcoded Recent Activities** (lines 72-96): Mock orders from Marriott Hotels, ITC Hotels
- ❌ **Hardcoded Production KPIs** (lines 98-103): Capacity Utilization (78%), On-Time Delivery (92%)

**Should Load From:**
- Stats: Count `universal_transactions` by type and status
- Revenue: Sum `total_amount` from sales transactions
- Activities: Recent transactions with entity relationships
- KPIs: Calculate from production order metadata

### 2. **Inventory** (`/furniture/inventory/page.tsx`)
**UI Components:**
- EnterpriseDataTable
- StatCards for metrics
- Tabs for Overview/Movements/Analytics

**Data Access:**
- ✅ **Loads products** from `core_entities` (entity_type: 'product')
- ✅ **Loads dynamic data** for inventory levels
- ✅ **Loads transactions** for stock movements
- ⚠️ **Partially uses seed data** for stock levels (lines 411-414)

**Issues:**
- Filters products by hardcoded patterns (DESK, CHAIR, TABLE, etc.) instead of smart codes
- Uses random data for base stock levels when dynamic data missing

### 3. **Products & BOM** (`/furniture/products/page.tsx`)
**UI Components:**
- Card-based navigation
- Links to sub-modules

**Data Access:**
- ✅ Uses demo organization resolver
- Navigation only page - no data loading

### 4. **Production Orders** (`/furniture/production/orders/page.tsx`)
**UI Components:**
- Stats cards
- Order table with status badges
- Search and filters

**Data Access:**
- ✅ **Loads production orders** from `universal_transactions` (transaction_type: 'production_order')
- ✅ **Loads entities** for customer names
- ✅ **Loads transaction lines** for order details
- ✅ Uses DNA patterns for data loading

**Well Implemented:**
- Proper filtering by organization_id
- Status tracking via metadata
- Customer relationship resolution

### 5. **Sales Orders** (`/furniture/sales/orders/page.tsx`)
**UI Components:**
- Quick Order POS interface
- Cart functionality
- Order statistics
- Sales pipeline view

**Data Access:**
- ✅ **Loads products** with dynamic pricing data
- ✅ **Loads sales orders** from `universal_transactions`
- ✅ **Enriches orders** with customer names
- ❌ **Hardcoded pipeline data** (lines 406-437)

**Issues:**
- Pipeline values are hardcoded (Proforma: ₹45L, Pending: ₹1.2Cr, etc.)
- Should calculate from actual order statuses

### 6. **Tender Management** (`/furniture/tender/page.tsx`)
**UI Components:**
- Tender stats cards
- Tender list with AI insights
- Competitor analysis

**Data Access:**
- ✅ **Uses tender service** with universal API integration
- ✅ **Loads metrics** via API endpoint
- ✅ **Calculate bid functionality** with AI integration
- ❌ **Hardcoded competitors** (lines 116-144)

**Well Implemented:**
- Complete tender lifecycle using universal tables
- EMD payment tracking as transactions
- Status workflow via relationships

### 7. **Finance/Chart of Accounts** (`/furniture/finance/chart-of-accounts/page.tsx`)
**UI Components:**
- Account tree/hierarchy view
- Balance display

**Data Access:**
- Should load GL accounts from `core_entities` (entity_type: 'gl_account')
- Account hierarchy via `core_relationships`
- Balances from transaction aggregations

### 8. **HR/Payroll**
**Data Model:**
- Employees as entities (entity_type: 'employee')
- Payroll transactions (transaction_type: 'payroll')
- Attendance via transactions or dynamic data

## Data Flow Patterns

### 1. **Organization Context Pattern**
```typescript
// FurnitureOrgContext.tsx
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'
// Always uses fixed furniture organization
```

### 2. **Data Loading Pattern**
```typescript
// Using DNA patterns
const { data, isLoading } = useUniversalData({
  table: 'universal_transactions',
  filter: (item) => item.transaction_type === 'production_order',
  organizationId,
  enabled: !!organizationId
})
```

### 3. **Status Workflow Pattern**
```typescript
// Never status columns - always relationships
// Entity -> has_status -> Status Entity
```

### 4. **Smart Code Usage**
- Products: `HERA.FURNITURE.PRODUCT.*`
- Sales: `HERA.FURNITURE.SALES.*`
- Tender: `HERA.FURNITURE.TENDER.*`
- Finance: `HERA.FURNITURE.FIN.*`

## Hardcoded Data to Replace

### Priority 1 - Dashboard Stats
- Replace hardcoded metrics with real-time calculations
- Query pattern:
  ```sql
  -- Active Orders
  SELECT COUNT(*) FROM universal_transactions 
  WHERE transaction_type = 'sales_order' 
  AND status IN ('pending', 'confirmed', 'in_production')
  
  -- Monthly Revenue
  SELECT SUM(total_amount) FROM universal_transactions
  WHERE transaction_type IN ('sales_order', 'payment_received')
  AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
  ```

### Priority 2 - Recent Activities
- Replace mock activities with real transactions
- Include entity relationships for context

### Priority 3 - Production KPIs
- Calculate from production order metadata
- Track completion rates and timelines

### Priority 4 - Sales Pipeline
- Calculate from order statuses
- Group by workflow stage

### Priority 5 - Competitor Data
- Store competitors as entities
- Track via tender bid transactions

## Universal API Methods Used

1. **Entity Management**
   - `universalApi.createEntity()`
   - `universalApi.read('core_entities', filters)`
   - `universalApi.setDynamicField()`

2. **Transaction Processing**
   - `universalApi.createTransaction()`
   - `universalApi.read('universal_transactions', filters)`

3. **Relationship Management**
   - `universalApi.createRelationship()`
   - Used for status workflows and hierarchies

4. **Dynamic Data**
   - `universalApi.read('core_dynamic_data', filters)`
   - Stores flexible attributes

## Best Practices Demonstrated

1. **Multi-tenant Isolation**: Every query includes organization_id
2. **Smart Code Classification**: All data has business context
3. **No Custom Tables**: Complex manufacturing on 6 tables
4. **Status via Relationships**: No status columns added
5. **Dynamic Attributes**: Flexible fields without schema changes
6. **Transaction Completeness**: Headers + line items pattern

## Recommendations

1. **Create Seed Data Script**
   - Generate realistic furniture products
   - Create sample customers and suppliers
   - Generate historical transactions
   - Set up proper GL accounts

2. **Implement Real-time Calculations**
   - Replace all hardcoded stats
   - Use aggregation queries
   - Cache results appropriately

3. **Enhance Smart Code Usage**
   - Define complete smart code hierarchy
   - Use for automatic workflows
   - Enable AI insights

4. **Complete Finance Integration**
   - Set up chart of accounts
   - Enable auto-journal posting
   - Track profitability

5. **Add Missing Features**
   - Quality control workflows
   - Inventory valuation methods
   - Production routing details
   - Complete tender competitor tracking