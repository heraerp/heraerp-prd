# 📱 HERA Salon Mobile-First Standardization - Enterprise Checklist

## 🎯 Executive Summary

Transform all HERA Salon pages to mobile-first, enterprise-grade experiences with:
- **Consistent UI/UX** across all pages
- **Native app feel** on mobile devices
- **Instant page loads** with lazy loading
- **Standardized filter/search patterns**
- **Touch-optimized interactions**

## ⚡ CRITICAL HERA DEVELOPMENT STANDARDS (UPDATED 2025-11)

### 🔴 MANDATORY PATTERNS - NEVER VIOLATE

**1. Data Access Layer**
- ✅ **ALWAYS** use `useUniversalEntityV1` for entity CRUD operations
- ✅ **ALWAYS** use `useUniversalTransactionV1` for transaction operations
- ✅ **ALWAYS** use RPC functions: `hera_entities_crud_v1` and `hera_txn_crud_v1`
- ❌ **NEVER** use direct Supabase calls (no `supabase.from()` in components)
- ❌ **NEVER** use demo/mock APIs in production components
- ❌ **NEVER** bypass API v2 endpoints

**2. Component Architecture**
- ✅ **ALWAYS** use `SalonLuxePage` wrapper for page layout
- ✅ **ALWAYS** use `SalonLuxeKPICard` for KPI metrics
- ✅ **ALWAYS** use lazy loading with `Suspense` for major sections
- ✅ **ALWAYS** provide skeleton loaders during loading states
- ❌ **NEVER** use plain shadcn/ui Card components (use SalonLuxe variants)

**3. Mobile-First Design**
- ✅ **ALWAYS** include iOS-style mobile header (`h-11 status bar + sticky header`)
- ✅ **ALWAYS** use responsive grids (`grid-cols-2 md:grid-cols-4`)
- ✅ **ALWAYS** ensure 44px minimum touch targets
- ✅ **ALWAYS** add `active:scale-95` for touch feedback
- ✅ **ALWAYS** add bottom spacing (`h-24 md:h-0`) for mobile nav clearance

**4. Data Extraction Patterns**
- ✅ **ALWAYS** extract GL data from `metadata` object (not direct fields)
- ✅ **ALWAYS** use GL v2.0 enhanced fields when available (`service_revenue_net`, `product_revenue_net`)
- ✅ **ALWAYS** handle both v1 and v2 GL formats with fallbacks
- ✅ **ALWAYS** use `useMemo` for data transformations to prevent re-renders

### 📋 Standard Page Structure Template

```tsx
'use client'

import { lazy, Suspense } from 'react'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useSecuredSalonContext } from '../SecuredSalonProvider'

// Lazy load major sections
const PageHeader = lazy(() => import('./components/PageHeader'))
const PageKPIs = lazy(() => import('./components/PageKPIs'))
const PageContent = lazy(() => import('./components/PageContent'))

export default function SalonPage() {
  const { organizationId, role, user, isLoading, isAuthenticated } = useSecuredSalonContext()

  // Loading state
  if (isLoading) {
    return (
      <SalonLuxePage title="Page Title" description="Loading...">
        <LoadingSpinner />
      </SalonLuxePage>
    )
  }

  // Access control
  if (!isAuthenticated) {
    return <AccessDenied />
  }

  return (
    <SalonLuxePage title="Page Title" description="Page description" maxWidth="full" padding="lg">
      {/* iOS-style status bar spacer - MOBILE ONLY */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile App Header */}
      <Suspense fallback={<div className="h-16 md:hidden" />}>
        <PageHeader user={user} organizationId={organizationId} />
      </Suspense>

      {/* KPI Cards */}
      <Suspense fallback={<KPISkeleton />}>
        <PageKPIs organizationId={organizationId} />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<ContentSkeleton />}>
        <PageContent organizationId={organizationId} />
      </Suspense>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}
```

### 📊 KPI Component Pattern (Real Data)

