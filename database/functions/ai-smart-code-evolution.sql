-- HERA AI-Enhanced Smart Code Evolution System
-- Next-generation context-aware, self-learning Smart Code engine

-- ============================================================================
-- AI EXTENSIONS FOR SMART CODE INTELLIGENCE
-- ============================================================================

-- Install advanced AI extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable advanced PostgreSQL features for AI
SET enable_seqscan = off;
SET work_mem = '256MB';
SET shared_preload_libraries = 'pg_stat_statements';

-- ============================================================================
-- ENHANCED SMART CODE STRUCTURES
-- ============================================================================

-- AI-Enhanced Smart Code with multi-dimensional intelligence
-- Drop existing type if it exists
DROP TYPE IF EXISTS ai_enhanced_smart_code CASCADE;

CREATE TYPE ai_enhanced_smart_code AS (
    base_module TEXT,                    -- SALES, PROC, HR, etc.
    business_process TEXT,               -- INV, GR, PAYROLL, etc.
    customer_intelligence TEXT,          -- VIP, CHURN_RISK, NEW, LOYAL
    transaction_magnitude TEXT,          -- MICRO, SMALL, LARGE, JUMBO
    temporal_context TEXT,               -- RUSH, EOD, EOM, EOQ, EOY
    risk_assessment TEXT,                -- MINIMAL, LOW, MEDIUM, HIGH, CRITICAL
    seasonal_factor TEXT,                -- PEAK, HIGH, NORMAL, LOW, OFF
    geographical_intelligence TEXT,      -- METRO, SUBURBAN, RURAL, INTERNATIONAL
    compliance_requirements TEXT[],      -- SOX, HIPAA, PCI, GDPR, etc.
    integration_complexity TEXT,         -- SIMPLE, STANDARD, COMPLEX, ENTERPRISE
    industry_specifics TEXT[],           -- HEALTHCARE_EMERGENCY, RESTAURANT_PEAK
    ai_model_version TEXT,               -- GPT4_TURBO_2024, CLAUDE_3_OPUS
    confidence_level INTEGER,            -- 0-100 AI confidence
    learning_generation INTEGER,         -- How many times AI improved this code
    performance_metrics JSONB           -- Success rates, speed, accuracy
);

-- Business Context Intelligence Table
CREATE TABLE ai_business_context_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    context_signature TEXT NOT NULL,
    context_factors JSONB NOT NULL,
    business_impact_score FLOAT NOT NULL DEFAULT 0.0,
    usage_frequency INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    
    -- AI embeddings for context similarity
    context_embedding vector(1536),
    
    -- Performance tracking
    avg_processing_time INTEGER, -- milliseconds
    error_rate FLOAT DEFAULT 0.0,
    user_satisfaction_score FLOAT,
    
    -- Learning metadata
    discovered_by_ai BOOLEAN DEFAULT true,
    validated_by_user BOOLEAN DEFAULT false,
    learning_confidence FLOAT DEFAULT 0.0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    
    CONSTRAINT fk_context_org FOREIGN KEY (organization_id) REFERENCES core_organizations(id)
);

-- AI Pattern Discovery and Learning
CREATE TABLE ai_smart_code_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    pattern_signature TEXT NOT NULL,
    base_smart_code TEXT NOT NULL,
    enhanced_smart_code TEXT NOT NULL,
    
    -- Context analysis
    business_context JSONB NOT NULL,
    transaction_characteristics JSONB NOT NULL,
    performance_improvements JSONB,
    
    -- AI learning metrics
    discovery_confidence FLOAT NOT NULL,
    validation_confidence FLOAT DEFAULT 0.0,
    usage_success_rate FLOAT DEFAULT 0.0,
    improvement_score FLOAT DEFAULT 0.0,
    
    -- Pattern embeddings
    pattern_embedding vector(1536),
    context_embedding vector(1536),
    
    -- Learning lifecycle
    pattern_status VARCHAR(50) DEFAULT 'discovered', -- discovered, tested, validated, active, deprecated
    discovery_method VARCHAR(50) DEFAULT 'ai_analysis', -- ai_analysis, user_feedback, system_observation
    ai_model_version TEXT,
    learning_generation INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_validated_at TIMESTAMP,
    
    CONSTRAINT fk_patterns_org FOREIGN KEY (organization_id) REFERENCES core_organizations(id)
);

