-- General fix script for all functions referencing "entities" instead of "core_entities"
-- This handles the most common patterns

-- Create a procedure to fix a single function
CREATE OR REPLACE FUNCTION fix_entities_references_in_function(
    p_schema_name text,
    p_function_name text
) RETURNS void AS $$
DECLARE
    v_function_def text;
    v_fixed_def text;
    v_function_oid oid;
BEGIN
    -- Get function OID
    SELECT p.oid INTO v_function_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = p_schema_name 
    AND p.proname = p_function_name
    LIMIT 1;
    
    IF v_function_oid IS NULL THEN
        RAISE NOTICE 'Function %.% not found', p_schema_name, p_function_name;
        RETURN;
    END IF;
    
    -- Get function definition
    v_function_def := pg_get_functiondef(v_function_oid);
    
    -- Replace common patterns
    v_fixed_def := v_function_def;
    
    -- Replace table references (careful not to replace core_entities)
    v_fixed_def := regexp_replace(v_fixed_def, '\yFROM\s+entities\y', 'FROM core_entities', 'gi');
    v_fixed_def := regexp_replace(v_fixed_def, '\yJOIN\s+entities\y', 'JOIN core_entities', 'gi');
    v_fixed_def := regexp_replace(v_fixed_def, '\yUPDATE\s+entities\y', 'UPDATE core_entities', 'gi');
    v_fixed_def := regexp_replace(v_fixed_def, '\yINSERT\s+INTO\s+entities\y', 'INSERT INTO core_entities', 'gi');
    v_fixed_def := regexp_replace(v_fixed_def, '\yDELETE\s+FROM\s+entities\y', 'DELETE FROM core_entities', 'gi');
    v_fixed_def := regexp_replace(v_fixed_def, '\yINTO\s+entities\y', 'INTO core_entities', 'gi');
    v_fixed_def := regexp_replace(v_fixed_def, '\yEXISTS\s*\(\s*SELECT\s+.*\s+FROM\s+entities\y', 'EXISTS (SELECT 1 FROM core_entities', 'gi');
    
    -- If changes were made, drop and recreate the function
    IF v_fixed_def != v_function_def THEN
        RAISE NOTICE 'Fixing function %.%', p_schema_name, p_function_name;
        
        -- Drop the old function
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', p_schema_name, p_function_name);
        
        -- Create the fixed function
        EXECUTE v_fixed_def;
        
        RAISE NOTICE 'Function %.% fixed successfully', p_schema_name, p_function_name;
    ELSE
        RAISE NOTICE 'Function %.% does not need fixing', p_schema_name, p_function_name;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error fixing function %.%: %', p_schema_name, p_function_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Apply fixes to all functions that need it
DO $$
DECLARE
    v_record record;
    v_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting to fix functions with entities references...';
    
    FOR v_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'auth')
        AND pg_get_functiondef(p.oid) ~* '\yentities\y'
        AND pg_get_functiondef(p.oid) !~* '(comment|entities_backup|old_entities)'
        AND (
            pg_get_functiondef(p.oid) ~* '\yFROM\s+entities\y' OR
            pg_get_functiondef(p.oid) ~* '\yJOIN\s+entities\y' OR
            pg_get_functiondef(p.oid) ~* '\yUPDATE\s+entities\y' OR
            pg_get_functiondef(p.oid) ~* '\yINSERT\s+INTO\s+entities\y' OR
            pg_get_functiondef(p.oid) ~* '\yDELETE\s+FROM\s+entities\y'
        )
    LOOP
        PERFORM fix_entities_references_in_function(v_record.schema_name, v_record.function_name);
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Processed % functions', v_count;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS fix_entities_references_in_function(text, text);

-- Specifically handle tg_entity_fields_soft_validate if it exists
DROP FUNCTION IF EXISTS public.tg_entity_fields_soft_validate() CASCADE;

CREATE OR REPLACE FUNCTION public.tg_entity_fields_soft_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate that the entity_id exists in core_entities
    IF NEW.entity_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM core_entities 
            WHERE id = NEW.entity_id 
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid entity_id: % does not exist in core_entities for organization %', 
                NEW.entity_id, NEW.organization_id
                USING HINT = 'Please ensure the entity exists before creating dynamic data';
        END IF;
    END IF;
    
    -- Validate organization consistency
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'organization_id cannot be NULL'
            USING HINT = 'All records must belong to an organization';
    END IF;
    
    -- Validate organization exists
    IF NOT EXISTS (
        SELECT 1 FROM core_organizations WHERE id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Invalid organization_id: %', NEW.organization_id
            USING HINT = 'Organization must exist in core_organizations';
    END IF;
    
    -- Additional validation for dynamic data fields
    IF NEW.field_name IS NULL OR trim(NEW.field_name) = '' THEN
        RAISE EXCEPTION 'field_name cannot be NULL or empty'
            USING HINT = 'Every dynamic field must have a name';
    END IF;
    
    -- Ensure at least one value field is populated
    IF NEW.field_value_text IS NULL 
    AND NEW.field_value_number IS NULL 
    AND NEW.field_value_boolean IS NULL 
    AND NEW.field_value_date IS NULL 
    AND NEW.field_value_json IS NULL THEN
        RAISE EXCEPTION 'At least one field_value must be provided'
            USING HINT = 'Dynamic data must contain a value in one of the typed fields';
    END IF;
    
    -- Ensure only one value type is used
    IF (CASE WHEN NEW.field_value_text IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.field_value_number IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.field_value_boolean IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.field_value_date IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.field_value_json IS NOT NULL THEN 1 ELSE 0 END) > 1 THEN
        RAISE WARNING 'Multiple value types provided for field %. Only one should be used.', NEW.field_name;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.tg_entity_fields_soft_validate() IS 
'Validates entity field references for core_dynamic_data table. 
Ensures entity_id exists in core_entities and enforces organization consistency.
This is part of HERA''s sacred 6-table architecture validation.';

-- Recreate any triggers that should use this function
DO $$
BEGIN
    -- Check if we need this trigger on core_dynamic_data
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'validate_entity_fields' 
        AND tgrelid = 'core_dynamic_data'::regclass
    ) THEN
        CREATE TRIGGER validate_entity_fields
            BEFORE INSERT OR UPDATE ON core_dynamic_data
            FOR EACH ROW
            EXECUTE FUNCTION public.tg_entity_fields_soft_validate();
            
        RAISE NOTICE 'Created trigger validate_entity_fields on core_dynamic_data';
    END IF;
END $$;

-- Final verification
DO $$
DECLARE
    v_bad_count integer;
BEGIN
    -- Count remaining bad references
    SELECT COUNT(*) INTO v_bad_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth')
    AND pg_get_functiondef(p.oid) ~* '\yFROM\s+entities\y'
    AND pg_get_functiondef(p.oid) !~* '(comment|entities_backup|old_entities)';
    
    IF v_bad_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All functions have been fixed!';
    ELSE
        RAISE WARNING 'There are still % functions with entities references that need manual review', v_bad_count;
    END IF;
END $$;