```tsx
'use client'

import { useMemo } from 'react'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'
import { startOfMonth, endOfMonth } from 'date-fns'

export default function PageKPIs({ organizationId }: { organizationId?: string }) {
  const currentMonth = new Date()

  // ✅ Fetch real data using HERA hooks
  const { transactions, isLoading } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'GL_JOURNAL',
      date_from: startOfMonth(currentMonth).toISOString(),
      date_to: endOfMonth(currentMonth).toISOString(),
      include_lines: true
    }
  })

  // ✅ Calculate metrics from real data
  const metrics = useMemo(() => {
    if (!transactions) return { revenue: 0, vat: 0 }

    let revenue = 0
    let vat = 0

    transactions.forEach(txn => {
      const meta = txn.metadata || {}
      revenue += meta.total_cr || 0
      vat += (meta.vat_on_services || 0) + (meta.vat_on_products || 0)
    })

    return { revenue, vat }
  }, [transactions])

  if (isLoading) return <KPISkeleton />

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
      <SalonLuxeKPICard
        title="Revenue"
        value={`AED ${metrics.revenue.toLocaleString()}`}
        icon={DollarSign}
        color={SALON_LUXE_COLORS.gold.base}
        description="Current month"
      />
      {/* More KPIs... */}
    </div>
  )
}
```

### 🔧 Common Hooks Reference

```typescript
// Entity operations (services, products, staff, etc.)
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'

// Transaction operations (appointments, sales, GL journals)
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'

// Sales reports with GL data extraction
import { useMonthlySalesReport, useDailySalesReport } from '@/hooks/useSalonSalesReports'

// Dashboard stats
import { useReportsStats } from '@/hooks/useReportsStats'
```

### 📁 Standard File Organization

```
/src/app/salon/[module]/
├── page.tsx                    # Main page (lazy loads components)
├── components/
│   ├── [Module]Header.tsx     # Mobile + desktop header
│   ├── [Module]KPIs.tsx       # KPI cards with real data
│   ├── [Module]Content.tsx    # Main content section
│   └── [Module]Modal.tsx      # CRUD modal (if needed)
```

### ✅ Reference Implementation

**Enterprise-grade finance page**: `/src/app/salon/finance/page.tsx`
- ✅ Uses `SalonLuxePage` wrapper
- ✅ Uses `useUniversalTransactionV1` for GL data
- ✅ Uses `SalonLuxeKPICard` for metrics
- ✅ Lazy loading with Suspense boundaries
- ✅ Mobile-first responsive design
- ✅ iOS-style mobile header
- ✅ No direct Supabase calls
- ✅ Real data from GL metadata extraction

---

## ✅ Phase 1: Component Architecture (FOUNDATION)

### 1.1 Create Unified Layout Components

#### **SalonPageLayout** Component
```typescript
// Location: /src/components/salon/layouts/SalonPageLayout.tsx
interface SalonPageLayoutProps {
  // Header
  title: string
  description?: string
  icon?: ReactNode

  // Actions (mobile-optimized)
  primaryAction?: {
    label: string
    icon: ReactNode
    onClick: () => void
  }
  secondaryActions?: Array<{
    label: string
    icon: ReactNode
    onClick: () => void
  }>

  // Filters & Search (standardized position)
  searchProps?: {
    value: string
    onChange: (value: string) => void
    placeholder: string
  }

  filterProps?: {
    tabs?: Array<{ label: string; value: string }>
    activeTab?: string
    onTabChange?: (value: string) => void
    customFilters?: ReactNode
  }

  // Stats/KPI Cards
  stats?: Array<{
    title: string
    value: string | number
    icon: ReactNode
    color: string
    trend?: { value: number; direction: 'up' | 'down' }
  }>

  // Content
  children: ReactNode

  // Mobile specific
  mobileHeader?: ReactNode
  showMobileNav?: boolean
}
```

**Features:**
- ✅ Responsive header (desktop: horizontal, mobile: stacked)
- ✅ Fixed search/filter bar on mobile
- ✅ Bottom action bar for mobile FAB
- ✅ Pull-to-refresh support
- ✅ Infinite scroll support
- ✅ Loading states with skeletons

#### **SalonFilterBar** Component
```typescript
// Standardized filter position: Always below header, above content
interface SalonFilterBarProps {
  // Search (always left-most on desktop, full-width on mobile)
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string

  // Tabs (primary filter)
  tabs?: Array<{ label: string; value: string; count?: number }>
  activeTab?: string
  onTabChange?: (value: string) => void

  // Sort dropdown
  sortOptions?: Array<{ label: string; value: string }>
  sortValue?: string
  onSortChange?: (value: string) => void

  // View mode (grid/list)
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void

  // Advanced filters (expandable)
  filters?: ReactNode
  showFilters?: boolean
  onToggleFilters?: () => void

  // Mobile specific
  mobileLayout?: 'compact' | 'full'
}
```

