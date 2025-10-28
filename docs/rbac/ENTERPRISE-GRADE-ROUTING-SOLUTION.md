# Enterprise-Grade Authentication Routing Solution

**Date:** 2025-10-27
**Status:** 🎯 **DESIGN READY FOR IMPLEMENTATION**

---

## 🚨 Problem Statement

**Current Issue:** `/auth/login` has hardcoded email pattern matching for Hair Talkz users:

```typescript
// ❌ ANTI-PATTERN: Hardcoded email checks (Lines 76-98)
if (email.includes('@hairtalkz.com') || email.includes('michele')) {
  router.push('/salon/dashboard')
  return
}
```

**Why This Is Bad:**
1. ❌ **Not scalable** - Every new industry/tenant needs code changes
2. ❌ **Security risk** - Business logic in client code
3. ❌ **Maintenance nightmare** - Hardcoded patterns scattered across codebase
4. ❌ **Inconsistent behavior** - Bypasses standard authentication flow
5. ❌ **No audit trail** - Cannot track routing decisions
6. ❌ **Breaks multi-org** - Users with multiple orgs don't get org selector

---

## ✅ Enterprise-Grade Solution: Role-Based Routing

### Core Principle
**"Routing decisions are made by the backend based on user roles, not email patterns"**

### Architecture Overview

```
User Logs In
     ↓
Standard Auth Flow (ALL USERS)
     ↓
API v2: /auth/resolve-membership
     ↓
Returns: {
  organizations: [...],
  default_organization_id: "uuid",
  default_landing_page: "/salon/dashboard",  // ✅ NEW: Backend decides
  user_preferences: {
    preferred_landing: "/salon/dashboard"
  }
}
     ↓
Client Uses API Response (NO EMAIL CHECKS)
     ↓
Role-Based Routing
```

---

## 🏗️ Implementation Design

### Phase 1: Extend API v2 Response

**File:** `/src/app/api/v2/auth/resolve-membership/route.ts`

**Add routing metadata to response:**

```typescript
// ✅ ENHANCED: API response includes routing information
return NextResponse.json({
  success: true,
  user_id: userId,
  user_entity_id: userId,
  organization_count: authContext.organization_count,
  default_organization_id: authContext.default_organization_id,
  organizations: validOrgs,
  is_platform_admin: authContext.is_platform_admin,

  // ✅ NEW: Enterprise-grade routing metadata
  routing: {
    default_landing_page: determineDefaultLanding(validOrgs[0]),
    suggested_redirect: determineSuggestedRedirect(validOrgs),
    requires_org_selection: validOrgs.length > 1,
    user_preferences: await getUserPreferences(userId)
  },

  membership: {
    organization_id: defaultOrg.id,
    roles: defaultOrg.roles,
    role: defaultOrg.primary_role,
    primary_role: defaultOrg.primary_role,
    is_active: true,
    is_owner: defaultOrg.is_owner,
    is_admin: defaultOrg.is_admin,
    organization_name: defaultOrg.name,
    organization_type: defaultOrg.organization_type  // ✅ NEW: salon, manufacturing, etc.
  }
})
```

**Helper Functions:**

```typescript
// Determine default landing page based on organization type and role
function determineDefaultLanding(org: any): string {
  const orgType = org.organization_type?.toLowerCase() || 'general'
  const primaryRole = org.primary_role?.toLowerCase() || 'member'

  // Industry-specific routing matrix
  const routingMatrix: Record<string, Record<string, string>> = {
    'salon': {
      'org_owner': '/salon/dashboard',
      'org_admin': '/salon/dashboard',
      'org_manager': '/salon/dashboard',
      'org_accountant': '/salon/dashboard',
      'org_employee': '/salon/receptionist',
      'default': '/salon/dashboard'
    },
    'manufacturing': {
      'org_owner': '/manufacturing/dashboard',
      'org_admin': '/manufacturing/dashboard',
      'org_manager': '/manufacturing/production',
      'default': '/manufacturing/dashboard'
    },
    'restaurant': {
      'org_owner': '/restaurant/dashboard',
      'org_admin': '/restaurant/dashboard',
      'org_manager': '/restaurant/orders',
      'default': '/restaurant/dashboard'
    },
    'general': {
      'org_owner': '/apps',
      'org_admin': '/apps',
      'default': '/apps'
    }
  }

  const industryRoutes = routingMatrix[orgType] || routingMatrix['general']
  return industryRoutes[primaryRole] || industryRoutes['default'] || '/apps'
}

// Determine suggested redirect (considering user preferences, last visited, etc.)
function determineSuggestedRedirect(orgs: any[]): string {
  if (orgs.length === 0) return '/auth/organizations/new'
  if (orgs.length > 1) return '/auth/organizations'

  const defaultOrg = orgs[0]
  return determineDefaultLanding(defaultOrg)
}

// Get user preferences from database (future enhancement)
async function getUserPreferences(userId: string): Promise<any> {
  // Query core_dynamic_data for user preferences
  // Field: 'preferred_landing_page', 'last_visited_page', etc.
  return {
    preferred_landing_page: null,  // User can customize this
    last_visited_page: null,       // Track for "continue where you left off"
    preferred_organization_id: null // For multi-org users
  }
}
```

