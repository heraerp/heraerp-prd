-- =====================================================
-- HERA AP-Progressive Module Universal Schema
-- Generated from Progressive Prototype Analysis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VENDOR ENTITIES SCHEMA
-- =====================================================

-- Sample vendor entities
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    entity_subcategory,
    status,
    effective_date,
    metadata,
    ai_classification,
    ai_confidence,
    created_at,
    updated_at
) VALUES 
-- Office Supply Plus
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'vendor',
    'Office Supply Plus',
    'V001',
    'supplier',
    'office_supplies',
    'active',
    CURRENT_DATE,
    '{"business_size": "medium", "industry": "office_supplies", "country": "USA", "state": "CA"}',
    'reliable_supplier',
    0.92,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- TechPro Solutions
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'vendor',
    'TechPro Solutions',
    'V002',
    'supplier',
    'technology',
    'active',
    CURRENT_DATE,
    '{"business_size": "large", "industry": "technology", "country": "USA", "state": "TX"}',
    'premium_supplier',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- City Power & Light
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'vendor',
    'City Power & Light',
    'V003',
    'supplier',
    'utilities',
    'active',
    CURRENT_DATE,
    '{"business_size": "large", "industry": "utilities", "country": "USA", "state": "CA", "critical_service": true}',
    'utility_provider',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- VENDOR DYNAMIC DATA (Custom Properties)
-- =====================================================

-- Get vendor IDs for dynamic data insertion
WITH vendor_ids AS (
    SELECT id, entity_code 
    FROM core_entities 
    WHERE entity_type = 'vendor' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- Office Supply Plus (V001) properties
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_description,
    field_category,
    field_value,
    field_value_number,
    field_value_boolean,
    display_order,
    is_required,
    is_searchable,
    validation_rules,
    ai_confidence,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    v.id,
    'risk_score',
    'number',
    'Vendor Risk Score',
    'AI-calculated risk assessment (0-100, lower is better)',
    'financial_metrics',
    '18',
    18,
    NULL,
    1,
    false,
    true,
    '{"min": 0, "max": 100}',
    0.94,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    v.id,
    'payment_terms',
    'text',
    'Payment Terms',
    'Standard payment terms for this vendor',
    'payment_terms',
    'NET30',
    NULL,
    NULL,
    2,
    true,
    true,
    '{"enum": ["NET15", "NET30", "NET45", "NET60", "COD", "Prepaid"]}',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    v.id,
    'early_payment_discount',
    'number',
    'Early Payment Discount %',
    'Discount percentage for early payment',
    'payment_terms',
    '2.5',
    2.5,
    NULL,
    3,
    false,
    false,
    '{"min": 0, "max": 10, "step": 0.1}',
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    v.id,
    'credit_limit',
    'number',
    'Credit Limit',
    'Maximum outstanding amount allowed',
    'financial_metrics',
    '50000',
    50000,
    NULL,
    4,
    false,
    false,
    '{"min": 0, "currency": "USD"}',
    0.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    v.id,
    'payment_reliability',
    'text',
    'Payment Reliability Rating',
    'Historical payment behavior assessment',
    'performance_metrics',
    'excellent',
    NULL,
    NULL,
    5,
    false,
    true,
    '{"enum": ["excellent", "good", "fair", "poor"]}',
    0.88,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V001';

-- TechPro Solutions (V002) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', v.id, 
    'risk_score', 'number', 'Vendor Risk Score', 'financial_metrics', '8', 8, NULL,
    1, false, true, 0.96, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', v.id,
    'payment_terms', 'text', 'Payment Terms', 'payment_terms', 'NET15', NULL, NULL,
    2, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', v.id,
    'credit_limit', 'number', 'Credit Limit', 'financial_metrics', '100000', 100000, NULL,
    4, false, false, 0.92, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', v.id,
    'payment_reliability', 'text', 'Payment Reliability Rating', 'performance_metrics', 'excellent', NULL, NULL,
    5, false, true, 0.94, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM vendor_ids v WHERE v.entity_code = 'V002';

-- =====================================================
-- AP INVOICES (Universal Transactions)
-- =====================================================

-- Sample AP invoices
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    due_date,
    reference_number,
    external_reference,
    source_entity_id,
    total_amount,
    tax_amount,
    net_amount,
    currency,
    status,
    workflow_state,
    priority,
    department,
    cost_center,
    description,
    notes,
    metadata,
    ai_insights,
    ai_risk_score,
    ai_anomaly_score,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'ap_invoice',
    'OSP-2024-3456',
    '2024-12-05'::date,
    '2024-12-20'::date,
    'INV-OSP-001',
    'PO-2024-789',
    v.id, -- Office Supply Plus vendor ID
    3500.00,
    350.00,
    3150.00,
    'USD',
    'pending',
    'awaiting_approval',
    'medium',
    'Administration',
    'ADM001',
    'Office supplies monthly order',
    'Regular monthly supplies order - paper, pens, folders',
    '{"early_payment_eligible": true, "duplicate_check": "clean", "three_way_match": "pending"}',
    '[
        {
            "type": "payment_optimization",
            "message": "Pay by Dec 11 to capture 2.5% early payment discount ($87.50 savings).",
            "confidence": 96,
            "priority": "medium",
            "potential_savings": 87.50,
            "recommended_action": "Schedule payment for Dec 11",
            "timeline": "6 days"
        },
        {
            "type": "cash_flow",
            "message": "Vendor has excellent reliability. Safe to prioritize for early payment.",
            "confidence": 92,
            "priority": "low"
        }
    ]',
    18,
    5,
    'system_user',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities v 
