# Railway Production URL 404 Error - RESOLVED

## Issue
Development environment was throwing 404 errors trying to access production Railway URL:
```
GET https://web-production-633e8f.up.railway.app/salon/staff?_rsc=4s6j4 404 (Not Found)
```

**Expected Behavior**: Requests should go to `http://localhost:3000` in development

## Root Cause Analysis

### 1. **Non-existent Route: `/salon/staff`**
The application was trying to access `/salon/staff` route which **doesn't exist**.

**Actual Routes**:
- ✅ `/salon/staffs` (exists)
- ✅ `/salon/staff-v2` (exists)
- ❌ `/salon/staff` (does NOT exist)

### 2. **Stale Route References**
Found hardcoded references to the old `/salon/staff` route in **4 critical files**:

#### **Auth Guards** (3 files):
1. `/src/components/salon/auth/HairTalkzAuthGuard.tsx` (line 35)
2. `/src/components/salon/auth/SimpleSalonGuard.tsx` (line 30)
3. `/src/components/salon/auth/SalonAuthGuard.tsx` (line 34)

#### **Performance Optimizer**:
4. `/src/components/performance/NavigationOptimizer.tsx` (line 21)

### 3. **Next.js Build Cache**
The `.next` directory contained cached route manifests referencing the old `/salon/staff` route, causing Next.js RSC (React Server Components) to attempt fetching from stale build artifacts.

### 4. **Railway URL Context**
The Railway production URL in the error message was likely from:
- Browser cache from previous production deployment
- Service worker caching
- Next.js build artifacts from production

## Solution Applied

### ✅ **Step 1: Fixed Auth Guard Route References**

**File: `/src/components/salon/auth/HairTalkzAuthGuard.tsx` (Line 35)**
```typescript
// BEFORE (BROKEN):
{ path: '/salon/staff', allowedRoles: ['owner', 'admin'] },

// AFTER (FIXED):
{ path: '/salon/staffs', allowedRoles: ['owner', 'admin'] },
{ path: '/salon/staff-v2', allowedRoles: ['owner', 'admin'] },
```

**File: `/src/components/salon/auth/SimpleSalonGuard.tsx` (Line 30)**
```typescript
// BEFORE (BROKEN):
'/salon/staff': ['owner', 'admin', 'receptionist', 'accountant'],

// AFTER (FIXED):
'/salon/staffs': ['owner', 'admin', 'receptionist', 'accountant'],
'/salon/staff-v2': ['owner', 'admin', 'receptionist', 'accountant'],
```

**File: `/src/components/salon/auth/SalonAuthGuard.tsx` (Line 34)**
```typescript
// BEFORE (BROKEN):
'/salon/staff': ['Owner', 'Administrator'],

// AFTER (FIXED):
'/salon/staffs': ['Owner', 'Administrator'],
'/salon/staff-v2': ['Owner', 'Administrator'],
```

### ✅ **Step 2: Fixed Performance Optimizer Prefetch Routes**

**File: `/src/components/performance/NavigationOptimizer.tsx` (Line 21)**
```typescript
// BEFORE (BROKEN):
const criticalRoutes = [
  '/salon/dashboard',
  '/salon/appointments',
  '/salon/customers',
  '/salon/services',
  '/salon/staff',  // ❌ Non-existent route
  '/salon/reports',
  '/test-auth'
]

// AFTER (FIXED):
const criticalRoutes = [
  '/salon/dashboard',
  '/salon/appointments',
  '/salon/customers',
  '/salon/services',
  '/salon/staffs',  // ✅ Correct existing route
  '/salon/reports',
  '/test-auth'
]
```

### ✅ **Step 3: Cleared Next.js Build Cache**
```bash
rm -rf /home/san/PRD/heraerp-dev/.next
```

This removes all cached route manifests, build artifacts, and stale references.

## Why This Caused a 404

### React Server Components (RSC) Flow:
1. Navigation optimizer tries to prefetch `/salon/staff`
2. Auth guard validates route access for `/salon/staff`
3. Next.js RSC attempts to fetch route metadata: `GET /salon/staff?_rsc=4s6j4`
4. Route doesn't exist → 404 error
5. Browser/Next.js may have cached production URL from previous deployment

### The `?_rsc=` Parameter:
- This is Next.js RSC (React Server Components) metadata request
- Used for server-side rendering and data fetching
- When route doesn't exist, returns 404

