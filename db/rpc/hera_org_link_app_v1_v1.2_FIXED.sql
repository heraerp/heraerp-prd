-- ===================================================================
-- HERA • ORG + APP Linking (v1.2) and Listing (v1)
-- Files:    hera_org_link_app_v1.sql, hera_org_apps_list_v1.sql
-- Purpose:  Link/install a PLATFORM APP to a tenant org and list them
-- Notes:
--   - Keeps within sacred six (core_entities / core_relationships)
--   - Concurrency-safe via pg_advisory_xact_lock on (org, app)
--   - Partial unique index prevents duplicate active links
-- ===================================================================

/* ---------------------------------------------------------------
   Helpful indexes (safe to create once; IF NOT EXISTS guarded)
---------------------------------------------------------------- */
-- Fast lookups for the APP catalog in PLATFORM org
CREATE INDEX IF NOT EXISTS idx_core_entities_platform_app
  ON public.core_entities (organization_id, entity_type, entity_code);

-- Prevent duplicate active ORG_HAS_APP links (enforced by index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rel_org_has_app_active
  ON public.core_relationships (organization_id, from_entity_id, to_entity_id)
  WHERE relationship_type = 'ORG_HAS_APP' AND is_active = true;

-- Common filter path for listing links
CREATE INDEX IF NOT EXISTS idx_rel_org_has_app_by_org
  ON public.core_relationships (organization_id)
  WHERE relationship_type = 'ORG_HAS_APP' AND is_active = true;


/* ---------------------------------------------------------------
   RPC: hera_org_link_app_v1 (v1.2)
   Purpose: Link a tenant organization to a PLATFORM APP (ORG_HAS_APP)
   Behavior:
     - Idempotent: re-link updates the existing active relationship
     - Validates APP smart_code shape and code match
     - Concurrency-safe: advisory lock on (org_id, app_id)
---------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.hera_org_link_app_v1(
  p_actor_user_id    uuid,
  p_organization_id  uuid,
  p_app_code         text,
  p_installed_at     timestamptz DEFAULT now(),
  p_subscription     jsonb       DEFAULT '{}'::jsonb,
  p_config           jsonb       DEFAULT '{}'::jsonb,
  p_is_active        boolean     DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_now           timestamptz := now();
  v_app_code      text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id uuid;
  v_app_entity_id uuid;
  v_rel_id        uuid;

  v_app_name      text;
  v_app_code_db   text;
  v_app_sc        text;

  c_rel_sc constant text := 'HERA.PLATFORM.REL.ORG_HAS_APP.LINK.v1';
  v_lock_key bigint;
BEGIN
  -- Guards
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'hera_org_link_app_v1: p_actor_user_id is required',
      ERRCODE = 'P0001';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'hera_org_link_app_v1: p_organization_id is required',
      ERRCODE = 'P0001';
  END IF;
  IF v_app_code IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'hera_org_link_app_v1: p_app_code is required',
      ERRCODE = 'P0001';
  END IF;

  -- ✅ FIXED: Added closing quote and $ anchor
  -- Validate app_code: UPPERCASE alnum only (no underscores/spaces)
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION USING
      MESSAGE = format('Invalid p_app_code "%s": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code),
      ERRCODE = '22023',
      HINT    = 'Example valid codes: SALON, POS, CRM, MEDIA1';
  END IF;

  -- Resolve tenant ORG shadow entity
  SELECT id
    INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = format('No ORGANIZATION entity found for tenant %s', p_organization_id),
      ERRCODE = 'P0002',
      HINT    = 'Seed the tenant org shadow in core_entities before linking apps.';
  END IF;

  -- Resolve PLATFORM APP entity by code
  SELECT e.id, e.entity_name, e.entity_code, e.smart_code
    INTO v_app_entity_id, v_app_name, v_app_code_db, v_app_sc
  FROM public.core_entities e
  WHERE e.organization_id = c_platform_org
    AND e.entity_type = 'APP'
    AND e.entity_code = v_app_code
  LIMIT 1;

  IF v_app_entity_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = format('APP with code "%s" not found in PLATFORM org', v_app_code),
      ERRCODE = 'P0003',
      HINT    = 'Ensure core_entities(entity_type=APP) contains the code in the PLATFORM org.';
  END IF;

  -- ✅ FIXED: Added closing quote and $ anchor
  -- Validate APP smart_code shape: HERA.PLATFORM.APP.ENTITY.<CODE>.vN
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION USING
      MESSAGE = format('APP smart_code "%s" is invalid. Expected HERA.PLATFORM.APP.ENTITY.<CODE>.vN', v_app_sc),
      ERRCODE = '22023';
  END IF;
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION USING
      MESSAGE = format('APP smart_code "%s" invalid: underscores are not allowed', v_app_sc),
      ERRCODE = '22023';
  END IF;

  -- ✅ FIXED: Added closing quote, $ anchor, and single backslash \1
  -- Segment-5 (the code) must match p_app_code
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_app_code THEN
    RAISE EXCEPTION USING
      MESSAGE = format('APP smart_code segment 5 must match code "%s"', v_app_code),
      ERRCODE = '22023',
      HINT    = 'Set APP smart_code to HERA.PLATFORM.APP.ENTITY.<CODE>.vN where <CODE> = entity_code.';
  END IF;

  -- Concurrency safety: advisory lock on (org_id, app_id)
  -- Use a deterministic hash -> bigint for the pair
  v_lock_key := ('x' || substr(md5(p_organization_id::text || v_app_entity_id::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Try UPDATE first (idempotent relink)
  UPDATE public.core_relationships r
     SET relationship_data =
           jsonb_build_object(
             'app_code', v_app_code,
             'installed_at', p_installed_at,
             'subscription', COALESCE(p_subscription,'{}'::jsonb),
             'config',       COALESCE(p_config,'{}'::jsonb)
           ),
         is_active          = COALESCE(p_is_active, true),
         smart_code         = c_rel_sc,
         smart_code_status  = 'LIVE',
         updated_at         = v_now,
         updated_by         = p_actor_user_id
   WHERE r.organization_id   = p_organization_id
     AND r.from_entity_id    = v_org_entity_id
     AND r.to_entity_id      = v_app_entity_id
     AND r.relationship_type = 'ORG_HAS_APP'
     AND r.is_active         = true                 -- Prevent multi-row UPDATE error
  RETURNING r.id INTO v_rel_id;

  -- If no row updated, INSERT (the unique partial index prevents dup active rows)
  IF v_rel_id IS NULL THEN
    INSERT INTO public.core_relationships (
      organization_id, from_entity_id, to_entity_id,
      relationship_type, relationship_direction,
      relationship_data,
      smart_code, smart_code_status,
      is_active, created_by, updated_by, created_at, updated_at
    )
    VALUES (
      p_organization_id, v_org_entity_id, v_app_entity_id,
      'ORG_HAS_APP', 'forward',
      jsonb_build_object(
        'app_code', v_app_code,
        'installed_at', p_installed_at,
        'subscription', COALESCE(p_subscription,'{}'::jsonb),
        'config',       COALESCE(p_config,'{}'::jsonb)
      ),
      c_rel_sc, 'LIVE',
      COALESCE(p_is_active, true), p_actor_user_id, p_actor_user_id, v_now, v_now
    )
    RETURNING id INTO v_rel_id;
  END IF;

  RETURN jsonb_build_object(
    'action','LINK',
    'relationship_id', v_rel_id,
    'organization_id', p_organization_id,
    'is_active', COALESCE(p_is_active, true),
    'installed_at', p_installed_at,
    'subscription', COALESCE(p_subscription,'{}'::jsonb),
    'config',       COALESCE(p_config,'{}'::jsonb),
    'app', jsonb_build_object(
      'id', v_app_entity_id,
      'code', v_app_code_db,
      'name', v_app_name,
      'smart_code', v_app_sc
    ),
    'ts', v_now
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.hera_org_link_app_v1(
  uuid, uuid, text, timestamptz, jsonb, jsonb, boolean
) FROM public;

GRANT EXECUTE ON FUNCTION public.hera_org_link_app_v1(
  uuid, uuid, text, timestamptz, jsonb, jsonb, boolean
) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_org_link_app_v1(uuid, uuid, text, timestamptz, jsonb, jsonb, boolean) IS
  'Link/install a PLATFORM APP to a tenant organization by creating/updating an ORG_HAS_APP relationship.
   Idempotent; race-safe via advisory lock. v1.2: fixed regex, backref, deterministic timestamps, better errors.';


/* ---------------------------------------------------------------
   RPC: hera_org_apps_list_v1
   Purpose: List active apps linked to a tenant organization
   Shape:
     {
       success: true,
       data: {
         items: [{
           relationship_id, linked_at, is_active,
           app: { id, code, name, smart_code },
           subscription, config
         }],
         total
       }
     }
---------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION public.hera_org_apps_list_v1(
  p_organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_items jsonb;
  v_total int;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'hera_org_apps_list_v1: p_organization_id is required',
      ERRCODE = 'P0001';
  END IF;

  WITH rel AS (
    SELECT r.id,
           r.relationship_data,
           r.created_at,
           r.is_active,
           r.to_entity_id
    FROM public.core_relationships r
    WHERE r.organization_id = p_organization_id
      AND r.relationship_type = 'ORG_HAS_APP'
      AND r.is_active = true
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'relationship_id', rel.id,
        'linked_at', rel.created_at,
        'is_active', rel.is_active,
        'subscription', COALESCE(rel.relationship_data->'subscription','{}'::jsonb),
        'config',       COALESCE(rel.relationship_data->'config','{}'::jsonb),
        'app', jsonb_build_object(
          'id', e.id,
          'code', e.entity_code,
          'name', e.entity_name,
          'smart_code', e.smart_code
        )
      ) ORDER BY e.entity_code
    ),
    COUNT(*)
  INTO v_items, v_total
  FROM rel
  JOIN public.core_entities e
    ON e.id = rel.to_entity_id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'LIST',
    'data', jsonb_build_object(
      'items', COALESCE(v_items, '[]'::jsonb),
      'total', COALESCE(v_total, 0)
    )
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.hera_org_apps_list_v1(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hera_org_apps_list_v1(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_org_apps_list_v1(uuid) IS
  'List active PLATFORM apps linked to the tenant organization via ORG_HAS_APP.';
