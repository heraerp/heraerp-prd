-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Payroll Accrual Function
-- 
-- Creates balanced journal entries to GL accounts (6xxx) for workforce costs
-- with proper dimensionality (cost center, profit center, location, role).
-- 
-- Smart Code: HERA.WORK.PAYROLL.ACCRUE.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_work_payroll_accrue_V3(
  p_org_id UUID,
  p_actor_id UUID,
  p_accrual_meta JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID := gen_random_uuid();
  v_start_time TIMESTAMP := CLOCK_TIMESTAMP();
  v_processing_time_ms INTEGER;
  
  -- Accrual parameters
  v_period_start DATE;
  v_period_end DATE;
  v_accrual_period TEXT;
  v_location_ids UUID[];
  v_employee_ids UUID[];
  v_include_benefits BOOLEAN;
  v_include_taxes BOOLEAN;
  
  -- Cost calculations
  v_total_labor_cost DECIMAL := 0;
  v_total_regular_pay DECIMAL := 0;
  v_total_overtime_pay DECIMAL := 0;
  v_total_benefits_cost DECIMAL := 0;
  v_total_payroll_taxes DECIMAL := 0;
  v_total_employer_contributions DECIMAL := 0;
  
  -- GL account mapping
  v_labor_expense_account TEXT := '6100000'; -- Direct Labor
  v_benefits_expense_account TEXT := '6200000'; -- Employee Benefits
  v_payroll_tax_expense_account TEXT := '6300000'; -- Payroll Taxes
  v_accrued_payroll_liability TEXT := '2400000'; -- Accrued Payroll Liability
  v_payroll_tax_liability TEXT := '2450000'; -- Payroll Tax Liability
  
  -- Dimensionality
  v_cost_center_map JSONB := '{}';
  v_profit_center_map JSONB := '{}';
  
  -- Processing counters
  v_employees_processed INTEGER := 0;
  v_timesheet_entries INTEGER := 0;
  v_gl_entries_created INTEGER := 0;
  v_line_counter INTEGER := 1;
  
  -- Working variables
  v_employee_record RECORD;
  v_timesheet_record RECORD;
  v_cost_center TEXT;
  v_profit_center TEXT;
BEGIN
  -- ==========================================================================
  -- 1. Parse Accrual Parameters and Validation
  -- ==========================================================================
  
  -- Extract accrual metadata
  v_period_start := (p_accrual_meta->>'period_start')::DATE;
  v_period_end := (p_accrual_meta->>'period_end')::DATE;
  v_accrual_period := COALESCE(p_accrual_meta->>'accrual_period', 
    TO_CHAR(v_period_start, 'YYYY-MM'));
  v_include_benefits := COALESCE((p_accrual_meta->>'include_benefits')::BOOLEAN, true);
  v_include_taxes := COALESCE((p_accrual_meta->>'include_taxes')::BOOLEAN, true);
  
  -- Parse location and employee filters
  SELECT array_agg((value)::UUID) INTO v_location_ids
  FROM jsonb_array_elements_text(COALESCE(p_accrual_meta->'location_ids', '[]'));
  
  SELECT array_agg((value)::UUID) INTO v_employee_ids
  FROM jsonb_array_elements_text(COALESCE(p_accrual_meta->'employee_ids', '[]'));
  
  IF v_period_start IS NULL OR v_period_end IS NULL THEN
    RAISE EXCEPTION 'period_start and period_end are required in accrual_meta';
  END IF;
  
  -- Load cost center and profit center mapping
  SELECT field_value_json INTO v_cost_center_map
  FROM core_dynamic_data 
  WHERE entity_id = (
    SELECT id FROM core_entities 
    WHERE organization_id = p_org_id 
    AND entity_type = 'workforce_policy'
    AND entity_name = 'COST_CENTER_MAPPING_V3'
  )
  AND field_name = 'mapping_config';
  
  v_cost_center_map := COALESCE(v_cost_center_map, jsonb_build_object(
    'default_cost_center', 'LABOR_DIRECT',
    'default_profit_center', 'OPERATIONS_PRIMARY'
  ));
  
  -- ==========================================================================
  -- 2. Create Payroll Accrual Transaction
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_code, 
    smart_code, total_amount, currency, status,
    metadata, created_at, posted_at
  ) VALUES (
    v_run_id, p_org_id, 'WORK_PAYROLL_ACCRUE', 
    'WORK-PAYROLL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'HERA.WORK.PAYROLL.ACCRUE.V3',
    0, 'GBP', 'PROCESSING',
    jsonb_build_object(
      'period_start', v_period_start,
      'period_end', v_period_end,
      'accrual_period', v_accrual_period,
      'location_ids', v_location_ids,
      'employee_ids', v_employee_ids,
      'include_benefits', v_include_benefits,
      'include_taxes', v_include_taxes,
      'actor_id', p_actor_id,
      'cost_center_mapping', v_cost_center_map
    ),
    NOW(), NOW()
  );
  
  -- ==========================================================================
  -- 3. Process Timesheet Data for Accrual
  -- ==========================================================================
  
  FOR v_employee_record IN 
    SELECT 
      e.id as employee_id,
      e.entity_name as employee_name,
      e.entity_code as employee_code,
      COALESCE(hourly_rate.field_value_number, 15.00) as hourly_rate,
      COALESCE(salary_annual.field_value_number, 0) as salary_annual,
      COALESCE(contract_type.field_value_text, 'HOURLY') as contract_type,
      COALESCE(benefits_eligible.field_value_boolean, true) as benefits_eligible,
      COALESCE(tax_exempt.field_value_boolean, false) as tax_exempt,
      COALESCE(cost_center.field_value_text, v_cost_center_map->>'default_cost_center') as cost_center,
      COALESCE(profit_center.field_value_text, v_cost_center_map->>'default_profit_center') as profit_center
    FROM core_entities e
    LEFT JOIN core_dynamic_data hourly_rate ON 
      hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
    LEFT JOIN core_dynamic_data salary_annual ON 
      salary_annual.entity_id = e.id AND salary_annual.field_name = 'salary_annual'
    LEFT JOIN core_dynamic_data contract_type ON 
      contract_type.entity_id = e.id AND contract_type.field_name = 'contract_type'
    LEFT JOIN core_dynamic_data benefits_eligible ON 
      benefits_eligible.entity_id = e.id AND benefits_eligible.field_name = 'benefits_eligible'
    LEFT JOIN core_dynamic_data tax_exempt ON 
      tax_exempt.entity_id = e.id AND tax_exempt.field_name = 'tax_exempt'
    LEFT JOIN core_dynamic_data cost_center ON 
      cost_center.entity_id = e.id AND cost_center.field_name = 'cost_center'
    LEFT JOIN core_dynamic_data profit_center ON 
      profit_center.entity_id = e.id AND profit_center.field_name = 'profit_center'
    WHERE e.organization_id = p_org_id 
    AND e.entity_type = 'EMPLOYEE'
    AND e.status = 'ACTIVE'
    AND (cardinality(v_employee_ids) = 0 OR e.id = ANY(v_employee_ids))
  LOOP
    
    -- Get timesheet data for this employee in the period
    DECLARE
      v_employee_total_pay DECIMAL := 0;
      v_employee_regular_pay DECIMAL := 0;
      v_employee_overtime_pay DECIMAL := 0;
      v_employee_hours DECIMAL := 0;
      v_employee_benefits DECIMAL := 0;
      v_employee_taxes DECIMAL := 0;
    BEGIN
      
      -- Sum up approved timesheet costs for the employee
      SELECT 
        COALESCE(SUM(
          CASE WHEN ut.status IN ('COMPLETED', 'COMPLIANCE_REVIEW') 
          THEN ut.total_amount ELSE 0 END
        ), 0),
        COALESCE(SUM(
          (utl.metadata->>'regular_pay')::DECIMAL
        ), 0),
        COALESCE(SUM(
          (utl.metadata->>'overtime_pay')::DECIMAL
        ), 0),
        COALESCE(SUM(
          (utl.metadata->>'net_hours')::DECIMAL
        ), 0)
      INTO v_employee_total_pay, v_employee_regular_pay, v_employee_overtime_pay, v_employee_hours
      FROM universal_transactions ut
      JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
      WHERE ut.organization_id = p_org_id
      AND ut.transaction_type = 'WORK_TIMESHEET_POST'
      AND ut.smart_code = 'HERA.WORK.TIME.TXN.POST.V3'
      AND utl.line_type = 'TIME_ENTRY'
      AND (utl.metadata->>'employee_id')::UUID = v_employee_record.employee_id
      AND (utl.metadata->>'period_date')::DATE BETWEEN v_period_start AND v_period_end;
      
      -- Calculate benefits and taxes if applicable
      IF v_include_benefits AND v_employee_record.benefits_eligible THEN
        -- Standard benefits calculation: 25% of gross pay
        v_employee_benefits := v_employee_total_pay * 0.25;
      END IF;
      
      IF v_include_taxes AND NOT v_employee_record.tax_exempt THEN
        -- Employer payroll taxes: ~7.65% (Social Security + Medicare)
        v_employee_taxes := v_employee_total_pay * 0.0765;
      END IF;
      
      -- Only process if there are costs to accrue
      IF v_employee_total_pay > 0 THEN
        
        v_employees_processed := v_employees_processed + 1;
        v_total_labor_cost := v_total_labor_cost + v_employee_total_pay;
        v_total_regular_pay := v_total_regular_pay + v_employee_regular_pay;
        v_total_overtime_pay := v_total_overtime_pay + v_employee_overtime_pay;
        v_total_benefits_cost := v_total_benefits_cost + v_employee_benefits;
        v_total_payroll_taxes := v_total_payroll_taxes + v_employee_taxes;
        
        -- Create GL entry for labor expense (DR)
        INSERT INTO universal_transaction_lines (
          id, transaction_id, organization_id, line_type, line_number,
          line_amount, metadata, smart_code
        ) VALUES (
          gen_random_uuid(), v_run_id, p_org_id, 'GL_ENTRY_DEBIT', v_line_counter,
          v_employee_total_pay,
          jsonb_build_object(
            'gl_account', v_labor_expense_account,
            'gl_account_name', 'Direct Labor Expense',
            'employee_id', v_employee_record.employee_id,
            'employee_name', v_employee_record.employee_name,
            'cost_center', v_employee_record.cost_center,
            'profit_center', v_employee_record.profit_center,
            'period', v_accrual_period,
            'hours_worked', v_employee_hours,
            'regular_pay', v_employee_regular_pay,
            'overtime_pay', v_employee_overtime_pay,
            'entry_type', 'LABOR_EXPENSE'
          ),
          'HERA.WORK.PAYROLL.GL.LABOR.V3'
        );
        v_line_counter := v_line_counter + 1;
        v_gl_entries_created := v_gl_entries_created + 1;
        
        -- Create GL entry for payroll liability (CR)
        INSERT INTO universal_transaction_lines (
          id, transaction_id, organization_id, line_type, line_number,
          line_amount, metadata, smart_code
        ) VALUES (
          gen_random_uuid(), v_run_id, p_org_id, 'GL_ENTRY_CREDIT', v_line_counter,
          v_employee_total_pay,
          jsonb_build_object(
            'gl_account', v_accrued_payroll_liability,
            'gl_account_name', 'Accrued Payroll Liability',
            'employee_id', v_employee_record.employee_id,
            'employee_name', v_employee_record.employee_name,
            'cost_center', v_employee_record.cost_center,
            'profit_center', v_employee_record.profit_center,
            'period', v_accrual_period,
            'entry_type', 'PAYROLL_LIABILITY'
          ),
          'HERA.WORK.PAYROLL.GL.LIABILITY.V3'
        );
        v_line_counter := v_line_counter + 1;
        v_gl_entries_created := v_gl_entries_created + 1;
        
        -- Benefits expense and liability
        IF v_employee_benefits > 0 THEN
          -- Benefits expense (DR)
          INSERT INTO universal_transaction_lines (
            id, transaction_id, organization_id, line_type, line_number,
            line_amount, metadata, smart_code
          ) VALUES (
            gen_random_uuid(), v_run_id, p_org_id, 'GL_ENTRY_DEBIT', v_line_counter,
            v_employee_benefits,
            jsonb_build_object(
              'gl_account', v_benefits_expense_account,
              'gl_account_name', 'Employee Benefits Expense',
              'employee_id', v_employee_record.employee_id,
              'employee_name', v_employee_record.employee_name,
              'cost_center', v_employee_record.cost_center,
              'profit_center', v_employee_record.profit_center,
              'period', v_accrual_period,
              'entry_type', 'BENEFITS_EXPENSE'
            ),
            'HERA.WORK.PAYROLL.GL.BENEFITS.V3'
          );
          v_line_counter := v_line_counter + 1;
          v_gl_entries_created := v_gl_entries_created + 1;
          
          -- Benefits liability (CR)
          INSERT INTO universal_transaction_lines (
            id, transaction_id, organization_id, line_type, line_number,
            line_amount, metadata, smart_code
          ) VALUES (
            gen_random_uuid(), v_run_id, p_org_id, 'GL_ENTRY_CREDIT', v_line_counter,
            v_employee_benefits,
            jsonb_build_object(
              'gl_account', v_accrued_payroll_liability,
              'gl_account_name', 'Accrued Payroll Liability',
              'employee_id', v_employee_record.employee_id,
              'employee_name', v_employee_record.employee_name,
              'cost_center', v_employee_record.cost_center,
              'profit_center', v_employee_record.profit_center,
              'period', v_accrual_period,
              'entry_type', 'BENEFITS_LIABILITY'
            ),
            'HERA.WORK.PAYROLL.GL.LIABILITY.V3'
          );
          v_line_counter := v_line_counter + 1;
          v_gl_entries_created := v_gl_entries_created + 1;
        END IF;
        
        -- Payroll taxes expense and liability
        IF v_employee_taxes > 0 THEN
          -- Payroll tax expense (DR)
          INSERT INTO universal_transaction_lines (
            id, transaction_id, organization_id, line_type, line_number,
            line_amount, metadata, smart_code
          ) VALUES (
            gen_random_uuid(), v_run_id, p_org_id, 'GL_ENTRY_DEBIT', v_line_counter,
            v_employee_taxes,
            jsonb_build_object(
              'gl_account', v_payroll_tax_expense_account,
              'gl_account_name', 'Payroll Tax Expense',
              'employee_id', v_employee_record.employee_id,
              'employee_name', v_employee_record.employee_name,
              'cost_center', v_employee_record.cost_center,
              'profit_center', v_employee_record.profit_center,
              'period', v_accrual_period,
              'entry_type', 'PAYROLL_TAX_EXPENSE'
            ),
            'HERA.WORK.PAYROLL.GL.TAX.V3'
          );
          v_line_counter := v_line_counter + 1;
          v_gl_entries_created := v_gl_entries_created + 1;
          
          -- Payroll tax liability (CR)
          INSERT INTO universal_transaction_lines (
            id, transaction_id, organization_id, line_type, line_number,
            line_amount, metadata, smart_code
          ) VALUES (
            gen_random_uuid(), v_run_id, p_org_id, 'GL_ENTRY_CREDIT', v_line_counter,
            v_employee_taxes,
            jsonb_build_object(
              'gl_account', v_payroll_tax_liability,
              'gl_account_name', 'Payroll Tax Liability',
              'employee_id', v_employee_record.employee_id,
              'employee_name', v_employee_record.employee_name,
              'cost_center', v_employee_record.cost_center,
              'profit_center', v_employee_record.profit_center,
              'period', v_accrual_period,
              'entry_type', 'PAYROLL_TAX_LIABILITY'
            ),
            'HERA.WORK.PAYROLL.GL.TAX.V3'
          );
          v_line_counter := v_line_counter + 1;
          v_gl_entries_created := v_gl_entries_created + 1;
        END IF;
        
      END IF;
      
    END;
  END LOOP;
  
  -- ==========================================================================
  -- 4. Create Accrual Summary
  -- ==========================================================================
  
  v_total_employer_contributions := v_total_benefits_cost + v_total_payroll_taxes;
  
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'PAYROLL_ACCRUAL_SUMMARY', v_line_counter,
    v_total_labor_cost + v_total_employer_contributions,
    jsonb_build_object(
      'period', v_accrual_period,
      'period_start', v_period_start,
      'period_end', v_period_end,
      'employees_processed', v_employees_processed,
      'gl_entries_created', v_gl_entries_created,
      'total_labor_cost', v_total_labor_cost,
      'total_regular_pay', v_total_regular_pay,
      'total_overtime_pay', v_total_overtime_pay,
      'total_benefits_cost', v_total_benefits_cost,
      'total_payroll_taxes', v_total_payroll_taxes,
      'total_employer_contributions', v_total_employer_contributions,
      'total_accrued_amount', v_total_labor_cost + v_total_employer_contributions,
      'gl_accounts_affected', jsonb_build_array(
        v_labor_expense_account,
        v_benefits_expense_account, 
        v_payroll_tax_expense_account,
        v_accrued_payroll_liability,
        v_payroll_tax_liability
      )
    ),
    'HERA.WORK.PAYROLL.ACCRUAL.SUMMARY.V3'
  );
  
  -- ==========================================================================
  -- 5. Complete Transaction and Return Results
  -- ==========================================================================
  
  v_processing_time_ms := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_start_time)) * 1000;
  
  UPDATE universal_transactions 
  SET 
    status = 'COMPLETED',
    total_amount = v_total_labor_cost + v_total_employer_contributions,
    metadata = metadata || jsonb_build_object(
      'accrual_summary', jsonb_build_object(
        'employees_processed', v_employees_processed,
        'gl_entries_created', v_gl_entries_created,
        'total_labor_cost', v_total_labor_cost,
        'total_employer_contributions', v_total_employer_contributions,
        'total_accrued_amount', v_total_labor_cost + v_total_employer_contributions
      ),
      'processing_time_ms', v_processing_time_ms,
      'completed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'payroll_accrual_run_id', v_run_id,
    'period', v_accrual_period,
    'period_start', v_period_start,
    'period_end', v_period_end,
    'organization_id', p_org_id,
    'processing_time_ms', v_processing_time_ms,
    'accrual_summary', jsonb_build_object(
      'employees_processed', v_employees_processed,
      'gl_entries_created', v_gl_entries_created,
      'total_labor_cost', v_total_labor_cost,
      'total_benefits_cost', v_total_benefits_cost,
      'total_payroll_taxes', v_total_payroll_taxes,
      'total_accrued_amount', v_total_labor_cost + v_total_employer_contributions
    ),
    'gl_impact', jsonb_build_object(
      'entries_created', v_gl_entries_created,
      'balanced_entries', true,
      'total_debits', v_total_labor_cost + v_total_employer_contributions,
      'total_credits', v_total_labor_cost + v_total_employer_contributions
    ),
    'smart_code', 'HERA.WORK.PAYROLL.ACCRUE.V3'
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
    'error_code', 'PAYROLL_ACCRUAL_FAILED',
    'error_message', SQLERRM,
    'payroll_accrual_run_id', v_run_id,
    'smart_code', 'HERA.WORK.PAYROLL.ACCRUE.V3'
  );
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_work_payroll_accrue_V3(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_work_payroll_accrue_V3(UUID, UUID, JSONB) TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_work_payroll_accrue_V3(UUID, UUID, JSONB) IS 'HERA Finance DNA V3.6: Workforce Payroll Accrual function that creates balanced journal entries to GL accounts for workforce costs including labor, benefits, and payroll taxes with proper dimensionality tracking for cost centers and profit centers.';