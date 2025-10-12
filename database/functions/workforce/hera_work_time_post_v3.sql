-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Timesheet Posting Function
-- 
-- Validates and posts employee timesheets with variance analysis against
-- scheduled hours, compliance checking, and cost driver quantity creation.
-- 
-- Smart Code: HERA.WORK.TIME.TXN.POST.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_work_time_post_V3(
  p_org_id UUID,
  p_actor_id UUID,
  p_timesheet_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID := gen_random_uuid();
  v_start_time TIMESTAMP := CLOCK_TIMESTAMP();
  v_processing_time_ms INTEGER;
  
  -- Timesheet parameters
  v_employee_id UUID;
  v_period_date DATE;
  v_timesheet_entries JSONB;
  v_approval_status TEXT;
  v_submitted_by UUID;
  
  -- Validation results
  v_total_hours DECIMAL := 0;
  v_regular_hours DECIMAL := 0;
  v_overtime_hours DECIMAL := 0;
  v_break_minutes INTEGER := 0;
  v_scheduled_hours DECIMAL := 0;
  v_variance_hours DECIMAL := 0;
  
  -- Cost calculations
  v_hourly_rate DECIMAL;
  v_regular_pay DECIMAL := 0;
  v_overtime_pay DECIMAL := 0;
  v_total_pay DECIMAL := 0;
  
  -- Compliance validation
  v_guardrail_violations JSONB := '[]';
  v_work_guardrails JSONB;
  
  -- Variance analysis
  v_schedule_variance JSONB := '{}';
  v_time_entries_processed INTEGER := 0;
  v_compliance_checks INTEGER := 0;
  
  -- Line counter
  v_line_counter INTEGER := 1;
  
  -- Processing variables
  v_entry_record RECORD;
  v_scheduled_shift RECORD;
BEGIN
  -- ==========================================================================
  -- 1. Parse Timesheet Data and Validation
  -- ==========================================================================
  
  -- Extract timesheet metadata
  v_employee_id := (p_timesheet_data->>'employee_id')::UUID;
  v_period_date := (p_timesheet_data->>'period_date')::DATE;
  v_timesheet_entries := p_timesheet_data->'time_entries';
  v_approval_status := COALESCE(p_timesheet_data->>'approval_status', 'SUBMITTED');
  v_submitted_by := COALESCE((p_timesheet_data->>'submitted_by')::UUID, p_actor_id);
  
  IF v_employee_id IS NULL OR v_period_date IS NULL OR v_timesheet_entries IS NULL THEN
    RAISE EXCEPTION 'employee_id, period_date, and time_entries are required in timesheet_data';
  END IF;
  
  -- Get employee hourly rate
  SELECT field_value_number INTO v_hourly_rate
  FROM core_dynamic_data 
  WHERE entity_id = v_employee_id 
  AND field_name = 'hourly_rate';
  
  v_hourly_rate := COALESCE(v_hourly_rate, 15.00); -- Default rate
  
  -- ==========================================================================
  -- 2. Load Workforce Guardrails
  -- ==========================================================================
  
  SELECT field_value_json INTO v_work_guardrails
  FROM core_dynamic_data 
  WHERE entity_id = (
    SELECT id FROM core_entities 
    WHERE organization_id = p_org_id 
    AND entity_type = 'workforce_policy'
    AND entity_name = 'WORK_GUARDRAILS_V3'
  )
  AND field_name = 'policy_config';
  
  -- Set default guardrails if not found
  v_work_guardrails := COALESCE(v_work_guardrails, jsonb_build_object(
    'policy', 'WORK_GUARDRAILS_V3',
    'max_hours_day', 12,
    'max_hours_week', 40,
    'min_break_minutes', 30,
    'overtime_threshold', 40,
    'overtime_multiplier', 1.5
  ));
  
  -- ==========================================================================
  -- 3. Create Timesheet Posting Transaction
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_code, 
    smart_code, total_amount, currency, status,
    metadata, created_at, posted_at
  ) VALUES (
    v_run_id, p_org_id, 'WORK_TIMESHEET_POST', 
    'WORK-TIME-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'HERA.WORK.TIME.TXN.POST.V3',
    0, 'GBP', 'PROCESSING',
    jsonb_build_object(
      'employee_id', v_employee_id,
      'period_date', v_period_date,
      'approval_status', v_approval_status,
      'submitted_by', v_submitted_by,
      'actor_id', p_actor_id,
      'guardrails', v_work_guardrails
    ),
    NOW(), NOW()
  );
  
  -- ==========================================================================
  -- 4. Get Scheduled Hours for Variance Analysis
  -- ==========================================================================
  
  SELECT 
    COALESCE(SUM(
      EXTRACT(EPOCH FROM (
        (utl.metadata->>'end_time')::TIME - (utl.metadata->>'start_time')::TIME
      )) / 3600.0
    ), 0) INTO v_scheduled_hours
  FROM universal_transaction_lines utl
  JOIN universal_transactions ut ON ut.id = utl.transaction_id
  WHERE ut.organization_id = p_org_id
  AND ut.transaction_type = 'WORK_SCHEDULE_RUN'
  AND ut.status = 'COMPLETED'
  AND utl.line_type = 'SHIFT_ASSIGNMENT'
  AND (utl.metadata->>'employee_id')::UUID = v_employee_id
  AND (utl.metadata->>'date')::DATE = v_period_date;
  
  -- ==========================================================================
  -- 5. Process Time Entries with Validation
  -- ==========================================================================
  
  FOR v_entry_record IN 
    SELECT 
      (entry->>'start_time')::TIME as start_time,
      (entry->>'end_time')::TIME as end_time,
      COALESCE((entry->>'break_minutes')::INTEGER, 0) as break_minutes,
      entry->>'location_id' as location_id,
      entry->>'role_id' as role_id,
      entry->>'task_description' as task_description,
      COALESCE(entry->>'entry_type', 'REGULAR') as entry_type
    FROM jsonb_array_elements(v_timesheet_entries) as entry
  LOOP
    
    -- Calculate hours for this entry
    DECLARE
      v_entry_hours DECIMAL;
      v_net_hours DECIMAL;
      v_entry_pay DECIMAL;
      v_is_overtime BOOLEAN := FALSE;
    BEGIN
      
      -- Calculate gross hours
      v_entry_hours := EXTRACT(EPOCH FROM (v_entry_record.end_time - v_entry_record.start_time)) / 3600.0;
      
      -- Subtract break time
      v_net_hours := v_entry_hours - (v_entry_record.break_minutes / 60.0);
      v_break_minutes := v_break_minutes + v_entry_record.break_minutes;
      
      -- Compliance checks
      v_compliance_checks := v_compliance_checks + 1;
      
      -- Check daily hours limit
      IF v_total_hours + v_net_hours > (v_work_guardrails->>'max_hours_day')::DECIMAL THEN
        v_guardrail_violations := v_guardrail_violations || jsonb_build_array(
          jsonb_build_object(
            'violation_type', 'DAILY_HOURS_EXCEEDED',
            'current_hours', v_total_hours,
            'entry_hours', v_net_hours,
            'total_would_be', v_total_hours + v_net_hours,
            'limit', (v_work_guardrails->>'max_hours_day')::DECIMAL,
            'entry_start', v_entry_record.start_time,
            'entry_end', v_entry_record.end_time
          )
        );
      END IF;
      
      -- Check minimum break requirement
      IF v_entry_hours >= 6 AND v_entry_record.break_minutes < (v_work_guardrails->>'min_break_minutes')::INTEGER THEN
        v_guardrail_violations := v_guardrail_violations || jsonb_build_array(
          jsonb_build_object(
            'violation_type', 'INSUFFICIENT_BREAK',
            'shift_hours', v_entry_hours,
            'break_minutes', v_entry_record.break_minutes,
            'minimum_required', (v_work_guardrails->>'min_break_minutes')::INTEGER,
            'entry_start', v_entry_record.start_time,
            'entry_end', v_entry_record.end_time
          )
        );
      END IF;
      
      -- Determine if overtime
      IF v_total_hours + v_net_hours > (v_work_guardrails->>'overtime_threshold')::DECIMAL THEN
        DECLARE
          v_overtime_portion DECIMAL;
          v_regular_portion DECIMAL;
        BEGIN
          v_overtime_portion := (v_total_hours + v_net_hours) - (v_work_guardrails->>'overtime_threshold')::DECIMAL;
          v_regular_portion := v_net_hours - v_overtime_portion;
          
          v_regular_hours := v_regular_hours + v_regular_portion;
          v_overtime_hours := v_overtime_hours + v_overtime_portion;
          v_is_overtime := TRUE;
          
          -- Calculate pay with overtime multiplier
          v_entry_pay := (v_regular_portion * v_hourly_rate) + 
                        (v_overtime_portion * v_hourly_rate * (v_work_guardrails->>'overtime_multiplier')::DECIMAL);
          v_overtime_pay := v_overtime_pay + (v_overtime_portion * v_hourly_rate * (v_work_guardrails->>'overtime_multiplier')::DECIMAL);
        END;
      ELSE
        v_regular_hours := v_regular_hours + v_net_hours;
        v_entry_pay := v_net_hours * v_hourly_rate;
      END IF;
      
      v_regular_pay := v_regular_pay + (v_net_hours * v_hourly_rate);
      v_total_hours := v_total_hours + v_net_hours;
      v_total_pay := v_total_pay + v_entry_pay;
      
      -- Record time entry
      INSERT INTO universal_transaction_lines (
        id, transaction_id, organization_id, line_type, line_number,
        line_amount, metadata, smart_code
      ) VALUES (
        gen_random_uuid(), v_run_id, p_org_id, 'TIME_ENTRY', v_line_counter,
        v_entry_pay,
        jsonb_build_object(
          'employee_id', v_employee_id,
          'period_date', v_period_date,
          'start_time', v_entry_record.start_time,
          'end_time', v_entry_record.end_time,
          'break_minutes', v_entry_record.break_minutes,
          'gross_hours', v_entry_hours,
          'net_hours', v_net_hours,
          'hourly_rate', v_hourly_rate,
          'entry_pay', v_entry_pay,
          'is_overtime', v_is_overtime,
          'location_id', v_entry_record.location_id,
          'role_id', v_entry_record.role_id,
          'task_description', v_entry_record.task_description,
          'entry_type', v_entry_record.entry_type
        ),
        'HERA.WORK.TIME.ENTRY.V3'
      );
      
      v_line_counter := v_line_counter + 1;
      v_time_entries_processed := v_time_entries_processed + 1;
      
    END;
  END LOOP;
  
  -- ==========================================================================
  -- 6. Calculate Schedule Variance
  -- ==========================================================================
  
  v_variance_hours := v_total_hours - v_scheduled_hours;
  
  v_schedule_variance := jsonb_build_object(
    'scheduled_hours', v_scheduled_hours,
    'actual_hours', v_total_hours,
    'variance_hours', v_variance_hours,
    'variance_pct', CASE 
      WHEN v_scheduled_hours > 0 
      THEN ROUND((v_variance_hours / v_scheduled_hours) * 100, 2)
      ELSE 0 
    END,
    'variance_type', CASE 
      WHEN ABS(v_variance_hours) <= 0.25 THEN 'WITHIN_TOLERANCE'
      WHEN v_variance_hours > 0 THEN 'OVER_SCHEDULED'
      ELSE 'UNDER_SCHEDULED'
    END,
    'efficiency_score', CASE 
      WHEN v_scheduled_hours > 0 
      THEN LEAST(100, ROUND((v_scheduled_hours / v_total_hours) * 100, 2))
      ELSE 100 
    END
  );
  
  -- Record schedule variance analysis
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'SCHEDULE_VARIANCE', v_line_counter,
    ABS(v_variance_hours),
    v_schedule_variance || jsonb_build_object(
      'employee_id', v_employee_id,
      'period_date', v_period_date
    ),
    'HERA.WORK.TIME.VARIANCE.V3'
  );
  
  v_line_counter := v_line_counter + 1;
  
  -- ==========================================================================
  -- 7. Create Cost Driver Quantities for Profitability Integration
  -- ==========================================================================
  
  -- Create labor cost driver for profitability analysis
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'LABOR_COST_DRIVER', v_line_counter,
    v_total_hours,
    jsonb_build_object(
      'employee_id', v_employee_id,
      'period_date', v_period_date,
      'driver_type', 'LABOR_HOURS',
      'driver_quantity', v_total_hours,
      'driver_rate', v_hourly_rate,
      'driver_cost', v_total_pay,
      'regular_hours', v_regular_hours,
      'overtime_hours', v_overtime_hours,
      'regular_pay', v_regular_pay,
      'overtime_pay', v_overtime_pay,
      'cost_center', 'LABOR_DIRECT', -- Will be mapped to GL 6xxx in payroll accrual
      'allocation_ready', true
    ),
    'HERA.WORK.COST.DRIVER.V3'
  );
  
  v_line_counter := v_line_counter + 1;
  
  -- ==========================================================================
  -- 8. Compliance Summary
  -- ==========================================================================
  
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'COMPLIANCE_SUMMARY', v_line_counter,
    jsonb_array_length(v_guardrail_violations),
    jsonb_build_object(
      'employee_id', v_employee_id,
      'period_date', v_period_date,
      'compliance_checks', v_compliance_checks,
      'violations_found', jsonb_array_length(v_guardrail_violations),
      'violations_detail', v_guardrail_violations,
      'compliance_rate_pct', CASE 
        WHEN v_compliance_checks > 0 
        THEN ROUND(((v_compliance_checks - jsonb_array_length(v_guardrail_violations))::DECIMAL / v_compliance_checks) * 100, 2)
        ELSE 100 
      END,
      'approval_required', (jsonb_array_length(v_guardrail_violations) > 0),
      'break_compliance', (v_break_minutes >= (v_work_guardrails->>'min_break_minutes')::INTEGER)
    ),
    'HERA.WORK.COMPLIANCE.V3'
  );
  
  -- ==========================================================================
  -- 9. Complete Transaction and Return Results
  -- ==========================================================================
  
  v_processing_time_ms := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_start_time)) * 1000;
  
  UPDATE universal_transactions 
  SET 
    status = CASE 
      WHEN jsonb_array_length(v_guardrail_violations) > 0 THEN 'COMPLIANCE_REVIEW'
      ELSE 'COMPLETED' 
    END,
    total_amount = v_total_pay,
    metadata = metadata || jsonb_build_object(
      'timesheet_summary', jsonb_build_object(
        'total_hours', v_total_hours,
        'regular_hours', v_regular_hours,
        'overtime_hours', v_overtime_hours,
        'total_pay', v_total_pay,
        'regular_pay', v_regular_pay,
        'overtime_pay', v_overtime_pay,
        'break_minutes', v_break_minutes,
        'entries_processed', v_time_entries_processed
      ),
      'schedule_variance', v_schedule_variance,
      'compliance_summary', jsonb_build_object(
        'compliance_checks', v_compliance_checks,
        'violations_found', jsonb_array_length(v_guardrail_violations),
        'violations_detail', v_guardrail_violations
      ),
      'processing_time_ms', v_processing_time_ms,
      'completed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'timesheet_run_id', v_run_id,
    'employee_id', v_employee_id,
    'period_date', v_period_date,
    'organization_id', p_org_id,
    'processing_time_ms', v_processing_time_ms,
    'timesheet_summary', jsonb_build_object(
      'total_hours', v_total_hours,
      'regular_hours', v_regular_hours,
      'overtime_hours', v_overtime_hours,
      'total_pay', v_total_pay,
      'entries_processed', v_time_entries_processed
    ),
    'schedule_variance', v_schedule_variance,
    'compliance_status', CASE 
      WHEN jsonb_array_length(v_guardrail_violations) > 0 THEN 'VIOLATIONS_FOUND'
      ELSE 'COMPLIANT' 
    END,
    'violations_count', jsonb_array_length(v_guardrail_violations),
    'approval_required', (jsonb_array_length(v_guardrail_violations) > 0),
    'smart_code', 'HERA.WORK.TIME.TXN.POST.V3'
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
    'error_code', 'TIMESHEET_POSTING_FAILED',
    'error_message', SQLERRM,
    'timesheet_run_id', v_run_id,
    'smart_code', 'HERA.WORK.TIME.TXN.POST.V3'
  );
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_work_time_post_V3(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_work_time_post_V3(UUID, UUID, JSONB) TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_work_time_post_V3(UUID, UUID, JSONB) IS 'HERA Finance DNA V3.6: Workforce Timesheet Posting function that validates and posts employee timesheets with comprehensive compliance checking, variance analysis against scheduled hours, overtime calculation, and cost driver creation for profitability integration.';