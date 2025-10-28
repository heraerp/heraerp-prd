-- =====================================================
-- FIX: hera_auth_introspect_v1 - Explicit Type Casting
-- =====================================================
-- Issue: PostgREST "could not determine polymorphic type" error
-- Solution: Explicit to_jsonb() casting for all fields
-- Version: 1.1 (Fixed Type Inference)
-- Date: 2025-10-27
-- =====================================================

DROP FUNCTION IF EXISTS public.hera_auth_introspect_v1(uuid);

CREATE OR REPLACE FUNCTION public.hera_auth_introspect_v1(
  p_actor_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $func$
DECLARE
  v_result jsonb;
  v_now timestamptz := now();
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_auth_introspect_v1: p_actor_user_id is required';
  END IF;

  /*
    Memberships (which orgs the user can see) come from MEMBER_OF edges.
    We keep user-centric timestamps (joined_at, last_updated) from that edge.
  */
  WITH memberships AS (
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
    SELECT
      o.id                AS organization_id,
      o.organization_name AS organization_name,
      o.organization_code AS organization_code,
      o.status            AS organization_status,
      m.joined_at,
      m.last_updated
    FROM memberships m
    JOIN public.core_organizations o
      ON o.id = m.organization_id
  ),
  -- All role edges for this user across all orgs (authoritative RBAC edges)
  roles_per_org AS (
    SELECT
      cr.organization_id,
      COALESCE((cr.relationship_data->>'role_code')::text, er.entity_code) AS role_code,
      COALESCE((cr.relationship_data->>'is_primary')::boolean, false)      AS is_primary
    FROM public.core_relationships cr
    LEFT JOIN public.core_entities er
           ON er.id = cr.to_entity_id AND er.entity_type = 'ROLE'
    WHERE cr.relationship_type = 'HAS_ROLE'
      AND COALESCE(cr.is_active, true)
      AND cr.from_entity_id = p_actor_user_id
  ),
  -- Compute the effective primary role per org without calling a function per row
  primary_roles AS (
    SELECT DISTINCT ON (r.organization_id)
      r.organization_id,
      r.role_code AS primary_role
    FROM roles_per_org r
    ORDER BY
      r.organization_id,
      r.is_primary DESC,                                  -- explicit primary wins
      public._hera_role_rank(r.role_code) ASC,            -- precedence (OWNER < ADMIN < ...)
      r.role_code ASC                                     -- deterministic tiebreak
  ),
  -- Full, deduped roles[] per org (ordered by precedence then alpha)
  roles_agg AS (
    SELECT
      r.organization_id,
      jsonb_agg(r.role_code ORDER BY public._hera_role_rank(r.role_code), r.role_code) AS roles_json
    FROM (
      SELECT DISTINCT organization_id, role_code
      FROM roles_per_org
    ) r
    GROUP BY r.organization_id
  ),
  -- Final rowset per org with flags derived from rank, plus membership timestamps
  rolled AS (
    SELECT
      o.organization_id                         AS id,
      o.organization_code                       AS code,
      o.organization_name                       AS name,
      o.organization_status                     AS status,
      o.joined_at,
      o.last_updated,
      COALESCE(pr.primary_role, 'MEMBER')       AS primary_role,
      COALESCE(ra.roles_json, '[]'::jsonb)      AS roles,
      -- Rank-based flags (robust to case/custom roles)
      (public._hera_role_rank(COALESCE(pr.primary_role, 'MEMBER')) = 1)  AS is_owner,
      (public._hera_role_rank(COALESCE(pr.primary_role, 'MEMBER')) <= 2) AS is_admin
    FROM orgs o
    LEFT JOIN primary_roles pr ON pr.organization_id = o.organization_id
    LEFT JOIN roles_agg     ra ON ra.organization_id = o.organization_id
  ),
  -- Preferred sort: most recently joined (user-centric)
  ordered AS (
    SELECT * FROM rolled
    ORDER BY joined_at DESC NULLS LAST, name
  ),
  -- Precompute ids array to extract default_organization_id cheaply
  idlist AS (
    SELECT array_agg(id ORDER BY joined_at DESC NULLS LAST, name) AS ids
    FROM ordered
  ),
  counts AS (
    SELECT COUNT(*)::int AS organization_count FROM ordered
  ),
  platform_admin_flag AS (
    /*
      "Platform admin" if the user has a MEMBER_OF to a platform-scope org entity.
      We detect this by looking for a MEMBER_OF whose target org entity lives in
      the global org (organization_id = '00000000-0000-0000-0000-000000000000').
    */
    SELECT EXISTS (
      SELECT 1
      FROM public.core_relationships r
      JOIN public.core_entities e
        ON e.id = r.to_entity_id
       AND e.entity_type = 'ORGANIZATION'
       AND e.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      WHERE r.from_entity_id = p_actor_user_id
        AND r.relationship_type = 'MEMBER_OF'
        AND COALESCE(r.is_active, true)
    ) AS is_platform_admin
  )
  SELECT
    jsonb_build_object(
      'user_id',                to_jsonb(p_actor_user_id),
      'introspected_at',        to_jsonb(v_now),
      'is_platform_admin',      to_jsonb((SELECT is_platform_admin FROM platform_admin_flag)),
      'organization_count',     to_jsonb((SELECT organization_count FROM counts)),
      'default_organization_id',
        to_jsonb(COALESCE((SELECT ids[1] FROM idlist), NULL::uuid)),
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
                       'roles',        roles,                  -- already jsonb
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

  -- Final safety: return a well-typed empty payload if no orgs at all
  v_result := COALESCE(
    v_result,
    jsonb_build_object(
      'user_id',                to_jsonb(p_actor_user_id),
      'introspected_at',        to_jsonb(v_now),
      'is_platform_admin',      to_jsonb(false),
      'organization_count',     to_jsonb(0),
      'default_organization_id',to_jsonb(NULL::uuid),
      'organizations',          '[]'::jsonb
    )
  );

  RETURN v_result;
END;
$func$;

COMMENT ON FUNCTION public.hera_auth_introspect_v1(uuid)
  IS 'Login snapshot: org list (sorted by joined_at), primary_role (rank-based), roles[], membership timestamps, flags, counts, default org, and introspected_at. v1.1 - Fixed PostgREST type inference with explicit to_jsonb() casting.';

GRANT EXECUTE ON FUNCTION public.hera_auth_introspect_v1(uuid) TO authenticated, service_role;

-- =====================================================
-- VERIFICATION QUERY (Run after deployment)
-- =====================================================
-- Test with a known user ID
-- SELECT hera_auth_introspect_v1('your-user-uuid-here');

-- Expected output: JSON object with all fields properly typed
-- No "polymorphic type" errors should occur
