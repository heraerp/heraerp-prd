-- =====================================================
-- SALON ERP COMPLETE SQL SETUP FOR SUPABASE
-- =====================================================
-- This script creates a complete Salon ERP using HERA's 6-table architecture
-- Run each section in order in Supabase SQL Editor

-- =====================================================
-- STEP 1: CREATE ORGANIZATION
-- =====================================================
INSERT INTO core_organizations (
    id,
    organization_code,
    organization_name,
    organization_type,
    industry_classification,
    settings,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    'SALON-ERP-2025',
    'Premium Hair & Beauty Salon',
    'salon',
    'salon',
    jsonb_build_object(
        'industry', 'salon',
        'currency', 'AED',
        'timezone', 'Asia/Dubai',
        'fiscal_year_start', '01-01',
        'working_hours', jsonb_build_object(
            'monday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'tuesday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'wednesday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'thursday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'friday', jsonb_build_object('open', '09:00', 'close', '22:00'),
            'saturday', jsonb_build_object('open', '09:00', 'close', '22:00'),
            'sunday', jsonb_build_object('open', '10:00', 'close', '20:00')
        )
    ),
    'active',
    NOW()
) RETURNING id;

-- Save the returned ID as :org_id for use in subsequent queries
-- Example: SET LOCAL app.org_id = 'your-returned-uuid-here';

-- =====================================================
-- STEP 2: CREATE CORE ENTITIES
-- =====================================================

-- 2.1 Create Services
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
-- Basic Services
(gen_random_uuid(), :org_id, 'service', 'Basic Haircut', 'SVC-HAIR-001', 
 'HERA.SALON.SERVICE.HAIRCUT.BASIC.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'service', 'Premium Hair Color', 'SVC-COLOR-001', 
 'HERA.SALON.SERVICE.COLOR.PREMIUM.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'service', 'Hair Treatment', 'SVC-TREAT-001', 
 'HERA.SALON.SERVICE.TREATMENT.KERATIN.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'service', 'Bridal Package', 'SVC-BRIDE-001', 
 'HERA.SALON.SERVICE.PACKAGE.BRIDAL.v1', 'active', NOW()),
-- Service Bundles
(gen_random_uuid(), :org_id, 'service_bundle', 'Cut & Color Combo', 'BUNDLE-CC-001', 
 'HERA.SALON.SERVICE.BUNDLE.CUTCOLOR.v1', 'active', NOW());

-- 2.2 Create Products
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), :org_id, 'product', 'Professional Shampoo', 'PROD-SHMP-001', 
 'HERA.SALON.INVENTORY.PRODUCT.SHAMPOO.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'product', 'Hair Color - Blonde', 'PROD-COLOR-001', 
 'HERA.SALON.INVENTORY.PRODUCT.COLOR.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'product', 'Hair Serum', 'PROD-SERUM-001', 
 'HERA.SALON.INVENTORY.PRODUCT.SERUM.v1', 'active', NOW());

-- 2.3 Create Staff/Stylists
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), :org_id, 'stylist', 'Emma Wilson', 'STAFF-001', 
 'HERA.SALON.RESOURCE.STYLIST.SENIOR.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'stylist', 'Sarah Chen', 'STAFF-002', 
 'HERA.SALON.RESOURCE.STYLIST.JUNIOR.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'stylist', 'Maria Garcia', 'STAFF-003', 
 'HERA.SALON.RESOURCE.STYLIST.COLORIST.v1', 'active', NOW());

-- 2.4 Create Resources (Chairs/Stations)
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), :org_id, 'chair', 'Station 1 - Premium', 'CHAIR-001', 
 'HERA.SALON.RESOURCE.CHAIR.PREMIUM.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'chair', 'Station 2 - Standard', 'CHAIR-002', 
 'HERA.SALON.RESOURCE.CHAIR.STANDARD.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'room', 'VIP Treatment Room', 'ROOM-001', 
 'HERA.SALON.RESOURCE.ROOM.VIP.v1', 'active', NOW());

