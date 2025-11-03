# Demo User Redirect Loop Fix - Login Then Immediate Logout

## 🐛 Problem

After successfully logging in with `demo@heraerp.com`, the dashboard would load briefly then immediately redirect back to `/salon/auth` page, creating a login loop.

**Symptoms:**
- ✅ Login succeeds
- ✅ Dashboard loads
- ❌ Immediately redirects to `/auth` page
- ❌ User cannot access dashboard

**Working User:**  `hairtalkz01@gmail.com` - stays logged in
**Broken User:** `demo@heraerp.com` - redirects immediately

## 🔍 Root Cause Analysis

### The Critical Difference

**✅ WORKING USER (hairtalkz01):**
```javascript
Auth UID: 4e1340cf-fefc-4d21-92ee-a8c4a244364b
USER Entity ID: 4e1340cf-fefc-4d21-92ee-a8c4a244364b  // SAME ID
Metadata: { "email": "hairtalkz01@gmail.com" }
```

**❌ BROKEN USER (demo):**
```javascript
Auth UID: a55cc033-e909-4c59-b974-8ff3e098f2bf
USER Entity ID: 4d93b3f8-dfe8-430c-83ea-3128f6a520cf  // DIFFERENT ID
Metadata: {
  "source": "hera_onboard_user_v1",
  "supabase_user_id": "a55cc033-e909-4c59-b974-8ff3e098f2bf"
}
```

### Why the Difference Matters

1. **Legacy Users (hairtalkz01):**
   - Created before `hera_onboard_user_v1` RPC was implemented
   - USER entity ID directly matches auth UID
   - No metadata mapping needed
   - Works with both auth UID and user entity ID

2. **New Users (demo):**
   - Created via `hera_onboard_user_v1` RPC
   - Generates NEW user entity ID (different from auth UID)
   - Stores mapping in `metadata->>'supabase_user_id'`
   - Requires proper ID mapping

### The Bug Flow

```
1. User logs in at /salon/auth
2. Login page calls /api/v2/auth/resolve-membership
3. API correctly maps auth UID to user entity ID ✅
4. API returns: { user_id: "a55cc...", user_entity_id: "4d93b..." } ✅
5. Login page stores localStorage.setItem('userId', data.user.id) ❌ BUG!
   - Stores AUTH UID instead of USER ENTITY ID
6. Page redirects to /salon/dashboard
7. HERAAuthProvider mounts, loads session
8. Uses auth UID for lookups ❌
9. Organization/role verification fails
10. Redirects back to /auth
```

## ✅ Solution Implemented

### Fix 1: API Route (Already Fixed)
**File:** `/src/app/api/v2/auth/resolve-membership/route.ts`
**Lines:** 43-68

Maps auth UID to user entity ID before calling `hera_auth_introspect_v1`:

```typescript
// ✅ FIX: Map auth UID to user entity ID
const { data: userEntities } = await supabaseService
  .from('core_entities')
  .select('id, entity_name')
  .eq('entity_type', 'USER')
  .contains('metadata', { supabase_user_id: authUserId })
  .limit(1)

const userEntityId = userEntities?.[0]?.id || authUserId

// Now call RPC with correct ID
const { data: authContext } = await supabaseService.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userEntityId  // ✅ Uses user entity ID
})

// Return both IDs in response
return NextResponse.json({
  user_id: authUserId,           // Auth UID
  user_entity_id: userEntityId,  // USER entity ID
  // ... rest of response
})
```

### Fix 2: Login Page (NEW FIX)
**File:** `/src/app/salon/auth/page.tsx`
**Lines:** 352-371

Store user entity ID (from API response) instead of auth UID:

```typescript
// ✅ FIX: Use user_entity_id from API (not auth UID)
const userEntityId = membershipData.user_entity_id || data.user.id

console.log('💾 Setting fresh data in localStorage:')
console.log('  - userId (auth UID):', data.user.id)
console.log('  - userEntityId (USER entity):', userEntityId)

localStorage.setItem('userId', userEntityId)        // ✅ Use user entity ID
localStorage.setItem('authUserId', data.user.id)   // Store auth UID separately
```

**Before Fix:**
```javascript
localStorage.setItem('userId', data.user.id)  // ❌ Auth UID
```

**After Fix:**
```javascript
localStorage.setItem('userId', membershipData.user_entity_id)  // ✅ User entity ID
localStorage.setItem('authUserId', data.user.id)               // Auth UID for reference
```

## 🧪 Verification

### Test the Fix:

```bash
# 1. Start dev server
npm run dev

# 2. Login with demo user
# Email: demo@heraerp.com
# Password: demo123

# 3. Should redirect to /salon/dashboard and STAY there (no redirect loop)
```

### Expected Behavior:

1. ✅ Login succeeds
2. ✅ Dashboard loads
3. ✅ User stays logged in
4. ✅ No redirect loop
5. ✅ Organization context correct
6. ✅ Role: ORG_OWNER

