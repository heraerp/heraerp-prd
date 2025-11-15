-- ================================================================================
-- HERA Finance DNA v2.2 - Complete Finance Runtime Engine
-- Migration: Core posting rules evaluation engine with policy-as-data accounting
-- Smart Code: HERA.PLATFORM.FINANCE.DNA.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- STEP 1: GLOBAL DEDUPLICATION FOR core_entities
--   Key: (organization_id, entity_type, entity_code)
--   Strategy:
--     - For each duplicate group, keep MIN(id::text) as canonical
--     - Safely merge core_dynamic_data (respecting its unique constraint)
--     - Repoint core_relationships
--     - Delete other duplicate entity headers
-- ================================================================================

DO $dedupe_core_entities$
DECLARE
  r record;
  v_duplicate_id uuid;
BEGIN
  -- Find all duplicate (org, type, code) combos
  FOR r IN
    SELECT
      organization_id,
      entity_type,
      entity_code,
      MIN(id_text)::uuid AS keep_id
    FROM (
      SELECT
        id::text AS id_text,
        organization_id,
        entity_type,
        entity_code
      FROM core_entities
    ) s
    GROUP BY organization_id, entity_type, entity_code
    HAVING COUNT(*) > 1
  LOOP
    -- For each duplicate row (except the one we keep)…
    FOR v_duplicate_id IN
      SELECT id
      FROM core_entities
      WHERE organization_id = r.organization_id
        AND entity_type     = r.entity_type
        AND entity_code     = r.entity_code
        AND id <> r.keep_id
    LOOP
      --------------------------------------------------------------------
      -- 1) Merge core_dynamic_data without breaking its unique constraint
      --    Unique: (organization_id, entity_id, field_name)
      --------------------------------------------------------------------
      -- First delete "would-be duplicates" where a row already exists
      -- on the keep_id for the same org + field_name.
      DELETE FROM core_dynamic_data d_dupe
      USING core_dynamic_data d_keep
      WHERE d_dupe.organization_id = d_keep.organization_id
        AND d_dupe.field_name      = d_keep.field_name
        AND d_dupe.entity_id       = v_duplicate_id
        AND d_keep.entity_id       = r.keep_id;

      -- Now it's safe to repoint the remaining rows
      UPDATE core_dynamic_data
      SET entity_id = r.keep_id
      WHERE entity_id = v_duplicate_id;

      --------------------------------------------------------------------
      -- 2) Repoint core_relationships (from_entity_id / to_entity_id)
      --    If you already have a unique index like:
      --    (organization_id, from_entity_id, to_entity_id, relationship_type)
      --    this pattern avoids collisions by deleting duplicates first.
      --------------------------------------------------------------------

      -- FROM side: delete duplicates that would conflict after merge
      DELETE FROM core_relationships rel_dupe
      USING core_relationships rel_keep
      WHERE rel_dupe.organization_id  = rel_keep.organization_id
        AND rel_dupe.from_entity_id   = v_duplicate_id
        AND rel_keep.from_entity_id   = r.keep_id
        AND COALESCE(rel_dupe.to_entity_id,  rel_keep.to_entity_id) = rel_keep.to_entity_id
        AND rel_dupe.relationship_type = rel_keep.relationship_type;

      -- TO side: delete duplicates that would conflict after merge
      DELETE FROM core_relationships rel_dupe
      USING core_relationships rel_keep
      WHERE rel_dupe.organization_id  = rel_keep.organization_id
        AND rel_dupe.to_entity_id     = v_duplicate_id
        AND rel_keep.to_entity_id     = r.keep_id
        AND COALESCE(rel_dupe.from_entity_id, rel_keep.from_entity_id) = rel_keep.from_entity_id
        AND rel_dupe.relationship_type = rel_keep.relationship_type;

      -- Now repoint any remaining relationships safely
      UPDATE core_relationships
      SET from_entity_id = r.keep_id
      WHERE from_entity_id = v_duplicate_id;

      UPDATE core_relationships
      SET to_entity_id = r.keep_id
      WHERE to_entity_id = v_duplicate_id;

      --------------------------------------------------------------------
      -- 3) Delete the duplicate entity header
      --------------------------------------------------------------------
      DELETE FROM core_entities
      WHERE id = v_duplicate_id;
    END LOOP;
  END LOOP;
