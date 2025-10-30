-- HERA GL Balance Validation with Learning
-- This query validates GL balance compliance and provides learning data
-- for the autopilot system to understand financial posting patterns

WITH gl_transactions AS (
  SELECT 
    ut.id AS transaction_id,
    ut.transaction_type,
    ut.transaction_number,
    ut.smart_code AS transaction_smart_code,
    ut.transaction_currency_code,
    ut.total_amount,
    ut.organization_id,
    ut.created_at,
    ut.created_by
  FROM universal_transactions ut
  WHERE EXISTS (
    SELECT 1 FROM universal_transaction_lines utl 
    WHERE utl.transaction_id = ut.id 
    AND utl.smart_code LIKE '%.GL.%'
  )
),

gl_line_analysis AS (
  SELECT 
    gt.transaction_id,
    gt.transaction_type,
    gt.transaction_number,
    gt.transaction_smart_code,
    gt.transaction_currency_code,
    gt.total_amount,
    gt.organization_id,
    gt.created_at,
    gt.created_by,
    utl.line_number,
    utl.line_type,
    utl.smart_code AS line_smart_code,
    utl.line_amount,
    utl.line_data,
    (utl.line_data->>'side') AS gl_side,
    (utl.line_data->>'account') AS gl_account,
    COALESCE(utl.transaction_currency_code, gt.transaction_currency_code, 'USD') AS line_currency
  FROM gl_transactions gt
  JOIN universal_transaction_lines utl ON utl.transaction_id = gt.transaction_id
  WHERE utl.smart_code LIKE '%.GL.%'
),

gl_validation AS (
  SELECT 
    transaction_id,
    transaction_type,
    transaction_number,
    transaction_smart_code,
    line_currency,
    organization_id,
    created_at,
    created_by,
    SUM(CASE WHEN gl_side = 'DR' THEN line_amount ELSE 0 END) AS total_dr,
    SUM(CASE WHEN gl_side = 'CR' THEN line_amount ELSE 0 END) AS total_cr,
    COUNT(*) AS gl_line_count,
    COUNT(CASE WHEN gl_side NOT IN ('DR', 'CR') THEN 1 END) AS invalid_sides,
    COUNT(CASE WHEN gl_account IS NULL OR gl_account = '' THEN 1 END) AS missing_accounts,
    ARRAY_AGG(DISTINCT gl_side) AS sides_used,
    ARRAY_AGG(DISTINCT gl_account) FILTER (WHERE gl_account IS NOT NULL) AS accounts_used
  FROM gl_line_analysis
  GROUP BY 
    transaction_id, transaction_type, transaction_number, 
    transaction_smart_code, line_currency, organization_id,
    created_at, created_by
),

balance_analysis AS (
  SELECT 
    *,
    ABS(total_dr - total_cr) AS balance_difference,
    CASE 
      WHEN ABS(total_dr - total_cr) <= 0.01 THEN 'BALANCED'
      WHEN ABS(total_dr - total_cr) <= 0.10 THEN 'MINOR_IMBALANCE'
      WHEN ABS(total_dr - total_cr) <= 1.00 THEN 'MODERATE_IMBALANCE'
      ELSE 'CRITICAL_IMBALANCE'
    END AS balance_status,
    CASE 
      WHEN invalid_sides > 0 THEN 'INVALID_GL_SIDES'
      WHEN missing_accounts > 0 THEN 'MISSING_GL_ACCOUNTS'
      WHEN gl_line_count < 2 THEN 'INSUFFICIENT_GL_LINES'
      ELSE 'GL_STRUCTURE_OK'
    END AS structure_status,
    CASE
      WHEN total_dr = 0 AND total_cr = 0 THEN 'ZERO_AMOUNT_TRANSACTION'
      WHEN total_dr = 0 THEN 'MISSING_DEBITS'
      WHEN total_cr = 0 THEN 'MISSING_CREDITS'
      ELSE 'HAS_BOTH_SIDES'
    END AS side_analysis
  FROM gl_validation
),

violation_patterns AS (
  SELECT 
    transaction_type,
    balance_status,
    structure_status,
    side_analysis,
    COUNT(*) AS violation_count,
    ARRAY_AGG(transaction_id ORDER BY created_at DESC) AS example_transactions,
    AVG(balance_difference) AS avg_balance_difference,
    MAX(balance_difference) AS max_balance_difference,
    COUNT(DISTINCT organization_id) AS affected_orgs
  FROM balance_analysis
  WHERE balance_status != 'BALANCED' OR structure_status != 'GL_STRUCTURE_OK'
  GROUP BY transaction_type, balance_status, structure_status, side_analysis
),

