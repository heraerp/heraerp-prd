# HERA User Authorization RPC Functions - Complete Guide

**Date:** 2025-10-16
**Location:** `/mcp-server/USER_AUTHORIZATION_RPC_GUIDE.md`
**Status:** ✅ Production-Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core RPC Functions](#core-rpc-functions)
4. [Complete Usage Examples](#complete-usage-examples)
5. [Integration Patterns](#integration-patterns)
6. [Security & Best Practices](#security--best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Is

HERA's user authorization system uses **Sacred Six architecture** to manage user-organization relationships through a set of purpose-built RPC functions. These functions handle:

- ✅ Adding users to organizations
- ✅ Managing user roles and permissions
- ✅ Querying user memberships
- ✅ Removing users from organizations
- ✅ Updating user access levels

### Why Use RPCs Instead of Direct Queries?

| Direct Queries | RPC Functions |
|----------------|---------------|
| ❌ Multiple API calls needed | ✅ Single call does everything |
| ❌ Complex client-side logic | ✅ Server-side validation |
| ❌ No automatic audit trail | ✅ Built-in audit logging |
| ❌ Risk of data inconsistency | ✅ Atomic transactions |
| ❌ Manual permission checks | ✅ Automatic permission setup |

---

## Architecture

### Sacred Six Foundation

User authorization in HERA follows the **Sacred Six** pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SACRED SIX ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  core_entities                  core_relationships              │
│  ┌──────────────┐              ┌──────────────────┐            │
│  │ USER         │──────────────│ MEMBER_OF        │            │
│  │ entity_type  │  from_entity │ relationship_type│            │
│  │ metadata {   │──────────────│ relationship_data│            │
│  │  auth_user_id│              │ {                │            │
│  │ }            │              │   role: "OWNER"  │            │
│  └──────────────┘              │   permissions: []│            │
│         │                      │ }                │            │
│         │ org_id:              └──────────────────┘            │
│         │ 00000..000                    │                      │
│         │                              to_entity               │
│         │                               │                      │
│  ┌──────▼──────────────────────────────▼──────┐               │
│  │ ORGANIZATION                               │               │
│  │ id: 378f24fb-...                           │               │
│  └────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Platform Organization** (`00000000-0000-0000-0000-000000000000`)
   - All USER entities stored here
   - Shared across all organizations
   - Single source of truth for user identity

2. **Relationship-Based Membership**
   - User → `MEMBER_OF` → Organization
   - Role and permissions stored in `relationship_data`
   - Smart Code: `HERA.SYSTEM.USER.REL.MEMBER_OF_ORG.V1`

3. **Supabase Auth Integration**
   - User entities link to `auth.users` via `metadata.auth_user_id`
   - RPCs accept Supabase auth user ID as parameter
   - Automatic lookup to user entity

---

## Core RPC Functions

### 1. setup_user_membership

**Purpose:** Quick user onboarding - adds user to organization with default permissions.

#### **Signature**
```sql
setup_user_membership(
  p_supabase_user_id UUID,
  p_organization_id UUID
)
RETURNS JSONB
```

#### **Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_supabase_user_id` | UUID | ✅ Yes | Supabase auth user ID (from `auth.users` table) |
| `p_organization_id` | UUID | ✅ Yes | Target organization ID |

#### **Returns**

```typescript
{
  success: boolean
  membership_id: string        // UUID of created relationship
  user_entity_id: string       // User's entity ID
  organization_id: string      // Organization ID
  name: string                 // User's full name
  email: string                // User's email
  message: string              // Success message
}
```

#### **What It Does**

1. ✅ Validates organization exists and is active
2. ✅ Finds user entity in platform organization (creates if needed)
3. ✅ Creates `MEMBER_OF` relationship in `core_relationships`
4. ✅ Assigns **default role** (`OWNER`) and **full permissions** (`["*"]`)
5. ✅ Returns membership details

#### **Example Usage**

```typescript
// During user signup or organization selection
const { data, error } = await supabase.rpc('setup_user_membership', {
  p_supabase_user_id: session.user.id,  // From Supabase auth
  p_organization_id: selectedOrgId
})

if (error) {
  console.error('Failed to setup membership:', error.message)
  return
}

console.log('✅ User added to org:', data.membership_id)
console.log('   Role:', data.role)
console.log('   User:', data.name, data.email)

// Redirect to organization
router.push(`/${orgSubdomain}/dashboard`)
```

#### **Use Cases**

- 🎯 **User Onboarding** - First-time user joining organization
- 🎯 **Organization Selection** - User picking org during signup
- 🎯 **Quick Access Setup** - Admin adds user with default permissions

#### **Performance**
- ⏱️ **Speed:** ~86ms (single transaction)
- 🔄 **Idempotent:** Safe to call multiple times
- 🔒 **Security:** SECURITY DEFINER (elevated privileges)

---

### 2. assign_user_to_organization

**Purpose:** Detailed user assignment with explicit role and permissions control.

#### **Signature**
```sql
assign_user_to_organization(
  p_user_auth_id UUID,
  p_organization_id UUID,
  p_role TEXT DEFAULT 'user',
  p_permissions JSONB DEFAULT '["read"]'::JSONB,
  p_assigner_auth_id UUID DEFAULT NULL
)
RETURNS JSONB
```

#### **Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `p_user_auth_id` | UUID | ✅ Yes | - | Supabase auth user ID |
| `p_organization_id` | UUID | ✅ Yes | - | Target organization ID |
| `p_role` | TEXT | ❌ No | `'user'` | Role name (e.g., 'admin', 'manager', 'user') |
| `p_permissions` | JSONB | ❌ No | `'["read"]'` | Array of permissions |
| `p_assigner_auth_id` | UUID | ❌ No | `NULL` | User ID who is performing the assignment (for audit) |

#### **Returns**

```typescript
{
  success: boolean
  relationship_id: string      // UUID of created/updated relationship
  user_entity_id: string       // User's entity ID
  organization_id: string      // Organization ID
  role: string                 // Assigned role
  permissions: string[]        // Granted permissions
  action: string               // "created" or "updated"
  message: string              // Success message
}
```

#### **What It Does**

1. ✅ Validates organization exists and is active
2. ✅ Finds user entity in platform organization
3. ✅ Creates or **updates** existing `USER_MEMBER_OF_ORG` relationship
4. ✅ Assigns **specified role** and **permissions**
5. ✅ Creates **audit transaction** in `universal_transactions`
6. ✅ Tracks who assigned the user (`p_assigner_auth_id`)

#### **Example Usage**

```typescript
// Admin assigns user as manager with specific permissions
const { data, error } = await supabase.rpc('assign_user_to_organization', {
  p_user_auth_id: newUserAuthId,
  p_organization_id: orgId,
  p_role: 'manager',
  p_permissions: ['read', 'write', 'manage_team'],
  p_assigner_auth_id: adminAuthId  // For audit trail
})

if (error) {
  console.error('Assignment failed:', error.message)
  return
}

console.log('✅ User assigned:', data.action)
console.log('   Role:', data.role)
console.log('   Permissions:', data.permissions)
console.log('   Relationship ID:', data.relationship_id)
```

#### **Common Roles and Permissions**

```typescript
// Standard role configurations
const ROLE_CONFIGS = {
  owner: {
    role: 'owner',
    permissions: ['*']  // Full access
  },
  admin: {
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings']
  },
  manager: {
    role: 'manager',
    permissions: ['read', 'write', 'manage_team']
  },
  user: {
    role: 'user',
    permissions: ['read', 'write']
  },
  viewer: {
    role: 'viewer',
    permissions: ['read']
  }
}
```

#### **Use Cases**

- 🎯 **Team Member Invitation** - Admin invites user with specific role
- 🎯 **Role-Based Access Control** - Granular permission assignment
- 🎯 **Update Existing Membership** - Change user's role/permissions
- 🎯 **Audit Trail** - Track who assigned whom

#### **Update Behavior**

If relationship already exists:
- ✅ **Updates** role and permissions (doesn't create duplicate)
- ✅ Preserves original `created_at`
- ✅ Updates `updated_at` timestamp
- ✅ Logs "updated" action in audit trail

---

### 3. get_user_organization_memberships

**Purpose:** Retrieve all organizations a user belongs to.

#### **Signature**
```sql
get_user_organization_memberships(
  p_user_auth_id UUID
)
RETURNS JSONB
```

#### **Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_user_auth_id` | UUID | ✅ Yes | Supabase auth user ID |

#### **Returns**

```typescript
{
  success: boolean
  user_entity_id: string
  user_auth_id: string
  membership_count: number
  memberships: Array<{
    organization_id: string
    organization_name: string
    organization_type: string
    subdomain: string | null
    subscription_plan: string
    is_active: boolean
    role: string
    permissions: string[]
    assigned_at: string
    relationship_created_at: string
    relationship_id: string
  }>
}
```

#### **What It Does**

1. ✅ Finds user entity in platform organization
2. ✅ Queries all `USER_MEMBER_OF_ORG` relationships
3. ✅ Joins with `core_organizations` for org details
4. ✅ Returns complete membership list with roles and permissions

#### **Example Usage**

```typescript
// Get all organizations for logged-in user
const { data, error } = await supabase.rpc('get_user_organization_memberships', {
  p_user_auth_id: session.user.id
})

if (error) {
  console.error('Failed to fetch memberships:', error.message)
  return
}

console.log(`User belongs to ${data.membership_count} organization(s):`)
data.memberships.forEach((org, idx) => {
  console.log(`${idx + 1}. ${org.organization_name}`)
  console.log(`   Role: ${org.role}`)
  console.log(`   Subdomain: ${org.subdomain}`)
  console.log(`   Active: ${org.is_active}`)
})

// Build organization selector
const orgOptions = data.memberships
  .filter(org => org.is_active)
  .map(org => ({
    id: org.organization_id,
    name: org.organization_name,
    subdomain: org.subdomain,
    role: org.role
  }))
```

#### **Use Cases**

- 🎯 **Organization Selector** - Let user choose which org to access
- 🎯 **Multi-Tenant Navigation** - Show all orgs user can access
- 🎯 **Permission Checks** - Verify user has access to specific org
- 🎯 **Profile Dashboard** - Display user's organization memberships

#### **Response Example**

```json
{
  "success": true,
  "user_entity_id": "2a81e783-85a0-4c5d-a434-916d3f72594a",
  "user_auth_id": "3ced4979-4c09-4e1e-8667-6707cfe6ec77",
  "membership_count": 2,
  "memberships": [
    {
      "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
      "organization_name": "Hair Talkz Salon",
      "organization_type": "salon",
      "subdomain": "hairtalkz",
      "subscription_plan": "premium",
      "is_active": true,
      "role": "owner",
      "permissions": ["*"],
      "assigned_at": "2025-10-09T17:59:02Z",
      "relationship_created_at": "2025-10-09T17:59:02Z",
      "relationship_id": "1c97f88d-8c25-4cec-a786-ec3a24b5a8fe"
    },
    {
      "organization_id": "abc123...",
      "organization_name": "Test Salon",
      "organization_type": "salon",
      "subdomain": "testsalon",
      "subscription_plan": "basic",
      "is_active": true,
      "role": "manager",
      "permissions": ["read", "write", "manage_team"],
      "assigned_at": "2025-10-10T10:00:00Z",
      "relationship_created_at": "2025-10-10T10:00:00Z",
      "relationship_id": "def456..."
    }
  ]
}
```

---

### 4. update_user_role_in_organization

**Purpose:** Change a user's role and permissions in an organization.

#### **Signature**
```sql
update_user_role_in_organization(
  p_user_auth_id UUID,
  p_organization_id UUID,
  p_new_role TEXT,
  p_new_permissions JSONB DEFAULT NULL,
  p_updater_auth_id UUID DEFAULT NULL
)
RETURNS JSONB
```

#### **Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_user_auth_id` | UUID | ✅ Yes | Supabase auth user ID of user to update |
| `p_organization_id` | UUID | ✅ Yes | Organization ID |
| `p_new_role` | TEXT | ✅ Yes | New role name |
| `p_new_permissions` | JSONB | ❌ No | New permissions (if null, keeps existing) |
| `p_updater_auth_id` | UUID | ❌ No | User ID performing the update (for audit) |

#### **Returns**

```typescript
{
  success: boolean
  relationship_id: string
  user_entity_id: string
  organization_id: string
  old_role: string
  new_role: string
  old_permissions: string[]
  new_permissions: string[]
  message: string
}
```

#### **What It Does**

1. ✅ Finds user entity and existing relationship
2. ✅ Validates user is member of organization
3. ✅ Updates role and permissions in relationship metadata
4. ✅ Preserves other metadata fields
5. ✅ Creates **audit transaction** tracking the change
6. ✅ Returns old and new values for comparison

#### **Example Usage**

```typescript
// Promote user from viewer to manager
const { data, error } = await supabase.rpc('update_user_role_in_organization', {
  p_user_auth_id: userToPromote,
  p_organization_id: orgId,
  p_new_role: 'manager',
  p_new_permissions: ['read', 'write', 'manage_team'],
  p_updater_auth_id: adminAuthId
})

if (error) {
  console.error('Role update failed:', error.message)
  return
}

console.log('✅ Role updated successfully')
console.log('   Old role:', data.old_role)
console.log('   New role:', data.new_role)
console.log('   Old permissions:', data.old_permissions)
console.log('   New permissions:', data.new_permissions)

// Notify user
await sendNotification(userToPromote, {
  title: 'Role Updated',
  message: `Your role has been changed from ${data.old_role} to ${data.new_role}`
})
```

#### **Use Cases**

- 🎯 **Promotions/Demotions** - Change user access level
- 🎯 **Permission Adjustments** - Fine-tune user capabilities
- 🎯 **Role Management** - Admin adjusts team member roles
- 🎯 **Temporary Access** - Grant/revoke specific permissions

#### **Audit Trail**

Creates transaction record:
```json
{
  "transaction_type": "user_role_update",
  "transaction_code": "USER-ROLE-UPDATE-1697123456",
  "smart_code": "HERA.AUTH.USER.ROLE.UPDATE.V1",
  "metadata": {
    "relationship_id": "...",
    "old_role": "viewer",
    "new_role": "manager",
    "old_permissions": ["read"],
    "new_permissions": ["read", "write", "manage_team"],
    "updated_by": "admin-auth-id"
  }
}
```

---

### 5. remove_user_from_organization

**Purpose:** Remove a user's access to an organization.

#### **Signature**
```sql
remove_user_from_organization(
  p_user_auth_id UUID,
  p_organization_id UUID,
  p_remover_auth_id UUID DEFAULT NULL
)
RETURNS JSONB
```

#### **Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_user_auth_id` | UUID | ✅ Yes | Supabase auth user ID to remove |
| `p_organization_id` | UUID | ✅ Yes | Organization ID |
| `p_remover_auth_id` | UUID | ❌ No | User ID performing the removal (for audit) |

#### **Returns**

```typescript
{
  success: boolean
  user_entity_id: string
  organization_id: string
  removed_relationship_id: string
  message: string
}
```

#### **What It Does**

1. ✅ Finds user entity in platform organization
2. ✅ Validates user has membership relationship
3. ✅ **Deletes** the `USER_MEMBER_OF_ORG` relationship
4. ✅ Creates **audit transaction** for removal
5. ✅ Returns removed relationship ID

#### **Example Usage**

```typescript
// Remove user from organization (e.g., user left company)
const { data, error } = await supabase.rpc('remove_user_from_organization', {
  p_user_auth_id: userToRemove,
  p_organization_id: orgId,
  p_remover_auth_id: adminAuthId
})

if (error) {
  console.error('Removal failed:', error.message)
  return
}

console.log('✅ User removed from organization')
console.log('   User entity:', data.user_entity_id)
console.log('   Removed relationship:', data.removed_relationship_id)

// Invalidate user's sessions for this org
await supabase.auth.admin.signOut(userToRemove)

// Notify user
await sendNotification(userToRemove, {
  title: 'Access Removed',
  message: 'You have been removed from the organization'
})
```

#### **Use Cases**

- 🎯 **Employee Offboarding** - Remove access when user leaves
- 🎯 **Security Response** - Revoke compromised user access
- 🎯 **Subscription Downgrade** - Reduce team size
- 🎯 **User Request** - User wants to leave organization

#### **Important Notes**

- ⚠️ **Hard Delete**: Relationship is permanently removed (not soft delete)
- ⚠️ **No User Entity Deletion**: User entity remains in platform org
- ⚠️ **Audit Trail Preserved**: Removal is logged in `universal_transactions`
- ⚠️ **Immediate Effect**: User loses access instantly

#### **Audit Trail**

Creates transaction record:
```json
{
  "transaction_type": "user_removal",
  "transaction_code": "USER-REMOVE-1697123456",
  "smart_code": "HERA.AUTH.USER.REMOVAL.ORG.V1",
  "metadata": {
    "removed_relationship_id": "...",
    "removed_by": "admin-auth-id",
    "action": "removed"
  }
}
```

---

## Complete Usage Examples

### Example 1: User Onboarding Flow

```typescript
// Step 1: User signs up with Supabase Auth
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'newuser@example.com',
  password: 'secure-password'
})

if (authError) {
  console.error('Signup failed:', authError.message)
  return
}

const newUserId = authData.user!.id

// Step 2: User selects organization
const selectedOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

// Step 3: Setup membership with default permissions
const { data: membership, error: membershipError } = await supabase.rpc(
  'setup_user_membership',
  {
    p_supabase_user_id: newUserId,
    p_organization_id: selectedOrgId
  }
)

if (membershipError) {
  console.error('Membership setup failed:', membershipError.message)
  return
}

console.log('✅ User onboarded successfully!')
console.log('   Membership ID:', membership.membership_id)
console.log('   User:', membership.name, membership.email)

// Step 4: Redirect to organization dashboard
router.push(`/${orgSubdomain}/dashboard`)
```

---

### Example 2: Admin Invites Team Member

```typescript
// Admin invites user with specific role
async function inviteTeamMember(
  adminAuthId: string,
  inviteeEmail: string,
  role: 'admin' | 'manager' | 'user',
  orgId: string
) {
  // Step 1: Check if user exists in Supabase Auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers.users.find(u => u.email === inviteeEmail)

  let userAuthId: string

  if (existingUser) {
    // User exists, use their ID
    userAuthId = existingUser.id
  } else {
    // Create new user (with email invitation)
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: inviteeEmail,
      email_confirm: false,
      user_metadata: { invited_by: adminAuthId }
    })

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    userAuthId = newUser.user!.id

    // Send invitation email
    await sendInvitationEmail(inviteeEmail, orgId)
  }

  // Step 2: Assign user to organization with role
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
    manager: ['read', 'write', 'manage_team'],
    user: ['read', 'write']
  }

  const { data, error } = await supabase.rpc('assign_user_to_organization', {
    p_user_auth_id: userAuthId,
    p_organization_id: orgId,
    p_role: role,
    p_permissions: permissions[role],
    p_assigner_auth_id: adminAuthId
  })

  if (error) {
    throw new Error(`Failed to assign user: ${error.message}`)
  }

  console.log('✅ Team member invited:', data.user_entity_id)
  console.log('   Role:', data.role)
  console.log('   Action:', data.action)

  return data
}

// Usage
await inviteTeamMember(
  session.user.id,
  'newmember@example.com',
  'manager',
  currentOrgId
)
```

---

### Example 3: Multi-Organization User Switcher

```typescript
// Component: OrganizationSwitcher
function OrganizationSwitcher() {
  const [orgs, setOrgs] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function loadOrganizations() {
      if (!user) return

      const { data, error } = await supabase.rpc(
        'get_user_organization_memberships',
        { p_user_auth_id: user.id }
      )

      if (error) {
        console.error('Failed to load organizations:', error.message)
        setLoading(false)
        return
      }

      setOrgs(data.memberships.filter(org => org.is_active))
      setLoading(false)
    }

    loadOrganizations()
  }, [user])

  const switchOrganization = (org: Membership) => {
    // Update context and redirect
    router.push(`/${org.subdomain}/dashboard`)
  }

  if (loading) return <Spinner />

  return (
    <div className="org-switcher">
      <h3>Your Organizations ({orgs.length})</h3>
      {orgs.map(org => (
        <button
          key={org.organization_id}
          onClick={() => switchOrganization(org)}
          className="org-item"
        >
          <div className="org-name">{org.organization_name}</div>
          <div className="org-role">{org.role}</div>
          <div className="org-subdomain">/{org.subdomain}</div>
        </button>
      ))}
    </div>
  )
}
```

---

### Example 4: Role Management Dashboard

```typescript
// Admin dashboard for managing team member roles
async function promoteUserToAdmin(
  targetUserId: string,
  orgId: string,
  adminUserId: string
) {
  const { data, error } = await supabase.rpc('update_user_role_in_organization', {
    p_user_auth_id: targetUserId,
    p_organization_id: orgId,
    p_new_role: 'admin',
    p_new_permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
    p_updater_auth_id: adminUserId
  })

  if (error) {
    console.error('Promotion failed:', error.message)
    throw error
  }

  console.log('✅ User promoted to admin')
  console.log('   Old role:', data.old_role)
  console.log('   New role:', data.new_role)

  // Log activity
  await logActivity({
    type: 'user_role_updated',
    target_user: targetUserId,
    old_role: data.old_role,
    new_role: data.new_role,
    performed_by: adminUserId
  })

  return data
}

async function demoteUserToViewer(
  targetUserId: string,
  orgId: string,
  adminUserId: string
) {
  const { data, error } = await supabase.rpc('update_user_role_in_organization', {
    p_user_auth_id: targetUserId,
    p_organization_id: orgId,
    p_new_role: 'viewer',
    p_new_permissions: ['read'],
    p_updater_auth_id: adminUserId
  })

  if (error) {
    console.error('Demotion failed:', error.message)
    throw error
  }

  console.log('✅ User demoted to viewer')
  return data
}
```

---

### Example 5: User Offboarding

```typescript
// Remove user from organization when they leave
async function offboardUser(
  userToRemove: string,
  orgId: string,
  adminUserId: string
) {
  // Step 1: Confirm removal
  const confirmed = await confirmDialog(
    'Remove User',
    'Are you sure you want to remove this user from the organization? This action cannot be undone.'
  )

  if (!confirmed) return

  // Step 2: Remove from organization
  const { data, error } = await supabase.rpc('remove_user_from_organization', {
    p_user_auth_id: userToRemove,
    p_organization_id: orgId,
    p_remover_auth_id: adminUserId
  })

  if (error) {
    console.error('Removal failed:', error.message)
    throw error
  }

  console.log('✅ User removed from organization')
  console.log('   Relationship ID:', data.removed_relationship_id)

  // Step 3: Sign out user from this org
  await supabase.auth.admin.signOut(userToRemove)

  // Step 4: Send notification
  await sendNotification(userToRemove, {
    title: 'Access Removed',
    message: 'You have been removed from the organization.',
    type: 'warning'
  })

  // Step 5: Log activity
  await logActivity({
    type: 'user_removed',
    target_user: userToRemove,
    organization: orgId,
    performed_by: adminUserId
  })

  return data
}
```

---

## Integration Patterns

### Pattern 1: React Hook for User Memberships

```typescript
// hooks/useUserMemberships.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/HERAAuthProvider'

interface Membership {
  organization_id: string
  organization_name: string
  organization_type: string
  subdomain: string | null
  role: string
  permissions: string[]
  is_active: boolean
}

export function useUserMemberships() {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMemberships() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'get_user_organization_memberships',
          { p_user_auth_id: user.id }
        )

        if (rpcError) throw rpcError

        setMemberships(data.memberships.filter((org: Membership) => org.is_active))
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch memberships:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberships()
  }, [user?.id])

  return { memberships, loading, error }
}

// Usage in component
function MyOrganizations() {
  const { memberships, loading, error } = useUserMemberships()

  if (loading) return <div>Loading organizations...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>My Organizations</h2>
      {memberships.map(org => (
        <div key={org.organization_id}>
          <h3>{org.organization_name}</h3>
          <p>Role: {org.role}</p>
          <p>Subdomain: /{org.subdomain}</p>
        </div>
      ))}
    </div>
  )
}
```

---

### Pattern 2: Middleware for Organization Access Control

```typescript
// middleware/checkOrgAccess.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function checkOrganizationAccess(
  request: NextRequest,
  orgId: string
): Promise<{ hasAccess: boolean; role?: string; permissions?: string[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from session
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { hasAccess: false }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { hasAccess: false }
  }

  // Check user's memberships
  const { data, error: membershipError } = await supabase.rpc(
    'get_user_organization_memberships',
    { p_user_auth_id: user.id }
  )

  if (membershipError || !data.success) {
    return { hasAccess: false }
  }

  // Find membership for this org
  const membership = data.memberships.find(
    (m: any) => m.organization_id === orgId && m.is_active
  )

  if (!membership) {
    return { hasAccess: false }
  }

  return {
    hasAccess: true,
    role: membership.role,
    permissions: membership.permissions
  }
}

// Usage in API route
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-hera-org')
  if (!orgId) {
    return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 })
  }

  const access = await checkOrganizationAccess(request, orgId)

  if (!access.hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Check specific permission
  if (!access.permissions?.includes('read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Proceed with request
  // ...
}
```

---

### Pattern 3: Server Action for Membership Setup

```typescript
// app/actions/membership.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function setupUserMembershipAction(organizationId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from session
  const cookieStore = cookies()
  const authToken = cookieStore.get('sb-access-token')?.value

  if (!authToken) {
    return { error: 'Not authenticated' }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)

  if (authError || !user) {
    return { error: 'Authentication failed' }
  }

  // Setup membership
  const { data, error } = await supabase.rpc('setup_user_membership', {
    p_supabase_user_id: user.id,
    p_organization_id: organizationId
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

// Usage in Client Component
'use client'

import { setupUserMembershipAction } from '@/app/actions/membership'

function JoinOrganizationButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    const result = await setupUserMembershipAction(orgId)

    if (result.error) {
      alert('Failed to join organization: ' + result.error)
    } else {
      alert('Successfully joined organization!')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button onClick={handleJoin} disabled={loading}>
      {loading ? 'Joining...' : 'Join Organization'}
    </button>
  )
}
```

---

## Security & Best Practices

### 1. Authentication Requirements

✅ **Always verify user is authenticated**
```typescript
// ❌ BAD: No auth check
await supabase.rpc('setup_user_membership', { ... })

// ✅ GOOD: Check authentication first
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  throw new Error('Not authenticated')
}

await supabase.rpc('setup_user_membership', {
  p_supabase_user_id: session.user.id,
  p_organization_id: orgId
})
```

---

### 2. Permission Validation

✅ **Check user has permission before sensitive operations**
```typescript
async function assignUserRole(targetUserId: string, role: string) {
  // Get current user's memberships
  const { data } = await supabase.rpc('get_user_organization_memberships', {
    p_user_auth_id: currentUser.id
  })

  // Find membership for this org
  const membership = data.memberships.find(
    m => m.organization_id === orgId
  )

  // Check if user has 'manage_users' permission
  if (!membership?.permissions.includes('manage_users') &&
      !membership?.permissions.includes('*')) {
    throw new Error('Insufficient permissions to manage users')
  }

  // Proceed with assignment
  await supabase.rpc('assign_user_to_organization', { ... })
}
```

---

### 3. Input Validation

✅ **Validate all inputs before RPC calls**
```typescript
import { z } from 'zod'

const orgIdSchema = z.string().uuid()
const roleSchema = z.enum(['owner', 'admin', 'manager', 'user', 'viewer'])
const permissionsSchema = z.array(z.string()).min(1)

async function assignUser(params: {
  userId: string
  orgId: string
  role: string
  permissions: string[]
}) {
  // Validate inputs
  try {
    orgIdSchema.parse(params.orgId)
    roleSchema.parse(params.role)
    permissionsSchema.parse(params.permissions)
  } catch (error) {
    throw new Error('Invalid input parameters')
  }

  // Proceed with RPC call
  await supabase.rpc('assign_user_to_organization', {
    p_user_auth_id: params.userId,
    p_organization_id: params.orgId,
    p_role: params.role,
    p_permissions: params.permissions
  })
}
```

---

### 4. Error Handling

✅ **Handle all error cases gracefully**
```typescript
async function safeSetupMembership(userId: string, orgId: string) {
  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_supabase_user_id: userId,
      p_organization_id: orgId
    })

    if (error) {
      // Check specific error codes
      if (error.code === 'PGRST202') {
        console.error('RPC function not found')
        throw new Error('System configuration error')
      }

      if (error.message.includes('Organization not found')) {
        throw new Error('Invalid organization')
      }

      if (error.message.includes('User entity not found')) {
        throw new Error('User not properly initialized')
      }

      // Generic error
      throw new Error(`Membership setup failed: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.message || 'Membership setup failed')
    }

    return data
  } catch (error: any) {
    // Log error for debugging
    console.error('setupMembership failed:', {
      userId,
      orgId,
      error: error.message,
      stack: error.stack
    })

    // Rethrow with user-friendly message
    throw new Error('Failed to setup membership. Please try again.')
  }
}
```

---

### 5. Audit Trail Usage

✅ **Always provide actor ID for audit**
```typescript
// ❌ BAD: No audit trail
await supabase.rpc('assign_user_to_organization', {
  p_user_auth_id: newUserId,
  p_organization_id: orgId,
  p_role: 'admin'
})

// ✅ GOOD: Include assigner for audit
await supabase.rpc('assign_user_to_organization', {
  p_user_auth_id: newUserId,
  p_organization_id: orgId,
  p_role: 'admin',
  p_assigner_auth_id: session.user.id  // Who performed this action
})
```

---

### 6. Idempotency Handling

✅ **Design for idempotent operations**
```typescript
// These RPCs are idempotent - safe to call multiple times
async function ensureUserMembership(userId: string, orgId: string) {
  // If user already member, this updates instead of failing
  const { data } = await supabase.rpc('setup_user_membership', {
    p_supabase_user_id: userId,
    p_organization_id: orgId
  })

  // Check if this was new or existing
  console.log('Membership setup:', data.message)
  return data
}

// Can safely retry on network failure
async function retryableSetup(userId: string, orgId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ensureUserMembership(userId, orgId)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

---

### 7. Rate Limiting

✅ **Implement rate limiting for sensitive operations**
```typescript
// middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
  analytics: true
})

export async function rateLimitUserOperation(userId: string, operation: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `user:${userId}:${operation}`
  )

  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s`)
  }

  return { remaining, reset }
}

