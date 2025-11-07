# Dashboard Feature Guide

**Version**: 2.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURE.DASHBOARD.v1`

> **Complete reference for the Salon Dashboard feature with progressive loading, period filters, and comprehensive KPIs**

---

## 📋 Overview

### Purpose
The Salon Dashboard provides a comprehensive real-time overview of salon operations with:
- Progressive 5-stage component loading for optimal perceived performance
- Enterprise-grade global period filtering (today, 7 days, 30 days, YTD, all time)
- Component-level filter overrides for focused analysis
- Mobile-first responsive design with iOS/Android native patterns
- Real-time KPIs for revenue, appointments, staff, customers, and services

### User Roles
- **Owner/Admin**: Full access to all metrics and analytics
- **Manager**: Access to operational metrics and staff performance
- **Receptionist**: Redirected to specialized receptionist dashboard (`/salon/receptionist`)

### Related Features
- [Reports](/docs/salon/features/REPORTS.md) - Detailed historical analysis
- [Appointments](/docs/salon/features/APPOINTMENTS.md) - Appointment management
- [Point of Sale](/docs/salon/features/POINT-OF-SALE.md) - Revenue generation
- [Staff Management](/docs/salon/features/STAFF.md) - Staff performance tracking

---

## 🏗️ Architecture

### Data Model

**Sacred Six Tables Used:**
1. **core_entities**
   - Customers (`entity_type: 'CUSTOMER'`)
   - Services (`entity_type: 'SERVICE'`)
   - Products (`entity_type: 'PRODUCT'`)
   - Staff (`entity_type: 'STAFF'`)

2. **core_dynamic_data**
   - Customer VIP status
   - Product pricing and stock levels
   - Staff ratings and utilization metrics

3. **universal_transactions**
   - GL_JOURNAL transactions for revenue (`transaction_type: 'GL_JOURNAL'`)
   - SALE transactions for service analytics (`transaction_type: 'SALE'`)
   - APPOINTMENT transactions for booking analytics (`transaction_type: 'APPOINTMENT'`)

4. **universal_transaction_lines**
   - Service line items from SALE transactions
   - Payment method breakdown from GL_JOURNAL lines

**Smart Codes:**
```typescript
'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1' // Legacy GL_JOURNAL
'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2' // Enhanced GL_JOURNAL with payment_methods array
'HERA.SALON.TXN.APPOINTMENT.v1'             // Appointment transactions
'HERA.SALON.TXN.SALE.v1'                    // Sale transactions
```

### Component Hierarchy

```
SalonDashboard (Provider Wrapper)
  └── DashboardFilterProvider
        └── DashboardContent (Main Component)
              ├── PremiumMobileHeader (Stage 1 - Instant)
              ├── Desktop Header (Stage 1 - Instant)
              ├── Global Period Filter Bar (Stage 1 - Instant)
              ├── Mobile Period Filter (Stage 1 - Instant)
              ├── ComplianceAlertBanner (Stage 1 - Instant)
              ├── HeroMetrics (Stage 1 - Lazy loaded with Suspense)
              ├── AppointmentAnalytics (Stage 2 - +300ms delay)
              ├── RevenueTrends (Stage 3 - +600ms delay)
              ├── StaffPerformance (Stage 4 - +900ms delay)
              └── CustomerAndServiceInsights + FinancialOverview (Stage 5 - +1200ms delay)
```

### State Management

**Context Providers:**
```typescript
// 1. Organization context (from SecuredSalonProvider)
const { organizationId, organization, isLoading: orgLoading } = useSecuredSalonContext()

// 2. Security/role context
const { role, user, isLoading: securityLoading, isAuthenticated } = useSalonSecurity()

// 3. Global filter context
const { globalPeriod, setGlobalPeriod, getOverrideCount, clearAllOverrides } = useDashboardFilter()

// 4. Dashboard data
const { kpis, isLoading: dashboardLoading, formatCurrency } = useSalonDashboard({
  organizationId,
  currency: 'AED',
  selectedPeriod: globalPeriod
})
```

### API Integration

**RPC Functions Used:**
- `hera_entities_crud_v1` - Fetch customers, services, products, staff
- `hera_txn_crud_v1` - Fetch transactions (GL_JOURNAL, SALE, APPOINTMENT)

**Universal API v2 Endpoints:**
- `/api/v2/entities` - Entity CRUD operations
- `/api/v2/transactions` - Transaction queries with filters

---

## 🔧 Key Components

### 1. Main Dashboard Page
**File**: `/src/app/salon/dashboard/page.tsx` (652 lines)

**Purpose**: Entry point that wraps DashboardContent with DashboardFilterProvider

**Usage**:
```tsx
export default function SalonDashboard() {
  return (
    <DashboardFilterProvider defaultPeriod="last30Days">
      <DashboardContent />
    </DashboardFilterProvider>
  )
}
```

### 2. DashboardContent Component
**File**: `/src/app/salon/dashboard/page.tsx` (lines 58-634)

**Purpose**: Main dashboard implementation with progressive loading and authentication states

**Key Features**:
- Three authentication states:
  1. Not authenticated (Authenticating...)
  2. Authenticated but role loading (Setting up workspace...)
  3. Receptionist redirect (automatic navigation to `/salon/receptionist`)
- Progressive 5-stage component loading (300ms intervals)
- Global loading animation integration (70-100% progress)
- Responsive mobile/desktop layouts

**Progressive Loading Stages**:
```typescript
// Stage 1: Instant (0ms) - Headers and filters
loadStage === 1 → Headers, period filters, compliance banner, HeroMetrics

