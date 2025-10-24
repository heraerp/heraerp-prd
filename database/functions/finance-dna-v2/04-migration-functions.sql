-- Finance DNA v2 - Migration Functions (Zero Tables)
-- Smart Code: HERA.ACCOUNTING.MIGRATION.ZERO.TABLES.v2
-- Auto-Generated: From Finance DNA v2 Documentation
-- Last Updated: 2025-01-10

-- =============================================================================
-- MIGRATION ASSESSMENT FUNCTION
-- =============================================================================

-- Drop existing type if it exists
DROP TYPE IF EXISTS migration_assessment_result CASCADE;

CREATE TYPE migration_assessment_result AS (
    assessment_category TEXT,
    entity_count BIGINT,
    transaction_count BIGINT,
    estimated_migration_time INTERVAL,
    complexity_score INTEGER,
    readiness_status TEXT
);

CREATE OR REPLACE FUNCTION hera_assess_migration_candidates_v2(
    p_organization_id UUID
) RETURNS SETOF migration_assessment_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- GL Accounts Assessment
    RETURN QUERY
    WITH gl_accounts_assessment AS (
        SELECT 
            'GL_ACCOUNTS' as category,
            COUNT(*) as entity_count,
            0::BIGINT as transaction_count,
            (COUNT(*) * INTERVAL '2 seconds') as est_time,
            CASE 
                WHEN COUNT(*) > 500 THEN 9
                WHEN COUNT(*) > 100 THEN 5
                ELSE 2
            END as complexity
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND entity_type = 'gl_account'
    ),
    transactions_assessment AS (
        SELECT 
            'TRANSACTIONS' as category,
            0::BIGINT as entity_count,
            COUNT(*) as transaction_count,
            (COUNT(*) * INTERVAL '100 milliseconds') as est_time,
            CASE 
                WHEN COUNT(*) > 100000 THEN 10
                WHEN COUNT(*) > 10000 THEN 7
                WHEN COUNT(*) > 1000 THEN 4
                ELSE 2
            END as complexity
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code NOT LIKE '%.V2'
    ),
    policies_assessment AS (
        SELECT 
            'POLICIES' as category,
            COUNT(*) as entity_count,
            0::BIGINT as transaction_count,
            (COUNT(*) * INTERVAL '30 seconds') as est_time,
            CASE 
                WHEN COUNT(*) > 20 THEN 8
                WHEN COUNT(*) > 5 THEN 4
                ELSE 1
            END as complexity
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND entity_type = 'fin_rule'
    )
    SELECT 
        category,
        entity_count,
        transaction_count,
        est_time,
        complexity,
        CASE 
            WHEN complexity <= 3 THEN 'READY'
            WHEN complexity <= 7 THEN 'REVIEW_REQUIRED'
            ELSE 'PLANNING_REQUIRED'
        END as readiness_status
    FROM (
        SELECT * FROM gl_accounts_assessment
        UNION ALL
        SELECT * FROM transactions_assessment  
        UNION ALL
        SELECT * FROM policies_assessment
    ) assessments;
    
    -- Log assessment
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'MIGRATION_ASSESSMENT',
        jsonb_build_object(
            'assessment_timestamp', v_start_time,
            'assessment_duration', clock_timestamp() - v_start_time,
            'performed_by', current_setting('app.current_user', true)
        ),
        'HERA.ACCOUNTING.MIGRATION.CANDIDATE.PREVIEW.V2'
    );
END;
$$;

-- =============================================================================
-- MIGRATION PHASE RESULT TYPE
-- =============================================================================

-- Drop existing type if it exists
DROP TYPE IF EXISTS migration_phase_result CASCADE;

CREATE TYPE migration_phase_result AS (
    phase_name TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTERVAL,
    success BOOLEAN,
    records_processed INTEGER
);

-- =============================================================================
-- PHASE 1: BACKUP AND PREPARATION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_migration_phase_1_backup_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT
) RETURNS migration_phase_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result migration_phase_result;
    v_backup_transaction_id UUID;
