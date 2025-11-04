# HERA Enterprise Role-Based Routing System

## Overview

The HERA Enterprise Role-Based Routing System provides centralized, loop-free role management across all applications and organizations. This system ensures users always land on the correct dashboard based on their role in each organization.

## Architecture

### Core Components

1. **Role Router** (`/src/lib/auth/role-router.ts`)
   - Pure functions for role-based routing decisions
   - No side effects - caller handles actual routing
   - Loop detection and prevention
   - Configurable role-to-dashboard mappings

2. **Role Redirect Hook** (`/src/hooks/useRoleBasedRedirect.ts`)
   - React hook for automatic role-based redirects
   - Progressive loading with smooth UX
   - Debug mode for troubleshooting
   - Can be enabled/disabled per component

3. **Enhanced Auth Provider** (`/src/components/auth/HERAAuthProvider.tsx`)
   - Async organization switching with role resolution
   - Role persistence in localStorage
   - Fresh role fetching on organization switch
   - Automatic role synchronization

## Key Features

### ✅ Loop Prevention

The system prevents redirect loops through multiple mechanisms:

1. **Previous Path Tracking**: Compares target with previous path
2. **Circular Detection**: Prevents redirecting to current path
3. **Single Redirect Flag**: Prevents duplicate redirects
4. **Timeout-Based Reset**: Clears redirect flags after navigation

### ✅ Role Persistence

Roles are persisted across sessions and organization switches:

```typescript
// Stored in localStorage
localStorage.setItem('salonRole', role)
localStorage.setItem('organizationId', orgId)
```

### ✅ Fresh Role Resolution

When switching organizations, roles are fetched fresh from the API:

```typescript
await switchOrganization(newOrgId)
// Internally calls /api/v2/auth/resolve-membership with new org context
// Updates role in context and localStorage
```

### ✅ Centralized Configuration

Role-to-dashboard mappings are centralized and configurable:

```typescript
const ROLE_DASHBOARD_MAP = {
  SALON: {
    owner: '/salon/dashboard',
    manager: '/salon/dashboard',
    admin: '/salon/admin/dashboard',
    receptionist: '/salon/receptionist',
    staff: '/salon/dashboard'
  },
  CASHEW: {
    owner: '/cashew/dashboard',
    manager: '/cashew/dashboard',
    admin: '/cashew/admin/dashboard'
  }
}
```

## Usage Patterns

### Pattern 1: Automatic Redirect Hook

Use in dashboard pages for automatic role-based redirects:

```tsx
'use client'

import { useRoleBasedRedirect, RoleBasedRedirectLoader } from '@/hooks/useRoleBasedRedirect'

export default function Dashboard() {
  const { isRedirecting, redirectReason } = useRoleBasedRedirect({
    app: 'SALON', // Optional - auto-detects from URL
    enabled: true,
    debug: process.env.NODE_ENV === 'development'
  })

  if (isRedirecting) {
    return <RoleBasedRedirectLoader reason={redirectReason} />
  }

  return <YourDashboardComponent />
}
```

### Pattern 2: Manual Role Check

Use for custom routing logic:

```tsx
import { getRoleDashboardPath, evaluateRoleRoute } from '@/lib/auth/role-router'

// Get expected path for user's role
const expectedPath = getRoleDashboardPath('SALON', 'receptionist')
// Returns: '/salon/receptionist'

// Evaluate if redirect is needed
const decision = evaluateRoleRoute({
  app: 'SALON',
  role: 'receptionist',
  organizationId: orgId
}, currentPath)

if (decision.shouldRedirect) {
  router.push(decision.targetPath)
}
```

### Pattern 3: Organization Switching

Use when user switches organizations:

```tsx
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

const { switchOrganization } = useHERAAuth()

const handleOrgSwitch = async (orgId: string) => {
  // ✅ This fetches role for new org and updates context
  await switchOrganization(orgId)

  // ✅ Redirect to appropriate app dashboard
  router.push('/app/dashboard')
}
```

## Role Resolution Priority

The system uses a priority chain to resolve roles:

1. **Fresh API Response** (during organization switch)
   - Highest priority - always up-to-date
   - Fetched from `/api/v2/auth/resolve-membership`
   - Includes organization-specific role

2. **Auth Context** (current session)
   - Second priority - in-memory state
   - Updated on login and organization switch

3. **LocalStorage** (persistence)
   - Third priority - survives page reloads
   - Keys: `salonRole`, `organizationId`

4. **Fallback** (default)
   - Lowest priority - safety net
   - Default: `'user'` role

## Debugging

### Enable Debug Mode

```tsx
const { isRedirecting, redirectReason } = useRoleBasedRedirect({
  debug: true // Logs all routing decisions
})
```

### Console Logs

The system provides detailed console logs:

```
✅ Safe redirect determined: { role: 'receptionist', app: 'SALON', from: '/salon/dashboard', to: '/salon/receptionist', reason: '...' }
🚨 Redirect loop detected: { current: '/salon/dashboard', target: '/salon/dashboard', previous: '/salon/receptionist' }
🔄 Role-based redirect: { role: 'manager', app: 'SALON', from: '/salon/receptionist', to: '/salon/dashboard', organization: 'HERA Salon Demo' }
```

### Common Issues

**Issue**: Redirect loop between dashboards
**Solution**: Check role assignment in database - user may have wrong role for organization

