-- =====================================================
-- HERA UNIVERSAL FISCAL YEAR & YEAR-END CLOSING DNA
-- =====================================================
-- Universal pattern for ANY business type and industry
-- Supports multiple fiscal year types and closing methods
-- Part of HERA DNA System - Reusable across all customers
-- =====================================================

-- Create Universal Fiscal Year DNA in System Organization
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code
) VALUES (
  'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944', -- HERA System Organization
  'dna_pattern',
  'DNA-UNIVERSAL-FISCAL-YEAR',
  'Universal Fiscal Year & Closing DNA Pattern',
  'HERA.DNA.FISCAL.UNIVERSAL.v1'
);

-- =====================================================
-- UNIVERSAL FISCAL YEAR SETUP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION hera_setup_fiscal_year(
  p_organization_id UUID,
  p_fiscal_config JSONB
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_fiscal_config_id UUID;
  v_fiscal_type TEXT;
  v_start_month INTEGER;
  v_periods_per_year INTEGER;
  v_current_year INTEGER;
  v_retained_earnings_code TEXT;
  v_current_earnings_code TEXT;
BEGIN
  -- Extract configuration
  v_fiscal_type := COALESCE(p_fiscal_config->>'fiscal_type', 'calendar'); -- calendar, fiscal, custom
  v_start_month := COALESCE((p_fiscal_config->>'start_month')::INTEGER, 1);
  v_periods_per_year := COALESCE((p_fiscal_config->>'periods_per_year')::INTEGER, 12);
  v_current_year := COALESCE((p_fiscal_config->>'current_year')::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_retained_earnings_code := COALESCE(p_fiscal_config->>'retained_earnings_account', '3200000');
  v_current_earnings_code := COALESCE(p_fiscal_config->>'current_earnings_account', '3300000');

  -- Step 1: Create Fiscal Configuration Entity
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_code,
    entity_name,
    smart_code
  ) VALUES (
    p_organization_id,
    'fiscal_configuration',
    'FISCAL-CONFIG-' || v_current_year,
    'Fiscal Year Configuration ' || v_current_year,
    'HERA.FISCAL.CONFIG.' || UPPER(v_fiscal_type) || '.v1'
  ) RETURNING id INTO v_fiscal_config_id;

  -- Step 2: Add Fiscal Settings as Dynamic Data
  INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_text, field_value_number, field_value_boolean, smart_code)
  VALUES 
    (p_organization_id, v_fiscal_config_id, 'fiscal_type', v_fiscal_type, NULL, NULL, 'HERA.FISCAL.TYPE.v1'),
    (p_organization_id, v_fiscal_config_id, 'start_month', NULL, v_start_month, NULL, 'HERA.FISCAL.START.MONTH.v1'),
    (p_organization_id, v_fiscal_config_id, 'periods_per_year', NULL, v_periods_per_year, NULL, 'HERA.FISCAL.PERIODS.v1'),
    (p_organization_id, v_fiscal_config_id, 'current_year', NULL, v_current_year, NULL, 'HERA.FISCAL.YEAR.v1'),
    (p_organization_id, v_fiscal_config_id, 'retained_earnings_account', v_retained_earnings_code, NULL, NULL, 'HERA.FISCAL.RETAINED.v1'),
    (p_organization_id, v_fiscal_config_id, 'current_earnings_account', v_current_earnings_code, NULL, NULL, 'HERA.FISCAL.CURRENT.v1'),
    (p_organization_id, v_fiscal_config_id, 'allow_parallel_years', NULL, NULL, TRUE, 'HERA.FISCAL.PARALLEL.v1'),
    (p_organization_id, v_fiscal_config_id, 'auto_close_enabled', NULL, NULL, FALSE, 'HERA.FISCAL.AUTOCLOSE.v1');

  -- Step 3: Create Fiscal Periods
  PERFORM hera_create_fiscal_periods(
    p_organization_id,
    v_fiscal_config_id,
    v_fiscal_type,
    v_start_month,
    v_periods_per_year,
    v_current_year
  );

  -- Step 4: Create Year-End Closing Configuration
  PERFORM hera_create_closing_config(
    p_organization_id,
    v_retained_earnings_code,
    v_current_earnings_code
  );

  -- Return result
  v_result := json_build_object(
    'fiscal_config_id', v_fiscal_config_id,
    'fiscal_type', v_fiscal_type,
    'periods_created', v_periods_per_year,
    'current_year', v_current_year,
    'status', 'success'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE FISCAL PERIODS (FLEXIBLE)
-- =====================================================
CREATE OR REPLACE FUNCTION hera_create_fiscal_periods(
  p_organization_id UUID,
  p_fiscal_config_id UUID,
  p_fiscal_type TEXT,
  p_start_month INTEGER,
  p_periods_per_year INTEGER,
  p_year INTEGER
) RETURNS VOID AS $$
DECLARE
  v_period_counter INTEGER;
  v_period_start DATE;
  v_period_end DATE;
  v_period_name TEXT;
  v_period_code TEXT;
  v_period_id UUID;
  v_month_names TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June', 
                                 'July', 'August', 'September', 'October', 'November', 'December'];