// Stage 2: +300ms - Appointment analytics
loadStage === 2 → AppointmentAnalytics

// Stage 3: +600ms - Revenue trends
loadStage === 3 → RevenueTrends

// Stage 4: +900ms - Staff performance
loadStage === 4 → StaffPerformance

// Stage 5: +1200ms - Customer insights and financial overview
loadStage === 5 → CustomerAndServiceInsights + FinancialOverview
```

### 3. PremiumMobileHeader
**File**: `/src/components/salon/mobile/PremiumMobileHeader.tsx`

**Purpose**: iOS-style mobile header with notifications

**Props**:
```typescript
interface PremiumMobileHeaderProps {
  title: string                     // Page title
  subtitle?: string                 // Secondary info
  showNotifications?: boolean       // Show notification bell
  notificationCount?: number        // Badge count
  shrinkOnScroll?: boolean         // Shrink effect on scroll
}
```

**Usage**:
```tsx
<PremiumMobileHeader
  title={organization?.entity_name || 'Dashboard'}
  subtitle={`${role} • ${kpis.totalCustomers} customers`}
  showNotifications={true}
  notificationCount={kpis.appointmentsByStatus?.pending || 0}
  shrinkOnScroll={true}
/>
```

### 4. Dashboard Section Components

#### HeroMetrics
**File**: `/src/components/salon/dashboard/HeroMetrics.tsx`

**Purpose**: Display key performance indicators in card format

**Props**:
```typescript
interface HeroMetricsProps {
  kpis: SalonDashboardKPIs
  formatCurrency: (amount: number) => string
  selectedPeriod: TimePeriod
}
```

**Displays**:
- Total Revenue (with growth percentage)
- Active Customers (with new customers count)
- Today's Appointments (with growth percentage)
- Staff On Duty (with utilization rate)

#### AppointmentAnalytics
**File**: `/src/components/salon/dashboard/AppointmentAnalytics.tsx`

**Purpose**: Appointment status breakdown and conversion metrics

**Displays**:
- Appointments by status (completed, in_progress, pending, cancelled, no_show)
- Pie chart visualization
- Conversion rate
- No-show rate
- Cancellation rate

#### RevenueTrends
**File**: `/src/components/salon/dashboard/RevenueTrends.tsx`

**Purpose**: Revenue trends over time with line charts

**Displays**:
- Last 7 days revenue trend
- Last 30 days revenue trend
- Month-to-date revenue
- Average transaction value
- Revenue comparison vs previous period

#### StaffPerformance
**File**: `/src/components/salon/dashboard/StaffPerformance.tsx`

**Purpose**: Staff leaderboard and performance metrics

**Displays**:
- Top 5 staff by revenue
- Individual staff performance cards
- Services completed
- Average rating
- Utilization rate (with period-aware calculation)

#### CustomerAndServiceInsights
**File**: `/src/components/salon/dashboard/CustomerAndServiceInsights.tsx`

**Purpose**: Customer behavior and service popularity analytics

**Displays**:
- New vs returning customers
- Customer retention rate
- Top 5 services by bookings
- Service revenue analysis
- VIP customer activity

#### FinancialOverview
**File**: `/src/components/salon/dashboard/FinancialOverview.tsx`

**Purpose**: Financial metrics and payment method breakdown

**Displays**:
- Gross profit and profit margin
- Payment method split (cash, card, bank transfer, voucher)
- Revenue by payment method
- Financial metrics comparison across periods

---

## 🔌 Hooks & Utilities

### useSalonDashboard Hook
**File**: `/src/hooks/useSalonDashboard.ts` (1127 lines)

**Purpose**: Comprehensive enterprise-grade dashboard data fetching and KPI calculations

**Configuration**:
```typescript
interface UseSalonDashboardConfig {
  organizationId: string
  currency?: string
  selectedPeriod?: 'today' | 'last7Days' | 'last30Days' | 'yearToDate' | 'allTime'
}
```

**Returns**:
```typescript
interface UseSalonDashboardReturn {
  kpis: SalonDashboardKPIs          // Comprehensive KPIs
  customers: Entity[]               // Raw customer data
  services: Entity[]                // Raw service data
  products: Entity[]                // Raw product data
  staff: Entity[]                   // Raw staff data
  tickets: Transaction[]            // GL_JOURNAL transactions
  appointments: Transaction[]       // APPOINTMENT transactions
  isLoading: boolean                // Loading state
  refreshAll: () => Promise<void>   // Refresh all data
  formatCurrency: (amount: number) => string
  refetchCustomers: () => Promise<void>
  refetchServices: () => Promise<void>
  refetchProducts: () => Promise<void>
  refetchStaff: () => Promise<void>
  refetchTickets: () => Promise<void>
  refetchAppointments: () => Promise<void>
}
```

**Key Features**:
1. **RPC-Based Data Fetching**: Uses `useUniversalEntityV1` and `useUniversalTransactionV1` hooks
2. **Period-Aware Calculations**: All metrics respect the selected time period
3. **Revenue Alignment**: Extracts revenue from GL_JOURNAL metadata (same as Reports page)
4. **Payment Method Analysis**: Supports both v1 (line_data) and v2 (payment_methods array) formats
5. **Enterprise Analytics**: Split analysis by time periods for all metrics

**KPI Calculation Logic**:
```typescript
// Revenue calculation aligned with Reports page
function extractGrossRevenue(glJournalTransactions: any[]): number {
  let total = 0
  glJournalTransactions.forEach(txn => {
    if (txn.metadata && typeof txn.metadata === 'object') {
      total += txn.metadata.total_cr || 0  // total_cr = gross revenue
    }
  })
  return total
}

