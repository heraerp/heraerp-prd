

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


CREATE SCHEMA IF NOT EXISTS "hera";


ALTER SCHEMA "hera" OWNER TO "postgres";


COMMENT ON SCHEMA "hera" IS 'HERA helpers and security utilities';



COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE DOMAIN "public"."smart_code_type" AS character varying(100)
	CONSTRAINT "smart_code_type_check" CHECK ((("length"((VALUE)::"text") >= 5) AND ("length"((VALUE)::"text") <= 100)));


ALTER DOMAIN "public"."smart_code_type" OWNER TO "postgres";


CREATE DOMAIN "public"."status_type" AS "text"
	CONSTRAINT "status_type_check" CHECK ((VALUE = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'pending'::"text", 'draft'::"text", 'archived'::"text"])));


ALTER DOMAIN "public"."status_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "hera"."bootstrap_user_first_login_v1"("p_auth_uid" "uuid", "p_email" "text", "p_display_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'hera'
    AS $$
declare
  v_user_entity uuid;
  v_org_id uuid;
  v_exists boolean;
begin
  -- already linked?
  select exists (
    select 1 from public.core_dynamic_data
    where field_name='auth_user_id' and field_value_text=p_auth_uid::text
  ) into v_exists;

  if v_exists then
    select e.organization_id into v_org_id
    from public.core_dynamic_data dd
    join public.core_entities e on e.entity_id = dd.entity_id
    where dd.field_name='auth_user_id' and dd.field_value_text=p_auth_uid::text
    order by dd.created_at asc
    limit 1;

    return jsonb_build_object('created', false, 'organization_id', v_org_id);
  end if;

  -- create org
  v_org_id := gen_random_uuid();
  insert into public.core_organizations(organization_id, smart_code, label, created_at)
  values (v_org_id, 'HERA.ORG.'||substring(v_org_id::text,1,8), coalesce(p_display_name, p_email), now());

  -- create USER entity
  v_user_entity := gen_random_uuid();
  insert into public.core_entities(entity_id, organization_id, entity_type, smart_code, label, created_at)
  values (v_user_entity, v_org_id, 'USER', 'HERA.USER.'||substring(v_user_entity::text,1,8), coalesce(p_display_name, p_email), now());

  -- dynamic_data: link auth uid (field_value_text)
  insert into public.core_dynamic_data(
    id, organization_id, entity_id, field_name, field_type, field_value_text, created_at
  ) values (
    gen_random_uuid(), v_org_id, v_user_entity, 'auth_user_id', 'text', p_auth_uid::text, now()
  );

  -- dynamic_data: initial role (ORG_ADMIN)
  insert into public.core_dynamic_data(
    id, organization_id, entity_id, field_name, field_type, field_value_text, created_at
  ) values (
    gen_random_uuid(), v_org_id, v_user_entity, 'role', 'text', 'ORG_ADMIN', now()
  );

  -- membership in your relationships table (unchanged)
  insert into public.core_relationships(relationship_id, organization_id, entity_from, rel_type, entity_to, created_at)
  values (gen_random_uuid(), v_org_id, v_user_entity, 'MEMBER_OF', v_org_id, now());

  -- audit
  perform hera.audit_emit_v1(v_org_id, 'HERA.SEC.AUTH.SIGNUP.v1',
    jsonb_build_object('user_entity', v_user_entity, 'email', p_email));

  return jsonb_build_object('created', true, 'organization_id', v_org_id);
end;
$$;


ALTER FUNCTION "hera"."bootstrap_user_first_login_v1"("p_auth_uid" "uuid", "p_email" "text", "p_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "hera"."current_user_entity_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select dd.entity_id
  from public.core_dynamic_data dd
  where dd.field_name = 'auth_user_id'
    and dd.field_value_text = auth.uid()::text
  order by dd.created_at asc
  limit 1
$$;


ALTER FUNCTION "hera"."current_user_entity_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "hera"."has_role"("p_user_entity" "uuid", VARIADIC "p_roles" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  with roles as (
    select dd.field_value_text as role
    from public.core_dynamic_data dd
    where dd.entity_id = p_user_entity
      and dd.field_name = 'role'
      and dd.field_value_text is not null
  )
  select exists (
    select 1 from roles where role = any(p_roles)
  )
$$;


ALTER FUNCTION "hera"."has_role"("p_user_entity" "uuid", VARIADIC "p_roles" "text"[]) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."_dyn_fields_table"() RETURNS "regclass"
    LANGUAGE "sql" STABLE
    AS $$ SELECT 'public.core_dynamic_data'::regclass $$;