-- 2.5 Create Sample Customers
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), :org_id, 'customer', 'Aisha Mohammed', 'CUST-001', 
 'HERA.SALON.CRM.CUSTOMER.VIP.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'customer', 'Fatima Al-Rashid', 'CUST-002', 
 'HERA.SALON.CRM.CUSTOMER.REGULAR.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'customer', 'Noor Abdullah', 'CUST-003', 
 'HERA.SALON.CRM.CUSTOMER.NEW.v1', 'active', NOW());

-- 2.6 Create Financial Entities
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
-- Tax Profiles
(gen_random_uuid(), :org_id, 'tax_profile', 'VAT 5%', 'TAX-VAT-5', 
 'HERA.SALON.FINANCE.TAX_PROFILE.VAT5.v1', 'active', NOW()),
-- Payment Terms
(gen_random_uuid(), :org_id, 'payment_terms', 'Immediate Payment', 'TERMS-IMM', 
 'HERA.SALON.FINANCE.PAYMENT_TERMS.IMMEDIATE.v1', 'active', NOW()),
-- GL Accounts (Sample)
(gen_random_uuid(), :org_id, 'gl_account', 'Cash on Hand', 'GL-1100', 
 'HERA.FINANCE.COA.ACCOUNT.CASH.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'gl_account', 'Service Revenue', 'GL-4100', 
 'HERA.FINANCE.COA.ACCOUNT.REVENUE.v1', 'active', NOW());

-- 2.7 Create Suppliers
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), :org_id, 'supplier', 'Beauty Supplies Dubai', 'SUPP-001', 
 'HERA.SALON.SUPPLIER.PRODUCTS.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'supplier', 'Professional Hair Products', 'SUPP-002', 
 'HERA.SALON.SUPPLIER.EQUIPMENT.v1', 'active', NOW());

-- =====================================================
-- STEP 3: ADD DYNAMIC DATA (Entity Properties)
-- =====================================================

-- 3.1 Service Properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, 
    field_value_text, field_value_number, smart_code, created_at
)
SELECT 
    gen_random_uuid(), :org_id, e.id, f.field_name, f.field_type,
    f.field_value_text, f.field_value_number, e.smart_code, NOW()
FROM core_entities e
CROSS JOIN (
    VALUES 
    -- Basic Haircut
    ('SVC-HAIR-001', 'duration_minutes', 'number', NULL, 45),
    ('SVC-HAIR-001', 'base_price', 'number', NULL, 120.00),
    ('SVC-HAIR-001', 'skill_level_required', 'text', 'basic', NULL),
    -- Premium Hair Color
    ('SVC-COLOR-001', 'duration_minutes', 'number', NULL, 90),
    ('SVC-COLOR-001', 'base_price', 'number', NULL, 350.00),
    ('SVC-COLOR-001', 'skill_level_required', 'text', 'advanced', NULL),
    -- Hair Treatment
    ('SVC-TREAT-001', 'duration_minutes', 'number', NULL, 60),
    ('SVC-TREAT-001', 'base_price', 'number', NULL, 280.00),
    ('SVC-TREAT-001', 'buffer_time_after', 'number', NULL, 15)
) AS f(entity_code, field_name, field_type, field_value_text, field_value_number)
WHERE e.entity_code = f.entity_code AND e.organization_id = :org_id;

-- 3.2 Product Properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, 
    field_value_text, field_value_number, smart_code, created_at
)
SELECT 
    gen_random_uuid(), :org_id, e.id, f.field_name, f.field_type,
    f.field_value_text, f.field_value_number, e.smart_code, NOW()