---

### Phase 2: Create Centralized Routing Service

**File:** `/src/lib/auth/routing-service.ts` (NEW)

```typescript
/**
 * Enterprise-Grade Authentication Routing Service
 *
 * Centralizes all routing logic based on API v2 responses.
 * NO hardcoded email checks, NO client-side business logic.
 */

export interface AuthRoutingContext {
  user_id: string
  organization_count: number
  default_organization_id: string
  organizations: Array<{
    id: string
    name: string
    organization_type: string
    primary_role: string
    is_owner: boolean
    is_admin: boolean
  }>
  routing: {
    default_landing_page: string
    suggested_redirect: string
    requires_org_selection: boolean
    user_preferences: {
      preferred_landing_page?: string
      last_visited_page?: string
      preferred_organization_id?: string
    }
  }
}

export interface RedirectOptions {
  returnTo?: string | null          // Query parameter ?return_to
  storedRedirect?: string | null    // localStorage.redirectAfterLogin
  respectUserPreferences?: boolean  // Use user's preferred landing page
}

/**
 * Determine where to redirect user after successful authentication
 *
 * Priority Order:
 * 1. Stored return URL (interrupted task)
 * 2. Query parameter ?return_to
 * 3. User preferences (if enabled)
 * 4. API suggested redirect (organization count based)
 * 5. API default landing page (role + industry based)
 * 6. Fallback: /apps
 */
export function determinePostLoginRedirect(
  authContext: AuthRoutingContext,
  options: RedirectOptions = {}
): string {
  const {
    returnTo,
    storedRedirect,
    respectUserPreferences = true
  } = options

  // Priority 1: Stored redirect URL (user was interrupted)
  if (storedRedirect) {
    console.log('[Routing] Using stored redirect:', storedRedirect)
    return storedRedirect
  }

  // Priority 2: Query parameter return URL
  if (returnTo) {
    console.log('[Routing] Using query parameter return_to:', returnTo)
    return returnTo
  }

  // Priority 3: User preferences (if enabled)
  if (respectUserPreferences) {
    const preferredPage = authContext.routing.user_preferences?.preferred_landing_page
    if (preferredPage) {
      console.log('[Routing] Using user preference:', preferredPage)
      return preferredPage
    }
  }

  // Priority 4: API suggested redirect (org count based)
  // This handles: new user (0 orgs), multi-org selector, single org
  const suggestedRedirect = authContext.routing.suggested_redirect
  if (suggestedRedirect) {
    console.log('[Routing] Using API suggested redirect:', suggestedRedirect)
    return suggestedRedirect
  }

  // Priority 5: API default landing page (role + industry)
  const defaultLanding = authContext.routing.default_landing_page
  if (defaultLanding) {
    console.log('[Routing] Using API default landing page:', defaultLanding)
    return defaultLanding
  }

  // Priority 6: Fallback
  console.log('[Routing] Using fallback redirect: /apps')
  return '/apps'
}

/**
 * Get industry-specific dashboard URL
 *
 * Used when we know the organization type but need the main dashboard
 */
export function getIndustryDashboard(organizationType: string): string {
  const dashboards: Record<string, string> = {
    'salon': '/salon/dashboard',
    'manufacturing': '/manufacturing/dashboard',
    'restaurant': '/restaurant/dashboard',
    'retail': '/retail/dashboard',
    'general': '/apps'
  }

  return dashboards[organizationType.toLowerCase()] || '/apps'
}

/**
 * Get role-specific landing page within an industry
 *
 * Used for fine-grained routing based on both industry and role
 */
export function getRoleBasedLanding(
  organizationType: string,
  primaryRole: string
): string {
  const routingMatrix: Record<string, Record<string, string>> = {
    'salon': {
      'org_owner': '/salon/dashboard',
      'org_admin': '/salon/dashboard',
      'org_manager': '/salon/dashboard',
      'org_accountant': '/salon/dashboard',
      'org_employee': '/salon/receptionist',
      'default': '/salon/dashboard'
    },
    'manufacturing': {
      'org_owner': '/manufacturing/dashboard',
      'org_admin': '/manufacturing/dashboard',
      'org_manager': '/manufacturing/production',
      'org_employee': '/manufacturing/floor',
      'default': '/manufacturing/dashboard'
    },
    'restaurant': {
      'org_owner': '/restaurant/dashboard',
      'org_admin': '/restaurant/dashboard',
      'org_manager': '/restaurant/orders',
      'org_employee': '/restaurant/pos',
      'default': '/restaurant/dashboard'
    }
  }

  const industryRoutes = routingMatrix[organizationType.toLowerCase()]
  if (!industryRoutes) return '/apps'

  return industryRoutes[primaryRole.toLowerCase()] || industryRoutes['default'] || '/apps'
}

/**
 * Validate redirect URL for security
 *
 * Prevents open redirect vulnerabilities
 */
export function isValidRedirectUrl(url: string): boolean {
  // Only allow relative URLs (no external redirects)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false
  }

  // Must start with /
  if (!url.startsWith('/')) {
    return false
  }

  // No double slashes (protocol-relative URLs)
  if (url.startsWith('//')) {
    return false
  }

  return true
}
```