-- AI Performance Tracking for Smart Codes
CREATE TABLE ai_smart_code_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    smart_code TEXT NOT NULL,
    transaction_id UUID,
    
    -- Performance metrics
    processing_time_ms INTEGER,
    ai_confidence_score FLOAT,
    business_outcome_score FLOAT,
    user_satisfaction INTEGER, -- 1-5 rating
    error_occurred BOOLEAN DEFAULT false,
    error_details JSONB,
    
    -- Context at time of execution
    execution_context JSONB,
    business_factors JSONB,
    
    -- Learning feedback
    requires_improvement BOOLEAN DEFAULT false,
    improvement_suggestions JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_performance_org FOREIGN KEY (organization_id) REFERENCES core_organizations(id),
    CONSTRAINT fk_performance_transaction FOREIGN KEY (transaction_id) REFERENCES universal_transactions(id)
);

-- Indexes for AI performance
CREATE INDEX idx_ai_context_org_signature ON ai_business_context_intelligence(organization_id, context_signature);
CREATE INDEX idx_ai_context_embedding ON ai_business_context_intelligence USING ivfflat (context_embedding vector_cosine_ops);
CREATE INDEX idx_ai_patterns_org_code ON ai_smart_code_patterns(organization_id, base_smart_code);
CREATE INDEX idx_ai_patterns_embedding ON ai_smart_code_patterns USING ivfflat (pattern_embedding vector_cosine_ops);
CREATE INDEX idx_ai_performance_code ON ai_smart_code_performance(organization_id, smart_code, created_at DESC);

-- ============================================================================
-- AI CONTEXT INTELLIGENCE FUNCTIONS
-- ============================================================================

-- Generate AI embeddings for business context (placeholder for real AI integration)
CREATE OR REPLACE FUNCTION ai_generate_context_embedding(context_data JSONB)
RETURNS vector AS $$
DECLARE
    embedding_array FLOAT[];
    i INTEGER;
    context_hash BIGINT;
    random_seed FLOAT;
BEGIN
    -- Generate deterministic pseudo-embedding based on context
    -- In production, this would call actual AI API (OpenAI, Claude, etc.)
    
    context_hash := abs(hashtext(context_data::TEXT));
    random_seed := (context_hash % 10000) / 10000.0;
    
    embedding_array := ARRAY[]::FLOAT[];
    
    -- Generate 1536-dimensional embedding with business context influence
    FOR i IN 1..1536 LOOP
        embedding_array := array_append(embedding_array, 
            (sin(i * random_seed * 3.14159) + cos(i * random_seed * 2.71828)) / 2.0 +
            CASE 
                WHEN context_data ? 'customer_tier' THEN 
                    CASE context_data->>'customer_tier'
                        WHEN 'VIP' THEN 0.3
                        WHEN 'Premium' THEN 0.2
                        WHEN 'Standard' THEN 0.1
                        ELSE 0.0
                    END
                ELSE 0.0
            END +
            CASE 
                WHEN context_data ? 'transaction_size' THEN
                    LEAST((context_data->>'transaction_size')::FLOAT / 100000.0, 0.3)
                ELSE 0.0
            END
        );
    END LOOP;
    
    RETURN embedding_array::vector;
END;
$$ LANGUAGE plpgsql;

-- AI Customer Intelligence Analysis
CREATE OR REPLACE FUNCTION ai_analyze_customer_context(
    customer_id UUID,
    transaction_amount NUMERIC,
    organization_id UUID
) RETURNS TEXT AS $$
DECLARE
    customer_profile RECORD;
    context_intelligence TEXT;
    transaction_history RECORD;
