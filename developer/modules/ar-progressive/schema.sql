-- =====================================================
-- HERA AR-Progressive Module Universal Schema
-- Generated from Progressive Prototype Analysis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOMER ENTITIES SCHEMA
-- =====================================================

-- Sample customer entities
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
-- TechCorp Solutions (Enterprise Customer)
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'customer',
    'TechCorp Solutions',
    'C001',
    'client',
    'enterprise',
    'active',
    CURRENT_DATE,
    '{"business_size": "enterprise", "industry": "technology", "country": "USA", "state": "CA", "annual_revenue": 5000000}',
    'high_value_customer',
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Global Manufacturing Inc
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'customer',
    'Global Manufacturing Inc',
    'C002',
    'client',
    'large_business',
    'active',
    CURRENT_DATE,
    '{"business_size": "large", "industry": "manufacturing", "country": "USA", "state": "TX", "annual_revenue": 2500000}',
    'reliable_customer',
    0.92,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Healthcare Partners LLC
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'customer',
    'Healthcare Partners LLC',
    'C003',
    'client',
    'mid_market',
    'active',
    CURRENT_DATE,
    '{"business_size": "medium", "industry": "healthcare", "country": "USA", "state": "FL", "annual_revenue": 1200000}',
    'growing_customer',
    0.88,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Small Business Services (Credit Risk)
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'customer',
    'Small Business Services',
    'C004',
    'client',
    'small_business',
    'active',
    CURRENT_DATE,
    '{"business_size": "small", "industry": "services", "country": "USA", "state": "NY", "annual_revenue": 350000, "credit_risk": "elevated"}',
    'credit_watch_customer',
    0.75,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- CUSTOMER DYNAMIC DATA (Properties)
-- =====================================================

-- Get customer IDs for dynamic data insertion
WITH customer_ids AS (
    SELECT id, entity_code 
    FROM core_entities 
    WHERE entity_type = 'customer' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- TechCorp Solutions (C001) properties
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
    c.id,
    'credit_limit',
    'number',
    'Credit Limit',
    'Maximum outstanding amount allowed for customer',
    'financial_metrics',
    '75000',
    75000,
    NULL,
    1,
    false,
    true,
    '{"min": 0, "currency": "USD"}',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    c.id,
    'payment_terms',
    'text',
    'Payment Terms',
    'Standard payment terms for this customer',
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
FROM customer_ids c WHERE c.entity_code = 'C001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    c.id,
    'credit_score',
    'number',
    'Credit Score',
    'Business credit score (300-850)',
    'financial_metrics',
    '850',
    850,
    NULL,
    3,
    false,
    true,
    '{"min": 300, "max": 850}',
    0.92,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    c.id,
    'payment_history_score',
    'number',
    'Payment History Score',
    'Historical payment behavior score (0-100)',
    'performance_metrics',
    '95',
    95,
    NULL,
    4,
    false,
    true,
    '{"min": 0, "max": 100}',
    0.89,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    c.id,
    'average_days_to_pay',
    'number',
    'Average Days to Pay',
    'Historical average days from invoice to payment',
    'performance_metrics',
    '18',
    18,
    NULL,
    5,
    false,
    true,
    '{"min": 0}',
    0.87,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C001';

-- Global Manufacturing Inc (C002) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id, 
    'credit_limit', 'number', 'Credit Limit', 'financial_metrics', '50000', 50000, NULL,
    1, false, true, 0.94, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'payment_terms', 'text', 'Payment Terms', 'payment_terms', 'NET45', NULL, NULL,
    2, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'credit_score', 'number', 'Credit Score', 'financial_metrics', '780', 780, NULL,
    3, false, true, 0.90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'payment_history_score', 'number', 'Payment History Score', 'performance_metrics', '88', 88, NULL,
    4, false, true, 0.86, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'average_days_to_pay', 'number', 'Average Days to Pay', 'performance_metrics', '42', 42, NULL,
    5, false, true, 0.84, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C002';

-- Small Business Services (C004) properties - Credit Risk Customer
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id, 
    'credit_limit', 'number', 'Credit Limit', 'financial_metrics', '5000', 5000, NULL,
    1, false, true, 0.82, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C004'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'payment_terms', 'text', 'Payment Terms', 'payment_terms', 'NET15', NULL, NULL,
    2, true, true, 0.95, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C004'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'credit_score', 'number', 'Credit Score', 'financial_metrics', '620', 620, NULL,
    3, false, true, 0.78, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C004'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'payment_history_score', 'number', 'Payment History Score', 'performance_metrics', '65', 65, NULL,
    4, false, true, 0.75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C004'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', c.id,
    'average_days_to_pay', 'number', 'Average Days to Pay', 'performance_metrics', '52', 52, NULL,
    5, false, true, 0.72, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM customer_ids c WHERE c.entity_code = 'C004';

-- =====================================================
-- AR INVOICES (Universal Transactions)
-- =====================================================

-- Sample AR invoices
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
    'ar_invoice',
    'INV-2024-5678',
    '2024-12-05'::date,
    '2024-12-20'::date,
    'INV-TECH-001',
    'PO-TECH-2024-456',
    c.id, -- TechCorp Solutions customer ID
    8500.00,
    850.00,
    7650.00,
    'USD',
    'sent',
    'awaiting_payment',
    'medium',
    'Consulting',
    'CONS001',
    'Professional services - Q4 consulting engagement',
    'Invoice sent to customer via email and portal',
    '{"early_payment_discount": true, "credit_check_status": "approved", "collection_priority": "medium"}',
    '[
        {
            "type": "collection_optimization",
            "message": "Customer typically pays in 18 days. Schedule follow-up reminder for Dec 18th.",
            "confidence": 88,
            "priority": "medium",
            "recommended_action": "Schedule follow-up on day 15",
            "timeline": "3 days"
        },
        {
            "type": "credit_assessment",
            "message": "Excellent credit profile. Safe to extend additional credit if needed.",
            "confidence": 95,
            "priority": "low"
        }
    ]',
    25,
    3,
    'system_user',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities c 
