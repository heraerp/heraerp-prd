# 🏛️ ROLE as First-Class Entity - Architectural Fix

## ❌ Critical Issue Identified

The initial implementation treated `role` as just a string field on Staff, **violating HERA's Universal Entity Pattern**.

### What Was Wrong:
1. **Seed Script**: Only created `role_title` string field, no STAFF_HAS_ROLE relationship
2. **Hook**: No support for role_id or relationship creation
3. **Frontend**: Hardcoded role dropdown instead of ROLE entities
4. **Missing Benefits**: No RBAC at data layer, no role reusability, no audit trail

---

## ✅ Architectural Fix Applied

### 1. **Seed Script Updated** (`/scripts/seed/salon-staff.ts`)

**Before:**
```typescript
// WRONG: Only string field, no relationship
{ field_name: 'role_title', field_type: 'text', field_value: staffData.role }
```

**After:**
```typescript
// CORRECT: Denormalized string + canonical relationship
{ field_name: 'role_title', field_type: 'text', field_value: staffData.role }, // Display only

// Create STAFF_HAS_ROLE relationship (canonical source of truth)
await createRelationship(ORG!, {
  p_from_entity_id: staffId,
  p_to_entity_id: roleId,
  p_relationship_type: 'STAFF_HAS_ROLE',
  p_smart_code: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1'
})
```

### 2. **Hook Updated** (`/src/hooks/useHeraStaff.ts`)

**Interface Enhancement:**
```typescript
export interface StaffFormValues {
  // ... other fields
  role_id?: string        // ✅ CANONICAL: ROLE entity ID for relationship
  role_title?: string     // ✅ DENORMALIZED: For display/search only
}
```

**createStaff() Enhancement:**
```typescript
// Step 4: Create STAFF_HAS_ROLE relationship (canonical source of truth)
if (staffData.role_id) {
  await createRelationship(organizationId, {
    p_from_entity_id: newStaff.id,
    p_to_entity_id: staffData.role_id,
    p_relationship_type: 'STAFF_HAS_ROLE',
    p_smart_code: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1'
  })
}
```

---

## 🏗️ Correct HERA Pattern

### ROLE Entity (First-Class)
```typescript
{
  "entity_type": "ROLE",
  "entity_name": "Senior Stylist",
  "smart_code": "HERA.SALON.ROLE.ENTITY.ITEM.V1",
  "dynamic_fields": {
    "permissions": {
      "value": ["staff.read", "staff.edit", "schedule.manage"],
      "type": "json",
      "smart_code": "HERA.SALON.ROLE.DYN.PERMISSIONS.V1"
    },
    "rank": {
      "value": 3,
      "type": "number",
      "smart_code": "HERA.SALON.ROLE.DYN.RANK.V1"
    }
  }
}
```

### STAFF → ROLE Relationship
```typescript
{
  "from_entity_id": "<STAFF_ID>",
  "to_entity_id": "<ROLE_ID>",
  "relationship_type": "STAFF_HAS_ROLE",
  "smart_code": "HERA.SALON.STAFF.REL.HAS_ROLE.V1"
}
```

### STAFF Dynamic Fields (Denormalized)
```typescript
{
  "role_title": {
    "value": "Senior Stylist",
    "type": "text",
    "smart_code": "HERA.SALON.STAFF.DYN.ROLE_TITLE.V1"  // For quick display/search
  }
}
```

---

## 🎯 Benefits of Proper Architecture

### 1. **Reusability**
- One ROLE entity → Many Staff members
- Consistent role definitions across organization
- Centralized role management

### 2. **RBAC at Data Layer**
- Permissions attached to ROLE entity (JSON field)
- Policy decisions based on relationships
- Evolve roles without code changes

### 3. **Per-Org Isolation**
- Each salon has custom role catalog
- Multi-tenant role definitions
- No cross-org role pollution

### 4. **Auditability**
- Changing role = Update STAFF_HAS_ROLE link
- Complete audit trail in relationships table
- Track role history over time

### 5. **Frontend Flexibility**
```typescript
// Fetch ROLE entities for dropdown
const { data: roles } = useQuery({
  queryKey: ['roles', organizationId],
  queryFn: async () => {
    return await getEntities('', {
      p_organization_id: organizationId,
      p_entity_type: 'ROLE'
    })
  }
})

// Create staff with proper role link
await createStaff({
  first_name: 'Maya',
  last_name: 'Pereira',
  email: 'maya@salon.com',
  role_id: selectedRole.id,           // ← Canonical relationship
  role_title: selectedRole.entity_name // ← Denormalized display
})
```

---

## 📋 Migration Strategy (If Needed)

### Phase 1: Backward Compatible
- **Keep**: `role_title` string field for display/search
- **Add**: STAFF_HAS_ROLE relationships as source of truth
- **Reads**: Prefer relationship, fallback to role_title if not set

### Phase 2: Full Migration
- Seed ROLE entities if they don't exist
- Create STAFF_HAS_ROLE for all existing staff
- Sync role_title with relationship

### Phase 3: Cleanup (Optional)
- Frontend reads from relationship only
- role_title becomes pure cache/display field
- Update on any role change

---

## 🔒 RBAC Enforcement Flow

### 1. **Auth/User → Role Mapping**
```
Auth User → Staff Entity → STAFF_HAS_ROLE → ROLE Entity → Permissions JSON
```

### 2. **Frontend Visibility**
```typescript
// Read role permissions to hide sensitive fields
if (!role.permissions.includes('staff.cost.read')) {
  delete staffData.hourly_cost // Hide from non-managers
}
```

### 3. **Backend Enforcement (RLS)**
```sql
-- Check caller's role has required permission
SELECT EXISTS (
  SELECT 1 FROM core_relationships r
  JOIN core_entities role ON r.to_entity_id = role.id
  WHERE r.from_entity_id = auth.uid()
    AND r.relationship_type = 'STAFF_HAS_ROLE'
    AND role.dynamic_data->>'permissions' ? 'staff.cost.read'
)
```

---

## 🚀 Next Steps

### ✅ Completed:
- [x] Seed script creates STAFF_HAS_ROLE relationships
- [x] Hook supports role_id and creates relationships
- [x] Documentation updated with proper pattern

### 🟡 Recommended (For Full Compliance):
- [ ] Create `useHeraRoles` hook to fetch ROLE entities
- [ ] Update frontend dropdown to use ROLE entities instead of hardcoded strings
- [ ] Add role relationship to staff display (show permissions badge)
- [ ] Implement RBAC enforcement in backend (RLS policies)
- [ ] Add role change audit trail view

---

## 📖 Key Takeaway

**ROLE is absolutely a first-class entity with proper relationships from Staff.**

This gives you:
- ✅ Clean reuse across staff members
- ✅ Per-organization role catalogs
- ✅ Robust RBAC with data-layer enforcement
- ✅ Complete auditability
- ✅ Consistency with HERA Universal Entity Pattern

The denormalized `role_title` field is **acceptable for performance/display**, but the canonical source of truth is the **STAFF_HAS_ROLE relationship** pointing to a **ROLE entity**.