---

### Phase 3: Update HERAAuthProvider

**File:** `/src/components/auth/HERAAuthProvider.tsx`

**Add routing context to auth state:**

```typescript
interface HERAAuthContext {
  // ... existing fields

  // ✅ NEW: Routing context from API
  routingContext?: {
    default_landing_page: string
    suggested_redirect: string
    requires_org_selection: boolean
    user_preferences: any
  }

  // ✅ NEW: Helper function
  getPostLoginRedirect: (options?: RedirectOptions) => string
}

// In provider implementation:
const getPostLoginRedirect = (options?: RedirectOptions): string => {
  if (!ctx.routingContext) return '/apps'

  return determinePostLoginRedirect({
    user_id: ctx.user?.id || '',
    organization_count: ctx.organizations?.length || 0,
    default_organization_id: ctx.organization?.id || '',
    organizations: ctx.organizations || [],
    routing: ctx.routingContext
  }, options)
}
```

---

### Phase 4: Refactor /auth/login (REMOVE HARDCODED LOGIC)

**File:** `/src/app/auth/login/page.tsx`

**BEFORE (Lines 76-98 - DELETE THIS):**
```typescript
// ❌ REMOVE: Hardcoded email checks
if (email.includes('@hairtalkz.com') || email.includes('michele')) {
  const { data } = await supabase.auth.signInWithPassword({ email, password })
  if (data.user) {
    router.push('/salon/dashboard')
    return
  }
}
```

**AFTER (REPLACE WITH):**
```typescript
// ✅ ENTERPRISE-GRADE: Unified authentication flow
try {
  // Standard authentication for ALL users
  await login(email, password)

  // Redirect will be handled by useEffect after auth context resolves
  // No special cases, no hardcoded logic
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to login')
} finally {
  setIsLoading(false)
}
```

**Update redirect useEffect:**
```typescript
useEffect(() => {
  if (isAuthenticated && organizations !== null) {
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    const returnTo = searchParams.get('return_to')

    // ✅ ENTERPRISE-GRADE: Use routing service
    const redirect = getPostLoginRedirect({
      returnTo,
      storedRedirect: redirectUrl,
      respectUserPreferences: true
    })

    // Clean up stored redirect
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin')
    }

    console.log('[Login] Redirecting to:', redirect)
    router.push(redirect)
  }
}, [isAuthenticated, organizations, searchParams, router, getPostLoginRedirect])
```

---

## 📊 Routing Matrix Configuration

### Organization Type Configuration

**Store in database:** `core_dynamic_data` for each organization

```typescript
// Organization entity dynamic field
{
  entity_id: "org-uuid",
  field_name: "organization_type",
  field_type: "text",
  field_value_text: "salon",
  smart_code: "HERA.ORG.STRUCTURE.FIELD.ORG_TYPE.v1"
}
```

**Supported Organization Types:**
- `salon` - Beauty salon industry
- `manufacturing` - Manufacturing industry
- `restaurant` - Restaurant/hospitality industry
- `retail` - Retail industry
- `general` - General business (default)