ALTER FUNCTION "public"."_dyn_fields_table"() OWNER TO "postgres";


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
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_item JSONB;
  v_name TEXT;
  v_type TEXT;
  v_id UUID;
  v_results JSONB := '[]'::jsonb;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'hera_dynamic_data_batch_v1: organization_id and entity_id are required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'hera_dynamic_data_batch_v1: p_items must be a JSON array';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_name := (v_item->>'field_name');
    v_type := (v_item->>'field_type');

    IF v_name IS NULL THEN
      RAISE EXCEPTION 'Dynamic data item missing field_name';
    END IF;

    -- Try update
    UPDATE core_dynamic_data SET
      field_type = COALESCE(v_type, field_type),
      field_value_text = v_item->>'field_value_text',
      field_value_number = NULLIF((v_item->>'field_value_number'), '')::numeric,
      field_value_boolean = NULLIF((v_item->>'field_value_boolean'), '')::boolean,
      field_value_date = NULLIF((v_item->>'field_value_date'), '')::timestamptz,
      field_value_json = COALESCE(v_item->'field_value_json', field_value_json),
      smart_code = COALESCE(v_item->>'smart_code', smart_code),
      updated_at = now(),
      updated_by = p_actor_user_id,
      version = version + 1
    WHERE organization_id = p_organization_id
      AND entity_id = p_entity_id
      AND field_name = v_name
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      INSERT INTO core_dynamic_data(
        organization_id, entity_id, field_name, field_type,
        field_value_text, field_value_number, field_value_boolean, field_value_date,
        field_value_json, smart_code, created_by, updated_by
      )
      VALUES(
        p_organization_id, p_entity_id, v_name, v_type,
        v_item->>'field_value_text',
        NULLIF((v_item->>'field_value_number'), '')::numeric,
        NULLIF((v_item->>'field_value_boolean'), '')::boolean,
        NULLIF((v_item->>'field_value_date'), '')::timestamptz,
        v_item->'field_value_json',
        v_item->>'smart_code',
        p_actor_user_id, p_actor_user_id
      )
      RETURNING id INTO v_id;

      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'field_name', v_name, 'operation', 'created', 'id', v_id
      ));
    ELSE
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'field_name', v_name, 'operation', 'updated', 'id', v_id
      ));
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'results', v_results);
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_deleted INT := 0;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'hera_dynamic_data_delete_v1: organization_id and entity_id are required';
  END IF;

  DELETE FROM core_dynamic_data
  WHERE organization_id = p_organization_id
    AND entity_id = p_entity_id
    AND (p_field_name IS NULL OR field_name = p_field_name);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'deleted', v_deleted);
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 500, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_rows JSONB;
  v_total INT;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'hera_dynamic_data_get_v1: organization_id and entity_id are required';
  END IF;

  WITH dd AS (
    SELECT *
    FROM core_dynamic_data
    WHERE organization_id = p_organization_id
      AND entity_id = p_entity_id
      AND (p_field_name IS NULL OR field_name = p_field_name)
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'field_name', field_name,
      'field_type', field_type,
      'field_value_text', field_value_text,
      'field_value_number', field_value_number,
      'field_value_boolean', field_value_boolean,
      'field_value_date', field_value_date,
      'field_value_json', field_value_json,
      'smart_code', smart_code,
      'created_at', created_at,
      'updated_at', updated_at,
      'version', version
    )
  ) INTO v_rows
  FROM dd;

  SELECT COUNT(*)::int INTO v_total
  FROM core_dynamic_data
  WHERE organization_id = p_organization_id
    AND entity_id = p_entity_id
    AND (p_field_name IS NULL OR field_name = p_field_name);

  RETURN jsonb_build_object(
    'success', true,
    'data', COALESCE(v_rows, '[]'::jsonb),
    'metadata', jsonb_build_object(
      'total', v_total,
      'limit', p_limit,
      'offset', p_offset,
      'has_more', (v_total > p_offset + p_limit)
    )
  );
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text" DEFAULT NULL::"text", "p_field_value_number" numeric DEFAULT NULL::numeric, "p_field_value_boolean" boolean DEFAULT NULL::boolean, "p_field_value_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_field_value_json" "jsonb" DEFAULT NULL::"jsonb", "p_smart_code" "text" DEFAULT NULL::"text", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid", "p_validation_status" "text" DEFAULT NULL::"text", "p_validation_rules" "jsonb" DEFAULT NULL::"jsonb", "p_field_order" integer DEFAULT NULL::integer, "p_is_required" boolean DEFAULT NULL::boolean, "p_is_searchable" boolean DEFAULT NULL::boolean, "p_is_system_field" boolean DEFAULT NULL::boolean, "p_ai_confidence" numeric DEFAULT NULL::numeric, "p_ai_insights" "jsonb" DEFAULT NULL::"jsonb", "p_ai_enhanced_value" "text" DEFAULT NULL::"text", "p_smart_code_status" "text" DEFAULT NULL::"text", "p_field_value_file_url" "text" DEFAULT NULL::"text", "p_calculated_value" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_existing_id uuid;
  v_result_id uuid;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: organization_id is required';
  END IF;
  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: entity_id is required';
  END IF;
  IF p_field_name IS NULL THEN
    RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: field_name is required';
  END IF;
  IF p_smart_code IS NULL THEN
    RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: smart_code is required';
  END IF;

  SELECT id
    INTO v_existing_id
  FROM core_dynamic_data
  WHERE organization_id = p_organization_id
    AND entity_id       = p_entity_id
    AND field_name      = p_field_name;

  IF v_existing_id IS NOT NULL THEN
    UPDATE core_dynamic_data SET
      field_type           = COALESCE(p_field_type, field_type),
      field_value_text     = p_field_value_text,
      field_value_number   = p_field_value_number,
      field_value_boolean  = p_field_value_boolean,
      field_value_date     = p_field_value_date,
      field_value_json     = p_field_value_json,
      field_value_file_url = COALESCE(p_field_value_file_url, field_value_file_url),
      calculated_value     = COALESCE(p_calculated_value, calculated_value),
      smart_code           = COALESCE(p_smart_code, smart_code),
      smart_code_status    = COALESCE(p_smart_code_status, smart_code_status),
      validation_status    = COALESCE(p_validation_status, validation_status),
      validation_rules     = COALESCE(p_validation_rules, validation_rules),
      field_order          = COALESCE(p_field_order, field_order),
      is_required          = COALESCE(p_is_required, is_required),
      is_searchable        = COALESCE(p_is_searchable, is_searchable),
      is_system_field      = COALESCE(p_is_system_field, is_system_field),
      ai_confidence        = COALESCE(p_ai_confidence, ai_confidence),
      ai_insights          = COALESCE(p_ai_insights, ai_insights),
      ai_enhanced_value    = COALESCE(p_ai_enhanced_value, ai_enhanced_value),
      updated_at           = NOW(),
      updated_by           = p_actor_user_id,
      version              = version + 1
    WHERE id = v_existing_id;

    v_result_id := v_existing_id;

  ELSE
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type,
      field_value_text, field_value_number, field_value_boolean,
      field_value_date, field_value_json, field_value_file_url, calculated_value,
      smart_code, smart_code_status,
      validation_status, validation_rules,
      field_order, is_required, is_searchable, is_system_field,
      ai_confidence, ai_insights, ai_enhanced_value,
      created_by, updated_by
    ) VALUES (
      p_organization_id, p_entity_id, p_field_name, p_field_type,
      p_field_value_text, p_field_value_number, p_field_value_boolean,
      p_field_value_date, p_field_value_json, p_field_value_file_url, p_calculated_value,
      p_smart_code, COALESCE(p_smart_code_status, 'DRAFT'),
      p_validation_status, p_validation_rules,
      COALESCE(p_field_order, 1), COALESCE(p_is_required, FALSE),
      COALESCE(p_is_searchable, TRUE), COALESCE(p_is_system_field, FALSE),
      p_ai_confidence, p_ai_insights, p_ai_enhanced_value,
      p_actor_user_id, p_actor_user_id
    ) RETURNING id INTO v_result_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'data', jsonb_build_object(
      'id', v_result_id,
      'operation', CASE WHEN v_existing_id IS NOT NULL THEN 'updated' ELSE 'created' END
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'HERA_DYNAMIC_DATA_SET_ERROR: % - %', SQLERRM, SQLSTATE;
  RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" timestamp with time zone, "p_field_value_json" "jsonb", "p_smart_code" "text", "p_actor_user_id" "uuid", "p_validation_status" "text", "p_validation_rules" "jsonb", "p_field_order" integer, "p_is_required" boolean, "p_is_searchable" boolean, "p_is_system_field" boolean, "p_ai_confidence" numeric, "p_ai_insights" "jsonb", "p_ai_enhanced_value" "text", "p_smart_code_status" "text", "p_field_value_file_url" "text", "p_calculated_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean DEFAULT true, "p_cascade_relationships" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_exists UUID;
  v_dd_deleted INT := 0;
  v_rel_deleted INT := 0;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'hera_entity_delete_v1: organization_id and entity_id are required';
  END IF;

  SELECT id INTO v_exists
  FROM core_entities
  WHERE id = p_entity_id AND organization_id = p_organization_id;

  IF v_exists IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entity not found');
  END IF;

  IF p_cascade_dynamic_data THEN
    DELETE FROM core_dynamic_data
    WHERE organization_id = p_organization_id
      AND entity_id = p_entity_id;
    GET DIAGNOSTICS v_dd_deleted = ROW_COUNT;
  END IF;

  IF p_cascade_relationships THEN
    DELETE FROM core_relationships
    WHERE organization_id = p_organization_id
      AND (from_entity_id = p_entity_id OR to_entity_id = p_entity_id);
    GET DIAGNOSTICS v_rel_deleted = ROW_COUNT;
  END IF;

  DELETE FROM core_entities
  WHERE id = p_entity_id AND organization_id = p_organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'entity_id', p_entity_id,
      'dynamic_data_deleted', v_dd_deleted,
      'relationships_deleted', v_rel_deleted
    )
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
    "version" integer DEFAULT 1
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
BEGIN
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_READ: organization_id is required';
    END IF;

    -- ------------ SINGLE ENTITY ------------
    IF p_entity_id IS NOT NULL THEN
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
                            'field_value_file_url', dd.field_value_file_url,
                            'calculated_value', dd.calculated_value,
                            'smart_code', dd.smart_code,
                            'smart_code_status', dd.smart_code_status,
                            'ai_confidence', dd.ai_confidence,
                            'ai_enhanced_value', dd.ai_enhanced_value,
                            'ai_insights', dd.ai_insights,
                            'validation_rules', dd.validation_rules,
                            'validation_status', dd.validation_status,
                            'field_order', dd.field_order,
                            'is_searchable', dd.is_searchable,
                            'is_required', dd.is_required,
                            'is_system_field', dd.is_system_field,
                            'created_at', dd.created_at,
                            'updated_at', dd.updated_at,
                            'version', dd.version
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
            RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found', p_entity_id;
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_result,
            'metadata', jsonb_build_object(
                'operation', 'read_single',
                'entity_id', p_entity_id
            )
        );
    END IF;

    -- ------------ MULTIPLE ENTITIES ------------
    WITH filtered_entities AS (
        SELECT
            e.id, e.organization_id, e.entity_type, e.entity_name,
            e.entity_code, e.entity_description, e.smart_code, e.smart_code_status,
            e.status, e.tags, e.metadata, e.business_rules,
            e.ai_confidence, e.ai_classification, e.ai_insights,
            e.parent_entity_id, e.created_at, e.updated_at,
            e.created_by, e.updated_by, e.version
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
          AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
          AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
          AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
          AND (p_status IS NULL OR e.status = p_status)
        ORDER BY e.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
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
                            'field_value_file_url', dd.field_value_file_url,
                            'calculated_value', dd.calculated_value,
                            'smart_code', dd.smart_code,
                            'smart_code_status', dd.smart_code_status,
                            'ai_confidence', dd.ai_confidence,
                            'ai_enhanced_value', dd.ai_enhanced_value,
                            'ai_insights', dd.ai_insights,
                            'validation_rules', dd.validation_rules,
                            'validation_status', dd.validation_status,
                            'field_order', dd.field_order,
                            'is_searchable', dd.is_searchable,
                            'is_required', dd.is_required,
                            'is_system_field', dd.is_system_field,
                            'created_at', dd.created_at,
                            'updated_at', dd.updated_at,
                            'version', dd.version
                        )
                    )
                    FROM core_dynamic_data dd
                    WHERE dd.entity_id = fe.id
                      AND dd.organization_id = p_organization_id
                )
                ELSE NULL
            END
        )
    ) INTO v_entities
    FROM filtered_entities fe;

    SELECT COUNT(*)::INTEGER INTO v_total_count
    FROM core_entities e
    WHERE e.organization_id = p_organization_id
      AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
      AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
      AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
      AND (p_status IS NULL OR e.status = p_status);

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_entities, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'operation', 'read_multiple',
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset,
            'has_more', (v_total_count > p_offset + p_limit)
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_ENTITY_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_entity_read_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_entity_type" "text", "p_entity_code" "text", "p_smart_code" "text", "p_status" "text", "p_include_relationships" boolean, "p_include_dynamic_data" boolean, "p_limit" integer, "p_offset" integer) IS 'HERA Universal Entity Read Function v1 - Fixed for actual schema';



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



