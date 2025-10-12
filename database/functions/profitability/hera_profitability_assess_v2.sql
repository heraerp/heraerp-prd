-- ============================================================================
-- HERA Profitability v2: Assessment RPC Function
-- 
-- Secondary cost assessment processing with cost center to profit center
-- redistribution, GL account mapping, and balanced journal generation.
-- 
-- Smart Code: HERA.PROFITABILITY.ASSESS.RPC.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_profitability_assess_v2(
  p_organization_id UUID,
  p_actor_entity_id UUID,
  p_period TEXT,
  p_policy_ref TEXT,
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  run_id UUID,
  lines_processed INTEGER,
  amount_assessed DECIMAL,
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
  v_assessment_rules JSONB;
  v_source_lines INTEGER := 0;
  v_total_assessed DECIMAL := 0.00;
  v_currencies TEXT[] := ARRAY[]::TEXT[];
  v_dimensions_count INTEGER := 0;
  v_transaction_ids UUID[] := ARRAY[]::UUID[];
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_status TEXT := 'SUCCESS';
  
  -- Assessment variables
  v_assessment_rule RECORD;
  v_source_line RECORD;
  v_assessment_entries JSONB[] := ARRAY[]::JSONB[];
  
  -- Transaction variables
  v_txn_header_id UUID;
  v_line_counter INTEGER := 0;
  v_smart_code TEXT := 'HERA.PROFITABILITY.ASSESS.RUN.V2';
  
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
  -- Load Assessment Policy
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
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_NOT_FOUND: Assessment policy not found: ' || p_policy_ref);
      v_status := 'FAILED';
      RETURN QUERY SELECT 
        v_run_id, 0, 0.00::DECIMAL, ARRAY[]::TEXT[], 0, ARRAY[]::UUID[], 
        v_status, 0, v_errors, v_warnings;
      RETURN;
    END IF;
    
    -- Extract assessment rules (same structure as allocation rules)
    v_assessment_rules := v_policy->'rules';
    
    IF v_assessment_rules IS NULL OR jsonb_array_length(v_assessment_rules) = 0 THEN
      v_errors := array_append(v_errors, 'ERR_PROFITABILITY_POLICY_INVALID: Policy must have assessment rules');
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
  -- Process Assessment Rules
  -- ========================================================================
  
  FOR v_assessment_rule IN SELECT * FROM jsonb_to_recordset(v_assessment_rules) AS x(
    name TEXT,
    basis TEXT,
    "from" JSONB,
    "to" JSONB,
    threshold DECIMAL,
    method TEXT,
    assessment_account JSONB
  ) LOOP
    
    DECLARE
      v_source_criteria JSONB;
      v_target_criteria JSONB;
      v_assessment_account_id UUID;
    BEGIN
      
      v_source_criteria := v_assessment_rule."from";
      v_target_criteria := v_assessment_rule."to";
      
      -- Get assessment GL account (secondary cost account)
      IF v_assessment_rule.assessment_account IS NOT NULL THEN
        SELECT e.id INTO v_assessment_account_id
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'account_number'
        WHERE e.organization_id = p_organization_id
          AND e.entity_type = 'GL_ACCOUNT'
          AND e.status = 'ACTIVE'
          AND (
            e.entity_code = (v_assessment_rule.assessment_account->>'code')
            OR dd.field_value_text = (v_assessment_rule.assessment_account->>'number')
          )
        LIMIT 1;
        
        IF v_assessment_account_id IS NULL THEN
          v_warnings := array_append(v_warnings, 'Assessment account not found for rule: ' || v_assessment_rule.name);
          CONTINUE;
        END IF;
      END IF;
      
      -- Find source cost center balances matching criteria
      FOR v_source_line IN
        SELECT 
          cc.id as cost_center_id,
          cc.entity_code as cost_center_code,
          utl.currency,
          SUM(utl.amount_dr - utl.amount_cr) as balance_amount,
          COUNT(*) as line_count
        FROM core_entities cc
        JOIN universal_transaction_lines utl ON utl.cost_center_id = cc.id
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        LEFT JOIN core_entities acc ON acc.id = utl.gl_account_id
        LEFT JOIN core_dynamic_data dd_cc_tags ON dd_cc_tags.entity_id = cc.id 
          AND dd_cc_tags.field_name = 'tags'
        LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
          AND dd_acc_group.field_name = 'account_group'
        WHERE cc.organization_id = p_organization_id
          AND cc.entity_type = 'COST_CENTER'
          AND cc.status = 'ACTIVE'
          AND ut.organization_id = p_organization_id
          AND date_trunc('month', ut.posted_at) = (p_period || '-01')::DATE
          AND (
            -- Match cost center criteria
            (v_source_criteria ? 'cc_tags' AND 
             dd_cc_tags.field_value_json ?| (SELECT array_agg(value::TEXT) FROM jsonb_array_elements_text(v_source_criteria->'cc_tags')))
            OR
            -- Match GL range for assessment
            (v_source_criteria ? 'gl_range' AND 
             dd_acc_group.field_value_text = (v_source_criteria->>'gl_range')::TEXT)
          )
        GROUP BY cc.id, cc.entity_code, utl.currency
        HAVING SUM(utl.amount_dr - utl.amount_cr) != 0
      LOOP
        
        v_source_lines := v_source_lines + 1;
        
        -- Skip if amount below threshold
        IF v_assessment_rule.threshold IS NOT NULL AND ABS(v_source_line.balance_amount) < v_assessment_rule.threshold THEN
          CONTINUE;
        END IF;
        
        v_total_assessed := v_total_assessed + ABS(v_source_line.balance_amount);
        
        -- Add currency to list
        IF NOT (v_source_line.currency = ANY(v_currencies)) THEN
          v_currencies := array_append(v_currencies, v_source_line.currency);
        END IF;
        
        -- Create assessment entries based on target criteria
        IF v_target_criteria->>'pc' = '*' THEN
          -- Assess to all profit centers (would need allocation driver)
          DECLARE
            v_pc RECORD;
            v_pc_count INTEGER;
            v_assessment_amount DECIMAL;
          BEGIN
            
            -- Count active profit centers
            SELECT COUNT(*) INTO v_pc_count
            FROM core_entities pc
            WHERE pc.organization_id = p_organization_id
              AND pc.entity_type = 'PROFIT_CENTER'
              AND pc.status = 'ACTIVE';
            
            IF v_pc_count > 0 THEN
              v_assessment_amount := v_source_line.balance_amount / v_pc_count;
              
              -- Create assessment entries for each profit center
              FOR v_pc IN 
                SELECT id, entity_code 
                FROM core_entities 
                WHERE organization_id = p_organization_id
                  AND entity_type = 'PROFIT_CENTER'
                  AND status = 'ACTIVE'
              LOOP
                
                -- Credit cost center (reduce balance)
                v_assessment_entries := array_append(v_assessment_entries, jsonb_build_object(
                  'line_number', v_line_counter + 1,
                  'gl_account_id', COALESCE(v_assessment_account_id, (
                    SELECT id FROM core_entities 
                    WHERE organization_id = p_organization_id 
                      AND entity_type = 'GL_ACCOUNT'
                      AND entity_code LIKE '9%'
                    LIMIT 1
                  )),
                  'cost_center_id', v_source_line.cost_center_id,
                  'amount_dr', 0,
                  'amount_cr', ABS(v_assessment_amount),
                  'currency', v_source_line.currency,
                  'description', 'Assessment: ' || v_assessment_rule.name || ' from CC ' || v_source_line.cost_center_code,
                  'smart_code', v_smart_code
                ));
                
                -- Debit profit center (add cost)
                v_assessment_entries := array_append(v_assessment_entries, jsonb_build_object(
                  'line_number', v_line_counter + 2,
                  'gl_account_id', COALESCE(v_assessment_account_id, (
                    SELECT id FROM core_entities 
                    WHERE organization_id = p_organization_id 
                      AND entity_type = 'GL_ACCOUNT'
                      AND entity_code LIKE '5%'
                    LIMIT 1
                  )),
                  'profit_center_id', v_pc.id,
                  'amount_dr', ABS(v_assessment_amount),
                  'amount_cr', 0,
                  'currency', v_source_line.currency,
                  'description', 'Assessment: ' || v_assessment_rule.name || ' to PC ' || v_pc.entity_code,
                  'smart_code', v_smart_code
                ));
                
                v_line_counter := v_line_counter + 2;
                v_dimensions_count := v_dimensions_count + 1;
                
              END LOOP;
            END IF;
            
          END;
          
        ELSIF v_target_criteria ? 'pc_code' THEN
          -- Assess to specific profit center
          DECLARE
            v_target_pc_id UUID;
            v_target_pc_code TEXT;
          BEGIN
            
            v_target_pc_code := v_target_criteria->>'pc_code';
            
            SELECT id INTO v_target_pc_id
            FROM core_entities
            WHERE organization_id = p_organization_id
              AND entity_type = 'PROFIT_CENTER'
              AND entity_code = v_target_pc_code
              AND status = 'ACTIVE';
            
            IF v_target_pc_id IS NOT NULL THEN
              
              -- Credit cost center
              v_assessment_entries := array_append(v_assessment_entries, jsonb_build_object(
                'line_number', v_line_counter + 1,
                'gl_account_id', COALESCE(v_assessment_account_id, (
                  SELECT id FROM core_entities 
                  WHERE organization_id = p_organization_id 
                    AND entity_type = 'GL_ACCOUNT'
                    AND entity_code LIKE '9%'
                  LIMIT 1
                )),
                'cost_center_id', v_source_line.cost_center_id,
                'amount_dr', 0,
                'amount_cr', ABS(v_source_line.balance_amount),
                'currency', v_source_line.currency,
                'description', 'Assessment: ' || v_assessment_rule.name || ' from CC ' || v_source_line.cost_center_code,
                'smart_code', v_smart_code
              ));
              
              -- Debit profit center
              v_assessment_entries := array_append(v_assessment_entries, jsonb_build_object(
                'line_number', v_line_counter + 2,
                'gl_account_id', COALESCE(v_assessment_account_id, (
                  SELECT id FROM core_entities 
                  WHERE organization_id = p_organization_id 
                    AND entity_type = 'GL_ACCOUNT'
                    AND entity_code LIKE '5%'
                  LIMIT 1
                )),
                'profit_center_id', v_target_pc_id,
                'amount_dr', ABS(v_source_line.balance_amount),
                'amount_cr', 0,
                'currency', v_source_line.currency,
                'description', 'Assessment: ' || v_assessment_rule.name || ' to PC ' || v_target_pc_code,
                'smart_code', v_smart_code
              ));
              
              v_line_counter := v_line_counter + 2;
              v_dimensions_count := v_dimensions_count + 1;
              
            ELSE
              v_warnings := array_append(v_warnings, 'Target profit center not found: ' || v_target_pc_code);
            END IF;
            
          END;
        END IF;
        
      END LOOP;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_ASSESS_PROCESS: Failed to process rule ' || v_assessment_rule.name || ': ' || SQLERRM);
        v_status := 'PARTIAL';
    END;
    
  END LOOP;
  
  -- ========================================================================
  -- Create Transaction Header and Lines (if not dry run)
  -- ========================================================================
  
  IF NOT p_dry_run AND array_length(v_assessment_entries, 1) > 0 THEN
    
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
        'profitability_assessment',
        v_smart_code,
        (p_period || '-01')::DATE,
        now(),
        'ASSESS-' || p_period || '-' || extract(epoch from now())::TEXT,
        v_total_assessed,
        v_currencies[1], -- Primary currency
        p_actor_entity_id,
        jsonb_build_object(
          'run_id', v_run_id,
          'period', p_period,
          'policy_ref', p_policy_ref,
          'assessment_type', 'SECONDARY_COST',
          'lines_processed', v_source_lines,
          'dimensions_completed', v_dimensions_count
        )
      ) RETURNING id INTO v_txn_header_id;
      
      -- Create transaction lines
      DECLARE
        v_entry JSONB;
      BEGIN
        FOR v_entry IN SELECT * FROM unnest(v_assessment_entries) LOOP
          
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
        v_errors := array_append(v_errors, 'ERR_PROFITABILITY_TXN_CREATE: Failed to create assessment transaction: ' || SQLERRM);
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
      'AUDIT-ASSESS-' || v_run_id::TEXT,
      0.00,
      p_actor_entity_id,
      jsonb_build_object(
        'run_id', v_run_id,
        'run_type', 'ASSESSMENT',
        'period', p_period,
        'policy_ref', p_policy_ref,
        'dry_run', p_dry_run,
        'status', v_status,
        'lines_processed', v_source_lines,
        'amount_assessed', v_total_assessed,
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
    v_total_assessed,
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
GRANT EXECUTE ON FUNCTION hera_profitability_assess_v2(UUID, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION hera_profitability_assess_v2(UUID, UUID, TEXT, TEXT, BOOLEAN) IS 
'HERA Profitability v2: Secondary cost assessment processing with cost center to profit center redistribution, GL account mapping, and balanced journal generation. Processes assessment rules for organizational cost allocation with complete audit trail.';