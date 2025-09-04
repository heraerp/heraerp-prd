-- ============================================================================
-- HERA UNIVERSAL CHART OF ACCOUNTS - MULTI-BRANCH SALON BUSINESS
-- ============================================================================
-- Organizations:
-- - Head Office: "Salon Group" (849b6efe-2bf0-438f-9c70-01835ac2fe15)
-- - Branch 1: "Hair Talkz • Park Regis Kris Kin (Karama)" (e3a9ff9e-bb83-43a8-b062-b85e7a2b4258)
-- - Branch 2: "Hair Talkz • Mercure Gold (Al Mina Rd)" (0b1b37cd-4096-4718-8cd4-e370f234005b)
--
-- Features:
-- - Full IFRS lineage and compliance
-- - Multi-branch consolidation support
-- - Salon industry-specific accounts
-- - Inter-branch transaction handling
-- - Branch-level and consolidated reporting
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE CHART OF ACCOUNTS TEMPLATE
-- ============================================================================
-- This template will be used for all organizations (Head Office + Branches)

-- Function to create COA for any organization
CREATE OR REPLACE FUNCTION create_salon_coa(
    p_organization_id UUID,
    p_is_head_office BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
    v_entity_id UUID;
    v_parent_id UUID;
BEGIN
    -- ========================================================================
    -- 1. ASSETS (1000000-1999999)
    -- ========================================================================
    
    -- 1.1 Current Assets (1100000-1199999)
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '1100000', 'Current Assets', 'assets', 
     jsonb_build_object(
         'account_type', 'assets',
         'is_header', true,
         'ifrs_classification', 'current_assets',
         'ifrs_code', 'IAS1.54',
         'consolidation_method', 'sum',
         'statement_type', 'SFP',
         'normal_balance', 'debit'
     ))
    RETURNING id INTO v_parent_id;

    -- Cash accounts
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '1110000', 'Cash and Cash Equivalents', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'cash_and_cash_equivalents',
         'ifrs_code', 'IAS7.45',
         'is_header', true
     )),
    (p_organization_id, 'gl_account', '1111000', 'Petty Cash - Salon', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'cash',
         'branch_specific', true,
         'require_daily_reconciliation', true
     )),
    (p_organization_id, 'gl_account', '1111100', 'Cash Register - Hair Services', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'cash',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1111200', 'Cash Register - Product Sales', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'cash',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1112000', 'Bank Account - Operating', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'cash_at_bank',
         'require_reconciliation', true
     )),
    (p_organization_id, 'gl_account', '1113000', 'Bank Account - Payroll', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'cash_at_bank',
         'restricted_use', 'payroll'
     ));

    -- Receivables
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '1120000', 'Accounts Receivable', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'trade_receivables',
         'ifrs_code', 'IFRS9.5.5',
         'is_header', true
     )),
    (p_organization_id, 'gl_account', '1121000', 'Customer Receivables - Services', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'trade_receivables',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1122000', 'Customer Receivables - Products', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'trade_receivables',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1123000', 'Gift Card Receivables', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'other_receivables',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1125000', 'Staff Advances', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'other_receivables',
         'branch_specific', true
     ));

    -- Inter-branch accounts (only for branches)
    IF NOT p_is_head_office THEN
        INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
        VALUES 
        (p_organization_id, 'gl_account', '1128000', 'Inter-Branch Receivables', 'assets', v_parent_id,
         jsonb_build_object(
             'account_type', 'assets',
             'ifrs_classification', 'intercompany_receivables',
             'elimination_required', true,
             'consolidation_method', 'eliminate'
         ));
    END IF;

    -- Inventory
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '1130000', 'Inventory', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'inventories',
         'ifrs_code', 'IAS2.36',
         'is_header', true
     )),
    (p_organization_id, 'gl_account', '1131000', 'Hair Care Products', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'merchandise_inventory',
         'valuation_method', 'FIFO',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1132000', 'Hair Color Products', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'merchandise_inventory',
         'valuation_method', 'FIFO',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1133000', 'Styling Products', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'merchandise_inventory',
         'valuation_method', 'FIFO',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1134000', 'Salon Supplies', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'supplies_inventory',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1135000', 'Retail Products for Sale', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'merchandise_inventory',
         'branch_specific', true
     ));

    -- Prepaid expenses
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '1140000', 'Prepaid Expenses', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'prepayments',
         'is_header', true
     )),
    (p_organization_id, 'gl_account', '1141000', 'Prepaid Rent', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'prepaid_rent',
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1142000', 'Prepaid Insurance', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'prepaid_insurance'
     )),
    (p_organization_id, 'gl_account', '1143000', 'Prepaid Marketing', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'prepaid_expenses'
     ));

    -- 1.2 Non-Current Assets (1200000-1299999)
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '1200000', 'Non-Current Assets', 'assets',
     jsonb_build_object(
         'account_type', 'assets',
         'is_header', true,
         'ifrs_classification', 'non_current_assets',
         'ifrs_code', 'IAS1.66'
     ))
    RETURNING id INTO v_parent_id;

    -- Property, Plant & Equipment
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '1210000', 'Property, Plant & Equipment', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'property_plant_equipment',
         'ifrs_code', 'IAS16.73',
         'is_header', true
     )),
    (p_organization_id, 'gl_account', '1211000', 'Leasehold Improvements', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'leasehold_improvements',
         'depreciation_method', 'straight_line',
         'useful_life_years', 5,
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1212000', 'Salon Equipment - Chairs', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'machinery_equipment',
         'depreciation_method', 'straight_line',
         'useful_life_years', 7,
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1213000', 'Salon Equipment - Wash Stations', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'machinery_equipment',
         'depreciation_method', 'straight_line',
         'useful_life_years', 10,
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1214000', 'Hair Styling Equipment', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'tools_equipment',
         'depreciation_method', 'straight_line',
         'useful_life_years', 3,
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1215000', 'Computer Equipment', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'computer_equipment',
         'depreciation_method', 'straight_line',
         'useful_life_years', 3
     )),
    (p_organization_id, 'gl_account', '1216000', 'POS Systems', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'computer_equipment',
         'depreciation_method', 'straight_line',
         'useful_life_years', 5,
         'branch_specific', true
     )),
    (p_organization_id, 'gl_account', '1217000', 'Furniture & Fixtures', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'ifrs_classification', 'furniture_fixtures',
         'depreciation_method', 'straight_line',
         'useful_life_years', 5,
         'branch_specific', true
     ));

    -- Accumulated Depreciation
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '1280000', 'Accumulated Depreciation', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'is_contra', true,
         'ifrs_classification', 'accumulated_depreciation',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '1281000', 'Acc. Depr. - Leasehold Improvements', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'is_contra', true,
         'ifrs_classification', 'accumulated_depreciation',
         'related_asset', '1211000',
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '1282000', 'Acc. Depr. - Salon Equipment', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'is_contra', true,
         'ifrs_classification', 'accumulated_depreciation',
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '1285000', 'Acc. Depr. - Computer Equipment', 'assets', v_parent_id,
     jsonb_build_object(
         'account_type', 'assets',
         'is_contra', true,
         'ifrs_classification', 'accumulated_depreciation',
         'normal_balance', 'credit'
     ));

    -- ========================================================================
    -- 2. LIABILITIES (2000000-2999999)
    -- ========================================================================
    
    -- 2.1 Current Liabilities (2100000-2199999)
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '2100000', 'Current Liabilities', 'liabilities',
     jsonb_build_object(
         'account_type', 'liabilities',
         'is_header', true,
         'ifrs_classification', 'current_liabilities',
         'ifrs_code', 'IAS1.69',
         'normal_balance', 'credit'
     ))
    RETURNING id INTO v_parent_id;

    -- Payables
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '2110000', 'Accounts Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'trade_payables',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2111000', 'Suppliers - Hair Products', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'trade_payables',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2112000', 'Suppliers - Salon Supplies', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'trade_payables',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2113000', 'Utilities Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'other_payables',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2114000', 'Rent Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'other_payables',
         'branch_specific', true,
         'normal_balance', 'credit'
     ));

    -- Staff-related liabilities
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '2120000', 'Employee Liabilities', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'employee_benefits',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2121000', 'Salaries Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'wages_salaries_payable',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2122000', 'Commission Payable - Stylists', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'wages_salaries_payable',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2123000', 'Tips Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'other_payables',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2124000', 'Payroll Tax Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'tax_payables',
         'normal_balance', 'credit'
     ));

    -- Customer-related liabilities
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '2130000', 'Customer Liabilities', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'deferred_revenue',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2131000', 'Customer Deposits', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'customer_deposits',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2132000', 'Gift Card Liabilities', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'deferred_revenue',
         'ifrs_code', 'IFRS15.106',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2133000', 'Loyalty Points Liability', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'provisions',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2134000', 'Service Package Liabilities', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'deferred_revenue',
         'branch_specific', true,
         'normal_balance', 'credit'
     ));

    -- Inter-branch liabilities (only for branches)
    IF NOT p_is_head_office THEN
        INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
        VALUES 
        (p_organization_id, 'gl_account', '2180000', 'Inter-Branch Payables', 'liabilities', v_parent_id,
         jsonb_build_object(
             'account_type', 'liabilities',
             'ifrs_classification', 'intercompany_payables',
             'elimination_required', true,
             'consolidation_method', 'eliminate',
             'normal_balance', 'credit'
         ));
    END IF;

    -- Tax liabilities
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '2140000', 'Tax Liabilities', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'tax_payables',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2141000', 'VAT Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'vat_payable',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '2142000', 'Corporate Tax Payable', 'liabilities', v_parent_id,
     jsonb_build_object(
         'account_type', 'liabilities',
         'ifrs_classification', 'income_tax_payable',
         'normal_balance', 'credit'
     ));

    -- ========================================================================
    -- 3. EQUITY (3000000-3999999)
    -- ========================================================================
    
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '3000000', 'Equity', 'equity',
     jsonb_build_object(
         'account_type', 'equity',
         'is_header', true,
         'ifrs_classification', 'equity',
         'ifrs_code', 'IAS1.78',
         'normal_balance', 'credit'
     ))
    RETURNING id INTO v_parent_id;

    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '3100000', 'Share Capital', 'equity', v_parent_id,
     jsonb_build_object(
         'account_type', 'equity',
         'ifrs_classification', 'share_capital',
         'ifrs_code', 'IAS1.79',
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '3200000', 'Retained Earnings', 'equity', v_parent_id,
     jsonb_build_object(
         'account_type', 'equity',
         'ifrs_classification', 'retained_earnings',
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '3300000', 'Current Year Earnings', 'equity', v_parent_id,
     jsonb_build_object(
         'account_type', 'equity',
         'ifrs_classification', 'current_year_earnings',
         'temporary_account', true,
         'normal_balance', 'credit'
     ));

    -- Additional equity accounts for head office
    IF p_is_head_office THEN
        INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
        VALUES 
        (p_organization_id, 'gl_account', '3400000', 'Investment in Subsidiaries', 'equity', v_parent_id,
         jsonb_build_object(
             'account_type', 'equity',
             'ifrs_classification', 'investment_in_subsidiaries',
             'consolidation_method', 'eliminate',
             'normal_balance', 'debit'
         ));
    END IF;

    -- ========================================================================
    -- 4. REVENUE (4000000-4999999)
    -- ========================================================================
    
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '4000000', 'Revenue', 'revenue',
     jsonb_build_object(
         'account_type', 'revenue',
         'is_header', true,
         'ifrs_classification', 'revenue',
         'ifrs_code', 'IFRS15.113',
         'statement_type', 'SPL',
         'normal_balance', 'credit'
     ))
    RETURNING id INTO v_parent_id;

    -- Service revenue
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '4100000', 'Service Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4110000', 'Hair Services Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'is_header', true,
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4111000', 'Haircut Revenue - Men', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'haircut',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4112000', 'Haircut Revenue - Women', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'haircut',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4113000', 'Hair Coloring Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'coloring',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4114000', 'Hair Treatment Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'treatment',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4115000', 'Hair Styling Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'styling',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4116000', 'Bridal & Special Event Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'special_events',
         'branch_specific', true,
         'normal_balance', 'credit'
     ));

    -- Beauty services revenue
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '4120000', 'Beauty Services Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'is_header', true,
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4121000', 'Facial Treatment Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'facial',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4122000', 'Manicure Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'nails',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4123000', 'Pedicure Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'nails',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4124000', 'Waxing Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'waxing',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4125000', 'Massage Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'service_revenue',
         'service_category', 'massage',
         'branch_specific', true,
         'normal_balance', 'credit'
     ));

    -- Product sales revenue
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '4200000', 'Product Sales Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'sales_revenue',
         'is_header', true,
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4210000', 'Hair Care Product Sales', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'sales_revenue',
         'product_category', 'hair_care',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4220000', 'Beauty Product Sales', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'sales_revenue',
         'product_category', 'beauty',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4230000', 'Accessories Sales', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'sales_revenue',
         'product_category', 'accessories',
         'branch_specific', true,
         'normal_balance', 'credit'
     ));

    -- Other revenue
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '4900000', 'Other Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'other_revenue',
         'is_header', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4910000', 'Commission Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'other_revenue',
         'branch_specific', true,
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '4920000', 'Training Revenue', 'revenue', v_parent_id,
     jsonb_build_object(
         'account_type', 'revenue',
         'ifrs_classification', 'other_revenue',
         'normal_balance', 'credit'
     ));

    -- ========================================================================
    -- 5. COST OF SALES (5000000-5999999)
    -- ========================================================================
    
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '5000000', 'Cost of Sales', 'cost_of_sales',
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'is_header', true,
         'ifrs_classification', 'cost_of_sales',
         'ifrs_code', 'IAS1.103',
         'statement_type', 'SPL',
         'normal_balance', 'debit'
     ))
    RETURNING id INTO v_parent_id;

    -- Direct service costs
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '5100000', 'Direct Service Costs', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'direct_costs',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5110000', 'Stylist Wages & Commissions', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'employee_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5111000', 'Stylist Base Salaries', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'employee_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5112000', 'Stylist Commissions', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'employee_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5113000', 'Stylist Benefits', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'employee_benefits',
         'branch_specific', true,
         'normal_balance', 'debit'
     ));

    -- Product costs
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '5200000', 'Cost of Products Used', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'materials_consumed',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5210000', 'Hair Color Products Used', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'materials_consumed',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5220000', 'Hair Treatment Products Used', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'materials_consumed',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5230000', 'Styling Products Used', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'materials_consumed',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5240000', 'Beauty Products Used', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'materials_consumed',
         'branch_specific', true,
         'normal_balance', 'debit'
     ));

    -- Cost of goods sold
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '5300000', 'Cost of Goods Sold', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'cost_of_goods_sold',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5310000', 'COGS - Hair Care Products', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'cost_of_goods_sold',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5320000', 'COGS - Beauty Products', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'cost_of_goods_sold',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '5330000', 'COGS - Accessories', 'cost_of_sales', v_parent_id,
     jsonb_build_object(
         'account_type', 'cost_of_sales',
         'ifrs_classification', 'cost_of_goods_sold',
         'branch_specific', true,
         'normal_balance', 'debit'
     ));

    -- ========================================================================
    -- 6. OPERATING EXPENSES (6000000-6999999)
    -- ========================================================================
    
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '6000000', 'Operating Expenses', 'indirect_expenses',
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'is_header', true,
         'ifrs_classification', 'operating_expenses',
         'statement_type', 'SPL',
         'normal_balance', 'debit'
     ))
    RETURNING id INTO v_parent_id;

    -- Administrative expenses
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '6100000', 'Administrative Expenses', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'administrative_expenses',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6110000', 'Management Salaries', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'employee_costs',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6120000', 'Reception Staff Salaries', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'employee_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6130000', 'Office Supplies', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'other_expenses',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6140000', 'Professional Fees', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'professional_fees',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6141000', 'Accounting Fees', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'professional_fees',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6142000', 'Legal Fees', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'professional_fees',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6150000', 'Software & Subscriptions', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'technology_costs',
         'normal_balance', 'debit'
     ));

    -- Occupancy costs
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '6200000', 'Occupancy Costs', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'occupancy_costs',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6210000', 'Rent Expense', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'rent_expense',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6220000', 'Utilities', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'utilities',
         'is_header', true,
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6221000', 'Electricity', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'utilities',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6222000', 'Water', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'utilities',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6223000', 'Internet & Phone', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'telecommunications',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6230000', 'Maintenance & Repairs', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'maintenance',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6240000', 'Insurance', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'insurance_expense',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6250000', 'Security', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'security_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     ));

    -- Marketing expenses
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '6300000', 'Marketing & Advertising', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'marketing_expenses',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6310000', 'Digital Marketing', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'marketing_expenses',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6320000', 'Print Advertising', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'marketing_expenses',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6330000', 'Promotional Events', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'marketing_expenses',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6340000', 'Customer Loyalty Programs', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'marketing_expenses',
         'normal_balance', 'debit'
     ));

    -- Training and development
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '6400000', 'Training & Development', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'training_costs',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6410000', 'Staff Training', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'training_costs',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6420000', 'Professional Development', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'training_costs',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6430000', 'Industry Conferences', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'training_costs',
         'normal_balance', 'debit'
     ));

    -- Depreciation
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '6800000', 'Depreciation & Amortization', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'depreciation_amortization',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6810000', 'Depreciation - Leasehold Improvements', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'depreciation',
         'related_asset', '1211000',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6820000', 'Depreciation - Salon Equipment', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'depreciation',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6830000', 'Depreciation - Computer Equipment', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'depreciation',
         'normal_balance', 'debit'
     ));

    -- Other operating expenses
    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '6900000', 'Other Operating Expenses', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'other_expenses',
         'is_header', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6910000', 'Bank Charges', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'finance_costs',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6920000', 'Credit Card Processing Fees', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'finance_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6930000', 'Licenses & Permits', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'regulatory_costs',
         'branch_specific', true,
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '6940000', 'Miscellaneous Expenses', 'indirect_expenses', v_parent_id,
     jsonb_build_object(
         'account_type', 'indirect_expenses',
         'ifrs_classification', 'other_expenses',
         'normal_balance', 'debit'
     ));

    -- ========================================================================
    -- 7. OTHER INCOME & EXPENSES (7000000-7999999)
    -- ========================================================================
    
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '7000000', 'Other Income & Expenses', 'tax_extraordinary',
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'is_header', true,
         'ifrs_classification', 'other_comprehensive_income',
         'statement_type', 'SPL'
     ))
    RETURNING id INTO v_parent_id;

    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '7100000', 'Interest Income', 'tax_extraordinary', v_parent_id,
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'ifrs_classification', 'finance_income',
         'normal_balance', 'credit'
     )),
    (p_organization_id, 'gl_account', '7200000', 'Interest Expense', 'tax_extraordinary', v_parent_id,
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'ifrs_classification', 'finance_costs',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '7300000', 'Foreign Exchange Gain/Loss', 'tax_extraordinary', v_parent_id,
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'ifrs_classification', 'foreign_exchange',
         'normal_balance', 'either'
     )),
    (p_organization_id, 'gl_account', '7400000', 'Gain/Loss on Asset Disposal', 'tax_extraordinary', v_parent_id,
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'ifrs_classification', 'disposal_gains_losses',
         'normal_balance', 'either'
     ));

    -- ========================================================================
    -- 8. TAX ACCOUNTS (8000000-8999999)
    -- ========================================================================
    
    INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
    VALUES 
    (uuid_generate_v4(), p_organization_id, 'gl_account', '8000000', 'Income Tax', 'tax_extraordinary',
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'is_header', true,
         'ifrs_classification', 'income_tax',
         'ifrs_code', 'IAS12',
         'statement_type', 'SPL'
     ))
    RETURNING id INTO v_parent_id;

    INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
    VALUES 
    (p_organization_id, 'gl_account', '8100000', 'Current Income Tax', 'tax_extraordinary', v_parent_id,
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'ifrs_classification', 'current_tax',
         'normal_balance', 'debit'
     )),
    (p_organization_id, 'gl_account', '8200000', 'Deferred Tax', 'tax_extraordinary', v_parent_id,
     jsonb_build_object(
         'account_type', 'tax_extraordinary',
         'ifrs_classification', 'deferred_tax',
         'normal_balance', 'either'
     ));

    -- ========================================================================
    -- 9. CONSOLIDATION ACCOUNTS (9000000-9999999) - Head Office Only
    -- ========================================================================
    
    IF p_is_head_office THEN
        INSERT INTO core_entities (id, organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
        VALUES 
        (uuid_generate_v4(), p_organization_id, 'gl_account', '9000000', 'Consolidation Adjustments', 'statistical',
         jsonb_build_object(
             'account_type', 'statistical',
             'is_header', true,
             'ifrs_classification', 'consolidation',
             'ifrs_code', 'IFRS10',
             'consolidation_only', true
         ))
        RETURNING id INTO v_parent_id;

        INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, parent_entity_id, metadata)
        VALUES 
        (p_organization_id, 'gl_account', '9100000', 'Elimination - Intercompany Sales', 'statistical', v_parent_id,
         jsonb_build_object(
             'account_type', 'statistical',
             'ifrs_classification', 'consolidation_elimination',
             'elimination_type', 'revenue',
             'normal_balance', 'debit'
         )),
        (p_organization_id, 'gl_account', '9200000', 'Elimination - Intercompany Purchases', 'statistical', v_parent_id,
         jsonb_build_object(
             'account_type', 'statistical',
             'ifrs_classification', 'consolidation_elimination',
             'elimination_type', 'expense',
             'normal_balance', 'credit'
         )),
        (p_organization_id, 'gl_account', '9300000', 'Elimination - Intercompany Receivables', 'statistical', v_parent_id,
         jsonb_build_object(
             'account_type', 'statistical',
             'ifrs_classification', 'consolidation_elimination',
             'elimination_type', 'asset',
             'normal_balance', 'credit'
         )),
        (p_organization_id, 'gl_account', '9400000', 'Elimination - Intercompany Payables', 'statistical', v_parent_id,
         jsonb_build_object(
             'account_type', 'statistical',
             'ifrs_classification', 'consolidation_elimination',
             'elimination_type', 'liability',
             'normal_balance', 'debit'
         )),
        (p_organization_id, 'gl_account', '9500000', 'Elimination - Investment in Subsidiaries', 'statistical', v_parent_id,
         jsonb_build_object(
             'account_type', 'statistical',
             'ifrs_classification', 'consolidation_elimination',
             'elimination_type', 'investment',
             'normal_balance', 'credit'
         )),
        (p_organization_id, 'gl_account', '9600000', 'Minority Interest', 'statistical', v_parent_id,
         jsonb_build_object(
             'account_type', 'statistical',
             'ifrs_classification', 'non_controlling_interests',
             'ifrs_code', 'IFRS10.22',
             'normal_balance', 'credit'
         ));
    END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: CREATE SMART CODES FOR GL ACCOUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION add_gl_account_smart_codes(p_organization_id UUID) 
