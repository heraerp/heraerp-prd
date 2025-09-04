-- ============================================================================
-- SALON MULTI-BRANCH SAMPLE TRANSACTIONS
-- ============================================================================
-- This script demonstrates how to use the Chart of Accounts with actual
-- business transactions for the salon branches.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE SAMPLE ENTITIES (Customers, Staff, Products, Services)
-- ============================================================================

-- Create sample customers for Branch 1
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'customer', 'CUST-B1-001', 'Sarah Johnson', 'customer',
 jsonb_build_object('vip_status', 'gold', 'preferred_stylist', 'Maya', 'smart_code', 'HERA.SALON.CUST.VIP.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'customer', 'CUST-B1-002', 'Fatima Al Rashid', 'customer',
 jsonb_build_object('vip_status', 'platinum', 'preferred_stylist', 'Anna', 'smart_code', 'HERA.SALON.CUST.VIP.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'customer', 'CUST-B1-003', 'Emma Wilson', 'customer',
 jsonb_build_object('vip_status', 'silver', 'smart_code', 'HERA.SALON.CUST.REG.v1'));

-- Create sample customers for Branch 2
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'customer', 'CUST-B2-001', 'Aisha Mohammed', 'customer',
 jsonb_build_object('vip_status', 'gold', 'preferred_stylist', 'Sofia', 'smart_code', 'HERA.SALON.CUST.VIP.v1')),
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'customer', 'CUST-B2-002', 'Maria Garcia', 'customer',
 jsonb_build_object('vip_status', 'silver', 'smart_code', 'HERA.SALON.CUST.REG.v1'));

-- Create sample staff for Branch 1
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'employee', 'STAFF-B1-001', 'Maya Patel', 'stylist',
 jsonb_build_object('role', 'senior_stylist', 'commission_rate', 0.40, 'specialties', '["coloring", "treatments"]', 
                    'smart_code', 'HERA.SALON.STAFF.STYLIST.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'employee', 'STAFF-B1-002', 'Anna Chen', 'stylist',
 jsonb_build_object('role', 'stylist', 'commission_rate', 0.35, 'specialties', '["cutting", "styling"]',
                    'smart_code', 'HERA.SALON.STAFF.STYLIST.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'employee', 'STAFF-B1-003', 'Layla Hassan', 'therapist',
 jsonb_build_object('role', 'beauty_therapist', 'commission_rate', 0.35, 'specialties', '["facials", "waxing"]',
                    'smart_code', 'HERA.SALON.STAFF.THERAPIST.v1'));

-- Create sample staff for Branch 2
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'employee', 'STAFF-B2-001', 'Sofia Rodriguez', 'stylist',
 jsonb_build_object('role', 'senior_stylist', 'commission_rate', 0.40, 'specialties', '["bridal", "coloring"]',
                    'smart_code', 'HERA.SALON.STAFF.STYLIST.v1')),
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'employee', 'STAFF-B2-002', 'Noor Ali', 'therapist',
 jsonb_build_object('role', 'nail_technician', 'commission_rate', 0.35, 'specialties', '["manicure", "pedicure"]',
                    'smart_code', 'HERA.SALON.STAFF.THERAPIST.v1'));