// Payment method breakdown with v1/v2 format support
function calculatePaymentBreakdown(transactions: any[], startDate?: Date, endDate?: Date): PaymentMethodBreakdown {
  return filteredTransactions.reduce((acc, t) => {
    // Strategy 1: Enhanced metadata (v2)
    const paymentMethodsMetadata = t.metadata?.payment_methods || []
    if (Array.isArray(paymentMethodsMetadata) && paymentMethodsMetadata.length > 0) {
      paymentMethodsMetadata.forEach((payment: any) => {
        const method = (payment.method || '').toLowerCase()
        const amount = payment.amount || 0
        // Accumulate by method type
      })
      return acc
    }

    // Strategy 2: GL lines (v1)
    const glLines = t.lines || []
    const paymentLines = glLines.filter((line: any) =>
      line.line_type === 'gl' &&
      line.line_data?.side === 'DR' &&
      line.line_data?.payment_method
    )
    // Extract payment methods from lines

    // Strategy 3: Fallback to cash
    return acc
  }, { cash: 0, card: 0, bank_transfer: 0, voucher: 0 })
}

// Financial metrics calculation
function calculateFinancialMetrics(
  transactions: any[],
  startDate?: Date,
  endDate?: Date,
  profitMarginRate: number = 0.6
): PeriodFinancialMetrics {
  const revenue = extractGrossRevenue(filteredTransactions)
  const transactionCount = filteredTransactions.length
  const grossProfit = revenue * profitMarginRate
  const profitMargin = profitMarginRate * 100
  const averageTransactionValue = transactionCount > 0 ? revenue / transactionCount : 0

  return { revenue, grossProfit, profitMargin, transactionCount, averageTransactionValue }
}
```

**Period-Aware Calculations**:
```typescript
// Get date range based on selected period
const getPeriodDateRange = () => {
  switch (selectedPeriod) {
    case 'today':
      return { start: todayStart, end: todayEnd }
    case 'last7Days':
      return { start: startOfDay(sevenDaysAgo), end: todayEnd }
    case 'last30Days':
      return { start: startOfDay(thirtyDaysAgo), end: todayEnd }
    case 'yearToDate':
      return { start: yearStart, end: todayEnd }
    case 'allTime':
    default:
      return null // No date filtering
  }
}

// Filter transactions by period
const periodTickets = periodRange
  ? completedTickets.filter(t => {
      const txDate = parseISO(t.transaction_date || t.created_at)
      return txDate >= periodRange.start && txDate <= periodRange.end
    })
  : completedTickets

// Calculate metrics for filtered data
const periodRevenue = extractGrossRevenue(periodTickets)
const averageTransactionValue = periodTickets.length > 0
  ? periodRevenue / periodTickets.length
  : 0
```

### DashboardFilterContext
**File**: `/src/contexts/DashboardFilterContext.tsx` (262 lines)

**Purpose**: Enterprise-grade global filter management with component-level overrides

**API**:
```typescript
interface DashboardFilterContextValue {
  // Global filter
  globalPeriod: TimePeriod
  setGlobalPeriod: (period: TimePeriod) => void

  // Component-level filters
  getComponentPeriod: (componentId: string) => TimePeriod
  setComponentOverride: (componentId: string, period: TimePeriod | null) => void
  hasOverride: (componentId: string) => boolean
  clearComponentOverride: (componentId: string) => void
  clearAllOverrides: () => void

  // Metadata
  getOverrideCount: () => number
  getAllOverrides: () => ComponentFilter[]
}
```

**Usage Example**:
```tsx
function AnalyticsSection() {
  const {
    globalPeriod,
    getComponentPeriod,
    setComponentOverride,
    hasOverride
  } = useDashboardFilter()

  // Get effective period for this component
  const effectivePeriod = getComponentPeriod('revenue-trends')

  // Allow user to override global filter
  const handlePeriodChange = (period: TimePeriod) => {
    setComponentOverride('revenue-trends', period)
  }

  // Clear override and use global filter
  const handleClearOverride = () => {
    setComponentOverride('revenue-trends', null)
  }

  return (
    <div>
      {hasOverride('revenue-trends') && (
        <Badge variant="warning">Custom Filter Active</Badge>
      )}
      {/* Component content */}
    </div>
  )
}
```

---

## 🎨 Patterns & Conventions

### Progressive Loading Pattern

**Why**: Improves perceived performance by showing content incrementally instead of a blocking loader

**Implementation**:
```typescript
// 1. Initialize load stage
const [loadStage, setLoadStage] = useState(1)

// 2. Progressive stage loading (300ms intervals)
useEffect(() => {
  if (isAuthenticated && !orgLoading && !securityLoading) {
    const stages = [2, 3, 4, 5]
    stages.forEach((stage, index) => {
      setTimeout(() => {
        setLoadStage(stage)
      }, index * 300)
    })
  }
}, [isAuthenticated, orgLoading, securityLoading])

// 3. Conditional rendering with lazy loading
{loadStage >= 1 && (
  <div className="animate-fadeInUp">
    <Suspense fallback={<FastSkeleton />}>
      <HeroMetrics kpis={kpis} formatCurrency={formatCurrency} selectedPeriod={globalPeriod} />
    </Suspense>
  </div>
)}