WHERE c.entity_code = 'C001' 
AND c.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Global Manufacturing Invoice (Overdue)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date, due_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    priority, description, ai_insights, ai_risk_score, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'ar_invoice', 'INV-2024-4567',
    '2024-11-01'::date, '2024-11-16'::date, 'INV-GLOBAL-002', c.id, 12500.00, 'USD',
    'overdue', 'collection_required', 'high', 'Manufacturing equipment consultation',
    '[
        {
            "type": "collection_priority", 
            "message": "Invoice is 24 days overdue. Escalate to collections team immediately.",
            "confidence": 98,
            "priority": "urgent",
            "recommended_action": "Phone call and formal notice",
            "potential_risk": "Customer relationship impact"
        },
        {
            "type": "payment_prediction",
            "message": "Based on payment history, expect payment within next 10 days if contacted.",
            "confidence": 82,
            "priority": "medium"
        }
    ]',
    35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities c WHERE c.entity_code = 'C002' AND c.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Small Business Services Invoice (Credit Risk)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date, due_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    priority, description, ai_insights, ai_risk_score, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'ar_invoice', 'INV-2024-3456',
    '2024-12-01'::date, '2024-12-16'::date, 'INV-SMALL-003', c.id, 3200.00, 'USD',
    'sent', 'credit_watch', 'high', 'Business process consulting services',
    '[
        {
            "type": "credit_risk",
            "message": "Customer near credit limit and has slow payment history. Monitor closely.",
            "confidence": 91,
            "priority": "high",
            "recommended_action": "Weekly follow-up, consider credit hold for new orders"
        },
        {
            "type": "cash_flow_impact",
            "message": "If payment delayed beyond 30 days, will impact monthly cash flow by 2.1%.",
            "confidence": 87,
            "priority": "medium"
        }
    ]',
    65, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities c WHERE c.entity_code = 'C004' AND c.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- INVOICE LINE ITEMS (Universal Transaction Lines)
-- =====================================================

-- TechCorp Solutions invoice lines
WITH invoice_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'INV-2024-5678'
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
    'Senior Consultant - Q4 Strategy Implementation',
    1,
    120,
    'hours',
    65.00,
    7800.00,
    0.00,
    780.00,
    7020.00,
    '4000',
    'CONS001',
    'Consulting',
    'Senior consultant services for strategic planning and implementation',
    '{"service_code": "CONS-SR", "consultant_id": "EMP-001", "billable_rate": 65.00}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM invoice_id i

UNION ALL

SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Project Management and Coordination', 2, 10, 'hours', 70.00, 700.00, 0.00, 70.00, 630.00,
    '4000', 'CONS001', 'Consulting', 'Project management services and stakeholder coordination',
    '{"service_code": "PM-STD", "consultant_id": "EMP-002", "billable_rate": 70.00}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i;

-- Global Manufacturing invoice lines  
WITH invoice_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'INV-2024-4567'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, department, notes, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Manufacturing Process Optimization Consultation', 1, 150, 80.00, 12000.00, '4000',
    'Manufacturing', 'Comprehensive manufacturing process review and optimization recommendations',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i

UNION ALL

SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Equipment Efficiency Analysis Report', 2, 1, 500.00, 500.00, '4000',
    'Manufacturing', 'Detailed analysis report with ROI calculations and recommendations',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i;

-- Small Business Services invoice lines
WITH invoice_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'INV-2024-3456'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, department, notes, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), i.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Business Process Documentation and Analysis', 1, 64, 50.00, 3200.00, '4000',
    'Business Services', 'Documentation of current processes and improvement analysis',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM invoice_id i;

-- =====================================================
-- CUSTOMER-INVOICE RELATIONSHIPS
-- =====================================================

-- Create relationships between customers and their invoices
WITH customer_invoice_pairs AS (
    SELECT 
        c.id as customer_id,
        t.id as invoice_id,
        c.entity_name as customer_name,
        t.transaction_number as invoice_number,
        t.total_amount as invoice_amount,
        t.status as invoice_status,
        t.due_date - CURRENT_DATE as days_to_due
    FROM core_entities c
    JOIN universal_transactions t ON c.id = t.source_entity_id
    WHERE c.entity_type = 'customer' 
    AND t.transaction_type = 'ar_invoice'
    AND c.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
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
    cip.customer_id,
    cip.invoice_id,
    'customer_invoice',
    'Customer-Invoice Relationship: ' || cip.customer_name || ' -> ' || cip.invoice_number,
    0.98,
    false,
    true,
    'active',
    JSON_BUILD_OBJECT(
        'invoice_amount', cip.invoice_amount,
        'invoice_status', cip.invoice_status,
        'days_to_due', cip.days_to_due,
        'payment_tracking', true,
        'collection_enabled', true
    ),
    CURRENT_DATE,
    false,
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM customer_invoice_pairs cip;

-- =====================================================
-- VALIDATION TRIGGERS AND FUNCTIONS
-- =====================================================

-- Customer validation function
CREATE OR REPLACE FUNCTION validate_ar_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate customer entity
    IF NEW.entity_type = 'customer' THEN
        -- Check customer code format (C + digits)
        IF NEW.entity_code !~ '^C[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Customer code must follow format C001, C002, etc. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure customer name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'customer'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Customer name "%" already exists in organization', NEW.entity_name;
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'active');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create customer validation trigger
DROP TRIGGER IF EXISTS validate_ar_customer_trigger ON core_entities;
CREATE TRIGGER validate_ar_customer_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'customer')
    EXECUTE FUNCTION validate_ar_customer();

-- AR invoice validation function with credit limit checking
CREATE OR REPLACE FUNCTION validate_ar_invoice()
RETURNS TRIGGER AS $$
DECLARE
    customer_exists boolean := false;
    customer_active boolean := false;
    customer_credit_limit DECIMAL(15,2) := 0;
    customer_current_balance DECIMAL(15,2) := 0;
BEGIN
    -- Validate AR invoice transactions
    IF NEW.transaction_type = 'ar_invoice' THEN
        -- Ensure invoice has customer
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'AR invoice must have a customer (source_entity_id)';
        END IF;
        
        -- Validate customer exists and is active
        SELECT 
            EXISTS(SELECT 1 FROM core_entities WHERE id = NEW.source_entity_id),
            EXISTS(SELECT 1 FROM core_entities 
                  WHERE id = NEW.source_entity_id 
                  AND entity_type = 'customer'
                  AND status = 'active'
                  AND organization_id = NEW.organization_id)
        INTO customer_exists, customer_active;
        
        IF NOT customer_exists THEN
            RAISE EXCEPTION 'Customer with ID % does not exist', NEW.source_entity_id;
        END IF;
        
        IF NOT customer_active THEN
            RAISE EXCEPTION 'Customer is not active for AR invoice';
        END IF;
        
        -- Credit limit validation
        SELECT 
            COALESCE(
                (SELECT field_value_number FROM core_dynamic_data 
                 WHERE entity_id = NEW.source_entity_id AND field_name = 'credit_limit'), 
                0
            ),
            COALESCE(
                (SELECT SUM(total_amount) FROM universal_transactions 
                 WHERE source_entity_id = NEW.source_entity_id 
                 AND transaction_type = 'ar_invoice' 
                 AND status IN ('sent', 'overdue')
                 AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)), 
                0
            )
        INTO customer_credit_limit, customer_current_balance;
        
        IF (customer_current_balance + NEW.total_amount) > customer_credit_limit THEN
            RAISE EXCEPTION 'Invoice would exceed customer credit limit. Limit: $%, Current: $%, New Invoice: $%', 
                customer_credit_limit, customer_current_balance, NEW.total_amount;
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
        NEW.status := COALESCE(NEW.status, 'draft');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'created');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AR invoice validation trigger
