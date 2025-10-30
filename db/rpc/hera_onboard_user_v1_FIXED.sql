-- ============================================================
-- RPC: hera_onboard_user_v1 (FIXED - Advisory Lock)
-- Ensures:
--   • PLATFORM USER entity (global)
--   • Tenant ORGANIZATION entity (shadow)
--   • Tenant ROLE entity for role_code
-- Creates tenant-scoped relationships using PLATFORM USER entity as "from":
--   • MEMBER_OF (USER -> ORG), relationship_data.role
--   • HAS_ROLE  (USER -> ROLE), relationship_data.role_code (+ optional label)
--
-- FIX: Changed pg_advisory_xact_lock to use single bigint parameter
--      by combining org_id and user_id hashes with XOR
-- ============================================================

DROP FUNCTION IF EXISTS public.hera_onboard_user_v1(uuid, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.hera_onboard_user_v1(
  p_supabase_user_id uuid,          -- auth.users.id (also platform USER entity id)
  p_organization_id  uuid,          -- tenant org id
  p_actor_user_id    uuid,          -- actor (often same as auth user, or service id)
  p_role             text DEFAULT 'member'  -- owner|admin|manager|employee|staff|member|<custom>
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_actor_id          uuid := coalesce(p_actor_user_id, p_supabase_user_id);
  v_now               timestamptz := now();

  -- Auth profile
  v_auth RECORD;
  v_user_email text;
  v_user_name  text;

  -- Entities
  v_platform_user_entity_id uuid;  -- == p_supabase_user_id after upsert
  v_org_entity_id           uuid;  -- tenant ORGANIZATION entity
  v_role_entity_id          uuid;  -- tenant ROLE entity

  -- Relationships
  v_membership_id uuid;
  v_hasrole_id    uuid;
  v_hasrole_existing uuid;

  -- Current primary role (if any) for this (org,user)
  v_cur_primary_id   uuid;
  v_cur_primary_code text;

  -- Primary selection flags
  v_make_primary boolean := false;
  v_cur_rank int;
  v_new_rank int;

  -- Smart codes
  c_user_sc_platform CONSTANT text := 'HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1';
  c_org_sc_shadow    CONSTANT text := 'HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1';
  c_role_sc          CONSTANT text := 'HERA.UNIVERSAL.ENTITY.ROLE.CANONICAL.v1';
  c_rel_memberof_sc  CONSTANT text := 'HERA.UNIVERSAL.REL.MEMBER_OF.USER_TO_ORG.v1';
  c_rel_hasrole_sc   CONSTANT text := 'HERA.UNIVERSAL.REL.HAS_ROLE.USER_TO_ROLE.v1';

  -- Role normalization
  v_in_role    text := lower(coalesce(p_role,'member'));
  v_role_code  text;
  v_role_label text := NULL;

  -- Advisory lock key (single bigint)
  v_lock_key bigint;
BEGIN
  -- Guards
  IF p_supabase_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_onboard_user_v1: p_supabase_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_onboard_user_v1: p_organization_id is required';
  END IF;
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'hera_onboard_user_v1: actor could not be resolved';
  END IF;

  -- Auth profile
  SELECT u.email,
         coalesce(u.raw_user_meta_data->>'full_name',
                  u.raw_user_meta_data->>'name',
                  u.raw_user_meta_data->>'display_name',
                  u.email, 'User') AS display_name
    INTO v_auth
  FROM auth.users u
  WHERE u.id = p_supabase_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supabase user not found: %', p_supabase_user_id;
  END IF;

  v_user_email := v_auth.email;
  v_user_name  := v_auth.display_name;

  -- Canonical role code
  v_role_code := CASE v_in_role
    WHEN 'owner'      THEN 'ORG_OWNER'
    WHEN 'admin'      THEN 'ORG_ADMIN'
    WHEN 'manager'    THEN 'ORG_MANAGER'
    WHEN 'accountant' THEN 'ORG_ACCOUNTANT'
    WHEN 'employee'   THEN 'ORG_EMPLOYEE'
    WHEN 'staff'      THEN 'ORG_EMPLOYEE'
    WHEN 'member'     THEN 'MEMBER'
    ELSE upper(replace(v_in_role,' ','_'))  -- e.g., finance_manager -> FINANCE_MANAGER
  END;

  IF v_in_role NOT IN ('owner','admin','manager','employee','staff','member') THEN
    v_role_label := v_in_role;
  END IF;

  -- 1) Ensure PLATFORM USER entity (global scope, id = auth user id)
  INSERT INTO public.core_entities (
    id, organization_id, entity_type, entity_name, entity_code,
    smart_code, smart_code_status, status, metadata, created_by, updated_by
  )
  VALUES (
    p_supabase_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'USER', v_user_name, p_supabase_user_id::text,
    c_user_sc_platform, 'LIVE', 'active',
    jsonb_build_object('email', v_user_email),
    v_actor_id, v_actor_id
  )
  ON CONFLICT (id) DO UPDATE
    SET entity_name = EXCLUDED.entity_name,
        metadata    = coalesce(EXCLUDED.metadata, core_entities.metadata),
        updated_at  = now(),
        updated_by  = v_actor_id
  RETURNING id INTO v_platform_user_entity_id;

  -- 2) Ensure ORGANIZATION shadow entity (tenant scope)
  SELECT id INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    INSERT INTO public.core_entities (
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status, metadata, created_by, updated_by
    )
    SELECT
      o.id, 'ORGANIZATION', o.organization_name, o.organization_code,
      c_org_sc_shadow, 'LIVE', o.status,
      jsonb_build_object('source', 'onboard_create'),
      v_actor_id, v_actor_id
    FROM public.core_organizations o
    WHERE o.id = p_organization_id
    RETURNING id INTO v_org_entity_id;
  END IF;

  -- 3) Ensure ROLE entity (tenant scope) for v_role_code
  SELECT id INTO v_role_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ROLE'
    AND entity_code = v_role_code
  LIMIT 1;

  IF v_role_entity_id IS NULL THEN
    INSERT INTO public.core_entities (
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status, metadata, created_by, updated_by
    )
    VALUES (
      p_organization_id, 'ROLE', v_role_code, v_role_code,
      c_role_sc, 'LIVE', 'active',
      jsonb_build_object('label', v_role_label),
      v_actor_id, v_actor_id
    )
    RETURNING id INTO v_role_entity_id;
  END IF;

  -- 4) Relationships (tenant scope; FROM = PLATFORM USER entity)
  -- 4a) MEMBER_OF
  INSERT INTO public.core_relationships (
    organization_id, from_entity_id, to_entity_id,
    relationship_type, relationship_direction,
    relationship_data, smart_code, smart_code_status,
    is_active, created_by, updated_by
  )
  VALUES (
    p_organization_id, v_platform_user_entity_id, v_org_entity_id,
    'MEMBER_OF', 'forward',
    jsonb_build_object('role', v_role_code),
    c_rel_memberof_sc, 'LIVE',
    true, v_actor_id, v_actor_id
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.core_relationships cr
  SET relationship_data = jsonb_set(coalesce(cr.relationship_data,'{}'::jsonb), '{role}', to_jsonb(v_role_code::text), true),
      is_active = true,
      updated_at = now(),
      updated_by = v_actor_id
  WHERE cr.organization_id = p_organization_id
    AND cr.from_entity_id  = v_platform_user_entity_id
    AND cr.to_entity_id    = v_org_entity_id
    AND cr.relationship_type = 'MEMBER_OF';

  SELECT id INTO v_membership_id
  FROM public.core_relationships
  WHERE organization_id = p_organization_id
    AND from_entity_id  = v_platform_user_entity_id
    AND to_entity_id    = v_org_entity_id
    AND relationship_type = 'MEMBER_OF'
  ORDER BY updated_at DESC
  LIMIT 1;

  -- 4b) HAS_ROLE with primary handling (no-trigger version)

  -- ✅ FIX: Use single-parameter advisory lock by combining hashes with XOR
  -- Serialize per (org, user) to avoid races
  v_lock_key := hashtextextended(p_organization_id::text, 0) # hashtextextended(v_platform_user_entity_id::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Find current primary (if any)
  SELECT
    cr.id,
    coalesce((cr.relationship_data->>'role_code')::text, ce.entity_code)
  INTO v_cur_primary_id, v_cur_primary_code
  FROM public.core_relationships cr
  JOIN public.core_entities ce ON ce.id = cr.to_entity_id
  WHERE cr.organization_id   = p_organization_id
    AND cr.from_entity_id    = v_platform_user_entity_id
    AND cr.relationship_type = 'HAS_ROLE'
    AND coalesce(cr.is_active, true)
    AND coalesce((cr.relationship_data->>'is_primary')::boolean,false)
  LIMIT 1;

  -- Decide if the new/updated role should be primary
  v_cur_rank := public._hera_role_rank(v_cur_primary_code);
  v_new_rank := public._hera_role_rank(v_role_code);
  v_make_primary := (v_cur_primary_id IS NULL) OR (v_new_rank < v_cur_rank);

  -- Upsert HAS_ROLE for this ROLE entity
  SELECT id INTO v_hasrole_existing
  FROM public.core_relationships
  WHERE organization_id   = p_organization_id
    AND from_entity_id    = v_platform_user_entity_id
    AND to_entity_id      = v_role_entity_id
    AND relationship_type = 'HAS_ROLE'
  LIMIT 1;

  IF v_hasrole_existing IS NULL THEN
    INSERT INTO public.core_relationships (
      organization_id, from_entity_id, to_entity_id,
      relationship_type, relationship_direction,
      relationship_data, smart_code, smart_code_status,
      is_active, created_by, updated_by
    )
    VALUES (
      p_organization_id, v_platform_user_entity_id, v_role_entity_id,
      'HAS_ROLE', 'forward',
      jsonb_build_object('role_code', v_role_code)
        || coalesce(jsonb_build_object('label', v_role_label), '{}'::jsonb)
        || CASE WHEN v_make_primary THEN jsonb_build_object('is_primary', true) ELSE '{}'::jsonb END,
      c_rel_hasrole_sc, 'LIVE',
      true, v_actor_id, v_actor_id
    )
    RETURNING id INTO v_hasrole_id;
  ELSE
    UPDATE public.core_relationships cr
       SET relationship_data =
             jsonb_set(coalesce(cr.relationship_data,'{}'::jsonb), '{role_code}', to_jsonb(v_role_code::text), true)
             || coalesce(jsonb_build_object('label', v_role_label), '{}'::jsonb)
             || CASE WHEN v_make_primary THEN jsonb_build_object('is_primary', true) ELSE '{}'::jsonb END,
           is_active   = true,
           updated_at  = now(),
           updated_by  = v_actor_id
     WHERE cr.id = v_hasrole_existing
     RETURNING id INTO v_hasrole_id;
  END IF;

  -- If we became primary, demote others (enforced before the unique index could trip)
  IF v_make_primary THEN
    UPDATE public.core_relationships r
       SET relationship_data = jsonb_set(coalesce(r.relationship_data,'{}'::jsonb), '{is_primary}', 'false'::jsonb, true),
           updated_at = now(),
           updated_by = v_actor_id
     WHERE r.organization_id   = p_organization_id
       AND r.from_entity_id    = v_platform_user_entity_id
       AND r.relationship_type = 'HAS_ROLE'
       AND r.to_entity_id     <> v_role_entity_id
       AND coalesce(r.is_active, true)
       AND coalesce((r.relationship_data->>'is_primary')::boolean,false);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'platform_user_entity_id', v_platform_user_entity_id,
    'organization_entity_id',  v_org_entity_id,
    'role_entity_id',          v_role_entity_id,
    'membership_id',           v_membership_id,
    'has_role_id',             v_hasrole_id,
    'organization_id',         p_organization_id,
    'role_code',               v_role_code,
    'label',                   v_role_label,
    'message',                 'User onboarded (platform USER linked via MEMBER_OF + HAS_ROLE; primary handled in-RPC)'
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Extremely rare due to the advisory lock; resolve by ensuring only one primary then retry message
    RAISE EXCEPTION 'hera_onboard_user_v1: unique violation while setting primary role — retry operation';

  WHEN OTHERS THEN
    RAISE EXCEPTION 'hera_onboard_user_v1 failed: %', SQLERRM
      USING HINT = format('auth_user=%s org=%s', p_supabase_user_id, p_organization_id);
END;
$func$;

REVOKE ALL ON FUNCTION public.hera_onboard_user_v1(uuid, uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.hera_onboard_user_v1(uuid, uuid, uuid, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_onboard_user_v1(uuid, uuid, uuid, text) IS
  'Onboard auth user to organization: creates PLATFORM USER entity, tenant ORGANIZATION/ROLE entities, and MEMBER_OF + HAS_ROLE relationships.
   Fixed: Uses single-parameter advisory lock (XOR of org and user hashes). v1.1';
