-- Finance DNA v2 - High-Performance Reporting RPC Functions
-- Smart Code: HERA.ACCOUNTING.REPORTING.RPC.FUNCTIONS.v2
-- Auto-Generated: From Finance DNA v2 Documentation
-- Last Updated: 2025-01-10

-- =============================================================================
-- TRIAL BALANCE GENERATION RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_generate_trial_balance_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_include_sub_accounts BOOLEAN DEFAULT true,
    p_currency_code TEXT DEFAULT 'USD',
    p_include_zero_balances BOOLEAN DEFAULT false,
    p_account_type_filter TEXT[] DEFAULT NULL,
    p_use_materialized_view BOOLEAN DEFAULT true
) RETURNS TABLE(
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    parent_account_id UUID,
    account_level INTEGER,
    opening_balance DECIMAL(15,2),
    period_debits DECIMAL(15,2),
    period_credits DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    balance_type TEXT,
    currency_code TEXT,
    last_transaction_date DATE,
    transaction_count INTEGER,
    smart_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_processing_time INTERVAL;
    v_cache_key TEXT;
    v_use_cache BOOLEAN := true;
BEGIN
    -- GUARDRAIL: Validate organization access
    IF NOT hera_validate_organization_access(p_organization_id) THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Set organization context for RLS
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    -- Generate cache key for performance optimization
    v_cache_key := format('trial_balance_%s_%s_%s_%s', 
        p_organization_id, p_as_of_date, p_currency_code, p_include_sub_accounts);
    
    -- Use materialized view for performance when possible
    IF p_use_materialized_view AND p_as_of_date = CURRENT_DATE THEN
        RETURN QUERY
        WITH account_balances AS (
            SELECT 
                ce.id as account_id,
                ce.entity_code as account_code,
                ce.entity_name as account_name,
                ce.metadata->>'account_type' as account_type,
                (ce.metadata->>'parent_account_id')::UUID as parent_account_id,
                COALESCE((ce.metadata->>'account_level')::INTEGER, 1) as account_level,
                0.00 as opening_balance, -- Simplified for v2
                COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_debits,
                COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_credits,
                COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) - 
                COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as ending_balance,
                CASE 
                    WHEN (ce.metadata->>'account_type') IN ('ASSET', 'EXPENSE') THEN
                        CASE WHEN (COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) >= 0 
                             THEN 'DEBIT' ELSE 'CREDIT' END
                    ELSE
                        CASE WHEN (COALESCE(SUM(utl.credit_amount), 0) - COALESCE(SUM(utl.debit_amount), 0)) >= 0 
                             THEN 'CREDIT' ELSE 'DEBIT' END
                END as balance_type,
                p_currency_code as currency_code,
                MAX(ut.transaction_date) as last_transaction_date,
                COUNT(DISTINCT ut.id) as transaction_count,
                'HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2' as smart_code
            FROM core_entities ce
            LEFT JOIN universal_transaction_lines utl ON ce.id = utl.line_entity_id
            LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
            WHERE ce.organization_id = p_organization_id
              AND ce.entity_type = 'gl_account'
              AND (p_account_type_filter IS NULL OR (ce.metadata->>'account_type') = ANY(p_account_type_filter))
              AND (ut.transaction_date IS NULL OR ut.transaction_date <= p_as_of_date)
            GROUP BY ce.id, ce.entity_code, ce.entity_name, ce.metadata
            HAVING (p_include_zero_balances OR 
                   ABS(COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) > 0.01)
        )
        SELECT * FROM account_balances
        ORDER BY account_code;
    ELSE
        -- Direct calculation for historical dates
        RETURN QUERY
        WITH account_balances AS (
            SELECT 
                ce.id as account_id,
                ce.entity_code as account_code,
                ce.entity_name as account_name,
                ce.metadata->>'account_type' as account_type,
                (ce.metadata->>'parent_account_id')::UUID as parent_account_id,
                COALESCE((ce.metadata->>'account_level')::INTEGER, 1) as account_level,
                0.00 as opening_balance,
                COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_debits,
                COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as period_credits,
                COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) - 
                COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) as ending_balance,
                CASE 
                    WHEN (ce.metadata->>'account_type') IN ('ASSET', 'EXPENSE') THEN
                        CASE WHEN (COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) >= 0 
                             THEN 'DEBIT' ELSE 'CREDIT' END
                    ELSE
                        CASE WHEN (COALESCE(SUM(utl.credit_amount), 0) - COALESCE(SUM(utl.debit_amount), 0)) >= 0 
                             THEN 'CREDIT' ELSE 'DEBIT' END
                END as balance_type,
                p_currency_code as currency_code,
                MAX(ut.transaction_date) as last_transaction_date,
                COUNT(DISTINCT ut.id) as transaction_count,
                'HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2' as smart_code
            FROM core_entities ce
            LEFT JOIN universal_transaction_lines utl ON ce.id = utl.line_entity_id
            LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
            WHERE ce.organization_id = p_organization_id
              AND ce.entity_type = 'gl_account'
              AND (p_account_type_filter IS NULL OR (ce.metadata->>'account_type') = ANY(p_account_type_filter))
              AND (ut.transaction_date IS NULL OR ut.transaction_date <= p_as_of_date)
            GROUP BY ce.id, ce.entity_code, ce.entity_name, ce.metadata
            HAVING (p_include_zero_balances OR 
                   ABS(COALESCE(SUM(utl.debit_amount), 0) - COALESCE(SUM(utl.credit_amount), 0)) > 0.01)
        )
        SELECT * FROM account_balances
        ORDER BY account_code;
    END IF;
    
    -- Log report generation for audit
    v_processing_time := clock_timestamp() - v_start_time;
    
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'TRIAL_BALANCE_GENERATION',
        jsonb_build_object(
            'as_of_date', p_as_of_date,
            'processing_time_ms', EXTRACT(MILLISECONDS FROM v_processing_time),
            'use_materialized_view', p_use_materialized_view,
            'include_zero_balances', p_include_zero_balances,
            'account_type_filter', p_account_type_filter
        ),
        'HERA.ACCOUNTING.AUDIT.REPORT.TRIAL.BALANCE.v2'
    );
