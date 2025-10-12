-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Optimization Analysis View
-- 
-- Comprehensive view for workforce optimization monitoring including schedule
-- efficiency, cost analysis, utilization tracking, and optimization impact.
-- 
-- Smart Code: HERA.WORK.OPT.VIEW.ANALYSIS.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_workforce_optimization_V3 CASCADE;

-- Create workforce optimization analysis view
CREATE VIEW vw_workforce_optimization_V3 AS
WITH workforce_metrics AS (
  -- Get current workforce performance metrics
  SELECT 
    e.organization_id,
    e.id as employee_id,
    e.entity_name as employee_name,
    e.entity_code as employee_code,
    COALESCE(hourly_rate.field_value_number, 15.00) as hourly_rate,
    COALESCE(contract_type.field_value_text, 'FULL_TIME') as contract_type,
    COALESCE(fte_pct.field_value_number, 100) as fte_pct,
    COALESCE(cost_center.field_value_text, 'OPERATIONS') as cost_center,
    
    -- Calculate recent performance metrics (last 30 days)
    COALESCE(
      (SELECT AVG((utl.metadata->>'net_hours')::DECIMAL)
       FROM universal_transactions ut
       JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
       WHERE ut.organization_id = e.organization_id
       AND ut.transaction_type = 'WORK_TIMESHEET_POST'
       AND (utl.metadata->>'employee_id')::UUID = e.id
       AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
       AND utl.line_type = 'TIME_ENTRY'
      ), 0
    ) as avg_hours_per_week,
    
    COALESCE(
      (SELECT AVG(COALESCE((utl.metadata->>'overtime_hours')::DECIMAL, 0))
       FROM universal_transactions ut
       JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
       WHERE ut.organization_id = e.organization_id
       AND ut.transaction_type = 'WORK_TIMESHEET_POST'
       AND (utl.metadata->>'employee_id')::UUID = e.id
       AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
       AND utl.line_type = 'TIME_ENTRY'
      ), 0
    ) as avg_overtime_hours,
    
    COALESCE(
      (SELECT SUM(ut.total_amount)
       FROM universal_transactions ut
       WHERE ut.organization_id = e.organization_id
       AND ut.transaction_type = 'WORK_TIMESHEET_POST'
       AND ut.metadata->>'employee_id' = e.id::TEXT
       AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
       AND ut.status IN ('COMPLETED', 'COMPLIANCE_REVIEW')
      ), 0
    ) as total_labor_cost_30d,
    
    -- Skill count
    COALESCE(
      (SELECT COUNT(*)
       FROM core_relationships r
       JOIN core_entities skill_e ON skill_e.id = r.to_entity_id
       WHERE r.from_entity_id = e.id
       AND r.relationship_type = 'EMPLOYEE_HAS_SKILL'
       AND skill_e.entity_type = 'SKILL'
      ), 0
    ) as skill_count,
    
    -- Calculate utilization rate
    CASE 
      WHEN COALESCE(fte_pct.field_value_number, 100) > 0 
      THEN ROUND(
        (COALESCE(
          (SELECT AVG((utl.metadata->>'net_hours')::DECIMAL)
           FROM universal_transactions ut
           JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
           WHERE ut.organization_id = e.organization_id
           AND ut.transaction_type = 'WORK_TIMESHEET_POST'
           AND (utl.metadata->>'employee_id')::UUID = e.id
           AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
           AND utl.line_type = 'TIME_ENTRY'
          ), 0
        ) / ((fte_pct.field_value_number / 100) * 40)) * 100, 2
      )
      ELSE 0 
    END as utilization_rate_pct
    
  FROM core_entities e
  LEFT JOIN core_dynamic_data hourly_rate ON 
    hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
  LEFT JOIN core_dynamic_data contract_type ON 
    contract_type.entity_id = e.id AND contract_type.field_name = 'contract_type'
  LEFT JOIN core_dynamic_data fte_pct ON 
    fte_pct.entity_id = e.id AND fte_pct.field_name = 'fte_pct'
  LEFT JOIN core_dynamic_data cost_center ON 
    cost_center.entity_id = e.id AND cost_center.field_name = 'cost_center'
  WHERE e.entity_type = 'EMPLOYEE'
  AND e.status = 'ACTIVE'
),
optimization_suggestions AS (
  -- Get latest optimization suggestions
  SELECT 
    ut.organization_id,
    ut.id as optimization_run_id,
    ut.created_at as analysis_date,
    ut.total_amount as potential_annual_savings,
    ut.metadata->'optimization_results'->>'employees_analyzed' as employees_analyzed,
    ut.metadata->'optimization_results'->>'total_suggestions' as total_suggestions,
    utl.metadata->'optimization_categories' as suggestion_categories,
    utl.metadata->'all_suggestions' as detailed_suggestions
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_OPT_SUGGEST'
  AND ut.status = 'COMPLETED'
  AND utl.line_type = 'OPTIMIZATION_SUGGESTIONS'
),
optimization_applications AS (
  -- Get optimization applications and their results
  SELECT 
    ut.organization_id,
    ut.id as application_run_id,
    ut.created_at as application_date,
    ut.metadata->>'optimization_run_id' as optimization_run_id,
    ut.total_amount as expected_savings,
    ut.metadata->'application_results'->>'suggestions_applied' as suggestions_applied,
    ut.metadata->'application_results'->>'suggestions_failed' as suggestions_failed,
    ut.metadata->'application_results'->>'implementation_date' as implementation_date,
    ut.status as application_status,
    ut.metadata->'validation_summary'->'approval_status' as approval_status
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'WORK_OPT_APPLY'
),
schedule_efficiency AS (
  -- Calculate schedule efficiency metrics
  SELECT 
    ut.organization_id,
    DATE_TRUNC('week', ut.created_at) as week_start,
    COUNT(DISTINCT utl.metadata->>'employee_id') as unique_employees_scheduled,
    SUM((utl.metadata->>'shift_hours')::DECIMAL) as total_scheduled_hours,
    SUM((utl.metadata->>'total_cost')::DECIMAL) as total_scheduled_cost,
    AVG((utl.metadata->>'hourly_rate')::DECIMAL) as avg_hourly_rate,
    COUNT(*) as total_shifts_assigned
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_SCHEDULE_RUN'
  AND ut.status = 'COMPLETED'
  AND utl.line_type = 'SHIFT_ASSIGNMENT'
  AND ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY ut.organization_id, DATE_TRUNC('week', ut.created_at)
),
payroll_accruals AS (
  -- Get payroll accrual summaries
  SELECT 
    ut.organization_id,
    DATE_TRUNC('month', ut.created_at) as accrual_month,
    ut.total_amount as total_accrued_amount,
    ut.metadata->'accrual_summary'->>'employees_processed' as employees_processed,
    ut.metadata->'accrual_summary'->>'total_labor_cost' as total_labor_cost,
    ut.metadata->'accrual_summary'->>'total_employer_contributions' as total_employer_contributions,
    ut.metadata->'accrual_summary'->>'gl_entries_created' as gl_entries_created
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'WORK_PAYROLL_ACCRUE'
  AND ut.status = 'COMPLETED'
  AND ut.created_at >= CURRENT_DATE - INTERVAL '12 months'
),
workforce_summary AS (
  -- Create organization-level workforce summaries
  SELECT 
    wm.organization_id,
    COUNT(*) as total_employees,
    AVG(wm.hourly_rate) as avg_hourly_rate,
    AVG(wm.avg_hours_per_week) as avg_hours_per_employee,
    AVG(wm.avg_overtime_hours) as avg_overtime_per_employee,
    AVG(wm.utilization_rate_pct) as avg_utilization_rate,
    SUM(wm.total_labor_cost_30d) as total_labor_cost_30d,
    AVG(wm.skill_count) as avg_skills_per_employee,
    
    -- Performance categories
    COUNT(CASE WHEN wm.utilization_rate_pct >= 85 THEN 1 END) as high_utilization_employees,
    COUNT(CASE WHEN wm.utilization_rate_pct < 70 THEN 1 END) as low_utilization_employees,
    COUNT(CASE WHEN wm.avg_overtime_hours > 5 THEN 1 END) as high_overtime_employees,
    COUNT(CASE WHEN wm.skill_count < 3 THEN 1 END) as low_skill_employees
    
  FROM workforce_metrics wm
  GROUP BY wm.organization_id
),
latest_optimization_data AS (
  -- Get the most recent optimization data per organization
  SELECT DISTINCT ON (os.organization_id)
    os.organization_id,
    os.optimization_run_id,
    os.analysis_date,
    os.potential_annual_savings,
    os.employees_analyzed,
    os.total_suggestions,
    os.suggestion_categories,
    
    -- Latest application data
    oa.application_run_id,
    oa.application_date,
    oa.expected_savings as applied_expected_savings,
    oa.suggestions_applied,
    oa.suggestions_failed,
    oa.application_status,
    oa.approval_status
    
  FROM optimization_suggestions os
  LEFT JOIN optimization_applications oa ON 
    oa.optimization_run_id = os.optimization_run_id::TEXT
  ORDER BY os.organization_id, os.analysis_date DESC
)
SELECT 
  -- Organization and summary info
  ws.organization_id,
  ws.total_employees,
  ws.avg_hourly_rate,
  ws.avg_hours_per_employee,
  ws.avg_overtime_per_employee,
  ws.avg_utilization_rate,
  ws.total_labor_cost_30d,
  ws.avg_skills_per_employee,
  
  -- Performance distribution
  ws.high_utilization_employees,
  ws.low_utilization_employees,
  ws.high_overtime_employees,
  ws.low_skill_employees,
  
  -- Optimization opportunity indicators
  ROUND((ws.low_utilization_employees::DECIMAL / ws.total_employees) * 100, 1) as underutilization_rate_pct,
  ROUND((ws.high_overtime_employees::DECIMAL / ws.total_employees) * 100, 1) as overtime_risk_rate_pct,
  ROUND((ws.low_skill_employees::DECIMAL / ws.total_employees) * 100, 1) as skill_gap_rate_pct,
  
  -- Latest optimization analysis
  lod.optimization_run_id,
  lod.analysis_date as latest_analysis_date,
  lod.potential_annual_savings,
  lod.employees_analyzed,
  lod.total_suggestions,
  lod.suggestion_categories,
  
  -- Application status
  lod.application_run_id,
  lod.application_date,
  lod.applied_expected_savings,
  lod.suggestions_applied,
  lod.suggestions_failed,
  lod.application_status,
  lod.approval_status,
  
  -- Schedule efficiency (latest week)
  se_latest.unique_employees_scheduled as latest_week_employees,
  se_latest.total_scheduled_hours as latest_week_hours,
  se_latest.total_scheduled_cost as latest_week_cost,
  se_latest.avg_hourly_rate as latest_week_avg_rate,
  CASE 
    WHEN se_latest.total_scheduled_hours > 0 
    THEN ROUND(se_latest.total_scheduled_cost / se_latest.total_scheduled_hours, 2)
    ELSE 0 
  END as cost_per_hour_latest_week,
  
  -- Payroll trends (latest month)
  pa_latest.total_accrued_amount as latest_month_payroll,
  pa_latest.employees_processed as latest_month_employees_paid,
  pa_latest.total_labor_cost as latest_month_labor_cost,
  pa_latest.total_employer_contributions as latest_month_employer_contributions,
  
  -- Efficiency ratios and scores
  CASE 
    WHEN ws.total_employees > 0 
    THEN ROUND(ws.total_labor_cost_30d / ws.total_employees, 2)
    ELSE 0 
  END as cost_per_employee_30d,
  
  LEAST(100, ROUND(
    (ws.avg_utilization_rate * 0.4) +
    ((100 - COALESCE((ws.high_overtime_employees::DECIMAL / ws.total_employees) * 100, 0)) * 0.3) +
    (LEAST(100, ws.avg_skills_per_employee * 20) * 0.3)
  )) as workforce_efficiency_score,
  
  -- Optimization potential
  CASE 
    WHEN lod.potential_annual_savings > 0 AND ws.total_labor_cost_30d > 0 
    THEN ROUND((lod.potential_annual_savings / (ws.total_labor_cost_30d * 12)) * 100, 2)
    ELSE 0 
  END as optimization_potential_pct,
  
  -- Trend indicators (simplified)
  CASE 
    WHEN ws.avg_utilization_rate >= 80 AND ws.high_overtime_employees <= (ws.total_employees * 0.15) THEN 'OPTIMIZED'
    WHEN ws.low_utilization_employees > (ws.total_employees * 0.25) THEN 'UNDERUTILIZED'
    WHEN ws.high_overtime_employees > (ws.total_employees * 0.25) THEN 'OVERWORKED'
    ELSE 'NEEDS_OPTIMIZATION'
  END as workforce_status,
  
  -- Derived time information
  EXTRACT(YEAR FROM CURRENT_DATE) as analysis_year,
  EXTRACT(MONTH FROM CURRENT_DATE) as analysis_month,
  DATE_TRUNC('quarter', CURRENT_DATE) as analysis_quarter,
  
  -- Audit information
  CURRENT_TIMESTAMP as view_generated_at,
  'HERA.WORK.OPT.VIEW.ANALYSIS.V3' as smart_code

