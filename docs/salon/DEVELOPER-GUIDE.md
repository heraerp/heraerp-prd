# HERA Salon Module - Developer Guide

**Version**: 2.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.DEVELOPER.GUIDE.v1`

> **Complete reference for developing and maintaining the HERA Salon DNA Module**

---

## 🎯 Purpose

This guide enables Claude CLI and developers to:
- ✅ Add new features following established patterns
- ✅ Fix bugs without breaking existing functionality
- ✅ Understand complete architecture and design decisions
- ✅ Maintain consistency with HERA DNA principles
- ✅ Implement mobile-first responsive UI correctly
- ✅ Follow Sacred Six and Smart Code conventions

---

## 📚 Table of Contents

### Quick Start
1. [Architecture Overview](#architecture-overview)
2. [Development Workflow](#development-workflow)
3. [Quality Gates Checklist](#quality-gates-checklist)

### Feature Documentation
- [Dashboard](./features/DASHBOARD.md) - Progressive loading, period filters, KPIs
- [Point of Sale](./features/POINT-OF-SALE.md) - Catalog, cart, payment processing
- [Appointments](./features/APPOINTMENTS.md) - Calendar, booking, kanban board
- [Customers](./features/CUSTOMERS.md) - Customer management, LTV tracking
- [Services](./features/SERVICES.md) - Service catalog, categories, pricing
- [Products](./features/PRODUCTS.md) - Product inventory, stock management
- [Inventory](./features/INVENTORY.md) - Purchase orders, suppliers, stock levels
- [Staff Management](./features/STAFF.md) - Roles, permissions, performance
- [Leave Management](./features/LEAVE-MANAGEMENT.md) - Requests, approvals, calendar
- [Reports](./features/REPORTS.md) - Sales reports, analytics, exports
- [Settings](./features/SETTINGS.md) - Organization preferences
- [Finance Integration](./features/FINANCE.md) - GL posting, journal entries
- [Receptionist Workflow](./features/RECEPTIONIST.md) - Role-specific features
- [WhatsApp Integration](./features/WHATSAPP.md) - Campaigns, notifications

### Technical Reference
- [Authentication & Security](./features/AUTHENTICATION.md)
- [Mobile-First Layout](./features/MOBILE-LAYOUT.md)
- [Shared Components](./features/SHARED-COMPONENTS.md)
- [Custom Hooks](./features/HOOKS.md)
- [API Routes & RPC](./features/API-ROUTES.md)
- [Data Models & Sacred Six](./features/DATA-MODELS.md)
- [Theming & Design System](./features/THEMING.md)
- [Performance Optimization](./features/PERFORMANCE.md)
- [Testing Strategy](./features/TESTING.md)

### Complete Reference
- [**COMPLETE-DEVELOPER-REFERENCE.md**](./COMPLETE-DEVELOPER-REFERENCE.md) - All guides in one document

---

## 🏗️ Architecture Overview

### Technology Stack

```
Frontend:
├── Next.js 15.4.2 (App Router)
├── React 19.1.0 (Server Components)
├── TypeScript 5.8.3 (Strict Mode)
└── Tailwind CSS 4.1.11 (Luxe Design System)

Backend:
├── Universal API v2 (HERA DNA)
├── PostgreSQL (Supabase)
├── Sacred Six Tables
└── Smart Code Engine