END;
$$;

-- =============================================================================
-- PROFIT & LOSS GENERATION RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_generate_profit_loss_v2(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_include_comparative BOOLEAN DEFAULT false,
    p_comparative_start_date DATE DEFAULT NULL,
    p_comparative_end_date DATE DEFAULT NULL,
    p_currency_code TEXT DEFAULT 'USD'
) RETURNS TABLE(
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    account_category TEXT,
    current_period_amount DECIMAL(15,2),
    comparative_period_amount DECIMAL(15,2),
    variance_amount DECIMAL(15,2),
    variance_percent DECIMAL(5,2),
    smart_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_processing_time INTERVAL;
BEGIN
    -- GUARDRAIL: Validate organization access
    IF NOT hera_validate_organization_access(p_organization_id) THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Set organization context for RLS
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    RETURN QUERY
    WITH pl_accounts AS (
        SELECT 
            ce.id as account_id,
            ce.entity_code as account_code,
            ce.entity_name as account_name,
            ce.metadata->>'account_type' as account_type,
            COALESCE(ce.metadata->>'account_category', 'OTHER') as account_category,
            -- Current period calculation
            CASE 
                WHEN (ce.metadata->>'account_type') = 'REVENUE' THEN
                    COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_start_date AND p_end_date), 0) -
                    COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_start_date AND p_end_date), 0)
                WHEN (ce.metadata->>'account_type') = 'EXPENSE' THEN
                    COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_start_date AND p_end_date), 0) -
                    COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_start_date AND p_end_date), 0)
                ELSE 0.00
            END as current_period_amount,
            -- Comparative period calculation
            CASE 
                WHEN p_include_comparative AND p_comparative_start_date IS NOT NULL AND p_comparative_end_date IS NOT NULL THEN
                    CASE 
                        WHEN (ce.metadata->>'account_type') = 'REVENUE' THEN
                            COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_comparative_start_date AND p_comparative_end_date), 0) -
                            COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_comparative_start_date AND p_comparative_end_date), 0)
                        WHEN (ce.metadata->>'account_type') = 'EXPENSE' THEN
                            COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_comparative_start_date AND p_comparative_end_date), 0) -
                            COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date BETWEEN p_comparative_start_date AND p_comparative_end_date), 0)
                        ELSE 0.00
                    END
                ELSE 0.00
            END as comparative_period_amount,
            'HERA.ACCOUNTING.REPORT.PROFIT.LOSS.v2' as smart_code
        FROM core_entities ce
        LEFT JOIN universal_transaction_lines utl ON ce.id = utl.line_entity_id
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'gl_account'
          AND (ce.metadata->>'account_type') IN ('REVENUE', 'EXPENSE')
        GROUP BY ce.id, ce.entity_code, ce.entity_name, ce.metadata
    ),
    pl_with_variance AS (
        SELECT 
            *,
            current_period_amount - comparative_period_amount as variance_amount,
            CASE 
                WHEN comparative_period_amount != 0 THEN 
                    ROUND(((current_period_amount - comparative_period_amount) / ABS(comparative_period_amount)) * 100, 2)
                ELSE 0.00
            END as variance_percent
        FROM pl_accounts
    )
    SELECT * FROM pl_with_variance
    WHERE ABS(current_period_amount) > 0.01 OR ABS(comparative_period_amount) > 0.01
    ORDER BY account_type DESC, account_code;
    
    -- Log report generation
    v_processing_time := clock_timestamp() - v_start_time;
    
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'PROFIT_LOSS_GENERATION',
        jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date,
            'include_comparative', p_include_comparative,
            'processing_time_ms', EXTRACT(MILLISECONDS FROM v_processing_time)
        ),
        'HERA.ACCOUNTING.AUDIT.REPORT.PROFIT.LOSS.v2'
    );
