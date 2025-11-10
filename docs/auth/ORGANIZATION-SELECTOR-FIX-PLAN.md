# Organization Selector Fix Plan

## Issues Identified

### Issue 1: Wrong Organization Selected
**Symptom**: Clicking "HERA Salon Demo" loads salon page with "HERA Cashew Demo" organization

**Root Cause**:
- `/auth/organizations` page sets localStorage but doesn't update HERAAuthProvider context
- Redirects to `/salon/auth` which reads from HERAAuthProvider
- HERAAuthProvider still has default organization from login (HERA Cashew Demo)

### Issue 2: Infinite Redirect Loop
**Symptom**: Login → dashboard → login → dashboard loop

**Root Cause**:
- Login redirects to `/auth/organizations` (correct)
- User selects org → redirects to `/salon/auth` (WRONG - this is a login page!)
- `/salon/auth` checks `isAuthenticated` → already true → redirects to dashboard
- Dashboard checks organization → mismatch → redirects to login
- Loop continues

### Issue 3: Hardcoded Apps List
**Symptom**: Organizations page shows hardcoded apps (salon, jewelry, crm, isp, civicflow)

**Root Cause**:
- `AVAILABLE_APPS` constant doesn't match actual introspection data
- Should use `organizations[].apps[]` from `/api/v2/organizations`

## Solution

### Step 1: Fix `/auth/organizations` Page

**Current Flow** (WRONG):
```
User clicks org →
  Set localStorage →
  Redirect to /salon/auth (login page) →
  Login page sees isAuthenticated →
  Redirects to dashboard with wrong org
```

**New Flow** (CORRECT):
```
User clicks org →
  Update HERAAuthProvider context →
  Redirect directly to app dashboard →
  Dashboard loads with correct org
```

**Changes Required**:

1. Import `useHERAAuth` hook
2. Get organizations from auth context (already has apps data)
3. When user clicks organization:
   - Call a new `switchOrganization()` method on auth provider
   - This updates context with new organization
   - Redirects to app dashboard directly

### Step 2: Add `switchOrganization` to HERAAuthProvider

**New method to add**:

```typescript
const switchOrganization = (orgId: string) => {
  const newOrg = ctx.organizations.find(o => o.id === orgId)
  if (!newOrg) {
    console.error('Organization not found:', orgId)
    return
  }

  console.log('🔄 Switching to organization:', newOrg.name)

  // Update context with new organization
  setCtx(prev => ({
    ...prev,
    organization: {
      id: newOrg.id,
      entity_id: newOrg.id,
      name: newOrg.name,
      type: newOrg.type || 'general',
      industry: newOrg.industry || 'general'
    },
    organizationId: newOrg.id,
    availableApps: newOrg.apps || [],
    defaultApp: newOrg.settings?.default_app_code || (newOrg.apps?.[0]?.code) || null,
    currentApp: null
  }))

  // Update localStorage for compatibility
  localStorage.setItem('organizationId', newOrg.id)
  localStorage.setItem('safeOrganizationId', newOrg.id)
}
```

