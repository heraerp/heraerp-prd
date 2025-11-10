# Demo User Login Flow - Complete Analysis

## Overview

When the demo user (`demo@heraerp.com`) logs in at `/auth/login`, HERA executes a sophisticated authentication flow that resolves their organization context, available apps, and determines the optimal landing page.

## Current Organization Structure

After completing the hierarchical setup, the demo user has access to **4 organizations**:

```
1. HERA Cashew Demo (DEMO-CASHEW) → CASHEW app
2. HERA Salon Demo (DEMO-SALON) → SALON app
3. HERA ERP Demo (DEMO-ERP) → No apps (parent org)
4. HERA ERP DEMO (HERA-DEMO) → CASHEW + SALON apps (legacy)
```

**Default Organization**: HERA Cashew Demo
**Default App**: CASHEW

## Login Flow Step-by-Step

### 1. User Initiates Login

**Location**: `/src/app/auth/login/page.tsx`

User clicks "Login as Demo User" or enters credentials and clicks "Sign In".

```typescript
// Demo login button onClick
handleDemoLogin = async () => {
  setEmail('demo@heraerp.com')
  setPassword('demo2025!')
  await login('demo@heraerp.com', 'demo2025!')
  // Redirect handled by useEffect
}
```

### 2. Authentication via HERAAuthProvider

**Location**: `/src/components/auth/MultiOrgAuthProvider.tsx` (or similar)

The `login()` function from `useHERAAuth()` hook:

