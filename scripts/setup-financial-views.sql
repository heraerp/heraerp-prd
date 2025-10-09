-- ============================================================================
-- HERA Financial Views and RPC Functions Setup Script
-- ============================================================================
-- Run this script to create all financial reporting views and RPC functions

\echo 'Creating HERA Financial Reporting Views...'

\i database/views/financial-reports.sql

\echo 'Creating HERA Financial Reporting RPC Functions...'

\i database/functions/financial-reports-rpc.sql

\echo 'Financial reporting setup complete!'
\echo ''
\echo 'Available views:'
\echo '- v_gl_accounts_enhanced'
\echo '- v_account_balances'
\echo '- v_trial_balance'
\echo '- v_profit_loss'
\echo '- v_balance_sheet'
\echo ''
\echo 'Available RPC functions:'
\echo '- hera_trial_balance_v1(organization_id, as_of_date, include_zero_balances)'
\echo '- hera_profit_loss_v1(organization_id, start_date, end_date, prior_start_date, prior_end_date)'
\echo '- hera_balance_sheet_v1(organization_id, as_of_date, prior_as_of_date)'
\echo '- hera_account_summary_v1(organization_id, account_code)'
\echo ''
\echo 'Test with:'
\echo 'SELECT * FROM hera_trial_balance_v1(''your-org-id'', CURRENT_DATE, false);'