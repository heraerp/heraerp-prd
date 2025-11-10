# Role Routing Loop - Complete Root Cause Analysis

## 🚨 CRITICAL FINDINGS

After investigating both `/auth/login` and `/salon/auth`, I've identified **duplicate role handling logic** that's causing the redirect loop.

---

## ✅ WORKING: `/auth/login` Page

**File**: `/src/app/auth/login/page.tsx`

**Status**: ✅ **CLEAN** - No issues here

**Flow**:
1. Login with HERAAuthProvider (`await login(email, password)`)
2. HERAAuthProvider calls introspection RPC
3. Builds organizations array with roles
4. Redirects to `/auth/organizations` selector
5. User selects org → `switchOrganization(orgId)` called
6. Role extracted from organizations array
7. Redirects to app dashboard

**This flow is CORRECT** ✅

---

##  ❌ BROKEN: `/salon/auth` Page

**File**: `/src/app/salon/auth/page.tsx`

**Status**: ❌ **DUPLICATE ROLE MAPPING** - Causes conflicts

**Lines 132-224 - The Problem**:

```typescript
// Line 132-224: DUPLICATE ROLE HANDLING (CONFLICTS WITH HERAAuthProvider)
useEffect(() => {
  if (isAuthenticated && role) {
    console.log('✅ Authenticated with role:', role)

    // 🔧 CRITICAL: Normalize HERA role values to expected format
    // HERA roles: ORG_OWNER, ORG_EMPLOYEE, etc.
    // Expected: owner, receptionist, manager, accountant, stylist
    const normalizedRole = String(role).toLowerCase().trim()

    // ❌ PROBLEM: Re-mapping roles that HERAAuthProvider already normalized!
    let salonRole = normalizedRole

    // Handle HERA role format (ORG_OWNER, ORG_EMPLOYEE, etc.)
    if (normalizedRole.includes('owner') || normalizedRole === 'org_owner') {
      salonRole = 'owner'
    } else if (normalizedRole.includes('employee') || normalizedRole === 'org_employee') {
      salonRole = 'receptionist' // ❌ WRONG: Assuming all employees are receptionists!
    } else if (normalizedRole.includes('manager') || normalizedRole === 'org_manager') {
      salonRole = 'manager'
    } else if (normalizedRole.includes('accountant') || normalizedRole === 'org_accountant') {
      salonRole = 'accountant'
    } else if (normalizedRole.includes('stylist') || normalizedRole === 'org_stylist') {
      salonRole = 'stylist'
    } else if (normalizedRole.includes('receptionist') || normalizedRole === 'org_receptionist') {
      salonRole = 'receptionist'
    }

    // ❌ CRITICAL ISSUE: Overwriting localStorage AFTER HERAAuthProvider already set it!
    localStorage.setItem('salonRole', salonRole)
    console.log('✅ Stored salonRole in localStorage:', salonRole)

    // ❌ PROBLEM: Manual redirect logic duplicates HERAAuthProvider behavior
    setTimeout(() => {
      if (salonRole === 'owner') {
        router.push('/salon/dashboard')
      } else if (salonRole === 'receptionist') {
        router.push('/salon/receptionist')
      }
      // ... more redirects
    }, 400)
  }
}, [isAuthenticated, role, router])
```

---

## 🔍 Why This Causes the Loop

### Scenario: Owner Role User

**Step 1: Login via `/auth/login`**
- HERAAuthProvider: Role = "owner" ✅
- localStorage.salonRole = "owner" ✅
- Redirects to `/auth/organizations`

**Step 2: Select organization**
- `switchOrganization(orgId)` called
- HERAAuthProvider extracts role from organizations array
- Role = "owner" (from primary_role: "ORG_OWNER") ✅
- localStorage.salonRole = "owner" ✅
- Redirects to `/salon/dashboard` ✅

**Step 3: Dashboard page loads**
- Dashboard checks role
- If role === "receptionist" → redirect to `/salon/receptionist`
- If role === "owner" → stay on dashboard ✅

