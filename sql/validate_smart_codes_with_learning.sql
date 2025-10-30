-- HERA Smart Code Pattern Validation with Learning
-- This query validates Smart Code compliance across all HERA entities
-- and provides learning data for pattern recognition and auto-fixing

WITH smart_code_pattern AS (
  SELECT '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' AS pattern
),

entities_analysis AS (
  SELECT 
    'core_entities' AS table_name,
    id,
    entity_type,
    entity_name,
    smart_code,
    organization_id,
    created_at,
    created_by,
    CASE 
      WHEN smart_code IS NULL THEN 'MISSING_SMART_CODE'
      WHEN smart_code !~ (SELECT pattern FROM smart_code_pattern) THEN 'INVALID_PATTERN'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'MISSING_VERSION'
      WHEN smart_code !~ '^HERA\.' THEN 'MISSING_HERA_PREFIX'
      WHEN LENGTH(smart_code) > 200 THEN 'TOO_LONG'
      WHEN LENGTH(smart_code) < 20 THEN 'TOO_SHORT'
      ELSE 'VALID'
    END AS validation_status,
    CASE 
      WHEN smart_code IS NULL THEN 'Add smart_code field with proper HERA DNA pattern'
      WHEN smart_code !~ '^HERA\.' THEN 'Prefix smart_code with HERA.'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'Add version suffix like .v1'
      WHEN smart_code ~ '[a-z]' AND smart_code !~ '\.v[0-9]+$' THEN 'Convert segments to UPPERCASE (except version)'
      WHEN smart_code !~ '\.[A-Z0-9_]{2,30}\.' THEN 'Add proper module/type segments'
      ELSE 'Smart code is valid'
    END AS fix_recommendation
  FROM core_entities
  WHERE created_at > NOW() - INTERVAL '30 days' OR smart_code IS NULL OR smart_code !~ (SELECT pattern FROM smart_code_pattern)
),

transactions_analysis AS (
  SELECT 
    'universal_transactions' AS table_name,
    id,
    transaction_type,
    transaction_number,
    smart_code,
    organization_id,
    created_at,
    created_by,
    CASE 
      WHEN smart_code IS NULL THEN 'MISSING_SMART_CODE'
      WHEN smart_code !~ (SELECT pattern FROM smart_code_pattern) THEN 'INVALID_PATTERN'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'MISSING_VERSION'
      WHEN smart_code !~ '^HERA\.' THEN 'MISSING_HERA_PREFIX'
      WHEN LENGTH(smart_code) > 200 THEN 'TOO_LONG'
      WHEN LENGTH(smart_code) < 20 THEN 'TOO_SHORT'
      ELSE 'VALID'
    END AS validation_status,
    CASE 
      WHEN smart_code IS NULL THEN 'Add smart_code field with HERA.{MODULE}.TXN.{TYPE}.v1 pattern'
      WHEN smart_code !~ '^HERA\.' THEN 'Prefix smart_code with HERA.'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'Add version suffix like .v1'
      WHEN smart_code ~ '[a-z]' AND smart_code !~ '\.v[0-9]+$' THEN 'Convert segments to UPPERCASE (except version)'
      WHEN smart_code !~ '\.TXN\.' THEN 'Add .TXN. segment for transactions'
      ELSE 'Smart code is valid'
    END AS fix_recommendation
  FROM universal_transactions
  WHERE created_at > NOW() - INTERVAL '30 days' OR smart_code IS NULL OR smart_code !~ (SELECT pattern FROM smart_code_pattern)
),

transaction_lines_analysis AS (
  SELECT 
    'universal_transaction_lines' AS table_name,
    id,
    line_type,
    line_number,
    smart_code,
    organization_id,
    created_at,
    created_by,
    CASE 
      WHEN smart_code IS NULL THEN 'MISSING_SMART_CODE'
      WHEN smart_code !~ (SELECT pattern FROM smart_code_pattern) THEN 'INVALID_PATTERN'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'MISSING_VERSION'
      WHEN smart_code !~ '^HERA\.' THEN 'MISSING_HERA_PREFIX'
      WHEN LENGTH(smart_code) > 200 THEN 'TOO_LONG'
      WHEN LENGTH(smart_code) < 20 THEN 'TOO_SHORT'
      ELSE 'VALID'
    END AS validation_status,
    CASE 
      WHEN smart_code IS NULL THEN 'Add smart_code field with HERA.{MODULE}.{LINE_TYPE}.LINE.v1 pattern'
      WHEN smart_code !~ '^HERA\.' THEN 'Prefix smart_code with HERA.'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'Add version suffix like .v1'
      WHEN smart_code ~ '[a-z]' AND smart_code !~ '\.v[0-9]+$' THEN 'Convert segments to UPPERCASE (except version)'
      WHEN smart_code !~ '\.LINE\.' THEN 'Add .LINE. segment for transaction lines'
      ELSE 'Smart code is valid'
    END AS fix_recommendation
  FROM universal_transaction_lines
  WHERE created_at > NOW() - INTERVAL '30 days' OR smart_code IS NULL OR smart_code !~ (SELECT pattern FROM smart_code_pattern)
),

