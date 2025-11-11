# HERA Salon - Reports & Analytics Feature Guide

**Version**: 1.0 (Production Ready)
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.REPORTS.v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Report Types](#report-types)
4. [Hooks](#hooks)
5. [Components](#components)
6. [GL-Based Sales Reports](#gl-based-sales-reports)
7. [Data Calculations](#data-calculations)
8. [Export Features](#export-features)
9. [Role-Based Access](#role-based-access)
10. [Common Tasks](#common-tasks)
11. [Testing](#testing)
12. [Performance Optimization](#performance-optimization)

---

## 🎯 Overview

The Reports & Analytics feature provides comprehensive business intelligence with GL-backed sales reports, customer analytics, staff performance tracking, and financial insights.

### Key Features

- **GL-Powered Sales Reports** - Daily and monthly sales with GL Journal validation
- **Real-Time Dashboard Stats** - Live KPI cards with automatic refresh
- **Role-Based Access Control** - Owner/admin/user permission filtering
- **Excel & PDF Export** - Professional report exports with branding
- **Multi-Branch Support** - Branch-specific and consolidated reporting
- **VAT Compliance** - Detailed VAT breakdown for FTA reporting
- **Progressive Loading** - 3-stage loading for instant page render

### Success Metrics

- ✅ **10 Report Types**: Daily Sales, Monthly Sales, Revenue, P&L, Branch P&L, Customer Analytics, Staff Performance, Appointments, Inventory, Service Analytics
- ✅ **2 Featured Reports**: Daily Sales and Monthly Sales (GL-powered)
- ✅ **3 Categories**: Financial, Operational, Analytics
- ✅ **GL v2.0 Integration**: Enhanced metadata for dimensional reporting
- ✅ **Export Formats**: Excel (XLSX) and PDF with professional styling

**File Path**: `/src/app/salon/reports/page.tsx:54-465`

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────┐
│   Reports Hub       │
│   (Landing Page)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  useReportsMetadata │──► Role-based filtering
│  (Report Cards)     │    Category filtering
└──────────┬──────────┘    Featured/regular separation
           │
           ▼
┌─────────────────────┐
│  useReportsStats    │──► Real-time KPI calculation
│  (Dashboard Stats)  │    GL Journal revenue
└──────────┬──────────┘    Current month filtering
           │
           ▼
┌─────────────────────┐
│  Specific Reports   │
│  (Daily/Monthly)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  useSalesReports    │──► GL Journal fetching
│  (Data Provider)    │    Hourly/daily aggregation
└──────────┬──────────┘    VAT breakdown
           │
           ▼
┌─────────────────────┐
│  Export Components  │──► Excel generation
│  (XLSX/PDF)         │    PDF rendering
└─────────────────────┘    Professional styling
```

### Technology Stack

- **Next.js 15.4.2** - App Router with nested routes
- **React Query** - Server state management with caching
- **ExcelJS** - Professional Excel report generation
- **date-fns** - Date manipulation and formatting
- **HERA GL v2.0** - General Ledger Journal data source
- **Luxe Design System** - Premium salon styling

**Architecture Decision**: Reports use **GL_JOURNAL transactions** as the source of truth, ensuring financial accuracy and audit compliance.

---

## 📊 Report Types

### Featured Reports (GL-Powered)

**1. Daily Sales Report**

```typescript
{
  id: 'daily-sales',
  title: 'Daily Sales Report',
  description: 'Hourly revenue breakdown with real-time GL tracking',
  icon: Calendar,
  href: '/salon/reports/sales/daily',
  color: LUXE_COLORS.emerald,
  category: 'financial',
  featured: true
}
```

**Features**:
- Hourly revenue breakdown (24-hour view)
- Service vs Product revenue split
- VAT collection by hour
- Tips and discounts tracking
- Average ticket size
- Branch filtering support

**File Path**: `/src/app/salon/reports/sales/daily/page.tsx:1-765`

---

**2. Monthly Sales Report**

```typescript
{
  id: 'monthly-sales',
  title: 'Monthly Sales Report',
  description: 'Daily trends and growth analysis from GL data',
  icon: BarChart3,
  href: '/salon/reports/sales/monthly',
  color: LUXE_COLORS.gold,
  category: 'financial',
  featured: true
}
```

**Features**:
- Daily revenue trends (1-31 days)
- Month-over-month growth
- Peak days identification
- Revenue forecasting
- Branch comparison

**File Path**: `/src/app/salon/reports/sales/monthly/page.tsx`

---

### Regular Reports

**Financial Category**:
- **Revenue Report** - Track sales, services, and product revenue by period
- **Profit & Loss** - Complete P&L statement with expense breakdowns
- **Branch P&L** - Compare financial performance across branches
- **Cash Flow** - Daily cash positions and payment method breakdowns

**Operational Category**:
- **Staff Performance** - Employee productivity, services, and commission reports
- **Appointment Analytics** - Booking patterns, no-shows, and capacity utilization
- **Inventory Report** - Stock levels, usage patterns, and reorder suggestions

**Analytics Category**:
- **Customer Analytics** - Customer retention, frequency, and spending patterns
- **Service Analytics** - Popular services, pricing analysis, and trends

**File Path**: `/src/hooks/useReportsMetadata.ts:43-156`

---

## 🪝 Hooks

### useReportsMetadata

**File**: `/src/hooks/useReportsMetadata.ts` (251 lines)

**Purpose**: Manages report cards, categories, and role-based filtering

**Usage**:

```typescript
const {
  availableReports,    // All reports user can access
  featuredReports,     // Prominently displayed reports
  regularReports,      // Non-featured reports
  filteredReports,     // Filtered by selected category
  categories,          // ['all', 'financial', 'operational', 'analytics']
  totalCount,          // Total number of available reports
  countByCategory      // Count per category
} = useReportsMetadata({
  userRole: 'ORG_OWNER',           // User role for permission filtering
  selectedCategory: 'financial'    // Filter by category
})
```

**Key Features**:
- **Role-Based Filtering**: Only shows reports user has permission to view
- **Category Filtering**: Financial, Operational, Analytics
- **Featured Separation**: Featured reports displayed prominently
- **Memoized Performance**: Calculations cached for performance

**File Path**: `/src/hooks/useReportsMetadata.ts:205-250`

---

### useReportsStats

**File**: `/src/hooks/useReportsStats.ts` (203 lines)

**Purpose**: Fetches real-time dashboard statistics for reports landing page

**Usage**:

```typescript
const {
  stats,          // Real-time KPI values
  isLoading,      // Combined loading state
  error,          // Error message if any
  refetch         // Manual refetch function
} = useReportsStats({
  organizationId: 'org-uuid'
})

// Stats structure
{
  totalRevenue: 50000.00,      // This month gross revenue
  totalCustomers: 1250,        // Active customers count
  totalAppointments: 850,      // This month appointments
  averageTicket: 58.82         // Average transaction value
}
```

**Key Features**:
- **useUniversalEntityV1**: Customer count via RPC
- **useUniversalTransactionV1**: Appointments and GL Journal via RPC
- **GL-Aligned Revenue**: Uses `metadata.total_cr` from GL_JOURNAL (matches sales reports)
- **Month Filtering**: Automatic current month filtering
- **Combined Loading**: Single loading state for all data sources

**File Path**: `/src/hooks/useReportsStats.ts:83-202`

---

### useDailySalesReport

**File**: `/src/hooks/useSalonSalesReports.ts`

**Purpose**: Fetches and processes GL Journal data for daily sales report

**Usage**:

```typescript
const {
  summary,                  // Day totals
  hourlyData,               // 24-hour breakdown
  dimensionalBreakdown,     // Service vs Product split
  isLoading,
  error,
  refetch
} = useDailySalesReport(selectedDate, selectedBranchId)

// Summary structure
{
  total_gross: 5000.00,           // Gross revenue (net + VAT + tips)
  total_net: 4545.45,             // Net revenue (excluding VAT)
  total_vat: 227.27,              // VAT collected (5%)
  total_tips: 227.28,             // Tips collected
  transaction_count: 85,          // Number of transactions
  average_ticket: 58.82,          // Avg gross per transaction
  total_service: 3500.00,         // Service revenue (net)
  total_product: 1045.45,         // Product revenue (net)
  service_mix_percent: 77.02      // Service % of total net
}

// Hourly data structure (24 rows)
{
  hour: '09:00 - 10:00',
  service_net: 300.00,
  product_net: 50.00,
  tips: 17.50,
  vat: 17.50,
  gross: 385.00,
  txn_count: 5,
  avg_ticket: 77.00
}

// Dimensional breakdown (GL v2.0 only)
{
  service_gross: 3675.00,
  service_discount: 0.00,
  service_net: 3500.00,
  service_vat: 175.00,
  product_gross: 1100.00,
  product_discount: 54.55,
  product_net: 1045.45,
  product_vat: 52.27
}
```

**File Path**: `/src/hooks/useSalonSalesReports.ts`

---

## 🧩 Components

### Reports Landing Page

**File**: `/src/app/salon/reports/page.tsx` (466 lines)

**Key Sections**:

**1. KPI Cards** (Stage 1 - 0ms):
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
  <SalonLuxeKPICard
    title="Total Revenue"
    value={`AED ${stats.totalRevenue.toFixed(2)}`}
    icon={DollarSign}
    color={LUXE_COLORS.emerald}
    description="This month"
    animationDelay={0}
  />
  {/* 3 more KPI cards */}
</div>
```

**2. Featured Reports** (Stage 2 - 200ms):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {featuredReports.map(report => (
    <Link key={report.id} href={report.href} className="block group">
      <Card className="h-full transition-all hover:scale-[1.02]">
        {/* Report card with icon, title, description */}
      </Card>
    </Link>
  ))}
</div>
```

**3. Category Filter**:
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide">
  {categories.map(category => (
    <button
      onClick={() => setSelectedCategory(category)}
      className="flex-shrink-0 min-h-[44px] px-4 py-2 rounded-lg"
      style={{
        backgroundColor: selectedCategory === category ? LUXE_COLORS.gold : 'transparent'
      }}
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
      ({countByCategory[category]})
    </button>
  ))}
</div>
```

**4. All Reports Grid** (Stage 3 - 400ms):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {regularReports.map(report => (
    <Card key={report.id} className="h-full min-h-[160px]">
      {/* Report card */}
    </Card>
  ))}
</div>
```

**File Path**: `/src/app/salon/reports/page.tsx:170-434`

---

### Daily Sales Report Page

**File**: `/src/app/salon/reports/sales/daily/page.tsx` (765 lines)

**Key Sections**:

**1. Premium Header**:
```tsx
<div className="sticky top-0 z-30">
  <div className="flex items-center justify-between">
    {/* Back button + Title */}
    <div className="flex items-center gap-4">
      <Link href="/salon/reports">
        <button><ChevronLeft /></button>
      </Link>
      <h1>Daily Sales Report</h1>
    </div>

    {/* Export buttons */}
    <SalesReportExportButtons
      reportType="daily"
      reportTitle="Daily Sales Report"
      summary={summary}
      hourlyData={hourlyData}
    />
  </div>
</div>
```

**2. Filter Controls**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Date picker */}
  <EnterpriseDatePicker
    selectedDate={selectedDate}
    onDateChange={setSelectedDate}
    maxDate={new Date()}  // Prevent future dates
  />

  {/* Branch selector */}
  <BranchSelector
    organizationId={organizationId}
    selectedBranchId={selectedBranchId}
    onBranchChange={setSelectedBranchId}
  />
</div>
```

**3. Summary Cards** (4 cards):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Total Revenue */}
  <div className="rounded-2xl p-6">
    <DollarSign className="w-8 h-8" />
    <div className="text-3xl font-bold">
      AED {summary.total_gross.toFixed(2)}
    </div>
    <div className="text-sm">Total Gross Revenue</div>
    <div className="text-xs">
      Net: AED {summary.total_net.toFixed(2)}
    </div>
  </div>
  {/* 3 more cards: Transactions, VAT, Tips */}
</div>
```

**4. Hourly Breakdown Table**:
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th>Hour</th>
      <th>Service Revenue</th>
      <th>Product Revenue</th>
      <th>Tips</th>
      <th>VAT</th>
      <th>Gross Total</th>
      <th>Transactions</th>
      <th>Avg Ticket</th>
    </tr>
  </thead>
  <tbody>
    {hourlyData.map(row => (
      <tr key={row.hour}>
        <td>{row.hour}</td>
        <td>AED {row.service_net.toFixed(2)}</td>
        <td>AED {row.product_net.toFixed(2)}</td>
        <td>AED {row.tips.toFixed(2)}</td>
        <td>AED {row.vat.toFixed(2)}</td>
        <td className="font-bold">AED {row.gross.toFixed(2)}</td>
        <td><Badge>{row.txn_count}</Badge></td>
        <td>AED {row.avg_ticket.toFixed(2)}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**5. VAT Compliance Report** (GL v2.0 only):
```tsx
{dimensionalBreakdown && (
  <div className="rounded-2xl">
    <h2>VAT Compliance Report</h2>

    {/* Service vs Product VAT cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>VAT on Services: AED {dimensionalBreakdown.service_vat}</div>
      <div>VAT on Products: AED {dimensionalBreakdown.product_vat}</div>
      <div>Total VAT: AED {dimensionalBreakdown.service_vat + dimensionalBreakdown.product_vat}</div>
    </div>

    {/* Revenue breakdown table */}
    <table>
      <thead>
        <tr>
          <th>Revenue Type</th>
          <th>Gross</th>
          <th>Discount</th>
          <th>Net</th>
          <th>VAT @ 5%</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Services</td>
          <td>{dimensionalBreakdown.service_gross}</td>
          <td>{dimensionalBreakdown.service_discount}</td>
          <td>{dimensionalBreakdown.service_net}</td>
          <td>{dimensionalBreakdown.service_vat}</td>
          <td>{dimensionalBreakdown.service_net + dimensionalBreakdown.service_vat}</td>
        </tr>
        <tr>
          <td>Products</td>
          <td>{dimensionalBreakdown.product_gross}</td>
          <td>{dimensionalBreakdown.product_discount}</td>
          <td>{dimensionalBreakdown.product_net}</td>
          <td>{dimensionalBreakdown.product_vat}</td>
          <td>{dimensionalBreakdown.product_net + dimensionalBreakdown.product_vat}</td>
        </tr>
      </tbody>
    </table>
  </div>
)}
```

**File Path**: `/src/app/salon/reports/sales/daily/page.tsx:192-757`

---

### Export Components

**SalesReportExportButtons** - Excel & PDF export

**File**: `/src/components/salon/reports/SalesReportExportButtons.tsx`

**Usage**:

```tsx
<SalesReportExportButtons
  reportType="daily"              // 'daily' | 'monthly'
  reportTitle="Daily Sales Report"
  reportPeriod="Monday, January 6, 2025"
  reportDate="2025-01-06"
  branchName="All Branches"
  currency="AED"
  summary={summary}               // Report totals
  hourlyData={hourlyData}         // Hourly breakdown (optional)
  dailyData={dailyData}           // Daily breakdown (optional)
/>
```

**Features**:
- **Excel Export**: Professional XLSX with formulas, formatting, and charts
- **PDF Export**: Print-friendly PDF with branding
- **Custom Styling**: Luxe color scheme with gold accents
- **Formulas**: SUM formulas for totals
- **Charts**: Revenue trend charts (coming soon)

---

## 🧮 GL-Based Sales Reports

### GL Journal Structure

Sales reports use **GL_JOURNAL transactions** with enhanced metadata:

```typescript
// GL Journal Transaction
{
  id: 'txn-uuid',
  transaction_type: 'GL_JOURNAL',
  smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
  transaction_date: '2025-01-06T14:30:00Z',
  organization_id: 'org-uuid',

  // Enhanced metadata (GL v2.0)
  metadata: {
    // Totals
    total_cr: 1000.00,          // Total credit (gross revenue)
    total_dr: 1000.00,          // Total debit (must balance)

    // Service revenue
    service_gross: 800.00,      // Service gross before discount
    service_discount: 0.00,     // Service discount applied
    service_net: 800.00,        // Service net (gross - discount)
    service_vat: 40.00,         // Service VAT @ 5%

    // Product revenue
    product_gross: 200.00,      // Product gross before discount
    product_discount: 10.00,    // Product discount applied
    product_net: 190.00,        // Product net (gross - discount)
    product_vat: 9.50,          // Product VAT @ 5%

    // Additional
    tips: 10.50,                // Tips collected
    branch_id: 'branch-uuid'    // Branch attribution
  },

  // GL Lines (balanced)
  lines: [
    // Debit: Cash/Card
    { account: '110000', side: 'DR', amount: 1000.00 },

    // Credits: Revenue + VAT + Tips
    { account: '410000', side: 'CR', amount: 990.00 },  // Net revenue
    { account: '220100', side: 'CR', amount: 49.50 },   // VAT payable
    { account: '225000', side: 'CR', amount: 10.50 }    // Tips payable
  ]
}
```

### Revenue Calculation

**Gross Revenue** (Total Credit):
```typescript
const grossRevenue = metadata.total_cr
// = service_net + service_vat + product_net + product_vat + tips
```

**Net Revenue** (Excluding VAT):
```typescript
const netRevenue = metadata.service_net + metadata.product_net
// = (service_gross - service_discount) + (product_gross - product_discount)
```

**VAT Collected**:
```typescript
const vatCollected = metadata.service_vat + metadata.product_vat
// = (service_net × 0.05) + (product_net × 0.05)
```

**Tips**:
```typescript
const tips = metadata.tips || 0
```

**Average Ticket**:
```typescript
const averageTicket = grossRevenue / transactionCount
```

---

## 📤 Data Calculations

### Hourly Aggregation (Daily Report)

```typescript
// Group GL Journals by hour
const hourlyMap = new Map<string, HourData>()

glJournals.forEach(txn => {
  const hour = format(parseISO(txn.transaction_date), 'HH:00')

  if (!hourlyMap.has(hour)) {
    hourlyMap.set(hour, {
      hour: `${hour} - ${addHours(hour, 1)}`,
      service_net: 0,
      product_net: 0,
      tips: 0,
      vat: 0,
      gross: 0,
      txn_count: 0,
      avg_ticket: 0
    })
  }

  const hourData = hourlyMap.get(hour)!
  hourData.service_net += txn.metadata.service_net || 0
  hourData.product_net += txn.metadata.product_net || 0
  hourData.tips += txn.metadata.tips || 0
  hourData.vat += (txn.metadata.service_vat || 0) + (txn.metadata.product_vat || 0)
  hourData.gross += txn.metadata.total_cr || 0
  hourData.txn_count += 1
})

// Calculate average ticket per hour
hourlyMap.forEach(hour => {
  hour.avg_ticket = hour.txn_count > 0 ? hour.gross / hour.txn_count : 0
})

// Convert to array and sort by hour
const hourlyData = Array.from(hourlyMap.values()).sort((a, b) =>
  a.hour.localeCompare(b.hour)
)
```

### Daily Aggregation (Monthly Report)

```typescript
// Group GL Journals by day
const dailyMap = new Map<string, DayData>()

glJournals.forEach(txn => {
  const day = format(parseISO(txn.transaction_date), 'yyyy-MM-dd')

  if (!dailyMap.has(day)) {
    dailyMap.set(day, {
      day,
      service_net: 0,
      product_net: 0,
      tips: 0,
      vat: 0,
      gross: 0,
      txn_count: 0,
      avg_ticket: 0
    })
  }

  const dayData = dailyMap.get(day)!
  dayData.service_net += txn.metadata.service_net || 0
  dayData.product_net += txn.metadata.product_net || 0
  dayData.tips += txn.metadata.tips || 0
  dayData.vat += (txn.metadata.service_vat || 0) + (txn.metadata.product_vat || 0)
  dayData.gross += txn.metadata.total_cr || 0
  dayData.txn_count += 1
})

// Calculate average ticket per day
dailyMap.forEach(day => {
  day.avg_ticket = day.txn_count > 0 ? day.gross / day.txn_count : 0
})

// Convert to array and sort by day
const dailyData = Array.from(dailyMap.values()).sort((a, b) =>
  a.day.localeCompare(b.day)
)
```

### Dimensional Breakdown (GL v2.0)

```typescript
// Only available if GL v2.0 metadata present
const dimensionalBreakdown = {
  service_gross: sum(glJournals.map(t => t.metadata.service_gross || 0)),
  service_discount: sum(glJournals.map(t => t.metadata.service_discount || 0)),
  service_net: sum(glJournals.map(t => t.metadata.service_net || 0)),
  service_vat: sum(glJournals.map(t => t.metadata.service_vat || 0)),

  product_gross: sum(glJournals.map(t => t.metadata.product_gross || 0)),
  product_discount: sum(glJournals.map(t => t.metadata.product_discount || 0)),
  product_net: sum(glJournals.map(t => t.metadata.product_net || 0)),
  product_vat: sum(glJournals.map(t => t.metadata.product_vat || 0))
}
```

---

## 📊 Export Features

### Excel Export

**Features**:
- **Professional Styling**: Luxe color scheme with gold header
- **Formulas**: SUM formulas for totals
- **Formatting**: Currency, number, and date formatting
- **Multiple Sheets**: Summary + Detailed breakdown
- **Charts**: Revenue trend charts (coming soon)

**Generated File Structure**:
```
HERA_Daily_Sales_Report_2025-01-06_14-30-00.xlsx
├── Summary Sheet
│   ├── Report Header (organization, date, branch)
│   ├── KPI Cards (gross, net, VAT, tips, transactions, avg ticket)
│   └── Totals Row
└── Hourly Breakdown Sheet
    ├── Column Headers (Hour, Service, Product, Tips, VAT, Gross, Txns, Avg)
    ├── 24 hourly rows
    └── Totals Row (with SUM formulas)
```

### PDF Export

**Features**:
- **Print-Friendly**: Optimized for A4/Letter landscape
- **Professional Branding**: Organization name and logo
- **Clean Layout**: Minimal styling for clarity
- **Page Breaks**: Automatic page breaks for long tables

**Print Styles**:
```css
@media print {
  @page {
    size: landscape;
    margin: 1cm;
  }
  .print\\:hidden {
    display: none !important;
  }
}
```

---

## 🔐 Role-Based Access Control

### Permission Matrix

| Report Type         | ORG_OWNER | OWNER | USER | RECEPTIONIST |
|---------------------|-----------|-------|------|--------------|
| Daily Sales         | ✅        | ✅    | ✅   | ❌           |
| Monthly Sales       | ✅        | ✅    | ✅   | ❌           |
| Revenue Report      | ✅        | ✅    | ✅   | ❌           |
| Profit & Loss       | ✅        | ✅    | ✅   | ❌           |
| Branch P&L          | ✅        | ✅    | ✅   | ❌           |
| Customer Analytics  | ✅        | ✅    | ✅   | ❌           |
| Staff Performance   | ✅        | ✅    | ✅   | ❌           |
| Appointment Analytics | ✅      | ✅    | ✅   | ❌           |
| Inventory Report    | ✅        | ✅    | ✅   | ❌           |
| Service Analytics   | ✅        | ✅    | ✅   | ❌           |
| Cash Flow           | ✅        | ✅    | ✅   | ❌           |

### Role Configuration

```typescript
const REPORT_CARDS: ReportCard[] = [
  {
    id: 'daily-sales',
    title: 'Daily Sales Report',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']  // Define access
  }
]

// Filtering logic
const roleFilteredReports = userRole
  ? REPORT_CARDS.filter(report => {
      const normalizedRole = userRole.toUpperCase()
      return report.requiredRoles.some(r => r === normalizedRole)
    })
  : REPORT_CARDS
```

**File Path**: `/src/hooks/useReportsMetadata.ts:213-218`

---

## 📝 Common Tasks

### Task 1: View Daily Sales Report

```typescript
// Navigate to daily sales report
router.push('/salon/reports/sales/daily')

// Or click featured report card from landing page
```

### Task 2: Filter Report by Branch

```typescript
// Use BranchSelector component
<BranchSelector
  organizationId={organizationId}
  selectedBranchId={selectedBranchId}
  onBranchChange={(branchId) => {
    setSelectedBranchId(branchId)
    // Report automatically refreshes
  }}
/>
```

### Task 3: Export Report to Excel

```typescript
// Click Excel export button (handled by component)
<SalesReportExportButtons
  reportType="daily"
  summary={summary}
  hourlyData={hourlyData}
/>

// Generates: HERA_Daily_Sales_Report_2025-01-06_14-30-00.xlsx
```

### Task 4: Print Report to PDF

```typescript
// Click Print button or use browser print (Ctrl+P)
window.print()

// Print styles automatically applied:
// - Hides buttons, filters, navigation
// - Landscape orientation
// - Clean layout
```

### Task 5: Add New Report Type

```typescript
// 1. Add report configuration
const REPORT_CARDS: ReportCard[] = [
  {
    id: 'new-report',
    title: 'New Report Title',
    description: 'Report description',
    icon: ReportIcon,
    href: '/salon/reports/new-report',  // Create route
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER']
  }
]

// 2. Create report page
// /src/app/salon/reports/new-report/page.tsx

// 3. Create report hook
// /src/hooks/useNewReport.ts

// 4. Implement data fetching and calculations
```

### Task 6: Customize Report Styling

```typescript
// Update Luxe colors in constants
const LUXE_COLORS = {
  emerald: '#0F6F5C',  // Change report accent color
  gold: '#D4AF37',     // Change header color
  // ...
}

// Or override per report
<div style={{
  background: `linear-gradient(135deg, #custom-color-start, #custom-color-end)`,
  border: `1px solid #custom-border`
}}>
```

---

## 🧪 Testing

### Unit Tests

**Test Revenue Calculation**:

```typescript
describe('extractGrossRevenue', () => {
  test('Calculates gross revenue from GL metadata', () => {
    const glJournals = [
      {
        metadata: {
          total_cr: 1000.00,
          service_net: 800.00,
          service_vat: 40.00,
          product_net: 150.00,
          product_vat: 7.50,
          tips: 2.50
        }
      }
    ]

    const revenue = extractGrossRevenue(glJournals)
    expect(revenue).toBe(1000.00)
  })
})
```

### Integration Tests

**Test Report Data Flow**:

```typescript
describe('Daily Sales Report', () => {
  test('Fetches and displays GL Journal data', async () => {
    const { result } = renderHook(() =>
      useDailySalesReport(new Date(), null)
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.summary).toBeDefined()
    expect(result.current.hourlyData).toHaveLength(24)
    expect(result.current.summary.total_gross).toBeGreaterThan(0)
  })
})
```

### E2E Tests

**Test Report Export**:

```typescript
describe('Report Export', () => {
  test('Exports daily sales to Excel', async () => {
    await page.goto('/salon/reports/sales/daily')

    // Wait for data to load
    await page.waitForSelector('[data-testid="hourly-table"]')

    // Click Excel export
    await page.click('[data-testid="export-excel-btn"]')

    // Verify file download
    const download = await page.waitForEvent('download')
    expect(download.suggestedFilename()).toContain('HERA_Daily_Sales_Report')
    expect(download.suggestedFilename()).toEndWith('.xlsx')
  })
})
```

---

## ⚡ Performance Optimization

### Progressive Loading

Reports landing page uses 3-stage progressive loading:

```typescript
const [loadStage, setLoadStage] = useState(1)

useEffect(() => {
  if (isAuthenticated) {
    // Stage 1: KPI cards (immediate)
    setLoadStage(1)

    // Stage 2: Featured reports (200ms delay)
    setTimeout(() => setLoadStage(2), 200)

    // Stage 3: All reports grid (400ms delay)
    setTimeout(() => setLoadStage(3), 400)
  }
}, [isAuthenticated])

// Render stages progressively
{loadStage >= 1 && <KPICards />}
{loadStage >= 2 && <FeaturedReports />}
{loadStage >= 3 && <AllReportsGrid />}
```

**Benefits**:
- **Instant Page Render**: No loading spinner on initial load
- **Perceived Performance**: Content appears progressively
- **Better UX**: Users see content immediately

**File Path**: `/src/app/salon/reports/page.tsx:59-75`

---

### React Query Caching

```typescript
// Reports stats hook uses smart caching
const { data } = useQuery({
  queryKey: ['reports-stats', organizationId],
  queryFn: fetchReportsStats,
  staleTime: 30000,        // 30 seconds - stats don't change frequently
  cacheTime: 5 * 60 * 1000, // 5 minutes in cache
  refetchOnMount: 'always'  // Always refetch on mount
})
```

---

### Memoization

```typescript
// Report metadata memoized for performance
const result = useMemo(() => {
  const roleFilteredReports = userRole
    ? REPORT_CARDS.filter(report => {
        const normalizedRole = userRole.toUpperCase()
        return report.requiredRoles.some(r => r === normalizedRole)
      })
    : REPORT_CARDS

  const categoryFiltered =
    selectedCategory === 'all'
      ? roleFilteredReports
      : roleFilteredReports.filter(r => r.category === selectedCategory)

  return {
    availableReports: roleFilteredReports,
    filteredReports: categoryFiltered,
    // ...
  }
}, [userRole, selectedCategory])
```

**File Path**: `/src/hooks/useReportsMetadata.ts:211-247`

---

## 📚 Additional Resources

### Related Features

- [DASHBOARD.md](./DASHBOARD.md) - Dashboard metrics and KPIs
- [POINT-OF-SALE.md](./POINT-OF-SALE.md) - POS system (GL Journal source)
- [APPOINTMENTS.md](./APPOINTMENTS.md) - Appointments (transaction source)

### Technical References

- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema
- [MOBILE-LAYOUT.md](./MOBILE-LAYOUT.md) - Mobile-first design patterns

### External Documentation

- [React Query Documentation](https://tanstack.com/query/latest)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [date-fns Documentation](https://date-fns.org/)

---

<div align="center">

**Built with HERA DNA** | **Reports & Analytics v1.0 (Production Ready)**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Settings →](./SETTINGS.md)

**For Support**: Check documentation or contact HERA development team

</div>
