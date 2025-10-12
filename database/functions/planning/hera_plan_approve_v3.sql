-- ============================================================================
-- HERA Finance DNA v3.3: Plan Approval Workflow Engine
-- 
-- Manages approval workflows for budgets and forecasts with dual approval
-- support, policy compliance, and complete audit trail.
-- 
-- Smart Code: HERA.PLAN.APPROVE.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_plan_approve_v3(
  p_organization_id UUID,
  p_plan_id UUID,
  p_approver_entity_id UUID,
  p_approval_action TEXT DEFAULT 'APPROVE',  -- 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'
  p_approval_comments TEXT DEFAULT NULL,
  p_override_policy BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval_run_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_plan_entity RECORD;
  v_approval_level INTEGER := 1;
  v_required_approvals INTEGER := 1;
  v_existing_approvals INTEGER := 0;
  v_approval_chain JSONB := '[]';
  v_policy_violations JSONB := '[]';
  v_approval_complete BOOLEAN := false;
  v_new_plan_status TEXT;
  v_approval_metadata JSONB := '{}';
  v_error_code TEXT := NULL;
  v_error_message TEXT := NULL;
  rec RECORD;
BEGIN

  -- ============================================================================
  -- 1) Input Validation & Setup
  -- ============================================================================
  
  v_approval_run_id := gen_random_uuid();
  
  -- Validate approval action
  IF p_approval_action NOT IN ('APPROVE', 'REJECT', 'REQUEST_CHANGES') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_APPROVAL_ACTION',
      'error_message', 'Approval action must be APPROVE, REJECT, or REQUEST_CHANGES'
    );
  END IF;
  
  -- Get plan entity details
  SELECT * INTO v_plan_entity
  FROM core_entities 
  WHERE id = p_plan_id 
    AND organization_id = p_organization_id 
    AND entity_type = 'PLAN_VERSION';
    
  IF v_plan_entity.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PLAN_NOT_FOUND',
      'error_message', 'Plan version not found for approval'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Determine Approval Requirements & Policy Checks
    -- ============================================================================
    
    -- Get approval policy based on plan type and value
    WITH plan_totals AS (
      SELECT 
        COALESCE(SUM(ABS(line_amount)), 0) as total_plan_value,
        COUNT(*) as total_lines
      FROM universal_transaction_lines utl
      JOIN universal_transactions ut ON ut.id = utl.transaction_id
      WHERE ut.organization_id = p_organization_id
        AND ut.metadata->>'plan_entity_id' = p_plan_id::text
        AND utl.line_type IN ('PLAN_LINE_REVENUE', 'PLAN_LINE_COST')
    ),
    approval_policy AS (
      SELECT 
        pt.total_plan_value,
        pt.total_lines,
        -- Determine approval requirements based on plan value and type
        CASE 
          WHEN pt.total_plan_value > 10000000 THEN 3  -- >10M requires 3 approvals
          WHEN pt.total_plan_value > 1000000 THEN 2   -- >1M requires 2 approvals
          ELSE 1                                      -- <1M requires 1 approval
        END as required_approvals,
        CASE 
          WHEN v_plan_entity.metadata->>'plan_type' = 'BUDGET' THEN 'BUDGET_APPROVAL'
          WHEN v_plan_entity.metadata->>'plan_type' = 'FORECAST' THEN 'FORECAST_APPROVAL'
          ELSE 'ROLLING_FORECAST_APPROVAL'
        END as approval_type
      FROM plan_totals pt
    )
    SELECT 
      ap.required_approvals,
      ap.approval_type,
      ap.total_plan_value
    INTO v_required_approvals, v_approval_metadata, v_approval_metadata
    FROM approval_policy ap;

    -- Get existing approvals
    SELECT COUNT(*) INTO v_existing_approvals
    FROM universal_transactions
    WHERE organization_id = p_organization_id
      AND transaction_type = 'PLAN_APPROVAL'
      AND metadata->>'plan_id' = p_plan_id::text
      AND metadata->>'approval_action' = 'APPROVE'
      AND status = 'COMPLETED';

    -- Build approval chain
    WITH approval_history AS (
      SELECT 
        metadata->>'approver_entity_id' as approver_id,
        metadata->>'approval_action' as action,
        metadata->>'approval_comments' as comments,
        created_at,
        status
      FROM universal_transactions
      WHERE organization_id = p_organization_id
        AND transaction_type = 'PLAN_APPROVAL'
        AND metadata->>'plan_id' = p_plan_id::text
      ORDER BY created_at ASC
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'approver_id', ah.approver_id,
        'action', ah.action,
        'comments', ah.comments,
        'timestamp', ah.created_at,
        'status', ah.status
      )
    ) INTO v_approval_chain
    FROM approval_history ah;

    -- ============================================================================
    -- 3) Policy Validation (unless override enabled)
    -- ============================================================================
    
    IF NOT p_override_policy THEN
      
      -- Check for policy violations
      WITH policy_checks AS (
        SELECT 
          'PLAN_COMPLETENESS' as check_type,
          CASE 
            WHEN (SELECT COUNT(*) FROM universal_transaction_lines utl
                  JOIN universal_transactions ut ON ut.id = utl.transaction_id
                  WHERE ut.metadata->>'plan_entity_id' = p_plan_id::text) < 12
            THEN 'Plan has insufficient data points for approval'
            ELSE NULL
          END as violation_message
        UNION ALL
        SELECT 
          'VARIANCE_THRESHOLD' as check_type,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM universal_transaction_lines utl
              JOIN universal_transactions ut ON ut.id = utl.transaction_id
              WHERE ut.metadata->>'plan_entity_id' = p_plan_id::text
                AND ABS(COALESCE((utl.metadata->>'change_pct')::decimal, 0)) > 50
            )
            THEN 'Plan contains changes exceeding 50% variance threshold'
            ELSE NULL
          END as violation_message
        UNION ALL
        SELECT 
          'APPROVAL_AUTHORITY' as check_type,
          CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM core_dynamic_data cdd
              WHERE cdd.entity_id = p_approver_entity_id
                AND cdd.field_name = 'approval_authority'
                AND (cdd.field_value_json->>'max_plan_value')::decimal >= 
                    (SELECT COALESCE(SUM(ABS(line_amount)), 0) 
                     FROM universal_transaction_lines utl
                     JOIN universal_transactions ut ON ut.id = utl.transaction_id
                     WHERE ut.metadata->>'plan_entity_id' = p_plan_id::text)
            )
            THEN 'Approver lacks sufficient authority for plan value'
            ELSE NULL
          END as violation_message
      )
      SELECT jsonb_agg(
        jsonb_build_object(
          'check_type', pc.check_type,
          'violation', pc.violation_message
        )
      ) INTO v_policy_violations
      FROM policy_checks pc
      WHERE pc.violation_message IS NOT NULL;
      
      -- Reject if policy violations found (unless override)
      IF jsonb_array_length(COALESCE(v_policy_violations, '[]')) > 0 THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'POLICY_VIOLATION',
          'error_message', 'Plan approval blocked by policy violations',
          'policy_violations', v_policy_violations,
          'approval_run_id', v_approval_run_id
        );
      END IF;
      
    END IF;

    -- ============================================================================
    -- 4) Process Approval Action
    -- ============================================================================
    
    -- Determine new plan status based on approval action and level
    IF p_approval_action = 'APPROVE' THEN
      v_approval_level := v_existing_approvals + 1;
      
      IF v_approval_level >= v_required_approvals THEN
        v_new_plan_status := 'APPROVED';
        v_approval_complete := true;
      ELSE
        v_new_plan_status := 'PENDING_APPROVAL';
        v_approval_complete := false;
      END IF;
      
    ELSIF p_approval_action = 'REJECT' THEN
      v_new_plan_status := 'REJECTED';
      v_approval_complete := true;
      
    ELSE  -- REQUEST_CHANGES
      v_new_plan_status := 'CHANGES_REQUESTED';
      v_approval_complete := false;
    END IF;

    -- ============================================================================
    -- 5) Update Plan Entity Status
    -- ============================================================================
    
    UPDATE core_entities 
    SET 
      metadata = metadata || jsonb_build_object(
        'status', v_new_plan_status,
        'approval_level', v_approval_level,
        'required_approvals', v_required_approvals,
        'approval_complete', v_approval_complete,
        'last_approval_date', now(),
        'last_approval_run_id', v_approval_run_id
      ),
      updated_at = now()
    WHERE id = p_plan_id;

    -- ============================================================================
    -- 6) Create Approval Transaction
    -- ============================================================================
    
    v_approval_metadata := jsonb_build_object(
      'plan_id', p_plan_id,
      'plan_type', v_plan_entity.metadata->>'plan_type',
      'approver_entity_id', p_approver_entity_id,
      'approval_action', p_approval_action,
      'approval_comments', p_approval_comments,
      'approval_level', v_approval_level,
      'required_approvals', v_required_approvals,
      'approval_complete', v_approval_complete,
      'new_plan_status', v_new_plan_status,
      'existing_approvals', v_existing_approvals,
      'approval_chain', COALESCE(v_approval_chain, '[]'),
      'policy_violations', COALESCE(v_policy_violations, '[]'),
      'override_policy', p_override_policy,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

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
      v_approval_run_id,
      p_organization_id,
      'PLAN_APPROVAL',
      'APPROVAL-' || UPPER(p_approval_action) || '-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      0,  -- Approval transactions have no amount
      'AED',
      'COMPLETED',
      'HERA.PLAN.APPROVE.RUN.V3',
      v_approval_metadata,
      now(),
      now()
    );

    -- ============================================================================
    -- 7) Create Approval Lines for Audit Detail
    -- ============================================================================
    
    -- Create detailed approval line for each approval decision
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
      v_approval_run_id,
      1,
      'APPROVAL_DECISION',
      p_approver_entity_id,
      1,
      0,
      0,
      'AED',
      'HERA.PLAN.APPROVE.LINE.V3',
      jsonb_build_object(
        'approval_decision', p_approval_action,
        'approval_level', v_approval_level,
        'approval_comments', p_approval_comments,
        'plan_entity_id', p_plan_id,
        'timestamp', now(),
        'approval_authority_verified', NOT (jsonb_array_length(COALESCE(v_policy_violations, '[]')) > 0),
        'workflow_complete', v_approval_complete
      ),
      now(),
      now()
    );

    -- ============================================================================
    -- 8) Trigger Post-Approval Actions (if approval complete)
    -- ============================================================================
    
    IF v_approval_complete AND p_approval_action = 'APPROVE' THEN
      
      -- Activate plan if budget
      IF v_plan_entity.metadata->>'plan_type' = 'BUDGET' THEN
        UPDATE core_entities 
        SET metadata = metadata || jsonb_build_object('active_budget', true)
        WHERE id = p_plan_id;
      END IF;
      
      -- Create notification/alert for plan activation
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
        v_approval_run_id,
        2,
        'PLAN_ACTIVATION',
        p_plan_id,
        1,
        0,
        0,
        'AED',
        'HERA.PLAN.ACTIVATE.LINE.V3',
        jsonb_build_object(
          'activation_trigger', 'APPROVAL_COMPLETE',
          'plan_type', v_plan_entity.metadata->>'plan_type',
          'effective_date', now(),
          'activated_by', p_approver_entity_id
        ),
        now(),
        now()
      );
      
    END IF;

    -- ============================================================================
    -- 9) Return Approval Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'approval_run_id', v_approval_run_id,
      'plan_id', p_plan_id,
      'approval_action', p_approval_action,
      'approval_level', v_approval_level,
      'required_approvals', v_required_approvals,
      'approval_complete', v_approval_complete,
      'new_plan_status', v_new_plan_status,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.PLAN.APPROVE.RUN.V3'
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
      v_approval_run_id,
      p_organization_id,
      'PLAN_APPROVAL',
      'APPROVAL-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.PLAN.APPROVE.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'plan_id', p_plan_id,
        'approval_action', p_approval_action,
        'approver_entity_id', p_approver_entity_id,
        'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
      ),
      now(),
      now()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error_code', v_error_code,
      'error_message', v_error_message,
      'approval_run_id', v_approval_run_id,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

  END;

END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_plan_approve_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_plan_approve_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_plan_approve_v3 IS 'HERA Finance DNA v3.3: Manage approval workflows for budgets and forecasts with dual approval support, policy compliance validation, and complete audit trail. Supports multi-level approval chains based on plan value and type.';