BEGIN
    -- Analyze customer transaction patterns
    SELECT 
        COUNT(*) as total_transactions,
        AVG(total_amount) as avg_transaction,
        MAX(total_amount) as max_transaction,
        MIN(created_at) as first_transaction,
        MAX(created_at) as last_transaction,
        EXTRACT(days FROM NOW() - MAX(created_at)) as days_since_last
    INTO transaction_history
    FROM universal_transactions
    WHERE organization_id = organization_id
    AND transaction_metadata->>'customer_id' = customer_id::TEXT
    AND created_at > NOW() - INTERVAL '2 years';
    
    -- AI determines customer intelligence classification
    context_intelligence := CASE
        -- VIP Customer Analysis
        WHEN transaction_history.total_transactions > 50 AND 
             transaction_history.avg_transaction > 1000 AND
             transaction_amount > transaction_history.avg_transaction * 1.5 THEN
            'VIP.LARGE'
            
        WHEN transaction_history.total_transactions > 20 AND
             transaction_history.avg_transaction > 500 AND
             transaction_amount > transaction_history.avg_transaction THEN
            'VIP.STANDARD'
            
        -- Churn Risk Analysis
        WHEN transaction_history.days_since_last > 180 AND 
             transaction_history.total_transactions > 10 THEN
            'CHURN_RISK.REACTIVATION'
            
        -- New Customer Analysis  
        WHEN transaction_history.total_transactions <= 3 THEN
            'NEW.ACQUISITION'
            
        -- High Value Analysis
        WHEN transaction_amount > transaction_history.max_transaction THEN
            'HIGH_VALUE.PEAK'
            
        -- Loyal Customer Analysis
        WHEN transaction_history.total_transactions > 100 AND
             transaction_history.days_since_last < 30 THEN
            'LOYAL.FREQUENT'
            
        -- Standard Analysis
        ELSE
            'STANDARD.NORMAL'
    END;
    
    -- Store context intelligence for learning
    INSERT INTO ai_business_context_intelligence (
        organization_id,
        context_signature,
        context_factors,
        context_embedding
    ) VALUES (
        organization_id,
        'CUSTOMER_INTELLIGENCE',
        jsonb_build_object(
            'customer_id', customer_id,
            'context_classification', context_intelligence,
            'transaction_amount', transaction_amount,
            'customer_stats', row_to_json(transaction_history)
        ),
        ai_generate_context_embedding(
            jsonb_build_object(
                'customer_tier', split_part(context_intelligence, '.', 1),
                'transaction_size', transaction_amount
            )
        )
    ) ON CONFLICT (organization_id, context_signature) DO UPDATE SET
        usage_frequency = ai_business_context_intelligence.usage_frequency + 1,
        updated_at = NOW();
    
    RETURN context_intelligence;
END;
$$ LANGUAGE plpgsql;

-- AI Business Temporal Context Analysis
CREATE OR REPLACE FUNCTION ai_analyze_temporal_context(
    organization_id UUID,
    transaction_date TIMESTAMP,
    transaction_amount NUMERIC
) RETURNS TEXT AS $$
DECLARE
    temporal_context TEXT;
    business_patterns RECORD;
    hour_of_day INTEGER;
    day_of_week INTEGER;
    day_of_month INTEGER;
    month_of_year INTEGER;