WHERE v.entity_code = 'V001' 
AND v.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- TechPro Solutions Invoice (Paid)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date, due_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'ap_invoice', 'TECH-2024-5678',
    '2024-11-15'::date, '2024-12-30'::date, 'INV-TECH-002', v.id, 15000.00, 'USD',
    'paid', 'completed', 'Software licenses annual renewal',
    '[{"type": "relationship", "message": "Payment completed on time. Vendor relationship score improved to 88%.", "confidence": 94, "priority": "low"}]',
    8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities v WHERE v.entity_code = 'V002' AND v.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- City Power & Light Invoice (Overdue)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date, due_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    priority, description, ai_insights, ai_risk_score, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'ap_invoice', 'CPL-2024-NOV',
    '2024-11-01'::date, '2024-11-15'::date, 'INV-CPL-NOV', v.id, 2800.00, 'USD',
    'overdue', 'payment_required', 'urgent', 'Electricity charges - November 2024',
    '[
        {
            "type": "cash_flow",
            "message": "Critical utility payment overdue. Risk of service interruption. Pay immediately.",
            "confidence": 98,
            "priority": "urgent"
        },
        {
            "type": "payment_optimization", 
            "message": "Setup autopay to avoid late fees. Potential monthly savings: $25.",
            "confidence": 91,
            "priority": "medium",
            "potential_savings": 300
        }
    ]',
    5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities v WHERE v.entity_code = 'V003' AND v.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- INVOICE LINE ITEMS (Universal Transaction Lines)
-- =====================================================

-- Office Supply Plus invoice lines
WITH invoice_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'OSP-2024-3456'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id,
    transaction_id,
    organization_id,
    line_description,
    line_order,
    quantity,
    unit_of_measure,
    unit_price,
    line_amount,
    discount_amount,
    tax_amount,
    net_line_amount,
    gl_account_code,
    cost_center,
    department,
    notes,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    i.id,
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Office Paper - 8.5x11 Copy Paper',
    1,
    50,
    'cases',
    25.00,
    1250.00,
    0.00,
    125.00,
    1125.00,
    '6100',
    'ADM001',
    'Administration',
    'White copy paper for office printers',
    '{"product_code": "PAPER-8511", "supplier_part_num": "CP-8511-50"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM invoice_id i

UNION ALL

SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Office Supplies - Pens and Folders', 2, 25, 'boxes', 30.00, 750.00, 0.00, 75.00, 675.00,
    '6100', 'ADM001', 'Administration', 'Mixed office supplies - ballpoint pens and manila folders',
    '{"product_code": "OFFICE-MIX", "supplier_part_num": "OM-PF-25"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i

UNION ALL

SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Desk Organizers and Storage', 3, 10, 'units', 45.00, 450.00, 0.00, 45.00, 405.00,
    '6100', 'ADM001', 'Administration', 'Desktop organizers and filing storage solutions',
    '{"product_code": "DESK-ORG", "supplier_part_num": "DO-STORE-10"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i

UNION ALL

SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Printer Cartridges - HP LaserJet', 4, 5, 'units', 80.00, 400.00, 50.00, 35.00, 315.00,
    '6100', 'ADM001', 'Administration', 'Replacement toner cartridges for office printers',
    '{"product_code": "TONER-HP", "supplier_part_num": "HP-LJ-5P", "bulk_discount": 50.00}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i;

