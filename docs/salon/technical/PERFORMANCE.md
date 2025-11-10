# Performance Optimization Guide

**Complete reference for optimizing HERA Salon performance, mobile-first loading strategies, and bundle optimization.**

---

## Table of Contents

1. [Performance Philosophy](#performance-philosophy)
2. [Performance Targets](#performance-targets)
3. [Progressive Loading System](#progressive-loading-system)
4. [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
5. [React Query Caching](#react-query-caching)
6. [Bundle Optimization](#bundle-optimization)
7. [Image Optimization](#image-optimization)
8. [Mobile Performance](#mobile-performance)
9. [Database Query Optimization](#database-query-optimization)
10. [Memory Management](#memory-management)
11. [Component Memoization](#component-memoization)
12. [Performance Monitoring](#performance-monitoring)
13. [Build-Time Optimizations](#build-time-optimizations)
14. [Production Optimizations](#production-optimizations)

---

## Performance Philosophy

### Design Principles

**Mobile-First Performance:**
- Target 3G network speeds (slow 3G: ~400kb/s)
- Progressive enhancement for faster connections
- Critical content first, enhancements later
- Never block the UI thread

**Perceived Performance:**
- Show skeleton loaders immediately
- Progressive component loading (staged appearance)
- Optimistic updates with rollback
- Instant feedback on user interactions

**Real Performance:**
- Minimize JavaScript bundle size
- Lazy load everything possible
- Cache aggressively with React Query
- Optimize database queries

---

## Performance Targets

### Lighthouse Scores (MANDATORY)

```typescript
export const PERFORMANCE_TARGETS = {
  mobile: {
    performance: 90,         // Lighthouse Performance score
    accessibility: 95,       // WCAG 2.1 AA compliance
    bestPractices: 95,       // Best practices score
    seo: 100,               // SEO optimization
    pwa: 90                 // Progressive Web App
  },
  desktop: {
    performance: 95,
    accessibility: 95,
    bestPractices: 95,
    seo: 100,
    pwa: 95
  }
}
```

### Core Web Vitals (MANDATORY)

```typescript
export const WEB_VITALS_TARGETS = {
  // Largest Contentful Paint (LCP)
  lcp: {
    mobile: 2500,    // ms - Good: < 2.5s
    desktop: 2000    // ms - Good: < 2.0s
  },

  // First Input Delay (FID)
  fid: {
    mobile: 100,     // ms - Good: < 100ms
    desktop: 50      // ms - Good: < 50ms
  },

  // Cumulative Layout Shift (CLS)
  cls: {
    mobile: 0.1,     // Good: < 0.1
    desktop: 0.05    // Good: < 0.05
  },

  // First Contentful Paint (FCP)
  fcp: {
    mobile: 1500,    // ms - Good: < 1.8s
    desktop: 1000    // ms - Good: < 1.0s
  },

  // Time to Interactive (TTI)
  tti: {
    mobile: 2500,    // ms - Good: < 3.8s
    desktop: 2000    // ms - Good: < 2.0s
  }
}
```

### Bundle Size Targets

```typescript
export const BUNDLE_TARGETS = {
  initial: {
    js: 250,         // KB - Initial JavaScript bundle
    css: 50,         // KB - Critical CSS
    total: 300       // KB - Total initial load
  },

  perRoute: {
    js: 100,         // KB - Per-route code split
    css: 20          // KB - Per-route styles
  },

  vendor: {
    react: 150,      // KB - React + ReactDOM
    ui: 100,         // KB - Radix UI components
    query: 50,       // KB - React Query
    total: 400       // KB - Total vendor bundle
  }
}
```

---

## Progressive Loading System

### 5-Stage Progressive Loading

**Dashboard loading pattern (production implementation):**

```tsx
'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'

// Stage 1: Lazy load all heavy components
const HeroMetrics = lazy(() => import('./HeroMetrics'))
const AppointmentAnalytics = lazy(() => import('./AppointmentAnalytics'))
const RevenueTrends = lazy(() => import('./RevenueTrends'))
const StaffPerformance = lazy(() => import('./StaffPerformance'))
const CustomerInsights = lazy(() => import('./CustomerInsights'))

export default function DashboardPage() {
  const { organizationId } = useSecuredSalonContext()
  const [loadStage, setLoadStage] = useState(1)

  // Progressive component loading - staged at 0ms, 300ms, 600ms, 900ms, 1200ms
  useEffect(() => {
    if (organizationId) {
      const stages = [2, 3, 4, 5]
      stages.forEach((stage, index) => {
        setTimeout(() => {
          setLoadStage(stage)
        }, index * 300) // Load each stage 300ms apart
      })
    }
  }, [organizationId])

  return (
    <div className="space-y-8">
      {/* Stage 1: Hero Metrics - Load immediately (0ms) */}
      {loadStage >= 1 && (
        <div className="animate-fadeInUp">
          <Suspense fallback={<FastSkeleton />}>
            <HeroMetrics organizationId={organizationId} />
          </Suspense>
        </div>
      )}

      {/* Stage 2: Appointment Analytics - Load at 300ms */}
      {loadStage >= 2 && (
        <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <Suspense fallback={<ComponentSkeleton />}>
            <AppointmentAnalytics organizationId={organizationId} />
          </Suspense>
        </div>
      )}

      {/* Stage 3: Revenue Trends - Load at 600ms */}
      {loadStage >= 3 && (
        <div className="animate-fadeInUp" style={{ animationDelay: '600ms' }}>
          <Suspense fallback={<ComponentSkeleton />}>
            <RevenueTrends organizationId={organizationId} />
          </Suspense>
        </div>
      )}

      {/* Stage 4: Staff Performance - Load at 900ms */}
      {loadStage >= 4 && (
        <div className="animate-fadeInUp" style={{ animationDelay: '900ms' }}>
          <Suspense fallback={<ComponentSkeleton />}>
            <StaffPerformance organizationId={organizationId} />
          </Suspense>
        </div>
      )}

      {/* Stage 5: Customer Insights - Load at 1200ms */}
      {loadStage >= 5 && (
        <div className="animate-fadeInUp" style={{ animationDelay: '1200ms' }}>
          <Suspense fallback={<ComponentSkeleton />}>
            <CustomerInsights organizationId={organizationId} />
          </Suspense>
        </div>
      )}

      {/* Loading progress indicator */}
      {loadStage < 5 && (
        <div className="text-center py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading... ({loadStage}/5)</span>
        </div>
      )}
    </div>
  )
}
```

### Fast Skeleton Loaders

**Instant skeleton components (< 10ms render time):**

```tsx
// Fast skeleton for KPI cards - No animation overhead
export const FastSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-24 md:h-32 rounded-lg"
          style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
        />
      ))}
    </div>
  </div>
)

// Component skeleton for larger sections
export const ComponentSkeleton = () => (
  <div className="h-64 rounded-lg animate-pulse"
       style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }} />
)

// Table skeleton for data grids
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="h-16 rounded-lg"
        style={{ backgroundColor: `${LUXE_COLORS.charcoalLight}80` }}
      />
    ))}
  </div>
)
```

---

## Code Splitting & Lazy Loading

### React.lazy() Pattern (MANDATORY)

```tsx
import { lazy, Suspense } from 'react'

// ✅ CORRECT - Lazy load heavy components
const PageHeader = lazy(() => import('./components/PageHeader'))
const PageKPIs = lazy(() => import('./components/PageKPIs'))
const PageContent = lazy(() => import('./components/PageContent'))

export default function SalonPage() {
  return (
    <div>
      {/* Each component loads independently with fallback */}
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader />
      </Suspense>

      <Suspense fallback={<KPISkeleton />}>
        <PageKPIs />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <PageContent />
      </Suspense>
    </div>
  )
}

// ❌ WRONG - Importing everything at once
import PageHeader from './components/PageHeader'
import PageKPIs from './components/PageKPIs'
import PageContent from './components/PageContent'
```

### Named Export Lazy Loading

```tsx
// For components with named exports
const HeroMetrics = lazy(() =>
  import('./HeroMetrics').then(mod => ({ default: mod.HeroMetrics }))
)

const AppointmentAnalytics = lazy(() =>
  import('./AppointmentAnalytics').then(mod => ({ default: mod.AppointmentAnalytics }))
)
```

### Route-Based Code Splitting

**Next.js automatically code-splits by route:**

```bash
# Each page gets its own bundle
/salon/dashboard      → dashboard.[hash].js (150 KB)
/salon/appointments   → appointments.[hash].js (120 KB)
/salon/customers      → customers.[hash].js (100 KB)
/salon/pos            → pos.[hash].js (180 KB)
```

### Dynamic Imports for Heavy Libraries

```tsx
// Lazy load heavy libraries only when needed
const exportToExcel = async (data: any[]) => {
  // xlsx library is ~1MB - only load when user clicks Export
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, 'export.xlsx')
}

// Lazy load PDF generation
const generatePDF = async (content: string) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.text(content, 10, 10)
  doc.save('document.pdf')
}
```

---

## React Query Caching

### Stale-While-Revalidate Strategy

```tsx
import { useQuery } from '@tanstack/react-query'

export function useHeraCustomers(organizationId: string) {
  return useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => fetchCustomers(organizationId),

    // Cache for 5 minutes - instant subsequent loads
    staleTime: 5 * 60 * 1000,

    // Keep cached data for 10 minutes even if stale
    cacheTime: 10 * 60 * 1000,

    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,

    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Enable suspense mode for better loading states
    suspense: false,

    // Enable background updates
    refetchOnReconnect: true
  })
}
```

### Optimistic Updates

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customer: CustomerInput) => createCustomer(customer),

    // Optimistic update - instant UI feedback
    onMutate: async (newCustomer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] })

      // Snapshot previous value
      const previousCustomers = queryClient.getQueryData(['customers'])

      // Optimistically update cache
      queryClient.setQueryData(['customers'], (old: Customer[]) => [
        ...old,
        { ...newCustomer, id: 'temp-' + Date.now() }
      ])

      // Return context for rollback
      return { previousCustomers }
    },

    // Rollback on error
    onError: (err, newCustomer, context) => {
      queryClient.setQueryData(['customers'], context.previousCustomers)
      toast.error('Failed to create customer')
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created successfully')
    }
  })
}
```

### Prefetching Data

```tsx
import { useQueryClient } from '@tanstack/react-query'

export function CustomerList() {
  const queryClient = useQueryClient()

  // Prefetch customer details on hover
  const handleHoverCustomer = (customerId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['customer', customerId],
      queryFn: () => fetchCustomer(customerId),
      staleTime: 5 * 60 * 1000
    })
  }

  return (
    <div>
      {customers.map(customer => (
        <div
          key={customer.id}
          onMouseEnter={() => handleHoverCustomer(customer.id)}
        >
          {customer.name}
        </div>
      ))}
    </div>
  )
}
```

### Cache Persistence

```tsx
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

// Persist React Query cache to localStorage
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  }
})

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
```

---

## Bundle Optimization

### Next.js Configuration (Production)

**`next.config.mjs` - Complete optimization setup:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build Performance Optimizations
  compiler: {
    // Remove console.log in production (keep error/warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports (tree-shaking)
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'recharts',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast'
    ],

    // Web Vitals attribution
    webVitalsAttribution: ['CLS', 'LCP'],

    // Optimize CSS
    optimizeCss: true,

    // Scroll restoration
    scrollRestoration: true
  },

  // Image optimization
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp']
  },

  // Webpack optimizations
  webpack(config, { dev, isServer }) {
    // SSR FIX: Prevent browser-only libraries from server bundle
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'xlsx': false,
        'file-saver': false,
        'html2canvas': false,
        'chart.js': false
      }
    }

    // Client-only optimizations
    if (!dev && !isServer) {
      // Aggressive chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor bundle (React, Next)
            lib: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'lib',
              chunks: 'all',
              priority: 30
            },

            // UI components bundle (Radix UI)
            ui: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 25
            },

            // Common vendor bundle
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 20
            },

            // Common app code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        },

        // Tree shaking
        usedExports: true,
        sideEffects: false
      }
    }

    // Faster development builds
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }

    return config
  },
}

export default nextConfig
```

### Bundle Analysis

```bash
# Analyze production bundle
npm run build:analyze

# Output:
# Page                                Size     First Load JS
# ┌ ○ /salon/dashboard                 150 KB        450 KB
# ├ ○ /salon/appointments              120 KB        420 KB
# ├ ○ /salon/customers                 100 KB        400 KB
# ├ ○ /salon/pos                       180 KB        480 KB
# └ ○ /salon/products                   90 KB        390 KB
#
# ○ Static automatically generated (uses no initial props)
# First Load JS shared by all          300 KB
#   ├ chunks/lib.js                     150 KB  (React + ReactDOM)
#   ├ chunks/ui.js                      100 KB  (Radix UI)
#   └ chunks/framework.js                50 KB  (Next.js runtime)
```

### Tree Shaking Best Practices

```tsx
// ✅ CORRECT - Named imports enable tree-shaking
import { Calendar, Users, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

// ❌ WRONG - Default imports prevent tree-shaking
import * as LucideIcons from 'lucide-react'
import * as ReactQuery from '@tanstack/react-query'
import * as DateFns from 'date-fns'
```

---

## Image Optimization

### Next.js Image Component (MANDATORY)

```tsx
import Image from 'next/image'

// ✅ CORRECT - Optimized with lazy loading and WebP/AVIF
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={300}
      height={300}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,..."
      quality={85}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

// ❌ WRONG - No optimization, full resolution always
<img src={src} alt={alt} />
```

### Responsive Images

```tsx
export function HeroImage() {
  return (
    <picture>
      {/* Mobile: 375px wide */}
      <source
        media="(max-width: 768px)"
        srcSet="/hero-mobile.webp 375w"
        type="image/webp"
      />

      {/* Tablet: 768px wide */}
      <source
        media="(max-width: 1200px)"
        srcSet="/hero-tablet.webp 768w"
        type="image/webp"
      />

      {/* Desktop: 1920px wide */}
      <source
        media="(min-width: 1201px)"
        srcSet="/hero-desktop.webp 1920w"
        type="image/webp"
      />

      {/* Fallback */}
      <img
        src="/hero-fallback.jpg"
        alt="Hero image"
        loading="lazy"
      />
    </picture>
  )
}
```

### Avatar & Logo Optimization

```tsx
// Tiny base64 placeholder for avatars (< 1KB)
const AVATAR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxQTFBMUEiLz4KPC9zdmc+Cg=='

export function UserAvatar({ src, name }: { src?: string; name: string }) {
  return (
    <Image
      src={src || AVATAR_PLACEHOLDER}
      alt={name}
      width={40}
      height={40}
      className="rounded-full"
      loading="lazy"
      quality={90}
    />
  )
}
```

---

## Mobile Performance

### 3G Network Optimization

**Target: 400kb/s download speed (slow 3G)**

```typescript
export const MOBILE_OPTIMIZATIONS = {
  // Reduce initial payload
  initialBundle: {
    target: 250,        // KB - JavaScript
    css: 50,            // KB - Critical CSS
    fonts: 30,          // KB - Web fonts (WOFF2)
    images: 100,        // KB - Hero images (WebP)
    total: 430          // KB - Total initial load
  },

  // Load time targets on 3G
  loadTimes: {
    fcp: 1800,          // ms - First Contentful Paint
    lcp: 2500,          // ms - Largest Contentful Paint
    tti: 3800           // ms - Time to Interactive
  },

  // Defer non-critical resources
  deferredResources: [
    'analytics',        // Load after TTI
    'chat-widget',      // Load on user interaction
    'video-player',     // Load when viewport visible
    'social-widgets'    // Load after page load
  ]
}
```

### Mobile-Specific Code Paths

```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery'

export function DashboardPage() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div>
      {isMobile ? (
        // Mobile: Simplified view, less data
        <MobileKPICards limit={4} />
      ) : (
        // Desktop: Full data grid
        <DesktopKPIGrid limit={12} />
      )}
    </div>
  )
}
```

### Service Worker Caching

```typescript
// public/sw.js - Service worker for offline caching
const CACHE_NAME = 'hera-salon-v1'
const CRITICAL_URLS = [
  '/',
  '/salon/dashboard',
  '/salon/appointments',
  '/manifest.json',
  '/fonts/inter.woff2'
]

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_URLS)
    })
  )
})

// Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

---

## Database Query Optimization

### Entity Query Patterns

```tsx
// ⚡ PERFORMANCE: Only fetch relationships when filtering by branch
// Relationships require expensive joins - skip when not needed
export function useHeraCustomers(options?: UseHeraCustomersOptions) {
  const {
    entities: customers,
    isLoading
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,

      // Only fetch relationships when branch filtering required
      // This significantly improves initial page load (60% faster)
      include_relationships: !!(options?.filters?.branch_id),

      limit: 100,
      status: options?.includeArchived ? undefined : 'active',
      ...options?.filters
    }
  })

  return { customers, isLoading }
}
```

### Dynamic Field Optimization

```tsx
// Fetch only required dynamic fields
export function useProductPricing(productId: string) {
  return useQuery({
    queryKey: ['product-pricing', productId],
    queryFn: async () => {
      const { data } = await apiV2.get('entities/dynamic-data', {
        entity_id: productId,

        // Only fetch pricing fields (not all dynamic data)
        field_names: ['price', 'cost', 'tax_rate', 'currency'],
        organization_id: orgId
      })
      return data
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })
}
```

### Pagination Strategy

```tsx
// Infinite scroll pagination for large datasets
import { useInfiniteQuery } from '@tanstack/react-query'

export function useInfiniteCustomers(organizationId: string) {
  return useInfiniteQuery({
    queryKey: ['customers-infinite', organizationId],
    queryFn: ({ pageParam = 0 }) =>
      fetchCustomers({
        organizationId,
        limit: 50,
        offset: pageParam
      }),

    // Get next page offset
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 50) return undefined
      return pages.length * 50
    },

    staleTime: 5 * 60 * 1000
  })
}

