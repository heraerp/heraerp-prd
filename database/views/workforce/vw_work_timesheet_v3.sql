-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Timesheet Management View
-- 
-- Comprehensive timesheet view providing time tracking, approval workflows,
-- compliance monitoring, and payroll integration for workforce management.
-- 
-- Smart Code: HERA.WORK.TIMESHEET.MANAGEMENT.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_work_timesheet_v3 CASCADE;

-- Create workforce timesheet management view
CREATE VIEW vw_work_timesheet_v3 AS
WITH timesheet_transactions AS (
  -- Base timesheet transaction data
  SELECT 
    ut.organization_id,
    ut.id as timesheet_transaction_id,
    ut.transaction_code as timesheet_number,
    ut.transaction_date,
    ut.status as timesheet_status,
    ut.created_at as timesheet_created,
    ut.posted_at as timesheet_posted,
    ut.total_amount as total_cost,
    ut.currency,
    
    -- Employee information from metadata
    (ut.metadata->>'employee_id')::UUID as employee_id,
    ut.metadata->>'employee_name' as employee_name,
    ut.metadata->>'employee_code' as employee_code,
    ut.metadata->>'cost_center' as cost_center,
    ut.metadata->>'department' as department,
    ut.metadata->>'supervisor_id' as supervisor_id,
    
    -- Pay period information
    DATE(ut.metadata->>'pay_period_start') as pay_period_start,
    DATE(ut.metadata->>'pay_period_end') as pay_period_end,
    ut.metadata->>'pay_period_type' as pay_period_type,
    
    -- Approval workflow
    ut.metadata->>'submitted_by' as submitted_by,
    TIMESTAMP(ut.metadata->>'submitted_at') as submitted_at,
    ut.metadata->>'approved_by' as approved_by,
    TIMESTAMP(ut.metadata->>'approved_at') as approved_at,
    ut.metadata->>'approval_notes' as approval_notes,
    
    -- Compliance and validation
    COALESCE((ut.metadata->>'compliance_passed')::BOOLEAN, false) as compliance_passed,
    ut.metadata->>'compliance_issues' as compliance_issues,
    COALESCE((ut.metadata->>'auto_calculated')::BOOLEAN, false) as auto_calculated,
    ut.metadata->>'calculation_method' as calculation_method,
    
    -- Summary metrics from metadata
    COALESCE((ut.metadata->>'total_regular_hours')::DECIMAL, 0) as total_regular_hours,
    COALESCE((ut.metadata->>'total_overtime_hours')::DECIMAL, 0) as total_overtime_hours,
    COALESCE((ut.metadata->>'total_break_hours')::DECIMAL, 0) as total_break_hours,
    COALESCE((ut.metadata->>'total_net_hours')::DECIMAL, 0) as total_net_hours,
    COALESCE((ut.metadata->>'total_billable_hours')::DECIMAL, 0) as total_billable_hours
    
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'WORK_TIMESHEET_POST'
),
timesheet_lines AS (
  -- Detailed timesheet line items
  SELECT 
    utl.transaction_id,
    utl.id as line_id,
    utl.line_number,
    utl.line_type,
    utl.line_amount as line_cost,
    utl.smart_code as line_smart_code,
    
    -- Work details
    DATE(utl.metadata->>'work_date') as work_date,
    EXTRACT(DOW FROM DATE(utl.metadata->>'work_date')) as day_of_week,
    utl.metadata->>'shift_code' as shift_code,
    utl.metadata->>'location_code' as location_code,
    utl.metadata->>'project_code' as project_code,
    utl.metadata->>'task_code' as task_code,
    utl.metadata->>'activity_description' as activity_description,
    
    -- Time breakdown
    COALESCE((utl.metadata->>'start_time')::TIME, '09:00'::TIME) as start_time,
    COALESCE((utl.metadata->>'end_time')::TIME, '17:00'::TIME) as end_time,
    COALESCE((utl.metadata->>'break_start')::TIME, '12:00'::TIME) as break_start,
    COALESCE((utl.metadata->>'break_end')::TIME, '13:00'::TIME) as break_end,
    COALESCE((utl.metadata->>'regular_hours')::DECIMAL, 0) as regular_hours,
    COALESCE((utl.metadata->>'overtime_hours')::DECIMAL, 0) as overtime_hours,
    COALESCE((utl.metadata->>'break_hours')::DECIMAL, 0) as break_hours,
    COALESCE((utl.metadata->>'net_hours')::DECIMAL, 0) as net_hours,
    COALESCE((utl.metadata->>'billable_hours')::DECIMAL, 0) as billable_hours,
    
    -- Rate and cost details
    COALESCE((utl.metadata->>'hourly_rate')::DECIMAL, 15.00) as hourly_rate,
    COALESCE((utl.metadata->>'overtime_rate')::DECIMAL, 22.50) as overtime_rate,
    COALESCE((utl.metadata->>'regular_cost')::DECIMAL, 0) as regular_cost,
    COALESCE((utl.metadata->>'overtime_cost')::DECIMAL, 0) as overtime_cost,
    COALESCE((utl.metadata->>'total_gross_cost')::DECIMAL, 0) as total_gross_cost,
    COALESCE((utl.metadata->>'employer_taxes')::DECIMAL, 0) as employer_taxes,
    COALESCE((utl.metadata->>'benefits_cost')::DECIMAL, 0) as benefits_cost,
    COALESCE((utl.metadata->>'total_employer_cost')::DECIMAL, 0) as total_employer_cost,
    
    -- Performance and quality metrics
    COALESCE((utl.metadata->>'productivity_score')::DECIMAL, 100) as productivity_score,
    COALESCE((utl.metadata->>'quality_score')::DECIMAL, 100) as quality_score,
    COALESCE((utl.metadata->>'customer_rating')::DECIMAL, 5) as customer_rating,
    utl.metadata->>'performance_notes' as performance_notes,
    
    -- Compliance flags
    COALESCE((utl.metadata->>'requires_approval')::BOOLEAN, false) as requires_approval,
    COALESCE((utl.metadata->>'auto_approved')::BOOLEAN, false) as auto_approved,
    COALESCE((utl.metadata->>'overtime_approved')::BOOLEAN, true) as overtime_approved,
    COALESCE((utl.metadata->>'holiday_time')::BOOLEAN, false) as holiday_time,
    COALESCE((utl.metadata->>'weekend_time')::BOOLEAN, false) as weekend_time,
    COALESCE((utl.metadata->>'night_shift')::BOOLEAN, false) as night_shift,
    
    -- Scheduling context
    utl.metadata->>'scheduled_shift_id' as scheduled_shift_id,
    COALESCE((utl.metadata->>'scheduled_hours')::DECIMAL, 0) as scheduled_hours,
    COALESCE((utl.metadata->>'schedule_variance_hours')::DECIMAL, 0) as schedule_variance_hours,
    utl.metadata->>'variance_reason' as variance_reason,
    
    -- GL and payroll integration
    utl.metadata->>'gl_account_code' as gl_account_code,
    utl.metadata->>'gl_cost_center' as gl_cost_center,
    utl.metadata->>'payroll_code' as payroll_code,
    COALESCE((utl.metadata->>'payroll_processed')::BOOLEAN, false) as payroll_processed,
    TIMESTAMP(utl.metadata->>'payroll_processed_at') as payroll_processed_at
    
  FROM universal_transaction_lines utl
  WHERE utl.line_type IN ('TIME_ENTRY', 'OVERTIME_ENTRY', 'BREAK_ADJUSTMENT', 'TIME_CORRECTION')
),
employee_context AS (
  -- Employee master data for context
  SELECT 
    e.id as employee_id,
    e.entity_name as employee_name,
    e.entity_code as employee_code,
    COALESCE(hourly_rate.field_value_number, 15.00) as base_hourly_rate,
    COALESCE(contract_type.field_value_text, 'FULL_TIME') as contract_type,
    COALESCE(fte_pct.field_value_number, 100) as fte_percentage,
    COALESCE(cost_center.field_value_text, 'OPERATIONS') as employee_cost_center,
    COALESCE(department.field_value_text, 'GENERAL') as employee_department,
    COALESCE(job_title.field_value_text, 'Staff Member') as job_title,
    COALESCE(supervisor.field_value_text, '') as supervisor_name,
    COALESCE(max_hours_week.field_value_number, 40) as max_hours_per_week
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
  LEFT JOIN core_dynamic_data job_title ON 
    job_title.entity_id = e.id AND job_title.field_name = 'job_title'
  LEFT JOIN core_dynamic_data supervisor ON 
    supervisor.entity_id = e.id AND supervisor.field_name = 'supervisor'
  LEFT JOIN core_dynamic_data max_hours_week ON 
    max_hours_week.entity_id = e.id AND max_hours_week.field_name = 'max_hours_week'
  WHERE e.entity_type = 'EMPLOYEE'
),
timesheet_aggregates AS (
  -- Aggregate timesheet data by transaction
  SELECT 
    tl.transaction_id,
    COUNT(*) as total_line_items,
    COUNT(DISTINCT tl.work_date) as total_work_days,
    MIN(tl.work_date) as first_work_date,
    MAX(tl.work_date) as last_work_date,
    
    -- Time aggregates
    SUM(tl.regular_hours) as agg_regular_hours,
    SUM(tl.overtime_hours) as agg_overtime_hours,
    SUM(tl.break_hours) as agg_break_hours,
    SUM(tl.net_hours) as agg_net_hours,
    SUM(tl.billable_hours) as agg_billable_hours,
    
    -- Cost aggregates
    SUM(tl.regular_cost) as agg_regular_cost,
    SUM(tl.overtime_cost) as agg_overtime_cost,
    SUM(tl.total_gross_cost) as agg_gross_cost,
    SUM(tl.employer_taxes) as agg_employer_taxes,
    SUM(tl.benefits_cost) as agg_benefits_cost,
    SUM(tl.total_employer_cost) as agg_employer_cost,
    
    -- Performance aggregates
    AVG(tl.productivity_score) as avg_productivity_score,
    AVG(tl.quality_score) as avg_quality_score,
    AVG(tl.customer_rating) as avg_customer_rating,
    
    -- Variance aggregates
    SUM(tl.schedule_variance_hours) as total_schedule_variance,
    AVG(ABS(tl.schedule_variance_hours)) as avg_absolute_variance,
    
    -- Compliance counts
    COUNT(CASE WHEN tl.requires_approval THEN 1 END) as entries_requiring_approval,
    COUNT(CASE WHEN tl.overtime_hours > 0 THEN 1 END) as overtime_entries,
    COUNT(CASE WHEN tl.holiday_time THEN 1 END) as holiday_entries,
    COUNT(CASE WHEN tl.weekend_time THEN 1 END) as weekend_entries,
    COUNT(CASE WHEN tl.night_shift THEN 1 END) as night_shift_entries,
    COUNT(CASE WHEN tl.payroll_processed THEN 1 END) as payroll_processed_entries,
    
    -- Project/task distribution
    COUNT(DISTINCT tl.project_code) as unique_projects,
    COUNT(DISTINCT tl.task_code) as unique_tasks,
    COUNT(DISTINCT tl.location_code) as unique_locations
    
  FROM timesheet_lines tl
  GROUP BY tl.transaction_id
),
approval_workflow_status AS (
  -- Determine approval workflow status
  SELECT 
    tt.timesheet_transaction_id,
    CASE 
      WHEN tt.timesheet_status = 'COMPLETED' AND tt.approved_at IS NOT NULL THEN 'APPROVED'
      WHEN tt.timesheet_status = 'COMPLIANCE_REVIEW' THEN 'UNDER_REVIEW'
      WHEN tt.timesheet_status = 'DRAFT' AND tt.submitted_at IS NULL THEN 'DRAFT'
      WHEN tt.timesheet_status = 'SUBMITTED' AND tt.approved_at IS NULL THEN 'PENDING_APPROVAL'
      WHEN tt.timesheet_status = 'REJECTED' THEN 'REJECTED'
      ELSE 'UNKNOWN'
    END as workflow_status,
    
    -- Calculate approval timing
    CASE 
      WHEN tt.submitted_at IS NOT NULL AND tt.approved_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (tt.approved_at - tt.submitted_at)) / 3600.0
      ELSE NULL
    END as approval_time_hours,
    
    -- Days since submission
    CASE 
      WHEN tt.submitted_at IS NOT NULL
      THEN EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - tt.submitted_at))
      ELSE NULL
    END as days_since_submission
    
  FROM timesheet_transactions tt
)
SELECT 
  -- Transaction identifiers
  tt.organization_id,
  tt.timesheet_transaction_id,
  tt.timesheet_number,
  tt.transaction_date,
  tt.timesheet_status,
  tt.timesheet_created,
  tt.timesheet_posted,
  
  -- Employee information
  tt.employee_id,
  COALESCE(tt.employee_name, ec.employee_name) as employee_name,
  COALESCE(tt.employee_code, ec.employee_code) as employee_code,
  ec.job_title,
  ec.contract_type,
  ec.base_hourly_rate,
  ec.fte_percentage,
  
  -- Cost center and department
  COALESCE(tt.cost_center, ec.employee_cost_center) as cost_center,
  COALESCE(tt.department, ec.employee_department) as department,
  tt.supervisor_id,
  ec.supervisor_name,
  
  -- Pay period information
  tt.pay_period_start,
  tt.pay_period_end,
  tt.pay_period_type,
  DATE_PART('days', tt.pay_period_end - tt.pay_period_start) + 1 as pay_period_days,
  
  -- Time summary
  ta.total_line_items,
  ta.total_work_days,
  ta.first_work_date,
  ta.last_work_date,
  ta.agg_regular_hours as total_regular_hours,
  ta.agg_overtime_hours as total_overtime_hours,
  ta.agg_break_hours as total_break_hours,
  ta.agg_net_hours as total_net_hours,
  ta.agg_billable_hours as total_billable_hours,
  
  -- Cost summary
  tt.total_cost,
  tt.currency,
  ta.agg_regular_cost as total_regular_cost,
  ta.agg_overtime_cost as total_overtime_cost,
  ta.agg_gross_cost as total_gross_cost,
  ta.agg_employer_taxes as total_employer_taxes,
  ta.agg_benefits_cost as total_benefits_cost,
  ta.agg_employer_cost as total_employer_cost,
  
  -- Performance metrics
  ta.avg_productivity_score,
  ta.avg_quality_score,
  ta.avg_customer_rating,
  
  -- Schedule variance
  ta.total_schedule_variance,
  ta.avg_absolute_variance,
  CASE 
    WHEN ta.agg_net_hours > 0 
    THEN ROUND((ABS(ta.total_schedule_variance) / ta.agg_net_hours) * 100, 2)
    ELSE 0 
  END as schedule_variance_percentage,
  
  -- Compliance and approval details
  ta.entries_requiring_approval,
  ta.overtime_entries,
  ta.holiday_entries,
  ta.weekend_entries,
  ta.night_shift_entries,
  ta.payroll_processed_entries,
  tt.compliance_passed,
  tt.compliance_issues,
  
  -- Approval workflow
  aws.workflow_status,
  tt.submitted_by,
  tt.submitted_at,
  tt.approved_by,
  tt.approved_at,
  tt.approval_notes,
  aws.approval_time_hours,
  aws.days_since_submission,
  
  -- Project and task diversity
  ta.unique_projects,
  ta.unique_tasks,
  ta.unique_locations,
  
  -- Calculated metrics
  CASE 
    WHEN ta.total_work_days > 0 
    THEN ROUND(ta.agg_net_hours / ta.total_work_days, 2)
    ELSE 0 
  END as avg_hours_per_day,
  
  CASE 
    WHEN ta.agg_net_hours > 0 
    THEN ROUND(ta.agg_overtime_hours / ta.agg_net_hours * 100, 2)
    ELSE 0 
  END as overtime_percentage,
  
  CASE 
    WHEN ta.agg_net_hours > 0 
    THEN ROUND(ta.agg_billable_hours / ta.agg_net_hours * 100, 2)
    ELSE 0 
  END as billability_percentage,
  
  CASE 
    WHEN ta.agg_net_hours > 0 
    THEN ROUND(ta.agg_employer_cost / ta.agg_net_hours, 2)
    ELSE 0 
  END as cost_per_hour,
  
  -- Utilization against contract
  CASE 
    WHEN ec.max_hours_per_week > 0 AND DATE_PART('days', tt.pay_period_end - tt.pay_period_start) >= 6
    THEN ROUND((ta.agg_net_hours / (ec.max_hours_per_week * (DATE_PART('days', tt.pay_period_end - tt.pay_period_start) + 1) / 7)) * 100, 2)
    ELSE 0 
  END as contract_utilization_percentage,
  
  -- Risk indicators
  CASE 
    WHEN aws.workflow_status = 'PENDING_APPROVAL' AND aws.days_since_submission > 3 THEN 'APPROVAL_DELAYED'
    WHEN ta.agg_overtime_hours > ec.max_hours_per_week * 0.25 THEN 'EXCESSIVE_OVERTIME'
    WHEN ta.avg_absolute_variance > 2 THEN 'SCHEDULE_VARIANCE_HIGH'
    WHEN ta.avg_productivity_score < 70 THEN 'PERFORMANCE_CONCERN'
    WHEN NOT tt.compliance_passed THEN 'COMPLIANCE_ISSUE'
    ELSE 'NORMAL'
  END as risk_indicator,
  
  -- Quality scoring
  LEAST(100, ROUND(
    (ta.avg_productivity_score * 0.4) +
    (ta.avg_quality_score * 0.3) +
    ((100 - LEAST(100, ABS(ta.total_schedule_variance) * 10)) * 0.2) +
    (CASE WHEN tt.compliance_passed THEN 100 ELSE 0 END * 0.1)
  )) as timesheet_quality_score,
  
  -- Processing metadata
  tt.auto_calculated,
  tt.calculation_method,
  
  -- Audit information
  CURRENT_TIMESTAMP as view_generated_at,
  'HERA.WORK.TIMESHEET.MANAGEMENT.V3' as smart_code

