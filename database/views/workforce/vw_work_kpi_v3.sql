-- ============================================================================
-- HERA Finance DNA V3.6: Workforce KPI Dashboard View
-- 
-- Comprehensive workforce KPI view providing executive dashboards, performance
-- trending, optimization metrics, and AI-powered insights for workforce management.
-- 
-- Smart Code: HERA.WORK.KPI.DASHBOARD.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_work_kpi_v3 CASCADE;

-- Create workforce KPI dashboard view
CREATE VIEW vw_work_kpi_v3 AS
WITH time_dimensions AS (
  -- Create time dimension framework
  SELECT 
    CURRENT_DATE as current_date,
    DATE_TRUNC('week', CURRENT_DATE) as current_week,
    DATE_TRUNC('month', CURRENT_DATE) as current_month,
    DATE_TRUNC('quarter', CURRENT_DATE) as current_quarter,
    DATE_TRUNC('year', CURRENT_DATE) as current_year,
    
    -- Previous periods for comparison
    DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week' as previous_week,
    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' as previous_month,
    DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months' as previous_quarter,
    DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year' as previous_year,
    
    -- Period boundaries
    CURRENT_DATE - INTERVAL '7 days' as last_7_days,
    CURRENT_DATE - INTERVAL '30 days' as last_30_days,
    CURRENT_DATE - INTERVAL '90 days' as last_90_days,
    CURRENT_DATE - INTERVAL '365 days' as last_365_days
),
workforce_base AS (
  -- Core workforce metrics by organization
  SELECT 
    e.organization_id,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) as active_employees,
    COUNT(CASE WHEN COALESCE(contract.field_value_text, 'FULL_TIME') = 'FULL_TIME' THEN 1 END) as full_time_employees,
    COUNT(CASE WHEN COALESCE(contract.field_value_text, 'FULL_TIME') = 'PART_TIME' THEN 1 END) as part_time_employees,
    COUNT(CASE WHEN COALESCE(contract.field_value_text, 'FULL_TIME') = 'CONTRACTOR' THEN 1 END) as contractor_employees,
    
    -- Cost metrics
    AVG(COALESCE(hourly_rate.field_value_number, 15.00)) as avg_hourly_rate,
    SUM(COALESCE(hourly_rate.field_value_number, 15.00) * COALESCE(fte.field_value_number, 100) / 100 * 40) as weekly_payroll_capacity,
    
    -- Experience and skills
    AVG(COALESCE(seniority.field_value_number, 0)) as avg_seniority_years,
    AVG(COALESCE(performance.field_value_number, 3.0)) as avg_performance_rating,
    
    -- Department distribution
    COUNT(DISTINCT COALESCE(dept.field_value_text, 'GENERAL')) as unique_departments,
    COUNT(DISTINCT COALESCE(location.field_value_text, 'MAIN')) as unique_locations
    
  FROM core_entities e
  LEFT JOIN core_dynamic_data hourly_rate ON 
    hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
  LEFT JOIN core_dynamic_data contract ON 
    contract.entity_id = e.id AND contract.field_name = 'contract_type'
  LEFT JOIN core_dynamic_data fte ON 
    fte.entity_id = e.id AND fte.field_name = 'fte_pct'
  LEFT JOIN core_dynamic_data seniority ON 
    seniority.entity_id = e.id AND seniority.field_name = 'seniority'
  LEFT JOIN core_dynamic_data performance ON 
    performance.entity_id = e.id AND performance.field_name = 'performance_rating'
  LEFT JOIN core_dynamic_data dept ON 
    dept.entity_id = e.id AND dept.field_name = 'department'
  LEFT JOIN core_dynamic_data location ON 
    location.entity_id = e.id AND location.field_name = 'location'
  WHERE e.entity_type = 'EMPLOYEE'
  GROUP BY e.organization_id
),
productivity_metrics AS (
  -- Calculate productivity and performance metrics
  SELECT 
    ut.organization_id,
    
    -- Time period breakdowns
    COUNT(CASE WHEN ut.created_at >= td.last_7_days THEN 1 END) as timesheets_7d,
    COUNT(CASE WHEN ut.created_at >= td.last_30_days THEN 1 END) as timesheets_30d,
    COUNT(CASE WHEN ut.created_at >= td.last_90_days THEN 1 END) as timesheets_90d,
    
    -- Hours and productivity (last 30 days)
    SUM(CASE 
      WHEN ut.created_at >= td.last_30_days 
      THEN COALESCE((utl.metadata->>'net_hours')::DECIMAL, 0) 
      ELSE 0 
    END) as total_hours_30d,
    
    SUM(CASE 
      WHEN ut.created_at >= td.last_30_days 
      THEN COALESCE((utl.metadata->>'overtime_hours')::DECIMAL, 0) 
      ELSE 0 
    END) as total_overtime_30d,
    
    AVG(CASE 
      WHEN ut.created_at >= td.last_30_days 
      THEN COALESCE((utl.metadata->>'productivity_score')::DECIMAL, 100) 
      ELSE NULL 
    END) as avg_productivity_30d,
    
    AVG(CASE 
      WHEN ut.created_at >= td.last_30_days 
      THEN COALESCE((utl.metadata->>'quality_score')::DECIMAL, 100) 
      ELSE NULL 
    END) as avg_quality_30d,
    
    -- Cost metrics (last 30 days)
    SUM(CASE 
      WHEN ut.created_at >= td.last_30_days 
      THEN COALESCE((utl.metadata->>'total_employer_cost')::DECIMAL, 0) 
      ELSE 0 
    END) as total_labor_cost_30d,
    
    -- Previous period comparison (30-60 days ago)
    SUM(CASE 
      WHEN ut.created_at >= td.last_60_days AND ut.created_at < td.last_30_days
      THEN COALESCE((utl.metadata->>'net_hours')::DECIMAL, 0) 
      ELSE 0 
    END) as total_hours_prev_30d,
    
    SUM(CASE 
      WHEN ut.created_at >= td.last_60_days AND ut.created_at < td.last_30_days
      THEN COALESCE((utl.metadata->>'total_employer_cost')::DECIMAL, 0) 
      ELSE 0 
    END) as total_labor_cost_prev_30d,
    
    -- Schedule adherence
    AVG(CASE 
      WHEN ut.created_at >= td.last_30_days 
      AND COALESCE((utl.metadata->>'scheduled_hours')::DECIMAL, 0) > 0
      THEN (COALESCE((utl.metadata->>'net_hours')::DECIMAL, 0) / 
            COALESCE((utl.metadata->>'scheduled_hours')::DECIMAL, 1)) * 100
      ELSE NULL 
    END) as avg_schedule_adherence_30d,
    
    -- Unique employees tracked
    COUNT(DISTINCT ut.metadata->>'employee_id') as tracked_employees_30d
    
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  CROSS JOIN (
    SELECT 
      CURRENT_DATE - INTERVAL '30 days' as last_30_days,
      CURRENT_DATE - INTERVAL '60 days' as last_60_days,
      CURRENT_DATE - INTERVAL '7 days' as last_7_days,
      CURRENT_DATE - INTERVAL '90 days' as last_90_days
  ) td
  WHERE ut.transaction_type = 'WORK_TIMESHEET_POST'
  AND utl.line_type = 'TIME_ENTRY'
  AND ut.status IN ('COMPLETED', 'COMPLIANCE_REVIEW')
  GROUP BY ut.organization_id
),
scheduling_efficiency AS (
  -- Schedule optimization and efficiency metrics
  SELECT 
    ut.organization_id,
    
    -- Schedule run metrics (last 30 days)
    COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as schedule_runs_30d,
    
    -- Optimization results (last 30 days)
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'optimization_results'->>'cost_efficiency_score')::DECIMAL, 0)
      ELSE NULL 
    END) as avg_cost_efficiency_score,
    
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'optimization_results'->>'utilization_rate_pct')::DECIMAL, 0)
      ELSE NULL 
    END) as avg_utilization_rate,
    
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'optimization_results'->>'overtime_rate_pct')::DECIMAL, 0)
      ELSE NULL 
    END) as avg_overtime_rate,
    
    -- Schedule assignments (last 30 days)
    SUM(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'schedule_summary'->>'total_shifts_assigned')::INTEGER, 0)
      ELSE 0 
    END) as total_shifts_assigned_30d,
    
    SUM(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'schedule_summary'->>'employees_scheduled')::INTEGER, 0)
      ELSE 0 
    END) as total_employees_scheduled_30d,
    
    -- Guardrail compliance
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'guardrail_compliance'->>'compliance_rate_pct')::DECIMAL, 100)
      ELSE NULL 
    END) as avg_guardrail_compliance,
    
    SUM(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN COALESCE((ut.metadata->'guardrail_compliance'->>'violations_blocked')::INTEGER, 0)
      ELSE 0 
    END) as total_violations_blocked_30d
    
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'WORK_SCHEDULE_RUN'
  AND ut.status = 'COMPLETED'
  GROUP BY ut.organization_id
),
optimization_impact AS (
  -- Workforce optimization impact and savings
  SELECT 
    ut.organization_id,
    
    -- Optimization suggestions (last 90 days)
    COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as optimization_runs_90d,
    
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      THEN ut.total_amount
      ELSE NULL 
    END) as avg_potential_savings,
    
    SUM(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      THEN ut.total_amount
      ELSE 0 
    END) as total_potential_savings_90d,
    
    -- Application success (last 90 days)
    COUNT(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      AND oa.organization_id IS NOT NULL 
      THEN 1 
    END) as optimization_applications_90d,
    
    SUM(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      AND oa.organization_id IS NOT NULL
      THEN oa.total_amount
      ELSE 0 
    END) as total_applied_savings_90d,
    
    -- Success rate
    CASE 
      WHEN COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) > 0
      THEN ROUND((COUNT(CASE 
                    WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
                    AND oa.organization_id IS NOT NULL 
                    THEN 1 
                  END)::DECIMAL / 
                  COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END)) * 100, 1)
      ELSE 0
    END as optimization_success_rate
    
  FROM universal_transactions ut
  LEFT JOIN universal_transactions oa ON 
    oa.organization_id = ut.organization_id
    AND oa.transaction_type = 'WORK_OPT_APPLY'
    AND oa.metadata->>'optimization_run_id' = ut.id::TEXT
    AND oa.status = 'COMPLETED'
  WHERE ut.transaction_type = 'WORK_OPT_SUGGEST'
  AND ut.status = 'COMPLETED'
  GROUP BY ut.organization_id
),
payroll_processing AS (
  -- Payroll processing efficiency metrics
  SELECT 
    ut.organization_id,
    
    -- Payroll runs (last 90 days)
    COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as payroll_runs_90d,
    
    -- Processing efficiency
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      THEN COALESCE((ut.metadata->'accrual_summary'->>'employees_processed')::INTEGER, 0)
      ELSE NULL 
    END) as avg_employees_per_payroll,
    
    SUM(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      THEN ut.total_amount
      ELSE 0 
    END) as total_payroll_90d,
    
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      THEN COALESCE((ut.metadata->'accrual_summary'->>'processing_time_ms')::DECIMAL, 0) / 1000
      ELSE NULL 
    END) as avg_processing_time_seconds,
    
    -- GL integration success
    AVG(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '90 days'
      THEN COALESCE((ut.metadata->'accrual_summary'->>'gl_entries_created')::INTEGER, 0)
      ELSE NULL 
    END) as avg_gl_entries_per_payroll
    
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'WORK_PAYROLL_ACCRUE'
  AND ut.status = 'COMPLETED'
  GROUP BY ut.organization_id
),
compliance_tracking AS (
  -- Compliance and risk tracking
  SELECT 
    ut.organization_id,
    
    -- Compliance review timesheets (last 30 days)
    COUNT(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND ut.status = 'COMPLIANCE_REVIEW' 
      THEN 1 
    END) as compliance_review_timesheets_30d,
    
    COUNT(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND ut.status = 'COMPLETED'
      AND COALESCE((ut.metadata->>'compliance_passed')::BOOLEAN, true) = false
      THEN 1 
    END) as compliance_failed_timesheets_30d,
    
    -- Total timesheets for comparison
    COUNT(CASE 
      WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
      THEN 1 
    END) as total_timesheets_30d,
    
    -- Calculate compliance rate
    CASE 
      WHEN COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) > 0
      THEN ROUND((1 - (COUNT(CASE 
                        WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
                        AND (ut.status = 'COMPLIANCE_REVIEW' OR 
                             COALESCE((ut.metadata->>'compliance_passed')::BOOLEAN, true) = false)
                        THEN 1 
                      END)::DECIMAL / 
                      COUNT(CASE WHEN ut.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END))) * 100, 1)
      ELSE 100
    END as compliance_rate_pct
    
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'WORK_TIMESHEET_POST'
  GROUP BY ut.organization_id
)
SELECT 
  -- Organization identifier
  wb.organization_id,
  
  -- Current workforce composition
  wb.total_employees,
  wb.active_employees,
  wb.full_time_employees,
  wb.part_time_employees,
  wb.contractor_employees,
  ROUND((wb.active_employees::DECIMAL / NULLIF(wb.total_employees, 0)) * 100, 1) as active_employee_rate_pct,
  
  -- Cost metrics
  wb.avg_hourly_rate,
  wb.weekly_payroll_capacity,
  wb.avg_seniority_years,
  wb.avg_performance_rating,
  wb.unique_departments,
  wb.unique_locations,
  
  -- Productivity metrics (30 days)
  pm.timesheets_30d,
  pm.total_hours_30d,
  pm.total_overtime_30d,
  pm.tracked_employees_30d,
  ROUND(pm.avg_productivity_30d, 1) as avg_productivity_30d,
  ROUND(pm.avg_quality_30d, 1) as avg_quality_30d,
  pm.total_labor_cost_30d,
  
  -- Overtime analysis
  CASE 
    WHEN pm.total_hours_30d > 0 
    THEN ROUND((pm.total_overtime_30d / pm.total_hours_30d) * 100, 1)
    ELSE 0 
  END as overtime_rate_pct_30d,
  
  -- Cost efficiency
  CASE 
    WHEN pm.total_hours_30d > 0 
    THEN ROUND(pm.total_labor_cost_30d / pm.total_hours_30d, 2)
    ELSE 0 
  END as cost_per_hour_30d,
  
  -- Utilization metrics
  CASE 
    WHEN wb.active_employees > 0 
    THEN ROUND(pm.total_hours_30d / (wb.active_employees * 173.33), 2) -- 173.33 = avg hours per month
    ELSE 0 
  END as workforce_utilization_rate,
  
  ROUND(pm.avg_schedule_adherence_30d, 1) as avg_schedule_adherence_30d,
  
  -- Period-over-period comparison
  CASE 
    WHEN pm.total_hours_prev_30d > 0 
    THEN ROUND(((pm.total_hours_30d - pm.total_hours_prev_30d) / pm.total_hours_prev_30d) * 100, 1)
    ELSE 0 
  END as hours_change_pct_mom,
  
  CASE 
    WHEN pm.total_labor_cost_prev_30d > 0 
    THEN ROUND(((pm.total_labor_cost_30d - pm.total_labor_cost_prev_30d) / pm.total_labor_cost_prev_30d) * 100, 1)
    ELSE 0 
  END as cost_change_pct_mom,
  
  -- Scheduling efficiency
  se.schedule_runs_30d,
  ROUND(se.avg_cost_efficiency_score, 1) as avg_cost_efficiency_score,
  ROUND(se.avg_utilization_rate, 1) as avg_schedule_utilization_rate,
  ROUND(se.avg_overtime_rate, 1) as avg_scheduled_overtime_rate,
  se.total_shifts_assigned_30d,
  se.total_employees_scheduled_30d,
  ROUND(se.avg_guardrail_compliance, 1) as avg_guardrail_compliance,
  se.total_violations_blocked_30d,
  
  -- Optimization impact (90 days)
  oi.optimization_runs_90d,
  oi.avg_potential_savings,
  oi.total_potential_savings_90d,
  oi.optimization_applications_90d,
  oi.total_applied_savings_90d,
  oi.optimization_success_rate,
  
  -- ROI calculation
  CASE 
    WHEN pm.total_labor_cost_30d > 0 AND oi.total_applied_savings_90d > 0
    THEN ROUND((oi.total_applied_savings_90d / (pm.total_labor_cost_30d * 3)) * 100, 2)
    ELSE 0 
  END as optimization_roi_pct,
  
  -- Payroll processing efficiency
  pp.payroll_runs_90d,
  pp.avg_employees_per_payroll,
  pp.total_payroll_90d,
  ROUND(pp.avg_processing_time_seconds, 1) as avg_payroll_processing_seconds,
  pp.avg_gl_entries_per_payroll,
  
  -- Compliance metrics
  ct.compliance_review_timesheets_30d,
  ct.compliance_failed_timesheets_30d,
  ct.total_timesheets_30d,
  ct.compliance_rate_pct,
  
  -- Overall workforce health scoring
  LEAST(100, ROUND(
    (COALESCE(pm.avg_productivity_30d, 100) * 0.25) +
    (COALESCE(pm.avg_quality_30d, 100) * 0.20) +
    (COALESCE(se.avg_cost_efficiency_score, 100) * 0.20) +
    (COALESCE(ct.compliance_rate_pct, 100) * 0.15) +
    (COALESCE(pm.avg_schedule_adherence_30d, 100) * 0.10) +
    (LEAST(100, COALESCE(oi.optimization_success_rate, 0) + 50) * 0.10)
  )) as workforce_health_score,
  
  -- Status indicators
  CASE 
    WHEN ct.compliance_rate_pct < 90 THEN 'COMPLIANCE_RISK'
    WHEN pm.avg_productivity_30d < 75 THEN 'PRODUCTIVITY_CONCERN'
    WHEN se.avg_cost_efficiency_score < 70 THEN 'COST_EFFICIENCY_LOW'
    WHEN pm.total_overtime_30d / NULLIF(pm.total_hours_30d, 0) > 0.15 THEN 'OVERTIME_HIGH'
    ELSE 'HEALTHY'
  END as workforce_status,
  
  -- Trend indicators
  CASE 
    WHEN pm.total_hours_30d > pm.total_hours_prev_30d * 1.05 THEN 'HOURS_INCREASING'
    WHEN pm.total_hours_30d < pm.total_hours_prev_30d * 0.95 THEN 'HOURS_DECREASING'
    ELSE 'HOURS_STABLE'
  END as hours_trend,
  
  CASE 
    WHEN pm.total_labor_cost_30d > pm.total_labor_cost_prev_30d * 1.05 THEN 'COST_INCREASING'
    WHEN pm.total_labor_cost_30d < pm.total_labor_cost_prev_30d * 0.95 THEN 'COST_DECREASING'
    ELSE 'COST_STABLE'
  END as cost_trend,
  
  -- Time dimensions for reporting
  EXTRACT(YEAR FROM CURRENT_DATE) as report_year,
  EXTRACT(MONTH FROM CURRENT_DATE) as report_month,
  DATE_TRUNC('quarter', CURRENT_DATE) as report_quarter,
  
  -- Audit information
  CURRENT_TIMESTAMP as kpi_generated_at,
  'HERA.WORK.KPI.DASHBOARD.V3' as smart_code

