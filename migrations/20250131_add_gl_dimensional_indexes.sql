-- ============================================================================
-- HERA GL Posting Engine v2.0 - Dimensional Query Performance Indexes
-- ============================================================================
-- Smart Code: HERA.FINANCE.MIGRATION.GL_DIMENSIONAL_INDEXES.v1
-- Created: 2025-01-31
-- Purpose: Optimize dimensional queries on enhanced GL line_data JSONB fields
--
-- PRODUCTION DEPLOYMENT NOTES:
-- - Uses CONCURRENTLY to avoid blocking production writes
-- - Safe to run on live system (zero downtime)
-- - Each index creation may take 1-5 minutes depending on data volume
-- - Monitor disk space: each GIN index ~10-30% of table size
-- - Rollback script provided at end of file
-- ============================================================================

-- ============================================================================
-- PHASE 1: Transaction Lines Dimensional Indexes
-- ============================================================================

-- Index 1: Revenue Type Dimension (service vs product)
-- Enables: Fast filtering by revenue category
-- Query Pattern: WHERE line_data->>'revenue_type' = 'service'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_utl_line_data_revenue_type
  ON universal_transaction_lines
  USING GIN ((line_data -> 'revenue_type'));

COMMENT ON INDEX idx_utl_line_data_revenue_type IS
  'GL v2.0: Dimensional index for service vs product revenue filtering';

-- Index 2: Staff Dimension (tip allocation, service attribution)
-- Enables: Fast filtering by staff member
-- Query Pattern: WHERE line_data->>'staff_id' = 'uuid'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_utl_line_data_staff_id
  ON universal_transaction_lines
  USING GIN ((line_data -> 'staff_id'));

COMMENT ON INDEX idx_utl_line_data_staff_id IS
  'GL v2.0: Dimensional index for staff-based revenue and tip queries';

-- Index 3: Payment Method Dimension (cash, card, bank_transfer)
-- Enables: Fast filtering by payment method
-- Query Pattern: WHERE line_data->>'payment_method' = 'card'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_utl_line_data_payment_method
  ON universal_transaction_lines
  USING GIN ((line_data -> 'payment_method'));

COMMENT ON INDEX idx_utl_line_data_payment_method IS
  'GL v2.0: Dimensional index for payment method analysis';

-- Index 4: Branch/Location Dimension (multi-location reporting)
-- Enables: Fast filtering by branch
-- Query Pattern: WHERE line_data->>'branch_id' = 'uuid'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_utl_line_data_branch_id
  ON universal_transaction_lines
  USING GIN ((line_data -> 'branch_id'));

COMMENT ON INDEX idx_utl_line_data_branch_id IS
  'GL v2.0: Dimensional index for multi-branch revenue analysis';

-- Index 5: Customer Dimension (customer revenue analysis)
-- Enables: Fast filtering by customer
-- Query Pattern: WHERE line_data->>'customer_id' = 'uuid'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_utl_line_data_customer_id
  ON universal_transaction_lines
  USING GIN ((line_data -> 'customer_id'));

COMMENT ON INDEX idx_utl_line_data_customer_id IS
  'GL v2.0: Dimensional index for customer-based revenue queries';

-- ============================================================================
-- PHASE 2: Transaction Header Metadata Indexes
-- ============================================================================

-- Index 6: GL Engine Version (for backward compatibility queries)
-- Enables: Fast filtering by posting engine version
-- Query Pattern: WHERE metadata->>'gl_engine_version' = 'v2.0.0'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ut_metadata_gl_engine_version
  ON universal_transactions
  USING GIN ((metadata -> 'gl_engine_version'))
  WHERE transaction_type = 'GL_JOURNAL';

COMMENT ON INDEX idx_ut_metadata_gl_engine_version IS
  'GL v2.0: Filter GL entries by posting engine version for migration tracking';

