-- ===================================================================
-- RPC: hera_org_unlink_app_v1 (REVIEWED & CORRECTED)
-- Purpose: Uninstall (deactivate) a PLATFORM APP from a tenant org
-- Input:
--   p_actor_user_id    uuid
--   p_organization_id  uuid
--   p_app_code         text          -- UPPERCASE alnum, e.g. 'SALON'
--   p_uninstalled_at   timestamptz   DEFAULT now()
--   p_hard_delete      boolean       DEFAULT false  -- if true, DELETE row (not recommended)
-- Returns:
--   { action:'UNLINK', mode:'soft'|'hard', affected:int, relationship_id, organization_id, app:{...}, uninstalled_at }
-- ===================================================================

CREATE OR REPLACE FUNCTION public.hera_org_unlink_app_v1(
  p_actor_user_id    uuid,
  p_organization_id  uuid,
  p_app_code         text,
  p_uninstalled_at   timestamptz DEFAULT now(),
  p_hard_delete      boolean     DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- Platform org UUID (where all APPs live as entities)
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_code text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id uuid;
  v_app_entity_id uuid;
  v_rel_id uuid;
  v_affected int := 0;

  v_app_name text;
  v_app_code_db text;
  v_app_sc text;
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

  -- Validate code format: UPPERCASE alphanumeric only
  -- FIXED: Added missing closing quote and $ anchor
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code;
  END IF;

  -- ============================================================
  -- 2) RESOLVE TENANT ORG ENTITY (SHADOW ENTITY)
  -- ============================================================
  SELECT id INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'No ORGANIZATION entity found for tenant %', p_organization_id;
  END IF;

  -- ============================================================
  -- 3) VALIDATE ACTOR MEMBERSHIP (RECOMMENDED SECURITY CHECK)
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM public.core_relationships r
    WHERE r.organization_id = p_organization_id
      AND r.to_entity_id = v_org_entity_id
      AND r.from_entity_id IN (
        SELECT id FROM public.core_entities
        WHERE entity_type = 'USER'
          AND id = p_actor_user_id
      )
      AND r.relationship_type = 'USER_MEMBER_OF_ORG'
      AND r.is_active = true
  ) THEN
    RAISE EXCEPTION 'Actor % is not an active member of organization %',
      p_actor_user_id, p_organization_id;
  END IF;

  -- ============================================================
  -- 4) RESOLVE PLATFORM APP ENTITY
  -- ============================================================
  SELECT e.id, e.entity_name, e.entity_code, e.smart_code
    INTO v_app_entity_id, v_app_name, v_app_code_db, v_app_sc
  FROM public.core_entities e
  WHERE e.organization_id = c_platform_org
    AND e.entity_type = 'APP'
    AND e.entity_code = v_app_code
  LIMIT 1;

  IF v_app_entity_id IS NULL THEN
    RAISE EXCEPTION 'APP with code "%" not found in PLATFORM org', v_app_code;
  END IF;

  -- ============================================================
  -- 5) VALIDATE APP SMART CODE FORMAT (DEFENSIVE)
  -- ============================================================
  -- Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.v1
  -- FIXED: Added missing closing quote and $ anchor
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" is invalid. Expected HERA.PLATFORM.APP.ENTITY.<CODE>.vN', v_app_sc;
  END IF;

  -- Underscores not allowed in smart codes (HERA DNA rule)
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed', v_app_sc;
  END IF;

  -- ============================================================
  -- 6) LOCATE EXISTING ORG_HAS_APP RELATIONSHIP
  -- ============================================================
  SELECT id INTO v_rel_id
  FROM public.core_relationships r
  WHERE r.organization_id = p_organization_id
    AND r.from_entity_id  = v_org_entity_id
    AND r.to_entity_id    = v_app_entity_id
    AND r.relationship_type = 'ORG_HAS_APP'
  LIMIT 1;

  IF v_rel_id IS NULL THEN
    RAISE EXCEPTION 'ORG_HAS_APP relationship not found for org % and app %',
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
-- SECURITY: Restrict access to authenticated users only
-- ============================================================
REVOKE ALL ON FUNCTION public.hera_org_unlink_app_v1(
  uuid, uuid, text, timestamptz, boolean
) FROM public;

GRANT EXECUTE ON FUNCTION public.hera_org_unlink_app_v1(
  uuid, uuid, text, timestamptz, boolean
) TO authenticated, service_role;

-- ============================================================
-- DEPLOYMENT NOTES
-- ============================================================
-- 1. Verify c_platform_org UUID matches your actual platform org
-- 2. Test with both soft and hard delete modes
-- 3. Verify audit trail preservation in soft mode
-- 4. Confirm actor membership validation is working
-- 5. Test error cases (invalid app code, missing relationship, etc.)