CREATE OR REPLACE FUNCTION "public"."hera_entity_recover_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_set_status" "text" DEFAULT 'active'::"text", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_exists UUID;
  v_old_status TEXT;
BEGIN
  IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'hera_entity_recover_v1: organization_id and entity_id are required';
  END IF;

  SELECT id INTO v_exists
  FROM core_entities
  WHERE id = p_entity_id AND organization_id = p_organization_id;

  IF v_exists IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entity not found (hard-deleted cannot be recovered)');
  END IF;

  SELECT status INTO v_old_status
  FROM core_entities
  WHERE id = p_entity_id;

  UPDATE core_entities
     SET status     = COALESCE(p_set_status, status),
         updated_at = now(),
         updated_by = p_actor_user_id,
         version    = version + 1
   WHERE id = p_entity_id AND organization_id = p_organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'entity_id', p_entity_id,
      'old_status', v_old_status,
      'new_status', p_set_status
    )
  );
END;
$$;


ALTER FUNCTION "public"."hera_entity_recover_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_set_status" "text", "p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_entity_code" "text" DEFAULT NULL::"text", "p_entity_description" "text" DEFAULT NULL::"text", "p_parent_entity_id" "uuid" DEFAULT NULL::"uuid", "p_status" "text" DEFAULT NULL::"text", "p_tags" "text"[] DEFAULT NULL::"text"[], "p_smart_code_status" "text" DEFAULT NULL::"text", "p_business_rules" "jsonb" DEFAULT NULL::"jsonb", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_ai_confidence" numeric DEFAULT NULL::numeric, "p_ai_classification" "text" DEFAULT NULL::"text", "p_ai_insights" "jsonb" DEFAULT NULL::"jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_entity_id UUID;
  v_existing_id UUID := NULL;  -- <— use a UUID instead of a record