{loadStage >= 2 && (
  <div className="animate-fadeInUp">
    <Suspense fallback={<ComponentSkeleton />}>
      <AppointmentAnalytics kpis={kpis} selectedPeriod={globalPeriod} />
    </Suspense>
  </div>
)}
```

**Benefits**:
- Page feels responsive immediately (Stage 1 loads instantly)
- Reduces Time to Interactive (TTI) metric
- Prevents "flash of empty content"
- Better mobile performance on slow connections

### Period-Aware Data Filtering

**Why**: Single data load with instant filter switching (no API re-fetch required)

**Implementation**:
```typescript
// 1. Load all data once (with sensible limits)
const { transactions: tickets } = useUniversalTransactionV1({
  organizationId,
  filters: {
    transaction_type: 'GL_JOURNAL',
    limit: 1000,
    include_lines: true
  }
})

// 2. Filter in memory based on selected period
const periodTickets = periodRange
  ? tickets.filter(t => {
      const txDate = parseISO(t.transaction_date || t.created_at)
      return txDate >= periodRange.start && txDate <= periodRange.end
    })
  : tickets

// 3. Calculate metrics on filtered data
const periodRevenue = extractGrossRevenue(periodTickets)
const periodAppointments = periodTickets.length
const averageTransactionValue = periodAppointments > 0
  ? periodRevenue / periodAppointments
  : 0
```

**Benefits**:
- Instant filter switching (< 50ms vs 500ms+ API call)
- Reduced API load
- Better user experience
- Consistent data across all sections

### Responsive Mobile/Desktop Layouts

**Mobile Header** (iOS-style):
```tsx
{/* iOS status bar spacer - MANDATORY */}
<div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

{/* Mobile header with shrink-on-scroll */}
<PremiumMobileHeader
  title="Dashboard"
  subtitle="Manager • 150 customers"
  showNotifications={true}
  notificationCount={5}
  shrinkOnScroll={true}
/>
```

**Desktop Header** (SAP Fiori-style):
```tsx
<div className="hidden md:block sticky top-0 z-30 mb-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="py-6 flex items-center justify-between">
      {/* Organization icon + title */}
      <div className="flex items-center gap-6">
        <div className="p-4 rounded-xl" style={{background: LUXE_COLORS.gold}}>
          <Scissors className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Salon Dashboard</h1>
          <p className="text-sm">Manager Dashboard • Monday, January 7, 2025</p>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5" />
        <div>
          <div className="font-semibold">Demo User</div>
          <div className="text-xs">demo@hairtalkz.com</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Period Filter** (Responsive):
```tsx
{/* Desktop filter bar - sticky with blur backdrop */}
<div className="hidden md:block sticky top-[120px] z-20 mb-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Calendar className="w-5 h-5" />
      <h3>Global Time Period Filter</h3>
      {getOverrideCount() > 0 && (
        <Badge>{getOverrideCount()} Override{getOverrideCount() !== 1 ? 's' : ''}</Badge>
      )}
    </div>

    <div className="flex gap-2">
      {['today', 'last7Days', 'last30Days', 'yearToDate', 'allTime'].map((period) => (
        <button
          key={period}
          onClick={() => setGlobalPeriod(period)}
          className={globalPeriod === period ? 'active' : ''}
        >
          {getPeriodLabel(period)}
        </button>
      ))}
    </div>
  </div>
</div>

{/* Mobile filter - horizontal scroll */}
<div className="md:hidden px-4 mb-6">
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {['today', 'last7Days', 'last30Days', 'yearToDate', 'allTime'].map((period) => (
      <button
        key={period}
        onClick={() => setGlobalPeriod(period)}
        className="flex-shrink-0 px-4 py-2 rounded-lg active:scale-95"
      >
        {getPeriodLabel(period)}
      </button>
    ))}
  </div>
</div>
```

### Authentication State Handling

**Three-State Pattern**:
```typescript
// State 1: Not authenticated at all
if (!isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
      <h3>Authenticating...</h3>
    </div>
  )
}

// State 2: Authenticated but role/org loading
if (isAuthenticated && (securityLoading || orgLoading || !role)) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
      <h3>Setting up your workspace...</h3>
      <p>Loading your permissions and preferences</p>
    </div>
  )
}

// State 3: Receptionist redirect
const isReceptionist = role && role.toLowerCase() === 'receptionist'
if (isReceptionist && !isInitializing) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/salon/receptionist')
    }, 100)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
      <div>Redirecting to your dashboard...</div>
    </div>
  )
}

// State 4: Render dashboard
return <DashboardLayout>...</DashboardLayout>
```

**Why This Pattern**:
- Prevents "Access Restricted" flash
- Smooth transitions between states
- Clear user feedback at each stage
- Automatic receptionist routing

---

## 🔍 Common Tasks

### Task 1: Add a New KPI Metric

**Goal**: Add "Average Customer Rating" to HeroMetrics

**Steps**:
1. Update `SalonDashboardKPIs` interface in `useSalonDashboard.ts`:
```typescript
export interface SalonDashboardKPIs {
  // ... existing fields
  averageCustomerRating: number  // Add new field
}
```

2. Calculate metric in `useSalonDashboard` hook:
```typescript
const kpis: SalonDashboardKPIs = useMemo(() => {
  // ... existing calculations

  // New calculation
  const allRatings = activeCustomers
    .map(c => c.dynamic_fields?.rating?.value || 0)
    .filter(r => r > 0)

  const averageCustomerRating = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
    : 0

  return {
    // ... existing fields
    averageCustomerRating
  }
}, [customers, /* ... */])
```

