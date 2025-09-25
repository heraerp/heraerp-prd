-- Universal Report Pattern (URP) Materialized Views
-- Smart Code: HERA.URP.VIEWS.v1
-- 
-- Optimized views for common report patterns

-- View: Entity with Dynamic Data
-- Flattens entity and dynamic data for easier querying
CREATE OR REPLACE VIEW urp_entities_with_data_v1 AS
SELECT 
    e.id,
    e.organization_id,
    e.entity_type,
    e.entity_name,
    e.entity_code,
    e.entity_description,
    e.smart_code,
    e.metadata,
    e.status,
    e.created_at,
    e.updated_at,
    -- Aggregate dynamic data as JSON
    jsonb_object_agg(
        COALESCE(d.field_name, ''), 
        jsonb_build_object(
            'value', COALESCE(
                d.field_value_text,
                d.field_value_number::text,
                d.field_value_boolean,
                d.field_value_date::text,
                d.field_value_json::text
            ),
            'type', d.field_type,
            'smart_code', d.smart_code
        )
    ) FILTER (WHERE d.field_name IS NOT NULL) as dynamic_fields
FROM 
    core_entities e
LEFT JOIN 
    core_dynamic_data d ON e.id = d.entity_id AND e.organization_id = d.organization_id
WHERE 
    e.status != 'deleted'
GROUP BY 
    e.id, e.organization_id, e.entity_type, e.entity_name, e.entity_code, 
    e.entity_description, e.smart_code, e.metadata, e.status, e.created_at, e.updated_at;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_urp_entities_org_type 
ON core_entities(organization_id, entity_type) 
WHERE status != 'deleted';

-- View: Transaction Summary by Period
-- Pre-aggregated transaction data for faster reporting
CREATE OR REPLACE VIEW urp_transaction_summary_v1 AS
SELECT 
    t.organization_id,
    t.transaction_type,
    t.smart_code,
    DATE_TRUNC('month', t.transaction_date) as period_month,
    DATE_TRUNC('quarter', t.transaction_date) as period_quarter,
    DATE_TRUNC('year', t.transaction_date) as period_year,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(t.total_amount) as total_amount,
    AVG(t.total_amount) as avg_amount,
    MIN(t.total_amount) as min_amount,
    MAX(t.total_amount) as max_amount,
    COUNT(DISTINCT t.source_entity_id) as unique_sources,
    COUNT(DISTINCT t.target_entity_id) as unique_targets
FROM 
    universal_transactions t
WHERE 
    t.transaction_status != 'cancelled'
GROUP BY 
    t.organization_id, t.transaction_type, t.smart_code,
    period_month, period_quarter, period_year;

-- Index for period queries
CREATE INDEX IF NOT EXISTS idx_urp_transactions_period 
ON universal_transactions(organization_id, transaction_date, transaction_type) 
WHERE transaction_status != 'cancelled';

-- View: Entity Hierarchy
-- Pre-computed entity relationships for hierarchy queries
CREATE OR REPLACE VIEW urp_entity_hierarchy_v1 AS
WITH RECURSIVE entity_tree AS (
    -- Base case: root entities (no parent)
    SELECT 
        e.id,
        e.organization_id,
        e.entity_type,
        e.entity_name,
        e.entity_code,
        e.smart_code,
        NULL::uuid as parent_id,
        0 as level,
        ARRAY[e.id] as path,
        e.id::text as hierarchy_key
    FROM 
        core_entities e
    WHERE 
        e.status != 'deleted'
        AND NOT EXISTS (
            SELECT 1 FROM core_relationships r
            WHERE r.to_entity_id = e.id 
            AND r.relationship_type = 'parent_of'
            AND r.organization_id = e.organization_id
        )
    
    UNION ALL
    
    -- Recursive case: child entities
    SELECT 
        e.id,
        e.organization_id,
        e.entity_type,
        e.entity_name,
        e.entity_code,
        e.smart_code,
        r.from_entity_id as parent_id,
        et.level + 1,
        et.path || e.id,
        et.hierarchy_key || '.' || e.id::text
    FROM 
        core_entities e
    INNER JOIN 
        core_relationships r ON r.to_entity_id = e.id 
        AND r.relationship_type = 'parent_of'
    INNER JOIN 
        entity_tree et ON et.id = r.from_entity_id 
        AND et.organization_id = r.organization_id
    WHERE 
        e.status != 'deleted'
        AND NOT e.id = ANY(et.path) -- Prevent cycles
)
SELECT * FROM entity_tree;

-- View: Transaction Line Details
-- Enriched transaction lines with entity information
CREATE OR REPLACE VIEW urp_transaction_lines_enriched_v1 AS
SELECT 
    tl.id as line_id,
    tl.organization_id,
    tl.transaction_id,
    t.transaction_type,
    t.transaction_code,
    t.transaction_date,
    t.smart_code as transaction_smart_code,
    tl.line_number,
    tl.entity_id,
    e.entity_name,
    e.entity_type,
    e.smart_code as entity_smart_code,
    tl.line_type,
    tl.description,
    tl.quantity,
    tl.unit_price,
    tl.line_amount,
    tl.discount_amount,
    tl.tax_amount,
    tl.smart_code as line_smart_code,
    tl.line_data
FROM 
    universal_transaction_lines tl
INNER JOIN 
    universal_transactions t ON t.id = tl.transaction_id 
    AND t.organization_id = tl.organization_id
LEFT JOIN 
    core_entities e ON e.id = tl.entity_id 
    AND e.organization_id = tl.organization_id
WHERE 
    t.transaction_status != 'cancelled';

-- View: Account Balances
-- Running balances for GL accounts
CREATE OR REPLACE VIEW urp_account_balances_v1 AS
SELECT 
    e.id as account_id,
    e.organization_id,
    e.entity_name as account_name,
    e.entity_code as account_code,
    e.smart_code,
    COALESCE(
        SUM(CASE 
            WHEN tl.line_amount > 0 THEN tl.line_amount 
            ELSE 0 
        END), 0
    ) as debit_total,
    COALESCE(
        SUM(CASE 
            WHEN tl.line_amount < 0 THEN ABS(tl.line_amount) 
            ELSE 0 
        END), 0
    ) as credit_total,
    COALESCE(SUM(tl.line_amount), 0) as balance
FROM 
    core_entities e
LEFT JOIN 
    universal_transaction_lines tl ON tl.entity_id = e.id 
    AND tl.organization_id = e.organization_id
LEFT JOIN 
    universal_transactions t ON t.id = tl.transaction_id 
    AND t.organization_id = e.organization_id
    AND t.transaction_status != 'cancelled'
WHERE 
    e.entity_type = 'gl_account' 
    AND e.status != 'deleted'
GROUP BY 
    e.id, e.organization_id, e.entity_name, e.entity_code, e.smart_code;

-- Function: Refresh all URP views
CREATE OR REPLACE FUNCTION refresh_urp_views()
RETURNS void AS $$
BEGIN
    -- In production, these would be materialized views
    -- For now, we'll just analyze the tables for better performance
    ANALYZE core_entities;
    ANALYZE core_dynamic_data;
    ANALYZE core_relationships;
    ANALYZE universal_transactions;
    ANALYZE universal_transaction_lines;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (would be done via cron job or pg_cron in production)
COMMENT ON FUNCTION refresh_urp_views() IS 'Refresh URP materialized views - run periodically for optimal performance';