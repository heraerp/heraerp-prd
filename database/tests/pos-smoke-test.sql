-- POS Smoke Test SQL Queries
-- Validates POS transactions match expected format and business rules

-- =============================================================================
-- 1. Check most recent POS transaction header details
-- =============================================================================
WITH recent_pos AS (
  SELECT 
    id,
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    total_amount,
    smart_code,
    business_context,
    created_at
  FROM universal_transactions
  WHERE transaction_type = 'sale'  -- Note: should be 'sale', not 'POS_SALE'
    AND smart_code LIKE 'HERA.SALON.POS.%'
  ORDER BY created_at DESC
  LIMIT 5
)
SELECT 
  transaction_code,
  transaction_type,
  total_amount,
  smart_code,
  business_context->>'branch_id' as branch_id,
  business_context->>'source' as source,
  business_context->>'customer_id' as customer_id,
  business_context->>'cashier_id' as cashier_id,
  CASE 
    WHEN smart_code ~ '\.v[0-9]+$' THEN '✓ Valid (lowercase v)'
    WHEN smart_code ~ '\.V[0-9]+$' THEN '✗ Invalid (uppercase V)'
    ELSE '✗ Invalid pattern'
  END as smart_code_status,
  created_at
FROM recent_pos;

-- =============================================================================
-- 2. Show line items for most recent POS transaction with balance check
-- =============================================================================
WITH last_pos_header AS (
  SELECT 
    id, 
    transaction_code, 
    smart_code, 
    total_amount,
    business_context
  FROM universal_transactions
  WHERE transaction_type = 'sale'
    AND smart_code LIKE 'HERA.SALON.POS.%'
  ORDER BY created_at DESC
  LIMIT 1
),
pos_lines AS (
  SELECT 
    utl.*,
    lph.transaction_code as parent_tx_code,
    lph.total_amount as parent_total
  FROM universal_transaction_lines utl
  JOIN last_pos_header lph ON utl.transaction_id = lph.id
)
SELECT 
  line_number,
  line_type,
  line_amount,
  quantity,
  unit_price,
  smart_code,
  CASE 
    WHEN smart_code LIKE '%SERVICE%' THEN 'Service Line'
    WHEN smart_code LIKE '%PRODUCT%' THEN 'Product Line'
    WHEN smart_code LIKE '%TAX%' THEN 'Tax Line'
    WHEN smart_code LIKE '%PAYMENT%' THEN 'Payment Line'
    WHEN smart_code LIKE '%DISCOUNT%' THEN 'Discount Line'
    WHEN smart_code LIKE '%TIP%' THEN 'Tip Line'
    WHEN smart_code LIKE '%COMMISSION%' THEN 'Commission Line'
    ELSE 'Other'
  END as line_category,
  CASE 
    WHEN smart_code ~ '\.v[0-9]+$' THEN '✓'
    ELSE '✗'
  END as valid_version,
  line_data->>'payment_method' as payment_method,
  line_data->>'stylist_id' as stylist_id,
  parent_tx_code,
  parent_total
FROM pos_lines
ORDER BY line_number;

