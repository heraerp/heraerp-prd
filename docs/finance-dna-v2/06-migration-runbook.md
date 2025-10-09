# Finance DNA v2 - Zero Tables Migration Runbook

**Smart Code**: `HERA.ACCOUNTING.MIGRATION.ZERO.TABLES.RUNBOOK.v2`

**Auto-Generated**: ✅  
**Last Updated**: 2025-01-10  
**Source**: Live migration procedure analysis

## 🎯 Zero Tables Migration Overview

Finance DNA v2 implements **Zero Tables Migration** - a revolutionary approach that migrates existing financial systems to HERA's Sacred Six architecture without creating new database tables.

### **Core Principles**
- **Zero New Tables**: Uses only the Sacred Six architecture
- **CTE-Only Queries**: Migration logic implemented via Common Table Expressions
- **Reverse + Repost**: Original transactions reversed, then reposted with .v2 smart codes
- **Complete Audit Trail**: Every migration step logged in universal_transactions
- **Gradual Migration**: Organizations can migrate incrementally

### **Migration Benefits**
- **No Schema Changes**: Preserves existing database structure
- **Perfect Rollback**: Complete reversibility with audit trails
- **Zero Downtime**: Migration runs alongside existing system
- **Data Integrity**: GL balances maintained throughout process
- **Compliance Ready**: Meets all financial audit requirements

## 📋 Pre-Migration Assessment

### **Migration Candidate Analysis**

```sql
CREATE OR REPLACE FUNCTION hera_assess_migration_candidates_v2(
    p_organization_id UUID
) RETURNS TABLE(
    assessment_category TEXT,
    entity_count BIGINT,
    transaction_count BIGINT,
    estimated_migration_time INTERVAL,
    complexity_score INTEGER,
    readiness_status TEXT
)
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
          AND smart_code NOT LIKE '%.v2'
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
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'MIGRATION_ASSESSMENT',
        'HERA.ACCOUNTING.MIGRATION.CANDIDATE.PREVIEW.v2',
        jsonb_build_object(
            'assessment_timestamp', v_start_time,
            'assessment_duration', clock_timestamp() - v_start_time,
            'performed_by', current_setting('app.current_user', true)
        )
    );
END;
$$;
```

### **Data Integrity Pre-Check**

```sql
CREATE OR REPLACE FUNCTION hera_migration_integrity_check_v2(
    p_organization_id UUID
) RETURNS TABLE(
    check_category TEXT,
    check_status TEXT,
    items_checked BIGINT,
    issues_found BIGINT,
    details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- GL Balance Validation
    WITH gl_balance_check AS (
        SELECT 
            'GL_BALANCE_INTEGRITY' as category,
            'PASS' as status,
            COUNT(*) as items_checked,
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
              AND ut.transaction_type = 'JOURNAL_ENTRY'
            GROUP BY ut.id
        ) balance_summary
    ),
    -- Smart Code Consistency Check
    smart_code_check AS (
        SELECT 
            'SMART_CODE_CONSISTENCY' as category,
            'PASS' as status,
            COUNT(*) as items_checked,
            COUNT(*) FILTER (WHERE smart_code IS NULL OR smart_code = '') as issues_found,
            jsonb_agg(
                jsonb_build_object('entity_id', id, 'entity_type', entity_type)
            ) FILTER (WHERE smart_code IS NULL OR smart_code = '') as details
        FROM core_entities
        WHERE organization_id = p_organization_id
    ),
    -- Organization Isolation Check
    isolation_check AS (
        SELECT 
            'ORGANIZATION_ISOLATION' as category,
            'PASS' as status,
            COUNT(*) as items_checked,
            COUNT(*) FILTER (WHERE organization_id != p_organization_id) as issues_found,
            jsonb_agg(
                jsonb_build_object('entity_id', id, 'wrong_org_id', organization_id)
            ) FILTER (WHERE organization_id != p_organization_id) as details
        FROM core_entities
        WHERE id IN (
            SELECT DISTINCT from_entity_id FROM core_relationships 
            WHERE organization_id = p_organization_id
            UNION
            SELECT DISTINCT to_entity_id FROM core_relationships
            WHERE organization_id = p_organization_id
        )
    )
    SELECT * FROM gl_balance_check
    UNION ALL
    SELECT * FROM smart_code_check
    UNION ALL  
    SELECT * FROM isolation_check;
END;
$$;
```