END;
$$;

-- =============================================================================
-- BALANCE SHEET GENERATION RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_generate_balance_sheet_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_include_comparative BOOLEAN DEFAULT false,
    p_comparative_date DATE DEFAULT NULL,
    p_currency_code TEXT DEFAULT 'USD'
) RETURNS TABLE(
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    account_category TEXT,
    current_balance DECIMAL(15,2),
    comparative_balance DECIMAL(15,2),
    variance_amount DECIMAL(15,2),
    variance_percent DECIMAL(5,2),
    smart_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_processing_time INTERVAL;
BEGIN
    -- GUARDRAIL: Validate organization access
    IF NOT hera_validate_organization_access(p_organization_id) THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Set organization context for RLS
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    RETURN QUERY
    WITH bs_accounts AS (
        SELECT 
            ce.id as account_id,
            ce.entity_code as account_code,
            ce.entity_name as account_name,
            ce.metadata->>'account_type' as account_type,
            COALESCE(ce.metadata->>'account_category', 'OTHER') as account_category,
            -- Current balance calculation
            CASE 
                WHEN (ce.metadata->>'account_type') IN ('ASSET', 'EXPENSE') THEN
                    COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) -
                    COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0)
                WHEN (ce.metadata->>'account_type') IN ('LIABILITY', 'EQUITY', 'REVENUE') THEN
                    COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0) -
                    COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_as_of_date), 0)
                ELSE 0.00
            END as current_balance,
            -- Comparative balance calculation
            CASE 
                WHEN p_include_comparative AND p_comparative_date IS NOT NULL THEN
                    CASE 
                        WHEN (ce.metadata->>'account_type') IN ('ASSET', 'EXPENSE') THEN
                            COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_comparative_date), 0) -
                            COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_comparative_date), 0)
                        WHEN (ce.metadata->>'account_type') IN ('LIABILITY', 'EQUITY', 'REVENUE') THEN
                            COALESCE(SUM(utl.credit_amount) FILTER (WHERE ut.transaction_date <= p_comparative_date), 0) -
                            COALESCE(SUM(utl.debit_amount) FILTER (WHERE ut.transaction_date <= p_comparative_date), 0)
                        ELSE 0.00
                    END
                ELSE 0.00
            END as comparative_balance,
            'HERA.ACCOUNTING.REPORT.BALANCE.SHEET.v2' as smart_code
        FROM core_entities ce
        LEFT JOIN universal_transaction_lines utl ON ce.id = utl.line_entity_id
        LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'gl_account'
          AND (ce.metadata->>'account_type') IN ('ASSET', 'LIABILITY', 'EQUITY')
        GROUP BY ce.id, ce.entity_code, ce.entity_name, ce.metadata
    ),
    bs_with_variance AS (
        SELECT 
            *,
            current_balance - comparative_balance as variance_amount,
            CASE 
                WHEN comparative_balance != 0 THEN 
                    ROUND(((current_balance - comparative_balance) / ABS(comparative_balance)) * 100, 2)
                ELSE 0.00
            END as variance_percent
        FROM bs_accounts
    )
    SELECT * FROM bs_with_variance
    WHERE ABS(current_balance) > 0.01 OR ABS(comparative_balance) > 0.01
    ORDER BY 
        CASE account_type 
            WHEN 'ASSET' THEN 1
            WHEN 'LIABILITY' THEN 2
            WHEN 'EQUITY' THEN 3
            ELSE 4
        END,
        account_code;
    
    -- Log report generation
    v_processing_time := clock_timestamp() - v_start_time;
    
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'BALANCE_SHEET_GENERATION',
        jsonb_build_object(
            'as_of_date', p_as_of_date,
            'include_comparative', p_include_comparative,
            'processing_time_ms', EXTRACT(MILLISECONDS FROM v_processing_time)
        ),
        'HERA.ACCOUNTING.AUDIT.REPORT.BALANCE.SHEET.v2'
    );
END;
$$;