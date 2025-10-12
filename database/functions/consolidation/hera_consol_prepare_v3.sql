-- ============================================================================
-- HERA Finance DNA v3.4: Cross-Org Consolidation Preparation Engine
-- 
-- Prepares consolidation structure, validates policies, FX rates, and caches
-- member lists for IFRS 10 compliant multi-entity consolidation.
-- 
-- Smart Code: HERA.CONSOL.PREP.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_consol_prepare_v3(
  p_group_id UUID,
  p_period TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_base_currency TEXT DEFAULT 'GBP',
  p_validation_mode BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_group_entity RECORD;
  v_member_count INTEGER := 0;
  v_fx_pairs_validated INTEGER := 0;
  v_elimination_pairs_validated INTEGER := 0;
  v_policy_violations JSONB := '[]';
  v_preparation_summary JSONB := '{}';
  v_cached_members JSONB := '[]';
  v_fx_rates JSONB := '{}';
  v_error_code TEXT := NULL;
  v_error_message TEXT := NULL;
  rec RECORD;
BEGIN

  -- ============================================================================
  -- 1) Input Validation & Setup
  -- ============================================================================
  
  v_run_id := gen_random_uuid();
  
  -- Validate group entity exists
  SELECT * INTO v_group_entity
  FROM core_entities 
  WHERE id = p_group_id 
    AND entity_type = 'GROUP'
    AND smart_code = 'HERA.CONSOL.ENTITY.GROUP.V3';
    
  IF v_group_entity.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'GROUP_NOT_FOUND',
      'error_message', 'Consolidation group not found or invalid type'
    );
  END IF;

  -- Validate period format (YYYY-MM)
  IF NOT (p_period ~ '^\d{4}-\d{2}$') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_PERIOD_FORMAT',
      'error_message', 'Period must be in YYYY-MM format'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Validate Group Members & Ownership
    -- ============================================================================
    
    WITH group_members AS (
      SELECT 
        r.to_entity_id as member_entity_id,
        e.entity_name as member_name,
        e.organization_id as member_org_id,
        (r.metadata->>'ownership_pct')::decimal as ownership_pct,
        r.metadata->>'method' as consolidation_method,
        r.metadata->>'local_currency' as local_currency,
        r.created_at as member_since
      FROM core_relationships r
      JOIN core_entities e ON e.id = r.to_entity_id
      WHERE r.from_entity_id = p_group_id
        AND r.relationship_type = 'GROUP_HAS_MEMBER'
        AND r.smart_code = 'HERA.CONSOL.REL.GROUP_HAS_MEMBER.V3'
        AND r.is_active = true
    ),
    member_validation AS (
      SELECT 
        gm.*,
        CASE 
          WHEN gm.ownership_pct IS NULL THEN 'MISSING_OWNERSHIP_PCT'
          WHEN gm.ownership_pct < 0 OR gm.ownership_pct > 100 THEN 'INVALID_OWNERSHIP_RANGE'
          WHEN gm.consolidation_method IS NULL THEN 'MISSING_CONSOLIDATION_METHOD'
          WHEN gm.consolidation_method NOT IN ('FULL', 'PROPORTIONATE', 'EQUITY') THEN 'INVALID_CONSOLIDATION_METHOD'
          WHEN gm.local_currency IS NULL THEN 'MISSING_LOCAL_CURRENCY'
          ELSE 'VALID'
        END as validation_status
      FROM group_members gm
    )
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'member_entity_id', mv.member_entity_id,
          'member_name', mv.member_name,
          'member_org_id', mv.member_org_id,
          'ownership_pct', mv.ownership_pct,
          'consolidation_method', mv.consolidation_method,
          'local_currency', mv.local_currency,
          'validation_status', mv.validation_status,
          'member_since', mv.member_since
        )
      ),
      COUNT(*)
    INTO v_cached_members, v_member_count
    FROM member_validation mv;

    -- Check for policy violations
    WITH policy_violations AS (
      SELECT 
        jsonb_array_elements(v_cached_members)->>'validation_status' as violation_type,
        COUNT(*) as violation_count
      FROM (SELECT 1) dummy
      WHERE jsonb_array_elements(v_cached_members)->>'validation_status' != 'VALID'
      GROUP BY 1
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'violation_type', pv.violation_type,
        'violation_count', pv.violation_count,
        'policy_rule', 'CONSOLIDATION_MEMBER_VALIDATION'
      )
    ) INTO v_policy_violations
    FROM policy_violations pv;

    -- ============================================================================
    -- 3) Validate FX Rates Availability
    -- ============================================================================
    
    WITH required_fx_pairs AS (
      SELECT DISTINCT
        COALESCE(
          jsonb_array_elements(v_cached_members)->>'local_currency', 
          p_base_currency
        ) as from_currency,
        p_base_currency as to_currency,
        p_period as period
      FROM (SELECT 1) dummy
      WHERE COALESCE(
        jsonb_array_elements(v_cached_members)->>'local_currency', 
        p_base_currency
      ) != p_base_currency
    ),
    fx_rate_check AS (
      SELECT 
        rfp.from_currency,
        rfp.to_currency,
        rfp.period,
        ce.id as currency_pair_entity_id,
        cdd_avg.field_value_number as avg_rate,
        cdd_close.field_value_number as closing_rate,
        CASE 
          WHEN ce.id IS NULL THEN 'CURRENCY_PAIR_NOT_FOUND'
          WHEN cdd_avg.field_value_number IS NULL THEN 'MISSING_AVG_RATE'
          WHEN cdd_close.field_value_number IS NULL THEN 'MISSING_CLOSING_RATE'
          WHEN cdd_avg.field_value_number <= 0 OR cdd_close.field_value_number <= 0 THEN 'INVALID_RATE_VALUE'
          ELSE 'VALID'
        END as fx_validation_status
      FROM required_fx_pairs rfp
      LEFT JOIN core_entities ce ON 
        ce.entity_type = 'CURRENCY_PAIR' AND
        ce.entity_code = rfp.from_currency || '-' || rfp.to_currency AND
        ce.organization_id = v_group_entity.organization_id
      LEFT JOIN core_dynamic_data cdd_avg ON 
        cdd_avg.entity_id = ce.id AND
        cdd_avg.field_name = 'rate_avg_' || replace(rfp.period, '-', '_')
      LEFT JOIN core_dynamic_data cdd_close ON 
        cdd_close.entity_id = ce.id AND
        cdd_close.field_name = 'rate_close_' || replace(rfp.period, '-', '_')
    )
    SELECT 
      jsonb_object_agg(
        frc.from_currency || '-' || frc.to_currency || '-' || frc.period,
        jsonb_build_object(
          'currency_pair_entity_id', frc.currency_pair_entity_id,
          'avg_rate', frc.avg_rate,
          'closing_rate', frc.closing_rate,
          'validation_status', frc.fx_validation_status
        )
      ),
      COUNT(CASE WHEN frc.fx_validation_status = 'VALID' THEN 1 END)
    INTO v_fx_rates, v_fx_pairs_validated
    FROM fx_rate_check frc;

    -- ============================================================================
    -- 4) Validate Elimination Pairs
    -- ============================================================================
    
    WITH elimination_pairs AS (
      SELECT 
        r.from_entity_id,
        r.to_entity_id,
        r.metadata->>'pair_code' as pair_code,
        r.metadata->'rules' as elimination_rules,
        CASE 
          WHEN r.metadata->>'pair_code' IS NULL THEN 'MISSING_PAIR_CODE'
          WHEN r.metadata->'rules' IS NULL OR jsonb_array_length(r.metadata->'rules') = 0 THEN 'MISSING_ELIMINATION_RULES'
          ELSE 'VALID'
        END as validation_status
      FROM core_relationships r
      WHERE r.relationship_type = 'ENTITY_ELIMINATES_WITH'
        AND r.smart_code = 'HERA.CONSOL.REL.ENTITY_ELIMINATES_WITH.V3'
        AND r.is_active = true
        AND (
          r.from_entity_id = ANY(
            SELECT (jsonb_array_elements(v_cached_members)->>'member_entity_id')::uuid
          ) OR
          r.to_entity_id = ANY(
            SELECT (jsonb_array_elements(v_cached_members)->>'member_entity_id')::uuid
          )
        )
    )
    SELECT COUNT(CASE WHEN ep.validation_status = 'VALID' THEN 1 END)
    INTO v_elimination_pairs_validated
    FROM elimination_pairs ep;

    -- ============================================================================
    -- 5) Build Preparation Summary
    -- ============================================================================
    
    v_preparation_summary := jsonb_build_object(
      'group_id', p_group_id,
      'group_name', v_group_entity.entity_name,
      'period', p_period,
      'base_currency', p_base_currency,
      'member_count', v_member_count,
      'fx_pairs_validated', v_fx_pairs_validated,
      'elimination_pairs_validated', v_elimination_pairs_validated,
      'policy_violations', COALESCE(v_policy_violations, '[]'),
      'validation_passed', CASE 
        WHEN jsonb_array_length(COALESCE(v_policy_violations, '[]')) = 0 THEN true 
        ELSE false 
      END,
      'cached_members', v_cached_members,
      'fx_rates', v_fx_rates,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

    -- ============================================================================
    -- 6) Create Preparation Transaction Record
    -- ============================================================================
    
    INSERT INTO universal_transactions (
      id,
      organization_id,
      transaction_type,
      transaction_code,
      transaction_date,
      total_amount,
      currency,
      status,
      smart_code,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_run_id,
      v_group_entity.organization_id,
      'CONSOL_PREP',
      'PREP-' || p_period || '-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      0, -- Preparation has no amount
      p_base_currency,
      CASE 
        WHEN (v_preparation_summary->>'validation_passed')::boolean THEN 'COMPLETED'
        ELSE 'VALIDATION_FAILED'
      END,
      'HERA.CONSOL.PREP.RUN.V3',
      jsonb_build_object(
        'preparation_summary', v_preparation_summary,
        'actor_id', p_actor_id,
        'validation_mode', p_validation_mode
      ),
      now(),
      now()
    );

    -- ============================================================================
    -- 7) Create Preparation Detail Lines
    -- ============================================================================
    
    -- Create a line for each validated member
    FOR rec IN 
      SELECT 
        (jsonb_array_elements(v_cached_members)->>'member_entity_id')::uuid as member_id,
        jsonb_array_elements(v_cached_members)->>'member_name' as member_name,
        jsonb_array_elements(v_cached_members)->>'validation_status' as status
    LOOP
      INSERT INTO universal_transaction_lines (
        id,
        transaction_id,
        line_number,
        line_type,
        line_entity_id,
        quantity,
        unit_price,
        line_amount,
        currency,
        smart_code,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_run_id,
        (SELECT COUNT(*) + 1 FROM universal_transaction_lines WHERE transaction_id = v_run_id),
        'PREP_MEMBER_VALIDATION',
        rec.member_id,
        1,
        0,
        0,
        p_base_currency,
        'HERA.CONSOL.PREP.MEMBER.V3',
        jsonb_build_object(
          'member_name', rec.member_name,
          'validation_status', rec.status,
          'preparation_run_id', v_run_id,
          'period', p_period
        ),
        now(),
        now()
      );
    END LOOP;

    -- ============================================================================
    -- 8) Return Preparation Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'run_id', v_run_id,
      'group_id', p_group_id,
      'period', p_period,
      'preparation_summary', v_preparation_summary,
      'validation_passed', (v_preparation_summary->>'validation_passed')::boolean,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.CONSOL.PREP.RUN.V3'
    );

  EXCEPTION WHEN OTHERS THEN
    
    -- ============================================================================
    -- Error Handling
    -- ============================================================================
    
    GET STACKED DIAGNOSTICS 
      v_error_code = RETURNED_SQLSTATE,
      v_error_message = MESSAGE_TEXT;

    -- Log error in audit trail
    INSERT INTO universal_transactions (
      id,
      organization_id,
      transaction_type,
      transaction_code,
      transaction_date,
      status,
      smart_code,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_run_id,
      v_group_entity.organization_id,
      'CONSOL_PREP',
      'PREP-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.CONSOL.PREP.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'group_id', p_group_id,
        'period', p_period,
        'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
        'actor_id', p_actor_id
      ),
      now(),
      now()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error_code', v_error_code,
      'error_message', v_error_message,
      'run_id', v_run_id,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

  END;

