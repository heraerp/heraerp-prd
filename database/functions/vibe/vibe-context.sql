-- HERA 100% Vibe Coding System - Database Functions
-- Smart Code: HERA.VIBE.FOUNDATION.DATABASE.FUNCTIONS.V1
-- Purpose: PostgreSQL functions for vibe context management and storage

-- Create vibe context preservation function
CREATE OR REPLACE FUNCTION preserve_vibe_context(
    p_organization_id UUID,
    p_session_id TEXT,
    p_smart_code TEXT,
    p_user_intent TEXT,
    p_conversation_state JSONB DEFAULT '{}',
    p_task_lineage TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_code_evolution JSONB DEFAULT '[]',
    p_relationship_map JSONB DEFAULT '{}',
    p_business_context JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    context_entity_id UUID;
    context_code TEXT;
BEGIN
    -- Generate unique context code
    context_code := 'VIBE-CTX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
    
    -- Create context entity in core_entities
    INSERT INTO core_entities (
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        description,
        status,
        organization_id,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        'vibe_context',
        'Vibe Context: ' || COALESCE(p_user_intent, 'Preserved Context'),
        context_code,
        p_smart_code,
        p_user_intent,
        'active',
        p_organization_id,
        jsonb_build_object(
            'session_id', p_session_id,
            'preservation_timestamp', NOW(),
            'context_type', 'vibe_context',
            'smart_code_category', split_part(p_smart_code, '.', 3)
        ),
        NOW(),
        NOW()
    ) RETURNING id INTO context_entity_id;
    
    -- Store conversation state in core_dynamic_data
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_at
    ) VALUES (
        context_entity_id,
        'conversation_state',
        'json',
        p_conversation_state,
        'HERA.VIBE.CONTEXT.DATA.CONVERSATION.V1',
        p_organization_id,
        NOW()
    );
    
    -- Store task lineage
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_at
    ) VALUES (
        context_entity_id,
        'task_lineage',
        'json',
        to_jsonb(p_task_lineage),
        'HERA.VIBE.CONTEXT.DATA.LINEAGE.V1',
        p_organization_id,
        NOW()
    );
    
    -- Store code evolution
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_at
    ) VALUES (
        context_entity_id,
        'code_evolution',
        'json',
        p_code_evolution,
        'HERA.VIBE.CONTEXT.DATA.EVOLUTION.V1',
        p_organization_id,
        NOW()
    );
    
    -- Store relationship map
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_at
    ) VALUES (
        context_entity_id,
        'relationship_map',
        'json',
        p_relationship_map,
        'HERA.VIBE.CONTEXT.DATA.RELATIONSHIPS.V1',
        p_organization_id,
        NOW()
    );
    
    -- Store business context
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_at
    ) VALUES (
        context_entity_id,
        'business_context',
        'json',
        p_business_context,
        'HERA.VIBE.CONTEXT.DATA.BUSINESS.V1',
        p_organization_id,
        NOW()
    );
    
    -- Log context preservation as transaction
    INSERT INTO universal_transactions (
        transaction_type,
        smart_code,
        organization_id,
        reference_entity_id,
        total_amount,
        metadata,
        created_at
    ) VALUES (
        'vibe_context_preservation',
        'HERA.VIBE.TRANSACTION.PRESERVE.CONTEXT.V1',
        p_organization_id,
        context_entity_id,
        1.0, -- Count as 1 preserved context
        jsonb_build_object(
            'session_id', p_session_id,
            'context_smart_code', p_smart_code,
            'user_intent', p_user_intent,
            'preservation_method', 'database_function'
        ),
        NOW()
    );
    
    RETURN context_entity_id;
END;
$$;