-- Create sample services
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
-- Branch 1 services
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'service', 'SRV-HC-001', 'Ladies Haircut & Style', 'hair_service',
 jsonb_build_object('duration_minutes', 45, 'base_price', 120.00, 'gl_revenue_account', '4112000',
                    'smart_code', 'HERA.SALON.SERVICE.HAIRCUT.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'service', 'SRV-HC-002', 'Hair Coloring - Full', 'hair_service',
 jsonb_build_object('duration_minutes', 120, 'base_price', 350.00, 'gl_revenue_account', '4113000',
                    'smart_code', 'HERA.SALON.SERVICE.COLOR.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'service', 'SRV-HT-001', 'Keratin Treatment', 'hair_service',
 jsonb_build_object('duration_minutes', 180, 'base_price', 600.00, 'gl_revenue_account', '4114000',
                    'smart_code', 'HERA.SALON.SERVICE.TREATMENT.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'service', 'SRV-BT-001', 'Luxury Facial', 'beauty_service',
 jsonb_build_object('duration_minutes', 60, 'base_price', 250.00, 'gl_revenue_account', '4121000',
                    'smart_code', 'HERA.SALON.SERVICE.FACIAL.v1')),

-- Branch 2 services (same service types, possibly different prices)
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'service', 'SRV-HC-001', 'Ladies Haircut & Style', 'hair_service',
 jsonb_build_object('duration_minutes', 45, 'base_price', 130.00, 'gl_revenue_account', '4112000',
                    'smart_code', 'HERA.SALON.SERVICE.HAIRCUT.v1')),
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'service', 'SRV-MN-001', 'Gel Manicure', 'beauty_service',
 jsonb_build_object('duration_minutes', 45, 'base_price', 120.00, 'gl_revenue_account', '4122000',
                    'smart_code', 'HERA.SALON.SERVICE.NAILS.v1'));

-- Create sample products
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, entity_category, metadata)
VALUES 
-- Products at Branch 1
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'product', 'PROD-HC-001', 'L\'Oreal Professional Shampoo', 'hair_care',
 jsonb_build_object('unit_cost', 45.00, 'selling_price', 120.00, 'stock_quantity', 25, 
                    'gl_revenue_account', '4210000', 'gl_cogs_account', '5310000',
                    'smart_code', 'HERA.SALON.PRODUCT.HAIRCARE.v1')),
('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 'product', 'PROD-HC-002', 'Moroccan Oil Treatment', 'hair_care',
 jsonb_build_object('unit_cost', 60.00, 'selling_price', 150.00, 'stock_quantity', 15,
                    'gl_revenue_account', '4210000', 'gl_cogs_account', '5310000',
                    'smart_code', 'HERA.SALON.PRODUCT.HAIRCARE.v1')),

-- Products at Branch 2
('0b1b37cd-4096-4718-8cd4-e370f234005b', 'product', 'PROD-HC-001', 'L\'Oreal Professional Shampoo', 'hair_care',
 jsonb_build_object('unit_cost', 45.00, 'selling_price', 125.00, 'stock_quantity', 20,
                    'gl_revenue_account', '4210000', 'gl_cogs_account', '5310000',
                    'smart_code', 'HERA.SALON.PRODUCT.HAIRCARE.v1'));

-- ============================================================================
-- STEP 2: CREATE SAMPLE TRANSACTIONS
-- ============================================================================