END;
$$;

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Index for group member relationships
CREATE INDEX IF NOT EXISTS idx_relationships_group_members 
ON core_relationships (from_entity_id, relationship_type)
WHERE relationship_type = 'GROUP_HAS_MEMBER';

-- Index for elimination pairs
CREATE INDEX IF NOT EXISTS idx_relationships_elimination_pairs 
ON core_relationships (relationship_type, from_entity_id, to_entity_id)
WHERE relationship_type = 'ENTITY_ELIMINATES_WITH';

-- Index for currency pair entities
CREATE INDEX IF NOT EXISTS idx_entities_currency_pairs 
ON core_entities (entity_type, entity_code, organization_id)
WHERE entity_type = 'CURRENCY_PAIR';

-- Index for FX rate dynamic data
CREATE INDEX IF NOT EXISTS idx_dynamic_data_fx_rates 
ON core_dynamic_data (entity_id, field_name)
WHERE field_name LIKE 'rate_%';

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_consol_prepare_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_consol_prepare_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_consol_prepare_v3 IS 'HERA Finance DNA v3.4: Prepare consolidation structure, validate policies, FX rates, and cache member lists for IFRS 10 compliant multi-entity consolidation. Validates group members, ownership percentages, consolidation methods, FX rate availability, and elimination pair definitions.';