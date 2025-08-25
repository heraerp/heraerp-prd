-- =====================================================
-- HERA Salon Products Pricing Fix Bundle
-- Complete solution for product price fields functionality
-- =====================================================

-- PART 1: DIAGNOSE THE ISSUE
-- =====================================================

-- 1.1 Check for incorrect "entities" references
SELECT 
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%from entities%' THEN 'FOUND: Incorrect "entities" reference'
        ELSE 'OK'
    END as status
FROM pg_proc
WHERE prosrc LIKE '%entities%'
  AND prosrc NOT LIKE '%core_entities%'
  AND pronamespace = 'public'::regnamespace;

-- 1.2 Find triggers on core_dynamic_data
SELECT 
    tgname as trigger_name,
    tgfoid::regproc as function_name
FROM pg_trigger
WHERE tgrelid = 'core_dynamic_data'::regclass
  AND NOT tgisinternal;

-- PART 2: FIX THE DATABASE TRIGGER
-- =====================================================

-- 2.1 Drop the problematic function and recreate it correctly
DROP FUNCTION IF EXISTS public.tg_entity_fields_soft_validate() CASCADE;

CREATE OR REPLACE FUNCTION public.tg_entity_fields_soft_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate that the entity_id exists in core_entities (NOT "entities")
    IF NEW.entity_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM core_entities  -- CORRECT: Use core_entities per HERA's 6 tables
            WHERE id = NEW.entity_id 
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid entity_id: % does not exist in core_entities for organization %', 
                NEW.entity_id, NEW.organization_id
                USING HINT = 'Ensure the entity exists in core_entities table before adding dynamic data';
        END IF;
    END IF;
    
    -- Validate organization consistency
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'organization_id cannot be NULL'
            USING HINT = 'All records must belong to an organization for multi-tenant isolation';
    END IF;
    
    -- Validate field name
    IF NEW.field_name IS NULL OR NEW.field_name = '' THEN
        RAISE EXCEPTION 'field_name cannot be NULL or empty'
            USING HINT = 'Provide a meaningful field name for the dynamic data';
    END IF;
    
    -- Ensure at least one value field is populated
    IF NEW.field_value_text IS NULL 
    AND NEW.field_value_number IS NULL 
    AND NEW.field_value_boolean IS NULL 
    AND NEW.field_value_date IS NULL 
    AND NEW.field_value_json IS NULL THEN
        RAISE EXCEPTION 'At least one field_value must be provided'
            USING HINT = 'Set field_value_text, field_value_number, field_value_boolean, field_value_date, or field_value_json';
    END IF;
    
    -- Warning if multiple value types are used (not an error, but could indicate a mistake)
    IF (
        (NEW.field_value_text IS NOT NULL)::int +
        (NEW.field_value_number IS NOT NULL)::int +
        (NEW.field_value_boolean IS NOT NULL)::int +
        (NEW.field_value_date IS NOT NULL)::int +
        (NEW.field_value_json IS NOT NULL)::int
    ) > 1 THEN
        RAISE WARNING 'Multiple field value types are set for field_name: %. Only one should typically be used.', NEW.field_name;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2.2 Recreate the trigger
DROP TRIGGER IF EXISTS validate_entity_fields ON core_dynamic_data;

CREATE TRIGGER validate_entity_fields
    BEFORE INSERT OR UPDATE ON core_dynamic_data
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_entity_fields_soft_validate();

-- PART 3: TEST DATA SETUP
-- =====================================================

-- 3.1 Create test products with complete pricing
DO $$
DECLARE
    v_org_id UUID := '44d2d8f8-167d-46a7-a704-c0e5435863d6'; -- HERA Software Inc
    v_product_id UUID;
BEGIN
    -- Create a test product
    INSERT INTO core_entities (
        id, organization_id, entity_type, entity_name, entity_code,
        smart_code, status, created_at
    ) VALUES (
        gen_random_uuid(), v_org_id, 'product', 'Test Salon Product Bundle',
        'TEST-BUNDLE-001', 'HERA.SALON.PRODUCT.TEST.v1', 'active', NOW()
    ) RETURNING id INTO v_product_id;
    
    -- Add pricing data
    INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_number, smart_code, created_at)
    VALUES 
        (v_org_id, v_product_id, 'cost_price', 25.00, 'HERA.SALON.PRODUCT.FIELD.COST_PRICE.v1', NOW()),
        (v_org_id, v_product_id, 'retail_price', 50.00, 'HERA.SALON.PRODUCT.FIELD.RETAIL_PRICE.v1', NOW()),
        (v_org_id, v_product_id, 'professional_price', 40.00, 'HERA.SALON.PRODUCT.FIELD.PROFESSIONAL_PRICE.v1', NOW());
    
    -- Add other fields
    INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_text, smart_code, created_at)
    VALUES 
        (v_org_id, v_product_id, 'sku', 'BUNDLE-SKU-001', 'HERA.SALON.PRODUCT.FIELD.SKU.v1', NOW()),
        (v_org_id, v_product_id, 'category', 'HAIR_CARE', 'HERA.SALON.PRODUCT.FIELD.CATEGORY.v1', NOW()),
        (v_org_id, v_product_id, 'brand', 'HERA Professional', 'HERA.SALON.PRODUCT.FIELD.BRAND.v1', NOW());
    
    RAISE NOTICE 'Test product created with ID: %', v_product_id;