-- Function to create a complete service transaction with automatic GL posting
CREATE OR REPLACE FUNCTION create_salon_service_transaction(
    p_organization_id UUID,
    p_customer_id UUID,
    p_service_id UUID,
    p_stylist_id UUID,
    p_transaction_date DATE,
    p_amount NUMERIC,
    p_payment_method VARCHAR DEFAULT 'cash'
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_gl_revenue_account VARCHAR;
    v_gl_cash_account VARCHAR;
    v_commission_rate NUMERIC;
    v_commission_amount NUMERIC;
    v_product_cost NUMERIC := p_amount * 0.08; -- Assume 8% product cost for services
BEGIN
    -- Get GL accounts and commission rate
    SELECT metadata->>'gl_revenue_account' INTO v_gl_revenue_account
    FROM core_entities WHERE id = p_service_id;
    
    SELECT (metadata->>'commission_rate')::numeric INTO v_commission_rate
    FROM core_entities WHERE id = p_stylist_id;
    
    v_commission_amount := p_amount * v_commission_rate;
    
    -- Determine cash account based on payment method
    v_gl_cash_account := CASE p_payment_method
        WHEN 'cash' THEN '1111100'  -- Cash Register - Hair Services
        WHEN 'card' THEN '1112000'  -- Bank Account - Operating
        ELSE '1111100'
    END;
    
    -- Create transaction header
    INSERT INTO universal_transactions (
        id, organization_id, transaction_type, transaction_code,
        transaction_date, source_entity_id, target_entity_id,
        total_amount, status, metadata
    ) VALUES (
        uuid_generate_v4(), p_organization_id, 'service_sale',
        'SRV-' || TO_CHAR(p_transaction_date, 'YYYYMMDD') || '-' || 
            LPAD(NEXTVAL('transaction_seq')::text, 4, '0'),
        p_transaction_date, p_customer_id, p_service_id,
        p_amount, 'completed',
        jsonb_build_object(
            'stylist_id', p_stylist_id,
            'payment_method', p_payment_method,
            'commission_amount', v_commission_amount,
            'smart_code', 'HERA.SALON.TXN.SERVICE.SALE.v1'
        )
    ) RETURNING id INTO v_transaction_id;
    
    -- Create transaction lines with GL postings
    -- 1. Cash/Bank debit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_organization_id, 1, 'Payment received',
        p_amount, v_gl_cash_account,
        jsonb_build_object('posting_type', 'debit')
    );
    
    -- 2. Revenue credit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_organization_id, 2, 'Service revenue',
        -p_amount, v_gl_revenue_account,
        jsonb_build_object('posting_type', 'credit')
    );
    
    -- 3. Commission expense debit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_organization_id, 3, 'Stylist commission',
        v_commission_amount, '5112000',  -- Stylist Commissions
        jsonb_build_object('posting_type', 'debit', 'stylist_id', p_stylist_id)
    );
    
    -- 4. Commission payable credit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_organization_id, 4, 'Commission payable',
        -v_commission_amount, '2122000',  -- Commission Payable - Stylists
        jsonb_build_object('posting_type', 'credit', 'stylist_id', p_stylist_id)
    );
    
    -- 5. Product cost (if applicable)
    IF v_product_cost > 0 THEN
        INSERT INTO universal_transaction_lines (
            transaction_id, organization_id, line_order, line_description,
            line_amount, gl_account_code, metadata
        ) VALUES (
            v_transaction_id, p_organization_id, 5, 'Products used',
            v_product_cost, '5220000',  -- Hair Treatment Products Used
            jsonb_build_object('posting_type', 'debit')
        );
    END IF;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for transaction numbering if not exists
CREATE SEQUENCE IF NOT EXISTS transaction_seq START WITH 1000;

-- ============================================================================
-- STEP 3: CREATE SAMPLE SERVICE TRANSACTIONS
-- ============================================================================

-- Get entity IDs for transactions
DO $$
DECLARE
    v_customer1_b1 UUID;
    v_customer2_b1 UUID;
    v_customer1_b2 UUID;
    v_service_haircut_b1 UUID;
    v_service_color_b1 UUID;
    v_service_treatment_b1 UUID;
    v_service_facial_b1 UUID;
    v_service_haircut_b2 UUID;
    v_service_manicure_b2 UUID;
    v_stylist1_b1 UUID;
    v_stylist2_b1 UUID;
    v_therapist_b1 UUID;
    v_stylist_b2 UUID;
    v_therapist_b2 UUID;
    v_transaction_id UUID;