RETURNS VOID AS $$
BEGIN
    -- Add smart codes to all GL accounts
    UPDATE core_entities
    SET metadata = metadata || 
        jsonb_build_object(
            'smart_code', 
            CASE 
                WHEN entity_code LIKE '1%' THEN 'HERA.SALON.GL.ASSET.' || entity_code || '.v1'
                WHEN entity_code LIKE '2%' THEN 'HERA.SALON.GL.LIAB.' || entity_code || '.v1'
                WHEN entity_code LIKE '3%' THEN 'HERA.SALON.GL.EQUITY.' || entity_code || '.v1'
                WHEN entity_code LIKE '4%' THEN 'HERA.SALON.GL.REV.' || entity_code || '.v1'
                WHEN entity_code LIKE '5%' THEN 'HERA.SALON.GL.COGS.' || entity_code || '.v1'
                WHEN entity_code LIKE '6%' THEN 'HERA.SALON.GL.OPEX.' || entity_code || '.v1'
                WHEN entity_code LIKE '7%' THEN 'HERA.SALON.GL.OTHER.' || entity_code || '.v1'
                WHEN entity_code LIKE '8%' THEN 'HERA.SALON.GL.TAX.' || entity_code || '.v1'
                WHEN entity_code LIKE '9%' THEN 'HERA.SALON.GL.CONSOL.' || entity_code || '.v1'
            END
        )
    WHERE organization_id = p_organization_id
      AND entity_type = 'gl_account';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: CREATE DYNAMIC DATA FOR GL ACCOUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION add_gl_account_dynamic_data(p_organization_id UUID) 