relationships_analysis AS (
  SELECT 
    'core_relationships' AS table_name,
    id,
    relationship_type,
    source_entity_id,
    target_entity_id,
    smart_code,
    organization_id,
    created_at,
    created_by,
    CASE 
      WHEN smart_code IS NULL THEN 'MISSING_SMART_CODE'
      WHEN smart_code !~ (SELECT pattern FROM smart_code_pattern) THEN 'INVALID_PATTERN'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'MISSING_VERSION'
      WHEN smart_code !~ '^HERA\.' THEN 'MISSING_HERA_PREFIX'
      WHEN LENGTH(smart_code) > 200 THEN 'TOO_LONG'
      WHEN LENGTH(smart_code) < 20 THEN 'TOO_SHORT'
      ELSE 'VALID'
    END AS validation_status,
    CASE 
      WHEN smart_code IS NULL THEN 'Add smart_code field with HERA.{MODULE}.REL.{TYPE}.v1 pattern'
      WHEN smart_code !~ '^HERA\.' THEN 'Prefix smart_code with HERA.'
      WHEN smart_code !~ '\.v[0-9]+$' THEN 'Add version suffix like .v1'
      WHEN smart_code ~ '[a-z]' AND smart_code !~ '\.v[0-9]+$' THEN 'Convert segments to UPPERCASE (except version)'
      WHEN smart_code !~ '\.REL\.' THEN 'Add .REL. segment for relationships'
      ELSE 'Smart code is valid'
    END AS fix_recommendation
  FROM core_relationships
  WHERE created_at > NOW() - INTERVAL '30 days' OR smart_code IS NULL OR smart_code !~ (SELECT pattern FROM smart_code_pattern)
),

all_violations AS (
  SELECT table_name, id, smart_code, validation_status, fix_recommendation, organization_id, created_at, created_by,
         entity_type AS type_field, entity_name AS name_field FROM entities_analysis WHERE validation_status != 'VALID'
  UNION ALL
  SELECT table_name, id, smart_code, validation_status, fix_recommendation, organization_id, created_at, created_by,
         transaction_type AS type_field, transaction_number AS name_field FROM transactions_analysis WHERE validation_status != 'VALID'
  UNION ALL
  SELECT table_name, id, smart_code, validation_status, fix_recommendation, organization_id, created_at, created_by,
         line_type AS type_field, line_number::text AS name_field FROM transaction_lines_analysis WHERE validation_status != 'VALID'
  UNION ALL
  SELECT table_name, id, smart_code, validation_status, fix_recommendation, organization_id, created_at, created_by,
         relationship_type AS type_field, (source_entity_id || '->' || target_entity_id) AS name_field FROM relationships_analysis WHERE validation_status != 'VALID'
),

pattern_analysis AS (
  SELECT 
    validation_status,
    COUNT(*) AS violation_count,
    ARRAY_AGG(DISTINCT table_name) AS affected_tables,
    ARRAY_AGG(DISTINCT type_field) AS affected_types,
    COUNT(DISTINCT organization_id) AS affected_orgs,
    ARRAY_AGG(DISTINCT fix_recommendation) AS fix_strategies,
    MIN(created_at) AS earliest_violation,
    MAX(created_at) AS latest_violation
  FROM all_violations
  GROUP BY validation_status
),

