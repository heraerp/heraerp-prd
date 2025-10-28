# HERA RBAC User Management API Reference

**Version:** 1.0
**Status:** Production Ready
**Last Updated:** 2025-10-27

---

## Overview

HERA's Role-Based Access Control (RBAC) system provides enterprise-grade user management with a sophisticated three-layer architecture:

1. **Platform Layer** - Global USER entities (stored in platform organization `00000000-0000-0000-0000-000000000000`)
2. **Organization Layer** - Tenant-specific organization entities and memberships
3. **Role Layer** - Hierarchical role assignments with primary role precedence

This document covers the complete API for managing users, organizations, roles, and memberships.

---

## Architecture Principles

### 🏗️ Three-Layer Identity Model

```
┌─────────────────────────────────────────────────────────────┐
│ PLATFORM LAYER (Global)                                     │
│ • USER entities (id = auth.users.id)                        │
│ • Organization: 00000000-0000-0000-0000-000000000000        │
│ • Smart Code: HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ORGANIZATION LAYER (Tenant-Scoped)                          │
│ • ORGANIZATION entities (shadow entities per tenant)        │
│ • MEMBER_OF relationships (USER → ORG)                      │
│ • Smart Code: HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ROLE LAYER (Tenant-Scoped)                                  │
│ • ROLE entities (per tenant)                                │
│ • HAS_ROLE relationships (USER → ROLE)                      │
│ • Primary role precedence (enforced by unique index)        │
│ • Smart Code: HERA.UNIVERSAL.ENTITY.ROLE.CANONICAL.v1       │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Key Design Features

- **Platform USER entities are global** - One USER entity per auth user, shared across all organizations
- **Relationships are tenant-scoped** - MEMBER_OF and HAS_ROLE relationships live in tenant boundaries
- **Primary role precedence** - Automatic selection based on role hierarchy (OWNER > ADMIN > MANAGER > etc.)
- **Actor stamping** - All operations record WHO made the change (created_by, updated_by)
- **Advisory locking** - Prevents race conditions during role updates

---

## Core RPC Functions

### 1. `hera_onboard_user_v1` - User Onboarding

**Purpose:** Onboard a user to an organization with a specific role. Creates/updates platform USER entity, organization shadow entity, role entity, and establishes tenant-scoped relationships.

**Signature:**
```sql
hera_onboard_user_v1(
  p_supabase_user_id uuid,          -- auth.users.id (platform USER entity id)
  p_organization_id  uuid,          -- tenant organization id
  p_actor_user_id    uuid,          -- actor making the change (often same as supabase_user_id)
  p_role             text default 'member'  -- role: owner|admin|manager|accountant|employee|member|<custom>
) RETURNS jsonb
```

**Role Mapping:**
| Input Role   | Canonical Code    | Description                          |
|--------------|-------------------|--------------------------------------|
| `owner`      | `ORG_OWNER`       | Full organization control            |
| `admin`      | `ORG_ADMIN`       | Administrative permissions           |
| `manager`    | `ORG_MANAGER`     | Management permissions               |
| `accountant` | `ORG_ACCOUNTANT`  | Financial/accounting permissions     |
| `employee`   | `ORG_EMPLOYEE`    | Standard employee access             |
| `staff`      | `ORG_EMPLOYEE`    | Alias for employee                   |
| `member`     | `MEMBER`          | Basic member access                  |
| Custom       | `UPPERCASE_INPUT` | Custom roles (e.g., `FINANCE_MANAGER`) |

**Example Usage:**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Onboard user as owner
const result = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: '550e8400-e29b-41d4-a716-446655440000',
  p_organization_id: 'org-uuid',
  p_actor_user_id: 'actor-uuid',
  p_role: 'owner'
})

console.log(result.data)
```

**Success Response:**
```json
{
  "success": true,
  "platform_user_entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "organization_entity_id": "org-entity-uuid",
  "role_entity_id": "role-entity-uuid",
  "membership_id": "membership-rel-uuid",
  "has_role_id": "hasrole-rel-uuid",
  "organization_id": "org-uuid",
  "role_code": "ORG_OWNER",
  "label": null,
  "message": "User onboarded (platform USER linked via MEMBER_OF + HAS_ROLE; primary handled in-RPC)"
}
```