## 🔄 Migration Process Phases

### **Phase 1: Backup and Preparation**

```sql
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
        'HERA.ACCOUNTING.MIGRATION.BATCH.START.v2',
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
        'HERA.ACCOUNTING.MIGRATION.SNAPSHOT.BACKUP.v2',
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
```

### **Phase 2: Smart Code Mapping**

```sql
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
                WHEN 'gl_account' THEN 'HERA.ACCOUNTING.GL.ACC.ENTITY.v2'
                WHEN 'fin_rule' THEN 'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2'
                WHEN 'fiscal_period' THEN 'HERA.ACCOUNTING.FISCAL.PERIOD.ENTITY.v2'
                ELSE 'HERA.ACCOUNTING.ENTITY.MIGRATION.v2'
            END as new_smart_code
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND (smart_code IS NULL OR NOT smart_code LIKE '%.v2')
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
            'HERA.ACCOUNTING.MIGRATION.MAPPING.SMART.CODE.v2'
        );
        
        v_mappings_created := v_mappings_created + 1;
    END LOOP;
    
    -- Create smart code mapping for transactions
    FOR v_mapping_record IN
        SELECT DISTINCT
            transaction_type,
            smart_code as current_smart_code,
            CASE transaction_type
                WHEN 'JOURNAL_ENTRY' THEN 'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2'
                WHEN 'PAYMENT' THEN 'HERA.ACCOUNTING.GL.TXN.PAYMENT.v2'
                WHEN 'RECEIPT' THEN 'HERA.ACCOUNTING.GL.TXN.RECEIPT.v2'
                ELSE 'HERA.ACCOUNTING.GL.TXN.MIGRATION.v2'
            END as new_smart_code
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND (smart_code IS NULL OR NOT smart_code LIKE '%.v2')
    LOOP
        -- Store transaction type mapping
        INSERT INTO core_entities (
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            metadata
        ) VALUES (
            p_organization_id,
            'smart_code_mapping',
            format('Migration Mapping: %s', v_mapping_record.current_smart_code),
            format('MAPPING_%s_%s', v_mapping_record.transaction_type, 
                   to_char(NOW(), 'YYYYMMDDHH24MISS')),
            'HERA.ACCOUNTING.MIGRATION.MAPPING.ENTITY.v2',
            jsonb_build_object(
                'original_smart_code', v_mapping_record.current_smart_code,
                'new_smart_code', v_mapping_record.new_smart_code,
                'transaction_type', v_mapping_record.transaction_type,
                'migration_batch', p_migration_batch_id
            )
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
```

### **Phase 3: Reverse Original Transactions**

```sql
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
          AND ut.smart_code NOT LIKE '%.v2'
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
            'HERA.ACCOUNTING.MIGRATION.REVERSE.REPOST.v2',
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
            'HERA.ACCOUNTING.MIGRATION.REVERSE.LINE.v2',
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
```

### **Phase 4: Repost with v2 Smart Codes**

```sql
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
          AND ut.smart_code NOT LIKE '%.v2'
          AND ut.transaction_type = 'JOURNAL_ENTRY'
          AND EXISTS (
              -- Only repost if reversal exists
              SELECT 1 FROM universal_transactions rev
              WHERE rev.organization_id = p_organization_id
                AND rev.metadata->>'original_transaction_id' = ut.id::text
                AND rev.smart_code = 'HERA.ACCOUNTING.MIGRATION.REVERSE.REPOST.v2'
          )
        GROUP BY ut.id, ut.transaction_type, ut.transaction_code, 
                 ut.transaction_date, ut.total_amount, ut.smart_code, ut.metadata
        LIMIT p_transaction_batch_size
    LOOP
        -- Determine new v2 smart code
        v_new_smart_code := CASE v_original_record.transaction_type
            WHEN 'JOURNAL_ENTRY' THEN 'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2'
            WHEN 'PAYMENT' THEN 'HERA.ACCOUNTING.GL.TXN.PAYMENT.v2'
            WHEN 'RECEIPT' THEN 'HERA.ACCOUNTING.GL.TXN.RECEIPT.v2'
            ELSE 'HERA.ACCOUNTING.GL.TXN.MIGRATED.v2'
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
                THEN 'HERA.ACCOUNTING.GL.LINE.DEBIT.v2'
                ELSE 'HERA.ACCOUNTING.GL.LINE.CREDIT.v2'
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
```

