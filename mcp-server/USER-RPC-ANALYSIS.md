# 🔍 User RPC Function Analysis

## ❓ Question: Is `hera_user_update_v1` Redundant?

**Answer: ❌ NO - Keep both functions (but fix the bugs)**

---

## 🧪 Test Results

### Test 1: UPSERT Create Capability
✅ **PASS** - `hera_upsert_user_entity_v1` successfully creates new users

### Test 2: UPSERT Update Capability
❌ **FAIL** - `hera_upsert_user_entity_v1` creates duplicate users instead of updating existing ones
- Created original user: `1e9abbd3-dbbb-4baf-a1e0-60d8982e6e44`
- Called UPSERT again with same `p_supabase_uid`
- Created NEW user: `996b4ded-3411-41ca-aba5-fa77e31b6b23` (duplicate!)

**Conclusion:** The "UPSERT" function name is misleading - it only creates, doesn't update.

---

## 📊 Function Comparison

### `hera_upsert_user_entity_v1`
**Purpose:** Platform-level user identity management
**Scope:** Platform organization (`00000000-0000-0000-0000-000000000000`)
**Parameters:**
- `p_platform_org` - Platform organization UUID
- `p_supabase_uid` - Supabase Auth UID (should be unique key)
- `p_email` - User email
- `p_full_name` - User full name
- `p_system_actor` - Actor performing the operation
- `p_version` - Version string

**What it does:**
- Creates user entity in platform organization
- Stores basic identity information (email, name)
- Links to Supabase Auth UID
- ⚠️ **Does NOT update existing users** (bug in implementation)

---

### `hera_user_update_v1`
**Purpose:** Organization-specific user metadata management
**Scope:** Tenant organizations (any business org)
**Parameters:**
- `p_organization_id` - Tenant organization UUID
- `p_user_id` - User entity UUID
- `p_role` - User role in this organization
- `p_permissions` - JSONB permissions object
- `p_department` - Department assignment
- `p_reports_to` - Manager/supervisor UUID
- `p_status` - User status (active, inactive, etc.)

**What it does:**
- Updates organization-specific user metadata
- Manages role-based access control
- Stores department/reporting structure
- ⚠️ **Currently broken** (Smart Code constraint issue)

---

## 🎯 Why Both Functions Are Needed

### 1. **Different Scopes**
- **UPSERT**: Platform-level identity (one per user globally)
- **UPDATE**: Organization-level metadata (one per user per org)

### 2. **Different Data**
- **UPSERT**: Basic identity (email, name, auth UID)
- **UPDATE**: Business metadata (role, permissions, department)

### 3. **Multi-tenant Architecture**
- A user exists once in platform org (via UPSERT)
- A user can have different roles/permissions in multiple tenant orgs (via UPDATE)

**Example:**
```
User: john@example.com
├─ Platform Org (UPSERT manages this)
│  ├─ Email: john@example.com
│  ├─ Name: John Doe
│  └─ Supabase UID: abc-123-def
│
├─ Salon A (UPDATE manages this)
│  ├─ Role: Manager
│  ├─ Department: Operations
│  └─ Permissions: { can_manage_staff: true }
│
└─ Salon B (UPDATE manages this)
   ├─ Role: Stylist
   ├─ Department: Hair Services
   └─ Permissions: { can_book_appointments: true }
```

---

## 🐛 Bugs That Need Fixing

### Bug 1: `hera_upsert_user_entity_v1` doesn't actually UPSERT
**Issue:** Creates duplicate users instead of updating existing ones
**Root Cause:** Not properly checking for existing user by `p_supabase_uid`
**Fix Required:**
```sql
-- Pseudo-code for fix
IF EXISTS (SELECT 1 FROM core_entities WHERE entity_code = p_supabase_uid) THEN
  -- UPDATE existing user
  UPDATE core_entities
  SET entity_name = p_full_name, ...
  WHERE entity_code = p_supabase_uid
  RETURNING id;
ELSE
  -- INSERT new user
  INSERT INTO core_entities (...) VALUES (...)
  RETURNING id;
END IF;
```

### Bug 2: `hera_user_update_v1` Smart Code constraint violation
**Issue:** `HERA.RBAC.USER.ROLE.v1` fails CHECK constraint
**Root Cause:** CHECK constraint may expect uppercase `.V1` instead of lowercase `.v1`
**Fix Required:**
- **Option 1 (Recommended):** Use `hera_entities_crud_v1` instead of custom UPDATE function
- **Option 2:** Fix CHECK constraint to allow HERA DNA standard (lowercase `.v1`)

### Bug 3: Missing `metadata` column references
**Issue:** RPCs reference `r.metadata` which doesn't exist
**Affected:** `hera_user_read_v1`, `hera_user_remove_from_org_v1`
**Fix Required:** Remove all references to `r.metadata` in RPC SQL

---

## 💡 Recommendation: Use `hera_entities_crud_v1` Instead

Instead of fixing `hera_user_update_v1`, consider **deprecating it** and using the universal `hera_entities_crud_v1` RPC:

```typescript
// OLD (broken):
await supabase.rpc('hera_user_update_v1', {
  p_organization_id: orgId,
  p_user_id: userId,
  p_role: 'manager',
  p_permissions: { can_manage: true },
  p_department: 'Operations',
  p_reports_to: managerId,
  p_status: 'active'
})

// NEW (working):
await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: actorId,
  p_organization_id: orgId,
  p_entity: {
    entity_id: userId,
    entity_type: 'USER'
  },
  p_dynamic: {
    role: {
      type: 'text',
      value: 'manager',
      smart_code: 'HERA.RBAC.USER.FIELD.ROLE.v1'
    },
    permissions: {
      type: 'json',
      value: { can_manage: true },
      smart_code: 'HERA.RBAC.USER.FIELD.PERMISSIONS.v1'
    },
    department: {
      type: 'text',
      value: 'Operations',
      smart_code: 'HERA.ORG.USER.FIELD.DEPARTMENT.v1'
    },
    reports_to: {
      type: 'text',
      value: managerId,
      smart_code: 'HERA.ORG.USER.FIELD.REPORTS_TO.v1'
    },
    status: {
      type: 'text',
      value: 'active',
      smart_code: 'HERA.RBAC.USER.FIELD.STATUS.v1'
    }
  },
  p_relationships: [],
  p_options: {}
})
```

**Benefits:**
- ✅ Uses battle-tested universal RPC
- ✅ Follows HERA DNA standards automatically
- ✅ Proper Smart Code validation
- ✅ Actor stamping built-in
- ✅ Organization filtering enforced
- ✅ Audit trail automatic

---

## 📝 Summary

| Function | Keep? | Status | Recommendation |
|----------|-------|--------|----------------|
| `hera_upsert_user_entity_v1` | ✅ YES | Fix bug | Make it actually UPSERT |
| `hera_user_update_v1` | ⚠️ MAYBE | Broken | Deprecate, use `hera_entities_crud_v1` |

**Action Plan:**
1. ✅ Fix `hera_upsert_user_entity_v1` to properly update existing users
2. ❌ Deprecate `hera_user_update_v1` in favor of `hera_entities_crud_v1`
3. ✅ Fix `hera_user_read_v1` and `hera_user_remove_from_org_v1` (remove metadata refs)
4. ✅ Fix `hera_user_orgs_list_v1` (materialization issue)

---

**Generated by:** User RPC Analysis Tool
**Test File:** `/mcp-server/check-user-rpc-definitions.mjs`
**Date:** 2025-11-06
