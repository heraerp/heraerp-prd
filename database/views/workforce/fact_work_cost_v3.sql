-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Cost Fact View
-- 
-- Comprehensive workforce cost analytics providing detailed cost breakdowns,
-- variance analysis, and trend monitoring for AI-powered workforce optimization.
-- 
-- Smart Code: HERA.WORK.COST.FACT.ANALYSIS.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS fact_work_cost_v3 CASCADE;

-- Create workforce cost fact view
CREATE VIEW fact_work_cost_v3 AS
WITH time_periods AS (
  -- Generate standardized time dimensions
  SELECT 
    DATE_TRUNC('day', d) as fact_date,
    DATE_TRUNC('week', d) as fact_week,
    DATE_TRUNC('month', d) as fact_month,
    DATE_TRUNC('quarter', d) as fact_quarter,
    DATE_TRUNC('year', d) as fact_year,
    EXTRACT(DOW FROM d) as day_of_week,
    EXTRACT(WEEK FROM d) as week_number,
    EXTRACT(MONTH FROM d) as month_number,
    EXTRACT(QUARTER FROM d) as quarter_number,
    EXTRACT(YEAR FROM d) as year_number
  FROM generate_series(
    CURRENT_DATE - INTERVAL '2 years',
    CURRENT_DATE + INTERVAL '1 year',
    INTERVAL '1 day'
  ) as d
),
employee_dimensions AS (
  -- Employee master data with cost center information
  SELECT 
    e.organization_id,
    e.id as employee_id,
    e.entity_name as employee_name,
    e.entity_code as employee_code,
    e.status as employee_status,
    COALESCE(hourly_rate.field_value_number, 15.00) as base_hourly_rate,
    COALESCE(contract_type.field_value_text, 'FULL_TIME') as contract_type,
    COALESCE(fte_pct.field_value_number, 100) as fte_percentage,
    COALESCE(cost_center.field_value_text, 'OPERATIONS') as cost_center,
    COALESCE(department.field_value_text, 'GENERAL') as department,
    COALESCE(location.field_value_text, 'MAIN') as location,
    COALESCE(overtime_rate.field_value_number, 1.5) as overtime_multiplier,
    COALESCE(annual_salary.field_value_number, 0) as annual_salary,
    COALESCE(employment_start.field_value_date, e.created_at::DATE) as employment_start_date
  FROM core_entities e
  LEFT JOIN core_dynamic_data hourly_rate ON 
    hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
  LEFT JOIN core_dynamic_data contract_type ON 
    contract_type.entity_id = e.id AND contract_type.field_name = 'contract_type'
  LEFT JOIN core_dynamic_data fte_pct ON 
    fte_pct.entity_id = e.id AND fte_pct.field_name = 'fte_pct'
  LEFT JOIN core_dynamic_data cost_center ON 
    cost_center.entity_id = e.id AND cost_center.field_name = 'cost_center'
  LEFT JOIN core_dynamic_data department ON 
    department.entity_id = e.id AND department.field_name = 'department'
  LEFT JOIN core_dynamic_data location ON 
    location.entity_id = e.id AND location.field_name = 'location'
  LEFT JOIN core_dynamic_data overtime_rate ON 
    overtime_rate.entity_id = e.id AND overtime_rate.field_name = 'overtime_rate'
  LEFT JOIN core_dynamic_data annual_salary ON 
    annual_salary.entity_id = e.id AND annual_salary.field_name = 'annual_salary'
  LEFT JOIN core_dynamic_data employment_start ON 
    employment_start.entity_id = e.id AND employment_start.field_name = 'employment_start_date'
  WHERE e.entity_type = 'EMPLOYEE'
),
timesheet_facts AS (
  -- Extract timesheet posting facts
  SELECT 
    ut.organization_id,
    (ut.metadata->>'employee_id')::UUID as employee_id,
    DATE(utl.metadata->>'work_date') as work_date,
    ut.id as timesheet_transaction_id,
    utl.id as timesheet_line_id,
    
    -- Time metrics
    COALESCE((utl.metadata->>'regular_hours')::DECIMAL, 0) as regular_hours,
    COALESCE((utl.metadata->>'overtime_hours')::DECIMAL, 0) as overtime_hours,
    COALESCE((utl.metadata->>'break_hours')::DECIMAL, 0) as break_hours,
    COALESCE((utl.metadata->>'net_hours')::DECIMAL, 0) as net_hours,
    COALESCE((utl.metadata->>'billable_hours')::DECIMAL, 0) as billable_hours,
    
    -- Cost metrics
    COALESCE((utl.metadata->>'regular_cost')::DECIMAL, 0) as regular_cost,
    COALESCE((utl.metadata->>'overtime_cost')::DECIMAL, 0) as overtime_cost,
    COALESCE((utl.metadata->>'total_gross_cost')::DECIMAL, 0) as total_gross_cost,
    COALESCE((utl.metadata->>'employer_taxes')::DECIMAL, 0) as employer_taxes,
    COALESCE((utl.metadata->>'benefits_cost')::DECIMAL, 0) as benefits_cost,
    COALESCE((utl.metadata->>'total_employer_cost')::DECIMAL, 0) as total_employer_cost,
    
    -- Rate information
    COALESCE((utl.metadata->>'hourly_rate')::DECIMAL, 0) as effective_hourly_rate,
    COALESCE((utl.metadata->>'overtime_rate')::DECIMAL, 0) as effective_overtime_rate,
    
    -- Performance metrics
    COALESCE((utl.metadata->>'productivity_score')::DECIMAL, 100) as productivity_score,
    COALESCE((utl.metadata->>'quality_score')::DECIMAL, 100) as quality_score,
    utl.metadata->>'project_code' as project_code,
    utl.metadata->>'task_category' as task_category,
    
    -- Status and control
    ut.status as timesheet_status,
    ut.created_at as posted_timestamp,
    ut.posted_at as approved_timestamp
    
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_TIMESHEET_POST'
  AND utl.line_type = 'TIME_ENTRY'
  AND ut.status IN ('COMPLETED', 'COMPLIANCE_REVIEW', 'APPROVED')
),
schedule_facts AS (
  -- Extract scheduling facts
  SELECT 
    ut.organization_id,
    (utl.metadata->>'employee_id')::UUID as employee_id,
    DATE(utl.metadata->>'date') as scheduled_date,
    ut.id as schedule_transaction_id,
    utl.id as schedule_line_id,
    
    -- Schedule metrics
    COALESCE((utl.metadata->>'shift_hours')::DECIMAL, 0) as scheduled_hours,
    COALESCE((utl.metadata->>'break_minutes')::DECIMAL, 0) as scheduled_break_minutes,
    COALESCE((utl.metadata->>'total_cost')::DECIMAL, 0) as scheduled_cost,
    COALESCE((utl.metadata->>'hourly_rate')::DECIMAL, 0) as scheduled_hourly_rate,
    
    -- Schedule attributes
    utl.metadata->>'template_name' as shift_template,
    utl.metadata->>'role_required' as role_required,
    utl.metadata->>'start_time' as shift_start_time,
    utl.metadata->>'end_time' as shift_end_time,
    utl.metadata->>'assignment_method' as assignment_method,
    
    -- Control information
    ut.status as schedule_status,
    ut.created_at as schedule_created_timestamp
    
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_SCHEDULE_RUN'
  AND utl.line_type = 'SHIFT_ASSIGNMENT'
  AND ut.status = 'COMPLETED'
),
payroll_facts AS (
  -- Extract payroll accrual facts
  SELECT 
    ut.organization_id,
    (utl.metadata->>'employee_id')::UUID as employee_id,
    DATE(ut.metadata->>'pay_period_start') as pay_period_start,
    DATE(ut.metadata->>'pay_period_end') as pay_period_end,
    ut.id as payroll_transaction_id,
    utl.id as payroll_line_id,
    
    -- Payroll amounts
    COALESCE((utl.metadata->>'gross_pay')::DECIMAL, 0) as gross_pay,
    COALESCE((utl.metadata->>'regular_pay')::DECIMAL, 0) as regular_pay,
    COALESCE((utl.metadata->>'overtime_pay')::DECIMAL, 0) as overtime_pay,
    COALESCE((utl.metadata->>'bonus_pay')::DECIMAL, 0) as bonus_pay,
    COALESCE((utl.metadata->>'employer_tax')::DECIMAL, 0) as employer_tax,
    COALESCE((utl.metadata->>'employer_benefits')::DECIMAL, 0) as employer_benefits,
    COALESCE((utl.metadata->>'total_employer_cost')::DECIMAL, 0) as payroll_employer_cost,
    
    -- Hours
    COALESCE((utl.metadata->>'total_hours')::DECIMAL, 0) as payroll_total_hours,
    COALESCE((utl.metadata->>'regular_hours')::DECIMAL, 0) as payroll_regular_hours,
    COALESCE((utl.metadata->>'overtime_hours')::DECIMAL, 0) as payroll_overtime_hours,
    
    -- Status
    ut.status as payroll_status,
    ut.created_at as payroll_processed_timestamp
    
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_PAYROLL_ACCRUE'
  AND utl.line_type = 'EMPLOYEE_PAYROLL'
  AND ut.status = 'COMPLETED'
),
cost_variances AS (
  -- Calculate cost variances between scheduled vs actual
  SELECT 
    COALESCE(sf.organization_id, tf.organization_id) as organization_id,
    COALESCE(sf.employee_id, tf.employee_id) as employee_id,
    COALESCE(sf.scheduled_date, tf.work_date) as variance_date,
    
    -- Scheduled metrics
    COALESCE(sf.scheduled_hours, 0) as scheduled_hours,
    COALESCE(sf.scheduled_cost, 0) as scheduled_cost,
    COALESCE(sf.scheduled_hourly_rate, 0) as scheduled_hourly_rate,
    sf.shift_template,
    sf.assignment_method,
    
    -- Actual metrics
    COALESCE(tf.net_hours, 0) as actual_hours,
    COALESCE(tf.total_employer_cost, 0) as actual_cost,
    COALESCE(tf.effective_hourly_rate, 0) as actual_hourly_rate,
    COALESCE(tf.overtime_hours, 0) as actual_overtime_hours,
    
    -- Variance calculations
    COALESCE(tf.net_hours, 0) - COALESCE(sf.scheduled_hours, 0) as hours_variance,
    COALESCE(tf.total_employer_cost, 0) - COALESCE(sf.scheduled_cost, 0) as cost_variance,
    
    -- Variance percentages
    CASE 
      WHEN COALESCE(sf.scheduled_hours, 0) > 0 
      THEN ROUND(((COALESCE(tf.net_hours, 0) - COALESCE(sf.scheduled_hours, 0)) / sf.scheduled_hours) * 100, 2)
      ELSE 0 
    END as hours_variance_pct,
    
    CASE 
      WHEN COALESCE(sf.scheduled_cost, 0) > 0 
      THEN ROUND(((COALESCE(tf.total_employer_cost, 0) - COALESCE(sf.scheduled_cost, 0)) / sf.scheduled_cost) * 100, 2)
      ELSE 0 
    END as cost_variance_pct,
    
    -- Performance indicators
    COALESCE(tf.productivity_score, 100) as productivity_score,
    COALESCE(tf.quality_score, 100) as quality_score,
    tf.project_code,
    tf.task_category,
    
    -- Source transaction IDs
    sf.schedule_transaction_id,
    tf.timesheet_transaction_id
    
  FROM schedule_facts sf
  FULL OUTER JOIN timesheet_facts tf ON 
    sf.employee_id = tf.employee_id 
    AND sf.scheduled_date = tf.work_date
)
SELECT 
  -- Organization and time dimensions
  tp.fact_date,
  tp.fact_week,
  tp.fact_month,
  tp.fact_quarter,
  tp.fact_year,
  tp.day_of_week,
  tp.week_number,
  tp.month_number,
  tp.quarter_number,
  tp.year_number,
  
  -- Employee dimensions
  ed.organization_id,
  ed.employee_id,
  ed.employee_name,
  ed.employee_code,
  ed.employee_status,
  ed.contract_type,
  ed.cost_center,
  ed.department,
  ed.location,
  ed.base_hourly_rate,
  ed.overtime_multiplier,
  ed.fte_percentage,
  
  -- Actual cost facts (from timesheets)
  COALESCE(cv.actual_hours, 0) as actual_hours,
  COALESCE(cv.actual_overtime_hours, 0) as actual_overtime_hours,
  COALESCE(cv.actual_cost, 0) as actual_total_cost,
  COALESCE(cv.actual_hourly_rate, ed.base_hourly_rate) as actual_hourly_rate,
  
  -- Scheduled cost facts
  COALESCE(cv.scheduled_hours, 0) as scheduled_hours,
  COALESCE(cv.scheduled_cost, 0) as scheduled_total_cost,
  COALESCE(cv.scheduled_hourly_rate, ed.base_hourly_rate) as scheduled_hourly_rate,
  cv.shift_template,
  cv.assignment_method,
  
  -- Variance analysis
  cv.hours_variance,
  cv.cost_variance,
  cv.hours_variance_pct,
  cv.cost_variance_pct,
  
  -- Performance metrics
  cv.productivity_score,
  cv.quality_score,
  cv.project_code,
  cv.task_category,
  
  -- Payroll reconciliation (monthly)
  pf.gross_pay as payroll_gross_pay,
  pf.payroll_employer_cost,
  pf.payroll_total_hours,
  
  -- Derived metrics
  CASE 
    WHEN cv.actual_hours > 0 
    THEN ROUND(cv.actual_cost / cv.actual_hours, 2)
    ELSE 0 
  END as cost_per_hour_actual,
  
  CASE 
    WHEN cv.scheduled_hours > 0 
    THEN ROUND(cv.scheduled_cost / cv.scheduled_hours, 2)
    ELSE 0 
  END as cost_per_hour_scheduled,
  
  -- Efficiency indicators
  CASE 
    WHEN cv.scheduled_hours > 0 AND cv.actual_hours > 0
    THEN ROUND((cv.actual_hours / cv.scheduled_hours) * 100, 2)
    ELSE 0 
  END as schedule_adherence_pct,
  
  CASE 
    WHEN cv.actual_hours > 0 
    THEN ROUND((cv.productivity_score / 100) * cv.actual_hours, 2)
    ELSE 0 
  END as productive_hours_equivalent,
  
  -- Cost efficiency scoring
  LEAST(100, ROUND(
    (CASE WHEN cv.cost_variance_pct <= 0 THEN 100 ELSE GREATEST(0, 100 + cv.cost_variance_pct) END * 0.4) +
    (cv.productivity_score * 0.3) +
    (cv.quality_score * 0.3)
  )) as cost_efficiency_score,
  
  -- Data quality indicators
  CASE 
    WHEN cv.actual_hours IS NOT NULL AND cv.scheduled_hours IS NOT NULL THEN 'COMPLETE'
    WHEN cv.actual_hours IS NOT NULL THEN 'ACTUAL_ONLY'
    WHEN cv.scheduled_hours IS NOT NULL THEN 'SCHEDULED_ONLY'
    ELSE 'NO_DATA'
  END as data_completeness,
  
  -- Source tracking
  cv.schedule_transaction_id,
  cv.timesheet_transaction_id,
  pf.payroll_transaction_id,
  
  -- Audit information
  CURRENT_TIMESTAMP as fact_generated_at,
  'HERA.WORK.COST.FACT.ANALYSIS.V3' as smart_code

