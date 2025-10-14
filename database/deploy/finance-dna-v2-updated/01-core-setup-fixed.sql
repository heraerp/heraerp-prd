-- =====================================================================
-- Finance DNA v2 - Core Setup (Updated for Sign Convention)
-- =====================================================================
-- Updated to use line_amount sign convention instead of debit_amount/credit_amount
-- Positive line_amount = Debit, Negative line_amount = Credit
-- =====================================================================

-- GL Balance Validation Function (Updated)
CREATE OR REPLACE FUNCTION finance_gl_balance_validation_v2()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_debits DECIMAL(15,2);
    v_total_credits DECIMAL(15,2);
    v_balance_difference DECIMAL(15,2);
    v_gl_line_count INTEGER;
    v_txn_id UUID;
    v_org_id UUID;
BEGIN
    -- Get transaction details
    v_txn_id := COALESCE(NEW.transaction_id, OLD.transaction_id);
    v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
    
    -- Only validate if this transaction has GL lines
    SELECT COUNT(*) INTO v_gl_line_count
    FROM universal_transaction_lines
    WHERE transaction_id = v_txn_id
      AND organization_id = v_org_id
      AND smart_code ~* '\.GL\.';
    
    -- Skip validation if no GL lines (operational transaction)
    IF v_gl_line_count = 0 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate debit/credit totals using sign convention (positive=debit, negative=credit)
    SELECT 
        COALESCE(SUM(CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN line_amount < 0 THEN ABS(line_amount) ELSE 0 END), 0)
    INTO v_total_debits, v_total_credits
    FROM universal_transaction_lines
    WHERE transaction_id = v_txn_id
      AND organization_id = v_org_id
      AND smart_code ~* '\.GL\.';  -- Only check GL transactions
    
    -- Check balance (allow for rounding differences up to $0.01)
    v_balance_difference := ABS(v_total_debits - v_total_credits);
    
    IF v_balance_difference > 0.01 THEN
        RAISE EXCEPTION 'GL transaction not balanced: Debits=% Credits=% Difference=%', 
            v_total_debits, v_total_credits, v_balance_difference;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END$$;

-- Create trigger (only for GL transactions)
DROP TRIGGER IF EXISTS trg_finance_gl_balance_v2 ON universal_transaction_lines;
CREATE TRIGGER trg_finance_gl_balance_v2
    AFTER INSERT OR UPDATE OR DELETE ON universal_transaction_lines
    FOR EACH ROW
    WHEN (
        (TG_OP IN ('INSERT', 'UPDATE') AND NEW.smart_code ~* '\.GL\.') OR
        (TG_OP = 'DELETE' AND OLD.smart_code ~* '\.GL\.')
    )
    EXECUTE FUNCTION finance_gl_balance_validation_v2();

-- Account Setup Function (Updated)
CREATE OR REPLACE FUNCTION finance_setup_chart_of_accounts_v2(
    p_organization_id UUID,
    p_account_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_record RECORD;
    v_account_id UUID;
    v_result JSONB;
    v_created_count INTEGER := 0;
BEGIN
    v_result := jsonb_build_object(
        'success', true,
        'organization_id', p_organization_id,
        'accounts_created', jsonb_build_array()
    );
    
    -- Process each account in the setup data
    FOR v_account_record IN 
        SELECT * FROM jsonb_array_elements(p_account_data->'accounts')
    LOOP
        -- Create account entity
        v_account_id := gen_random_uuid();
        
        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type,
            entity_name,
            entity_description,
            smart_code,
            created_at
        ) VALUES (
            v_account_id,
            p_organization_id,
            'account',
            v_account_record.value->>'account_name',
            COALESCE(v_account_record.value->>'description', ''),
            COALESCE(v_account_record.value->>'smart_code', 'HERA.FINANCE.ACCOUNT.SETUP.V2'),
            NOW()
        );
        
        -- Add account-specific dynamic data
        INSERT INTO core_dynamic_data (
            id,
            organization_id,
            entity_id,
            field_name,
            field_type,
            field_value_text,
            smart_code,
            created_at
        ) VALUES 
        (gen_random_uuid(), p_organization_id, v_account_id, 'account_code', 'text', 
         v_account_record.value->>'account_code', 'HERA.FINANCE.ACCOUNT.CODE.V2', NOW()),
        (gen_random_uuid(), p_organization_id, v_account_id, 'account_type', 'text', 
         v_account_record.value->>'account_type', 'HERA.FINANCE.ACCOUNT.TYPE.V2', NOW()),
        (gen_random_uuid(), p_organization_id, v_account_id, 'normal_balance', 'text', 
         v_account_record.value->>'normal_balance', 'HERA.FINANCE.ACCOUNT.BALANCE.V2', NOW());
        
        -- Add to result
        v_result := jsonb_set(
            v_result,
            '{accounts_created}',
            v_result->'accounts_created' || jsonb_build_array(
                jsonb_build_object(
                    'account_id', v_account_id,
                    'account_code', v_account_record.value->>'account_code',
                    'account_name', v_account_record.value->>'account_name',
                    'account_type', v_account_record.value->>'account_type'
                )
            )
        );
        
        v_created_count := v_created_count + 1;
    END LOOP;
    
    v_result := jsonb_set(v_result, '{total_created}', v_created_count::TEXT::JSONB);
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END$$;

