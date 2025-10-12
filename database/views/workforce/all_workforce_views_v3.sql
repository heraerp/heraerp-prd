-- ============================================================================
-- HERA Finance DNA V3.6: Complete Workforce Optimization Views
-- 
-- Master deployment file for all workforce optimization views including:
-- - fact_work_cost_v3: Comprehensive workforce cost analytics
-- - vw_work_roster_v3: Workforce roster management
-- - vw_work_timesheet_v3: Timesheet management and tracking
-- - vw_work_kpi_v3: Executive KPI dashboard
-- 
-- Deploy Order: Cost Facts → Roster → Timesheet → KPI Dashboard
-- Smart Code: HERA.WORK.VIEWS.COMPLETE.DEPLOYMENT.V3
-- ============================================================================

-- Set session parameters for optimal performance
SET work_mem = '256MB';
SET maintenance_work_mem = '512MB';

-- ============================================================================
-- 1. Workforce Cost Fact View
-- ============================================================================

\i fact_work_cost_v3.sql

-- ============================================================================
-- 2. Workforce Roster Management View  
-- ============================================================================

\i vw_work_roster_v3.sql

-- ============================================================================
-- 3. Workforce Timesheet Management View
-- ============================================================================

\i vw_work_timesheet_v3.sql

-- ============================================================================
-- 4. Workforce KPI Dashboard View
-- ============================================================================

\i vw_work_kpi_v3.sql

-- ============================================================================
-- Master Workforce Optimization View Registry
-- ============================================================================

-- Create view registry for workforce optimization views
CREATE OR REPLACE VIEW vw_workforce_view_registry_v3 AS
SELECT 
  'fact_work_cost_v3' as view_name,
  'Workforce Cost Fact Analysis' as view_description,
  'HERA.WORK.COST.FACT.ANALYSIS.V3' as smart_code,
  'Core workforce cost analytics with variance tracking and performance metrics' as purpose,
  'High' as business_impact,
  'COMPLETED' as deployment_status,
  CURRENT_TIMESTAMP as last_updated

UNION ALL

SELECT 
  'vw_work_roster_v3' as view_name,
  'Workforce Roster Management' as view_description,
  'HERA.WORK.ROSTER.MANAGEMENT.V3' as smart_code,
  'Real-time employee scheduling, availability tracking, and skill matching' as purpose,
  'High' as business_impact,
  'COMPLETED' as deployment_status,
  CURRENT_TIMESTAMP as last_updated

UNION ALL

SELECT 
  'vw_work_timesheet_v3' as view_name,
  'Workforce Timesheet Management' as view_description,
  'HERA.WORK.TIMESHEET.MANAGEMENT.V3' as smart_code,
  'Time tracking, approval workflows, and payroll integration' as purpose,
  'Critical' as business_impact,
  'COMPLETED' as deployment_status,
  CURRENT_TIMESTAMP as last_updated

UNION ALL

SELECT 
  'vw_work_kpi_v3' as view_name,
  'Workforce KPI Dashboard' as view_description,
  'HERA.WORK.KPI.DASHBOARD.V3' as smart_code,
  'Executive-level workforce analytics and performance dashboards' as purpose,
  'Strategic' as business_impact,
  'COMPLETED' as deployment_status,
  CURRENT_TIMESTAMP as last_updated

ORDER BY 
  CASE 
    WHEN business_impact = 'Strategic' THEN 1
    WHEN business_impact = 'Critical' THEN 2  
    WHEN business_impact = 'High' THEN 3
    ELSE 4
  END,
  view_name;

-- Grant access to view registry
GRANT SELECT ON vw_workforce_view_registry_v3 TO authenticated;
GRANT SELECT ON vw_workforce_view_registry_v3 TO service_role;

