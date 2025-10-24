-- Check the hera_entity_upsert_v1 function definition
SELECT 
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'hera_entity_upsert_v1';