BEGIN
    -- Get Branch 1 entities
    SELECT id INTO v_customer1_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'CUST-B1-001';
    
    SELECT id INTO v_customer2_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'CUST-B1-002';
    
    SELECT id INTO v_service_haircut_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'SRV-HC-001';
    
    SELECT id INTO v_service_color_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'SRV-HC-002';
    
    SELECT id INTO v_service_treatment_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'SRV-HT-001';
    
    SELECT id INTO v_service_facial_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'SRV-BT-001';
    
    SELECT id INTO v_stylist1_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'STAFF-B1-001';
    
    SELECT id INTO v_stylist2_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'STAFF-B1-002';
    
    SELECT id INTO v_therapist_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'STAFF-B1-003';
    
    -- Get Branch 2 entities
    SELECT id INTO v_customer1_b2 FROM core_entities 
    WHERE organization_id = '0b1b37cd-4096-4718-8cd4-e370f234005b' 
    AND entity_code = 'CUST-B2-001';
    
    SELECT id INTO v_service_haircut_b2 FROM core_entities 
    WHERE organization_id = '0b1b37cd-4096-4718-8cd4-e370f234005b' 
    AND entity_code = 'SRV-HC-001';
    
    SELECT id INTO v_service_manicure_b2 FROM core_entities 
    WHERE organization_id = '0b1b37cd-4096-4718-8cd4-e370f234005b' 
    AND entity_code = 'SRV-MN-001';
    
    SELECT id INTO v_stylist_b2 FROM core_entities 
    WHERE organization_id = '0b1b37cd-4096-4718-8cd4-e370f234005b' 
    AND entity_code = 'STAFF-B2-001';
    
    SELECT id INTO v_therapist_b2 FROM core_entities 
    WHERE organization_id = '0b1b37cd-4096-4718-8cd4-e370f234005b' 
    AND entity_code = 'STAFF-B2-002';
    
    -- Create transactions for Branch 1
    -- Day 1: Multiple services
    SELECT create_salon_service_transaction(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
        v_customer1_b1, v_service_haircut_b1, v_stylist2_b1,
        CURRENT_DATE - INTERVAL '7 days', 120.00, 'cash'
    ) INTO v_transaction_id;
    
    SELECT create_salon_service_transaction(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
        v_customer2_b1, v_service_color_b1, v_stylist1_b1,
        CURRENT_DATE - INTERVAL '7 days', 350.00, 'card'
    ) INTO v_transaction_id;
    
    SELECT create_salon_service_transaction(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
        v_customer1_b1, v_service_facial_b1, v_therapist_b1,
        CURRENT_DATE - INTERVAL '6 days', 250.00, 'card'
    ) INTO v_transaction_id;
    
    -- Day 2: More transactions
    SELECT create_salon_service_transaction(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
        v_customer2_b1, v_service_treatment_b1, v_stylist1_b1,
        CURRENT_DATE - INTERVAL '5 days', 600.00, 'card'
    ) INTO v_transaction_id;
    
    -- Create transactions for Branch 2
    SELECT create_salon_service_transaction(
        '0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid,
        v_customer1_b2, v_service_haircut_b2, v_stylist_b2,
        CURRENT_DATE - INTERVAL '7 days', 130.00, 'cash'
    ) INTO v_transaction_id;
    
    SELECT create_salon_service_transaction(
        '0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid,
        v_customer1_b2, v_service_manicure_b2, v_therapist_b2,
        CURRENT_DATE - INTERVAL '6 days', 120.00, 'card'
    ) INTO v_transaction_id;
END $$;

-- ============================================================================
-- STEP 4: CREATE PRODUCT SALE TRANSACTIONS
-- ============================================================================

