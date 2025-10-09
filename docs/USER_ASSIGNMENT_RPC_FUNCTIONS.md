# 🔧 HERA User Assignment RPC Functions

**Complete RPC functions for managing user-organization relationships with proper audit trails and error handling.**

## Overview

These RPC functions provide a comprehensive solution for managing user assignments to organizations in HERA's multi-tenant architecture. They handle the critical `USER_MEMBER_OF_ORG` relationships that enable authentication and authorization.

## 🎯 Key Features

- **✅ Complete CRUD Operations** - Assign, update, remove, and query user memberships
- **✅ Audit Trail Integration** - Every operation creates audit transactions
- **✅ Error Handling** - Comprehensive error codes and helpful messages
- **✅ Platform Organization Pattern** - Follows HERA's user entity pattern
- **✅ Role-Based Permissions** - Support for roles and granular permissions
- **✅ Relationship Management** - Proper `USER_MEMBER_OF_ORG` relationship handling

## 📋 Available Functions

### 1. `assign_user_to_organization`

**Purpose**: Assign an existing user to an organization or update their existing membership.

**Parameters**:
- `p_user_auth_id` (UUID) - Supabase auth user ID
- `p_organization_id` (UUID) - Target organization ID
- `p_role` (TEXT) - User role (default: 'user')
- `p_permissions` (JSONB) - User permissions array (default: ["read"])
- `p_assigner_auth_id` (UUID) - ID of user performing the assignment (optional)

**Returns**: JSONB with success status and relationship details

**Example**:
```sql
SELECT assign_user_to_organization(
  '09b0b92a-d797-489e-bc03-5ca0a6272674',
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8', 
  'admin',
  '["read", "write", "delete"]'::jsonb,
  '09b0b92a-d797-489e-bc03-5ca0a6272674'
);
```

### 2. `remove_user_from_organization`

**Purpose**: Remove a user from an organization by deleting their membership relationship.

**Parameters**:
- `p_user_auth_id` (UUID) - Supabase auth user ID
- `p_organization_id` (UUID) - Organization to remove from
- `p_remover_auth_id` (UUID) - ID of user performing the removal (optional)

**Returns**: JSONB with success status and removal details

### 3. `get_user_organization_memberships`

**Purpose**: Get all organization memberships for a user.

**Parameters**:
- `p_user_auth_id` (UUID) - Supabase auth user ID

**Returns**: JSONB with all user memberships including roles and permissions

### 4. `update_user_role_in_organization`

**Purpose**: Update a user's role and permissions in an organization.

**Parameters**:
- `p_user_auth_id` (UUID) - Supabase auth user ID
- `p_organization_id` (UUID) - Organization ID
- `p_new_role` (TEXT) - New role for the user
- `p_new_permissions` (JSONB) - New permissions array (optional)
- `p_updater_auth_id` (UUID) - ID of user performing the update (optional)

**Returns**: JSONB with success status and update details

## 🚀 Usage Examples

### JavaScript/TypeScript Usage

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Assign user to organization
const { data: result } = await supabase.rpc('assign_user_to_organization', {
  p_user_auth_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_role: 'admin',
  p_permissions: ['read', 'write', 'delete']
});

// Get user memberships
const { data: memberships } = await supabase.rpc('get_user_organization_memberships', {
  p_user_auth_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
});

