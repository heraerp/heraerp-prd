# Furniture Module - Hardcoded Data Inventory

## Executive Summary
This document lists all hardcoded/dummy data found in the furniture module that needs to be replaced with real data from universal tables.

## Hardcoded Data by Page

### 1. Dashboard (`/furniture/page.tsx`)

**Location:** Lines 36-41
```typescript
const stats = {
  activeOrders: 47,
  monthlyRevenue: '₹28.5L',
  productionQueue: 23,
  inventoryValue: '₹1.2Cr'
}
```

**Location:** Lines 44-67 (Recent Activities)
```typescript
const recentActivities = [
  {
    id: '1',
    type: 'order' as const,
    description: 'New order from Latha Builders',
    timestamp: '2 hours ago',
    amount: '₹2.4L'
  },
  {
    id: '2',
    type: 'production' as const,
    description: 'Production started for Order #KFW2024-089',
    timestamp: '3 hours ago'
  },
  {
    id: '3',
    type: 'delivery' as const,
    description: 'Delivered to John\'s Interiors',
    timestamp: '5 hours ago',
    amount: '₹1.8L'
  },
  // ... more mock activities
]
```

### 2. Sales Pipeline (`/furniture/sales/page.tsx`)

**Location:** Lines 100-123 (Pipeline Data)
```typescript
const pipelineData = [
  { 
    stage: 'Proforma', 
    value: '₹45L', 
    deals: 8, 
    percentage: 5,
    bgColor: 'bg-blue-500',
    darkBgColor: 'dark:bg-blue-600'
  },
  { 
    stage: 'Pending Approval', 
    value: '₹1.2Cr', 
    deals: 15, 
    percentage: 12,
    bgColor: 'bg-yellow-500',
    darkBgColor: 'dark:bg-yellow-600'
  },
  // ... more stages
]
```

**Location:** Lines 126-135 (Recent Deals)
```typescript
// Mock data mixed with real data
const displayDeals = deals?.slice(0, 5) || [
  { customer: 'Loading...', amount: 0, status: 'pending' }
]
```

### 3. Production Dashboard (`/furniture/production/page.tsx`)

**Location:** Lines 33-48 (Production Stats)
```typescript
const productionStats = {
  activeWorkOrders: workOrders?.length || 0,  // This is good - uses real data
  capacityUtilization: 78,  // HARDCODED
  onTimeDelivery: 92,      // HARDCODED
  qualityPassRate: 96.5    // HARDCODED
}
```

**Location:** Lines 50-73 (Work Centers)
```typescript
const workCenters = [
  { 
    id: 1, 
    name: 'CNC Machine 1', 
    status: 'active',      // Should come from relationships
    utilization: 85,       // HARDCODED
    currentJob: 'KFW-2024-089'  // Should be from transactions
  },
  // ... more hardcoded work centers
]
```

### 4. Quality Control (`/furniture/quality/page.tsx`)

**Location:** Lines 11-26 (Quality Metrics)
```typescript
const qualityMetrics = {
  passRate: 96.5,          // HARDCODED
  defectRate: 3.5,         // HARDCODED
  inspectionsToday: 24,    // HARDCODED
  pendingInspections: 8,   // HARDCODED
  criticalIssues: 2,       // HARDCODED
  avgInspectionTime: '45 min'  // HARDCODED
}
```

**Location:** Lines 28-74 (Inspection Data)
```typescript
const recentInspections = [
  {
    id: '1',
    orderNumber: 'KFW-2024-089',  // Should link to real order
    product: 'Executive Desk Set',
    inspector: 'Rajesh Kumar',     // Should be entity
    result: 'passed',
    date: '2024-03-15',
    issues: []
  },
  // ... more hardcoded inspections
]
```

### 5. Finance Overview (`/furniture/finance/page.tsx`)

**Location:** Lines 37-42 (Financial Stats)
```typescript
const financialStats = {
  totalRevenue: formatCurrency(5200000),    // HARDCODED ₹52L
  totalExpenses: formatCurrency(3900000),   // HARDCODED ₹39L
  netProfit: formatCurrency(1300000),       // HARDCODED ₹13L
  profitMargin: '25%'                       // HARDCODED
}
```

**Location:** Lines 44-67 (Cash Flow Data)
```typescript
const cashFlowData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Inflow',
      data: [800000, 950000, 1100000, 1050000, 1200000, 1300000],  // ALL HARDCODED
    },
    {
      label: 'Outflow',
      data: [600000, 700000, 850000, 800000, 900000, 950000],      // ALL HARDCODED
    }
  ]
}
```

**Location:** Lines 69-84 (Expense Breakdown)
```typescript
const expenseBreakdown = [
  { category: 'Raw Materials', amount: 1950000, percentage: 50 },    // HARDCODED
  { category: 'Labor', amount: 975000, percentage: 25 },            // HARDCODED
  { category: 'Overhead', amount: 585000, percentage: 15 },          // HARDCODED
  { category: 'Marketing', amount: 234000, percentage: 6 },          // HARDCODED
  { category: 'Others', amount: 156000, percentage: 4 }             // HARDCODED
]
```

### 6. Tender Management (`/furniture/tender/page.tsx`)

**Location:** Lines 135-150 (Competitor Data)
```typescript
const competitors = [
  { name: 'Godrej Interio', wins: 45, avgBid: '₹45L' },      // HARDCODED
  { name: 'Featherlite', wins: 38, avgBid: '₹42L' },         // HARDCODED
  { name: 'Durian Industries', wins: 32, avgBid: '₹48L' },   // HARDCODED
  { name: 'Nilkamal', wins: 28, avgBid: '₹35L' }             // HARDCODED
]
```

## Summary Statistics

### Total Hardcoded Values by Category:
- **Financial Data**: 24 values (revenue, expenses, cash flow, etc.)
- **Production Metrics**: 12 values (capacity, quality rates, etc.)
- **Mock Activities**: 8 entries (customer names, order references)
- **Quality Metrics**: 10 values (pass rates, inspection times)
- **Competitor Data**: 4 entries (should be from tender history)

### Priority Ranking for Replacement:

1. **Critical (Affects accuracy)**
   - Dashboard stats (active orders, revenue)
   - Financial summaries (P&L, cash flow)
   - Sales pipeline values

2. **Important (Affects credibility)**
   - Production KPIs
   - Quality metrics
   - Recent activities

3. **Nice to Have (Demo enhancement)**
   - Competitor analysis
   - Historical trends
   - Work center utilization

## Replacement Strategy

### Phase 1: Dashboard Stats
```typescript
// Replace with:
const stats = await furnitureDataService.getDashboardStats(organizationId)

// Service implementation:
async getDashboardStats(orgId: string) {
  const activeOrders = await universalApi.read('universal_transactions', {
    filter: `organization_id.eq.${orgId},transaction_type.eq.sales_order,metadata->>status.neq.completed`
  })
  
  const monthlyRevenue = await universalApi.aggregate('universal_transactions', {
    sum: 'total_amount',
    filter: `organization_id.eq.${orgId},transaction_date.gte.${startOfMonth}`
  })
  
  // ... etc
}
```

### Phase 2: Real-time Calculations
- Implement aggregation queries
- Add caching for performance
- Create background jobs for heavy calculations

### Phase 3: Historical Data Generation
- Generate realistic historical transactions
- Backfill quality inspections
- Create competitor bid history

## Action Items

1. Create `FurnitureDataService` class
2. Implement real-time stat calculations
3. Replace all hardcoded values with service calls
4. Add loading states during data fetch
5. Implement caching strategy
6. Create comprehensive seed data script