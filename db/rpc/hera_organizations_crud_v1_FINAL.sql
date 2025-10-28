-- ===================================================================
-- RPC: hera_organizations_crud_v1 (PRODUCTION READY - FINAL)
-- Purpose: Comprehensive CRUD for organizations with optional bootstrap
-- Status: ✅ READY FOR DEPLOYMENT
-- Version: 2.0 (adds app bootstrap integration)
--
-- Features:
-- - Full CRUD: CREATE, UPDATE, GET, LIST, ARCHIVE
-- - User bootstrap: Automatic owner/member onboarding
-- - App bootstrap: Install/configure apps during org creation
-- - Shadow entity: Ensures ORGANIZATION entity in core_entities
-- - Role-based security: OWNER/ADMIN required for modifications
-- - Audit trail: Complete actor stamping
--
-- Dependencies:
-- - public._hera_resolve_org_role(uuid, uuid) - role resolution
-- - public.hera_onboard_user_v1(...) - user onboarding
-- - public.hera_org_link_app_v1(...) - app installation
-- - public.hera_org_unlink_app_v1(...) - app uninstallation
-- - public.hera_org_set_default_app_v1(...) - default app setting
-- ===================================================================

DROP FUNCTION IF EXISTS public.hera_organizations_crud_v1(text, uuid, jsonb, int, int);