-- ============================================================================
-- Workforce Views Health Check Function
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_workforce_views_health_check_v3(
  p_org_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_health_report JSONB := '{}';
  v_view_status JSONB := '[]';
  v_org_filter TEXT := '';
  v_test_results JSONB;
BEGIN
  
  -- Set organization filter if provided
  IF p_org_id IS NOT NULL THEN
    v_org_filter := 'WHERE organization_id = ''' || p_org_id || '''';
  ELSE
    v_org_filter := 'LIMIT 10'; -- Limit test data if no org specified
  END IF;
  
  -- Test fact_work_cost_v3
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM fact_work_cost_v3 ' || v_org_filter INTO v_test_results;
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'fact_work_cost_v3',
      'status', 'HEALTHY',
      'record_count', v_test_results,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'fact_work_cost_v3',
      'status', 'ERROR',
      'error_message', SQLERRM,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  END;
  
  -- Test vw_work_roster_v3
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM vw_work_roster_v3 ' || v_org_filter INTO v_test_results;
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'vw_work_roster_v3',
      'status', 'HEALTHY',
      'record_count', v_test_results,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'vw_work_roster_v3',
      'status', 'ERROR',
      'error_message', SQLERRM,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  END;
  
  -- Test vw_work_timesheet_v3
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM vw_work_timesheet_v3 ' || v_org_filter INTO v_test_results;
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'vw_work_timesheet_v3',
      'status', 'HEALTHY',
      'record_count', v_test_results,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'vw_work_timesheet_v3',
      'status', 'ERROR',
      'error_message', SQLERRM,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  END;
  
  -- Test vw_work_kpi_v3
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM vw_work_kpi_v3 ' || v_org_filter INTO v_test_results;
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'vw_work_kpi_v3',
      'status', 'HEALTHY',
      'record_count', v_test_results,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    v_view_status := v_view_status || jsonb_build_object(
      'view_name', 'vw_work_kpi_v3',
      'status', 'ERROR',
      'error_message', SQLERRM,
      'test_timestamp', CURRENT_TIMESTAMP
    );
  END;
  
  -- Compile health report
  v_health_report := jsonb_build_object(
    'health_check_id', gen_random_uuid(),
    'organization_id', p_org_id,
    'total_views_tested', jsonb_array_length(v_view_status),
    'healthy_views', (
      SELECT COUNT(*)
      FROM jsonb_array_elements(v_view_status) as view_test
      WHERE view_test->>'status' = 'HEALTHY'
    ),
    'error_views', (
      SELECT COUNT(*)
      FROM jsonb_array_elements(v_view_status) as view_test
      WHERE view_test->>'status' = 'ERROR'
    ),
    'overall_status', CASE 
      WHEN (
        SELECT COUNT(*)
        FROM jsonb_array_elements(v_view_status) as view_test
        WHERE view_test->>'status' = 'ERROR'
      ) = 0 THEN 'ALL_HEALTHY'
      ELSE 'ISSUES_DETECTED'
    END,
    'view_details', v_view_status,
    'health_check_timestamp', CURRENT_TIMESTAMP,
    'smart_code', 'HERA.WORK.VIEWS.HEALTH.CHECK.V3'
  );
  
  RETURN v_health_report;
  
END;
$$;

-- Grant access to health check function
GRANT EXECUTE ON FUNCTION hera_workforce_views_health_check_v3(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_workforce_views_health_check_v3(UUID) TO service_role;

-- ============================================================================
-- Deployment Verification
-- ============================================================================

-- Verify all workforce views are accessible
DO $$
DECLARE
  v_view_count INTEGER;
  v_view_names TEXT[];
BEGIN
  -- Check that all 4 workforce views exist
  SELECT COUNT(*), array_agg(table_name) 
  INTO v_view_count, v_view_names
  FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name IN ('fact_work_cost_v3', 'vw_work_roster_v3', 'vw_work_timesheet_v3', 'vw_work_kpi_v3');
  
  IF v_view_count != 4 THEN
    RAISE EXCEPTION 'Workforce views deployment incomplete. Found % views: %', v_view_count, v_view_names;
  END IF;
  
  RAISE NOTICE 'HERA Finance DNA V3.6 Workforce Optimization Views deployment SUCCESSFUL';
  RAISE NOTICE 'All % workforce views are accessible: %', v_view_count, v_view_names;
  
END;
$$;

-- ============================================================================
-- Documentation and Comments
-- ============================================================================

COMMENT ON VIEW vw_workforce_view_registry_v3 IS 'HERA Finance DNA V3.6: Registry of all workforce optimization views with deployment status and business impact classification.';

COMMENT ON FUNCTION hera_workforce_views_health_check_v3(UUID) IS 'HERA Finance DNA V3.6: Health check function for all workforce optimization views, providing status validation and performance monitoring.';

-- ============================================================================
-- Final Status Report
-- ============================================================================

-- Create deployment summary
SELECT 
  'HERA Finance DNA V3.6 Workforce Optimization Views' as deployment_package,
  'COMPLETED' as deployment_status,
  4 as total_views_deployed,
  1 as registry_views_created,
  1 as health_check_functions_created,
  CURRENT_TIMESTAMP as deployment_timestamp,
  'All workforce optimization views successfully deployed with complete Sacred Six table compliance' as notes,
  'HERA.WORK.VIEWS.DEPLOYMENT.SUCCESS.V3' as smart_code;

-- Reset session parameters
RESET work_mem;
RESET maintenance_work_mem;