-- TechPro Solutions invoice lines  
WITH invoice_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'TECH-2024-5678'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, department, notes, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Microsoft Office 365 Enterprise Licenses', 1, 50, 300.00, 15000.00, '6200',
    'IT', 'Annual renewal for all staff Office 365 licenses',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i;

-- City Power & Light invoice lines
WITH invoice_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'CPL-2024-NOV'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, department, notes, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Electricity Usage - November 2024', 1, 5600, 0.50, 2800.00, '6300',
    'Facilities', 'Monthly electricity charges - 5,600 kWh @ $0.50/kWh',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i;

-- =====================================================
-- VENDOR-INVOICE RELATIONSHIPS
-- =====================================================

-- Create relationships between vendors and their invoices
WITH vendor_invoice_pairs AS (
    SELECT 
        v.id as vendor_id,
        t.id as invoice_id,
        v.entity_name as vendor_name,
        t.transaction_number as invoice_number
    FROM core_entities v
    JOIN universal_transactions t ON v.id = t.source_entity_id
    WHERE v.entity_type = 'vendor' 
    AND t.transaction_type = 'ap_invoice'
    AND v.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_label,
    relationship_strength,
    is_bidirectional,
    is_active,
    workflow_state,
    relationship_data,
    effective_date,
    ai_discovered,
    ai_confidence,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    vip.vendor_id,
    vip.invoice_id,
    'vendor_invoice',
    'Vendor-Invoice Relationship: ' || vip.vendor_name || ' -> ' || vip.invoice_number,
    0.95,
    false,
    true,
    'active',
    '{"invoice_type": "standard", "payment_terms_applied": true, "credit_check_status": "approved"}',
    CURRENT_DATE,
    false,
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM vendor_invoice_pairs vip;

-- =====================================================
-- VALIDATION TRIGGERS AND FUNCTIONS
-- =====================================================

-- Vendor validation function
CREATE OR REPLACE FUNCTION validate_ap_vendor()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate vendor entity
    IF NEW.entity_type = 'vendor' THEN
        -- Check vendor code format (V + digits)
        IF NEW.entity_code !~ '^V[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Vendor code must follow format V001, V002, etc. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure vendor name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'vendor'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Vendor name "%" already exists in organization', NEW.entity_name;
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'active');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create vendor validation trigger
DROP TRIGGER IF EXISTS validate_ap_vendor_trigger ON core_entities;
CREATE TRIGGER validate_ap_vendor_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'vendor')
    EXECUTE FUNCTION validate_ap_vendor();

-- AP invoice validation function
CREATE OR REPLACE FUNCTION validate_ap_invoice()
RETURNS TRIGGER AS $$
DECLARE
    vendor_exists boolean := false;
    vendor_active boolean := false;
BEGIN
    -- Validate AP invoice transactions
    IF NEW.transaction_type = 'ap_invoice' THEN
        -- Ensure invoice has vendor
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'AP invoice must have a vendor (source_entity_id)';
        END IF;
        
        -- Validate vendor exists and is active
        SELECT 
            EXISTS(SELECT 1 FROM core_entities WHERE id = NEW.source_entity_id),
            EXISTS(SELECT 1 FROM core_entities 
                  WHERE id = NEW.source_entity_id 
                  AND entity_type = 'vendor'
                  AND status = 'active'
                  AND organization_id = NEW.organization_id)
        INTO vendor_exists, vendor_active;
        
        IF NOT vendor_exists THEN
            RAISE EXCEPTION 'Vendor with ID % does not exist', NEW.source_entity_id;
        END IF;
        
        IF NOT vendor_active THEN
            RAISE EXCEPTION 'Vendor is not active for AP invoice';
        END IF;
        
        -- Ensure due date is after invoice date
        IF NEW.due_date IS NOT NULL AND NEW.due_date <= NEW.transaction_date THEN
            RAISE EXCEPTION 'Due date % must be after invoice date %', NEW.due_date, NEW.transaction_date;
        END IF;
        
        -- Validate amount is positive
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Invoice amount must be positive, got %', NEW.total_amount;
        END IF;
        
        -- Set default values
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'pending');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'created');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AP invoice validation trigger
DROP TRIGGER IF EXISTS validate_ap_invoice_trigger ON universal_transactions;
CREATE TRIGGER validate_ap_invoice_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'ap_invoice')
    EXECUTE FUNCTION validate_ap_invoice();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Vendor lookup optimization
