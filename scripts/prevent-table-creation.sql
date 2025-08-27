-- HERA Guardrail: Prevent Creation of Non-Sacred Tables
-- This creates a database trigger to prevent any new tables outside the 6-table architecture

-- Create a function that checks table creation
CREATE OR REPLACE FUNCTION prevent_non_sacred_tables()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
    obj record;
    sacred_tables text[] := ARRAY[
        'core_organizations',
        'core_entities',
        'core_dynamic_data',
        'core_relationships',
        'universal_transactions',
        'universal_transaction_lines'
    ];
BEGIN
    FOR obj IN 
        SELECT * FROM pg_event_trigger_ddl_commands() 
        WHERE command_tag = 'CREATE TABLE'
    LOOP
        -- Extract table name from object identity
        IF NOT (obj.object_identity = ANY(sacred_tables)) AND 
           obj.schema_name = 'public' AND
           NOT obj.object_identity LIKE 'auth.%' AND  -- Allow Supabase auth tables
           NOT obj.object_identity LIKE 'storage.%' AND  -- Allow Supabase storage tables
           NOT obj.object_identity LIKE 'vault.%' AND  -- Allow Supabase vault tables
           NOT obj.object_identity LIKE 'realtime.%' THEN  -- Allow Supabase realtime tables
            
            RAISE EXCEPTION 'HERA GUARDRAIL VIOLATION: Cannot create table %. Only the 6 sacred tables are allowed: %', 
                obj.object_identity, 
                array_to_string(sacred_tables, ', ');
        END IF;
    END LOOP;
END;
$$;

-- Create the event trigger (requires superuser privileges)
-- Note: This may not work on Supabase hosted instances due to security restrictions
DROP EVENT TRIGGER IF EXISTS enforce_sacred_tables CASCADE;
CREATE EVENT TRIGGER enforce_sacred_tables
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION prevent_non_sacred_tables();

-- Alternative: Create a monitoring view to detect violations
CREATE OR REPLACE VIEW non_sacred_tables AS
SELECT 
    table_schema,
    table_name,
    CASE 
        WHEN table_name IN (
            'core_organizations',
            'core_entities', 
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
        ) THEN 'SACRED'
        WHEN table_schema != 'public' THEN 'SYSTEM'
        ELSE 'VIOLATION'
    END as status
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY status DESC, table_name;

-- Check for violations
SELECT * FROM non_sacred_tables WHERE status = 'VIOLATION';