**What It Does:**
1. ✅ Creates/updates platform USER entity (global scope, id = auth.users.id)
2. ✅ Creates/updates ORGANIZATION shadow entity (tenant scope)
3. ✅ Creates/updates ROLE entity (tenant scope)
4. ✅ Creates/updates MEMBER_OF relationship (USER → ORG)
5. ✅ Creates/updates HAS_ROLE relationship (USER → ROLE)
6. ✅ Handles primary role precedence (demotes other roles if new role has higher precedence)

**Primary Role Precedence Logic:**
```sql
-- Role precedence (lower rank = higher priority)
ORG_OWNER      = 1  -- Highest precedence
ORG_ADMIN      = 2
ORG_MANAGER    = 3
ORG_ACCOUNTANT = 4
ORG_EMPLOYEE   = 5
MEMBER         = 6
<custom>       = 999 -- Custom roles lowest precedence
```

**Error Scenarios:**
```javascript
// Missing required parameters
// Error: hera_onboard_user_v1: p_supabase_user_id is required

// Invalid Supabase user
// Error: Supabase user not found: <uuid>

// Unique violation (extremely rare due to advisory locking)
// Error: hera_onboard_user_v1: unique violation while setting primary role — retry operation
```

---

### 2. `hera_organizations_crud_v1` - Organization Management

**Purpose:** Complete CRUD operations for organizations with automatic user onboarding and role assignment.

**Signature:**
```sql
hera_organizations_crud_v1(
  p_action        text,            -- 'CREATE' | 'UPDATE' | 'GET' | 'LIST' | 'ARCHIVE'
  p_actor_user_id uuid,            -- platform USER entity id (auth.users.id)
  p_payload       jsonb default '{}'::jsonb,
  p_limit         int  default 50,
  p_offset        int  default 0
) RETURNS jsonb
```

#### 2.1 CREATE Organization

**Payload Schema:**
```typescript
{
  // Required fields
  organization_name: string,        // Display name
  organization_code: string,        // Unique code (case-insensitive)

  // Optional fields
  organization_type?: string,       // Default: 'business_unit'
  industry_classification?: string,
  parent_organization_id?: uuid,
  status?: string,                  // 'active' | 'inactive' | 'archived' (default: 'active')

  // AI insights (optional)
  ai_insights?: jsonb,
  ai_classification?: string,
  ai_confidence?: number,           // 0.0 - 1.0

  // Settings (optional)
  settings?: jsonb,

  // Bootstrap options
  bootstrap?: boolean,              // Auto-onboard actor as owner
  owner_user_id?: uuid,             // Additional owner user
  members?: [                       // Bulk member onboarding
    {
      user_id: uuid,
      role?: string                 // Default: 'member'
    }
  ]
}
```

**Example:**
```javascript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: 'actor-uuid',
  p_payload: {
    organization_name: 'ACME Corporation',
    organization_code: 'ACME',
    organization_type: 'business_unit',
    industry_classification: 'Technology',
    status: 'active',
    ai_confidence: 0.95,
    bootstrap: true,                // Auto-onboard actor as owner
    members: [
      { user_id: 'user1-uuid', role: 'admin' },
      { user_id: 'user2-uuid', role: 'employee' }
    ]
  }
})
```

**Success Response:**
```json
{
  "action": "CREATE",
  "organization": {
    "id": "org-uuid",
    "organization_name": "ACME Corporation",
    "organization_code": "ACME",
    "organization_type": "business_unit",
    "industry_classification": "Technology",
    "status": "active",
    "created_at": "2025-10-27T10:00:00Z",
    "updated_at": "2025-10-27T10:00:00Z",
    "created_by": "actor-uuid",
    "updated_by": "actor-uuid"
  }
}
```

**What It Does:**
1. ✅ Validates organization_name and organization_code (required)
2. ✅ Checks for duplicate organization_code (case-insensitive)
3. ✅ Creates organization row in `core_organizations`
4. ✅ Creates ORGANIZATION shadow entity in `core_entities`
5. ✅ If `bootstrap: true`, onboards actor as owner via `hera_onboard_user_v1`
6. ✅ If `owner_user_id` provided, onboards that user as owner
7. ✅ If `members[]` provided, onboards all members with specified roles

**Validation Rules:**
- `organization_name` - Required, non-empty
- `organization_code` - Required, unique (case-insensitive), non-empty
- `status` - Must be 'active', 'inactive', or 'archived'
- `ai_confidence` - Must be between 0.0 and 1.0

#### 2.2 UPDATE Organization

**Authorization:** Requires `ORG_OWNER` or `ORG_ADMIN` role

