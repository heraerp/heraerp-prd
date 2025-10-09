-- ============================================================================
-- HERA Financial Reporting RPC Functions
-- ============================================================================
-- High-performance RPC functions using PostgreSQL views for financial reports
-- These functions provide clean APIs for trial balance, P&L, and balance sheet

-- ============================================================================
-- Trial Balance RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_trial_balance_v1(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_include_zero_balances BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    ifrs_classification TEXT,
    account_level INTEGER,
    is_normal_debit BOOLEAN,
    debit_balance NUMERIC,
    credit_balance NUMERIC,
    balance NUMERIC,
    total_debits NUMERIC,
    total_credits NUMERIC,
    is_balanced BOOLEAN,
    organization_name TEXT,
    generated_at TIMESTAMPTZ,
    report_currency TEXT,
    basis TEXT,
    includes_zero_balances BOOLEAN,
    data_source TEXT,
    transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_name TEXT;
    v_total_transaction_count BIGINT;
BEGIN
    -- Validate organization access (add your RLS logic here)
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID is required';
    END IF;

    -- Get organization name
    SELECT entity_name INTO v_org_name
    FROM core_entities 
    WHERE id = p_organization_id AND entity_type = 'organization'
    LIMIT 1;
    
    IF v_org_name IS NULL THEN
        v_org_name := 'Unknown Organization';
    END IF;

    -- Get total transaction count
    SELECT COALESCE(SUM(transaction_count), 0) INTO v_total_transaction_count
    FROM v_trial_balance 
    WHERE organization_id = p_organization_id;

    -- Return trial balance data
    RETURN QUERY
    SELECT 
        tb.account_code,
        tb.account_name,
        tb.account_type,
        tb.ifrs_classification,
        tb.account_level,
        tb.is_normal_debit,
        tb.debit_balance,
        tb.credit_balance,
        tb.balance,
        tb.total_trial_debits as total_debits,
        tb.total_trial_credits as total_credits,
        tb.is_balanced,
        v_org_name as organization_name,
        NOW() as generated_at,
        'AED'::TEXT as report_currency,
        'Accrual'::TEXT as basis,
        p_include_zero_balances as includes_zero_balances,
        'postgresql_views'::TEXT as data_source,
        v_total_transaction_count as transaction_count
    FROM v_trial_balance tb
    WHERE tb.organization_id = p_organization_id
      AND tb.last_transaction_date <= p_as_of_date
      AND (p_include_zero_balances OR ABS(tb.balance) > 0.01)
    ORDER BY tb.account_code;
END;
$$;

-- ============================================================================
-- Profit & Loss RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_profit_loss_v1(
    p_organization_id UUID,
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_prior_start_date DATE DEFAULT NULL,
    p_prior_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    current_period NUMERIC,
    prior_period NUMERIC,
    variance NUMERIC,
    variance_percent NUMERIC,
    is_subtotal BOOLEAN,
    account_level INTEGER,
    total_revenue NUMERIC,
    total_expenses NUMERIC,
    gross_profit NUMERIC,
    operating_income NUMERIC,
    net_income NUMERIC,
    organization_name TEXT,
    period_start DATE,
    period_end DATE,
    generated_at TIMESTAMPTZ,
    report_currency TEXT,
    basis TEXT,
    comparison_period TEXT,
    data_source TEXT,
    transactions_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_name TEXT;
    v_transactions_count BIGINT;
    v_prior_start DATE;
    v_prior_end DATE;
BEGIN
    -- Validate organization access
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID is required';
    END IF;

    -- Calculate prior period if not provided
    IF p_prior_start_date IS NULL OR p_prior_end_date IS NULL THEN
        v_prior_start := p_start_date - INTERVAL '1 year';
        v_prior_end := p_end_date - INTERVAL '1 year';
    ELSE
        v_prior_start := p_prior_start_date;
        v_prior_end := p_prior_end_date;
    END IF;

    -- Get organization name
    SELECT entity_name INTO v_org_name
    FROM core_entities 
    WHERE id = p_organization_id AND entity_type = 'organization'
    LIMIT 1;
    
    IF v_org_name IS NULL THEN
        v_org_name := 'Unknown Organization';
    END IF;

    -- Get transaction count for the period
    SELECT COUNT(*) INTO v_transactions_count
    FROM universal_transactions ut
    WHERE ut.organization_id = p_organization_id
      AND ut.transaction_date BETWEEN p_start_date AND p_end_date;

    -- Return P&L data with current period calculations
    RETURN QUERY
    WITH current_balances AS (
        SELECT 
            ab.account_code,
            ab.account_name,
            ab.account_type,
            ab.account_level,
            CASE 
                WHEN ab.account_type = 'REVENUE' THEN 
                    COALESCE(SUM(
                        CASE 
                            WHEN ut.transaction_date BETWEEN p_start_date AND p_end_date 
                            THEN utl.line_amount * CASE WHEN COALESCE(utl.metadata->>'line_type', 'credit') = 'credit' THEN 1 ELSE -1 END
                            ELSE 0 
                        END
                    ), 0)
                WHEN ab.account_type IN ('EXPENSES', 'COGS') THEN 
                    -COALESCE(SUM(
                        CASE 
                            WHEN ut.transaction_date BETWEEN p_start_date AND p_end_date 
                            THEN utl.line_amount * CASE WHEN COALESCE(utl.metadata->>'line_type', 'debit') = 'debit' THEN 1 ELSE -1 END
                            ELSE 0 
                        END
                    ), 0)
                ELSE 0
            END as current_amount,
            CASE 
                WHEN ab.account_type = 'REVENUE' THEN 
                    COALESCE(SUM(
                        CASE 
                            WHEN ut.transaction_date BETWEEN v_prior_start AND v_prior_end 
                            THEN utl.line_amount * CASE WHEN COALESCE(utl.metadata->>'line_type', 'credit') = 'credit' THEN 1 ELSE -1 END
                            ELSE 0 
                        END
                    ), 0)
                WHEN ab.account_type IN ('EXPENSES', 'COGS') THEN 
                    -COALESCE(SUM(
                        CASE 
                            WHEN ut.transaction_date BETWEEN v_prior_start AND v_prior_end 
                            THEN utl.line_amount * CASE WHEN COALESCE(utl.metadata->>'line_type', 'debit') = 'debit' THEN 1 ELSE -1 END
                            ELSE 0 
                        END
                    ), 0)
                ELSE 0
            END as prior_amount
        FROM v_account_balances ab
        LEFT JOIN universal_transaction_lines utl ON ab.account_id = utl.line_entity_id
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id AND ut.organization_id = p_organization_id
        WHERE ab.organization_id = p_organization_id
          AND ab.account_type IN ('REVENUE', 'EXPENSES', 'COGS')
        GROUP BY ab.account_code, ab.account_name, ab.account_type, ab.account_level
    ),
    summary_totals AS (
        SELECT 
            SUM(CASE WHEN account_type = 'REVENUE' THEN current_amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN account_type IN ('EXPENSES', 'COGS') THEN current_amount ELSE 0 END) as total_expenses,
            SUM(CASE WHEN account_type = 'REVENUE' THEN current_amount ELSE 0 END) + 
            SUM(CASE WHEN account_type = 'COGS' THEN current_amount ELSE 0 END) as gross_profit,
            SUM(current_amount) as net_income
        FROM current_balances
    )
    SELECT 
        cb.account_code,
        cb.account_name,
        cb.account_type,
        cb.current_amount as current_period,
        cb.prior_amount as prior_period,
        cb.current_amount - cb.prior_amount as variance,
        CASE 
            WHEN cb.prior_amount != 0 THEN ((cb.current_amount - cb.prior_amount) / ABS(cb.prior_amount)) * 100
            ELSE 0 
        END as variance_percent,
        FALSE as is_subtotal,
        cb.account_level,
        st.total_revenue,
        ABS(st.total_expenses) as total_expenses,
        st.gross_profit,
        st.gross_profit + st.total_expenses as operating_income,
        st.net_income,
        v_org_name as organization_name,
        p_start_date as period_start,
        p_end_date as period_end,
        NOW() as generated_at,
        'AED'::TEXT as report_currency,
        'Accrual'::TEXT as basis,
        'Prior Year'::TEXT as comparison_period,
        'postgresql_views'::TEXT as data_source,
        v_transactions_count as transactions_count
    FROM current_balances cb
    CROSS JOIN summary_totals st
    ORDER BY cb.account_type, cb.account_code;
END;
$$;

-- ============================================================================
-- Balance Sheet RPC Function  
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_balance_sheet_v1(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_prior_as_of_date DATE DEFAULT NULL
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    bs_classification TEXT,
    ifrs_classification TEXT,
    account_level INTEGER,
    current_amount NUMERIC,
    prior_amount NUMERIC,
    variance NUMERIC,
    variance_percent NUMERIC,
    is_subtotal BOOLEAN,
    total_assets NUMERIC,
    total_liabilities NUMERIC,
    total_equity NUMERIC,
    is_balanced BOOLEAN,
    organization_name TEXT,
    as_of_date DATE,
    generated_at TIMESTAMPTZ,
    report_currency TEXT,
    basis TEXT,
    prior_period TEXT,
    data_source TEXT,
    transactions_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_name TEXT;
    v_transactions_count BIGINT;
    v_prior_date DATE;
BEGIN
    -- Validate organization access
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID is required';
    END IF;

    -- Calculate prior date if not provided
    IF p_prior_as_of_date IS NULL THEN
        v_prior_date := p_as_of_date - INTERVAL '1 year';
    ELSE
        v_prior_date := p_prior_as_of_date;
    END IF;

    -- Get organization name
    SELECT entity_name INTO v_org_name
    FROM core_entities 
    WHERE id = p_organization_id AND entity_type = 'organization'
    LIMIT 1;
    
    IF v_org_name IS NULL THEN
        v_org_name := 'Unknown Organization';
    END IF;

    -- Get transaction count up to as-of date
    SELECT COUNT(*) INTO v_transactions_count
    FROM universal_transactions ut
    WHERE ut.organization_id = p_organization_id
      AND ut.transaction_date <= p_as_of_date;

    -- Return balance sheet data
    RETURN QUERY
    SELECT 
        bs.account_code,
        bs.account_name,
        bs.account_type,
        bs.bs_classification,
        bs.ifrs_classification,
        bs.account_level,
        bs.current_amount,
        bs.prior_amount,
        bs.variance,
        bs.variance_percent,
        bs.is_subtotal,
        bs.total_assets,
        bs.total_liabilities,
        bs.total_equity,
        bs.is_balanced,
        v_org_name as organization_name,
        p_as_of_date as as_of_date,
        NOW() as generated_at,
        'AED'::TEXT as report_currency,
        'Accrual'::TEXT as basis,
        'Prior Year'::TEXT as prior_period,
        'postgresql_views'::TEXT as data_source,
        v_transactions_count as transactions_count
    FROM v_balance_sheet bs
    WHERE bs.organization_id = p_organization_id
    ORDER BY bs.bs_classification, bs.account_code;
END;
$$;

-- ============================================================================
-- Account Summary RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_account_summary_v1(
    p_organization_id UUID,
    p_account_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    ifrs_classification TEXT,
    account_level INTEGER,
    is_normal_debit BOOLEAN,
    total_debits NUMERIC,
    total_credits NUMERIC,
    net_balance NUMERIC,
    debit_balance NUMERIC,
    credit_balance NUMERIC,
    transaction_count BIGINT,
    last_transaction_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate organization access
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID is required';
    END IF;

    -- Return account summary data
    RETURN QUERY
    SELECT 
        ab.account_code,
        ab.account_name,
        ab.account_type,
        ab.ifrs_classification,
        ab.account_level,
        ab.is_normal_debit,
        ab.total_debits,
        ab.total_credits,
        ab.net_balance,
        ab.debit_balance,
        ab.credit_balance,
        ab.transaction_count,
        ab.last_transaction_date
    FROM v_account_balances ab
    WHERE ab.organization_id = p_organization_id
      AND (p_account_code IS NULL OR ab.account_code = p_account_code)
    ORDER BY ab.account_code;
END;
$$;

-- ============================================================================
-- Grant permissions for RPC functions
-- ============================================================================

-- Grant EXECUTE permissions to authenticated users
GRANT EXECUTE ON FUNCTION hera_trial_balance_v1(UUID, DATE, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_profit_loss_v1(UUID, DATE, DATE, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_balance_sheet_v1(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_account_summary_v1(UUID, TEXT) TO authenticated;

-- Grant EXECUTE permissions to service role for API access
GRANT EXECUTE ON FUNCTION hera_trial_balance_v1(UUID, DATE, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION hera_profit_loss_v1(UUID, DATE, DATE, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION hera_balance_sheet_v1(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION hera_account_summary_v1(UUID, TEXT) TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION hera_trial_balance_v1(UUID, DATE, BOOLEAN) IS 'Generate trial balance report using PostgreSQL views for high performance';
COMMENT ON FUNCTION hera_profit_loss_v1(UUID, DATE, DATE, DATE, DATE) IS 'Generate profit & loss statement with period comparison';
COMMENT ON FUNCTION hera_balance_sheet_v1(UUID, DATE, DATE) IS 'Generate balance sheet with IFRS-compliant classifications';
COMMENT ON FUNCTION hera_account_summary_v1(UUID, TEXT) IS 'Get account balances and transaction summary for specific accounts or all accounts';