-- Product sale function
CREATE OR REPLACE FUNCTION create_product_sale_transaction(
    p_organization_id UUID,
    p_customer_id UUID,
    p_product_id UUID,
    p_quantity NUMERIC,
    p_transaction_date DATE,
    p_payment_method VARCHAR DEFAULT 'cash'
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_unit_price NUMERIC;
    v_unit_cost NUMERIC;
    v_total_amount NUMERIC;
    v_total_cost NUMERIC;
    v_gl_revenue_account VARCHAR;
    v_gl_cogs_account VARCHAR;
    v_gl_cash_account VARCHAR;
BEGIN
    -- Get product details
    SELECT 
        (metadata->>'selling_price')::numeric,
        (metadata->>'unit_cost')::numeric,
        metadata->>'gl_revenue_account',
        metadata->>'gl_cogs_account'
    INTO v_unit_price, v_unit_cost, v_gl_revenue_account, v_gl_cogs_account
    FROM core_entities WHERE id = p_product_id;
    
    v_total_amount := v_unit_price * p_quantity;
    v_total_cost := v_unit_cost * p_quantity;
    
    -- Determine cash account
    v_gl_cash_account := CASE p_payment_method
        WHEN 'cash' THEN '1111200'  -- Cash Register - Product Sales
        WHEN 'card' THEN '1112000'  -- Bank Account - Operating
        ELSE '1111200'
    END;
    
    -- Create transaction
    INSERT INTO universal_transactions (
        id, organization_id, transaction_type, transaction_code,
        transaction_date, source_entity_id, target_entity_id,
        total_amount, status, metadata
    ) VALUES (
        uuid_generate_v4(), p_organization_id, 'product_sale',
        'PROD-' || TO_CHAR(p_transaction_date, 'YYYYMMDD') || '-' || 
            LPAD(NEXTVAL('transaction_seq')::text, 4, '0'),
        p_transaction_date, p_customer_id, p_product_id,
        v_total_amount, 'completed',
        jsonb_build_object(
            'quantity', p_quantity,
            'payment_method', p_payment_method,
            'smart_code', 'HERA.SALON.TXN.PRODUCT.SALE.v1'
        )
    ) RETURNING id INTO v_transaction_id;
    
    -- GL postings
    -- 1. Cash debit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        quantity, unit_price, line_amount, gl_account_code
    ) VALUES (
        v_transaction_id, p_organization_id, 1, 'Cash received',
        1, v_total_amount, v_total_amount, v_gl_cash_account
    );
    
    -- 2. Revenue credit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        quantity, unit_price, line_amount, gl_account_code
    ) VALUES (
        v_transaction_id, p_organization_id, 2, 'Product revenue',
        p_quantity, v_unit_price, -v_total_amount, v_gl_revenue_account
    );
    
    -- 3. COGS debit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        quantity, unit_price, line_amount, gl_account_code
    ) VALUES (
        v_transaction_id, p_organization_id, 3, 'Cost of goods sold',
        p_quantity, v_unit_cost, v_total_cost, v_gl_cogs_account
    );
    
    -- 4. Inventory credit
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        quantity, unit_price, line_amount, gl_account_code
    ) VALUES (
        v_transaction_id, p_organization_id, 4, 'Inventory reduction',
        p_quantity, v_unit_cost, -v_total_cost, '1131000'  -- Hair Care Products inventory
    );
    
    -- Update inventory quantity
    UPDATE core_entities
    SET metadata = jsonb_set(
        metadata, 
        '{stock_quantity}', 
        to_jsonb((metadata->>'stock_quantity')::numeric - p_quantity)
    )
    WHERE id = p_product_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create some product sales
DO $$
DECLARE
    v_customer1_b1 UUID;
    v_product1_b1 UUID;
    v_product2_b1 UUID;
    v_transaction_id UUID;
BEGIN
    -- Get entities
    SELECT id INTO v_customer1_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'CUST-B1-001';
    
    SELECT id INTO v_product1_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'PROD-HC-001';
    
    SELECT id INTO v_product2_b1 FROM core_entities 
    WHERE organization_id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' 
    AND entity_code = 'PROD-HC-002';
    
    -- Create product sales
    SELECT create_product_sale_transaction(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
        v_customer1_b1, v_product1_b1, 2,
        CURRENT_DATE - INTERVAL '5 days', 'card'
    ) INTO v_transaction_id;
    
    SELECT create_product_sale_transaction(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,
        v_customer1_b1, v_product2_b1, 1,
        CURRENT_DATE - INTERVAL '3 days', 'cash'
    ) INTO v_transaction_id;
END $$;

-- ============================================================================
-- STEP 5: CREATE INTER-BRANCH TRANSFER
-- ============================================================================

