-- Fix tg_entity_fields_soft_validate function
-- This script identifies and fixes the function that incorrectly references "entities" instead of "core_entities"

-- First, let's check if the function exists and get its definition
DO $$
DECLARE
    func_def text;
BEGIN
    -- Check if function exists
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'tg_entity_fields_soft_validate'
    ) THEN
        -- Get the function definition
        SELECT pg_get_functiondef(oid) INTO func_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'tg_entity_fields_soft_validate';
        
        RAISE NOTICE 'Current function definition: %', func_def;
    ELSE
        RAISE NOTICE 'Function tg_entity_fields_soft_validate does not exist';
    END IF;
END $$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.tg_entity_fields_soft_validate() CASCADE;

-- Create the corrected function
-- This function validates entity fields references use core_entities (not entities)
CREATE OR REPLACE FUNCTION public.tg_entity_fields_soft_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate that the entity_id exists in core_entities (not entities)
    IF NEW.entity_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM core_entities 
            WHERE id = NEW.entity_id 
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid entity_id: % does not exist in core_entities for organization %', 
                NEW.entity_id, NEW.organization_id;
        END IF;
    END IF;
    
    -- Validate organization consistency
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'organization_id cannot be NULL';
    END IF;
    
    -- Additional validation for dynamic data fields
    IF NEW.field_name IS NULL OR NEW.field_name = '' THEN
        RAISE EXCEPTION 'field_name cannot be NULL or empty';
    END IF;
    
    -- Ensure at least one value field is populated
    IF NEW.field_value_text IS NULL 
    AND NEW.field_value_number IS NULL 
    AND NEW.field_value_boolean IS NULL 
    AND NEW.field_value_date IS NULL 
    AND NEW.field_value_json IS NULL THEN
        RAISE EXCEPTION 'At least one field_value must be provided';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Re-create any triggers that use this function
-- Check if there are triggers on core_dynamic_data that use this function
DO $$
BEGIN
    -- Drop and recreate trigger if it exists
    DROP TRIGGER IF EXISTS validate_entity_fields ON core_dynamic_data;
    
    -- Create trigger on core_dynamic_data
    CREATE TRIGGER validate_entity_fields
        BEFORE INSERT OR UPDATE ON core_dynamic_data
        FOR EACH ROW
        EXECUTE FUNCTION public.tg_entity_fields_soft_validate();
        
    RAISE NOTICE 'Trigger validate_entity_fields created on core_dynamic_data';
END $$;

-- Verify the fix by checking for any remaining references to "entities" table
DO $$
DECLARE
    func_record record;
    func_source text;
BEGIN
    RAISE NOTICE 'Checking all functions for incorrect "entities" references...';
    
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_functiondef(p.oid) as func_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND pg_get_functiondef(p.oid) LIKE '%FROM entities%'
        AND pg_get_functiondef(p.oid) NOT LIKE '%FROM core_entities%'
    LOOP
        RAISE WARNING 'Function %.% contains reference to "entities" table: %', 
            func_record.nspname, func_record.proname, 
            substring(func_record.func_def from 1 for 200);
    END LOOP;
    
    RAISE NOTICE 'Check complete.';
END $$;

-- Test the function works correctly
DO $$
DECLARE
    test_org_id uuid;
    test_entity_id uuid;
BEGIN
    -- Get a test organization
    SELECT id INTO test_org_id FROM core_organizations LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Get a test entity
        SELECT id INTO test_entity_id 
        FROM core_entities 
        WHERE organization_id = test_org_id 
        LIMIT 1;
        
        IF test_entity_id IS NOT NULL THEN
            RAISE NOTICE 'Testing function with org: %, entity: %', test_org_id, test_entity_id;
            
            -- This should succeed
            BEGIN
                INSERT INTO core_dynamic_data (
                    organization_id, 
                    entity_id, 
                    field_name, 
                    field_value_text
                ) VALUES (
                    test_org_id,
                    test_entity_id,
                    'test_field',
                    'test_value'
                );
                RAISE NOTICE 'Test insert successful';
                -- Rollback the test insert
                ROLLBACK;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Test insert failed: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

COMMENT ON FUNCTION public.tg_entity_fields_soft_validate() IS 
'Validates entity field references for core_dynamic_data table. Ensures entity_id exists in core_entities and enforces organization consistency.';