**Step 4: BUT... if user navigates to `/salon/auth`**
- `/salon/auth` useEffect triggers (lines 132-224)
- Re-maps role: "owner" → "owner" (OK so far)
- **OVERWRITES** localStorage.salonRole = "owner" ⚠️
- Redirects again to `/salon/dashboard`
- This creates a **second redirect** after HERAAuthProvider already redirected

### Scenario: Receptionist Role User (LOOP TRIGGER)

**Step 1: Login via `/auth/login`**
- HERAAuthProvider: Role extracted from introspection
- Let's say primary_role = "ORG_RECEPTIONIST"
- Normalizes to: "receptionist" ✅
- localStorage.salonRole = "receptionist" ✅
- Redirects to `/salon/receptionist`

**Step 2: Receptionist dashboard loads**
- Receptionist page checks role (lines 289-294):
  ```typescript
  if (role && role.toLowerCase() === 'owner') {
    router.push('/salon/dashboard')
  }
  ```
- Role is "receptionist", so NO redirect ✅

**Step 3: BUT... if any code sends user to `/salon/auth`**
- `/salon/auth` useEffect triggers
- Reads role from HERAAuthProvider
- Re-maps role logic runs
- Redirects to `/salon/receptionist` AGAIN
- Creates redundant redirects

**Step 4: LOOP SCENARIO**
- If HERAAuthProvider role is temporarily undefined during state updates
- `/salon/auth` might fall back to wrong role
- Could redirect to wrong dashboard
- Dashboard redirects back
- **INFINITE LOOP** 🔄

---

## 📊 Data Flow Comparison

### ✅ CORRECT Flow (Using Only HERAAuthProvider)

```
User Logs In
    ↓
HERAAuthProvider.login()
    ↓
Call /api/v2/auth/resolve-membership
    ↓
Introspection RPC returns organizations with roles
    ↓
Build organizations array (includes primary_role, roles)
    ↓
Store in context.organizations
    ↓
User selects organization
    ↓
switchOrganization(orgId)
    ↓
Extract role from organizations array:
  fullOrgData.primary_role → "ORG_OWNER"
  Normalize → "owner"
    ↓
Update context.role = "owner"
Update localStorage.salonRole = "owner"
    ↓
Redirect to /salon/dashboard
    ↓
Dashboard checks role → "owner" → Stay on dashboard ✅
```

### ❌ BROKEN Flow (With Duplicate `/salon/auth` Logic)

```
User Logs In
    ↓
HERAAuthProvider.login()
    ↓
[... same as above ...]
    ↓
Redirect to /salon/dashboard
    ↓
Dashboard checks role → "owner" → Stay ✅
    ↓
User navigates to /salon/auth (or auto-redirected there)
    ↓
/salon/auth useEffect triggers
    ↓
Re-reads role from HERAAuthProvider
    ↓
Re-maps role: "owner" → "owner"
    ↓
OVERWRITES localStorage.salonRole = "owner" ⚠️
    ↓
REDIRECTS to /salon/dashboard AGAIN ⚠️
    ↓
Dashboard already loaded → Triggers re-render
    ↓
If role state is temporarily undefined during re-render
    ↓
Dashboard redirect logic might trigger
    ↓
Could redirect to wrong page
    ↓
/salon/auth triggers again
    ↓
**INFINITE LOOP** 🔄
```

---

## 🛠️ THE FIX

### Option 1: Remove Duplicate Logic from `/salon/auth` (RECOMMENDED)

**Change `/salon/auth/page.tsx` to trust HERAAuthProvider completely**:

```typescript
// REMOVE Lines 132-224 (entire useEffect with role mapping)

// REPLACE WITH:
useEffect(() => {
  // Simply redirect authenticated users - let HERAAuthProvider handle role routing
  if (isAuthenticated) {
    // Check if we have multiple organizations
    if (organizations && organizations.length > 1) {
      router.push('/auth/organizations')
    } else if (organizations && organizations.length === 1) {
      // Single organization - redirect to its default app
      const org = organizations[0]
      const apps = org.apps || []
      if (apps.length > 0) {
        const firstApp = apps[0]
        router.push(`/${firstApp.code.toLowerCase()}/dashboard`)
      } else {
        router.push('/salon/dashboard') // Fallback
      }
    }
  }
}, [isAuthenticated, organizations, router])
```

### Option 2: Use Centralized Login Flow

**Redirect `/salon/auth` to `/auth/login`**:

```typescript
// In /salon/auth/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function SalonAuthPage() {
  const router = useRouter()
  const { isAuthenticated } = useHERAAuth()

  useEffect(() => {
    // Redirect to centralized login
    if (!isAuthenticated) {
      router.push('/auth/login')
    } else {
      // Already authenticated - go to organization selector
      router.push('/auth/organizations')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
```

---

## 📋 Recommended Action Plan

### Immediate Fix (5 minutes)

1. **Remove duplicate role mapping from `/salon/auth`**:
   - Delete lines 132-224 in `/src/app/salon/auth/page.tsx`
   - Replace with simple redirect logic (Option 1 above)

2. **Test the flow**:
   ```bash
   # Clear cache
   localStorage.clear()

   # Login via /auth/login
   # Select organization
   # Verify correct dashboard loads
   # Verify NO redirect loop
   ```

### Long-Term Solution (15 minutes)

1. **Deprecate `/salon/auth` completely**:
   - Redirect all salon auth to `/auth/login`
   - Use centralized HERAAuthProvider flow
   - Remove custom salon-specific auth logic

2. **Update all salon login links**:
   - Change `/salon/auth` → `/auth/login`
   - Update documentation
   - Add redirect for backward compatibility

3. **Standardize role handling**:
   - **ONLY** HERAAuthProvider handles role extraction
   - **ONLY** HERAAuthProvider writes to localStorage
   - Dashboard pages ONLY read from HERAAuthProvider context
   - NO custom role mapping in any page

---

## ✅ Success Criteria

After implementing the fix:

- [ ] ✅ Login via `/auth/login` works correctly
- [ ] ✅ Organization selector shows all organizations
- [ ] ✅ Selecting organization redirects to correct dashboard
- [ ] ✅ Owner lands on `/salon/dashboard` (NO loop)
- [ ] ✅ Receptionist lands on `/salon/receptionist` (NO loop)
- [ ] ✅ Role persists after page reload
- [ ] ✅ NO duplicate localStorage writes
- [ ] ✅ NO duplicate redirects
- [ ] ✅ `/salon/auth` either removed or redirects to `/auth/login`
- [ ] ✅ Console logs show role extracted ONCE from organizations array
- [ ] ✅ localStorage.salonRole matches HERAAuthProvider role

---

## 🎯 Key Principle

**SINGLE SOURCE OF TRUTH**: HERAAuthProvider is the ONLY source for:
- Role extraction
- Role normalization
- Role persistence (localStorage)
- Organization switching
- App selection

**ALL OTHER PAGES MUST**:
- Read from HERAAuthProvider context
- Trust the role provided
- NOT re-map roles
- NOT overwrite localStorage
- NOT implement custom auth logic

---

## 📚 Related Files

- `/src/components/auth/HERAAuthProvider.tsx` - ✅ Single source of truth
- `/src/app/auth/login/page.tsx` - ✅ Clean implementation
- `/src/app/salon/auth/page.tsx` - ❌ NEEDS FIX (duplicate logic)
- `/src/app/auth/organizations/page.tsx` - ✅ Uses switchOrganization correctly
- `/src/app/salon/dashboard/page.tsx` - ✅ Simple role check
- `/src/app/salon/receptionist/page.tsx` - ✅ Simple role check

---

**Status**: 🔴 **CRITICAL FIX REQUIRED**

**Next Step**: Remove duplicate role handling from `/salon/auth/page.tsx` and test complete flow.