**Standard Layout:**
```
Desktop:
[Search Input] [Tabs] [Sort Dropdown] [View Toggle] [Filter Button]

Mobile:
[Search Input (full-width)]
[Tabs (scrollable horizontal)]
[Sort] [View] [Filter] (sticky bar)
```

### 1.2 Mobile-Responsive SalonLuxePage Enhancement

**Updates Required:**
```typescript
// Add mobile-specific props
interface SalonLuxePageProps {
  // ... existing props

  // Mobile enhancements
  mobileOptimized?: boolean  // Default: true
  showMobileHeader?: boolean // iOS-style header
  mobileHeaderHeight?: number // Default: 60px
  enablePullToRefresh?: boolean
  onRefresh?: () => Promise<void>

  // Touch targets
  minTouchTarget?: number // Default: 44px

  // Spacing
  mobilePadding?: 'sm' | 'md' | 'lg' // Default: 'md'
  desktopPadding?: 'sm' | 'md' | 'lg' // Default: 'lg'
}
```

**Mobile Header Pattern:**
```tsx
{/* iOS-style status bar spacer */}
<div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

{/* Mobile app header */}
<div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-gold" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-champagne">{title}</h1>
        <p className="text-xs text-bronze">{subtitle}</p>
      </div>
    </div>
    <button className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
      <Bell className="w-5 h-5 text-gold" />
    </button>
  </div>
</div>
```

---

## ✅ Phase 2: Page Standardization (CONSISTENCY)

### 2.1 Standard Page Structure

**Every salon page MUST follow this structure:**

```tsx
export default function SalonPage() {
  return (
    <StatusToastProvider>
      <SalonPageLayout
        title="Page Title"
        description="Page description"
        icon={<IconComponent />}

        primaryAction={{
          label: "New Item",
          icon: <Plus />,
          onClick: handleCreate
        }}

        searchProps={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "Search..."
        }}

        filterProps={{
          tabs: [
            { label: "Active", value: "active", count: activeCount },
            { label: "All", value: "all", count: totalCount }
          ],
          activeTab: selectedTab,
          onTabChange: setSelectedTab
        }}

        stats={[
          { title: "Total", value: total, icon: <Icon1 />, color: COLORS.gold },
          { title: "Active", value: active, icon: <Icon2 />, color: COLORS.emerald }
        ]}
      >
        {/* Lazy-loaded content */}
        <Suspense fallback={<ContentSkeleton />}>
          <PageContent />
        </Suspense>
      </SalonPageLayout>
    </StatusToastProvider>
  )
}
```

### 2.2 Filter/Search Position Standard

**RULE: Filter bar ALWAYS appears in this order:**

1. **Row 1 (Primary Controls)**
   - 📱 **Mobile**: Search (full-width) → Tabs (horizontal scroll)
   - 🖥️ **Desktop**: Search (left) → Tabs (center) → Actions (right)

2. **Row 2 (Secondary Controls)** - Optional, expandable
   - 📱 **Mobile**: Sort | View | Filters (icon buttons, sticky)
   - 🖥️ **Desktop**: Sort dropdown → Branch filter → Category filter → View toggle

3. **Row 3 (Active Filters)** - Only shows when filters applied
   - Filter badges with X to remove
   - "Clear all" button

**Z-Index Hierarchy:**
```
Mobile Nav:        z-50
Filter Bar:        z-40
Sticky Headers:    z-30
Modals:            z-50+
Toasts:            z-60
```

### 2.3 Responsive Breakpoints

**Standard Breakpoints:**
```css
sm:  640px   /* Large phones */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

**Grid Standards:**
```tsx
// Cards/Items Grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"

// Stats Cards
className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"

// Form Fields
className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
```

---

## ✅ Phase 3: Mobile Optimizations (PERFORMANCE)

### 3.1 Touch Target Standards

**Minimum Sizes:**
- Buttons: `min-h-11` (44px) on mobile
- Touch areas: `p-3` minimum (12px = 48px total with border)
- Spacing between: `gap-3` minimum (12px)

**Interactive Elements:**
```tsx
// Standard button
className="min-h-11 px-6 rounded-xl active:scale-95 transition-transform"

// Icon button
className="w-11 h-11 rounded-full active:scale-95 transition-transform"

// List item
className="min-h-16 p-4 active:bg-white/5 transition-colors"
```

### 3.2 Typography Scale

**Responsive Text:**
```tsx
// Headings
h1: "text-2xl md:text-4xl font-bold"
h2: "text-xl md:text-3xl font-bold"
h3: "text-lg md:text-2xl font-semibold"

