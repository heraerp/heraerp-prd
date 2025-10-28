-- ===================================================================
-- RPC: hera_apps_get_v1 (PRODUCTION READY - FINAL)
-- Purpose: Fetch a single global APP (PLATFORM org) by id or code
-- Status: ✅ READY FOR DEPLOYMENT
-- Version: 1.0
--
-- Changes from Review:
-- - Fixed 3 regex syntax errors (missing $ anchors and wrong quote)
-- - Enhanced error messages with specific guidance
-- - Added deployment verification script
-- ===================================================================

CREATE OR REPLACE FUNCTION public.hera_apps_get_v1(
  p_actor_user_id uuid,
  p_selector      jsonb   -- { "id":"<uuid>" } | { "code":"SALON" }
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- Canonical PLATFORM org UUID (where all APP entities live)
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_id    uuid := NULLIF((p_selector->>'id')::uuid, NULL);
  v_code  text := NULLIF(TRIM(p_selector->>'code'), '');

  v_row   public.core_entities%rowtype;
BEGIN
  -- ============================================================
  -- 1) INPUT VALIDATION
  -- ============================================================
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_apps_get_v1: p_actor_user_id is required';
  END IF;

  IF v_id IS NULL AND v_code IS NULL THEN
    RAISE EXCEPTION 'hera_apps_get_v1: provide "id" or "code" in selector. Example: {"code":"SALON"} or {"id":"uuid"}';
  END IF;

  -- Validate code format if provided (UPPERCASE alphanumeric only; no underscores/spaces)
  -- FIXED: Added missing $ anchor for end-of-string match
  IF v_code IS NOT NULL AND (v_code <> UPPER(v_code) OR v_code !~ '^[A-Z0-9]+$') THEN
    RAISE EXCEPTION 'Invalid code "%": must be UPPERCASE alphanumeric with no underscores/spaces. Examples: SALON, CRM, FINANCE', v_code;
  END IF;

  -- ============================================================
  -- 2) FETCH APP FROM PLATFORM ORG
  -- ============================================================
  SELECT * INTO v_row
  FROM public.core_entities e
  WHERE e.organization_id = c_platform_org
    AND e.entity_type = 'APP'
    AND (
      (v_id IS NOT NULL AND e.id = v_id) OR
      (v_id IS NULL AND v_code IS NOT NULL AND e.entity_code = v_code)
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APP not found in PLATFORM org (by %). Available APPs can be queried from core_entities with entity_type=APP and organization_id=%',
      COALESCE(v_id::text, v_code),
      c_platform_org;
  END IF;

  -- ============================================================
  -- 3) VALIDATE APP SMART CODE (DEFENSIVE)
  -- ============================================================
  -- Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN (no underscores)
  -- FIXED: Added missing $ anchor for end-of-string match
  IF v_row.smart_code !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid. Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN where CODE is UPPERCASE alphanumeric',
      v_row.smart_code;
  END IF;

  -- Underscores not allowed in smart codes (HERA DNA rule)
  IF POSITION('_' IN v_row.smart_code) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed in HERA DNA smart codes', v_row.smart_code;
  END IF;

  -- If selector used code, ensure smart_code segment 5 matches it
  -- FIXED: Changed closing quote from ' to $ for proper regex grouping
  IF v_code IS NOT NULL AND
     REGEXP_REPLACE(v_row.smart_code, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_code THEN
    RAISE EXCEPTION 'APP smart_code segment mismatch: expected "%" but smart_code contains "%". Smart code: %',
      v_code,
      REGEXP_REPLACE(v_row.smart_code, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1'),
      v_row.smart_code;
  END IF;

  -- ============================================================
  -- 4) RETURN APP OBJECT
  -- ============================================================
  RETURN jsonb_build_object(
    'action','GET',
    'app', jsonb_build_object(
      'id',            v_row.id,
      'name',          v_row.entity_name,
      'code',          v_row.entity_code,
      'smart_code',    v_row.smart_code,
      'status',        v_row.status,
      'business_rules',v_row.business_rules,
      'metadata',      v_row.metadata,
      'created_at',    v_row.created_at,
      'updated_at',    v_row.updated_at
    )
  );
END;
$fn$;

-- ============================================================
-- SECURITY: Restrict to authenticated users only
-- ============================================================
REVOKE ALL ON FUNCTION public.hera_apps_get_v1(uuid, jsonb) FROM public;

GRANT EXECUTE ON FUNCTION public.hera_apps_get_v1(uuid, jsonb)
TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_apps_get_v1(uuid, jsonb) IS
  'Fetch a single PLATFORM APP by id or code. Enforces UPPERCASE code and validates smart_code = HERA.PLATFORM.APP.ENTITY.<CODE>.vN.
   Read-only (STABLE) function for querying global APP catalog. v1.0 - Production Ready';

-- ============================================================
-- DEPLOYMENT VERIFICATION SCRIPT
-- ============================================================
-- Run these tests after deploying the function:

-- 1. Test missing selector (should fail):
/*
SELECT hera_apps_get_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '{}'::jsonb  -- Empty selector should fail
);
*/

-- 2. Test lowercase code (should fail):
/*
SELECT hera_apps_get_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '{"code":"salon"}'::jsonb  -- Lowercase should fail
);
*/

-- 3. Test valid code lookup (should succeed):
/*
SELECT hera_apps_get_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '{"code":"SALON"}'::jsonb
);
*/

-- 4. Test valid ID lookup (should succeed):
/*
SELECT hera_apps_get_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '{"id":"<your-app-uuid>"}'::jsonb
);
*/

-- 5. Test non-existent app (should fail with clear message):
/*
SELECT hera_apps_get_v1(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '{"code":"NONEXISTENT"}'::jsonb
);
*/

-- 6. List all available APPs for testing:
/*
SELECT
  id,
  entity_name,
  entity_code,
  smart_code,
  status,
  created_at
FROM core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'APP'
ORDER BY entity_code;
*/

-- 7. Example successful response format:
/*
{
  "action": "GET",
  "app": {
    "id": "uuid",
    "name": "HERA Salon Management",
    "code": "SALON",
    "smart_code": "HERA.PLATFORM.APP.ENTITY.SALON.v1",
    "status": "active",
    "business_rules": {},
    "metadata": {},
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
*/