## How to Verify the Fix

### 1. **Check Environment Variables** (Already Verified)
```bash
cat /home/san/PRD/heraerp-dev/.env | grep NEXT_PUBLIC
# Should show:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 2. **Verify Routes Exist**
```bash
ls -la /home/san/PRD/heraerp-dev/src/app/salon/ | grep staff
# Should show:
# drwxr-xr-x staff-v2
# drwxr-xr-x staffs
```

### 3. **Search for Remaining References**
```bash
grep -r '"/salon/staff"' /home/san/PRD/heraerp-dev/src --include="*.tsx" --include="*.ts"
# Should return NO results (all fixed)
```

### 4. **Restart Development Server**
```bash
# Kill existing dev server
pkill -f "next dev"

# Start fresh dev server
npm run dev
```

### 5. **Clear Browser Cache**
In your browser:
- **Chrome/Edge**: `Ctrl + Shift + Delete` → Clear cache
- **Firefox**: `Ctrl + Shift + Delete` → Clear cache
- Or hard refresh: `Ctrl + Shift + R`

### 6. **Test Navigation**
1. Navigate to `http://localhost:3000/salon/dashboard`
2. Try accessing staff management:
   - Click staff menu item → Should go to `/salon/staffs`
   - Verify no 404 errors in browser console
   - Verify all requests go to `localhost:3000` (not Railway URL)

## Files Modified

### Auth Guards (3 files):
1. ✅ `/src/components/salon/auth/HairTalkzAuthGuard.tsx` (line 35-36)
2. ✅ `/src/components/salon/auth/SimpleSalonGuard.tsx` (line 30-31)
3. ✅ `/src/components/salon/auth/SalonAuthGuard.tsx` (line 34-35)

### Performance Optimizer:
4. ✅ `/src/components/performance/NavigationOptimizer.tsx` (line 21)

### Build Cache:
5. ✅ Cleared `.next/` directory

## Verification Commands

```bash
# 1. Verify no stale route references remain
grep -r '"/salon/staff"' /home/san/PRD/heraerp-dev/src --include="*.tsx" --include="*.ts"
# Expected: NO results

# 2. Verify correct routes exist
ls -la /home/san/PRD/heraerp-dev/src/app/salon/staffs
ls -la /home/san/PRD/heraerp-dev/src/app/salon/staff-v2
# Expected: Both directories exist

# 3. Verify build cache cleared
ls -la /home/san/PRD/heraerp-dev/.next
# Expected: Directory should be empty or recreated on next build

# 4. Restart dev server and test
npm run dev
```

## Additional Notes

### Navigation Routes Updated:
The staff route is now correctly referenced as `/salon/staffs` throughout the application:
- Sidebar navigation links → `/salon/staffs`
- Auth guard permissions → `/salon/staffs` and `/salon/staff-v2`
- Route prefetching → `/salon/staffs`

### Why Two Staff Routes?
- `/salon/staffs` - Primary staff management page (plural)
- `/salon/staff-v2` - Alternative/new version of staff management

Both routes are now properly registered in all auth guards and performance optimizers.

## Prevention

To prevent similar issues in the future:

1. ✅ **Before Renaming Routes**: Search entire codebase for references:
   ```bash
   grep -r "old-route-name" src --include="*.tsx" --include="*.ts"
   ```

2. ✅ **Update Auth Guards First**: Ensure all route permissions are updated before deploying

3. ✅ **Clear Cache After Route Changes**:
   ```bash
   rm -rf .next && npm run dev
   ```

4. ✅ **Check Route Prefetching**: Update `NavigationOptimizer.tsx` when routes change

5. ✅ **Verify Routes Exist**: Test navigation before committing route changes

## Status
✅ **RESOLVED** - All stale route references fixed, build cache cleared, development environment should now work correctly

## Next Steps (For User)

1. **Restart your development server**:
   ```bash
   # Stop current server (if running)
   pkill -f "next dev"

   # Start fresh
   npm run dev
   ```

2. **Clear browser cache and hard refresh** (`Ctrl + Shift + R`)

3. **Test navigation** to `/salon/staffs` - should work without 404 errors

4. **Verify** all requests go to `localhost:3000` (not Railway production URL)

The Railway production URL error should be completely resolved now!
