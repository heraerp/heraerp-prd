-- SALON CANARY VERIFICATION QUERIES
-- Run these during the first hour to verify everything is working

-- 1. CHECK PLAYBOOK EXECUTIONS (should see HERA.SALON.POS.CART.REPRICE.V1)
SELECT 
    COUNT(*) as total_reprices,
    COUNT(*) FILTER (WHERE metadata->>'success' = 'true') as successful,
    COUNT(*) FILTER (WHERE metadata->>'success' = 'false') as failed,
    AVG((metadata->>'execution_time_ms')::int) as avg_latency_ms,
    MAX((metadata->>'execution_time_ms')::int) as max_latency_ms
FROM universal_transactions 
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
    AND created_at >= NOW() - INTERVAL '1 hour';

-- 2. VERIFY CORRELATION IDS ARE FLOWING
SELECT 
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE metadata->>'correlation_id' IS NOT NULL) as with_correlation,
    (COUNT(*) FILTER (WHERE metadata->>'correlation_id' IS NOT NULL) * 100.0 / COUNT(*)) as correlation_coverage_percent
FROM universal_transactions
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND smart_code LIKE 'HERA.SALON.%'
    AND created_at >= NOW() - INTERVAL '1 hour';

-- 3. CHECK FOR CROSS-ORG ISOLATION (should return 0)
SELECT 
    organization_id,
    COUNT(*) as leaked_records
FROM universal_transactions
WHERE smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
    AND created_at >= NOW() - INTERVAL '1 hour'
    AND organization_id != 'hair-talkz-salon-org-uuid'
GROUP BY organization_id;

-- 4. VERIFY SMART CODES ARE NORMALIZED (.V1 not .V1)
SELECT 
    smart_code,
    COUNT(*) as usage_count
FROM universal_transactions
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND smart_code LIKE 'HERA.SALON.%'
    AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY smart_code
ORDER BY usage_count DESC;

-- 5. CHECK IDEMPOTENCY IS WORKING
SELECT 
    metadata->>'idempotency_key' as idempotency_key,
    COUNT(*) as execution_count
FROM universal_transactions
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
    AND metadata->>'idempotency_key' IS NOT NULL
    AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY metadata->>'idempotency_key'
HAVING COUNT(*) > 1;

-- 6. CHECK AUDIT TRAIL
SELECT 
    smart_code,
    metadata->>'feature' as feature_flag,
    metadata->>'enabled' as enabled,
    metadata->>'reason' as reason,
    created_at
FROM universal_transactions
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND smart_code = 'HERA.AUDIT.FEATURE_FLAG.CHANGE.V1'
    AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 7. MONITOR ERROR PATTERNS (if any)
SELECT 
    metadata->>'error_code' as error_code,
    metadata->>'error_message' as error_message,
    COUNT(*) as error_count
FROM universal_transactions
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
    AND metadata->>'success' = 'false'
    AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY metadata->>'error_code', metadata->>'error_message';

-- 8. CHECK PLAYBOOK MODE HEADER
SELECT 
    COUNT(*) FILTER (WHERE metadata->>'playbook_mode' = 'true') as playbook_requests,
    COUNT(*) FILTER (WHERE metadata->>'playbook_mode' = 'false' OR metadata->>'playbook_mode' IS NULL) as legacy_requests
FROM universal_transactions
WHERE organization_id = 'hair-talkz-salon-org-uuid'
    AND transaction_type = 'cart'
    AND created_at >= NOW() - INTERVAL '1 hour';