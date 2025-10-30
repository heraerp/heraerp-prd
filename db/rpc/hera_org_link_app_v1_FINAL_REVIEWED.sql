-- ===================================================================
-- RPC: hera_org_link_app_v1
-- Purpose: Link a tenant organization to a PLATFORM APP (ORG_HAS_APP)
-- Status: ✅ PRODUCTION READY (regex + replacement fixed)
-- Version: 1.1 (All syntax bugs fixed)
-- ===================================================================

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

  v_app_code       text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id  uuid;
  v_app_entity_id  uuid;
  v_rel_id         uuid;

  v_app_name       text;
  v_app_code_db    text;
  v_app_sc         text;

  c_rel_sc constant text := 'HERA.PLATFORM.REL.ORG_HAS_APP.LINK.v1';
BEGIN
  -- Guards
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_link_app_v1: p_actor_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_link_app_v1: p_organization_id is required';
  END IF;
  IF v_app_code IS NULL THEN
    RAISE EXCEPTION 'hera_org_link_app_v1: p_app_code is required';
  END IF;

  -- Validate app_code: UPPERCASE alnum only (no underscores/spaces)
  -- ✅ FIXED: Added closing quote and $ anchor
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code;
  END IF;

  -- Resolve tenant ORG shadow entity
  SELECT id
    INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'No ORGANIZATION entity found for tenant %', p_organization_id;
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
    RAISE EXCEPTION 'APP with code "%" not found in PLATFORM org', v_app_code;
  END IF;

  -- Validate APP smart_code shape: HERA.PLATFORM.APP.ENTITY.<CODE>.vN
  -- ✅ FIXED: Added closing quote and $ anchor
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" is invalid. Expected HERA.PLATFORM.APP.ENTITY.<CODE>.vN', v_app_sc;
  END IF;
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed', v_app_sc;
  END IF;

  -- Segment-5 (the code) must match p_app_code
  -- ✅ FIXED: Added closing quote, $ anchor, and single backslash \1
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_app_code THEN
    RAISE EXCEPTION 'APP smart_code segment 5 must match code "%"', v_app_code;
  END IF;

  -- Upsert ORG_HAS_APP (UPDATE first)
  UPDATE public.core_relationships r
     SET relationship_data =
           jsonb_build_object(
             'app_code', v_app_code,
             'installed_at', p_installed_at,
             'subscription', COALESCE(p_subscription,'{}'::jsonb),
             'config',       COALESCE(p_config,'{}'::jsonb)
           ),
         is_active   = COALESCE(p_is_active, true),
         smart_code  = c_rel_sc,
         smart_code_status = 'LIVE',
         updated_at  = now(),
         updated_by  = p_actor_user_id
   WHERE r.organization_id = p_organization_id
     AND r.from_entity_id  = v_org_entity_id
     AND r.to_entity_id    = v_app_entity_id
     AND r.relationship_type = 'ORG_HAS_APP'
  RETURNING r.id INTO v_rel_id;

  -- If no row updated, INSERT
  IF v_rel_id IS NULL THEN
    INSERT INTO public.core_relationships (
      organization_id, from_entity_id, to_entity_id,
      relationship_type, relationship_direction,
      relationship_data,
      smart_code, smart_code_status,
      is_active, created_by, updated_by
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
      COALESCE(p_is_active, true), p_actor_user_id, p_actor_user_id
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
    )
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
  'Link/install a PLATFORM APP to tenant organization. Creates ORG_HAS_APP relationship.
   Idempotent: re-linking updates existing relationship. v1.1 - Syntax bugs fixed (3 regex issues).';
