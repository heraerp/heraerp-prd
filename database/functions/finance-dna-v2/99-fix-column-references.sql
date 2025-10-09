-- Finance DNA v2 - Column Reference Fixes
-- Smart Code: HERA.ACCOUNTING.FIXES.COLUMN.REFERENCES.v2
-- Fix column naming issues in reporting functions

-- =============================================================================
-- FIX TRIAL BALANCE GENERATION - Update column references
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_generate_trial_balance_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_include_sub_accounts BOOLEAN DEFAULT true,
    p_currency_code TEXT DEFAULT 'USD'
) RETURNS TABLE(
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2),
    net_balance DECIMAL(15,2),
    parent_account_code TEXT,
    account_level INTEGER,
    currency_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_access BOOLEAN := false;
BEGIN
    -- Validate organization access
    SELECT hera_validate_organization_access(p_organization_id) INTO v_org_access;
    IF NOT v_org_access THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Set organization context
    PERFORM hera_set_organization_context_v2(p_organization_id);
    
    RETURN QUERY
    WITH gl_accounts AS (
        -- Get all GL account entities
        SELECT 
            e.id as account_id,
            e.entity_code as account_code,
            e.entity_name as account_name,
            COALESCE(dd_type.field_value_text, 'ASSET') as account_type,
            COALESCE(dd_parent.field_value_text, '') as parent_account_code,
            COALESCE(dd_level.field_value_number::INTEGER, 1) as account_level
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd_type ON (
            e.id = dd_type.entity_id AND 
            dd_type.field_name = 'account_type' AND
            dd_type.organization_id = p_organization_id
        )
        LEFT JOIN core_dynamic_data dd_parent ON (
            e.id = dd_parent.entity_id AND 
            dd_parent.field_name = 'parent_account_code' AND
            dd_parent.organization_id = p_organization_id
        )
        LEFT JOIN core_dynamic_data dd_level ON (
            e.id = dd_level.entity_id AND 
            dd_level.field_name = 'account_level' AND
            dd_level.organization_id = p_organization_id
        )
        WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'gl_account'
        AND e.smart_code LIKE 'HERA.ACCOUNTING.%'
    ),
    transaction_balances AS (
        -- Calculate balances from transaction lines
        SELECT 
            utl.entity_id as account_id,  -- FIXED: was line_entity_id
            SUM(CASE 
                WHEN utl.line_type = 'DEBIT' THEN utl.line_amount 
                ELSE 0 
            END) as total_debits,
            SUM(CASE 
                WHEN utl.line_type = 'CREDIT' THEN utl.line_amount 
                ELSE 0 
            END) as total_credits
        FROM universal_transaction_lines utl
        INNER JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ut.organization_id = p_organization_id
        AND ut.transaction_date <= p_as_of_date
        AND ut.smart_code LIKE 'HERA.ACCOUNTING.%'
        GROUP BY utl.entity_id  -- FIXED: was line_entity_id
    )
    SELECT 
        gla.account_code,
        gla.account_name,
        gla.account_type,
        COALESCE(tb.total_debits, 0.00) as debit_balance,
        COALESCE(tb.total_credits, 0.00) as credit_balance,
        COALESCE(tb.total_debits, 0.00) - COALESCE(tb.total_credits, 0.00) as net_balance,
        gla.parent_account_code,
        gla.account_level,
        p_currency_code
    FROM gl_accounts gla
    LEFT JOIN transaction_balances tb ON gla.account_id = tb.account_id
    WHERE (p_include_sub_accounts OR gla.account_level = 1)
    ORDER BY gla.account_code;
    
    -- Log trial balance generation
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'REPORT_GENERATION',
        'HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2',
        jsonb_build_object(
            'report_type', 'trial_balance',
            'as_of_date', p_as_of_date,
            'currency_code', p_currency_code,
            'generation_time', NOW()
        )
    );
END;
$$;

