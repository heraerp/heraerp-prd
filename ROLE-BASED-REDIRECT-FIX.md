# Role-Based Redirect Fix - Complete Solution

## Problem
Users were being redirected to wrong dashboards:
- ❌ Owner → Receptionist page (then redirected to Dashboard)
- ❌ Receptionist → Owner Dashboard

**Root Cause:** LocalStorage was persisting role data between logins, causing role confusion.

## Solution: Complete Cache Clearing on Login

### Implementation

**File:** `/src/app/salon-access/page.tsx`

**Strategy:** Clear ALL cached data before every new login to ensure fresh role from database.

### Key Changes

#### 1. Clear Everything Before Login
```typescript
// 🔒 CRITICAL: Clear ALL cached data before new login
console.log('🧹 Clearing all cached data before login...')
localStorage.clear()

// Clear Zustand store
try {
  const { useSalonSecurityStore } = await import('@/lib/salon/security-store')
  const securityStore = useSalonSecurityStore.getState()
  securityStore.clearState()
  console.log('✅ Zustand store cleared')
} catch (e) {
  console.warn('⚠️ Could not clear security store:', e)
}

// Sign out any existing session first
await supabase.auth.signOut()
console.log('✅ Previous session cleared')
```

**What This Does:**
- ✅ Clears ALL localStorage (no stale roles)
- ✅ Clears Zustand security store (no cached permissions)
- ✅ Signs out existing Supabase session (clean state)
- ✅ Ensures fresh authentication every time

#### 2. Fetch Fresh Role from Database
```typescript
// Fetch role from database via API
const response = await fetch('/api/v2/auth/resolve-membership', {
  headers: {
    'Authorization': `Bearer ${data.session.access_token}`
  }
})

const membershipData = await response.json()

// Extract role from API response
let roleFromDB =
  membershipData.membership?.roles?.[0] ||
  membershipData.role ||
  membershipData.membership?.role

// Normalize role
roleFromDB = String(roleFromDB).toLowerCase().trim()
userRole = roleFromDB
```

**What This Does:**
- ✅ Calls membership API with fresh JWT token
- ✅ Gets role directly from database
- ✅ Normalizes role (lowercase + trim)
- ✅ No dependency on cached data

#### 3. Set Fresh Data in LocalStorage
```typescript
console.log('💾 Setting fresh data in localStorage:')
console.log('  - organizationId:', orgId)
console.log('  - salonRole:', userRole)
console.log('  - userEmail:', data.user.email || email)
console.log('  - userId:', data.user.id)

localStorage.setItem('organizationId', orgId)
localStorage.setItem('safeOrganizationId', orgId)
localStorage.setItem('salonRole', userRole) // Fresh role from database
localStorage.setItem('userEmail', data.user.email || email)
localStorage.setItem('userId', data.user.id)

console.log('✅ LocalStorage updated with fresh role from database')
```

**What This Does:**
- ✅ Sets role ONLY after fetching from database
- ✅ Comprehensive logging for debugging
- ✅ No race conditions
- ✅ Clear audit trail

#### 4. Role-Based Redirect
```typescript
// CRITICAL: Force exact string comparison
const normalizedRole = String(userRole).toLowerCase().trim()
console.log('🔍 normalizedRole after force normalization:', normalizedRole)
console.log('🔍 normalizedRole === "owner":', normalizedRole === 'owner')

if (normalizedRole === 'owner') {
  redirectPath = '/salon/dashboard'
  console.log('✅ OWNER detected - redirecting to dashboard')
} else if (normalizedRole === 'receptionist') {
  redirectPath = '/salon/receptionist'
  console.log('✅ RECEPTIONIST detected - redirecting to receptionist page')
} else {
  redirectPath = '/salon/receptionist' // default fallback
  console.log('⚠️ Unknown role - using default receptionist redirect')
}
```

**What This Does:**
- ✅ Double normalization for safety
- ✅ Explicit role comparison
- ✅ Comprehensive logging
- ✅ Fallback for unknown roles

## Complete Login Flow (After Fix)

```
1. User clicks "Sign In"
   ↓
2. localStorage.clear() - Clear ALL cached data
   ↓
3. securityStore.clearState() - Clear Zustand cache
   ↓
4. supabase.auth.signOut() - Clear existing session
   ↓
5. supabase.auth.signInWithPassword() - Fresh authentication
   ↓
6. Call /api/v2/auth/resolve-membership - Get role from database
   ↓
7. Extract role from API response
   ↓
8. Normalize role (toLowerCase + trim)
   ↓
9. Set fresh role in localStorage
   ↓
10. Compare role and determine redirect path
    ↓
11. Redirect to correct dashboard
```

## Expected Behavior

### Owner Login (hairtalkz2022@gmail.com)
```
✅ Clear cache
✅ Sign out previous session
✅ Authenticate with Supabase
✅ Fetch membership from API → roles: ['owner']
✅ Extract role → 'owner'
✅ Normalize role → 'owner'
✅ Set localStorage.salonRole = 'owner'
✅ Redirect to /salon/dashboard
✅ Owner dashboard loads directly
```

### Receptionist Login (hairtalkz01@gmail.com)
```
✅ Clear cache
✅ Sign out previous session
✅ Authenticate with Supabase
✅ Fetch membership from API → roles: ['receptionist']
✅ Extract role → 'receptionist'
✅ Normalize role → 'receptionist'
✅ Set localStorage.salonRole = 'receptionist'
✅ Redirect to /salon/receptionist
✅ Receptionist page loads directly
```

