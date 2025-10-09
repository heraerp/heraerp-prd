-- ============================================================================
-- HERA Financial Reporting Views
-- ============================================================================
-- Professional PostgreSQL views for IFRS-compliant financial statements
-- These views handle complex calculations and provide clean interfaces for reports

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_trial_balance CASCADE;
DROP VIEW IF EXISTS v_profit_loss CASCADE;
DROP VIEW IF EXISTS v_balance_sheet CASCADE;
DROP VIEW IF EXISTS v_account_balances CASCADE;
DROP VIEW IF EXISTS v_gl_accounts_enhanced CASCADE;

-- ============================================================================
-- Enhanced GL Accounts View
-- ============================================================================
-- Enriches GL accounts with proper IFRS classifications and account types
CREATE OR REPLACE VIEW v_gl_accounts_enhanced AS
SELECT 
    e.id as account_id,
    e.organization_id,
    e.entity_code as account_code,
    e.entity_name as account_name,
    COALESCE(
        (dd_type.field_value_text), 
        CASE 
            WHEN e.entity_code LIKE '1%' THEN 'ASSETS'
            WHEN e.entity_code LIKE '2%' THEN 'LIABILITIES'  
            WHEN e.entity_code LIKE '3%' THEN 'EQUITY'
            WHEN e.entity_code LIKE '4%' THEN 'REVENUE'
            WHEN e.entity_code LIKE '5%' THEN 'EXPENSES'
            WHEN e.entity_code LIKE '6%' THEN 'EXPENSES'
            ELSE 'OTHER'
        END
    ) as account_type,
    COALESCE(
        dd_ifrs.field_value_text,
        CASE 
            WHEN e.entity_code LIKE '11%' OR e.entity_code LIKE '12%' OR e.entity_code LIKE '13%' THEN 'Current Assets'
            WHEN e.entity_code LIKE '15%' OR e.entity_code LIKE '16%' OR e.entity_code LIKE '17%' THEN 'Non-Current Assets'
            WHEN e.entity_code LIKE '21%' OR e.entity_code LIKE '22%' OR e.entity_code LIKE '23%' THEN 'Current Liabilities'
            WHEN e.entity_code LIKE '25%' OR e.entity_code LIKE '26%' THEN 'Non-Current Liabilities'
            WHEN e.entity_code LIKE '3%' THEN 'Equity'
            WHEN e.entity_code LIKE '4%' THEN 'Revenue'
            WHEN e.entity_code LIKE '5%' THEN 'Operating Expenses'
            WHEN e.entity_code LIKE '6%' THEN 'Other Expenses'
            ELSE 'General'
        END
    ) as ifrs_classification,
    COALESCE(
        dd_level.field_value_number::integer, 
        CASE 
            WHEN e.entity_code ~ '^\d{7}$' THEN 1  -- 7 digits = level 1
            WHEN e.entity_code ~ '^\d{8}$' THEN 2  -- 8 digits = level 2
            ELSE 1
        END
    ) as account_level,
    CASE 
        WHEN COALESCE(dd_type.field_value_text, 
            CASE WHEN e.entity_code LIKE '1%' THEN 'ASSETS'
                 WHEN e.entity_code LIKE '5%' THEN 'EXPENSES'
                 WHEN e.entity_code LIKE '6%' THEN 'EXPENSES'
                 ELSE 'OTHER' END
        ) IN ('ASSETS', 'EXPENSES') THEN true
        ELSE false
    END as is_normal_debit,
    e.created_at,
    e.updated_at
FROM core_entities e
LEFT JOIN core_dynamic_data dd_type ON e.id = dd_type.entity_id AND dd_type.field_name = 'account_type'
LEFT JOIN core_dynamic_data dd_ifrs ON e.id = dd_ifrs.entity_id AND dd_ifrs.field_name = 'ifrs_classification'  
LEFT JOIN core_dynamic_data dd_level ON e.id = dd_level.entity_id AND dd_level.field_name = 'account_level'
WHERE e.entity_type = 'gl_account'
  AND e.organization_id IS NOT NULL;

