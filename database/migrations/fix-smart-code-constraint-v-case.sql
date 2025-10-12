-- Fix smart code constraint to allow both uppercase V and lowercase v
-- This allows both .V1 and .V1 formats

-- Update constraint for core_entities
ALTER TABLE core_entities 
DROP CONSTRAINT IF EXISTS core_entities_smart_code_check;

ALTER TABLE core_entities 
ADD CONSTRAINT core_entities_smart_code_check 
CHECK ((smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$'::text));

-- Update constraint for core_dynamic_data
ALTER TABLE core_dynamic_data 
DROP CONSTRAINT IF EXISTS core_dynamic_data_smart_code_check;

ALTER TABLE core_dynamic_data 
ADD CONSTRAINT core_dynamic_data_smart_code_check 
CHECK ((smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$'::text));

-- Update constraint for core_relationships
ALTER TABLE core_relationships 
DROP CONSTRAINT IF EXISTS core_relationships_smart_code_check;

ALTER TABLE core_relationships 
ADD CONSTRAINT core_relationships_smart_code_check 
CHECK ((smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$'::text));

-- Update constraint for universal_transactions
ALTER TABLE universal_transactions 
DROP CONSTRAINT IF EXISTS universal_transactions_smart_code_check;

ALTER TABLE universal_transactions 
ADD CONSTRAINT universal_transactions_smart_code_check 
CHECK ((smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$'::text));

-- Update constraint for universal_transaction_lines
ALTER TABLE universal_transaction_lines 
DROP CONSTRAINT IF EXISTS universal_transaction_lines_smart_code_check;

ALTER TABLE universal_transaction_lines 
ADD CONSTRAINT universal_transaction_lines_smart_code_check 
CHECK ((smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$'::text));