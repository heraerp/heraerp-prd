-- Simple POS Commission Testing Script
-- Run this to verify commission mode behavior

-- 1. Check your organization's commission settings
SELECT 
  id,
  entity_name as organization,
  COALESCE((settings->'salon'->'commissions'->>'enabled')::boolean, true) as commissions_enabled,
  settings->'salon'->'commissions' as commission_settings
FROM core_organizations
WHERE entity_name LIKE '%Hair%' -- Adjust this to match your org
   OR entity_name LIKE '%Salon%'
   OR entity_name LIKE '%Demo%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Recent POS sales with service lines
WITH recent_sales AS (
  SELECT 
    ut.id,
    ut.organization_id,
    ut.transaction_code,
    ut.created_at,
    ut.total_amount
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'sale'
    AND ut.smart_code LIKE '%POS.SALE%'
    AND ut.created_at >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY ut.created_at DESC
  LIMIT 10
)
SELECT 
  rs.transaction_code,
  rs.created_at::date as sale_date,
  rs.created_at::time as sale_time,
  COUNT(*) FILTER (WHERE utl.smart_code LIKE '%SERVICE%') as service_lines,
  COUNT(*) FILTER (WHERE utl.metadata->>'stylist_entity_id' IS NOT NULL) as lines_with_stylist,
  COUNT(*) FILTER (WHERE utl.smart_code LIKE '%COMMISSION%') as commission_lines,
  rs.total_amount
FROM recent_sales rs
JOIN universal_transaction_lines utl ON utl.transaction_id = rs.id
GROUP BY rs.id, rs.transaction_code, rs.created_at, rs.total_amount
ORDER BY rs.created_at DESC;

-- 3. Commission mode violations check
-- (Commission lines created while commissions are disabled)
WITH org_settings AS (
  SELECT 
    id,
    entity_name,
    COALESCE((settings->'salon'->'commissions'->>'enabled')::boolean, true) as commissions_enabled
  FROM core_organizations
)
SELECT 
  os.entity_name as organization,
  os.commissions_enabled,
  ut.transaction_code,
  ut.created_at,
  COUNT(*) as commission_lines_count,
  SUM(ABS(utl.line_amount)) as total_commission_amount
FROM org_settings os
JOIN universal_transactions ut ON ut.organization_id = os.id
JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
WHERE utl.smart_code LIKE '%COMMISSION%'
  AND os.commissions_enabled = false
  AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY os.entity_name, os.commissions_enabled, ut.id, ut.transaction_code, ut.created_at
ORDER BY ut.created_at DESC;

-- 4. Test data summary
SELECT 
  'Total Organizations' as metric,
  COUNT(*)::text as value
FROM core_organizations
UNION ALL
SELECT 
  'Organizations with Commissions OFF',
  COUNT(*)::text
FROM core_organizations
WHERE (settings->'salon'->'commissions'->>'enabled')::boolean = false
UNION ALL
SELECT 
  'POS Sales Today',
  COUNT(*)::text
FROM universal_transactions
WHERE transaction_type = 'sale'
  AND smart_code LIKE '%POS.SALE%'
  AND created_at >= CURRENT_DATE
UNION ALL
SELECT 
  'Sales with Commission Lines',
  COUNT(DISTINCT ut.id)::text
FROM universal_transactions ut
JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
WHERE ut.transaction_type = 'sale'
  AND utl.smart_code LIKE '%COMMISSION%'
  AND ut.created_at >= CURRENT_DATE;