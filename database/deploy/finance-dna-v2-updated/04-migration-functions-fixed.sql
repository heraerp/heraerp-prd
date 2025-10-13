-- =====================================================================
-- Finance DNA v2 - Migration Functions (Updated for Sign Convention)
-- =====================================================================
-- Updated to use line_amount sign convention instead of debit_amount/credit_amount
-- Positive line_amount = Debit, Negative line_amount = Credit
-- =====================================================================

-- Migration from Legacy GL Systems Function (Updated)
CREATE OR REPLACE FUNCTION finance_migrate_legacy_gl_v2(
    p_organization_id UUID,
    p_legacy_data JSONB,
    p_dry_run BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
    v_line_data JSONB;
    v_line_record RECORD;
    v_result JSONB;
    v_total_debits DECIMAL(15,2) := 0;
    v_total_credits DECIMAL(15,2) := 0;
    v_line_number INTEGER := 1;
BEGIN
    -- Initialize result
    v_result := jsonb_build_object(
        'success', true,
        'dry_run', p_dry_run,
        'transactions_processed', 0,
        'lines_processed', 0,
        'errors', jsonb_build_array()
    );
    
    -- Process each transaction in legacy data
    FOR v_line_data IN SELECT * FROM jsonb_array_elements(p_legacy_data->'transactions')
    LOOP
        BEGIN
            -- Create transaction header if not dry run
            IF NOT p_dry_run THEN
                v_transaction_id := gen_random_uuid();
                
                INSERT INTO universal_transactions (
                    id,
                    organization_id,
                    transaction_type,
                    smart_code,
                    transaction_date,
                    total_amount,
                    metadata,
                    created_at
                ) VALUES (
                    v_transaction_id,
                    p_organization_id,
                    COALESCE(v_line_data->>'transaction_type', 'GL_JOURNAL'),
                    COALESCE(v_line_data->>'smart_code', 'HERA.FINANCE.GL.MIGRATION.V2'),
                    COALESCE((v_line_data->>'transaction_date')::DATE, CURRENT_DATE),
                    COALESCE((v_line_data->>'total_amount')::DECIMAL, 0),
                    jsonb_build_object(
                        'legacy_source', true,
                        'original_data', v_line_data,
                        'migrated_at', NOW()
                    ),
                    NOW()
                );
            ELSE
                v_transaction_id := gen_random_uuid(); -- For tracking in dry run
            END IF;
            
            -- Reset totals for balance checking
            v_total_debits := 0;
            v_total_credits := 0;
            v_line_number := 1;
            
            -- Process transaction lines
            FOR v_line_record IN 
                SELECT * FROM jsonb_array_elements(v_line_data->'lines')
            LOOP
                DECLARE
                    v_line_amount DECIMAL(15,2);
                    v_debit_amount DECIMAL(15,2);
                    v_credit_amount DECIMAL(15,2);
                BEGIN
                    -- Extract amounts from legacy format
                    v_debit_amount := COALESCE((v_line_record.value->>'debit_amount')::DECIMAL, 0);
                    v_credit_amount := COALESCE((v_line_record.value->>'credit_amount')::DECIMAL, 0);
                    
                    -- Convert to sign convention: positive = debit, negative = credit
                    IF v_debit_amount > 0 THEN
                        v_line_amount := v_debit_amount;
                        v_total_debits := v_total_debits + v_debit_amount;
                    ELSIF v_credit_amount > 0 THEN
                        v_line_amount := -v_credit_amount;
                        v_total_credits := v_total_credits + v_credit_amount;
                    ELSE
                        v_line_amount := 0;
                    END IF;
                    
                    -- Insert line if not dry run
                    IF NOT p_dry_run THEN
                        INSERT INTO universal_transaction_lines (
                            id,
                            organization_id,
                            transaction_id,
                            line_number,
                            entity_id,
                            line_type,
                            line_amount,  -- Using sign convention
                            description,
                            smart_code,
                            line_data,
                            created_at
                        ) VALUES (
                            gen_random_uuid(),
                            p_organization_id,
                            v_transaction_id,
                            v_line_number,
                            NULL, -- Would need account entity lookup
                            CASE WHEN v_line_amount >= 0 THEN 'GL_DEBIT' ELSE 'GL_CREDIT' END,
                            v_line_amount,
                            v_line_record.value->>'description',
                            CASE WHEN v_line_amount >= 0 
                                THEN 'HERA.FINANCE.GL.DEBIT.MIGRATED.V2'
                                ELSE 'HERA.FINANCE.GL.CREDIT.MIGRATED.V2'
                            END,
                            jsonb_build_object(
                                'legacy_debit_amount', v_debit_amount,
                                'legacy_credit_amount', v_credit_amount,
                                'converted_line_amount', v_line_amount,
                                'account_code', v_line_record.value->>'account_code',
                                'account_name', v_line_record.value->>'account_name'
                            ),
                            NOW()
                        );
                    END IF;
                    
                    v_line_number := v_line_number + 1;
                    
                    -- Update processed count
                    v_result := jsonb_set(
                        v_result,
                        '{lines_processed}',
                        ((v_result->>'lines_processed')::INTEGER + 1)::TEXT::JSONB
                    );
                END;
            END LOOP;
            
            -- Validate balance
            IF ABS(v_total_debits - v_total_credits) > 0.01 THEN
                v_result := jsonb_set(
                    v_result,
                    '{errors}',
                    v_result->'errors' || jsonb_build_array(
                        jsonb_build_object(
                            'transaction_id', v_transaction_id,
                            'error', 'Unbalanced transaction',
                            'debits', v_total_debits,
                            'credits', v_total_credits,
                            'difference', ABS(v_total_debits - v_total_credits)
                        )
                    )
                );
                
                -- Rollback transaction if not dry run
                IF NOT p_dry_run THEN
                    DELETE FROM universal_transaction_lines WHERE transaction_id = v_transaction_id;
                    DELETE FROM universal_transactions WHERE id = v_transaction_id;
                END IF;
            ELSE
                -- Update processed count
                v_result := jsonb_set(
                    v_result,
                    '{transactions_processed}',
                    ((v_result->>'transactions_processed')::INTEGER + 1)::TEXT::JSONB
                );
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_result := jsonb_set(
                    v_result,
                    '{errors}',
                    v_result->'errors' || jsonb_build_array(
                        jsonb_build_object(
                            'transaction_id', v_transaction_id,
                            'error', SQLERRM,
                            'sqlstate', SQLSTATE
                        )
                    )
                );
        END;
    END LOOP;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END$$;

-- Data Validation Function (Updated)
CREATE OR REPLACE FUNCTION finance_validate_migration_data_v2(
    p_organization_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_unbalanced_count INTEGER;
    v_total_transactions INTEGER;
    v_validation_details JSONB;
BEGIN
    -- Get transaction counts
    SELECT COUNT(*) INTO v_total_transactions
    FROM universal_transactions
    WHERE organization_id = p_organization_id
      AND (p_start_date IS NULL OR transaction_date >= p_start_date)
      AND (p_end_date IS NULL OR transaction_date <= p_end_date);
    
    -- Check for unbalanced GL transactions
    WITH balance_check AS (
        SELECT 
            ut.id,
            ut.smart_code,
            ut.transaction_date,
            COALESCE(SUM(CASE WHEN utl.line_amount >= 0 THEN utl.line_amount ELSE 0 END), 0) as total_debits,
            COALESCE(SUM(CASE WHEN utl.line_amount < 0 THEN ABS(utl.line_amount) ELSE 0 END), 0) as total_credits
        FROM universal_transactions ut
        LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id AND utl.smart_code ~* '\.GL\.'
        WHERE ut.organization_id = p_organization_id
          AND (p_start_date IS NULL OR ut.transaction_date >= p_start_date)
          AND (p_end_date IS NULL OR ut.transaction_date <= p_end_date)
        GROUP BY ut.id, ut.smart_code, ut.transaction_date
        HAVING COUNT(utl.id) > 0  -- Only transactions with GL lines
    )
    SELECT COUNT(*) INTO v_unbalanced_count
    FROM balance_check
    WHERE ABS(total_debits - total_credits) > 0.01;
    
    -- Get detailed validation info
    WITH validation_summary AS (
        SELECT 
            ut.transaction_type,
            COUNT(*) as transaction_count,
            COUNT(CASE WHEN utl.smart_code ~* '\.GL\.' THEN 1 END) as gl_transaction_count,
            SUM(CASE WHEN utl.line_amount > 0 THEN utl.line_amount ELSE 0 END) as total_debits,
            SUM(CASE WHEN utl.line_amount < 0 THEN ABS(utl.line_amount) ELSE 0 END) as total_credits
        FROM universal_transactions ut
        LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
        WHERE ut.organization_id = p_organization_id
          AND (p_start_date IS NULL OR ut.transaction_date >= p_start_date)
          AND (p_end_date IS NULL OR ut.transaction_date <= p_end_date)
        GROUP BY ut.transaction_type
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'transaction_type', transaction_type,
            'transaction_count', transaction_count,
            'gl_transaction_count', gl_transaction_count,
            'total_debits', total_debits,
            'total_credits', total_credits,
            'is_balanced', ABS(COALESCE(total_debits, 0) - COALESCE(total_credits, 0)) <= 0.01
        )
    ) INTO v_validation_details
    FROM validation_summary;
    
    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'organization_id', p_organization_id,
        'validation_date', NOW(),
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'summary', jsonb_build_object(
            'total_transactions', v_total_transactions,
            'unbalanced_transactions', v_unbalanced_count,
            'balance_success_rate', 
                CASE WHEN v_total_transactions > 0 
                    THEN ROUND((1.0 - v_unbalanced_count::DECIMAL / v_total_transactions) * 100, 2)
                    ELSE 100 
                END
        ),
        'details', COALESCE(v_validation_details, jsonb_build_array()),
        'sign_convention_note', 'Using line_amount sign convention: positive=debit, negative=credit'
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END$$;

-- Rollback Migration Function (New)
CREATE OR REPLACE FUNCTION finance_rollback_migration_v2(
    p_organization_id UUID,
    p_migration_batch_id TEXT DEFAULT NULL,
    p_confirm_rollback BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_affected_transactions INTEGER;
    v_affected_lines INTEGER;
BEGIN
    IF NOT p_confirm_rollback THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Rollback not confirmed. Set p_confirm_rollback to true to proceed.',
            'warning', 'This will permanently delete migrated GL data!'
        );
    END IF;
    
    -- Count affected records
    SELECT COUNT(*) INTO v_affected_transactions
    FROM universal_transactions
    WHERE organization_id = p_organization_id
      AND metadata->>'legacy_source' = 'true'
      AND (p_migration_batch_id IS NULL OR metadata->>'migration_batch_id' = p_migration_batch_id);
    
    SELECT COUNT(*) INTO v_affected_lines
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.organization_id = p_organization_id
      AND ut.metadata->>'legacy_source' = 'true'
      AND (p_migration_batch_id IS NULL OR ut.metadata->>'migration_batch_id' = p_migration_batch_id);
    
    -- Delete migrated data
    DELETE FROM universal_transaction_lines 
    WHERE transaction_id IN (
        SELECT id FROM universal_transactions
        WHERE organization_id = p_organization_id
          AND metadata->>'legacy_source' = 'true'
          AND (p_migration_batch_id IS NULL OR metadata->>'migration_batch_id' = p_migration_batch_id)
    );
    
    DELETE FROM universal_transactions
    WHERE organization_id = p_organization_id
      AND metadata->>'legacy_source' = 'true'
      AND (p_migration_batch_id IS NULL OR metadata->>'migration_batch_id' = p_migration_batch_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'rollback_completed', true,
        'transactions_deleted', v_affected_transactions,
        'lines_deleted', v_affected_lines,
        'batch_id', p_migration_batch_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END$$;

-- Add comments
COMMENT ON FUNCTION finance_migrate_legacy_gl_v2(UUID, JSONB, BOOLEAN) IS 'Migrates legacy GL data using line_amount sign convention. Converts debit/credit amounts to positive/negative line_amounts.';
COMMENT ON FUNCTION finance_validate_migration_data_v2(UUID, DATE, DATE) IS 'Validates migrated GL data for balance and integrity using sign convention.';
COMMENT ON FUNCTION finance_rollback_migration_v2(UUID, TEXT, BOOLEAN) IS 'Rollback function for migrated GL data. Use with caution - permanently deletes migrated records.';