3. Display in `HeroMetrics.tsx`:
```tsx
<MetricCard
  icon={<Star className="w-5 h-5" />}
  title="Avg Rating"
  value={kpis.averageCustomerRating.toFixed(1)}
  suffix="/ 5.0"
  trend={kpis.averageCustomerRating >= 4.5 ? 'up' : 'down'}
  trendValue={`${((kpis.averageCustomerRating / 5.0) * 100).toFixed(0)}%`}
  trendLabel="satisfaction"
/>
```

### Task 2: Add Component-Level Filter Override

**Goal**: Allow RevenueTrends to use a custom period independent of global filter

**Steps**:
1. Import `useDashboardFilter` in `RevenueTrends.tsx`:
```tsx
import { useDashboardFilter } from '@/contexts/DashboardFilterContext'
```

2. Get effective period for component:
```tsx
export function RevenueTrends({ kpis }: Props) {
  const {
    getComponentPeriod,
    setComponentOverride,
    hasOverride,
    clearComponentOverride
  } = useDashboardFilter()

  const componentId = 'revenue-trends'
  const effectivePeriod = getComponentPeriod(componentId)
  const isOverridden = hasOverride(componentId)
}
```

3. Add UI for period override:
```tsx
<AnalyticsSection
  title="Revenue Trends"
  subtitle={isOverridden ? 'Custom filter active' : 'Using global filter'}
>
  {/* Period selector for this component only */}
  <div className="flex gap-2 mb-4">
    {['today', 'last7Days', 'last30Days'].map((period) => (
      <button
        key={period}
        onClick={() => setComponentOverride(componentId, period)}
        className={effectivePeriod === period ? 'active' : ''}
      >
        {getPeriodLabel(period)}
      </button>
    ))}

    {isOverridden && (
      <button onClick={() => clearComponentOverride(componentId)}>
        Clear Override
      </button>
    )}
  </div>

  {/* Component content using effectivePeriod */}
  <RevenueTrendsChart period={effectivePeriod} kpis={kpis} />
</AnalyticsSection>
```

### Task 3: Optimize Dashboard Performance

**Goal**: Reduce initial load time from 3s to < 1.5s

**Optimization Strategies**:

**1. Lazy Load Heavy Components**:
```tsx
// Before (blocking import)
import { RevenueTrends } from '@/components/salon/dashboard/RevenueTrends'

// After (lazy import)
const RevenueTrends = lazy(() =>
  import('@/components/salon/dashboard/RevenueTrends')
    .then(mod => ({ default: mod.RevenueTrends }))
)

// Usage with Suspense
<Suspense fallback={<ComponentSkeleton />}>
  <RevenueTrends kpis={kpis} />
</Suspense>
```

**2. Implement Progressive Loading**:
```tsx
const [loadStage, setLoadStage] = useState(1)

useEffect(() => {
  // Load critical components first (stage 1)
  // Load less critical after 300ms (stage 2)
  // Load analytics after 600ms (stage 3)
  const stages = [2, 3, 4, 5]
  stages.forEach((stage, index) => {
    setTimeout(() => setLoadStage(stage), index * 300)
  })
}, [])

{loadStage >= 1 && <HeroMetrics />}      // Critical - load immediately
{loadStage >= 2 && <AppointmentAnalytics />}  // Important - +300ms
{loadStage >= 3 && <RevenueTrends />}    // Nice-to-have - +600ms
```

**3. Optimize Data Fetching**:
```tsx
// Use staleTime to reduce refetches
const { transactions } = useUniversalTransactionV1({
  organizationId,
  filters: { transaction_type: 'GL_JOURNAL' },
  cacheConfig: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    refetchOnMount: false       // Don't refetch if data is fresh
  }
})
```

**4. Memoize Expensive Calculations**:
```tsx
// Memoize KPI calculations
const kpis = useMemo(() => {
  // Heavy calculations here
  return { totalRevenue, averageAppointmentValue, /* ... */ }
}, [customers, services, tickets, appointments, selectedPeriod])

// Memoize chart data transformations
const chartData = useMemo(() => {
  return kpis.last7DaysRevenue.map(day => ({
    date: day.date,
    revenue: day.revenue
  }))
}, [kpis.last7DaysRevenue])
```

**Expected Results**:
- Initial page load: < 1.5s (from 3s)
- Time to Interactive: < 2.5s (from 4s)
- First Contentful Paint: < 1.0s (from 2s)
- Lighthouse Mobile Score: > 90 (from 70)

### Task 4: Add a New Dashboard Section

**Goal**: Add "Inventory Alerts" section showing low stock products

**Steps**:

**1. Create Component**:
```tsx
// File: /src/components/salon/dashboard/InventoryAlerts.tsx
'use client'

import { LUXE_COLORS } from '@/lib/constants/salon'
import { PackageX, AlertTriangle } from 'lucide-react'
import { AnalyticsSection } from './AnalyticsSection'

interface InventoryAlertsProps {
  kpis: SalonDashboardKPIs
}

export function InventoryAlerts({ kpis }: InventoryAlertsProps) {
  return (
    <AnalyticsSection
      title="Inventory Alerts"
      subtitle={`${kpis.lowStockProducts} products need attention`}
      icon={<PackageX className="w-5 h-5" />}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg"
          style={{ background: LUXE_COLORS.charcoalLight, border: `1px solid ${LUXE_COLORS.gold}30` }}
        >
          <AlertTriangle className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
          <div>
            <div className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>
              {kpis.lowStockProducts} Low Stock Items
            </div>
            <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Reorder needed to avoid stockouts
            </div>
          </div>
        </div>

        {/* List low stock products */}
        {/* ... */}
      </div>
    </AnalyticsSection>
  )
}
```