BEGIN
  -- Validate required fields for new rows
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'HERA_ENTITY_UPSERT: organization_id is required';
  END IF;

  IF p_entity_id IS NULL AND (p_entity_type IS NULL OR p_entity_name IS NULL OR p_smart_code IS NULL) THEN
    RAISE EXCEPTION 'HERA_ENTITY_UPSERT: entity_type, entity_name, and smart_code are required for new entities';
  END IF;

  -- Look up existing by id or code (within org)
  IF p_entity_id IS NOT NULL THEN
    SELECT id
      INTO v_existing_id
    FROM core_entities
    WHERE id = p_entity_id
      AND organization_id = p_organization_id;

    IF v_existing_id IS NULL THEN
      RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found in organization %', p_entity_id, p_organization_id;
    END IF;

  ELSIF p_entity_code IS NOT NULL THEN
    SELECT id
      INTO v_existing_id
    FROM core_entities
    WHERE entity_code = p_entity_code
      AND organization_id = p_organization_id;
    -- note: if not found, v_existing_id remains NULL → will INSERT
  END IF;

  -- Perform upsert
  IF v_existing_id IS NOT NULL THEN
    UPDATE core_entities SET
      entity_type        = COALESCE(p_entity_type, entity_type),
      entity_name        = COALESCE(p_entity_name, entity_name),
      entity_code        = COALESCE(p_entity_code, entity_code),
      entity_description = COALESCE(p_entity_description, entity_description),
      smart_code         = COALESCE(p_smart_code, smart_code),
      status             = COALESCE(p_status, status),
      tags               = COALESCE(p_tags, tags),
      metadata           = COALESCE(p_metadata, metadata),
      business_rules     = COALESCE(p_business_rules, business_rules),
      ai_confidence      = COALESCE(p_ai_confidence, ai_confidence),
      ai_classification  = COALESCE(p_ai_classification, ai_classification),
      ai_insights        = COALESCE(p_ai_insights, ai_insights),
      parent_entity_id   = COALESCE(p_parent_entity_id, parent_entity_id),
      smart_code_status  = COALESCE(p_smart_code_status, smart_code_status),
      updated_at         = NOW(),
      updated_by         = p_actor_user_id,
      version            = COALESCE(version,1) + 1
    WHERE id = v_existing_id;

    v_entity_id := v_existing_id;

  ELSE
    INSERT INTO core_entities(
      organization_id, entity_type, entity_name, entity_code,
      entity_description, smart_code, status, tags, metadata,
      business_rules, ai_confidence, ai_classification, ai_insights,
      parent_entity_id, smart_code_status, created_by, updated_by
    ) VALUES (
      p_organization_id, p_entity_type, p_entity_name, p_entity_code,
      p_entity_description, p_smart_code, p_status, p_tags, p_metadata,
      p_business_rules, p_ai_confidence, p_ai_classification, p_ai_insights,
      p_parent_entity_id, p_smart_code_status, p_actor_user_id, p_actor_user_id
    )
    RETURNING id INTO v_entity_id;
  END IF;

  RETURN v_entity_id::text;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'HERA_ENTITY_UPSERT_ERROR: % - %', SQLERRM, SQLSTATE;
  RAISE;