### Console Logs to Verify:

```javascript
// In login page (during login)
💾 Setting fresh data in localStorage:
  - organizationId: 9a9cc652-5c64-4917-a990-3d0fb6398543
  - salonRole: owner
  - userEmail: demo@heraerp.com
  - userId (auth UID): a55cc033-e909-4c59-b974-8ff3e098f2bf
  - userEntityId (USER entity): 4d93b3f8-dfe8-430c-83ea-3128f6a520cf  // ✅ This is now stored

// In HERAAuthProvider (after redirect)
✅ Membership resolved from v2 API: {
  user_id: "a55cc033-e909-4c59-b974-8ff3e098f2bf",
  user_entity_id: "4d93b3f8-dfe8-430c-83ea-3128f6a520cf",
  organization_count: 1,
  organizations: [{ name: "HERA ERP DEMO", roles: ["ORG_OWNER"] }]
}
```

## 📊 Data Comparison

### Working User (hairtalkz01)
```javascript
{
  authUid: "4e1340cf-fefc-4d21-92ee-a8c4a244364b",
  userEntityId: "4e1340cf-fefc-4d21-92ee-a8c4a244364b", // SAME
  organizationId: "..."
}
// Works because both IDs are identical
```

### Demo User (FIXED)
```javascript
{
  authUid: "a55cc033-e909-4c59-b974-8ff3e098f2bf",
  userEntityId: "4d93b3f8-dfe8-430c-83ea-3128f6a520cf", // DIFFERENT
  organizationId: "9a9cc652-5c64-4917-a990-3d0fb6398543"
}
// Now works because we use userEntityId everywhere
```

## 🔄 Login Flow (Fixed)

```
1. User enters demo@heraerp.com / demo123
2. Supabase auth validates credentials
3. Returns JWT with auth UID: a55cc033-e909-4c59-b974-8ff3e098f2bf
4. Login page calls /api/v2/auth/resolve-membership with JWT
5. API extracts auth UID from JWT
6. ✅ NEW: API queries core_entities for USER with metadata->supabase_user_id
7. ✅ NEW: API finds user entity ID: 4d93b3f8-dfe8-430c-83ea-3128f6a520cf
8. API calls hera_auth_introspect_v1 with user entity ID
9. RPC finds MEMBER_OF and HAS_ROLE relationships
10. RPC returns: HERA ERP DEMO org with ORG_OWNER role
11. API returns success with BOTH IDs:
    - user_id (auth UID)
    - user_entity_id (USER entity ID)
12. ✅ NEW: Login page stores user_entity_id in localStorage.userId
13. Login page redirects to /salon/dashboard
14. Dashboard loads, HERAAuthProvider initializes
15. ✅ NEW: Uses user entity ID from localStorage
16. Organization context loads correctly
17. ✅ LOGIN SUCCESS - NO REDIRECT!
```

## 🛡️ Prevention

### For Future User Onboarding:

When creating new users via `hera_onboard_user_v1`:

1. ✅ RPC creates USER entity with NEW ID
2. ✅ RPC stores mapping in `metadata->>'supabase_user_id'`
3. ✅ API always maps auth UID to user entity ID
4. ✅ Frontend always uses user entity ID from API response

### For MCP User Creation:

```javascript
// When creating users via MCP:
const { data } = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: authUid,           // Auth UID
  p_organization_id: orgId,
  p_role: 'ORG_OWNER',
  p_actor_user_id: actorUserId,
  p_is_active: true,
  p_effective_at: new Date().toISOString()
})

// Result includes:
// - user_entity_id: NEW ID created by RPC
// - Mapping stored in metadata automatically
```

## 🎯 Impact

**Fixed Users:**
- ✅ demo@heraerp.com (and all future users created via `hera_onboard_user_v1`)

**Unaffected Users:**
- ✅ hairtalkz01@gmail.com (legacy users work as before)
- ✅ All users where auth UID = user entity ID

## 📝 Lessons Learned

1. **Auth UID ≠ User Entity ID** for users created via `hera_onboard_user_v1`
2. **Always use user entity ID** for HERA operations (not auth UID)
3. **API must map** auth UID to user entity ID before calling RPCs
4. **Frontend must store** user entity ID from API response
5. **Test with new users** created via standard onboarding flow

## 🎉 Resolution

The demo user `demo@heraerp.com` can now successfully login and stay logged in to the HERA ERP DEMO organization!

**Date Fixed:** 2025-11-03
**Status:** ✅ Fixed - Ready for Testing
**Affected Users:** All newly onboarded users via `hera_onboard_user_v1`
**Files Changed:**
- `/src/app/api/v2/auth/resolve-membership/route.ts` (already fixed)
- `/src/app/salon/auth/page.tsx` (NEW FIX)