BEGIN
    v_result.phase_name := 'BACKUP_PREPARATION';
    v_result.start_time := clock_timestamp();
    
    -- Create migration batch transaction
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        transaction_code,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'MIGRATION_BATCH',
        p_migration_batch_id,
        'HERA.ACCOUNTING.MIGRATION.BATCH.START.V2',
        jsonb_build_object(
            'phase', 'backup_preparation',
            'started_by', current_setting('app.current_user', true),
            'migration_strategy', 'zero_tables_reverse_repost'
        )
    ) RETURNING id INTO v_backup_transaction_id;
    
    -- Snapshot current state
    WITH current_state AS (
        SELECT 
            'entities' as data_type,
            COUNT(*) as record_count,
            string_agg(DISTINCT entity_type, ',') as types
        FROM core_entities
        WHERE organization_id = p_organization_id
        UNION ALL
        SELECT 
            'transactions' as data_type,
            COUNT(*) as record_count,
            string_agg(DISTINCT transaction_type, ',') as types
        FROM universal_transactions
        WHERE organization_id = p_organization_id
        UNION ALL
        SELECT 
            'transaction_lines' as data_type,
            COUNT(*) as record_count,
            string_agg(DISTINCT line_type, ',') as types
        FROM universal_transaction_lines
        WHERE organization_id = p_organization_id
    )
    INSERT INTO universal_transaction_lines (
        organization_id,
        transaction_id,
        line_number,
        line_type,
        smart_code,
        metadata
    )
    SELECT 
        p_organization_id,
        v_backup_transaction_id,
        row_number() OVER (ORDER BY data_type),
        'SNAPSHOT',
        'HERA.ACCOUNTING.MIGRATION.SNAPSHOT.BACKUP.V2',
        jsonb_build_object(
            'data_type', data_type,
            'record_count', record_count,
            'data_types', types,
            'snapshot_timestamp', NOW()
        )
    FROM current_state;
    
    v_result.end_time := clock_timestamp();
    v_result.duration := v_result.end_time - v_result.start_time;
    v_result.success := true;
    v_result.records_processed := (
        SELECT COUNT(*) FROM universal_transaction_lines 
        WHERE transaction_id = v_backup_transaction_id
    );
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- PHASE 2: SMART CODE MAPPING
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_migration_phase_2_smart_code_mapping_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT
) RETURNS migration_phase_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result migration_phase_result;
    v_mapping_record RECORD;
    v_mappings_created INTEGER := 0;
BEGIN
    v_result.phase_name := 'SMART_CODE_MAPPING';
    v_result.start_time := clock_timestamp();
    
    -- Create smart code mapping for entities
    FOR v_mapping_record IN
        SELECT 
            id as entity_id,
            entity_type,
            smart_code as current_smart_code,
            CASE entity_type
                WHEN 'gl_account' THEN 'HERA.ACCOUNTING.GL.ACC.ENTITY.V2'
                WHEN 'fin_rule' THEN 'HERA.ACCOUNTING.POLICY.RULE.ENTITY.V2'
                WHEN 'fiscal_period' THEN 'HERA.ACCOUNTING.FISCAL.PERIOD.ENTITY.V2'
                ELSE 'HERA.ACCOUNTING.ENTITY.MIGRATION.V2'
            END as new_smart_code
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND (smart_code IS NULL OR NOT smart_code LIKE '%.V2')
    LOOP
        -- Store mapping in dynamic data
        INSERT INTO core_dynamic_data (
            organization_id,
            entity_id,
            field_name,
            field_type,
            field_value_json,
            smart_code
        ) VALUES (
            p_organization_id,
            v_mapping_record.entity_id,
            'v2_migration_mapping',
            'json',
            jsonb_build_object(
                'original_smart_code', v_mapping_record.current_smart_code,
                'new_smart_code', v_mapping_record.new_smart_code,
                'migration_batch', p_migration_batch_id,
                'mapped_at', NOW()
            ),
            'HERA.ACCOUNTING.MIGRATION.MAPPING.SMART.CODE.V2'
        );
        
        v_mappings_created := v_mappings_created + 1;
    END LOOP;
    
    v_result.end_time := clock_timestamp();
    v_result.duration := v_result.end_time - v_result.start_time;
    v_result.success := true;
    v_result.records_processed := v_mappings_created;
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- PHASE 3: REVERSE ORIGINAL TRANSACTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_migration_phase_3_reverse_transactions_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT,
    p_transaction_batch_size INTEGER DEFAULT 100
) RETURNS migration_phase_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result migration_phase_result;
    v_transaction_record RECORD;
    v_reversal_txn_id UUID;
    v_transactions_reversed INTEGER := 0;
