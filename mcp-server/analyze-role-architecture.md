# Role Assignment Architecture Analysis

## Current Situation

### What We Have:
1. ✅ Users exist in Supabase Auth (`auth.users`)
2. ✅ `MEMBER_OF` relationships link users to organization
3. ❌ **NO roles stored anywhere** (relationships have empty `relationship_data`)
4. ❌ Membership API returns hardcoded roles

### What We Need:
1. Store user roles per organization
2. Retrieve roles during login
3. Use roles for authorization/access control

---

## Option 1: Client-Side Role Assignment (Temporary)

### Approach:
Store roles in localStorage after login based on email mapping

### Pros:
- ✅ Quick to implement (5 minutes)
- ✅ No database changes needed
- ✅ Works immediately

### Cons:
- ❌ Not secure (client can modify)
- ❌ Lost on logout/clear cache
- ❌ Not scalable
- ❌ Not production-ready

### Implementation:
```typescript
// In salon-access/page.tsx (already exists!)
const detectRole = (userEmail: string): string => {
  if (lowerEmail === 'hairtalkz2022@gmail.com') return 'owner'
  if (lowerEmail === 'hairtalkz01@gmail.com') return 'receptionist'
  // etc...
}
localStorage.setItem('salonRole', userRole)
```

**Status:** ✅ Already implemented in salon-access page!

---

## Option 2: Use `hera_entities_crud_v2` for Role Management

### Can we use it for roles?

#### A. Store roles as dynamic data:
```javascript
// Use hera_entities_crud_v2 to add role field
await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'UPDATE',
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_entity: { entity_id: userId },
  p_dynamic: {
    role: {
      field_type: 'text',
      field_value_text: 'owner',
      smart_code: 'HERA.PLATFORM.USER.FIELD.ROLE.v1'
    }
  }
})
```

**Problem:** User entities are in platform org (00000...), not tenant org!

#### B. Store roles in relationship_data:
```javascript
// Can't use hera_entities_crud_v2 for relationships
// Need to use core_relationships table directly
```

**Problem:** `hera_entities_crud_v2` doesn't handle relationships!

---

## Option 3: Update `MEMBER_OF` Relationships Directly

### Approach:
Store role in `relationship_data` field of existing relationships

### Pros:
- ✅ Follows HERA architecture
- ✅ Organization-specific roles
- ✅ Queryable via SQL/RPC
- ✅ Production-ready

### Cons:
- ⚠️ Requires direct table update (not via CRUD RPC)

### Implementation:
```sql
UPDATE core_relationships
SET relationship_data = jsonb_build_object('role', 'owner')
WHERE from_entity_id = 'user-id'
  AND to_entity_id = 'org-id'
  AND relationship_type = 'MEMBER_OF';
```

---

## Option 4: Create Role Assignment RPC Function

### Approach:
Create `assign_user_role_v1` RPC function

### Pros:
- ✅ Clean API
- ✅ Validation built-in
- ✅ Audit trail
- ✅ Reusable

### Cons:
- ⚠️ Requires creating new RPC function

### Implementation:
```sql
CREATE FUNCTION assign_user_role_v1(
  p_user_id UUID,
  p_organization_id UUID,
  p_role TEXT
) RETURNS JSONB AS $$
BEGIN
  UPDATE core_relationships
  SET relationship_data = jsonb_build_object('role', p_role)
  WHERE from_entity_id = p_user_id
    AND to_entity_id = p_organization_id
    AND relationship_type = 'MEMBER_OF';
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

---

## Recommended Approach: Hybrid Solution

### Phase 1: Quick Fix (Now) ✅ ALREADY DONE
- Use client-side detection in `salon-access/page.tsx`
- Store in localStorage
- **Status:** Already implemented!

### Phase 2: Database Storage (Next)
Update existing `MEMBER_OF` relationships with roles:

```javascript
// Script to update relationships
const users = [
  { id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', role: 'owner' },
  { id: '4578ce6d-db51-4838-9dc9-faca4cbe30bb', role: 'receptionist' },
  { id: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7', role: 'receptionist' }
]

for (const user of users) {
  await supabase
    .from('core_relationships')
    .update({
      relationship_data: { role: user.role }
    })
    .eq('from_entity_id', user.id)
    .eq('to_entity_id', SALON_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')
}
```

### Phase 3: API Integration
Update `/api/v2/auth/resolve-membership` to return role from relationship_data:

```javascript
// Already exists in code (line 92-93)
roles: [relationship.relationship_data?.role || 'OWNER']
```

### Phase 4: Auth Provider Integration
HERAAuthProvider already extracts role from API response!

```javascript
// Already exists (line 171-175)
const role = (
  res.membership?.roles?.[0] ??
  res.role ??
  'member'
).toLowerCase()
```

---

## For Membership Verification

### Can we use `hera_entities_crud_v2`?

**NO** - It's for entities, not relationships.

### What to use instead:

#### Option A: Direct relationship query (CURRENT)
```javascript
const { data: relationships } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', userId)
  .eq('to_entity_id', orgId)
  .eq('relationship_type', 'MEMBER_OF')
```

#### Option B: Create `verify_membership_v1` RPC
```sql
CREATE FUNCTION verify_membership_v1(
  p_user_id UUID,
  p_organization_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_relationship RECORD;
BEGIN
  SELECT * INTO v_relationship
  FROM core_relationships
  WHERE from_entity_id = p_user_id
    AND to_entity_id = p_organization_id
    AND relationship_type = 'MEMBER_OF'
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_member', false,
      'role', null
    );
  END IF;

  RETURN jsonb_build_object(
    'is_member', true,
    'role', v_relationship.relationship_data->>'role',
    'organization_id', p_organization_id
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Recommended Plan

### Step 1: ✅ DONE - Client-side role detection working

### Step 2: Update existing relationships with roles (5 min)
```bash
node update-relationship-roles.mjs
```

### Step 3: Verify API returns roles (Already should work!)
- `/api/v2/auth/resolve-membership` line 92 already reads from relationship_data
- HERAAuthProvider line 171 already parses roles

### Step 4: Test end-to-end flow
- Login
- Check API response has role
- Verify HERAAuthProvider receives role
- Confirm role-based redirects work

---

## Decision Matrix

| Approach | Speed | Security | Scalability | Production Ready |
|----------|-------|----------|-------------|------------------|
| Client-side (current) | ⚡⚡⚡ | ❌ | ❌ | ❌ |
| relationship_data | ⚡⚡ | ✅ | ✅ | ✅ |
| hera_entities_crud_v2 | N/A | N/A | N/A | ❌ Won't work |
| Custom RPC | ⚡ | ✅ | ✅ | ✅ |

**Winner: Update `relationship_data` directly** - Fast, works with existing code, production-ready!