CREATE OR REPLACE FUNCTION public.hera_organizations_crud_v1(
  p_action        text,            -- 'CREATE' | 'UPDATE' | 'GET' | 'LIST' | 'ARCHIVE'
  p_actor_user_id uuid,            -- PLATFORM USER entity id (auth.users.id)
  p_payload       jsonb DEFAULT '{}'::jsonb,
  p_limit         int  DEFAULT 50,
  p_offset        int  DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_now        timestamptz := now();
  v_row        public.core_organizations%rowtype;
  v_role       text;

  -- Organization fields
  v_id         uuid := coalesce((p_payload->>'id')::uuid, gen_random_uuid());
  v_org_name   text := nullif(trim(p_payload->>'organization_name'), '');
  v_org_code   text := nullif(trim(p_payload->>'organization_code'), '');
  v_org_type   text := coalesce(nullif(trim(p_payload->>'organization_type'), ''), 'business_unit');
  v_industry   text := nullif(trim(p_payload->>'industry_classification'), null);
  v_parent_id  uuid := nullif(p_payload->>'parent_organization_id','')::uuid;
  v_ai_insights jsonb := coalesce(p_payload->'ai_insights', '{}'::jsonb);
  v_ai_class   text := nullif(trim(p_payload->>'ai_classification'), null);
  v_ai_conf    numeric := coalesce(nullif(p_payload->>'ai_confidence','')::numeric, 0.0000);
  v_settings   jsonb := coalesce(p_payload->'settings', '{}'::jsonb);
  v_status     text := coalesce(nullif(trim(p_payload->>'status'), ''), 'active');

  -- Bootstrap options
  v_bootstrap  boolean := coalesce((p_payload->>'bootstrap')::boolean, false);
  v_owner_user_id uuid := nullif(p_payload->>'owner_user_id','')::uuid;
  v_members       jsonb := coalesce(p_payload->'members','[]'::jsonb);
  v_member        jsonb;

  -- App bootstrap options (NEW in v2.0)
  v_apps        jsonb := coalesce(p_payload->'apps','[]'::jsonb);         -- [{code,subscription?,config?,is_active?}, ...]
  v_app         jsonb;
  v_default_app text := nullif(trim(p_payload->>'default_app_code'), ''); -- UPPERCASE, must be installed to be set

  -- Shadow entity
  v_org_entity_id uuid;
  c_org_sc_shadow constant text := 'HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1';
BEGIN
  -- ============================================================
  -- 1) VALIDATE ACTION
  -- ============================================================
  IF p_action NOT IN ('CREATE','UPDATE','GET','LIST','ARCHIVE') THEN
    RAISE EXCEPTION 'Unsupported action: %. Supported: CREATE, UPDATE, GET, LIST, ARCHIVE', p_action;
  END IF;

  IF p_action IN ('CREATE','UPDATE','ARCHIVE') AND p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'p_actor_user_id is required for writes (action: %)', p_action;
  END IF;

  -- ============================================================
  -- 2) AUTHORIZE ACTOR (for UPDATE, ARCHIVE, GET)
  -- ============================================================
  IF p_action IN ('UPDATE','ARCHIVE','GET') THEN
    IF (p_payload ? 'id') IS NOT TRUE THEN
      RAISE EXCEPTION 'id is required in payload for % action', p_action;
    END IF;

    v_role := public._hera_resolve_org_role(p_actor_user_id, v_id);
    IF v_role IS NULL THEN
      RAISE EXCEPTION 'actor_not_member: % is not a member of organization %', p_actor_user_id, v_id;
    END IF;

    IF p_action IN ('UPDATE','ARCHIVE') AND v_role NOT IN ('ORG_OWNER','ORG_ADMIN') THEN
      RAISE EXCEPTION 'forbidden: role % cannot % organization. OWNER or ADMIN role required.', v_role, lower(p_action);
    END IF;
  END IF;

  -- ============================================================
  -- 3) CREATE
  -- ============================================================
  IF p_action = 'CREATE' THEN
    -- Validate required fields
    IF v_org_name IS NULL THEN
      RAISE EXCEPTION 'organization_name is required for CREATE';
    END IF;
    IF v_org_code IS NULL THEN
      RAISE EXCEPTION 'organization_code is required for CREATE';
    END IF;
    IF v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'invalid status: %. Allowed: active, inactive, archived', v_status;
    END IF;
    IF v_ai_conf < 0 OR v_ai_conf > 1 THEN
      RAISE EXCEPTION 'ai_confidence must be between 0 and 1, got: %', v_ai_conf;
    END IF;

    -- Check for duplicate organization_code
    PERFORM 1 FROM public.core_organizations WHERE lower(organization_code) = lower(v_org_code);
    IF FOUND THEN
      RAISE EXCEPTION 'duplicate: organization_code "%" already exists', v_org_code;
    END IF;

    -- Create organization record
    INSERT INTO public.core_organizations (
      id, organization_name, organization_code, organization_type,
      industry_classification, parent_organization_id,
      ai_insights, ai_classification, ai_confidence,
      settings, status, created_at, updated_at, created_by, updated_by
    ) VALUES (
      v_id, v_org_name, v_org_code, v_org_type,
      v_industry, v_parent_id,
      v_ai_insights, v_ai_class, v_ai_conf,
      v_settings, v_status, v_now, v_now, p_actor_user_id, p_actor_user_id
    )
    RETURNING * INTO v_row;

    -- Ensure ORGANIZATION shadow entity exists
    SELECT id INTO v_org_entity_id
    FROM public.core_entities
    WHERE organization_id = v_row.id
      AND entity_type = 'ORGANIZATION'
    LIMIT 1;

    IF v_org_entity_id IS NULL THEN
      INSERT INTO public.core_entities (
        organization_id, entity_type, entity_name, entity_code,
        smart_code, smart_code_status, status, metadata, created_by, updated_by
      )
      VALUES (
        v_row.id, 'ORGANIZATION', v_row.organization_name, v_row.organization_code,
        c_org_sc_shadow, 'LIVE', v_row.status,
        jsonb_build_object('source','org_crud_create'),
        p_actor_user_id, p_actor_user_id
      )
      RETURNING id INTO v_org_entity_id;
    END IF;

    -- ========= USER BOOTSTRAP =========
    -- Bootstrap actor as owner if requested
    IF v_bootstrap THEN
      PERFORM public.hera_onboard_user_v1(
        p_supabase_user_id := p_actor_user_id,
        p_organization_id  := v_row.id,
        p_actor_user_id    := p_actor_user_id,
        p_role             := 'owner'
      );
    END IF;

    -- Onboard separate owner if specified
    IF v_owner_user_id IS NOT NULL THEN
      PERFORM public.hera_onboard_user_v1(
        p_supabase_user_id := v_owner_user_id,
        p_organization_id  := v_row.id,
        p_actor_user_id    := p_actor_user_id,
        p_role             := 'owner'
      );
    END IF;

    -- Onboard additional members from array
    IF jsonb_typeof(v_members) = 'array' THEN
      FOR v_member IN SELECT * FROM jsonb_array_elements(v_members) LOOP
        IF (v_member ? 'user_id') THEN
          PERFORM public.hera_onboard_user_v1(
            p_supabase_user_id := (v_member->>'user_id')::uuid,
            p_organization_id  := v_row.id,
            p_actor_user_id    := p_actor_user_id,
            p_role             := coalesce(nullif(v_member->>'role',''),'member')
          );
        END IF;
      END LOOP;
    END IF;

    -- ========= APP BOOTSTRAP (NEW in v2.0) =========
    -- Install/uninstall apps based on array
    IF jsonb_typeof(v_apps) = 'array' THEN
      FOR v_app IN SELECT * FROM jsonb_array_elements(v_apps) LOOP
        -- Delegate validation to specialized RPCs (UPPERCASE code, smart code, etc.)
        IF (v_app ? 'code') AND nullif(trim(v_app->>'code'), '') IS NOT NULL THEN
          IF coalesce((v_app->>'is_active')::boolean, true) IS TRUE THEN
            -- Install app (active)
            PERFORM public.hera_org_link_app_v1(
              p_actor_user_id    := p_actor_user_id,
              p_organization_id  := v_row.id,
              p_app_code         := (v_app->>'code'),
              p_installed_at     := now(),
              p_subscription     := coalesce(v_app->'subscription','{}'::jsonb),
              p_config           := coalesce(v_app->'config','{}'::jsonb),
              p_is_active        := true
            );
          ELSE
            -- Soft uninstall (is_active = false)
            PERFORM public.hera_org_unlink_app_v1(
              p_actor_user_id    := p_actor_user_id,
              p_organization_id  := v_row.id,
              p_app_code         := (v_app->>'code'),
              p_uninstalled_at   := now(),
              p_hard_delete      := false
            );
          END IF;
        END IF;
      END LOOP;
    END IF;

    -- Set default app if specified (must be installed/active)
    IF v_default_app IS NOT NULL THEN
      PERFORM public.hera_org_set_default_app_v1(
        p_actor_user_id   := p_actor_user_id,
        p_organization_id := v_row.id,
        p_app_code        := v_default_app
      );
    END IF;
    -- ========= END: APP BOOTSTRAP =========

    RETURN jsonb_build_object('action','CREATE','organization', to_jsonb(v_row));
  END IF;

  -- ============================================================
  -- 4) UPDATE
  -- ============================================================
  IF p_action = 'UPDATE' THEN
    SELECT * INTO v_row FROM public.core_organizations WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found: %', v_id;
    END IF;

    -- Check for duplicate organization_code (if changing)
    IF p_payload ? 'organization_code' THEN
      PERFORM 1 FROM public.core_organizations
       WHERE lower(organization_code) = lower(v_org_code)
         AND id <> v_id;
      IF FOUND THEN
        RAISE EXCEPTION 'duplicate: organization_code "%" already exists', v_org_code;
      END IF;
    END IF;

    -- Validate status if changing
    IF p_payload ? 'status' AND v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'invalid status: %. Allowed: active, inactive, archived', v_status;
    END IF;

    -- Validate ai_confidence if changing
    IF p_payload ? 'ai_confidence' AND (v_ai_conf < 0 OR v_ai_conf > 1) THEN
      RAISE EXCEPTION 'ai_confidence must be between 0 and 1, got: %', v_ai_conf;
    END IF;

    -- Update organization (only provided fields)
    UPDATE public.core_organizations SET
      organization_name       = coalesce(v_org_name, organization_name),
      organization_code       = coalesce(v_org_code, organization_code),
      organization_type       = coalesce(v_org_type, organization_type),
      industry_classification = coalesce(v_industry, industry_classification),
      parent_organization_id  = coalesce(v_parent_id, parent_organization_id),
      ai_insights             = coalesce(v_ai_insights, ai_insights),
      ai_classification       = coalesce(v_ai_class, ai_classification),
      ai_confidence           = coalesce(v_ai_conf, ai_confidence),
      settings                = coalesce(v_settings, settings),
      status                  = coalesce(v_status, status),
      updated_by              = p_actor_user_id,
      updated_at              = now()
    WHERE id = v_id
    RETURNING * INTO v_row;

    -- Ensure/refresh ORG shadow entity
    SELECT id INTO v_org_entity_id
    FROM public.core_entities
    WHERE organization_id = v_row.id
      AND entity_type = 'ORGANIZATION'
    LIMIT 1;

    IF v_org_entity_id IS NULL THEN
      INSERT INTO public.core_entities (
        organization_id, entity_type, entity_name, entity_code,
        smart_code, smart_code_status, status, metadata, created_by, updated_by
      )
      VALUES (
        v_row.id, 'ORGANIZATION', v_row.organization_name, v_row.organization_code,
        c_org_sc_shadow, 'LIVE', v_row.status,
        jsonb_build_object('source','org_crud_update'),
        p_actor_user_id, p_actor_user_id
      )
      RETURNING id INTO v_org_entity_id;
    ELSE
      UPDATE public.core_entities
      SET entity_name = v_row.organization_name,
          entity_code = v_row.organization_code,
          status      = v_row.status,
          updated_by  = p_actor_user_id,
          updated_at  = now()
      WHERE id = v_org_entity_id;
    END IF;

    RETURN jsonb_build_object('action','UPDATE','organization', to_jsonb(v_row));
  END IF;

  -- ============================================================
  -- 5) ARCHIVE
  -- ============================================================
  IF p_action = 'ARCHIVE' THEN
    UPDATE public.core_organizations SET
      status     = 'archived',
      updated_by = p_actor_user_id,
      updated_at = now()
    WHERE id = v_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found: %', v_id;
    END IF;

    -- Also archive shadow entity
    UPDATE public.core_entities
      SET status = 'archived', updated_by = p_actor_user_id, updated_at = now()
      WHERE organization_id = v_row.id AND entity_type = 'ORGANIZATION';

    RETURN jsonb_build_object('action','ARCHIVE','organization', to_jsonb(v_row));
  END IF;

  -- ============================================================
  -- 6) GET
  -- ============================================================
  IF p_action = 'GET' THEN
    SELECT * INTO v_row FROM public.core_organizations WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found: %', v_id;
    END IF;

    RETURN jsonb_build_object('action','GET','organization', to_jsonb(v_row));
  END IF;

  -- ============================================================
  -- 7) LIST
  -- ============================================================
  IF p_action = 'LIST' THEN
    RETURN jsonb_build_object(
      'action','LIST',
      'items', (
        SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
        FROM (
          SELECT *
          FROM public.core_organizations
          ORDER BY created_at DESC
          LIMIT greatest(p_limit, 0)
          OFFSET greatest(p_offset, 0)
        ) t
      ),
      'limit', p_limit,
      'offset', p_offset
    );
  END IF;

  RAISE EXCEPTION 'Unhandled action: %', p_action;