END $$;

-- PART 4: VERIFICATION QUERIES
-- =====================================================

-- 4.1 Verify products with prices
SELECT 
    e.entity_name as product_name,
    e.entity_code as product_code,
    MAX(CASE WHEN dd.field_name = 'cost_price' THEN dd.field_value_number END) as cost_price,
    MAX(CASE WHEN dd.field_name = 'retail_price' THEN dd.field_value_number END) as retail_price,
    MAX(CASE WHEN dd.field_name = 'professional_price' THEN dd.field_value_number END) as professional_price,
    MAX(CASE WHEN dd.field_name = 'sku' THEN dd.field_value_text END) as sku,
    MAX(CASE WHEN dd.field_name = 'category' THEN dd.field_value_text END) as category,
    MAX(CASE WHEN dd.field_name = 'brand' THEN dd.field_value_text END) as brand
FROM core_entities e
LEFT JOIN core_dynamic_data dd ON e.id = dd.entity_id
WHERE e.entity_type = 'product'
  AND e.organization_id = '44d2d8f8-167d-46a7-a704-c0e5435863d6'
GROUP BY e.id, e.entity_name, e.entity_code
ORDER BY e.created_at DESC;

-- 4.2 Check if trigger is working correctly
SELECT 
    tgname as trigger_name,
    tgfoid::regproc as function_name,
    tgenabled as is_enabled
FROM pg_trigger
WHERE tgrelid = 'core_dynamic_data'::regclass
  AND tgname = 'validate_entity_fields';

-- PART 5: CLEAN UP OLD TEST DATA (OPTIONAL)
-- =====================================================

-- Uncomment to clean up test data
/*
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_name LIKE 'Test%' 
    AND entity_type = 'product'
);

DELETE FROM core_entities 
WHERE entity_name LIKE 'Test%' 
AND entity_type = 'product';
*/

-- PART 6: USEFUL QUERIES FOR ONGOING MANAGEMENT
-- =====================================================

-- 6.1 Find all products without prices
SELECT e.entity_name, e.entity_code
FROM core_entities e
WHERE e.entity_type = 'product'
  AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data dd
    WHERE dd.entity_id = e.id
    AND dd.field_name IN ('cost_price', 'retail_price')
  );

-- 6.2 Products with their complete pricing info
CREATE OR REPLACE VIEW v_salon_products_with_prices AS
SELECT 
    e.id,
    e.organization_id,
    e.entity_name as product_name,
    e.entity_code as product_code,
    e.smart_code,
    e.status,
    COALESCE(dd.cost_price, 0) as cost_price,
    COALESCE(dd.retail_price, 0) as retail_price,
    COALESCE(dd.professional_price, 0) as professional_price,
    dd.sku,
    dd.category,
    dd.brand,
    dd.min_stock,
    dd.max_stock,
    e.created_at,
    e.updated_at
FROM core_entities e
LEFT JOIN LATERAL (
    SELECT 
        MAX(CASE WHEN field_name = 'cost_price' THEN field_value_number END) as cost_price,
        MAX(CASE WHEN field_name = 'retail_price' THEN field_value_number END) as retail_price,
        MAX(CASE WHEN field_name = 'professional_price' THEN field_value_number END) as professional_price,
        MAX(CASE WHEN field_name = 'sku' THEN field_value_text END) as sku,
        MAX(CASE WHEN field_name = 'category' THEN field_value_text END) as category,
        MAX(CASE WHEN field_name = 'brand' THEN field_value_text END) as brand,
        MAX(CASE WHEN field_name = 'min_stock' THEN field_value_number END) as min_stock,
        MAX(CASE WHEN field_name = 'max_stock' THEN field_value_number END) as max_stock
    FROM core_dynamic_data
    WHERE entity_id = e.id
) dd ON true
WHERE e.entity_type = 'product';

-- Test the view
SELECT * FROM v_salon_products_with_prices WHERE organization_id = '44d2d8f8-167d-46a7-a704-c0e5435863d6';

-- =====================================================
-- END OF BUNDLE
-- This bundle fixes the "entities" table reference issue
-- and ensures salon products work with HERA's 6 sacred tables
-- =====================================================