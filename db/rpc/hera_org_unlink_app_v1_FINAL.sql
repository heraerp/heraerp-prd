-- ===================================================================
-- RPC: hera_org_unlink_app_v1 (PRODUCTION READY - FINAL)
-- Purpose: Uninstall (deactivate) a PLATFORM APP from a tenant org
-- Status: ✅ READY FOR DEPLOYMENT
-- Version: 1.0
--
-- Changes from Review:
-- - Fixed regex syntax errors (added missing $ anchors)
-- - Uses standard MEMBER_OF relationship pattern
-- - Added smart code segment validation
-- - Enhanced error messages with specific guidance
-- ===================================================================

CREATE OR REPLACE FUNCTION public.hera_org_unlink_app_v1(
  p_actor_user_id    uuid,
  p_organization_id  uuid,
  p_app_code         text,                -- UPPERCASE alnum, e.g. 'SALON'
  p_uninstalled_at   timestamptz DEFAULT now(),
  p_hard_delete      boolean     DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- Canonical PLATFORM org UUID (where all APP entities live)
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_code      text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id uuid;
  v_app_entity_id uuid;
  v_rel_id        uuid;
  v_affected      int  := 0;

  v_app_name      text;
  v_app_code_db   text;
  v_app_sc        text;
BEGIN
  -- ============================================================
  -- 1) INPUT VALIDATION
  -- ============================================================
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_unlink_app_v1: p_actor_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_unlink_app_v1: p_organization_id is required';
  END IF;
  IF v_app_code IS NULL THEN
    RAISE EXCEPTION 'hera_org_unlink_app_v1: p_app_code is required';
  END IF;

  -- Validate code format: UPPERCASE alphanumeric only (no underscores/spaces)
  -- FIXED: Added missing $ anchor for end-of-string match
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code;
  END IF;

  -- ============================================================
  -- 2) RESOLVE TENANT ORG ENTITY (SHADOW ENTITY)
  -- ============================================================
  SELECT id INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type     = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'No ORGANIZATION entity found for tenant %', p_organization_id;
  END IF;

  -- ============================================================
  -- 3) VALIDATE ACTOR MEMBERSHIP (STANDARD MEMBER_OF PATTERN)
  -- ============================================================
  -- Pattern: USER entity (from_entity_id) MEMBER_OF org entity (to_entity_id)
  -- This follows the verified HERA authentication pattern
  IF NOT EXISTS (
    SELECT 1
    FROM public.core_relationships r
    WHERE r.organization_id   = p_organization_id
      AND r.from_entity_id    = p_actor_user_id
      AND r.to_entity_id      = v_org_entity_id
      AND r.relationship_type = 'MEMBER_OF'
      AND COALESCE(r.is_active, true)
  ) THEN
    RAISE EXCEPTION 'Actor % is not an active member of organization %. Please verify actor has MEMBER_OF relationship with this organization.',
      p_actor_user_id, p_organization_id;
  END IF;

  -- ============================================================
  -- 4) RESOLVE PLATFORM APP ENTITY
  -- ============================================================
  SELECT e.id, e.entity_name, e.entity_code, e.smart_code
    INTO v_app_entity_id, v_app_name, v_app_code_db, v_app_sc
  FROM public.core_entities e
  WHERE e.organization_id = c_platform_org
    AND e.entity_type     = 'APP'
    AND e.entity_code     = v_app_code
  LIMIT 1;

  IF v_app_entity_id IS NULL THEN
    RAISE EXCEPTION 'APP with code "%" not found in PLATFORM org. Available APPs can be queried from core_entities with entity_type=APP and organization_id=%',
      v_app_code, c_platform_org;
  END IF;

  -- ============================================================
  -- 5) VALIDATE APP SMART CODE FORMAT (DEFENSIVE)
  -- ============================================================
  -- Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN (no underscores)
  -- FIXED: Added missing $ anchor for end-of-string match
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" is invalid. Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN where CODE is UPPERCASE alphanumeric',
      v_app_sc;
  END IF;

  -- Underscores not allowed in smart codes (HERA DNA rule)
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed in HERA DNA smart codes', v_app_sc;
  END IF;

  -- Segment 5 (app code) must match the p_app_code parameter
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_app_code THEN
    RAISE EXCEPTION 'APP smart_code segment mismatch: expected "%" but smart_code contains "%". Smart code: %',
      v_app_code,
      REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1'),
      v_app_sc;
  END IF;

  -- ============================================================
  -- 6) LOCATE EXISTING ORG_HAS_APP RELATIONSHIP
  -- ============================================================
  SELECT id INTO v_rel_id
  FROM public.core_relationships r
  WHERE r.organization_id   = p_organization_id
    AND r.from_entity_id    = v_org_entity_id
    AND r.to_entity_id      = v_app_entity_id
    AND r.relationship_type = 'ORG_HAS_APP'
  LIMIT 1;

  IF v_rel_id IS NULL THEN
    RAISE EXCEPTION 'ORG_HAS_APP relationship not found for org % and app %. App may not be installed or was already uninstalled.',
      p_organization_id, v_app_code;
  END IF;

  -- ============================================================
  -- 7) UNINSTALL: SOFT (DEFAULT) OR HARD DELETE
  -- ============================================================
  IF COALESCE(p_hard_delete, false) IS TRUE THEN
    -- HARD DELETE: Irreversible, breaks audit trail (use sparingly)
    DELETE FROM public.core_relationships
    WHERE id = v_rel_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;

    RETURN jsonb_build_object(
      'action','UNLINK',
      'mode','hard',
      'affected', v_affected,
      'relationship_id', v_rel_id,
      'organization_id', p_organization_id,
      'uninstalled_at', p_uninstalled_at,
      'app', jsonb_build_object(
        'id', v_app_entity_id,
        'code', v_app_code_db,
        'name', v_app_name,
        'smart_code', v_app_sc
      )
    );
  ELSE
    -- SOFT UNINSTALL: is_active=false + stamp uninstalled_at (RECOMMENDED)
    UPDATE public.core_relationships r
       SET is_active = false,
           relationship_data =
             COALESCE(r.relationship_data, '{}'::jsonb)
             || jsonb_build_object('uninstalled_at', p_uninstalled_at),
           updated_at = now(),
           updated_by = p_actor_user_id
     WHERE r.id = v_rel_id;

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    RETURN jsonb_build_object(
      'action','UNLINK',
      'mode','soft',
      'affected', v_affected,
      'relationship_id', v_rel_id,
      'organization_id', p_organization_id,
      'uninstalled_at', p_uninstalled_at,
      'app', jsonb_build_object(
        'id', v_app_entity_id,
        'code', v_app_code_db,
        'name', v_app_name,
        'smart_code', v_app_sc
      )
    );
  END IF;
