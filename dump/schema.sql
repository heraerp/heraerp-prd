

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."event_outbox_status" AS ENUM (
    'pending',
    'processing',
    'retry',
    'sent',
    'failed'
);


ALTER TYPE "public"."event_outbox_status" OWNER TO "postgres";


CREATE DOMAIN "public"."smart_code_type" AS character varying(100)
	CONSTRAINT "smart_code_type_check" CHECK ((("length"((VALUE)::"text") >= 5) AND ("length"((VALUE)::"text") <= 100)));


ALTER DOMAIN "public"."smart_code_type" OWNER TO "postgres";


CREATE DOMAIN "public"."status_type" AS "text"
	CONSTRAINT "status_type_check" CHECK ((VALUE = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'pending'::"text", 'draft'::"text", 'archived'::"text"])));


ALTER DOMAIN "public"."status_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_org         uuid;
  v_series_code text;
  v_smart_code  text;
  v_dyn_tbl     regclass := public._dyn_fields_table();
  v_now         timestamptz := now();
BEGIN
  -- Get org and series smart_code from the parent entity
  SELECT organization_id, smart_code
    INTO v_org, v_series_code
  FROM public.core_entities
  WHERE id = p_entity_id;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Entity % not found in core_entities', p_entity_id;
  END IF;

  v_smart_code := COALESCE(p_smart_code, v_series_code, 'HERA.DYN.FIELD.v1');

  -- Try UPDATE first (covers multiple existing rows as well)
  EXECUTE format(
    'UPDATE %s
       SET field_type = $3,
           field_value_text = $4,
           field_value_number = $5,
           field_value_boolean = $6,
           smart_code = $7,
           updated_at = $8
     WHERE entity_id = $1 AND field_name = $2',
    v_dyn_tbl::text
  )
  USING p_entity_id, p_field_name, p_field_type, p_text, p_number, p_boolean, v_smart_code, v_now;

  IF NOT FOUND THEN
    -- Insert if no row existed
    EXECUTE format(
      'INSERT INTO %s
         (id, organization_id, entity_id, field_name, field_type,
          field_value_text, field_value_number, field_value_boolean,
          smart_code, created_at, updated_at)
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $9)',
      v_dyn_tbl::text
    )
    USING v_org, p_entity_id, p_field_name, p_field_type,
          p_text, p_number, p_boolean,
          v_smart_code, v_now;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text" DEFAULT NULL::"text", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_org         uuid;
  v_series_code text;
  v_smart_code  text;
  v_dyn_tbl     regclass := public._dyn_fields_table();
  v_now         timestamptz := now();
  v_actor       uuid;
BEGIN
  -- Get org and series smart_code from the parent entity
  SELECT organization_id, smart_code
    INTO v_org, v_series_code
  FROM public.core_entities
  WHERE id = p_entity_id;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Entity % not found in core_entities', p_entity_id;
  END IF;

  -- Resolve actor if not provided
  IF p_actor_user_id IS NULL THEN
    -- Try to get from session context
    BEGIN
      v_actor := (SELECT id FROM resolve_user_identity_v1());
    EXCEPTION WHEN OTHERS THEN
      -- Fallback: use the entity's creator (for system operations)
      SELECT created_by INTO v_actor FROM core_entities WHERE id = p_entity_id;
    END;
  ELSE
    v_actor := p_actor_user_id;
  END IF;

  v_smart_code := COALESCE(p_smart_code, v_series_code, 'HERA.DYN.FIELD.v1');

  -- Try UPDATE first (covers multiple existing rows as well)
  EXECUTE format(
    'UPDATE %s
       SET field_type = $3,
           field_value_text = $4,
           field_value_number = $5,
           field_value_boolean = $6,
           smart_code = $7,
           updated_at = $8,
           updated_by = $9
     WHERE entity_id = $1 AND field_name = $2',
    v_dyn_tbl::text
  )
  USING p_entity_id, p_field_name, p_field_type, p_text, p_number, p_boolean, 
        v_smart_code, v_now, v_actor;

  IF NOT FOUND THEN
    -- Insert if no row existed
    EXECUTE format(
      'INSERT INTO %s
         (id, organization_id, entity_id, field_name, field_type,
          field_value_text, field_value_number, field_value_boolean,
          smart_code, created_at, updated_at, created_by, updated_by)
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $9, $10, $10)',
      v_dyn_tbl::text
    )
    USING v_org, p_entity_id, p_field_name, p_field_type,
          p_text, p_number, p_boolean,
          v_smart_code, v_now, v_actor;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_dyn_fields_table"() RETURNS "regclass"
    LANGUAGE "sql" STABLE
    AS $$ SELECT 'public.core_dynamic_data'::regclass $$;


ALTER FUNCTION "public"."_dyn_fields_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_hera_resolve_org_role"("p_actor_user_id" "uuid", "p_organization_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  WITH role_edges AS (
    SELECT
      COALESCE((cr.relationship_data->>'role_code')::text, ce.entity_code) AS role_code,
      COALESCE((cr.relationship_data->>'is_primary')::boolean, false)      AS is_primary
    FROM public.core_relationships cr
    LEFT JOIN public.core_entities ce
      ON ce.id = cr.to_entity_id
     AND ce.entity_type = 'ROLE'
    WHERE cr.organization_id   = p_organization_id
      AND cr.from_entity_id    = p_actor_user_id
      AND cr.relationship_type = 'HAS_ROLE'
      AND COALESCE(cr.is_active, true)
  ),
  primary_or_precedence AS (
    SELECT role_code
    FROM role_edges
    ORDER BY
      -- 1) explicit primary first
      is_primary DESC,
      -- 2) precedence using shared rank function (lower = higher priority)
      public._hera_role_rank(role_code) NULLS LAST,
      -- 3) tie-breaker for custom roles (alphabetical)
      role_code
    LIMIT 1
  )
  SELECT COALESCE(
    -- Strategy 1: Prefer HAS_ROLE (primary or highest precedence)
    (SELECT role_code FROM primary_or_precedence),

    -- Strategy 2: Fallback to MEMBER_OF.relationship_data.role (most recent)
    (SELECT (cr.relationship_data->>'role')::text
       FROM public.core_relationships cr
      WHERE cr.organization_id   = p_organization_id
        AND cr.from_entity_id    = p_actor_user_id
        AND cr.relationship_type = 'MEMBER_OF'
        AND COALESCE(cr.is_active, true)
      ORDER BY cr.updated_at DESC
      LIMIT 1),

    -- Strategy 3: Safe default if no roles found
    'MEMBER'::text
  );
$$;


ALTER FUNCTION "public"."_hera_resolve_org_role"("p_actor_user_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."_hera_resolve_org_role"("p_actor_user_id" "uuid", "p_organization_id" "uuid") IS 'Resolves effective org role: (1) primary HAS_ROLE, (2) highest precedence HAS_ROLE, (3) newest MEMBER_OF fallback, (4) default "MEMBER".';



CREATE OR REPLACE FUNCTION "public"."_hera_role_rank"("p_code" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select coalesce(
    array_position(
      array['ORG_OWNER','ORG_ADMIN','ORG_MANAGER','ORG_ACCOUNTANT','ORG_EMPLOYEE','MEMBER'],
      upper(p_code)
    ),
    999  -- unknown/custom roles are lowest precedence
  );
$$;


ALTER FUNCTION "public"."_hera_role_rank"("p_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."_hera_role_rank"("p_code" "text") IS 'Returns precedence rank for a role code (lower is higher precedence).';



CREATE OR REPLACE FUNCTION "public"."_hera_sc_build"("p_segments" "text"[], "p_version" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
DECLARE
  v_seg  text;
  v_norm text[] := '{}';
  v_sc   text;
BEGIN
  -- Validate inputs
  IF p_segments IS NULL OR array_length(p_segments, 1) IS NULL THEN
    RAISE EXCEPTION '_hera_sc_build: segments required';
  END IF;

  IF p_version IS NULL OR p_version < 1 THEN
    RAISE EXCEPTION '_hera_sc_build: version must be >= 1';
  END IF;

  -- Normalize and validate each segment
  FOREACH v_seg IN ARRAY p_segments LOOP
    IF v_seg IS NULL OR btrim(v_seg) = '' OR upper(v_seg) !~ '^[A-Z0-9]+$' THEN
      RAISE EXCEPTION '_hera_sc_build: invalid segment "%"', v_seg;
    END IF;
    v_norm := v_norm || upper(v_seg);
  END LOOP;

  -- Ensure minimum segment count
  IF array_length(v_norm, 1) < 6 THEN
    RAISE EXCEPTION '_hera_sc_build: need at least 6 segments (got %)', array_length(v_norm, 1);
  END IF;

  -- Build smart code
  v_sc := array_to_string(v_norm, '.') || '.v' || p_version::text;

  -- Final format validation
  IF v_sc !~ '^HERA(?:\.[A-Z0-9]+){5,}\.v[0-9]+$' THEN
    RAISE EXCEPTION '_hera_sc_build: smart_code violates format: %', v_sc;
  END IF;

  RETURN v_sc;
END
$_$;


ALTER FUNCTION "public"."_hera_sc_build"("p_segments" "text"[], "p_version" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."_hera_sc_build"("p_segments" "text"[], "p_version" integer) IS 'Build HERA smart_code from validated segments. Rules: dot-separated, >=6 segments, UPPERCASE segments, version suffix v<digit> (e.g., HERA.UNIVERSAL.ENTITY.ROLE.CANONICAL.v1).';



CREATE OR REPLACE FUNCTION "public"."_vf_bool"("js" "jsonb", "key" "text", "def" boolean) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$ SELECT COALESCE((js->>key)::bool, def) $$;


ALTER FUNCTION "public"."_vf_bool"("js" "jsonb", "key" "text", "def" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_vf_errs_concat"("errs" "jsonb", "new_err" "text") RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    AS $$ SELECT COALESCE(errs,'[]'::jsonb) || to_jsonb(new_err) $$;


ALTER FUNCTION "public"."_vf_errs_concat"("errs" "jsonb", "new_err" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_vf_regex_ok"("val" "text", "pattern" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$ SELECT CASE WHEN val IS NULL OR pattern IS NULL THEN true ELSE val ~ pattern END $$;


ALTER FUNCTION "public"."_vf_regex_ok"("val" "text", "pattern" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_vf_scale_ok"("val" numeric, "max_scale" integer) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT CASE WHEN val IS NULL THEN true
              ELSE COALESCE(length(split_part(val::text,'.',2)) <= max_scale, true)
         END
$$;


ALTER FUNCTION "public"."_vf_scale_ok"("val" numeric, "max_scale" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_vf_textarr"("js" "jsonb", "key" "text") RETURNS "text"[]
    LANGUAGE "sql" IMMUTABLE
    AS $$ SELECT COALESCE(ARRAY_AGG(value::text), ARRAY[]::text[]) FROM jsonb_array_elements_text(COALESCE(js->key,'[]'::jsonb)) $$;


ALTER FUNCTION "public"."_vf_textarr"("js" "jsonb", "key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_tx_create_with_org"("p_org_id" "uuid", "p_tx_type" "text", "p_tx_code" "text", "p_smart_code" "text", "p_source_code" "text" DEFAULT NULL::"text", "p_target_code" "text" DEFAULT NULL::"text", "p_total_amount" numeric DEFAULT 0, "p_currency" character DEFAULT NULL::"bpchar", "p_business_context" "jsonb" DEFAULT '{}'::"jsonb", "p_transaction_date" timestamp with time zone DEFAULT "now"()) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM hera_resolve_org(p_org_id);
  RETURN api_tx_create(p_tx_type, p_tx_code, p_smart_code,
                       p_source_code, p_target_code,
                       p_total_amount, p_currency, p_business_context, p_transaction_date);
END $$;


ALTER FUNCTION "public"."api_tx_create_with_org"("p_org_id" "uuid", "p_tx_type" "text", "p_tx_code" "text", "p_smart_code" "text", "p_source_code" "text", "p_target_code" "text", "p_total_amount" numeric, "p_currency" character, "p_business_context" "jsonb", "p_transaction_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_tx_line_set_with_org"("p_org_id" "uuid", "p_tx_code" "text", "p_line_number" integer, "p_line_type" "text", "p_smart_code" "text", "p_entity_code" "text" DEFAULT NULL::"text", "p_quantity" numeric DEFAULT 1, "p_unit_amount" numeric DEFAULT 0, "p_line_amount" numeric DEFAULT 0, "p_line_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM hera_resolve_org(p_org_id);
  PERFORM api_tx_line_set(p_tx_code, p_line_number, p_line_type, p_entity_code,
                          p_quantity, p_unit_amount, p_line_amount, p_smart_code, p_line_data);
END $$;


ALTER FUNCTION "public"."api_tx_line_set_with_org"("p_org_id" "uuid", "p_tx_code" "text", "p_line_number" integer, "p_line_type" "text", "p_smart_code" "text", "p_entity_code" "text", "p_quantity" numeric, "p_unit_amount" numeric, "p_line_amount" numeric, "p_line_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'organization_id')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
$$;


ALTER FUNCTION "public"."auth_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_user_entity_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'entity_id')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'entity_id')::uuid
  );
$$;


ALTER FUNCTION "public"."auth_user_entity_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_actor_non_null"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN
      RAISE EXCEPTION 'created_by cannot be NULL (actor required)';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.updated_by IS NULL THEN
      RAISE EXCEPTION 'updated_by cannot be NULL (actor required)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_actor_non_null"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_subdomain_availability"("p_subdomain" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_exists BOOLEAN;
    v_reserved_subdomains TEXT[] := ARRAY[
        'app','api','www','admin','dashboard','auth','login',
        'signup','demo','test','staging','production'
    ];
BEGIN
    IF p_subdomain = ANY(v_reserved_subdomains) THEN
        RETURN jsonb_build_object('available', false, 'reason', 'reserved');
    END IF;

    SELECT EXISTS(
        SELECT 1
        FROM core_entities
        WHERE entity_type = 'organization'
          AND metadata->>'subdomain' = p_subdomain
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object('available', false, 'reason', 'taken');
    ELSE
        RETURN jsonb_build_object('available', true, 'subdomain', p_subdomain);
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_subdomain_availability"("p_subdomain" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_add_dynamic_field"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value" "text" DEFAULT NULL::"text", "p_field_number" numeric DEFAULT NULL::numeric, "p_field_boolean" boolean DEFAULT NULL::boolean, "p_field_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_field_json" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_field_id UUID;
  v_organization_id UUID;
  v_smart_code TEXT;
BEGIN
  SELECT organization_id INTO v_organization_id
  FROM core_entities WHERE id = p_entity_id;
  
  v_smart_code := 'HERA.FIELD.' || UPPER(REPLACE(p_field_name, ' ', '.')) || '.v1';
  
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type,
    field_value_text, field_value_number, field_value_boolean, 
    field_value_date, field_value_json, smart_code
  ) VALUES (
    v_organization_id, p_entity_id, p_field_name, p_field_type,
    p_field_value, p_field_number, p_field_boolean,
    p_field_date, p_field_json, v_smart_code
  ) RETURNING id INTO v_field_id;
  
  RETURN v_field_id;
END;
$$;


ALTER FUNCTION "public"."claude_add_dynamic_field"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value" "text", "p_field_number" numeric, "p_field_boolean" boolean, "p_field_date" timestamp with time zone, "p_field_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_check_mvp_completeness"("p_application_description" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    mvp_checklist JSONB;
    missing_components JSONB DEFAULT '[]'::JSONB;
    enhancement_suggestions JSONB DEFAULT '[]'::JSONB;
    completeness_score INTEGER DEFAULT 0;
    total_requirements INTEGER DEFAULT 9;
BEGIN
    -- Define MVP checklist
    mvp_checklist := jsonb_build_object(
        'shell_bar_global_search', false,
        'dynamic_page_kpi_header', false,
        'filter_bar_presets', false,
        'responsive_table_full_features', false,
        'value_help_inputs', false,
        'micro_charts_kpis', false,
        'object_page_sections', false,
        'message_handling_system', false,
        'fcl_navigation', false
    );
    
    -- Check application description for MVP requirements
    -- Shell Bar with Global Search
    IF p_application_description ILIKE '%shell bar%' OR 
       p_application_description ILIKE '%global search%' OR
       p_application_description ILIKE '%navigation bar%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{shell_bar_global_search}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Shell Bar with Global Search',
            'smart_code', 'HERA.UI.SHELL.BAR.ENHANCED.v2',
            'priority', 'HIGH'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add shell bar with global search for better user navigation',
            'implementation', 'Use HERA.UI.SHELL.BAR.ENHANCED.v2 DNA pattern'
        );
    END IF;

    -- Dynamic Page with KPI Header
    IF p_application_description ILIKE '%dashboard%' OR 
       p_application_description ILIKE '%kpi%' OR
       p_application_description ILIKE '%analytics%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{dynamic_page_kpi_header}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Dynamic Page with KPI Header',
            'smart_code', 'HERA.UI.PAGE.DYNAMIC.KPI.v2',
            'priority', 'HIGH'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add KPI header for key metrics visibility',
            'implementation', 'Use HERA.UI.PAGE.DYNAMIC.KPI.v2 DNA pattern'
        );
    END IF;

    -- Filter Bar with Presets
    IF p_application_description ILIKE '%filter%' OR 
       p_application_description ILIKE '%search%' OR
       p_application_description ILIKE '%preset%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{filter_bar_presets}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Filter Bar with Presets',
            'smart_code', 'HERA.UI.FILTER.BAR.ADVANCED.v2',
            'priority', 'HIGH'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add advanced filtering capabilities with preset variants',
            'implementation', 'Use HERA.UI.FILTER.BAR.ADVANCED.v2 DNA pattern'
        );
    END IF;

    -- Responsive Table with Full Features
    IF p_application_description ILIKE '%table%' OR 
       p_application_description ILIKE '%list%' OR
       p_application_description ILIKE '%data grid%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{responsive_table_full_features}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Enterprise Responsive Table',
            'smart_code', 'HERA.UI.TABLE.ENTERPRISE.v2',
            'priority', 'HIGH'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add enterprise table with selection, sorting, and personalization',
            'implementation', 'Use HERA.UI.TABLE.ENTERPRISE.v2 DNA pattern'
        );
    END IF;

    -- Value Help on Key Inputs
    IF p_application_description ILIKE '%value help%' OR 
       p_application_description ILIKE '%dropdown%' OR
       p_application_description ILIKE '%lookup%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{value_help_inputs}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Smart Value Help Dialog',
            'smart_code', 'HERA.UI.VALUE.HELP.SMART.v2',
            'priority', 'MEDIUM'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add value help dialogs for key input fields',
            'implementation', 'Use HERA.UI.VALUE.HELP.SMART.v2 DNA pattern'
        );
    END IF;

    -- Micro Charts for KPIs
    IF p_application_description ILIKE '%chart%' OR 
       p_application_description ILIKE '%visualization%' OR
       p_application_description ILIKE '%micro chart%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{micro_charts_kpis}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Micro Charts in KPIs/Table Cells',
            'smart_code', 'HERA.UI.CHART.MICRO.v2',
            'priority', 'MEDIUM'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add micro charts for visual KPI representation',
            'implementation', 'Embed sparklines and trend indicators in table cells and KPIs'
        );
    END IF;

    -- Object Page with Sections
    IF p_application_description ILIKE '%detail%' OR 
       p_application_description ILIKE '%object page%' OR
       p_application_description ILIKE '%sections%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{object_page_sections}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Object Page with Sections',
            'smart_code', 'HERA.UI.OBJECT.PAGE.SECTIONED.v2',
            'priority', 'HIGH'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add object detail pages with info, items, attachments, and history sections',
            'implementation', 'Use HERA.UI.OBJECT.PAGE.SECTIONED.v2 DNA pattern'
        );
    END IF;

    -- Message Handling System
    IF p_application_description ILIKE '%message%' OR 
       p_application_description ILIKE '%toast%' OR
       p_application_description ILIKE '%notification%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{message_handling_system}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Enterprise Message System',
            'smart_code', 'HERA.UI.MESSAGE.SYSTEM.v2',
            'priority', 'HIGH'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Add comprehensive message handling for success/error feedback',
            'implementation', 'Use HERA.UI.MESSAGE.SYSTEM.v2 DNA pattern'
        );
    END IF;

    -- FCL Navigation
    IF p_application_description ILIKE '%fcl%' OR 
       p_application_description ILIKE '%flexible column%' OR
       p_application_description ILIKE '%seamless navigation%' THEN
        mvp_checklist := jsonb_set(mvp_checklist, '{fcl_navigation}', 'true');
        completeness_score := completeness_score + 1;
    ELSE
        missing_components := missing_components || jsonb_build_object(
            'component', 'Flexible Column Layout (FCL)',
            'smart_code', 'HERA.UI.FCL.LAYOUT.v2',
            'priority', 'LOW'
        );
        enhancement_suggestions := enhancement_suggestions || jsonb_build_object(
            'suggestion', 'Consider FCL for better navigation experience (optional)',
            'implementation', 'Use HERA.UI.FCL.LAYOUT.v2 DNA pattern'
        );
    END IF;

    -- Return comprehensive analysis
    RETURN jsonb_build_object(
        'mvp_checklist', mvp_checklist,
        'completeness_score', completeness_score,
        'total_requirements', total_requirements,
        'completeness_percentage', ROUND((completeness_score::DECIMAL / total_requirements) * 100),
        'missing_components', missing_components,
        'enhancement_suggestions', enhancement_suggestions,
        'mvp_status', CASE 
            WHEN completeness_score >= 7 THEN 'MVP_READY'
            WHEN completeness_score >= 5 THEN 'NEEDS_MINOR_ENHANCEMENTS'
            ELSE 'NEEDS_MAJOR_ENHANCEMENTS'
        END,
        'checked_at', NOW()
    );
END;
$$;


ALTER FUNCTION "public"."claude_check_mvp_completeness"("p_application_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_create_entity"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_entity_id UUID;
  v_smart_code TEXT;
BEGIN
  v_smart_code := 'HERA.' || UPPER(REPLACE(p_entity_type, '_', '.')) || '.' || 
                  UPPER(REPLACE(SPLIT_PART(p_entity_name, ' ', 1), ' ', '')) || '.v1';
  
  INSERT INTO core_entities (
    organization_id, entity_type, entity_name, entity_description, 
    smart_code, metadata
  ) VALUES (
    p_org_id, p_entity_type, p_entity_name, p_description,
    v_smart_code, p_metadata
  ) RETURNING id INTO v_entity_id;
  
  RETURN v_entity_id;
END;
$$;


ALTER FUNCTION "public"."claude_create_entity"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_create_transaction"("p_org_id" "uuid", "p_transaction_type" "text", "p_source_entity_id" "uuid" DEFAULT NULL::"uuid", "p_target_entity_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_transaction_id UUID;
  v_transaction_code TEXT;
  v_smart_code TEXT;
BEGIN
  v_transaction_code := 'TXN-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  v_smart_code := 'HERA.TRANSACTION.' || UPPER(REPLACE(p_transaction_type, '_', '.')) || '.v1';
  
  INSERT INTO universal_transactions (
    organization_id, transaction_type, transaction_code,
    source_entity_id, target_entity_id, smart_code, metadata
  ) VALUES (
    p_org_id, p_transaction_type, v_transaction_code,
    p_source_entity_id, p_target_entity_id, v_smart_code, p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;


ALTER FUNCTION "public"."claude_create_transaction"("p_org_id" "uuid", "p_transaction_type" "text", "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_enhance_application_dna"("p_application_description" "text", "p_target_completeness" integer DEFAULT 80) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    mvp_analysis JSONB;
    enhancement_plan JSONB DEFAULT '[]'::JSONB;
    current_completeness INTEGER;
    dna_org_id UUID;
BEGIN
    -- Get DNA organization
    SELECT id INTO dna_org_id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS';
    
    -- Check current MVP completeness
    mvp_analysis := claude_check_mvp_completeness(p_application_description);
    current_completeness := (mvp_analysis->>'completeness_percentage')::INTEGER;
    
    -- If already meets target, return current status
    IF current_completeness >= p_target_completeness THEN
        RETURN jsonb_build_object(
            'status', 'ALREADY_COMPLETE',
            'current_completeness', current_completeness,
            'target_completeness', p_target_completeness,
            'message', 'Application already meets MVP requirements',
            'analysis', mvp_analysis
        );
    END IF;
    
    -- Generate enhancement plan based on missing components
    SELECT jsonb_agg(
        jsonb_build_object(
            'component_name', comp->>'component',
            'smart_code', comp->>'smart_code',
            'priority', comp->>'priority',
            'implementation_dna', (
                SELECT jsonb_build_object(
                    'entity_name', e.entity_name,
                    'description', e.entity_description,
                    'metadata', e.metadata,
                    'implementation_guide', 
                    CASE 
                        WHEN e.smart_code LIKE '%SHELL.BAR%' THEN 'Add responsive shell bar with global search functionality'
                        WHEN e.smart_code LIKE '%PAGE.DYNAMIC%' THEN 'Implement collapsible KPI header with real-time data'
                        WHEN e.smart_code LIKE '%FILTER.BAR%' THEN 'Add advanced filtering with preset management'
                        WHEN e.smart_code LIKE '%TABLE.ENTERPRISE%' THEN 'Implement full-featured responsive table'
                        WHEN e.smart_code LIKE '%VALUE.HELP%' THEN 'Add smart value help for key input fields'
                        WHEN e.smart_code LIKE '%OBJECT.PAGE%' THEN 'Create sectioned object detail pages'
                        WHEN e.smart_code LIKE '%MESSAGE.SYSTEM%' THEN 'Implement comprehensive message handling'
                        WHEN e.smart_code LIKE '%FCL.LAYOUT%' THEN 'Add flexible column layout for better navigation'
                        ELSE 'Follow DNA pattern implementation guidelines'
                    END
                )
                FROM core_entities e 
                WHERE e.smart_code = comp->>'smart_code' 
                AND e.organization_id = dna_org_id
            )
        )
    ) INTO enhancement_plan
    FROM jsonb_array_elements(mvp_analysis->'missing_components') AS comp
    WHERE comp->>'priority' IN ('HIGH', 'MEDIUM');
    
    -- Return comprehensive enhancement plan
    RETURN jsonb_build_object(
        'status', 'ENHANCEMENT_PLAN_GENERATED',
        'current_completeness', current_completeness,
        'target_completeness', p_target_completeness,
        'enhancement_plan', enhancement_plan,
        'mvp_analysis', mvp_analysis,
        'next_steps', jsonb_build_array(
            'Review the enhancement plan components',
            'Implement high-priority DNA patterns first',
            'Use the provided smart codes to load component DNA',
            'Test each component for MVP compliance',
            'Re-run completeness check after implementation'
        ),
        'estimated_implementation_time', 
        CASE 
            WHEN jsonb_array_length(enhancement_plan) <= 3 THEN '2-4 hours'
            WHEN jsonb_array_length(enhancement_plan) <= 6 THEN '4-8 hours'
            ELSE '1-2 days'
        END,
        'generated_at', NOW()
    );
END;
$$;


ALTER FUNCTION "public"."claude_enhance_application_dna"("p_application_description" "text", "p_target_completeness" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_get_component_dna"("p_smart_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_component_dna JSONB := '{}'::jsonb;
  v_entity_info JSONB;
  v_dynamic_data JSONB;
BEGIN
  -- Get component entity info
  SELECT to_jsonb(e.*) INTO v_entity_info
  FROM core_entities e
  WHERE e.smart_code = p_smart_code;
  
  -- Get all dynamic data for component
  SELECT jsonb_object_agg(dd.field_name, 
    CASE 
      WHEN dd.field_value_json IS NOT NULL THEN dd.field_value_json
      WHEN dd.field_value_text IS NOT NULL THEN to_jsonb(dd.field_value_text)
      ELSE '{}'::jsonb
    END
  ) INTO v_dynamic_data
  FROM core_dynamic_data dd
  JOIN core_entities e ON dd.entity_id = e.id
  WHERE e.smart_code = p_smart_code;
  
  -- Combine into complete DNA
  v_component_dna := jsonb_build_object(
    'component', v_entity_info,
    'implementation', COALESCE(v_dynamic_data, '{}'::jsonb),
    'loaded_at', NOW()
  );
  
  RETURN v_component_dna;
END;
$$;


ALTER FUNCTION "public"."claude_get_component_dna"("p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claude_load_dna_context"("p_context_type" "text" DEFAULT 'complete'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_context JSONB := '{}'::jsonb;
  v_components JSONB;
  v_business_modules JSONB;
  v_design_systems JSONB;
BEGIN
  -- Load UI Component DNA
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', entity_name,
      'smart_code', smart_code,
      'type', metadata->>'component_type',
      'design_system', metadata->>'design_system'
    )
  ) INTO v_components
  FROM core_entities 
  WHERE entity_type = 'ui_component_dna' AND status = 'active';
  
  -- Load Business Module DNA  
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', entity_name,
      'smart_code', smart_code,
      'module_type', metadata->>'module_type',
      'universal', metadata->>'universal'
    )
  ) INTO v_business_modules
  FROM core_entities
  WHERE entity_type = 'business_module_dna' AND status = 'active';
  
  -- Load Design System DNA
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', entity_name,
      'smart_code', smart_code,
      'philosophy', metadata->>'design_philosophy'
    )
  ) INTO v_design_systems  
  FROM core_entities
  WHERE entity_type = 'design_system_dna' AND status = 'active';
  
  -- Combine into complete context
  v_context := jsonb_build_object(
    'ui_components', COALESCE(v_components, '[]'::jsonb),
    'business_modules', COALESCE(v_business_modules, '[]'::jsonb),
    'design_systems', COALESCE(v_design_systems, '[]'::jsonb),
    'loaded_at', NOW(),
    'context_type', p_context_type
  );
  
  RETURN v_context;
END;
$$;


ALTER FUNCTION "public"."claude_load_dna_context"("p_context_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_with_owner"("p_org_name" "text", "p_subdomain" "text", "p_owner_id" "uuid", "p_owner_email" "text", "p_owner_name" "text", "p_org_type" "text" DEFAULT 'general'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_org_id UUID;
    v_user_entity_id UUID;
    v_result JSONB;
BEGIN
    -- Generate the organization ID first
    v_org_id := gen_random_uuid();

    -- 1. FIRST create organization record in core_organizations
    INSERT INTO core_organizations (
        id, 
        organization_name, 
        organization_code,
        organization_type, 
        status, 
        settings, 
        created_at, 
        updated_at
    ) VALUES (
        v_org_id,
        p_org_name,
        'ORG-' || UPPER(p_subdomain),
        p_org_type,
        'active',
        jsonb_build_object(
            'subdomain', p_subdomain, 
            'owner_id', p_owner_id,
            'currency', 'USD',
            'timezone', 'UTC',
            'language', 'en'
        ),
        NOW(),
        NOW()
    );

    -- 2. THEN create organization entity (now the FK reference exists)
    INSERT INTO core_entities (
        id,
        organization_id,
        entity_type, 
        entity_name, 
        entity_code, 
        smart_code,
        metadata, 
        created_at, 
        updated_at
    ) VALUES (
        v_org_id,
        v_org_id,  -- Self-reference (now valid because org exists)
        'organization',
        p_org_name,
        'ORG-' || UPPER(p_subdomain),
        'HERA.ORG.ENTITY.' || UPPER(p_org_type) || '.v1',
        jsonb_build_object(
            'subdomain', p_subdomain,
            'organization_type', p_org_type,
            'subscription_plan', 'trial',
            'billing_status', 'active',
            'settings', jsonb_build_object(
                'currency', 'USD',
                'timezone', 'UTC',
                'language', 'en'
            )
        ),
        NOW(),
        NOW()
    );

    -- 3. Check if user entity already exists
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE entity_type = 'user'
      AND metadata->>'auth_user_id' = p_owner_id::TEXT
    LIMIT 1;

    IF v_user_entity_id IS NULL THEN
        -- Create user entity
        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type, 
            entity_name, 
            entity_code,
            smart_code,
            metadata, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_org_id,
            'user',
            p_owner_name,
            'USER-' || UPPER(SPLIT_PART(p_owner_email, '@', 1)),
            'HERA.ORG.USER.OWNER.v1',
            jsonb_build_object(
                'auth_user_id', p_owner_id,
                'email', p_owner_email,
                'role', 'owner'
            ),
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_entity_id;
    ELSE
        -- If user exists, update their organization_id
        UPDATE core_entities
        SET organization_id = v_org_id,
            updated_at = NOW()
        WHERE id = v_user_entity_id;
    END IF;

    -- 4. Create owner relationship
    INSERT INTO core_relationships (
        id, 
        organization_id, 
        from_entity_id, 
        to_entity_id, 
        relationship_type, 
        relationship_data,
        smart_code,
        is_active,
        created_at, 
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        v_user_entity_id,
        v_org_id,
        'member_of',
        jsonb_build_object(
            'role', 'owner',
            'permissions', jsonb_build_array('*'),
            'joined_at', NOW()
        ),
        'HERA.ORG.REL.MEMBER.OWNER.v1',
        true,
        NOW(),
        NOW()
    );

    -- 5. Dynamic fields for organization
    INSERT INTO core_dynamic_data (
        id, 
        organization_id, 
        entity_id, 
        field_name, 
        field_value_text, 
        smart_code, 
        created_at, 
        updated_at
    ) VALUES
        (gen_random_uuid(), v_org_id, v_org_id, 'subdomain',    p_subdomain,   'HERA.ORG.FIELD.SUBDOMAIN.v1',     NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_org_id, 'owner_email',  p_owner_email, 'HERA.ORG.FIELD.OWNER_EMAIL.v1',   NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_org_id, 'created_date', NOW()::TEXT,   'HERA.ORG.FIELD.CREATED_DATE.v1',  NOW(), NOW());

    -- 6. Result
    v_result := jsonb_build_object(
        'success', true,
        'organization', jsonb_build_object(
            'id', v_org_id,
            'name', p_org_name,
            'subdomain', p_subdomain,
            'type', p_org_type
        ),
        'user', jsonb_build_object(
            'id', v_user_entity_id,
            'auth_user_id', p_owner_id,
            'email', p_owner_email,
            'role', 'owner'
        )
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_organization_with_owner"("p_org_name" "text", "p_subdomain" "text", "p_owner_id" "uuid", "p_owner_email" "text", "p_owner_name" "text", "p_org_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_test_inventory"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    product_id uuid;
    result jsonb;
    products text[] := ARRAY[
        'Shampoo Anti-Dandruff',
        'Conditioner Moisturizing', 
        'Hair Spray Strong Hold',
        'Hair Oil Argan',
        'Hair Mask Protein'
    ];
    categories text[] := ARRAY[
        'hair_care',
        'hair_care',
        'styling',
        'treatment',
        'treatment'
    ];
    current_stocks numeric[] := ARRAY[15, 5, 0, 25, 8];
    min_stocks numeric[] := ARRAY[20, 10, 10, 15, 10];
    unit_costs numeric[] := ARRAY[25.50, 18.75, 12.99, 45.00, 35.25];
    i integer;
BEGIN
    -- Clear existing test data first
    DELETE FROM core_dynamic_data 
    WHERE organization_id = p_org_id 
    AND entity_id IN (
        SELECT id FROM core_entities 
        WHERE organization_id = p_org_id 
        AND entity_name LIKE '%Test%' 
        OR entity_name = ANY(products)
    );
    
    DELETE FROM core_entities 
    WHERE organization_id = p_org_id 
    AND (entity_name LIKE '%Test%' OR entity_name = ANY(products));

    -- Create test products
    FOR i IN 1..array_length(products, 1) LOOP
        -- Create product entity
        INSERT INTO core_entities (
            organization_id,
            entity_name,
            entity_code,
            entity_type,
            status,
            smart_code
        ) VALUES (
            p_org_id,
            products[i],
            'PROD' || LPAD(i::text, 3, '0'),
            'product',
            'active',
            'HERA.HLTH.INV.PROD.HC' || LPAD(i::text, 2, '0') || '.v1'
        ) RETURNING id INTO product_id;

        -- Add inventory dynamic data
        INSERT INTO core_dynamic_data (
            organization_id,
            entity_id,
            field_name,
            field_type,
            field_value_number,
            smart_code
        ) VALUES 
            (p_org_id, product_id, 'current_stock', 'number', current_stocks[i], 'HERA.HLTH.INV.FIELD.STOCK.v1'),
            (p_org_id, product_id, 'min_stock_level', 'number', min_stocks[i], 'HERA.HLTH.INV.FIELD.MIN.v1'),
            (p_org_id, product_id, 'unit_cost', 'number', unit_costs[i], 'HERA.HLTH.INV.FIELD.COST.v1');

        -- Add category
        INSERT INTO core_dynamic_data (
            organization_id,
            entity_id,
            field_name,
            field_type,
            field_value_text,
            smart_code
        ) VALUES 
            (p_org_id, product_id, 'category', 'text', categories[i], 'HERA.HLTH.INV.FIELD.CAT.v1');

    END LOOP;

    result := jsonb_build_object(
        'message', 'Test inventory data created successfully',
        'products_created', array_length(products, 1),
        'organization_id', p_org_id
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."create_test_inventory"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_org"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select nullif(auth.jwt()->>'organization_id','')::uuid;
$$;


ALTER FUNCTION "public"."current_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."doc_number_next"("p_org" "uuid", "p_smart_code" "text", "p_fiscal_year" integer, "p_period_code" "text") RETURNS TABLE("doc_no" "text", "series_id" "uuid", "seq" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  s record;
  reset_code text;
  key bigint;
  dyn_tbl regclass := public._dyn_fields_table();
  cur_reset text;
  new_seq bigint;
BEGIN
  IF dyn_tbl IS NULL THEN
    RAISE EXCEPTION 'No dynamic-data table found';
  END IF;

  SELECT * INTO s FROM public.doc_series_pick(p_org, p_smart_code);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No DOC_SERIES found for org % and smart_code %', p_org, p_smart_code;
  END IF;

  -- compute reset scope code
  reset_code := CASE s.reset
                  WHEN 'FY'     THEN COALESCE(p_fiscal_year::text, 'FY?')
                  WHEN 'PERIOD' THEN COALESCE(p_period_code, 'PERIOD?')
                  ELSE 'NONE'
                END;

  -- lock series+reset_code to avoid duplicate numbers
  key := hashtextextended('DOC_SERIES:'||p_org::text||':'||s.series_id::text||':'||reset_code, 0);
  PERFORM pg_advisory_xact_lock(key);

  -- read current last_reset_code
  EXECUTE format(
    'SELECT MAX(field_value_text) FROM %s WHERE entity_id=$1 AND field_name=$2',
    dyn_tbl::text
  ) INTO cur_reset USING s.series_id, 'last_reset_code';

  IF cur_reset IS DISTINCT FROM reset_code THEN
    -- set/reset last_reset_code and zero next_number so the increment below becomes 1
    PERFORM public._dyn_field_upsert(s.series_id, 'last_reset_code', 'text', reset_code, NULL, NULL, NULL);
    PERFORM public._dyn_field_upsert(s.series_id, 'next_number',    'number', NULL, 0, NULL, NULL);
  END IF;

  -- atomically increment next_number and return new value
  EXECUTE format(
    'UPDATE %s
        SET field_value_number = COALESCE(field_value_number,0) + 1,
            updated_at = now()
      WHERE entity_id=$1 AND field_name=$2
      RETURNING field_value_number',
    dyn_tbl::text
  )
  INTO new_seq USING s.series_id, 'next_number';

  IF new_seq IS NULL THEN
    -- no existing row; seed as 1
    PERFORM public._dyn_field_upsert(s.series_id, 'next_number', 'number', NULL, 1, NULL, NULL);
    new_seq := 1;
  END IF;

  -- build document number
  doc_no := COALESCE(s.prefix,'') ||
            lpad(new_seq::text, GREATEST(s.width,1), '0') ||
            COALESCE(s.suffix,'');

  IF s.include_period AND p_period_code IS NOT NULL THEN
    doc_no := doc_no || '-' || p_period_code;
  END IF;

  series_id := s.series_id;
  seq := new_seq;
  RETURN NEXT;
END;
$_$;


ALTER FUNCTION "public"."doc_number_next"("p_org" "uuid", "p_smart_code" "text", "p_fiscal_year" integer, "p_period_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."doc_series_pick"("p_org" "uuid", "p_smart_code" "text") RETURNS TABLE("series_id" "uuid", "prefix" "text", "suffix" "text", "width" integer, "reset" "text", "include_period" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
WITH dyn AS (
  SELECT e.id,
         MAX(CASE WHEN f.field_name='smart_pattern'      THEN f.field_value_text   END) AS smart_pattern,
         MAX(CASE WHEN f.field_name='prefix'             THEN f.field_value_text   END) AS prefix,
         MAX(CASE WHEN f.field_name='suffix'             THEN f.field_value_text   END) AS suffix,
         MAX(CASE WHEN f.field_name='width'              THEN f.field_value_number END)::int AS width,
         COALESCE(MAX(CASE WHEN f.field_name='reset'     THEN f.field_value_text   END),'NONE') AS reset,
         -- FIX: use bool_or instead of max(boolean)
         COALESCE(
           bool_or( (f.field_name='include_period_code') AND COALESCE(f.field_value_boolean,false) ),
           false
         ) AS include_period
  FROM public.core_entities e
  JOIN public.core_dynamic_data f ON f.entity_id = e.id
  WHERE e.organization_id = p_org
    AND e.entity_type = 'DOC_SERIES'
  GROUP BY e.id
),
cand AS (
  SELECT id AS series_id, prefix, suffix, COALESCE(width, 6) AS width, reset, include_period,
         COALESCE(smart_pattern,'*') AS pat,
         CASE
           WHEN COALESCE(smart_pattern,'*') = p_smart_code THEN 100000
           ELSE 1000 - length(replace(COALESCE(smart_pattern,'*'), '*',''))
         END AS score,
         length(replace(COALESCE(smart_pattern,'*'), '*','')) AS literal_len,
         (
           '^' ||
           -- do 'v*' before generic '*'
           replace(
             replace(
               replace(COALESCE(smart_pattern,'*'), '.', '\.'),
               'v*', 'v[0-9]+'
             ),
             '*', '.*'
           )
           || '$'
         ) AS rx
  FROM dyn
)
SELECT series_id, prefix, suffix, width, upper(reset), include_period
FROM cand
WHERE p_smart_code ~ rx
ORDER BY score DESC, literal_len DESC, pat DESC
LIMIT 1;
$_$;


ALTER FUNCTION "public"."doc_series_pick"("p_org" "uuid", "p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_txn_type_upper"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.transaction_type := UPPER(NEW.transaction_type);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_txn_type_upper"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_book_appointment"("p_org_id" "uuid", "p_customer_id" "uuid" DEFAULT NULL::"uuid", "p_staff_id" "uuid" DEFAULT NULL::"uuid", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_service_ids" "uuid"[] DEFAULT NULL::"uuid"[], "p_start_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_appt_id uuid := gen_random_uuid();
  v_cust uuid;
  v_branch uuid;
  v_service uuid;
  v_price numeric;
  v_duration int;
  v_total numeric := 0;
  v_staff_name text;
  v_service_name text;
  v_line_id uuid;
  v_line_num int;
BEGIN
  -- Validate required parameters
  IF p_staff_id IS NULL THEN 
    RAISE EXCEPTION 'Staff is required'; 
  END IF;
  
  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No services provided';
  END IF;
  
  IF p_start_at IS NULL THEN 
    RAISE EXCEPTION 'start_at (timestamptz) is required'; 
  END IF;

  -- Set defaults for optional parameters
  v_cust := COALESCE(p_customer_id, fn_get_walkin_customer(p_org_id));
  v_branch := COALESCE(p_branch_id, fn_get_default_branch(p_org_id));

  -- Get staff name for metadata
  SELECT entity_name INTO v_staff_name
  FROM core_entities
  WHERE id = p_staff_id 
    AND organization_id = p_org_id 
    AND entity_type = 'staff';

  IF v_staff_name IS NULL THEN
    RAISE EXCEPTION 'Staff not found: %', p_staff_id;
  END IF;

  -- Create appointment transaction header
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, smart_code,
    transaction_date, source_entity_id, metadata
  ) VALUES (
    v_appt_id, p_org_id, 'APPOINTMENT', 
    'HERA.SALON.TRANSACTION.APPOINTMENT.BOOKING.v1',
    (p_start_at AT TIME ZONE 'UTC')::date,
    v_branch,
    jsonb_build_object(
      'customer_id',  v_cust,
      'branch_id',    v_branch,
      'staff_id',     p_staff_id,
      'stylist_name', v_staff_name,
      'start_at',     p_start_at,
      'status',       'booked',
      'note',         p_note
    )
  );

  -- Initialize line counter
  v_line_num := 0;

  -- Add service lines
  FOREACH v_service IN ARRAY p_service_ids LOOP
    -- Check if service is available at this branch
    IF NOT EXISTS (
      SELECT 1
      FROM core_dynamic_data d,
           LATERAL jsonb_array_elements_text(d.field_value_json->'branches') b(branch_id)
      WHERE d.organization_id = p_org_id
        AND d.entity_id = v_service
        AND d.field_name = 'available_at'
        AND b.branch_id = v_branch::text
    ) THEN
      RAISE EXCEPTION 'Service % not available at branch %', v_service, v_branch;
    END IF;

    -- Get service details (price, duration, name)
    SELECT
      COALESCE(price_data.field_value_number, 0)::numeric,
      COALESCE(duration_data.field_value_number, 0)::int,
      s.entity_name
    INTO v_price, v_duration, v_service_name
    FROM core_entities s
    LEFT JOIN core_dynamic_data price_data ON (
      price_data.entity_id = s.id 
      AND price_data.field_name = 'price.aed'
      AND price_data.organization_id = p_org_id
    )
    LEFT JOIN core_dynamic_data duration_data ON (
      duration_data.entity_id = s.id 
      AND duration_data.field_name = 'service.duration_minutes'
      AND duration_data.organization_id = p_org_id
    )
    WHERE s.id = v_service 
      AND s.organization_id = p_org_id 
      AND s.entity_type = 'service';

    IF v_service_name IS NULL THEN
      RAISE EXCEPTION 'Service not found: %', v_service;
    END IF;

    -- Accumulate total
    v_total := v_total + v_price;

    -- Increment line number
    v_line_num := v_line_num + 1;

    -- Generate line ID
    v_line_id := gen_random_uuid();

    -- Insert transaction line (minimal columns only)
    INSERT INTO universal_transaction_lines (
      id, organization_id, transaction_id, line_number, 
      line_type, entity_id, smart_code
    ) VALUES (
      v_line_id, p_org_id, v_appt_id, v_line_num,
      'SERVICE', v_service,
      'HERA.SALON.TRANSACTION.APPOINTMENT.LINE.SERVICE.v1'
    );

    -- Store line-level economics in core_dynamic_data
    -- Key it under the service entity to satisfy FK constraint
    INSERT INTO core_dynamic_data (
      id, organization_id, entity_id, field_name, 
      field_type, field_value_json, smart_code
    ) VALUES (
      gen_random_uuid(), p_org_id, v_service,
      'appointment_line.' || v_appt_id::text || '.' || v_line_id::text,
      'json',
      jsonb_build_object(
        'appointment_id',   v_appt_id,
        'line_id',          v_line_id,
        'line_number',      v_line_num,
        'service_id',       v_service,
        'service_name',     v_service_name,
        'price_aed',        v_price,
        'duration_minutes', v_duration,
        'booked_at',        NOW()
      ),
      'HERA.SALON.APPOINTMENT.LINE.ECONOMICS.v1'
    );
  END LOOP;

  -- Update appointment header with total
  UPDATE universal_transactions
  SET metadata = metadata || jsonb_build_object(
    'estimated_total_aed', v_total,
    'service_count', v_line_num,
    'total_duration_minutes', (
      SELECT SUM((line_data.field_value_json->>'duration_minutes')::int)
      FROM core_dynamic_data line_data
      WHERE line_data.entity_id IN (SELECT unnest(p_service_ids))
        AND line_data.field_name LIKE 'appointment_line.' || v_appt_id::text || '.%'
        AND line_data.organization_id = p_org_id
    )
  )
  WHERE id = v_appt_id;

  RETURN v_appt_id;
END;
$$;


ALTER FUNCTION "public"."fn_book_appointment"("p_org_id" "uuid", "p_customer_id" "uuid", "p_staff_id" "uuid", "p_branch_id" "uuid", "p_service_ids" "uuid"[], "p_start_at" timestamp with time zone, "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_complete_appointment"("p_appointment_id" "uuid", "p_payment_method" "text" DEFAULT 'cash'::"text", "p_vat_rate" numeric DEFAULT 0.05, "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_appt_record record;
  v_invoice_id uuid := gen_random_uuid();
  v_payment_id uuid := gen_random_uuid();
  v_invoice_number text;
  v_line_record record;
  v_line_id uuid;
  v_line_num int := 0;
  v_subtotal numeric := 0;
  v_vat_amount numeric := 0;
  v_total_amount numeric := 0;
  v_org_id uuid;
  v_customer_id uuid;
  v_branch_id uuid;
  v_staff_id uuid;
  v_result jsonb;
BEGIN
  -- Get appointment details
  SELECT 
    t.*,
    t.metadata->>'customer_id' as customer_id,
    t.metadata->>'branch_id' as branch_id,
    t.metadata->>'staff_id' as staff_id,
    t.metadata->>'stylist_name' as stylist_name,
    (t.metadata->>'estimated_total_aed')::numeric as estimated_total
  INTO v_appt_record
  FROM universal_transactions t
  WHERE t.id = p_appointment_id
    AND t.transaction_type = 'APPOINTMENT'
    AND t.metadata->>'status' = 'booked';

  IF v_appt_record.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found or already completed: %', p_appointment_id;
  END IF;

  v_org_id := v_appt_record.organization_id;
  v_customer_id := v_appt_record.customer_id::uuid;
  v_branch_id := v_appt_record.branch_id::uuid;
  v_staff_id := v_appt_record.staff_id::uuid;

  -- Generate invoice number using pattern: INV-YYYYMMDD-NNNN
  SELECT fn_next_doc_number(v_org_id, 'INVOICE') INTO v_invoice_number;

  -- Calculate totals from line items stored in core_dynamic_data
  SELECT 
    SUM((line_data.field_value_json->>'price_aed')::numeric) as subtotal_calc
  INTO v_subtotal
  FROM core_dynamic_data line_data
  JOIN universal_transaction_lines utl ON (
    utl.transaction_id = p_appointment_id
    AND line_data.field_name LIKE 'appointment_line.' || p_appointment_id::text || '.' || utl.id::text
  )
  WHERE line_data.organization_id = v_org_id;

  v_subtotal := COALESCE(v_subtotal, 0);
  v_vat_amount := ROUND(v_subtotal * p_vat_rate, 2);
  v_total_amount := v_subtotal + v_vat_amount;

  -- Create invoice transaction
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, smart_code,
    transaction_date, source_entity_id, metadata
  ) VALUES (
    v_invoice_id, v_org_id, 'INVOICE',
    'HERA.SALON.TRANSACTION.INVOICE.COMPLETION.v1',
    CURRENT_DATE,
    v_branch_id,
    jsonb_build_object(
      'invoice_number', v_invoice_number,
      'appointment_id', p_appointment_id,
      'customer_id', v_customer_id,
      'branch_id', v_branch_id,
      'staff_id', v_staff_id,
      'stylist_name', v_appt_record.stylist_name,
      'subtotal_aed', v_subtotal,
      'vat_rate', p_vat_rate,
      'vat_amount_aed', v_vat_amount,
      'total_amount_aed', v_total_amount,
      'payment_method', p_payment_method,
      'status', 'paid',
      'completed_at', NOW(),
      'notes', p_notes
    )
  );

  -- Copy service lines from appointment to invoice
  FOR v_line_record IN
    SELECT 
      utl.*,
      line_data.field_value_json
    FROM universal_transaction_lines utl
    JOIN core_dynamic_data line_data ON (
      line_data.field_name LIKE 'appointment_line.' || p_appointment_id::text || '.' || utl.id::text
      AND line_data.organization_id = v_org_id
    )
    WHERE utl.transaction_id = p_appointment_id
    ORDER BY utl.line_number
  LOOP
    v_line_num := v_line_num + 1;
    v_line_id := gen_random_uuid();

    -- Insert invoice line
    INSERT INTO universal_transaction_lines (
      id, organization_id, transaction_id, line_number,
      line_type, entity_id, smart_code
    ) VALUES (
      v_line_id, v_org_id, v_invoice_id, v_line_num,
      'SERVICE', v_line_record.entity_id,
      'HERA.SALON.TRANSACTION.INVOICE.LINE.SERVICE.v1'
    );

    -- Store invoice line economics
    INSERT INTO core_dynamic_data (
      id, organization_id, entity_id, field_name,
      field_type, field_value_json, smart_code
    ) VALUES (
      gen_random_uuid(), v_org_id, v_line_record.entity_id,
      'invoice_line.' || v_invoice_id::text || '.' || v_line_id::text,
      'json',
      v_line_record.field_value_json || jsonb_build_object(
        'invoice_id', v_invoice_id,
        'invoice_line_id', v_line_id,
        'invoice_line_number', v_line_num,
        'original_appointment_id', p_appointment_id,
        'original_line_id', v_line_record.id
      ),
      'HERA.SALON.INVOICE.LINE.ECONOMICS.v1'
    );
  END LOOP;

  -- Create payment transaction
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, smart_code,
    transaction_date, source_entity_id, metadata
  ) VALUES (
    v_payment_id, v_org_id, 'PAYMENT',
    'HERA.SALON.TRANSACTION.PAYMENT.COMPLETION.v1',
    CURRENT_DATE,
    v_customer_id,
    jsonb_build_object(
      'invoice_id', v_invoice_id,
      'invoice_number', v_invoice_number,
      'payment_method', p_payment_method,
      'amount_aed', v_total_amount,
      'currency', 'AED',
      'status', 'completed',
      'processed_at', NOW()
    )
  );

  -- Add payment line
  INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number,
    line_type, entity_id, smart_code
  ) VALUES (
    gen_random_uuid(), v_org_id, v_payment_id, 1,
    'PAYMENT', v_customer_id,
    'HERA.SALON.TRANSACTION.PAYMENT.LINE.v1'
  );

  -- Update appointment status to completed
  UPDATE universal_transactions
  SET metadata = metadata || jsonb_build_object(
    'status', 'completed',
    'completed_at', NOW(),
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'payment_id', v_payment_id,
    'final_amount_aed', v_total_amount
  )
  WHERE id = p_appointment_id;

  -- Build result summary
  v_result := jsonb_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'payment_id', v_payment_id,
    'financial_summary', jsonb_build_object(
      'subtotal_aed', v_subtotal,
      'vat_rate', p_vat_rate,
      'vat_amount_aed', v_vat_amount,
      'total_amount_aed', v_total_amount,
      'payment_method', p_payment_method
    ),
    'service_lines', v_line_num,
    'completed_at', NOW(),
    'message', 'Appointment completed successfully and invoice generated'
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."fn_complete_appointment"("p_appointment_id" "uuid", "p_payment_method" "text", "p_vat_rate" numeric, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_create_sample_dashboard_data"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_customer_id uuid;
  v_product_id uuid;
  v_expense_id uuid;
BEGIN
  -- Create sample customers
  FOR i IN 1..350 LOOP
    v_customer_id := gen_random_uuid();
    INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code)
    VALUES (v_customer_id, p_org_id, 'customer', 'Customer ' || i, 'CUST_' || LPAD(i::text, 4, '0'), 'HERA.SALON.CRM.CUSTOMER.v1');
  END LOOP;

  -- Create sample products with stock levels
  FOR i IN 1..20 LOOP
    v_product_id := gen_random_uuid();
    INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code)
    VALUES (v_product_id, p_org_id, 'product', 'Product ' || i, 'PROD_' || LPAD(i::text, 3, '0'), 'HERA.SALON.INV.PRODUCT.v1');
    
    -- Add stock level (some low stock)
    INSERT INTO core_dynamic_data (id, organization_id, entity_id, field_name, field_type, field_value_number, smart_code)
    VALUES (gen_random_uuid(), p_org_id, v_product_id, 'stock_level', 'number', 
            CASE WHEN i <= 7 THEN (RANDOM() * 9)::int ELSE (RANDOM() * 100 + 20)::int END,
            'HERA.SALON.INV.STOCK.v1');
    
    -- Add unit cost
    INSERT INTO core_dynamic_data (id, organization_id, entity_id, field_name, field_type, field_value_number, smart_code)
    VALUES (gen_random_uuid(), p_org_id, v_product_id, 'unit_cost', 'number', (RANDOM() * 50 + 10)::numeric(10,2),
            'HERA.SALON.INV.COST.v1');
  END LOOP;

  -- Create sample monthly expenses
  FOR i IN 1..10 LOOP
    v_expense_id := gen_random_uuid();
    INSERT INTO universal_transactions (id, organization_id, transaction_type, transaction_date, smart_code)
    VALUES (v_expense_id, p_org_id, 'EXPENSE', 
            date_trunc('month', CURRENT_DATE)::date + (RANDOM() * 28)::int,
            'HERA.SALON.FIN.EXPENSE.v1');
    
    INSERT INTO core_dynamic_data (id, organization_id, entity_id, field_name, field_type, field_value_number, smart_code)
    VALUES (gen_random_uuid(), p_org_id, v_expense_id, 'expense_amount', 'number', 
            (RANDOM() * 10000 + 1000)::numeric(10,2), 'HERA.SALON.FIN.EXPENSE.AMOUNT.v1');
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Sample dashboard data created');
END;
$$;


ALTER FUNCTION "public"."fn_create_sample_dashboard_data"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_daily_sales_report"("p_org_id" "uuid", "p_start_date" "date" DEFAULT CURRENT_DATE, "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_result jsonb;
  v_summary jsonb;
  v_payment_breakdown jsonb;
  v_stylist_performance jsonb;
  v_service_performance jsonb;
  v_hourly_breakdown jsonb;
BEGIN
  -- Overall Financial Summary
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'days_covered', (p_end_date - p_start_date) + 1
    ),
    'financial_totals', jsonb_build_object(
      'total_appointments', COUNT(*),
      'total_revenue_aed', COALESCE(SUM((metadata->>'total_amount_aed')::numeric), 0),
      'total_subtotal_aed', COALESCE(SUM((metadata->>'subtotal_aed')::numeric), 0),
      'total_vat_aed', COALESCE(SUM((metadata->>'vat_amount_aed')::numeric), 0),
      'average_transaction_aed', COALESCE(AVG((metadata->>'total_amount_aed')::numeric), 0),
      'average_vat_rate', CASE 
        WHEN SUM((metadata->>'subtotal_aed')::numeric) > 0 
        THEN SUM((metadata->>'vat_amount_aed')::numeric) / SUM((metadata->>'subtotal_aed')::numeric)
        ELSE 0 
      END
    ),
    'business_metrics', jsonb_build_object(
      'appointments_per_day', 
      CASE WHEN (p_end_date - p_start_date) + 1 > 0 
      THEN COUNT(*) / ((p_end_date - p_start_date) + 1) 
      ELSE 0 END,
      'revenue_per_day_aed',
      CASE WHEN (p_end_date - p_start_date) + 1 > 0 
      THEN COALESCE(SUM((metadata->>'total_amount_aed')::numeric), 0) / ((p_end_date - p_start_date) + 1)
      ELSE 0 END
    )
  )
  INTO v_summary
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'INVOICE'
    AND metadata->>'status' = 'paid'
    AND transaction_date BETWEEN p_start_date AND p_end_date;

  -- Payment Method Breakdown
  SELECT jsonb_build_object(
    'payment_methods', jsonb_object_agg(
      COALESCE(metadata->>'payment_method', 'unknown'),
      jsonb_build_object(
        'count', method_stats.transaction_count,
        'total_amount_aed', method_stats.total_amount,
        'percentage', ROUND(
          (method_stats.total_amount / NULLIF(totals.grand_total, 0)) * 100, 2
        )
      )
    )
  )
  INTO v_payment_breakdown
  FROM (
    SELECT 
      COALESCE(metadata->>'payment_method', 'unknown') as payment_method,
      COUNT(*) as transaction_count,
      SUM((metadata->>'total_amount_aed')::numeric) as total_amount
    FROM universal_transactions
    WHERE organization_id = p_org_id
      AND transaction_type = 'INVOICE'
      AND metadata->>'status' = 'paid'
      AND transaction_date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(metadata->>'payment_method', 'unknown')
  ) method_stats
  CROSS JOIN (
    SELECT SUM((metadata->>'total_amount_aed')::numeric) as grand_total
    FROM universal_transactions
    WHERE organization_id = p_org_id
      AND transaction_type = 'INVOICE'
      AND metadata->>'status' = 'paid'
      AND transaction_date BETWEEN p_start_date AND p_end_date
  ) totals;

  -- Stylist Performance
  SELECT jsonb_build_object(
    'stylist_performance', jsonb_agg(
      jsonb_build_object(
        'stylist_name', stylist_name,
        'appointments_completed', appointment_count,
        'total_revenue_aed', total_revenue,
        'average_service_value_aed', ROUND(total_revenue / appointment_count, 2),
        'market_share_percentage', ROUND(
          (total_revenue / NULLIF(totals.grand_total, 0)) * 100, 2
        )
      )
      ORDER BY total_revenue DESC
    )
  )
  INTO v_stylist_performance
  FROM (
    SELECT 
      metadata->>'stylist_name' as stylist_name,
      COUNT(*) as appointment_count,
      SUM((metadata->>'total_amount_aed')::numeric) as total_revenue
    FROM universal_transactions
    WHERE organization_id = p_org_id
      AND transaction_type = 'INVOICE' 
      AND metadata->>'status' = 'paid'
      AND transaction_date BETWEEN p_start_date AND p_end_date
      AND metadata->>'stylist_name' IS NOT NULL
    GROUP BY metadata->>'stylist_name'
  ) stylist_stats
  CROSS JOIN (
    SELECT SUM((metadata->>'total_amount_aed')::numeric) as grand_total
    FROM universal_transactions
    WHERE organization_id = p_org_id
      AND transaction_type = 'INVOICE'
      AND metadata->>'status' = 'paid'
      AND transaction_date BETWEEN p_start_date AND p_end_date
  ) totals;

  -- Service Performance (Top services by revenue)
  SELECT jsonb_build_object(
    'service_performance', jsonb_agg(
      jsonb_build_object(
        'service_name', service_name,
        'times_booked', service_count,
        'total_revenue_aed', total_revenue,
        'average_price_aed', ROUND(total_revenue / service_count, 2),
        'revenue_percentage', ROUND(
          (total_revenue / NULLIF(totals.grand_total, 0)) * 100, 2
        )
      )
      ORDER BY total_revenue DESC
    )
  )
  INTO v_service_performance
  FROM (
    SELECT 
      line_data.field_value_json->>'service_name' as service_name,
      COUNT(*) as service_count,
      SUM((line_data.field_value_json->>'price_aed')::numeric) as total_revenue
    FROM universal_transactions inv
    JOIN core_dynamic_data line_data ON (
      line_data.field_name LIKE 'invoice_line.' || inv.id::text || '.%'
      AND line_data.organization_id = p_org_id
    )
    WHERE inv.organization_id = p_org_id
      AND inv.transaction_type = 'INVOICE'
      AND inv.metadata->>'status' = 'paid'
      AND inv.transaction_date BETWEEN p_start_date AND p_end_date
    GROUP BY line_data.field_value_json->>'service_name'
    HAVING line_data.field_value_json->>'service_name' IS NOT NULL
  ) service_stats
  CROSS JOIN (
    SELECT SUM((metadata->>'subtotal_aed')::numeric) as grand_total
    FROM universal_transactions
    WHERE organization_id = p_org_id
      AND transaction_type = 'INVOICE'
      AND metadata->>'status' = 'paid'
      AND transaction_date BETWEEN p_start_date AND p_end_date
  ) totals;

  -- Hourly Business Pattern (for today only if single day)
  IF p_start_date = p_end_date THEN
    SELECT jsonb_build_object(
      'hourly_pattern', jsonb_agg(
        jsonb_build_object(
          'hour', hour_slot,
          'appointments', appointment_count,
          'revenue_aed', total_revenue
        )
        ORDER BY hour_slot
      )
    )
    INTO v_hourly_breakdown
    FROM (
      SELECT 
        EXTRACT(HOUR FROM (metadata->>'completed_at')::timestamptz) as hour_slot,
        COUNT(*) as appointment_count,
        SUM((metadata->>'total_amount_aed')::numeric) as total_revenue
      FROM universal_transactions
      WHERE organization_id = p_org_id
        AND transaction_type = 'INVOICE'
        AND metadata->>'status' = 'paid'
        AND transaction_date = p_start_date
        AND metadata->>'completed_at' IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM (metadata->>'completed_at')::timestamptz)
    ) hourly_stats;
  ELSE
    v_hourly_breakdown := '{"hourly_pattern": "Available for single-day reports only"}'::jsonb;
  END IF;

  -- Combine all results
  v_result := v_summary || 
              COALESCE(v_payment_breakdown, '{}'::jsonb) ||
              COALESCE(v_stylist_performance, '{}'::jsonb) ||
              COALESCE(v_service_performance, '{}'::jsonb) ||
              COALESCE(v_hourly_breakdown, '{}'::jsonb);

  v_result := v_result || jsonb_build_object(
    'generated_at', NOW(),
    'report_type', 'daily_sales_comprehensive'
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."fn_daily_sales_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_daily_sales_report_corrected"("p_org_id" "uuid", "p_start_date" "date" DEFAULT CURRENT_DATE, "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH invoice_financials AS (
    -- Get all invoice transactions with their financial data from core_dynamic_data
    SELECT 
      t.id,
      t.transaction_date,
      t.transaction_type,
      -- Extract financial values from core_dynamic_data
      MAX(CASE WHEN dd.field_name LIKE '%total_amount_aed%' THEN dd.field_value_number END) as total_amount_aed,
      MAX(CASE WHEN dd.field_name LIKE '%subtotal_aed%' THEN dd.field_value_number END) as subtotal_aed,
      MAX(CASE WHEN dd.field_name LIKE '%vat_amount_aed%' THEN dd.field_value_number END) as vat_amount_aed,
      MAX(CASE WHEN dd.field_name LIKE '%payment_method%' THEN dd.field_value_text END) as payment_method,
      MAX(CASE WHEN dd.field_name LIKE '%stylist_name%' THEN dd.field_value_text END) as stylist_name,
      MAX(CASE WHEN dd.field_name LIKE '%invoice_number%' THEN dd.field_value_text END) as invoice_number,
      MAX(CASE WHEN dd.field_name LIKE '%status%' AND dd.field_value_text = 'paid' THEN 'paid' END) as status
    FROM universal_transactions t
    LEFT JOIN core_dynamic_data dd ON dd.entity_id = t.id AND dd.organization_id = t.organization_id
    WHERE t.organization_id = p_org_id
      AND t.transaction_type = 'INVOICE'
      AND t.transaction_date BETWEEN p_start_date AND p_end_date
    GROUP BY t.id, t.transaction_date, t.transaction_type
  ),
  paid_invoices AS (
    SELECT * FROM invoice_financials 
    WHERE total_amount_aed IS NOT NULL OR subtotal_aed IS NOT NULL
  )
  SELECT jsonb_build_object(
    'report_info', jsonb_build_object(
      'period_start', p_start_date,
      'period_end', p_end_date,
      'generated_at', NOW(),
      'organization_id', p_org_id
    ),
    'financial_summary', jsonb_build_object(
      'total_invoices', COUNT(*),
      'total_revenue_aed', COALESCE(SUM(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)), 0),
      'total_subtotal_aed', COALESCE(SUM(subtotal_aed), 0), 
      'total_vat_aed', COALESCE(SUM(vat_amount_aed), 0),
      'average_invoice_aed', COALESCE(AVG(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)), 0),
      'effective_vat_rate', CASE 
        WHEN SUM(subtotal_aed) > 0 THEN ROUND((SUM(vat_amount_aed) / SUM(subtotal_aed)) * 100, 2)
        ELSE 0 
      END
    ),
    'payment_breakdown', (
      SELECT jsonb_object_agg(
        COALESCE(payment_method, 'unknown'),
        jsonb_build_object(
          'count', COUNT(*),
          'total_aed', SUM(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)),
          'percentage', ROUND(
            (SUM(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)) / 
             NULLIF(SUM(SUM(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed))) OVER (), 0)) * 100, 2
          )
        )
      )
      FROM paid_invoices
      GROUP BY payment_method
    ),
    'stylist_performance', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'stylist_name', stylist_name,
          'appointments', COUNT(*),
          'revenue_aed', SUM(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)),
          'average_service_aed', ROUND(AVG(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)), 2)
        )
        ORDER BY SUM(COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed)) DESC
      )
      FROM paid_invoices
      WHERE stylist_name IS NOT NULL
      GROUP BY stylist_name
    ),
    'invoice_details', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'invoice_number', invoice_number,
          'date', transaction_date,
          'total_aed', COALESCE(total_amount_aed, subtotal_aed + vat_amount_aed),
          'payment_method', payment_method,
          'stylist', stylist_name
        )
        ORDER BY transaction_date DESC
      )
      FROM paid_invoices
      LIMIT 10
    )
  )
  INTO v_result
  FROM paid_invoices;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."fn_daily_sales_report_corrected"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_discover_salon_data"("p_org_id" "uuid", "p_limit" integer DEFAULT 20) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'organization_id', p_org_id,
      'invoice_transactions', (
        SELECT COUNT(*) 
        FROM universal_transactions 
        WHERE organization_id = p_org_id AND transaction_type = 'INVOICE'
      ),
      'appointment_transactions', (
        SELECT COUNT(*) 
        FROM universal_transactions 
        WHERE organization_id = p_org_id AND transaction_type = 'APPOINTMENT'
      ),
      'recent_dynamic_data', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'entity_id', entity_id,
            'field_name', field_name,
            'field_type', field_type,
            'text_value', field_value_text,
            'number_value', field_value_number,
            'json_value', field_value_json,
            'created_at', created_at
          )
          ORDER BY created_at DESC
        )
        FROM core_dynamic_data
        WHERE organization_id = p_org_id
        LIMIT p_limit
      ),
      'generated_at', NOW()
    )
  );
END;
$$;


ALTER FUNCTION "public"."fn_discover_salon_data"("p_org_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_dynamic_fields_json"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text" DEFAULT NULL::"text") RETURNS TABLE("entity_id" "uuid", "attributes" "jsonb")
    LANGUAGE "sql" STABLE
    AS $_$
  with dd as (
    select d.entity_id,
           jsonb_object_agg(
             d.field_name,
             case
               when d.field_value_text ~ '^-?[0-9]+(\.[0-9]+)?$'
                 then to_jsonb((d.field_value_text)::numeric)
               else to_jsonb(d.field_value_text)
             end
           ) as attrs
    from public.core_dynamic_data d
    where d.organization_id = org_id
      and d.entity_id = any(p_entity_ids)
      and (p_smart_code is null or d.smart_code = p_smart_code)
    group by d.entity_id
  )
  select entity_id, coalesce(attrs, '{}'::jsonb) as attributes from dd;
$_$;


ALTER FUNCTION "public"."fn_dynamic_fields_json"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_dynamic_fields_select"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text" DEFAULT NULL::"text", "p_field_names" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("entity_id" "uuid", "smart_code" "text", "field_name" "text", "field_value_text" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select d.entity_id, d.smart_code, d.field_name, d.field_value_text,
         d.created_at, d.updated_at
  from public.core_dynamic_data d
  where d.organization_id = org_id
    and d.entity_id = any(p_entity_ids)
    and (p_smart_code is null or d.smart_code = p_smart_code)
    and (p_field_names is null or d.field_name = any(p_field_names));
$$;


ALTER FUNCTION "public"."fn_dynamic_fields_select"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text", "p_field_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_entities_list"("org_id" "uuid", "p_entity_type" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "q" "text" DEFAULT NULL::"text", "limit_rows" integer DEFAULT 50, "offset_rows" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "entity_code" "text", "entity_name" "text", "entity_type" "text", "status" "text", "smart_code" "text", "parent_entity_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select id, entity_code, entity_name, entity_type, status, smart_code,
         parent_entity_id, created_at, updated_at
  from public.core_entities
  where organization_id = org_id
    and (p_entity_type is null or entity_type = p_entity_type)
    and (p_status is null or status = p_status)
    and (
         q is null
      or entity_name ilike '%'||q||'%'
      or entity_code ilike '%'||q||'%'
      or smart_code ilike '%'||q||'%'
    )
  order by updated_at desc
  limit limit_rows offset offset_rows;
$$;


ALTER FUNCTION "public"."fn_entities_list"("org_id" "uuid", "p_entity_type" "text", "p_status" "text", "q" "text", "limit_rows" integer, "offset_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_entities_with_soh"("org_id" "uuid", "entity_type_filter" "text" DEFAULT 'product'::"text", "smart_prefixes" "text"[] DEFAULT NULL::"text"[], "branch_entity_id" "uuid" DEFAULT NULL::"uuid", "branch_relationship_type" "text" DEFAULT NULL::"text", "limit_rows" integer DEFAULT 500, "offset_rows" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "entity_code" "text", "entity_name" "text", "entity_type" "text", "status" "text", "smart_code" "text", "qty_on_hand" numeric, "attributes" "jsonb")
    LANGUAGE "sql"
    AS $_$
with base as (
  select e.id, e.entity_code, e.entity_name, e.entity_type, e.status, e.smart_code
  from public.core_entities e
  where e.organization_id = org_id
    and (entity_type_filter is null or e.entity_type = entity_type_filter)
    and (smart_prefixes is null or e.smart_code ilike any(smart_prefixes))
    and (
      branch_entity_id is null
      or exists (
          select 1
          from public.core_relationships cr
          where cr.organization_id = org_id
            and cr.from_entity_id = e.id
            and cr.to_entity_id   = branch_entity_id
            and (branch_relationship_type is null or cr.relationship_type = branch_relationship_type)
            and coalesce(cr.is_active, true) = true
      )
    )
),
soh as (
  select
    utl.entity_id,
    sum(
      case
        when smart_is_negative_txn_static(ut.smart_code)
          then -abs(coalesce(utl.quantity,0))
        else  abs(coalesce(utl.quantity,0))
      end
    ) as qty_on_hand
  from public.universal_transaction_lines utl
  join public.universal_transactions ut on ut.id = utl.transaction_id
  where utl.organization_id = org_id
    and ut.organization_id  = org_id
    and utl.entity_id in (select id from base)
  group by utl.entity_id
),
dd as (
  -- attributes from core_dynamic_data, using typed columns (no "data" column)
  select
    d.entity_id,
    jsonb_object_agg(
      d.field_name,
      case
        when d.field_value_json   is not null then d.field_value_json
        when d.field_value_number is not null then to_jsonb(d.field_value_number)
        when d.field_value_text   is not null and d.field_value_text ~ '^-?[0-9]+(\.[0-9]+)?$'
             then to_jsonb((d.field_value_text)::numeric)
        else to_jsonb(d.field_value_text)
      end
    ) as attributes
  from public.core_dynamic_data d
  where d.organization_id = org_id
    and d.entity_id in (select id from base)
  group by d.entity_id
)
select
  b.id, b.entity_code, b.entity_name, b.entity_type, b.status, b.smart_code,
  coalesce(s.qty_on_hand, 0) as qty_on_hand,
  coalesce(dd.attributes, '{}'::jsonb) as attributes
from base b
left join soh s on s.entity_id = b.id
left join dd  on dd.entity_id  = b.id
order by b.entity_name
limit limit_rows
offset offset_rows;
$_$;


ALTER FUNCTION "public"."fn_entities_with_soh"("org_id" "uuid", "entity_type_filter" "text", "smart_prefixes" "text"[], "branch_entity_id" "uuid", "branch_relationship_type" "text", "limit_rows" integer, "offset_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_entity_get"("org_id" "uuid", "p_entity_id" "uuid") RETURNS TABLE("id" "uuid", "entity_code" "text", "entity_name" "text", "entity_type" "text", "status" "text", "smart_code" "text", "parent_entity_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select id, entity_code, entity_name, entity_type, status, smart_code,
         parent_entity_id, created_at, updated_at
  from public.core_entities
  where organization_id = org_id and id = p_entity_id;
$$;


ALTER FUNCTION "public"."fn_entity_get"("org_id" "uuid", "p_entity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_finance_sales_summary_for_journal"("org_id" "uuid", "p_date" "date") RETURNS TABLE("summary_date" "date", "total_gross" numeric, "total_discount" numeric, "total_tax" numeric, "total_net" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  with d as (
    select
      ut.transaction_date::date as day,
      utl.line_amount,
      utl.discount_amount,
      utl.tax_amount,
      ut.smart_code
    from public.universal_transaction_lines utl
    join public.universal_transactions ut
      on ut.id = utl.transaction_id
    where ut.organization_id  = org_id
      and utl.organization_id = org_id
      and ut.transaction_date::date = p_date
  )
  select
    p_date as summary_date,
    coalesce(
      sum(case when smart_is_negative_txn_static(d.smart_code)
               then -abs(coalesce(d.line_amount, 0))
               else  abs(coalesce(d.line_amount, 0)) end), 0
    ) as total_gross,
    coalesce(sum(coalesce(d.discount_amount, 0)), 0) as total_discount,
    coalesce(sum(coalesce(d.tax_amount, 0)), 0)      as total_tax,
    coalesce(
      sum(case when smart_is_negative_txn_static(d.smart_code)
               then -abs(coalesce(d.line_amount, 0))
               else  abs(coalesce(d.line_amount, 0)) end)
      - sum(coalesce(d.discount_amount, 0))
      + sum(coalesce(d.tax_amount, 0)), 0
    ) as total_net
  from d;
$$;


ALTER FUNCTION "public"."fn_finance_sales_summary_for_journal"("org_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_appointment_details"("p_appointment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'appointment', jsonb_build_object(
      'id', t.id,
      'status', t.metadata->>'status',
      'start_at', t.metadata->>'start_at',
      'stylist_name', t.metadata->>'stylist_name',
      'estimated_total', t.metadata->>'estimated_total_aed',
      'invoice_number', t.metadata->>'invoice_number',
      'completed_at', t.metadata->>'completed_at'
    ),
    'services', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'service_name', line_data.field_value_json->>'service_name',
          'price_aed', line_data.field_value_json->>'price_aed',
          'duration_minutes', line_data.field_value_json->>'duration_minutes'
        )
      )
      FROM core_dynamic_data line_data
      WHERE line_data.field_name LIKE 'appointment_line.' || p_appointment_id::text || '.%'
        AND line_data.organization_id = t.organization_id
    ),
    'financial_totals', CASE 
      WHEN t.metadata->>'status' = 'completed' THEN
        jsonb_build_object(
          'subtotal_aed', (t.metadata->>'estimated_total_aed')::numeric,
          'vat_amount_aed', ((t.metadata->>'final_amount_aed')::numeric - (t.metadata->>'estimated_total_aed')::numeric),
          'total_amount_aed', t.metadata->>'final_amount_aed'
        )
      ELSE
        jsonb_build_object(
          'estimated_total_aed', t.metadata->>'estimated_total_aed'
        )
    END
  )
  INTO v_result
  FROM universal_transactions t
  WHERE t.id = p_appointment_id
    AND t.transaction_type = 'APPOINTMENT';

  RETURN COALESCE(v_result, '{"error": "Appointment not found"}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."fn_get_appointment_details"("p_appointment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_default_branch"("p_org_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_branch_id uuid;
BEGIN
  SELECT id INTO v_branch_id
  FROM core_entities
  WHERE organization_id = p_org_id
    AND entity_type = 'branch'
  ORDER BY created_at
  LIMIT 1;
  
  -- Create a default branch if none exists
  IF v_branch_id IS NULL THEN
    v_branch_id := gen_random_uuid();
    INSERT INTO core_entities (
      id, organization_id, entity_type, entity_code, entity_name, smart_code
    ) VALUES (
      v_branch_id, p_org_id, 'branch', 'DEFAULT_BRANCH', 'Main Branch',
      'HERA.SALON.ORG.BRANCH.MAIN.v1'
    );
  END IF;
  
  RETURN v_branch_id;
END;
$$;


ALTER FUNCTION "public"."fn_get_default_branch"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_walkin_customer"("p_org_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  SELECT id INTO v_customer_id
  FROM core_entities
  WHERE organization_id = p_org_id
    AND entity_type = 'customer'
    AND entity_code = 'WALK_IN_CUSTOMER'
  LIMIT 1;
  
  -- Create if doesn't exist
  IF v_customer_id IS NULL THEN
    v_customer_id := gen_random_uuid();
    INSERT INTO core_entities (
      id, organization_id, entity_type, entity_code, entity_name, smart_code
    ) VALUES (
      v_customer_id, p_org_id, 'customer', 'WALK_IN_CUSTOMER', 'Walk-in Customer',
      'HERA.SALON.CRM.CUSTOMER.WALKIN.v1'
    );
  END IF;
  
  RETURN v_customer_id;
END;
$$;


ALTER FUNCTION "public"."fn_get_walkin_customer"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_inventory_status"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    WITH inventory_data AS (
      SELECT 
        e.id,
        e.entity_name as product_name,
        e.entity_code as product_code,
        MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END) as current_stock,
        MAX(CASE WHEN dd.field_name = 'min_stock_level' THEN dd.field_value_number END) as min_stock,
        MAX(CASE WHEN dd.field_name = 'unit_cost' THEN dd.field_value_number END) as unit_cost,
        MAX(CASE WHEN dd.field_name = 'category' THEN dd.field_value_text END) as category
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.organization_id = p_org_id
      WHERE e.organization_id = p_org_id
        AND e.entity_type = 'product'
        AND e.status = 'active'
      GROUP BY e.id, e.entity_name, e.entity_code
    ),
    inventory_summary AS (
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE COALESCE(current_stock, 0) < COALESCE(min_stock, 10)) as low_stock_count,
        COUNT(*) FILTER (WHERE COALESCE(current_stock, 0) = 0) as out_of_stock_count,
        SUM(COALESCE(current_stock, 0) * COALESCE(unit_cost, 0)) as total_inventory_value_aed
      FROM inventory_data
    )
    SELECT jsonb_build_object(
      'total_products', s.total_products,
      'low_stock_count', s.low_stock_count,
      'out_of_stock_count', s.out_of_stock_count,
      'total_inventory_value_aed', COALESCE(s.total_inventory_value_aed, 0),
      'low_stock_items', (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'product_name', product_name,
              'product_code', product_code,
              'current_stock', COALESCE(current_stock, 0),
              'min_stock', COALESCE(min_stock, 10),
              'category', category,
              'stock_status', CASE 
                WHEN COALESCE(current_stock, 0) = 0 THEN 'out_of_stock'
                WHEN COALESCE(current_stock, 0) < COALESCE(min_stock, 10) THEN 'low_stock'
                ELSE 'normal'
              END
            )
          ), 
          '[]'::jsonb
        )
        FROM (
          SELECT product_name, product_code, current_stock, min_stock, category
          FROM inventory_data
          WHERE COALESCE(current_stock, 0) < COALESCE(min_stock, 10)
          ORDER BY COALESCE(current_stock, 0) ASC
          LIMIT 10
        ) low_stock
      ),
      'generated_at', NOW()
    )
    FROM inventory_summary s
  );
END;
$$;


ALTER FUNCTION "public"."fn_inventory_status"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_inventory_status_bulletproof"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
    temp_record record;
    summary_stats jsonb;
    low_stock_array jsonb := '[]'::jsonb;
    temp_item jsonb;
BEGIN
    -- Step 1: Get summary statistics
    SELECT jsonb_build_object(
        'total_products', COUNT(*),
        'low_stock_count', COUNT(*) FILTER (WHERE 
            COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) < 
            COALESCE(MAX(CASE WHEN dd.field_name = 'min_stock_level' THEN dd.field_value_number END), 10)
        ),
        'out_of_stock_count', COUNT(*) FILTER (WHERE 
            COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) = 0
        ),
        'total_inventory_value_aed', SUM(
            COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) *
            COALESCE(MAX(CASE WHEN dd.field_name = 'unit_cost' THEN dd.field_value_number END), 0)
        )
    ) INTO summary_stats
    FROM core_entities e
    LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.organization_id = p_org_id
    WHERE e.organization_id = p_org_id
        AND e.entity_type = 'product'
        AND e.status = 'active'
    GROUP BY e.id;

    -- Step 2: Get low stock items one by one
    FOR temp_record IN 
        SELECT 
            e.entity_name as product_name,
            e.entity_code as product_code,
            COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) as current_stock,
            COALESCE(MAX(CASE WHEN dd.field_name = 'min_stock_level' THEN dd.field_value_number END), 10) as min_stock,
            MAX(CASE WHEN dd.field_name = 'category' THEN dd.field_value_text END) as category
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.organization_id = p_org_id
        WHERE e.organization_id = p_org_id
            AND e.entity_type = 'product'
            AND e.status = 'active'
        GROUP BY e.id, e.entity_name, e.entity_code
        HAVING COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) < 
               COALESCE(MAX(CASE WHEN dd.field_name = 'min_stock_level' THEN dd.field_value_number END), 10)
        ORDER BY COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) ASC
        LIMIT 10
    LOOP
        temp_item := jsonb_build_object(
            'product_name', temp_record.product_name,
            'product_code', temp_record.product_code,
            'current_stock', temp_record.current_stock,
            'min_stock', temp_record.min_stock,
            'category', temp_record.category,
            'stock_status', CASE 
                WHEN temp_record.current_stock = 0 THEN 'out_of_stock'
                WHEN temp_record.current_stock < temp_record.min_stock THEN 'low_stock'
                ELSE 'normal'
            END
        );
        
        low_stock_array := low_stock_array || temp_item;
    END LOOP;

    -- Step 3: Combine everything
    result := summary_stats || jsonb_build_object(
        'low_stock_items', low_stock_array,
        'generated_at', NOW()
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."fn_inventory_status_bulletproof"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_inventory_status_simple"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
    total_products integer;
    low_stock_count integer;
    out_of_stock_count integer;
    total_value numeric;
    low_stock_items jsonb;
BEGIN
    -- Get basic counts
    WITH inventory_data AS (
      SELECT 
        e.id,
        e.entity_name as product_name,
        e.entity_code as product_code,
        COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) as current_stock,
        COALESCE(MAX(CASE WHEN dd.field_name = 'min_stock_level' THEN dd.field_value_number END), 10) as min_stock,
        COALESCE(MAX(CASE WHEN dd.field_name = 'unit_cost' THEN dd.field_value_number END), 0) as unit_cost,
        MAX(CASE WHEN dd.field_name = 'category' THEN dd.field_value_text END) as category
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.organization_id = p_org_id
      WHERE e.organization_id = p_org_id
        AND e.entity_type = 'product'
        AND e.status = 'active'
      GROUP BY e.id, e.entity_name, e.entity_code
    )
    SELECT 
        COUNT(*)::integer,
        COUNT(*) FILTER (WHERE current_stock < min_stock)::integer,
        COUNT(*) FILTER (WHERE current_stock = 0)::integer,
        SUM(current_stock * unit_cost)
    INTO total_products, low_stock_count, out_of_stock_count, total_value
    FROM inventory_data;

    -- Get low stock items
    WITH inventory_data AS (
      SELECT 
        e.id,
        e.entity_name as product_name,
        e.entity_code as product_code,
        COALESCE(MAX(CASE WHEN dd.field_name = 'current_stock' THEN dd.field_value_number END), 0) as current_stock,
        COALESCE(MAX(CASE WHEN dd.field_name = 'min_stock_level' THEN dd.field_value_number END), 10) as min_stock,
        MAX(CASE WHEN dd.field_name = 'category' THEN dd.field_value_text END) as category
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.organization_id = p_org_id
      WHERE e.organization_id = p_org_id
        AND e.entity_type = 'product'
        AND e.status = 'active'
      GROUP BY e.id, e.entity_name, e.entity_code
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_name', product_name,
        'product_code', product_code,
        'current_stock', current_stock,
        'min_stock', min_stock,
        'category', category,
        'stock_status', CASE 
          WHEN current_stock = 0 THEN 'out_of_stock'
          WHEN current_stock < min_stock THEN 'low_stock'
          ELSE 'normal'
        END
      )
      ORDER BY current_stock ASC
    )
    INTO low_stock_items
    FROM inventory_data
    WHERE current_stock < min_stock
    LIMIT 10;

    -- Build final result
    result := jsonb_build_object(
      'total_products', COALESCE(total_products, 0),
      'low_stock_count', COALESCE(low_stock_count, 0),
      'out_of_stock_count', COALESCE(out_of_stock_count, 0),
      'total_inventory_value_aed', COALESCE(total_value, 0),
      'low_stock_items', COALESCE(low_stock_items, '[]'::jsonb),
      'generated_at', NOW()
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."fn_inventory_status_simple"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_monthly_financial_summary"("p_org_id" "uuid", "p_month" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_month_start date := date_trunc('month', p_month)::date;
  v_month_end date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
BEGIN
  RETURN (
    WITH monthly_revenue AS (
      SELECT 
        COALESCE(SUM((dd.field_value_json->>'price_aed')::numeric), 0) as total_revenue,
        COUNT(DISTINCT t.id) as completed_invoices,
        COUNT(*) as service_lines
      FROM core_dynamic_data dd
      JOIN universal_transactions t ON t.id::text = SPLIT_PART(dd.field_name, '.', 2)
      WHERE dd.organization_id = p_org_id
        AND dd.field_name LIKE 'invoice_line%'
        AND t.transaction_type = 'INVOICE'
        AND t.transaction_date BETWEEN v_month_start AND v_month_end
    ),
    monthly_expenses AS (
      SELECT 
        COALESCE(SUM(dd.field_value_number), 0) as total_expenses,
        COUNT(*) as expense_transactions
      FROM core_dynamic_data dd
      JOIN universal_transactions t ON dd.entity_id = t.id
      WHERE dd.organization_id = p_org_id
        AND t.transaction_type = 'EXPENSE'
        AND dd.field_name LIKE '%amount%'
        AND t.transaction_date BETWEEN v_month_start AND v_month_end
    ),
    vat_summary AS (
      SELECT 
        COALESCE(SUM((dd.field_value_json->>'price_aed')::numeric * 0.05), 0) as total_vat_collected
      FROM core_dynamic_data dd
      JOIN universal_transactions t ON t.id::text = SPLIT_PART(dd.field_name, '.', 2)
      WHERE dd.organization_id = p_org_id
        AND dd.field_name LIKE 'invoice_line%'
        AND t.transaction_type = 'INVOICE'
        AND t.transaction_date BETWEEN v_month_start AND v_month_end
    )
    SELECT jsonb_build_object(
      'month', p_month,
      'period', jsonb_build_object(
        'start_date', v_month_start,
        'end_date', v_month_end
      ),
      'revenue', jsonb_build_object(
        'total_revenue_aed', mr.total_revenue,
        'completed_invoices', mr.completed_invoices,
        'service_lines', mr.service_lines,
        'average_invoice_aed', ROUND(mr.total_revenue / NULLIF(mr.completed_invoices, 0), 2)
      ),
      'expenses', jsonb_build_object(
        'total_expenses_aed', me.total_expenses,
        'expense_transactions', me.expense_transactions
      ),
      'profitability', jsonb_build_object(
        'gross_profit_aed', mr.total_revenue - me.total_expenses,
        'profit_margin_percentage', ROUND(
          ((mr.total_revenue - me.total_expenses) / NULLIF(mr.total_revenue, 0)) * 100, 2
        )
      ),
      'vat', jsonb_build_object(
        'total_vat_collected_aed', vs.total_vat_collected,
        'vat_rate_percentage', 5.0
      )
    )
    FROM monthly_revenue mr, monthly_expenses me, vat_summary vs
  );
END;
$$;


ALTER FUNCTION "public"."fn_monthly_financial_summary"("p_org_id" "uuid", "p_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_doc_type" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_sequence int;
  v_date_part text;
  v_prefix text;
BEGIN
  -- Get date part (YYYYMMDD)
  v_date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Set prefix based on document type
  v_prefix := CASE p_doc_type
    WHEN 'INVOICE' THEN 'INV'
    WHEN 'PAYMENT' THEN 'PAY'
    WHEN 'RECEIPT' THEN 'RCP'
    ELSE 'DOC'
  END;

  -- Get next sequence number for this organization and document type today
  SELECT COALESCE(MAX(
    CAST(REGEXP_REPLACE(
      metadata->>'invoice_number', 
      '^' || v_prefix || '-' || v_date_part || '-(\d+)$', 
      '\1'
    ) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = p_doc_type
    AND DATE(transaction_date) = CURRENT_DATE
    AND metadata->>'invoice_number' ~ ('^' || v_prefix || '-' || v_date_part || '-\d+$');

  RETURN v_prefix || '-' || v_date_part || '-' || LPAD(v_sequence::text, 4, '0');
END;
$_$;


ALTER FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_doc_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_scheme_code" "text", "p_branch_id" "uuid", "p_txn_date" "date" DEFAULT CURRENT_DATE) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_scheme_id uuid;
  v_prefix text;
  v_fmt text;
  v_pad int;
  v_reset text;
  v_counter_field text;
  v_counter numeric;
  v_seq text;
  v_doc text;
  v_yy text := to_char(p_txn_date, 'YY');
  v_mm text := to_char(p_txn_date, 'MM');
BEGIN
  -- find scheme entity
  SELECT id INTO v_scheme_id
  FROM core_entities
  WHERE organization_id=p_org_id AND entity_type='numbering_scheme' AND entity_code=p_scheme_code
  LIMIT 1;
  IF v_scheme_id IS NULL THEN
    RAISE EXCEPTION 'Numbering scheme % not found for org %', p_scheme_code, p_org_id;
  END IF;

  -- read policy
  SELECT
    coalesce(d.field_value_json->'prefix_by_branch'->>(p_branch_id::text), 'GEN'),
    coalesce(d.field_value_json->>'format','{PREFIX}-{YY}{MM}-{SEQ}'),
    coalesce((d.field_value_json->>'seq_padding')::int,5),
    coalesce(d.field_value_json->>'reset','monthly')
  INTO v_prefix, v_fmt, v_pad, v_reset
  FROM core_dynamic_data d
  WHERE d.organization_id=p_org_id AND d.entity_id=v_scheme_id AND d.field_name='policy'
  LIMIT 1;

  IF v_prefix IS NULL THEN v_prefix := 'GEN'; END IF;
  v_counter_field := 'counter.'||p_branch_id::text;

  -- bump counter atomically
  UPDATE core_dynamic_data
  SET field_value_number = coalesce(field_value_number,0) + 1
  WHERE organization_id=p_org_id AND entity_id=v_scheme_id AND field_name=v_counter_field
  RETURNING field_value_number INTO v_counter;

  IF NOT FOUND THEN
    -- seed then bump to 1
    INSERT INTO core_dynamic_data (id, organization_id, entity_id, field_name, field_type, field_value_number, smart_code)
    VALUES (gen_random_uuid(), p_org_id, v_scheme_id, v_counter_field, 'number', 1, 'HERA.CORE.NUMBERING.SCHEME.COUNTER.v1')
    RETURNING field_value_number INTO v_counter;
  END IF;

  v_seq := lpad(coalesce(v_counter,1)::text, v_pad, '0');

  v_doc := replace(replace(replace(replace(v_fmt,
          '{PREFIX}', v_prefix),
          '{YY}', v_yy),
          '{MM}', v_mm),
          '{SEQ}', v_seq);

  RETURN v_doc;
END;
$$;


ALTER FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_scheme_code" "text", "p_branch_id" "uuid", "p_txn_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_owner_dashboard_kpis"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_current_month_start date := date_trunc('month', CURRENT_DATE)::date;
  v_current_month_end date := (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date;
  v_last_month_start date := (date_trunc('month', CURRENT_DATE) - interval '1 month')::date;
  v_last_month_end date := (date_trunc('month', CURRENT_DATE) - interval '1 day')::date;
  
  v_monthly_revenue numeric;
  v_last_month_revenue numeric;
  v_revenue_growth numeric;
  
  v_today_appointments int;
  v_active_customers int;
  v_last_month_customers int;
  v_customer_growth int;
  
  v_staff_count int;
  v_monthly_expenses numeric;
  v_last_month_expenses numeric;
  v_expense_growth numeric;
  
  v_low_stock_items int;
  
  v_result jsonb;
BEGIN
  -- 1. MONTHLY REVENUE WITH GROWTH
  SELECT COALESCE(SUM((dd.field_value_json->>'price_aed')::numeric), 0)
  INTO v_monthly_revenue
  FROM core_dynamic_data dd
  JOIN universal_transactions t ON t.id::text = SPLIT_PART(dd.field_name, '.', 2)
  WHERE dd.organization_id = p_org_id
    AND dd.field_name LIKE 'invoice_line%'
    AND t.transaction_type = 'INVOICE'
    AND t.transaction_date BETWEEN v_current_month_start AND v_current_month_end;

  -- Last month revenue for comparison
  SELECT COALESCE(SUM((dd.field_value_json->>'price_aed')::numeric), 0)
  INTO v_last_month_revenue
  FROM core_dynamic_data dd
  JOIN universal_transactions t ON t.id::text = SPLIT_PART(dd.field_name, '.', 2)
  WHERE dd.organization_id = p_org_id
    AND dd.field_name LIKE 'invoice_line%'
    AND t.transaction_type = 'INVOICE'
    AND t.transaction_date BETWEEN v_last_month_start AND v_last_month_end;

  -- Calculate revenue growth percentage
  v_revenue_growth := CASE 
    WHEN v_last_month_revenue > 0 THEN 
      ROUND(((v_monthly_revenue - v_last_month_revenue) / v_last_month_revenue) * 100, 1)
    ELSE 0 
  END;

  -- 2. TODAY'S APPOINTMENTS
  SELECT COUNT(*)
  INTO v_today_appointments
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'APPOINTMENT'
    AND transaction_date::date = CURRENT_DATE;

  -- 3. ACTIVE CUSTOMERS WITH GROWTH
  SELECT COUNT(*)
  INTO v_active_customers
  FROM core_entities
  WHERE organization_id = p_org_id
    AND entity_type = 'customer'
    AND status = 'active';

  -- Last month customer count (customers who had appointments)
  SELECT COUNT(DISTINCT COALESCE(
    (t.metadata->>'customer_id')::uuid,
    t.source_entity_id
  ))
  INTO v_last_month_customers
  FROM universal_transactions t
  WHERE t.organization_id = p_org_id
    AND t.transaction_type = 'APPOINTMENT'
    AND t.transaction_date BETWEEN v_last_month_start AND v_last_month_end;

  v_customer_growth := v_active_customers - COALESCE(v_last_month_customers, 0);

  -- 4. STAFF MEMBERS COUNT
  SELECT COUNT(*)
  INTO v_staff_count
  FROM core_entities
  WHERE organization_id = p_org_id
    AND entity_type = 'employee'
    AND status = 'active';

  -- 5. MONTHLY EXPENSES WITH GROWTH
  -- Get expenses from transactions marked as expenses
  SELECT COALESCE(SUM(
    CASE 
      WHEN dd.field_name LIKE '%amount%' THEN dd.field_value_number
      ELSE 0
    END
  ), 0)
  INTO v_monthly_expenses
  FROM core_dynamic_data dd
  JOIN universal_transactions t ON dd.entity_id = t.id
  WHERE dd.organization_id = p_org_id
    AND t.transaction_type = 'EXPENSE'
    AND t.transaction_date BETWEEN v_current_month_start AND v_current_month_end;

  -- Last month expenses
  SELECT COALESCE(SUM(
    CASE 
      WHEN dd.field_name LIKE '%amount%' THEN dd.field_value_number
      ELSE 0
    END
  ), 0)
  INTO v_last_month_expenses
  FROM core_dynamic_data dd
  JOIN universal_transactions t ON dd.entity_id = t.id
  WHERE dd.organization_id = p_org_id
    AND t.transaction_type = 'EXPENSE'
    AND t.transaction_date BETWEEN v_last_month_start AND v_last_month_end;

  -- Calculate expense growth percentage
  v_expense_growth := CASE 
    WHEN v_last_month_expenses > 0 THEN 
      ROUND(((v_monthly_expenses - v_last_month_expenses) / v_last_month_expenses) * 100, 1)
    ELSE 0 
  END;

  -- 6. LOW STOCK ITEMS
  SELECT COUNT(*)
  INTO v_low_stock_items
  FROM core_entities e
  JOIN core_dynamic_data dd ON dd.entity_id = e.id
  WHERE e.organization_id = p_org_id
    AND e.entity_type = 'product'
    AND e.status = 'active'
    AND dd.field_name = 'stock_level'
    AND dd.field_value_number < 10; -- Consider below 10 as low stock

  -- Build dashboard result
  v_result := jsonb_build_object(
    'dashboard_date', CURRENT_DATE,
    'owner_name', 'Michele',
    'kpis', jsonb_build_object(
      'monthly_revenue', jsonb_build_object(
        'amount_aed', v_monthly_revenue,
        'growth_percentage', v_revenue_growth,
        'previous_month_aed', v_last_month_revenue
      ),
      'todays_appointments', jsonb_build_object(
        'count', v_today_appointments,
        'date', CURRENT_DATE
      ),
      'active_customers', jsonb_build_object(
        'count', v_active_customers,
        'growth_count', v_customer_growth,
        'previous_month_count', v_last_month_customers
      ),
      'staff_members', jsonb_build_object(
        'count', v_staff_count
      ),
      'monthly_expenses', jsonb_build_object(
        'amount_aed', v_monthly_expenses,
        'growth_percentage', v_expense_growth,
        'previous_month_aed', v_last_month_expenses
      ),
      'low_stock_items', jsonb_build_object(
        'count', v_low_stock_items
      )
    ),
    'generated_at', NOW()
  );

  RETURN v_result;

END;
$$;


ALTER FUNCTION "public"."fn_owner_dashboard_kpis"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_products_with_soh"("org_id" "uuid") RETURNS TABLE("id" "uuid", "entity_code" "text", "entity_name" "text", "status" "text", "smart_code" "text", "qty_on_hand" numeric, "attributes" "jsonb")
    LANGUAGE "sql"
    AS $$
  select id, entity_code, entity_name, status, smart_code, qty_on_hand, attributes
  from public.fn_entities_with_soh(
    org_id           => org_id,
    entity_type_filter => 'product',
    smart_prefixes     => array['HERA.SALON.PRODUCT.%'],
    branch_entity_id   => null,
    branch_relationship_type => null,
    limit_rows => 500,
    offset_rows => 0
  );
$$;


ALTER FUNCTION "public"."fn_products_with_soh"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_quick_daily_summary"("p_org_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN jsonb_build_object(
    'date', p_date,
    'summary', (
      SELECT jsonb_build_object(
        'appointments', COUNT(*),
        'revenue_aed', COALESCE(SUM((metadata->>'total_amount_aed')::numeric), 0),
        'vat_collected_aed', COALESCE(SUM((metadata->>'vat_amount_aed')::numeric), 0),
        'cash_sales', COUNT(*) FILTER (WHERE metadata->>'payment_method' = 'cash'),
        'card_sales', COUNT(*) FILTER (WHERE metadata->>'payment_method' = 'card'),
        'top_stylist', (
          SELECT metadata->>'stylist_name'
          FROM universal_transactions
          WHERE organization_id = p_org_id
            AND transaction_type = 'INVOICE'
            AND metadata->>'status' = 'paid'
            AND transaction_date = p_date
          GROUP BY metadata->>'stylist_name'
          ORDER BY SUM((metadata->>'total_amount_aed')::numeric) DESC
          LIMIT 1
        )
      )
      FROM universal_transactions
      WHERE organization_id = p_org_id
        AND transaction_type = 'INVOICE'
        AND metadata->>'status' = 'paid'
        AND transaction_date = p_date
    )
  );
END;
$$;


ALTER FUNCTION "public"."fn_quick_daily_summary"("p_org_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_quick_daily_summary_corrected"("p_org_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    WITH invoice_data AS (
      SELECT 
        t.id,
        -- Get financial data from core_dynamic_data
        MAX(CASE WHEN dd.field_name LIKE '%total_amount_aed%' THEN dd.field_value_number END) as total_amount_aed,
        MAX(CASE WHEN dd.field_name LIKE '%vat_amount_aed%' THEN dd.field_value_number END) as vat_amount_aed,
        MAX(CASE WHEN dd.field_name LIKE '%payment_method%' THEN dd.field_value_text END) as payment_method,
        MAX(CASE WHEN dd.field_name LIKE '%stylist_name%' THEN dd.field_value_text END) as stylist_name
      FROM universal_transactions t
      LEFT JOIN core_dynamic_data dd ON dd.entity_id = t.id
      WHERE t.organization_id = p_org_id
        AND t.transaction_type = 'INVOICE'
        AND t.transaction_date::date = p_date
        AND dd.organization_id = p_org_id
      GROUP BY t.id
    ),
    stylist_revenue AS (
      SELECT 
        stylist_name,
        SUM(total_amount_aed) as total_revenue
      FROM invoice_data
      WHERE stylist_name IS NOT NULL
      GROUP BY stylist_name
      ORDER BY total_revenue DESC
      LIMIT 1
    )
    SELECT jsonb_build_object(
      'date', p_date,
      'summary', jsonb_build_object(
        'appointments', COUNT(*),
        'revenue_aed', COALESCE(SUM(total_amount_aed), 0),
        'vat_collected_aed', COALESCE(SUM(vat_amount_aed), 0),
        'cash_sales', COUNT(*) FILTER (WHERE payment_method = 'cash'),
        'card_sales', COUNT(*) FILTER (WHERE payment_method = 'card'),
        'top_stylist', (SELECT stylist_name FROM stylist_revenue LIMIT 1)
      )
    )
    FROM invoice_data
    WHERE total_amount_aed IS NOT NULL
  );
END;
$$;


ALTER FUNCTION "public"."fn_quick_daily_summary_corrected"("p_org_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_relationships_list"("org_id" "uuid", "p_from_entity_id" "uuid" DEFAULT NULL::"uuid", "p_to_entity_id" "uuid" DEFAULT NULL::"uuid", "p_relationship_type" "text" DEFAULT NULL::"text", "p_is_active" boolean DEFAULT NULL::boolean) RETURNS TABLE("id" "uuid", "from_entity_id" "uuid", "to_entity_id" "uuid", "relationship_type" "text", "relationship_direction" "text", "relationship_strength" numeric, "relationship_data" "jsonb", "smart_code" "text", "smart_code_status" "text", "is_active" boolean, "effective_date" timestamp with time zone, "expiration_date" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select id, from_entity_id, to_entity_id, relationship_type, relationship_direction,
         relationship_strength, relationship_data, smart_code, smart_code_status,
         is_active, effective_date, expiration_date, created_at, updated_at
  from public.core_relationships
  where organization_id = org_id
    and (p_from_entity_id is null or from_entity_id = p_from_entity_id)
    and (p_to_entity_id   is null or to_entity_id   = p_to_entity_id)
    and (p_relationship_type is null or relationship_type = p_relationship_type)
    and (p_is_active is null or is_active = p_is_active)
  order by updated_at desc;
$$;


ALTER FUNCTION "public"."fn_relationships_list"("org_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sales_by_day"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") RETURNS TABLE("day" "date", "gross_amount" numeric, "discount_amount" numeric, "tax_amount" numeric, "net_amount" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  with lines as (
    select ut.transaction_date::date as day,
           utl.line_amount,
           utl.discount_amount,
           utl.tax_amount,
           ut.smart_code
    from public.universal_transaction_lines utl
    join public.universal_transactions ut on ut.id = utl.transaction_id
    where ut.organization_id  = org_id
      and utl.organization_id = org_id
      and ut.transaction_date >= p_date_from
      and ut.transaction_date <= p_date_to
  )
  select day,
         sum(case when smart_is_negative_txn_static(smart_code)
                  then -abs(coalesce(line_amount,0))
                  else  abs(coalesce(line_amount,0)) end) as gross_amount,
         sum(coalesce(discount_amount,0)) as discount_amount,
         sum(coalesce(tax_amount,0))      as tax_amount,
         (sum(case when smart_is_negative_txn_static(smart_code)
                   then -abs(coalesce(line_amount,0))
                   else  abs(coalesce(line_amount,0)) end)
          - sum(coalesce(discount_amount,0))
          + sum(coalesce(tax_amount,0)))  as net_amount
  from lines
  group by day
  order by day;
$$;


ALTER FUNCTION "public"."fn_sales_by_day"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sales_by_service"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") RETURNS TABLE("entity_id" "uuid", "entity_name" "text", "gross_amount" numeric, "discount_amount" numeric, "tax_amount" numeric, "net_amount" numeric, "total_qty" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  with base as (
    select utl.entity_id, ut.smart_code,
           utl.line_amount, utl.discount_amount, utl.tax_amount, utl.quantity
    from public.universal_transaction_lines utl
    join public.universal_transactions ut on ut.id = utl.transaction_id
    where ut.organization_id  = org_id
      and utl.organization_id = org_id
      and ut.transaction_date >= p_date_from
      and ut.transaction_date <= p_date_to
  )
  select b.entity_id,
         e.entity_name,
         sum(case when smart_is_negative_txn_static(b.smart_code)
                  then -abs(coalesce(b.line_amount,0))
                  else  abs(coalesce(b.line_amount,0)) end) as gross_amount,
         sum(coalesce(b.discount_amount,0)) as discount_amount,
         sum(coalesce(b.tax_amount,0))      as tax_amount,
         (sum(case when smart_is_negative_txn_static(b.smart_code)
                   then -abs(coalesce(b.line_amount,0))
                   else  abs(coalesce(b.line_amount,0)) end)
          - sum(coalesce(b.discount_amount,0))
          + sum(coalesce(b.tax_amount,0)))  as net_amount,
         sum(case when smart_is_negative_txn_static(b.smart_code)
                  then -abs(coalesce(b.quantity,0))
                  else  abs(coalesce(b.quantity,0)) end) as total_qty
  from base b
  left join public.core_entities e
    on e.id = b.entity_id and e.organization_id = org_id
  group by b.entity_id, e.entity_name
  order by net_amount desc nulls last;
$$;


ALTER FUNCTION "public"."fn_sales_by_service"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_service_performance_report"("p_org_id" "uuid", "p_start_date" "date" DEFAULT CURRENT_DATE, "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    WITH service_lines AS (
      -- Get service line data from appointment/invoice line economics
      SELECT 
        dd.field_value_json->>'service_name' as service_name,
        (dd.field_value_json->>'price_aed')::numeric as price_aed,
        (dd.field_value_json->>'duration_minutes')::int as duration_minutes,
        dd.entity_id as service_entity_id
      FROM core_dynamic_data dd
      JOIN universal_transactions t ON (
        dd.field_name LIKE 'invoice_line.%' 
        AND dd.field_name LIKE '%' || SPLIT_PART(dd.field_name, '.', 2) || '%'
      )
      WHERE dd.organization_id = p_org_id
        AND t.transaction_type = 'INVOICE'
        AND t.transaction_date BETWEEN p_start_date AND p_end_date
        AND dd.field_value_json->>'service_name' IS NOT NULL
    )
    SELECT jsonb_build_object(
      'period', jsonb_build_object(
        'start_date', p_start_date,
        'end_date', p_end_date
      ),
      'service_performance', jsonb_agg(
        jsonb_build_object(
          'service_name', service_name,
          'times_sold', COUNT(*),
          'total_revenue_aed', SUM(price_aed),
          'average_price_aed', ROUND(AVG(price_aed), 2),
          'total_duration_minutes', SUM(duration_minutes),
          'average_duration_minutes', ROUND(AVG(duration_minutes), 0)
        )
        ORDER BY SUM(price_aed) DESC
      )
    )
    FROM service_lines
    GROUP BY service_name
  );
END;
$$;


ALTER FUNCTION "public"."fn_service_performance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_services_with_dd"("org_id" "uuid", "limit_rows" integer DEFAULT 100, "offset_rows" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "entity_name" "text", "entity_code" "text", "status" "text", "smart_code" "text", "price" "jsonb", "tax" "jsonb", "commission" "jsonb")
    LANGUAGE "sql"
    AS $_$
with svc as (
  select e.id, e.entity_name, e.entity_code, e.status, e.smart_code
  from public.core_entities e
  where e.organization_id = org_id
    and e.smart_code like 'HERA.SALON.SERVICE.%'
),
dd as (
  select
    d.entity_id,
    d.smart_code,
    jsonb_object_agg(
      d.field_name,
      case
        when d.field_value_text ~ '^-?[0-9]+(\.[0-9]+)?$'
          then to_jsonb(d.field_value_text::numeric)
        else to_jsonb(d.field_value_text)
      end
    ) as fields
  from public.core_dynamic_data d
  where d.organization_id = org_id
    and d.entity_id in (select id from svc)
    and d.smart_code in (
      'HERA.SALON.SERVICE.PRICE.V1',
      'HERA.SALON.SERVICE.TAX.V1',
      'HERA.SALON.SERVICE.COMMISSION.V1'
    )
  group by d.entity_id, d.smart_code
)
select
  s.id, s.entity_name, s.entity_code, s.status, s.smart_code,
  coalesce((select fields from dd where dd.entity_id=s.id and dd.smart_code='HERA.SALON.SERVICE.PRICE.V1'), '{}'::jsonb)       as price,
  coalesce((select fields from dd where dd.entity_id=s.id and dd.smart_code='HERA.SALON.SERVICE.TAX.V1'), '{}'::jsonb)         as tax,
  coalesce((select fields from dd where dd.entity_id=s.id and dd.smart_code='HERA.SALON.SERVICE.COMMISSION.V1'), '{}'::jsonb) as commission
from svc s
order by s.entity_name
limit limit_rows
offset offset_rows;
$_$;


ALTER FUNCTION "public"."fn_services_with_dd"("org_id" "uuid", "limit_rows" integer, "offset_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_transaction_get"("org_id" "uuid", "p_transaction_id" "uuid") RETURNS TABLE("id" "uuid", "transaction_code" "text", "transaction_type" "text", "transaction_date" "date", "total_amount" numeric, "smart_code" "text", "smart_code_status" "text", "source_entity_id" "uuid", "target_entity_id" "uuid", "fiscal_period_entity_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select id, transaction_code, transaction_type, transaction_date,
         total_amount, smart_code, smart_code_status,
         source_entity_id, target_entity_id, fiscal_period_entity_id,
         created_at, updated_at
  from public.universal_transactions
  where organization_id = org_id and id = p_transaction_id;
$$;


ALTER FUNCTION "public"."fn_transaction_get"("org_id" "uuid", "p_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_transaction_lines_by_entity"("org_id" "uuid", "p_entity_id" "uuid", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "limit_rows" integer DEFAULT 100, "offset_rows" integer DEFAULT 0) RETURNS TABLE("transaction_id" "uuid", "line_number" integer, "transaction_date" "date", "smart_code" "text", "quantity" numeric, "signed_quantity" numeric, "unit_amount" numeric, "line_amount" numeric, "discount_amount" numeric, "tax_amount" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  select utl.transaction_id,
         utl.line_number,
         ut.transaction_date,
         ut.smart_code,
         utl.quantity,
         case when smart_is_negative_txn_static(ut.smart_code)
              then -abs(coalesce(utl.quantity, 0))
              else  abs(coalesce(utl.quantity, 0))
          end as signed_quantity,
         utl.unit_amount, utl.line_amount, utl.discount_amount, utl.tax_amount
  from public.universal_transaction_lines utl
  join public.universal_transactions ut on ut.id = utl.transaction_id
  where utl.organization_id = org_id
    and ut.organization_id  = org_id
    and utl.entity_id = p_entity_id
    and (p_date_from is null or ut.transaction_date >= p_date_from)
    and (p_date_to   is null or ut.transaction_date <= p_date_to)
  order by ut.transaction_date desc, utl.line_number asc
  limit limit_rows offset offset_rows;
$$;


ALTER FUNCTION "public"."fn_transaction_lines_by_entity"("org_id" "uuid", "p_entity_id" "uuid", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_transaction_lines_by_txn"("org_id" "uuid", "p_transaction_id" "uuid") RETURNS TABLE("id" "uuid", "transaction_id" "uuid", "line_number" integer, "entity_id" "uuid", "line_type" "text", "description" "text", "quantity" numeric, "unit_amount" numeric, "line_amount" numeric, "discount_amount" numeric, "tax_amount" numeric, "smart_code" character varying, "smart_code_status" "text", "ai_confidence" numeric, "ai_classification" "text", "ai_insights" "jsonb", "line_data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "created_by" "uuid", "updated_by" "uuid", "version" integer)
    LANGUAGE "sql" STABLE
    AS $$
  select id, transaction_id, line_number, entity_id, line_type, description,
         quantity, unit_amount, line_amount, discount_amount, tax_amount,
         smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
         line_data, created_at, updated_at, created_by, updated_by, version
  from public.universal_transaction_lines
  where organization_id = org_id
    and transaction_id = p_transaction_id
  order by line_number asc;
$$;


ALTER FUNCTION "public"."fn_transaction_lines_by_txn"("org_id" "uuid", "p_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_transactions_list"("org_id" "uuid", "p_transaction_type" "text" DEFAULT NULL::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "limit_rows" integer DEFAULT 100, "offset_rows" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "transaction_code" "text", "transaction_type" "text", "transaction_date" "date", "total_amount" numeric, "smart_code" "text", "smart_code_status" "text", "source_entity_id" "uuid", "target_entity_id" "uuid", "fiscal_period_entity_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select id, transaction_code, transaction_type, transaction_date,
         total_amount, smart_code, smart_code_status,
         source_entity_id, target_entity_id, fiscal_period_entity_id,
         created_at, updated_at
  from public.universal_transactions
  where organization_id = org_id
    and (p_transaction_type is null or transaction_type = p_transaction_type)
    and (p_date_from is null or transaction_date >= p_date_from)
    and (p_date_to   is null or transaction_date <= p_date_to)
  order by transaction_date desc, updated_at desc
  limit limit_rows offset offset_rows;
$$;


ALTER FUNCTION "public"."fn_transactions_list"("org_id" "uuid", "p_transaction_type" "text", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_vat_compliance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN jsonb_build_object(
    'vat_period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'vat_summary', (
      SELECT jsonb_build_object(
        'total_sales_including_vat_aed', COALESCE(SUM((metadata->>'total_amount_aed')::numeric), 0),
        'total_sales_excluding_vat_aed', COALESCE(SUM((metadata->>'subtotal_aed')::numeric), 0),
        'total_vat_collected_aed', COALESCE(SUM((metadata->>'vat_amount_aed')::numeric), 0),
        'number_of_transactions', COUNT(*),
        'average_vat_rate', ROUND(
          CASE 
            WHEN SUM((metadata->>'subtotal_aed')::numeric) > 0 
            THEN SUM((metadata->>'vat_amount_aed')::numeric) / SUM((metadata->>'subtotal_aed')::numeric) * 100
            ELSE 0 
          END, 2
        )
      )
      FROM universal_transactions
      WHERE organization_id = p_org_id
        AND transaction_type = 'INVOICE'
        AND metadata->>'status' = 'paid'
        AND transaction_date BETWEEN p_start_date AND p_end_date
    ),
    'daily_breakdown', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', transaction_date,
          'transactions', daily_count,
          'vat_collected_aed', daily_vat
        )
        ORDER BY transaction_date
      )
      FROM (
        SELECT 
          transaction_date,
          COUNT(*) as daily_count,
          SUM((metadata->>'vat_amount_aed')::numeric) as daily_vat
        FROM universal_transactions
        WHERE organization_id = p_org_id
          AND transaction_type = 'INVOICE'
          AND metadata->>'status' = 'paid'
          AND transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY transaction_date
      ) daily_stats
    ),
    'generated_at', NOW(),
    'report_type', 'vat_compliance'
  );
END;
$$;


ALTER FUNCTION "public"."fn_vat_compliance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_weekly_comparison_report"("p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_this_week_start date := date_trunc('week', CURRENT_DATE)::date;
  v_last_week_start date := v_this_week_start - interval '7 days';
  v_this_week jsonb;
  v_last_week jsonb;
BEGIN
  -- This week's data
  SELECT jsonb_build_object(
    'period', 'this_week',
    'start_date', v_this_week_start,
    'end_date', v_this_week_start + 6,
    'appointments', COUNT(*),
    'revenue_aed', COALESCE(SUM((metadata->>'total_amount_aed')::numeric), 0),
    'vat_aed', COALESCE(SUM((metadata->>'vat_amount_aed')::numeric), 0)
  )
  INTO v_this_week
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'INVOICE'
    AND metadata->>'status' = 'paid'
    AND transaction_date BETWEEN v_this_week_start AND v_this_week_start + 6;

  -- Last week's data  
  SELECT jsonb_build_object(
    'period', 'last_week',
    'start_date', v_last_week_start,
    'end_date', v_last_week_start + 6,
    'appointments', COUNT(*),
    'revenue_aed', COALESCE(SUM((metadata->>'total_amount_aed')::numeric), 0),
    'vat_aed', COALESCE(SUM((metadata->>'vat_amount_aed')::numeric), 0)
  )
  INTO v_last_week
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'INVOICE'
    AND metadata->>'status' = 'paid'
    AND transaction_date BETWEEN v_last_week_start AND v_last_week_start + 6;

  -- Return comparison
  RETURN jsonb_build_object(
    'comparison_type', 'week_over_week',
    'this_week', v_this_week,
    'last_week', v_last_week,
    'growth_metrics', jsonb_build_object(
      'revenue_growth_percentage', ROUND(
        CASE 
          WHEN (v_last_week->>'revenue_aed')::numeric > 0 
          THEN (((v_this_week->>'revenue_aed')::numeric - (v_last_week->>'revenue_aed')::numeric) / (v_last_week->>'revenue_aed')::numeric) * 100
          ELSE 0 
        END, 2
      ),
      'appointment_growth_percentage', ROUND(
        CASE 
          WHEN (v_last_week->>'appointments')::numeric > 0 
          THEN (((v_this_week->>'appointments')::numeric - (v_last_week->>'appointments')::numeric) / (v_last_week->>'appointments')::numeric) * 100
          ELSE 0 
        END, 2
      )
    ),
    'generated_at', NOW()
  );
END;
$$;


ALTER FUNCTION "public"."fn_weekly_comparison_report"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_by_subdomain"("p_subdomain" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', o.id,
        'name', o.organization_name,
        'type', o.organization_type,
        'subdomain', e.metadata->>'subdomain',
        'subscription_plan', COALESCE(e.metadata->>'subscription_plan', 'trial'),
        'is_active', COALESCE(o.status != 'inactive', true),
        'metadata', jsonb_build_object(
            'settings', o.settings,
            'status', o.status
        )
    ) INTO v_result
    FROM core_organizations o
    JOIN core_entities e ON o.id = e.id
    WHERE e.entity_type = 'organization'
    AND e.metadata->>'subdomain' = p_subdomain
    AND (o.status IS NULL OR o.status != 'inactive');

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'Organization not found',
            'subdomain', p_subdomain
        );
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_organization_by_subdomain"("p_subdomain" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_period_close_progress"("p_period_id" "uuid", "p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_result JSONB;
  v_checklist_total INTEGER;
  v_checklist_complete INTEGER;
  v_journal_total INTEGER;
  v_journal_posted INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE transaction_status = 'posted')
  INTO v_checklist_total, v_checklist_complete
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'close_checklist'
    AND business_context->>'period_entity_id' = p_period_id::TEXT;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE transaction_status = 'posted')
  INTO v_journal_total, v_journal_posted
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'journal_entry'
    AND business_context->>'period_entity_id' = p_period_id::TEXT;

  v_result := jsonb_build_object(
    'checklist_items',  v_checklist_total,
    'checklist_complete', v_checklist_complete,
    'checklist_percent', CASE 
      WHEN v_checklist_total > 0 
      THEN ROUND((v_checklist_complete::NUMERIC / v_checklist_total) * 100)
      ELSE 0
    END,
    'journal_entries',  v_journal_total,
    'journal_posted',   v_journal_posted,
    'journal_pending',  v_journal_total - v_journal_posted,
    'overall_progress', CASE
      WHEN (v_checklist_total + v_journal_total) > 0
      THEN ROUND(((v_checklist_complete + v_journal_posted)::NUMERIC / 
                  (v_checklist_total + v_journal_total)) * 100)
      ELSE 0
    END
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_period_close_progress"("p_period_id" "uuid", "p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH user_orgs AS (
        SELECT 
            o.id,
            o.organization_name,
            o.organization_type,
            o.status,
            o.settings,
            oe.metadata->>'subdomain' as subdomain,
            oe.metadata->>'subscription_plan' as subscription_plan,
            r.relationship_data->>'role' as role,
            r.relationship_data->'permissions' as permissions
        FROM core_relationships r
        JOIN core_entities ue ON r.from_entity_id = ue.id
        JOIN core_organizations o ON r.to_entity_id = o.id
        JOIN core_entities oe ON o.id = oe.id
        WHERE ue.entity_type = 'user'
        AND ue.metadata->>'auth_user_id' = p_user_id::TEXT
        AND r.relationship_type = 'member_of'
        AND (o.status IS NULL OR o.status != 'inactive')
        ORDER BY r.created_at DESC
    )
    SELECT jsonb_build_object(
        'organizations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', organization_name,
                'type', organization_type,
                'subdomain', subdomain,
                'subscription_plan', COALESCE(subscription_plan, 'trial'),
                'is_active', COALESCE(status != 'inactive', true),
                'role', role,
                'permissions', permissions
            )
        ), '[]'::jsonb)
    ) INTO v_result
    FROM user_orgs;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vibe_component_health"("p_organization_id" "uuid") RETURNS TABLE("component_name" "text", "component_type" "text", "smart_code" "text", "health_status" "text", "performance_metrics" "jsonb", "last_update" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.entity_name,
    e.metadata->>'component_type',
    e.smart_code,
    e.metadata->>'health_status',
    e.metadata->'performance_metrics',
    e.updated_at
  FROM core_entities e
  WHERE e.organization_id = p_organization_id
  AND e.entity_type = 'vibe_component'
  AND e.status = 'active'
  ORDER BY e.entity_name;
END;
$$;


ALTER FUNCTION "public"."get_vibe_component_health"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    org_uuid UUID;
    org_name TEXT;
    org_code TEXT;
    user_name TEXT;
    user_code TEXT;
    existing_org_id UUID;
BEGIN
    -- Extract data from user metadata with defaults
    org_name := COALESCE(
        NEW.raw_user_meta_data->>'organization_name',
        NEW.raw_app_meta_data->>'organization_name',
        'Default Organization'
    );
    
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_app_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Generate unique codes with timestamp
    org_code := 'ORG-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-') || LEFT(MD5(NEW.id::TEXT || random()::TEXT), 8);
    user_code := 'USER-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-') || LEFT(MD5(NEW.id::TEXT || random()::TEXT), 8);
    
    -- First, check if an organization with this name already exists for this user
    SELECT id INTO existing_org_id
    FROM public.core_organizations
    WHERE organization_name = org_name
    AND created_by = NEW.id
    AND status = 'active'
    LIMIT 1;
    
    IF existing_org_id IS NOT NULL THEN
        org_uuid := existing_org_id;
    ELSE
        -- Create new organization
        BEGIN
            INSERT INTO public.core_organizations (
                organization_name,
                organization_code,
                organization_type,
                industry_classification,
                settings,
                metadata,
                status,
                created_by
            ) VALUES (
                org_name,
                org_code,
                'business_unit',
                COALESCE(NEW.raw_user_meta_data->>'industry', 'general'),
                jsonb_build_object(
                    'signup_source', 'supabase_auth',
                    'signup_date', NOW()::TEXT,
                    'email_verified', COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
                ),
                jsonb_build_object(
                    'source_user_id', NEW.id,
                    'email', NEW.email,
                    'created_from', 'auth_trigger'
                ),
                'active',
                NEW.id
            )
            RETURNING id INTO org_uuid;
        EXCEPTION
            WHEN unique_violation THEN
                -- If unique constraint violation, try to find the existing org
                SELECT id INTO org_uuid
                FROM public.core_organizations
                WHERE organization_code = org_code
                LIMIT 1;
                
                -- If still null, generate a new code and try again
                IF org_uuid IS NULL THEN
                    org_code := org_code || '-' || LEFT(MD5(random()::TEXT), 4);
                    INSERT INTO public.core_organizations (
                        organization_name,
                        organization_code,
                        organization_type,
                        industry_classification,
                        settings,
                        metadata,
                        status,
                        created_by
                    ) VALUES (
                        org_name,
                        org_code,
                        'business_unit',
                        COALESCE(NEW.raw_user_meta_data->>'industry', 'general'),
                        jsonb_build_object(
                            'signup_source', 'supabase_auth',
                            'signup_date', NOW()::TEXT
                        ),
                        jsonb_build_object(
                            'source_user_id', NEW.id,
                            'email', NEW.email
                        ),
                        'active',
                        NEW.id
                    )
                    RETURNING id INTO org_uuid;
                END IF;
        END;
    END IF;

    -- Create user as core_entity (using Supabase user ID as entity ID)
    BEGIN
        INSERT INTO public.core_entities(
            id,
            organization_id, 
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            metadata,
            status,
            created_by
        ) VALUES (
            NEW.id,  -- Use Supabase user ID as entity ID
            org_uuid,
            'user',
            user_name,
            user_code,
            'HERA.USER.PROFILE.v1',
            jsonb_build_object(
                'auth_provider', 'supabase',
                'email', NEW.email,
                'email_confirmed', COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                'phone', NEW.phone,
                'created_from', 'auth_trigger'
            ),
            'active',
            NEW.id
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Update existing entity if it somehow exists
            UPDATE public.core_entities
            SET 
                organization_id = org_uuid,
                entity_name = user_name,
                updated_at = NOW()
            WHERE id = NEW.id;
    END;
    
    -- Store user properties in core_dynamic_data
    -- Delete any existing properties first (in case of re-registration)
    DELETE FROM public.core_dynamic_data WHERE entity_id = NEW.id;
    
    -- Insert fresh properties
    INSERT INTO public.core_dynamic_data(
        entity_id, 
        field_name, 
        field_value,
        field_type,
        smart_code,
        created_by
    ) VALUES
    (NEW.id, 'email', NEW.email, 'text', 'HERA.USER.EMAIL.v1', NEW.id),
    (NEW.id, 'auth_provider', 'supabase', 'text', 'HERA.USER.AUTH_PROVIDER.v1', NEW.id),
    (NEW.id, 'signup_date', NOW()::TEXT, 'datetime', 'HERA.USER.SIGNUP_DATE.v1', NEW.id),
    (NEW.id, 'full_name', user_name, 'text', 'HERA.USER.FULL_NAME.v1', NEW.id);
    
    -- Add phone if provided
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        INSERT INTO public.core_dynamic_data(
            entity_id, 
            field_name, 
            field_value,
            field_type,
            smart_code,
            created_by
        ) VALUES
        (NEW.id, 'phone', NEW.phone, 'text', 'HERA.USER.PHONE.v1', NEW.id);
    END IF;
    
    -- Create membership (upsert to handle re-registration)
    INSERT INTO public.core_memberships(
        organization_id,
        user_id,
        role,
        permissions,
        status,
        created_by
    ) VALUES (
        org_uuid,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
        CASE 
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'admin' 
            THEN '["entities:*", "transactions:*", "reports:*", "settings:*"]'::jsonb
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'manager'
            THEN '["entities:*", "transactions:*", "reports:read"]'::jsonb
            ELSE '["entities:read", "transactions:read", "reports:read"]'::jsonb
        END,
        'active',
        NEW.id
    )
    ON CONFLICT (organization_id, user_id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        status = EXCLUDED.status,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_app_catalog_register_v1"("p_app_code" "text", "p_page_codes" "text"[], "p_actor_user" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  c_platform uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_id      uuid;
  v_code        text;
  v_page_tpl_id uuid;

  v_app_sc    text := public._hera_sc_build(ARRAY['HERA','UNIVERSAL','CATALOG','APP','ENTRY','TEMPLATE'], 1);
  v_page_sc   text := public._hera_sc_build(ARRAY['HERA','UNIVERSAL','CATALOG','PAGE','PERMISSION','TEMPLATE'], 1);
  v_rel_ap_sc text := public._hera_sc_build(ARRAY['HERA','UNIVERSAL','REL','APP','HASPAGE','LINK'], 1);
BEGIN
  -- Basic input guards
  IF coalesce(trim(p_app_code),'') = '' THEN
    RAISE EXCEPTION 'app_code required';
  END IF;
  IF p_actor_user IS NULL THEN
    RAISE EXCEPTION 'actor_user required';
  END IF;

  -- Must have at least one page
  IF p_page_codes IS NULL OR array_length(p_page_codes,1) IS NULL THEN
    RAISE EXCEPTION 'at_least_one_page_required';
  END IF;

  -- Upsert APP (platform)
  INSERT INTO public.core_entities(
    organization_id, entity_type, entity_name, entity_code,
    smart_code, smart_code_status, status, metadata, created_by, updated_by
  ) VALUES (
    c_platform, 'APP', upper(p_app_code), upper(p_app_code),
    v_app_sc, 'LIVE', 'active', '{}'::jsonb, p_actor_user, p_actor_user
  )
  ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE
    SET entity_name = EXCLUDED.entity_name,
        updated_by  = p_actor_user,
        updated_at  = now()
  RETURNING id INTO v_app_id;

  -- Ensure PAGE templates + APP→PAGE link
  FOREACH v_code IN ARRAY p_page_codes LOOP
    -- Validate page codes: caller must NOT include PAGE_ prefix
    IF v_code ~ '^PAGE_' THEN
      RAISE EXCEPTION 'page_code should not include PAGE_ prefix: %', v_code;
    END IF;
    IF coalesce(trim(v_code),'') = '' THEN
      RAISE EXCEPTION 'page_code cannot be empty';
    END IF;

    INSERT INTO public.core_entities(
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status, metadata, created_by, updated_by
    ) VALUES (
      c_platform, 'PAGE_PERMISSION', ('PAGE_'||upper(v_code)), ('PAGE_'||upper(v_code)),
      v_page_sc, 'LIVE', 'active',
      jsonb_build_object('kind','page_template','app',upper(p_app_code)),
      p_actor_user, p_actor_user
    )
    ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE
      SET updated_by = p_actor_user, updated_at = now()
    RETURNING id INTO v_page_tpl_id;

    INSERT INTO public.core_relationships(
      organization_id, from_entity_id, to_entity_id,
      relationship_type, relationship_direction,
      relationship_data, smart_code, smart_code_status,
      is_active, created_by, updated_by
    ) VALUES (
      c_platform, v_app_id, v_page_tpl_id,
      'HAS_PAGE', 'forward',
      jsonb_build_object('source','catalog'),
      v_rel_ap_sc, 'LIVE',
      true, p_actor_user, p_actor_user
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'app', upper(p_app_code),
    'app_id', v_app_id,
    'pages', array_length(p_page_codes,1)
  );
END
$$;


ALTER FUNCTION "public"."hera_app_catalog_register_v1"("p_app_code" "text", "p_page_codes" "text"[], "p_actor_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_app_catalog_update_pages_v1"("p_app_code" "text", "p_actor_user" "uuid", "p_add_pages" "text"[] DEFAULT '{}'::"text"[], "p_remove_pages" "text"[] DEFAULT '{}'::"text"[], "p_rename_map" "jsonb" DEFAULT '{}'::"jsonb", "p_propagate" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  c_platform uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_pf_id       uuid;
  v_page_sc_tpl     text := public._hera_sc_build(ARRAY['HERA','UNIVERSAL','CATALOG','PAGE','PERMISSION','TEMPLATE'], 1);
  v_rel_ap_sc       text := public._hera_sc_build(ARRAY['HERA','UNIVERSAL','REL','APP','HASPAGE','LINK'], 1);
  v_tenant_page_sc  text := public._hera_sc_build(ARRAY['HERA','UNIVERSAL','PERMISSION','PAGE','TENANT','CLONE'], 1);

  v_code     text;
  v_new_code text;
  v_tpl_id   uuid;

  v_rows                int := 0;
  v_tenants_affected    int := 0;
  v_tenants_affected_accum int := 0;
BEGIN
  IF coalesce(trim(p_app_code),'') = '' THEN
    RAISE EXCEPTION 'app_code required';
  END IF;
  IF p_actor_user IS NULL THEN
    RAISE EXCEPTION 'actor_user required';
  END IF;

  -- Find platform APP
  SELECT id INTO v_app_pf_id
  FROM public.core_entities
  WHERE organization_id = c_platform
    AND entity_type = 'APP'
    AND entity_code = upper(p_app_code)
  LIMIT 1;

  IF v_app_pf_id IS NULL THEN
    RAISE EXCEPTION 'app_not_found_in_catalog: %', upper(p_app_code);
  END IF;

  /* ================== ADD PAGES ================== */
  FOREACH v_code IN ARRAY coalesce(p_add_pages,'{}') LOOP
    IF v_code ~ '^PAGE_' THEN
      RAISE EXCEPTION 'page_code should not include PAGE_ prefix: %', v_code;
    END IF;
    IF coalesce(trim(v_code),'') = '' THEN
      RAISE EXCEPTION 'page_code cannot be empty';
    END IF;

    -- Ensure platform PAGE template
    INSERT INTO public.core_entities(
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status, metadata, created_by, updated_by
    ) VALUES (
      c_platform, 'PAGE_PERMISSION', ('PAGE_'||upper(v_code)), ('PAGE_'||upper(v_code)),
      v_page_sc_tpl, 'LIVE', 'active',
      jsonb_build_object('kind','page_template','app',upper(p_app_code)),
      p_actor_user, p_actor_user
    )
    ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE
      SET status='active', updated_by=p_actor_user, updated_at=now()
    RETURNING id INTO v_tpl_id;

    -- Link APP→PAGE template
    INSERT INTO public.core_relationships(
      organization_id, from_entity_id, to_entity_id,
      relationship_type, relationship_direction,
      relationship_data, smart_code, smart_code_status,
      is_active, created_by, updated_by
    ) VALUES (
      c_platform, v_app_pf_id, v_tpl_id,
      'HAS_PAGE', 'forward',
      jsonb_build_object('source','catalog'),
      v_rel_ap_sc, 'LIVE',
      true, p_actor_user, p_actor_user
    ) ON CONFLICT DO NOTHING;

    -- Propagate to tenants: clone PAGE into tenant if installed
    IF p_propagate THEN
      WITH tenants AS (
        SELECT DISTINCT cr.organization_id
        FROM public.core_relationships cr
        WHERE cr.organization_id <> c_platform
          AND cr.to_entity_id = v_app_pf_id
          AND cr.relationship_type = 'USES_APP'
          AND coalesce(cr.is_active,true)
      )
      INSERT INTO public.core_entities(
        organization_id, entity_type, entity_name, entity_code,
        smart_code, smart_code_status, status, metadata, created_by, updated_by
      )
      SELECT t.organization_id, 'PAGE_PERMISSION', ('PAGE_'||upper(v_code)), ('PAGE_'||upper(v_code)),
             v_tenant_page_sc, 'LIVE', 'active',
             jsonb_build_object('app', upper(p_app_code), 'source','catalog_clone'),
             p_actor_user, p_actor_user
      FROM tenants t
      ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE
        SET status='active', updated_by=p_actor_user, updated_at=now();

      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_tenants_affected_accum := v_tenants_affected_accum + v_rows;
    END IF;
  END LOOP;

  /* ================== REMOVE PAGES ================== */
  FOREACH v_code IN ARRAY coalesce(p_remove_pages,'{}') LOOP
    IF v_code ~ '^PAGE_' THEN
      RAISE EXCEPTION 'page_code should not include PAGE_ prefix: %', v_code;
    END IF;

    -- Safety: block removal of critical pages (customize list as needed)
    IF upper(v_code) = ANY(ARRAY['SALON_DASHBOARD','LOGIN','PROFILE']) THEN
      RAISE EXCEPTION 'cannot_remove_critical_page: %', v_code;
    END IF;

    -- Warn if not found in catalog
    IF NOT EXISTS (
      SELECT 1 FROM public.core_entities
      WHERE organization_id = c_platform
        AND entity_type = 'PAGE_PERMISSION'
        AND entity_code = ('PAGE_'||upper(v_code))
    ) THEN
      RAISE WARNING 'page_not_found_in_catalog: %', v_code;
    END IF;

    -- Archive template at platform
    UPDATE public.core_entities
    SET status='archived', updated_by=p_actor_user, updated_at=now()
    WHERE organization_id = c_platform
      AND entity_type='PAGE_PERMISSION'
      AND entity_code=('PAGE_'||upper(v_code));

    -- Remove APP→PAGE link
    DELETE FROM public.core_relationships
    WHERE organization_id = c_platform
      AND relationship_type='HAS_PAGE'
      AND to_entity_id IN (
        SELECT id FROM public.core_entities
        WHERE organization_id=c_platform AND entity_type='PAGE_PERMISSION'
          AND entity_code=('PAGE_'||upper(v_code))
      );

    -- Propagate to tenants (archive tenant pages)
    IF p_propagate THEN
      UPDATE public.core_entities
      SET status='archived', updated_by=p_actor_user, updated_at=now()
      WHERE organization_id <> c_platform
        AND entity_type='PAGE_PERMISSION'
        AND entity_code=('PAGE_'||upper(v_code))
        AND (metadata->>'app') = upper(p_app_code);

      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_tenants_affected_accum := v_tenants_affected_accum + v_rows;
    END IF;
  END LOOP;

  /* ================== RENAME PAGES ================== */
  IF jsonb_typeof(p_rename_map)='object' THEN
    FOR v_code, v_new_code IN
      SELECT key::text, value::text FROM jsonb_each(p_rename_map)
    LOOP
      IF v_code ~ '^PAGE_' OR v_new_code ~ '^PAGE_' THEN
        RAISE EXCEPTION 'do not include PAGE_ in rename map keys/values: % -> %', v_code, v_new_code;
      END IF;

      -- Prevent renaming to an existing target code (platform)
      IF EXISTS (
        SELECT 1 FROM public.core_entities
        WHERE organization_id=c_platform
          AND entity_type='PAGE_PERMISSION'
          AND entity_code=('PAGE_'||upper(v_new_code))
          AND entity_code <> ('PAGE_'||upper(v_code))
      ) THEN
        RAISE EXCEPTION 'rename_conflict: target already exists %', v_new_code;
      END IF;

      -- Platform rename (in-place)
      UPDATE public.core_entities
      SET entity_code=('PAGE_'||upper(v_new_code)),
          entity_name=('PAGE_'||upper(v_new_code)),
          updated_by=p_actor_user, updated_at=now()
      WHERE organization_id=c_platform
        AND entity_type='PAGE_PERMISSION'
        AND entity_code=('PAGE_'||upper(v_code));

      -- Propagate rename to tenants (keep relationships by id intact)
      IF p_propagate THEN
        UPDATE public.core_entities
        SET entity_code=('PAGE_'||upper(v_new_code)),
            entity_name=('PAGE_'||upper(v_new_code)),
            updated_by=p_actor_user, updated_at=now()
        WHERE organization_id <> c_platform
          AND entity_type='PAGE_PERMISSION'
          AND entity_code=('PAGE_'||upper(v_code))
          AND (metadata->>'app') = upper(p_app_code);

        GET DIAGNOSTICS v_rows = ROW_COUNT;
        v_tenants_affected_accum := v_tenants_affected_accum + v_rows;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'app', upper(p_app_code),
    'added',    coalesce(array_length(p_add_pages,1),0),
    'removed',  coalesce(array_length(p_remove_pages,1),0),
    'renamed',  (CASE WHEN jsonb_typeof(p_rename_map)='object'
                 THEN (SELECT count(*)::int FROM jsonb_object_keys(p_rename_map))
                 ELSE 0 END),
    'propagated', p_propagate,
    'tenants_affected', v_tenants_affected_accum
  );
END
$$;


ALTER FUNCTION "public"."hera_app_catalog_update_pages_v1"("p_app_code" "text", "p_actor_user" "uuid", "p_add_pages" "text"[], "p_remove_pages" "text"[], "p_rename_map" "jsonb", "p_propagate" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  -- Canonical PLATFORM org UUID (where all APP entities live)
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_id   uuid := NULLIF((p_selector->>'id')::uuid, NULL);
  v_code text := NULLIF(TRIM(p_selector->>'code'), '');

  v_row public.core_entities%rowtype;
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
    AND e.entity_type     = 'APP'
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
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed in HERA DNA smart codes',
      v_row.smart_code;
  END IF;

  -- If selector used code, ensure smart_code segment 5 matches it
  -- FIXED: Changed closing quote from ' to $ for proper regex grouping
  IF v_code IS NOT NULL
     AND REGEXP_REPLACE(v_row.smart_code, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_code THEN
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
      'id',           v_row.id,
      'name',         v_row.entity_name,
      'code',         v_row.entity_code,
      'smart_code',   v_row.smart_code,
      'status',       v_row.status,
      'business_rules', v_row.business_rules,
      'metadata',     v_row.metadata,
      'created_at',   v_row.created_at,
      'updated_at',   v_row.updated_at
    )
  );
END;
$_$;


ALTER FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") IS 'Fetch a single PLATFORM APP by id or code. Enforces UPPERCASE code and validates smart_code = HERA.PLATFORM.APP.ENTITY.<CODE>.vN.
   Read-only (STABLE) function for querying global APP catalog. v1.0 - Production Ready';



CREATE OR REPLACE FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
  DECLARE
    c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

    v_code    text := NULLIF(TRIM(p_filters->>'code'), '');
    v_status  text := NULLIF(TRIM(p_filters->>'status'), '');
    v_q       text := NULLIF(TRIM(p_filters->>'q'), '');
    v_sc_pref text := NULLIF(TRIM(p_filters->>'smart_code_prefix'), '');

    v_limit   int  := COALESCE(NULLIF(p_filters->>'limit','')::int, 50);
    v_offset  int  := COALESCE(NULLIF(p_filters->>'offset','')::int, 0);

    v_total   int;
    v_items   jsonb := '[]'::jsonb;
  BEGIN
    IF p_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'hera_apps_list_v1: p_actor_user_id is required';
    END IF;

    -- Guard limit/offset
    v_limit  := LEAST(GREATEST(v_limit, 0), 500);
    v_offset := GREATEST(v_offset, 0);

    -- Validate status if provided
    IF v_status IS NOT NULL AND v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'Invalid status "%": use active|inactive|archived', v_status;
    END IF;

    -- Optional code format: if provided, enforce UPPERCASE alnum
    IF v_code IS NOT NULL AND (v_code <> UPPER(v_code) OR v_code !~ '^[A-Z0-9]+$') THEN
      RAISE EXCEPTION 'Invalid code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_code;
    END IF;

    -- Total count (for pagination)
    SELECT COUNT(*)::int INTO v_total
    FROM public.core_entities e
    WHERE e.organization_id = c_platform_org
      AND e.entity_type = 'APP'
      AND (v_code   IS NULL OR e.entity_code = v_code)
      AND (v_status IS NULL OR e.status = v_status)
      AND (v_sc_pref IS NULL OR e.smart_code LIKE (v_sc_pref || '%'))
      AND (
        v_q IS NULL
        OR e.entity_name ILIKE ('%' || v_q || '%')
        OR e.entity_code ILIKE ('%' || v_q || '%')
      );

    -- Fetch page
    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_items
    FROM (
      SELECT
        e.id,
        e.entity_name   AS name,
        e.entity_code   AS code,
        e.smart_code,
        e.status,
        e.business_rules,
        e.metadata,
        e.created_at,
        e.updated_at
      FROM public.core_entities e
      WHERE e.organization_id = c_platform_org
        AND e.entity_type = 'APP'
        AND (v_code   IS NULL OR e.entity_code = v_code)
        AND (v_status IS NULL OR e.status = v_status)
        AND (v_sc_pref IS NULL OR e.smart_code LIKE (v_sc_pref || '%'))
        AND (
          v_q IS NULL
          OR e.entity_name ILIKE ('%' || v_q || '%')
          OR e.entity_code ILIKE ('%' || v_q || '%')
        )
      ORDER BY e.entity_name, e.entity_code
      LIMIT v_limit OFFSET v_offset
    ) t;

    RETURN jsonb_build_object(
      'action','LIST',
      'items',  v_items,
      'total',  v_total,
      'limit',  v_limit,
      'offset', v_offset
    );
  END;
  $_$;


ALTER FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb") IS 'List global APPs in PLATFORM org with filters (code, status, q, smart_code_prefix) and pagination.
  v1.0';



CREATE OR REPLACE FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
  DECLARE
    c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

    v_code   text := NULLIF(TRIM(p_payload->>'code'), '');
    v_name   text := NULLIF(TRIM(p_payload->>'name'), '');
    v_smart  text := NULLIF(TRIM(p_payload->>'smart_code'), '');
    v_status text := COALESCE(NULLIF(TRIM(p_payload->>'status'), ''), 'active');

    v_rules  jsonb := COALESCE(p_payload->'business_rules', '{}'::jsonb);
    v_meta   jsonb := COALESCE(p_payload->'metadata', '{}'::jsonb);

    v_row    public.core_entities%rowtype;
    v_sc_code text;   -- segment 5 from smart_code
  BEGIN
    IF p_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'hera_apps_register_v1: p_actor_user_id is required';
    END IF;

    -- Required fields
    IF v_code IS NULL THEN RAISE EXCEPTION 'code is required'; END IF;
    IF v_name IS NULL THEN RAISE EXCEPTION 'name is required'; END IF;
    IF v_smart IS NULL THEN RAISE EXCEPTION 'smart_code is required'; END IF;

    -- Validate code: UPPERCASE alnum only, no underscores/spaces
    IF v_code <> UPPER(v_code) OR v_code !~ '^[A-Z0-9]+$' THEN
      RAISE EXCEPTION 'Invalid code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_code;
    END IF;

    -- Validate status
    IF v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'Invalid status "%": use active|inactive|archived', v_status;
    END IF;

    -- Validate smart_code: must be HERA.PLATFORM.APP.ENTITY.<CODE>.vN
    -- Enforces exact 6 segments with strict pattern
    IF v_smart !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
      RAISE EXCEPTION 'Invalid smart_code "%": must be HERA.PLATFORM.APP.ENTITY.<CODE>.vN (6 segments; last
  is lowercase version)', v_smart;
    END IF;

    -- Reject underscores anywhere in smart_code
    IF POSITION('_' IN v_smart) > 0 THEN
      RAISE EXCEPTION 'Invalid smart_code "%": underscores are not allowed', v_smart;
    END IF;

    -- Extract segment 5 (the <CODE> part) and ensure it matches entity_code
    SELECT REGEXP_REPLACE(v_smart, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1')
      INTO v_sc_code;

    IF v_sc_code IS NULL OR v_sc_code <> v_code THEN
      RAISE EXCEPTION 'smart_code segment 5 "%" must match code "%"', v_sc_code, v_code;
    END IF;

    -- Uniqueness check within PLATFORM org
    PERFORM 1
    FROM public.core_entities
    WHERE organization_id = c_platform_org
      AND entity_type = 'APP'
      AND (entity_code = v_code OR smart_code = v_smart);
    IF FOUND THEN
      RAISE EXCEPTION 'Duplicate APP: code or smart_code already exists in PLATFORM org';
    END IF;

    -- Insert APP entity
    INSERT INTO public.core_entities (
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status,
      business_rules, metadata, created_by, updated_by
    )
    VALUES (
      c_platform_org, 'APP', v_name, v_code,
      v_smart, 'LIVE', v_status,
      v_rules, v_meta, p_actor_user_id, p_actor_user_id
    )
    RETURNING * INTO v_row;

    RETURN jsonb_build_object('action','REGISTER', 'app', to_jsonb(v_row));
  END;
  $_$;


ALTER FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") IS 'Register global APP in PLATFORM org. Enforces code (UPPERCASE alnum), smart_code =
  HERA.PLATFORM.APP.ENTITY.<CODE>.vN, uniqueness. v1.1';



CREATE OR REPLACE FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
  DECLARE
    c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

    v_id    uuid := NULLIF((p_payload->>'id')::uuid, NULL);
    v_code  text := NULLIF(TRIM(p_payload->>'code'), '');

    v_name   text := NULLIF(TRIM(p_payload->>'name'), '');
    v_status text := NULLIF(TRIM(p_payload->>'status'), '');
    v_rules  jsonb := p_payload->'business_rules';
    v_meta   jsonb := p_payload->'metadata';

    v_new_code  text := NULLIF(TRIM(p_payload->>'new_code'), '');
    v_new_smart text := NULLIF(TRIM(p_payload->>'new_smart_code'), '');

    v_row  public.core_entities%rowtype;
    v_sc_code text;
  BEGIN
    IF p_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'hera_apps_update_v1: p_actor_user_id is required';
    END IF;

    IF v_id IS NULL AND v_code IS NULL THEN
      RAISE EXCEPTION 'Provide "id" or "code" to identify the APP';
    END IF;

    -- Validate code identifier format if provided
    IF v_code IS NOT NULL AND (v_code <> UPPER(v_code) OR v_code !~ '^[A-Z0-9]+$') THEN
      RAISE EXCEPTION 'Invalid code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_code;
    END IF;

    -- Fetch target row
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
      RAISE EXCEPTION 'APP not found in PLATFORM org';
    END IF;

    -- Validate status if provided
    IF v_status IS NOT NULL AND v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'Invalid status "%": use active|inactive|archived', v_status;
    END IF;

    -- === Rename validations (optional) ===

    -- Validate new_code if provided
    IF v_new_code IS NOT NULL THEN
      IF v_new_code <> UPPER(v_new_code) OR v_new_code !~ '^[A-Z0-9]+$' THEN
        RAISE EXCEPTION 'Invalid new_code "%": must be UPPERCASE alphanumeric with no underscores/spaces',
  v_new_code;
      END IF;

      -- Check uniqueness for new_code
      PERFORM 1
      FROM public.core_entities
      WHERE organization_id = c_platform_org
        AND entity_type = 'APP'
        AND entity_code = v_new_code
        AND id <> v_row.id;
      IF FOUND THEN
        RAISE EXCEPTION 'new_code "%" already exists in PLATFORM org', v_new_code;
      END IF;
    END IF;

    -- Validate new_smart_code if provided
    IF v_new_smart IS NOT NULL THEN
      -- Strict pattern: HERA.PLATFORM.APP.ENTITY.<NEWCODE>.vN
      IF v_new_smart !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
        RAISE EXCEPTION 'Invalid new_smart_code "%": must be HERA.PLATFORM.APP.ENTITY.<CODE>.vN',
  v_new_smart;
      END IF;

      -- Reject underscores
      IF POSITION('_' IN v_new_smart) > 0 THEN
        RAISE EXCEPTION 'Invalid new_smart_code "%": underscores are not allowed', v_new_smart;
      END IF;

      -- Extract segment 5 (the <CODE> part)
      SELECT REGEXP_REPLACE(v_new_smart, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1')
        INTO v_sc_code;

      -- Validate segment 5 matches new_code or current code
      IF v_new_code IS NOT NULL THEN
        -- Both new_code and new_smart_code provided - they must match
        IF v_sc_code <> v_new_code THEN
          RAISE EXCEPTION 'new_smart_code segment 5 "%" must match new_code "%"', v_sc_code, v_new_code;
        END IF;
      ELSE
        -- Only new_smart_code provided - must match current code
        IF v_sc_code <> v_row.entity_code THEN
          RAISE EXCEPTION 'new_smart_code segment 5 "%" must match current code "%"', v_sc_code,
  v_row.entity_code;
        END IF;
      END IF;

      -- Check uniqueness for new_smart_code
      PERFORM 1
      FROM public.core_entities
      WHERE organization_id = c_platform_org
        AND entity_type = 'APP'
        AND smart_code = v_new_smart
        AND id <> v_row.id;
      IF FOUND THEN
        RAISE EXCEPTION 'new_smart_code already exists in PLATFORM org';
      END IF;
    END IF;

    -- Apply updates (only fields provided in payload)
    UPDATE public.core_entities e
    SET
      entity_name    = COALESCE(v_name, e.entity_name),
      status         = COALESCE(v_status, e.status),
      business_rules = COALESCE(v_rules, e.business_rules),
      metadata       = COALESCE(v_meta, e.metadata),
      entity_code    = COALESCE(v_new_code, e.entity_code),
      smart_code     = COALESCE(v_new_smart, e.smart_code),
      updated_by     = p_actor_user_id,
      updated_at     = now()
    WHERE e.id = v_row.id
    RETURNING * INTO v_row;

    RETURN jsonb_build_object('action','UPDATE','app', to_jsonb(v_row));
  END;
  $_$;


ALTER FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") IS 'Update global APP (PLATFORM org). Validates status; optional rename with new_code/new_smart_code
  matching HERA.PLATFORM.APP.ENTITY.<CODE>.vN. v1.0';



CREATE OR REPLACE FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT organization_id INTO v_org_id
    FROM universal_transactions
    WHERE id = p_transaction_id;

    IF v_org_id IS NULL OR v_org_id <> p_org_id THEN
        RAISE EXCEPTION 'ORG_MISMATCH: transaction % not in organization %', p_transaction_id, p_org_id
        USING ERRCODE = 'P0001';
    END IF;
END;
$$;


ALTER FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_assign_membership_v1"("p_user_entity" "uuid", "p_tenant_org" "uuid", "p_role" "text" DEFAULT NULL::"text", "p_system_actor" "uuid" DEFAULT NULL::"uuid", "p_version" "text" DEFAULT 'v1'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_rel_id uuid;
  v_smart_code text;
begin
  -- Create/verify MEMBER_OF relationship (idempotent)
  select id into v_rel_id 
  from public.core_relationships
  where organization_id = p_tenant_org
    and relationship_type = 'MEMBER_OF'
    and from_entity_id = p_user_entity
    and to_entity_id = p_tenant_org
  limit 1;

  if v_rel_id is null then
    v_smart_code := format('HERA.SALON.REL.TYPE.MEMBER_OF.%s', lower(p_version));
    insert into public.core_relationships(
      id, organization_id, relationship_type,
      from_entity_id, to_entity_id, 
      smart_code, smart_code_status,
      created_by, updated_by
    ) values(
      gen_random_uuid(), p_tenant_org, 'MEMBER_OF',
      p_user_entity, p_tenant_org,
      v_smart_code, 'DRAFT',
      p_system_actor, p_system_actor
    ) 
    on conflict do nothing;
  end if;

  -- Create/update USER_ROLE relationship (if role provided)
  if coalesce(trim(p_role),'') <> '' then
    v_smart_code := format('HERA.SALON.REL.TYPE.USER_ROLE.%s', lower(p_version));
    
    -- First try to update existing role
    update public.core_relationships
    set relationship_data = jsonb_build_object('role_code', upper(p_role)),
        updated_by = p_system_actor,
        updated_at = now()
    where organization_id = p_tenant_org
      and relationship_type = 'USER_ROLE'
      and from_entity_id = p_user_entity
      and to_entity_id = p_tenant_org;
    
    -- If no existing role found, create new one
    if not found then
      insert into public.core_relationships(
        id, organization_id, relationship_type,
        from_entity_id, to_entity_id,
        relationship_data,
        smart_code, smart_code_status,
        created_by, updated_by
      ) values(
        gen_random_uuid(), p_tenant_org, 'USER_ROLE',
        p_user_entity, p_tenant_org,
        jsonb_build_object('role_code', upper(p_role)),
        v_smart_code, 'DRAFT',
        p_system_actor, p_system_actor
      )
      on conflict do nothing;
    end if;
  end if;
end $$;


ALTER FUNCTION "public"."hera_assign_membership_v1"("p_user_entity" "uuid", "p_tenant_org" "uuid", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  return jsonb_build_object('ok', true, 'job_id', gen_random_uuid());

end;

$$;


ALTER FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) RETURNS SETOF "record"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  -- Columns: timestamp timestamptz, action text, resource text, details jsonb, ip_address text, user_agent text

  return query

    select now() as timestamp, 'action'::text as action, 'resource'::text as resource, '{}'::jsonb as details, null::text as ip_address, null::text as user_agent

    limit coalesce(p_limit, 50) offset coalesce(p_offset, 0);

end;

$$;


ALTER FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) IS 'returns: timestamp timestamptz, action text, resource text, details jsonb, ip_address text, user_agent text';



CREATE OR REPLACE FUNCTION "public"."hera_audit_operation_v2"("p_organization_id" "uuid", "p_operation_type" "text", "p_operation_details" "jsonb", "p_smart_code" "text" DEFAULT 'HERA.ACCOUNTING.AUDIT.OPERATION.v2'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata,
        created_at
    ) VALUES (
        p_organization_id,
        'AUDIT_TRAIL',
        p_smart_code,
        jsonb_build_object(
            'operation_type', p_operation_type,
            'operation_details', p_operation_details,
            'user_context', current_setting('app.current_user', true),
            'session_id', current_setting('app.session_id', true),
            'audit_timestamp', NOW()
        ),
        NOW()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;


ALTER FUNCTION "public"."hera_audit_operation_v2"("p_organization_id" "uuid", "p_operation_type" "text", "p_operation_details" "jsonb", "p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result jsonb;
  v_now timestamptz := now();
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_auth_introspect_v1: p_actor_user_id is required';
  END IF;

  WITH memberships AS (
    SELECT cr.organization_id, cr.created_at AS joined_at, cr.updated_at AS last_updated
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
      o.settings          AS org_settings,
      m.joined_at,
      m.last_updated
    FROM memberships m
    JOIN public.core_organizations o ON o.id = m.organization_id
  ),
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
  primary_roles AS (
    SELECT DISTINCT ON (r.organization_id)
      r.organization_id,
      r.role_code AS primary_role
    FROM roles_per_org r
    ORDER BY r.organization_id, r.is_primary DESC, public._hera_role_rank(r.role_code) ASC, r.role_code ASC
  ),
  roles_agg AS (
    SELECT r.organization_id,
           jsonb_agg(r.role_code ORDER BY public._hera_role_rank(r.role_code), r.role_code) AS roles_json
    FROM (SELECT DISTINCT organization_id, role_code FROM roles_per_org) r
    GROUP BY r.organization_id
  ),
  apps_per_org AS (
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
    SELECT
      o.organization_id                         AS id,
      o.organization_code                       AS code,
      o.organization_name                       AS name,
      o.organization_status                     AS status,
      o.org_settings                            AS settings,
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
    SELECT * FROM rolled
    ORDER BY joined_at DESC NULLS LAST, name
  ),
  idlist AS (
    SELECT array_agg(id::uuid ORDER BY joined_at DESC NULLS LAST, name) AS ids
    FROM ordered
  ),
  counts AS (
    SELECT COUNT(*)::int AS organization_count FROM ordered
  ),
  platform_admin_flag AS (
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
    SELECT ids[1] AS id FROM idlist
  ),
  default_app_calc AS (
    SELECT
      d0.id AS org_id,
      CASE
        WHEN d0.id IS NULL THEN NULL
        ELSE (
          WITH orgrow AS (
            SELECT * FROM ordered WHERE id = d0.id
          ),
          setting_code AS (
            SELECT NULLIF(TRIM((SELECT settings->>'default_app_code' FROM orgrow)), '') AS code
          ),
          installed AS (
            SELECT jsonb_array_elements((SELECT apps FROM orgrow)) AS app
          )
          SELECT COALESCE(
            (SELECT (app->>'code')::text FROM installed, setting_code sc
             WHERE sc.code IS NOT NULL AND (app->>'code') = sc.code
             LIMIT 1),
            (SELECT (app->>'code')::text FROM installed LIMIT 1)
          )
        )
      END AS default_app
    FROM default_org d0
  )
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
$$;


ALTER FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") IS 'Login snapshot with orgs/roles plus apps[] (active ORG_HAS_APP) and default_app derived from org.settings.default_app_code or first installed app.';



CREATE OR REPLACE FUNCTION "public"."hera_debug_context"() RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'jwt_claims', current_setting('request.jwt.claims', true)::json,
    'headers', current_setting('request.headers', true)::json,
    'current_org_id', hera_current_org_id(),
    'is_demo_session', hera_is_demo_session(),
    'app_current_org_id', current_setting('app.current_org_id', true)
  );
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."hera_debug_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count_input  integer := 0;
  v_count_upsert integer := 0;
  v_count_skip   integer := 0;
  v_now          timestamptz := now();
  v_err_context  text;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'HERA_DYN_BATCH_REQUIRED: organization_id and entity_id are required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_items) LIMIT 1)
  THEN
    RETURN jsonb_build_object(
      'success', true,
      'organization_id', p_organization_id,
      'entity_id', p_entity_id,
      'upserted', 0,
      'skipped', 0,
      'message', 'No items to process'
    );
  END IF;

  -- Count inputs
  SELECT count(*) INTO v_count_input FROM jsonb_array_elements(p_items);

  -- Validate smart_code presence (guardrail) and field_name
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS e(item)
    WHERE coalesce(e.item->>'field_name','') = ''
       OR coalesce(e.item->>'smart_code','') = ''
  ) THEN
    RAISE EXCEPTION 'HERA_DYN_BATCH_PAYLOAD_INVALID: each item requires field_name and smart_code';
  END IF;

  -- Upsert all items
  WITH src AS (
    SELECT
      p_organization_id                            AS organization_id,
      p_entity_id                                  AS entity_id,
      (item->>'field_name')                        AS field_name,
      coalesce(item->>'field_type','text')         AS field_type,
      NULLIF(item->>'field_value_text','')         AS field_value_text,
      CASE WHEN (item ? 'field_value_number')  THEN (item->>'field_value_number')::numeric END AS field_value_number,
      CASE WHEN (item ? 'field_value_boolean') THEN (item->>'field_value_boolean')::boolean END AS field_value_boolean,
      CASE WHEN (item ? 'field_value_date')    THEN (item->>'field_value_date')::timestamptz  END AS field_value_date,
      CASE WHEN (item ? 'field_value_json')    THEN  item->'field_value_json'                 END AS field_value_json,
      NULLIF(item->>'smart_code','')               AS smart_code,
      NULLIF(item->>'smart_code_status','')        AS smart_code_status,
      CASE WHEN (item ? 'ai_confidence')     THEN (item->>'ai_confidence')::numeric END AS ai_confidence,
      CASE WHEN (item ? 'ai_insights')       THEN  item->'ai_insights'               END AS ai_insights,
      CASE WHEN (item ? 'validation_rules')  THEN  item->'validation_rules'          END AS validation_rules,
      NULLIF(item->>'validation_status','')        AS validation_status,
      CASE WHEN (item ? 'field_order')       THEN (item->>'field_order')::int        END AS field_order,
      CASE WHEN (item ? 'is_required')       THEN (item->>'is_required')::boolean    END AS is_required,
      CASE WHEN (item ? 'is_searchable')     THEN (item->>'is_searchable')::boolean  END AS is_searchable,
      CASE WHEN (item ? 'is_system_field')   THEN (item->>'is_system_field')::boolean END AS is_system_field,
      NULLIF(item->>'ai_enhanced_value','')        AS ai_enhanced_value,
      NULLIF(item->>'field_value_file_url','')     AS field_value_file_url,
      CASE WHEN (item ? 'calculated_value')  THEN  item->'calculated_value'          END AS calculated_value
    FROM jsonb_array_elements(p_items) AS e(item)
  ),
  upserted AS (
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type,
      field_value_text, field_value_number, field_value_boolean, field_value_date, field_value_json,
      smart_code, smart_code_status,
      ai_confidence, ai_insights,
      validation_rules, validation_status,
      field_order, is_required, is_searchable, is_system_field,
      ai_enhanced_value, field_value_file_url, calculated_value,
      created_at, updated_at, created_by, updated_by
    )
    SELECT
      s.organization_id, s.entity_id, s.field_name, s.field_type,
      s.field_value_text, s.field_value_number, s.field_value_boolean, s.field_value_date, s.field_value_json,
      s.smart_code, coalesce(s.smart_code_status, 'DRAFT'),
      coalesce(s.ai_confidence, 0.0), coalesce(s.ai_insights, '{}'::jsonb),
      coalesce(s.validation_rules, '{}'::jsonb), coalesce(s.validation_status, 'valid'),
      coalesce(s.field_order, 1), coalesce(s.is_required, false), coalesce(s.is_searchable, true), coalesce(s.is_system_field, false),
      s.ai_enhanced_value, s.field_value_file_url, s.calculated_value,
      v_now, v_now, p_actor_user_id, p_actor_user_id
    FROM src s
    ON CONFLICT (organization_id, entity_id, field_name)
    DO UPDATE SET
      field_type          = EXCLUDED.field_type,
      field_value_text    = EXCLUDED.field_value_text,
      field_value_number  = EXCLUDED.field_value_number,
      field_value_boolean = EXCLUDED.field_value_boolean,
      field_value_date    = EXCLUDED.field_value_date,
      field_value_json    = EXCLUDED.field_value_json,
      smart_code          = EXCLUDED.smart_code,
      smart_code_status   = COALESCE(EXCLUDED.smart_code_status, core_dynamic_data.smart_code_status),
      ai_confidence       = COALESCE(EXCLUDED.ai_confidence, core_dynamic_data.ai_confidence),
      ai_insights         = COALESCE(EXCLUDED.ai_insights,   core_dynamic_data.ai_insights),
      validation_rules    = COALESCE(EXCLUDED.validation_rules, core_dynamic_data.validation_rules),
      validation_status   = COALESCE(EXCLUDED.validation_status, core_dynamic_data.validation_status),
      field_order         = COALESCE(EXCLUDED.field_order, core_dynamic_data.field_order),
      is_required         = COALESCE(EXCLUDED.is_required, core_dynamic_data.is_required),
      is_searchable       = COALESCE(EXCLUDED.is_searchable, core_dynamic_data.is_searchable),
      is_system_field     = COALESCE(EXCLUDED.is_system_field, core_dynamic_data.is_system_field),
      ai_enhanced_value   = COALESCE(EXCLUDED.ai_enhanced_value, core_dynamic_data.ai_enhanced_value),
      field_value_file_url= COALESCE(EXCLUDED.field_value_file_url, core_dynamic_data.field_value_file_url),
      calculated_value    = COALESCE(EXCLUDED.calculated_value, core_dynamic_data.calculated_value),
      updated_at          = v_now,
      updated_by          = p_actor_user_id
    RETURNING 1
  )
  SELECT count(*) INTO v_count_upsert FROM upserted;

  -- Anything in the input that didn't have a smart_code/field_name would have errored above.
  -- Compute "skipped" as a sanity metric (should be 0 here).
  v_count_skip := GREATEST(v_count_input - v_count_upsert, 0);

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'entity_id', p_entity_id,
    'total', v_count_input,
    'upserted', v_count_upsert,
    'skipped', v_count_skip
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err_context = PG_EXCEPTION_CONTEXT;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'context', v_err_context
  );
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_deleted_count bigint := 0;
  v_err_context   text;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'HERA_DYN_DELETE_REQUIRED: organization_id and entity_id are required';
  END IF;

  IF p_field_name IS NULL THEN
    DELETE FROM core_dynamic_data d
     WHERE d.organization_id = p_organization_id
       AND d.entity_id       = p_entity_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  ELSE
    DELETE FROM core_dynamic_data d
     WHERE d.organization_id = p_organization_id
       AND d.entity_id       = p_entity_id
       AND d.field_name      = p_field_name;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'entity_id', p_entity_id,
    'field_name', p_field_name,
    'deleted_count', v_deleted_count
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err_context = PG_EXCEPTION_CONTEXT;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'context', v_err_context
  );
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_field_name" "text" DEFAULT NULL::"text", "p_field_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
    v_total_count INTEGER;
BEGIN
    -- Validate organization_id
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA: organization_id is required';
    END IF;

    -- Get dynamic data with filters
    WITH filtered_data AS (
        SELECT dd.*
        FROM core_dynamic_data dd
        WHERE dd.organization_id = p_organization_id
        AND (p_entity_id IS NULL OR dd.entity_id = p_entity_id)
        AND (p_field_name IS NULL OR dd.field_name = p_field_name)
        AND (p_field_type IS NULL OR dd.field_type = p_field_type)
        ORDER BY dd.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    data_result AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', dd.id,
                'organization_id', dd.organization_id,
                'entity_id', dd.entity_id,
                'field_name', dd.field_name,
                'field_type', dd.field_type,
                'field_value_text', dd.field_value_text,
                'field_value_number', dd.field_value_number,
                'field_value_boolean', dd.field_value_boolean,
                'field_value_date', dd.field_value_date,
                'field_value_json', dd.field_value_json,
                'smart_code', dd.smart_code,
                -- REMOVED: 'metadata', dd.metadata (column doesn't exist)
                'created_at', dd.created_at,
                'updated_at', dd.updated_at,
                'created_by', dd.created_by,
                'updated_by', dd.updated_by
            )
        ) AS data,
        COUNT(*) AS total_count
        FROM filtered_data dd
    )
    SELECT
        data,
        total_count
    INTO
        v_result,
        v_total_count
    FROM data_result;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_result, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'total_count', COALESCE(v_total_count, 0),
            'returned_count', COALESCE(jsonb_array_length(v_result), 0),
            'page_size', p_limit,
            'offset', p_offset
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_limit" integer, "p_offset" integer) IS 'HERA Dynamic Data Get Function v1 - Fixed to remove dd.metadata references';



CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text" DEFAULT NULL::"text", "p_field_value_number" numeric DEFAULT NULL::numeric, "p_field_value_boolean" boolean DEFAULT NULL::boolean, "p_field_value_date" "date" DEFAULT NULL::"date", "p_field_value_json" "jsonb" DEFAULT NULL::"jsonb", "p_smart_code" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_existing_field RECORD;
    v_result_id UUID;
BEGIN
    -- Validate required parameters
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: entity_id is required';
    END IF;

    IF p_field_name IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: field_name is required';
    END IF;

    -- Check for existing field
    SELECT * INTO v_existing_field
    FROM core_dynamic_data
    WHERE entity_id = p_entity_id
    AND organization_id = p_organization_id
    AND field_name = p_field_name;
    -- Removed 'is_deleted' filter

    IF v_existing_field.id IS NOT NULL THEN
        -- Update existing field
        UPDATE core_dynamic_data SET
            field_type = COALESCE(p_field_type, field_type),
            field_value_text = p_field_value_text,
            field_value_number = p_field_value_number,
            field_value_boolean = p_field_value_boolean,
            field_value_date = p_field_value_date,
            -- Removed field_value_datetime assignment
            field_value_json = p_field_value_json,
            smart_code = COALESCE(p_smart_code, smart_code),
            metadata = COALESCE(p_metadata, metadata),
            updated_at = NOW(),
            updated_by = p_actor_user_id,
            version = version + 1
        WHERE id = v_existing_field.id;

        v_result_id := v_existing_field.id;
    ELSE
        -- Insert new field
        INSERT INTO core_dynamic_data (
            organization_id, entity_id, field_name, field_type,
            field_value_text, field_value_number, field_value_boolean,
            field_value_date, field_value_json, smart_code, metadata,
            created_by, updated_by
            -- Removed field_value_datetime from INSERT
        ) VALUES (
            p_organization_id, p_entity_id, p_field_name, p_field_type,
            p_field_value_text, p_field_value_number, p_field_value_boolean,
            p_field_value_date, p_field_value_json, p_smart_code, p_metadata,
            p_actor_user_id, p_actor_user_id
            -- Removed p_field_value_datetime from VALUES
        ) RETURNING id INTO v_result_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'id', v_result_id,
            'operation', CASE WHEN v_existing_field.id IS NOT NULL THEN 'updated' ELSE 'created' END
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_DYNAMIC_DATA_SET_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" "date", "p_field_value_json" "jsonb", "p_smart_code" "text", "p_metadata" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" "date", "p_field_value_json" "jsonb", "p_smart_code" "text", "p_metadata" "jsonb", "p_actor_user_id" "uuid") IS 'HERA Dynamic Data Set Function v1 - Fixed for actual schema';



CREATE OR REPLACE FUNCTION "public"."hera_entities_aggregate_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text" DEFAULT 'READ'::"text", "p_entity" "jsonb" DEFAULT '{}'::"jsonb", "p_dynamic" "jsonb" DEFAULT '{}'::"jsonb", "p_relationships" "jsonb" DEFAULT '{}'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  -- normalized action
  v_action                text := upper(COALESCE(p_action, 'READ'));

  -- options
  v_include_dynamic       boolean := COALESCE((p_options->>'include_dynamic')::boolean, true);
  v_include_relationships boolean := COALESCE((p_options->>'include_relationships')::boolean, true);
  v_include_reverse       boolean := COALESCE((p_options->>'include_reverse')::boolean, false);
  v_include_audit         boolean := COALESCE((p_options->>'include_audit_fields')::boolean, false);
  v_rel_types             text[]  := CASE WHEN p_options ? 'rel_types'      THEN ARRAY(SELECT jsonb_array_elements_text(p_options->'rel_types')) END;
  v_dynamic_prefix        text[]  := CASE WHEN p_options ? 'dynamic_prefix' THEN ARRAY(SELECT jsonb_array_elements_text(p_options->'dynamic_prefix')) END;
  v_after_id              uuid    := NULLIF(p_options->>'after_id','')::uuid;
  v_limit                 int     := GREATEST(1, LEAST(COALESCE((p_options->>'limit')::int, 50), 500));
  v_hard                  boolean := COALESCE((p_options->>'hard_delete')::boolean, false);
  v_operation_id          uuid    := NULLIF(p_options->>'operation_id','')::uuid; -- idempotency key (optional)

  -- selectors parsed from p_entity
  v_entity_id             uuid    := NULLIF(p_entity->>'entity_id','')::uuid;
  v_entity_type           text    := NULLIF(p_entity->>'entity_type','');
  v_entity_code           text    := NULLIF(p_entity->>'entity_code','');
  v_smart_code            text    := NULLIF(p_entity->>'smart_code','');

  -- payloads normalized
  v_dynamic_obj           jsonb   := COALESCE(p_dynamic, '{}'::jsonb);
  v_relationships_obj     jsonb   := COALESCE(p_relationships, '{}'::jsonb);

  -- results / counters
  v_id                    uuid;
  r_rel_deactivated       int := 0;
  r_del_dyn               int := 0;
  r_del_rel               int := 0;
  r_del_ent               int := 0;

  v_now                   timestamptz := now();
  v_result                jsonb;
  v_replayed              jsonb;
  v_lock_key              bigint;
BEGIN
  ---------------------------------------------------------------------------
  -- Basic gates: org & actor, option normalization, allowed actions
  ---------------------------------------------------------------------------
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ORG_REQUIRED';
  END IF;

  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ACTOR_REQUIRED';
  END IF;

  IF v_rel_types IS NOT NULL AND array_length(v_rel_types,1) = 0 THEN v_rel_types := NULL; END IF;
  IF v_dynamic_prefix IS NOT NULL AND array_length(v_dynamic_prefix,1) = 0 THEN v_dynamic_prefix := NULL; END IF;

  IF v_action NOT IN ('CREATE','UPDATE','MERGE','READ','ARCHIVE','DELETE') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = format('UNKNOWN_ACTION_%s', p_action);
  END IF;

  -- RBAC: actor must be valid for writes
  IF v_action IN ('CREATE','UPDATE','MERGE','ARCHIVE','DELETE') THEN
    PERFORM enforce_actor_requirement(p_actor_user_id, p_organization_id, 'hera_entities_aggregate_v2');
  END IF;

  -- RBAC: audit fields visibility
  IF v_include_audit THEN
    PERFORM enforce_audit_field_visibility(p_actor_user_id, p_organization_id);
  END IF;

  -- Idempotency (advisory lock + replay from entity metadata)
  IF v_action IN ('CREATE','UPDATE','MERGE','ARCHIVE','DELETE') AND v_operation_id IS NOT NULL THEN
    -- Acquire a txn-scoped advisory lock to serialize identical operations
    v_lock_key := hashtextextended(p_organization_id::text || ':' || v_operation_id::text, 0);
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- If entity_id is known, try replay directly
    v_replayed := hera_idempotency_try_replay_on_entity(
      p_organization_id, p_actor_user_id, v_operation_id, v_entity_id,
      v_include_dynamic, v_dynamic_prefix, v_include_relationships,
      v_include_reverse, v_rel_types, v_include_audit
    );
    IF v_replayed IS NOT NULL THEN
      RETURN v_replayed;
    END IF;

    -- For CREATE (no v_entity_id), try locate by stable keys (entity_code or smart_code) + op stamp
    IF v_entity_id IS NULL AND (v_entity_code IS NOT NULL OR v_smart_code IS NOT NULL) THEN
      SELECT e.id
        INTO v_id
        FROM core_entities e
       WHERE e.organization_id = p_organization_id
         AND ((v_entity_code IS NOT NULL AND e.entity_code = v_entity_code)
           OR (v_smart_code  IS NOT NULL AND e.smart_code  = v_smart_code))
         AND (e.metadata->'idempotency'->>'last_operation_id')::uuid = v_operation_id
       LIMIT 1;

      IF v_id IS NOT NULL THEN
        RETURN hera_entities_read_v2(
          p_organization_id       := p_organization_id,
          p_actor_user_id         := p_actor_user_id,
          p_entity_id             := v_id,
          p_entity_type           := NULL,
          p_code                  := NULL,
          p_after_id              := NULL,
          p_limit                 := 1,
          p_include_dynamic       := v_include_dynamic,
          p_dynamic_prefix        := v_dynamic_prefix,
          p_include_relationships := v_include_relationships,
          p_include_reverse       := v_include_reverse,
          p_rel_types             := v_rel_types,
          p_include_audit_fields  := v_include_audit
        );
      END IF;
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- CREATE / UPDATE / MERGE
  ---------------------------------------------------------------------------
  IF v_action IN ('CREATE','UPDATE','MERGE') THEN
    IF (v_action = 'UPDATE' OR (v_action = 'MERGE' AND v_entity_id IS NOT NULL)) AND v_entity_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ENTITY_ID_REQUIRED';
    END IF;

    IF COALESCE(v_smart_code,'') = '' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'SMART_CODE_REQUIRED';
    END IF;

    -- Upsert header (helper handles validation + expected_version + audit stamping)
    v_id := hera_entity_upsert_v2(p_organization_id, p_actor_user_id, p_entity);

    -- Upsert dynamic (object only)
    IF jsonb_typeof(v_dynamic_obj) = 'object' AND v_dynamic_obj <> '{}'::jsonb THEN
      PERFORM hera_dynamic_data_upsert_full_v2(p_organization_id, p_actor_user_id, v_id, v_dynamic_obj);
    END IF;

    -- Replace relationships (object only)
    IF jsonb_typeof(v_relationships_obj) = 'object' AND v_relationships_obj <> '{}'::jsonb THEN
      PERFORM hera_relationships_replace_full_v2(p_organization_id, p_actor_user_id, v_id, v_relationships_obj);
    END IF;

    -- Stamp idempotency (if present)
    IF v_operation_id IS NOT NULL THEN
      PERFORM hera_idempotency_stamp_entity(p_organization_id, v_id, p_actor_user_id, v_operation_id);
    END IF;

    -- Return canonical read
    v_result := hera_entities_read_v2(
      p_organization_id       := p_organization_id,
      p_actor_user_id         := p_actor_user_id,
      p_entity_id             := v_id,
      p_entity_type           := NULL,
      p_code                  := NULL,
      p_after_id              := NULL,
      p_limit                 := 1,
      p_include_dynamic       := v_include_dynamic,
      p_dynamic_prefix        := v_dynamic_prefix,
      p_include_relationships := v_include_relationships,
      p_include_reverse       := v_include_reverse,
      p_rel_types             := v_rel_types,
      p_include_audit_fields  := v_include_audit
    );

    RETURN v_result;

  ---------------------------------------------------------------------------
  -- READ
  ---------------------------------------------------------------------------
  ELSIF v_action = 'READ' THEN
    IF v_entity_id IS NULL AND v_entity_type IS NULL AND v_entity_code IS NULL AND v_after_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'READ_SELECTOR_REQUIRED';
    END IF;

    RETURN hera_entities_read_v2(
      p_organization_id       := p_organization_id,
      p_actor_user_id         := p_actor_user_id,
      p_entity_id             := v_entity_id,
      p_entity_type           := v_entity_type,
      p_code                  := v_entity_code,
      p_after_id              := v_after_id,
      p_limit                 := v_limit,
      p_include_dynamic       := v_include_dynamic,
      p_dynamic_prefix        := v_dynamic_prefix,
      p_include_relationships := v_include_relationships,
      p_include_reverse       := v_include_reverse,
      p_rel_types             := v_rel_types,
      p_include_audit_fields  := v_include_audit
    );

  ---------------------------------------------------------------------------
  -- ARCHIVE (soft delete + deactivate relationships)
  ---------------------------------------------------------------------------
  ELSIF v_action = 'ARCHIVE' THEN
    IF v_entity_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ENTITY_ID_REQUIRED';
    END IF;

    PERFORM 1 FROM core_entities
     WHERE id = v_entity_id AND organization_id = p_organization_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'ENTITY_NOT_FOUND';
    END IF;

    UPDATE core_entities
       SET status     = 'archived',
           updated_at = v_now,
           updated_by = p_actor_user_id,
           version    = version + 1
     WHERE id = v_entity_id AND organization_id = p_organization_id;

    UPDATE core_relationships
       SET is_active = false,
           updated_at = v_now,
           updated_by = p_actor_user_id
     WHERE organization_id = p_organization_id
       AND (from_entity_id = v_entity_id OR to_entity_id = v_entity_id)
       AND is_active = true;
    GET DIAGNOSTICS r_rel_deactivated = ROW_COUNT;

    -- Stamp idempotency for ARCHIVE
    IF v_operation_id IS NOT NULL THEN
      PERFORM hera_idempotency_stamp_entity(p_organization_id, v_entity_id, p_actor_user_id, v_operation_id);
    END IF;

    v_result := hera_entities_read_v2(
      p_organization_id       := p_organization_id,
      p_actor_user_id         := p_actor_user_id,
      p_entity_id             := v_entity_id,
      p_entity_type           := NULL,
      p_code                  := NULL,
      p_after_id              := NULL,
      p_limit                 := 1,
      p_include_dynamic       := v_include_dynamic,
      p_dynamic_prefix        := v_dynamic_prefix,
      p_include_relationships := v_include_relationships,
      p_include_reverse       := v_include_reverse,
      p_rel_types             := v_rel_types,
      p_include_audit_fields  := v_include_audit
    ) || jsonb_build_object(
      'op_summary', jsonb_build_object('relationships_deactivated', r_rel_deactivated)
    );

    RETURN v_result;

  ---------------------------------------------------------------------------
  -- DELETE (hard/soft)
  ---------------------------------------------------------------------------
  ELSIF v_action = 'DELETE' THEN
    IF v_entity_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ENTITY_ID_REQUIRED';
    END IF;

    PERFORM 1 FROM core_entities
     WHERE id = v_entity_id AND organization_id = p_organization_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'ENTITY_NOT_FOUND';
    END IF;

    IF v_hard THEN
      DELETE FROM core_relationships
       WHERE organization_id = p_organization_id
         AND (from_entity_id = v_entity_id OR to_entity_id = v_entity_id);
      GET DIAGNOSTICS r_del_rel = ROW_COUNT;

      DELETE FROM core_dynamic_data
       WHERE organization_id = p_organization_id
         AND entity_id = v_entity_id;
      GET DIAGNOSTICS r_del_dyn = ROW_COUNT;

      DELETE FROM core_entities
       WHERE organization_id = p_organization_id
         AND id = v_entity_id;
      GET DIAGNOSTICS r_del_ent = ROW_COUNT;

      -- No stamping possible after hard delete; we intentionally skip it.

      RETURN jsonb_build_object(
        'ok', true,
        'id', v_entity_id,
        'deleted', jsonb_build_object(
          'relationships', r_del_rel,
          'dynamic',       r_del_dyn,
          'entities',      r_del_ent
        ),
        'actor_context', get_actor_context(p_actor_user_id)
      );
    ELSE
      UPDATE core_entities
         SET status     = 'archived',
             updated_at = v_now,
             updated_by = p_actor_user_id,
             version    = version + 1
       WHERE id = v_entity_id
         AND organization_id = p_organization_id;

      -- Stamp idempotency for soft delete
      IF v_operation_id IS NOT NULL THEN
        PERFORM hera_idempotency_stamp_entity(p_organization_id, v_entity_id, p_actor_user_id, v_operation_id);
      END IF;

      RETURN jsonb_build_object(
        'ok', true,
        'id', v_entity_id,
        'archived', true,
        'actor_context', get_actor_context(p_actor_user_id)
      );
    END IF;

  END IF;
END;
$$;


ALTER FUNCTION "public"."hera_entities_aggregate_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_entities_aggregate_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") IS 'HERA v2.2.1: Aggregate CRUD for entity header + dynamic fields + relationships with RBAC and idempotency using entity metadata';



CREATE OR REPLACE FUNCTION "public"."hera_entities_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_entity" "jsonb" DEFAULT '{}'::"jsonb", "p_dynamic" "jsonb" DEFAULT '{}'::"jsonb", "p_relationships" "jsonb" DEFAULT '[]'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result jsonb;
  v_entity_id uuid;
  v_entity_data jsonb;
  v_runtime_mode text;
BEGIN
  -- Get runtime mode
  v_runtime_mode := current_setting('app.hera_guardrails_mode', true);
  v_runtime_mode := COALESCE(v_runtime_mode, 'warn');

  -- HERA v2.2: Enhanced validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- HERA v2.2: Membership validation (defense-in-depth)
  IF NOT validate_actor_membership(p_actor_user_id, p_organization_id) THEN
    IF v_runtime_mode = 'enforce' THEN
      RAISE EXCEPTION 'Actor % is not a member of organization %', p_actor_user_id, p_organization_id;
    ELSE
      -- v1 WARN mode - log warning but allow
      RAISE NOTICE 'HERA v2.2 WARN: Actor % not validated as member of org % (v1 runtime)', p_actor_user_id, p_organization_id;
    END IF;
  END IF;

  -- Action routing
  CASE p_action
    WHEN 'CREATE' THEN
      -- Create entity with enhanced validation
      INSERT INTO public.core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        status,
        created_by,
        updated_by
      ) VALUES (
        p_organization_id,
        COALESCE(p_entity->>'entity_type', 'GENERAL'),
        p_entity->>'entity_name',
        p_entity->>'entity_code',
        p_entity->>'smart_code',
        COALESCE(p_entity->>'status', 'active'),
        p_actor_user_id,
        p_actor_user_id
      ) RETURNING id INTO v_entity_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity created successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'READ' THEN
      -- Read entities with organization filtering
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ce.id,
          'entity_type', ce.entity_type,
          'entity_name', ce.entity_name,
          'entity_code', ce.entity_code,
          'smart_code', ce.smart_code,
          'status', ce.status,
          'created_at', ce.created_at,
          'updated_at', ce.updated_at
        )
      ) INTO v_entity_data
      FROM public.core_entities ce
      WHERE ce.organization_id = p_organization_id
        AND (p_entity->>'entity_type' IS NULL OR ce.entity_type = p_entity->>'entity_type')
        AND (p_entity->>'entity_id' IS NULL OR ce.id = (p_entity->>'entity_id')::uuid)
      LIMIT COALESCE((p_options->>'limit')::int, 100);
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'data', COALESCE(v_entity_data, '[]'::jsonb),
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'UPDATE' THEN
      -- Update entity with validation
      v_entity_id := (p_entity->>'entity_id')::uuid;
      
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entity_id is required for UPDATE action';
      END IF;
      
      UPDATE public.core_entities 
      SET 
        entity_name = COALESCE(p_entity->>'entity_name', entity_name),
        entity_code = COALESCE(p_entity->>'entity_code', entity_code),
        smart_code = COALESCE(p_entity->>'smart_code', smart_code),
        status = COALESCE(p_entity->>'status', status),
        updated_by = p_actor_user_id
      WHERE id = v_entity_id 
        AND organization_id = p_organization_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Entity not found or access denied';
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity updated successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'DELETE' THEN
      -- Soft delete entity
      v_entity_id := (p_entity->>'entity_id')::uuid;
      
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entity_id is required for DELETE action';
      END IF;
      
      UPDATE public.core_entities 
      SET 
        status = 'deleted',
        updated_by = p_actor_user_id
      WHERE id = v_entity_id 
        AND organization_id = p_organization_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Entity not found or access denied';
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity deleted successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    ELSE
      RAISE EXCEPTION 'Invalid action: %. Valid actions: CREATE, READ, UPDATE, DELETE', p_action;
  END CASE;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', p_action,
      'error', SQLERRM,
      'runtime_version', 'v1',
      'membership_validated', false
    );
END;
$$;


ALTER FUNCTION "public"."hera_entities_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_entities_crud_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb" DEFAULT '{}'::"jsonb", "p_dynamic" "jsonb" DEFAULT '{}'::"jsonb", "p_relationships" "jsonb" DEFAULT '{}'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  -- normalized action
  v_action                text := upper(COALESCE(p_action, 'READ'));

  -- options
  v_include_dynamic       boolean := COALESCE((p_options->>'include_dynamic')::boolean, true);
  v_include_relationships boolean := COALESCE((p_options->>'include_relationships')::boolean, true);
  v_include_reverse       boolean := COALESCE((p_options->>'include_reverse')::boolean, false);
  v_rel_types             text[]  := CASE WHEN p_options ? 'rel_types'      THEN ARRAY(SELECT jsonb_array_elements_text(p_options->'rel_types')) END;
  v_dynamic_prefix        text[]  := CASE WHEN p_options ? 'dynamic_prefix' THEN ARRAY(SELECT jsonb_array_elements_text(p_options->'dynamic_prefix')) END;
  v_after_id              uuid    := NULLIF(p_options->>'after_id','')::uuid;
  v_limit                 int     := GREATEST(1, LEAST(COALESCE((p_options->>'limit')::int, 50), 500));
  v_hard                  boolean := COALESCE((p_options->>'hard_delete')::boolean, false);

  -- selectors parsed from p_entity
  v_entity_id             uuid    := NULLIF(p_entity->>'entity_id','')::uuid;
  v_entity_type           text    := NULLIF(p_entity->>'entity_type','');
  v_entity_code           text    := NULLIF(p_entity->>'entity_code','');

  -- payloads normalized
  v_dynamic               jsonb   := COALESCE(p_dynamic, '{}'::jsonb);
  v_relationships         jsonb   := COALESCE(p_relationships, '{}'::jsonb);

  -- results / counters
  v_id                    uuid;
  r_rel_deactivated       int := 0;
  r_del_dyn               int := 0;
  r_del_rel               int := 0;
  r_del_ent               int := 0;
BEGIN
  ---------------------------------------------------------------------------
  -- Basic gates: org & actor, option normalization, allowed actions
  ---------------------------------------------------------------------------
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ORG_REQUIRED';
  END IF;

  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ACTOR_REQUIRED';
  END IF;

  -- normalize empty arrays -> NULL
  IF v_rel_types IS NOT NULL AND array_length(v_rel_types,1) = 0 THEN v_rel_types := NULL; END IF;
  IF v_dynamic_prefix IS NOT NULL AND array_length(v_dynamic_prefix,1) = 0 THEN v_dynamic_prefix := NULL; END IF;

  -- allow-list actions
  IF v_action NOT IN ('CREATE','UPDATE','MERGE','READ','ARCHIVE','DELETE') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = format('UNKNOWN_ACTION_%s', p_action);
  END IF;

  -- For any write, ensure actor is a member of org (live relationship check)
  IF v_action IN ('CREATE','UPDATE','MERGE','ARCHIVE','DELETE') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM core_relationships r
      WHERE r.from_entity_id    = p_actor_user_id
        AND r.to_entity_id      = p_organization_id
        AND r.relationship_type = 'MEMBER_OF'
        AND r.is_active         = true
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ORG_MEMBERSHIP_REQUIRED';
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- CREATE / UPDATE / MERGE
  ---------------------------------------------------------------------------
  IF v_action IN ('CREATE','UPDATE','MERGE') THEN
    -- entity_id must be present for UPDATE (and for MERGE when updating)
    IF v_action = 'UPDATE' OR (v_action = 'MERGE' AND v_entity_id IS NOT NULL) THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ENTITY_ID_REQUIRED';
      END IF;
    END IF;

    -- cheap guard: smart_code required in header (full regex enforced downstream)
    IF COALESCE(p_entity->>'smart_code','') = '' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'SMART_CODE_REQUIRED';
    END IF;

    -- Upsert header (helper handles validation + audit stamping)
    v_id := hera_entity_upsert_v2(p_organization_id, p_actor_user_id, p_entity);

    -- Upsert dynamic (object only; ignore non-object)
    IF jsonb_typeof(v_dynamic) = 'object' AND v_dynamic <> '{}'::jsonb THEN
      PERFORM hera_dynamic_data_upsert_full_v2(p_organization_id, p_actor_user_id, v_id, v_dynamic);
    END IF;

    -- Replace relationships
    IF jsonb_typeof(v_relationships) = 'object' AND v_relationships <> '{}'::jsonb THEN
      PERFORM hera_relationships_replace_full_v2(p_organization_id, p_actor_user_id, v_id, v_relationships);
    END IF;

    -- Return canonical read
    RETURN hera_entity_read_v2(
      p_organization_id       := p_organization_id,
      p_entity_id             := v_id,
      p_include_dynamic       := v_include_dynamic,
      p_dynamic_prefix        := v_dynamic_prefix,
      p_include_relationships := v_include_relationships,
      p_rel_types             := v_rel_types,
      p_include_reverse       := v_include_reverse,
      p_limit                 := 1
    );

  ---------------------------------------------------------------------------
  -- READ
  ---------------------------------------------------------------------------
  ELSIF v_action = 'READ' THEN
    -- require some selector to avoid unbounded queries
    IF v_entity_id IS NULL AND v_entity_type IS NULL AND v_entity_code IS NULL AND v_after_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'READ_SELECTOR_REQUIRED';
    END IF;

    RETURN hera_entity_read_v2(
      p_organization_id       := p_organization_id,
      p_entity_id             := v_entity_id,
      p_entity_type           := v_entity_type,
      p_code                  := v_entity_code,
      p_include_dynamic       := v_include_dynamic,
      p_dynamic_prefix        := v_dynamic_prefix,
      p_include_relationships := v_include_relationships,
      p_rel_types             := v_rel_types,
      p_include_reverse       := v_include_reverse,
      p_after_id              := v_after_id,
      p_limit                 := v_limit
    );

  ---------------------------------------------------------------------------
  -- ARCHIVE (soft delete + deactivate relationships)
  ---------------------------------------------------------------------------
  ELSIF v_action = 'ARCHIVE' THEN
    IF v_entity_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ENTITY_ID_REQUIRED';
    END IF;

    -- lock header to serialize with other writers
    PERFORM 1 FROM core_entities
     WHERE id = v_entity_id AND organization_id = p_organization_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'NO_DATA_FOUND', MESSAGE = 'ENTITY_NOT_FOUND';
    END IF;

    UPDATE core_entities
       SET status     = 'archived',
           updated_at = now(),
           updated_by = p_actor_user_id,
           version    = version + 1
     WHERE id = v_entity_id AND organization_id = p_organization_id;

    UPDATE core_relationships
       SET is_active = false,
           updated_at = now(),
           updated_by = p_actor_user_id
     WHERE organization_id = p_organization_id
       AND (from_entity_id = v_entity_id OR to_entity_id = v_entity_id)
       AND is_active = true;
    GET DIAGNOSTICS r_rel_deactivated = ROW_COUNT;

    RETURN jsonb_build_object(
      'ok', true,
      'id', v_entity_id,
      'relationships_deactivated', r_rel_deactivated
    );

  ---------------------------------------------------------------------------
  -- DELETE (hard/soft)
  ---------------------------------------------------------------------------
  ELSIF v_action = 'DELETE' THEN
    IF v_entity_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ENTITY_ID_REQUIRED';
    END IF;

    -- lock header to prevent races
    PERFORM 1 FROM core_entities
     WHERE id = v_entity_id AND organization_id = p_organization_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'NO_DATA_FOUND', MESSAGE = 'ENTITY_NOT_FOUND';
    END IF;

    IF v_hard THEN
      DELETE FROM core_relationships
       WHERE organization_id = p_organization_id
         AND (from_entity_id = v_entity_id OR to_entity_id = v_entity_id);
      GET DIAGNOSTICS r_del_rel = ROW_COUNT;

      DELETE FROM core_dynamic_data
       WHERE organization_id = p_organization_id
         AND entity_id = v_entity_id;
      GET DIAGNOSTICS r_del_dyn = ROW_COUNT;

      DELETE FROM core_entities
       WHERE organization_id = p_organization_id
         AND id = v_entity_id;
      GET DIAGNOSTICS r_del_ent = ROW_COUNT;

      RETURN jsonb_build_object(
        'ok', true,
        'id', v_entity_id,
        'deleted', jsonb_build_object(
          'relationships', r_del_rel,
          'dynamic',       r_del_dyn,
          'entities',      r_del_ent
        )
      );
    ELSE
      UPDATE core_entities
         SET status     = 'archived',
             updated_at = now(),
             updated_by = p_actor_user_id,
             version    = version + 1
       WHERE id = v_entity_id
         AND organization_id = p_organization_id;

      RETURN jsonb_build_object('ok', true, 'id', v_entity_id, 'archived', true);
    END IF;

  END IF;
END$$;


ALTER FUNCTION "public"."hera_entities_crud_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean DEFAULT true, "p_cascade_relationships" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_now            timestamptz := now();
  v_entity_exists  boolean := false;
  v_dyn_deleted    int := 0;
  v_rel_deleted    int := 0;
  v_rel_inactivated int := 0;
  v_entity_deleted int := 0;
  v_err_context    text;
  v_fk_error       text := NULL;
BEGIN
  -- Basic guards
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'HERA_DELETE_REQUIRED: organization_id and entity_id are required';
  END IF;

  -- Ensure entity exists within org
  SELECT TRUE
    INTO v_entity_exists
  FROM core_entities
  WHERE id = p_entity_id
    AND organization_id = p_organization_id
  LIMIT 1;

  IF NOT v_entity_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'mode', 'NONE',
      'error', format('Entity %s not found in organization %s', p_entity_id, p_organization_id)
    );
  END IF;

  -- === (1) Remove dependent rows first (to reduce FK failures) ===
  IF p_cascade_dynamic_data THEN
    DELETE FROM core_dynamic_data d
     WHERE d.organization_id = p_organization_id
       AND d.entity_id       = p_entity_id;
    GET DIAGNOSTICS v_dyn_deleted = ROW_COUNT;
  END IF;

  IF p_cascade_relationships THEN
    -- Hard delete relationships on both sides before entity delete
    DELETE FROM core_relationships r
     WHERE r.organization_id = p_organization_id
       AND (r.from_entity_id = p_entity_id OR r.to_entity_id = p_entity_id);
    GET DIAGNOSTICS v_rel_deleted = ROW_COUNT;
  END IF;

  -- === (2) Try HARD delete entity header ===
  BEGIN
    DELETE FROM core_entities
     WHERE organization_id = p_organization_id
       AND id = p_entity_id;
    GET DIAGNOSTICS v_entity_deleted = ROW_COUNT;

    IF v_entity_deleted = 1 THEN
      -- Hard delete succeeded
      RETURN jsonb_build_object(
        'success', true,
        'mode', 'HARD',
        'organization_id', p_organization_id,
        'entity_id', p_entity_id,
        'dynamic_rows_deleted', v_dyn_deleted,
        'relationships_deleted', v_rel_deleted
      );
    END IF;

  EXCEPTION
    WHEN foreign_key_violation THEN
      -- Capture FK error text and fall through to soft delete
      v_fk_error := SQLERRM;
  END;

  -- === (3) SOFT fallback (archive) ===
  -- If we get here, either hard delete failed (FK) or entity_deleted != 1
  UPDATE core_entities
     SET status    = 'archived',
         metadata  = jsonb_set(coalesce(metadata,'{}'::jsonb), '{archived_at}', to_jsonb(v_now), true),
         updated_at = v_now
   WHERE organization_id = p_organization_id
     AND id = p_entity_id;

  -- On soft fallback, optionally inactivate any remaining relationships (if caller asked)
  IF p_cascade_relationships THEN
    UPDATE core_relationships r
       SET is_active = false,
           expiration_date = v_now
     WHERE r.organization_id = p_organization_id
       AND (r.from_entity_id = p_entity_id OR r.to_entity_id = p_entity_id)
       AND r.is_active = true;
    GET DIAGNOSTICS v_rel_inactivated = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'mode', 'SOFT_FALLBACK',
    'organization_id', p_organization_id,
    'entity_id', p_entity_id,
    'archived_at', v_now,
    'dynamic_rows_deleted', v_dyn_deleted,
    'relationships_deleted', v_rel_deleted,
    'relationships_inactivated', v_rel_inactivated,
    'fk_error', v_fk_error
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err_context = PG_EXCEPTION_CONTEXT;
  RETURN jsonb_build_object(
    'success', false,
    'mode', 'ERROR',
    'organization_id', p_organization_id,
    'entity_id', p_entity_id,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'context', v_err_context
  );
END;
$$;


ALTER FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."core_dynamic_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "field_type" "text" DEFAULT 'text'::"text",
    "field_value_text" "text",
    "field_value_number" numeric(20,8),
    "field_value_boolean" boolean,
    "field_value_date" timestamp with time zone,
    "field_value_json" "jsonb",
    "field_value_file_url" "text",
    "calculated_value" "jsonb",
    "smart_code" character varying(100) NOT NULL,
    "smart_code_status" "text" DEFAULT 'DRAFT'::"text",
    "ai_confidence" numeric(5,4) DEFAULT 0.0000,
    "ai_enhanced_value" "text",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "validation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "validation_status" "text" DEFAULT 'valid'::"text",
    "field_order" integer DEFAULT 1,
    "is_searchable" boolean DEFAULT true,
    "is_required" boolean DEFAULT false,
    "is_system_field" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."core_dynamic_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."core_entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_name" "text" NOT NULL,
    "entity_code" "text",
    "entity_description" "text",
    "parent_entity_id" "uuid",
    "smart_code" character varying(100) NOT NULL,
    "smart_code_status" "text" DEFAULT 'DRAFT'::"text",
    "ai_confidence" numeric(5,4) DEFAULT 0.0000,
    "ai_classification" "text",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "business_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[],
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "version" integer DEFAULT 1,
    CONSTRAINT "chk_core_entities_smart_code_pattern" CHECK (("regexp_replace"("upper"(("smart_code")::"text"), '\.V([0-9]+)$'::"text", '.v\1'::"text") ~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'::"text"))
);


ALTER TABLE "public"."core_entities" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_current_dynamic_data" AS
 WITH "ranked" AS (
         SELECT "d"."id",
            "d"."organization_id",
            "d"."entity_id",
            "d"."field_name",
            "d"."field_type",
            "d"."field_value_text",
            "d"."field_value_number",
            "d"."field_value_boolean",
            "d"."field_value_date",
            "d"."field_value_json",
            "d"."field_value_file_url",
            "d"."calculated_value",
            "d"."smart_code",
            "d"."smart_code_status",
            "d"."ai_confidence",
            "d"."ai_enhanced_value",
            "d"."ai_insights",
            "d"."validation_rules",
            "d"."validation_status",
            "d"."field_order",
            "d"."is_searchable",
            "d"."is_required",
            "d"."is_system_field",
            "d"."created_at",
            "d"."updated_at",
            "d"."created_by",
            "d"."updated_by",
            "d"."version",
            "row_number"() OVER (PARTITION BY "d"."organization_id", "d"."entity_id", "d"."field_name" ORDER BY COALESCE("d"."updated_at", "d"."created_at") DESC, "d"."version" DESC) AS "rn"
           FROM "public"."core_dynamic_data" "d"
        )
 SELECT "organization_id",
    "entity_id",
    "field_name",
    "field_type",
    "field_value_text",
    "field_value_number",
    "field_value_boolean",
    "field_value_date",
    "field_value_json",
    "smart_code",
    "smart_code_status",
    "ai_confidence",
    "ai_insights",
    "validation_status",
    "created_at",
    "updated_at",
    "version"
   FROM "ranked"
  WHERE ("rn" = 1);


ALTER VIEW "public"."v_current_dynamic_data" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."rpt_entity_profiles" AS
 SELECT "e"."organization_id",
    "e"."id" AS "entity_id",
    "e"."entity_type",
    "e"."entity_name",
    "e"."entity_code",
    "e"."status",
    "e"."smart_code" AS "entity_smart_code",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'employee'::"text") AND ("d"."field_name" = 'email'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "employee_email",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'employee'::"text") AND ("d"."field_name" = 'phone'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "employee_phone",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'employee'::"text") AND ("d"."field_name" = 'hire_date'::"text")) THEN "d"."field_value_date"
            ELSE NULL::timestamp with time zone
        END) AS "employee_hire_date",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'employee'::"text") AND ("d"."field_name" = 'role'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "employee_role",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'employee'::"text") AND ("d"."field_name" = 'rate'::"text")) THEN "d"."field_value_number"
            ELSE NULL::numeric
        END) AS "employee_rate",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'customer'::"text") AND ("d"."field_name" = 'email'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "customer_email",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'customer'::"text") AND ("d"."field_name" = 'phone'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "customer_phone",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'customer'::"text") AND ("d"."field_name" = 'tier'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "customer_tier",
    "max"(
        CASE
            WHEN (("e"."entity_type" = 'customer'::"text") AND ("d"."field_name" = 'lifecycle_stage'::"text")) THEN "d"."field_value_text"
            ELSE NULL::"text"
        END) AS "customer_lifecycle_stage",
    "jsonb_object_agg"("d"."field_name", COALESCE("d"."field_value_json", "to_jsonb"(COALESCE("d"."field_value_text", ("d"."field_value_number")::"text",
        CASE
            WHEN ("d"."field_value_boolean" IS NULL) THEN NULL::"text"
            ELSE ("d"."field_value_boolean")::"text"
        END)))) FILTER (WHERE ("d"."field_name" = ANY (ARRAY['email'::"text", 'phone'::"text", 'hire_date'::"text", 'role'::"text", 'rate'::"text", 'tier'::"text", 'lifecycle_stage'::"text"]))) AS "promoted",
    "jsonb_object_agg"("d"."field_name", COALESCE("d"."field_value_json", "to_jsonb"(COALESCE("d"."field_value_text", ("d"."field_value_number")::"text",
        CASE
            WHEN ("d"."field_value_boolean" IS NULL) THEN NULL::"text"
            ELSE ("d"."field_value_boolean")::"text"
        END)))) FILTER (WHERE (("d"."field_name" IS NOT NULL) AND ("d"."field_name" <> ALL (ARRAY['email'::"text", 'phone'::"text", 'hire_date'::"text", 'role'::"text", 'rate'::"text", 'tier'::"text", 'lifecycle_stage'::"text"])))) AS "extras"
   FROM ("public"."core_entities" "e"
     LEFT JOIN "public"."v_current_dynamic_data" "d" ON ((("d"."organization_id" = "e"."organization_id") AND ("d"."entity_id" = "e"."id"))))
  WHERE ("e"."status" IS DISTINCT FROM 'deleted'::"text")
  GROUP BY "e"."organization_id", "e"."id", "e"."entity_type", "e"."entity_name", "e"."entity_code", "e"."status", "e"."smart_code"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."rpt_entity_profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_entity_profiles"("p_organization_id" "uuid", "p_entity_type" "text" DEFAULT NULL::"text", "p_smartcode_like" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."rpt_entity_profiles"
    LANGUAGE "sql"
    AS $$
  SELECT *
  FROM rpt_entity_profiles r
  WHERE r.organization_id = p_organization_id
    AND (p_entity_type   IS NULL OR r.entity_type = p_entity_type)
    AND (p_smartcode_like IS NULL OR r.entity_smart_code LIKE p_smartcode_like)
$$;


ALTER FUNCTION "public"."hera_entity_profiles"("p_organization_id" "uuid", "p_entity_type" "text", "p_smartcode_like" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_entity_type" "text" DEFAULT NULL::"text", "p_entity_code" "text" DEFAULT NULL::"text", "p_smart_code" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_include_relationships" boolean DEFAULT false, "p_include_dynamic_data" boolean DEFAULT false, "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
    v_entities JSONB;
    v_total_count INTEGER;
    v_entity_ids UUID[];
BEGIN
    -- Validate organization_id
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_READ: organization_id is required';
    END IF;

    -- If entity_id is provided, return single entity
    IF p_entity_id IS NOT NULL THEN
        -- Get single entity
        SELECT jsonb_build_object(
            'id', e.id,
            'entity_id', e.id,
            'organization_id', e.organization_id,
            'entity_type', e.entity_type,
            'entity_name', e.entity_name,
            'entity_code', e.entity_code,
            'entity_description', e.entity_description,
            'smart_code', e.smart_code,
            'smart_code_status', e.smart_code_status,
            'status', e.status,
            'tags', e.tags,
            'metadata', e.metadata,
            'business_rules', e.business_rules,
            'ai_confidence', e.ai_confidence,
            'ai_classification', e.ai_classification,
            'ai_insights', e.ai_insights,
            'parent_entity_id', e.parent_entity_id,
            'created_at', e.created_at,
            'updated_at', e.updated_at,
            'created_by', e.created_by,
            'updated_by', e.updated_by,
            'version', e.version,
            'relationship_count', CASE
                WHEN p_include_relationships THEN (
                    SELECT COUNT(*)::INTEGER
                    FROM core_relationships r
                    WHERE (r.from_entity_id = e.id OR r.to_entity_id = e.id)
                    AND r.organization_id = p_organization_id
                )
                ELSE NULL
            END,
            'dynamic_fields', CASE
                WHEN p_include_dynamic_data THEN (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', dd.id,
                            'field_name', dd.field_name,
                            'field_type', dd.field_type,
                            'field_value_text', dd.field_value_text,
                            'field_value_number', dd.field_value_number,
                            'field_value_boolean', dd.field_value_boolean,
                            'field_value_date', dd.field_value_date,
                            'field_value_json', dd.field_value_json,
                            'smart_code', dd.smart_code,
                            -- REMOVED: 'metadata', dd.metadata (column doesn't exist)
                            'created_at', dd.created_at,
                            'updated_at', dd.updated_at
                        )
                    )
                    FROM core_dynamic_data dd
                    WHERE dd.entity_id = e.id
                    AND dd.organization_id = p_organization_id
                )
                ELSE NULL
            END
        ) INTO v_result
        FROM core_entities e
        WHERE e.id = p_entity_id
        AND e.organization_id = p_organization_id;

        IF v_result IS NULL THEN
            RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found in organization %',
                p_entity_id, p_organization_id;
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_result,
            'metadata', jsonb_build_object(
                'total_count', 1,
                'returned_count', 1
            )
        );
    END IF;

    -- Multiple entity query
    WITH filtered_entities AS (
        SELECT e.*
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
        AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
        AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
        AND (p_status IS NULL OR e.status = p_status)
        ORDER BY e.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    entity_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', fe.id,
                'entity_id', fe.id,
                'organization_id', fe.organization_id,
                'entity_type', fe.entity_type,
                'entity_name', fe.entity_name,
                'entity_code', fe.entity_code,
                'entity_description', fe.entity_description,
                'smart_code', fe.smart_code,
                'smart_code_status', fe.smart_code_status,
                'status', fe.status,
                'tags', fe.tags,
                'metadata', fe.metadata,
                'business_rules', fe.business_rules,
                'ai_confidence', fe.ai_confidence,
                'ai_classification', fe.ai_classification,
                'ai_insights', fe.ai_insights,
                'parent_entity_id', fe.parent_entity_id,
                'created_at', fe.created_at,
                'updated_at', fe.updated_at,
                'created_by', fe.created_by,
                'updated_by', fe.updated_by,
                'version', fe.version,
                'relationship_count', CASE
                    WHEN p_include_relationships THEN (
                        SELECT COUNT(*)::INTEGER
                        FROM core_relationships r
                        WHERE (r.from_entity_id = fe.id OR r.to_entity_id = fe.id)
                        AND r.organization_id = p_organization_id
                    )
                    ELSE NULL
                END,
                'dynamic_fields', CASE
                    WHEN p_include_dynamic_data THEN (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', dd.id,
                                'field_name', dd.field_name,
                                'field_type', dd.field_type,
                                'field_value_text', dd.field_value_text,
                                'field_value_number', dd.field_value_number,
                                'field_value_boolean', dd.field_value_boolean,
                                'field_value_date', dd.field_value_date,
                                'field_value_json', dd.field_value_json,
                                'smart_code', dd.smart_code,
                                -- REMOVED: 'metadata', dd.metadata (column doesn't exist)
                                'created_at', dd.created_at,
                                'updated_at', dd.updated_at
                            )
                        )
                        FROM core_dynamic_data dd
                        WHERE dd.entity_id = fe.id
                        AND dd.organization_id = p_organization_id
                    )
                    ELSE NULL
                END
            )
        ) AS entities,
        COUNT(*) AS total_count
        FROM filtered_entities fe
    )
    SELECT
        entities,
        total_count
    INTO
        v_entities,
        v_total_count
    FROM entity_data;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_entities, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'total_count', COALESCE(v_total_count, 0),
            'returned_count', COALESCE(jsonb_array_length(v_entities), 0),
            'page_size', p_limit,
            'offset', p_offset
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;


ALTER FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) IS 'HERA Universal Entity Read Function v1 - Fixed to remove dd.metadata references (column does not exist in core_dynamic_data)';



CREATE OR REPLACE FUNCTION "public"."hera_entity_read_with_branch_v1"("p_organization_id" "uuid", "p_entity_type" "text" DEFAULT NULL::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_status" "text" DEFAULT 'active'::"text", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_relationship_type" "text" DEFAULT NULL::"text", "p_include_relationships" boolean DEFAULT false, "p_include_dynamic_data" boolean DEFAULT false, "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_entities JSONB;
  v_total INTEGER;
BEGIN
  -- Validate organization context
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  -- Build query with branch filtering
  WITH filtered_entities AS (
    SELECT DISTINCT e.*
    FROM core_entities e
    LEFT JOIN core_relationships r ON (
      p_branch_id IS NOT NULL 
      AND p_relationship_type IS NOT NULL
      AND r.from_entity_id = e.id
      AND r.to_entity_id = p_branch_id
      AND r.relationship_type = p_relationship_type
      AND r.deleted_at IS NULL
      AND r.organization_id = p_organization_id
    )
    WHERE e.organization_id = p_organization_id
      AND (p_entity_id IS NULL OR e.id = p_entity_id)
      AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
      AND (p_status IS NULL OR e.status = p_status)
      AND (
        -- If branch filter is specified, only include entities with the relationship
        (p_branch_id IS NULL OR p_relationship_type IS NULL)
        OR r.id IS NOT NULL
      )
      AND e.deleted_at IS NULL
    ORDER BY e.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  entity_data AS (
    SELECT 
      jsonb_agg(
        to_jsonb(fe.*) 
        || CASE 
          WHEN p_include_dynamic_data THEN
            jsonb_build_object(
              'dynamic_fields',
              COALESCE(
                (
                  SELECT jsonb_object_agg(
                    dd.field_name,
                    jsonb_build_object(
                      'value', COALESCE(
                        dd.field_value_text,
                        dd.field_value_number::TEXT,
                        dd.field_value_boolean::TEXT,
                        dd.field_value_date::TEXT,
                        dd.field_value_json::TEXT
                      ),
                      'type', dd.field_type,
                      'smart_code', dd.smart_code
                    )
                  )
                  FROM core_dynamic_data dd
                  WHERE dd.entity_id = fe.id
                    AND dd.organization_id = p_organization_id
                    AND dd.deleted_at IS NULL
                ),
                '{}'::JSONB
              )
            )
          ELSE '{}'::JSONB
          END
        || CASE
          WHEN p_include_relationships THEN
            jsonb_build_object(
              'relationships',
              COALESCE(
                (
                  SELECT jsonb_object_agg(
                    rel_type,
                    relationships
                  )
                  FROM (
                    SELECT 
                      r.relationship_type AS rel_type,
                      jsonb_agg(
                        jsonb_build_object(
                          'id', r.id,
                          'to_entity_id', r.to_entity_id,
                          'to_entity', to_jsonb(te.*),
                          'relationship_direction', r.relationship_direction,
                          'metadata', r.metadata,
                          'created_at', r.created_at
                        )
                        ORDER BY r.created_at
                      ) AS relationships
                    FROM core_relationships r
                    JOIN core_entities te ON te.id = r.to_entity_id
                    WHERE r.from_entity_id = fe.id
                      AND r.organization_id = p_organization_id
                      AND r.deleted_at IS NULL
                      AND te.deleted_at IS NULL
                    GROUP BY r.relationship_type
                  ) rel_groups
                ),
                '{}'::JSONB
              )
            )
          ELSE '{}'::JSONB
          END
      ) AS entities
    FROM filtered_entities fe
  )
  SELECT 
    COALESCE(entities, '[]'::JSONB) AS entities,
    (
      SELECT COUNT(*)::INTEGER 
      FROM filtered_entities
    ) AS total
  INTO v_entities, v_total
  FROM entity_data;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'data', COALESCE(v_entities, '[]'::JSONB),
    'metadata', jsonb_build_object(
      'total', COALESCE(v_total, 0),
      'limit', p_limit,
      'offset', p_offset,
      'filters', jsonb_build_object(
        'organization_id', p_organization_id,
        'entity_type', p_entity_type,
        'status', p_status,
        'branch_id', p_branch_id,
        'relationship_type', p_relationship_type
      )
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;


ALTER FUNCTION "public"."hera_entity_read_with_branch_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_status" "text", "p_branch_id" "uuid", "p_relationship_type" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_entity_read_with_branch_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_status" "text", "p_branch_id" "uuid", "p_relationship_type" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) IS 'Reads entities with optional branch filtering via relationships';



CREATE OR REPLACE FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_entity_code" "text" DEFAULT NULL::"text", "p_entity_description" "text" DEFAULT NULL::"text", "p_parent_entity_id" "uuid" DEFAULT NULL::"uuid", "p_status" "text" DEFAULT NULL::"text", "p_tags" "text"[] DEFAULT NULL::"text"[], "p_smart_code_status" "text" DEFAULT NULL::"text", "p_business_rules" "jsonb" DEFAULT NULL::"jsonb", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_ai_confidence" numeric DEFAULT NULL::numeric, "p_ai_classification" "text" DEFAULT NULL::"text", "p_ai_insights" "jsonb" DEFAULT NULL::"jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_entity_id UUID;
    v_existing_entity RECORD;
BEGIN
    -- Validate required fields
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_UPSERT: organization_id is required';
    END IF;

    IF p_entity_id IS NULL AND (p_entity_type IS NULL OR p_entity_name IS NULL OR p_smart_code IS NULL) THEN
        RAISE EXCEPTION 'HERA_ENTITY_UPSERT: entity_type, entity_name, and smart_code are required for new entities';
    END IF;

    -- Check for existing entity
    IF p_entity_id IS NOT NULL THEN
        SELECT * INTO v_existing_entity
        FROM core_entities
        WHERE id = p_entity_id
        AND organization_id = p_organization_id;

        IF v_existing_entity.id IS NULL THEN
            RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found in organization %', p_entity_id, p_organization_id;
        END IF;
    ELSIF p_entity_code IS NOT NULL THEN
        SELECT * INTO v_existing_entity
        FROM core_entities
        WHERE entity_code = p_entity_code
        AND organization_id = p_organization_id;
        -- Removed 'is_deleted' filter
    END IF;

    -- Perform upsert
    IF v_existing_entity.id IS NOT NULL THEN
        -- Update existing entity
        UPDATE core_entities SET
            entity_type = COALESCE(p_entity_type, entity_type),
            entity_name = COALESCE(p_entity_name, entity_name),
            entity_code = COALESCE(p_entity_code, entity_code),
            entity_description = COALESCE(p_entity_description, entity_description),
            smart_code = COALESCE(p_smart_code, smart_code),
            status = COALESCE(p_status, status),
            tags = COALESCE(p_tags, tags),
            metadata = COALESCE(p_metadata, metadata),
            business_rules = COALESCE(p_business_rules, business_rules),
            -- Removed 'attributes' assignment
            ai_confidence = COALESCE(p_ai_confidence, ai_confidence),
            ai_classification = COALESCE(p_ai_classification, ai_classification),
            ai_insights = COALESCE(p_ai_insights, ai_insights),
            parent_entity_id = COALESCE(p_parent_entity_id, parent_entity_id),
            smart_code_status = COALESCE(p_smart_code_status, smart_code_status),
            updated_at = NOW(),
            updated_by = p_actor_user_id,
            version = version + 1
        WHERE id = v_existing_entity.id;

        v_entity_id := v_existing_entity.id;
    ELSE
        -- Create new entity
        INSERT INTO core_entities (
            organization_id, entity_type, entity_name, entity_code,
            entity_description, smart_code, status, tags, metadata,
            business_rules, ai_confidence, ai_classification, ai_insights,
            parent_entity_id, smart_code_status, created_by, updated_by
            -- Removed 'attributes' from INSERT
        ) VALUES (
            p_organization_id, p_entity_type, p_entity_name, p_entity_code,
            p_entity_description, p_smart_code, p_status, p_tags, p_metadata,
            p_business_rules, p_ai_confidence, p_ai_classification, p_ai_insights,
            p_parent_entity_id, p_smart_code_status, p_actor_user_id, p_actor_user_id
            -- Removed p_attributes from VALUES
        ) RETURNING id INTO v_entity_id;
    END IF;

    RETURN v_entity_id::text;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_ENTITY_UPSERT_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") IS 'HERA Universal Entity Upsert Function v1 - Fixed for actual schema';



CREATE OR REPLACE FUNCTION "public"."hera_finance_dna_v2_setup_complete"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Log successful setup
    RAISE NOTICE 'Finance DNA v2 Core Setup Complete - Functions Installed:';
    RAISE NOTICE '✅ hera_validate_organization_access()';
    RAISE NOTICE '✅ hera_set_organization_context_v2()';
    RAISE NOTICE '✅ validate_finance_dna_smart_code()';
    RAISE NOTICE '✅ validate_gl_balance_trigger()';
    RAISE NOTICE '✅ hera_audit_operation_v2()';
    RAISE NOTICE '✅ GL Balance Validation Trigger Applied';
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."hera_finance_dna_v2_setup_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_gl_validate_balance"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_epsilon" numeric DEFAULT 0.0001) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_dr numeric := 0;
  v_cr numeric := 0;
BEGIN
  SELECT
    COALESCE(SUM(public.hera_line_debit_amount(
             public.hera_line_side(l.smart_code, l.line_data), l.line_amount)),0),
    COALESCE(SUM(public.hera_line_credit_amount(
             public.hera_line_side(l.smart_code, l.line_data), l.line_amount)),0)
  INTO v_dr, v_cr
  FROM universal_transaction_lines l
  WHERE l.organization_id = p_org_id
    AND l.transaction_id  = p_transaction_id
    AND l.smart_code ~ '\.GL\.';

  IF abs(v_dr - v_cr) > p_epsilon THEN
    RAISE EXCEPTION 'GL_IMBALANCE: debits % != credits % (tolerance %)',
                    v_dr, v_cr, p_epsilon
      USING HINT = 'Ensure each GL line has line_data.side = DR|CR and amounts are correct.';
  END IF;
END;
$$;


ALTER FUNCTION "public"."hera_gl_validate_balance"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_epsilon" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_gl_validate_balance"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_epsilon" numeric) IS 'Validates GL line balance within tolerance (debits = credits). Raises exception if imbalance found.';



CREATE OR REPLACE FUNCTION "public"."hera_idempotency_stamp_entity"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE core_entities e
     SET metadata  = jsonb_set(COALESCE(e.metadata, '{}'::jsonb),
                               '{idempotency,last_operation_id}',
                               to_jsonb(p_operation_id::text), true),
         updated_at = now(),
         updated_by = p_actor_user_id
   WHERE e.organization_id = p_organization_id
     AND e.id = p_entity_id;
END;
$$;


ALTER FUNCTION "public"."hera_idempotency_stamp_entity"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_idempotency_try_replay_on_entity"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid", "p_entity_id" "uuid", "p_include_dynamic" boolean, "p_dynamic_prefix" "text"[], "p_include_relationships" boolean, "p_include_reverse" boolean, "p_rel_types" "text"[], "p_include_audit" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_found boolean;
  v_payload jsonb;
BEGIN
  IF p_entity_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT TRUE
    INTO v_found
    FROM core_entities e
   WHERE e.organization_id = p_organization_id
     AND e.id = p_entity_id
     AND (e.metadata->'idempotency'->>'last_operation_id')::uuid = p_operation_id;

  IF v_found IS TRUE THEN
    v_payload := hera_entities_read_v2(
      p_organization_id       := p_organization_id,
      p_actor_user_id         := p_actor_user_id,
      p_entity_id             := p_entity_id,
      p_entity_type           := NULL,
      p_code                  := NULL,
      p_after_id              := NULL,
      p_limit                 := 1,
      p_include_dynamic       := p_include_dynamic,
      p_dynamic_prefix        := p_dynamic_prefix,
      p_include_relationships := p_include_relationships,
      p_include_reverse       := p_include_reverse,
      p_rel_types             := p_rel_types,
      p_include_audit_fields  := p_include_audit
    );
    RETURN v_payload;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."hera_idempotency_try_replay_on_entity"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid", "p_entity_id" "uuid", "p_include_dynamic" boolean, "p_dynamic_prefix" "text"[], "p_include_relationships" boolean, "p_include_reverse" boolean, "p_rel_types" "text"[], "p_include_audit" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_invitation_accept_v1"("p_organization_id" "uuid", "p_token_sha256" "text", "p_user_id" "uuid", "p_user_name" "text", "p_role" "text", "p_permissions" "jsonb", "p_smart_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  -- TODO: upsert user entity, relationship, dynamic data, mark accepted, audit

  return jsonb_build_object('ok', true, 'organization_id', p_organization_id, 'user_id', p_user_id, 'status', 'accepted');

end;

$$;


ALTER FUNCTION "public"."hera_invitation_accept_v1"("p_organization_id" "uuid", "p_token_sha256" "text", "p_user_id" "uuid", "p_user_name" "text", "p_role" "text", "p_permissions" "jsonb", "p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_invitation_get_v1"("p_token_sha256" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  return jsonb_build_object(

    'invitation_txn_id', gen_random_uuid(),

    'organization_id', gen_random_uuid(),

    'invited_email', 'redacted@example.com',

    'role', 'admin',

    'permissions', jsonb_build_array('users:read:all'),

    'expires_at', (now() + interval '72 hours')::timestamptz,

    'status', 'pending'

  );

end;

$$;


ALTER FUNCTION "public"."hera_invitation_get_v1"("p_token_sha256" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_invitation_resend_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  return jsonb_build_object('ok', true, 'invitation_id', p_invitation_id, 'status', 'resent');

end;

$$;


ALTER FUNCTION "public"."hera_invitation_resend_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_invitation_revoke_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  return jsonb_build_object('ok', true, 'invitation_id', p_invitation_id, 'status', 'revoked');

end;

$$;


ALTER FUNCTION "public"."hera_invitation_revoke_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_invitations_list_v1"("p_organization_id" "uuid", "p_status" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "invited_email" "text", "role" "text", "expires_at" timestamp with time zone, "status" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    ut.id,
    ut.business_context->>'invited_email' as invited_email,
    ut.business_context->>'role'          as role,
    (ut.business_context->>'expires_at')::timestamptz as expires_at,
    coalesce(ut.metadata->>'status','pending') as status
  from public.universal_transactions ut
  where ut.organization_id = p_organization_id
    and ut.transaction_type = 'user_invitation'
    and (p_status is null or coalesce(ut.metadata->>'status','pending') = p_status)
  order by ut.created_at desc nulls last, ut.id desc
  limit p_limit offset p_offset
$$;


ALTER FUNCTION "public"."hera_invitations_list_v1"("p_organization_id" "uuid", "p_status" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_is_demo_session"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'session_type' = 'demo',
    false
  );
END;
$$;


ALTER FUNCTION "public"."hera_is_demo_session"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_line_credit_amount"("p_side" "text", "p_line_amount" numeric) RETURNS numeric
    LANGUAGE "sql" IMMUTABLE
    AS $$ SELECT CASE WHEN p_side = 'CR' THEN COALESCE(p_line_amount,0) ELSE 0 END; $$;


ALTER FUNCTION "public"."hera_line_credit_amount"("p_side" "text", "p_line_amount" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_line_credit_amount"("p_side" "text", "p_line_amount" numeric) IS 'Returns line_amount if side=CR, else 0.';



CREATE OR REPLACE FUNCTION "public"."hera_line_debit_amount"("p_side" "text", "p_line_amount" numeric) RETURNS numeric
    LANGUAGE "sql" IMMUTABLE
    AS $$ SELECT CASE WHEN p_side = 'DR' THEN COALESCE(p_line_amount,0) ELSE 0 END; $$;


ALTER FUNCTION "public"."hera_line_debit_amount"("p_side" "text", "p_line_amount" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_line_debit_amount"("p_side" "text", "p_line_amount" numeric) IS 'Returns line_amount if side=DR, else 0.';



CREATE OR REPLACE FUNCTION "public"."hera_line_side"("p_smart_code" "text", "p_line_data" "jsonb") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT CASE
           WHEN p_smart_code ~ '\.GL\.' THEN
             CASE upper(NULLIF(p_line_data->>'side',''))
               WHEN 'DR' THEN 'DR'
               WHEN 'CR' THEN 'CR'
               ELSE NULL
             END
           ELSE NULL  -- non-GL lines ignore side
         END;
$$;


ALTER FUNCTION "public"."hera_line_side"("p_smart_code" "text", "p_line_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_line_side"("p_smart_code" "text", "p_line_data" "jsonb") IS 'Returns normalized DR|CR for GL lines (from line_data.side). Returns NULL for non-GL lines.';



CREATE OR REPLACE FUNCTION "public"."hera_list_branches_v1"("p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_rows jsonb;
begin
  if p_organization_id is null then
    return jsonb_build_object('success',false,'error','organization_id required');
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', e.id,
      'name', coalesce(e.name, (e.metadata->>'display_name'))
    ) order by e.name nulls last, e.created_at),
    '[]'::jsonb
  ) into v_rows
  from core_entities e
  where e.organization_id = p_organization_id
    and e.entity_type = 'BRANCH'
    and e.status = 'active'
    and e.deleted_at is null;

  return jsonb_build_object('success',true,'data',v_rows);
exception when others then
  return jsonb_build_object('success',false,'error',sqlerrm,'code',sqlstate);
end;
$$;


ALTER FUNCTION "public"."hera_list_branches_v1"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_list_branches_v1"("p_organization_id" "uuid") IS 'List active branches for organization';



CREATE OR REPLACE FUNCTION "public"."hera_norm_thresholds"("p_org" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT jsonb_build_object(
    'auto_commit_min', COALESCE((settings->'entity_norm'->>'auto_commit_min')::numeric, 0.95),
    'review_min',      COALESCE((settings->'entity_norm'->>'review_min')::numeric, 0.70),
    'industry',        COALESCE(settings->'entity_norm'->>'industry','GENERIC'),
    'locale',          COALESCE(settings->'entity_norm'->>'locale','en-GB'),
    'role_labels',     COALESCE(settings->'entity_norm'->'role_labels','["stylist"]'::jsonb)
  )
  FROM core_organizations WHERE id = p_org;
$$;


ALTER FUNCTION "public"."hera_norm_thresholds"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_normalize_entity_biu"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_org uuid := NEW.organization_id;
  cfg jsonb := hera_norm_thresholds(v_org);
  v_auto numeric := (cfg->>'auto_commit_min')::numeric;
  v_review numeric := (cfg->>'review_min')::numeric;
  v_locale text := COALESCE(NEW.metadata->>'locale', cfg->>'locale');
  v_industry text := COALESCE(NEW.metadata->>'industry', cfg->>'industry');

  v_label text := lower(coalesce(NEW.entity_name,''));
  v_alias_id uuid;
  v_emp_id uuid;
  v_role_id uuid;
  v_conf numeric := 0.00;

  is_role boolean := v_label = ANY (SELECT jsonb_array_elements_text(cfg->'role_labels'));
BEGIN
  -- Run only for human/HR-ish items (tune as needed)
  IF NEW.entity_type IN ('PERSON','EMPLOYEE','STAFF','ALIAS','ROLE') THEN

    -- Ensure EMPLOYEE concept exists
    SELECT id INTO v_emp_id FROM core_entities
     WHERE organization_id=v_org AND entity_type='CONCEPT'
       AND smart_code='HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.v1';
    IF v_emp_id IS NULL THEN
      INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
      VALUES (v_org,'CONCEPT','EMPLOYEE','HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.v1',
              jsonb_build_object('industry',v_industry))
      RETURNING id INTO v_emp_id;
    END IF;

    -- Ensure ROLE/STYLIST if needed
    IF is_role THEN
      SELECT id INTO v_role_id FROM core_entities
       WHERE organization_id=v_org AND entity_type='CONCEPT'
         AND smart_code='HERA.HCM.EMPLOYMENT.ROLE.STYLIST.v1';
      IF v_role_id IS NULL THEN
        INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
        VALUES (v_org,'CONCEPT','ROLE/STYLIST','HERA.HCM.EMPLOYMENT.ROLE.STYLIST.v1',
                jsonb_build_object('industry',v_industry))
        RETURNING id INTO v_role_id;
      END IF;
    END IF;

    -- Exact alias?
    SELECT id INTO v_alias_id
      FROM core_entities
     WHERE organization_id=v_org AND entity_type='ALIAS' AND entity_name=v_label;

    IF v_alias_id IS NOT NULL THEN
      v_conf := 0.99;
      -- Ensure ALIAS_OF link
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      VALUES (v_org, v_alias_id, v_emp_id,
              'ALIAS_OF','HERA.GENERIC.ALIAS.REL.ALIAS_OF.v1', v_conf)
      ON CONFLICT DO NOTHING;

    ELSE
      -- Fuzzy: find nearest known alias in org
      SELECT a.id
      FROM core_entities a
      WHERE a.organization_id=v_org AND a.entity_type='ALIAS'
      ORDER BY similarity(a.entity_name, v_label) DESC
      LIMIT 1
      INTO v_alias_id;

      IF v_alias_id IS NOT NULL THEN
        v_conf := GREATEST(similarity((SELECT entity_name FROM core_entities WHERE id=v_alias_id), v_label), 0.60);
        IF v_conf >= v_review THEN
          -- Create the alias we saw and link it to EMPLOYEE
          INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
          VALUES (v_org,'ALIAS',v_label,'HERA.GENERIC.ALIAS.ENTITY.LABEL.v1',
                  jsonb_build_object('locale',v_locale,'industry',v_industry))
          ON CONFLICT DO NOTHING;

          SELECT id INTO v_alias_id FROM core_entities
           WHERE organization_id=v_org AND entity_type='ALIAS' AND entity_name=v_label;

          INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
          VALUES (v_org, v_alias_id, v_emp_id,
                  'ALIAS_OF','HERA.GENERIC.ALIAS.REL.ALIAS_OF.v1', v_conf)
          ON CONFLICT DO NOTHING;
        END IF;
      ELSE
        v_conf := 0.00;
      END IF;
    END IF;

    -- Threshold decisions
    IF v_conf >= v_auto THEN
      -- Commit canonical mapping
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      VALUES (v_org, NEW.id, v_emp_id,
              'HAS_CANONICAL_TYPE','HERA.HCM.EMPLOYMENT.REL.HAS_CANONICAL_TYPE.v1', v_conf)
      ON CONFLICT DO NOTHING;

      IF is_role AND v_role_id IS NOT NULL THEN
        INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
        VALUES (v_org, NEW.id, v_role_id,
                'HAS_ROLE','HERA.HCM.EMPLOYMENT.REL.HAS_ROLE.v1', v_conf)
        ON CONFLICT DO NOTHING;
      END IF;

    ELSIF v_conf >= v_review AND v_conf < v_auto THEN
      -- Commit mapping + queue review
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      VALUES (v_org, NEW.id, v_emp_id,
              'HAS_CANONICAL_TYPE','HERA.HCM.EMPLOYMENT.REL.HAS_CANONICAL_TYPE.v1', v_conf)
      ON CONFLICT DO NOTHING;

      PERFORM hera_open_review_txn(v_org, NEW.id, v_label, v_conf, 'needs_review');

    ELSE
      -- Low confidence: open review only
      PERFORM hera_open_review_txn(v_org, NEW.id, v_label, v_conf, 'low_confidence');
    END IF;

    -- Ensure a smart_code on the entity itself (safe default)
    IF NEW.smart_code IS NULL OR NEW.smart_code !~ '^HERA\\.' THEN
      NEW.smart_code := 'HERA.GENERIC.IDENTITY.ENTITY.PERSON.v1';
    END IF;

    -- Persist AI fields
    NEW.ai_confidence := GREATEST(COALESCE(NEW.ai_confidence,0), v_conf);
    NEW.ai_insights := COALESCE(NEW.ai_insights,'{}'::jsonb) || jsonb_build_object(
      'norm_label', v_label, 'industry', v_industry, 'locale', v_locale, 'decision_confidence', v_conf
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."hera_normalize_entity_biu"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_normalize_text"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
    -- Normalize text for consistent matching
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    LOWER(UNACCENT(input_text)),
                    '\s+(llc|inc|ltd|limited|corporation|corp|company|co)\.?$', 
                    '', 
                    'gi'
                ),
                '[^a-z0-9\s]', 
                ' ', 
                'g'
            ),
            '\s+', 
            ' ', 
            'g'
        )
    );
END;
$_$;


ALTER FUNCTION "public"."hera_normalize_text"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_onboard_user_v1"("p_supabase_user_id" "uuid", "p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_role" "text" DEFAULT 'member'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor_id          uuid := coalesce(p_actor_user_id, p_supabase_user_id);
  v_now               timestamptz := now();

  -- Auth profile
  v_auth record;
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
  c_user_sc_platform constant text := 'HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1';
  c_org_sc_shadow    constant text := 'HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1';
  c_role_sc          constant text := 'HERA.UNIVERSAL.ENTITY.ROLE.CANONICAL.v1';
  c_rel_memberof_sc  constant text := 'HERA.UNIVERSAL.REL.MEMBER_OF.USER_TO_ORG.v1';
  c_rel_hasrole_sc   constant text := 'HERA.UNIVERSAL.REL.HAS_ROLE.USER_TO_ROLE.v1';

  -- Role normalization
  v_in_role    text := lower(coalesce(p_role,'member'));
  v_role_code  text;
  v_role_label text := null;
begin
  -- Guards
  if p_supabase_user_id is null then
    raise exception 'hera_onboard_user_v1: p_supabase_user_id is required';
  end if;
  if p_organization_id is null then
    raise exception 'hera_onboard_user_v1: p_organization_id is required';
  end if;
  if v_actor_id is null then
    raise exception 'hera_onboard_user_v1: actor could not be resolved';
  end if;

  -- Auth profile
  select u.email,
         coalesce(u.raw_user_meta_data->>'full_name',
                  u.raw_user_meta_data->>'name',
                  u.raw_user_meta_data->>'display_name',
                  u.email, 'User') as display_name
    into v_auth
  from auth.users u
  where u.id = p_supabase_user_id;

  if not found then
    raise exception 'Supabase user not found: %', p_supabase_user_id;
  end if;

  v_user_email := v_auth.email;
  v_user_name  := v_auth.display_name;

  -- Canonical role code
  v_role_code := case v_in_role
    when 'owner'      then 'ORG_OWNER'
    when 'admin'      then 'ORG_ADMIN'
    when 'manager'    then 'ORG_MANAGER'
    when 'accountant' then 'ORG_ACCOUNTANT'
    when 'employee'   then 'ORG_EMPLOYEE'
    when 'staff'      then 'ORG_EMPLOYEE'
    when 'member'     then 'MEMBER'
    else upper(replace(v_in_role,' ','_'))  -- e.g., finance_manager -> FINANCE_MANAGER
  end;

  if v_in_role not in ('owner','admin','manager','employee','staff','member') then
    v_role_label := v_in_role;
  end if;

  -- 1) Ensure PLATFORM USER entity (global scope, id = auth user id)
  insert into public.core_entities (
    id, organization_id, entity_type, entity_name, entity_code,
    smart_code, smart_code_status, status, metadata, created_by, updated_by
  )
  values (
    p_supabase_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'USER', v_user_name, p_supabase_user_id::text,
    c_user_sc_platform, 'LIVE', 'active',
    jsonb_build_object('email', v_user_email),
    v_actor_id, v_actor_id
  )
  on conflict (id) do update
    set entity_name = excluded.entity_name,
        metadata    = coalesce(excluded.metadata, core_entities.metadata),
        updated_at  = now(),
        updated_by  = v_actor_id
  returning id into v_platform_user_entity_id;

  -- 2) Ensure ORGANIZATION shadow entity (tenant scope)
  select id into v_org_entity_id
  from public.core_entities
  where organization_id = p_organization_id
    and entity_type = 'ORGANIZATION'
  limit 1;

  if v_org_entity_id is null then
    insert into public.core_entities (
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status, metadata, created_by, updated_by
    )
    select
      o.id, 'ORGANIZATION', o.organization_name, o.organization_code,
      c_org_sc_shadow, 'LIVE', o.status,
      jsonb_build_object('source', 'onboard_create'),
      v_actor_id, v_actor_id
    from public.core_organizations o
    where o.id = p_organization_id
    returning id into v_org_entity_id;
  end if;

  -- 3) Ensure ROLE entity (tenant scope) for v_role_code
  select id into v_role_entity_id
  from public.core_entities
  where organization_id = p_organization_id
    and entity_type = 'ROLE'
    and entity_code = v_role_code
  limit 1;

  if v_role_entity_id is null then
    insert into public.core_entities (
      organization_id, entity_type, entity_name, entity_code,
      smart_code, smart_code_status, status, metadata, created_by, updated_by
    )
    values (
      p_organization_id, 'ROLE', v_role_code, v_role_code,
      c_role_sc, 'LIVE', 'active',
      jsonb_build_object('label', v_role_label),
      v_actor_id, v_actor_id
    )
    returning id into v_role_entity_id;
  end if;

  -- 4) Relationships (tenant scope; FROM = PLATFORM USER entity)
  -- 4a) MEMBER_OF
  insert into public.core_relationships (
    organization_id, from_entity_id, to_entity_id,
    relationship_type, relationship_direction,
    relationship_data, smart_code, smart_code_status,
    is_active, created_by, updated_by
  )
  values (
    p_organization_id, v_platform_user_entity_id, v_org_entity_id,
    'MEMBER_OF', 'forward',
    jsonb_build_object('role', v_role_code),
    c_rel_memberof_sc, 'LIVE',
    true, v_actor_id, v_actor_id
  )
  on conflict do nothing;

  update public.core_relationships cr
  set relationship_data = jsonb_set(coalesce(cr.relationship_data,'{}'::jsonb), '{role}', to_jsonb(v_role_code::text), true),
      is_active = true,
      updated_at = now(),
      updated_by = v_actor_id
  where cr.organization_id = p_organization_id
    and cr.from_entity_id  = v_platform_user_entity_id
    and cr.to_entity_id    = v_org_entity_id
    and cr.relationship_type = 'MEMBER_OF';

  select id into v_membership_id
  from public.core_relationships
  where organization_id = p_organization_id
    and from_entity_id  = v_platform_user_entity_id
    and to_entity_id    = v_org_entity_id
    and relationship_type = 'MEMBER_OF'
  order by updated_at desc
  limit 1;

  -- 4b) HAS_ROLE with primary handling (no-trigger version)

  -- Serialize per (org, user) to avoid races
  perform pg_advisory_xact_lock(
    hashtextextended(p_organization_id::text, 0),
    hashtextextended(v_platform_user_entity_id::text, 0)
  );

  -- Find current primary (if any)
  select
    cr.id,
    coalesce((cr.relationship_data->>'role_code')::text, ce.entity_code)
  into v_cur_primary_id, v_cur_primary_code
  from public.core_relationships cr
  join public.core_entities ce on ce.id = cr.to_entity_id
  where cr.organization_id   = p_organization_id
    and cr.from_entity_id    = v_platform_user_entity_id
    and cr.relationship_type = 'HAS_ROLE'
    and coalesce(cr.is_active, true)
    and coalesce((cr.relationship_data->>'is_primary')::boolean,false)
  limit 1;

  -- Decide if the new/updated role should be primary
  v_cur_rank := public._hera_role_rank(v_cur_primary_code);
  v_new_rank := public._hera_role_rank(v_role_code);
  v_make_primary := (v_cur_primary_id is null) or (v_new_rank < v_cur_rank);

  -- Upsert HAS_ROLE for this ROLE entity
  select id into v_hasrole_existing
  from public.core_relationships
  where organization_id   = p_organization_id
    and from_entity_id    = v_platform_user_entity_id
    and to_entity_id      = v_role_entity_id
    and relationship_type = 'HAS_ROLE'
  limit 1;

  if v_hasrole_existing is null then
    insert into public.core_relationships (
      organization_id, from_entity_id, to_entity_id,
      relationship_type, relationship_direction,
      relationship_data, smart_code, smart_code_status,
      is_active, created_by, updated_by
    )
    values (
      p_organization_id, v_platform_user_entity_id, v_role_entity_id,
      'HAS_ROLE', 'forward',
      jsonb_build_object('role_code', v_role_code)
        || coalesce(jsonb_build_object('label', v_role_label), '{}'::jsonb)
        || case when v_make_primary then jsonb_build_object('is_primary', true) else '{}'::jsonb end,
      c_rel_hasrole_sc, 'LIVE',
      true, v_actor_id, v_actor_id
    )
    returning id into v_hasrole_id;
  else
    update public.core_relationships cr
       set relationship_data =
             jsonb_set(coalesce(cr.relationship_data,'{}'::jsonb), '{role_code}', to_jsonb(v_role_code::text), true)
             || coalesce(jsonb_build_object('label', v_role_label), '{}'::jsonb)
             || case when v_make_primary then jsonb_build_object('is_primary', true) else '{}'::jsonb end,
           is_active   = true,
           updated_at  = now(),
           updated_by  = v_actor_id
     where cr.id = v_hasrole_existing
     returning id into v_hasrole_id;
  end if;

  -- If we became primary, demote others (enforced before the unique index could trip)
  if v_make_primary then
    update public.core_relationships r
       set relationship_data = jsonb_set(coalesce(r.relationship_data,'{}'::jsonb), '{is_primary}', 'false'::jsonb, true),
           updated_at = now(),
           updated_by = v_actor_id
     where r.organization_id   = p_organization_id
       and r.from_entity_id    = v_platform_user_entity_id
       and r.relationship_type = 'HAS_ROLE'
       and r.to_entity_id     <> v_role_entity_id
       and coalesce(r.is_active, true)
       and coalesce((r.relationship_data->>'is_primary')::boolean,false);
  end if;

  return jsonb_build_object(
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

exception
  when unique_violation then
    -- Extremely rare due to the advisory lock; resolve by ensuring only one primary then retry message
    raise exception 'hera_onboard_user_v1: unique violation while setting primary role — retry operation';

  when others then
    raise exception 'hera_onboard_user_v1 failed: %', sqlerrm
      using hint = format('auth_user=%s org=%s', p_supabase_user_id, p_organization_id);
end;
$$;


ALTER FUNCTION "public"."hera_onboard_user_v1"("p_supabase_user_id" "uuid", "p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_onboard_user_v1"("p_platform_org" "uuid", "p_tenant_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text" DEFAULT NULL::"text", "p_full_name" "text" DEFAULT NULL::"text", "p_role" "text" DEFAULT NULL::"text", "p_system_actor" "uuid" DEFAULT NULL::"uuid", "p_version" "text" DEFAULT 'V1'::"text") RETURNS TABLE("user_entity_id" "uuid", "attached_org" "uuid", "role_attached" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_entity uuid;
  v_final_role text;
begin
  -- Step 1: Upsert user entity in platform org
  v_entity := public.hera_upsert_user_entity_v1(
    p_platform_org, p_supabase_uid, p_email, p_full_name, p_system_actor, p_version
  );
  
  -- Step 2: Assign membership and role to tenant org
  perform public.hera_assign_membership_v1(
    v_entity, p_tenant_org, p_role, p_system_actor, p_version
  );
  
  -- Return standardized result
  v_final_role := upper(coalesce(p_role,''));
  return query select v_entity, p_tenant_org, v_final_role;
end $$;


ALTER FUNCTION "public"."hera_onboard_user_v1"("p_platform_org" "uuid", "p_tenant_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_txn_id   uuid := NULL;
  v_actor_id uuid := NULL;
  v_code     text;
  v_exists   boolean;
BEGIN
  -- 0) If the referenced entity row doesn't yet exist (BEFORE trigger path),
  --    bail out to avoid FK violation. This makes the function non-failing.
  SELECT EXISTS (
    SELECT 1
    FROM core_entities
    WHERE id = p_entity_id
      AND organization_id = p_org
  ) INTO v_exists;

  IF NOT v_exists THEN
    RETURN NULL; -- no-op, prevent FK error
  END IF;

  -- 1) Resolve actor from common GUCs (ordered fallbacks). If none, skip.
  v_actor_id := NULLIF(current_setting('app.actor_user_id',       true), '')::uuid;
  IF v_actor_id IS NULL THEN
    v_actor_id := NULLIF(current_setting('app.user_id',           true), '')::uuid;
  END IF;
  IF v_actor_id IS NULL THEN
    v_actor_id := NULLIF(current_setting('request.jwt.claim.sub',  true), '')::uuid;
  END IF;

  IF v_actor_id IS NULL THEN
    RETURN NULL; -- no actor context; avoid audit failure
  END IF;

  -- 2) Deterministic code per entity; upsert keeps single "review" per entity
  v_code := 'REVIEW-' || p_entity_id::text;

  INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    source_entity_id,
    total_amount,
    transaction_status,
    smart_code,
    business_context,
    created_by,
    updated_by
  )
  VALUES (
    p_org,
    'CURATION_REVIEW',
    v_code,
    now(),
    p_entity_id,
    0,
    'pending',
    'HERA.GOVERNANCE.CURATION.REVIEW.REQUEST.v1',
    jsonb_build_object('label', p_label, 'confidence', p_conf, 'reason', p_reason),
    v_actor_id,
    v_actor_id
  )
  ON CONFLICT (transaction_code) DO UPDATE
    SET transaction_date = EXCLUDED.transaction_date,
        updated_by       = v_actor_id
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;


ALTER FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_org_custom_page_upsert_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_app_code" "text", "p_page_code" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_actor_role  text;
  v_entity_code text;
  v_sc          text;
  v_id          uuid;
BEGIN
  -- Input validation
  IF p_organization_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'organization_id and actor_user_id are required';
  END IF;
  IF coalesce(trim(p_app_code),'') = '' OR coalesce(trim(p_page_code),'') = '' THEN
    RAISE EXCEPTION 'app_code and page_code are required';
  END IF;

  -- Validate page_code format (entity_code can include underscores; smart_code will not)
  IF p_page_code ~ '^PAGE_' THEN
    RAISE EXCEPTION 'page_code should not include PAGE_ prefix';
  END IF;
  IF upper(p_page_code) ~ ('^'||upper(p_app_code)||'_') THEN
    RAISE EXCEPTION 'page_code should not include app prefix (% already prepended)', upper(p_app_code);
  END IF;
  IF p_page_code !~ '^[A-Z0-9_]+$' THEN
    RAISE EXCEPTION 'page_code must be UPPERCASE alphanumeric with underscores only: %', p_page_code;
  END IF;

  -- RBAC: Only owner/admin can create custom pages
  v_actor_role := public._hera_resolve_org_role(p_actor_user_id, p_organization_id);
  IF v_actor_role IS NULL OR v_actor_role NOT IN ('ORG_OWNER','ORG_ADMIN') THEN
    RAISE EXCEPTION 'forbidden: only owner/admin may manage custom pages (current role: %)', v_actor_role;
  END IF;

  -- (Optional) require app installed in this org
  -- IF NOT EXISTS (
  --   SELECT 1 FROM public.core_relationships r
  --   JOIN public.core_entities org_e ON org_e.id = r.from_entity_id
  --   JOIN public.core_entities app_e ON app_e.id = r.to_entity_id
  --   WHERE r.organization_id = p_organization_id
  --     AND r.relationship_type = 'USES_APP'
  --     AND org_e.entity_type = 'ORGANIZATION'
  --     AND app_e.entity_type = 'APP'
  --     AND app_e.entity_code = upper(p_app_code)
  --     AND coalesce(r.is_active, true)
  -- ) THEN
  --   RAISE EXCEPTION 'app_not_installed_in_org: %', upper(p_app_code);
  -- END IF;

  -- Build entity code and smart code
  v_entity_code := 'PAGE_'||upper(p_app_code)||'_CUSTOM_'||upper(p_page_code);

  -- Use a constant, rule-compliant smart_code (no underscores in segments)
  v_sc := public._hera_sc_build(
    ARRAY['HERA','UNIVERSAL','PERMISSION','PAGE','TENANT','CUSTOM'],
    1
  );

  -- Upsert custom page entity
  INSERT INTO public.core_entities(
    organization_id, entity_type, entity_name, entity_code,
    smart_code, smart_code_status, status, metadata, created_by, updated_by
  ) VALUES (
    p_organization_id, 'PAGE_PERMISSION', v_entity_code, v_entity_code,
    v_sc, 'LIVE', 'active',
    jsonb_build_object('app', upper(p_app_code), 'custom', true) || coalesce(p_metadata,'{}'::jsonb),
    p_actor_user_id, p_actor_user_id
  )
  ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE
    SET entity_name = EXCLUDED.entity_name,
        -- preserve 'custom' and 'app' by taking the new (caller-provided) metadata
        metadata    = EXCLUDED.metadata,
        status      = 'active',
        updated_by  = p_actor_user_id,
        updated_at  = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', p_organization_id,
    'entity_code', v_entity_code,
    'page_entity_id', v_id,
    'smart_code', v_sc
  );
END
$_$;


ALTER FUNCTION "public"."hera_org_custom_page_upsert_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_app_code" "text", "p_page_code" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone DEFAULT "now"(), "p_subscription" "jsonb" DEFAULT '{}'::"jsonb", "p_config" "jsonb" DEFAULT '{}'::"jsonb", "p_is_active" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_code text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id uuid;
  v_app_entity_id uuid;
  v_rel_id uuid;

  v_app_name    text;
  v_app_code_db text;
  v_app_sc      text;

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
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code;
  END IF;

  -- Resolve tenant ORG shadow entity
  SELECT id INTO v_org_entity_id
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
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" is invalid. Expected HERA.PLATFORM.APP.ENTITY.<CODE>.vN', v_app_sc;
  END IF;
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed', v_app_sc;
  END IF;

  -- Segment-5 must match p_app_code (note: double backslash in replacement)
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\\1') <> v_app_code THEN
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
$_$;


ALTER FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone, "p_subscription" "jsonb", "p_config" "jsonb", "p_is_active" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone, "p_subscription" "jsonb", "p_config" "jsonb", "p_is_active" boolean) IS 'Link tenant organization to PLATFORM APP via ORG_HAS_APP relationship. Enforces uppercase code and HERA smart_code pattern. v1.0';



CREATE OR REPLACE FUNCTION "public"."hera_org_list_apps_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_filters" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_include_inactive boolean := COALESCE((p_filters->>'include_inactive')::boolean, false);
  v_code             text    := NULLIF(TRIM(p_filters->>'code'), '');
  v_q                text    := NULLIF(TRIM(p_filters->>'q'), '');

  v_limit            int     := COALESCE(NULLIF(p_filters->>'limit','')::int, 50);
  v_offset           int     := COALESCE(NULLIF(p_filters->>'offset','')::int, 0);

  v_total int;
  v_items jsonb := '[]'::jsonb;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_list_apps_v1: p_actor_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_list_apps_v1: p_organization_id is required';
  END IF;

  -- Bound pagination
  v_limit  := LEAST(GREATEST(v_limit, 0), 500);
  v_offset := GREATEST(v_offset, 0);

  -- Validate code if provided: UPPERCASE alnum only
  IF v_code IS NOT NULL AND (v_code <> UPPER(v_code) OR v_code !~ '^[A-Z0-9]+$') THEN
    RAISE EXCEPTION 'Invalid code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_code;
  END IF;

  -- Count
  SELECT COUNT(*)::int INTO v_total
  FROM public.core_relationships r
  JOIN public.core_entities e
    ON e.id = r.to_entity_id
   AND e.entity_type = 'APP'
   AND e.organization_id = c_platform_org
  WHERE r.organization_id   = p_organization_id
    AND r.relationship_type = 'ORG_HAS_APP'
    AND (v_include_inactive OR COALESCE(r.is_active, true))
    AND (v_code IS NULL OR e.entity_code = v_code)
    AND (
      v_q IS NULL
      OR e.entity_name ILIKE ('%' || v_q || '%')
      OR e.entity_code ILIKE ('%' || v_q || '%')
    );

  -- Page
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_items
  FROM (
    SELECT
      r.id                AS relationship_id,
      COALESCE(r.is_active, true) AS is_active,
      (r.relationship_data->>'installed_at')::timestamptz AS installed_at,
      r.relationship_data->'subscription' AS subscription,
      r.relationship_data->'config'       AS config,
      e.id              AS app_entity_id,
      e.entity_code     AS code,
      e.entity_name     AS name,
      e.smart_code      AS smart_code
    FROM public.core_relationships r
    JOIN public.core_entities e
      ON e.id = r.to_entity_id
     AND e.entity_type = 'APP'
     AND e.organization_id = c_platform_org
    WHERE r.organization_id   = p_organization_id
      AND r.relationship_type = 'ORG_HAS_APP'
      AND (v_include_inactive OR COALESCE(r.is_active, true))
      AND (v_code IS NULL OR e.entity_code = v_code)
      AND (
        v_q IS NULL
        OR e.entity_name ILIKE ('%' || v_q || '%')
        OR e.entity_code ILIKE ('%' || v_q || '%')
      )
    ORDER BY e.entity_name, e.entity_code
    LIMIT v_limit OFFSET v_offset
  ) t;

  RETURN jsonb_build_object(
    'action','LIST',
    'items',  v_items,
    'total',  v_total,
    'limit',  v_limit,
    'offset', v_offset
  );
END;
$_$;


ALTER FUNCTION "public"."hera_org_list_apps_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_filters" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
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
  -- Guards
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_set_default_app_v1: p_actor_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_set_default_app_v1: p_organization_id is required';
  END IF;
  IF v_app_code IS NULL THEN
    RAISE EXCEPTION 'hera_org_set_default_app_v1: p_app_code is required';
  END IF;

  -- Validate app_code: UPPERCASE alnum only
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code;
  END IF;

  -- Resolve tenant ORG shadow entity and org row
  SELECT * INTO v_org_row
  FROM public.core_organizations
  WHERE id = p_organization_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found: %', p_organization_id;
  END IF;

  SELECT id INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'No ORGANIZATION entity found for tenant %', p_organization_id;
  END IF;

  -- Actor must be MEMBER_OF org (standard pattern)
  IF NOT EXISTS (
    SELECT 1
    FROM public.core_relationships r
    WHERE r.organization_id   = p_organization_id
      AND r.from_entity_id    = p_actor_user_id
      AND r.to_entity_id      = v_org_entity_id
      AND r.relationship_type = 'MEMBER_OF'
      AND COALESCE(r.is_active, true)
  ) THEN
    RAISE EXCEPTION 'Actor % is not an active member of organization %', p_actor_user_id, p_organization_id;
  END IF;

  -- Resolve PLATFORM APP and validate smart_code shape
  SELECT e.id, e.entity_name, e.smart_code
    INTO v_app_entity_id, v_app_name, v_app_sc
  FROM public.core_entities e
  WHERE e.organization_id = c_platform_org
    AND e.entity_type     = 'APP'
    AND e.entity_code     = v_app_code
  LIMIT 1;

  IF v_app_entity_id IS NULL THEN
    RAISE EXCEPTION 'APP with code "%" not found in PLATFORM org', v_app_code;
  END IF;

  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid. Expected HERA.PLATFORM.APP.ENTITY.<CODE>.vN', v_app_sc;
  END IF;
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed', v_app_sc;
  END IF;
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\\1') <> v_app_code THEN
    RAISE EXCEPTION 'APP smart_code segment 5 must match code "%"', v_app_code;
  END IF;

  -- Ensure ORG_HAS_APP link exists and is active
  IF NOT EXISTS (
    SELECT 1
    FROM public.core_relationships r
    WHERE r.organization_id   = p_organization_id
      AND r.from_entity_id    = v_org_entity_id
      AND r.to_entity_id      = v_app_entity_id
      AND r.relationship_type = 'ORG_HAS_APP'
      AND COALESCE(r.is_active, true)
  ) THEN
    RAISE EXCEPTION 'Organization % does not have APP "%" installed (active ORG_HAS_APP required)',
      p_organization_id, v_app_code;
  END IF;

  -- Write default_app_code into core_organizations.settings (idempotent)
  v_old_default := (v_org_row.settings->>'default_app_code');

  v_new_settings :=
    COALESCE(v_org_row.settings, '{}'::jsonb)
    || jsonb_build_object('default_app_code', v_app_code);

  UPDATE public.core_organizations
  SET settings   = v_new_settings,
      updated_at = now(),
      updated_by = p_actor_user_id
  WHERE id = p_organization_id;

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
$_$;


ALTER FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") IS 'Set the default app for a tenant organization (core_organizations.settings.default_app_code). Validates actor membership and ORG_HAS_APP.';



CREATE OR REPLACE FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone DEFAULT "now"(), "p_hard_delete" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  -- Canonical PLATFORM org UUID (where all APP entities live)
  c_platform_org constant uuid := '00000000-0000-0000-0000-000000000000'::uuid;

  v_app_code      text := NULLIF(TRIM(p_app_code), '');
  v_org_entity_id uuid;
  v_app_entity_id uuid;
  v_rel_id        uuid;
  v_affected      int  := 0;

  v_app_name      text;
  v_app_code_db   text;
  v_app_sc        text;
BEGIN
  -- ============================================================
  -- 1) INPUT VALIDATION
  -- ============================================================
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_unlink_app_v1: p_actor_user_id is required';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_org_unlink_app_v1: p_organization_id is required';
  END IF;
  IF v_app_code IS NULL THEN
    RAISE EXCEPTION 'hera_org_unlink_app_v1: p_app_code is required';
  END IF;

  -- Validate code format: UPPERCASE alphanumeric only (no underscores/spaces)
  IF v_app_code <> UPPER(v_app_code) OR v_app_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid p_app_code "%": must be UPPERCASE alphanumeric with no underscores/spaces', v_app_code;
  END IF;

  -- ============================================================
  -- 2) RESOLVE TENANT ORG ENTITY (SHADOW ENTITY)
  -- ============================================================
  SELECT id INTO v_org_entity_id
  FROM public.core_entities
  WHERE organization_id = p_organization_id
    AND entity_type     = 'ORGANIZATION'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'No ORGANIZATION entity found for tenant %', p_organization_id;
  END IF;

  -- ============================================================
  -- 3) VALIDATE ACTOR MEMBERSHIP (STANDARD MEMBER_OF PATTERN)
  -- ============================================================
  -- Pattern: USER entity (from_entity_id) MEMBER_OF org entity (to_entity_id)
  IF NOT EXISTS (
    SELECT 1
    FROM public.core_relationships r
    WHERE r.organization_id   = p_organization_id
      AND r.from_entity_id    = p_actor_user_id
      AND r.to_entity_id      = v_org_entity_id
      AND r.relationship_type = 'MEMBER_OF'
      AND COALESCE(r.is_active, true)
  ) THEN
    RAISE EXCEPTION 'Actor % is not an active member of organization %. Please verify actor has MEMBER_OF relationship with this organization.',
      p_actor_user_id, p_organization_id;
  END IF;

  -- ============================================================
  -- 4) RESOLVE PLATFORM APP ENTITY
  -- ============================================================
  SELECT e.id, e.entity_name, e.entity_code, e.smart_code
    INTO v_app_entity_id, v_app_name, v_app_code_db, v_app_sc
  FROM public.core_entities e
  WHERE e.organization_id = c_platform_org
    AND e.entity_type     = 'APP'
    AND e.entity_code     = v_app_code
  LIMIT 1;

  IF v_app_entity_id IS NULL THEN
    RAISE EXCEPTION 'APP with code "%" not found in PLATFORM org. Query core_entities where entity_type=APP and organization_id=%',
      v_app_code, c_platform_org;
  END IF;

  -- ============================================================
  -- 5) VALIDATE APP SMART CODE FORMAT (DEFENSIVE)
  -- ============================================================
  -- Expected: HERA.PLATFORM.APP.ENTITY.<CODE>.vN  (no underscores)
  IF v_app_sc !~ '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$' THEN
    RAISE EXCEPTION 'APP smart_code "%" is invalid. Expected format: HERA.PLATFORM.APP.ENTITY.<CODE>.vN where CODE is UPPERCASE alphanumeric',
      v_app_sc;
  END IF;

  -- Underscores not allowed in smart codes (HERA DNA rule)
  IF POSITION('_' IN v_app_sc) > 0 THEN
    RAISE EXCEPTION 'APP smart_code "%" invalid: underscores are not allowed in HERA DNA smart codes', v_app_sc;
  END IF;

  -- Segment 5 (app code) must match the p_app_code parameter
  IF REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') <> v_app_code THEN
    RAISE EXCEPTION 'APP smart_code segment mismatch: expected "%" but smart_code contains "%". Smart code: %',
      v_app_code,
      REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1'),
      v_app_sc;
  END IF;

  -- ============================================================
  -- 6) LOCATE EXISTING ORG_HAS_APP RELATIONSHIP
  -- ============================================================
  SELECT id INTO v_rel_id
  FROM public.core_relationships r
  WHERE r.organization_id   = p_organization_id
    AND r.from_entity_id    = v_org_entity_id
    AND r.to_entity_id      = v_app_entity_id
    AND r.relationship_type = 'ORG_HAS_APP'
  LIMIT 1;

  IF v_rel_id IS NULL THEN
    RAISE EXCEPTION 'ORG_HAS_APP relationship not found for org % and app %. App may not be installed or was already uninstalled.',
      p_organization_id, v_app_code;
  END IF;

  -- ============================================================
  -- 7) UNINSTALL: SOFT (DEFAULT) OR HARD DELETE
  -- ============================================================
  IF COALESCE(p_hard_delete, false) IS TRUE THEN
    -- HARD DELETE: Irreversible, breaks audit trail (use sparingly)
    DELETE FROM public.core_relationships
    WHERE id = v_rel_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;

    RETURN jsonb_build_object(
      'action','UNLINK',
      'mode','hard',
      'affected', v_affected,
      'relationship_id', v_rel_id,
      'organization_id', p_organization_id,
      'uninstalled_at', p_uninstalled_at,
      'app', jsonb_build_object(
        'id', v_app_entity_id,
        'code', v_app_code_db,
        'name', v_app_name,
        'smart_code', v_app_sc
      )
    );
  ELSE
    -- SOFT UNINSTALL: is_active=false + stamp uninstalled_at (RECOMMENDED)
    UPDATE public.core_relationships r
       SET is_active = false,
           relationship_data =
             COALESCE(r.relationship_data, '{}'::jsonb)
             || jsonb_build_object('uninstalled_at', p_uninstalled_at),
           updated_at = now(),
           updated_by = p_actor_user_id
     WHERE r.id = v_rel_id;

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    RETURN jsonb_build_object(
      'action','UNLINK',
      'mode','soft',
      'affected', v_affected,
      'relationship_id', v_rel_id,
      'organization_id', p_organization_id,
      'uninstalled_at', p_uninstalled_at,
      'app', jsonb_build_object(
        'id', v_app_entity_id,
        'code', v_app_code_db,
        'name', v_app_name,
        'smart_code', v_app_sc
      )
    );
  END IF;
END;
$_$;


ALTER FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone, "p_hard_delete" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone, "p_hard_delete" boolean) IS 'Uninstall (deactivate) a PLATFORM APP from a tenant org via ORG_HAS_APP relationship.
   Validates actor membership using MEMBER_OF pattern and APP smart code compliance.
   Default behavior is soft delete (preserves audit trail). v1.0 - Production Ready';



CREATE OR REPLACE FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  -- TODO: real insert into core_organizations

  return jsonb_build_object('ok', true, 'organization_id', p_organization_id);

end;

$$;


ALTER FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  rec_org public.core_organizations%rowtype;
  v_user_count int;
  v_now timestamptz := now();
  v_metadata jsonb;
begin
  select * into rec_org
  from public.core_organizations
  where id = p_organization_id
  limit 1;


  if not found then
    raise exception 'ORG_NOT_FOUND' using errcode = 'P0002';
  end if;


  if coalesce(trim(p_confirmation), '') <> coalesce(rec_org.organization_name, '') then
    raise exception 'CONFIRMATION_MISMATCH' using errcode = 'P0001', hint = 'Confirmation text must exactly match organization name.';
  end if;


  select count(*) into v_user_count
  from public.core_relationships r
  where r.organization_id = p_organization_id
    and r.relationship_type = 'USER_MEMBER_OF_ORG'
    and coalesce(r.is_active, true) = true;


  if v_user_count > 1 and coalesce(p_force, false) is not true then
    raise exception 'ORG_HAS_ACTIVE_USERS' using errcode = 'P0001', detail = 'Active user memberships exist; set force=true or remove users first.';
  end if;


  v_metadata := coalesce(rec_org.metadata, '{}'::jsonb) || jsonb_build_object(
    'deleted_at', v_now,
    'deleted_by', p_actor_user_id,
    'delete_reason', 'api_v2'
  );


  update public.core_organizations
     set status = 'inactive',
         metadata = v_metadata,
         updated_at = v_now
   where id = p_organization_id;


  insert into public.universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    smart_code,
    business_context,
    metadata,
    created_at
  ) values (
    gen_random_uuid(),
    p_organization_id,
    'organization_deleted',
    null,
    v_now,
    'HERA.AUDIT.ORG.DELETED.v1',
    jsonb_build_object(
      'user_id', p_actor_user_id,
      'active_user_count', v_user_count
    ),
    jsonb_build_object('actor', p_actor_user_id),
    v_now
  );


  return jsonb_build_object(
    'ok', true,
    'organization_id', p_organization_id,
    'status', 'inactive'
  );
end;
$$;


ALTER FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_now        timestamptz := now();
  v_row        public.core_organizations%rowtype;
  v_role       text;

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

  v_bootstrap  boolean := coalesce((p_payload->>'bootstrap')::boolean, false);
  v_owner_user_id uuid := nullif(p_payload->>'owner_user_id','')::uuid;
  v_members       jsonb := coalesce(p_payload->'members','[]'::jsonb);
  v_member        jsonb;

  -- NEW: app bootstrap inputs (optional)
  v_apps        jsonb := coalesce(p_payload->'apps','[]'::jsonb);         -- [{code,subscription?,config?,is_active?}, ...]
  v_app         jsonb;
  v_default_app text := nullif(trim(p_payload->>'default_app_code'), ''); -- UPPERCASE, must be installed to be set

  v_org_entity_id uuid;
  c_org_sc_shadow constant text := 'HERA.UNIVERSAL.ENTITY.ORGANIZATION.SHADOW.v1';
BEGIN
  IF p_action NOT IN ('CREATE','UPDATE','GET','LIST','ARCHIVE') THEN
    RAISE EXCEPTION 'Unsupported action: %', p_action;
  END IF;

  IF p_action IN ('CREATE','UPDATE','ARCHIVE') AND p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'p_actor_user_id is required for writes';
  END IF;

  IF p_action IN ('UPDATE','ARCHIVE','GET') THEN
    IF (p_payload ? 'id') IS NOT TRUE THEN
      RAISE EXCEPTION 'id is required in payload for %', p_action;
    END IF;

    v_role := public._hera_resolve_org_role(p_actor_user_id, v_id);
    IF v_role IS NULL THEN
      RAISE EXCEPTION 'actor_not_member: % is not a member of org %', p_actor_user_id, v_id;
    END IF;

    IF p_action IN ('UPDATE','ARCHIVE') AND v_role NOT IN ('ORG_OWNER','ORG_ADMIN') THEN
      RAISE EXCEPTION 'forbidden: role % cannot % organization', v_role, lower(p_action);
    END IF;
  END IF;

  -- ================= CREATE =================
  IF p_action = 'CREATE' THEN
    IF v_org_name IS NULL THEN
      RAISE EXCEPTION 'organization_name is required';
    END IF;
    IF v_org_code IS NULL THEN
      RAISE EXCEPTION 'organization_code is required';
    END IF;
    IF v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'invalid status: %', v_status;
    END IF;
    IF v_ai_conf < 0 OR v_ai_conf > 1 THEN
      RAISE EXCEPTION 'ai_confidence must be between 0 and 1';
    END IF;

    PERFORM 1 FROM public.core_organizations WHERE lower(organization_code) = lower(v_org_code);
    IF FOUND THEN
      RAISE EXCEPTION 'duplicate: organization_code "%" already exists', v_org_code;
    END IF;

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

    -- Ensure ORGANIZATION entity (shadow)
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

    -- Unified onboarding (PLATFORM user -> ORG + ROLE)
    IF v_bootstrap THEN
      PERFORM public.hera_onboard_user_v1(
        p_supabase_user_id := p_actor_user_id,
        p_organization_id  := v_row.id,
        p_actor_user_id    := p_actor_user_id,
        p_role             := 'owner'
      );
    END IF;

    IF v_owner_user_id IS NOT NULL THEN
      PERFORM public.hera_onboard_user_v1(
        p_supabase_user_id := v_owner_user_id,
        p_organization_id  := v_row.id,
        p_actor_user_id    := p_actor_user_id,
        p_role             := 'owner'
      );
    END IF;

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

    -- ========= NEW: optional APP bootstrap =========
    IF jsonb_typeof(v_apps) = 'array' THEN
      FOR v_app IN SELECT * FROM jsonb_array_elements(v_apps) LOOP
        -- delegate validation to RPCs (uppercase code, smart code compliance, etc.)
        IF (v_app ? 'code') AND nullif(trim(v_app->>'code'), '') IS NOT NULL THEN
          IF coalesce((v_app->>'is_active')::boolean, true) IS TRUE THEN
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
            -- explicit inactive -> soft uninstall if previously linked
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

    -- Optional: set default app (must be installed/active)
    IF v_default_app IS NOT NULL THEN
      PERFORM public.hera_org_set_default_app_v1(
        p_actor_user_id   := p_actor_user_id,
        p_organization_id := v_row.id,
        p_app_code        := v_default_app
      );
    END IF;
    -- ======== END: APP bootstrap =========

    RETURN jsonb_build_object('action','CREATE','organization', to_jsonb(v_row));
  END IF;

  -- ================= UPDATE =================
  IF p_action = 'UPDATE' THEN
    SELECT * INTO v_row FROM public.core_organizations WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found: %', v_id;
    END IF;

    IF p_payload ? 'organization_code' THEN
      PERFORM 1 FROM public.core_organizations
       WHERE lower(organization_code) = lower(v_org_code)
         AND id <> v_id;
      IF FOUND THEN
        RAISE EXCEPTION 'duplicate: organization_code "%" already exists', v_org_code;
      END IF;
    END IF;

    IF p_payload ? 'status' AND v_status NOT IN ('active','inactive','archived') THEN
      RAISE EXCEPTION 'invalid status: %', v_status;
    END IF;
    IF p_payload ? 'ai_confidence' AND (v_ai_conf < 0 OR v_ai_conf > 1) THEN
      RAISE EXCEPTION 'ai_confidence must be between 0 and 1';
    END IF;

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
      updated_by              = p_actor_user_id
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

  -- ================= ARCHIVE =================
  IF p_action = 'ARCHIVE' THEN
    UPDATE public.core_organizations SET
      status     = 'archived',
      updated_by = p_actor_user_id
    WHERE id = v_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found: %', v_id;
    END IF;

    UPDATE public.core_entities
      SET status = 'archived', updated_by = p_actor_user_id, updated_at = now()
      WHERE organization_id = v_row.id AND entity_type = 'ORGANIZATION';

    RETURN jsonb_build_object('action','ARCHIVE','organization', to_jsonb(v_row));
  END IF;

  -- ================= GET =================
  IF p_action = 'GET' THEN
    SELECT * INTO v_row FROM public.core_organizations WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found: %', v_id;
    END IF;

    RETURN jsonb_build_object('action','GET','organization', to_jsonb(v_row));
  END IF;

  -- ================= LIST =================
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
$$;


ALTER FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb", "p_limit" integer, "p_offset" integer) IS 'CRUD for core_organizations. Ensures ORG entity; user onboarding via hera_onboard_user_v1. CREATE optionally bootstraps apps via hera_org_link_app_v1 / hera_org_unlink_app_v1 and sets default via hera_org_set_default_app_v1.';



CREATE OR REPLACE FUNCTION "public"."hera_outbox_enqueue_v1"("p_organization_id" "uuid", "p_topic" "text", "p_event" "jsonb", "p_actor_user_id" "uuid", "p_idem_key" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_idem  text := COALESCE(
    p_idem_key,
    encode(digest(p_topic || ':' || p_organization_id::text || coalesce(p_event::text,''), 'sha256'),'hex')
  );
  v_epoch bigint := FLOOR(EXTRACT(EPOCH FROM now()));
  v_row   universal_transactions%ROWTYPE;
BEGIN
  IF p_organization_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'ORG/ACTOR required';
  END IF;
  IF p_topic IS NULL OR p_event IS NULL THEN
    RAISE EXCEPTION 'TOPIC/EVENT required';
  END IF;

  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_status,
    smart_code, smart_code_status, business_context,
    created_at, updated_at, created_by, updated_by, version
  ) VALUES (
    gen_random_uuid(),
    p_organization_id,
    'OUTBOX',
    'pending',
    'HERA.PLATFORM.OUTBOX.EVENT.v1',  -- canonical
    'LIVE',
    jsonb_build_object(
      'topic', p_topic,
      'event', p_event,
      'idem_key', v_idem,
      'status', 'pending',
      'available_at', to_char((now() at time zone 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'available_at_epoch', v_epoch,
      'retries', 0
    ),
    now(), now(), p_actor_user_id, p_actor_user_id, 1
  )
  ON CONFLICT (organization_id, (business_context->>'idem_key'))
  WHERE smart_code = 'HERA.PLATFORM.OUTBOX.EVENT.v1'
  DO NOTHING;

  SELECT * INTO v_row
  FROM universal_transactions
  WHERE organization_id = p_organization_id
    AND smart_code = 'HERA.PLATFORM.OUTBOX.EVENT.v1'
    AND business_context->>'idem_key' = v_idem
  LIMIT 1;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_row.id, 'status', v_row.transaction_status);
END $$;


ALTER FUNCTION "public"."hera_outbox_enqueue_v1"("p_organization_id" "uuid", "p_topic" "text", "p_event" "jsonb", "p_actor_user_id" "uuid", "p_idem_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_rate_limit_invite_guard_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_max_per_hour" integer DEFAULT 10, "p_max_per_day" integer DEFAULT 50) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  c_hour int;
  c_day  int;
  retry_after int := 0;
  allowed boolean := true;
begin
  select count(*) into c_hour
  from public.universal_transactions ut
  where ut.organization_id = p_organization_id
    and ut.transaction_type = 'user_invitation'
    and ut.created_at >= now() - interval '1 hour'
    and (ut.metadata->>'invited_by' = p_actor_user_id::text
         or (ut.metadata->'status_history'->0->>'actor') = p_actor_user_id::text);

  select count(*) into c_day
  from public.universal_transactions ut
  where ut.organization_id = p_organization_id
    and ut.transaction_type = 'user_invitation'
    and ut.created_at >= now() - interval '1 day';

  if c_hour >= p_max_per_hour then
    allowed := false;
    retry_after := extract(epoch from (date_trunc('hour', now()) + interval '1 hour' - now()))::int;
  elsif c_day >= p_max_per_day then
    allowed := false;
    retry_after := extract(epoch from (date_trunc('day', now()) + interval '1 day' - now()))::int;
  end if;

  return jsonb_build_object(
    'allowed', allowed,
    'hour_count', c_hour,
    'day_count',  c_day,
    'retry_after_sec', retry_after
  );
end;
$$;


ALTER FUNCTION "public"."hera_rate_limit_invite_guard_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_max_per_hour" integer, "p_max_per_day" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_refresh_rpt_entity_profiles"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If you created the MV with CONCURRENTLY support (unique index), use that form:
  -- EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY rpt_entity_profiles';
  EXECUTE 'REFRESH MATERIALIZED VIEW rpt_entity_profiles';
END;
$$;


ALTER FUNCTION "public"."hera_refresh_rpt_entity_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_regex_smartcode"() RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  SELECT '^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$'
$_$;


ALTER FUNCTION "public"."hera_regex_smartcode"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_relationship_bulk_link_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_to_entity_id" "uuid", "p_from_entity_ids" "uuid"[], "p_smart_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  v_existing_count INTEGER;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  IF p_relationship_type IS NULL OR p_to_entity_id IS NULL OR array_length(p_from_entity_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid parameters: relationship_type, to_entity_id, and from_entity_ids are required'
    );
  END IF;

  -- Process each entity
  FOR i IN 1..array_length(p_from_entity_ids, 1) LOOP
    BEGIN
      -- Check if relationship already exists
      SELECT COUNT(*)
      INTO v_existing_count
      FROM core_relationships
      WHERE from_entity_id = p_from_entity_ids[i]
        AND to_entity_id = p_to_entity_id
        AND relationship_type = p_relationship_type
        AND organization_id = p_organization_id
        AND deleted_at IS NULL;

      IF v_existing_count > 0 THEN
        -- Update existing relationship
        UPDATE core_relationships
        SET updated_at = CURRENT_TIMESTAMP,
            smart_code = p_smart_code,
            is_active = TRUE
        WHERE from_entity_id = p_from_entity_ids[i]
          AND to_entity_id = p_to_entity_id
          AND relationship_type = p_relationship_type
          AND organization_id = p_organization_id
          AND deleted_at IS NULL;
        
        v_updated_count := v_updated_count + 1;
      ELSE
        -- Insert new relationship
        INSERT INTO core_relationships (
          organization_id,
          from_entity_id,
          to_entity_id,
          relationship_type,
          smart_code,
          relationship_direction,
          is_active
        ) VALUES (
          p_organization_id,
          p_from_entity_ids[i],
          p_to_entity_id,
          p_relationship_type,
          p_smart_code,
          'forward',
          TRUE
        );
        
        v_created_count := v_created_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'entity_id', p_from_entity_ids[i],
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', v_error_count = 0,
    'data', jsonb_build_object(
      'created', v_created_count,
      'updated', v_updated_count,
      'errors', v_error_count
    ),
    'errors', v_errors
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;


ALTER FUNCTION "public"."hera_relationship_bulk_link_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_to_entity_id" "uuid", "p_from_entity_ids" "uuid"[], "p_smart_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_relationship_bulk_link_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_to_entity_id" "uuid", "p_from_entity_ids" "uuid"[], "p_smart_code" "text") IS 'Bulk create relationships between multiple entities and a target entity. Supports multiple branches per entity.';



CREATE OR REPLACE FUNCTION "public"."hera_relationship_bulk_move_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_branch_id" "uuid", "p_to_branch_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_moved_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  -- Process each entity
  FOR i IN 1..array_length(p_entity_ids, 1) LOOP
    BEGIN
      -- Soft delete old relationship
      UPDATE core_relationships
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE organization_id = p_organization_id
        AND from_entity_id = p_entity_ids[i]
        AND to_entity_id = p_from_branch_id
        AND relationship_type = p_relationship_type
        AND deleted_at IS NULL;

      -- Create new relationship
      INSERT INTO core_relationships (
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        relationship_direction,
        is_active,
        metadata
      ) VALUES (
        p_organization_id,
        p_entity_ids[i],
        p_to_branch_id,
        p_relationship_type,
        p_smart_code,
        'forward',
        TRUE,
        jsonb_build_object(
          'moved_from', p_from_branch_id,
          'moved_at', CURRENT_TIMESTAMP
        )
      )
      ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
      WHERE deleted_at IS NULL
      DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        smart_code = EXCLUDED.smart_code,
        is_active = TRUE,
        metadata = COALESCE(core_relationships.metadata, '{}'::JSONB) || EXCLUDED.metadata;

      v_moved_count := v_moved_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'entity_id', p_entity_ids[i],
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', v_error_count = 0,
    'data', jsonb_build_object(
      'moved', v_moved_count,
      'errors', v_error_count
    ),
    'errors', v_errors
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;


ALTER FUNCTION "public"."hera_relationship_bulk_move_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_branch_id" "uuid", "p_to_branch_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_relationship_bulk_move_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_branch_id" "uuid", "p_to_branch_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") IS 'Move multiple entities from one branch to another';



CREATE OR REPLACE FUNCTION "public"."hera_relationship_bulk_unlink_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_entity_ids" "uuid"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_deleted_count INTEGER;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  -- Soft delete the relationships
  WITH deleted AS (
    UPDATE core_relationships
    SET deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = p_organization_id
      AND relationship_type = p_relationship_type
      AND from_entity_id = ANY(p_from_entity_ids)
      AND deleted_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM deleted;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'data', jsonb_build_object(
      'deleted', v_deleted_count
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;


ALTER FUNCTION "public"."hera_relationship_bulk_unlink_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_entity_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_relationship_bulk_unlink_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_entity_ids" "uuid"[]) IS 'Bulk soft-delete relationships for multiple entities';



CREATE OR REPLACE FUNCTION "public"."hera_relationship_create_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_relationship_direction" "text" DEFAULT 'forward'::"text", "p_relationship_strength" numeric DEFAULT 1.0, "p_smart_code" character varying DEFAULT NULL::character varying, "p_relationship_data" "jsonb" DEFAULT '{}'::"jsonb", "p_business_logic" "jsonb" DEFAULT '{}'::"jsonb", "p_validation_rules" "jsonb" DEFAULT '{}'::"jsonb", "p_is_active" boolean DEFAULT true, "p_effective_date" timestamp with time zone DEFAULT "now"(), "p_expiration_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_organization_id IS NULL OR p_from_entity_id IS NULL OR p_to_entity_id IS NULL OR p_relationship_type IS NULL THEN
    RAISE EXCEPTION 'hera_relationship_create_v1: missing required fields';
  END IF;

  INSERT INTO core_relationships(
    organization_id, from_entity_id, to_entity_id, relationship_type,
    relationship_direction, relationship_strength, relationship_data,
    smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
    business_logic, validation_rules, is_active, effective_date, expiration_date,
    created_at, updated_at, created_by, updated_by, version
  ) VALUES (
    p_organization_id, p_from_entity_id, p_to_entity_id, p_relationship_type,
    p_relationship_direction, p_relationship_strength, p_relationship_data,
    p_smart_code, 'DRAFT', 0, NULL, '{}'::jsonb,
    p_business_logic, p_validation_rules, p_is_active, p_effective_date, p_expiration_date,
    now(), now(), p_actor_user_id, p_actor_user_id, 1
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."hera_relationship_create_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_smart_code" character varying, "p_relationship_data" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_relationship_delete_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid", "p_expiration_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    UPDATE core_relationships
    SET
        is_active = false,
        expiration_date = COALESCE(p_expiration_date, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
    WHERE organization_id = p_organization_id
      AND id = p_relationship_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Relationship not found or already deleted'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_updated_id,
            'deleted_at', p_expiration_date
        )
    );
END;
$$;


ALTER FUNCTION "public"."hera_relationship_delete_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid", "p_expiration_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_relationship_query_v1"("p_organization_id" "uuid", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_side" "text" DEFAULT 'either'::"text", "p_relationship_type" "text" DEFAULT NULL::"text", "p_active_only" boolean DEFAULT true, "p_effective_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_effective_to" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_rows  jsonb;
  v_total integer;
BEGIN
  WITH filtered AS (
    SELECT r.*
    FROM core_relationships r
    WHERE r.organization_id = p_organization_id
      -- Side filter
      AND (
        p_entity_id IS NULL OR
        CASE p_side
          WHEN 'from'  THEN r.from_entity_id = p_entity_id
          WHEN 'to'    THEN r.to_entity_id   = p_entity_id
          ELSE (r.from_entity_id = p_entity_id OR r.to_entity_id = p_entity_id)
        END
      )
      -- Type filter
      AND (p_relationship_type IS NULL OR r.relationship_type = p_relationship_type)
      -- Active window filter (if requested): active now
      AND (
        NOT p_active_only
        OR (
          r.is_active = TRUE
          AND r.effective_date <= now()
          AND (r.expiration_date IS NULL OR r.expiration_date > now())
        )
      )
      -- Explicit date window filters
      AND (p_effective_from IS NULL OR r.effective_date >= p_effective_from)
      AND (
        p_effective_to IS NULL
        OR r.effective_date <= p_effective_to
        OR r.expiration_date <= p_effective_to
        OR r.expiration_date IS NULL
      )
  ),
  paginated AS (
    SELECT *
    FROM filtered
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id',                 p.id,
        'organization_id',    p.organization_id,
        'from_entity_id',     p.from_entity_id,
        'to_entity_id',       p.to_entity_id,
        'relationship_type',  p.relationship_type,
        'relationship_direction', p.relationship_direction,
        'relationship_strength',  p.relationship_strength,
        'relationship_data',  p.relationship_data,
        'smart_code',         p.smart_code,
        'smart_code_status',  p.smart_code_status,
        'ai_confidence',      p.ai_confidence,
        'ai_classification',  p.ai_classification,
        'ai_insights',        p.ai_insights,
        'business_logic',     p.business_logic,
        'validation_rules',   p.validation_rules,
        'is_active',          p.is_active,
        'effective_date',     p.effective_date,
        'expiration_date',    p.expiration_date,
        'created_at',         p.created_at,
        'updated_at',         p.updated_at,
        'created_by',         p.created_by,
        'updated_by',         p.updated_by,
        'version',            p.version
      )
    ),
    (SELECT COUNT(*) FROM filtered)
  INTO v_rows, v_total
  FROM paginated p;

  RETURN jsonb_build_object(
    'success', true,
    'data', COALESCE(v_rows, '[]'::jsonb),
    'metadata', jsonb_build_object(
      'total',  v_total,
      'limit',  p_limit,
      'offset', p_offset,
      'has_more', (v_total > p_offset + p_limit)
    )
  );
END;
$$;


ALTER FUNCTION "public"."hera_relationship_query_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_side" "text", "p_relationship_type" "text", "p_active_only" boolean, "p_effective_from" timestamp with time zone, "p_effective_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_relationship_read_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', r.id,
        'organization_id', r.organization_id,
        'from_entity_id', r.from_entity_id,
        'to_entity_id', r.to_entity_id,
        'relationship_type', r.relationship_type,
        'relationship_direction', r.relationship_direction,
        'relationship_strength', r.relationship_strength,
        -- Removed non-existent columns: relationship_subtype, relationship_name, relationship_code
        'smart_code', r.smart_code,
        'smart_code_status', r.smart_code_status,
        'is_active', r.is_active,
        'effective_date', r.effective_date,
        'expiration_date', r.expiration_date,
        'relationship_data', r.relationship_data,
        'business_logic', r.business_logic,
        'validation_rules', r.validation_rules,
        'ai_confidence', r.ai_confidence,
        'ai_classification', r.ai_classification,
        'ai_insights', r.ai_insights,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'created_by', r.created_by,
        'updated_by', r.updated_by,
        'version', r.version
    ) INTO v_result
    FROM core_relationships r
    WHERE r.organization_id = p_organization_id
      AND r.id = p_relationship_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Relationship not found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_result
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_RELATIONSHIP_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_relationship_read_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_relationship_read_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid") IS 'HERA Relationship Read Function v1 - Fixed for actual schema';



CREATE OR REPLACE FUNCTION "public"."hera_relationship_upsert_batch_v1"("p_organization_id" "uuid", "p_rows" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_item     jsonb;
  v_from     uuid;
  v_to       uuid;
  v_type     text;
  v_code     varchar;
  v_dir      text;
  v_strength numeric;
  v_data     jsonb;
  v_biz      jsonb;
  v_rules    jsonb;
  v_active   boolean;
  v_eff      timestamptz;
  v_exp      timestamptz;
  v_id       uuid;
  v_results  jsonb := '[]'::jsonb;
  v_success  int   := 0;
  v_errors   int   := 0;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'hera_relationship_upsert_batch_v1: p_organization_id is required';
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'hera_relationship_upsert_batch_v1: p_rows must be a JSON array';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      -- extract fields (only columns that actually exist)
      v_from     := (v_item->>'from_entity_id')::uuid;
      v_to       := (v_item->>'to_entity_id')::uuid;
      v_type     := (v_item->>'relationship_type');
      v_code     := (v_item->>'smart_code');
      v_dir      := COALESCE(v_item->>'relationship_direction', 'forward');
      v_strength := COALESCE(NULLIF(v_item->>'relationship_strength','')::numeric, 1.0);
      v_data     := COALESCE(v_item->'relationship_data', '{}'::jsonb);
      v_biz      := COALESCE(v_item->'business_logic', '{}'::jsonb);
      v_rules    := COALESCE(v_item->'validation_rules', '{}'::jsonb);
      v_active   := COALESCE(NULLIF(v_item->>'is_active','')::boolean, true);
      v_eff      := COALESCE(NULLIF(v_item->>'effective_date','')::timestamptz, now());
      v_exp      := NULLIF(v_item->>'expiration_date','')::timestamptz;

      IF v_from IS NULL OR v_to IS NULL OR v_type IS NULL THEN
        RAISE EXCEPTION 'Missing required fields (from_entity_id, to_entity_id, relationship_type)';
      END IF;

      -- try update existing active row for same (from,to,type) without expiration
      UPDATE core_relationships SET
        relationship_direction  = v_dir,
        relationship_strength   = v_strength,
        relationship_data       = v_data,
        smart_code              = v_code,
        smart_code_status       = COALESCE(smart_code_status, 'DRAFT'),
        business_logic          = v_biz,
        validation_rules        = v_rules,
        is_active               = v_active,
        effective_date          = v_eff,
        expiration_date         = v_exp,
        updated_at              = now(),
        version                 = version + 1
      WHERE organization_id = p_organization_id
        AND from_entity_id   = v_from
        AND to_entity_id     = v_to
        AND relationship_type= v_type
      RETURNING id INTO v_id;

      IF v_id IS NULL THEN
        INSERT INTO core_relationships(
          organization_id, from_entity_id, to_entity_id, relationship_type,
          relationship_direction, relationship_strength, relationship_data,
          smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
          business_logic, validation_rules, is_active, effective_date, expiration_date,
          created_at, updated_at, created_by, updated_by, version
        ) VALUES (
          p_organization_id, v_from, v_to, v_type,
          v_dir, v_strength, v_data,
          v_code, 'DRAFT', 0, NULL, '{}'::jsonb,
          v_biz, v_rules, v_active, v_eff, v_exp,
          now(), now(), NULL, NULL, 1
        )
        RETURNING id INTO v_id;

        v_results := v_results || jsonb_build_array(
          jsonb_build_object('row', v_item, 'status', 'created', 'id', v_id)
        );
      ELSE
        v_results := v_results || jsonb_build_array(
          jsonb_build_object('row', v_item, 'status', 'updated', 'id', v_id)
        );
      END IF;

      v_success := v_success + 1;

    EXCEPTION WHEN OTHERS THEN
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('row', v_item, 'status', 'error', 'error', SQLERRM)
      );
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', (v_errors = 0),
    'status', CASE WHEN v_errors = 0 THEN 200 WHEN v_success > 0 THEN 207 ELSE 400 END,
    'summary', jsonb_build_object('total', v_success + v_errors, 'success_count', v_success, 'error_count', v_errors),
    'results', v_results
  );
END;
$$;


ALTER FUNCTION "public"."hera_relationship_upsert_batch_v1"("p_organization_id" "uuid", "p_rows" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_relationship_upsert_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_smart_code" character varying, "p_relationship_direction" "text" DEFAULT 'forward'::"text", "p_relationship_strength" numeric DEFAULT 1.0000, "p_relationship_data" "jsonb" DEFAULT '{}'::"jsonb", "p_smart_code_status" "text" DEFAULT 'DRAFT'::"text", "p_ai_confidence" numeric DEFAULT 0.0000, "p_ai_classification" "text" DEFAULT NULL::"text", "p_ai_insights" "jsonb" DEFAULT '{}'::"jsonb", "p_business_logic" "jsonb" DEFAULT '{}'::"jsonb", "p_validation_rules" "jsonb" DEFAULT '{}'::"jsonb", "p_is_active" boolean DEFAULT true, "p_effective_date" timestamp with time zone DEFAULT "now"(), "p_expiration_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_id uuid;
begin
  -- If a row exists for same org+from+to+type, update; else insert
  select id into v_id
  from public.core_relationships
  where organization_id   = p_organization_id
    and from_entity_id    = p_from_entity_id
    and to_entity_id      = p_to_entity_id
    and relationship_type = p_relationship_type
  limit 1;

  if v_id is null then
    insert into public.core_relationships(
      id, organization_id, from_entity_id, to_entity_id, relationship_type,
      relationship_direction, relationship_strength, relationship_data,
      smart_code, smart_code_status,
      ai_confidence, ai_classification, ai_insights,
      business_logic, validation_rules, is_active,
      effective_date, expiration_date,
      created_at, updated_at, created_by, updated_by, version
    )
    values (
      gen_random_uuid(), p_organization_id, p_from_entity_id, p_to_entity_id, p_relationship_type,
      p_relationship_direction, p_relationship_strength, coalesce(p_relationship_data,'{}'::jsonb),
      p_smart_code, coalesce(p_smart_code_status,'DRAFT'),
      coalesce(p_ai_confidence,0.0000), p_ai_classification, coalesce(p_ai_insights,'{}'::jsonb),
      coalesce(p_business_logic,'{}'::jsonb), coalesce(p_validation_rules,'{}'::jsonb), coalesce(p_is_active,true),
      coalesce(p_effective_date, now()), p_expiration_date,
      now(), now(), p_actor_user_id, p_actor_user_id, 1
    )
    returning id into v_id;
  else
    update public.core_relationships
       set relationship_direction = p_relationship_direction,
           relationship_strength  = p_relationship_strength,
           relationship_data      = coalesce(p_relationship_data,'{}'::jsonb),
           smart_code             = p_smart_code,
           smart_code_status      = coalesce(p_smart_code_status,'DRAFT'),
           ai_confidence          = coalesce(p_ai_confidence,0.0000),
           ai_classification      = p_ai_classification,
           ai_insights            = coalesce(p_ai_insights,'{}'::jsonb),
           business_logic         = coalesce(p_business_logic,'{}'::jsonb),
           validation_rules       = coalesce(p_validation_rules,'{}'::jsonb),
           is_active              = coalesce(p_is_active,true),
           effective_date         = coalesce(p_effective_date, effective_date),
           expiration_date        = p_expiration_date,
           updated_at             = now(),
           updated_by             = p_actor_user_id,
           version                = coalesce(version,1) + 1
     where id = v_id;
  end if;

  return v_id;
end
$$;


ALTER FUNCTION "public"."hera_relationship_upsert_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_smart_code" character varying, "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_relationship_data" "jsonb", "p_smart_code_status" "text", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_require_has_canonical_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE ok boolean;
BEGIN
  IF NEW.entity_type='PERSON' THEN
    SELECT EXISTS (
      SELECT 1 FROM core_relationships
      WHERE organization_id=NEW.organization_id
        AND from_entity_id=NEW.id
        AND relationship_type='HAS_CANONICAL_TYPE'
    ) INTO ok;

    IF NOT ok THEN
      RAISE EXCEPTION 'Entity % missing HAS_CANONICAL_TYPE (review queued or low confidence)', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."hera_require_has_canonical_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_required_ifrs_keys"() RETURNS "text"[]
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT ARRAY[
    'statement',               -- BS / PL / CF
    'section',                 -- e.g., Assets, Liabilities, Equity, Revenue, Expense
    'classification',          -- e.g., Current/Noncurrent, Operating/Financing
    'normal_balance',          -- Debit/Credit
    'report_line_code',        -- canonical report mapping
    'is_contra',               -- boolean
    'cash_flow_section',       -- Operating/Investing/Financing
    'taxonomy_code',           -- IFRS taxonomy tag
    'materiality_threshold',   -- number or enum
    'disclosure_group',        -- grouping key
    'industry_variant'         -- industry lens if applicable
  ];
$$;


ALTER FUNCTION "public"."hera_required_ifrs_keys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_explicit" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_entity_upper text := upper(coalesce(p_entity_type, 'UNKNOWN'));
  v_rel_upper    text := upper(coalesce(p_rel_type,   'UNKNOWN'));
  v_rel_smart    text;
BEGIN
  -- 1) explicit
  IF p_explicit IS NOT NULL AND length(trim(p_explicit)) > 0 THEN
    RETURN p_explicit;
  END IF;

  -- 2) known Salon STAFF mappings (from project presets)
  --    STAFF_HAS_ROLE      → HERA.SALON.STAFF.REL.HAS_ROLE.V1
  --    STAFF_CAN_SERVICE   → HERA.SALON.STAFF.REL.CAN_SERVICE.V1
  --    STAFF_MEMBER_OF     → HERA.SALON.STAFF.REL.MEMBER_OF.V1
  IF v_entity_upper = 'STAFF' THEN
    IF v_rel_upper = 'HAS_ROLE' THEN
      RETURN 'HERA.SALON.STAFF.REL.HAS_ROLE.v1';
    ELSIF v_rel_upper = 'STAFF_CAN_SERVICE' OR v_rel_upper = 'CAN_SERVICE' THEN
      RETURN 'HERA.SALON.STAFF.REL.CAN_SERVICE.v1';
    ELSIF v_rel_upper = 'STAFF_MEMBER_OF' OR v_rel_upper = 'MEMBER_OF' THEN
      RETURN 'HERA.SALON.STAFF.REL.MEMBER_OF.v1';
    END IF;
  END IF;

  -- 3) Generic fallback (always non-null)
  -- sanitize entity/rel to A-Z0-9_
  v_entity_upper := regexp_replace(v_entity_upper, '[^A-Z0-9]+', '_', 'g');
  v_rel_upper    := regexp_replace(v_rel_upper,    '[^A-Z0-9]+', '_', 'g');

  v_rel_smart := format('HERA.GEN.%s.REL.%s.v1', v_entity_upper, v_rel_upper);
  RETURN v_rel_smart;
END;
$$;


ALTER FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_explicit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_map" "jsonb" DEFAULT NULL::"jsonb", "p_explicit" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
  DECLARE
    v_entity_upper text := upper(coalesce(p_entity_type, 'UNKNOWN'));
    v_rel_upper    text := upper(coalesce(p_rel_type,   'UNKNOWN'));
    v_from_map     text;
  BEGIN
    -- 1) explicit override
    IF p_explicit IS NOT NULL AND length(trim(p_explicit)) > 0 THEN
      RETURN p_explicit;
    END IF;

    -- 2) per-type map (case-insensitive key lookup)
    IF p_map IS NOT NULL AND jsonb_typeof(p_map) = 'object' THEN
      v_from_map :=
          coalesce(p_map->>p_rel_type,
                   p_map->>upper(p_rel_type),
                   p_map->>lower(p_rel_type));
      IF v_from_map IS NOT NULL AND length(trim(v_from_map)) > 0 THEN
        RETURN v_from_map;
      END IF;
    END IF;

    -- 3) Generic fallback (always non-null)
    v_entity_upper := regexp_replace(v_entity_upper, '[^A-Z0-9]+', '_', 'g');
    v_rel_upper    := regexp_replace(v_rel_upper,    '[^A-Z0-9]+', '_', 'g');
    RETURN format('HERA.GEN.%s.REL.%s.v1', v_entity_upper, v_rel_upper);
  END;
  $$;


ALTER FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_map" "jsonb", "p_explicit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_runtime_status"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_config jsonb;
BEGIN
  v_config := jsonb_build_object(
    'runtime_version', 'v1',
    'api_version', 'v2',
    'guardrails_mode', current_setting('app.hera_guardrails_mode', true),
    'database_functions', jsonb_build_object(
      'resolve_user_identity_v1', 'available',
      'validate_smart_code', 'available',
      'set_audit_fields', 'available'
    ),
    'constraints', jsonb_build_object(
      'smart_code_validation', 'functions_only',
      'gl_side_checking', 'functions_only'
    ),
    'migration_ready', true,
    'deployment_safe', true,
    'checked_at', NOW()
  );
  
  RETURN v_config;
END;
$$;


ALTER FUNCTION "public"."hera_runtime_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_set_organization_context_v2"("p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_org_access BOOLEAN := false;
BEGIN
    -- Validate user has access to this organization
    SELECT hera_validate_organization_access(p_organization_id) 
    INTO v_user_org_access;
    
    IF NOT v_user_org_access THEN
        RAISE EXCEPTION 'User does not have access to organization: %', p_organization_id;
    END IF;
    
    -- Set organization context for RLS
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    -- Log context switch
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'SECURITY_CONTEXT_SWITCH',
        'HERA.ACCOUNTING.SECURITY.RLS.ENFORCEMENT.v2',
        jsonb_build_object(
            'user_id', current_setting('app.current_user_id', true),
            'context_switch_time', NOW(),
            'session_id', current_setting('app.session_id', true)
        )
    );
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."hera_set_organization_context_v2"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_smart_code_normalizer"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  -- ensure uppercase (good practice with transaction_type too)
  NEW.smart_code := UPPER(NEW.smart_code);

  -- if smart_code has only 2 segments after industry, add .HEADER before version
  IF NEW.smart_code ~ '^(HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){2})\.v[0-9]+$' THEN
    NEW.smart_code := regexp_replace(
      NEW.smart_code,
      '^(HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){2})(\.v[0-9]+)$',
      '\1.HEADER\2'
    );
  END IF;

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."hera_smart_code_normalizer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_smartcode_regex"() RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  SELECT '^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$';
$_$;


ALTER FUNCTION "public"."hera_smartcode_regex"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_transactions_crud_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_action text := upper(p_action);
  v_res    jsonb;
BEGIN
  -- 0) Common gates (org + actor + USER_MEMBER_OF_ORG), idempotency lookup, etc.
  PERFORM public._guard_org_actor_membership(p_organization_id, p_actor_user_id, 'USER_MEMBER_OF_ORG');

  -- 1) Dispatch
  IF v_action = 'CREATE' OR v_action = 'POST' THEN
    -- Use the new consolidated post (your hera_transactions_post_v2)
    v_res := public.hera_transactions_post_v2(
      p_organization_id,
      p_actor_user_id,
      p_header  := COALESCE(p_payload->'header','{}'::jsonb),
      p_lines   := COALESCE(p_payload->'lines','[]'::jsonb),
      p_options := p_options
    );

  ELSIF v_action = 'READ' THEN
    v_res := public.hera_transactions_read_v1(
      p_organization_id,
      p_transaction_id  := (p_payload->>'transaction_id')::uuid,
      p_smart_code      := p_payload->>'smart_code',
      p_status          := p_payload->>'status',
      p_after_id        := (p_payload->>'after_id')::uuid,
      p_limit           := COALESCE((p_options->>'limit')::int,50),
      p_include_lines   := COALESCE((p_options->>'include_lines')::boolean, true)
    );

  ELSIF v_action = 'UPDATE' THEN
    v_res := public.hera_transactions_update_v1(
      p_organization_id,
      p_actor_user_id,
      p_transaction_id := (p_payload->>'transaction_id')::uuid,
      p_patch_header   := COALESCE(p_payload->'header','{}'::jsonb),
      p_patch_lines    := COALESCE(p_payload->'lines','[]'::jsonb),
      p_options        := p_options
    );

  ELSIF v_action = 'APPROVE' THEN
    v_res := public.hera_transactions_approve_v1(
      p_organization_id, p_actor_user_id,
      (p_payload->>'transaction_id')::uuid,
      p_options
    );

  ELSIF v_action = 'VOID' THEN
    v_res := public.hera_transactions_void_v1(
      p_organization_id, p_actor_user_id,
      (p_payload->>'transaction_id')::uuid,
      p_options
    );

  ELSIF v_action = 'REVERSE' THEN
    v_res := public.hera_transactions_reverse_generic_v1(
      p_organization_id, p_actor_user_id,
      (p_payload->>'transaction_id')::uuid,
      p_options
    );

  ELSIF v_action = 'BULK_REVERSE' THEN
    v_res := public.hera_transactions_reverse_generic_bulk_v1(
      p_organization_id, p_actor_user_id,
      ARRAY(SELECT (jsonb_array_elements_text(p_payload->'ids'))::uuid),
      p_options
    );

  ELSIF v_action = 'CLONE' THEN
    v_res := public.hera_transactions_clone_v1(
      p_organization_id, p_actor_user_id,
      (p_payload->>'source_transaction_id')::uuid,
      COALESCE(p_payload->'new_header','{}'::jsonb),
      p_options
    );

  ELSE
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE = format('UNKNOWN_ACTION_%s', p_action);
  END IF;

  RETURN v_res;
END;
$$;


ALTER FUNCTION "public"."hera_transactions_crud_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_payload" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_transactions_post_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_header" "jsonb", "p_lines" "jsonb" DEFAULT '[]'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  -- normalized header fields (cover all documented columns)
  v_txn_id                  uuid;
  v_transaction_type        text    := NULLIF(p_header->>'transaction_type','');
  v_transaction_code        text    := NULLIF(p_header->>'transaction_code','');
  v_transaction_date        timestamptz := COALESCE((p_header->>'transaction_date')::timestamptz, now());

  v_source_entity_id        uuid    := NULLIF(p_header->>'source_entity_id','')::uuid;
  v_target_entity_id        uuid    := NULLIF(p_header->>'target_entity_id','')::uuid;

  v_total_amount            numeric := COALESCE((p_header->>'total_amount')::numeric, 0);
  v_transaction_status      text    := COALESCE(NULLIF(p_header->>'transaction_status',''), 'pending');
  v_reference_number        text    := NULLIF(p_header->>'reference_number','');
  v_external_reference      text    := NULLIF(p_header->>'external_reference','');

  v_smart_code              text    := NULLIF(p_header->>'smart_code','');
  v_smart_code_status       text    := COALESCE(NULLIF(p_header->>'smart_code_status',''), 'DRAFT');

  v_ai_confidence           numeric := COALESCE((p_header->>'ai_confidence')::numeric, 0);
  v_ai_classification       text    := NULLIF(p_header->>'ai_classification','');
  v_ai_insights             jsonb   := COALESCE(p_header->'ai_insights', '{}'::jsonb);

  v_business_context        jsonb   := COALESCE(p_header->'business_context', '{}'::jsonb);
  v_metadata                jsonb   := COALESCE(p_header->'metadata', '{}'::jsonb);

  v_approval_required       boolean := COALESCE((p_header->>'approval_required')::boolean, false);
  v_approved_by             uuid    := NULLIF(p_header->>'approved_by','')::uuid;
  v_approved_at             timestamptz := (p_header->>'approved_at')::timestamptz;

  v_transaction_currency    bpchar  := NULLIF(p_header->>'transaction_currency_code','')::bpchar;
  v_base_currency           bpchar  := NULLIF(p_header->>'base_currency_code','')::bpchar;
  v_exchange_rate           numeric := NULLIF(p_header->>'exchange_rate','')::numeric;
  v_exchange_rate_date      date    := (p_header->>'exchange_rate_date')::date;
  v_exchange_rate_type      text    := NULLIF(p_header->>'exchange_rate_type','');

  v_fiscal_period_entity_id uuid    := NULLIF(p_header->>'fiscal_period_entity_id','')::uuid;
  v_fiscal_year             int     := NULLIF(p_header->>'fiscal_year','')::int;
  v_fiscal_period           int     := NULLIF(p_header->>'fiscal_period','')::int;
  v_posting_period_code     text    := NULLIF(p_header->>'posting_period_code','');

  -- options
  v_idem_key                text    := NULLIF(p_options->>'idem_key','');   -- ✅ idempotency key
  v_auto_post               boolean := COALESCE((p_options->>'auto_post')::boolean, true);

  -- working (lines)
  v_line                    jsonb;
  v_line_number             int;
  v_line_type               text;
  v_description             text;
  v_quantity                numeric;
  v_unit_amount             numeric;
  v_line_amount             numeric;
  v_discount_amount         numeric;
  v_tax_amount              numeric;
  v_line_smart_code         text;
  v_line_smart_status       text;
  v_line_ai_conf            numeric;
  v_line_ai_class           text;
  v_line_ai_ins             jsonb;
  v_line_entity_id          uuid;
  v_line_data               jsonb;

  v_lines_count             int := 0;

  -- GL balance check
  v_gl_ccy                  text;    -- currency used for GL balancing
  v_dr                      numeric;
  v_cr                      numeric;

  -- idempotency
  v_prev_response           jsonb;
  v_final_response          jsonb;
BEGIN
  --------------------------------------------------------------------------
  -- 0) Gates: org + actor + membership
  --------------------------------------------------------------------------
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ORG_REQUIRED';
  END IF;
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ACTOR_REQUIRED';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM core_relationships r
    WHERE r.from_entity_id    = p_actor_user_id
      AND r.to_entity_id      = p_organization_id
      AND r.relationship_type = 'MEMBER_OF'
      AND r.is_active         = true
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ORG_MEMBERSHIP_REQUIRED';
  END IF;

  --------------------------------------------------------------------------
  -- 1) Idempotency: replay if we already have a stored response
  --------------------------------------------------------------------------
  IF v_idem_key IS NOT NULL THEN
    SELECT business_context->'response'
      INTO v_prev_response
    FROM universal_transactions
    WHERE organization_id = p_organization_id
      AND smart_code      = 'HERA.KERNEL.IDEMPOTENCY.TXN.RECORD.v1'
      AND metadata->>'idem_key' = v_idem_key
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prev_response IS NOT NULL THEN
      RETURN v_prev_response; -- ✅ early replay
    END IF;
  END IF;

  --------------------------------------------------------------------------
  -- 2) Header validations
  --------------------------------------------------------------------------
  IF COALESCE(v_transaction_type,'') = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'TXN_TYPE_REQUIRED';
  END IF;
  IF COALESCE(v_smart_code,'') = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'SMART_CODE_REQUIRED';
  END IF;
  IF v_total_amount < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'TOTAL_AMOUNT_INVALID';
  END IF;

  -- derive currency label for GL check (document currency → base → 'UNK')
  v_gl_ccy := COALESCE(NULLIF(v_transaction_currency::text,''), NULLIF(v_base_currency::text,''), 'UNK');

  --------------------------------------------------------------------------
  -- 3) Insert header (pending)
  --------------------------------------------------------------------------
  INSERT INTO universal_transactions (
    id, organization_id,
    transaction_type, transaction_code, transaction_date,
    source_entity_id, target_entity_id,
    total_amount, transaction_status,
    reference_number, external_reference,
    smart_code, smart_code_status,
    ai_confidence, ai_classification, ai_insights,
    business_context, metadata,
    approval_required, approved_by, approved_at,
    created_at, updated_at, created_by, updated_by, version,
    transaction_currency_code, base_currency_code,
    exchange_rate, exchange_rate_date, exchange_rate_type,
    fiscal_period_entity_id, fiscal_year, fiscal_period, posting_period_code
  ) VALUES (
    gen_random_uuid(), p_organization_id,
    v_transaction_type, v_transaction_code, v_transaction_date,
    v_source_entity_id, v_target_entity_id,
    v_total_amount, 'pending',
    v_reference_number, v_external_reference,
    v_smart_code, v_smart_code_status,
    v_ai_confidence, v_ai_classification, v_ai_insights,
    v_business_context, v_metadata,
    v_approval_required, v_approved_by, v_approved_at,
    now(), now(), p_actor_user_id, p_actor_user_id, 1,
    v_transaction_currency, v_base_currency,
    v_exchange_rate, v_exchange_rate_date, v_exchange_rate_type,
    v_fiscal_period_entity_id, v_fiscal_year, v_fiscal_period, v_posting_period_code
  )
  RETURNING id INTO v_txn_id;

  --------------------------------------------------------------------------
  -- 4) Insert lines
  --------------------------------------------------------------------------
  IF jsonb_typeof(p_lines) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'LINES_ARRAY_REQUIRED';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_line_number     := COALESCE((v_line->>'line_number')::int, v_lines_count + 10);
    v_line_type       := NULLIF(v_line->>'line_type','');
    v_description     := NULLIF(v_line->>'description','');
    v_quantity        := COALESCE((v_line->>'quantity')::numeric, 1);
    v_unit_amount     := COALESCE((v_line->>'unit_amount')::numeric, 0);
    v_line_amount     := COALESCE((v_line->>'line_amount')::numeric, 0);
    v_discount_amount := COALESCE((v_line->>'discount_amount')::numeric, 0);
    v_tax_amount      := COALESCE((v_line->>'tax_amount')::numeric, 0);

    v_line_entity_id    := NULLIF(v_line->>'entity_id','')::uuid;
    v_line_smart_code   := NULLIF(v_line->>'smart_code','');
    v_line_smart_status := COALESCE(NULLIF(v_line->>'smart_code_status',''), 'DRAFT');

    v_line_ai_conf     := COALESCE((v_line->>'ai_confidence')::numeric, 0);
    v_line_ai_class    := NULLIF(v_line->>'ai_classification','');
    v_line_ai_ins      := COALESCE(v_line->'ai_insights', '{}'::jsonb);

    v_line_data        := COALESCE(v_line->'line_data', '{}'::jsonb);

    IF COALESCE(v_line_type,'') = '' OR COALESCE(v_line_smart_code,'') = '' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'LINE_REQUIRED_FIELDS_MISSING';
    END IF;

    INSERT INTO universal_transaction_lines (
      id, organization_id, transaction_id, line_number,
      entity_id, line_type, description,
      quantity, unit_amount, line_amount, discount_amount, tax_amount,
      smart_code, smart_code_status,
      ai_confidence, ai_classification, ai_insights,
      line_data,
      created_at, updated_at, created_by, updated_by, version
    ) VALUES (
      gen_random_uuid(), p_organization_id, v_txn_id, v_line_number,
      v_line_entity_id, v_line_type, v_description,
      v_quantity, v_unit_amount, v_line_amount, v_discount_amount, v_tax_amount,
      v_line_smart_code, v_line_smart_status,
      v_line_ai_conf, v_line_ai_class, v_line_ai_ins,
      v_line_data,
      now(), now(), p_actor_user_id, p_actor_user_id, 1
    );

    v_lines_count := v_lines_count + 1;
  END LOOP;

  --------------------------------------------------------------------------
  -- 5) Guardrail: GL per-currency balance (lines with .GL. / .GL.LINE.)
  --------------------------------------------------------------------------
  WITH gl_lines AS (
    SELECT
      l.transaction_id,
      COALESCE(NULLIF(v_transaction_currency::text,''), NULLIF(v_base_currency::text,''), 'UNK') AS ccy,
      (l.line_data->>'side')::text AS side,
      COALESCE(l.line_amount,0) AS amt
    FROM universal_transaction_lines l
    WHERE l.organization_id = p_organization_id
      AND l.transaction_id   = v_txn_id
      AND (l.smart_code ~ '\.GL(\.|$)' OR l.smart_code ~ '\.GL\.LINE\.')
  ),
  totals AS (
    SELECT ccy,
           SUM(CASE WHEN side='DR' THEN amt ELSE 0 END) AS dr_total,
           SUM(CASE WHEN side='CR' THEN amt ELSE 0 END) AS cr_total
    FROM gl_lines
    GROUP BY ccy
  )
  SELECT dr_total, cr_total INTO v_dr, v_cr
  FROM totals
  LIMIT 1;

  IF EXISTS (
    SELECT 1 FROM universal_transaction_lines l
    WHERE l.organization_id = p_organization_id
      AND l.transaction_id   = v_txn_id
      AND (l.smart_code ~ '\.GL(\.|$)' OR l.smart_code ~ '\.GL\.LINE\.')
  ) THEN
    IF v_dr IS NULL OR v_cr IS NULL OR v_dr <> v_cr THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'GL_IMBALANCE',
        DETAIL  = jsonb_build_object(
                    'currency', v_gl_ccy,
                    'debit',    COALESCE(v_dr,0),
                    'credit',   COALESCE(v_cr,0)
                  )::text,
        HINT    = 'Require line_data.side = DR/CR and ensure balanced posting map.';
    END IF;
  END IF;

  --------------------------------------------------------------------------
  -- 6) Advance status (approved/post)
  --------------------------------------------------------------------------
  IF v_approval_required AND v_auto_post = false THEN
    UPDATE universal_transactions
       SET transaction_status = 'approved',
           updated_at = now(),
           updated_by = p_actor_user_id,
           version    = version + 1
     WHERE id = v_txn_id;
    v_transaction_status := 'approved';
  ELSE
    UPDATE universal_transactions
       SET transaction_status = 'posted',
           updated_at = now(),
           updated_by = p_actor_user_id,
           version    = version + 1
     WHERE id = v_txn_id;
    v_transaction_status := 'posted';
  END IF;

  --------------------------------------------------------------------------
  -- 7) Canonical response
  --------------------------------------------------------------------------
  v_final_response := jsonb_build_object(
    'ok', true,
    'transaction_id', v_txn_id,
    'status', v_transaction_status,
    'lines_count', v_lines_count,
    'currency', v_gl_ccy
  );

  --------------------------------------------------------------------------
  -- 8) Idempotency: persist response for replay
  --------------------------------------------------------------------------
  IF v_idem_key IS NOT NULL THEN
    INSERT INTO universal_transactions (
      id, organization_id,
      transaction_type, transaction_status,
      smart_code,
      business_context, metadata,
      created_at, updated_at, created_by, updated_by, version
    ) VALUES (
      gen_random_uuid(), p_organization_id,
      'TX.IDEMPOTENCY.RECORD', 'SUCCESS',
      'HERA.KERNEL.IDEMPOTENCY.TXN.RECORD.v1',
      jsonb_build_object('response', v_final_response),
      jsonb_build_object('idem_key', v_idem_key),
      now(), now(), p_actor_user_id, p_actor_user_id, 1
    );
  END IF;

  RETURN v_final_response;
END;
$_$;


ALTER FUNCTION "public"."hera_transactions_post_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_header" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_transactions_read_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid" DEFAULT NULL::"uuid", "p_smart_code" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 50, "p_include_lines" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  WITH base AS (
    SELECT h.*
    FROM universal_transactions h
    WHERE h.organization_id = p_organization_id
      AND (p_transaction_id IS NULL OR h.id = p_transaction_id)
      AND (p_smart_code   IS NULL OR h.smart_code = p_smart_code)
      AND (p_status       IS NULL OR h.transaction_status = p_status)
      AND (p_after_id     IS NULL OR h.id > p_after_id)
    ORDER BY h.created_at DESC, h.id DESC
    LIMIT GREATEST(1, LEAST(p_limit, 500))
  ),
  lines AS (
    SELECT l.*
    FROM universal_transaction_lines l
    JOIN base b ON b.id = l.transaction_id
    ORDER BY l.transaction_id, l.line_number
  )
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(b) ||
      CASE WHEN p_include_lines
           THEN jsonb_build_object(
                  'lines',
                  COALESCE(
                    (SELECT jsonb_agg(to_jsonb(x) ORDER BY x.line_number)
                     FROM lines x WHERE x.transaction_id = b.id),
                    '[]'::jsonb
                  )
                )
           ELSE jsonb_build_object('lines','[]'::jsonb)
      END
    ),
    '[]'::jsonb
  )
  FROM base b;
$$;


ALTER FUNCTION "public"."hera_transactions_read_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_smart_code" "text", "p_status" "text", "p_after_id" "uuid", "p_limit" integer, "p_include_lines" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_transactions_update_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_transaction_id" "uuid", "p_patch_header" "jsonb" DEFAULT '{}'::"jsonb", "p_patch_lines" "jsonb" DEFAULT '[]'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  -- idempotency (optional)
  v_idem_key            text := NULLIF(p_options->>'idem_key','');

  -- optional audit reason
  v_reason              text := NULLIF(p_options->>'reason','');

  -- current header snapshot
  h                     universal_transactions%ROWTYPE;

  -- patch fields (header)
  v_transaction_code    text;
  v_transaction_date    timestamptz;
  v_source_entity_id    uuid;
  v_target_entity_id    uuid;
  v_total_amount        numeric;
  v_reference_number    text;
  v_external_reference  text;

  v_ai_confidence       numeric;
  v_ai_classification   text;
  v_ai_insights         jsonb;

  v_business_context    jsonb;
  v_metadata            jsonb;

  v_approval_required   boolean;
  v_approved_by         uuid;
  v_approved_at         timestamptz;

  v_transaction_currency bpchar;
  v_base_currency        bpchar;
  v_exchange_rate        numeric;
  v_exchange_rate_date   date;
  v_exchange_rate_type   text;

  v_fiscal_period_entity_id uuid;
  v_fiscal_year         int;
  v_fiscal_period       int;
  v_posting_period_code text;

  -- line patch loop
  jline                 jsonb;
  v_op                  text;
  v_line_number         int;
  v_line_type           text;
  v_description         text;
  v_quantity            numeric;
  v_unit_amount         numeric;
  v_line_amount         numeric;
  v_discount_amount     numeric;
  v_tax_amount          numeric;
  v_line_smart_code     text;
  v_line_smart_status   text;
  v_line_ai_conf        numeric;
  v_line_ai_class       text;
  v_line_ai_ins         jsonb;
  v_line_entity_id      uuid;
  v_line_data           jsonb;

  v_lines_upserted      int := 0;
  v_lines_deleted       int := 0;

  -- temp affected rows
  v_aff                 int := 0;

  -- capture deleted line row
  rec_line              universal_transaction_lines%ROWTYPE;

  -- GL balance check
  v_ccy                 text;
  v_dr                  numeric;
  v_cr                  numeric;

  v_final jsonb;
BEGIN
  ---------------------------------------------------------------------------
  -- 0) BASIC GATES: org + actor + membership + idempotency replay
  ---------------------------------------------------------------------------
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ORG_REQUIRED';
  END IF;
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ACTOR_REQUIRED';
  END IF;

  -- Ensure actor is a member of org via USER_MEMBER_OF_ORG
  IF NOT EXISTS (
    SELECT 1 FROM core_relationships r
    WHERE r.from_entity_id = p_actor_user_id
      AND r.to_entity_id   = p_organization_id
      AND r.relationship_type = 'USER_MEMBER_OF_ORG'
      AND r.is_active = true
  ) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='ORG_MEMBERSHIP_REQUIRED';
  END IF;

  -- Optional idempotency (return prior stored response if exists)
  IF v_idem_key IS NOT NULL THEN
    SELECT business_context->'response'
    INTO v_final
    FROM universal_transactions
    WHERE organization_id = p_organization_id
      AND smart_code      = 'HERA.KERNEL.IDEMPOTENCY.TXN.RECORD.v1'
      AND metadata->>'idem_key' = v_idem_key
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_final IS NOT NULL THEN
      RETURN v_final;
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- 1) LOAD HEADER + STATUS GUARD
  ---------------------------------------------------------------------------
  SELECT * INTO h
  FROM universal_transactions
  WHERE id = p_transaction_id
    AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='NO_DATA_FOUND', MESSAGE='TRANSACTION_NOT_FOUND';
  END IF;

  IF h.transaction_status NOT IN ('pending','approved') THEN
    RAISE EXCEPTION USING ERRCODE='22023',
      MESSAGE = format('UPDATE_NOT_ALLOWED_FOR_STATUS_%s', h.transaction_status);
  END IF;

  ---------------------------------------------------------------------------
  -- 2) APPLY HEADER PATCH (allowed set only)
  ---------------------------------------------------------------------------
  v_transaction_code    := NULLIF(p_patch_header->>'transaction_code','');
  v_transaction_date    := CASE WHEN p_patch_header ? 'transaction_date' THEN (p_patch_header->>'transaction_date')::timestamptz END;
  v_source_entity_id    := NULLIF(p_patch_header->>'source_entity_id','')::uuid;
  v_target_entity_id    := NULLIF(p_patch_header->>'target_entity_id','')::uuid;
  v_total_amount        := CASE WHEN p_patch_header ? 'total_amount' THEN (p_patch_header->>'total_amount')::numeric END;
  v_reference_number    := NULLIF(p_patch_header->>'reference_number','');
  v_external_reference  := NULLIF(p_patch_header->>'external_reference','');

  v_ai_confidence       := CASE WHEN p_patch_header ? 'ai_confidence' THEN (p_patch_header->>'ai_confidence')::numeric END;
  v_ai_classification   := NULLIF(p_patch_header->>'ai_classification','');
  v_ai_insights         := COALESCE(p_patch_header->'ai_insights', NULL);

  v_business_context    := COALESCE(p_patch_header->'business_context', NULL);
  v_metadata            := COALESCE(p_patch_header->'metadata', NULL);

  v_approval_required   := CASE WHEN p_patch_header ? 'approval_required' THEN (p_patch_header->>'approval_required')::boolean END;
  v_approved_by         := NULLIF(p_patch_header->>'approved_by','')::uuid;
  v_approved_at         := CASE WHEN p_patch_header ? 'approved_at' THEN (p_patch_header->>'approved_at')::timestamptz END;

  v_transaction_currency:= NULLIF(p_patch_header->>'transaction_currency_code','')::bpchar;
  v_base_currency       := NULLIF(p_patch_header->>'base_currency_code','')::bpchar;
  v_exchange_rate       := CASE WHEN p_patch_header ? 'exchange_rate' THEN (p_patch_header->>'exchange_rate')::numeric END;
  v_exchange_rate_date  := CASE WHEN p_patch_header ? 'exchange_rate_date' THEN (p_patch_header->>'exchange_rate_date')::date END;
  v_exchange_rate_type  := NULLIF(p_patch_header->>'exchange_rate_type','');

  v_fiscal_period_entity_id := NULLIF(p_patch_header->>'fiscal_period_entity_id','')::uuid;
  v_fiscal_year         := CASE WHEN p_patch_header ? 'fiscal_year' THEN (p_patch_header->>'fiscal_year')::int END;
  v_fiscal_period       := CASE WHEN p_patch_header ? 'fiscal_period' THEN (p_patch_header->>'fiscal_period')::int END;
  v_posting_period_code := NULLIF(p_patch_header->>'posting_period_code','');

  -- Disallow mutating smart_code / transaction_type at update stage
  IF p_patch_header ? 'smart_code' OR p_patch_header ? 'transaction_type' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='SMART_CODE_OR_TYPE_IMMUTABLE_AFTER_CREATE';
  END IF;

  -- Apply header updates (only provided fields)
  UPDATE universal_transactions
     SET transaction_code          = COALESCE(v_transaction_code, transaction_code),
         transaction_date          = COALESCE(v_transaction_date, transaction_date),
         source_entity_id          = COALESCE(v_source_entity_id, source_entity_id),
         target_entity_id          = COALESCE(v_target_entity_id, target_entity_id),
         total_amount              = COALESCE(v_total_amount, total_amount),
         reference_number          = COALESCE(v_reference_number, reference_number),
         external_reference        = COALESCE(v_external_reference, external_reference),
         ai_confidence             = COALESCE(v_ai_confidence, ai_confidence),
         ai_classification         = COALESCE(v_ai_classification, ai_classification),
         ai_insights               = COALESCE(v_ai_insights, ai_insights),
         business_context          = COALESCE(v_business_context, business_context),
         metadata                  = COALESCE(v_metadata, metadata),
         approval_required         = COALESCE(v_approval_required, approval_required),
         approved_by               = COALESCE(v_approved_by, approved_by),
         approved_at               = COALESCE(v_approved_at, approved_at),
         transaction_currency_code = COALESCE(v_transaction_currency, transaction_currency_code),
         base_currency_code        = COALESCE(v_base_currency, base_currency_code),
         exchange_rate             = COALESCE(v_exchange_rate, exchange_rate),
         exchange_rate_date        = COALESCE(v_exchange_rate_date, exchange_rate_date),
         exchange_rate_type        = COALESCE(v_exchange_rate_type, exchange_rate_type),
         fiscal_period_entity_id   = COALESCE(v_fiscal_period_entity_id, fiscal_period_entity_id),
         fiscal_year               = COALESCE(v_fiscal_year, fiscal_year),
         fiscal_period             = COALESCE(v_fiscal_period, fiscal_period),
         posting_period_code       = COALESCE(v_posting_period_code, posting_period_code),
         updated_at                = now(),
         updated_by                = p_actor_user_id,
         version                   = version + 1
   WHERE id = p_transaction_id
     AND organization_id = p_organization_id;

  ---------------------------------------------------------------------------
  -- 3) APPLY LINE PATCHES (UPSERT/DELETE) with audit on DELETE
  ---------------------------------------------------------------------------
  IF jsonb_typeof(p_patch_lines) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='LINES_ARRAY_REQUIRED';
  END IF;

  FOR jline IN SELECT * FROM jsonb_array_elements(p_patch_lines) LOOP
    v_op                := upper(COALESCE(NULLIF(jline->>'op',''),'UPSERT'));
    v_line_number       := (jline->>'line_number')::int;

    IF v_line_number IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='LINE_NUMBER_REQUIRED';
    END IF;

    -- DELETE with audit telemetry
    IF v_op = 'DELETE' THEN
      DELETE FROM universal_transaction_lines
       WHERE organization_id = p_organization_id
         AND transaction_id   = p_transaction_id
         AND line_number      = v_line_number
      RETURNING * INTO rec_line;

      GET DIAGNOSTICS v_aff = ROW_COUNT;
      v_lines_deleted := v_lines_deleted + v_aff;

      IF v_aff > 0 THEN
        INSERT INTO universal_transactions (
          id, organization_id,
          transaction_type, transaction_status,
          smart_code,
          business_context, metadata,
          created_at, updated_at, created_by, updated_by, version
        )
        VALUES (
          gen_random_uuid(), p_organization_id,
          'TX.AUDIT.LINE_DELETE', 'SUCCESS',
          'HERA.KERNEL.AUDIT.TXN.LINE.DELETE.v1',
          jsonb_build_object(
            'transaction_id', rec_line.transaction_id,
            'line_number',    rec_line.line_number,
            'line_snapshot',  to_jsonb(rec_line)
          ),
          jsonb_build_object(
            'actor_user_id',  p_actor_user_id::text,
            'reason',         COALESCE(v_reason,'')
          ),
          now(), now(), p_actor_user_id, p_actor_user_id, 1
        );
      END IF;

    -- UPSERT
    ELSIF v_op = 'UPSERT' THEN
      v_line_type         := NULLIF(jline->>'line_type','');
      v_description       := NULLIF(jline->>'description','');
      v_quantity          := COALESCE((jline->>'quantity')::numeric, NULL);
      v_unit_amount       := COALESCE((jline->>'unit_amount')::numeric, NULL);
      v_line_amount       := COALESCE((jline->>'line_amount')::numeric, NULL);
      v_discount_amount   := COALESCE((jline->>'discount_amount')::numeric, NULL);
      v_tax_amount        := COALESCE((jline->>'tax_amount')::numeric, NULL);
      v_line_entity_id    := NULLIF(jline->>'entity_id','')::uuid;
      v_line_smart_code   := NULLIF(jline->>'smart_code','');
      v_line_smart_status := COALESCE(NULLIF(jline->>'smart_code_status',''), NULL);
      v_line_ai_conf      := COALESCE((jline->>'ai_confidence')::numeric, NULL);
      v_line_ai_class     := NULLIF(jline->>'ai_classification','');
      v_line_ai_ins       := COALESCE(jline->'ai_insights', NULL);
      v_line_data         := COALESCE(jline->'line_data', NULL);

      IF EXISTS (
        SELECT 1 FROM universal_transaction_lines
        WHERE organization_id = p_organization_id
          AND transaction_id   = p_transaction_id
          AND line_number      = v_line_number
      ) THEN
        UPDATE universal_transaction_lines
           SET line_type       = COALESCE(v_line_type, line_type),
               description     = COALESCE(v_description, description),
               quantity        = COALESCE(v_quantity, quantity),
               unit_amount     = COALESCE(v_unit_amount, unit_amount),
               line_amount     = COALESCE(v_line_amount, line_amount),
               discount_amount = COALESCE(v_discount_amount, discount_amount),
               tax_amount      = COALESCE(v_tax_amount, tax_amount),
               entity_id       = COALESCE(v_line_entity_id, entity_id),
               smart_code      = COALESCE(v_line_smart_code, smart_code),
               smart_code_status = COALESCE(v_line_smart_status, smart_code_status),
               ai_confidence   = COALESCE(v_line_ai_conf, ai_confidence),
               ai_classification = COALESCE(v_line_ai_class, ai_classification),
               ai_insights     = COALESCE(v_line_ai_ins, ai_insights),
               line_data       = COALESCE(v_line_data, line_data),
               updated_at      = now(),
               updated_by      = p_actor_user_id,
               version         = version + 1
         WHERE organization_id = p_organization_id
           AND transaction_id   = p_transaction_id
           AND line_number      = v_line_number;

        GET DIAGNOSTICS v_aff = ROW_COUNT;
        IF v_aff > 0 THEN
          v_lines_upserted := v_lines_upserted + v_aff;
        END IF;

      ELSE
        IF COALESCE(v_line_type,'') = '' OR COALESCE(v_line_smart_code,'') = '' THEN
          RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='LINE_REQUIRED_FIELDS_MISSING';
        END IF;

        INSERT INTO universal_transaction_lines (
          id, organization_id, transaction_id, line_number,
          entity_id, line_type, description,
          quantity, unit_amount, line_amount, discount_amount, tax_amount,
          smart_code, smart_code_status,
          ai_confidence, ai_classification, ai_insights,
          line_data,
          created_at, updated_at, created_by, updated_by, version
        ) VALUES (
          gen_random_uuid(), p_organization_id, p_transaction_id, v_line_number,
          v_line_entity_id, v_line_type, v_description,
          COALESCE(v_quantity,1), COALESCE(v_unit_amount,0), COALESCE(v_line_amount,0),
          COALESCE(v_discount_amount,0), COALESCE(v_tax_amount,0),
          v_line_smart_code, COALESCE(v_line_smart_status,'DRAFT'),
          COALESCE(v_line_ai_conf,0), v_line_ai_class, COALESCE(v_line_ai_ins,'{}'::jsonb),
          COALESCE(v_line_data,'{}'::jsonb),
          now(), now(), p_actor_user_id, p_actor_user_id, 1
        );
        v_lines_upserted := v_lines_upserted + 1;
      END IF;
    ELSE
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='UNKNOWN_LINE_OP';
    END IF;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 4) FINAL GL PER-CURRENCY BALANCE CHECK (if GL lines exist)
  ---------------------------------------------------------------------------
  WITH gl_lines AS (
    SELECT
      l.transaction_id,
      COALESCE(h.transaction_currency_code::text, h.base_currency_code::text, 'UNK') AS ccy,
      (l.line_data->>'side')::text AS side,
      COALESCE(l.line_amount,0) AS amt
    FROM universal_transaction_lines l
    JOIN universal_transactions h ON h.id = l.transaction_id
    WHERE l.organization_id = p_organization_id
      AND l.transaction_id   = p_transaction_id
      AND (l.smart_code ~ '\.GL(\.|$)' OR l.smart_code ~ '\.GL\.LINE\.')
  ),
  totals AS (
    SELECT ccy,
           SUM(CASE WHEN side='DR' THEN amt ELSE 0 END) AS dr_total,
           SUM(CASE WHEN side='CR' THEN amt ELSE 0 END) AS cr_total
    FROM gl_lines
    GROUP BY ccy
  )
  SELECT ccy, dr_total, cr_total INTO v_ccy, v_dr, v_cr
  FROM totals
  LIMIT 1;

  IF EXISTS (
    SELECT 1 FROM universal_transaction_lines l
    WHERE l.organization_id = p_organization_id
      AND l.transaction_id   = p_transaction_id
      AND (l.smart_code ~ '\.GL(\.|$)' OR l.smart_code ~ '\.GL\.LINE\.')
  ) THEN
    IF v_dr IS NULL OR v_cr IS NULL OR v_dr <> v_cr THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'GL_IMBALANCE',
        DETAIL  = jsonb_build_object('currency', COALESCE(v_ccy,'UNK'),
                                     'debit', COALESCE(v_dr,0),
                                     'credit', COALESCE(v_cr,0))::text,
        HINT    = 'Ensure GL lines have line_data.side DR/CR and balanced amounts.';
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- 5) RETURN + optional idempotency persist
  ---------------------------------------------------------------------------
  v_final := jsonb_build_object(
    'ok', true,
    'transaction_id', p_transaction_id,
    'header_updated', (p_patch_header <> '{}'::jsonb),
    'lines', jsonb_build_object('upserts', v_lines_upserted, 'deletes', v_lines_deleted)
  );

  IF v_idem_key IS NOT NULL THEN
    INSERT INTO universal_transactions (
      id, organization_id,
      transaction_type, transaction_status,
      smart_code,
      business_context, metadata,
      created_at, updated_at, created_by, updated_by, version
    ) VALUES (
      gen_random_uuid(), p_organization_id,
      'TX.IDEMPOTENCY.RECORD', 'SUCCESS',
      'HERA.KERNEL.IDEMPOTENCY.TXN.RECORD.v1',
      jsonb_build_object('response', v_final),
      jsonb_build_object('idem_key', v_idem_key),
      now(), now(), p_actor_user_id, p_actor_user_id, 1
    );
  END IF;

  RETURN v_final;
END;
$_$;


ALTER FUNCTION "public"."hera_transactions_update_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_transaction_id" "uuid", "p_patch_header" "jsonb", "p_patch_lines" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  -- Header fields
  v_org_id           uuid;
  v_txn_id           uuid;
  v_now              timestamptz := now();

  -- Working
  v_row              jsonb;
  v_line_num         int;
  v_side             text;

  -- Outputs
  v_header_out       jsonb;
  v_lines_out        jsonb := '[]'::jsonb;

  -- Smart code regex (from guardrails)
  v_sc_regex text := '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';

  -- Error diagnostics
  v_err_detail  text;
  v_err_hint    text;
  v_err_context text;
BEGIN
  /* ===========================
     0) Hard guardrails
     =========================== */
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id cannot be null';
  END IF;
  IF p_header IS NULL OR jsonb_typeof(p_header) <> 'object' THEN
    RAISE EXCEPTION 'HEADER_REQUIRED: p_header must be a JSON object';
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN
    RAISE EXCEPTION 'LINES_REQUIRED: p_lines must be a JSON array';
  END IF;

  v_org_id := NULLIF(p_header->>'organization_id','')::uuid;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'ORG_REQUIRED: header.organization_id is required';
  END IF;

  IF (p_header->>'transaction_type') IS NULL THEN
    RAISE EXCEPTION 'TXN_TYPE_REQUIRED: header.transaction_type is required';
  END IF;

  IF (p_header->>'smart_code') IS NULL OR (p_header->>'smart_code') !~ v_sc_regex THEN
    RAISE EXCEPTION 'SMART_CODE_INVALID: header.smart_code must match %', v_sc_regex;
  END IF;

  /* ===========================
     1) Insert Header
     =========================== */
  INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    source_entity_id,
    target_entity_id,
    total_amount,
    transaction_status,
    reference_number,
    external_reference,
    smart_code,
    smart_code_status,
    ai_confidence,
    ai_classification,
    ai_insights,
    business_context,
    metadata,
    approval_required,
    approved_by,
    approved_at,
    transaction_currency_code,
    base_currency_code,
    exchange_rate,
    exchange_rate_date,
    exchange_rate_type,
    fiscal_year,
    fiscal_period,
    fiscal_period_entity_id,
    posting_period_code,
    created_at,
    updated_at,
    created_by,
    updated_by,
    version
  )
  VALUES (
    gen_random_uuid(),
    v_org_id,
    p_header->>'transaction_type',
    p_header->>'transaction_code',
    COALESCE((p_header->>'transaction_date')::timestamptz, v_now),
    NULLIF(p_header->>'source_entity_id','')::uuid,
    NULLIF(p_header->>'target_entity_id','')::uuid,
    COALESCE((p_header->>'total_amount')::numeric, 0),
    COALESCE(p_header->>'transaction_status','pending'),
    p_header->>'reference_number',
    p_header->>'external_reference',
    p_header->>'smart_code',
    COALESCE(p_header->>'smart_code_status','DRAFT'),
    COALESCE((p_header->>'ai_confidence')::numeric, 0),
    p_header->>'ai_classification',
    COALESCE(p_header->'ai_insights','{}'::jsonb),
    COALESCE(p_header->'business_context','{}'::jsonb),
    COALESCE(p_header->'metadata','{}'::jsonb),
    COALESCE((p_header->>'approval_required')::boolean, false),
    NULLIF(p_header->>'approved_by','')::uuid,
    (p_header->>'approved_at')::timestamptz,
    NULLIF(p_header->>'transaction_currency_code','')::char(3),
    NULLIF(p_header->>'base_currency_code','')::char(3),
    (p_header->>'exchange_rate')::numeric,
    (p_header->>'exchange_rate_date')::date,
    p_header->>'exchange_rate_type',
    (p_header->>'fiscal_year')::int,
    (p_header->>'fiscal_period')::int,
    NULLIF(p_header->>'fiscal_period_entity_id','')::uuid,
    p_header->>'posting_period_code',
    v_now,
    v_now,
    p_actor_user_id,
    p_actor_user_id,
    COALESCE((p_header->>'version')::int, 1)
  )
  RETURNING id INTO v_txn_id;

  /* ===========================
     2) Insert Lines (no debit/credit columns)
     =========================== */
  FOR v_row IN
    SELECT elem
    FROM jsonb_array_elements(p_lines) AS t(elem)
  LOOP
    -- source-of-truth ordering
    v_line_num := COALESCE((v_row->>'line_number')::int, 1);

    -- GL lines must carry side in line_data
    IF (v_row->>'smart_code') ~ '\.GL\.' THEN
      v_side := public.hera_line_side(v_row->>'smart_code', COALESCE(v_row->'line_data','{}'::jsonb));
      IF v_side IS NULL THEN
        RAISE EXCEPTION 'GL_LINE_SIDE_REQUIRED: line % needs line_data.side = DR|CR', v_line_num;
      END IF;
    END IF;

    INSERT INTO universal_transaction_lines (
      organization_id,
      transaction_id,
      line_number,
      entity_id,
      line_type,
      description,
      quantity,
      unit_amount,
      line_amount,
      discount_amount,
      tax_amount,
      smart_code,
      smart_code_status,
      ai_confidence,
      ai_classification,
      ai_insights,
      line_data,
      created_at,
      updated_at,
      created_by,
      updated_by,
      version
    )
    VALUES (
      v_org_id,
      v_txn_id,
      v_line_num,
      NULLIF(v_row->>'entity_id','')::uuid,
      v_row->>'line_type',
      v_row->>'description',
      COALESCE((v_row->>'quantity')::numeric, 1),
      COALESCE((v_row->>'unit_amount')::numeric, 0),
      COALESCE((v_row->>'line_amount')::numeric, 0),
      COALESCE((v_row->>'discount_amount')::numeric, 0),
      COALESCE((v_row->>'tax_amount')::numeric, 0),
      v_row->>'smart_code',
      COALESCE(v_row->>'smart_code_status','DRAFT'),
      COALESCE((v_row->>'ai_confidence')::numeric, 0),
      v_row->>'ai_classification',
      COALESCE(v_row->'ai_insights','{}'::jsonb),
      COALESCE(v_row->'line_data','{}'::jsonb),
      v_now,
      v_now,
      p_actor_user_id,
      p_actor_user_id,
      COALESCE((v_row->>'version')::int, 1)
    );
  END LOOP;

  /* ===========================
     3) GL Balance Check
     =========================== */
  PERFORM public.hera_gl_validate_balance(v_org_id, v_txn_id, 0.0001);

  /* ===========================
     4) Build response (header + lines)
     =========================== */
  -- Header JSON
  SELECT jsonb_build_object(
    'id', t.id,
    'organization_id', t.organization_id,
    'transaction_type', t.transaction_type,
    'transaction_code', t.transaction_code,
    'transaction_date', t.transaction_date,
    'source_entity_id', t.source_entity_id,
    'target_entity_id', t.target_entity_id,
    'total_amount', t.total_amount,
    'transaction_status', t.transaction_status,
    'reference_number', t.reference_number,
    'external_reference', t.external_reference,
    'smart_code', t.smart_code,
    'smart_code_status', t.smart_code_status,
    'ai_confidence', t.ai_confidence,
    'ai_classification', t.ai_classification,
    'ai_insights', t.ai_insights,
    'business_context', t.business_context,
    'metadata', t.metadata,
    'approval_required', t.approval_required,
    'approved_by', t.approved_by,
    'approved_at', t.approved_at,
    'transaction_currency_code', t.transaction_currency_code,
    'base_currency_code', t.base_currency_code,
    'exchange_rate', t.exchange_rate,
    'exchange_rate_date', t.exchange_rate_date,
    'exchange_rate_type', t.exchange_rate_type,
    'fiscal_year', t.fiscal_year,
    'fiscal_period', t.fiscal_period,
    'fiscal_period_entity_id', t.fiscal_period_entity_id,
    'posting_period_code', t.posting_period_code,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'created_by', t.created_by,
    'updated_by', t.updated_by,
    'version', t.version
  )
  INTO v_header_out
  FROM universal_transactions t
  WHERE t.id = v_txn_id
    AND t.organization_id = v_org_id
  LIMIT 1;

  -- Lines JSON (ordered)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'line_number', l.line_number,
        'entity_id', l.entity_id,
        'line_type', l.line_type,
        'description', l.description,
        'quantity', l.quantity,
        'unit_amount', l.unit_amount,
        'line_amount', l.line_amount,
        'discount_amount', l.discount_amount,
        'tax_amount', l.tax_amount,
        'smart_code', l.smart_code,
        'smart_code_status', l.smart_code_status,
        'ai_confidence', l.ai_confidence,
        'ai_classification', l.ai_classification,
        'ai_insights', l.ai_insights,
        'line_data', l.line_data,
        'created_at', l.created_at,
        'updated_at', l.updated_at,
        'created_by', l.created_by,
        'updated_by', l.updated_by,
        'version', l.version
      )
      ORDER BY l.line_number, l.id
    ),
    '[]'::jsonb
  )
  INTO v_lines_out
  FROM universal_transaction_lines l
  WHERE l.transaction_id = v_txn_id
    AND l.organization_id = v_org_id;

  RETURN jsonb_build_object(
    'success', true,
    'action',  'CREATE',
    'transaction_id', v_txn_id,
    'data', jsonb_build_object(
      'header', v_header_out,
      'lines',  v_lines_out
    )
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS
    v_err_detail  = PG_EXCEPTION_DETAIL,
    v_err_hint    = PG_EXCEPTION_HINT,
    v_err_context = PG_EXCEPTION_CONTEXT;

  RETURN jsonb_build_object(
    'success', false,
    'action',  'CREATE',
    'error',   SQLSTATE || ': ' || SQLERRM,
    'error_detail', NULLIF(v_err_detail,''),
    'error_hint',   NULLIF(v_err_hint,''),
    'error_context', v_err_context
  );
END;
$_$;


ALTER FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") IS 'Unified transaction writer on Sacred Six. Requires server-resolved p_actor_user_id (USER entity id). Enforces org isolation and guardrails.';



CREATE OR REPLACE FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_action          text := upper(trim(p_action));

  -- read directly from payload (no mutation)
  v_txn_id          uuid := NULLIF(p_payload->>'transaction_id','')::uuid;
  v_filters         jsonb := COALESCE(p_payload->'filters','{}'::jsonb);
  v_patch           jsonb := COALESCE(p_payload->'patch',  '{}'::jsonb);
  v_reason          text  := NULLIF(p_payload->>'reason','');
  v_reversal_date   timestamptz := COALESCE((p_payload->>'reversal_date')::timestamptz, now());
  v_include_deleted boolean := COALESCE((p_payload->>'include_deleted')::boolean, false);
  v_txn_type        text := NULLIF(p_payload->>'transaction_type','');   -- ⬅ NEW: optional type constraint

  v_resp  jsonb := '{}'::jsonb;
  v_full  jsonb := NULL;
  v_tid   uuid  := NULL;

  -- diagnostics
  v_err_detail  text;
  v_err_hint    text;
  v_err_context text;
BEGIN
  /* ===========================
     Global guardrails
     =========================== */
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id cannot be null';
  END IF;
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'ORG_REQUIRED: p_organization_id cannot be null';
  END IF;

  /* ===========================
     Dispatcher
     =========================== */
  CASE v_action

    /* -------- CREATE -------- */
    WHEN 'CREATE' THEN
      IF NOT ( (p_payload->'header') ? 'organization_id' ) THEN
        RAISE EXCEPTION 'ORG_MISSING_ON_HEADER: header.organization_id is required for CREATE';
      END IF;
      IF ((p_payload->'header'->>'organization_id')::uuid) IS DISTINCT FROM p_organization_id THEN
        RAISE EXCEPTION 'ORG_MISMATCH: header.organization_id must equal p_organization_id';
      END IF;

      v_resp := hera_txn_create_v1(
        p_payload->'header',
        p_payload->'lines',
        p_actor_user_id
      );

      v_tid := NULLIF(v_resp->>'transaction_id','')::uuid;
      IF v_tid IS NOT NULL THEN
        v_full := hera_txn_read_v1(p_organization_id, v_tid, true, v_include_deleted);
      ELSE
        v_full := v_resp;
      END IF;

    /* -------- READ -------- */
    WHEN 'READ' THEN
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for READ';
      END IF;

      v_tid  := v_txn_id;
      v_full := hera_txn_read_v1(p_organization_id, v_txn_id, true, v_include_deleted);

      -- ⬅ ENFORCE transaction_type if caller provided it
      IF v_txn_type IS NOT NULL THEN
        -- header is at data.header.transaction_type
        IF COALESCE(v_full#>>'{data,header,transaction_type}','') <> v_txn_type THEN
          RETURN jsonb_build_object(
            'success', false,
            'action',  'READ',
            'transaction_id', v_txn_id,
            'error',   format('Transaction %% does not match type %%', v_txn_id, v_txn_type)
          );
        END IF;
      END IF;

    /* -------- QUERY -------- */
    WHEN 'QUERY' THEN
      -- Inject include_deleted & transaction_type into filters
      v_filters := jsonb_set(v_filters, ARRAY['include_deleted'], to_jsonb(v_include_deleted), true);
      IF v_txn_type IS NOT NULL THEN
        v_filters := jsonb_set(v_filters, ARRAY['transaction_type'], to_jsonb(v_txn_type), true);
      END IF;

      v_full := hera_txn_query_v1(p_organization_id, v_filters);

    /* -------- UPDATE (PATCH) -------- */
    WHEN 'UPDATE' THEN
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for UPDATE';
      END IF;

      v_resp := hera_txn_update_v1(p_organization_id, v_txn_id, v_patch, p_actor_user_id);
      v_tid  := v_txn_id;
      v_full := hera_txn_read_v1(p_organization_id, v_txn_id, true, v_include_deleted);

      -- Optional: if type provided, enforce it matches post-update
      IF v_txn_type IS NOT NULL THEN
        IF COALESCE(v_full#>>'{data,header,transaction_type}','') <> v_txn_type THEN
          RETURN jsonb_build_object(
            'success', false,
            'action',  'UPDATE',
            'transaction_id', v_txn_id,
            'error',   format('Updated transaction %% does not match type %%', v_txn_id, v_txn_type),
            'data',    v_full
          );
        END IF;
      END IF;

    /* -------- DELETE -------- */
    WHEN 'DELETE' THEN
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for DELETE';
      END IF;

      v_tid  := v_txn_id;
      v_full := hera_txn_delete_v1(p_organization_id, v_txn_id);

    /* -------- EMIT -------- */
    WHEN 'EMIT' THEN
      IF NOT ( (p_payload->'header') ? 'organization_id' ) THEN
        RAISE EXCEPTION 'ORG_MISSING_ON_HEADER: header.organization_id is required for EMIT';
      END IF;
      IF ((p_payload->'header'->>'organization_id')::uuid) IS DISTINCT FROM p_organization_id THEN
        RAISE EXCEPTION 'ORG_MISMATCH: header.organization_id must equal p_organization_id';
      END IF;

      v_resp := hera_txn_emit_v1(
        p_organization_id,
        (p_payload->'header'->>'transaction_type'),
        (p_payload->'header'->>'smart_code'),
        (p_payload->'header'->>'transaction_code'),
        COALESCE((p_payload->'header'->>'transaction_date')::timestamptz, now()),
        NULLIF(p_payload->'header'->>'source_entity_id','')::uuid,
        NULLIF(p_payload->'header'->>'target_entity_id','')::uuid,
        COALESCE((p_payload->'header'->>'total_amount')::numeric, 0),
        COALESCE(p_payload->'header'->>'transaction_status','pending'),
        (p_payload->'header'->>'reference_number'),
        (p_payload->'header'->>'external_reference'),
        COALESCE(p_payload->'header'->'business_context','{}'::jsonb),
        COALESCE(p_payload->'header'->'metadata','{}'::jsonb),
        p_actor_user_id
      );
      v_full := v_resp;

    /* -------- REVERSE -------- */
    WHEN 'REVERSE' THEN
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for REVERSE';
      END IF;

      v_resp := hera_txn_reverse_v1(p_organization_id, v_txn_id, v_reversal_date, v_reason, p_actor_user_id);
      v_tid  := v_txn_id;
      v_full := hera_txn_read_v1(p_organization_id, v_txn_id, true, v_include_deleted);

      IF v_txn_type IS NOT NULL THEN
        IF COALESCE(v_full#>>'{data,header,transaction_type}','') <> v_txn_type THEN
          RETURN jsonb_build_object(
            'success', false,
            'action',  'REVERSE',
            'transaction_id', v_txn_id,
            'error',   format('Reversed transaction %% does not match type %%', v_txn_id, v_txn_type),
            'data',    v_full
          );
        END IF;
      END IF;

    /* -------- VOID -------- */
    WHEN 'VOID' THEN
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for VOID';
      END IF;

      v_resp := hera_txn_void_v1(p_organization_id, v_txn_id, v_reason, p_actor_user_id);
      v_tid  := v_txn_id;
      v_full := hera_txn_read_v1(p_organization_id, v_txn_id, true, v_include_deleted);

      IF v_txn_type IS NOT NULL THEN
        IF COALESCE(v_full#>>'{data,header,transaction_type}','') <> v_txn_type THEN
          RETURN jsonb_build_object(
            'success', false,
            'action',  'VOID',
            'transaction_id', v_txn_id,
            'error',   format('Voided transaction %% does not match type %%', v_txn_id, v_txn_type),
            'data',    v_full
          );
        END IF;
      END IF;

    /* -------- VALIDATE -------- */
    WHEN 'VALIDATE' THEN
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for VALIDATE';
      END IF;

      v_tid  := v_txn_id;
      v_full := hera_txn_validate_v1(p_organization_id, v_txn_id);

    ELSE
      RAISE EXCEPTION 'UNKNOWN_ACTION: %', v_action;
  END CASE;

  -- Resolve transaction_id if still null (e.g., QUERY/EMIT)
  IF v_tid IS NULL THEN
    v_tid := NULLIF(v_full->>'transaction_id','')::uuid;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action',  v_action,
    'transaction_id', v_tid,
    'data',    v_full
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS
    v_err_detail  = PG_EXCEPTION_DETAIL,
    v_err_hint    = PG_EXCEPTION_HINT,
    v_err_context = PG_EXCEPTION_CONTEXT;

  RETURN jsonb_build_object(
    'success', false,
    'action',  v_action,
    'transaction_id', COALESCE(v_txn_id, NULL),
    'error',   SQLSTATE || ': ' || SQLERRM,
    'error_detail', NULLIF(v_err_detail,''),
    'error_hint',   NULLIF(v_err_hint,''),
    'error_context', v_err_context
  );
END;
$$;


ALTER FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_transaction" "jsonb" DEFAULT '{}'::"jsonb", "p_lines" "jsonb" DEFAULT '[]'::"jsonb", "p_options" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result jsonb;
  v_transaction_id uuid;
  v_transaction_data jsonb;
  v_runtime_mode text;
  v_line jsonb;
  v_line_id uuid;
BEGIN
  -- Get runtime mode
  v_runtime_mode := current_setting('app.hera_guardrails_mode', true);
  v_runtime_mode := COALESCE(v_runtime_mode, 'warn');

  -- HERA v2.2: Enhanced validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- HERA v2.2: Membership validation (defense-in-depth)
  IF NOT validate_actor_membership(p_actor_user_id, p_organization_id) THEN
    IF v_runtime_mode = 'enforce' THEN
      RAISE EXCEPTION 'Actor % is not a member of organization %', p_actor_user_id, p_organization_id;
    ELSE
      -- v1 WARN mode - log warning but allow
      RAISE NOTICE 'HERA v2.2 WARN: Actor % not validated as member of org % (v1 runtime)', p_actor_user_id, p_organization_id;
    END IF;
  END IF;

  -- Action routing
  CASE p_action
    WHEN 'CREATE' THEN
      -- Create transaction with enhanced validation
      INSERT INTO public.universal_transactions (
        organization_id,
        transaction_type,
        transaction_number,
        smart_code,
        source_entity_id,
        target_entity_id,
        total_amount,
        transaction_status,
        created_by,
        updated_by
      ) VALUES (
        p_organization_id,
        COALESCE(p_transaction->>'transaction_type', 'general'),
        COALESCE(p_transaction->>'transaction_number', 'TXN-' || extract(epoch from now())::bigint),
        p_transaction->>'smart_code',
        (p_transaction->>'source_entity_id')::uuid,
        (p_transaction->>'target_entity_id')::uuid,
        COALESCE((p_transaction->>'total_amount')::decimal, 0),
        COALESCE(p_transaction->>'transaction_status', 'draft'),
        p_actor_user_id,
        p_actor_user_id
      ) RETURNING id INTO v_transaction_id;
      
      -- Create transaction lines if provided
      IF jsonb_array_length(p_lines) > 0 THEN
        FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
        LOOP
          INSERT INTO public.universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            line_type,
            description,
            quantity,
            unit_amount,
            line_amount,
            entity_id,
            smart_code,
            line_data,
            created_by,
            updated_by
          ) VALUES (
            p_organization_id,
            v_transaction_id,
            COALESCE((v_line->>'line_number')::int, 1),
            COALESCE(v_line->>'line_type', 'GENERAL'),
            v_line->>'description',
            COALESCE((v_line->>'quantity')::decimal, 1),
            COALESCE((v_line->>'unit_amount')::decimal, 0),
            COALESCE((v_line->>'line_amount')::decimal, 0),
            (v_line->>'entity_id')::uuid,
            v_line->>'smart_code',
            COALESCE(v_line->'line_data', '{}'::jsonb),
            p_actor_user_id,
            p_actor_user_id
          );
        END LOOP;
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'transaction_id', v_transaction_id,
        'lines_created', jsonb_array_length(p_lines),
        'message', 'Transaction created successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'READ' THEN
      -- Read transactions with organization filtering
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ut.id,
          'transaction_type', ut.transaction_type,
          'transaction_number', ut.transaction_number,
          'smart_code', ut.smart_code,
          'total_amount', ut.total_amount,
          'transaction_status', ut.transaction_status,
          'created_at', ut.created_at,
          'updated_at', ut.updated_at
        )
      ) INTO v_transaction_data
      FROM public.universal_transactions ut
      WHERE ut.organization_id = p_organization_id
        AND (p_transaction->>'transaction_type' IS NULL OR ut.transaction_type = p_transaction->>'transaction_type')
        AND (p_transaction->>'transaction_id' IS NULL OR ut.id = (p_transaction->>'transaction_id')::uuid)
      LIMIT COALESCE((p_options->>'limit')::int, 100);
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'data', COALESCE(v_transaction_data, '[]'::jsonb),
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    ELSE
      RAISE EXCEPTION 'Invalid action: %. Valid actions: CREATE, READ', p_action;
  END CASE;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', p_action,
      'error', SQLERRM,
      'runtime_version', 'v1',
      'membership_validated', false
    );
END;
$$;


ALTER FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_transaction" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_status TEXT;
  v_total  NUMERIC;
  v_lines  INT;
  v_head   INT;
BEGIN
  IF p_organization_id IS NULL OR p_transaction_id IS NULL THEN
    RAISE EXCEPTION 'hera_txn_delete_v1: organization_id and transaction_id are required';
  END IF;

  SELECT transaction_status, total_amount
    INTO v_status, v_total
  FROM universal_transactions
  WHERE id = p_transaction_id AND organization_id = p_organization_id;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  SELECT COUNT(*)::int INTO v_lines
  FROM universal_transaction_lines
  WHERE organization_id = p_organization_id AND transaction_id = p_transaction_id;

  IF v_status <> 'draft' OR COALESCE(v_total,0) <> 0 OR v_lines > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only empty DRAFT transactions can be deleted. Use VOID or REVERSAL.'
    );
  END IF;

  DELETE FROM universal_transactions
  WHERE organization_id = p_organization_id AND id = p_transaction_id;
  GET DIAGNOSTICS v_head = ROW_COUNT;

  RETURN jsonb_build_object('success', (v_head>0), 'header_deleted', v_head);
END;
$$;


ALTER FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text" DEFAULT NULL::"text", "p_transaction_date" timestamp with time zone DEFAULT "now"(), "p_source_entity_id" "uuid" DEFAULT NULL::"uuid", "p_target_entity_id" "uuid" DEFAULT NULL::"uuid", "p_total_amount" numeric DEFAULT 0, "p_transaction_status" "text" DEFAULT 'pending'::"text", "p_reference_number" "text" DEFAULT NULL::"text", "p_external_reference" "text" DEFAULT NULL::"text", "p_business_context" "jsonb" DEFAULT '{}'::"jsonb", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_approval_required" boolean DEFAULT false, "p_approved_by" "uuid" DEFAULT NULL::"uuid", "p_approved_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_transaction_currency_code" character DEFAULT NULL::"bpchar", "p_base_currency_code" character DEFAULT NULL::"bpchar", "p_exchange_rate" numeric DEFAULT NULL::numeric, "p_exchange_rate_date" "date" DEFAULT NULL::"date", "p_exchange_rate_type" "text" DEFAULT NULL::"text", "p_fiscal_period_entity_id" "uuid" DEFAULT NULL::"uuid", "p_fiscal_year" integer DEFAULT NULL::integer, "p_fiscal_period" integer DEFAULT NULL::integer, "p_posting_period_code" "text" DEFAULT NULL::"text", "p_lines" "jsonb" DEFAULT '[]'::"jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_txn_id uuid;
begin
  insert into public.universal_transactions(
    id, organization_id, transaction_type, transaction_code, transaction_date,
    source_entity_id, target_entity_id, total_amount, transaction_status,
    reference_number, external_reference,
    smart_code, smart_code_status,
    ai_confidence, ai_classification, ai_insights,
    business_context, metadata,
    approval_required, approved_by, approved_at,
    transaction_currency_code, base_currency_code,
    exchange_rate, exchange_rate_date, exchange_rate_type,
    fiscal_period_entity_id, fiscal_year, fiscal_period, posting_period_code,
    created_at, updated_at, created_by, updated_by, version
  )
  values (
    gen_random_uuid(), p_organization_id, p_transaction_type, p_transaction_code, coalesce(p_transaction_date, now()),
    p_source_entity_id, p_target_entity_id, coalesce(p_total_amount,0), coalesce(p_transaction_status,'pending'),
    p_reference_number, p_external_reference,
    p_smart_code, 'DRAFT',
    0.0000, null, '{}'::jsonb,
    coalesce(p_business_context,'{}'::jsonb), coalesce(p_metadata,'{}'::jsonb),
    coalesce(p_approval_required,false), p_approved_by, p_approved_at,
    p_transaction_currency_code, p_base_currency_code,
    p_exchange_rate, p_exchange_rate_date, p_exchange_rate_type,
    p_fiscal_period_entity_id, p_fiscal_year, p_fiscal_period, p_posting_period_code,
    now(), now(), p_actor_user_id, p_actor_user_id, 1
  )
  returning id into v_txn_id;

  insert into public.universal_transaction_lines(
    id, organization_id, transaction_id, line_number, entity_id,
    line_type, description,
    quantity, unit_amount, line_amount, discount_amount, tax_amount,
    smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
    line_data, created_at, updated_at, created_by, updated_by, version
  )
  select
    gen_random_uuid(),
    p_organization_id,
    v_txn_id,
    coalesce( (l->>'line_number')::int, row_number() over (order by ord) ),
    (l->>'entity_id')::uuid,
    coalesce(l->>'line_type','generic'),
    l->>'description',
    coalesce((l->>'quantity')::numeric, 1),
    coalesce((l->>'unit_amount')::numeric, 0),
    coalesce((l->>'line_amount')::numeric, 0),
    coalesce((l->>'discount_amount')::numeric, 0),
    coalesce((l->>'tax_amount')::numeric, 0),
    coalesce(l->>'smart_code', p_smart_code || '.LINE'),
    'DRAFT',
    coalesce((l->>'ai_confidence')::numeric, 0.0000),
    l->>'ai_classification',
    coalesce((l->>'ai_insights')::jsonb, '{}'::jsonb),
    coalesce(l, '{}'::jsonb),
    now(), now(), p_actor_user_id, p_actor_user_id, 1
  from jsonb_array_elements(p_lines) with ordinality as t(l, ord);

  return v_txn_id;
end
$$;


ALTER FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  -- flags & filters (existing)
  v_include_deleted boolean := COALESCE((p_filters->>'include_deleted')::boolean, false);
  v_txn_type        text    := NULLIF(p_filters->>'transaction_type','');
  v_status          text    := NULLIF(p_filters->>'transaction_status','');
  v_smart_code      text    := NULLIF(p_filters->>'smart_code','');
  v_date_from       timestamptz := (p_filters->>'date_from')::timestamptz; -- inclusive
  v_date_to         timestamptz := (p_filters->>'date_to')::timestamptz;   -- exclusive

  -- new optional filters
  v_ids_json        jsonb   := p_filters->'ids'; -- array of uuid as text
  v_source_entity   uuid    := NULLIF(p_filters->>'source_entity_id','')::uuid;
  v_target_entity   uuid    := NULLIF(p_filters->>'target_entity_id','')::uuid;
  v_txn_code        text    := NULLIF(p_filters->>'transaction_code','');
  v_ref_number      text    := NULLIF(p_filters->>'reference_number','');
  v_ext_ref         text    := NULLIF(p_filters->>'external_reference','');
  v_search          text    := NULLIF(p_filters->>'search','');
  v_sc_prefix       text    := NULLIF(p_filters->>'smart_code_prefix','');

  -- pagination (with safety cap)
  v_limit_raw  int := COALESCE((p_filters->>'limit')::int, 100);
  v_limit      int := LEAST(GREATEST(v_limit_raw, 1), 500);
  v_offset     int := GREATEST(COALESCE((p_filters->>'offset')::int, 0), 0);

  v_items jsonb := '[]'::jsonb;
  v_total bigint := 0;
  v_next_offset int := NULL;

  -- diagnostics
  v_err_detail  text;
  v_err_hint    text;
  v_err_context text;
BEGIN
  /* COUNT */
  WITH base AS (
    SELECT 1
    FROM universal_transactions t
    WHERE t.organization_id = p_org_id
      AND (v_include_deleted OR t.transaction_status <> 'voided')
      AND (v_txn_type   IS NULL OR t.transaction_type = v_txn_type)
      AND (v_status     IS NULL OR t.transaction_status = v_status)
      AND (v_smart_code IS NULL OR t.smart_code = v_smart_code)
      AND (v_sc_prefix  IS NULL OR t.smart_code LIKE v_sc_prefix || '%')
      AND (v_date_from  IS NULL OR t.transaction_date >= v_date_from)
      AND (v_date_to    IS NULL OR t.transaction_date <  v_date_to)
      AND (v_source_entity IS NULL OR t.source_entity_id = v_source_entity)
      AND (v_target_entity IS NULL OR t.target_entity_id = v_target_entity)
      AND (v_txn_code   IS NULL OR t.transaction_code = v_txn_code)
      AND (v_ref_number IS NULL OR t.reference_number = v_ref_number)
      AND (v_ext_ref    IS NULL OR t.external_reference = v_ext_ref)
      AND (
            v_search IS NULL OR
            t.transaction_code ILIKE '%'||v_search||'%' OR
            t.reference_number ILIKE '%'||v_search||'%' OR
            t.external_reference ILIKE '%'||v_search||'%'
          )
      AND (
            v_ids_json IS NULL
            OR EXISTS (
                 SELECT 1
                 FROM jsonb_array_elements_text(v_ids_json) j
                 WHERE t.id = (j.value)::uuid
               )
          )
  )
  SELECT COUNT(*)::bigint INTO v_total FROM base;

  /* PAGE (full projection) */
  WITH page AS (
    SELECT
      t.id,
      t.organization_id,
      t.transaction_type,
      t.transaction_code,
      t.transaction_date,
      t.source_entity_id,
      t.target_entity_id,
      t.total_amount,
      t.transaction_status,
      t.reference_number,
      t.external_reference,
      t.smart_code,
      t.smart_code_status,
      t.ai_confidence,
      t.ai_classification,
      t.ai_insights,
      t.business_context,
      t.metadata,
      t.approval_required,
      t.approved_by,
      t.approved_at,
      t.transaction_currency_code,
      t.base_currency_code,
      t.exchange_rate,
      t.exchange_rate_date,
      t.exchange_rate_type,
      t.fiscal_year,
      t.fiscal_period,
      t.fiscal_period_entity_id,
      t.posting_period_code,
      t.created_at,
      t.updated_at,
      t.created_by,
      t.updated_by,
      t.version
    FROM universal_transactions t
    WHERE t.organization_id = p_org_id
      AND (v_include_deleted OR t.transaction_status <> 'voided')
      AND (v_txn_type   IS NULL OR t.transaction_type = v_txn_type)
      AND (v_status     IS NULL OR t.transaction_status = v_status)
      AND (v_smart_code IS NULL OR t.smart_code = v_smart_code)
      AND (v_sc_prefix  IS NULL OR t.smart_code LIKE v_sc_prefix || '%')
      AND (v_date_from  IS NULL OR t.transaction_date >= v_date_from)
      AND (v_date_to    IS NULL OR t.transaction_date <  v_date_to)
      AND (v_source_entity IS NULL OR t.source_entity_id = v_source_entity)
      AND (v_target_entity IS NULL OR t.target_entity_id = v_target_entity)
      AND (v_txn_code   IS NULL OR t.transaction_code = v_txn_code)
      AND (v_ref_number IS NULL OR t.reference_number = v_ref_number)
      AND (v_ext_ref    IS NULL OR t.external_reference = v_ext_ref)
      AND (
            v_search IS NULL OR
            t.transaction_code ILIKE '%'||v_search||'%' OR
            t.reference_number ILIKE '%'||v_search||'%' OR
            t.external_reference ILIKE '%'||v_search||'%'
          )
      AND (
            v_ids_json IS NULL
            OR EXISTS (
                 SELECT 1
                 FROM jsonb_array_elements_text(v_ids_json) j
                 WHERE t.id = (j.value)::uuid
               )
          )
    ORDER BY t.transaction_date DESC, t.id DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT COALESCE(
           jsonb_agg(jsonb_build_object(
             'id', p.id,
             'organization_id', p.organization_id,
             'transaction_type', p.transaction_type,
             'transaction_code', p.transaction_code,
             'transaction_date', p.transaction_date,
             'source_entity_id', p.source_entity_id,
             'target_entity_id', p.target_entity_id,
             'total_amount', p.total_amount,
             'transaction_status', p.transaction_status,
             'reference_number', p.reference_number,
             'external_reference', p.external_reference,
             'smart_code', p.smart_code,
             'smart_code_status', p.smart_code_status,
             'ai_confidence', p.ai_confidence,
             'ai_classification', p.ai_classification,
             'ai_insights', p.ai_insights,
             'business_context', p.business_context,
             'metadata', p.metadata,
             'approval_required', p.approval_required,
             'approved_by', p.approved_by,
             'approved_at', p.approved_at,
             'transaction_currency_code', p.transaction_currency_code,
             'base_currency_code', p.base_currency_code,
             'exchange_rate', p.exchange_rate,
             'exchange_rate_date', p.exchange_rate_date,
             'exchange_rate_type', p.exchange_rate_type,
             'fiscal_year', p.fiscal_year,
             'fiscal_period', p.fiscal_period,
             'fiscal_period_entity_id', p.fiscal_period_entity_id,
             'posting_period_code', p.posting_period_code,
             'created_at', p.created_at,
             'updated_at', p.updated_at,
             'created_by', p.created_by,
             'updated_by', p.updated_by,
             'version', p.version
           )),
           '[]'::jsonb
         )
  INTO v_items
  FROM page p;

  -- convenience for pagination UIs
  v_next_offset := CASE WHEN v_offset + v_limit < v_total THEN v_offset + v_limit ELSE NULL END;

  RETURN jsonb_build_object(
    'success', true,
    'action',  'QUERY',
    'data', jsonb_build_object(
      'items',       v_items,
      'limit',       v_limit,
      'offset',      v_offset,
      'next_offset', v_next_offset,
      'total',       v_total
    )
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS
    v_err_detail  = PG_EXCEPTION_DETAIL,
    v_err_hint    = PG_EXCEPTION_HINT,
    v_err_context = PG_EXCEPTION_CONTEXT;

  RETURN jsonb_build_object(
    'success', false,
    'action', 'QUERY',
    'error',  SQLSTATE || ': ' || SQLERRM,
    'error_detail', NULLIF(v_err_detail,''),
    'error_hint',   NULLIF(v_err_hint,''),
    'error_context', v_err_context
  );
END;
$$;


ALTER FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_header JSONB;
    v_lines JSONB;
BEGIN
    -- Read transaction header
    SELECT jsonb_build_object(
        'id', t.id,
        'organization_id', t.organization_id,
        'transaction_type', t.transaction_type,
        'transaction_code', t.transaction_code,
        'transaction_date', t.transaction_date,
        'source_entity_id', t.source_entity_id,
        'target_entity_id', t.target_entity_id,
        'total_amount', t.total_amount,
        'transaction_status', t.transaction_status,
        'reference_number', t.reference_number,
        'external_reference', t.external_reference,
        'smart_code', t.smart_code,
        'smart_code_status', t.smart_code_status,
        'ai_confidence', t.ai_confidence,
        'ai_classification', t.ai_classification,
        'ai_insights', t.ai_insights,
        'business_context', t.business_context,
        'metadata', t.metadata,
        'approval_required', t.approval_required,
        'approved_by', t.approved_by,
        'approved_at', t.approved_at,
        'transaction_currency_code', t.transaction_currency_code,
        'base_currency_code', t.base_currency_code,
        'exchange_rate', t.exchange_rate,
        'fiscal_year', t.fiscal_year,
        'fiscal_period', t.fiscal_period,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'version', t.version
    ) INTO v_header
    FROM universal_transactions t
    WHERE t.id = p_transaction_id
    AND t.organization_id = p_org_id;

    IF v_header IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction not found'
        );
    END IF;

    -- Read transaction lines if requested
    IF p_include_lines THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', l.id,
                'line_number', l.line_number,
                'entity_id', l.entity_id,
                'line_type', l.line_type,
                'description', l.description,
                'quantity', l.quantity,
                'unit_amount', l.unit_amount,
                'line_amount', l.line_amount,
                'discount_amount', l.discount_amount,
                'tax_amount', l.tax_amount,
                'smart_code', l.smart_code,
                'smart_code_status', l.smart_code_status,
                'ai_confidence', l.ai_confidence,
                'ai_classification', l.ai_classification,
                'ai_insights', l.ai_insights,
                'line_data', l.line_data,
                'created_at', l.created_at,
                'updated_at', l.updated_at,
                'version', l.version
            )
        ) INTO v_lines
        FROM universal_transaction_lines l
        WHERE l.transaction_id = p_transaction_id
        AND l.organization_id = p_org_id
        ORDER BY l.line_number;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'header', v_header,
            'lines', COALESCE(v_lines, '[]'::jsonb)
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_TXN_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) IS 'HERA Transaction Read Function v1 - Fixed for actual schema';



CREATE OR REPLACE FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean DEFAULT true, "p_include_deleted" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_header jsonb;
  v_lines  jsonb := '[]'::jsonb;
BEGIN
  -- Header (filter out VOIDED unless explicitly included)
  SELECT jsonb_build_object(
    'id', t.id,
    'organization_id', t.organization_id,
    'transaction_type', t.transaction_type,
    'transaction_code', t.transaction_code,
    'transaction_date', t.transaction_date,
    'source_entity_id', t.source_entity_id,
    'target_entity_id', t.target_entity_id,
    'total_amount', t.total_amount,
    'transaction_status', t.transaction_status,
    'reference_number', t.reference_number,
    'external_reference', t.external_reference,
    'smart_code', t.smart_code,
    'smart_code_status', t.smart_code_status,
    'ai_confidence', t.ai_confidence,
    'ai_classification', t.ai_classification,
    'ai_insights', t.ai_insights,
    'business_context', t.business_context,
    'metadata', t.metadata,
    'approval_required', t.approval_required,
    'approved_by', t.approved_by,
    'approved_at', t.approved_at,
    'transaction_currency_code', t.transaction_currency_code,
    'base_currency_code', t.base_currency_code,
    'exchange_rate', t.exchange_rate,
    'exchange_rate_date', t.exchange_rate_date,
    'exchange_rate_type', t.exchange_rate_type,
    'fiscal_year', t.fiscal_year,
    'fiscal_period', t.fiscal_period,
    'fiscal_period_entity_id', t.fiscal_period_entity_id,
    'posting_period_code', t.posting_period_code,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'created_by', t.created_by,
    'updated_by', t.updated_by,
    'version', t.version
  )
  INTO v_header
  FROM universal_transactions t
  WHERE t.id = p_transaction_id
    AND t.organization_id = p_org_id
    AND (p_include_deleted OR t.transaction_status <> 'voided')
  LIMIT 1;

  IF v_header IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', 'READ',
      'transaction_id', p_transaction_id,
      'error', 'Transaction not found'
    );
  END IF;

  IF p_include_lines THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'line_number', l.line_number,
          'entity_id', l.entity_id,
          'line_type', l.line_type,
          'description', l.description,
          'quantity', l.quantity,
          'unit_amount', l.unit_amount,
          'line_amount', l.line_amount,
          'discount_amount', l.discount_amount,
          'tax_amount', l.tax_amount,
          'smart_code', l.smart_code,
          'smart_code_status', l.smart_code_status,
          'ai_confidence', l.ai_confidence,
          'ai_classification', l.ai_classification,
          'ai_insights', l.ai_insights,
          'line_data', l.line_data,
          'created_at', l.created_at,
          'updated_at', l.updated_at,
          'created_by', l.created_by,
          'updated_by', l.updated_by,
          'version', l.version
        )
        ORDER BY l.line_number, l.id
      ),
      '[]'::jsonb
    )
    INTO v_lines
    FROM universal_transaction_lines l
    WHERE l.transaction_id = p_transaction_id
      AND l.organization_id = p_org_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'READ',
    'transaction_id', p_transaction_id,
    'data', jsonb_build_object(
      'header', v_header,
      'lines', v_lines
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'action', 'READ',
    'transaction_id', p_transaction_id,
    'error', SQLSTATE || ': ' || SQLERRM
  );
END;
$$;


ALTER FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean, "p_include_deleted" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_reverse_v1"("p_org_id" "uuid", "p_original_txn_id" "uuid", "p_reason" "text", "p_reversal_smart_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_hdr           universal_transactions%ROWTYPE;
  v_rev_id        uuid;
  v_now           timestamptz := now();
  v_total_rev     numeric := 0;
  v_ln            universal_transaction_lines%ROWTYPE;
BEGIN
  -- Load original
  SELECT * INTO v_hdr
  FROM universal_transactions
  WHERE organization_id = p_org_id
    AND id = p_original_txn_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Original transaction not found');
  END IF;

  -- Smart code sanity: HERA.X.X.X.X(.X)*.V#
  IF p_reversal_smart_code IS NULL
     OR p_reversal_smart_code !~* '^HERA\.([A-Z0-9]+)(\.[A-Z0-9]+){3,}\.V[0-9]+$'
  THEN
    RAISE EXCEPTION 'INVALID_SMART_CODE: %', p_reversal_smart_code;
  END IF;

  -- Insert reversal header (total=0 for now)
  INSERT INTO universal_transactions(
    organization_id, transaction_type, transaction_code, transaction_date,
    source_entity_id, target_entity_id, total_amount, transaction_status,
    reference_number, external_reference, smart_code, smart_code_status,
    ai_confidence, ai_classification, ai_insights,
    business_context, metadata,
    approval_required, approved_by, approved_at,
    transaction_currency_code, base_currency_code, exchange_rate,
    fiscal_year, fiscal_period,
    created_at, updated_at, created_by, updated_by, version
  ) VALUES (
    v_hdr.organization_id,
    v_hdr.transaction_type,
    COALESCE(v_hdr.transaction_code,'') || '-REV',
    v_now,
    v_hdr.source_entity_id,
    v_hdr.target_entity_id,
    0,
    'posted',
    v_hdr.reference_number,
    v_hdr.external_reference,
    p_reversal_smart_code,
    'DRAFT',
    COALESCE(v_hdr.ai_confidence,0),
    v_hdr.ai_classification,
    COALESCE(v_hdr.ai_insights,'{}'::jsonb),
    COALESCE(v_hdr.business_context,'{}'::jsonb),
    COALESCE(v_hdr.metadata,'{}'::jsonb)
      || jsonb_build_object('reversal_of', v_hdr.id, 'reversal_reason', p_reason, 'reversal_at', v_now),
    COALESCE(v_hdr.approval_required,false),
    v_hdr.approved_by,
    v_hdr.approved_at,
    v_hdr.transaction_currency_code,
    v_hdr.base_currency_code,
    v_hdr.exchange_rate,
    v_hdr.fiscal_year,
    v_hdr.fiscal_period,
    v_now, v_now, NULL, NULL, 1
  )
  RETURNING id INTO v_rev_id;

  -- Insert NEGATING lines
  FOR v_ln IN
    SELECT *
    FROM universal_transaction_lines
    WHERE organization_id = p_org_id
      AND transaction_id  = p_original_txn_id
    ORDER BY line_number
  LOOP
    INSERT INTO universal_transaction_lines(
      organization_id, transaction_id, line_number, entity_id, line_type,
      description, quantity, unit_amount, line_amount, discount_amount, tax_amount,
      smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
      line_data, created_at, updated_at, created_by, updated_by, version
    ) VALUES (
      p_org_id, v_rev_id, v_ln.line_number, v_ln.entity_id, v_ln.line_type,
      'REVERSAL: ' || COALESCE(v_ln.description,''),
      COALESCE(v_ln.quantity,0) * -1,
      v_ln.unit_amount,
      COALESCE(v_ln.line_amount, COALESCE(v_ln.quantity,0)*COALESCE(v_ln.unit_amount,0)) * -1,
      COALESCE(v_ln.discount_amount,0) * -1,
      COALESCE(v_ln.tax_amount,0) * -1,
      CASE
        WHEN v_ln.smart_code ~* '\.V[0-9]+$'
          THEN regexp_replace(v_ln.smart_code, '\.V([0-9]+)$', '.REVERSAL.V\1')
        ELSE v_ln.smart_code || '.REVERSAL.V1'
      END,
      'DRAFT',
      COALESCE(v_ln.ai_confidence,0),
      v_ln.ai_classification,
      COALESCE(v_ln.ai_insights,'{}'::jsonb),
      COALESCE(v_ln.line_data,'{}'::jsonb),
      v_now, v_now, NULL, NULL, 1
    );

    v_total_rev := v_total_rev
      + (COALESCE(v_ln.line_amount, COALESCE(v_ln.quantity,0)*COALESCE(v_ln.unit_amount,0)) * -1)
      - (COALESCE(v_ln.discount_amount,0) * -1)
      + (COALESCE(v_ln.tax_amount,0) * -1);
  END LOOP;

  -- Header total must pass chk_txn_total_sign (non-negative)
  UPDATE universal_transactions
     SET total_amount = GREATEST(ABS(COALESCE(v_total_rev,0)), 0),
         updated_at   = v_now
   WHERE id = v_rev_id;

  -- Mark original as reversed and add linkage in metadata (no core_relationships insert)
  UPDATE universal_transactions
     SET transaction_status = 'reversed',
         metadata = COALESCE(metadata,'{}'::jsonb)
                    || jsonb_build_object('reversed_at', v_now, 'reversal_id', v_rev_id, 'reversal_reason', p_reason),
         updated_at = v_now,
         version = version + 1
   WHERE organization_id = p_org_id
     AND id = p_original_txn_id;

  RETURN jsonb_build_object('success', true, 'reversal_id', v_rev_id, 'original_id', p_original_txn_id);
END;
$_$;


ALTER FUNCTION "public"."hera_txn_reverse_v1"("p_org_id" "uuid", "p_original_txn_id" "uuid", "p_reason" "text", "p_reversal_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_reverse_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reversal_date" timestamp with time zone DEFAULT "now"(), "p_reason" "text" DEFAULT NULL::"text", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_hdr universal_transactions%ROWTYPE;
  v_rev_id uuid;
  v_now timestamptz := COALESCE(p_reversal_date, now());
  v_total_rev numeric := 0;
  v_ln universal_transaction_lines%ROWTYPE;
  v_rev_code text;
BEGIN
  SELECT * INTO v_hdr
  FROM universal_transactions
  WHERE organization_id = p_organization_id
    AND id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Original transaction not found');
  END IF;

  -- Build reversal smart_code from original: replace trailing .V# with .REVERSAL.V#
  v_rev_code :=
    CASE
      WHEN v_hdr.smart_code ~* '\.V[0-9]+$'
        THEN regexp_replace(v_hdr.smart_code, '\.V([0-9]+)$', '.REVERSAL.V\1')
      ELSE v_hdr.smart_code || '.REVERSAL.V1'
    END;

  INSERT INTO universal_transactions(
    organization_id, transaction_type, transaction_code, transaction_date,
    source_entity_id, target_entity_id, total_amount, transaction_status,
    reference_number, external_reference, smart_code, smart_code_status,
    ai_confidence, ai_classification, ai_insights,
    business_context, metadata,
    approval_required, approved_by, approved_at,
    transaction_currency_code, base_currency_code, exchange_rate,
    fiscal_year, fiscal_period,
    created_at, updated_at, created_by, updated_by, version
  ) VALUES (
    v_hdr.organization_id,
    v_hdr.transaction_type,
    COALESCE(v_hdr.transaction_code,'') || '-REV',
    v_now,
    v_hdr.source_entity_id,
    v_hdr.target_entity_id,
    0,
    'posted',
    v_hdr.reference_number,
    v_hdr.external_reference,
    v_rev_code,
    'DRAFT',
    COALESCE(v_hdr.ai_confidence,0),
    v_hdr.ai_classification,
    COALESCE(v_hdr.ai_insights,'{}'::jsonb),
    COALESCE(v_hdr.business_context,'{}'::jsonb),
    COALESCE(v_hdr.metadata,'{}'::jsonb)
      || jsonb_build_object('reversal_of', v_hdr.id, 'reversal_reason', p_reason, 'reversal_at', v_now),
    COALESCE(v_hdr.approval_required,false),
    v_hdr.approved_by,
    v_hdr.approved_at,
    v_hdr.transaction_currency_code,
    v_hdr.base_currency_code,
    v_hdr.exchange_rate,
    v_hdr.fiscal_year,
    v_hdr.fiscal_period,
    v_now, v_now, p_actor_user_id, p_actor_user_id, 1
  )
  RETURNING id INTO v_rev_id;

  FOR v_ln IN
    SELECT *
    FROM universal_transaction_lines
    WHERE organization_id = p_organization_id
      AND transaction_id  = p_transaction_id
    ORDER BY line_number
  LOOP
    INSERT INTO universal_transaction_lines(
      organization_id, transaction_id, line_number, entity_id, line_type,
      description, quantity, unit_amount, line_amount, discount_amount, tax_amount,
      smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
      line_data, created_at, updated_at, created_by, updated_by, version
    ) VALUES (
      p_organization_id, v_rev_id, v_ln.line_number, v_ln.entity_id, v_ln.line_type,
      'REVERSAL: ' || COALESCE(v_ln.description,''),
      COALESCE(v_ln.quantity,0) * -1,
      v_ln.unit_amount,
      COALESCE(v_ln.line_amount, COALESCE(v_ln.quantity,0)*COALESCE(v_ln.unit_amount,0)) * -1,
      COALESCE(v_ln.discount_amount,0) * -1,
      COALESCE(v_ln.tax_amount,0) * -1,
      CASE
        WHEN v_ln.smart_code ~* '\.V[0-9]+$'
          THEN regexp_replace(v_ln.smart_code, '\.V([0-9]+)$', '.REVERSAL.V\1')
        ELSE v_ln.smart_code || '.REVERSAL.V1'
      END,
      'DRAFT',
      COALESCE(v_ln.ai_confidence,0),
      v_ln.ai_classification,
      COALESCE(v_ln.ai_insights,'{}'::jsonb),
      COALESCE(v_ln.line_data,'{}'::jsonb),
      v_now, v_now, p_actor_user_id, p_actor_user_id, 1
    );

    v_total_rev := v_total_rev
      + (COALESCE(v_ln.line_amount, COALESCE(v_ln.quantity,0)*COALESCE(v_ln.unit_amount,0)) * -1)
      - (COALESCE(v_ln.discount_amount,0) * -1)
      + (COALESCE(v_ln.tax_amount,0) * -1);
  END LOOP;

  UPDATE universal_transactions
     SET total_amount = GREATEST(ABS(COALESCE(v_total_rev,0)), 0),
         updated_at   = v_now
   WHERE id = v_rev_id;

  UPDATE universal_transactions
     SET transaction_status = 'reversed',
         metadata = COALESCE(metadata,'{}'::jsonb)
                    || jsonb_build_object('reversed_at', v_now, 'reversal_id', v_rev_id, 'reversal_reason', p_reason),
         updated_at = v_now,
         version = version + 1
   WHERE organization_id = p_organization_id
     AND id = p_transaction_id;

  RETURN jsonb_build_object('success', true, 'reversal_id', v_rev_id, 'original_id', p_transaction_id);
END;
$_$;


ALTER FUNCTION "public"."hera_txn_reverse_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reversal_date" timestamp with time zone, "p_reason" "text", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_update_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_patch" "jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_organization_id IS NULL OR p_transaction_id IS NULL THEN
    RAISE EXCEPTION 'hera_txn_update_v1: organization_id and transaction_id are required';
  END IF;

  UPDATE universal_transactions SET
    transaction_type         = COALESCE(p_patch->>'transaction_type', transaction_type),
    transaction_code         = COALESCE(p_patch->>'transaction_code', transaction_code),
    transaction_date         = COALESCE(NULLIF(p_patch->>'transaction_date','')::timestamptz, transaction_date),
    source_entity_id         = COALESCE(NULLIF(p_patch->>'source_entity_id','')::uuid, source_entity_id),
    target_entity_id         = COALESCE(NULLIF(p_patch->>'target_entity_id','')::uuid, target_entity_id),
    transaction_status       = COALESCE(p_patch->>'transaction_status', transaction_status),
    reference_number         = COALESCE(p_patch->>'reference_number', reference_number),
    external_reference       = COALESCE(p_patch->>'external_reference', external_reference),
    smart_code               = COALESCE(p_patch->>'smart_code', smart_code),
    smart_code_status        = COALESCE(p_patch->>'smart_code_status', smart_code_status),
    ai_confidence            = COALESCE(NULLIF(p_patch->>'ai_confidence','')::numeric, ai_confidence),
    ai_classification        = COALESCE(p_patch->>'ai_classification', ai_classification),
    ai_insights              = COALESCE(p_patch->'ai_insights', ai_insights),
    business_context         = COALESCE(p_patch->'business_context', business_context),
    metadata                 = COALESCE(p_patch->'metadata', metadata),
    approval_required        = COALESCE(NULLIF(p_patch->>'approval_required','')::boolean, approval_required),
    approved_by              = COALESCE(NULLIF(p_patch->>'approved_by','')::uuid, approved_by),
    approved_at              = COALESCE(NULLIF(p_patch->>'approved_at','')::timestamptz, approved_at),
    transaction_currency_code= COALESCE(NULLIF(p_patch->>'transaction_currency_code',''), transaction_currency_code),
    base_currency_code       = COALESCE(NULLIF(p_patch->>'base_currency_code',''), base_currency_code),
    exchange_rate            = COALESCE(NULLIF(p_patch->>'exchange_rate','')::numeric, exchange_rate),
    fiscal_year              = COALESCE(NULLIF(p_patch->>'fiscal_year','')::int, fiscal_year),
    fiscal_period            = COALESCE(NULLIF(p_patch->>'fiscal_period','')::int, fiscal_period),
    updated_at               = now(),
    updated_by               = p_actor_user_id,
    version                  = version + 1
  WHERE id = p_transaction_id
    AND organization_id = p_organization_id
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_id);
END;
$$;


ALTER FUNCTION "public"."hera_txn_update_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_patch" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_validate_v1"("p_org_id" "uuid", "p_transaction_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_hdr RECORD;
  v_line_total NUMERIC := 0;
  v_issues JSONB := '[]'::jsonb;
  v_ok BOOLEAN := TRUE;
  v_tol NUMERIC := 0.01; -- rounding tolerance
  v_is_reversal BOOLEAN := FALSE;
  v_hdr_total NUMERIC := 0;
BEGIN
  -- 1) Header exists
  SELECT *
  INTO v_hdr
  FROM universal_transactions t
  WHERE t.organization_id = p_org_id
    AND t.id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false,
                              'error', 'Transaction not found',
                              'checks', '[]'::jsonb);
  END IF;

  v_is_reversal := (v_hdr.smart_code ~* '\.REVERSAL\.');
  v_hdr_total := COALESCE(v_hdr.total_amount, 0);

  -- 2) Smart code format
  IF (v_hdr.smart_code IS NULL) OR
     (v_hdr.smart_code !~* '^HERA\.([A-Z0-9]+)(\.[A-Z0-9]+){3,}\.V[0-9]+$') THEN
    v_ok := FALSE;
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','smart_code_format','status','fail','detail',coalesce(v_hdr.smart_code,'NULL')
    ));
  ELSE
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','smart_code_format','status','pass'
    ));
  END IF;

  -- 3) Lines present?
  IF (SELECT COUNT(*) FROM universal_transaction_lines l
      WHERE l.organization_id = p_org_id
        AND l.transaction_id = p_transaction_id) = 0 THEN
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','lines_present','status','warn','detail','no lines on transaction'
    ));
  ELSE
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','lines_present','status','pass'
    ));
  END IF;

  -- 4) Recompute total from lines (signed)
  SELECT COALESCE(SUM(
           COALESCE(l.line_amount, COALESCE(l.quantity,0) * COALESCE(l.unit_amount,0))
           - COALESCE(l.discount_amount,0)
           + COALESCE(l.tax_amount,0)
         ),0)
  INTO v_line_total
  FROM universal_transaction_lines l
  WHERE l.organization_id = p_org_id
    AND l.transaction_id  = p_transaction_id;

  -- Comparison rule:
  -- - Normal txns: compare signed totals
  -- - Reversals: compare ABS(header) to ABS(computed) (header kept >= 0 by policy)
  IF v_is_reversal THEN
    IF ABS(ABS(v_hdr_total) - ABS(v_line_total)) > v_tol THEN
      v_ok := FALSE;
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'check','header_total_matches_lines','status','fail',
        'detail', jsonb_build_object(
          'header_total', v_hdr_total,
          'computed_total', v_line_total,
          'mode','ABS_COMPARE_FOR_REVERSAL'
        )
      ));
    ELSE
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'check','header_total_matches_lines','status','pass',
        'detail', jsonb_build_object(
          'header_total', v_hdr_total,
          'computed_total', v_line_total,
          'mode','ABS_COMPARE_FOR_REVERSAL'
        )
      ));
    END IF;
  ELSE
    IF ABS(v_hdr_total - v_line_total) > v_tol THEN
      v_ok := FALSE;
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'check','header_total_matches_lines','status','fail',
        'detail', jsonb_build_object(
          'header_total', v_hdr_total,
          'computed_total', v_line_total,
          'mode','SIGNED_COMPARE'
        )
      ));
    ELSE
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'check','header_total_matches_lines','status','pass',
        'detail', jsonb_build_object(
          'header_total', v_hdr_total,
          'computed_total', v_line_total,
          'mode','SIGNED_COMPARE'
        )
      ));
    END IF;
  END IF;

  -- 5) Currency present when total > 0
  IF v_hdr_total > 0 AND v_hdr.transaction_currency_code IS NULL THEN
    v_ok := FALSE;
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','currency_present','status','fail','detail','transaction_currency_code is NULL with positive total'
    ));
  ELSE
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','currency_present','status','pass'
    ));
  END IF;

  RETURN jsonb_build_object(
    'success', v_ok,
    'checks', v_issues
  );
END;
$_$;


ALTER FUNCTION "public"."hera_txn_validate_v1"("p_org_id" "uuid", "p_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_void_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reason" "text" DEFAULT NULL::"text", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_exists UUID;
  v_status TEXT;
BEGIN
  SELECT id, transaction_status INTO v_exists, v_status
  FROM universal_transactions
  WHERE id = p_transaction_id AND organization_id = p_organization_id;

  IF v_exists IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  -- You may add business rules here (e.g., forbid void if already reversed)
  UPDATE universal_transactions
     SET transaction_status = 'voided',
         metadata = COALESCE(metadata,'{}'::jsonb) ||
                    jsonb_build_object('voided_at', now(), 'void_reason', p_reason, 'voided_by', p_actor_user_id),
         updated_at = now(),
         updated_by = p_actor_user_id,
         version = version + 1
   WHERE id = p_transaction_id AND organization_id = p_organization_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', p_transaction_id, 'status', 'voided');
END;
$$;


ALTER FUNCTION "public"."hera_txn_void_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reason" "text", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_upsert_user_entity_v1"("p_platform_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text" DEFAULT NULL::"text", "p_full_name" "text" DEFAULT NULL::"text", "p_system_actor" "uuid" DEFAULT NULL::"uuid", "p_version" "text" DEFAULT 'v1'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_entity_id uuid;
  v_smart_code text;
  v_entity_name text;
begin
  -- Generate HERA smart code matching existing pattern
  v_smart_code := format('HERA.SALON.ENTITY.USER.ONBOARDED.%s', lower(p_version));
  
  -- Determine entity name priority: full_name > email > supabase_uid
  v_entity_name := coalesce(p_full_name, p_email, p_supabase_uid::text);
  
  -- Find existing entity by supabase UID in metadata
  select id into v_entity_id
  from public.core_entities
  where organization_id = p_platform_org
    and entity_type = 'USER'
    and metadata->>'supabase_user_id' = p_supabase_uid::text
  limit 1;

  if v_entity_id is null then
    -- Create new USER entity
    v_entity_id := gen_random_uuid();
    insert into public.core_entities(
      id, organization_id, entity_type, entity_name, 
      smart_code, smart_code_status,
      metadata, status, created_by, updated_by
    )
    values(
      v_entity_id, p_platform_org, 'USER', v_entity_name,
      v_smart_code, 'DRAFT',
      jsonb_build_object(
        'supabase_user_id', p_supabase_uid::text, 
        'email', p_email, 
        'full_name', p_full_name,
        'onboarded_at', now()
      ),
      'active',
      p_system_actor, p_system_actor
    )
    on conflict (id) do nothing;
  else
    -- Update existing entity with latest info
    update public.core_entities
       set entity_name = v_entity_name,
           metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
             'supabase_user_id', p_supabase_uid::text, 
             'email', p_email, 
             'full_name', p_full_name,
             'last_updated_at', now()
           ),
           updated_by = p_system_actor,
           updated_at = now()
     where id = v_entity_id;
  end if;

  -- Upsert dynamic data fields (email)
  if p_email is not null then
    insert into public.core_dynamic_data(
      id, organization_id, entity_id, field_name, field_type, field_value_text,
      smart_code, smart_code_status, created_by, updated_by
    ) values(
      gen_random_uuid(), p_platform_org, v_entity_id, 'email', 'text', p_email,
      format('HERA.SALON.ENTITY.USER.EMAIL.%s', lower(p_version)), 'DRAFT', 
      p_system_actor, p_system_actor
    ) 
    on conflict (organization_id, entity_id, field_name) do update set
      field_value_text = excluded.field_value_text,
      updated_by = excluded.updated_by,
      updated_at = now();
  end if;

  -- Upsert dynamic data fields (full_name)
  if p_full_name is not null then
    insert into public.core_dynamic_data(
      id, organization_id, entity_id, field_name, field_type, field_value_text,
      smart_code, smart_code_status, created_by, updated_by
    ) values(
      gen_random_uuid(), p_platform_org, v_entity_id, 'full_name', 'text', p_full_name,
      format('HERA.SALON.ENTITY.USER.FULL_NAME.%s', lower(p_version)), 'DRAFT',
      p_system_actor, p_system_actor
    ) 
    on conflict (organization_id, entity_id, field_name) do update set
      field_value_text = excluded.field_value_text,
      updated_by = excluded.updated_by,
      updated_at = now();
  end if;

  return v_entity_id;
end $$;


ALTER FUNCTION "public"."hera_upsert_user_entity_v1"("p_platform_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_system_actor" "uuid", "p_version" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_user_orgs_list_v1"("p_user_id" "uuid") RETURNS SETOF "record"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  -- Columns: id uuid, name text, role text, is_primary boolean, last_accessed timestamptz

  return query

    select gen_random_uuid() as id, 'Demo Org'::text as name, 'admin'::text as role, true as is_primary, now()::timestamptz as last_accessed

    limit 1;

end;

$$;


ALTER FUNCTION "public"."hera_user_orgs_list_v1"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_user_orgs_list_v1"("p_user_id" "uuid") IS 'returns: id uuid, name text, role text, is_primary boolean, last_accessed timestamptz';



CREATE OR REPLACE FUNCTION "public"."hera_user_read_v1"("p_organization_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_name text;
  v_role text;
  v_perms jsonb := '[]'::jsonb;
  v_department text;
  v_status text := 'active';
  v_joined timestamptz;
begin
  select e.entity_name into v_name
  from public.core_entities e
  where e.organization_id = '00000000-0000-0000-0000-000000000000'
    and e.id = p_user_id
    and e.entity_type = 'USER';

  select d.field_value_text into v_role
  from public.core_dynamic_data d
  where d.organization_id = p_organization_id
    and d.entity_id = p_user_id
    and d.field_name = 'role';

  select d.field_value_json into v_perms
  from public.core_dynamic_data d
  where d.organization_id = p_organization_id
    and d.entity_id = p_user_id
    and d.field_name = 'permissions';

  select d.field_value_text into v_department
  from public.core_dynamic_data d
  where d.organization_id = p_organization_id
    and d.entity_id = p_user_id
    and d.field_name = 'department';

  select coalesce((r.metadata->>'joined_at')::timestamptz, r.created_at) into v_joined
  from public.core_relationships r
  where r.organization_id = p_organization_id
    and r.from_entity_id = p_user_id
    and r.to_entity_id = p_organization_id
    and r.relationship_type = 'USER_MEMBER_OF_ORG'
  limit 1;

  return jsonb_build_object(
    'id', p_user_id,
    'name', coalesce(v_name, 'User'),
    'role', coalesce(v_role, 'viewer'),
    'permissions', coalesce(v_perms, '[]'::jsonb),
    'department', v_department,
    'status', v_status,
    'joined_at', v_joined
  );
end;
$$;


ALTER FUNCTION "public"."hera_user_read_v1"("p_organization_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_user_remove_from_org_v1"("p_organization_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.core_relationships r
     set is_active = false,
         metadata = coalesce(r.metadata,'{}'::jsonb) || jsonb_build_object('removed_at', now())
   where r.organization_id = p_organization_id
     and r.from_entity_id = p_user_id
     and r.to_entity_id = p_organization_id
     and r.relationship_type = 'USER_MEMBER_OF_ORG';

  insert into public.core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_at, updated_at)
  values (p_organization_id, p_user_id, 'status', 'text', 'inactive', 'HERA.USER.STATUS.v1', now(), now())
  on conflict (organization_id, entity_id, field_name)
  do update set field_type='text', field_value_text='inactive', field_value_json=null, smart_code='HERA.USER.STATUS.v1', updated_at=now();

  return jsonb_build_object('ok', true, 'removed_user_id', p_user_id);
end;
$$;


ALTER FUNCTION "public"."hera_user_remove_from_org_v1"("p_organization_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_user_switch_org_v1"("p_user_id" "uuid", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

begin

  return jsonb_build_object('ok', true, 'organization_id', p_organization_id);

end;

$$;


ALTER FUNCTION "public"."hera_user_switch_org_v1"("p_user_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_user_update_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_role" "text", "p_permissions" "jsonb", "p_department" "text", "p_reports_to" "text", "p_status" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_role is not null then
    insert into public.core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_at, updated_at)
    values (p_organization_id, p_user_id, 'role', 'text', p_role, 'HERA.RBAC.USER.ROLE.v1', now(), now())
    on conflict (organization_id, entity_id, field_name)
    do update set field_type='text', field_value_text=excluded.field_value_text, field_value_json=null, smart_code='HERA.RBAC.USER.ROLE.v1', updated_at=now();
  end if;

  if p_permissions is not null then
    insert into public.core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_json, smart_code, created_at, updated_at)
    values (p_organization_id, p_user_id, 'permissions', 'json', p_permissions, 'HERA.RBAC.USER.PERMISSIONS.v1', now(), now())
    on conflict (organization_id, entity_id, field_name)
    do update set field_type='json', field_value_text=null, field_value_json=excluded.field_value_json, smart_code='HERA.RBAC.USER.PERMISSIONS.v1', updated_at=now();
  end if;

  if p_department is not null then
    insert into public.core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_at, updated_at)
    values (p_organization_id, p_user_id, 'department', 'text', p_department, 'HERA.USER.DEPARTMENT.v1', now(), now())
    on conflict (organization_id, entity_id, field_name)
    do update set field_type='text', field_value_text=excluded.field_value_text, field_value_json=null, smart_code='HERA.USER.DEPARTMENT.v1', updated_at=now();
  end if;

  if p_status is not null then
    insert into public.core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_at, updated_at)
    values (p_organization_id, p_user_id, 'status', 'text', p_status, 'HERA.USER.STATUS.v1', now(), now())
    on conflict (organization_id, entity_id, field_name)
    do update set field_type='text', field_value_text=excluded.field_value_text, field_value_json=null, smart_code='HERA.USER.STATUS.v1', updated_at=now();
  end if;

  -- (Optional) reports_to could be modeled as a REPORTS_TO relationship later
  return jsonb_build_object('ok', true, 'user_id', p_user_id);
end;
$$;


ALTER FUNCTION "public"."hera_user_update_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_role" "text", "p_permissions" "jsonb", "p_department" "text", "p_reports_to" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_users_list_v1"("p_organization_id" "uuid", "p_limit" integer DEFAULT 25, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "name" "text", "role" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with zero as (select '00000000-0000-0000-0000-000000000000'::uuid as z)
  select
    r.from_entity_id as id,
    coalesce(e.entity_name,'User') as name,
    coalesce(dr.field_value_text,'viewer') as role
  from public.core_relationships r
  left join zero z on true
  left join public.core_entities e
         on e.id = r.from_entity_id
        and e.organization_id = z.z
        and e.entity_type = 'USER'
  left join public.core_dynamic_data dr
         on dr.organization_id = r.organization_id
        and dr.entity_id = r.from_entity_id
        and dr.field_name = 'role'
  where r.organization_id = p_organization_id
    and r.relationship_type = 'USER_MEMBER_OF_ORG'
    and coalesce(r.is_active,true) = true
  order by r.created_at desc nulls last, r.from_entity_id
  limit p_limit offset p_offset
$$;


ALTER FUNCTION "public"."hera_users_list_v1"("p_organization_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_users_list_v1"("p_organization_id" "uuid", "p_limit" integer, "p_offset" integer) IS 'returns: id uuid, name text, role text';



CREATE OR REPLACE FUNCTION "public"."hera_validate_coa"("p_org" "uuid") RETURNS TABLE("severity" "text", "issue_code" "text", "entity_id" "uuid", "entity_code" "text", "msg" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  req_keys text[];
  re_sc text;
BEGIN
  SELECT hera_required_ifrs_keys() INTO req_keys;
  SELECT hera_smartcode_regex()     INTO re_sc;

  -- 1) smart_code presence + regex
  RETURN QUERY
  SELECT 'error', 'SMARTCODE-PRESENT', a.id, a.entity_code,
         'Missing or invalid smart_code on account'
  FROM v_hera_accounts a
  WHERE a.organization_id = p_org
    AND (a.smart_code IS NULL OR a.smart_code !~ re_sc);

  -- 2) ledger semantics present (GL/STAT) via smart_code or business_rules.ledger_type
  RETURN QUERY
  SELECT 'error', 'ACCOUNT-LEDGER-SEMANTICS', a.id, a.entity_code,
         'Account missing ledger semantics (smart_code lacks .ACCOUNT. or ledger_type not set to GL/STAT)'
  FROM v_hera_accounts a
  WHERE a.organization_id = p_org
    AND NOT (
      a.smart_code ~ '\\.ACCOUNT\\.'
      OR (a.business_rules ? 'ledger_type'
          AND (a.business_rules->>'ledger_type') IN ('GL','STAT'))
    );

  -- 3) account code uniqueness per org
  RETURN QUERY
  WITH d AS (
    SELECT entity_code, COUNT(*) c
    FROM v_hera_accounts
    WHERE organization_id = p_org
    GROUP BY entity_code
    HAVING COUNT(*) > 1
  )
  SELECT 'error','ACCOUNT-CODE-UNIQUE', a.id, a.entity_code,
         'Duplicate account code within organization'
  FROM v_hera_accounts a
  JOIN d ON d.entity_code = a.entity_code
  WHERE a.organization_id = p_org;

  -- 4) hierarchy cycles
  RETURN QUERY
  SELECT 'error','ACCOUNT-HIERARCHY-CYCLE', a.id, a.entity_code,
         'Cycle detected in account hierarchy'
  FROM v_hera_accounts a
  JOIN v_hera_account_cycles cyc
    ON cyc.offending_id = a.id
   AND cyc.organization_id = a.organization_id
  WHERE a.organization_id = p_org;

  -- 5) leaf-only posting rules
  -- business_rules.allow_posting must be false for non-leaves; leaves may be true.
  RETURN QUERY
  SELECT 'error','ACCOUNT-HIERARCHY-NONLEAF-POSTABLE', a.id, a.entity_code,
         'Non-leaf account marked allow_posting=true'
  FROM v_hera_accounts a
  JOIN v_hera_account_children ch
    ON ch.parent_id = a.id
   AND ch.organization_id = a.organization_id
  WHERE a.organization_id = p_org
    AND ch.child_count > 0
    AND COALESCE( (a.business_rules->>'allow_posting')::boolean, false ) = true;

  -- if parent is NULL (a top header), allow_posting must be false
  RETURN QUERY
  SELECT 'error','ACCOUNT-HIERARCHY-ROOT-POSTABLE', a.id, a.entity_code,
         'Root account (no parent) cannot be postable'
  FROM v_hera_accounts a
  WHERE a.organization_id = p_org
    AND a.parent_entity_id IS NULL
    AND COALESCE( (a.business_rules->>'allow_posting')::boolean, false ) = true;

  -- 6) IFRS required metadata (either in business_rules.ifrs.* OR core_dynamic_data fields)
  RETURN QUERY
  WITH dd AS (
    SELECT entity_id, field_name
    FROM core_dynamic_data
    WHERE organization_id = p_org
  ),
  missing AS (
    SELECT
      a.id AS entity_id,
      a.entity_code,
      k AS missing_key
    FROM v_hera_accounts a,
         unnest(req_keys) k
    WHERE a.organization_id = p_org
      AND NOT (
        (a.business_rules ? 'ifrs' AND (a.business_rules->'ifrs') ? k)
        OR EXISTS (
          SELECT 1 FROM dd WHERE dd.entity_id = a.id AND dd.field_name = k
        )
      )
  )
  SELECT 'error','IFRS-MISSING-KEY', m.entity_id,
         (SELECT entity_code FROM v_hera_accounts z WHERE z.id = m.entity_id),
         'Missing IFRS key: ' || m.missing_key
  FROM missing m;

END;
$$;


ALTER FUNCTION "public"."hera_validate_coa"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_validate_coa_smartcode_all"("p_org" "uuid") RETURNS TABLE("severity" "text", "source" "text", "ref_id" "uuid", "code" "text", "details" "text")
    LANGUAGE "sql"
    AS $$
SELECT severity, 'COA'::text AS source, entity_id AS ref_id, issue_code AS code, msg AS details
FROM hera_validate_coa(p_org)
UNION ALL
SELECT severity, 'JOURNAL', transaction_id, issue_code, msg
FROM hera_validate_journals(p_org)
UNION ALL
SELECT severity, table_name, NULL::uuid, issue_code || ':' || smart_code, msg || ' (count='||count||')'
FROM hera_validate_smartcodes(p_org);
$$;


ALTER FUNCTION "public"."hera_validate_coa_smartcode_all"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_validate_journals"("p_org" "uuid") RETURNS TABLE("severity" "text", "issue_code" "text", "transaction_id" "uuid", "msg" "text")
    LANGUAGE "sql"
    AS $$
WITH hdr AS (
  SELECT id, organization_id, transaction_currency_code, base_currency_code,
         exchange_rate, exchange_rate_date
  FROM universal_transactions
  WHERE organization_id = p_org
),
ln AS (
  SELECT l.transaction_id,
         l.organization_id,
         COALESCE( (l.line_data->>'currency_code')::text, h.transaction_currency_code ) AS line_currency,
         l.line_amount,
         l.smart_code
  FROM universal_transaction_lines l
  JOIN hdr h ON h.id = l.transaction_id AND h.organization_id = l.organization_id
  WHERE l.organization_id = p_org
)
SELECT
  'error'::text AS severity,
  'GL-BALANCED'::text AS issue_code,
  t.transaction_id,
  'GL lines not balanced (sum(line_amount) != 0 for txn '||t.transaction_id||')' AS msg
FROM (
  SELECT transaction_id
  FROM ln
  WHERE smart_code ~ '\\.GL\\.'
  GROUP BY transaction_id
  HAVING ABS(SUM(line_amount)) > 0.0000001
) t

UNION ALL

SELECT
  'error',
  'CURRENCY-CONSISTENCY',
  h.id,
  'Transaction has different transaction vs base currency but missing exchange_rate/date'
FROM hdr h
WHERE h.transaction_currency_code IS NOT NULL
  AND h.base_currency_code IS NOT NULL
  AND h.transaction_currency_code <> h.base_currency_code
  AND (h.exchange_rate IS NULL OR h.exchange_rate_date IS NULL)
$$;


ALTER FUNCTION "public"."hera_validate_journals"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_validate_organization_access"("p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_org_id UUID;
BEGIN
    -- Get user's organization from JWT/session
    BEGIN
        SELECT organization_id INTO v_user_org_id
        FROM hera_resolve_user_identity_v1()
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- If no user identity resolution function, allow for system operations
        RETURN true;
    END;
    
    -- Prevent cross-organization access
    IF v_user_org_id IS NOT NULL AND v_user_org_id != p_organization_id THEN
        RAISE EXCEPTION 'Cross-organization access denied: % -> %', 
            v_user_org_id, p_organization_id;
    END IF;
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."hera_validate_organization_access"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
  SELECT
    -- normalize: uppercase everything, then force .Vn → .vN
    regexp_replace(upper($1), '\.V([0-9]+)$', '.v\1')
    ~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';
$_$;


ALTER FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") RETURNS TABLE("severity" "text", "issue_code" "text", "table_name" "text", "smart_code" "text", "count" integer, "msg" "text")
    LANGUAGE "sql"
    AS $$
WITH sc AS (
  SELECT 'core_entities'::text AS table_name, smart_code, organization_id FROM core_entities
  UNION ALL SELECT 'core_dynamic_data', smart_code, organization_id FROM core_dynamic_data
  UNION ALL SELECT 'core_relationships', smart_code, organization_id FROM core_relationships
  UNION ALL SELECT 'universal_transactions', smart_code, organization_id FROM universal_transactions
  UNION ALL SELECT 'universal_transaction_lines', smart_code, organization_id FROM universal_transaction_lines
)
SELECT
  'error'::text AS severity,
  'SMARTCODE-DUPLICATE'::text AS issue_code,
  table_name,
  smart_code,
  COUNT(*) AS count,
  'Duplicate smart_code within table/org' AS msg
FROM sc
WHERE organization_id = p_org
  AND smart_code IS NOT NULL
GROUP BY table_name, smart_code, organization_id
HAVING COUNT(*) > 1;
$$;


ALTER FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_roles"() RETURNS "text"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    array(select upper(value::text) 
          from jsonb_array_elements_text(coalesce(auth.jwt()->'roles','[]'::jsonb)) t(value)),
    '{}'
  )::text[];
$$;


ALTER FUNCTION "public"."jwt_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_transaction_id UUID;
  v_context_entity_id UUID;
BEGIN
  -- Create or get context entity
  INSERT INTO core_entities (
    organization_id, entity_type, entity_name, smart_code, 
    metadata, created_by
  ) VALUES (
    p_organization_id, 'vibe_context', 
    'Context Session: ' || p_session_token,
    'HERA.VIBE.CONTEXT.SESSION.PRESERVATION.v1',
    jsonb_build_object('session_token', p_session_token, 'preservation_time', NOW()),
    p_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_context_entity_id;
  
  -- Get existing context entity if insert was skipped
  IF v_context_entity_id IS NULL THEN
    SELECT id INTO v_context_entity_id FROM core_entities 
    WHERE organization_id = p_organization_id 
    AND entity_type = 'vibe_context' 
    AND metadata->>'session_token' = p_session_token;
  END IF;
  
  -- Create context preservation transaction
  INSERT INTO universal_transactions (
    organization_id, transaction_type, transaction_number,
    source_entity_id, smart_code, status, business_context, created_by
  ) VALUES (
    p_organization_id, 'vibe_context_preservation',
    'VIBE-CTX-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    v_context_entity_id, 'HERA.VIBE.TRANSACTION.CONTEXT.PRESERVATION.v1',
    'completed', p_context_data, p_user_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Store context data in dynamic data
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_json, 
    smart_code, created_by
  ) VALUES (
    p_organization_id, v_context_entity_id, 'session_context', 'json', p_context_data,
    'HERA.VIBE.DATA.CONTEXT.SESSION.v1', p_user_id
  ) ON CONFLICT (entity_id, field_name) DO UPDATE SET
    field_value_json = p_context_data,
    updated_at = NOW();
    
  RETURN v_transaction_id;
END;
$$;


ALTER FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_existing_user"("user_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_record RECORD;
    result BOOLEAN := FALSE;
BEGIN
    -- Find the user
    SELECT * INTO user_record
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
        -- Manually call the trigger function
        PERFORM handle_new_user() FROM auth.users WHERE id = user_record.id;
        result := TRUE;
    END IF;
    
    RETURN result;
END $$;


ALTER FUNCTION "public"."process_existing_user"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_user_identity_v1"("p_auth_uid" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("user_entity_id" "uuid", "email" "text", "memberships" "jsonb", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE 
  v_auth_uid uuid;
  v_user_entity_id uuid;
BEGIN
  -- Use provided UUID or fallback to auth.uid()
  v_auth_uid := COALESCE(p_auth_uid, auth.uid());
  
  IF v_auth_uid IS NULL THEN 
    RAISE EXCEPTION 'No authenticated user provided';
  END IF;

  -- Find USER entity by provider_uid in metadata
  SELECT ce.id INTO v_user_entity_id 
  FROM public.core_entities ce
  WHERE ce.entity_type = 'USER' 
    AND ce.metadata->>'provider_uid' = v_auth_uid::text 
    AND ce.status = 'active' 
  LIMIT 1;

  IF v_user_entity_id IS NULL THEN 
    RAISE EXCEPTION 'No USER entity found for auth.uid %', v_auth_uid;
  END IF;

  -- Return user identity with memberships
  RETURN QUERY
  SELECT 
    v_user_entity_id,
    au.email,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'organization_id', cr.target_entity_id,
          'organization_name', co.entity_name,
          'role', cr.relationship_data->>'role',
          'is_active', cr.is_active,
          'joined_at', cr.effective_date,
          'membership_type', cr.relationship_type
        ) ORDER BY cr.created_at DESC
      ) FILTER (WHERE cr.id IS NOT NULL), 
      '[]'::jsonb
    ) as memberships,
    jsonb_build_object(
      'user_entity_id', v_user_entity_id,
      'auth_uid', v_auth_uid,
      'resolved_at', NOW(),
      'function_version', 'v1',
      'cache_key', 'actor:' || left(v_auth_uid::text, 8)
    ) as metadata
  FROM auth.users au
  LEFT JOIN public.core_relationships cr ON (
    cr.source_entity_id = v_user_entity_id 
    AND cr.relationship_type = 'MEMBER_OF'
    AND cr.is_active = true
    AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  )
  LEFT JOIN public.core_entities co ON (
    co.id = cr.target_entity_id 
    AND co.entity_type = 'ORGANIZATION' 
    AND co.status = 'active'
  )
  WHERE au.id = v_auth_uid
  GROUP BY au.email;
  
END;
$$;


ALTER FUNCTION "public"."resolve_user_identity_v1"("p_auth_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_context_data JSONB;
BEGIN
  -- Restore context data from the universal tables
  SELECT dd.field_value_json INTO v_context_data
  FROM core_entities e
  JOIN core_dynamic_data dd ON e.id = dd.entity_id
  WHERE e.organization_id = p_organization_id
  AND e.entity_type = 'vibe_context'
  AND e.metadata->>'session_token' = p_session_token
  AND dd.field_name = 'session_context'
  ORDER BY dd.updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_context_data, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text" DEFAULT NULL::"text", "p_smart_code" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("entity_id" "uuid", "is_new" boolean, "matched_by" "text", "confidence_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_normalized_name text;
    v_existing_id uuid;
    v_new_id uuid;
    v_matched_by text;
    v_confidence numeric;
    v_entity_code text;
    v_smart_code text;
BEGIN
    -- Validate inputs
    IF p_org_id IS NULL OR p_entity_type IS NULL OR p_entity_name IS NULL THEN
        RAISE EXCEPTION 'org_id, entity_type, and entity_name are required';
    END IF;
    
    -- Normalize the entity name
    v_normalized_name := hera_normalize_text(p_entity_name);
    
    -- Generate entity_code if not provided
    v_entity_code := COALESCE(
        p_entity_code, 
        UPPER(p_entity_type) || '-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')
    );
    
    -- Generate smart_code if not provided
    -- For now, return error if no smart code provided since it's required
    IF p_smart_code IS NULL THEN
        RAISE EXCEPTION 'smart_code is required. Use format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}';
    END IF;
    v_smart_code := p_smart_code;
    
    -- Try exact match on entity_code first (highest confidence)
    IF p_entity_code IS NOT NULL THEN
        SELECT e.id INTO v_existing_id
        FROM core_entities e
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND e.entity_code = p_entity_code
          AND COALESCE(e.status, 'active') != 'deleted'
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'entity_code';
            v_confidence := 1.0;
        END IF;
    END IF;
    
    -- Try normalized name match
    IF v_existing_id IS NULL THEN
        SELECT e.id INTO v_existing_id
        FROM core_entities e
        JOIN core_dynamic_data dd ON e.id = dd.entity_id
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND COALESCE(e.status, 'active') != 'deleted'
          AND dd.field_name = 'normalized_name'
          AND dd.field_value_text = v_normalized_name
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'normalized_name';
            v_confidence := 0.95;
        END IF;
    END IF;
    
    -- Try fuzzy match as last resort
    IF v_existing_id IS NULL THEN
        SELECT e.id, similarity(e.entity_name, p_entity_name) INTO v_existing_id, v_confidence
        FROM core_entities e
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND COALESCE(e.status, 'active') != 'deleted'
          AND similarity(e.entity_name, p_entity_name) > 0.85
        ORDER BY similarity(e.entity_name, p_entity_name) DESC
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'fuzzy_match';
        END IF;
    END IF;
    
    -- If no match found, create new entity
    IF v_existing_id IS NULL THEN
        INSERT INTO core_entities (
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            metadata
        ) VALUES (
            p_org_id,
            p_entity_type,
            p_entity_name,
            v_entity_code,
            v_smart_code,
            p_metadata
        )
        RETURNING id INTO v_new_id;
        
        -- Also create the normalized name entry
        INSERT INTO core_dynamic_data (
            entity_id,
            field_name,
            field_value_text,
            organization_id,
            smart_code
        ) VALUES (
            v_new_id,
            'normalized_name',
            v_normalized_name,
            p_org_id,
            'HERA.SYSTEM.NORMALIZATION.NAME.V1'
        ) ON CONFLICT (entity_id, field_name) DO NOTHING;
        
        RETURN QUERY
        SELECT v_new_id, true, 'created'::text, 1.0::numeric;
    ELSE
        -- Update existing entity metadata if provided
        IF p_metadata IS NOT NULL THEN
            UPDATE core_entities
            SET metadata = COALESCE(metadata, '{}'::jsonb) || p_metadata,
                updated_at = NOW()
            WHERE id = v_existing_id;
        END IF;
        
        RETURN QUERY
        SELECT v_existing_id, false, v_matched_by, v_confidence;
    END IF;
END;
$$;


ALTER FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text" DEFAULT 'GENERIC'::"text", "p_locale" "text" DEFAULT 'en-GB'::"text", "p_pack" "jsonb" DEFAULT '{"EMPLOYEE": ["employee", "staff", "crew", "associate", "team member"], "ROLE/STYLIST": ["stylist", "hair stylist", "barber", "technician"]}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  k text; v jsonb; label text;
  v_concept_id uuid;
BEGIN
  -- Ensure EMPLOYEE concept
  SELECT id INTO v_concept_id FROM core_entities
   WHERE organization_id=p_org AND entity_type='CONCEPT'
     AND smart_code='HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.v1';
  IF v_concept_id IS NULL THEN
    INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
    VALUES (p_org,'CONCEPT','EMPLOYEE','HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.v1',
            jsonb_build_object('industry',p_industry))
    RETURNING id INTO v_concept_id;
  END IF;

  -- Ensure ROLE/STYLIST concept
  PERFORM 1 FROM core_entities
   WHERE organization_id=p_org AND entity_type='CONCEPT'
     AND smart_code='HERA.HCM.EMPLOYMENT.ROLE.STYLIST.v1';
  IF NOT FOUND THEN
    INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
    VALUES (p_org,'CONCEPT','ROLE/STYLIST','HERA.HCM.EMPLOYMENT.ROLE.STYLIST.v1',
            jsonb_build_object('industry',p_industry));
  END IF;

  -- Insert aliases and ALIAS_OF links from pack
  FOR k, v IN SELECT key, value FROM jsonb_each(p_pack)
  LOOP
    FOR label IN SELECT trim(lower(value::text), '"')
                 FROM jsonb_array_elements_text(v)
    LOOP
      -- alias entity
      INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
      VALUES (p_org,'ALIAS',label,'HERA.GENERIC.ALIAS.ENTITY.LABEL.v1',
              jsonb_build_object('locale',p_locale,'industry',p_industry))
      ON CONFLICT DO NOTHING;

      -- dynamic data
      INSERT INTO core_dynamic_data(organization_id,entity_id,field_name,field_type,field_value_text,smart_code)
      SELECT p_org, id, 'alias_label','text',label,'HERA.GENERIC.ALIAS.DATA.LABEL.v1'
      FROM core_entities
      WHERE organization_id=p_org AND entity_type='ALIAS' AND entity_name=label
      ON CONFLICT DO NOTHING;

      -- link ALIAS_OF → concept
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      SELECT p_org, a.id, c.id, 'ALIAS_OF','HERA.GENERIC.ALIAS.REL.ALIAS_OF.v1', 0.99
      FROM core_entities a
      JOIN core_entities c
        ON c.organization_id=p_org AND c.entity_type='CONCEPT'
       AND c.smart_code = CASE k
            WHEN 'EMPLOYEE' THEN 'HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.v1'
            WHEN 'ROLE/STYLIST' THEN 'HERA.HCM.EMPLOYMENT.ROLE.STYLIST.v1'
          END
      WHERE a.organization_id=p_org AND a.entity_type='ALIAS' AND a.entity_name=label
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_runtime_mode text;
BEGIN
  -- Get runtime mode from environment or default to 'warn'
  v_runtime_mode := current_setting('app.hera_guardrails_mode', true);
  v_runtime_mode := COALESCE(v_runtime_mode, 'warn');

  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    NEW.updated_at = NEW.created_at;
    NEW.version = COALESCE(NEW.version, 1);
    
    -- Handle created_by based on runtime mode
    IF NEW.created_by IS NULL THEN
      IF v_runtime_mode = 'enforce' THEN
        RAISE EXCEPTION 'created_by cannot be NULL (HERA v2.2 ENFORCE mode)';
      ELSE
        -- v1 WARN mode - log warning but allow
        RAISE NOTICE 'HERA v2.2 WARN: created_by was NULL on table %, id=% (v1 runtime)', TG_TABLE_NAME, NEW.id;
      END IF;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    
    -- Handle updated_by based on runtime mode
    IF NEW.updated_by IS NULL THEN
      IF v_runtime_mode = 'enforce' THEN
        RAISE EXCEPTION 'updated_by cannot be NULL (HERA v2.2 ENFORCE mode)';
      ELSE
        -- v1 WARN mode - log warning but allow
        RAISE NOTICE 'HERA v2.2 WARN: updated_by was NULL on table %, id=% (v1 runtime)', TG_TABLE_NAME, NEW.id;
      END IF;
    END IF;
    
    -- Preserve created_at and created_by
    NEW.created_at = OLD.created_at;
    NEW.created_by = OLD.created_by;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_audit_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$
  WITH t AS (
    SELECT split_part(p_smart_code,'.',2) AS mod,
           split_part(p_smart_code,'.',3) AS sub,
           split_part(p_smart_code,'.',4) AS func
  )
  SELECT EXISTS (
    SELECT 1 FROM t
    WHERE mod = 'FIN'
       OR sub IN ('AP','AR','GL','BANK','CASH')
       OR func IN ('INVOICE','BILL','JOURNAL','PAYMENT','RECEIPT','CREDIT','DEBIT','CREDIT_MEMO','DEBIT_MEMO')
  );
$$;


ALTER FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."smart_is_negative_txn_static"("p" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$
  WITH t AS (SELECT split_part(p,'.',4) f4, split_part(p,'.',5) f5, split_part(p,'.',6) f6)
  SELECT EXISTS (
    SELECT 1 FROM t
    WHERE f4 IN ('CREDIT','REFUND','REVERSAL','RETURN','CREDIT_MEMO')
       OR f5 IN ('CREDIT','REFUND','REVERSAL','RETURN','ADJUST')
       OR f6 IN ('SPOILAGE','SHRINKAGE','WRITE_OFF','WRITEOFF','DAMAGE','DAMAGED','LOSS','LOST','BREAKAGE','WASTE')
  );
$$;


ALTER FUNCTION "public"."smart_is_negative_txn_static"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_entity_fields_soft_validate"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM public.validate_entity_field_v2(NEW.id);
  NEW.validation_status := CASE WHEN v.is_valid THEN 'valid' ELSE 'invalid' END;
  NEW.ai_insights := jsonb_set(COALESCE(NEW.ai_insights,'{}'::jsonb),
                               '{validation_errors}', v.errors, true);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_entity_fields_soft_validate"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_tl_calc_amounts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE r numeric(20,10);
BEGIN
  IF NEW.line_amount IS NULL THEN
    NEW.line_amount := COALESCE(NEW.quantity,0)*COALESCE(NEW.unit_amount,0)
                       - COALESCE(NEW.discount_amount,0);
  END IF;

  SELECT exchange_rate INTO r
  FROM universal_transactions
  WHERE id = NEW.transaction_id;

  IF r IS NOT NULL THEN
    NEW.line_amount_base := COALESCE(NEW.line_amount,0) * r;
    NEW.tax_amount_base  := COALESCE(NEW.tax_amount,0)  * r;
  END IF;

  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."tg_tl_calc_amounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_tl_enforce_header_currency"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE hdr char(3);
BEGIN
  SELECT transaction_currency_code INTO hdr
  FROM universal_transactions
  WHERE id = NEW.transaction_id;

  IF NEW.currency_code IS NULL THEN
    NEW.currency_code := hdr;
  ELSIF NEW.currency_code <> hdr THEN
    RAISE EXCEPTION 'Mixed currencies not allowed (line %, header %)', NEW.currency_code, hdr;
  END IF;

  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."tg_tl_enforce_header_currency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_txn_fx_on_post_any"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  status_col text := TG_ARGV[0];
  old_status text := upper(COALESCE((to_jsonb(OLD)->>status_col), ''));
  new_status text := upper(COALESCE((to_jsonb(NEW)->>status_col), ''));

  txn_ccy   text := upper(NULLIF(to_jsonb(NEW)->>'transaction_currency_code',''));
  base_ccy  text := upper(NULLIF(to_jsonb(NEW)->>'base_currency_code',''));
  ex_rate   text := NULLIF(to_jsonb(NEW)->>'exchange_rate','');
  ex_date   text := NULLIF(to_jsonb(NEW)->>'exchange_rate_date','');
  ex_type   text := NULLIF(to_jsonb(NEW)->>'exchange_rate_type','');
BEGIN
  -- only for financial transactions
  IF NOT smart_is_financial_txn(NEW.smart_code) THEN
    RETURN NEW;
  END IF;

  -- require FX only if BOTH currency columns exist & differ
  IF TG_OP='UPDATE' AND old_status IS DISTINCT FROM 'POSTED' AND new_status='POSTED' THEN
    IF txn_ccy IS NOT NULL AND base_ccy IS NOT NULL AND txn_ccy <> base_ccy THEN
      IF ex_rate IS NULL OR ex_date IS NULL OR ex_type IS NULL THEN
        RAISE EXCEPTION 'Cannot POST financial txn without exchange_rate, date, and type when currencies differ';
      END IF;
    END IF;
  END IF;

  -- freeze FX once POSTED (only if columns exist)
  IF old_status='POSTED' AND new_status='POSTED' THEN
    IF (txn_ccy IS NOT NULL AND base_ccy IS NOT NULL AND
        upper(NULLIF(to_jsonb(OLD)->>'transaction_currency_code','')) IS DISTINCT FROM txn_ccy)
       OR (NULLIF(to_jsonb(OLD)->>'exchange_rate','')       IS DISTINCT FROM ex_rate)
       OR (NULLIF(to_jsonb(OLD)->>'exchange_rate_date','')  IS DISTINCT FROM ex_date)
       OR (NULLIF(to_jsonb(OLD)->>'exchange_rate_type','')  IS DISTINCT FROM ex_type)
    THEN
      RAISE EXCEPTION 'FX fields are immutable after POST for financial transactions';
    END IF;
  END IF;

  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."tg_txn_fx_on_post_any"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_txn_rollup_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE universal_transactions t
  SET
    total_amount = (
      SELECT COALESCE(SUM(
               COALESCE(line_amount,0)
             - COALESCE(discount_amount,0)
             + COALESCE(tax_amount,0)
           ),0)
      FROM universal_transaction_lines l
      WHERE l.transaction_id = t.id
    ),
    total_amount_base = (
      SELECT COALESCE(SUM(
               COALESCE(line_amount_base,0)
             - COALESCE(discount_amount,0) * COALESCE(t.exchange_rate,1)
             + COALESCE(tax_amount_base,0)
           ),0)
      FROM universal_transaction_lines l
      WHERE l.transaction_id = t.id
    ),
    updated_at = now()
  WHERE t.id = COALESCE(NEW.transaction_id, OLD.transaction_id);

  RETURN NULL;
END
$$;


ALTER FUNCTION "public"."tg_txn_rollup_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_org_access"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM core_relationships cr
    WHERE cr.from_entity_id = auth_user_entity_id()
      AND cr.organization_id = org_id
      AND cr.relationship_type = 'membership'
      AND cr.is_active = true
      AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  );
$$;


ALTER FUNCTION "public"."user_has_org_access"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ut_smart_code_normalize_biud"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_sc text;
  -- Full scheme: HERA.<INDUSTRY>.<... 3 to 8 segments ...>.vN
  v_full_regex constant text :=
    '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';
  -- Exactly two segments after industry (so we will inject .HEADER to make it 3)
  v_two_after_industry constant text :=
    '^(HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){2})(\.v[0-9]+)$';
BEGIN
  IF NEW.smart_code IS NULL OR btrim(NEW.smart_code) = '' THEN
    RETURN NEW; -- nothing to do
  END IF;

  v_sc := btrim(NEW.smart_code);

  -- 1) Uppercase everything first
  v_sc := UPPER(v_sc);

  -- 2) Normalize version marker to lowercase 'v' (handles .Vn or .vN)
  v_sc := REGEXP_REPLACE(v_sc, '\.V([0-9]+)$', '.v\1');

  -- 3) If only two segments after industry, inject .HEADER before version
  IF v_sc ~ v_two_after_industry THEN
    v_sc := REGEXP_REPLACE(v_sc, v_two_after_industry, '\1.HEADER\2');
  END IF;

  -- 4) Prevent duplicate/accidental double HEADER (idempotency)
  --    If someone already put HEADER, don’t create HEADER.HEADER
  v_sc := REGEXP_REPLACE(
            v_sc,
            '^(HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){2})\.HEADER\.HEADER(\.v[0-9]+)$',
            '\1.HEADER\2'
         );

  -- 5) Final validation against full scheme (3–8 segments after industry)
  IF v_sc !~ v_full_regex THEN
    RAISE EXCEPTION 'smart_code violates HERA scheme: %', v_sc
      USING HINT = 'Expected: HERA.<INDUSTRY>.<3..8 segments>.vN. Example: HERA.SALON.TXN.SALE.HEADER.v1';
  END IF;

  NEW.smart_code := v_sc;
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."ut_smart_code_normalize_biud"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_actor_membership"("p_actor_user_id" "uuid", "p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_is_member boolean := false;
BEGIN
  -- Check if actor is a member of the organization
  SELECT EXISTS (
    SELECT 1 
    FROM public.core_relationships cr
    WHERE cr.source_entity_id = p_actor_user_id
      AND cr.target_entity_id = p_organization_id
      AND cr.relationship_type = 'MEMBER_OF'
      AND cr.is_active = true
      AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  ) INTO v_is_member;
  
  RETURN v_is_member;
END;
$$;


ALTER FUNCTION "public"."validate_actor_membership"("p_actor_user_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") RETURNS TABLE("field_id" "uuid", "is_valid" boolean, "errors" "jsonb")
    LANGUAGE "plpgsql"
    AS $_$
DECLARE 
  dyn_tbl regclass;
  f record; 
  e jsonb := '[]'::jsonb; 
  req bool; enum_vals text[]; uniq bool; sc int; etype text;
  exists_dup bool;
BEGIN
  -- Resolve the actual dynamic-data table you have (add names here if needed)
  SELECT COALESCE(
           to_regclass('public.entity_fields'),
           to_regclass('public.core_dynamic_data'),
           to_regclass('public.universal_dynamic_data'),
           to_regclass('public.dynamic_data'),
           to_regclass('public.core_dynamic_fields')
         )
  INTO dyn_tbl;

  IF dyn_tbl IS NULL THEN
    RAISE EXCEPTION 'No dynamic-data table found (looked for entity_fields/core_dynamic_data/universal_dynamic_data/dynamic_data/core_dynamic_fields)';
  END IF;

  -- Load the field row + its parent entity_type using dynamic SQL
  EXECUTE format(
    'SELECT ef.*, e.entity_type
       FROM %s ef 
       JOIN entities e ON e.id = ef.entity_id
      WHERE ef.id = $1',
    dyn_tbl::text
  )
  INTO f
  USING p_field_id;

  IF NOT FOUND THEN
    RETURN; -- no row, empty result
  END IF;

  req  := COALESCE(f.is_required,false) OR _vf_bool(f.validation_rules,'required',false);
  enum_vals := _vf_textarr(f.validation_rules,'enum');
  uniq := _vf_bool(f.validation_rules,'unique_across_type',false);
  sc := COALESCE((f.validation_rules->>'scale')::int,NULL);
  etype := f.entity_type;

  -- Requiredness per type
  IF req THEN
    IF f.field_type='text'    AND f.field_value_text    IS NULL THEN e := _vf_errs_concat(e,'required:text'); END IF;
    IF f.field_type='number'  AND f.field_value_number  IS NULL THEN e := _vf_errs_concat(e,'required:number'); END IF;
    IF f.field_type='boolean' AND f.field_value_boolean IS NULL THEN e := _vf_errs_concat(e,'required:boolean'); END IF;
    IF f.field_type='date'    AND f.field_value_date    IS NULL THEN e := _vf_errs_concat(e,'required:date'); END IF;
    IF f.field_type='json'    AND f.field_value_json    IS NULL THEN e := _vf_errs_concat(e,'required:json'); END IF;
    IF f.field_type='file'    AND f.field_value_file_url IS NULL THEN e := _vf_errs_concat(e,'required:file'); END IF;
  END IF;

  -- Type-specific checks
  IF f.field_type='text' THEN
    IF NOT _vf_regex_ok(f.field_value_text, (f.validation_rules->>'regex')) THEN e := _vf_errs_concat(e,'regex'); END IF;
    IF (f.validation_rules ? 'min_length') AND length(f.field_value_text) < (f.validation_rules->>'min_length')::int THEN e := _vf_errs_concat(e,'min_length'); END IF;
    IF (f.validation_rules ? 'max_length') AND length(f.field_value_text) > (f.validation_rules->>'max_length')::int THEN e := _vf_errs_concat(e,'max_length'); END IF;
    IF array_length(enum_vals,1) IS NOT NULL AND f.field_value_text IS NOT NULL AND NOT (f.field_value_text = ANY(enum_vals))
      THEN e := _vf_errs_concat(e,'enum'); END IF;

  ELSIF f.field_type='number' THEN
    IF sc IS NOT NULL AND NOT _vf_scale_ok(f.field_value_number, sc) THEN e := _vf_errs_concat(e,'scale'); END IF;
    IF (f.validation_rules ? 'min') AND f.field_value_number < (f.validation_rules->>'min')::numeric THEN e := _vf_errs_concat(e,'min'); END IF;
    IF (f.validation_rules ? 'max') AND f.field_value_number > (f.validation_rules->>'max')::numeric THEN e := _vf_errs_concat(e,'max'); END IF;

  ELSIF f.field_type='date' THEN
    IF (f.validation_rules ? 'min_date') AND f.field_value_date::date < (f.validation_rules->>'min_date')::date THEN e := _vf_errs_concat(e,'min_date'); END IF;
    IF (f.validation_rules ? 'max_date') AND f.field_value_date::date > (f.validation_rules->>'max_date')::date THEN e := _vf_errs_concat(e,'max_date'); END IF;

  ELSIF f.field_type='file' THEN
    IF f.field_value_file_url IS NOT NULL AND f.field_value_file_url !~ '^https?://' THEN e := _vf_errs_concat(e,'file_url'); END IF;
  END IF;

  -- Optional uniqueness across same org + entity_type + field_name
  IF uniq THEN
    IF f.field_type='text' AND f.field_value_text IS NOT NULL THEN
      EXECUTE format(
        'SELECT EXISTS (
           SELECT 1 FROM %s ef2
           JOIN entities e2 ON e2.id = ef2.entity_id
          WHERE ef2.organization_id = $1
            AND e2.entity_type = $2
            AND ef2.field_name = $3
            AND ef2.field_type = ''text''
            AND ef2.field_value_text = $4
            AND ef2.id <> $5
        )', dyn_tbl::text)
      INTO exists_dup
      USING f.organization_id, etype, f.field_name, f.field_value_text, f.id;
      IF exists_dup THEN e := _vf_errs_concat(e,'unique'); END IF;
    END IF;

    IF f.field_type='number' AND f.field_value_number IS NOT NULL THEN
      EXECUTE format(
        'SELECT EXISTS (
           SELECT 1 FROM %s ef2
           JOIN entities e2 ON e2.id = ef2.entity_id
          WHERE ef2.organization_id = $1
            AND e2.entity_type = $2
            AND ef2.field_name = $3
            AND ef2.field_type = ''number''
            AND ef2.field_value_number = $4
            AND ef2.id <> $5
        )', dyn_tbl::text)
      INTO exists_dup
      USING f.organization_id, etype, f.field_name, f.field_value_number, f.id;
      IF exists_dup THEN e := _vf_errs_concat(e,'unique'); END IF;
    END IF;
  END IF;

  RETURN QUERY SELECT f.id, jsonb_array_length(e)=0, e;
END;
$_$;


ALTER FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") RETURNS TABLE("is_valid" boolean, "errors" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_org uuid; v_entity uuid; v_name text; v_type text; v_smart text;
BEGIN
  SELECT organization_id, entity_id, field_name, field_type, smart_code
    INTO v_org, v_entity, v_name, v_type, v_smart
  FROM public.core_dynamic_data
  WHERE id = p_dynamic_id;

  IF v_org IS NULL OR v_entity IS NULL OR v_name IS NULL OR v_smart IS NULL THEN
    RETURN QUERY SELECT
      false,
      jsonb_build_object('missing_fields',
        jsonb_build_object(
          'organization_id', (v_org IS NOT NULL),
          'entity_id',       (v_entity IS NOT NULL),
          'field_name',      (v_name IS NOT NULL),
          'smart_code',      (v_smart IS NOT NULL)
        )
      );
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.core_entities e
    WHERE e.id = v_entity AND e.organization_id = v_org
  ) THEN
    RETURN QUERY SELECT false, jsonb_build_object('entity',
      'entity not found in core_entities for this organization');
    RETURN;
  END IF;

  IF v_type IS NOT NULL AND v_type NOT IN ('text','number','boolean','date','json','file') THEN
    RETURN QUERY SELECT false, jsonb_build_object('field_type','unsupported type');
    RETURN;
  END IF;

  RETURN QUERY SELECT true, '{}'::jsonb;
END;
$$;


ALTER FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_finance_dna_smart_code"("p_smart_code" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    -- Must not be null or empty
    IF p_smart_code IS NULL OR p_smart_code = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Must match Finance DNA v2 pattern
    IF NOT p_smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$' THEN
        RETURN FALSE;
    END IF;
    
    -- Must have minimum components (HERA.ACCOUNTING.MODULE.FUNCTION.v2)
    IF array_length(string_to_array(p_smart_code, '.'), 1) < 5 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION "public"."validate_finance_dna_smart_code"("p_smart_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_period_status TEXT;
  v_posting_rules JSONB;
  v_allowed_patterns JSONB;
  v_engine_id UUID;
BEGIN
  -- Period status
  SELECT metadata->>'status' INTO v_period_status
  FROM core_entities
  WHERE id = p_period_id
    AND entity_type = 'period'
    AND organization_id = p_org_id;

  -- Resolve engine_id by code
  SELECT id INTO v_engine_id
  FROM core_entities
  WHERE organization_id = p_org_id
    AND entity_type = 'dna_component'
    AND entity_code  = 'PERIOD_CLOSE_ENGINE'
  LIMIT 1;

  -- Posting rules for current status
  SELECT field_value_json->v_period_status
  INTO v_posting_rules
  FROM core_dynamic_data
  WHERE organization_id = p_org_id
    AND entity_id = v_engine_id
    AND field_name = 'posting_rules';

  -- Allow all?
  IF v_posting_rules->>'allow_all' = 'true' THEN
    RETURN TRUE;
  END IF;

  -- Allowed patterns
  v_allowed_patterns := v_posting_rules->'allowed_patterns';
  IF v_allowed_patterns IS NOT NULL THEN
    FOR i IN 0..COALESCE(jsonb_array_length(v_allowed_patterns),0) - 1 LOOP
      IF p_smart_code LIKE '%' || (v_allowed_patterns->>i) || '%' THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_smart_code"("p_smart_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    AS $_$
DECLARE
  -- HERA DNA Smart Code Regex Pattern (v2.2 standard)
  v_pattern text := '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';
  v_parts text[];
BEGIN
  -- Null check
  IF p_smart_code IS NULL OR length(trim(p_smart_code)) = 0 THEN 
    RETURN FALSE; 
  END IF;

  -- Basic regex pattern validation
  IF NOT (p_smart_code ~ v_pattern) THEN 
    RETURN FALSE; 
  END IF;

  -- Additional structural validation
  v_parts := string_to_array(p_smart_code, '.');
  
  -- Must start with HERA
  IF v_parts[1] != 'HERA' THEN 
    RETURN FALSE; 
  END IF;
  
  -- Must end with version (v1, v2, etc.)
  IF NOT (v_parts[array_length(v_parts, 1)] ~ '^v[0-9]+$') THEN 
    RETURN FALSE; 
  END IF;
  
  -- Must have proper segment count (4-10 segments total)
  IF array_length(v_parts, 1) < 4 OR array_length(v_parts, 1) > 10 THEN 
    RETURN FALSE; 
  END IF;

  -- All validations passed
  RETURN TRUE;
  
END;
$_$;


ALTER FUNCTION "public"."validate_smart_code"("p_smart_code" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."core_organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_name" "text" NOT NULL,
    "organization_code" "text" NOT NULL,
    "organization_type" "text" DEFAULT 'business_unit'::"text",
    "industry_classification" "text",
    "parent_organization_id" "uuid",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_classification" "text",
    "ai_confidence" numeric(5,4) DEFAULT 0.0000,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."core_organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."core_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "from_entity_id" "uuid" NOT NULL,
    "to_entity_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "relationship_direction" "text" DEFAULT 'forward'::"text",
    "relationship_strength" numeric(5,4) DEFAULT 1.0000,
    "relationship_data" "jsonb" DEFAULT '{}'::"jsonb",
    "smart_code" character varying(100) NOT NULL,
    "smart_code_status" "text" DEFAULT 'DRAFT'::"text",
    "ai_confidence" numeric(5,4) DEFAULT 0.0000,
    "ai_classification" "text",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "business_logic" "jsonb" DEFAULT '{}'::"jsonb",
    "validation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "effective_date" timestamp with time zone DEFAULT "now"(),
    "expiration_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "version" integer DEFAULT 1,
    CONSTRAINT "no_self_relationship" CHECK (("from_entity_id" <> "to_entity_id"))
);


ALTER TABLE "public"."core_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_approval_actions" (
    "approval_action_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "approval_request_id" "uuid" NOT NULL,
    "approver_user_id" "uuid" NOT NULL,
    "approval_level" integer DEFAULT 1 NOT NULL,
    "action" "text" NOT NULL,
    "notes" "text",
    "approval_data" "jsonb" DEFAULT '{}'::"jsonb",
    "delegated_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "entity_approval_actions_action_check" CHECK (("action" = ANY (ARRAY['approved'::"text", 'rejected'::"text", 'delegated'::"text", 'escalated'::"text"])))
);


ALTER TABLE "public"."entity_approval_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_approval_escalations" (
    "escalation_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "approval_request_id" "uuid" NOT NULL,
    "escalated_from" "uuid" NOT NULL,
    "escalated_to" "uuid" NOT NULL,
    "escalation_reason" "text" NOT NULL,
    "escalated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolution_action" "text",
    CONSTRAINT "entity_approval_escalations_resolution_action_check" CHECK (("resolution_action" = ANY (ARRAY['approved'::"text", 'rejected'::"text", 'further_escalated'::"text", 'returned'::"text"])))
);


ALTER TABLE "public"."entity_approval_escalations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_approval_requests" (
    "approval_request_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "from_state" "text" NOT NULL,
    "to_state" "text" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "approval_rules" "jsonb" NOT NULL,
    "notes" "text",
    "approval_data" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "priority" integer DEFAULT 1,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "resolution_notes" "text",
    CONSTRAINT "entity_approval_requests_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5))),
    CONSTRAINT "entity_approval_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."entity_approval_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_business_rules" (
    "rule_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "rule_name" "text" NOT NULL,
    "rule_description" "text",
    "rule_logic" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 100,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."entity_business_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_workflow_audit" (
    "workflow_audit_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "from_state" "text" NOT NULL,
    "to_state" "text" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "approval_data" "jsonb" DEFAULT '{}'::"jsonb",
    "system_generated" boolean DEFAULT false,
    "transition_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "valid_state_transition" CHECK ((("from_state" <> "to_state") OR ("from_state" = 'SYSTEM'::"text")))
);


ALTER TABLE "public"."entity_workflow_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_workflow_configs" (
    "config_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "workflow_config" "jsonb" NOT NULL,
    "created_by" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_workflow_config" CHECK ((("workflow_config" ? 'states'::"text") AND ("workflow_config" ? 'transitions'::"text") AND ("jsonb_array_length"(("workflow_config" -> 'states'::"text")) > 0) AND ("jsonb_array_length"(("workflow_config" -> 'transitions'::"text")) > 0)))
);


ALTER TABLE "public"."entity_workflow_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_workflow_notifications" (
    "notification_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "recipient_user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "notification_data" "jsonb" DEFAULT '{}'::"jsonb",
    "channels" "text"[] DEFAULT ARRAY['email'::"text"],
    "status" "text" DEFAULT 'pending'::"text",
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "error_message" "text",
    CONSTRAINT "entity_workflow_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['workflow_change'::"text", 'approval_request'::"text", 'approval_action'::"text", 'escalation'::"text", 'reminder'::"text"]))),
    CONSTRAINT "entity_workflow_notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."entity_workflow_notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."hera_audit_list_v1_view" AS
 SELECT "now"() AS "timestamp",
    'action'::"text" AS "action",
    'resource'::"text" AS "resource",
    '{}'::"jsonb" AS "details",
    NULL::"text" AS "ip_address",
    NULL::"text" AS "user_agent";


ALTER VIEW "public"."hera_audit_list_v1_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."hera_onboarding_recent_v1" AS
 WITH "recent_users" AS (
         SELECT "e"."id" AS "user_entity_id",
            "e"."entity_name",
            ("e"."metadata" ->> 'email'::"text") AS "email",
            ("e"."metadata" ->> 'auth_uid'::"text") AS "auth_uid",
            "e"."created_at",
            "e"."created_by"
           FROM "public"."core_entities" "e"
          WHERE (("e"."entity_type" = 'USER'::"text") AND ("e"."organization_id" = '00000000-0000-0000-0000-000000000000'::"uuid"))
          ORDER BY "e"."created_at" DESC
         LIMIT 100
        )
 SELECT "ru"."created_at" AS "onboarded_at",
    "ru"."email",
    "ru"."entity_name",
    "ru"."auth_uid",
    "ru"."user_entity_id",
    ("array_agg"("r"."to_entity_id") FILTER (WHERE ("r"."relationship_type" = 'MEMBER_OF'::"text")))[1] AS "member_of_org",
    ("array_agg"("r"."smart_code") FILTER (WHERE ("r"."relationship_type" = 'USER_ROLE'::"text")))[1] AS "user_role_code",
    "ru"."created_by" AS "actor"
   FROM ("recent_users" "ru"
     LEFT JOIN "public"."core_relationships" "r" ON ((("r"."from_entity_id" = "ru"."user_entity_id") AND ("r"."organization_id" = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::"uuid"))))
  GROUP BY "ru"."created_at", "ru"."email", "ru"."entity_name", "ru"."auth_uid", "ru"."user_entity_id", "ru"."created_by"
  ORDER BY "ru"."created_at" DESC;


ALTER VIEW "public"."hera_onboarding_recent_v1" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."hera_user_orgs_list_v1_view" AS
 SELECT "gen_random_uuid"() AS "id",
    'Demo Org'::"text" AS "name",
    'admin'::"text" AS "role",
    true AS "is_primary",
    "now"() AS "last_accessed";


ALTER VIEW "public"."hera_user_orgs_list_v1_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."hera_users_list_v1_view" AS
 SELECT "gen_random_uuid"() AS "id",
    'User'::"text" AS "name",
    'viewer'::"text" AS "role";


ALTER VIEW "public"."hera_users_list_v1_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."universal_transaction_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "line_number" integer NOT NULL,
    "entity_id" "uuid",
    "line_type" "text" NOT NULL,
    "description" "text",
    "quantity" numeric(20,8) DEFAULT 1,
    "unit_amount" numeric(20,8) DEFAULT 0,
    "line_amount" numeric(20,8) DEFAULT 0,
    "discount_amount" numeric(20,8) DEFAULT 0,
    "tax_amount" numeric(20,8) DEFAULT 0,
    "smart_code" character varying(100) NOT NULL,
    "smart_code_status" "text" DEFAULT 'DRAFT'::"text",
    "ai_confidence" numeric(5,4) DEFAULT 0.0000,
    "ai_classification" "text",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "line_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "version" integer DEFAULT 1,
    CONSTRAINT "chk_gl_side_required" CHECK (((("smart_code")::"text" !~~ '%.GL.%'::"text") OR (("line_data" ? 'side'::"text") AND (("line_data" ->> 'side'::"text") = ANY (ARRAY['DR'::"text", 'CR'::"text"]))))),
    CONSTRAINT "chk_utl_smart_code_pattern" CHECK (("regexp_replace"("upper"(("smart_code")::"text"), '\.V([0-9]+)$'::"text", '.v\1'::"text") ~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'::"text"))
);


ALTER TABLE "public"."universal_transaction_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."universal_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "transaction_code" "text",
    "transaction_date" timestamp with time zone DEFAULT "now"(),
    "source_entity_id" "uuid",
    "target_entity_id" "uuid",
    "total_amount" numeric(19,4) DEFAULT 0 NOT NULL,
    "transaction_status" "text" DEFAULT 'pending'::"text",
    "reference_number" "text",
    "external_reference" "text",
    "smart_code" character varying(100) NOT NULL,
    "smart_code_status" "text" DEFAULT 'DRAFT'::"text",
    "ai_confidence" numeric(5,4) DEFAULT 0.0000,
    "ai_classification" "text",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "business_context" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "approval_required" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "version" integer DEFAULT 1,
    "transaction_currency_code" character(3),
    "base_currency_code" character(3),
    "exchange_rate" numeric(20,10),
    "exchange_rate_date" "date",
    "exchange_rate_type" "text",
    "fiscal_period_entity_id" "uuid",
    "fiscal_year" integer,
    "fiscal_period" integer,
    "posting_period_code" "text",
    CONSTRAINT "chk_ut_smart_code_pattern" CHECK (("regexp_replace"("upper"(("smart_code")::"text"), '\.V([0-9]+)$'::"text", '.v\1'::"text") ~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'::"text"))
);


ALTER TABLE "public"."universal_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_hera_accounts" AS
 SELECT "id",
    "organization_id",
    "entity_code",
    "entity_name",
    "parent_entity_id",
    "smart_code",
    "smart_code_status",
    "business_rules",
    "status",
        CASE
            WHEN (("smart_code")::"text" ~ '^HERA\.[A-Z0-9]+'::"text") THEN "split_part"(("smart_code")::"text", '.'::"text", 2)
            ELSE NULL::"text"
        END AS "industry_prefix",
        CASE
            WHEN (("smart_code")::"text" ~ '\.v[0-9]+$'::"text") THEN ("regexp_replace"(("smart_code")::"text", '.*\.v([0-9]+)$'::"text", '\1'::"text"))::integer
            ELSE 1
        END AS "smart_code_version",
    "regexp_replace"(("smart_code")::"text", '\.v[0-9]+$'::"text", ''::"text") AS "smart_code_family"
   FROM "public"."core_entities" "e"
  WHERE ("entity_type" = 'account'::"text");


ALTER VIEW "public"."v_hera_accounts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_period_close_dashboard" AS
 WITH "period_data" AS (
         SELECT "e"."id",
            "e"."organization_id",
            "e"."entity_code",
            "e"."entity_name",
            ("e"."metadata" ->> 'period_type'::"text") AS "period_type",
            ("e"."metadata" ->> 'fiscal_year'::"text") AS "fiscal_year",
            ("e"."metadata" ->> 'period_number'::"text") AS "period_number",
            ("e"."metadata" ->> 'status'::"text") AS "status",
            (("e"."metadata" ->> 'start_date'::"text"))::"date" AS "start_date",
            (("e"."metadata" ->> 'end_date'::"text"))::"date" AS "end_date",
            ("e"."metadata" ->> 'parent_period_id'::"text") AS "parent_period_id"
           FROM "public"."core_entities" "e"
          WHERE (("e"."entity_type" = 'period'::"text") AND ("e"."status" = 'active'::"text"))
        )
 SELECT "pd"."id",
    "pd"."organization_id",
    "pd"."entity_code",
    "pd"."entity_name",
    "pd"."period_type",
    "pd"."fiscal_year",
    "pd"."period_number",
    "pd"."status",
    "pd"."start_date",
    "pd"."end_date",
    "pd"."parent_period_id",
    "public"."get_period_close_progress"("pd"."id", "pd"."organization_id") AS "close_progress",
        CASE
            WHEN ("pd"."status" = 'CLOSED'::"text") THEN 'Closed'::"text"
            WHEN ("pd"."end_date" < CURRENT_DATE) THEN 'Overdue'::"text"
            WHEN ("pd"."end_date" <= (CURRENT_DATE + '5 days'::interval)) THEN 'Due Soon'::"text"
            ELSE 'Future'::"text"
        END AS "close_status",
    "parent"."entity_name" AS "parent_period_name"
   FROM ("period_data" "pd"
     LEFT JOIN "public"."core_entities" "parent" ON (("parent"."id" = ("pd"."parent_period_id")::"uuid")))
  ORDER BY "pd"."fiscal_year" DESC, "pd"."period_number" DESC;


ALTER VIEW "public"."v_period_close_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_universal_transaction_lines_drcr" AS
 SELECT "id",
    "organization_id",
    "transaction_id",
    "line_number",
    "entity_id",
    "line_type",
    "description",
    "quantity",
    "unit_amount",
    "line_amount",
    "discount_amount",
    "tax_amount",
    "smart_code",
    "smart_code_status",
    "ai_confidence",
    "ai_classification",
    "ai_insights",
    "line_data",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "version",
    "public"."hera_line_side"(("smart_code")::"text", "line_data") AS "side",
    "public"."hera_line_debit_amount"("public"."hera_line_side"(("smart_code")::"text", "line_data"), "line_amount") AS "debit_amount",
    "public"."hera_line_credit_amount"("public"."hera_line_side"(("smart_code")::"text", "line_data"), "line_amount") AS "credit_amount"
   FROM "public"."universal_transaction_lines" "l";


ALTER VIEW "public"."v_universal_transaction_lines_drcr" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_universal_transaction_lines_drcr" IS 'Derived view exposing debit_amount / credit_amount from line_data.side for reporting and analytics.';



CREATE OR REPLACE VIEW "public"."v_universal_transaction_lines_with_base" AS
 SELECT "l"."id",
    "l"."organization_id",
    "l"."transaction_id",
    "l"."line_number",
    "l"."entity_id",
    "l"."line_type",
    "l"."description",
    "l"."quantity",
    "l"."unit_amount",
    "l"."line_amount",
    "l"."discount_amount",
    "l"."tax_amount",
    "l"."smart_code",
    "l"."smart_code_status",
    "l"."ai_confidence",
    "l"."ai_classification",
    "l"."ai_insights",
    "l"."line_data",
    "l"."created_at",
    "l"."updated_at",
    "l"."created_by",
    "l"."updated_by",
    "l"."version",
    "round"(("l"."line_amount" * COALESCE("t"."exchange_rate", (1)::numeric)), 2) AS "line_amount_base"
   FROM ("public"."universal_transaction_lines" "l"
     JOIN "public"."universal_transactions" "t" ON (("t"."id" = "l"."transaction_id")));


ALTER VIEW "public"."v_universal_transaction_lines_with_base" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_user_entity_by_auth" AS
 SELECT "id",
    ("metadata" ->> 'auth_user_id'::"text") AS "auth_user_id"
   FROM "public"."core_entities"
  WHERE ("entity_type" = 'USER'::"text");


ALTER VIEW "public"."v_user_entity_by_auth" OWNER TO "postgres";


ALTER TABLE "public"."universal_transactions"
    ADD CONSTRAINT "chk_txn_total_sign" CHECK (
CASE
    WHEN "public"."smart_is_negative_txn_static"(("smart_code")::"text") THEN ("total_amount" <= (0)::numeric)
    ELSE ("total_amount" >= (0)::numeric)
END) NOT VALID;



ALTER TABLE ONLY "public"."core_dynamic_data"
    ADD CONSTRAINT "core_dynamic_data_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."core_dynamic_data"
    ADD CONSTRAINT "core_dynamic_data_smart_code_ck" CHECK ((("smart_code")::"text" ~* '^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$'::"text")) NOT VALID;



ALTER TABLE ONLY "public"."core_entities"
    ADD CONSTRAINT "core_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."core_entities"
    ADD CONSTRAINT "core_entities_smart_code_ck" CHECK ((("smart_code")::"text" ~* '^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$'::"text")) NOT VALID;



ALTER TABLE ONLY "public"."core_organizations"
    ADD CONSTRAINT "core_organizations_organization_code_key" UNIQUE ("organization_code");



ALTER TABLE ONLY "public"."core_organizations"
    ADD CONSTRAINT "core_organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."core_relationships"
    ADD CONSTRAINT "core_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."core_relationships"
    ADD CONSTRAINT "core_relationships_smart_code_ck" CHECK ((("smart_code")::"text" ~* '^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$'::"text")) NOT VALID;



ALTER TABLE ONLY "public"."entity_approval_actions"
    ADD CONSTRAINT "entity_approval_actions_approval_request_id_approver_user_i_key" UNIQUE ("approval_request_id", "approver_user_id", "approval_level");



ALTER TABLE ONLY "public"."entity_approval_actions"
    ADD CONSTRAINT "entity_approval_actions_pkey" PRIMARY KEY ("approval_action_id");



ALTER TABLE ONLY "public"."entity_approval_escalations"
    ADD CONSTRAINT "entity_approval_escalations_pkey" PRIMARY KEY ("escalation_id");



ALTER TABLE ONLY "public"."entity_approval_requests"
    ADD CONSTRAINT "entity_approval_requests_pkey" PRIMARY KEY ("approval_request_id");



ALTER TABLE ONLY "public"."entity_business_rules"
    ADD CONSTRAINT "entity_business_rules_organization_id_entity_type_rule_name_key" UNIQUE ("organization_id", "entity_type", "rule_name");



ALTER TABLE ONLY "public"."entity_business_rules"
    ADD CONSTRAINT "entity_business_rules_pkey" PRIMARY KEY ("rule_id");



ALTER TABLE ONLY "public"."entity_workflow_audit"
    ADD CONSTRAINT "entity_workflow_audit_pkey" PRIMARY KEY ("workflow_audit_id");



ALTER TABLE ONLY "public"."entity_workflow_configs"
    ADD CONSTRAINT "entity_workflow_configs_pkey" PRIMARY KEY ("config_id");



ALTER TABLE ONLY "public"."entity_workflow_notifications"
    ADD CONSTRAINT "entity_workflow_notifications_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."entity_workflow_configs"
    ADD CONSTRAINT "unique_active_workflow_per_entity_type" EXCLUDE USING "btree" ("organization_id" WITH =, "entity_type" WITH =) WHERE (("is_active" = true));



ALTER TABLE ONLY "public"."universal_transaction_lines"
    ADD CONSTRAINT "universal_transaction_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."universal_transaction_lines"
    ADD CONSTRAINT "universal_transaction_lines_transaction_id_line_number_key" UNIQUE ("transaction_id", "line_number");



ALTER TABLE ONLY "public"."universal_transactions"
    ADD CONSTRAINT "universal_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."universal_transactions"
    ADD CONSTRAINT "universal_transactions_transaction_code_key" UNIQUE ("transaction_code");



ALTER TABLE "public"."universal_transactions"
    ADD CONSTRAINT "ut_smart_code_ck" CHECK ((("smart_code")::"text" ~* '^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$'::"text")) NOT VALID;



ALTER TABLE "public"."universal_transaction_lines"
    ADD CONSTRAINT "utl_smart_code_ck" CHECK ((("smart_code")::"text" ~* '^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$'::"text")) NOT VALID;



CREATE UNIQUE INDEX "core_entities_org_subdomain_uidx" ON "public"."core_entities" USING "btree" ((("metadata" ->> 'subdomain'::"text"))) WHERE ("entity_type" = 'organization'::"text");



CREATE INDEX "idx_approval_actions_approver" ON "public"."entity_approval_actions" USING "btree" ("approver_user_id");



CREATE INDEX "idx_approval_actions_level" ON "public"."entity_approval_actions" USING "btree" ("approval_level");



CREATE INDEX "idx_approval_actions_request" ON "public"."entity_approval_actions" USING "btree" ("approval_request_id");



CREATE INDEX "idx_approval_requests_due_date" ON "public"."entity_approval_requests" USING "btree" ("due_date") WHERE ("due_date" IS NOT NULL);



CREATE INDEX "idx_approval_requests_entity" ON "public"."entity_approval_requests" USING "btree" ("entity_id");



CREATE INDEX "idx_approval_requests_org" ON "public"."entity_approval_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_approval_requests_requested_by" ON "public"."entity_approval_requests" USING "btree" ("requested_by");



CREATE INDEX "idx_approval_requests_status" ON "public"."entity_approval_requests" USING "btree" ("status");



CREATE INDEX "idx_business_rules_active" ON "public"."entity_business_rules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_business_rules_org_type" ON "public"."entity_business_rules" USING "btree" ("organization_id", "entity_type");



CREATE INDEX "idx_cdd_org_entity_field" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "entity_id", "field_name");



CREATE INDEX "idx_ce_alias_trgm" ON "public"."core_entities" USING "gin" ("entity_name" "public"."gin_trgm_ops") WHERE ("entity_type" = 'ALIAS'::"text");



CREATE INDEX "idx_ce_org_smartcode" ON "public"."core_entities" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_ce_org_type_name" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "entity_name");



CREATE INDEX "idx_core_dyn_fields" ON "public"."core_dynamic_data" USING "btree" ("entity_id", "field_name");



CREATE INDEX "idx_core_entities" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "entity_code");



CREATE INDEX "idx_core_entities_platform_apps" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "entity_code") WHERE (("entity_type" = 'APP'::"text") AND ("organization_id" = '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "idx_core_entities_platform_apps_code" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "entity_code") WHERE (("entity_type" = 'APP'::"text") AND ("organization_id" = '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "idx_core_entities_platform_apps_sc" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "smart_code") WHERE (("entity_type" = 'APP'::"text") AND ("organization_id" = '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "idx_core_relationships_expiration" ON "public"."core_relationships" USING "btree" ("expiration_date");



CREATE INDEX "idx_core_relationships_from_reltype_active" ON "public"."core_relationships" USING "btree" ("from_entity_id", "relationship_type", "is_active");



CREATE INDEX "idx_core_relationships_org_from" ON "public"."core_relationships" USING "btree" ("organization_id", "from_entity_id");



CREATE INDEX "idx_cr_org_from_to_type" ON "public"."core_relationships" USING "btree" ("organization_id", "from_entity_id", "to_entity_id", "relationship_type");



CREATE INDEX "idx_cr_org_type" ON "public"."core_relationships" USING "btree" ("organization_id", "relationship_type");



CREATE INDEX "idx_dynamic_data_entity" ON "public"."core_dynamic_data" USING "btree" ("entity_id", "field_name");



CREATE INDEX "idx_dynamic_data_org" ON "public"."core_dynamic_data" USING "btree" ("organization_id");



CREATE INDEX "idx_dynamic_normalized_name" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "field_name", "field_value_text") WHERE ("field_name" = 'normalized_name'::"text");



CREATE INDEX "idx_dynamic_org_smart" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_dynamic_smart_code" ON "public"."core_dynamic_data" USING "btree" ("smart_code");



CREATE INDEX "idx_entities_name_trgm" ON "public"."core_entities" USING "gin" ("entity_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_entities_normalized_lookup" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "status");



CREATE INDEX "idx_entities_org" ON "public"."core_entities" USING "btree" ("organization_id");



CREATE INDEX "idx_entities_org_smart" ON "public"."core_entities" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_entities_org_type" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type");



CREATE INDEX "idx_entities_smart_code" ON "public"."core_entities" USING "btree" ("smart_code");



CREATE INDEX "idx_entities_smart_status" ON "public"."core_entities" USING "btree" ("smart_code_status");



CREATE INDEX "idx_escalations_escalated_to" ON "public"."entity_approval_escalations" USING "btree" ("escalated_to");



CREATE INDEX "idx_escalations_request" ON "public"."entity_approval_escalations" USING "btree" ("approval_request_id");



CREATE INDEX "idx_notifications_entity" ON "public"."entity_workflow_notifications" USING "btree" ("entity_id");



CREATE INDEX "idx_notifications_recipient" ON "public"."entity_workflow_notifications" USING "btree" ("recipient_user_id");



CREATE INDEX "idx_notifications_scheduled" ON "public"."entity_workflow_notifications" USING "btree" ("scheduled_for");



CREATE INDEX "idx_notifications_status" ON "public"."entity_workflow_notifications" USING "btree" ("status");



CREATE INDEX "idx_rel_org_has_app_active" ON "public"."core_relationships" USING "btree" ("organization_id", "from_entity_id", "to_entity_id") WHERE (("relationship_type" = 'ORG_HAS_APP'::"text") AND COALESCE("is_active", true));



CREATE INDEX "idx_relationships_from" ON "public"."core_relationships" USING "btree" ("from_entity_id", "relationship_type");



CREATE INDEX "idx_relationships_membership" ON "public"."core_relationships" USING "btree" ("from_entity_id", "organization_id", "relationship_type") WHERE (("relationship_type" = 'membership'::"text") AND ("is_active" = true));



CREATE INDEX "idx_relationships_org_smart" ON "public"."core_relationships" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_relationships_smart_code" ON "public"."core_relationships" USING "btree" ("smart_code");



CREATE INDEX "idx_transaction_lines_org" ON "public"."universal_transaction_lines" USING "btree" ("organization_id");



CREATE INDEX "idx_transaction_lines_org_smart" ON "public"."universal_transaction_lines" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_transaction_lines_smart_code" ON "public"."universal_transaction_lines" USING "btree" ("smart_code");



CREATE INDEX "idx_transaction_lines_txn" ON "public"."universal_transaction_lines" USING "btree" ("transaction_id", "line_number");



CREATE INDEX "idx_transactions_org" ON "public"."universal_transactions" USING "btree" ("organization_id");



CREATE INDEX "idx_transactions_org_smart" ON "public"."universal_transactions" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_transactions_org_type" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_type");



CREATE INDEX "idx_transactions_smart_code" ON "public"."universal_transactions" USING "btree" ("smart_code");



CREATE INDEX "idx_txn_period_fk" ON "public"."universal_transactions" USING "btree" ("fiscal_period_entity_id");



CREATE INDEX "idx_ut_idem_key" ON "public"."universal_transactions" USING "btree" ("organization_id", (("metadata" ->> 'idem_key'::"text"))) WHERE (("smart_code")::"text" = 'HERA.KERNEL.IDEMPOTENCY.TXN.RECORD.v1'::"text");



CREATE INDEX "idx_ut_org_date_id_active" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_date" DESC, "id" DESC) WHERE ("transaction_status" <> 'voided'::"text");



CREATE INDEX "idx_ut_org_date_id_all" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_date" DESC, "id" DESC);



CREATE INDEX "idx_ut_org_status_date" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_status", "transaction_date" DESC);



CREATE INDEX "idx_ut_org_type_date" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_type", "transaction_date" DESC);



CREATE INDEX "idx_utl_gl_lines" ON "public"."universal_transaction_lines" USING "btree" ("transaction_id", (("line_data" ->> 'side'::"text"))) WHERE (("smart_code")::"text" ~~ '%.GL.%'::"text");



CREATE INDEX "idx_utl_org_txn_is_gl" ON "public"."universal_transaction_lines" USING "btree" ("organization_id", "transaction_id") WHERE (("smart_code")::"text" ~ '\.GL\.'::"text");



CREATE INDEX "idx_utl_org_txn_line" ON "public"."universal_transaction_lines" USING "btree" ("organization_id", "transaction_id", "line_number");



CREATE INDEX "idx_utl_org_txn_linenum" ON "public"."universal_transaction_lines" USING "btree" ("organization_id", "transaction_id", "line_number", "id");



CREATE INDEX "idx_workflow_audit_changed_at" ON "public"."entity_workflow_audit" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_workflow_audit_changed_by" ON "public"."entity_workflow_audit" USING "btree" ("changed_by");



CREATE INDEX "idx_workflow_audit_entity" ON "public"."entity_workflow_audit" USING "btree" ("entity_id");



CREATE INDEX "idx_workflow_configs_active" ON "public"."entity_workflow_configs" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_workflow_configs_org_type" ON "public"."entity_workflow_configs" USING "btree" ("organization_id", "entity_type");



CREATE INDEX "ix_rpt_profiles_org_entity_id" ON "public"."rpt_entity_profiles" USING "btree" ("organization_id", "entity_id");



CREATE INDEX "ix_rpt_profiles_org_entity_type" ON "public"."rpt_entity_profiles" USING "btree" ("organization_id", "entity_type");



CREATE INDEX "ix_user_by_email" ON "public"."core_entities" USING "btree" ("lower"(("metadata" ->> 'email'::"text"))) WHERE ("entity_type" = 'USER'::"text");



CREATE INDEX "ix_ut_outbox_processing_epoch" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_status", ((("business_context" ->> 'lease_expires_at_epoch'::"text"))::bigint)) WHERE (("smart_code")::"text" = 'HERA.PLATFORM.OUTBOX.EVENT.v1'::"text");



CREATE INDEX "ix_ut_outbox_ready_epoch" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_status", ((("business_context" ->> 'available_at_epoch'::"text"))::bigint), "created_at") WHERE (("smart_code")::"text" = 'HERA.PLATFORM.OUTBOX.EVENT.v1'::"text");



CREATE INDEX "ut_org_type_created_at_idx" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_type", "created_at");



CREATE UNIQUE INDEX "ux_cdd_org_entity_field" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "entity_id", "field_name");



CREATE UNIQUE INDEX "ux_dynamic_data_entity_field" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "entity_id", "field_name");



CREATE UNIQUE INDEX "ux_has_role_primary_per_org_user" ON "public"."core_relationships" USING "btree" ("organization_id", "from_entity_id") WHERE (("relationship_type" = 'HAS_ROLE'::"text") AND COALESCE("is_active", true) AND ((("relationship_data" ->> 'is_primary'::"text"))::boolean IS TRUE));



CREATE UNIQUE INDEX "ux_user_by_auth_id" ON "public"."core_entities" USING "btree" ((("metadata" ->> 'auth_user_id'::"text"))) WHERE ("entity_type" = 'USER'::"text");



CREATE UNIQUE INDEX "ux_ut_outbox_idem" ON "public"."universal_transactions" USING "btree" ("organization_id", (("business_context" ->> 'idem_key'::"text"))) WHERE (("smart_code")::"text" = 'HERA.PLATFORM.OUTBOX.EVENT.v1'::"text");



CREATE OR REPLACE TRIGGER "enforce_actor_audit" BEFORE INSERT OR UPDATE ON "public"."core_dynamic_data" FOR EACH ROW EXECUTE FUNCTION "public"."check_actor_non_null"();



CREATE OR REPLACE TRIGGER "enforce_actor_audit" BEFORE INSERT OR UPDATE ON "public"."core_entities" FOR EACH ROW EXECUTE FUNCTION "public"."check_actor_non_null"();



CREATE OR REPLACE TRIGGER "enforce_actor_audit" BEFORE INSERT OR UPDATE ON "public"."core_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."check_actor_non_null"();



CREATE OR REPLACE TRIGGER "enforce_actor_audit" BEFORE INSERT OR UPDATE ON "public"."core_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."check_actor_non_null"();



CREATE OR REPLACE TRIGGER "enforce_actor_audit" BEFORE INSERT OR UPDATE ON "public"."universal_transaction_lines" FOR EACH ROW EXECUTE FUNCTION "public"."check_actor_non_null"();



CREATE OR REPLACE TRIGGER "enforce_actor_audit" BEFORE INSERT OR UPDATE ON "public"."universal_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."check_actor_non_null"();



CREATE OR REPLACE TRIGGER "trg_ef_soft_validate" BEFORE INSERT OR UPDATE ON "public"."core_dynamic_data" FOR EACH ROW EXECUTE FUNCTION "public"."tg_entity_fields_soft_validate"();



CREATE OR REPLACE TRIGGER "trg_enforce_txn_type_upper" BEFORE INSERT OR UPDATE ON "public"."universal_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_txn_type_upper"();



CREATE OR REPLACE TRIGGER "trg_hera_normalize_entity_biu" BEFORE INSERT OR UPDATE ON "public"."core_entities" FOR EACH ROW EXECUTE FUNCTION "public"."hera_normalize_entity_biu"();



CREATE CONSTRAINT TRIGGER "trg_require_has_canonical_type" AFTER INSERT OR UPDATE ON "public"."core_entities" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."hera_require_has_canonical_type"();



CREATE OR REPLACE TRIGGER "trg_tl_calc_amounts" BEFORE INSERT OR UPDATE OF "quantity", "unit_amount", "discount_amount", "line_amount", "tax_amount", "transaction_id" ON "public"."universal_transaction_lines" FOR EACH ROW EXECUTE FUNCTION "public"."tg_tl_calc_amounts"();

ALTER TABLE "public"."universal_transaction_lines" DISABLE TRIGGER "trg_tl_calc_amounts";



CREATE OR REPLACE TRIGGER "trg_tl_rollup_aiud" AFTER INSERT OR DELETE OR UPDATE ON "public"."universal_transaction_lines" FOR EACH ROW EXECUTE FUNCTION "public"."tg_txn_rollup_totals"();

ALTER TABLE "public"."universal_transaction_lines" DISABLE TRIGGER "trg_tl_rollup_aiud";



CREATE OR REPLACE TRIGGER "trg_txn_fx_on_post" BEFORE UPDATE ON "public"."universal_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_txn_fx_on_post_any"('transaction_status');



CREATE OR REPLACE TRIGGER "trg_universal_txn_smartcode" BEFORE INSERT OR UPDATE ON "public"."universal_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."hera_smart_code_normalizer"();



CREATE OR REPLACE TRIGGER "trg_ut_smart_code_biud" BEFORE INSERT OR UPDATE OF "smart_code" ON "public"."universal_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."ut_smart_code_normalize_biud"();



ALTER TABLE ONLY "public"."core_dynamic_data"
    ADD CONSTRAINT "core_dynamic_data_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."core_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."core_dynamic_data"
    ADD CONSTRAINT "core_dynamic_data_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."core_entities"
    ADD CONSTRAINT "core_entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."core_relationships"
    ADD CONSTRAINT "core_relationships_from_entity_id_fkey" FOREIGN KEY ("from_entity_id") REFERENCES "public"."core_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."core_relationships"
    ADD CONSTRAINT "core_relationships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."core_relationships"
    ADD CONSTRAINT "core_relationships_to_entity_id_fkey" FOREIGN KEY ("to_entity_id") REFERENCES "public"."core_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_approval_actions"
    ADD CONSTRAINT "entity_approval_actions_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "public"."entity_approval_requests"("approval_request_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_approval_actions"
    ADD CONSTRAINT "entity_approval_actions_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_approval_actions"
    ADD CONSTRAINT "entity_approval_actions_delegated_to_fkey" FOREIGN KEY ("delegated_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_approval_escalations"
    ADD CONSTRAINT "entity_approval_escalations_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "public"."entity_approval_requests"("approval_request_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_approval_escalations"
    ADD CONSTRAINT "entity_approval_escalations_escalated_from_fkey" FOREIGN KEY ("escalated_from") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_approval_escalations"
    ADD CONSTRAINT "entity_approval_escalations_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_approval_requests"
    ADD CONSTRAINT "entity_approval_requests_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."core_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_approval_requests"
    ADD CONSTRAINT "entity_approval_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_approval_requests"
    ADD CONSTRAINT "entity_approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_approval_requests"
    ADD CONSTRAINT "entity_approval_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_business_rules"
    ADD CONSTRAINT "entity_business_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_business_rules"
    ADD CONSTRAINT "entity_business_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_workflow_audit"
    ADD CONSTRAINT "entity_workflow_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_workflow_audit"
    ADD CONSTRAINT "entity_workflow_audit_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."core_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_workflow_configs"
    ADD CONSTRAINT "entity_workflow_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entity_workflow_configs"
    ADD CONSTRAINT "entity_workflow_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_workflow_notifications"
    ADD CONSTRAINT "entity_workflow_notifications_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."core_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_workflow_notifications"
    ADD CONSTRAINT "entity_workflow_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_workflow_notifications"
    ADD CONSTRAINT "entity_workflow_notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."core_entities"
    ADD CONSTRAINT "fk_parent_entity" FOREIGN KEY ("parent_entity_id") REFERENCES "public"."core_entities"("id");



ALTER TABLE ONLY "public"."core_organizations"
    ADD CONSTRAINT "fk_parent_org" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."core_organizations"("id");



ALTER TABLE ONLY "public"."universal_transactions"
    ADD CONSTRAINT "fk_txn_period_entity" FOREIGN KEY ("fiscal_period_entity_id") REFERENCES "public"."core_entities"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."universal_transaction_lines"
    ADD CONSTRAINT "universal_transaction_lines_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."core_entities"("id");



ALTER TABLE ONLY "public"."universal_transaction_lines"
    ADD CONSTRAINT "universal_transaction_lines_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."universal_transaction_lines"
    ADD CONSTRAINT "universal_transaction_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."universal_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."universal_transactions"
    ADD CONSTRAINT "universal_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."core_organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."universal_transactions"
    ADD CONSTRAINT "universal_transactions_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "public"."core_entities"("id");



ALTER TABLE ONLY "public"."universal_transactions"
    ADD CONSTRAINT "universal_transactions_target_entity_id_fkey" FOREIGN KEY ("target_entity_id") REFERENCES "public"."core_entities"("id");



CREATE POLICY "allow_all_authenticated" ON "public"."core_dynamic_data" USING (("auth"."role"() = ANY (ARRAY['service_role'::"text", 'authenticated'::"text", 'anon'::"text"])));



CREATE POLICY "allow_all_authenticated" ON "public"."core_entities" USING (("auth"."role"() = ANY (ARRAY['service_role'::"text", 'authenticated'::"text", 'anon'::"text"])));



CREATE POLICY "allow_all_authenticated" ON "public"."core_organizations" USING (("auth"."role"() = ANY (ARRAY['service_role'::"text", 'authenticated'::"text", 'anon'::"text"])));



CREATE POLICY "allow_all_authenticated" ON "public"."core_relationships" USING (("auth"."role"() = ANY (ARRAY['service_role'::"text", 'authenticated'::"text", 'anon'::"text"])));



CREATE POLICY "allow_all_authenticated" ON "public"."universal_transaction_lines" USING (("auth"."role"() = ANY (ARRAY['service_role'::"text", 'authenticated'::"text", 'anon'::"text"])));



CREATE POLICY "allow_all_authenticated" ON "public"."universal_transactions" USING (("auth"."role"() = ANY (ARRAY['service_role'::"text", 'authenticated'::"text", 'anon'::"text"])));



ALTER TABLE "public"."core_dynamic_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."core_entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."core_organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."core_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_approval_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_approval_escalations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_approval_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_business_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_workflow_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_workflow_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_workflow_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_rel_read" ON "public"."core_relationships" FOR SELECT USING (("organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid"));



CREATE POLICY "org_rel_write" ON "public"."core_relationships" FOR INSERT WITH CHECK (("organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid"));



CREATE POLICY "platform_admin_access" ON "public"."core_entities" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."core_relationships" "r"
     JOIN "public"."core_entities" "role" ON (("role"."id" = "r"."to_entity_id")))
  WHERE (("r"."from_entity_id" = "auth"."uid"()) AND ("role"."entity_code" = 'PLATFORM_ADMIN'::"text") AND ("role"."entity_type" = 'ROLE'::"text") AND ("r"."relationship_type" = 'HAS_ROLE'::"text")))));



ALTER TABLE "public"."universal_transaction_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."universal_transactions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."_dyn_fields_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."_dyn_fields_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_dyn_fields_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_hera_resolve_org_role"("p_actor_user_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_hera_resolve_org_role"("p_actor_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_hera_resolve_org_role"("p_actor_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."_hera_role_rank"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_hera_role_rank"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_hera_role_rank"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_hera_sc_build"("p_segments" "text"[], "p_version" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_hera_sc_build"("p_segments" "text"[], "p_version" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_hera_sc_build"("p_segments" "text"[], "p_version" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_vf_bool"("js" "jsonb", "key" "text", "def" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_vf_bool"("js" "jsonb", "key" "text", "def" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_vf_bool"("js" "jsonb", "key" "text", "def" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_vf_errs_concat"("errs" "jsonb", "new_err" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_vf_errs_concat"("errs" "jsonb", "new_err" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_vf_errs_concat"("errs" "jsonb", "new_err" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_vf_regex_ok"("val" "text", "pattern" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_vf_regex_ok"("val" "text", "pattern" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_vf_regex_ok"("val" "text", "pattern" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_vf_scale_ok"("val" numeric, "max_scale" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_vf_scale_ok"("val" numeric, "max_scale" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_vf_scale_ok"("val" numeric, "max_scale" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_vf_textarr"("js" "jsonb", "key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_vf_textarr"("js" "jsonb", "key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_vf_textarr"("js" "jsonb", "key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."api_tx_create_with_org"("p_org_id" "uuid", "p_tx_type" "text", "p_tx_code" "text", "p_smart_code" "text", "p_source_code" "text", "p_target_code" "text", "p_total_amount" numeric, "p_currency" character, "p_business_context" "jsonb", "p_transaction_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."api_tx_create_with_org"("p_org_id" "uuid", "p_tx_type" "text", "p_tx_code" "text", "p_smart_code" "text", "p_source_code" "text", "p_target_code" "text", "p_total_amount" numeric, "p_currency" character, "p_business_context" "jsonb", "p_transaction_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_tx_create_with_org"("p_org_id" "uuid", "p_tx_type" "text", "p_tx_code" "text", "p_smart_code" "text", "p_source_code" "text", "p_target_code" "text", "p_total_amount" numeric, "p_currency" character, "p_business_context" "jsonb", "p_transaction_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."api_tx_line_set_with_org"("p_org_id" "uuid", "p_tx_code" "text", "p_line_number" integer, "p_line_type" "text", "p_smart_code" "text", "p_entity_code" "text", "p_quantity" numeric, "p_unit_amount" numeric, "p_line_amount" numeric, "p_line_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."api_tx_line_set_with_org"("p_org_id" "uuid", "p_tx_code" "text", "p_line_number" integer, "p_line_type" "text", "p_smart_code" "text", "p_entity_code" "text", "p_quantity" numeric, "p_unit_amount" numeric, "p_line_amount" numeric, "p_line_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_tx_line_set_with_org"("p_org_id" "uuid", "p_tx_code" "text", "p_line_number" integer, "p_line_type" "text", "p_smart_code" "text", "p_entity_code" "text", "p_quantity" numeric, "p_unit_amount" numeric, "p_line_amount" numeric, "p_line_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_user_entity_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_user_entity_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_user_entity_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_actor_non_null"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_actor_non_null"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_actor_non_null"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_subdomain_availability"("p_subdomain" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_subdomain_availability"("p_subdomain" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_subdomain_availability"("p_subdomain" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_add_dynamic_field"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value" "text", "p_field_number" numeric, "p_field_boolean" boolean, "p_field_date" timestamp with time zone, "p_field_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."claude_add_dynamic_field"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value" "text", "p_field_number" numeric, "p_field_boolean" boolean, "p_field_date" timestamp with time zone, "p_field_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_add_dynamic_field"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value" "text", "p_field_number" numeric, "p_field_boolean" boolean, "p_field_date" timestamp with time zone, "p_field_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_check_mvp_completeness"("p_application_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claude_check_mvp_completeness"("p_application_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_check_mvp_completeness"("p_application_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_create_entity"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."claude_create_entity"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_create_entity"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_create_transaction"("p_org_id" "uuid", "p_transaction_type" "text", "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."claude_create_transaction"("p_org_id" "uuid", "p_transaction_type" "text", "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_create_transaction"("p_org_id" "uuid", "p_transaction_type" "text", "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_enhance_application_dna"("p_application_description" "text", "p_target_completeness" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."claude_enhance_application_dna"("p_application_description" "text", "p_target_completeness" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_enhance_application_dna"("p_application_description" "text", "p_target_completeness" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_get_component_dna"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claude_get_component_dna"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_get_component_dna"("p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claude_load_dna_context"("p_context_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claude_load_dna_context"("p_context_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claude_load_dna_context"("p_context_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_org_name" "text", "p_subdomain" "text", "p_owner_id" "uuid", "p_owner_email" "text", "p_owner_name" "text", "p_org_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_org_name" "text", "p_subdomain" "text", "p_owner_id" "uuid", "p_owner_email" "text", "p_owner_name" "text", "p_org_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_org_name" "text", "p_subdomain" "text", "p_owner_id" "uuid", "p_owner_email" "text", "p_owner_name" "text", "p_org_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_test_inventory"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_test_inventory"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_test_inventory"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_org"() TO "service_role";



GRANT ALL ON FUNCTION "public"."doc_number_next"("p_org" "uuid", "p_smart_code" "text", "p_fiscal_year" integer, "p_period_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."doc_number_next"("p_org" "uuid", "p_smart_code" "text", "p_fiscal_year" integer, "p_period_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."doc_number_next"("p_org" "uuid", "p_smart_code" "text", "p_fiscal_year" integer, "p_period_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."doc_series_pick"("p_org" "uuid", "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."doc_series_pick"("p_org" "uuid", "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."doc_series_pick"("p_org" "uuid", "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_txn_type_upper"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_txn_type_upper"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_txn_type_upper"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_book_appointment"("p_org_id" "uuid", "p_customer_id" "uuid", "p_staff_id" "uuid", "p_branch_id" "uuid", "p_service_ids" "uuid"[], "p_start_at" timestamp with time zone, "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_book_appointment"("p_org_id" "uuid", "p_customer_id" "uuid", "p_staff_id" "uuid", "p_branch_id" "uuid", "p_service_ids" "uuid"[], "p_start_at" timestamp with time zone, "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_book_appointment"("p_org_id" "uuid", "p_customer_id" "uuid", "p_staff_id" "uuid", "p_branch_id" "uuid", "p_service_ids" "uuid"[], "p_start_at" timestamp with time zone, "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_complete_appointment"("p_appointment_id" "uuid", "p_payment_method" "text", "p_vat_rate" numeric, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_complete_appointment"("p_appointment_id" "uuid", "p_payment_method" "text", "p_vat_rate" numeric, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_complete_appointment"("p_appointment_id" "uuid", "p_payment_method" "text", "p_vat_rate" numeric, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_create_sample_dashboard_data"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_create_sample_dashboard_data"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_create_sample_dashboard_data"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_daily_sales_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_daily_sales_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_daily_sales_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_daily_sales_report_corrected"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_daily_sales_report_corrected"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_daily_sales_report_corrected"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_discover_salon_data"("p_org_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_discover_salon_data"("p_org_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_discover_salon_data"("p_org_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_dynamic_fields_json"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_dynamic_fields_json"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_dynamic_fields_json"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_dynamic_fields_select"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text", "p_field_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_dynamic_fields_select"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text", "p_field_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_dynamic_fields_select"("org_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text", "p_field_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_entities_list"("org_id" "uuid", "p_entity_type" "text", "p_status" "text", "q" "text", "limit_rows" integer, "offset_rows" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_entities_list"("org_id" "uuid", "p_entity_type" "text", "p_status" "text", "q" "text", "limit_rows" integer, "offset_rows" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_entities_list"("org_id" "uuid", "p_entity_type" "text", "p_status" "text", "q" "text", "limit_rows" integer, "offset_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_entities_with_soh"("org_id" "uuid", "entity_type_filter" "text", "smart_prefixes" "text"[], "branch_entity_id" "uuid", "branch_relationship_type" "text", "limit_rows" integer, "offset_rows" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_entities_with_soh"("org_id" "uuid", "entity_type_filter" "text", "smart_prefixes" "text"[], "branch_entity_id" "uuid", "branch_relationship_type" "text", "limit_rows" integer, "offset_rows" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_entities_with_soh"("org_id" "uuid", "entity_type_filter" "text", "smart_prefixes" "text"[], "branch_entity_id" "uuid", "branch_relationship_type" "text", "limit_rows" integer, "offset_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_entity_get"("org_id" "uuid", "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_entity_get"("org_id" "uuid", "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_entity_get"("org_id" "uuid", "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_finance_sales_summary_for_journal"("org_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_finance_sales_summary_for_journal"("org_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_finance_sales_summary_for_journal"("org_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_appointment_details"("p_appointment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_appointment_details"("p_appointment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_appointment_details"("p_appointment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_default_branch"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_default_branch"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_default_branch"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_walkin_customer"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_walkin_customer"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_walkin_customer"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_inventory_status"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_inventory_status"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_inventory_status"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_inventory_status_bulletproof"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_inventory_status_bulletproof"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_inventory_status_bulletproof"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_inventory_status_simple"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_inventory_status_simple"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_inventory_status_simple"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_monthly_financial_summary"("p_org_id" "uuid", "p_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_monthly_financial_summary"("p_org_id" "uuid", "p_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_monthly_financial_summary"("p_org_id" "uuid", "p_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_doc_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_doc_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_doc_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_scheme_code" "text", "p_branch_id" "uuid", "p_txn_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_scheme_code" "text", "p_branch_id" "uuid", "p_txn_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_next_doc_number"("p_org_id" "uuid", "p_scheme_code" "text", "p_branch_id" "uuid", "p_txn_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_owner_dashboard_kpis"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_owner_dashboard_kpis"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_owner_dashboard_kpis"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_products_with_soh"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_products_with_soh"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_products_with_soh"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_quick_daily_summary"("p_org_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_quick_daily_summary"("p_org_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_quick_daily_summary"("p_org_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_quick_daily_summary_corrected"("p_org_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_quick_daily_summary_corrected"("p_org_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_quick_daily_summary_corrected"("p_org_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_relationships_list"("org_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_relationships_list"("org_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_relationships_list"("org_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_sales_by_day"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_sales_by_day"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_sales_by_day"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_sales_by_service"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_sales_by_service"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_sales_by_service"("org_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_service_performance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_service_performance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_service_performance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_services_with_dd"("org_id" "uuid", "limit_rows" integer, "offset_rows" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_services_with_dd"("org_id" "uuid", "limit_rows" integer, "offset_rows" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_services_with_dd"("org_id" "uuid", "limit_rows" integer, "offset_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_transaction_get"("org_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_transaction_get"("org_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_transaction_get"("org_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_transaction_lines_by_entity"("org_id" "uuid", "p_entity_id" "uuid", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_transaction_lines_by_entity"("org_id" "uuid", "p_entity_id" "uuid", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_transaction_lines_by_entity"("org_id" "uuid", "p_entity_id" "uuid", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_transaction_lines_by_txn"("org_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_transaction_lines_by_txn"("org_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_transaction_lines_by_txn"("org_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_transactions_list"("org_id" "uuid", "p_transaction_type" "text", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_transactions_list"("org_id" "uuid", "p_transaction_type" "text", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_transactions_list"("org_id" "uuid", "p_transaction_type" "text", "p_date_from" "date", "p_date_to" "date", "limit_rows" integer, "offset_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_vat_compliance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_vat_compliance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_vat_compliance_report"("p_org_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_weekly_comparison_report"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_weekly_comparison_report"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_weekly_comparison_report"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_by_subdomain"("p_subdomain" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_by_subdomain"("p_subdomain" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_by_subdomain"("p_subdomain" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_period_close_progress"("p_period_id" "uuid", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_period_close_progress"("p_period_id" "uuid", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_period_close_progress"("p_period_id" "uuid", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organizations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vibe_component_health"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vibe_component_health"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vibe_component_health"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_app_catalog_register_v1"("p_app_code" "text", "p_page_codes" "text"[], "p_actor_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_app_catalog_register_v1"("p_app_code" "text", "p_page_codes" "text"[], "p_actor_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_app_catalog_register_v1"("p_app_code" "text", "p_page_codes" "text"[], "p_actor_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_app_catalog_update_pages_v1"("p_app_code" "text", "p_actor_user" "uuid", "p_add_pages" "text"[], "p_remove_pages" "text"[], "p_rename_map" "jsonb", "p_propagate" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_app_catalog_update_pages_v1"("p_app_code" "text", "p_actor_user" "uuid", "p_add_pages" "text"[], "p_remove_pages" "text"[], "p_rename_map" "jsonb", "p_propagate" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_app_catalog_update_pages_v1"("p_app_code" "text", "p_actor_user" "uuid", "p_add_pages" "text"[], "p_remove_pages" "text"[], "p_rename_map" "jsonb", "p_propagate" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_apps_get_v1"("p_actor_user_id" "uuid", "p_selector" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_apps_list_v1"("p_actor_user_id" "uuid", "p_filters" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_apps_register_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_apps_update_v1"("p_actor_user_id" "uuid", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_assign_membership_v1"("p_user_entity" "uuid", "p_tenant_org" "uuid", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_assign_membership_v1"("p_user_entity" "uuid", "p_tenant_org" "uuid", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_assign_membership_v1"("p_user_entity" "uuid", "p_tenant_org" "uuid", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_audit_operation_v2"("p_organization_id" "uuid", "p_operation_type" "text", "p_operation_details" "jsonb", "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_audit_operation_v2"("p_organization_id" "uuid", "p_operation_type" "text", "p_operation_details" "jsonb", "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_audit_operation_v2"("p_organization_id" "uuid", "p_operation_type" "text", "p_operation_details" "jsonb", "p_smart_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_auth_introspect_v1"("p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_debug_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_debug_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_debug_context"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" "date", "p_field_value_json" "jsonb", "p_smart_code" "text", "p_metadata" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" "date", "p_field_value_json" "jsonb", "p_smart_code" "text", "p_metadata" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" "date", "p_field_value_json" "jsonb", "p_smart_code" "text", "p_metadata" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entities_aggregate_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entities_aggregate_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entities_aggregate_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_entities_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_entities_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entities_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entities_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entities_crud_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entities_crud_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entities_crud_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_entity" "jsonb", "p_dynamic" "jsonb", "p_relationships" "jsonb", "p_options" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) TO "service_role";



GRANT ALL ON TABLE "public"."core_dynamic_data" TO "anon";
GRANT ALL ON TABLE "public"."core_dynamic_data" TO "authenticated";
GRANT ALL ON TABLE "public"."core_dynamic_data" TO "service_role";



GRANT ALL ON TABLE "public"."core_entities" TO "anon";
GRANT ALL ON TABLE "public"."core_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."core_entities" TO "service_role";



GRANT ALL ON TABLE "public"."v_current_dynamic_data" TO "anon";
GRANT ALL ON TABLE "public"."v_current_dynamic_data" TO "authenticated";
GRANT ALL ON TABLE "public"."v_current_dynamic_data" TO "service_role";



GRANT ALL ON TABLE "public"."rpt_entity_profiles" TO "anon";
GRANT ALL ON TABLE "public"."rpt_entity_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."rpt_entity_profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entity_profiles"("p_organization_id" "uuid", "p_entity_type" "text", "p_smartcode_like" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_profiles"("p_organization_id" "uuid", "p_entity_type" "text", "p_smartcode_like" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_profiles"("p_organization_id" "uuid", "p_entity_type" "text", "p_smartcode_like" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entity_read_with_branch_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_status" "text", "p_branch_id" "uuid", "p_relationship_type" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_read_with_branch_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_status" "text", "p_branch_id" "uuid", "p_relationship_type" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_read_with_branch_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_status" "text", "p_branch_id" "uuid", "p_relationship_type" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_finance_dna_v2_setup_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_finance_dna_v2_setup_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_finance_dna_v2_setup_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_gl_validate_balance"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_epsilon" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_gl_validate_balance"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_epsilon" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_gl_validate_balance"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_epsilon" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_idempotency_stamp_entity"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_idempotency_stamp_entity"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_idempotency_stamp_entity"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_idempotency_try_replay_on_entity"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid", "p_entity_id" "uuid", "p_include_dynamic" boolean, "p_dynamic_prefix" "text"[], "p_include_relationships" boolean, "p_include_reverse" boolean, "p_rel_types" "text"[], "p_include_audit" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_idempotency_try_replay_on_entity"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid", "p_entity_id" "uuid", "p_include_dynamic" boolean, "p_dynamic_prefix" "text"[], "p_include_relationships" boolean, "p_include_reverse" boolean, "p_rel_types" "text"[], "p_include_audit" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_idempotency_try_replay_on_entity"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_operation_id" "uuid", "p_entity_id" "uuid", "p_include_dynamic" boolean, "p_dynamic_prefix" "text"[], "p_include_relationships" boolean, "p_include_reverse" boolean, "p_rel_types" "text"[], "p_include_audit" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_invitation_accept_v1"("p_organization_id" "uuid", "p_token_sha256" "text", "p_user_id" "uuid", "p_user_name" "text", "p_role" "text", "p_permissions" "jsonb", "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_invitation_accept_v1"("p_organization_id" "uuid", "p_token_sha256" "text", "p_user_id" "uuid", "p_user_name" "text", "p_role" "text", "p_permissions" "jsonb", "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_invitation_accept_v1"("p_organization_id" "uuid", "p_token_sha256" "text", "p_user_id" "uuid", "p_user_name" "text", "p_role" "text", "p_permissions" "jsonb", "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_invitation_get_v1"("p_token_sha256" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_invitation_get_v1"("p_token_sha256" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_invitation_get_v1"("p_token_sha256" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_invitation_resend_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_invitation_resend_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_invitation_resend_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_invitation_revoke_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_invitation_revoke_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_invitation_revoke_v1"("p_organization_id" "uuid", "p_invitation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_invitations_list_v1"("p_organization_id" "uuid", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_invitations_list_v1"("p_organization_id" "uuid", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_invitations_list_v1"("p_organization_id" "uuid", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_is_demo_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_is_demo_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_is_demo_session"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_line_credit_amount"("p_side" "text", "p_line_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_line_credit_amount"("p_side" "text", "p_line_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_line_credit_amount"("p_side" "text", "p_line_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_line_debit_amount"("p_side" "text", "p_line_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_line_debit_amount"("p_side" "text", "p_line_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_line_debit_amount"("p_side" "text", "p_line_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_line_side"("p_smart_code" "text", "p_line_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_line_side"("p_smart_code" "text", "p_line_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_line_side"("p_smart_code" "text", "p_line_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_list_branches_v1"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_list_branches_v1"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_list_branches_v1"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_norm_thresholds"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_norm_thresholds"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_norm_thresholds"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_normalize_entity_biu"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_normalize_entity_biu"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_normalize_entity_biu"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_normalize_text"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_normalize_text"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_normalize_text"("input_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_supabase_user_id" "uuid", "p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_supabase_user_id" "uuid", "p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_supabase_user_id" "uuid", "p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_supabase_user_id" "uuid", "p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_platform_org" "uuid", "p_tenant_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_platform_org" "uuid", "p_tenant_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_onboard_user_v1"("p_platform_org" "uuid", "p_tenant_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_role" "text", "p_system_actor" "uuid", "p_version" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_org_custom_page_upsert_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_app_code" "text", "p_page_code" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_org_custom_page_upsert_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_app_code" "text", "p_page_code" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_org_custom_page_upsert_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_app_code" "text", "p_page_code" "text", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone, "p_subscription" "jsonb", "p_config" "jsonb", "p_is_active" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone, "p_subscription" "jsonb", "p_config" "jsonb", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone, "p_subscription" "jsonb", "p_config" "jsonb", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_org_link_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_installed_at" timestamp with time zone, "p_subscription" "jsonb", "p_config" "jsonb", "p_is_active" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_org_list_apps_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_filters" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_org_list_apps_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_org_list_apps_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_org_list_apps_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_filters" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_org_set_default_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone, "p_hard_delete" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone, "p_hard_delete" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone, "p_hard_delete" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_org_unlink_app_v1"("p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_app_code" "text", "p_uninstalled_at" timestamp with time zone, "p_hard_delete" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_organizations_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_payload" "jsonb", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_outbox_enqueue_v1"("p_organization_id" "uuid", "p_topic" "text", "p_event" "jsonb", "p_actor_user_id" "uuid", "p_idem_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_outbox_enqueue_v1"("p_organization_id" "uuid", "p_topic" "text", "p_event" "jsonb", "p_actor_user_id" "uuid", "p_idem_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_outbox_enqueue_v1"("p_organization_id" "uuid", "p_topic" "text", "p_event" "jsonb", "p_actor_user_id" "uuid", "p_idem_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_rate_limit_invite_guard_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_max_per_hour" integer, "p_max_per_day" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_rate_limit_invite_guard_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_max_per_hour" integer, "p_max_per_day" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_rate_limit_invite_guard_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_max_per_hour" integer, "p_max_per_day" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_refresh_rpt_entity_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_refresh_rpt_entity_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_refresh_rpt_entity_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_regex_smartcode"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_regex_smartcode"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_regex_smartcode"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_link_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_to_entity_id" "uuid", "p_from_entity_ids" "uuid"[], "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_link_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_to_entity_id" "uuid", "p_from_entity_ids" "uuid"[], "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_link_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_to_entity_id" "uuid", "p_from_entity_ids" "uuid"[], "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_move_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_branch_id" "uuid", "p_to_branch_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_move_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_branch_id" "uuid", "p_to_branch_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_move_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_branch_id" "uuid", "p_to_branch_id" "uuid", "p_entity_ids" "uuid"[], "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_unlink_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_entity_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_unlink_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_entity_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_bulk_unlink_v1"("p_organization_id" "uuid", "p_relationship_type" "text", "p_from_entity_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_create_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_smart_code" character varying, "p_relationship_data" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_create_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_smart_code" character varying, "p_relationship_data" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_create_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_smart_code" character varying, "p_relationship_data" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_delete_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid", "p_expiration_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_delete_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid", "p_expiration_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_delete_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid", "p_expiration_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_query_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_side" "text", "p_relationship_type" "text", "p_active_only" boolean, "p_effective_from" timestamp with time zone, "p_effective_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_query_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_side" "text", "p_relationship_type" "text", "p_active_only" boolean, "p_effective_from" timestamp with time zone, "p_effective_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_query_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_side" "text", "p_relationship_type" "text", "p_active_only" boolean, "p_effective_from" timestamp with time zone, "p_effective_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_read_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_read_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_read_v1"("p_organization_id" "uuid", "p_relationship_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_upsert_batch_v1"("p_organization_id" "uuid", "p_rows" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_upsert_batch_v1"("p_organization_id" "uuid", "p_rows" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_upsert_batch_v1"("p_organization_id" "uuid", "p_rows" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_relationship_upsert_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_smart_code" character varying, "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_relationship_data" "jsonb", "p_smart_code_status" "text", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_relationship_upsert_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_smart_code" character varying, "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_relationship_data" "jsonb", "p_smart_code_status" "text", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_relationship_upsert_v1"("p_organization_id" "uuid", "p_from_entity_id" "uuid", "p_to_entity_id" "uuid", "p_relationship_type" "text", "p_smart_code" character varying, "p_relationship_direction" "text", "p_relationship_strength" numeric, "p_relationship_data" "jsonb", "p_smart_code_status" "text", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_business_logic" "jsonb", "p_validation_rules" "jsonb", "p_is_active" boolean, "p_effective_date" timestamp with time zone, "p_expiration_date" timestamp with time zone, "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_require_has_canonical_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_require_has_canonical_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_require_has_canonical_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_required_ifrs_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_required_ifrs_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_required_ifrs_keys"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_explicit" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_explicit" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_explicit" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_explicit" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_map" "jsonb", "p_explicit" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_map" "jsonb", "p_explicit" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_map" "jsonb", "p_explicit" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_resolve_relationship_smartcode"("p_entity_type" "text", "p_rel_type" "text", "p_map" "jsonb", "p_explicit" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_runtime_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_runtime_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_runtime_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_set_organization_context_v2"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_set_organization_context_v2"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_set_organization_context_v2"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_smart_code_normalizer"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_smart_code_normalizer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_smart_code_normalizer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_smartcode_regex"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_smartcode_regex"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_smartcode_regex"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_transactions_crud_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_payload" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_transactions_crud_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_payload" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_transactions_crud_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_action" "text", "p_payload" "jsonb", "p_options" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_transactions_post_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_header" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_transactions_post_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_header" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_transactions_post_v2"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_header" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_transactions_read_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_smart_code" "text", "p_status" "text", "p_after_id" "uuid", "p_limit" integer, "p_include_lines" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_transactions_read_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_smart_code" "text", "p_status" "text", "p_after_id" "uuid", "p_limit" integer, "p_include_lines" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_transactions_read_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_smart_code" "text", "p_status" "text", "p_after_id" "uuid", "p_limit" integer, "p_include_lines" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_transactions_update_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_transaction_id" "uuid", "p_patch_header" "jsonb", "p_patch_lines" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_transactions_update_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_transaction_id" "uuid", "p_patch_header" "jsonb", "p_patch_lines" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_transactions_update_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_transaction_id" "uuid", "p_patch_header" "jsonb", "p_patch_lines" "jsonb", "p_options" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_transaction" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_transaction" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_crud_v1"("p_action" "text", "p_actor_user_id" "uuid", "p_organization_id" "uuid", "p_transaction" "jsonb", "p_lines" "jsonb", "p_options" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean, "p_include_deleted" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean, "p_include_deleted" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean, "p_include_deleted" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean, "p_include_deleted" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_reverse_v1"("p_org_id" "uuid", "p_original_txn_id" "uuid", "p_reason" "text", "p_reversal_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_reverse_v1"("p_org_id" "uuid", "p_original_txn_id" "uuid", "p_reason" "text", "p_reversal_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_reverse_v1"("p_org_id" "uuid", "p_original_txn_id" "uuid", "p_reason" "text", "p_reversal_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_reverse_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reversal_date" timestamp with time zone, "p_reason" "text", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_reverse_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reversal_date" timestamp with time zone, "p_reason" "text", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_reverse_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reversal_date" timestamp with time zone, "p_reason" "text", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_update_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_patch" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_update_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_patch" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_update_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_patch" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_validate_v1"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_validate_v1"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_validate_v1"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_void_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reason" "text", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_void_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reason" "text", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_void_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid", "p_reason" "text", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_upsert_user_entity_v1"("p_platform_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_system_actor" "uuid", "p_version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_upsert_user_entity_v1"("p_platform_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_system_actor" "uuid", "p_version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_upsert_user_entity_v1"("p_platform_org" "uuid", "p_supabase_uid" "uuid", "p_email" "text", "p_full_name" "text", "p_system_actor" "uuid", "p_version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_user_orgs_list_v1"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_user_orgs_list_v1"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_user_orgs_list_v1"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_user_read_v1"("p_organization_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_user_read_v1"("p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_user_read_v1"("p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_user_remove_from_org_v1"("p_organization_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_user_remove_from_org_v1"("p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_user_remove_from_org_v1"("p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_user_switch_org_v1"("p_user_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_user_switch_org_v1"("p_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_user_switch_org_v1"("p_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_user_update_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_role" "text", "p_permissions" "jsonb", "p_department" "text", "p_reports_to" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_user_update_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_role" "text", "p_permissions" "jsonb", "p_department" "text", "p_reports_to" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_user_update_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_role" "text", "p_permissions" "jsonb", "p_department" "text", "p_reports_to" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_users_list_v1"("p_organization_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_users_list_v1"("p_organization_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_users_list_v1"("p_organization_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_coa"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_coa"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_coa"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_coa_smartcode_all"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_coa_smartcode_all"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_coa_smartcode_all"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_journals"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_journals"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_journals"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_organization_access"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_organization_access"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_organization_access"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."jwt_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."jwt_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jwt_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_existing_user"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_existing_user"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_existing_user"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_user_identity_v1"("p_auth_uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_user_identity_v1"("p_auth_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_user_identity_v1"("p_auth_uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_audit_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_audit_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_audit_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."smart_is_negative_txn_static"("p" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."smart_is_negative_txn_static"("p" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."smart_is_negative_txn_static"("p" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_entity_fields_soft_validate"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_entity_fields_soft_validate"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_entity_fields_soft_validate"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_tl_calc_amounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_tl_calc_amounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_tl_calc_amounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_tl_enforce_header_currency"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_tl_enforce_header_currency"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_tl_enforce_header_currency"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_txn_fx_on_post_any"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_txn_fx_on_post_any"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_txn_fx_on_post_any"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_txn_rollup_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_txn_rollup_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_txn_rollup_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_org_access"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_org_access"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_org_access"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ut_smart_code_normalize_biud"() TO "anon";
GRANT ALL ON FUNCTION "public"."ut_smart_code_normalize_biud"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ut_smart_code_normalize_biud"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_actor_membership"("p_actor_user_id" "uuid", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_actor_membership"("p_actor_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_actor_membership"("p_actor_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_finance_dna_smart_code"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_finance_dna_smart_code"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_finance_dna_smart_code"("p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_smart_code"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_smart_code"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_smart_code"("p_smart_code" "text") TO "service_role";



GRANT ALL ON TABLE "public"."core_organizations" TO "anon";
GRANT ALL ON TABLE "public"."core_organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."core_organizations" TO "service_role";



GRANT ALL ON TABLE "public"."core_relationships" TO "anon";
GRANT ALL ON TABLE "public"."core_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."core_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."entity_approval_actions" TO "anon";
GRANT ALL ON TABLE "public"."entity_approval_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_approval_actions" TO "service_role";



GRANT ALL ON TABLE "public"."entity_approval_escalations" TO "anon";
GRANT ALL ON TABLE "public"."entity_approval_escalations" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_approval_escalations" TO "service_role";



GRANT ALL ON TABLE "public"."entity_approval_requests" TO "anon";
GRANT ALL ON TABLE "public"."entity_approval_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_approval_requests" TO "service_role";



GRANT ALL ON TABLE "public"."entity_business_rules" TO "anon";
GRANT ALL ON TABLE "public"."entity_business_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_business_rules" TO "service_role";



GRANT ALL ON TABLE "public"."entity_workflow_audit" TO "anon";
GRANT ALL ON TABLE "public"."entity_workflow_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_workflow_audit" TO "service_role";



GRANT ALL ON TABLE "public"."entity_workflow_configs" TO "anon";
GRANT ALL ON TABLE "public"."entity_workflow_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_workflow_configs" TO "service_role";



GRANT ALL ON TABLE "public"."entity_workflow_notifications" TO "anon";
GRANT ALL ON TABLE "public"."entity_workflow_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_workflow_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."hera_audit_list_v1_view" TO "anon";
GRANT ALL ON TABLE "public"."hera_audit_list_v1_view" TO "authenticated";
GRANT ALL ON TABLE "public"."hera_audit_list_v1_view" TO "service_role";



GRANT ALL ON TABLE "public"."hera_onboarding_recent_v1" TO "anon";
GRANT ALL ON TABLE "public"."hera_onboarding_recent_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."hera_onboarding_recent_v1" TO "service_role";



GRANT ALL ON TABLE "public"."hera_user_orgs_list_v1_view" TO "anon";
GRANT ALL ON TABLE "public"."hera_user_orgs_list_v1_view" TO "authenticated";
GRANT ALL ON TABLE "public"."hera_user_orgs_list_v1_view" TO "service_role";



GRANT ALL ON TABLE "public"."hera_users_list_v1_view" TO "anon";
GRANT ALL ON TABLE "public"."hera_users_list_v1_view" TO "authenticated";
GRANT ALL ON TABLE "public"."hera_users_list_v1_view" TO "service_role";



GRANT ALL ON TABLE "public"."universal_transaction_lines" TO "anon";
GRANT ALL ON TABLE "public"."universal_transaction_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."universal_transaction_lines" TO "service_role";



GRANT ALL ON TABLE "public"."universal_transactions" TO "anon";
GRANT ALL ON TABLE "public"."universal_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."universal_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."v_hera_accounts" TO "anon";
GRANT ALL ON TABLE "public"."v_hera_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."v_hera_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."v_period_close_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_period_close_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_period_close_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."v_universal_transaction_lines_drcr" TO "anon";
GRANT ALL ON TABLE "public"."v_universal_transaction_lines_drcr" TO "authenticated";
GRANT ALL ON TABLE "public"."v_universal_transaction_lines_drcr" TO "service_role";



GRANT ALL ON TABLE "public"."v_universal_transaction_lines_with_base" TO "anon";
GRANT ALL ON TABLE "public"."v_universal_transaction_lines_with_base" TO "authenticated";
GRANT ALL ON TABLE "public"."v_universal_transaction_lines_with_base" TO "service_role";



GRANT ALL ON TABLE "public"."v_user_entity_by_auth" TO "anon";
GRANT ALL ON TABLE "public"."v_user_entity_by_auth" TO "authenticated";
GRANT ALL ON TABLE "public"."v_user_entity_by_auth" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
