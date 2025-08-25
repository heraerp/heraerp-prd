-- Test dynamic data insertion for HERA's core_dynamic_data table
-- This tests if the "entities" error is preventing dynamic field storage

-- First, let's use the Test Product we created earlier
-- Organization: HERA Software Inc (44d2d8f8-167d-46a7-a704-c0e5435863d6)
-- Product: Test Product After Fix (11ec6f11-7eaf-4c3d-95e8-448b63eba47c)

-- Test 1: Direct insert of price data
INSERT INTO public.core_dynamic_data
(organization_id, entity_id, field_name, field_type, field_value_number, smart_code, created_at)
VALUES
('44d2d8f8-167d-46a7-a704-c0e5435863d6', '11ec6f11-7eaf-4c3d-95e8-448b63eba47c', 'cost_price', 'number', 15.99, 'HERA.SALON.PRODUCT.FIELD.COST_PRICE.v1', NOW());

-- Test 2: Insert retail price
INSERT INTO public.core_dynamic_data
(organization_id, entity_id, field_name, field_type, field_value_number, smart_code, created_at)
VALUES
('44d2d8f8-167d-46a7-a704-c0e5435863d6', '11ec6f11-7eaf-4c3d-95e8-448b63eba47c', 'retail_price', 'number', 29.99, 'HERA.SALON.PRODUCT.FIELD.RETAIL_PRICE.v1', NOW());

-- Test 3: Insert text field (SKU)
INSERT INTO public.core_dynamic_data
(organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_at)
VALUES
('44d2d8f8-167d-46a7-a704-c0e5435863d6', '11ec6f11-7eaf-4c3d-95e8-448b63eba47c', 'sku', 'text', 'TEST-SKU-001', 'HERA.SALON.PRODUCT.FIELD.SKU.v1', NOW());

-- Test 4: Check if data was inserted
SELECT 
    dd.field_name,
    dd.field_value_text,
    dd.field_value_number,
    dd.created_at,
    e.entity_name
FROM core_dynamic_data dd
JOIN core_entities e ON dd.entity_id = e.id
WHERE dd.entity_id = '11ec6f11-7eaf-4c3d-95e8-448b63eba47c';

-- Test 5: Alternative - Use Mario's Restaurant product
-- L'Oréal Professional Shampoo (c2162d25-6f8a-4b32-a38d-33dbba61bf15)
INSERT INTO public.core_dynamic_data
(organization_id, entity_id, field_name, field_type, field_value_number, smart_code, created_at)
VALUES
('3df8cc52-3d81-42d5-b088-7736ae26cc7c', 'c2162d25-6f8a-4b32-a38d-33dbba61bf15', 'cost_price', 'number', 12.50, 'HERA.SALON.PRODUCT.FIELD.COST_PRICE.v1', NOW());

-- Check results
SELECT 
    dd.field_name,
    dd.field_value_number,
    e.entity_name,
    o.organization_name
FROM core_dynamic_data dd
JOIN core_entities e ON dd.entity_id = e.id
JOIN core_organizations o ON dd.organization_id = o.id
WHERE e.entity_type = 'product'
ORDER BY dd.created_at DESC
LIMIT 10;