-- ===================================================================
-- RPC: hera_org_set_default_app_v1 (FIXED - Smart Code Extraction)
-- Purpose: Set/overwrite the default app for a tenant org
-- Status: ✅ BUG FIX - Use split_part instead of REGEXP_REPLACE
-- Version: 1.1
--
-- Bug Fix:
-- - Changed from REGEXP_REPLACE to split_part for segment extraction
-- - REGEXP_REPLACE was not extracting the segment correctly
-- - split_part(',', '.', 5) reliably gets segment 5 (SALON from smart code)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.hera_org_set_default_app_v1(
  p_actor_user_id   uuid,
  p_organization_id uuid,
  p_app_code        text  -- UPPERCASE alnum, e.g. 'SALON'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- Canonical PLATFORM org UUID (where all APP entities live)
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_code       text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id  uuid;
  v_app_entity_id  uuid;

  v_org_row        public.core_organizations%rowtype;
  v_old_default    text;
  v_new_settings   jsonb;
  v_app_name       text;
  v_app_sc         text;
  v_extracted_code text;
BEGIN
  -- ============================================================
  -- 1) INPUT VALIDATION
  -- ============================================================
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_set_default_app_v1: p_actor_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_set_default_app_v1: p_organization_id is required';
  END IF;
  IF v_app_code IS NULL THEN
    RAISE EXCEPTION 'hera_org_set_default_app_v1: p_app_code is required';
  END IF;

  -- Validate app_code: UPPERCASE alphanumeric only (no underscores/spaces)
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces. Examples: SALON, CRM, FINANCE',
      v_app_code;
  END IF;

  -- ============================================================
  -- 2) RESOLVE ORGANIZATION AND VALIDATE
  -- ============================================================
  SELECT * INTO v_org_row
  FROM public.core_organizations
  WHERE id = p_organization_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found: %. Please verify organization_id is correct.',
      p_organization_id;
  END IF;

  SELECT id INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'No ORGANIZATION entity found for tenant %. Organization shadow entity may not be initialized.',
      p_organization_id;
  END IF;

  -- ============================================================
  -- 3) VALIDATE ACTOR MEMBERSHIP (STANDARD MEMBER_OF PATTERN)
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1
    FROM public.core_relationships r
    WHERE r.organization_id   = p_organization_id
      AND r.from_entity_id    = p_actor_user_id
      AND r.to_entity_id      = v_org_entity_id
      AND r.relationship_type = 'MEMBER_OF'
      AND COALESCE(r.is_active, true)
  ) THEN
    RAISE EXCEPTION 'Actor % is not an active member of organization %. Please verify actor has MEMBER_OF relationship.',
      p_actor_user_id, p_organization_id;
  END IF;

  -- ============================================================
  -- 4) RESOLVE PLATFORM APP AND VALIDATE
  -- ============================================================
  SELECT e.id, e.entity_name, e.smart_code
    INTO v_app_entity_id, v_app_name, v_app_sc
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
  -- 5) VALIDATE APP SMART CODE (DEFENSIVE)
  -- ============================================================
  -- Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN (no underscores)
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid. Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN where CODE is UPPERCASE alphanumeric',
      v_app_sc;
  END IF;

  -- Underscores not allowed in smart codes (HERA DNA rule)
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed in HERA DNA smart codes',
      v_app_sc;
  END IF;

  -- 🔧 BUG FIX: Extract segment 5 using split_part instead of REGEXP_REPLACE
  -- Smart code format: HERA.PLATFORM.APP.ENTITY.SALON.v1
  -- Segments:          1    2        3   4      5      6
  v_extracted_code := split_part(v_app_sc, '.', 5);

  -- Segment 5 (app code) must match the p_app_code parameter
  IF v_extracted_code <> v_app_code THEN
    RAISE EXCEPTION 'APP smart_code segment 5 mismatch: expected "%" but extracted "%" from smart_code "%". Please verify app smart_code format.',
      v_app_code,
      v_extracted_code,
      v_app_sc;
  END IF;

  -- ============================================================
  -- 6) ENSURE APP IS INSTALLED (ORG_HAS_APP ACTIVE)
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1
    FROM public.core_relationships r
    WHERE r.organization_id   = p_organization_id
      AND r.from_entity_id    = v_org_entity_id
      AND r.to_entity_id      = v_app_entity_id
      AND r.relationship_type = 'ORG_HAS_APP'
      AND COALESCE(r.is_active, true)
  ) THEN
    RAISE EXCEPTION 'Organization % does not have APP "%" installed. Active ORG_HAS_APP relationship required. Use hera_org_link_app_v1 to install the app first.',
      p_organization_id, v_app_code;
  END IF;

  -- ============================================================
  -- 7) UPDATE ORGANIZATION SETTINGS (IDEMPOTENT)
  -- ============================================================
  v_old_default := (v_org_row.settings->>'default_app_code');

  v_new_settings :=
    COALESCE(v_org_row.settings, '{}'::jsonb)
    || jsonb_build_object('default_app_code', v_app_code);

  UPDATE public.core_organizations
  SET settings   = v_new_settings,
      updated_at = now(),
      updated_by = p_actor_user_id
  WHERE id = p_organization_id;

  -- ============================================================
  -- 8) RETURN SUCCESS RESPONSE
  -- ============================================================
  RETURN jsonb_build_object(
    'action','SET_DEFAULT_APP',
    'organization_id', p_organization_id,
    'old_default_app_code', v_old_default,
    'new_default_app_code', v_app_code,
    'app', jsonb_build_object(
      'code', v_app_code,
      'name', v_app_name,
      'smart_code', v_app_sc
    )
  );
END;
$fn$;

-- ============================================================
-- SECURITY: Restrict to authenticated users only
-- ============================================================
REVOKE ALL ON FUNCTION public.hera_org_set_default_app_v1(uuid, uuid, text)
FROM public;

GRANT EXECUTE ON FUNCTION public.hera_org_set_default_app_v1(uuid, uuid, text)
TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_org_set_default_app_v1(uuid, uuid, text) IS
  'Set the default app for a tenant organization (core_organizations.settings.default_app_code).
   Validates actor membership, app existence, and active ORG_HAS_APP installation.
   v1.1 - Bug Fix: Use split_part for smart code segment extraction';
