-- POS Operations Quick Queries
-- Fast queries for monitoring and troubleshooting POS operations

-- 1. Today's Per-Branch Balance
SELECT 
  pdh.organization_name,
  pdh.branch_name,
  pdh.transaction_count,
  pdh.revenue,
  pdh.payments,
  pdh.discounts,
  pdh.tips,
  pdh.tax,
  pdh.commissions,
  pdh.net,
  pdh.commission_line_count,
  pdh.commissionsEnabled,
  pdh.has_commission_violation
FROM v_pos_daily_health pdh
WHERE pdh.organization_id = :org_id 
  AND pdh.day::date = CURRENT_DATE
ORDER BY pdh.branch_entity_id;

-- 2. Commission Lines Created While Disabled (Safety Check)
SELECT 
  ut.id,
  ut.transaction_code,
  ut.created_at,
  utl.id as line_id,
  utl.line_number,
  utl.line_amount,
  utl.smart_code,
  o.entity_name as organization_name
FROM universal_transaction_lines utl
JOIN universal_transactions ut ON ut.id = utl.transaction_id
JOIN core_organizations o ON o.id = ut.organization_id
WHERE ut.transaction_type = 'sale'
  AND utl.smart_code LIKE '%COMMISSION%'
  AND COALESCE((o.settings->'salon'->'commissions'->>'enabled')::boolean, true) = false
  AND ut.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ut.created_at DESC;

-- 3. Recent Commission Toggle Events
SELECT 
  ut.created_at as toggle_time,
  ut.metadata->'actor_email' as changed_by,
  ut.metadata->'business_context'->'prev_enabled' as was_enabled,
  ut.metadata->'business_context'->'new_enabled' as now_enabled,
  ut.metadata->'business_context'->'reason' as reason
FROM universal_transactions ut
WHERE ut.smart_code = 'HERA.SALON.ANALYTICS.COMMISSION.TOGGLE.V1'
  AND ut.organization_id = :org_id
ORDER BY ut.created_at DESC
LIMIT 10;

-- 4. Service Lines Missing Stylist (Commission Mode Check)
WITH org_settings AS (
  SELECT 
    id,
    COALESCE((settings->'salon'->'commissions'->>'enabled')::boolean, true) as commissions_enabled
  FROM core_organizations
  WHERE id = :org_id
)
SELECT 
  ut.transaction_code,
  ut.created_at,
  utl.line_number,
  utl.metadata->'entity_name' as service_name,
  utl.metadata->'stylist_name' as stylist_name,
  CASE 
    WHEN utl.metadata->>'stylist_entity_id' IS NULL THEN 'Missing Stylist'
    ELSE 'Has Stylist'
  END as stylist_status
FROM universal_transactions ut
JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
JOIN org_settings o ON o.id = ut.organization_id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'sale'
  AND utl.smart_code LIKE '%SERVICE%'
  AND ut.created_at >= CURRENT_DATE
  AND o.commissions_enabled = true  -- Only check when commissions are enabled
ORDER BY ut.created_at DESC;

-- 5. Daily POS Performance Summary
SELECT 
  date_trunc('day', ut.created_at) as sale_date,
  COUNT(DISTINCT ut.id) as transaction_count,
  COUNT(DISTINCT ut.from_entity_id) as active_branches,
  SUM(ut.total_amount) as total_revenue,
  AVG(ut.total_amount) as avg_transaction,
  MAX(ut.total_amount) as largest_sale,
  COUNT(DISTINCT utl.metadata->>'stylist_entity_id') as active_stylists
FROM universal_transactions ut
LEFT JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'sale'
  AND ut.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date_trunc('day', ut.created_at)
ORDER BY sale_date DESC;

-- 6. Zero-Priced Services (Data Quality Check)
SELECT 
  ut.transaction_code,
  ut.created_at,
  utl.metadata->'entity_name' as service_name,
  utl.unit_price,
  utl.quantity,
  utl.line_amount
FROM universal_transactions ut
JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'sale'
  AND utl.smart_code LIKE '%SERVICE%'
  AND COALESCE(utl.unit_price, 0) = 0
  AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ut.created_at DESC
LIMIT 20;

-- 7. Commission Revenue Impact Analysis
WITH commission_data AS (
  SELECT 
    date_trunc('day', ut.created_at) as day,
    SUM(CASE WHEN utl.smart_code LIKE '%COMMISSION%' THEN ABS(utl.line_amount) ELSE 0 END) as commission_amount,
    SUM(CASE WHEN utl.smart_code LIKE '%SERVICE%' THEN utl.line_amount ELSE 0 END) as service_revenue
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
  WHERE ut.organization_id = :org_id
    AND ut.transaction_type = 'sale'
    AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY date_trunc('day', ut.created_at)
)
SELECT 
  day,
  service_revenue,
  commission_amount,
  CASE 
    WHEN service_revenue > 0 
    THEN ROUND((commission_amount / service_revenue * 100)::numeric, 2)
    ELSE 0
  END as commission_percentage
FROM commission_data
ORDER BY day DESC;