// Update user role
const { data: updateResult } = await supabase.rpc('update_user_role_in_organization', {
  p_user_auth_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_new_role: 'owner',
  p_new_permissions: ['*']
});
```

## 📊 Data Flow

### User Assignment Process

1. **Validation**: Check organization exists and is active
2. **User Lookup**: Find user entity in platform organization (`00000000-...`)
3. **Relationship Check**: Look for existing `USER_MEMBER_OF_ORG` relationship
4. **Create/Update**: Create new relationship or update existing one
5. **Audit Trail**: Create transaction record for the operation

### Platform Organization Pattern

```
Platform Organization (00000000-0000-0000-0000-000000000000)
├── User Entity (entity_type='USER')
│   └── metadata.auth_user_id = Supabase Auth User ID
│
Business Organization (378f24fb-d496-4ff7-8afa-ea34895a0eb8)
├── USER_MEMBER_OF_ORG relationship
│   ├── from_entity_id = User Entity ID (from platform org)
│   ├── to_entity_id = Business Organization ID
│   └── metadata = { role, permissions, assigned_at, ... }
```

## 🛡️ Security Features

### Row Level Security Integration

The functions work seamlessly with HERA's RLS policies:
- Users can only access their own relationships
- Organization data is properly isolated
- Audit trails maintain security context

### Error Handling

Comprehensive error codes for different scenarios:
- `ORG_NOT_FOUND` - Organization doesn't exist or is inactive
- `USER_ENTITY_NOT_FOUND` - User entity not found in platform organization
- `RELATIONSHIP_NOT_FOUND` - User is not a member of the organization
- `ASSIGNMENT_FAILED` - General assignment failure with SQL details

## 📈 Performance Optimizations

### Database Indexes

```sql
-- Optimized lookup for USER_MEMBER_OF_ORG relationships
CREATE INDEX idx_relationships_user_member_of_org 
ON core_relationships(from_entity_id, to_entity_id, relationship_type) 
WHERE relationship_type = 'USER_MEMBER_OF_ORG';

-- Fast user entity lookup by auth ID
CREATE INDEX idx_entities_user_auth_mapping 
ON core_entities(organization_id, entity_type, (metadata->>'auth_user_id')) 
WHERE entity_type = 'USER';
```

## 🔍 Audit Trail

Every operation creates audit transactions with smart codes:

- **User Assignment**: `HERA.AUTH.USER.ASSIGNMENT.ORG.V1`
- **User Removal**: `HERA.AUTH.USER.REMOVAL.ORG.V1`
- **Role Update**: `HERA.AUTH.USER.ROLE.UPDATE.V1`

Audit metadata includes:
```json
{
  "relationship_id": "uuid",
  "role": "admin",
  "permissions": ["read", "write"],
  "action": "created|updated|removed",
  "assigned_by": "uuid",
  "old_role": "user",
  "new_role": "admin"
}
```

## 🧪 Testing

Test the functions using the provided test script:

```bash
cd mcp-server
node test-user-assignment-rpcs.mjs
```

The test script validates:
- ✅ User assignment functionality
- ✅ Role update operations
- ✅ Membership queries
- ✅ Error handling
- ✅ Audit trail creation
- ✅ Database relationship verification

## 🚀 Integration with HERA

These RPC functions integrate seamlessly with:

- **Authentication Flow**: Resolves user organization context
- **Authorization System**: Provides role and permission data
- **Audit System**: Creates complete audit trails
- **Multi-Tenant Architecture**: Maintains organization isolation
- **Universal API**: Can be called from any HERA endpoint

## 📝 Common Use Cases

### 1. User Onboarding
```typescript
// Add new user to organization during signup
await supabase.rpc('assign_user_to_organization', {
  p_user_auth_id: newUser.id,
  p_organization_id: selectedOrg.id,
  p_role: 'user',
  p_permissions: ['read']
});
```

### 2. Role Management
```typescript
// Promote user to admin
await supabase.rpc('update_user_role_in_organization', {
  p_user_auth_id: userId,
  p_organization_id: orgId,
  p_new_role: 'admin',
  p_new_permissions: ['read', 'write', 'delete']
});
```

### 3. User Dashboard
```typescript
// Show all user's organizations
const { data } = await supabase.rpc('get_user_organization_memberships', {
  p_user_auth_id: currentUser.id
});
```

## 🎯 Summary

These RPC functions provide a complete solution for user-organization management in HERA:

- **✅ Production Ready** - Comprehensive error handling and audit trails
- **✅ Security Focused** - Follows HERA's multi-tenant security patterns
- **✅ Performance Optimized** - Proper indexing and efficient queries
- **✅ Well Tested** - Complete test suite with error case validation
- **✅ Documentation Complete** - Full examples and integration guides

This complements the existing `create_organization_with_owner` function by providing the missing piece for user assignment operations that are critical for HERA's authentication and authorization system.