-- Index 7: Origin Transaction Reference (traceability)
-- Enables: Fast lookup of GL entries from SALE transactions
-- Query Pattern: WHERE metadata->>'origin_transaction_id' = 'uuid'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ut_metadata_origin_transaction_id
  ON universal_transactions
  USING GIN ((metadata -> 'origin_transaction_id'))
  WHERE transaction_type = 'GL_JOURNAL';

COMMENT ON INDEX idx_ut_metadata_origin_transaction_id IS
  'GL v2.0: Fast traceability from SALE to GL_JOURNAL entries';

-- ============================================================================
-- PHASE 3: Performance Monitoring Indexes
-- ============================================================================

-- Index 8: Composite index for common dashboard queries
-- Enables: Fast "today's revenue by type" queries
-- Query Pattern: WHERE organization_id = X AND transaction_date >= today AND transaction_type = 'GL_JOURNAL'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ut_gl_dashboard_queries
  ON universal_transactions (organization_id, transaction_date DESC)
  WHERE transaction_type = 'GL_JOURNAL'
    AND transaction_status = 'posted';

COMMENT ON INDEX idx_ut_gl_dashboard_queries IS
  'GL v2.0: Optimized composite index for real-time dashboard revenue queries';

-- Index 9: Transaction lines by account code (GL reporting)
-- Enables: Fast Chart of Accounts queries
-- Query Pattern: WHERE line_data->>'gl_account_code' = '410000'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_utl_line_data_gl_account_code
  ON universal_transaction_lines
  USING GIN ((line_data -> 'gl_account_code'));

COMMENT ON INDEX idx_utl_line_data_gl_account_code IS
  'GL v2.0: Fast filtering by GL account code for Trial Balance and P&L reports';

-- ============================================================================
-- PHASE 4: Verification Queries
-- ============================================================================

-- Query 1: Verify revenue type index is working
-- Expected: Fast execution with Index Scan on idx_utl_line_data_revenue_type
DO $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT query_plan INTO v_plan
  FROM (
    EXPLAIN (FORMAT TEXT)
    SELECT COUNT(*)
    FROM universal_transaction_lines
    WHERE line_data->>'revenue_type' = 'service'
  ) AS query_plan;

  IF v_plan LIKE '%idx_utl_line_data_revenue_type%' THEN
    RAISE NOTICE '✅ Revenue type index verified and in use';
  ELSE
    RAISE WARNING '⚠️ Revenue type index may not be in use - check query planner';
  END IF;
END $$;

-- Query 2: Verify staff dimension index is working
-- Expected: Fast execution with Index Scan on idx_utl_line_data_staff_id
DO $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT query_plan INTO v_plan
  FROM (
    EXPLAIN (FORMAT TEXT)
    SELECT COUNT(*)
    FROM universal_transaction_lines
    WHERE line_data ? 'staff_id'
  ) AS query_plan;

  IF v_plan LIKE '%idx_utl_line_data_staff_id%' THEN
    RAISE NOTICE '✅ Staff dimension index verified and in use';
  ELSE
    RAISE WARNING '⚠️ Staff dimension index may not be in use - check query planner';
  END IF;
END $$;

-- ============================================================================
-- PHASE 5: Index Statistics and Monitoring
-- ============================================================================

-- Create view for index health monitoring
CREATE OR REPLACE VIEW v_gl_index_health AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  pg_size_pretty(pg_relation_size(tablename::regclass)) AS table_size,
  ROUND(100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0), 2) AS index_usage_percent
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_utl_line_data_%'
   OR indexname LIKE 'idx_ut_metadata_%'
   OR indexname = 'idx_ut_gl_dashboard_queries'
ORDER BY index_scans DESC;

COMMENT ON VIEW v_gl_index_health IS
  'GL v2.0: Monitor index usage and performance for dimensional queries';

-- ============================================================================
-- DEPLOYMENT VERIFICATION CHECKLIST
-- ============================================================================