-- Create vibe context restoration function
CREATE OR REPLACE FUNCTION restore_vibe_context(
    p_context_entity_id UUID,
    p_organization_id UUID
)
RETURNS TABLE (
    entity_id UUID,
    smart_code TEXT,
    user_intent TEXT,
    session_id TEXT,
    conversation_state JSONB,
    task_lineage TEXT[],
    code_evolution JSONB,
    relationship_map JSONB,
    business_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    context_record RECORD;
BEGIN
    -- Get context entity
    SELECT 
        ce.id,
        ce.smart_code,
        ce.description,
        ce.metadata->>'session_id',
        ce.created_at
    INTO context_record
    FROM core_entities ce
    WHERE ce.id = p_context_entity_id
      AND ce.organization_id = p_organization_id
      AND ce.entity_type = 'vibe_context'
      AND ce.status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vibe context not found or access denied';
    END IF;
    
    -- Return context data by joining with dynamic data
    RETURN QUERY
    SELECT 
        context_record.id,
        context_record.smart_code,
        context_record.description,
        context_record.session_id,
        COALESCE(conv_state.field_value_json, '{}'::jsonb) AS conversation_state,
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(task_lin.field_value_json)),
            ARRAY[]::TEXT[]
        ) AS task_lineage,
        COALESCE(code_evo.field_value_json, '[]'::jsonb) AS code_evolution,
        COALESCE(rel_map.field_value_json, '{}'::jsonb) AS relationship_map,
        COALESCE(bus_ctx.field_value_json, '{}'::jsonb) AS business_context,
        context_record.created_at
    FROM 
        (SELECT 1) AS dummy
    LEFT JOIN core_dynamic_data conv_state ON 
        conv_state.entity_id = context_record.id AND 
        conv_state.field_name = 'conversation_state'
    LEFT JOIN core_dynamic_data task_lin ON 
        task_lin.entity_id = context_record.id AND 
        task_lin.field_name = 'task_lineage'
    LEFT JOIN core_dynamic_data code_evo ON 
        code_evo.entity_id = context_record.id AND 
        code_evo.field_name = 'code_evolution'
    LEFT JOIN core_dynamic_data rel_map ON 
        rel_map.entity_id = context_record.id AND 
        rel_map.field_name = 'relationship_map'
    LEFT JOIN core_dynamic_data bus_ctx ON 
        bus_ctx.entity_id = context_record.id AND 
        bus_ctx.field_name = 'business_context';
    
    -- Log context restoration
    INSERT INTO universal_transactions (
        transaction_type,
        smart_code,
        organization_id,
        reference_entity_id,
        total_amount,
        metadata,
        created_at
    ) VALUES (
        'vibe_context_restoration',
        'HERA.VIBE.TRANSACTION.RESTORE.CONTEXT.V1',
        p_organization_id,
        p_context_entity_id,
        1.0, -- Count as 1 restored context
        jsonb_build_object(
            'restoration_timestamp', NOW(),
            'restoration_method', 'database_function'
        ),
        NOW()
    );
END;
$$;