RETURNS VOID AS $$
DECLARE
    v_entity RECORD;
BEGIN
    -- Add IFRS lineage fields to all GL accounts
    FOR v_entity IN 
        SELECT id, entity_code, metadata
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND entity_type = 'gl_account'
    LOOP
        -- IFRS Classification
        INSERT INTO core_dynamic_data (
            organization_id, entity_id, field_name, field_label, 
            field_type, field_value_text, is_required, is_searchable
        ) VALUES (
            p_organization_id, v_entity.id, 'ifrs_classification', 'IFRS Classification',
            'text', v_entity.metadata->>'ifrs_classification', true, true
        );

        -- IFRS Code
        IF v_entity.metadata->>'ifrs_code' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (
                organization_id, entity_id, field_name, field_label,
                field_type, field_value_text, is_required
            ) VALUES (
                p_organization_id, v_entity.id, 'ifrs_code', 'IFRS Standard Code',
                'text', v_entity.metadata->>'ifrs_code', false
            );
        END IF;

        -- Statement Type
        IF v_entity.metadata->>'statement_type' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (
                organization_id, entity_id, field_name, field_label,
                field_type, field_value_text, is_required
            ) VALUES (
                p_organization_id, v_entity.id, 'statement_type', 'Financial Statement',
                'text', v_entity.metadata->>'statement_type', true
            );
        END IF;

        -- Consolidation Method
        IF v_entity.metadata->>'consolidation_method' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (
                organization_id, entity_id, field_name, field_label,
                field_type, field_value_text
            ) VALUES (
                p_organization_id, v_entity.id, 'consolidation_method', 'Consolidation Method',
                'text', v_entity.metadata->>'consolidation_method'
            );
        END IF;

        -- Branch Specific Flag
        IF v_entity.metadata->>'branch_specific' = 'true' THEN
            INSERT INTO core_dynamic_data (
                organization_id, entity_id, field_name, field_label,
                field_type, field_value_boolean
            ) VALUES (
                p_organization_id, v_entity.id, 'branch_specific', 'Branch Specific Account',
                'boolean', true
            );
        END IF;

        -- Normal Balance
        INSERT INTO core_dynamic_data (
            organization_id, entity_id, field_name, field_label,
            field_type, field_value_text, is_required
        ) VALUES (
            p_organization_id, v_entity.id, 'normal_balance', 'Normal Balance',
            'text', COALESCE(v_entity.metadata->>'normal_balance', 
                CASE 
                    WHEN v_entity.entity_code LIKE '1%' OR v_entity.entity_code LIKE '5%' OR v_entity.entity_code LIKE '6%' THEN 'debit'
                    ELSE 'credit'
                END
            ), true
        );

    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE RELATIONSHIPS FOR ACCOUNT HIERARCHY
