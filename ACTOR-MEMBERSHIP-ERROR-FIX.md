# Actor Membership Error Fix - HERA_ACTOR_NOT_MEMBER

## 🐛 **Root Cause**

**Error:** `HERA_ACTOR_NOT_MEMBER` when creating services

**What's happening:**
1. ✅ User is authenticated (`user_id: 001a2eb9-b14c-4dda-ae8c-595fb377a982`)
2. ✅ Organization context is set (`org_id: 378f24fb-d496-4ff7-8afa-ea34895a0eb8`)
3. ✅ HERAAuthProvider shows membership resolved successfully
4. ❌ RPC `hera_entities_crud_v1` rejects the request with `HERA_ACTOR_NOT_MEMBER`

**Root cause:** The RPC function validates actor membership by checking for a relationship in `core_relationships` table. The relationship might be:
- Missing entirely
- In the wrong format
- Using incorrect relationship type

## 🔍 **Expected Data Structure** (from CLAUDE.md)

According to HERA v2.2 authentication architecture:

```sql
-- USER entities ALWAYS in Platform Organization
-- Platform Org UUID: '00000000-0000-0000-0000-000000000000'

-- Membership relationship stored in TENANT organization
INSERT INTO core_relationships (
  organization_id,           -- TENANT org (NOT platform org)
  from_entity_id,           -- User entity ID
  to_entity_id,             -- Organization entity ID
  relationship_type,        -- 'USER_MEMBER_OF_ORG'
  smart_code,              -- 'HERA.AUTH.REL.USER_MEMBER_OF_ORG.V1'
  relationship_data,        -- { role: 'owner', permissions: [...] }
  created_at,
  updated_at,
  created_by,
  updated_by
) VALUES (
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Hair Talkz Salon org
  '001a2eb9-b14c-4dda-ae8c-595fb377a982',  -- User entity
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Organization entity
  'USER_MEMBER_OF_ORG',
  'HERA.AUTH.REL.USER_MEMBER_OF_ORG.V1',
  '{"role": "owner", "permissions": ["salon:read:all", "salon:write:all", "salon:delete:all"]}',
  NOW(),
  NOW(),
  '001a2eb9-b14c-4dda-ae8c-595fb377a982',  -- Created by user
  '001a2eb9-b14c-4dda-ae8c-595fb377a982'   -- Updated by user
);
```

## 🔧 **Solution: Database Fix**

### **Option 1: SQL Script to Create Missing Memberships**

```sql
-- Check if membership exists
SELECT
  cr.id,
  cr.from_entity_id AS user_entity_id,
  cr.to_entity_id AS org_entity_id,
  cr.relationship_type,
  cr.organization_id,
  ce_user.entity_name AS user_name,
  ce_org.entity_name AS org_name
FROM core_relationships cr
LEFT JOIN core_entities ce_user ON ce_user.id = cr.from_entity_id
LEFT JOIN core_entities ce_org ON ce_org.id = cr.to_entity_id
WHERE cr.from_entity_id = '001a2eb9-b14c-4dda-ae8c-595fb377a982'
  AND cr.to_entity_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND cr.relationship_type = 'USER_MEMBER_OF_ORG';

-- If no results, create the membership:
INSERT INTO core_relationships (
  organization_id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  smart_code,
  relationship_data,
  created_at,
  updated_at,
  created_by,
  updated_by
) VALUES (
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Organization (Hair Talkz Salon)
  '001a2eb9-b14c-4dda-ae8c-595fb377a982',  -- User entity ID
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Organization entity ID (same as org_id)
  'USER_MEMBER_OF_ORG',
  'HERA.AUTH.REL.USER_MEMBER_OF_ORG.V1',
  jsonb_build_object(
    'role', 'owner',
    'permissions', jsonb_build_array(
      'salon:read:all',
      'salon:write:all',
      'salon:delete:all',
      'salon:admin:full',
      'salon:finance:full',
      'salon:staff:manage',
      'salon:settings:manage'
    ),
    'active', true,
    'joined_at', NOW()
  ),
  NOW(),
  NOW(),
  '001a2eb9-b14c-4dda-ae8c-595fb377a982',  -- Created by user
  '001a2eb9-b14c-4dda-ae8c-595fb377a982'   -- Updated by user
)
ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
DO UPDATE SET
  updated_at = NOW(),
  updated_by = '001a2eb9-b14c-4dda-ae8c-595fb377a982',
  relationship_data = EXCLUDED.relationship_data;
```