FROM workforce_base wb
LEFT JOIN productivity_metrics pm ON pm.organization_id = wb.organization_id
LEFT JOIN scheduling_efficiency se ON se.organization_id = wb.organization_id
LEFT JOIN optimization_impact oi ON oi.organization_id = wb.organization_id
LEFT JOIN payroll_processing pp ON pp.organization_id = wb.organization_id
LEFT JOIN compliance_tracking ct ON ct.organization_id = wb.organization_id

ORDER BY 
  wb.organization_id,
  workforce_health_score DESC;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary KPI dashboard index
CREATE INDEX idx_vw_work_kpi_v3_primary 
ON vw_work_kpi_v3 (organization_id, report_year, report_month);

-- Workforce health monitoring index
CREATE INDEX idx_vw_work_kpi_v3_health 
ON vw_work_kpi_v3 (organization_id, workforce_health_score DESC, workforce_status);

-- Performance tracking index
CREATE INDEX idx_vw_work_kpi_v3_performance 
ON vw_work_kpi_v3 (organization_id, avg_productivity_30d DESC, avg_quality_30d DESC);

-- Cost analysis index
CREATE INDEX idx_vw_work_kpi_v3_cost 
ON vw_work_kpi_v3 (organization_id, cost_per_hour_30d, total_labor_cost_30d DESC);

-- Optimization tracking index
CREATE INDEX idx_vw_work_kpi_v3_optimization 
ON vw_work_kpi_v3 (organization_id, optimization_roi_pct DESC, optimization_success_rate DESC);

-- Compliance monitoring index
CREATE INDEX idx_vw_work_kpi_v3_compliance 
ON vw_work_kpi_v3 (organization_id, compliance_rate_pct, workforce_status);

-- Trend analysis index
CREATE INDEX idx_vw_work_kpi_v3_trends 
ON vw_work_kpi_v3 (organization_id, hours_trend, cost_trend, report_quarter);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_work_kpi_v3 TO authenticated;
GRANT SELECT ON vw_work_kpi_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_work_kpi_v3 IS 'HERA Finance DNA V3.6: Comprehensive workforce KPI dashboard view providing executive-level workforce analytics including productivity metrics, cost efficiency, optimization impact, compliance tracking, and health scoring for strategic workforce management and decision-making.';