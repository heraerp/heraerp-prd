-- Performance Indexes for Salon Dashboard API Calls
-- Run these to optimize the 1-1.6s API calls down to <100ms

-- ===============================
-- CORE RELATIONSHIPS (Hot Path)
-- ===============================

-- Primary index for grouped relationship queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_org_type_active_created 
ON core_relationships (organization_id, relationship_type, is_active, created_at DESC)
WHERE is_active = true;

-- Index for relationship type counting/grouping
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_org_active_type_count
ON core_relationships (organization_id, is_active, relationship_type)
WHERE is_active = true;

-- Index for entity relationship lookups (source/target)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_source_target_org
ON core_relationships (source_entity_id, target_entity_id, organization_id, is_active)
WHERE is_active = true;

-- ===============================
-- CORE DYNAMIC DATA (Hot Path) 
-- ===============================

-- Primary index for entity dynamic field lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dynamic_entity_org_field
ON core_dynamic_data (entity_id, organization_id, field_name, created_at DESC);

-- Index for field type queries (numbers, text, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dynamic_org_field_type
ON core_dynamic_data (organization_id, field_type, field_name);

-- JSONB GIN index for complex field value queries (already exists from CLAUDE.md)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS cdd_field_value_json_gin
-- ON core_dynamic_data USING gin (field_value_json jsonb_path_ops);

-- ===============================
-- CORE ENTITIES (Dashboard Queries)
-- ===============================

-- Primary entity lookups by type and organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_org_type_created
ON core_entities (organization_id, entity_type, created_at DESC);

-- Entity name search (for autocompletes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_org_name_search
ON core_entities (organization_id, entity_name varchar_pattern_ops)
WHERE entity_name IS NOT NULL;

-- Smart code lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_org_smart_code
ON core_entities (organization_id, smart_code)
WHERE smart_code IS NOT NULL;

-- ===============================
-- UNIVERSAL TRANSACTIONS (Finance)
-- ===============================

-- Transaction date range queries (common in dashboards)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_org_date_type
ON universal_transactions (organization_id, transaction_date DESC, transaction_type);

-- Transaction status and amount filtering  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_org_status_amount
ON universal_transactions (organization_id, transaction_status, total_amount);

-- Source/target entity transaction lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_source_target_org
ON universal_transactions (source_entity_id, target_entity_id, organization_id, transaction_date DESC);

-- ===============================
-- TRANSACTION LINES (Detail Queries)
-- ===============================

-- Transaction line lookups by parent transaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_txn_lines_txn_org_line
ON universal_transaction_lines (transaction_id, organization_id, line_number);

-- Entity-based line lookups (for entity transaction history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_txn_lines_entity_org_date
ON universal_transaction_lines (entity_id, organization_id, created_at DESC)
WHERE entity_id IS NOT NULL;

-- ===============================
-- APPOINTMENTS (Salon Specific)
-- ===============================

-- Appointment date range queries (very common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_org_date_status
ON core_entities (organization_id, created_at DESC, entity_type)
WHERE entity_type = 'appointment';

-- Staff appointment lookups via relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_staff_appointments
ON core_relationships (target_entity_id, relationship_type, organization_id, created_at DESC)
WHERE relationship_type = 'STAFF_ASSIGNED_TO' AND is_active = true;

-- ===============================
-- BRANCH/LOCATION QUERIES
-- ===============================

-- Branch entity lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branch_entities_org
ON core_entities (organization_id, entity_type, entity_name)
WHERE entity_type = 'branch';

-- Branch-staff relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_branch_staff
ON core_relationships (source_entity_id, relationship_type, organization_id, is_active)
WHERE relationship_type = 'AVAILABLE_AT' AND is_active = true;

-- ===============================
-- INVENTORY/PRODUCTS
-- ===============================

-- Product entity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_entities_org
ON core_entities (organization_id, entity_type, created_at DESC)
WHERE entity_type IN ('product', 'service');

-- Product-branch availability relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rel_product_availability
ON core_relationships (source_entity_id, relationship_type, target_entity_id, organization_id)
WHERE relationship_type = 'AVAILABLE_AT' AND is_active = true;

-- ===============================
-- ANALYTICS SUPPORT
-- ===============================

-- Time-based entity creation analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_org_type_created_date
ON core_entities (organization_id, entity_type, date_trunc('day', created_at))
WHERE created_at IS NOT NULL;

-- Revenue analytics via transaction amounts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_org_date_amount
ON universal_transactions (organization_id, date_trunc('day', transaction_date), total_amount)
WHERE total_amount IS NOT NULL AND total_amount > 0;

-- ===============================
-- CLEANUP & VERIFICATION
-- ===============================

-- Update table statistics after index creation
ANALYZE core_relationships;
ANALYZE core_dynamic_data; 
ANALYZE core_entities;
ANALYZE universal_transactions;
ANALYZE universal_transaction_lines;

-- Check index usage (run after deployment)
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('core_relationships', 'core_dynamic_data', 'core_entities', 'universal_transactions')
ORDER BY idx_scan DESC;
*/

-- Expected Performance Gains:
-- - Relationship queries: 1.5s → 50-100ms
-- - Dynamic data lookups: 800ms → 20-50ms  
-- - Entity searches: 600ms → 10-30ms
-- - Transaction aggregations: 1.2s → 100-200ms
-- - Overall dashboard load: 4-6s → 500ms-1s