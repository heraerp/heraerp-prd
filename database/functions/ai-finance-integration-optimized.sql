-- HERA AI Finance Integration - Production Performance Optimizations
-- Addresses scalability concerns from code review

-- ============================================================================
-- PERFORMANCE OPTIMIZATION CONFIGURATIONS
-- ============================================================================

-- Optimize PostgreSQL for AI workloads
SET shared_buffers = '256MB';
SET work_mem = '64MB';
SET maintenance_work_mem = '256MB';
SET effective_cache_size = '1GB';
SET random_page_cost = 1.1;
SET effective_io_concurrency = 200;
SET wal_buffers = '16MB';
SET checkpoint_completion_target = 0.9;
SET max_wal_size = '1GB';
SET min_wal_size = '80MB';

-- Enable parallel query processing
SET max_parallel_workers = 8;
SET max_parallel_workers_per_gather = 4;
SET parallel_tuple_cost = 0.1;
SET parallel_setup_cost = 1000.0;

-- ============================================================================
-- OPTIMIZED INDEXES FOR AI WORKLOADS
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_org_date_status 
ON universal_transactions(organization_id, created_at DESC, posting_status) 
WHERE created_at > NOW() - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_smart_code_confidence 
ON universal_transactions(smart_code, ai_confidence_score DESC, created_at DESC)
WHERE ai_confidence_score IS NOT NULL;

-- Optimized vector similarity index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_patterns_embedding_optimized
ON ai_transaction_patterns USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Optimized for 10K-100K patterns

-- Partial indexes for active patterns only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_patterns_active_success
ON ai_transaction_patterns(organization_id, smart_code, success_rate DESC)
WHERE success_rate > 0.5 AND usage_count > 0;

-- Covering index for performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_performance_metrics_covering
ON ai_smart_code_performance(organization_id, smart_code, created_at DESC)
INCLUDE (ai_confidence_score, processing_time_ms, business_outcome_score);

-- ============================================================================
-- OPTIMIZED AI CLASSIFICATION WITH PAGINATION
-- ============================================================================

-- Paginated AI pattern discovery to prevent runaway queries
CREATE OR REPLACE FUNCTION ai_discover_smart_code_patterns_optimized(
    p_batch_size INTEGER DEFAULT 1000,
    p_min_confidence FLOAT DEFAULT 0.85
) RETURNS INTEGER AS $$
DECLARE
    pattern_candidate RECORD;
    new_patterns_found INTEGER := 0;
    pattern_signature TEXT;
    confidence_score FLOAT;
    batch_count INTEGER := 0;