**Payload Schema:**
```typescript
{
  id: uuid,                         // Required - organization to update

  // All fields optional (only provided fields are updated)
  organization_name?: string,
  organization_code?: string,       // Must remain unique
  organization_type?: string,
  industry_classification?: string,
  parent_organization_id?: uuid,
  status?: string,
  ai_insights?: jsonb,
  ai_classification?: string,
  ai_confidence?: number,
  settings?: jsonb
}
```

**Example:**
```javascript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: 'actor-uuid',
  p_payload: {
    id: 'org-uuid',
    organization_name: 'ACME Corp (Updated)',
    status: 'active',
    ai_confidence: 0.98
  }
})
```

**Success Response:**
```json
{
  "action": "UPDATE",
  "organization": {
    "id": "org-uuid",
    "organization_name": "ACME Corp (Updated)",
    // ... updated fields
  }
}
```

**What It Does:**
1. ✅ Resolves actor role via `_hera_resolve_org_role`
2. ✅ Validates actor is OWNER or ADMIN
3. ✅ Checks organization_code uniqueness (if changed)
4. ✅ Updates organization row
5. ✅ Updates ORGANIZATION shadow entity (name, code, status)

#### 2.3 ARCHIVE Organization

**Authorization:** Requires `ORG_OWNER` or `ORG_ADMIN` role

**Payload Schema:**
```typescript
{
  id: uuid  // Required - organization to archive
}
```

**Example:**
```javascript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'ARCHIVE',
  p_actor_user_id: 'actor-uuid',
  p_payload: {
    id: 'org-uuid'
  }
})
```

**What It Does:**
1. ✅ Sets organization status to 'archived'
2. ✅ Updates ORGANIZATION shadow entity status

#### 2.4 GET Organization

**Authorization:** Requires membership in organization

**Payload Schema:**
```typescript
{
  id: uuid  // Required - organization to retrieve
}
```

**Example:**
```javascript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'GET',
  p_actor_user_id: 'actor-uuid',
  p_payload: {
    id: 'org-uuid'
  }
})
```

#### 2.5 LIST Organizations

**Payload:** None (uses p_limit and p_offset)

**Example:**
```javascript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'LIST',
  p_actor_user_id: 'actor-uuid',
  p_payload: {},
  p_limit: 50,
  p_offset: 0
})
```

**Success Response:**
```json
{
  "action": "LIST",
  "items": [
    { "id": "org1-uuid", "organization_name": "Org 1", ... },
    { "id": "org2-uuid", "organization_name": "Org 2", ... }
  ],
  "limit": 50,
  "offset": 0
}
```

---

### 3. `hera_auth_introspect_v1` - Login Introspection

**Purpose:** Returns complete authentication context for a user, including all organization memberships, roles, and permissions. Used at login time to populate session context.

**Signature:**
```sql
hera_auth_introspect_v1(
  p_actor_user_id uuid  -- platform USER entity id (auth.users.id)
) RETURNS jsonb
```

**Example Usage:**
```javascript
const result = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: '550e8400-e29b-41d4-a716-446655440000'
})

console.log(result.data)
```