BEGIN
    hour_of_day := EXTRACT(hour FROM transaction_date);
    day_of_week := EXTRACT(dow FROM transaction_date);
    day_of_month := EXTRACT(day FROM transaction_date);
    month_of_year := EXTRACT(month FROM transaction_date);
    
    -- Analyze historical patterns for temporal intelligence
    SELECT 
        AVG(total_amount) as avg_amount_this_hour,
        COUNT(*) as transactions_this_hour,
        AVG(CASE WHEN EXTRACT(hour FROM created_at) = hour_of_day THEN total_amount END) as historical_hourly_avg
    INTO business_patterns
    FROM universal_transactions
    WHERE organization_id = organization_id
    AND created_at > NOW() - INTERVAL '90 days'
    AND EXTRACT(dow FROM created_at) = day_of_week;
    
    -- AI determines temporal context
    temporal_context := CASE
        -- End of day/month/quarter/year urgency
        WHEN hour_of_day >= 17 AND day_of_month >= 28 THEN 'EOM.RUSH'
        WHEN hour_of_day >= 16 AND day_of_month IN (30, 31) AND month_of_year IN (3, 6, 9, 12) THEN 'EOQ.CRITICAL'
        WHEN hour_of_day >= 15 AND day_of_month = 31 AND month_of_year = 12 THEN 'EOY.CRITICAL'
        
        -- Peak business hours
        WHEN hour_of_day BETWEEN 9 AND 17 AND day_of_week BETWEEN 1 AND 5 THEN 'PEAK.BUSINESS'
        WHEN hour_of_day BETWEEN 18 AND 22 AND day_of_week IN (0, 6) THEN 'PEAK.WEEKEND'
        
        -- After hours
        WHEN hour_of_day < 6 OR hour_of_day > 22 THEN 'AFTERHOURS.URGENT'
        
        -- Holiday seasons (simplified)
        WHEN month_of_year = 12 AND day_of_month > 15 THEN 'HOLIDAY.PEAK'
        WHEN month_of_year = 1 AND day_of_month < 15 THEN 'NEWYEAR.RUSH'
        
        -- Standard business time
        ELSE 'STANDARD.NORMAL'
    END;
    
    -- Add transaction size context
    IF transaction_amount > COALESCE(business_patterns.historical_hourly_avg * 2, 1000) THEN
        temporal_context := temporal_context || '.LARGE';
    ELSIF transaction_amount < COALESCE(business_patterns.historical_hourly_avg * 0.5, 100) THEN
        temporal_context := temporal_context || '.SMALL';
    ELSE
        temporal_context := temporal_context || '.NORMAL';
    END IF;
    
    RETURN temporal_context;
END;
$$ LANGUAGE plpgsql;

-- AI Risk Assessment Context
CREATE OR REPLACE FUNCTION ai_analyze_risk_context(
    organization_id UUID,
    transaction_data JSONB,
    customer_context TEXT
) RETURNS TEXT AS $$
DECLARE
    risk_context TEXT;
    transaction_amount NUMERIC;
    risk_score FLOAT := 0.0;
    risk_factors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    transaction_amount := (transaction_data->>'total_amount')::NUMERIC;
    
    -- Analyze multiple risk dimensions
    
    -- Amount-based risk
    IF transaction_amount > 10000 THEN
        risk_score := risk_score + 0.3;
        risk_factors := array_append(risk_factors, 'HIGH_AMOUNT');
    ELSIF transaction_amount > 5000 THEN
        risk_score := risk_score + 0.1;
        risk_factors := array_append(risk_factors, 'MEDIUM_AMOUNT');
    END IF;
    
    -- Customer-based risk
    IF customer_context LIKE '%CHURN_RISK%' THEN
        risk_score := risk_score + 0.4;
        risk_factors := array_append(risk_factors, 'CHURN_CUSTOMER');
    ELSIF customer_context LIKE '%NEW%' THEN
        risk_score := risk_score + 0.2;
        risk_factors := array_append(risk_factors, 'NEW_CUSTOMER');
    END IF;
    
    -- Payment method risk (if available)
    IF transaction_data ? 'payment_method' THEN
        CASE transaction_data->>'payment_method'
            WHEN 'wire_transfer' THEN
                IF transaction_amount > 50000 THEN
                    risk_score := risk_score + 0.5;
                    risk_factors := array_append(risk_factors, 'LARGE_WIRE');
                END IF;
            WHEN 'cash' THEN
                IF transaction_amount > 10000 THEN
                    risk_score := risk_score + 0.3;
                    risk_factors := array_append(risk_factors, 'LARGE_CASH');
                END IF;
            ELSE NULL;
        END CASE;
    END IF;
    
    -- International transaction risk
    IF transaction_data ? 'country' AND transaction_data->>'country' != 'US' THEN
        risk_score := risk_score + 0.2;
        risk_factors := array_append(risk_factors, 'INTERNATIONAL');
    END IF;
    
    -- AI determines overall risk classification
    risk_context := CASE
        WHEN risk_score >= 0.7 THEN 'CRITICAL'
        WHEN risk_score >= 0.5 THEN 'HIGH'
        WHEN risk_score >= 0.3 THEN 'MEDIUM'
        WHEN risk_score >= 0.1 THEN 'LOW'
        ELSE 'MINIMAL'
    END;
    
    -- Add specific risk factors to context
    IF array_length(risk_factors, 1) > 0 THEN
        risk_context := risk_context || '.' || array_to_string(risk_factors, '_');
    END IF;
    
    RETURN risk_context;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AI SMART CODE EVOLUTION ENGINE