BEGIN
    -- Process in batches to prevent memory issues
    FOR pattern_candidate IN 
        WITH recent_high_confidence AS (
            SELECT 
                t.organization_id,
                t.smart_code,
                t.posting_status,
                AVG(t.ai_confidence_score) as avg_confidence,
                COUNT(*) as frequency,
                STDDEV(t.ai_confidence_score) as confidence_stability,
                -- Sample metadata instead of aggregating all
                (array_agg(t.transaction_metadata ORDER BY t.created_at DESC))[1] as sample_metadata,
                AVG(p.processing_time_ms) as avg_processing_time,
                AVG(p.business_outcome_score) as avg_outcome_score
            FROM universal_transactions t
            LEFT JOIN ai_smart_code_performance p ON p.transaction_id = t.id
            WHERE t.created_at > NOW() - INTERVAL '7 days'
            AND t.posting_status = 'auto_posted'
            AND t.ai_confidence_score > p_min_confidence
            GROUP BY t.organization_id, t.smart_code, t.posting_status
            HAVING COUNT(*) >= 20 
            AND AVG(t.ai_confidence_score) > 0.92
            AND COALESCE(AVG(p.business_outcome_score), 0.8) > 0.85
            ORDER BY COUNT(*) DESC
            LIMIT p_batch_size
        )
        SELECT * FROM recent_high_confidence
    LOOP
        batch_count := batch_count + 1;
        
        -- Exit if we've processed too many to prevent long-running queries
        IF batch_count > 100 THEN
            EXIT;
        END IF;
        
        -- Generate pattern signature
        pattern_signature := 'DISCOVERED_' || 
            split_part(pattern_candidate.smart_code, '.', 2) || '_' ||
            split_part(pattern_candidate.smart_code, '.', 3);
        
        -- Calculate discovery confidence
        confidence_score := (
            pattern_candidate.avg_confidence * 0.4 +
            LEAST(pattern_candidate.frequency / 50.0, 1.0) * 0.3 +
            (1.0 - COALESCE(pattern_candidate.confidence_stability, 0.1)) * 0.3
        );
        
        -- Store discovered pattern if it's high quality
        IF confidence_score > 0.85 THEN
            INSERT INTO ai_smart_code_patterns (
                organization_id,
                pattern_signature,
                base_smart_code,
                enhanced_smart_code,
                business_context,
                discovery_confidence,
                pattern_status,
                pattern_embedding
            ) VALUES (
                pattern_candidate.organization_id,
                pattern_signature,
                pattern_candidate.smart_code,
                pattern_candidate.smart_code || '.AI_OPTIMIZED.v2.conf' || 
                    ROUND(confidence_score * 100)::TEXT,
                jsonb_build_object(
                    'discovered_frequency', pattern_candidate.frequency,
                    'avg_confidence', pattern_candidate.avg_confidence,
                    'avg_processing_time', pattern_candidate.avg_processing_time,
                    'sample_context', pattern_candidate.sample_metadata
                ),
                confidence_score,
                'discovered',
                ai_generate_context_embedding(
                    jsonb_build_object(
                        'base_code', pattern_candidate.smart_code,
                        'performance_metrics', jsonb_build_object(
                            'frequency', pattern_candidate.frequency,
                            'confidence', pattern_candidate.avg_confidence
                        )
                    )
                )
            ) ON CONFLICT (organization_id, pattern_signature) DO UPDATE SET
                discovery_confidence = GREATEST(ai_smart_code_patterns.discovery_confidence, confidence_score),
                updated_at = NOW();
            
            new_patterns_found := new_patterns_found + 1;
        END IF;
    END LOOP;
    
    RETURN new_patterns_found;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONNECTION POOLING AND PREPARED STATEMENTS
-- ============================================================================

-- Prepared statement for AI classification (reduces parse time)
PREPARE ai_classify_stmt (TEXT, JSONB, UUID) AS
SELECT gl_mapping, confidence 
FROM ai_classify_transaction($1, $2, $3);

-- Prepared statement for transaction creation
PREPARE create_transaction_stmt (UUID, TEXT, TEXT, TEXT, NUMERIC, JSONB, TEXT, UUID) AS
INSERT INTO universal_transactions (
    organization_id, transaction_type, smart_code, reference_number,
    total_amount, transaction_metadata, source_module, source_document_id,
    transaction_date, status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'active')
RETURNING id;

-- ============================================================================
-- OPTIMIZED ANALYTICS QUERIES
-- ============================================================================

-- Materialized view for performance metrics (updated every 15 minutes)
CREATE MATERIALIZED VIEW ai_posting_metrics_mv AS
SELECT 
    organization_id,
    date_trunc('hour', created_at) as metric_hour,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN posting_status = 'auto_posted' THEN 1 ELSE 0 END) as auto_posted,
    SUM(CASE WHEN posting_status = 'pending_review' THEN 1 ELSE 0 END) as pending_review,
    SUM(CASE WHEN posting_status = 'manual_required' THEN 1 ELSE 0 END) as manual_required,
    AVG(COALESCE(ai_confidence_score, 0)) as avg_confidence,
    AVG(CASE WHEN posting_status = 'auto_posted' 
        THEN EXTRACT(epoch FROM (gl_posted_at - created_at))
        ELSE NULL END) as avg_posting_time_seconds
