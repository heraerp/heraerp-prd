-- ========================================
-- HERA Transaction Query v1 - Test Suite
-- ========================================
-- Function: public.hera_txn_query_v1(uuid, jsonb)
-- Purpose: Comprehensive testing of transaction query function
-- Created: 2025-01-12
-- ========================================

-- Prerequisites:
-- 1. Replace 'YOUR-ORG-UUID' with actual organization UUID
-- 2. Function must be deployed to database
-- 3. Sample transaction data should exist

\set org_id 'YOUR-ORG-UUID'

\echo ''
\echo '========================================'
\echo 'HERA Transaction Query v1 - Test Suite'
\echo '========================================'
\echo ''

-- ========================================
-- PHASE 1: BASIC FUNCTIONALITY TESTS
-- ========================================

\echo '----------------------------------------'
\echo 'PHASE 1: BASIC FUNCTIONALITY TESTS'
\echo '----------------------------------------'
\echo ''

-- TEST 1: Basic query with defaults
\echo '✓ TEST 1: Basic query with default parameters'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total_count,
  jsonb_array_length(result->'data'->'items') as items_returned
FROM (
  SELECT hera_txn_query_v1(:'org_id'::uuid, '{}'::jsonb) as result
) t;
\echo ''

-- TEST 2: Pagination (limit and offset)
\echo '✓ TEST 2: Pagination with limit=5, offset=0'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'limit')::int as requested_limit,
  jsonb_array_length(result->'data'->'items') as items_returned
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"limit": 5, "offset": 0}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 3: Date range filtering
\echo '✓ TEST 3: Date range filter (last 30 days)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as transactions_last_30_days,
  (result->'data'->'items'->0->>'transaction_date')::date as first_date,
  (result->'data'->'items'->>-1->>'transaction_date')::date as last_date
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    jsonb_build_object(
      'date_from', (CURRENT_DATE - INTERVAL '30 days')::text,
      'date_to', (CURRENT_DATE + INTERVAL '1 day')::text,
      'limit', 100
    )
  ) as result
) t;
\echo ''

-- TEST 4: Empty result handling
\echo '✓ TEST 4: Empty result (future date range)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as should_be_zero,
  jsonb_array_length(result->'data'->'items') as should_be_empty
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    jsonb_build_object(
      'date_from', '2099-01-01T00:00:00Z',
      'date_to', '2099-12-31T23:59:59Z'
    )
  ) as result
) t;
\echo ''

-- TEST 5: Invalid organization UUID
\echo '✓ TEST 5: Invalid organization UUID (should return empty)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as should_be_zero
FROM (
  SELECT hera_txn_query_v1(
    '00000000-0000-0000-0000-000000000000'::uuid,
    '{}'::jsonb
  ) as result
) t;
\echo ''

-- ========================================
-- PHASE 2: FILTER TESTS
-- ========================================

\echo '----------------------------------------'
\echo 'PHASE 2: FILTER TESTS'
\echo '----------------------------------------'
\echo ''

-- TEST 6: Transaction type filter
\echo '✓ TEST 6: Filter by transaction_type'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total,
  (result->'data'->'items'->0->>'transaction_type') as first_type
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"transaction_type": "sale", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 7: Single status filter
\echo '✓ TEST 7: Filter by single status'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total,
  (result->'data'->'items'->0->>'transaction_status') as first_status
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"transaction_status": "posted", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 8: Multi-status filter (comma-separated)
\echo '✓ TEST 8: Filter by multiple statuses (approved,posted)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total_approved_or_posted
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"transaction_status": "approved,posted", "limit": 50}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 9: Smart code filter
\echo '✓ TEST 9: Filter by smart_code'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total,
  (result->'data'->'items'->0->>'smart_code') as first_smart_code
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"smart_code": "HERA.FINANCE.TXN.SALE.v1", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 10: Transaction code filter
\echo '✓ TEST 10: Filter by transaction_code (exact match)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"transaction_code": "TXN-2024-001", "limit": 1}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 11: Source entity filter
\echo '✓ TEST 11: Filter by source_entity_id (requires valid UUID)'
\echo '(Skipping - requires actual entity UUID)'
\echo ''

-- TEST 12: Target entity filter
\echo '✓ TEST 12: Filter by target_entity_id (requires valid UUID)'
\echo '(Skipping - requires actual entity UUID)'
\echo ''

-- TEST 13: Amount range filter
\echo '✓ TEST 13: Filter by amount range (100-1000)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total_in_range,
  (result->'data'->'items'->0->>'total_amount')::numeric as first_amount,
  (result->'data'->'items'->>-1->>'total_amount')::numeric as last_amount
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"amount_min": 100, "amount_max": 1000, "limit": 20}'::jsonb
  ) as result
) t;
\echo ''

-- ========================================
-- PHASE 3: ADVANCED FEATURES
-- ========================================

\echo '----------------------------------------'
\echo 'PHASE 3: ADVANCED FEATURES'
\echo '----------------------------------------'
\echo ''

-- TEST 14: Text search (ILIKE)
\echo '✓ TEST 14: Text search across transaction_code, reference_number, external_reference'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as matching_count
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"search": "INV", "limit": 20}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 15: Cursor pagination (requires existing transaction)
\echo '✓ TEST 15: Cursor pagination (after_id)'
WITH first_page AS (
  SELECT hera_txn_query_v1(:'org_id'::uuid, '{"limit": 10}'::jsonb) as result
),
last_id AS (
  SELECT (first_page.result->'data'->'items'->>-1->>'id')::uuid as id
  FROM first_page
)
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total,
  (result->'data'->'cursor'->>'after_id')::uuid as cursor_id,
  jsonb_array_length(result->'data'->'items') as items_in_second_page