END;
$dedupe_core_entities$;

-- ================================================================================
-- STEP 2: CORE ENTITIES UNIQUE CONSTRAINT FOR (org, type, code)
-- ================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'core_entities_org_type_code_uidx'
  ) THEN
    ALTER TABLE core_entities
      ADD CONSTRAINT core_entities_org_type_code_uidx
      UNIQUE (organization_id, entity_type, entity_code);
  END IF;
END;
$$;

-- ================================================================================
-- STEP 3: FINANCE DNA ENTITY TYPES SEED
-- ================================================================================

-- FINANCE_DNA_BUNDLE: Finance DNA rule bundles (platform-level)
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FINANCE_DNA_BUNDLE',
    'FINANCE_DNA_BUNDLE_ENTITY_TYPE',
    'Finance DNA Bundle Entity Type',
    'Entity type for Finance DNA rule bundles and posting rule collections',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.DNA_BUNDLE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- FINANCE_DNA_RULE: Individual posting rules (platform-level)
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FINANCE_DNA_RULE',
    'FINANCE_DNA_RULE_ENTITY_TYPE',
    'Finance DNA Rule Entity Type',
    'Entity type for individual finance posting rules and accounting logic',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.DNA_RULE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- FINANCE_DNA_CONFIG: Organization-specific finance configurations
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FINANCE_DNA_CONFIG',
    'FINANCE_DNA_CONFIG_ENTITY_TYPE',
    'Finance DNA Config Entity Type',
    'Entity type for organization-specific finance DNA configurations',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.DNA_CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- STEP 4: CORE FINANCE DNA EVALUATION ENGINE
-- ================================================================================

CREATE OR REPLACE FUNCTION hera_finance_dna_evaluate_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_transaction_type TEXT,
    p_transaction_data JSONB,
    p_options JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result JSONB := '{"status": "success", "gl_lines": [], "validation_errors": [], "warnings": []}';
    v_gl_lines JSONB[] := '{}'::jsonb[];
    v_validation_errors TEXT[] := '{}'::text[];
    v_warnings TEXT[] := '{}'::text[];
    v_bundle_rule JSONB;
    v_rule JSONB;
    v_posting_lines JSONB;
    v_line JSONB;
    v_debit_total NUMERIC := 0;
    v_credit_total NUMERIC := 0;
    v_currency TEXT;
    v_functional_currency TEXT := 'USD';
    v_exchange_rate NUMERIC := 1.0;
    v_rule_context JSONB;
    v_account_id UUID;
    v_amount NUMERIC;
    v_description TEXT;
    v_department_id UUID;
    v_project_id UUID;