-- Create vibe integration preservation function
CREATE OR REPLACE FUNCTION preserve_vibe_integration(
    p_organization_id UUID,
    p_source_smart_code TEXT,
    p_target_smart_code TEXT,
    p_weave_pattern TEXT,
    p_integration_smart_code TEXT,
    p_compatibility_matrix JSONB DEFAULT '{}',
    p_error_recovery JSONB DEFAULT '{}',
    p_performance_impact JSONB DEFAULT '{}',
    p_rollback_strategy JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    integration_entity_id UUID;
    source_entity_id UUID;
    target_entity_id UUID;
    integration_code TEXT;
BEGIN
    -- Find source and target entities by smart code
    SELECT id INTO source_entity_id
    FROM core_entities
    WHERE smart_code = p_source_smart_code
      AND organization_id = p_organization_id
    LIMIT 1;
    
    SELECT id INTO target_entity_id
    FROM core_entities
    WHERE smart_code = p_target_smart_code
      AND organization_id = p_organization_id
    LIMIT 1;
    
    -- Generate unique integration code
    integration_code := 'VIBE-INT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
    
    -- Create integration entity
    INSERT INTO core_entities (
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        description,
        status,
        organization_id,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        'vibe_integration',
        'Integration: ' || p_source_smart_code || ' → ' || p_target_smart_code,
        integration_code,
        p_integration_smart_code,
        'Vibe integration weaving: ' || p_weave_pattern,
        'active',
        p_organization_id,
        jsonb_build_object(
            'weave_pattern', p_weave_pattern,
            'source_smart_code', p_source_smart_code,
            'target_smart_code', p_target_smart_code,
            'health_status', 'healthy',
            'integration_timestamp', NOW()
        ),
        NOW(),
        NOW()
    ) RETURNING id INTO integration_entity_id;
    
    -- Create relationship if both entities exist
    IF source_entity_id IS NOT NULL AND target_entity_id IS NOT NULL THEN
        INSERT INTO core_relationships (
            parent_entity_id,
            child_entity_id,
            relationship_type,
            smart_code,
            organization_id,
            metadata,
            created_at
        ) VALUES (
            source_entity_id,
            target_entity_id,
            'vibe_integration',
            p_integration_smart_code,
            p_organization_id,
            jsonb_build_object(
                'integration_entity_id', integration_entity_id,
                'weave_pattern', p_weave_pattern,
                'bidirectional', true
            ),
            NOW()
        );
    END IF;
    
    -- Store integration details in dynamic data
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_at
    ) VALUES 
    (
        integration_entity_id,
        'compatibility_matrix',
        'json',
        p_compatibility_matrix,
        'HERA.VIBE.INTEGRATION.DATA.COMPATIBILITY.V1',
        p_organization_id,
        NOW()
    ),
    (
        integration_entity_id,
        'error_recovery',
        'json',
        p_error_recovery,
        'HERA.VIBE.INTEGRATION.DATA.RECOVERY.V1',
        p_organization_id,
        NOW()
    ),
    (
        integration_entity_id,
        'performance_impact',
        'json',
        p_performance_impact,
        'HERA.VIBE.INTEGRATION.DATA.PERFORMANCE.V1',
        p_organization_id,
        NOW()
    ),
    (
        integration_entity_id,
        'rollback_strategy',
        'json',
        p_rollback_strategy,
        'HERA.VIBE.INTEGRATION.DATA.ROLLBACK.V1',
        p_organization_id,
        NOW()
    );
    
    -- Log integration creation as transaction
    INSERT INTO universal_transactions (
        transaction_type,
        smart_code,
        organization_id,
        reference_entity_id,
        total_amount,
        metadata,
        created_at
    ) VALUES (
        'vibe_integration_creation',
        'HERA.VIBE.TRANSACTION.CREATE.INTEGRATION.V1',
        p_organization_id,
        integration_entity_id,
        1.0, -- Count as 1 created integration
        jsonb_build_object(
            'source_smart_code', p_source_smart_code,
            'target_smart_code', p_target_smart_code,
            'weave_pattern', p_weave_pattern,
            'integration_smart_code', p_integration_smart_code
        ),
        NOW()
    );
    
    RETURN integration_entity_id;
END;
$$;