Patterns:
├── Mobile-First Responsive
├── Progressive Loading
├── Lazy Loading with Suspense
├── Optimistic UI Updates
└── Real-time Sync (localStorage events)
```

### HERA DNA Core Principles

1. **Sacred Six Tables** - All data in 6 universal tables
   - `core_organizations` - Multi-tenant isolation
   - `core_entities` - Customers, services, products, staff
   - `core_dynamic_data` - Flexible attributes
   - `core_relationships` - Entity connections
   - `universal_transactions` - Appointments, sales, payments
   - `universal_transaction_lines` - Transaction details

2. **Smart Code Convention**
   - Format: `HERA.SALON.{MODULE}.{TYPE}.{SUBTYPE}.v1`
   - Example: `HERA.SALON.POS.CART.ACTIVE.v1`
   - Always UPPERCASE except `.v1`

3. **Organization Isolation**
   - Every query filtered by `organization_id`
   - Actor-based audit trail (`created_by`, `updated_by`)
   - Row-Level Security (RLS) enforcement

4. **Universal API v2**
   - All CRUD via `/api/v2/*` endpoints
   - RPC functions for complex operations
   - Automatic security and validation

---

## 🔄 Development Workflow

### Adding a New Feature

```bash
# 1. Create page component
/src/app/salon/[feature]/page.tsx

# 2. Create feature components
/src/components/salon/[feature]/

# 3. Create custom hooks (if needed)
/src/hooks/useHera[Feature].ts

# 4. Create API routes (if needed)
/src/app/api/v2/salon/[feature]/route.ts

# 5. Add E2E tests
/tests/e2e/salon/[feature].spec.ts

# 6. Update documentation
/docs/salon/features/[FEATURE].md
```

### Standard Page Template

```tsx
'use client'

import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import { PremiumMobileHeader } from '@/components/salon/shared/PremiumMobileHeader'
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const FeatureContent = lazy(() => import('@/components/salon/feature/FeatureContent'))

function FeaturePageContent() {
  const { organizationId, organization } = useSecuredSalonContext()

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* iOS status bar spacer - MANDATORY */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile header - MANDATORY */}
      <PremiumMobileHeader
        title="Feature Name"
        subtitle="Feature description"
        icon={<Icon className="w-5 h-5" />}
      />

      {/* Main content */}
      <Suspense fallback={<FeatureSkeleton />}>
        <FeatureContent organizationId={organizationId} />
      </Suspense>

      {/* Bottom spacing for mobile - MANDATORY */}
      <div className="h-24 md:h-0" />
    </div>
  )
}

export default function FeaturePage() {
  return (
    <SimpleSalonGuard requiredRoles={['owner', 'admin']}>
      <FeaturePageContent />
    </SimpleSalonGuard>
  )
}
```

---

## ✅ Quality Gates Checklist

Before merging any salon feature, verify:

### **Mobile-First Responsive**
- [ ] iOS status bar spacer (`h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden`)
- [ ] Touch targets >= 44px (`min-w-[44px] min-h-[44px]`)
- [ ] Active state feedback (`active:scale-95 transition-transform`)
- [ ] Bottom navigation visible on mobile
- [ ] Bottom spacing for comfortable scrolling (`h-24 md:h-0`)
- [ ] Tested on 375px width (iPhone SE)

### **Data & Architecture**
- [ ] Uses SecuredSalonProvider for organization context
- [ ] Stores data in Sacred Six tables correctly
- [ ] Includes Smart Code for all entities/transactions
- [ ] Filters by `organization_id` in all queries
- [ ] Actor-stamped (`created_by`, `updated_by`)

### **Performance**
- [ ] Heavy components lazy loaded with React.lazy()
- [ ] Suspense boundaries with skeleton loaders
- [ ] useMemo/useCallback for expensive operations
- [ ] Progressive loading for dashboard-style pages

### **UI/UX**
- [ ] Uses Luxe color system (charcoal, gold, champagne, bronze)
- [ ] Loading states with skeletons
- [ ] Error handling with user-friendly messages
- [ ] Toast notifications for user feedback

### **Security**
- [ ] SimpleSalonGuard with required roles
- [ ] Organization isolation verified
- [ ] Permission checks for sensitive operations
- [ ] No hardcoded organization IDs

### **Code Quality**
- [ ] TypeScript strict mode (no `any` types)
- [ ] Proper error handling (try/catch)
- [ ] Console logs for debugging (with context)
- [ ] E2E test coverage

---

## 🎨 Design System Reference

### Luxe Color Palette

```typescript
export const LUXE_COLORS = {
  // Core colors
  black: '#0B0B0B',           // Main background
  charcoal: '#1A1A1A',        // Card background
  charcoalLight: '#232323',   // Lighter surfaces
  charcoalDark: '#0F0F0F',    // Darker surfaces

  // Accent colors
  gold: '#D4AF37',            // Primary accent
  goldDark: '#B8860B',        // Darker gold
  champagne: '#F5E6C8',       // Light text
  bronze: '#8C7853',          // Muted text

  // Extended palette
  plum: '#B794F4',            // Purple accents
  emerald: '#10B981',         // Success/active
  rose: '#E8B4B8',            // Errors/warnings

  // Text colors
  lightText: '#E0E0E0'        // Secondary text
}
```

### Component Patterns

```tsx
// Card with gradient
<div
  className="rounded-xl p-6"
  style={{
    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoal} 100%)`,
    border: `1px solid ${LUXE_COLORS.gold}30`,
    boxShadow: `0 8px 32px ${LUXE_COLORS.black}80`
  }}
>
  {/* Content */}
</div>

// Button with active state
<button
  className="min-h-[44px] rounded-lg px-4 active:scale-95 transition-transform"
  style={{
    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
    color: LUXE_COLORS.black
  }}
>
  Action
</button>

// Text with gradient
<h1
  className="text-3xl font-bold"
  style={{
    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }}
>
  Title
</h1>
```