CREATE OR REPLACE FUNCTION create_inter_branch_transfer(
    p_from_branch_id UUID,
    p_to_branch_id UUID,
    p_transfer_type VARCHAR,  -- 'product' or 'cash'
    p_amount NUMERIC,
    p_description TEXT,
    p_transaction_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_from_account VARCHAR;
    v_to_account VARCHAR;
BEGIN
    -- Determine accounts based on transfer type
    IF p_transfer_type = 'product' THEN
        v_from_account := '1131000';  -- Hair Care Products (credit - reducing inventory)
        v_to_account := '1128000';    -- Inter-Branch Receivables (debit)
    ELSIF p_transfer_type = 'cash' THEN
        v_from_account := '1112000';  -- Bank Account (credit)
        v_to_account := '1128000';    -- Inter-Branch Receivables (debit)
    END IF;
    
    -- Create transaction in sending branch
    INSERT INTO universal_transactions (
        id, organization_id, transaction_type, transaction_code,
        transaction_date, total_amount, status,
        is_intercompany, intercompany_source_org, intercompany_target_org,
        elimination_required, metadata
    ) VALUES (
        uuid_generate_v4(), p_from_branch_id, 'inter_branch_transfer',
        'IBT-' || TO_CHAR(p_transaction_date, 'YYYYMMDD') || '-' || 
            LPAD(NEXTVAL('transaction_seq')::text, 4, '0'),
        p_transaction_date, p_amount, 'completed',
        true, p_from_branch_id, p_to_branch_id, true,
        jsonb_build_object(
            'transfer_type', p_transfer_type,
            'description', p_description,
            'smart_code', 'HERA.SALON.TXN.INTER.TRANSFER.v1'
        )
    ) RETURNING id INTO v_transaction_id;
    
    -- Create GL postings for sending branch
    -- Debit Inter-Branch Receivables
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_from_branch_id, 1, 
        'Inter-branch receivable - ' || p_description,
        p_amount, '1128000',
        jsonb_build_object('posting_type', 'debit', 'elimination_required', true)
    );
    
    -- Credit source account
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_from_branch_id, 2,
        CASE p_transfer_type 
            WHEN 'product' THEN 'Inventory transfer out'
            WHEN 'cash' THEN 'Cash transfer out'
        END,
        -p_amount, v_from_account,
        jsonb_build_object('posting_type', 'credit')
    );
    
    -- Create corresponding transaction in receiving branch
    INSERT INTO universal_transactions (
        organization_id, transaction_type, transaction_code,
        transaction_date, total_amount, status,
        is_intercompany, intercompany_source_org, intercompany_target_org,
        elimination_required, intercompany_reference, metadata
    ) VALUES (
        p_to_branch_id, 'inter_branch_transfer',
        'IBT-RCV-' || TO_CHAR(p_transaction_date, 'YYYYMMDD') || '-' || 
            LPAD(NEXTVAL('transaction_seq')::text, 4, '0'),
        p_transaction_date, p_amount, 'completed',
        true, p_from_branch_id, p_to_branch_id, true,
        v_transaction_id::text,
        jsonb_build_object(
            'transfer_type', p_transfer_type,
            'description', p_description,
            'source_transaction_id', v_transaction_id,
            'smart_code', 'HERA.SALON.TXN.INTER.RECEIVE.v1'
        )
    );
    
    -- Create GL postings for receiving branch
    -- Credit Inter-Branch Payables
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_to_branch_id, 1,
        'Inter-branch payable - ' || p_description,
        -p_amount, '2180000',
        jsonb_build_object('posting_type', 'credit', 'elimination_required', true)
    );
    
    -- Debit destination account
    INSERT INTO universal_transaction_lines (
        transaction_id, organization_id, line_order, line_description,
        line_amount, gl_account_code, metadata
    ) VALUES (
        v_transaction_id, p_to_branch_id, 2,
        CASE p_transfer_type
            WHEN 'product' THEN 'Inventory transfer in'
            WHEN 'cash' THEN 'Cash transfer in'
        END,
        p_amount,
        CASE p_transfer_type
            WHEN 'product' THEN '1131000'  -- Hair Care Products
            WHEN 'cash' THEN '1112000'      -- Bank Account
        END,
        jsonb_build_object('posting_type', 'debit')
    );
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create sample inter-branch transfers
DO $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Branch 1 transfers products to Branch 2
    SELECT create_inter_branch_transfer(
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,  -- From Branch 1
        '0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid,  -- To Branch 2
        'product',
        2500.00,  -- Value of products transferred
        '10 units of L\'Oreal Professional products',
        CURRENT_DATE - INTERVAL '4 days'
    ) INTO v_transaction_id;
    
    -- Branch 2 transfers cash to Branch 1
    SELECT create_inter_branch_transfer(
        '0b1b37cd-4096-4718-8cd4-e370f234005b'::uuid,  -- From Branch 2
        'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'::uuid,  -- To Branch 1
        'cash',
        5000.00,  -- Cash amount
        'Daily cash consolidation',
        CURRENT_DATE - INTERVAL '2 days'
    ) INTO v_transaction_id;
