# HERA Authentication Flow Analysis

**Date:** 2025-10-27
**Status:** 📊 **ANALYSIS COMPLETE**

---

## 🔍 Overview

HERA has **two distinct authentication entry points** with different routing logic:

1. **`/auth/login`** - Central authentication hub (general users)
2. **`/salon-access`** - Salon-specific login page (Hair Talkz users)

Both pages use the **same backend infrastructure** but have different user experiences and routing strategies.

---

## 🎯 Authentication Entry Points

### Entry Point 1: `/auth/login` (Central Hub)

**File:** `/src/app/auth/login/page.tsx`

**Purpose:** General-purpose authentication for all HERA users

**Key Features:**
- Modern glassmorphic UI with animated gradients
- Email/password authentication
- Demo module selector
- Enterprise feature showcase
- Multi-organization routing logic

**User Flow:**
```
User visits /auth/login
  ↓
Enters email/password
  ↓
Special check: Is this a Hair Talkz user?
  ├─ YES (@hairtalkz.com or 'michele') → Direct to /salon/dashboard
  └─ NO → Standard authentication flow
       ↓
   Check organization count:
   ├─ 0 orgs → /auth/organizations/new (create org)
   ├─ 1 org → /apps (single org dashboard)
   └─ 2+ orgs → /auth/organizations (org selector)
```

**Special Handling (Lines 76-98):**
```typescript
// Hair Talkz users get special routing
if (email.includes('@hairtalkz.com') || email.includes('michele')) {
  const { data } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (data.user) {
    console.log('✅ Hair Talkz user authenticated, redirecting to salon dashboard')
    router.push('/salon/dashboard')
    return
  }
}

// Other users use normal auth flow
await login(email, password)
```

**Routing Logic (Lines 34-67):**
```typescript
useEffect(() => {
  if (isAuthenticated && organizations !== null) {
    // Demo login check
    const isDemoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
    if (isDemoLogin) {
      const demoModule = sessionStorage.getItem('demoModule') || 'furniture'
      router.push(`/${demoModule}`)
      return
    }

    // Organization count routing
    if (organizations.length === 0) {
      router.push('/auth/organizations/new')
    } else if (organizations.length === 1) {
      const redirectUrl = localStorage.getItem('redirectAfterLogin')
      router.push(redirectUrl || returnTo || '/apps')
    } else {
      router.push('/auth/organizations')
    }
  }
}, [isAuthenticated, organizations, returnTo, router])
```

---

### Entry Point 2: `/salon-access` (Salon-Specific)

**File:** `/src/app/salon-access/page.tsx`

**Purpose:** Dedicated login for salon industry users (Hair Talkz)

**Key Features:**
- Salon-themed luxury UI (gold/champagne/charcoal palette)
- Role-based routing (owner vs receptionist)
- HERA RBAC role mapping
- Enterprise-grade welcome messages
- Direct API v2 authentication

**User Flow:**
```
User visits /salon-access
  ↓
Enters email/password
  ↓
Authenticate via Supabase
  ↓
Fetch role from API v2: /api/v2/auth/resolve-membership
  ↓
Map HERA RBAC role to salon role:
  ├─ ORG_OWNER → owner → /salon/dashboard
  ├─ ORG_ADMIN → manager → /salon/dashboard
  ├─ ORG_MANAGER → manager → /salon/dashboard
  ├─ ORG_ACCOUNTANT → accountant → /salon/dashboard
  └─ ORG_EMPLOYEE → receptionist → /salon/receptionist
```

**Role Mapping (Lines 257-268):**
```typescript
const roleMapping: Record<string, string> = {
  'org_owner': 'owner',
  'org_admin': 'manager',
  'org_manager': 'manager',
  'org_accountant': 'accountant',
  'org_employee': 'receptionist',
  'owner': 'owner',
  'manager': 'manager',
  'receptionist': 'receptionist',
  'accountant': 'accountant',
  'member': 'receptionist'
}
```

**Role-Based Routing:**
```typescript
if (userRole === 'owner' || userRole === 'manager' || userRole === 'accountant') {
  router.push('/salon/dashboard')
} else if (userRole === 'receptionist') {
  router.push('/salon/receptionist')
} else {
  router.push('/salon/dashboard')
}
```

---

## 🔄 Authentication Backend

Both pages use the **same authentication infrastructure**:

### 1. HERAAuthProvider

**File:** `/src/components/auth/HERAAuthProvider.tsx`

**Responsibilities:**
- Session management with Supabase Auth
- Organization context resolution
- Actor stamping
- JWT token handling
- Multi-tenant isolation

**Key Hook:**
```typescript
const { login, isAuthenticated, organizations } = useHERAAuth()
```

### 2. API v2 Resolve Membership

**File:** `/src/app/api/v2/auth/resolve-membership/route.ts`