// Usage in component
export function CustomerList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteCustomers(organizationId)

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.map(customer => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </React.Fragment>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

## Memory Management

### Component Unmount Cleanup

```tsx
import { useEffect, useRef } from 'react'

export function RealtimeComponent() {
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Setup interval
    intervalRef.current = setInterval(() => {
      fetchRealtimeData()
    }, 5000)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return <div>...</div>
}
```

### Event Listener Cleanup

```tsx
export function ScrollTracker() {
  useEffect(() => {
    const handleScroll = () => {
      console.log('Scroll position:', window.scrollY)
    }

    // Add listener
    window.addEventListener('scroll', handleScroll)

    // Remove listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return <div>...</div>
}
```

### Large List Virtualization

```tsx
import { FixedSizeList } from 'react-window'

// Virtualize large lists (only render visible items)
export function VirtualizedCustomerList({ customers }: { customers: Customer[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <CustomerCard customer={customers[index]} />
    </div>
  )

  return (
    <FixedSizeList
      height={600}           // Viewport height
      itemCount={customers.length}
      itemSize={80}          // Row height
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

---

## Component Memoization

### React.memo for Expensive Components

```tsx
import { memo } from 'react'

// Memoize component - only re-render when props change
export const CustomerCard = memo(function CustomerCard({
  customer,
  onClick
}: {
  customer: Customer
  onClick: (id: string) => void
}) {
  console.log('CustomerCard render:', customer.id)

  return (
    <div onClick={() => onClick(customer.id)}>
      <h3>{customer.name}</h3>
      <p>{customer.email}</p>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if customer data changed
  return (
    prevProps.customer.id === nextProps.customer.id &&
    prevProps.customer.name === nextProps.customer.name &&
    prevProps.customer.email === nextProps.customer.email
  )
})
```

### useMemo for Expensive Calculations

```tsx
import { useMemo } from 'react'

export function SalesReport({ transactions }: { transactions: Transaction[] }) {
  // Memoize expensive calculation - only recalculate when transactions change
  const analytics = useMemo(() => {
    console.log('Calculating analytics...')

    return {
      totalRevenue: transactions.reduce((sum, txn) => sum + txn.amount, 0),
      averageOrderValue: transactions.length > 0
        ? transactions.reduce((sum, txn) => sum + txn.amount, 0) / transactions.length
        : 0,
      topProducts: calculateTopProducts(transactions),
      revenueByDay: groupRevenueByDay(transactions)
    }
  }, [transactions]) // Only recalculate when transactions array changes

  return (
    <div>
      <h2>Revenue: {analytics.totalRevenue}</h2>
      <p>Average: {analytics.averageOrderValue}</p>
    </div>
  )
}
```

### useCallback for Event Handlers

```tsx
import { useCallback, useState } from 'react'

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])

  // Memoize callback - prevent re-creation on every render
  const handleDeleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId))
  }, []) // No dependencies - stable function reference

  return (
    <div>
      {customers.map(customer => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onDelete={handleDeleteCustomer} // Stable reference - prevents re-render
        />
      ))}
    </div>
  )
}
```

---

## Performance Monitoring

### Web Vitals Tracking

```tsx
// app/layout.tsx - Track Core Web Vitals
'use client'

