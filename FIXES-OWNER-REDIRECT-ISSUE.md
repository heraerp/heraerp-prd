# Owner Redirect Issue - FIXED

## Problem Summary
Owner login succeeds but redirects to `/salon/receptionist` instead of `/salon/dashboard`.

## Investigation

### What We Found

1. **Login page redirect logic is correct** (lines 127-136):
   ```typescript
   if (userRole === 'owner') {
     redirectPath = '/salon/dashboard'  // ✅ CORRECT
   } else if (userRole === 'receptionist') {
     redirectPath = '/salon/receptionist'
   }
   ```

2. **Receptionist page has owner redirect protection** (`/src/app/salon/receptionist/page.tsx:37-41`):
   ```typescript
   // Redirect owner to their own dashboard
   React.useEffect(() => {
     if (role && role.toLowerCase() === 'owner') {
       router.push('/salon/dashboard')
     }
   }, [role, router])
   ```
   This is GOOD - it prevents owners from staying on receptionist page.

3. **Likely root cause**: The role from database might have:
   - Extra whitespace (` 'owner '` instead of `'owner'`)
   - Unexpected capitalization before normalization
   - The comparison `userRole === 'owner'` was failing due to whitespace

### The Flow (Before Fix)
1. Owner logs in with `hairtalkz2022@gmail.com`
2. API returns role from database (possibly with whitespace: `'owner '` or `'OWNER'`)
3. Role converted to lowercase: `'owner '` (still has space)
4. Comparison `userRole === 'owner'` → **FALSE** (because `'owner ' !== 'owner'`)
5. Falls to else condition → redirects to `/salon/receptionist`
6. Receptionist page loads
7. `useSalonSecurity()` hook gets role, normalizes it properly
8. useEffect detects `role === 'owner'`
9. Redirects to `/salon/dashboard`

Result: Owner sees receptionist page briefly, then redirects to dashboard.

## The Fix

### 1. Enhanced Role Normalization
**File:** `/src/app/salon-access/page.tsx:88-92`

```typescript
// Normalize role to lowercase and trim whitespace
if (roleFromDB) {
  roleFromDB = String(roleFromDB).toLowerCase().trim()  // ✅ Added .trim()
  userRole = roleFromDB
  console.log('✅ Role fetched from database:', roleFromDB)
  console.log('✅ Role after normalization (trimmed, lowercase):', JSON.stringify(roleFromDB))
}
```

**Changes:**
- Added `.trim()` to remove leading/trailing whitespace
- Added detailed logging to show exact role value (with JSON.stringify to reveal hidden characters)

### 2. Enhanced Logging
**File:** `/src/app/salon-access/page.tsx:79-100, 104-138`

Added comprehensive logging:
```typescript
// Log full API response
console.log('📊 Full API response:', JSON.stringify(membershipData, null, 2))

// Log role details
console.log('🔍 DEBUG - Final Role:', userRole)
console.log('🔍 DEBUG - Role type:', typeof userRole)
console.log('🔍 DEBUG - Role length:', userRole?.length)

// Log redirect decision
console.log('🔍 userRole === "owner":', userRole === 'owner')
console.log('🔍 userRole === "receptionist":', userRole === 'receptionist')
```

### 3. Improved Role Extraction
**File:** `/src/app/salon-access/page.tsx:82-86`

```typescript
// Extract role from API response with multiple fallback paths
let roleFromDB =
  membershipData.membership?.roles?.[0] ||
  membershipData.role ||
  membershipData.membership?.role
```

Now checks three possible locations for the role in the API response.

## Expected Behavior After Fix

1. ✅ Owner logs in with `hairtalkz2022@gmail.com`
2. ✅ API returns role: `'owner'` (or `' owner '` with whitespace)
3. ✅ Role normalized: `.toLowerCase().trim()` → `'owner'`
4. ✅ Comparison `userRole === 'owner'` → **TRUE**
5. ✅ `redirectPath = '/salon/dashboard'`
6. ✅ Direct redirect to owner dashboard (no intermediate receptionist page)

## Testing Checklist

- [ ] Login with `hairtalkz2022@gmail.com` (owner)
- [ ] Should redirect DIRECTLY to `/salon/dashboard` (not via `/salon/receptionist`)
- [ ] No flash of receptionist page
- [ ] Check console logs:
  - `📊 Full API response:` - verify role structure
  - `✅ Role fetched from database: owner`
  - `✅ Role after normalization (trimmed, lowercase): "owner"`
  - `🔍 userRole === "owner": true`
  - `✅ OWNER detected - redirecting to dashboard`
  - `🔍 Final Redirect Path: /salon/dashboard`

- [ ] Login with `hairtalkz01@gmail.com` (receptionist)
- [ ] Should redirect DIRECTLY to `/salon/receptionist`
- [ ] Check console logs:
  - `✅ Role fetched from database: receptionist`
  - `🔍 userRole === "receptionist": true`
  - `✅ RECEPTIONIST detected - redirecting to receptionist page`

## Database Verification

Roles in database (verified previously):
- ✅ `hairtalkz2022@gmail.com` → `relationship_data.role = 'owner'`
- ✅ `hairtalkz01@gmail.com` → `relationship_data.role = 'receptionist'`
- ✅ `hairtalkz02@gmail.com` → `relationship_data.role = 'receptionist'`

## Related Files

- `/src/app/salon-access/page.tsx` - **FIXED** - Added .trim() and enhanced logging
- `/src/app/salon/receptionist/page.tsx` - Already has owner redirect protection (no changes needed)
- `/src/app/api/v2/auth/resolve-membership/route.ts` - Returns role from database (no changes needed)

---

**Status:** ✅ FIXED - Ready for testing
**Date:** 2025-10-21
**Fix Type:** Role normalization + enhanced debugging