END;
$fn$;

-- ============================================================
-- SECURITY: Restrict to authenticated users only
-- ============================================================
REVOKE ALL ON FUNCTION public.hera_org_unlink_app_v1(
  uuid, uuid, text, timestamptz, boolean
) FROM public;

GRANT EXECUTE ON FUNCTION public.hera_org_unlink_app_v1(
  uuid, uuid, text, timestamptz, boolean
) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_org_unlink_app_v1(uuid, uuid, text, timestamptz, boolean) IS
  'Uninstall (deactivate) a PLATFORM APP from a tenant org via ORG_HAS_APP relationship.
   Validates actor membership using MEMBER_OF pattern and APP smart code compliance.
   Default behavior is soft delete (preserves audit trail). v1.0 - Production Ready';

-- ============================================================
-- DEPLOYMENT VERIFICATION SCRIPT
-- ============================================================
-- Run this after deploying the function to verify it works correctly:
--
-- 1. Test parameter validation:
/*
SELECT hera_org_unlink_app_v1(
  NULL::uuid,                                       -- Should fail: actor required
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON',
  now(),
  false
);
*/

-- 2. Test app code format validation:
/*
SELECT hera_org_unlink_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'salon',                                           -- Should fail: must be UPPERCASE
  now(),
  false
);
*/

-- 3. Test successful soft uninstall:
/*
SELECT hera_org_unlink_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,    -- Valid actor
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,    -- Valid org
  'SALON',                                          -- Valid app code
  now(),
  false                                             -- Soft delete (default)
);
*/

-- 4. Verify soft delete result:
/*
SELECT
  id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  is_active,                                        -- Should be false
  relationship_data->>'uninstalled_at',             -- Should have timestamp
  updated_by,                                       -- Should be actor UUID
  updated_at
FROM core_relationships
WHERE relationship_type = 'ORG_HAS_APP'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND is_active = false;
*/