-- ============================================================================

CREATE OR REPLACE FUNCTION create_gl_account_relationships(p_organization_id UUID) 
RETURNS VOID AS $$
DECLARE
    v_parent RECORD;
    v_child RECORD;
BEGIN
    -- Create parent-child relationships based on parent_entity_id
    FOR v_child IN 
        SELECT id, entity_name, entity_code, parent_entity_id
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND entity_type = 'gl_account'
          AND parent_entity_id IS NOT NULL
    LOOP
        INSERT INTO core_relationships (
            organization_id, source_entity_id, target_entity_id,
            relationship_type, relationship_label, is_active,
            metadata
        ) VALUES (
            p_organization_id, v_child.parent_entity_id, v_child.id,
            'parent_of', 'Parent Account', true,
            jsonb_build_object(
                'hierarchy_type', 'gl_account',
                'rollup_enabled', true,
                'smart_code', 'HERA.SALON.GL.REL.PARENT.' || v_child.entity_code || '.v1'
            )
        );
    END LOOP;

    -- Create consolidation relationships for inter-branch accounts
    IF p_organization_id IN (
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,  -- Branch 1
        '0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid   -- Branch 2
    ) THEN
        -- Mark inter-branch accounts for consolidation
        UPDATE core_entities
        SET metadata = metadata || jsonb_build_object('requires_consolidation', true)
        WHERE organization_id = p_organization_id
          AND entity_type = 'gl_account'
          AND entity_code IN ('1128000', '2180000');  -- Inter-branch accounts
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: EXECUTE SETUP FOR ALL ORGANIZATIONS
-- ============================================================================

