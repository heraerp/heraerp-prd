-- HERA Actor Coverage Validation with Learning
-- This query checks actor stamping coverage across Sacred Six tables
-- and provides learning data for the autopilot system

WITH sacred_six_tables AS (
  SELECT 'core_entities' AS table_name, 'CRITICAL' AS priority
  UNION ALL
  SELECT 'core_dynamic_data', 'CRITICAL'
  UNION ALL  
  SELECT 'core_relationships', 'CRITICAL'
  UNION ALL
  SELECT 'core_organizations', 'HIGH'
  UNION ALL
  SELECT 'universal_transactions', 'CRITICAL'
  UNION ALL
  SELECT 'universal_transaction_lines', 'CRITICAL'
),

coverage_analysis AS (
  SELECT 
    t.table_name,
    t.priority,
    CASE t.table_name
      WHEN 'core_entities' THEN (
        SELECT jsonb_build_object(
          'total_rows', COUNT(*),
          'null_created_by', SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END),
          'null_updated_by', SUM(CASE WHEN updated_by IS NULL THEN 1 ELSE 0 END),
          'coverage_pct', ROUND(100.0 * SUM(CASE WHEN created_by IS NOT NULL AND updated_by IS NOT NULL THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1), 2),
          'recent_violations', SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' AND (created_by IS NULL OR updated_by IS NULL) THEN 1 ELSE 0 END)
        )
        FROM core_entities
      )
      WHEN 'core_dynamic_data' THEN (
        SELECT jsonb_build_object(
          'total_rows', COUNT(*),
          'null_created_by', SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END),
          'null_updated_by', SUM(CASE WHEN updated_by IS NULL THEN 1 ELSE 0 END),
          'coverage_pct', ROUND(100.0 * SUM(CASE WHEN created_by IS NOT NULL AND updated_by IS NOT NULL THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1), 2),
          'recent_violations', SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' AND (created_by IS NULL OR updated_by IS NULL) THEN 1 ELSE 0 END)
        )
        FROM core_dynamic_data
      )
      WHEN 'core_relationships' THEN (
        SELECT jsonb_build_object(
          'total_rows', COUNT(*),
          'null_created_by', SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END),
          'null_updated_by', SUM(CASE WHEN updated_by IS NULL THEN 1 ELSE 0 END),
          'coverage_pct', ROUND(100.0 * SUM(CASE WHEN created_by IS NOT NULL AND updated_by IS NOT NULL THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1), 2),
          'recent_violations', SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' AND (created_by IS NULL OR updated_by IS NULL) THEN 1 ELSE 0 END)
        )
        FROM core_relationships
      )
      WHEN 'core_organizations' THEN (
        SELECT jsonb_build_object(
          'total_rows', COUNT(*),
          'null_created_by', SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END),
          'null_updated_by', SUM(CASE WHEN updated_by IS NULL THEN 1 ELSE 0 END),
          'coverage_pct', ROUND(100.0 * SUM(CASE WHEN created_by IS NOT NULL AND updated_by IS NOT NULL THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1), 2),
          'recent_violations', SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' AND (created_by IS NULL OR updated_by IS NULL) THEN 1 ELSE 0 END)
        )
        FROM core_organizations
      )
      WHEN 'universal_transactions' THEN (
        SELECT jsonb_build_object(
          'total_rows', COUNT(*),
          'null_created_by', SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END),
          'null_updated_by', SUM(CASE WHEN updated_by IS NULL THEN 1 ELSE 0 END),
          'coverage_pct', ROUND(100.0 * SUM(CASE WHEN created_by IS NOT NULL AND updated_by IS NOT NULL THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1), 2),
          'recent_violations', SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' AND (created_by IS NULL OR updated_by IS NULL) THEN 1 ELSE 0 END)
        )
        FROM universal_transactions
      )
      WHEN 'universal_transaction_lines' THEN (
        SELECT jsonb_build_object(
          'total_rows', COUNT(*),
          'null_created_by', SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END),
          'null_updated_by', SUM(CASE WHEN updated_by IS NULL THEN 1 ELSE 0 END),
          'coverage_pct', ROUND(100.0 * SUM(CASE WHEN created_by IS NOT NULL AND updated_by IS NOT NULL THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1), 2),
          'recent_violations', SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' AND (created_by IS NULL OR updated_by IS NULL) THEN 1 ELSE 0 END)
        )
        FROM universal_transaction_lines
      )
    END AS metrics
  FROM sacred_six_tables t
),