**2. Add to Dashboard** (page.tsx):
```tsx
// Import lazy component
const InventoryAlerts = lazy(() =>
  import('@/components/salon/dashboard/InventoryAlerts')
    .then(mod => ({ default: mod.InventoryAlerts }))
)

// Add to render (Stage 5 with other insights)
{loadStage >= 5 && (
  <div className="space-y-8 animate-fadeInUp">
    <Suspense fallback={<ComponentSkeleton />}>
      <InventoryAlerts kpis={kpis} />
    </Suspense>
  </div>
)}
```

**3. Ensure KPIs Include Required Data**:
```typescript
// useSalonDashboard.ts already calculates:
// - kpis.lowStockProducts (count)
// - kpis.totalProducts (total)
// - kpis.inventoryValue (total value)

// If you need product details, access raw data:
const { products } = useSalonDashboard({ organizationId })

const lowStockItems = products.filter(p => {
  const stockQty = p.stock_quantity || 0
  const reorderLevel = p.reorder_level || 0
  return stockQty > 0 && stockQty <= reorderLevel
})
```

---

## 🧪 API Reference

### useSalonDashboard Hook

**Full Type Definitions**:
```typescript
export interface AppointmentByStatus {
  completed: number
  in_progress: number
  pending: number
  cancelled: number
  no_show: number
}

export interface StaffPerformance {
  staffId: string
  staffName: string
  revenue: number
  servicesCompleted: number
  averageRating: number
  utilizationRate: number
}

export interface ServicePerformance {
  serviceId: string
  serviceName: string
  bookings: number
  revenue: number
  averagePrice: number
  popularityRank: number
}

export interface DailyRevenue {
  date: string
  revenue: number
  appointments: number
  averageTicket: number
}

export interface PaymentMethodBreakdown {
  cash: number
  card: number
  bank_transfer: number
  voucher: number
}

export interface PaymentMethodSplitAnalysis {
  today: PaymentMethodBreakdown
  last7Days: PaymentMethodBreakdown
  last30Days: PaymentMethodBreakdown
  yearToDate: PaymentMethodBreakdown
  allTime: PaymentMethodBreakdown
}

export interface PeriodFinancialMetrics {
  revenue: number
  grossProfit: number
  profitMargin: number
  transactionCount: number
  averageTransactionValue: number
}

export interface FinancialMetricsSplitAnalysis {
  today: PeriodFinancialMetrics
  last7Days: PeriodFinancialMetrics
  last30Days: PeriodFinancialMetrics
  yearToDate: PeriodFinancialMetrics
  allTime: PeriodFinancialMetrics
}

export interface SalonDashboardKPIs {
  // Base metrics
  totalCustomers: number
  vipCustomers: number
  totalRevenue: number
  activeServices: number
  totalProducts: number
  lowStockProducts: number
  inventoryValue: number
  activeStaff: number

  // Today's metrics
  todayRevenue: number
  todayAppointments: number
  todayRevenueGrowth: number
  todayAppointmentsGrowth: number
  todayOnDutyStaff: number

  // Appointment analytics
  appointmentsByStatus: AppointmentByStatus
  appointmentConversionRate: number
  averageAppointmentValue: number
  noShowRate: number
  cancellationRate: number

  // Revenue trends
  last7DaysRevenue: DailyRevenue[]
  last30DaysRevenue: DailyRevenue[]
  monthToDateRevenue: number
  revenueVsLastMonth: number
  averageTransactionValue: number

  // Staff performance
  staffLeaderboard: StaffPerformance[]
  averageStaffUtilization: number
  totalStaffHoursToday: number

  // Customer insights
  newCustomersToday: number
  returningCustomersToday: number
  customerRetentionRate: number
  averageCustomerLifetimeValue: number
  vipCustomerActivityToday: number

  // Service analytics
  topServices: ServicePerformance[]
  leastPopularServices: ServicePerformance[]
  averageServiceDuration: number

  // Financial metrics
  grossProfit: number
  profitMargin: number
  paymentMethodBreakdown: PaymentMethodBreakdown
  paymentMethodSplitAnalysis: PaymentMethodSplitAnalysis
  financialMetricsSplitAnalysis: FinancialMetricsSplitAnalysis
}
```

---

## 🧪 Testing

### Unit Tests
**File**: `/tests/unit/hooks/useSalonDashboard.test.ts`

**Test Coverage**:
```typescript
describe('useSalonDashboard', () => {
  it('calculates revenue correctly from GL_JOURNAL metadata', () => {})
  it('respects selected period filter', () => {})
  it('handles empty data gracefully', () => {})
  it('calculates payment method breakdown correctly', () => {})
  it('supports both v1 and v2 GL_JOURNAL formats', () => {})
  it('calculates staff utilization period-aware', () => {})
  it('filters appointments by status correctly', () => {})
  it('calculates service analytics from SALE transactions', () => {})
})
```

### E2E Tests
**File**: `/tests/e2e/salon/dashboard.spec.ts`