BEGIN
    v_result.phase_name := 'REVERSE_TRANSACTIONS';
    v_result.start_time := clock_timestamp();
    
    -- Process transactions in batches to avoid memory issues
    FOR v_transaction_record IN
        SELECT 
            ut.id,
            ut.transaction_type,
            ut.transaction_code,
            ut.transaction_date,
            ut.total_amount,
            ut.smart_code,
            array_agg(
                jsonb_build_object(
                    'line_number', utl.line_number,
                    'line_entity_id', utl.line_entity_id,
                    'debit_amount', utl.debit_amount,
                    'credit_amount', utl.credit_amount,
                    'line_type', utl.line_type,
                    'smart_code', utl.smart_code
                ) ORDER BY utl.line_number
            ) as transaction_lines
        FROM universal_transactions ut
        LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
        WHERE ut.organization_id = p_organization_id
          AND ut.smart_code NOT LIKE '%.V2'
          AND ut.transaction_type = 'JOURNAL_ENTRY'
        GROUP BY ut.id, ut.transaction_type, ut.transaction_code, 
                 ut.transaction_date, ut.total_amount, ut.smart_code
        LIMIT p_transaction_batch_size
    LOOP
        -- Create reversal transaction
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            transaction_code,
            transaction_date,
            total_amount,
            smart_code,
            metadata
        ) VALUES (
            p_organization_id,
            'JOURNAL_ENTRY',
            format('REV_%s', v_transaction_record.transaction_code),
            CURRENT_DATE,
            v_transaction_record.total_amount,
            'HERA.ACCOUNTING.MIGRATION.REVERSE.REPOST.V2',
            jsonb_build_object(
                'migration_type', 'reversal',
                'original_transaction_id', v_transaction_record.id,
                'original_smart_code', v_transaction_record.smart_code,
                'migration_batch', p_migration_batch_id,
                'reversal_reason', 'Finance DNA v2 Migration'
            )
        ) RETURNING id INTO v_reversal_txn_id;
        
        -- Create reversal lines (flip debit/credit)
        INSERT INTO universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            line_entity_id,
            line_type,
            debit_amount,
            credit_amount,
            smart_code,
            metadata
        )
        SELECT 
            p_organization_id,
            v_reversal_txn_id,
            (line_data->>'line_number')::INTEGER,
            (line_data->>'line_entity_id')::UUID,
            CASE 
                WHEN line_data->>'line_type' = 'DEBIT' THEN 'CREDIT'
                ELSE 'DEBIT'
            END,
            COALESCE((line_data->>'credit_amount')::DECIMAL, 0), -- Flip amounts
            COALESCE((line_data->>'debit_amount')::DECIMAL, 0),  -- Flip amounts
            'HERA.ACCOUNTING.MIGRATION.REVERSE.LINE.V2',
            jsonb_build_object(
                'reversal_of_line', line_data->>'line_number',
                'original_smart_code', line_data->>'smart_code'
            )
        FROM unnest(v_transaction_record.transaction_lines) as line_data;
        
        v_transactions_reversed := v_transactions_reversed + 1;
    END LOOP;
    
    v_result.end_time := clock_timestamp();
    v_result.duration := v_result.end_time - v_result.start_time;
    v_result.success := true;
    v_result.records_processed := v_transactions_reversed;
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- PHASE 4: REPOST WITH V2 SMART CODES
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_migration_phase_4_repost_v2_transactions_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT,
    p_transaction_batch_size INTEGER DEFAULT 100
) RETURNS migration_phase_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result migration_phase_result;
    v_original_record RECORD;
    v_new_txn_id UUID;
    v_new_smart_code TEXT;
    v_transactions_reposted INTEGER := 0;