// Body
body: "text-sm md:text-base"
small: "text-xs md:text-sm"

// Numbers/Values
value: "text-2xl md:text-3xl font-bold"
```

### 3.3 Spacing Scale

**Responsive Padding:**
```tsx
// Page padding
className="p-4 md:p-6 lg:p-8"

// Card padding
className="p-4 md:p-6"

// Section gaps
className="space-y-4 md:space-y-6"

// Grid gaps
className="gap-3 md:gap-4 lg:gap-6"
```

### 3.4 Lazy Loading Implementation

**Page-Level Lazy Loading:**
```tsx
// Split components
const PageHeader = lazy(() => import('./PageHeader'))
const FilterBar = lazy(() => import('./FilterBar'))
const ContentGrid = lazy(() => import('./ContentGrid'))
const StatsCards = lazy(() => import('./StatsCards'))

// Render with Suspense
<Suspense fallback={<HeaderSkeleton />}>
  <PageHeader />
</Suspense>

<Suspense fallback={<FilterSkeleton />}>
  <FilterBar />
</Suspense>

<Suspense fallback={<StatsSkeleton />}>
  <StatsCards />
</Suspense>

<Suspense fallback={<ContentSkeleton />}>
  <ContentGrid />
</Suspense>
```

**Skeleton Standards:**
```tsx
// Shimmer effect
className="animate-pulse bg-gradient-to-r from-charcoal via-charcoalLight to-charcoal bg-[length:200%_100%]"

// Card skeleton
<div className="p-6 rounded-xl bg-charcoalLight/50">
  <div className="h-4 w-24 bg-bronze/20 rounded mb-2" />
  <div className="h-8 w-16 bg-gold/20 rounded" />
</div>
```

---

## ✅ Phase 4: Page-by-Page Implementation

### Priority Pages (Phase 4A - Week 1)

#### High-Traffic Core Pages
- [ ] `/salon/dashboard` - Main dashboard
- [ ] `/salon/appointments` - Appointment calendar
- [ ] `/salon/pos` - Point of sale
- [ ] `/salon/customers` - Customer management
- [ ] `/salon/services` - Service catalog ✅ (Already updated)
- [ ] `/salon/staffs` - Staff management ✅ (Already updated)

### Business Operations (Phase 4B - Week 2)

#### Management Pages
- [ ] `/salon/products` - Product inventory
- [ ] `/salon/branches` - Branch management
- [ ] `/salon/reports` - Reporting dashboard
- [ ] `/salon/finance` - Financial overview
- [ ] `/salon/inventory` - Inventory management

### Administrative (Phase 4C - Week 3)

#### Settings & Configuration
- [ ] `/salon/settings` - Settings page
- [ ] `/salon/compliance` - Compliance tracking
- [ ] `/salon/team-management` - Team hierarchy
- [ ] `/salon/categories` - Category management

---

## ✅ Phase 5: Testing & Quality Assurance

### 5.1 Mobile Testing Checklist

**Per Page Testing:**
- [ ] iPhone SE (375px) - Smallest modern phone
- [ ] iPhone 12/13 (390px) - Standard iPhone
- [ ] iPhone 14 Pro Max (430px) - Large iPhone
- [ ] Galaxy S21 (360px) - Standard Android
- [ ] iPad Mini (768px) - Small tablet
- [ ] iPad Pro (1024px) - Large tablet

**Interaction Testing:**
- [ ] All buttons minimum 44x44px
- [ ] Touch feedback (active:scale-95)
- [ ] Smooth scrolling (no jank)
- [ ] Pull-to-refresh works
- [ ] Keyboard doesn't break layout
- [ ] Landscape orientation supported

### 5.2 Performance Benchmarks

**Load Time Targets:**
- Initial page load: < 1.5s
- Time to Interactive: < 2.5s
- First Contentful Paint: < 1.0s
- Lazy loaded sections: < 500ms

**Bundle Size Targets:**
- Page component: < 50KB
- Total page bundle: < 200KB
- Images optimized: WebP format

### 5.3 Accessibility Standards

**WCAG 2.1 AA Compliance:**
- [ ] Color contrast minimum 4.5:1
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Touch targets minimum 44x44px
- [ ] Text resizable to 200%

---

## 🏗️ Implementation Timeline

### Week 1: Foundation
- Day 1-2: Create SalonPageLayout component
- Day 3-4: Create SalonFilterBar component
- Day 5: Update SalonLuxePage with mobile enhancements

### Week 2: Core Pages
- Day 1: Dashboard
- Day 2: Appointments
- Day 3: POS
- Day 4: Customers
- Day 5: Testing & refinement

### Week 3: Business Pages
- Day 1-2: Products, Inventory
- Day 3-4: Branches, Reports
- Day 5: Finance pages

### Week 4: Polish & Deploy
- Day 1-3: Administrative pages
- Day 4: Cross-browser testing
- Day 5: Production deployment

---

## 📊 Success Metrics

**User Experience:**
- Mobile bounce rate: < 20%
- Mobile session duration: > 3 min
- Mobile conversion rate: > desktop

**Performance:**
- Lighthouse mobile score: > 90
- Core Web Vitals: All green
- Load time: < 2s on 3G

**Consistency:**
- Filter position variance: 0
- UI component reuse: > 80%
- Design system compliance: 100%

---

## 🎨 Design Tokens (Mobile-Optimized)

```typescript
export const MOBILE_DESIGN_TOKENS = {
  // Touch targets
  touchTarget: {
    min: '44px',
    comfortable: '48px',
    large: '56px'
  },

  // Spacing
  spacing: {
    mobile: {
      xs: '0.5rem',  // 8px
      sm: '0.75rem', // 12px
      md: '1rem',    // 16px
      lg: '1.5rem',  // 24px
      xl: '2rem'     // 32px
    },
    desktop: {
      xs: '0.75rem', // 12px
      sm: '1rem',    // 16px
      md: '1.5rem',  // 24px
      lg: '2rem',    // 32px
      xl: '3rem'     // 48px
    }
  },

  // Typography
  fontSize: {
    mobile: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.5rem',    // 24px
      '2xl': '2rem'    // 32px
    },
    desktop: {
      xs: '0.875rem',  // 14px
      sm: '1rem',      // 16px
      base: '1.125rem',// 18px
      lg: '1.25rem',   // 20px
      xl: '2rem',      // 32px
      '2xl': '3rem'    // 48px
    }
  },

  // Borders & Radius
  borderRadius: {
    mobile: {
      sm: '0.5rem',   // 8px
      md: '0.75rem',  // 12px
      lg: '1rem',     // 16px
      xl: '1.5rem'    // 24px
    },
    desktop: {
      sm: '0.5rem',   // 8px
      md: '0.75rem',  // 12px
      lg: '1rem',     // 16px
      xl: '1.5rem'    // 24px
    }
  }
}
```

---

## 🚀 Quick Start Template

```tsx
'use client'