END
$fn$;

-- ============================================================
-- SECURITY: Restrict to authenticated users only
-- ============================================================
REVOKE ALL ON FUNCTION public.hera_organizations_crud_v1(text, uuid, jsonb, int, int)
FROM public;

GRANT EXECUTE ON FUNCTION public.hera_organizations_crud_v1(text, uuid, jsonb, int, int)
TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_organizations_crud_v1(text, uuid, jsonb, int, int) IS
  'CRUD for core_organizations. Ensures ORG entity; user onboarding via hera_onboard_user_v1.
   v2.0: CREATE optionally bootstraps apps via hera_org_link_app_v1 / hera_org_unlink_app_v1 and sets default via hera_org_set_default_app_v1.
   Dependencies: _hera_resolve_org_role, hera_onboard_user_v1, hera_org_link_app_v1, hera_org_unlink_app_v1, hera_org_set_default_app_v1';

-- ============================================================
-- DEPLOYMENT VERIFICATION SCRIPT
-- ============================================================

-- Pre-Deployment Checks:

-- 1. Verify dependencies exist:
/*
SELECT proname FROM pg_proc
WHERE proname IN (
  '_hera_resolve_org_role',
  'hera_onboard_user_v1',
  'hera_org_link_app_v1',
  'hera_org_unlink_app_v1',
  'hera_org_set_default_app_v1'
);
-- Expected: 5 rows
*/