**Success Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "introspected_at": "2025-10-27T10:00:00Z",
  "is_platform_admin": false,
  "organization_count": 3,
  "default_organization_id": "org1-uuid",
  "organizations": [
    {
      "id": "org1-uuid",
      "code": "ACME",
      "name": "ACME Corporation",
      "status": "active",
      "joined_at": "2025-10-27T09:00:00Z",
      "last_updated": "2025-10-27T09:30:00Z",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER", "ORG_ADMIN"],
      "is_owner": true,
      "is_admin": true
    },
    {
      "id": "org2-uuid",
      "code": "WIDGETS",
      "name": "Widgets Inc",
      "status": "active",
      "joined_at": "2025-10-26T14:00:00Z",
      "last_updated": "2025-10-26T14:00:00Z",
      "primary_role": "ORG_EMPLOYEE",
      "roles": ["ORG_EMPLOYEE"],
      "is_owner": false,
      "is_admin": false
    },
    {
      "id": "org3-uuid",
      "code": "DEMO",
      "name": "Demo Organization",
      "status": "active",
      "joined_at": "2025-10-25T08:00:00Z",
      "last_updated": "2025-10-25T08:00:00Z",
      "primary_role": "MEMBER",
      "roles": ["MEMBER"],
      "is_owner": false,
      "is_admin": false
    }
  ]
}
```

**Response Schema:**
```typescript
{
  user_id: uuid,
  introspected_at: timestamp,
  is_platform_admin: boolean,       // User has MEMBER_OF to platform org
  organization_count: number,
  default_organization_id: uuid | null,  // Most recently joined org
  organizations: [
    {
      id: uuid,
      code: string,
      name: string,
      status: string,
      joined_at: timestamp,         // When MEMBER_OF was created
      last_updated: timestamp,      // When MEMBER_OF was last updated
      primary_role: string,         // Effective primary role (precedence-based)
      roles: string[],              // All roles (sorted by precedence)
      is_owner: boolean,            // Convenience flag (primary_role rank = 1)
      is_admin: boolean             // Convenience flag (primary_role rank <= 2)
    }
  ]
}
```

**What It Does:**
1. ✅ Finds all MEMBER_OF relationships for user
2. ✅ Resolves organization details from `core_organizations`
3. ✅ Finds all HAS_ROLE relationships per organization
4. ✅ Computes primary role per org based on precedence
5. ✅ Aggregates all roles per org (deduplicated, sorted by precedence)
6. ✅ Derives `is_owner` and `is_admin` flags from role rank
7. ✅ Sorts organizations by `joined_at DESC` (most recent first)
8. ✅ Returns first org as `default_organization_id`

**Platform Admin Detection:**
- User has MEMBER_OF to an ORGANIZATION entity that lives in platform org (`00000000-0000-0000-0000-000000000000`)

**Performance Optimizations:**
- ✅ Single-pass aggregation (no function calls per row)
- ✅ Efficient precedence calculation using `_hera_role_rank()`
- ✅ Proper indexing on relationships table

---

### 4. `_hera_resolve_org_role` - Role Resolution (Internal)

**Purpose:** Resolves the effective primary role for a user within an organization. Used internally by authorization checks.

**Signature:**
```sql
_hera_resolve_org_role(
  p_actor_user_id   uuid,   -- platform USER entity id
  p_organization_id uuid    -- organization context
) RETURNS text
```

**Resolution Strategy (Priority Order):**
1. **Primary HAS_ROLE** - Explicit primary role (relationship_data.is_primary = true)
2. **Highest Precedence HAS_ROLE** - Role with highest precedence (lowest rank)
3. **MEMBER_OF Fallback** - Legacy role from relationship_data.role (most recent)
4. **Safe Default** - Returns 'MEMBER' if no roles found

**Example Usage (Internal):**
```sql
-- Used internally by organization CRUD
SELECT public._hera_resolve_org_role(
  'actor-uuid'::uuid,
  'org-uuid'::uuid
);
-- Returns: 'ORG_OWNER'
```

**Role Precedence:**
```sql
ORG_OWNER      = rank 1  (highest precedence)
ORG_ADMIN      = rank 2
ORG_MANAGER    = rank 3
ORG_ACCOUNTANT = rank 4
ORG_EMPLOYEE   = rank 5
MEMBER         = rank 6
<custom>       = rank 999 (lowest precedence)
```

---

### 5. `_hera_role_rank` - Role Rank Calculator (Internal)

**Purpose:** Returns precedence rank for a role code. Used for sorting and primary role selection.

**Signature:**
```sql
_hera_role_rank(p_code text) RETURNS int
```

**Example:**
```sql
SELECT public._hera_role_rank('ORG_OWNER');     -- Returns: 1
SELECT public._hera_role_rank('ORG_ADMIN');     -- Returns: 2
SELECT public._hera_role_rank('ORG_MANAGER');   -- Returns: 3
SELECT public._hera_role_rank('CUSTOM_ROLE');   -- Returns: 999
```

---

## Data Model Reference

### Entity Types

#### Platform USER Entity
```sql
-- Stored in platform organization (global scope)
{
  id: uuid,                          -- Same as auth.users.id
  organization_id: '00000000-0000-0000-0000-000000000000'::uuid,
  entity_type: 'USER',
  entity_name: 'John Doe',
  entity_code: '<auth.users.id>',
  smart_code: 'HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1',
  metadata: { email: 'john@example.com' },
  created_by: uuid,
  updated_by: uuid
}
```

#### ORGANIZATION Shadow Entity
```sql
-- Stored in tenant organization (tenant scope)
{
  id: uuid,
  organization_id: uuid,             -- Same as core_organizations.id
  entity_type: 'ORGANIZATION',
  entity_name: 'ACME Corporation',
  entity_code: 'ACME',
  smart_code: 'HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1',
  status: 'active',
  created_by: uuid,
  updated_by: uuid
}
```

#### ROLE Entity
```sql
-- Stored in tenant organization (tenant scope)
{
  id: uuid,
  organization_id: uuid,
  entity_type: 'ROLE',
  entity_name: 'ORG_OWNER',
  entity_code: 'ORG_OWNER',
  smart_code: 'HERA.UNIVERSAL.ENTITY.ROLE.CANONICAL.v1',
  metadata: { label: null },         -- Optional custom label
  created_by: uuid,
  updated_by: uuid
}
```

### Relationship Types

#### MEMBER_OF Relationship
```sql
-- User membership in organization (tenant scope)
{
  id: uuid,
  organization_id: uuid,             -- Tenant boundary
  from_entity_id: uuid,              -- Platform USER entity id
  to_entity_id: uuid,                -- ORGANIZATION entity id
  relationship_type: 'MEMBER_OF',
  relationship_direction: 'forward',
  relationship_data: {
    role: 'ORG_OWNER'                -- Legacy fallback role
  },
  smart_code: 'HERA.UNIVERSAL.REL.MEMBER_OF.USER_TO_ORG.v1',
  is_active: true,
  created_by: uuid,
  updated_by: uuid
}
```

#### HAS_ROLE Relationship
```sql
-- User role assignment (tenant scope)
{
  id: uuid,
  organization_id: uuid,             -- Tenant boundary
  from_entity_id: uuid,              -- Platform USER entity id
  to_entity_id: uuid,                -- ROLE entity id
  relationship_type: 'HAS_ROLE',
  relationship_direction: 'forward',
  relationship_data: {
    role_code: 'ORG_OWNER',          -- Canonical role code
    label: null,                     -- Optional display label
    is_primary: true                 -- Primary role flag
  },
  smart_code: 'HERA.UNIVERSAL.REL.HAS_ROLE.USER_TO_ROLE.v1',
  is_active: true,
  created_by: uuid,
  updated_by: uuid
}
```

---

## Security & Permissions

### Authorization Matrix

| Action                          | ORG_OWNER | ORG_ADMIN | ORG_MANAGER | ORG_EMPLOYEE | MEMBER |
|---------------------------------|-----------|-----------|-------------|--------------|--------|
| Create Organization             | ✅        | ✅        | ✅          | ✅           | ✅     |
| Update Organization             | ✅        | ✅        | ❌          | ❌           | ❌     |
| Archive Organization            | ✅        | ✅        | ❌          | ❌           | ❌     |
| View Organization               | ✅        | ✅        | ✅          | ✅           | ✅     |
| Onboard User                    | ✅        | ✅        | ❌          | ❌           | ❌     |
| Auth Introspection (own)        | ✅        | ✅        | ✅          | ✅           | ✅     |

### Security Features

1. **Actor Stamping** - Every operation records WHO made the change
2. **Tenant Isolation** - Relationships stored in organization boundaries
3. **Advisory Locking** - Prevents race conditions during role updates
4. **Primary Role Enforcement** - Unique index guarantees one primary role per (org, user)
5. **Role Precedence** - Automatic primary role selection based on hierarchy

### Advisory Locking

```sql
-- Per-user, per-org serialization during role updates
perform pg_advisory_xact_lock(
  hashtextextended(p_organization_id::text, 0),
  hashtextextended(v_platform_user_entity_id::text, 0)
);
```

### Unique Constraint

```sql
-- Guarantees at most one primary HAS_ROLE per (organization, user)
CREATE UNIQUE INDEX ux_has_role_primary_per_org_user
ON public.core_relationships (organization_id, from_entity_id)
WHERE relationship_type = 'HAS_ROLE'
  AND COALESCE(is_active, true)
  AND ((relationship_data->>'is_primary')::boolean IS TRUE);