learning_patterns AS (
  SELECT 
    validation_status,
    CASE validation_status
      WHEN 'MISSING_SMART_CODE' THEN 'pattern_no_smart_code'
      WHEN 'INVALID_PATTERN' THEN 'pattern_malformed_smart_code'
      WHEN 'MISSING_VERSION' THEN 'pattern_no_version_suffix'
      WHEN 'MISSING_HERA_PREFIX' THEN 'pattern_wrong_prefix'
      WHEN 'TOO_LONG' THEN 'pattern_excessive_length'
      WHEN 'TOO_SHORT' THEN 'pattern_insufficient_segments'
      ELSE 'pattern_unknown_violation'
    END AS learning_pattern,
    CASE validation_status
      WHEN 'MISSING_SMART_CODE' THEN 'Generate smart codes for entities/transactions using HERA DNA pattern'
      WHEN 'INVALID_PATTERN' THEN 'Fix malformed smart codes to match HERA regex pattern'
      WHEN 'MISSING_VERSION' THEN 'Add .v1 suffix to all smart codes'
      WHEN 'MISSING_HERA_PREFIX' THEN 'Prefix all smart codes with HERA.'
      WHEN 'TOO_LONG' THEN 'Shorten smart codes to under 200 characters'
      WHEN 'TOO_SHORT' THEN 'Add required segments to meet minimum length'
      ELSE 'Investigate smart code pattern violation'
    END AS auto_fix_strategy,
    violation_count,
    affected_tables,
    affected_types
  FROM pattern_analysis
),

example_fixes AS (
  SELECT 
    validation_status,
    smart_code AS original_code,
    CASE validation_status
      WHEN 'MISSING_SMART_CODE' THEN 
        CASE 
          WHEN table_name = 'core_entities' THEN 'HERA.' || UPPER(COALESCE(type_field, 'ENTITY')) || '.ENTITY.STANDARD.v1'
          WHEN table_name = 'universal_transactions' THEN 'HERA.' || UPPER(COALESCE(type_field, 'TXN')) || '.TXN.STANDARD.v1'
          WHEN table_name = 'universal_transaction_lines' THEN 'HERA.' || UPPER(COALESCE(type_field, 'LINE')) || '.LINE.STANDARD.v1'
          WHEN table_name = 'core_relationships' THEN 'HERA.' || UPPER(COALESCE(type_field, 'REL')) || '.REL.STANDARD.v1'
          ELSE 'HERA.UNKNOWN.ENTITY.STANDARD.v1'
        END
      WHEN 'MISSING_HERA_PREFIX' THEN 'HERA.' || smart_code
      WHEN 'MISSING_VERSION' THEN smart_code || '.v1'
      WHEN 'INVALID_PATTERN' THEN REGEXP_REPLACE(UPPER(smart_code), '[^A-Z0-9._]', '_', 'g') || '.v1'
      ELSE smart_code
    END AS suggested_fix,
    table_name,
    type_field,
    id
  FROM all_violations
  WHERE validation_status IN ('MISSING_SMART_CODE', 'MISSING_HERA_PREFIX', 'MISSING_VERSION', 'INVALID_PATTERN')
  LIMIT 20
)

-- Main output for autopilot learning
SELECT 
  'HERA_SMART_CODE_ANALYSIS' AS analysis_type,
  NOW() AS analysis_timestamp,
  jsonb_build_object(
    'summary', jsonb_build_object(
      'total_violations', (SELECT COUNT(*) FROM all_violations),
      'violation_types', (SELECT COUNT(DISTINCT validation_status) FROM all_violations),
      'affected_tables', (SELECT COUNT(DISTINCT table_name) FROM all_violations),
      'affected_organizations', (SELECT COUNT(DISTINCT organization_id) FROM all_violations),
      'recent_violations', (SELECT COUNT(*) FROM all_violations WHERE created_at > NOW() - INTERVAL '24 hours'),
      'overall_health', CASE 
        WHEN (SELECT COUNT(*) FROM all_violations WHERE validation_status = 'MISSING_SMART_CODE') > 0 THEN 'CRITICAL'
        WHEN (SELECT COUNT(*) FROM all_violations) > 10 THEN 'WARNING'
        WHEN (SELECT COUNT(*) FROM all_violations) > 0 THEN 'MINOR_ISSUES'
        ELSE 'HEALTHY'
      END
    ),
    'violations_by_pattern', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'validation_status', validation_status,
          'violation_count', violation_count,
          'affected_tables', affected_tables,
          'affected_types', affected_types,
          'affected_orgs', affected_orgs,
          'earliest_violation', earliest_violation,
          'latest_violation', latest_violation
        )
      ) FROM pattern_analysis
    ),
    'learning_patterns', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'pattern', learning_pattern,
          'auto_fix_strategy', auto_fix_strategy,
          'violation_count', violation_count,
          'affected_tables', affected_tables
        )
      ) FROM learning_patterns
    ),
    'example_fixes', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table_name', table_name,
          'record_id', id,
          'validation_status', validation_status,
          'original_code', original_code,
          'suggested_fix', suggested_fix,
          'type_field', type_field
        )
      ) FROM example_fixes
    )
  ) AS analysis_data,
  
  -- Claude Autopilot Learning Data
  jsonb_build_object(
    'session_type', 'smart_code_validation',
    'patterns_detected', (SELECT COUNT(DISTINCT learning_pattern) FROM learning_patterns),
    'auto_fix_strategies', (
      SELECT jsonb_agg(DISTINCT auto_fix_strategy) FROM learning_patterns
    ),
    'success_criteria', jsonb_build_object(
      'max_violations', 0,
      'required_pattern', '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$',
      'all_tables_compliant', true
    ),
    'current_status', jsonb_build_object(
      'has_violations', (SELECT COUNT(*) FROM all_violations) > 0,
      'critical_violations', (SELECT COUNT(*) FROM all_violations WHERE validation_status = 'MISSING_SMART_CODE'),
      'total_violations', (SELECT COUNT(*) FROM all_violations),
      'overall_pass', (SELECT COUNT(*) FROM all_violations) = 0
    )
  ) AS learning_data;

