-- HERA Integration Runtime - Setup Verification Script
-- Smart Code: HERA.PLATFORM.INTEGRATION.VERIFICATION.SQL.v1
--
-- This script verifies that the HERA Integration Runtime has been properly deployed
-- Run this after completing the deployment to ensure everything is working correctly

\echo '🔍 HERA Integration Runtime Setup Verification'
\echo '=============================================='

-- Check 1: Verify RPC functions are installed
\echo ''
\echo '📋 Checking Integration RPC Functions...'

SELECT 
  routine_name as function_name,
  routine_type as type,
  CASE 
    WHEN routine_name IN (
      'hera_integration_event_in_v1',
      'hera_integration_connector_v1',
      'hera_webhook_config_v1',
      'hera_webhook_get_by_topic_v1',
      'hera_webhook_delivery_log_v1',
      'hera_outbox_get_pending_v1',
      'hera_outbox_update_status_v1',
      'hera_outbox_schedule_retry_v1',
      'hera_integration_setup_relationships_v1'
    ) THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.routines 
WHERE routine_name LIKE 'hera_%integration%' 
   OR routine_name LIKE 'hera_%outbox%' 
   OR routine_name LIKE 'hera_%webhook%'
ORDER BY routine_name;

-- Check 2: Verify relationship types are created
\echo ''
\echo '🔗 Checking Integration Relationship Types...'

SELECT 
  entity_code as relationship_type,
  entity_name as description,
  created_at,
  '✅' as status
FROM core_entities
WHERE entity_type = 'RELATIONSHIP_TYPE'
  AND entity_code IN (
    'CONNECTOR_INSTALLED_BY',
    'CONNECTOR_BASED_ON', 
    'EVENT_PROCESSED_BY',
    'WEBHOOK_BELONGS_TO',
    'CONNECTOR_SUPPORTS',
    'ORG_AUTHORIZED_FOR',
    'WEBHOOK_DELIVERS_TO',
    'EVENT_TRIGGERS',
    'CONNECTOR_DEPENDS_ON',
    'INTEGRATION_MANAGES'
  )
ORDER BY entity_code;

-- Check 3: Verify pre-built connector definitions
\echo ''
\echo '🔌 Checking Pre-Built Connector Definitions...'

SELECT 
  entity_code as connector_code,
  entity_name as connector_name,
  (SELECT jsonb_extract_path_text(field_value_json, 'category') 
   FROM core_dynamic_data d 
   WHERE d.entity_id = e.id AND d.field_name = 'connector_config') as category,
  (SELECT jsonb_extract_path_text(field_value_json, 'auth_type')
   FROM core_dynamic_data d
   WHERE d.entity_id = e.id
   AND d.field_name = 'connector_config') as auth_type,
  (SELECT jsonb_array_length(jsonb_extract_path(field_value_json, 'supported_events'))
   FROM core_dynamic_data d
   WHERE d.entity_id = e.id
   AND d.field_name = 'connector_config') as events_count,
  created_at,
  '✅' as status
FROM core_entities e
WHERE e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ORDER BY e.entity_code;

-- Check 4: Test integration event processing function
\echo ''
\echo '🧪 Testing Integration Event Processing...'

DO $$
DECLARE
  test_result JSONB;
  test_actor_id UUID := '00000000-0000-0000-0000-000000000001';
  test_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Test event processing
  SELECT hera_integration_event_in_v1(
    test_actor_id,
    test_org_id,
    'test-verification',
    'verification_test',
    '{"test": "verification", "timestamp": "' || NOW() || '"}'::jsonb,
    'test-connector',
    'verify-' || EXTRACT(epoch FROM NOW())::text,
    'HERA.TEST.VERIFICATION.EVENT.v1',
    '{"test_mode": true}'::jsonb
  ) INTO test_result;
  
  IF (test_result ->> 'success')::boolean THEN
    RAISE NOTICE '✅ Integration event processing test: PASSED';
    RAISE NOTICE '   Event ID: %', test_result ->> 'event_id';
    RAISE NOTICE '   Smart Code: %', test_result ->> 'smart_code';
  ELSE
    RAISE NOTICE '❌ Integration event processing test: FAILED';
    RAISE NOTICE '   Error: %', test_result ->> 'message';
  END IF;
END $$;

-- Check 5: Test connector management function
\echo ''
\echo '🔧 Testing Connector Management...'

DO $$
DECLARE
  test_result JSONB;
  test_actor_id UUID := '00000000-0000-0000-0000-000000000001';
  test_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Test connector listing
  SELECT hera_integration_connector_v1(
    test_actor_id,
    test_org_id,
    'LIST',
    'INTEGRATION_CONNECTOR_DEF',
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  ) INTO test_result;
  
  IF (test_result ->> 'success')::boolean THEN
    RAISE NOTICE '✅ Connector management test: PASSED';
    RAISE NOTICE '   Available connectors: %', jsonb_array_length(test_result -> 'connectors');
  ELSE
    RAISE NOTICE '❌ Connector management test: FAILED';
    RAISE NOTICE '   Error: %', test_result;
  END IF;