---

## 🔧 Common Patterns

### Data Fetching

```tsx
import { useHeraAppointments } from '@/hooks/useHeraAppointments'

const { appointments, isLoading, error, refetch } = useHeraAppointments({
  organizationId,
  filters: {
    date_from: '2025-01-01',
    date_to: '2025-01-31'
  }
})
```

### Optimistic Updates

```tsx
// 1. Update UI immediately
setAppointments(prev => [...prev, newAppointment])

// 2. Call API
try {
  await createAppointment(data)
  // 3. Refetch to sync
  setTimeout(() => refetch(), 100)
} catch (error) {
  // 4. Revert on error
  setAppointments(originalAppointments)
  toast({ title: 'Failed', variant: 'destructive' })
}
```

### Auto-Refresh (Cross-Tab Sync)

```tsx
// Trigger refresh in other tabs
localStorage.setItem('appointment_status_updated', JSON.stringify({
  appointment_id: id,
  status: 'completed',
  timestamp: new Date().toISOString()
}))

// Listen for refresh events
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'appointment_status_updated') {
      refetchAppointments()
      localStorage.removeItem('appointment_status_updated')
    }
  }
  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [refetchAppointments])
```

---

## 📖 Key Files Reference

### Core Layout & Auth
```
/src/app/salon/
├── layout.tsx                    # Salon layout wrapper
├── SecuredSalonProvider.tsx      # Organization context provider
└── page.tsx                      # Redirects to dashboard

/src/components/salon/auth/
├── SimpleSalonGuard.tsx          # Role-based access control
└── HairTalkzAuth.tsx             # Authentication flow
```

### Main Features
```
/src/app/salon/
├── dashboard/page.tsx            # Main dashboard
├── pos/page.tsx                  # Point of Sale
├── appointments/                 # Appointment management
│   ├── page.tsx                  # Appointments list
│   ├── calendar/page.tsx         # Calendar view
│   └── new/page.tsx              # New appointment
├── customers/page.tsx            # Customer management
├── services/page.tsx             # Service catalog
├── products/page.tsx             # Product inventory
├── inventory/page.tsx            # Inventory management
├── staffs/page.tsx               # Staff management
├── leave/page.tsx                # Leave management
└── settings/page.tsx             # Settings
```

