# Salon Page Standardization Plan
**Date**: October 23, 2025
**Status**: Ready for Implementation
**Reference Page**: `/src/app/salon/staffs/page.tsx` ✅ (Production-Ready Template)

---

## ✅ Staffs Page Verification

**Current Status**: `/src/app/salon/staffs/page.tsx` is **FULLY OPTIMIZED**

### Lazy Loading ✅
- **Line 48-54**: Lazy imports for StaffListTab, RolesTab, StaffModal
- **Line 592, 609, 621**: Suspense boundaries with fallback loaders
- **Result**: Components load on-demand, reducing initial bundle size

### Mobile-First Design ✅
- **Line 467-485**: PremiumMobileHeader with iOS-style design
- **Line 525-548**: Mobile quick actions (touch-friendly 48px)
- **Line 489-522**: Responsive KPI grid (2 cols mobile, 4 cols desktop)
- **Line 616**: Bottom spacing for comfortable mobile scrolling
- **Line 425-462**: Desktop actions hidden on mobile (`hidden md:flex`)

### Enterprise-Grade Patterns ✅
- **Line 3**: Suspense and lazy from React
- **Line 100**: Optimized data fetching (enabled when tab active)
- **Line 103-107**: useMemo for filtered data
- **Line 130-135**: useMemo for compliance scanning
- **Line 200-224**: Optimistic cache updates (no unnecessary refetch)

---

## 🎯 Standardization Goals

Transform ALL salon pages to match the `/staffs` page quality:

1. **Lazy Loading**: Code-split all heavy components
2. **Mobile-First**: iOS/Android native app feel
3. **Performance**: < 1.5s initial load, < 2.5s TTI
4. **Consistent UX**: Salon Luxe theme with enterprise colors
5. **Accessibility**: WCAG 2.1 AA compliant

---

## 📋 Priority Salon Pages (48 Total)

### 🟢 Tier 1 - Core Business Functions (High Priority)
These pages are used daily and need immediate standardization:

1. **`/salon/appointments/page.tsx`** - Appointment booking
2. **`/salon/pos/page.tsx`** - Point of sale
3. **`/salon/customers/page.tsx`** - Customer management
4. **`/salon/services/page.tsx`** - Service catalog
5. **`/salon/products/page.tsx`** - Product inventory
6. **`/salon/dashboard/page.tsx`** - Owner dashboard
7. **`/salon/receptionist/page.tsx`** - Receptionist dashboard

### 🟡 Tier 2 - Business Operations (Medium Priority)

8. **`/salon/inventory/page.tsx`** - Inventory management
9. **`/salon/branches/page.tsx`** - Branch management
10. **`/salon/categories/page.tsx`** - Service categories
11. **`/salon/reports/page.tsx`** - Business reports
12. **`/salon/finance/page.tsx`** - Financial overview
13. **`/salon/settings/page.tsx`** - Business settings

### 🔵 Tier 3 - Advanced Features (Low Priority)

14. **`/salon/whatsapp/page.tsx`** - WhatsApp integration
15. **`/salon/compliance/page.tsx`** - Compliance tracking
16. **`/salon/gift-cards/page.tsx`** - Gift card management
17. **`/salon/balance-sheet/page.tsx`** - Financial statements
18. **`/salon/profit-loss/page.tsx`** - P&L statements
19. **`/salon/trial-balance/page.tsx`** - Trial balance

### ⚪ Tier 4 - Experimental/Deprecated (Archive/Review)

20-48. Various dashboard experiments, v2 pages, test pages

**Recommendation**: Archive experimental pages or merge into production versions.

---

## 🏗️ Standard Page Template

Use this template for all salon pages:

```typescript
'use client'

import React, { useState, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { Plus, RefreshCw, [YourIcons] } from 'lucide-react'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#9B59B6',
  rose: '#E8B4B8'
}

// 🚀 LAZY LOADING: Split code for faster initial load
const YourMainComponent = lazy(() =>
  import('./YourComponent').then(module => ({ default: module.YourComponent }))
)
const YourModal = lazy(() =>
  import('./YourModal').then(module => ({ default: module.YourModal }))
)

// Loading fallback
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.gold }} />
      <span className="ml-3" style={{ color: COLORS.bronze }}>Loading...</span>
    </div>
  )
}

function YourPageContent() {
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const router = useRouter()

  // State
  const [modalOpen, setModalOpen] = useState(false)

  // 🎯 DATA FETCHING: Use your custom hook
  const { data, isLoading, create, update, delete } = useYourHook({
    organizationId: organizationId || '',
    enabled: !!organizationId
  })

  // 📊 STATS: Calculate KPIs
  const stats = {
    total: data?.length || 0,
    active: data?.filter(d => d.status === 'active').length || 0,
    // ... other stats
  }

  // 🔄 HANDLERS: CRUD operations with optimistic updates
  const handleCreate = async (formData: any) => {
    const loadingId = showLoading('Creating...', 'Please wait')
    try {
      await create(formData)
      removeToast(loadingId)
      showSuccess('Created successfully', 'Item has been added')
      setModalOpen(false)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to create', error.message || 'Please try again')
    }
  }

  return (
    <SalonLuxePage
      title="Your Page Title"
      description="Your page description"
      actions={
        <>
          {/* Navigation - Emerald */}
          <button
            onClick={() => router.push('/salon/related-page')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.emerald}`
            }}
          >
            <Icon className="w-4 h-4" />
            Related Feature
          </button>
          {/* Primary Action - Gold */}
          <button
            onClick={() => setModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black,
              border: `1px solid ${COLORS.gold}`
            }}
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
          {/* Refresh - Bronze (icon only, at the end) */}
          <button
            onClick={() => refetch()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
      }
    >
      {/* 📱 MOBILE HEADER */}
      <PremiumMobileHeader
        title="Page Title"
        subtitle={`${stats.total} items`}
        showNotifications
        notificationCount={stats.pending || 0}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => setModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Add new"
            style={{ boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)' }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* 📊 KPI CARDS - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <SalonLuxeKPICard
            title="Total Items"
            value={stats.total}
            icon={YourIcon}
            color={COLORS.bronze}
            description="All items"
            animationDelay={0}
          />
          {/* Add more KPI cards */}
        </div>

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 flex gap-2">
          <button
            onClick={() => router.push('/salon/related-page')}
            className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne
            }}
          >
            <Icon className="w-4 h-4" />
            Related Feature
          </button>
          <button
            onClick={() => refetch()}
            className="min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 🔄 MAIN CONTENT - Lazy Loaded */}
        <Suspense fallback={<TabLoader />}>
          <YourMainComponent
            data={data || []}
            isLoading={isLoading}
            onCreate={() => setModalOpen(true)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </Suspense>

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-20 md:h-0" />
      </div>

      {/* MODAL - Lazy Loaded */}
      {modalOpen && (
        <Suspense fallback={null}>
          <YourModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSubmit={handleCreate}
            isLoading={isCreating}
          />
        </Suspense>
      )}
    </SalonLuxePage>
  )
}

