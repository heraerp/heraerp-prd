-- Update core_dynamic_data to allow decimal and integer field types
-- This makes the system more flexible for numeric data

-- Drop the existing constraint
ALTER TABLE core_dynamic_data 
DROP CONSTRAINT IF EXISTS core_dynamic_data_field_type_check;

-- Add the new constraint with decimal and integer types
ALTER TABLE core_dynamic_data 
ADD CONSTRAINT core_dynamic_data_field_type_check 
CHECK (field_type::text = ANY (ARRAY[
    'text'::character varying, 
    'number'::character varying, 
    'decimal'::character varying,  -- Added for precise numeric values like prices
    'integer'::character varying,  -- Added for whole numbers like quantities
    'boolean'::character varying, 
    'date'::character varying, 
    'datetime'::character varying, 
    'json'::character varying, 
    'file'::character varying
]::text[]));

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Updated core_dynamic_data field types';
    RAISE NOTICE '📊 Now supports: text, number, decimal, integer, boolean, date, datetime, json, file';
    RAISE NOTICE '💰 decimal: For prices, percentages, precise measurements';
    RAISE NOTICE '🔢 integer: For quantities, counts, whole numbers';
    RAISE NOTICE '🚀 Menu items can now use more specific numeric types!';
END $$;