violation_analysis AS (
  SELECT 
    table_name,
    priority,
    metrics,
    (metrics->>'coverage_pct')::numeric AS coverage_percentage,
    (metrics->>'recent_violations')::integer AS recent_violations,
    CASE 
      WHEN (metrics->>'coverage_pct')::numeric < 95.0 THEN 'CRITICAL_COVERAGE_VIOLATION'
      WHEN (metrics->>'coverage_pct')::numeric < 98.0 THEN 'WARNING_COVERAGE_LOW' 
      ELSE 'COVERAGE_OK'
    END AS coverage_status,
    CASE
      WHEN (metrics->>'recent_violations')::integer > 0 THEN 'RECENT_VIOLATIONS_DETECTED'
      ELSE 'NO_RECENT_VIOLATIONS'
    END AS recent_status
  FROM coverage_analysis
),

learning_patterns AS (
  SELECT 
    table_name,
    coverage_status,
    recent_status,
    CASE coverage_status
      WHEN 'CRITICAL_COVERAGE_VIOLATION' THEN 'pattern_critical_actor_missing'
      WHEN 'WARNING_COVERAGE_LOW' THEN 'pattern_actor_coverage_degrading'
      ELSE 'pattern_actor_coverage_healthy'
    END AS learning_pattern,
    CASE coverage_status
      WHEN 'CRITICAL_COVERAGE_VIOLATION' THEN 'Enable audit triggers and fix RPC functions to stamp actors'
      WHEN 'WARNING_COVERAGE_LOW' THEN 'Review recent writes and ensure actor stamping is working'
      ELSE 'Continue monitoring actor coverage'
    END AS recommended_fix
  FROM violation_analysis
)

-- Main output for autopilot learning
SELECT 
  'HERA_ACTOR_COVERAGE_ANALYSIS' AS analysis_type,
  NOW() AS analysis_timestamp,
  jsonb_build_object(
    'summary', jsonb_build_object(
      'total_tables_checked', (SELECT COUNT(*) FROM violation_analysis),
      'tables_with_violations', (SELECT COUNT(*) FROM violation_analysis WHERE coverage_percentage < 95.0),
      'tables_with_recent_violations', (SELECT COUNT(*) FROM violation_analysis WHERE recent_violations > 0),
      'overall_health', CASE 
        WHEN (SELECT COUNT(*) FROM violation_analysis WHERE coverage_percentage < 95.0) > 0 THEN 'CRITICAL'
        WHEN (SELECT COUNT(*) FROM violation_analysis WHERE coverage_percentage < 98.0) > 0 THEN 'WARNING'
        ELSE 'HEALTHY'
      END
    ),
    'tables', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table_name', table_name,
          'priority', priority,
          'coverage_percentage', coverage_percentage,
          'coverage_status', coverage_status,
          'recent_violations', recent_violations,
          'recent_status', recent_status,
          'total_rows', metrics->>'total_rows',
          'null_created_by', metrics->>'null_created_by',
          'null_updated_by', metrics->>'null_updated_by'
        )
      ) FROM violation_analysis
    ),
    'learning_patterns', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table_name', table_name,
          'pattern', learning_pattern,
          'recommended_fix', recommended_fix
        )
      ) FROM learning_patterns
    ),
    'violations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table_name', table_name,
          'violation_type', coverage_status,
          'severity', CASE coverage_status
            WHEN 'CRITICAL_COVERAGE_VIOLATION' THEN 'CRITICAL'
            WHEN 'WARNING_COVERAGE_LOW' THEN 'WARNING'
            ELSE 'INFO'
          END,
          'coverage_percentage', coverage_percentage,
          'recent_violations', recent_violations
        )
      ) FROM violation_analysis WHERE coverage_percentage < 95.0
    )
  ) AS analysis_data,
  
  -- Claude Autopilot Learning Data
  jsonb_build_object(
    'session_type', 'actor_coverage_validation',
    'patterns_detected', (SELECT COUNT(DISTINCT learning_pattern) FROM learning_patterns),
    'fix_recommendations', (SELECT jsonb_agg(DISTINCT recommended_fix) FROM learning_patterns),
    'success_criteria', jsonb_build_object(
      'min_coverage_percentage', 95.0,
      'max_recent_violations', 0,
      'required_tables_healthy', (SELECT COUNT(*) FROM sacred_six_tables)
    ),
    'current_status', jsonb_build_object(
      'meets_coverage_criteria', (SELECT COUNT(*) FROM violation_analysis WHERE coverage_percentage >= 95.0) = (SELECT COUNT(*) FROM sacred_six_tables),
      'no_recent_violations', (SELECT SUM(recent_violations) FROM violation_analysis) = 0,
      'overall_pass', (SELECT COUNT(*) FROM violation_analysis WHERE coverage_percentage >= 95.0) = (SELECT COUNT(*) FROM sacred_six_tables) 
                    AND (SELECT SUM(recent_violations) FROM violation_analysis) = 0
    )
  ) AS learning_data;