---

### Role-Based Landing Pages

**Configuration stored in API v2 code (single source of truth):**

| Organization Type | Role | Landing Page |
|-------------------|------|--------------|
| **salon** | ORG_OWNER | `/salon/dashboard` |
| **salon** | ORG_ADMIN | `/salon/dashboard` |
| **salon** | ORG_MANAGER | `/salon/dashboard` |
| **salon** | ORG_ACCOUNTANT | `/salon/dashboard` |
| **salon** | ORG_EMPLOYEE | `/salon/receptionist` |
| **manufacturing** | ORG_OWNER | `/manufacturing/dashboard` |
| **manufacturing** | ORG_MANAGER | `/manufacturing/production` |
| **restaurant** | ORG_OWNER | `/restaurant/dashboard` |
| **restaurant** | ORG_MANAGER | `/restaurant/orders` |
| **general** | Any | `/apps` |

---

## 🔐 Security Benefits

### 1. Open Redirect Protection
```typescript
// Validate all redirect URLs
if (!isValidRedirectUrl(redirect)) {
  console.warn('[Security] Invalid redirect URL blocked:', redirect)
  redirect = '/apps'
}
```

### 2. Business Logic in Backend
- ✅ Client cannot manipulate routing decisions
- ✅ Audit trail in API logs
- ✅ Role changes immediately affect routing
- ✅ No hardcoded patterns in client code

### 3. Consistent Authorization
- ✅ API v2 verifies user has access to organization
- ✅ Role resolution uses HERA RBAC (HAS_ROLE relationships)
- ✅ Organization type validated against database
- ✅ No client-side role assumptions

---

## 🎯 User Experience Benefits

### 1. Personalization
Users can set preferred landing page:
```typescript
// User preference stored in core_dynamic_data
{
  entity_id: "user-uuid",
  field_name: "preferred_landing_page",
  field_type: "text",
  field_value_text: "/salon/appointments",
  smart_code: "HERA.USER.PREFERENCE.LANDING_PAGE.v1"
}
```

### 2. "Continue Where You Left Off"
Track last visited page:
```typescript
// Store last page before logout/timeout
{
  entity_id: "user-uuid",
  field_name: "last_visited_page",
  field_type: "text",
  field_value_text: "/salon/products",
  smart_code: "HERA.USER.PREFERENCE.LAST_PAGE.v1"
}
```