-- ============================================================================

-- Generate Enhanced Smart Code with AI Intelligence
CREATE OR REPLACE FUNCTION ai_generate_enhanced_smart_code(
    base_smart_code TEXT,
    transaction_data JSONB,
    organization_id UUID
) RETURNS TEXT AS $$
DECLARE
    code_parts TEXT[];
    customer_context TEXT := '';
    temporal_context TEXT := '';
    risk_context TEXT := '';
    enhanced_code TEXT;
    customer_id UUID;
    transaction_amount NUMERIC;
    transaction_date TIMESTAMP;
BEGIN
    -- Extract base Smart Code components
    code_parts := string_to_array(base_smart_code, '.');
    
    -- Extract transaction details
    customer_id := (transaction_data->>'customer_id')::UUID;
    transaction_amount := COALESCE((transaction_data->>'total_amount')::NUMERIC, 0);
    transaction_date := COALESCE((transaction_data->>'transaction_date')::TIMESTAMP, NOW());
    
    -- Generate AI-powered context intelligence
    IF customer_id IS NOT NULL THEN
        customer_context := ai_analyze_customer_context(customer_id, transaction_amount, organization_id);
    END IF;
    
    temporal_context := ai_analyze_temporal_context(organization_id, transaction_date, transaction_amount);
    risk_context := ai_analyze_risk_context(organization_id, transaction_data, customer_context);
    
    -- Construct enhanced Smart Code
    enhanced_code := array_to_string(code_parts[1:4], '.');  -- Base: HERA.MODULE.PROCESS.TYPE
    
    -- Add AI-generated context layers
    IF customer_context != '' THEN
        enhanced_code := enhanced_code || '.' || customer_context;
    END IF;
    
    IF temporal_context != '' THEN
        enhanced_code := enhanced_code || '.' || temporal_context;
    END IF;
    
    IF risk_context != '' THEN
        enhanced_code := enhanced_code || '.' || risk_context;
    END IF;
    
    -- Add AI metadata
    enhanced_code := enhanced_code || '.ai2024.V1.conf' || 
        CASE 
            WHEN customer_context != '' AND temporal_context != '' AND risk_context != '' THEN '95'
            WHEN customer_context != '' AND (temporal_context != '' OR risk_context != '') THEN '85'
            WHEN customer_context != '' OR temporal_context != '' OR risk_context != '' THEN '75'
            ELSE '65'
        END;
    
    -- Store the enhanced pattern for future learning
    INSERT INTO ai_smart_code_patterns (
        organization_id,
        pattern_signature,
        base_smart_code,
        enhanced_smart_code,
        business_context,
        transaction_characteristics,
        discovery_confidence,
        pattern_embedding
    ) VALUES (
        organization_id,
        'AI_ENHANCED_' || array_to_string(code_parts[1:2], '_'),
        base_smart_code,
        enhanced_code,
        jsonb_build_object(
            'customer_context', customer_context,
            'temporal_context', temporal_context,
            'risk_context', risk_context
        ),
        transaction_data,
        CASE 
            WHEN customer_context != '' AND temporal_context != '' AND risk_context != '' THEN 0.95
            WHEN customer_context != '' AND (temporal_context != '' OR risk_context != '') THEN 0.85
            ELSE 0.75
        END,
        ai_generate_context_embedding(
            jsonb_build_object(
                'base_code', base_smart_code,
                'customer_context', customer_context,
                'temporal_context', temporal_context,
                'risk_context', risk_context
            )
        )
    ) ON CONFLICT (organization_id, pattern_signature) DO UPDATE SET
        usage_success_rate = (ai_smart_code_patterns.usage_success_rate * 0.9) + (0.1),
        updated_at = NOW();
    
    RETURN enhanced_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AI SMART CODE LEARNING AND OPTIMIZATION
-- ============================================================================

