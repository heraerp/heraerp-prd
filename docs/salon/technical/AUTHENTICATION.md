# AUTHENTICATION.md - HERA Authentication & Authorization Technical Guide

**Technical Guide** | Last Updated: 2025-11-07
**Status**: ✅ Production | **Architecture**: HERA v2.2 "Authenticated Actor Everywhere"

---

## 📋 Table of Contents

1. [HERA v2.2 Authentication Architecture](#hera-v22-authentication-architecture)
2. [HERAAuthProvider - Core System](#heraauthprovider---core-system)
3. [Four-Layer Security Pipeline](#four-layer-security-pipeline)
4. [Actor Resolution](#actor-resolution)
5. [Organization Context](#organization-context)
6. [Role-Based Authorization](#role-based-authorization)
7. [Multi-Organization Support](#multi-organization-support)
8. [Session Management](#session-management)
9. [Authentication Flows](#authentication-flows)
10. [Authorization Patterns](#authorization-patterns)
11. [Security Best Practices](#security-best-practices)
12. [localStorage Keys Reference](#localstorage-keys-reference)
13. [API Integration](#api-integration)
14. [Troubleshooting](#troubleshooting)

---

## HERA v2.2 Authentication Architecture

### 🔐 **"Authenticated Actor Everywhere" Philosophy**

HERA v2.2 implements a comprehensive actor-based authentication system where:

- **WHO**: Every action is traced to a specific user (actor)
- **WHERE**: Every action is scoped to an organization (tenant)
- **WHEN**: Every action is timestamped with audit trail
- **WHAT**: Every action is validated against business rules

```
┌─────────────────────────────────────────────────────────────────┐
│              HERA v2.2 AUTHENTICATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User Login                                                  │
│     ↓                                                           │
│  2. Supabase JWT Token (OAuth 2.0)                             │
│     ↓                                                           │
│  3. Actor Resolution (User Entity ID)                          │
│     ↓                                                           │
│  4. Organization Context (Membership Lookup)                   │
│     ↓                                                           │
│  5. Role Assignment (RBAC)                                     │
│     ↓                                                           │
│  6. Available Apps Discovery                                   │
│     ↓                                                           │
│  7. Authenticated Session                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🎯 **Core Authentication Concepts**

**Actor Identity**:
- **Supabase UID**: OAuth identity (auth.users.id)
- **User Entity ID**: HERA entity in `core_entities` (entity_type: 'USER')
- **Actor Stamping**: All writes include `created_by`/`updated_by` with User Entity ID

**Organization Context**:
- **Organization ID**: Sacred boundary for multi-tenant isolation
- **Organization Entity ID**: HERA entity in `core_entities` (entity_type: 'ORGANIZATION')
- **Membership**: Relationship between User Entity and Organization Entity

**Role-Based Access Control (RBAC)**:
- **Roles**: owner, manager, staff, receptionist, user
- **Scopes**: Permissions derived from role
- **Business Rules**: Additional constraints in `business_rules` JSONB

---

## HERAAuthProvider - Core System

### 📦 **Provider Setup**

```tsx
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HERAAuthProvider>
          {children}
        </HERAAuthProvider>
      </body>
    </html>
  )
}
```

### 🔧 **Hook Usage**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function MyComponent() {
  const {
    // Authentication state
    user,                     // HERAUser | null
    organization,             // HERAOrganization | null
    isAuthenticated,          // boolean
    isLoading,                // boolean
    status,                   // 'idle' | 'resolving' | 'authenticated' | 'error'
    userEntityId,             // string | undefined (User Entity ID)
    organizationId,           // string | undefined (Organization ID)

    // Authorization
    role,                     // 'owner' | 'manager' | 'staff' | 'receptionist' | 'user'
    scopes,                   // string[] (permissions)
    hasScope,                 // (scope: string) => boolean

    // Multi-Organization
    organizations,            // HERAOrganization[] (all user orgs)
    switchOrganization,       // (orgId: string) => void

    // Dynamic Apps
    availableApps,            // HERAApp[] (apps in current org)
    defaultApp,               // string | null
    currentApp,               // string | null (detected from URL)
    hasApp,                   // (appCode: string) => boolean
    getAppConfig,             // (appCode: string) => Record<string, any> | null

    // Actions
    login,                    // (email, password, options?) => Promise<{...}>
    register,                 // (email, password, metadata?) => Promise<any>
    logout,                   // () => Promise<void>
    refreshAuth,              // () => Promise<void>
    clearSession,             // () => Promise<void>

    // Legacy compatibility
    currentOrganization,      // Alias for organization
    contextLoading            // Alias for isLoading
  } = useHERAAuth()

  // Three-layer authorization check (MANDATORY)
  if (!isAuthenticated) return <Alert>Please log in</Alert>
  if (isLoading) return <LoadingSpinner />
  if (!organization?.id) return <Alert>No organization context</Alert>

  // Authorized user - render content
  return <div>...</div>
}
```

### 📊 **Type Definitions**

```typescript
// User Identity
interface HERAUser {
  id: string              // Supabase UID (auth.users.id)
  entity_id: string       // HERA USER entity ID in core_entities
  name: string            // Display name
  email: string           // Email address
  role: string            // Primary role in organization
}

// Organization Context
interface HERAOrganization {
  id: string              // Organization row ID (organization_id)
  entity_id: string       // HERA ORG entity ID in core_entities
  name: string            // Organization name
  type: string            // Organization type ('salon', 'restaurant', etc.)
  industry: string        // Industry classification
  code?: string           // Organization code (e.g., 'HERA-SALON')
  primary_role?: string   // User's primary role in this org
  roles?: string[]        // All roles user has in this org
  user_role?: string      // Alias for primary_role
  apps?: HERAApp[]        // Apps available in this org
  settings?: Record<string, any>  // Organization settings
  joined_at?: string      // When user joined
  is_owner?: boolean      // Quick ownership check
  is_admin?: boolean      // Quick admin check
}

// App Configuration
interface HERAApp {
  code: string           // App code (SALON, CASHEW, CRM, etc.)
  name: string           // Display name
  config: Record<string, any>  // App configuration
}

// Auth Status
type HeraStatus = 'idle' | 'resolving' | 'authenticated' | 'error'
```

---

## Four-Layer Security Pipeline

HERA implements defense-in-depth with four security layers:

```
┌─────────────────────────────────────────────────────────────────┐
│   CLIENT/UI     │───▶│  EDGE/API       │───▶│   DATABASE      │    │
│                 │    │                 │    │                 │    │
│ • JWT Token     │    │ • Identity      │    │ • Guardrails    │    │
│ • Org Context   │    │ • Membership    │    │ • RLS + Audit   │    │
│ • Idempotency   │    │ • Rate Limits   │    │ • Sacred Six    │    │
└─────────────────────────────────────────────────────────────────┘
```

### 🔐 **Layer 1: Client Authentication**

Every API request includes:
```typescript
// Request headers
{
  Authorization: `Bearer ${jwt_token}`,           // Supabase JWT
  'X-Organization-Id': organizationId,           // Organization context
  'X-Idempotency-Key': uniqueKey                 // Duplicate prevention
}
```

### 🛡️ **Layer 2: Edge Function Security Pipeline**

**Identity Resolution with Caching**:
```typescript
// resolve_user_identity_v1() with 5-minute TTL cache
const identity = await resolveUserIdentity(jwt)
if (!identity.cache_hit) {
  // Query DB and cache result
  await cacheIdentity(identity, TTL_5_MINUTES)
}
```

**Organization Context Resolution (Priority Order)**:
1. `X-Organization-Id` header (explicit request)
2. JWT `organization_id` claim (token metadata)
3. `memberships[0]` (first resolved membership)
4. **400 Bad Request** if no context found

**Membership Validation**:
```typescript
// Defense in depth: Edge + Database validation
if (!isActorMemberOfOrg(actorId, orgId)) {
  return 403 // Forbidden: actor_not_member
}
```

### 🗄️ **Layer 3: Database Guardrails v2.0**

**RPC Function Requirements**:
```typescript
// Entity operations enforce actor pattern
await callRPC('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: resolvedActorId,    // WHO is making the change
  p_organization_id: validatedOrgId,   // WHERE (tenant boundary)
  p_entity: entityPayload,             // WHAT entity is being changed
  p_dynamic: dynamicFields,
  p_relationships: relationships,
  p_options: options
})
```

**Triple Validation System**:
1. **ORG-FILTER-REQUIRED**: `organization_id` presence validation
2. **SMARTCODE-PRESENT**: HERA DNA pattern validation
3. **PAYLOAD-RULES**: Business logic validation

**Audit Trail Automation**:
```sql
-- RPC automatically stamps audit fields
created_by = p_actor_user_id    -- WHO created
updated_by = p_actor_user_id    -- WHO modified
created_at = NOW()              -- WHEN created
updated_at = NOW()              -- WHEN modified
```

### 🔐 **Layer 4: Row-Level Security + Event Processing**

**Organization Isolation**:
```sql
-- RLS policies enforce organization boundary
CREATE POLICY org_isolation ON core_entities
FOR ALL TO authenticated
USING (organization_id = current_setting('app.current_org_id')::uuid);
```

**Event Outbox with Actor Context**:
```typescript
// Every mutation generates traceable event
await eventOutbox.enqueue({
  entity_id: result.id,
  actor_user_id: p_actor_user_id,  // WHO triggered the event
  organization_id: p_organization_id,
  event_type: 'entity_created',
  metadata: { source: 'api_v2', trace_id: request.trace_id }
})
```

---

## Actor Resolution

### 🎯 **What is Actor Resolution?**

**Actor Resolution** is the process of mapping a Supabase authentication UID to a HERA USER entity ID.

**Why This Matters**:
- Supabase Auth UID: OAuth identity (auth.users.id)
- HERA User Entity ID: Business entity in core_entities
- **These are often DIFFERENT** (especially for users created via `hera_onboard_user_v1`)

### 🔄 **Actor Resolution Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACTOR RESOLUTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User logs in → Supabase JWT (UID: abc-123)                 │
│     ↓                                                           │
│  2. Call /api/v2/auth/resolve-membership                       │
│     ↓                                                           │
│  3. Query core_relationships for USER_MEMBER_OF_ORG            │
│     ↓                                                           │
│  4. Find USER entity linked to auth UID                        │
│     ↓                                                           │
│  5. Return user_entity_id (def-456) + organization_id          │
│     ↓                                                           │
│  6. Store both IDs in context and localStorage                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 📝 **Actor Resolution Implementation**

```typescript
// API endpoint: /api/v2/auth/resolve-membership
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')

  // 1. Validate JWT and extract Supabase UID
  const { data: { user }, error } = await supabase.auth.getUser(jwt)
  if (error || !user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  // 2. Find USER entity linked to this auth UID
  const { data: userEntity } = await supabase
    .from('core_entities')
    .select('id, entity_name, organization_id')
    .eq('entity_type', 'USER')
    .eq('metadata->>auth_uid', user.id)  // Link via metadata
    .single()

  // 3. Find user's organization memberships
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select(`
      id,
      to_entity_id,
      relationship_data,
      organizations:to_entity_id (
        id,
        entity_name,
        metadata
      )
    `)
    .eq('from_entity_id', userEntity.id)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .eq('is_active', true)

  // 4. Extract role from relationship_data
  const primaryMembership = memberships[0]
  const role = primaryMembership.relationship_data?.role || 'user'

  // 5. Return resolved context
  return Response.json({
    user_entity_id: userEntity.id,
    organization_id: primaryMembership.to_entity_id,
    membership: {
      organization_id: primaryMembership.to_entity_id,
      organization_name: primaryMembership.organizations.entity_name,
      roles: [role],
      org_entity_id: primaryMembership.to_entity_id
    },
    organizations: memberships.map(m => ({
      id: m.to_entity_id,
      name: m.organizations.entity_name,
      roles: [m.relationship_data?.role || 'user']
    }))
  })
}
```

### 🔑 **Key Takeaways**

1. **Always use `user_entity_id` for actor stamping** (not Supabase UID)
2. **Supabase UID is for authentication** (who are you?)
3. **User Entity ID is for authorization** (what can you do?)
4. **Store both IDs in localStorage** for offline resilience

---

## Organization Context

### 🏢 **What is Organization Context?**

**Organization Context** is the tenant boundary for all data operations in HERA.

**Sacred Rules**:
- ✅ **EVERY query** MUST include `organization_id`
- ✅ **EVERY mutation** MUST include `organization_id`
- ❌ **NEVER** query across organizations (data leakage)

### 🔍 **Organization Context Resolution**

**Priority Order**:
1. **X-Organization-Id header** (explicit in API request)
2. **JWT organization_id claim** (stored in token metadata)
3. **First membership** (from resolve-membership API)
4. **400 Bad Request** (no organization context found)

```typescript
// Organization context in API request
const { data } = await apiV2.get('entities', {
  entity_type: 'CUSTOMER',
  organization_id: orgId  // REQUIRED - Sacred boundary
})
```

### 🔄 **Organization Switching**

HERA v2.2 supports multi-organization users:

```typescript
const { organizations, switchOrganization } = useHERAAuth()

// List all organizations user belongs to
organizations.forEach(org => {
  console.log(`${org.name} (${org.code}) - Role: ${org.primary_role}`)
})

// Switch to different organization
switchOrganization('org-uuid-2')

// Context automatically updates with:
// - New organization ID
// - New role for that organization
// - New available apps
// - Updated localStorage
```

**What Happens During Switch**:
1. Context updates with new organization data
2. Role updates to role in new organization
3. Available apps update to apps in new organization
4. localStorage updates with new organization ID and role
5. UI re-renders with new organization context

**localStorage Keys Updated**:
```typescript
localStorage.setItem('organizationId', newOrgId)
localStorage.setItem('safeOrganizationId', newOrgId)
localStorage.setItem('salonOrgId', newOrgId)
localStorage.setItem('salonRole', newRole)  // Role for new org
```

---

## Role-Based Authorization

### 🎖️ **HERA Role Hierarchy**

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OWNER (Highest Privilege)                                      │
│    • Full access to all features                                │
│    • Can manage organization settings                           │
│    • Can add/remove users                                       │
│    • Can delete data                                            │
│                                                                  │
│  MANAGER                                                         │
│    • Can view all data                                          │
│    • Can create/edit most entities                              │
│    • Cannot delete data                                         │
│    • Cannot manage users                                        │
│                                                                  │
│  STAFF                                                           │
│    • Can view assigned data                                     │
│    • Can create appointments for self                           │
│    • Cannot access reports                                      │
│    • Cannot manage settings                                     │
│                                                                  │
│  RECEPTIONIST                                                    │
│    • Can create appointments for all staff                      │
│    • Can check in customers                                     │
│    • Cannot access financial reports                            │
│    • Cannot manage staff                                        │
│                                                                  │
│  USER (Lowest Privilege)                                        │
│    • Read-only access                                           │
│    • Cannot create or edit                                      │
│    • Limited feature access                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔧 **Role Normalization**

HERA includes a centralized role normalizer to handle various role formats:

```typescript
import { normalizeRole } from '@/lib/auth/role-normalizer'

// Handles various input formats
normalizeRole('ORG_OWNER')        // → 'owner'
normalizeRole('OWNER')            // → 'owner'
normalizeRole('MANAGER')          // → 'manager'
normalizeRole('STAFF')            // → 'staff'
normalizeRole('RECEPTIONIST')     // → 'receptionist'
normalizeRole('USER')             // → 'user'
normalizeRole('MEMBER')           // → 'user'
normalizeRole('org_manager')      // → 'manager'
normalizeRole('admin')            // → 'owner'

// Unknown roles default to 'user'
normalizeRole('unknown_role')     // → 'user'
```

### 🛡️ **Role-Based Access Control Patterns**

**Component-Level Protection**:
```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function AdminPanel() {
  const { role } = useHERAAuth()

  // Only owners and managers can access
  if (role !== 'owner' && role !== 'manager') {
    return <Alert>Access denied. Admin privileges required.</Alert>
  }

  return <div>Admin content...</div>
}
```

**Feature Toggle by Role**:
```typescript
function DashboardPage() {
  const { role, hasScope } = useHERAAuth()

  return (
    <div>
      <h1>Dashboard</h1>

      {/* All roles can see KPIs */}
      <KPICards />

      {/* Only manager and owner can see reports */}
      {(role === 'manager' || role === 'owner') && (
        <ReportsSection />
      )}

      {/* Only owner can manage settings */}
      {role === 'owner' && (
        <SettingsButton />
      )}

      {/* Scope-based check */}
      {hasScope('DELETE_ENTITY') && (
        <DeleteButton />
      )}
    </div>
  )
}
```

**Action-Level Protection**:
```typescript
async function deleteCustomer(customerId: string) {
  const { role, userEntityId, organizationId } = useHERAAuth()

  // Only owners can delete
  if (role !== 'owner') {
    throw new Error('Delete permission denied. Owner role required.')
  }

  // Proceed with delete
  await callRPC('hera_entities_crud_v1', {
    p_action: 'DELETE',
    p_actor_user_id: userEntityId,
    p_organization_id: organizationId,
    p_entity: { entity_id: customerId },
    p_dynamic: {},
    p_relationships: [],
    p_options: {}
  })
}
```

### 📊 **Role Permissions Matrix**

| Feature | Owner | Manager | Staff | Receptionist | User |
|---------|-------|---------|-------|--------------|------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Appointments | ✅ | ✅ | ✅ (Self) | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Customers | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Data | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Leave | ✅ | ✅ | ❌ | ❌ | ❌ |
| Process Payments | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Multi-Organization Support

### 🏢 **Multi-Organization Architecture**

HERA supports users belonging to multiple organizations:

```
┌─────────────────────────────────────────────────────────────────┐
│               MULTI-ORGANIZATION MODEL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USER ENTITY (john.doe@example.com)                            │
│    │                                                            │
│    ├─ Membership 1 → Organization A (Role: Owner)              │
│    │   └─ Apps: SALON, CRM                                     │
│    │                                                            │
│    ├─ Membership 2 → Organization B (Role: Manager)            │
│    │   └─ Apps: SALON                                          │
│    │                                                            │
│    └─ Membership 3 → Organization C (Role: Staff)              │
│        └─ Apps: SALON, CASHEW                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 **Organization Switching**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function OrganizationSwitcher() {
  const {
    organization,        // Current organization
    organizations,       // All organizations user belongs to
    switchOrganization   // Switch function
  } = useHERAAuth()

  return (
    <select
      value={organization?.id}
      onChange={(e) => switchOrganization(e.target.value)}
    >
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.primary_role})
        </option>
      ))}
    </select>
  )
}
```

### 🎯 **Key Points**

1. **Different Roles Per Organization**: User can be Owner in Org A, Manager in Org B
2. **Different Apps Per Organization**: Each org has its own app configuration
3. **Automatic Context Switch**: Role and apps update when switching organizations
4. **Persistent Context**: Selected organization stored in localStorage

---

## Session Management

### 🔐 **Session Lifecycle**

```
┌─────────────────────────────────────────────────────────────────┐
│                   SESSION LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Login → Create Session                                      │
│     • Generate JWT token (Supabase)                             │
│     • Resolve actor identity                                    │
│     • Resolve organization memberships                          │
│     • Store context in localStorage (9 keys)                   │
│                                                                  │
│  2. Active Session → Token Refresh                              │
│     • Automatic token refresh (Supabase)                        │
│     • Re-resolve context if missing                             │
│     • Update localStorage                                       │
│                                                                  │
│  3. Logout → Destroy Session                                    │
│     • Sign out from Supabase                                    │
│     • Clear localStorage and sessionStorage                     │
│     • Reset context state                                       │
│     • Redirect to login                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 📦 **localStorage Session Keys** (9 keys for full compatibility)

```typescript
// User Identity
localStorage.setItem('userId', user.id)                    // Supabase UID
localStorage.setItem('user_entity_id', userEntityId)       // HERA User Entity ID
localStorage.setItem('userEmail', user.email)              // Email
localStorage.setItem('salonUserEmail', user.email)         // Legacy alias
localStorage.setItem('salonUserName', userName)            // Display name

// Organization Context
localStorage.setItem('organizationId', orgId)              // Primary org ID
localStorage.setItem('safeOrganizationId', orgId)          // Safe loader org ID
localStorage.setItem('salonOrgId', orgId)                  // Legacy alias

// Authorization
localStorage.setItem('salonRole', role)                    // User role
```

### 🔄 **Session Refresh Flow**

```typescript
// HERAAuthProvider automatically handles session refresh
const { refreshAuth } = useHERAAuth()

// Manual refresh (if needed)
await refreshAuth()

// Automatic refresh on:
// 1. Page load (if session exists)
// 2. Token expiration (Supabase handles)
// 3. Context missing (smart re-resolution)
```

### 🧹 **Session Cleanup**

```typescript
const { clearSession } = useHERAAuth()

// Clear session (without logout)
await clearSession()

// Emits 'hera:session:clear' event for app-specific cleanup
// Apps can listen and clean their own stores:
window.addEventListener('hera:session:clear', () => {
  // Clean app-specific state
  clearAppCache()
})
```

---

## Authentication Flows

### 🔐 **Login Flow**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function LoginPage() {
  const { login } = useHERAAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Login with clearFirst option (recommended)
      const {
        user,
        session,
        organizationId,
        role,
        userEntityId,
        membershipData
      } = await login(email, password, { clearFirst: true })

      console.log('✅ Login successful:', {
        userId: user.id,
        userEntityId,
        organizationId,
        role
      })

      // Redirect to default app or dashboard
      router.push('/salon/dashboard')

    } catch (error) {
      console.error('❌ Login failed:', error)

      // Handle specific error codes
      if (error.message.includes('NO_ORGANIZATION_MEMBERSHIP')) {
        setError('No organization access. Please contact support.')
      } else if (error.message.includes('INVALID_AUTH')) {
        setError('Invalid credentials. Please try again.')
      } else {
        setError('Login failed. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  )
}
```

### 📝 **Registration Flow**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function RegisterPage() {
  const { register } = useHERAAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Register new user
      await register(email, password, {
        full_name: fullName
      })

      setSuccess(true)
      console.log('✅ Registration successful. Check email for confirmation.')

    } catch (error) {
      console.error('❌ Registration failed:', error)
      setError('Registration failed. Please try again.')
    }
  }

  if (success) {
    return (
      <div>
        <h2>Registration Successful!</h2>
        <p>Please check your email to confirm your account.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Register</button>
    </form>
  )
}
```

### 🚪 **Logout Flow**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function LogoutButton() {
  const { logout } = useHERAAuth()

  const handleLogout = async () => {
    try {
      // Logout (clears context, signs out, redirects)
      await logout()

      // Automatically redirects to /auth/login
      console.log('✅ Logged out successfully')

    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Still redirects even on error
    }
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  )
}
```

---

## Authorization Patterns

### 🛡️ **Three-Layer Authorization Check (MANDATORY)**

Every protected component MUST implement this pattern:

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function ProtectedComponent() {
  const { isAuthenticated, isLoading, organization } = useHERAAuth()

  // Layer 1: Authentication check
  if (!isAuthenticated) {
    return <Alert>Please log in to access this page.</Alert>
  }

  // Layer 2: Loading state check
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Layer 3: Organization context check
  if (!organization?.id) {
    return <Alert>No organization context. Please select an organization.</Alert>
  }

  // All checks passed - render protected content
  return (
    <div>
      <h1>Protected Content</h1>
      <p>Organization: {organization.name}</p>
    </div>
  )
}
```

### 🎖️ **Role-Based Rendering**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function DashboardPage() {
  const { role, isAuthenticated, isLoading, organization } = useHERAAuth()

  // Three-layer check
  if (!isAuthenticated) return <Alert>Please log in</Alert>
  if (isLoading) return <LoadingSpinner />
  if (!organization?.id) return <Alert>No organization context</Alert>

  return (
    <div>
      <h1>Dashboard</h1>

      {/* All users see dashboard */}
      <DashboardStats />

      {/* Only managers and owners see reports */}
      {(role === 'owner' || role === 'manager') && (
        <ReportsSection />
      )}

      {/* Only owners see settings */}
      {role === 'owner' && (
        <SettingsPanel />
      )}

      {/* Staff see their own schedule */}
      {role === 'staff' && (
        <MySchedule />
      )}
    </div>
  )
}
```

### 🔐 **Scope-Based Authorization**

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function AdminPanel() {
  const { hasScope, scopes } = useHERAAuth()

  return (
    <div>
      <h1>Admin Panel</h1>

      {/* Check for specific scope */}
      {hasScope('MANAGE_USERS') && (
        <UserManagementSection />
      )}

      {hasScope('DELETE_ENTITY') && (
        <DangerZoneSection />
      )}

      {/* List all scopes */}
      <div>
        <h2>Your Permissions:</h2>
        <ul>
          {scopes.map(scope => (
            <li key={scope}>{scope}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

### 🚫 **Route Protection with Next.js Middleware**

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /salon routes
  if (req.nextUrl.pathname.startsWith('/salon')) {
    if (!session) {
      // Redirect to login
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/salon/:path*']
}
```

---

## Security Best Practices

### ✅ **DO's**

1. **Always Use Three-Layer Check**:
   ```typescript
   if (!isAuthenticated) return <Alert />
   if (isLoading) return <LoadingSpinner />
   if (!organization?.id) return <Alert />
   ```

2. **Always Include Organization ID**:
   ```typescript
   // ✅ CORRECT
   await apiV2.get('entities', {
     entity_type: 'CUSTOMER',
     organization_id: organizationId  // REQUIRED
   })
   ```

3. **Always Use Actor Stamping**:
   ```typescript
   // ✅ CORRECT
   await callRPC('hera_entities_crud_v1', {
     p_action: 'CREATE',
     p_actor_user_id: userEntityId,   // WHO
     p_organization_id: organizationId  // WHERE
   })
   ```

4. **Always Normalize Roles**:
   ```typescript
   import { normalizeRole } from '@/lib/auth/role-normalizer'
   const role = normalizeRole(rawRole)  // Handles various formats
   ```

5. **Always Clear Session Before Login** (if switching users):
   ```typescript
   await login(email, password, { clearFirst: true })
   ```

### ❌ **DON'Ts**

1. **Never Query Without Organization ID**:
   ```typescript
   // ❌ WRONG - Missing organization_id
   await apiV2.get('entities', {
     entity_type: 'CUSTOMER'
     // Missing organization_id - DATA LEAKAGE!
   })
   ```

2. **Never Use Supabase UID for Actor Stamping**:
   ```typescript
   // ❌ WRONG - Using Supabase UID
   await callRPC('hera_entities_crud_v1', {
     p_actor_user_id: user.id  // Supabase UID - WRONG!
   })

   // ✅ CORRECT - Using User Entity ID
   await callRPC('hera_entities_crud_v1', {
     p_actor_user_id: userEntityId  // User Entity ID - CORRECT!
   })
   ```

3. **Never Skip Authorization Checks**:
   ```typescript
   // ❌ WRONG - No authorization check
   function AdminPanel() {
     return <div>Sensitive admin content</div>
   }

   // ✅ CORRECT - Role-based check
   function AdminPanel() {
     const { role } = useHERAAuth()
     if (role !== 'owner') return <Alert>Access denied</Alert>
     return <div>Sensitive admin content</div>
   }
   ```

4. **Never Store Sensitive Data in localStorage**:
   ```typescript
   // ❌ WRONG - Storing sensitive data
   localStorage.setItem('password', password)
   localStorage.setItem('creditCard', cardNumber)

   // ✅ CORRECT - Only store non-sensitive context
   localStorage.setItem('organizationId', orgId)
   localStorage.setItem('userEntityId', userEntityId)
   ```

5. **Never Hardcode Roles**:
   ```typescript
   // ❌ WRONG - Hardcoded role comparison
   if (role === 'ORG_OWNER' || role === 'OWNER' || role === 'admin') {
     // Multiple role formats - fragile
   }

   // ✅ CORRECT - Use normalized role
   const normalizedRole = normalizeRole(role)
   if (normalizedRole === 'owner') {
     // Single format - robust
   }
   ```

---

## localStorage Keys Reference

### 📦 **Complete localStorage Keys** (9 keys)

```typescript
// User Identity (3 keys)
localStorage.getItem('userId')              // Supabase UID (auth.users.id)
localStorage.getItem('user_entity_id')      // HERA User Entity ID (core_entities.id)
localStorage.getItem('userEmail')           // User email address
localStorage.getItem('salonUserEmail')      // Legacy alias for userEmail
localStorage.getItem('salonUserName')       // User display name

// Organization Context (3 keys)
localStorage.getItem('organizationId')      // Primary organization ID
localStorage.getItem('safeOrganizationId')  // Safe loader organization ID
localStorage.getItem('salonOrgId')          // Legacy alias for organizationId

// Authorization (1 key)
localStorage.getItem('salonRole')           // User role in current organization

// Total: 9 keys for full compatibility
```

### 🔧 **Usage Example**

```typescript
function useAuthContext() {
  // Read from localStorage (fallback if context not loaded)
  const userId = localStorage.getItem('userId')
  const userEntityId = localStorage.getItem('user_entity_id')
  const organizationId = localStorage.getItem('organizationId')
  const role = localStorage.getItem('salonRole')

  return {
    userId,
    userEntityId,
    organizationId,
    role
  }
}
```

---

## API Integration

### 🔗 **API v2 with Authentication**

```typescript
import { apiV2 } from '@/lib/client/fetchV2'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function CustomerList() {
  const { organizationId, userEntityId } = useHERAAuth()

  const fetchCustomers = async () => {
    // API v2 automatically includes JWT from Supabase session
    const { data } = await apiV2.get('entities', {
      entity_type: 'CUSTOMER',
      organization_id: organizationId,  // REQUIRED
      status: 'active',
      limit: 100
    })

    return data
  }

  const createCustomer = async (customerData: any) => {
    const { data } = await apiV2.post('entities', {
      entity_type: 'CUSTOMER',
      entity_name: customerData.name,
      organization_id: organizationId,  // REQUIRED
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.v1',
      // Actor automatically resolved from JWT
    })

    return data
  }

  return <div>...</div>
}
```

### 🎯 **RPC with Actor Stamping**

```typescript
import { callRPC } from '@/lib/universal-api-v2-client'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

function useCreateCustomer() {
  const { userEntityId, organizationId } = useHERAAuth()

  const createCustomer = async (name: string, email: string) => {
    const result = await callRPC('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: userEntityId!,      // WHO is creating
      p_organization_id: organizationId!,  // WHERE (tenant)
      p_entity: {
        entity_type: 'CUSTOMER',
        entity_name: name,
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.v1'
      },
      p_dynamic: {
        email: {
          type: 'text',
          value: email,
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
        }
      },
      p_relationships: [],
      p_options: {
        include_dynamic: true
      }
    })

    return result
  }

  return { createCustomer }
}
```

---

## Troubleshooting

### 🚨 **Common Issues**

**Issue: "No organization context" error**
```typescript
// Problem: Organization context not loaded
if (!organization?.id) return <Alert />

// Solution: Ensure three-layer check is in place
if (!isAuthenticated) return <Alert>Please log in</Alert>
if (isLoading) return <LoadingSpinner />  // Wait for context to load
if (!organization?.id) return <Alert>No organization</Alert>
```

**Issue: "Actor user ID is null" error**
```typescript
// Problem: Using Supabase UID instead of User Entity ID
p_actor_user_id: user.id  // ❌ WRONG

// Solution: Use userEntityId from useHERAAuth
const { userEntityId } = useHERAAuth()
p_actor_user_id: userEntityId  // ✅ CORRECT
```

**Issue: "User has no organization access" error**
```typescript
// Problem: User not assigned to any organization

// Solution: Create organization membership via RPC
await callRPC('hera_onboard_user_v1', {
  p_email: 'user@example.com',
  p_organization_id: 'org-uuid',
  p_role: 'staff'
})
```

**Issue: Context not refreshing after login**
```typescript
// Problem: didResolveRef flag prevents re-resolution

// Solution: Use clearFirst option in login
await login(email, password, { clearFirst: true })
```

**Issue: Role not updating after organization switch**
```typescript
// Problem: localStorage role not updated

// Solution: Use switchOrganization method (handles localStorage)
const { switchOrganization } = useHERAAuth()
await switchOrganization(newOrgId)  // Automatically updates role
```

### 🔍 **Debugging Authentication**

```typescript
function AuthDebugger() {
  const auth = useHERAAuth()

  console.log('🔐 HERA Auth Debug:', {
    // Authentication
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    status: auth.status,

    // User Identity
    userId: auth.user?.id,              // Supabase UID
    userEntityId: auth.userEntityId,    // HERA User Entity ID
    userName: auth.user?.name,
    userEmail: auth.user?.email,

    // Organization Context
    organizationId: auth.organizationId,
    organizationName: auth.organization?.name,
    organizationType: auth.organization?.type,

    // Authorization
    role: auth.role,
    scopes: auth.scopes,

    // Multi-Organization
    totalOrganizations: auth.organizations.length,
    organizations: auth.organizations.map(o => ({
      id: o.id,
      name: o.name,
      role: o.primary_role
    })),

    // Apps
    availableApps: auth.availableApps,
    defaultApp: auth.defaultApp,
    currentApp: auth.currentApp,

    // localStorage
    localStorage: {
      userId: localStorage.getItem('userId'),
      userEntityId: localStorage.getItem('user_entity_id'),
      organizationId: localStorage.getItem('organizationId'),
      role: localStorage.getItem('salonRole')
    }
  })

  return <div>Check console for auth debug info</div>
}
```

---

## 🎯 Quick Reference Summary

### **Must-Have Patterns**:

1. **Three-Layer Authorization Check** (MANDATORY):
   ```typescript
   if (!isAuthenticated) return <Alert />
   if (isLoading) return <LoadingSpinner />
   if (!organization?.id) return <Alert />
   ```

2. **Always Include Organization ID**:
   ```typescript
   organization_id: organizationId  // SACRED BOUNDARY
   ```

3. **Always Use User Entity ID for Actor Stamping**:
   ```typescript
   p_actor_user_id: userEntityId  // NOT user.id
   ```

4. **Always Normalize Roles**:
   ```typescript
   const role = normalizeRole(rawRole)
   ```

5. **Use clearFirst for Secure Login**:
   ```typescript
   await login(email, password, { clearFirst: true })
   ```

### **Related Documentation**:
- **DATA-MODELS.md** - Sacred Six schema and data patterns
- **HOOKS.md** - Hook architecture and usage
- **API-ROUTES.md** - API endpoint patterns
- Feature guides: DASHBOARD.md, CUSTOMERS.md, etc.

---

## ✅ Next Steps

After understanding authentication:

1. **Read HOOKS.md** - Learn how hooks use auth context
2. **Read API-ROUTES.md** - Learn how APIs enforce auth
3. **Read Feature Guides** - See auth patterns in action
4. **Implement Three-Layer Check** - In all protected components

**HERA v2.2 authentication provides enterprise-grade security with complete audit traceability and multi-organization support.**
