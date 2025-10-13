-- Test GL Balance Trigger
-- Run this to verify the trigger works correctly

-- Test 1: Balanced transaction (should succeed)
BEGIN;
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, smart_code, created_at
  ) VALUES (
    gen_random_uuid(), 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    'JOURNAL_ENTRY',
    'HERA.ACCOUNTING.GL.JOURNAL.V2',
    NOW()
  );
  
  -- Debit: $1000 to Cash
  INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number, 
    entity_id, line_amount, smart_code, created_at
  ) VALUES (
    gen_random_uuid(),
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    (SELECT id FROM universal_transactions ORDER BY created_at DESC LIMIT 1),
    1,
    NULL, -- Would be Cash account entity
    1000.00,  -- Positive = Debit
    'HERA.ACCOUNTING.GL.DEBIT.CASH.V2',
    NOW()
  );
  
  -- Credit: $1000 to Revenue
  INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number,
    entity_id, line_amount, smart_code, created_at
  ) VALUES (
    gen_random_uuid(),
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    (SELECT id FROM universal_transactions ORDER BY created_at DESC LIMIT 1),
    2,
    NULL, -- Would be Revenue account entity  
    -1000.00, -- Negative = Credit
    'HERA.ACCOUNTING.GL.CREDIT.REVENUE.V2',
    NOW()
  );
COMMIT;

-- Test 2: Unbalanced transaction (should fail)
-- Uncomment to test error handling:
/*
BEGIN;
  INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number,
    line_amount, smart_code, created_at
  ) VALUES (
    gen_random_uuid(),
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    (SELECT id FROM universal_transactions ORDER BY created_at DESC LIMIT 1),
    3,
    500.00, -- This will make it unbalanced
    'HERA.ACCOUNTING.GL.DEBIT.TEST.V2',
    NOW()
  );
ROLLBACK;
*/