### Shared Components
```
/src/components/salon/shared/
├── SalonLuxePage.tsx             # Page wrapper
├── PremiumMobileHeader.tsx       # Mobile header component
├── SalonLuxeButton.tsx           # Button component
├── SalonLuxeModal.tsx            # Modal component
├── SalonLuxeTile.tsx             # Tile component
├── SalonLuxeInput.tsx            # Input component
├── SalonLuxeSelect.tsx           # Select component
└── SalonLuxeBadge.tsx            # Badge component
```

### Custom Hooks
```
/src/hooks/
├── useHeraAppointments.ts        # Appointment data
├── useHeraCustomers.ts           # Customer data
├── useHeraServices.ts            # Service data
├── useHeraProducts.ts            # Product data
├── useHeraStockLevels.ts         # Inventory data
├── usePosTicket.ts               # POS cart management
├── useSalonDashboard.ts          # Dashboard KPIs
└── useSalonSecurity.ts           # Security context
```

---

## 🚨 Common Pitfalls & Solutions

### ❌ Problem: Missing organization context
```tsx
// ❌ WRONG - No organization context
function MyComponent() {
  const { data } = useHeraCustomers()
  // ...
}

// ✅ CORRECT - Use SecuredSalonProvider
function MyComponent() {
  const { organizationId } = useSecuredSalonContext()
  const { data } = useHeraCustomers({ organizationId })
  // ...
}
```

### ❌ Problem: Not mobile-responsive
```tsx
// ❌ WRONG - Desktop-only layout
<div className="p-8">
  <h1 className="text-4xl">Title</h1>
</div>

// ✅ CORRECT - Mobile-first responsive
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-3xl lg:text-4xl">Title</h1>
</div>
```

### ❌ Problem: Missing loading states
```tsx
// ❌ WRONG - No loading state
function MyComponent() {
  const { data } = useHeraCustomers({ organizationId })
  return <div>{data.map(/* ... */)}</div>
}

// ✅ CORRECT - With skeleton loader
function MyComponent() {
  const { data, isLoading } = useHeraCustomers({ organizationId })
  if (isLoading) return <CustomerListSkeleton />
  return <div>{data.map(/* ... */)}</div>
}
```

---

## 📞 Support & Resources

### Documentation Hierarchy
1. **This Guide** - Quick reference and navigation
2. **Feature Guides** - Detailed feature documentation
3. **Complete Reference** - Consolidated single document
4. **Code Examples** - Working templates

### Related HERA Documentation
- [HERA DNA Overview](../README.md)
- [Universal API v2](../api/v2/README.md)
- [Sacred Six Schema](../schema/hera-sacred-six-schema.yaml)
- [Smart Code Guide](../playbooks/_shared/SMART_CODE_GUIDE.md)

### File Locations
- **Feature Docs**: `/docs/salon/features/*.md`
- **Examples**: `/docs/salon/examples/*.tsx`
- **Architecture**: `/docs/salon/architecture.md`
- **API Docs**: `/docs/api/v2/README.md`

---

## 🎯 Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production

# Testing
npm run test:e2e              # Run E2E tests
npm run test:e2e:salon        # Salon-specific E2E tests

# Code Quality
npm run lint                   # Run ESLint
npm run typecheck             # TypeScript check
npm run format                # Format with Prettier

# Database
npm run schema:check          # Check Sacred Six schema
npm run schema:types          # Generate TypeScript types
```

---

## 📊 Success Metrics

A feature is ready for production when:
- ✅ All quality gates pass
- ✅ E2E tests cover main workflows
- ✅ Mobile responsive on 375px+ screens
- ✅ Uses Sacred Six tables correctly
- ✅ Follows Luxe design system
- ✅ Documentation updated
- ✅ Code review approved

---

<div align="center">

**Built with HERA DNA** | **Salon Module v2.0** | **Enterprise Ready**

[Feature Docs](./features/) | [Complete Reference](./COMPLETE-DEVELOPER-REFERENCE.md) | [Code Examples](./examples/)

</div>