-- Show balance summary
WITH last_pos_balance AS (
  SELECT 
    ut.id,
    ut.transaction_code,
    ut.total_amount as header_total,
    SUM(CASE 
      WHEN utl.smart_code NOT LIKE '%PAYMENT%' 
      THEN utl.line_amount 
      ELSE 0 
    END) as non_payment_lines_total,
    SUM(CASE 
      WHEN utl.smart_code LIKE '%PAYMENT%' 
      THEN utl.line_amount 
      ELSE 0 
    END) as payment_lines_total,
    SUM(utl.line_amount) as all_lines_total,
    COUNT(utl.id) as total_lines,
    COUNT(CASE WHEN utl.smart_code LIKE '%SERVICE%' THEN 1 END) as service_lines,
    COUNT(CASE WHEN utl.smart_code LIKE '%TAX%' THEN 1 END) as tax_lines,
    COUNT(CASE WHEN utl.smart_code LIKE '%PAYMENT%' THEN 1 END) as payment_lines
  FROM universal_transactions ut
  LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'sale'
    AND ut.smart_code LIKE 'HERA.SALON.POS.%'
    AND ut.created_at >= NOW() - INTERVAL '1 day'
  GROUP BY ut.id, ut.transaction_code, ut.total_amount
  ORDER BY ut.created_at DESC
  LIMIT 1
)
SELECT 
  transaction_code,
  header_total,
  non_payment_lines_total,
  payment_lines_total,
  all_lines_total,
  ROUND(ABS(all_lines_total), 2) as absolute_balance,
  CASE 
    WHEN ABS(all_lines_total) < 0.01 THEN '✓ BALANCED'
    ELSE '✗ UNBALANCED'
  END as balance_status,
  CASE 
    WHEN ABS(non_payment_lines_total + payment_lines_total) < 0.01 THEN '✓ Payment matches charges'
    ELSE '✗ Payment mismatch'
  END as payment_balance,
  total_lines,
  service_lines,
  tax_lines,
  payment_lines,
  CASE 
    WHEN total_lines >= 3 THEN '✓ Has minimum lines (3+)'
    ELSE '✗ Too few lines'
  END as line_count_status
FROM last_pos_balance;