**Issue**: Role not updating when switching organizations
**Solution**: Ensure `switchOrganization` is awaited - it's async now

**Issue**: User lands on wrong dashboard after login
**Solution**: Check `/api/v2/auth/resolve-membership` response - role may be incorrect

## Testing Checklist

### Scenario 1: Same User, Different Roles in Different Orgs

```
User: demo@heraerp.com
Org A (Salon Demo): Role = owner → Lands on /salon/dashboard
Org B (Cashew Demo): Role = receptionist → Lands on /cashew/receptionist

Test:
1. Login as demo@heraerp.com
2. Select Org A → Verify lands on /salon/dashboard
3. Switch to Org B → Verify lands on /cashew/receptionist (not /cashew/dashboard)
4. Switch back to Org A → Verify lands on /salon/dashboard again
```

### Scenario 2: Receptionist Tries to Access Manager Dashboard

```
User: receptionist@salon.com
Role: receptionist
Expected: Always redirect to /salon/receptionist

Test:
1. Login as receptionist
2. Manually navigate to /salon/dashboard
3. Verify automatic redirect to /salon/receptionist
4. Check console for redirect reason
```

### Scenario 3: No Redirect Loop

```
User: manager@salon.com
Role: manager
Current: /salon/appointments (non-dashboard page)

Test:
1. Login as manager
2. Navigate to /salon/appointments
3. Verify NO redirect (allow non-dashboard pages)
4. Navigate to /salon/dashboard
5. Verify NO redirect (already on correct dashboard)
```

## API Integration

### Membership Resolution Endpoint

```typescript
GET /api/v2/auth/resolve-membership
Headers:
  Authorization: Bearer <jwt_token>
  X-Organization-Id: <org_uuid>

Response:
{
  "success": true,
  "membership": {
    "organization_id": "uuid",
    "organization_name": "HERA Salon Demo",
    "roles": ["ORG_OWNER"],
    "org_entity_id": "uuid"
  },
  "role": "owner",
  "user_entity_id": "uuid",
  "organizations": [...]
}
```

### Role Extraction

```typescript
import { extractRoleFromResponse } from '@/lib/auth/role-router'

const role = extractRoleFromResponse(apiResponse)
// Normalizes: "ORG_OWNER" → "owner"
// Normalizes: "ORG_RECEPTIONIST" → "receptionist"
```

## Migration Guide

### Existing Dashboard Pages

Add the role redirect hook to existing dashboards:

```tsx
// Before
export default function Dashboard() {
  return <DashboardContent />
}

// After
import { useRoleBasedRedirect, RoleBasedRedirectLoader } from '@/hooks/useRoleBasedRedirect'

export default function Dashboard() {
  const { isRedirecting, redirectReason } = useRoleBasedRedirect()

  if (isRedirecting) {
    return <RoleBasedRedirectLoader reason={redirectReason} />
  }

  return <DashboardContent />
}
```

### Organization Switching

Update organization switch handlers to use async:

```tsx
// Before
const handleSwitch = (orgId) => {
  switchOrganization(orgId)
  router.push('/app/dashboard')
}

// After
const handleSwitch = async (orgId) => {
  await switchOrganization(orgId) // ✅ Wait for role resolution
  router.push('/app/dashboard')
}
```

## Performance Considerations

### Optimization 1: Memoization

Role routing functions are pure and can be memoized:

```tsx
const expectedPath = useMemo(
  () => getRoleDashboardPath(app, role),
  [app, role]
)
```

### Optimization 2: Conditional Hooks

Only run redirect logic when needed:

```tsx
const { isRedirecting } = useRoleBasedRedirect({
  enabled: isAuthenticated && !isLoading
})
```

### Optimization 3: Debounced Checks

Role checks are debounced to prevent excessive redirects:

```tsx
// Internal to useRoleBasedRedirect
setTimeout(() => router.push(path), 100) // 100ms debounce
```

## Security Considerations

### 🛡️ Defense in Depth

1. **Client-Side**: Role-based UI rendering
2. **Edge**: API v2 gateway validates membership
3. **Database**: RLS enforces organization isolation
4. **Audit**: All role changes logged

### 🛡️ Role Tampering Prevention

Roles in localStorage are validated against API on every organization switch:

```typescript
// User cannot tamper with role - always fetched fresh
await switchOrganization(orgId)
// Internally calls API to get authoritative role
```

### 🛡️ Session Hijacking Protection

Role resolution requires valid JWT:

```typescript
headers: {
  Authorization: `Bearer ${session.access_token}`,
  'X-Organization-Id': orgId
}
```

## Future Enhancements

### Phase 2: Advanced Features

- [ ] Role-based feature flags
- [ ] Permission-based routing (fine-grained)
- [ ] Role hierarchy (manager → staff → user)
- [ ] Temporary role elevation (sudo mode)
- [ ] Role change notifications
- [ ] Role audit trail UI

### Phase 3: Performance

- [ ] Role caching with TTL
- [ ] Predictive role pre-fetching
- [ ] Optimistic role updates
- [ ] Role resolution worker threads

## Support

For issues or questions:
- Check console logs with debug mode enabled
- Verify `/api/v2/auth/resolve-membership` response
- Review `ROLE_DASHBOARD_MAP` configuration
- Test with known user/role combinations

## License

Internal HERA Enterprise System - All Rights Reserved
