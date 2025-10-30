-- ===================================================================
-- RPC: hera_auth_introspect_v1 (PRODUCTION READY - FINAL)
-- Purpose: Login snapshot (orgs, roles, flags) + apps + default_app
-- Status: ✅ READY FOR DEPLOYMENT
-- Version: 2.0 (adds apps[], default_app with org.settings override)
--
-- New Features (v2.0):
-- - organizations[].apps: array of installed apps (active ORG_HAS_APP)
--   with { code, name, installed_at, subscription, config }
-- - default_app: chosen per the selected default org
--   • Prefers core_organizations.settings.default_app_code if installed
--   • Falls back to first installed app (sorted by name/code)
--   • Returns null if no apps installed
--
-- Dependencies:
-- - public._hera_role_rank(text) - helper function for role precedence
-- - core_entities with entity_type='APP' in PLATFORM org
-- - core_relationships with ORG_HAS_APP relationship type
--
-- Notes:
-- - No regex patterns = no syntax footguns
-- - Pure read operation (STABLE function)
-- - Backward compatible (additive changes only)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.hera_auth_introspect_v1(
  p_actor_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_result jsonb;
  v_now timestamptz := now();
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  -- ============================================================
  -- INPUT VALIDATION
  -- ============================================================
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_auth_introspect_v1: p_actor_user_id is required';
  END IF;

  -- ============================================================
  -- MAIN QUERY: Build Complete User Context
  -- ============================================================
  WITH memberships AS (
    -- Get all active organization memberships via MEMBER_OF
    SELECT
      cr.organization_id,
      cr.created_at AS joined_at,
      cr.updated_at AS last_updated
    FROM public.core_relationships cr
    WHERE cr.relationship_type = 'MEMBER_OF'
      AND COALESCE(cr.is_active, true)
      AND cr.from_entity_id = p_actor_user_id
  ),
  orgs AS (
    -- Join memberships with organization details
    SELECT
      o.id                AS organization_id,
      o.organization_name AS organization_name,
      o.organization_code AS organization_code,
      o.status            AS organization_status,
      o.settings          AS org_settings,
      m.joined_at,
      m.last_updated
    FROM memberships m
    JOIN public.core_organizations o
      ON o.id = m.organization_id
  ),
  roles_per_org AS (
    -- Get all active roles via HAS_ROLE relationships
    SELECT
      cr.organization_id,
      COALESCE((cr.relationship_data->>'role_code')::text, er.entity_code) AS role_code,
      COALESCE((cr.relationship_data->>'is_primary')::boolean, false)      AS is_primary
    FROM public.core_relationships cr
    LEFT JOIN public.core_entities er
      ON er.id = cr.to_entity_id
     AND er.entity_type = 'ROLE'
    WHERE cr.relationship_type = 'HAS_ROLE'
      AND COALESCE(cr.is_active, true)
      AND cr.from_entity_id = p_actor_user_id
  ),
  primary_roles AS (
    -- Determine primary role per organization using smart ranking
    SELECT DISTINCT ON (r.organization_id)
      r.organization_id,
      r.role_code AS primary_role
    FROM roles_per_org r
    ORDER BY
      r.organization_id,
      r.is_primary DESC,                                -- 1) Explicit primary flag
      public._hera_role_rank(r.role_code) ASC,          -- 2) Precedence (OWNER < ADMIN < ...)
      r.role_code ASC                                   -- 3) Tie-breaker
  ),
  roles_agg AS (
    -- Aggregate all roles into JSON array per organization
    SELECT
      r.organization_id,
      jsonb_agg(r.role_code ORDER BY public._hera_role_rank(r.role_code), r.role_code) AS roles_json
    FROM (SELECT DISTINCT organization_id, role_code FROM roles_per_org) r
    GROUP BY r.organization_id
  ),
  apps_per_org AS (
    -- Get active installed apps per org from ORG_HAS_APP relationships
    -- Join with PLATFORM org APP catalog for canonical code/name
    SELECT
      r.organization_id,
      jsonb_agg(
        jsonb_build_object(
          'code',        e.entity_code,
          'name',        e.entity_name,
          'installed_at', (r.relationship_data->>'installed_at')::timestamptz,
          'subscription', COALESCE(r.relationship_data->'subscription','{}'::jsonb),
          'config',       COALESCE(r.relationship_data->'config','{}'::jsonb)
        )
        ORDER BY e.entity_name, e.entity_code
      ) AS apps_json
    FROM public.core_relationships r
    JOIN public.core_entities e
      ON e.id = r.to_entity_id
     AND e.entity_type = 'APP'
     AND e.organization_id = c_platform_org
    WHERE r.relationship_type = 'ORG_HAS_APP'
      AND COALESCE(r.is_active, true)
    GROUP BY r.organization_id
  ),
  rolled AS (
    -- Combine all organization data including apps
    SELECT
      o.organization_id                         AS id,
      o.organization_code                       AS code,
      o.organization_name                       AS name,
      o.organization_status                     AS status,
      o.org_settings                             AS settings,
      o.joined_at,
      o.last_updated,
      COALESCE(pr.primary_role, 'MEMBER')       AS primary_role,
      COALESCE(ra.roles_json, '[]'::jsonb)      AS roles,
      COALESCE(ap.apps_json, '[]'::jsonb)       AS apps,
      (public._hera_role_rank(COALESCE(pr.primary_role, 'MEMBER')) = 1)  AS is_owner,
      (public._hera_role_rank(COALESCE(pr.primary_role, 'MEMBER')) <= 2) AS is_admin
    FROM orgs o
    LEFT JOIN primary_roles pr ON pr.organization_id = o.organization_id
    LEFT JOIN roles_agg     ra ON ra.organization_id = o.organization_id
    LEFT JOIN apps_per_org  ap ON ap.organization_id = o.organization_id
  ),
  ordered AS (
    -- Sort organizations by join date (most recent first)
    SELECT * FROM rolled
    ORDER BY joined_at DESC NULLS LAST, name
  ),
  idlist AS (
    -- Extract organization IDs in order for default selection
    SELECT array_agg(id::uuid ORDER BY joined_at DESC NULLS LAST, name) AS ids
    FROM ordered
  ),
  counts AS (
    -- Count total organizations
    SELECT COUNT(*)::int AS organization_count FROM ordered
  ),
  platform_admin_flag AS (
    -- Check if user is platform admin (member of PLATFORM org)
    SELECT EXISTS (
      SELECT 1
      FROM public.core_relationships r
      JOIN public.core_entities e
        ON e.id = r.to_entity_id
       AND e.entity_type = 'ORGANIZATION'
       AND e.organization_id = c_platform_org
      WHERE r.from_entity_id = p_actor_user_id
        AND r.relationship_type = 'MEMBER_OF'
        AND COALESCE(r.is_active, true)
    ) AS is_platform_admin
  ),
  default_org AS (
    -- Select first organization as default
    SELECT ids[1] AS id FROM idlist
  ),
  default_app_calc AS (
    -- Smart default app selection for the default organization:
    -- 1. Prefer org.settings.default_app_code if present and installed
    -- 2. Fallback to first installed app (alphabetically)
    -- 3. Return null if no apps installed
    SELECT
      do.id AS org_id,
      CASE
        WHEN do.id IS NULL THEN NULL
        ELSE (
          WITH orgrow AS (
            SELECT * FROM ordered WHERE id = do.id
          ),
          setting_code AS (
            SELECT NULLIF(TRIM((SELECT settings->>'default_app_code' FROM orgrow)), '') AS code
          ),
          installed AS (
            SELECT jsonb_array_elements((SELECT apps FROM orgrow)) AS app
          )
          SELECT
            COALESCE(
              -- Strategy 1: Use org.settings.default_app_code if installed
              (SELECT (app->>'code')::text FROM installed, setting_code sc
               WHERE sc.code IS NOT NULL AND (app->>'code') = sc.code
               LIMIT 1),
              -- Strategy 2: Use first installed app
              (SELECT (app->>'code')::text FROM installed LIMIT 1)
            )
        )
      END AS default_app
    FROM default_org do
  )
  -- ============================================================
  -- BUILD FINAL RESPONSE
  -- ============================================================
  SELECT jsonb_build_object(
      'user_id',           to_jsonb(p_actor_user_id),
      'introspected_at',   to_jsonb(v_now),
      'is_platform_admin', to_jsonb((SELECT is_platform_admin FROM platform_admin_flag)),
      'organization_count',to_jsonb((SELECT organization_count FROM counts)),
      'default_organization_id', to_jsonb((SELECT id FROM default_org)),
      'default_app', to_jsonb((SELECT default_app FROM default_app_calc)),
      'organizations',
      COALESCE(
        (
          SELECT jsonb_agg(
                   jsonb_build_object(
                     'id',           to_jsonb(id::uuid),
                     'code',         to_jsonb(code::text),
                     'name',         to_jsonb(name::text),
                     'status',       to_jsonb(status::text),
                     'joined_at',    to_jsonb(joined_at::timestamptz),
                     'last_updated', to_jsonb(last_updated::timestamptz),
                     'primary_role', to_jsonb(primary_role::text),
                     'roles',        roles,
                     'apps',         apps,
                     'is_owner',     to_jsonb(is_owner),
                     'is_admin',     to_jsonb(is_admin)
                   )
                   ORDER BY joined_at DESC NULLS LAST, name
                 )
          FROM ordered
        ),
        '[]'::jsonb
      )
    )
    INTO v_result;

  -- ============================================================
  -- SAFETY FALLBACK (if query returns NULL)
  -- ============================================================
  v_result := COALESCE(
    v_result,
    jsonb_build_object(
      'user_id',                 to_jsonb(p_actor_user_id),
      'introspected_at',         to_jsonb(v_now),
      'is_platform_admin',       to_jsonb(false),
      'organization_count',      to_jsonb(0),
      'default_organization_id', to_jsonb(NULL::uuid),
      'default_app',             to_jsonb(NULL::text),
      'organizations',           '[]'::jsonb
    )
  );

  RETURN v_result;
