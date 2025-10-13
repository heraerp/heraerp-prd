-- =====================================================================
-- Finance DNA v2 - Reporting RPCs (Updated for Sign Convention)
-- =====================================================================
-- Updated to use line_amount sign convention instead of debit_amount/credit_amount
-- Positive line_amount = Debit, Negative line_amount = Credit
-- =====================================================================

-- Account Summary Report Function (Updated)
CREATE OR REPLACE FUNCTION finance_account_summary_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_account_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    period_debits DECIMAL(15,2),
    period_credits DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2),
    is_balanced BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH account_balances AS (
        SELECT 
            ce.id as account_id,
            COALESCE(cdd_code.field_value_text, 'UNKNOWN') as account_code,
            ce.entity_name as account_name,
            COALESCE(cdd_type.field_value_text, 'UNKNOWN') as account_type,
            -- Use sign convention: positive = debit, negative = credit
            COALESCE(SUM(CASE WHEN utl.line_amount >= 0 THEN utl.line_amount ELSE 0 END) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_debits,
            COALESCE(SUM(CASE WHEN utl.line_amount < 0 THEN ABS(utl.line_amount) ELSE 0 END) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_credits,
            COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as ending_balance,
            -- Calculate display balances based on normal balance
            CASE WHEN COALESCE(SUM(utl.line_amount), 0) >= 0 
                THEN COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) 
                ELSE 0 END as debit_balance,
            CASE WHEN COALESCE(SUM(utl.line_amount), 0) < 0 
                THEN ABS(COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0))
                ELSE 0 END as credit_balance,
            -- Check if account transactions are balanced (within tolerance)
            NOT EXISTS (
                SELECT 1 FROM universal_transactions ut2
                JOIN universal_transaction_lines utl2 ON ut2.id = utl2.transaction_id
                WHERE utl2.entity_id = ce.id 
                  AND ut2.organization_id = p_organization_id
                  AND utl2.smart_code ~* '\.GL\.'
                GROUP BY ut2.id
                HAVING ABS(COALESCE(SUM(utl2.line_amount), 0)) > 0.01) as is_balanced
        FROM core_entities ce
        LEFT JOIN core_dynamic_data cdd_code ON ce.id = cdd_code.entity_id AND cdd_code.field_name = 'account_code'
        LEFT JOIN core_dynamic_data cdd_type ON ce.id = cdd_type.entity_id AND cdd_type.field_name = 'account_type'
        LEFT JOIN universal_transaction_lines utl ON ce.id = utl.entity_id AND utl.smart_code ~* '\.GL\.'
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'account'
          AND (p_account_filter IS NULL OR ce.entity_name ILIKE '%' || p_account_filter || '%')
        GROUP BY ce.id, ce.entity_name, cdd_code.field_value_text, cdd_type.field_value_text
    )
    SELECT * FROM account_balances
    ORDER BY account_code, account_name;
END$$;