learning_insights AS (
  SELECT 
    'gl_balance_patterns' AS pattern_type,
    jsonb_build_object(
      'total_gl_transactions', (SELECT COUNT(*) FROM balance_analysis),
      'balanced_transactions', (SELECT COUNT(*) FROM balance_analysis WHERE balance_status = 'BALANCED'),
      'imbalanced_transactions', (SELECT COUNT(*) FROM balance_analysis WHERE balance_status != 'BALANCED'),
      'balance_compliance_rate', ROUND(100.0 * (SELECT COUNT(*) FROM balance_analysis WHERE balance_status = 'BALANCED') / GREATEST((SELECT COUNT(*) FROM balance_analysis), 1), 2),
      'common_transaction_types', (
        SELECT jsonb_agg(DISTINCT transaction_type) 
        FROM balance_analysis 
        WHERE balance_status != 'BALANCED'
      ),
      'common_imbalance_patterns', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'pattern', balance_status || '_' || structure_status,
            'count', violation_count,
            'transaction_types', jsonb_agg(DISTINCT transaction_type)
          )
        ) FROM violation_patterns
      )
    ) AS pattern_data
),

fix_recommendations AS (
  SELECT 
    CASE balance_status
      WHEN 'MINOR_IMBALANCE' THEN 'pattern_rounding_errors'
      WHEN 'MODERATE_IMBALANCE' THEN 'pattern_calculation_errors'
      WHEN 'CRITICAL_IMBALANCE' THEN 'pattern_logic_errors'
      ELSE 'pattern_unknown_imbalance'
    END AS error_pattern,
    CASE balance_status
      WHEN 'MINOR_IMBALANCE' THEN 'Review rounding logic in transaction posting'
      WHEN 'MODERATE_IMBALANCE' THEN 'Validate calculation logic for line amounts'
      WHEN 'CRITICAL_IMBALANCE' THEN 'Critical GL posting logic error - review transaction creation'
      ELSE 'Unknown balance issue - investigate transaction structure'
    END AS recommended_fix,
    CASE structure_status
      WHEN 'INVALID_GL_SIDES' THEN 'Ensure all GL lines have valid DR/CR sides'
      WHEN 'MISSING_GL_ACCOUNTS' THEN 'Validate GL account assignment in line data'
      WHEN 'INSUFFICIENT_GL_LINES' THEN 'Ensure GL transactions have at least two lines'
      ELSE 'GL structure validation passed'
    END AS structure_fix,
    COUNT(*) AS occurrence_count
  FROM balance_analysis
  WHERE balance_status != 'BALANCED' OR structure_status != 'GL_STRUCTURE_OK'
  GROUP BY balance_status, structure_status
)

-- Main output for autopilot learning
SELECT 
  'HERA_GL_BALANCE_ANALYSIS' AS analysis_type,
  NOW() AS analysis_timestamp,
  jsonb_build_object(
    'summary', jsonb_build_object(
      'total_transactions_checked', (SELECT COUNT(*) FROM balance_analysis),
      'balanced_transactions', (SELECT COUNT(*) FROM balance_analysis WHERE balance_status = 'BALANCED'),
      'imbalanced_transactions', (SELECT COUNT(*) FROM balance_analysis WHERE balance_status != 'BALANCED'),
      'balance_compliance_rate', (
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE balance_status = 'BALANCED') / GREATEST(COUNT(*), 1), 2)
        FROM balance_analysis
      ),
      'structure_violations', (SELECT COUNT(*) FROM balance_analysis WHERE structure_status != 'GL_STRUCTURE_OK'),
      'overall_health', CASE 
        WHEN (SELECT COUNT(*) FROM balance_analysis WHERE balance_status = 'CRITICAL_IMBALANCE') > 0 THEN 'CRITICAL'
        WHEN (SELECT COUNT(*) FROM balance_analysis WHERE balance_status != 'BALANCED') > 0 THEN 'WARNING'
        ELSE 'HEALTHY'
      END
    ),
    'violations_by_type', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'balance_status', balance_status,
          'structure_status', structure_status,
          'side_analysis', side_analysis,
          'count', COUNT(*),
          'avg_difference', ROUND(AVG(balance_difference), 4),
          'max_difference', ROUND(MAX(balance_difference), 4),
          'example_transaction', MIN(transaction_id)
        )
      ) 
      FROM balance_analysis 
      WHERE balance_status != 'BALANCED' OR structure_status != 'GL_STRUCTURE_OK'
      GROUP BY balance_status, structure_status, side_analysis
    ),
    'learning_patterns', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'error_pattern', error_pattern,
          'recommended_fix', recommended_fix,
          'structure_fix', structure_fix,
          'occurrence_count', occurrence_count
        )
      ) FROM fix_recommendations
    ),
    'recent_violations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'transaction_id', transaction_id,
          'transaction_type', transaction_type,
          'transaction_number', transaction_number,
          'balance_status', balance_status,
          'balance_difference', balance_difference,
          'currency', line_currency,
          'created_at', created_at,
          'organization_id', organization_id
        )
      ) 
      FROM balance_analysis 
      WHERE balance_status != 'BALANCED' 
      AND created_at > NOW() - INTERVAL '24 hours'
    )
  ) AS analysis_data,
  
  -- Claude Autopilot Learning Data
  jsonb_build_object(
    'session_type', 'gl_balance_validation',
    'patterns_detected', (SELECT COUNT(DISTINCT error_pattern) FROM fix_recommendations),
    'fix_strategies', (
      SELECT jsonb_agg(DISTINCT recommended_fix) FROM fix_recommendations
    ),
    'success_criteria', jsonb_build_object(
      'max_imbalanced_transactions', 0,
      'max_balance_difference', 0.01,
      'required_structure_compliance', 100.0
    ),
    'current_status', jsonb_build_object(
      'has_imbalances', (SELECT COUNT(*) FROM balance_analysis WHERE balance_status != 'BALANCED') > 0,
      'has_structure_violations', (SELECT COUNT(*) FROM balance_analysis WHERE structure_status != 'GL_STRUCTURE_OK') > 0,
      'compliance_rate', (
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE balance_status = 'BALANCED') / GREATEST(COUNT(*), 1), 2)
        FROM balance_analysis
      ),
      'overall_pass', (SELECT COUNT(*) FROM balance_analysis WHERE balance_status != 'BALANCED') = 0
    )
  ) AS learning_data;