-- Actionable violations for immediate fixing
SELECT 
  'HERA_SMART_CODE_VIOLATIONS' AS violation_type,
  table_name,
  id,
  type_field,
  name_field,
  smart_code,
  validation_status,
  fix_recommendation,
  organization_id,
  created_at,
  CASE validation_status
    WHEN 'MISSING_SMART_CODE' THEN 'HIGH_PRIORITY_AUTO_FIX'
    WHEN 'INVALID_PATTERN' THEN 'MEDIUM_PRIORITY_AUTO_FIX'
    WHEN 'MISSING_VERSION' THEN 'LOW_PRIORITY_AUTO_FIX'
    ELSE 'MANUAL_REVIEW_NEEDED'
  END AS fix_priority
FROM all_violations
ORDER BY 
  CASE validation_status 
    WHEN 'MISSING_SMART_CODE' THEN 1
    WHEN 'INVALID_PATTERN' THEN 2
    WHEN 'MISSING_VERSION' THEN 3
    WHEN 'MISSING_HERA_PREFIX' THEN 4
    ELSE 5
  END,
  created_at DESC;

-- Learning outcome: Exit with appropriate code for CI/CD
DO $$
DECLARE
  total_violations INTEGER;
  critical_violations INTEGER;
  recent_violations INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_violations FROM (
    SELECT 1 FROM core_entities WHERE smart_code IS NULL OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
    UNION ALL
    SELECT 1 FROM universal_transactions WHERE smart_code IS NULL OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
    UNION ALL
    SELECT 1 FROM universal_transaction_lines WHERE smart_code IS NULL OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
    UNION ALL
    SELECT 1 FROM core_relationships WHERE smart_code IS NULL OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  ) violations;
  
  SELECT COUNT(*) INTO critical_violations FROM (
    SELECT 1 FROM core_entities WHERE smart_code IS NULL
    UNION ALL
    SELECT 1 FROM universal_transactions WHERE smart_code IS NULL
  ) critical;
  
  SELECT COUNT(*) INTO recent_violations FROM (
    SELECT 1 FROM core_entities WHERE created_at > NOW() - INTERVAL '24 hours' AND (smart_code IS NULL OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$')
    UNION ALL
    SELECT 1 FROM universal_transactions WHERE created_at > NOW() - INTERVAL '24 hours' AND (smart_code IS NULL OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$')
  ) recent;
  
  -- Log results for learning
  RAISE NOTICE 'HERA_SMART_CODE_CHECK: % total violations, % critical (missing), % recent violations', 
    total_violations, critical_violations, recent_violations;
  
  IF critical_violations > 0 THEN
    RAISE EXCEPTION 'CRITICAL: Smart code violations detected. % entities/transactions missing smart codes entirely.', critical_violations;
  ELSIF recent_violations > 5 THEN
    RAISE WARNING 'WARNING: High rate of smart code violations. % violations in last 24 hours.', recent_violations;
  ELSIF total_violations > 0 THEN
    RAISE WARNING 'WARNING: Smart code pattern violations detected. % total violations found.', total_violations;
  ELSE
    RAISE NOTICE 'SUCCESS: Smart code validation passed. All entities follow HERA DNA patterns.';
  END IF;
END $$;