# 🎯 User Management RPC - Purpose & Decisions

## Quick Answer

### `hera_users_list_v1` - **DEPRECATE**
**Purpose:** Lists all users in an organization
**Returns:** `Array<{ id, name, role }>`
**Use Case:** Admin panel showing team members
**Decision:** ❌ Deprecate - Use direct table query instead

### `hera_user_switch_org_v1` - **KEEP**
**Purpose:** Switches user's active organization context
**Returns:** `{ ok: true, organization_id }`
**Use Case:** Multi-tenant workspace switcher
**Decision:** ✅ Keep - This is session management, not entity CRUD

### `hera_user_orgs_list_v1` - **FIX OR REPLACE**
**Purpose:** Lists organizations a user belongs to
**Returns:** `Array<organization_records>`
**Use Case:** Organization picker dropdown
**Decision:** ⚠️ Fix or replace with direct query

---

## Detailed Analysis

### 1️⃣ `hera_users_list_v1`

**What it does:**
```typescript
await supabase.rpc('hera_users_list_v1', {
  p_organization_id: orgId,
  p_limit: 25,
  p_offset: 0
})

// Returns: [
//   { id: 'uuid-1', name: 'John Doe', role: 'stylist' },
//   { id: 'uuid-2', name: 'Jane Smith', role: 'manager' },
//   ...
// ]
```

**Use Case:**
- Admin panel: "View all staff members"
- Team management: "Invite user to team"
- User directory: "Search for colleagues"

**Replacement:**
```typescript
// Option 1: Direct table query (simple)
const { data } = await supabase
  .from('core_entities')
  .select('id, entity_name as name, entity_type')
  .eq('organization_id', orgId)
  .eq('entity_type', 'USER')
  .limit(25)

// Option 2: Universal RPC (if you want role info from dynamic_data)
const { data } = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: actorId,
  p_organization_id: orgId,
  p_entity: { entity_type: 'USER' },
  p_options: { include_dynamic: true, limit: 25 }
})
```

**Decision:** ❌ **DEPRECATE**
- No special logic needed
- Simple SELECT query
- Saves maintenance burden

---

### 2️⃣ `hera_user_switch_org_v1`

**What it does:**
```typescript
await supabase.rpc('hera_user_switch_org_v1', {
  p_user_id: userId,
  p_organization_id: targetOrgId
})

// Returns: { ok: true, organization_id: 'target-org-uuid' }
```

**What happens internally:**
1. ✅ Validates user is a member of target organization
2. ✅ Updates user's active organization preference/session
3. ✅ Returns confirmation

**Use Case:**
```typescript
// Multi-tenant app where user works for multiple businesses
// User: "Michele Rodriguez"
// Organizations:
//   - Hair Talkz Salon (Salon A)
//   - Glam Studio (Salon B)
//   - Beauty Bar (Salon C)

// Michele switches from Salon A to Salon B
await switchOrg(micheleId, salonBId)

// Now all subsequent operations happen in context of Salon B
// - View Salon B appointments
// - Manage Salon B staff
// - Access Salon B reports
```

**Why it's NOT entity CRUD:**
- Manages **session state**, not entity data
- Involves **authorization validation** (membership check)
- Updates **user preferences** or **session context**
- May involve **JWT token updates** or **cookie changes**

**Can't be replaced by universal RPC because:**
- `hera_entities_crud_v1` doesn't manage sessions
- `hera_entities_crud_v1` doesn't validate memberships
- `hera_entities_crud_v1` doesn't update user context

**Decision:** ✅ **KEEP**
- Unique functionality (session management)
- Not entity CRUD operation
- Essential for multi-tenant apps

---

### 3️⃣ `hera_user_orgs_list_v1`

**What it does:**
```typescript
await supabase.rpc('hera_user_orgs_list_v1', {
  p_user_id: userId
})

// Should return: [
//   { id: 'org-1', name: 'Hair Talkz Salon', role: 'owner', status: 'active' },
//   { id: 'org-2', name: 'Glam Studio', role: 'stylist', status: 'active' },
//   ...
// ]
```

