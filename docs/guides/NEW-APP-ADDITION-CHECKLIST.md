# HERA New App Addition - Complete Checklist

**Version:** 1.0
**Last Updated:** 2025-01-05
**Purpose:** Step-by-step guide for adding a new app to HERA with auth, routing, and loading hooks

---

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Backend Configuration](#backend-configuration)
3. [Auth & Routing Configuration](#auth--routing-configuration)
4. [Frontend Pages Setup](#frontend-pages-setup)
5. [Loading Hook Integration](#loading-hook-integration)
6. [Navigation Components](#navigation-components)
7. [Testing Checklist](#testing-checklist)

---

## 1. Database Setup

### Register App in Platform Catalog

**File:** Run in Supabase SQL Editor or via RPC

```sql
-- Register new app
SELECT hera_apps_register_v1(
  'YOUR_ADMIN_USER_ID'::uuid,
  '{
    "code": "NEWAPP",
    "name": "New Application Name",
    "smart_code": "HERA.PLATFORM.APP.ENTITY.NEWAPP.v1",
    "status": "active",
    "metadata": {
      "category": "business",
      "icon": "icon-name",
      "description": "Description of your app"
    }
  }'::jsonb
);
```

### Verify Registration

```sql
-- Verify app exists
SELECT id, entity_code, entity_name, smart_code
FROM core_entities
WHERE entity_type = 'APP'
  AND entity_code = 'NEWAPP'
  AND organization_id = '00000000-0000-0000-0000-000000000000';
```

### Install App for Test Organization

```typescript
// Install app for your test organization
await supabase.rpc('hera_org_link_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: testOrgId,
  p_app_code: 'NEWAPP',
  p_subscription: { plan: 'premium' },
  p_config: { /* app-specific config */ },
  p_is_active: true
})
```

---

## 2. Backend Configuration

### Create API Routes (Optional)

**Directory:** `/src/app/api/newapp/`

```typescript
// Example: /src/app/api/newapp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  // Your API logic
  return NextResponse.json({ success: true })
}
```

---

## 3. Auth & Routing Configuration

### ✅ STEP 1: Update Role Normalizer

**File:** `/src/lib/auth/role-normalizer.ts`

**Complete Checklist (4 required changes):**

#### 1️⃣ Add to `AppCode` Type (Line ~36)

```typescript
export type AppCode =
  | 'salon'
  | 'cashew'
  | 'isp'
  | 'furniture'
  | 'restaurant'
  | 'retail'
  | 'newapp'  // ✅ ADD YOUR APP CODE HERE (lowercase)
```

#### 2️⃣ Add Routing Rules (Line ~245-336)

```typescript
const APP_ROUTING_RULES: Record<AppCode, Record<AppRole, string>> = {
  // ... existing apps ...

  // ✅ ADD YOUR APP ROUTING RULES HERE
  newapp: {
    owner: '/newapp/dashboard',           // Business owner/admin
    manager: '/newapp/manager',           // Operations manager
    receptionist: '/newapp/reception',    // Front desk/counter
    accountant: '/newapp/accounting',     // Finance/accounting
    stylist: '/newapp/specialist',        // Service provider/staff
    staff: '/newapp/operations',          // General staff
    user: '/newapp/home'                  // Customer/end-user
  }
}
```

#### 3️⃣ Add URL Detection (Line ~367-378)

```typescript
if (!app && typeof window !== 'undefined') {
  const pathname = window.location.pathname

  // Extract app code from URL path
  if (pathname.startsWith('/salon')) appCode = 'salon'
  else if (pathname.startsWith('/cashew')) appCode = 'cashew'
  else if (pathname.startsWith('/isp')) appCode = 'isp'
  else if (pathname.startsWith('/furniture')) appCode = 'furniture'
  else if (pathname.startsWith('/restaurant')) appCode = 'restaurant'
  else if (pathname.startsWith('/retail')) appCode = 'retail'
  else if (pathname.startsWith('/newapp')) appCode = 'newapp'  // ✅ ADD HERE
}
```

#### 4️⃣ Add to Validation Function (Line ~432)

```typescript
export function isValidAppCode(app: string): app is AppCode {
  const validApps: AppCode[] = [
    'salon', 'cashew', 'isp', 'furniture', 'restaurant', 'retail',
    'newapp'  // ✅ ADD YOUR APP CODE HERE
  ]
  return validApps.includes(app as AppCode)
}
```

#### 5️⃣ (Optional) Add Display Names (Line ~146-210)

```typescript
const appSpecificNames: Record<AppCode, Record<AppRole, string>> = {
  // ... existing apps ...

  // ✅ OPTIONAL: Add app-specific role display names
  newapp: {
    owner: 'Business Owner',
    manager: 'Operations Manager',
    receptionist: 'Front Desk',
    accountant: 'Accountant',
    stylist: 'Specialist',
    staff: 'Staff Member',
    user: 'Customer'
  }
}
```

**Verification Checklist:**

- [ ] App code added to `AppCode` type
- [ ] Routing rules added to `APP_ROUTING_RULES`
- [ ] URL detection added to `getRoleRedirectPath()`
- [ ] App code added to `isValidAppCode()` validation
- [ ] (Optional) Display names added to `getRoleDisplayName()`
- [ ] Run `npm run typecheck` - no errors
- [ ] Test login with new app code

### ✅ STEP 2: Update HERAAuthProvider (if needed)

**File:** `/src/components/auth/HERAAuthProvider.tsx`

**Usually no changes needed** - The provider automatically handles new apps via the role normalizer.

**Only update if you need custom app-specific logic:**

```typescript
// Around line 150+ in useEffect for auth state
useEffect(() => {
  // Custom logic for your app (if needed)
  if (organization?.app_code === 'NEWAPP') {
    // App-specific initialization
    console.log('🎯 New App Context Loaded')
  }
}, [organization])
```

---

## 4. Frontend Pages Setup

### Create App Directory Structure

**Create these directories:**

```bash
/src/app/newapp/
├── layout.tsx           # App-specific layout
├── page.tsx             # Default landing page (redirects or dashboard)
├── dashboard/
│   └── page.tsx         # Owner dashboard
├── manager/
│   └── page.tsx         # Manager dashboard
├── reception/
│   └── page.tsx         # Receptionist page
├── accounting/
│   └── page.tsx         # Accountant page
├── specialist/
│   └── page.tsx         # Service provider page
├── operations/
│   └── page.tsx         # Staff operations page
└── home/
    └── page.tsx         # Customer portal
```

### Create App Layout

**File:** `/src/app/newapp/layout.tsx`

```typescript
'use client'

import { ReactNode } from 'react'

export default function NewAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Add app-specific layout elements */}
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
}
```

---

## 5. Loading Hook Integration

### ✅ CRITICAL: Add Loading Completion to Landing Pages

**Every role landing page MUST complete the loading animation (70% → 100%)**

**Pattern for ALL landing pages:**

```typescript
'use client'

import { useEffect } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'

export default function NewAppDashboard() {
  const { updateProgress, finishLoading } = useLoadingStore()

  // ⚡ ENTERPRISE: Complete loading animation on mount (if coming from login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('🎯 New App: Completing loading animation from 70% → 100%')

      // Animate from 70% to 100% smoothly
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading your workspace...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          // Complete and hide overlay after brief delay
          setTimeout(() => {
            finishLoading()
            // Clean up URL parameter
            window.history.replaceState({}, '', window.location.pathname)
            console.log('✅ New App: Loading complete!')
          }, 500)
        }
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  // Your page content here
  return (
    <div className="p-6">
      <h1>New App Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  )
}
```

### Pages That NEED Loading Hook

**✅ Apply the loading hook pattern to these pages:**

1. `/newapp/dashboard/page.tsx` - Owner landing
2. `/newapp/manager/page.tsx` - Manager landing
3. `/newapp/reception/page.tsx` - Receptionist landing
4. `/newapp/accounting/page.tsx` - Accountant landing
5. `/newapp/specialist/page.tsx` - Service provider landing
6. `/newapp/operations/page.tsx` - Staff landing
7. `/newapp/home/page.tsx` - Customer landing

### Pages That DON'T Need Loading Hook

**❌ Skip the loading hook for:**
- Sub-pages within the app (e.g., `/newapp/dashboard/reports`)
- Modal/popup pages
- API routes
- Public marketing pages (if not in auth flow)

---

## 6. Navigation Components

### Create App Navigation (Optional)

**File:** `/src/components/newapp/NewAppNavigation.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/newapp/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/newapp/customers', label: 'Customers', icon: '👥' },
  { href: '/newapp/reports', label: 'Reports', icon: '📈' },
  { href: '/newapp/settings', label: 'Settings', icon: '⚙️' }
]

export function NewAppNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-4">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg ${
            pathname === item.href
              ? 'bg-primary text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
```

### Add to Multi-App Selector (Optional)

**File:** `/src/components/auth/AppSelector.tsx` (if exists)

```typescript
// Add your app to the app selector
const AVAILABLE_APPS = [
  // ... existing apps ...
  {
    code: 'NEWAPP',
    name: 'New Application',
    icon: '🎯',
    description: 'Description of your app',
    route: '/newapp/dashboard'
  }
]
```

---

## 7. Testing Checklist

### Database Tests

- [ ] ✅ App registered in `core_entities` (entity_type='APP')
- [ ] ✅ App code is UPPERCASE
- [ ] ✅ Smart code follows pattern: `HERA.PLATFORM.APP.ENTITY.{CODE}.v1`
- [ ] ✅ App status is 'active'

### Backend Tests

- [ ] ✅ Role normalizer includes all routes for your app
- [ ] ✅ AppName type updated with your app
- [ ] ✅ TypeScript compiles without errors (`npm run typecheck`)

### Frontend Tests

- [ ] ✅ All role landing pages exist
- [ ] ✅ Loading hook added to all landing pages
- [ ] ✅ Loading animation completes (70% → 100%)
- [ ] ✅ Page content appears after loading completes
- [ ] ✅ No console errors during page load

### Auth Flow Tests

**Test each role:**

1. **Owner Test:**
   ```bash
   # Login with owner credentials
   # Should redirect to /newapp/dashboard
   # Should see loading animation complete
   # Should see dashboard content
   ```

2. **Manager Test:**
   ```bash
   # Login with manager credentials
   # Should redirect to /newapp/manager
   # Should see loading animation complete
   # Should see manager content
   ```

3. **Receptionist Test:**
   ```bash
   # Login with receptionist credentials
   # Should redirect to /newapp/reception
   # Should see loading animation complete
   # Should see reception content
   ```

4. **Accountant Test:**
   ```bash
   # Login with accountant credentials
   # Should redirect to /newapp/accounting
   # Should see loading animation complete
   # Should see accounting content
   ```

5. **Staff Test:**
   ```bash
   # Login with staff credentials
   # Should redirect to /newapp/operations
   # Should see loading animation complete
   # Should see operations content
   ```

6. **Customer Test:**
   ```bash
   # Login with customer credentials
   # Should redirect to /newapp/home
   # Should see loading animation complete
   # Should see customer portal
   ```

### Loading Hook Tests

- [ ] ✅ Loading starts at 0% on login page
- [ ] ✅ Loading reaches 70% before redirect
- [ ] ✅ URL includes `?initializing=true` parameter
- [ ] ✅ Landing page continues 70% → 100%
- [ ] ✅ Loading overlay disappears after 100%
- [ ] ✅ URL parameter `?initializing=true` is cleaned up
- [ ] ✅ Page content is visible after loading

### Console Log Tests

**Expected console logs:**

```bash
# On login page
🔐 Starting authentication...
✅ Auth complete, redirecting to /newapp/dashboard?initializing=true

# On landing page
🎯 New App: Completing loading animation from 70% → 100%
✅ New App: Loading complete!
```

---

## 8. Common Mistakes to Avoid

### ❌ Common Mistake #1: Using `useSearchParams()`

**Problem:**
```typescript
// ❌ WRONG - Requires Suspense boundary
const searchParams = useSearchParams()
const isInitializing = searchParams?.get('initializing') === 'true'
```

**Solution:**
```typescript
// ✅ CORRECT - Direct DOM access
const urlParams = new URLSearchParams(window.location.search)
const isInitializing = urlParams.get('initializing') === 'true'
```

### ❌ Common Mistake #2: Wrong Function Name

**Problem:**
```typescript
// ❌ WRONG - Function doesn't exist
const { completeLoading } = useLoadingStore()
completeLoading()
```

**Solution:**
```typescript
// ✅ CORRECT - Use finishLoading()
const { finishLoading } = useLoadingStore()
finishLoading()
```

### ❌ Common Mistake #3: Missing Hook on Some Pages

**Problem:**
- Added hook to owner page
- Forgot to add to manager, receptionist, etc.
- Those pages get stuck at 70%

**Solution:**
- Add loading hook to **ALL** role landing pages
- Use checklist above to verify

### ❌ Common Mistake #4: Lowercase App Code

**Problem:**
```typescript
// ❌ WRONG - Lowercase code
code: 'newapp'
```

**Solution:**
```typescript
// ✅ CORRECT - UPPERCASE code
code: 'NEWAPP'
```

---

## 9. Quick Reference - File Locations

| What | Where | Action |
|------|-------|--------|
| Register App | Supabase SQL Editor | Run `hera_apps_register_v1` |
| Add Routing | `/src/lib/auth/role-normalizer.ts` | Add to `APP_ROUTING_RULES` |
| Add Type | `/src/lib/auth/role-normalizer.ts` | Add to `AppName` union |
| Create Pages | `/src/app/newapp/` | Create directory structure |
| Add Loading Hook | All landing pages | Copy pattern from Step 5 |
| Test Loading | Browser console | Check for console logs |

---

## 10. Example: Complete Implementation

Here's a minimal working example for a new "CRM" app:

### Database Registration

```sql
SELECT hera_apps_register_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '{
    "code": "CRM",
    "name": "HERA CRM",
    "smart_code": "HERA.PLATFORM.APP.ENTITY.CRM.v1",
    "status": "active"
  }'::jsonb
);
```

### Role Normalizer Update

```typescript
// In /src/lib/auth/role-normalizer.ts
export type AppName = 'salon' | 'retail' | 'crm'

export const APP_ROUTING_RULES = {
  // ... existing apps ...
  crm: {
    owner: '/crm/dashboard',
    manager: '/crm/manager',
    receptionist: '/crm/reception',
    accountant: '/crm/accounting',
    stylist: '/crm/sales',
    staff: '/crm/support',
    user: '/crm/portal'
  }
}
```

### Minimal Landing Page

```typescript
// /src/app/crm/dashboard/page.tsx
'use client'

import { useEffect } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'

export default function CRMDashboard() {
  const { updateProgress, finishLoading } = useLoadingStore()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('🎯 CRM: Completing loading animation from 70% → 100%')
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            finishLoading()
            window.history.replaceState({}, '', window.location.pathname)
          }, 500)
        }
      }, 50)
      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  return <div>CRM Dashboard</div>
}
```

---

## 11. Success Criteria

Your new app is properly integrated when:

1. ✅ App registered in database with UPPERCASE code
2. ✅ Role normalizer includes all role routes
3. ✅ All landing pages exist
4. ✅ All landing pages have loading hook
5. ✅ TypeScript compiles without errors
6. ✅ All roles redirect to correct pages
7. ✅ Loading animation completes smoothly
8. ✅ No console errors during auth flow
9. ✅ Page content appears after loading

---

## 12. Support & Resources

**Documentation:**
- Role Normalizer Pattern: `/src/lib/auth/role-normalizer.ts`
- Loading Store: `/src/lib/stores/loading-store.ts`
- Working Examples: `/src/app/retail/home/page.tsx`, `/src/app/salon/dashboard/page.tsx`

**RPC Documentation:**
- App Registration: `/docs/rpc/HERA-APP-MANAGEMENT-RPC-GUIDE.md`
- App Catalog: `/docs/architecture/HERA-APP-CATALOG-MIGRATION-PLAN.md`

**Loading System:**
- Loading Completion System: `/docs/hooks/LOADING-COMPLETION-SYSTEM.md`
- Migration Script: `/scripts/migrate-loading-completion.js`

---

**Last Updated:** 2025-01-05
**Maintained By:** HERA Development Team
**Version:** 1.0
