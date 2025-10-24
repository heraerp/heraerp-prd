# Role Storage: Dynamic Data vs Relationship Data

## Question
Should roles be stored in **`core_dynamic_data`** (via `p_dynamic`) or **`core_relationships.relationship_data`** (via `p_relationships`)?

## TL;DR Answer

**✅ STORE IN `relationship_data`** (current implementation is correct)

Roles are **relationship metadata**, not entity properties. They describe the user-organization connection, not the user entity itself.

---

## Detailed Analysis

### Option 1: Dynamic Data (`p_dynamic`)

**Example:**
```javascript
await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: actorId,
  p_organization_id: orgId,
  p_entity: {
    entity_id: userId
  },
  p_dynamic: {
    role: {
      value: 'owner',
      type: 'text',
      smart_code: 'HERA.SALON.USER.DYN.ROLE.v1'
    }
  },
  p_relationships: {},
  p_options: {}
})
```

**Stores in:** `core_dynamic_data` table
```sql
entity_id: user-uuid
field_name: 'role'
field_type: 'text'
field_value_text: 'owner'
organization_id: org-uuid
smart_code: 'HERA.SALON.USER.DYN.ROLE.v1'
```

**❌ Problems:**
1. **Scoping Issue**: Role is stored on USER entity
   - User entity lives in PLATFORM org (`00000000-0000-0000-0000-000000000000`)
   - Role is tenant-specific (different role per organization)
   - Would need separate role field per organization → NOT scalable

2. **Semantic Mismatch**: Role is not a user property
   - A user doesn't "have" a role intrinsically
   - Role describes the relationship between user and organization
   - Example: Same user can be "owner" in Org A and "staff" in Org B

3. **Query Complexity**: To check membership + role requires 2 queries:
   ```sql
   -- Query 1: Check membership
   SELECT * FROM core_relationships
   WHERE from_entity_id = user_id AND to_entity_id = org_id

   -- Query 2: Get role
   SELECT field_value_text FROM core_dynamic_data
   WHERE entity_id = user_id AND field_name = 'role' AND organization_id = org_id
   ```

---

### Option 2: Relationship Data (`p_relationships` metadata) ✅ RECOMMENDED

**Example using orchestrator RPC:**
```javascript
// Create user with membership relationship including role
await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: actorId,
  p_organization_id: PLATFORM_ORG,
  p_entity: {
    entity_type: 'USER',
    entity_name: 'John Doe',
    entity_code: 'USER-001',
    smart_code: 'HERA.SEC.USER.ENTITY.ACCOUNT.v1'
  },
  p_dynamic: {
    email: {
      value: 'john@example.com',
      type: 'text',
      smart_code: 'HERA.SEC.USER.DYN.EMAIL.v1'
    }
  },
  p_relationships: {
    MEMBER_OF: [
      {
        target_id: orgId,
        metadata: {
          role: 'owner',  // ← Role stored here
          assigned_at: new Date().toISOString(),
          assigned_by: actorId
        },
        smart_code: 'HERA.SALON.MEMBER.REL.v1'
      }
    ]
  },
  p_options: {
    allow_platform_identity: true,
    system_actor_user_id: actorId
  }
})
```

**Current Simple Approach (Direct Table Update):**
```javascript
// Update existing relationship with role
await supabase
  .from('core_relationships')
  .update({
    relationship_data: { role: 'owner' }
  })
  .eq('from_entity_id', userId)
  .eq('to_entity_id', orgId)
  .eq('relationship_type', 'MEMBER_OF')
```

**Stores in:** `core_relationships` table
```sql
from_entity_id: user-uuid
to_entity_id: org-uuid
relationship_type: 'MEMBER_OF'
relationship_data: {"role": "owner"}
organization_id: org-uuid
```

**✅ Advantages:**
1. **Correct Scoping**: Role is tenant-specific
   - Relationship exists in tenant organization
   - Different organizations can have different roles for same user
   - No cross-tenant data leakage

2. **Semantic Correctness**: Role describes the relationship
   - "User X is a MEMBER_OF Organization Y **as** owner"
   - Role is metadata about the membership, not the user