FROM last_id, LATERAL (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    jsonb_build_object('after_id', last_id.id::text, 'limit', 10)
  ) as result
) t;
\echo ''

-- TEST 16: Dynamic sorting
\echo '✓ TEST 16a: Sort by date ASC'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->'items'->0->>'transaction_date')::date as earliest_date,
  (result->'data'->'items'->>-1->>'transaction_date')::date as latest_date
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"sort_by": "date", "sort_dir": "ASC", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

\echo '✓ TEST 16b: Sort by amount DESC'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->'items'->0->>'total_amount')::numeric as highest_amount,
  (result->'data'->'items'->>-1->>'total_amount')::numeric as lowest_amount
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"sort_by": "amount", "sort_dir": "DESC", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

\echo '✓ TEST 16c: Sort by code ASC'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->'items'->0->>'transaction_code') as first_code,
  (result->'data'->'items'->>-1->>'transaction_code') as last_code
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"sort_by": "code", "sort_dir": "ASC", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 17: Include transaction lines
\echo '✓ TEST 17: Include transaction lines'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->'items'->0->>'transaction_code') as txn_code,
  jsonb_array_length(result->'data'->'items'->0->'lines') as line_count,
  (result->'data'->'items'->0->'lines'->0->>'line_number')::int as first_line_num,
  (result->'data'->'items'->0->'lines'->0->>'line_type') as first_line_type
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"include_lines": true, "limit": 1}'::jsonb
  ) as result
) t
WHERE jsonb_array_length((result->'data'->'items')::jsonb) > 0;
\echo ''

-- TEST 18: Combined complex filter
\echo '✓ TEST 18: Complex query (multiple filters)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as matching_count,
  (result->'data'->'cursor'->>'sort_by') as sort_column,
  (result->'data'->>'notes') as api_notes
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    jsonb_build_object(
      'transaction_type', 'sale',
      'transaction_status', 'posted,approved',
      'amount_min', 100,
      'date_from', (CURRENT_DATE - INTERVAL '90 days')::text,
      'sort_by', 'date',
      'sort_dir', 'DESC',
      'limit', 50
    )
  ) as result
) t;
\echo ''

-- TEST 19: Performance test (explain analyze)
\echo '✓ TEST 19: Performance analysis (EXPLAIN ANALYZE)'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT hera_txn_query_v1(
  :'org_id'::uuid,
  jsonb_build_object(
    'date_from', (CURRENT_DATE - INTERVAL '30 days')::text,
    'date_to', CURRENT_DATE::text,
    'limit', 100
  )
);
\echo ''

-- ========================================
-- PHASE 4: ERROR HANDLING
-- ========================================

\echo '----------------------------------------'
\echo 'PHASE 4: ERROR HANDLING'
\echo '----------------------------------------'
\echo ''

-- TEST 20: Invalid UUID handling
\echo '✓ TEST 20: Invalid UUID in source_entity_id (should be safe)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"source_entity_id": "not-a-valid-uuid", "limit": 10}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 21: Cursor + offset conflict
\echo '✓ TEST 21: Cursor + offset conflict (should return error)'
SELECT
  (result->>'success')::boolean as should_be_false,
  (result->>'error') as error_message
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"after_id": "00000000-0000-0000-0000-000000000001", "offset": 100}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 22: Invalid sort parameters (fallback to defaults)
\echo '✓ TEST 22: Invalid sort parameters (should fallback to date DESC)'
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->'cursor'->>'sort_by') as should_be_date,
  (result->'data'->'cursor'->>'sort_dir') as should_be_desc
FROM (
  SELECT hera_txn_query_v1(
    :'org_id'::uuid,
    '{"sort_by": "invalid_column", "sort_dir": "SIDEWAYS", "limit": 5}'::jsonb
  ) as result
) t;
\echo ''

-- TEST 23: Malformed JSON (will error before function call)
\echo '✓ TEST 23: Malformed JSON (handled by PostgreSQL parser)'
\echo '(Skipping - would cause parser error)'
\echo ''

-- ========================================
-- SUMMARY & INDEX USAGE CHECK
-- ========================================

\echo '----------------------------------------'
\echo 'INDEX USAGE STATISTICS'
\echo '----------------------------------------'
\echo ''

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'universal_transactions'
ORDER BY idx_scan DESC;

\echo ''
\echo '----------------------------------------'
\echo 'FUNCTION EXECUTION STATISTICS'
\echo '----------------------------------------'
\echo ''

SELECT
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time as avg_ms,
  max_exec_time as max_ms,
  min_exec_time as min_ms
FROM pg_stat_statements
WHERE query LIKE '%hera_txn_query_v1%'
  AND query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 5;

\echo ''
\echo '========================================'
\echo 'TEST SUITE COMPLETE'
\echo '========================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Review test results above'
\echo '2. Verify all tests passed (success=true)'
\echo '3. Check performance metrics (avg_ms < 200ms expected)'
\echo '4. Verify indexes are being used (idx_scan > 0)'
\echo ''
