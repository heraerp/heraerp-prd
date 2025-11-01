# 🏦 HERA SALON FINANCE & REPORTING SYSTEM
## Complete Developer Guide v2.0

**Last Updated**: 2025-01-01
**Status**: Production Ready
**Smart Code**: `HERA.SALON.FINANCE.SYSTEM.v2`

---

## 📋 TABLE OF CONTENTS

1. [Overview & Architecture](#overview--architecture)
2. [VAT Period Configuration](#vat-period-configuration)
3. [GL Posting Engine v2.0](#gl-posting-engine-v20)
4. [Data Flow & Hooks](#data-flow--hooks)
5. [Smart Codes Reference](#smart-codes-reference)
6. [Finance Pages](#finance-pages)
7. [Reports System](#reports-system)
8. [Calculations Reference](#calculations-reference)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🎯 OVERVIEW & ARCHITECTURE

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    POS / APPOINTMENT                          │
│                  (Transaction Origin)                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              GL POSTING ENGINE V2.0                           │
│         (Auto-posts balanced journal entries)                │
│                                                               │
│  Features:                                                    │
│  • Service/Product revenue split                             │
│  • Service/Product VAT split                                 │
│  • Discount tracking by type                                 │
│  • Tips allocation by staff                                  │
│  • Payment method tracking                                   │
│  • Enhanced metadata (v2.0.0)                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│             UNIVERSAL_TRANSACTIONS                            │
│            (GL_JOURNAL records)                              │
│                                                               │
│  Structure:                                                   │
│  • transaction_type: 'GL_JOURNAL'                            │
│  • smart_code: HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2    │
│  • metadata: EnhancedGLMetadata (v2.0.0)                     │
│  • lines: GLLine[] (DR/CR entries)                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  SALES REPORTS  │     │ FINANCE PAGES   │
│                 │     │                 │
│  • Daily        │     │  • Overview     │
│  • Monthly      │     │  • P&L          │
│  • Quarterly    │     │  • VAT          │
│                 │     │  • Expenses     │
└─────────────────┘     └─────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **GL Posting Engine** | `/src/lib/finance/gl-posting-engine.ts` | Generates balanced journal entries with v2.0 metadata |
| **Sales Report Hooks** | `/src/hooks/useSalonSalesReports.ts` | Extracts revenue/VAT from GL transactions |
| **Expense Hook** | `/src/hooks/useHeraExpenses.ts` | Manages expense entities with category mapping |
| **Universal Transaction Hook** | `/src/hooks/useUniversalTransactionV1.ts` | Fetches GL_JOURNAL transactions |

---

## 📅 VAT PERIOD CONFIGURATION

### UAE VAT Filing Requirements

According to UAE Federal Tax Authority (FTA):

**Standard Period**: **QUARTERLY** (3 months)
- Q1: January - March
- Q2: April - June
- Q3: July - September
- Q4: October - December
- **Due Date**: 28 days after end of quarter

**Optional Monthly**: Only for businesses with taxable supplies > AED 150 million annually

### Current Implementation

**Finance Page VAT Tab**:
- Period: CURRENT MONTH
- Use Case: Internal management reporting
- File: `/src/app/salon/finance/components/FinanceTabs.tsx`

```typescript
// Current month VAT (for management)
const currentMonth = new Date()
const { summary, dimensionalBreakdown } = useMonthlySalesReport(
  currentMonth.getMonth() + 1,
  currentMonth.getFullYear()
)
```

**Daily Sales Report**:
- Period: SINGLE DAY
- Use Case: Daily operations tracking
- File: `/src/app/salon/reports/sales/daily/page.tsx`

```typescript
// Daily VAT breakdown
const { summary, hourlyData, dimensionalBreakdown } = useDailySalesReport(
  selectedDate,
  selectedBranchId
)
```

**Monthly Sales Report**:
- Period: SELECTED MONTH
- Use Case: Monthly performance review
- File: `/src/app/salon/reports/sales/monthly/page.tsx`

```typescript
// Monthly VAT analysis
const { summary, dailyData, dimensionalBreakdown } = useMonthlySalesReport(
  selectedMonth,
  selectedYear,
  selectedBranchId
)
```

### Adding Quarterly VAT Report (RECOMMENDED)

For FTA compliance, add a quarterly report:

```typescript
// hooks/useQuarterlyVATReport.ts
export function useQuarterlyVATReport(quarter: number, year: number) {
  const quarters = {
    1: { start: `${year}-01-01`, end: `${year}-03-31` },
    2: { start: `${year}-04-01`, end: `${year}-06-30` },
    3: { start: `${year}-07-01`, end: `${year}-09-30` },
    4: { start: `${year}-10-01`, end: `${year}-12-31` }
  }

  const period = quarters[quarter]

  const { transactions } = useUniversalTransactionV1({
    filters: {
      transaction_type: 'GL_JOURNAL',
      date_from: period.start,
      date_to: period.end,
      include_lines: true
    }
  })

  // Calculate quarterly VAT summary
  // ... (similar to monthly calculation)
}
```

---

## ⚙️ GL POSTING ENGINE V2.0

### What is GL v2.0?

GL v2.0 is an enhanced journal posting engine that provides:
- ✅ **Service vs Product revenue split**
- ✅ **Service vs Product VAT split**
- ✅ **Discount tracking by type** (service/product/cart)
- ✅ **Tips allocation by staff**
- ✅ **Payment method breakdown**
- ✅ **Enhanced metadata** for fast reporting

**Version Detection**:
```typescript
function detectGLEngineVersion(glTransaction: any): string {
  if (glTransaction?.metadata?.gl_engine_version) {
    return glTransaction.metadata.gl_engine_version // 'v2.0.0'
  }
  // v2.0 detection: Check for enhanced metadata fields
  if (glTransaction?.metadata?.service_revenue_net !== undefined ||
      glTransaction?.metadata?.product_revenue_net !== undefined) {
    return 'v2.0.0'
  }
  return 'v1.0.0' // Legacy
}
```

### Enhanced Metadata Structure (v2.0.0)

```typescript
interface EnhancedGLMetadata {
  // ✅ BACKWARD COMPATIBLE (v1.0 fields)
  origin_transaction_id: string
  origin_transaction_code?: string
  origin_transaction_type: string
  posting_source: string
  gl_balanced: boolean
  total_dr: number
  total_cr: number

  // ✅ FAST-ACCESS AGGREGATES
  gross_revenue: number        // Total before discounts
  net_revenue: number          // After discounts, before VAT
  discount_given: number       // Total discounts
  vat_collected: number        // Total VAT
  tips_collected: number       // Total tips
  cash_received: number        // Total cash/payments

  // ✅ SERVICE BREAKDOWN
  service_revenue_gross: number
  service_revenue_net: number
  service_discount_total: number
  service_count: number

  // ✅ PRODUCT BREAKDOWN
  product_revenue_gross: number
  product_revenue_net: number
  product_discount_total: number
  product_count: number

  // ✅ VAT BREAKDOWN (KEY FOR COMPLIANCE)
  vat_on_services: number      // VAT on service revenue
  vat_on_products: number      // VAT on product revenue
  vat_rate: number             // Usually 0.05 (5%)

  // ✅ TIPS ALLOCATION
  tips_by_staff: Array<{
    staff_id: string
    staff_name: string
    tip_amount: number
    service_count: number
  }>

  // ✅ PAYMENT BREAKDOWN
  payment_methods: Array<{
    method: string              // 'cash' | 'card' | 'bank_transfer'
    amount: number
    reference?: string
  }>

  // ✅ BUSINESS CONTEXT
  branch_id?: string
  customer_id?: string
  staff_ids: string[]

  // ✅ VERSION TRACKING
  gl_engine_version: string    // 'v2.0.0'
  posting_timestamp: string
}
```

### GL v1.0 vs v2.0 Comparison

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Revenue Split | ❌ Single `net_revenue` | ✅ `service_net` + `product_net` |
| VAT Split | ❌ Single `vat_collected` | ✅ `vat_on_services` + `vat_on_products` |
| Discount Tracking | ❌ Single total | ✅ By type (service/product/cart) |
| Tips Allocation | ❌ Total only | ✅ Per staff member |
| Payment Methods | ❌ Not tracked | ✅ Full breakdown |
| Reporting Speed | ⚠️ Requires calculation | ✅ Pre-aggregated |

### How GL v2.0 is Created

**In POS Checkout** (`/src/hooks/usePosCheckout.ts`):

```typescript
import {
  calculateRevenueBreakdown,
  allocateTipsByStaff,
  generateEnhancedGLLines,
  validateGLBalance,
  generateEnhancedMetadata
} from '@/lib/finance/gl-posting-engine'

// 1. Calculate revenue breakdown
const breakdown = calculateRevenueBreakdown(
  cartItems,
  cartDiscount,
  0.05 // 5% VAT rate
)

// 2. Allocate tips to staff
const tipAllocation = allocateTipsByStaff(cartItems, tipAmount)

// 3. Generate balanced GL lines
const glLines = generateEnhancedGLLines(
  breakdown,
  payments,
  tipAllocation,
  totalAmount,
  { branch_id, customer_id, tax_rate: 0.05 }
)

// 4. Validate balance (DR = CR)
const balance = validateGLBalance(glLines)
if (!balance.isBalanced) {
  throw new Error('GL not balanced!')
}

// 5. Generate enhanced metadata
const metadata = generateEnhancedMetadata(
  breakdown,
  tipAllocation,
  payments,
  balance,
  { origin_transaction_id, tax_rate: 0.05 }
)

// 6. Create GL_JOURNAL transaction
const glJournal = await createTransaction({
  transaction_type: 'GL_JOURNAL',
  smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2',
  metadata: metadata,
  lines: glLines
})
```

### Why VAT Reports Show v1.0 Data

**Answer**: Old transactions in the database!

If you're seeing zero VAT breakdown, it means:
1. ✅ Your system **IS** creating v2.0 transactions (engine verified)
2. ❌ But old transactions in the database are **v1.0 format**
3. ⚠️ Reports show aggregated data from ALL transactions (old + new)

**Solution**: Filter by date to see only recent v2.0 transactions:

```typescript
// Only get transactions from today onwards
const { summary, dimensionalBreakdown } = useDailySalesReport(
  new Date(), // Today
  branchId
)

// dimensionalBreakdown will be available for today's sales
```

**Verification**:
```typescript
// Check if dimensional breakdown exists
if (dimensionalBreakdown) {
  console.log('✅ GL v2.0 data available')
  console.log('Service VAT:', dimensionalBreakdown.service_vat)
  console.log('Product VAT:', dimensionalBreakdown.product_vat)
} else {
  console.log('⚠️ Only GL v1.0 data (old transactions)')
}
```

---

## 🔗 DATA FLOW & HOOKS

### Primary Hooks Overview

| Hook | Purpose | Data Source | Returns |
|------|---------|-------------|---------|
| `useDailySalesReport` | Daily revenue analysis | GL_JOURNAL | `{ summary, hourlyData, dimensionalBreakdown }` |
| `useMonthlySalesReport` | Monthly revenue analysis | GL_JOURNAL | `{ summary, dailyData, dimensionalBreakdown }` |
| `useHeraExpenses` | Expense management | EXPENSE entities | `{ expenses, createExpense, updateExpense, deleteExpense }` |
| `useUniversalTransactionV1` | Low-level GL access | universal_transactions | `{ transactions, isLoading, error, refetch }` |

### 1. useDailySalesReport Hook

**Location**: `/src/hooks/useSalonSalesReports.ts`

**Purpose**: Extract daily revenue metrics from GL_JOURNAL transactions

**Usage**:
```typescript
import { useDailySalesReport } from '@/hooks/useSalonSalesReports'

const {
  summary,            // SalesSummary with totals
  hourlyData,         // SalesRow[] - breakdown by hour
  dimensionalBreakdown, // DimensionalBreakdown | null - GL v2.0 data
  isLoading,
  error,
  refetch
} = useDailySalesReport(
  new Date('2025-01-01'),  // Date to analyze
  'branch-uuid-123'         // Optional branch filter
)
```

**Returns**:
```typescript
// summary
{
  total_gross: number,       // Revenue + VAT + Tips
  total_net: number,         // Revenue only (no VAT, no tips)
  total_vat: number,         // Total VAT collected
  total_tips: number,        // Total tips
  total_service: number,     // Service revenue
  total_product: number,     // Product revenue
  transaction_count: number,
  average_ticket: number,
  service_mix_percent: number,
  product_mix_percent: number
}

// dimensionalBreakdown (GL v2.0 only)
{
  service_gross: number,
  service_discount: number,
  service_net: number,
  service_vat: number,
  product_gross: number,
  product_discount: number,
  product_net: number,
  product_vat: number,
  tips_by_staff: Array<{ staff_id, staff_name, tip_amount, service_count }>,
  payments_by_method: Array<{ method, amount, count }>,
  engine_version: 'v2.0.0'
}
```

**Data Extraction Logic**:
```typescript
// Lines 345-386 in useSalonSalesReports.ts
function calculateSummary(glTransactions: any[]): SalesSummary {
  const serviceRevenue = extractServiceNetRevenue(glTransactions)
  const productRevenue = extractProductNetRevenue(glTransactions)
  const totalNetRevenue = serviceRevenue + productRevenue
  const vat = extractVAT(glTransactions)
  const tips = extractTips(glTransactions)
  const totalGross = extractTotalCredit(glTransactions) // total_cr

  return {
    total_gross: totalGross,
    total_net: totalNetRevenue,
    total_vat: vat,
    total_tips: tips,
    total_service: serviceRevenue,
    total_product: productRevenue,
    // ... etc
  }
}
```

### 2. useMonthlySalesReport Hook

**Location**: `/src/hooks/useSalonSalesReports.ts`

**Purpose**: Extract monthly revenue metrics with daily breakdown

**Usage**:
```typescript
import { useMonthlySalesReport } from '@/hooks/useSalonSalesReports'

const {
  summary,            // SalesSummary with additional monthly metrics
  dailyData,          // SalesRow[] - breakdown by day
  dimensionalBreakdown, // DimensionalBreakdown | null
  isLoading,
  error,
  refetch
} = useMonthlySalesReport(
  1,                  // Month (1-12)
  2025,               // Year
  'branch-uuid-123'   // Optional branch filter
)
```

**Additional Monthly Metrics**:
```typescript
{
  ...summary,
  average_daily: number,       // Average revenue per day
  working_days: number,        // Days in month
  growth_vs_previous: number   // % growth vs previous month
}
```

**Growth Calculation**:
```typescript
// Lines 728-742 in useSalonSalesReports.ts
const prevSummary = calculateSummary(prevMonthTransactions)
if (prevSummary.total_gross > 0) {
  const growth = ((currentGross - prevGross) / prevGross) * 100
  return growth // +15.5 means 15.5% growth
}
```

### 3. useHeraExpenses Hook

**Location**: `/src/hooks/useHeraExpenses.ts`

**Purpose**: Manage expense entities with category mapping for P&L

**Usage**:
```typescript
import { useHeraExpenses } from '@/hooks/useHeraExpenses'

const {
  expenses,          // ExpenseEntity[] - flattened with dynamic fields
  isLoading,
  error,
  refetch,
  createExpense,     // Create new expense
  updateExpense,     // Update existing expense
  deleteExpense,     // Delete with fallback to archive
  archiveExpense,    // Soft delete
  restoreExpense,    // Restore archived
  calculateExpenseTotals,  // Get totals by category
  isCreating,
  isUpdating,
  isDeleting
} = useHeraExpenses({
  organizationId: 'org-uuid',
  filters: {
    limit: 100,
    date_from: '2025-01-01',
    date_to: '2025-01-31',
    status: 'active',
    category: 'Salaries'
  }
})
```

**Expense Entity Structure**:
```typescript
interface ExpenseEntity {
  id: string
  entity_name: string
  smart_code: string

  // Flattened dynamic fields
  vendor: string
  amount: number
  expense_date: string
  category: string        // 'Salaries' | 'Rent' | 'Utilities' | etc.
  payment_method: string
  status: string
  description: string
  receipt_url: string
  reference_number: string

  created_at: string
  updated_at: string
}
```

**Category Mapping for P&L**:
```typescript
// Lines 137-150 in FinanceTabs.tsx
const categoryMapping = {
  'Salaries': 'staffSalaries',
  'Rent': 'rentUtilities',
  'Utilities': 'rentUtilities',
  'Inventory': 'supplies',
  'Marketing': 'marketing',
  'Maintenance': 'maintenance',
  'Other': 'other'
}
```

**Create Expense**:
```typescript
await createExpense({
  name: 'Office Rent - January 2025',
  vendor: 'ABC Properties',
  amount: 15000,
  expense_date: '2025-01-01',
  category: 'Rent',
  payment_method: 'bank_transfer',
  status: 'paid',
  description: 'Monthly office rent payment',
  receipt_url: 'https://...',
  reference_number: 'INV-2025-001'
})
```

### 4. useUniversalTransactionV1 Hook

**Location**: `/src/hooks/useUniversalTransactionV1.ts`

**Purpose**: Low-level access to all transactions (not just GL_JOURNAL)

**Usage**:
```typescript
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'

const {
  transactions,      // All matching transactions
  isLoading,
  error,
  refetch
} = useUniversalTransactionV1({
  organizationId: 'org-uuid',
  filters: {
    transaction_type: 'GL_JOURNAL',
    date_from: '2025-01-01',
    date_to: '2025-01-31',
    include_lines: true,  // Include line items
    limit: 1000
  }
})
```

---

## 🏷️ SMART CODES REFERENCE

### GL Transaction Smart Codes

```typescript
// GL Journal Header
'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2'

// GL Line Items
'HERA.SALON.FINANCE.GL.LINE.CASH.DR.v2'
'HERA.SALON.FINANCE.GL.LINE.CARD.DR.v2'
'HERA.SALON.FINANCE.GL.LINE.BANK.DR.v2'
'HERA.SALON.FINANCE.GL.LINE.REVENUE.SERVICE.CR.v2'
'HERA.SALON.FINANCE.GL.LINE.REVENUE.PRODUCT.CR.v2'
'HERA.SALON.FINANCE.GL.LINE.DISCOUNT.SERVICE.DR.v2'
'HERA.SALON.FINANCE.GL.LINE.DISCOUNT.PRODUCT.DR.v2'
'HERA.SALON.FINANCE.GL.LINE.VAT.CR.v2'
'HERA.SALON.FINANCE.GL.LINE.TIPS.CR.v2'
```

### Expense Entity Smart Codes

```typescript
// Expense Entity
'HERA.SALON.EXPENSE.ENTITY.EXPENSE.v1'

// Expense Dynamic Fields
'HERA.SALON.EXPENSE.FIELD.VENDOR.v1'
'HERA.SALON.EXPENSE.FIELD.AMOUNT.v1'
'HERA.SALON.EXPENSE.FIELD.DATE.v1'
'HERA.SALON.EXPENSE.FIELD.CATEGORY.v1'
'HERA.SALON.EXPENSE.FIELD.PAYMENT_METHOD.v1'
```

---

## 📊 FINANCE PAGES

### 1. Finance Dashboard (`/salon/finance`)

**File**: `/src/app/salon/finance/page.tsx`

**Components**:
```
FinancePage
├── FinanceHeader (Mobile iOS-style header)
├── FinanceKPIs (Monthly KPI cards)
└── FinanceTabs
    ├── Overview Tab
    ├── P&L Tab ✅
    ├── VAT Tab ✅
    ├── Expenses Tab
    ├── Invoices Tab
    ├── Cash Flow Tab
    ├── Payroll Tab
    └── Transactions Tab
```

**Data Sources**:
```typescript
// FinanceTabs.tsx
const { summary, dimensionalBreakdown } = useMonthlySalesReport(
  currentMonth,
  currentYear
)

const { expenses } = useHeraExpenses({
  organizationId,
  filters: {
    date_from: startOfMonth(currentMonth),
    date_to: endOfMonth(currentMonth)
  }
})

const { transactions: glTransactions } = useUniversalTransactionV1({
  filters: {
    transaction_type: 'GL_JOURNAL',
    date_from: startOfMonth(currentMonth),
    date_to: endOfMonth(currentMonth)
  }
})
```

#### P&L Tab

**Calculation**:
```typescript
// Lines 396-403 in FinanceTabs.tsx
const totalRevenue = salesSummary?.total_net || 0  // ✅ CRITICAL: Use net, not gross
const totalExpenses = Object.values(expenseBreakdown).reduce((sum, val) => sum + val, 0)
const netProfit = totalRevenue - totalExpenses
```

**Why `total_net` not `total_gross`**:
- `total_gross` = Revenue + VAT + Tips (what customer paid)
- `total_net` = Revenue only (what salon earned, excluding VAT)
- **VAT is a liability**, not revenue
- **Tips are excluded** from operating profit (payable to staff)

**Display**:
```
Revenue Section
  Service Revenue:     AED 45,000
  Product Revenue:     AED 15,000
  Total Revenue (Net): AED 60,000  ← Uses total_net

Operating Expenses
  Staff Salaries:      AED 21,600
  Rent & Utilities:    AED 7,200
  Supplies:            AED 4,800
  Marketing:           AED 2,400
  Total Expenses:      AED 36,000

Net Profit
  Net Profit:          AED 24,000  ← 60,000 - 36,000
```

#### VAT Tab

**Detects GL Version**:
```typescript
// Lines 508-509 in FinanceTabs.tsx
const hasDetailedBreakdown = dimensionalBreakdown &&
  (vatOnServices > 0 || vatOnProducts > 0)
```

**GL v2.0 Display** (Detailed):
```
VAT Summary Cards:
  VAT on Services: AED 2,250 (Net: AED 45,000)
  VAT on Products: AED 750 (Net: AED 15,000)
  Total VAT: AED 3,000

Revenue & VAT Breakdown Table:
  Type      | Gross   | Discount | Net     | VAT@5%  | Total
  Services  | 47,250  | -2,250   | 45,000  | 2,250   | 47,250
  Products  | 15,750  | -750     | 15,000  | 750     | 15,750
  TOTAL     | 63,000  | -3,000   | 60,000  | 3,000   | 63,000
```

**GL v1.0 Fallback** (Basic):
```
Alert: "Detailed VAT breakdown not available. Using GL v1.0 data."

VAT Summary:
  Total VAT Collected: AED 3,000
  VAT on Purchases (Est): AED 1,200
  Net VAT Payable: AED 1,800
```

### 2. Daily Sales Report (`/salon/reports/sales/daily`)

**File**: `/src/app/salon/reports/sales/daily/page.tsx`

**Features**:
- ✅ Hourly breakdown table
- ✅ VAT compliance report (GL v2.0)
- ✅ Excel/PDF export
- ✅ Branch filtering
- ✅ Date picker

**VAT Compliance Report** (Lines 506-757):
```
VAT Compliance Report [GL v2.0 Badge]
Detailed VAT breakdown by revenue type (5% UAE VAT)

Summary Cards:
  VAT on Services: AED 2,250 (Net: AED 45,000)
  VAT on Products: AED 750 (Net: AED 15,000)
  Total VAT: AED 3,000 (Payable to FTA)

Breakdown Table:
  Revenue Type | Gross | Discount | Net | VAT@5% | Total
  Services     | ...   | ...      | ... | ...    | ...
  Products     | ...   | ...      | ... | ...    | ...
  TOTAL        | ...   | ...      | ... | ...    | ...

Compliance Note:
  "This report shows VAT collected at the standard 5% rate on taxable
   supplies. Ensure all amounts are reported to the Federal Tax Authority
   (FTA) in your periodic VAT return."
```

**GL v1.0 Notice**:
```
Alert: "Enhanced VAT Reporting Available"
"Your transactions are using GL v1.0. To see detailed VAT breakdown by
 service and product, transactions must be posted using GL v2.0 engine."
```

### 3. Monthly Sales Report (`/salon/reports/sales/monthly`)

**File**: `/src/app/salon/reports/sales/monthly/page.tsx`

**Features**:
- ✅ Daily breakdown table
- ✅ Growth vs previous month
- ✅ Average daily revenue
- ✅ Working days count
- ✅ Excel/PDF export
- ✅ Branch filtering
- ✅ Month/Year picker
- ✅ **NEW**: Dimensional breakdown support

**Growth Calculation**:
```typescript
// Compares current month vs previous month
growth_vs_previous: ((current - previous) / previous) * 100

Examples:
  Previous: 50,000 | Current: 57,500 → +15.0%
  Previous: 50,000 | Current: 45,000 → -10.0%
  Previous: 0      | Current: 50,000 → N/A
```

---

## 🧮 CALCULATIONS REFERENCE

### Revenue Calculations

**Source**: `/src/hooks/useSalonSalesReports.ts` (Lines 345-386)

```typescript
// 1. Extract service revenue (GL v2.0 path)
service_revenue = transactions
  .map(t => t.metadata.service_revenue_net)
  .reduce((sum, val) => sum + val, 0)

// 2. Extract product revenue (GL v2.0 path)
product_revenue = transactions
  .map(t => t.metadata.product_revenue_net)
  .reduce((sum, val) => sum + val, 0)

// 3. Total net revenue
total_net = service_revenue + product_revenue

// 4. Total gross (what customer paid)
total_gross = transactions
  .map(t => t.metadata.total_cr)  // Credit side total
  .reduce((sum, val) => sum + val, 0)

// Relationship:
// total_gross = total_net + total_vat + total_tips
```

### VAT Calculations

**GL v2.0 Path** (Preferred):
```typescript
// Lines 136 and 142 in useSalonSalesReports.ts
vat_on_services = transactions
  .map(t => t.metadata.vat_on_services || 0)
  .reduce((sum, val) => sum + val, 0)

vat_on_products = transactions
  .map(t => t.metadata.vat_on_products || 0)
  .reduce((sum, val) => sum + val, 0)

total_vat = vat_on_services + vat_on_products
```

**GL v1.0 Fallback**:
```typescript
// Lines 240-246 in useSalonSalesReports.ts
total_cr = t.metadata.total_cr      // Gross collected
net_revenue = t.metadata.net_revenue // Revenue without VAT
tips = t.metadata.tips               // Tips

vat = total_cr - net_revenue - tips

// Example:
// total_cr = 63,000
// net_revenue = 60,000
// tips = 0
// vat = 63,000 - 60,000 - 0 = 3,000
```

### P&L Calculations

**Source**: `/src/app/salon/finance/components/FinanceTabs.tsx` (Lines 396-403)

```typescript
// ✅ ENTERPRISE ACCOUNTING: Use net revenue (excluding VAT)
const totalRevenue = salesSummary?.total_net || 0

// Calculate total expenses from real expense data
const totalExpenses = Object.values(expenseBreakdown)
  .reduce((sum, val) => sum + val, 0)

// Net profit = Revenue - Expenses
const netProfit = totalRevenue - totalExpenses

// Example:
// totalRevenue = 60,000 (net, no VAT)
// totalExpenses = 36,000
// netProfit = 24,000
```

### Expense Category Aggregation

**Source**: `/src/app/salon/finance/components/FinanceTabs.tsx` (Lines 107-157)

```typescript
// Fetch expenses for current month
const { expenses } = useHeraExpenses({
  filters: {
    date_from: startOfMonth(currentMonth),
    date_to: endOfMonth(currentMonth)
  }
})

// Aggregate by category
const breakdown = {
  staffSalaries: 0,
  rentUtilities: 0,
  supplies: 0,
  marketing: 0,
  maintenance: 0,
  other: 0
}

expenses.forEach(expense => {
  const amount = expense.amount || 0
  const category = expense.category || 'Other'

  if (category === 'Salaries') {
    breakdown.staffSalaries += amount
  } else if (category === 'Rent' || category === 'Utilities') {
    breakdown.rentUtilities += amount
  } else if (category === 'Inventory') {
    breakdown.supplies += amount
  } else if (category === 'Marketing') {
    breakdown.marketing += amount
  } else if (category === 'Maintenance') {
    breakdown.maintenance += amount
  } else {
    breakdown.other += amount
  }
})

breakdown.totalExpenses = Object.values(breakdown)
  .reduce((sum, val) => sum + val, 0)
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: VAT Breakdown Shows Zero

**Symptoms**:
```
VAT on Services: AED 0.00
VAT on Products: AED 0.00
Total VAT: AED 3,000  ← Only this shows value
```

**Diagnosis**:
```typescript
console.log('Dimensional Breakdown:', dimensionalBreakdown)
// Output: null or { service_vat: 0, product_vat: 0 }
```

**Cause**: Old GL v1.0 transactions in database

**Solution 1 - Filter Recent Transactions**:
```typescript
// Only show today's transactions (will be v2.0)
const { dimensionalBreakdown } = useDailySalesReport(
  new Date(),  // Today only
  branchId
)
```

**Solution 2 - Check Transaction Dates**:
```sql
-- Find when GL v2.0 started
SELECT
  transaction_date,
  metadata->>'gl_engine_version' as version,
  metadata->>'vat_on_services' as service_vat,
  metadata->>'vat_on_products' as product_vat
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
  AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY transaction_date DESC
LIMIT 20;
```

**Solution 3 - Create Test Transaction**:
```typescript
// Make a POS sale today
// Check if VAT breakdown appears in reports
```

### Issue 2: P&L Shows Wrong Revenue

**Symptoms**:
```
Total Revenue: AED 63,000  ← Should be 60,000
Net Profit: AED 27,000     ← Should be 24,000
```

**Diagnosis**:
```typescript
// Check which field is being used
console.log('Gross:', salesSummary.total_gross)  // 63,000
console.log('Net:', salesSummary.total_net)      // 60,000
```

**Cause**: Using `total_gross` instead of `total_net`

**Fix**: Update FinanceTabs.tsx line 402:
```typescript
// ❌ WRONG
const netProfit = (salesSummary?.total_gross || 0) - totalExpenses

// ✅ CORRECT
const totalRevenue = salesSummary?.total_net || 0
const netProfit = totalRevenue - totalExpenses
```

### Issue 3: Expense Categories Not Showing

**Symptoms**:
```
Staff Salaries: AED 0
Rent & Utilities: AED 0
Total using estimates instead of real data
```

**Diagnosis**:
```typescript
console.log('Expenses:', realExpenses)
// Output: [] or undefined
```

**Cause 1**: No expenses recorded for current month

**Solution**: Add expenses via `/salon/finance` → Expenses tab

**Cause 2**: Date range mismatch

**Solution**: Check date filtering:
```typescript
console.log('Expense Date Range:', {
  from: startOfMonth(currentMonth).toISOString(),
  to: endOfMonth(currentMonth).toISOString()
})

console.log('Expense Dates:',
  realExpenses?.map(e => e.expense_date)
)
```

### Issue 4: Duplicate Calculations

**Symptoms**:
```
Different totals on different pages
```

**Diagnosis**: Check which hooks are being used:
```typescript
// Finance Page
useMonthlySalesReport(month, year) → GL_JOURNAL

// Daily Report
useDailySalesReport(date, branch) → GL_JOURNAL

// Monthly Report
useMonthlySalesReport(month, year) → GL_JOURNAL
```

**Verification**: All should return same totals for same period

**Fix**: Ensure consistent date ranges across all pages

---

## ✅ BEST PRACTICES

### 1. Always Use Hooks (Never Direct Queries)

**❌ WRONG**:
```typescript
// Don't query database directly
const { data } = await supabase
  .from('universal_transactions')
  .select('*')
  .eq('transaction_type', 'GL_JOURNAL')
```

**✅ CORRECT**:
```typescript
// Use provided hooks
const { transactions } = useUniversalTransactionV1({
  filters: { transaction_type: 'GL_JOURNAL' }
})
```

### 2. Filter by Organization

**❌ WRONG**:
```typescript
// Missing organization filter - data leakage risk!
const { summary } = useMonthlySalesReport(1, 2025)
```

**✅ CORRECT**:
```typescript
// Hook automatically filters by organization context
const { organizationId } = useSecuredSalonContext()
const { summary } = useMonthlySalesReport(1, 2025)
// organizationId is passed via context
```

### 3. Handle Loading States

**❌ WRONG**:
```typescript
// No loading state - shows 0 during load
return <div>Revenue: AED {summary.total_gross}</div>
```

**✅ CORRECT**:
```typescript
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorAlert error={error} />
if (!summary) return <NoDataMessage />

return <div>Revenue: AED {summary.total_gross}</div>
```

### 4. Use Net Revenue for P&L

**❌ WRONG**:
```typescript
// Includes VAT as revenue
const netProfit = salesSummary.total_gross - expenses
```

**✅ CORRECT**:
```typescript
// Excludes VAT (it's a liability)
const netProfit = salesSummary.total_net - expenses
```

### 5. Check GL Version

**❌ WRONG**:
```typescript
// Assumes v2.0 data always exists
const serviceVAT = dimensionalBreakdown.service_vat
```

**✅ CORRECT**:
```typescript
// Handle v1.0 fallback
const hasV2Data = dimensionalBreakdown &&
  (dimensionalBreakdown.service_vat > 0 ||
   dimensionalBreakdown.product_vat > 0)

if (hasV2Data) {
  // Show detailed breakdown
} else {
  // Show v1.0 notice
}
```

### 6. Use Smart Codes

**❌ WRONG**:
```typescript
// Hardcoded strings
transaction_type: 'GL_JOURNAL'
```

**✅ CORRECT**:
```typescript
// Use smart code constants
import { GL_SMART_CODES } from '@/lib/finance/gl-posting-engine'

smart_code: GL_SMART_CODES.GL_JOURNAL
```

### 7. Validate GL Balance

**❌ WRONG**:
```typescript
// Post unbalanced journal
await createTransaction({ lines: glLines })
```

**✅ CORRECT**:
```typescript
import { validateGLBalance } from '@/lib/finance/gl-posting-engine'

const balance = validateGLBalance(glLines)
if (!balance.isBalanced) {
  throw new Error(`GL not balanced! DR: ${balance.totalDR}, CR: ${balance.totalCR}`)
}
```

### 8. Date Range Consistency

**❌ WRONG**:
```typescript
// Different date ranges for sales and expenses
const sales = useMonthlySalesReport(1, 2025)
const expenses = useHeraExpenses({
  filters: { date_from: '2025-01-15' } // Wrong!
})
```

**✅ CORRECT**:
```typescript
// Same date range for both
const currentMonth = new Date()
const dateRange = {
  from: startOfMonth(currentMonth).toISOString(),
  to: endOfMonth(currentMonth).toISOString()
}

const sales = useMonthlySalesReport(
  currentMonth.getMonth() + 1,
  currentMonth.getFullYear()
)

const expenses = useHeraExpenses({
  filters: {
    date_from: dateRange.from,
    date_to: dateRange.to
  }
})
```

---

## 📚 ADDITIONAL RESOURCES

### Related Documentation

- **GL Posting Engine**: `/src/lib/finance/gl-posting-engine.ts`
- **Sales Report Hooks**: `/src/hooks/useSalonSalesReports.ts`
- **Expense Hook**: `/src/hooks/useHeraExpenses.ts`
- **Finance Pages**: `/src/app/salon/finance/`
- **Sales Reports**: `/src/app/salon/reports/sales/`

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `gl-posting-engine.ts` | 680 | GL v2.0 journal generation |
| `useSalonSalesReports.ts` | 773 | Revenue extraction & analysis |
| `useHeraExpenses.ts` | 323 | Expense management |
| `FinanceTabs.tsx` | 1106 | Finance dashboard tabs |
| `daily/page.tsx` | 766 | Daily sales report |
| `monthly/page.tsx` | 636 | Monthly sales report |

### Testing Checklist

- [ ] ✅ Create POS sale with services + products
- [ ] ✅ Check GL transaction created with v2.0 metadata
- [ ] ✅ Verify VAT split in daily report
- [ ] ✅ Verify VAT split in finance VAT tab
- [ ] ✅ Create expense with category
- [ ] ✅ Check expense appears in P&L
- [ ] ✅ Verify P&L uses `total_net` not `total_gross`
- [ ] ✅ Check GL balance (DR = CR)
- [ ] ✅ Verify organization filtering works
- [ ] ✅ Test date range filters

---

## 🎯 CONCLUSION

The HERA Salon Finance & Reporting System is **production-ready** with:

✅ **GL v2.0 Engine** - Enhanced metadata with service/product VAT split
✅ **Real-time Reporting** - Direct from GL_JOURNAL transactions
✅ **Expense Integration** - Real expense data in P&L
✅ **VAT Compliance** - UAE FTA ready with detailed breakdowns
✅ **Enterprise Accounting** - Standard GAAP/IFRS compliant
✅ **Single Source of Truth** - No duplicate calculations
✅ **Complete Audit Trail** - All transactions traceable

**Next Steps**:
1. Add quarterly VAT report for FTA compliance
2. Implement GL metadata validation layer
3. Add expense VAT tracking for accurate Net VAT Payable
4. Create reconciliation reports

For questions or issues, refer to this guide or check the source code comments in the key files listed above.

---

**Document Version**: 2.0
**Last Updated**: 2025-01-01
**Status**: ✅ Production Ready
