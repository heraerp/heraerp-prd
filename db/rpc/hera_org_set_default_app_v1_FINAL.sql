-- ===================================================================
-- RPC: hera_org_set_default_app_v1 (PRODUCTION READY - FINAL)
-- Purpose: Set/overwrite the default app for a tenant org
-- Status: ✅ READY FOR DEPLOYMENT
-- Version: 1.0
--
-- Changes from Review:
-- - Fixed 3 regex syntax errors (missing $ anchors and wrong quote)
-- - Enhanced error messages with specific guidance
-- - Added deployment verification script
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
  -- FIXED: Added missing $ anchor for end-of-string match
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
  -- FIXED: Added missing $ anchor for end-of-string match
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid. Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN where CODE is UPPERCASE alphanumeric',
      v_app_sc;
  END IF;

  -- Underscores not allowed in smart codes (HERA DNA rule)
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed in HERA DNA smart codes',
      v_app_sc;
  END IF;

  -- Segment 5 (app code) must match the p_app_code parameter
  -- FIXED: Changed closing quote from ' to $ for proper regex grouping
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_app_code THEN
    RAISE EXCEPTION 'APP smart_code segment mismatch: expected "%" but smart_code contains "%". Smart code: %',
      v_app_code,
      REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1'),
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
   v1.0 - Production Ready';

-- ============================================================
-- DEPLOYMENT VERIFICATION SCRIPT
-- ============================================================

-- Pre-Deployment Checks:

-- 1. Verify organization exists:
/*
SELECT id, organization_name, settings->>'default_app_code' AS current_default
FROM core_organizations
WHERE id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid;
*/

-- 2. Verify actor membership:
/*
SELECT
  r.from_entity_id AS actor_id,
  r.to_entity_id AS org_entity_id,
  r.relationship_type,
  r.is_active
FROM core_relationships r
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND r.from_entity_id = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid
  AND r.relationship_type = 'MEMBER_OF';
-- Expected: 1 row with is_active = true
*/

-- 3. Verify app exists in PLATFORM org:
/*
SELECT id, entity_code, entity_name, smart_code
FROM core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'APP'
  AND entity_code = 'SALON';
-- Expected: 1 row with valid smart_code
*/

-- 4. Verify app is installed (ORG_HAS_APP):
/*
SELECT
  r.id,
  r.from_entity_id AS org_entity_id,
  r.to_entity_id AS app_entity_id,
  r.relationship_type,
  r.is_active,
  r.relationship_data->>'installed_at' AS installed_at
FROM core_relationships r
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND r.relationship_type = 'ORG_HAS_APP'
  AND r.to_entity_id IN (
    SELECT id FROM core_entities
    WHERE entity_type = 'APP' AND entity_code = 'SALON'
  );
-- Expected: 1 row with is_active = true
*/

-- Post-Deployment Tests:

-- Test 1: Set default app successfully:
/*
SELECT hera_org_set_default_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,  -- Valid actor
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,  -- Valid org
  'SALON'                                         -- Valid app code
);

-- Expected response:
{
  "action": "SET_DEFAULT_APP",
  "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
  "old_default_app_code": null,  -- or previous value
  "new_default_app_code": "SALON",
  "app": {
    "code": "SALON",
    "name": "HERA Salon Management",
    "smart_code": "HERA.PLATFORM.APP.ENTITY.SALON.v1"
  }
}
*/

-- Test 2: Verify settings updated:
/*
SELECT
  id,
  organization_name,
  settings->>'default_app_code' AS default_app,
  updated_by,
  updated_at
FROM core_organizations
WHERE id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid;
-- Expected: default_app = 'SALON', updated_by = actor UUID
*/

-- Test 3: Test invalid app code (should fail):
/*
SELECT hera_org_set_default_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'salon'  -- lowercase should fail
);
-- Expected: Exception "Invalid p_app_code"
*/

-- Test 4: Test non-existent app (should fail):
/*
SELECT hera_org_set_default_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'NONEXISTENT'
);
-- Expected: Exception "APP with code ... not found"
*/

-- Test 5: Test non-installed app (should fail):
/*
-- Assuming CRM exists but is not installed for this org
SELECT hera_org_set_default_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'CRM'
);
-- Expected: Exception "does not have APP ... installed"
*/

-- Test 6: Test non-member actor (should fail):
/*
SELECT hera_org_set_default_app_v1(
  '00000000-0000-0000-0000-000000000999'::uuid,  -- Non-member UUID
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON'
);
-- Expected: Exception "not an active member"
*/

-- Test 7: Test idempotency (multiple calls should work):
/*
SELECT hera_org_set_default_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON'
);
-- Call again
SELECT hera_org_set_default_app_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON'
);
-- Expected: Both succeed, old_default_app_code shows previous value
*/

-- Test 8: Verify hera_auth_introspect_v1 picks up the default:
/*
SELECT result->>'default_app' AS default_app
FROM (
  SELECT hera_auth_introspect_v1('3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid) AS result
) t;
-- Expected: 'SALON'
*/