END;
$$;


ALTER FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") IS 'HERA Universal Entity Upsert Function v1 - Fixed for actual schema';



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


CREATE OR REPLACE FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_txn_id uuid;
BEGIN
  INSERT INTO universal_transactions(
    organization_id, transaction_type, transaction_code, transaction_date,
    source_entity_id, total_amount, transaction_status, smart_code, business_context
  ) VALUES (
    p_org, 'CURATION_REVIEW', 'ENTITY_NORM', now(),
    p_entity_id, 0, 'pending',
    'HERA.GOVERNANCE.CURATION.REVIEW.REQUEST.v1',
    jsonb_build_object('label',p_label,'confidence',p_conf,'reason',p_reason)
  ) RETURNING id INTO v_txn_id;

  INSERT INTO universal_transaction_lines(
    organization_id, transaction_id, line_number, line_type, entity_id,
    description, smart_code, line_data
  ) VALUES (
    p_org, v_txn_id, 1, 'REVIEW_ITEM', p_entity_id,
    'Entity normalization review',
    'HERA.GOVERNANCE.CURATION.REVIEW.LINE.v1',
    jsonb_build_object('suggested','EMPLOYEE','label',p_label,'confidence',p_conf)
  );

  RETURN v_txn_id;
END;
$$;


ALTER FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_org UUID := (p_header->>'organization_id')::uuid;
  v_txn_id UUID;
  v_now TIMESTAMPTZ := now();
  v_total NUMERIC := 0;
  v_ln JSONB;
  v_idx INT := 0;