**Test Scenarios**:
```typescript
test('Dashboard loads with progressive stages', async ({ page }) => {
  await page.goto('/salon/dashboard')

  // Stage 1: Headers and hero metrics load immediately
  await expect(page.getByText('Dashboard')).toBeVisible()
  await expect(page.locator('[data-testid="hero-metrics"]')).toBeVisible()

  // Stage 2: Appointment analytics loads after delay
  await page.waitForSelector('[data-testid="appointment-analytics"]', { timeout: 500 })

  // Stage 3: Revenue trends loads
  await page.waitForSelector('[data-testid="revenue-trends"]', { timeout: 1000 })

  // All stages complete within 2 seconds
  await expect(page.locator('[data-testid="dashboard-complete"]')).toBeVisible({ timeout: 2000 })
})

test('Global period filter works correctly', async ({ page }) => {
  await page.goto('/salon/dashboard')

  // Default: last30Days
  await expect(page.getByRole('button', { name: 'Last 30 Days' })).toHaveClass(/active/)

  // Click today filter
  await page.getByRole('button', { name: 'Today' }).click()

  // Verify data updates
  await expect(page.getByTestId('total-revenue')).toContainText('AED')

  // Metrics should reflect today only
  const revenueText = await page.getByTestId('total-revenue').textContent()
  expect(revenueText).not.toContain('0') // Should have some revenue
})

test('Component override works independently', async ({ page }) => {
  await page.goto('/salon/dashboard')

  // Set global filter to last30Days
  await page.getByRole('button', { name: 'Last 30 Days' }).click()

  // Override revenue trends to show today only
  await page.locator('[data-testid="revenue-trends"]').getByRole('button', { name: 'Today' }).click()

  // Verify override badge shows
  await expect(page.locator('[data-testid="revenue-trends"]').getByText('Custom Filter Active')).toBeVisible()

  // Other sections still use global filter
  await expect(page.locator('[data-testid="global-filter-indicator"]')).toContainText('Last 30 Days')
})

test('Receptionist is redirected automatically', async ({ page }) => {
  // Login as receptionist
  await page.goto('/auth/login?demo=receptionist')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Should redirect to /salon/receptionist, not /salon/dashboard
  await page.waitForURL('/salon/receptionist')
  await expect(page).toHaveURL('/salon/receptionist')
})
```

---

## 📁 Related Files

### Core Files
- `/src/app/salon/dashboard/page.tsx` (652 lines) - Main dashboard page
- `/src/hooks/useSalonDashboard.ts` (1127 lines) - Dashboard data hook
- `/src/contexts/DashboardFilterContext.tsx` (262 lines) - Filter management

### Component Files
- `/src/components/salon/dashboard/HeroMetrics.tsx` - Key metrics cards
- `/src/components/salon/dashboard/AppointmentAnalytics.tsx` - Appointment status
- `/src/components/salon/dashboard/RevenueTrends.tsx` - Revenue charts
- `/src/components/salon/dashboard/StaffPerformance.tsx` - Staff leaderboard
- `/src/components/salon/dashboard/CustomerAndServiceInsights.tsx` - Customer/service analytics
- `/src/components/salon/dashboard/FinancialOverview.tsx` - Financial metrics
- `/src/components/salon/dashboard/AnalyticsSection.tsx` - Reusable section wrapper
- `/src/components/salon/dashboard/FilterOverrideControl.tsx` - Component filter override UI

### Chart Components
- `/src/components/salon/dashboard/charts/LuxeLineChart.tsx` - Line charts (revenue trends)
- `/src/components/salon/dashboard/charts/LuxeBarChart.tsx` - Bar charts (staff performance)
- `/src/components/salon/dashboard/charts/LuxePieChart.tsx` - Pie charts (appointment status)

### Mobile Components
- `/src/components/salon/mobile/PremiumMobileHeader.tsx` - iOS-style mobile header

### Shared Components
- `/src/components/salon/shared/SalonLuxePage.tsx` - Page wrapper
- `/src/components/salon/shared/SalonLuxeButton.tsx` - Button component
- `/src/components/salon/shared/SalonLuxeTile.tsx` - Tile component
- `/src/components/salon/shared/SalonLuxeBadge.tsx` - Badge component

### Context Files
- `/src/app/salon/SecuredSalonProvider.tsx` - Organization context
- `/src/hooks/useSalonSecurity.ts` - Security/role context

### Utility Files
- `/src/lib/constants/salon.ts` - Luxe color palette and design tokens
- `/src/hooks/useUniversalEntityV1.ts` - Entity data fetching
- `/src/hooks/useUniversalTransactionV1.ts` - Transaction data fetching

---

## ⚠️ Known Issues

### Issue 1: GL_JOURNAL Format Inconsistency
**Problem**: Old transactions use v1 format (payment methods in `line_data`), new transactions use v2 format (payment methods in `metadata.payment_methods` array)

**Solution**: Dual-strategy payment method extraction in `useSalonDashboard.ts`:
```typescript
// Strategy 1: Enhanced metadata (v2)
const paymentMethodsMetadata = t.metadata?.payment_methods || []

// Strategy 2: GL lines (v1)
const paymentLines = glLines.filter(line =>
  line.line_data?.payment_method
)

// Strategy 3: Fallback to cash
```

**Status**: Resolved - Both formats supported

### Issue 2: Staff Utilization Calculation
**Problem**: Utilization rate exceeded 100% when selected period was "today" but calculation used all-time appointments