// Usage
async function assignWithRateLimit(userId: string, orgId: string) {
  await rateLimitUserOperation(session.user.id, 'assign_user')

  return await supabase.rpc('assign_user_to_organization', {
    p_user_auth_id: userId,
    p_organization_id: orgId,
    p_role: 'user'
  })
}
```

---

## Troubleshooting

### Common Issues

#### Issue 1: RPC Function Not Found

**Error:**
```
Could not find the function public.setup_user_membership in the schema cache
```

**Cause:** RPC function not created in database or wrong parameter names

**Solution:**
```sql
-- Check if function exists
SELECT proname, proargtypes
FROM pg_proc
WHERE proname LIKE '%setup_user_membership%';

-- If missing, create it (requires SQL migration)
-- Check database/functions/organizations/ for creation scripts
```

---

#### Issue 2: User Entity Not Found

**Error:**
```json
{
  "success": false,
  "error": "User entity not found in platform organization",
  "error_code": "USER_ENTITY_NOT_FOUND"
}
```

**Cause:** User entity doesn't exist in platform organization

**Solution:**
```typescript
// Create user entity first (usually done during signup)
await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'create',
  p_actor_user_id: userId,
  p_entity: {
    entity_type: 'USER',
    entity_name: userName,
    entity_code: userEmail,
    smart_code: 'HERA.SYSTEM.USER.ENTITY.V1',
    metadata: {
      auth_user_id: userId,
      email: userEmail
    }
  },
  p_organization_id: '00000000-0000-0000-0000-000000000000',
  p_options: {}
})
```

---

#### Issue 3: Organization Not Found

**Error:**
```json
{
  "success": false,
  "error": "Organization not found or inactive",
  "error_code": "ORG_NOT_FOUND"
}
```

**Cause:** Organization doesn't exist or is inactive

**Solution:**
```typescript
// Verify organization exists
const { data: org } = await supabase
  .from('core_organizations')
  .select('id, organization_name, is_active')
  .eq('id', orgId)
  .single()