-- =============================================================================
-- FIX PROFIT & LOSS GENERATION - Update column references
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_generate_profit_loss_v2(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_currency_code TEXT DEFAULT 'USD'
) RETURNS TABLE(
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    current_period DECIMAL(15,2),
    ytd_amount DECIMAL(15,2),
    budget_amount DECIMAL(15,2),
    variance_amount DECIMAL(15,2),
    variance_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_access BOOLEAN := false;
BEGIN
    -- Validate organization access
    SELECT hera_validate_organization_access(p_organization_id) INTO v_org_access;
    IF NOT v_org_access THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    RETURN QUERY
    WITH pl_accounts AS (
        -- Get P&L accounts (Revenue and Expense)
        SELECT 
            e.id as account_id,
            e.entity_code as account_code,
            e.entity_name as account_name,
            COALESCE(dd_type.field_value_text, 'EXPENSE') as account_type
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd_type ON (
            e.id = dd_type.entity_id AND 
            dd_type.field_name = 'account_type' AND
            dd_type.organization_id = p_organization_id
        )
        WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'gl_account'
        AND COALESCE(dd_type.field_value_text, 'EXPENSE') IN ('REVENUE', 'EXPENSE')
    ),
    period_balances AS (
        -- Current period balances
        SELECT 
            utl.entity_id as account_id,  -- FIXED: was line_entity_id
            SUM(CASE 
                WHEN utl.line_type = 'CREDIT' THEN utl.line_amount 
                ELSE -utl.line_amount 
            END) as period_amount
        FROM universal_transaction_lines utl
        INNER JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ut.organization_id = p_organization_id
        AND ut.transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY utl.entity_id  -- FIXED: was line_entity_id
    ),
    ytd_balances AS (
        -- Year-to-date balances
        SELECT 
            utl.entity_id as account_id,  -- FIXED: was line_entity_id
            SUM(CASE 
                WHEN utl.line_type = 'CREDIT' THEN utl.line_amount 
                ELSE -utl.line_amount 
            END) as ytd_amount
        FROM universal_transaction_lines utl
        INNER JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ut.organization_id = p_organization_id
        AND ut.transaction_date >= DATE_TRUNC('year', p_end_date)
        AND ut.transaction_date <= p_end_date
        GROUP BY utl.entity_id  -- FIXED: was line_entity_id
    )
    SELECT 
        pla.account_code,
        pla.account_name,
        pla.account_type,
        COALESCE(pb.period_amount, 0.00) as current_period,
        COALESCE(ytd.ytd_amount, 0.00) as ytd_amount,
        0.00 as budget_amount,  -- TODO: Integrate with budgeting system
        0.00 as variance_amount,
        0.00 as variance_percent
    FROM pl_accounts pla
    LEFT JOIN period_balances pb ON pla.account_id = pb.account_id
    LEFT JOIN ytd_balances ytd ON pla.account_id = ytd.account_id
    ORDER BY pla.account_type DESC, pla.account_code;
END;
$$;

-- =============================================================================
-- FIX BALANCE SHEET GENERATION - Update column references
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_generate_balance_sheet_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_currency_code TEXT DEFAULT 'USD'
) RETURNS TABLE(
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    balance_amount DECIMAL(15,2),
    parent_account_code TEXT,
    account_level INTEGER,
    sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_access BOOLEAN := false;
BEGIN
    -- Validate organization access
    SELECT hera_validate_organization_access(p_organization_id) INTO v_org_access;
    IF NOT v_org_access THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    RETURN QUERY
    WITH bs_accounts AS (
        -- Get Balance Sheet accounts (Assets, Liabilities, Equity)
        SELECT 
            e.id as account_id,
            e.entity_code as account_code,
            e.entity_name as account_name,
            COALESCE(dd_type.field_value_text, 'ASSET') as account_type,
            COALESCE(dd_parent.field_value_text, '') as parent_account_code,
            COALESCE(dd_level.field_value_number::INTEGER, 1) as account_level,
            CASE 
                WHEN COALESCE(dd_type.field_value_text, 'ASSET') = 'ASSET' THEN 1
                WHEN COALESCE(dd_type.field_value_text, 'ASSET') = 'LIABILITY' THEN 2
                WHEN COALESCE(dd_type.field_value_text, 'ASSET') = 'EQUITY' THEN 3
                ELSE 4
            END as sort_order
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd_type ON (
            e.id = dd_type.entity_id AND 
            dd_type.field_name = 'account_type' AND
            dd_type.organization_id = p_organization_id
        )
        LEFT JOIN core_dynamic_data dd_parent ON (
            e.id = dd_parent.entity_id AND 
            dd_parent.field_name = 'parent_account_code' AND
            dd_parent.organization_id = p_organization_id
        )
        LEFT JOIN core_dynamic_data dd_level ON (
            e.id = dd_level.entity_id AND 
            dd_level.field_name = 'account_level' AND
            dd_level.organization_id = p_organization_id
        )
        WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'gl_account'
        AND COALESCE(dd_type.field_value_text, 'ASSET') IN ('ASSET', 'LIABILITY', 'EQUITY')
    ),
    account_balances AS (
        -- Calculate account balances
        SELECT 
            utl.entity_id as account_id,  -- FIXED: was line_entity_id
            SUM(CASE 
                WHEN utl.line_type = 'DEBIT' THEN utl.line_amount 
                ELSE -utl.line_amount 
            END) as balance_amount
        FROM universal_transaction_lines utl
        INNER JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ut.organization_id = p_organization_id
        AND ut.transaction_date <= p_as_of_date
        GROUP BY utl.entity_id  -- FIXED: was line_entity_id
    )
    SELECT 
        bsa.account_code,
        bsa.account_name,
        bsa.account_type,
        COALESCE(ab.balance_amount, 0.00) as balance_amount,
        bsa.parent_account_code,
        bsa.account_level,
        bsa.sort_order
    FROM bs_accounts bsa
    LEFT JOIN account_balances ab ON bsa.account_id = ab.account_id
    ORDER BY bsa.sort_order, bsa.account_code;
END;
$$;

-- =============================================================================
-- COMPLETION NOTICE
-- =============================================================================

-- Log successful fixes
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,  -- System org
    'SYSTEM_UPDATE',
    'HERA.ACCOUNTING.FIXES.COLUMN.REFERENCES.v2',
    jsonb_build_object(
        'fix_type', 'column_reference_updates',
        'functions_fixed', ARRAY['hera_generate_trial_balance_v2', 'hera_generate_profit_loss_v2', 'hera_generate_balance_sheet_v2'],
        'fix_description', 'Updated line_entity_id references to entity_id',
        'fix_timestamp', NOW()
    )
);

SELECT 'Finance DNA v2 Column Reference Fixes Applied Successfully' as status;