import { useEffect } from 'react'

export function WebVitalsReporter() {
  useEffect(() => {
    // Track Core Web Vitals
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    }
  }, [])

  return null
}
```

### React Query DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Show React Query cache inspector in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  )
}
```

### Performance Profiler

```tsx
import { Profiler, ProfilerOnRenderCallback } from 'react'

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log({
    id,                // Component ID
    phase,             // "mount" or "update"
    actualDuration,    // Time spent rendering
    baseDuration,      // Estimated time without memoization
    startTime,         // When render started
    commitTime         // When React committed changes
  })
}

export function App() {
  return (
    <Profiler id="Dashboard" onRender={onRenderCallback}>
      <DashboardPage />
    </Profiler>
  )
}
```

---

## Build-Time Optimizations

### TypeScript Incremental Builds

```json
// tsconfig.json - Faster TypeScript compilation
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".next/cache/tsconfig.tsbuildinfo",
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "isolatedModules": true
  }
}
```

### ESLint Caching

```bash
# Enable ESLint caching for faster linting
npm run lint -- --cache --cache-location .next/cache/eslint
```

### Parallel Builds

```json
// package.json - Parallel build scripts
{
  "scripts": {
    "build:fast": "NEXT_PARALLEL=true npm run build",
    "prebuild": "npm run schema:types",
    "build": "node --max-old-space-size=8192 ./node_modules/next/dist/bin/next build"
  }
}
```