-- AI discovers new Smart Code patterns from successful transactions
CREATE OR REPLACE FUNCTION ai_discover_smart_code_patterns()
RETURNS INTEGER AS $$
DECLARE
    pattern_candidate RECORD;
    new_patterns_found INTEGER := 0;
    pattern_signature TEXT;
    confidence_score FLOAT;
BEGIN
    -- Analyze high-performing transactions to discover new patterns
    FOR pattern_candidate IN 
        SELECT 
            t.organization_id,
            t.smart_code,
            t.posting_status,
            AVG(t.ai_confidence_score) as avg_confidence,
            COUNT(*) as frequency,
            STDDEV(t.ai_confidence_score) as confidence_stability,
            jsonb_agg(DISTINCT t.transaction_metadata) as context_variations,
            AVG(p.processing_time_ms) as avg_processing_time,
            AVG(p.business_outcome_score) as avg_outcome_score
        FROM universal_transactions t
        LEFT JOIN ai_smart_code_performance p ON p.transaction_id = t.id
        WHERE t.created_at > NOW() - INTERVAL '7 days'
        AND t.posting_status = 'auto_posted'
        AND t.ai_confidence_score > 0.9
        GROUP BY t.organization_id, t.smart_code, t.posting_status
        HAVING COUNT(*) >= 20 
        AND AVG(t.ai_confidence_score) > 0.92
        AND COALESCE(AVG(p.business_outcome_score), 0.8) > 0.85
    LOOP
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
                    'context_variations', pattern_candidate.context_variations
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

-- AI validates and promotes discovered patterns
CREATE OR REPLACE FUNCTION ai_validate_smart_code_patterns()
RETURNS INTEGER AS $$
DECLARE
    pattern_record RECORD;
    validation_score FLOAT;
    patterns_validated INTEGER := 0;
BEGIN
    -- Validate discovered patterns that have sufficient usage
    FOR pattern_record IN 
        SELECT 
            p.*,
            COUNT(t.id) as usage_count,
            AVG(t.ai_confidence_score) as validation_confidence,
            AVG(perf.business_outcome_score) as avg_business_outcome
        FROM ai_smart_code_patterns p
        LEFT JOIN universal_transactions t ON t.smart_code LIKE p.enhanced_smart_code || '%'
        LEFT JOIN ai_smart_code_performance perf ON perf.transaction_id = t.id
        WHERE p.pattern_status = 'discovered'
        AND p.created_at < NOW() - INTERVAL '3 days'
        GROUP BY p.id
        HAVING COUNT(t.id) >= 10
    LOOP
        -- Calculate validation score
        validation_score := (
            COALESCE(pattern_record.validation_confidence, 0.7) * 0.4 +
            COALESCE(pattern_record.avg_business_outcome, 0.7) * 0.3 +
            LEAST(pattern_record.usage_count / 20.0, 1.0) * 0.3
        );
        
        -- Validate pattern if score is high enough
        IF validation_score > 0.8 THEN
            UPDATE ai_smart_code_patterns 
            SET 
                pattern_status = 'validated',
                validation_confidence = validation_score,
                last_validated_at = NOW(),
                updated_at = NOW()
            WHERE id = pattern_record.id;
            
            patterns_validated := patterns_validated + 1;
        ELSIF validation_score < 0.5 THEN
            -- Mark poor patterns for deprecation
            UPDATE ai_smart_code_patterns 
            SET 
                pattern_status = 'deprecated',
                updated_at = NOW()
            WHERE id = pattern_record.id;
        END IF;
    END LOOP;
    
    RETURN patterns_validated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AI SMART CODE PERFORMANCE TRACKING
-- ============================================================================

