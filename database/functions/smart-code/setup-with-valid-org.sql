-- Auto-Posting Setup with Valid Organization
-- First, let's find a valid organization

-- 1. Check existing organizations
SELECT 
  id,
  organization_name,
  organization_type,
  status
FROM core_organizations
WHERE status = 'active'
LIMIT 5;

-- 2. Get the HERA System Organization or first active org
DO $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
BEGIN
  -- Try to find HERA System Organization first
  SELECT id, organization_name INTO v_org_id, v_org_name
  FROM core_organizations
  WHERE organization_name ILIKE '%HERA%' 
    AND status = 'active'
  LIMIT 1;
  
  -- If not found, get any active organization
  IF v_org_id IS NULL THEN
    SELECT id, organization_name INTO v_org_id, v_org_name
    FROM core_organizations
    WHERE status = 'active'
    LIMIT 1;
  END IF;
  
  -- If still no org found, create a test one
  IF v_org_id IS NULL THEN
    INSERT INTO core_organizations (
      organization_name,
      organization_type,
      status
    ) VALUES (
      'HERA Test Organization',
      'enterprise',
      'active'
    ) RETURNING id, organization_name INTO v_org_id, v_org_name;
  END IF;
  
  RAISE NOTICE 'Using Organization: % (ID: %)', v_org_name, v_org_id;
  
  -- Store in a temp table for use in the rest of the script
  CREATE TEMP TABLE IF NOT EXISTS temp_org_info AS
  SELECT v_org_id as org_id, v_org_name as org_name;
END $$;

-- 3. Create/Update the GL entries function
CREATE OR REPLACE FUNCTION create_gl_entries(
  p_transaction_id UUID,
  p_module TEXT,
  p_action TEXT
) RETURNS VOID AS $$
DECLARE
  v_gl_entries JSONB;
  v_transaction RECORD;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM universal_transactions
  WHERE id = p_transaction_id;
  
  -- Skip if no organization_id
  IF v_transaction.organization_id IS NULL THEN
    RAISE NOTICE 'Skipping GL entries - no organization_id for transaction %', p_transaction_id;
    RETURN;
  END IF;
  
  -- Determine GL accounts based on module and action
  v_gl_entries := CASE
    WHEN p_module = 'REST' AND p_action = 'ORDER' THEN
      jsonb_build_array(
        jsonb_build_object(
          'account', '1100000',
          'account_name', 'Cash and Cash Equivalents', 
          'debit', v_transaction.total_amount,
          'credit', 0
        ),
        jsonb_build_object(
          'account', '4110000',
          'account_name', 'Food Sales Revenue',
          'debit', 0,
          'credit', v_transaction.total_amount
        )
      )
      
    WHEN p_module = 'INV' AND p_action = 'RECEIPT' THEN
      jsonb_build_array(
        jsonb_build_object(
          'account', '1330000',
          'account_name', 'Food Inventory',
          'debit', v_transaction.total_amount,
          'credit', 0
        ),
        jsonb_build_object(
          'account', '2100000',
          'account_name', 'Accounts Payable',
          'debit', 0,
          'credit', v_transaction.total_amount
        )
      )
      
    WHEN p_module = 'FIN' AND p_action IN ('VENDOR', 'PAYMENT') THEN
      jsonb_build_array(
        jsonb_build_object(
          'account', '2100000',
          'account_name', 'Accounts Payable',
          'debit', v_transaction.total_amount,
          'credit', 0
        ),
        jsonb_build_object(
          'account', '1100000',
          'account_name', 'Cash and Cash Equivalents',
          'debit', 0,
          'credit', v_transaction.total_amount
        )
      )
  END;
  
  -- Only create journal entry if we have GL entries
  IF v_gl_entries IS NOT NULL THEN
    INSERT INTO universal_transactions (
      id,  -- Use system-generated ID
      organization_id,
      transaction_type,
      smart_code,
      reference_number,
      transaction_number,
      total_amount,
      currency,
      status,
      transaction_date,
      metadata
    )
    VALUES (
      gen_random_uuid(),  -- Generate new ID
      v_transaction.organization_id,
      'journal_entry',
      'HERA.FIN.GL.JE.AUTO.v1',
      'JE-' || v_transaction.reference_number,
      'JE-' || COALESCE(v_transaction.transaction_number, floor(random() * 100000)::text),
      v_transaction.total_amount,
      v_transaction.currency,
      'posted',
      v_transaction.transaction_date,
      jsonb_build_object(
        'gl_entries', v_gl_entries,
        'auto_generated', true,
        'source_transaction_id', p_transaction_id,
        'source_reference', v_transaction.reference_number,
        'source_smart_code', v_transaction.smart_code
      )
    );
    
    RAISE NOTICE 'Created journal entry for transaction %', v_transaction.reference_number;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure requires_gl_posting function exists
CREATE OR REPLACE FUNCTION requires_gl_posting(p_smart_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_smart_code ~ '\.(RECEIPT|ORDER|POST|COMPLETE|PAYMENT|VENDOR|CUSTOMER)\.';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Create/recreate the trigger
DROP TRIGGER IF EXISTS smart_code_processor ON universal_transactions;

CREATE TRIGGER smart_code_processor
  BEFORE INSERT OR UPDATE ON universal_transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_smart_code_posting();

-- 6. Test with the valid organization
DO $$
DECLARE
  v_test_id UUID;
  v_test_ref TEXT;
  v_org_id UUID;
BEGIN
  -- Get the org ID from our temp table
  SELECT org_id INTO v_org_id FROM temp_org_info LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No valid organization found';
  END IF;
  
  v_test_ref := 'SALE-GL-TEST-' || floor(random() * 10000)::text;
  
  INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    reference_number,
    smart_code,
    total_amount,
    currency,
    status,
    transaction_date,
    metadata
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'sale',
    'TXN-' || floor(random() * 100000)::text,
    v_test_ref,
    'HERA.REST.SALE.ORDER.v1',
    125.50,
    'USD',
    'completed',
    CURRENT_DATE,
    jsonb_build_object('customer', 'GL Test Customer', 'auto_post_test', true)
  ) RETURNING id INTO v_test_id;
  
  RAISE NOTICE 'Created test sale: % with ID: %', v_test_ref, v_test_id;
END $$;

-- 7. Wait a moment for processing
SELECT pg_sleep(1);

-- 8. Show test results
SELECT 
  'Original Transactions:' as report_section;

SELECT 
  transaction_type,
  reference_number,
  smart_code,
  total_amount,
  metadata->>'gl_posting_required' as gl_required,
  CASE 
    WHEN metadata->>'gl_posting_required' = 'true' THEN '✅ GL Posting Required'
    WHEN metadata->>'gl_posting_required' = 'false' THEN '❌ No GL Posting'
    ELSE '⚠️ Not Set'
  END as status
FROM universal_transactions
WHERE metadata->>'auto_post_test' = 'true'
ORDER BY created_at DESC;

SELECT 
  'Journal Entries Created:' as report_section;

SELECT 
  transaction_type,
  reference_number,
  smart_code,
  metadata->>'source_reference' as source_ref,
  metadata->'gl_entries' as gl_entries
FROM universal_transactions
WHERE transaction_type = 'journal_entry'
  AND metadata->>'auto_generated' = 'true'
  AND created_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- Clean up temp table
DROP TABLE IF EXISTS temp_org_info;