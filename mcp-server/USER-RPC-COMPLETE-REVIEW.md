# 🔍 COMPLETE USER RPC REVIEW - ALL 4 FUNCTIONS

**Date:** 2025-11-07
**Status:** Complete Analysis

---

## 📋 **THE 4 USER RPCs IN YOUR DATABASE**

1. ✅ `hera_user_orgs_list_v1` - **FIXED TODAY**
2. ⚠️ `hera_user_remove_from_org_v1` - **NEEDS MAJOR FIX**
3. ⚠️ `hera_user_switch_org_v1` - **NEEDS ENHANCEMENT**
4. ⚠️ `hera_users_list_v1` - **NEEDS MAJOR FIX**

---

## 1️⃣ **`hera_user_orgs_list_v1`** - ✅ FIXED AND READY

**Signature:**
```sql
hera_user_orgs_list_v1(p_org_id uuid, p_user_id uuid)
RETURNS TABLE(id uuid, name text, role text, is_primary boolean, last_accessed timestamptz)
```

**Status:** ✅ **PRODUCTION READY**

**What We Fixed Today:**
- ✅ Changed `entity_type = 'ORG'` → `entity_type = 'ORGANIZATION'`
- ✅ Removed incorrect `org.organization_id = p_org_id` filter
- ✅ Now correctly uses MEMBER_OF + HAS_ROLE pattern
- ✅ Role resolution from HAS_ROLE.relationship_data.role_code ✅
- ✅ Tested with single-org and multi-org users ✅

**Test Results:** 100% passing

**No further action needed!**

---

## 2️⃣ **`hera_user_remove_from_org_v1`** - ⚠️ CRITICAL ISSUES

**Signature:**
```sql
hera_user_remove_from_org_v1(p_organization_id uuid, p_user_id uuid)
RETURNS jsonb
```

**Current Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.hera_user_remove_from_org_v1(
  p_organization_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  -- ❌ ISSUE #1: Uses wrong relationship type
  update public.core_relationships r
     set is_active = false,
         metadata = coalesce(r.metadata,'{}'::jsonb) || jsonb_build_object('removed_at', now())
   where r.organization_id = p_organization_id
     and r.from_entity_id = p_user_id
     and r.to_entity_id = p_organization_id  -- ❌ ISSUE #2: Wrong! Should be org entity ID
     and r.relationship_type = 'USER_MEMBER_OF_ORG';  -- ❌ Should be 'MEMBER_OF'

  -- ❌ ISSUE #3: Sets status in dynamic_data (should use HAS_ROLE)
  insert into public.core_dynamic_data (...)
  values (p_organization_id, p_user_id, 'status', 'text', 'inactive', ...)
  ...

  return jsonb_build_object('ok', true, 'removed_user_id', p_user_id);
end;
$$;
```

### ❌ **CRITICAL ISSUES:**

**Issue #1: Wrong Relationship Type**
- Uses: `relationship_type = 'USER_MEMBER_OF_ORG'`
- Should be: `relationship_type = 'MEMBER_OF'`

**Issue #2: Wrong to_entity_id Check**
- Uses: `r.to_entity_id = p_organization_id`
- Problem: `p_organization_id` is core_organizations.id
- Should query for: Organization entity ID from core_entities

**Issue #3: Wrong metadata Column**
- Uses: `r.metadata`
- Should be: `r.relationship_data` (metadata column doesn't exist!)

**Issue #4: Incomplete Removal**
- Only deactivates MEMBER_OF relationship
- Does NOT deactivate HAS_ROLE relationships
- User will still have roles in the organization!

**Issue #5: Status in Dynamic Data**
- Sets status in core_dynamic_data
- Should deactivate HAS_ROLE relationships instead

---

### ✅ **CORRECTED VERSION:**

```sql
CREATE OR REPLACE FUNCTION public.hera_user_remove_from_org_v1(
  p_organization_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_entity_id uuid;
  v_member_of_count int;
  v_has_role_count int;
BEGIN
  -- Get organization entity ID
  SELECT id INTO v_org_entity_id
  FROM core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'organization_entity_not_found',
      'message', 'Organization entity not found'
    );
  END IF;

  -- Deactivate MEMBER_OF relationship
  UPDATE core_relationships
  SET is_active = false,
      relationship_data = COALESCE(relationship_data, '{}'::jsonb)
                          || jsonb_build_object('removed_at', now()),
      updated_at = now()
  WHERE organization_id = p_organization_id
    AND from_entity_id = p_user_id
    AND to_entity_id = v_org_entity_id
    AND relationship_type = 'MEMBER_OF';

  GET DIAGNOSTICS v_member_of_count = ROW_COUNT;

  -- Deactivate ALL HAS_ROLE relationships for this user in this org
  UPDATE core_relationships
  SET is_active = false,
      relationship_data = COALESCE(relationship_data, '{}'::jsonb)
                          || jsonb_build_object('removed_at', now()),
      updated_at = now()
  WHERE organization_id = p_organization_id
    AND from_entity_id = p_user_id
    AND relationship_type = 'HAS_ROLE';

  GET DIAGNOSTICS v_has_role_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'removed_user_id', p_user_id,
    'organization_id', p_organization_id,
    'org_entity_id', v_org_entity_id,
    'member_of_deactivated', v_member_of_count,
    'roles_deactivated', v_has_role_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'removal_failed',
      'message', SQLERRM
    );