**Use Case:**
```typescript
// Organization picker in UI
<select onChange={(e) => switchOrg(userId, e.target.value)}>
  {userOrgs.map(org => (
    <option key={org.id} value={org.id}>
      {org.name} ({org.role})
    </option>
  ))}
</select>
```

**Current Status:** ❌ **BROKEN**
```
Error: materialize mode required, but it is not allowed in this context
```

**What's causing the error:**
- RPC likely uses `WITH RECURSIVE` CTE or complex subquery
- PostgreSQL requires materialization for certain query patterns
- SQL context doesn't allow `MATERIALIZED` keyword

**Replacement Options:**

**Option A: Fix the SQL**
```sql
-- Current (broken):
WITH RECURSIVE org_tree AS (
  SELECT ... -- Complex recursive query
)
SELECT * FROM org_tree;

-- Fixed (simpler):
SELECT
  co.id,
  co.name,
  cr.relationship_data->>'role' as role,
  cr.is_active as status
FROM core_relationships cr
JOIN core_organizations co ON co.id = cr.to_entity_id
WHERE cr.from_entity_id = p_user_id
  AND cr.relationship_type = 'USER_MEMBER_OF_ORG'
  AND cr.is_active = true;
```

**Option B: Use Direct Query (Recommended)**
```typescript
// Direct query - simple and fast
const { data } = await supabase
  .from('core_relationships')
  .select(`
    to_entity_id,
    organization:core_organizations!to_entity_id (
      id,
      name
    ),
    relationship_data
  `)
  .eq('from_entity_id', userId)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('is_active', true)

// Transform result
const orgs = data.map(rel => ({
  id: rel.to_entity_id,
  name: rel.organization.name,
  role: rel.relationship_data?.role || 'member'
}))
```

**Decision:** ⚠️ **FIX OR REPLACE**
- **Recommended:** Use direct query (Option B)
- **Alternative:** Fix SQL to avoid materialization (Option A)
- Either way, this functionality is needed

---

## 📊 Final Summary Table

| RPC | Purpose | Status | Decision | Reason |
|-----|---------|--------|----------|--------|
| `hera_users_list_v1` | List users in org | ✅ Working | ❌ Deprecate | Simple table query |
| `hera_user_switch_org_v1` | Switch active org | ✅ Working | ✅ Keep | Session management |
| `hera_user_orgs_list_v1` | List user's orgs | ❌ Broken | ⚠️ Fix/Replace | Needed, but use direct query |
| `hera_upsert_user_entity_v1` | Create/update user | ❌ Buggy | ❌ Deprecate | Use `hera_entities_crud_v1` |
| `hera_user_read_v1` | Read user details | ❌ Broken | ❌ Deprecate | Use `hera_entities_crud_v1` |
| `hera_user_update_v1` | Update user metadata | ❌ Broken | ❌ Deprecate | Use `hera_entities_crud_v1` |
| `hera_user_remove_from_org_v1` | Remove from org | ❌ Broken | ❌ Deprecate | Use relationship delete |

---

## 🎯 Action Items

### Immediate Actions (Do Now):

1. ✅ **Document**: Update docs to use `hera_entities_crud_v1` for user CRUD
2. ✅ **Keep**: `hera_user_switch_org_v1` (session management)
3. ⚠️ **Replace**: `hera_user_orgs_list_v1` with direct query
4. ❌ **Deprecate**: All other user RPCs

### Code Examples for Developers:

**Instead of `hera_users_list_v1`:**
```typescript
const { data: users } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_type')
  .eq('organization_id', orgId)
  .eq('entity_type', 'USER')
```

**Keep `hera_user_switch_org_v1`:**
```typescript
await supabase.rpc('hera_user_switch_org_v1', {
  p_user_id: userId,
  p_organization_id: targetOrgId
})
```

**Instead of `hera_user_orgs_list_v1`:**
```typescript
const { data } = await supabase
  .from('core_relationships')
  .select('to_entity_id, organization:core_organizations!to_entity_id(id, name)')
  .eq('from_entity_id', userId)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
```

---

**Generated:** 2025-11-06
**Conclusion:** Only `hera_user_switch_org_v1` needs to remain as a specialized RPC