-- =============================================================================
-- 3. Validate smart code patterns across all recent POS data
-- =============================================================================
WITH smart_code_validation AS (
  -- Transaction headers
  SELECT 
    'header' as record_type,
    id,
    smart_code,
    created_at
  FROM universal_transactions
  WHERE transaction_type = 'sale'
    AND smart_code LIKE 'HERA.SALON.POS.%'
    AND created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Transaction lines
  SELECT 
    'line' as record_type,
    utl.id,
    utl.smart_code,
    utl.created_at
  FROM universal_transaction_lines utl
  JOIN universal_transactions ut ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'sale'
    AND ut.smart_code LIKE 'HERA.SALON.POS.%'
    AND ut.created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  record_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN smart_code ~ '\.v[0-9]+$' THEN 1 END) as valid_lowercase_v,
  COUNT(CASE WHEN smart_code ~ '\.V[0-9]+$' THEN 1 END) as invalid_uppercase_v,
  COUNT(CASE WHEN smart_code IS NULL THEN 1 END) as null_smart_codes,
  COUNT(CASE WHEN smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' THEN 1 END) as invalid_pattern,
  ROUND(
    100.0 * COUNT(CASE WHEN smart_code ~ '\.v[0-9]+$' THEN 1 END) / NULLIF(COUNT(*), 0), 
    2
  ) as valid_percentage
FROM smart_code_validation
GROUP BY record_type;

-- =============================================================================
-- 4. Check for specific line types in recent POS transactions
-- =============================================================================
WITH recent_pos_lines AS (
  SELECT 
    ut.transaction_code,
    utl.smart_code,
    utl.line_amount,
    ut.created_at
  FROM universal_transaction_lines utl
  JOIN universal_transactions ut ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'sale'
    AND ut.smart_code LIKE 'HERA.SALON.POS.%'
    AND ut.created_at >= NOW() - INTERVAL '24 hours'
)
SELECT 
  transaction_code,
  COUNT(*) as total_lines,
  COUNT(CASE WHEN smart_code LIKE '%SERVICE%' THEN 1 END) as service_lines,
  COUNT(CASE WHEN smart_code LIKE '%PRODUCT%' THEN 1 END) as product_lines,
  COUNT(CASE WHEN smart_code LIKE '%TAX%' THEN 1 END) as tax_lines,
  COUNT(CASE WHEN smart_code LIKE '%PAYMENT%' THEN 1 END) as payment_lines,
  COUNT(CASE WHEN smart_code LIKE '%DISCOUNT%' THEN 1 END) as discount_lines,
  COUNT(CASE WHEN smart_code LIKE '%TIP%' THEN 1 END) as tip_lines,
  COUNT(CASE WHEN smart_code LIKE '%COMMISSION%' THEN 1 END) as commission_lines,
  SUM(line_amount) as total_amount,
  ROUND(SUM(line_amount), 2) as rounded_balance,
  created_at
FROM recent_pos_lines
GROUP BY transaction_code, created_at
ORDER BY created_at DESC
LIMIT 10;

-- =============================================================================
-- 5. Test case validation: $150 service + 5% tax = $157.50
-- =============================================================================
WITH test_case_transactions AS (
  SELECT 
    ut.id,
    ut.transaction_code,
    ut.total_amount,
    ut.created_at,
    -- Check for service line of exactly $150
    EXISTS (
      SELECT 1 FROM universal_transaction_lines utl
      WHERE utl.transaction_id = ut.id
        AND utl.smart_code LIKE '%SERVICE%'
        AND utl.line_amount = 150
    ) as has_150_service,
    -- Check for tax line of exactly $7.50 (5% of $150)
    EXISTS (
      SELECT 1 FROM universal_transaction_lines utl
      WHERE utl.transaction_id = ut.id
        AND utl.smart_code LIKE '%TAX%'
        AND utl.line_amount = 7.50
    ) as has_750_tax,
    -- Check for payment line of exactly -$157.50
    EXISTS (
      SELECT 1 FROM universal_transaction_lines utl
      WHERE utl.transaction_id = ut.id
        AND utl.smart_code LIKE '%PAYMENT%'
        AND utl.line_amount = -157.50
    ) as has_15750_payment
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'sale'
    AND ut.smart_code LIKE 'HERA.SALON.POS.%'
    AND ut.total_amount = 157.50
    AND ut.created_at >= NOW() - INTERVAL '1 day'
)
SELECT 
  transaction_code,
  total_amount,
  CASE 
    WHEN has_150_service AND has_750_tax AND has_15750_payment 
    THEN '✓ Test case PASSED'
    ELSE '✗ Test case FAILED'
  END as test_result,
  has_150_service as "Has $150 service",
  has_750_tax as "Has $7.50 tax",
  has_15750_payment as "Has -$157.50 payment",
  created_at
FROM test_case_transactions
ORDER BY created_at DESC;

-- =============================================================================
-- 6. Summary dashboard for QA validation
-- =============================================================================
WITH summary_stats AS (
  SELECT 
    COUNT(DISTINCT ut.id) as total_pos_transactions,
    COUNT(DISTINCT CASE WHEN ut.created_at >= NOW() - INTERVAL '24 hours' THEN ut.id END) as last_24h_transactions,
    COUNT(utl.id) as total_pos_lines,
    -- Smart code validation
    COUNT(CASE WHEN ut.smart_code ~ '\.v[0-9]+$' THEN 1 END) as valid_header_codes,
    COUNT(CASE WHEN ut.smart_code ~ '\.V[0-9]+$' THEN 1 END) as invalid_header_codes,
    -- Balance check
    COUNT(DISTINCT CASE 
      WHEN ABS((
        SELECT SUM(l.line_amount) 
        FROM universal_transaction_lines l 
        WHERE l.transaction_id = ut.id
      )) < 0.01 THEN ut.id 
    END) as balanced_transactions,
    -- Recent test case
    COUNT(DISTINCT CASE 
      WHEN ut.total_amount = 157.50 
      AND ut.created_at >= NOW() - INTERVAL '24 hours' 
      THEN ut.id 
    END) as test_case_transactions
  FROM universal_transactions ut
  LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'sale'
    AND ut.smart_code LIKE 'HERA.SALON.POS.%'
    AND ut.created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  '=== POS SMOKE TEST SUMMARY ===' as report_header,
  total_pos_transactions,
  last_24h_transactions,
  total_pos_lines,
  CASE 
    WHEN invalid_header_codes = 0 THEN '✓ All headers use lowercase .V1'
    ELSE '✗ ' || invalid_header_codes || ' headers use uppercase .V1'
  END as header_validation,
  ROUND(100.0 * balanced_transactions / NULLIF(total_pos_transactions, 0), 2) || '%' as balance_rate,
  CASE 
    WHEN test_case_transactions > 0 THEN '✓ Test case found (' || test_case_transactions || ' transactions)'
    ELSE '✗ No test case transactions found'
  END as test_case_status,
  NOW() as report_generated
FROM summary_stats;