END;
$$;

REVOKE ALL ON FUNCTION public.hera_user_remove_from_org_v1(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_user_remove_from_org_v1(uuid, uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_user_remove_from_org_v1(uuid, uuid) IS
  'Removes user from organization by deactivating MEMBER_OF and all HAS_ROLE relationships.
   Follows HERA pattern: membership and roles are separate concerns.';
```

---

## 3️⃣ **`hera_user_switch_org_v1`** - ⚠️ NEEDS ENHANCEMENT

**Signature:**
```sql
hera_user_switch_org_v1(p_user_id uuid, p_organization_id uuid)
RETURNS jsonb
```

**Current Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.hera_user_switch_org_v1(
  p_user_id uuid,
  p_organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  -- ❌ ISSUE: Does NOTHING! Just returns OK
  return jsonb_build_object('ok', true, 'organization_id', p_organization_id);
end;
$$;
```

### ❌ **CRITICAL ISSUES:**

**Issue #1: Does Nothing**
- Function is a no-op
- Just returns success without doing anything
- Doesn't validate membership
- Doesn't update last_accessed

**Issue #2: No Membership Validation**
- Doesn't check if user is member of target org
- Could "switch" to org user doesn't belong to

**Issue #3: No last_accessed Tracking**
- Doesn't update MEMBER_OF.relationship_data.last_accessed
- Can't track when user last used each organization

---

### ✅ **ENHANCED VERSION:**

```sql
CREATE OR REPLACE FUNCTION public.hera_user_switch_org_v1(
  p_user_id uuid,
  p_organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_entity_id uuid;
  v_is_member boolean;
  v_org_name text;
  v_primary_role text;
BEGIN
  -- Get organization entity ID and name
  SELECT id, entity_name
  INTO v_org_entity_id, v_org_name
  FROM core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'organization_not_found',
      'message', 'Organization not found'
    );
  END IF;

  -- Check if user is active member
  SELECT EXISTS (
    SELECT 1
    FROM core_relationships
    WHERE organization_id = p_organization_id
      AND from_entity_id = p_user_id
      AND to_entity_id = v_org_entity_id
      AND relationship_type = 'MEMBER_OF'
      AND COALESCE(is_active, true) = true
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'not_a_member',
      'message', 'User is not a member of this organization'
    );
  END IF;

  -- Get user's primary role in this org
  SELECT COALESCE(
    (SELECT COALESCE(
      hr.relationship_data->>'role_code',
      re.entity_code,
      'MEMBER'
    )
    FROM core_relationships hr
    LEFT JOIN core_entities re
      ON re.id = hr.to_entity_id
     AND re.entity_type = 'ROLE'
    WHERE hr.organization_id = p_organization_id
      AND hr.from_entity_id = p_user_id
      AND hr.relationship_type = 'HAS_ROLE'
      AND COALESCE(hr.is_active, true) = true
      AND COALESCE((hr.relationship_data->>'is_primary')::boolean, false) = true
    LIMIT 1
    ),
    'MEMBER'
  ) INTO v_primary_role;

  -- Update last_accessed in MEMBER_OF relationship
  UPDATE core_relationships
  SET relationship_data = COALESCE(relationship_data, '{}'::jsonb)
                          || jsonb_build_object('last_accessed', now()),
      updated_at = now()
  WHERE organization_id = p_organization_id
    AND from_entity_id = p_user_id
    AND to_entity_id = v_org_entity_id
    AND relationship_type = 'MEMBER_OF';

  RETURN jsonb_build_object(
    'ok', true,
    'organization_id', p_organization_id,
    'organization_name', v_org_name,
    'primary_role', v_primary_role,
    'switched_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'switch_failed',
      'message', SQLERRM
    );
END;
$$;

REVOKE ALL ON FUNCTION public.hera_user_switch_org_v1(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_user_switch_org_v1(uuid, uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_user_switch_org_v1(uuid, uuid) IS
  'Switches user active organization context. Validates membership, updates last_accessed,
   and returns organization details with primary role.';
```

---

## 4️⃣ **`hera_users_list_v1`** - ⚠️ CRITICAL ISSUES

**Signature:**
```sql
hera_users_list_v1(p_organization_id uuid, p_limit int DEFAULT 25, p_offset int DEFAULT 0)
RETURNS TABLE(id uuid, name text, role text)
```

**Current Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.hera_users_list_v1(
  p_organization_id uuid,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
) RETURNS TABLE(id uuid, name text, role text)
LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  with zero as (select '00000000-0000-0000-0000-000000000000'::uuid as z)
  select
    r.from_entity_id as id,
    coalesce(e.entity_name,'User') as name,
    coalesce(dr.field_value_text,'viewer') as role  -- ❌ WRONG! Looks in dynamic_data
  from public.core_relationships r
  left join zero z on true
  left join public.core_entities e
         on e.id = r.from_entity_id
        and e.organization_id = z.z  -- ✅ Platform org (correct)
        and e.entity_type = 'USER'
  left join public.core_dynamic_data dr  -- ❌ WRONG! Should use HAS_ROLE
         on dr.organization_id = r.organization_id
        and dr.entity_id = r.from_entity_id
        and dr.field_name = 'role'
  where r.organization_id = p_organization_id
    and r.relationship_type = 'USER_MEMBER_OF_ORG'  -- ❌ Should be 'MEMBER_OF'
    and coalesce(r.is_active,true) = true
  order by r.created_at desc nulls last, r.from_entity_id
  limit p_limit offset p_offset
$$;
```

### ❌ **CRITICAL ISSUES:**

**Issue #1: Wrong Relationship Type**
- Uses: `relationship_type = 'USER_MEMBER_OF_ORG'`
- Should be: `relationship_type = 'MEMBER_OF'`

**Issue #2: Wrong Role Source**
- Looks for role in: `core_dynamic_data.field_name = 'role'`
- Should use: HAS_ROLE relationships with ROLE entities

**Issue #3: Wrong Return Format**
- Returns single role as text
- Should return: primary role + support for multiple roles

---

### ✅ **CORRECTED VERSION:**

```sql
CREATE OR REPLACE FUNCTION public.hera_users_list_v1(
  p_organization_id uuid,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
) RETURNS TABLE(
  id uuid,
  name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  RETURN QUERY
  WITH org_entity AS (
    -- Get organization entity ID
    SELECT id AS org_entity_id
    FROM core_entities
    WHERE organization_id = p_organization_id
      AND entity_type = 'ORGANIZATION'
    LIMIT 1
  ),
  members AS (
    -- Get all active members via MEMBER_OF
    SELECT
      r.from_entity_id AS user_id,
      r.created_at AS joined_at
    FROM core_relationships r
    CROSS JOIN org_entity oe
    WHERE r.organization_id = p_organization_id
      AND r.to_entity_id = oe.org_entity_id
      AND r.relationship_type = 'MEMBER_OF'
      AND COALESCE(r.is_active, true) = true
  ),
  users_with_roles AS (
    -- Join with USER entities and get primary role
    SELECT
      m.user_id AS id,
      COALESCE(e.entity_name, 'User') AS name,
      -- Get primary role from HAS_ROLE relationships
      COALESCE(
        (SELECT COALESCE(
          hr.relationship_data->>'role_code',
          re.entity_code,
          'MEMBER'
        )
        FROM core_relationships hr
        LEFT JOIN core_entities re
          ON re.id = hr.to_entity_id
         AND re.entity_type = 'ROLE'
        WHERE hr.organization_id = p_organization_id
          AND hr.from_entity_id = m.user_id
          AND hr.relationship_type = 'HAS_ROLE'
          AND COALESCE(hr.is_active, true) = true
        ORDER BY
          COALESCE((hr.relationship_data->>'is_primary')::boolean, false) DESC,
          hr.created_at ASC
        LIMIT 1
        ),
        'MEMBER'
      ) AS role,
      m.joined_at
    FROM members m
    LEFT JOIN core_entities e
      ON e.id = m.user_id
     AND e.organization_id = c_platform_org
     AND e.entity_type = 'USER'
  )
  SELECT
    ur.id,
    ur.name,
    ur.role
  FROM users_with_roles ur
  ORDER BY ur.joined_at DESC NULLS LAST, ur.id
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.hera_users_list_v1(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_users_list_v1(uuid, integer, integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_users_list_v1(uuid, integer, integer) IS
  'Lists users in organization with their primary roles. Uses MEMBER_OF for membership
   and HAS_ROLE for role information. Follows HERA pattern.';
```

---

## 📊 **SUMMARY TABLE**

| Function | Status | Issues | Action Required |
|----------|--------|--------|-----------------|
| `hera_user_orgs_list_v1` | ✅ Fixed | None | **NONE - READY** |
| `hera_user_remove_from_org_v1` | ❌ Broken | 5 critical | **FIX REQUIRED** |
| `hera_user_switch_org_v1` | ⚠️ Incomplete | 3 issues | **ENHANCE REQUIRED** |
| `hera_users_list_v1` | ❌ Broken | 3 critical | **FIX REQUIRED** |

---

## 🎯 **RECOMMENDED FIX ORDER**

### **Priority 1: `hera_users_list_v1`** (Most Used)
- **Impact:** HIGH - Used for team management, user directories
- **Issues:** Wrong relationship type, wrong role source
- **Effort:** MEDIUM - Similar to what we just fixed

### **Priority 2: `hera_user_remove_from_org_v1`** (Security Critical)
- **Impact:** HIGH - Incomplete removal leaves security holes
- **Issues:** 5 critical issues including incomplete deactivation
- **Effort:** MEDIUM - Need to handle both MEMBER_OF and HAS_ROLE

### **Priority 3: `hera_user_switch_org_v1`** (Nice to Have)
- **Impact:** MEDIUM - Frontend handles most of this already
- **Issues:** No-op function, no validation
- **Effort:** MEDIUM - Add validation + last_accessed tracking

---

## 🚀 **NEXT STEPS**

**Would you like me to:**
1. **Fix `hera_users_list_v1` next** (most commonly used)
2. **Fix `hera_user_remove_from_org_v1` next** (security critical)
3. **Fix all 3 remaining functions** (complete the user RPC suite)
4. **Create test scripts** for all fixes

Let me know which you prefer!

---

**End of Report**