FROM universal_transactions 
WHERE created_at > NOW() - INTERVAL '7 days'
AND smart_code IS NOT NULL
GROUP BY organization_id, date_trunc('hour', created_at);

-- Index for materialized view
CREATE INDEX idx_ai_metrics_mv_org_hour ON ai_posting_metrics_mv(organization_id, metric_hour DESC);

-- Refresh the materialized view (called by cron job)
CREATE OR REPLACE FUNCTION refresh_ai_metrics_mv() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ai_posting_metrics_mv;
    
    -- Clean up old data (keep only 7 days)
    DELETE FROM ai_posting_metrics_mv 
    WHERE metric_hour < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule materialized view refresh every 15 minutes
SELECT cron.schedule('refresh-ai-metrics', '*/15 * * * *', 'SELECT refresh_ai_metrics_mv();');

-- ============================================================================
-- OPTIMIZED REPORTING FUNCTIONS
-- ============================================================================

-- Fast AI posting metrics using materialized view
CREATE OR REPLACE FUNCTION get_ai_posting_metrics_optimized(
    p_organization_id UUID,
    p_days_back INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    metrics JSONB;
    current_metrics RECORD;
BEGIN
    -- Get aggregated metrics from materialized view
    SELECT 
        SUM(total_transactions)::INTEGER as total,
        SUM(auto_posted)::INTEGER as auto_posted,
        SUM(pending_review)::INTEGER as pending_review, 
        SUM(manual_required)::INTEGER as manual_required,
        AVG(avg_confidence) as avg_confidence,
        AVG(avg_posting_time_seconds) as avg_posting_time
    INTO current_metrics
    FROM ai_posting_metrics_mv
    WHERE organization_id = p_organization_id
    AND metric_hour > NOW() - (p_days_back || ' days')::INTERVAL;
    
    metrics := jsonb_build_object(
        'period_days', p_days_back,
        'total_transactions', COALESCE(current_metrics.total, 0),
        'auto_posted_count', COALESCE(current_metrics.auto_posted, 0),
        'pending_review_count', COALESCE(current_metrics.pending_review, 0),
        'manual_required_count', COALESCE(current_metrics.manual_required, 0),
        'auto_posting_rate', 
            CASE WHEN current_metrics.total > 0 
            THEN ROUND((current_metrics.auto_posted::FLOAT / current_metrics.total::FLOAT) * 100, 2)
            ELSE 0 END,
        'average_confidence_score', ROUND(COALESCE(current_metrics.avg_confidence, 0), 3),
        'average_posting_time_seconds', ROUND(COALESCE(current_metrics.avg_posting_time, 0), 2),
        'ai_effectiveness', 
            CASE WHEN current_metrics.total > 0
            THEN ROUND(((current_metrics.auto_posted + current_metrics.pending_review)::FLOAT / current_metrics.total::FLOAT) * 100, 2)
            ELSE 0 END,
        'last_updated', NOW()
    );
    
    RETURN metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Monitor query performance
CREATE OR REPLACE FUNCTION get_ai_query_performance() RETURNS TABLE(
    query_type TEXT,
    avg_duration_ms FLOAT,
    total_calls BIGINT,
    cache_hit_ratio FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'ai_classification'::TEXT,
        AVG(EXTRACT(epoch FROM (NOW() - query_start)) * 1000) as avg_duration_ms,
        COUNT(*) as total_calls,
        0.0 as cache_hit_ratio -- TODO: Implement cache hit tracking
    FROM pg_stat_activity 
    WHERE query LIKE '%ai_classify_transaction%'
    AND state = 'active';
END;
$$ LANGUAGE plpgsql;

-- Database health check for AI system
CREATE OR REPLACE FUNCTION ai_system_health_check() RETURNS JSONB AS $$
DECLARE
    health_status JSONB;
    connection_count INTEGER;
    slow_queries INTEGER;
    index_usage FLOAT;
BEGIN
    -- Check connection count
    SELECT COUNT(*) INTO connection_count 
    FROM pg_stat_activity 
    WHERE datname = current_database();
    
    -- Check for slow queries
    SELECT COUNT(*) INTO slow_queries
    FROM pg_stat_activity 
    WHERE query_start < NOW() - INTERVAL '30 seconds'
    AND state = 'active'
    AND query NOT LIKE '%pg_stat_activity%';
    
    -- Check index usage ratio
    SELECT 
        CASE WHEN SUM(idx_tup_read + idx_tup_fetch) > 0
        THEN SUM(idx_tup_read + idx_tup_fetch)::FLOAT / 
             SUM(seq_tup_read + idx_tup_read + idx_tup_fetch)::FLOAT * 100
        ELSE 100 END
    INTO index_usage
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public';
    
    health_status := jsonb_build_object(
        'database_connections', connection_count,
        'slow_queries', slow_queries,
        'index_usage_percent', ROUND(index_usage, 2),
        'ai_patterns_count', (SELECT COUNT(*) FROM ai_transaction_patterns),
        'embeddings_ready', (SELECT COUNT(*) FROM ai_transaction_patterns WHERE embedding IS NOT NULL),
        'status', CASE 
            WHEN connection_count < 80 AND slow_queries < 5 AND index_usage > 80 THEN 'healthy'
            WHEN connection_count < 95 AND slow_queries < 10 AND index_usage > 60 THEN 'degraded'
            ELSE 'unhealthy'
        END,
        'timestamp', NOW()
    );
    
    RETURN health_status;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- ============================================================================

-- Clean up old AI performance data
CREATE OR REPLACE FUNCTION cleanup_ai_performance_data() RETURNS VOID AS $$
BEGIN
    -- Delete old performance records (older than 90 days)
    DELETE FROM ai_smart_code_performance 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Archive old transaction patterns (not used in 180 days)
    UPDATE ai_transaction_patterns 
    SET pattern_status = 'archived'
    WHERE last_used_at < NOW() - INTERVAL '180 days'
    AND pattern_status = 'validated';
    
    -- Delete deprecated patterns (archived for 30+ days)
    DELETE FROM ai_transaction_patterns 
    WHERE pattern_status = 'deprecated' 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    -- Vacuum and analyze AI tables
    VACUUM ANALYZE ai_transaction_patterns;
    VACUUM ANALYZE ai_smart_code_performance;
    VACUUM ANALYZE ai_posting_feedback;
    
    RAISE NOTICE 'AI performance data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every Sunday at 2 AM
SELECT cron.schedule('ai-cleanup', '0 2 * * 0', 'SELECT cleanup_ai_performance_data();');

-- ============================================================================
-- BATCH PROCESSING OPTIMIZATIONS
-- ============================================================================

-- Batch insert for AI performance records
CREATE OR REPLACE FUNCTION batch_insert_ai_performance(
    performance_records JSONB[]
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO ai_smart_code_performance (
        organization_id,
        smart_code,
        transaction_id,
        processing_time_ms,
        ai_confidence_score,
        business_outcome_score,
        execution_context,
        created_at
    )
    SELECT 
        (record->>'organization_id')::UUID,
        record->>'smart_code',
        (record->>'transaction_id')::UUID,
        (record->>'processing_time_ms')::INTEGER,
        (record->>'ai_confidence_score')::FLOAT,
        (record->>'business_outcome_score')::FLOAT,
        record->'execution_context',
        NOW()
    FROM unnest(performance_records) AS record;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS AND PERMISSIONS
-- ============================================================================

COMMENT ON FUNCTION ai_discover_smart_code_patterns_optimized IS 'Optimized AI pattern discovery with pagination and batch limits';
COMMENT ON FUNCTION get_ai_posting_metrics_optimized IS 'High-performance metrics using materialized views';
COMMENT ON FUNCTION ai_system_health_check IS 'Comprehensive health check for AI system components';
COMMENT ON FUNCTION cleanup_ai_performance_data IS 'Automated maintenance for AI performance data';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ai_posting_metrics_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION ai_system_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_query_performance TO authenticated;