FROM timesheet_transactions tt
LEFT JOIN employee_context ec ON ec.employee_id = tt.employee_id
LEFT JOIN timesheet_aggregates ta ON ta.transaction_id = tt.timesheet_transaction_id
LEFT JOIN approval_workflow_status aws ON aws.timesheet_transaction_id = tt.timesheet_transaction_id

ORDER BY 
  tt.organization_id,
  tt.pay_period_end DESC,
  tt.employee_name,
  tt.timesheet_created DESC;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary timesheet management index
CREATE INDEX idx_vw_work_timesheet_v3_primary 
ON vw_work_timesheet_v3 (organization_id, pay_period_end DESC, employee_id);

-- Approval workflow index
CREATE INDEX idx_vw_work_timesheet_v3_workflow 
ON vw_work_timesheet_v3 (organization_id, workflow_status, days_since_submission DESC);

-- Cost and performance index
CREATE INDEX idx_vw_work_timesheet_v3_cost_performance 
ON vw_work_timesheet_v3 (organization_id, total_employer_cost DESC, timesheet_quality_score DESC);

-- Compliance and risk index
CREATE INDEX idx_vw_work_timesheet_v3_compliance 
ON vw_work_timesheet_v3 (organization_id, compliance_passed, risk_indicator, pay_period_end DESC);

-- Employee performance tracking index
CREATE INDEX idx_vw_work_timesheet_v3_employee_perf 
ON vw_work_timesheet_v3 (organization_id, employee_id, pay_period_end DESC, avg_productivity_score DESC);

-- Payroll processing index
CREATE INDEX idx_vw_work_timesheet_v3_payroll 
ON vw_work_timesheet_v3 (organization_id, pay_period_end, payroll_processed_entries, total_employer_cost);

-- Time period analysis index
CREATE INDEX idx_vw_work_timesheet_v3_time_analysis 
ON vw_work_timesheet_v3 (organization_id, pay_period_start, pay_period_end, total_net_hours DESC);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_work_timesheet_v3 TO authenticated;
GRANT SELECT ON vw_work_timesheet_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_work_timesheet_v3 IS 'HERA Finance DNA V3.6: Comprehensive workforce timesheet management view providing time tracking, approval workflows, compliance monitoring, performance analytics, variance analysis, and payroll integration for complete workforce time management.';