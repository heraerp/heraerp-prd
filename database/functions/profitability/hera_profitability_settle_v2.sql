-- ============================================================================
-- HERA Profitability v2: Settlement RPC Function
-- 
-- WIP/Project/Order balance settlement processing with GL account mapping,
-- balanced journal generation, and complete audit trail.
-- 
-- Smart Code: HERA.PROFITABILITY.SETTLE.RPC.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_profitability_settle_v2(
  p_organization_id UUID,
  p_actor_entity_id UUID,
  p_period TEXT,
  p_policy_ref TEXT,
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  run_id UUID,
  lines_processed INTEGER,
  amount_settled DECIMAL,
  currencies TEXT[],
  dimensions_completed INTEGER,
  txn_ids UUID[],
  status TEXT,
  execution_time_ms INTEGER,
  errors TEXT[],
  warnings TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
  v_run_start TIMESTAMP;
  v_run_end TIMESTAMP;
  v_policy JSONB;
  v_settlement_config JSONB;
  v_source_lines INTEGER := 0;
  v_total_settled DECIMAL := 0.00;
  v_currencies TEXT[] := ARRAY[]::TEXT[];
  v_dimensions_count INTEGER := 0;
  v_transaction_ids UUID[] := ARRAY[]::UUID[];
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_status TEXT := 'SUCCESS';
  
  -- Settlement variables
  v_settlement_entries JSONB[] := ARRAY[]::JSONB[];
  v_source_balance RECORD;
  v_receiver_account_id UUID;
  
  -- Transaction variables
  v_txn_header_id UUID;
  v_line_counter INTEGER := 0;
  v_smart_code TEXT := 'HERA.PROFITABILITY.SETTLE.RUN.V2';
  
BEGIN
  v_run_start := clock_timestamp();
  v_run_id := gen_random_uuid();
  
  -- ========================================================================
  -- Input Validation
  -- ========================================================================
  
  IF p_organization_id IS NULL THEN
    v_errors := array_append(v_errors, 'ERR_PROFITABILITY_ORG_REQUIRED: Organization ID is required');
  END IF;
  
  IF p_period IS NULL OR p_period !~ '^\d{4}-\d{2}$' THEN
    v_errors := array_append(v_errors, 'ERR_PROFITABILITY_PERIOD_INVALID: Period must be in YYYY-MM format');
  END IF;
  
  IF p_policy_ref IS NULL OR length(trim(p_policy_ref)) = 0 THEN
    v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_REQUIRED: Policy reference is required');
  END IF;
  
  -- Return early if basic validation fails
  IF array_length(v_errors, 1) > 0 THEN
    v_status := 'FAILED';
    RETURN QUERY SELECT 
      v_run_id, 0, 0.00::DECIMAL, ARRAY[]::TEXT[], 0, ARRAY[]::UUID[], 
      v_status, 0, v_errors, v_warnings;
    RETURN;
  END IF;
  
  -- ========================================================================
  -- Load Settlement Policy
  -- ========================================================================
  
  BEGIN
    -- Load policy from core_dynamic_data
    SELECT dd.field_value_json INTO v_policy
    FROM core_dynamic_data dd
    JOIN core_entities e ON e.id = dd.entity_id
    WHERE e.organization_id = p_organization_id
      AND e.entity_type = 'SETTLEMENT_POLICY'
      AND e.entity_code = p_policy_ref
      AND e.status = 'ACTIVE'
      AND dd.field_name = 'policy_definition'
    LIMIT 1;
    
    IF v_policy IS NULL THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_NOT_FOUND: Settlement policy not found: ' || p_policy_ref);
      v_status := 'FAILED';
      RETURN QUERY SELECT 
        v_run_id, 0, 0.00::DECIMAL, ARRAY[]::TEXT[], 0, ARRAY[]::UUID[], 
        v_status, 0, v_errors, v_warnings;
      RETURN;
    END IF;
    
    -- Extract settlement configuration
    v_settlement_config := v_policy;
    
    IF v_settlement_config IS NULL THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_INVALID: Policy must have settlement configuration');
      v_status := 'FAILED';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_LOAD: Failed to load policy: ' || SQLERRM);
      v_status := 'FAILED';
  END;
  
  -- Return early if policy loading fails
  IF v_status = 'FAILED' THEN
    RETURN QUERY SELECT 
      v_run_id, 0, 0.00::DECIMAL, ARRAY[]::TEXT[], 0, ARRAY[]::UUID[], 
      v_status, 0, v_errors, v_warnings;
    RETURN;
  END IF;
  
  -- ========================================================================
  -- Process Project Settlement
  -- ========================================================================
  
  IF v_settlement_config ? 'project_settlement' THEN
    
    DECLARE
      v_project_config JSONB;
      v_receiver_type TEXT;
      v_basis TEXT;
      v_threshold DECIMAL;
    BEGIN
      
      v_project_config := v_settlement_config->'project_settlement';
      v_receiver_type := v_project_config->>'receiver';
      v_basis := v_project_config->>'basis';
      v_threshold := COALESCE((v_project_config->>'threshold')::DECIMAL, 0.01);
      
      -- Find WIP balances for projects
      FOR v_source_balance IN
        SELECT 
          proj.id as project_id,
          proj.entity_code as project_code,
          utl.currency,
          SUM(utl.amount_dr - utl.amount_cr) as balance_amount,
          COUNT(*) as line_count
        FROM core_entities proj
        JOIN universal_transaction_lines utl ON utl.project_id = proj.id
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        LEFT JOIN core_entities acc ON acc.id = utl.gl_account_id
        LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
          AND dd_acc_group.field_name = 'account_group'
        WHERE proj.organization_id = p_organization_id
          AND proj.entity_type = 'PROJECT'
          AND proj.status = 'ACTIVE'
          AND ut.organization_id = p_organization_id
          AND date_trunc('month', ut.posted_at) = (p_period || '-01')::DATE
          AND dd_acc_group.field_value_text = 'WIP'
        GROUP BY proj.id, proj.entity_code, utl.currency
        HAVING SUM(utl.amount_dr - utl.amount_cr) != 0
          AND ABS(SUM(utl.amount_dr - utl.amount_cr)) >= v_threshold
      LOOP
        
        v_source_lines := v_source_lines + 1;
        v_total_settled := v_total_settled + ABS(v_source_balance.balance_amount);
        
        -- Add currency to list
        IF NOT (v_source_balance.currency = ANY(v_currencies)) THEN
          v_currencies := array_append(v_currencies, v_source_balance.currency);
        END IF;
        
        -- Determine receiver account based on policy
        CASE v_receiver_type
          WHEN 'COGS' THEN
            -- Settle to COGS account
            SELECT id INTO v_receiver_account_id
            FROM core_entities acc
            LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
              AND dd_acc_group.field_name = 'account_group'
            WHERE acc.organization_id = p_organization_id
              AND acc.entity_type = 'GL_ACCOUNT'
              AND acc.status = 'ACTIVE'
              AND dd_acc_group.field_value_text = 'COGS'
            LIMIT 1;
            
          WHEN 'PC' THEN
            -- Settle to main profit center
            SELECT id INTO v_receiver_account_id
            FROM core_entities acc
            LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
              AND dd_acc_group.field_name = 'account_group'
            WHERE acc.organization_id = p_organization_id
              AND acc.entity_type = 'GL_ACCOUNT'
              AND acc.status = 'ACTIVE'
              AND dd_acc_group.field_value_text = 'OPEX'
            LIMIT 1;
            
          ELSE
            -- Default to COGS
            SELECT id INTO v_receiver_account_id
            FROM core_entities acc
            LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
              AND dd_acc_group.field_name = 'account_group'
            WHERE acc.organization_id = p_organization_id
              AND acc.entity_type = 'GL_ACCOUNT'
              AND acc.status = 'ACTIVE'
              AND dd_acc_group.field_value_text = 'COGS'
            LIMIT 1;
        END CASE;
        
        IF v_receiver_account_id IS NOT NULL THEN
          
          -- Credit WIP account (reduce balance)
          v_settlement_entries := array_append(v_settlement_entries, jsonb_build_object(
            'line_number', v_line_counter + 1,
            'gl_account_id', (
              SELECT id FROM core_entities acc
              LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
                AND dd_acc_group.field_name = 'account_group'
              WHERE acc.organization_id = p_organization_id
                AND acc.entity_type = 'GL_ACCOUNT'
                AND acc.status = 'ACTIVE'
                AND dd_acc_group.field_value_text = 'WIP'
              LIMIT 1
            ),
            'project_id', v_source_balance.project_id,
            'amount_dr', CASE WHEN v_source_balance.balance_amount > 0 THEN 0 ELSE ABS(v_source_balance.balance_amount) END,
            'amount_cr', CASE WHEN v_source_balance.balance_amount > 0 THEN v_source_balance.balance_amount ELSE 0 END,
            'currency', v_source_balance.currency,
            'description', 'Project Settlement: ' || v_source_balance.project_code || ' WIP to ' || v_receiver_type,
            'smart_code', v_smart_code
          ));
          
          -- Debit receiver account (add expense/cost)
          v_settlement_entries := array_append(v_settlement_entries, jsonb_build_object(
            'line_number', v_line_counter + 2,
            'gl_account_id', v_receiver_account_id,
            'project_id', v_source_balance.project_id,
            'amount_dr', CASE WHEN v_source_balance.balance_amount > 0 THEN v_source_balance.balance_amount ELSE 0 END,
            'amount_cr', CASE WHEN v_source_balance.balance_amount > 0 THEN 0 ELSE ABS(v_source_balance.balance_amount) END,
            'currency', v_source_balance.currency,
            'description', 'Project Settlement: ' || v_source_balance.project_code || ' from WIP',
            'smart_code', v_smart_code
          ));
          
          v_line_counter := v_line_counter + 2;
          v_dimensions_count := v_dimensions_count + 1;
          
        ELSE
          v_warnings := array_append(v_warnings, 'No receiver account found for project settlement: ' || v_source_balance.project_code);
        END IF;
        
      END LOOP;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_SETTLE_PROJECT: Failed to process project settlement: ' || SQLERRM);
        v_status := 'PARTIAL';
    END;
    
  END IF;
  
  -- ========================================================================
  -- Process Variance Settlement
  -- ========================================================================
  
  IF v_settlement_config ? 'variance_settlement' THEN
    
    DECLARE
      v_variance_config JSONB;
      v_variance_receiver TEXT;
      v_inventory_share DECIMAL;
      v_variance_balance RECORD;
    BEGIN
      
      v_variance_config := v_settlement_config->'variance_settlement';
      v_variance_receiver := v_variance_config->>'receiver';
      v_inventory_share := COALESCE((v_variance_config->>'inventory_share')::DECIMAL, 0.0);
      
      -- Find variance account balances
      FOR v_variance_balance IN
        SELECT 
          acc.id as account_id,
          acc.entity_code as account_code,
          utl.currency,
          SUM(utl.amount_dr - utl.amount_cr) as balance_amount,
          COUNT(*) as line_count
        FROM core_entities acc
        JOIN universal_transaction_lines utl ON utl.gl_account_id = acc.id
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
          AND dd_acc_group.field_name = 'account_group'
        WHERE acc.organization_id = p_organization_id
          AND acc.entity_type = 'GL_ACCOUNT'
          AND acc.status = 'ACTIVE'
          AND ut.organization_id = p_organization_id
          AND date_trunc('month', ut.posted_at) = (p_period || '-01')::DATE
          AND (
            acc.entity_code LIKE '%VARIANCE%'
            OR dd_acc_group.field_value_text = 'VARIANCE'
          )
        GROUP BY acc.id, acc.entity_code, utl.currency
        HAVING SUM(utl.amount_dr - utl.amount_cr) != 0
      LOOP
        
        v_source_lines := v_source_lines + 1;
        v_total_settled := v_total_settled + ABS(v_variance_balance.balance_amount);
        
        -- Add currency to list
        IF NOT (v_variance_balance.currency = ANY(v_currencies)) THEN
          v_currencies := array_append(v_currencies, v_variance_balance.currency);
        END IF;
        
        -- Determine receiver account
        CASE v_variance_receiver
          WHEN 'INVENTORY' THEN
            SELECT id INTO v_receiver_account_id
            FROM core_entities acc
            LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
              AND dd_acc_group.field_name = 'account_group'
            WHERE acc.organization_id = p_organization_id
              AND acc.entity_type = 'GL_ACCOUNT'
              AND acc.status = 'ACTIVE'
              AND dd_acc_group.field_value_text = 'INVENTORY'
            LIMIT 1;
            
          ELSE -- 'COGS'
            SELECT id INTO v_receiver_account_id
            FROM core_entities acc
            LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
              AND dd_acc_group.field_name = 'account_group'
            WHERE acc.organization_id = p_organization_id
              AND acc.entity_type = 'GL_ACCOUNT'
              AND acc.status = 'ACTIVE'
              AND dd_acc_group.field_value_text = 'COGS'
            LIMIT 1;
        END CASE;
        
        IF v_receiver_account_id IS NOT NULL THEN
          
          -- Credit variance account (clear balance)
          v_settlement_entries := array_append(v_settlement_entries, jsonb_build_object(
            'line_number', v_line_counter + 1,
            'gl_account_id', v_variance_balance.account_id,
            'amount_dr', CASE WHEN v_variance_balance.balance_amount > 0 THEN 0 ELSE ABS(v_variance_balance.balance_amount) END,
            'amount_cr', CASE WHEN v_variance_balance.balance_amount > 0 THEN v_variance_balance.balance_amount ELSE 0 END,
            'currency', v_variance_balance.currency,
            'description', 'Variance Settlement: ' || v_variance_balance.account_code || ' to ' || v_variance_receiver,
            'smart_code', v_smart_code
          ));
          
          -- Debit receiver account
          v_settlement_entries := array_append(v_settlement_entries, jsonb_build_object(
            'line_number', v_line_counter + 2,
            'gl_account_id', v_receiver_account_id,
            'amount_dr', CASE WHEN v_variance_balance.balance_amount > 0 THEN v_variance_balance.balance_amount ELSE 0 END,
            'amount_cr', CASE WHEN v_variance_balance.balance_amount > 0 THEN 0 ELSE ABS(v_variance_balance.balance_amount) END,
            'currency', v_variance_balance.currency,
            'description', 'Variance Settlement: ' || v_variance_balance.account_code || ' from variance',
            'smart_code', v_smart_code
          ));
          
          v_line_counter := v_line_counter + 2;
          v_dimensions_count := v_dimensions_count + 1;
          
        ELSE
          v_warnings := array_append(v_warnings, 'No receiver account found for variance settlement: ' || v_variance_balance.account_code);
        END IF;
        
      END LOOP;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_SETTLE_VARIANCE: Failed to process variance settlement: ' || SQLERRM);
        v_status := 'PARTIAL';
    END;
    
  END IF;
  
  -- ========================================================================
  -- Create Transaction Header and Lines (if not dry run)
  -- ========================================================================
  
  IF NOT p_dry_run AND array_length(v_settlement_entries, 1) > 0 THEN
    
    BEGIN
      -- Create transaction header
      INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        transaction_date,
        posted_at,
        reference_number,
        total_amount,
        currency,
        from_entity_id,
        metadata
      ) VALUES (
        p_organization_id,
        'profitability_settlement',
        v_smart_code,
        (p_period || '-01')::DATE,
        now(),
        'SETTLE-' || p_period || '-' || extract(epoch from now())::TEXT,
        v_total_settled,
        v_currencies[1], -- Primary currency
        p_actor_entity_id,
        jsonb_build_object(
          'run_id', v_run_id,
          'period', p_period,
          'policy_ref', p_policy_ref,
          'settlement_type', 'PROJECT_VARIANCE',
          'lines_processed', v_source_lines,
          'dimensions_completed', v_dimensions_count
        )
      ) RETURNING id INTO v_txn_header_id;
      
      -- Create transaction lines
      DECLARE
        v_entry JSONB;
      BEGIN
        FOR v_entry IN SELECT * FROM unnest(v_settlement_entries) LOOP
          
          INSERT INTO universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            gl_account_id,
            project_id,
            amount_dr,
            amount_cr,
            currency,
            description,
            smart_code
          ) VALUES (
            p_organization_id,
            v_txn_header_id,
            (v_entry->>'line_number')::INTEGER,
            (v_entry->>'gl_account_id')::UUID,
            (v_entry->>'project_id')::UUID,
            (v_entry->>'amount_dr')::DECIMAL,
            (v_entry->>'amount_cr')::DECIMAL,
            v_entry->>'currency',
            v_entry->>'description',
            v_entry->>'smart_code'
          );
          
        END LOOP;
      END;
      
      v_transaction_ids := array_append(v_transaction_ids, v_txn_header_id);
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_TXN_CREATE: Failed to create settlement transaction: ' || SQLERRM);
        v_status := 'FAILED';
    END;
    
  END IF;
  
  -- ========================================================================
  -- Create Run Audit Record
  -- ========================================================================
  
  BEGIN
    INSERT INTO universal_transactions (
      organization_id,
      transaction_type,
      smart_code,
      transaction_date,
      posted_at,
      reference_number,
      total_amount,
      from_entity_id,
      metadata
    ) VALUES (
      p_organization_id,
      'profitability_run_audit',
      'HERA.PROFITABILITY.RUN.AUDIT.V2',
      (p_period || '-01')::DATE,
      now(),
      'AUDIT-SETTLE-' || v_run_id::TEXT,
      0.00,
      p_actor_entity_id,
      jsonb_build_object(
        'run_id', v_run_id,
        'run_type', 'SETTLEMENT',
        'period', p_period,
        'policy_ref', p_policy_ref,
        'dry_run', p_dry_run,
        'status', v_status,
        'lines_processed', v_source_lines,
        'amount_settled', v_total_settled,
        'currencies', v_currencies,
        'dimensions_completed', v_dimensions_count,
        'transaction_ids', v_transaction_ids,
        'errors', v_errors,
        'warnings', v_warnings,
        'execution_time_ms', extract(epoch from (clock_timestamp() - v_run_start)) * 1000
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Don't fail the entire operation for audit issues
      v_warnings := array_append(v_warnings, 'Failed to create audit record: ' || SQLERRM);
  END;
  
  -- ========================================================================
  -- Return Results
  -- ========================================================================
  
  v_run_end := clock_timestamp();
  
  RETURN QUERY SELECT 
    v_run_id,
    v_source_lines,
    v_total_settled,
    v_currencies,
    v_dimensions_count,
    v_transaction_ids,
    v_status,
    (extract(epoch from (v_run_end - v_run_start)) * 1000)::INTEGER,
    v_errors,
    v_warnings;
  
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION hera_profitability_settle_v2(UUID, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION hera_profitability_settle_v2(UUID, UUID, TEXT, TEXT, BOOLEAN) IS 
'HERA Profitability v2: WIP/Project/Order balance settlement processing with GL account mapping and balanced journal generation. Processes project and variance settlements according to policy configuration with complete audit trail.';