-- Create function to get vibe session statistics
CREATE OR REPLACE FUNCTION get_vibe_session_stats(
    p_organization_id UUID,
    p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    session_id TEXT,
    context_count BIGINT,
    integration_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE,
    session_duration INTERVAL,
    quality_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH session_contexts AS (
        SELECT 
            ce.metadata->>'session_id' AS sid,
            COUNT(*) AS ctx_count,
            MAX(ce.created_at) AS last_ctx_activity
        FROM core_entities ce
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'vibe_context'
          AND ce.status = 'active'
          AND (p_session_id IS NULL OR ce.metadata->>'session_id' = p_session_id)
        GROUP BY ce.metadata->>'session_id'
    ),
    session_integrations AS (
        SELECT 
            ce.metadata->>'session_id' AS sid,
            COUNT(*) AS int_count
        FROM core_entities ce
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'vibe_integration'
          AND ce.status = 'active'
          AND (p_session_id IS NULL OR ce.metadata->>'session_id' = p_session_id)
        GROUP BY ce.metadata->>'session_id'
    ),
    session_start_times AS (
        SELECT 
            ce.metadata->>'session_id' AS sid,
            MIN(ce.created_at) AS start_time
        FROM core_entities ce
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type IN ('vibe_context', 'vibe_integration')
          AND ce.status = 'active'
          AND (p_session_id IS NULL OR ce.metadata->>'session_id' = p_session_id)
        GROUP BY ce.metadata->>'session_id'
    )
    SELECT 
        COALESCE(sc.sid, si.sid, sst.sid) AS session_id,
        COALESCE(sc.ctx_count, 0) AS context_count,
        COALESCE(si.int_count, 0) AS integration_count,
        COALESCE(sc.last_ctx_activity, sst.start_time) AS last_activity,
        COALESCE(NOW() - sst.start_time, INTERVAL '0') AS session_duration,
        95.0::NUMERIC AS quality_score -- Placeholder for calculated quality score
    FROM session_contexts sc
    FULL OUTER JOIN session_integrations si ON sc.sid = si.sid
    FULL OUTER JOIN session_start_times sst ON COALESCE(sc.sid, si.sid) = sst.sid
    ORDER BY last_activity DESC;
END;
$$;

-- Create function to clean up old vibe contexts
CREATE OR REPLACE FUNCTION cleanup_old_vibe_contexts(
    p_organization_id UUID,
    p_older_than_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Archive old vibe contexts by setting status to 'archived'
    UPDATE core_entities
    SET 
        status = 'archived',
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object('archived_at', NOW())
    WHERE organization_id = p_organization_id
      AND entity_type = 'vibe_context'
      AND status = 'active'
      AND created_at < NOW() - (p_older_than_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Log cleanup operation
    INSERT INTO universal_transactions (
        transaction_type,
        smart_code,
        organization_id,
        total_amount,
        metadata,
        created_at
    ) VALUES (
        'vibe_context_cleanup',
        'HERA.VIBE.TRANSACTION.CLEANUP.CONTEXTS.V1',
        p_organization_id,
        cleanup_count::NUMERIC,
        jsonb_build_object(
            'cleanup_date', NOW(),
            'days_threshold', p_older_than_days,
            'contexts_archived', cleanup_count
        ),
        NOW()
    );
    
    RETURN cleanup_count;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION preserve_vibe_context TO authenticated;
GRANT EXECUTE ON FUNCTION restore_vibe_context TO authenticated;
GRANT EXECUTE ON FUNCTION preserve_vibe_integration TO authenticated;
GRANT EXECUTE ON FUNCTION get_vibe_session_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_vibe_contexts TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vibe_contexts_session 
ON core_entities USING btree (organization_id, (metadata->>'session_id')) 
WHERE entity_type = 'vibe_context';

CREATE INDEX IF NOT EXISTS idx_vibe_contexts_smart_code 
ON core_entities USING btree (organization_id, smart_code) 
WHERE entity_type = 'vibe_context';

CREATE INDEX IF NOT EXISTS idx_vibe_integrations_pattern 
ON core_entities USING btree (organization_id, (metadata->>'weave_pattern')) 
WHERE entity_type = 'vibe_integration';

-- Comment on functions
COMMENT ON FUNCTION preserve_vibe_context IS 'HERA Vibe: Preserve context for seamless continuity and amnesia elimination';
COMMENT ON FUNCTION restore_vibe_context IS 'HERA Vibe: Restore preserved context for seamless operation continuation';
COMMENT ON FUNCTION preserve_vibe_integration IS 'HERA Vibe: Preserve component integration weaving for manufacturing-grade quality';
COMMENT ON FUNCTION get_vibe_session_stats IS 'HERA Vibe: Get comprehensive session statistics and quality metrics';
COMMENT ON FUNCTION cleanup_old_vibe_contexts IS 'HERA Vibe: Archive old contexts to maintain optimal performance';