BEGIN
  IF p_header IS NULL OR jsonb_typeof(p_header) <> 'object' THEN
    RAISE EXCEPTION 'hera_txn_create_v1: p_header must be an object';
  END IF;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'hera_txn_create_v1: header.organization_id is required';
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN
    RAISE EXCEPTION 'hera_txn_create_v1: p_lines must be an array';
  END IF;

  -- Insert header
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
    v_org,
    p_header->>'transaction_type',
    p_header->>'transaction_code',
    COALESCE(NULLIF(p_header->>'transaction_date','')::timestamptz, v_now),
    NULLIF(p_header->>'source_entity_id','')::uuid,
    NULLIF(p_header->>'target_entity_id','')::uuid,
    0,                                      -- will compute after lines
    COALESCE(p_header->>'transaction_status','pending'),
    p_header->>'reference_number',
    p_header->>'external_reference',
    p_header->>'smart_code',
    'DRAFT',
    0, NULL, '{}'::jsonb,
    COALESCE(p_header->'business_context','{}'::jsonb),
    COALESCE(p_header->'metadata','{}'::jsonb),
    COALESCE(NULLIF(p_header->>'approval_required','')::boolean, false),
    NULLIF(p_header->>'approved_by','')::uuid,
    NULLIF(p_header->>'approved_at','')::timestamptz,
    NULLIF(p_header->>'transaction_currency_code',''),
    NULLIF(p_header->>'base_currency_code',''),
    NULLIF(p_header->>'exchange_rate','')::numeric,
    NULLIF(p_header->>'fiscal_year','')::int,
    NULLIF(p_header->>'fiscal_period','')::int,
    v_now, v_now, p_actor_user_id, p_actor_user_id, 1
  )
  RETURNING id INTO v_txn_id;

  -- Insert lines
  FOR v_ln IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_idx := v_idx + 1;
    INSERT INTO universal_transaction_lines(
      organization_id, transaction_id, line_number, entity_id, line_type,
      description, quantity, unit_amount, line_amount,
      discount_amount, tax_amount,
      smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
      line_data, created_at, updated_at, created_by, updated_by, version
    ) VALUES (
      v_org, v_txn_id,
      COALESCE(NULLIF(v_ln->>'line_number','')::int, v_idx),
      NULLIF(v_ln->>'entity_id','')::uuid,
      v_ln->>'line_type',
      v_ln->>'description',
      COALESCE(NULLIF(v_ln->>'quantity','')::numeric, 1),
      COALESCE(NULLIF(v_ln->>'unit_amount','')::numeric, 0),
      COALESCE(NULLIF(v_ln->>'line_amount','')::numeric,
               COALESCE(NULLIF(v_ln->>'quantity','')::numeric, 1) * COALESCE(NULLIF(v_ln->>'unit_amount','')::numeric, 0)),
      COALESCE(NULLIF(v_ln->>'discount_amount','')::numeric, 0),
      COALESCE(NULLIF(v_ln->>'tax_amount','')::numeric, 0),
      v_ln->>'smart_code',
      'DRAFT', 0, NULL, '{}'::jsonb,
      COALESCE(v_ln->'line_data','{}'::jsonb),
      v_now, v_now, p_actor_user_id, p_actor_user_id, 1
    );

    v_total := v_total
               + COALESCE(NULLIF(v_ln->>'line_amount','')::numeric,
                          COALESCE(NULLIF(v_ln->>'quantity','')::numeric, 1) * COALESCE(NULLIF(v_ln->>'unit_amount','')::numeric, 0))
               - COALESCE(NULLIF(v_ln->>'discount_amount','')::numeric, 0)
               + COALESCE(NULLIF(v_ln->>'tax_amount','')::numeric, 0);
  END LOOP;

  -- Update header total
  UPDATE universal_transactions
     SET total_amount = COALESCE(v_total, 0),
         updated_at   = v_now
   WHERE id = v_txn_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_txn_id);
END;
$$;


ALTER FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") OWNER TO "postgres";


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
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_limit              int    := COALESCE((p_filters->>'limit')::int, 50);
  v_offset             int    := COALESCE((p_filters->>'offset')::int, 0);
  v_transaction_type   text   := NULLIF(p_filters->>'transaction_type','');
  v_transaction_status text   := NULLIF(p_filters->>'transaction_status','');
  v_code_like          text   := NULLIF(p_filters->>'transaction_code_like','');
  v_smart_code_like    text   := NULLIF(p_filters->>'smart_code_like','');
  v_source_entity_id   uuid   := NULLIF(p_filters->>'source_entity_id','')::uuid;
  v_target_entity_id   uuid   := NULLIF(p_filters->>'target_entity_id','')::uuid;
  v_date_from          timestamptz := NULLIF(p_filters->>'date_from','')::timestamptz;
  v_date_to            timestamptz := NULLIF(p_filters->>'date_to','')::timestamptz;
  v_rows               jsonb;
  v_total              int;
BEGIN
  WITH filtered AS (
    SELECT t.*
    FROM universal_transactions t
    WHERE t.organization_id = p_org_id
      AND (v_source_entity_id   IS NULL OR t.source_entity_id   = v_source_entity_id)
      AND (v_target_entity_id   IS NULL OR t.target_entity_id   = v_target_entity_id)
      AND (v_transaction_type   IS NULL OR t.transaction_type   = v_transaction_type)
      AND (v_transaction_status IS NULL OR t.transaction_status = v_transaction_status)
      AND (v_code_like          IS NULL OR t.transaction_code   ILIKE '%' || v_code_like || '%')
      AND (v_smart_code_like    IS NULL OR t.smart_code         ILIKE '%' || v_smart_code_like || '%')
      AND (v_date_from          IS NULL OR t.transaction_date  >= v_date_from)
      AND (v_date_to            IS NULL OR t.transaction_date  <  v_date_to)
  ),
  page AS (
    SELECT *
    FROM filtered
    ORDER BY transaction_date DESC, created_at DESC
    LIMIT v_limit OFFSET v_offset
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id',                         p.id,
        'organization_id',            p.organization_id,
        'transaction_type',           p.transaction_type,
        'transaction_code',           p.transaction_code,
        'transaction_date',           p.transaction_date,
        'source_entity_id',           p.source_entity_id,
        'target_entity_id',           p.target_entity_id,
        'total_amount',               p.total_amount,
        'transaction_currency_code',  p.transaction_currency_code,
        'base_currency_code',         p.base_currency_code,
        'exchange_rate',              p.exchange_rate,
        'smart_code',                 p.smart_code,
        'transaction_status',         p.transaction_status,
        'reference_number',           p.reference_number,
        'external_reference',         p.external_reference,
        'business_context',           p.business_context,
        'metadata',                   p.metadata,
        'ai_confidence',              p.ai_confidence,
        'ai_classification',          p.ai_classification,
        'ai_insights',                p.ai_insights,
        'created_at',                 p.created_at,
        'updated_at',                 p.updated_at,
        'version',                    p.version
      )
    ),
    (SELECT COUNT(*) FROM filtered)
  INTO v_rows, v_total
  FROM page p;

  RETURN jsonb_build_object(
    'success', true,
    'data', COALESCE(v_rows, '[]'::jsonb),
    'metadata', jsonb_build_object(
      'total',  v_total,
      'limit',  v_limit,
      'offset', v_offset,
      'has_more', (v_total > v_offset + v_limit)
    )
  );