### 3. Smart Multi-Org Handling
```typescript
// User with multiple orgs
{
  entity_id: "user-uuid",
  field_name: "preferred_organization_id",
  field_type: "text",
  field_value_text: "org-uuid",
  smart_code: "HERA.USER.PREFERENCE.DEFAULT_ORG.v1"
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Routing Service)

```typescript
describe('determinePostLoginRedirect', () => {
  it('should prioritize stored redirect URL', () => {
    const context = createMockAuthContext({ orgType: 'salon', role: 'ORG_OWNER' })
    const redirect = determinePostLoginRedirect(context, {
      storedRedirect: '/salon/products',
      returnTo: '/apps'
    })
    expect(redirect).toBe('/salon/products')
  })

  it('should use API suggested redirect for multi-org users', () => {
    const context = createMockAuthContext({ orgCount: 3 })
    const redirect = determinePostLoginRedirect(context, {})
    expect(redirect).toBe('/auth/organizations')
  })

  it('should route salon employees to receptionist page', () => {
    const context = createMockAuthContext({
      orgType: 'salon',
      role: 'ORG_EMPLOYEE'
    })
    const redirect = determinePostLoginRedirect(context, {})
    expect(redirect).toBe('/salon/receptionist')
  })

  it('should prevent open redirect vulnerabilities', () => {
    expect(isValidRedirectUrl('http://evil.com')).toBe(false)
    expect(isValidRedirectUrl('//evil.com')).toBe(false)
    expect(isValidRedirectUrl('/apps')).toBe(true)
  })
})
```

### Integration Tests (End-to-End)

```typescript
describe('Login Flow', () => {
  it('should route Hair Talkz owner to salon dashboard', async () => {
    const { user } = await loginAs('Hairtalkz2022@gmail.com', 'password')

    // Should NOT check email pattern
    // Should use API response with org_type=salon, role=ORG_OWNER
    expect(getCurrentPath()).toBe('/salon/dashboard')
  })

  it('should route salon employee to receptionist page', async () => {
    const { user } = await loginAs('hairtalkz01@gmail.com', 'password')

    // Should use API response with org_type=salon, role=ORG_EMPLOYEE
    expect(getCurrentPath()).toBe('/salon/receptionist')
  })

  it('should handle user with multiple organizations', async () => {
    const { user } = await loginAs('admin@multi.com', 'password')

    // Should see org selector
    expect(getCurrentPath()).toBe('/auth/organizations')
  })
})
```

---

## 📋 Implementation Checklist

### Phase 1: Backend Enhancement (30 min)
- [ ] Add `organization_type` to organization entities in database
- [ ] Extend API v2 response with routing metadata
- [ ] Implement `determineDefaultLanding()` helper
- [ ] Implement `determineSuggestedRedirect()` helper
- [ ] Add user preferences query (stub for now)

### Phase 2: Routing Service (20 min)
- [ ] Create `/src/lib/auth/routing-service.ts`
- [ ] Implement `determinePostLoginRedirect()`
- [ ] Implement `isValidRedirectUrl()` security check
- [ ] Add routing matrix configuration
- [ ] Write unit tests

### Phase 3: Remove Hardcoded Logic (15 min)
- [ ] **Delete lines 76-98 from `/auth/login/page.tsx`**
- [ ] Update useEffect to use routing service
- [ ] Remove email pattern checks
- [ ] Test with Hair Talkz users

### Phase 4: Update Auth Provider (20 min)
- [ ] Add routing context to HERAAuthProvider state
- [ ] Add `getPostLoginRedirect()` helper to context
- [ ] Update API response parsing
- [ ] Update `/salon-access` to use same service

### Phase 5: Testing (30 min)
- [ ] Unit test routing service
- [ ] Integration test login flows
- [ ] Test with real Hair Talkz users
- [ ] Test multi-org scenarios
- [ ] Verify security (open redirect prevention)

### Phase 6: Documentation (15 min)
- [ ] Update API v2 documentation
- [ ] Document routing matrix
- [ ] Create migration guide
- [ ] Update CLAUDE.md with new patterns

**Total Estimated Time: 2 hours**

---

## 🎯 Success Criteria

✅ **Functionality:**
- [ ] Hair Talkz users route to salon dashboard WITHOUT email checks
- [ ] All users use identical authentication flow
- [ ] Role-based routing works for all industries
- [ ] Multi-org users see organization selector
- [ ] Return URLs work correctly

✅ **Security:**
- [ ] No hardcoded business logic in client
- [ ] Open redirect vulnerabilities prevented
- [ ] All routing decisions logged
- [ ] API validates organization access

✅ **Maintainability:**
- [ ] Single source of truth for routing logic
- [ ] New industries can be added via configuration
- [ ] No code changes needed for new tenants
- [ ] Comprehensive test coverage

✅ **User Experience:**
- [ ] Users land on appropriate page for their role
- [ ] Interrupted tasks resume correctly
- [ ] Preferences respected
- [ ] Smooth, consistent experience

---

## 🚀 Migration Path

### Step 1: Deploy Backend Changes
```bash
# Deploy API v2 enhancements with routing metadata
# Backward compatible - existing clients still work
```

### Step 2: Deploy Routing Service
```bash
# New service is additive, doesn't break existing code
npm run build
```

### Step 3: Update /auth/login (Breaking Change for Hair Talkz)
```bash
# Remove hardcoded logic
# Hair Talkz users will use standard flow
# Test thoroughly before deploying
```

### Step 4: Monitor and Verify
```bash
# Check logs for routing decisions
# Verify Hair Talkz users route correctly
# Monitor for any routing issues
```

---

## ✅ Summary

### Problem
❌ Hardcoded email checks for Hair Talkz users bypass standard authentication flow

### Solution
✅ Role-based routing determined by backend API v2 response

### Benefits
- 🔐 **Security:** Business logic in backend, open redirect protection
- 🏢 **Scalability:** Add new industries via configuration
- 🛠️ **Maintainability:** Single source of truth for routing
- 👤 **UX:** Personalization, preferences, smart multi-org handling
- 📊 **Observability:** All routing decisions logged and auditable

### Next Steps
1. Review and approve design
2. Implement Phase 1 (backend enhancement)
3. Implement Phase 2 (routing service)
4. **Remove hardcoded logic** (Phase 3)
5. Test with real users
6. Deploy to production

---

**Status:** 🎯 **READY FOR IMPLEMENTATION**

**Designed By:** Claude Code
**Date:** 2025-10-27
**Estimated Implementation Time:** 2 hours