export default function YourPage() {
  return (
    <StatusToastProvider>
      <YourPageContent />
    </StatusToastProvider>
  )
}
```

---

## ✅ Standardization Checklist

For each page, verify ALL items:

### 🚀 Performance
- [ ] Lazy loading with `React.lazy()` for heavy components
- [ ] Suspense boundaries with loading fallbacks
- [ ] useMemo for expensive calculations (filters, stats)
- [ ] Optimistic cache updates (React Query)
- [ ] No unnecessary refetch on tab/view changes

### 📱 Mobile-First
- [ ] PremiumMobileHeader component
- [ ] Mobile quick actions section (touch-friendly 48px)
- [ ] Responsive KPI grid (2 cols → 4 cols)
- [ ] Desktop actions hidden on mobile (`hidden md:flex`)
- [ ] Bottom spacing for scroll comfort (`h-20 md:h-0`)
- [ ] All buttons have active:scale-95 for tactile feedback

### 🎨 Enterprise Design
- [ ] Salon Luxe color palette (gold, emerald, plum, bronze)
- [ ] No adjacent buttons with same color
- [ ] Enterprise-grade button text (action-oriented)
- [ ] Refresh button icon-only, positioned at the end
- [ ] Font weight: `font-semibold` for buttons
- [ ] Hover scale: 1.05x, Active scale: 0.95x

### 🏗️ Code Quality
- [ ] StatusToastProvider wrapper
- [ ] useSecuredSalonContext for organization
- [ ] Error handling with try/catch
- [ ] Loading states for all async operations
- [ ] TypeScript types defined
- [ ] Comments for major sections

### ♿ Accessibility
- [ ] aria-label on icon-only buttons
- [ ] title attribute for tooltips
- [ ] Keyboard navigation support
- [ ] Color contrast WCAG AA compliant
- [ ] Focus visible states

---

## 🛠️ Implementation Strategy

### Step 1: Quick Wins (Week 1)
Update Tier 1 pages (7 pages) using the template:
- Appointments
- POS
- Customers
- Services
- Products
- Dashboard
- Receptionist

### Step 2: Operations (Week 2)
Update Tier 2 pages (6 pages):
- Inventory
- Branches
- Categories
- Reports
- Finance
- Settings

### Step 3: Advanced (Week 3)
Update Tier 3 pages (6 pages):
- WhatsApp
- Compliance
- Gift Cards
- Financial Statements

### Step 4: Cleanup (Week 4)
- Archive experimental pages
- Merge v2 pages into production
- Remove deprecated pages
- Update documentation

---

## 📊 Expected Results

**Before Standardization**:
- ❌ Inconsistent mobile experience
- ❌ Large initial bundle sizes
- ❌ Slow page load times (3-5s)
- ❌ Mixed color schemes
- ❌ No touch optimization

**After Standardization**:
- ✅ Consistent iOS/Android feel
- ✅ Code-split bundles (lazy loading)
- ✅ Fast page loads (< 1.5s)
- ✅ Salon Luxe theme throughout
- ✅ Touch-optimized (48px targets)
- ✅ Professional enterprise UX

---

## 🎯 Success Metrics

Track these for each updated page:

1. **Performance**:
   - Initial Load Time: < 1.5s
   - Time to Interactive: < 2.5s
   - Lighthouse Mobile Score: > 90

2. **Mobile UX**:
   - Touch target size: ≥ 48px
   - Active state feedback: ✅
   - Bottom spacing: ✅
   - Responsive grid: ✅

3. **Code Quality**:
   - Lazy loading: ✅
   - TypeScript: ✅
   - Error handling: ✅
   - Loading states: ✅

4. **Design Consistency**:
   - Salon Luxe colors: ✅
   - Enterprise button text: ✅
   - No color repetition: ✅

---

## 📚 Reference Documents

- **Template**: `/src/app/salon/staffs/page.tsx` (Production-ready)
- **Components**: `/src/components/salon/shared/*`
- **Mobile Components**: `/src/components/salon/mobile/*`
- **Color Palette**: Lines 33-45 in staffs page
- **Mobile Checklist**: `/docs/salon/MOBILE-FIRST-STANDARDIZATION-CHECKLIST.md`

---

## 🚀 Ready to Start?

**Recommended approach**:

1. Pick ONE Tier 1 page (e.g., `/salon/appointments`)
2. Follow the template step-by-step
3. Test on mobile device (iOS/Android)
4. Run lighthouse mobile audit
5. Verify all checklist items
6. Commit with message: `feat: standardize [page] to salon luxe theme`
7. Repeat for next page

**Time estimate**: 2-3 hours per page (experienced developer)

---

**Status**: Ready for Implementation
**Last Updated**: October 23, 2025
**Version**: 1.0