FROM core_entities e
CROSS JOIN (
    VALUES 
    ('PROD-SHMP-001', 'sku', 'text', 'SHP-PRO-001', NULL),
    ('PROD-SHMP-001', 'cost_price', 'number', NULL, 25.00),
    ('PROD-SHMP-001', 'retail_price', 'number', NULL, 45.00),
    ('PROD-SHMP-001', 'reorder_point', 'number', NULL, 10),
    ('PROD-COLOR-001', 'sku', 'text', 'CLR-BLD-001', NULL),
    ('PROD-COLOR-001', 'cost_price', 'number', NULL, 35.00),
    ('PROD-COLOR-001', 'retail_price', 'number', NULL, 65.00),
    ('PROD-COLOR-001', 'expiry_days', 'number', NULL, 180)
) AS f(entity_code, field_name, field_type, field_value_text, field_value_number)
WHERE e.entity_code = f.entity_code AND e.organization_id = :org_id;

-- 3.3 Staff Properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, 
    field_value_text, field_value_number, smart_code, created_at
)
SELECT 
    gen_random_uuid(), :org_id, e.id, f.field_name, f.field_type,
    f.field_value_text, f.field_value_number, e.smart_code, NOW()
FROM core_entities e
CROSS JOIN (
    VALUES 
    ('STAFF-001', 'commission_rate', 'number', NULL, 0.35),
    ('STAFF-001', 'specialization', 'text', 'color_specialist', NULL),
    ('STAFF-001', 'max_daily_appointments', 'number', NULL, 8),
    ('STAFF-002', 'commission_rate', 'number', NULL, 0.25),
    ('STAFF-002', 'specialization', 'text', 'general', NULL),
    ('STAFF-003', 'commission_rate', 'number', NULL, 0.40),
    ('STAFF-003', 'specialization', 'text', 'colorist', NULL)
) AS f(entity_code, field_name, field_type, field_value_text, field_value_number)
WHERE e.entity_code = f.entity_code AND e.organization_id = :org_id;

-- 3.4 Customer Properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, 
    field_value_text, field_value_number, smart_code, created_at
)
SELECT 
    gen_random_uuid(), :org_id, e.id, f.field_name, f.field_type,
    f.field_value_text, f.field_value_number, e.smart_code, NOW()
FROM core_entities e
CROSS JOIN (
    VALUES 
    ('CUST-001', 'phone', 'text', '+971555123456', NULL),
    ('CUST-001', 'email', 'text', 'aisha.m@email.com', NULL),
    ('CUST-001', 'preferred_stylist', 'text', 'STAFF-001', NULL),
    ('CUST-001', 'loyalty_tier', 'text', 'gold', NULL),
    ('CUST-002', 'phone', 'text', '+971555987654', NULL),
    ('CUST-002', 'email', 'text', 'fatima.r@email.com', NULL),
    ('CUST-003', 'phone', 'text', '+971555456789', NULL)
) AS f(entity_code, field_name, field_type, field_value_text, field_value_number)
WHERE e.entity_code = f.entity_code AND e.organization_id = :org_id;

-- =====================================================
-- STEP 4: CREATE RELATIONSHIPS
-- =====================================================

-- 4.1 Service Uses Product (for inventory consumption)
INSERT INTO core_relationships (
    id, organization_id, from_entity_id, to_entity_id, 
    relationship_type, smart_code, metadata, created_at
)
SELECT 
    gen_random_uuid(), :org_id, s.id, p.id,
    'SERVICE_USES_PRODUCT', 'HERA.SALON.REL.SERVICE_PRODUCT.v1',
    jsonb_build_object('quantity_per_service', r.quantity),
    NOW()
FROM core_entities s
JOIN core_entities p ON p.organization_id = s.organization_id
CROSS JOIN (
    VALUES 
    ('SVC-COLOR-001', 'PROD-COLOR-001', 1.5),
    ('SVC-TREAT-001', 'PROD-SERUM-001', 0.25)
) AS r(service_code, product_code, quantity)
WHERE s.entity_code = r.service_code 
  AND p.entity_code = r.product_code
  AND s.organization_id = :org_id;