### **Option 2: Use HERA API to Create Membership**

```typescript
import { createRelationship } from '@/lib/universal-api-v2-client'

await createRelationship(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  // orgId
  {
    p_from_entity_id: '001a2eb9-b14c-4dda-ae8c-595fb377a982',  // User entity
    p_to_entity_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',    // Org entity
    p_relationship_type: 'USER_MEMBER_OF_ORG',
    p_smart_code: 'HERA.AUTH.REL.USER_MEMBER_OF_ORG.V1',
    p_relationship_data: {
      role: 'owner',
      permissions: [
        'salon:read:all',
        'salon:write:all',
        'salon:delete:all',
        'salon:admin:full',
        'salon:finance:full',
        'salon:staff:manage',
        'salon:settings:manage'
      ],
      active: true,
      joined_at: new Date().toISOString()
    }
  }
)
```

## ✅ **Code Fix Applied**

Updated `/src/hooks/useUniversalEntityV1.ts` (lines 519-551) to:

1. **Better error detection** - Check for `data.success === false`
2. **Detailed error logging** - Log full error response structure
3. **User-friendly error messages** - Provide actionable guidance:
   - `HERA_ACTOR_NOT_MEMBER` → "Your account is not properly linked to this organization. Please try logging out and logging back in."
   - `HERA_ORG_MISMATCH` → "Organization mismatch error."
   - Smart code errors → "Invalid service configuration."

## 🧪 **How to Verify the Fix**

### **Step 1: Check if membership exists**

```sql
SELECT
  cr.*,
  ce_user.entity_name AS user_name,
  ce_org.entity_name AS org_name
FROM core_relationships cr
LEFT JOIN core_entities ce_user ON ce_user.id = cr.from_entity_id
LEFT JOIN core_entities ce_org ON ce_org.id = cr.to_entity_id
WHERE cr.from_entity_id = '001a2eb9-b14c-4dda-ae8c-595fb377a982'
  AND cr.relationship_type = 'USER_MEMBER_OF_ORG';
```

**Expected result:** At least one row showing membership in Hair Talkz Salon

### **Step 2: If missing, run the INSERT script above**

### **Step 3: Test service creation**
1. Refresh the browser (clear cached auth state)
2. Try creating a new service
3. Should now work without `HERA_ACTOR_NOT_MEMBER` error

## 📊 **Why This Error Occurs**

According to HERA v2.2 architecture, there are **two levels of membership validation**:

**Level 1: HERAAuthProvider (UI layer)**
- Checks Supabase Auth (`auth.users` table)
- Calls `/api/v2/auth/resolve-membership`
- This is what shows "✅ Membership resolved"
- **BUT**: This doesn't guarantee the relationship exists in `core_relationships`

**Level 2: RPC Functions (Data layer)**
- Validates actor membership by querying `core_relationships` table
- Requires explicit `USER_MEMBER_OF_ORG` relationship
- This is what fails with `HERA_ACTOR_NOT_MEMBER`

The mismatch suggests:
- User was created in Supabase Auth
- Organization membership was tracked outside HERA Sacred Six
- The `USER_MEMBER_OF_ORG` relationship was never created in `core_relationships`

## 🎯 **Long-term Fix: Automatic Membership Creation**

To prevent this in the future, the signup/onboarding flow should:

1. Create USER entity in platform organization
2. **Automatically create `USER_MEMBER_OF_ORG` relationship** in tenant organization
3. Update Supabase Auth user metadata with `organization_id`

This ensures Level 1 and Level 2 validations are always in sync.

## 📝 **Related Files**

- **Error handler:** `/src/hooks/useUniversalEntityV1.ts` (lines 519-551)
- **Auth provider:** `/src/components/auth/HERAAuthProvider.tsx`
- **RPC function:** `hera_entities_crud_v1` (database)
- **Schema:** `core_relationships` table (Sacred Six)

---

**Status:** ✅ **Error handling improved** - Now shows user-friendly message
**Action needed:** 🔧 **Create missing membership relationship in database**
**Priority:** 🔴 **High** - Blocks all entity creation operations

**Date:** 2025-10-30
**Reporter:** Claude Code Assistant