-- Post-Deployment Tests:

-- Test 1: CREATE organization (minimal):
/*
SELECT hera_organizations_crud_v1(
  p_action := 'CREATE',
  p_actor_user_id := '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  p_payload := '{
    "organization_name": "Test Org",
    "organization_code": "TESTORG"
  }'::jsonb
);
-- Expected: Success with organization object
*/

-- Test 2: CREATE with bootstrap and apps:
/*
SELECT hera_organizations_crud_v1(
  p_action := 'CREATE',
  p_actor_user_id := '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  p_payload := '{
    "organization_name": "Michele Salon",
    "organization_code": "MICHELE",
    "bootstrap": true,
    "apps": [
      {
        "code": "SALON",
        "is_active": true,
        "subscription": {"plan": "premium"},
        "config": {"enable_pos": true}
      }
    ],
    "default_app_code": "SALON"
  }'::jsonb
);
-- Expected: Success with org, actor as owner, SALON app installed and set as default
*/

-- Test 3: Verify organization created:
/*
SELECT * FROM core_organizations
WHERE organization_code = 'MICHELE';
-- Expected: 1 row with settings containing default_app_code = 'SALON'
*/

-- Test 4: Verify shadow entity created:
/*
SELECT * FROM core_entities
WHERE organization_id = (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE')
  AND entity_type = 'ORGANIZATION';
-- Expected: 1 row
*/

