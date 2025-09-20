-- Hot path performance indexes for salon POS canary
-- Target: Drop p95 from 1.2s to <200ms

-- 1. Cart line queries (transaction_id, smart_code)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_lines_cart_smart 
ON universal_transaction_lines (transaction_id, smart_code);

-- 2. Organization transactions with smart codes and dates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_org_smart_created 
ON universal_transactions (organization_id, smart_code, created_at DESC);

-- 3. Transaction status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_org_status 
ON universal_transactions (organization_id, transaction_status);

-- 4. JSON state filtering (if we filter on dynamic->>'current_state')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_current_state 
ON universal_transactions ((metadata->>'current_state'));

-- 5. Entity lookups for pricing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_org_type 
ON core_entities (organization_id, entity_type);

-- 6. Line entity resolution for pricing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_lines_entity 
ON universal_transaction_lines (entity_id, line_type);

-- 7. Composite index for line queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_lines_composite 
ON universal_transaction_lines (transaction_id, line_type, entity_id);

-- Connection pool settings for performance
-- These would be applied to the database connection
-- ALTER SYSTEM SET max_connections = 100;
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- SELECT pg_reload_conf();