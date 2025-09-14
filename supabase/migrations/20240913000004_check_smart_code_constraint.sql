-- Check and temporarily modify smart code constraint to understand its format
DO $$
DECLARE
    v_constraint_def text;
BEGIN
    -- Get the constraint definition
    SELECT pg_get_constraintdef(oid) INTO v_constraint_def
    FROM pg_constraint
    WHERE conrelid = 'core_entities'::regclass
    AND conname = 'core_entities_smart_code_ck';
    
    RAISE NOTICE 'Current smart code constraint: %', v_constraint_def;
    
    -- Also check if there's a check constraint with different name
    FOR v_constraint_def IN 
        SELECT conname || ': ' || pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'core_entities'::regclass
        AND contype = 'c'  -- check constraints
    LOOP
        RAISE NOTICE 'Check constraint: %', v_constraint_def;
    END LOOP;
END $$;

-- Don't make any changes, just show the constraints