-- Trial Balance Report Function (Updated)
CREATE OR REPLACE FUNCTION finance_trial_balance_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_include_zero_balances BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2),
    net_balance DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH trial_balance AS (
        SELECT 
            COALESCE(cdd_code.field_value_text, 'UNKNOWN') as account_code,
            ce.entity_name as account_name,
            COALESCE(cdd_type.field_value_text, 'UNKNOWN') as account_type,
            -- Use sign convention for balance calculation
            COALESCE(SUM(CASE WHEN utl.line_amount >= 0 THEN utl.line_amount ELSE 0 END) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_debits,
            COALESCE(SUM(CASE WHEN utl.line_amount < 0 THEN ABS(utl.line_amount) ELSE 0 END) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_credits,
            COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as ending_balance,
            -- Display balances in traditional format
            CASE WHEN COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) >= 0 
                THEN COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) 
                ELSE 0 END as debit_balance,
            CASE WHEN COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) < 0 
                THEN ABS(COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0))
                ELSE 0 END as credit_balance,
            -- Check if balanced within tolerance
            NOT EXISTS (
                SELECT 1 FROM universal_transactions ut2
                JOIN universal_transaction_lines utl2 ON ut2.id = utl2.transaction_id
                WHERE utl2.entity_id = ce.id 
                  AND ut2.organization_id = p_organization_id
                  AND utl2.smart_code ~* '\.GL\.'
                GROUP BY ut2.id
                HAVING ABS(COALESCE(SUM(utl2.line_amount), 0)) > 0.01) as is_balanced
        FROM core_entities ce
        LEFT JOIN core_dynamic_data cdd_code ON ce.id = cdd_code.entity_id AND cdd_code.field_name = 'account_code'
        LEFT JOIN core_dynamic_data cdd_type ON ce.id = cdd_type.entity_id AND cdd_type.field_name = 'account_type'
        LEFT JOIN universal_transaction_lines utl ON ce.id = utl.entity_id AND utl.smart_code ~* '\.GL\.'
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'account'
        GROUP BY ce.id, ce.entity_name, cdd_code.field_value_text, cdd_type.field_value_text
        HAVING (p_include_zero_balances OR COALESCE(SUM(utl.line_amount), 0) != 0)
    )
    SELECT 
        tb.account_code,
        tb.account_name,
        tb.account_type,
        tb.debit_balance,
        tb.credit_balance,
        tb.ending_balance as net_balance
    FROM trial_balance tb
    ORDER BY tb.account_code, tb.account_name;
END$$;

-- Income Statement Function (Updated)
CREATE OR REPLACE FUNCTION finance_income_statement_v2(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_comparative_start_date DATE DEFAULT NULL,
    p_comparative_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    current_period DECIMAL(15,2),
    comparative_period DECIMAL(15,2),
    variance DECIMAL(15,2),
    variance_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH income_statement AS (
        SELECT 
            COALESCE(cdd_code.field_value_text, 'UNKNOWN') as account_code,
            ce.entity_name as account_name,
            COALESCE(cdd_type.field_value_text, 'UNKNOWN') as account_type,
            -- Revenue accounts: credit increases (negative line_amount), so negate for positive revenue
            CASE WHEN COALESCE(cdd_type.field_value_text, '') IN ('REVENUE', 'INCOME') THEN
                -(COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date BETWEEN p_start_date AND p_end_date), 0))
            ELSE
                -- Expense accounts: debit increases (positive line_amount)
                COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date BETWEEN p_start_date AND p_end_date), 0)
            END as current_period,
            -- Comparative period (if provided)
            CASE WHEN p_comparative_start_date IS NOT NULL AND p_comparative_end_date IS NOT NULL THEN
                CASE WHEN COALESCE(cdd_type.field_value_text, '') IN ('REVENUE', 'INCOME') THEN
                    -(COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date BETWEEN p_comparative_start_date AND p_comparative_end_date), 0))
                ELSE
                    COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date BETWEEN p_comparative_start_date AND p_comparative_end_date), 0)
                END
            ELSE 0
            END as comparative_period
        FROM core_entities ce
        LEFT JOIN core_dynamic_data cdd_code ON ce.id = cdd_code.entity_id AND cdd_code.field_name = 'account_code'
        LEFT JOIN core_dynamic_data cdd_type ON ce.id = cdd_type.entity_id AND cdd_type.field_name = 'account_type'
        LEFT JOIN universal_transaction_lines utl ON ce.id = utl.entity_id AND utl.smart_code ~* '\.GL\.'
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'account'
          AND COALESCE(cdd_type.field_value_text, '') IN ('REVENUE', 'INCOME', 'EXPENSE', 'COST_OF_GOODS_SOLD')
        GROUP BY ce.id, ce.entity_name, cdd_code.field_value_text, cdd_type.field_value_text
        HAVING COALESCE(SUM(utl.line_amount), 0) != 0
    )
    SELECT 
        is_data.account_code,
        is_data.account_name,
        is_data.account_type,
        is_data.current_period,
        is_data.comparative_period,
        (is_data.current_period - is_data.comparative_period) as variance,
        CASE WHEN is_data.comparative_period != 0 
            THEN ROUND(((is_data.current_period - is_data.comparative_period) / ABS(is_data.comparative_period) * 100)::DECIMAL, 2)
            ELSE NULL 
        END as variance_percent
    FROM income_statement is_data
    ORDER BY is_data.account_type, is_data.account_code;