-- GL Posting Function (Updated)
CREATE OR REPLACE FUNCTION finance_create_gl_entry_v2(
    p_organization_id UUID,
    p_transaction_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
    v_line_data JSONB;
    v_total_debits DECIMAL(15,2) := 0;
    v_total_credits DECIMAL(15,2) := 0;
    v_line_number INTEGER := 1;
    v_line_amount DECIMAL(15,2);
BEGIN
    -- Create transaction header
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
        COALESCE(p_transaction_data->>'transaction_type', 'GL_JOURNAL'),
        COALESCE(p_transaction_data->>'smart_code', 'HERA.FINANCE.GL.JOURNAL.V2'),
        COALESCE((p_transaction_data->>'transaction_date')::DATE, CURRENT_DATE),
        COALESCE((p_transaction_data->>'total_amount')::DECIMAL, 0),
        p_transaction_data,
        NOW()
    );
    
    -- Create transaction lines using sign convention
    FOR v_line_data IN SELECT * FROM jsonb_array_elements(p_transaction_data->'lines')
    LOOP
        -- Convert legacy debit/credit to sign convention
        IF (v_line_data->>'debit_amount')::DECIMAL > 0 THEN
            v_line_amount := (v_line_data->>'debit_amount')::DECIMAL;  -- Positive = Debit
            v_total_debits := v_total_debits + v_line_amount;
        ELSIF (v_line_data->>'credit_amount')::DECIMAL > 0 THEN
            v_line_amount := -((v_line_data->>'credit_amount')::DECIMAL);  -- Negative = Credit
            v_total_credits := v_total_credits + (v_line_data->>'credit_amount')::DECIMAL;
        ELSE
            v_line_amount := COALESCE((v_line_data->>'line_amount')::DECIMAL, 0);
            IF v_line_amount >= 0 THEN
                v_total_debits := v_total_debits + v_line_amount;
            ELSE
                v_total_credits := v_total_credits + ABS(v_line_amount);
            END IF;
        END IF;
        
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
            (v_line_data->>'account_id')::UUID,
            CASE WHEN v_line_amount >= 0 THEN 'GL_DEBIT' ELSE 'GL_CREDIT' END,
            v_line_amount,
            v_line_data->>'description',
            CASE WHEN v_line_amount >= 0 
                THEN 'HERA.FINANCE.GL.DEBIT.V2'
                ELSE 'HERA.FINANCE.GL.CREDIT.V2'
            END,
            v_line_data,
            NOW()
        );
        
        v_line_number := v_line_number + 1;
    END LOOP;
    
    -- Validate balance
    IF ABS(v_total_debits - v_total_credits) > 0.01 THEN
        RAISE EXCEPTION 'GL entry not balanced: Debits=% Credits=% Difference=%',
            v_total_debits, v_total_credits, ABS(v_total_debits - v_total_credits);
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'total_debits', v_total_debits,
        'total_credits', v_total_credits,
        'lines_created', v_line_number - 1
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Cleanup on error
        DELETE FROM universal_transaction_lines WHERE transaction_id = v_transaction_id;
        DELETE FROM universal_transactions WHERE id = v_transaction_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END$$;

-- Add comments
COMMENT ON FUNCTION finance_gl_balance_validation_v2() IS 'GL balance validation trigger using line_amount sign convention. Only validates GL transactions (smart_code contains .GL.).';
COMMENT ON FUNCTION finance_setup_chart_of_accounts_v2(UUID, JSONB) IS 'Sets up chart of accounts for Finance DNA v2 using HERA universal schema.';
COMMENT ON FUNCTION finance_create_gl_entry_v2(UUID, JSONB) IS 'Creates balanced GL entries using line_amount sign convention (positive=debit, negative=credit).';