-- ============================================================================
-- Account Balances View
-- ============================================================================
-- Calculates running balances for all GL accounts from transaction lines
CREATE OR REPLACE VIEW v_account_balances AS
WITH transaction_postings AS (
    SELECT 
        utl.line_entity_id as account_id,
        ut.organization_id,
        ut.transaction_date,
        SUM(CASE 
            WHEN COALESCE(utl.metadata->>'line_type', 'debit') = 'debit' 
                OR (COALESCE(utl.metadata->>'line_type', 'auto') = 'auto' AND utl.line_amount >= 0)
            THEN ABS(utl.line_amount) 
            ELSE 0 
        END) as debit_amount,
        SUM(CASE 
            WHEN COALESCE(utl.metadata->>'line_type', 'credit') = 'credit'
                OR (COALESCE(utl.metadata->>'line_type', 'auto') = 'auto' AND utl.line_amount < 0)
            THEN ABS(utl.line_amount) 
            ELSE 0 
        END) as credit_amount
    FROM universal_transaction_lines utl
    INNER JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.organization_id IS NOT NULL
      AND utl.line_entity_id IS NOT NULL
      AND utl.line_amount IS NOT NULL
    GROUP BY utl.line_entity_id, ut.organization_id, ut.transaction_date
)
SELECT 
    gl.account_id,
    gl.organization_id,
    gl.account_code,
    gl.account_name,
    gl.account_type,
    gl.ifrs_classification,
    gl.account_level,
    gl.is_normal_debit,
    COALESCE(SUM(tp.debit_amount), 0) as total_debits,
    COALESCE(SUM(tp.credit_amount), 0) as total_credits,
    COALESCE(SUM(tp.debit_amount), 0) - COALESCE(SUM(tp.credit_amount), 0) as net_balance,
    CASE 
        WHEN gl.is_normal_debit THEN 
            GREATEST(COALESCE(SUM(tp.debit_amount), 0) - COALESCE(SUM(tp.credit_amount), 0), 0)
        ELSE 0
    END as debit_balance,
    CASE 
        WHEN NOT gl.is_normal_debit THEN 
            GREATEST(COALESCE(SUM(tp.credit_amount), 0) - COALESCE(SUM(tp.debit_amount), 0), 0)
        ELSE 0  
    END as credit_balance,
    COUNT(tp.account_id) as transaction_count,
    MAX(tp.transaction_date) as last_transaction_date
FROM v_gl_accounts_enhanced gl
LEFT JOIN transaction_postings tp ON gl.account_id = tp.account_id AND gl.organization_id = tp.organization_id
GROUP BY gl.account_id, gl.organization_id, gl.account_code, gl.account_name, 
         gl.account_type, gl.ifrs_classification, gl.account_level, gl.is_normal_debit;

-- ============================================================================
-- Trial Balance View  
-- ============================================================================
-- Complete trial balance with account details and balance validation
CREATE OR REPLACE VIEW v_trial_balance AS
SELECT 
    ab.organization_id,
    ab.account_code,
    ab.account_name,
    ab.account_type,
    ab.ifrs_classification,
    ab.account_level,
    ab.is_normal_debit,
    ab.total_debits,
    ab.total_credits,
    ab.debit_balance,
    ab.credit_balance,
    ab.net_balance as balance,
    ab.transaction_count,
    ab.last_transaction_date,
    -- Balance validation
    (SELECT SUM(debit_balance) FROM v_account_balances WHERE organization_id = ab.organization_id) as total_trial_debits,
    (SELECT SUM(credit_balance) FROM v_account_balances WHERE organization_id = ab.organization_id) as total_trial_credits,
    (SELECT 
        ABS(SUM(debit_balance) - SUM(credit_balance)) < 0.01
        FROM v_account_balances 
        WHERE organization_id = ab.organization_id
    ) as is_balanced
FROM v_account_balances ab
WHERE ab.organization_id IS NOT NULL
ORDER BY ab.account_code;