**Solution**: Period-aware utilization calculation:
```typescript
// Calculate expected capacity based on selected period
const getDaysInPeriod = () => {
  if (!periodRange) return 365 // All time
  const diffMs = periodRange.end.getTime() - periodRange.start.getTime()
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

const daysInPeriod = getDaysInPeriod()
const expectedServicesInPeriod = daysInPeriod * 8 // 8 services per day
const utilizationRate = Math.min(100, (servicesInPeriod / expectedServicesInPeriod) * 100)
```

**Status**: Resolved

### Issue 3: Service Analytics Showing Zero Data
**Problem**: GL_JOURNAL lines have `entity_id: null`, so service matching failed

**Solution**: Use SALE transactions instead of GL_JOURNAL:
```typescript
// Match SALE transactions (have service IDs in lines)
const serviceSales = periodSales.filter(sale => {
  const lines = sale.lines || []
  return lines.some(line =>
    line.entity_id === service.id &&
    line.line_type === 'service'
  )
})

// Then find corresponding GL_JOURNAL via origin_transaction_id
const correspondingGLJournals = periodCompletedTickets.filter(glj =>
  serviceSaleIds.has(glj.metadata?.origin_transaction_id)
)
```

**Status**: Resolved

### Issue 4: Receptionist Dashboard Flash
**Problem**: Receptionists briefly saw admin dashboard before redirect

**Solution**: Three-layer loading state checks:
```typescript
// Wait for ALL loading flags before showing dashboard
if (isAuthenticated && (securityLoading || orgLoading || !role)) {
  return <LoadingState />
}

// Then check receptionist redirect
if (isReceptionist && !isInitializing) {
  // Redirect with small delay to prevent race conditions
  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/salon/receptionist')
    }, 100)
    return () => clearTimeout(timer)
  }, [router])

  return <RedirectingState />
}
```

**Status**: Resolved

---

## 💡 Examples

### Example 1: Custom Metric Card
```tsx
<div
  className="rounded-xl p-6"
  style={{
    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoal} 100%)`,
    border: `1px solid ${LUXE_COLORS.gold}30`,
    boxShadow: `0 8px 32px ${LUXE_COLORS.black}80`
  }}
>
  {/* Icon */}
  <div
    className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
    style={{
      background: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}15 100%)`,
      border: `1px solid ${LUXE_COLORS.gold}40`
    }}
  >
    <TrendingUp className="w-6 h-6" style={{ color: LUXE_COLORS.gold }} />
  </div>

  {/* Title */}
  <div className="text-sm mb-1" style={{ color: LUXE_COLORS.bronze }}>
    Total Revenue
  </div>

  {/* Value */}
  <div
    className="text-3xl font-bold mb-2"
    style={{
      background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }}
  >
    {formatCurrency(kpis.totalRevenue)}
  </div>

  {/* Trend */}
  <div className="flex items-center gap-2">
    <div
      className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
      style={{
        background: `${LUXE_COLORS.emerald}20`,
        color: LUXE_COLORS.emerald
      }}
    >
      <TrendingUp className="w-3 h-3" />
      +15.3%
    </div>
    <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
      vs last period
    </span>
  </div>
</div>
```

### Example 2: Period Comparison
```tsx
function PeriodComparison({ kpis }: Props) {
  const { financialMetricsSplitAnalysis } = kpis

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {(['today', 'last7Days', 'last30Days', 'yearToDate', 'allTime'] as const).map((period) => {
        const metrics = financialMetricsSplitAnalysis[period]

        return (
          <div key={period} className="p-4 rounded-lg" style={{ background: LUXE_COLORS.charcoalLight }}>
            <div className="text-xs font-semibold mb-2" style={{ color: LUXE_COLORS.gold }}>
              {getPeriodLabel(period)}
            </div>

            <div className="text-2xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
              {formatCurrency(metrics.revenue)}
            </div>

            <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
              {metrics.transactionCount} transactions
            </div>

            <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
              Avg: {formatCurrency(metrics.averageTransactionValue)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### Example 3: Skeleton Loader
```tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Hero metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg"
            style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
          />
        ))}
      </div>

      {/* Chart skeleton */}
      <div
        className="h-64 rounded-lg"
        style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
      />

      {/* Table skeleton */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg"
            style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 📊 Success Metrics

A Dashboard feature is considered production-ready when:
- ✅ All 5 loading stages complete within 2 seconds
- ✅ Period filter switching occurs in < 50ms
- ✅ Mobile responsive on 375px+ screens (iPhone SE)
- ✅ All KPIs calculated correctly with period awareness
- ✅ Revenue matches Reports page exactly
- ✅ Payment method breakdown accurate for both v1 and v2 formats
- ✅ Receptionist redirect happens automatically
- ✅ No "Access Restricted" flash during loading
- ✅ Component overrides work independently
- ✅ E2E tests cover all user workflows
- ✅ Lighthouse Mobile Score > 90

---

## 🔗 See Also

- [HERA DNA Architecture](/docs/salon/architecture.md)
- [Mobile-First Layout Guide](/docs/salon/features/MOBILE-LAYOUT.md)
- [Shared Components Reference](/docs/salon/features/SHARED-COMPONENTS.md)
- [Custom Hooks Guide](/docs/salon/features/HOOKS.md)
- [Performance Optimization](/docs/salon/features/PERFORMANCE.md)
- [Testing Strategy](/docs/salon/features/TESTING.md)

---

<div align="center">

**Dashboard Feature Guide** | **HERA Salon Module v2.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Next: Point of Sale →](./POINT-OF-SALE.md)

</div>