if (!org) {
  throw new Error('Organization does not exist')
}

if (!org.is_active) {
  throw new Error('Organization is inactive')
}
```

---

#### Issue 4: Duplicate Membership

**Error:**
```
duplicate key value violates unique constraint
```

**Cause:** Trying to create membership that already exists (shouldn't happen with proper RPCs)

**Solution:**
```typescript
// Use assign_user_to_organization which handles updates
// Or check membership first
const { data: memberships } = await supabase.rpc(
  'get_user_organization_memberships',
  { p_user_auth_id: userId }
)

const existingMembership = memberships.memberships.find(
  m => m.organization_id === orgId
)

if (existingMembership) {
  console.log('User already member, updating role instead')
  await supabase.rpc('update_user_role_in_organization', {
    p_user_auth_id: userId,
    p_organization_id: orgId,
    p_new_role: newRole
  })
} else {
  await supabase.rpc('assign_user_to_organization', {
    p_user_auth_id: userId,
    p_organization_id: orgId,
    p_role: newRole
  })
}
```

---

#### Issue 5: Permission Denied

**Error:**
```
permission denied for function setup_user_membership
```

**Cause:** User doesn't have execute permission on RPC

**Solution:**
```sql
-- Grant execute permission (run as database admin)
GRANT EXECUTE ON FUNCTION setup_user_membership TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_to_organization TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role_in_organization TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_from_organization TO authenticated;
```

---

#### Issue 6: Timeout on Large Membership Query

**Error:**
```
statement timeout
```

**Cause:** User has too many organization memberships

**Solution:**
```typescript
// Add pagination to membership query
const { data } = await supabase.rpc('get_user_organization_memberships', {
  p_user_auth_id: userId
})