CREATE INDEX IF NOT EXISTS idx_ap_vendors_by_org 
ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'vendor';

-- AP invoice queries optimization
CREATE INDEX IF NOT EXISTS idx_ap_invoices_by_org_status 
ON universal_transactions (organization_id, transaction_type, status, due_date)
WHERE transaction_type = 'ap_invoice';

-- Vendor-invoice relationship lookup
CREATE INDEX IF NOT EXISTS idx_ap_invoices_by_vendor 
ON universal_transactions (organization_id, source_entity_id, transaction_type)
WHERE transaction_type = 'ap_invoice';

-- Vendor dynamic data lookup optimization
CREATE INDEX IF NOT EXISTS idx_vendor_dynamic_data 
ON core_dynamic_data (organization_id, entity_id, field_name, field_type);

-- Invoice line items optimization
CREATE INDEX IF NOT EXISTS idx_ap_invoice_lines 
ON universal_transaction_lines (organization_id, transaction_id, gl_account_code);

-- =====================================================
-- SMART CODE CONFIGURATION
-- =====================================================

-- Register AP smart codes (if smart_code_registry table exists)
-- This would be created by the smart code system
/*
INSERT INTO smart_code_registry (
    smart_code,
    module_name,
    description,
    business_logic,
    gl_mapping,
    validation_rules,
    created_at
) VALUES 
(
    'HERA.AP.VENDOR.CREATE.v1',
    'ap-progressive',
    'Create vendor with validation and risk assessment',
    '{
        "entity_type": "vendor",
        "required_fields": ["entity_name", "entity_code", "organization_id"],
        "auto_generate": {"entity_code": "V{sequence:3}"},
        "ai_risk_assessment": true,
        "credit_check": true
    }',
    '{}',
    '["unique_vendor_name", "valid_vendor_code", "organization_exists"]',
    CURRENT_TIMESTAMP
),
(
    'HERA.AP.INVOICE.CREATE.v1',
    'ap-progressive', 
    'Create AP invoice with GL posting and fraud detection',
    '{
        "transaction_type": "ap_invoice",
        "auto_post_gl": true,
        "fraud_detection": true,
        "duplicate_detection": true,
        "three_way_match": false,
        "approval_required": true
    }',
    '{
        "debit_accounts": ["from_line_items_gl_codes"],
        "credit_account": "2000"
    }',
    '["vendor_exists", "positive_amount", "valid_due_date", "gl_accounts_exist"]',
    CURRENT_TIMESTAMP
),
(
    'HERA.AP.PAYMENT.PROCESS.v1',
    'ap-progressive',
    'Process vendor payment with cash flow impact',
    '{
        "transaction_type": "ap_payment",
        "auto_post_gl": true,
        "cash_flow_update": true,
        "early_payment_discount": true,
        "bank_reconciliation": true
    }',
    '{
        "debit_account": "2000",
        "credit_account": "1100"
    }',
    '["invoice_exists", "sufficient_balance", "payment_within_limits"]',
    CURRENT_TIMESTAMP
);
*/

-- =====================================================
-- SAMPLE DATA SUMMARY
-- =====================================================

-- Summary of created data
DO $$
DECLARE
    vendor_count integer;
    invoice_count integer;
    line_count integer;
    relationship_count integer;
    dynamic_data_count integer;
BEGIN
    SELECT COUNT(*) INTO vendor_count 
    FROM core_entities 
    WHERE entity_type = 'vendor' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO invoice_count 
    FROM universal_transactions 
    WHERE transaction_type = 'ap_invoice' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO line_count 
    FROM universal_transaction_lines 
    WHERE organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO relationship_count 
    FROM core_relationships 
    WHERE relationship_type = 'vendor_invoice' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO dynamic_data_count 
    FROM core_dynamic_data 
    WHERE organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'HERA AP-Progressive Module Schema Created Successfully';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Vendors Created: %', vendor_count;
    RAISE NOTICE 'AP Invoices Created: %', invoice_count;
    RAISE NOTICE 'Invoice Line Items: %', line_count;
    RAISE NOTICE 'Vendor-Invoice Relationships: %', relationship_count;
    RAISE NOTICE 'Dynamic Data Fields: %', dynamic_data_count;
    RAISE NOTICE '====================================================';
END
$$;