-- 4.2 Stylist Has Skills
INSERT INTO core_relationships (
    id, organization_id, from_entity_id, to_entity_id, 
    relationship_type, smart_code, metadata, created_at
)
SELECT 
    gen_random_uuid(), :org_id, st.id, sv.id,
    'STYLIST_HAS_SKILL', 'HERA.SALON.REL.STYLIST_SKILL.v1',
    jsonb_build_object('proficiency_level', r.level),
    NOW()
FROM core_entities st
JOIN core_entities sv ON sv.organization_id = st.organization_id
CROSS JOIN (
    VALUES 
    ('STAFF-001', 'SVC-COLOR-001', 'expert'),
    ('STAFF-001', 'SVC-HAIR-001', 'expert'),
    ('STAFF-002', 'SVC-HAIR-001', 'intermediate'),
    ('STAFF-003', 'SVC-COLOR-001', 'expert'),
    ('STAFF-003', 'SVC-TREAT-001', 'expert')
) AS r(staff_code, service_code, level)
WHERE st.entity_code = r.staff_code 
  AND sv.entity_code = r.service_code
  AND st.organization_id = :org_id;

-- =====================================================
-- STEP 5: CREATE SAMPLE TRANSACTIONS
-- =====================================================

-- 5.1 Create Appointment
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_date, transaction_code,
    smart_code, source_entity_id, target_entity_id, 
    total_amount, transaction_currency_code, business_context, created_at
)
SELECT 
    gen_random_uuid(), :org_id, 'appointment', 
    NOW() + INTERVAL '2 days', 'APPT-2025-001',
    'HERA.SALON.APPT.BOOK.CREATE.v1',
    c.id, s.id,  -- customer to stylist
    0, 'AED',
    jsonb_build_object(
        'appointment_datetime', (NOW() + INTERVAL '2 days')::text,
        'duration_minutes', 90,
        'status', 'confirmed',
        'services', ARRAY['SVC-COLOR-001']
    ),
    NOW()
FROM core_entities c, core_entities s
WHERE c.entity_code = 'CUST-001' AND c.organization_id = :org_id
  AND s.entity_code = 'STAFF-001' AND s.organization_id = :org_id
RETURNING id; -- Save as :appt_id

-- 5.2 Create Appointment Lines
INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number, line_type,
    entity_id, quantity, unit_amount, line_amount, 
    smart_code, line_data, created_at
)
SELECT 
    gen_random_uuid(), :org_id, :appt_id, 1, 'SERVICE',
    e.id, 1, 350.00, 350.00,
    'HERA.SALON.APPT.LINE.SERVICE.v1',
    jsonb_build_object('duration_minutes', 90),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'SVC-COLOR-001' AND e.organization_id = :org_id
UNION ALL
SELECT 
    gen_random_uuid(), :org_id, :appt_id, 2, 'RESOURCE',
    e.id, 1, 0, 0,
    'HERA.SALON.APPT.LINE.RESOURCE.v1',
    jsonb_build_object('resource_type', 'chair'),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'CHAIR-001' AND e.organization_id = :org_id;

-- 5.3 Create POS Sale
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_date, transaction_code,
    smart_code, source_entity_id, target_entity_id, 
    total_amount, transaction_currency_code, business_context, created_at
)
SELECT 
    gen_random_uuid(), :org_id, 'pos_sale', 
    NOW(), 'POS-2025-001',
    'HERA.SALON.POS.SALE.CREATE.v1',
    c.id, :org_id,  -- customer to organization
    367.50, 'AED',
    jsonb_build_object(
        'payment_method', 'card',
        'stylist_id', s.id,
        'reference_appointment', :appt_id
    ),
    NOW()
FROM core_entities c, core_entities s
WHERE c.entity_code = 'CUST-001' AND c.organization_id = :org_id
  AND s.entity_code = 'STAFF-001' AND s.organization_id = :org_id
RETURNING id; -- Save as :pos_id

