-- ============================================================================
-- HERA Finance DNA v3.4: Cross-Org Consolidation Elimination Engine
-- 
-- Creates elimination Universal Transactions for intercompany balances and P&L
-- with balanced entries ensuring IFRS 10 compliance and complete audit trail.
-- 
-- Smart Code: HERA.CONSOL.ELIM.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_consol_eliminate_v3(
  p_group_id UUID,
  p_period TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_base_currency TEXT DEFAULT 'GBP',
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
  v_elimination_pairs_processed INTEGER := 0;
  v_elimination_entries_created INTEGER := 0;
  v_total_eliminated_amount DECIMAL := 0;
  v_balance_check_passed BOOLEAN := true;
  v_elimination_summary JSONB := '{}';
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

  BEGIN

    -- ============================================================================
    -- 2) Process Intercompany Eliminations
    -- ============================================================================
    
    FOR rec IN
      WITH elimination_pairs AS (
        SELECT 
          r.from_entity_id as entity_a,
          r.to_entity_id as entity_b,
          r.metadata->>'pair_code' as pair_code,
          r.metadata->'rules' as elimination_rules,
          e_a.entity_name as entity_a_name,
          e_b.entity_name as entity_b_name,
          e_a.organization_id as org_id
        FROM core_relationships r
        JOIN core_entities e_a ON e_a.id = r.from_entity_id
        JOIN core_entities e_b ON e_b.id = r.to_entity_id
        WHERE r.relationship_type = 'ENTITY_ELIMINATES_WITH'
          AND r.smart_code = 'HERA.CONSOL.REL.ENTITY_ELIMINATES_WITH.V3'
          AND r.is_active = true
          AND (
            r.from_entity_id IN (
              SELECT gm.to_entity_id 
              FROM core_relationships gm 
              WHERE gm.from_entity_id = p_group_id 
                AND gm.relationship_type = 'GROUP_HAS_MEMBER'
            ) OR
            r.to_entity_id IN (
              SELECT gm.to_entity_id 
              FROM core_relationships gm 
              WHERE gm.from_entity_id = p_group_id 
                AND gm.relationship_type = 'GROUP_HAS_MEMBER'
            )
          )
      ),
      intercompany_transactions AS (
        SELECT 
          ep.entity_a,
          ep.entity_b,
          ep.pair_code,
          ep.elimination_rules,
          ep.entity_a_name,
          ep.entity_b_name,
          ep.org_id,
          -- Calculate intercompany sales (Entity A to Entity B)
          COALESCE(SUM(
            CASE 
              WHEN ut.metadata->>'from_entity_id' = ep.entity_a::text 
                AND ut.metadata->>'to_entity_id' = ep.entity_b::text
                AND utl.metadata->>'account_group' = 'REVENUE'
              THEN utl.line_amount
              ELSE 0
            END
          ), 0) as ic_sales_a_to_b,
          -- Calculate intercompany purchases (Entity B from Entity A)
          COALESCE(SUM(
            CASE 
              WHEN ut.metadata->>'from_entity_id' = ep.entity_a::text 
                AND ut.metadata->>'to_entity_id' = ep.entity_b::text
                AND utl.metadata->>'account_group' = 'COGS'
              THEN utl.line_amount
              ELSE 0
            END
          ), 0) as ic_purchases_b_from_a,
          -- Calculate intercompany receivables (Entity A from Entity B)
          COALESCE(SUM(
            CASE 
              WHEN ut.metadata->>'from_entity_id' = ep.entity_a::text 
                AND ut.metadata->>'to_entity_id' = ep.entity_b::text
                AND utl.metadata->>'account_group' = 'AR'
              THEN utl.line_amount
              ELSE 0
            END
          ), 0) as ic_receivables_a_from_b,
          -- Calculate intercompany payables (Entity B to Entity A)
          COALESCE(SUM(
            CASE 
              WHEN ut.metadata->>'from_entity_id' = ep.entity_b::text 
                AND ut.metadata->>'to_entity_id' = ep.entity_a::text
                AND utl.metadata->>'account_group' = 'AP'
              THEN utl.line_amount
              ELSE 0
            END
          ), 0) as ic_payables_b_to_a
        FROM elimination_pairs ep
        LEFT JOIN universal_transactions ut ON 
          ut.organization_id = ep.org_id AND
          ut.metadata->>'period' = p_period AND
          (
            (ut.metadata->>'from_entity_id' = ep.entity_a::text AND ut.metadata->>'to_entity_id' = ep.entity_b::text) OR
            (ut.metadata->>'from_entity_id' = ep.entity_b::text AND ut.metadata->>'to_entity_id' = ep.entity_a::text)
          )
        LEFT JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
        GROUP BY ep.entity_a, ep.entity_b, ep.pair_code, ep.elimination_rules, ep.entity_a_name, ep.entity_b_name, ep.org_id
      )
      SELECT 
        ict.*,
        -- Calculate net elimination amounts
        GREATEST(ict.ic_sales_a_to_b, ict.ic_purchases_b_from_a) as net_revenue_elimination,
        GREATEST(ict.ic_receivables_a_from_b, ict.ic_payables_b_to_a) as net_balance_elimination,
        -- Check if elimination is needed
        (ict.ic_sales_a_to_b > 0 OR ict.ic_purchases_b_from_a > 0 OR 
         ict.ic_receivables_a_from_b > 0 OR ict.ic_payables_b_to_a > 0) as needs_elimination
      FROM intercompany_transactions ict
      WHERE (ict.ic_sales_a_to_b > 0 OR ict.ic_purchases_b_from_a > 0 OR 
             ict.ic_receivables_a_from_b > 0 OR ict.ic_payables_b_to_a > 0)
    LOOP
    
      v_elimination_pairs_processed := v_elimination_pairs_processed + 1;
      
      -- Create elimination transaction header (only if not dry run)
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
          rec.org_id,
          'CONSOL_ELIM',
          'ELIM-' || rec.pair_code || '-' || p_period || '-' || to_char(now(), 'HH24MISS'),
          now(),
          rec.net_revenue_elimination + rec.net_balance_elimination,
          p_base_currency,
          'COMPLETED',
          'HERA.CONSOL.ELIM.TXN.V3',
          jsonb_build_object(
            'group_id', p_group_id,
            'period', p_period,
            'entity_a', rec.entity_a,
            'entity_b', rec.entity_b,
            'pair_code', rec.pair_code,
            'elimination_summary', jsonb_build_object(
              'ic_sales_a_to_b', rec.ic_sales_a_to_b,
              'ic_purchases_b_from_a', rec.ic_purchases_b_from_a,
              'ic_receivables_a_from_b', rec.ic_receivables_a_from_b,
              'ic_payables_b_to_a', rec.ic_payables_b_to_a,
              'net_revenue_elimination', rec.net_revenue_elimination,
              'net_balance_elimination', rec.net_balance_elimination
            ),
            'actor_id', p_actor_id
          ),
          now(),
          now()
        );
      END IF;

      -- Create revenue elimination entries (if needed)
      IF rec.net_revenue_elimination > 0 THEN
        
        -- Eliminate intercompany revenue (Credit Revenue)
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
            v_elimination_entries_created + 1,
            'ELIM_REVENUE',
            rec.entity_a, -- Entity A (seller)
            1,
            -rec.net_revenue_elimination, -- Credit (eliminate revenue)
            -rec.net_revenue_elimination,
            p_base_currency,
            'HERA.CONSOL.ELIM.REVENUE.V3',
            jsonb_build_object(
              'elimination_type', 'INTERCOMPANY_REVENUE',
              'pair_code', rec.pair_code,
              'entity_role', 'SELLER',
              'counterparty_entity_id', rec.entity_b,
              'period', p_period,
              'original_amount', rec.ic_sales_a_to_b
            ),
            now(),
            now()
          );
        END IF;
        
        v_elimination_entries_created := v_elimination_entries_created + 1;

        -- Eliminate intercompany COGS (Debit COGS)
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
            v_elimination_entries_created + 1,
            'ELIM_COGS',
            rec.entity_b, -- Entity B (buyer)
            1,
            rec.net_revenue_elimination, -- Debit (eliminate COGS)
            rec.net_revenue_elimination,
            p_base_currency,
            'HERA.CONSOL.ELIM.COGS.V3',
            jsonb_build_object(
              'elimination_type', 'INTERCOMPANY_COGS',
              'pair_code', rec.pair_code,
              'entity_role', 'BUYER',
              'counterparty_entity_id', rec.entity_a,
              'period', p_period,
              'original_amount', rec.ic_purchases_b_from_a
            ),
            now(),
            now()
          );
        END IF;
        
        v_elimination_entries_created := v_elimination_entries_created + 1;
      END IF;

      -- Create balance sheet elimination entries (if needed)
      IF rec.net_balance_elimination > 0 THEN
        
        -- Eliminate intercompany receivables (Credit AR)
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
            v_elimination_entries_created + 1,
            'ELIM_RECEIVABLES',
            rec.entity_a, -- Entity A (creditor)
            1,
            -rec.net_balance_elimination, -- Credit (eliminate receivables)
            -rec.net_balance_elimination,
            p_base_currency,
            'HERA.CONSOL.ELIM.AR.V3',
            jsonb_build_object(
              'elimination_type', 'INTERCOMPANY_RECEIVABLES',
              'pair_code', rec.pair_code,
              'entity_role', 'CREDITOR',
              'counterparty_entity_id', rec.entity_b,
              'period', p_period,
              'original_amount', rec.ic_receivables_a_from_b
            ),
            now(),
            now()
          );
        END IF;
        
        v_elimination_entries_created := v_elimination_entries_created + 1;

        -- Eliminate intercompany payables (Debit AP)
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
            v_elimination_entries_created + 1,
            'ELIM_PAYABLES',
            rec.entity_b, -- Entity B (debtor)
            1,
            rec.net_balance_elimination, -- Debit (eliminate payables)
            rec.net_balance_elimination,
            p_base_currency,
            'HERA.CONSOL.ELIM.AP.V3',
            jsonb_build_object(
              'elimination_type', 'INTERCOMPANY_PAYABLES',
              'pair_code', rec.pair_code,
              'entity_role', 'DEBTOR',
              'counterparty_entity_id', rec.entity_a,
              'period', p_period,
              'original_amount', rec.ic_payables_b_to_a
            ),
            now(),
            now()
          );
        END IF;
        
        v_elimination_entries_created := v_elimination_entries_created + 1;
      END IF;

      v_total_eliminated_amount := v_total_eliminated_amount + rec.net_revenue_elimination + rec.net_balance_elimination;
      
    END LOOP;

    -- ============================================================================
    -- 3) Validate Balanced Eliminations
    -- ============================================================================
    
    WITH elimination_balance_check AS (
      SELECT 
        SUM(utl.line_amount) as total_elimination_balance,
        COUNT(*) as total_elimination_lines
      FROM universal_transaction_lines utl
      WHERE utl.transaction_id = v_run_id
        AND utl.line_type LIKE 'ELIM_%'
    )
    SELECT 
      ABS(ebc.total_elimination_balance) < 0.01, -- Allow for rounding differences
      ebc.total_elimination_balance
    INTO v_balance_check_passed, v_total_eliminated_amount
    FROM elimination_balance_check ebc;

    -- ============================================================================
    -- 4) Build Elimination Summary
    -- ============================================================================
    
    v_elimination_summary := jsonb_build_object(
      'group_id', p_group_id,
      'period', p_period,
      'elimination_pairs_processed', v_elimination_pairs_processed,
      'elimination_entries_created', v_elimination_entries_created,
      'total_eliminated_amount', v_total_eliminated_amount,
      'balance_check_passed', v_balance_check_passed,
      'base_currency', p_base_currency,
      'dry_run', p_dry_run,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

    -- ============================================================================
    -- 5) Return Elimination Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'run_id', v_run_id,
      'group_id', p_group_id,
      'period', p_period,
      'elimination_summary', v_elimination_summary,
      'balance_check_passed', v_balance_check_passed,
      'dry_run', p_dry_run,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.CONSOL.ELIM.TXN.V3'
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
      'CONSOL_ELIM',
      'ELIM-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.CONSOL.ELIM.ERROR.V3',
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
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_consol_eliminate_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_consol_eliminate_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_consol_eliminate_v3 IS 'HERA Finance DNA v3.4: Create elimination Universal Transactions for intercompany balances and P&L with balanced entries ensuring IFRS 10 compliance. Eliminates intercompany revenue/COGS and receivables/payables with complete audit trail.';