**Responsibilities:**
- JWT verification
- Organization membership resolution
- Role resolution (HERA RBAC)
- User entity resolution

**Optimization (2025-10-27):**
- ✅ Now uses single `hera_auth_introspect_v1` RPC call
- ✅ O(1) complexity instead of O(N)
- ✅ 5-11x faster for multi-org users

**Response Format:**
```json
{
  "success": true,
  "user_id": "uuid",
  "user_entity_id": "uuid",
  "organization_count": 1,
  "default_organization_id": "uuid",
  "organizations": [
    {
      "id": "uuid",
      "code": "HERA",
      "name": "Organization Name",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER"],
      "is_owner": true,
      "is_admin": false
    }
  ],
  "membership": {
    "organization_id": "uuid",
    "roles": ["ORG_OWNER"],
    "role": "ORG_OWNER",
    "primary_role": "ORG_OWNER",
    "is_active": true,
    "is_owner": true,
    "is_admin": false,
    "organization_name": "Organization Name"
  }
}
```

---

## 🔀 Routing Decision Tree

```
User Login Attempt
       ↓
   Which page?
   ├─────────────────────┬─────────────────────┐
   │                     │                     │
/auth/login        /salon-access      Direct URL Access
   │                     │                     │
   ↓                     ↓                     ↓
Email check        Email/Password      Protected Route
   │                     │                     │
   ├─ Hair Talkz?       ↓                     ↓
   │  └─ YES: /salon    Fetch role      Redirect to login
   │                    from API v2            │
   └─ NO: Standard            │               ↓
      flow                    ↓          Store return URL
      │              Map RBAC → Salon         │
      ↓                      │               ↓
  Check org count    Role-based routing   Login page
      │                      │
      ├─ 0: /auth/orgs/new  ↓
      ├─ 1: /apps      owner/manager/accountant → /salon/dashboard
      └─ 2+: /auth/orgs     │
                       receptionist → /salon/receptionist
```

---

## 🎨 UI/UX Differences

### `/auth/login` (Central Hub)

**Design Language:** Modern, tech-forward, multi-industry
- **Colors:** Blue, purple, cyan gradients
- **Style:** Glassmorphic cards, floating orbs
- **Target:** General business users, enterprise
- **Features:**
  - Demo module selector
  - Enterprise trust badges (99.9% uptime, SOC 2, 24/7 support)
  - Sign in / Try Demo tabs
  - Multi-organization support

### `/salon-access` (Salon-Specific)

**Design Language:** Luxury salon aesthetic
- **Colors:** Gold, champagne, charcoal, bronze
- **Style:** Elegant, premium, industry-specific
- **Target:** Salon owners, managers, receptionists
- **Features:**
  - Salon-themed welcome messages
  - Role-specific greetings ("Welcome back, Salon Owner")
  - Industry-specific UI elements
  - Direct role-based routing

---

## 🔐 Security Comparison

Both pages implement **identical security standards**:

### Shared Security Features
- ✅ JWT token verification
- ✅ Supabase Auth integration
- ✅ Actor stamping (WHO)
- ✅ Organization isolation (WHERE)
- ✅ Session management
- ✅ Password visibility toggle
- ✅ Auto-redirect if authenticated
- ✅ Return URL preservation

### Key Differences
- **`/auth/login`**: Has special handling for Hair Talkz domain users (lines 76-98)
- **`/salon-access`**: Has HERA RBAC role mapping (lines 257-268)

---

## 🔄 API Usage Comparison

### `/auth/login` API Calls

**During Login:**
1. `supabase.auth.signInWithPassword()` (client-side)
2. HERAAuthProvider resolves organization via `/api/v2/auth/resolve-membership`

**API Route:** `/api/v2/auth/resolve-membership`
- Called by HERAAuthProvider automatically
- Returns organization count for routing logic

### `/salon-access` API Calls

**During Login:**
1. `supabase.auth.signInWithPassword()` (client-side)
2. Explicit call to `/api/v2/auth/resolve-membership` (lines 215-219)
3. Role mapping applied client-side

**API Route:** `/api/v2/auth/resolve-membership`
- Called explicitly after authentication
- Response used for role mapping and routing

---

## 🚀 Optimization Impact

The recent API v2 optimization affects **both pages equally**:

### Before Optimization
- Multiple database queries per login
- O(N) complexity for multi-org users
- Slower authentication for users with 2+ organizations

### After Optimization (2025-10-27)
- Single `hera_auth_introspect_v1` RPC call
- O(1) complexity for all users
- 5-11x faster for multi-org users
- 67-91% database load reduction

**Both `/auth/login` and `/salon-access` benefit from this optimization automatically.**

---

## 🎯 Recommendations

### 1. Consolidate Hair Talkz Logic

**Current Issue:** Special handling for Hair Talkz users in `/auth/login` (lines 76-98) bypasses standard flow