-- 5.4 Create POS Sale Lines
INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number, line_type,
    entity_id, quantity, unit_amount, line_amount, 
    smart_code, line_data, created_at
)
SELECT 
    gen_random_uuid(), :org_id, :pos_id, 1, 'SERVICE',
    e.id, 1, 350.00, 350.00,
    'HERA.SALON.POS.LINE.SERVICE.v1',
    jsonb_build_object('stylist_id', s.id),
    NOW()
FROM core_entities e, core_entities s
WHERE e.entity_code = 'SVC-COLOR-001' AND e.organization_id = :org_id
  AND s.entity_code = 'STAFF-001' AND s.organization_id = :org_id
UNION ALL
SELECT 
    gen_random_uuid(), :org_id, :pos_id, 2, 'TAX',
    e.id, 1, 17.50, 17.50,
    'HERA.SALON.POS.LINE.TAX.v1',
    jsonb_build_object('tax_base', 350.00, 'tax_rate', 0.05),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'TAX-VAT-5' AND e.organization_id = :org_id
UNION ALL
SELECT 
    gen_random_uuid(), :org_id, :pos_id, 3, 'PAYMENT',
    NULL, 1, -367.50, -367.50,
    'HERA.SALON.POS.LINE.PAYMENT.CARD.v1',
    jsonb_build_object('card_last4', '1234', 'auth_code', 'AUTH123'),
    NOW();

-- 5.5 Create Inventory Receipt (GRN)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_date, transaction_code,
    smart_code, source_entity_id, target_entity_id, 
    total_amount, transaction_currency_code, business_context, created_at
)
SELECT 
    gen_random_uuid(), :org_id, 'inventory_receipt', 
    NOW() - INTERVAL '1 day', 'GRN-2025-001',
    'HERA.SALON.INV.MOVE.RECEIPT.v1',
    s.id, :org_id,  -- supplier to organization
    1250.00, 'AED',
    jsonb_build_object(
        'purchase_order', 'PO-2025-001',
        'delivery_note', 'DN-2025-001'
    ),
    NOW()
FROM core_entities s
WHERE s.entity_code = 'SUPP-001' AND s.organization_id = :org_id
RETURNING id; -- Save as :grn_id

-- =====================================================
-- STEP 6: CREATE WORKFLOW STATUS ENTITIES
-- =====================================================

INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), :org_id, 'workflow_status', 'Draft Status', 'STATUS-DRAFT', 
 'HERA.WORKFLOW.STATUS.DRAFT.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'workflow_status', 'Pending Status', 'STATUS-PENDING', 
 'HERA.WORKFLOW.STATUS.PENDING.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'workflow_status', 'Confirmed Status', 'STATUS-CONFIRMED', 
 'HERA.WORKFLOW.STATUS.CONFIRMED.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'workflow_status', 'Completed Status', 'STATUS-COMPLETED', 
 'HERA.WORKFLOW.STATUS.COMPLETED.v1', 'active', NOW()),
(gen_random_uuid(), :org_id, 'workflow_status', 'Cancelled Status', 'STATUS-CANCELLED', 
 'HERA.WORKFLOW.STATUS.CANCELLED.v1', 'active', NOW());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check organization
SELECT id, organization_code, organization_name FROM core_organizations 
WHERE organization_code = 'SALON-ERP-2025';

-- Count entities by type
SELECT entity_type, COUNT(*) as count 
FROM core_entities 
WHERE organization_id = :org_id
GROUP BY entity_type
ORDER BY entity_type;

-- Check transactions
SELECT transaction_type, transaction_code, total_amount, transaction_currency_code
FROM universal_transactions
WHERE organization_id = :org_id
ORDER BY created_at DESC;

-- Check smart codes are valid
SELECT entity_type, smart_code, 
       CASE WHEN smart_code ~ '^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' 
            THEN 'VALID' 
            ELSE 'INVALID' 
       END as validity
FROM core_entities 
WHERE organization_id = :org_id
LIMIT 10;