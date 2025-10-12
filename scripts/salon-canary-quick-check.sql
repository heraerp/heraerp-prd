-- SALON CANARY QUICK CHECK
-- Run this every 15 minutes during first hour

-- SUMMARY DASHBOARD
WITH metrics AS (
    SELECT 
        COUNT(*) as total_reprices,
        COUNT(*) FILTER (WHERE metadata->>'success' = 'true') as successful,
        COUNT(*) FILTER (WHERE metadata->>'success' = 'false') as failed,
        AVG((metadata->>'execution_time_ms')::int) as avg_latency_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) as p95_latency_ms,
        MAX((metadata->>'execution_time_ms')::int) as max_latency_ms
    FROM universal_transactions 
    WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
        AND smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
        AND created_at >= NOW() - INTERVAL '1 hour'
),
correlation AS (
    SELECT 
        COUNT(*) FILTER (WHERE metadata->>'correlation_id' IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as coverage_percent
    FROM universal_transactions
    WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
        AND smart_code LIKE 'HERA.SALON.%'
        AND created_at >= NOW() - INTERVAL '1 hour'
),
isolation AS (
    SELECT COUNT(*) as cross_org_leaks
    FROM universal_transactions
    WHERE smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
        AND created_at >= NOW() - INTERVAL '1 hour'
        AND organization_id != '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
)
SELECT 
    '🎯 CANARY STATUS' as metric,
    CASE 
        WHEN m.p95_latency_ms <= 200 THEN '✅'
        ELSE '❌'
    END || ' P95 Latency: ' || COALESCE(m.p95_latency_ms::text, '0') || 'ms (target ≤200ms)' as status
FROM metrics m
UNION ALL
SELECT 
    '',
    CASE 
        WHEN m.failed = 0 OR (m.failed::float / NULLIF(m.total_reprices, 0) * 100) < 0.1 THEN '✅'
        ELSE '❌'
    END || ' Error Rate: ' || 
    COALESCE(ROUND(m.failed::float / NULLIF(m.total_reprices, 0) * 100, 2)::text, '0') || 
    '% (target <0.1%)' as status
FROM metrics m
UNION ALL
SELECT 
    '',
    CASE 
        WHEN c.coverage_percent >= 95 THEN '✅'
        ELSE '❌'
    END || ' Correlation Coverage: ' || ROUND(c.coverage_percent, 1) || '% (target ≥95%)' as status
FROM correlation c
UNION ALL
SELECT 
    '',
    CASE 
        WHEN i.cross_org_leaks = 0 THEN '✅'
        ELSE '❌'
    END || ' Cross-Org Isolation: ' || i.cross_org_leaks || ' leaks (target 0)' as status
FROM isolation i
UNION ALL
SELECT 
    '',
    '📊 Total Reprices: ' || m.total_reprices || ' | Success: ' || m.successful || ' | Failed: ' || m.failed
FROM metrics m
UNION ALL
SELECT 
    '',
    '⏱️  Avg Latency: ' || ROUND(m.avg_latency_ms, 0) || 'ms | Max: ' || m.max_latency_ms || 'ms'
FROM metrics m;

-- SMART CODE VERIFICATION
SELECT 
    '📋 SMART CODES' as section,
    smart_code,
    COUNT(*) as usage_count,
    CASE 
        WHEN smart_code LIKE '%.V1' THEN '✅ Correct'
        WHEN smart_code LIKE '%.V1' THEN '❌ Lowercase v'
        ELSE '⚠️  Check format'
    END as format_status
FROM universal_transactions
WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
    AND smart_code LIKE 'HERA.SALON.%'
    AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY smart_code
ORDER BY usage_count DESC;