**Recommendation:** Remove special case and rely on role-based routing from `/salon-access`

**Why:** Simplifies code, reduces maintenance, ensures consistent authentication

### 2. Standardize Role Mapping

**Current Issue:** Role mapping logic only exists in `/salon-access`

**Recommendation:** Move role mapping to HERAAuthProvider or API v2 response

**Why:** Centralized logic, reusable across pages, consistent role handling

### 3. Unified Routing Configuration

**Current Issue:** Routing logic duplicated between pages

**Recommendation:** Create centralized routing configuration based on user role/org

**Why:** Single source of truth, easier to modify, consistent behavior

### 4. Consider Single Login Page

**Question:** Do we need two login pages?

**Options:**
- **Option A:** Keep both pages, but make them use identical backend logic
- **Option B:** Merge into single page with industry-specific theming
- **Option C:** Keep `/auth/login` as central hub, redirect salon users to `/salon-access`

**Recommendation:** Option A - Keep both pages for UX reasons, but ensure identical backend behavior

---

## 📋 Technical Debt Identified

### High Priority
1. **Duplicate Authentication Logic:** Both pages implement login differently
2. **Inconsistent Role Handling:** Role mapping only in salon-access
3. **Special Case Routing:** Hair Talkz users have custom logic path

### Medium Priority
1. **Organization Count Logic:** Could be simplified with better API response
2. **Return URL Handling:** Mixed use of localStorage and query params
3. **Demo Mode Detection:** Session storage flags could be in auth context

### Low Priority
1. **UI Code Duplication:** Both pages have similar loading states
2. **Error Handling:** Could be more consistent between pages

---

## 🔍 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION REQUEST                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
        ┌─────────────────────────┐
        │   Which Login Page?     │
        └──────┬─────────┬────────┘
               │         │
    ┏━━━━━━━━━┻━┓   ┏━━━┻━━━━━━━━━━┓
    ┃/auth/login┃   ┃/salon-access ┃
    ┗━━━━━━┬━━━━┛   ┗━━━━┬━━━━━━━━━┛
           │             │
           ↓             ↓
    ┌──────────┐   ┌──────────┐
    │Email Check│   │ Standard │
    │Hair Talkz?│   │   Auth   │
    └──┬───┬────┘   └────┬─────┘
       │   │             │
     YES  NO             │
       │   │             │
       │   └─────┬───────┘
       │         │
       │         ↓
       │   ┌─────────────────────┐
       │   │ Supabase Auth       │
       │   │ signInWithPassword  │
       │   └──────────┬──────────┘
       │              │
       │              ↓
       │   ┌─────────────────────────────┐
       │   │  HERAAuthProvider           │
       │   │  - Session Management       │
       │   │  - Auto calls API v2        │
       │   └──────────┬──────────────────┘
       │              │
       │              ↓
       │   ┌─────────────────────────────────────┐
       │   │  API v2: resolve-membership         │
       │   │  - JWT Verification                 │
       │   │  - hera_auth_introspect_v1 RPC      │
       │   │  - Returns organizations & roles    │
       │   └──────────┬──────────────────────────┘
       │              │
       │              ↓
       │   ┌─────────────────────────────────────┐
       │   │  Organization Count Routing         │
       │   │  0 → Create Org                     │
       │   │  1 → Single Org Dashboard (/apps)   │
       │   │  2+ → Org Selector                  │
       │   └──────────┬──────────────────────────┘
       │              │
       └──────────────┘
                      │
                      ↓
              ┌───────────────┐
              │ Role Mapping  │
              │ (salon only)  │
              └───────┬───────┘
                      │
                      ↓
              ┌───────────────────────┐
              │ Role-Based Routing    │
              │ owner → /salon/dash   │
              │ recep → /salon/recep  │
              └───────┬───────────────┘
                      │
                      ↓
              ┌───────────────┐
              │ AUTHENTICATED │
              │ USER DASHBOARD│
              └───────────────┘
```

---

## ✅ Summary

### Current State
- ✅ Two functional login pages serving different user bases
- ✅ Both use same backend authentication infrastructure
- ✅ API v2 optimization benefits both pages
- ✅ Backward compatibility maintained

### Identified Issues
- ⚠️ Duplicate authentication logic between pages
- ⚠️ Special case handling for Hair Talkz users
- ⚠️ Inconsistent role mapping implementation

### Recommended Actions
1. **Short-term:** Document the dual-page architecture (✅ DONE)
2. **Medium-term:** Standardize role mapping in backend/provider
3. **Long-term:** Consider consolidating authentication logic

---

**Status:** ✅ **ANALYSIS COMPLETE**

**Analyzed By:** Claude Code
**Date:** 2025-10-27
**Related Work:** API v2 optimization, HERA RBAC migration, Authentication fixes