END;
$$;


ALTER FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_header jsonb;
  v_lines  jsonb;
BEGIN
  -- Header
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
  )
  INTO v_header
  FROM universal_transactions t
  WHERE t.id = p_transaction_id
    AND t.organization_id = p_org_id;

  IF v_header IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  -- Lines (ordered)
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
             ORDER BY l.line_number  -- ✅ order inside aggregate
           )
    INTO v_lines
    FROM universal_transaction_lines l
    WHERE l.transaction_id = p_transaction_id
      AND l.organization_id = p_org_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('header', v_header, 'lines', COALESCE(v_lines, '[]'::jsonb))
  );
END;
$$;


ALTER FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  SELECT p_smart_code ~ '^HERA\.[A-Z0-9]+(\.[A-Z0-9]+){4,}\.V[0-9]+$';
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
            'HERA.SYSTEM.NORMALIZATION.NAME.v1'
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


CREATE OR REPLACE VIEW "public"."hera_audit_list_v1_view" AS
 SELECT "now"() AS "timestamp",
    'action'::"text" AS "action",
    'resource'::"text" AS "resource",
    '{}'::"jsonb" AS "details",
    NULL::"text" AS "ip_address",
    NULL::"text" AS "user_agent";


ALTER VIEW "public"."hera_audit_list_v1_view" OWNER TO "postgres";


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
    "version" integer DEFAULT 1
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
    "posting_period_code" "text"
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



CREATE INDEX "idx_cdd_org_entity_field" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "entity_id", "field_name");



CREATE INDEX "idx_ce_alias_trgm" ON "public"."core_entities" USING "gin" ("entity_name" "public"."gin_trgm_ops") WHERE ("entity_type" = 'ALIAS'::"text");



CREATE INDEX "idx_ce_org_smartcode" ON "public"."core_entities" USING "btree" ("organization_id", "smart_code");



CREATE INDEX "idx_ce_org_type_name" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "entity_name");



CREATE INDEX "idx_core_dyn_fields" ON "public"."core_dynamic_data" USING "btree" ("entity_id", "field_name");



CREATE INDEX "idx_core_entities" ON "public"."core_entities" USING "btree" ("organization_id", "entity_type", "entity_code");



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



CREATE INDEX "idx_ut_org_type_date" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_type", "transaction_date" DESC);



CREATE INDEX "idx_utl_org_txn_line" ON "public"."universal_transaction_lines" USING "btree" ("organization_id", "transaction_id", "line_number");



CREATE INDEX "ix_rpt_profiles_org_entity_id" ON "public"."rpt_entity_profiles" USING "btree" ("organization_id", "entity_id");



CREATE INDEX "ix_rpt_profiles_org_entity_type" ON "public"."rpt_entity_profiles" USING "btree" ("organization_id", "entity_type");



CREATE INDEX "ix_user_by_email" ON "public"."core_entities" USING "btree" ("lower"(("metadata" ->> 'email'::"text"))) WHERE ("entity_type" = 'USER'::"text");



CREATE INDEX "ut_org_type_created_at_idx" ON "public"."universal_transactions" USING "btree" ("organization_id", "transaction_type", "created_at");



CREATE UNIQUE INDEX "ux_dynamic_data_entity_field" ON "public"."core_dynamic_data" USING "btree" ("organization_id", "entity_id", "field_name");



CREATE UNIQUE INDEX "ux_user_by_auth_id" ON "public"."core_entities" USING "btree" ((("metadata" ->> 'auth_user_id'::"text"))) WHERE ("entity_type" = 'USER'::"text");



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


CREATE POLICY "org_rel_read" ON "public"."core_relationships" FOR SELECT USING (("organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid"));



CREATE POLICY "org_rel_write" ON "public"."core_relationships" FOR INSERT WITH CHECK (("organization_id" = ("current_setting"('app.org_id'::"text", true))::"uuid"));



