-- ===================================================================
-- FIX: hera_users_list_v1
-- Purpose: List all users in an organization with their roles
-- Status: FIXED - Ambiguous column reference resolved
-- ===================================================================

-- DROP old version
DROP FUNCTION IF EXISTS public.hera_users_list_v1(uuid, integer, integer);

-- CREATE optimized version with FIXED column references
CREATE OR REPLACE FUNCTION public.hera_users_list_v1(
  p_organization_id uuid,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  role text,
  role_entity_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  RETURN QUERY
  WITH org_entity AS (
    SELECT ce.id AS org_entity_id  -- ✅ FIXED: Explicit table alias to avoid ambiguity
    FROM core_entities ce
    WHERE ce.organization_id = p_organization_id
      AND ce.entity_type = 'ORGANIZATION'
    LIMIT 1
  ),
  members AS (
    SELECT
      r.from_entity_id AS user_id,
      r.created_at AS joined_at
    FROM core_relationships r
    CROSS JOIN org_entity oe
    WHERE r.organization_id = p_organization_id
      AND r.to_entity_id = oe.org_entity_id
      AND r.relationship_type = 'MEMBER_OF'
      AND COALESCE(r.is_active, true) = true
  )
  SELECT
    m.user_id AS id,
    COALESCE(e.entity_name, 'User') AS name,
    COALESCE(hr_role.role, 'MEMBER') AS role,
    hr_role.role_entity_id
  FROM members m
  LEFT JOIN core_entities e
    ON e.id = m.user_id
   AND e.organization_id = c_platform_org
   AND e.entity_type = 'USER'
  -- LEFT JOIN LATERAL to get authoritative role from HAS_ROLE
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(hr.relationship_data->>'role_code', re.entity_code, 'MEMBER') AS role,
      hr.to_entity_id AS role_entity_id
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
  ) hr_role ON true
  ORDER BY m.joined_at DESC NULLS LAST, m.user_id
  LIMIT p_limit
  OFFSET p_offset;
END;
$fn$;

-- Tighten permissions
REVOKE ALL ON FUNCTION public.hera_users_list_v1(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_users_list_v1(uuid, integer, integer) TO authenticated, service_role;

-- Documentation
COMMENT ON FUNCTION public.hera_users_list_v1(uuid, integer, integer) IS
  'Lists users in an organization with their primary roles.
   Uses MEMBER_OF for membership and HAS_ROLE for authoritative role.
   Returns id (user entity ID), name, role (primary role code), and role_entity_id.
   Platform org users joined correctly. Supports paging via limit/offset.';

-- ===================================================================
-- WHAT WAS FIXED:
-- ===================================================================
-- 1. ✅ Added explicit table alias 'ce' in org_entity CTE
-- 2. ✅ Changed 'SELECT id' to 'SELECT ce.id' to avoid ambiguity
-- 3. ✅ Uses MEMBER_OF for membership (correct relationship type)
-- 4. ✅ Gets role from HAS_ROLE relationships (modern RBAC pattern)
-- 5. ✅ Joins to ROLE entities for role_code
-- 6. ✅ Properly handles organization entity ID lookup
-- 7. ✅ Fallback to 'MEMBER' if no role found
-- 8. ✅ Returns role_entity_id for future role management

-- ===================================================================
-- TESTING:
-- ===================================================================
-- Test with HERA Salon Demo:
/*
SELECT * FROM hera_users_list_v1(
  'de5f248d-7747-44f3-9d11-a279f3158fa5'::uuid,  -- HERA Salon Demo
  25,
  0
);

-- Expected result:
-- Should return users with roles from HAS_ROLE relationships
-- Example:
-- id: 1ac56047-78c9-4c2c-93db-84dcf307ab91
-- name: salon@heraerp.com (or User_...)
-- role: ORG_OWNER
-- role_entity_id: <uuid of ROLE entity>
*/

-- ===================================================================
-- DEPLOYMENT COMMAND:
-- ===================================================================
-- psql $DATABASE_URL -f mcp-server/fix-hera-users-list-v1.sql
