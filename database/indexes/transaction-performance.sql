-- HERA V2 API - Transaction Performance Indexes
-- Optimized for event-sourced transaction patterns
-- No schema changes - indexes only

-- ================================================
-- UNIVERSAL_TRANSACTIONS INDEXES
-- ================================================

-- Primary lookup: organization + transaction date (most common query)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_date
ON universal_transactions (organization_id, transaction_date DESC);

-- Source entity lookup (find all transactions from an entity)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_source
ON universal_transactions (organization_id, source_entity_id)
WHERE source_entity_id IS NOT NULL;

-- Target entity lookup (find all transactions to an entity)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_target
ON universal_transactions (organization_id, target_entity_id)
WHERE target_entity_id IS NOT NULL;

-- Transaction type filtering
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_type
ON universal_transactions (organization_id, transaction_type);

-- Smart code pattern matching (for business intelligence queries)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_smart_code
ON universal_transactions (organization_id, smart_code);

-- Created timestamp for audit queries
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_created
ON universal_transactions (organization_id, created_at DESC);

-- Composite index for date range + type queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_date_type
ON universal_transactions (organization_id, transaction_date DESC, transaction_type);

-- Status filtering (if using status field)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_status
ON universal_transactions (organization_id, status)
WHERE status IS NOT NULL;

-- Metadata-based queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_metadata_gin
ON universal_transactions USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- Reversal tracking (find original transactions and their reversals)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_reversal_tracking
ON universal_transactions USING GIN ((metadata->'reversal_of'))
WHERE metadata ? 'reversal_of';

-- Idempotency index for deduplication (fast lookup by idempotency key)
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org_idempotency
ON universal_transactions (organization_id, ((metadata->>'idempotency_key')))
WHERE metadata ? 'idempotency_key';

-- ================================================
-- UNIVERSAL_TRANSACTION_LINES INDEXES
-- ================================================

-- Primary lookup: organization + transaction + line number (guaranteed unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_universal_transaction_lines_org_txn_line
ON universal_transaction_lines (organization_id, transaction_id, line_number);

-- Entity lookup on lines (find all lines referencing an entity)
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_org_entity
ON universal_transaction_lines (organization_id, line_entity_id)
WHERE line_entity_id IS NOT NULL;

-- Line type filtering
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_org_line_type
ON universal_transaction_lines (organization_id, line_type);

-- Financial queries: DR/CR filtering with currency
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_org_dr_cr
ON universal_transaction_lines (organization_id, dr_cr, currency)
WHERE dr_cr IS NOT NULL;

-- Smart code pattern matching on lines
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_org_smart_code
ON universal_transaction_lines (organization_id, smart_code)
WHERE smart_code IS NOT NULL;

-- Amount-based queries (for financial reporting)
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_org_amounts
ON universal_transaction_lines (organization_id, total_amount)
WHERE total_amount IS NOT NULL AND total_amount != 0;

-- Line metadata queries (GIN for JSONB)
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_metadata_gin
ON universal_transaction_lines USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- Reversal tracking on lines
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_reversal_tracking
ON universal_transaction_lines USING GIN ((metadata->'reversal_of'))
WHERE metadata ? 'reversal_of';

-- ================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ================================================

-- Transaction query with entity + date range
CREATE INDEX IF NOT EXISTS idx_transactions_org_entity_date
ON universal_transactions (organization_id, source_entity_id, transaction_date DESC)
WHERE source_entity_id IS NOT NULL;

-- Financial transaction queries (smart code + DR/CR)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_pattern
ON universal_transactions (organization_id, smart_code)
WHERE smart_code LIKE '%FIN%' OR smart_code LIKE '%GL%';

-- Line queries for financial balancing
CREATE INDEX IF NOT EXISTS idx_financial_lines_org_balance
ON universal_transaction_lines (organization_id, transaction_id, dr_cr, total_amount)
WHERE dr_cr IS NOT NULL AND total_amount IS NOT NULL;

-- ================================================
-- PARTIAL INDEXES FOR SPECIFIC PATTERNS
-- ================================================

-- Active transactions only (exclude reversed/cancelled)
CREATE INDEX IF NOT EXISTS idx_active_transactions_org
ON universal_transactions (organization_id, transaction_date DESC)
WHERE status NOT IN ('REVERSED', 'CANCELLED') OR status IS NULL;

-- Financial transactions with imbalanced flag (for validation)
CREATE INDEX IF NOT EXISTS idx_imbalanced_financial_transactions
ON universal_transactions (organization_id, id)
WHERE (smart_code LIKE '%FIN%' OR smart_code LIKE '%GL%')
  AND metadata ? 'imbalanced';

-- Large amount transactions (for audit/monitoring)
CREATE INDEX IF NOT EXISTS idx_large_amount_transactions
ON universal_transactions (organization_id, total_amount DESC)
WHERE total_amount > 10000;

-- Recent transactions (last 30 days) - frequently accessed
CREATE INDEX IF NOT EXISTS idx_recent_transactions_org
ON universal_transactions (organization_id, transaction_date DESC, created_at DESC)
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days';

-- ================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- ================================================

-- Ensure unique line numbers per transaction
-- (This is enforced by the unique index above, but adding as explicit constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'utl_unique_line_number_per_txn'
  ) THEN
    ALTER TABLE universal_transaction_lines
    ADD CONSTRAINT utl_unique_line_number_per_txn
    UNIQUE (organization_id, transaction_id, line_number);
  END IF;
END $$;

-- ================================================
-- MAINTENANCE QUERIES
-- ================================================

-- Query to analyze index usage (run periodically)
/*
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename = 'universal_transactions' OR tablename = 'universal_transaction_lines')
ORDER BY idx_scan DESC;
*/

-- Query to find unused indexes (run before cleanup)
/*
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename = 'universal_transactions' OR tablename = 'universal_transaction_lines')
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- ================================================
-- PERFORMANCE NOTES
-- ================================================

/*
INDEX USAGE GUIDELINES:

1. Organization-first pattern: All queries MUST filter by organization_id first
   - This ensures multi-tenant isolation and optimal performance

2. Date ranges: Use DESC ordering for recent-first queries (most common)
   - Recent transactions are accessed more frequently

3. Entity lookups: Separate indexes for source_entity_id and target_entity_id
   - Supports "transactions FROM entity" and "transactions TO entity" patterns

4. Financial queries: Special indexes for DR/CR balancing and GL operations
   - Enables fast financial reporting and balance validation

5. Smart code patterns: GIN indexes for pattern matching on business intelligence
   - Supports LIKE queries on smart codes for business logic

6. Reversal tracking: JSON indexes for audit trail queries
   - Fast lookup of original↔reversal relationships

7. Partial indexes: Only index relevant data to save space and improve performance
   - Active transactions, financial transactions, large amounts, etc.

QUERY PATTERNS OPTIMIZED:
- Find transactions by organization + date range
- Find transactions by entity (as source or target)
- Find transactions by type + smart code pattern
- Find financial transactions for balancing
- Find reversals and original transactions
- Validate unique line numbers per transaction
- Audit trail queries with metadata filtering
*/