END $$;

-- Check 6: Verify webhook configuration function
\echo ''
\echo '📡 Testing Webhook Configuration...'

DO $$
DECLARE
  test_result JSONB;
  test_actor_id UUID := '00000000-0000-0000-0000-000000000001';
  test_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Test webhook listing
  SELECT hera_webhook_config_v1(
    test_actor_id,
    test_org_id,
    'LIST',
    '{}'::jsonb,
    null,
    null
  ) INTO test_result;
  
  IF (test_result ->> 'success')::boolean THEN
    RAISE NOTICE '✅ Webhook configuration test: PASSED';
    RAISE NOTICE '   Configured webhooks: %', jsonb_array_length(test_result -> 'webhooks');
  ELSE
    RAISE NOTICE '❌ Webhook configuration test: FAILED';
    RAISE NOTICE '   Error: %', test_result;
  END IF;
END $$;

-- Check 7: Database performance and indexes
\echo ''
\echo '⚡ Checking Database Performance...'

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('core_entities', 'core_dynamic_data', 'core_relationships')
  AND (indexdef LIKE '%organization_id%' OR indexdef LIKE '%entity_type%' OR indexdef LIKE '%gin%')
ORDER BY tablename, indexname;

-- Check 8: Summary report
\echo ''
\echo '📊 Integration Runtime Setup Summary'
\echo '===================================='

WITH function_count AS (
  SELECT count(*) as total FROM information_schema.routines 
  WHERE routine_name LIKE 'hera_%integration%' 
     OR routine_name LIKE 'hera_%outbox%' 
     OR routine_name LIKE 'hera_%webhook%'
),
relationship_count AS (
  SELECT count(*) as total FROM core_entities
  WHERE entity_type = 'RELATIONSHIP_TYPE'
    AND entity_code LIKE '%CONNECTOR%' OR entity_code LIKE '%WEBHOOK%'
),
connector_count AS (
  SELECT count(*) as total FROM core_entities
  WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND organization_id = '00000000-0000-0000-0000-000000000000'
)
SELECT 
  '🔧 RPC Functions' as component,
  f.total as count,
  CASE WHEN f.total >= 8 THEN '✅ Complete' ELSE '⚠️ Incomplete' END as status
FROM function_count f
UNION ALL
SELECT 
  '🔗 Relationship Types' as component,
  r.total as count,
  CASE WHEN r.total >= 10 THEN '✅ Complete' ELSE '⚠️ Incomplete' END as status
FROM relationship_count r
UNION ALL
SELECT 
  '🔌 Connector Definitions' as component,
  c.total as count,
  CASE WHEN c.total >= 5 THEN '✅ Complete' ELSE '⚠️ Incomplete' END as status
FROM connector_count c;

-- Final status message
\echo ''
DO $$
DECLARE
  function_count INTEGER;
  connector_count INTEGER;
  relationship_count INTEGER;
  overall_status TEXT;
BEGIN
  -- Get counts
  SELECT count(*) INTO function_count FROM information_schema.routines 
  WHERE routine_name LIKE 'hera_%integration%' 
     OR routine_name LIKE 'hera_%outbox%' 
     OR routine_name LIKE 'hera_%webhook%';
  
  SELECT count(*) INTO connector_count FROM core_entities
  WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND organization_id = '00000000-0000-0000-0000-000000000000';
  
  SELECT count(*) INTO relationship_count FROM core_entities
  WHERE entity_type = 'RELATIONSHIP_TYPE'
    AND (entity_code LIKE '%CONNECTOR%' OR entity_code LIKE '%WEBHOOK%');
  
  -- Determine overall status
  IF function_count >= 8 AND connector_count >= 5 AND relationship_count >= 10 THEN
    overall_status := '🎉 HERA Integration Runtime Setup: COMPLETE & READY';
  ELSE
    overall_status := '⚠️ HERA Integration Runtime Setup: INCOMPLETE - Review issues above';
  END IF;
  
  RAISE NOTICE '%', overall_status;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Deploy Edge Functions (api-v2, outbox-worker)';
  RAISE NOTICE '2. Test health endpoints: /api-v2/health, /outbox-worker/health';
  RAISE NOTICE '3. Access Integration Control Center: /platform/integrations/control-center';
  RAISE NOTICE '4. Access Integration Hub: /settings/integrations';
  RAISE NOTICE '5. Install connectors for WhatsApp, LinkedIn, Meta, Zapier, HubSpot';
END $$;

\echo '=============================================='
\echo '✨ HERA Integration Runtime Verification Complete'