```

---

## Common Workflows

### 1. New User Registration + Organization Creation

```javascript
// Step 1: Create organization with bootstrap
const orgResult = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: newUserId,
  p_payload: {
    organization_name: 'My New Company',
    organization_code: 'MYCO',
    bootstrap: true  // Auto-onboard actor as owner
  }
})

// Step 2: Get authentication context
const authResult = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: newUserId
})

// authResult.data contains:
// - default_organization_id: orgResult.data.organization.id
// - organizations[0].primary_role: 'ORG_OWNER'
// - organizations[0].is_owner: true
```

### 2. Invite User to Existing Organization

```javascript
// Invite user as admin
const result = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: invitedUserId,
  p_organization_id: existingOrgId,
  p_actor_user_id: adminUserId,
  p_role: 'admin'
})

// Send invitation email
await sendInvitationEmail({
  to: invitedUserEmail,
  organization: orgName,
  role: 'admin'
})
```

### 3. Promote User to Higher Role

```javascript
// Promote employee to manager
const result = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: userId,
  p_organization_id: orgId,
  p_actor_user_id: adminUserId,
  p_role: 'manager'
})

// Result automatically:
// - Creates new HAS_ROLE relationship to MANAGER role
// - Sets is_primary: true (manager has higher precedence than employee)
// - Demotes previous EMPLOYEE role to is_primary: false
```

### 4. Login Flow with Context Resolution

```javascript
// On login, resolve user context
const session = await supabase.auth.getSession()
const userId = session.data.session.user.id