-- Create COA for Head Office
SELECT create_salon_coa('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid, true);
SELECT add_gl_account_smart_codes('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid);
SELECT add_gl_account_dynamic_data('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid);
SELECT create_gl_account_relationships('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid);

-- Create COA for Branch 1
SELECT create_salon_coa('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid, false);
SELECT add_gl_account_smart_codes('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid);
SELECT add_gl_account_dynamic_data('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid);
SELECT create_gl_account_relationships('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid);

-- Create COA for Branch 2
SELECT create_salon_coa('0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid, false);
SELECT add_gl_account_smart_codes('0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid);
SELECT add_gl_account_dynamic_data('0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid);
SELECT create_gl_account_relationships('0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid);

-- ============================================================================
-- STEP 6: CREATE CONSOLIDATION MAPPING
-- ============================================================================

-- Create mapping between branch accounts and head office accounts
CREATE OR REPLACE FUNCTION create_consolidation_mapping() 
RETURNS VOID AS $$
DECLARE
    v_head_office_id UUID := '849b6efe-2bf0-438f-9c70-01835ac2fe15';
    v_branch1_id UUID := 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
    v_branch2_id UUID := '0b1b37cd-4096-4718-8cd4-e370f234005b';
    v_mapping RECORD;
BEGIN
    -- Create consolidation mapping entities in head office
    FOR v_mapping IN 
        SELECT DISTINCT entity_code, entity_name
        FROM core_entities
        WHERE organization_id IN (v_branch1_id, v_branch2_id)
          AND entity_type = 'gl_account'
          AND (metadata->>'branch_specific')::boolean = true
    LOOP
        INSERT INTO core_entities (
            organization_id, entity_type, entity_code, entity_name,
            entity_category, metadata
        ) VALUES (
            v_head_office_id, 'consolidation_mapping', 
            'MAP_' || v_mapping.entity_code,
            'Consolidation Map: ' || v_mapping.entity_name,
            'system',
            jsonb_build_object(
                'mapping_type', 'branch_to_consolidated',
                'source_account_code', v_mapping.entity_code,
                'consolidation_rule', 'sum_branches',
                'smart_code', 'HERA.SALON.CONSOL.MAP.' || v_mapping.entity_code || '.v1'
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT create_consolidation_mapping();

-- ============================================================================
-- STEP 7: CREATE SAMPLE INTER-BRANCH TRANSACTION TEMPLATES
-- ============================================================================

-- Create transaction templates for common inter-branch scenarios
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
-- Product transfer template
('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid, 'transaction_template', 'TMP_PROD_TRANSFER', 
 'Inter-Branch Product Transfer', 'template',
 jsonb_build_object(
     'transaction_type', 'inter_branch_transfer',
     'debit_account', '1128000',  -- Inter-Branch Receivables
     'credit_account', '2180000', -- Inter-Branch Payables
     'requires_elimination', true,
     'smart_code', 'HERA.SALON.TXN.INTER.TRANSFER.v1'
 )),
-- Cash transfer template
('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid, 'transaction_template', 'TMP_CASH_TRANSFER',
 'Inter-Branch Cash Transfer', 'template',
 jsonb_build_object(
     'transaction_type', 'inter_branch_cash',
     'debit_account', '1128000',  -- Inter-Branch Receivables
     'credit_account', '1112000', -- Bank Account
     'requires_elimination', true,
     'smart_code', 'HERA.SALON.TXN.INTER.CASH.v1'
 )),
-- Service allocation template
('849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid, 'transaction_template', 'TMP_SERVICE_ALLOC',
 'Head Office Service Allocation', 'template',
 jsonb_build_object(
     'transaction_type', 'service_allocation',
     'allocation_basis', 'revenue_percentage',
     'expense_accounts', ['6110000', '6140000', '6150000'],  -- Management costs
     'smart_code', 'HERA.SALON.TXN.ALLOC.SERVICE.v1'
 ));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query to verify COA setup
/*
SELECT 
    o.organization_name,
    COUNT(e.id) as account_count,
    COUNT(CASE WHEN e.metadata->>'branch_specific' = 'true' THEN 1 END) as branch_specific_count,
    COUNT(CASE WHEN e.metadata->>'consolidation_method' = 'eliminate' THEN 1 END) as elimination_accounts
FROM core_organizations o
JOIN core_entities e ON e.organization_id = o.id
WHERE o.id IN (
    '849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid,
    'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
    '0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid
)
AND e.entity_type = 'gl_account'
GROUP BY o.organization_name
ORDER BY o.organization_name;

-- Query to view account hierarchy
SELECT 
    e.entity_code,
    e.entity_name,
    e.metadata->>'account_type' as account_type,
    e.metadata->>'ifrs_classification' as ifrs_class,
    e.metadata->>'branch_specific' as branch_specific,
    p.entity_code as parent_code,
    p.entity_name as parent_name
FROM core_entities e
LEFT JOIN core_entities p ON e.parent_entity_id = p.id
WHERE e.organization_id = '849b6efe-2bf0-438f-9c70-01835ac2fe15'::uuid
  AND e.entity_type = 'gl_account'
ORDER BY e.entity_code;
*/

-- ============================================================================
-- CLEANUP FUNCTIONS (IF NEEDED)
-- ============================================================================

DROP FUNCTION IF EXISTS create_salon_coa(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS add_gl_account_smart_codes(UUID);
DROP FUNCTION IF EXISTS add_gl_account_dynamic_data(UUID);
DROP FUNCTION IF EXISTS create_gl_account_relationships(UUID);
DROP FUNCTION IF EXISTS create_consolidation_mapping();

-- ============================================================================
-- END OF SALON MULTI-BRANCH COA SETUP
-- ============================================================================