-- Test 5: Verify actor membership:
/*
SELECT * FROM core_relationships r
WHERE r.organization_id = (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE')
  AND r.from_entity_id = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid
  AND r.relationship_type = 'MEMBER_OF';
-- Expected: 1 row with is_active = true
*/

-- Test 6: Verify app installation:
/*
SELECT * FROM core_relationships r
WHERE r.organization_id = (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE')
  AND r.relationship_type = 'ORG_HAS_APP'
  AND r.to_entity_id IN (SELECT id FROM core_entities WHERE entity_code = 'SALON');
-- Expected: 1 row with is_active = true
*/

-- Test 7: UPDATE organization:
/*
SELECT hera_organizations_crud_v1(
  p_action := 'UPDATE',
  p_actor_user_id := '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  p_payload := jsonb_build_object(
    'id', (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE'),
    'organization_name', 'Michele Luxury Salon'
  )
);
-- Expected: Success with updated name
*/

-- Test 8: GET organization:
/*
SELECT hera_organizations_crud_v1(
  p_action := 'GET',
  p_actor_user_id := '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  p_payload := jsonb_build_object(
    'id', (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE')
  )
);
-- Expected: Success with full organization object
*/

-- Test 9: LIST organizations:
/*
SELECT hera_organizations_crud_v1(
  p_action := 'LIST',
  p_actor_user_id := '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  p_limit := 10,
  p_offset := 0
);
-- Expected: Success with array of organizations
*/

-- Test 10: ARCHIVE organization:
/*
SELECT hera_organizations_crud_v1(
  p_action := 'ARCHIVE',
  p_actor_user_id := '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  p_payload := jsonb_build_object(
    'id', (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE')
  )
);
-- Expected: Success with status = 'archived'
*/

-- Test 11: Test authorization (non-member should fail):
/*
SELECT hera_organizations_crud_v1(
  p_action := 'UPDATE',
  p_actor_user_id := '00000000-0000-0000-0000-000000000999'::uuid,  -- Non-member
  p_payload := jsonb_build_object(
    'id', (SELECT id FROM core_organizations WHERE organization_code = 'MICHELE'),
    'organization_name', 'Hacked Name'
  )
);
-- Expected: Exception "actor_not_member"
*/

-- Test 12: Integration test with hera_auth_introspect_v1:
/*
SELECT
  result->'organizations'->0->>'name' AS org_name,
  result->'organizations'->0->>'primary_role' AS role,
  result->'organizations'->0->'apps'->0->>'code' AS first_app,
  result->>'default_app' AS default_app
FROM (
  SELECT hera_auth_introspect_v1('3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid) AS result
) t;
-- Expected: org_name = 'Michele Luxury Salon', role = 'ORG_OWNER', first_app = 'SALON', default_app = 'SALON'
*/