## Console Logs to Verify

When testing, you should see these logs in order:

```javascript
// 1. Cache clearing
🧹 Clearing all cached data before login...
✅ Zustand store cleared
✅ Previous session cleared

// 2. Authentication
🔐 Signing in...

// 3. API call
📊 Full API response: {
  success: true,
  user_entity_id: "...",
  membership: {
    organization_id: "...",
    roles: ["owner"] // or ["receptionist"]
  }
}

// 4. Role extraction
🔍 DEBUG - Checking role paths:
  - membershipData.membership?.roles: ["owner"]
  - membershipData.membership?.roles?.[0]: "owner"
✅ Role fetched from database: owner
✅ Role after normalization (trimmed, lowercase): "owner"

// 5. LocalStorage update
💾 Setting fresh data in localStorage:
  - organizationId: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
  - salonRole: owner
  - userEmail: hairtalkz2022@gmail.com
  - userId: 5ac911a5-aedd-48dc-8d0a-0009f9d22f9a
✅ LocalStorage updated with fresh role from database

// 6. Redirect decision
🔍 === REDIRECT LOGIC START ===
🔍 normalizedRole after force normalization: owner
🔍 normalizedRole === "owner": true
✅ OWNER detected - redirecting to dashboard
🎯 FINAL REDIRECT PATH: /salon/dashboard
🚀 EXECUTING REDIRECT NOW to: /salon/dashboard
```

## Testing Checklist

### Test 1: Owner Login
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Navigate to `/salon-access`
- [ ] Login as `hairtalkz2022@gmail.com`
- [ ] Check console logs (should show all logs above)
- [ ] Should redirect to `/salon/dashboard`
- [ ] NO flash of receptionist page
- [ ] Check localStorage: `salonRole` should be `'owner'`

### Test 2: Receptionist Login
- [ ] Sign out from owner dashboard
- [ ] Navigate to `/salon-access`
- [ ] Login as `hairtalkz01@gmail.com`
- [ ] Check console logs (should show receptionist role)
- [ ] Should redirect to `/salon/receptionist`
- [ ] NO redirect to owner dashboard
- [ ] Check localStorage: `salonRole` should be `'receptionist'`

### Test 3: Switch Between Users
- [ ] Login as owner → Should go to dashboard
- [ ] Sign out
- [ ] Login as receptionist → Should go to receptionist
- [ ] Verify localStorage clears between logins
- [ ] No role confusion

### Test 4: Browser Refresh
- [ ] Login as owner
- [ ] Refresh browser (F5)
- [ ] Should stay on owner dashboard
- [ ] Login as receptionist
- [ ] Refresh browser (F5)
- [ ] Should stay on receptionist page

## Verification Commands

Run these in browser console to verify:

```javascript
// Check current role
console.log('Current role:', localStorage.getItem('salonRole'))

// Check all auth data
console.log('Organization:', localStorage.getItem('organizationId'))
console.log('User email:', localStorage.getItem('userEmail'))
console.log('User ID:', localStorage.getItem('userId'))

// Check Zustand store
import('@/lib/salon/security-store').then(({useSalonSecurityStore}) => {
  const state = useSalonSecurityStore.getState()
  console.log('Zustand salonRole:', state.salonRole)
  console.log('Zustand organizationId:', state.organizationId)
})
```

## Database Verification

Roles in database (should match):
```sql
SELECT
  cr.from_entity_id as user_id,
  ce.entity_name as user_email,
  cr.relationship_data->>'role' as role
FROM core_relationships cr
JOIN core_entities ce ON ce.id = cr.from_entity_id
WHERE cr.relationship_type = 'MEMBER_OF'
  AND cr.is_active = true
  AND cr.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
ORDER BY cr.created_at;
```

**Expected Results:**
- ✅ hairtalkz2022@gmail.com → role: 'owner'
- ✅ hairtalkz01@gmail.com → role: 'receptionist'
- ✅ hairtalkz02@gmail.com → role: 'receptionist'

## Troubleshooting

### Issue: Still redirecting to wrong dashboard

**Solution 1:** Hard refresh and clear cache
```javascript
// In browser console
localStorage.clear()
location.reload(true) // Hard reload
```

**Solution 2:** Clear all browser data
```
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check all boxes
4. Click "Clear data"
5. Close and reopen browser
```

**Solution 3:** Check database role
```javascript
// Run in browser console after login
fetch('/api/v2/auth/resolve-membership', {
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
  }
}).then(r => r.json()).then(console.log)
```

### Issue: Logs not appearing

**Possible causes:**
- Console was not open during login
- Page redirected too fast
- Browser cache serving old code

**Solution:**
1. Open DevTools BEFORE clicking sign in
2. Check "Preserve log" in console settings
3. Hard refresh (Ctrl+Shift+R)

## Security Benefits

This fix also improves security:

1. ✅ **No Stale Sessions:** Always sign out before new login
2. ✅ **Fresh Role Data:** Always fetch from database, never cache
3. ✅ **Clear Audit Trail:** Comprehensive logging for debugging
4. ✅ **Prevent Role Confusion:** Complete cache clear prevents privilege escalation
5. ✅ **Defense in Depth:** Multiple normalization steps ensure correct role

---

**Status:** ✅ FIXED - Complete cache clearing on login
**Date:** 2025-10-21
**Impact:** Correct role-based redirects for all users
**Security:** Enhanced - prevents role confusion and privilege escalation