-- Run this query to verify all indexes were created successfully:
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE indexname IN (
  'idx_utl_line_data_revenue_type',
  'idx_utl_line_data_staff_id',
  'idx_utl_line_data_payment_method',
  'idx_utl_line_data_branch_id',
  'idx_utl_line_data_customer_id',
  'idx_ut_metadata_gl_engine_version',
  'idx_ut_metadata_origin_transaction_id',
  'idx_ut_gl_dashboard_queries',
  'idx_utl_line_data_gl_account_code'
)
ORDER BY tablename, indexname;

-- Expected output: 9 indexes listed with their sizes
-- If any are missing, review logs for CONCURRENTLY errors

-- ============================================================================
-- PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Test 1: Revenue by type (service vs product) - should use idx_utl_line_data_revenue_type
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  line_data->>'revenue_type' AS revenue_type,
  COUNT(*) AS line_count,
  SUM((line_data->>'amount')::numeric) AS total_amount
FROM universal_transaction_lines
WHERE line_data->>'revenue_type' IN ('service', 'product')
GROUP BY line_data->>'revenue_type';

-- Test 2: Staff commission report - should use idx_utl_line_data_staff_id
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  line_data->>'staff_id' AS staff_id,
  line_data->>'staff_name' AS staff_name,
  COUNT(*) AS service_count,
  SUM((line_data->>'amount')::numeric) AS total_revenue,
  SUM((line_data->>'tip_amount')::numeric) AS total_tips
FROM universal_transaction_lines
WHERE line_data ? 'staff_id'
  AND line_data->>'revenue_type' = 'service'
GROUP BY line_data->>'staff_id', line_data->>'staff_name';

-- Test 3: Payment method analysis - should use idx_utl_line_data_payment_method
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  line_data->>'payment_method' AS payment_method,
  COUNT(DISTINCT transaction_id) AS transaction_count,
  SUM((line_data->>'amount')::numeric) AS total_amount
FROM universal_transaction_lines
WHERE line_data ? 'payment_method'
GROUP BY line_data->>'payment_method';

-- Test 4: Dashboard revenue query - should use idx_ut_gl_dashboard_queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  transaction_date::date AS sale_date,
  COUNT(*) AS journal_entry_count,
  SUM((metadata->>'total_cr')::numeric) AS gross_revenue
FROM universal_transactions
WHERE organization_id = '00000000-0000-0000-0000-000000000001' -- Replace with actual org ID
  AND transaction_type = 'GL_JOURNAL'
  AND transaction_status = 'posted'
  AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY transaction_date::date
ORDER BY transaction_date::date DESC;

-- ============================================================================
-- ROLLBACK SCRIPT (Emergency Use Only)
-- ============================================================================

-- CAUTION: Only run this if indexes cause performance degradation
-- Dropping indexes is safe but will slow down dimensional queries

/*
-- Drop all GL v2.0 dimensional indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_revenue_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_staff_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_payment_method;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_branch_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_customer_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_ut_metadata_gl_engine_version;
DROP INDEX CONCURRENTLY IF EXISTS idx_ut_metadata_origin_transaction_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_ut_gl_dashboard_queries;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_gl_account_code;

-- Drop monitoring view
DROP VIEW IF EXISTS v_gl_index_health;

-- Verify cleanup
SELECT indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_utl_line_data_%'
   OR indexname LIKE 'idx_ut_metadata_%'
   OR indexname = 'idx_ut_gl_dashboard_queries';

-- Expected: No results if rollback successful
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Next Steps:
-- 1. Monitor index usage via v_gl_index_health view
-- 2. Run performance tests to verify query optimization
-- 3. Update application reports to leverage dimensional queries
-- 4. Document index maintenance procedures
-- 5. Schedule VACUUM ANALYZE after initial data load

-- Documentation: /docs/finance/GL_POSTING_ENGINE_V2.md
-- Related Files:
--   - /src/lib/finance/gl-posting-engine.ts
--   - /src/hooks/usePosCheckout.ts
--   - /src/hooks/useSalonSalesReports.ts