3. **Query Efficiency**: Single query gets membership + role
   ```sql
   -- One query gets everything
   SELECT * FROM core_relationships
   WHERE from_entity_id = user_id
     AND to_entity_id = org_id
     AND relationship_type = 'MEMBER_OF'
   -- Returns relationship with role in relationship_data
   ```

4. **HERA Architecture Compliance**: Follows Sacred Six patterns
   - Relationships describe connections
   - Metadata enriches relationships
   - Organization isolation maintained

---

## Orchestrator RPC Support

### Can `hera_entities_crud_v1` Handle Relationships?

**YES** - See test file lines 224-230, 583-591:

```javascript
// CREATE with relationships
p_relationships: {
  HAS_CATEGORY: [CATEGORY_ID_1]  // Simple array of IDs
}

// UPDATE with relationships (UPSERT mode)
p_relationships: {
  HAS_CATEGORY: [CATEGORY_ID_1, CATEGORY_ID_2]  // Add more
}

// UPDATE with relationships (REPLACE mode)
p_relationships: {
  HAS_CATEGORY: [CATEGORY_ID_2]  // Replace all with this one
}

// With metadata (advanced)
p_relationships: {
  MEMBER_OF: [
    {
      target_id: orgId,
      metadata: { role: 'owner', assigned_at: '...' }
    }
  ]
}
```

**Relationship Modes:**
- `UPSERT` (default): Add new relationships, keep existing ones
- `REPLACE`: Remove all existing, add only specified ones

---

## Current Implementation Status

### ✅ What's Working Now

**Role Storage (Direct Table Update):**
```javascript
// Script: assign-salon-roles.mjs
await supabase
  .from('core_relationships')
  .update({ relationship_data: { role: 'owner' } })
  .eq('from_entity_id', userId)
  .eq('relationship_type', 'MEMBER_OF')
```

**Role Reading (resolve-membership API):**
```typescript
// /api/v2/auth/resolve-membership/route.ts:121
roles: [relationship.relationship_data?.role || 'OWNER']
```

**Role Reading (verifyAuth - JUST FIXED):**
```typescript
// /src/lib/auth/verify-auth.ts:154-162
const userMembership = memberships?.find(m => m.organization_id === organizationId)
if (userMembership?.relationship_data?.role) {
  roles = [userMembership.relationship_data.role.toUpperCase()]
}
```

---

## Recommendation

### ✅ Keep Current Approach: `relationship_data`

**Why:**
1. Architecturally correct (role is relationship metadata)
2. Already working in production
3. Single-query efficiency
4. Proper organization scoping
5. HERA Sacred Six compliant

**Future Enhancement (Optional):**
Create RPC function for role management:
```javascript
// Future: assign_user_role_v1
await supabase.rpc('assign_user_role_v1', {
  p_actor_user_id: actorId,
  p_user_id: userId,
  p_organization_id: orgId,
  p_role: 'owner'
})

// Under the hood, updates relationship_data
```

**Benefits of RPC wrapper:**
- Validation (valid role values)
- Actor stamping (WHO assigned the role)
- Audit trail (WHEN role changed)
- Business logic (e.g., can't remove last owner)

---

## Decision Matrix

| Aspect | Dynamic Data | Relationship Data ✅ |
|--------|-------------|---------------------|
| **Scoping** | ❌ Wrong (platform org) | ✅ Correct (tenant org) |
| **Semantics** | ❌ Property of user | ✅ Property of membership |
| **Multi-tenant** | ❌ Hard (per-org fields) | ✅ Natural (per-relationship) |
| **Query Efficiency** | ❌ Two queries | ✅ Single query |
| **HERA Compliance** | ⚠️ Debatable | ✅ Follows patterns |
| **Current Code** | ❌ Not implemented | ✅ Already working |
| **Orchestrator RPC** | ✅ Supported | ✅ Supported |

---

## Conclusion

**KEEP ROLES IN `relationship_data`** - The current implementation is correct.

Do NOT use `p_dynamic` for roles. Roles are relationship metadata, not entity properties.

The orchestrator RPC (`hera_entities_crud_v1`) CAN handle relationships via `p_relationships`, but for simple role assignment, direct table updates are sufficient and working correctly.
