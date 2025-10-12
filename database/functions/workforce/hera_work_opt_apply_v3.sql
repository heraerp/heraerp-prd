-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Optimization Application Function
-- 
-- Applies workforce optimization suggestions with dual approval validation,
-- safety checks, and complete audit trail through universal transactions.
-- 
-- Smart Code: HERA.WORK.OPT.APPLY.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_work_opt_apply_V3(
  p_org_id UUID,
  p_actor_id UUID,
  p_application_meta JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID := gen_random_uuid();
  v_start_time TIMESTAMP := CLOCK_TIMESTAMP();
  v_processing_time_ms INTEGER;
  
  -- Application parameters
  v_optimization_run_id UUID;
  v_selected_suggestions UUID[];
  v_implementation_date DATE;
  v_approver_id UUID;
  v_approval_notes TEXT;
  
  -- Validation and safety
  v_safety_checks JSONB := '[]';
  v_approval_status JSONB := '{}';
  v_validation_errors JSONB := '[]';
  v_safety_violations JSONB := '[]';
  
  -- Application tracking
  v_suggestions_applied INTEGER := 0;
  v_suggestions_failed INTEGER := 0;
  v_total_expected_savings DECIMAL := 0;
  v_implementation_steps JSONB := '[]';
  
  -- Dual approval workflow
  v_requires_dual_approval BOOLEAN := true;
  v_controller_approved BOOLEAN := false;
  v_cfo_approved BOOLEAN := false;
  v_approval_count INTEGER := 0;
  
  -- Line counter
  v_line_counter INTEGER := 1;
  
  -- Working variables
  v_suggestion_record RECORD;
  v_optimization_suggestions JSONB;
BEGIN
  -- ==========================================================================
  -- 1. Parse Application Parameters and Validation
  -- ==========================================================================
  
  -- Extract application metadata
  v_optimization_run_id := (p_application_meta->>'optimization_run_id')::UUID;
  v_implementation_date := COALESCE(
    (p_application_meta->>'implementation_date')::DATE, 
    CURRENT_DATE + INTERVAL '7 days'
  );
  v_approver_id := COALESCE((p_application_meta->>'approver_id')::UUID, p_actor_id);
  v_approval_notes := p_application_meta->>'approval_notes';
  
  -- Parse selected suggestions
  SELECT array_agg((value)::UUID) INTO v_selected_suggestions
  FROM jsonb_array_elements_text(COALESCE(p_application_meta->'selected_suggestions', '[]'));
  
  IF v_optimization_run_id IS NULL THEN
    RAISE EXCEPTION 'optimization_run_id is required in application_meta';
  END IF;
  
  -- Load the optimization suggestions from the run
  SELECT utl.metadata->'all_suggestions' INTO v_optimization_suggestions
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.id = v_optimization_run_id
  AND ut.organization_id = p_org_id
  AND ut.transaction_type = 'WORK_OPT_SUGGEST'
  AND utl.line_type = 'OPTIMIZATION_SUGGESTIONS';
  
  IF v_optimization_suggestions IS NULL THEN
    RAISE EXCEPTION 'Optimization run not found: %', v_optimization_run_id;
  END IF;
  
  -- ==========================================================================
  -- 2. Dual Approval Validation
  -- ==========================================================================
  
  -- Check approver permissions (simplified - would integrate with RBAC)
  DECLARE
    v_approver_role TEXT;
    v_approver_name TEXT;
  BEGIN
    
    SELECT 
      COALESCE(role.field_value_text, 'user') as role,
      e.entity_name as name
    INTO v_approver_role, v_approver_name
    FROM core_entities e
    LEFT JOIN core_dynamic_data role ON 
      role.entity_id = e.id AND role.field_name = 'role'
    WHERE e.id = v_approver_id
    AND e.organization_id = p_org_id
    AND e.entity_type = 'USER';
    
    -- Determine approval status
    IF v_approver_role = 'controller' THEN
      v_controller_approved := true;
      v_approval_count := v_approval_count + 1;
    ELSIF v_approver_role = 'cfo' THEN
      v_cfo_approved := true;
      v_approval_count := v_approval_count + 1;
    ELSIF v_approver_role IN ('owner', 'admin') THEN
      -- Owners and admins count as both controller and CFO
      v_controller_approved := true;
      v_cfo_approved := true;
      v_approval_count := 2;
    END IF;
    
    v_approval_status := jsonb_build_object(
      'dual_approval_required', v_requires_dual_approval,
      'controller_approved', v_controller_approved,
      'cfo_approved', v_cfo_approved,
      'approval_count', v_approval_count,
      'approver_role', v_approver_role,
      'approver_name', v_approver_name,
      'approval_notes', v_approval_notes
    );
    
  END;
  
  -- ==========================================================================
  -- 3. Create Optimization Application Transaction
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_code, 
    smart_code, total_amount, currency, status,
    metadata, created_at, posted_at
  ) VALUES (
    v_run_id, p_org_id, 'WORK_OPT_APPLY', 
    'WORK-OPT-APPLY-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'HERA.WORK.OPT.APPLY.V3',
    0, 'GBP', 'PROCESSING',
    jsonb_build_object(
      'optimization_run_id', v_optimization_run_id,
      'selected_suggestions', v_selected_suggestions,
      'implementation_date', v_implementation_date,
      'approver_id', v_approver_id,
      'approval_status', v_approval_status,
      'actor_id', p_actor_id
    ),
    NOW(), NOW()
  );
  
  -- ==========================================================================
  -- 4. Safety Checks and Validation
  -- ==========================================================================
  
  -- Check implementation timeline safety
  IF v_implementation_date < CURRENT_DATE + INTERVAL '2 days' THEN
    v_safety_violations := v_safety_violations || jsonb_build_array(
      jsonb_build_object(
        'violation_type', 'INSUFFICIENT_IMPLEMENTATION_TIME',
        'current_date', CURRENT_DATE,
        'implementation_date', v_implementation_date,
        'minimum_required_days', 2,
        'severity', 'MEDIUM'
      )
    );
  END IF;
  
  -- Check for concurrent optimization applications
  DECLARE
    v_concurrent_applications INTEGER;
  BEGIN
    
    SELECT COUNT(*) INTO v_concurrent_applications
    FROM universal_transactions
    WHERE organization_id = p_org_id
    AND transaction_type = 'WORK_OPT_APPLY'
    AND status IN ('PROCESSING', 'PENDING_APPROVAL')
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    IF v_concurrent_applications > 2 THEN
      v_safety_violations := v_safety_violations || jsonb_build_array(
        jsonb_build_object(
          'violation_type', 'TOO_MANY_CONCURRENT_CHANGES',
          'concurrent_applications', v_concurrent_applications,
          'recommended_limit', 2,
          'severity', 'HIGH'
        )
      );
    END IF;
    
  END;
  
  -- Dual approval requirement check
  IF v_requires_dual_approval AND v_approval_count < 2 THEN
    v_validation_errors := v_validation_errors || jsonb_build_array(
      jsonb_build_object(
        'error_type', 'INSUFFICIENT_APPROVALS',
        'required_approvals', 2,
        'current_approvals', v_approval_count,
        'controller_approved', v_controller_approved,
        'cfo_approved', v_cfo_approved
      )
    );
  END IF;
  
  -- Record safety and validation checks
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'SAFETY_VALIDATION', v_line_counter,
    jsonb_array_length(v_safety_violations) + jsonb_array_length(v_validation_errors),
    jsonb_build_object(
      'safety_checks_performed', 3,
      'validation_errors', v_validation_errors,
      'safety_violations', v_safety_violations,
      'approval_status', v_approval_status,
      'can_proceed', (jsonb_array_length(v_validation_errors) = 0)
    ),
    'HERA.WORK.OPT.SAFETY.V3'
  );
  v_line_counter := v_line_counter + 1;
  
  -- ==========================================================================
  -- 5. Apply Optimization Suggestions
  -- ==========================================================================
  
  -- Only proceed if validation passes
  IF jsonb_array_length(v_validation_errors) = 0 THEN
    
    FOR v_suggestion_record IN 
      SELECT 
        suggestion,
        (suggestion->>'opportunity_type') as opportunity_type,
        (suggestion->>'employee_id')::UUID as employee_id,
        suggestion->>'employee_name' as employee_name,
        suggestion->>'recommended_action' as recommended_action,
        COALESCE((suggestion->>'potential_savings_weekly')::DECIMAL, 0) as potential_savings,
        COALESCE((suggestion->>'confidence_score')::DECIMAL, 0) as confidence_score
      FROM jsonb_array_elements(v_optimization_suggestions) as suggestion
      WHERE cardinality(v_selected_suggestions) = 0 OR 
            (suggestion->>'employee_id')::UUID = ANY(v_selected_suggestions)
    LOOP
      
      DECLARE
        v_application_success BOOLEAN := false;
        v_application_result JSONB := '{}';
      BEGIN
        
        -- Apply different optimization types
        CASE v_suggestion_record.opportunity_type
          
          WHEN 'OVERTIME_REDUCTION' THEN
            -- Update employee work constraints
            INSERT OR REPLACE INTO core_dynamic_data (
              entity_id, field_name, field_value_json, smart_code,
              organization_id, created_at, updated_at
            ) VALUES (
              v_suggestion_record.employee_id,
              'overtime_constraints',
              jsonb_build_object(
                'max_overtime_hours_week', 5,
                'requires_approval', true,
                'applied_date', v_implementation_date,
                'applied_by', v_approver_id
              ),
              'HERA.WORK.EMP.OVERTIME.CONSTRAINT.V3',
              p_org_id, NOW(), NOW()
            );
            v_application_success := true;
            
          WHEN 'UTILIZATION_IMPROVEMENT' THEN
            -- Update employee utilization targets
            INSERT OR REPLACE INTO core_dynamic_data (
              entity_id, field_name, field_value_number, smart_code,
              organization_id, created_at, updated_at
            ) VALUES (
              v_suggestion_record.employee_id,
              'target_utilization_pct',
              85,
              'HERA.WORK.EMP.UTILIZATION.TARGET.V3',
              p_org_id, NOW(), NOW()
            );
            v_application_success := true;
            
          WHEN 'CROSS_TRAINING' THEN
            -- Create training plan
            DECLARE
              v_training_plan_id UUID := gen_random_uuid();
            BEGIN
              
              INSERT INTO core_entities (
                id, organization_id, entity_type, entity_name, entity_code,
                smart_code, status, metadata, created_at, updated_at
              ) VALUES (
                v_training_plan_id, p_org_id, 'TRAINING_PLAN',
                'Cross-Training Plan for ' || v_suggestion_record.employee_name,
                'TRAIN-' || EXTRACT(EPOCH FROM NOW())::TEXT,
                'HERA.WORK.TRAINING.PLAN.V3',
                'ACTIVE',
                jsonb_build_object(
                  'employee_id', v_suggestion_record.employee_id,
                  'training_type', 'CROSS_TRAINING',
                  'start_date', v_implementation_date,
                  'duration_weeks', 4,
                  'created_by', v_approver_id
                ),
                NOW(), NOW()
              );
              
              -- Link training plan to employee
              INSERT INTO core_relationships (
                id, organization_id, from_entity_id, to_entity_id,
                relationship_type, smart_code, metadata, created_at
              ) VALUES (
                gen_random_uuid(), p_org_id, v_suggestion_record.employee_id, v_training_plan_id,
                'EMPLOYEE_ENROLLED_IN_TRAINING',
                'HERA.WORK.EMP.TRAINING.ENROLL.V3',
                jsonb_build_object(
                  'enrollment_date', v_implementation_date,
                  'enrolled_by', v_approver_id
                ),
                NOW()
              );
              
              v_application_success := true;
              
            END;
            
          WHEN 'SCHEDULE_EFFICIENCY' THEN
            -- Update schedule template parameters
            UPDATE core_dynamic_data 
            SET 
              field_value_json = field_value_json || jsonb_build_object(
                'optimization_applied', true,
                'optimization_date', v_implementation_date,
                'optimization_type', 'EFFICIENCY_IMPROVEMENT'
              ),
              updated_at = NOW()
            WHERE entity_id IN (
              SELECT id FROM core_entities 
              WHERE organization_id = p_org_id 
              AND entity_type = 'SHIFT_TEMPLATE'
              AND entity_name = (v_suggestion_record.suggestion->>'template_name')
            )
            AND field_name = 'optimization_config';
            
            v_application_success := true;
            
          ELSE
            v_application_success := false;
            
        END CASE;
        
        -- Record application result
        IF v_application_success THEN
          v_suggestions_applied := v_suggestions_applied + 1;
          v_total_expected_savings := v_total_expected_savings + v_suggestion_record.potential_savings;
          
          v_application_result := jsonb_build_object(
            'success', true,
            'opportunity_type', v_suggestion_record.opportunity_type,
            'employee_id', v_suggestion_record.employee_id,
            'potential_savings', v_suggestion_record.potential_savings,
            'confidence_score', v_suggestion_record.confidence_score,
            'applied_at', NOW()
          );
        ELSE
          v_suggestions_failed := v_suggestions_failed + 1;
          
          v_application_result := jsonb_build_object(
            'success', false,
            'opportunity_type', v_suggestion_record.opportunity_type,
            'employee_id', v_suggestion_record.employee_id,
            'error_reason', 'Unsupported optimization type'
          );
        END IF;
        
        -- Record individual application
        INSERT INTO universal_transaction_lines (
          id, transaction_id, organization_id, line_type, line_number,
          line_amount, metadata, smart_code
        ) VALUES (
          gen_random_uuid(), v_run_id, p_org_id, 'OPTIMIZATION_APPLIED', v_line_counter,
          v_suggestion_record.potential_savings,
          v_application_result,
          'HERA.WORK.OPT.APPLICATION.V3'
        );
        v_line_counter := v_line_counter + 1;
        
      END;
    END LOOP;
    
  END IF;
  
  -- ==========================================================================
  -- 6. Complete Transaction and Return Results
  -- ==========================================================================
  
  v_processing_time_ms := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_start_time)) * 1000;
  
  UPDATE universal_transactions 
  SET 
    status = CASE 
      WHEN jsonb_array_length(v_validation_errors) > 0 THEN 'VALIDATION_FAILED'
      WHEN jsonb_array_length(v_safety_violations) > 0 THEN 'SAFETY_REVIEW_REQUIRED'
      WHEN v_suggestions_applied > 0 THEN 'COMPLETED'
      ELSE 'FAILED'
    END,
    total_amount = v_total_expected_savings,
    metadata = metadata || jsonb_build_object(
      'application_results', jsonb_build_object(
        'suggestions_applied', v_suggestions_applied,
        'suggestions_failed', v_suggestions_failed,
        'total_expected_savings', v_total_expected_savings,
        'implementation_date', v_implementation_date
      ),
      'validation_summary', jsonb_build_object(
        'validation_errors', v_validation_errors,
        'safety_violations', v_safety_violations,
        'approval_status', v_approval_status
      ),
      'processing_time_ms', v_processing_time_ms,
      'completed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', (jsonb_array_length(v_validation_errors) = 0 AND v_suggestions_applied > 0),
    'application_run_id', v_run_id,
    'optimization_run_id', v_optimization_run_id,
    'organization_id', p_org_id,
    'processing_time_ms', v_processing_time_ms,
    'suggestions_applied', v_suggestions_applied,
    'suggestions_failed', v_suggestions_failed,
    'total_expected_savings', v_total_expected_savings,
    'implementation_date', v_implementation_date,
    'validation_errors', v_validation_errors,
    'safety_violations', v_safety_violations,
    'approval_status', v_approval_status,
    'smart_code', 'HERA.WORK.OPT.APPLY.V3'
  );

EXCEPTION WHEN OTHERS THEN
  -- Update transaction status to failed
  UPDATE universal_transactions 
  SET 
    status = 'FAILED',
    metadata = metadata || jsonb_build_object(
      'error_message', SQLERRM,
      'error_code', SQLSTATE,
      'failed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error_code', 'WORKFORCE_OPTIMIZATION_APPLICATION_FAILED',
    'error_message', SQLERRM,
    'application_run_id', v_run_id,
    'smart_code', 'HERA.WORK.OPT.APPLY.V3'
  );
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_work_opt_apply_V3(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_work_opt_apply_V3(UUID, UUID, JSONB) TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_work_opt_apply_V3(UUID, UUID, JSONB) IS 'HERA Finance DNA V3.6: Workforce Optimization Application function that applies approved workforce optimization suggestions with dual approval validation, comprehensive safety checks, and complete audit trail through universal transactions architecture.';