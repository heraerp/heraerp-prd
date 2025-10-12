-- ============================================================================
-- HERA Finance DNA v3.4: Cross-Org Consolidation Reconciliation Engine
-- 
-- Creates reconciliation Universal Transactions to validate and balance consolidation
-- entries ensuring mathematical accuracy and IFRS 10 compliance verification.
-- 
-- Smart Code: HERA.CONSOL.RECONCILE.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_consol_reconcile_v3(
  p_group_id UUID,
  p_period TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_base_currency TEXT DEFAULT 'GBP',
  p_tolerance_amount DECIMAL DEFAULT 0.01,
  p_auto_adjust BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_group_entity RECORD;
  v_reconciliation_checks INTEGER := 0;
  v_reconciliation_entries_created INTEGER := 0;
  v_total_variance_amount DECIMAL := 0;
  v_max_variance_amount DECIMAL := 0;
  v_reconciliation_passed BOOLEAN := true;
  v_reconciliation_summary JSONB := '{}';
  v_balance_checks JSONB := '[]';
  v_variance_details JSONB := '[]';
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

  -- Validate tolerance amount
  IF p_tolerance_amount < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_TOLERANCE',
      'error_message', 'Tolerance amount must be non-negative'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Perform Consolidation Reconciliation Checks
    -- ============================================================================
    
    FOR rec IN
      WITH consolidation_transactions AS (
        SELECT 
          ut.id as transaction_id,
          ut.transaction_type,
          ut.transaction_code,
          ut.total_amount,
          ut.metadata,
          ut.created_at,
          SUM(utl.line_amount) as lines_total,
          COUNT(utl.id) as line_count,
          ut.total_amount - SUM(utl.line_amount) as variance_amount
        FROM universal_transactions ut
        JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        WHERE ut.organization_id = v_group_entity.organization_id
          AND ut.metadata->>'group_id' = p_group_id::text
          AND ut.metadata->>'period' = p_period
          AND ut.transaction_type IN ('CONSOL_PREP', 'CONSOL_ELIM', 'CONSOL_TRANSLATE', 'CONSOL_AGGREGATE')
          AND ut.status = 'COMPLETED'
        GROUP BY ut.id, ut.transaction_type, ut.transaction_code, ut.total_amount, ut.metadata, ut.created_at
      ),
      balance_sheet_reconciliation AS (
        SELECT 
          'BALANCE_SHEET_RECONCILIATION' as check_type,
          SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('ASSETS')
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as total_assets,
          SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('LIABILITIES')
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as total_liabilities,
          SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('EQUITY')
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as total_equity,
          -- Assets = Liabilities + Equity check
          SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('ASSETS')
              THEN utl.line_amount 
              ELSE 0 
            END
          ) - SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('LIABILITIES', 'EQUITY')
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as balance_variance
        FROM universal_transactions ut
        JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        WHERE ut.organization_id = v_group_entity.organization_id
          AND ut.metadata->>'group_id' = p_group_id::text
          AND ut.metadata->>'period' = p_period
          AND ut.transaction_type = 'CONSOL_AGGREGATE'
          AND utl.line_type = 'CONSOL_BALANCE'
      ),
      elimination_balance_check AS (
        SELECT 
          'ELIMINATION_BALANCE_CHECK' as check_type,
          COUNT(*) as elimination_transactions,
          SUM(ut.total_amount) as total_elimination_amount,
          SUM(
            CASE 
              WHEN utl.line_type LIKE 'ELIM_%'
              THEN utl.line_amount 
              ELSE 0 
            END
          ) as elimination_lines_total,
          SUM(ut.total_amount) - SUM(
            CASE 
              WHEN utl.line_type LIKE 'ELIM_%'
              THEN ABS(utl.line_amount)
              ELSE 0 
            END
          ) as elimination_variance
        FROM universal_transactions ut
        JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        WHERE ut.organization_id = v_group_entity.organization_id
          AND ut.metadata->>'group_id' = p_group_id::text
          AND ut.metadata->>'period' = p_period
          AND ut.transaction_type = 'CONSOL_ELIM'
      ),
      translation_balance_check AS (
        SELECT 
          'TRANSLATION_BALANCE_CHECK' as check_type,
          COUNT(*) as translation_transactions,
          SUM(ut.total_amount) as total_translation_amount,
          SUM(
            CASE 
              WHEN utl.line_type LIKE 'TRANSLATE_%'
              THEN ABS(utl.line_amount)
              ELSE 0 
            END
          ) as translation_lines_total,
          SUM(ut.total_amount) - SUM(
            CASE 
              WHEN utl.line_type LIKE 'TRANSLATE_%'
              THEN ABS(utl.line_amount)
              ELSE 0 
            END
          ) as translation_variance
        FROM universal_transactions ut
        JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        WHERE ut.organization_id = v_group_entity.organization_id
          AND ut.metadata->>'group_id' = p_group_id::text
          AND ut.metadata->>'period' = p_period
          AND ut.transaction_type = 'CONSOL_TRANSLATE'
      ),
      all_checks AS (
        -- Individual transaction balance checks
        SELECT 
          ct.transaction_type as check_type,
          ct.transaction_code,
          ct.total_amount,
          ct.lines_total,
          ct.variance_amount,
          ABS(ct.variance_amount) as abs_variance,
          CASE 
            WHEN ABS(ct.variance_amount) <= p_tolerance_amount THEN 'PASS'
            ELSE 'FAIL'
          END as check_status,
          jsonb_build_object(
            'transaction_id', ct.transaction_id,
            'transaction_code', ct.transaction_code,
            'total_amount', ct.total_amount,
            'lines_total', ct.lines_total,
            'variance_amount', ct.variance_amount,
            'line_count', ct.line_count
          ) as check_details
        FROM consolidation_transactions ct
        
        UNION ALL
        
        -- Balance sheet reconciliation
        SELECT 
          bsr.check_type,
          'N/A' as transaction_code,
          bsr.total_assets as total_amount,
          bsr.total_liabilities + bsr.total_equity as lines_total,
          bsr.balance_variance as variance_amount,
          ABS(bsr.balance_variance) as abs_variance,
          CASE 
            WHEN ABS(bsr.balance_variance) <= p_tolerance_amount THEN 'PASS'
            ELSE 'FAIL'
          END as check_status,
          jsonb_build_object(
            'total_assets', bsr.total_assets,
            'total_liabilities', bsr.total_liabilities,
            'total_equity', bsr.total_equity,
            'balance_variance', bsr.balance_variance
          ) as check_details
        FROM balance_sheet_reconciliation bsr
        
        UNION ALL
        
        -- Elimination balance check
        SELECT 
          ebc.check_type,
          'N/A' as transaction_code,
          ebc.total_elimination_amount as total_amount,
          ebc.elimination_lines_total as lines_total,
          ebc.elimination_variance as variance_amount,
          ABS(ebc.elimination_variance) as abs_variance,
          CASE 
            WHEN ABS(ebc.elimination_variance) <= p_tolerance_amount THEN 'PASS'
            ELSE 'FAIL'
          END as check_status,
          jsonb_build_object(
            'elimination_transactions', ebc.elimination_transactions,
            'total_elimination_amount', ebc.total_elimination_amount,
            'elimination_lines_total', ebc.elimination_lines_total,
            'elimination_variance', ebc.elimination_variance
          ) as check_details
        FROM elimination_balance_check ebc
        
        UNION ALL
        
        -- Translation balance check
        SELECT 
          tbc.check_type,
          'N/A' as transaction_code,
          tbc.total_translation_amount as total_amount,
          tbc.translation_lines_total as lines_total,
          tbc.translation_variance as variance_amount,
          ABS(tbc.translation_variance) as abs_variance,
          CASE 
            WHEN ABS(tbc.translation_variance) <= p_tolerance_amount THEN 'PASS'
            ELSE 'FAIL'
          END as check_status,
          jsonb_build_object(
            'translation_transactions', tbc.translation_transactions,
            'total_translation_amount', tbc.total_translation_amount,
            'translation_lines_total', tbc.translation_lines_total,
            'translation_variance', tbc.translation_variance
          ) as check_details
        FROM translation_balance_check tbc
      )
      SELECT 
        ac.*,
        ROW_NUMBER() OVER (ORDER BY ac.abs_variance DESC) as variance_rank
      FROM all_checks ac
      ORDER BY ac.abs_variance DESC, ac.check_type
    LOOP
    
      v_reconciliation_checks := v_reconciliation_checks + 1;
      
      -- Track maximum variance
      IF rec.abs_variance > v_max_variance_amount THEN
        v_max_variance_amount := rec.abs_variance;
      END IF;
      
      -- Accumulate total variance
      v_total_variance_amount := v_total_variance_amount + rec.abs_variance;
      
      -- Check if reconciliation passes
      IF rec.check_status = 'FAIL' THEN
        v_reconciliation_passed := false;
      END IF;
      
      -- Build balance check record
      v_balance_checks := v_balance_checks || jsonb_build_object(
        'check_type', rec.check_type,
        'transaction_code', rec.transaction_code,
        'variance_amount', rec.variance_amount,
        'abs_variance', rec.abs_variance,
        'check_status', rec.check_status,
        'variance_rank', rec.variance_rank,
        'tolerance_amount', p_tolerance_amount,
        'check_details', rec.check_details
      );
      
      -- Create adjustment entry if auto-adjust is enabled and variance exceeds tolerance
      IF p_auto_adjust AND rec.abs_variance > p_tolerance_amount THEN
        
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
          v_reconciliation_entries_created + 1,
          'RECONCILE_ADJUST',
          v_group_entity.id,
          1,
          -rec.variance_amount, -- Reverse the variance
          -rec.variance_amount,
          p_base_currency,
          'HERA.CONSOL.RECONCILE.ADJUST.V3',
          jsonb_build_object(
            'reconciliation_type', 'AUTO_ADJUSTMENT',
            'check_type', rec.check_type,
            'original_variance', rec.variance_amount,
            'adjustment_amount', -rec.variance_amount,
            'transaction_code', rec.transaction_code,
            'period', p_period,
            'tolerance_exceeded', true,
            'auto_adjust_enabled', p_auto_adjust
          ),
          now(),
          now()
        );
        
        v_reconciliation_entries_created := v_reconciliation_entries_created + 1;
      END IF;
      
    END LOOP;

    -- ============================================================================
    -- 3) Create Reconciliation Transaction Header
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
      'CONSOL_RECONCILE',
      'RECON-' || p_period || '-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      v_total_variance_amount,
      p_base_currency,
      CASE 
        WHEN v_reconciliation_passed THEN 'COMPLETED'
        ELSE 'RECONCILIATION_FAILED'
      END,
      'HERA.CONSOL.RECONCILE.TXN.V3',
      jsonb_build_object(
        'group_id', p_group_id,
        'period', p_period,
        'reconciliation_summary', jsonb_build_object(
          'reconciliation_checks', v_reconciliation_checks,
          'reconciliation_entries_created', v_reconciliation_entries_created,
          'total_variance_amount', v_total_variance_amount,
          'max_variance_amount', v_max_variance_amount,
          'reconciliation_passed', v_reconciliation_passed,
          'tolerance_amount', p_tolerance_amount,
          'auto_adjust_enabled', p_auto_adjust,
          'ifrs_10_compliant', v_reconciliation_passed
        ),
        'balance_checks', v_balance_checks,
        'actor_id', p_actor_id
      ),
      now(),
      now()
    );

    -- ============================================================================
    -- 4) Generate Variance Details
    -- ============================================================================
    
    WITH variance_summary AS (
      SELECT 
        bc->>'check_type' as check_type,
        COUNT(*) as checks_count,
        SUM((bc->>'abs_variance')::decimal) as total_variance,
        AVG((bc->>'abs_variance')::decimal) as avg_variance,
        MAX((bc->>'abs_variance')::decimal) as max_variance,
        COUNT(CASE WHEN bc->>'check_status' = 'FAIL' THEN 1 END) as failed_checks,
        COUNT(CASE WHEN bc->>'check_status' = 'PASS' THEN 1 END) as passed_checks
      FROM jsonb_array_elements(v_balance_checks) bc
      GROUP BY bc->>'check_type'
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'check_type', vs.check_type,
        'checks_count', vs.checks_count,
        'total_variance', vs.total_variance,
        'avg_variance', vs.avg_variance,
        'max_variance', vs.max_variance,
        'failed_checks', vs.failed_checks,
        'passed_checks', vs.passed_checks,
        'pass_rate_pct', ROUND((vs.passed_checks::decimal / vs.checks_count * 100), 2)
      )
    ) INTO v_variance_details
    FROM variance_summary vs;

    -- ============================================================================
    -- 5) Build Reconciliation Summary
    -- ============================================================================
    
    v_reconciliation_summary := jsonb_build_object(
      'group_id', p_group_id,
      'period', p_period,
      'base_currency', p_base_currency,
      'reconciliation_checks', v_reconciliation_checks,
      'reconciliation_entries_created', v_reconciliation_entries_created,
      'reconciliation_passed', v_reconciliation_passed,
      'variance_summary', jsonb_build_object(
        'total_variance_amount', v_total_variance_amount,
        'max_variance_amount', v_max_variance_amount,
        'tolerance_amount', p_tolerance_amount,
        'tolerance_exceeded', v_max_variance_amount > p_tolerance_amount
      ),
      'auto_adjust_enabled', p_auto_adjust,
      'ifrs_10_compliant', v_reconciliation_passed,
      'balance_checks', v_balance_checks,
      'variance_details_by_type', COALESCE(v_variance_details, '[]'),
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

    -- ============================================================================
    -- 6) Return Reconciliation Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'run_id', v_run_id,
      'group_id', p_group_id,
      'period', p_period,
      'reconciliation_summary', v_reconciliation_summary,
      'reconciliation_passed', v_reconciliation_passed,
      'total_variance_amount', v_total_variance_amount,
      'max_variance_amount', v_max_variance_amount,
      'tolerance_amount', p_tolerance_amount,
      'auto_adjustments_made', v_reconciliation_entries_created,
      'ifrs_10_compliant', v_reconciliation_passed,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.CONSOL.RECONCILE.TXN.V3'
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
      'CONSOL_RECONCILE',
      'RECON-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.CONSOL.RECONCILE.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'group_id', p_group_id,
        'period', p_period,
        'tolerance_amount', p_tolerance_amount,
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

GRANT EXECUTE ON FUNCTION hera_consol_reconcile_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_consol_reconcile_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_consol_reconcile_v3 IS 'HERA Finance DNA v3.4: Create reconciliation Universal Transactions to validate and balance consolidation entries. Performs balance sheet reconciliation, elimination balance checks, translation variance validation with optional auto-adjustment for IFRS 10 compliance verification.';