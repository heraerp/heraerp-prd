# ⚠️ PARTIALLY OUTDATED: Demo Login Implementation for Furniture Module

**⚠️ THIS DOCUMENTATION IS FURNITURE-SPECIFIC AND OUTDATED**

**Current System**: Please refer to `/docs/UNIFIED-DEMO-MODULE-SELECTOR.md` for the current unified demo implementation that covers all modules.

**What Changed**: Individual module demo components have been replaced with a unified `DemoModuleSelector` that handles all demo modules from the login page.

**Migration Date**: 2025-01-11

---

# 🪑 Demo Login Implementation for Furniture Module (OUTDATED APPROACH)

## Overview

We've implemented a complete demo login system that allows users to quickly access the furniture module without going through the organization setup flow.

## Implementation Details

### 1. **Demo User Created**
- Email: `demo@keralafurniture.com`
- Password: `FurnitureDemo2025!`
- Organization: Kerala Furniture Works
- Organization ID: `f0af4ced-9d12-4a55-a649-b484368db249`

### 2. **Components Updated**

#### `FurnitureDemoLogin.tsx`
- One-click demo login button
- Sets session storage flags to indicate demo login
- Shows loading state during login
- Redirects directly to `/furniture`

#### `auth/login/page.tsx`
- Checks for demo login flag in session storage
- Bypasses organization check for demo users
- Redirects to `/furniture` instead of organization setup

#### `api/v1/organizations/route.ts`
- Special handling for demo user email
- Returns hardcoded Kerala Furniture Works organization
- Ensures demo user always has an organization

### 3. **User Metadata**
The demo user has proper metadata set:
```json
{
  "organization_id": "f0af4ced-9d12-4a55-a649-b484368db249",
  "organization_name": "Kerala Furniture Works",
  "organizations": ["f0af4ced-9d12-4a55-a649-b484368db249"],
  "default_organization": "f0af4ced-9d12-4a55-a649-b484368db249",
  "role": "admin",
  "module": "furniture"
}
```

## How It Works

1. **User clicks "Login with Demo Account"**
   - Component signs out any existing session
   - Signs in with demo credentials
   - Sets `isDemoLogin` flag in session storage

2. **Login page redirect logic**
   - Detects `isDemoLogin` flag
   - Skips organization check
   - Redirects directly to `/furniture`

3. **Organizations API**
   - Recognizes demo user by email
   - Returns furniture organization without database query
   - Ensures consistent organization data

## Usage

### For End Users
1. Go to http://localhost:3000/auth/login
2. Click "Login with Demo Account" button
3. Automatically redirected to furniture dashboard

### For Developers
```typescript
// The demo login sets these flags
sessionStorage.setItem('isDemoLogin', 'true')
sessionStorage.setItem('demoOrgId', 'f0af4ced-9d12-4a55-a649-b484368db249')

// Which are checked in the login page
const isDemoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
if (isDemoLogin) {
  router.push('/furniture')
}
```

## Files Modified

1. `/src/components/furniture/FurnitureDemoLogin.tsx` - Demo login component
2. `/src/app/auth/login/page.tsx` - Login page redirect logic
3. `/src/app/api/v1/organizations/route.ts` - Organizations API
4. `/setup-furniture-demo-user.js` - User creation script
5. `/fix-demo-user-organization.js` - Organization fix script

## Testing

Run these scripts to test:

```bash
# Test authentication flow
node test-furniture-auth.js

# Test demo login flow
node test-demo-login-flow.js

# Fix organization if needed
node fix-demo-user-organization.js
```

## Benefits

1. **Quick Access**: One-click access to furniture module
2. **No Setup Required**: Bypasses organization creation
3. **Proper Auth**: Uses real authentication flow
4. **RLS Compatible**: All queries properly filtered
5. **Demo Ready**: Perfect for demonstrations

## Troubleshooting

### Still redirecting to organizations/new?
1. Clear browser cache and cookies
2. Run `node fix-demo-user-organization.js`
3. Check browser console for errors

### Login fails?
1. Verify credentials are correct
2. Check Supabase connection
3. Ensure user exists in database

### Can't see furniture data?
1. Verify organization_id is set
2. Check RLS policies
3. Ensure demo data exists

## Next Steps

The demo login is now fully functional and will redirect users directly to the furniture dashboard at `/furniture`, bypassing any organization setup flows.