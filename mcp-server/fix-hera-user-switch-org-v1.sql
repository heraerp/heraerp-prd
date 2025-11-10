-- ===================================================================
-- FIX: hera_user_switch_org_v1
-- Purpose: Switch user's active organization context
-- Status: PRODUCTION READY - Enhanced with validation and tracking
-- ===================================================================

-- DROP old version
DROP FUNCTION IF EXISTS public.hera_user_switch_org_v1(uuid, uuid);

-- CREATE enhanced version
CREATE OR REPLACE FUNCTION public.hera_user_switch_org_v1(
  p_user_id uuid,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_org_entity_id uuid;
  v_is_member boolean;
  v_org_name text;
  v_primary_role text;
BEGIN
  -- 1) Get organization entity ID and name
  SELECT ce.id, ce.entity_name
  INTO v_org_entity_id, v_org_name
  FROM core_entities ce
  WHERE ce.organization_id = p_organization_id
    AND ce.entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'organization_not_found',
      'message', 'Organization not found'
    );
  END IF;

  -- 2) Check if user is active member
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

  -- 3) Get user's primary role in this org
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
    ORDER BY
      COALESCE((hr.relationship_data->>'is_primary')::boolean, false) DESC,
      hr.created_at ASC
    LIMIT 1
    ),
    'MEMBER'
  ) INTO v_primary_role;

  -- 4) Update last_accessed in MEMBER_OF relationship
  UPDATE core_relationships
  SET relationship_data = COALESCE(relationship_data, '{}'::jsonb)
                          || jsonb_build_object('last_accessed', now()),
      updated_at = now()
  WHERE organization_id = p_organization_id
    AND from_entity_id = p_user_id
    AND to_entity_id = v_org_entity_id
    AND relationship_type = 'MEMBER_OF';

  -- 5) Return success with organization details
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
$fn$;

-- Permissions
REVOKE ALL ON FUNCTION public.hera_user_switch_org_v1(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_user_switch_org_v1(uuid, uuid) TO authenticated, service_role;

-- Documentation
COMMENT ON FUNCTION public.hera_user_switch_org_v1(uuid, uuid)
IS 'Switches user active organization context. Validates membership, updates last_accessed timestamp in MEMBER_OF relationship, and returns organization details with primary role.';

-- ===================================================================
-- WHAT THIS DOES:
-- ===================================================================
-- 1. ✅ Validates organization exists
-- 2. ✅ Validates user is active member (MEMBER_OF relationship)
-- 3. ✅ Resolves user's primary role (HAS_ROLE relationship)
-- 4. ✅ Updates last_accessed timestamp in MEMBER_OF metadata
-- 5. ✅ Returns organization details + primary role
-- 6. ✅ Proper error handling with descriptive messages

-- ===================================================================
-- IMPROVEMENTS OVER OLD VERSION:
-- ===================================================================
-- OLD: Just returned { ok: true, organization_id }
-- NEW: ✅ Validates membership
--      ✅ Tracks last_accessed
--      ✅ Returns org name + primary role
--      ✅ Error handling with descriptive messages

-- ===================================================================
-- TESTING:
-- ===================================================================
-- Test with HERA Salon Demo:
/*
-- Test 1: Valid switch (user is member)
SELECT hera_user_switch_org_v1(
  '1ac56047-78c9-4c2c-93db-84dcf307ab91'::uuid,  -- salon@heraerp.com user
  'de5f248d-7747-44f3-9d11-a279f3158fa5'::uuid   -- HERA Salon Demo
);

-- Expected result:
{
  "ok": true,
  "organization_id": "de5f248d-7747-44f3-9d11-a279f3158fa5",
  "organization_name": "HERA Salon Demo",
  "primary_role": "ORG_OWNER",
  "switched_at": "2025-01-07T..."
}

-- Test 2: Invalid switch (user not member)
SELECT hera_user_switch_org_v1(
  '1ac56047-78c9-4c2c-93db-84dcf307ab91'::uuid,  -- salon@heraerp.com user
  '00000000-0000-0000-0000-000000000001'::uuid   -- Random non-existent org
);

-- Expected result:
{
  "ok": false,
  "error": "organization_not_found",
  "message": "Organization not found"
}

-- Test 3: Verify last_accessed updated
SELECT relationship_data->>'last_accessed'
FROM core_relationships
WHERE organization_id = 'de5f248d-7747-44f3-9d11-a279f3158fa5'
  AND from_entity_id = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
  AND relationship_type = 'MEMBER_OF';
-- Expected: Recent timestamp
*/

-- ===================================================================
-- DEPLOYMENT COMMAND:
-- ===================================================================
-- psql $DATABASE_URL -f mcp-server/fix-hera-user-switch-org-v1.sql