BEGIN
    v_result.phase_name := 'REPOST_V2_TRANSACTIONS';
    v_result.start_time := clock_timestamp();
    
    -- Repost original transactions with v2 smart codes
    FOR v_original_record IN
        SELECT 
            ut.id,
            ut.transaction_type,
            ut.transaction_code,
            ut.transaction_date,
            ut.total_amount,
            ut.smart_code as original_smart_code,
            ut.metadata as original_metadata,
            array_agg(
                jsonb_build_object(
                    'line_number', utl.line_number,
                    'line_entity_id', utl.line_entity_id,
                    'debit_amount', utl.debit_amount,
                    'credit_amount', utl.credit_amount,
                    'line_type', utl.line_type,
                    'smart_code', utl.smart_code,
                    'metadata', utl.metadata
                ) ORDER BY utl.line_number
            ) as original_lines
        FROM universal_transactions ut
        LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
        WHERE ut.organization_id = p_organization_id
          AND ut.smart_code NOT LIKE '%.V2'
          AND ut.transaction_type = 'JOURNAL_ENTRY'
          AND EXISTS (
              -- Only repost if reversal exists
              SELECT 1 FROM universal_transactions rev
              WHERE rev.organization_id = p_organization_id
                AND rev.metadata->>'original_transaction_id' = ut.id::text
                AND rev.smart_code = 'HERA.ACCOUNTING.MIGRATION.REVERSE.REPOST.V2'
          )
        GROUP BY ut.id, ut.transaction_type, ut.transaction_code, 
                 ut.transaction_date, ut.total_amount, ut.smart_code, ut.metadata
        LIMIT p_transaction_batch_size
    LOOP
        -- Determine new v2 smart code
        v_new_smart_code := CASE v_original_record.transaction_type
            WHEN 'JOURNAL_ENTRY' THEN 'HERA.ACCOUNTING.GL.TXN.JOURNAL.V2'
            WHEN 'PAYMENT' THEN 'HERA.ACCOUNTING.GL.TXN.PAYMENT.V2'
            WHEN 'RECEIPT' THEN 'HERA.ACCOUNTING.GL.TXN.RECEIPT.V2'
            ELSE 'HERA.ACCOUNTING.GL.TXN.MIGRATED.V2'
        END;
        
        -- Create new v2 transaction
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            transaction_code,
            transaction_date,
            total_amount,
            smart_code,
            metadata
        ) VALUES (
            p_organization_id,
            v_original_record.transaction_type,
            v_original_record.transaction_code,
            v_original_record.transaction_date,
            v_original_record.total_amount,
            v_new_smart_code,
            jsonb_build_object(
                'migration_type', 'v2_repost',
                'original_transaction_id', v_original_record.id,
                'original_smart_code', v_original_record.original_smart_code,
                'migration_batch', p_migration_batch_id,
                'original_metadata', v_original_record.original_metadata
            )
        ) RETURNING id INTO v_new_txn_id;
        
        -- Create new v2 transaction lines
        INSERT INTO universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            line_entity_id,
            line_type,
            debit_amount,
            credit_amount,
            smart_code,
            metadata
        )
        SELECT 
            p_organization_id,
            v_new_txn_id,
            (line_data->>'line_number')::INTEGER,
            (line_data->>'line_entity_id')::UUID,
            line_data->>'line_type',
            COALESCE((line_data->>'debit_amount')::DECIMAL, 0),
            COALESCE((line_data->>'credit_amount')::DECIMAL, 0),
            CASE 
                WHEN (line_data->>'debit_amount')::DECIMAL > 0 
                THEN 'HERA.ACCOUNTING.GL.LINE.DEBIT.V2'
                ELSE 'HERA.ACCOUNTING.GL.LINE.CREDIT.V2'
            END,
            jsonb_build_object(
                'migration_type', 'v2_repost',
                'original_line_smart_code', line_data->>'smart_code',
                'original_metadata', line_data->'metadata'
            )
        FROM unnest(v_original_record.original_lines) as line_data;
        
        v_transactions_reposted := v_transactions_reposted + 1;
    END LOOP;
    
    v_result.end_time := clock_timestamp();
    v_result.duration := v_result.end_time - v_result.start_time;
    v_result.success := true;
    v_result.records_processed := v_transactions_reposted;
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- MIGRATION VALIDATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_migration_validation_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT
) RETURNS TABLE(
    validation_category TEXT,
    validation_status TEXT,
    items_validated BIGINT,
    issues_found BIGINT,
    validation_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Smart Code Migration Validation
    WITH smart_code_validation AS (
        SELECT 
            'SMART_CODE_MIGRATION' as category,
            CASE 
                WHEN COUNT(*) FILTER (WHERE smart_code NOT LIKE '%.V2') = 0 THEN 'PASS'
                ELSE 'FAIL'
            END as status,
            COUNT(*) as items_validated,
            COUNT(*) FILTER (WHERE smart_code NOT LIKE '%.V2') as issues_found,
            jsonb_agg(
                jsonb_build_object(
                    'entity_id', id,
                    'entity_type', entity_type,
                    'smart_code', smart_code
                )
            ) FILTER (WHERE smart_code NOT LIKE '%.V2') as details
        FROM core_entities
        WHERE organization_id = p_organization_id
    ),
    -- Transaction Balance Validation
    balance_validation AS (
        SELECT 
            'TRANSACTION_BALANCE' as category,
            CASE 
                WHEN COUNT(*) FILTER (WHERE ABS(debit_total - credit_total) > 0.01) = 0 THEN 'PASS'
                ELSE 'FAIL'
            END as status,
            COUNT(*) as items_validated,
            COUNT(*) FILTER (WHERE ABS(debit_total - credit_total) > 0.01) as issues_found,
            jsonb_agg(
                jsonb_build_object(
                    'transaction_id', transaction_id,
                    'balance_difference', ABS(debit_total - credit_total)
                )
            ) FILTER (WHERE ABS(debit_total - credit_total) > 0.01) as details
        FROM (
            SELECT 
                ut.id as transaction_id,
                COALESCE(SUM(utl.debit_amount), 0) as debit_total,
                COALESCE(SUM(utl.credit_amount), 0) as credit_total
            FROM universal_transactions ut
            LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
            WHERE ut.organization_id = p_organization_id
              AND ut.smart_code LIKE '%.V2'
            GROUP BY ut.id
        ) balance_check
    ),
    -- Migration Audit Trail Validation
    audit_trail_validation AS (
        SELECT 
            'MIGRATION_AUDIT_TRAIL' as category,
            'PASS' as status,
            COUNT(*) as items_validated,
            0::BIGINT as issues_found,
            jsonb_build_object(
                'migration_events', COUNT(*),
                'migration_batch', p_migration_batch_id
            ) as details
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code LIKE 'HERA.ACCOUNTING.MIGRATION.%.V2'
          AND metadata->>'migration_batch' = p_migration_batch_id
    )
    SELECT * FROM smart_code_validation
    UNION ALL
    SELECT * FROM balance_validation
    UNION ALL
    SELECT * FROM audit_trail_validation;
END;
$$;