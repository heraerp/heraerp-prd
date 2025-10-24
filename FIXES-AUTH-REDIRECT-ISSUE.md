# Auth Redirect Issue - FIXED

## Problem Summary
After successful login, users were redirected back to `/salon-access` when navigating to protected pages like `/salon/receptionist`.

**Symptoms:**
- Login succeeds
- API endpoints verify correctly (`verifyAuth` shows correct roles)
- Page loads initially
- Then immediately redirects to `/salon-access`

## Root Cause
The `HERAAuthProvider` had a flawed `didResolveRef.current` check (lines 106-122) that prevented the auth context from being re-established on page navigation.

**The Flow:**
1. User logs in successfully → `didResolveRef.current = true`, context set
2. User navigates to `/salon/receptionist`
3. Provider re-mounts or re-renders
4. Auth state change event fires with valid session
5. **BUG:** `didResolveRef.current` is still `true`, so provider returns early
6. Context (`ctx.user`, `ctx.organization`) not set
7. `SecuredSalonProvider` checks `auth.isAuthenticated` → `false`
8. Redirects to `/salon-access`

## The Fix (Applied)

### 1. Added Context Ref Tracking
Created `ctxRef` to track the current auth state:

```typescript
const ctxRef = useRef<{
  user: HERAUser | null
  organization: HERAOrganization | null
  isAuthenticated: boolean
}>({
  user: null,
  organization: null,
  isAuthenticated: false
})

// Keep ref in sync with state
useEffect(() => {
  ctxRef.current = {
    user: ctx.user,
    organization: ctx.organization,
    isAuthenticated: ctx.isAuthenticated
  }
}, [ctx.user, ctx.organization, ctx.isAuthenticated])
```

### 2. Fixed didResolveRef Logic
Updated the auth state change handler to allow re-resolution when context is missing:

```typescript
if (didResolveRef.current) {
  // If session disappeared, reset context
  if (!session) {
    console.log('🔐 Session disappeared, resetting context')
    didResolveRef.current = false
    setCtx({ /* reset state */ })
    return
  }
  // ✅ NEW: If session exists but context is missing (page navigation/reload), allow re-resolution
  if (session && !ctxRef.current.user) {
    console.log('🔄 Session exists but context missing, re-resolving...')
    didResolveRef.current = false
    // Fall through to resolution logic below
  } else {
    // Session exists and context is valid, no action needed
    console.log('✅ Session and context both valid, no re-resolution needed')
    return
  }
}
```

### 3. Enhanced Logging
Added detailed logging to track auth state transitions:

```typescript
console.log('🔐 HERA Auth state change:', event, {
  hasSession: !!session,
  didResolve: didResolveRef.current,
  currentUser: ctxRef.current.user?.email
})
```

## Expected Behavior After Fix

1. ✅ User logs in → Context established
2. ✅ User navigates to protected page
3. ✅ Provider detects missing context with valid session
4. ✅ Re-resolves auth context automatically
5. ✅ `SecuredSalonProvider` sees `isAuthenticated: true`
6. ✅ Page renders without redirect

## Testing Checklist

- [ ] Login with `hairtalkz2022@gmail.com` (owner)
- [ ] Verify redirect to `/salon/dashboard`
- [ ] Navigate to different pages
- [ ] Refresh page - should stay authenticated
- [ ] Login with `hairtalkz01@gmail.com` (receptionist)
- [ ] Verify redirect to `/salon/receptionist`
- [ ] Navigate to different pages
- [ ] Check browser console for expected logs:
  - `✅ Membership resolved from v2 API`
  - `✅ HERA normalized context`
  - `✅ Session and context both valid, no re-resolution needed`

## Related Files

- `/src/components/auth/HERAAuthProvider.tsx` - Main fix applied here
- `/src/app/salon/SecuredSalonProvider.tsx` - Uses `auth.isAuthenticated`
- `/src/app/salon-access/page.tsx` - Login page (already fetching role from database)
- `/src/lib/auth/verify-auth.ts` - Server-side auth (already using direct queries)

## Database Role Verification

All roles correctly assigned in database:
- ✅ `hairtalkz2022@gmail.com` → `owner`
- ✅ `hairtalkz01@gmail.com` → `receptionist`
- ✅ `hairtalkz02@gmail.com` → `receptionist`

Roles stored in `core_relationships.relationship_data.role` field.

## Why Direct Queries for Auth

See `/mcp-server/why-direct-query-for-auth.md` for detailed explanation:
- MEMBER_OF relationships exist in tenant orgs, not platform org
- RPC `hera_entities_crud_v1` respects org boundaries
- Cannot query cross-org relationships via RPC
- **Solution:** Use direct queries for auth, RPC for business operations

---

**Status:** ✅ FIXED - Ready for testing
**Date:** 2025-10-21
**Affected Users:** All salon users (owner, receptionist)