1. **Authenticates with Supabase**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'demo@heraerp.com',
     password: 'demo2025!'
   })
   ```

2. **Resolves User Identity**:
   - Gets auth user ID: `a55cc033-e909-4c59-b974-8ff3e098f2bf`
   - Finds PLATFORM USER entity: `4d93b3f8-dfe8-430c-83ea-3128f6a520cf`

3. **Calls Introspection RPC**:
   ```typescript
   const { data: context } = await supabase.rpc('hera_auth_introspect_v1', {
     p_actor_user_id: '4d93b3f8-dfe8-430c-83ea-3128f6a520cf'
   })
   ```

4. **Receives Organization Context**:
   ```json
   {
     "organization_count": 4,
     "default_organization_id": "699453c2-950e-4456-9fc0-c0c71efa78fb",
     "default_app": "CASHEW",
     "organizations": [
       {
         "id": "699453c2-950e-4456-9fc0-c0c71efa78fb",
         "name": "HERA Cashew Demo",
         "code": "DEMO-CASHEW",
         "apps": [{ "code": "CASHEW", "name": "HERA Cashew Finance" }],
         "primary_role": "ORG_OWNER",
         "default_app": null
       },
       {
         "id": "de5f248d-7747-44f3-9d11-a279f3158fa5",
         "name": "HERA Salon Demo",
         "code": "DEMO-SALON",
         "apps": [{ "code": "SALON", "name": "HERA Salon Management" }],
         "primary_role": "ORG_OWNER",
         "default_app": "SALON"
       },
       {
         "id": "c58cdbcd-73f9-4cef-8c27-caf9f4436d05",
         "name": "HERA ERP Demo",
         "code": "DEMO-ERP",
         "apps": [],
         "primary_role": "ORG_OWNER",
         "default_app": null
       },
       {
         "id": "9a9cc652-5c64-4917-a990-3d0fb6398543",
         "name": "HERA ERP DEMO",
         "code": "HERA-DEMO",
         "apps": [
           { "code": "CASHEW", "name": "HERA Cashew Finance" },
           { "code": "SALON", "name": "HERA Salon Management" }
         ],
         "primary_role": "ORG_OWNER",
         "default_app": null
       }
     ]
   }
   ```

5. **Sets Auth Context State**:
   ```typescript
   setIsAuthenticated(true)
   setOrganizations(context.organizations)
   setDefaultOrganization(context.default_organization_id)
   setDefaultApp(context.default_app) // 'CASHEW'
   setAvailableApps(getAllAppsFromOrganizations(context.organizations))
   ```

### 3. Smart App-Based Routing

**Location**: `/src/app/auth/login/page.tsx` lines 54-124

After authentication, a `useEffect` hook determines the redirect destination:

```typescript
useEffect(() => {
  if (isAuthenticated && organizations !== null) {
    // 1. Check for redirect URL in localStorage
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin')
      router.push(redirectUrl)
      return
    }

    // 2. Check for return_to query parameter
    if (returnTo) {
      router.push(returnTo)
      return
    }

    // 3. If user has NO organizations → create organization
    if (organizations.length === 0) {
      router.push('/auth/organizations/new')
      return
    }

    // 4. If only ONE app available → redirect to that app's dashboard
    if (availableApps && availableApps.length === 1) {
      const appCode = availableApps[0].code.toLowerCase()
      console.log('🚀 Only one app available, redirecting to:', `/${appCode}/dashboard`)
      router.push(`/${appCode}/dashboard`)
      return
    }

    // 5. If defaultApp is set → redirect to default app's dashboard
    if (defaultApp && availableApps && availableApps.length > 0) {
      const appCode = defaultApp.toLowerCase()
      console.log('🚀 Using default app:', `/${appCode}/dashboard`)
      router.push(`/${appCode}/dashboard`)
      return
    }

    // 6. If multiple apps → show app selector
    if (availableApps && availableApps.length > 1) {
      console.log('📋 Multiple apps available, showing selector')
      router.push('/apps')
      return
    }

    // 7. If multiple organizations → let them choose
    if (organizations.length > 1) {
      router.push('/auth/organizations')
      return
    }

    // 8. Final fallback → show apps page
    router.push('/apps')
  }
}, [isAuthenticated, organizations, returnTo, router, availableApps, defaultApp])
```

### 4. Demo User's Actual Routing Path

**For the demo user with 4 organizations and default app "CASHEW":**

1. ✅ **Priority 1**: No redirect URL in localStorage → Skip
2. ✅ **Priority 2**: No `return_to` query parameter → Skip
3. ✅ **Priority 3**: Has 4 organizations (not 0) → Skip
4. ✅ **Priority 4**: Has 4 apps available (CASHEW appears twice + SALON appears twice) → **NOT 1 app** → Skip
5. ✅ **Priority 5**: ✨ **MATCHED!** → `defaultApp = "CASHEW"` and `availableApps.length > 0`

**Result**: User is redirected to **`/cashew/dashboard`** ✨

## Available Apps Array

The demo user sees the following apps in the `availableApps` array:

```typescript
availableApps = [
  { code: 'CASHEW', name: 'HERA Cashew Finance' }, // from DEMO-CASHEW
  { code: 'SALON', name: 'HERA Salon Management' }, // from DEMO-SALON
  { code: 'CASHEW', name: 'HERA Cashew Finance' }, // from HERA-DEMO
  { code: 'SALON', name: 'HERA Salon Management' }  // from HERA-DEMO
]
```

**Note**: Apps appear multiple times because they're available in multiple organizations. The auth provider may deduplicate these.

## Organization Switcher Behavior

When the user opens the organization switcher:

1. Shows all 4 organizations
2. Highlights "HERA Cashew Demo" as the current organization
3. Each organization shows its available apps:
   - HERA Cashew Demo → [CASHEW]
   - HERA Salon Demo → [SALON]
   - HERA ERP Demo → [No apps]
   - HERA ERP DEMO → [CASHEW, SALON]

4. When user switches organization:
   - Context updates to new organization
   - Available apps update based on new organization
   - URL updates to match new organization's default app (if any)

## App Switcher Behavior

When the user opens the app switcher:

1. Shows all unique apps available across ALL organizations
2. Displays: CASHEW, SALON
3. Highlights current app based on current route
4. Clicking an app navigates to `/{app_code}/dashboard`

## Special Cases

### Case 1: User Switches to HERA Salon Demo

1. Organization context updates to DEMO-SALON
2. Available apps updates to: [SALON only]
3. If defaultApp for DEMO-SALON is "SALON":
   - Already on correct app → Stay on current route
   - OR navigate to `/salon/dashboard`

### Case 2: User Switches to HERA ERP Demo (Parent Org)

1. Organization context updates to DEMO-ERP
2. Available apps updates to: [] (empty - no apps)
3. User sees message: "No apps available for this organization"
4. Cannot access any app dashboards
5. May show organization management interface instead

### Case 3: User Directly Navigates to `/auth/login?return_to=/salon/appointments`

1. Login completes successfully
2. Priority 2 is matched: `returnTo = '/salon/appointments'`
3. User is redirected to **`/salon/appointments`** directly
4. Bypasses default app logic entirely

## URL Patterns

### After Login:
- **Default**: `/cashew/dashboard` (because defaultApp = "CASHEW")
- **With return_to**: Value of `return_to` parameter
- **With saved redirect**: Value from `localStorage.getItem('redirectAfterLogin')`

### App URLs:
- **CASHEW**: `/cashew/*` routes
- **SALON**: `/salon/*` routes
- **Organization Selector**: `/auth/organizations`
- **App Selector**: `/apps`

## Security Considerations

### Organization Isolation

Each app route must verify:
1. User is authenticated
2. User belongs to current organization
3. Organization has the app installed
4. User has permission to access the app

Example verification:
```typescript
// In /cashew/dashboard
const { organization, availableApps } = useHERAAuth()

if (!organization) {
  return <Alert>No organization selected</Alert>
}

const hasAccess = availableApps.some(app => app.code === 'CASHEW')
if (!hasAccess) {
  return <Alert>This organization does not have access to CASHEW</Alert>
}

// Proceed with dashboard rendering
```

### Data Access

All API calls automatically include:
- `user_id`: PLATFORM USER entity ID (`4d93b3f8-dfe8-430c-83ea-3128f6a520cf`)
- `organization_id`: Current organization ID
- JWT token in Authorization header

The API v2 gateway enforces:
- Actor must be a member of the organization
- RLS policies filter data by organization_id
- Audit trail captures all changes

## Testing the Flow

### Test 1: Basic Login
```bash
1. Navigate to /auth/login
2. Click "Login as Demo User"
3. Verify redirect to /cashew/dashboard
4. Verify organization context shows "HERA Cashew Demo"
5. Verify available apps shows [CASHEW]
```

### Test 2: Organization Switching
```bash
1. Login as demo user (lands on /cashew/dashboard)
2. Open organization switcher
3. Select "HERA Salon Demo"
4. Verify redirect to /salon/dashboard
5. Verify organization context shows "HERA Salon Demo"
6. Verify available apps shows [SALON]
```

### Test 3: App Switching
```bash
1. Login as demo user (lands on /cashew/dashboard)
2. Open app switcher
3. Select "SALON"
4. Verify redirect to /salon/dashboard
5. Verify organization context may update if needed
```

### Test 4: Parent Organization Access
```bash
1. Login as demo user
2. Switch to "HERA ERP Demo" (parent org)
3. Verify no apps are available
4. Verify appropriate message is displayed
5. Verify user cannot access /cashew or /salon routes
```

## Troubleshooting

### Issue: Stuck on login page
**Cause**: `isAuthenticated` is true but `organizations` is null
**Solution**: Check that introspection RPC is returning data

### Issue: Redirected to /apps instead of /cashew/dashboard
**Cause**: `defaultApp` is not set or `availableApps` is empty
**Solution**: Verify introspection returns `default_app: "CASHEW"` and apps array

### Issue: Can't access /salon routes after login
**Cause**: Current organization doesn't have SALON app
**Solution**: Switch to DEMO-SALON organization or HERA-DEMO organization

### Issue: Shows wrong organization after login
**Cause**: Default organization ID doesn't match expected
**Solution**: Check introspection `default_organization_id` matches expectations

## Future Enhancements

### 1. Remember Last Organization
Store user's last selected organization in:
- `localStorage` for persistence across sessions
- User preferences in database

### 2. Organization-Specific URLs
Use subdomains or path prefixes:
- `cashew-demo.heraerp.com` → Auto-selects DEMO-CASHEW
- `salon-demo.heraerp.com` → Auto-selects DEMO-SALON

### 3. Multi-Tab Organization Context
Sync organization context across tabs using:
- `BroadcastChannel` API
- `localStorage` events
- Service Worker messages

### 4. Smart App Recommendations
After login, show:
- "Continue where you left off" (last used app)
- "Try these apps" (based on role and preferences)
- "Quick actions" (common tasks across apps)

## References

- **Login Page**: `/src/app/auth/login/page.tsx`
- **Auth Provider**: `/src/components/auth/MultiOrgAuthProvider.tsx` (or similar)
- **Introspection RPC**: `/db/rpc/hera_auth_introspect_v1_FINAL.sql`
- **Organization Setup**: `/docs/setup/DEMO-ORG-HIERARCHY-SETUP.md`
- **HERA Authentication**: `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`
