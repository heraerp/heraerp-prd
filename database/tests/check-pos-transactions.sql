-- Check recent POS transactions to verify fixes

-- 1. Show last 10 POS headers with their smart codes and required fields
SELECT 
  id,
  organization_id,
  transaction_type,
  transaction_date,
  total_amount,
  smart_code,
  source_entity_id,
  target_entity_id,
  created_at
FROM universal_transactions
WHERE transaction_type = 'POS_SALE'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Show lines for most recent POS transaction
WITH last_pos AS (
  SELECT id, transaction_code, smart_code, total_amount
  FROM universal_transactions
  WHERE transaction_type = 'POS_SALE'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  utl.line_number,
  utl.line_type,
  utl.line_amount,
  utl.smart_code,
  utl.entity_id,
  utl.description,
  lp.transaction_code as parent_tx_code,
  lp.total_amount as parent_total
FROM universal_transaction_lines utl
JOIN last_pos lp ON utl.transaction_id = lp.id
ORDER BY utl.line_number;

-- 3. Validate smart code patterns in recent POS data
WITH recent_pos AS (
  SELECT 
    'transaction' as record_type,
    smart_code,
    created_at
  FROM universal_transactions
  WHERE transaction_type = 'POS_SALE'
    AND created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  SELECT 
    'line' as record_type,
    utl.smart_code,
    utl.created_at
  FROM universal_transaction_lines utl
  JOIN universal_transactions ut ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'POS_SALE'
    AND ut.created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  record_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN smart_code ~ '\.v[0-9]+$' THEN 1 END) as correct_lowercase_v,
  COUNT(CASE WHEN smart_code ~ '\.V[0-9]+$' THEN 1 END) as incorrect_uppercase_v,
  COUNT(CASE WHEN smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' THEN 1 END) as invalid_pattern
FROM recent_pos
GROUP BY record_type;

-- 4. Show any POS transactions with invalid smart codes
SELECT 
  'transaction' as record_type,
  id,
  smart_code,
  transaction_type,
  created_at
FROM universal_transactions
WHERE transaction_type = 'POS_SALE'
  AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  AND created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'line' as record_type,
  utl.id,
  utl.smart_code,
  ut.transaction_type,
  utl.created_at
FROM universal_transaction_lines utl
JOIN universal_transactions ut ON ut.id = utl.transaction_id
WHERE ut.transaction_type = 'POS_SALE'
  AND utl.smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  AND ut.created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Summary of line balancing for recent POS transactions
WITH pos_balance AS (
  SELECT 
    ut.id,
    ut.transaction_code,
    ut.total_amount as header_total,
    SUM(utl.line_amount) as lines_total,
    COUNT(utl.id) as line_count,
    ut.created_at
  FROM universal_transactions ut
  LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'POS_SALE'
    AND ut.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY ut.id, ut.transaction_code, ut.total_amount, ut.created_at
)
SELECT 
  transaction_code,
  header_total,
  lines_total,
  line_count,
  ROUND(ABS(COALESCE(lines_total, 0)), 2) as abs_balance,
  CASE 
    WHEN ABS(COALESCE(lines_total, 0)) < 0.01 THEN 'BALANCED ✓'
    ELSE 'UNBALANCED ✗'
  END as status,
  created_at
FROM pos_balance
ORDER BY created_at DESC
LIMIT 10;