END $$;

-- ============================================================================
-- STEP 6: REPORTING QUERIES
-- ============================================================================

-- Branch Revenue Summary
CREATE OR REPLACE VIEW v_branch_revenue_summary AS
SELECT 
    o.organization_name as branch_name,
    e.entity_code as account_code,
    e.entity_name as account_name,
    COALESCE(SUM(ABS(tl.line_amount)), 0) as revenue_amount
FROM core_organizations o
JOIN core_entities e ON e.organization_id = o.id
LEFT JOIN universal_transaction_lines tl ON tl.gl_account_code = e.entity_code
    AND tl.organization_id = o.id
WHERE e.entity_type = 'gl_account'
  AND e.entity_code LIKE '4%'  -- Revenue accounts
  AND o.id IN (
      'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      '0b1b37cd-4096-4718-8cd4-e370f234005b'
  )
GROUP BY o.organization_name, e.entity_code, e.entity_name
ORDER BY o.organization_name, e.entity_code;

-- Staff Commission Summary
CREATE OR REPLACE VIEW v_staff_commission_summary AS
SELECT 
    o.organization_name as branch_name,
    e.entity_name as staff_name,
    e.entity_code as staff_code,
    COUNT(DISTINCT t.id) as service_count,
    SUM(t.total_amount) as total_revenue,
    SUM((t.metadata->>'commission_amount')::numeric) as total_commission
FROM core_organizations o
JOIN universal_transactions t ON t.organization_id = o.id
JOIN core_entities e ON e.id = (t.metadata->>'stylist_id')::uuid
WHERE t.transaction_type = 'service_sale'
  AND t.status = 'completed'
GROUP BY o.organization_name, e.entity_name, e.entity_code
ORDER BY o.organization_name, total_commission DESC;

-- Inter-Branch Balance Summary
CREATE OR REPLACE VIEW v_inter_branch_balances AS
SELECT 
    o.organization_name as branch_name,
    CASE 
        WHEN e.entity_code = '1128000' THEN 'Receivables'
        WHEN e.entity_code = '2180000' THEN 'Payables'
    END as balance_type,
    COALESCE(SUM(
        CASE 
            WHEN tl.metadata->>'posting_type' = 'debit' THEN tl.line_amount
            WHEN tl.metadata->>'posting_type' = 'credit' THEN -tl.line_amount
            ELSE 0
        END
    ), 0) as balance_amount
FROM core_organizations o
JOIN core_entities e ON e.organization_id = o.id
LEFT JOIN universal_transaction_lines tl ON tl.gl_account_code = e.entity_code
    AND tl.organization_id = o.id
WHERE e.entity_code IN ('1128000', '2180000')
  AND o.id IN (
      'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      '0b1b37cd-4096-4718-8cd4-e370f234005b'
  )
GROUP BY o.organization_name, e.entity_code
ORDER BY o.organization_name, balance_type;

-- ============================================================================
-- CLEANUP
-- ============================================================================

DROP FUNCTION IF EXISTS create_salon_service_transaction(UUID, UUID, UUID, UUID, DATE, NUMERIC, VARCHAR);
DROP FUNCTION IF EXISTS create_product_sale_transaction(UUID, UUID, UUID, NUMERIC, DATE, VARCHAR);
DROP FUNCTION IF EXISTS create_inter_branch_transfer(UUID, UUID, VARCHAR, NUMERIC, TEXT, DATE);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

/*
-- Check transaction summary by branch
SELECT 
    o.organization_name,
    t.transaction_type,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_amount
FROM core_organizations o
JOIN universal_transactions t ON t.organization_id = o.id
WHERE o.id IN (
    'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
    '0b1b37cd-4096-4718-8cd4-e370f234005b'
)
GROUP BY o.organization_name, t.transaction_type
ORDER BY o.organization_name, t.transaction_type;

-- View sample data from views
SELECT * FROM v_branch_revenue_summary;
SELECT * FROM v_staff_commission_summary;
SELECT * FROM v_inter_branch_balances;
*/