---

## Production Optimizations

### Compression

```javascript
// Enable compression middleware
import compression from 'compression'

const app = express()
app.use(compression()) // Gzip compression
```

### CDN Integration

```javascript
// next.config.mjs - Use CDN for static assets
const nextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.heraerp.com'
    : '',

  images: {
    domains: ['cdn.heraerp.com', 'images.unsplash.com'],
    loader: 'custom',
    loaderFile: './image-loader.js'
  }
}
```

### HTTP/2 Server Push

```javascript
// Server-side HTTP/2 push for critical resources
app.get('/salon/dashboard', (req, res) => {
  // Push critical CSS
  res.push('/styles/critical.css', {
    response: {
      headers: { 'content-type': 'text/css' }
    }
  })

  // Push critical JavaScript
  res.push('/scripts/dashboard.js', {
    response: {
      headers: { 'content-type': 'application/javascript' }
    }
  })

  res.sendFile('dashboard.html')
})
```

---

## Performance Checklist

### Before Every Deploy

- [ ] ✅ Run `npm run build:analyze` - Check bundle sizes
- [ ] ✅ Lighthouse mobile score > 90
- [ ] ✅ Lighthouse desktop score > 95
- [ ] ✅ LCP < 2.5s on mobile
- [ ] ✅ FID < 100ms
- [ ] ✅ CLS < 0.1
- [ ] ✅ Initial bundle < 300KB
- [ ] ✅ All images optimized (WebP/AVIF)
- [ ] ✅ React Query caching configured
- [ ] ✅ Lazy loading implemented for heavy components
- [ ] ✅ Service worker caching enabled

