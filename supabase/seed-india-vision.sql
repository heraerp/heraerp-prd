-- ================================================================================================
-- KERALA VISION BROADBAND IPO-READY ERP SETUP
-- ================================================================================================
-- Complete seed data for Kerala Vision using HERA DNA components:
-- 1. Organization setup with proper structure
-- 2. COA with Indian Accounting Standards (IndAS) compliance  
-- 3. Finance DNA integration for complete audit trail
-- 4. Document numbering for all transactions
-- 5. Customer/Agent management (3000 agents)
-- 6. Revenue stream tracking
-- 7. Budgeting and variance analysis
-- 8. IPO readiness with SEBI ratios

-- Set the organization context
DO $$
DECLARE
    v_org_id uuid;
    v_user_id uuid;
    v_coa_count int;
BEGIN
    -- ================================================================================================
    -- STEP 1: Create Kerala Vision Organization
    -- ================================================================================================
    INSERT INTO core_organizations (
        id, organization_name, organization_code, 
        country_code, currency_code, fiscal_year_start,
        settings, created_at
    ) VALUES (
        'a1b2c3d4-5678-90ab-cdef-keralabroadband',
        'Kerala Vision Broadband Ltd',
        'KVBL',
        'IN',
        'INR',
        '04-01',
        jsonb_build_object(
            'industry', 'telecom',
            'sub_industry', 'broadband_cable',
            'ipo_target_year', 2028,
            'employee_count', 3000,
            'operation_regions', ARRAY['Kerala'],
            'business_lines', jsonb_build_array(
                'broadband_services',
                'cable_operations',
                'advertisement',
                'channel_placement',
                'leased_lines'
            ),
            'compliance_requirements', jsonb_build_array(
                'IndAS',
                'SEBI',
                'GST',
                'TDS',
                'Companies_Act_2013'
            )
        ),
        '2024-08-25'::timestamp
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_org_id;

    -- Create subsidiary company
    INSERT INTO core_organizations (
        id, organization_name, organization_code,
        country_code, currency_code, fiscal_year_start,
        settings, created_at
    ) VALUES (
        'a1b2c3d4-5678-90ab-cdef-keralacables',
        'Kerala Communicators Cables Ltd',
        'KCCL',
        'IN',
        'INR', 
        '04-01',
        jsonb_build_object(
            'parent_company_id', v_org_id,
            'industry', 'telecom',
            'sub_industry', 'cable_operations',
            'operation_type', 'local_cable_operator'
        ),
        '2024-08-25'::timestamp
    )
    ON CONFLICT (id) DO NOTHING;

    -- ================================================================================================
    -- STEP 2: Create COA with IndAS Compliance
    -- ================================================================================================
    
    -- Assets (1xxxxx series) - IndAS compliant
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES 
    -- Current Assets
    (v_org_id, 'gl_account', 'Cash and Cash Equivalents', '1100000', 'HERA.FIN.GL.ASSET.CURRENT.CASH.V1', 
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'cash_and_cash_equivalents')),
    (v_org_id, 'gl_account', 'Bank Accounts', '1110000', 'HERA.FIN.GL.ASSET.CURRENT.BANK.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'cash_and_cash_equivalents')),
    (v_org_id, 'gl_account', 'Trade Receivables', '1200000', 'HERA.FIN.GL.ASSET.CURRENT.AR.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'trade_receivables')),
    (v_org_id, 'gl_account', 'Subscription Receivables', '1210000', 'HERA.FIN.GL.ASSET.CURRENT.AR_SUB.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'trade_receivables')),
    (v_org_id, 'gl_account', 'Advertisement Receivables', '1220000', 'HERA.FIN.GL.ASSET.CURRENT.AR_AD.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'trade_receivables')),
    (v_org_id, 'gl_account', 'Inventory - Cable Equipment', '1300000', 'HERA.FIN.GL.ASSET.CURRENT.INV.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'inventories')),
    (v_org_id, 'gl_account', 'GST Input Credit', '1400000', 'HERA.FIN.GL.ASSET.CURRENT.GST.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'current_asset', 'indas_classification', 'other_current_assets')),
    
    -- Non-Current Assets  
    (v_org_id, 'gl_account', 'Property, Plant and Equipment', '1500000', 'HERA.FIN.GL.ASSET.FIXED.PPE.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'fixed_asset', 'indas_classification', 'property_plant_equipment')),
    (v_org_id, 'gl_account', 'Network Infrastructure', '1510000', 'HERA.FIN.GL.ASSET.FIXED.NETWORK.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'fixed_asset', 'indas_classification', 'property_plant_equipment')),
    (v_org_id, 'gl_account', 'Cable Infrastructure', '1520000', 'HERA.FIN.GL.ASSET.FIXED.CABLE.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'fixed_asset', 'indas_classification', 'property_plant_equipment')),
    (v_org_id, 'gl_account', 'Office Equipment', '1530000', 'HERA.FIN.GL.ASSET.FIXED.OFFICE.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'fixed_asset', 'indas_classification', 'property_plant_equipment')),
    (v_org_id, 'gl_account', 'Accumulated Depreciation', '1590000', 'HERA.FIN.GL.ASSET.CONTRA.DEPR.V1',
     jsonb_build_object('account_type', 'asset', 'account_subtype', 'contra_asset', 'indas_classification', 'accumulated_depreciation')),
    
    -- Liabilities (2xxxxx series)
    (v_org_id, 'gl_account', 'Accounts Payable', '2100000', 'HERA.FIN.GL.LIABILITY.CURRENT.AP.V1',
     jsonb_build_object('account_type', 'liability', 'account_subtype', 'current_liability', 'indas_classification', 'trade_payables')),
    (v_org_id, 'gl_account', 'GST Payable', '2200000', 'HERA.FIN.GL.LIABILITY.CURRENT.GST.V1',
     jsonb_build_object('account_type', 'liability', 'account_subtype', 'current_liability', 'indas_classification', 'other_current_liabilities')),
    (v_org_id, 'gl_account', 'TDS Payable', '2210000', 'HERA.FIN.GL.LIABILITY.CURRENT.TDS.V1',
     jsonb_build_object('account_type', 'liability', 'account_subtype', 'current_liability', 'indas_classification', 'other_current_liabilities')),
    (v_org_id, 'gl_account', 'Employee Benefits Payable', '2300000', 'HERA.FIN.GL.LIABILITY.CURRENT.BENEFITS.V1',
     jsonb_build_object('account_type', 'liability', 'account_subtype', 'current_liability', 'indas_classification', 'employee_benefit_obligations')),
    (v_org_id, 'gl_account', 'Deferred Revenue - Subscriptions', '2400000', 'HERA.FIN.GL.LIABILITY.CURRENT.DEFERRED.V1',
     jsonb_build_object('account_type', 'liability', 'account_subtype', 'current_liability', 'indas_classification', 'deferred_revenue')),
    (v_org_id, 'gl_account', 'Long Term Debt', '2500000', 'HERA.FIN.GL.LIABILITY.LONGTERM.DEBT.V1',
     jsonb_build_object('account_type', 'liability', 'account_subtype', 'long_term_liability', 'indas_classification', 'borrowings')),
    
    -- Equity (3xxxxx series)
    (v_org_id, 'gl_account', 'Share Capital', '3100000', 'HERA.FIN.GL.EQUITY.CAPITAL.SHARE.V1',
     jsonb_build_object('account_type', 'equity', 'account_subtype', 'equity', 'indas_classification', 'equity_share_capital')),
    (v_org_id, 'gl_account', 'Share Premium', '3200000', 'HERA.FIN.GL.EQUITY.CAPITAL.PREMIUM.V1',
     jsonb_build_object('account_type', 'equity', 'account_subtype', 'equity', 'indas_classification', 'share_premium')),
    (v_org_id, 'gl_account', 'Retained Earnings', '3300000', 'HERA.FIN.GL.EQUITY.RETAINED.V1',
     jsonb_build_object('account_type', 'equity', 'account_subtype', 'retained_earnings', 'indas_classification', 'retained_earnings')),
    
    -- Revenue (4xxxxx series)
    (v_org_id, 'gl_account', 'Broadband Subscription Revenue', '4100000', 'HERA.FIN.GL.REVENUE.OPERATING.BROADBAND.V1',
     jsonb_build_object('account_type', 'revenue', 'account_subtype', 'operating_revenue', 'indas_classification', 'revenue_from_operations')),
    (v_org_id, 'gl_account', 'Cable TV Revenue', '4200000', 'HERA.FIN.GL.REVENUE.OPERATING.CABLE.V1',
     jsonb_build_object('account_type', 'revenue', 'account_subtype', 'operating_revenue', 'indas_classification', 'revenue_from_operations')),
    (v_org_id, 'gl_account', 'Advertisement Revenue', '4300000', 'HERA.FIN.GL.REVENUE.OPERATING.ADS.V1',
     jsonb_build_object('account_type', 'revenue', 'account_subtype', 'operating_revenue', 'indas_classification', 'revenue_from_operations')),
    (v_org_id, 'gl_account', 'Channel Placement Revenue', '4400000', 'HERA.FIN.GL.REVENUE.OPERATING.CHANNEL.V1',
     jsonb_build_object('account_type', 'revenue', 'account_subtype', 'operating_revenue', 'indas_classification', 'revenue_from_operations')),
    (v_org_id, 'gl_account', 'Leased Line Revenue', '4500000', 'HERA.FIN.GL.REVENUE.OPERATING.LEASE.V1',
     jsonb_build_object('account_type', 'revenue', 'account_subtype', 'operating_revenue', 'indas_classification', 'revenue_from_operations')),
    
    -- Expenses (5xxxxx - 8xxxxx series)
    (v_org_id, 'gl_account', 'Network Operation Costs', '5100000', 'HERA.FIN.GL.EXPENSE.DIRECT.NETWORK.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'cost_of_goods_sold', 'indas_classification', 'cost_of_operations')),
    (v_org_id, 'gl_account', 'Bandwidth Costs', '5110000', 'HERA.FIN.GL.EXPENSE.DIRECT.BANDWIDTH.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'cost_of_goods_sold', 'indas_classification', 'cost_of_operations')),
    (v_org_id, 'gl_account', 'Cable Content Costs', '5200000', 'HERA.FIN.GL.EXPENSE.DIRECT.CONTENT.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'cost_of_goods_sold', 'indas_classification', 'cost_of_operations')),
    (v_org_id, 'gl_account', 'Employee Benefits Expense', '6100000', 'HERA.FIN.GL.EXPENSE.OPERATING.PAYROLL.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'operating_expense', 'indas_classification', 'employee_benefit_expense')),
    (v_org_id, 'gl_account', 'Agent Commissions', '6200000', 'HERA.FIN.GL.EXPENSE.OPERATING.COMMISSION.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'operating_expense', 'indas_classification', 'other_expenses')),
    (v_org_id, 'gl_account', 'Depreciation Expense', '6300000', 'HERA.FIN.GL.EXPENSE.OPERATING.DEPRECIATION.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'operating_expense', 'indas_classification', 'depreciation_and_amortisation')),
    (v_org_id, 'gl_account', 'Marketing and Advertisement', '6400000', 'HERA.FIN.GL.EXPENSE.OPERATING.MARKETING.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'operating_expense', 'indas_classification', 'other_expenses')),
    (v_org_id, 'gl_account', 'Administrative Expenses', '6500000', 'HERA.FIN.GL.EXPENSE.OPERATING.ADMIN.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'operating_expense', 'indas_classification', 'other_expenses')),
    (v_org_id, 'gl_account', 'Finance Costs', '7100000', 'HERA.FIN.GL.EXPENSE.FINANCE.INTEREST.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'other_expense', 'indas_classification', 'finance_costs')),
    (v_org_id, 'gl_account', 'Income Tax Expense', '8100000', 'HERA.FIN.GL.EXPENSE.TAX.INCOME.V1',
     jsonb_build_object('account_type', 'expense', 'account_subtype', 'other_expense', 'indas_classification', 'tax_expense'))
    ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- Count created GL accounts
    SELECT COUNT(*) INTO v_coa_count 
    FROM core_entities 
    WHERE organization_id = v_org_id 
    AND entity_type = 'gl_account';
    
    RAISE NOTICE 'Created % GL accounts for Kerala Vision', v_coa_count;

    -- ================================================================================================
    -- STEP 3: Setup Finance DNA Integration for Audit Trail
    -- ================================================================================================
    
    -- Enable Finance DNA for automatic GL posting
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES (
        v_org_id,
        'system_config',
        'Finance DNA Configuration',
        'FINANCE-DNA-CONFIG',
        'HERA.SYSTEM.CONFIG.FINANCE_DNA.V1',
        jsonb_build_object(
            'enabled', true,
            'auto_journal_enabled', true,
            'audit_trail_level', 'detailed',
            'posting_rules', jsonb_build_object(
                'broadband_subscription', jsonb_build_object(
                    'debit', '1210000',  -- Subscription Receivables
                    'credit', '4100000'  -- Broadband Revenue
                ),
                'cable_tv_subscription', jsonb_build_object(
                    'debit', '1210000',  -- Subscription Receivables
                    'credit', '4200000'  -- Cable TV Revenue
                ),
                'advertisement_booking', jsonb_build_object(
                    'debit', '1220000',  -- Advertisement Receivables
                    'credit', '4300000'  -- Advertisement Revenue
                ),
                'payment_received', jsonb_build_object(
                    'debit', '1110000',  -- Bank Account
                    'credit', '1210000'  -- Clear Receivables
                )
            ),
            'compliance_checks', jsonb_build_array(
                'gst_validation',
                'tds_deduction',
                'related_party_flagging',
                'audit_trail_completeness'
            )
        )
    ) ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- ================================================================================================
    -- STEP 4: Setup Document Numbering
    -- ================================================================================================
    
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES
    (v_org_id, 'document_sequence', 'Invoice Numbering', 'SEQ-INVOICE', 'HERA.SYSTEM.SEQUENCE.INVOICE.V1',
     jsonb_build_object('prefix', 'KV/INV/', 'current_number', 10000, 'suffix', '/24-25')),
    (v_org_id, 'document_sequence', 'Receipt Numbering', 'SEQ-RECEIPT', 'HERA.SYSTEM.SEQUENCE.RECEIPT.V1',
     jsonb_build_object('prefix', 'KV/RCP/', 'current_number', 20000, 'suffix', '/24-25')),
    (v_org_id, 'document_sequence', 'Customer Code', 'SEQ-CUSTOMER', 'HERA.SYSTEM.SEQUENCE.CUSTOMER.V1',
     jsonb_build_object('prefix', 'CUST-', 'current_number', 100000, 'suffix', '')),
    (v_org_id, 'document_sequence', 'Agent Code', 'SEQ-AGENT', 'HERA.SYSTEM.SEQUENCE.AGENT.V1',
     jsonb_build_object('prefix', 'AGT-', 'current_number', 1000, 'suffix', ''))
    ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- ================================================================================================
    -- STEP 5: Create Sample Agents and Customers
    -- ================================================================================================
    
    -- Create regions
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES
    (v_org_id, 'region', 'Thiruvananthapuram', 'REG-TVM', 'HERA.MASTER.REGION.STATE.KERALA.V1',
     jsonb_build_object('state', 'Kerala', 'zone', 'South')),
    (v_org_id, 'region', 'Kochi', 'REG-COK', 'HERA.MASTER.REGION.STATE.KERALA.V1',
     jsonb_build_object('state', 'Kerala', 'zone', 'Central')),
    (v_org_id, 'region', 'Kozhikode', 'REG-CCJ', 'HERA.MASTER.REGION.STATE.KERALA.V1',
     jsonb_build_object('state', 'Kerala', 'zone', 'North'))
    ON CONFLICT (organization_id, entity_code) DO NOTHING;
    
    -- Create sample agents (representing the 3000 agents)
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES
    (v_org_id, 'agent', 'Rajesh Kumar - TVM South', 'AGT-1001', 'HERA.CRM.AGENT.FIELD.SALES.V1',
     jsonb_build_object('region', 'REG-TVM', 'mobile', '+91-9876543210', 'commission_rate', 0.10)),
    (v_org_id, 'agent', 'Priya Nair - Kochi Central', 'AGT-1002', 'HERA.CRM.AGENT.FIELD.SALES.V1',
     jsonb_build_object('region', 'REG-COK', 'mobile', '+91-9876543211', 'commission_rate', 0.12)),
    (v_org_id, 'agent', 'Mohammed Ali - Kozhikode North', 'AGT-1003', 'HERA.CRM.AGENT.FIELD.SALES.V1',
     jsonb_build_object('region', 'REG-CCJ', 'mobile', '+91-9876543212', 'commission_rate', 0.11))
    ON CONFLICT (organization_id, entity_code) DO NOTHING;
    
    -- Create sample customers
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES
    (v_org_id, 'customer', 'ABC Enterprises', 'CUST-100001', 'HERA.CRM.CUSTOMER.CORPORATE.V1',
     jsonb_build_object('customer_type', 'corporate', 'plan', 'enterprise_100mbps', 'region', 'REG-TVM')),
    (v_org_id, 'customer', 'John Doe', 'CUST-100002', 'HERA.CRM.CUSTOMER.RETAIL.V1',
     jsonb_build_object('customer_type', 'retail', 'plan', 'home_50mbps', 'region', 'REG-COK')),
    (v_org_id, 'customer', 'XYZ Shopping Mall', 'CUST-100003', 'HERA.CRM.CUSTOMER.CORPORATE.V1',
     jsonb_build_object('customer_type', 'corporate', 'plan', 'business_200mbps', 'region', 'REG-CCJ'))
    ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- ================================================================================================
    -- STEP 6: Create Subscription Plans and Pricing
    -- ================================================================================================
    
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES
    (v_org_id, 'product', 'Home Broadband 50 Mbps', 'PLAN-HOME-50', 'HERA.PRODUCT.SERVICE.BROADBAND.V1',
     jsonb_build_object('speed', '50mbps', 'monthly_price', 799, 'gst_rate', 0.18, 'category', 'retail')),
    (v_org_id, 'product', 'Business Broadband 100 Mbps', 'PLAN-BIZ-100', 'HERA.PRODUCT.SERVICE.BROADBAND.V1',
     jsonb_build_object('speed', '100mbps', 'monthly_price', 2499, 'gst_rate', 0.18, 'category', 'business')),
    (v_org_id, 'product', 'Enterprise Broadband 200 Mbps', 'PLAN-ENT-200', 'HERA.PRODUCT.SERVICE.BROADBAND.V1',
     jsonb_build_object('speed', '200mbps', 'monthly_price', 4999, 'gst_rate', 0.18, 'category', 'enterprise')),
    (v_org_id, 'product', 'Cable TV Basic Pack', 'PLAN-CABLE-BASIC', 'HERA.PRODUCT.SERVICE.CABLE.V1',
     jsonb_build_object('channels', 100, 'monthly_price', 299, 'gst_rate', 0.18, 'category', 'cable')),
    (v_org_id, 'product', 'Advertisement Slot - Prime Time', 'AD-PRIME', 'HERA.PRODUCT.SERVICE.ADVERTISEMENT.V1',
     jsonb_build_object('duration', '30_seconds', 'rate_per_slot', 5000, 'gst_rate', 0.18, 'time_slot', '7pm-10pm'))
    ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- ================================================================================================
    -- STEP 7: Create Sample Transactions (Revenue Streams)
    -- ================================================================================================
    
    -- Broadband subscription for current month
    INSERT INTO universal_transactions (
        id, organization_id, transaction_type, transaction_code, transaction_date,
        source_entity_id, reference_entity_id, total_amount, smart_code, metadata
    )
    SELECT 
        gen_random_uuid(),
        v_org_id,
        'subscription',
        'KV/INV/10001/24-25',
        CURRENT_DATE,
        c.id, -- customer
        p.id, -- plan
        799,
        'HERA.TELECOM.REVENUE.BROADBAND.SUBSCRIPTION.V1',
        jsonb_build_object(
            'billing_month', to_char(CURRENT_DATE, 'YYYY-MM'),
            'plan_name', 'Home Broadband 50 Mbps',
            'gst_amount', 121.86,
            'net_amount', 677.14,
            'payment_status', 'pending'
        )
    FROM core_entities c, core_entities p
    WHERE c.organization_id = v_org_id 
    AND c.entity_code = 'CUST-100002'
    AND p.organization_id = v_org_id
    AND p.entity_code = 'PLAN-HOME-50'
    ON CONFLICT (id) DO NOTHING;

    -- Advertisement booking
    INSERT INTO universal_transactions (
        id, organization_id, transaction_type, transaction_code, transaction_date,
        source_entity_id, reference_entity_id, total_amount, smart_code, metadata
    )
    SELECT
        gen_random_uuid(),
        v_org_id,
        'advertisement',
        'KV/AD/5001/24-25',
        CURRENT_DATE - INTERVAL '5 days',
        c.id, -- advertiser
        p.id, -- ad slot
        50000,
        'HERA.TELECOM.REVENUE.ADVERTISEMENT.BOOKING.V1',
        jsonb_build_object(
            'campaign_name', 'Diwali Sale Campaign',
            'slots_booked', 10,
            'broadcast_dates', jsonb_build_array('2024-10-25', '2024-10-26', '2024-10-27'),
            'gst_amount', 7627.12,
            'net_amount', 42372.88
        )
    FROM core_entities c, core_entities p
    WHERE c.organization_id = v_org_id
    AND c.entity_code = 'CUST-100001'
    AND p.organization_id = v_org_id
    AND p.entity_code = 'AD-PRIME'
    ON CONFLICT (id) DO NOTHING;

    -- ================================================================================================
    -- STEP 8: Create Budget for IPO Preparation
    -- ================================================================================================
    
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES (
        v_org_id,
        'budget',
        'FY 2024-25 Annual Budget',
        'BUDGET-FY2425',
        'HERA.FIN.BUDGET.ANNUAL.MASTER.V1',
        jsonb_build_object(
            'fiscal_year', '2024-25',
            'budget_type', 'operating',
            'total_revenue_budget', 5000000000, -- 500 Crores
            'total_expense_budget', 4200000000, -- 420 Crores
            'ebitda_target', 800000000, -- 80 Crores
            'approval_status', 'approved',
            'ipo_preparation_allocation', 50000000 -- 5 Crores for IPO prep
        )
    ) ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- Budget lines for revenue streams
    INSERT INTO universal_transactions (
        organization_id, transaction_type, transaction_code, transaction_date,
        reference_entity_id, total_amount, smart_code, metadata
    )
    SELECT
        v_org_id,
        'budget_line',
        'BUDGET-LINE-' || row_number() OVER (),
        '2024-04-01'::date,
        b.id,
        amounts.amount,
        'HERA.FIN.BUDGET.LINE.REVENUE.V1',
        jsonb_build_object(
            'gl_account', amounts.gl_code,
            'account_name', amounts.account_name,
            'monthly_budget', amounts.amount / 12
        )
    FROM core_entities b,
    (VALUES 
        ('4100000', 'Broadband Revenue', 3000000000),
        ('4200000', 'Cable TV Revenue', 1200000000),
        ('4300000', 'Advertisement Revenue', 500000000),
        ('4400000', 'Channel Placement Revenue', 200000000),
        ('4500000', 'Leased Line Revenue', 100000000)
    ) AS amounts(gl_code, account_name, amount)
    WHERE b.organization_id = v_org_id
    AND b.entity_code = 'BUDGET-FY2425'
    ON CONFLICT (organization_id, transaction_code) DO NOTHING;

    -- ================================================================================================
    -- STEP 9: IPO Readiness - SEBI Ratios Configuration
    -- ================================================================================================
    
    INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code, metadata)
    VALUES (
        v_org_id,
        'kpi_config',
        'SEBI IPO Ratios Configuration',
        'KPI-SEBI-IPO',
        'HERA.FIN.KPI.REGULATORY.SEBI.V1',
        jsonb_build_object(
            'ratios', jsonb_build_array(
                jsonb_build_object(
                    'name', 'Debt to Equity Ratio',
                    'formula', 'total_debt / total_equity',
                    'target', '< 2.0',
                    'current_value', null,
                    'frequency', 'quarterly'
                ),
                jsonb_build_object(
                    'name', 'Return on Net Worth',
                    'formula', 'net_profit / net_worth * 100',
                    'target', '> 15%',
                    'current_value', null,
                    'frequency', 'annual'
                ),
                jsonb_build_object(
                    'name', 'Net Asset Value per Share',
                    'formula', 'net_assets / total_shares',
                    'target', 'positive_trend',
                    'current_value', null,
                    'frequency', 'quarterly'
                ),
                jsonb_build_object(
                    'name', 'Earnings Per Share',
                    'formula', 'net_profit / weighted_avg_shares',
                    'target', 'growth > 10%',
                    'current_value', null,
                    'frequency', 'quarterly'
                ),
                jsonb_build_object(
                    'name', 'Price to Earnings Ratio',
                    'formula', 'market_price / eps',
                    'target', '15-25',
                    'current_value', null,
                    'frequency', 'daily'
                ),
                jsonb_build_object(
                    'name', 'Net Profit Margin',
                    'formula', 'net_profit / total_revenue * 100',
                    'target', '> 10%',
                    'current_value', null,
                    'frequency', 'quarterly'
                )
            ),
            'compliance_checklist', jsonb_build_array(
                'three_years_profitable_operations',
                'clean_audit_reports',
                'related_party_transactions_disclosed',
                'corporate_governance_compliance',
                'minimum_public_shareholding_25_percent'
            )
        )
    ) ON CONFLICT (organization_id, entity_code) DO NOTHING;

    -- ================================================================================================
    -- STEP 10: Related Party Transaction Tracking
    -- ================================================================================================
    
    -- Create relationship between parent and subsidiary
    INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, 
        relationship_type, smart_code, relationship_data
    )
    SELECT
        v_org_id,
        v_org_id,
        'a1b2c3d4-5678-90ab-cdef-keralacables'::uuid,
        'parent_subsidiary',
        'HERA.CORPORATE.RELATIONSHIP.SUBSIDIARY.V1',
        jsonb_build_object(
            'ownership_percentage', 100,
            'consolidation_method', 'full',
            'related_party', true
        )
    WHERE EXISTS (SELECT 1 FROM core_organizations WHERE id = v_org_id)
    ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type) DO NOTHING;

    -- Create intercompany transaction sample
    INSERT INTO universal_transactions (
        organization_id, transaction_type, transaction_code, transaction_date,
        source_entity_id, target_entity_id, total_amount, smart_code, metadata
    )
    VALUES (
        v_org_id,
        'intercompany',
        'IC/2024/001',
        CURRENT_DATE - INTERVAL '30 days',
        v_org_id,
        'a1b2c3d4-5678-90ab-cdef-keralacables'::uuid,
        2500000,
        'HERA.FIN.TRANSACTION.INTERCOMPANY.V1',
        jsonb_build_object(
            'transaction_nature', 'service_fee',
            'description', 'Management services provided to subsidiary',
            'related_party_disclosure_required', true,
            'elimination_required', true,
            'audit_flag', 'high_priority'
        )
    ) ON CONFLICT (organization_id, transaction_code) DO NOTHING;

    RAISE NOTICE 'Kerala Vision ERP setup completed successfully!';
    RAISE NOTICE 'Organization ID: %', v_org_id;
    RAISE NOTICE 'IPO target year: 2028';
    RAISE NOTICE 'Next steps: Run the application and access the IPO readiness dashboard';
    
END $$;