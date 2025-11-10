# MOBILE-LAYOUT.md - HERA Mobile-First Responsive Design Technical Guide

**Technical Guide** | Last Updated: 2025-11-07
**Status**: ✅ Production Standard | **Philosophy**: Mobile-First, Native App Feel

---

## 📋 Table of Contents

1. [Mobile-First Philosophy](#mobile-first-philosophy)
2. [Dual-Experience Architecture](#dual-experience-architecture)
3. [Mobile Navigation System](#mobile-navigation-system)
4. [Standard Page Structure](#standard-page-structure)
5. [Mobile Header Pattern](#mobile-header-pattern)
6. [Responsive Component Library](#responsive-component-library)
7. [Touch Target Standards](#touch-target-standards)
8. [Typography & Spacing](#typography--spacing)
9. [Design Tokens](#design-tokens)
10. [Performance Optimization](#performance-optimization)
11. [iOS/Android Native Patterns](#iosandroid-native-patterns)
12. [Accessibility Standards](#accessibility-standards)
13. [Testing Guidelines](#testing-guidelines)

---

## Mobile-First Philosophy

### 🎯 **Core Principle**

**"Design for mobile first, enhance progressively for desktop"**

HERA implements a true mobile-first approach where:
- Mobile experience is the PRIMARY design target
- Desktop gets ADDITIONAL features and enhancements
- Every component works perfectly on small screens FIRST
- Progressive enhancement adds desktop-specific features

```
┌─────────────────────────────────────────────────────────────────┐
│                 MOBILE-FIRST DEVELOPMENT FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Design for 375px (iPhone SE) → Base experience             │
│     ↓                                                           │
│  2. Enhance for 768px (iPad) → Tablet layout                   │
│     ↓                                                           │
│  3. Enhance for 1024px+ (Desktop) → Advanced features          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 📱 **Mobile-First Benefits**

1. **Faster Development**: Build once, enhance progressively
2. **Better Performance**: Smaller bundle sizes, faster loads
3. **Universal Compatibility**: Works on ALL devices
4. **Native App Feel**: iOS/Android design patterns
5. **User Satisfaction**: Majority of users on mobile

---

## Dual-Experience Architecture

HERA delivers TWO distinct, optimized experiences based on device:

### 🖥️ **Desktop Experience: SAP Fiori Enterprise**

**Characteristics**:
- Wide-screen layouts with data density
- Multi-column grids (3-4 columns)
- Detailed tables with many columns
- Advanced filtering and bulk operations
- Keyboard shortcuts and power user features
- Fixed left sidebar navigation (80px width)
- Hover states and tooltips

**Example Desktop Layout**:
```tsx
{/* Desktop: 4-column grid with detailed cards */}
<div className="hidden md:grid md:grid-cols-4 gap-6">
  {items.map(item => (
    <DetailedCard key={item.id} item={item} />
  ))}
</div>
```

### 📱 **Mobile Experience: Native App Feel**

**Characteristics**:
- Touch-optimized interactions (44px minimum targets)
- iOS/Android native patterns
- Progressive disclosure and focused tasks
- Thumb-friendly navigation zones
- Bottom tab navigation (iOS standard)
- Swipe gestures and pull-to-refresh
- Active state feedback (active:scale-95)

**Example Mobile Layout**:
```tsx
{/* Mobile: Single column with touch-friendly cards */}
<div className="md:hidden flex flex-col gap-4">
  {items.map(item => (
    <TouchFriendlyCard key={item.id} item={item} />
  ))}
</div>
```

---

## Mobile Navigation System

### 📱 **SalonMobileBottomNav** Component

HERA uses iOS/Android-style bottom tab navigation for mobile:

```typescript
// File: /src/components/salon/mobile/SalonMobileBottomNav.tsx
interface SalonMobileBottomNavProps {
  /** User's salon role for role-based navigation */
  userRole?: string
  /** Additional navigation items (max 5 total) */
  customItems?: NavItem[]
  /** Show notification badges */
  badges?: Record<string, number>
}
```

**Features**:
- ✅ Fixed bottom positioning (safe area aware)
- ✅ 5 tabs maximum (iOS standard)
- ✅ Active state with haptic feedback (active:scale-95)
- ✅ Icon + label layout
- ✅ Gold accent for active tab
- ✅ Role-based navigation items
- ✅ Smooth transitions and animations
- ✅ 56px height (iOS tab bar standard)

**Usage Example**:
```tsx
import { SalonMobileBottomNav } from '@/components/salon/mobile/SalonMobileBottomNav'

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const { role } = useHERAAuth()

  return (
    <div>
      {/* Desktop sidebar (hidden on mobile) */}
      <SalonSidebar className="hidden md:block" />

      {/* Page content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Mobile bottom navigation (hidden on desktop) */}
      <SalonMobileBottomNav
        userRole={role}
        badges={{
          '/salon/appointments': 3,  // 3 pending appointments
          '/salon/customers': 1      // 1 new customer
        }}
      />
    </div>
  )
}
```

### 🔄 **Role-Based Navigation Items**

```typescript
// Owner navigation (full access)
const ownerNavItems = [
  { title: 'Home', href: '/salon/dashboard', icon: Home },
  { title: 'Appointments', href: '/salon/appointments', icon: Calendar },
  { title: 'POS', href: '/salon/pos', icon: CreditCard },
  { title: 'Customers', href: '/salon/customers', icon: Users },
  { title: 'More', href: '/salon/more', icon: MoreHorizontal }
]

// Receptionist navigation (customer-facing)
const receptionistNavItems = [
  { title: 'Home', href: '/salon/receptionist', icon: Home },
  { title: 'Appointments', href: '/salon/appointments', icon: Calendar },
  { title: 'POS', href: '/salon/pos', icon: CreditCard },
  { title: 'Customers', href: '/salon/customers', icon: Users },
  { title: 'More', href: '/salon/more', icon: MoreHorizontal }
]

// Accountant navigation (finance-focused)
const accountantNavItems = [
  { title: 'Home', href: '/salon/dashboard', icon: Home },
  { title: 'Finance', href: '/salon/finance', icon: CreditCard },
  { title: 'Reports', href: '/salon/reports', icon: Calendar },
  { title: 'More', href: '/salon/more', icon: MoreHorizontal }
]
```

### 🎨 **Navigation Design Tokens**

```typescript
const BOTTOM_NAV_DESIGN = {
  height: '56px',                          // iOS tab bar standard
  backgroundColor: '#0B0B0Bf5',            // 96% opacity charcoal
  borderColor: '#D4AF3715',                // 8% opacity gold
  boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
  safeAreaInset: 'env(safe-area-inset-bottom)', // iPhone notch support

  // Tab button
  minWidth: '56px',
  minHeight: '48px',
  gap: '4px',                              // Icon to label spacing

  // Icon
  iconSize: '24px',
  iconColorActive: '#D4AF37',              // Gold
  iconColorInactive: '#B8956A',            // Bronze

  // Label
  labelSize: '10px',
  labelColorActive: '#D4AF37',             // Gold
  labelColorInactive: '#B8956Acc',         // 80% opacity bronze

  // Badge
  badgeBackground: '#E8B4B8',              // Rose
  badgeColor: '#0B0B0B',                   // Black text
  badgeSize: '16px',
  badgeMinWidth: '16px'
}
```

---

## Standard Page Structure

### 📐 **Complete Page Template**

Every HERA salon page MUST follow this structure:

```tsx
'use client'

import { lazy, Suspense } from 'react'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useSecuredSalonContext } from '../SecuredSalonProvider'

// Lazy load major sections for performance
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
    <SalonLuxePage
      title="Page Title"
      description="Page description"
      maxWidth="full"
      padding="lg"
    >
      {/* ===== MOBILE HEADER ===== */}
      {/* iOS-style status bar spacer - MOBILE ONLY */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile App Header - MOBILE ONLY */}
      <Suspense fallback={<div className="h-16 md:hidden" />}>
        <PageHeader user={user} organizationId={organizationId} />
      </Suspense>

      {/* ===== KPI CARDS ===== */}
      <Suspense fallback={<KPISkeleton />}>
        <PageKPIs organizationId={organizationId} />
      </Suspense>

      {/* ===== MAIN CONTENT ===== */}
      <Suspense fallback={<ContentSkeleton />}>
        <PageContent organizationId={organizationId} role={role} />
      </Suspense>

      {/* Bottom spacing for mobile navigation clearance */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}
```

### 🎯 **Key Structure Elements**

1. **`'use client'`**: Required for client-side interactivity
2. **Lazy Loading**: Split heavy components with `lazy()` and `Suspense`
3. **SalonLuxePage**: Consistent wrapper with theme and animations
4. **Mobile Header**: iOS-style header with status bar spacer
5. **Suspense Boundaries**: Progressive loading with skeleton states
6. **Bottom Spacing**: Clearance for mobile bottom navigation (h-24 = 96px)

---

## Mobile Header Pattern

### 📱 **iOS-Style Mobile Header**

HERA implements a native iOS/Android-style header on mobile:

```tsx
{/* iOS-style status bar spacer - 44px (11 × 4px) */}
<div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

{/* Mobile app header - Sticky at top */}
<div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
  <div className="flex items-center justify-between p-4">
    {/* Left: App icon + title */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-gold" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-champagne">Page Title</h1>
        <p className="text-xs text-bronze">Subtitle or context</p>
      </div>
    </div>

    {/* Right: Action button with notification badge */}
    <button className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95 transition-transform">
      <Bell className="w-5 h-5 text-gold" />
      {notificationCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-rose text-white text-xs rounded-full flex items-center justify-center">
          {notificationCount}
        </span>
      )}
    </button>
  </div>
</div>
```

### 🎨 **Mobile Header Design Tokens**

```typescript
const MOBILE_HEADER_DESIGN = {
  // Status bar spacer (for iOS safe area)
  statusBarHeight: '44px',                 // iOS standard
  statusBarBackground: 'from-black/20 to-transparent',

  // Header container
  headerBackground: '#0B0B0B',             // Charcoal
  headerBorder: '#D4AF3733',               // 20% opacity gold
  headerPadding: '16px',                   // 4 × 4px

  // App icon
  iconSize: '40px',
  iconBorder Radius: '12px',               // xl rounded
  iconBackground: '#D4AF3733',             // 20% opacity gold
  iconColor: '#D4AF37',                    // Gold

  // Title
  titleSize: '18px',                       // lg text
  titleColor: '#F5F5DC',                   // Champagne
  titleWeight: 'bold',

  // Subtitle
  subtitleSize: '12px',                    // xs text
  subtitleColor: '#B8956A',                // Bronze

  // Action button
  actionSize: '44px',                      // Minimum touch target
  actionBorderRadius: '50%',               // Full rounded
  actionBackground: '#D4AF371A',           // 10% opacity gold
  actionColor: '#D4AF37'                   // Gold
}
```

---

## Responsive Component Library

### 📦 **SalonLuxePage** Component

Main page wrapper with mobile enhancements:

```typescript
// File: /src/components/salon/shared/SalonLuxePage.tsx
interface SalonLuxePageProps {
  children: ReactNode
  title?: string                           // Gradient title (desktop only)
  description?: string                     // Subtitle (desktop only)
  actions?: ReactNode                      // Header actions (desktop only)
  showAnimatedBackground?: boolean         // Animated gradients
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Features**:
- ✅ Responsive max-width constraints
- ✅ Animated golden gradient backgrounds
- ✅ Glassmorphism effects
- ✅ Desktop header (hidden on mobile)
- ✅ Consistent spacing and layout
- ✅ Fade-in animations on mount

**Usage**:
```tsx
<SalonLuxePage
  title="Dashboard"                        // Desktop only
  description="Overview of salon metrics"  // Desktop only
  actions={<Button>New Appointment</Button>}  // Desktop only
  maxWidth="full"
  padding="lg"
>
  {/* Mobile header (separate component) */}
  <MobileHeader />

  {/* Your page content */}
  <div>...</div>
</SalonLuxePage>
```

### 📊 **SalonLuxeKPICard** Component

Responsive KPI cards for metrics:

```typescript
interface SalonLuxeKPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string                            // Gold, emerald, rose, etc.
  description?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  onClick?: () => void                     // Make card clickable
}
```

**Responsive Grid Pattern**:
```tsx
{/* KPI Cards: 2 columns mobile, 4 columns desktop */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
  <SalonLuxeKPICard
    title="Revenue"
    value={`AED ${revenue.toLocaleString()}`}
    icon={DollarSign}
    color={SALON_LUXE_COLORS.gold.base}
    description="Current month"
    trend={{ value: 12.5, direction: 'up' }}
  />
  <SalonLuxeKPICard
    title="Appointments"
    value={appointmentCount}
    icon={Calendar}
    color={SALON_LUXE_COLORS.emerald.base}
  />
  {/* More KPI cards... */}
</div>
```

---

## Touch Target Standards

### 🎯 **Minimum Touch Target Sizes**

**iOS Human Interface Guidelines**: 44pt × 44pt (44px × 44px)
**Android Material Design**: 48dp × 48dp (48px × 48px)
**HERA Standard**: 44px × 44px minimum

```tsx
// ✅ CORRECT - 44px minimum
<button className="min-h-[44px] min-w-[44px] rounded-full">
  <Icon className="w-5 h-5" />
</button>

// ✅ CORRECT - Comfortable touch target with padding
<button className="h-12 px-6 rounded-xl">
  Action Button
</button>

// ❌ WRONG - Too small (32px)
<button className="h-8 w-8">
  <Icon className="w-4 h-4" />
</button>
```

### 🔘 **Touch Target Classes**

```typescript
// Predefined touch-friendly classes
const TOUCH_TARGET_CLASSES = {
  // Icon buttons
  iconSmall: 'w-11 h-11',                  // 44px (minimum)
  iconMedium: 'w-12 h-12',                 // 48px (comfortable)
  iconLarge: 'w-14 h-14',                  // 56px (large)

  // Text buttons
  buttonSmall: 'min-h-11 px-4',            // 44px height
  buttonMedium: 'min-h-12 px-6',           // 48px height
  buttonLarge: 'min-h-14 px-8',            // 56px height

  // List items
  listItem: 'min-h-16 p-4',                // 64px (with padding)

  // Cards
  cardTouchable: 'min-h-20 p-4'            // 80px (with padding)
}
```

### 💫 **Active State Feedback**

ALL interactive elements MUST have touch feedback:

```tsx
// Standard active state (native app feel)
className="active:scale-95 transition-transform duration-150"

// With background change
className="active:scale-95 active:bg-gold/20 transition-all duration-150"

// List item with subtle feedback
className="active:bg-white/5 transition-colors duration-150"
```

---

## Typography & Spacing

### 📝 **Responsive Typography Scale**

```tsx
// Headings (progressively scale up on desktop)
const HEADING_CLASSES = {
  h1: 'text-2xl md:text-4xl font-bold',   // Mobile: 32px, Desktop: 48px
  h2: 'text-xl md:text-3xl font-bold',    // Mobile: 24px, Desktop: 36px
  h3: 'text-lg md:text-2xl font-semibold', // Mobile: 18px, Desktop: 28px
  h4: 'text-base md:text-xl font-semibold' // Mobile: 16px, Desktop: 24px
}

// Body text
const BODY_CLASSES = {
  large: 'text-base md:text-lg',          // Mobile: 16px, Desktop: 18px
  base: 'text-sm md:text-base',           // Mobile: 14px, Desktop: 16px
  small: 'text-xs md:text-sm',            // Mobile: 12px, Desktop: 14px
  tiny: 'text-[10px] md:text-xs'          // Mobile: 10px, Desktop: 12px
}

// Numbers and values (larger for emphasis)
const VALUE_CLASSES = {
  large: 'text-3xl md:text-5xl font-bold', // Mobile: 36px, Desktop: 60px
  medium: 'text-2xl md:text-4xl font-bold', // Mobile: 28px, Desktop: 48px
  small: 'text-xl md:text-2xl font-bold'  // Mobile: 20px, Desktop: 28px
}
```

### 📏 **Responsive Spacing Scale**

```tsx
// Padding (responsive container padding)
const PADDING_CLASSES = {
  page: 'p-4 md:p-6 lg:p-8',              // Mobile: 16px, Tablet: 24px, Desktop: 32px
  card: 'p-4 md:p-6',                     // Mobile: 16px, Desktop: 24px
  section: 'p-3 md:p-4',                  // Mobile: 12px, Desktop: 16px
  tight: 'p-2 md:p-3'                     // Mobile: 8px, Desktop: 12px
}

// Spacing between elements (vertical stacking)
const SPACING_CLASSES = {
  sections: 'space-y-6 md:space-y-8',     // Mobile: 24px, Desktop: 32px
  elements: 'space-y-4 md:space-y-6',     // Mobile: 16px, Desktop: 24px
  items: 'space-y-2 md:space-y-3',        // Mobile: 8px, Desktop: 12px
  tight: 'space-y-1 md:space-y-2'         // Mobile: 4px, Desktop: 8px
}

// Grid gaps
const GAP_CLASSES = {
  large: 'gap-6 md:gap-8',                // Mobile: 24px, Desktop: 32px
  medium: 'gap-4 md:gap-6',               // Mobile: 16px, Desktop: 24px
  small: 'gap-3 md:gap-4',                // Mobile: 12px, Desktop: 16px
  tight: 'gap-2 md:gap-3'                 // Mobile: 8px, Desktop: 12px
}
```

---

## Design Tokens

### 🎨 **Complete Mobile Design Token System**

```typescript
// File: /src/lib/constants/mobile-design-tokens.ts
export const MOBILE_DESIGN_TOKENS = {
  // ===== TOUCH TARGETS =====
  touchTarget: {
    min: '44px',                           // iOS HIG minimum
    comfortable: '48px',                   // Android Material minimum
    large: '56px',                         // Large touch target
    extraLarge: '64px'                     // Extra large (list items)
  },

  // ===== SPACING SCALES =====
  spacing: {
    mobile: {
      xs: '0.5rem',   // 8px
      sm: '0.75rem',  // 12px
      md: '1rem',     // 16px
      lg: '1.5rem',   // 24px
      xl: '2rem',     // 32px
      '2xl': '2.5rem' // 40px
    },
    desktop: {
      xs: '0.75rem',  // 12px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
      '2xl': '4rem'   // 64px
    }
  },

  // ===== TYPOGRAPHY SCALES =====
  fontSize: {
    mobile: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'  // 36px
    },
    desktop: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2.25rem', // 36px
      '4xl': '3rem'    // 48px
    }
  },

  // ===== BORDER RADIUS =====
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
  },

  // ===== Z-INDEX HIERARCHY =====
  zIndex: {
    mobileNav: 50,         // Bottom navigation
    stickyHeader: 40,      // Sticky mobile header
    filterBar: 30,         // Filter toolbar
    dropdown: 20,          // Dropdowns and popovers
    modal: 60,             // Modal overlays
    toast: 70              // Toast notifications
  },

  // ===== ANIMATION TIMINGS =====
  animation: {
    fast: '150ms',         // Quick feedback
    normal: '200ms',       // Standard transitions
    slow: '300ms',         // Smooth animations
    slowest: '500ms'       // Enter/exit animations
  },

  // ===== BREAKPOINTS =====
  breakpoints: {
    sm: '640px',           // Large phones
    md: '768px',           // Tablets
    lg: '1024px',          // Laptops
    xl: '1280px',          // Desktops
    '2xl': '1536px'        // Large screens
  }
}
```

---

## Performance Optimization

### ⚡ **Lazy Loading Strategy**

HERA implements aggressive lazy loading for optimal mobile performance:

```tsx
import { lazy, Suspense } from 'react'

// Split major sections into separate chunks
const PageHeader = lazy(() => import('./PageHeader'))
const FilterBar = lazy(() => import('./FilterBar'))
const StatsCards = lazy(() => import('./StatsCards'))
const ContentGrid = lazy(() => import('./ContentGrid'))
const ActionModal = lazy(() => import('./ActionModal'))

export default function Page() {
  return (
    <div>
      {/* Load header immediately (above fold) */}
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader />
      </Suspense>

      {/* Defer filter bar (slight delay acceptable) */}
      <Suspense fallback={<div className="h-16" />}>
        <FilterBar />
      </Suspense>

      {/* Progressive loading: Stats → Content */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <ContentGrid />
      </Suspense>

      {/* Only load modal when needed (not on initial page load) */}
      {showModal && (
        <Suspense fallback={null}>
          <ActionModal />
        </Suspense>
      )}
    </div>
  )
}
```

### 🎭 **Skeleton Loader Pattern**

```tsx
// Shimmer animation effect
const shimmerAnimation = `
  animate-pulse bg-gradient-to-r
  from-charcoal via-charcoalLight to-charcoal
  bg-[length:200%_100%]
`

// KPI Card Skeleton
export function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-6 rounded-xl bg-charcoalLight/50">
          <div className={`h-4 w-24 bg-bronze/20 rounded mb-2 ${shimmerAnimation}`} />
          <div className={`h-8 w-16 bg-gold/20 rounded ${shimmerAnimation}`} />
        </div>
      ))}
    </div>
  )
}

// Content Grid Skeleton
export function ContentSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="p-6 rounded-xl bg-charcoalLight/50">
          <div className={`h-40 w-full bg-bronze/20 rounded mb-4 ${shimmerAnimation}`} />
          <div className={`h-4 w-3/4 bg-gold/20 rounded mb-2 ${shimmerAnimation}`} />
          <div className={`h-4 w-1/2 bg-bronze/20 rounded ${shimmerAnimation}`} />
        </div>
      ))}
    </div>
  )
}
```

### 📦 **Bundle Size Optimization**

```typescript
// Target bundle sizes per page:
// - Page component: < 50KB
// - Total page bundle: < 200KB
// - Initial JS load: < 300KB

// ✅ Use dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false  // Don't server-render (client-only)
})

// ✅ Use tree-shakeable icon imports
import { Home, Calendar, Users } from 'lucide-react'
// ❌ Don't import entire icon library
// import * as Icons from 'lucide-react'

// ✅ Use WebP images with fallback
<Image
  src="/image.webp"
  fallback="/image.jpg"
  width={400}
  height={300}
  loading="lazy"
/>
```

---

## iOS/Android Native Patterns

### 🍎 **iOS Design Patterns**

**1. Status Bar Safe Area**:
```tsx
{/* 44px spacer for iOS status bar */}
<div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
```

**2. Bottom Tab Bar**:
```tsx
{/* 56px height with safe area inset */}
<nav
  style={{
    height: '56px',
    paddingBottom: 'env(safe-area-inset-bottom)'
  }}
>
  {/* Tab items */}
</nav>
```

**3. Pull-to-Refresh** (future enhancement):
```tsx
import { PullToRefresh } from '@/lib/dna/components/mobile/PullToRefresh'

<PullToRefresh onRefresh={handleRefresh}>
  <ContentList />
</PullToRefresh>
```

**4. Swipe Gestures** (future enhancement):
```tsx
// Swipe left to delete (iOS Mail style)
<SwipeableListItem
  onSwipeLeft={() => handleDelete(item.id)}
  leftActions={[
    { label: 'Delete', color: 'red', icon: Trash }
  ]}
>
  <ItemContent />
</SwipeableListItem>
```

### 🤖 **Android Material Design Patterns**

**1. Floating Action Button (FAB)**:
```tsx
{/* Primary action button (bottom-right) */}
<button
  className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gold shadow-2xl active:scale-95 md:hidden"
  aria-label="Add new item"
>
  <Plus className="w-6 h-6 text-black" />
</button>
```

**2. Bottom Sheet** (future enhancement):
```tsx
import { BottomSheet } from '@/lib/dna/components/mobile/BottomSheet'

<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={[0.3, 0.7, 1.0]}
>
  <SheetContent />
</BottomSheet>
```

**3. Ripple Effect**:
```tsx
// Material Design ripple (via active state)
<button className="relative overflow-hidden active:bg-white/10 transition-colors">
  <span className="relative z-10">Button Text</span>
</button>
```

---

## Accessibility Standards

### ♿ **WCAG 2.1 AA Compliance**

**1. Color Contrast** (4.5:1 minimum):
```tsx
// ✅ CORRECT - High contrast (Gold on Charcoal: 7.2:1)
<p style={{ color: '#D4AF37', backgroundColor: '#0B0B0B' }}>
  High contrast text
</p>

// ❌ WRONG - Low contrast (Bronze on Charcoal: 3.1:1)
<p style={{ color: '#B8956A', backgroundColor: '#0B0B0B' }}>
  Low contrast text (fails WCAG)
</p>
```

**2. Focus Indicators**:
```tsx
// All interactive elements need visible focus
<button className="focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-charcoal">
  Accessible Button
</button>
```

**3. ARIA Labels**:
```tsx
// Icon-only buttons need labels
<button
  aria-label="Close modal"
  className="w-11 h-11 rounded-full"
>
  <X className="w-5 h-5" />
</button>

// Navigation items need current page indicator
<a
  href="/dashboard"
  aria-current={isActive ? 'page' : undefined}
>
  Dashboard
</a>
```

**4. Keyboard Navigation**:
```tsx
// All interactive elements must be keyboard accessible
// Use native HTML elements when possible
<button onClick={handleClick}>  {/* ✅ Native button */}
  Action
</button>

<div onClick={handleClick}>     {/* ❌ Not keyboard accessible */}
  Action
</div>
```

**5. Screen Reader Support**:
```tsx
// Use semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// Add hidden labels for context
<span className="sr-only">Current page:</span>
<h1>Dashboard</h1>
```

---

## Testing Guidelines

### 📱 **Device Testing Matrix**

**Minimum Test Devices**:
| Device | Screen Width | Notes |
|--------|-------------|-------|
| iPhone SE | 375px | Smallest modern iPhone |
| iPhone 12/13 | 390px | Standard iPhone |
| iPhone 14 Pro Max | 430px | Large iPhone |
| Galaxy S21 | 360px | Standard Android |
| iPad Mini | 768px | Small tablet |
| iPad Pro | 1024px | Large tablet |

**Browser Testing**:
- ✅ iOS Safari (primary mobile browser)
- ✅ Chrome Mobile (Android)
- ✅ Chrome Desktop
- ✅ Firefox Desktop
- ✅ Safari Desktop
- ✅ Edge Desktop

### ✅ **Mobile Testing Checklist**

**Per Page Testing**:
- [ ] All buttons minimum 44×44px
- [ ] Touch feedback (active:scale-95) on all interactive elements
- [ ] Smooth scrolling (no jank or lag)
- [ ] Keyboard doesn't break layout (test form inputs)
- [ ] Landscape orientation supported
- [ ] Safe area insets respected (iPhone notch)
- [ ] Bottom navigation doesn't hide content
- [ ] Text readable without zooming
- [ ] Images optimized (WebP format)
- [ ] Page loads < 2s on 3G

**Performance Benchmarks** (Lighthouse Mobile):
- [ ] Performance score: > 90
- [ ] First Contentful Paint: < 1.0s
- [ ] Time to Interactive: < 2.5s
- [ ] Cumulative Layout Shift: < 0.1
- [ ] Total Bundle Size: < 300KB

**Interaction Testing**:
- [ ] Pull-to-refresh works (if implemented)
- [ ] Swipe gestures work (if implemented)
- [ ] Modal opens/closes smoothly
- [ ] Filters expand/collapse properly
- [ ] Search works on mobile keyboard
- [ ] Notifications display correctly

---

## 🎯 Quick Reference Summary

### **Mandatory Mobile Patterns**:

1. **Status Bar Spacer** (iOS):
   ```tsx
   <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
   ```

2. **Bottom Navigation**:
   ```tsx
   <SalonMobileBottomNav userRole={role} />
   ```

3. **Touch Targets** (44px minimum):
   ```tsx
   className="min-h-[44px] min-w-[44px] active:scale-95"
   ```

4. **Responsive Grids**:
   ```tsx
   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
   ```

5. **Bottom Spacing** (mobile nav clearance):
   ```tsx
   <div className="h-24 md:h-0" />
   ```

### **Related Documentation**:
- **DATA-MODELS.md** - Sacred Six schema
- **HOOKS.md** - Hook architecture
- **AUTHENTICATION.md** - Auth patterns
- **SHARED-COMPONENTS.md** - Component library
- Feature guides: DASHBOARD.md, APPOINTMENTS.md, etc.

---

## ✅ Next Steps

After understanding mobile layout:

1. **Read SHARED-COMPONENTS.md** - Learn component library
2. **Read PERFORMANCE.md** - Optimize for mobile
3. **Implement Mobile Header** - In all pages
4. **Test on Real Devices** - Physical device testing

**HERA's mobile-first design delivers native app experiences on the web with enterprise-grade performance.**