-- Additional output: Detailed violations for immediate attention
SELECT 
  'HERA_ACTOR_VIOLATIONS_DETAIL' AS violation_type,
  table_name,
  priority,
  coverage_percentage,
  recent_violations,
  coverage_status,
  recent_status,
  CASE 
    WHEN coverage_percentage < 95.0 THEN 'IMMEDIATE_ACTION_REQUIRED'
    WHEN recent_violations > 0 THEN 'MONITOR_CLOSELY'
    ELSE 'STATUS_OK'
  END AS action_required,
  CASE 
    WHEN coverage_percentage < 95.0 THEN 'Run data migration to backfill missing actor stamps and ensure triggers are enabled'
    WHEN recent_violations > 0 THEN 'Investigate recent writes that bypassed actor stamping'
    ELSE 'Continue current practices'
  END AS immediate_action
FROM violation_analysis
WHERE coverage_percentage < 95.0 OR recent_violations > 0
ORDER BY 
  CASE priority WHEN 'CRITICAL' THEN 1 ELSE 2 END,
  coverage_percentage ASC;

-- Learning outcome: Exit with appropriate code for CI/CD
DO $$
DECLARE
  violation_count INTEGER;
  critical_violations INTEGER;
BEGIN
  SELECT COUNT(*) INTO violation_count FROM (
    SELECT 1 FROM core_entities WHERE created_by IS NULL OR updated_by IS NULL
    UNION ALL
    SELECT 1 FROM core_dynamic_data WHERE created_by IS NULL OR updated_by IS NULL
    UNION ALL
    SELECT 1 FROM core_relationships WHERE created_by IS NULL OR updated_by IS NULL
    UNION ALL
    SELECT 1 FROM universal_transactions WHERE created_by IS NULL OR updated_by IS NULL
    UNION ALL
    SELECT 1 FROM universal_transaction_lines WHERE created_by IS NULL OR updated_by IS NULL
  ) violations;
  
  SELECT COUNT(*) INTO critical_violations FROM (
    SELECT 1 FROM core_entities WHERE created_by IS NULL OR updated_by IS NULL LIMIT 1
    UNION ALL
    SELECT 1 FROM universal_transactions WHERE created_by IS NULL OR updated_by IS NULL LIMIT 1
  ) critical_viol;
  
  -- Log results for learning
  RAISE NOTICE 'HERA_ACTOR_COVERAGE_CHECK: % total violations, % critical violations', violation_count, critical_violations;
  
  IF critical_violations > 0 THEN
    RAISE EXCEPTION 'CRITICAL: Actor coverage violations detected in critical tables. Coverage check failed.';
  ELSIF violation_count > 0 THEN
    RAISE WARNING 'WARNING: Actor coverage violations detected. Consider running data migration.';
  ELSE
    RAISE NOTICE 'SUCCESS: Actor coverage check passed. All Sacred Six tables have proper actor stamping.';
  END IF;
END $$;