### Development Best Practices

- [ ] ✅ Use `React.memo()` for expensive components
- [ ] ✅ Use `useMemo()` for expensive calculations
- [ ] ✅ Use `useCallback()` for stable event handlers
- [ ] ✅ Implement virtualization for long lists (> 100 items)
- [ ] ✅ Clean up event listeners on unmount
- [ ] ✅ Prefetch data on hover for instant navigation
- [ ] ✅ Use skeleton loaders (not spinners)
- [ ] ✅ Progressive loading (staged component appearance)

---

## Related Documentation

- **Mobile Layout Guide**: `/docs/salon/technical/MOBILE-LAYOUT.md`
- **Shared Components**: `/docs/salon/technical/SHARED-COMPONENTS.md`
- **Hooks Reference**: `/docs/salon/technical/HOOKS.md`
- **Data Models**: `/docs/salon/technical/DATA-MODELS.md`
- **Testing Guide**: `/docs/salon/technical/TESTING.md` (upcoming)

---

## Performance Tools

### Recommended Tools

```bash
# Lighthouse CI
npm run test:perf

# Bundle analyzer
npm run build:analyze

# React Query DevTools
# (Automatically enabled in development)

# Chrome DevTools Performance Tab
# Record → Analyze → Optimize

# WebPageTest
# https://www.webpagetest.org/

# Lighthouse
# https://developers.google.com/web/tools/lighthouse
```

---

**Performance is a feature. Optimize for mobile first, cache aggressively, and measure everything.**