END;
$fn$;

-- ============================================================
-- SECURITY: Restrict to authenticated users only
-- ============================================================
REVOKE ALL ON FUNCTION public.hera_auth_introspect_v1(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.hera_auth_introspect_v1(uuid)
TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_auth_introspect_v1(uuid) IS
  'Login snapshot with orgs/roles plus apps[] (active ORG_HAS_APP) and default_app derived from org.settings.default_app_code or first installed app.
   v2.0 - Additive changes only, backward compatible with v1.x.
   Dependencies: _hera_role_rank(text)';

-- ============================================================
-- DEPLOYMENT VERIFICATION SCRIPT
-- ============================================================

-- Pre-Deployment Checks:
-- 1. Verify helper function exists:
/*
SELECT proname, proargtypes::regtype[]
FROM pg_proc
WHERE proname = '_hera_role_rank'
  AND pronamespace = 'public'::regnamespace;
-- Expected: 1 row with text argument
*/

-- 2. Verify APP entities exist in PLATFORM org:
/*
SELECT COUNT(*) AS app_count
FROM core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'APP';
-- Expected: > 0 apps (SALON, CRM, etc.)
*/

-- 3. Verify ORG_HAS_APP relationships exist:
/*
SELECT COUNT(*) AS installations
FROM core_relationships
WHERE relationship_type = 'ORG_HAS_APP'
  AND COALESCE(is_active, true);
-- Expected: >= 0 (organizations may or may not have apps)
*/

-- Post-Deployment Tests:

-- Test 1: Basic introspection (user with no orgs):
/*
SELECT hera_auth_introspect_v1('00000000-0000-0000-0000-000000000001'::uuid);
-- Expected: empty organizations array, null default_app
*/

-- Test 2: Introspection with organization membership:
/*
SELECT hera_auth_introspect_v1('3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid);
-- Expected: organizations array with apps field per org
*/

-- Test 3: Verify response structure:
/*
SELECT
  jsonb_typeof(result->'organizations') AS orgs_type,
  jsonb_typeof(result->'organizations'->0->'apps') AS apps_type,
  result->>'default_app' AS default_app_value
FROM (
  SELECT hera_auth_introspect_v1('3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid) AS result
) t;
-- Expected: orgs_type='array', apps_type='array', default_app_value=text or null
*/

-- Test 4: Verify default_app logic with org settings:
/*
-- First, set default_app_code in org settings
UPDATE core_organizations
SET settings = settings || '{"default_app_code":"SALON"}'::jsonb
WHERE id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid;

-- Then introspect
SELECT result->>'default_app' AS default_app
FROM (
  SELECT hera_auth_introspect_v1('3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid) AS result
) t;
-- Expected: 'SALON' if SALON is installed, else first installed app
*/

-- Test 5: Backward compatibility check (v1.x fields still present):
/*
SELECT
  result ? 'user_id' AS has_user_id,
  result ? 'organizations' AS has_organizations,
  result ? 'default_organization_id' AS has_default_org,
  result ? 'is_platform_admin' AS has_platform_admin,
  result ? 'organization_count' AS has_org_count,
  result->'organizations'->0 ? 'primary_role' AS has_primary_role,
  result->'organizations'->0 ? 'roles' AS has_roles,
  result->'organizations'->0 ? 'is_owner' AS has_is_owner,
  result->'organizations'->0 ? 'is_admin' AS has_is_admin,
  -- New v2.0 fields:
  result ? 'default_app' AS has_default_app,
  result->'organizations'->0 ? 'apps' AS has_apps
FROM (
  SELECT hera_auth_introspect_v1('3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid) AS result
) t;
-- Expected: All true (all fields present)
*/

-- ============================================================
-- EXAMPLE RESPONSE FORMAT
-- ============================================================
/*
{
  "user_id": "3ced4979-4c09-4e1e-8667-6707cfe6ec77",
  "introspected_at": "2025-10-28T12:00:00Z",
  "is_platform_admin": false,
  "organization_count": 1,
  "default_organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
  "default_app": "SALON",
  "organizations": [
    {
      "id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
      "code": "HAIRTALKZ",
      "name": "Michele's Salon",
      "status": "active",
      "joined_at": "2025-01-01T00:00:00Z",
      "last_updated": "2025-01-15T10:30:00Z",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER", "ORG_ADMIN"],
      "apps": [
        {
          "code": "SALON",
          "name": "HERA Salon Management",
          "installed_at": "2025-01-01T00:00:00Z",
          "subscription": {
            "plan": "premium",
            "expires_at": "2026-01-01T00:00:00Z"
          },
          "config": {
            "enable_appointments": true,
            "enable_pos": true
          }
        }
      ],
      "is_owner": true,
      "is_admin": true
    }
  ]
}
*/