-- ============================================================================
-- Profit & Loss View
-- ============================================================================
-- Income statement with proper account groupings and subtotals
CREATE OR REPLACE VIEW v_profit_loss AS
WITH account_totals AS (
    SELECT 
        organization_id,
        account_type,
        account_code,
        account_name,
        CASE 
            WHEN account_type = 'REVENUE' THEN credit_balance - debit_balance
            WHEN account_type IN ('EXPENSES', 'COGS') THEN -(debit_balance - credit_balance)
            ELSE net_balance
        END as pl_amount,
        account_level
    FROM v_account_balances
    WHERE account_type IN ('REVENUE', 'EXPENSES', 'COGS')
),
section_totals AS (
    SELECT 
        organization_id,
        'REVENUE' as section_type,
        SUM(CASE WHEN account_type = 'REVENUE' THEN pl_amount ELSE 0 END) as section_total
    FROM account_totals
    GROUP BY organization_id
    
    UNION ALL
    
    SELECT 
        organization_id,
        'COGS' as section_type,
        SUM(CASE WHEN account_type = 'COGS' THEN pl_amount ELSE 0 END) as section_total
    FROM account_totals
    GROUP BY organization_id
    
    UNION ALL
    
    SELECT 
        organization_id,
        'EXPENSES' as section_type,
        SUM(CASE WHEN account_type = 'EXPENSES' THEN pl_amount ELSE 0 END) as section_total
    FROM account_totals
    GROUP BY organization_id
)
SELECT 
    at.organization_id,
    at.account_code,
    at.account_name,
    at.account_type,
    at.pl_amount as current_period,
    0 as prior_period, -- Will be calculated by API for specific periods
    at.pl_amount as variance,
    0 as variance_percent,
    at.account_level,
    false as is_subtotal,
    -- Summary calculations
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'REVENUE') as total_revenue,
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'COGS') as total_cogs,
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'EXPENSES') as total_expenses,
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'REVENUE') +
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'COGS') as gross_profit,
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'REVENUE') +
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'COGS') +
    (SELECT section_total FROM section_totals st WHERE st.organization_id = at.organization_id AND st.section_type = 'EXPENSES') as net_income
FROM account_totals at
ORDER BY at.organization_id, at.account_type, at.account_code;

-- ============================================================================
-- Balance Sheet View
-- ============================================================================
-- Statement of financial position with proper IFRS classifications
CREATE OR REPLACE VIEW v_balance_sheet AS
WITH classified_accounts AS (
    SELECT 
        organization_id,
        account_code,
        account_name,
        account_type,
        ifrs_classification,
        account_level,
        CASE 
            WHEN account_type = 'ASSETS' THEN debit_balance - credit_balance
            WHEN account_type = 'LIABILITIES' THEN credit_balance - debit_balance  
            WHEN account_type = 'EQUITY' THEN credit_balance - debit_balance
            ELSE net_balance
        END as bs_amount,
        CASE 
            WHEN account_type = 'ASSETS' AND (
                ifrs_classification ILIKE '%current%' OR 
                account_name ILIKE '%cash%' OR 
                account_name ILIKE '%receivable%' OR
                account_name ILIKE '%inventory%' OR
                account_name ILIKE '%prepaid%'
            ) THEN 'CURRENT_ASSETS'
            WHEN account_type = 'ASSETS' THEN 'NON_CURRENT_ASSETS'
            WHEN account_type = 'LIABILITIES' AND (
                ifrs_classification ILIKE '%current%' OR
                account_name ILIKE '%payable%' OR
                account_name ILIKE '%accrued%' OR
                account_name ILIKE '%vat%' OR
                account_name ILIKE '%short%'
            ) THEN 'CURRENT_LIABILITIES'
            WHEN account_type = 'LIABILITIES' THEN 'NON_CURRENT_LIABILITIES'
            WHEN account_type = 'EQUITY' THEN 'EQUITY'
            ELSE 'OTHER'
        END as bs_classification
    FROM v_account_balances
    WHERE account_type IN ('ASSETS', 'LIABILITIES', 'EQUITY')
),
section_totals AS (
    SELECT 
        organization_id,
        bs_classification,
        SUM(bs_amount) as section_total
    FROM classified_accounts
    GROUP BY organization_id, bs_classification
)
SELECT 
    ca.organization_id,
    ca.account_code,
    ca.account_name,
    ca.account_type,
    ca.bs_classification,
    ca.ifrs_classification,
    ca.account_level,
    ca.bs_amount as current_amount,
    0 as prior_amount, -- Will be calculated by API for specific periods
    ca.bs_amount as variance,
    0 as variance_percent,
    false as is_subtotal,
    -- Summary totals
    (SELECT COALESCE(SUM(section_total), 0) FROM section_totals st 
     WHERE st.organization_id = ca.organization_id 
     AND st.bs_classification IN ('CURRENT_ASSETS', 'NON_CURRENT_ASSETS')) as total_assets,
    (SELECT COALESCE(SUM(section_total), 0) FROM section_totals st 
     WHERE st.organization_id = ca.organization_id 
     AND st.bs_classification IN ('CURRENT_LIABILITIES', 'NON_CURRENT_LIABILITIES')) as total_liabilities,
    (SELECT COALESCE(SUM(section_total), 0) FROM section_totals st 
     WHERE st.organization_id = ca.organization_id 
     AND st.bs_classification = 'EQUITY') as total_equity,
    -- Balance validation
    ABS((SELECT COALESCE(SUM(section_total), 0) FROM section_totals st 
         WHERE st.organization_id = ca.organization_id 
         AND st.bs_classification IN ('CURRENT_ASSETS', 'NON_CURRENT_ASSETS')) -
        (SELECT COALESCE(SUM(section_total), 0) FROM section_totals st 
         WHERE st.organization_id = ca.organization_id 
         AND st.bs_classification IN ('CURRENT_LIABILITIES', 'NON_CURRENT_LIABILITIES', 'EQUITY'))) < 0.01 as is_balanced