DROP TRIGGER IF EXISTS validate_ar_invoice_trigger ON universal_transactions;
CREATE TRIGGER validate_ar_invoice_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'ar_invoice')
    EXECUTE FUNCTION validate_ar_invoice();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Customer lookup optimization
CREATE INDEX IF NOT EXISTS idx_ar_customers_by_org 
ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'customer';

-- AR invoice queries optimization
CREATE INDEX IF NOT EXISTS idx_ar_invoices_by_org_status 
ON universal_transactions (organization_id, transaction_type, status, due_date)
WHERE transaction_type = 'ar_invoice';

-- Customer-invoice relationship lookup
CREATE INDEX IF NOT EXISTS idx_ar_invoices_by_customer 
ON universal_transactions (organization_id, source_entity_id, transaction_type)
WHERE transaction_type = 'ar_invoice';

-- Customer dynamic data lookup optimization
CREATE INDEX IF NOT EXISTS idx_customer_dynamic_data 
ON core_dynamic_data (organization_id, entity_id, field_name, field_type);

-- Invoice line items optimization
CREATE INDEX IF NOT EXISTS idx_ar_invoice_lines 
ON universal_transaction_lines (organization_id, transaction_id, gl_account_code);

-- Aging analysis optimization
CREATE INDEX IF NOT EXISTS idx_ar_aging_analysis 
ON universal_transactions (organization_id, transaction_type, due_date, status, total_amount)
WHERE transaction_type = 'ar_invoice';

-- =====================================================
-- SAMPLE DATA SUMMARY
-- =====================================================

-- Summary of created data
DO $$
DECLARE
    customer_count integer;
    invoice_count integer;
    line_count integer;
    relationship_count integer;
    dynamic_data_count integer;
    total_ar_amount DECIMAL(15,2);
    overdue_amount DECIMAL(15,2);
BEGIN
    SELECT COUNT(*) INTO customer_count 
    FROM core_entities 
    WHERE entity_type = 'customer' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO invoice_count 
    FROM universal_transactions 
    WHERE transaction_type = 'ar_invoice' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO line_count 
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.transaction_type = 'ar_invoice'
    AND utl.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO relationship_count 
    FROM core_relationships 
    WHERE relationship_type = 'customer_invoice' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO dynamic_data_count 
    FROM core_dynamic_data cdd
    JOIN core_entities ce ON cdd.entity_id = ce.id
    WHERE ce.entity_type = 'customer'
    AND cdd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END), 0)
    INTO total_ar_amount, overdue_amount
    FROM universal_transactions
    WHERE transaction_type = 'ar_invoice'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'HERA AR-Progressive Module Schema Created Successfully';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Customers Created: %', customer_count;
    RAISE NOTICE 'AR Invoices Created: %', invoice_count;
    RAISE NOTICE 'Invoice Line Items: %', line_count;
    RAISE NOTICE 'Customer-Invoice Relationships: %', relationship_count;
    RAISE NOTICE 'Dynamic Data Fields: %', dynamic_data_count;
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE 'Financial Summary:';
    RAISE NOTICE 'Total AR Outstanding: $%', total_ar_amount;
    RAISE NOTICE 'Overdue Amount: $%', overdue_amount;
    RAISE NOTICE 'Collection Efficiency: %% ', ROUND((total_ar_amount - overdue_amount) / NULLIF(total_ar_amount, 0) * 100, 1);
    RAISE NOTICE '====================================================';
END
$$;