# Why verifyAuth Uses Direct Queries (Not RPC)

## TL;DR

**Cannot use `hera_entities_crud_v1` RPC for authentication** because MEMBER_OF relationships are stored in **tenant organizations**, not the platform organization where USER entities live.

The RPC only returns relationships within the same organization boundary, so it won't find cross-org memberships.

---

## The Problem

### HERA Architecture:
```
Platform Org (00000000-0000-0000-0000-000000000000)
├── USER entities (all users across all tenants)
│   └── user-uuid-1
│   └── user-uuid-2
│
Tenant Org A (378f24fb-d496-4ff7-8afa-ea34895a0eb8)
├── ORG entity (the organization itself)
├── MEMBER_OF relationships (user memberships)
│   └── user-uuid-1 MEMBER_OF org-A { role: "owner" }
│   └── user-uuid-2 MEMBER_OF org-A { role: "receptionist" }
├── CUSTOMER entities
├── PRODUCT entities
...
```

### The Issue:

When we call:
```typescript
await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: userId,
  p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
  p_entity: {
    entity_id: userId,
    entity_type: 'USER'
  },
  p_options: {
    include_relationships: true,
    relationship_types: ['MEMBER_OF']
  }
})
```

**What happens:**
1. ✅ RPC finds the USER entity in platform org
2. ❌ RPC looks for MEMBER_OF relationships in **platform org**
3. ❌ But MEMBER_OF relationships are in **tenant orgs**
4. ❌ RPC returns empty relationships array

**Test Results:**
```
✅ RPC Success
  relationships: array[0]  ← EMPTY!

✅ Direct query found 1 relationships
  [1] Org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
      Role: owner
```

---

## Why This Architecture Exists

**Sacred Organization Boundary:**
- Each tenant org has complete data isolation
- Relationships belong to the org they describe
- USER MEMBER_OF ORG relationships are **tenant-specific data**
- A user can be a member of multiple orgs with different roles

**Example:**
```
User: john@example.com (platform org)
  ├── MEMBER_OF Salon A (tenant org A) { role: "owner" }
  ├── MEMBER_OF Salon B (tenant org B) { role: "receptionist" }
  └── MEMBER_OF Salon C (tenant org C) { role: "staff" }
```

Each MEMBER_OF relationship is stored in its respective tenant org, not the platform org.

---

## Solutions Considered

### ❌ Option 1: Use hera_entities_crud_v1 RPC
**Problem:** RPC respects org boundaries (by design), won't return cross-org relationships

### ❌ Option 2: Query each tenant org separately
**Problem:** We don't know which orgs to query until we find the memberships

### ✅ Option 3: Direct query on core_relationships (CHOSEN)
**Why it works:**
- core_relationships table is accessible across orgs
- Direct query can find all MEMBER_OF relationships for a user
- Returns organization_id so we know which orgs user belongs to

```typescript
const { data: memberships } = await supabase
  .from('core_relationships')
  .select('to_entity_id, organization_id, relationship_data')
  .eq('from_entity_id', userId)
  .eq('relationship_type', 'MEMBER_OF')
  .eq('is_active', true)
// ✅ Returns: [{ organization_id: 'tenant-A', relationship_data: { role: 'owner' } }]
```

---

## Where RPC IS Used

The `/api/v2/auth/resolve-membership` endpoint **does NOT use the RPC** for the same reason.

### Current Implementation (Correct):
```typescript
// /api/v2/auth/resolve-membership/route.ts:68-73
const { data: relationships } = await supabaseService
  .from('core_relationships')
  .select('id, to_entity_id, organization_id, relationship_data, is_active')
  .eq('from_entity_id', userId)
  .eq('relationship_type', 'MEMBER_OF')
  .eq('is_active', true)
```

### Where RPC WORKS:
```typescript
// ✅ Creating entities in a known tenant org
await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8', // Tenant org
  p_entity: {
    entity_type: 'CUSTOMER',
    entity_name: 'John Doe'
  }
})

// ✅ Reading entities within same org
await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'READ',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8', // Tenant org
  p_entity: {
    entity_type: 'PRODUCT'
  }
})
```

---

## Recommendation

**For authentication/membership resolution:**
- ✅ Use direct queries on `core_relationships`
- ❌ Do NOT use `hera_entities_crud_v1` RPC

**For business operations:**
- ✅ Use `hera_entities_crud_v1` RPC
- ✅ All operations within a known tenant org

**This is by design and follows HERA's multi-tenant architecture.**

---

## Code Comments Added

```typescript
// src/lib/auth/verify-auth.ts:107-109
// Resolve identity + memberships via direct query
// Note: Cannot use hera_entities_crud_v1 RPC because MEMBER_OF relationships
// are stored in tenant orgs, not platform org where USER entities live
```

```typescript
// src/lib/auth/verify-auth.ts:217-218
// Query user's memberships and roles directly
// Note: Cannot use hera_entities_crud_v1 RPC for cross-org relationship queries
```

---

## Summary

| Aspect | RPC (hera_entities_crud_v1) | Direct Query |
|--------|---------------------------|--------------|
| **Respects org boundaries** | ✅ Yes (by design) | ⚠️ Can query across orgs |
| **Finds cross-org relationships** | ❌ No | ✅ Yes |
| **Use for auth** | ❌ No | ✅ Yes |
| **Use for business ops** | ✅ Yes | ❌ No (use RPC) |
| **Multi-tenant safe** | ✅ Yes | ⚠️ Requires careful filtering |

**Decision:** Use direct queries for auth, RPC for everything else.
