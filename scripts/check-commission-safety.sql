-- Safety Check: Find any commission lines created while commissions are disabled
-- This query helps identify any data inconsistencies where commission lines exist
-- for organizations that have commissions disabled

WITH org_commission_settings AS (
  -- Get all organizations with their commission settings
  SELECT 
    id,
    entity_name,
    settings->'salon'->'commissions'->>'enabled' as commissions_enabled,
    COALESCE(
      (settings->'salon'->'commissions'->>'enabled')::boolean, 
      true -- Default to true if not set
    ) as is_enabled
  FROM core_organizations
),
commission_lines AS (
  -- Find all commission-related transaction lines
  SELECT 
    t.organization_id,
    t.id as transaction_id,
    t.transaction_code,
    t.created_at,
    tl.id as line_id,
    tl.smart_code,
    tl.line_amount
  FROM universal_transactions t
  JOIN universal_transaction_lines tl ON t.id = tl.transaction_id
  WHERE tl.smart_code LIKE '%COMMISSION%'
    AND t.transaction_type = 'sale'
)
-- Find commission lines for orgs with disabled commissions
SELECT 
  o.entity_name as organization_name,
  o.commissions_enabled as setting_value,
  cl.transaction_code,
  cl.created_at as transaction_date,
  cl.line_amount as commission_amount,
  COUNT(*) OVER (PARTITION BY o.id) as total_violations
FROM org_commission_settings o
JOIN commission_lines cl ON o.id = cl.organization_id
WHERE o.is_enabled = false
ORDER BY cl.created_at DESC;

-- Summary query to get count by organization
SELECT 
  o.entity_name as organization_name,
  COUNT(DISTINCT cl.transaction_id) as transactions_with_commission,
  COUNT(cl.line_id) as total_commission_lines,
  SUM(cl.line_amount) as total_commission_amount
FROM org_commission_settings o
JOIN commission_lines cl ON o.id = cl.organization_id
WHERE o.is_enabled = false
GROUP BY o.id, o.entity_name
ORDER BY total_commission_lines DESC;