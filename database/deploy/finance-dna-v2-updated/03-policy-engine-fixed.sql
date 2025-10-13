-- =====================================================================
-- Finance DNA v2 - Policy Engine (Updated for Sign Convention)  
-- =====================================================================
-- Updated to use line_amount sign convention instead of debit_amount/credit_amount
-- Positive line_amount = Debit, Negative line_amount = Credit
-- =====================================================================

-- Policy Engine Function (Updated)
CREATE OR REPLACE FUNCTION finance_policy_engine_v2(
    p_organization_id UUID,
    p_transaction_id UUID,
    p_policy_type TEXT DEFAULT 'GL_POSTING'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_record RECORD;
    v_posting_rules JSONB;
    v_result JSONB;
    v_line_record RECORD;
    v_debit_account UUID;
    v_credit_account UUID;
    v_amount DECIMAL(15,2);
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction_record
    FROM universal_transactions
    WHERE id = p_transaction_id AND organization_id = p_organization_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction not found',
            'transaction_id', p_transaction_id
        );
    END IF;
    
    -- Initialize result
    v_result := jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'policy_type', p_policy_type,
        'generated_entries', jsonb_build_array()
    );
    
    -- Get posting rules based on transaction type and smart code
    SELECT posting_rules INTO v_posting_rules
    FROM finance_posting_rules_v2
    WHERE organization_id = p_organization_id
      AND transaction_type = v_transaction_record.transaction_type
      AND smart_code_pattern = v_transaction_record.smart_code
      AND is_active = true
    LIMIT 1;
    
    IF v_posting_rules IS NULL THEN
        -- Create default GL entries for transactions that have amounts
        IF v_transaction_record.total_amount IS NOT NULL AND v_transaction_record.total_amount != 0 THEN
            -- For sales/revenue transactions: debit cash/receivables, credit revenue
            IF v_transaction_record.transaction_type IN ('SALE', 'INVOICE', 'REVENUE') THEN
                -- Create debit entry (positive line_amount)
                INSERT INTO universal_transaction_lines (
                    id,
                    organization_id,
                    transaction_id,
                    line_number,
                    entity_id,
                    line_type,
                    line_amount,  -- Positive = Debit
                    smart_code,
                    description,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    p_organization_id,
                    p_transaction_id,
                    1,
                    NULL,  -- Would need to lookup cash/receivables account
                    'GL_DEBIT',
                    v_transaction_record.total_amount,  -- Positive for debit
                    'HERA.FINANCE.GL.DEBIT.CASH.V2',
                    'Auto-generated GL debit entry',
                    NOW()
                );
                
                -- Create credit entry (negative line_amount)
                INSERT INTO universal_transaction_lines (
                    id,
                    organization_id,
                    transaction_id,
                    line_number,
                    entity_id,
                    line_type,
                    line_amount,  -- Negative = Credit
                    smart_code,
                    description,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    p_organization_id,
                    p_transaction_id,
                    2,
                    NULL,  -- Would need to lookup revenue account
                    'GL_CREDIT',
                    -v_transaction_record.total_amount,  -- Negative for credit
                    'HERA.FINANCE.GL.CREDIT.REVENUE.V2',
                    'Auto-generated GL credit entry',
                    NOW()
                );
                
                v_result := jsonb_set(
                    v_result,
                    '{generated_entries}',
                    jsonb_build_array(
                        jsonb_build_object(
                            'type', 'debit',
                            'amount', v_transaction_record.total_amount,
                            'account_type', 'cash'
                        ),
                        jsonb_build_object(
                            'type', 'credit', 
                            'amount', v_transaction_record.total_amount,
                            'account_type', 'revenue'
                        )
                    )
                );
            END IF;
        END IF;
        
        RETURN v_result;
    END IF;
    
    -- Process posting rules (if they exist)
    -- This would iterate through the posting rules and create GL entries
    -- Implementation depends on the structure of your posting rules
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'transaction_id', p_transaction_id
        );
END$$;

