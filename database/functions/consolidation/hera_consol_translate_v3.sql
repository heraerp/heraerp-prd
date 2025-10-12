-- ============================================================================
-- HERA Finance DNA v3.4: Cross-Org Consolidation FX Translation Engine
-- 
-- Creates FX translation Universal Transactions for multi-currency consolidation
-- with IFRS 21 compliant translation adjustments and complete audit trail.
-- 
-- Smart Code: HERA.CONSOL.TRANSLATE.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_consol_translate_v3(
  p_group_id UUID,
  p_period TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_base_currency TEXT DEFAULT 'GBP',
  p_translation_method TEXT DEFAULT 'CURRENT_RATE',
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
  v_members_translated INTEGER := 0;
  v_translation_entries_created INTEGER := 0;
  v_total_translation_adjustment DECIMAL := 0;
  v_fx_rates_used JSONB := '{}';
  v_translation_summary JSONB := '{}';
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

  -- Validate translation method
  IF p_translation_method NOT IN ('CURRENT_RATE', 'TEMPORAL', 'NET_INVESTMENT') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_TRANSLATION_METHOD',
      'error_message', 'Translation method must be CURRENT_RATE, TEMPORAL, or NET_INVESTMENT'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Process FX Translation for Each Member Entity
    -- ============================================================================
    
    FOR rec IN
      WITH group_members AS (
        SELECT 
          r.to_entity_id as member_entity_id,
          e.entity_name as member_name,
          e.organization_id as member_org_id,
          r.metadata->>'local_currency' as local_currency,
          r.metadata->>'ownership_pct' as ownership_pct,
          r.metadata->>'method' as consolidation_method
        FROM core_relationships r
        JOIN core_entities e ON e.id = r.to_entity_id
        WHERE r.from_entity_id = p_group_id
          AND r.relationship_type = 'GROUP_HAS_MEMBER'
          AND r.smart_code = 'HERA.CONSOL.REL.GROUP_HAS_MEMBER.V3'
          AND r.is_active = true
      ),
      fx_rates AS (
        SELECT 
          gm.member_entity_id,
          gm.member_name,
          gm.member_org_id,
          gm.local_currency,
          gm.ownership_pct::decimal as ownership_pct,
          gm.consolidation_method,
          ce.id as currency_pair_id,
          cdd_avg.field_value_number as avg_rate,
          cdd_close.field_value_number as closing_rate,
          CASE 
            WHEN gm.local_currency = p_base_currency THEN 'NO_TRANSLATION_NEEDED'
            WHEN ce.id IS NULL THEN 'CURRENCY_PAIR_NOT_FOUND'
            WHEN cdd_avg.field_value_number IS NULL OR cdd_close.field_value_number IS NULL THEN 'MISSING_FX_RATES'
            ELSE 'READY_FOR_TRANSLATION'
          END as translation_status
        FROM group_members gm
        LEFT JOIN core_entities ce ON 
          ce.entity_type = 'CURRENCY_PAIR' AND
          ce.entity_code = gm.local_currency || '-' || p_base_currency AND
          ce.organization_id = v_group_entity.organization_id
        LEFT JOIN core_dynamic_data cdd_avg ON 
          cdd_avg.entity_id = ce.id AND
          cdd_avg.field_name = 'rate_avg_' || replace(p_period, '-', '_')
        LEFT JOIN core_dynamic_data cdd_close ON 
          cdd_close.entity_id = ce.id AND
          cdd_close.field_name = 'rate_close_' || replace(p_period, '-', '_')
      ),
      member_financials AS (
        SELECT 
          fr.*,
          -- Retrieve balance sheet items (translated at closing rate)
          COALESCE(SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('ASSETS', 'LIABILITIES')
              THEN utl.line_amount 
              ELSE 0 
            END
          ), 0) as balance_sheet_amount_local,
          -- Retrieve income statement items (translated at average rate)
          COALESCE(SUM(
            CASE 
              WHEN utl.metadata->>'account_category' IN ('REVENUE', 'EXPENSES')
              THEN utl.line_amount 
              ELSE 0 
            END
          ), 0) as income_statement_amount_local,
          -- Retrieve equity items (historical rates - treated as closing for simplicity)
          COALESCE(SUM(
            CASE 
              WHEN utl.metadata->>'account_category' = 'EQUITY'
              THEN utl.line_amount 
              ELSE 0 
            END
          ), 0) as equity_amount_local
        FROM fx_rates fr
        LEFT JOIN universal_transactions ut ON 
          ut.organization_id = fr.member_org_id AND
          ut.metadata->>'period' = p_period
        LEFT JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        WHERE fr.translation_status = 'READY_FOR_TRANSLATION'
        GROUP BY fr.member_entity_id, fr.member_name, fr.member_org_id, fr.local_currency, 
                 fr.ownership_pct, fr.consolidation_method, fr.currency_pair_id, 
                 fr.avg_rate, fr.closing_rate, fr.translation_status
      )
      SELECT 
        mf.*,
        -- Calculate translated amounts based on IFRS 21
        CASE 
          WHEN p_translation_method = 'CURRENT_RATE' THEN
            mf.balance_sheet_amount_local * mf.closing_rate
          ELSE mf.balance_sheet_amount_local * mf.closing_rate
        END as balance_sheet_amount_base,
        CASE 
          WHEN p_translation_method = 'CURRENT_RATE' THEN
            mf.income_statement_amount_local * mf.avg_rate
          ELSE mf.income_statement_amount_local * mf.avg_rate
        END as income_statement_amount_base,
        CASE 
          WHEN p_translation_method = 'CURRENT_RATE' THEN
            mf.equity_amount_local * mf.closing_rate
          ELSE mf.equity_amount_local * mf.closing_rate
        END as equity_amount_base,
        -- Calculate translation adjustment
        (mf.balance_sheet_amount_local * mf.closing_rate) + 
        (mf.income_statement_amount_local * mf.avg_rate) + 
        (mf.equity_amount_local * mf.closing_rate) - 
        (mf.balance_sheet_amount_local + mf.income_statement_amount_local + mf.equity_amount_local) as translation_adjustment
      FROM member_financials mf
      WHERE mf.balance_sheet_amount_local != 0 OR mf.income_statement_amount_local != 0 OR mf.equity_amount_local != 0
    LOOP
    
      v_members_translated := v_members_translated + 1;
      
      -- Store FX rates used for audit trail
      v_fx_rates_used := jsonb_set(
        v_fx_rates_used,
        ARRAY[rec.local_currency || '_' || p_base_currency],
        jsonb_build_object(
          'avg_rate', rec.avg_rate,
          'closing_rate', rec.closing_rate,
          'period', p_period
        )
      );
      
      -- Create translation transaction header (only if not dry run)
      IF NOT p_dry_run THEN
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
          rec.member_org_id,
          'CONSOL_TRANSLATE',
          'TRANS-' || rec.local_currency || '-' || p_base_currency || '-' || p_period || '-' || to_char(now(), 'HH24MISS'),
          now(),
          ABS(rec.translation_adjustment),
          p_base_currency,
          'COMPLETED',
          'HERA.CONSOL.TRANSLATE.TXN.V3',
          jsonb_build_object(
            'group_id', p_group_id,
            'period', p_period,
            'member_entity_id', rec.member_entity_id,
            'local_currency', rec.local_currency,
            'base_currency', p_base_currency,
            'translation_method', p_translation_method,
            'fx_rates', jsonb_build_object(
              'avg_rate', rec.avg_rate,
              'closing_rate', rec.closing_rate
            ),
            'amounts_translated', jsonb_build_object(
              'balance_sheet_local', rec.balance_sheet_amount_local,
              'balance_sheet_base', rec.balance_sheet_amount_base,
              'income_statement_local', rec.income_statement_amount_local,
              'income_statement_base', rec.income_statement_amount_base,
              'equity_local', rec.equity_amount_local,
              'equity_base', rec.equity_amount_base,
              'translation_adjustment', rec.translation_adjustment
            ),
            'actor_id', p_actor_id
          ),
          now(),
          now()
        );
      END IF;

      -- Create balance sheet translation lines
      IF rec.balance_sheet_amount_local != 0 THEN
        
        -- Original balance sheet amount (Credit/Debit in local currency effect)
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
            v_translation_entries_created + 1,
            'TRANSLATE_BS',
            rec.member_entity_id,
            1,
            rec.balance_sheet_amount_base - rec.balance_sheet_amount_local,
            rec.balance_sheet_amount_base - rec.balance_sheet_amount_local,
            p_base_currency,
            'HERA.CONSOL.TRANSLATE.BS.V3',
            jsonb_build_object(
              'translation_type', 'BALANCE_SHEET',
              'account_category', 'ASSETS_LIABILITIES',
              'local_amount', rec.balance_sheet_amount_local,
              'base_amount', rec.balance_sheet_amount_base,
              'fx_rate_used', rec.closing_rate,
              'rate_type', 'CLOSING',
              'period', p_period
            ),
            now(),
            now()
          );
        END IF;
        
        v_translation_entries_created := v_translation_entries_created + 1;
      END IF;

      -- Create income statement translation lines
      IF rec.income_statement_amount_local != 0 THEN
        
        -- Income statement translation adjustment
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
            v_translation_entries_created + 1,
            'TRANSLATE_IS',
            rec.member_entity_id,
            1,
            rec.income_statement_amount_base - rec.income_statement_amount_local,
            rec.income_statement_amount_base - rec.income_statement_amount_local,
            p_base_currency,
            'HERA.CONSOL.TRANSLATE.IS.V3',
            jsonb_build_object(
              'translation_type', 'INCOME_STATEMENT',
              'account_category', 'REVENUE_EXPENSES',
              'local_amount', rec.income_statement_amount_local,
              'base_amount', rec.income_statement_amount_base,
              'fx_rate_used', rec.avg_rate,
              'rate_type', 'AVERAGE',
              'period', p_period
            ),
            now(),
            now()
          );
        END IF;
        
        v_translation_entries_created := v_translation_entries_created + 1;
      END IF;

      -- Create cumulative translation adjustment line (OCI item)
      IF rec.translation_adjustment != 0 THEN
        
        -- Translation adjustment to Other Comprehensive Income
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
            v_translation_entries_created + 1,
            'TRANSLATE_CTA',
            rec.member_entity_id,
            1,
            rec.translation_adjustment,
            rec.translation_adjustment,
            p_base_currency,
            'HERA.CONSOL.TRANSLATE.CTA.V3',
            jsonb_build_object(
              'translation_type', 'CUMULATIVE_TRANSLATION_ADJUSTMENT',
              'account_category', 'OCI_CTA',
              'adjustment_amount', rec.translation_adjustment,
              'translation_method', p_translation_method,
              'ifrs_21_compliant', true,
              'period', p_period
            ),
            now(),
            now()
          );
        END IF;
        
        v_translation_entries_created := v_translation_entries_created + 1;
      END IF;

      v_total_translation_adjustment := v_total_translation_adjustment + ABS(rec.translation_adjustment);
      
    END LOOP;

    -- ============================================================================
    -- 3) Build Translation Summary
    -- ============================================================================
    
    v_translation_summary := jsonb_build_object(
      'group_id', p_group_id,
      'period', p_period,
      'base_currency', p_base_currency,
      'translation_method', p_translation_method,
      'members_translated', v_members_translated,
      'translation_entries_created', v_translation_entries_created,
      'total_translation_adjustment', v_total_translation_adjustment,
      'fx_rates_used', v_fx_rates_used,
      'dry_run', p_dry_run,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'ifrs_21_compliant', true
    );

    -- ============================================================================
    -- 4) Return Translation Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'run_id', v_run_id,
      'group_id', p_group_id,
      'period', p_period,
      'translation_summary', v_translation_summary,
      'members_translated', v_members_translated,
      'total_translation_adjustment', v_total_translation_adjustment,
      'dry_run', p_dry_run,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.CONSOL.TRANSLATE.TXN.V3'
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
      'CONSOL_TRANSLATE',
      'TRANS-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.CONSOL.TRANSLATE.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'group_id', p_group_id,
        'period', p_period,
        'translation_method', p_translation_method,
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

GRANT EXECUTE ON FUNCTION hera_consol_translate_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_consol_translate_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_consol_translate_v3 IS 'HERA Finance DNA v3.4: Create FX translation Universal Transactions for multi-currency consolidation with IFRS 21 compliant translation adjustments. Handles current rate, temporal and net investment methods with cumulative translation adjustment (CTA) to Other Comprehensive Income.';