const authContext = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userId
})

// Store in session/state
const userContext = {
  userId: authContext.data.user_id,
  defaultOrgId: authContext.data.default_organization_id,
  organizations: authContext.data.organizations,
  isPlatformAdmin: authContext.data.is_platform_admin
}

// Use for UI/navigation
const currentOrg = userContext.organizations.find(
  org => org.id === selectedOrgId
)
const canManageOrg = currentOrg.is_owner || currentOrg.is_admin
```

### 5. Bulk User Import

```javascript
// Import multiple users at once
const members = [
  { userId: 'user1-uuid', role: 'admin' },
  { userId: 'user2-uuid', role: 'manager' },
  { userId: 'user3-uuid', role: 'employee' },
  { userId: 'user4-uuid', role: 'employee' }
]

// Option A: Use organization CRUD with members array
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: adminUserId,
  p_payload: {
    organization_name: 'New Team',
    organization_code: 'TEAM',
    members: members.map(m => ({
      user_id: m.userId,
      role: m.role
    }))
  }
})

// Option B: Loop with onboard_user for existing org
for (const member of members) {
  await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: member.userId,
    p_organization_id: existingOrgId,
    p_actor_user_id: adminUserId,
    p_role: member.role
  })
}
```

---

## Error Handling

### Common Error Patterns

```javascript
try {
  const result = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: userId,
    p_organization_id: orgId,
    p_actor_user_id: actorId,
    p_role: role
  })

  if (result.error) {
    throw result.error
  }

  return result.data

} catch (error) {
  // Parse error message
  if (error.message.includes('actor_not_member')) {
    return { error: 'Actor does not have permission', code: 'FORBIDDEN' }
  }

  if (error.message.includes('duplicate')) {
    return { error: 'Organization code already exists', code: 'CONFLICT' }
  }

  if (error.message.includes('not found')) {
    return { error: 'User not found', code: 'NOT_FOUND' }
  }

  if (error.message.includes('required')) {
    return { error: 'Missing required field', code: 'BAD_REQUEST' }
  }

  // Unknown error
  console.error('HERA RBAC Error:', error)
  return { error: 'Internal error', code: 'INTERNAL_ERROR' }
}
```

### Error Messages Reference

| Error Message                                  | Cause                                    | Resolution                              |
|------------------------------------------------|------------------------------------------|-----------------------------------------|
| `p_supabase_user_id is required`               | Missing user id parameter                | Provide valid auth.users.id             |
| `p_organization_id is required`                | Missing organization id parameter        | Provide valid organization id           |
| `Supabase user not found`                      | Invalid auth.users.id                    | Ensure user exists in auth.users        |
| `actor_not_member`                             | Actor not member of organization         | Onboard actor first                     |
| `forbidden: role X cannot Y organization`      | Insufficient permissions                 | Use OWNER or ADMIN role                 |
| `duplicate: organization_code already exists`  | Organization code collision              | Use unique organization_code            |
| `invalid status`                               | Invalid status value                     | Use 'active', 'inactive', or 'archived' |
| `ai_confidence must be between 0 and 1`        | Invalid confidence value                 | Provide value between 0.0 and 1.0       |
| `unique violation while setting primary role`  | Race condition (extremely rare)          | Retry operation                         |

---

## Performance Considerations

### Indexing

**Critical indexes for performance:**
```sql
-- Primary role uniqueness + performance
CREATE UNIQUE INDEX ux_has_role_primary_per_org_user
ON public.core_relationships (organization_id, from_entity_id)
WHERE relationship_type = 'HAS_ROLE'
  AND COALESCE(is_active, true)
  AND ((relationship_data->>'is_primary')::boolean IS TRUE);