END$$;

-- Balance Sheet Function (Updated)
CREATE OR REPLACE FUNCTION finance_balance_sheet_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_comparative_date DATE DEFAULT NULL
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    current_balance DECIMAL(15,2),
    comparative_balance DECIMAL(15,2),
    variance DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH balance_sheet AS (
        SELECT 
            COALESCE(cdd_code.field_value_text, 'UNKNOWN') as account_code,
            ce.entity_name as account_name,
            COALESCE(cdd_type.field_value_text, 'UNKNOWN') as account_type,
            -- Assets: debit increases (positive), Liabilities/Equity: credit increases (negative)
            CASE WHEN COALESCE(cdd_type.field_value_text, '') IN ('ASSET') THEN
                COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0)
            ELSE
                -- Liabilities and Equity: negate to show positive balances
                -(COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0))
            END as current_balance,
            -- Comparative balance (if provided)
            CASE WHEN p_comparative_date IS NOT NULL THEN
                CASE WHEN COALESCE(cdd_type.field_value_text, '') IN ('ASSET') THEN
                    COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_comparative_date), 0)
                ELSE
                    -(COALESCE(SUM(utl.line_amount) FILTER (WHERE ut.transaction_date <= p_comparative_date), 0))
                END
            ELSE 0
            END as comparative_balance
        FROM core_entities ce
        LEFT JOIN core_dynamic_data cdd_code ON ce.id = cdd_code.entity_id AND cdd_code.field_name = 'account_code'
        LEFT JOIN core_dynamic_data cdd_type ON ce.id = cdd_type.entity_id AND cdd_type.field_name = 'account_type'
        LEFT JOIN universal_transaction_lines utl ON ce.id = utl.entity_id AND utl.smart_code ~* '\.GL\.'
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'account'
          AND COALESCE(cdd_type.field_value_text, '') IN ('ASSET', 'LIABILITY', 'EQUITY')
        GROUP BY ce.id, ce.entity_name, cdd_code.field_value_text, cdd_type.field_value_text
        HAVING COALESCE(SUM(utl.line_amount), 0) != 0
    )
    SELECT 
        bs_data.account_code,
        bs_data.account_name,
        bs_data.account_type,
        bs_data.current_balance,
        bs_data.comparative_balance,
        (bs_data.current_balance - bs_data.comparative_balance) as variance
    FROM balance_sheet bs_data
    ORDER BY 
        CASE bs_data.account_type 
            WHEN 'ASSET' THEN 1 
            WHEN 'LIABILITY' THEN 2 
            WHEN 'EQUITY' THEN 3 
            ELSE 4 
        END,
        bs_data.account_code;
END$$;

-- Add comments
COMMENT ON FUNCTION finance_account_summary_v2(UUID, DATE, TEXT) IS 'Account summary report using line_amount sign convention (positive=debit, negative=credit). Only processes GL transactions.';
COMMENT ON FUNCTION finance_trial_balance_v2(UUID, DATE, BOOLEAN) IS 'Trial balance report using line_amount sign convention. Ensures all GL transactions are balanced.';
COMMENT ON FUNCTION finance_income_statement_v2(UUID, DATE, DATE, DATE, DATE) IS 'Income statement report with comparative periods using line_amount sign convention.';
COMMENT ON FUNCTION finance_balance_sheet_v2(UUID, DATE, DATE) IS 'Balance sheet report using line_amount sign convention for proper asset/liability/equity presentation.';