BEGIN
  FOR v_period_counter IN 1..p_periods_per_year LOOP
    -- Calculate period dates based on fiscal type
    IF p_fiscal_type = 'calendar' THEN
      -- Calendar year: Jan-Dec
      v_period_start := DATE(p_year || '-' || LPAD(v_period_counter::TEXT, 2, '0') || '-01');
      v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      v_period_name := v_month_names[v_period_counter] || ' ' || p_year;
    ELSIF p_fiscal_type = 'fiscal' THEN
      -- Fiscal year: Starts from specified month
      v_period_start := DATE(
        CASE 
          WHEN (p_start_month + v_period_counter - 1) <= 12 THEN p_year 
          ELSE p_year + 1 
        END || '-' || 
        LPAD(((p_start_month + v_period_counter - 1 - 1) % 12 + 1)::TEXT, 2, '0') || '-01'
      );
      v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      v_period_name := v_month_names[((p_start_month + v_period_counter - 1 - 1) % 12 + 1)] || ' ' || 
                       CASE 
                         WHEN (p_start_month + v_period_counter - 1) <= 12 THEN p_year::TEXT
                         ELSE (p_year + 1)::TEXT
                       END;
    ELSIF p_fiscal_type = 'custom' THEN
      -- Custom periods (e.g., 4-4-5 weeks, 13 periods, etc.)
      -- This is a simplified version - real implementation would need more config
      v_period_start := DATE(p_year || '-01-01') + ((v_period_counter - 1) * 28);
      v_period_end := v_period_start + 27;
      v_period_name := 'Period ' || v_period_counter || ' FY' || p_year;
    END IF;

    v_period_code := 'FY' || p_year || '-P' || LPAD(v_period_counter::TEXT, 2, '0');

    -- Create period entity
    INSERT INTO core_entities (
      organization_id,
      entity_type,
      entity_code,
      entity_name,
      smart_code
    ) VALUES (
      p_organization_id,
      'fiscal_period',
      v_period_code,
      v_period_name,
      'HERA.FISCAL.PERIOD.' || v_period_counter || '.v1'
    ) RETURNING id INTO v_period_id;

    -- Add period details
    INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_text, field_value_number, smart_code)
    VALUES 
      (p_organization_id, v_period_id, 'period_number', NULL, v_period_counter, 'HERA.FISCAL.PERIOD.NUM.v1'),
      (p_organization_id, v_period_id, 'period_status', CASE WHEN v_period_counter = p_periods_per_year THEN 'current' ELSE 'open' END, NULL, 'HERA.FISCAL.PERIOD.STATUS.v1'),
      (p_organization_id, v_period_id, 'start_date', v_period_start::TEXT, NULL, 'HERA.FISCAL.PERIOD.START.v1'),
      (p_organization_id, v_period_id, 'end_date', v_period_end::TEXT, NULL, 'HERA.FISCAL.PERIOD.END.v1');

    -- Create relationship to fiscal config
    INSERT INTO core_relationships (
      organization_id,
      from_entity_id,
      to_entity_id,
      relationship_type,
      smart_code
    ) VALUES (
      p_organization_id,
      p_fiscal_config_id,
      v_period_id,
      'has_period',
      'HERA.FISCAL.REL.CONFIG.PERIOD.v1'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE CLOSING CONFIGURATION
-- =====================================================
CREATE OR REPLACE FUNCTION hera_create_closing_config(
  p_organization_id UUID,
  p_retained_earnings_code TEXT,
  p_current_earnings_code TEXT
) RETURNS UUID AS $$
DECLARE
  v_closing_config_id UUID;
BEGIN
  -- Create closing configuration entity
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_code,
    entity_name,
    smart_code
  ) VALUES (
    p_organization_id,
    'closing_configuration',
    'YEAR-END-CONFIG',
    'Year-End Closing Configuration',
    'HERA.CLOSING.CONFIG.v1'
  ) RETURNING id INTO v_closing_config_id;

  -- Add closing configuration steps
  INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_boolean, field_value_text, smart_code)
  VALUES 
    (p_organization_id, v_closing_config_id, 'step_1_reconcile', TRUE, NULL, 'HERA.CLOSING.STEP.RECONCILE.v1'),
    (p_organization_id, v_closing_config_id, 'step_2_adjustments', TRUE, NULL, 'HERA.CLOSING.STEP.ADJUST.v1'),
    (p_organization_id, v_closing_config_id, 'step_3_close_revenue', TRUE, NULL, 'HERA.CLOSING.STEP.REVENUE.v1'),
    (p_organization_id, v_closing_config_id, 'step_4_close_expenses', TRUE, NULL, 'HERA.CLOSING.STEP.EXPENSES.v1'),
    (p_organization_id, v_closing_config_id, 'step_5_calculate_pl', TRUE, NULL, 'HERA.CLOSING.STEP.PL.v1'),
    (p_organization_id, v_closing_config_id, 'step_6_transfer_retained', TRUE, NULL, 'HERA.CLOSING.STEP.RETAINED.v1'),
    (p_organization_id, v_closing_config_id, 'retained_earnings_account', NULL, p_retained_earnings_code, 'HERA.CLOSING.RETAINED.v1'),
    (p_organization_id, v_closing_config_id, 'current_earnings_account', NULL, p_current_earnings_code, 'HERA.CLOSING.CURRENT.v1');

  -- Create standard closing checklist template
  PERFORM hera_create_closing_checklist(p_organization_id);

  RETURN v_closing_config_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UNIVERSAL YEAR-END CLOSING FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION hera_universal_year_end_closing(
  p_organization_id UUID,
  p_fiscal_year INTEGER,
  p_closing_date DATE DEFAULT CURRENT_DATE,
  p_options JSONB DEFAULT '{}'::JSONB
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_retained_earnings_id UUID;
  v_current_year_id UUID;
  v_total_revenue DECIMAL(15,2) := 0;
  v_total_expenses DECIMAL(15,2) := 0;
  v_total_other_income DECIMAL(15,2) := 0;
  v_total_other_expenses DECIMAL(15,2) := 0;
  v_net_income DECIMAL(15,2) := 0;
  v_closing_entry_id UUID;
  v_revenue_pattern TEXT;
  v_expense_pattern TEXT;
  v_close_by_department BOOLEAN;
  v_close_by_branch BOOLEAN;
BEGIN
  -- Extract options
  v_revenue_pattern := COALESCE(p_options->>'revenue_pattern', '4%');
  v_expense_pattern := COALESCE(p_options->>'expense_pattern', '5%');
  v_close_by_department := COALESCE((p_options->>'close_by_department')::BOOLEAN, FALSE);
  v_close_by_branch := COALESCE((p_options->>'close_by_branch')::BOOLEAN, FALSE);

  -- Get retained earnings and current year accounts
  SELECT e.id INTO v_retained_earnings_id
  FROM core_entities e
  JOIN core_dynamic_data d ON d.entity_id = e.id
  WHERE e.organization_id = p_organization_id
    AND e.entity_type = 'gl_account'
    AND d.field_name = 'account_type'
    AND d.field_value_text = 'retained_earnings';
    
  SELECT e.id INTO v_current_year_id
  FROM core_entities e
  JOIN core_dynamic_data d ON d.entity_id = e.id
  WHERE e.organization_id = p_organization_id
    AND e.entity_type = 'gl_account'
    AND d.field_name = 'account_type'
    AND d.field_value_text = 'current_year_earnings';

  -- Calculate revenues and expenses
  -- This is a flexible pattern that works for any COA structure
  WITH period_transactions AS (
    SELECT 
      e.entity_code,
      e.entity_name,
      SUM(CASE 
        WHEN dd.field_value_text = 'credit' THEN tl.line_amount 
        ELSE -tl.line_amount 
      END) as net_amount
    FROM universal_transaction_lines tl
    JOIN universal_transactions t ON t.id = tl.transaction_id
    JOIN core_entities e ON e.id = tl.line_entity_id
    LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'normal_balance'
    WHERE t.organization_id = p_organization_id
      AND EXTRACT(YEAR FROM t.transaction_date) = p_fiscal_year
      AND e.entity_type = 'gl_account'
    GROUP BY e.entity_code, e.entity_name
  )
  SELECT 
    COALESCE(SUM(CASE WHEN entity_code LIKE v_revenue_pattern THEN net_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entity_code LIKE v_expense_pattern THEN net_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entity_code LIKE '6%' THEN net_amount ELSE 0 END), 0), -- Other income
    COALESCE(SUM(CASE WHEN entity_code LIKE '7%' THEN net_amount ELSE 0 END), 0)  -- Other expenses
  INTO v_total_revenue, v_total_expenses, v_total_other_income, v_total_other_expenses
  FROM period_transactions;

  -- Calculate net income
  v_net_income := v_total_revenue - v_total_expenses + v_total_other_income - v_total_other_expenses;

  -- Create closing journal entry
  INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    description,
    total_amount,
    smart_code,
    metadata
  ) VALUES (
    p_organization_id,
    'journal_entry',
    'JE-CLOSING-' || p_fiscal_year,
    p_closing_date,
    'Year-end closing for fiscal year ' || p_fiscal_year,
    ABS(v_net_income),
    'HERA.CLOSING.JE.YEAREND.v1',
    jsonb_build_object(
      'fiscal_year', p_fiscal_year,
      'revenue', v_total_revenue,
      'expenses', v_total_expenses,
      'other_income', v_total_other_income,
      'other_expenses', v_total_other_expenses,
      'net_income', v_net_income
    )
  ) RETURNING id INTO v_closing_entry_id;

  -- Create closing entry lines
  IF v_net_income > 0 THEN
    -- Profit: Debit Current Year, Credit Retained Earnings
    INSERT INTO universal_transaction_lines (
      transaction_id, 
      line_entity_id, 
      line_number, 
      line_amount, 
      metadata,
      smart_code
    ) VALUES 
      (v_closing_entry_id, v_current_year_id, 1, v_net_income, 
       jsonb_build_object('line_type', 'debit', 'description', 'Close profit to retained earnings'),
       'HERA.CLOSING.LINE.DEBIT.v1'),
      (v_closing_entry_id, v_retained_earnings_id, 2, v_net_income, 
       jsonb_build_object('line_type', 'credit', 'description', 'Transfer profit to retained earnings'),
       'HERA.CLOSING.LINE.CREDIT.v1');
  ELSE
    -- Loss: Debit Retained Earnings, Credit Current Year
    INSERT INTO universal_transaction_lines (
      transaction_id, 
      line_entity_id, 
      line_number, 
      line_amount, 
      metadata,
      smart_code
    ) VALUES 
      (v_closing_entry_id, v_retained_earnings_id, 1, ABS(v_net_income), 
       jsonb_build_object('line_type', 'debit', 'description', 'Transfer loss from retained earnings'),
       'HERA.CLOSING.LINE.DEBIT.v1'),
      (v_closing_entry_id, v_current_year_id, 2, ABS(v_net_income), 
       jsonb_build_object('line_type', 'credit', 'description', 'Close loss from current year'),
       'HERA.CLOSING.LINE.CREDIT.v1');
  END IF;

  -- Mark fiscal periods as closed
  UPDATE core_dynamic_data
  SET field_value_text = 'closed'
  WHERE organization_id = p_organization_id
    AND field_name = 'period_status'
    AND entity_id IN (
      SELECT e.id 
      FROM core_entities e
      WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'fiscal_period'
        AND e.entity_code LIKE 'FY' || p_fiscal_year || '%'
    );

  -- Return comprehensive results
  v_result := json_build_object(
    'fiscal_year', p_fiscal_year,
    'closing_date', p_closing_date,
    'total_revenue', v_total_revenue,
    'total_expenses', v_total_expenses,
    'other_income', v_total_other_income,
    'other_expenses', v_total_other_expenses,
    'net_income', v_net_income,
    'closing_entry_id', v_closing_entry_id,
    'periods_closed', p_fiscal_year,
    'status', 'completed'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UNIVERSAL CLOSING CHECKLIST
-- =====================================================
CREATE OR REPLACE FUNCTION hera_create_closing_checklist(
  p_organization_id UUID,
  p_industry_type TEXT DEFAULT 'general'
) RETURNS VOID AS $$
DECLARE
  v_checklist_items JSONB;
  v_item JSONB;
BEGIN
  -- Universal checklist items applicable to any business
  v_checklist_items := '[
    {"code": "YEC-01", "name": "Reconcile all bank accounts", "category": "reconciliation", "required": true},
    {"code": "YEC-02", "name": "Complete physical inventory count", "category": "inventory", "required": true},
    {"code": "YEC-03", "name": "Review and adjust prepaid expenses", "category": "adjustments", "required": true},
    {"code": "YEC-04", "name": "Accrue unpaid expenses", "category": "adjustments", "required": true},
    {"code": "YEC-05", "name": "Calculate and book depreciation", "category": "adjustments", "required": true},
    {"code": "YEC-06", "name": "Review accounts receivable aging", "category": "receivables", "required": true},
    {"code": "YEC-07", "name": "Review accounts payable", "category": "payables", "required": true},
    {"code": "YEC-08", "name": "Reconcile intercompany accounts", "category": "reconciliation", "required": false},
    {"code": "YEC-09", "name": "Review tax accounts and liabilities", "category": "tax", "required": true},
    {"code": "YEC-10", "name": "Generate preliminary trial balance", "category": "reporting", "required": true},
    {"code": "YEC-11", "name": "Review revenue recognition", "category": "revenue", "required": true},
    {"code": "YEC-12", "name": "Review expense classifications", "category": "expenses", "required": true},
    {"code": "YEC-13", "name": "Book final adjusting entries", "category": "adjustments", "required": true},
    {"code": "YEC-14", "name": "Generate final trial balance", "category": "reporting", "required": true},
    {"code": "YEC-15", "name": "Close revenue accounts", "category": "closing", "required": true},
    {"code": "YEC-16", "name": "Close expense accounts", "category": "closing", "required": true},
    {"code": "YEC-17", "name": "Transfer net income/loss", "category": "closing", "required": true},
    {"code": "YEC-18", "name": "Generate financial statements", "category": "reporting", "required": true},
    {"code": "YEC-19", "name": "Document closing journal entries", "category": "documentation", "required": true},
    {"code": "YEC-20", "name": "Backup all financial data", "category": "backup", "required": true}
  ]'::JSONB;

  -- Add industry-specific items
  IF p_industry_type = 'retail' OR p_industry_type = 'salon' THEN
    v_checklist_items := v_checklist_items || '[
      {"code": "YEC-R01", "name": "Reconcile gift card liabilities", "category": "liabilities", "required": true},
      {"code": "YEC-R02", "name": "Review customer loyalty points", "category": "liabilities", "required": false}
    ]'::JSONB;
  ELSIF p_industry_type = 'manufacturing' THEN
    v_checklist_items := v_checklist_items || '[
      {"code": "YEC-M01", "name": "Complete work-in-progress valuation", "category": "inventory", "required": true},
      {"code": "YEC-M02", "name": "Review standard cost variances", "category": "costing", "required": true}
    ]'::JSONB;
  ELSIF p_industry_type = 'services' THEN
    v_checklist_items := v_checklist_items || '[
      {"code": "YEC-S01", "name": "Review unbilled services", "category": "revenue", "required": true},
      {"code": "YEC-S02", "name": "Calculate project completion percentages", "category": "revenue", "required": false}
    ]'::JSONB;
  END IF;

  -- Create checklist items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_checklist_items) LOOP
    INSERT INTO core_entities (
      organization_id,
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      metadata
    ) VALUES (
      p_organization_id,
      'closing_checklist_item',
      v_item->>'code',
      v_item->>'name',
      'HERA.CLOSING.CHECKLIST.' || (v_item->>'code') || '.v1',
      jsonb_build_object(
        'category', v_item->>'category',
        'required', (v_item->>'required')::BOOLEAN,
        'status', 'pending',
        'industry_specific', CASE WHEN (v_item->>'code') LIKE 'YEC-%' THEN FALSE ELSE TRUE END
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERIOD STATUS MANAGEMENT
-- =====================================================
CREATE OR REPLACE FUNCTION hera_manage_period_status(
  p_organization_id UUID,
  p_period_id UUID,
  p_new_status TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_current_status TEXT;
  v_period_code TEXT;
BEGIN
  -- Get current status
  SELECT d.field_value_text, e.entity_code
  INTO v_current_status, v_period_code
  FROM core_dynamic_data d
  JOIN core_entities e ON e.id = d.entity_id
  WHERE d.entity_id = p_period_id
    AND d.field_name = 'period_status';

  -- Validate status transition
  IF v_current_status = 'closed' AND p_new_status != 'closed' THEN
    RAISE EXCEPTION 'Cannot reopen a closed period without proper authorization';
  END IF;

  -- Update status
  UPDATE core_dynamic_data
  SET field_value_text = p_new_status,
      updated_at = CURRENT_TIMESTAMP
  WHERE entity_id = p_period_id
    AND field_name = 'period_status';

  -- Log the change
  INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    metadata
  ) VALUES (
    p_organization_id,
    'audit_log',
    'PERIOD-CHANGE-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS'),
    'Period Status Change: ' || v_period_code,
    'HERA.AUDIT.PERIOD.STATUS.v1',
    jsonb_build_object(
      'period_id', p_period_id,
      'old_status', v_current_status,
      'new_status', p_new_status,
      'changed_by', p_user_id,
      'changed_at', CURRENT_TIMESTAMP
    )
  );

  v_result := json_build_object(
    'period_id', p_period_id,
    'period_code', v_period_code,
    'old_status', v_current_status,
    'new_status', p_new_status,
    'status', 'success'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FISCAL YEAR ROLLOVER
-- =====================================================
CREATE OR REPLACE FUNCTION hera_fiscal_year_rollover(
  p_organization_id UUID,
  p_old_year INTEGER,
  p_new_year INTEGER
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_old_config_id UUID;
  v_new_config_id UUID;
  v_fiscal_type TEXT;
  v_start_month INTEGER;
  v_periods_per_year INTEGER;
BEGIN
  -- Get configuration from old year
  SELECT 
    e.id,
    MAX(CASE WHEN d.field_name = 'fiscal_type' THEN d.field_value_text END),
    MAX(CASE WHEN d.field_name = 'start_month' THEN d.field_value_number::INTEGER END),
    MAX(CASE WHEN d.field_name = 'periods_per_year' THEN d.field_value_number::INTEGER END)
  INTO v_old_config_id, v_fiscal_type, v_start_month, v_periods_per_year
  FROM core_entities e
  JOIN core_dynamic_data d ON d.entity_id = e.id
  WHERE e.organization_id = p_organization_id
    AND e.entity_type = 'fiscal_configuration'
    AND e.entity_code = 'FISCAL-CONFIG-' || p_old_year
  GROUP BY e.id;

  -- Create new year configuration
  v_result := hera_setup_fiscal_year(
    p_organization_id,
    jsonb_build_object(
      'fiscal_type', v_fiscal_type,
      'start_month', v_start_month,
      'periods_per_year', v_periods_per_year,
      'current_year', p_new_year
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION hera_setup_fiscal_year TO authenticated;
GRANT EXECUTE ON FUNCTION hera_universal_year_end_closing TO authenticated;
GRANT EXECUTE ON FUNCTION hera_manage_period_status TO authenticated;
GRANT EXECUTE ON FUNCTION hera_fiscal_year_rollover TO authenticated;