FROM time_periods tp
LEFT JOIN cost_variances cv ON tp.fact_date = cv.variance_date
LEFT JOIN employee_dimensions ed ON ed.employee_id = cv.employee_id
LEFT JOIN payroll_facts pf ON 
  pf.employee_id = cv.employee_id 
  AND tp.fact_date >= pf.pay_period_start 
  AND tp.fact_date <= pf.pay_period_end

WHERE (cv.employee_id IS NOT NULL OR ed.employee_id IS NOT NULL)
AND tp.fact_date >= CURRENT_DATE - INTERVAL '13 months'
AND tp.fact_date <= CURRENT_DATE

ORDER BY 
  ed.organization_id,
  ed.employee_id,
  tp.fact_date DESC;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary time-series index
CREATE INDEX idx_fact_work_cost_v3_primary 
ON fact_work_cost_v3 (organization_id, fact_date DESC, employee_id);

-- Cost analysis index
CREATE INDEX idx_fact_work_cost_v3_cost_analysis 
ON fact_work_cost_v3 (organization_id, cost_center, fact_month, actual_total_cost DESC);

-- Variance analysis index
CREATE INDEX idx_fact_work_cost_v3_variance 
ON fact_work_cost_v3 (organization_id, cost_variance_pct, hours_variance_pct, fact_date DESC);

-- Performance analysis index
CREATE INDEX idx_fact_work_cost_v3_performance 
ON fact_work_cost_v3 (organization_id, cost_efficiency_score DESC, productivity_score DESC, fact_date DESC);

-- Time dimension indexes
CREATE INDEX idx_fact_work_cost_v3_week 
ON fact_work_cost_v3 (organization_id, fact_week, cost_center);

CREATE INDEX idx_fact_work_cost_v3_month 
ON fact_work_cost_v3 (organization_id, fact_month, department);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON fact_work_cost_v3 TO authenticated;
GRANT SELECT ON fact_work_cost_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW fact_work_cost_v3 IS 'HERA Finance DNA V3.6: Comprehensive workforce cost fact table providing detailed cost analysis, variance tracking, performance metrics, and efficiency scoring for AI-powered workforce optimization and cost management.';