FROM classified_accounts ca
ORDER BY ca.organization_id, ca.bs_classification, ca.account_code;

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Index on core_entities for GL accounts
CREATE INDEX IF NOT EXISTS idx_core_entities_gl_accounts 
ON core_entities(organization_id, entity_type) 
WHERE entity_type = 'gl_account';

-- Index on transaction lines for financial calculations
CREATE INDEX IF NOT EXISTS idx_transaction_lines_financial 
ON universal_transaction_lines(line_entity_id, line_amount);

-- Index on transactions for date filtering
CREATE INDEX IF NOT EXISTS idx_transactions_date_org 
ON universal_transactions(organization_id, transaction_date);

-- Index on dynamic data for account metadata
CREATE INDEX IF NOT EXISTS idx_dynamic_data_account_fields
ON core_dynamic_data(entity_id, field_name) 
WHERE field_name IN ('account_type', 'ifrs_classification', 'account_level');

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON v_gl_accounts_enhanced TO authenticated;
GRANT SELECT ON v_account_balances TO authenticated;  
GRANT SELECT ON v_trial_balance TO authenticated;
GRANT SELECT ON v_profit_loss TO authenticated;
GRANT SELECT ON v_balance_sheet TO authenticated;

-- Grant SELECT permissions to service role for API access
GRANT SELECT ON v_gl_accounts_enhanced TO service_role;
GRANT SELECT ON v_account_balances TO service_role;
GRANT SELECT ON v_trial_balance TO service_role;
GRANT SELECT ON v_profit_loss TO service_role;
GRANT SELECT ON v_balance_sheet TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON VIEW v_gl_accounts_enhanced IS 'Enhanced GL accounts with IFRS classifications and account metadata';
COMMENT ON VIEW v_account_balances IS 'Current account balances calculated from transaction lines with debit/credit totals';
COMMENT ON VIEW v_trial_balance IS 'Complete trial balance with balance validation and account details';
COMMENT ON VIEW v_profit_loss IS 'Profit & Loss statement with proper income statement account groupings';  
COMMENT ON VIEW v_balance_sheet IS 'Balance sheet with IFRS-compliant asset, liability, and equity classifications';