// Filter and sort client-side
const sortedOrgs = data.memberships
  .filter(org => org.is_active)
  .sort((a, b) => a.organization_name.localeCompare(b.organization_name))
  .slice(0, 50)  // Limit display to 50

// Or cache the result
const cacheKey = `user_memberships:${userId}`
const cached = await redis.get(cacheKey)
if (cached) return cached

const memberships = await fetchMemberships(userId)
await redis.set(cacheKey, memberships, { ex: 300 })  // Cache 5 min
return memberships
```

---

## Summary

### Quick Reference Card

| Operation | RPC Function | Use When |
|-----------|--------------|----------|
| **Quick onboarding** | `setup_user_membership` | User joins org with defaults |
| **Detailed assignment** | `assign_user_to_organization` | Need specific role/permissions |
| **List user's orgs** | `get_user_organization_memberships` | Show org selector, check access |
| **Change role** | `update_user_role_in_organization` | Promote/demote user |
| **Remove access** | `remove_user_from_organization` | User leaves or offboarding |

---

### Key Takeaways

1. ✅ **Use RPCs for all user-org operations** - Don't manipulate relationships directly
2. ✅ **Always provide audit parameters** - Track who performs actions
3. ✅ **Check permissions before operations** - Validate user can perform action
4. ✅ **Handle errors gracefully** - Provide user-friendly error messages
5. ✅ **Use Sacred Six patterns** - Relationships over separate tables

---

### Related Documentation

- **Sacred Six Architecture:** `/docs/schema/hera-sacred-six-schema.yaml`
- **Entity RPC Functions:** `/mcp-server/PRODUCT_RPC_V2_SUMMARY.md`
- **Multi-Tenant Auth:** `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`
- **Smart Codes Guide:** `/docs/playbooks/_shared/SMART_CODE_GUIDE.md`

---

**End of User Authorization RPC Guide**

For questions or issues, check the troubleshooting section or review the actual RPC function definitions in:
- `/database/functions/organizations/user-assignment-rpcs.sql`
- `/scripts/migrate-memberships-to-sacred-tables.sql`