ALTER TABLE "public"."universal_transaction_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."universal_transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_dyn_field_upsert"("p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_text" "text", "p_number" numeric, "p_boolean" boolean, "p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_dyn_fields_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."_dyn_fields_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_dyn_fields_table"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_assert_txn_org"("p_org_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_audit_export_request_v1"("p_organization_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_format" "text", "p_filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_audit_list_v1"("p_organization_id" "uuid", "p_user_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_action_type" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_debug_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_debug_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_debug_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_batch_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_items" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_get_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" timestamp with time zone, "p_field_value_json" "jsonb", "p_smart_code" "text", "p_actor_user_id" "uuid", "p_validation_status" "text", "p_validation_rules" "jsonb", "p_field_order" integer, "p_is_required" boolean, "p_is_searchable" boolean, "p_is_system_field" boolean, "p_ai_confidence" numeric, "p_ai_insights" "jsonb", "p_ai_enhanced_value" "text", "p_smart_code_status" "text", "p_field_value_file_url" "text", "p_calculated_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" timestamp with time zone, "p_field_value_json" "jsonb", "p_smart_code" "text", "p_actor_user_id" "uuid", "p_validation_status" "text", "p_validation_rules" "jsonb", "p_field_order" integer, "p_is_required" boolean, "p_is_searchable" boolean, "p_is_system_field" boolean, "p_ai_confidence" numeric, "p_ai_insights" "jsonb", "p_ai_enhanced_value" "text", "p_smart_code_status" "text", "p_field_value_file_url" "text", "p_calculated_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_dynamic_data_set_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_field_name" "text", "p_field_type" "text", "p_field_value_text" "text", "p_field_value_number" numeric, "p_field_value_boolean" boolean, "p_field_value_date" timestamp with time zone, "p_field_value_json" "jsonb", "p_smart_code" "text", "p_actor_user_id" "uuid", "p_validation_status" "text", "p_validation_rules" "jsonb", "p_field_order" integer, "p_is_required" boolean, "p_is_searchable" boolean, "p_is_system_field" boolean, "p_ai_confidence" numeric, "p_ai_insights" "jsonb", "p_ai_enhanced_value" "text", "p_smart_code_status" "text", "p_field_value_file_url" "text", "p_calculated_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_delete_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_cascade_dynamic_data" boolean, "p_cascade_relationships" boolean) TO "service_role";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."core_dynamic_data" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."core_dynamic_data" TO "authenticated";
GRANT ALL ON TABLE "public"."core_dynamic_data" TO "service_role";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."core_entities" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."core_entities" TO "authenticated";
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



GRANT ALL ON FUNCTION "public"."hera_entity_recover_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_set_status" "text", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_recover_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_set_status" "text", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_recover_v1"("p_organization_id" "uuid", "p_entity_id" "uuid", "p_set_status" "text", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_entity_upsert_v1"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_smart_code" "text", "p_entity_id" "uuid", "p_entity_code" "text", "p_entity_description" "text", "p_parent_entity_id" "uuid", "p_status" "text", "p_tags" "text"[], "p_smart_code_status" "text", "p_business_rules" "jsonb", "p_metadata" "jsonb", "p_ai_confidence" numeric, "p_ai_classification" "text", "p_ai_insights" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_open_review_txn"("p_org" "uuid", "p_entity_id" "uuid", "p_label" "text", "p_conf" numeric, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_organization_create_v1"("p_organization_id" "uuid", "p_organization_name" "text", "p_organization_type" "text", "p_status" "text", "p_subscription_plan" "text", "p_max_users" integer, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_organization_delete_v1"("p_organization_id" "uuid", "p_actor_user_id" "uuid", "p_confirmation" "text", "p_force" boolean) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."hera_smart_code_normalizer"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_smart_code_normalizer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_smart_code_normalizer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_smartcode_regex"() TO "anon";
GRANT ALL ON FUNCTION "public"."hera_smartcode_regex"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_smartcode_regex"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_create_v1"("p_header" "jsonb", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_delete_v1"("p_organization_id" "uuid", "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_emit_v1"("p_organization_id" "uuid", "p_transaction_type" "text", "p_smart_code" character varying, "p_transaction_code" "text", "p_transaction_date" timestamp with time zone, "p_source_entity_id" "uuid", "p_target_entity_id" "uuid", "p_total_amount" numeric, "p_transaction_status" "text", "p_reference_number" "text", "p_external_reference" "text", "p_business_context" "jsonb", "p_metadata" "jsonb", "p_approval_required" boolean, "p_approved_by" "uuid", "p_approved_at" timestamp with time zone, "p_transaction_currency_code" character, "p_base_currency_code" character, "p_exchange_rate" numeric, "p_exchange_rate_date" "date", "p_exchange_rate_type" "text", "p_fiscal_period_entity_id" "uuid", "p_fiscal_year" integer, "p_fiscal_period" integer, "p_posting_period_code" "text", "p_lines" "jsonb", "p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_query_v1"("p_org_id" "uuid", "p_filters" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_txn_read_v1"("p_org_id" "uuid", "p_transaction_id" "uuid", "p_include_lines" boolean) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_smart_code"("p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hera_validate_smartcodes"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."preserve_vibe_context"("p_organization_id" "uuid", "p_session_token" "text", "p_context_data" "jsonb", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_existing_user"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_existing_user"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_existing_user"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_vibe_context"("p_organization_id" "uuid", "p_session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_entities_resolve_and_upsert"("p_org_id" "uuid", "p_entity_type" "text", "p_entity_name" "text", "p_entity_code" "text", "p_smart_code" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_seed_vocab_pack"("p_org" "uuid", "p_industry" "text", "p_locale" "text", "p_pack" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."smart_is_financial_txn"("p_smart_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."smart_is_negative_txn_static"("p" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."smart_is_negative_txn_static"("p" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."smart_is_negative_txn_static"("p" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_org_access"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_org_access"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_org_access"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_entity_field"("p_field_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_entity_field_v2"("p_dynamic_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_journal_posting_to_period"("p_period_id" "uuid", "p_smart_code" "text", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."core_organizations" TO "anon";
GRANT ALL ON TABLE "public"."core_organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."core_organizations" TO "service_role";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."core_relationships" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."core_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."core_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."hera_audit_list_v1_view" TO "anon";
GRANT ALL ON TABLE "public"."hera_audit_list_v1_view" TO "authenticated";
GRANT ALL ON TABLE "public"."hera_audit_list_v1_view" TO "service_role";



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
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