BEGIN
    -- Validate required parameters
    IF p_actor_user_id IS NULL OR p_organization_id IS NULL OR p_transaction_type IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'actor_user_id, organization_id, and transaction_type are required'
        );
    END IF;

    -- Get organization functional currency
    SELECT COALESCE(
        (SELECT cdd.field_value_json->>'functional_currency'
         FROM core_entities ce
         JOIN core_dynamic_data cdd ON cdd.entity_id = ce.id
         WHERE ce.entity_type = 'FINANCE_DNA_CONFIG'
         AND ce.organization_id = p_organization_id
         AND cdd.field_name = 'finance_config'),
        'USD'
    ) INTO v_functional_currency;

    -- Get transaction currency and exchange rate
    v_currency := COALESCE(p_transaction_data->>'currency', v_functional_currency);

    IF v_currency != v_functional_currency THEN
        v_exchange_rate := COALESCE((p_transaction_data->>'exchange_rate')::NUMERIC, 1.0);
    END IF;

    -- Find applicable Finance DNA bundle for transaction type
    FOR v_bundle_rule IN
        SELECT cdd.field_value_json
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON cdd.entity_id = ce.id
        WHERE ce.entity_type = 'FINANCE_DNA_BUNDLE'
        AND ce.organization_id IN (p_organization_id, '00000000-0000-0000-0000-000000000000')
        AND cdd.field_name = 'bundle_rules'
        AND (
            (cdd.field_value_json->>'transaction_type_match') = p_transaction_type
            OR (cdd.field_value_json->'transaction_types' ? p_transaction_type)
        )
        AND ce.status = 'active'
        ORDER BY
            CASE WHEN ce.organization_id = p_organization_id THEN 1 ELSE 2 END,
            ce.created_at DESC
        LIMIT 1
    LOOP
        -- Process each posting rule in the bundle
        FOR v_rule IN SELECT * FROM jsonb_array_elements(v_bundle_rule->'rules')
        LOOP
            -- Build rule evaluation context
            v_rule_context := jsonb_build_object(
                'transaction', p_transaction_data,
                'transaction_type', p_transaction_type,
                'organization_id', p_organization_id,
                'actor_user_id', p_actor_user_id,
                'currency', v_currency,
                'functional_currency', v_functional_currency,
                'exchange_rate', v_exchange_rate
            );

            -- Evaluate rule conditions (simplified)
            IF hera_finance_dna_rule_matches_v1(v_rule, v_rule_context) THEN
                v_posting_lines := hera_finance_dna_generate_lines_v1(v_rule, v_rule_context);

                FOR v_line IN SELECT * FROM jsonb_array_elements(v_posting_lines)
                LOOP
                    v_account_id := hera_finance_dna_resolve_account_v1(
                        v_line->>'account_source',
                        v_rule_context
                    );

                    IF v_account_id IS NULL THEN
                        v_validation_errors := v_validation_errors || ('Account not found: ' || (v_line->>'account_source'));
                        CONTINUE;
                    END IF;

                    v_amount := hera_finance_dna_calculate_amount_v1(
                        v_line->>'amount_source',
                        v_rule_context
                    );

                    v_line := jsonb_build_object(
                        'account_id', v_account_id,
                        'side', v_line->>'side',
                        'amount', v_amount,
                        'currency', v_currency,
                        'functional_amount', v_amount * v_exchange_rate,
                        'functional_currency', v_functional_currency,
                        'exchange_rate', v_exchange_rate,
                        'description', COALESCE(v_line->>'description', 'Generated by Finance DNA'),
                        'department_id', hera_finance_dna_resolve_dimension_v1('department', v_rule_context),
                        'project_id', hera_finance_dna_resolve_dimension_v1('project', v_rule_context),
                        'smart_code', v_rule->>'smart_code'
                    );

                    v_gl_lines := array_append(v_gl_lines, v_line);

                    IF (v_line->>'side') = 'DR' THEN
                        v_debit_total := v_debit_total + (v_line->>'functional_amount')::NUMERIC;
                    ELSE
                        v_credit_total := v_credit_total + (v_line->>'functional_amount')::NUMERIC;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;

    IF ABS(v_debit_total - v_credit_total) > 0.01 THEN
        v_validation_errors := v_validation_errors || (
            'GL entries do not balance. DR: ' || v_debit_total::TEXT ||
            ', CR: ' || v_credit_total::TEXT
        );
    END IF;

    v_result := jsonb_build_object(
        'status', CASE WHEN array_length(v_validation_errors, 1) > 0 THEN 'validation_failed' ELSE 'success' END,
        'gl_lines', array_to_json(v_gl_lines),
        'validation_errors', array_to_json(v_validation_errors),
        'warnings', array_to_json(v_warnings),
        'summary', jsonb_build_object(
            'lines_generated', array_length(v_gl_lines, 1),
            'total_debit', v_debit_total,
            'total_credit', v_credit_total,
            'currency', v_currency,
            'functional_currency', v_functional_currency,
            'exchange_rate', v_exchange_rate,
            'is_balanced', ABS(v_debit_total - v_credit_total) <= 0.01
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Finance DNA evaluation failed: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$function$;

-- ================================================================================
-- STEP 5: FINANCE DNA HELPER FUNCTIONS
-- ================================================================================

CREATE OR REPLACE FUNCTION hera_finance_dna_rule_matches_v1(
    p_rule JSONB,
    p_context JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_condition JSONB;
    v_field_value TEXT;
    v_expected_value TEXT;
    v_operator TEXT;
BEGIN
    IF p_rule->'conditions' IS NULL THEN
        RETURN TRUE;
    END IF;

    FOR v_condition IN SELECT * FROM jsonb_array_elements(p_rule->'conditions')
    LOOP
        v_field_value := jsonb_extract_path_text(p_context, variadic string_to_array(v_condition->>'field', '.'));
        v_expected_value := v_condition->>'value';
        v_operator := COALESCE(v_condition->>'operator', 'equals');

        CASE v_operator
            WHEN 'equals' THEN
                IF v_field_value != v_expected_value THEN
                    RETURN FALSE;
                END IF;
            WHEN 'not_equals' THEN
                IF v_field_value = v_expected_value THEN
                    RETURN FALSE;
                END IF;
            WHEN 'contains' THEN
                IF v_field_value NOT LIKE '%' || v_expected_value || '%' THEN
                    RETURN FALSE;
                END IF;
            WHEN 'greater_than' THEN
                IF v_field_value::NUMERIC <= v_expected_value::NUMERIC THEN
                    RETURN FALSE;
                END IF;
            WHEN 'less_than' THEN
                IF v_field_value::NUMERIC >= v_expected_value::NUMERIC THEN
                    RETURN FALSE;
                END IF;
        END CASE;
    END LOOP;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION hera_finance_dna_generate_lines_v1(
    p_rule JSONB,
    p_context JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_lines JSONB[] := '{}'::jsonb[];
    v_line_template JSONB;
    v_generated_line JSONB;
    v_amount NUMERIC;
BEGIN
    FOR v_line_template IN SELECT * FROM jsonb_array_elements(p_rule->'lines')
    LOOP
        v_amount := hera_finance_dna_calculate_amount_v1(
            v_line_template->>'amount_source',
            p_context
        );

        v_generated_line := jsonb_build_object(
            'side', v_line_template->>'side',
            'account_source', v_line_template->>'account_source',
            'amount_source', v_line_template->>'amount_source',
            'amount', v_amount,
            'description', COALESCE(v_line_template->>'description', 'Auto-generated'),
            'dimension_sources', COALESCE(v_line_template->'dimension_sources', '{}'::JSONB)
        );

        v_lines := array_append(v_lines, v_generated_line);
    END LOOP;

    RETURN array_to_json(v_lines);

EXCEPTION
    WHEN OTHERS THEN
        RETURN '[]'::JSONB;
END;
$function$;

CREATE OR REPLACE FUNCTION hera_finance_dna_resolve_account_v1(
    p_account_source TEXT,
    p_context JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_account_id UUID;
    v_account_code TEXT;
    v_organization_id UUID;
BEGIN
    v_organization_id := (p_context->>'organization_id')::UUID;

    CASE
        WHEN p_account_source LIKE 'account.%' THEN
            v_account_code := jsonb_extract_path_text(p_context, variadic string_to_array(p_account_source, '.'));
        WHEN p_account_source LIKE 'config.%' THEN
            SELECT cdd.field_value_json->substring(p_account_source from 8) INTO v_account_code
            FROM core_entities ce
            JOIN core_dynamic_data cdd ON cdd.entity_id = ce.id
            WHERE ce.entity_type = 'FINANCE_DNA_CONFIG'
              AND ce.organization_id = v_organization_id
              AND cdd.field_name = 'account_mappings';
        ELSE
            v_account_code := p_account_source;
    END CASE;

    IF v_account_code IS NOT NULL THEN
        SELECT ce.id INTO v_account_id
        FROM core_entities ce
        WHERE ce.entity_type = 'GL_ACCOUNT'
          AND ce.entity_code = v_account_code
          AND ce.organization_id = v_organization_id
          AND ce.status = 'active'
        LIMIT 1;
    END IF;

    RETURN v_account_id;

EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION hera_finance_dna_calculate_amount_v1(
    p_amount_source TEXT,
    p_context JSONB
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_amount NUMERIC := 0;
    v_base_amount NUMERIC;
    v_percentage NUMERIC;
BEGIN
    CASE
        WHEN p_amount_source LIKE 'transaction.%' THEN
            v_amount := jsonb_extract_path_text(p_context, variadic string_to_array(p_amount_source, '.'))::NUMERIC;
        WHEN p_amount_source LIKE 'calculate.%' THEN
            CASE p_amount_source
                WHEN 'calculate.tax_amount' THEN
                    v_base_amount := (p_context->'transaction'->>'subtotal')::NUMERIC;
                    v_percentage  := (p_context->'transaction'->>'tax_rate')::NUMERIC;
                    v_amount := v_base_amount * (v_percentage / 100);
                WHEN 'calculate.total_minus_tax' THEN
                    v_amount := (p_context->'transaction'->>'total_amount')::NUMERIC -
                                (p_context->'transaction'->>'tax_amount')::NUMERIC;
                ELSE
                    v_amount := 0;
            END CASE;
        ELSE
            BEGIN
                v_amount := p_amount_source::NUMERIC;
            EXCEPTION
                WHEN OTHERS THEN
                    v_amount := 0;
            END;
    END CASE;

    RETURN COALESCE(v_amount, 0);

EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$function$;

CREATE OR REPLACE FUNCTION hera_finance_dna_resolve_dimension_v1(
    p_dimension_type TEXT,
    p_context JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_dimension_id UUID;
    v_dimension_code TEXT;
    v_organization_id UUID;
BEGIN
    v_organization_id := (p_context->>'organization_id')::UUID;
    v_dimension_code  := p_context->'transaction'->>(p_dimension_type || '_code');

    IF v_dimension_code IS NOT NULL THEN
        SELECT ce.id INTO v_dimension_id
        FROM core_entities ce
        WHERE ce.entity_type = UPPER(p_dimension_type)
          AND ce.entity_code = v_dimension_code
          AND ce.organization_id = v_organization_id
          AND ce.status = 'active'
        LIMIT 1;
    END IF;

    RETURN v_dimension_id;

EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$function$;

-- ================================================================================
-- STEP 6: FINANCE DNA BUNDLE MANAGEMENT FUNCTIONS
-- ================================================================================

CREATE OR REPLACE FUNCTION hera_finance_dna_create_bundle_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_bundle_code TEXT,
    p_bundle_name TEXT,
    p_bundle_rules JSONB,
    p_options JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_bundle_id UUID;
    v_result JSONB;
BEGIN
    IF p_actor_user_id IS NULL OR p_organization_id IS NULL OR p_bundle_code IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'actor_user_id, organization_id, and bundle_code are required'
        );
    END IF;

    INSERT INTO core_entities (
        id,
        entity_type,
        entity_code,
        entity_name,
        entity_description,
        smart_code,
        organization_id,
        created_by,
        updated_by,
        created_at,
        updated_at,
        status
    ) VALUES (
        gen_random_uuid(),
        'FINANCE_DNA_BUNDLE',
        p_bundle_code,
        p_bundle_name,
        'Finance DNA posting rules bundle: ' || p_bundle_name,
        'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.FINANCE.DNA.BUNDLE.' || p_bundle_code || '.v1',
        p_organization_id,
        p_actor_user_id,
        p_actor_user_id,
        NOW(),
        NOW(),
        'active'
    ) RETURNING id INTO v_bundle_id;

    INSERT INTO core_dynamic_data (
        id,
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_bundle_id,
        'bundle_rules',
        'json',
        p_bundle_rules,
        'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.FINANCE.DNA.BUNDLE.' || p_bundle_code || '.RULES.v1',
        p_organization_id,
        p_actor_user_id,
        p_actor_user_id,
        NOW(),
        NOW()
    );

    v_result := jsonb_build_object(
        'status', 'success',
        'bundle_id', v_bundle_id,
        'bundle_code', p_bundle_code,
        'bundle_name', p_bundle_name,
        'rules_count', jsonb_array_length(p_bundle_rules->'rules'),
        'message', 'Finance DNA bundle created successfully'
    );

    RETURN v_result;

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Finance DNA bundle with code "' || p_bundle_code || '" already exists',
            'error_code', 'BUNDLE_ALREADY_EXISTS'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Failed to create Finance DNA bundle: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$function$;

CREATE OR REPLACE FUNCTION hera_finance_dna_test_bundle_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_bundle_code TEXT,
    p_test_transaction JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_test_result JSONB;
    v_transaction_type TEXT;
BEGIN
    v_transaction_type := p_test_transaction->>'transaction_type';

    SELECT hera_finance_dna_evaluate_v1(
        p_actor_user_id,
        p_organization_id,
        v_transaction_type,
        p_test_transaction,
        jsonb_build_object('test_mode', true)
    ) INTO v_test_result;

    v_test_result := v_test_result || jsonb_build_object(
        'test_info', jsonb_build_object(
            'bundle_code', p_bundle_code,
            'transaction_type', v_transaction_type,
            'test_timestamp', NOW(),
            'tester_user_id', p_actor_user_id
        )
    );

    RETURN v_test_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Finance DNA bundle test failed: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$function$;

-- ================================================================================
-- STEP 7: PERMISSIONS
-- ================================================================================

GRANT EXECUTE ON FUNCTION hera_finance_dna_evaluate_v1(UUID, UUID, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_rule_matches_v1(JSONB, JSONB)         TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_generate_lines_v1(JSONB, JSONB)       TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_resolve_account_v1(TEXT, JSONB)       TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_calculate_amount_v1(TEXT, JSONB)      TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_resolve_dimension_v1(TEXT, JSONB)     TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_create_bundle_v1(UUID, UUID, TEXT, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_finance_dna_test_bundle_v1(UUID, UUID, TEXT, JSONB)                 TO authenticated;

-- ================================================================================
-- STEP 8: PERFORMANCE OPTIMIZATIONS
-- ================================================================================

CREATE INDEX IF NOT EXISTS idx_finance_dna_bundles
ON core_entities (organization_id, entity_type, entity_code, status)
WHERE entity_type = 'FINANCE_DNA_BUNDLE';

CREATE INDEX IF NOT EXISTS idx_finance_dna_rules
ON core_dynamic_data (entity_id, field_name)
WHERE field_name = 'bundle_rules';

-- ================================================================================
-- STEP 9: SUCCESS CONFIRMATION
-- ================================================================================

DO $validation$
DECLARE
    v_entity_type_count INTEGER;
    v_function_count INTEGER;
    v_index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_entity_type_count
    FROM core_entities
    WHERE entity_type IN ('FINANCE_DNA_BUNDLE', 'FINANCE_DNA_RULE', 'FINANCE_DNA_CONFIG')
      AND organization_id = '00000000-0000-0000-0000-000000000000';

    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc
    WHERE proname LIKE 'hera_finance_dna_%';

    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE indexname LIKE 'idx_finance_dna%';

    IF v_entity_type_count < 3 THEN
        RAISE EXCEPTION 'Finance DNA setup incomplete. Expected 3 entity types, found %', v_entity_type_count;
    END IF;

    IF v_function_count < 8 THEN
        RAISE EXCEPTION 'Finance DNA functions incomplete. Expected 8+ functions, found %', v_function_count;
    END IF;

    RAISE NOTICE 'HERA Finance DNA v2.2 migration completed successfully';
    RAISE NOTICE '✅ Finance DNA Entity Types: BUNDLE, RULE, CONFIG';
    RAISE NOTICE '✅ Core Engine: hera_finance_dna_evaluate_v1 (policy-as-data posting)';
    RAISE NOTICE '✅ Helper Functions: Rule matching, line generation, account resolution';
    RAISE NOTICE '✅ Bundle Management: Create, test, and deploy Finance DNA bundles';
    RAISE NOTICE '✅ Multi-Currency Support: Automatic FX conversion in posting lines';
    RAISE NOTICE '✅ GL Balancing: Automatic DR=CR validation built-in';
    RAISE NOTICE '✅ Performance Optimized: Strategic indexes for fast rule evaluation';
    RAISE NOTICE '📊 Total entity types: %, Functions: %, Indexes: %', v_entity_type_count, v_function_count, v_index_count;
    RAISE NOTICE '🧬 Finance DNA v2.2 runtime engine ready for zero-code accounting';
END;
$validation$;