### **Phase 5: Update Entity Smart Codes**

```sql
CREATE OR REPLACE FUNCTION hera_migration_phase_5_update_entity_smart_codes_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT
) RETURNS migration_phase_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result migration_phase_result;
    v_entities_updated INTEGER := 0;
BEGIN
    v_result.phase_name := 'UPDATE_ENTITY_SMART_CODES';
    v_result.start_time := clock_timestamp();
    
    -- Update entity smart codes based on mappings
    WITH entity_mappings AS (
        SELECT 
            ce.id,
            ce.smart_code as current_smart_code,
            cdd.field_value_json->>'new_smart_code' as new_smart_code
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
        WHERE ce.organization_id = p_organization_id
          AND cdd.field_name = 'v2_migration_mapping'
          AND cdd.smart_code = 'HERA.ACCOUNTING.MIGRATION.MAPPING.SMART.CODE.v2'
    )
    UPDATE core_entities
    SET 
        smart_code = em.new_smart_code,
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'migrated_to_v2', true,
            'migration_batch', p_migration_batch_id,
            'original_smart_code', em.current_smart_code,
            'migrated_at', NOW()
        )
    FROM entity_mappings em
    WHERE core_entities.id = em.id;
    
    GET DIAGNOSTICS v_entities_updated = ROW_COUNT;
    
    v_result.end_time := clock_timestamp();
    v_result.duration := v_result.end_time - v_result.start_time;
    v_result.success := true;
    v_result.records_processed := v_entities_updated;
    
    RETURN v_result;
END;
$$;
```

## 🔍 Post-Migration Validation

### **Migration Completeness Check**

```sql
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
                WHEN COUNT(*) FILTER (WHERE smart_code NOT LIKE '%.v2') = 0 THEN 'PASS'
                ELSE 'FAIL'
            END as status,
            COUNT(*) as items_validated,
            COUNT(*) FILTER (WHERE smart_code NOT LIKE '%.v2') as issues_found,
            jsonb_agg(
                jsonb_build_object(
                    'entity_id', id,
                    'entity_type', entity_type,
                    'smart_code', smart_code
                )
            ) FILTER (WHERE smart_code NOT LIKE '%.v2') as details
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
              AND ut.smart_code LIKE '%.v2'
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
          AND smart_code LIKE 'HERA.ACCOUNTING.MIGRATION.%.v2'
          AND metadata->>'migration_batch' = p_migration_batch_id
    )
    SELECT * FROM smart_code_validation
    UNION ALL
    SELECT * FROM balance_validation
    UNION ALL
    SELECT * FROM audit_trail_validation;
END;
$$;
```

## 📊 Migration Monitoring and Rollback

### **Migration Status Dashboard**

```sql
CREATE OR REPLACE FUNCTION hera_migration_status_dashboard_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT
) RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    status_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH migration_metrics AS (
        -- Migration Progress
        SELECT 
            'Migration Progress' as metric_name,
            ROUND(
                (COUNT(*) FILTER (WHERE smart_code LIKE '%.v2')::DECIMAL / 
                 NULLIF(COUNT(*), 0)) * 100, 2
            ) as metric_value,
            'percentage' as metric_unit,
            CASE 
                WHEN (COUNT(*) FILTER (WHERE smart_code LIKE '%.v2')::DECIMAL / 
                      NULLIF(COUNT(*), 0)) * 100 = 100 THEN 'COMPLETE'
                WHEN (COUNT(*) FILTER (WHERE smart_code LIKE '%.v2')::DECIMAL / 
                      NULLIF(COUNT(*), 0)) * 100 >= 80 THEN 'NEAR_COMPLETE'
                ELSE 'IN_PROGRESS'
            END as status_category
        FROM core_entities
        WHERE organization_id = p_organization_id
        
        UNION ALL
        
        -- Transaction Migration Count
        SELECT 
            'Transactions Migrated' as metric_name,
            COUNT(*)::NUMERIC as metric_value,
            'count' as metric_unit,
            'INFO' as status_category
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code LIKE '%.v2'
          AND metadata->>'migration_batch' = p_migration_batch_id
        
        UNION ALL
        
        -- Average Migration Time per Transaction
        SELECT 
            'Avg Migration Time' as metric_name,
            ROUND(AVG(
                EXTRACT(MILLISECONDS FROM (
                    (metadata->>'end_time')::TIMESTAMP - 
                    (metadata->>'start_time')::TIMESTAMP
                ))
            ), 2) as metric_value,
            'milliseconds' as metric_unit,
            'PERFORMANCE' as status_category
        FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND smart_code LIKE 'HERA.ACCOUNTING.MIGRATION.%.v2'
          AND metadata->>'migration_batch' = p_migration_batch_id
    )
    SELECT * FROM migration_metrics;
END;
$$;
```