-- Relationship lookups
CREATE INDEX idx_relationships_from_entity
ON public.core_relationships (from_entity_id, relationship_type);

CREATE INDEX idx_relationships_to_entity
ON public.core_relationships (to_entity_id, relationship_type);

-- Organization isolation
CREATE INDEX idx_relationships_org
ON public.core_relationships (organization_id);
```

### Query Optimization

**Auth introspection optimizations:**
- Single-pass aggregation (no function calls per row)
- Efficient role precedence calculation
- Proper JOIN ordering (memberships → orgs → roles)
- DISTINCT ON for primary role selection

**Advisory locking:**
- Per-user, per-org serialization
- Transaction-level locks (released automatically)
- Hash-based lock keys (no collisions)

### Caching Recommendations

```javascript
// Cache auth introspection result for session duration
const SESSION_CACHE_TTL = 3600 // 1 hour

async function getAuthContext(userId) {
  const cacheKey = `auth:context:${userId}`

  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Fetch from database
  const result = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: userId
  })

  // Cache result
  await redis.setex(cacheKey, SESSION_CACHE_TTL, JSON.stringify(result.data))

  return result.data
}

// Invalidate cache on role changes
async function invalidateAuthCache(userId) {
  await redis.del(`auth:context:${userId}`)
}
```

---

## Testing

### Unit Test Examples

```javascript
describe('HERA RBAC API', () => {

  it('should onboard user as owner', async () => {
    const result = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: testUserId,
      p_organization_id: testOrgId,
      p_actor_user_id: testUserId,
      p_role: 'owner'
    })

    expect(result.data.success).toBe(true)
    expect(result.data.role_code).toBe('ORG_OWNER')
  })

  it('should resolve primary role correctly', async () => {
    // Onboard with employee role
    await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: testUserId,
      p_organization_id: testOrgId,
      p_actor_user_id: adminUserId,
      p_role: 'employee'
    })

    // Promote to admin (should become primary)
    await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: testUserId,
      p_organization_id: testOrgId,
      p_actor_user_id: adminUserId,
      p_role: 'admin'
    })

    // Verify primary role
    const authContext = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: testUserId
    })

    const org = authContext.data.organizations.find(o => o.id === testOrgId)
    expect(org.primary_role).toBe('ORG_ADMIN')
    expect(org.roles).toContain('ORG_ADMIN')
    expect(org.roles).toContain('ORG_EMPLOYEE')
  })

  it('should enforce authorization', async () => {
    // Try to update org as employee (should fail)
    const result = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: employeeUserId,
      p_payload: {
        id: testOrgId,
        organization_name: 'Hacked Name'
      }
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toContain('forbidden')
  })

})
```

---

## Migration Guide

### From Legacy MEMBER_OF-Only Pattern

**Before (Legacy):**
```sql
-- Old pattern: role in MEMBER_OF relationship_data only
SELECT (cr.relationship_data->>'role')::text AS role
FROM core_relationships cr
WHERE cr.relationship_type = 'MEMBER_OF'
  AND cr.from_entity_id = user_id
  AND cr.organization_id = org_id
```

**After (Current):**
```sql
-- New pattern: HAS_ROLE relationships with primary precedence
SELECT public._hera_resolve_org_role(user_id, org_id) AS primary_role
```

**Migration Steps:**
1. ✅ Existing MEMBER_OF relationships remain as fallback
2. ✅ New onboarding creates both MEMBER_OF and HAS_ROLE
3. ✅ Role resolution prioritizes HAS_ROLE over MEMBER_OF
4. ✅ No breaking changes - legacy paths still work

---

## Best Practices

### 1. Always Use Service Role for Server-Side Operations

```javascript
// ✅ CORRECT - Server-side with service role
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const result = await supabaseAdmin.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: userId,
  p_organization_id: orgId,
  p_actor_user_id: adminId,
  p_role: 'admin'
})

// ❌ WRONG - Client-side (will fail due to RLS)
const result = await supabase.rpc('hera_onboard_user_v1', {
  // ... will be blocked by Row Level Security
})
```

### 2. Cache Auth Context in Session

```javascript
// Cache introspection result for session duration
const authContext = await getAuthContext(userId) // Cached helper

// Use cached context for authorization checks
const canManage = authContext.organizations
  .find(org => org.id === selectedOrgId)
  ?.is_admin || false