FROM workforce_summary ws
LEFT JOIN latest_optimization_data lod ON lod.organization_id = ws.organization_id
LEFT JOIN LATERAL (
  SELECT * FROM schedule_efficiency se 
  WHERE se.organization_id = ws.organization_id 
  ORDER BY se.week_start DESC 
  LIMIT 1
) se_latest ON true
LEFT JOIN LATERAL (
  SELECT * FROM payroll_accruals pa 
  WHERE pa.organization_id = ws.organization_id 
  ORDER BY pa.accrual_month DESC 
  LIMIT 1
) pa_latest ON true

ORDER BY 
  ws.organization_id,
  workforce_efficiency_score DESC;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary index for organization queries
CREATE INDEX idx_workforce_optimization_V3_primary 
ON vw_workforce_optimization_V3 (organization_id, latest_analysis_date DESC);

-- Efficiency and status index
CREATE INDEX idx_workforce_optimization_V3_efficiency 
ON vw_workforce_optimization_V3 (organization_id, workforce_efficiency_score DESC, workforce_status);

-- Optimization potential index
CREATE INDEX idx_workforce_optimization_V3_potential 
ON vw_workforce_optimization_V3 (organization_id, optimization_potential_pct DESC, potential_annual_savings DESC);

-- Application status tracking index
CREATE INDEX idx_workforce_optimization_V3_applications 
ON vw_workforce_optimization_V3 (organization_id, application_status, application_date DESC);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_workforce_optimization_V3 TO authenticated;
GRANT SELECT ON vw_workforce_optimization_V3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_workforce_optimization_V3 IS 'HERA Finance DNA V3.6: Comprehensive workforce optimization analysis view that provides workforce performance metrics, optimization opportunities, efficiency scoring, and application tracking for AI-powered workforce management and cost optimization.';