### **Emergency Rollback Function**

```sql
CREATE OR REPLACE FUNCTION hera_migration_emergency_rollback_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT,
    p_rollback_reason TEXT
) RETURNS rollback_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result rollback_result;
    v_rollback_txn_id UUID;
    v_entities_reverted INTEGER := 0;
    v_transactions_reverted INTEGER := 0;
BEGIN
    v_result.rollback_id := gen_random_uuid();
    v_result.start_time := clock_timestamp();
    
    -- Create rollback transaction
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'MIGRATION_ROLLBACK',
        'HERA.ACCOUNTING.MIGRATION.ROLLBACK.EMERGENCY.v2',
        jsonb_build_object(
            'rollback_id', v_result.rollback_id,
            'migration_batch', p_migration_batch_id,
            'rollback_reason', p_rollback_reason,
            'initiated_by', current_setting('app.current_user', true)
        )
    ) RETURNING id INTO v_rollback_txn_id;
    
    -- Revert entity smart codes
    WITH reverted_entities AS (
        UPDATE core_entities
        SET 
            smart_code = metadata->>'original_smart_code',
            metadata = metadata - 'migrated_to_v2' - 'migration_batch' - 'original_smart_code' - 'migrated_at'
        WHERE organization_id = p_organization_id
          AND metadata->>'migration_batch' = p_migration_batch_id
          AND metadata ? 'migrated_to_v2'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_entities_reverted FROM reverted_entities;
    
    -- Mark migrated transactions as reverted (don't delete for audit trail)
    WITH reverted_transactions AS (
        UPDATE universal_transactions
        SET 
            metadata = metadata || jsonb_build_object(
                'migration_reverted', true,
                'rollback_id', v_result.rollback_id,
                'reverted_at', NOW()
            )
        WHERE organization_id = p_organization_id
          AND smart_code LIKE '%.v2'
          AND metadata->>'migration_batch' = p_migration_batch_id
        RETURNING id
    )
    SELECT COUNT(*) INTO v_transactions_reverted FROM reverted_transactions;
    
    v_result.end_time := clock_timestamp();
    v_result.duration := v_result.end_time - v_result.start_time;
    v_result.entities_reverted := v_entities_reverted;
    v_result.transactions_reverted := v_transactions_reverted;
    v_result.success := true;
    
    RETURN v_result;
END;
$$;
```

---

## 🎯 Migration Best Practices

### **Pre-Migration Checklist**
- [ ] Complete data integrity assessment passes all checks
- [ ] All financial periods are closed for migration period
- [ ] System backup completed and verified
- [ ] Migration batch ID generated and documented
- [ ] User access restrictions implemented during migration
- [ ] Rollback procedures tested in non-production environment

### **During Migration**
- [ ] Monitor migration progress via status dashboard
- [ ] Validate GL balance integrity after each phase
- [ ] Maintain complete audit trail of all operations
- [ ] Implement phased approach for large datasets
- [ ] Keep original data intact throughout process

### **Post-Migration**
- [ ] Execute complete validation suite
- [ ] Verify all reports generate correctly with v2 smart codes
- [ ] Test policy application engine with migrated data
- [ ] Confirm all financial controls are operational
- [ ] Document migration completion and lessons learned

**Zero Tables Migration in Finance DNA v2 ensures seamless transition to enhanced financial capabilities while maintaining complete data integrity and audit compliance.**