```

### 3. Validate Role Precedence When Promoting

```javascript
// Always promote through onboard_user (handles precedence automatically)
await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: userId,
  p_organization_id: orgId,
  p_actor_user_id: adminId,
  p_role: 'manager'  // Automatically becomes primary if higher than current
})
```

### 4. Use Bootstrap for New Organization Creation

```javascript
// Let bootstrap handle initial owner setup
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_payload: {
    organization_name: 'My Company',
    organization_code: 'MYCO',
    bootstrap: true  // Actor becomes owner automatically
  }
})
```

### 5. Invalidate Cache on Role Changes

```javascript
// After role changes, invalidate auth cache
await supabase.rpc('hera_onboard_user_v1', { ... })

// Invalidate cache
await invalidateAuthCache(userId)

// Re-fetch context
const updatedContext = await getAuthContext(userId)
```

---

## Troubleshooting

### Issue: "actor_not_member" error

**Cause:** Actor attempting operation without organization membership

**Solution:**
```javascript
// Ensure actor is onboarded first
await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: actorId,
  p_organization_id: orgId,
  p_actor_user_id: serviceRoleId,
  p_role: 'admin'
})
```

### Issue: Primary role not updating

**Cause:** Role with lower precedence not overriding higher precedence role

**Solution:**
```javascript
// Primary role selection is automatic based on precedence
// OWNER (rank 1) > ADMIN (rank 2) > MANAGER (rank 3) > etc.

// If user has OWNER role, adding EMPLOYEE won't change primary
// To change primary, add a higher precedence role or remove existing roles
```

### Issue: Duplicate organization_code error

**Cause:** Organization code collision (case-insensitive)

**Solution:**
```javascript
// Check existing codes before creation
const existing = await supabase
  .from('core_organizations')
  .select('organization_code')
  .ilike('organization_code', newCode)
  .single()

if (existing.data) {
  // Code already exists, prompt user for different code
}
```

### Issue: Performance degradation with many organizations

**Cause:** Auth introspection returning too many organizations

**Solution:**
```javascript
// Paginate organization list in UI
const visibleOrgs = authContext.organizations.slice(0, 10)

// Or filter by status
const activeOrgs = authContext.organizations.filter(
  org => org.status === 'active'
)
```

---

## Changelog

### Version 1.0 (2025-10-27)

**Initial Release:**
- ✅ `hera_onboard_user_v1` - Complete user onboarding with role precedence
- ✅ `hera_organizations_crud_v1` - Full organization CRUD with bulk member onboarding
- ✅ `hera_auth_introspect_v1` - Login-time authentication context resolution
- ✅ `_hera_resolve_org_role` - Internal role resolution helper
- ✅ `_hera_role_rank` - Internal role precedence calculator
- ✅ Primary role enforcement via unique index
- ✅ Advisory locking for race condition prevention
- ✅ Complete actor stamping audit trail
- ✅ Platform/tenant architecture support

---

## Support

For issues, questions, or feature requests related to HERA RBAC:

1. **Documentation:** Refer to this document first
2. **Schema Reference:** `/docs/schema/hera-sacred-six-schema.yaml`
3. **Architecture Guide:** `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`
4. **Issue Tracking:** Create issue in repository

---

## Appendix

### Related Documentation

- **Sacred Six Schema:** `/docs/schema/hera-sacred-six-schema.yaml`
- **Authorization Architecture:** `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`
- **Smart Codes Guide:** `/docs/playbooks/_shared/SMART_CODE_GUIDE.md`
- **Universal API V2:** `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`
- **CLAUDE.md:** `/CLAUDE.md` (complete development guide)

### Database Grants

```sql
-- All functions granted to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.hera_onboard_user_v1 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hera_organizations_crud_v1 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hera_auth_introspect_v1 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._hera_resolve_org_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._hera_role_rank TO authenticated, service_role;
```

### Smart Code Reference

| Entity/Relationship Type | Smart Code                                              |
|--------------------------|---------------------------------------------------------|
| Platform USER            | `HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1`                  |
| ORGANIZATION (shadow)    | `HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1`          |
| ROLE                     | `HERA.UNIVERSAL.ENTITY.ROLE.CANONICAL.v1`               |
| MEMBER_OF relationship   | `HERA.UNIVERSAL.REL.MEMBER_OF.USER_TO_ORG.v1`           |
| HAS_ROLE relationship    | `HERA.UNIVERSAL.REL.HAS_ROLE.USER_TO_ROLE.v1`           |

---

**End of Document**
