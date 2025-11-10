-- ===================================================================
-- FIX: hera_user_remove_from_org_v1
-- Purpose: Remove a user from an organization
-- Status: PRODUCTION READY - Simplified based on data analysis
-- ===================================================================

-- DROP old version
DROP FUNCTION IF EXISTS public.hera_user_remove_from_org_v1(uuid, uuid);

-- CREATE simplified version (no dynamic data deletion needed)
CREATE OR REPLACE FUNCTION public.hera_user_remove_from_org_v1(
  p_organization_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_org_entity_id uuid;
  v_member_of_deleted int;
  v_has_role_deleted int;
BEGIN
  -- 1) Find the organization entity ID for this tenant
  SELECT ce.id INTO v_org_entity_id
  FROM core_entities ce
  WHERE ce.organization_id = p_organization_id
    AND ce.entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'Organization entity not found for organization_id=%', p_organization_id;
  END IF;

  -- 2) DELETE MEMBER_OF relationship
  DELETE FROM public.core_relationships
   WHERE organization_id = p_organization_id
     AND from_entity_id = p_user_id
     AND to_entity_id = v_org_entity_id
     AND relationship_type = 'MEMBER_OF';

  GET DIAGNOSTICS v_member_of_deleted = ROW_COUNT;

  -- 3) DELETE all HAS_ROLE relationships for this user in this org
  DELETE FROM public.core_relationships
   WHERE organization_id = p_organization_id
     AND from_entity_id = p_user_id
     AND relationship_type = 'HAS_ROLE';

  GET DIAGNOSTICS v_has_role_deleted = ROW_COUNT;

  -- 4) Return confirmation with counts
  RETURN jsonb_build_object(
    'ok', true,
    'removed_user_id', p_user_id,
    'member_of_deleted', v_member_of_deleted,
    'has_role_deleted', v_has_role_deleted,
    'removed_at', now()
  );
END;
$fn$;

-- Permissions
REVOKE ALL ON FUNCTION public.hera_user_remove_from_org_v1(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_user_remove_from_org_v1(uuid, uuid) TO authenticated, service_role;

-- Documentation
COMMENT ON FUNCTION public.hera_user_remove_from_org_v1(uuid, uuid)
IS 'Removes a user from an organization by deleting MEMBER_OF and all HAS_ROLE relationships. User entity in platform org remains untouched for multi-org support.';

-- ===================================================================
-- WHAT THIS DOES:
-- ===================================================================
-- 1. ✅ Finds organization entity in tenant org
-- 2. ✅ Deletes MEMBER_OF relationship (user no longer member)
-- 3. ✅ Deletes all HAS_ROLE relationships (removes all role assignments)
-- 4. ✅ Returns detailed counts for verification
-- 5. ✅ Preserves platform USER entity (multi-org safe)
-- 6. ✅ No dynamic data deletion (verified not needed via data analysis)

-- ===================================================================
-- TESTING:
-- ===================================================================
-- Test with HERA Salon Demo:
/*
-- Before removal - user should be in list
SELECT * FROM hera_users_list_v1(
  'de5f248d-7747-44f3-9d11-a279f3158fa5'::uuid,
  25,
  0
);

-- Remove user
SELECT hera_user_remove_from_org_v1(
  'de5f248d-7747-44f3-9d11-a279f3158fa5'::uuid,  -- HERA Salon Demo
  '1ac56047-78c9-4c2c-93db-84dcf307ab91'::uuid   -- salon@heraerp.com user
);

-- Expected result:
{
  "ok": true,
  "removed_user_id": "1ac56047-78c9-4c2c-93db-84dcf307ab91",
  "member_of_deleted": 1,
  "has_role_deleted": 1,
  "removed_at": "2025-01-07T..."
}

-- After removal - user should NOT be in list
SELECT * FROM hera_users_list_v1(
  'de5f248d-7747-44f3-9d11-a279f3158fa5'::uuid,
  25,
  0
);

-- Verify relationships deleted
SELECT COUNT(*) FROM core_relationships
WHERE organization_id = 'de5f248d-7747-44f3-9d11-a279f3158fa5'
  AND from_entity_id = '1ac56047-78c9-4c2c-93db-84dcf307ab91';
-- Expected: 0

-- Verify platform USER entity still exists
SELECT * FROM core_entities
WHERE id = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
  AND organization_id = '00000000-0000-0000-0000-000000000000';
-- Expected: 1 row (user entity preserved)
*/

-- ===================================================================
-- DEPLOYMENT COMMAND:
-- ===================================================================
-- psql $DATABASE_URL -f mcp-server/fix-hera-user-remove-from-org-v1.sql

-- ===================================================================
-- ROLLBACK (if needed):
-- ===================================================================
-- DROP FUNCTION IF EXISTS public.hera_user_remove_from_org_v1(uuid, uuid);
