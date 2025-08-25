-- Diagnostic script to find all functions referencing "entities" instead of "core_entities"
-- Run this to identify all functions that need to be fixed

\echo 'Searching for functions with incorrect "entities" table references...'
\echo '================================================================='

-- Find all functions that reference "entities" but not as part of "core_entities"
WITH function_sources AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth', 'extensions')
)
SELECT 
    schema_name,
    function_name,
    CASE 
        WHEN function_definition ~* '\yentities\y(?![\w_])' 
         AND function_definition !~* '\ycore_entities\y'
        THEN 'NEEDS FIX: References "entities" without "core_"'
        
        WHEN function_definition ~* 'FROM\s+entities\s+'
        THEN 'NEEDS FIX: Has "FROM entities" statement'
        
        WHEN function_definition ~* 'JOIN\s+entities\s+'
        THEN 'NEEDS FIX: Has "JOIN entities" statement'
        
        WHEN function_definition ~* 'UPDATE\s+entities\s+'
        THEN 'NEEDS FIX: Has "UPDATE entities" statement'
        
        WHEN function_definition ~* 'INSERT\s+INTO\s+entities'
        THEN 'NEEDS FIX: Has "INSERT INTO entities" statement'
        
        WHEN function_definition ~* 'DELETE\s+FROM\s+entities'
        THEN 'NEEDS FIX: Has "DELETE FROM entities" statement'
        
        ELSE 'OK'
    END as status,
    substring(function_definition from '.*\yentities\y.*' for 200) as problematic_line
FROM function_sources
WHERE function_definition ~* '\yentities\y'
  AND function_definition !~* '(comment|entities_backup|old_entities)'
ORDER BY 
    CASE 
        WHEN function_definition ~* '\yentities\y(?![\w_])' 
         AND function_definition !~* '\ycore_entities\y'
        THEN 1
        ELSE 2
    END,
    schema_name, 
    function_name;

\echo ''
\echo 'Searching for triggers that might use problematic functions...'
\echo '============================================================='

-- Find all triggers and their functions
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) ~* '\yentities\y(?![\w_])' 
         AND pg_get_functiondef(p.oid) !~* '\ycore_entities\y'
        THEN 'NEEDS FIX'
        ELSE 'OK'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY status DESC, table_name, trigger_name;

\echo ''
\echo 'Searching for views that might reference "entities"...'
\echo '====================================================='

-- Find views with incorrect references
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition ~* '\yentities\y(?![\w_])' 
         AND definition !~* '\ycore_entities\y'
        THEN 'NEEDS FIX: References "entities" without "core_"'
        ELSE 'OK'
    END as status
FROM pg_views
WHERE schemaname IN ('public', 'auth')
  AND definition ~* '\yentities\y'
ORDER BY status DESC, schemaname, viewname;

\echo ''
\echo 'Summary of required fixes:'
\echo '========================='

-- Summary count
SELECT 
    'Functions' as object_type,
    COUNT(*) FILTER (WHERE pg_get_functiondef(p.oid) ~* '\yentities\y(?![\w_])' 
                       AND pg_get_functiondef(p.oid) !~* '\ycore_entities\y') as needs_fix,
    COUNT(*) as total_checked
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth', 'extensions')
  AND pg_get_functiondef(p.oid) ~* '\yentities\y'

UNION ALL

SELECT 
    'Views' as object_type,
    COUNT(*) FILTER (WHERE definition ~* '\yentities\y(?![\w_])' 
                       AND definition !~* '\ycore_entities\y') as needs_fix,
    COUNT(*) as total_checked
FROM pg_views
WHERE schemaname IN ('public', 'auth')
  AND definition ~* '\yentities\y';

\echo ''
\echo 'To fix these issues, each function/view needs to be updated to use "core_entities" instead of "entities"'