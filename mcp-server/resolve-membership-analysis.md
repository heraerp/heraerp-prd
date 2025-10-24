# Resolve Membership Implementation Analysis

## Current Implementation

### Does it use `hera_entities_crud_v2` RPC?

**NO** - The current implementation uses **direct Supabase queries** for membership resolution.

### Breakdown of `/api/v2/auth/resolve-membership`

#### Line-by-Line Analysis:

**1. Authentication (Lines 14-32)**
```typescript
// Direct Supabase auth - NO RPC
const supabase = createClient(...)
const { data: { user } } = await supabase.auth.getUser(token)
```
- ✅ Uses Supabase Auth API directly
- ❌ Does NOT use any RPC function

**2. Self-Healing (Lines 56-66)**
```typescript
// Uses RPC: ensure_membership_for_email
await supabaseService.rpc('ensure_membership_for_email', {
  p_email: auth.email,
  p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_service_user: userId
})
```
- ✅ Uses RPC: `ensure_membership_for_email` (custom RPC, not hera_entities_crud_v2)
- Purpose: Create membership if missing

**3. Membership Query (Lines 68-73)**
```typescript
// Direct Supabase query - NO RPC
const { data: relationships } = await supabaseService
  .from('core_relationships')
  .select('id, to_entity_id, organization_id, relationship_data, is_active')
  .eq('from_entity_id', userId)
  .eq('relationship_type', 'MEMBER_OF')
  .eq('is_active', true)
```
- ❌ Direct table query
- ❌ Does NOT use `hera_entities_crud_v2`
- ❌ Does NOT use any relationship RPC

**4. Entity Resolution (Lines 92-106)**
```typescript
// Direct Supabase queries - NO RPC
const { data: userEntity } = await supabaseService
  .from('core_entities')
  .select('id')
  .eq('entity_type', 'USER')
  ...

const { data: orgEntity } = await supabaseService
  .from('core_entities')
  .select('id')
  .eq('entity_type', 'ORG')
  ...
```
- ❌ Direct table queries
- ❌ Does NOT use `hera_entities_crud_v2`

**5. Role Extraction (Line 121)**
```typescript
roles: [relationship.relationship_data?.role || 'OWNER']
```
- ✅ Reads role from JSONB field `relationship_data.role`
- ❌ Does NOT use any RPC

---

## How Roles Are Assigned in Supabase

### Current Role Storage Architecture

**Location:** `core_relationships.relationship_data` (JSONB field)

```sql
-- Table: core_relationships
-- Field: relationship_data (JSONB)
-- Structure:
{
  "role": "owner"  -- or "receptionist", "staff", etc.
}
```

### Role Assignment Methods

#### Method 1: Direct Table Update (Current Implementation)
```javascript
// Script: assign-salon-roles.mjs
await supabase
  .from('core_relationships')
  .update({
    relationship_data: { role: 'owner' }  // JSONB field
  })
  .eq('from_entity_id', userId)
  .eq('to_entity_id', orgId)
  .eq('relationship_type', 'MEMBER_OF')
```

**Pros:**
- ✅ Simple and direct
- ✅ Works immediately
- ✅ Production-ready

**Cons:**
- ❌ Bypasses HERA RPC layer
- ❌ No validation
- ❌ No audit trail

#### Method 2: Using `hera_entities_crud_v2` (NOT POSSIBLE)
```javascript
// ❌ CANNOT BE USED - Wrong scope!
// hera_entities_crud_v2 is for ENTITIES, not RELATIONSHIPS
```

**Why it won't work:**
- `hera_entities_crud_v2` operates on `core_entities` table
- Relationships are in `core_relationships` table
- No relationship parameter in the RPC function

#### Method 3: Custom RPC Function (Recommended)
```sql
-- Create dedicated role assignment RPC
CREATE FUNCTION assign_user_role_v1(
  p_actor_user_id UUID,
  p_user_id UUID,
  p_organization_id UUID,
  p_role TEXT
) RETURNS JSONB AS $$
BEGIN
  -- Validate role
  IF p_role NOT IN ('owner', 'manager', 'receptionist', 'staff') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Validate membership exists
  IF NOT EXISTS (
    SELECT 1 FROM core_relationships
    WHERE from_entity_id = p_user_id
      AND to_entity_id = p_organization_id
      AND relationship_type = 'MEMBER_OF'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a member of organization';
  END IF;

  -- Update relationship_data with role
  UPDATE core_relationships
  SET
    relationship_data = jsonb_build_object('role', p_role),
    updated_by = p_actor_user_id,
    updated_at = NOW()
  WHERE from_entity_id = p_user_id
    AND to_entity_id = p_organization_id
    AND relationship_type = 'MEMBER_OF';

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'organization_id', p_organization_id,
    'role', p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**
```javascript
await supabase.rpc('assign_user_role_v1', {
  p_actor_user_id: currentUserId,  // WHO is assigning
  p_user_id: targetUserId,         // WHO gets the role
  p_organization_id: orgId,        // WHERE
  p_role: 'receptionist'           // WHAT role
})
```

**Pros:**
- ✅ Validation built-in
- ✅ Actor stamping (WHO assigned the role)
- ✅ Audit trail
- ✅ HERA-compliant
- ✅ Reusable

**Cons:**
- ⚠️ Requires creating new RPC function

---

## Summary Table

| Aspect | Current Implementation |
|--------|----------------------|
| **Membership Query** | Direct Supabase query (`core_relationships`) |
| **Entity Resolution** | Direct Supabase query (`core_entities`) |
| **Role Storage** | `relationship_data.role` (JSONB field) |
| **Role Assignment** | Direct table update (no RPC) |
| **Uses hera_entities_crud_v2** | ❌ NO |
| **Uses any RPC for roles** | ❌ NO (only for self-heal) |
| **Actor stamping** | ❌ NO |
| **Validation** | ❌ NO |

---

## Recommendations

### Short-term (Current - Working)
✅ **Keep current implementation** - It works and roles are properly stored

### Medium-term (Next Sprint)
🔧 **Create `assign_user_role_v1` RPC** for proper role management:
- Validation
- Actor stamping
- Audit trail
- HERA compliance

### Long-term (Future)
🚀 **Update `resolve-membership` to use relationship RPC**:
- Create `hera_relationship_query_v1` for querying relationships
- Replace direct queries with RPC calls
- Maintain HERA architecture consistency

---

## Current Flow Diagram

```
User Login
    ↓
[/api/v2/auth/resolve-membership]
    ↓
JWT Validation (Supabase Auth API)
    ↓
Self-Heal: ensure_membership_for_email (RPC)  ← Only RPC used
    ↓
Query core_relationships (Direct Query)        ← Direct DB access
    ↓
Read relationship_data.role (JSONB field)
    ↓
Query core_entities (Direct Query)             ← Direct DB access
    ↓
Return { membership: { roles: ['owner'] } }
    ↓
HERAAuthProvider receives role
    ↓
Redirect to dashboard
```

---

## Key Findings

1. **No use of `hera_entities_crud_v2`** in current implementation
2. **Direct Supabase queries** for all data access (except self-heal)
3. **Roles stored in JSONB field** `relationship_data.role`
4. **No validation or actor stamping** for role assignments
5. **Working solution** but not fully HERA-compliant

**Decision needed:** Keep simple direct queries OR invest in proper RPC-based architecture?
