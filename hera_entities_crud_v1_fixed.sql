-- =====================================================================
-- UNIVERSAL ENTITY CRUD v1 (PRODUCTION READY - FIXED)
-- =====================================================================
-- This version fixes the "cr.source_entity_id does not exist" error
-- by using the correct column names: from_entity_id and to_entity_id
-- =====================================================================

CREATE OR REPLACE FUNCTION public.hera_entities_crud_v1(
  p_action            text,
  p_actor_user_id     uuid,
  p_organization_id   uuid,
  p_entity            jsonb DEFAULT '{}'::jsonb,
  p_dynamic           jsonb DEFAULT '{}'::jsonb,
  p_relationships     jsonb DEFAULT '{}'::jsonb,
  p_options           jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
  -- Options / toggles
  v_action text := upper(coalesce(p_action,''));
  v_include_dyn bool := coalesce((p_options->>'include_dynamic')::bool, true);
  v_include_rel bool := coalesce((p_options->>'include_relationships')::bool, true);
  v_limit int := coalesce((p_options->>'limit')::int, 100);
  v_offset int := coalesce((p_options->>'offset')::int, 0);
  v_relationships_mode text := upper(coalesce(p_options->>'relationships_mode','UPSERT')); -- UPSERT|REPLACE
  v_emit_audit bool := coalesce((p_options->>'audit')::bool, false);

  -- Relationship smart code options (explicit + per-type map)
  v_relationship_smart_code text := NULLIF(p_options->>'relationship_smart_code','');
  v_rel_smart_map jsonb := p_options->'relationship_smart_code_map';

  v_allow_platform_identity bool := coalesce((p_options->>'allow_platform_identity')::bool, false);
  v_audit_actor_user_id uuid := NULLIF(p_options->>'audit_actor_user_id','')::uuid;
  v_system_actor_user_id uuid := NULLIF(p_options->>'system_actor_user_id','')::uuid;
  v_list_mode text := upper(coalesce(p_options->>'list_mode','FULL')); -- HEADERS | FULL

  -- Header fields (inputs)
  v_entity_type text := NULLIF(p_entity->>'entity_type','');
  v_entity_name text := NULLIF(p_entity->>'entity_name','');
  v_smart_code  text := NULLIF(p_entity->>'smart_code','');
  v_entity_code text := NULLIF(p_entity->>'entity_code','');
  v_entity_desc text := NULLIF(p_entity->>'entity_description','');
  v_parent_id   uuid := NULLIF(p_entity->>'parent_entity_id','')::uuid;
  v_status      text := NULLIF(p_entity->>'status','');
  v_tags text[] := (
    SELECT CASE WHEN COUNT(*)=0 THEN NULL ELSE array_agg(value::text)::text[] END
    FROM jsonb_array_elements_text(coalesce(p_entity->'tags','[]'::jsonb))
  );
  v_smc_status  text := NULLIF(p_entity->>'smart_code_status','');
  v_business    jsonb := coalesce(p_entity->'business_rules','{}'::jsonb);
  v_metadata    jsonb := coalesce(p_entity->'metadata','{}'::jsonb);
  v_ai_conf     numeric := NULLIF(p_entity->>'ai_confidence','')::numeric;
  v_ai_class    text := NULLIF(p_entity->>'ai_classification','');
  v_ai_insights jsonb := coalesce(p_entity->'ai_insights','{}'::jsonb);

  -- Platform identity flags
  v_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_is_platform_org boolean := false;
  v_is_service_role boolean := false;
  v_is_platform_identity_write boolean := false;

  -- Work vars
  v_entity_id uuid;
  v_entity jsonb := '{}'::jsonb;
  v_dynamic_arr jsonb := '[]'::jsonb;
  v_rels_arr jsonb := '[]'::jsonb;
  v_err_context text;
  v_effective_actor uuid := NULL;

  -- loop helpers
  v_keys text[];
  v_rel_types text[];
  k text;
  t_to uuid;
  v_rel_smart text;

  -- fallback flags
  v_is_create boolean := false;
  v_upsert_err text;
BEGIN
  -- Guardrails
  IF v_action NOT IN ('CREATE','READ','UPDATE','DELETE') THEN
    RAISE EXCEPTION 'HERA_INVALID_ACTION:%', p_action;
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'HERA_ORG_REQUIRED';
  END IF;

  -- Platform identity routing
  v_is_platform_org := (p_organization_id = v_platform_org);
  v_is_service_role := coalesce(current_setting('request.jwt.claim.role', true),'') = 'service_role';
  v_is_platform_identity_write :=
    v_is_platform_org AND v_action IN ('CREATE','UPDATE','DELETE')
    AND (coalesce(v_entity_type, p_entity->>'entity_type') IN ('USER','ROLE') OR v_is_service_role)
    AND (v_allow_platform_identity OR v_is_service_role);

  IF v_is_platform_org AND v_action IN ('CREATE','UPDATE','DELETE') AND NOT v_is_platform_identity_write THEN
    RAISE EXCEPTION 'HERA_PLATFORM_ORG_WRITE_FORBIDDEN';
  END IF;

  -- Actor & membership
  IF v_action IN ('CREATE','UPDATE','DELETE') THEN
    IF p_actor_user_id IS NULL AND NOT v_is_platform_identity_write THEN
      RAISE EXCEPTION 'HERA_ACTOR_REQUIRED';
    END IF;
    IF NOT v_is_platform_identity_write THEN
      IF NOT EXISTS (
        SELECT 1 FROM core_relationships
         WHERE organization_id = p_organization_id
           AND from_entity_id  = p_actor_user_id
           AND to_entity_id    = p_organization_id
           AND relationship_type = 'MEMBER_OF'
           AND is_active = true
      ) THEN
        RAISE EXCEPTION 'HERA_ACTOR_NOT_MEMBER';
      END IF;
    END IF;
  END IF;

  -- ✅ FIXED: smart_code normalization + strict validation
  IF v_action IN ('CREATE','UPDATE') AND v_smart_code IS NOT NULL THEN
    v_smart_code := regexp_replace(v_smart_code, '\.[Vv]([0-9]+)', '.v\1');
    IF NOT (v_smart_code ~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+') THEN
      RAISE EXCEPTION 'HERA_SMARTCODE_INVALID:%', v_smart_code;
    END IF;
  END IF;

  -- Dynamic field validation: each item requires smart_code
  IF v_action IN ('CREATE','UPDATE')
     AND jsonb_typeof(p_dynamic)='object'
     AND EXISTS (SELECT 1 FROM jsonb_object_keys(p_dynamic) LIMIT 1)
  THEN
    SELECT array_agg(key) INTO v_keys
    FROM jsonb_object_keys(p_dynamic) AS t(key);
    IF v_keys IS NOT NULL THEN
      FOREACH k IN ARRAY v_keys LOOP
        IF NULLIF((p_dynamic->k)->>'smart_code','') IS NULL THEN
          RAISE EXCEPTION 'HERA_DYN_SMARTCODE_REQUIRED: field "%" requires smart_code', k;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- Effective actor & audit GUCs
  IF v_action IN ('CREATE','UPDATE','DELETE') THEN
    v_effective_actor := coalesce(p_actor_user_id, v_system_actor_user_id);
    IF v_effective_actor IS NULL THEN
      RAISE EXCEPTION 'HERA_EFFECTIVE_ACTOR_REQUIRED';
    END IF;

    PERFORM set_config('app.actor_user_id',   v_effective_actor::text, true);
    PERFORM set_config('app.organization_id', p_organization_id::text, true);
    PERFORM set_config('app.user_id',         v_effective_actor::text, true);
    PERFORM set_config('app.created_by',      v_effective_actor::text, true);
    PERFORM set_config('app.updated_by',      v_effective_actor::text, true);
    PERFORM set_config('app.org_id',          p_organization_id::text, true);
    PERFORM set_config('request.jwt.claim.sub', v_effective_actor::text, true);
  END IF;

  -- CREATE / UPDATE (header first)
  IF v_action IN ('CREATE','UPDATE') THEN
    v_is_create := (v_action='CREATE');
    IF v_is_create AND (v_entity_type IS NULL OR v_entity_name IS NULL OR v_smart_code IS NULL) THEN
      RAISE EXCEPTION 'HERA_MISSING_FIELDS';
    END IF;
    IF NOT v_is_create AND (p_entity->>'entity_id') IS NULL THEN
      RAISE EXCEPTION 'HERA_MISSING_ENTITY_ID';
    END IF;

    v_entity_id := NULLIF(p_entity->>'entity_id','')::uuid;

    BEGIN
      v_entity_id := NULLIF(
        public.hera_entity_upsert_v1(
          p_organization_id,
          v_entity_type,
          v_entity_name,
          v_smart_code,
          v_entity_id,
          v_entity_code,
          v_entity_desc,
          v_parent_id,
          v_status,
          v_tags,
          v_smc_status,
          v_business,
          v_metadata,
          v_ai_conf,
          v_ai_class,
          v_ai_insights,
          v_effective_actor
        ), ''
      )::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        v_upsert_err := SQLERRM;
        IF v_is_create THEN
          INSERT INTO core_entities (
            id,organization_id,entity_type,entity_name,entity_code,
            entity_description,parent_entity_id,smart_code,smart_code_status,
            ai_confidence,ai_classification,ai_insights,business_rules,metadata,
            tags,status,created_at,updated_at,created_by,updated_by
          )
          VALUES (
            gen_random_uuid(),p_organization_id,v_entity_type,v_entity_name,v_entity_code,
            v_entity_desc,v_parent_id,v_smart_code,coalesce(v_smc_status,'DRAFT'),
            coalesce(v_ai_conf,0),v_ai_class,coalesce(v_ai_insights,'{}'::jsonb),
            coalesce(v_business,'{}'::jsonb),coalesce(v_metadata,'{}'::jsonb),
            v_tags,coalesce(v_status,'active'),now(),now(),v_effective_actor,v_effective_actor
          )
          RETURNING id INTO v_entity_id;
        ELSE
          UPDATE core_entities
             SET entity_type        = coalesce(v_entity_type, entity_type),
                 entity_name        = coalesce(v_entity_name, entity_name),
                 entity_code        = coalesce(v_entity_code, entity_code),
                 entity_description = coalesce(v_entity_desc, entity_description),
                 parent_entity_id   = coalesce(v_parent_id, parent_entity_id),
                 smart_code         = coalesce(v_smart_code, smart_code),
                 smart_code_status  = coalesce(v_smc_status, smart_code_status),
                 ai_confidence      = coalesce(v_ai_conf, ai_confidence),
                 ai_classification  = coalesce(v_ai_class, ai_classification),
                 ai_insights        = coalesce(v_ai_insights, ai_insights),
                 business_rules     = coalesce(v_business, business_rules),
                 metadata           = coalesce(v_metadata, metadata),
                 tags               = coalesce(v_tags, tags),
                 status             = coalesce(v_status, status),
                 updated_at         = now(),
                 updated_by         = v_effective_actor
           WHERE organization_id = p_organization_id
             AND id = v_entity_id;
          IF NOT FOUND THEN
            RAISE EXCEPTION 'HERA_UPDATE_NOT_FOUND: entity_id % not found in org %', v_entity_id, p_organization_id;
          END IF;
        END IF;
    END;

    IF v_entity_id IS NULL THEN
      RAISE EXCEPTION 'HERA_ENTITY_ID_MISSING_POST_HEADER';
    END IF;

    -- Dynamic batch
    IF jsonb_typeof(p_dynamic)='object' AND EXISTS (SELECT 1 FROM jsonb_object_keys(p_dynamic) LIMIT 1) THEN
      DECLARE items jsonb := '[]'::jsonb; field jsonb; ftype text; fsmart text;
              sval text; nval numeric; bval boolean; dval timestamptz;
      BEGIN
        SELECT array_agg(key) INTO v_keys FROM jsonb_object_keys(p_dynamic) AS t(key);
        IF v_keys IS NOT NULL THEN
          FOREACH k IN ARRAY v_keys LOOP
            field := p_dynamic->k;
            ftype := coalesce(field->>'type','text');
            fsmart := NULLIF(field->>'smart_code','');
            sval := NULL; nval := NULL; bval := NULL; dval := NULL;
            IF ftype='number'     THEN nval := NULLIF(field->>'value','')::numeric;
            ELSIF ftype='boolean' THEN bval := (field->>'value')::boolean;
            ELSIF ftype='date'    THEN dval := (field->>'value')::timestamptz;
            ELSIF ftype='json'    THEN NULL;
            ELSE sval := NULLIF(field->>'value','');
            END IF;
            items := items || jsonb_build_array(
              jsonb_build_object(
                'field_name', k, 'field_type', ftype,
                'field_value_text', sval, 'field_value_number', nval,
                'field_value_boolean', bval, 'field_value_date', dval,
                'field_value_json', CASE WHEN ftype='json' THEN field->'value' ELSE NULL END,
                'smart_code', fsmart
              )
            );
          END LOOP;

          PERFORM public.hera_dynamic_data_batch_v1(
            p_organization_id, v_entity_id, items, v_effective_actor
          );
        END IF;
      END;
    END IF;

    -- Relationships (uses per-type map + explicit override)
    IF jsonb_typeof(p_relationships)='object' AND EXISTS (SELECT 1 FROM jsonb_object_keys(p_relationships) LIMIT 1)
THEN
      SELECT array_agg(key) INTO v_rel_types FROM jsonb_object_keys(p_relationships) AS t(key);
      IF v_rel_types IS NOT NULL THEN
        FOREACH k IN ARRAY v_rel_types LOOP
          v_rel_smart := public.hera_resolve_relationship_smartcode(
                            v_entity_type, k, v_rel_smart_map, v_relationship_smart_code);

          IF v_relationships_mode='UPSERT' THEN
            FOR t_to IN SELECT value::uuid FROM jsonb_array_elements_text(coalesce(p_relationships->k,'[]'::jsonb))
            LOOP
              PERFORM public.hera_relationship_upsert_v1(
                p_organization_id, v_entity_id, t_to, k,
                v_rel_smart,
                'forward', 1.0,
                '{}'::jsonb, 'DRAFT', 0.0, NULL,
                '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
                true, now(), NULL, v_effective_actor
              );
            END LOOP;
          ELSE
            -- REPLACE: remove all then add targets with resolved smart_code
            DELETE FROM core_relationships
             WHERE organization_id=p_organization_id
               AND from_entity_id=v_entity_id
               AND relationship_type=k;

            FOR t_to IN SELECT value::uuid FROM jsonb_array_elements_text(coalesce(p_relationships->k,'[]'::jsonb))
            LOOP
              PERFORM public.hera_relationship_upsert_v1(
                p_organization_id, v_entity_id, t_to, k,
                v_rel_smart,
                'forward', 1.0,
                '{}'::jsonb, 'DRAFT', 0.0, NULL,
                '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
                true, now(), NULL, v_effective_actor
              );
            END LOOP;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END IF; -- CREATE/UPDATE

  -- DELETE
  IF v_action='DELETE' THEN
    v_entity_id := NULLIF(p_entity->>'entity_id','')::uuid;
    IF v_entity_id IS NULL THEN RAISE EXCEPTION 'HERA_MISSING_ENTITY_ID'; END IF;
    PERFORM public.hera_entity_delete_v1(p_organization_id,v_entity_id,true,true);
    RETURN jsonb_build_object('success',true,'action','DELETE','entity_id',v_entity_id,
      'data',jsonb_build_object('deleted_at',now()));
  END IF;

  -- READ LIST (no entity_id): HEADERS or FULL (LATERAL, no GROUP BY)
  IF v_action='READ' AND (p_entity->>'entity_id') IS NULL THEN
    IF v_list_mode = 'HEADERS' THEN
      RETURN jsonb_build_object(
        'success', true, 'action', 'READ',
        'data', jsonb_build_object(
          'items', coalesce((
            SELECT jsonb_agg(row_to_json(t))
            FROM (
              SELECT id, entity_type, entity_name, entity_code, smart_code, status, created_at, updated_at
              FROM core_entities
              WHERE organization_id = p_organization_id
                AND (v_entity_type IS NULL OR entity_type = v_entity_type)
                AND (v_status IS NULL OR status = v_status)
              ORDER BY updated_at DESC
              LIMIT v_limit OFFSET v_offset
            ) t
          ), '[]'::jsonb)
        )
      );
    ELSE
      RETURN jsonb_build_object(
        'success', true, 'action', 'READ',
        'data', jsonb_build_object(
          'items', coalesce((
            WITH base AS (
              SELECT *
              FROM core_entities ce
              WHERE ce.organization_id = p_organization_id
                AND (v_entity_type IS NULL OR ce.entity_type = v_entity_type)
                AND (v_status IS NULL OR ce.status = v_status)
              ORDER BY ce.updated_at DESC
              LIMIT v_limit OFFSET v_offset
            )
            SELECT jsonb_agg(
                     jsonb_build_object(
                       'entity', to_jsonb(b),
                       'dynamic_data',
                          CASE WHEN v_include_dyn THEN coalesce(d.dyn,'[]'::jsonb) ELSE '[]'::jsonb END,
                       'relationships',
                          CASE WHEN v_include_rel THEN coalesce(r.rels,'[]'::jsonb) ELSE '[]'::jsonb END
                     )
                   )
            FROM base b
            LEFT JOIN LATERAL (
              SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.field_order NULLS LAST) AS dyn
              FROM core_dynamic_data d
              WHERE d.organization_id = b.organization_id
                AND d.entity_id       = b.id
            ) d ON true
            LEFT JOIN LATERAL (
              SELECT jsonb_agg(
                       jsonb_build_object(
                         'relationship_id',   r.id,
                         'relationship_type', r.relationship_type,
                         'from_entity_id',    r.from_entity_id,
                         'to_entity_id',      r.to_entity_id,
                         'smart_code',        r.smart_code,
                         'is_active',         r.is_active,
                         'effective_date',    r.effective_date,
                         'expiration_date',   r.expiration_date
                       )
                       ORDER BY r.relationship_type, r.to_entity_id
                     ) AS rels
              FROM core_relationships r
              WHERE r.organization_id = b.organization_id
                AND r.from_entity_id  = b.id
                AND r.is_active       = true
            ) r ON true
          ), '[]'::jsonb)
        )
      );
    END IF;
  END IF;

  -- Canonical single read (READ-by-id or post CREATE/UPDATE)
  IF v_action = 'READ' AND v_entity_id IS NULL THEN
    v_entity_id := NULLIF(p_entity->>'entity_id','')::uuid;
  END IF;

  -- Header
  SELECT to_jsonb(ce.*) INTO v_entity
  FROM core_entities ce
  WHERE ce.organization_id = p_organization_id
    AND ce.id              = v_entity_id;

  -- Dynamic
  IF v_include_dyn THEN
    SELECT coalesce(jsonb_agg(to_jsonb(d.*) ORDER BY d.field_order NULLS LAST), '[]'::jsonb)
      INTO v_dynamic_arr
    FROM core_dynamic_data d
    WHERE d.organization_id = p_organization_id
      AND d.entity_id       = v_entity_id;
  END IF;

  -- Relationships
  IF v_include_rel THEN
    SELECT coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'relationship_id',   r.id,
                 'relationship_type', r.relationship_type,
                 'from_entity_id',    r.from_entity_id,
                 'to_entity_id',      r.to_entity_id,
                 'smart_code',        r.smart_code,
                 'is_active',         r.is_active,
                 'effective_date',    r.effective_date,
                 'expiration_date',   r.expiration_date
               )
               ORDER BY r.relationship_type, r.to_entity_id
             ),
             '[]'::jsonb
           )
      INTO v_rels_arr
    FROM core_relationships r
    WHERE r.organization_id = p_organization_id
      AND r.from_entity_id  = v_entity_id
      AND r.is_active       = true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action',  v_action,
    'entity_id', v_entity_id,
    'data', jsonb_build_object(
      'entity',        coalesce(v_entity, '{}'::jsonb),
      'dynamic_data',  CASE WHEN v_include_dyn THEN v_dynamic_arr ELSE '[]'::jsonb END,
      'relationships', CASE WHEN v_include_rel THEN v_rels_arr ELSE '[]'::jsonb END
    )
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err_context = PG_EXCEPTION_CONTEXT;
  RETURN jsonb_build_object(
    'success', false,
    'action', v_action,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'context', v_err_context
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.hera_entities_crud_v1(
  text,uuid,uuid,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_entities_crud_v1(
  text,uuid,uuid,jsonb,jsonb,jsonb,jsonb) TO authenticated, service_role;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
