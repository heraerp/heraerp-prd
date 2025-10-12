-- ============================================================================
-- HERA Profitability v2: Allocation RPC Function
-- 
-- Atomic allocation processing with allocation driver computation, weight
-- calculation, journal entry generation, and complete audit trail.
-- 
-- Smart Code: HERA.PROFITABILITY.ALLOC.RPC.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_profitability_alloc_v2(
  p_organization_id UUID,
  p_actor_entity_id UUID,
  p_period TEXT,
  p_policy_ref TEXT,
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  run_id UUID,
  lines_processed INTEGER,
  amount_allocated DECIMAL,
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
  v_drivers JSONB;
  v_rules JSONB;
  v_source_lines INTEGER := 0;
  v_total_allocated DECIMAL := 0.00;
  v_currencies TEXT[] := ARRAY[]::TEXT[];
  v_dimensions_count INTEGER := 0;
  v_transaction_ids UUID[] := ARRAY[]::UUID[];
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_status TEXT := 'SUCCESS';
  
  -- Cursor variables
  v_driver RECORD;
  v_rule RECORD;
  v_source_line RECORD;
  v_driver_weights JSONB;
  v_allocation_entries JSONB[] := ARRAY[]::JSONB[];
  
  -- Transaction variables
  v_txn_header_id UUID;
  v_line_counter INTEGER := 0;
  v_smart_code TEXT := 'HERA.PROFITABILITY.ALLOC.DISTRIBUTE.V2';
  
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
  -- Load Allocation Policy
  -- ========================================================================
  
  BEGIN
    -- Load policy from core_dynamic_data
    SELECT dd.field_value_json INTO v_policy
    FROM core_dynamic_data dd
    JOIN core_entities e ON e.id = dd.entity_id
    WHERE e.organization_id = p_organization_id
      AND e.entity_type = 'ALLOCATION_POLICY'
      AND e.entity_code = p_policy_ref
      AND e.status = 'ACTIVE'
      AND dd.field_name = 'policy_definition'
    LIMIT 1;
    
    IF v_policy IS NULL THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_NOT_FOUND: Allocation policy not found: ' || p_policy_ref);
      v_status := 'FAILED';
      RETURN QUERY SELECT 
        v_run_id, 0, 0.00::DECIMAL, ARRAY[]::TEXT[], 0, ARRAY[]::UUID[], 
        v_status, 0, v_errors, v_warnings;
      RETURN;
    END IF;
    
    -- Extract drivers and rules
    v_drivers := v_policy->'drivers';
    v_rules := v_policy->'rules';
    
    IF v_drivers IS NULL OR jsonb_array_length(v_drivers) = 0 THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_INVALID: Policy must have allocation drivers');
      v_status := 'FAILED';
    END IF;
    
    IF v_rules IS NULL OR jsonb_array_length(v_rules) = 0 THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_INVALID: Policy must have allocation rules');
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
  -- Compute Allocation Driver Weights
  -- ========================================================================
  
  v_driver_weights := '{}'::JSONB;
  
  -- Process each driver
  FOR v_driver IN SELECT * FROM jsonb_to_recordset(v_drivers) AS x(
    name TEXT, 
    source TEXT, 
    measure TEXT, 
    periodicity TEXT
  ) LOOP
    
    DECLARE
      v_driver_values JSONB := '[]'::JSONB;
      v_driver_total DECIMAL := 0.00;
      v_receiver RECORD;
    BEGIN
      
      -- Calculate driver values based on source
      CASE v_driver.source
        WHEN 'PC' THEN
          -- Revenue share from profit centers
          IF v_driver.measure = 'Revenue' THEN
            FOR v_receiver IN 
              SELECT 
                pc.id,
                pc.entity_code,
                COALESCE(SUM(
                  CASE WHEN acc.normal_balance = 'Cr' 
                       THEN (utl.amount_cr - utl.amount_dr)
                       ELSE (utl.amount_dr - utl.amount_cr) 
                  END
                ), 0) as value
              FROM core_entities pc
              LEFT JOIN universal_transaction_lines utl ON utl.profit_center_id = pc.id
              LEFT JOIN universal_transactions ut ON ut.id = utl.transaction_id
              LEFT JOIN core_entities acc ON acc.id = utl.gl_account_id
              LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
                AND dd_acc_group.field_name = 'account_group'
              WHERE pc.organization_id = p_organization_id
                AND pc.entity_type = 'PROFIT_CENTER'
                AND pc.status = 'ACTIVE'
                AND ut.organization_id = p_organization_id
                AND date_trunc('month', ut.posted_at) = (p_period || '-01')::DATE
                AND dd_acc_group.field_value_text = 'REVENUE'
              GROUP BY pc.id, pc.entity_code
            LOOP
              v_driver_values := v_driver_values || jsonb_build_object(
                'entity_id', v_receiver.id,
                'entity_code', v_receiver.entity_code,
                'value', v_receiver.value
              );
              v_driver_total := v_driver_total + v_receiver.value;
            END LOOP;
          END IF;
          
        WHEN 'CC' THEN
          -- Headcount from cost centers
          IF v_driver.measure = 'HC' THEN
            FOR v_receiver IN
              SELECT 
                cc.id,
                cc.entity_code,
                COALESCE((dd_hc.field_value_number), 0) as value
              FROM core_entities cc
              LEFT JOIN core_dynamic_data dd_hc ON dd_hc.entity_id = cc.id 
                AND dd_hc.field_name = 'headcount'
              WHERE cc.organization_id = p_organization_id
                AND cc.entity_type = 'COST_CENTER'
                AND cc.status = 'ACTIVE'
            LOOP
              v_driver_values := v_driver_values || jsonb_build_object(
                'entity_id', v_receiver.id,
                'entity_code', v_receiver.entity_code,
                'value', v_receiver.value
              );
              v_driver_total := v_driver_total + v_receiver.value;
            END LOOP;
          END IF;
          
        WHEN 'PRODUCT' THEN
          -- Standard cost share from products
          IF v_driver.measure = 'StdCost' THEN
            FOR v_receiver IN
              SELECT 
                p.id,
                p.entity_code,
                COALESCE((dd_cost.field_value_json->>'total')::DECIMAL, 0) as value
              FROM core_entities p
              LEFT JOIN core_dynamic_data dd_cost ON dd_cost.entity_id = p.id 
                AND dd_cost.field_name = 'std_cost_components'
              WHERE p.organization_id = p_organization_id
                AND p.entity_type = 'PRODUCT'
                AND p.status = 'ACTIVE'
            LOOP
              v_driver_values := v_driver_values || jsonb_build_object(
                'entity_id', v_receiver.id,
                'entity_code', v_receiver.entity_code,
                'value', v_receiver.value
              );
              v_driver_total := v_driver_total + v_receiver.value;
            END LOOP;
          END IF;
      END CASE;
      
      -- Normalize to weights (ensure sum = 1.0)
      IF v_driver_total > 0 THEN
        DECLARE
          v_normalized_values JSONB := '[]'::JSONB;
          v_item JSONB;
        BEGIN
          FOR v_item IN SELECT * FROM jsonb_array_elements(v_driver_values) LOOP
            v_normalized_values := v_normalized_values || jsonb_build_object(
              'entity_id', v_item->>'entity_id',
              'entity_code', v_item->>'entity_code',
              'value', v_item->>'value',
              'weight', (v_item->>'value')::DECIMAL / v_driver_total
            );
          END LOOP;
          
          v_driver_weights := v_driver_weights || jsonb_build_object(
            v_driver.name, v_normalized_values
          );
        END;
      ELSE
        v_warnings := array_append(v_warnings, 'Driver ' || v_driver.name || ' has zero total value');
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_DRIVER_CALC: Failed to calculate driver ' || v_driver.name || ': ' || SQLERRM);
        v_status := 'FAILED';
    END;
    
  END LOOP;
  
  -- ========================================================================
  -- Process Allocation Rules
  -- ========================================================================
  
  FOR v_rule IN SELECT * FROM jsonb_to_recordset(v_rules) AS x(
    name TEXT,
    basis TEXT,
    "from" JSONB,
    "to" JSONB,
    threshold DECIMAL,
    method TEXT
  ) LOOP
    
    DECLARE
      v_basis_weights JSONB;
      v_source_criteria JSONB;
      v_target_criteria JSONB;
    BEGIN
      
      -- Get weights for this rule's basis
      v_basis_weights := v_driver_weights->v_rule.basis;
      
      IF v_basis_weights IS NULL THEN
        v_warnings := array_append(v_warnings, 'Rule ' || v_rule.name || ' references unknown driver: ' || v_rule.basis);
        CONTINUE;
      END IF;
      
      v_source_criteria := v_rule."from";
      v_target_criteria := v_rule."to";
      
      -- Find source transaction lines matching criteria
      FOR v_source_line IN
        SELECT 
          utl.id,
          utl.transaction_id,
          utl.gl_account_id,
          utl.profit_center_id,
          utl.cost_center_id,
          utl.amount_dr,
          utl.amount_cr,
          utl.currency,
          ut.posted_at,
          acc.entity_code as account_code,
          cc.entity_code as cost_center_code,
          pc.entity_code as profit_center_code
        FROM universal_transaction_lines utl
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        LEFT JOIN core_entities acc ON acc.id = utl.gl_account_id
        LEFT JOIN core_entities cc ON cc.id = utl.cost_center_id
        LEFT JOIN core_entities pc ON pc.id = utl.profit_center_id
        LEFT JOIN core_dynamic_data dd_cc_tags ON dd_cc_tags.entity_id = cc.id 
          AND dd_cc_tags.field_name = 'tags'
        LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
          AND dd_acc_group.field_name = 'account_group'
        WHERE ut.organization_id = p_organization_id
          AND date_trunc('month', ut.posted_at) = (p_period || '-01')::DATE
          AND (
            -- Match cost center tags
            (v_source_criteria ? 'cc_tags' AND 
             dd_cc_tags.field_value_json ?| (SELECT array_agg(value::TEXT) FROM jsonb_array_elements_text(v_source_criteria->'cc_tags')))
            OR
            -- Match GL range
            (v_source_criteria ? 'gl_range' AND 
             dd_acc_group.field_value_text = (v_source_criteria->>'gl_range')::TEXT)
          )
      LOOP
        
        v_source_lines := v_source_lines + 1;
        
        -- Calculate source amount
        DECLARE
          v_source_amount DECIMAL;
          v_weight_item JSONB;
          v_allocation_amount DECIMAL;
        BEGIN
          
          v_source_amount := v_source_line.amount_dr - v_source_line.amount_cr;
          v_total_allocated := v_total_allocated + ABS(v_source_amount);
          
          -- Add currency to list
          IF NOT (v_source_line.currency = ANY(v_currencies)) THEN
            v_currencies := array_append(v_currencies, v_source_line.currency);
          END IF;
          
          -- Skip if amount below threshold
          IF v_rule.threshold IS NOT NULL AND ABS(v_source_amount) < v_rule.threshold THEN
            CONTINUE;
          END IF;
          
          -- Create allocation entries for each weight
          FOR v_weight_item IN SELECT * FROM jsonb_array_elements(v_basis_weights) LOOP
            
            v_allocation_amount := v_source_amount * (v_weight_item->>'weight')::DECIMAL;
            
            IF ABS(v_allocation_amount) >= COALESCE(v_rule.threshold, 0.01) THEN
              
              -- Create credit entry (reduce source)
              v_allocation_entries := array_append(v_allocation_entries, jsonb_build_object(
                'line_number', v_line_counter + 1,
                'gl_account_id', v_source_line.gl_account_id,
                'cost_center_id', v_source_line.cost_center_id,
                'profit_center_id', CASE WHEN v_target_criteria->>'pc' = '*' 
                                         THEN (v_weight_item->>'entity_id')::UUID
                                         ELSE v_source_line.profit_center_id END,
                'amount_dr', CASE WHEN v_allocation_amount > 0 THEN 0 ELSE ABS(v_allocation_amount) END,
                'amount_cr', CASE WHEN v_allocation_amount > 0 THEN v_allocation_amount ELSE 0 END,
                'currency', v_source_line.currency,
                'description', 'Allocation: ' || v_rule.name || ' to ' || (v_weight_item->>'entity_code'),
                'smart_code', v_smart_code
              ));
              
              -- Create debit entry (add to receiver)
              v_allocation_entries := array_append(v_allocation_entries, jsonb_build_object(
                'line_number', v_line_counter + 2,
                'gl_account_id', v_source_line.gl_account_id,
                'cost_center_id', CASE WHEN v_target_criteria->>'cc' = '*'
                                       THEN (v_weight_item->>'entity_id')::UUID
                                       ELSE NULL END,
                'profit_center_id', CASE WHEN v_target_criteria->>'pc' = '*' 
                                         THEN (v_weight_item->>'entity_id')::UUID
                                         ELSE v_source_line.profit_center_id END,
                'amount_dr', CASE WHEN v_allocation_amount > 0 THEN v_allocation_amount ELSE 0 END,
                'amount_cr', CASE WHEN v_allocation_amount > 0 THEN 0 ELSE ABS(v_allocation_amount) END,
                'currency', v_source_line.currency,
                'description', 'Allocation: ' || v_rule.name || ' from ' || COALESCE(v_source_line.cost_center_code, 'UNKNOWN'),
                'smart_code', v_smart_code
              ));
              
              v_line_counter := v_line_counter + 2;
              v_dimensions_count := v_dimensions_count + 1;
              
            END IF;
          END LOOP;
          
        END;
        
      END LOOP;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_RULE_PROCESS: Failed to process rule ' || v_rule.name || ': ' || SQLERRM);
        v_status := 'PARTIAL';
    END;
    
  END LOOP;
  
  -- ========================================================================
  -- Create Transaction Header and Lines (if not dry run)
  -- ========================================================================
  
  IF NOT p_dry_run AND array_length(v_allocation_entries, 1) > 0 THEN
    
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
        'profitability_allocation',
        v_smart_code,
        (p_period || '-01')::DATE,
        now(),
        'ALLOC-' || p_period || '-' || extract(epoch from now())::TEXT,
        v_total_allocated,
        v_currencies[1], -- Primary currency
        p_actor_entity_id,
        jsonb_build_object(
          'run_id', v_run_id,
          'period', p_period,
          'policy_ref', p_policy_ref,
          'allocation_type', 'DISTRIBUTE',
          'lines_processed', v_source_lines,
          'dimensions_completed', v_dimensions_count
        )
      ) RETURNING id INTO v_txn_header_id;
      
      -- Create transaction lines
      DECLARE
        v_entry JSONB;
      BEGIN
        FOR v_entry IN SELECT * FROM unnest(v_allocation_entries) LOOP
          
          INSERT INTO universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            gl_account_id,
            cost_center_id,
            profit_center_id,
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
            (v_entry->>'cost_center_id')::UUID,
            (v_entry->>'profit_center_id')::UUID,
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
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_TXN_CREATE: Failed to create allocation transaction: ' || SQLERRM);
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
      'AUDIT-ALLOC-' || v_run_id::TEXT,
      0.00,
      p_actor_entity_id,
      jsonb_build_object(
        'run_id', v_run_id,
        'run_type', 'ALLOCATION',
        'period', p_period,
        'policy_ref', p_policy_ref,
        'dry_run', p_dry_run,
        'status', v_status,
        'lines_processed', v_source_lines,
        'amount_allocated', v_total_allocated,
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
    v_total_allocated,
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
GRANT EXECUTE ON FUNCTION hera_profitability_alloc_v2(UUID, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION hera_profitability_alloc_v2(UUID, UUID, TEXT, TEXT, BOOLEAN) IS 
'HERA Profitability v2: Atomic allocation processing with driver computation, weight calculation, and journal entry generation. Processes allocation rules according to policy-as-data configuration with complete audit trail and dimensional validation.';