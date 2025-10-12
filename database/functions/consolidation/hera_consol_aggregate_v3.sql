-- ============================================================================
-- HERA Finance DNA v3.4: Cross-Org Consolidation Aggregation Engine
-- 
-- Creates consolidated aggregation Universal Transactions combining member entity
-- financial data with elimination and translation adjustments for final consolidated view.
-- 
-- Smart Code: HERA.CONSOL.AGGREGATE.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_consol_aggregate_v3(
  p_group_id UUID,
  p_period TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_base_currency TEXT DEFAULT 'GBP',
  p_consolidation_level TEXT DEFAULT 'FULL',
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_group_entity RECORD;
  v_members_aggregated INTEGER := 0;
  v_aggregate_entries_created INTEGER := 0;
  v_total_consolidated_amount DECIMAL := 0;
  v_total_elimination_amount DECIMAL := 0;
  v_total_translation_amount DECIMAL := 0;
  v_aggregation_summary JSONB := '{}';
  v_consolidated_balances JSONB := '{}';
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
      'error_message', 'Consolidation group not found'
    );
  END IF;

  -- Validate consolidation level
  IF p_consolidation_level NOT IN ('FULL', 'PROPORTIONATE', 'EQUITY') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_CONSOLIDATION_LEVEL',
      'error_message', 'Consolidation level must be FULL, PROPORTIONATE, or EQUITY'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Aggregate Financial Data from All Member Entities
    -- ============================================================================
    
    FOR rec IN
      WITH group_members AS (
        SELECT 
          r.to_entity_id as member_entity_id,
          e.entity_name as member_name,
          e.organization_id as member_org_id,
          (r.metadata->>'ownership_pct')::decimal as ownership_pct,
          r.metadata->>'method' as consolidation_method,
          r.metadata->>'local_currency' as local_currency
        FROM core_relationships r
        JOIN core_entities e ON e.id = r.to_entity_id
        WHERE r.from_entity_id = p_group_id
          AND r.relationship_type = 'GROUP_HAS_MEMBER'
          AND r.smart_code = 'HERA.CONSOL.REL.GROUP_HAS_MEMBER.V3'
          AND r.is_active = true
      ),
      member_original_data AS (
        SELECT 
          gm.member_entity_id,
          gm.member_name,
          gm.member_org_id,
          gm.ownership_pct,
          gm.consolidation_method,
          gm.local_currency,
          utl.metadata->>'account_category' as account_category,
          utl.metadata->>'gl_account_id' as gl_account_id,
          utl.metadata->>'gl_account_code' as gl_account_code,
          utl.metadata->>'gl_account_name' as gl_account_name,
          -- Sum original amounts by account
          SUM(
            CASE 
              WHEN ut.transaction_type NOT IN ('CONSOL_ELIM', 'CONSOL_TRANSLATE') 
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as original_amount,
          -- Sum elimination adjustments
          SUM(
            CASE 
              WHEN ut.transaction_type = 'CONSOL_ELIM' 
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as elimination_amount,
          -- Sum translation adjustments
          SUM(
            CASE 
              WHEN ut.transaction_type = 'CONSOL_TRANSLATE' 
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as translation_amount
        FROM group_members gm
        JOIN universal_transactions ut ON 
          ut.organization_id = gm.member_org_id AND
          ut.metadata->>'period' = p_period
        JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        WHERE utl.metadata->>'gl_account_id' IS NOT NULL
        GROUP BY gm.member_entity_id, gm.member_name, gm.member_org_id, gm.ownership_pct, 
                 gm.consolidation_method, gm.local_currency, utl.metadata->>'account_category',
                 utl.metadata->>'gl_account_id', utl.metadata->>'gl_account_code', 
                 utl.metadata->>'gl_account_name'
      ),
      consolidated_amounts AS (
        SELECT 
          mod.*,
          -- Calculate consolidated amount based on consolidation method
          CASE 
            WHEN mod.consolidation_method = 'FULL' OR p_consolidation_level = 'FULL' THEN
              mod.original_amount + mod.elimination_amount + mod.translation_amount
            WHEN mod.consolidation_method = 'PROPORTIONATE' OR p_consolidation_level = 'PROPORTIONATE' THEN
              (mod.original_amount + mod.elimination_amount + mod.translation_amount) * (mod.ownership_pct / 100.0)
            WHEN mod.consolidation_method = 'EQUITY' OR p_consolidation_level = 'EQUITY' THEN
              -- Equity method: only proportionate share of net income
              CASE 
                WHEN mod.account_category IN ('REVENUE', 'EXPENSES') THEN
                  (mod.original_amount + mod.elimination_amount + mod.translation_amount) * (mod.ownership_pct / 100.0)
                ELSE 0
              END
            ELSE mod.original_amount + mod.elimination_amount + mod.translation_amount
          END as consolidated_amount,
          -- Calculate non-controlling interest (NCI) portion
          CASE 
            WHEN mod.consolidation_method = 'FULL' AND mod.ownership_pct < 100 THEN
              (mod.original_amount + mod.elimination_amount + mod.translation_amount) * ((100.0 - mod.ownership_pct) / 100.0)
            ELSE 0
          END as nci_amount
        FROM member_original_data mod
      )
      SELECT 
        ca.*,
        -- Group by GL account for final aggregation
        ROW_NUMBER() OVER (ORDER BY ca.gl_account_code) as line_number
      FROM consolidated_amounts ca
      WHERE ca.consolidated_amount != 0 OR ca.nci_amount != 0
      ORDER BY ca.gl_account_code, ca.account_category
    LOOP
    
      v_members_aggregated := v_members_aggregated + 1;
      
      -- Create aggregation transaction header (only if not dry run and first member)
      IF NOT p_dry_run AND v_members_aggregated = 1 THEN
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
          'CONSOL_AGGREGATE',
          'AGG-' || p_period || '-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
          now(),
          0, -- Will be updated after all lines are created
          p_base_currency,
          'COMPLETED',
          'HERA.CONSOL.AGGREGATE.TXN.V3',
          jsonb_build_object(
            'group_id', p_group_id,
            'period', p_period,
            'consolidation_level', p_consolidation_level,
            'base_currency', p_base_currency,
            'aggregation_summary', jsonb_build_object(
              'processing_started_at', v_start_time,
              'members_to_aggregate', (
                SELECT COUNT(*) 
                FROM core_relationships 
                WHERE from_entity_id = p_group_id 
                  AND relationship_type = 'GROUP_HAS_MEMBER'
                  AND is_active = true
              )
            ),
            'actor_id', p_actor_id
          ),
          now(),
          now()
        );
      END IF;

      -- Create consolidated balance line (consolidated amount)
      IF rec.consolidated_amount != 0 THEN
        
        IF NOT p_dry_run THEN
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
            rec.line_number,
            'CONSOL_BALANCE',
            rec.member_entity_id,
            1,
            rec.consolidated_amount,
            rec.consolidated_amount,
            p_base_currency,
            'HERA.CONSOL.AGGREGATE.BALANCE.V3',
            jsonb_build_object(
              'aggregation_type', 'CONSOLIDATED_BALANCE',
              'gl_account_id', rec.gl_account_id,
              'gl_account_code', rec.gl_account_code,
              'gl_account_name', rec.gl_account_name,
              'account_category', rec.account_category,
              'member_entity_id', rec.member_entity_id,
              'member_name', rec.member_name,
              'ownership_pct', rec.ownership_pct,
              'consolidation_method', rec.consolidation_method,
              'amounts_breakdown', jsonb_build_object(
                'original_amount', rec.original_amount,
                'elimination_amount', rec.elimination_amount,
                'translation_amount', rec.translation_amount,
                'consolidated_amount', rec.consolidated_amount
              ),
              'period', p_period
            ),
            now(),
            now()
          );
        END IF;
        
        v_aggregate_entries_created := v_aggregate_entries_created + 1;
        v_total_consolidated_amount := v_total_consolidated_amount + ABS(rec.consolidated_amount);
      END IF;

      -- Create non-controlling interest line (if applicable)
      IF rec.nci_amount != 0 THEN
        
        IF NOT p_dry_run THEN
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
            rec.line_number + 1000, -- Offset NCI lines
            'CONSOL_NCI',
            rec.member_entity_id,
            1,
            rec.nci_amount,
            rec.nci_amount,
            p_base_currency,
            'HERA.CONSOL.AGGREGATE.NCI.V3',
            jsonb_build_object(
              'aggregation_type', 'NON_CONTROLLING_INTEREST',
              'gl_account_id', rec.gl_account_id,
              'gl_account_code', rec.gl_account_code,
              'gl_account_name', rec.gl_account_name,
              'account_category', rec.account_category,
              'member_entity_id', rec.member_entity_id,
              'member_name', rec.member_name,
              'ownership_pct', rec.ownership_pct,
              'nci_percentage', 100.0 - rec.ownership_pct,
              'nci_amount', rec.nci_amount,
              'period', p_period
            ),
            now(),
            now()
          );
        END IF;
        
        v_aggregate_entries_created := v_aggregate_entries_created + 1;
      END IF;

      -- Accumulate totals for summary
      v_total_elimination_amount := v_total_elimination_amount + ABS(rec.elimination_amount);
      v_total_translation_amount := v_total_translation_amount + ABS(rec.translation_amount);
      
    END LOOP;

    -- ============================================================================
    -- 3) Update Transaction Header with Total Amount
    -- ============================================================================
    
    IF NOT p_dry_run THEN
      UPDATE universal_transactions 
      SET 
        total_amount = v_total_consolidated_amount,
        metadata = metadata || jsonb_build_object(
          'aggregation_summary', jsonb_build_object(
            'members_aggregated', v_members_aggregated,
            'aggregate_entries_created', v_aggregate_entries_created,
            'total_consolidated_amount', v_total_consolidated_amount,
            'total_elimination_amount', v_total_elimination_amount,
            'total_translation_amount', v_total_translation_amount,
            'processing_completed_at', clock_timestamp()
          )
        )
      WHERE id = v_run_id;
    END IF;

    -- ============================================================================
    -- 4) Generate Consolidated Balances Summary
    -- ============================================================================
    
    WITH consolidated_summary AS (
      SELECT 
        utl.metadata->>'account_category' as account_category,
        SUM(
          CASE 
            WHEN utl.line_type = 'CONSOL_BALANCE' 
            THEN utl.line_amount 
            ELSE 0 
          END
        ) as total_consolidated,
        SUM(
          CASE 
            WHEN utl.line_type = 'CONSOL_NCI' 
            THEN utl.line_amount 
            ELSE 0 
          END
        ) as total_nci,
        COUNT(CASE WHEN utl.line_type = 'CONSOL_BALANCE' THEN 1 END) as balance_lines,
        COUNT(CASE WHEN utl.line_type = 'CONSOL_NCI' THEN 1 END) as nci_lines
      FROM universal_transaction_lines utl
      WHERE utl.transaction_id = v_run_id
      GROUP BY utl.metadata->>'account_category'
    )
    SELECT jsonb_object_agg(
      cs.account_category,
      jsonb_build_object(
        'total_consolidated', cs.total_consolidated,
        'total_nci', cs.total_nci,
        'balance_lines', cs.balance_lines,
        'nci_lines', cs.nci_lines
      )
    ) INTO v_consolidated_balances
    FROM consolidated_summary cs;

    -- ============================================================================
    -- 5) Build Aggregation Summary
    -- ============================================================================
    
    v_aggregation_summary := jsonb_build_object(
      'group_id', p_group_id,
      'period', p_period,
      'consolidation_level', p_consolidation_level,
      'base_currency', p_base_currency,
      'members_aggregated', v_members_aggregated,
      'aggregate_entries_created', v_aggregate_entries_created,
      'totals', jsonb_build_object(
        'total_consolidated_amount', v_total_consolidated_amount,
        'total_elimination_amount', v_total_elimination_amount,
        'total_translation_amount', v_total_translation_amount
      ),
      'consolidated_balances_by_category', COALESCE(v_consolidated_balances, '{}'),
      'dry_run', p_dry_run,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

    -- ============================================================================
    -- 6) Return Aggregation Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'run_id', v_run_id,
      'group_id', p_group_id,
      'period', p_period,
      'aggregation_summary', v_aggregation_summary,
      'members_aggregated', v_members_aggregated,
      'total_consolidated_amount', v_total_consolidated_amount,
      'consolidated_balances', v_consolidated_balances,
      'dry_run', p_dry_run,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.CONSOL.AGGREGATE.TXN.V3'
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
      'CONSOL_AGGREGATE',
      'AGG-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.CONSOL.AGGREGATE.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'group_id', p_group_id,
        'period', p_period,
        'consolidation_level', p_consolidation_level,
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
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_consol_aggregate_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_consol_aggregate_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_consol_aggregate_v3 IS 'HERA Finance DNA v3.4: Create consolidated aggregation Universal Transactions combining member entity financial data with elimination and translation adjustments. Supports full, proportionate and equity consolidation methods with non-controlling interest calculations.';