### Step 3: Update `/auth/organizations` Page Logic

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function OrganizationsPage() {
  const router = useRouter()
  const { organizations, switchOrganization } = useHERAAuth()

  // Remove separate API call - use data from auth provider
  // Remove hardcoded AVAILABLE_APPS

  const handleSelectOrganization = (org: Organization) => {
    // Update auth context
    switchOrganization(org.id)

    // Redirect to app
    if (org.apps && org.apps.length > 0) {
      const appCode = org.apps[0].code.toLowerCase()
      router.push(`/${appCode}/dashboard`)
    } else {
      // No apps available
      alert('This organization has no apps installed')
    }
  }
}
```

### Step 4: Remove Redundant `/salon/auth` Redirect

**Current**:
- `/auth/organizations` → `/salon/auth` → `/salon/dashboard`

**New**:
- `/auth/organizations` → `/salon/dashboard` (direct)

### Step 5: Update Login Flow

**Ensure login redirect logic doesn't cause loops**:

```typescript
// In /auth/login/page.tsx
useEffect(() => {
  if (isAuthenticated && organizations !== null) {
    // Priority 1-3: Same as before

    // Priority 4: Multiple orgs → Show selector
    if (organizations.length > 1) {
      router.push('/auth/organizations')
      return
    }

    // Priority 5: Single org → Go to app
    if (organizations.length === 1 && availableApps?.length === 1) {
      router.push(`/${availableApps[0].code.toLowerCase()}/dashboard`)
      return
    }

    // Fallback
    router.push('/auth/organizations')
  }
}, [isAuthenticated, organizations, availableApps])
```

## Implementation Checklist

- [ ] Add `switchOrganization` method to HERAAuthProvider
- [ ] Update `/auth/organizations` to use auth context
- [ ] Remove hardcoded AVAILABLE_APPS list
- [ ] Change redirect from `/salon/auth` to `/salon/dashboard`
- [ ] Test organization switching
- [ ] Test with 3 organizations (Salon, Cashew, ERP)
- [ ] Verify no redirect loops
- [ ] Test localStorage compatibility

## Testing Plan

### Test 1: Select HERA Salon Demo
1. Login as demo@heraerp.com
2. See organization selector with 3 orgs
3. Click "HERA Salon Demo"
4. Should load `/salon/dashboard` with "HERA Salon Demo" org
5. Verify top bar shows correct org name
6. Verify available apps shows only [SALON]

### Test 2: Select HERA Cashew Demo
1. From HERA Salon Demo, click org switcher
2. Select "HERA Cashew Demo"
3. Should load `/cashew/dashboard` with "HERA Cashew Demo" org
4. Verify top bar shows correct org name
5. Verify available apps shows only [CASHEW]

### Test 3: Select HERA ERP Demo (No Apps)
1. From any org, click org switcher
2. Select "HERA ERP Demo"
3. Should show message "No apps available for this organization"
4. Should not redirect or cause errors

### Test 4: No Redirect Loops
1. Login → organization selector → select org → dashboard
2. Should NOT redirect back to login
3. Should NOT redirect back to organization selector
4. Should stay on dashboard

## Expected Behavior After Fix

```
┌─────────────────────────────────────────────────────────────┐
│  Login Flow                                                  │
└─────────────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  HERAAuthProvider: 3 organizations loaded                    │
│  - HERA Cashew Demo [CASHEW]                                │
│  - HERA Salon Demo [SALON]                                  │
│  - HERA ERP Demo [No Apps]                                  │
└─────────────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  /auth/organizations (Selector)                             │
│  Shows 3 cards with actual app info                         │
└─────────────────────────────────────────────────────────────┘
       │
       ↓ User clicks "HERA Salon Demo"
       │
┌─────────────────────────────────────────────────────────────┐
│  switchOrganization("salon-demo-id")                        │
│  Updates context:                                            │
│  - organization: HERA Salon Demo                            │
│  - availableApps: [SALON]                                   │
│  - defaultApp: "SALON"                                      │
└─────────────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  /salon/dashboard                                            │
│  Loads with correct organization context                     │
│  - Top bar: "HERA Salon Demo"                               │
│  - Apps: [SALON]                                             │
│  - No redirect, no loop                                      │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify

1. `/src/components/auth/HERAAuthProvider.tsx` - Add `switchOrganization` method
2. `/src/app/auth/organizations/page.tsx` - Use auth context, remove hardcoded apps
3. `/src/app/auth/login/page.tsx` - Verify redirect logic doesn't cause loops

## Risks & Mitigation

**Risk 1**: Breaking existing localStorage-based code
**Mitigation**: Keep localStorage updates in switchOrganization for backward compatibility

**Risk 2**: Dashboard checks organization and redirects
**Mitigation**: Ensure dashboard reads from auth context, not localStorage

**Risk 3**: Middleware intercepts and redirects
**Mitigation**: Review middleware to ensure it doesn't interfere with authenticated routes