-- Critical violations for immediate attention
SELECT 
  'HERA_GL_CRITICAL_VIOLATIONS' AS violation_type,
  transaction_id,
  transaction_type,
  transaction_number,
  transaction_smart_code,
  line_currency,
  organization_id,
  balance_status,
  structure_status,
  side_analysis,
  balance_difference,
  total_dr,
  total_cr,
  gl_line_count,
  invalid_sides,
  missing_accounts,
  created_at,
  CASE balance_status
    WHEN 'CRITICAL_IMBALANCE' THEN 'IMMEDIATE_CORRECTION_REQUIRED'
    WHEN 'MODERATE_IMBALANCE' THEN 'REVIEW_AND_CORRECT'
    WHEN 'MINOR_IMBALANCE' THEN 'MONITOR_FOR_PATTERN'
    ELSE 'INVESTIGATE_STRUCTURE'
  END AS action_required
FROM balance_analysis
WHERE balance_status != 'BALANCED' OR structure_status != 'GL_STRUCTURE_OK'
ORDER BY 
  CASE balance_status 
    WHEN 'CRITICAL_IMBALANCE' THEN 1
    WHEN 'MODERATE_IMBALANCE' THEN 2
    WHEN 'MINOR_IMBALANCE' THEN 3
    ELSE 4
  END,
  balance_difference DESC,
  created_at DESC;

-- Learning outcome: Exit with appropriate code for CI/CD
DO $$
DECLARE
  imbalanced_count INTEGER;
  critical_imbalances INTEGER;
  structure_violations INTEGER;
BEGIN
  SELECT COUNT(*) INTO imbalanced_count
  FROM universal_transactions ut
  JOIN (
    SELECT 
      transaction_id,
      ABS(SUM(CASE WHEN (line_data->>'side') = 'DR' THEN line_amount ELSE 0 END) - 
          SUM(CASE WHEN (line_data->>'side') = 'CR' THEN line_amount ELSE 0 END)) AS diff
    FROM universal_transaction_lines utl
    WHERE utl.smart_code LIKE '%.GL.%'
    GROUP BY transaction_id
  ) balance_check ON balance_check.transaction_id = ut.id
  WHERE balance_check.diff > 0.01;
  
  SELECT COUNT(*) INTO critical_imbalances
  FROM universal_transactions ut
  JOIN (
    SELECT 
      transaction_id,
      ABS(SUM(CASE WHEN (line_data->>'side') = 'DR' THEN line_amount ELSE 0 END) - 
          SUM(CASE WHEN (line_data->>'side') = 'CR' THEN line_amount ELSE 0 END)) AS diff
    FROM universal_transaction_lines utl
    WHERE utl.smart_code LIKE '%.GL.%'
    GROUP BY transaction_id
  ) balance_check ON balance_check.transaction_id = ut.id
  WHERE balance_check.diff > 1.00;
  
  SELECT COUNT(*) INTO structure_violations
  FROM universal_transaction_lines utl
  WHERE utl.smart_code LIKE '%.GL.%'
  AND ((utl.line_data->>'side') NOT IN ('DR', 'CR') OR (utl.line_data->>'account') IS NULL);
  
  -- Log results for learning
  RAISE NOTICE 'HERA_GL_BALANCE_CHECK: % imbalanced, % critical, % structure violations', 
    imbalanced_count, critical_imbalances, structure_violations;
  
  IF critical_imbalances > 0 THEN
    RAISE EXCEPTION 'CRITICAL: Critical GL balance violations detected. Transactions with >$1.00 imbalance found.';
  ELSIF imbalanced_count > 0 THEN
    RAISE WARNING 'WARNING: GL balance violations detected. % transactions are imbalanced.', imbalanced_count;
  ELSIF structure_violations > 0 THEN
    RAISE WARNING 'WARNING: GL structure violations detected. % lines have invalid sides/accounts.', structure_violations;
  ELSE
    RAISE NOTICE 'SUCCESS: GL balance check passed. All GL transactions are properly balanced.';
  END IF;
END $$;