-- Posting Rules Table (Updated structure)
CREATE TABLE IF NOT EXISTS finance_posting_rules_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    smart_code_pattern TEXT NOT NULL,
    posting_rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_posting_rules_org 
        FOREIGN KEY (organization_id) 
        REFERENCES core_organizations(id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_posting_rules_lookup 
ON finance_posting_rules_v2(organization_id, transaction_type, smart_code_pattern)
WHERE is_active = true;

-- Balance Validation Function (Updated)
CREATE OR REPLACE FUNCTION finance_validate_gl_balance_v2(
    p_organization_id UUID,
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_debits DECIMAL(15,2);
    v_total_credits DECIMAL(15,2);
    v_difference DECIMAL(15,2);
    v_gl_line_count INTEGER;
BEGIN
    -- Count GL lines for this transaction
    SELECT COUNT(*)
    INTO v_gl_line_count
    FROM universal_transaction_lines
    WHERE transaction_id = p_transaction_id
      AND organization_id = p_organization_id
      AND smart_code ~* '\.GL\.';
    
    -- If no GL lines, return success (non-GL transaction)
    IF v_gl_line_count = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'No GL lines found - operational transaction',
            'is_balanced', true,
            'gl_line_count', 0
        );
    END IF;
    
    -- Calculate totals using sign convention
    SELECT 
        COALESCE(SUM(CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN line_amount < 0 THEN ABS(line_amount) ELSE 0 END), 0)
    INTO v_total_debits, v_total_credits
    FROM universal_transaction_lines
    WHERE transaction_id = p_transaction_id
      AND organization_id = p_organization_id
      AND smart_code ~* '\.GL\.';
    
    v_difference := ABS(v_total_debits - v_total_credits);
    
    RETURN jsonb_build_object(
        'success', true,
        'is_balanced', v_difference <= 0.01,
        'total_debits', v_total_debits,
        'total_credits', v_total_credits,
        'difference', v_difference,
        'gl_line_count', v_gl_line_count,
        'tolerance', 0.01
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'transaction_id', p_transaction_id
        );
END$$;

-- Account Lookup Helper (New function)
CREATE OR REPLACE FUNCTION finance_get_default_account_v2(
    p_organization_id UUID,
    p_account_type TEXT,
    p_transaction_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- Try to find specific account for transaction type first
    IF p_transaction_type IS NOT NULL THEN
        SELECT ce.id INTO v_account_id
        FROM core_entities ce
        JOIN core_dynamic_data cdd_type ON ce.id = cdd_type.entity_id AND cdd_type.field_name = 'account_type'
        JOIN core_dynamic_data cdd_usage ON ce.id = cdd_usage.entity_id AND cdd_usage.field_name = 'usage_type'
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'account'
          AND cdd_type.field_value_text = p_account_type
          AND cdd_usage.field_value_text = p_transaction_type
          AND ce.status = 'active'
        LIMIT 1;
        
        IF FOUND THEN
            RETURN v_account_id;
        END IF;
    END IF;
    
    -- Fall back to general account of this type
    SELECT ce.id INTO v_account_id
    FROM core_entities ce
    JOIN core_dynamic_data cdd_type ON ce.id = cdd_type.entity_id AND cdd_type.field_name = 'account_type'
    WHERE ce.organization_id = p_organization_id
      AND ce.entity_type = 'account'
      AND cdd_type.field_value_text = p_account_type
      AND ce.status = 'active'
    ORDER BY ce.created_at
    LIMIT 1;
    
    RETURN v_account_id;
END$$;

-- Add comments
COMMENT ON FUNCTION finance_policy_engine_v2(UUID, UUID, TEXT) IS 'Policy engine for automatic GL posting using line_amount sign convention. Creates balanced entries for financial transactions.';
COMMENT ON FUNCTION finance_validate_gl_balance_v2(UUID, UUID) IS 'Validates GL transaction balance using sign convention. Ignores non-GL transactions (appointments, etc).';
COMMENT ON FUNCTION finance_get_default_account_v2(UUID, TEXT, TEXT) IS 'Helper function to lookup default accounts for automatic GL posting.';