import { lazy, Suspense } from 'react'
import { SalonPageLayout } from '@/components/salon/layouts/SalonPageLayout'
import { StatusToastProvider } from '@/components/salon/ui/StatusToastProvider'

// Lazy load components
const ContentSection = lazy(() => import('./ContentSection'))
const StatsSection = lazy(() => import('./StatsSection'))

export default function NewSalonPage() {
  return (
    <StatusToastProvider>
      <SalonPageLayout
        title="Page Title"
        description="Page description"
        primaryAction={{
          label: "New Item",
          icon: <Plus className="w-5 h-5" />,
          onClick: () => handleCreate()
        }}
        searchProps={{
          value: search,
          onChange: setSearch,
          placeholder: "Search items..."
        }}
        filterProps={{
          tabs: [
            { label: "Active", value: "active" },
            { label: "All", value: "all" }
          ]
        }}
      >
        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection />
        </Suspense>

        <Suspense fallback={<ContentSkeleton />}>
          <ContentSection />
        </Suspense>
      </SalonPageLayout>
    </StatusToastProvider>
  )
}
```

---

## ✅ Completion Checklist

### Component Development
- [ ] SalonPageLayout created
- [ ] SalonFilterBar created
- [ ] SalonLuxePage mobile-enhanced
- [ ] Skeleton components created
- [ ] Mobile header component created

### Page Updates
- [ ] All priority pages updated
- [ ] All business pages updated
- [ ] All admin pages updated
- [ ] Lazy loading implemented everywhere

### Testing
- [ ] Mobile device testing complete
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Cross-browser testing done

### Documentation
- [ ] Component docs written
- [ ] Usage examples created
- [ ] Migration guide published
- [ ] Design system updated

---

**Status**: Ready for implementation
**Priority**: P0 - Critical
**Effort**: 4 weeks
**Impact**: Enterprise-grade mobile experience across entire Salon OS