-- Track Smart Code execution performance
CREATE OR REPLACE FUNCTION ai_track_smart_code_performance(
    p_transaction_id UUID,
    p_smart_code TEXT,
    p_processing_time_ms INTEGER,
    p_confidence_score FLOAT,
    p_business_outcome_score FLOAT DEFAULT NULL,
    p_execution_context JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get organization ID from transaction
    SELECT organization_id INTO org_id 
    FROM universal_transactions 
    WHERE id = p_transaction_id;
    
    -- Insert performance tracking record
    INSERT INTO ai_smart_code_performance (
        organization_id,
        smart_code,
        transaction_id,
        processing_time_ms,
        ai_confidence_score,
        business_outcome_score,
        execution_context
    ) VALUES (
        org_id,
        p_smart_code,
        p_transaction_id,
        p_processing_time_ms,
        p_confidence_score,
        p_business_outcome_score,
        p_execution_context
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED AI LEARNING PIPELINE
-- ============================================================================

-- Comprehensive AI learning pipeline (runs every 4 hours)
CREATE OR REPLACE FUNCTION ai_smart_code_learning_pipeline()
RETURNS JSONB AS $$
DECLARE
    patterns_discovered INTEGER;
    patterns_validated INTEGER;
    pipeline_results JSONB;
    start_time TIMESTAMP;
    execution_time INTERVAL;
BEGIN
    start_time := NOW();
    
    -- Step 1: Discover new patterns
    SELECT ai_discover_smart_code_patterns() INTO patterns_discovered;
    
    -- Step 2: Validate existing patterns
    SELECT ai_validate_smart_code_patterns() INTO patterns_validated;
    
    -- Step 3: Clean up old, unused patterns
    DELETE FROM ai_smart_code_patterns 
    WHERE pattern_status = 'deprecated' 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    -- Step 4: Update context intelligence usage stats
    UPDATE ai_business_context_intelligence 
    SET usage_frequency = usage_frequency + 1,
        last_used_at = NOW()
    WHERE context_signature IN (
        SELECT DISTINCT 'CUSTOMER_INTELLIGENCE'
        FROM universal_transactions 
        WHERE created_at > NOW() - INTERVAL '4 hours'
    );
    
    execution_time := NOW() - start_time;
    
    pipeline_results := jsonb_build_object(
        'execution_timestamp', NOW(),
        'execution_time_seconds', EXTRACT(epoch FROM execution_time),
        'patterns_discovered', patterns_discovered,
        'patterns_validated', patterns_validated,
        'pipeline_status', 'success',
        'next_run_scheduled', NOW() + INTERVAL '4 hours'
    );
    
    -- Log pipeline execution
    RAISE NOTICE 'AI Smart Code Learning Pipeline completed: %', pipeline_results;
    
    RETURN pipeline_results;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'execution_timestamp', NOW(),
            'pipeline_status', 'error',
            'error_message', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- Schedule AI learning pipeline to run every 4 hours
SELECT cron.schedule('ai-smart-code-learning', '0 */4 * * *', 'SELECT ai_smart_code_learning_pipeline();');

-- ============================================================================
-- AI ANALYTICS AND REPORTING
-- ============================================================================

-- Get AI Smart Code performance analytics
CREATE OR REPLACE FUNCTION get_ai_smart_code_analytics(
    p_organization_id UUID,
    p_days_back INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    analytics JSONB;
    performance_stats RECORD;
    top_patterns JSONB;
BEGIN
    -- Calculate overall Smart Code AI performance
    SELECT 
        COUNT(DISTINCT smart_code) as unique_codes,
        AVG(ai_confidence_score) as avg_confidence,
        AVG(processing_time_ms) as avg_processing_time,
        COUNT(*) as total_executions,
        SUM(CASE WHEN error_occurred THEN 1 ELSE 0 END) as error_count,
        AVG(COALESCE(business_outcome_score, 0.8)) as avg_business_outcome
    INTO performance_stats
    FROM ai_smart_code_performance
    WHERE organization_id = p_organization_id
    AND created_at > NOW() - (p_days_back || ' days')::INTERVAL;
    
    -- Get top performing Smart Code patterns
    SELECT jsonb_agg(
        jsonb_build_object(
            'smart_code', smart_code,
            'execution_count', execution_count,
            'avg_confidence', avg_confidence,
            'avg_processing_time', avg_processing_time,
            'success_rate', success_rate
        )
    ) INTO top_patterns
    FROM (
        SELECT 
            smart_code,
            COUNT(*) as execution_count,
            AVG(ai_confidence_score) as avg_confidence,
            AVG(processing_time_ms) as avg_processing_time,
            (1.0 - (SUM(CASE WHEN error_occurred THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT)) as success_rate
        FROM ai_smart_code_performance
        WHERE organization_id = p_organization_id
        AND created_at > NOW() - (p_days_back || ' days')::INTERVAL
        GROUP BY smart_code
        ORDER BY execution_count DESC, avg_confidence DESC
        LIMIT 10
    ) top_codes;
    
    analytics := jsonb_build_object(
        'period_days', p_days_back,
        'overall_performance', row_to_json(performance_stats),
        'top_smart_code_patterns', COALESCE(top_patterns, '[]'::JSONB),
        'ai_learning_stats', jsonb_build_object(
            'patterns_discovered', (
                SELECT COUNT(*) FROM ai_smart_code_patterns 
                WHERE organization_id = p_organization_id 
                AND pattern_status = 'discovered'
                AND created_at > NOW() - (p_days_back || ' days')::INTERVAL
            ),
            'patterns_validated', (
                SELECT COUNT(*) FROM ai_smart_code_patterns 
                WHERE organization_id = p_organization_id 
                AND pattern_status = 'validated'
                AND last_validated_at > NOW() - (p_days_back || ' days')::INTERVAL
            ),
            'active_patterns', (
                SELECT COUNT(*) FROM ai_smart_code_patterns 
                WHERE organization_id = p_organization_id 
                AND pattern_status IN ('validated', 'active')
            )
        ),
        'generated_at', NOW()
    );
    
    RETURN analytics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SETUP AND INITIALIZATION
-- ============================================================================

-- Initialize AI Smart Code system for an organization
CREATE OR REPLACE FUNCTION setup_ai_smart_code_system(
    p_organization_id UUID
) RETURNS JSONB AS $$
DECLARE
    setup_results JSONB;
    base_patterns_created INTEGER := 0;
BEGIN
    -- Create base AI intelligence contexts
    INSERT INTO ai_business_context_intelligence (
        organization_id,
        context_signature,
        context_factors,
        context_embedding
    ) VALUES
    (p_organization_id, 'CUSTOMER_INTELLIGENCE', 
     '{"type": "customer_analysis", "enabled": true}'::JSONB,
     ai_generate_context_embedding('{"type": "customer_analysis"}'::JSONB)),
    (p_organization_id, 'TEMPORAL_INTELLIGENCE',
     '{"type": "temporal_analysis", "enabled": true}'::JSONB, 
     ai_generate_context_embedding('{"type": "temporal_analysis"}'::JSONB)),
    (p_organization_id, 'RISK_INTELLIGENCE',
     '{"type": "risk_analysis", "enabled": true}'::JSONB,
     ai_generate_context_embedding('{"type": "risk_analysis"}'::JSONB))
    ON CONFLICT (organization_id, context_signature) DO NOTHING;
    
    GET DIAGNOSTICS base_patterns_created = ROW_COUNT;
    
    setup_results := jsonb_build_object(
        'organization_id', p_organization_id,
        'base_contexts_created', base_patterns_created,
        'ai_learning_enabled', true,
        'setup_completed_at', NOW(),
        'status', 'success'
    );
    
    RETURN setup_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS AND PERMISSIONS
-- ============================================================================

COMMENT ON TABLE ai_business_context_intelligence IS 'AI-powered business context analysis and intelligence storage';
COMMENT ON TABLE ai_smart_code_patterns IS 'AI-discovered and learned Smart Code patterns with performance tracking';
COMMENT ON TABLE ai_smart_code_performance IS 'Real-time performance tracking for AI-enhanced Smart Codes';

COMMENT ON FUNCTION ai_generate_enhanced_smart_code IS 'Core AI function that generates context-aware, intelligent Smart Codes';
COMMENT ON FUNCTION ai_discover_smart_code_patterns IS 'AI pattern discovery engine that learns from successful transactions';
COMMENT ON FUNCTION ai_smart_code_learning_pipeline IS 'Comprehensive AI learning pipeline for continuous Smart Code improvement';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON ai_business_context_intelligence TO authenticated;
GRANT SELECT ON ai_smart_code_patterns TO authenticated;
GRANT SELECT, INSERT ON ai_smart_code_performance TO authenticated;
GRANT EXECUTE ON FUNCTION ai_generate_enhanced_smart_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_smart_code_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION setup_ai_smart_code_system TO authenticated;