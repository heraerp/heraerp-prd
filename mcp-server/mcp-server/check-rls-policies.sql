-- Script to check RLS policies for furniture demo user
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('core_entities', 'universal_transactions', 'core_dynamic_data', 'core_relationships')
AND schemaname = 'public'
ORDER BY tablename, policyname;
