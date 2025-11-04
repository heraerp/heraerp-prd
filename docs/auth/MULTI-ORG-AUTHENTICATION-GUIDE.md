# HERA Multi-Organization Authentication - Developer Guide

## Overview

HERA implements a sophisticated multi-organization, multi-app authentication system where a single user can belong to multiple organizations, and each organization can have multiple apps installed.

**Key Principle**: Single RPC call (`hera_auth_introspect_v1`) as the source of truth for all authentication context.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Model](#data-model)
3. [Authentication Flow](#authentication-flow)
4. [Organization & App Relationships](#organization--app-relationships)
5. [Code Implementation](#code-implementation)
6. [API Reference](#api-reference)
7. [Common Scenarios](#common-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Signs In                            │
│  Email: demo@heraerp.com / Password: demo2025!              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Authentication                                     │
│  → JWT Token Generated                                       │
│  → Auth UID: a55cc033-e909-4c59-b974-8ff3e098f2bf          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  HERAAuthProvider (Client)                                   │
│  → Calls /api/v2/auth/resolve-membership                    │
│  → Sends: Authorization: Bearer <jwt>                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/v2/auth/resolve-membership (API)                      │
│  Step 1: Map auth UID → USER entity ID                     │
│  Step 2: Call hera_auth_introspect_v1(user_entity_id)     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  hera_auth_introspect_v1 (Database RPC)                     │
│  ✅ Returns ALL organizations user is member of            │
│  ✅ Returns ALL apps per organization                       │
│  ✅ Returns roles, permissions, flags                       │
│  ✅ Returns default organization & app                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  HERAAuthProvider State Updated                              │
│  → organizations: [All 3 orgs]                              │
│  → organization: Current org (default)                      │
│  → availableApps: Apps for current org                     │
│  → User redirected to appropriate page                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    PLATFORM Organization                      │
│              (00000000-0000-0000-0000-000000000000)          │
│                                                               │
│  ┌─────────────┐                  ┌─────────────┐           │
│  │ USER Entity │                  │ APP Entity  │           │
│  ├─────────────┤                  ├─────────────┤           │
│  │ id: auth UID│                  │ code: SALON │           │
│  │ type: USER  │                  │ code: CASHEW│           │
│  │ metadata:   │                  │ code: CRM   │           │
│  │   supabase_ │                  │ type: APP   │           │
│  │   user_id   │                  └─────────────┘           │
│  └─────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
         │                                    ▲
         │ MEMBER_OF                          │
         │ (from_entity_id)                   │
         ↓                                    │ ORG_HAS_APP
┌──────────────────────────────────────────────────────────────┐
│                   Tenant Organizations                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ HERA Cashew Demo (DEMO-CASHEW)                      │    │
│  │ id: 699453c2-950e-4456-9fc0-c0c71efa78fb            │────┤
│  │ └─ APP: CASHEW                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ HERA Salon Demo (DEMO-SALON)                        │    │
│  │ id: de5f248d-7747-44f3-9d11-a279f3158fa5            │────┤
│  │ └─ APP: SALON                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ HERA ERP Demo (DEMO-ERP)                            │    │
│  │ id: c58cdbcd-73f9-4cef-8c27-caf9f4436d05            │    │
│  │ └─ APP: (None)                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Database Tables & Relationships

#### 1. `auth.users` (Supabase Auth)
```sql
-- Supabase authentication table
id           : uuid (e.g., a55cc033-e909-4c59-b974-8ff3e098f2bf)
email        : text (e.g., demo@heraerp.com)
encrypted_password : text
created_at   : timestamptz
```

#### 2. `core_entities` (HERA Sacred Six)
```sql
-- USER entities (in PLATFORM org)
id                 : uuid (= auth.users.id for new users)
organization_id    : uuid (= '00000000-0000-0000-0000-000000000000')
entity_type        : text (= 'USER')
entity_name        : text (user display name)
metadata           : jsonb { supabase_user_id: auth.users.id }

-- APP entities (in PLATFORM org)
id                 : uuid
organization_id    : uuid (= '00000000-0000-0000-0000-000000000000')
entity_type        : text (= 'APP')
entity_code        : text (e.g., 'SALON', 'CASHEW', 'CRM')
entity_name        : text (e.g., 'HERA Salon Management')
```

#### 3. `core_organizations` (HERA Sacred Six)
```sql
-- Tenant organizations
id                      : uuid
organization_name       : text
organization_code       : text (e.g., 'DEMO-SALON')
parent_organization_id  : uuid (optional, for hierarchy)
settings                : jsonb { default_app_code: 'SALON' }
status                  : text (e.g., 'active')
```

#### 4. `core_relationships` (HERA Sacred Six)
```sql
-- User membership in organizations
relationship_type  : text (= 'MEMBER_OF')
from_entity_id     : uuid (USER entity id)
to_entity_id       : uuid (ORG entity id)
organization_id    : uuid (tenant organization id)
is_active          : boolean

-- Organization has apps
relationship_type  : text (= 'ORG_HAS_APP')
from_entity_id     : uuid (ORG entity id)
to_entity_id       : uuid (APP entity id in PLATFORM)
organization_id    : uuid (tenant organization id)
relationship_data  : jsonb { installed_at, subscription, config }
is_active          : boolean

-- User has roles
relationship_type  : text (= 'HAS_ROLE')
from_entity_id     : uuid (USER entity id)
to_entity_id       : uuid (ROLE entity id)
organization_id    : uuid (tenant organization id)
relationship_data  : jsonb { role_code: 'ORG_OWNER', is_primary: true }
is_active          : boolean
```

---

## Authentication Flow

### Step-by-Step Login Process

#### Step 1: User Submits Credentials

**Location**: `/src/app/auth/login/page.tsx`

```typescript
const handleLogin = async () => {
  await login('demo@heraerp.com', 'demo2025!')
}
```

#### Step 2: Supabase Authentication

**Location**: `/src/components/auth/HERAAuthProvider.tsx` (line 371-393)

```typescript
const login = async (email: string, password: string) => {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  // ✅ Returns JWT token with auth UID
  // Auth state change handler will trigger next steps
}
```

**Result**: JWT token generated with `user.id = a55cc033-e909-4c59-b974-8ff3e098f2bf`

#### Step 3: Auth State Change Handler

**Location**: `/src/components/auth/HERAAuthProvider.tsx` (line 146-336)

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    const { user } = session

    // Fetch membership data from API v2
    const response = await fetch('/api/v2/auth/resolve-membership', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    const res = await response.json()

    // Parse response and update context
    // (See Step 4 for details)
  }
})
```

#### Step 4: Resolve Membership API

**Location**: `/src/app/api/v2/auth/resolve-membership/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // 1️⃣ Extract JWT from Authorization header
  const token = authHeader.substring(7)

  // 2️⃣ Verify token with Supabase
  const { data: { user } } = await supabase.auth.getUser(token)
  const authUserId = user.id // a55cc033-e909-4c59-b974-8ff3e098f2bf

  // 3️⃣ Map auth UID → USER entity ID (ONLY direct query)
  const { data: userEntities } = await supabaseService
    .from('core_entities')
    .select('id, entity_name')
    .eq('entity_type', 'USER')
    .contains('metadata', { supabase_user_id: authUserId })

  const userEntityId = userEntities?.[0]?.id || authUserId

  // 4️⃣ Call introspection RPC (SINGLE SOURCE OF TRUTH)
  const { data: authContext } = await supabaseService.rpc(
    'hera_auth_introspect_v1',
    { p_actor_user_id: userEntityId }
  )

  // 5️⃣ Return transformed response
  return NextResponse.json({
    success: true,
    user_id: authUserId,
    user_entity_id: userEntityId,
    organization_count: authContext.organization_count,
    default_organization_id: authContext.default_organization_id,
    default_app: authContext.default_app,
    organizations: authContext.organizations // ALL orgs with apps
  })
}
```

#### Step 5: Introspection RPC Execution

**Location**: `/db/rpc/hera_auth_introspect_v1_FINAL.sql`

**What it does**:
1. Finds all MEMBER_OF relationships for user
2. Joins with core_organizations to get org details
3. Finds all HAS_ROLE relationships per organization
4. Finds all ORG_HAS_APP relationships per organization
5. Joins with APP entities in PLATFORM org
6. Aggregates everything into single JSON response

**SQL Logic** (simplified):

```sql
CREATE FUNCTION hera_auth_introspect_v1(p_actor_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH memberships AS (
    -- Get all organizations user is member of
    SELECT organization_id
    FROM core_relationships
    WHERE relationship_type = 'MEMBER_OF'
      AND from_entity_id = p_actor_user_id
      AND is_active = true
  ),
  apps_per_org AS (
    -- Get apps installed in each organization
    SELECT
      r.organization_id,
      jsonb_agg(
        jsonb_build_object(
          'code', e.entity_code,
          'name', e.entity_name,
          'installed_at', r.relationship_data->>'installed_at'
        )
      ) AS apps_json
    FROM core_relationships r
    JOIN core_entities e ON e.id = r.to_entity_id
    WHERE r.relationship_type = 'ORG_HAS_APP'
      AND r.organization_id IN (SELECT organization_id FROM memberships)
      AND e.entity_type = 'APP'
    GROUP BY r.organization_id
  )
  -- Build complete JSON response
  SELECT jsonb_build_object(
    'organization_count', (SELECT COUNT(*) FROM memberships),
    'default_organization_id', (SELECT organization_id FROM memberships LIMIT 1),
    'organizations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'name', o.organization_name,
          'code', o.organization_code,
          'apps', COALESCE(a.apps_json, '[]'::jsonb)
        )
      )
      FROM memberships m
      JOIN core_organizations o ON o.id = m.organization_id
      LEFT JOIN apps_per_org a ON a.organization_id = m.organization_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

#### Step 6: Response Format

**Example Response** for demo@heraerp.com:

```json
{
  "success": true,
  "user_id": "a55cc033-e909-4c59-b974-8ff3e098f2bf",
  "user_entity_id": "4d93b3f8-dfe8-430c-83ea-3128f6a520cf",
  "organization_count": 3,
  "default_organization_id": "699453c2-950e-4456-9fc0-c0c71efa78fb",
  "default_app": "CASHEW",
  "organizations": [
    {
      "id": "699453c2-950e-4456-9fc0-c0c71efa78fb",
      "name": "HERA Cashew Demo",
      "code": "DEMO-CASHEW",
      "status": "active",
      "joined_at": "2025-11-03T10:00:00Z",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER"],
      "apps": [
        {
          "code": "CASHEW",
          "name": "HERA Cashew Finance",
          "installed_at": "2025-11-03T10:00:00Z",
          "subscription": {},
          "config": {}
        }
      ],
      "is_owner": true,
      "is_admin": true
    },
    {
      "id": "de5f248d-7747-44f3-9d11-a279f3158fa5",
      "name": "HERA Salon Demo",
      "code": "DEMO-SALON",
      "status": "active",
      "joined_at": "2025-11-03T10:00:00Z",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER"],
      "apps": [
        {
          "code": "SALON",
          "name": "HERA Salon Management",
          "installed_at": "2025-11-03T10:00:00Z",
          "subscription": {},
          "config": {}
        }
      ],
      "is_owner": true,
      "is_admin": true
    },
    {
      "id": "c58cdbcd-73f9-4cef-8c27-caf9f4436d05",
      "name": "HERA ERP Demo",
      "code": "DEMO-ERP",
      "status": "active",
      "joined_at": "2025-11-03T10:00:00Z",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER"],
      "apps": [],
      "is_owner": true,
      "is_admin": true
    }
  ]
}
```

#### Step 7: Auth Context State Update

**Location**: `/src/components/auth/HERAAuthProvider.tsx` (line 262-334)

```typescript
// Parse ALL organizations from API response
const allOrganizations: HERAOrganization[] = []

if (res.organizations && res.organizations.length > 0) {
  res.organizations.forEach((orgData: any) => {
    // Store organization
    allOrganizations.push({
      id: orgData.id,
      entity_id: orgData.entity_id || orgData.id,
      name: orgData.name,
      type: orgData.type || 'general',
      industry: orgData.industry || 'general'
    })

    // Extract apps ONLY for current/default organization
    if (orgData.id === normalizedOrgId) {
      orgData.apps.forEach((app: any) => {
        availableApps.push({
          code: app.code,
          name: app.name,
          config: app.config || {}
        })
      })
    }
  })
}

// Update context state
setCtx({
  status: 'authenticated',
  user: heraUser,
  organization: heraOrg,              // Current/default organization
  organizations: allOrganizations,    // ALL organizations
  isAuthenticated: true,
  isLoading: false,
  availableApps,                      // Apps for current org only
  defaultApp,
  currentApp
})
```

#### Step 8: Routing Decision

**Location**: `/src/app/auth/login/page.tsx` (line 54-124)

```typescript
useEffect(() => {
  if (isAuthenticated && organizations !== null) {
    // Priority 1: Saved redirect URL
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    if (redirectUrl) {
      router.push(redirectUrl)
      return
    }

    // Priority 2: Query parameter return_to
    if (returnTo) {
      router.push(returnTo)
      return
    }

    // Priority 3: No organizations → create one
    if (organizations.length === 0) {
      router.push('/auth/organizations/new')
      return
    }

    // Priority 4: Multiple orgs or apps → show selector
    if (organizations.length > 1 || (availableApps && availableApps.length > 1)) {
      console.log('📋 Multiple organizations or apps, showing selector')
      router.push('/auth/organizations')
      return
    }

    // Priority 5: Single org + single app → go directly
    if (organizations.length === 1 && availableApps && availableApps.length === 1) {
      const appCode = availableApps[0].code.toLowerCase()
      router.push(`/${appCode}/dashboard`)
      return
    }

    // Fallback: Show apps page
    router.push('/apps')
  }
}, [isAuthenticated, organizations, returnTo, availableApps])
```

**For demo user**: 3 organizations → Redirects to `/auth/organizations`

---

## Organization & App Relationships

### Relationship Hierarchy

```
USER
 │
 ├─ MEMBER_OF ──→ Organization A
 │                 │
 │                 ├─ ORG_HAS_APP ──→ APP: SALON
 │                 └─ ORG_HAS_APP ──→ APP: POS
 │
 ├─ MEMBER_OF ──→ Organization B
 │                 │
 │                 └─ ORG_HAS_APP ──→ APP: CASHEW
 │
 └─ MEMBER_OF ──→ Organization C
                   └─ (No apps)
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Auth Context State                                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ organizations: [                                      │   │
│  │   { id: "org-a", name: "Org A",                      │   │
│  │     apps: [{ code: "SALON" }, { code: "POS" }] },   │   │
│  │   { id: "org-b", name: "Org B",                      │   │
│  │     apps: [{ code: "CASHEW" }] },                    │   │
│  │   { id: "org-c", name: "Org C", apps: [] }          │   │
│  │ ]                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ organization: {                                       │   │
│  │   id: "org-a",        ← CURRENT organization        │   │
│  │   name: "Org A"                                       │   │
│  │ }                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ availableApps: [      ← Apps for CURRENT org only   │   │
│  │   { code: "SALON", name: "HERA Salon Management" }, │   │
│  │   { code: "POS", name: "HERA Point of Sale" }       │   │
│  │ ]                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### UI Component Mapping

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Organization Dropdown (uses: organizations array)   │   │
│  │ ✓ Org A [SALON, POS]    ← Current                  │   │
│  │   Org B [CASHEW]                                     │   │
│  │   Org C [No Apps]                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  App Launcher (uses: availableApps for current org)         │
│  ┌─────────┐  ┌─────────┐                                  │
│  │ SALON   │  │  POS    │                                  │
│  └─────────┘  └─────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Implementation

### HERAAuthProvider Context Structure

**File**: `/src/components/auth/HERAAuthProvider.tsx`

```typescript
interface HERAAuthContext {
  // User identity
  user: HERAUser | null
  userEntityId?: string
  isAuthenticated: boolean
  isLoading: boolean
  status: HeraStatus

  // Organization context
  organization: HERAOrganization | null        // Current org
  organizationId?: string
  organizations: HERAOrganization[]            // ALL orgs
  currentOrganization: HERAOrganization | null // Alias

  // Apps
  availableApps: HERAApp[]    // Apps for current org only
  defaultApp: string | null   // Default app for current org
  currentApp: string | null   // Currently active app (from URL)

  // Authorization
  scopes: string[]
  role?: 'owner' | 'manager' | 'staff'
  hasScope: (scope: string) => boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>

  // App helpers
  hasApp: (appCode: string) => boolean
  getAppConfig: (appCode: string) => Record<string, any> | null
}
```

### Using the Auth Context

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function MyComponent() {
  const {
    user,
    organization,        // Current organization
    organizations,       // ALL organizations
    availableApps,       // Apps for current org
    isAuthenticated,
    isLoading
  } = useHERAAuth()

  // Example: Show organization switcher
  return (
    <select
      value={organization?.id}
      onChange={(e) => switchOrganization(e.target.value)}
    >
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.apps?.length || 0} apps)
        </option>
      ))}
    </select>
  )
}
```

### Switching Organizations

When a user switches organizations, you need to:

1. Update the current organization in context
2. Update availableApps to match new organization
3. Redirect to appropriate app

```typescript
async function switchOrganization(orgId: string) {
  const newOrg = organizations.find(o => o.id === orgId)
  if (!newOrg) return

  // Update context
  setCtx(prev => ({
    ...prev,
    organization: newOrg,
    organizationId: newOrg.id,
    availableApps: newOrg.apps || [],
    defaultApp: newOrg.settings?.default_app_code || null,
    currentApp: null
  }))

  // Redirect to app
  if (newOrg.apps && newOrg.apps.length === 1) {
    router.push(`/${newOrg.apps[0].code.toLowerCase()}/dashboard`)
  } else if (newOrg.apps && newOrg.apps.length > 1) {
    router.push('/apps') // Show app selector
  } else {
    router.push('/auth/organizations') // No apps available
  }
}
```

---

## API Reference

### `/api/v2/auth/resolve-membership`

**Method**: GET

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "user_id": "auth-uid",
  "user_entity_id": "user-entity-id",
  "organization_count": 3,
  "default_organization_id": "org-uuid",
  "default_app": "CASHEW",
  "organizations": [
    {
      "id": "org-uuid",
      "name": "Organization Name",
      "code": "ORG-CODE",
      "status": "active",
      "joined_at": "2025-11-03T10:00:00Z",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER"],
      "apps": [
        {
          "code": "SALON",
          "name": "HERA Salon Management",
          "installed_at": "2025-11-03T10:00:00Z",
          "subscription": {},
          "config": {}
        }
      ],
      "is_owner": true,
      "is_admin": true
    }
  ],
  "membership": {
    "organization_id": "org-uuid",
    "role": "ORG_OWNER",
    "organization_name": "Organization Name"
  }
}
```

### `/api/v2/organizations`

**Method**: GET

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `limit`: Number of organizations to return (default: 50)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (default: 'active')

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "org-uuid",
      "organization_name": "Organization Name",
      "organization_code": "ORG-CODE",
      "organization_type": "business_unit",
      "status": "active",
      "user_role": "ORG_OWNER",
      "joined_at": "2025-11-03T10:00:00Z",
      "apps": [
        { "code": "SALON", "name": "HERA Salon Management" }
      ],
      "is_owner": true,
      "is_admin": true
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0
  }
}
```

### `hera_auth_introspect_v1` RPC

**File**: `/db/rpc/hera_auth_introspect_v1_FINAL.sql`

**Parameters**:
- `p_actor_user_id`: USER entity ID (uuid)

**Returns**: JSONB with structure:
```json
{
  "user_id": "user-entity-id",
  "introspected_at": "2025-11-03T10:00:00Z",
  "is_platform_admin": false,
  "organization_count": 3,
  "default_organization_id": "org-uuid",
  "default_app": "SALON",
  "organizations": [...]
}
```

**Usage**:
```sql
SELECT hera_auth_introspect_v1('user-entity-id'::uuid);
```

---

## Common Scenarios

### Scenario 1: New User First Login

1. User signs up → Supabase creates auth record
2. No USER entity exists yet → Need onboarding
3. Call `hera_onboard_user_v1` to create:
   - PLATFORM USER entity
   - First organization
   - MEMBER_OF relationship
   - HAS_ROLE relationship (OWNER)
4. User can now login normally

### Scenario 2: User with Multiple Organizations

1. User logs in → introspection returns 3 organizations
2. Login page sees `organizations.length > 1`
3. Redirects to `/auth/organizations` selector
4. User selects organization
5. Context updates with selected org
6. If org has 1 app → redirect to app
7. If org has multiple apps → show app launcher

### Scenario 3: Organization with Multiple Apps

1. User in "HERA Enterprise" organization
2. Organization has apps: [CRM, FINANCE, HR, INVENTORY]
3. `availableApps` array populated with 4 apps
4. App launcher shows all 4 apps as tiles
5. User clicks "CRM" → navigates to `/crm/dashboard`
6. `currentApp` updates to "CRM"

### Scenario 4: Switching Between Organizations

```typescript
// Current state
organization: "HERA Salon Demo"
availableApps: [{ code: "SALON" }]
currentApp: "SALON"
URL: /salon/dashboard

// User switches to "HERA Cashew Demo"
organization: "HERA Cashew Demo"
availableApps: [{ code: "CASHEW" }]
currentApp: "CASHEW"
URL: /cashew/dashboard
```

### Scenario 5: Adding New App to Organization

1. Admin installs "POS" app in "HERA Salon Demo"
2. Creates ORG_HAS_APP relationship:
   ```sql
   INSERT INTO core_relationships (
     relationship_type, from_entity_id, to_entity_id,
     organization_id, is_active
   ) VALUES (
     'ORG_HAS_APP',
     'salon-org-id',
     'pos-app-id',
     'salon-org-id',
     true
   )
   ```
3. User refreshes → introspection returns updated apps
4. `availableApps` now shows: [SALON, POS]
5. User can switch between apps

---

## Troubleshooting

### Issue: User Can't See Any Organizations

**Symptoms**: Empty organizations array after login

**Causes**:
1. No MEMBER_OF relationships exist
2. USER entity not found
3. MEMBER_OF relationships are `is_active = false`

**Debug Steps**:
```sql
-- 1. Check if USER entity exists
SELECT * FROM core_entities
WHERE entity_type = 'USER'
  AND metadata->>'supabase_user_id' = 'auth-uid';

-- 2. Check MEMBER_OF relationships
SELECT * FROM core_relationships
WHERE from_entity_id = 'user-entity-id'
  AND relationship_type = 'MEMBER_OF';

-- 3. Test introspection directly
SELECT hera_auth_introspect_v1('user-entity-id'::uuid);
```

**Fix**: Onboard user to organization using `hera_onboard_user_v1`

### Issue: Apps Not Showing for Organization

**Symptoms**: Organization shows but `apps: []`

**Causes**:
1. No ORG_HAS_APP relationships
2. APP entities don't exist in PLATFORM org
3. ORG_HAS_APP relationships are `is_active = false`

**Debug Steps**:
```sql
-- 1. Check APP entities exist
SELECT * FROM core_entities
WHERE entity_type = 'APP'
  AND organization_id = '00000000-0000-0000-0000-000000000000';

-- 2. Check ORG_HAS_APP relationships
SELECT * FROM core_relationships
WHERE organization_id = 'org-id'
  AND relationship_type = 'ORG_HAS_APP';
```

**Fix**: Install app using `hera_org_link_app_v1`

### Issue: Wrong Organization Selected

**Symptoms**: User sees unexpected default organization

**Causes**:
1. `default_organization_id` is first in introspection result
2. Organizations sorted by `joined_at DESC`
3. Most recently joined org becomes default

**Fix**:
- Option 1: Set user preference in `auth.users.user_metadata`
- Option 2: Update organization `settings.is_default = true`
- Option 3: User manually selects from dropdown

### Issue: Auto-Redirect Not Working

**Symptoms**: User sees selector even with single org/app

**Causes**:
1. `organizations` array not populated correctly
2. Login page logic checking wrong conditions
3. `availableApps` is empty despite org having apps

**Debug Steps**:
```typescript
// Add console logs in login page
console.log('Auth state:', {
  isAuthenticated,
  organizations: organizations?.length,
  availableApps: availableApps?.length,
  defaultApp
})
```

**Fix**: Check auth provider is correctly parsing response

---

## Best Practices

### 1. Always Use the RPC Function

❌ **DON'T**:
```typescript
// Manual queries = inconsistent results
const { data: memberships } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', userId)
```

✅ **DO**:
```typescript
// Single RPC call = consistent, tested logic
const { data } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userId
})
```

### 2. Handle Loading States

```typescript
const { isAuthenticated, isLoading, organizations } = useHERAAuth()

if (isLoading) return <LoadingSpinner />
if (!isAuthenticated) return <LoginPrompt />
if (!organizations || organizations.length === 0) return <NoOrgsMessage />

return <YourComponent />
```

### 3. Organization-Scoped Data Fetching

```typescript
// Always include organization_id in API calls
const { data } = await apiV2.get('entities', {
  entity_type: 'customer',
  organization_id: organization.id  // ✅ Required
})
```

### 4. URL-Based App Detection

```typescript
// Detect current app from URL
useEffect(() => {
  const pathname = window.location.pathname
  const appCode = pathname.split('/')[1]?.toUpperCase()

  if (appCode && hasApp(appCode)) {
    setCurrentApp(appCode)
  }
}, [window.location.pathname])
```

### 5. Graceful Degradation

```typescript
// Handle organizations with no apps
if (!availableApps || availableApps.length === 0) {
  return (
    <Alert>
      This organization has no apps installed.
      Contact your administrator.
    </Alert>
  )
}
```

---

## References

- **Auth Provider**: `/src/components/auth/HERAAuthProvider.tsx`
- **Login Page**: `/src/app/auth/login/page.tsx`
- **Resolve Membership API**: `/src/app/api/v2/auth/resolve-membership/route.ts`
- **Organizations API**: `/src/app/api/v2/organizations/route.ts`
- **Introspection RPC**: `/db/rpc/hera_auth_introspect_v1_FINAL.sql`
- **Setup Scripts**: `/scripts/setup-demo-org-hierarchy.mjs`
- **Documentation**: `/docs/setup/DEMO-ORG-HIERARCHY-SETUP.md`

---

## Appendix: Demo User Setup

### Demo User Credentials
- **Email**: demo@heraerp.com
- **Password**: demo2025!
- **Auth UID**: a55cc033-e909-4c59-b974-8ff3e098f2bf
- **User Entity ID**: 4d93b3f8-dfe8-430c-83ea-3128f6a520cf

### Organizations
| Organization | ID | Apps | Role |
|---|---|---|---|
| HERA Cashew Demo | 699453c2-950e-4456-9fc0-c0c71efa78fb | CASHEW | ORG_OWNER |
| HERA Salon Demo | de5f248d-7747-44f3-9d11-a279f3158fa5 | SALON | ORG_OWNER |
| HERA ERP Demo | c58cdbcd-73f9-4cef-8c27-caf9f4436d05 | None | ORG_OWNER |

### Creating Demo Setup

Run the setup script:
```bash
node scripts/setup-demo-org-hierarchy.mjs
```

This creates:
1. Parent organization (HERA ERP Demo)
2. Child organizations with apps
3. User memberships
4. Default app settings

---

**Last Updated**: 2025-11-03
**Version**: 1.0
**Author**: HERA Development Team
